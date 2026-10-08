import { create } from 'zustand';
import { ACHIEVEMENT_BY_ID } from '@/content/achievements';
import { LESSONS } from '@/content/lessons';
import { TOPICS } from '@/content/topics';
import { achievementCounters, attemptTotals, loadMistakes, refreshTopicMastery } from '@/database/repos/attempts';
import { listExams } from '@/database/repos/exams';
import {
  addXp,
  bumpActivity,
  completeLesson,
  loadAchievements,
  loadActivity,
  loadDailyChallenges,
  loadFavoriteFormulas,
  loadLessonProgress,
  loadTopicProgress,
  setFormulaFavorite,
  totalXp,
  unlockAchievement,
} from '@/database/repos/progress';
import { useEnglish } from './english';
import { ALL_LESSONS as EN_ALL } from '@/content/english';
import { wordMastery } from '@/english-engine/srs';
import { metAchievements, type AchievementContext } from '@/domain/achievements';
import { masteryBand } from '@/domain/mastery';
import { computeStreak, type StreakResult } from '@/domain/streak';
import { nextLesson, unlockedLessons } from '@/domain/unlock';
import { levelFromXp, lessonXp, rankFor, type LevelState } from '@/domain/xp';
import { currentI18n } from '@/i18n';
import { dayKey, diffDays } from '@/lib/dates';
import { logEvent } from '@/lib/log';
import { playCue } from '@/lib/sound';
import type { ActivityDay, DailyChallengeRow, LessonProgress, TopicProgress } from '@/types';
import { useProfile } from './profile';
import { useSettings } from './settings';
import { toast } from './toast';

interface PlayerState {
  ready: boolean;
  topics: Record<string, TopicProgress>;
  lessons: Record<string, LessonProgress>;
  activity: ActivityDay[];
  achievements: Record<string, number>;
  favorites: string[];
  daily: DailyChallengeRow[];
  xp: number;
  level: LevelState;
  streak: StreakResult;
  doneLessons: Set<string>;
  openLessons: Set<string>;
  nextLessonId: string | null;
  openMistakes: number;
  today: string;

  reload: () => Promise<void>;
  /** Run after anything that can earn an achievement or a level. Shows toasts. */
  afterProgress: (prevLevel?: number) => Promise<void>;
  finishLesson: (lessonId: string, stars: number, minutes: number) => Promise<{ xp: number; firstTime: boolean }>;
  toggleFavorite: (formulaId: string) => Promise<void>;
  /** Adds XP and an activity row for things the attempts repo does not cover (exams, daily challenge, placement). */
  grant: (xp: number, reason: string, extra?: Partial<Omit<ActivityDay, 'day' | 'xp'>>) => Promise<void>;
}

const emptyStreak: StreakResult = { current: 0, longest: 0, doneToday: false, atRisk: false, restDays: new Set() };

function derive(lessons: Record<string, LessonProgress>, activity: ActivityDay[]) {
  const { unlockAll, placedLevel } = useSettings.getState().settings;
  const done = new Set(Object.values(lessons).filter((l) => l.status === 'completed').map((l) => l.lessonId));
  const open = unlockedLessons(done, placedLevel, unlockAll);
  const today = dayKey();
  const active = activity.filter((a) => a.questions > 0 || a.lessons > 0).map((a) => a.day);
  return { doneLessons: done, openLessons: open, nextLessonId: nextLesson(done, open)?.id ?? null, streak: computeStreak(active, today), today };
}

