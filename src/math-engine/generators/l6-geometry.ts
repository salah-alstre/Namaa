import type { Generator, L10n } from '@/types';
import { Fraction } from '../fraction';
import { G, listBody, matchBody, mcqNum, mcqText, showDec, tfBody, typed } from '../build';
import { H, L, cand, differ, same } from '../kit';

const F = Fraction.of;
const S = same;
const mt = (s: string) => `$${s}$`;
const deg = (n: number) => mt(`${n}^\\circ`);

/** Drop likely-error entries equal to the correct value, and duplicates. */
/** Exact fraction from an integer or a short decimal such as 0.03. */
const toF = (x: number | Fraction): Fraction => (typeof x !== 'number' ? x : Number.isInteger(x) ? F(x) : Fraction.parse(String(Number(x.toFixed(8)))));
const ne = (v: number | Fraction, list: [number | Fraction, string][]): [number | Fraction, string][] => {
  const vf = toF(v);
  const seen: Fraction[] = [vf];
  const out: [number | Fraction, string][] = [];
  for (const [x, pid] of list) {
    const xf = toF(x);
    if (seen.some((s) => s.eq(xf))) continue;
    seen.push(xf);
    out.push([x, pid]);
  }
  return out;
};
/** Answer text with a decimal value and a unit. */
const ans = (v: Fraction, unit = ''): L10n => S(`${showDec(v)}${unit ? ` ${unit}` : ''}`);
const num = (twice: number): string => String(twice / 2);
const signedN = (n: number): string => (n < 0 ? `−${-n}` : String(n));
const pt = (x: number, y: number): string => `(${x},\\ ${y})`;

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
];
/** A Pythagorean triple scaled so the largest side stays reasonable for the difficulty. */
function triple(rng: { int(a: number, b: number): number; pick<T>(a: readonly T[]): T }, d: number): [number, number, number] {
  const base = d <= 2 ? (TRIPLES.slice(0, 2) as [number, number, number][]) : d === 3 ? TRIPLES.slice(0, 4) : TRIPLES;
  const [a, b, c] = rng.pick(base);
  const k = d <= 2 ? 1 : d === 3 ? rng.int(1, 2) : rng.int(1, 3);
  const [x, y] = rng.int(0, 1) === 0 ? [a * k, b * k] : [b * k, a * k];
  return [x, y, c * k];
}

// ───────────────────────── Angles ─────────────────────────

const angles: Generator[] = [
  G('complement', 'angles', 'type-answer', [1, 2, 3], (rng, d) => {
    const sup = rng.chance(0.5);
    const total = sup ? 180 : 90;
    const step = d === 1 ? 10 : d === 2 ? 5 : 1;
    const a = rng.int(1, Math.floor((total - 1) / step)) * step;
    const v = total - a;
    return typed({
      prompt: L(
        `What is the ${sup ? 'supplement' : 'complement'} of ${deg(a)}?`,
        `ما قياس الزاوية ${sup ? 'المكمّلة (التي تجمعها مع الزاوية 180°)' : 'المتمّمة (التي تجمعها مع الزاوية 90°)'} للزاوية ${deg(a)}؟`,
      ),
      value: v,
      suffix: '°',
      extra: { integerOnly: true },
      errors: ne(v, [[(sup ? 90 : 180) - a, 'complement-supplement'], [a, 'off-by-one'], [total + a, 'sign-error']]),
      hints: H(
        L(sup ? 'Supplementary angles add up to 180°.' : 'Complementary angles add up to 90°.', sup ? 'الزاويتان المتكاملتان مجموعهما 180°.' : 'الزاويتان المتتامّتان مجموعهما 90°.'),
        L(`Subtract the angle from ${total}.`, `اطرح الزاوية من ${total}.`),
        L(`${total} − ${a} = ?`, `${total} − ${a} = ؟`),
      ),
      steps: [L(`${total} − ${a} = ${v}`, `${total} − ${a} = ${v}`)],
      explanation: L(
        `Two angles that make ${total}° together are ${sup ? 'supplementary' : 'complementary'}, so the other angle is ${total}° minus the one you know.`,
        `إذا كان مجموع زاويتين ${total}° فالزاوية الأخرى تساوي ${total}° ناقص الزاوية المعلومة.`,
      ),
      correct: S(`${v}°`),
    });
  }),

  G('triangle-angle', 'angles', 'type-answer', [1, 2, 3], (rng, d) => {
    const step = d === 1 ? 10 : d === 2 ? 5 : 1;
    const a = rng.int(Math.ceil(20 / step), Math.floor(100 / step)) * step;
    const maxB = Math.floor((170 - a) / step) * step;
    const lowB = Math.ceil(20 / step) * step;
    if (maxB < lowB) throw new RangeError('no room');
    const b = rng.int(lowB / step, maxB / step) * step;
    const c = 180 - a - b;
    return typed({
      prompt: L(`Two angles of a triangle are ${deg(a)} and ${deg(b)}. Find the third angle.`, `زاويتان في مثلث قياسهما ${deg(a)} و${deg(b)}. أوجد الزاوية الثالثة.`),
      value: c,
      suffix: '°',
      extra: { integerOnly: true },
      errors: ne(c, [[360 - a - b, 'triangle-sum'], [90 - a - b, 'complement-supplement'], [a + b, 'triangle-sum']]),
      hints: H(
        L('The three angles of a triangle add up to 180°.', 'مجموع زوايا المثلث الثلاث 180°.'),
        L('Add the two known angles, then subtract from 180.', 'اجمع الزاويتين المعلومتين ثم اطرح الناتج من 180.'),
        L(`${a} + ${b} = ${a + b}, so the third is 180 − ${a + b}.`, `${a} + ${b} = ${a + b}، فالثالثة 180 − ${a + b}.`),
      ),
      steps: [S(`${a} + ${b} = ${a + b}`), S(`180 − ${a + b} = ${c}`)],
      explanation: L('Angles in any triangle always total 180°.', 'مجموع زوايا أي مثلث يساوي 180° دائمًا.'),
      correct: S(`${c}°`),
    });
  }),

  G('isosceles', 'angles', 'type-answer', [3, 4, 5], (rng, d) => {
    if (d <= 4) {
      const apex = rng.int(5, 80) * 2;
      const base = (180 - apex) / 2;
      return typed({
        prompt: L(`An isosceles triangle has a top angle of ${deg(apex)}. How big is each base angle?`, `مثلث متساوي الساقين زاوية رأسه ${deg(apex)}. كم قياس كل زاوية من زاويتي القاعدة؟`),
        value: base,
        suffix: '°',
        extra: { integerOnly: true },
        errors: ne(base, [[180 - apex, 'triangle-half'], [apex / 2, 'triangle-half'], [90 - apex, 'complement-supplement']]),
        hints: H(
          L('In an isosceles triangle the two base angles are equal.', 'في المثلث المتساوي الساقين زاويتا القاعدة متساويتان.'),
          L('Subtract the top angle from 180, then share the rest equally.', 'اطرح زاوية الرأس من 180 ثم قسّم الباقي بالتساوي.'),
          L(`(180 − ${apex}) ÷ 2`, `(180 − ${apex}) ÷ 2`),
        ),
        steps: [S(`180 − ${apex} = ${180 - apex}`), S(`${180 - apex} ÷ 2 = ${base}`)],
        explanation: L('The base angles share what is left after the top angle, so divide by 2.', 'تتقاسم زاويتا القاعدة ما تبقّى بعد زاوية الرأس، فاقسم على 2.'),
        correct: S(`${base}°`),
      });
    }
    const base = rng.int(25, 80);
    const apex = 180 - 2 * base;
    return typed({
      prompt: L(`An isosceles triangle has two base angles of ${deg(base)}. Find the top angle.`, `مثلث متساوي الساقين زاويتا قاعدته ${deg(base)} لكل منهما. أوجد زاوية الرأس.`),
      value: apex,
      suffix: '°',
      extra: { integerOnly: true },
      errors: ne(apex, [[180 - base, 'triangle-half'], [90 - base, 'complement-supplement'], [180 - base - 1, 'off-by-one']]),
      hints: H(
        L('There are two equal base angles — count both.', 'هناك زاويتان متساويتان في القاعدة — احسب الاثنتين.'),
        L(`Two base angles make ${2 * base}°.`, `زاويتا القاعدة معًا ${2 * base}°.`),
        L(`180 − ${2 * base}`, `180 − ${2 * base}`),
      ),
      steps: [S(`${base} + ${base} = ${2 * base}`), S(`180 − ${2 * base} = ${apex}`)],
      explanation: L('Add both equal base angles first, then subtract from 180.', 'اجمع زاويتي القاعدة المتساويتين أولًا ثم اطرح من 180.'),
      correct: S(`${apex}°`),
    });
  }),

  G('exterior', 'angles', 'type-answer', [4, 5], (rng, d) => {
    const a = rng.int(25, 75);
    const b = rng.int(25, 75);
    const e = a + b;
    const known = rng.chance(0.5) ? a : b;
    const other = e - known;
    void d;
    return typed({
      prompt: L(
        `The exterior angle of a triangle is ${deg(e)}. One of the two far-away interior angles is ${deg(known)}. What is the other?`,
        `الزاوية الخارجية لمثلث قياسها ${deg(e)}، وإحدى الزاويتين الداخليتين البعيدتين عنها ${deg(known)}. ما قياس الأخرى؟`,
      ),
      value: other,
      suffix: '°',
      extra: { integerOnly: true },
      errors: ne(other, [[180 - e - known, 'triangle-sum'], [180 - e, 'complement-supplement'], [e + known, 'sign-error']]),
      hints: H(
        L('An exterior angle equals the sum of the two opposite interior angles.', 'الزاوية الخارجية تساوي مجموع الزاويتين الداخليتين البعيدتين عنها.'),
        L('So the unknown angle is the exterior angle minus the known one.', 'إذن المجهولة = الخارجية − المعلومة.'),
        L(`${e} − ${known}`, `${e} − ${known}`),
      ),
      steps: [S(`${e} − ${known} = ${other}`)],
      explanation: L('Exterior angle = sum of the two remote interior angles.', 'الزاوية الخارجية = مجموع الزاويتين الداخليتين البعيدتين.'),
      correct: S(`${other}°`),
    });
  }),

  G('angle-types', 'angles', 'matching', [1, 2], (rng) => {
    const kinds: { name: L10n; make: () => number }[] = [
      { name: L('acute', 'حادّة'), make: () => rng.int(10, 85) },
      { name: L('right', 'قائمة'), make: () => 90 },
      { name: L('obtuse', 'منفرجة'), make: () => rng.int(95, 170) },
      { name: L('straight', 'مستقيمة'), make: () => 180 },
    ];
    const picked = rng.sample(kinds, 3);
    const pairs = picked.map((k) => ({ left: S(deg(k.make())), right: k.name }));
    return matchBody(rng, {
      prompt: L('Match each angle to its type.', 'صِل كل زاوية بنوعها.'),
      pairs,
      hints: H(
        L('Acute is less than 90°, obtuse is between 90° and 180°.', 'الحادّة أقل من 90° والمنفرجة بين 90° و180°.'),
        L('A right angle is exactly 90°, a straight angle exactly 180°.', 'القائمة 90° تمامًا والمستقيمة 180° تمامًا.'),
        L('Compare each angle with 90°.', 'قارن كل زاوية مع 90°.'),
      ),
      steps: pairs.map((p) => L(`${p.left.en} → ${p.right.en}`, `${p.left.ar} ← ${p.right.ar}`)),
      explanation: L('Angle types are decided by comparing with 90° and 180°.', 'يتحدّد نوع الزاوية بمقارنتها مع 90° و180°.'),
    });
  }),

  G('angle-claim', 'angles', 'true-false', [2, 3, 4], (rng, d) => {
    const sup = rng.chance(0.5);
    const total = sup ? 180 : 90;
    const a = rng.int(2, Math.floor((total - 10) / (d === 2 ? 5 : 1))) * (d === 2 ? 5 : 1);
    const truth = rng.chance(0.5);
    const delta = rng.pick([-10, -5, 5, 10]);
    const b = truth ? total - a : total - a + delta;
    if (b <= 0) throw new RangeError('negative');
    return tfBody({
      prompt: L(
        `True or false: angles of ${deg(a)} and ${deg(b)} are ${sup ? 'supplementary' : 'complementary'}.`,
        `صحيح أم خطأ: الزاويتان ${deg(a)} و${deg(b)} ${sup ? 'متكاملتان (مجموعهما 180°)' : 'متتامّتان (مجموعهما 90°)'}.`,
      ),
      truth,
      pid: 'complement-supplement',
      hints: H(
        L(sup ? 'Supplementary means the angles add up to 180°.' : 'Complementary means the angles add up to 90°.', sup ? 'متكاملتان تعني أن المجموع 180°.' : 'متتامّتان تعني أن المجموع 90°.'),
        L('Add the two angles.', 'اجمع الزاويتين.'),
        L(`${a} + ${b} = ${a + b}`, `${a} + ${b} = ${a + b}`),
      ),
      steps: [S(`${a} + ${b} = ${a + b}`), L(`${a + b} ${truth ? '=' : '≠'} ${total}`, `${a + b} ${truth ? '=' : '≠'} ${total}`)],
      explanation: L(`The pair is ${sup ? 'supplementary' : 'complementary'} only when the total is exactly ${total}°.`, `الزاويتان كذلك فقط إذا كان المجموع ${total}° تمامًا.`),
    });
  }),

  G('straight-line', 'angles', 'word-problem', [3, 4, 5], (rng, d) => {
    const parts = rng.pick(d === 3 ? [3, 4, 5, 6] : [3, 4, 5, 6, 9, 10, 12]);
    const k = parts - 1;
    const small = 180 / parts;
    return typed({
      prompt: L(
        `Two angles sit side by side on a straight line. One is ${k} times as big as the other. How big is the smaller angle?`,
        `زاويتان متجاورتان على مستقيم، إحداهما ${k} أمثال الأخرى. كم قياس الزاوية الأصغر؟`,
      ),
      value: small,
      suffix: '°',
      extra: { integerOnly: true },
      errors: ne(small, [[180 / k, 'wrong-operation'], [small * k, 'off-by-one'], [180 - small, 'complement-supplement']]),
      hints: H(
        L('Angles on a straight line add up to 180°.', 'مجموع الزوايا على مستقيم 180°.'),
        L(`If the small angle is one part, the big one is ${k} parts — ${parts} parts in all.`, `إذا كانت الصغرى جزءًا واحدًا فالكبرى ${k} أجزاء — أي ${parts} أجزاء في المجموع.`),
        L(`180 ÷ ${parts}`, `180 ÷ ${parts}`),
      ),
      steps: [S(`1 + ${k} = ${parts}`), S(`180 ÷ ${parts} = ${small}`)],
      explanation: L('Count the equal parts, then share 180° between them.', 'عدّ الأجزاء المتساوية ثم وزّع 180° عليها.'),
      correct: S(`${small}°`),
    });
  }),

  G('sum-fact', 'angles', 'fill-blank', [1, 2], (rng, d) => {
    const facts: { en: string; ar: string; v: number; errs: [number, string][] }[] = [
      { en: 'The angles of a triangle add up to', ar: 'مجموع زوايا المثلث', v: 180, errs: [[360, 'triangle-sum'], [90, 'complement-supplement']] },
      { en: 'Angles on a straight line add up to', ar: 'مجموع الزوايا على مستقيم', v: 180, errs: [[360, 'complement-supplement'], [90, 'complement-supplement']] },
      { en: 'Angles around a point add up to', ar: 'مجموع الزوايا حول نقطة', v: 360, errs: [[180, 'triangle-sum']] },
      { en: 'The angles of a quadrilateral add up to', ar: 'مجموع زوايا الشكل الرباعي', v: 360, errs: [[180, 'triangle-sum']] },
      { en: 'A right angle measures', ar: 'قياس الزاوية القائمة', v: 90, errs: [[180, 'complement-supplement']] },
    ];
    const f = rng.pick(d === 1 ? facts.slice(0, 3) : facts);
    return typed({
      prompt: L(`Fill in the blank: ${f.en} ___ degrees.`, `أكمل: ${f.ar} ___ درجة.`),
      display: '\\square^\\circ',
      value: f.v,
      extra: { integerOnly: true },
      errors: f.errs,
      hints: H(
        L('Think of a full turn (360°) and a half turn (180°).', 'تذكّر الدورة الكاملة (360°) ونصف الدورة (180°).'),
        L('A quarter turn is a right angle.', 'ربع الدورة زاوية قائمة.'),
        L(`The answer is ${f.v}.`, `الجواب ${f.v}.`),
      ),
      steps: [S(`${f.v}°`)],
      explanation: L('These angle facts are worth remembering — they unlock most geometry problems.', 'هذه الحقائق تستحق الحفظ — فهي مفتاح أغلب مسائل الهندسة.'),
    });
  }),
];

