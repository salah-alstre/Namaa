import { LESSONS } from '@/content/lessons';
import type { Lesson } from '@/types';

/**
 * Lessons unlock one after another. Everything below the level a placement test found stays open,
 * and the "unlock everything" setting opens the whole path. Practice is never locked.
 */
export function unlockedLessons(done: ReadonlySet<string>, placedLevel: number, unlockAll: boolean): Set<string> {
  const open = new Set<string>();
  LESSONS.forEach((l, i) => {
    const prev = LESSONS[i - 1];
    if (unlockAll || i === 0 || l.level < placedLevel || (prev && done.has(prev.id)) || done.has(l.id)) open.add(l.id);
  });
  return open;
}

/** The lesson to suggest next: the first unfinished one that is open. */
export function nextLesson(done: ReadonlySet<string>, open: ReadonlySet<string>): Lesson | null {
  return LESSONS.find((l) => !done.has(l.id) && open.has(l.id)) ?? null;
}
