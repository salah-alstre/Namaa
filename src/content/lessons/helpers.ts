import type { L10n, Lesson, LessonExample, VisualSpec } from '@/types';
import { TOPIC_BY_ID } from '../topics';

/** Short bilingual string. */
export const p = (en: string, ar: string): L10n => ({ en, ar });

export interface LessonDraft {
  minutes: number;
  /** Explanation paragraphs (simple language; maths between $...$). */
  explanation: L10n[];
  visual: VisualSpec;
  visualCaption?: L10n;
  example: LessonExample;
  why: L10n;
  /** Generator name (without the topic prefix) used for "Try it yourself". */
  tryGen: string;
  /** Generator names used for the Quick Check (2–5 questions are drawn from them). */
  check: string[];
  keywords: L10n;
}

/** Builds a lesson from a topic id: title, level and order come from the topic itself. */
export function lesson(topicId: string, d: LessonDraft): Lesson {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) throw new Error(`Unknown topic for lesson: ${topicId}`);
  return {
    id: topicId,
    topicId,
    level: topic.level,
    order: topic.order,
    minutes: d.minutes,
    title: topic.title,
    summary: topic.summary,
    explanation: d.explanation,
    visual: d.visual,
    visualCaption: d.visualCaption,
    example: d.example,
    why: d.why,
    tryGenerator: `${topicId}.${d.tryGen}`,
    checkGenerators: d.check.map((g) => `${topicId}.${g}`),
    keywords: d.keywords,
  };
}
