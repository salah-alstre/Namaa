import { db, bool, num, numOrNull, str, type Row } from '../index';
import type { ActivityDay, DailyChallengeRow, LessonProgress, TopicProgress } from '@/types';
import { dayKey } from '@/lib/dates';

// ───────── topics ─────────

export function toTopicProgress(r: Row): TopicProgress {
  return {
    topicId: str(r.topic_id),
    mastery: num(r.mastery),
    attempts: num(r.attempts),
    correct: num(r.correct),
    recent: str(r.recent),
    difficulty: num(r.difficulty) || 2,
    lastPracticed: numOrNull(r.last_practiced),
    totalTimeMs: num(r.total_time_ms),
  };
}

export async function loadTopicProgress(): Promise<Record<string, TopicProgress>> {
  const rows = await db().query('SELECT * FROM topic_progress');
  const out: Record<string, TopicProgress> = {};
  for (const r of rows) {
    const t = toTopicProgress(r);
    out[t.topicId] = t;
  }
  return out;
}

export const UPSERT_TOPIC_SQL = `INSERT INTO topic_progress (topic_id, mastery, attempts, correct, recent, difficulty, last_practiced, total_time_ms)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(topic_id) DO UPDATE SET mastery = excluded.mastery, attempts = excluded.attempts, correct = excluded.correct,
  recent = excluded.recent, difficulty = excluded.difficulty, last_practiced = excluded.last_practiced, total_time_ms = excluded.total_time_ms`;

export function topicParams(t: TopicProgress): (string | number | null)[] {
  return [t.topicId, t.mastery, t.attempts, t.correct, t.recent, t.difficulty, t.lastPracticed, t.totalTimeMs];
}

export async function seedTopicDifficulty(topicIds: string[], difficulty: number): Promise<void> {
  await db().batch(
    topicIds.map((id) => ({
      sql: 'INSERT INTO topic_progress (topic_id, difficulty) VALUES (?, ?) ON CONFLICT(topic_id) DO NOTHING',
      params: [id, difficulty],
    })),
  );
}

// ───────── lessons ─────────

function toLesson(r: Row): LessonProgress {
  return {
    lessonId: str(r.lesson_id),
    status: str(r.status) === 'completed' ? 'completed' : 'started',
    step: num(r.step),
    stars: num(r.stars),
    startedAt: num(r.started_at),
    completedAt: numOrNull(r.completed_at),
    lastOpened: num(r.last_opened),
  };
}

export async function loadLessonProgress(): Promise<Record<string, LessonProgress>> {
  const rows = await db().query('SELECT * FROM lesson_progress');
  const out: Record<string, LessonProgress> = {};
  for (const r of rows) {
    const l = toLesson(r);
    out[l.lessonId] = l;
  }
  return out;
}

export async function touchLesson(lessonId: string, step: number): Promise<void> {
  const now = Date.now();
  await db().execute(
    `INSERT INTO lesson_progress (lesson_id, status, step, started_at, last_opened) VALUES (?, 'started', ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET last_opened = excluded.last_opened,
       step = CASE WHEN lesson_progress.status = 'completed' THEN lesson_progress.step ELSE excluded.step END`,
    [lessonId, step, now, now],
  );
}

/** Marks a lesson completed; keeps the best star count. */
export async function completeLesson(lessonId: string, stars: number): Promise<void> {
  const now = Date.now();
  await db().execute(
    `INSERT INTO lesson_progress (lesson_id, status, step, stars, started_at, completed_at, last_opened) VALUES (?, 'completed', 0, ?, ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET status = 'completed', stars = MAX(lesson_progress.stars, excluded.stars),
       completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at), last_opened = excluded.last_opened`,
    [lessonId, stars, now, now, now],
  );
}

// ───────── activity ─────────

