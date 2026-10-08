import type { Generator, Rng } from '@/types';
import { Fraction } from '../fraction';
import { G, compareBody, mcqText, orderBody, matchBody, tfBody, typed } from '../build';
import { H, L, differ, nz, par, same } from '../kit';
import { L4_NUMBER_THEORY } from './l4-numbertheory';

const F = Fraction.of;
const mt = (s: string) => `$${s}$`;
const S = (s: string) => same(s);
/** Plain-text number with parentheses around negatives, for step text. */
const pp = (n: number): string => (n < 0 ? `(−${-n})` : String(n));
const signedText = (n: number): string => (n < 0 ? `−${-n}` : String(n));
/** Drop likely-error entries that equal the correct value. */
const ne = (v: number | Fraction, list: [number | Fraction, string][]): [number | Fraction, string][] => {
  const vf = typeof v === 'number' ? F(v) : v;
  return list.filter(([x]) => !(typeof x === 'number' ? F(x) : x).eq(vf));
};

// ───────────────────────── Order of operations ─────────────────────────

interface Calc {
  tex: string;
  val: Fraction;
  /** What a student who just works left to right would get. */
  wrong: Fraction;
  steps: L10n2[];
}
type L10n2 = { en: string; ar: string };

function opsCase(rng: Rng, d: number): Calc {
  const mk = (tex: string, val: number | Fraction, wrong: number | Fraction, steps: string[]): Calc => {
    const v = typeof val === 'number' ? F(val) : val;
    const w = typeof wrong === 'number' ? F(wrong) : wrong;
    if (v.eq(w) || v.n < 0) throw new RangeError('unusable draw');
    return { tex, val: v, wrong: w, steps: steps.map(S) };
  };
  if (d === 1) {
    const a = rng.int(2, 9);
    const b = rng.int(2, 6);
    const c = rng.int(2, 6);
    return mk(`${a} + ${b} \\times ${c}`, a + b * c, (a + b) * c, [`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`]);
  }
  if (d === 2) {
    const v = rng.int(0, 2);
    if (v === 0) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const c = rng.int(2, 6);
      return mk(`(${a} + ${b}) \\times ${c}`, (a + b) * c, a + b * c, [`${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`]);
    }
    if (v === 1) {
      const b = rng.int(2, 6);
      const c = rng.int(2, 6);
      const a = rng.int(b * c + 1, b * c + 15);
      return mk(`${a} - ${b} \\times ${c}`, a - b * c, (a - b) * c, [`${b} × ${c} = ${b * c}`, `${a} − ${b * c} = ${a - b * c}`]);
    }
    const a = rng.int(2, 6);
    const b = rng.int(2, 6);
    const c = rng.int(2, 6);
    const e = rng.int(2, 6);
    return mk(`${a} \\times ${b} + ${c} \\times ${e}`, a * b + c * e, (a * b + c) * e, [`${a} × ${b} = ${a * b}`, `${c} × ${e} = ${c * e}`, `${a * b} + ${c * e} = ${a * b + c * e}`]);
  }
  if (d === 3) {
    const v = rng.int(0, 2);
    if (v === 0) {
      const a = rng.int(5, 20);
      const b = rng.int(2, 6);
      const c = rng.int(2, 6);
      const dd = rng.int(1, a);
      return mk(`${a} + ${b} \\times ${c} - ${dd}`, a + b * c - dd, (a + b) * c - dd, [`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`, `${a + b * c} − ${dd} = ${a + b * c - dd}`]);
    }
    if (v === 1) {
      const a = rng.int(5, 20);
      const b = rng.int(2, 6);
      const c = rng.int(2, 6);
      const e = rng.int(2, 5);
      const k = rng.int(1, 6);
      const dd = e * k;
      return mk(`${a} + ${b} \\times ${c} - ${dd} \\div ${e}`, a + b * c - k, F((a + b) * c - dd, e), [`${b} × ${c} = ${b * c}`, `${dd} ÷ ${e} = ${k}`, `${a} + ${b * c} − ${k} = ${a + b * c - k}`]);
    }
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, 6);
    const dd = rng.int(1, 10);
    return mk(`(${a} + ${b}) \\times ${c} - ${dd}`, (a + b) * c - dd, a + b * c - dd, [`${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`, `${(a + b) * c} − ${dd} = ${(a + b) * c - dd}`]);
  }
  if (d === 4) {
    const v = rng.int(0, 2);
    if (v === 0) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 5);
      const c = rng.int(2, 4);
      return mk(`${a} + ${b}^{2} \\times ${c}`, a + b * b * c, (a + b) ** 2 * c, [`${b}² = ${b * b}`, `${b * b} × ${c} = ${b * b * c}`, `${a} + ${b * b * c} = ${a + b * b * c}`]);
    }
    if (v === 1) {
      const a = rng.int(1, 4);
      const b = rng.int(2, 5);
      const c = rng.int(2, 4);
      const dd = rng.int(2, 4);
      const s = a + b;
      return mk(`(${a} + ${b})^{2} - ${c} \\times ${dd}`, s * s - c * dd, (s * s - c) * dd, [`${a} + ${b} = ${s}`, `${s}² = ${s * s}`, `${c} × ${dd} = ${c * dd}`, `${s * s} − ${c * dd} = ${s * s - c * dd}`]);
    }
    const c = rng.int(2, 5);
    const dd = rng.int(2, 5);
    const b = rng.int(2, 6);
    const a = rng.int(c * dd, c * dd + 12);
    return mk(`${a} + ${b}^{2} - ${c} \\times ${dd}`, a + b * b - c * dd, ((a + b) ** 2 - c) * dd, [`${b}² = ${b * b}`, `${c} × ${dd} = ${c * dd}`, `${a} + ${b * b} = ${a + b * b}`, `${a + b * b} − ${c * dd} = ${a + b * b - c * dd}`]);
  }
  if (rng.chance(0.5)) {
    const e = rng.pick([2, 3, 4, 5]);
    const k = rng.int(1, 3);
    const dd = e * k;
    const a = rng.int(4, 9);
    const b = rng.int(2, 6);
    const c = rng.int(3, 8);
    const q = (dd * dd) / e;
    return mk(`${a} \\times (${b} + ${c}) - ${dd}^{2} \\div ${e}`, a * (b + c) - q, F((a * (b + c) - dd) ** 2, e), [`${b} + ${c} = ${b + c}`, `${a} × ${b + c} = ${a * (b + c)}`, `${dd}² = ${dd * dd}, then ${dd * dd} ÷ ${e} = ${q}`, `${a * (b + c)} − ${q} = ${a * (b + c) - q}`]);
  }
  const a = rng.int(1, 6);
  const b = rng.int(1, 6);
  const dd = rng.int(1, 5);
  const c = rng.int(dd + 1, dd + 6);
  const e = rng.int(2, 6);
  return mk(`(${a} + ${b}) \\times (${c} - ${dd}) + ${e}^{2}`, (a + b) * (c - dd) + e * e, ((a + b) * (c - dd) + e) ** 2, [`${a} + ${b} = ${a + b}`, `${c} − ${dd} = ${c - dd}`, `${a + b} × ${c - dd} = ${(a + b) * (c - dd)}`, `${e}² = ${e * e}`, `${(a + b) * (c - dd)} + ${e * e} = ${(a + b) * (c - dd) + e * e}`]);
}

