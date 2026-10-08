import type { Generator, Rng } from '@/types';
import { Fraction, gcd } from '../fraction';
import { G, compareBody, mcqNum, mcqText, orderBody, matchBody, tfBody, typed } from '../build';
import { H, L, differ, person, same } from '../kit';

const F = Fraction.of;
const fl = (n: number, d: number) => `\\frac{${n}}{${d}}`;
const mf = (n: number, d: number) => `$${fl(n, d)}$`;
const tx = (f: Fraction) => `$${f.toLatex()}$`;
const mix = (w: number, n: number, d: number) => `${w}\\frac{${n}}{${d}}`;
const D = (f: Fraction) => same(f.toDecimal(8));

/** Numerator in [1, den-1] coprime to den (den ≥ 2). */
function coprimeNum(rng: Rng, den: number): number {
  const ok: number[] = [];
  for (let n = 1; n < den; n++) if (gcd(n, den) === 1) ok.push(n);
  return ok.length ? rng.pick(ok) : 1;
}
/** Reduced proper fraction with exactly this denominator (den ≥ 2). */
function fracWithDen(rng: Rng, den: number): Fraction {
  return F(coprimeNum(rng, den), den);
}
/** Reduced proper fraction with a denominator in [minD, maxD]. */
function properFrac(rng: Rng, minD: number, maxD: number): Fraction {
  return fracWithDen(rng, rng.int(Math.max(2, minD), Math.max(2, maxD)));
}
/** `count` proper fractions with pairwise different values. */
function distinctFractions(rng: Rng, count: number, minD: number, maxD: number): Fraction[] {
  const out: Fraction[] = [];
  let guard = 0;
  while (out.length < count && guard++ < 300) {
    const f = properFrac(rng, minD, maxD);
    if (!out.some((o) => o.eq(f))) out.push(f);
  }
  return out;
}

interface Dec {
  whole: number;
  frac: number;
  places: number;
  value: Fraction;
  text: string;
}
/** Random decimal whose last digit is never 0, so its length is meaningful. */
function dnum(rng: Rng, places: number, maxWhole: number): Dec {
  const top = 10 ** places - 1;
  let frac = rng.int(1, top);
  if (frac % 10 === 0) frac += 1;
  const whole = rng.int(0, maxWhole);
  return {
    whole,
    frac,
    places,
    value: F(whole * 10 ** places + frac, 10 ** places),
    text: `${whole}.${String(frac).padStart(places, '0')}`,
  };
}
const fromScaled = (scaled: number, places: number) => F(scaled, 10 ** places);
const mt = (s: string) => `$${s}$`;

// ───────────────────────── Fraction basics ─────────────────────────

const fractionBasics: Generator[] = [
  G('part-of-whole', 'fraction-basics', 'mcq', [1, 2, 3], (rng, d) => {
    const den = rng.pick(d === 1 ? [4, 6, 8] : d === 2 ? [8, 10, 12] : [10, 12, 16]);
    const num = coprimeNum(rng, den);
    const val = F(num, den);
    return mcqNum(rng, {
      prompt: L(
        `A pizza is cut into ${den} equal slices and ${num} of them are eaten. Which fraction shows the part that was eaten?`,
        `قُسمت بيتزا إلى أجزاء متساوية عددها ${den}، وأُكل منها ${num}. ما الكسر الذي يمثل الجزء المأكول؟`,
      ),
      correct: val,
      cands: [
        { v: F(den, num), pid: 'reversed-fraction' },
        { v: F(den - num, den), pid: 'wrong-operation' },
        { v: F(num, den - num), pid: 'reversed-fraction' },
      ],
      hints: H(
        L('A fraction is "part over whole".', 'الكسر هو «الجزء على الكل».'),
        L('The whole is the total number of equal slices.', 'الكل هو العدد الكلي للأجزاء المتساوية.'),
        L(`The part is ${num} and the whole is ${den}.`, `الجزء ${num} والكل ${den}.`),
      ),
      steps: [
        L(`Whole = ${den} equal slices (denominator).`, `الكل = ${den} من الأجزاء المتساوية (المقام).`),
        L(`Part eaten = ${num} slices (numerator).`, `الجزء المأكول = ${num} (البسط).`),
        L(`Fraction = ${num}/${den}.`, `الكسر = ${num}/${den}.`),
      ],
      explanation: L('The numerator counts the parts we have; the denominator counts all equal parts.', 'البسط يعدّ الأجزاء التي نملكها، والمقام يعدّ كل الأجزاء المتساوية.'),
    });
  }),

  G('numerator-denominator', 'fraction-basics', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const den = rng.int(2, 4 + d * 3);
    const num = rng.int(1, den + (d > 2 ? 4 : -1));
    const askNum = rng.chance(0.5);
    return typed({
      prompt: askNum
        ? L('What is the numerator of this fraction?', 'ما هو بسط هذا الكسر؟')
        : L('What is the denominator of this fraction?', 'ما هو مقام هذا الكسر؟'),
      display: fl(num, den),
      value: askNum ? num : den,
      errors: [[askNum ? den : num, 'reversed-fraction']],
      extra: { integerOnly: true },
      hints: H(
        L('A fraction has a top number and a bottom number.', 'للكسر عدد في الأعلى وعدد في الأسفل.'),
        L('The numerator is on top; the denominator is on the bottom.', 'البسط في الأعلى والمقام في الأسفل.'),
        L(`Top: ${num}, bottom: ${den}.`, `الأعلى: ${num}، الأسفل: ${den}.`),
      ),
      steps: [L(`Numerator = ${num} (top), denominator = ${den} (bottom).`, `البسط = ${num} (الأعلى)، والمقام = ${den} (الأسفل).`)],
      explanation: L('The denominator names the size of the parts; the numerator counts them.', 'المقام يسمّي حجم الأجزاء، والبسط يعدّها.'),
    });
  }),

  G('proper-or-improper', 'fraction-basics', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const den = rng.int(2, 5 + d * 2);
    const num = rng.chance(0.5) ? rng.int(1, den - 1) : rng.int(den, den + 6);
    const proper = rng.chance(0.5);
    const truth = proper ? num < den : num >= den;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: proper
        ? `${fl(num, den)}\\text{ is a proper fraction}`
        : `${fl(num, den)}\\text{ is an improper fraction}`,
      truth,
      hints: H(
        L('Compare the numerator with the denominator.', 'قارن البسط بالمقام.'),
        L('A proper fraction has a numerator smaller than its denominator.', 'الكسر الاعتيادي بسطه أصغر من مقامه.'),
        L(`${num} ${num < den ? '<' : '≥'} ${den}.`, `${num} ${num < den ? '<' : '≥'} ${den}.`),
      ),
      steps: [
        L(`Compare ${num} and ${den}.`, `قارن بين ${num} و ${den}.`),
        L(num < den ? 'Numerator is smaller → proper fraction.' : 'Numerator is not smaller → improper fraction.', num < den ? 'البسط أصغر ← كسر اعتيادي.' : 'البسط ليس أصغر ← كسر غير اعتيادي.'),
      ],
      explanation: L('Improper fractions are worth 1 or more.', 'الكسور غير الاعتيادية قيمتها 1 أو أكثر.'),
    });
  }),

  G('fraction-story', 'fraction-basics', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const total = rng.int(4 + d, 8 + d * 3);
    const part = coprimeNum(rng, total);
    return typed({
      prompt: L(
        `${p.en} has ${total} marbles. ${part} of them are red. What fraction of the marbles are red?`,
        `مع ${p.ar} كرات زجاجية عددها ${total}، منها ${part} كرات حمراء. ما الكسر الذي يمثل الكرات الحمراء؟`,
      ),
      value: F(part, total),
      correct: same(mf(part, total)),
      errors: [
        [F(total, part), 'reversed-fraction'],
        [F(total - part, total), 'wrong-operation'],
      ],
      hints: H(
        L('Fraction = part ÷ whole.', 'الكسر = الجزء ÷ الكل.'),
        L('The whole is all the marbles.', 'الكل هو جميع الكرات.'),
        L(`Write ${part} over ${total}.`, `اكتب ${part} فوق ${total}.`),
      ),
      steps: [L(`Red marbles: ${part}. All marbles: ${total}.`, `الكرات الحمراء: ${part}. كل الكرات: ${total}.`), L(`${part}/${total}`, `${part}/${total}`)],
      explanation: L('Always put the part on top and the whole on the bottom.', 'ضع الجزء دائمًا في البسط والكل في المقام.'),
    });
  }),
];

// ───────────────────────── Equivalent fractions ─────────────────────────

