import type { Generator, Rng } from '@/types';
import { Fraction, gcd } from '../fraction';
import { G, compareBody, mcqNum, mcqText, orderBody, matchBody, tfBody, typed } from '../build';
import { H, L, differ, person, same } from '../kit';

const F = Fraction.of;
const fl = (n: number, d: number) => `\\frac{${n}}{${d}}`;
const mt = (s: string) => `$${s}$`;
/** Plain decimal text for any terminating value: 4, 4.5, 0.125. */
const txt = (f: Fraction | number): string => {
  const x = typeof f === 'number' ? F(f) : f;
  return x.isInt() ? String(x.n) : x.toDecimal(8);
};
/** Money: whole amounts stay whole, otherwise two places. */
const mnyS = (f: Fraction): string => (f.isInt() ? String(f.n) : f.toNumber().toFixed(2));
const mnyF = (f: Fraction): string => f.toNumber().toFixed(2);
const cents = (c: number): Fraction => F(c, 100);

// ───────────────────────── Shared percent cases ─────────────────────────

interface PctCase {
  p: Fraction;
  base: number;
}
/** A percent and a base chosen so the answer is clean; complexity grows with d. */
function pctCase(rng: Rng, d: number): PctCase {
  switch (d) {
    case 1:
      return { p: F(rng.pick([10, 50])), base: 10 * rng.int(1, 10) };
    case 2:
      return { p: F(rng.pick([10, 20, 25, 50])), base: 20 * rng.int(1, 10) };
    case 3:
      return { p: F(5 * rng.int(1, 18)), base: 20 * rng.int(2, 15) };
    case 4:
      return { p: F(rng.pick([6, 8, 12, 15, 18, 35, 45, 65])), base: 50 * rng.int(1, 12) };
    default:
      return rng.chance(0.25)
        ? { p: F(rng.pick([120, 150, 200])), base: 20 * rng.int(2, 15) }
        : { p: rng.pick([F(5, 2), F(15, 2), F(25, 2), F(35, 2)]), base: 40 * rng.int(2, 15) };
  }
}
const ofPct = (c: PctCase): Fraction => c.p.mul(F(c.base)).div(F(100));

// ───────────────────────── Percent basics ─────────────────────────

const PCT_FRAC: [number, number, number][] = [
  [10, 1, 10],
  [20, 1, 5],
  [25, 1, 4],
  [40, 2, 5],
  [50, 1, 2],
  [60, 3, 5],
  [75, 3, 4],
  [80, 4, 5],
];

