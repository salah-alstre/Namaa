import type { AnswerSpec, Question, UserAnswer, Verdict } from '@/types';
import { Fraction, gcd } from './fraction';
import { parseNumberInput, splitList, writtenFractions } from './parser';
import { normalizeMathInput, parsePoly, polyCanon, polyEquals } from './poly';

/**
 * Answer checking. Everything numeric is compared as an exact Fraction, so 1/2, 0.5, 50%
 * and ٠٫٥ are the same value. A tolerance is only applied when the question asks for one.
 */

const UNPARSED: Verdict = { correct: false, unparsed: true };

function asText(a: UserAnswer): string {
  if (typeof a === 'string') return a;
  if (typeof a === 'boolean') return String(a);
  if (Array.isArray(a)) return a.join(',');
  return JSON.stringify(a);
}

/** Parse the number a person typed for a `number` spec, honouring percent semantics. */
function readNumber(spec: Extract<AnswerSpec, { kind: 'number' }>, text: string): Fraction | null {
  const p = parseNumberInput(text);
  if (!p) return null;
  if (spec.percent) return p.value; // "50" and "50%" both mean 50
  return p.hadPercent ? p.value.div(Fraction.of(100)) : p.value;
}

function numberMatches(spec: Extract<AnswerSpec, { kind: 'number' }>, got: Fraction): boolean {
  const want = Fraction.parse(spec.value);
  if (spec.integerOnly && !got.isInt()) return false;
  if (spec.tolerance && spec.tolerance > 0) {
    return Math.abs(got.toNumber() - want.toNumber()) <= spec.tolerance + 1e-12;
  }
  return got.eq(want);
}

function normText(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // Arabic diacritics + tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[.,!?;:"'`،؛؟()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkNumber(q: Question, spec: Extract<AnswerSpec, { kind: 'number' }>, text: string): Verdict {
  const got = readNumber(spec, text);
  if (!got) return UNPARSED;
  const canonical = got.toString();
  if (numberMatches(spec, got)) {
    if (spec.lowest) {
      const bad = writtenFractions(text).some(([n, d]) => gcd(n, d) > 1);
      if (bad) return { correct: false, patternId: 'not-simplified', canonical };
    }
    return { correct: true, canonical };
  }
  const hit = q.likelyErrors?.find((e) => {
    try {
      return Fraction.parse(e.answer).eq(got);
    } catch {
      return false;
    }
  });
  return { correct: false, canonical, patternId: hit?.patternId };
}

function checkNumbers(q: Question, spec: Extract<AnswerSpec, { kind: 'numbers' }>, text: string): Verdict {
  const parts = splitList(text);
  if (parts.length === 0) return UNPARSED;
  const got: Fraction[] = [];
  for (const part of parts) {
    const p = parseNumberInput(part);
    if (!p) return UNPARSED;
    got.push(p.hadPercent ? p.value.div(Fraction.of(100)) : p.value);
  }
  const want = spec.values.map((v) => Fraction.parse(v));
  const sort = (xs: Fraction[]) => xs.slice().sort((a, b) => a.cmp(b));
  const a = spec.ordered ? got : sort(got);
  const b = spec.ordered ? want : sort(want);
  const canonical = a.map((f) => f.toString()).join(',');
  const correct = a.length === b.length && a.every((f, i) => f.eq(b[i] as Fraction));
  if (correct) return { correct, canonical };
  const hit = q.likelyErrors?.find((e) => e.answer === canonical);
  return { correct, canonical, patternId: hit?.patternId };
}