const equivalent: Generator[] = [
  G('missing-numerator', 'equivalent-fractions', 'fill-blank', [1, 2, 3, 4, 5], (rng, d) => {
    const b = rng.int(2, 3 + d * 2);
    const a = coprimeNum(rng, b);
    const k = rng.int(2, 2 + d);
    return typed({
      prompt: L('Find the missing number so the fractions are equal.', 'أوجد العدد الناقص لتكون الكسور متساوية.'),
      display: `${fl(a, b)} = \\frac{\\square}{${b * k}}`,
      value: a * k,
      errors: [[a + (b * k - b), 'common-denominator']],
      extra: { integerOnly: true },
      hints: H(
        L('Compare the two denominators.', 'قارن بين المقامين.'),
        L(`The denominator was multiplied by ${k}.`, `ضُرب المقام في ${k}.`),
        L(`Multiply the numerator by ${k} too.`, `اضرب البسط في ${k} أيضًا.`),
      ),
      steps: [
        L(`${b} × ${k} = ${b * k}, so the denominator was multiplied by ${k}.`, `${b} × ${k} = ${b * k}، فالمقام ضُرب في ${k}.`),
        L(`Do the same to the top: ${a} × ${k} = ${a * k}.`, `نفعل الشيء نفسه بالبسط: ${a} × ${k} = ${a * k}.`),
      ],
      explanation: L('Multiplying top and bottom by the same number does not change the value.', 'ضرب البسط والمقام في العدد نفسه لا يغيّر قيمة الكسر.'),
    });
  }),

  G('missing-denominator', 'equivalent-fractions', 'fill-blank', [2, 3, 4, 5], (rng, d) => {
    const b = rng.int(2, 3 + d * 2);
    const a = coprimeNum(rng, b);
    const k = rng.int(2, 2 + d);
    return typed({
      prompt: L('Find the missing denominator.', 'أوجد المقام الناقص.'),
      display: `${fl(a, b)} = \\frac{${a * k}}{\\square}`,
      value: b * k,
      errors: [[b + (a * k - a), 'common-denominator']],
      extra: { integerOnly: true },
      hints: H(
        L('Look at how the numerator changed.', 'انظر كيف تغيّر البسط.'),
        L(`${a} became ${a * k}: multiplied by ${k}.`, `${a} أصبح ${a * k}: ضُرب في ${k}.`),
        L(`Multiply ${b} by ${k}.`, `اضرب ${b} في ${k}.`),
      ),
      steps: [
        L(`${a} × ${k} = ${a * k}, so the factor is ${k}.`, `${a} × ${k} = ${a * k}، فالعامل هو ${k}.`),
        L(`${b} × ${k} = ${b * k}.`, `${b} × ${k} = ${b * k}.`),
      ],
      explanation: L('Equivalent fractions come from multiplying both parts by the same factor.', 'الكسور المتكافئة تنتج من ضرب الجزأين في العامل نفسه.'),
    });
  }),

  G('which-equal', 'equivalent-fractions', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const b = rng.int(2, 3 + d * 2);
    const a = coprimeNum(rng, b);
    const k = rng.int(2, 3 + d);
    const base = F(a, b);
    const raw: { n: number; dn: number; pid?: string }[] = [
      { n: a + k, dn: b + k, pid: 'common-denominator' },
      { n: a * k, dn: b },
      { n: a, dn: b * k },
      { n: a * k, dn: b * k + 1 },
      { n: a + 1, dn: b * k },
      { n: a * k + 1, dn: b * k },
    ];
    const wrongs = raw
      .filter((r) => r.dn > 0 && !F(r.n, r.dn).eq(base))
      .map((r) => ({ label: same(mf(r.n, r.dn)), pid: r.pid }));
    return mcqText(rng, {
      prompt: L('Which fraction is equivalent to the one shown?', 'أي كسر يكافئ الكسر المعروض؟'),
      display: fl(a, b),
      correct: same(mf(a * k, b * k)),
      wrongs,
      hints: H(
        L('Equivalent fractions have the same value.', 'الكسور المتكافئة لها القيمة نفسها.'),
        L('Both parts must be multiplied by the same number.', 'يجب ضرب الجزأين في العدد نفسه.'),
        L(`Try multiplying ${a} and ${b} by ${k}.`, `جرّب ضرب ${a} و ${b} في ${k}.`),
      ),
      steps: [
        L(`Multiply top and bottom by ${k}: ${a} × ${k} = ${a * k}, ${b} × ${k} = ${b * k}.`, `نضرب البسط والمقام في ${k}: ${a} × ${k} = ${a * k}، ${b} × ${k} = ${b * k}.`),
        L(`So ${a}/${b} = ${a * k}/${b * k}.`, `إذن ${a}/${b} = ${a * k}/${b * k}.`),
      ],
      explanation: L('Adding the same number to top and bottom changes the value; multiplying does not.', 'إضافة العدد نفسه إلى البسط والمقام تغيّر القيمة، أما الضرب فلا يغيّرها.'),
    });
  }),

  G('true-equal', 'equivalent-fractions', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    const b = rng.int(2, 3 + d * 2);
    const a = coprimeNum(rng, b);
    const k = rng.int(2, 3 + d);
    const truth = rng.chance(0.5);
    const den2 = truth ? b * k : b * k + rng.pick([-1, 1]);
    return tfBody({
      prompt: L('Are these two fractions equal?', 'هل هذان الكسران متساويان؟'),
      display: `${fl(a, b)} = ${fl(a * k, den2)}`,
      truth,
      pid: 'common-denominator',
      hints: H(
        L('Find what the numerator was multiplied by.', 'اكتشف في ماذا ضُرب البسط.'),
        L('Check whether the denominator was multiplied by the same number.', 'تحقق هل ضُرب المقام في العدد نفسه.'),
        L(`${a} × ${k} = ${a * k}, and ${b} × ${k} = ${b * k}.`, `${a} × ${k} = ${a * k}، و ${b} × ${k} = ${b * k}.`),
      ),
      steps: [
        L(`The numerator was multiplied by ${k}, so the denominator should be ${b * k}.`, `البسط ضُرب في ${k}، فيجب أن يكون المقام ${b * k}.`),
        L(`The shown denominator is ${den2} → ${truth ? 'equal' : 'not equal'}.`, `المقام المعروض ${den2} ← ${truth ? 'متساويان' : 'غير متساويين'}.`),
      ],
      explanation: L('Equal fractions use the same multiplier on both parts.', 'الكسور المتساوية تستعمل المضروب نفسه في الجزأين.'),
    });
  }),

  G('match-equivalent', 'equivalent-fractions', 'matching', [1, 2, 3, 4, 5], (rng, d) => {
    const bases = distinctFractions(rng, d <= 2 ? 3 : 4, 2, 6 + d);
    const ks = rng.shuffle([2, 3, 4, 5, 6]).slice(0, bases.length);
    return matchBody(rng, {
      prompt: L('Match each fraction with its equivalent.', 'طابِق كل كسر مع الكسر المكافئ له.'),
      pairs: bases.map((f, i) => ({ left: same(tx(f)), right: same(mf(f.n * (ks[i] as number), f.d * (ks[i] as number))) })),
      hints: H(
        L('Simplify each large fraction.', 'بسّط كل كسر كبير.'),
        L('Divide top and bottom by their common factor.', 'اقسم البسط والمقام على عاملهما المشترك.'),
        L('Start with the one you are most sure about.', 'ابدأ بالكسر الذي أنت واثق منه أكثر.'),
      ),
      steps: [L('Reduce each right-hand fraction to lowest terms and look for the same value on the left.', 'بسّط كل كسر في العمود الأيمن إلى أبسط صورة وابحث عن القيمة نفسها في اليسار.')],
      explanation: L('Every fraction has many equivalent forms but only one lowest-terms form.', 'لكل كسر صور متكافئة كثيرة وصورة واحدة فقط في أبسط شكل.'),
    });
  }),
];

// ───────────────────────── Simplifying ─────────────────────────

const simplifying: Generator[] = [
  G('simplify', 'simplifying-fractions', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let r: Fraction;
    if (d === 5) {
      const den = rng.int(2, 9);
      let n = den + rng.int(1, 9);
      while (gcd(n, den) !== 1) n += 1;
      r = F(n, den);
    } else {
      r = properFrac(rng, 2, 3 + d * 2);
    }
    const k = rng.int(2, 3 + d);
    return typed({
      prompt: L('Write this fraction in its simplest form.', 'اكتب هذا الكسر في أبسط صورة.'),
      display: fl(r.n * k, r.d * k),
      value: r,
      correct: same(tx(r)),
      extra: { lowest: true },
      hints: H(
        L('Find a number that divides both the top and the bottom.', 'جد عددًا يقسم البسط والمقام معًا.'),
        L(`Both numbers are multiples of ${k}.`, `كلا العددين من مضاعفات ${k}.`),
        L(`Divide top and bottom by ${k}.`, `اقسم البسط والمقام على ${k}.`),
      ),
      steps: [
        L(`Common factor of ${r.n * k} and ${r.d * k}: ${k}.`, `العامل المشترك للعددين ${r.n * k} و ${r.d * k}: ${k}.`),
        L(`${r.n * k} ÷ ${k} = ${r.n}, ${r.d * k} ÷ ${k} = ${r.d}.`, `${r.n * k} ÷ ${k} = ${r.n}، ${r.d * k} ÷ ${k} = ${r.d}.`),
        L(`${r.n}/${r.d} cannot be simplified further.`, `لا يمكن تبسيط ${r.n}/${r.d} أكثر.`),
      ],
      explanation: L('Divide top and bottom by their greatest common factor to reach lowest terms.', 'اقسم البسط والمقام على قاسمهما المشترك الأكبر لتصل إلى أبسط صورة.'),
    });
  }),

  G('pick-simplest', 'simplifying-fractions', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const r = properFrac(rng, 2, 4 + d * 2);
    const k = [6, 8, 9, 10, 12][d - 1] as number;
    const divisors = [2, 3, 4, 6].filter((x) => k % x === 0 && x < k);
    const partial = divisors.map((x) => ({ label: same(mf(r.n * x, r.d * x)), pid: 'not-simplified' }));
    const others = [
      { label: same(mf(r.n + 1, r.d)) },
      { label: same(mf(r.n, r.d + 1)) },
      { label: same(mf(r.d, r.n)), pid: 'reversed-fraction' },
    ];
    return mcqText(rng, {
      prompt: L(`Which option is ${mf(r.n * k, r.d * k)} in simplest form?`, `أي خيار هو ${mf(r.n * k, r.d * k)} في أبسط صورة؟`),
      correct: same(tx(r)),
      wrongs: [...partial, ...others].filter((w) => !(w.label.en === tx(r))),
      hints: H(
        L('Simplest form means no number divides both parts.', 'أبسط صورة تعني ألا يقسم أي عدد الجزأين معًا.'),
        L(`Start by dividing by ${k}.`, `ابدأ بالقسمة على ${k}.`),
        L('Some options are equal in value but not fully simplified.', 'بعض الخيارات تساوي القيمة نفسها لكنها غير مبسّطة تمامًا.'),
      ),
      steps: [L(`Divide top and bottom by ${k}: ${r.n}/${r.d}.`, `نقسم البسط والمقام على ${k}: ${r.n}/${r.d}.`)],
      explanation: L('Equal-valued fractions are not all in simplest form — choose the one with the smallest numbers.', 'ليست كل الكسور المتساوية في أبسط صورة — اختر الكسر ذا الأعداد الأصغر.'),
    });
  }),

  G('is-simplest', 'simplifying-fractions', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const den = rng.int(4, 8 + d * 3);
    let num = rng.int(2, den - 1);
    const wantCoprime = rng.chance(0.5);
    let guard = 0;
    while ((gcd(num, den) === 1) !== wantCoprime && guard++ < 40) num = rng.int(2, den - 1);
    const truth = gcd(num, den) === 1;
    const g = gcd(num, den);
    return tfBody({
      prompt: L('Is this fraction already in simplest form?', 'هل هذا الكسر في أبسط صورة بالفعل؟'),
      display: fl(num, den),
      truth,
      pid: 'not-simplified',
      hints: H(
        L('Look for a number (other than 1) that divides both parts.', 'ابحث عن عدد (غير 1) يقسم الجزأين.'),
        L('Check 2, 3, 5 first.', 'جرّب 2 و 3 و 5 أولًا.'),
        L(truth ? 'No number other than 1 divides both.' : `${g} divides both.`, truth ? 'لا يقسمهما معًا أي عدد غير 1.' : `العدد ${g} يقسمهما معًا.`),
      ),
      steps: [
        L(`Greatest common factor of ${num} and ${den} is ${g}.`, `القاسم المشترك الأكبر للعددين ${num} و ${den} هو ${g}.`),
        L(truth ? 'It is 1, so the fraction is simplest.' : `It is greater than 1, so it can be simplified.`, truth ? 'وهو 1، فالكسر في أبسط صورة.' : 'وهو أكبر من 1، فيمكن التبسيط.'),
      ],
      explanation: L('A fraction is in simplest form when the greatest common factor is 1.', 'يكون الكسر في أبسط صورة عندما يكون القاسم المشترك الأكبر 1.'),
    });
  }),

  G('score-story', 'simplifying-fractions', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const r = properFrac(rng, 2, 3 + d);
    const k = rng.int(2, 3 + d);
    return typed({
      prompt: L(
        `${p.en} answered ${r.n * k} out of ${r.d * k} questions correctly. Write this as a fraction in simplest form.`,
        `أجاب ${p.ar} عن ${r.n * k} أسئلة صحيحة من أصل ${r.d * k}. اكتب ذلك على صورة كسر في أبسط صورة.`,
      ),
      value: r,
      correct: same(tx(r)),
      extra: { lowest: true },
      hints: H(
        L('First write the fraction, then simplify.', 'اكتب الكسر أولًا ثم بسّطه.'),
        L(`Divide both numbers by ${k}.`, `اقسم العددين على ${k}.`),
        L(`${r.n * k}/${r.d * k} → ?`, `${r.n * k}/${r.d * k} ← ؟`),
      ),
      steps: [
        L(`Fraction: ${r.n * k}/${r.d * k}.`, `الكسر: ${r.n * k}/${r.d * k}.`),
        L(`Divide by ${k}: ${r.n}/${r.d}.`, `نقسم على ${k}: ${r.n}/${r.d}.`),
      ],
      explanation: L('Scores are easiest to compare in simplest form.', 'من الأسهل مقارنة النتائج عندما تكون في أبسط صورة.'),
    });
  }),
];

