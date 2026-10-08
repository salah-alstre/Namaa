import type { Difficulty, Generator, InputMode, L10n, QType, Rng } from '@/types';
import { Fraction } from './fraction';
import {
  type Body,
  type Cand,
  type TextCand,
  L,
  matchingParts,
  numberAnswer,
  numberChoices,
  orderingParts,
  same,
  textChoices,
  trueFalse,
  wrongNumbers,
} from './kit';

/** Higher-level builders so a generator only has to describe the maths and the wording. */

type Hints = [L10n, L10n, L10n];

/** Default label for a number inside an option: integers plain, others as LaTeX. */
export function showNum(f: Fraction): string {
  return f.isInt() ? String(f.n) : `$${f.toLatex()}$`;
}
/** Decimal label (terminating fractions only), e.g. 0.75. */
export function showDec(f: Fraction): string {
  return f.toDecimal(8);
}

export function G(
  id: string,
  topicId: string,
  qtype: QType,
  levels: Difficulty[],
  make: Generator['make'],
): Generator {
  return { id: `${topicId}.${id}`, topicId, qtype, levels, make };
}

interface Common {
  prompt: L10n;
  display?: string;
  hints: Hints;
  steps: L10n[];
  explanation: L10n;
}

export function typed(
  s: Common & {
    value: Fraction | number;
    extra?: { tolerance?: number; integerOnly?: boolean; lowest?: boolean; percent?: boolean };
    suffix?: string;
    errors?: [Fraction | number, string][];
    mode?: InputMode;
    correct?: L10n;
  },
): Body {
  const v = typeof s.value === 'number' ? Fraction.of(s.value) : s.value;
  return {
    prompt: s.prompt,
    display: s.display,
    ...numberAnswer(v, s.extra),
    inputMode: s.mode ?? 'number',
    suffix: s.suffix,
    correctText: s.correct ?? same(showNum(v) + (s.suffix ? ` ${s.suffix}` : '')),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
    likelyErrors: s.errors ? wrongNumbers(s.errors) : undefined,
  };
}

export function mcqNum(
  rng: Rng,
  s: Common & {
    correct: Fraction | number;
    cands: Cand[];
    show?: (f: Fraction) => string;
    fill?: () => Fraction;
    count?: number;
  },
): Body {
  const v = typeof s.correct === 'number' ? Fraction.of(s.correct) : s.correct;
  const show = s.show ?? showNum;
  const parts = numberChoices(rng, v, s.cands, show, s.count ?? 4, s.fill);
  return {
    prompt: s.prompt,
    display: s.display,
    ...parts,
    correctText: same(show(v)),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

export function mcqText(
  rng: Rng,
  s: Common & { correct: L10n; wrongs: TextCand[]; count?: number },
): Body {
  return {
    prompt: s.prompt,
    display: s.display,
    ...textChoices(rng, s.correct, s.wrongs, s.count ?? 4),
    correctText: s.correct,
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

export function tfBody(s: Common & { truth: boolean; pid?: string; correct?: L10n }): Body {
  return {
    prompt: s.prompt,
    display: s.display,
    ...trueFalse(s.truth, s.pid),
    correctText: s.correct ?? (s.truth ? L('True', 'صحيح') : L('False', 'خطأ')),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

export function compareParts(a: Fraction, b: Fraction, pids?: { lt?: string; eq?: string; gt?: string }) {
  const truth = a.lt(b) ? 'lt' : a.gt(b) ? 'gt' : 'eq';
  const labels: Record<string, string> = { lt: '<', eq: '=', gt: '>' };
  const likelyErrors = (['lt', 'eq', 'gt'] as const)
    .filter((k) => k !== truth && pids?.[k])
    .map((k) => ({ answer: k, patternId: pids?.[k] as string }));
  return {
    options: (['lt', 'eq', 'gt'] as const).map((k) => ({ id: k, label: same(labels[k] as string) })),
    answer: { kind: 'choice' as const, correct: [truth] },
    likelyErrors,
    symbol: labels[truth] as string,
  };
}

export function compareBody(
  s: Common & { a: Fraction; b: Fraction; aTex: string; bTex: string; pids?: { lt?: string; eq?: string; gt?: string } },
): Body {
  const p = compareParts(s.a, s.b, s.pids);
  return {
    prompt: s.prompt,
    display: s.display ?? `${s.aTex} \\;?\\; ${s.bTex}`,
    options: p.options,
    answer: p.answer,
    likelyErrors: p.likelyErrors,
    correctText: same(`$${s.aTex} ${p.symbol} ${s.bTex}$`),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

export function orderBody(
  rng: Rng,
  s: Common & { entries: { value: Fraction; label: L10n }[]; ascending?: boolean },
): Body {
  const parts = orderingParts(rng, s.entries, s.ascending ?? true);
  const sorted = s.entries.slice().sort((a, b) => ((s.ascending ?? true) ? a.value.cmp(b.value) : b.value.cmp(a.value)));
  return {
    prompt: s.prompt,
    display: s.display,
    ...parts,
    correctText: {
      en: sorted.map((e) => e.label.en).join(' , '),
      ar: sorted.map((e) => e.label.ar).join(' ، '),
    },
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

export function matchBody(rng: Rng, s: Common & { pairs: { left: L10n; right: L10n }[] }): Body {
  const parts = matchingParts(rng, s.pairs);
  return {
    prompt: s.prompt,
    display: s.display,
    ...parts,
    correctText: {
      en: s.pairs.map((p) => `${p.left.en} → ${p.right.en}`).join('; '),
      ar: s.pairs.map((p) => `${p.left.ar} ← ${p.right.ar}`).join('؛ '),
    },
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}

/** Expression/equation style typed answer (algebra). */
export function exprBody(
  s: Common & { value: string; expanded?: boolean; errors?: { answer: string; patternId: string }[]; correct?: string; variable?: string },
): Body {
  return {
    prompt: s.prompt,
    display: s.display,
    answer: { kind: 'expression', value: s.value, variable: s.variable, requireForm: s.expanded ? 'expanded' : undefined },
    inputMode: 'expression',
    correctText: same(`$${s.correct ?? s.value}$`),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
    likelyErrors: s.errors,
  };
}

/** Typed list of numbers, e.g. both solutions of a quadratic. */
export function listBody(
  s: Common & { values: (Fraction | number)[]; ordered?: boolean; errors?: { answer: string; patternId: string }[]; correct?: L10n },
): Body {
  const vs = s.values.map((v) => (typeof v === 'number' ? Fraction.of(v) : v));
  return {
    prompt: s.prompt,
    display: s.display,
    answer: { kind: 'numbers', values: vs.map((v) => v.toString()), ordered: s.ordered },
    inputMode: 'numbers',
    correctText: s.correct ?? same(vs.map(showNum).join(' , ')),
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
    likelyErrors: s.errors,
  };
}

/** Typed text answer (e.g. "prime"). */
export function textBody(s: Common & { accepted: string[]; correct: L10n }): Body {
  return {
    prompt: s.prompt,
    display: s.display,
    answer: { kind: 'text', accepted: s.accepted },
    inputMode: 'text',
    correctText: s.correct,
    hints: s.hints,
    steps: s.steps,
    explanation: s.explanation,
  };
}
