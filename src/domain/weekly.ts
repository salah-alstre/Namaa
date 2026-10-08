import type { ActivityDay } from '@/types';
import { addDays, weekStart } from '@/lib/dates';

export interface WeekTotals {
  start: string;
  questions: number;
  correct: number;
  accuracy: number | null;
  minutes: number;
  xp: number;
  lessons: number;
  activeDays: number;
  bestDay: string | null;
}

export interface WeeklySummary {
  /** The week that just ended (Monday–Sunday) when seen on a new week, otherwise the current one. */
  week: WeekTotals;
  previous: WeekTotals;
}

export function weekTotals(activity: ActivityDay[], start: string): WeekTotals {
  const end = addDays(start, 6);
  const days = activity.filter((a) => a.day >= start && a.day <= end);
  const questions = days.reduce((s, d) => s + d.questions, 0);
  const correct = days.reduce((s, d) => s + d.correct, 0);
  const best = days.reduce<ActivityDay | null>((b, d) => (!b || d.questions > b.questions ? d : b), null);
  return {
    start,
    questions,
    correct,
    accuracy: questions > 0 ? correct / questions : null,
    minutes: Math.round(days.reduce((s, d) => s + d.minutes, 0)),
    xp: days.reduce((s, d) => s + d.xp, 0),
    lessons: days.reduce((s, d) => s + d.lessons, 0),
    activeDays: days.filter((d) => d.questions > 0 || d.lessons > 0).length,
    bestDay: best && best.questions > 0 ? best.day : null,
  };
}

/** Summary of last week (shown once per week) with the week before for comparison. */
export function lastWeekSummary(activity: ActivityDay[], today: string): WeeklySummary {
  const thisWeek = weekStart(today);
  const lastStart = addDays(thisWeek, -7);
  return { week: weekTotals(activity, lastStart), previous: weekTotals(activity, addDays(lastStart, -7)) };
}
