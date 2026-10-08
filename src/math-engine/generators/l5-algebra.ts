import type { Generator } from '@/types';
import { Fraction } from '../fraction';
import { G, exprBody, matchBody, mcqText, tfBody, typed } from '../build';
import { H, L, differ, same } from '../kit';

const F = Fraction.of;
const mt = (s: string) => `$${s}$`;
const S = same;

// ───────────────────────── small algebra text helpers ─────────────────────────

/** Coefficient + variable: (1,'x') → "x", (-1,'x') → "-x", (3,'') → "3". */
const term = (c: number, v: string): string => {
  if (v === '') return String(c);
  if (c === 1) return v;
  if (c === -1) return `-${v}`;
  return `${c}${v}`;
};
/** "ax + b" with the sign of b folded into the operator. */
const lin = (a: number, b: number, v = 'x'): string => {
  const t = term(a, v);
  if (b === 0) return t;
  return `${t} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
};
interface Piece { c: number; v: string }
/** Render a list of pieces in the given order, folding signs into operators. */
const render = (pieces: Piece[]): string => {
  let out = '';
  for (const p of pieces) {
    if (p.c === 0) continue;
    if (out === '') out = term(p.c, p.v);
    else out += ` ${p.c < 0 ? '-' : '+'} ${term(Math.abs(p.c), p.v)}`;
  }
  return out === '' ? '0' : out;
};
const fromMap = (m: Record<string, number>, order: string[]): string => render(order.map((v) => ({ c: m[v] ?? 0, v })));

/** Drop likely-error entries equal to the correct value, and duplicates. */
const ne = (v: number | Fraction, list: [number | Fraction, string][]): [number | Fraction, string][] => {
  const vf = typeof v === 'number' ? F(v) : v;
  const seen: Fraction[] = [vf];
  const out: [number | Fraction, string][] = [];
  for (const [x, pid] of list) {
    const xf = typeof x === 'number' ? F(x) : x;
    if (seen.some((s) => s.eq(xf))) continue;
    seen.push(xf);
    out.push([x, pid]);
  }
  return out;
};
const nzInt = (rng: { int(a: number, b: number): number }, lo: number, hi: number): number => {
  for (let i = 0; i < 50; i++) {
    const v = rng.int(lo, hi);
    if (v !== 0) return v;
  }
  throw new RangeError('no nonzero');
};
const pp = (n: number): string => (n < 0 ? `(−${-n})` : String(n));
const minus = (n: number): string => (n < 0 ? `−${-n}` : String(n));

// ───────────────────────── One-step equations ─────────────────────────

const oneStep: Generator[] = [
  G('add-sub', 'one-step-equations', 'solve-equation', [1, 2, 3, 4], (rng, d) => {
    const x = d <= 2 ? rng.int(1, d === 1 ? 12 : 25) : nzInt(rng, -15, 20);
    const a = rng.int(2, d === 1 ? 12 : 25);
    const add = rng.chance(0.5);
    const b = add ? x + a : x - a;
    const eq = add ? `x + ${a} = ${b}` : `x - ${a} = ${b}`;
    return typed({
      prompt: L('Solve for x.', 'أوجد قيمة x.'),
      display: eq,
      value: x,
      extra: { integerOnly: true },
      errors: ne(x, [[add ? b + a : b - a, 'inverse-op'], [-x, 'sign-error']]),
      hints: H(
        L('Get x alone by undoing what was done to it.', 'اعزل x بعكس العملية التي أُجريت عليه.'),
        L(add ? `x has ${a} added to it, so subtract ${a} from both sides.` : `x has ${a} taken away, so add ${a} to both sides.`, add ? `أُضيف ${a} إلى x، لذا اطرح ${a} من الطرفين.` : `طُرح ${a} من x، لذا أضف ${a} إلى الطرفين.`),
        L(`x = ${b} ${add ? '−' : '+'} ${a}`, `x = ${b} ${add ? '−' : '+'} ${a}`),
      ),
      steps: [S(eq.replace(/-/g, '−')), S(`x = ${minus(b)} ${add ? '−' : '+'} ${a}`), S(`x = ${minus(x)}`)],
      explanation: L('Do the opposite operation to both sides to keep the equation balanced.', 'نفّذ العملية العكسية على الطرفين لتبقى المعادلة متوازنة.'),
    });
  }),

  G('mul-div', 'one-step-equations', 'solve-equation', [1, 2, 3, 4, 5], (rng, d) => {
    const mul = rng.chance(0.55);
    if (mul) {
      const a = d >= 3 ? nzInt(rng, -9, 9) : rng.int(2, 9);
      if (Math.abs(a) < 2) throw new RangeError('trivial');
      let x = d >= 3 ? nzInt(rng, -12, 12) : rng.int(1, 12);
      let b = a * x;
      let value: Fraction | number = x;
      if (d >= 4) {
        b = nzInt(rng, -30, 40);
        value = F(b, a);
        if (value.isInt()) x = value.toNumber();
      }
      const eq = `${a}x = ${b}`;
      return typed({
        prompt: L('Solve for x.', 'أوجد قيمة x.'),
        display: eq,
        value,
        errors: ne(value, [[b * a, 'inverse-op'], [F(a, b === 0 ? 1 : b), 'divide-both-sides'], [F(-b, a), 'sign-error']]),
        hints: H(
          L(`x is multiplied by ${a}. What undoes multiplication?`, `x مضروب في ${a}. ما العملية التي تعكس الضرب؟`),
          L(`Divide both sides by ${a}.`, `اقسم الطرفين على ${a}.`),
          L(`x = ${b} ÷ ${pp(a)}`, `x = ${b} ÷ ${pp(a)}`),
        ),
        steps: [S(eq.replace(/-/g, '−')), S(`x = ${minus(b)} ÷ ${pp(a)}`), S(`x = ${value.toString().replace('-', '−')}`)],
        explanation: L('Multiplication is undone by dividing both sides by the same number.', 'يُلغى الضرب بقسمة الطرفين على العدد نفسه.'),
      });
    }
    const a = rng.int(2, d <= 2 ? 9 : 12);
    const b = d >= 3 ? nzInt(rng, -12, 12) : rng.int(1, 12);
    const x = a * b;
    const eq = `\\frac{x}{${a}} = ${b}`;
    return typed({
      prompt: L('Solve for x.', 'أوجد قيمة x.'),
      display: eq,
      value: x,
      extra: { integerOnly: true },
      errors: ne(x, [[F(b, a), 'inverse-op'], [-x, 'sign-error']]),
      hints: H(
        L(`x is divided by ${a}. What undoes division?`, `x مقسوم على ${a}. ما العملية التي تعكس القسمة؟`),
        L(`Multiply both sides by ${a}.`, `اضرب الطرفين في ${a}.`),
        L(`x = ${pp(b)} × ${a}`, `x = ${pp(b)} × ${a}`),
      ),
      steps: [S(`x ÷ ${a} = ${minus(b)}`), S(`x = ${minus(b)} × ${a}`), S(`x = ${minus(x)}`)],
      explanation: L('Division is undone by multiplying both sides by the same number.', 'تُلغى القسمة بضرب الطرفين في العدد نفسه.'),
    });
  }),

  G('number-puzzle', 'one-step-equations', 'word-problem', [1, 2, 3], (rng, d) => {
    const x = rng.int(2, d === 1 ? 12 : 20);
    const kind = rng.int(0, 3);
    const k = rng.int(2, 9);
    const sets = [
      { en: `I think of a number and add ${k}. The result is ${x + k}. What is my number?`, ar: `فكّرتُ في عدد وأضفتُ إليه ${k} فصار الناتج ${x + k}. ما العدد؟`, eq: `x + ${k} = ${x + k}`, wrong: x + k + k },
      { en: `I think of a number and subtract ${k}. The result is ${x - k}. What is my number?`, ar: `فكّرتُ في عدد وطرحتُ منه ${k} فصار الناتج ${x - k}. ما العدد؟`, eq: `x - ${k} = ${x - k}`, wrong: x - 2 * k },
      { en: `I think of a number and multiply it by ${k}. The result is ${x * k}. What is my number?`, ar: `فكّرتُ في عدد وضربته في ${k} فصار الناتج ${x * k}. ما العدد؟`, eq: `${k}x = ${x * k}`, wrong: x * k * k },
      { en: `I think of a number and divide it by ${k}. The result is ${x}. What is my number?`, ar: `فكّرتُ في عدد وقسمته على ${k} فصار الناتج ${x}. ما العدد؟`, eq: `\\frac{x}{${k}} = ${x}`, wrong: F(x, k) },
    ] as const;
    const s = sets[kind] as (typeof sets)[number];
    const value = kind === 1 ? x : kind === 3 ? x * k : x;
    return typed({
      prompt: L(s.en, s.ar),
      value,
      extra: { integerOnly: true },
      errors: ne(value, [[s.wrong, 'inverse-op']]),
      hints: H(
        L('Turn the sentence into an equation with x for the number.', 'حوّل الجملة إلى معادلة وارمز للعدد بـ x.'),
        L(`The equation is ${mt(s.eq)}.`, `المعادلة هي ${mt(s.eq)}.`),
        L('Undo the operation on both sides.', 'اعكس العملية على الطرفين.'),
      ),
      steps: [L(`Equation: ${mt(s.eq)}`, `المعادلة: ${mt(s.eq)}`), S(`x = ${value}`)],
      explanation: L('Word puzzles are equations in disguise.', 'الألغاز الكلامية هي معادلات متنكرة.'),
    });
  }),

  G('is-solution', 'one-step-equations', 'true-false', [1, 2, 3], (rng, d) => {
    const x = rng.int(2, d === 1 ? 10 : 15);
    const a = rng.int(2, 9);
    const eqs = [`x + ${a} = ${x + a}`, `x - ${a} = ${x - a}`, `${a}x = ${a * x}`];
    const eq = eqs[d === 1 ? rng.int(0, 1) : rng.int(0, 2)] as string;
    const claimTrue = rng.chance(0.5);
    const claimed = claimTrue ? x : x + rng.pick([-2, -1, 1, 2, a]);
    const truth = claimed === x;
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `x = ${claimed}\\ \\text{solves}\\ ${eq}`,
      truth,
      pid: 'inverse-op',
      hints: H(L('Put the value into the equation in place of x.', 'ضع القيمة في المعادلة مكان x.'), L('Work out the left side.', 'احسب الطرف الأيسر.'), L('Is it equal to the right side?', 'هل يساوي الطرف الأيمن؟')),
      steps: [S(`${eq.replace(/x/g, `(${claimed})`).replace(/-/g, '−')}`), truth ? L('Both sides match.', 'الطرفان متساويان.') : L('The sides are different.', 'الطرفان مختلفان.')],
      explanation: L('A solution makes both sides of the equation equal.', 'الحل هو القيمة التي تجعل طرفي المعادلة متساويين.'),
    });
  }),

  G('which-operation', 'one-step-equations', 'mcq', [1, 2], (rng, d) => {
    const a = rng.int(2, 12);
    const b = rng.int(a + 1, 40);
    const kinds = [
      { eq: `x + ${a} = ${b}`, right: L(`Subtract ${a} from both sides`, `اطرح ${a} من الطرفين`), wrong: [L(`Add ${a} to both sides`, `أضف ${a} إلى الطرفين`), L(`Multiply both sides by ${a}`, `اضرب الطرفين في ${a}`), L(`Divide both sides by ${a}`, `اقسم الطرفين على ${a}`)] },
      { eq: `x - ${a} = ${b}`, right: L(`Add ${a} to both sides`, `أضف ${a} إلى الطرفين`), wrong: [L(`Subtract ${a} from both sides`, `اطرح ${a} من الطرفين`), L(`Multiply both sides by ${a}`, `اضرب الطرفين في ${a}`), L(`Divide both sides by ${a}`, `اقسم الطرفين على ${a}`)] },
      { eq: `${a}x = ${a * b}`, right: L(`Divide both sides by ${a}`, `اقسم الطرفين على ${a}`), wrong: [L(`Multiply both sides by ${a}`, `اضرب الطرفين في ${a}`), L(`Subtract ${a} from both sides`, `اطرح ${a} من الطرفين`), L(`Add ${a} to both sides`, `أضف ${a} إلى الطرفين`)] },
      { eq: `\\frac{x}{${a}} = ${b}`, right: L(`Multiply both sides by ${a}`, `اضرب الطرفين في ${a}`), wrong: [L(`Divide both sides by ${a}`, `اقسم الطرفين على ${a}`), L(`Subtract ${a} from both sides`, `اطرح ${a} من الطرفين`), L(`Add ${a} to both sides`, `أضف ${a} إلى الطرفين`)] },
    ];
    const k = kinds[rng.int(0, d === 1 ? 2 : 3)] as (typeof kinds)[number];
    return mcqText(rng, {
      prompt: L('What is the first step to solve this equation?', 'ما الخطوة الأولى لحل هذه المعادلة؟'),
      display: k.eq,
      correct: k.right,
      wrongs: k.wrong.map((w) => ({ label: w, pid: 'inverse-op' })),
      hints: H(L('Look at what is done to x.', 'انظر إلى ما أُجري على x.'), L('Use the opposite operation.', 'استخدم العملية العكسية.'), L('Do it to both sides.', 'نفّذها على الطرفين.')),
      steps: [k.right],
      explanation: L('Inverse operations undo each other.', 'العمليات العكسية تلغي بعضها.'),
    });
  }),
];

// ───────────────────────── Two-step equations ─────────────────────────

const twoStep: Generator[] = [
  G('solve', 'two-step-equations', 'solve-equation', [1, 2, 3, 4, 5], (rng, d) => {
    if (d === 4) {
      // x/a + b = c
      const a = rng.int(2, 9);
      const b = nzInt(rng, -12, 12);
      const x = a * rng.int(-8, 10);
      if (x === 0) throw new RangeError('zero');
      const c = x / a + b;
      const eq = `\\frac{x}{${a}} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${c}`;
      return typed({
        prompt: L('Solve for x.', 'أوجد قيمة x.'),
        display: eq,
        value: x,
        extra: { integerOnly: true },
        errors: ne(x, [[a * (c + b), 'sign-error'], [a * c + b, 'divide-both-sides']]),
        hints: H(
          L('Undo the adding or subtracting first.', 'اعكس الجمع أو الطرح أولًا.'),
          L(`Move ${b < 0 ? '+' : '−'}${Math.abs(b)} to the other side: x/${a} = ${c - b}.`, `انقل ${b < 0 ? '+' : '−'}${Math.abs(b)} إلى الطرف الآخر: x/${a} = ${c - b}.`),
          L(`Then multiply both sides by ${a}.`, `ثم اضرب الطرفين في ${a}.`),
        ),
        steps: [S(`x/${a} = ${minus(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${minus(c - b)}`), S(`x = ${minus(c - b)} × ${a} = ${minus(x)}`)],
        explanation: L('Undo the outer operations in reverse order: add/subtract first, then multiply/divide.', 'اعكس العمليات بترتيب معكوس: الجمع/الطرح أولًا ثم الضرب/القسمة.'),
      });
    }
    const a = d >= 3 ? nzInt(rng, -9, 9) : rng.int(2, 9);
    if (Math.abs(a) < 2) throw new RangeError('trivial coefficient');
    const b = d === 1 ? rng.int(1, 12) : nzInt(rng, -15, 15);
    let value: Fraction | number;
    let c: number;
    if (d === 5) {
      c = nzInt(rng, -30, 40);
      value = F(c - b, a);
    } else {
      const x = d >= 3 ? nzInt(rng, -10, 12) : rng.int(1, 12);
      c = a * x + b;
      value = x;
    }
    const eq = `${lin(a, b)} = ${c}`;
    const vf = typeof value === 'number' ? F(value) : value;
    return typed({
      prompt: L('Solve for x.', 'أوجد قيمة x.'),
      display: eq,
      value,
      errors: ne(value, [[F(c + b, a), 'sign-error'], [F(c, a).sub(F(b)), 'divide-both-sides'], [F(c - b).mul(F(a)), 'inverse-op']]),
      hints: H(
        L('Two steps: first remove the constant, then remove the coefficient.', 'خطوتان: أزل الحد الثابت أولًا ثم المعامل.'),
        L(`${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} on both sides: ${minus(a)}x = ${minus(c - b)}.`, `${b < 0 ? 'أضف' : 'اطرح'} ${Math.abs(b)} على الطرفين: ${minus(a)}x = ${minus(c - b)}.`),
        L(`Then divide both sides by ${pp(a)}.`, `ثم اقسم الطرفين على ${pp(a)}.`),
      ),
      steps: [S(`${minus(a)}x = ${minus(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${minus(c - b)}`), S(`x = ${minus(c - b)} ÷ ${pp(a)}`), S(`x = ${vf.toString().replace('-', '−')}`)],
      explanation: L('Undo the addition or subtraction first, then undo the multiplication.', 'اعكس الجمع أو الطرح أولًا ثم اعكس الضرب.'),
    });
  }),

  G('first-step', 'two-step-equations', 'mcq', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const b = rng.int(1, 15);
    const c = a * rng.int(2, 9) + b;
    const plus = d === 1 || rng.chance(0.5);
    const eq = plus ? `${a}x + ${b} = ${c}` : `${a}x - ${b} = ${c + 2 * b}`;
    const right = plus ? L(`Subtract ${b} from both sides`, `اطرح ${b} من الطرفين`) : L(`Add ${b} to both sides`, `أضف ${b} إلى الطرفين`);
    const wrongs = [
      { label: L(`Divide both sides by ${a}`, `اقسم الطرفين على ${a}`), pid: 'order-ops' },
      { label: plus ? L(`Add ${b} to both sides`, `أضف ${b} إلى الطرفين`) : L(`Subtract ${b} from both sides`, `اطرح ${b} من الطرفين`), pid: 'sign-error' },
      { label: L(`Multiply both sides by ${a}`, `اضرب الطرفين في ${a}`), pid: 'inverse-op' },
    ];
    return mcqText(rng, {
      prompt: L('Which step should you do first?', 'أي خطوة يجب أن تفعلها أولًا؟'),
      display: eq,
      correct: right,
      wrongs,
      hints: H(L('Undo the operations in the reverse order they were applied.', 'اعكس العمليات بعكس ترتيب تطبيقها.'), L(`x was multiplied by ${a} first, then ${b} was ${plus ? 'added' : 'subtracted'}.`, `ضُرب x في ${a} أولًا ثم ${plus ? 'أُضيف' : 'طُرح'} ${b}.`), L('So remove the constant first.', 'لذا أزل الحد الثابت أولًا.')),
      steps: [right],
      explanation: L('Remove the constant term first, then the coefficient.', 'أزل الحد الثابت أولًا ثم المعامل.'),
    });
  }),

  G('phone-plan', 'two-step-equations', 'word-problem', [2, 3, 4], (rng, d) => {
    const fee = rng.int(5, 30);
    const per = rng.int(2, d === 2 ? 5 : 9);
    const n = rng.int(3, 15);
    const total = fee + per * n;
    const what = rng.int(0, 1);
    if (what === 0) {
      return typed({
        prompt: L(`A gym charges a joining fee of $${fee} plus $${per} per visit. Maya paid $${total} in total. How many visits did she make?`, `يأخذ نادٍ رياضي رسم اشتراك ${fee} دولارًا بالإضافة إلى ${per} دولارات لكل زيارة. دفعت مايا ${total} دولارًا في المجموع. كم زيارة قامت بها؟`),
        value: n,
        extra: { integerOnly: true },
        errors: ne(n, [[F(total, per), 'divide-both-sides'], [F(total + fee, per), 'sign-error']]),
        hints: H(L('Write an equation: fee + price × visits = total.', 'اكتب معادلة: الرسم + السعر × الزيارات = المجموع.'), L(`${mt(`${per}n + ${fee} = ${total}`)}`, `${mt(`${per}n + ${fee} = ${total}`)}`), L(`Subtract ${fee}, then divide by ${per}.`, `اطرح ${fee} ثم اقسم على ${per}.`)),
        steps: [S(`${per}n + ${fee} = ${total}`), S(`${per}n = ${total - fee}`), S(`n = ${n}`)],
        explanation: L('A fixed fee plus a rate gives a two-step equation.', 'الرسم الثابت مع المعدل يعطي معادلة من خطوتين.'),
      });
    }
    return typed({
      prompt: L(`A taxi costs $${fee} to start plus $${per} per kilometre. A trip cost $${total}. How many kilometres was the trip?`, `تبدأ أجرة سيارة الأجرة بـ ${fee} دولارًا بالإضافة إلى ${per} دولارات لكل كيلومتر. كلّفت رحلة ${total} دولارًا. كم كيلومترًا قطعت؟`),
      value: n,
      suffix: 'km',
      extra: { integerOnly: true },
      errors: ne(n, [[F(total, per), 'divide-both-sides'], [F(total + fee, per), 'sign-error']]),
      hints: H(L('Total = start fee + rate × distance.', 'المجموع = رسم البدء + المعدل × المسافة.'), L(`${mt(`${per}k + ${fee} = ${total}`)}`, `${mt(`${per}k + ${fee} = ${total}`)}`), L(`Subtract ${fee}, then divide by ${per}.`, `اطرح ${fee} ثم اقسم على ${per}.`)),
      steps: [S(`${per}k + ${fee} = ${total}`), S(`${per}k = ${total - fee}`), S(`k = ${n}`)],
      explanation: L('The start fee is paid once, so remove it before dividing.', 'رسم البدء يُدفع مرة واحدة، لذا أزله قبل القسمة.'),
    });
  }),

  G('missing-term', 'two-step-equations', 'fill-blank', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const x = rng.int(2, d === 1 ? 6 : 12);
    const gap = rng.int(1, 20);
    const total = a * x + gap;
    return typed({
      prompt: L(`Fill in the blank so that x = ${x} is the solution.`, `أكمل الفراغ بحيث يكون x = ${x} هو الحل.`),
      display: `${a}x + \\square = ${total}`,
      value: gap,
      extra: { integerOnly: true },
      errors: ne(gap, [[total + a * x, 'sign-error'], [total - x, 'wrong-operation']]),
      hints: H(L(`Put x = ${x} into the equation.`, `ضع x = ${x} في المعادلة.`), L(`${a} × ${x} = ${a * x}.`, `${a} × ${x} = ${a * x}.`), L(`What must be added to ${a * x} to get ${total}?`, `ما العدد الذي يُضاف إلى ${a * x} ليصبح ${total}؟`)),
      steps: [S(`${a} × ${x} = ${a * x}`), S(`${total} − ${a * x} = ${gap}`)],
      explanation: L('Substitute the known value, then find what is missing.', 'عوّض بالقيمة المعروفة ثم أوجد المفقود.'),
    });
  }),

  G('check-solution', 'two-step-equations', 'true-false', [2, 3, 4], (rng, d) => {
    const a = rng.int(2, 9);
    const b = nzInt(rng, -10, 10);
    const x = d >= 3 ? nzInt(rng, -8, 9) : rng.int(1, 9);
    const c = a * x + b;
    const claimed = rng.chance(0.5) ? x : x + rng.pick([-2, -1, 1, 2]);
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `x = ${claimed}\\ \\text{solves}\\ ${lin(a, b)} = ${c}`,
      truth: claimed === x,
      pid: 'sign-error',
      hints: H(L('Substitute the value for x.', 'عوّض بالقيمة مكان x.'), L(`Compute ${a} × ${pp(claimed)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`, `احسب ${a} × ${pp(claimed)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`), L(`Does it equal ${c}?`, `هل يساوي ${c}؟`)),
      steps: [S(`${a} × ${pp(claimed)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(a * claimed + b)}`), claimed === x ? L(`That equals ${c}, so it is true.`, `يساوي ${c} إذن العبارة صحيحة.`) : L(`That is not ${c}, so it is false.`, `لا يساوي ${c} إذن العبارة خاطئة.`)],
      explanation: L('Always check a solution by substituting it back.', 'تحقّق دائمًا من الحل بتعويضه في المعادلة.'),
    });
  }),
];

// ───────────────────────── Variables on both sides ─────────────────────────

const bothSides: Generator[] = [
  G('solve', 'both-sides', 'solve-equation', [2, 3, 4, 5], (rng, d) => {
    const c = d >= 4 ? nzInt(rng, -5, 8) : rng.int(1, 6);
    const a = c + (d === 5 ? -rng.int(1, 6) : rng.int(1, 7));
    if (a === c || a === 0 || Math.abs(a) > 12) throw new RangeError('bad coefficients');
    const x = d >= 3 ? nzInt(rng, -9, 10) : rng.int(1, 10);
    const b = d >= 4 ? nzInt(rng, -15, 15) : rng.int(1, 15);
    const dd = (a - c) * x + b;
    const eq = `${lin(a, b)} = ${lin(c, dd)}`;
    return typed({
      prompt: L('Solve for x.', 'أوجد قيمة x.'),
      display: eq,
      value: x,
      extra: { integerOnly: true },
      errors: ne(x, [[F(dd - b, a + c === 0 ? 1 : a + c), 'sign-error'], [F(dd + b, a - c), 'sign-error'], [F(b - dd, a - c), 'sign-error']]),
      hints: H(
        L('Collect the x terms on one side and the numbers on the other.', 'اجمع حدود x في طرف والأعداد في الطرف الآخر.'),
        L(`Subtract ${minus(c)}x from both sides: ${minus(a - c)}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(dd)}.`, `اطرح ${minus(c)}x من الطرفين: ${minus(a - c)}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(dd)}.`),
        L('Now it is a two-step equation.', 'صارت الآن معادلة من خطوتين.'),
      ),
      steps: [S(`${minus(a - c)}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(dd)}`), S(`${minus(a - c)}x = ${minus(dd - b)}`), S(`x = ${minus(x)}`)],
      explanation: L('Moving a term to the other side changes its sign.', 'عند نقل حد إلى الطرف الآخر تتغير إشارته.'),
    });
  }),

  G('plans', 'both-sides', 'word-problem', [3, 4, 5], (rng, d) => {
    const p2 = rng.int(2, 6);
    const p1 = p2 + rng.int(1, 5);
    const m = rng.int(2, d === 3 ? 8 : 14);
    const f1 = rng.int(0, 10) * (d === 3 ? 1 : 1);
    const f2 = f1 + (p1 - p2) * m;
    return typed({
      prompt: L(`Gym A costs $${f1} to join plus $${p1} per month. Gym B costs $${f2} to join plus $${p2} per month. After how many months do both cost the same in total?`, `النادي أ يكلّف ${f1} دولارًا للاشتراك بالإضافة إلى ${p1} دولارات شهريًا. والنادي ب يكلّف ${f2} دولارًا للاشتراك بالإضافة إلى ${p2} دولارات شهريًا. بعد كم شهرًا تتساوى التكلفة الكلية؟`),
      value: m,
      extra: { integerOnly: true },
      errors: ne(m, [[F(f2 - f1, p1 + p2), 'sign-error'], [F(f2 + f1, p1 - p2), 'sign-error']]),
      hints: H(L('Set the two total costs equal.', 'ساوِ بين التكلفتين الكليتين.'), L(`${mt(`${f1} + ${p1}m = ${f2} + ${p2}m`)}`, `${mt(`${f1} + ${p1}m = ${f2} + ${p2}m`)}`), L('Collect the m terms on one side.', 'اجمع حدود m في طرف.')),
      steps: [S(`${f1} + ${p1}m = ${f2} + ${p2}m`), S(`${p1 - p2}m = ${f2 - f1}`), S(`m = ${m}`)],
      explanation: L('"Cost the same" means the two expressions are equal.', '«تتساوى التكلفة» تعني أن العبارتين متساويتان.'),
    });
  }),

  G('next-line', 'both-sides', 'mcq', [2, 3, 4], (rng, d) => {
    const c = rng.int(1, 5);
    const a = c + rng.int(1, 5);
    const b = rng.int(1, 12);
    const dd = b + rng.int(1, 20);
    const start = `${lin(a, b)} = ${lin(c, dd)}`;
    const right = `${lin(a - c, b)} = ${dd}`;
    const wrongs = [`${lin(a + c, b)} = ${dd}`, `${lin(a - c, 0)} = ${dd + b}`, `${lin(c - a, b)} = ${dd}`];
    void d;
    return mcqText(rng, {
      prompt: L('Subtract the x term on the right from both sides. What is the new equation?', 'اطرح حد x الموجود في الطرف الأيمن من الطرفين. ما المعادلة الجديدة؟'),
      display: start,
      correct: S(mt(right)),
      wrongs: wrongs.map((w) => ({ label: S(mt(w)), pid: 'sign-error' })),
      hints: H(L(`You subtract ${term(c, 'x')} from both sides.`, `تطرح ${term(c, 'x')} من الطرفين.`), L(`${term(a, 'x')} − ${term(c, 'x')} = ${term(a - c, 'x')}`, `${term(a, 'x')} − ${term(c, 'x')} = ${term(a - c, 'x')}`), L('The right side loses its x term.', 'يفقد الطرف الأيمن حد x.')),
      steps: [S(`${term(a, 'x')} − ${term(c, 'x')} = ${term(a - c, 'x')}`), L(`New equation: ${mt(right)}`, `المعادلة الجديدة: ${mt(right)}`)],
      explanation: L('Subtracting the same thing from both sides keeps the equation balanced.', 'طرح الشيء نفسه من الطرفين يبقي المعادلة متوازنة.'),
    });
  }),
];

// ───────────────────────── Simplifying expressions ─────────────────────────

const simplifying: Generator[] = [
  G('combine', 'simplifying-expressions', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const vars = d === 1 ? ['x'] : d <= 3 ? ['x', ''] : d === 4 ? ['x', 'y', ''] : ['x^2', 'x', ''];
    const sum: Record<string, number> = {};
    const pieces: Piece[] = [];
    for (const v of vars) {
      const c1 = d <= 2 ? rng.int(1, 9) : nzInt(rng, -9, 9);
      const c2 = d <= 2 ? rng.int(1, 9) : nzInt(rng, -9, 9);
      if (c1 + c2 === 0) throw new RangeError('cancels');
      sum[v] = c1 + c2;
      pieces.push({ c: c1, v }, { c: c2, v });
    }
    const shuffled = rng.shuffle(pieces);
    // leading negative looks odd for beginners
    if (d <= 3 && (shuffled[0] as Piece).c < 0) throw new RangeError('leading negative');
    const display = render(shuffled);
    const answer = fromMap(sum, vars);
    const total = Object.values(sum).reduce((a, b) => a + b, 0);
    const errors = vars.length > 1 ? [{ answer: `${total}${vars[0]}`, patternId: 'combine-unlike' }].filter((e) => e.answer !== answer.replace(/ /g, '')) : [];
    return exprBody({
      prompt: L('Simplify by collecting like terms.', 'بسّط العبارة بتجميع الحدود المتشابهة.'),
      display,
      value: answer.replace(/ /g, ''),
      correct: answer,
      errors,
      hints: H(
        L('Group terms that have exactly the same letters.', 'جمّع الحدود التي لها الحروف نفسها.'),
        L('Add the numbers in front of each group (keep their signs).', 'اجمع الأعداد التي أمام كل مجموعة (مع إشاراتها).'),
        L('Terms with different letters stay separate.', 'الحدود ذات الحروف المختلفة تبقى منفصلة.'),
      ),
      steps: vars.map((v) => {
        const ps = pieces.filter((p) => p.v === v);
        const lhs = ps.map((p) => (p.c < 0 ? `(−${-p.c})` : String(p.c))).join(' + ');
        return S(`${v === '' ? 'numbers' : v}: ${lhs} = ${minus(sum[v] as number)}`);
      }).concat([S(answer)]),
      explanation: L('You can only add terms that have the same letter part.', 'لا يمكنك جمع إلا الحدود التي لها جزء الحروف نفسه.'),
    });
  }),

  G('equivalent', 'simplifying-expressions', 'mcq', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const b = differ(rng, 2, 9, a);
    const c = rng.int(1, 12);
    const display = `${a}x + ${b}x + ${c}`;
    const right = `${a + b}x + ${c}`;
    const wrongs = [
      { label: S(mt(`${a + b}x^{2} + ${c}`)), pid: 'exponent-multiply' },
      { label: S(mt(`${a + b + c}x`)), pid: 'combine-unlike' },
      { label: S(mt(`${a * b}x + ${c}`)), pid: 'wrong-operation' },
    ];
    void d;
    return mcqText(rng, {
      prompt: L('Which expression is equal to this one?', 'أي عبارة تساوي هذه العبارة؟'),
      display,
      correct: S(mt(right)),
      wrongs,
      hints: H(L('Only the x terms can be added together.', 'يمكن جمع حدود x فقط معًا.'), L(`${a}x + ${b}x = (${a} + ${b})x.`, `${a}x + ${b}x = (${a} + ${b})x.`), L('The constant stays on its own.', 'يبقى الحد الثابت وحده.')),
      steps: [S(`${a}x + ${b}x = ${a + b}x`), L(`The result is ${mt(right)}.`, `الناتج ${mt(right)}.`)],
      explanation: L('Adding x terms adds their coefficients; the letter part stays the same.', 'جمع حدود x يجمع معاملاتها ويبقى جزء الحروف كما هو.'),
    });
  }),

  G('true-false', 'simplifying-expressions', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const a = rng.int(2, 9);
    const b = differ(rng, 2, 9, a);
    const truthy = rng.chance(0.5);
    const lhs = d >= 3 ? `${a}x + ${b}x^{2}` : `${a}x + ${b}x`;
    const rhs = truthy ? (d >= 3 ? `${a}x + ${b}x^{2}` : `${a + b}x`) : (d >= 3 ? `${a + b}x^{3}` : rng.pick([`${a + b}x^{2}`, `${a * b}x`, `${a + b}`]));
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `${lhs} = ${rhs}`,
      truth: truthy,
      pid: 'combine-unlike',
      hints: H(L('Are the two terms on the left like terms?', 'هل الحدان في الطرف الأيسر متشابهان؟'), L('Adding like terms adds the coefficients only.', 'جمع الحدود المتشابهة يجمع المعاملات فقط.'), L('The power of x does not change when you add.', 'لا تتغير قوة x عند الجمع.')),
      steps: [truthy ? L('The right side is a correct simplification.', 'الطرف الأيمن تبسيط صحيح.') : L('The right side changed the letters or the powers, so it is not equal.', 'الطرف الأيمن غيّر الحروف أو القوى فلا يساوي.')],
      explanation: L('Add the coefficients of like terms; never change the letters or powers.', 'اجمع معاملات الحدود المتشابهة ولا تغيّر الحروف أو القوى.'),
    });
  }),
];

// ───────────────────────── Distributive property ─────────────────────────

const distributive: Generator[] = [
  G('expand', 'distributive', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let display: string;
    let map: Record<string, number>;
    let order = ['x', ''];
    let wrong: Record<string, number> | null = null;
    let stepA: string;
    if (d === 1) {
      const a = rng.int(2, 9);
      const b = rng.int(1, 9);
      display = `${a}(x + ${b})`;
      map = { x: a, '': a * b };
      wrong = { x: a, '': b };
      stepA = `${a} × x = ${a}x, ${a} × ${b} = ${a * b}`;
    } else if (d === 2) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const c = rng.int(1, 9);
      display = `${a}(${b}x + ${c})`;
      map = { x: a * b, '': a * c };
      wrong = { x: a * b, '': c };
      stepA = `${a} × ${b}x = ${a * b}x, ${a} × ${c} = ${a * c}`;
    } else if (d === 3) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const c = rng.int(1, 9);
      display = `${a}(${b}x - ${c})`;
      map = { x: a * b, '': -a * c };
      wrong = { x: a * b, '': a * c };
      stepA = `${a} × ${b}x = ${a * b}x, ${a} × (−${c}) = −${a * c}`;
    } else if (d === 4) {
      if (rng.chance(0.5)) {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        const c = rng.int(1, 9);
        display = `-${a}(${b}x + ${c})`;
        map = { x: -a * b, '': -a * c };
        wrong = { x: -a * b, '': a * c };
        stepA = `−${a} × ${b}x = −${a * b}x, −${a} × ${c} = −${a * c}`;
      } else {
        const a = rng.int(2, 6);
        const b = rng.int(1, 8);
        const c = rng.int(2, 6);
        const e = rng.int(1, 8);
        display = `${a}(x + ${b}) + ${c}(x + ${e})`;
        map = { x: a + c, '': a * b + c * e };
        wrong = { x: a + c, '': b + e };
        stepA = `${a}x + ${a * b} + ${c}x + ${c * e}`;
      }
    } else {
      const a = nzInt(rng, -6, 6);
      const b = nzInt(rng, -6, 6);
      display = `(x ${a < 0 ? '-' : '+'} ${Math.abs(a)})(x ${b < 0 ? '-' : '+'} ${Math.abs(b)})`;
      map = { 'x^2': 1, x: a + b, '': a * b };
      order = ['x^2', 'x', ''];
      wrong = { 'x^2': 1, x: 0, '': a * b };
      stepA = `x·x = x², x·${pp(b)} + ${pp(a)}·x = ${minus(a + b)}x, ${pp(a)}·${pp(b)} = ${minus(a * b)}`;
    }
    const value = fromMap(map, order).replace(/ /g, '');
    const wrongStr = wrong ? fromMap(wrong, order).replace(/ /g, '') : '';
    return exprBody({
      prompt: L('Expand and simplify.', 'فُكّ الأقواس وبسّط.'),
      display,
      value,
      expanded: true,
      correct: fromMap(map, order),
      errors: wrong && wrongStr !== value ? [{ answer: wrongStr, patternId: 'distribute-partial' }] : [],
      hints: H(
        L('Multiply what is outside the brackets by every term inside.', 'اضرب ما خارج القوس في كل حد داخله.'),
        L('Do not forget the sign of each term.', 'لا تنسَ إشارة كل حد.'),
        L('Then combine like terms.', 'ثم اجمع الحدود المتشابهة.'),
      ),
      steps: [S(stepA), S(fromMap(map, order))],
      explanation: L('The outside number multiplies EVERY term inside the brackets.', 'العدد الخارجي يضرب كل حد داخل القوس.'),
    });
  }),

  G('which-equal', 'distributive', 'mcq', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(1, 9);
    const neg = d === 3;
    const display = `${a}(${b}x ${neg ? '-' : '+'} ${c})`;
    const s = neg ? -1 : 1;
    const right = `${a * b}x ${neg ? '-' : '+'} ${a * c}`;
    const wrongs = [
      { label: S(mt(`${a * b}x ${neg ? '-' : '+'} ${c}`)), pid: 'distribute-partial' },
      { label: S(mt(`${b}x ${neg ? '-' : '+'} ${a * c}`)), pid: 'distribute-partial' },
      { label: S(mt(`${a * b}x ${neg ? '+' : '-'} ${a * c}`)), pid: 'sign-error' },
    ];
    void s;
    return mcqText(rng, {
      prompt: L('Which expression equals this one?', 'أي عبارة تساوي هذه العبارة؟'),
      display,
      correct: S(mt(right)),
      wrongs,
      hints: H(L(`${a} multiplies both terms inside the brackets.`, `${a} يضرب الحدين داخل القوس.`), L(`${a} × ${b}x and ${a} × ${c}.`, `${a} × ${b}x و ${a} × ${c}.`), L('Keep the sign between them.', 'احتفظ بالإشارة بينهما.')),
      steps: [S(`${a} × ${b}x = ${a * b}x`), S(`${a} × ${c} = ${a * c}`)],
      explanation: L('The outside factor must multiply every term in the brackets.', 'يجب أن يضرب العامل الخارجي كل الحدود داخل القوس.'),
    });
  }),

  G('missing-number', 'distributive', 'fill-blank', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const c = rng.int(2, 12);
    const askCoef = d >= 2 && rng.chance(0.5);
    if (askCoef) {
      const b = rng.int(2, 9);
      return typed({
        prompt: L('Find the missing number.', 'أوجد العدد المفقود.'),
        display: `${a}(${b}x + ${c}) = \\square x + ${a * c}`,
        value: a * b,
        extra: { integerOnly: true },
        errors: ne(a * b, [[b, 'distribute-partial'], [a + b, 'wrong-operation']]),
        hints: H(L('The number outside multiplies the x term too.', 'العدد الخارجي يضرب حد x أيضًا.'), L(`${a} × ${b}`, `${a} × ${b}`), L(`${a} × ${b} = ${a * b}.`, `${a} × ${b} = ${a * b}.`)),
        steps: [S(`${a} × ${b}x = ${a * b}x`)],
        explanation: L('Distribute to both terms.', 'وزّع على الحدين.'),
      });
    }
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد المفقود.'),
      display: `${a}(x + ${c}) = ${a}x + \\square`,
      value: a * c,
      extra: { integerOnly: true },
      errors: ne(a * c, [[c, 'distribute-partial'], [a + c, 'wrong-operation']]),
      hints: H(L('The outside number multiplies the constant too.', 'العدد الخارجي يضرب الحد الثابت أيضًا.'), L(`${a} × ${c}`, `${a} × ${c}`), L(`${a} × ${c} = ${a * c}.`, `${a} × ${c} = ${a * c}.`)),
      steps: [S(`${a} × ${c} = ${a * c}`)],
      explanation: L('Distribute to both terms.', 'وزّع على الحدين.'),
    });
  }),

  G('true-false', 'distributive', 'true-false', [1, 2, 3], (rng, d) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const good = rng.chance(0.5);
    const rhs = good ? `${a}x + ${a * b}` : rng.pick([`${a}x + ${b}`, `${a + 1}x + ${a * b}`, `${a}x + ${a + b}`]);
    void d;
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `${a}(x + ${b}) = ${rhs}`,
      truth: good,
      pid: 'distribute-partial',
      hints: H(L(`Multiply ${a} by each term in the brackets.`, `اضرب ${a} في كل حد داخل القوس.`), L(`${a} × x = ${a}x and ${a} × ${b} = ${a * b}.`, `${a} × x = ${a}x و ${a} × ${b} = ${a * b}.`), L('Compare with the right side.', 'قارن بالطرف الأيمن.')),
      steps: [S(`${a}(x + ${b}) = ${a}x + ${a * b}`), good ? L('It matches.', 'يتطابق.') : L('It does not match.', 'لا يتطابق.')],
      explanation: L('Distribute to every term.', 'وزّع على كل حد.'),
    });
  }),
];

// ───────────────────────── Factoring ─────────────────────────

const factoring: Generator[] = [
  G('common-factor', 'factoring', 'mcq', [2, 3, 4], (rng, d) => {
    const g = rng.int(2, 9);
    const gcdPQ = (a: number, b: number): number => (b === 0 ? a : gcdPQ(b, a % b));
    let p = rng.int(2, 7);
    let q = d === 3 ? nzInt(rng, -9, 9) : rng.int(1, 9);
    for (let i = 0; i < 40 && (gcdPQ(p, Math.abs(q)) !== 1 || Math.abs(q) === 1 || p === g); i++) {
      p = rng.int(2, 7);
      q = d === 3 ? nzInt(rng, -9, 9) : rng.int(2, 9);
    }
    if (gcdPQ(p, Math.abs(q)) !== 1 || Math.abs(q) === 1 || p === g) throw new RangeError('no coprime pair');
    const useX = d === 4;
    const display = useX ? `${g * p}x^{2} ${q < 0 ? '-' : '+'} ${g * Math.abs(q)}x` : `${g * p}x ${q < 0 ? '-' : '+'} ${g * Math.abs(q)}`;
    const front = useX ? `${g}x` : `${g}`;
    const right = `${front}(${lin(p, q)})`;
    const wrongs = [
      { label: S(mt(`${front}(${lin(p, g * q)})`)), pid: 'gcf-partial' },
      { label: S(mt(`${front}(${lin(p, -q)})`)), pid: 'factor-sign' },
      { label: S(mt(`${p}(${useX ? `${g}x^{2}` : `${g}x`} ${q < 0 ? '-' : '+'} ${g * Math.abs(q)})`)), pid: 'gcf-partial' },
    ];
    return mcqText(rng, {
      prompt: L('Factorise completely.', 'حلّل تحليلًا كاملًا.'),
      display,
      correct: S(mt(right)),
      wrongs,
      hints: H(
        L('Find the biggest number (and letter) that divides every term.', 'ابحث عن أكبر عدد (وحرف) يقسم كل الحدود.'),
        L(`The common factor is ${front}.`, `العامل المشترك هو ${front}.`),
        L('Divide each term by it and write the results in the brackets.', 'اقسم كل حد عليه واكتب النتائج داخل القوس.'),
      ),
      steps: [S(`common factor = ${front}`), L(`Result: ${mt(right)}`, `الناتج: ${mt(right)}`)],
      explanation: L('Check by expanding: the brackets must give back the original expression.', 'تحقّق بفك الأقواس: يجب أن تعيد العبارة الأصلية.'),
    });
  }),

  G('gcf-number', 'factoring', 'type-answer', [1, 2, 3], (rng, d) => {
    const g = rng.int(2, d === 1 ? 6 : 9);
    const p = rng.int(2, 6);
    let q = rng.int(2, 7);
    const gcdf = (a: number, b: number): number => (b === 0 ? a : gcdf(b, a % b));
    while (gcdf(p, q) !== 1 || p === q) q = rng.int(2, 7);
    const a = g * p;
    const b = g * q;
    return typed({
      prompt: L('What is the greatest common factor of the two numbers in this expression?', 'ما العامل المشترك الأكبر للعددين في هذه العبارة؟'),
      display: `${a}x + ${b}`,
      value: g,
      extra: { integerOnly: true },
      errors: ne(g, [[a * b / gcdf(a, b), 'gcf-partial'], [1, 'gcf-partial']]),
      hints: H(L(`List the factors of ${a} and of ${b}.`, `اكتب عوامل ${a} وعوامل ${b}.`), L('Find the biggest one they share.', 'ابحث عن أكبر عامل مشترك.'), L(`Both are multiples of ${g}.`, `كلاهما من مضاعفات ${g}.`)),
      steps: [S(`${a} = ${g} × ${p}`), S(`${b} = ${g} × ${q}`), S(`GCF = ${g}`)],
      explanation: L('The GCF goes outside the brackets.', 'العامل المشترك الأكبر يوضع خارج القوس.'),
    });
  }),

  G('quadratic', 'factoring', 'select-formula', [3, 4, 5], (rng, d) => {
    let r1 = d === 3 ? rng.int(1, 8) : nzInt(rng, -9, 9);
    let r2 = d === 3 ? rng.int(2, 8) : nzInt(rng, -9, 9);
    if (d === 5) { r1 = nzInt(rng, -9, 9); r2 = nzInt(rng, -9, 9); }
    if (r1 + r2 === 0 || r1 === r2) throw new RangeError('degenerate');
    const bc = r1 + r2;
    const cc = r1 * r2;
    const display = `x^{2} ${bc < 0 ? '-' : '+'} ${Math.abs(bc) === 1 ? '' : Math.abs(bc)}x ${cc < 0 ? '-' : '+'} ${Math.abs(cc)}`;
    const f = (a: number, b: number) => `(x ${a < 0 ? '-' : '+'} ${Math.abs(a)})(x ${b < 0 ? '-' : '+'} ${Math.abs(b)})`;
    return mcqText(rng, {
      prompt: L('Which is the correct factorisation?', 'ما التحليل الصحيح؟'),
      display,
      correct: S(mt(f(r1, r2))),
      wrongs: [
        { label: S(mt(f(-r1, -r2))), pid: 'factor-sign' },
        { label: S(mt(f(r1, -r2))), pid: 'factor-sign' },
        { label: S(mt(f(-r1, r2))), pid: 'factor-sign' },
      ],
      hints: H(
        L('Find two numbers that multiply to the last term and add to the middle coefficient.', 'ابحث عن عددين حاصل ضربهما الحد الأخير ومجموعهما معامل الحد الأوسط.'),
        L(`They must multiply to ${cc} and add to ${bc}.`, `يجب أن يكون حاصل ضربهما ${cc} ومجموعهما ${bc}.`),
        L(`Those numbers are ${r1} and ${r2}.`, `العددان هما ${r1} و${r2}.`),
      ),
      steps: [S(`${pp(r1)} × ${pp(r2)} = ${minus(cc)}`), S(`${pp(r1)} + ${pp(r2)} = ${minus(bc)}`), L(`So ${mt(display)} = ${mt(f(r1, r2))}`, `إذن ${mt(display)} = ${mt(f(r1, r2))}`)],
      explanation: L('Expand your answer to check: you should get the original expression.', 'فُكّ الأقواس للتحقق: يجب أن تحصل على العبارة الأصلية.'),
    });
  }),

  G('missing-number', 'factoring', 'fill-blank', [3, 4, 5], (rng, d) => {
    const a = rng.int(1, 8);
    const b = d === 3 ? rng.int(2, 9) : nzInt(rng, -9, 9);
    if (b === 0) throw new RangeError('zero');
    const s = a + b;
    const c = a * b;
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد المفقود.'),
      display: `x^{2} ${s < 0 ? '-' : '+'} ${Math.abs(s) === 1 ? '' : Math.abs(s)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)} = (x ${a < 0 ? '-' : '+'} ${Math.abs(a)})(x + \\square)`,
      value: b,
      extra: { integerOnly: true },
      errors: ne(b, [[-b, 'factor-sign'], [s, 'factor-sign'], [c, 'wrong-operation']]),
      hints: H(L(`The two numbers multiply to ${c}.`, `العددان حاصل ضربهما ${c}.`), L(`One is ${a}. What multiplies with ${a} to give ${c}?`, `أحدهما ${a}. ما العدد الذي يضرب في ${a} ليعطي ${c}؟`), L(`${c} ÷ ${pp(a)} = ${b}.`, `${c} ÷ ${pp(a)} = ${b}.`)),
      steps: [S(`${minus(c)} ÷ ${pp(a)} = ${minus(b)}`), S(`check: ${pp(a)} + ${pp(b)} = ${minus(s)}`)],
      explanation: L('The two numbers multiply to the constant and add to the x coefficient.', 'العددان حاصل ضربهما الحد الثابت ومجموعهما معامل x.'),
    });
  }),

  G('check-expand', 'factoring', 'true-false', [2, 3, 4], (rng, d) => {
    const g = rng.int(2, 9);
    const p = rng.int(2, 6);
    const q = rng.int(1, 9);
    const good = rng.chance(0.5);
    const factored = good ? `${g}(${p}x + ${q})` : rng.pick([`${g}(${p}x + ${g * q})`, `${g}(${g * p}x + ${q})`, `${p}(${g}x + ${q})`]);
    if (!good && p === g && factored.startsWith(`${p}(${g}x`)) throw new RangeError('same');
    void d;
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `${g * p}x + ${g * q} = ${factored}`,
      truth: good,
      pid: 'gcf-partial',
      hints: H(L('Expand the brackets on the right.', 'فُكّ الأقواس في الطرف الأيمن.'), L('Multiply the outside number by each term inside.', 'اضرب العدد الخارجي في كل حد داخل القوس.'), L('Do you get the left side back?', 'هل تحصل على الطرف الأيسر؟')),
      steps: [good ? L('Expanding gives the original expression.', 'فك الأقواس يعطي العبارة الأصلية.') : L('Expanding gives something different.', 'فك الأقواس يعطي عبارة مختلفة.')],
      explanation: L('Factoring is the reverse of expanding, so expanding is the best check.', 'التحليل عكس الفك، لذا فك الأقواس أفضل طريقة للتحقق.'),
    });
  }),
];

// ───────────────────────── Inequalities ─────────────────────────

type Op = '>' | '<' | '\\ge' | '\\le';
const flipOp = (o: Op): Op => (o === '>' ? '<' : o === '<' ? '>' : o === '\\ge' ? '\\le' : '\\ge');
const holds = (lhs: Fraction, o: Op, rhs: Fraction): boolean => (o === '>' ? lhs.gt(rhs) : o === '<' ? lhs.lt(rhs) : o === '\\ge' ? lhs.gt(rhs) || lhs.eq(rhs) : lhs.lt(rhs) || lhs.eq(rhs));
const OPS: Op[] = ['>', '<', '\\ge', '\\le'];

const inequalities: Generator[] = [
  G('solve', 'inequalities', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const op = rng.pick(d <= 2 ? (['>', '<'] as Op[]) : OPS);
    const a = d >= 3 ? rng.pick([-2, -3, -4, -5, -6, 2, 3, 4]) : rng.int(2, 6);
    const x0 = nzInt(rng, d >= 4 ? -9 : 1, 9);
    const b = d >= 2 ? nzInt(rng, -9, 9) : 0;
    const c = a * x0 + b;
    const lhs = b === 0 ? term(a, 'x') : lin(a, b);
    const finalOp = a < 0 ? flipOp(op) : op;
    const mk = (o: Op, v: number) => `x ${o} ${v}`;
    const wrongs = [
      { label: S(mt(mk(a < 0 ? op : flipOp(op), x0))), pid: 'ineq-flip' },
      { label: S(mt(mk(finalOp, -x0))), pid: 'sign-error' },
      { label: S(mt(mk(a < 0 ? op : flipOp(op), -x0))), pid: 'ineq-flip' },
    ];
    return mcqText(rng, {
      prompt: L('Solve the inequality.', 'حلّ المتباينة.'),
      display: `${lhs} ${op} ${c}`,
      correct: S(mt(mk(finalOp, x0))),
      wrongs,
      hints: H(
        L('Solve it like an equation.', 'حلّها كما تحلّ المعادلة.'),
        L(b === 0 ? `Divide both sides by ${a}.` : `First ${b < 0 ? 'add' : 'subtract'} ${Math.abs(b)}, then divide by ${a}.`, b === 0 ? `اقسم الطرفين على ${a}.` : `أولًا ${b < 0 ? 'أضف' : 'اطرح'} ${Math.abs(b)} ثم اقسم على ${a}.`),
        L('If you multiply or divide by a NEGATIVE number, flip the inequality sign.', 'إذا ضربت أو قسمت على عدد سالب فاقلب اتجاه علامة المتباينة.'),
      ),
      steps: [S(`${minus(a)}x ${c - b >= 0 || true ? '' : ''}${b === 0 ? '' : `= ${minus(c - b)} (after moving ${minus(b)})`}`.trim()), a < 0 ? L(`Dividing by ${a} (negative) flips the sign.`, `القسمة على ${a} (سالب) تقلب العلامة.`) : L(`Dividing by ${a} keeps the sign.`, `القسمة على ${a} تُبقي العلامة.`), L(`Answer: ${mt(mk(finalOp, x0))}`, `الجواب: ${mt(mk(finalOp, x0))}`)],
      explanation: L('Multiplying or dividing by a negative number reverses the inequality.', 'الضرب أو القسمة على عدد سالب يعكس اتجاه المتباينة.'),
    });
  }),

  G('integer-solution', 'inequalities', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const a = rng.int(2, 7);
    const b = nzInt(rng, -10, 10);
    const c = nzInt(rng, -20, 40);
    const t = F(c - b, a);
    const op = rng.pick(d <= 2 ? (['>', '<'] as Op[]) : OPS);
    const wantSmallest = op === '>' || op === '\\ge';
    let ans: number;
    if (op === '>') ans = t.floor() + 1;
    else if (op === '\\ge') ans = t.isInt() ? t.toNumber() : t.floor() + 1;
    else if (op === '<') ans = t.isInt() ? t.toNumber() - 1 : t.floor();
    else ans = t.floor();
    const opText = op === '>' ? '>' : op === '<' ? '<' : op === '\\ge' ? '≥' : '≤';
    return typed({
      prompt: wantSmallest ? L('What is the smallest whole number that satisfies this inequality?', 'ما أصغر عدد صحيح يحقق هذه المتباينة؟') : L('What is the largest whole number that satisfies this inequality?', 'ما أكبر عدد صحيح يحقق هذه المتباينة؟'),
      display: `${lin(a, b)} ${op} ${c}`,
      value: ans,
      extra: { integerOnly: true },
      errors: ne(ans, [[wantSmallest ? ans - 1 : ans + 1, 'off-by-one'], [t.isInt() ? t.toNumber() : t.floor() + (wantSmallest ? 0 : 1), 'off-by-one']]),
      hints: H(L('First solve the inequality for x.', 'حلّ المتباينة أولًا لإيجاد x.'), L(`x ${opText} ${t.toString()}${t.isInt() ? '' : ` (≈ ${t.toDecimal(2)})`}`, `x ${opText} ${t.toString()}${t.isInt() ? '' : ` (≈ ${t.toDecimal(2)})`}`), L(op === '>' || op === '<' ? 'The boundary itself is NOT allowed.' : 'The boundary itself IS allowed.', op === '>' || op === '<' ? 'القيمة الحدّية نفسها غير مسموح بها.' : 'القيمة الحدّية نفسها مسموح بها.')),
      steps: [S(`x ${opText} ${t.toString()}`), S(`${ans}`)],
      explanation: L('Strict signs (< and >) exclude the boundary; ≤ and ≥ include it.', 'العلامتان الصارمتان (< و >) تستثنيان الحد؛ أما ≤ و ≥ فتشملانه.'),
    });
  }),

  G('is-solution', 'inequalities', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const a = d >= 3 ? rng.pick([-3, -2, 2, 3, 4]) : rng.int(2, 5);
    const b = nzInt(rng, -8, 8);
    const c = nzInt(rng, -15, 25);
    const op = rng.pick(OPS);
    const v = nzInt(rng, -10, 12);
    const truth = holds(F(a * v + b), op, F(c));
    return tfBody({
      prompt: L('True or false?', 'صح أم خطأ؟'),
      display: `x = ${v}\\ \\text{is a solution of}\\ ${lin(a, b)} ${op} ${c}`,
      truth,
      pid: 'ineq-flip',
      hints: H(L('Substitute x into the left side.', 'عوّض x في الطرف الأيسر.'), L(`${a} × ${pp(v)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(a * v + b)}`, `${a} × ${pp(v)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${minus(a * v + b)}`), L(`Compare ${minus(a * v + b)} with ${minus(c)} using the sign.`, `قارن ${minus(a * v + b)} مع ${minus(c)} باستخدام العلامة.`)),
      steps: [S(`${minus(a * v + b)} ${op === '>' ? '>' : op === '<' ? '<' : op === '\\ge' ? '≥' : '≤'} ${minus(c)} ?`), truth ? L('Yes, so it is a solution.', 'نعم إذن هو حل.') : L('No, so it is not a solution.', 'لا إذن ليس حلًّا.')],
      explanation: L('A solution makes the inequality true when substituted.', 'الحل يجعل المتباينة صحيحة عند التعويض.'),
    });
  }),
];

// ───────────────────────── Linear functions ─────────────────────────

const linearFunctions: Generator[] = [
  G('evaluate', 'linear-functions', 'type-answer', [1, 2, 3], (rng, d) => {
    const m = d >= 3 ? nzInt(rng, -6, 6) : rng.int(1, 6);
    const b = d >= 2 ? nzInt(rng, -9, 9) : rng.int(1, 9);
    const k = d >= 3 ? nzInt(rng, -6, 8) : rng.int(1, 8);
    if (Math.abs(m) === 1) throw new RangeError('trivial slope');
    const v = m * k + b;
    return typed({
      prompt: L(`Find f(${k}).`, `أوجد f(${k}).`),
      display: `f(x) = ${lin(m, b)}`,
      value: v,
      extra: { integerOnly: true },
      errors: ne(v, [[m * k - b, 'sign-error'], [m + k + b, 'wrong-operation'], [m * -k + b, 'sign-error']]),
      hints: H(L(`Replace x by ${k}.`, `عوّض عن x بالقيمة ${k}.`), L(`${m} × ${pp(k)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `${m} × ${pp(k)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`), L('Multiply first, then add or subtract.', 'اضرب أولًا ثم اجمع أو اطرح.')),
      steps: [S(`f(${k}) = ${m} × ${pp(k)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`), S(`= ${minus(v)}`)],
      explanation: L('f(k) means "the output when the input is k".', 'f(k) تعني «الناتج عندما يكون المدخل k».'),
    });
  }),

  G('slope', 'linear-functions', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const x1 = rng.int(-4, 4);
    let dx = d <= 3 ? rng.int(1, 4) : nzInt(rng, -5, 5);
    if (dx === 0) dx = 1;
    const y1 = rng.int(-5, 5);
    let dy: number;
    if (d === 2) dy = dx * rng.int(1, 4);
    else if (d === 3) dy = rng.int(1, 8);
    else if (d === 4) dy = dx * nzInt(rng, -4, 4);
    else dy = nzInt(rng, -8, 8);
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    const slope = F(dy, dx);
    if (slope.isZero()) throw new RangeError('flat');
    return typed({
      prompt: L('Find the slope of the line through these two points.', 'أوجد ميل المستقيم المار بالنقطتين.'),
      display: `(${x1},\\ ${y1})\\ \\text{and}\\ (${x2},\\ ${y2})`,
      value: slope,
      errors: ne(slope, [[slope.neg(), 'slope-sign'], [slope.inv(), 'coordinate-swap'], [F(dx, dy).neg(), 'coordinate-swap']]),
      hints: H(L('Slope = rise ÷ run.', 'الميل = التغير الرأسي ÷ التغير الأفقي.'), L('Rise = y₂ − y₁, run = x₂ − x₁.', 'التغير الرأسي = ص₂ − ص₁، والأفقي = س₂ − س₁.'), L(`Rise = ${minus(dy)}, run = ${minus(dx)}.`, `الرأسي = ${minus(dy)}، والأفقي = ${minus(dx)}.`)),
      steps: [S(`rise = ${y2} − ${pp(y1)} = ${minus(dy)}`), S(`run = ${x2} − ${pp(x1)} = ${minus(dx)}`), S(`slope = ${minus(dy)} ÷ ${pp(dx)} = ${slope.toString().replace('-', '−')}`)],
      explanation: L('Subtract the coordinates in the same order for both x and y.', 'اطرح الإحداثيات بالترتيب نفسه لـ س وص.'),
    });
  }),

  G('y-intercept', 'linear-functions', 'mcq', [1, 2, 3], (rng, d) => {
    const m = nzInt(rng, -6, 6);
    const b = nzInt(rng, -9, 9);
    if (Math.abs(m) === Math.abs(b) || Math.abs(m) === 1 || b === 0) throw new RangeError('ambiguous');
    const display = `y = ${lin(m, b)}`;
    const cands = [
      { label: S(String(m)), pid: 'intercept-mixup' },
      { label: S(String(-b)), pid: 'sign-error' },
      { label: S(String(m + b)), pid: 'wrong-operation' },
    ];
    void d;
    return mcqText(rng, {
      prompt: L('What is the y-intercept of this line?', 'ما نقطة تقاطع هذا المستقيم مع محور ص؟'),
      display,
      correct: S(String(b)),
      wrongs: cands,
      hints: H(L('The y-intercept is where the line crosses the y-axis, at x = 0.', 'نقطة التقاطع مع محور ص هي حيث يقطع المستقيم المحور عند س = 0.'), L('Put x = 0 into the equation.', 'ضع x = 0 في المعادلة.'), L(`y = ${m} × 0 ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `y = ${m} × 0 ${b < 0 ? '−' : '+'} ${Math.abs(b)}`)),
      steps: [S(`x = 0 → y = ${minus(b)}`)],
      explanation: L('In y = mx + b, b is the y-intercept and m is the slope.', 'في y = mx + b العدد b هو التقاطع مع ص والعدد m هو الميل.'),
    });
  }),

  G('equation-pick', 'linear-functions', 'select-formula', [2, 3, 4], (rng, d) => {
    const m = nzInt(rng, -6, 6);
    const b = nzInt(rng, -9, 9);
    if (Math.abs(m) === 1 || Math.abs(m) === Math.abs(b)) throw new RangeError('ambiguous');
    void d;
    const eq = (mm: number, bb: number) => `y = ${lin(mm, bb)}`;
    return mcqText(rng, {
      prompt: L(`A line has slope ${m} and y-intercept ${b}. Which equation is it?`, `ميل مستقيم ${m} ونقطة تقاطعه مع ص ${b}. ما معادلته؟`),
      correct: S(mt(eq(m, b))),
      wrongs: [
        { label: S(mt(eq(b, m))), pid: 'intercept-mixup' },
        { label: S(mt(eq(-m, b))), pid: 'slope-sign' },
        { label: S(mt(eq(m, -b))), pid: 'sign-error' },
      ],
      hints: H(L('Use y = mx + b.', 'استخدم y = mx + b.'), L('m is the slope, b is the y-intercept.', 'العدد m هو الميل و b هو التقاطع مع ص.'), L(`m = ${m}, b = ${b}.`, `m = ${m}، b = ${b}.`)),
      steps: [S(`y = mx + b → y = ${lin(m, b)}`)],
      explanation: L('Slope goes with x; the intercept stands alone.', 'الميل يرافق x والتقاطع يقف وحده.'),
    });
  }),

  G('match-slopes', 'linear-functions', 'matching', [1, 2, 3], (rng) => {
    const ms = rng.sample([-4, -3, -2, 2, 3, 4, 5], 3);
    const pairs = ms.map((m) => ({ left: S(mt(`y = ${lin(m, rng.int(1, 9))}`)), right: L(`slope ${m}`, `الميل ${m}`) }));
    return matchBody(rng, {
      prompt: L('Match each line to its slope.', 'صِل كل مستقيم بميله.'),
      pairs,
      hints: H(L('In y = mx + b the slope is the number multiplying x.', 'في y = mx + b الميل هو العدد المضروب في x.'), L('Ignore the constant at the end.', 'تجاهل الحد الثابت في النهاية.'), L('Keep the sign.', 'احتفظ بالإشارة.')),
      steps: pairs.map((_, i) => S(`slope = ${ms[i]}`)),
      explanation: L('The slope is the coefficient of x.', 'الميل هو معامل x.'),
    });
  }),

  G('fare', 'linear-functions', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const base = rng.int(2, 15);
    const rate = rng.int(2, 9);
    const k = rng.int(3, 20);
    const total = base + rate * k;
    if (d <= 3) {
      return typed({
        prompt: L(`A taxi fare is $${base} plus $${rate} per km, so the cost is ${mt(`C = ${rate}k + ${base}`)}. How much does a ${k} km trip cost?`, `أجرة سيارة الأجرة ${base} دولارًا بالإضافة إلى ${rate} دولارات لكل كم، أي ${mt(`C = ${rate}k + ${base}`)}. كم تكلّف رحلة ${k} كم؟`),
        value: total,
        suffix: '$',
        extra: { integerOnly: true },
        errors: ne(total, [[rate * k, 'intercept-mixup'], [(base + rate) * k, 'wrong-operation']]),
        hints: H(L('Substitute k into the formula.', 'عوّض k في القانون.'), L(`C = ${rate} × ${k} + ${base}`, `C = ${rate} × ${k} + ${base}`), L('The start fee is added once.', 'رسم البدء يُضاف مرة واحدة.')),
        steps: [S(`${rate} × ${k} = ${rate * k}`), S(`${rate * k} + ${base} = ${total}`)],
        explanation: L('In a linear model, the rate multiplies the input and the start value is added once.', 'في النموذج الخطي يضرب المعدل المدخل ويُضاف القيمة الابتدائية مرة واحدة.'),
      });
    }
    return typed({
      prompt: L(`A taxi fare is ${mt(`C = ${rate}k + ${base}`)} dollars. A trip cost $${total}. How many km was it?`, `أجرة سيارة الأجرة ${mt(`C = ${rate}k + ${base}`)} دولارًا. كلّفت رحلة ${total} دولارًا. كم كيلومترًا قطعت؟`),
      value: k,
      suffix: 'km',
      extra: { integerOnly: true },
      errors: ne(k, [[F(total, rate), 'divide-both-sides'], [F(total + base, rate), 'sign-error']]),
      hints: H(L('Set C equal to the total and solve for k.', 'ساوِ C بالمجموع وحلّ لإيجاد k.'), L(`${rate}k + ${base} = ${total}`, `${rate}k + ${base} = ${total}`), L(`Subtract ${base}, then divide by ${rate}.`, `اطرح ${base} ثم اقسم على ${rate}.`)),
      steps: [S(`${rate}k = ${total - base}`), S(`k = ${k}`)],
      explanation: L('Working backwards from the output uses the inverse operations.', 'العمل عكسيًا من الناتج يستخدم العمليات العكسية.'),
    });
  }),
];

export const L5_GENERATORS: Generator[] = [
  ...oneStep,
  ...twoStep,
  ...bothSides,
  ...simplifying,
  ...distributive,
  ...factoring,
  ...inequalities,
  ...linearFunctions,
];
