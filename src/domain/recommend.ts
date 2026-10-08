import { TOPICS } from '@/content/topics';
import { LESSON_BY_TOPIC } from '@/content/lessons';
import type { TopicProgress } from '@/types';
import { dayKey, diffDays } from '@/lib/dates';

export type RecommendKind = 'weak' | 'next' | 'stale' | 'mistakes' | 'new';

export interface Recommendation {
  kind: RecommendKind;
  topicId?: string;
  lessonId?: string;
  count?: number;
}

export interface RecommendInput {
  progress: Record<string, TopicProgress>;
  doneLessons: ReadonlySet<string>;
  openLessons: ReadonlySet<string>;
  nextLessonId: string | null;
  openMistakes: number;
  now?: number;
}

/** Topics with enough answers to say anything about them. */
const MIN_ATTEMPTS = 5;

export function weakestTopic(progress: Record<string, TopicProgress>): TopicProgress | null {
  const list = Object.values(progress).filter((p) => p.attempts >= MIN_ATTEMPTS);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (b.mastery < a.mastery ? b : a));
}

export function strongestTopic(progress: Record<string, TopicProgress>): TopicProgress | null {
  const list = Object.values(progress).filter((p) => p.attempts >= MIN_ATTEMPTS);
  if (list.length === 0) return null;
  return list.reduce((a, b) => (b.mastery > a.mastery ? b : a));
}

/** A short ordered list: what would help the most right now. */
export function recommend(input: RecommendInput): Recommendation[] {
  const out: Recommendation[] = [];
  const now = input.now ?? Date.now();

  if (input.nextLessonId) out.push({ kind: 'next', lessonId: input.nextLessonId });

  if (input.openMistakes >= 3) out.push({ kind: 'mistakes', count: input.openMistakes });

  const weak = weakestTopic(input.progress);
  if (weak && weak.mastery < 60) out.push({ kind: 'weak', topicId: weak.topicId });

  // A topic that was good once but left alone for a while.
  const today = dayKey(now);
  const stale = Object.values(input.progress)
    .filter((p) => p.attempts >= MIN_ATTEMPTS && p.lastPracticed && diffDays(dayKey(p.lastPracticed), today) >= 10 && p.mastery >= 30)
    .sort((a, b) => (a.lastPracticed ?? 0) - (b.lastPracticed ?? 0))[0];
  if (stale && stale.topicId !== weak?.topicId) out.push({ kind: 'stale', topicId: stale.topicId });

  // A finished lesson whose topic has hardly been practised.
  const fresh = TOPICS.find((t) => {
    const l = LESSON_BY_TOPIC[t.id];
    return l && input.doneLessons.has(l.id) && (input.progress[t.id]?.attempts ?? 0) < 5;
  });
  if (fresh) out.push({ kind: 'new', topicId: fresh.id });

  return out;
}