// ───────────────────────── Perimeter ─────────────────────────

const perimeter: Generator[] = [
  G('rectangle', 'perimeter', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const lw = d <= 2 ? [2, d === 1 ? 12 : 30] : [2, 40];
    let l2 = rng.int(lw[0] as number, lw[1] as number) * (d === 4 ? 2 : 2);
    let w2 = rng.int(lw[0] as number, lw[1] as number) * 2;
    if (d === 4) {
      l2 += 1;
      w2 += rng.pick([0, 1]);
    }
    if (l2 === w2) w2 += 2;
    const l = l2 / 2;
    const w = w2 / 2;
    const p = F(l2 + w2, 1);
    return typed({
      prompt: L(`A rectangle is ${num(l2)} cm long and ${num(w2)} cm wide. What is its perimeter?`, `مستطيل طوله ${num(l2)} سم وعرضه ${num(w2)} سم. ما محيطه؟`),
      value: p,
      suffix: 'cm',
      errors: ne(p, [[F(l2 * w2, 4), 'area-perimeter'], [F(l2 + w2, 2), 'formula-mixup'], [F(2 * l2 + w2, 2), 'formula-mixup']]),
      hints: H(
        L('Perimeter is the distance all the way around.', 'المحيط هو المسافة حول الشكل كله.'),
        L('A rectangle has two lengths and two widths.', 'للمستطيل طولان وعرضان.'),
        L(`2 × (${l} + ${w})`, `2 × (${l} + ${w})`),
      ),
      steps: [S(`${l} + ${w} = ${l + w}`), S(`2 × ${l + w} = ${2 * (l + w)}`)],
      explanation: L('P = 2 × (length + width): add one length and one width, then double.', 'المحيط = 2 × (الطول + العرض): اجمع طولًا وعرضًا ثم ضاعف.'),
      correct: ans(p, 'cm'),
    });
  }),

  G('missing-side', 'perimeter', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const l = rng.int(4, d <= 3 ? 20 : 40);
    const w = differ(rng, 2, l + 8, l);
    const p = 2 * (l + w);
    const askWidth = rng.chance(0.5);
    const known = askWidth ? l : w;
    const want = askWidth ? w : l;
    return typed({
      prompt: L(
        `A rectangle has a perimeter of ${p} cm and one side of ${known} cm. How long is the neighbouring side?`,
        `محيط مستطيل ${p} سم وأحد أضلاعه ${known} سم. كم طول الضلع المجاور له؟`,
      ),
      value: want,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: ne(want, [[p - known, 'formula-mixup'], [p / 2, 'formula-mixup'], [p / 2 + known, 'sign-error']]),
      hints: H(
        L('Half of the perimeter is one length plus one width.', 'نصف المحيط يساوي طولًا زائدًا عرضًا.'),
        L(`Half of ${p} is ${p / 2}.`, `نصف ${p} هو ${p / 2}.`),
        L(`${p / 2} − ${known}`, `${p / 2} − ${known}`),
      ),
      steps: [S(`${p} ÷ 2 = ${p / 2}`), S(`${p / 2} − ${known} = ${want}`)],
      explanation: L('Halve the perimeter to get length + width, then take away the side you know.', 'نصّف المحيط لتحصل على الطول + العرض ثم اطرح الضلع المعلوم.'),
      correct: S(`${want} cm`),
    });
  }),

  G('regular', 'perimeter', 'type-answer', [1, 2, 3], (rng, d) => {
    const shapes: { en: string; ar: string; n: number }[] = [
      { en: 'square', ar: 'مربع', n: 4 },
      { en: 'equilateral triangle', ar: 'مثلث متساوي الأضلاع', n: 3 },
      { en: 'regular pentagon', ar: 'خماسي منتظم', n: 5 },
      { en: 'regular hexagon', ar: 'سداسي منتظم', n: 6 },
      { en: 'regular octagon', ar: 'ثُماني منتظم', n: 8 },
    ];
    const sh = rng.pick(d === 1 ? shapes.slice(0, 2) : shapes);
    const s = rng.int(2, d === 1 ? 12 : 25);
    const p = sh.n * s;
    return typed({
      prompt: L(`Each side of a ${sh.en} is ${s} cm. What is the perimeter?`, `طول كل ضلع في ${sh.ar} هو ${s} سم. ما المحيط؟`),
      value: p,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: ne(p, [[s * s, 'area-perimeter'], [s + sh.n, 'wrong-operation'], [(sh.n - 1) * s, 'off-by-one']]),
      hints: H(
        L('All the sides are the same length.', 'جميع الأضلاع متساوية في الطول.'),
        L(`Count the sides: ${sh.n}.`, `عدد الأضلاع: ${sh.n}.`),
        L(`${sh.n} × ${s}`, `${sh.n} × ${s}`),
      ),
      steps: [S(`${sh.n} × ${s} = ${p}`)],
      explanation: L('Perimeter of a regular shape = number of sides × side length.', 'محيط الشكل المنتظم = عدد الأضلاع × طول الضلع.'),
      correct: S(`${p} cm`),
    });
  }),

  G('formula', 'perimeter', 'select-formula', [1, 2, 3], (rng) => {
    const shapes: { en: string; ar: string; f: string; wrongs: { f: string; pid: string }[] }[] = [
      { en: 'a rectangle with length l and width w', ar: 'مستطيل طوله l وعرضه w', f: 'P = 2(l + w)', wrongs: [{ f: 'P = lw', pid: 'area-perimeter' }, { f: 'P = l + w', pid: 'formula-mixup' }, { f: 'P = 2lw', pid: 'formula-mixup' }] },
      { en: 'a square with side s', ar: 'مربع طول ضلعه s', f: 'P = 4s', wrongs: [{ f: 'P = s^{2}', pid: 'area-perimeter' }, { f: 'P = 2s', pid: 'formula-mixup' }, { f: 'P = s + 4', pid: 'wrong-operation' }] },
      { en: 'an equilateral triangle with side s', ar: 'مثلث متساوي الأضلاع طول ضلعه s', f: 'P = 3s', wrongs: [{ f: 'P = s^{3}', pid: 'exponent-multiply' }, { f: 'P = 2s', pid: 'formula-mixup' }, { f: 'P = \\tfrac{1}{2}s^{2}', pid: 'area-perimeter' }] },
    ];
    const sh = rng.pick(shapes);
    return mcqText(rng, {
      prompt: L(`Which formula gives the perimeter of ${sh.en}?`, `أي قانون يعطي محيط ${sh.ar}؟`),
      correct: S(mt(sh.f)),
      wrongs: sh.wrongs.map((w) => ({ label: S(mt(w.f)), pid: w.pid })),
      hints: H(
        L('Perimeter adds up the lengths of all the sides.', 'المحيط هو مجموع أطوال الأضلاع جميعها.'),
        L('Count how many sides of each length there are.', 'عدّ كم ضلعًا من كل طول.'),
        L('Squares like s² are areas, not perimeters.', 'المقادير المربّعة مثل s² هي مساحات لا محيطات.'),
      ),
      steps: [L(`Add all the sides: ${sh.f.replace('P = ', 'P = ')}`, `اجمع كل الأضلاع: ${sh.f}`)],
      explanation: L('Perimeter is a length, so it never contains a squared term.', 'المحيط طول، لذا لا يحتوي على حدّ مربّع.'),
    });
  }),

  G('fence', 'perimeter', 'word-problem', [2, 3, 4], (rng, d) => {
    const l = rng.int(5, d === 2 ? 15 : 30);
    const w = differ(rng, 3, 20, l);
    const c = rng.int(2, d === 2 ? 5 : 12);
    const p = 2 * (l + w);
    const total = p * c;
    return typed({
      prompt: L(
        `A rectangular garden is ${l} m by ${w} m. Fencing costs ${c} dollars per metre. How much does it cost to fence the whole garden?`,
        `حديقة مستطيلة أبعادها ${l} م × ${w} م. تكلفة السياج ${c} دولارات للمتر. كم تكلفة تسييج الحديقة كلها؟`,
      ),
      value: total,
      suffix: 'dollars',
      extra: { integerOnly: true },
      errors: ne(total, [[l * w * c, 'area-perimeter'], [(l + w) * c, 'formula-mixup'], [p, 'wrong-operation']]),
      hints: H(
        L('Fencing goes around the edge — that is the perimeter.', 'السياج يمتد حول الحافة — أي المحيط.'),
        L(`Perimeter = 2 × (${l} + ${w}) = ${p} m.`, `المحيط = 2 × (${l} + ${w}) = ${p} م.`),
        L(`Then multiply by ${c} dollars per metre.`, `ثم اضرب في ${c} دولارات للمتر.`),
      ),
      steps: [S(`2 × (${l} + ${w}) = ${p}`), S(`${p} × ${c} = ${total}`)],
      explanation: L('Find the perimeter first, then multiply by the price per metre.', 'أوجد المحيط أولًا ثم اضربه في سعر المتر.'),
      correct: L(`${total} dollars`, `${total} دولارًا`),
    });
  }),

  G('compare', 'perimeter', 'compare', [2, 3, 4], (rng, d) => {
    const s = rng.int(4, d === 2 ? 12 : 25);
    const l = rng.int(2, 2 * s);
    const w = rng.int(1, l);
    const sq = 4 * s;
    const rc = 2 * (l + w);
    const a = F(sq);
    const b = F(rc);
    const rel = a.lt(b) ? '<' : a.gt(b) ? '>' : '=';
    return {
      prompt: L('Compare the two perimeters: the square on the left and the rectangle on the right.', 'قارن بين المحيطين: المربع على اليسار والمستطيل على اليمين.'),
      display: `\\text{square } ${s} \\;\\square\\; \\text{rect } ${l}\\times ${w}`,
      options: [
        { id: 'lt', label: S('<') },
        { id: 'eq', label: S('=') },
        { id: 'gt', label: S('>') },
      ],
      answer: { kind: 'choice', correct: [rel === '<' ? 'lt' : rel === '>' ? 'gt' : 'eq'] },
      likelyErrors: [],
      correctText: S(`${sq} ${rel} ${rc}`),
      hints: H(
        L('Work out each perimeter separately.', 'احسب كل محيط على حدة.'),
        L(`Square: 4 × ${s}. Rectangle: 2 × (${l} + ${w}).`, `المربع: 4 × ${s}. المستطيل: 2 × (${l} + ${w}).`),
        L(`${sq} and ${rc}.`, `${sq} و${rc}.`),
      ),
      steps: [S(`4 × ${s} = ${sq}`), S(`2 × (${l} + ${w}) = ${rc}`), S(`${sq} ${rel} ${rc}`)],
      explanation: L('Compare the finished perimeters, not the sides.', 'قارن المحيطين الناتجين لا الأضلاع.'),
    };
  }),
];

