import { create } from 'zustand';
import { LESSONS } from '@/content/lessons';
import { recordAttempt } from '@/database/repos/attempts';
import { abandonExam, createExam, finishExam, findOpenExam, loadExam, saveExamProgress } from '@/database/repos/exams';
import { buildExamQuestions, defaultPool, examTitleKey, openLevelFrom } from '@/domain/planner';
import { examXp } from '@/domain/xp';
import { currentI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { checkAnswer } from '@/math-engine/validate';
import { randomSeed } from '@/math-engine/rng';
import type { ExamConfig, ExamRow, UserAnswer, Verdict } from '@/types';
import { usePlayer } from './player';
import { useSettings } from './settings';

export interface ExamGrade {
  verdicts: Record<string, Verdict>;
  score: number;
  total: number;
  xp: number;
}

interface ExamState {
  exam: ExamRow | null;
  index: number;
  answers: Record<string, UserAnswer | null>;
  times: Record<string, number>;
  flags: string[];
  elapsedS: number;
  /** Set once the paper is handed in. */
  grade: ExamGrade | null;
  submitting: boolean;
  /** When the current question was shown (for per-question timing). */
  shownAt: number;

  begin: (cfg: ExamConfig) => Promise<number>;
  resume: (id: number) => Promise<boolean>;
  /** An unfinished exam left behind by closing the app, if any. */
  findOpen: () => Promise<ExamRow | null>;
  setAnswer: (qid: string, a: UserAnswer | null) => void;
  go: (index: number) => void;
  toggleFlag: (qid: string) => void;
  tick: () => void;
  submit: () => Promise<ExamGrade | null>;
  abandon: () => Promise<void>;
  leave: () => void;
  persist: () => Promise<void>;
}

const blank = {
  exam: null,
  index: 0,
  answers: {} as Record<string, UserAnswer | null>,
  times: {} as Record<string, number>,
  flags: [] as string[],
  elapsedS: 0,
  grade: null,
  submitting: false,
  shownAt: 0,
};

/** Adds the time spent on the question being left to its running total. */
function settleTime(s: ExamState): Record<string, number> {
  const q = s.exam?.questions[s.index];
  if (!q || !s.shownAt) return s.times;
  return { ...s.times, [q.id]: (s.times[q.id] ?? 0) + (Date.now() - s.shownAt) };
}

export const useExam = create<ExamState>((set, get) => ({
  ...blank,

  begin: async (cfg) => {
    const player = usePlayer.getState();
    const openLevel = openLevelFrom(
      Array.from(player.openLessons).map((id) => LESSONS.find((l) => l.id === id)?.level ?? 1),
      useSettings.getState().settings.placedLevel,
    );
    const questions = buildExamQuestions(cfg, { progress: player.topics, poolTopicIds: defaultPool(player.topics, openLevel) }, randomSeed());
    const title = currentI18n().t(examTitleKey(cfg.kind) as never);
    const id = await createExam(title, cfg, questions);
    const exam = await loadExam(id);
    if (!exam) throw new Error('exam_create_failed');
    set({ ...blank, exam, shownAt: Date.now() });
    return id;
  },

  resume: async (id) => {
    const exam = await loadExam(id);
    if (!exam || exam.status !== 'in_progress') return false;
    set({ ...blank, exam, answers: exam.answers, times: exam.times, flags: exam.flags, elapsedS: exam.elapsedS, shownAt: Date.now() });
    return true;
  },

  findOpen: () => findOpenExam(),

  setAnswer: (qid, a) => {
    set({ answers: { ...get().answers, [qid]: a } });
  },

  go: (index) => {
    const s = get();
    if (!s.exam || index < 0 || index >= s.exam.questions.length || index === s.index) return;
    set({ times: settleTime(s), index, shownAt: Date.now() });
    void get().persist();
  },

  toggleFlag: (qid) => {
    const f = get().flags;
    set({ flags: f.includes(qid) ? f.filter((x) => x !== qid) : [...f, qid] });
    void get().persist();
  },

  tick: () => {
    const s = get();
    if (!s.exam || s.grade || s.submitting) return;
    const elapsedS = s.elapsedS + 1;
    set({ elapsedS });
    if (elapsedS % 10 === 0) void get().persist();
    if (s.exam.timeLimitS !== null && elapsedS >= s.exam.timeLimitS) void get().submit();
  },

  persist: async () => {
    const s = get();
    if (!s.exam || s.grade) return;
    try {
      await saveExamProgress(s.exam.id, { answers: s.answers, times: settleTime(s), flags: s.flags, elapsedS: s.elapsedS });
    } catch (e) {
      logEvent('warn', `exam autosave failed: ${String(e)}`);
    }
  },

  submit: async () => {
    const s = get();
    if (!s.exam || s.grade || s.submitting) return null;
    set({ submitting: true });
    const times = settleTime(s);
    const exam = s.exam;
    const player = usePlayer.getState();
    const prevLevel = player.level.level;
    const verdicts: Record<string, Verdict> = {};
    let score = 0;
    for (const q of exam.questions) {
      const a = s.answers[q.id] ?? null;
      const v = a === null ? { correct: false } : checkAnswer(q, a);
      verdicts[q.id] = v;
      if (v.correct) score++;
    }
    const total = exam.questions.length;
    const xp = examXp(score, total);
    try {
      // Record sequentially: each attempt updates the same topic row.
      for (const q of exam.questions) {
        const a = s.answers[q.id] ?? null;
        const topic = usePlayer.getState().topics[q.topicId];
        await recordAttempt({
          question: q,
          answer: a,
          verdict: verdicts[q.id] as Verdict,
          hintsUsed: 0,
          timeMs: times[q.id] ?? 0,
          examId: exam.id,
          topic,
          lessonDone: LESSONS.some((l) => l.topicId === q.topicId && player.doneLessons.has(l.id)),
          adaptive: false,
          awardXp: false,
          saveMistake: true,
          mistakeId: null,
        });
      }
      await finishExam(exam.id, score, s.elapsedS);
      await usePlayer.getState().grant(xp, `exam:${exam.id}`);
    } catch (e) {
      logEvent('error', `exam submit failed: ${String(e)}`);
    }
    await usePlayer.getState().afterProgress(prevLevel);
    const grade: ExamGrade = { verdicts, score, total, xp };
    set({ grade, submitting: false, times, exam: { ...exam, status: 'finished', score, elapsedS: s.elapsedS, finishedAt: Date.now() } });
    return grade;
  },

  abandon: async () => {
    const e = get().exam;
    if (e && !get().grade) {
      try {
        await abandonExam(e.id);
      } catch (err) {
        logEvent('warn', `abandon failed: ${String(err)}`);
      }
    }
    set({ ...blank });
  },

  leave: () => set({ ...blank }),
}));