// ───────────────────────── Comparing fractions ─────────────────────────

const comparing: Generator[] = [
  G('compare-two', 'comparing-fractions', 'compare', [1, 2, 3, 4, 5], (rng, d) => {
    let n1: number, d1: number, n2: number, d2: number;
    if (d === 1) {
      d1 = d2 = rng.int(3, 9);
      n1 = rng.int(1, d1 - 1);
      n2 = differ(rng, 1, d1 - 1, n1);
    } else if (d === 2) {
      const n = rng.int(1, 5);
      n1 = n2 = n;
      d1 = rng.int(n + 1, 12);
      d2 = differ(rng, n + 1, 12, d1);
    } else {
      d1 = rng.int(2, 6 + d * 2);
      n1 = rng.int(1, d1 - 1);
      if (rng.chance(0.2)) {
        const k = rng.int(2, 3);
        n2 = n1 * k;
        d2 = d1 * k;
      } else {
        d2 = differ(rng, 2, 6 + d * 2, d1);
        n2 = rng.int(1, d2 - 1);
      }
    }
    const a = F(n1, d1);
    const b = F(n2, d2);
    return compareBody({
      prompt: L('Compare the two fractions.', 'قارن بين الكسرين.'),
      a,
      b,
      aTex: fl(n1, d1),
      bTex: fl(n2, d2),
      pids: { lt: 'compare-fraction-denominator', gt: 'compare-fraction-denominator' },
      hints: H(
        L(d === 1 ? 'Same denominator: compare the numerators.' : d === 2 ? 'Same numerator: the bigger denominator means smaller pieces.' : 'Make the denominators the same, or cross-multiply.', d === 1 ? 'المقام واحد: قارن البسطين.' : d === 2 ? 'البسط واحد: المقام الأكبر يعني أجزاء أصغر.' : 'وحّد المقامين أو اضرب بالتبادل.'),
        L(`Cross-multiply: ${n1} × ${d2} and ${n2} × ${d1}.`, `اضرب بالتبادل: ${n1} × ${d2} و ${n2} × ${d1}.`),
        L(`${n1 * d2} versus ${n2 * d1}.`, `${n1 * d2} مقابل ${n2 * d1}.`),
      ),
      steps: [
        L(`Cross-multiply: ${n1} × ${d2} = ${n1 * d2} and ${n2} × ${d1} = ${n2 * d1}.`, `نضرب بالتبادل: ${n1} × ${d2} = ${n1 * d2} و ${n2} × ${d1} = ${n2 * d1}.`),
        L('The bigger product belongs to the bigger fraction.', 'الناتج الأكبر يعود للكسر الأكبر.'),
      ],
      explanation: L('A bigger denominator does not mean a bigger fraction — it means smaller pieces.', 'المقام الأكبر لا يعني كسرًا أكبر — بل يعني أجزاء أصغر.'),
    });
  }),

  G('order-fractions', 'comparing-fractions', 'ordering', [1, 2, 3, 4, 5], (rng, d) => {
    const count = d <= 2 ? 3 : d <= 4 ? 4 : 5;
    let fs: Fraction[];
    if (d === 1) {
      const den = rng.int(5, 9);
      const nums = rng.sample([1, 2, 3, 4, 5, 6, 7, 8].filter((x) => x < den), 3);
      fs = nums.map((n) => F(n, den));
    } else {
      fs = distinctFractions(rng, count, 2, 5 + d * 2);
    }
    const asc = rng.chance(0.6);
    return orderBody(rng, {
      prompt: asc ? L('Order from smallest to largest.', 'رتّب من الأصغر إلى الأكبر.') : L('Order from largest to smallest.', 'رتّب من الأكبر إلى الأصغر.'),
      entries: fs.map((f) => ({ value: f, label: same(tx(f)) })),
      ascending: asc,
      hints: H(
        L('Find a common denominator.', 'جد مقامًا مشتركًا.'),
        L('Or convert each to a decimal.', 'أو حوّل كل كسر إلى عدد عشري.'),
        L('Compare two at a time.', 'قارن كسرين في كل مرة.'),
      ),
      steps: [
        L('Write all fractions with a common denominator (or as decimals).', 'اكتب الكسور بمقام مشترك (أو كأعداد عشرية).'),
        L('Compare the numerators and sort.', 'قارن البسوط ثم رتّب.'),
      ],
      explanation: L('Same-sized pieces are easy to compare.', 'من السهل مقارنة الأجزاء المتساوية الحجم.'),
    });
  }),

  G('largest', 'comparing-fractions', 'mcq', [2, 3, 4, 5], (rng, d) => {
    const fs = distinctFractions(rng, 4, 2, 5 + d * 2);
    const max = fs.reduce((x, y) => (y.gt(x) ? y : x));
    const bigDen = fs.reduce((x, y) => (y.d > x.d ? y : x));
    return mcqText(rng, {
      prompt: L('Which fraction is the largest?', 'أي كسر هو الأكبر؟'),
      correct: same(tx(max)),
      wrongs: fs
        .filter((f) => f !== max)
        .map((f) => ({ label: same(tx(f)), pid: f === bigDen ? 'compare-fraction-denominator' : undefined })),
      hints: H(
        L('Estimate each fraction: is it near 0, ½ or 1?', 'قدّر كل كسر: هل هو قريب من 0 أم ½ أم 1؟'),
        L('Convert to decimals if unsure.', 'حوّل إلى أعداد عشرية إن لم تكن متأكدًا.'),
        L(`The largest is about ${max.toDecimal(2)}.`, `أكبرها يساوي تقريبًا ${max.toDecimal(2)}.`),
      ),
      steps: [
        L('Convert every option to a decimal.', 'حوّل كل خيار إلى عدد عشري.'),
        L(`The largest decimal is ${max.toDecimal(3)}.`, `أكبر عدد عشري هو ${max.toDecimal(3)}.`),
      ],
      explanation: L('Compare values, not the sizes of the numbers in the fractions.', 'قارن القيم لا حجم الأعداد داخل الكسور.'),
    });
  }),

  G('half-benchmark', 'comparing-fractions', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const den = rng.int(3, 7 + d * 2);
    let num = rng.int(1, den - 1);
    if (num * 2 === den) num = num + 1 <= den - 1 ? num + 1 : num - 1;
    const greater = rng.chance(0.5);
    const isGreater = num * 2 > den;
    const truth = greater ? isGreater : !isGreater;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${fl(num, den)} ${greater ? '>' : '<'} \\frac{1}{2}`,
      truth,
      pid: 'compare-fraction-denominator',
      hints: H(
        L('Half of the denominator is the benchmark.', 'نصف المقام هو المعيار.'),
        L(`Half of ${den} is ${den / 2}.`, `نصف ${den} هو ${den / 2}.`),
        L(`Is ${num} more or less than ${den / 2}?`, `هل ${num} أكبر أم أصغر من ${den / 2}؟`),
      ),
      steps: [
        L(`Half of ${den} is ${den / 2}.`, `نصف ${den} هو ${den / 2}.`),
        L(`${num} is ${isGreater ? 'more' : 'less'} than that, so the fraction is ${isGreater ? 'greater' : 'less'} than ½.`, `${num} ${isGreater ? 'أكبر' : 'أصغر'} من ذلك، فالكسر ${isGreater ? 'أكبر' : 'أصغر'} من ½.`),
      ],
      explanation: L('Comparing with ½ is a fast way to judge a fraction.', 'المقارنة مع ½ طريقة سريعة للحكم على الكسر.'),
    });
  }),
];

// ───────────────────────── Adding & subtracting ─────────────────────────

const addSub: Generator[] = [
  G('add-like', 'add-sub-fractions', 'type-answer', [1, 2, 3], (rng, d) => {
    const den = rng.int(3, 6 + d * 3);
    const a = rng.int(1, den - 1);
    const b = rng.int(1, den - 1);
    const sum = F(a + b, den);
    return typed({
      prompt: L('Add. Give the answer in simplest form.', 'اجمع. اكتب الناتج في أبسط صورة.'),
      display: `${fl(a, den)} + ${fl(b, den)}`,
      value: sum,
      correct: same(tx(sum)),
      extra: { lowest: true },
      errors: [[F(a + b, den * 2), 'add-denominators']],
      hints: H(
        L('The denominators are the same.', 'المقامان متساويان.'),
        L('Add the numerators and keep the denominator.', 'اجمع البسطين وأبقِ المقام.'),
        L(`${a} + ${b} = ${a + b}.`, `${a} + ${b} = ${a + b}.`),
      ),
      steps: [
        L(`Keep the denominator ${den}.`, `نُبقي المقام ${den}.`),
        L(`Add numerators: ${a} + ${b} = ${a + b}.`, `نجمع البسطين: ${a} + ${b} = ${a + b}.`),
        L(`Simplify ${a + b}/${den} → ${sum.toString()}.`, `نبسّط ${a + b}/${den} ← ${sum.toString()}.`),
      ],
      explanation: L('Same-sized pieces can simply be counted together.', 'يمكن عدّ الأجزاء المتساوية الحجم معًا ببساطة.'),
    });
  }),

  G('add-unlike', 'add-sub-fractions', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    let fa: Fraction;
    let fb: Fraction;
    if (d === 2) {
      const b = rng.pick([2, 3, 4, 5]);
      fa = fracWithDen(rng, b);
      fb = fracWithDen(rng, b * 2);
    } else {
      const maxD = 4 + d * 2;
      let guard = 0;
      do {
        fa = properFrac(rng, 2, maxD);
        fb = properFrac(rng, 2, maxD);
      } while (fa.d === fb.d && guard++ < 50);
    }
    const sum = fa.add(fb);
    const lcd = fa.d * fb.d / gcd(fa.d, fb.d);
    return typed({
      prompt: L('Add. Give the answer in simplest form.', 'اجمع. اكتب الناتج في أبسط صورة.'),
      display: `${fa.toLatex()} + ${fb.toLatex()}`,
      value: sum,
      correct: same(tx(sum)),
      extra: { lowest: true },
      errors: [[F(fa.n + fb.n, fa.d + fb.d), 'add-denominators']],
      hints: H(
        L('The denominators are different — make them the same first.', 'المقامان مختلفان — وحّدهما أولًا.'),
        L(`A common denominator is ${lcd}.`, `مقام مشترك هو ${lcd}.`),
        L(`Rewrite as ${fa.n * (lcd / fa.d)}/${lcd} + ${fb.n * (lcd / fb.d)}/${lcd}.`, `أعد الكتابة: ${fa.n * (lcd / fa.d)}/${lcd} + ${fb.n * (lcd / fb.d)}/${lcd}.`),
      ),
      steps: [
        L(`Common denominator: ${lcd}.`, `المقام المشترك: ${lcd}.`),
        L(`${fa.n * (lcd / fa.d)}/${lcd} + ${fb.n * (lcd / fb.d)}/${lcd} = ${fa.n * (lcd / fa.d) + fb.n * (lcd / fb.d)}/${lcd}.`, `${fa.n * (lcd / fa.d)}/${lcd} + ${fb.n * (lcd / fb.d)}/${lcd} = ${fa.n * (lcd / fa.d) + fb.n * (lcd / fb.d)}/${lcd}.`),
        L(`Simplified: ${sum.toString()}.`, `بعد التبسيط: ${sum.toString()}.`),
      ],
      explanation: L('You can only add pieces of the same size, so change the denominators to match.', 'لا يمكن جمع إلا الأجزاء المتساوية الحجم، لذا نوحّد المقامات.'),
    });
  }),

  G('subtract-unlike', 'add-sub-fractions', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let fa: Fraction;
    let fb: Fraction;
    let guard = 0;
    do {
      if (d === 1) {
        const den = rng.int(3, 9);
        fa = F(rng.int(1, den - 1), den);
        fb = F(rng.int(1, den - 1), den);
      } else {
        const maxD = 4 + d * 2;
        fa = properFrac(rng, 2, maxD);
        fb = properFrac(rng, 2, maxD);
      }
      if (fa.lt(fb)) [fa, fb] = [fb, fa];
    } while (fa.eq(fb) && guard++ < 60);
    if (fa.eq(fb)) {
      fa = F(3, 4);
      fb = F(1, 4);
    }
    const diff = fa.sub(fb);
    const errors: [Fraction, string][] = [];
    if (fa.d > fb.d) errors.push([F(fa.n - fb.n, fa.d - fb.d), 'add-denominators']);
    return typed({
      prompt: L('Subtract. Give the answer in simplest form.', 'اطرح. اكتب الناتج في أبسط صورة.'),
      display: `${fa.toLatex()} - ${fb.toLatex()}`,
      value: diff,
      correct: same(tx(diff)),
      extra: { lowest: true },
      errors,
      hints: H(
        L('Use a common denominator, then subtract the numerators.', 'استعمل مقامًا مشتركًا ثم اطرح البسطين.'),
        L(`Common denominator: ${(fa.d * fb.d) / gcd(fa.d, fb.d)}.`, `المقام المشترك: ${(fa.d * fb.d) / gcd(fa.d, fb.d)}.`),
        L('Finish by simplifying.', 'أنهِ بالتبسيط.'),
      ),
      steps: [
        L(`Common denominator: ${(fa.d * fb.d) / gcd(fa.d, fb.d)}.`, `المقام المشترك: ${(fa.d * fb.d) / gcd(fa.d, fb.d)}.`),
        L('Subtract the numerators and keep the denominator.', 'اطرح البسطين وأبقِ المقام.'),
        L(`Result: ${diff.toString()}.`, `الناتج: ${diff.toString()}.`),
      ],
      explanation: L('Subtracting fractions works like adding them: same-sized pieces first.', 'يشبه طرح الكسور جمعها: نوحّد حجم الأجزاء أولًا.'),
    });
  }),

  G('pizza-story', 'add-sub-fractions', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    let fa: Fraction;
    let fb: Fraction;
    do {
      fa = properFrac(rng, 2, 3 + d * 2);
      fb = properFrac(rng, 2, 3 + d * 2);
    } while (fa.add(fb).gt(F(1)) && rng.chance(0.9));
    const sum = fa.add(fb);
    return typed({
      prompt: L(
        `${p.en} ate ${tx(fa)} of a cake at lunch and ${tx(fb)} of the same cake at dinner. How much of the cake did ${p.en} eat in total?`,
        `تناول ${p.ar} ${tx(fa)} من كعكة في الغداء و ${tx(fb)} من الكعكة نفسها في العشاء. كم تناول من الكعكة في المجموع؟`,
      ),
      value: sum,
      correct: same(tx(sum)),
      extra: { lowest: true },
      errors: [[F(fa.n + fb.n, fa.d + fb.d), 'add-denominators']],
      hints: H(
        L('"In total" means add.', '«في المجموع» تعني الجمع.'),
        L('Use a common denominator.', 'استعمل مقامًا مشتركًا.'),
        L(`${tx(fa)} + ${tx(fb)} = ?`, `${tx(fa)} + ${tx(fb)} = ؟`),
      ),
      steps: [
        L(`Add: ${tx(fa)} + ${tx(fb)}.`, `نجمع: ${tx(fa)} + ${tx(fb)}.`),
        L(`Total = ${tx(sum)}.`, `المجموع = ${tx(sum)}.`),
      ],
      explanation: L('Parts of the same whole are added with a common denominator.', 'تُجمع أجزاء الكل الواحد بمقام مشترك.'),
    });
  }),

  G('true-add', 'add-sub-fractions', 'true-false', [2, 3, 4, 5], (rng, d) => {
    let fa: Fraction;
    let fb: Fraction;
    let guard = 0;
    do {
      fa = properFrac(rng, 2, 3 + d * 2);
      fb = properFrac(rng, 2, 3 + d * 2);
    } while (fa.d === fb.d && guard++ < 40);
    const real = fa.add(fb);
    const fake = F(fa.n + fb.n, fa.d + fb.d);
    const truth = fake.eq(real) ? true : rng.chance(0.5);
    const shown = truth ? real : fake;
    return tfBody({
      prompt: L('Is this addition correct?', 'هل عملية الجمع هذه صحيحة؟'),
      display: `${fa.toLatex()} + ${fb.toLatex()} = ${shown.toLatex()}`,
      truth,
      pid: 'add-denominators',
      hints: H(
        L('Work it out with a common denominator.', 'احسبها بمقام مشترك.'),
        L('Never add the denominators.', 'لا تجمع المقامات أبدًا.'),
        L(`The right answer is ${real.toString()}.`, `الناتج الصحيح هو ${real.toString()}.`),
      ),
      steps: [
        L(`Correct sum: ${tx(real)}.`, `المجموع الصحيح: ${tx(real)}.`),
        L(`The statement shows ${tx(shown)} → ${truth ? 'true' : 'false'}.`, `العبارة تعرض ${tx(shown)} ← ${truth ? 'صحيحة' : 'خاطئة'}.`),
      ],
      explanation: L('Adding top to top and bottom to bottom is a classic mistake.', 'جمع البسط مع البسط والمقام مع المقام خطأ شائع.'),
    });
  }),

  G('first-step', 'add-sub-fractions', 'select-formula', [2, 3, 4, 5], (rng, d) => {
    const pairs: [number, number][] = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [5, 6], [4, 7]];
    const [b, e] = rng.pick(pairs.slice(0, 3 + d));
    const a = coprimeNum(rng, b);
    const c = coprimeNum(rng, e);
    return mcqText(rng, {
      prompt: L('Which is the correct first step for adding these fractions?', 'ما الخطوة الأولى الصحيحة لجمع هذين الكسرين؟'),
      display: `${fl(a, b)} + ${fl(c, e)}`,
      correct: same(`$${fl(a * e, b * e)} + ${fl(c * b, b * e)}$`),
      wrongs: [
        { label: same(mf(a + c, b + e)), pid: 'add-denominators' },
        { label: same(mf(a + c, b * e)), pid: 'common-denominator' },
        { label: same(mf(a * c, b * e)), pid: 'wrong-operation' },
      ],
      hints: H(
        L('Pieces must be the same size before adding.', 'يجب أن تكون الأجزاء متساوية الحجم قبل الجمع.'),
        L(`A common denominator is ${b} × ${e} = ${b * e}.`, `مقام مشترك هو ${b} × ${e} = ${b * e}.`),
        L('Change both numerators too.', 'غيّر البسطين أيضًا.'),
      ),
      steps: [
        L(`Common denominator: ${b * e}.`, `المقام المشترك: ${b * e}.`),
        L(`Multiply each numerator by the same factor as its denominator.`, `اضرب كل بسط في العامل نفسه الذي ضُرب به مقامه.`),
      ],
      explanation: L('Rewrite both fractions over a common denominator, then add the numerators.', 'أعد كتابة الكسرين بمقام مشترك ثم اجمع البسطين.'),
    });
  }),
];

// ───────────────────────── Multiplying & dividing ─────────────────────────

const mulDiv: Generator[] = [
  G('multiply', 'mul-div-fractions', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let display: string;
    let value: Fraction;
    let steps: string;
    if (d === 1) {
      const f = properFrac(rng, 2, 6);
      const n = rng.int(2, 6);
      value = f.mul(F(n));
      display = `${f.toLatex()} \\times ${n}`;
      steps = `${f.n} × ${n} / ${f.d}`;
    } else {
      const fa = properFrac(rng, 2, 3 + d * 2);
      const fb = properFrac(rng, 2, 3 + d * 2);
      value = fa.mul(fb);
      display = `${fa.toLatex()} \\times ${fb.toLatex()}`;
      steps = `(${fa.n} × ${fb.n}) / (${fa.d} × ${fb.d})`;
    }
    return typed({
      prompt: L('Multiply. Give the answer in simplest form.', 'اضرب. اكتب الناتج في أبسط صورة.'),
      display,
      value,
      correct: same(tx(value)),
      extra: { lowest: true },
      hints: H(
        L('Multiply the numerators together and the denominators together.', 'اضرب البسطين معًا والمقامين معًا.'),
        L('Simplify at the end (or cancel first).', 'بسّط في النهاية (أو اختصر أولًا).'),
        L(`Setup: ${steps}.`, `الصياغة: ${steps}.`),
      ),
      steps: [
        L('Multiply tops and bottoms.', 'اضرب البسوط والمقامات.'),
        L(`Result before simplifying: ${steps}.`, `الناتج قبل التبسيط: ${steps}.`),
        L(`Simplified: ${value.toString()}.`, `بعد التبسيط: ${value.toString()}.`),
      ],
      explanation: L('Multiplying fractions needs no common denominator.', 'ضرب الكسور لا يحتاج إلى مقام مشترك.'),
    });
  }),

  G('divide', 'mul-div-fractions', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const fa = properFrac(rng, 2, 3 + d * 2);
    const fb = properFrac(rng, 2, 3 + d * 2);
    const value = fa.div(fb);
    return typed({
      prompt: L('Divide. Give the answer in simplest form.', 'اقسم. اكتب الناتج في أبسط صورة.'),
      display: `${fa.toLatex()} \\div ${fb.toLatex()}`,
      value,
      correct: same(tx(value)),
      extra: { lowest: true },
      errors: [
        [fa.mul(fb), 'fraction-flip'],
        [fa.inv().mul(fb), 'fraction-flip'],
      ],
      hints: H(
        L('Dividing by a fraction is the same as multiplying by its reciprocal.', 'القسمة على كسر تساوي الضرب في مقلوبه.'),
        L('Keep the first fraction, flip the second.', 'أبقِ الكسر الأول واقلب الثاني.'),
        L(`${fa.toString()} × ${fb.inv().toString()}`, `${fa.toString()} × ${fb.inv().toString()}`),
      ),
      steps: [
        L(`Flip the second fraction: ${fb.toString()} → ${fb.inv().toString()}.`, `نقلب الكسر الثاني: ${fb.toString()} ← ${fb.inv().toString()}.`),
        L(`Multiply: ${fa.toString()} × ${fb.inv().toString()} = ${value.toString()}.`, `نضرب: ${fa.toString()} × ${fb.inv().toString()} = ${value.toString()}.`),
      ],
      explanation: L('Division asks "how many of these fit in that?", which is multiplication by the reciprocal.', 'القسمة تسأل «كم مرة يتسع هذا في ذاك؟» وهي ضرب في المقلوب.'),
    });
  }),

  G('fraction-of-amount', 'mul-div-fractions', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const den = rng.pick(d <= 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8, 10]);
    const num = coprimeNum(rng, den);
    const k = rng.int(2, 4 + d * 2);
    const total = den * k;
    const errors: [number, string][] = [[total * num, 'wrong-operation']];
    if (num !== 1) errors.push([k, 'wrong-operation']);
    return typed({
      prompt: L(
        `${p.en} has ${total} stickers and gives away ${tx(F(num, den))} of them. How many stickers does ${p.en} give away?`,
        `مع ${p.ar} ${total} ملصقًا، وأعطى ${tx(F(num, den))} منها لأصدقائه. كم ملصقًا أعطى؟`,
      ),
      value: num * k,
      extra: { integerOnly: true },
      errors,
      hints: H(
        L('"Of" means multiply.', 'كلمة «من» تعني الضرب.'),
        L(`Find one part first: ${total} ÷ ${den}.`, `أوجد جزءًا واحدًا أولًا: ${total} ÷ ${den}.`),
        L(`Then take ${num} of those parts.`, `ثم خذ ${num} من هذه الأجزاء.`),
      ),
      steps: [
        L(`${total} ÷ ${den} = ${k} (one part).`, `${total} ÷ ${den} = ${k} (جزء واحد).`),
        L(`${k} × ${num} = ${num * k}.`, `${k} × ${num} = ${num * k}.`),
      ],
      explanation: L('To find a fraction of an amount, divide by the denominator and multiply by the numerator.', 'لإيجاد كسر من كمية، اقسم على المقام ثم اضرب في البسط.'),
    });
  }),

  G('division-rule', 'mul-div-fractions', 'select-formula', [2, 3, 4, 5], (rng, d) => {
    const fa = properFrac(rng, 2, 3 + d * 2);
    const fb = properFrac(rng, 2, 3 + d * 2);
    return mcqText(rng, {
      prompt: L('Which expression is equal to this division?', 'أي تعبير يساوي عملية القسمة هذه؟'),
      display: `${fa.toLatex()} \\div ${fb.toLatex()}`,
      correct: same(`$${fa.toLatex()} \\times ${fb.inv().toLatex()}$`),
      wrongs: [
        { label: same(`$${fa.toLatex()} \\times ${fb.toLatex()}$`), pid: 'fraction-flip' },
        { label: same(`$${fa.inv().toLatex()} \\times ${fb.toLatex()}$`), pid: 'fraction-flip' },
        { label: same(`$${fa.toLatex()} \\div ${fb.inv().toLatex()}$`), pid: 'fraction-flip' },
      ],
      hints: H(
        L('Think "keep, change, flip".', 'فكّر: «أبقِ، غيّر، اقلب».'),
        L('Keep the first, change ÷ to ×, flip the second.', 'أبقِ الأول، غيّر ÷ إلى ×، واقلب الثاني.'),
        L(`Flip ${fb.toString()} to get ${fb.inv().toString()}.`, `اقلب ${fb.toString()} لتحصل على ${fb.inv().toString()}.`),
      ),
      steps: [L('Keep the first fraction, change ÷ to ×, and use the reciprocal of the second.', 'نُبقي الكسر الأول، ونغيّر ÷ إلى ×، ونستعمل مقلوب الثاني.')],
      explanation: L('Dividing by a number is the same as multiplying by its reciprocal.', 'القسمة على عدد تساوي الضرب في مقلوبه.'),
    });
  }),

  G('reciprocal', 'mul-div-fractions', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const useInt = d >= 2 && rng.chance(0.3);
    const f = useInt ? F(rng.int(2, 9)) : properFrac(rng, 2, 4 + d * 2);
    const value = f.inv();
    return typed({
      prompt: L('Write the reciprocal.', 'اكتب المقلوب.'),
      display: f.toLatex(),
      value,
      correct: same(tx(value)),
      hints: H(
        L('The reciprocal flips the fraction upside down.', 'المقلوب يقلب الكسر رأسًا على عقب.'),
        L('A whole number n is n/1.', 'العدد الصحيح n هو n/1.'),
        L(`Swap ${f.n} and ${f.d}.`, `بدّل بين ${f.n} و ${f.d}.`),
      ),
      steps: [L(`${f.toString()} → ${value.toString()}.`, `${f.toString()} ← ${value.toString()}.`)],
      explanation: L('A number times its reciprocal is always 1.', 'حاصل ضرب العدد في مقلوبه يساوي 1 دائمًا.'),
    });
  }),
];

// ───────────────────────── Mixed numbers ─────────────────────────

const mixed: Generator[] = [
  G('to-improper', 'mixed-numbers', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const den = rng.int(2, 3 + d * 2);
    const n = coprimeNum(rng, den);
    const w = rng.int(1, 2 + d);
    const value = F(w * den + n, den);
    return typed({
      prompt: L('Write as an improper fraction.', 'اكتب على صورة كسر غير اعتيادي.'),
      display: mix(w, n, den),
      value,
      correct: same(tx(value)),
      errors: [[F(w + n, den), 'wrong-operation']],
      hints: H(
        L('Turn the whole number into parts of the same size.', 'حوّل العدد الصحيح إلى أجزاء بالحجم نفسه.'),
        L(`${w} wholes = ${w} × ${den} parts.`, `${w} من الوحدات = ${w} × ${den} جزءًا.`),
        L('Add the extra parts.', 'أضف الأجزاء الإضافية.'),
      ),
      steps: [
        L(`${w} × ${den} = ${w * den}.`, `${w} × ${den} = ${w * den}.`),
        L(`${w * den} + ${n} = ${w * den + n}.`, `${w * den} + ${n} = ${w * den + n}.`),
        L(`Answer: ${w * den + n}/${den}.`, `الناتج: ${w * den + n}/${den}.`),
      ],
      explanation: L('Whole × denominator + numerator, over the same denominator.', 'العدد الصحيح × المقام + البسط، فوق المقام نفسه.'),
    });
  }),

  G('to-mixed', 'mixed-numbers', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const den = rng.int(2, 3 + d * 2);
    const n = coprimeNum(rng, den);
    const w = rng.int(1, 2 + d);
    const value = F(w * den + n, den);
    return typed({
      prompt: L('Write as a mixed number (for example 2 1/3).', 'اكتب على صورة عدد كسري (مثل 2 1/3).'),
      display: fl(w * den + n, den),
      value,
      correct: same(`$${value.toMixedLatex()}$`),
      mode: 'text',
      hints: H(
        L('How many whole groups of the denominator fit in the numerator?', 'كم مرة يتسع المقام في البسط؟'),
        L(`${w * den + n} ÷ ${den}`, `${w * den + n} ÷ ${den}`),
        L('The remainder becomes the new numerator.', 'يصبح الباقي هو البسط الجديد.'),
      ),
      steps: [
        L(`${w * den + n} ÷ ${den} = ${w} remainder ${n}.`, `${w * den + n} ÷ ${den} = ${w} والباقي ${n}.`),
        L(`Whole part ${w}, fraction ${n}/${den}.`, `الجزء الصحيح ${w}، والكسر ${n}/${den}.`),
      ],
      explanation: L('The quotient is the whole part; the remainder goes over the denominator.', 'ناتج القسمة هو الجزء الصحيح، والباقي يوضع فوق المقام.'),
    });
  }),

  G('convert-choice', 'mixed-numbers', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const den = rng.int(3, 4 + d * 2);
    const n = coprimeNum(rng, den);
    const w = rng.int(1, 3 + d);
    return mcqText(rng, {
      prompt: L('Which mixed number equals this fraction?', 'أي عدد كسري يساوي هذا الكسر؟'),
      display: fl(w * den + n, den),
      correct: same(`$${mix(w, n, den)}$`),
      wrongs: [
        { label: same(`$${mix(w + 1, n, den)}$`), pid: 'off-by-one' },
        { label: same(`$${mix(w, den - n, den)}$`) },
        { label: same(`$${mix(Math.max(1, w - 1), n, den)}$`), pid: 'off-by-one' },
        { label: same(`$${mix(w + 2, n, den)}$`) },
      ],
      hints: H(
        L('Divide the numerator by the denominator.', 'اقسم البسط على المقام.'),
        L('The quotient is the whole number.', 'ناتج القسمة هو العدد الصحيح.'),
        L('The remainder is the new numerator.', 'الباقي هو البسط الجديد.'),
      ),
      steps: [L(`${w * den + n} ÷ ${den} = ${w} remainder ${n}.`, `${w * den + n} ÷ ${den} = ${w} والباقي ${n}.`)],
      explanation: L('Check by converting back: whole × denominator + numerator.', 'تحقق بالتحويل عكسيًا: العدد الصحيح × المقام + البسط.'),
    });
  }),

  G('add-mixed', 'mixed-numbers', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const w1 = rng.int(1, 3);
    const w2 = rng.int(1, 3);
    const sameDen = d <= 2;
    const den1 = rng.int(3, 4 + d * 2);
    const f1 = fracWithDen(rng, den1);
    let f2: Fraction;
    if (sameDen) f2 = fracWithDen(rng, den1);
    else {
      let guard = 0;
      do f2 = properFrac(rng, 2, 4 + d * 2);
      while (f2.d === den1 && guard++ < 40);
    }
    const total = F(w1).add(f1).add(F(w2)).add(f2);
    return typed({
      prompt: L('Add. Write the answer as a mixed number or fraction.', 'اجمع. اكتب الناتج كعدد كسري أو كسر.'),
      display: `${mix(w1, f1.n, f1.d)} + ${mix(w2, f2.n, f2.d)}`,
      value: total,
      correct: same(`$${total.toMixedLatex()}$`),
      mode: 'text',
      hints: H(
        L('Add the whole numbers and the fractions separately.', 'اجمع الأعداد الصحيحة والكسور كلًّا على حدة.'),
        L(`Wholes: ${w1} + ${w2} = ${w1 + w2}.`, `الأعداد الصحيحة: ${w1} + ${w2} = ${w1 + w2}.`),
        L(`Fractions: ${f1.toString()} + ${f2.toString()}.`, `الكسور: ${f1.toString()} + ${f2.toString()}.`),
      ),
      steps: [
        L(`Wholes: ${w1 + w2}.`, `الأعداد الصحيحة: ${w1 + w2}.`),
        L(`Fractions: ${f1.toString()} + ${f2.toString()} = ${f1.add(f2).toString()}.`, `الكسور: ${f1.toString()} + ${f2.toString()} = ${f1.add(f2).toString()}.`),
        L(`Total: ${total.toString()}.`, `المجموع: ${total.toString()}.`),
      ],
      explanation: L('If the fractions add to more than 1, carry the extra whole into the whole-number part.', 'إذا زاد مجموع الكسور على 1 فانقل الوحدة الزائدة إلى الجزء الصحيح.'),
    });
  }),

  G('compare-mixed', 'mixed-numbers', 'compare', [3, 4, 5], (rng, d) => {
    const den = rng.int(2, 5 + d);
    const n = coprimeNum(rng, den);
    const w = rng.int(1, 3);
    const a = F(w * den + n, den);
    const q = rng.int(2, 6);
    const p = Math.max(1, Math.round(a.toNumber() * q) + rng.int(-1, 1));
    const b = F(p, q);
    return compareBody({
      prompt: L('Compare.', 'قارن.'),
      a,
      b,
      aTex: mix(w, n, den),
      bTex: fl(p, q),
      hints: H(
        L('Turn both into improper fractions or both into decimals.', 'حوّل الاثنين إلى كسور غير اعتيادية أو إلى أعداد عشرية.'),
        L(`${w} × ${den} + ${n} = ${w * den + n}, so the first number is ${a.toString()}.`, `${w} × ${den} + ${n} = ${w * den + n}، فالعدد الأول هو ${a.toString()}.`),
        L(`Compare ${a.toDecimal(3)} and ${b.toDecimal(3)}.`, `قارن ${a.toDecimal(3)} و ${b.toDecimal(3)}.`),
      ),
      steps: [
        L(`First number = ${a.toString()} ≈ ${a.toDecimal(3)}.`, `العدد الأول = ${a.toString()} ≈ ${a.toDecimal(3)}.`),
        L(`Second number = ${b.toString()} ≈ ${b.toDecimal(3)}.`, `العدد الثاني = ${b.toString()} ≈ ${b.toDecimal(3)}.`),
      ],
      explanation: L('Use the same form for both numbers before comparing.', 'استعمل الصورة نفسها للعددين قبل المقارنة.'),
    });
  }),

  G('walk-story', 'mixed-numbers', 'word-problem', [2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const den = rng.pick([2, 4, 5]);
    const f1 = fracWithDen(rng, den);
    const f2 = fracWithDen(rng, den);
    const w1 = rng.int(1, 2 + d);
    const w2 = rng.int(1, 2 + d);
    const total = F(w1).add(f1).add(F(w2)).add(f2);
    return typed({
      prompt: L(
        `${p.en} walked $${mix(w1, f1.n, f1.d)}$ km on Monday and $${mix(w2, f2.n, f2.d)}$ km on Tuesday. How many kilometres did ${p.en} walk in total?`,
        `مشى ${p.ar} مسافة $${mix(w1, f1.n, f1.d)}$ كم يوم الاثنين و $${mix(w2, f2.n, f2.d)}$ كم يوم الثلاثاء. كم كيلومترًا مشى في المجموع؟`,
      ),
      value: total,
      correct: same(`$${total.toMixedLatex()}$`),
      suffix: 'km',
      mode: 'text',
      hints: H(
        L('Total distance means add.', 'المسافة الكلية تعني الجمع.'),
        L('Add the wholes, then the fractions.', 'اجمع الأعداد الصحيحة ثم الكسور.'),
        L(`${w1} + ${w2} = ${w1 + w2}, and ${f1.toString()} + ${f2.toString()} = ${f1.add(f2).toString()}.`, `${w1} + ${w2} = ${w1 + w2}، و ${f1.toString()} + ${f2.toString()} = ${f1.add(f2).toString()}.`),
      ),
      steps: [L(`Total = ${total.toString()} km.`, `المجموع = ${total.toString()} كم.`)],
      explanation: L('Distances are added just like any other quantities.', 'تُجمع المسافات مثل أي كميات أخرى.'),
    });
  }),
];

// ───────────────────────── Decimals ─────────────────────────

const PLACE_NAMES = {
  tenths: L('tenths', 'الأعشار'),
  hundredths: L('hundredths', 'الأجزاء من مئة'),
  thousandths: L('thousandths', 'الأجزاء من ألف'),
  ones: L('ones', 'الآحاد'),
  tens: L('tens', 'العشرات'),
};

const decimals: Generator[] = [
  G('place-name', 'decimals', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const digits = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const w = digits[0] as number;
    const f = [digits[1], digits[2], digits[3]] as number[];
    const places = d <= 2 ? 2 : 3;
    const text = `${w}.${f.slice(0, places).join('')}`;
    const idx = rng.int(0, places - 1);
    const digit = f[idx] as number;
    const names = ['tenths', 'hundredths', 'thousandths'] as const;
    const correctKey = names[idx] as (typeof names)[number];
    const all: (keyof typeof PLACE_NAMES)[] = ['tenths', 'hundredths', 'thousandths', 'ones', 'tens'];
    return mcqText(rng, {
      prompt: L(`In ${mt(text)}, which place is the digit ${digit} in?`, `في العدد ${mt(text)}، في أي خانة يقع الرقم ${digit}؟`),
      correct: PLACE_NAMES[correctKey],
      wrongs: all.filter((k) => k !== correctKey).map((k) => ({ label: PLACE_NAMES[k], pid: 'place-value' })),
      hints: H(
        L('Count places to the right of the decimal point.', 'عدّ الخانات على يمين الفاصلة العشرية.'),
        L('First place: tenths, second: hundredths, third: thousandths.', 'الأولى: الأعشار، الثانية: الأجزاء من مئة، الثالثة: الأجزاء من ألف.'),
        L(`The digit ${digit} is in place number ${idx + 1} after the point.`, `الرقم ${digit} في الخانة رقم ${idx + 1} بعد الفاصلة.`),
      ),
      steps: [L(`Place ${idx + 1} after the decimal point is ${PLACE_NAMES[correctKey].en}.`, `الخانة رقم ${idx + 1} بعد الفاصلة هي ${PLACE_NAMES[correctKey].ar}.`)],
      explanation: L('Each place to the right is ten times smaller.', 'كل خانة إلى اليمين أصغر بعشر مرات.'),
    });
  }),

  G('expand-decimal', 'decimals', 'fill-blank', [2, 3, 4], (rng) => {
    const a = rng.int(1, 9);
    const b = rng.int(1, 9);
    const c = rng.int(1, 9);
    return typed({
      prompt: L(
        `Fill in the blank: ${mt(`0.${a}${b}${c}`)} = ${a} tenths + ${b} hundredths + ___ thousandths`,
        `أكمل: ${mt(`0.${a}${b}${c}`)} = ${a} أعشار + ${b} أجزاء من مئة + ___ أجزاء من ألف`,
      ),
      value: c,
      extra: { integerOnly: true },
      hints: H(
        L('Read the digits one place at a time.', 'اقرأ الأرقام خانةً خانة.'),
        L('The third digit after the point is the thousandths.', 'الرقم الثالث بعد الفاصلة هو الأجزاء من ألف.'),
        L(`It is ${c}.`, `إنه ${c}.`),
      ),
      steps: [L(`0.${a}${b}${c}: tenths = ${a}, hundredths = ${b}, thousandths = ${c}.`, `0.${a}${b}${c}: الأعشار = ${a}، الأجزاء من مئة = ${b}، الأجزاء من ألف = ${c}.`)],
      explanation: L('A decimal is a sum of its place values.', 'العدد العشري هو مجموع قيم خاناته.'),
    });
  }),

  G('compare-decimals', 'decimals', 'compare', [1, 2, 3, 4, 5], (rng, d) => {
    const pa = d <= 2 ? 1 : rng.int(1, 2);
    const pb = d === 1 ? 1 : differ(rng, 1, d >= 4 ? 3 : 2, pa);
    const A = dnum(rng, pa, d >= 3 ? 2 : 0);
    let B = dnum(rng, pb, d >= 3 ? 2 : 0);
    let bText = B.text;
    let bVal = B.value;
    if (d >= 4 && rng.chance(0.2)) {
      bText = `${A.text}0`;
      bVal = A.value;
    } else if (A.value.eq(B.value)) {
      B = dnum(rng, pb, d >= 3 ? 2 : 0);
      bText = B.text;
      bVal = B.value;
    }
    return compareBody({
      prompt: L('Compare the two decimals.', 'قارن بين العددين العشريين.'),
      a: A.value,
      b: bVal,
      aTex: A.text,
      bTex: bText,
      pids: { lt: 'compare-decimal-length', gt: 'compare-decimal-length', eq: 'compare-decimal-length' },
      hints: H(
        L('Compare digit by digit from the left.', 'قارن رقمًا رقمًا من اليسار.'),
        L('Give both numbers the same number of decimal places by adding zeros.', 'اجعل للعددين عدد الخانات العشرية نفسه بإضافة أصفار.'),
        L(`${A.value.toDecimal(3).padEnd(6, '0')} vs ${bVal.toDecimal(3).padEnd(6, '0')} (padded).`, `${A.value.toDecimal(3)} مقابل ${bVal.toDecimal(3)}.`),
      ),
      steps: [
        L('Write both with the same number of decimal places.', 'اكتب العددين بالعدد نفسه من الخانات العشرية.'),
        L('Compare from the leftmost digit: the first difference decides.', 'قارن من أقصى اليسار: أول اختلاف يحسم الأمر.'),
      ],
      explanation: L('A longer decimal is not necessarily bigger: 0.5 is larger than 0.45.', 'العدد العشري الأطول ليس بالضرورة أكبر: 0.5 أكبر من 0.45.'),
    });
  }),

  G('order-decimals', 'decimals', 'ordering', [1, 2, 3, 4, 5], (rng, d) => {
    const count = d <= 2 ? 3 : d <= 4 ? 4 : 5;
    const items: Dec[] = [];
    let guard = 0;
    while (items.length < count && guard++ < 200) {
      const x = dnum(rng, rng.int(1, d >= 3 ? 3 : 2), d >= 2 ? 1 : 0);
      if (!items.some((i) => i.value.eq(x.value))) items.push(x);
    }
    const asc = rng.chance(0.6);
    return orderBody(rng, {
      prompt: asc ? L('Order from smallest to largest.', 'رتّب من الأصغر إلى الأكبر.') : L('Order from largest to smallest.', 'رتّب من الأكبر إلى الأصغر.'),
      entries: items.map((x) => ({ value: x.value, label: same(x.text) })),
      ascending: asc,
      hints: H(
        L('Add zeros so all numbers have the same length.', 'أضف أصفارًا ليصبح لكل الأعداد الطول نفسه.'),
        L('Compare whole parts first, then tenths, then hundredths.', 'قارن الأجزاء الصحيحة أولًا ثم الأعشار ثم الأجزاء من مئة.'),
        L('Do not be fooled by longer numbers.', 'لا تنخدع بالأعداد الأطول.'),
      ),
      steps: [L('Pad with zeros, then compare place by place from the left.', 'نضيف أصفارًا ثم نقارن خانةً خانة من اليسار.')],
      explanation: L('Place value decides the order, not how many digits there are.', 'القيمة المكانية هي التي تحدد الترتيب لا عدد الأرقام.'),
    });
  }),

  G('round-decimal', 'decimals', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const places = d <= 2 ? 2 : 3;
    const target = d <= 2 ? 1 : rng.int(1, 2);
    const x = dnum(rng, places, d >= 3 ? 20 : 9);
    const total = x.whole * 10 ** places + x.frac;
    const q = 10 ** (places - target);
    const lower = Math.floor(total / q);
    const up = (total % q) * 2 >= q;
    const rounded = up ? lower + 1 : lower;
    const wrong = up ? lower : lower + 1;
    const unit = target === 1 ? L('tenth', 'أقرب عُشر') : L('hundredth', 'أقرب جزء من مئة');
    const value = fromScaled(rounded, target);
    return typed({
      prompt: L(`Round ${mt(x.text)} to the nearest ${unit.en}.`, `قرّب ${mt(x.text)} إلى ${unit.ar}.`),
      value,
      correct: D(value),
      errors: [[fromScaled(wrong, target), 'rounding-direction']],
      hints: H(
        L('Look at the digit just after the place you are rounding to.', 'انظر إلى الرقم الذي يلي الخانة المطلوبة مباشرة.'),
        L('5 or more: round up. 4 or less: stay.', '5 فأكثر: قرّب لأعلى. 4 فأقل: أبقِ.'),
        L(`The next digit is ${String(x.frac).padStart(places, '0')[target]}.`, `الرقم التالي هو ${String(x.frac).padStart(places, '0')[target]}.`),
      ),
      steps: [
        L(`Rounding digit: place ${target} after the point. Next digit: ${String(x.frac).padStart(places, '0')[target]}.`, `خانة التقريب: رقم ${target} بعد الفاصلة. الرقم التالي: ${String(x.frac).padStart(places, '0')[target]}.`),
        L(`${up ? 'Round up' : 'Keep'} → ${value.toDecimal(3)}.`, `${up ? 'نقرّب لأعلى' : 'نُبقي'} ← ${value.toDecimal(3)}.`),
      ],
      explanation: L('The digit to the right of the rounding place decides.', 'الرقم الذي على يمين خانة التقريب هو الذي يحسم.'),
    });
  }),

  G('true-decimal', 'decimals', 'true-false', [1, 2, 3, 4], (rng) => {
    const A = dnum(rng, 1, 0);
    const B = dnum(rng, 2, 0);
    const claimLess = rng.chance(0.5);
    const isLess = A.value.lt(B.value);
    const eq = A.value.eq(B.value);
    const truth = claimLess ? isLess : !isLess && !eq;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${A.text} ${claimLess ? '<' : '>'} ${B.text}`,
      truth,
      pid: 'compare-decimal-length',
      hints: H(
        L('Write both with two decimal places.', 'اكتب كليهما بخانتين عشريتين.'),
        L(`${A.text} = ${A.text}0.`, `${A.text} = ${A.text}0.`),
        L('Now compare like whole numbers.', 'والآن قارن كالأعداد الصحيحة.'),
      ),
      steps: [
        L(`${A.value.toDecimal(2).padEnd(4, '0')} vs ${B.text}.`, `${A.value.toDecimal(2).padEnd(4, '0')} مقابل ${B.text}.`),
        L(`The statement is ${truth ? 'true' : 'false'}.`, `العبارة ${truth ? 'صحيحة' : 'خاطئة'}.`),
      ],
      explanation: L('Extra digits do not make a decimal bigger.', 'الأرقام الإضافية لا تجعل العدد العشري أكبر.'),
    });
  }),
];

