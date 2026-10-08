import { LEVELS, TOPICS, TOPIC_BY_ID, topicsOfLevel } from '@/content/topics';
import type { Difficulty, ExamConfig, ExamKind, MistakeRow, Question, Rng, SessionMode, TopicProgress } from '@/types';
import { createRng, hashSeed } from '@/math-engine/rng';
import { generatorsFor, makeQuestion, nearestLevel } from '@/math-engine/generators';
import { difficultyLevel } from './adaptive';

/** What the learner asked for on the Practice screen. */
export interface PracticeConfig {
  mode: SessionMode;
  /** Empty = let the mode decide. */
  topicIds: string[];
  /** 'adaptive' follows the learner's level per topic. */
  difficulty: Difficulty | 'adaptive';
  /** null = endless. */
  count: number | null;
  /** Timed mode: seconds for the whole session. */
  timeLimitS: number | null;
}

export const PRACTICE_COUNTS = [5, 10, 20, 50] as const;

/** Practice modes that can be started from the setup screen, with their fixed settings. */
export function modeDefaults(mode: SessionMode): Partial<PracticeConfig> {
  switch (mode) {
    case 'quick':
      return { count: 5, timeLimitS: null };
    case 'endless':
      return { count: null, timeLimitS: null };
    case 'timed':
      return { count: null, timeLimitS: 180 };
    default:
      return {};
  }
}

/** Topics that have at least one generator. */
export const PRACTICABLE = TOPICS.filter((t) => generatorsFor(t.id).length > 0);

export interface PlanContext {
  progress: Record<string, TopicProgress>;
  /** Topics the learner may reasonably be asked about right now (lessons opened or touched). */
  poolTopicIds: string[];
  /** Generator ids asked recently, newest last, so that questions do not repeat back to back. */
  recentGenerators: string[];
}

/** Topics for a "mix" or "weak" session when the learner did not pick any. */
export function defaultPool(progress: Record<string, TopicProgress>, openLevel: number): string[] {
  const touched = Object.keys(progress).filter((id) => (progress[id]?.attempts ?? 0) > 0);
  const lower = PRACTICABLE.filter((t) => t.level <= Math.max(1, openLevel)).map((t) => t.id);
  return Array.from(new Set([...touched, ...lower]));
}

/** Weakest practised topics first; topics never practised come after. */
export function weakTopics(progress: Record<string, TopicProgress>, pool: string[], n = 4): string[] {
  const practised = pool
    .filter((id) => (progress[id]?.attempts ?? 0) >= 2)
    .sort((a, b) => (progress[a]?.mastery ?? 0) - (progress[b]?.mastery ?? 0));
  const out = practised.slice(0, n);
  if (out.length < n) for (const id of pool) if (!out.includes(id) && out.length < n) out.push(id);
  return out;
}

function difficultyFor(cfg: PracticeConfig, topicId: string, ctx: PlanContext): Difficulty {
  if (cfg.difficulty !== 'adaptive') return cfg.difficulty;
  const base = ctx.progress[topicId]?.difficulty ?? 2;
  return difficultyLevel(base);
}

/** Pick the next topic for a session. */
function pickTopic(cfg: PracticeConfig, ctx: PlanContext, rng: Rng): string {
  const chosen = cfg.topicIds.filter((id) => generatorsFor(id).length > 0);
  let pool: string[];
  if (chosen.length > 0) pool = chosen;
  else if (cfg.mode === 'weak') pool = weakTopics(ctx.progress, ctx.poolTopicIds, 4);
  else pool = ctx.poolTopicIds.length > 0 ? ctx.poolTopicIds : PRACTICABLE.slice(0, 6).map((t) => t.id);
  if (pool.length === 0) pool = PRACTICABLE.slice(0, 6).map((t) => t.id);
  // Weak mode leans on the weakest of the pool, but not exclusively.
  if (cfg.mode === 'weak' && chosen.length === 0) return rng.chance(0.55) ? (pool[0] as string) : rng.pick(pool);
  return rng.pick(pool);
}

/** Next adaptive practice question; avoids repeating the last generators when there is a choice. */
export function nextPracticeQuestion(cfg: PracticeConfig, ctx: PlanContext, rng: Rng): Question {
  const topicId = pickTopic(cfg, ctx, rng);
  const d = difficultyFor(cfg, topicId, ctx);
  const all = generatorsFor(topicId);
  const fresh = all.filter((g) => !ctx.recentGenerators.slice(-3).includes(g.id));
  const g = rng.pick(fresh.length > 0 ? fresh : all);
  return makeQuestion(g, nearestLevel(g, d), rng);
}

