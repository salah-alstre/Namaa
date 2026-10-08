import { db, bool, num, numOrNull, str, parseJson, type Row } from '../index';
import type { L10n } from '@/types';
import type { SrsCard } from '@/english-engine/srs';
import type { EnLevel, EnSkill, Exercise } from '@/english-engine/types';
import { pushRecent, skillMastery } from '@/english-engine/progress';

// ───────── lessons ─────────

export interface EnLessonRow {
  lessonId: string;
  status: 'started' | 'completed';
  step: number;
  stars: number;
  startedAt: number;
  completedAt: number | null;
  lastOpened: number;
}

const toLesson = (r: Row): EnLessonRow => ({
  lessonId: str(r.lesson_id),
  status: str(r.status) === 'completed' ? 'completed' : 'started',
  step: num(r.step),
  stars: num(r.stars),
  startedAt: num(r.started_at),
  completedAt: numOrNull(r.completed_at),
  lastOpened: num(r.last_opened),
});

export async function loadEnLessons(): Promise<Record<string, EnLessonRow>> {
  const rows = await db().query('SELECT * FROM english_lesson_progress');
  return Object.fromEntries(rows.map((r) => [str(r.lesson_id), toLesson(r)]));
}

export async function touchEnLesson(lessonId: string, step: number): Promise<void> {
  const now = Date.now();
  await db().execute(
    `INSERT INTO english_lesson_progress (lesson_id, status, step, started_at, last_opened) VALUES (?, 'started', ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET last_opened = excluded.last_opened,
       step = CASE WHEN english_lesson_progress.status = 'completed' THEN english_lesson_progress.step ELSE excluded.step END`,
    [lessonId, step, now, now],
  );
}

/** Marks a lesson completed; keeps the best star count. Returns true the first time. */
export async function completeEnLesson(lessonId: string, stars: number): Promise<boolean> {
  const now = Date.now();
  const before = await db().query('SELECT status FROM english_lesson_progress WHERE lesson_id = ?', [lessonId]);
  const was = str(before[0]?.status) === 'completed';
  await db().execute(
    `INSERT INTO english_lesson_progress (lesson_id, status, step, stars, started_at, completed_at, last_opened) VALUES (?, 'completed', 0, ?, ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET status = 'completed', stars = MAX(english_lesson_progress.stars, excluded.stars),
       completed_at = COALESCE(english_lesson_progress.completed_at, excluded.completed_at), last_opened = excluded.last_opened`,
    [lessonId, stars, now, now, now],
  );
  return !was;
}

// ───────── vocabulary (SRS state) ─────────

export interface EnVocabRow extends SrsCard {
  wordId: string;
  lastReviewed: number | null;
  seen: number;
  correct: number;
  favorite: boolean;
  difficult: boolean;
  source: string;
  addedAt: number;
}

const toVocab = (r: Row): EnVocabRow => ({
  wordId: str(r.word_id),
  state: str(r.state) === 'review' ? 'review' : 'learning',
  reps: num(r.reps),
  lapses: num(r.lapses),
  intervalDays: num(r.interval_days),
  ease: num(r.ease) || 2.5,
  dueAt: num(r.due_at),
  lastReviewed: numOrNull(r.last_reviewed),
  seen: num(r.seen),
  correct: num(r.correct),
  favorite: bool(r.favorite),
  difficult: bool(r.difficult),
  source: str(r.source),
  addedAt: num(r.added_at),
});

export async function loadEnVocab(): Promise<Record<string, EnVocabRow>> {
  const rows = await db().query('SELECT * FROM english_vocab');
  return Object.fromEntries(rows.map((r) => [str(r.word_id), toVocab(r)]));
}

/** Adds words to the review queue (due now). Existing words are left untouched. Returns how many were new. */
export async function addEnWords(wordIds: string[], source: string): Promise<number> {
  if (wordIds.length === 0) return 0;
  const now = Date.now();
  const res = await db().batch(
    wordIds.map((id) => ({
      sql: 'INSERT INTO english_vocab (word_id, due_at, source, added_at) VALUES (?, ?, ?, ?) ON CONFLICT(word_id) DO NOTHING',
      params: [id, now, source, now],
    })),
  );
  return res.reduce((a, r) => a + r.changes, 0);
}

export async function saveEnReview(wordId: string, card: SrsCard, correct: boolean): Promise<void> {
  const now = Date.now();
  await db().execute(
    `INSERT INTO english_vocab (word_id, state, reps, lapses, interval_days, ease, due_at, last_reviewed, seen, correct, source, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'review', ?)
     ON CONFLICT(word_id) DO UPDATE SET state = excluded.state, reps = excluded.reps, lapses = excluded.lapses,
       interval_days = excluded.interval_days, ease = excluded.ease, due_at = excluded.due_at, last_reviewed = excluded.last_reviewed,
       seen = english_vocab.seen + 1, correct = english_vocab.correct + excluded.correct`,
    [wordId, card.state, card.reps, card.lapses, card.intervalDays, card.ease, card.dueAt, now, correct ? 1 : 0, now],
  );
}

