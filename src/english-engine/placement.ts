import { EN_LEVELS, levelIndex, type EnLevel, type PlacementQuestion } from './types';

export interface PlacementAnswer {
  level: EnLevel;
  correct: boolean;
}

export const PLACEMENT_MIN = 15;
export const PLACEMENT_MAX = 25;

export interface PlacementState {
  /** Level of the next question. */
  current: EnLevel;
  answers: PlacementAnswer[];
  asked: string[];
}

export const startPlacement = (): PlacementState => ({ current: 'a1', answers: [], asked: [] });

const clampLevel = (i: number): EnLevel => EN_LEVELS[Math.min(EN_LEVELS.length - 1, Math.max(0, i))]!;

/** Staircase: two right in a row at a level → up; two wrong in the last three at a level → down. */
function nextLevel(answers: PlacementAnswer[], current: EnLevel): EnLevel {
  const atLevel = answers.filter((a) => a.level === current);
  const last2 = atLevel.slice(-2);
  if (last2.length === 2 && last2.every((a) => a.correct)) return clampLevel(levelIndex(current) + 1);
  const last3 = atLevel.slice(-3);
  if (last3.filter((a) => !a.correct).length >= 2) return clampLevel(levelIndex(current) - 1);
  return current;
}

export function recordAnswer(s: PlacementState, q: PlacementQuestion, correct: boolean): PlacementState {
  const answers = [...s.answers, { level: q.level, correct }];
  return { current: nextLevel(answers, q.level), answers, asked: [...s.asked, q.id] };
}

export function accuracyAt(answers: PlacementAnswer[], level: EnLevel): { n: number; correct: number } {
  const at = answers.filter((a) => a.level === level);
  return { n: at.length, correct: at.filter((a) => a.correct).length };
}

export function placementResult(answers: PlacementAnswer[]): EnLevel {
  let result: EnLevel = 'starter';
  for (const lv of EN_LEVELS) {
    const { n, correct } = accuracyAt(answers, lv);
    if (n >= 2 && correct / n >= 0.6) result = lv;
    else if (n >= 2) break;
  }
  // Never place above a level that was never reached with enough evidence; never below starter.
  return result;
}

export function isPlacementDone(s: PlacementState): boolean {
  const n = s.answers.length;
  if (n >= PLACEMENT_MAX) return true;
  if (n < PLACEMENT_MIN) return false;
  // Boundary established: some level passed and the next level failed (or top level passed / bottom failed).
  const r = placementResult(s.answers);
  const above = clampLevel(levelIndex(r) + 1);
  if (r === 'b2') return accuracyAt(s.answers, 'b2').n >= 3;
  const up = accuracyAt(s.answers, above);
  return up.n >= 2 && up.correct / up.n < 0.6;
}

/** Pick an unasked question at the wanted level, falling back to the nearest level that still has some. */
export function pickQuestion(bank: PlacementQuestion[], s: PlacementState): PlacementQuestion | null {
  const free = bank.filter((q) => !s.asked.includes(q.id));
  if (!free.length) return null;
  const want = levelIndex(s.current);
  return [...free].sort((a, b) => Math.abs(levelIndex(a.level) - want) - Math.abs(levelIndex(b.level) - want))[0] ?? null;
}
