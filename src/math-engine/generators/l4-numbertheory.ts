import type { Generator, Rng } from '@/types';
import { gcd, lcm } from '../fraction';
import { G, listBody, matchBody, mcqText, tfBody, typed } from '../build';
import { H, L, differ, linear, par, same } from '../kit';

const mt = (s: string) => `$${s}$`;
const S = (s: string) => same(s);

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const factorsOf = (n: number): number[] => {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
};
const primeFactors = (n: number): number[] => {
  const out: number[] = [];
  let x = n;
  for (let p = 2; p * p <= x; p++) while (x % p === 0) { out.push(p); x /= p; }
  if (x > 1) out.push(x);
  return out;
};
const randomPrime = (rng: Rng, lo: number, hi: number): number => {
  for (let i = 0; i < 200; i++) {
    const n = rng.int(lo, hi);
    if (isPrime(n)) return n;
  }
  throw new RangeError('no prime');
};
const randomComposite = (rng: Rng, lo: number, hi: number): number => {
  for (let i = 0; i < 200; i++) {
    const n = rng.int(lo, hi);
    if (n > 3 && !isPrime(n)) return n;
  }
  throw new RangeError('no composite');
};
const fmtList = (xs: number[]): string => xs.join(', ');

// ───────────────────────── Factors and multiples ─────────────────────────

