import { useMemo } from 'react';
import type { L10n, Lang } from '@/types';
import { useSettings } from '@/stores/settings';
import { DICT, type Key } from './dict';
import { dirOf, formatClock, formatMinutes, formatNumber, formatPercent, pick, toArabicDigits, translate, type NumberFormat, type Params } from './core';

export type { Key } from './dict';
export { DICT } from './dict';

export interface I18n {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  t: (key: Key, params?: Params) => string;
  /** A bilingual content string (lesson text, hints…). */
  l: (text: L10n) => string;
  /** Locale-aware number, honouring "Arabic digits". */
  n: (value: number, maxFraction?: number) => string;
  pct: (ratio: number) => string;
  mins: (minutes: number) => string;
  clock: (seconds: number) => string;
  fmt: NumberFormat;
}

export function makeI18n(lang: Lang, arabicDigits: boolean): I18n {
  const fmt: NumberFormat = { lang, arabicDigits };
  const num = (v: number, f = 1) => formatNumber(v, fmt, f);
  const withNums = (params?: Params): Params | undefined => {
    if (!params) return params;
    const out: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) out[k] = typeof v === 'number' ? num(v, Number.isInteger(v) ? 0 : 1) : v;
    return out;
  };
  return {
    lang,
    dir: dirOf(lang),
    isRtl: lang === 'ar',
    t: (key, params) => translate(DICT, key, lang, withNums(params)),
    l: (text) => pick(text, lang),
    n: num,
    pct: (r) => formatPercent(r, fmt),
    mins: (m) => formatMinutes(m, fmt),
    clock: (s) => (lang === 'ar' && arabicDigits ? toArabicDigits(formatClock(s)) : formatClock(s)),
    fmt,
  };
}

export function useI18n(): I18n {
  const lang = useSettings((s) => s.settings.language);
  const arabicDigits = useSettings((s) => s.settings.arabicDigits);
  return useMemo(() => makeI18n(lang, arabicDigits), [lang, arabicDigits]);
}

/** Outside React (toasts, notifications, sound labels). */
export function currentI18n(): I18n {
  const { language, arabicDigits } = useSettings.getState().settings;
  return makeI18n(language, arabicDigits);
}