const percentBasics: Generator[] = [
  G('to-fraction', 'percent-basics', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const p = rng.pick(d === 1 ? [10, 25, 50, 75] : d === 2 ? [20, 40, 60, 80, 5, 30] : d === 3 ? [15, 35, 45, 12, 24, 64] : [2, 4, 8, 16, 32, 125, 150]);
    const val = F(p, 100);
    return mcqNum(rng, {
      prompt: L('Which fraction is equal to this percent?', 'أي كسر يساوي هذه النسبة المئوية؟'),
      display: `${p}\\%`,
      correct: val,
      cands: [
        { v: F(100, p), pid: 'reversed-fraction' },
        { v: F(p, 10), pid: 'percent-decimal' },
        { v: F(1, p), pid: 'reversed-fraction' },
        { v: F(p, 1000), pid: 'percent-decimal' },
      ],
      hints: H(
        L('"Percent" means "out of 100".', 'كلمة «بالمئة» تعني «من كل 100».'),
        L(`${p}% means ${p} out of 100.`, `${p}% تعني ${p} من كل 100.`),
        L('Write it over 100 and simplify.', 'اكتبها فوق 100 ثم اختصر.'),
      ),
      steps: [
        L(`${p}% = ${p}/100.`, `${p}% = ${p}/100.`),
        L(`Simplify: ${val.n}/${val.d}.`, `نختصر: ${val.n}/${val.d}.`),
      ],
      explanation: L('A percent is a fraction with denominator 100.', 'النسبة المئوية كسر مقامه 100.'),
    });
  }),

  G('to-decimal', 'percent-basics', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const pv: Fraction =
      d === 1
        ? F(rng.pick([10, 20, 50, 30, 40]))
        : d === 2
          ? F(rng.int(1, 99))
          : d === 3
            ? F(rng.int(101, 250))
            : d === 4
              ? rng.pick([F(125, 10), F(5, 10), F(375, 10), F(25, 10), F(75, 10)])
              : rng.pick([F(25, 100), F(5, 100), F(125, 100), F(75, 100)]);
    const val = pv.div(F(100));
    return typed({
      prompt: L('Write this percent as a decimal.', 'اكتب هذه النسبة المئوية على صورة عدد عشري.'),
      display: `${txt(pv)}\\%`,
      value: val,
      correct: same(txt(val)),
      mode: 'number',
      errors: [
        [pv.div(F(10)), 'percent-decimal'],
        [pv, 'percent-decimal'],
      ],
      hints: H(
        L('Percent means "per hundred".', 'النسبة المئوية تعني «لكل مئة».'),
        L('Divide the percent number by 100.', 'اقسم عدد النسبة على 100.'),
        L('Dividing by 100 moves the decimal point two places left.', 'القسمة على 100 تحرّك الفاصلة منزلتين إلى اليسار.'),
      ),
      steps: [
        L(`${txt(pv)} ÷ 100 = ${txt(val)}.`, `${txt(pv)} ÷ 100 = ${txt(val)}.`),
      ],
      explanation: L('To turn a percent into a decimal, divide by 100.', 'لتحويل النسبة المئوية إلى عدد عشري اقسمها على 100.'),
    });
  }),

  G('match-forms', 'percent-basics', 'matching', [1, 2, 3, 4], (rng, d) => {
    const chosen = rng.sample(PCT_FRAC, d === 1 ? 3 : 4);
    const useDecimal = d === 3 ? () => true : d >= 4 ? () => rng.chance(0.5) : () => false;
    return matchBody(rng, {
      prompt: L('Match each percent with the number that equals it.', 'صِل كل نسبة مئوية بالعدد الذي يساويها.'),
      pairs: chosen.map(([p, n, den]) => ({
        left: same(mt(`${p}\\%`)),
        right: useDecimal() ? same(txt(F(p, 100))) : same(mt(fl(n, den))),
      })),
      hints: H(
        L('Turn each percent into a fraction over 100.', 'حوّل كل نسبة إلى كسر مقامه 100.'),
        L('Simplify the fractions (or divide by 100 for decimals).', 'اختصر الكسور (أو اقسم على 100 للأعداد العشرية).'),
        L('Start with the easiest one, like 50%.', 'ابدأ بالأسهل مثل 50%.'),
      ),
      steps: [L('Write p% as p/100, simplify, or divide by 100.', 'اكتب p% على صورة p/100 ثم اختصر، أو اقسم على 100.')],
      explanation: L('Percents, fractions and decimals are three ways to write the same amount.', 'النسب والكسور والأعداد العشرية ثلاث طرق لكتابة المقدار نفسه.'),
    });
  }),

  G('statement', 'percent-basics', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    const p = d === 1 ? rng.pick([10, 50, 25]) : d === 2 ? rng.pick([20, 30, 40, 60, 75]) : rng.int(2, 95);
    const truth = rng.chance(0.5);
    const right = F(p, 100);
    const shown = truth ? right : rng.chance(0.5) ? F(p, 10) : F(p);
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${p}\\% = ${txt(shown)}`,
      truth,
      pid: 'percent-decimal',
      hints: H(
        L('Convert the percent to a decimal.', 'حوّل النسبة المئوية إلى عدد عشري.'),
        L('Divide by 100.', 'اقسم على 100.'),
        L(`${p} ÷ 100 = ${txt(right)}.`, `${p} ÷ 100 = ${txt(right)}.`),
      ),
      steps: [
        L(`${p}% = ${p} ÷ 100 = ${txt(right)}.`, `${p}% = ${p} ÷ 100 = ${txt(right)}.`),
        L(truth ? 'It matches the statement.' : `The statement says ${txt(shown)}, so it is false.`, truth ? 'تطابق العبارة.' : `العبارة تقول ${txt(shown)} فهي خاطئة.`),
      ],
      explanation: L('Dividing by 100 gives the decimal form of a percent.', 'القسمة على 100 تعطي الصورة العشرية للنسبة المئوية.'),
    });
  }),

  G('fill-over', 'percent-basics', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const den = d <= 2 ? 100 : d === 3 ? rng.pick([20, 50, 25]) : rng.pick([4, 5, 10, 20]);
    const step = 100 / den;
    const top = d <= 2 ? rng.int(1, 99) : rng.int(1, den - 1);
    const p = top * step;
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `${p}\\% = \\frac{\\square}{${den}}`,
      value: top,
      extra: { integerOnly: true },
      errors: [[p, 'percent-decimal']],
      hints: H(
        L('Percent means out of 100.', 'النسبة المئوية تعني من 100.'),
        L(den === 100 ? 'The denominator is already 100.' : `Change the denominator from 100 to ${den}: divide by ${step}.`, den === 100 ? 'المقام هو 100 فعلًا.' : `غيّر المقام من 100 إلى ${den}: اقسم على ${step}.`),
        L('Do the same to the numerator.', 'افعل الشيء نفسه بالبسط.'),
      ),
      steps: [
        L(`${p}% = ${p}/100.`, `${p}% = ${p}/100.`),
        L(den === 100 ? `The numerator is ${top}.` : `Divide top and bottom by ${step}: ${p} ÷ ${step} = ${top}.`, den === 100 ? `البسط هو ${top}.` : `نقسم البسط والمقام على ${step}: ${p} ÷ ${step} = ${top}.`),
      ],
      explanation: L('Equivalent fractions are made by multiplying or dividing top and bottom by the same number.', 'الكسور المتكافئة تنتج بضرب البسط والمقام أو قسمتهما على العدد نفسه.'),
    });
  }),
];

// ───────────────────────── Percent of a number ─────────────────────────

const percentOf: Generator[] = [
  G('of-number', 'percent-of', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const c = pctCase(rng, d);
    const ans = ofPct(c);
    return typed({
      prompt: L(`What is ${txt(c.p)}% of ${c.base}?`, `ما هو ${txt(c.p)}% من ${c.base}؟`),
      value: ans,
      correct: same(txt(ans)),
      errors: [
        [c.p.mul(F(c.base)), 'percent-decimal'],
        [c.p.mul(F(c.base)).div(F(10)), 'percent-decimal'],
      ],
      hints: H(
        L('"Of" means multiply.', 'كلمة «من» تعني الضرب.'),
        L(`${txt(c.p)}% = ${txt(c.p.div(F(100)))} as a decimal.`, `${txt(c.p)}% = ${txt(c.p.div(F(100)))} على صورة عدد عشري.`),
        L(`Multiply ${txt(c.p.div(F(100)))} × ${c.base}.`, `اضرب ${txt(c.p.div(F(100)))} × ${c.base}.`),
      ),
      steps: [
        L(`${txt(c.p)}% = ${txt(c.p)} ÷ 100 = ${txt(c.p.div(F(100)))}.`, `${txt(c.p)}% = ${txt(c.p)} ÷ 100 = ${txt(c.p.div(F(100)))}.`),
        L(`${txt(c.p.div(F(100)))} × ${c.base} = ${txt(ans)}.`, `${txt(c.p.div(F(100)))} × ${c.base} = ${txt(ans)}.`),
      ],
      explanation: L('Percent of a number = (percent ÷ 100) × the number.', 'النسبة المئوية من عدد = (النسبة ÷ 100) × العدد.'),
    });
  }),

  G('find-percent', 'percent-of', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const b = rng.pick(d === 1 ? [10, 20, 50, 100, 5, 4] : d === 2 ? [20, 25, 40, 50, 200, 8] : d === 3 ? [8, 16, 40, 80, 200, 125] : [20, 25, 40, 50, 80]);
    const a = d === 4 ? rng.int(b + 1, b * 2) : rng.int(1, b - 1);
    const val = F(a * 100, b);
    return typed({
      prompt: L(`${a} is what percent of ${b}?`, `${a} تمثل كم بالمئة من ${b}؟`),
      value: val,
      extra: { percent: true },
      suffix: '%',
      correct: same(`${txt(val)}%`),
      mode: 'number',
      errors: [
        [F(a, b), 'percent-decimal'],
        [F(b * 100, a), 'reversed-fraction'],
      ],
      hints: H(
        L('Write it as a fraction: part over whole.', 'اكتبها ككسر: الجزء على الكل.'),
        L(`The fraction is ${a}/${b}.`, `الكسر هو ${a}/${b}.`),
        L('Multiply the fraction by 100.', 'اضرب الكسر في 100.'),
      ),
      steps: [
        L(`Part ÷ whole = ${a} ÷ ${b} = ${txt(F(a, b))}.`, `الجزء ÷ الكل = ${a} ÷ ${b} = ${txt(F(a, b))}.`),
        L(`× 100 → ${txt(val)}%.`, `× 100 ← ${txt(val)}%.`),
      ],
      explanation: L('Percent = (part ÷ whole) × 100.', 'النسبة المئوية = (الجزء ÷ الكل) × 100.'),
    });
  }),

  G('reverse', 'percent-of', 'type-answer', [3, 4, 5], (rng, d) => {
    const p = rng.pick(d === 3 ? [10, 20, 25, 50] : d === 4 ? [5, 15, 30, 40, 60, 75] : [12, 35, 45, 80, 120]);
    const whole = 20 * rng.int(2, 20);
    const part = F(p * whole, 100);
    return typed({
      prompt: L(`${p}% of a number is ${txt(part)}. What is the number?`, `${p}% من عدد تساوي ${txt(part)}. ما هو العدد؟`),
      value: whole,
      errors: [
        [part.mul(F(p)).div(F(100)), 'percent-base'],
        [part.mul(F(p)), 'percent-decimal'],
      ],
      hints: H(
        L('First find what 1% is.', 'أوجد أولًا قيمة 1%.'),
        L(`1% = ${txt(part)} ÷ ${p}.`, `1% = ${txt(part)} ÷ ${p}.`),
        L('Then multiply by 100 for the whole.', 'ثم اضرب في 100 لتحصل على الكل.'),
      ),
      steps: [
        L(`1% = ${txt(part)} ÷ ${p} = ${txt(part.div(F(p)))}.`, `1% = ${txt(part)} ÷ ${p} = ${txt(part.div(F(p)))}.`),
        L(`100% = ${txt(part.div(F(p)))} × 100 = ${whole}.`, `100% = ${txt(part.div(F(p)))} × 100 = ${whole}.`),
      ],
      explanation: L('When the part is known, divide by the percent and multiply by 100 to find the whole.', 'إذا عرفت الجزء فاقسمه على النسبة ثم اضرب في 100 لتجد الكل.'),
    });
  }),

  G('class-story', 'percent-of', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const c = pctCase(rng, Math.min(d, 4));
    const total = c.base;
    const yes = ofPct(c);
    const asksYes = rng.chance(0.5);
    const ans = asksYes ? yes : F(total).sub(yes);
    const who = rng.pick([
      { en: 'students in a class', ar: 'طالبًا في صف', like: { en: 'walk to school', ar: 'يذهبون إلى المدرسة مشيًا' } },
      { en: 'people in a survey', ar: 'شخصًا في استطلاع', like: { en: 'prefer tea', ar: 'يفضّلون الشاي' } },
      { en: 'visitors at a museum', ar: 'زائرًا في متحف', like: { en: 'came by bus', ar: 'جاؤوا بالحافلة' } },
    ]);
    return typed({
      prompt: L(
        `There are ${total} ${who.en}. ${txt(c.p)}% of them ${who.like.en}. How many ${asksYes ? 'do' : 'do not'}?`,
        `يوجد ${total} ${who.ar}. ${txt(c.p)}% منهم ${who.like.ar}. كم منهم ${asksYes ? '' : 'لا '}${asksYes ? 'يفعل ذلك' : 'يفعل ذلك'}؟`,
      ),
      value: ans,
      correct: same(txt(ans)),
      errors: asksYes ? [[c.p, 'percent-base']] : [[yes, 'wrong-operation']],
      hints: H(
        L(`Find ${txt(c.p)}% of ${total} first.`, `أوجد أولًا ${txt(c.p)}% من ${total}.`),
        L(`${txt(c.p)}% of ${total} = ${txt(yes)}.`, `${txt(c.p)}% من ${total} = ${txt(yes)}.`),
        asksYes ? L('That is the answer.', 'وهذه هي الإجابة.') : L(`Subtract from ${total}.`, `اطرح من ${total}.`),
      ),
      steps: asksYes
        ? [L(`${txt(c.p.div(F(100)))} × ${total} = ${txt(yes)}.`, `${txt(c.p.div(F(100)))} × ${total} = ${txt(yes)}.`)]
        : [
            L(`${txt(c.p.div(F(100)))} × ${total} = ${txt(yes)} do.`, `${txt(c.p.div(F(100)))} × ${total} = ${txt(yes)} يفعلون.`),
            L(`${total} − ${txt(yes)} = ${txt(ans)} do not.`, `${total} − ${txt(yes)} = ${txt(ans)} لا يفعلون.`),
          ],
      explanation: L('Turn the percent into a decimal, multiply, then add or subtract as the question asks.', 'حوّل النسبة إلى عدد عشري واضرب، ثم اجمع أو اطرح حسب السؤال.'),
    });
  }),

  G('which-expression', 'percent-of', 'select-formula', [2, 3, 4, 5], (rng, d) => {
    const p = rng.pick(d === 2 ? [20, 25, 30] : [12, 15, 35, 45]);
    const n = rng.pick([40, 60, 80, 120, 150, 250]);
    return mcqText(rng, {
      prompt: L(`Which expression calculates ${p}% of ${n}?`, `أي تعبير يحسب ${p}% من ${n}؟`),
      correct: same(mt(`\\frac{${p}}{100} \\times ${n}`)),
      wrongs: [
        { label: same(mt(`${p} \\times ${n}`)), pid: 'percent-decimal' },
        { label: same(mt(`\\frac{${n}}{${p}}`)), pid: 'reversed-fraction' },
        { label: same(mt(`\\frac{${p}}{${n}} \\times 100`)), pid: 'percent-base' },
        { label: same(mt(`${n} + \\frac{${p}}{100}`)), pid: 'wrong-operation' },
      ],
      hints: H(
        L('Percent means "per hundred".', 'النسبة المئوية تعني «لكل مئة».'),
        L('"Of" signals multiplication.', 'كلمة «من» تدل على الضرب.'),
        L(`Write ${p}% as ${p}/100, then multiply by ${n}.`, `اكتب ${p}% على صورة ${p}/100 ثم اضرب في ${n}.`),
      ),
      steps: [
        L(`${p}% = ${p}/100.`, `${p}% = ${p}/100.`),
        L(`"of ${n}" → × ${n}.`, `«من ${n}» ← × ${n}.`),
      ],
      explanation: L('Percent of a number = (percent / 100) × number.', 'النسبة المئوية من عدد = (النسبة / 100) × العدد.'),
    });
  }),
];

// ───────────────────────── Discounts and prices ─────────────────────────

const discounts: Generator[] = [
  G('sale-price', 'discounts', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const c = pctCase(rng, Math.min(d, 4));
    const save = ofPct(c);
    const final = F(c.base).sub(save);
    const item = rng.pick([
      { en: 'jacket', ar: 'سترة' },
      { en: 'backpack', ar: 'حقيبة' },
      { en: 'pair of shoes', ar: 'حذاء' },
      { en: 'book', ar: 'كتاب' },
    ]);
    return typed({
      prompt: L(
        `A ${item.en} costs ${c.base} dollars. It is on sale for ${txt(c.p)}% off. What is the sale price in dollars?`,
        `ثمن ${item.ar} هو ${c.base} دولارًا. عليه تخفيض ${txt(c.p)}%. ما سعره بعد التخفيض بالدولار؟`,
      ),
      value: final,
      correct: same(mnyS(final)),
      errors: [
        [save, 'wrong-operation'],
        [F(c.base).add(save), 'wrong-operation'],
        [F(c.base).sub(c.p), 'percent-base'],
      ],
      hints: H(
        L('First find how much is taken off.', 'أوجد أولًا قيمة التخفيض.'),
        L(`Discount = ${txt(c.p)}% of ${c.base} = ${txt(save)}.`, `التخفيض = ${txt(c.p)}% من ${c.base} = ${txt(save)}.`),
        L('Subtract the discount from the price.', 'اطرح التخفيض من السعر.'),
      ),
      steps: [
        L(`Discount: ${txt(c.p.div(F(100)))} × ${c.base} = ${txt(save)}.`, `التخفيض: ${txt(c.p.div(F(100)))} × ${c.base} = ${txt(save)}.`),
        L(`Sale price: ${c.base} − ${txt(save)} = ${txt(final)}.`, `السعر بعد التخفيض: ${c.base} − ${txt(save)} = ${txt(final)}.`),
      ],
      explanation: L('Sale price = original price − discount, where discount = percent × original price.', 'السعر بعد التخفيض = السعر الأصلي − التخفيض، والتخفيض = النسبة × السعر الأصلي.'),
    });
  }),

  G('savings', 'discounts', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const c = pctCase(rng, Math.min(d, 4));
    const save = ofPct(c);
    return mcqNum(rng, {
      prompt: L(
        `A shop gives ${txt(c.p)}% off an item that costs ${c.base} dollars. How many dollars do you save?`,
        `يعطي متجر تخفيضًا ${txt(c.p)}% على سلعة ثمنها ${c.base} دولارًا. كم دولارًا توفّر؟`,
      ),
      correct: save,
      show: (f) => mnyS(f),
      cands: [
        { v: F(c.base).sub(save), pid: 'wrong-operation' },
        { v: c.p, pid: 'percent-base' },
        { v: save.mul(F(10)), pid: 'percent-decimal' },
        { v: save.div(F(10)), pid: 'percent-decimal' },
      ],
      hints: H(
        L('Savings = the discount amount.', 'الوفر هو قيمة التخفيض نفسها.'),
        L('Find the percent of the price.', 'أوجد النسبة المئوية من السعر.'),
        L(`${txt(c.p.div(F(100)))} × ${c.base}.`, `${txt(c.p.div(F(100)))} × ${c.base}.`),
      ),
      steps: [L(`${txt(c.p)}% of ${c.base} = ${txt(save)}.`, `${txt(c.p)}% من ${c.base} = ${txt(save)}.`)],
      explanation: L('What you save is the percent of the original price, not the final price.', 'ما توفّره هو نسبة من السعر الأصلي وليس من السعر النهائي.'),
    });
  }),

  G('compare-deals', 'discounts', 'compare', [2, 3, 4, 5], (rng, d) => {
    const priceA = 20 * rng.int(2 + d, 6 + d * 2);
    const pa = F(rng.pick(d <= 3 ? [10, 20, 25, 30, 50] : [15, 35, 40, 45]));
    const finalA = F(priceA).sub(pa.mul(F(priceA)).div(F(100)));
    const offB = 5 * rng.int(1, Math.max(2, Math.floor(priceA / 15)));
    const priceB = priceA + (rng.chance(0.5) ? 0 : 10 * rng.int(-2, 3));
    const finalB = F(priceB - offB);
    return compareBody({
      prompt: L(
        `Shop A sells an item at ${priceA} dollars with ${txt(pa)}% off. Shop B sells it at ${priceB} dollars with ${offB} dollars off. Compare the final prices.`,
        `يبيع المتجر A سلعة بسعر ${priceA} دولارًا مع تخفيض ${txt(pa)}%. ويبيعها المتجر B بسعر ${priceB} دولارًا مع تخفيض ${offB} دولارات. قارن بين السعرين النهائيين.`,
      ),
      a: finalA,
      b: finalB,
      aTex: '\\text{A}',
      bTex: '\\text{B}',
      pids: { lt: 'wrong-operation', eq: 'wrong-operation', gt: 'wrong-operation' },
      hints: H(
        L('Work out each final price separately.', 'احسب كل سعر نهائي على حدة.'),
        L(`A: ${priceA} − ${txt(pa)}% of ${priceA}.`, `A: ${priceA} − ${txt(pa)}% من ${priceA}.`),
        L(`B: ${priceB} − ${offB}.`, `B: ${priceB} − ${offB}.`),
      ),
      steps: [
        L(`A = ${priceA} − ${txt(F(priceA).mul(pa).div(F(100)))} = ${txt(finalA)}.`, `A = ${priceA} − ${txt(F(priceA).mul(pa).div(F(100)))} = ${txt(finalA)}.`),
        L(`B = ${priceB} − ${offB} = ${txt(finalB)}.`, `B = ${priceB} − ${offB} = ${txt(finalB)}.`),
        L('Compare the two results.', 'قارن بين الناتجين.'),
      ],
      explanation: L('A percent discount and a fixed discount can only be compared after both final prices are known.', 'لا يمكن مقارنة التخفيض بالنسبة والتخفيض بمبلغ ثابت إلا بعد معرفة السعرين النهائيين.'),
    });
  }),

  G('with-tax', 'discounts', 'mcq', [2, 3, 4, 5], (rng, d) => {
    const price = 20 * rng.int(2, 10 + d * 2);
    const tax = rng.pick(d <= 3 ? [5, 10, 20] : [8, 12, 15, 25]);
    const extra = F(price * tax, 100);
    const total = F(price).add(extra);
    return mcqNum(rng, {
      prompt: L(
        `A meal costs ${price} dollars. A ${tax}% tax is added. What is the total in dollars?`,
        `تكلفة وجبة ${price} دولارًا. تُضاف ضريبة ${tax}%. ما المجموع بالدولار؟`,
      ),
      correct: total,
      show: (f) => mnyS(f),
      cands: [
        { v: extra, pid: 'wrong-operation' },
        { v: F(price).sub(extra), pid: 'wrong-operation' },
        { v: F(price + tax), pid: 'percent-base' },
        { v: total.mul(F(10)), pid: 'percent-decimal' },
      ],
      hints: H(
        L('Find the tax first.', 'أوجد الضريبة أولًا.'),
        L(`Tax = ${tax}% of ${price} = ${txt(extra)}.`, `الضريبة = ${tax}% من ${price} = ${txt(extra)}.`),
        L('Add the tax to the price.', 'أضف الضريبة إلى السعر.'),
      ),
      steps: [
        L(`Tax: ${tax}% of ${price} = ${txt(extra)}.`, `الضريبة: ${tax}% من ${price} = ${txt(extra)}.`),
        L(`Total: ${price} + ${txt(extra)} = ${txt(total)}.`, `المجموع: ${price} + ${txt(extra)} = ${txt(total)}.`),
      ],
      explanation: L('A percent increase is found like a discount, but you add it instead of subtracting.', 'الزيادة بنسبة مئوية تُحسب مثل التخفيض لكنها تُضاف بدل أن تُطرح.'),
    });
  }),

  G('stacked', 'discounts', 'true-false', [3, 4, 5], (rng) => {
    const a = rng.pick([10, 20, 25, 30]);
    const b = rng.pick([10, 20, 5]);
    const kind = rng.int(0, 2);
    if (kind === 0) {
      return tfBody({
        prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
        display: `\\text{${a}\\% off, then ${b}\\% off more} = \\text{${a + b}\\% off}`,
        truth: false,
        pid: 'percent-base',
        hints: H(
          L('The second discount applies to a smaller price.', 'التخفيض الثاني يُحسب على سعر أصغر.'),
          L('Try a price of 100.', 'جرّب سعرًا قدره 100.'),
          L(`After ${a}% off: ${100 - a}. Then ${b}% of ${100 - a} is less than ${b}.`, `بعد ${a}%: ${100 - a}. ثم ${b}% من ${100 - a} أقل من ${b}.`),
        ),
        steps: [
          L(`Price 100 → ${100 - a} after ${a}% off.`, `السعر 100 ← ${100 - a} بعد تخفيض ${a}%.`),
          L(`Second discount: ${b}% of ${100 - a} = ${txt(F(b * (100 - a), 100))}, less than ${b}.`, `التخفيض الثاني: ${b}% من ${100 - a} = ${txt(F(b * (100 - a), 100))} وهو أقل من ${b}.`),
          L(`Total off is less than ${a + b}%, so it is false.`, `إجمالي التخفيض أقل من ${a + b}% فالعبارة خاطئة.`),
        ],
        explanation: L('Successive percents are applied one after another to a changing price, so they do not simply add.', 'النسب المتتالية تُطبَّق واحدة بعد أخرى على سعر متغيّر فلا تُجمع ببساطة.'),
      });
    }
    if (kind === 1) {
      return tfBody({
        prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
        display: `\\text{A price goes up ${a}\\%, then down ${a}\\%: it returns to the start}`,
        truth: false,
        pid: 'percent-base',
        hints: H(
          L('Each percent is of a different amount.', 'كل نسبة تُحسب من مقدار مختلف.'),
          L('Try a price of 100.', 'جرّب سعرًا قدره 100.'),
          L(`100 + ${a} = ${100 + a}; then take ${a}% of ${100 + a}.`, `100 + ${a} = ${100 + a}؛ ثم احسب ${a}% من ${100 + a}.`),
        ),
        steps: [
          L(`100 → ${100 + a} after the rise.`, `100 ← ${100 + a} بعد الزيادة.`),
          L(`${a}% of ${100 + a} = ${txt(F(a * (100 + a), 100))}.`, `${a}% من ${100 + a} = ${txt(F(a * (100 + a), 100))}.`),
          L(`${100 + a} − ${txt(F(a * (100 + a), 100))} = ${txt(F(100 + a).sub(F(a * (100 + a), 100)))}, not 100.`, `${100 + a} − ${txt(F(a * (100 + a), 100))} = ${txt(F(100 + a).sub(F(a * (100 + a), 100)))} وليس 100.`),
        ],
        explanation: L('The decrease is taken from the larger number, so the price ends lower than where it started.', 'يُحسب النقص من العدد الأكبر لذا ينتهي السعر أقل مما بدأ.'),
      });
    }
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${a}\\% \\text{ off a price of } 100 \\text{ gives } ${100 - a}`,
      truth: true,
      pid: 'wrong-operation',
      hints: H(
        L('Take the discount from 100.', 'اطرح التخفيض من 100.'),
        L(`${a}% of 100 = ${a}.`, `${a}% من 100 = ${a}.`),
        L(`100 − ${a}.`, `100 − ${a}.`),
      ),
      steps: [L(`${a}% of 100 = ${a}, so 100 − ${a} = ${100 - a}. The statement is true.`, `${a}% من 100 = ${a} فيكون 100 − ${a} = ${100 - a}. العبارة صحيحة.`)],
      explanation: L('Percents are easiest to see on a price of 100.', 'أسهل طريقة لفهم النسب أن نتخيّل سعرًا قدره 100.'),
    });
  }),

  G('original-price', 'discounts', 'word-problem', [4, 5], (rng, d) => {
    const p = rng.pick(d === 4 ? [10, 20, 25, 50] : [15, 30, 40, 60, 75]);
    const orig = 20 * rng.int(3, 20);
    const sale = F(orig * (100 - p), 100);
    return typed({
      prompt: L(
        `After a ${p}% discount, a bike costs ${txt(sale)} dollars. What was the original price in dollars?`,
        `بعد تخفيض ${p}% أصبح ثمن دراجة ${txt(sale)} دولارًا. ما السعر الأصلي بالدولار؟`,
      ),
      value: orig,
      errors: [
        [sale.add(sale.mul(F(p)).div(F(100))), 'percent-base'],
        [sale.add(F(p)), 'percent-base'],
      ],
      hints: H(
        L(`The sale price is ${100 - p}% of the original.`, `السعر بعد التخفيض يمثل ${100 - p}% من السعر الأصلي.`),
        L(`Find 1%: ${txt(sale)} ÷ ${100 - p}.`, `أوجد 1%: ${txt(sale)} ÷ ${100 - p}.`),
        L('Multiply by 100.', 'اضرب في 100.'),
      ),
      steps: [
        L(`${100 - p}% of the price = ${txt(sale)}.`, `${100 - p}% من السعر = ${txt(sale)}.`),
        L(`1% = ${txt(sale.div(F(100 - p)))}.`, `1% = ${txt(sale.div(F(100 - p)))}.`),
        L(`100% = ${orig}.`, `100% = ${orig}.`),
      ],
      explanation: L('Adding the discount back to the sale price is wrong, because the discount was a percent of the larger original price.', 'إضافة التخفيض إلى السعر الجديد خطأ لأن التخفيض كان نسبة من السعر الأصلي الأكبر.'),
    });
  }),
];

