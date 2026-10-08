import { db, num, numOrNull, parseJson, str, type Row } from '../index';
import type { ExamConfig, ExamKind, ExamRow, Question, UserAnswer } from '@/types';

function toExam(r: Row): ExamRow {
  const config = parseJson<ExamConfig>(r.config_json, { kind: 'quick', topicIds: [], count: 0, difficulty: 'mixed', timeLimitS: null });
  return {
    id: num(r.id),
    kind: str(r.kind) as ExamKind,
    title: str(r.title),
    config,
    questions: parseJson<Question[]>(r.questions_json, []),
    answers: parseJson<Record<string, UserAnswer | null>>(r.answers_json, {}),
    times: parseJson<Record<string, number>>(r.times_json, {}),
    flags: parseJson<string[]>(r.flags_json, []),
    timeLimitS: numOrNull(r.time_limit_s),
    elapsedS: num(r.elapsed_s),
    status: str(r.status) as ExamRow['status'],
    score: numOrNull(r.score),
    total: num(r.total),
    startedAt: num(r.started_at),
    finishedAt: numOrNull(r.finished_at),
  };
}

export async function createExam(title: string, config: ExamConfig, questions: Question[]): Promise<number> {
  const res = await db().execute(
    `INSERT INTO exams (kind, title, config_json, questions_json, time_limit_s, total, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [config.kind, title, JSON.stringify(config), JSON.stringify(questions), config.timeLimitS, questions.length, Date.now()],
  );
  return res.last_insert_id;
}

export async function loadExam(id: number): Promise<ExamRow | null> {
  const rows = await db().query('SELECT * FROM exams WHERE id = ?', [id]);
  return rows[0] ? toExam(rows[0]) : null;
}

/** All finished exams, newest first (the heavy question payload is included; there are few of them). */
export async function listExams(): Promise<ExamRow[]> {
  return (await db().query("SELECT * FROM exams WHERE status = 'finished' ORDER BY finished_at DESC")).map(toExam);
}

export async function findOpenExam(): Promise<ExamRow | null> {
  const rows = await db().query("SELECT * FROM exams WHERE status = 'in_progress' ORDER BY id DESC LIMIT 1");
  return rows[0] ? toExam(rows[0]) : null;
}

export async function saveExamProgress(
  id: number,
  p: { answers: Record<string, UserAnswer | null>; times: Record<string, number>; flags: string[]; elapsedS: number },
): Promise<void> {
  await db().execute("UPDATE exams SET answers_json = ?, times_json = ?, flags_json = ?, elapsed_s = ? WHERE id = ? AND status = 'in_progress'", [
    JSON.stringify(p.answers),
    JSON.stringify(p.times),
    JSON.stringify(p.flags),
    Math.round(p.elapsedS),
    id,
  ]);
}

export async function finishExam(id: number, score: number, elapsedS: number): Promise<void> {
  await db().execute("UPDATE exams SET status = 'finished', score = ?, elapsed_s = ?, finished_at = ? WHERE id = ? AND status = 'in_progress'", [
    score,
    Math.round(elapsedS),
    Date.now(),
    id,
  ]);
}

export async function abandonExam(id: number): Promise<void> {
  await db().execute("UPDATE exams SET status = 'abandoned', finished_at = ? WHERE id = ? AND status = 'in_progress'", [Date.now(), id]);
}

export async function deleteExam(id: number): Promise<void> {
  await db().execute('DELETE FROM exams WHERE id = ?', [id]);
}
