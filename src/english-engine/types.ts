import type { L10n } from '@/types';

/** CEFR-style levels. Adding a level (e.g. 'c1') only needs an entry here and in content/english/levels.ts. */
export const EN_LEVELS = ['starter', 'a1', 'a2', 'b1', 'b2'] as const;
export type EnLevel = (typeof EN_LEVELS)[number];

export const EN_SKILLS = ['vocab', 'grammar', 'listening', 'reading', 'writing'] as const;
export type EnSkill = (typeof EN_SKILLS)[number];

export const levelIndex = (l: EnLevel): number => EN_LEVELS.indexOf(l);

export type PartOfSpeech = 'noun' | 'verb' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'det' | 'interj' | 'phrase' | 'num';

export interface EnWord {
  id: string;
  en: string;
  ar: string;
  pos: PartOfSpeech;
  /** Plain-letters respelling, stressed syllable in CAPS: "BYOO-tih-ful". */
  pron: string;
  exEn: string;
  exAr: string;
  level: EnLevel;
  category: string;
}

/** Grammar topics: a short Arabic-first explanation, pattern box, examples and common mistakes. */
export interface GrammarTopic {
  id: string;
  level: EnLevel;
  title: L10n;
  summary: L10n;
  body: L10n[];
  /** Formula lines such as "I am / You are / He is". Always English. */
  patterns: string[];
  examples: { en: string; ar: string }[];
  mistakes: { wrong: string; right: string; note: L10n }[];
  /** Mistake pattern id used by english_mistakes (be-verb, article, ...). */
  pattern: string;
}

export type ExerciseKind =
  | 'mcq'
  | 'fill-blank'
  | 'en-ar'
  | 'ar-en'
  | 'choose-word'
  | 'choose-sentence'
  | 'sentence-order'
  | 'word-order'
  | 'matching'
  | 'grammar-fix'
  | 'complete-sentence'
  | 'vocab-recall'
  | 'listen-choose'
  | 'listen-type'
  | 'reading-comp'
  | 'true-false'
  | 'short-written';

export const EXERCISE_KINDS: ExerciseKind[] = [
  'mcq',
  'fill-blank',
  'en-ar',
  'ar-en',
  'choose-word',
  'choose-sentence',
  'sentence-order',
  'word-order',
  'matching',
  'grammar-fix',
  'complete-sentence',
  'vocab-recall',
  'listen-choose',
  'listen-type',
  'reading-comp',
  'true-false',
  'short-written',
];

interface Base {
  id: string;
  skill: EnSkill;
  /** Lesson / word / grammar id the question belongs to. */
  ref?: string;
  /** Mistake pattern (be-verb, article, plural, word-order, ...). */
  pattern?: string;
  explain?: L10n;
  hint?: L10n;
}

/** Multiple choice with plain strings. `answer` is an index into `options`. */
interface Choice extends Base {
  options: string[];
  answer: number;
}

export type Exercise =
  | (Choice & { kind: 'mcq'; prompt: string })
  | (Choice & { kind: 'en-ar'; prompt: string })
  | (Choice & { kind: 'ar-en'; prompt: string })
  | (Choice & { kind: 'choose-word'; prompt: string })
  | (Choice & { kind: 'choose-sentence'; prompt: string })
  | (Choice & { kind: 'complete-sentence'; prompt: string; stem: string })
  | (Choice & { kind: 'listen-choose'; say: string; prompt: string })
  | (Choice & { kind: 'reading-comp'; passage: string; prompt: string })
  | (Base & { kind: 'true-false'; statement: string; answer: boolean })
  | (Base & { kind: 'fill-blank'; sentence: string; answers: string[]; translation?: string })
  | (Base & { kind: 'grammar-fix'; wrong: string; answers: string[] })
  | (Base & { kind: 'listen-type'; say: string; answers: string[] })
  | (Base & { kind: 'vocab-recall'; prompt: string; answers: string[]; wordId?: string })
  | (Base & { kind: 'word-order'; words: string[]; answer: string; accept?: string[]; translation?: string })
  | (Base & { kind: 'sentence-order'; lines: string[]; prompt?: string })
  | (Base & { kind: 'matching'; pairs: [string, string][] })
  | (Base & { kind: 'short-written'; prompt: string; accept: string[]; keywords?: string[][]; sample: string });

export type ExerciseOf<K extends ExerciseKind> = Extract<Exercise, { kind: K }>;

/** What the learner submitted. Shape depends on the exercise kind. */
export type Response =
  | { kind: 'choice'; index: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'text'; text: string }
  | { kind: 'order'; items: string[] }
  | { kind: 'pairs'; pairs: Record<string, string> };

export interface GradeResult {
  correct: boolean;
  /** Typed answer was within one typo of an accepted one. Counts as wrong but gets a friendlier message. */
  close?: boolean;
  /** Human-readable correct answer (always shown after a miss). */
  expected: string;
  /** What the learner gave, as plain text (stored for the mistakes list). */
  given: string;
}

/* ---------- lessons ---------- */

export type LessonStep =
  | { type: 'explain'; title: L10n; body: L10n[] }
  | { type: 'examples'; title: L10n; items: { en: string; ar: string; breakdown?: [string, string][] }[] }
  | { type: 'pronounce'; title: L10n; items: { en: string; ar: string }[] }
  | { type: 'vocab'; title: L10n; ids: string[] }
  | { type: 'tryit'; exercise: Exercise }
  | { type: 'practice'; title: L10n; exercises: Exercise[] }
  | { type: 'summary'; points: L10n[] };

export interface EnLesson {
  id: string;
  level: EnLevel;
  order: number;
  title: L10n;
  summary: L10n;
  minutes: number;
  skills: EnSkill[];
  /** Vocabulary added to review when the lesson is finished. */
  vocab: string[];
  grammarId?: string;
  steps: LessonStep[];
}

export interface Reading {
  id: string;
  level: EnLevel;
  title: L10n;
  /** Paragraphs of plain English. Tap a word to see its meaning. */
  paragraphs: string[];
  /** Arabic translation, one entry per paragraph. */
  translation: string[];
  questions: ExerciseOf<'reading-comp' | 'true-false'>[];
  /** Words with a gloss specific to this text (lowercase word → Arabic). Falls back to the vocabulary list. */
  gloss: Record<string, string>;
}

export interface ListeningItem {
  id: string;
  level: EnLevel;
  title: L10n;
  /** Lines spoken one after another. */
  lines: { who?: string; text: string; ar: string }[];
  questions: Exercise[];
}

export interface WritingPrompt {
  id: string;
  level: EnLevel;
  title: L10n;
  prompt: L10n;
  /** Starter sentence frames shown as help. */
  frames: string[];
  minWords: number;
  /** Things a good answer should include (any-of groups). Used by the deterministic checker. */
  expect: { label: L10n; any: string[] }[];
  sample: string;
}

export interface SpeakingPhrase {
  id: string;
  level: EnLevel;
  en: string;
  ar: string;
  tip: L10n;
}

export interface PlacementQuestion {
  id: string;
  level: EnLevel;
  exercise: Extract<Exercise, { kind: 'mcq' | 'choose-word' | 'true-false' | 'reading-comp' | 'en-ar' | 'ar-en' }>;
}

export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';