// ───────────────────────── Ratios ─────────────────────────

function coprimePair(rng: Rng, max: number): [number, number] {
  for (let i = 0; i < 100; i++) {
    const a = rng.int(1, max);
    const b = rng.int(1, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
  return [2, 3];
}

const ratios: Generator[] = [
  G('fill-equal', 'ratios', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const [a, b] = coprimePair(rng, 3 + d * 2);
    const k = rng.int(2, 2 + d);
    return typed({
      prompt: L('Find the missing number so the ratios are equal.', 'أوجد العدد الناقص لتتساوى النسبتان.'),
      display: `${a * k} : ${b * k} = ${a} : \\square`,
      value: b,
      extra: { integerOnly: true },
      errors: [[b * k - (a * k - a), 'additive-proportion']],
      hints: H(
        L('Equal ratios come from dividing both numbers by the same amount.', 'النسب المتساوية تنتج من قسمة العددين على المقدار نفسه.'),
        L(`${a * k} ÷ ${k} = ${a}.`, `${a * k} ÷ ${k} = ${a}.`),
        L(`Divide ${b * k} by ${k} too.`, `اقسم ${b * k} على ${k} أيضًا.`),
      ),
      steps: [
        L(`${a * k} ÷ ${k} = ${a}, so divide by ${k}.`, `${a * k} ÷ ${k} = ${a} فنقسم على ${k}.`),
        L(`${b * k} ÷ ${k} = ${b}.`, `${b * k} ÷ ${k} = ${b}.`),
      ],
      explanation: L('Multiply or divide both parts of a ratio by the same number — never add or subtract.', 'اضرب جزأي النسبة أو اقسمهما على العدد نفسه، ولا تجمع ولا تطرح.'),
    });
  }),

  G('share', 'ratios', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const [a, b] = coprimePair(rng, 2 + d);
    const k = rng.int(2, 4 + d * 2);
    const total = (a + b) * k;
    const askBig = rng.chance(0.5);
    const big = Math.max(a, b) * k;
    const small = Math.min(a, b) * k;
    const p = person(rng);
    const q = person(rng);
    const ans = askBig ? big : small;
    const wrongOther = askBig ? small : big;
    return typed({
      prompt: L(
        `${p.en} and ${q.en} share ${total} stickers in the ratio ${a} : ${b}. How many stickers does the ${askBig ? 'larger' : 'smaller'} share contain?`,
        `يتقاسم ${p.ar} و${q.ar} ${total} ملصقًا بنسبة ${a} : ${b}. كم ملصقًا في الحصة ${askBig ? 'الأكبر' : 'الأصغر'}؟`,
      ),
      value: ans,
      errors: [
        [F(total, 2), 'wrong-operation'],
        [wrongOther, 'ratio-order'],
      ],
      hints: H(
        L('Add the ratio parts to count the equal parts.', 'اجمع أجزاء النسبة لتعرف عدد الأجزاء المتساوية.'),
        L(`${a} + ${b} = ${a + b} parts, so one part is ${total} ÷ ${a + b}.`, `${a} + ${b} = ${a + b} أجزاء، فالجزء الواحد هو ${total} ÷ ${a + b}.`),
        L('Multiply one part by the share you need.', 'اضرب قيمة الجزء الواحد في عدد الأجزاء المطلوبة.'),
      ),
      steps: [
        L(`Parts: ${a} + ${b} = ${a + b}.`, `الأجزاء: ${a} + ${b} = ${a + b}.`),
        L(`One part: ${total} ÷ ${a + b} = ${k}.`, `الجزء الواحد: ${total} ÷ ${a + b} = ${k}.`),
        L(`${askBig ? 'Larger' : 'Smaller'} share: ${Math.max(a, b) * (askBig ? 1 : 0) + Math.min(a, b) * (askBig ? 0 : 1)} × ${k} = ${ans}.`, `الحصة ${askBig ? 'الأكبر' : 'الأصغر'}: ${Math.max(a, b) * (askBig ? 1 : 0) + Math.min(a, b) * (askBig ? 0 : 1)} × ${k} = ${ans}.`),
      ],
      explanation: L('Find the value of one part first; every share is a number of parts.', 'أوجد قيمة الجزء الواحد أولًا؛ فكل حصة هي عدد من الأجزاء.'),
    });
  }),

  G('part-of-whole', 'ratios', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const a = rng.int(1, 3 + d);
    const b = differ(rng, 1, 4 + d, a);
    const c = d >= 4 ? rng.int(1, 4 + d) : 0;
    const total = a + b + c;
    const color = rng.pick([
      { x: 'red', y: 'blue', z: 'green', xa: 'حمراء', ya: 'زرقاء', za: 'خضراء' },
      { x: 'boys', y: 'girls', z: 'teachers', xa: 'أولاد', ya: 'بنات', za: 'معلمون' },
    ]);
    const asksY = d >= 3 && rng.chance(0.5);
    const val = F(asksY ? b : a, total);
    const mine = asksY ? b : a;
    const other = asksY ? a : b;
    const mineEn = asksY ? color.y : color.x;
    const mineAr = asksY ? color.ya : color.xa;
    const enText =
      c > 0
        ? `A group has ${a} ${color.x}, ${b} ${color.y} and ${c} ${color.z}. What fraction of the group is ${mineEn}?`
        : `A group has ${a} ${color.x} and ${b} ${color.y}. What fraction of the group is ${mineEn}?`;
    const arText =
      c > 0
        ? `في مجموعة ${a} ${color.xa} و${b} ${color.ya} و${c} ${color.za}. ما الكسر الذي تمثله ${mineAr} من المجموعة؟`
        : `في مجموعة ${a} ${color.xa} و${b} ${color.ya}. ما الكسر الذي تمثله ${mineAr} من المجموعة؟`;
    return mcqNum(rng, {
      prompt: L(enText, arText),
      correct: val,
      cands: [
        { v: F(mine, other), pid: 'part-whole-ratio' },
        { v: F(other, total), pid: 'ratio-order' },
        { v: F(other, mine), pid: 'part-whole-ratio' },
        { v: F(mine, total + 1), pid: 'off-by-one' },
      ],
      hints: H(
        L('A fraction of the group is part ÷ whole.', 'كسر المجموعة هو الجزء ÷ الكل.'),
        L('The whole is the total of all parts.', 'الكل هو مجموع كل الأجزاء.'),
        L(`Whole = ${total}.`, `الكل = ${total}.`),
      ),
      steps: [
        L(`Whole = ${total}.`, `الكل = ${total}.`),
        L(`Fraction = ${mine}/${total}.`, `الكسر = ${mine}/${total}.`),
      ],
      explanation: L('A part-to-part ratio compares groups; a fraction compares a group to the whole.', 'النسبة بين جزأين تقارن مجموعتين، أما الكسر فيقارن مجموعة بالكل.'),
    });
  }),

  G('simplify', 'ratios', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const [a0, b0] = coprimePair(rng, 3 + d);
    const g = rng.pick(d <= 2 ? [2, 3, 4] : d <= 3 ? [4, 5, 6] : [6, 8, 9, 12]);
    const a = a0 * g;
    const b = b0 * g;
    const half = g % 2 === 0 ? g / 2 : g % 3 === 0 ? g / 3 : 1;
    return mcqText(rng, {
      prompt: L('Write this ratio in its simplest form.', 'اكتب هذه النسبة في أبسط صورة.'),
      display: `${a} : ${b}`,
      correct: same(`${a0} : ${b0}`),
      wrongs: [
        { label: same(`${b0} : ${a0}`), pid: 'ratio-order' },
        { label: same(half > 1 ? `${a / half} : ${b / half}` : `${a} : ${b0}`), pid: 'not-simplified' },
        { label: same(`${a0 + 1} : ${b0 + 1}`), pid: 'additive-proportion' },
        { label: same(`${a0} : ${b0 + 1}`), pid: 'off-by-one' },
        { label: same(`${a0 * 2} : ${b0 * 2}`), pid: 'not-simplified' },
      ],
      hints: H(
        L('Find a number that divides both parts.', 'ابحث عن عدد يقسم الجزأين معًا.'),
        L(`The greatest common factor is ${g}.`, `العامل المشترك الأكبر هو ${g}.`),
        L(`Divide both parts by ${g}.`, `اقسم الجزأين على ${g}.`),
      ),
      steps: [
        L(`GCF of ${a} and ${b} is ${g}.`, `العامل المشترك الأكبر لـ ${a} و${b} هو ${g}.`),
        L(`${a} ÷ ${g} = ${a0}, ${b} ÷ ${g} = ${b0}.`, `${a} ÷ ${g} = ${a0}، ${b} ÷ ${g} = ${b0}.`),
      ],
      explanation: L('Simplify a ratio like a fraction: divide both parts by their greatest common factor.', 'اختصر النسبة كما تختصر الكسر: اقسم الجزأين على عاملهما المشترك الأكبر.'),
    });
  }),
];

