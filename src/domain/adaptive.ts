import type { ComfortLevel, Difficulty } from '@/types';

/** Each topic keeps a fractional difficulty (1..5). Right answers nudge it up, wrong ones pull it down harder. */

export function nextDifficulty(current: number, correct: boolean, hintsUsed: number): number {
  let d = current;
  if (correct) d += hintsUsed === 0 ? 0.22 : hintsUsed === 1 ? 0.08 : 0;
  else d -= 0.4;
  return Math.max(1, Math.min(5, Math.round(d * 100) / 100));
}

export function difficultyLevel(d: number): Difficulty {
  return Math.max(1, Math.min(5, Math.round(d))) as Difficulty;
}

/** Starting difficulty by self-reported comfort. */
export function startingDifficulty(comfort: ComfortLevel): number {
  return comfort === 'beginner' ? 1.4 : comfort === 'some' ? 2 : 2.8;
}

export type SessionPace = 'too-easy' | 'too-hard' | 'steady';

/** Looks at the last answers of a session and says how it feels. */
export function sessionPace(results: boolean[]): SessionPace {
  const last = results.slice(-6);
  if (last.length < 5) return 'steady';
  const ok = last.filter(Boolean).length;
  if (ok === last.length) return 'too-easy';
  if (ok <= 2) return 'too-hard';
  return 'steady';
}
