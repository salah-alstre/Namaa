import { dayKey, diffDays } from '@/lib/dates';

/**
 * Mastery (0–100) blends several things so a lucky streak or one hard question can't fake it:
 *  - recent accuracy (newest answers weigh more, with a prior so 1/1 is not 100%)
 *  - confidence (how many answers we have seen)
 *  - depth (the difficulty the learner now works at)
 *  - recency (fades gently if a topic is left alone for weeks)
 * Finishing the lesson adds a small bonus.
 */

export interface MasteryInput {
  attempts: number;
  /** '1'/'0' characters, newest last. */
  recent: string;
  /** Adaptive difficulty 1..5 */
  difficulty: number;
  lessonDone: boolean;
  lastPracticed: number | null;
}

export const RECENT_WINDOW = 20;

export function recentAccuracy(recent: string): number {
  const r = recent.slice(-RECENT_WINDOW);
  let num = 1; // prior: one correct and one wrong pseudo-answer
  let den = 2;
  for (let i = 0; i < r.length; i++) {
    const w = 1 + i / r.length; // 1..2: the newest counts double
    den += w;
    if (r[i] === '1') num += w;
  }
  return num / den;
}

export function computeMastery(m: MasteryInput, now: number = Date.now()): number {
  if (m.attempts <= 0) return m.lessonDone ? 3 : 0;
  const acc = recentAccuracy(m.recent);
  const conf = 1 - Math.exp(-m.attempts / 12);
  const depth = Math.max(0, Math.min(1, (m.difficulty - 1) / 4));
  let score = conf * acc * (62 + 30 * depth + (m.lessonDone ? 8 : 0));
  if (m.lastPracticed) {
    const idle = diffDays(dayKey(m.lastPracticed), dayKey(now));
    if (idle > 14) score *= Math.max(0.8, 1 - (idle - 14) * 0.004);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type MasteryBand = 'new' | 'learning' | 'developing' | 'good' | 'strong' | 'mastered';

export function masteryBand(value: number): MasteryBand {
  if (value <= 20) return 'new';
  if (value <= 40) return 'learning';
  if (value <= 60) return 'developing';
  if (value <= 80) return 'good';
  if (value <= 95) return 'strong';
  return 'mastered';
}

export const BAND_COLOR: Record<MasteryBand, string> = {
  new: 'var(--ink-3)',
  learning: 'var(--warn)',
  developing: '#f59e0b',
  good: 'var(--accent)',
  strong: 'var(--good)',
  mastered: 'var(--gold)',
};
