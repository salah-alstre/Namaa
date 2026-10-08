import { addDays, diffDays } from '@/lib/dates';

/**
 * Streaks are kind. A day counts when you did any question or lesson. Not having practised yet today
 * never breaks a streak, and one missed day is forgiven as a rest day (at most once every 7 days).
 */

export interface StreakResult {
  current: number;
  longest: number;
  /** Practised today already? */
  doneToday: boolean;
  /** The streak is alive but needs practice today. */
  atRisk: boolean;
  /** Missed days that were forgiven (shown as rest days in the calendar). */
  restDays: Set<string>;
}

const FORGIVE_EVERY = 7;

export function computeStreak(activeDays: Iterable<string>, today: string): StreakResult {
  const days = Array.from(new Set(activeDays)).filter((d) => d <= today).sort();
  const restDays = new Set<string>();
  const doneToday = days[days.length - 1] === today;
  if (days.length === 0) return { current: 0, longest: 0, doneToday, atRisk: false, restDays };

  let run = 1;
  let longest = 1;
  let lastRest: string | null = null;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1] as string;
    const cur = days[i] as string;
    const gap = diffDays(prev, cur);
    if (gap === 1) run++;
    else if (gap === 2 && (lastRest === null || diffDays(lastRest, cur) >= FORGIVE_EVERY)) {
      lastRest = addDays(prev, 1);
      restDays.add(lastRest);
      run++;
    } else run = 1;
    longest = Math.max(longest, run);
  }

  const last = days[days.length - 1] as string;
  const sinceLast = diffDays(last, today);
  let current = 0;
  let atRisk = false;
  if (sinceLast <= 1) {
    current = run;
    atRisk = sinceLast === 1;
  } else if (sinceLast === 2 && (lastRest === null || diffDays(lastRest, addDays(last, 1)) >= FORGIVE_EVERY)) {
    // Yesterday was missed but is forgiven if you practise today.
    current = run;
    atRisk = true;
  }
  return { current, longest, doneToday, atRisk, restDays };
}