const factorsMultiples: Generator[] = [
  G('list-factors', 'factors-multiples', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const n = rng.pick([[6, 8, 10, 12, 15, 16, 18, 20], [24, 28, 30, 32, 36, 40], [42, 48, 54, 60, 72], [84, 90, 96, 100, 120]][d - 1] as number[]);
    const fs = factorsOf(n);
    return listBody({
      prompt: L('List all the factors of this number, separated by commas.', 'اكتب جميع عوامل هذا العدد مفصولة بفواصل.'),
      display: String(n),
      values: fs,
      errors: [{ answer: fs.filter((f) => f !== n).join(', '), patternId: 'factor-multiple' }],
      hints: H(
        L('A factor divides the number exactly, with no remainder.', 'العامل يقسم العدد تمامًا بلا باقٍ.'),
        L('Test 1, 2, 3, … in order. Each one that works gives a pair.', 'جرّب 1 ثم 2 ثم 3 … بالترتيب. كل عدد ينجح يعطي زوجًا.'),
        L('Do not forget 1 and the number itself.', 'لا تنسَ العدد 1 والعدد نفسه.'),
      ),
      steps: fs.filter((f) => f * f <= n).map((f) => S(`${f} × ${n / f} = ${n}`)).concat([S(fmtList(fs))]),
      explanation: L('Factors come in pairs that multiply to the number.', 'العوامل تأتي في أزواج حاصل ضربها هو العدد.'),
    });
  }),

  G('gcf-lcm', 'factors-multiples', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const g = rng.int(2, [0, 6, 9, 12, 15][d - 1] as number);
    const p = rng.int(2, [0, 5, 7, 9, 12][d - 1] as number);
    let q = rng.int(2, [0, 5, 7, 9, 12][d - 1] as number);
    while (gcd(p, q) !== 1) q = rng.int(2, 12);
    const a = g * p;
    const b = g * q;
    const wantGcf = rng.chance(0.5);
    const val = wantGcf ? g : lcm(a, b);
    return typed({
      prompt: wantGcf ? L('Find the greatest common factor (GCF).', 'أوجد العامل المشترك الأكبر.') : L('Find the least common multiple (LCM).', 'أوجد المضاعف المشترك الأصغر.'),
      display: `${a},\\ ${b}`,
      value: val,
      extra: { integerOnly: true },
      errors: wantGcf ? [[lcm(a, b), 'factor-multiple'], [1, 'factor-multiple']] : [[g, 'factor-multiple'], [a * b, 'factor-multiple']],
      hints: H(
        L(wantGcf ? 'Look for the biggest number that divides both.' : 'Look for the smallest number that both divide into.', wantGcf ? 'ابحث عن أكبر عدد يقسم العددين.' : 'ابحث عن أصغر عدد يقبل القسمة على العددين.'),
        L(wantGcf ? `List the factors of ${a} and of ${b}.` : `List multiples of ${b} until one is also a multiple of ${a}.`, wantGcf ? `اكتب عوامل ${a} وعوامل ${b}.` : `اكتب مضاعفات ${b} حتى تجد أحدها مضاعفًا لـ ${a} أيضًا.`),
        L(wantGcf ? 'Pick the largest one they share.' : 'The first match is the LCM.', wantGcf ? 'اختر أكبر عامل مشترك.' : 'أول مضاعف مشترك هو الناتج.'),
      ),
      steps: wantGcf ? [S(`${a} = ${g} × ${p}`), S(`${b} = ${g} × ${q}`), S(`GCF = ${g}`)] : [S(`${a} = ${g} × ${p}, ${b} = ${g} × ${q}`), S(`LCM = ${g} × ${p} × ${q} = ${val}`)],
      explanation: wantGcf ? L('The GCF is the biggest number that goes into both.', 'العامل المشترك الأكبر هو أكبر عدد يقسم العددين.') : L('The LCM is the smallest number that both go into.', 'المضاعف المشترك الأصغر هو أصغر عدد يقبل القسمة على العددين.'),
    });
  }),

  G('multiples', 'factors-multiples', 'mcq', [1, 2, 3], (rng, d) => {
    const k = rng.int(2, [9, 12, 15][d - 1] as number);
    const wantMultiple = rng.chance(0.5);
    if (wantMultiple) {
      const pool = new Set<number>();
      while (pool.size < 3) pool.add(k * rng.int(2, 12) + rng.pick([1, -1, 2]) * (k > 2 ? 1 : 0) || k + 1);
      const good = k * rng.int(3, 15);
      const wrongs = [...pool].filter((x) => x % k !== 0 && x > 0 && x !== good);
      while (wrongs.length < 3) wrongs.push(good + wrongs.length + 1 + (good % k === 0 ? 0 : 0));
      return mcqText(rng, {
        prompt: L(`Which number is a multiple of ${k}?`, `أي عدد هو من مضاعفات ${k}؟`),
        correct: S(String(good)),
        wrongs: wrongs.filter((x) => x % k !== 0).slice(0, 3).map((x) => ({ label: S(String(x)), pid: 'factor-multiple' })),
        hints: H(L('Multiples of k are k × 1, k × 2, k × 3, …', 'مضاعفات العدد هي العدد × 1، × 2، × 3 …'), L(`Which option divides by ${k} with no remainder?`, `أي خيار يقبل القسمة على ${k} بلا باقٍ؟`), L(`Check ${good} ÷ ${k}.`, `افحص ${good} ÷ ${k}.`)),
        steps: [S(`${good} ÷ ${k} = ${good / k}`), L('No remainder, so it is a multiple.', 'بلا باقٍ، إذن هو مضاعف.')],
        explanation: L('A multiple of a number can be divided by it exactly.', 'مضاعف العدد يقبل القسمة عليه تمامًا.'),
      });
    }
    const n = k * rng.int(2, 8);
    const fs = factorsOf(n);
    const nonFs: number[] = [];
    for (let x = 2; x < n + 5 && nonFs.length < 6; x++) if (n % x !== 0) nonFs.push(x);
    const good = rng.pick(fs.filter((f) => f > 1 && f < n).length ? fs.filter((f) => f > 1 && f < n) : [n]);
    return mcqText(rng, {
      prompt: L(`Which number is a factor of ${n}?`, `أي عدد هو من عوامل ${n}؟`),
      correct: S(String(good)),
      wrongs: rng.sample(nonFs, 3).map((x) => ({ label: S(String(x)), pid: 'factor-multiple' })),
      hints: H(L('A factor divides the number with no remainder.', 'العامل يقسم العدد بلا باقٍ.'), L(`Try dividing ${n} by each option.`, `جرّب قسمة ${n} على كل خيار.`), L(`${n} ÷ ${good} = ${n / good}.`, `${n} ÷ ${good} = ${n / good}.`)),
      steps: [S(`${n} ÷ ${good} = ${n / good}`), L('No remainder, so it is a factor.', 'بلا باقٍ، إذن هو عامل.')],
      explanation: L('Factors divide in; multiples come out.', 'العوامل تقسم العدد، والمضاعفات تنتج منه.'),
    });
  }),

  G('divisibility', 'factors-multiples', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const rules: { k: number; rule: L10nPair }[] = [
      { k: 2, rule: [`ends in 0, 2, 4, 6 or 8`, `ينتهي بـ 0 أو 2 أو 4 أو 6 أو 8`] },
      { k: 5, rule: [`ends in 0 or 5`, `ينتهي بـ 0 أو 5`] },
      { k: 3, rule: [`has a digit sum divisible by 3`, `مجموع أرقامه يقبل القسمة على 3`] },
      { k: 9, rule: [`has a digit sum divisible by 9`, `مجموع أرقامه يقبل القسمة على 9`] },
      { k: 10, rule: [`ends in 0`, `ينتهي بـ 0`] },
      { k: 4, rule: [`has its last two digits divisible by 4`, `آخر رقمين منه يقبلان القسمة على 4`] },
    ];
    const r = rules[rng.int(0, d === 1 ? 1 : d === 2 ? 2 : d === 3 ? 4 : 5)] as { k: number; rule: L10nPair };
    const n = rng.int(d * 20 + 10, d * 200 + 100);
    const truth = n % r.k === 0;
    const claim = rng.chance(0.5);
    return tfBody({
      prompt: L(`Is this statement true or false?`, 'هل العبارة صحيحة أم خاطئة؟'),
      display: `\\text{${n} is divisible by ${r.k}}`,
      truth: claim ? truth : !truth,
      pid: 'factor-multiple',
      hints: H(L(`A number is divisible by ${r.k} if it ${r.rule[0]}.`, `يقبل العدد القسمة على ${r.k} إذا كان ${r.rule[1]}.`), L(`Check ${n} against that rule.`, `افحص ${n} وفق هذه القاعدة.`), L(`Or just divide: ${n} ÷ ${r.k}.`, `أو اقسم مباشرة: ${n} ÷ ${r.k}.`)),
      steps: [S(`${n} ÷ ${r.k} = ${(n / r.k).toFixed(2).replace(/\.00$/, '')}`), truth ? L('It divides exactly.', 'يقبل القسمة تمامًا.') : L('It does not divide exactly.', 'لا يقبل القسمة تمامًا.')],
      explanation: L(`Divisibility rule: a number is divisible by ${r.k} if it ${r.rule[0]}.`, `قاعدة القابلية للقسمة: يقبل العدد القسمة على ${r.k} إذا كان ${r.rule[1]}.`),
    });
  }),

  G('word-gcd', 'factors-multiples', 'word-problem', [3, 4, 5], (rng, d) => {
    const g = rng.int(3, 8 + d);
    const p = rng.int(2, 6);
    let q = rng.int(2, 7);
    while (gcd(p, q) !== 1) q = rng.int(2, 7);
    const useGcf = rng.chance(0.5);
    if (useGcf) {
      const a = g * p;
      const b = g * q;
      return typed({
        prompt: L(`A teacher has ${a} pens and ${b} notebooks. She wants identical packs with nothing left over. What is the largest number of packs she can make?`, `لدى معلمة ${a} قلمًا و${b} دفترًا. تريد تكوين حقائب متطابقة دون أن يتبقى شيء. ما أكبر عدد من الحقائب يمكنها تكوينه؟`),
        value: g,
        extra: { integerOnly: true },
        errors: [[lcm(a, b), 'factor-multiple']],
        hints: H(L('The number of packs must divide both amounts.', 'عدد الحقائب يجب أن يقسم الكميتين.'), L('You want the biggest such number.', 'تريد أكبر عدد كهذا.'), L(`Find the GCF of ${a} and ${b}.`, `أوجد العامل المشترك الأكبر لـ ${a} و${b}.`)),
        steps: [S(`GCF(${a}, ${b}) = ${g}`)],
        explanation: L('"Largest equal groups" means the greatest common factor.', '«أكبر مجموعات متساوية» تعني العامل المشترك الأكبر.'),
      });
    }
    const a = rng.int(3, 9);
    const b = differ(rng, 3, 9, a);
    const l = lcm(a, b);
    return typed({
      prompt: L(`One bus comes every ${a} minutes and another every ${b} minutes. They leave together now. After how many minutes will they leave together again?`, `تغادر حافلة كل ${a} دقائق وأخرى كل ${b} دقائق. غادرتا معًا الآن. بعد كم دقيقة تغادران معًا مرة أخرى؟`),
      value: l,
      suffix: 'min',
      extra: { integerOnly: true },
      errors: [[gcd(a, b), 'factor-multiple'], [a * b, 'factor-multiple']].filter(([x]) => x !== l) as [number, string][],
      hints: H(L('Look for a time that is a multiple of both numbers.', 'ابحث عن زمن هو مضاعف للعددين.'), L('You want the first (smallest) one after now.', 'تريد أول (أصغر) مضاعف بعد الآن.'), L(`Find the LCM of ${a} and ${b}.`, `أوجد المضاعف المشترك الأصغر لـ ${a} و${b}.`)),
      steps: [S(`LCM(${a}, ${b}) = ${l}`)],
      explanation: L('"Happens together again" means the least common multiple.', '«يحدث معًا مرة أخرى» تعني المضاعف المشترك الأصغر.'),
    });
  }),
];
type L10nPair = [string, string];