const ORDER_HINTS = H(
  L('Remember the order: brackets, powers, × and ÷, then + and −.', 'تذكّر الترتيب: الأقواس، ثم القوى، ثم × و÷، ثم + و−.'),
  L('Do not work strictly left to right. Find the part that comes first.', 'لا تحسب من اليسار إلى اليمين فقط. ابحث عن الجزء الذي يأتي أولًا.'),
  L('Write the result of the first step, then repeat on what is left.', 'اكتب ناتج الخطوة الأولى ثم كرّر على ما تبقّى.'),
);

const orderOfOperations: Generator[] = [
  G('evaluate', 'order-of-operations', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const c = opsCase(rng, d);
    return typed({
      prompt: L('Calculate. Follow the order of operations.', 'احسب مع اتّباع ترتيب العمليات.'),
      display: c.tex,
      value: c.val,
      errors: [[c.wrong, 'order-ops']],
      hints: ORDER_HINTS,
      steps: c.steps,
      explanation: L('Brackets and powers first, then multiplication and division, then addition and subtraction.', 'الأقواس والقوى أولًا، ثم الضرب والقسمة، ثم الجمع والطرح.'),
    });
  }),

  G('first-step', 'order-of-operations', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    type Form = { tex: string; right: string; wrongs: string[] };
    const forms: Form[] = [
      { tex: `${a} + ${b} \\times ${c}`, right: `${b} \\times ${c}`, wrongs: [`${a} + ${b}`, `${a} \\times ${c}`, `${a} + ${c}`] },
      { tex: `(${a} + ${b}) \\times ${c}`, right: `${a} + ${b}`, wrongs: [`${b} \\times ${c}`, `${a} \\times ${c}`, `${a} + ${c}`] },
      { tex: `${a + b * c} - ${b} \\div ${c === b ? c + 1 : c}`, right: `${b} \\div ${c === b ? c + 1 : c}`, wrongs: [`${a + b * c} - ${b}`, `${a + b * c} \\div ${c === b ? c + 1 : c}`, `${a + b * c} - ${c}`] },
      { tex: `${a} + ${b}^{2} \\times ${c}`, right: `${b}^{2}`, wrongs: [`${a} + ${b}`, `${b}^{2} \\times ${c}`, `${a} + ${c}`] },
    ];
    const f = forms[d === 1 ? rng.int(0, 1) : d === 2 ? rng.int(0, 2) : rng.int(0, 3)] as Form;
    return mcqText(rng, {
      prompt: L('Which part do you calculate first?', 'أي جزء تحسبه أولًا؟'),
      display: f.tex,
      correct: S(mt(f.right)),
      wrongs: f.wrongs.map((w, i) => ({ label: S(mt(w)), pid: i === 0 ? 'order-ops' : undefined })),
      hints: H(
        L('Look for brackets first.', 'ابحث عن الأقواس أولًا.'),
        L('If there are no brackets, look for powers, then × or ÷.', 'إن لم توجد أقواس فابحث عن القوى ثم × أو ÷.'),
        L('Addition and subtraction come last.', 'الجمع والطرح يأتيان أخيرًا.'),
      ),
      steps: [L('Brackets → powers → × ÷ → + −.', 'الأقواس ← القوى ← × ÷ ← + −.'), L(`So the first calculation is ${f.right.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\^\{2\}/g, '²')}.`, `إذن أول عملية هي ${f.right.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\^\{2\}/g, '²')}.`)],
      explanation: L('The order of operations tells everyone to read an expression the same way.', 'ترتيب العمليات يجعل الجميع يقرؤون العبارة بالطريقة نفسها.'),
    });
  }),

  G('true-false', 'order-of-operations', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    const c = opsCase(rng, d);
    const truth = rng.chance(0.5);
    const shown = truth ? c.val : c.wrong.isInt() && !c.wrong.eq(c.val) ? c.wrong : c.val.add(F(rng.pick([1, 2, 10, -1])));
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${c.tex} = ${shown.toString()}`,
      truth,
      pid: 'order-ops',
      hints: ORDER_HINTS,
      steps: [...c.steps, S(`= ${c.val.toString()}`), truth ? L('The statement matches.', 'العبارة مطابقة.') : L(`The statement says ${shown.toString()}, so it is false.`, `العبارة تقول ${shown.toString()} فهي خاطئة.`)],
      explanation: L('Always check which operation comes first before deciding.', 'تحقّق دائمًا من العملية التي تأتي أولًا قبل أن تحكم.'),
    });
  }),

  G('missing-number', 'order-of-operations', 'fill-blank', [2, 3, 4], (rng, d) => {
    const a = rng.int(2, 12);
    const b = rng.int(2, 6);
    const c = rng.int(2, 9);
    if (d === 2) {
      return typed({
        prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
        display: `${a} + ${b} \\times \\square = ${a + b * c}`,
        value: c,
        extra: { integerOnly: true },
        errors: [[(a + b * c) / (a + b), 'order-ops']].filter(([v]) => Number.isInteger(v)) as [number, string][],
        hints: H(L('Multiplication happens before addition.', 'الضرب يتم قبل الجمع.'), L(`Take ${a} away from ${a + b * c} first.`, `اطرح ${a} من ${a + b * c} أولًا.`), L(`Then ask: ${b} × ? = ${b * c}.`, `ثم اسأل: ${b} × ؟ = ${b * c}.`)),
        steps: [S(`${a + b * c} − ${a} = ${b * c}`), S(`${b * c} ÷ ${b} = ${c}`)],
        explanation: L('Undo the addition first, then undo the multiplication.', 'ألغِ الجمع أولًا ثم ألغِ الضرب.'),
      });
    }
    if (d === 3) {
      return typed({
        prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
        display: `(${a} + \\square) \\times ${b} = ${(a + c) * b}`,
        value: c,
        extra: { integerOnly: true },
        hints: H(L('The bracket is multiplied by the number outside.', 'القوس مضروب في العدد الذي خارجه.'), L(`Divide ${(a + c) * b} by ${b} to get the bracket.`, `اقسم ${(a + c) * b} على ${b} لتحصل على القوس.`), L(`Then ${a} + ? = ${a + c}.`, `ثم ${a} + ؟ = ${a + c}.`)),
        steps: [S(`${(a + c) * b} ÷ ${b} = ${a + c}`), S(`${a + c} − ${a} = ${c}`)],
        explanation: L('The bracket is one whole number, so undo the multiplication first.', 'القوس عدد واحد كامل، فألغِ الضرب أولًا.'),
      });
    }
    const e = rng.int(2, 5);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `${a} + \\square^{2} \\times ${e} = ${a + c * c * e}`,
      value: c,
      extra: { integerOnly: true },
      hints: H(L('Undo the addition, then the multiplication, then the power.', 'ألغِ الجمع ثم الضرب ثم القوة.'), L(`${a + c * c * e} − ${a} = ${c * c * e}.`, `${a + c * c * e} − ${a} = ${c * c * e}.`), L(`${c * c * e} ÷ ${e} = ${c * c}. Which number squared gives that?`, `${c * c * e} ÷ ${e} = ${c * c}. أي عدد مربّعه يعطي هذا الناتج؟`)),
      steps: [S(`${a + c * c * e} − ${a} = ${c * c * e}`), S(`${c * c * e} ÷ ${e} = ${c * c}`), S(`√${c * c} = ${c}`)],
      explanation: L('Work backwards through the order of operations.', 'اعمل عكسيًا على ترتيب العمليات.'),
    });
  }),

  G('compare-values', 'order-of-operations', 'compare', [2, 3, 4], (rng, d) => {
    const a = rng.int(2, d === 2 ? 7 : 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, d === 2 ? 7 : 9);
    const v = rng.int(0, d === 2 ? 1 : 2);
    const ex = [
      { l: `${a} + ${b} \\times ${c}`, lv: a + b * c, r: `(${a} + ${b}) \\times ${c}`, rv: (a + b) * c },
      { l: `${a} \\times ${b} + ${c}`, lv: a * b + c, r: `${a} \\times (${b} + ${c})`, rv: a * (b + c) },
      { l: `${a} + ${b} \\times ${c}`, lv: a + b * c, r: `${a} \\times ${b} + ${c}`, rv: a * b + c },
    ][v] as { l: string; lv: number; r: string; rv: number };
    return compareBody({
      prompt: L('Compare the two expressions. Which sign goes in the box?', 'قارن بين العبارتين. أي إشارة تُوضع في المربع؟'),
      a: F(ex.lv),
      b: F(ex.rv),
      aTex: ex.l,
      bTex: ex.r,
      pids: { lt: 'order-ops', gt: 'order-ops', eq: 'order-ops' },
      hints: H(L('Work out each side separately.', 'احسب كل طرف على حدة.'), L('Use the order of operations on both sides.', 'استخدم ترتيب العمليات في الطرفين.'), L('Then compare the two numbers.', 'ثم قارن بين العددين.')),
      steps: [S(`${ex.l.replace(/\\times/g, '×')} = ${ex.lv}`), S(`${ex.r.replace(/\\times/g, '×')} = ${ex.rv}`), L('Compare the results.', 'قارن بين الناتجين.')],
      explanation: L('Brackets can change which operation happens first, so the value can change.', 'الأقواس قد تغيّر العملية التي تتم أولًا، فتتغيّر القيمة.'),
    });
  }),
];

// ───────────────────────── Negative numbers ─────────────────────────

const negativeNumbers: Generator[] = [
  G('add-subtract', 'negative-numbers', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const r = [9, 9, 15, 30, 99][d - 1] as number;
    const a = nz(rng, -r, r);
    const b = nz(rng, -r, r);
    if (d >= 4 && rng.chance(0.4)) {
      const c = nz(rng, -r, r);
      const val = a + b - c;
      return typed({
        prompt: L('Calculate.', 'احسب.'),
        display: `${a} + ${par(b)} - ${par(c)}`,
        value: val,
        errors: ne(val, [[a + b + c, 'negative-sign'], [-val, 'sign-error']]),
        hints: H(L('Work from left to right, one step at a time.', 'احسب من اليسار إلى اليمين خطوة خطوة.'), L('Subtracting a negative is the same as adding a positive.', 'طرح عدد سالب مثل جمع عدد موجب.'), L('Use a number line if it helps.', 'استعن بخط الأعداد إن احتجت.')),
        steps: [S(`${a} + ${pp(b)} = ${a + b}`), S(`${a + b} − ${pp(c)} = ${val}`)],
        explanation: L('Adding a negative moves left; subtracting a negative moves right.', 'جمع عدد سالب يعني الحركة لليسار، وطرح عدد سالب يعني الحركة لليمين.'),
      });
    }
    const plus = d === 1 ? true : rng.chance(0.5);
    const val = plus ? a + b : a - b;
    const alt = plus ? a - b : a + b;
    return typed({
      prompt: L('Calculate.', 'احسب.'),
      display: `${a} ${plus ? '+' : '-'} ${par(b)}`,
      value: val,
      errors: ne(val, [[alt, 'negative-sign'], [-val, 'sign-error']]),
      hints: H(
        L('Picture a number line. Adding moves right, subtracting moves left.', 'تخيّل خط الأعداد. الجمع حركة لليمين والطرح حركة لليسار.'),
        L(plus ? 'Adding a negative number is the same as subtracting its size.' : 'Subtracting a negative number is the same as adding its size.', plus ? 'جمع عدد سالب مثل طرح قيمته المطلقة.' : 'طرح عدد سالب مثل جمع قيمته المطلقة.'),
        L(plus ? `${a} + ${pp(b)} = ${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.` : `${a} − ${pp(b)} = ${a} ${b < 0 ? '+' : '−'} ${Math.abs(b)}.`, plus ? `${a} + ${pp(b)} = ${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.` : `${a} − ${pp(b)} = ${a} ${b < 0 ? '+' : '−'} ${Math.abs(b)}.`),
      ),
      steps: [S(`${a} ${plus ? '+' : '−'} ${pp(b)} = ${a} ${(plus ? b < 0 : b >= 0) ? '−' : '+'} ${Math.abs(b)}`), S(`= ${val}`)],
      explanation: L('Two signs next to each other combine: same signs make +, different signs make −.', 'إشارتان متجاورتان تندمجان: المتشابهتان تعطيان +، والمختلفتان تعطيان −.'),
    });
  }),

  G('multiply-divide', 'negative-numbers', 'mcq', [2, 3, 4, 5], (rng, d) => {
    const r = [0, 6, 9, 12, 15][d - 1] as number;
    const b = nz(rng, -r, r);
    const q = nz(rng, -r, r);
    const mul = rng.chance(0.5);
    const a = mul ? nz(rng, -r, r) : b * q;
    const val = mul ? a * b : a / b;
    const tex = mul ? `${par(a)} \\times ${par(b)}` : `${a} \\div ${par(b)}`;
    return mcqText(rng, {
      prompt: L('What is the answer?', 'ما الناتج؟'),
      display: tex,
      correct: S(String(val)),
      wrongs: [
        { label: S(String(-val)), pid: 'negative-sign' },
        { label: S(String(mul ? a + b : a - b)), pid: 'wrong-operation' },
        { label: S(String(Math.abs(val) + 1)), pid: 'table-slip' },
        { label: S(String(-(Math.abs(val) + 1))), pid: 'table-slip' },
        { label: S(String(Math.abs(val) + 2)), pid: 'table-slip' },
      ],
      hints: H(
        L('First ignore the signs and multiply or divide the sizes.', 'تجاهل الإشارات أولًا واضرب أو اقسم القيم المطلقة.'),
        L('Same signs → positive answer. Different signs → negative answer.', 'إشارتان متشابهتان ← ناتج موجب. إشارتان مختلفتان ← ناتج سالب.'),
        L(`The sizes give ${Math.abs(val)}.`, `القيم المطلقة تعطي ${Math.abs(val)}.`),
      ),
      steps: [S(`${Math.abs(a)} ${mul ? '×' : '÷'} ${Math.abs(b)} = ${Math.abs(val)}`), L(`The signs are ${a < 0 === b < 0 ? 'the same, so the answer is positive' : 'different, so the answer is negative'}: ${val}.`, `الإشارتان ${a < 0 === b < 0 ? 'متشابهتان فالناتج موجب' : 'مختلفتان فالناتج سالب'}: ${val}.`)],
      explanation: L('Multiplying or dividing: same signs give +, different signs give −.', 'في الضرب والقسمة: الإشارتان المتشابهتان تعطيان +، والمختلفتان تعطيان −.'),
    });
  }),

  G('order-numbers', 'negative-numbers', 'ordering', [1, 2, 3, 4], (rng, d) => {
    const count = d === 1 ? 4 : 5;
    const r = [6, 9, 15, 30][d - 1] as number;
    const set = new Set<number>();
    while (set.size < count) set.add(rng.int(-r, r));
    return orderBody(rng, {
      prompt: L('Put the numbers in order from smallest to largest.', 'رتّب الأعداد من الأصغر إلى الأكبر.'),
      entries: [...set].map((v) => ({ value: F(v), label: S(mt(String(v))) })),
      hints: H(L('Negative numbers are smaller than zero.', 'الأعداد السالبة أصغر من الصفر.'), L('The bigger the number after the minus sign, the smaller the number.', 'كلما كبر العدد بعد الإشارة السالبة صغرت قيمته.'), L('Start with the most negative number.', 'ابدأ بأكثر الأعداد سالبية.')),
      steps: [L('Place the numbers on a number line: left is smaller.', 'ضع الأعداد على خط الأعداد: اليسار أصغر.'), L('Read them from left to right.', 'اقرأها من اليسار إلى اليمين.')],
      explanation: L('On the number line, numbers increase from left to right.', 'على خط الأعداد تزداد الأعداد من اليسار إلى اليمين.'),
    });
  }),

  G('compare', 'negative-numbers', 'compare', [1, 2, 3, 4], (rng, d) => {
    const r = [9, 15, 30, 99][d - 1] as number;
    const a = rng.int(-r, r);
    const b = differ(rng, -r, r, a);
    return compareBody({
      prompt: L('Which sign goes in the box?', 'أي إشارة تُوضع في المربع؟'),
      a: F(a),
      b: F(b),
      aTex: String(a),
      bTex: String(b),
      pids: { lt: 'negative-sign', gt: 'negative-sign', eq: 'negative-sign' },
      hints: H(L('Think of a number line.', 'فكّر في خط الأعداد.'), L('Any negative number is less than any positive number.', 'أي عدد سالب أصغر من أي عدد موجب.'), L('Between two negatives, the one closer to zero is bigger.', 'بين عددين سالبين يكون الأقرب إلى الصفر هو الأكبر.')),
      steps: [L(`${a} is ${a < b ? 'to the left of' : 'to the right of'} ${b} on the number line.`, `${a} ${a < b ? 'على يسار' : 'على يمين'} ${b} على خط الأعداد.`)],
      explanation: L('The number further right on the number line is bigger.', 'العدد الأبعد جهة اليمين على خط الأعداد هو الأكبر.'),
    });
  }),

  G('temperature', 'negative-numbers', 'word-problem', [1, 2, 3, 4], (rng, d) => {
    const t = nz(rng, [-5, -10, -15, -25][d - 1] as number, [10, 12, 15, 25][d - 1] as number);
    const x = rng.int(2, [8, 15, 20, 35][d - 1] as number);
    const drop = rng.chance(0.5);
    const val = drop ? t - x : t + x;
    return typed({
      prompt: L(`At night the temperature is ${t}°C. It ${drop ? 'falls' : 'rises'} by ${x} degrees. What is the new temperature?`, `في الليل تكون درجة الحرارة ${t}°م. ${drop ? 'تنخفض' : 'ترتفع'} بمقدار ${x} درجة. ما درجة الحرارة الجديدة؟`),
      value: val,
      suffix: '°C',
      errors: ne(val, [[drop ? t + x : t - x, 'negative-sign'], [-val, 'sign-error']]),
      hints: H(L(`Is it getting warmer or colder? It ${drop ? 'falls, so colder' : 'rises, so warmer'}.`, `هل يصبح الجو أدفأ أم أبرد؟ ${drop ? 'تنخفض فيصبح أبرد' : 'ترتفع فيصبح أدفأ'}.`), L(`${drop ? 'Subtract' : 'Add'} ${x}.`, `${drop ? 'اطرح' : 'اجمع'} ${x}.`), L('Use a thermometer-style number line.', 'استعن بخط أعداد مثل مقياس الحرارة.')),
      steps: [S(`${t} ${drop ? '−' : '+'} ${x} = ${signedText(val)}`)],
      explanation: L('A fall moves down the thermometer (subtract); a rise moves up (add).', 'الانخفاض حركة لأسفل المقياس (طرح) والارتفاع حركة لأعلى (جمع).'),
    });
  }),

  G('sign-rules', 'negative-numbers', 'true-false', [2, 3, 4, 5], (rng, d) => {
    const a = rng.int(2, d * 4 + 3);
    const b = rng.int(2, d * 3 + 3);
    const kind = rng.int(0, 2);
    const truth = rng.chance(0.5);
    let display: string;
    let right: number;
    if (kind === 0) {
      right = a + b;
      const shown = truth ? right : a - b;
      display = `${a} - (-${b}) = ${shown}`;
    } else if (kind === 1) {
      right = a * b;
      const shown = truth ? right : -(a * b);
      display = `(-${a}) \\times (-${b}) = ${shown}`;
    } else {
      right = -(a * b);
      const shown = truth ? right : a * b;
      display = `(-${a}) \\times ${b} = ${shown}`;
    }
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display,
      truth,
      pid: 'negative-sign',
      hints: H(L('Two minus signs together make a plus.', 'إشارتا سالب متجاورتان تصبحان موجبًا.'), L('Same signs multiply to a positive; different signs to a negative.', 'ضرب إشارتين متشابهتين يعطي موجبًا، ومختلفتين يعطي سالبًا.'), L('Work out the real answer first.', 'احسب الناتج الصحيح أولًا.')),
      steps: [S(`${right}`), truth ? L('It matches, so the statement is true.', 'تتطابق، فالعبارة صحيحة.') : L('It does not match, so the statement is false.', 'لا تتطابق، فالعبارة خاطئة.')],
      explanation: L('Remember: − − = +, and a negative times a positive is negative.', 'تذكّر: − − = +، وسالب × موجب = سالب.'),
    });
  }),
];

// ───────────────────────── Exponents ─────────────────────────

const exponents: Generator[] = [
  G('evaluate', 'exponents', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let base: number;
    let exp: number;
    if (d === 1) {
      base = rng.int(2, 6);
      exp = 2;
    } else if (d === 2) {
      base = rng.int(2, 10);
      exp = rng.int(2, 3);
    } else if (d === 3) {
      base = rng.int(2, 12);
      exp = rng.pick([0, 1, 2, 3]);
    } else if (d === 4) {
      base = -rng.int(2, 5);
      exp = rng.int(2, 4);
    } else {
      base = rng.pick([2, 3, 5, 10, -2, -3]);
      exp = base === 10 ? rng.int(3, 6) : base === 2 ? rng.int(5, 9) : rng.int(3, 5);
    }
    const val = base ** exp;
    const tex = base < 0 ? `(${base})^{${exp}}` : `${base}^{${exp}}`;
    const wrongs: [number, string][] = [[base * exp, 'exponent-multiply']];
    if (exp === 0) wrongs.push([0, 'zero-exponent'], [base, 'zero-exponent']);
    if (exp === 1) wrongs.push([1, 'zero-exponent']);
    if (base < 0) wrongs.push([-val, 'negative-base']);
    const repeated = Array.from({ length: Math.min(exp, 6) }, () => pp(base)).join(' × ');
    return typed({
      prompt: L('Calculate the value.', 'احسب القيمة.'),
      display: tex,
      value: val,
      errors: ne(val, wrongs),
      hints: H(
        L('The small number says how many times to use the big number as a factor.', 'العدد الصغير يخبرك كم مرة تكتب العدد الكبير كعامل.'),
        L(exp <= 1 ? 'Remember: any number to the power 1 is itself, and to the power 0 is 1.' : `Write ${base} as a factor ${exp} times, then multiply.`, exp <= 1 ? 'تذكّر: أي عدد أسّه 1 يساوي نفسه، وأسّه 0 يساوي 1.' : `اكتب ${base} كعامل ${exp} مرات ثم اضرب.`),
        L(base < 0 ? 'An even number of negatives gives a positive; an odd number gives a negative.' : 'Multiply step by step.', base < 0 ? 'عدد زوجي من العوامل السالبة يعطي موجبًا، وعدد فردي يعطي سالبًا.' : 'اضرب خطوة خطوة.'),
      ),
      steps: [exp >= 2 ? S(`${repeated} = ${val}`) : exp === 1 ? S(`${base}¹ = ${base}`) : S(`${base}⁰ = 1`)],
      explanation: L('A power is repeated multiplication, not base × exponent.', 'القوة ضرب متكرر وليست الأساس × الأس.'),
    });
  }),

  G('laws', 'exponents', 'select-formula', [2, 3, 4], (rng, d) => {
    const b = rng.int(2, 9);
    const m = rng.int(2, 6);
    let n = rng.int(2, 5);
    while (n === m) n = rng.int(2, 5);
    const law = d === 2 ? 0 : d === 3 ? rng.int(0, 1) : rng.int(0, 2);
    if (law === 0) {
      return mcqText(rng, {
        prompt: L('Which result is correct?', 'أي ناتج هو الصحيح؟'),
        display: `${b}^{${m}} \\times ${b}^{${n}}`,
        correct: S(mt(`${b}^{${m + n}}`)),
        wrongs: [
          { label: S(mt(`${b}^{${m * n}}`)), pid: 'exponent-multiply' },
          { label: S(mt(`${b * b}^{${m + n}}`)), pid: 'exponent-multiply' },
          { label: S(mt(`${b}^{${Math.abs(m - n)}}`)), pid: 'wrong-operation' },
        ],
        hints: H(L('The bases are the same.', 'الأساسان متساويان.'), L('When you multiply powers with the same base, add the exponents.', 'عند ضرب قوى لها الأساس نفسه نجمع الأسس.'), L(`${m} + ${n} = ${m + n}.`, `${m} + ${n} = ${m + n}.`)),
        steps: [S(`${b}^${m} × ${b}^${n} = ${b}^(${m}+${n}) = ${b}^${m + n}`)],
        explanation: L('aᵐ × aⁿ = aᵐ⁺ⁿ: you are just counting how many times a appears.', 'aᵐ × aⁿ = aᵐ⁺ⁿ: أنت تعدّ كم مرة يظهر a.'),
      });
    }
    if (law === 1) {
      const hi = Math.max(m, n);
      const lo = Math.min(m, n);
      return mcqText(rng, {
        prompt: L('Which result is correct?', 'أي ناتج هو الصحيح؟'),
        display: `${b}^{${hi}} \\div ${b}^{${lo}}`,
        correct: S(mt(`${b}^{${hi - lo}}`)),
        wrongs: [
          { label: S(mt(`${b}^{${hi + lo}}`)), pid: 'wrong-operation' },
          { label: S(mt(`${b}^{${hi * lo}}`)), pid: 'exponent-multiply' },
          { label: S(mt(`${hi - lo}^{${b}}`)), pid: 'exponent-multiply' },
        ],
        hints: H(L('The bases are the same.', 'الأساسان متساويان.'), L('When you divide powers with the same base, subtract the exponents.', 'عند قسمة قوى لها الأساس نفسه نطرح الأسس.'), L(`${hi} − ${lo} = ${hi - lo}.`, `${hi} − ${lo} = ${hi - lo}.`)),
        steps: [S(`${b}^${hi} ÷ ${b}^${lo} = ${b}^(${hi}−${lo}) = ${b}^${hi - lo}`)],
        explanation: L('aᵐ ÷ aⁿ = aᵐ⁻ⁿ: common factors cancel.', 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ: العوامل المشتركة تُختصر.'),
      });
    }
    return mcqText(rng, {
      prompt: L('Which result is correct?', 'أي ناتج هو الصحيح؟'),
      display: `(${b}^{${m}})^{${n}}`,
      correct: S(mt(`${b}^{${m * n}}`)),
      wrongs: [
        { label: S(mt(`${b}^{${m + n}}`)), pid: 'exponent-multiply' },
        { label: S(mt(`${b * n}^{${m}}`)), pid: 'exponent-multiply' },
        { label: S(mt(`${b}^{${m ** n}}`)), pid: 'exponent-multiply' },
      ],
      hints: H(L('A power of a power.', 'قوة مرفوعة لقوة.'), L('Multiply the two exponents.', 'اضرب الأسّين.'), L(`${m} × ${n} = ${m * n}.`, `${m} × ${n} = ${m * n}.`)),
      steps: [S(`(${b}^${m})^${n} = ${b}^(${m}×${n}) = ${b}^${m * n}`)],
      explanation: L('(aᵐ)ⁿ = aᵐⁿ: n copies of aᵐ.', '(aᵐ)ⁿ = aᵐⁿ: n نسخة من aᵐ.'),
    });
  }),

  G('compare-powers', 'exponents', 'compare', [2, 3, 4, 5], (rng, d) => {
    const hiB = [5, 6, 8, 10][d - 2] as number;
    const a = rng.int(2, hiB);
    const x = rng.int(2, d + 2);
    let b = rng.int(2, hiB);
    let y = rng.int(2, d + 2);
    if (a === b && x === y) y = x + 1;
    if (rng.chance(0.3)) {
      b = x;
      y = a;
    }
    return compareBody({
      prompt: L('Compare the two powers. Which sign goes in the box?', 'قارن بين القوتين. أي إشارة تُوضع في المربع؟'),
      a: F(a ** x),
      b: F(b ** y),
      aTex: `${a}^{${x}}`,
      bTex: `${b}^{${y}}`,
      pids: { lt: 'exponent-multiply', gt: 'exponent-multiply', eq: 'exponent-multiply' },
      hints: H(L('Work out each power separately.', 'احسب كل قوة على حدة.'), L('Do not compare only the bases or only the exponents.', 'لا تقارن الأساسات فقط ولا الأسس فقط.'), L('Then compare the two results.', 'ثم قارن بين الناتجين.')),
      steps: [S(`${a}^${x} = ${a ** x}`), S(`${b}^${y} = ${b ** y}`), L('Compare the results.', 'قارن بين الناتجين.')],
      explanation: L('A bigger base or a bigger exponent does not always mean a bigger power; calculate to be sure.', 'الأساس الأكبر أو الأس الأكبر لا يعني دائمًا قوة أكبر؛ احسب لتتأكد.'),
    });
  }),

  G('find-exponent', 'exponents', 'fill-blank', [2, 3, 4], (rng, d) => {
    const b = rng.pick(d === 2 ? [2, 3, 5, 10] : [2, 3, 4, 5, 6, 10]);
    const e = rng.int(2, d === 2 ? 4 : d === 3 ? 5 : 7);
    const v = b ** e;
    return typed({
      prompt: L('Find the missing exponent.', 'أوجد الأس الناقص.'),
      display: `${b}^{\\square} = ${v}`,
      value: e,
      extra: { integerOnly: true },
      errors: ne(e, [[v / b, 'exponent-multiply']]),
      hints: H(L(`How many ${b}s multiplied together make ${v}?`, `كم عددًا من ${b} نضرب معًا لنحصل على ${v}؟`), L(`Try ${b}, ${b * b}, ${b ** 3}, …`, `جرّب ${b}، ${b * b}، ${b ** 3}، …`), L('Count how many steps it took.', 'عُدّ كم خطوة احتجت.')),
      steps: [S(Array.from({ length: e }, () => String(b)).join(' × ') + ` = ${v}`), L(`That is ${e} factors, so the exponent is ${e}.`, `هذه ${e} عوامل، إذن الأس هو ${e}.`)],
      explanation: L('The exponent counts how many times the base is multiplied.', 'الأس يعدّ كم مرة يُضرب الأساس.'),
    });
  }),

  G('match-values', 'exponents', 'matching', [1, 2, 3, 4], (rng, d) => {
    const pool: [number, number][] = [];
    for (let b = 2; b <= (d === 1 ? 5 : 10); b++) for (let e = 2; e <= (d <= 2 ? 3 : 4); e++) pool.push([b, e]);
    const chosen: [number, number][] = [];
    const seen = new Set<number>();
    for (const [b, e] of rng.shuffle(pool)) {
      if (seen.has(b ** e)) continue;
      seen.add(b ** e);
      chosen.push([b, e]);
      if (chosen.length === (d === 1 ? 3 : 4)) break;
    }
    return matchBody(rng, {
      prompt: L('Match each power with its value.', 'صِل كل قوة بقيمتها.'),
      pairs: chosen.map(([b, e]) => ({ left: S(mt(`${b}^{${e}}`)), right: S(String(b ** e)) })),
      hints: H(L('Calculate the easiest power first.', 'احسب أسهل قوة أولًا.'), L('Remember: 3² means 3 × 3, not 3 × 2.', 'تذكّر: 3² تعني 3 × 3 وليست 3 × 2.'), L('Cross out matches as you go.', 'اشطب ما تطابق أثناء التقدّم.')),
      steps: chosen.map(([b, e]) => S(`${b}^${e} = ${b ** e}`)),
      explanation: L('Each power is the base multiplied by itself as many times as the exponent says.', 'كل قوة هي الأساس مضروبًا في نفسه بعدد مرات الأس.'),
    });
  }),

  G('true-false', 'exponents', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const base = rng.int(2, d === 1 ? 5 : 9);
    const n = rng.int(2, d + 2);
    const zero = d >= 3 && rng.chance(0.4);
    const truth = rng.chance(0.5);
    const real = zero ? 1 : base ** n;
    const bad = zero ? rng.pick([0, base]) : base * n;
    const exp = zero ? 0 : n;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${base}^{${exp}} = ${truth ? real : bad}`,
      truth,
      pid: zero ? 'zero-exponent' : 'exponent-multiply',
      hints: H(L('A power is repeated multiplication.', 'القوة ضرب متكرر.'), L(zero ? 'Any number (except 0) to the power 0 is 1.' : 'Do not just multiply the base by the exponent.', zero ? 'أي عدد (غير الصفر) أسّه 0 يساوي 1.' : 'لا تضرب الأساس في الأس فقط.'), L(`The real value is ${real}.`, `القيمة الحقيقية هي ${real}.`)),
      steps: [S(zero ? `${base}⁰ = 1` : `${base}^${n} = ${real}`), truth ? L('So the statement is true.', 'إذن العبارة صحيحة.') : L(`${bad} is not ${real}, so it is false.`, `${bad} لا يساوي ${real} فالعبارة خاطئة.`)],
      explanation: L('Powers grow by repeated multiplication, not by simple multiplication.', 'القوى تنمو بالضرب المتكرر لا بالضرب البسيط.'),
    });
  }),
];