function toActivity(r: Row): ActivityDay {
  return {
    day: str(r.day),
    xp: num(r.xp),
    questions: num(r.questions),
    correct: num(r.correct),
    lessons: num(r.lessons),
    minutes: num(r.minutes),
  };
}

export async function loadActivity(): Promise<ActivityDay[]> {
  return (await db().query('SELECT * FROM activity_days ORDER BY day')).map(toActivity);
}

export const BUMP_ACTIVITY_SQL = `INSERT INTO activity_days (day, xp, questions, correct, lessons, minutes) VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(day) DO UPDATE SET xp = activity_days.xp + excluded.xp, questions = activity_days.questions + excluded.questions,
  correct = activity_days.correct + excluded.correct, lessons = activity_days.lessons + excluded.lessons,
  minutes = activity_days.minutes + excluded.minutes`;

export async function bumpActivity(d: Partial<Omit<ActivityDay, 'day'>>, day: string = dayKey()): Promise<void> {
  await db().execute(BUMP_ACTIVITY_SQL, [day, d.xp ?? 0, d.questions ?? 0, d.correct ?? 0, d.lessons ?? 0, d.minutes ?? 0]);
}

// ───────── xp ─────────

export async function totalXp(): Promise<number> {
  const rows = await db().query<{ s: number | null }>('SELECT COALESCE(SUM(amount), 0) AS s FROM xp_events');
  return num(rows[0]?.s);
}

export const ADD_XP_SQL = 'INSERT INTO xp_events (amount, reason, created_at) VALUES (?, ?, ?)';

export async function addXp(amount: number, reason: string): Promise<void> {
  if (amount === 0) return;
  await db().execute(ADD_XP_SQL, [amount, reason, Date.now()]);
}

// ───────── achievements & favorites ─────────

export async function loadAchievements(): Promise<Record<string, number>> {
  const rows = await db().query<{ id: string; unlocked_at: number }>('SELECT id, unlocked_at FROM achievements');
  return Object.fromEntries(rows.map((r) => [r.id, num(r.unlocked_at)]));
}

export async function unlockAchievement(id: string, xp: number): Promise<boolean> {
  const res = await db().execute('INSERT INTO achievements (id, unlocked_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING', [id, Date.now()]);
  if (res.changes > 0 && xp > 0) await addXp(xp, `achievement:${id}`);
  return res.changes > 0;
}

export async function loadFavoriteFormulas(): Promise<string[]> {
  const rows = await db().query<{ formula_id: string }>('SELECT formula_id FROM formula_favorites ORDER BY created_at');
  return rows.map((r) => r.formula_id);
}

export async function setFormulaFavorite(id: string, on: boolean): Promise<void> {
  if (on) await db().execute('INSERT INTO formula_favorites (formula_id, created_at) VALUES (?, ?) ON CONFLICT DO NOTHING', [id, Date.now()]);
  else await db().execute('DELETE FROM formula_favorites WHERE formula_id = ?', [id]);
}

// ───────── daily challenge ─────────

function toDaily(r: Row): DailyChallengeRow {
  return {
    day: str(r.day),
    seed: num(r.seed),
    completed: bool(r.completed),
    score: num(r.score),
    total: num(r.total),
    completedAt: numOrNull(r.completed_at),
  };
}

export async function loadDailyChallenges(): Promise<DailyChallengeRow[]> {
  return (await db().query('SELECT * FROM daily_challenges ORDER BY day DESC')).map(toDaily);
}

export async function saveDailyChallenge(day: string, seed: number): Promise<void> {
  await db().execute('INSERT INTO daily_challenges (day, seed) VALUES (?, ?) ON CONFLICT(day) DO NOTHING', [day, seed]);
}

export async function completeDailyChallenge(day: string, score: number, total: number): Promise<void> {
  await db().execute('UPDATE daily_challenges SET completed = 1, score = ?, total = ?, completed_at = ? WHERE day = ? AND completed = 0', [
    score,
    total,
    Date.now(),
    day,
  ]);
}