// ───────────────────────── Primes ─────────────────────────

const primes: Generator[] = [
  G('is-prime', 'primes', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const hi = [20, 50, 100, 200][d - 1] as number;
    const prime = randomPrime(rng, 2, hi);
    const comps = new Set<number>();
    while (comps.size < 3) comps.add(randomComposite(rng, 4, hi));
    const tricky = d >= 3 ? [49, 51, 57, 87, 91, 119, 133].filter((x) => x <= hi) : [];
    const wrongs = [...comps];
    if (tricky.length) wrongs[0] = rng.pick(tricky);
    return mcqText(rng, {
      prompt: L('Which of these numbers is prime?', 'أي من هذه الأعداد أولي؟'),
      correct: S(String(prime)),
      wrongs: wrongs.map((x) => ({ label: S(String(x)), pid: 'prime-misconception' })),
      hints: H(L('A prime has exactly two factors: 1 and itself.', 'العدد الأولي له عاملان فقط: 1 ونفسه.'), L('Look for a small number that divides each option.', 'ابحث عن عدد صغير يقسم كل خيار.'), L('Try 2, 3, 5 and 7.', 'جرّب 2 و3 و5 و7.')),
      steps: wrongs.map((x) => { const f = factorsOf(x).find((y) => y > 1) as number; return S(`${x} = ${f} × ${x / f}`); }).concat([S(`${prime} has no factors except 1 and ${prime}`)]),
      explanation: L('The other numbers can be divided by something besides 1 and themselves.', 'الأعداد الأخرى تقبل القسمة على عدد غير 1 ونفسها.'),
    });
  }),

  G('prime-check-tf', 'primes', 'true-false', [1, 2, 3, 4, 5], (rng, d) => {
    const hi = [15, 30, 60, 120, 200][d - 1] as number;
    const truth = rng.chance(0.5);
    const odd = d >= 2 && rng.chance(0.3);
    let n: number;
    let claimPrime = rng.chance(0.5);
    if (odd) {
      n = rng.pick([1, 2, 9, 15, 21, 25, 27, 33, 35].filter((x) => x <= hi + 10));
      claimPrime = rng.chance(0.5);
    } else {
      n = rng.int(2, hi);
    }
    const actual = isPrime(n);
    // Statement: "n is prime" / "n is not prime"
    const statementTruth = claimPrime ? actual : !actual;
    void truth;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `\\text{${n} is ${claimPrime ? '' : 'not '}prime}`,
      truth: statementTruth,
      pid: 'prime-misconception',
      hints: H(L('Prime numbers have exactly two factors.', 'الأعداد الأولية لها عاملان فقط.'), L('Remember: 1 is not prime, and 2 is the only even prime.', 'تذكّر: 1 ليس أوليًا، و2 هو العدد الزوجي الأولي الوحيد.'), L(`List the factors of ${n}.`, `اكتب عوامل ${n}.`)),
      steps: [S(`${n}: ${fmtList(factorsOf(n))}`), actual ? L(`${n} is prime.`, `${n} أولي.`) : L(`${n} is not prime.`, `${n} ليس أوليًا.`)],
      explanation: L('To test a number, look for any divisor other than 1 and itself.', 'لاختبار عدد ابحث عن أي قاسم غير 1 ونفسه.'),
    });
  }),

  G('prime-factorization', 'primes', 'type-answer', [2, 3, 4, 5], (rng, d) => {
    const count = d === 2 ? 2 : d === 3 ? 3 : d === 4 ? 4 : 5;
    const pool = d <= 3 ? [2, 3, 5, 7] : [2, 3, 5, 7, 11];
    const fs = Array.from({ length: count }, () => rng.pick(pool)).sort((a, b) => a - b);
    const n = fs.reduce((a, b) => a * b, 1);
    if (n > 3000) throw new RangeError('too large');
    const pf = primeFactors(n);
    const notation = pf.join(' \\times ');
    return listBody({
      prompt: L('Write the prime factors of this number in order, separated by commas (repeat a factor if it appears more than once).', 'اكتب العوامل الأولية لهذا العدد بالترتيب مفصولة بفواصل (كرّر العامل إن ظهر أكثر من مرة).'),
      display: String(n),
      values: pf,
      ordered: true,
      correct: S(pf.join(' × ')),
      errors: [{ answer: [...new Set(pf)].join(', '), patternId: 'prime-misconception' }],
      hints: H(L('Divide by the smallest prime that works, over and over.', 'اقسم على أصغر عدد أولي ممكن مرارًا.'), L('Keep going until the result is 1.', 'استمر حتى يصبح الناتج 1.'), L('Write every prime you divided by.', 'اكتب كل عدد أولي قسمت عليه.')),
      steps: (() => { const out = []; let x = n; for (const p of pf) { out.push(S(`${x} ÷ ${p} = ${x / p}`)); x /= p; } out.push(S(`${n} = ${notation.replace(/\\times/g, '×')}`)); return out; })(),
      explanation: L('Every whole number above 1 is a product of primes in exactly one way.', 'كل عدد صحيح أكبر من 1 هو حاصل ضرب أعداد أولية بطريقة واحدة فقط.'),
    });
  }),

  G('count-primes', 'primes', 'type-answer', [1, 2, 3, 4], (rng, d) => {
    const lo = rng.int(1, [10, 20, 30, 60][d - 1] as number);
    const hi = lo + rng.int(8, [12, 20, 30, 40][d - 1] as number);
    const ps = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(isPrime);
    return typed({
      prompt: L(`How many prime numbers are there from ${lo} to ${hi} (including both ends)?`, `كم عددًا أوليًا يوجد من ${lo} إلى ${hi} (بما فيها الطرفان)؟`),
      value: ps.length,
      extra: { integerOnly: true },
      errors: [[ps.length + 1, 'prime-misconception'], [ps.length - 1, 'prime-misconception']].filter(([x]) => (x as number) >= 0) as [number, string][],
      hints: H(L('Test each number in the range.', 'اختبر كل عدد في المدى.'), L('Skip even numbers except 2, and multiples of 3 or 5.', 'تجاوز الأعداد الزوجية ما عدا 2 ومضاعفات 3 و5.'), L('Count the ones that survive.', 'عُدّ الأعداد التي تبقّت.')),
      steps: [S(ps.length ? ps.join(', ') : '—'), S(`${ps.length}`)],
      explanation: L('Prime numbers become rarer as numbers get bigger.', 'تقلّ الأعداد الأولية كلما كبرت الأعداد.'),
    });
  }),

  G('match-type', 'primes', 'matching', [1, 2, 3], (rng, d) => {
    const pickFrom = (arr: number[]) => arr[rng.int(0, arr.length - 1)] as number;
    const primeList = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29].slice(0, d * 3 + 3);
    const compositeList = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 25, 27, 35].slice(0, d * 4 + 5);
    const a = pickFrom(primeList);
    const b = pickFrom(compositeList);
    const c = pickFrom(compositeList.filter((x) => x !== b));
    const pairs = [
      { left: S(String(a)), right: L('prime', 'أولي') },
      { left: S(String(b)), right: L('has 3 or more factors', 'له 3 عوامل أو أكثر') },
      { left: S('1'), right: L('neither prime nor composite', 'لا أولي ولا مركب') },
    ];
    void c;
    return matchBody(rng, {
      prompt: L('Match each number to its description.', 'صِل كل عدد بوصفه.'),
      pairs,
      hints: H(L('Prime numbers have exactly two factors.', 'العدد الأولي له عاملان بالضبط.'), L('1 has only one factor.', 'العدد 1 له عامل واحد فقط.'), L(`List the factors of ${b}.`, `اكتب عوامل ${b}.`)),
      steps: [S(`${a}: 1, ${a}`), S(`${b}: ${fmtList(factorsOf(b))}`), S('1: 1')],
      explanation: L('Primes have two factors, composites have more, and 1 has only one.', 'للأولي عاملان، وللمركّب أكثر، أما العدد 1 فله عامل واحد.'),
    });
  }),
];

