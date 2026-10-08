import type { L10n } from '@/types';
import type { EnLevel } from '@/english-engine/types';

export interface LevelInfo {
  id: EnLevel;
  code: string;
  name: L10n;
  blurb: L10n;
  /** What you can do at the end of the level. */
  can: L10n[];
}

export const LEVELS: LevelInfo[] = [
  {
    id: 'starter',
    code: 'A0',
    name: { en: 'Starter', ar: 'البداية' },
    blurb: { en: 'Letters, greetings, numbers and your first sentences.', ar: 'التحيات والأرقام وأولى جملك بالإنجليزية.' },
    can: [
      { en: 'Greet people and introduce yourself', ar: 'تحيّي الناس وتعرّف بنفسك' },
      { en: 'Count to ten and name colors', ar: 'تعدّ إلى عشرة وتسمّي الألوان' },
      { en: 'Say who people are with am / is / are', ar: 'تقول من يكون الأشخاص باستخدام am / is / are' },
    ],
  },
  {
    id: 'a1',
    code: 'A1',
    name: { en: 'Beginner', ar: 'مبتدئ' },
    blurb: { en: 'Daily routines, food, places and simple questions.', ar: 'الروتين اليومي والطعام والأماكن والأسئلة البسيطة.' },
    can: [
      { en: 'Talk about your day in the present simple', ar: 'تتحدث عن يومك بالمضارع البسيط' },
      { en: 'Ask and answer simple questions', ar: 'تسأل وتجيب عن أسئلة بسيطة' },
      { en: 'Describe where things are', ar: 'تصف أماكن الأشياء' },
    ],
  },
  {
    id: 'a2',
    code: 'A2',
    name: { en: 'Elementary', ar: 'أساسي' },
    blurb: { en: 'Past events, plans, comparisons and everyday situations.', ar: 'الماضي والخطط والمقارنات والمواقف اليومية.' },
    can: [
      { en: 'Tell a short story in the past', ar: 'تحكي قصة قصيرة في الماضي' },
      { en: 'Compare people and things', ar: 'تقارن بين الأشخاص والأشياء' },
      { en: 'Make plans with going to', ar: 'تضع خططا باستخدام going to' },
    ],
  },
  {
    id: 'b1',
    code: 'B1',
    name: { en: 'Intermediate', ar: 'متوسط' },
    blurb: { en: 'Experiences, opinions, conditionals and longer texts.', ar: 'التجارب والآراء والجمل الشرطية والنصوص الأطول.' },
    can: [
      { en: 'Talk about experiences with the present perfect', ar: 'تتحدث عن تجاربك بالمضارع التام' },
      { en: 'Give opinions and reasons', ar: 'تُبدي رأيك وتذكر أسبابه' },
      { en: 'Use first conditional sentences', ar: 'تستخدم الجمل الشرطية من النوع الأول' },
    ],
  },
  {
    id: 'b2',
    code: 'B2',
    name: { en: 'Upper-intermediate', ar: 'فوق المتوسط' },
    blurb: { en: 'Nuance: passive voice, reported speech and linking ideas.', ar: 'الدقة: المبني للمجهول والكلام المنقول وربط الأفكار.' },
    can: [
      { en: 'Use the passive voice', ar: 'تستخدم المبني للمجهول' },
      { en: 'Report what someone said', ar: 'تنقل كلام شخص آخر' },
      { en: 'Link ideas with however / although / therefore', ar: 'تربط الأفكار بـ however و although و therefore' },
    ],
  },
];

export const LEVEL_BY_ID: Record<EnLevel, LevelInfo> = Object.fromEntries(LEVELS.map((l) => [l.id, l])) as Record<EnLevel, LevelInfo>;
