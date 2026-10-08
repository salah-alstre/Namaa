import { create } from 'zustand';
import { LESSON_BY_ID, EXERCISE_BY_ID } from '@/content/english';
import {
  addEnWords,
  completeEnLesson,
  enAttemptTotals,
  enReviewedToday,
  englishXp,
  loadEnBookmarks,
  loadEnLessons,
  loadEnMistakes,
  loadEnPlacements,
  loadEnSkills,
  loadEnSpeaking,
  loadEnVocab,
  markEnMistakeUnderstood,
  recordEnAttempt,
  saveEnMistake,
  saveEnPlacement,
  saveEnReview,
  saveEnSpeaking,
  saveEnWriting,
  loadEnWriting,
  type EnWritingRow,
  setEnBookmark,
  setEnWordFlag,
  touchEnLesson,
  type EnLessonRow,
  type EnMistake,
  type EnPlacementRow,
  type EnSkillRow,
  type EnVocabRow,
} from '@/database/repos/english';
import { gradeExercise } from '@/english-engine/grade';
import { englishLessonXp, englishQuestionXp, enReason, reviewXp } from '@/english-engine/progress';
import { isDue, schedule } from '@/english-engine/srs';
import type { EnLevel, Exercise, Response, SrsGrade } from '@/english-engine/types';
import { usePlayer } from './player';

interface EnglishState {
  ready: boolean;
  lessons: Record<string, EnLessonRow>;
  vocab: Record<string, EnVocabRow>;
  skills: Record<string, EnSkillRow>;
  mistakes: EnMistake[];
  bookmarks: Record<string, string>;
  speaking: Record<string, number>;
  placements: EnPlacementRow[];
  writing: EnWritingRow[];
  attempts: { total: number; correct: number; today: number };
  xp: number;
  reviewedToday: number;

  reload: () => Promise<void>;
  dueWords: (now?: number) => EnVocabRow[];
  openMistakes: () => EnMistake[];
  openLesson: (lessonId: string, step: number) => Promise<void>;
  finishLesson: (lessonId: string, stars: number, minutes: number) => Promise<{ xp: number; firstTime: boolean; added: number }>;
  addWords: (ids: string[], source: string) => Promise<number>;
  reviewWord: (wordId: string, grade: SrsGrade) => Promise<void>;
  toggleFlag: (wordId: string, flag: 'favorite' | 'difficult') => Promise<void>;
  /** Grades a response, records the attempt, stores a mistake when wrong and awards XP. */
  answer: (ex: Exercise, response: Response, timeMs?: number, hints?: number) => Promise<{ correct: boolean; close?: boolean; expected: string; given: string; xp: number }>;
  understood: (exerciseId: string, on: boolean) => Promise<void>;
  setBookmark: (kind: string, ref: string, state: 'saved' | 'done' | null) => Promise<void>;
  rateSpeaking: (phraseId: string, rating: 1 | 2 | 3) => Promise<void>;
  saveWriting: (promptId: string, body: string, checks: { label: string; ok: boolean }[]) => Promise<void>;
  savePlacement: (level: EnLevel, score: number, total: number, correct: number, detail: unknown) => Promise<void>;
}

