import type { SrsGrade } from './types';

/** Deterministic SM-2-lite scheduler. Pure: same card + grade + `now` always gives the same result. */
export interface SrsCard {
  state: 'learning' | 'review';
  reps: number;
  lapses: number;
  intervalDays: number;
  ease: number;
  dueAt: number;
}

export const SRS_GRADES: SrsGrade[] = ['again', 'hard', 'good', 'easy'];
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MAX_INTERVAL = 365;
const clampEase = (e: number) => Math.min(3, Math.max(1.3, Math.round(e * 100) / 100));

export const newCard = (now: number): SrsCard => ({
  state: 'learning',
  reps: 0,
  lapses: 0,
  intervalDays: 0,
  ease: 2.5,
  dueAt: now,
});

export function schedule(card: SrsCard, grade: SrsGrade, now: number): SrsCard {
  const next: SrsCard = { ...card, reps: card.reps + 1 };
  if (card.state === 'learning') {
    switch (grade) {
      case 'again':
        return { ...next, dueAt: now + 10 * MIN };
      case 'hard':
        return { ...next, dueAt: now + HOUR };
      case 'good':
        return { ...next, state: 'review', intervalDays: 1, dueAt: now + DAY };
      case 'easy':
        return { ...next, state: 'review', intervalDays: 3, ease: clampEase(card.ease + 0.15), dueAt: now + 3 * DAY };
    }
  }
  const iv = card.intervalDays;
  switch (grade) {
    case 'again':
      return {
        ...next,
        state: 'learning',
        lapses: card.lapses + 1,
        intervalDays: 0,
        ease: clampEase(card.ease - 0.2),
        dueAt: now + 10 * MIN,
      };
    case 'hard': {
      const d = Math.min(MAX_INTERVAL, Math.max(iv + 1, Math.round(iv * 1.2)));
      return { ...next, intervalDays: d, ease: clampEase(card.ease - 0.15), dueAt: now + d * DAY };
    }
    case 'good': {
      const d = Math.min(MAX_INTERVAL, Math.max(iv + 1, Math.round(iv * card.ease)));
      return { ...next, intervalDays: d, dueAt: now + d * DAY };
    }
    case 'easy': {
      const d = Math.min(MAX_INTERVAL, Math.max(iv + 2, Math.round(iv * card.ease * 1.3)));
      return { ...next, intervalDays: d, ease: clampEase(card.ease + 0.15), dueAt: now + d * DAY };
    }
  }
}

/** Human preview of the next interval for a grade button ("10m", "1h", "3d"). */
export function previewInterval(card: SrsCard, grade: SrsGrade, now: number): { unit: 'm' | 'h' | 'd'; value: number } {
  const ms = schedule(card, grade, now).dueAt - now;
  if (ms < HOUR) return { unit: 'm', value: Math.max(1, Math.round(ms / MIN)) };
  if (ms < DAY) return { unit: 'h', value: Math.round(ms / HOUR) };
  return { unit: 'd', value: Math.round(ms / DAY) };
}

export const endOfDay = (now: number): number => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

export const isDue = (card: Pick<SrsCard, 'dueAt'>, now: number): boolean => card.dueAt <= endOfDay(now);

export type WordMastery = 'new' | 'learning' | 'familiar' | 'mastered';

export function wordMastery(card: Pick<SrsCard, 'state' | 'intervalDays' | 'reps'> | null): WordMastery {
  if (!card || card.reps === 0) return 'new';
  if (card.state === 'learning' || card.intervalDays < 7) return 'learning';
  if (card.intervalDays < 21) return 'familiar';
  return 'mastered';
}
