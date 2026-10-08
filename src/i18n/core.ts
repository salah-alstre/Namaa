import type { L10n, Lang } from '@/types';

/** One UI string: [English, Arabic]. Keeping both in one tuple makes a missing translation a compile error. */
export type Entry = readonly [en: string, ar: string];
export type Dict = Readonly<Record<string, Entry>>;
export type Params = Readonly<Record<string, string | number>>;

export function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

export function translate(dict: Dict, key: string, lang: Lang, params?: Params): string {
  const entry = dict[key];
  if (!entry) return key;
  return interpolate(lang === 'ar' ? entry[1] : entry[0], params);
}

/** Pick the right side of a bilingual content string (lessons, hints, steps…). */
export function pick(l: L10n, lang: Lang): string {
  return (lang === 'ar' ? l.ar : l.en) || l.en;
}

export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

/** Convert Western digits in a string to Arabic-Indic digits (used only when the user chose that). */
export function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)] as string);
}

export interface NumberFormat {
  lang: Lang;
  arabicDigits: boolean;
}

export function formatNumber(n: number, fmt: NumberFormat, maxFraction = 1): string {
  const s = new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFraction, useGrouping: true }).format(n);
  const withSep = fmt.lang === 'ar' ? s.replace(/,/g, '٬').replace(/\./g, '٫') : s;
  return fmt.lang === 'ar' && fmt.arabicDigits ? toArabicDigits(withSep) : withSep;
}

export function formatPercent(ratio: number, fmt: NumberFormat): string {
  const v = formatNumber(Math.round(ratio * 100), fmt, 0);
  return fmt.lang === 'ar' ? `${v}٪` : `${v}%`;
}

/** 75 → "1 h 15 min" / "١ س ١٥ د". */
export function formatMinutes(minutes: number, fmt: NumberFormat): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hu = fmt.lang === 'ar' ? 'س' : 'h';
  const mu = fmt.lang === 'ar' ? 'د' : 'min';
  const f = (n: number) => formatNumber(n, fmt, 0);
  if (h === 0) return `${f(r)} ${mu}`;
  return r === 0 ? `${f(h)} ${hu}` : `${f(h)} ${hu} ${f(r)} ${mu}`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
