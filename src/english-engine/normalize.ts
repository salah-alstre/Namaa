/**
 * Typed-answer normalisation. Two answers are "the same" when they only differ in case, spacing,
 * punctuation, curly quotes, or a contraction ("I'm" ≡ "I am").
 */

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bshan't\b/g, 'shall not'],
  [/\bain't\b/g, 'is not'],
  [/\blet's\b/g, 'let us'],
  [/\bi'm\b/g, 'i am'],
  [/\b(you|we|they)'re\b/g, '$1 are'],
  [/\b(he|she|it|that|there|here|what|who|where|how)'s\b/g, '$1 is'],
  [/\b(i|you|we|they|would|could|should|who|what)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|it|we|they|that|there)'ll\b/g, '$1 will'],
  [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'],
  [/\b(is|are|was|were|do|does|did|has|have|had|should|could|would|must|need|ought)n't\b/g, '$1 not'],
];

export function normalizeEnglish(input: string): string {
  let s = input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
  for (const [re, rep] of CONTRACTIONS) s = s.replace(re, rep);
  s = s
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/[.,!?;:"()[\]{}…–—-]+/g, ' ')
    .replace(/(^|\s)'+|'+(\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

const AR_MARKS = /[ً-ٰٟـ]/g;

/** Arabic answers: drop diacritics/tatweel, unify alef/ya/ta-marbuta forms, drop punctuation. */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    .replace(AR_MARKS, '')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[.,!?;:؟،؛"()-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const isArabic = (s: string): boolean => /[؀-ۿ]/.test(s);

export function normalizeAny(s: string): string {
  return isArabic(s) ? normalizeArabic(s) : normalizeEnglish(s);
}

/** Levenshtein distance, early-exits past `cap`. */
export function editDistance(a: string, b: string, cap = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

export interface TypedMatch {
  correct: boolean;
  /** One typo away from an accepted answer (only for answers of 5+ letters). */
  close: boolean;
}

export function matchTyped(input: string, accepted: string[]): TypedMatch {
  const n = normalizeAny(input);
  if (n === '') return { correct: false, close: false };
  const norms = accepted.map(normalizeAny);
  if (norms.includes(n)) return { correct: true, close: false };
  const close = norms.some((a) => a.length >= 5 && editDistance(a, n, 1) <= 1);
  return { correct: false, close };
}
