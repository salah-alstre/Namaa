import type { Generator, Rng } from '@/types';
import { Fraction } from '../fraction';
import { G, compareBody, listBody, matchBody, mcqNum, mcqText, orderBody, tfBody, typed } from '../build';
import { H, L, cand, differ, nz, same } from '../kit';

const F = Fraction.of;
const mt = (s: string) => `$${s}$`;
const S = same;

/** Exact fraction from an integer or a short decimal. */
const toF = (x: number | Fraction): Fraction => (typeof x !== 'number' ? x : Number.isInteger(x) ? F(x) : Fraction.parse(String(Number(x.toFixed(8)))));

/** Drop likely-error entries equal to the correct value, and duplicates. */
const ne = (v: number | Fraction, list: [number | Fraction, string][]): [number | Fraction, string][] => {
  const seen: Fraction[] = [toF(v)];
  const out: [number | Fraction, string][] = [];
  for (const [x, pid] of list) {
    const xf = toF(x);
    if (seen.some((s) => s.eq(xf))) continue;
    seen.push(xf);
    out.push([x, pid]);
  }
  return out;
};

/** Number with a proper minus sign for text. */
const minus = (n: number): string => (n < 0 ? `−${-n}` : String(n));
const sgn = (n: number): string => (n < 0 ? '-' : '+');
const join = (xs: (number | string)[]): string => xs.join(', ');
/** Canonical answer string used by the `numbers` validator. */
const canon = (xs: number[], ordered: boolean): string => (ordered ? xs : xs.slice().sort((a, b) => a - b)).map((v) => F(v).toString()).join(',');

/** Two different nonzero integers in [lo, hi]. */
function pair(rng: Rng, lo: number, hi: number): [number, number] {
  const p = nz(rng, lo, hi);
  for (let i = 0; i < 50; i++) {
    const q = nz(rng, lo, hi);
    if (q !== p) return [p, q];
  }
  throw new RangeError('no distinct pair');
}

/** "x^2 + bx + c" style polynomial with folded signs. */
function quadStr(a: number, b: number, c: number): string {
  let s = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`;
  if (b !== 0) s += ` ${sgn(b)} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  if (c !== 0) s += ` ${sgn(c)} ${Math.abs(c)}`;
  return s;
}
/** (x − r) written with the right sign. */
const factor = (r: number): string => `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`;

// ───────────────────────── Quadratics ─────────────────────────

const quadratics: Generator[] = [
  G('factored', 'quadratics', 'solve-equation', [1, 2, 3], (rng, d) => {
    const [p, q] = d === 1 ? [rng.int(1, 5), rng.int(6, 10)] : pair(rng, d === 2 ? -8 : -12, d === 2 ? 8 : 12);
    const eq = `${factor(p)}${factor(q)} = 0`;
    return listBody({
      prompt: L('Solve. Type both solutions separated by a comma.', 'أوجد الحلين واكتبهما مفصولين بفاصلة.'),
      display: eq,
      values: [p, q],
      errors: [
        { answer: canon([-p, -q], false), patternId: 'root-sign' },
        { answer: canon([p], false), patternId: 'one-root-only' },
        { answer: canon([q], false), patternId: 'one-root-only' },
      ],
      hints: H(
        L('A product is zero only when one of the factors is zero.', 'حاصل الضرب يساوي صفرًا فقط عندما يكون أحد العاملين صفرًا.'),
        L('Set each bracket equal to zero and solve each one.', 'ساوِ كل قوس بالصفر وحلّ كل معادلة.'),
        L(`x ${p < 0 ? '+' : '−'} ${Math.abs(p)} = 0 and x ${q < 0 ? '+' : '−'} ${Math.abs(q)} = 0`, `x ${p < 0 ? '+' : '−'} ${Math.abs(p)} = 0 و x ${q < 0 ? '+' : '−'} ${Math.abs(q)} = 0`),
      ),
      steps: [
        L(`${mt(factor(p))} = 0 or ${mt(factor(q))} = 0`, `${mt(factor(p))} = 0 أو ${mt(factor(q))} = 0`),
        S(`x = ${minus(p)}`),
        S(`x = ${minus(q)}`),
      ],
      explanation: L('If a × b = 0 then a = 0 or b = 0, so a quadratic in factored form has up to two solutions.', 'إذا كان أ × ب = 0 فإن أ = 0 أو ب = 0، لذا فللمعادلة التربيعية المحلّلة حلّان على الأكثر.'),
    });
  }),

  G('square-root', 'quadratics', 'solve-equation', [1, 2, 3], (rng, d) => {
    const r = rng.int(2, d === 1 ? 9 : 14);
    const c = d >= 3 ? nz(rng, -20, 20) : 0;
    const k = r * r;
    const eq = c === 0 ? `x^2 = ${k}` : `x^2 ${sgn(c)} ${Math.abs(c)} = ${k + c}`;
    return listBody({
      prompt: L('Solve. Type both solutions separated by a comma.', 'أوجد الحلين واكتبهما مفصولين بفاصلة.'),
      display: eq,
      values: [r, -r],
      errors: [
        { answer: canon([r], false), patternId: 'one-root-only' },
        { answer: canon([-r], false), patternId: 'one-root-only' },
        { answer: canon([k], false), patternId: 'root-sign' },
      ],
      hints: H(
        L(c === 0 ? 'Which numbers multiply by themselves to give the right side?' : 'First get x² alone.', c === 0 ? 'أي الأعداد إذا ضُرب في نفسه أعطى الطرف الأيمن؟' : 'اعزل x² أولًا.'),
        L('Remember: both a positive and a negative number square to the same result.', 'تذكّر: العدد الموجب والسالب لهما المربع نفسه.'),
        L(`x = ±√${k}`, `x = ±√${k}`),
      ),
      steps: [...(c === 0 ? [] : [S(`x² = ${k}`)]), S(`x = ±√${k}`), S(`x = ${r}, x = −${r}`)],
      explanation: L('Taking a square root gives two answers: the positive root and the negative root.', 'للجذر التربيعي إجابتان: الجذر الموجب والجذر السالب.'),
    });
  }),

  G('standard-form', 'quadratics', 'solve-equation', [3, 4, 5], (rng, d) => {
    const [p, q] = pair(rng, d === 3 ? -6 : -10, d === 3 ? 6 : 10);
    const eq = `${quadStr(1, -(p + q), p * q)} = 0`;
    return listBody({
      prompt: L('Solve by factoring. Type both solutions separated by a comma.', 'حُلّ بالتحليل. اكتب الحلين مفصولين بفاصلة.'),
      display: eq,
      values: [p, q],
      errors: [
        { answer: canon([-p, -q], false), patternId: 'factor-sign' },
        { answer: canon([p], false), patternId: 'one-root-only' },
        { answer: canon([q], false), patternId: 'one-root-only' },
      ],
      hints: H(
        L('Look for two numbers that multiply to the last term and add up to the middle coefficient.', 'ابحث عن عددين حاصل ضربهما الحد الأخير ومجموعهما معامل الحد الأوسط.'),
        L(`The numbers are ${minus(-p)} and ${minus(-q)}: their product is ${minus(p * q)} and their sum is ${minus(-(p + q))}.`, `العددان هما ${minus(-p)} و ${minus(-q)}: حاصل ضربهما ${minus(p * q)} ومجموعهما ${minus(-(p + q))}.`),
        L(`${factor(p)}${factor(q)} = 0`, `${factor(p)}${factor(q)} = 0`),
      ),
      steps: [S(`${factor(p)}${factor(q)} = 0`), S(`x = ${minus(p)}`), S(`x = ${minus(q)}`)],
      explanation: L('Factor the quadratic, then set each factor equal to zero.', 'حلّل المعادلة التربيعية ثم ساوِ كل عامل بالصفر.'),
    });
  }),

  G('discriminant', 'quadratics', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const a = d <= 2 ? 1 : nz(rng, -3, 3);
    const b = nz(rng, -(d + 3), d + 3);
    const c = nz(rng, -(d + 3), d + 3);
    const v = b * b - 4 * a * c;
    return typed({
      prompt: L('Find the discriminant b² − 4ac.', 'أوجد المميِّز b² − 4ac.'),
      display: `${quadStr(a, b, c)} = 0`,
      value: v,
      extra: { integerOnly: true },
      errors: ne(v, [[b * b + 4 * a * c, 'sign-error'], [b * b - 2 * a * c, 'formula-mixup'], [-b * b - 4 * a * c, 'negative-sign'], [b - 4 * a * c, 'formula-mixup']]),
      hints: H(
        L('First read off a, b and c, including their signs.', 'اقرأ أولًا قيم a و b و c مع إشاراتها.'),
        L(`a = ${minus(a)}, b = ${minus(b)}, c = ${minus(c)}`, `a = ${minus(a)}, b = ${minus(b)}, c = ${minus(c)}`),
        L(`b² − 4ac = (${minus(b)})² − 4(${minus(a)})(${minus(c)})`, `b² − 4ac = (${minus(b)})² − 4(${minus(a)})(${minus(c)})`),
      ),
      steps: [S(`a = ${minus(a)}, b = ${minus(b)}, c = ${minus(c)}`), S(`b² = ${b * b}, 4ac = ${minus(4 * a * c)}`), S(`${b * b} − (${minus(4 * a * c)}) = ${minus(v)}`)],
      explanation: L('The discriminant tells how many real solutions a quadratic has.', 'يبيّن المميِّز عدد الحلول الحقيقية للمعادلة التربيعية.'),
    });
  }),

  G('how-many-roots', 'quadratics', 'mcq', [3, 4, 5], (rng, d) => {
    const kind = rng.int(0, 2);
    const b = kind === 1 ? 2 * nz(rng, -4, 4) : rng.int(-(d + 1), d + 1);
    const a = 1;
    let c: number;
    if (kind === 0) c = Math.floor((b * b - 1) / 4) - rng.int(0, 4);
    else if (kind === 1) c = (b / 2) * (b / 2);
    else c = Math.floor((b * b) / 4) + rng.int(1, 4);
    const disc = b * b - 4 * a * c;
    const two = L('Two different real solutions', 'حلّان حقيقيان مختلفان');
    const one = L('Exactly one real solution', 'حلّ حقيقي واحد فقط');
    const none = L('No real solutions', 'لا يوجد حل حقيقي');
    const ans = disc > 0 ? two : disc === 0 ? one : none;
    const wrongs = [two, one, none].filter((x) => x !== ans).map((label) => ({ label, pid: 'formula-mixup' }));
    return mcqText(rng, {
      prompt: L('How many real solutions does this equation have?', 'كم حلًّا حقيقيًّا لهذه المعادلة؟'),
      display: `${quadStr(a, b, c)} = 0`,
      correct: ans,
      wrongs: [...wrongs, { label: L('Exactly two solutions, both negative', 'حلّان كلاهما سالب') }, { label: L('Infinitely many solutions', 'عدد لا نهائي من الحلول') }],
      hints: H(
        L('The sign of the discriminant decides.', 'إشارة المميِّز هي التي تحسم الأمر.'),
        L('Positive: two solutions. Zero: one. Negative: none.', 'موجب: حلّان. صفر: حلّ واحد. سالب: لا حلول.'),
        L(`b² − 4ac = ${b * b} − ${minus(4 * a * c)}`, `b² − 4ac = ${b * b} − ${minus(4 * a * c)}`),
      ),
      steps: [S(`a = 1, b = ${minus(b)}, c = ${minus(c)}`), S(`b² − 4ac = ${minus(disc)}`), ans],
      explanation: L('Discriminant > 0 means two real solutions, = 0 means one, < 0 means none.', 'المميِّز > 0: حلّان حقيقيان، = 0: حلّ واحد، < 0: لا حلّ حقيقي.'),
    });
  }),

  G('vertex-x', 'quadratics', 'type-answer', [3, 4, 5], (rng, d) => {
    const a = d === 3 ? 1 : rng.int(1, 3);
    const h = nz(rng, -6, 6);
    const b = -2 * a * h;
    const c = rng.int(-9, 9);
    return typed({
      prompt: L('Find the x-coordinate of the vertex of this parabola.', 'أوجد الإحداثي السيني لرأس هذا القطع المكافئ.'),
      display: `y = ${quadStr(a, b, c)}`,
      value: h,
      extra: { integerOnly: true },
      errors: ne(h, [[-h, 'sign-error'], [F(b, a), 'formula-mixup'], [F(-b, 2), 'formula-mixup']]),
      hints: H(
        L('The vertex lies on the axis of symmetry x = −b / (2a).', 'يقع الرأس على محور التناظر x = −b / (2a).'),
        L(`Here a = ${a} and b = ${minus(b)}.`, `هنا a = ${a} و b = ${minus(b)}.`),
        L(`x = −(${minus(b)}) / (2 × ${a})`, `x = −(${minus(b)}) / (2 × ${a})`),
      ),
      steps: [S(`a = ${a}, b = ${minus(b)}`), S(`x = −b / (2a) = ${minus(-b)} / ${2 * a}`), S(`x = ${minus(h)}`)],
      explanation: L('Every parabola is symmetric about the vertical line x = −b / (2a), and the vertex sits on it.', 'كل قطع مكافئ متناظر حول الخط الرأسي x = −b / (2a) ويقع رأسه عليه.'),
    });
  }),

  G('complete-factor', 'quadratics', 'fill-blank', [2, 3, 4], (rng, d) => {
    const [p, q] = d <= 2 ? [rng.int(1, 6), rng.int(1, 6)] : pair(rng, -9, 9);
    const display = `${quadStr(1, p + q, p * q)} = (x ${sgn(p)} ${Math.abs(p)})(x + \\square)`;
    return typed({
      prompt: L('Find the missing number in the factorisation.', 'أوجد العدد الناقص في التحليل.'),
      display,
      value: q,
      extra: { integerOnly: true },
      errors: ne(q, [[-q, 'factor-sign'], [p + q, 'gcf-partial'], [p * q, 'gcf-partial']]),
      hints: H(
        L('Multiplying the two numbers in the brackets gives the last term.', 'حاصل ضرب العددين في القوسين يساوي الحد الأخير.'),
        L(`${minus(p)} × ? = ${minus(p * q)}`, `${minus(p)} × ? = ${minus(p * q)}`),
        L(`Check: ${minus(p)} + ? should equal ${minus(p + q)}.`, `تحقّق: ${minus(p)} + ؟ يجب أن يساوي ${minus(p + q)}.`),
      ),
      steps: [S(`${minus(p)} × ? = ${minus(p * q)}`), S(`? = ${minus(p * q)} ÷ ${pp(p)}`), S(`? = ${minus(q)}`)],
      explanation: L('In (x + p)(x + q) the numbers multiply to the last term and add to the middle coefficient.', 'في (x + p)(x + q) يكون حاصل ضرب العددين هو الحد الأخير ومجموعهما معامل الحد الأوسط.'),
    });
  }),

  G('rectangle', 'quadratics', 'word-problem', [3, 4, 5], (rng, d) => {
    const w = rng.int(2, d === 3 ? 8 : 14);
    const k = rng.int(1, d === 5 ? 9 : 5);
    const area = w * (w + k);
    return typed({
      prompt: L(
        `A rectangle is ${k} cm longer than it is wide. Its area is ${area} cm². What is its width?`,
        `مستطيل طوله أكبر من عرضه بمقدار ${k} سم، ومساحته ${area} سم². ما عرضه؟`,
      ),
      value: w,
      extra: { integerOnly: true },
      suffix: 'cm',
      correct: L(`${w} cm`, `${w} سم`),
      errors: ne(w, [[w + k, 'wrong-operation'], [area - k, 'wrong-operation']]),
      hints: H(
        L('Let the width be w, so the length is w + ' + k + '. Area = width × length.', 'ليكن العرض w فيكون الطول w + ' + k + '. المساحة = العرض × الطول.'),
        L(`w(w + ${k}) = ${area}. Look for two numbers ${k} apart that multiply to ${area}.`, `w(w + ${k}) = ${area}. ابحث عن عددين الفرق بينهما ${k} وحاصل ضربهما ${area}.`),
        L(`${w} × ${w + k} = ${area}`, `${w} × ${w + k} = ${area}`),
      ),
      steps: [S(`w(w + ${k}) = ${area}`), S(`w² + ${k}w − ${area} = 0`), S(`(w − ${w})(w + ${w + k}) = 0`), L(`w = ${w} (a width cannot be negative)`, `w = ${w} (العرض لا يكون سالبًا)`)],
      explanation: L('Write the area as a quadratic, solve it, and keep only the answer that makes sense for a length.', 'اكتب المساحة معادلة تربيعية وحلّها، ثم احتفظ بالجواب المنطقي لطول.'),
    });
  }),

  G('pick-formula', 'quadratics', 'select-formula', [3, 4, 5], (rng) => {
    const kind = rng.int(0, 2);
    const sets = [
      {
        q: L('Which formula gives the solutions of ax² + bx + c = 0?', 'أي قانون يعطي حلول المعادلة ax² + bx + c = 0؟'),
        ok: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        bad: ['x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}', 'x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{a}', 'x = \\frac{-b \\pm \\sqrt{b - 4ac}}{2a}'],
      },
      {
        q: L('Which expression is the discriminant?', 'أي تعبير هو المميِّز؟'),
        ok: 'b^2 - 4ac',
        bad: ['b^2 + 4ac', '4ac - b', '\\sqrt{b^2 - 4ac}', 'b - 4ac'],
      },
      {
        q: L('Which formula gives the x-coordinate of the vertex of y = ax² + bx + c?', 'أي قانون يعطي الإحداثي السيني لرأس y = ax² + bx + c؟'),
        ok: 'x = -\\frac{b}{2a}',
        bad: ['x = \\frac{b}{2a}', 'x = -\\frac{b}{a}', 'x = -\\frac{2b}{a}', 'x = \\frac{c}{a}'],
      },
    ] as const;
    const s = sets[kind] as (typeof sets)[number];
    return mcqText(rng, {
      prompt: s.q,
      correct: S(mt(s.ok)),
      wrongs: s.bad.map((b) => ({ label: S(mt(b)), pid: 'formula-mixup' })),
      hints: H(
        L('Think about which parts must be there: the sign in front of b and the 4ac term.', 'فكّر فيما يجب وجوده: إشارة b وحدّ 4ac.'),
        L('Test your choice with a simple equation such as x² − 4 = 0 (solutions ±2).', 'جرّب اختيارك على معادلة بسيطة مثل x² − 4 = 0 (حلاها ±2).'),
        L('Eliminate options that change the sign of b or use 2a incorrectly.', 'استبعد الخيارات التي تغيّر إشارة b أو تستعمل 2a خطأً.'),
      ),
      steps: [S(mt(s.ok))],
      explanation: L('These three formulas come from completing the square and are worth remembering.', 'تأتي هذه القوانين الثلاثة من إكمال المربع وتستحق الحفظ.'),
    });
  }),
];

