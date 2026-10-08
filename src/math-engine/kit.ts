import type { Difficulty, Generator, L10n, LikelyError, Option, Question, Rng } from '@/types';
import { Fraction } from './fraction';

/** Helpers shared by all question generators. */

export type Body = ReturnType<Generator['make']>;

export const L = (en: string, ar: string): L10n => ({ en, ar });
/** Same text in both languages (numbers, expressions). */
export const same = (s: string): L10n => ({ en: s, ar: s });
/** Wrap LaTeX so the renderer draws it as math. */
export const m = (latex: string): string => `$${latex}$`;
export const H = (a: L10n, b: L10n, c: L10n): [L10n, L10n, L10n] => [a, b, c];

/** LaTeX for an integer / fraction. */
export function tex(v: Fraction | number): string {
  return typeof v === 'number' ? String(v) : v.toLatex();
}
/** Parenthesise negatives: (-3). */
export function par(v: Fraction | number): string {
  const f = typeof v === 'number' ? Fraction.of(v) : v;
  return f.n < 0 ? `(${f.toLatex()})` : f.toLatex();
}
/** Signed term for use inside a sum: "+ 3" / "- 3". */
export function signed(v: number): string {
  return v < 0 ? `- ${-v}` : `+ ${v}`;
}
/** Coefficient text for algebra: 1 → "", -1 → "-", 3 → "3". */
export function coef(c: number): string {
  return c === 1 ? '' : c === -1 ? '-' : String(c);
}
/** "ax + b" LaTeX with clean signs. */
export function linear(a: number, v: string, b: number): string {
  const head = a === 0 ? '' : `${coef(a)}${v}`;
  if (b === 0) return head || '0';
  if (a === 0) return String(b);
  return `${head} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
}
/** Decimal text with a fixed number of places, e.g. dec(3.5, 2) → "3.50". */
export function dec(v: number, places: number): string {
  return v.toFixed(places);
}
/** Exact decimal value of a Fraction as text (terminating fractions only). */
export function decOf(f: Fraction): string {
  return f.toDecimal(8);
}
export function frac(n: number, d: number): string {
  return `\\frac{${n}}{${d}}`;
}

export const WORDS = {
  names: ['Sara', 'Omar', 'Lina', 'Yusuf', 'Maya', 'Adam', 'Noor', 'Karim'],
  namesAr: ['سارة', 'عمر', 'لينا', 'يوسف', 'مايا', 'آدم', 'نور', 'كريم'],
};
/** A random name pair (en, ar) so Arabic stories use Arabic names. */
export function person(rng: Rng): L10n {
  const i = rng.int(0, WORDS.names.length - 1);
  return L(WORDS.names[i] as string, WORDS.namesAr[i] as string);
}

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f'];

export interface Cand {
  v: Fraction;
  pid?: string;
}
export const cand = (v: Fraction | number, pid?: string): Cand => ({ v: typeof v === 'number' ? Fraction.of(v) : v, pid });

export type ChoiceParts = Pick<Body, 'options' | 'answer' | 'likelyErrors'>;

/** Build 4 (or `count`) multiple-choice options from numeric values. Never duplicates, never fewer than 2. */
export function numberChoices(
  rng: Rng,
  correct: Fraction,
  cands: Cand[],
  show: (f: Fraction) => string,
  count = 4,
  fill?: () => Fraction,
): ChoiceParts {
  const seenValues = new Set<string>([correct.toString()]);
  const seenLabels = new Set<string>([show(correct)]);
  const wrong: Cand[] = [];
  const consider = (c: Cand): boolean => {
    const key = c.v.toString();
    const label = show(c.v);
    if (seenValues.has(key) || seenLabels.has(label)) return false;
    seenValues.add(key);
    seenLabels.add(label);
    wrong.push(c);
    return true;
  };
  for (const c of cands) {
    if (wrong.length >= count - 1) break;
    consider(c);
  }
  let guard = 0;
  while (wrong.length < count - 1 && guard++ < 200) {
    if (fill) {
      consider({ v: fill() });
    } else {
      const delta = rng.int(1, 4 + guard);
      const base = correct.isInt() ? Fraction.of(delta) : Fraction.of(delta, correct.d);
      consider({ v: rng.chance(0.5) ? correct.add(base) : correct.sub(base) });
    }
  }
  const all: Cand[] = [{ v: correct, pid: undefined }, ...wrong];
  const order = rng.shuffle(all);
  const options: Option[] = order.map((c, i) => ({ id: OPTION_IDS[i] as string, label: L(show(c.v), show(c.v)) }));
  const correctId = options[order.findIndex((c) => c.v === correct)]?.id as string;
  const likelyErrors: LikelyError[] = [];
  order.forEach((c, i) => {
    if (c.pid && c.v !== correct) likelyErrors.push({ answer: OPTION_IDS[i] as string, patternId: c.pid });
  });
  return { options, answer: { kind: 'choice', correct: [correctId] }, likelyErrors };
}

export interface TextCand {
  label: L10n;
  pid?: string;
}

/** Multiple choice from bilingual labels. The first entry is the correct one. */
export function textChoices(rng: Rng, correct: L10n, wrongs: TextCand[], count = 4): ChoiceParts {
  const seen = new Set<string>([correct.en + '|' + correct.ar]);
  const picked: TextCand[] = [];
  for (const w of wrongs) {
    const k = w.label.en + '|' + w.label.ar;
    if (seen.has(k) || picked.length >= count - 1) continue;
    seen.add(k);
    picked.push(w);
  }
  const all: TextCand[] = [{ label: correct }, ...picked];
  const order = rng.shuffle(all);
  const options: Option[] = order.map((c, i) => ({ id: OPTION_IDS[i] as string, label: c.label }));
  const correctId = options[order.findIndex((c) => c.label === correct)]?.id as string;
  const likelyErrors: LikelyError[] = [];
  order.forEach((c, i) => {
    if (c.pid && c.label !== correct) likelyErrors.push({ answer: OPTION_IDS[i] as string, patternId: c.pid });
  });
  return { options, answer: { kind: 'choice', correct: [correctId] }, likelyErrors };
}

/** True/False parts. */
export function trueFalse(value: boolean, patternIfWrong?: string): Pick<Body, 'answer' | 'likelyErrors' | 'options'> {
  return {
    options: [
      { id: 'true', label: L('True', 'صحيح') },
      { id: 'false', label: L('False', 'خطأ') },
    ],
    answer: { kind: 'bool', value },
    likelyErrors: patternIfWrong ? [{ answer: String(!value), patternId: patternIfWrong }] : [],
  };
}

/** Ordering question parts: items are shuffled so they never start in the correct order. */
export function orderingParts(
  rng: Rng,
  entries: { value: Fraction; label: L10n }[],
  ascending = true,
): Pick<Body, 'items' | 'answer'> {
  const sorted = entries.slice().sort((a, b) => (ascending ? a.value.cmp(b.value) : b.value.cmp(a.value)));
  const withIds = sorted.map((e, i) => ({ id: OPTION_IDS[i] as string, label: e.label }));
  let shuffled = rng.shuffle(withIds);
  let guard = 0;
  while (shuffled.every((s, i) => s.id === withIds[i]?.id) && guard++ < 20) shuffled = rng.shuffle(withIds);
  return { items: shuffled, answer: { kind: 'order', order: withIds.map((w) => w.id) } };
}

/** Matching parts: left ids l1.., right ids r1.. (shuffled). */
export function matchingParts(rng: Rng, pairs: { left: L10n; right: L10n }[]): Pick<Body, 'left' | 'right' | 'answer'> {
  const left: Option[] = pairs.map((p, i) => ({ id: `l${i + 1}`, label: p.left }));
  const rightAll: Option[] = pairs.map((p, i) => ({ id: `r${i + 1}`, label: p.right }));
  const right = rng.shuffle(rightAll);
  const map: Record<string, string> = {};
  left.forEach((l, i) => {
    map[l.id] = `r${i + 1}`;
  });
  return { left, right, answer: { kind: 'match', pairs: map } };
}

/** Number-answer parts for typed answers. */
export function numberAnswer(
  value: Fraction | number,
  extra: { tolerance?: number; integerOnly?: boolean; lowest?: boolean; percent?: boolean } = {},
): Pick<Body, 'answer'> {
  const v = typeof value === 'number' ? Fraction.of(value) : value;
  return { answer: { kind: 'number', value: v.toString(), ...extra } };
}

export function wrongNumbers(list: [Fraction | number, string][]): LikelyError[] {
  return list.map(([v, pid]) => ({ answer: (typeof v !== 'number' ? v : Number.isInteger(v) ? Fraction.of(v) : Fraction.parse(String(Number(v.toFixed(8))))).toString(), patternId: pid }));
}

/** Pick a nonzero integer in [min,max]. */
export function nz(rng: Rng, min: number, max: number): number {
  let v = 0;
  let guard = 0;
  while (v === 0 && guard++ < 50) v = rng.int(min, max);
  return v === 0 ? 1 : v;
}

/** Pick a value that differs from all `not`. */
export function differ(rng: Rng, min: number, max: number, ...not: number[]): number {
  for (let i = 0; i < 60; i++) {
    const v = rng.int(min, max);
    if (!not.includes(v)) return v;
  }
  return max + not.length + 1;
}

/** Scale an integer range by difficulty: d=1 → small, d=5 → large. */
export function scale(d: Difficulty, ...steps: number[]): number {
  return steps[Math.min(d, steps.length) - 1] as number;
}

/** Ensures a finished question is well-formed (used by tests and by the registry). */
export function problemsWith(q: Question): string[] {
  const issues: string[] = [];
  const texts: string[] = [];
  const addL = (l: L10n | undefined, where: string) => {
    if (!l) return issues.push(`${where}: missing`);
    if (!l.en.trim() || !l.ar.trim()) issues.push(`${where}: empty text`);
    texts.push(l.en, l.ar);
  };
  addL(q.prompt, 'prompt');
  addL(q.correctText, 'correctText');
  addL(q.explanation, 'explanation');
  q.hints.forEach((h, i) => addL(h, `hint${i}`));
  if (q.steps.length === 0) issues.push('no steps');
  q.steps.forEach((s, i) => addL(s, `step${i}`));
  [...(q.options ?? []), ...(q.items ?? []), ...(q.left ?? []), ...(q.right ?? [])].forEach((o) => addL(o.label, `option ${o.id}`));
  if (q.display) texts.push(q.display);
  for (const t of texts) if (/NaN|undefined|Infinity|null|\[object/.test(t)) issues.push(`bad text: ${t}`);
  if (q.options) {
    const ids = q.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) issues.push('duplicate option ids');
    if (q.answer.kind === 'choice') {
      const labels = q.options.map((o) => o.label.en + '|' + o.label.ar);
      if (new Set(labels).size !== labels.length) issues.push('duplicate option labels');
      if (q.answer.correct.some((c) => !ids.includes(c))) issues.push('correct option missing');
      if (q.options.length < 2) issues.push('fewer than 2 options');
    }
  }
  return issues;
}