// ───────────────────────── Proportions ─────────────────────────

const proportions: Generator[] = [
  G('unit-rate', 'proportions', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const n1 = rng.int(2, 4 + d * 2);
    const unit = d <= 2 ? rng.int(2, 9) : d <= 4 ? rng.int(3, 15) : rng.int(5, 40) / 2;
    const c1 = F(n1).mul(F(Math.round(unit * 2), 2));
    const n2 = differ(rng, 2, 6 + d * 4, n1);
    const c2 = c1.div(F(n1)).mul(F(n2));
    const item = rng.pick([
      { en: 'notebooks', ar: 'دفاتر' },
      { en: 'oranges', ar: 'برتقالات' },
      { en: 'tickets', ar: 'تذاكر' },
    ]);
    return typed({
      prompt: L(
        `${n1} ${item.en} cost ${txt(c1)} dollars. How much do ${n2} ${item.en} cost, at the same price each?`,
        `ثمن ${n1} من ${item.ar} هو ${txt(c1)} دولارًا. كم ثمن ${n2} منها بالسعر نفسه للواحدة؟`,
      ),
      value: c2,
      correct: same(txt(c2)),
      errors: [
        [c1.add(F(n2 - n1)), 'additive-proportion'],
        [c1.div(F(n1)), 'wrong-operation'],
      ],
      hints: H(
        L('Find the price of one first.', 'أوجد ثمن الواحدة أولًا.'),
        L(`One costs ${txt(c1)} ÷ ${n1} = ${txt(c1.div(F(n1)))}.`, `ثمن الواحدة ${txt(c1)} ÷ ${n1} = ${txt(c1.div(F(n1)))}.`),
        L(`Multiply by ${n2}.`, `اضرب في ${n2}.`),
      ),
      steps: [
        L(`Unit price: ${txt(c1)} ÷ ${n1} = ${txt(c1.div(F(n1)))}.`, `ثمن الواحدة: ${txt(c1)} ÷ ${n1} = ${txt(c1.div(F(n1)))}.`),
        L(`${n2} × ${txt(c1.div(F(n1)))} = ${txt(c2)}.`, `${n2} × ${txt(c1.div(F(n1)))} = ${txt(c2)}.`),
      ],
      explanation: L('Divide to find the value of one, then multiply to find the value of many.', 'اقسم لتجد قيمة الواحد ثم اضرب لتجد قيمة العدد المطلوب.'),
    });
  }),

  G('solve-blank', 'proportions', 'fill-blank', [1, 2, 3, 4, 5], (rng, d) => {
    const a = rng.int(2, 4 + d * 2);
    const b = differ(rng, 2, 5 + d * 2, a);
    const k = rng.int(2, 3 + d);
    const blankFirst = rng.chance(0.5);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: blankFirst ? `${a} : ${b} = \\square : ${b * k}` : `${a} : ${b} = ${a * k} : \\square`,
      value: blankFirst ? a * k : b * k,
      extra: { integerOnly: true },
      errors: [[blankFirst ? a + (b * k - b) : b + (a * k - a), 'additive-proportion']],
      hints: H(
        L('Find the scale factor between the two known numbers.', 'أوجد عامل التكبير بين العددين المعروفين.'),
        L(blankFirst ? `${b} × ${k} = ${b * k}.` : `${a} × ${k} = ${a * k}.`, blankFirst ? `${b} × ${k} = ${b * k}.` : `${a} × ${k} = ${a * k}.`),
        L(`Apply the factor ${k} to the other number.`, `طبّق العامل ${k} على العدد الآخر.`),
      ),
      steps: [
        L(`The scale factor is ${k}.`, `عامل التكبير هو ${k}.`),
        L(blankFirst ? `${a} × ${k} = ${a * k}.` : `${b} × ${k} = ${b * k}.`, blankFirst ? `${a} × ${k} = ${a * k}.` : `${b} × ${k} = ${b * k}.`),
      ],
      explanation: L('In a proportion both parts are multiplied by the same factor.', 'في التناسب يُضرب الجزءان في العامل نفسه.'),
    });
  }),

  G('recipe', 'proportions', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const people = rng.pick([2, 4, 6]);
    const cups = rng.int(1, 3 + d);
    const need = people * rng.int(2, 3 + d);
    const val = F(cups * need, people);
    return typed({
      prompt: L(
        `A recipe for ${people} people uses ${cups} cups of flour. How many cups are needed for ${need} people?`,
        `تحتاج وصفة لـ ${people} أشخاص إلى ${cups} أكواب من الدقيق. كم كوبًا نحتاج لـ ${need} شخصًا؟`,
      ),
      value: val,
      correct: same(txt(val)),
      errors: [
        [F(cups + (need - people)), 'additive-proportion'],
        [F(cups * need), 'wrong-operation'],
      ],
      hints: H(
        L('How many times bigger is the new group?', 'كم مرة تكبر المجموعة الجديدة؟'),
        L(`${need} ÷ ${people} = ${txt(F(need, people))}.`, `${need} ÷ ${people} = ${txt(F(need, people))}.`),
        L('Multiply the flour by the same factor.', 'اضرب كمية الدقيق في العامل نفسه.'),
      ),
      steps: [
        L(`Scale factor: ${need} ÷ ${people} = ${txt(F(need, people))}.`, `عامل التكبير: ${need} ÷ ${people} = ${txt(F(need, people))}.`),
        L(`Flour: ${cups} × ${txt(F(need, people))} = ${txt(val)} cups.`, `الدقيق: ${cups} × ${txt(F(need, people))} = ${txt(val)} أكواب.`),
      ],
      explanation: L('Scale every ingredient by the same factor to keep the taste the same.', 'كبّر كل المكوّنات بالعامل نفسه ليبقى الطعم كما هو.'),
    });
  }),

  G('additive-trap', 'proportions', 'true-false', [2, 3, 4, 5], (rng, d) => {
    const n1 = rng.int(2, 4 + d);
    const unit = rng.int(2, 6);
    const c1 = n1 * unit;
    const n2 = n1 + rng.int(2, 5);
    const truth = rng.chance(0.5);
    const claim = truth ? n2 * unit : c1 + (n2 - n1);
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `\\text{${n1} pens cost ${c1}. So ${n2} pens cost ${claim}.}`,
      truth,
      pid: 'additive-proportion',
      hints: H(
        L('Price grows by multiplying, not by adding the same amount.', 'السعر ينمو بالضرب لا بإضافة المقدار نفسه.'),
        L(`One pen costs ${c1} ÷ ${n1} = ${unit}.`, `ثمن القلم الواحد ${c1} ÷ ${n1} = ${unit}.`),
        L(`${n2} pens cost ${n2} × ${unit}.`, `ثمن ${n2} أقلام هو ${n2} × ${unit}.`),
      ),
      steps: [
        L(`Unit price = ${c1} ÷ ${n1} = ${unit}.`, `ثمن الواحد = ${c1} ÷ ${n1} = ${unit}.`),
        L(`${n2} pens = ${n2} × ${unit} = ${n2 * unit}.`, `ثمن ${n2} أقلام = ${n2} × ${unit} = ${n2 * unit}.`),
        L(truth ? 'This matches the statement.' : `The statement says ${claim}, so it is false.`, truth ? 'تطابق العبارة.' : `العبارة تقول ${claim} فهي خاطئة.`),
      ],
      explanation: L('If the price per item is fixed, the cost is proportional to the quantity.', 'إذا كان سعر الواحد ثابتًا فالتكلفة تتناسب مع الكمية.'),
    });
  }),

  G('set-up', 'proportions', 'select-formula', [2, 3, 4, 5], (rng, d) => {
    const n1 = rng.int(2, 6);
    const n2 = differ(rng, 3, 5 + d * 2, n1);
    const c1 = n1 * rng.int(2, 6);
    return mcqText(rng, {
      prompt: L(
        `${n1} books cost ${c1} dollars. Which equation finds x, the cost of ${n2} books?`,
        `ثمن ${n1} كتب هو ${c1} دولارًا. أي معادلة تجد x، ثمن ${n2} كتب؟`,
      ),
      correct: same(mt(`\\frac{${n1}}{${c1}} = \\frac{${n2}}{x}`)),
      wrongs: [
        { label: same(mt(`\\frac{${n1}}{${c1}} = \\frac{x}{${n2}}`)), pid: 'reversed-fraction' },
        { label: same(mt(`${n1} + ${c1} = ${n2} + x`)), pid: 'additive-proportion' },
        { label: same(mt(`\\frac{${n1}}{${n2}} = \\frac{x}{${c1}}`)), pid: 'reversed-fraction' },
        { label: same(mt(`${n1} \\times ${c1} = ${n2} \\times x`)), pid: 'wrong-operation' },
      ],
      hints: H(
        L('Both sides must compare books to cost in the same order.', 'يجب أن يقارن الطرفان الكتب بالثمن بالترتيب نفسه.'),
        L('Left side: books over cost.', 'الطرف الأيسر: الكتب على الثمن.'),
        L('Right side must also be books over cost.', 'الطرف الأيمن أيضًا يجب أن يكون الكتب على الثمن.'),
      ),
      steps: [
        L(`First rate: ${n1} books / ${c1} dollars.`, `المعدل الأول: ${n1} كتب / ${c1} دولارًا.`),
        L(`Second rate: ${n2} books / x dollars.`, `المعدل الثاني: ${n2} كتب / x دولارًا.`),
        L('Set the two rates equal.', 'نساوي بين المعدلين.'),
      ],
      explanation: L('In a proportion, matching quantities must sit in matching positions.', 'في التناسب يجب أن تقع الكميات المتناظرة في مواضع متناظرة.'),
    });
  }),

  G('speed', 'proportions', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const speed = 10 * rng.int(3, 7 + d);
    const t1 = rng.int(2, 4);
    const t2 = differ(rng, 2, 4 + d, t1);
    const dist1 = speed * t1;
    const dist2 = speed * t2;
    return typed({
      prompt: L(
        `A car travels ${dist1} km in ${t1} hours at a steady speed. How far does it travel in ${t2} hours?`,
        `تقطع سيارة ${dist1} كم في ${t1} ساعات بسرعة ثابتة. كم كيلومترًا تقطع في ${t2} ساعات؟`,
      ),
      value: dist2,
      suffix: 'km',
      errors: [
        [dist1 + (t2 - t1), 'additive-proportion'],
        [speed, 'wrong-operation'],
      ],
      hints: H(
        L('Find the distance covered in 1 hour.', 'أوجد المسافة المقطوعة في ساعة واحدة.'),
        L(`${dist1} ÷ ${t1} = ${speed} km per hour.`, `${dist1} ÷ ${t1} = ${speed} كم في الساعة.`),
        L(`Multiply by ${t2}.`, `اضرب في ${t2}.`),
      ),
      steps: [
        L(`Speed = ${dist1} ÷ ${t1} = ${speed} km/h.`, `السرعة = ${dist1} ÷ ${t1} = ${speed} كم/ساعة.`),
        L(`Distance = ${speed} × ${t2} = ${dist2} km.`, `المسافة = ${speed} × ${t2} = ${dist2} كم.`),
      ],
      explanation: L('At a steady speed, distance is proportional to time.', 'عند السرعة الثابتة تتناسب المسافة مع الزمن.'),
    });
  }),
];

