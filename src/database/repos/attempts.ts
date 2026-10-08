import { db, bool, num, numOrNull, parseJson, str, type Row, type Stmt } from '../index';
import type { AttemptRow, Difficulty, MistakeRow, Question, SessionMode, TopicProgress, UserAnswer, Verdict } from '@/types';
import { correctKey, userKey } from '@/math-engine/validate';
import { computeMastery } from '@/domain/mastery';
import { nextDifficulty } from '@/domain/adaptive';
import { questionXp } from '@/domain/xp';
import { dayKey } from '@/lib/dates';
import { ADD_XP_SQL, BUMP_ACTIVITY_SQL, UPSERT_TOPIC_SQL, topicParams } from './progress';

const RECENT_KEEP = 30;

// ───────── sessions ─────────

export async function startSession(mode: SessionMode, topicId: string | null, difficulty: number | null, planned: number | null): Promise<number> {
  const res = await db().execute('INSERT INTO sessions (mode, topic_id, difficulty, planned, started_at) VALUES (?, ?, ?, ?, ?)', [
    mode,
    topicId,
    difficulty,
    planned,
    Date.now(),
  ]);
  return res.last_insert_id;
}

export async function endSession(id: number): Promise<void> {
  await db().execute('UPDATE sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL', [Date.now(), id]);
}

export interface SessionSummary {
  id: number;
  mode: SessionMode;
  topicId: string | null;
  total: number;
  correct: number;
  xp: number;
  at: number;
}

/** Finished sessions that had at least one answer, newest first. */
export async function recentSessions(limit = 8): Promise<SessionSummary[]> {
  const rows = await db().query('SELECT id, mode, topic_id, total, correct, xp, COALESCE(ended_at, started_at) AS at FROM sessions WHERE total > 0 ORDER BY at DESC LIMIT ?', [limit]);
  return rows.map((r) => ({
    id: num(r.id),
    mode: str(r.mode) as SessionMode,
    topicId: r.topic_id == null ? null : str(r.topic_id),
    total: num(r.total),
    correct: num(r.correct),
    xp: num(r.xp),
    at: num(r.at),
  }));
}

// ───────── recording an answer ─────────

export interface AttemptInput {
  question: Question;
  answer: UserAnswer | null;
  verdict: Verdict;
  hintsUsed: number;
  timeMs: number;
  sessionId?: number | null;
  examId?: number | null;
  /** Current progress row for the topic (undefined when the topic has never been practised). */
  topic: TopicProgress | undefined;
  lessonDone: boolean;
  /** Does the answer move the adaptive difficulty? (off for exams/placement, or when the setting is off) */
  adaptive: boolean;
  /** XP is not awarded for exam questions (the exam awards XP at the end). */
  awardXp: boolean;
  /** Save wrong answers to My Mistakes. */
  saveMistake: boolean;
  /** When replaying a saved mistake, its id so that the row is updated instead of duplicated. */
  mistakeId?: number | null;
}

export interface AttemptOutcome {
  xp: number;
  topic: TopicProgress;
  mastery: { before: number; after: number };
}