// ───────────────────────── Expressions ─────────────────────────

const expressions: Generator[] = [
  G('substitute', 'expressions', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const x = d <= 2 ? rng.int(2, 9) : rng.int(-6, 9);
    if (x === 0) throw new RangeError('skip zero');
    const a = rng.int(2, 9);
    const b = rng.int(1, 12);
    let tex: string;
    let val: number;
    let wrong: number;
    let stepText: string;
    if (d === 1) {
      tex = `${a}x + ${b}`;
      val = a * x + b;
      wrong = Number(`${a}${x}`) + b;
      stepText = `${a} × ${x} + ${b}`;
    } else if (d === 2) {
      tex = `${a}x - ${b}`;
      val = a * x - b;
      wrong = Number(`${a}${x}`) - b;
      stepText = `${a} × ${x} − ${b}`;
    } else if (d === 3) {
      tex = `${a}x^{2} + ${b}`;
      val = a * x * x + b;
      wrong = (a * x) ** 2 + b;
      stepText = `${a} × ${par(x)}² + ${b}`;
    } else if (d === 4) {
      const c = rng.int(1, 6);
      tex = `${a}x - ${c}x^{2}`;
      val = a * x - c * x * x;
      wrong = a * x - (c * x) ** 2;
      stepText = `${a} × ${par(x)} − ${c} × ${par(x)}²`;
    } else {
      const y = nz2(rng);
      tex = `${a}x^{2} - ${b}xy + ${y}`;
      val = a * x * x - b * x * y + y;
      wrong = a * x * x + b * x * y + y;
      stepText = `${a} × ${par(x)}² − ${b} × ${par(x)} × ${par(y)} + ${y}`;
      return typed({
        prompt: L(`Evaluate when x = ${x} and y = ${y}.`, `احسب القيمة عندما x = ${x} و y = ${y}.`),
        display: tex,
        value: val,
        errors: wrong === val ? undefined : [[wrong, 'substitution-slip']],
        hints: H(L('Replace each letter with its number, using brackets for negatives.', 'عوّض عن كل حرف بعدده واستخدم الأقواس للأعداد السالبة.'), L('Powers come before multiplication.', 'القوى قبل الضرب.'), L('Then add and subtract from left to right.', 'ثم اجمع واطرح من اليسار إلى اليمين.')),
        steps: [S(stepText), S(`= ${val}`)],
        explanation: L('Substitute with brackets, then follow the order of operations.', 'عوّض بين أقواس ثم اتبع ترتيب العمليات.'),
      });
    }
    return typed({
      prompt: L(`Evaluate when x = ${x}.`, `احسب القيمة عندما x = ${x}.`),
      display: tex,
      value: val,
      errors: wrong === val ? undefined : [[wrong, 'substitution-slip']],
      hints: H(L('Replace x with its value. Write the multiplication sign.', 'عوّض عن x بقيمتها واكتب علامة الضرب.'), L(d === 3 ? 'Square x first, then multiply.' : 'Multiply, then add or subtract.', d === 3 ? 'ربّع x أولًا ثم اضرب.' : 'اضرب ثم اجمع أو اطرح.'), L('Use brackets around negative values.', 'ضع الأعداد السالبة بين أقواس.')),
      steps: [S(stepText), S(`= ${val}`)],
      explanation: L('"3x" means 3 times x, not the digits 3 and x written side by side.', '«3x» تعني 3 × x وليست الرقمين 3 و x جنبًا إلى جنب.'),
    });
  }),

  G('translate-words', 'expressions', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const n = rng.int(2, 9);
    const k = rng.int(2, 9);
    type W = { en: string; ar: string; right: string; wrongs: string[] };
    const items: W[] = [
      { en: `${k} more than a number x`, ar: `${k} أكثر من عدد x`, right: `x + ${k}`, wrongs: [`${k}x`, `x - ${k}`, `${k} - x`] },
      { en: `${k} less than a number x`, ar: `${k} أقل من عدد x`, right: `x - ${k}`, wrongs: [`${k} - x`, `x + ${k}`, `${k}x`] },
      { en: `${n} times a number x`, ar: `${n} أمثال عدد x`, right: `${n}x`, wrongs: [`x + ${n}`, `x^{${n}}`, `\\frac{x}{${n}}`] },
      { en: `a number x divided by ${n}`, ar: `عدد x مقسومًا على ${n}`, right: `\\frac{x}{${n}}`, wrongs: [`${n}x`, `\\frac{${n}}{x}`, `x - ${n}`] },
      { en: `${n} times a number x, plus ${k}`, ar: `${n} أمثال عدد x، زائد ${k}`, right: `${n}x + ${k}`, wrongs: [`${n}(x + ${k})`, `${n} + ${k}x`, `${n}x - ${k}`] },
      { en: `${n} times the sum of x and ${k}`, ar: `${n} أمثال مجموع x و${k}`, right: `${n}(x + ${k})`, wrongs: [`${n}x + ${k}`, `${n} + x + ${k}`, `x + ${n}${k}`] },
      { en: `the square of x, minus ${k}`, ar: `مربع x ناقص ${k}`, right: `x^{2} - ${k}`, wrongs: [`(x - ${k})^{2}`, `2x - ${k}`, `x - ${k}^{2}`] },
    ];
    const pool = items.slice(0, [3, 5, 6, 7][d - 1]);
    const w = rng.pick(d === 1 ? pool : pool.slice(Math.max(0, pool.length - 4)));
    return mcqText(rng, {
      prompt: L(`Which expression means "${w.en}"?`, `أي عبارة تعني «${w.ar}»؟`),
      correct: S(mt(w.right)),
      wrongs: w.wrongs.map((x) => ({ label: S(mt(x)), pid: 'wrong-operation' })),
      hints: H(L('Pick a letter for the unknown number.', 'اختر حرفًا للعدد المجهول.'), L('Translate one phrase at a time, left to right.', 'ترجم عبارة واحدة في كل مرة من اليسار إلى اليمين.'), L('Watch words like "less than": the order flips.', 'انتبه لكلمات مثل «أقل من»: يتبدّل الترتيب.')),
      steps: [L(`"${w.en}" becomes ${w.right.replace(/\\frac\{x\}\{(\d+)\}/, 'x/$1').replace(/\^\{2\}/, '²')}.`, `«${w.ar}» تصبح ${w.right.replace(/\\frac\{x\}\{(\d+)\}/, 'x/$1').replace(/\^\{2\}/, '²')}.`)],
      explanation: L('Algebra is a shorthand for sentences about numbers.', 'الجبر اختصار لجمل تتحدث عن الأعداد.'),
    });
  }),

  G('like-terms', 'expressions', 'mcq', [2, 3, 4], (rng, d) => {
    const a = rng.int(2, 9);
    const b = differ(rng, 2, 9, a);
    const c = rng.int(2, 9);
    const q = d === 2 ? `${a}x` : d === 3 ? `${a}x^{2}` : `${a}xy`;
    const like = d === 2 ? `${b}x` : d === 3 ? `${b}x^{2}` : `${b}yx`;
    const wrongs = d === 2 ? [`${c}y`, `${c}x^{2}`, String(c)] : d === 3 ? [`${c}x`, `${c}y^{2}`, `${c}x^{3}`] : [`${c}x`, `${c}x^{2}y`, `${c}y`];
    return mcqText(rng, {
      prompt: L(`Which term is a like term of ${mt(q)}?`, `أي حد هو حد مشابه لـ ${mt(q)}؟`),
      correct: S(mt(like)),
      wrongs: wrongs.map((x) => ({ label: S(mt(x)), pid: 'combine-unlike' })),
      hints: H(L('Like terms have exactly the same letters with the same powers.', 'الحدود المتشابهة لها الحروف نفسها بالقوى نفسها.'), L('Only the number in front (the coefficient) may differ.', 'يجوز أن يختلف العدد الذي في الأمام (المعامل) فقط.'), L('Compare the letter part of each option.', 'قارن جزء الحروف في كل خيار.')),
      steps: [L('Compare the letter part: it must match exactly.', 'قارن جزء الحروف: يجب أن يتطابق تمامًا.')],
      explanation: L('You can only add or subtract terms that have the same letter part.', 'لا يمكنك جمع أو طرح إلا الحدود التي لها جزء الحروف نفسه.'),
    });
  }),

  G('perimeter-expression', 'expressions', 'word-problem', [2, 3, 4], (rng, d) => {
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const x = rng.int(2, 8);
    const tex = linear(a, 'x', b);
    const val = 2 * (a * x + b) + 2 * x;
    return typed({
      prompt: L(`A rectangle has length ${mt(tex)} cm and width ${mt('x')} cm. Find its perimeter when x = ${x}.`, `مستطيل طوله ${mt(tex)} سم وعرضه ${mt('x')} سم. أوجد محيطه عندما x = ${x}.`),
      value: val,
      suffix: 'cm',
      extra: { integerOnly: true },
      errors: [[(a * x + b) * x, 'area-perimeter'], [a * x + b + x, 'area-perimeter']],
      hints: H(L('Perimeter = 2 × (length + width).', 'المحيط = 2 × (الطول + العرض).'), L(`First find the length: ${a}(${x}) + ${b}.`, `أوجد الطول أولًا: ${a}(${x}) + ${b}.`), L('Then add length and width and double it.', 'ثم اجمع الطول والعرض وضاعف الناتج.')),
      steps: [S(`length = ${a} × ${x} + ${b} = ${a * x + b}`), S(`perimeter = 2 × (${a * x + b} + ${x}) = ${val}`)],
      explanation: L('Substitute first, then use the formula.', 'عوّض أولًا ثم استخدم القانون.'),
    });
    void d;
  }),
];

function nz2(rng: Rng): number {
  return rng.pick([-4, -3, -2, 2, 3, 4, 5]);
}

export const L4_NUMBER_THEORY: Generator[] = [...factorsMultiples, ...primes, ...expressions];
