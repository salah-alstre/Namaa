import { create } from 'zustand';
import { LESSONS } from '@/content/lessons';
import { endSession, loadMistakes, recordAttempt, startSession } from '@/database/repos/attempts';
import { defaultPool, nextPracticeQuestion, openLevelFrom, reviewQueue, type PracticeConfig } from '@/domain/planner';
import { createRng, randomSeed } from '@/math-engine/rng';
import { getGenerator, makeQuestion, nearestLevel } from '@/math-engine/generators';
import { checkAnswer } from '@/math-engine/validate';
import { logEvent } from '@/lib/log';
import type { MistakeRow, Question, Rng, UserAnswer, Verdict } from '@/types';
import { usePlayer } from './player';
import { useSettings } from './settings';

export interface PracticeResult {
  questionId: string;
  topicId: string;
  correct: boolean;
  xp: number;
  hints: number;
  timeMs: number;
  /** A "try a similar one" repeat: recorded, but it does not count towards the planned total. */
  extra: boolean;
}

export interface SubmitOutcome {
  verdict: Verdict;
  xp: number;
}

interface PracticeState {
  status: 'idle' | 'running' | 'summary';
  config: PracticeConfig | null;
  sessionId: number | null;
  question: Question | null;
  mistakeId: number | null;
  extra: boolean;
  queue: MistakeRow[];
  results: PracticeResult[];
  recent: string[];
  startedAt: number;
  /** Epoch ms when a timed session ends; null otherwise. */
  deadline: number | null;
  empty: boolean;
  masteryBefore: Record<string, number>;
  startLevel: number;

  start: (cfg: PracticeConfig) => Promise<void>;
  submit: (answer: UserAnswer | null, hintsUsed: number, timeMs: number) => Promise<SubmitOutcome>;
  next: () => void;
  similar: () => void;
  finish: () => Promise<void>;
  reset: () => void;
  /** Questions that count towards the planned total. */
  planned: () => number;
}

let rng: Rng = createRng(randomSeed());

const initial = {
  status: 'idle' as const,
  config: null,
  sessionId: null,
  question: null,
  mistakeId: null,
  extra: false,
  queue: [] as MistakeRow[],
  results: [] as PracticeResult[],
  recent: [] as string[],
  startedAt: 0,
  deadline: null,
  empty: false,
  masteryBefore: {} as Record<string, number>,
  startLevel: 1,
};

export const usePractice = create<PracticeState>((set, get) => ({
  ...initial,

  planned: () => get().results.filter((r) => !r.extra).length,

  start: async (cfg) => {
    rng = createRng(randomSeed());
    const player = usePlayer.getState();
    const openLevel = openLevelFrom(
      Array.from(player.openLessons).map((id) => LESSONS.find((l) => l.id === id)?.level ?? 1),
      useSettings.getState().settings.placedLevel,
    );
    let queue: MistakeRow[] = [];
    let count = cfg.count;
    if (cfg.mode === 'review') {
      const all = await loadMistakes();
      const scoped = cfg.topicIds.length > 0 ? all.filter((m) => cfg.topicIds.includes(m.topicId)) : all;
      queue = reviewQueue(scoped, cfg.count);
      count = queue.length;
    }
    const config: PracticeConfig = { ...cfg, count };
    const masteryBefore: Record<string, number> = {};
    for (const [id, t] of Object.entries(player.topics)) masteryBefore[id] = t.mastery;

    if (cfg.mode === 'review' && queue.length === 0) {
      set({ ...initial, config, status: 'summary', empty: true, startedAt: Date.now() });
      return;
    }
    let sessionId: number | null = null;
    try {
      sessionId = await startSession(cfg.mode, cfg.topicIds.length === 1 ? (cfg.topicIds[0] as string) : null, cfg.difficulty === 'adaptive' ? null : cfg.difficulty, count);
    } catch (e) {
      logEvent('error', `startSession failed: ${String(e)}`);
    }
    const now = Date.now();
    set({
      ...initial,
      config,
      sessionId,
      queue,
      startedAt: now,
      deadline: config.timeLimitS ? now + config.timeLimitS * 1000 : null,
      masteryBefore,
      startLevel: openLevel,
      status: 'running',
    });
    get().next();
  },

  next: () => {
    const s = get();
    if (!s.config || s.status === 'idle') return;
    const done = s.planned();
    if (s.config.count !== null && done >= s.config.count) {
      void get().finish();
      return;
    }
    if (s.deadline !== null && Date.now() >= s.deadline) {
      void get().finish();
      return;
    }
    if (s.config.mode === 'review') {
      const m = s.queue[done];
      if (!m) {
        void get().finish();
        return;
      }
      set({ question: m.question, mistakeId: m.id, extra: false });
      return;
    }
    const player = usePlayer.getState();
    const openLevel = openLevelFrom(
      Array.from(player.openLessons).map((id) => LESSONS.find((l) => l.id === id)?.level ?? 1),
      useSettings.getState().settings.placedLevel,
    );
    const q = nextPracticeQuestion(
      s.config,
      { progress: player.topics, poolTopicIds: defaultPool(player.topics, openLevel), recentGenerators: s.recent },
      rng,
    );
    set({ question: q, mistakeId: null, extra: false, recent: [...s.recent, q.generatorId].slice(-8) });
  },

  similar: () => {
    const q = get().question;
    if (!q) return;
    const g = getGenerator(q.generatorId);
    if (!g) return;
    let fresh = q;
    for (let i = 0; i < 6 && fresh.id === q.id; i++) fresh = makeQuestion(g, nearestLevel(g, q.difficulty), rng);
    set({ question: fresh, mistakeId: null, extra: true });
  },

  submit: async (answer, hintsUsed, timeMs) => {
    const s = get();
    const q = s.question;
    if (!q) throw new Error('no question');
    const verdict = checkAnswer(q, answer);
    const player = usePlayer.getState();
    const settings = useSettings.getState().settings;
    const prevLevel = player.level.level;
    let xp = 0;
    try {
      const out = await recordAttempt({
        question: q,
        answer,
        verdict,
        hintsUsed,
        timeMs,
        sessionId: s.sessionId,
        topic: player.topics[q.topicId],
        lessonDone: LESSONS.some((l) => l.topicId === q.topicId && player.doneLessons.has(l.id)),
        adaptive: settings.adaptive,
        awardXp: true,
        saveMistake: true,
        mistakeId: s.mistakeId,
      });
      xp = out.xp;
    } catch (e) {
      logEvent('error', `recordAttempt failed: ${String(e)}`);
    }
    set({
      results: [...s.results, { questionId: q.id, topicId: q.topicId, correct: verdict.correct, xp, hints: hintsUsed, timeMs, extra: s.extra }],
    });
    await usePlayer.getState().afterProgress(prevLevel);
    return { verdict, xp };
  },

  finish: async () => {
    const s = get();
    if (s.status !== 'running') return;
    set({ status: 'summary', question: null });
    if (s.sessionId !== null) {
      try {
        await endSession(s.sessionId);
      } catch (e) {
        logEvent('error', `endSession failed: ${String(e)}`);
      }
    }
    await usePlayer.getState().afterProgress();
  },

  reset: () => set({ ...initial }),
}));