// ───────────────────────── Decimal operations ─────────────────────────

const decOps: Generator[] = [
  G('add-sub', 'decimal-operations', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const pa = d === 1 ? 1 : rng.int(1, 2);
    const pb = d <= 2 ? pa : differ(rng, 1, d >= 4 ? 3 : 2, pa);
    let A = dnum(rng, pa, d <= 2 ? 9 : 40);
    let B = dnum(rng, pb, d <= 2 ? 9 : 40);
    const sub = rng.chance(0.5);
    if (sub && A.value.lt(B.value)) [A, B] = [B, A];
    const value = sub ? A.value.sub(B.value) : A.value.add(B.value);
    const errors: [Fraction, string][] = [];
    if (A.places !== B.places) {
      const sa = A.whole * 10 ** A.places + A.frac;
      const sb = B.whole * 10 ** B.places + B.frac;
      const mp = Math.max(A.places, B.places);
      errors.push([fromScaled(sub ? Math.abs(sa - sb) : sa + sb, mp), 'place-value']);
    }
    return typed({
      prompt: L('Calculate.', 'احسب.'),
      display: `${A.text} ${sub ? '-' : '+'} ${B.text}`,
      value,
      correct: D(value),
      errors,
      hints: H(
        L('Line up the decimal points.', 'ضع الفواصل العشرية في عمود واحد.'),
        L('Add zeros so both numbers have the same number of decimal places.', 'أضف أصفارًا ليكون لكلا العددين العدد نفسه من الخانات العشرية.'),
        L('Then add or subtract like whole numbers.', 'ثم اجمع أو اطرح كالأعداد الصحيحة.'),
      ),
      steps: [
        L('Align the decimal points and pad with zeros.', 'نحاذي الفواصل العشرية ونضيف أصفارًا.'),
        L(`${A.text} ${sub ? '−' : '+'} ${B.text} = ${value.toDecimal(4)}.`, `${A.text} ${sub ? '−' : '+'} ${B.text} = ${value.toDecimal(4)}.`),
      ],
      explanation: L('Digits in the same place value must be added or subtracted together.', 'يجب جمع أو طرح الأرقام التي في الخانة نفسها معًا.'),
    });
  }),

  G('multiply-decimals', 'decimal-operations', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let a: Fraction;
    let b: Fraction;
    let ta: string;
    let tb: string;
    if (d <= 2) {
      const A = dnum(rng, 1, 0);
      const n = rng.int(2, 9);
      a = A.value;
      ta = A.text;
      b = F(n);
      tb = String(n);
    } else {
      const A = dnum(rng, 1, d >= 4 ? 5 : 0);
      const B = dnum(rng, d === 5 ? 2 : 1, 0);
      a = A.value;
      ta = A.text;
      b = B.value;
      tb = B.text;
    }
    const value = a.mul(b);
    return typed({
      prompt: L('Multiply.', 'اضرب.'),
      display: `${ta} \\times ${tb}`,
      value,
      correct: D(value),
      errors: [
        [value.div(F(10)), 'place-value'],
        [value.mul(F(10)), 'place-value'],
      ],
      hints: H(
        L('Ignore the decimal points and multiply as whole numbers.', 'تجاهل الفواصل وضرب كالأعداد الصحيحة.'),
        L('Count the decimal places in both numbers.', 'عدّ الخانات العشرية في العددين.'),
        L('Put that many decimal places in the answer.', 'ضع العدد نفسه من الخانات العشرية في الناتج.'),
      ),
      steps: [
        L('Multiply without the decimal points.', 'نضرب بدون الفواصل.'),
        L('Place the decimal point so the answer has the total number of decimal places.', 'نضع الفاصلة ليكون في الناتج مجموع الخانات العشرية.'),
        L(`${ta} × ${tb} = ${value.toDecimal(5)}.`, `${ta} × ${tb} = ${value.toDecimal(5)}.`),
      ],
      explanation: L('The number of decimal places in the product is the sum of those in the factors.', 'عدد الخانات العشرية في الناتج هو مجموعها في العاملين.'),
    });
  }),

  G('divide-decimals', 'decimal-operations', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    let dividend: Fraction;
    let divisor: Fraction;
    let td: string;
    let tv: string;
    if (d <= 3) {
      const q = dnum(rng, 1, 3);
      const n = rng.int(2, 9);
      divisor = F(n);
      dividend = q.value.mul(divisor);
      td = dividend.toDecimal(5);
      tv = String(n);
    } else {
      const q = F(rng.int(2, 12));
      const v = dnum(rng, 1, 0);
      divisor = v.value;
      dividend = q.mul(divisor);
      td = dividend.toDecimal(5);
      tv = v.text;
    }
    const value = dividend.div(divisor);
    return typed({
      prompt: L('Divide.', 'اقسم.'),
      display: `${td} \\div ${tv}`,
      value,
      correct: D(value),
      errors: [
        [value.div(F(10)), 'place-value'],
        [value.mul(F(10)), 'place-value'],
      ],
      hints: H(
        L('If the divisor is a decimal, multiply both numbers by 10 first.', 'إذا كان المقسوم عليه عددًا عشريًا فاضرب العددين في 10 أولًا.'),
        L('Divide as with whole numbers.', 'اقسم كما في الأعداد الصحيحة.'),
        L('Keep the decimal point in line.', 'احرص على مكان الفاصلة العشرية.'),
      ),
      steps: [
        L(d > 3 ? 'Multiply both numbers by 10 to make the divisor whole.' : 'The divisor is already whole.', d > 3 ? 'نضرب العددين في 10 ليصبح المقسوم عليه صحيحًا.' : 'المقسوم عليه صحيح بالفعل.'),
        L(`${td} ÷ ${tv} = ${value.toDecimal(5)}.`, `${td} ÷ ${tv} = ${value.toDecimal(5)}.`),
      ],
      explanation: L('Multiplying both numbers by the same power of 10 does not change the quotient.', 'ضرب العددين في القوة نفسها للعدد 10 لا يغيّر ناتج القسمة.'),
    });
  }),

  G('shopping-story', 'decimal-operations', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const price = dnum(rng, 2, d <= 2 ? 3 : 9);
    const qty = rng.int(2, 3 + d);
    const value = price.value.mul(F(qty));
    return typed({
      prompt: L(
        `${p.en} buys ${qty} notebooks. Each notebook costs ${price.text} dollars. How many dollars does ${p.en} pay in total?`,
        `اشترى ${p.ar} ${qty} دفاتر. سعر الدفتر الواحد ${price.text} دولار. كم دولارًا دفع في المجموع؟`,
      ),
      value,
      correct: D(value),
      errors: [[value.div(F(10)), 'place-value']],
      hints: H(
        L('Same price many times → multiply.', 'السعر نفسه عدة مرات ← ضرب.'),
        L(`${qty} × ${price.text}`, `${qty} × ${price.text}`),
        L('Keep two decimal places for money.', 'احتفظ بخانتين عشريتين للمبالغ.'),
      ),
      steps: [L(`${qty} × ${price.text} = ${value.toDecimal(4)}.`, `${qty} × ${price.text} = ${value.toDecimal(4)}.`)],
      explanation: L('Total cost = price × quantity.', 'التكلفة الكلية = السعر × الكمية.'),
    });
  }),

  G('estimate', 'decimal-operations', 'mcq', [2, 3, 4], (rng) => {
    const a = rng.int(2, 9) + rng.pick([0.9, 0.1, 0.8, 0.2]);
    const b = rng.int(2, 6) + rng.pick([0.1, 0.9, 0.2]);
    const est = Math.round(a) * Math.round(b);
    return mcqNumEstimate(rng, a, b, est);
  }),

  G('shift-places', 'decimal-operations', 'matching', [1, 2, 3], (rng) => {
    const base = dnum(rng, 1, 9).value.mul(F(10));
    const baseT = base.toDecimal(4);
    const ops: [string, (x: Fraction) => Fraction][] = [
      ['\\times 10', (x) => x.mul(F(10))],
      ['\\times 100', (x) => x.mul(F(100))],
      ['\\div 10', (x) => x.div(F(10))],
      ['\\div 100', (x) => x.div(F(100))],
    ];
    return matchBody(rng, {
      prompt: L(`Match each calculation on ${mt(baseT)} with its result.`, `طابِق كل عملية على ${mt(baseT)} مع ناتجها.`),
      pairs: ops.map(([t, fn]) => ({ left: same(mt(`${baseT} ${t}`)), right: same(fn(base).toDecimal(6)) })),
      hints: H(
        L('Multiplying moves the point to the right.', 'الضرب ينقل الفاصلة إلى اليمين.'),
        L('Dividing moves the point to the left.', 'القسمة تنقل الفاصلة إلى اليسار.'),
        L('×10 / ÷10 move one place; ×100 / ÷100 move two.', '×10 و ÷10 تنقلان خانة واحدة؛ ×100 و ÷100 تنقلان خانتين.'),
      ),
      steps: [L('Move the decimal point right for × and left for ÷, one place per zero.', 'ننقل الفاصلة يمينًا للضرب ويسارًا للقسمة، خانة لكل صفر.')],
      explanation: L('Powers of 10 shift the decimal point.', 'قوى العدد 10 تزيح الفاصلة العشرية.'),
    });
  }),
];