export const usePlayer = create<PlayerState>((set, get) => ({
  ready: false,
  topics: {},
  lessons: {},
  activity: [],
  achievements: {},
  favorites: [],
  daily: [],
  xp: 0,
  level: levelFromXp(0),
  streak: emptyStreak,
  doneLessons: new Set(),
  openLessons: new Set(),
  nextLessonId: null,
  openMistakes: 0,
  today: dayKey(),

  reload: async () => {
    const [topics, lessons, activity, achievements, favorites, daily, xp, mistakes] = await Promise.all([
      loadTopicProgress(),
      loadLessonProgress(),
      loadActivity(),
      loadAchievements(),
      loadFavoriteFormulas(),
      loadDailyChallenges(),
      totalXp(),
      loadMistakes(),
    ]);
    set({
      ready: true,
      topics,
      lessons,
      activity,
      achievements,
      favorites,
      daily,
      xp,
      level: levelFromXp(xp),
      openMistakes: mistakes.filter((m) => !m.understood).length,
      ...derive(lessons, activity),
    });
  },

  afterProgress: async (prevLevel) => {
    const before = prevLevel ?? get().level.level;
    await get().reload();
    // Achievements can chain (their XP can level you up), so repeat until nothing new unlocks.
    for (let round = 0; round < 3; round++) {
      const ids = await newlyMet();
      if (ids.length === 0) break;
      const i18n = currentI18n();
      let any = false;
      for (const id of ids) {
        const def = ACHIEVEMENT_BY_ID[id];
        if (!def) continue;
        if (await unlockAchievement(id, def.xp)) {
          any = true;
          toast({ kind: 'achievement', title: i18n.t('toast.achievement'), body: i18n.l(def.title), icon: def.icon }, 5600);
          playCue('achievement');
        }
      }
      await get().reload();
      if (!any) break;
    }
    const now = get().level.level;
    if (now > before) {
      const i18n = currentI18n();
      const rank = i18n.t(`rank.${rankFor(now)}` as never);
      toast({ kind: 'levelup', title: i18n.t('toast.levelUp', { n: now }), body: i18n.t('toast.levelUpBody', { rank }), icon: 'ArrowUpCircle' }, 5600);
      playCue('levelup');
    }
  },

  finishLesson: async (lessonId, stars, minutes) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    const was = get().lessons[lessonId]?.status === 'completed';
    const prev = get().level.level;
    await completeLesson(lessonId, stars);
    let xp = 0;
    if (!was) {
      xp = lessonXp(stars);
      await addXp(xp, `lesson:${lessonId}`);
    }
    await bumpActivity({ xp, lessons: was ? 0 : 1, minutes: Math.max(0, Math.round(minutes)) });
    if (lesson) {
      const t = get().topics[lesson.topicId];
      if (t) await refreshTopicMastery(t, true);
    }
    await get().afterProgress(prev);
    return { xp, firstTime: !was };
  },

  toggleFavorite: async (id) => {
    const on = !get().favorites.includes(id);
    await setFormulaFavorite(id, on);
    set({ favorites: on ? [...get().favorites, id] : get().favorites.filter((f) => f !== id) });
    await get().afterProgress();
  },

  grant: async (xp, reason, extra = {}) => {
    const prev = get().level.level;
    if (xp > 0) await addXp(xp, reason);
    await bumpActivity({ xp, ...extra });
    await get().afterProgress(prev);
  },
}));

async function newlyMet(): Promise<string[]> {
  const s = usePlayer.getState();
  try {
    const [totals, counters, exams, mistakes] = await Promise.all([attemptTotals(), achievementCounters(), listExams(), loadMistakes()]);
    const levelLessons: Record<number, [number, number]> = {};
    for (const l of LESSONS) {
      const e = (levelLessons[l.level] ??= [0, 0]);
      e[1]++;
      if (s.doneLessons.has(l.id)) e[0]++;
    }
    const prevDays = s.activity.filter((a) => a.day < s.today && (a.questions > 0 || a.lessons > 0)).map((a) => a.day);
    const lastPrev = prevDays[prevDays.length - 1];
    const en = useEnglish.getState();
    const enVocab = Object.values(en.vocab);
    const ctx: AchievementContext = {
      enLessonsDone: EN_ALL.filter((x) => en.lessons[x.id]?.status === 'completed').length,
      enLessonsTotal: EN_ALL.length,
      enWordsLearned: enVocab.filter((v) => wordMastery(v) !== 'new').length,
      enWordsMastered: enVocab.filter((v) => wordMastery(v) === 'mastered').length,
      enAnswered: en.attempts.total,
      enWritings: new Set(en.writing.map((w) => w.promptId)).size,
      enSpeakingRated: Object.keys(en.speaking).length,
      enPlacementDone: en.placements.length > 0,
      answered: totals.total,
      correct: totals.correct,
      streakCurrent: s.streak.current,
      streakLongest: s.streak.longest,
      lessonsDone: s.doneLessons.size,
      lessonsTotal: LESSONS.length,
      threeStarLessons: Object.values(s.lessons).filter((l) => l.stars >= 3).length,
      levelLessons,
      masteredTopics: TOPICS.filter((t) => masteryBand(s.topics[t.id]?.mastery ?? 0) === 'mastered').length,
      examsFinished: exams.length,
      bestExamPercent: exams.reduce((m, e) => Math.max(m, e.total > 0 && e.score !== null ? Math.round((e.score / e.total) * 100) : 0), 0),
      dailyDone: s.daily.filter((d) => d.completed).length,
      understoodMistakes: mistakes.filter((m) => m.understood).length,
      playerLevel: s.level.level,
      sessionsPerfect: counters.perfectSessions,
      noHintStreakBest: counters.noHintStreakBest,
      fastCorrect: counters.fastCorrect,
      timedCorrect: counters.timedCorrect,
      favoriteFormulas: s.favorites.length,
      placementDone: useProfile.getState().profile.placementDone,
      hour: new Date().getHours(),
      gapDays: lastPrev ? diffDays(lastPrev, s.today) : 0,
    };
    return metAchievements(ctx).filter((id) => !(id in s.achievements));
  } catch (e) {
    logEvent('error', `achievement check failed: ${String(e)}`);
    return [];
  }
}

// Changing "unlock everything" or the placed level must refresh the roadmap immediately.
let lastKey = '';
useSettings.subscribe((st) => {
  const key = `${st.settings.unlockAll}|${st.settings.placedLevel}`;
  if (key === lastKey) return;
  const first = lastKey === '';
  lastKey = key;
  const p = usePlayer.getState();
  if (!first && p.ready) usePlayer.setState(derive(p.lessons, p.activity));
});