function checkExpression(q: Question, spec: Extract<AnswerSpec, { kind: 'expression' }>, text: string): Verdict {
  let s = text.trim();
  // Allow "y = 2x + 1" style input: drop a single-letter left-hand side.
  s = s.replace(/^\s*[a-zA-Zسصع]\s*=\s*/, '');
  if (s.includes('=')) return UNPARSED;
  const got = parsePoly(s);
  const want = parsePoly(spec.value);
  if (!got || !want) return UNPARSED;
  const canonical = polyCanon(got);
  if (!polyEquals(got, want)) {
    const hit = q.likelyErrors?.find((e) => {
      const p = parsePoly(e.answer);
      return !!p && polyEquals(p, got);
    });
    return { correct: false, canonical, patternId: hit?.patternId };
  }
  if (spec.requireForm === 'expanded' && /\(/.test(normalizeMathInput(s))) {
    return { correct: false, canonical, patternId: 'not-expanded' };
  }
  return { correct: true, canonical };
}

function toSet(a: UserAnswer): string[] {
  if (Array.isArray(a)) return a;
  if (typeof a === 'string') return a ? [a] : [];
  return [];
}

/** Judge a user's answer. Pure: no I/O, no randomness. */
export function checkAnswer(q: Question, answer: UserAnswer | null | undefined): Verdict {
  if (answer === null || answer === undefined) return UNPARSED;
  const spec = q.answer;
  switch (spec.kind) {
    case 'number': {
      const text = asText(answer);
      if (!text.trim()) return UNPARSED;
      return checkNumber(q, spec, text);
    }
    case 'numbers': {
      const text = asText(answer);
      if (!text.trim()) return UNPARSED;
      return checkNumbers(q, spec, text);
    }
    case 'expression': {
      const text = asText(answer);
      if (!text.trim()) return UNPARSED;
      return checkExpression(q, spec, text);
    }
    case 'text': {
      const got = normText(asText(answer));
      if (!got) return UNPARSED;
      return { correct: spec.accepted.some((a) => normText(a) === got), canonical: got };
    }
    case 'choice': {
      const got = toSet(answer);
      if (got.length === 0) return UNPARSED;
      const sorted = got.slice().sort();
      const want = spec.correct.slice().sort();
      const correct = sorted.length === want.length && sorted.every((v, i) => v === want[i]);
      const canonical = sorted.join(',');
      if (correct) return { correct, canonical };
      const hit = q.likelyErrors?.find((e) => e.answer === canonical);
      return { correct, canonical, patternId: hit?.patternId };
    }
    case 'bool': {
      const v = typeof answer === 'boolean' ? answer : answer === 'true' ? true : answer === 'false' ? false : null;
      if (v === null) return UNPARSED;
      const canonical = String(v);
      const correct = v === spec.value;
      if (correct) return { correct, canonical };
      const hit = q.likelyErrors?.find((e) => e.answer === canonical);
      return { correct, canonical, patternId: hit?.patternId };
    }
    case 'order': {
      if (!Array.isArray(answer) || answer.length !== spec.order.length) return UNPARSED;
      const canonical = answer.join(',');
      const correct = answer.every((v, i) => v === spec.order[i]);
      if (correct) return { correct, canonical };
      const hit = q.likelyErrors?.find((e) => e.answer === canonical);
      return { correct, canonical, patternId: hit?.patternId };
    }
    case 'match': {
      if (typeof answer !== 'object' || Array.isArray(answer) || answer === null) return UNPARSED;
      const keys = Object.keys(spec.pairs);
      if (keys.some((k) => !(k in answer))) return UNPARSED;
      const canonical = keys.map((k) => `${k}:${(answer as Record<string, string>)[k]}`).join(',');
      const correct = keys.every((k) => (answer as Record<string, string>)[k] === spec.pairs[k]);
      if (correct) return { correct, canonical };
      const hit = q.likelyErrors?.find((e) => e.answer === canonical);
      return { correct, canonical, patternId: hit?.patternId };
    }
  }
}

/** Canonical string for the correct answer (stored with each attempt). */
export function correctKey(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'number':
      return spec.value;
    case 'numbers':
      return spec.values.join(',');
    case 'expression':
      return polyCanon(parsePoly(spec.value) ?? new Map());
    case 'text':
      return spec.accepted[0] ?? '';
    case 'choice':
      return spec.correct.slice().sort().join(',');
    case 'bool':
      return String(spec.value);
    case 'order':
      return spec.order.join(',');
    case 'match':
      return Object.keys(spec.pairs)
        .map((k) => `${k}:${spec.pairs[k]}`)
        .join(',');
  }
}

/** Short text form of what the user entered, for storage and review lists. */
export function userKey(answer: UserAnswer | null | undefined): string | null {
  if (answer === null || answer === undefined) return null;
  if (typeof answer === 'object' && !Array.isArray(answer)) {
    return Object.entries(answer)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
  }
  return asText(answer);
}