function mcqNumEstimate(rng: Rng, a: number, b: number, est: number) {
  const at = a.toFixed(1);
  const bt = b.toFixed(1);
  const exact = Math.round(a * b * 100) / 100;
  return mcqNum(rng, {
    prompt: L(`Which is the best estimate of ${mt(`${at} \\times ${bt}`)}?`, `ما أفضل تقدير لـ ${mt(`${at} \\times ${bt}`)}؟`),
    correct: est,
    cands: [
      { v: F(est * 10), pid: 'place-value' },
      { v: F(est, 10), pid: 'place-value' },
      { v: F(est + Math.max(2, Math.round(est / 3))), pid: 'not-estimated' },
    ],
    hints: H(
      L('Round each number to the nearest whole number.', 'قرّب كل عدد إلى أقرب عدد صحيح.'),
      L(`${at} ≈ ${Math.round(a)} and ${bt} ≈ ${Math.round(b)}.`, `${at} ≈ ${Math.round(a)} و ${bt} ≈ ${Math.round(b)}.`),
      L(`${Math.round(a)} × ${Math.round(b)}`, `${Math.round(a)} × ${Math.round(b)}`),
    ),
    steps: [
      L(`Round: ${Math.round(a)} × ${Math.round(b)} = ${est}.`, `التقريب: ${Math.round(a)} × ${Math.round(b)} = ${est}.`),
      L(`(The exact product is ${exact}, which is close.)`, `(الناتج الدقيق ${exact} وهو قريب.)`),
    ],
    explanation: L('Estimating helps you spot answers with the decimal point in the wrong place.', 'التقدير يساعدك على اكتشاف الإجابات التي وُضعت فاصلتها في مكان خاطئ.'),
  });
}