// ───────────────────────── Money and time ─────────────────────────

const two = (n: number): string => String(n).padStart(2, '0');

const moneyTime: Generator[] = [
  G('change', 'money-time', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const paid = rng.pick(d === 1 ? [10, 20] : d === 2 ? [20, 50] : [50, 100]);
    const costC = d === 1 ? 100 * rng.int(2, 9) : d === 2 ? 50 * rng.int(4, 38) : rng.int(paid * 100 * 0.3, paid * 100 - 5);
    const cost = cents(costC);
    const change = F(paid).sub(cost);
    return typed({
      prompt: L(
        `A snack costs ${mnyS(cost)} dollars. You pay with ${paid} dollars. How much change do you get, in dollars?`,
        `ثمن وجبة خفيفة ${mnyS(cost)} دولارًا. تدفع ${paid} دولارًا. كم دولارًا تأخذ باقيًا؟`,
      ),
      value: change,
      correct: same(mnyS(change)),
      errors: [[F(paid).add(cost), 'wrong-operation'], [cost, 'wrong-operation']],
      hints: H(
        L('Change = money paid − cost.', 'الباقي = المبلغ المدفوع − الثمن.'),
        L(`${paid} − ${mnyS(cost)}.`, `${paid} − ${mnyS(cost)}.`),
        L('Count up from the cost to the amount paid if it helps.', 'عُدّ تصاعديًا من الثمن إلى المبلغ المدفوع إن ساعدك ذلك.'),
      ),
      steps: [L(`${paid} − ${mnyS(cost)} = ${mnyS(change)}.`, `${paid} − ${mnyS(cost)} = ${mnyS(change)}.`)],
      explanation: L('Subtract what you owe from what you handed over.', 'اطرح ما تدين به مما دفعته.'),
    });
  }),

  G('minutes-between', 'money-time', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const h1 = rng.int(d <= 2 ? 7 : 8, 14);
    const m1 = d === 1 ? 0 : 5 * rng.int(0, 11);
    const dur = d === 1 ? 30 * rng.int(1, 4) : d === 2 ? 5 * rng.int(4, 24) : rng.int(35, 100 + d * 40);
    const total1 = h1 * 60 + m1;
    const total2 = total1 + dur;
    const h2 = Math.floor(total2 / 60);
    const m2 = total2 % 60;
    return typed({
      prompt: L(
        `A film starts at ${h1}:${two(m1)} and ends at ${h2}:${two(m2)} (24-hour clock). How many minutes long is it?`,
        `يبدأ فيلم عند ${h1}:${two(m1)} وينتهي عند ${h2}:${two(m2)} (بنظام 24 ساعة). كم دقيقة مدته؟`,
      ),
      value: dur,
      suffix: 'min',
      extra: { integerOnly: true },
      errors: [[(h2 * 100 + m2) - (h1 * 100 + m1), 'time-base']],
      hints: H(
        L('There are 60 minutes in an hour, not 100.', 'في الساعة 60 دقيقة وليس 100.'),
        L('Count to the next full hour first.', 'عُدّ أولًا حتى الساعة الكاملة التالية.'),
        L('Add the full hours and the leftover minutes.', 'اجمع الساعات الكاملة والدقائق المتبقية.'),
      ),
      steps: [
        L(`Start: ${h1} × 60 + ${m1} = ${total1} minutes.`, `البداية: ${h1} × 60 + ${m1} = ${total1} دقيقة.`),
        L(`End: ${h2} × 60 + ${m2} = ${total2} minutes.`, `النهاية: ${h2} × 60 + ${m2} = ${total2} دقيقة.`),
        L(`${total2} − ${total1} = ${dur}.`, `${total2} − ${total1} = ${dur}.`),
      ],
      explanation: L('Convert both times to minutes since midnight, then subtract.', 'حوّل الوقتين إلى دقائق منذ منتصف الليل ثم اطرح.'),
    });
  }),

  G('convert-time', 'money-time', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const toHours = d >= 3 && rng.chance(0.5);
    if (toHours) {
      const m = 30 * rng.int(1, 8);
      const hours = F(m, 60);
      return typed({
        prompt: L('Fill in the blank (write a decimal).', 'أكمل الفراغ (اكتب عددًا عشريًا).'),
        display: `${m}\\text{ min} = \\square\\text{ h}`,
        value: hours,
        correct: same(txt(hours)),
        errors: [[F(m, 100), 'time-base']],
        hints: H(
          L('Divide minutes by 60 to get hours.', 'اقسم الدقائق على 60 لتحصل على الساعات.'),
          L(`${m} ÷ 60.`, `${m} ÷ 60.`),
          L('Half an hour is 0.5.', 'نصف الساعة هو 0.5.'),
        ),
        steps: [L(`${m} ÷ 60 = ${txt(hours)}.`, `${m} ÷ 60 = ${txt(hours)}.`)],
        explanation: L('Hours = minutes ÷ 60.', 'الساعات = الدقائق ÷ 60.'),
      });
    }
    const h = rng.int(1, 2 + d);
    const m = d === 1 ? 30 : 5 * rng.int(1, 11);
    return typed({
      prompt: L('Fill in the blank.', 'أكمل الفراغ.'),
      display: `${h}\\text{ h }${m}\\text{ min} = \\square\\text{ min}`,
      value: h * 60 + m,
      extra: { integerOnly: true },
      errors: [[h * 100 + m, 'time-base']],
      hints: H(
        L('1 hour = 60 minutes.', 'الساعة = 60 دقيقة.'),
        L(`${h} hours = ${h} × 60 minutes.`, `${h} ساعات = ${h} × 60 دقيقة.`),
        L(`Then add ${m} more minutes.`, `ثم أضف ${m} دقيقة أخرى.`),
      ),
      steps: [
        L(`${h} × 60 = ${h * 60}.`, `${h} × 60 = ${h * 60}.`),
        L(`${h * 60} + ${m} = ${h * 60 + m}.`, `${h * 60} + ${m} = ${h * 60 + m}.`),
      ],
      explanation: L('Time uses base 60, not base 100.', 'الوقت يعتمد الأساس 60 وليس 100.'),
    });
  }),

  G('unit-price', 'money-time', 'compare', [2, 3, 4, 5], (rng, d) => {
    const nA = rng.int(2, 6 + d);
    const nB = differ(rng, 3, 10 + d, nA);
    const unitA = rng.int(10, 40);
    const same1 = rng.chance(0.15);
    const unitB = same1 ? unitA : unitA + rng.int(-6, 6);
    const aPrice = cents(nA * unitA * 10);
    const bPrice = cents(nB * Math.max(5, unitB) * 10);
    return compareBody({
      prompt: L(
        `Pack A has ${nA} items for ${mnyF(aPrice)} dollars. Pack B has ${nB} items for ${mnyF(bPrice)} dollars. Compare the price of one item in A with one item in B.`,
        `العبوة A فيها ${nA} قطع بسعر ${mnyF(aPrice)} دولارًا. والعبوة B فيها ${nB} قطع بسعر ${mnyF(bPrice)} دولارًا. قارن بين سعر القطعة الواحدة في A وفي B.`,
      ),
      a: aPrice.div(F(nA)),
      b: bPrice.div(F(nB)),
      aTex: '\\text{A}',
      bTex: '\\text{B}',
      pids: { lt: 'wrong-operation', eq: 'wrong-operation', gt: 'wrong-operation' },
      hints: H(
        L('Compare the price of one item, not the whole pack.', 'قارن سعر القطعة الواحدة لا سعر العبوة كلها.'),
        L('Divide each price by its number of items.', 'اقسم كل سعر على عدد قطعه.'),
        L('The smaller unit price is the better deal.', 'سعر القطعة الأقل هو العرض الأفضل.'),
      ),
      steps: [
        L(`A: ${mnyF(aPrice)} ÷ ${nA} = ${txt(aPrice.div(F(nA)))}.`, `A: ${mnyF(aPrice)} ÷ ${nA} = ${txt(aPrice.div(F(nA)))}.`),
        L(`B: ${mnyF(bPrice)} ÷ ${nB} = ${txt(bPrice.div(F(nB)))}.`, `B: ${mnyF(bPrice)} ÷ ${nB} = ${txt(bPrice.div(F(nB)))}.`),
        L('Compare the two unit prices.', 'قارن بين السعرين.'),
      ],
      explanation: L('Unit prices make different pack sizes comparable.', 'سعر الوحدة يجعل العبوات المختلفة قابلة للمقارنة.'),
    });
  }),

  G('shopping-total', 'money-time', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const count = d <= 2 ? 2 : d <= 4 ? 3 : 4;
    const prices: number[] = [];
    for (let i = 0; i < count; i++) prices.push(d === 1 ? 100 * rng.int(1, 9) : d === 2 ? 50 * rng.int(2, 30) : rng.int(95, 2500));
    const total = cents(prices.reduce((s, x) => s + x, 0));
    return typed({
      prompt: L(
        `You buy items costing ${prices.map((p) => mnyF(cents(p))).join(', ')} dollars. What is the total in dollars?`,
        `تشتري سلعًا أسعارها ${prices.map((p) => mnyF(cents(p))).join('، ')} دولارًا. ما المجموع بالدولار؟`,
      ),
      value: total,
      correct: same(mnyF(total)),
      errors: [[total.sub(cents(prices[0] as number)), 'off-by-one']],
      hints: H(
        L('Line up the decimal points.', 'ضع الفواصل العشرية في عمود واحد.'),
        L('Add the cents first, then the dollars.', 'اجمع القروش أولًا ثم الدولارات.'),
        L('Remember to carry from the cents.', 'لا تنسَ الحمل من القروش.'),
      ),
      steps: [L(`${prices.map((p) => mnyF(cents(p))).join(' + ')} = ${mnyF(total)}.`, `${prices.map((p) => mnyF(cents(p))).join(' + ')} = ${mnyF(total)}.`)],
      explanation: L('Adding money is adding decimals with two places.', 'جمع النقود هو جمع أعداد عشرية بمنزلتين.'),
    });
  }),

  G('order-durations', 'money-time', 'ordering', [2, 3, 4, 5], (rng, d) => {
    const count = d <= 2 ? 3 : d === 3 ? 4 : 5;
    const mins = new Set<number>();
    while (mins.size < count) mins.add(5 * rng.int(8, 40));
    const entries = [...mins].map((m) => {
      const h = Math.floor(m / 60);
      const r = m % 60;
      const style = rng.int(0, 2);
      if (style === 0 || m < 60) return { value: F(m), label: L(`${m} min`, `${m} دقيقة`) };
      if (style === 1 || (m * 10) % 60 !== 0) return { value: F(m), label: L(`${h} h ${r} min`, `${h} ساعة و${r} دقيقة`) };
      return { value: F(m), label: same(`${txt(F(m, 60))} h`) };
    });
    return orderBody(rng, {
      prompt: L('Put these durations in order from shortest to longest.', 'رتّب هذه المدد من الأقصر إلى الأطول.'),
      entries,
      hints: H(
        L('Convert every duration to minutes.', 'حوّل كل مدة إلى دقائق.'),
        L('1 hour = 60 minutes.', 'الساعة = 60 دقيقة.'),
        L('Then sort the minutes.', 'ثم رتّب الدقائق.'),
      ),
      steps: [L(`In minutes: ${entries.map((e) => txt(e.value)).join(', ')}.`, `بالدقائق: ${entries.map((e) => txt(e.value)).join('، ')}.`)],
      explanation: L('Use one unit for all values before comparing.', 'استخدم وحدة واحدة لكل القيم قبل المقارنة.'),
    });
  }),
];

