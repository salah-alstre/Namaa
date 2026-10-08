import type { Lesson } from '@/types';
import { LEVEL1_LESSONS } from './level1';
import { LEVEL2_LESSONS } from './level2';
import { LEVEL3_LESSONS } from './level3';
import { LEVEL4_LESSONS } from './level4';
import { LEVEL5_LESSONS } from './level5';
import { LEVEL6_LESSONS } from './level6';
import { LEVEL7_LESSONS } from './level7';

export const LESSONS: Lesson[] = [
  ...LEVEL1_LESSONS,
  ...LEVEL2_LESSONS,
  ...LEVEL3_LESSONS,
  ...LEVEL4_LESSONS,
  ...LEVEL5_LESSONS,
  ...LEVEL6_LESSONS,
  ...LEVEL7_LESSONS,
].sort((a, b) => a.level - b.level || a.order - b.order);

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));

export const LESSON_BY_TOPIC: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.topicId, l]));

export function lessonsOfLevel(level: number): Lesson[] {
  return LESSONS.filter((l) => l.level === level);
}
