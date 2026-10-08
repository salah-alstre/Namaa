import type { EnLesson, EnLevel, Exercise } from '@/english-engine/types';
import { STARTER_LESSONS } from './lessons/starter';
import { A1_LESSONS } from './lessons/a1';
import { A2_LESSONS } from './lessons/a2';
import { B1_LESSONS } from './lessons/b1';
import { B2_LESSONS } from './lessons/b2';
import { READINGS } from './readings';
import { LISTENING } from './listening';

export * from './levels';
export * from './vocab';
export * from './grammar';
export * from './readings';
export * from './listening';
export * from './writing';
export * from './speaking';
export * from './placement';

export const ALL_LESSONS: EnLesson[] = [
  ...STARTER_LESSONS, ...A1_LESSONS, ...A2_LESSONS, ...B1_LESSONS, ...B2_LESSONS,
];
export const LESSON_BY_ID: Record<string, EnLesson> = Object.fromEntries(ALL_LESSONS.map((l) => [l.id, l]));
export const lessonsOfLevel = (level: EnLevel) => ALL_LESSONS.filter((l) => l.level === level);

/** Every lesson practice exercise (mini-practice + try-it), by id. */
export function lessonExercises(lesson: EnLesson): Exercise[] {
  const out: Exercise[] = [];
  for (const s of lesson.steps) {
    if (s.type === 'tryit') out.push(s.exercise);
    else if (s.type === 'practice') out.push(...s.exercises);
  }
  return out;
}

export const ALL_EXERCISES: Exercise[] = [
  ...ALL_LESSONS.flatMap(lessonExercises),
  ...READINGS.flatMap((r) => r.questions),
  ...LISTENING.flatMap((l) => l.questions),
];
export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(ALL_EXERCISES.map((e) => [e.id, e]));

/** Which lesson owns an exercise (for review/mistake deep-links). */
export const LESSON_OF_EXERCISE: Record<string, string> = Object.fromEntries(
  ALL_LESSONS.flatMap((l) => lessonExercises(l).map((e) => [e.id, l.id] as const)),
);
