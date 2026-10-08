// Shared domain types. Everything here is plain, serialisable data.

export type Lang = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark' | 'system';

/** A bilingual string. Math is embedded as $...$ (LaTeX) and always rendered left-to-right. */
export interface L10n {
  en: string;
  ar: string;
}

/** 1 Very Easy · 2 Easy · 3 Medium · 4 Hard · 5 Expert */
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5];

export type QType =
  | 'mcq'
  | 'type-answer'
  | 'true-false'
  | 'fill-blank'
  | 'solve-equation'
  | 'compare'
  | 'select-formula'
  | 'ordering'
  | 'matching'
  | 'word-problem';

export const QTYPES: QType[] = [
  'mcq',
  'type-answer',
  'true-false',
  'fill-blank',
  'solve-equation',
  'compare',
  'select-formula',
  'ordering',
  'matching',
  'word-problem',
];

// ───────────────────────── Questions ─────────────────────────

export interface Option {
  id: string;
  label: L10n;
}

/**
 * How an answer is checked. Numbers are stored as exact fractions ("p/q") so that
 * 1/2, 0.5 and 50% are all the same value.
 */
export type AnswerSpec =
  | {
      kind: 'number';
      value: string;
      tolerance?: number;
      integerOnly?: boolean;
      /** Require the fraction to be fully simplified (e.g. 2/4 is not accepted). */
      lowest?: boolean;
      /** The answer is a percentage: a bare "50" is read as 50%, and "0.5" is not. */
      percent?: boolean;
    }
  | { kind: 'numbers'; values: string[]; ordered?: boolean }
  | {
      kind: 'expression';
      value: string;
      variable?: string;
      /** Optional required form: 'expanded' rejects unexpanded products such as (x+1)(x+2). */
      requireForm?: 'expanded';
    }
  | { kind: 'text'; accepted: string[] }
  | { kind: 'choice'; correct: string[] }
  | { kind: 'bool'; value: boolean }
  | { kind: 'order'; order: string[] }
  | { kind: 'match'; pairs: Record<string, string> };

export type UserAnswer = string | boolean | string[] | Record<string, string>;

export interface LikelyError {
  /** Canonical wrong answer ("p/q" for numbers, option id for choices, 'true'/'false', 'a,b,c' for orders). */
  answer: string;
  patternId: string;
}

export type InputMode = 'number' | 'expression' | 'text' | 'numbers';

export interface Question {
  id: string;
  generatorId: string;
  topicId: string;
  qtype: QType;
  difficulty: Difficulty;
  prompt: L10n;
  /** Optional large display expression shown under the prompt. */
  display?: string;
  options?: Option[];
  items?: Option[];
  left?: Option[];
  right?: Option[];
  answer: AnswerSpec;
  inputMode?: InputMode;
  /** Text shown after the input (unit, "%", ...). */
  suffix?: string;
  /** Human-readable correct answer. */
  correctText: L10n;
  hints: [L10n, L10n, L10n];
  steps: L10n[];
  explanation: L10n;
  likelyErrors?: LikelyError[];
}

export interface Generator {
  id: string;
  topicId: string;
  qtype: QType;
  /** Difficulty levels this generator is meaningful at. */
  levels: Difficulty[];
  /** Build a question. Must be deterministic for a given rng state. */
  make: (rng: Rng, difficulty: Difficulty) => Omit<Question, 'id' | 'generatorId' | 'topicId' | 'qtype' | 'difficulty'>;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  chance(p: number): boolean;
  sample<T>(arr: readonly T[], n: number): T[];
  readonly seed: number;
}

export interface Verdict {
  correct: boolean;
  /** Set when the answer could not be understood at all. */
  unparsed?: boolean;
  /** Pattern id of a likely error, when one matched. */
  patternId?: string;
  /** Canonical form of what the user answered. */
  canonical?: string;
}

// ───────────────────────── Curriculum ─────────────────────────

export type VisualSpec =
  | { type: 'fraction-bar'; num: number; den: number }
  | { type: 'pie'; num: number; den: number }
  | { type: 'number-line'; min: number; max: number; marks?: number[]; step?: number; jump?: { from: number; to: number } }
  | { type: 'grid'; rows: number; cols: number; shaded?: number }
  | { type: 'balance'; left: string; right: string }
  | { type: 'shape'; shape: 'rect' | 'triangle' | 'circle' | 'square' | 'right-triangle'; labels: string[] }
  | { type: 'angle'; degrees: number }
  | { type: 'bars'; values: { label: string; value: number }[] }
  | { type: 'line-graph'; m: number; b: number }
  | { type: 'place-value'; value: string }
  | { type: 'none' };