/** (−n) style for products in steps. */
function pp(n: number): string {
  return n < 0 ? `(−${-n})` : String(n);
}

// ───────────────────────── Systems of equations ─────────────────────────

const cases = (r1: string, r2: string): string => `\\begin{cases} ${r1} \\\\ ${r2} \\end{cases}`;
const xyEq = (a: number, b: number, rhs: number): string => {
  const left = (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`) + (b === 0 ? '' : ` ${sgn(b)} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y`);
  return `${left} = ${rhs}`;
};
const ordered = (x: number, y: number): string => `(${x}, ${y})`;

const systems: Generator[] = [
  G('elimination', 'systems', 'solve-equation', [2, 3, 4], (rng, d) => {
    const x = nz(rng, -8, 9);
    const y = nz(rng, -8, 9);
    const a1 = d === 2 ? 1 : rng.int(1, 3);
    const a2 = d === 2 ? 1 : rng.int(1, 3);
    const s1 = a1 * x + y;
    const s2 = a2 * x - y;
    return listBody({
      prompt: L('Solve the system. Type x then y, separated by a comma.', 'حُلّ النظام. اكتب x ثم y مفصولين بفاصلة.'),
      display: cases(xyEq(a1, 1, s1), xyEq(a2, -1, s2)),
      values: [x, y],
      ordered: true,
      errors: x === y ? [] : [{ answer: canon([y, x], true), patternId: 'system-substitution' }],
      hints: H(
        L('The y terms are opposites, so adding the two equations removes y.', 'حدّا y متعاكسان، فجمع المعادلتين يحذف y.'),
        L(`Adding gives ${a1 + a2 === 1 ? '' : a1 + a2}x = ${s1 + s2}.`, `الجمع يعطي ${a1 + a2 === 1 ? '' : a1 + a2}x = ${s1 + s2}.`),
        L('Put the value of x back into either equation to find y.', 'عوّض قيمة x في أي معادلة لإيجاد y.'),
      ),
      steps: [S(`${a1 + a2 === 1 ? '' : a1 + a2}x = ${minus(s1 + s2)}`), S(`x = ${minus(x)}`), S(`y = ${minus(s1)} − ${pp(a1 * x)} = ${minus(y)}`)],
      explanation: L('Adding the equations eliminates one unknown; then substitute back to find the other.', 'جمع المعادلتين يحذف مجهولًا واحدًا، ثم نعوّض لإيجاد الآخر.'),
    });
  }),

  G('substitution', 'systems', 'solve-equation', [2, 3, 4], (rng, d) => {
    const x = rng.int(1, 9);
    const k = rng.int(2, 4);
    const c = d === 2 ? 0 : nz(rng, -5, 5);
    const y = k * x + c;
    const a = d === 4 ? rng.int(2, 3) : 1;
    const s = a * x + y;
    const first = c === 0 ? `y = ${k}x` : `y = ${k}x ${sgn(c)} ${Math.abs(c)}`;
    return listBody({
      prompt: L('Solve the system. Type x then y, separated by a comma.', 'حُلّ النظام. اكتب x ثم y مفصولين بفاصلة.'),
      display: cases(first, xyEq(a, 1, s)),
      values: [x, y],
      ordered: true,
      errors: x === y ? [] : [{ answer: canon([y, x], true), patternId: 'system-substitution' }],
      hints: H(
        L('The first equation already tells you what y equals.', 'المعادلة الأولى تخبرك بقيمة y.'),
        L('Replace y in the second equation with that expression.', 'استبدل y في المعادلة الثانية بهذا التعبير.'),
        L('Solve for x, then use the first equation to get y.', 'حلّ لإيجاد x ثم استعمل المعادلة الأولى لإيجاد y.'),
      ),
      steps: [S(`${a === 1 ? '' : a}x + (${first.slice(4)}) = ${s}`), S(`x = ${x}`), S(`y = ${minus(y)}`)],
      explanation: L('Substitution replaces one unknown with an expression, leaving a one-variable equation.', 'التعويض يستبدل مجهولًا بتعبير فتصبح لدينا معادلة بمتغير واحد.'),
    });
  }),

  G('tickets', 'systems', 'word-problem', [3, 4, 5], (rng, d) => {
    const adults = rng.int(3, d === 3 ? 12 : 30);
    const kids = rng.int(3, d === 3 ? 12 : 30);
    const pa = rng.int(5, 12);
    const pc = differ(rng, 2, pa - 1, pa);
    const total = adults + kids;
    const money = adults * pa + kids * pc;
    return typed({
      prompt: L(
        `A show sold ${total} tickets. Adult tickets cost ${pa} and child tickets cost ${pc}. The total income was ${money}. How many adult tickets were sold?`,
        `باع عرض ${total} تذكرة. سعر تذكرة الكبير ${pa} وسعر تذكرة الطفل ${pc}، وبلغ الدخل ${money}. كم تذكرة كبار بيعت؟`,
      ),
      value: adults,
      extra: { integerOnly: true },
      errors: ne(adults, [[kids, 'system-substitution'], [total - adults - 1, 'off-by-one']]),
      hints: H(
        L('Let a = adults and c = children: a + c = total, and the prices give a second equation.', 'ليكن a الكبار و c الأطفال: a + c = المجموع، وتعطينا الأسعار معادلة ثانية.'),
        L(`Replace c with ${total} − a in ${pa}a + ${pc}c = ${money}.`, `عوّض عن c بـ ${total} − a في ${pa}a + ${pc}c = ${money}.`),
        L(`${pa - pc}a = ${money - pc * total}`, `${pa - pc}a = ${money - pc * total}`),
      ),
      steps: [S(`a + c = ${total}`), S(`${pa}a + ${pc}c = ${money}`), S(`${pa}a + ${pc}(${total} − a) = ${money}`), S(`${pa - pc}a = ${money - pc * total}`), S(`a = ${adults}`)],
      explanation: L('Two facts about the tickets give two equations; substitution solves them together.', 'حقيقتان عن التذاكر تعطيان معادلتين، ويحلّهما التعويض معًا.'),
    });
  }),

  G('is-solution', 'systems', 'true-false', [1, 2, 3], (rng, d) => {
    const x = rng.int(1, d * 4 + 3);
    const y = rng.int(1, d * 4 + 3);
    const s = x + y;
    const t = x - y;
    const truth = rng.chance(0.5);
    const gx = truth ? x : x + rng.int(1, 2);
    const gy = truth ? y : y - (gx - x);
    return tfBody({
      prompt: L(`Is ${ordered(gx, gy)} a solution of this system?`, `هل ${ordered(gx, gy)} حلٌّ لهذا النظام؟`),
      display: cases(`x + y = ${s}`, `x - y = ${minus(t).replace('−', '-')}`),
      truth,
      pid: 'system-substitution',
      hints: H(
        L('A solution must satisfy BOTH equations.', 'الحل يجب أن يحقّق المعادلتين معًا.'),
        L('Substitute x and y into the first equation, then the second.', 'عوّض x و y في المعادلة الأولى ثم الثانية.'),
        L(`First: ${gx} + ${minus(gy)} = ${gx + gy}. Second: ${gx} − ${pp(gy)} = ${minus(gx - gy)}.`, `الأولى: ${gx} + ${minus(gy)} = ${gx + gy}. الثانية: ${gx} − ${pp(gy)} = ${minus(gx - gy)}.`),
      ),
      steps: [S(`${gx} + ${pp(gy)} = ${gx + gy}  (${gx + gy === s ? '✓' : '✗'})`), S(`${gx} − ${pp(gy)} = ${minus(gx - gy)}  (${gx - gy === t ? '✓' : '✗'})`), truth ? L('Both hold, so it is a solution.', 'تتحقق المعادلتان، فهو حلّ.') : L('One fails, so it is not a solution.', 'إحداهما لا تتحقق، فليس حلًّا.')],
      explanation: L('Checking a pair in only one equation is not enough. Both must be true.', 'لا يكفي فحص الزوج في معادلة واحدة، بل يجب أن تتحقق المعادلتان.'),
    });
  }),

  G('which-pair', 'systems', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const x = rng.int(1, 5 + d * 2);
    const y = differ(rng, 1, 5 + d * 2, x);
    const s = x + y;
    const t = x - y;
    const lab = (a: number, b: number) => S(ordered(a, b).replace(/-(\d)/g, '−$1'));
    return mcqText(rng, {
      prompt: L('Which pair (x, y) solves the system?', 'أي زوج (x, y) يحلّ النظام؟'),
      display: cases(`x + y = ${s}`, `x - y = ${minus(t).replace('−', '-')}`),
      correct: lab(x, y),
      wrongs: [{ label: lab(y, x), pid: 'system-substitution' }, { label: lab(x, -y), pid: 'sign-error' }, { label: lab(x + 1, y - 1) }, { label: lab(x - 1, y + 1) }, { label: lab(y + 1, x) }],
      hints: H(
        L('Test each pair in both equations.', 'اختبر كل زوج في المعادلتين.'),
        L(`The sum x + y must be ${s}.`, `يجب أن يكون المجموع x + y = ${s}.`),
        L(`Among those, the difference x − y must be ${minus(t)}.`, `ومن بينها يجب أن يكون الفرق x − y = ${minus(t)}.`),
      ),
      steps: [S(`x + y = ${s}`), S(`x − y = ${minus(t)}`), S(`x = ${(s + t) / 2}, y = ${(s - t) / 2}`)],
      explanation: L('Eliminate wrong pairs quickly by testing the sum first, then the difference.', 'استبعد الأزواج الخاطئة بسرعة باختبار المجموع أولًا ثم الفرق.'),
    });
  }),

  G('product-trick', 'systems', 'type-answer', [3, 4, 5], (rng, d) => {
    const x = rng.int(3, 6 + d * 2);
    const y = rng.int(1, x - 1);
    const s = x + y;
    const t = x - y;
    return typed({
      prompt: L(`If x + y = ${s} and x − y = ${t}, what is x² − y²?`, `إذا كان x + y = ${s} و x − y = ${t}، فما قيمة x² − y²؟`),
      value: s * t,
      extra: { integerOnly: true },
      errors: ne(s * t, [[s + t, 'wrong-operation'], [x * x + y * y, 'sign-error']]),
      hints: H(
        L('x² − y² factors as (x + y)(x − y).', 'تُحلَّل x² − y² إلى (x + y)(x − y).'),
        L('You do not need to find x and y separately.', 'لا حاجة لإيجاد x و y كلٌّ على حدة.'),
        L(`${s} × ${t}`, `${s} × ${t}`),
      ),
      steps: [S('x² − y² = (x + y)(x − y)'), S(`= ${s} × ${t}`), S(`= ${s * t}`)],
      explanation: L('Spotting a factorisation can solve in one step what looks like a system.', 'ملاحظة التحليل قد تحلّ في خطوة واحدة ما يبدو نظامًا.'),
    });
  }),
];

// ───────────────────────── Statistics ─────────────────────────

/** Data set whose total is divisible by n, so the mean is a whole number. */
function dataWithMean(rng: Rng, n: number, mean: number, spread: number): number[] {
  const dev: number[] = [];
  for (let i = 0; i < n - 1; i++) dev.push(rng.int(-spread, spread));
  dev.push(-dev.reduce((a, b) => a + b, 0));
  const vals = dev.map((v) => mean + v);
  if (vals.some((v) => v < 1)) throw new RangeError('non-positive datum');
  return rng.shuffle(vals);
}
const sortedCopy = (xs: number[]): number[] => xs.slice().sort((a, b) => a - b);
const medianOf = (xs: number[]): Fraction => {
  const s = sortedCopy(xs);
  const n = s.length;
  return n % 2 === 1 ? F(s[(n - 1) / 2] as number) : F((s[n / 2 - 1] as number) + (s[n / 2] as number), 2);
};
const decText = (f: Fraction): string => f.toDecimal(8);

const statistics: Generator[] = [
  G('mean', 'statistics', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const n = rng.int(3, d + 3);
    const mean = rng.int(d + 4, d * 6 + 10);
    const data = dataWithMean(rng, n, mean, d * 2 + 2);
    const total = data.reduce((a, b) => a + b, 0);
    return typed({
      prompt: L('Find the mean of this data set.', 'أوجد الوسط الحسابي لهذه البيانات.'),
      display: join(data),
      value: mean,
      extra: { integerOnly: true },
      errors: ne(mean, [[medianOf(data), 'mean-median'], [total, 'wrong-operation'], [Math.max(...data) - Math.min(...data), 'wrong-operation']]),
      hints: H(
        L('Mean = total ÷ number of values.', 'الوسط = المجموع ÷ عدد القيم.'),
        L(`Add all ${n} values first.`, `اجمع القيم الـ ${n} أولًا.`),
        L(`${total} ÷ ${n}`, `${total} ÷ ${n}`),
      ),
      steps: [S(`${data.join(' + ')} = ${total}`), S(`${total} ÷ ${n}`), S(`= ${mean}`)],
      explanation: L('The mean shares the total equally between all the values.', 'الوسط الحسابي يوزّع المجموع بالتساوي على كل القيم.'),
    });
  }),

  G('median', 'statistics', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const n = d >= 3 ? rng.int(3, 4) * 2 : rng.int(1, 3) * 2 + 1;
    const pool: number[] = [];
    while (pool.length < n) pool.push(rng.int(1, d * 8 + 9));
    const data = pool;
    const med = medianOf(data);
    const mean = F(data.reduce((a, b) => a + b, 0), n);
    const middleUnsorted = n % 2 === 1 ? F(data[(n - 1) / 2] as number) : F((data[n / 2 - 1] as number) + (data[n / 2] as number), 2);
    return typed({
      prompt: L('Find the median of this data set.', 'أوجد الوسيط لهذه البيانات.'),
      display: join(data),
      value: med,
      correct: S(decText(med)),
      errors: ne(med, [[middleUnsorted, 'median-unsorted'], [mean, 'mean-median']]),
      hints: H(
        L('Put the numbers in order first.', 'رتّب الأعداد أولًا.'),
        L(n % 2 === 1 ? 'The median is the middle number.' : 'With an even count, the median is halfway between the two middle numbers.', n % 2 === 1 ? 'الوسيط هو العدد الأوسط.' : 'عندما يكون العدد زوجيًّا يكون الوسيط في منتصف العددين الأوسطين.'),
        L(`Ordered: ${sortedCopy(data).join(', ')}`, `بعد الترتيب: ${sortedCopy(data).join('، ')}`),
      ),
      steps: [L(`Ordered: ${sortedCopy(data).join(', ')}`, `بعد الترتيب: ${sortedCopy(data).join('، ')}`), n % 2 === 1 ? L('Take the middle value.', 'خذ القيمة الوسطى.') : L('Average the two middle values.', 'احسب متوسط القيمتين الوسطيين.'), S(decText(med))],
      explanation: L('The median is the middle of the ordered data, so sorting always comes first.', 'الوسيط هو منتصف البيانات المرتّبة، لذا يأتي الترتيب أولًا.'),
    });
  }),

  G('mode', 'statistics', 'type-answer', [1, 2, 3], (rng, d) => {
    const n = rng.int(6, 6 + d * 2);
    const mode = rng.int(1, 20);
    const times = rng.int(2, 3);
    const data: number[] = Array(times).fill(mode);
    const used = new Set<number>([mode]);
    let guard = 0;
    while (data.length < n && guard++ < 200) {
      const v = rng.int(1, 20);
      if (used.has(v)) continue;
      used.add(v);
      data.push(v);
    }
    if (data.length < n) throw new RangeError('not enough distinct');
    const shown = rng.shuffle(data);
    return typed({
      prompt: L('What is the mode of this data set?', 'ما منوال هذه البيانات؟'),
      display: join(shown),
      value: mode,
      extra: { integerOnly: true },
      errors: ne(mode, [[times, 'wrong-operation'], [Math.max(...data), 'mean-median'], [medianOf(data), 'mean-median']]),
      hints: H(
        L('The mode is the value that appears most often.', 'المنوال هو القيمة الأكثر تكرارًا.'),
        L('Look for a number that appears more than once.', 'ابحث عن عدد يتكرر أكثر من مرة.'),
        L(`${mode} appears ${times} times.`, `${mode} يتكرر ${times} مرات.`),
      ),
      steps: [L(`Sorted: ${sortedCopy(data).join(', ')}`, `بعد الترتيب: ${sortedCopy(data).join('، ')}`), L(`${mode} appears ${times} times, more than any other.`, `${mode} يتكرر ${times} مرات، أكثر من أي عدد آخر.`), S(String(mode))],
      explanation: L('The answer is the value itself, not how many times it appears.', 'الجواب هو القيمة نفسها وليس عدد مرات تكرارها.'),
    });
  }),

  G('range', 'statistics', 'type-answer', [1, 2, 3], (rng, d) => {
    const n = rng.int(4, 5 + d);
    const data: number[] = [];
    for (let i = 0; i < n; i++) data.push(rng.int(d === 1 ? 1 : -10, d * 15 + 10));
    const mx = Math.max(...data);
    const mn = Math.min(...data);
    if (mx === mn) throw new RangeError('flat data');
    return typed({
      prompt: L('Find the range of this data set.', 'أوجد مدى هذه البيانات.'),
      display: join(data),
      value: mx - mn,
      extra: { integerOnly: true },
      errors: ne(mx - mn, [[mx + mn, 'sign-error'], [mx, 'wrong-operation'], [mn, 'wrong-operation']]),
      hints: H(
        L('Range = largest value − smallest value.', 'المدى = أكبر قيمة − أصغر قيمة.'),
        L(`Largest: ${mx}. Smallest: ${mn}.`, `الأكبر: ${mx}. الأصغر: ${mn}.`),
        L(`${mx} − ${pp(mn)}`, `${mx} − ${pp(mn)}`),
      ),
      steps: [S(`max = ${mx}, min = ${minus(mn)}`), S(`${mx} − ${pp(mn)}`), S(String(mx - mn))],
      explanation: L('The range measures how spread out the data is.', 'المدى يقيس مدى تباعد البيانات.'),
    });
  }),

  G('missing-value', 'statistics', 'fill-blank', [2, 3, 4], (rng, d) => {
    const n = rng.int(4, 4 + d);
    const mean = rng.int(8, 20 + d * 5);
    const rest: number[] = [];
    // Draw the known values, then make the missing one fit the mean.
    let sum = 0;
    for (let i = 0; i < n - 1; i++) {
      const v = rng.int(Math.max(1, mean - 8), mean + 8);
      rest.push(v);
      sum += v;
    }
    const need = mean * n - sum;
    if (need < 1) throw new RangeError('non-positive');
    return typed({
      prompt: L(`The mean of these ${n} numbers is ${mean}. Find the missing number.`, `الوسط الحسابي لهذه الأعداد الـ ${n} هو ${mean}. أوجد العدد الناقص.`),
      display: `${rest.join(', ')}, \\square`,
      value: need,
      extra: { integerOnly: true },
      errors: ne(need, [[mean, 'mean-median'], [sum - mean * (n - 1) + mean, 'wrong-operation'], [Math.abs(sum - mean * (n - 1)), 'sign-error']]),
      hints: H(
        L('If you know the mean, you know the total: mean × count.', 'إذا عرفت الوسط عرفت المجموع: الوسط × العدد.'),
        L(`The total must be ${mean} × ${n} = ${mean * n}.`, `يجب أن يكون المجموع ${mean} × ${n} = ${mean * n}.`),
        L(`Subtract the known values (sum ${sum}).`, `اطرح القيم المعروفة (مجموعها ${sum}).`),
      ),
      steps: [S(`${mean} × ${n} = ${mean * n}`), S(`${rest.join(' + ')} = ${sum}`), S(`${mean * n} − ${sum} = ${need}`)],
      explanation: L('Work backwards from the mean to the total, then subtract what you already have.', 'ابدأ من الوسط إلى المجموع ثم اطرح ما لديك.'),
    });
  }),

  G('outlier', 'statistics', 'mcq', [3, 4, 5], (rng, d) => {
    const base = rng.int(10, 40);
    const data = [base, base + rng.int(1, 3), base + rng.int(2, 5), base + rng.int(3, 7), base + rng.int(4, 8)];
    const big = base * rng.int(5, 9) + d;
    const shown = rng.shuffle([...data, big]);
    const med = L('The median', 'الوسيط');
    const mean = L('The mean', 'الوسط الحسابي');
    const tot = L('The total', 'المجموع');
    const rg = L('The range', 'المدى');
    return mcqText(rng, {
      prompt: L('One value in this data is extremely large. Which measure of the centre is affected LEAST by it?', 'إحدى القيم في هذه البيانات كبيرة جدًّا. أي مقياس للمركز يتأثر بها أقل ما يمكن؟'),
      display: join(shown),
      correct: med,
      wrongs: [{ label: mean, pid: 'mean-median' }, { label: tot }, { label: rg }],
      hints: H(
        L('Think about what each measure uses: every value, or just the middle?', 'فكّر فيما يستعمله كل مقياس: كل القيم أم القيمة الوسطى فقط؟'),
        L('A very large value pulls the total up.', 'القيمة الكبيرة جدًّا ترفع المجموع.'),
        L('Which measure only looks at the middle position?', 'أي مقياس ينظر إلى الموضع الأوسط فقط؟'),
      ),
      steps: [L(`Mean ≈ ${decText(F(shown.reduce((a, b) => a + b, 0) * 10, shown.length * 10).sub(F(0)))}`.replace(/(\.\d{2})\d+/, '$1'), `الوسط ≈ ${decText(F(shown.reduce((a, b) => a + b, 0) * 10, shown.length * 10)).replace(/(\.\d{2})\d+/, '$1')}`), L(`Median = ${decText(medianOf(shown))}`, `الوسيط = ${decText(medianOf(shown))}`), L('The median barely moves.', 'الوسيط لا يكاد يتغير.')],
      explanation: L('The median depends only on the middle of the ordered data, so extreme values hardly change it.', 'يعتمد الوسيط على منتصف البيانات المرتّبة فقط، فالقيم المتطرفة لا تكاد تغيّره.'),
    });
  }),

  G('mean-vs-median', 'statistics', 'compare', [3, 4, 5], (rng, d) => {
    // Five values with a whole-number mean; mirroring gives left-skewed sets.
    const first = [rng.int(1, 6 + d), rng.int(1, 6 + d), rng.int(1, 6 + d), rng.int(1, 6 + d)].sort((a, b) => a - b);
    const sum4 = first.reduce((a, b) => a + b, 0);
    const lo = (first[3] as number) + 1;
    const last = lo + ((((5 - ((sum4 + lo) % 5)) % 5) + 5) % 5) + 5 * rng.int(0, d - 2);
    let data = [...first, last];
    if (rng.chance(0.5)) {
      const k = last + 2;
      data = data.map((v) => k - v);
    }
    const mean = F(data.reduce((a, b) => a + b, 0), 5);
    const med = medianOf(data);
    const shown = rng.shuffle(data);
    return compareBody({
      prompt: L(`Data: ${shown.join(', ')}. Compare the mean and the median.`, `البيانات: ${shown.join('، ')}. قارن بين الوسط والوسيط.`),
      a: mean,
      b: med,
      aTex: '\\text{mean}',
      bTex: '\\text{median}',
      pids: { lt: 'mean-median', eq: 'mean-median', gt: 'mean-median' },
      hints: H(
        L('Work out both numbers before comparing.', 'احسب العددين قبل المقارنة.'),
        L(`Mean = ${data.reduce((a, b) => a + b, 0)} ÷ 5 = ${mean.toString()}.`, `الوسط = ${data.reduce((a, b) => a + b, 0)} ÷ 5 = ${mean.toString()}.`),
        L(`Sorted: ${sortedCopy(data).join(', ')}, so the median is ${med.toString()}.`, `بعد الترتيب: ${sortedCopy(data).join('، ')}، فالوسيط ${med.toString()}.`),
      ),
      steps: [S(`mean = ${mean.toString()}`), S(`median = ${med.toString()}`), L('Compare the two values.', 'قارن بين القيمتين.')],
      explanation: L('A few large values pull the mean above the median; a few small ones pull it below.', 'القيم الكبيرة القليلة ترفع الوسط فوق الوسيط، والصغيرة القليلة تخفضه تحته.'),
    });
  }),
];

// ───────────────────────── Probability ─────────────────────────

const COLOURS = [
  { en: 'red', ar: 'حمراء' },
  { en: 'blue', ar: 'زرقاء' },
  { en: 'green', ar: 'خضراء' },
  { en: 'yellow', ar: 'صفراء' },
] as const;

const probability: Generator[] = [
  G('simple', 'probability', 'type-answer', [1, 2, 3], (rng, d) => {
    const nc = d === 1 ? 2 : 3;
    const counts = Array.from({ length: nc }, () => rng.int(1, d * 3 + 3));
    const total = counts.reduce((a, b) => a + b, 0);
    const pick = rng.int(0, nc - 1);
    const hit = counts[pick] as number;
    const rest = total - hit;
    const c = COLOURS[pick] as (typeof COLOURS)[number];
    const desc = counts.map((n, i) => `${n} ${(COLOURS[i] as (typeof COLOURS)[number]).en}`).join(', ');
    const descAr = counts.map((n, i) => `${n} ${(COLOURS[i] as (typeof COLOURS)[number]).ar}`).join('، ');
    return typed({
      prompt: L(
        `A bag holds ${desc} marbles. One is picked at random. What is the probability it is ${c.en}? Give a fraction in simplest form.`,
        `في كيس كرات: ${descAr}. تُسحب كرة عشوائيًّا. ما احتمال أن تكون ${c.ar}؟ اكتب كسرًا في أبسط صورة.`,
      ),
      value: F(hit, total),
      extra: { lowest: true },
      errors: ne(F(hit, total), [[F(hit, rest), 'probability-odds'], [F(rest, total), 'wrong-operation'], [F(1, total), 'part-whole-ratio']]),
      hints: H(
        L('Probability = favourable outcomes ÷ all possible outcomes.', 'الاحتمال = النتائج المرغوبة ÷ كل النتائج الممكنة.'),
        L(`All outcomes: the total number of marbles, ${total}.`, `كل النتائج الممكنة: العدد الكلي للكرات، ${total}.`),
        L(`${hit} / ${total}`, `${hit} / ${total}`),
      ),
      steps: [L(`Favourable: ${hit}`, `المرغوب: ${hit}`), L(`Total: ${total}`, `الكلي: ${total}`), S(`P = ${hit}/${total}${F(hit, total).d !== total ? ' = ' + F(hit, total).toString() : ''}`)],
      explanation: L('Compare the favourable outcomes with ALL outcomes, not with the other outcomes.', 'قارن النتائج المرغوبة بجميع النتائج، لا بالنتائج الأخرى فقط.'),
    });
  }),

  G('dice', 'probability', 'type-answer', [1, 2, 3], (rng, d) => {
    const events = [
      { en: 'an even number', ar: 'عددًا زوجيًّا', n: 3 },
      { en: 'a number greater than 4', ar: 'عددًا أكبر من 4', n: 2 },
      { en: 'a number less than 3', ar: 'عددًا أصغر من 3', n: 2 },
      { en: 'a multiple of 3', ar: 'من مضاعفات 3', n: 2 },
      { en: 'a prime number', ar: 'عددًا أوليًّا', n: 3 },
      { en: 'a 6', ar: 'العدد 6', n: 1 },
      { en: 'a number greater than 1', ar: 'عددًا أكبر من 1', n: 5 },
      { en: 'an odd number greater than 1', ar: 'عددًا فرديًّا أكبر من 1', n: 2 },
    ];
    const pool = d === 1 ? events.slice(0, 3).concat(events[5] as (typeof events)[number]) : events;
    const e = rng.pick(pool) as (typeof events)[number];
    return typed({
      prompt: L(`A fair six-sided die is rolled once. What is the probability of getting ${e.en}? Give a fraction in simplest form.`, `يُرمى حجر نرد عادل مرة واحدة. ما احتمال الحصول على ${e.ar}؟ اكتب كسرًا في أبسط صورة.`),
      value: F(e.n, 6),
      extra: { lowest: true },
      errors: ne(F(e.n, 6), [[F(e.n, 6 - e.n), 'probability-odds'], [F(e.n, 5), 'part-whole-ratio'], [F(1, 6), 'part-whole-ratio']]),
      hints: H(
        L('List the faces 1 to 6 and mark the ones that count.', 'اكتب الأوجه من 1 إلى 6 وحدّد ما يحقق الشرط.'),
        L(`${e.n} of the 6 faces work.`, `${e.n} من الأوجه الستة تحقق الشرط.`),
        L(`${e.n}/6`, `${e.n}/6`),
      ),
      steps: [L(`Favourable faces: ${e.n}`, `الأوجه المرغوبة: ${e.n}`), L('All faces: 6', 'كل الأوجه: 6'), S(`P = ${e.n}/6 = ${F(e.n, 6).toString()}`)],
      explanation: L('With equally likely outcomes, count the good ones and divide by the total.', 'عندما تتساوى فرص النتائج، عُدّ الجيدة منها واقسم على الكلي.'),
    });
  }),

  G('complement', 'probability', 'type-answer', [1, 2, 3], (rng, d) => {
    const p = d === 3 ? Fraction.parse(String(rng.int(1, 99) / 100)) : F(rng.int(1, 9), 10);
    const q = F(1).sub(p);
    const what = rng.pick([
      { en: 'it rains tomorrow', ar: 'تمطر غدًا', no: 'it does NOT rain tomorrow', noAr: 'لا تمطر غدًا' },
      { en: 'a seed grows', ar: 'تنمو بذرة', no: 'the seed does NOT grow', noAr: 'لا تنمو البذرة' },
      { en: 'the bus is late', ar: 'تتأخر الحافلة', no: 'the bus is NOT late', noAr: 'لا تتأخر الحافلة' },
    ]) as { en: string; ar: string; no: string; noAr: string };
    return typed({
      prompt: L(`The probability that ${what.en} is ${p.toDecimal(8)}. What is the probability that ${what.no}?`, `احتمال أن ${what.ar} هو ${p.toDecimal(8)}. ما احتمال أن ${what.noAr}؟`),
      value: q,
      correct: S(q.toDecimal(8)),
      errors: ne(q, [[p, 'wrong-operation'], [F(1).add(p), 'sign-error'], [p.div(F(10)), 'percent-decimal']]),
      hints: H(
        L('The probabilities of an event and its opposite add up to 1.', 'مجموع احتمال الحدث وعكسه يساوي 1.'),
        L('P(not A) = 1 − P(A)', 'P(ليس A) = 1 − P(A)'),
        L(`1 − ${p.toDecimal(8)}`, `1 − ${p.toDecimal(8)}`),
      ),
      steps: [S('P(not A) = 1 − P(A)'), S(`= 1 − ${p.toDecimal(8)}`), S(`= ${q.toDecimal(8)}`)],
      explanation: L('Either the event happens or it does not, so the two probabilities share the whole (1).', 'إمّا أن يقع الحدث أو لا يقع، فيتقاسم احتمالاهما الكل (1).'),
    });
  }),

  G('either-or', 'probability', 'mcq', [2, 3, 4], (rng, d) => {
    const counts = [rng.int(1, 4), rng.int(1, 4), rng.int(1, 3 + d)];
    const total = counts.reduce((a, b) => a + b, 0);
    const i = rng.int(0, 2);
    let j = rng.int(0, 2);
    if (j === i) j = (j + 1) % 3;
    const ci = COLOURS[i] as (typeof COLOURS)[number];
    const cj = COLOURS[j] as (typeof COLOURS)[number];
    const ni = counts[i] as number;
    const nj = counts[j] as number;
    const correct = F(ni + nj, total);
    const desc = counts.map((n, k) => `${n} ${(COLOURS[k] as (typeof COLOURS)[number]).en}`).join(', ');
    const descAr = counts.map((n, k) => `${n} ${(COLOURS[k] as (typeof COLOURS)[number]).ar}`).join('، ');
    return mcqNum(rng, {
      prompt: L(`A bag holds ${desc} counters. One is picked at random. What is the probability it is ${ci.en} or ${cj.en}?`, `في كيس قطع: ${descAr}. تُسحب قطعة عشوائيًّا. ما احتمال أن تكون ${ci.ar} أو ${cj.ar}؟`),
      correct,
      cands: [cand(F(ni * nj, total * total), 'wrong-operation'), cand(F(ni, total)), cand(F(nj, total)), cand(F(ni + nj, total + 1), 'part-whole-ratio'), cand(F(ni + nj, total - ni - nj === 0 ? 1 : total - ni - nj), 'probability-odds')],
      hints: H(
        L('The two colours cannot happen together, so you can add their chances.', 'اللونان لا يحدثان معًا، فيمكن جمع احتماليهما.'),
        L(`${ni} + ${nj} counters are ${ci.en} or ${cj.en}.`, `${ni} + ${nj} من القطع ${ci.ar} أو ${cj.ar}.`),
        L(`${ni + nj} out of ${total}`, `${ni + nj} من ${total}`),
      ),
      steps: [S(`P(${ci.en}) = ${ni}/${total}`), S(`P(${cj.en}) = ${nj}/${total}`), S(`${ni}/${total} + ${nj}/${total} = ${correct.toString()}`)],
      explanation: L('For events that cannot happen together, "or" means add the probabilities.', 'في الأحداث التي لا تقع معًا تعني "أو" جمع الاحتمالات.'),
    });
  }),

  G('and-independent', 'probability', 'type-answer', [3, 4, 5], (rng, d) => {
    const dens = [2, 3, 4, 5, 6, 8, 10];
    const b1 = rng.pick(dens) as number;
    const b2 = rng.pick(dens.filter((x) => x !== b1 || d > 3)) as number;
    const a1 = rng.int(1, b1 - 1);
    const a2 = rng.int(1, b2 - 1);
    const p1 = F(a1, b1);
    const p2 = F(a2, b2);
    const ans = p1.mul(p2);
    return typed({
      prompt: L(
        `Two independent events: A has probability ${a1}/${b1} and B has probability ${a2}/${b2}. What is the probability that BOTH happen? Give a fraction in simplest form.`,
        `حدثان مستقلان: احتمال A هو ${a1}/${b1} واحتمال B هو ${a2}/${b2}. ما احتمال وقوع الاثنين معًا؟ اكتب كسرًا في أبسط صورة.`,
      ),
      value: ans,
      extra: { lowest: true },
      errors: ne(ans, [[p1.add(p2), 'probability-add'], [p1, 'part-whole-ratio'], [p1.mul(p2).add(p1.mul(p2)), 'probability-add']]),
      hints: H(
        L('For independent events, "and" means multiply.', 'في الأحداث المستقلة تعني "و" الضرب.'),
        L('P(A and B) = P(A) × P(B)', 'P(A و B) = P(A) × P(B)'),
        L(`${a1}/${b1} × ${a2}/${b2}`, `${a1}/${b1} × ${a2}/${b2}`),
      ),
      steps: [S('P(A and B) = P(A) × P(B)'), S(`${a1}/${b1} × ${a2}/${b2} = ${a1 * a2}/${b1 * b2}`), S(`= ${ans.toString()}`)],
      explanation: L('Both events must happen, so the chance gets smaller: multiply, do not add.', 'يجب أن يقع الحدثان، فيصغر الاحتمال: اضرب ولا تجمع.'),
    });
  }),

  G('order-events', 'probability', 'ordering', [1, 2, 3], (rng, d) => {
    const pool = [
      { v: F(0), en: 'Rolling a 7 on a die', ar: 'الحصول على 7 برمي حجر نرد' },
      { v: F(1, 6), en: 'Rolling a 6', ar: 'الحصول على 6' },
      { v: F(1, 3), en: 'Rolling less than 3', ar: 'الحصول على عدد أقل من 3' },
      { v: F(1, 2), en: 'Rolling an even number', ar: 'الحصول على عدد زوجي' },
      { v: F(2, 3), en: 'Rolling more than 2', ar: 'الحصول على عدد أكبر من 2' },
      { v: F(5, 6), en: 'Rolling more than 1', ar: 'الحصول على عدد أكبر من 1' },
      { v: F(1), en: 'Rolling less than 7', ar: 'الحصول على عدد أقل من 7' },
    ];
    const entries = rng.sample(pool, d + 2).map((e) => ({ value: e.v, label: L(e.en, e.ar) }));
    const asc = rng.chance(0.5);
    return orderBody(rng, {
      prompt: asc ? L('Order these events from LEAST likely to MOST likely (one fair die).', 'رتّب هذه الأحداث من الأقل احتمالًا إلى الأكثر (حجر نرد عادل).') : L('Order these events from MOST likely to LEAST likely (one fair die).', 'رتّب هذه الأحداث من الأكثر احتمالًا إلى الأقل (حجر نرد عادل).'),
      entries,
      ascending: asc,
      hints: H(
        L('Give each event a probability out of 6.', 'أعطِ كل حدث احتمالًا من 6.'),
        L('Count how many faces make each event happen.', 'عُدّ الأوجه التي تحقق كل حدث.'),
        L('More faces means more likely.', 'كلما زادت الأوجه زاد الاحتمال.'),
      ),
      steps: entries.slice().sort((a, b) => (asc ? a.value.cmp(b.value) : b.value.cmp(a.value))).map((e) => L(`${e.label.en}: ${e.value.toString()}`, `${e.label.ar}: ${e.value.toString()}`)),
      explanation: L('Impossible events have probability 0 and certain events have probability 1.', 'الحدث المستحيل احتماله 0 والحدث المؤكد احتماله 1.'),
    });
  }),

  G('true-false', 'probability', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const kind = rng.int(0, d >= 3 ? 2 : 1);
    const truth = rng.chance(0.5);
    if (kind === 0) {
      const p = rng.pick([0, 0.1, 0.25, 0.4, 0.5, 0.75, 1, 1.2, 1.5, -0.2, 2, 3]) as number;
      const ok = p >= 0 && p <= 1;
      return tfBody({
        prompt: L(`Could ${p} be the probability of an event?`, `هل يمكن أن يكون ${p} احتمال حدث ما؟`),
        truth: ok,
        hints: H(L('Probabilities live on a scale from 0 to 1.', 'الاحتمالات تقع على مقياس من 0 إلى 1.'), L('0 means impossible and 1 means certain.', '0 مستحيل و1 مؤكد.'), L(`Is ${p} between 0 and 1?`, `هل ${p} بين 0 و 1؟`)),
        steps: [S(`0 ≤ P ≤ 1`), S(ok ? `0 ≤ ${p} ≤ 1` : `${p} is outside [0, 1]`)],
        explanation: L('No event can be less likely than impossible or more likely than certain.', 'لا يوجد حدث أقل احتمالًا من المستحيل أو أكثر من المؤكد.'),
      });
    }
    if (kind === 1) {
      const b = rng.int(3, 12);
      const a = rng.int(1, b - 1);
      const shown = truth ? b - a : a + 1;
      return tfBody({
        prompt: L(`If P(A) = ${a}/${b}, then P(not A) = ${shown}/${b}.`, `إذا كان P(A) = ${a}/${b} فإن P(ليس A) = ${shown}/${b}.`),
        truth: shown === b - a,
        pid: 'wrong-operation',
        hints: H(L('P(not A) = 1 − P(A).', 'P(ليس A) = 1 − P(A).'), L(`1 = ${b}/${b}`, `1 = ${b}/${b}`), L(`${b}/${b} − ${a}/${b}`, `${b}/${b} − ${a}/${b}`)),
        steps: [S(`1 − ${a}/${b} = ${b - a}/${b}`), S(shown === b - a ? '✓' : '✗')],
        explanation: L('The two probabilities must add up to 1.', 'يجب أن يكون مجموع الاحتمالين 1.'),
      });
    }
    const a = rng.pick([2, 3, 4, 5, 6]) as number;
    const b = rng.pick([2, 3, 4, 5, 6].filter((x) => x !== a)) as number;
    const sumForm = !truth;
    return tfBody({
      prompt: L(
        `Two independent events have probabilities 1/${a} and 1/${b}. The probability that both happen is ${sumForm ? `1/${a} + 1/${b}` : `1/${a} × 1/${b}`}.`,
        `حدثان مستقلان احتمالاهما 1/${a} و 1/${b}. احتمال وقوعهما معًا هو ${sumForm ? `1/${a} + 1/${b}` : `1/${a} × 1/${b}`}.`,
      ),
      truth,
      pid: 'probability-add',
      hints: H(L('"And" with independent events means multiply.', '"و" مع الأحداث المستقلة تعني الضرب.'), L('Adding would give a bigger number than either chance alone.', 'الجمع يعطي عددًا أكبر من كل من الاحتمالين.'), L('Both happening is rarer than one happening.', 'وقوع الاثنين معًا أندر من وقوع أحدهما.')),
      steps: [S('P(A and B) = P(A) × P(B)'), truth ? L('The statement multiplies, so it is true.', 'العبارة تضرب، فهي صحيحة.') : L('The statement adds, so it is false.', 'العبارة تجمع، فهي خاطئة.')],
      explanation: L('Probabilities of "and" for independent events are multiplied.', 'تُضرب احتمالات "و" للأحداث المستقلة.'),
    });
  }),

  G('expected', 'probability', 'word-problem', [2, 3, 4], (rng, d) => {
    const b = rng.pick([2, 3, 4, 5, 10]) as number;
    const a = rng.int(1, b - 1);
    const times = b * rng.int(2, d * 4 + 2);
    const exp = (times * a) / b;
    return typed({
      prompt: L(
        `A spinner lands on blue with probability ${a}/${b}. If it is spun ${times} times, how many times would you expect it to land on blue?`,
        `يقف مؤشر على الأزرق باحتمال ${a}/${b}. إذا دُوّر ${times} مرة، فكم مرة تتوقع أن يقف على الأزرق؟`,
      ),
      value: exp,
      extra: { integerOnly: true },
      errors: ne(exp, [[F(times * b, a), 'wrong-operation'], [times - exp, 'wrong-operation'], [a * b, 'wrong-operation']]),
      hints: H(
        L('Expected number = probability × number of trials.', 'العدد المتوقع = الاحتمال × عدد المحاولات.'),
        L(`${a}/${b} × ${times}`, `${a}/${b} × ${times}`),
        L(`${times} ÷ ${b} × ${a}`, `${times} ÷ ${b} × ${a}`),
      ),
      steps: [S(`${a}/${b} × ${times}`), S(`${times} ÷ ${b} = ${times / b}`), S(`${times / b} × ${a} = ${exp}`)],
      explanation: L('Over many trials the results settle close to probability × trials.', 'مع كثرة المحاولات تقترب النتائج من الاحتمال × عدد المحاولات.'),
    });
  }),
];

// ───────────────────────── Trigonometry ─────────────────────────

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
const FN = ['sin', 'cos', 'tan'] as const;
type Fn = (typeof FN)[number];

/** Right triangle: opposite, adjacent, hypotenuse (scaled, maybe flipped). */
function triangle(rng: Rng, d: number): { o: number; a: number; h: number } {
  const [x, y, h0] = rng.pick(d === 1 ? TRIPLES.slice(0, 2) : TRIPLES) as [number, number, number];
  const k = d >= 3 ? rng.int(1, 3) : 1;
  const flip = rng.chance(0.5);
  return { o: (flip ? y : x) * k, a: (flip ? x : y) * k, h: h0 * k };
}
const ratioOf = (fn: Fn, t: { o: number; a: number; h: number }): Fraction => (fn === 'sin' ? F(t.o, t.h) : fn === 'cos' ? F(t.a, t.h) : F(t.o, t.a));

const SPECIAL: { fn: Fn; deg: number; v: Fraction }[] = [
  { fn: 'sin', deg: 30, v: F(1, 2) },
  { fn: 'cos', deg: 60, v: F(1, 2) },
  { fn: 'tan', deg: 45, v: F(1) },
  { fn: 'sin', deg: 90, v: F(1) },
  { fn: 'cos', deg: 0, v: F(1) },
  { fn: 'sin', deg: 0, v: F(0) },
  { fn: 'cos', deg: 90, v: F(0) },
  { fn: 'tan', deg: 0, v: F(0) },
];

const trigonometry: Generator[] = [
  G('ratio', 'trigonometry', 'type-answer', [1, 2, 3], (rng, d) => {
    const t = triangle(rng, d);
    const fn = rng.pick(FN.slice(0, d === 1 ? 2 : 3)) as Fn;
    const v = ratioOf(fn, t);
    const others = FN.filter((f) => f !== fn).map((f) => ratioOf(f, t));
    return typed({
      prompt: L(
        `In a right triangle, the side opposite angle A is ${t.o}, the side adjacent to A is ${t.a} and the hypotenuse is ${t.h}. Find ${fn} A as a fraction.`,
        `في مثلث قائم الزاوية، الضلع المقابل للزاوية A طوله ${t.o}، والضلع المجاور لها ${t.a}، والوتر ${t.h}. أوجد ${fn} A ككسر.`,
      ),
      value: v,
      errors: ne(v, [[others[0] as Fraction, 'trig-mixup'], [others[1] as Fraction, 'trig-mixup'], [v.inv(), 'trig-mixup']]),
      hints: H(
        L('Remember SOH-CAH-TOA.', 'تذكّر SOH-CAH-TOA.'),
        L(fn === 'sin' ? 'sin = opposite ÷ hypotenuse' : fn === 'cos' ? 'cos = adjacent ÷ hypotenuse' : 'tan = opposite ÷ adjacent', fn === 'sin' ? 'جا = المقابل ÷ الوتر' : fn === 'cos' ? 'جتا = المجاور ÷ الوتر' : 'ظا = المقابل ÷ المجاور'),
        L(fn === 'sin' ? `${t.o} / ${t.h}` : fn === 'cos' ? `${t.a} / ${t.h}` : `${t.o} / ${t.a}`, fn === 'sin' ? `${t.o} / ${t.h}` : fn === 'cos' ? `${t.a} / ${t.h}` : `${t.o} / ${t.a}`),
      ),
      steps: [S(fn === 'sin' ? 'sin A = opposite / hypotenuse' : fn === 'cos' ? 'cos A = adjacent / hypotenuse' : 'tan A = opposite / adjacent'), S(fn === 'sin' ? `${t.o}/${t.h}` : fn === 'cos' ? `${t.a}/${t.h}` : `${t.o}/${t.a}`), S(`= ${v.toString()}`)],
      explanation: L('Each trig ratio compares two sides of a right triangle, from the point of view of angle A.', 'كل نسبة مثلثية تقارن ضلعين في مثلث قائم من وجهة نظر الزاوية A.'),
    });
  }),

  G('pick-ratio', 'trigonometry', 'mcq', [1, 2, 3], (rng, d) => {
    const t = triangle(rng, d);
    const fn = rng.pick(FN) as Fn;
    const v = ratioOf(fn, t);
    const others = [F(t.o, t.h), F(t.a, t.h), F(t.o, t.a), F(t.h, t.o), F(t.h, t.a), F(t.a, t.o)];
    return mcqNum(rng, {
      prompt: L(`A right triangle has opposite side ${t.o}, adjacent side ${t.a} and hypotenuse ${t.h} (for angle A). What is ${fn} A?`, `مثلث قائم فيه المقابل ${t.o} والمجاور ${t.a} والوتر ${t.h} (بالنسبة للزاوية A). ما قيمة ${fn} A؟`),
      correct: v,
      cands: others.map((o) => cand(o, 'trig-mixup')),
      hints: H(
        L('SOH: sin = O/H. CAH: cos = A/H. TOA: tan = O/A.', 'جا = المقابل/الوتر، جتا = المجاور/الوتر، ظا = المقابل/المجاور.'),
        L(`You need ${fn === 'sin' ? 'opposite and hypotenuse' : fn === 'cos' ? 'adjacent and hypotenuse' : 'opposite and adjacent'}.`, `تحتاج ${fn === 'sin' ? 'المقابل والوتر' : fn === 'cos' ? 'المجاور والوتر' : 'المقابل والمجاور'}.`),
        L('The hypotenuse is always the longest side.', 'الوتر هو دائمًا أطول ضلع.'),
      ),
      steps: [S(fn === 'sin' ? 'sin A = O / H' : fn === 'cos' ? 'cos A = A / H' : 'tan A = O / A'), S(`= ${v.toString()}`)],
      explanation: L('Pick the two sides that the ratio uses, and put them in the right order.', 'اختر الضلعين اللذين تستعملهما النسبة وضعهما بالترتيب الصحيح.'),
    });
  }),

  G('special-angle', 'trigonometry', 'fill-blank', [2, 3, 4], (rng, d) => {
    const pool = SPECIAL.slice(0, d === 2 ? 4 : 8);
    const s = rng.pick(pool) as (typeof SPECIAL)[number];
    return typed({
      prompt: L('Fill in the value.', 'أكمل بالقيمة.'),
      display: `\\${s.fn}\\, ${s.deg}^\\circ = \\square`,
      value: s.v,
      errors: ne(s.v, [[F(1, 2), 'trig-mixup'], [F(1), 'trig-mixup'], [F(0), 'trig-mixup']]),
      hints: H(
        L('Think of the unit circle or a 30-60-90 / 45-45-90 triangle.', 'فكّر في دائرة الوحدة أو في مثلث 30-60-90 أو 45-45-90.'),
        L(s.fn === 'sin' ? 'sine is the height on the unit circle.' : s.fn === 'cos' ? 'cosine is the horizontal distance on the unit circle.' : 'tan = sin ÷ cos.', s.fn === 'sin' ? 'الجيب هو الارتفاع على دائرة الوحدة.' : s.fn === 'cos' ? 'جيب التمام هو المسافة الأفقية على دائرة الوحدة.' : 'ظا = جا ÷ جتا.'),
        L('Remember: sin 30° = 1/2 and cos 60° = 1/2.', 'تذكّر: جا 30° = 1/2 و جتا 60° = 1/2.'),
      ),
      steps: [S(`${s.fn} ${s.deg}° = ${s.v.toString()}`)],
      explanation: L('A few special angles have exact values that are worth knowing by heart.', 'لبعض الزوايا الخاصة قيم دقيقة تستحق الحفظ.'),
    });
  }),

  G('ladder', 'trigonometry', 'word-problem', [2, 3, 4], (rng, d) => {
    const half = rng.int(2, d * 4 + 3);
    const len = half * 2;
    return typed({
      prompt: L(
        `A ramp ${len} m long rises at an angle of 30° to the ground. How high does it rise? (sin 30° = 1/2)`,
        `منحدر طوله ${len} م يميل بزاوية 30° على الأرض. كم يرتفع؟ (جا 30° = 1/2)`,
      ),
      value: half,
      suffix: 'm',
      correct: L(`${half} m`, `${half} م`),
      errors: ne(half, [[len * 2, 'trig-mixup'], [len, 'trig-mixup'], [len - 30, 'wrong-operation']]),
      hints: H(
        L('The height is the side opposite the 30° angle; the ramp is the hypotenuse.', 'الارتفاع هو الضلع المقابل للزاوية 30° والمنحدر هو الوتر.'),
        L('sin 30° = opposite ÷ hypotenuse', 'جا 30° = المقابل ÷ الوتر'),
        L(`height = ${len} × 1/2`, `الارتفاع = ${len} × 1/2`),
      ),
      steps: [S('sin 30° = height / length'), S(`height = ${len} × 1/2`), S(`= ${half}`)],
      explanation: L('Rearrange sin θ = opposite ÷ hypotenuse to find the opposite side.', 'أعد ترتيب جا θ = المقابل ÷ الوتر لإيجاد الضلع المقابل.'),
    });
  }),

  G('find-side', 'trigonometry', 'solve-equation', [3, 4, 5], (rng, d) => {
    const t = triangle(rng, d);
    const k = d >= 4 ? rng.int(2, 4) : 1;
    const fn = rng.pick(['sin', 'cos'] as const) as 'sin' | 'cos';
    const r = ratioOf(fn, t);
    const hyp = t.h * k;
    const x = F(hyp).mul(r);
    return typed({
      prompt: L(
        `In a right triangle, ${fn} A = ${r.toString()}. The hypotenuse is ${hyp}. Find the ${fn === 'sin' ? 'side opposite' : 'side adjacent to'} A.`,
        `في مثلث قائم، ${fn} A = ${r.toString()} والوتر ${hyp}. أوجد الضلع ${fn === 'sin' ? 'المقابل' : 'المجاور'} للزاوية A.`,
      ),
      value: x,
      errors: ne(x, [[F(hyp).div(r), 'trig-mixup'], [F(hyp).add(r), 'wrong-operation']]),
      hints: H(
        L(`${fn} A = ${fn === 'sin' ? 'opposite' : 'adjacent'} ÷ hypotenuse`, `${fn} A = ${fn === 'sin' ? 'المقابل' : 'المجاور'} ÷ الوتر`),
        L('Multiply both sides by the hypotenuse.', 'اضرب الطرفين في الوتر.'),
        L(`${r.toString()} × ${hyp}`, `${r.toString()} × ${hyp}`),
      ),
      steps: [S(`${r.toString()} = x / ${hyp}`), S(`x = ${r.toString()} × ${hyp}`), S(`x = ${x.toString()}`)],
      explanation: L('Multiply the ratio by the hypotenuse to get the missing side.', 'اضرب النسبة في الوتر لتحصل على الضلع المجهول.'),
    });
  }),

  G('soh-cah-toa', 'trigonometry', 'matching', [1, 2, 3, 4], (rng, d) => {
    const defs = [
      { l: L('sin A', 'جا A'), r: L('opposite ÷ hypotenuse', 'المقابل ÷ الوتر') },
      { l: L('cos A', 'جتا A'), r: L('adjacent ÷ hypotenuse', 'المجاور ÷ الوتر') },
      { l: L('tan A', 'ظا A'), r: L('opposite ÷ adjacent', 'المقابل ÷ المجاور') },
      { l: L('hypotenuse', 'الوتر'), r: L('the longest side', 'أطول ضلع') },
      { l: L('opposite', 'المقابل'), r: L('across from angle A', 'في مواجهة الزاوية A') },
      { l: L('adjacent', 'المجاور'), r: L('next to angle A (not the hypotenuse)', 'بجوار الزاوية A (وليس الوتر)') },
    ];
    const chosen = rng.sample(defs, Math.min(3 + (d >= 3 ? 1 : 0), defs.length));
    return matchBody(rng, {
      prompt: L('Match each term with its meaning.', 'طابِق كل مصطلح مع معناه.'),
      pairs: chosen.map((c) => ({ left: c.l, right: c.r })),
      hints: H(L('Think SOH-CAH-TOA.', 'تذكّر SOH-CAH-TOA.'), L('S/C/T stand for sin, cos, tan; O/A/H for opposite, adjacent, hypotenuse.', 'S/C/T هي جا وجتا وظا؛ و O/A/H المقابل والمجاور والوتر.'), L('The hypotenuse faces the right angle.', 'الوتر يواجه الزاوية القائمة.')),
      steps: chosen.map((c) => L(`${c.l.en} → ${c.r.en}`, `${c.l.ar} ← ${c.r.ar}`)),
      explanation: L('SOH-CAH-TOA helps you recall which sides each ratio uses.', 'تساعدك SOH-CAH-TOA على تذكّر الأضلاع التي تستعملها كل نسبة.'),
    });
  }),

  G('true-false', 'trigonometry', 'true-false', [1, 2, 3, 4], (rng) => {
    const s = rng.pick(SPECIAL) as (typeof SPECIAL)[number];
    const truth = rng.chance(0.5);
    const wrongs = [F(0), F(1, 2), F(1)].filter((v) => !v.eq(s.v));
    const shown = truth ? s.v : (rng.pick(wrongs) as Fraction);
    return tfBody({
      prompt: L('True or false?', 'صحيح أم خطأ؟'),
      display: `\\${s.fn}\\, ${s.deg}^\\circ = ${shown.toLatex()}`,
      truth,
      pid: 'trig-mixup',
      hints: H(
        L('Recall the special-angle table.', 'تذكّر جدول الزوايا الخاصة.'),
        L('sin 30° = cos 60° = 1/2, tan 45° = 1, sin 90° = cos 0° = 1.', 'جا 30° = جتا 60° = 1/2، ظا 45° = 1، جا 90° = جتا 0° = 1.'),
        L(`Is ${s.fn} ${s.deg}° equal to ${shown.toString()}?`, `هل ${s.fn} ${s.deg}° تساوي ${shown.toString()}؟`),
      ),
      steps: [S(`${s.fn} ${s.deg}° = ${s.v.toString()}`), truth ? L('The statement matches.', 'العبارة مطابقة.') : L('The statement does not match.', 'العبارة غير مطابقة.')],
      explanation: L('Sine and cosine swap values for complementary angles.', 'يتبادل الجيب وجيب التمام القيم عند الزوايا المتتامة.'),
    });
  }),
];

// ───────────────────────── Sequences ─────────────────────────

const listTerms = (xs: (number | Fraction)[]): string => xs.map((x) => (typeof x === 'number' ? String(x) : x.toString())).join(', ');
const arith = (a: number, dd: number, n: number): number[] => Array.from({ length: n }, (_, i) => a + i * dd);
const geom = (a: number, r: number, n: number): number[] => Array.from({ length: n }, (_, i) => a * r ** i);

const sequences: Generator[] = [
  G('next-term', 'sequences', 'type-answer', [1, 2, 3], (rng, d) => {
    const dd = d === 1 ? rng.int(2, 5) : nz(rng, -9, 12);
    const a = rng.int(d === 1 ? 1 : -10, 20);
    const seq = arith(a, dd, 5);
    const shown = seq.slice(0, 4);
    return typed({
      prompt: L('What is the next term of this sequence?', 'ما الحد التالي في هذه المتتالية؟'),
      display: listTerms(shown),
      value: seq[4] as number,
      extra: { integerOnly: true },
      errors: ne(seq[4] as number, [[(shown[3] as number) - dd, 'sequence-rule'], [(shown[3] as number) * 2 - (shown[2] as number) + dd, 'sequence-rule'], [(shown[3] as number) + dd * 2, 'off-by-one']]),
      hints: H(
        L('Find how much the terms change each time.', 'اعرف مقدار التغيّر في كل مرة.'),
        L(`The difference is ${minus(dd)}.`, `الفرق هو ${minus(dd)}.`),
        L(`${shown[3]} ${dd < 0 ? '−' : '+'} ${Math.abs(dd)}`, `${shown[3]} ${dd < 0 ? '−' : '+'} ${Math.abs(dd)}`),
      ),
      steps: [S(`${shown[1]} − ${pp(shown[0] as number)} = ${minus(dd)}`), S(`${shown[3]} ${dd < 0 ? '−' : '+'} ${Math.abs(dd)}`), S(String(seq[4]))],
      explanation: L('In an arithmetic sequence the same amount is added every time.', 'في المتتالية الحسابية يُضاف المقدار نفسه في كل مرة.'),
    });
  }),

  G('common-step', 'sequences', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    if (d >= 3 && rng.chance(0.5)) {
      const r = rng.pick([2, 3, 4, -2]) as number;
      const a = rng.int(1, 5);
      const seq = geom(a, r, 4);
      return typed({
        prompt: L('Each term is multiplied by the same number. What is the common ratio?', 'يُضرب كل حد في العدد نفسه. ما النسبة المشتركة؟'),
        display: listTerms(seq),
        value: r,
        extra: { integerOnly: true },
        errors: ne(r, [[(seq[1] as number) - (seq[0] as number), 'sequence-rule'], [-r, 'sign-error']]),
        hints: H(L('Divide a term by the term before it.', 'اقسم حدًّا على الحد الذي قبله.'), L(`${seq[1]} ÷ ${pp(seq[0] as number)}`, `${seq[1]} ÷ ${pp(seq[0] as number)}`), L('Check with the next pair too.', 'تحقّق بالزوج التالي أيضًا.')),
        steps: [S(`${seq[1]} ÷ ${pp(seq[0] as number)} = ${minus(r)}`), S(`${seq[2]} ÷ ${pp(seq[1] as number)} = ${minus(r)}`)],
        explanation: L('A geometric sequence multiplies by a constant ratio.', 'المتتالية الهندسية تضرب في نسبة ثابتة.'),
      });
    }
    const dd = nz(rng, -(d * 3 + 2), d * 3 + 4);
    const a = rng.int(-5, 30);
    const seq = arith(a, dd, 4);
    return typed({
      prompt: L('What is the common difference of this sequence?', 'ما الفرق المشترك لهذه المتتالية؟'),
      display: listTerms(seq),
      value: dd,
      extra: { integerOnly: true },
      errors: ne(dd, [[-dd, 'sign-error'], [(seq[3] as number) - (seq[0] as number), 'sequence-rule']]),
      hints: H(L('Subtract a term from the next one.', 'اطرح حدًّا من الحد الذي يليه.'), L(`${seq[1]} − ${pp(seq[0] as number)}`, `${seq[1]} − ${pp(seq[0] as number)}`), L('The sign matters: decreasing sequences have a negative difference.', 'الإشارة مهمة: المتتالية المتناقصة فرقها سالب.')),
      steps: [S(`${seq[1]} − ${pp(seq[0] as number)} = ${minus(dd)}`), S(`${seq[2]} − ${pp(seq[1] as number)} = ${minus(dd)}`)],
      explanation: L('The common difference is next term minus the previous term.', 'الفرق المشترك هو الحد التالي ناقص الحد السابق.'),
    });
  }),

  G('nth-term', 'sequences', 'type-answer', [2, 3, 4], (rng, d) => {
    const dd = nz(rng, -5, 9);
    const a = rng.int(-4, 15);
    const n = rng.int(8, d * 6 + 10);
    const v = a + (n - 1) * dd;
    return typed({
      prompt: L(`Find term number ${n} of this sequence.`, `أوجد الحد رقم ${n} في هذه المتتالية.`),
      display: `${listTerms(arith(a, dd, 4))}, \\dots`,
      value: v,
      extra: { integerOnly: true },
      errors: ne(v, [[a + n * dd, 'off-by-one'], [n * dd, 'sequence-rule'], [a + (n - 2) * dd, 'off-by-one']]),
      hints: H(
        L('The nth term is the first term plus (n − 1) steps.', 'الحد النوني هو الحد الأول زائد (n − 1) من الخطوات.'),
        L(`a = ${a}, d = ${minus(dd)}, n = ${n}`, `a = ${a}, d = ${minus(dd)}, n = ${n}`),
        L(`${a} + ${n - 1} × ${pp(dd)}`, `${a} + ${n - 1} × ${pp(dd)}`),
      ),
      steps: [S('aₙ = a + (n − 1)d'), S(`${a} + ${n - 1} × ${pp(dd)}`), S(String(v))],
      explanation: L('To reach term n you take n − 1 steps from term 1, not n.', 'للوصول إلى الحد n تأخذ n − 1 خطوة من الحد الأول لا n.'),
    });
  }),

  G('geometric-next', 'sequences', 'type-answer', [2, 3, 4], (rng, d) => {
    const kind = d === 2 ? rng.pick([2, 3]) : (rng.pick([2, 3, -2, 0.5]) as number);
    let seq: number[];
    let next: number;
    if (kind === 0.5) {
      const a = 16 * rng.int(1, 6);
      seq = [a, a / 2, a / 4, a / 8];
      next = a / 16;
    } else {
      const a = rng.int(1, 5);
      seq = geom(a, kind, 4);
      next = a * kind ** 4;
    }
    const last = seq[3] as number;
    const prev = seq[2] as number;
    return typed({
      prompt: L('Each term is a multiple of the one before it. What is the next term?', 'كل حد هو مضاعف للحد الذي قبله. ما الحد التالي؟'),
      display: `${listTerms(seq)}, \\dots`,
      value: next,
      extra: { integerOnly: true },
      errors: ne(next, [[last + (last - prev), 'sequence-rule'], [last * 2, 'sequence-rule'], [-next, 'sign-error']]),
      hints: H(
        L('Divide a term by the one before it to find the ratio.', 'اقسم حدًّا على سابقه لإيجاد النسبة.'),
        L(`The ratio is ${kind === 0.5 ? '1/2' : minus(kind)}.`, `النسبة هي ${kind === 0.5 ? '1/2' : minus(kind)}.`),
        L(`${last} × ${kind === 0.5 ? '1/2' : pp(kind)}`, `${last} × ${kind === 0.5 ? '1/2' : pp(kind)}`),
      ),
      steps: [S(`${seq[1]} ÷ ${pp(seq[0] as number)} = ${kind === 0.5 ? '1/2' : minus(kind)}`), S(`${last} × ${kind === 0.5 ? '1/2' : pp(kind)}`), S(String(next))],
      explanation: L('When terms are multiplied by a constant, the pattern is geometric and adding the last gap does not work.', 'عندما تُضرب الحدود في ثابت تكون المتتالية هندسية ولا يصلح جمع الفرق الأخير.'),
    });
  }),

  G('series-sum', 'sequences', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    if (d <= 3 && rng.chance(0.6)) {
      const n = d === 2 ? rng.pick([10, 20, 12, 8]) as number : rng.pick([50, 100, 40, 30, 60]) as number;
      const v = (n * (n + 1)) / 2;
      return typed({
        prompt: L(`Find 1 + 2 + 3 + … + ${n}.`, `أوجد 1 + 2 + 3 + … + ${n}.`),
        value: v,
        extra: { integerOnly: true },
        errors: ne(v, [[n * (n + 1), 'sequence-rule'], [(n * n) / 2, 'sequence-rule'], [n * n, 'sequence-rule']]),
        hints: H(
          L('Pair the first and last numbers: 1 + n, 2 + (n − 1), …', 'اجمع الأول مع الأخير: 1 + n ثم 2 + (n − 1) وهكذا.'),
          L(`Each pair makes ${n + 1}, and there are ${n / 2} pairs.`, `كل زوج مجموعه ${n + 1} وعدد الأزواج ${n / 2}.`),
          L(`${n / 2} × ${n + 1}`, `${n / 2} × ${n + 1}`),
        ),
        steps: [S('S = n(n + 1) / 2'), S(`${n} × ${n + 1} / 2`), S(String(v))],
        explanation: L('Gauss noticed that pairing the ends of the list gives equal sums.', 'لاحظ غاوس أن جمع طرفي القائمة في أزواج يعطي مجاميع متساوية.'),
      });
    }
    const n = rng.int(5, d * 3 + 6);
    const dd = nz(rng, -3, 7);
    const a = rng.int(1, 20);
    const last = a + (n - 1) * dd;
    const v = F(n * (a + last), 2);
    return typed({
      prompt: L(`Find the sum of the first ${n} terms of this sequence.`, `أوجد مجموع أول ${n} من حدود هذه المتتالية.`),
      display: `${listTerms(arith(a, dd, 4))}, \\dots`,
      value: v,
      errors: ne(v, [[n * (a + last), 'sequence-rule'], [(a + last) / 2, 'sequence-rule'], [n * last, 'sequence-rule']]),
      correct: S(v.toDecimal(8)),
      hints: H(
        L('Sum = n × (first + last) ÷ 2.', 'المجموع = n × (الأول + الأخير) ÷ 2.'),
        L(`The last term is ${a} + ${n - 1} × ${pp(dd)} = ${last}.`, `الحد الأخير ${a} + ${n - 1} × ${pp(dd)} = ${last}.`),
        L(`${n} × (${a} + ${pp(last)}) ÷ 2`, `${n} × (${a} + ${pp(last)}) ÷ 2`),
      ),
      steps: [S(`last = ${a} + ${n - 1} × ${pp(dd)} = ${minus(last)}`), S(`S = ${n} × (${a} + ${pp(last)}) ÷ 2`), S(v.toDecimal(8))],
      explanation: L('The average of the first and last term, times the number of terms, gives the sum.', 'متوسط الحد الأول والأخير مضروبًا في عدد الحدود يعطي المجموع.'),
    });
  }),

  G('which-rule', 'sequences', 'mcq', [1, 2, 3], (rng, d) => {
    const geometric = d >= 2 && rng.chance(0.5);
    const k = geometric ? rng.int(2, 4) : rng.int(2, 9);
    const a = rng.int(1, 6);
    const seq = geometric ? geom(a, k, 4) : arith(a, k, 4);
    const ok = geometric ? L(`Multiply by ${k} each time`, `اضرب في ${k} كل مرة`) : L(`Add ${k} each time`, `أضف ${k} كل مرة`);
    const wrongs = geometric
      ? [{ label: L(`Add ${k} each time`, `أضف ${k} كل مرة`), pid: 'sequence-rule' }, { label: L(`Add ${k + 1} each time`, `أضف ${k + 1} كل مرة`), pid: 'sequence-rule' }, { label: L(`Multiply by ${k + 1} each time`, `اضرب في ${k + 1} كل مرة`) }, { label: L(`Add ${(seq[1] as number) - (seq[0] as number)} then ${k}`, `أضف ${(seq[1] as number) - (seq[0] as number)} ثم ${k}`) }]
      : [{ label: L(`Multiply by ${k} each time`, `اضرب في ${k} كل مرة`), pid: 'sequence-rule' }, { label: L(`Add ${k + 1} each time`, `أضف ${k + 1} كل مرة`), pid: 'sequence-rule' }, { label: L(`Add ${k - 1} each time`, `أضف ${k - 1} كل مرة`) }, { label: L(`Subtract ${k} each time`, `اطرح ${k} كل مرة`), pid: 'sign-error' }];
    return mcqText(rng, {
      prompt: L('Which rule describes this sequence?', 'أي قاعدة تصف هذه المتتالية؟'),
      display: listTerms(seq),
      correct: ok,
      wrongs,
      hints: H(L('Compare each term with the one before it.', 'قارن كل حد بالحد الذي قبله.'), L('Is the gap the same each time, or is the ratio the same?', 'هل الفرق هو نفسه كل مرة أم النسبة هي نفسها؟'), L(`${seq[0]} → ${seq[1]}`, `${seq[0]} ← ${seq[1]}`)),
      steps: [S(`${seq[1]} − ${seq[0]} = ${(seq[1] as number) - (seq[0] as number)},  ${seq[2]} − ${seq[1]} = ${(seq[2] as number) - (seq[1] as number)}`), ok],
      explanation: L('Test both "add" and "multiply" on the first two terms, then confirm with the third.', 'جرّب "الجمع" و"الضرب" على أول حدّين ثم تأكد بالحد الثالث.'),
    });
  }),

  G('missing-term', 'sequences', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const geometric = d >= 3 && rng.chance(0.5);
    const idx = rng.int(1, 3);
    let seq: number[];
    if (geometric) seq = geom(rng.int(1, 4), rng.int(2, 3), 5);
    else seq = arith(rng.int(-5, 20), nz(rng, d === 1 ? 2 : -8, 9), 5);
    const target = seq[idx] as number;
    const shown = seq.map((x, i) => (i === idx ? '\\square' : String(x)));
    return typed({
      prompt: L('Find the missing term.', 'أوجد الحد الناقص.'),
      display: shown.join(', '),
      value: target,
      extra: { integerOnly: true },
      errors: ne(target, [[(seq[idx - 1] as number) + (seq[idx + 1] as number), 'sequence-rule'], [seq[idx - 1] as number, 'sequence-rule']]),
      hints: H(
        L('Find the rule from two neighbouring known terms.', 'استنتج القاعدة من حدّين معروفين متجاورين.'),
        L(geometric ? 'The terms are multiplied by a constant ratio.' : 'The terms change by a constant difference.', geometric ? 'تُضرب الحدود في نسبة ثابتة.' : 'تتغير الحدود بفرق ثابت.'),
        L(`The previous term is ${seq[idx - 1]}.`, `الحد السابق هو ${seq[idx - 1]}.`),
      ),
      steps: [S(geometric ? `ratio = ${(seq[4] as number) / (seq[3] as number)}` : `difference = ${minus((seq[4] as number) - (seq[3] as number))}`), S(`${seq[idx - 1]} → ${target}`)],
      explanation: L('Once you know the rule, a missing term follows from its neighbour.', 'متى عرفت القاعدة يمكنك إيجاد الحد الناقص من جاره.'),
    });
  }),

  G('is-arithmetic', 'sequences', 'true-false', [1, 2, 3], (rng) => {
    const truth = rng.chance(0.5);
    let seq: number[];
    if (truth) seq = arith(rng.int(-3, 15), nz(rng, -6, 8), 5);
    else if (rng.chance(0.5)) seq = geom(rng.int(1, 4), rng.int(2, 3), 5);
    else {
      seq = arith(rng.int(1, 15), rng.int(2, 6), 5);
      const i = rng.int(2, 4);
      seq[i] = (seq[i] as number) + rng.int(1, 3);
    }
    return tfBody({
      prompt: L('This sequence has a constant difference between terms.', 'في هذه المتتالية فرق ثابت بين الحدود.'),
      display: listTerms(seq),
      truth,
      pid: 'sequence-rule',
      hints: H(L('Subtract each term from the next one.', 'اطرح كل حد من الحد الذي يليه.'), L(`${seq[1]} − ${pp(seq[0] as number)} = ${minus((seq[1] as number) - (seq[0] as number))}`, `${seq[1]} − ${pp(seq[0] as number)} = ${minus((seq[1] as number) - (seq[0] as number))}`), L('Are all the differences equal?', 'هل كل الفروق متساوية؟')),
      steps: [S(seq.slice(1).map((x, i) => `${x} − ${pp(seq[i] as number)} = ${minus(x - (seq[i] as number))}`).join(',  ')), truth ? L('All equal: true.', 'كلها متساوية: صحيح.') : L('Not all equal: false.', 'ليست كلها متساوية: خطأ.')],
      explanation: L('Every gap must match for the difference to be constant.', 'يجب أن تتطابق كل الفروق ليكون الفرق ثابتًا.'),
    });
  }),

  G('savings', 'sequences', 'word-problem', [2, 3, 4], (rng, d) => {
    const start = rng.int(5, 40);
    const step = rng.int(2, d * 4 + 3);
    const week = rng.int(5, d * 3 + 8);
    const v = start + (week - 1) * step;
    return typed({
      prompt: L(
        `Sara saves ${start} in week 1, and each week she saves ${step} more than the week before. How much does she save in week ${week}?`,
        `تدّخر سارة ${start} في الأسبوع 1، وفي كل أسبوع تدّخر ${step} أكثر من الأسبوع السابق. كم تدّخر في الأسبوع ${week}؟`,
      ),
      value: v,
      extra: { integerOnly: true },
      errors: ne(v, [[start + week * step, 'off-by-one'], [week * step, 'sequence-rule'], [start * week, 'wrong-operation']]),
      hints: H(
        L('This is an arithmetic sequence.', 'هذه متتالية حسابية.'),
        L(`From week 1 to week ${week} there are ${week - 1} jumps.`, `من الأسبوع 1 إلى الأسبوع ${week} هناك ${week - 1} قفزة.`),
        L(`${start} + ${week - 1} × ${step}`, `${start} + ${week - 1} × ${step}`),
      ),
      steps: [S(`${week} − 1 = ${week - 1} jumps`), S(`${start} + ${week - 1} × ${step}`), S(String(v))],
      explanation: L('Count the jumps between week 1 and the week you want, not the number of weeks.', 'عُدّ القفزات بين الأسبوع 1 والأسبوع المطلوب لا عدد الأسابيع.'),
    });
  }),
];

// ───────────────────────── Logarithms & scientific notation ─────────────────────────

/** Digits D scaled by 10^k, written in plain notation (no grouping). */
function plain(D: number, k: number): string {
  if (k >= 0) return String(D) + '0'.repeat(k);
  const s = String(D).padStart(-k + 1, '0');
  const i = s.length + k;
  return `${s.slice(0, i)}.${s.slice(i)}`;
}
/** Plain number with thin-space grouping for display in LaTeX. */
function plainTex(D: number, k: number): string {
  const p = plain(D, k);
  if (p.includes('.')) return p;
  return p.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
}
interface Sci { D: number; nd: number; e: number; m: string }
/** A random number D × 10^k expressed in scientific notation m × 10^e. */
function sci(rng: Rng, lowE: number, highE: number): Sci {
  const nd = rng.int(1, 3);
  const D = nd === 1 ? rng.int(2, 9) : rng.int(Math.pow(10, nd - 1) + 1, Math.pow(10, nd) - 1);
  let e = rng.int(lowE, highE);
  if (e === 0) e = rng.chance(0.5) ? 1 : -1;
  const m = D % 10 === 0 ? String(D / 10) : plain(D, -(nd - 1));
  return { D, nd, e, m };
}
const sciTex = (m: string, e: number): string => `${m} \\times 10^{${e}}`;

const logsScientific: Generator[] = [
  G('to-scientific', 'logs-scientific', 'mcq', [2, 3, 4], (rng, d) => {
    const s = sci(rng, d === 2 ? 3 : -6, d === 2 ? 6 : 9);
    const k = s.e - (s.nd - 1);
    const shown = plainTex(s.D, k);
    const ok = sciTex(s.m, s.e);
    const mTimes10 = plain(s.D, 0);
    return mcqText(rng, {
      prompt: L('Write this number in scientific notation.', 'اكتب هذا العدد بالصيغة العلمية.'),
      display: shown,
      correct: S(mt(ok)),
      wrongs: [
        { label: S(mt(sciTex(s.m, s.e + 1))), pid: 'sci-exponent' },
        { label: S(mt(sciTex(s.m, s.e - 1))), pid: 'sci-exponent' },
        { label: S(mt(sciTex(mTimes10, k))), pid: 'sci-exponent' },
        { label: S(mt(sciTex(s.m, -s.e))), pid: 'sci-exponent' },
      ],
      hints: H(
        L('Scientific notation is a number from 1 up to (but not including) 10, times a power of 10.', 'الصيغة العلمية هي عدد من 1 إلى أقل من 10 مضروب في قوة للعدد 10.'),
        L('Count how many places the decimal point has to move.', 'عُدّ عدد المنازل التي تُنقل بها الفاصلة العشرية.'),
        L(s.e > 0 ? 'A big number has a positive exponent.' : 'A number smaller than 1 has a negative exponent.', s.e > 0 ? 'العدد الكبير أسّه موجب.' : 'العدد الأصغر من 1 أسّه سالب.'),
      ),
      steps: [L(`Move the point to get ${s.m}`, `انقل الفاصلة لتحصل على ${s.m}`), L(`The point moved ${Math.abs(s.e)} places`, `انتقلت الفاصلة ${Math.abs(s.e)} منازل`), S(mt(ok))],
      explanation: L('The exponent counts the moves of the decimal point: positive for big numbers, negative for small ones.', 'يعدّ الأسّ انتقالات الفاصلة العشرية: موجب للأعداد الكبيرة وسالب للصغيرة.'),
    });
  }),

  G('exponent-blank', 'logs-scientific', 'fill-blank', [2, 3, 4], (rng, d) => {
    const s = sci(rng, d === 2 ? 2 : -6, d === 2 ? 6 : 8);
    const k = s.e - (s.nd - 1);
    return typed({
      prompt: L('Find the missing exponent.', 'أوجد الأسّ الناقص.'),
      display: `${plainTex(s.D, k)} = ${s.m} \\times 10^{\\square}`,
      value: s.e,
      extra: { integerOnly: true },
      errors: ne(s.e, [[s.e + 1, 'sci-exponent'], [s.e - 1, 'sci-exponent'], [-s.e, 'sci-exponent']]),
      hints: H(
        L('How far must the decimal point move to get a number between 1 and 10?', 'كم منزلة تنتقل الفاصلة للحصول على عدد بين 1 و 10؟'),
        L(s.e > 0 ? 'Moving the point left means a positive exponent.' : 'Moving the point right means a negative exponent.', s.e > 0 ? 'نقل الفاصلة لليسار يعني أسًّا موجبًا.' : 'نقل الفاصلة لليمين يعني أسًّا سالبًا.'),
        L(`${Math.abs(s.e)} places`, `${Math.abs(s.e)} منازل`),
      ),
      steps: [L(`${s.m} is between 1 and 10`, `${s.m} بين 1 و 10`), L(`The point moved ${Math.abs(s.e)} places`, `انتقلت الفاصلة ${Math.abs(s.e)} منازل`), S(`exponent = ${minus(s.e)}`)],
      explanation: L('The exponent equals the number of places the point moves, with its sign.', 'الأسّ يساوي عدد المنازل التي تنتقلها الفاصلة مع إشارتها.'),
    });
  }),

  G('from-scientific', 'logs-scientific', 'type-answer', [2, 3, 4], (rng, d) => {
    const s = sci(rng, d === 2 ? 2 : -6, d === 2 ? 5 : 8);
    const k = s.e - (s.nd - 1);
    const value = Fraction.parse(plain(s.D, k));
    return typed({
      prompt: L('Write this number in ordinary form.', 'اكتب هذا العدد بالصيغة العادية.'),
      display: sciTex(s.m, s.e),
      value,
      correct: S(plain(s.D, k)),
      errors: ne(value, [[Fraction.parse(plain(s.D, k + 1)), 'sci-exponent'], [Fraction.parse(plain(s.D, k - 1)), 'sci-exponent'], [Fraction.parse(plain(s.D, -k)), 'sci-exponent']]),
      hints: H(
        L('Multiplying by 10ⁿ moves the decimal point n places to the right (left for negative n).', 'الضرب في 10ⁿ ينقل الفاصلة n منازل لليمين (ولليسار إن كان n سالبًا).'),
        L(`Move the point ${Math.abs(s.e)} places ${s.e > 0 ? 'right' : 'left'}.`, `انقل الفاصلة ${Math.abs(s.e)} منازل ${s.e > 0 ? 'لليمين' : 'لليسار'}.`),
        L('Fill empty places with zeros.', 'املأ المنازل الفارغة بأصفار.'),
      ),
      steps: [L(`Start with ${s.m}`, `ابدأ بـ ${s.m}`), L(`Move the point ${Math.abs(s.e)} places ${s.e > 0 ? 'right' : 'left'}`, `انقل الفاصلة ${Math.abs(s.e)} منازل ${s.e > 0 ? 'لليمين' : 'لليسار'}`), S(plain(s.D, k))],
      explanation: L('A positive exponent makes the number bigger; a negative exponent makes it smaller than 1.', 'الأسّ الموجب يكبّر العدد والأسّ السالب يجعله أصغر من 1.'),
    });
  }),

  G('compare-sci', 'logs-scientific', 'compare', [2, 3, 4], (rng, d) => {
    const m1 = rng.int(11, 99) / 10;
    let m2 = rng.int(11, 99) / 10;
    if (m2 === m1) m2 = m1 + 0.1;
    const e1 = rng.int(d === 2 ? 2 : -4, 6);
    let e2 = d === 2 ? e1 + 1 : e1 + (rng.chance(0.5) ? 1 : -1) * rng.int(1, 2);
    if (e2 === e1) e2 = e1 + 1;
    const toFr = (m: number, e: number) => Fraction.parse(plain(Math.round(m * 10), e - 1));
    const a = toFr(m1, e1);
    const b = toFr(m2, e2);
    return compareBody({
      prompt: L('Compare the two numbers.', 'قارن بين العددين.'),
      a,
      b,
      aTex: sciTex(String(m1), e1),
      bTex: sciTex(String(m2), e2),
      pids: { lt: 'sci-exponent', eq: 'sci-exponent', gt: 'sci-exponent' },
      hints: H(
        L('Compare the exponents first.', 'قارن الأسّين أولًا.'),
        L('The bigger exponent wins, unless the exponents are equal.', 'الأسّ الأكبر هو الأكبر، إلا إذا تساوى الأسّان.'),
        L(`${e1} and ${e2}`, `${e1} و ${e2}`),
      ),
      steps: [S(`${e1} ${e1 > e2 ? '>' : '<'} ${e2}`), a.gt(b) ? L('So the first number is bigger.', 'فالعدد الأول أكبر.') : L('So the second number is bigger.', 'فالعدد الثاني أكبر.')],
      explanation: L('In scientific notation the exponent decides size first; the front number only breaks ties.', 'في الصيغة العلمية يحسم الأسّ الحجم أولًا، ولا يُنظر إلى العدد الأمامي إلا عند التعادل.'),
    });
  }),

  G('multiply-sci', 'logs-scientific', 'type-answer', [3, 4, 5], (rng, d) => {
    const x = rng.int(2, 4);
    const y = rng.int(2, 4);
    const p = rng.int(2, 3);
    const q = d === 5 ? -rng.int(1, 3) : rng.int(2, 3);
    const prod = x * y;
    const value = Fraction.parse(plain(prod, p + q));
    const wrongMul = Fraction.parse(plain(prod, p * q));
    const wrongSub = Fraction.parse(plain(prod, p - q));
    return typed({
      prompt: L('Work out the product and write it in ordinary form.', 'احسب حاصل الضرب واكتبه بالصيغة العادية.'),
      display: `(${sciTex(String(x), p)}) \\times (${sciTex(String(y), q)})`,
      value,
      correct: S(plain(prod, p + q)),
      errors: ne(value, [[wrongMul, 'exponent-multiply'], [wrongSub, 'sci-exponent']]),
      hints: H(
        L('Multiply the front numbers, and add the exponents of 10.', 'اضرب الأعداد الأمامية واجمع أسّي 10.'),
        L(`${x} × ${y} = ${prod} and ${p} + ${minus(q)} = ${p + q}.`, `${x} × ${y} = ${prod} و ${p} + ${minus(q)} = ${p + q}.`),
        L(`${prod} × 10^${p + q}`, `${prod} × 10^${p + q}`),
      ),
      steps: [S(`${x} × ${y} = ${prod}`), S(`10^${p} × 10^${minus(q)} = 10^${p + q}`), S(plain(prod, p + q))],
      explanation: L('When multiplying powers of the same base you add the exponents; you do not multiply them.', 'عند ضرب قوى لها الأساس نفسه تُجمع الأسس ولا تُضرب.'),
    });
  }),

  G('log-value', 'logs-scientific', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const base = d === 2 ? rng.pick([2, 10]) as number : rng.pick([2, 3, 5, 10]) as number;
    const maxK = base === 10 ? 5 : base === 2 ? 8 : 4;
    const k = d >= 5 ? rng.int(1, maxK) : rng.int(1, Math.min(maxK, d + 1));
    let n = Math.pow(base, k);
    let val = k;
    let display = `\\log_{${base}} ${n}`;
    if (d >= 4 && rng.chance(0.4)) {
      display = `\\log_{${base}} \\frac{1}{${n}}`;
      val = -k;
    } else if (d >= 4 && rng.chance(0.25)) {
      display = `\\log_{${base}} 1`;
      val = 0;
      n = 1;
    }
    return typed({
      prompt: L('Evaluate.', 'احسب القيمة.'),
      display,
      value: val,
      extra: { integerOnly: true },
      errors: ne(val, [[n, 'log-meaning'], [base * k, 'log-meaning'], [-val, 'sign-error'], [base, 'log-meaning']]),
      hints: H(
        L('A logarithm asks: what power of the base gives this number?', 'اللوغاريتم يسأل: ما القوة التي نرفع إليها الأساس للحصول على هذا العدد؟'),
        L(`Ask yourself: ${base} to what power makes ${val >= 0 ? n : `1/${n}`}?`, `اسأل نفسك: ${base} مرفوعًا إلى أي قوة يعطي ${val >= 0 ? n : `1/${n}`}؟`),
        L(`${base}^${minus(val)}`, `${base}^${minus(val)}`),
      ),
      steps: [S(`${base}^? = ${val >= 0 ? n : `1/${n}`}`), S(`${base}^${minus(val)} = ${val >= 0 ? n : `1/${n}`}`), S(`log = ${minus(val)}`)],
      explanation: L('The logarithm is the exponent. log_b(N) = k means b^k = N.', 'اللوغاريتم هو الأسّ. log_b(N) = k يعني b^k = N.'),
    });
  }),

  G('log-to-power', 'logs-scientific', 'select-formula', [2, 3, 4], (rng) => {
    const b = rng.pick([2, 3, 4, 5, 10]) as number;
    const k = rng.int(2, 4);
    const n = Math.pow(b, k);
    return mcqText(rng, {
      prompt: L(`Which equation says the same thing as log_${b} ${n} = ${k}?`, `أي معادلة تعبّر عن log_${b} ${n} = ${k}؟`),
      correct: S(mt(`${b}^{${k}} = ${n}`)),
      wrongs: [
        { label: S(mt(`${k}^{${b}} = ${n}`)), pid: 'log-meaning' },
        { label: S(mt(`${b}^{${n}} = ${k}`)), pid: 'log-meaning' },
        { label: S(mt(`${n}^{${k}} = ${b}`)), pid: 'log-meaning' },
        { label: S(mt(`${b} \\times ${k} = ${n}`)), pid: 'log-meaning' },
      ],
      hints: H(
        L('log_b(N) = k means "b to the power k equals N".', 'log_b(N) = k تعني "b مرفوعًا للقوة k يساوي N".'),
        L(`The base is ${b}, the answer of the log is ${k}.`, `الأساس ${b} وناتج اللوغاريتم ${k}.`),
        L('The base stays the base; the log is the exponent.', 'يبقى الأساس أساسًا ويصبح اللوغاريتم هو الأسّ.'),
      ),
      steps: [S(`log_${b} ${n} = ${k}`), S(`${b}^${k} = ${n}`)],
      explanation: L('Logarithms and exponents are two ways to say the same relationship.', 'اللوغاريتمات والأسس طريقتان للتعبير عن العلاقة نفسها.'),
    });
  }),

  G('log-rules', 'logs-scientific', 'type-answer', [3, 4, 5], (rng, d) => {
    const pairs: [number, number, number][] = [[2, 5, 1], [4, 25, 2], [5, 20, 2], [2, 500, 3], [25, 40, 3], [8, 125, 3], [20, 50, 3], [4, 250, 3]];
    const [x, y, k] = rng.pick(pairs) as [number, number, number];
    const sum = d < 4 || rng.chance(0.5);
    if (sum) {
      return typed({
        prompt: L('Evaluate.', 'احسب القيمة.'),
        display: `\\log_{10} ${x} + \\log_{10} ${y}`,
        value: k,
        extra: { integerOnly: true },
        errors: ne(k, [[x + y, 'log-meaning'], [x * y, 'log-meaning']]),
        hints: H(
          L('log a + log b = log (a × b).', 'log a + log b = log (a × b).'),
          L(`${x} × ${y} = ${x * y}`, `${x} × ${y} = ${x * y}`),
          L(`log₁₀ ${x * y} is the power of 10 that gives ${x * y}.`, `log₁₀ ${x * y} هو القوة التي ترفع 10 إليها لتعطي ${x * y}.`),
        ),
        steps: [S(`log ${x} + log ${y} = log ${x * y}`), S(`10^${k} = ${x * y}`), S(`= ${k}`)],
        explanation: L('Adding logarithms with the same base corresponds to multiplying the numbers.', 'جمع لوغاريتمات لها الأساس نفسه يقابل ضرب الأعداد.'),
      });
    }
    const c = rng.pick([2, 3, 4, 5, 6, 7, 8, 25]) as number;
    const e = rng.int(1, d >= 5 ? 4 : 3);
    const big = c * 10 ** e;
    return typed({
      prompt: L('Evaluate.', 'احسب القيمة.'),
      display: `\\log_{10} ${big} - \\log_{10} ${c}`,
      value: e,
      extra: { integerOnly: true },
      errors: ne(e, [[big - c, 'log-meaning'], [big / c, 'log-meaning']]),
      hints: H(L('log a − log b = log (a ÷ b).', 'log a − log b = log (a ÷ b).'), L(`${big} ÷ ${c} = ${10 ** e}`, `${big} ÷ ${c} = ${10 ** e}`), L(`What power of 10 is ${10 ** e}?`, `ما قوة 10 التي تعطي ${10 ** e}؟`)),
      steps: [S(`log ${big} − log ${c} = log ${10 ** e}`), S(`10^${e} = ${10 ** e}`), S(`= ${e}`)],
      explanation: L('Subtracting logarithms corresponds to dividing the numbers.', 'طرح اللوغاريتمات يقابل قسمة الأعداد.'),
    });
  }),

  G('log-true-false', 'logs-scientific', 'true-false', [2, 3, 4], (rng) => {
    const b = rng.pick([2, 3, 5, 10]) as number;
    const k = rng.int(2, 4);
    const x = rng.int(2, 9);
    const y = rng.int(2, 9);
    const kind = rng.int(0, 3);
    const truth = rng.chance(0.5);
    let display: string;
    let ok: boolean;
    if (kind === 0) {
      display = `\\log_{${b}} ${b} = ${truth ? 1 : 0}`;
      ok = truth;
    } else if (kind === 1) {
      display = `\\log_{${b}} ${Math.pow(b, k)} = ${truth ? k : k + 1}`;
      ok = truth;
    } else if (kind === 2) {
      display = truth ? `\\log_{${b}} ${x * y} = \\log_{${b}} ${x} + \\log_{${b}} ${y}` : `\\log_{${b}} (${x} + ${y}) = \\log_{${b}} ${x} + \\log_{${b}} ${y}`;
      ok = truth;
    } else {
      display = `\\log_{${b}} 1 = ${truth ? 0 : 1}`;
      ok = truth;
    }
    return tfBody({
      prompt: L('True or false?', 'صحيح أم خطأ؟'),
      display,
      truth: ok,
      pid: 'log-meaning',
      hints: H(L('Rewrite the log as a power.', 'أعد كتابة اللوغاريتم على صورة قوة.'), L('Remember b¹ = b and b⁰ = 1.', 'تذكّر أن b¹ = b و b⁰ = 1.'), L('log of a product is the sum of the logs, but log of a sum is not.', 'لوغاريتم الضرب هو مجموع اللوغاريتمات، أما لوغاريتم الجمع فليس كذلك.')),
      steps: [S(display.replace(/\\log_\{(\d+)\}/g, 'log₍$1₎').replace(/\\/g, ''))],
      explanation: L('Logs turn multiplication into addition, but they do not split sums.', 'اللوغاريتمات تحوّل الضرب إلى جمع لكنها لا تفكّك الجمع.'),
    });
  }),

  G('doubling', 'logs-scientific', 'word-problem', [3, 4, 5], (rng, d) => {
    const start = rng.pick([1, 2, 3, 5, 10]) as number;
    const k = rng.int(3, d + 5);
    const target = start * Math.pow(2, k);
    return typed({
      prompt: L(
        `A colony of bacteria doubles every hour. It starts with ${start} and reaches ${target}. How many hours did that take?`,
        `تتضاعف مستعمرة بكتيريا كل ساعة. بدأت بـ ${start} ووصلت إلى ${target}. كم ساعة استغرق ذلك؟`,
      ),
      value: k,
      extra: { integerOnly: true },
      suffix: 'h',
      correct: L(`${k} hours`, `${k} ساعات`),
      errors: ne(k, [[target / start, 'log-meaning'], [k + 1, 'off-by-one'], [k - 1, 'off-by-one']]),
      hints: H(
        L(`After t hours there are ${start} × 2ᵗ bacteria.`, `بعد t ساعة يكون العدد ${start} × 2ᵗ.`),
        L(`Divide by the start: 2ᵗ = ${target / start}.`, `اقسم على العدد الابتدائي: 2ᵗ = ${target / start}.`),
        L(`What power of 2 is ${target / start}?`, `ما قوة العدد 2 التي تعطي ${target / start}؟`),
      ),
      steps: [S(`${start} × 2^t = ${target}`), S(`2^t = ${target / start}`), S(`t = log₂ ${target / start} = ${k}`)],
      explanation: L('Asking "how many doublings?" is exactly what a base-2 logarithm answers.', 'سؤال "كم مرة تضاعف؟" هو ما يجيب عنه اللوغاريتم ذو الأساس 2.'),
    });
  }),

  G('power-blank', 'logs-scientific', 'fill-blank', [1, 2, 3], (rng, d) => {
    const base = d === 1 ? 10 : (rng.pick([2, 3, 10]) as number);
    const k = rng.int(1, base === 10 ? 5 : 5);
    const neg = d === 3 && base === 10 && rng.chance(0.5);
    const exp = neg ? -k : k;
    const shown = neg ? plain(1, -k) : String(Math.pow(base, k));
    return typed({
      prompt: L('Find the missing exponent.', 'أوجد الأسّ الناقص.'),
      display: `${base}^{\\square} = ${neg ? shown : plainTex(Math.pow(base, k), 0)}`,
      value: exp,
      extra: { integerOnly: true },
      errors: ne(exp, [[Math.pow(base, k), 'log-meaning'], [-exp, 'sci-exponent'], [k + 1, 'sci-exponent'], [k - 1, 'sci-exponent']]),
      hints: H(
        L(`Multiply ${base} by itself until you reach the number.`, `اضرب ${base} في نفسه حتى تصل إلى العدد.`),
        L(neg ? 'A negative exponent gives a number smaller than 1.' : `Count how many ${base}s you multiplied.`, neg ? 'الأسّ السالب يعطي عددًا أصغر من 1.' : `عُدّ كم مرة استعملت ${base}.`),
        L(`${base}^${minus(exp)}`, `${base}^${minus(exp)}`),
      ),
      steps: [S(`${base}^${minus(exp)} = ${neg ? shown : Math.pow(base, k)}`), S(`exponent = ${minus(exp)}`)],
      explanation: L('The exponent counts how many times the base is multiplied by itself.', 'الأسّ يعدّ كم مرة يُضرب الأساس في نفسه.'),
    });
  }),
];

export const L7_GENERATORS: Generator[] = [...quadratics, ...systems, ...statistics, ...probability, ...trigonometry, ...sequences, ...logsScientific];