// ───────────────────────── Square roots ─────────────────────────

const squareRoots: Generator[] = [
  G('perfect', 'square-roots', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    if (d === 5) {
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const k = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
        return typed({
          prompt: L('Find the square root.', 'أوجد الجذر التربيعي.'),
          display: `\\sqrt{${(k * k) / 100}}`,
          value: F(k, 10),
          extra: { tolerance: 0.0001 },
          errors: [[F(k * k, 200), 'sqrt-half']],
          hints: H(L('Think of 0.49 as 49 hundredths.', 'فكّر في 0.49 على أنها 49 جزءًا من مئة.'), L('Take the root of the top and the bottom.', 'خذ جذر البسط وجذر المقام.'), L('√100 = 10.', '√100 = 10.')),
          steps: [S(`${(k * k) / 100} = ${k * k}/100`), S(`√${k * k} = ${k}, √100 = 10`), S(`${k}/10 = ${k / 10}`)],
          explanation: L('A decimal square root has half as many decimal places.', 'الجذر التربيعي لعدد عشري له نصف عدد المنازل العشرية.'),
        });
      }
      const [p, q] = rng.pick<[number, number]>([[3, 4], [2, 3], [5, 6], [3, 5], [4, 5], [2, 5], [7, 8], [5, 9]]);
      return typed({
        prompt: L('Find the square root.', 'أوجد الجذر التربيعي.'),
        display: `\\sqrt{\\frac{${p * p}}{${q * q}}}`,
        value: F(p, q),
        errors: [[F(p * p, 2 * q * q), 'sqrt-half']],
        hints: H(L('Find the root of the top and of the bottom separately.', 'أوجد جذر البسط وجذر المقام كلًّا على حدة.'), L(`√${p * p} = ${p}.`, `√${p * p} = ${p}.`), L(`√${q * q} = ${q}.`, `√${q * q} = ${q}.`)),
        steps: [S(`√${p * p} = ${p}`), S(`√${q * q} = ${q}`), S(`${p}/${q}`)],
        explanation: L('The root of a fraction is the root of the top over the root of the bottom.', 'جذر الكسر هو جذر البسط على جذر المقام.'),
      });
    }
    const k = rng.int(2, [6, 10, 15, 25][d - 1] as number);
    return typed({
      prompt: L('Find the square root.', 'أوجد الجذر التربيعي.'),
      display: `\\sqrt{${k * k}}`,
      value: k,
      extra: { integerOnly: true },
      errors: ne(k, [[(k * k) / 2, 'sqrt-half'], [2 * k, 'square-vs-double']]),
      hints: H(L('Which number multiplied by itself gives this number?', 'أي عدد إذا ضُرب في نفسه أعطى هذا العدد؟'), L(`Try numbers near ${Math.round(Math.sqrt(k * k))}.`, `جرّب أعدادًا قريبة من ${k}.`), L(`${k} × ${k} = ${k * k}.`, `${k} × ${k} = ${k * k}.`)),
      steps: [S(`${k} × ${k} = ${k * k}`), S(`√${k * k} = ${k}`)],
      explanation: L('A square root undoes squaring.', 'الجذر التربيعي يعكس التربيع.'),
    });
  }),

  G('between', 'square-roots', 'mcq', [2, 3, 4, 5], (rng, d) => {
    const k = rng.int(2, [6, 9, 12, 15][d - 2] as number);
    const n = rng.int(k * k + 1, (k + 1) * (k + 1) - 1);
    const lab = (a: number) => L(`${a} and ${a + 1}`, `${a} و ${a + 1}`);
    return mcqText(rng, {
      prompt: L('Between which two whole numbers is this square root?', 'بين أي عددين صحيحين يقع هذا الجذر التربيعي؟'),
      display: `\\sqrt{${n}}`,
      correct: lab(k),
      wrongs: [{ label: lab(k + 1), pid: 'not-estimated' }, { label: lab(k - 1), pid: 'not-estimated' }, { label: lab(k + 2), pid: 'not-estimated' }],
      hints: H(L('Find the perfect squares just below and just above.', 'جد المربعين الكاملين الأقرب من الأدنى ومن الأعلى.'), L(`${k}² = ${k * k} and ${k + 1}² = ${(k + 1) ** 2}.`, `${k}² = ${k * k} و ${k + 1}² = ${(k + 1) ** 2}.`), L(`${n} lies between them.`, `${n} يقع بينهما.`)),
      steps: [S(`${k}² = ${k * k} < ${n} < ${(k + 1) ** 2} = ${k + 1}²`), S(`${k} < √${n} < ${k + 1}`)],
      explanation: L('If a number is between two perfect squares, its root is between their roots.', 'إذا وقع عدد بين مربعين كاملين فجذره يقع بين جذريهما.'),
    });
  }),

  G('fill-root', 'square-roots', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const k = rng.int(2, [6, 10, 15, 20][d - 1] as number);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `\\sqrt{\\square} = ${k}`,
      value: k * k,
      extra: { integerOnly: true },
      errors: ne(k * k, [[2 * k, 'square-vs-double'], [k, 'sqrt-half']]),
      hints: H(L('Undo the square root by squaring.', 'اعكس الجذر بالتربيع.'), L(`Multiply ${k} by itself.`, `اضرب ${k} في نفسه.`), L(`${k} × ${k}.`, `${k} × ${k}.`)),
      steps: [S(`${k}² = ${k * k}`)],
      explanation: L('Squaring and the square root undo each other.', 'التربيع والجذر التربيعي يلغي كل منهما الآخر.'),
    });
  }),

  G('order-roots', 'square-roots', 'ordering', [3, 4, 5], (rng, d) => {
    const radicands = new Set<number>();
    while (radicands.size < (d === 3 ? 3 : 4)) radicands.add(rng.int(2, 60));
    const entries = [...radicands].map((n) => ({ value: F(Math.round(Math.sqrt(n) * 10000), 10000), label: S(mt(`\\sqrt{${n}}`)) }));
    let m = rng.int(2, 7);
    while (radicands.has(m * m)) m++;
    entries.push({ value: F(m), label: S(mt(String(m))) });
    return orderBody(rng, {
      prompt: L('Put these numbers in order from smallest to largest.', 'رتّب هذه الأعداد من الأصغر إلى الأكبر.'),
      entries,
      hints: H(L('A bigger number under the root gives a bigger root.', 'كلما كبر العدد تحت الجذر كبر الجذر.'), L(`Remember that ${m} = √${m * m}.`, `تذكّر أن ${m} = √${m * m}.`), L('Write every number as a square root to compare them easily.', 'اكتب كل عدد على صورة جذر لتسهل المقارنة.')),
      steps: [L(`Write ${m} as √${m * m}.`, `اكتب ${m} على صورة √${m * m}.`), L('Order by the number under the root.', 'رتّب حسب العدد تحت الجذر.')],
      explanation: L('Square roots keep the same order as the numbers inside them.', 'الجذور التربيعية تحافظ على ترتيب الأعداد التي تحتها.'),
    });
  }),

  G('true-false', 'square-roots', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    if (d >= 3 && rng.chance(0.6)) {
      const p = rng.int(2, 6);
      const q = differ(rng, 2, 6, p);
      const product = rng.chance(0.5);
      return tfBody({
        prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
        display: product ? `\\sqrt{${p * p} \\times ${q * q}} = \\sqrt{${p * p}} \\times \\sqrt{${q * q}}` : `\\sqrt{${p * p} + ${q * q}} = \\sqrt{${p * p}} + \\sqrt{${q * q}}`,
        truth: product,
        pid: 'wrong-operation',
        hints: H(L('Work out both sides.', 'احسب الطرفين.'), L(product ? 'The root of a product is the product of the roots.' : 'The root of a sum is not the sum of the roots.', product ? 'جذر حاصل الضرب هو حاصل ضرب الجذرين.' : 'جذر المجموع ليس مجموع الجذرين.'), L('Compare the two numbers you get.', 'قارن بين العددين الناتجين.')),
        steps: product ? [S(`√${p * p * q * q} = ${p * q}`), S(`${p} × ${q} = ${p * q}`)] : [S(`√(${p * p} + ${q * q}) = √${p * p + q * q}`), S(`√${p * p} + √${q * q} = ${p} + ${q} = ${p + q}`), L('They are not equal.', 'ليسا متساويين.')],
        explanation: L('You can split a root over multiplication, but not over addition.', 'يمكنك توزيع الجذر على الضرب لكن لا يمكنك توزيعه على الجمع.'),
      });
    }
    const k = rng.int(2, [6, 8, 10, 12, 15][d - 1] as number);
    const truth = rng.chance(0.5);
    const alt = rng.pick([k + 1, k - 1, 2 * k, k * k]);
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `\\sqrt{${k * k}} = ${truth ? k : alt}`,
      truth,
      pid: 'square-vs-double',
      hints: H(L('Which number times itself is the number under the root?', 'أي عدد مضروبًا في نفسه يساوي العدد تحت الجذر؟'), L(`Try ${k}.`, `جرّب ${k}.`), L(`${k} × ${k} = ${k * k}.`, `${k} × ${k} = ${k * k}.`)),
      steps: [S(`${k} × ${k} = ${k * k}, so √${k * k} = ${k}`), truth ? L('The statement is true.', 'العبارة صحيحة.') : L(`The statement says ${alt}, so it is false.`, `العبارة تقول ${alt} فهي خاطئة.`)],
      explanation: L('Check a square root by squaring your answer.', 'تحقّق من الجذر بتربيع إجابتك.'),
    });
  }),

  G('square-side', 'square-roots', 'word-problem', [1, 2, 3, 4], (rng, d) => {
    const k = rng.int(2, [8, 12, 15, 25][d - 1] as number);
    return typed({
      prompt: L(`A square garden has an area of ${k * k} m². How long is one side?`, `مساحة حديقة مربعة ${k * k} م². ما طول ضلعها؟`),
      value: k,
      suffix: 'm',
      extra: { integerOnly: true },
      errors: ne(k, [[F(k * k, 4), 'area-perimeter'], [F(k * k, 2), 'sqrt-half']]),
      hints: H(L('Area of a square = side × side.', 'مساحة المربع = الضلع × الضلع.'), L('So the side is the square root of the area.', 'إذن الضلع هو الجذر التربيعي للمساحة.'), L(`Which number times itself is ${k * k}?`, `أي عدد في نفسه يساوي ${k * k}؟`)),
      steps: [S(`side² = ${k * k}`), S(`side = √${k * k} = ${k}`)],
      explanation: L('The side of a square is the square root of its area.', 'ضلع المربع هو الجذر التربيعي لمساحته.'),
    });
  }),
];

export const L4_GENERATORS: Generator[] = [...orderOfOperations, ...negativeNumbers, ...exponents, ...squareRoots, ...L4_NUMBER_THEORY];
