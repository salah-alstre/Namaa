import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '@/content/achievements';
import { metAchievements, RULES, type AchievementContext } from './achievements';

const zero: AchievementContext = {
  answered: 0, correct: 0, streakCurrent: 0, streakLongest: 0, lessonsDone: 0, lessonsTotal: 10, threeStarLessons: 0, levelLessons: {},
  masteredTopics: 0, examsFinished: 0, bestExamPercent: 0, dailyDone: 0, understoodMistakes: 0, playerLevel: 1, sessionsPerfect: 0,
  noHintStreakBest: 0, fastCorrect: 0, timedCorrect: 0, favoriteFormulas: 0, placementDone: false, enLessonsDone: 0, enLessonsTotal: 41,
  enWordsLearned: 0, enWordsMastered: 0, enAnswered: 0, enWritings: 0, enSpeakingRated: 0, enPlacementDone: false, hour: 12, gapDays: 0,
};

describe('achievements', () => {
  it('every definition has a rule and vice versa', () => {
    expect(ACHIEVEMENTS.map((a) => a.id).sort()).toEqual(Object.keys(RULES).sort());
  });

  it('a fresh learner unlocks no English or dual achievement', () => {
    expect(metAchievements(zero).filter((id) => id.startsWith('en-') || id.startsWith('dual-'))).toEqual([]);
  });

  it('English milestones unlock', () => {
    const got = metAchievements({ ...zero, enLessonsDone: 10, enWordsLearned: 30, enPlacementDone: true });
    expect(got).toEqual(expect.arrayContaining(['en-first-lesson', 'en-lessons-10', 'en-words-25', 'en-placement']));
    expect(got).not.toContain('en-lessons-all');
  });

  it('Dual Learner needs both subjects', () => {
    expect(metAchievements({ ...zero, lessonsDone: 3 })).not.toContain('dual-learner');
    expect(metAchievements({ ...zero, enLessonsDone: 1 })).not.toContain('dual-learner');
    expect(metAchievements({ ...zero, lessonsDone: 1, enLessonsDone: 1 })).toContain('dual-learner');
  });
});