export const useEnglish = create<EnglishState>((set, get) => ({
  ready: false,
  lessons: {},
  vocab: {},
  skills: {},
  mistakes: [],
  bookmarks: {},
  speaking: {},
  placements: [],
  writing: [],
  attempts: { total: 0, correct: 0, today: 0 },
  xp: 0,
  reviewedToday: 0,

  reload: async () => {
    const [lessons, vocab, skills, mistakes, bookmarks, speaking, placements, writing, attempts, xp, reviewedToday] = await Promise.all([
      loadEnLessons(),
      loadEnVocab(),
      loadEnSkills(),
      loadEnMistakes(),
      loadEnBookmarks(),
      loadEnSpeaking(),
      loadEnPlacements(),
      loadEnWriting(),
      enAttemptTotals(),
      englishXp(),
      enReviewedToday(),
    ]);
    set({ ready: true, lessons, vocab, skills, mistakes, bookmarks, speaking, placements, writing, attempts, xp, reviewedToday });
  },

  dueWords: (now = Date.now()) =>
    Object.values(get().vocab)
      .filter((w) => isDue(w, now))
      .sort((a, b) => a.dueAt - b.dueAt),

  openMistakes: () => get().mistakes.filter((m) => !m.understood),

  openLesson: async (lessonId, step) => {
    await touchEnLesson(lessonId, step);
    set({ lessons: await loadEnLessons() });
  },

  finishLesson: async (lessonId, stars, minutes) => {
    const was = get().lessons[lessonId]?.status === 'completed';
    const first = await completeEnLesson(lessonId, stars);
    const lesson = LESSON_BY_ID[lessonId];
    const added = lesson ? await addEnWords(lesson.vocab, `lesson:${lessonId}`) : 0;
    const xp = first && !was ? englishLessonXp(stars) : 0;
    await usePlayer.getState().grant(xp, enReason('lesson'), { lessons: first && !was ? 1 : 0, minutes: Math.max(0, Math.round(minutes)) });
    await get().reload();
    return { xp, firstTime: first && !was, added };
  },

  addWords: async (ids, source) => {
    const n = await addEnWords(ids, source);
    if (n) set({ vocab: await loadEnVocab() });
    return n;
  },

  reviewWord: async (wordId, grade) => {
    const row = get().vocab[wordId];
    if (!row) return;
    const card = schedule(row, grade, Date.now());
    await saveEnReview(wordId, card, grade !== 'again');
    await usePlayer.getState().grant(reviewXp(grade), enReason('review'), { questions: 1, correct: grade === 'again' ? 0 : 1 });
    await get().reload();
  },

  toggleFlag: async (wordId, flag) => {
    const row = get().vocab[wordId];
    if (!row) return;
    await setEnWordFlag(wordId, flag, !row[flag]);
    set({ vocab: await loadEnVocab() });
  },

  answer: async (ex, response, timeMs = 0, hints = 0) => {
    const g = gradeExercise(ex, response);
    await recordEnAttempt({ exercise: { id: ex.id, kind: ex.kind, skill: ex.skill, ref: ex.ref }, correct: g.correct, answer: g.given, timeMs });
    if (!g.correct) {
      await saveEnMistake({
        exerciseId: ex.id,
        kind: ex.kind,
        skill: ex.skill,
        patternId: ex.pattern,
        refId: ex.ref,
        prompt: promptOf(ex),
        given: g.given,
        expected: g.expected,
        explanation: ex.explain ?? null,
      });
    } else {
      // Getting it right again counts as having understood an earlier mistake.
      if (get().mistakes.some((m) => m.exerciseId === ex.id && !m.understood)) await markEnMistakeUnderstood(ex.id, true);
    }
    const xp = englishQuestionXp(g.correct, hints);
    await usePlayer.getState().grant(xp, enReason('question'), { questions: 1, correct: g.correct ? 1 : 0 });
    await get().reload();
    return { ...g, xp };
  },

  understood: async (exerciseId, on) => {
    await markEnMistakeUnderstood(exerciseId, on);
    set({ mistakes: await loadEnMistakes() });
  },

  rateSpeaking: async (phraseId, rating) => {
    await saveEnSpeaking(phraseId, rating);
    set({ speaking: await loadEnSpeaking() });
  },

  saveWriting: async (promptId, body, checks) => {
    await saveEnWriting(promptId, body, checks);
    set({ writing: await loadEnWriting() });
  },

  savePlacement: async (level, score, total, correct, detail) => {
    await saveEnPlacement(level, score, total, correct, detail);
    set({ placements: await loadEnPlacements() });
  },

  setBookmark: async (kind, ref, state) => {
    await setEnBookmark(kind, ref, state);
    set({ bookmarks: await loadEnBookmarks() });
  },
}));

/** A short human-readable prompt for the mistakes list. */
export function promptOf(ex: Exercise): string {
  switch (ex.kind) {
    case 'true-false':
      return ex.statement;
    case 'fill-blank':
      return ex.sentence;
    case 'grammar-fix':
      return ex.wrong;
    case 'listen-type':
      return ex.say;
    case 'word-order':
      return ex.words.join(' / ');
    case 'sentence-order':
      return ex.prompt ?? ex.lines.join(' / ');
    case 'matching':
      return ex.pairs.map((p) => p[0]).join(', ');
    case 'complete-sentence':
      return ex.stem;
    default:
      return ex.prompt;
  }
}

export const exerciseById = (id: string): Exercise | undefined => EXERCISE_BY_ID[id];