export async function setEnWordFlag(wordId: string, flag: 'favorite' | 'difficult', on: boolean): Promise<void> {
  const col = flag === 'favorite' ? 'favorite' : 'difficult';
  const now = Date.now();
  await db().execute(
    `INSERT INTO english_vocab (word_id, due_at, source, added_at, ${col}) VALUES (?, ?, 'manual', ?, ?)
     ON CONFLICT(word_id) DO UPDATE SET ${col} = excluded.${col}`,
    [wordId, now, now, on ? 1 : 0],
  );
}

// ───────── attempts & skill progress ─────────

export interface EnAttemptInput {
  exercise: Pick<Exercise, 'id' | 'kind' | 'skill'> & { ref?: string };
  correct: boolean;
  answer: string;
  timeMs: number;
}

export async function recordEnAttempt(a: EnAttemptInput): Promise<void> {
  const now = Date.now();
  const skill = a.exercise.skill;
  await db().execute(
    'INSERT INTO english_attempts (exercise_id, kind, skill, ref_id, correct, answer, time_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [a.exercise.id, a.exercise.kind, skill, a.exercise.ref ?? '', a.correct ? 1 : 0, a.answer.slice(0, 500), Math.round(a.timeMs), now],
  );
  const rows = await db().query('SELECT * FROM english_skill_progress WHERE skill = ?', [skill]);
  const prev = rows[0];
  const attempts = num(prev?.attempts) + 1;
  const correct = num(prev?.correct) + (a.correct ? 1 : 0);
  const recentArr = pushRecent(
    str(prev?.recent)
      .split('')
      .filter((c) => c === '0' || c === '1')
      .map(Number),
    a.correct,
  );
  await db().execute(
    `INSERT INTO english_skill_progress (skill, mastery, attempts, correct, recent, last_practiced) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(skill) DO UPDATE SET mastery = excluded.mastery, attempts = excluded.attempts, correct = excluded.correct,
       recent = excluded.recent, last_practiced = excluded.last_practiced`,
    [skill, skillMastery(attempts, correct, recentArr), attempts, correct, recentArr.join(''), now],
  );
}

export interface EnSkillRow {
  skill: EnSkill;
  mastery: number;
  attempts: number;
  correct: number;
  lastPracticed: number | null;
}

export async function loadEnSkills(): Promise<Record<string, EnSkillRow>> {
  const rows = await db().query('SELECT * FROM english_skill_progress');
  return Object.fromEntries(
    rows.map((r) => [
      str(r.skill),
      { skill: str(r.skill) as EnSkill, mastery: num(r.mastery), attempts: num(r.attempts), correct: num(r.correct), lastPracticed: numOrNull(r.last_practiced) },
    ]),
  );
}

export async function enAttemptTotals(): Promise<{ total: number; correct: number; today: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await db().query(
    'SELECT COUNT(*) AS n, COALESCE(SUM(correct),0) AS c, COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END),0) AS t FROM english_attempts',
    [start.getTime()],
  );
  return { total: num(rows[0]?.n), correct: num(rows[0]?.c), today: num(rows[0]?.t) };
}

// ───────── mistakes ─────────

export interface EnMistake {
  id: number;
  exerciseId: string;
  kind: string;
  skill: EnSkill;
  patternId: string;
  refId: string;
  prompt: string;
  given: string;
  expected: string;
  explanation: L10n | null;
  understood: boolean;
  timesWrong: number;
  createdAt: number;
  updatedAt: number;
}

const toMistake = (r: Row): EnMistake => ({
  id: num(r.id),
  exerciseId: str(r.exercise_id),
  kind: str(r.kind),
  skill: str(r.skill) as EnSkill,
  patternId: str(r.pattern_id),
  refId: str(r.ref_id),
  prompt: str(r.prompt),
  given: str(r.given),
  expected: str(r.expected),
  explanation: parseJson<L10n | null>(r.explanation, null),
  understood: str(r.status) === 'understood',
  timesWrong: num(r.times_wrong),
  createdAt: num(r.created_at),
  updatedAt: num(r.updated_at),
});

export async function loadEnMistakes(): Promise<EnMistake[]> {
  return (await db().query('SELECT * FROM english_mistakes ORDER BY updated_at DESC')).map(toMistake);
}

export interface EnMistakeInput {
  exerciseId: string;
  kind: string;
  skill: EnSkill;
  patternId?: string;
  refId?: string;
  prompt: string;
  given: string;
  expected: string;
  explanation?: L10n | null;
}

