import type { Difficulty } from '@/types';

/** XP rules. Hints cost a little; wrong answers earn nothing but never subtract. */

export const BASE_XP: Record<Difficulty, number> = { 1: 5, 2: 8, 3: 12, 4: 18, 5: 25 };
/** Multiplier by hints used (0..3); 4 = full solution revealed. */
export const HINT_FACTOR = [1, 0.85, 0.7, 0.55, 0] as const;

export function questionXp(difficulty: Difficulty, correct: boolean, hintsUsed: number): number {
  if (!correct) return 0;
  const f = HINT_FACTOR[Math.max(0, Math.min(4, hintsUsed))] ?? 0;
  return Math.max(1, Math.round(BASE_XP[difficulty] * f));
}

export const LESSON_XP = 30;
export const LESSON_STAR_XP = 10;
export const DAILY_CHALLENGE_XP = 50;
export const EXAM_COMPLETE_XP = 20;

export function lessonXp(stars: number): number {
  return LESSON_XP + LESSON_STAR_XP * Math.max(0, Math.min(3, stars));
}

export function examXp(correct: number, total: number): number {
  return EXAM_COMPLETE_XP + correct * 2 + (total > 0 && correct === total ? 20 : 0);
}

/** Cumulative XP needed to reach `level` (level 1 = 0). Each level costs 20 XP more than the last. */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 80 * (l - 1) + 10 * (l - 1) * (l - 2);
}

export interface LevelState {
  level: number;
  /** XP earned inside the current level. */
  into: number;
  /** XP the current level needs in total. */
  needed: number;
  /** 0..1 */
  progress: number;
  totalXp: number;
}

export function levelFromXp(xp: number): LevelState {
  const total = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpForLevel(level + 1) <= total) level++;
  const start = xpForLevel(level);
  const needed = xpForLevel(level + 1) - start;
  const into = total - start;
  return { level, into, needed, progress: needed > 0 ? into / needed : 0, totalXp: total };
}

export type RankId = 'beginner' | 'explorer' | 'solver' | 'thinker';

export function rankFor(level: number): RankId {
  if (level >= 20) return 'thinker';
  if (level >= 10) return 'solver';
  if (level >= 5) return 'explorer';
  return 'beginner';
}