// ───────────────────────── Averages ─────────────────────────

function sortedNums(xs: number[]): number[] {
  return xs.slice().sort((a, b) => a - b);
}
const listTex = (xs: number[]): string => xs.join(',\\;');
const listPlain = (xs: number[]): string => xs.join(', ');

/** A list whose mean is exact (integer for small d; terminating decimal for large d). */
function meanList(rng: Rng, d: number): number[] {
  const n = d <= 2 ? rng.int(3, 4) : d === 3 ? rng.int(4, 6) : rng.pick([4, 5, 8]);
  const hi = 6 + d * 6;
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push(rng.int(1, hi));
  if (d <= 3) {
    const rem = xs.reduce((s, x) => s + x, 0) % n;
    xs[n - 1] = (xs[n - 1] as number) + (rem === 0 ? 0 : n - rem);
  }
  return xs;
}
const meanOf = (xs: number[]): Fraction => F(xs.reduce((s, x) => s + x, 0), xs.length);
function medianOf(xs: number[]): Fraction {
  const s = sortedNums(xs);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? F(s[mid] as number) : F((s[mid - 1] as number) + (s[mid] as number), 2);
}

const averages: Generator[] = [
  G('mean', 'average', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const xs = meanList(rng, d);
    const sum = xs.reduce((s, x) => s + x, 0);
    const mean = meanOf(xs);
    return typed({
      prompt: L('Find the mean (average) of these numbers.', 'أوجد المتوسط الحسابي لهذه الأعداد.'),
      display: listTex(xs),
      value: mean,
      correct: same(txt(mean)),
      errors: [
        [F(sum), 'wrong-operation'],
        [medianOf(xs), 'mean-median'],
      ],
      hints: H(
        L('Mean = total ÷ how many numbers.', 'المتوسط = المجموع ÷ عدد الأعداد.'),
        L(`Add them: ${listPlain(xs)}.`, `اجمعها: ${listPlain(xs)}.`),
        L(`Divide the sum by ${xs.length}.`, `اقسم المجموع على ${xs.length}.`),
      ),
      steps: [
        L(`Sum = ${sum}.`, `المجموع = ${sum}.`),
        L(`Count = ${xs.length}.`, `العدد = ${xs.length}.`),
        L(`Mean = ${sum} ÷ ${xs.length} = ${txt(mean)}.`, `المتوسط = ${sum} ÷ ${xs.length} = ${txt(mean)}.`),
      ],
      explanation: L('The mean shares the total equally between all the values.', 'المتوسط يوزّع المجموع بالتساوي على كل القيم.'),
    });
  }),

  G('median', 'average', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const n = d <= 2 ? 5 : d === 3 ? rng.pick([5, 6]) : rng.pick([6, 7, 8]);
    const xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(rng.int(1, 10 + d * 8));
    const shuffled = d === 1 ? sortedNums(xs) : rng.shuffle(xs);
    const med = medianOf(xs);
    const mid = shuffled[Math.floor(n / 2)] as number;
    return typed({
      prompt: L('Find the median of these numbers.', 'أوجد الوسيط لهذه الأعداد.'),
      display: listTex(shuffled),
      value: med,
      correct: same(txt(med)),
      errors: [
        [meanOf(xs), 'mean-median'],
        [F(mid), 'median-unsorted'],
      ],
      hints: H(
        L('Put the numbers in order first.', 'رتّب الأعداد أولًا.'),
        L(`In order: ${listPlain(sortedNums(xs))}.`, `بعد الترتيب: ${listPlain(sortedNums(xs))}.`),
        L(n % 2 === 1 ? 'The median is the middle number.' : 'With two middle numbers, find their mean.', n % 2 === 1 ? 'الوسيط هو العدد الأوسط.' : 'عند وجود عددين في الوسط أوجد متوسطهما.'),
      ),
      steps: [
        L(`Sorted: ${listPlain(sortedNums(xs))}.`, `مرتبة: ${listPlain(sortedNums(xs))}.`),
        L(n % 2 === 1 ? `Middle value = ${txt(med)}.` : `Mean of the two middle values = ${txt(med)}.`, n % 2 === 1 ? `القيمة الوسطى = ${txt(med)}.` : `متوسط القيمتين الوسطيين = ${txt(med)}.`),
      ],
      explanation: L('The median is the middle value of the ordered list.', 'الوسيط هو القيمة الوسطى في القائمة المرتبة.'),
    });
  }),

  G('missing-score', 'average', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const n = d <= 2 ? 3 : d === 3 ? 4 : d === 4 ? 5 : 6;
    const scores: number[] = [];
    for (let i = 0; i < n - 1; i++) scores.push(rng.int(55, 95));
    const rem = scores.reduce((s, x) => s + x, 0) % n;
    const last = 60 + rng.int(0, 5) * 0 + (rem === 0 ? 0 : n - rem) + (60 % n === 0 ? 0 : 0);
    const all = [...scores, Math.max(50, Math.min(100, last))];
    const sum = all.reduce((s, x) => s + x, 0);
    const adj = (n - (sum % n)) % n;
    const fixed = [...scores, Math.min(100, (all[n - 1] as number) + adj)];
    const finalSum = fixed.reduce((s, x) => s + x, 0);
    const avg = finalSum / n;
    const known = scores.reduce((s, x) => s + x, 0);
    const missing = fixed[n - 1] as number;
    const p = person(rng);
    if (!Number.isInteger(avg)) throw new RangeError('average not integer');
    return typed({
      prompt: L(
        `${p.en}'s average mark on ${n} tests is ${avg}. The first ${n - 1} marks are ${listPlain(scores)}. What was the last mark?`,
        `متوسط علامات ${p.ar} في ${n} اختبارات هو ${avg}. العلامات الأولى هي ${listPlain(scores)}. ما العلامة الأخيرة؟`,
      ),
      value: missing,
      errors: [[F(avg), 'wrong-operation'], [F(finalSum), 'wrong-operation']],
      hints: H(
        L('Find the total marks from the average.', 'أوجد مجموع العلامات من المتوسط.'),
        L(`Total = ${avg} × ${n} = ${avg * n}.`, `المجموع = ${avg} × ${n} = ${avg * n}.`),
        L('Subtract the marks you already know.', 'اطرح العلامات المعروفة.'),
      ),
      steps: [
        L(`Total needed: ${avg} × ${n} = ${avg * n}.`, `المجموع المطلوب: ${avg} × ${n} = ${avg * n}.`),
        L(`Known marks add to ${known}.`, `العلامات المعروفة مجموعها ${known}.`),
        L(`Last mark: ${avg * n} − ${known} = ${missing}.`, `العلامة الأخيرة: ${avg * n} − ${known} = ${missing}.`),
      ],
      explanation: L('Mean × count gives the total; subtract the known values to find the missing one.', 'المتوسط × العدد يعطي المجموع؛ اطرح القيم المعروفة لتجد القيمة المفقودة.'),
    });
  }),

  G('claim', 'average', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    const xs = meanList(rng, Math.min(d, 3));
    const mean = meanOf(xs);
    const med = medianOf(xs);
    const truth = rng.chance(0.5);
    const shown = truth ? mean : med.eq(mean) ? mean.add(F(rng.int(1, 3))) : med;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `\\text{The mean of } ${listTex(xs)} \\text{ is } ${txt(shown)}`,
      truth,
      pid: med.eq(shown) ? 'mean-median' : 'wrong-operation',
      hints: H(
        L('Add all the numbers.', 'اجمع كل الأعداد.'),
        L('Divide by how many there are.', 'اقسم على عددها.'),
        L('Compare with the number in the statement.', 'قارن بالعدد المذكور في العبارة.'),
      ),
      steps: [
        L(`${listPlain(xs)} add to ${xs.reduce((s, x) => s + x, 0)}.`, `مجموع ${listPlain(xs)} هو ${xs.reduce((s, x) => s + x, 0)}.`),
        L(`Mean = ${txt(mean)}.`, `المتوسط = ${txt(mean)}.`),
        L(truth ? 'It matches, so the statement is true.' : `It is not ${txt(shown)}, so the statement is false.`, truth ? 'يطابق فالعبارة صحيحة.' : `ليس ${txt(shown)} فالعبارة خاطئة.`),
      ],
      explanation: L('Mean and median can differ; check which one you are asked for.', 'قد يختلف المتوسط عن الوسيط؛ انتبه إلى المطلوب منهما.'),
    });
  }),

  G('range', 'average', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const n = rng.int(4, 5 + d);
    const xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(rng.int(1, 20 + d * 20));
    const hi = Math.max(...xs);
    const lo = Math.min(...xs);
    if (hi === lo) throw new RangeError('flat list');
    return typed({
      prompt: L('Fill in the blank.', 'أكمل الفراغ.'),
      display: `\\text{Range of } ${listTex(xs)} = \\square`,
      value: hi - lo,
      extra: { integerOnly: true },
      errors: [[hi, 'wrong-operation']],
      hints: H(
        L('Range = largest − smallest.', 'المدى = الأكبر − الأصغر.'),
        L(`Largest = ${hi}, smallest = ${lo}.`, `الأكبر = ${hi} والأصغر = ${lo}.`),
        L(`${hi} − ${lo}.`, `${hi} − ${lo}.`),
      ),
      steps: [L(`${hi} − ${lo} = ${hi - lo}.`, `${hi} − ${lo} = ${hi - lo}.`)],
      explanation: L('The range shows how spread out the values are.', 'المدى يبيّن مقدار تباعد القيم.'),
    });
  }),
];

