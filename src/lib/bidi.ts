/**
 * Splits mixed Arabic/English text into runs so every English run can be rendered left-to-right and isolated.
 * Quoted English such as `الجملة "I am a developer." تعني "أنا مبرمج."` keeps its own punctuation inside the run.
 */
export interface Run {
  text: string;
  en: boolean;
}

const WORD = "[A-Za-z0-9][A-Za-z0-9'’\\-]*";
// Words joined by spaces (or comma + space); trailing . , ! ? only when a closing quote follows.
const EN_RUN = new RegExp(`[A-Za-z][A-Za-z0-9'’\\-]*(?:,?[ \\u00a0]+${WORD})*(?:[.,!?…]+(?=["”»’']))?`, 'g');

export function splitRuns(text: string): Run[] {
  const out: Run[] = [];
  let last = 0;
  for (const m of text.matchAll(EN_RUN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i), en: false });
    out.push({ text: m[0], en: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), en: false });
  return out;
}

export const hasArabic = (s: string): boolean => /[؀-ۿ]/.test(s);
export const hasLatin = (s: string): boolean => /[A-Za-z]/.test(s);
