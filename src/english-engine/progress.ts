import type { EnSkill } from './types';

/** English XP rules. Reasons are stored as `english:<what>` so per-subject XP can be derived from xp_events. */
export const EN_XP_PREFIX = 'english:';
export const enReason = (what: string): string => `${EN_XP_PREFIX}${what}`;
export const isEnglishReason = (reason: string): boolean => reason.startsWith(EN_XP_PREFIX);

export const EN_LESSON_XP = 30;
export const EN_LESSON_STAR_XP = 10;

export function englishQuestionXp(correct: boolean, hintsUsed = 0): number {
  if (!correct) return 1; // showing up counts a little
  return hintsUsed > 0 ? 3 : 5;
}

export const reviewXp = (grade: 'again' | 'hard' | 'good' | 'easy'): number => (grade === 'again' ? 1 : 3);

export function englishLessonXp(stars: number): number {
  return EN_LESSON_XP + EN_LESSON_STAR_XP * Math.max(0, Math.min(3, stars));
}

/** Stars from the lesson's practice accuracy. */
export function lessonStars(correct: number, total: number): 1 | 2 | 3 {
  if (total <= 0) return 3;
  const p = correct / total;
  return p >= 0.9 ? 3 : p >= 0.7 ? 2 : 1;
}

/** Skill mastery 0..100: a recency-weighted blend so one lucky session doesn't max it out. */
export function skillMastery(attempts: number, correct: number, recent: number[]): number {
  if (attempts <= 0) return 0;
  const overall = correct / attempts;
  const r = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : overall;
  const confidence = Math.min(1, attempts / 20);
  return Math.round((0.4 * overall + 0.6 * r) * confidence * 100);
}

/** Push a 1/0 result onto the rolling window of the last 10 attempts. */
export const pushRecent = (recent: number[], ok: boolean): number[] => [...recent, ok ? 1 : 0].slice(-10);

export const SKILL_ORDER: EnSkill[] = ['vocab', 'grammar', 'listening', 'reading', 'writing'];

/** Lesson progress: completed / total in a level, as a whole percent. */
export const levelPercent = (completed: number, total: number): number =>
  total <= 0 ? 0 : Math.round((Math.min(completed, total) / total) * 100);