export async function recordAttempt(input: AttemptInput): Promise<AttemptOutcome> {
  const { question: q, verdict, hintsUsed, timeMs } = input;
  const now = Date.now();
  const correct = verdict.correct;
  const xp = input.awardXp ? questionXp(q.difficulty, correct, hintsUsed) : 0;

  const prev: TopicProgress = input.topic ?? {
    topicId: q.topicId,
    mastery: 0,
    attempts: 0,
    correct: 0,
    recent: '',
    difficulty: 2,
    lastPracticed: null,
    totalTimeMs: 0,
  };
  const next: TopicProgress = {
    ...prev,
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    recent: (prev.recent + (correct ? '1' : '0')).slice(-RECENT_KEEP),
    difficulty: input.adaptive ? nextDifficulty(prev.difficulty, correct, hintsUsed) : prev.difficulty,
    lastPracticed: now,
    totalTimeMs: prev.totalTimeMs + Math.max(0, timeMs),
  };
  next.mastery = computeMastery({ ...next, lessonDone: input.lessonDone }, now);

  const userText = userKey(input.answer) ?? (typeof input.answer === 'string' ? input.answer : null);
  const stmts: Stmt[] = [
    {
      sql: `INSERT INTO attempts (session_id, exam_id, topic_id, generator_id, qtype, difficulty, user_answer, correct_answer, is_correct, hints_used, time_ms, xp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        input.sessionId ?? null,
        input.examId ?? null,
        q.topicId,
        q.generatorId,
        q.qtype,
        q.difficulty,
        userText,
        correctKey(q.answer),
        correct ? 1 : 0,
        hintsUsed,
        Math.max(0, Math.round(timeMs)),
        xp,
        now,
      ],
    },
    { sql: UPSERT_TOPIC_SQL, params: topicParams(next) },
    { sql: BUMP_ACTIVITY_SQL, params: [dayKey(now), xp, 1, correct ? 1 : 0, 0, Math.max(0, timeMs) / 60000] },
  ];
  if (xp > 0) stmts.push({ sql: ADD_XP_SQL, params: [xp, 'question', now] });
  if (input.sessionId) {
    stmts.push({ sql: 'UPDATE sessions SET total = total + 1, correct = correct + ?, xp = xp + ? WHERE id = ?', params: [correct ? 1 : 0, xp, input.sessionId] });
  }

  if (input.mistakeId) {
    // Replaying a saved mistake: right → understood, wrong → counts against it again.
    stmts.push({
      sql: correct
        ? 'UPDATE mistakes SET times_retried = times_retried + 1, understood = 1, last_seen = ? WHERE id = ?'
        : 'UPDATE mistakes SET times_retried = times_retried + 1, times_wrong = times_wrong + 1, understood = 0, last_seen = ? WHERE id = ?',
      params: [now, input.mistakeId],
    });
  } else if (!correct && input.saveMistake) {
    const existing = await db().query<{ id: number }>(
      `SELECT id FROM mistakes WHERE generator_id = ? AND json_extract(question_json, '$.id') = ? LIMIT 1`,
      [q.generatorId, q.id],
    );
    if (existing[0]) {
      stmts.push({
        sql: 'UPDATE mistakes SET times_wrong = times_wrong + 1, understood = 0, last_seen = ?, user_answer = ?, pattern_id = COALESCE(?, pattern_id) WHERE id = ?',
        params: [now, userText, verdict.patternId ?? null, existing[0].id],
      });
    } else {
      stmts.push({
        sql: `INSERT INTO mistakes (topic_id, generator_id, qtype, difficulty, question_json, user_answer, correct_answer, pattern_id, created_at, last_seen)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [q.topicId, q.generatorId, q.qtype, q.difficulty, JSON.stringify(q), userText, correctKey(q.answer), verdict.patternId ?? null, now, now],
      });
    }
  }

  await db().batch(stmts);
  return { xp, topic: next, mastery: { before: prev.mastery, after: next.mastery } };
}

/** Recomputes mastery for a topic after a lesson is completed (the lesson adds a bonus). */
export async function refreshTopicMastery(topic: TopicProgress, lessonDone: boolean): Promise<TopicProgress> {
  const next = { ...topic, mastery: computeMastery({ ...topic, lessonDone }) };
  await db().execute(UPSERT_TOPIC_SQL, topicParams(next));
  return next;
}

// ───────── reading attempts ─────────

function toAttempt(r: Row): AttemptRow {
  return {
    id: num(r.id),
    sessionId: numOrNull(r.session_id),
    examId: numOrNull(r.exam_id),
    topicId: str(r.topic_id),
    generatorId: str(r.generator_id),
    qtype: str(r.qtype) as AttemptRow['qtype'],
    difficulty: num(r.difficulty) as Difficulty,
    userAnswer: r.user_answer === null || r.user_answer === undefined ? null : str(r.user_answer),
    correctAnswer: str(r.correct_answer),
    isCorrect: bool(r.is_correct),
    hintsUsed: num(r.hints_used),
    timeMs: num(r.time_ms),
    xp: num(r.xp),
    createdAt: num(r.created_at),
  };
}

export async function loadRecentAttempts(limit = 200): Promise<AttemptRow[]> {
  return (await db().query('SELECT * FROM attempts ORDER BY id DESC LIMIT ?', [limit])).map(toAttempt);
}

export interface AttemptAggregate {
  total: number;
  correct: number;
  timeMs: number;
}

export async function attemptTotals(): Promise<AttemptAggregate> {
  const r = await db().query('SELECT COUNT(*) AS n, COALESCE(SUM(is_correct), 0) AS c, COALESCE(SUM(time_ms), 0) AS t FROM attempts');
  return { total: num(r[0]?.n), correct: num(r[0]?.c), timeMs: num(r[0]?.t) };
}

export interface DifficultyStat {
  difficulty: number;
  total: number;
  correct: number;
}

