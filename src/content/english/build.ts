import type { L10n } from '@/types';
import type { EnLesson, EnLevel, EnSkill, Exercise, ExerciseOf, LessonStep } from '@/english-engine/types';
import { wordId } from './vocab';

/** Content-authoring helpers. They only build plain data; nothing here runs at render time. */

export const T = (en: string, ar: string): L10n => ({ en, ar });
export const W = (...words: string[]): string[] => words.map(wordId);

type Extra = { explain?: L10n; hint?: L10n; pattern?: string; skill?: EnSkill; ref?: string };
const ex = (e?: Extra) => ({ skill: 'grammar' as EnSkill, ...e });

export const mcq = (id: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'mcq', prompt, options, answer, ...ex(e),
});
export const enAr = (id: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'en-ar', prompt, options, answer, ...ex({ skill: 'vocab', ...e }),
});
export const arEn = (id: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'ar-en', prompt, options, answer, ...ex({ skill: 'vocab', ...e }),
});
export const chooseWord = (id: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'choose-word', prompt, options, answer, ...ex({ skill: 'vocab', ...e }),
});
export const chooseSentence = (id: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'choose-sentence', prompt, options, answer, ...ex(e),
});
export const complete = (id: string, prompt: string, stem: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'complete-sentence', prompt, stem, options, answer, ...ex(e),
});
export const fill = (id: string, sentence: string, answers: string[], translation?: string, e?: Extra): Exercise => ({
  id, kind: 'fill-blank', sentence, answers, translation, ...ex(e),
});
export const fix = (id: string, wrong: string, answers: string[], e?: Extra): Exercise => ({
  id, kind: 'grammar-fix', wrong, answers, ...ex(e),
});
export const tf = (id: string, statement: string, answer: boolean, e?: Extra): Exercise => ({
  id, kind: 'true-false', statement, answer, ...ex(e),
});
export const recall = (id: string, prompt: string, answers: string[], wordIdValue?: string, e?: Extra): Exercise => ({
  id, kind: 'vocab-recall', prompt, answers, wordId: wordIdValue, ...ex({ skill: 'vocab', ...e }),
});
export const wordOrder = (id: string, words: string[], answer: string, translation?: string, accept?: string[], e?: Extra): Exercise => ({
  id, kind: 'word-order', words, answer, translation, accept, ...ex(e),
});
export const sentenceOrder = (id: string, lines: string[], prompt?: string, e?: Extra): Exercise => ({
  id, kind: 'sentence-order', lines, prompt, ...ex({ skill: 'reading', ...e }),
});
export const matching = (id: string, pairs: [string, string][], e?: Extra): Exercise => ({
  id, kind: 'matching', pairs, ...ex({ skill: 'vocab', ...e }),
});
export const listenChoose = (id: string, say: string, prompt: string, options: string[], answer: number, e?: Extra): Exercise => ({
  id, kind: 'listen-choose', say, prompt, options, answer, ...ex({ skill: 'listening', ...e }),
});
export const listenType = (id: string, say: string, answers: string[], e?: Extra): Exercise => ({
  id, kind: 'listen-type', say, answers, ...ex({ skill: 'listening', ...e }),
});
export const readComp = (id: string, passage: string, prompt: string, options: string[], answer: number, e?: Extra): ExerciseOf<'reading-comp'> => ({
  id, kind: 'reading-comp', passage, prompt, options, answer, ...ex({ skill: 'reading', ...e }),
});
export const readTf = (id: string, statement: string, answer: boolean, e?: Extra): ExerciseOf<'true-false'> => ({
  id, kind: 'true-false', statement, answer, ...ex({ skill: 'reading', ...e }),
}) as ExerciseOf<'true-false'>;
export const written = (
  id: string,
  prompt: string,
  accept: string[],
  sample: string,
  keywords?: string[][],
  e?: Extra,
): Exercise => ({ id, kind: 'short-written', prompt, accept, sample, keywords, ...ex({ skill: 'writing', ...e }) });

/* ---------- steps ---------- */

export const explain = (title: L10n, ...body: L10n[]): LessonStep => ({ type: 'explain', title, body });
export const examples = (title: L10n, items: { en: string; ar: string; breakdown?: [string, string][] }[]): LessonStep => ({
  type: 'examples', title, items,
});
export const pronounce = (title: L10n, items: { en: string; ar: string }[]): LessonStep => ({ type: 'pronounce', title, items });
export const vocabStep = (title: L10n, ids: string[]): LessonStep => ({ type: 'vocab', title, ids });
export const tryIt = (exercise: Exercise): LessonStep => ({ type: 'tryit', exercise });
export const practice = (title: L10n, ...exercises: Exercise[]): LessonStep => ({ type: 'practice', title, exercises });
export const summary = (...points: L10n[]): LessonStep => ({ type: 'summary', points });

export interface LessonDef {
  id: string;
  title: L10n;
  summary: L10n;
  minutes?: number;
  skills?: EnSkill[];
  vocab: string[];
  grammarId?: string;
  steps: LessonStep[];
}

/** Turn a list of definitions into ordered lessons of one level. */
export function levelLessons(level: EnLevel, defs: LessonDef[]): EnLesson[] {
  return defs.map((d, i) => ({
    id: d.id,
    level,
    order: i + 1,
    title: d.title,
    summary: d.summary,
    minutes: d.minutes ?? 8,
    skills: d.skills ?? ['vocab', 'grammar'],
    vocab: d.vocab,
    grammarId: d.grammarId,
    steps: d.steps,
  }));
}
