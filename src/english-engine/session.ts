import type { Exercise } from './types';

/** One step of a Quick English session. */
export type SessionItem = { type: 'word'; wordId: string } | { type: 'exercise'; exercise: Exercise };

export interface SessionInput {
  /** Words due for review, most overdue first. */
  dueWordIds: string[];
  /** Exercises the learner got wrong and has not understood yet. */
  mistakes: Exercise[];
  /** Practice from the lesson the learner should do next. */
  nextLesson: Exercise[];
  /** Level-appropriate extras used when the above are short. */
  filler: Exercise[];
}

export const QUICK_TARGET = 10;
export const QUICK_MAX_WORDS = 5;
export const QUICK_MAX_MISTAKES = 3;
/** Rough seconds per item, used to show the "about N minutes" estimate. */
export const SECONDS_PER_ITEM = 40;

/**
 * Deterministic Quick English plan: due words first (spaced repetition is the priority),
 * then retries of recent mistakes, then new practice, topped up to ten items.
 * Items are interleaved so the learner never sees more than two of the same type in a row.
 */
export function buildQuickSession(input: SessionInput, target = QUICK_TARGET): SessionItem[] {
  const seen = new Set<string>();
  const unique = (list: Exercise[]) => list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));

  const words = input.dueWordIds.slice(0, QUICK_MAX_WORDS);
  const retries = unique(input.mistakes).slice(0, QUICK_MAX_MISTAKES);
  const room = Math.max(0, target - words.length - retries.length);
  const fresh = unique(input.nextLesson).slice(0, room);
  const topUp = unique(input.filler).slice(0, Math.max(0, room - fresh.length));

  const wordItems: SessionItem[] = words.map((wordId) => ({ type: 'word', wordId }));
  const exItems: SessionItem[] = [...retries, ...fresh, ...topUp].map((exercise) => ({ type: 'exercise', exercise }));

  const out: SessionItem[] = [];
  let w = 0;
  let e = 0;
  while (w < wordItems.length || e < exItems.length) {
    // A word card, then up to two exercises, so the rhythm changes.
    if (w < wordItems.length) out.push(wordItems[w++]!);
    for (let k = 0; k < 2 && e < exItems.length; k++) out.push(exItems[e++]!);
    if (w >= wordItems.length) while (e < exItems.length) out.push(exItems[e++]!);
  }
  return out;
}

export const estimateMinutes = (items: number): number => Math.max(1, Math.round((items * SECONDS_PER_ITEM) / 60));