export async function difficultyStats(): Promise<DifficultyStat[]> {
  const rows = await db().query('SELECT difficulty, COUNT(*) AS n, SUM(is_correct) AS c FROM attempts GROUP BY difficulty ORDER BY difficulty');
  return rows.map((r) => ({ difficulty: num(r.difficulty), total: num(r.n), correct: num(r.c) }));
}

export interface TypeStat {
  qtype: string;
  total: number;
  correct: number;
}

export async function typeStats(): Promise<TypeStat[]> {
  const rows = await db().query('SELECT qtype, COUNT(*) AS n, SUM(is_correct) AS c FROM attempts GROUP BY qtype');
  return rows.map((r) => ({ qtype: str(r.qtype), total: num(r.n), correct: num(r.c) }));
}

/** Counts used by achievements. */
export async function achievementCounters(): Promise<{ sessions: number; perfectSessions: number; fastCorrect: number; noHintStreakBest: number; timedCorrect: number }> {
  const s = await db().query("SELECT COUNT(*) AS n FROM sessions WHERE ended_at IS NOT NULL AND total >= 5");
  const p = await db().query("SELECT COUNT(*) AS n FROM sessions WHERE ended_at IS NOT NULL AND total >= 5 AND correct = total");
  const f = await db().query('SELECT COUNT(*) AS n FROM attempts WHERE is_correct = 1 AND time_ms > 0 AND time_ms < 4000');
  const rows = await db().query('SELECT is_correct, hints_used FROM attempts ORDER BY id');
  let run = 0;
  let best = 0;
  for (const r of rows) {
    if (bool(r.is_correct) && num(r.hints_used) === 0) {
      run++;
      if (run > best) best = run;
    } else run = 0;
  }
  const t = await db().query("SELECT COALESCE(SUM(correct), 0) AS n FROM sessions WHERE mode = 'timed'");
  return { sessions: num(s[0]?.n), perfectSessions: num(p[0]?.n), fastCorrect: num(f[0]?.n), noHintStreakBest: best, timedCorrect: num(t[0]?.n) };
}

// ───────── mistakes ─────────

function toMistake(r: Row): MistakeRow {
  return {
    id: num(r.id),
    topicId: str(r.topic_id),
    generatorId: str(r.generator_id),
    qtype: str(r.qtype) as MistakeRow['qtype'],
    difficulty: num(r.difficulty) as Difficulty,
    question: parseJson<Question>(r.question_json, null as unknown as Question),
    userAnswer: r.user_answer === null || r.user_answer === undefined ? null : str(r.user_answer),
    correctAnswer: str(r.correct_answer),
    patternId: r.pattern_id === null || r.pattern_id === undefined ? null : str(r.pattern_id),
    timesWrong: num(r.times_wrong),
    timesRetried: num(r.times_retried),
    understood: bool(r.understood),
    favorite: bool(r.favorite),
    createdAt: num(r.created_at),
    lastSeen: num(r.last_seen),
  };
}

export async function loadMistakes(): Promise<MistakeRow[]> {
  return (await db().query('SELECT * FROM mistakes ORDER BY last_seen DESC')).map(toMistake).filter((m) => m.question);
}

export async function setMistakeFlag(id: number, field: 'understood' | 'favorite', on: boolean): Promise<void> {
  const col = field === 'understood' ? 'understood' : 'favorite';
  await db().execute(`UPDATE mistakes SET ${col} = ? WHERE id = ?`, [on ? 1 : 0, id]);
}

export async function deleteMistake(id: number): Promise<void> {
  await db().execute('DELETE FROM mistakes WHERE id = ?', [id]);
}

export async function clearUnderstoodMistakes(): Promise<number> {
  const r = await db().execute('DELETE FROM mistakes WHERE understood = 1');
  return r.changes;
}

/** Saves a wrong answer the learner chose to keep ("Save for Review"), when it was not saved automatically. */
export async function saveMistakeManually(q: Question, userAnswer: string | null, patternId: string | null): Promise<void> {
  const existing = await db().query(`SELECT id FROM mistakes WHERE generator_id = ? AND json_extract(question_json, '$.id') = ? LIMIT 1`, [q.generatorId, q.id]);
  const now = Date.now();
  if (existing[0]) {
    await db().execute('UPDATE mistakes SET favorite = 1, understood = 0, last_seen = ? WHERE id = ?', [now, num(existing[0].id)]);
    return;
  }
  await db().execute(
    `INSERT INTO mistakes (topic_id, generator_id, qtype, difficulty, question_json, user_answer, correct_answer, pattern_id, favorite, created_at, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [q.topicId, q.generatorId, q.qtype, q.difficulty, JSON.stringify(q), userAnswer, correctKey(q.answer), patternId, now, now],
  );
}