export interface Topic {
  id: string;
  level: number; // 1..7
  order: number;
  title: L10n;
  summary: L10n;
  icon: string; // lucide icon name
}

export interface LessonExample {
  problem: L10n;
  steps: L10n[];
  result: L10n;
}

export interface Lesson {
  id: string;
  topicId: string;
  level: number;
  order: number;
  minutes: number;
  title: L10n;
  summary: L10n;
  explanation: L10n[];
  visual: VisualSpec;
  visualCaption?: L10n;
  example: LessonExample;
  why: L10n;
  /** Generators used for the interactive "Try it yourself" and the Quick Check. */
  tryGenerator: string;
  checkGenerators: string[];
  keywords: L10n;
}

export interface LevelInfo {
  level: number;
  title: L10n;
  summary: L10n;
  color: string;
}

export type FormulaCategory =
  | 'arithmetic'
  | 'fractions'
  | 'percentages'
  | 'algebra'
  | 'geometry'
  | 'trigonometry'
  | 'statistics'
  | 'probability';

export interface Formula {
  id: string;
  category: FormulaCategory;
  name: L10n;
  latex: string;
  explanation: L10n;
  variables: { symbol: string; meaning: L10n }[];
  example: { problem: L10n; solution: string };
  whenToUse: L10n;
  topicId?: string;
}

export interface MistakePattern {
  id: string;
  title: L10n;
  description: L10n;
  tip: L10n;
}

export interface AchievementDef {
  id: string;
  icon: string;
  title: L10n;
  description: L10n;
  hidden?: boolean;
  xp: number;
}

// ───────────────────────── Persistence rows ─────────────────────────

export type ComfortLevel = 'beginner' | 'some' | 'comfortable';
export type Goal = 'zero' | 'everyday' | 'algebra' | 'school' | 'general';

export interface Profile {
  name: string;
  avatar: string;
  comfortLevel: ComfortLevel;
  goal: Goal;
  onboarded: boolean;
  placementDone: boolean;
  createdAt: number;
}

export interface TopicProgress {
  topicId: string;
  mastery: number;
  attempts: number;
  correct: number;
  recent: string;
  difficulty: number;
  lastPracticed: number | null;
  totalTimeMs: number;
}

export interface LessonProgress {
  lessonId: string;
  status: 'started' | 'completed';
  step: number;
  stars: number;
  startedAt: number;
  completedAt: number | null;
  lastOpened: number;
}

export type SessionMode =
  | 'normal'
  | 'quick'
  | 'endless'
  | 'timed'
  | 'weak'
  | 'mix'
  | 'review'
  | 'daily'
  | 'placement'
  | 'lesson';

export interface AttemptRow {
  id: number;
  sessionId: number | null;
  examId: number | null;
  topicId: string;
  generatorId: string;
  qtype: QType;
  difficulty: Difficulty;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  hintsUsed: number;
  timeMs: number;
  xp: number;
  createdAt: number;
}

export interface MistakeRow {
  id: number;
  topicId: string;
  generatorId: string;
  qtype: QType;
  difficulty: Difficulty;
  question: Question;
  userAnswer: string | null;
  correctAnswer: string;
  patternId: string | null;
  timesWrong: number;
  timesRetried: number;
  understood: boolean;
  favorite: boolean;
  createdAt: number;
  lastSeen: number;
}

export type ExamKind = 'quick' | 'topic' | 'level' | 'mixed' | 'custom' | 'final';

export interface ExamConfig {
  kind: ExamKind;
  topicIds: string[];
  level?: number;
  count: number;
  difficulty: Difficulty | 'mixed';
  timeLimitS: number | null;
}

export interface ExamRow {
  id: number;
  kind: ExamKind;
  title: string;
  config: ExamConfig;
  questions: Question[];
  answers: Record<string, UserAnswer | null>;
  times: Record<string, number>;
  flags: string[];
  timeLimitS: number | null;
  elapsedS: number;
  status: 'in_progress' | 'finished' | 'abandoned';
  score: number | null;
  total: number;
  startedAt: number;
  finishedAt: number | null;
}