// ───────────────────────── Fractions ↔ decimals ─────────────────────────

const POOL_TERMINATING: [number, number][] = [
  [1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10],
  [1, 8], [3, 8], [5, 8], [7, 8], [1, 20], [3, 20], [7, 20], [1, 25], [3, 25], [9, 25], [1, 16],
];

const fracDec: Generator[] = [
  G('frac-to-dec', 'fraction-decimal', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const pool = POOL_TERMINATING.filter(([, den]) => (d === 1 ? den <= 5 || den === 10 : d === 2 ? den <= 10 : d === 3 ? den <= 20 : true));
    const [n, den] = rng.pick(pool);
    const value = F(n, den);
    return typed({
      prompt: L('Write as a decimal.', 'اكتب على صورة عدد عشري.'),
      display: fl(n, den),
      value,
      correct: D(value),
      hints: H(
        L('A fraction is a division: top ÷ bottom.', 'الكسر عملية قسمة: البسط ÷ المقام.'),
        L('Or make the denominator 10, 100 or 1000.', 'أو اجعل المقام 10 أو 100 أو 1000.'),
        L(`${n} ÷ ${den} = ?`, `${n} ÷ ${den} = ؟`),
      ),
      steps: [L(`${n} ÷ ${den} = ${value.toDecimal(5)}.`, `${n} ÷ ${den} = ${value.toDecimal(5)}.`)],
      explanation: L('Every fraction can be written as a division.', 'يمكن كتابة كل كسر على صورة قسمة.'),
    });
  }),

  G('dec-to-frac', 'fraction-decimal', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const places = d <= 2 ? 1 : d <= 4 ? 2 : 3;
    const x = dnum(rng, places, d >= 3 ? 2 : 0);
    const value = x.value;
    return typed({
      prompt: L('Write as a fraction in simplest form.', 'اكتب على صورة كسر في أبسط صورة.'),
      display: x.text,
      value,
      correct: same(tx(value)),
      extra: { lowest: true },
      hints: H(
        L('Read the decimal aloud: tenths, hundredths…', 'اقرأ العدد العشري: أعشار، أجزاء من مئة…'),
        L(`Write it over ${10 ** places}.`, `اكتبه فوق ${10 ** places}.`),
        L('Then simplify.', 'ثم بسّط.'),
      ),
      steps: [
        L(`${x.text} = ${x.whole * 10 ** places + x.frac}/${10 ** places}.`, `${x.text} = ${x.whole * 10 ** places + x.frac}/${10 ** places}.`),
        L(`Simplified: ${value.toString()}.`, `بعد التبسيط: ${value.toString()}.`),
      ],
      explanation: L('A decimal with n places is a fraction over 10ⁿ.', 'العدد العشري ذو n خانة هو كسر مقامه 10ⁿ.'),
    });
  }),

  G('same-value', 'fraction-decimal', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const pool = POOL_TERMINATING.filter(([, den]) => (d <= 2 ? den <= 10 : true));
    const [n, den] = rng.pick(pool);
    const f = F(n, den);
    const asPercent = rng.chance(0.5);
    const show = asPercent ? (v: Fraction) => `${v.mul(F(100)).toDecimal(2)}%` : (v: Fraction) => v.toDecimal(4);
    return mcqNum(rng, {
      prompt: asPercent
        ? L(`Which percentage equals ${mt(fl(n, den))}?`, `أي نسبة مئوية تساوي ${mt(fl(n, den))}؟`)
        : L(`Which decimal equals ${mt(fl(n, den))}?`, `أي عدد عشري يساوي ${mt(fl(n, den))}؟`),
      correct: f,
      cands: [
        { v: f.div(F(10)), pid: 'percent-decimal' },
        { v: f.mul(F(10)), pid: 'percent-decimal' },
        { v: F(1).sub(f), pid: 'wrong-operation' },
      ],
      show,
      fill: () => F(rng.int(1, 99), 100),
      hints: H(
        L('Convert the fraction to a decimal first.', 'حوّل الكسر إلى عدد عشري أولًا.'),
        L(asPercent ? 'Percent = decimal × 100.' : `${n} ÷ ${den}`, asPercent ? 'النسبة المئوية = العدد العشري × 100.' : `${n} ÷ ${den}`),
        L(`${f.toDecimal(4)}${asPercent ? ' = ' + f.mul(F(100)).toDecimal(2) + '%' : ''}`, `${f.toDecimal(4)}${asPercent ? ' = ' + f.mul(F(100)).toDecimal(2) + '%' : ''}`),
      ),
      steps: [L(`${n}/${den} = ${f.toDecimal(4)}${asPercent ? ` = ${f.mul(F(100)).toDecimal(2)}%` : ''}.`, `${n}/${den} = ${f.toDecimal(4)}${asPercent ? ` = ${f.mul(F(100)).toDecimal(2)}%` : ''}.`)],
      explanation: L('½, 0.5 and 50% are three names for the same number.', '½ و 0.5 و 50% ثلاثة أسماء لعدد واحد.'),
    });
  }),

  G('match-forms', 'fraction-decimal', 'matching', [1, 2, 3, 4, 5], (rng, d) => {
    const pool = POOL_TERMINATING.filter(([, den]) => (d <= 2 ? den <= 10 : true));
    const picks: Fraction[] = [];
    let guard = 0;
    while (picks.length < 4 && guard++ < 100) {
      const [n, den] = rng.pick(pool);
      const f = F(n, den);
      if (!picks.some((p) => p.eq(f))) picks.push(f);
    }
    return matchBody(rng, {
      prompt: L('Match each fraction with the equal decimal.', 'طابِق كل كسر مع العدد العشري المساوي له.'),
      pairs: picks.map((f) => ({ left: same(tx(f)), right: same(f.toDecimal(4)) })),
      hints: H(
        L('Divide the top by the bottom.', 'اقسم البسط على المقام.'),
        L('Start with the easiest fraction.', 'ابدأ بأسهل كسر.'),
        L('Cross off pairs you have matched.', 'اشطب الأزواج التي طابقتها.'),
      ),
      steps: [L('Convert every fraction to a decimal and match equal values.', 'حوّل كل كسر إلى عدد عشري وطابِق القيم المتساوية.')],
      explanation: L('Fractions and decimals are two ways to write the same value.', 'الكسور والأعداد العشرية طريقتان لكتابة القيمة نفسها.'),
    });
  }),

  G('repeating', 'fraction-decimal', 'mcq', [3, 4, 5], (rng) => {
    const rep = rng.pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [2, 9], [1, 7], [3, 7]]);
    const term = rng.sample(POOL_TERMINATING.filter(([, den]) => den <= 20), 3);
    return mcqText(rng, {
      prompt: L('Which fraction has a decimal that never ends (it repeats)?', 'أي كسر له عدد عشري لا ينتهي (يتكرر)؟'),
      correct: same(mf(rep[0] as number, rep[1] as number)),
      wrongs: term.map(([n, den]) => ({ label: same(mf(n, den)) })),
      hints: H(
        L('A fraction in lowest terms ends if its denominator only has factors 2 and 5.', 'ينتهي الكسر في أبسط صورة إذا كان مقامه لا يحوي إلا العاملين 2 و 5.'),
        L('Look for denominators like 3, 6, 7 or 9.', 'ابحث عن مقامات مثل 3 أو 6 أو 7 أو 9.'),
        L(`${rep[1]} has a factor other than 2 or 5.`, `المقام ${rep[1]} فيه عامل غير 2 و 5.`),
      ),
      steps: [L(`The denominator ${rep[1]} is not made only of 2s and 5s, so the decimal repeats.`, `المقام ${rep[1]} ليس مكوّنًا من 2 و 5 فقط، لذا يتكرر العدد العشري.`)],
      explanation: L('Only denominators built from 2 and 5 give finite decimals.', 'لا تعطي أعدادًا عشرية منتهية إلا المقامات المكوّنة من 2 و 5.'),
    });
  }),

  G('mixed-order', 'fraction-decimal', 'ordering', [3, 4, 5], (rng, d) => {
    const count = d === 3 ? 3 : 4;
    const vals: Fraction[] = [];
    let guard = 0;
    while (vals.length < count && guard++ < 100) {
      const f = F(rng.int(1, 19), 20);
      if (!vals.some((v) => v.eq(f))) vals.push(f);
    }
    const entries = vals.map((v) => {
      const form = rng.pick(['frac', 'dec', 'pct']);
      const label = form === 'frac' ? tx(v) : form === 'dec' ? v.toDecimal(4) : `${v.mul(F(100)).toDecimal(2)}%`;
      return { value: v, label: same(label) };
    });
    return orderBody(rng, {
      prompt: L('Order from smallest to largest.', 'رتّب من الأصغر إلى الأكبر.'),
      entries,
      hints: H(
        L('Convert everything to decimals.', 'حوّل كل شيء إلى أعداد عشرية.'),
        L('Percent ÷ 100 = decimal.', 'النسبة المئوية ÷ 100 = العدد العشري.'),
        L('Then order the decimals.', 'ثم رتّب الأعداد العشرية.'),
      ),
      steps: [L('Write each as a decimal, then sort.', 'اكتب كل عدد على صورة عشرية ثم رتّب.')],
      explanation: L('Fractions, decimals and percents are directly comparable once in the same form.', 'يمكن مقارنة الكسور والأعداد العشرية والنسب مباشرةً متى كانت بالصورة نفسها.'),
    });
  }),
];

export const L2_GENERATORS: Generator[] = [
  ...fractionBasics,
  ...equivalent,
  ...simplifying,
  ...comparing,
  ...addSub,
  ...mulDiv,
  ...mixed,
  ...decimals,
  ...decOps,
  ...fracDec,
];