/** One row per exercise: a repeat miss bumps the counter and re-opens it. */
export async function saveEnMistake(m: EnMistakeInput): Promise<void> {
  const now = Date.now();
  await db().execute(
    `INSERT INTO english_mistakes (exercise_id, kind, skill, pattern_id, ref_id, prompt, given, expected, explanation, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET given = excluded.given, status = 'open', times_wrong = english_mistakes.times_wrong + 1,
       updated_at = excluded.updated_at`,
    [m.exerciseId, m.kind, m.skill, m.patternId ?? '', m.refId ?? '', m.prompt, m.given.slice(0, 300), m.expected, m.explanation ? JSON.stringify(m.explanation) : '', now, now],
  );
}

export async function markEnMistakeUnderstood(exerciseId: string, understood: boolean): Promise<void> {
  await db().execute('UPDATE english_mistakes SET status = ?, updated_at = ? WHERE exercise_id = ?', [understood ? 'understood' : 'open', Date.now(), exerciseId]);
}

// ───────── placement ─────────

export interface EnPlacementRow {
  id: number;
  level: EnLevel;
  score: number;
  total: number;
  correct: number;
  createdAt: number;
}

export async function saveEnPlacement(level: EnLevel, score: number, total: number, correct: number, detail: unknown): Promise<void> {
  await db().execute('INSERT INTO english_placement (level, score, total, correct, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
    level, score, total, correct, JSON.stringify(detail ?? {}), Date.now(),
  ]);
}

export async function loadEnPlacements(): Promise<EnPlacementRow[]> {
  return (await db().query('SELECT * FROM english_placement ORDER BY created_at DESC')).map((r) => ({
    id: num(r.id), level: str(r.level) as EnLevel, score: num(r.score), total: num(r.total), correct: num(r.correct), createdAt: num(r.created_at),
  }));
}

// ───────── writing & speaking ─────────

export interface EnWritingRow {
  id: number;
  promptId: string;
  body: string;
  checks: { label: string; ok: boolean }[];
  createdAt: number;
}

export async function saveEnWriting(promptId: string, body: string, checks: { label: string; ok: boolean }[]): Promise<void> {
  await db().execute('INSERT INTO english_writing (prompt_id, body, checks_json, created_at) VALUES (?, ?, ?, ?)', [promptId, body, JSON.stringify(checks), Date.now()]);
}

export async function loadEnWriting(): Promise<EnWritingRow[]> {
  return (await db().query('SELECT * FROM english_writing ORDER BY created_at DESC')).map((r) => ({
    id: num(r.id), promptId: str(r.prompt_id), body: str(r.body), checks: parseJson(r.checks_json, []), createdAt: num(r.created_at),
  }));
}

export async function saveEnSpeaking(phraseId: string, rating: 1 | 2 | 3): Promise<void> {
  await db().execute('INSERT INTO english_speaking (phrase_id, rating, created_at) VALUES (?, ?, ?)', [phraseId, rating, Date.now()]);
}

/** Latest self-rating per phrase. */
export async function loadEnSpeaking(): Promise<Record<string, number>> {
  const rows = await db().query('SELECT phrase_id, rating FROM english_speaking ORDER BY created_at ASC, id ASC');
  const out: Record<string, number> = {};
  for (const r of rows) out[str(r.phrase_id)] = num(r.rating);
  return out;
}

// ───────── bookmarks ─────────

export async function loadEnBookmarks(): Promise<Record<string, string>> {
  const rows = await db().query('SELECT kind, ref_id, state FROM english_bookmarks');
  return Object.fromEntries(rows.map((r) => [`${str(r.kind)}:${str(r.ref_id)}`, str(r.state)]));
}

export async function setEnBookmark(kind: string, refId: string, state: 'saved' | 'done' | null): Promise<void> {
  if (state === null) {
    await db().execute('DELETE FROM english_bookmarks WHERE kind = ? AND ref_id = ?', [kind, refId]);
    return;
  }
  await db().execute(
    'INSERT INTO english_bookmarks (kind, ref_id, state, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(kind, ref_id) DO UPDATE SET state = excluded.state',
    [kind, refId, state, Date.now()],
  );
}

// ───────── xp split ─────────

/** Total XP earned through English (reason prefix `english:`). Math XP = total − this. */
export async function englishXp(): Promise<number> {
  const rows = await db().query("SELECT COALESCE(SUM(amount),0) AS s FROM xp_events WHERE reason LIKE 'english:%'");
  return num(rows[0]?.s);
}

/** English minutes/xp per day, for goals and charts. */
export async function englishXpByDay(sinceMs: number): Promise<{ day: string; xp: number }[]> {
  const rows = await db().query(
    "SELECT created_at, amount FROM xp_events WHERE reason LIKE 'english:%' AND created_at >= ?",
    [sinceMs],
  );
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(num(r.created_at));
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map.set(k, (map.get(k) ?? 0) + num(r.amount));
  }
  return [...map.entries()].map(([day, xp]) => ({ day, xp }));
}

/** Words reviewed (any grade) since local midnight. */
export async function enReviewedToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const rows = await db().query('SELECT COUNT(*) AS n FROM english_vocab WHERE last_reviewed >= ?', [start.getTime()]);
  return num(rows[0]?.n);
}
