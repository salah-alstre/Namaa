import { ACHIEVEMENTS } from '@/content/achievements';

/** Everything the achievement rules look at. Built by the achievements store from the database. */
export interface AchievementContext {
  answered: number;
  correct: number;
  streakCurrent: number;
  streakLongest: number;
  lessonsDone: number;
  lessonsTotal: number;
  threeStarLessons: number;
  /** level → [completed, total] */
  levelLessons: Record<number, [number, number]>;
  masteredTopics: number;
  examsFinished: number;
  bestExamPercent: number;
  dailyDone: number;
  understoodMistakes: number;
  playerLevel: number;
  sessionsPerfect: number;
  noHintStreakBest: number;
  fastCorrect: number;
  timedCorrect: number;
  favoriteFormulas: number;
  placementDone: boolean;
  /** English side; all zero when English has not been started. */
  enLessonsDone: number;
  enLessonsTotal: number;
  enWordsLearned: number;
  enWordsMastered: number;
  enAnswered: number;
  enWritings: number;
  enSpeakingRated: number;
  enPlacementDone: boolean;
  /** Local hour 0–23 when the check runs. */
  hour: number;
  /** Whole days between today's first activity and the previous active day (0 when there is no earlier day). */
  gapDays: number;
}

type Rule = (c: AchievementContext) => boolean;

const complete = (c: AchievementContext, level: number): boolean => {
  const l = c.levelLessons[level];
  return !!l && l[1] > 0 && l[0] >= l[1];
};

export const RULES: Record<string, Rule> = {
  'first-answer': (c) => c.answered >= 1,
  'first-lesson': (c) => c.lessonsDone >= 1,
  'questions-50': (c) => c.answered >= 50,
  'questions-250': (c) => c.answered >= 250,
  'questions-1000': (c) => c.answered >= 1000,
  'correct-100': (c) => c.correct >= 100,
  'streak-3': (c) => c.streakLongest >= 3,
  'streak-7': (c) => c.streakLongest >= 7,
  'streak-30': (c) => c.streakLongest >= 30,
  'perfect-session': (c) => c.sessionsPerfect >= 1,
  'perfect-3': (c) => c.sessionsPerfect >= 3,
  'no-hint-10': (c) => c.noHintStreakBest >= 10,
  'no-hint-25': (c) => c.noHintStreakBest >= 25,
  'speedy-20': (c) => c.fastCorrect >= 20,
  'timed-30': (c) => c.timedCorrect >= 30,
  'lessons-10': (c) => c.lessonsDone >= 10,
  'lessons-all': (c) => c.lessonsTotal > 0 && c.lessonsDone >= c.lessonsTotal,
  'three-stars': (c) => c.threeStarLessons >= 1,
  'level-1': (c) => complete(c, 1),
  'level-5': (c) => complete(c, 5),
  'mastery-first': (c) => c.masteredTopics >= 1,
  'mastery-5': (c) => c.masteredTopics >= 5,
  'exam-first': (c) => c.examsFinished >= 1,
  'exam-ace': (c) => c.bestExamPercent >= 90,
  'daily-first': (c) => c.dailyDone >= 1,
  'daily-7': (c) => c.dailyDone >= 7,
  'mistake-fixed': (c) => c.understoodMistakes >= 1,
  'mistake-cleaner': (c) => c.understoodMistakes >= 10,
  'level-up-5': (c) => c.playerLevel >= 5,
  'level-up-10': (c) => c.playerLevel >= 10,
  'level-up-20': (c) => c.playerLevel >= 20,
  'night-owl': (c) => c.answered >= 1 && c.hour >= 23,
  'early-bird': (c) => c.answered >= 1 && c.hour < 7,
  comeback: (c) => c.answered >= 1 && c.gapDays >= 7,
  placement: (c) => c.placementDone,
  'formula-fan': (c) => c.favoriteFormulas >= 5,
  perfectionist: (c) => c.noHintStreakBest >= 50,
  'en-first-lesson': (c) => c.enLessonsDone >= 1,
  'en-lessons-10': (c) => c.enLessonsDone >= 10,
  'en-lessons-all': (c) => c.enLessonsTotal > 0 && c.enLessonsDone >= c.enLessonsTotal,
  'en-words-25': (c) => c.enWordsLearned >= 25,
  'en-words-100': (c) => c.enWordsLearned >= 100,
  'en-words-mastered': (c) => c.enWordsMastered >= 25,
  'en-answers-100': (c) => c.enAnswered >= 100,
  'en-writer': (c) => c.enWritings >= 3,
  'en-speaker': (c) => c.enSpeakingRated >= 10,
  'en-placement': (c) => c.enPlacementDone,
  'dual-learner': (c) => c.lessonsDone >= 1 && c.enLessonsDone >= 1,
  'dual-streak': (c) => c.streakLongest >= 7 && c.lessonsDone >= 1 && c.enLessonsDone >= 1,
};

/** Ids of every achievement whose condition holds right now (the caller filters out the already unlocked). */
export function metAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => RULES[a.id]?.(ctx)).map((a) => a.id);
}