// ───────────────────────── Unit conversion ─────────────────────────

interface UnitPair {
  big: { en: string; ar: string };
  small: { en: string; ar: string };
  factor: number;
  kind: 'length' | 'mass' | 'capacity';
}
const PAIRS: UnitPair[] = [
  { big: { en: 'km', ar: 'كم' }, small: { en: 'm', ar: 'م' }, factor: 1000, kind: 'length' },
  { big: { en: 'm', ar: 'م' }, small: { en: 'cm', ar: 'سم' }, factor: 100, kind: 'length' },
  { big: { en: 'cm', ar: 'سم' }, small: { en: 'mm', ar: 'مم' }, factor: 10, kind: 'length' },
  { big: { en: 'kg', ar: 'كغ' }, small: { en: 'g', ar: 'غ' }, factor: 1000, kind: 'mass' },
  { big: { en: 'L', ar: 'ل' }, small: { en: 'mL', ar: 'مل' }, factor: 1000, kind: 'capacity' },
];

const unitConversion: Generator[] = [
  G('convert', 'unit-conversion', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const pair = rng.pick(d === 1 ? PAIRS.slice(0, 2) : PAIRS);
    const toSmall = d === 1 ? true : rng.chance(0.5);
    const q = toSmall
      ? d <= 2
        ? F(rng.int(1, 12))
        : d === 3
          ? F(rng.int(5, 95), 10)
          : F(rng.int(1, 999), 100)
      : d <= 2
        ? F(pair.factor * rng.int(1, 9))
        : d === 3
          ? F(pair.factor * rng.int(11, 99), 10)
          : F(pair.factor * rng.int(11, 999), 100);
    const out = toSmall ? q.mul(F(pair.factor)) : q.div(F(pair.factor));
    const from = toSmall ? pair.big : pair.small;
    const to = toSmall ? pair.small : pair.big;
    const wrong = toSmall ? q.div(F(pair.factor)) : q.mul(F(pair.factor));
    return typed({
      prompt: L(`Convert ${txt(q)} ${from.en} to ${to.en}.`, `حوّل ${txt(q)} ${from.ar} إلى ${to.ar}.`),
      value: out,
      correct: same(`${txt(out)} ${to.en}`),
      errors: [
        [wrong, 'units-mixup'],
        [out.mul(F(10)), 'units-mixup'],
        [out.div(F(10)), 'units-mixup'],
      ],
      hints: H(
        L(`1 ${pair.big.en} = ${pair.factor} ${pair.small.en}.`, `1 ${pair.big.ar} = ${pair.factor} ${pair.small.ar}.`),
        toSmall
          ? L(`Going to a smaller unit gives a bigger number: multiply.`, `الانتقال إلى وحدة أصغر يعطي عددًا أكبر: اضرب.`)
          : L(`Going to a bigger unit gives a smaller number: divide.`, `الانتقال إلى وحدة أكبر يعطي عددًا أصغر: اقسم.`),
        toSmall ? L(`${txt(q)} × ${pair.factor}.`, `${txt(q)} × ${pair.factor}.`) : L(`${txt(q)} ÷ ${pair.factor}.`, `${txt(q)} ÷ ${pair.factor}.`),
      ),
      steps: [
        L(`1 ${pair.big.en} = ${pair.factor} ${pair.small.en}.`, `1 ${pair.big.ar} = ${pair.factor} ${pair.small.ar}.`),
        toSmall
          ? L(`${txt(q)} × ${pair.factor} = ${txt(out)} ${to.en}.`, `${txt(q)} × ${pair.factor} = ${txt(out)} ${to.ar}.`)
          : L(`${txt(q)} ÷ ${pair.factor} = ${txt(out)} ${to.en}.`, `${txt(q)} ÷ ${pair.factor} = ${txt(out)} ${to.ar}.`),
      ],
      explanation: L('Small unit → multiply to get more of them; big unit → divide.', 'من وحدة كبيرة إلى صغيرة نضرب، ومن صغيرة إلى كبيرة نقسم.'),
    });
  }),

  G('match-units', 'unit-conversion', 'matching', [1, 2, 3], (rng, d) => {
    const pairs = rng.sample(PAIRS, d === 1 ? 3 : 4);
    const askInverse = d === 3;
    return matchBody(rng, {
      prompt: L('Match each measure with the same amount in a smaller unit.', 'صِل كل قياس بالمقدار نفسه بوحدة أصغر.'),
      pairs: pairs.map((p) => ({
        left: L(`1 ${p.big.en}`, `1 ${p.big.ar}`),
        right: askInverse ? L(`${p.factor} ${p.small.en}`, `${p.factor} ${p.small.ar}`) : L(`${p.factor} ${p.small.en}`, `${p.factor} ${p.small.ar}`),
      })),
      hints: H(
        L('Think of the prefix: kilo = 1000, centi = 100, milli = 1/1000.', 'تذكّر البادئة: كيلو = 1000، سنتي = 100، ملي = 1/1000.'),
        L('1 km = 1000 m; 1 m = 100 cm; 1 cm = 10 mm.', '1 كم = 1000 م؛ 1 م = 100 سم؛ 1 سم = 10 مم.'),
        L('1 kg = 1000 g; 1 L = 1000 mL.', '1 كغ = 1000 غ؛ 1 ل = 1000 مل.'),
      ),
      steps: [L('Use the standard metric relationships.', 'استخدم العلاقات المترية المعتادة.')],
      explanation: L('Metric units are all based on powers of 10.', 'الوحدات المترية كلها مبنية على قوى العدد 10.'),
    });
  }),

  G('best-unit', 'unit-conversion', 'mcq', [1, 2, 3], (rng) => {
    const items: { en: string; ar: string; best: number }[] = [
      { en: 'the length of a pencil', ar: 'طول قلم رصاص', best: 1 },
      { en: 'the distance between two cities', ar: 'المسافة بين مدينتين', best: 0 },
      { en: 'the mass of a watermelon', ar: 'كتلة بطيخة', best: 3 },
      { en: 'the amount of water in a cup', ar: 'كمية الماء في كوب', best: 4 },
      { en: 'the height of a door', ar: 'ارتفاع باب', best: 2 },
    ];
    const names = [
      { en: 'kilometres', ar: 'كيلومترات' },
      { en: 'centimetres', ar: 'سنتيمترات' },
      { en: 'metres', ar: 'أمتار' },
      { en: 'kilograms', ar: 'كيلوغرامات' },
      { en: 'millilitres', ar: 'ملليلترات' },
    ];
    const it = rng.pick(items);
    const correct = names[it.best] as { en: string; ar: string };
    return mcqText(rng, {
      prompt: L(`Which unit is the most sensible for measuring ${it.en}?`, `ما الوحدة الأنسب لقياس ${it.ar}؟`),
      correct: L(correct.en, correct.ar),
      wrongs: names
        .filter((_, i) => i !== it.best)
        .map((n) => ({ label: L(n.en, n.ar), pid: 'units-mixup' })),
      hints: H(
        L('Is it a length, a mass or an amount of liquid?', 'هل هو طول أم كتلة أم كمية سائل؟'),
        L('Pick the unit that gives a number of a handy size.', 'اختر الوحدة التي تعطي عددًا مناسب الحجم.'),
        L('Imagine the size of the object.', 'تخيّل حجم الشيء.'),
      ),
      steps: [L(`The most sensible unit is ${correct.en}.`, `الوحدة الأنسب هي ${correct.ar}.`)],
      explanation: L('Choose a unit close to the size of what you measure.', 'اختر وحدة قريبة من حجم ما تقيسه.'),
    });
  }),

  G('rope-pieces', 'unit-conversion', 'word-problem', [3, 4, 5], (rng, d) => {
    const pieceCm = rng.pick([25, 50, 20, 40]);
    const pieces = rng.int(3, 4 + d * 2);
    const lengthM = F(pieceCm * pieces, 100);
    return typed({
      prompt: L(
        `A rope is ${txt(lengthM)} m long. It is cut into pieces of ${pieceCm} cm. How many pieces are there?`,
        `حبل طوله ${txt(lengthM)} م. قُطع إلى قطع طول كل منها ${pieceCm} سم. كم قطعة نحصل عليها؟`,
      ),
      value: pieces,
      extra: { integerOnly: true },
      errors: [[lengthM.div(F(pieceCm)), 'units-mixup']],
      hints: H(
        L('Use the same unit for both lengths.', 'استخدم الوحدة نفسها للطولين.'),
        L(`${txt(lengthM)} m = ${txt(lengthM.mul(F(100)))} cm.`, `${txt(lengthM)} م = ${txt(lengthM.mul(F(100)))} سم.`),
        L(`Divide by ${pieceCm}.`, `اقسم على ${pieceCm}.`),
      ),
      steps: [
        L(`${txt(lengthM)} m = ${txt(lengthM.mul(F(100)))} cm.`, `${txt(lengthM)} م = ${txt(lengthM.mul(F(100)))} سم.`),
        L(`${txt(lengthM.mul(F(100)))} ÷ ${pieceCm} = ${pieces}.`, `${txt(lengthM.mul(F(100)))} ÷ ${pieceCm} = ${pieces}.`),
      ],
      explanation: L('Convert to one unit first, then divide.', 'حوّل إلى وحدة واحدة أولًا ثم اقسم.'),
    });
  }),

  G('which-operation', 'unit-conversion', 'select-formula', [1, 2, 3, 4], (rng) => {
    const pair = rng.pick(PAIRS);
    const toSmall = rng.chance(0.5);
    const from = toSmall ? pair.big : pair.small;
    const to = toSmall ? pair.small : pair.big;
    const f = pair.factor;
    const op = (mul: boolean, k: number): string => (mul ? `× ${k}` : `÷ ${k}`);
    const otherK = f === 10 ? 100 : 10;
    return mcqText(rng, {
      prompt: L(`Which operation converts ${from.en} to ${to.en}?`, `أي عملية تحوّل من ${from.ar} إلى ${to.ar}؟`),
      correct: same(mt(op(toSmall, f))),
      wrongs: [
        { label: same(mt(op(!toSmall, f))), pid: 'units-mixup' },
        { label: same(mt(op(toSmall, otherK))), pid: 'units-mixup' },
        { label: same(mt(op(!toSmall, otherK))), pid: 'units-mixup' },
        { label: same(mt(`+ ${f}`)), pid: 'wrong-operation' },
      ],
      hints: H(
        L('Is the new unit smaller or bigger?', 'هل الوحدة الجديدة أصغر أم أكبر؟'),
        L(`1 ${pair.big.en} = ${f} ${pair.small.en}.`, `1 ${pair.big.ar} = ${f} ${pair.small.ar}.`),
        toSmall ? L('Smaller unit → more of them → multiply.', 'وحدة أصغر ← عدد أكبر ← ضرب.') : L('Bigger unit → fewer of them → divide.', 'وحدة أكبر ← عدد أقل ← قسمة.'),
      ),
      steps: [
        L(`1 ${pair.big.en} = ${f} ${pair.small.en}.`, `1 ${pair.big.ar} = ${f} ${pair.small.ar}.`),
        L(toSmall ? `Multiply by ${f}.` : `Divide by ${f}.`, toSmall ? `نضرب في ${f}.` : `نقسم على ${f}.`),
      ],
      explanation: L('Moving to a smaller unit multiplies; moving to a bigger unit divides.', 'الانتقال إلى وحدة أصغر يعني الضرب، وإلى وحدة أكبر يعني القسمة.'),
    });
  }),

  G('order-lengths', 'unit-conversion', 'ordering', [2, 3, 4, 5], (rng, d) => {
    const count = d <= 2 ? 3 : d === 3 ? 4 : 5;
    const cms = new Set<number>();
    while (cms.size < count) cms.add(d >= 4 ? 100 * rng.int(1, 40) + (rng.chance(0.5) ? 0 : 50) : 10 * rng.int(2, 40));
    const entries = [...cms].map((cm) => {
      const styles: ('m' | 'cm' | 'mm' | 'km')[] = ['m', 'cm', 'mm'];
      if (d >= 4 && cm % 100 === 0) styles.push('km');
      const s = rng.pick(styles);
      const v = F(cm);
      if (s === 'cm') return { value: v, label: L(`${cm} cm`, `${cm} سم`) };
      if (s === 'mm') return { value: v, label: L(`${cm * 10} mm`, `${cm * 10} مم`) };
      if (s === 'km') return { value: v, label: L(`${txt(F(cm, 100000))} km`, `${txt(F(cm, 100000))} كم`) };
      return { value: v, label: L(`${txt(F(cm, 100))} m`, `${txt(F(cm, 100))} م`) };
    });
    return orderBody(rng, {
      prompt: L('Put these lengths in order from shortest to longest.', 'رتّب هذه الأطوال من الأقصر إلى الأطول.'),
      entries,
      hints: H(
        L('The units are different, so convert first.', 'الوحدات مختلفة لذا حوّل أولًا.'),
        L('Change everything to centimetres.', 'حوّل كل شيء إلى سنتيمترات.'),
        L('Now compare the numbers.', 'والآن قارن الأعداد.'),
      ),
      steps: [L(`In centimetres: ${entries.map((e) => txt(e.value)).join(', ')}.`, `بالسنتيمتر: ${entries.map((e) => txt(e.value)).join('، ')}.`)],
      explanation: L('You can only compare lengths once they use the same unit.', 'لا يمكن مقارنة الأطوال إلا بعد استخدام الوحدة نفسها.'),
    });
  }),
];

export const L3_GENERATORS: Generator[] = [
  ...percentBasics,
  ...percentOf,
  ...discounts,
  ...ratios,
  ...proportions,
  ...moneyTime,
  ...averages,
  ...unitConversion,
];