export interface ActivityDay {
  day: string;
  xp: number;
  questions: number;
  correct: number;
  lessons: number;
  minutes: number;
}

export interface DailyChallengeRow {
  day: string;
  seed: number;
  completed: boolean;
  score: number;
  total: number;
  completedAt: number | null;
}

// ───────────────────────── Settings ─────────────────────────

export type StartPage =
  | 'home'
  | 'math'
  | 'en-home'
  | 'review'
  | 'learn'
  | 'practice'
  | 'challenges'
  | 'exams'
  | 'mistakes'
  | 'formulas'
  | 'progress'
  | 'achievements'
  | 'settings';

export interface Settings {
  language: Lang;
  theme: ThemeMode;
  startPage: StartPage;
  dailyGoal: number;
  adaptive: boolean;
  showSolutionAuto: boolean;
  autoNext: boolean;
  density: 'comfortable' | 'compact';
  reducedMotion: 'system' | 'on' | 'off';
  textSize: 'sm' | 'md' | 'lg' | 'xl';
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  reminderTime: string;
  unlockAll: boolean;
  arabicDigits: boolean;
  lastBackupAt: number;
  lastWeeklySeen: string;
  /** Highest level opened up by the placement test (lessons up to it start unlocked). */
  placedLevel: number;
  /** English: preferred speechSynthesis voice URI ('' = automatic). */
  enVoice: string;
  /** English: default speaking speed (0.65, 0.75, 1 or 1.1). */
  enRate: number;
  enAutoPlay: boolean;
  /** English pronunciation: 'system' (device voice) or a neural cloud provider. */
  ttsProvider: 'system' | 'azure' | 'elevenlabs';
  /** Azure region (e.g. eastus). Not secret; the API key lives in the OS credential store. */
  ttsRegion: string;
  /** Cloud voice id ('' = first voice for the accent). */
  ttsVoice: string;
  enAccent: 'us' | 'gb';
  enStartLevel: 'starter' | 'a1' | 'a2' | 'b1' | 'b2';
  enShowTranslation: boolean;
  enArabicHelp: boolean;
  /** English daily goal, in exercises + reviews. */
  enDailyGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'system',
  startPage: 'home',
  dailyGoal: 20,
  adaptive: true,
  showSolutionAuto: true,
  autoNext: false,
  density: 'comfortable',
  reducedMotion: 'system',
  textSize: 'md',
  soundEnabled: true,
  soundVolume: 0.4,
  notificationsEnabled: false,
  reminderTime: '19:00',
  unlockAll: false,
  arabicDigits: false,
  lastBackupAt: 0,
  lastWeeklySeen: '',
  placedLevel: 1,
  enVoice: '',
  enRate: 1,
  enAutoPlay: false,
  ttsProvider: 'system',
  ttsRegion: 'eastus',
  ttsVoice: '',
  enAccent: 'us',
  enStartLevel: 'starter',
  enShowTranslation: true,
  enArabicHelp: true,
  enDailyGoal: 15,
};

// ───────────────────────── Routing ─────────────────────────

export type Route =
  | { name: 'home' }
  | { name: 'math' }
  | { name: 'review' }
  | { name: 'en-home' }
  | { name: 'en-quick' }
  | { name: 'en-learn' }
  | { name: 'en-lesson'; lessonId: string }
  | { name: 'en-vocab' }
  | { name: 'en-review' }
  | { name: 'en-grammar'; topicId?: string }
  | { name: 'en-practice'; pattern?: string; skill?: string }
  | { name: 'en-listening' }
  | { name: 'en-reading' }
  | { name: 'en-writing' }
  | { name: 'en-speaking' }
  | { name: 'en-placement' }
  | { name: 'en-mistakes' }
  | { name: 'en-progress' }
  | { name: 'learn' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'practice' }
  | { name: 'practice-run' }
  | { name: 'challenges' }
  | { name: 'exams' }
  | { name: 'exam-run'; examId: number }
  | { name: 'exam-result'; examId: number }
  | { name: 'mistakes' }
  | { name: 'formulas' }
  | { name: 'progress' }
  | { name: 'achievements' }
  | { name: 'settings' }
  | { name: 'placement' };