// ───────────────────────── Area ─────────────────────────

const area: Generator[] = [
  G('rectangle', 'area', 'type-answer', [1, 2, 3], (rng, d) => {
    const l = rng.int(2, d === 1 ? 10 : d === 2 ? 20 : 40);
    const w = differ(rng, 2, d === 1 ? 10 : d === 2 ? 20 : 40, l);
    const a = l * w;
    return typed({
      prompt: L(`A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, `مستطيل طوله ${l} سم وعرضه ${w} سم. ما مساحته؟`),
      value: a,
      suffix: 'cm²',
      extra: { integerOnly: true },
      errors: ne(a, [[2 * (l + w), 'area-perimeter'], [l + w, 'wrong-operation']]),
      hints: H(
        L('Area counts the unit squares inside the shape.', 'المساحة هي عدد المربعات الوحدة داخل الشكل.'),
        L('Multiply length by width.', 'اضرب الطول في العرض.'),
        L(`${l} × ${w}`, `${l} × ${w}`),
      ),
      steps: [S(`${l} × ${w} = ${a}`)],
      explanation: L('Area of a rectangle = length × width, measured in square units.', 'مساحة المستطيل = الطول × العرض، وتُقاس بوحدات مربّعة.'),
      correct: S(`${a} cm²`),
    });
  }),

  G('triangle', 'area', 'type-answer', [2, 3, 4], (rng, d) => {
    const b = rng.int(3, d === 2 ? 14 : 30);
    const h = d === 2 ? rng.int(1, 7) * 2 : rng.int(3, 24);
    const v = F(b * h, 2);
    return typed({
      prompt: L(`A triangle has a base of ${b} cm and a height of ${h} cm. What is its area?`, `قاعدة مثلث ${b} سم وارتفاعه ${h} سم. ما مساحته؟`),
      value: v,
      suffix: 'cm²',
      errors: ne(v, [[b * h, 'triangle-half'], [b + h, 'wrong-operation']]),
      hints: H(
        L('A triangle is half of a rectangle with the same base and height.', 'المثلث نصف مستطيل له القاعدة والارتفاع نفساهما.'),
        L('Multiply base by height, then halve.', 'اضرب القاعدة في الارتفاع ثم خذ النصف.'),
        L(`(${b} × ${h}) ÷ 2`, `(${b} × ${h}) ÷ 2`),
      ),
      steps: [S(`${b} × ${h} = ${b * h}`), S(`${b * h} ÷ 2 = ${showDec(v)}`)],
      explanation: L('Area of a triangle = ½ × base × height.', 'مساحة المثلث = ½ × القاعدة × الارتفاع.'),
      correct: ans(v, 'cm²'),
    });
  }),

  G('trapezoid', 'area', 'type-answer', [3, 4, 5], (rng, d) => {
    if (d === 3) {
      const b = rng.int(3, 18);
      const h = rng.int(3, 15);
      const v = b * h;
      return typed({
        prompt: L(`A parallelogram has a base of ${b} cm and a height of ${h} cm. Find its area.`, `متوازي أضلاع قاعدته ${b} سم وارتفاعه ${h} سم. أوجد مساحته.`),
        value: v,
        suffix: 'cm²',
        extra: { integerOnly: true },
        errors: ne(v, [[F(b * h, 2), 'triangle-half'], [b + h, 'wrong-operation']]),
        hints: H(
          L('A parallelogram can be rearranged into a rectangle.', 'يمكن إعادة ترتيب متوازي الأضلاع ليصبح مستطيلًا.'),
          L('Use the perpendicular height, not the slanted side.', 'استخدم الارتفاع العمودي لا الضلع المائل.'),
          L(`${b} × ${h}`, `${b} × ${h}`),
        ),
        steps: [S(`${b} × ${h} = ${v}`)],
        explanation: L('Area of a parallelogram = base × height.', 'مساحة متوازي الأضلاع = القاعدة × الارتفاع.'),
        correct: S(`${v} cm²`),
      });
    }
    const a = rng.int(3, 15);
    const b = differ(rng, 3, 22, a);
    const h = rng.int(2, d === 4 ? 12 : 20);
    const v = F((a + b) * h, 2);
    return typed({
      prompt: L(`A trapezoid has parallel sides of ${a} cm and ${b} cm, and a height of ${h} cm. What is its area?`, `شبه منحرف ضلعاه المتوازيان ${a} سم و${b} سم وارتفاعه ${h} سم. ما مساحته؟`),
      value: v,
      suffix: 'cm²',
      errors: ne(v, [[(a + b) * h, 'triangle-half'], [F(a * b * h, 2), 'formula-mixup'], [a + b + h, 'wrong-operation']]),
      hints: H(
        L('Average the two parallel sides, then multiply by the height.', 'خذ متوسط الضلعين المتوازيين ثم اضربه في الارتفاع.'),
        L(`The average of ${a} and ${b} is ${showDec(F(a + b, 2))}.`, `متوسط ${a} و${b} هو ${showDec(F(a + b, 2))}.`),
        L(`${showDec(F(a + b, 2))} × ${h}`, `${showDec(F(a + b, 2))} × ${h}`),
      ),
      steps: [S(`(${a} + ${b}) ÷ 2 = ${showDec(F(a + b, 2))}`), S(`${showDec(F(a + b, 2))} × ${h} = ${showDec(v)}`)],
      explanation: L('Area of a trapezoid = ½ × (a + b) × h.', 'مساحة شبه المنحرف = ½ × (a + b) × h.'),
      correct: ans(v, 'cm²'),
    });
  }),

  G('compound', 'area', 'word-problem', [3, 4, 5], (rng, d) => {
    const L1 = rng.int(8, d === 3 ? 14 : 24);
    const W1 = rng.int(6, d === 3 ? 12 : 20);
    const l2 = rng.int(2, L1 - 3);
    const w2 = rng.int(2, W1 - 3);
    const big = L1 * W1;
    const small = l2 * w2;
    const v = big - small;
    return typed({
      prompt: L(
        `An L-shaped floor is a ${L1} m by ${W1} m rectangle with a ${l2} m by ${w2} m corner cut out. What is the floor area?`,
        `أرضية على شكل حرف L هي مستطيل ${L1} م × ${W1} م قُطعت منه زاوية ${l2} م × ${w2} م. ما مساحة الأرضية؟`,
      ),
      value: v,
      suffix: 'm²',
      extra: { integerOnly: true },
      errors: ne(v, [[big, 'wrong-operation'], [big + small, 'sign-error'], [small, 'wrong-operation']]),
      hints: H(
        L('Find the big rectangle first, then remove the missing corner.', 'أوجد المستطيل الكبير أولًا ثم أزل الزاوية المقطوعة.'),
        L(`Big: ${L1} × ${W1} = ${big}. Corner: ${l2} × ${w2} = ${small}.`, `الكبير: ${L1} × ${W1} = ${big}. الزاوية: ${l2} × ${w2} = ${small}.`),
        L(`${big} − ${small}`, `${big} − ${small}`),
      ),
      steps: [S(`${L1} × ${W1} = ${big}`), S(`${l2} × ${w2} = ${small}`), S(`${big} − ${small} = ${v}`)],
      explanation: L('Split or subtract: big shape minus the part that is missing.', 'قسّم أو اطرح: الشكل الكبير ناقص الجزء المفقود.'),
      correct: S(`${v} m²`),
    });
  }),

  G('formula', 'area', 'select-formula', [1, 2, 3, 4], (rng) => {
    const shapes: { en: string; ar: string; f: string }[] = [
      { en: 'a rectangle', ar: 'المستطيل', f: 'A = lw' },
      { en: 'a triangle', ar: 'المثلث', f: 'A = \\tfrac{1}{2}bh' },
      { en: 'a parallelogram', ar: 'متوازي الأضلاع', f: 'A = bh' },
      { en: 'a trapezoid', ar: 'شبه المنحرف', f: 'A = \\tfrac{1}{2}(a + b)h' },
      { en: 'a square', ar: 'المربع', f: 'A = s^{2}' },
    ];
    const sh = rng.pick(shapes);
    const others = shapes.filter((s) => s !== sh);
    const wrongs = rng.sample(others, 2).map((o) => ({ label: S(mt(o.f)), pid: o.f === 'A = bh' ? 'triangle-half' : 'formula-mixup' }));
    wrongs.push({ label: S(mt('P = 2(l + w)')), pid: 'area-perimeter' });
    return mcqText(rng, {
      prompt: L(`Which formula gives the area of ${sh.en}?`, `أي قانون يعطي مساحة ${sh.ar}؟`),
      correct: S(mt(sh.f)),
      wrongs,
      hints: H(
        L('Area formulas multiply two lengths together.', 'قوانين المساحة تضرب طولين معًا.'),
        L('Perimeter formulas only add lengths.', 'قوانين المحيط تجمع الأطوال فقط.'),
        L('A triangle and a trapezoid both include a ½.', 'المثلث وشبه المنحرف يحتويان على ½.'),
      ),
      steps: [L(`Area of ${sh.en}: ${sh.f.replace(/\\tfrac\{1\}\{2\}/g, '1/2').replace(/\^\{2\}/g, '²')}`, `مساحة ${sh.ar}: ${sh.f.replace(/\\tfrac\{1\}\{2\}/g, '1/2').replace(/\^\{2\}/g, '²')}`)],
      explanation: L('Match the shape to its formula and check that it multiplies two lengths.', 'طابق الشكل مع قانونه وتأكد أنه يضرب طولين.'),
    });
  }),

  G('missing-dimension', 'area', 'fill-blank', [2, 3, 4], (rng, d) => {
    const w = rng.int(3, d === 2 ? 9 : 16);
    const l = differ(rng, 3, d === 2 ? 12 : 25, w);
    const a = l * w;
    return typed({
      prompt: L(`A rectangle has an area of ${a} cm² and a width of ${w} cm. Fill in the missing length.`, `مساحة مستطيل ${a} سم² وعرضه ${w} سم. أكمل الطول المفقود.`),
      display: `\\square \\times ${w} = ${a}`,
      value: l,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: ne(l, [[a * w, 'inverse-op'], [a - w, 'wrong-operation'], [a + w, 'inverse-op']]),
      hints: H(
        L('Area = length × width, so the length is area ÷ width.', 'المساحة = الطول × العرض، إذن الطول = المساحة ÷ العرض.'),
        L(`Divide ${a} by ${w}.`, `اقسم ${a} على ${w}.`),
        L(`${a} ÷ ${w}`, `${a} ÷ ${w}`),
      ),
      steps: [S(`${a} ÷ ${w} = ${l}`)],
      explanation: L('Undo the multiplication with division.', 'اعكس الضرب بالقسمة.'),
      correct: S(`${l} cm`),
    });
  }),

  G('same-area', 'area', 'true-false', [2, 3, 4], (rng, d) => {
    const pools = d === 2 ? [12, 16, 18, 24] : [24, 30, 36, 48, 60];
    const n = rng.pick(pools);
    const pairs: [number, number][] = [];
    for (let i = 2; i * i <= n; i++) if (n % i === 0) pairs.push([i, n / i]);
    if (pairs.length < 2) throw new RangeError('few pairs');
    const [p1, p2] = rng.sample(pairs, 2) as [[number, number], [number, number]];
    const truth = rng.chance(0.5);
    const second: [number, number] = truth ? p2 : [p2[0] + 1, p2[1]];
    if (!truth && second[0] * second[1] === n) throw new RangeError('same');
    return tfBody({
      prompt: L(
        `True or false: a ${p1[0]} by ${p1[1]} rectangle has the same area as a ${second[0]} by ${second[1]} rectangle.`,
        `صحيح أم خطأ: للمستطيل ${p1[0]} × ${p1[1]} المساحة نفسها للمستطيل ${second[0]} × ${second[1]}.`,
      ),
      truth,
      pid: 'area-perimeter',
      hints: H(
        L('Work out each area.', 'احسب كل مساحة.'),
        L(`${p1[0]} × ${p1[1]} = ${n}.`, `${p1[0]} × ${p1[1]} = ${n}.`),
        L(`${second[0]} × ${second[1]} = ${second[0] * second[1]}.`, `${second[0]} × ${second[1]} = ${second[0] * second[1]}.`),
      ),
      steps: [S(`${p1[0]} × ${p1[1]} = ${n}`), S(`${second[0]} × ${second[1]} = ${second[0] * second[1]}`)],
      explanation: L('Different shapes can have the same area — compare the products, not the sides.', 'قد يتساوى مساحتا شكلين مختلفين — قارن الناتجين لا الأضلاع.'),
    });
  }),
];

// ───────────────────────── Circles ─────────────────────────

const circles: Generator[] = [
  G('radius-diameter', 'circles', 'fill-blank', [1, 2], (rng, d) => {
    const toD = rng.chance(0.5);
    const r = rng.int(2, d === 1 ? 12 : 40);
    return typed({
      prompt: toD ? L(`A circle has a radius of ${r} cm. Fill in its diameter.`, `نصف قطر دائرة ${r} سم. أكمل قطرها.`) : L(`A circle has a diameter of ${2 * r} cm. Fill in its radius.`, `قطر دائرة ${2 * r} سم. أكمل نصف قطرها.`),
      display: toD ? `d = \\square` : `r = \\square`,
      value: toD ? 2 * r : r,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: toD ? [[r / 2 === Math.floor(r / 2) ? r / 2 : F(r, 2), 'radius-diameter'], [r + 2, 'wrong-operation']] : [[4 * r, 'radius-diameter'], [2 * r + 2, 'wrong-operation']],
      hints: H(
        L('The diameter goes right across the circle through the centre.', 'القطر يعبر الدائرة كلها مارًّا بالمركز.'),
        L('It is made of two radii.', 'وهو مكوّن من نصفَي قطر.'),
        L(toD ? 'd = 2 × r' : 'r = d ÷ 2', toD ? 'القطر = 2 × نصف القطر' : 'نصف القطر = القطر ÷ 2'),
      ),
      steps: [S(toD ? `2 × ${r} = ${2 * r}` : `${2 * r} ÷ 2 = ${r}`)],
      explanation: L('Diameter = 2 × radius, radius = diameter ÷ 2.', 'القطر = 2 × نصف القطر ونصف القطر = القطر ÷ 2.'),
      correct: S(`${toD ? 2 * r : r} cm`),
    });
  }),

  G('parts', 'circles', 'matching', [1, 2], (rng) => {
    const all = [
      { l: L('radius', 'نصف القطر'), r: L('centre to the edge', 'من المركز إلى الحافة') },
      { l: L('diameter', 'القطر'), r: L('across through the centre', 'عبر الدائرة مارًّا بالمركز') },
      { l: L('circumference', 'المحيط'), r: L('distance around the circle', 'المسافة حول الدائرة') },
      { l: L('area', 'المساحة'), r: L('space inside the circle', 'الحيّز داخل الدائرة') },
    ];
    const pairs = rng.sample(all, 3).map((p) => ({ left: p.l, right: p.r }));
    return matchBody(rng, {
      prompt: L('Match each word with its meaning.', 'صِل كل كلمة بمعناها.'),
      pairs,
      hints: H(
        L('Think about where each measurement starts and ends.', 'فكّر أين يبدأ كل قياس وأين ينتهي.'),
        L('Circumference is a length; area is a surface.', 'المحيط طول والمساحة سطح.'),
        L('The diameter is twice the radius.', 'القطر ضعف نصف القطر.'),
      ),
      steps: pairs.map((p) => L(`${p.left.en} → ${p.right.en}`, `${p.left.ar} ← ${p.right.ar}`)),
      explanation: L('These four words describe every circle problem.', 'هذه الكلمات الأربع تصف كل مسائل الدائرة.'),
    });
  }),

  G('circumference', 'circles', 'type-answer', [2, 3, 4], (rng, d) => {
    const useD = d >= 3 && rng.chance(0.5);
    const r = rng.int(2, d === 2 ? 10 : 25);
    const given = useD ? 2 * r : r;
    const v = useD ? given : 2 * r;
    return typed({
      prompt: L(
        `A circle has ${useD ? 'a diameter' : 'a radius'} of ${given} cm. Find its circumference. Give your answer as a multiple of π (type only the number in front of π).`,
        `${useD ? 'قطر' : 'نصف قطر'} دائرة ${given} سم. أوجد محيطها. اكتب الجواب بدلالة π (اكتب العدد الذي يسبق π فقط).`,
      ),
      value: v,
      suffix: 'π cm',
      extra: { integerOnly: true },
      errors: ne(v, [[useD ? 2 * given : given, 'radius-diameter'], [r * r, 'formula-mixup'], [useD ? given / 2 : 4 * r, 'formula-mixup']]),
      hints: H(
        L(useD ? 'Circumference = π × diameter.' : 'Circumference = 2 × π × radius.', useD ? 'المحيط = π × القطر.' : 'المحيط = 2 × π × نصف القطر.'),
        L(useD ? 'You already have the diameter — no doubling needed.' : 'Double the radius first.', useD ? 'القطر معطى — لا حاجة للمضاعفة.' : 'ضاعف نصف القطر أولًا.'),
        L(`C = ${v}π`, `المحيط = ${v}π`),
      ),
      steps: [S(useD ? `C = π × ${given} = ${v}π` : `C = 2 × π × ${r} = ${v}π`)],
      explanation: L('Circumference = πd = 2πr. Leave π in the answer to stay exact.', 'المحيط = πd = 2πr. اترك π في الجواب ليبقى دقيقًا.'),
      correct: S(`${v}π cm`),
    });
  }),

  G('area', 'circles', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const useD = d >= 4 && rng.chance(0.6);
    const r = rng.int(2, d <= 3 ? 10 : 15);
    const given = useD ? 2 * r : r;
    const v = r * r;
    return typed({
      prompt: L(
        `A circle has ${useD ? 'a diameter' : 'a radius'} of ${given} cm. Find its area as a multiple of π (type only the number in front of π).`,
        `${useD ? 'قطر' : 'نصف قطر'} دائرة ${given} سم. أوجد مساحتها بدلالة π (اكتب العدد الذي يسبق π فقط).`,
      ),
      value: v,
      suffix: 'π cm²',
      extra: { integerOnly: true },
      errors: ne(v, [[2 * r, 'formula-mixup'], [given * given, 'radius-diameter'], [r, 'square-vs-double']]),
      hints: H(
        L('Area = π × radius × radius.', 'المساحة = π × نصف القطر × نصف القطر.'),
        L(useD ? `The radius is half of ${given}, so r = ${r}.` : `The radius is ${r}.`, useD ? `نصف القطر نصف ${given}، إذن r = ${r}.` : `نصف القطر ${r}.`),
        L(`${r} × ${r}`, `${r} × ${r}`),
      ),
      steps: [S(useD ? `r = ${given} ÷ 2 = ${r}` : `r = ${r}`), S(`A = π × ${r}² = ${v}π`)],
      explanation: L('Area = πr². Always use the radius, never the diameter, and square it.', 'المساحة = πr². استخدم نصف القطر لا القطر ثم ربّعه.'),
      correct: S(`${v}π cm²`),
    });
  }),

  G('pi-approx', 'circles', 'type-answer', [3, 4, 5], (rng, d) => {
    const r = rng.int(2, d === 3 ? 10 : 20);
    const circ = d === 3;
    const useD = d === 5;
    const given = useD ? 2 * r : r;
    const v = circ ? F(314 * 2 * r, 100) : F(314 * r * r, 100);
    return typed({
      prompt: L(
        `Use π ≈ 3.14. A circle has ${useD ? 'a diameter' : 'a radius'} of ${given} cm. What is its ${circ ? 'circumference' : 'area'}?`,
        `استخدم π ≈ 3.14. ${useD ? 'قطر' : 'نصف قطر'} دائرة ${given} سم. ما ${circ ? 'محيطها' : 'مساحتها'}؟`,
      ),
      value: v,
      suffix: circ ? 'cm' : 'cm²',
      errors: ne(v, circ ? [[F(314 * r * r, 100), 'formula-mixup'], [F(314 * r, 100), 'formula-mixup']] : [[F(314 * 2 * r, 100), 'formula-mixup'], [F(314 * given * given, 100), 'radius-diameter']]),
      hints: H(
        L(circ ? 'Circumference = 2 × π × r.' : 'Area = π × r².', circ ? 'المحيط = 2 × π × r.' : 'المساحة = π × r².'),
        L(useD ? `Radius = ${given} ÷ 2 = ${r}.` : `Radius = ${r}.`, useD ? `نصف القطر = ${given} ÷ 2 = ${r}.` : `نصف القطر = ${r}.`),
        L(circ ? `2 × 3.14 × ${r}` : `3.14 × ${r} × ${r}`, circ ? `2 × 3.14 × ${r}` : `3.14 × ${r} × ${r}`),
      ),
      steps: [S(circ ? `2 × 3.14 × ${r} = ${showDec(v)}` : `${r} × ${r} = ${r * r}`), ...(circ ? [] : [S(`3.14 × ${r * r} = ${showDec(v)}`)])],
      explanation: L('Substitute into the formula and multiply carefully; π is just a number.', 'عوّض في القانون واضرب بعناية؛ π ما هي إلا عدد.'),
      correct: ans(v, circ ? 'cm' : 'cm²'),
    });
  }),

  G('wheel', 'circles', 'word-problem', [3, 4, 5], (rng, d) => {
    const dia = rng.int(2, d === 3 ? 8 : 14) * 10;
    const turns = rng.int(2, d === 3 ? 5 : 12);
    const v = dia * turns;
    return typed({
      prompt: L(
        `A bicycle wheel has a diameter of ${dia} cm. How far does it roll in ${turns} full turns? Give the answer as a multiple of π (type only the number in front of π).`,
        `قطر عجلة دراجة ${dia} سم. ما المسافة التي تقطعها في ${turns} دورات كاملة؟ اكتب الجواب بدلالة π (اكتب العدد الذي يسبق π فقط).`,
      ),
      value: v,
      suffix: 'π cm',
      extra: { integerOnly: true },
      errors: ne(v, [[v / 2, 'radius-diameter'], [dia, 'off-by-one'], [turns * dia * dia, 'formula-mixup']]),
      hints: H(
        L('One full turn rolls one circumference.', 'الدورة الكاملة تقطع محيطًا واحدًا.'),
        L(`Circumference = π × ${dia} = ${dia}π cm.`, `المحيط = π × ${dia} = ${dia}π سم.`),
        L(`Multiply by ${turns} turns.`, `اضرب في ${turns} دورات.`),
      ),
      steps: [S(`C = ${dia}π`), S(`${dia} × ${turns} = ${v}`)],
      explanation: L('Distance rolled = circumference × number of turns.', 'المسافة المقطوعة = المحيط × عدد الدورات.'),
      correct: S(`${v}π cm`),
    });
  }),
];

// ───────────────────────── Triangles & Pythagoras ─────────────────────────

const triangles: Generator[] = [
  G('hypotenuse', 'triangles', 'type-answer', [2, 3, 4], (rng, d) => {
    const [a, b, c] = triple(rng, d);
    return typed({
      prompt: L(`A right triangle has legs of ${a} cm and ${b} cm. How long is the hypotenuse?`, `ضلعا القائمة في مثلث قائم ${a} سم و${b} سم. كم طول الوتر؟`),
      value: c,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: ne(c, [[a + b, 'pythagoras-sum'], [a * a + b * b, 'pythagoras-sum'], [Math.abs(a - b), 'pythagoras-sum']]),
      hints: H(
        L('Use a² + b² = c², where c is the hypotenuse.', 'استخدم a² + b² = c² حيث c هو الوتر.'),
        L(`${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.`, `${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}.`),
        L(`c is the square root of ${a * a + b * b}.`, `c هو الجذر التربيعي لـ ${a * a + b * b}.`),
      ),
      steps: [S(`${a}² + ${b}² = ${a * a + b * b}`), S(`c = √${a * a + b * b} = ${c}`)],
      explanation: L("Pythagoras' theorem: the squares on the two legs add up to the square on the hypotenuse.", 'نظرية فيثاغورس: مجموع مربعَي الضلعين القائمين يساوي مربع الوتر.'),
      correct: S(`${c} cm`),
    });
  }),

  G('missing-leg', 'triangles', 'type-answer', [3, 4, 5], (rng, d) => {
    const [a, b, c] = triple(rng, d);
    return typed({
      prompt: L(`A right triangle has a hypotenuse of ${c} cm and one leg of ${a} cm. How long is the other leg?`, `وتر مثلث قائم ${c} سم وأحد ضلعيه القائمين ${a} سم. كم طول الضلع الآخر؟`),
      value: b,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: ne(b, [[c - a, 'pythagoras-sum'], [c * c - a * a, 'pythagoras-sum'], [c + a, 'pythagoras-sum']]),
      hints: H(
        L('The hypotenuse is the longest side: c² = a² + b².', 'الوتر هو الأطول: c² = a² + b².'),
        L(`So b² = c² − a² = ${c * c} − ${a * a}.`, `إذن b² = c² − a² = ${c * c} − ${a * a}.`),
        L(`b² = ${b * b}`, `b² = ${b * b}`),
      ),
      steps: [S(`${c}² − ${a}² = ${c * c - a * a}`), S(`b = √${c * c - a * a} = ${b}`)],
      explanation: L('To find a leg, subtract the known leg squared from the hypotenuse squared.', 'لإيجاد ضلع قائم اطرح مربع الضلع المعلوم من مربع الوتر.'),
      correct: S(`${b} cm`),
    });
  }),

  G('is-right', 'triangles', 'true-false', [2, 3, 4], (rng, d) => {
    const [a, b, c] = triple(rng, d);
    const truth = rng.chance(0.5);
    const c2 = truth ? c : c + rng.pick([-1, 1]);
    if (c2 <= Math.max(a, b)) throw new RangeError('bad side');
    return tfBody({
      prompt: L(`True or false: a triangle with sides ${a}, ${b} and ${c2} is a right triangle.`, `صحيح أم خطأ: المثلث الذي أطوال أضلاعه ${a} و${b} و${c2} مثلث قائم.`),
      truth,
      pid: 'pythagoras-sum',
      hints: H(
        L('A triangle is right-angled if a² + b² = c² for its longest side c.', 'يكون المثلث قائمًا إذا كان a² + b² = c² حيث c أطول الأضلاع.'),
        L(`${a}² + ${b}² = ${a * a + b * b}.`, `${a}² + ${b}² = ${a * a + b * b}.`),
        L(`${c2}² = ${c2 * c2}. Are they equal?`, `${c2}² = ${c2 * c2}. هل هما متساويان؟`),
      ),
      steps: [S(`${a * a} + ${b * b} = ${a * a + b * b}`), S(`${c2}² = ${c2 * c2}`), L(truth ? 'Equal → right triangle' : 'Not equal → not a right triangle', truth ? 'متساويان ← مثلث قائم' : 'غير متساويين ← ليس مثلثًا قائمًا')],
      explanation: L('Test the longest side: squares of the short sides must add up to its square.', 'اختبر أطول الأضلاع: مجموع مربعَي الضلعين الأقصر يجب أن يساوي مربعه.'),
    });
  }),

  G('hypotenuse-which', 'triangles', 'mcq', [1, 2], (rng) => {
    const [a, b, c] = rng.pick(TRIPLES.slice(0, 3));
    return mcqNum(rng, {
      prompt: L(`A right triangle has sides of ${a} cm, ${b} cm and ${c} cm. Which length is the hypotenuse?`, `أضلاع مثلث قائم ${a} سم و${b} سم و${c} سم. أي طول هو الوتر؟`),
      correct: c,
      cands: [cand(a, 'formula-mixup'), cand(b, 'formula-mixup')],
      count: 3,
      hints: H(
        L('The hypotenuse is opposite the right angle.', 'الوتر هو الضلع المقابل للزاوية القائمة.'),
        L('It is always the longest side.', 'وهو دائمًا أطول الأضلاع.'),
        L('Pick the biggest number.', 'اختر أكبر عدد.'),
      ),
      steps: [S(`${c} > ${Math.max(a, b)}`)],
      explanation: L('The hypotenuse is longer than either leg.', 'الوتر أطول من أي من الضلعين القائمين.'),
    });
  }),

  G('triangle-kind', 'triangles', 'mcq', [1, 2, 3], (rng, d) => {
    const kinds = [
      { id: 'acute', en: 'acute', ar: 'حاد الزوايا' },
      { id: 'right', en: 'right', ar: 'قائم الزاوية' },
      { id: 'obtuse', en: 'obtuse', ar: 'منفرج الزاوية' },
    ];
    const k = rng.pick(kinds);
    let a: number;
    let b: number;
    if (k.id === 'right') {
      a = 90;
      b = rng.int(20, 70);
    } else if (k.id === 'obtuse') {
      a = rng.int(100, 140);
      b = rng.int(10, 175 - a - 5);
    } else {
      a = rng.int(40, 75);
      b = rng.int(45, 85);
      if (180 - a - b >= 90) throw new RangeError('not acute');
    }
    const c = 180 - a - b;
    const given = k.id === 'acute' || d === 1 ? [a, b, c] : [a, b];
    const unknown = d === 1 ? '' : given.length === 2 ? ` The third angle is not given.` : '';
    return mcqText(rng, {
      prompt: L(
        `A triangle has angles of ${given.map((n) => `${n}°`).join(', ')}.${unknown} What kind of triangle is it?`,
        `زوايا مثلث ${given.map((n) => `${n}°`).join('، ')}.${unknown ? ' الزاوية الثالثة غير معطاة.' : ''} ما نوع هذا المثلث؟`,
      ),
      correct: L(k.en, k.ar),
      wrongs: kinds.filter((x) => x.id !== k.id).map((x) => ({ label: L(x.en, x.ar), pid: x.id === 'right' ? 'triangle-sum' : undefined })),
      count: 3,
      hints: H(
        L('Find all three angles. They add up to 180°.', 'أوجد الزوايا الثلاث. مجموعها 180°.'),
        L('Acute: all under 90°. Right: one 90°. Obtuse: one over 90°.', 'حاد: كلها أقل من 90°. قائم: إحداها 90°. منفرج: إحداها أكبر من 90°.'),
        L(`The angles are ${a}°, ${b}° and ${c}°.`, `الزوايا ${a}° و${b}° و${c}°.`),
      ),
      steps: [S(`180 − ${a} − ${b} = ${c}`), L(`Largest angle: ${Math.max(a, b, c)}°`, `أكبر زاوية: ${Math.max(a, b, c)}°`)],
      explanation: L('Look at the biggest angle: under 90° → acute, equal to 90° → right, over 90° → obtuse.', 'انظر إلى أكبر زاوية: أقل من 90° حاد، تساوي 90° قائم، أكبر من 90° منفرج.'),
    });
  }),

  G('ladder', 'triangles', 'word-problem', [3, 4, 5], (rng, d) => {
    const [a, b, c] = triple(rng, d);
    const high = Math.max(a, b);
    const foot = Math.min(a, b);
    const climb = rng.chance(0.6);
    return climb
      ? typed({
          prompt: L(`A ${c} m ladder leans against a wall with its foot ${foot} m from the wall. How high up the wall does it reach?`, `سُلّم طوله ${c} م مسنود إلى جدار وقاعدته تبعد ${foot} م عن الجدار. إلى أي ارتفاع يصل على الجدار؟`),
          value: high,
          suffix: 'm',
          extra: { integerOnly: true },
          errors: ne(high, [[c - foot, 'pythagoras-sum'], [c * c - foot * foot, 'pythagoras-sum'], [c + foot, 'pythagoras-sum']]),
          hints: H(
            L('The wall, the ground and the ladder make a right triangle.', 'الجدار والأرض والسلّم يكوّنون مثلثًا قائمًا.'),
            L('The ladder is the hypotenuse.', 'السلّم هو الوتر.'),
            L(`height² = ${c}² − ${foot}² = ${high * high}`, `الارتفاع² = ${c}² − ${foot}² = ${high * high}`),
          ),
          steps: [S(`${c}² − ${foot}² = ${c * c - foot * foot}`), S(`√${c * c - foot * foot} = ${high}`)],
          explanation: L('Spot the right triangle, decide which side is the hypotenuse, then apply Pythagoras.', 'اكتشف المثلث القائم وحدّد الوتر ثم طبّق فيثاغورس.'),
          correct: S(`${high} m`),
        })
      : typed({
          prompt: L(`A hiker walks ${a} km east and then ${b} km north. How far is she from the start in a straight line?`, `يمشي متنزّه ${a} كم شرقًا ثم ${b} كم شمالًا. كم يبعد في خط مستقيم عن نقطة البداية؟`),
          value: c,
          suffix: 'km',
          extra: { integerOnly: true },
          errors: ne(c, [[a + b, 'pythagoras-sum'], [a * a + b * b, 'pythagoras-sum']]),
          hints: H(
            L('East then north makes a right angle.', 'شرقًا ثم شمالًا يصنع زاوية قائمة.'),
            L('The straight line back is the hypotenuse.', 'الخط المستقيم للعودة هو الوتر.'),
            L(`√(${a}² + ${b}²)`, `√(${a}² + ${b}²)`),
          ),
          steps: [S(`${a}² + ${b}² = ${a * a + b * b}`), S(`√${a * a + b * b} = ${c}`)],
          explanation: L('A path with two perpendicular legs and a shortcut is a right triangle.', 'مسار من ضلعين متعامدين مع اختصار مستقيم هو مثلث قائم.'),
          correct: S(`${c} km`),
        });
  }),
];

// ───────────────────────── Volume ─────────────────────────

const volume: Generator[] = [
  G('cuboid', 'volume', 'type-answer', [1, 2, 3], (rng, d) => {
    const mx = d === 1 ? 6 : d === 2 ? 10 : 20;
    const l = rng.int(2, mx);
    const w = rng.int(2, mx);
    const h = rng.int(2, mx);
    const v = l * w * h;
    return typed({
      prompt: L(`A box is ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume?`, `صندوق طوله ${l} سم وعرضه ${w} سم وارتفاعه ${h} سم. ما حجمه؟`),
      value: v,
      suffix: 'cm³',
      extra: { integerOnly: true },
      errors: ne(v, [[l * w, 'volume-area'], [l + w + h, 'wrong-operation'], [2 * (l * w + l * h + w * h), 'volume-area']]),
      hints: H(
        L('Volume counts the unit cubes that fill the box.', 'الحجم هو عدد المكعبات الوحدة التي تملأ الصندوق.'),
        L('Multiply all three measurements.', 'اضرب الأبعاد الثلاثة معًا.'),
        L(`${l} × ${w} × ${h}`, `${l} × ${w} × ${h}`),
      ),
      steps: [S(`${l} × ${w} = ${l * w}`), S(`${l * w} × ${h} = ${v}`)],
      explanation: L('Volume of a cuboid = length × width × height (base area × height).', 'حجم متوازي المستطيلات = الطول × العرض × الارتفاع (مساحة القاعدة × الارتفاع).'),
      correct: S(`${v} cm³`),
    });
  }),

  G('cube', 'volume', 'type-answer', [1, 2, 3], (rng, d) => {
    const s = rng.int(2, d === 1 ? 5 : d === 2 ? 9 : 15);
    const v = s * s * s;
    return typed({
      prompt: L(`A cube has edges of ${s} cm. What is its volume?`, `مكعب طول حرفه ${s} سم. ما حجمه؟`),
      value: v,
      suffix: 'cm³',
      extra: { integerOnly: true },
      errors: ne(v, [[3 * s, 'exponent-multiply'], [s * s, 'volume-area'], [6 * s * s, 'volume-area']]),
      hints: H(
        L('All three dimensions of a cube are equal.', 'أبعاد المكعب الثلاثة متساوية.'),
        L('Multiply the edge by itself three times.', 'اضرب الحرف في نفسه ثلاث مرات.'),
        L(`${s} × ${s} × ${s}`, `${s} × ${s} × ${s}`),
      ),
      steps: [S(`${s} × ${s} = ${s * s}`), S(`${s * s} × ${s} = ${v}`)],
      explanation: L('Volume of a cube = s³.', 'حجم المكعب = s³.'),
      correct: S(`${v} cm³`),
    });
  }),

  G('cylinder', 'volume', 'type-answer', [3, 4, 5], (rng, d) => {
    const r = rng.int(2, d === 3 ? 6 : 10);
    const h = rng.int(2, d === 3 ? 10 : 20);
    const useD = d === 5;
    const given = useD ? 2 * r : r;
    const v = r * r * h;
    return typed({
      prompt: L(
        `A cylinder has ${useD ? 'a base diameter' : 'a base radius'} of ${given} cm and a height of ${h} cm. Find its volume as a multiple of π (type only the number in front of π).`,
        `${useD ? 'قطر قاعدة' : 'نصف قطر قاعدة'} أسطوانة ${given} سم وارتفاعها ${h} سم. أوجد حجمها بدلالة π (اكتب العدد الذي يسبق π فقط).`,
      ),
      value: v,
      suffix: 'π cm³',
      extra: { integerOnly: true },
      errors: ne(v, [[r * h, 'formula-mixup'], [r * r, 'volume-area'], [given * given * h, 'radius-diameter']]),
      hints: H(
        L('Volume = base area × height, and the base is a circle.', 'الحجم = مساحة القاعدة × الارتفاع، والقاعدة دائرة.'),
        L(`Base area = π × ${r}² = ${r * r}π.`, `مساحة القاعدة = π × ${r}² = ${r * r}π.`),
        L(`${r * r} × ${h}`, `${r * r} × ${h}`),
      ),
      steps: [S(`${r}² = ${r * r}`), S(`${r * r} × ${h} = ${v}`)],
      explanation: L('Volume of a cylinder = πr²h.', 'حجم الأسطوانة = πr²h.'),
      correct: S(`${v}π cm³`),
    });
  }),

  G('units', 'volume', 'mcq', [1, 2, 3], (rng) => {
    const opts = [
      { q: L('Volume is measured in…', 'يُقاس الحجم بـ…'), good: S('cm³'), bad: [S('cm'), S('cm²'), S('cm⁴')] },
      { q: L('Which unit could measure the volume of a swimming pool?', 'أي وحدة تصلح لقياس حجم مسبح؟'), good: S('m³'), bad: [S('m'), S('m²'), S('mm')] },
      { q: L('Which unit measures area?', 'أي وحدة تقيس المساحة؟'), good: S('m²'), bad: [S('m'), S('m³'), S('kg')] },
    ];
    const o = rng.pick(opts);
    return mcqText(rng, {
      prompt: o.q,
      correct: o.good,
      wrongs: o.bad.map((b) => ({ label: b, pid: 'volume-area' })),
      hints: H(
        L('Length uses one dimension, area two, volume three.', 'الطول بُعد واحد والمساحة بعدان والحجم ثلاثة أبعاد.'),
        L('The little number shows how many dimensions.', 'الرقم الصغير يدل على عدد الأبعاد.'),
        L('Volume ends in 3.', 'الحجم ينتهي بالرقم 3.'),
      ),
      steps: [L(`${o.good.en} — the exponent matches the dimensions`, `${o.good.ar} — الأس يطابق عدد الأبعاد`)],
      explanation: L('Cm is length, cm² is area, cm³ is volume.', 'سم للطول وسم² للمساحة وسم³ للحجم.'),
    });
  }),

  G('formula', 'volume', 'select-formula', [3, 4, 5], (rng, d) => {
    const shapes = [
      { en: 'a cuboid', ar: 'متوازي المستطيلات', f: 'V = lwh' },
      { en: 'a cylinder', ar: 'الأسطوانة', f: 'V = \\pi r^{2}h' },
      { en: 'a cone', ar: 'المخروط', f: 'V = \\tfrac{1}{3}\\pi r^{2}h' },
      { en: 'a sphere', ar: 'الكرة', f: 'V = \\tfrac{4}{3}\\pi r^{3}' },
    ];
    const sh = rng.pick(d === 3 ? shapes.slice(0, 3) : shapes);
    const wrongs = shapes.filter((s) => s !== sh).map((s) => ({ label: S(mt(s.f)), pid: 'formula-mixup' }));
    wrongs.push({ label: S(mt('V = 2\\pi rh')), pid: 'volume-area' });
    return mcqText(rng, {
      prompt: L(`Which formula gives the volume of ${sh.en}?`, `أي قانون يعطي حجم ${sh.ar}؟`),
      correct: S(mt(sh.f)),
      wrongs,
      hints: H(
        L('Volume formulas have three lengths multiplied.', 'قوانين الحجم تضرب ثلاثة أطوال.'),
        L('A cone is one third of a cylinder with the same base and height.', 'المخروط ثلث أسطوانة لها القاعدة والارتفاع نفساهما.'),
        L('A sphere uses r³.', 'الكرة تستخدم r³.'),
      ),
      steps: [L(`Volume of ${sh.en}`, `حجم ${sh.ar}`)],
      explanation: L('Learn how each volume formula is built from base area × height.', 'افهم كيف يُبنى كل قانون حجم من مساحة القاعدة × الارتفاع.'),
    });
  }),

  G('tank', 'volume', 'word-problem', [3, 4, 5], (rng, d) => {
    const l = rng.int(2, 8) * 10;
    const w = rng.int(2, 6) * 10;
    if (d <= 4) {
      const rise = rng.int(2, 9);
      const vol = l * w * rise;
      return typed({
        prompt: L(`A tank has a base of ${l} cm by ${w} cm. Pouring in ${vol} cm³ of water raises the level by how many centimetres?`, `قاعدة خزان ${l} سم × ${w} سم. صبّ ${vol} سم³ من الماء يرفع المستوى بكم سنتيمترًا؟`),
        value: rise,
        suffix: 'cm',
        extra: { integerOnly: true },
        errors: ne(rise, [[vol / l, 'volume-area'], [vol * l * w, 'inverse-op'], [vol - l * w, 'wrong-operation']]),
        hints: H(
          L('Volume = base area × height.', 'الحجم = مساحة القاعدة × الارتفاع.'),
          L(`Base area = ${l} × ${w} = ${l * w}.`, `مساحة القاعدة = ${l} × ${w} = ${l * w}.`),
          L(`height = ${vol} ÷ ${l * w}`, `الارتفاع = ${vol} ÷ ${l * w}`),
        ),
        steps: [S(`${l} × ${w} = ${l * w}`), S(`${vol} ÷ ${l * w} = ${rise}`)],
        explanation: L('Work backwards: height = volume ÷ base area.', 'اعمل عكسيًا: الارتفاع = الحجم ÷ مساحة القاعدة.'),
        correct: S(`${rise} cm`),
      });
    }
    const h = rng.int(2, 9) * 10;
    const litres = (l * w * h) / 1000;
    return typed({
      prompt: L(`A tank measures ${l} cm by ${w} cm by ${h} cm. How many litres of water does it hold when full? (1 litre = 1000 cm³)`, `أبعاد خزان ${l} سم × ${w} سم × ${h} سم. كم لترًا من الماء يتّسع عند امتلائه؟ (1 لتر = 1000 سم³)`),
      value: litres,
      suffix: 'L',
      extra: { integerOnly: true },
      errors: ne(litres, [[l * w * h, 'units-mixup'], [l * w * h / 100, 'units-mixup'], [l * w * h / 1_000_000, 'units-mixup']]),
      hints: H(
        L('Find the volume in cm³ first.', 'أوجد الحجم بالسنتيمتر المكعب أولًا.'),
        L(`${l} × ${w} × ${h} = ${l * w * h} cm³.`, `${l} × ${w} × ${h} = ${l * w * h} سم³.`),
        L('Then divide by 1000 to get litres.', 'ثم اقسم على 1000 لتحصل على اللترات.'),
      ),
      steps: [S(`${l} × ${w} × ${h} = ${l * w * h}`), S(`${l * w * h} ÷ 1000 = ${litres}`)],
      explanation: L('1 litre = 1000 cm³, so divide cm³ by 1000.', 'اللتر الواحد = 1000 سم³، فاقسم السنتيمترات المكعبة على 1000.'),
      correct: S(`${litres} L`),
    });
  }),
];

// ───────────────────────── Coordinate plane ─────────────────────────

const QUADRANTS = [
  { id: 'I', en: 'Quadrant I', ar: 'الربع الأول' },
  { id: 'II', en: 'Quadrant II', ar: 'الربع الثاني' },
  { id: 'III', en: 'Quadrant III', ar: 'الربع الثالث' },
  { id: 'IV', en: 'Quadrant IV', ar: 'الربع الرابع' },
];
const quadrantOf = (x: number, y: number): string => (x > 0 ? (y > 0 ? 'I' : 'IV') : y > 0 ? 'II' : 'III');

const coordinate: Generator[] = [
  G('quadrant', 'coordinate', 'mcq', [1, 2, 3], (rng, d) => {
    const mx = d === 1 ? 6 : 12;
    const x = rng.chance(0.5) ? rng.int(1, mx) : -rng.int(1, mx);
    const y = rng.chance(0.5) ? rng.int(1, mx) : -rng.int(1, mx);
    const right = quadrantOf(x, y);
    const swapped = quadrantOf(y, x);
    const c = QUADRANTS.find((q) => q.id === right) as (typeof QUADRANTS)[number];
    return mcqText(rng, {
      prompt: L('In which quadrant is this point?', 'في أي ربع تقع هذه النقطة؟'),
      display: pt(x, y),
      correct: L(c.en, c.ar),
      wrongs: QUADRANTS.filter((q) => q.id !== right).map((q) => ({ label: L(q.en, q.ar), pid: q.id === swapped ? 'coordinate-swap' : undefined })),
      hints: H(
        L('Look at the signs: x is the first number, y the second.', 'انظر إلى الإشارتين: x هو العدد الأول وy الثاني.'),
        L(`x is ${x > 0 ? 'positive (right)' : 'negative (left)'}, y is ${y > 0 ? 'positive (up)' : 'negative (down)'}.`, `x ${x > 0 ? 'موجب (يمين)' : 'سالب (يسار)'} وy ${y > 0 ? 'موجب (أعلى)' : 'سالب (أسفل)'}.`),
        L('I: (+,+), II: (−,+), III: (−,−), IV: (+,−).', 'الأول: (+,+)، الثاني: (−,+)، الثالث: (−,−)، الرابع: (+,−).'),
      ),
      steps: [L(`x = ${signedN(x)}, y = ${signedN(y)} → ${c.en}`, `x = ${signedN(x)}، y = ${signedN(y)} ← ${c.ar}`)],
      explanation: L('The signs of the two coordinates decide the quadrant.', 'تحدّد إشارتا الإحداثيين الربع.'),
    });
  }),

  G('distance', 'coordinate', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const x1 = rng.int(-8, 8);
    const y1 = rng.int(-8, 8);
    if (d === 2) {
      const horizontal = rng.chance(0.5);
      const gap = rng.int(2, 12);
      const x2 = horizontal ? x1 + gap : x1;
      const y2 = horizontal ? y1 : y1 + gap;
      return typed({
        prompt: L(`How far apart are the points ${mt(pt(x1, y1))} and ${mt(pt(x2, y2))}?`, `كم المسافة بين النقطتين ${mt(pt(x1, y1))} و${mt(pt(x2, y2))}؟`),
        value: gap,
        extra: { integerOnly: true },
        errors: ne(gap, [[horizontal ? Math.abs(x1) + Math.abs(x2) : Math.abs(y1) + Math.abs(y2), 'sign-error'], [horizontal ? x1 + x2 : y1 + y2, 'sign-error']]),
        hints: H(
          L(`The points share the same ${horizontal ? 'y' : 'x'} value, so they lie on a ${horizontal ? 'horizontal' : 'vertical'} line.`, `للنقطتين قيمة ${horizontal ? 'y' : 'x'} نفسها، فهما على خط ${horizontal ? 'أفقي' : 'رأسي'}.`),
          L(`Subtract the ${horizontal ? 'x' : 'y'} values.`, `اطرح قيمتي ${horizontal ? 'x' : 'y'}.`),
          L(`|${horizontal ? x2 : y2} − ${signedN(horizontal ? x1 : y1)}|`, `|${horizontal ? x2 : y2} − ${signedN(horizontal ? x1 : y1)}|`),
        ),
        steps: [S(`|${signedN(horizontal ? x2 : y2)} − (${signedN(horizontal ? x1 : y1)})| = ${gap}`)],
        explanation: L('On a straight horizontal or vertical line, the distance is the difference of the coordinates that change.', 'على خط أفقي أو رأسي المسافة هي فرق الإحداثي المتغيّر.'),
        correct: S(String(gap)),
      });
    }
    const [dx, dy, c] = triple(rng, d);
    const sx = rng.chance(0.5) ? 1 : -1;
    const sy = rng.chance(0.5) ? 1 : -1;
    const x2 = x1 + sx * dx;
    const y2 = y1 + sy * dy;
    return typed({
      prompt: L(`Find the distance between ${mt(pt(x1, y1))} and ${mt(pt(x2, y2))}.`, `أوجد المسافة بين ${mt(pt(x1, y1))} و${mt(pt(x2, y2))}.`),
      value: c,
      extra: { integerOnly: true },
      errors: ne(c, [[dx + dy, 'pythagoras-sum'], [dx * dx + dy * dy, 'pythagoras-sum']]),
      hints: H(
        L('The horizontal and vertical gaps are the legs of a right triangle.', 'الفرقان الأفقي والرأسي هما ضلعا مثلث قائم.'),
        L(`Gaps: ${dx} across and ${dy} up or down.`, `الفرقان: ${dx} أفقيًا و${dy} رأسيًا.`),
        L(`distance = √(${dx}² + ${dy}²)`, `المسافة = √(${dx}² + ${dy}²)`),
      ),
      steps: [S(`${dx}² + ${dy}² = ${dx * dx + dy * dy}`), S(`√${dx * dx + dy * dy} = ${c}`)],
      explanation: L('Distance formula: d = √((x₂ − x₁)² + (y₂ − y₁)²) — Pythagoras on the coordinate plane.', 'قانون المسافة: d = √((x₂ − x₁)² + (y₂ − y₁)²) — فيثاغورس على المستوى الإحداثي.'),
      correct: S(String(c)),
    });
  }),

  G('midpoint', 'coordinate', 'type-answer', [3, 4, 5], (rng, d) => {
    const x1 = rng.int(-9, 9);
    const y1 = rng.int(-9, 9);
    let x2 = rng.int(-9, 9);
    let y2 = rng.int(-9, 9);
    if (d === 3) {
      if ((x2 - x1) % 2 !== 0) x2 += 1;
      if ((y2 - y1) % 2 !== 0) y2 += 1;
    }
    if (x1 === x2 && y1 === y2) throw new RangeError('same point');
    const mx = F(x1 + x2, 2);
    const my = F(y1 + y2, 2);
    return listBody({
      prompt: L(`Find the midpoint of ${mt(pt(x1, y1))} and ${mt(pt(x2, y2))}. Type the x value then the y value, separated by a comma.`, `أوجد منتصف القطعة بين ${mt(pt(x1, y1))} و${mt(pt(x2, y2))}. اكتب قيمة x ثم قيمة y يفصل بينهما فاصلة.`),
      values: [mx, my],
      ordered: true,
      correct: S(mt(`(${showDec(mx)},\\ ${showDec(my)})`)),
      hints: H(
        L('The midpoint is the average of the x values and the average of the y values.', 'نقطة المنتصف هي متوسط قيمتي x ومتوسط قيمتي y.'),
        L(`x: (${signedN(x1)} + ${signedN(x2)}) ÷ 2`, `x: (${signedN(x1)} + ${signedN(x2)}) ÷ 2`),
        L(`y: (${signedN(y1)} + ${signedN(y2)}) ÷ 2`, `y: (${signedN(y1)} + ${signedN(y2)}) ÷ 2`),
      ),
      steps: [S(`x = (${signedN(x1)} + ${signedN(x2)}) ÷ 2 = ${showDec(mx)}`), S(`y = (${signedN(y1)} + ${signedN(y2)}) ÷ 2 = ${showDec(my)}`)],
      explanation: L('Midpoint = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2).', 'نقطة المنتصف = ((x₁ + x₂) ÷ 2 ، (y₁ + y₂) ÷ 2).'),
    });
  }),

  G('reflect', 'coordinate', 'mcq', [2, 3, 4], (rng, d) => {
    const x = (rng.chance(0.5) ? 1 : -1) * rng.int(1, 9);
    const y = (rng.chance(0.5) ? 1 : -1) * rng.int(1, 9);
    if (x === y || x === -y) throw new RangeError('symmetric');
    const kind = d === 2 ? 'x' : d === 3 ? 'y' : 'o';
    const result = kind === 'x' ? [x, -y] : kind === 'y' ? [-x, y] : [-x, -y];
    const label = (p: number[]) => S(mt(pt(p[0] as number, p[1] as number)));
    const name = kind === 'x' ? L('the x-axis', 'محور السينات (x)') : kind === 'y' ? L('the y-axis', 'محور الصادات (y)') : L('the origin (a half turn)', 'نقطة الأصل (دوران نصف دورة)');
    const alts: { p: number[]; pid: string }[] = [
      { p: [y, x], pid: 'coordinate-swap' },
      { p: kind === 'x' ? [-x, y] : [x, -y], pid: 'sign-error' },
      { p: [-x, -y], pid: 'sign-error' },
      { p: [x, y], pid: 'sign-error' },
    ];
    return mcqText(rng, {
      prompt: L(`Reflect the point ${mt(pt(x, y))} in ${name.en}. Where does it land?`, `اعكس النقطة ${mt(pt(x, y))} في ${name.ar}. أين تقع بعد العكس؟`),
      correct: label(result),
      wrongs: alts.filter((a) => a.p[0] !== result[0] || a.p[1] !== result[1]).map((a) => ({ label: label(a.p), pid: a.pid })),
      hints: H(
        L(kind === 'x' ? 'Reflecting in the x-axis keeps x and flips the sign of y.' : kind === 'y' ? 'Reflecting in the y-axis keeps y and flips the sign of x.' : 'Through the origin both signs flip.', kind === 'x' ? 'العكس في محور x يُبقي x ويغيّر إشارة y.' : kind === 'y' ? 'العكس في محور y يُبقي y ويغيّر إشارة x.' : 'عبر نقطة الأصل تتغيّر الإشارتان.'),
        L('Do not swap the numbers — only change signs.', 'لا تبدّل العددين — غيّر الإشارات فقط.'),
        L(`The image is ${pt(result[0] as number, result[1] as number).replace('\\ ', ' ')}.`, `الصورة هي ${pt(result[0] as number, result[1] as number).replace('\\ ', ' ')}.`),
      ),
      steps: [L(`${pt(x, y).replace('\\ ', ' ')} → ${pt(result[0] as number, result[1] as number).replace('\\ ', ' ')}`, `${pt(x, y).replace('\\ ', ' ')} ← ${pt(result[0] as number, result[1] as number).replace('\\ ', ' ')}`)],
      explanation: L('A reflection flips one coordinate sign (or both for the origin) without exchanging x and y.', 'العكس يغيّر إشارة إحداثي واحد (أو كليهما حول الأصل) دون تبديل x وy.'),
    });
  }),

  G('describe-point', 'coordinate', 'matching', [1, 2], (rng, d) => {
    const mx = d === 1 ? 6 : 9;
    const xs = rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n <= mx), 3);
    const pairs = xs.map((ax) => {
      const x = rng.chance(0.5) ? ax : -ax;
      const y = (rng.chance(0.5) ? 1 : -1) * rng.int(1, mx);
      return {
        left: L(`${Math.abs(x)} ${x > 0 ? 'right' : 'left'}, ${Math.abs(y)} ${y > 0 ? 'up' : 'down'}`, `${Math.abs(x)} ${x > 0 ? 'يمينًا' : 'يسارًا'}، ${Math.abs(y)} ${y > 0 ? 'للأعلى' : 'للأسفل'}`),
        right: S(mt(pt(x, y))),
      };
    });
    return matchBody(rng, {
      prompt: L('Match each movement from the origin to the point it reaches.', 'صِل كل حركة من نقطة الأصل بالنقطة التي تصل إليها.'),
      pairs,
      hints: H(
        L('The first number moves left or right, the second moves up or down.', 'العدد الأول يحرّك يمينًا أو يسارًا والثاني يحرّك للأعلى أو للأسفل.'),
        L('Right and up are positive; left and down are negative.', 'اليمين والأعلى موجبان؛ اليسار والأسفل سالبان.'),
        L('Start at (0, 0).', 'ابدأ من (0, 0).'),
      ),
      steps: pairs.map((p) => L(`${p.left.en} → ${p.right.en}`, `${p.left.ar} ← ${p.right.ar}`)),
      explanation: L('Coordinates are written (x, y): across first, then up or down.', 'تُكتب الإحداثيات (x, y): الأفقي أولًا ثم الرأسي.'),
    });
  }),

  G('on-axis', 'coordinate', 'true-false', [1, 2, 3], (rng, d) => {
    const mx = d === 1 ? 6 : 12;
    const axisX = rng.chance(0.5);
    const v = rng.int(1, mx) * (rng.chance(0.5) ? 1 : -1);
    const point = axisX ? pt(v, 0) : pt(0, v);
    const truth = rng.chance(0.5);
    const claim = truth ? axisX : !axisX;
    return tfBody({
      prompt: L(`True or false: the point ${mt(point)} lies on the ${claim ? 'x' : 'y'}-axis.`, `صحيح أم خطأ: النقطة ${mt(point)} تقع على محور ${claim ? 'السينات (x)' : 'الصادات (y)'}.`),
      truth,
      pid: 'coordinate-swap',
      hints: H(
        L('Points on the x-axis have y = 0.', 'النقاط على محور x قيمة y فيها 0.'),
        L('Points on the y-axis have x = 0.', 'النقاط على محور y قيمة x فيها 0.'),
        L(axisX ? 'Here y = 0.' : 'Here x = 0.', axisX ? 'هنا y = 0.' : 'هنا x = 0.'),
      ),
      steps: [L(axisX ? 'y = 0, so the point is on the x-axis.' : 'x = 0, so the point is on the y-axis.', axisX ? 'y = 0 إذن النقطة على محور x.' : 'x = 0 إذن النقطة على محور y.')],
      explanation: L('The zero coordinate tells you which axis the point sits on.', 'الإحداثي الصفري يدلّك على المحور الذي تقع عليه النقطة.'),
    });
  }),
];

export const L6_GENERATORS: Generator[] = [...angles, ...perimeter, ...area, ...circles, ...triangles, ...volume, ...coordinate];