// ───────────────────────── exams ─────────────────────────

export const EXAM_PRESETS: Record<Exclude<ExamKind, 'custom' | 'topic' | 'level'>, ExamConfig> = {
  quick: { kind: 'quick', topicIds: [], count: 10, difficulty: 'mixed', timeLimitS: 10 * 60 },
  mixed: { kind: 'mixed', topicIds: [], count: 20, difficulty: 'mixed', timeLimitS: 25 * 60 },
  final: { kind: 'final', topicIds: [], count: 40, difficulty: 'mixed', timeLimitS: 50 * 60 },
};

/** Spread an exam over topics evenly, rotate generators, and ramp the difficulty up over the paper. */
export function buildExamQuestions(cfg: ExamConfig, ctx: Pick<PlanContext, 'progress' | 'poolTopicIds'>, seed: number): Question[] {
  const rng = createRng(seed);
  let topics: string[];
  if (cfg.kind === 'level' && cfg.level) topics = topicsOfLevel(cfg.level).map((t) => t.id);
  else if (cfg.topicIds.length > 0) topics = cfg.topicIds;
  else if (cfg.kind === 'final') topics = PRACTICABLE.map((t) => t.id);
  else topics = ctx.poolTopicIds.length > 0 ? ctx.poolTopicIds : PRACTICABLE.slice(0, 10).map((t) => t.id);
  topics = topics.filter((id) => generatorsFor(id).length > 0);
  if (topics.length === 0) topics = PRACTICABLE.slice(0, 6).map((t) => t.id);

  const order: string[] = [];
  let bag: string[] = [];
  for (let i = 0; i < cfg.count; i++) {
    if (bag.length === 0) bag = rng.shuffle(topics);
    order.push(bag.pop() as string);
  }

  const used = new Set<string>();
  const out: Question[] = [];
  order.forEach((topicId, i) => {
    const gens = generatorsFor(topicId);
    const unused = gens.filter((g) => !used.has(g.id));
    const g = rng.pick(unused.length > 0 ? unused : gens);
    used.add(g.id);
    let d: Difficulty;
    if (cfg.difficulty === 'mixed') {
      const progressDiff = ctx.progress[topicId]?.difficulty ?? 2;
      const ramp = i / Math.max(1, cfg.count - 1); // 0 → 1 through the paper
      d = difficultyLevel(Math.min(5, Math.max(1, progressDiff + (ramp - 0.5) * 1.6)));
    } else d = cfg.difficulty;
    out.push(makeQuestion(g, nearestLevel(g, d), rng));
  });
  return out;
}

export function examTitleKey(kind: ExamKind): string {
  return `exams.kind.${kind}`;
}

// ───────────────────────── daily challenge ─────────────────────────

export const DAILY_QUESTIONS = 5;

export function dailySeed(day: string): number {
  return hashSeed(`raqam-daily-${day}`);
}

/** The same five questions for everyone on a given day: one per theme, rising difficulty. */
export function dailyChallengeQuestions(seed: number): Question[] {
  const rng = createRng(seed);
  const levels = rng.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, DAILY_QUESTIONS).sort((a, b) => a - b);
  return levels.map((level, i) => {
    const topics = topicsOfLevel(level).filter((t) => generatorsFor(t.id).length > 0);
    const topic = rng.pick(topics);
    const g = rng.pick(generatorsFor(topic.id));
    const d = Math.min(5, 2 + Math.floor(i / 2) + (i === DAILY_QUESTIONS - 1 ? 1 : 0)) as Difficulty;
    return makeQuestion(g, nearestLevel(g, d), rng);
  });
}

// ───────────────────────── mistakes review ─────────────────────────

/** The open mistakes to replay: the ones missed most and longest ago first. */
export function reviewQueue(mistakes: MistakeRow[], n: number | null): MistakeRow[] {
  const open = mistakes
    .filter((m) => !m.understood)
    .sort((a, b) => b.timesWrong - a.timesWrong || a.lastSeen - b.lastSeen);
  return n === null ? open : open.slice(0, n);
}

/** Highest level whose first lesson the learner has reached; used to size the default practice pool. */
export function openLevelFrom(openLessonLevels: number[], placedLevel: number): number {
  return Math.max(placedLevel, ...openLessonLevels, 1);
}

export function levelColor(level: number): string {
  return LEVELS[level - 1]?.color ?? '#6366f1';
}

export function topicLevel(topicId: string): number {
  return TOPIC_BY_ID[topicId]?.level ?? 1;
}
