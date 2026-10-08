import type { Generator } from '@/types';
import { Fraction } from '../fraction';
import { G, compareBody, mcqNum, mcqText, orderBody, matchBody, tfBody, typed } from '../build';
import { H, L, cand, person, same } from '../kit';

const F = Fraction.of;
const fmt = (n: number): string => n.toLocaleString('en-US');

/** Random integer with exactly `digits` digits. */
function digitsInt(rng: { int(a: number, b: number): number }, digits: number): number {
  const lo = digits === 1 ? 1 : 10 ** (digits - 1);
  return rng.int(lo, 10 ** digits - 1);
}

const PLACES = [
  { pow: 0, en: 'ones', ar: 'الآحاد' },
  { pow: 1, en: 'tens', ar: 'العشرات' },
  { pow: 2, en: 'hundreds', ar: 'المئات' },
  { pow: 3, en: 'thousands', ar: 'الآلاف' },
  { pow: 4, en: 'ten thousands', ar: 'عشرات الآلاف' },
  { pow: 5, en: 'hundred thousands', ar: 'مئات الآلاف' },
];

// ───────────────────────── Place value ─────────────────────────

const placeValue: Generator[] = [
  G('digit-value', 'place-value', 'mcq', [1, 2, 3, 4, 5], (rng, d) => {
    const intDigits = d <= 3 ? d + 2 : 4;
    const decimals = d === 4 ? 1 : d === 5 ? 2 : 0;
    // Build digits with no zero at the chosen position so the question is meaningful.
    const digits: number[] = [];
    for (let i = 0; i < intDigits + decimals; i++) digits.push(i === 0 ? rng.int(1, 9) : rng.int(0, 9));
    const idx = rng.int(0, digits.length - 1);
    if (digits[idx] === 0) digits[idx] = rng.int(1, 9);
    const text = digits.slice(0, intDigits).join('') + (decimals ? '.' + digits.slice(intDigits).join('') : '');
    const power = intDigits - 1 - idx; // may be negative for decimals
    const digit = digits[idx] as number;
    const value = power >= 0 ? F(digit * 10 ** power) : F(digit, 10 ** -power);
    const up = power + 1 >= 0 ? F(digit * 10 ** (power + 1)) : F(digit, 10 ** -(power + 1));
    const down = power - 1 >= 0 ? F(digit * 10 ** (power - 1)) : F(digit, 10 ** -(power - 1));
    const shown = decimals ? text : fmt(Number(text));
    return mcqNum(rng, {
      prompt: L(`What is the value of the digit ${digit} in this number?`, `ما قيمة الرقم ${digit} في هذا العدد؟`),
      display: `${shown.replace(/,/g, '{,}')}`,
      correct: value,
      cands: [
        { v: F(digit), pid: 'place-value' },
        { v: up, pid: 'place-value' },
        { v: down, pid: 'place-value' },
      ],
      show: (f) => f.toDecimal(4),
      hints: H(
        L('Find which place the digit sits in.', 'حدّد في أي خانة يقع الرقم.'),
        L('Count the places from the right (or from the decimal point).', 'عُدّ الخانات من اليمين (أو من الفاصلة العشرية).'),
        L(`The digit ${digit} is worth ${digit} × its place.`, `قيمة الرقم ${digit} = ${digit} × قيمة خانته.`),
      ),
      steps: [
        L(`Look at the number ${shown}.`, `انظر إلى العدد ${shown}.`),
        L(`The digit ${digit} is in the ${power >= 0 ? PLACES[power]?.en : 'decimal'} place.`, `الرقم ${digit} في خانة ${power >= 0 ? PLACES[power]?.ar : 'الكسور العشرية'}.`),
        L(`Its value is ${value.toDecimal(4)}.`, `إذن قيمته ${value.toDecimal(4)}.`),
      ],
      explanation: L(
        'A digit is worth the digit times its place value. The same digit is worth ten times more one place to the left.',
        'قيمة الرقم = الرقم × قيمة خانته. ويصبح الرقم نفسه أكبر عشر مرات كلما تحرك خانة إلى اليسار.',
      ),
    });
  }),

  G('expanded-form', 'place-value', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const n = digitsInt(rng, d + 2);
    const s = String(n);
    const parts = s.split('').map((ch, i) => Number(ch) * 10 ** (s.length - 1 - i));
    const nonZero = parts.map((v, i) => ({ v, i })).filter((p) => p.v > 0);
    const blank = rng.pick(nonZero);
    const display = parts
      .filter((v) => v > 0)
      .map((v, k) => (v === blank.v ? '\\square' : String(v)) + (k < nonZero.length - 1 ? ' + ' : ''))
      .join('');
    return typed({
      prompt: L('Fill in the missing part of the expanded form.', 'أكمل الجزء الناقص في الصيغة الممتدة.'),
      display: `${fmt(n).replace(/,/g, '{,}')} = ${display}`,
      value: blank.v,
      hints: H(
        L('Each digit is multiplied by its place value.', 'كل رقم يُضرب في قيمة خانته.'),
        L('Find which digit is missing from the sum.', 'ابحث عن الرقم الذي لم يظهر في المجموع.'),
        L(`The missing part comes from the digit in the ${PLACES[s.length - 1 - blank.i]?.en} place.`, `الجزء الناقص من خانة ${PLACES[s.length - 1 - blank.i]?.ar}.`),
      ),
      steps: [
        L(`Split ${fmt(n)} digit by digit.`, `فكّك العدد ${fmt(n)} رقمًا رقمًا.`),
        L(`The parts are ${nonZero.map((p) => p.v).join(' + ')}.`, `الأجزاء هي ${nonZero.map((p) => p.v).join(' + ')}.`),
        L(`The missing part is ${blank.v}.`, `الجزء الناقص هو ${blank.v}.`),
      ],
      explanation: L(
        'Expanded form shows what each digit is really worth.',
        'الصيغة الممتدة تُظهر القيمة الحقيقية لكل رقم.',
      ),
    });
  }),

  G('place-name', 'place-value', 'mcq', [1, 2, 3], (rng, d) => {
    const digs = d + 2;
    const n = digitsInt(rng, digs);
    const s = String(n);
    const idx = rng.int(0, s.length - 1);
    const pow = s.length - 1 - idx;
    const right = PLACES[pow] as (typeof PLACES)[number];
    return mcqText(rng, {
      prompt: L(`In ${fmt(n)}, which place is the digit ${s[idx]} in?`, `في العدد ${fmt(n)}، في أي خانة يقع الرقم ${s[idx]}؟`),
      correct: L(right.en, right.ar),
      wrongs: PLACES.filter((p) => p.pow !== pow && p.pow < s.length)
        .map((p) => ({ label: L(p.en, p.ar), pid: 'place-value' })),
      hints: H(
        L('Start counting from the right: ones, tens, hundreds…', 'ابدأ العد من اليمين: آحاد، عشرات، مئات…'),
        L(`The digit has ${pow} digit(s) to its right.`, `على يمين الرقم ${pow} رقم/أرقام.`),
        L(`${pow} digits to the right means the ${right.en} place.`, `${pow} أرقام على اليمين تعني خانة ${right.ar}.`),
      ),
      steps: [
        L('Count the digits to the right of it.', 'عُدّ الأرقام الواقعة على يمينه.'),
        L(`There are ${pow}, so it is in the ${right.en} place.`, `يوجد ${pow}، إذن هو في خانة ${right.ar}.`),
      ],
      explanation: L(
        'Places go ones, tens, hundreds, thousands… from right to left.',
        'الخانات من اليمين إلى اليسار: آحاد، عشرات، مئات، آلاف…',
      ),
    });
  }),

  G('match-places', 'place-value', 'matching', [1, 2, 3], (rng, d) => {
    const count = Math.min(3 + (d > 1 ? 1 : 0), 4);
    const pick = rng.sample(PLACES.slice(0, 5), count);
    return matchBody(rng, {
      prompt: L('Match each place with its value.', 'صِل كل خانة بقيمتها.'),
      pairs: pick.map((p) => ({ left: L(p.en, p.ar), right: same(fmt(10 ** p.pow)) })),
      hints: H(
        L('Ones is 1. Every place to the left is ten times bigger.', 'الآحاد = 1، وكل خانة إلى اليسار أكبر عشر مرات.'),
        L('Tens = 10, hundreds = 100…', 'العشرات = 10، المئات = 100…'),
        L('Thousands = 1,000, ten thousands = 10,000.', 'الآلاف = 1000، عشرات الآلاف = 10000.'),
      ),
      steps: [L('Start with ones = 1 and multiply by 10 each step left.', 'ابدأ بالآحاد = 1 واضرب في 10 مع كل خانة نحو اليسار.')],
      explanation: L('Each place is ten times the one to its right.', 'كل خانة تساوي عشرة أمثال الخانة التي على يمينها.'),
    });
  }),
];

// ───────────────────────── Addition ─────────────────────────

const addition: Generator[] = [
  G('sum', 'addition', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const digs = [1, 2, 3, 4, 4][d - 1] as number;
    const a = digitsInt(rng, digs);
    const b = digitsInt(rng, digs);
    const c = d === 5 ? digitsInt(rng, 3) : 0;
    const total = a + b + c;
    const expr = c ? `${a} + ${b} + ${c}` : `${a} + ${b}`;
    return typed({
      prompt: L('Add.', 'اجمع.'),
      display: expr,
      value: total,
      errors: [
        [total - 10, 'carry-error'],
        [total - 100, 'carry-error'],
        [total + 10, 'carry-error'],
      ],
      hints: H(
        L('Line the numbers up by place value.', 'رتّب الأعداد حسب الخانات.'),
        L('Add from the right and carry when a column is 10 or more.', 'اجمع من اليمين، وانقل 1 عندما يصل العمود إلى 10 أو أكثر.'),
        L(`Try adding the ones first: ${(a % 10) + (b % 10) + (c % 10)}.`, `ابدأ بالآحاد: ${(a % 10) + (b % 10) + (c % 10)}.`),
      ),
      steps: [
        L('Write the numbers in columns.', 'اكتب الأعداد في أعمدة.'),
        L('Add each column from right to left, carrying when needed.', 'اجمع كل عمود من اليمين إلى اليسار مع نقل الباقي.'),
        L(`${expr} = ${total}`, `${expr} = ${total}`),
      ],
      explanation: L('Adding column by column keeps each place value separate.', 'الجمع عمودًا عمودًا يُبقي كل خانة منفصلة.'),
    });
  }),

  G('missing-addend', 'addition', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const digs = d + 1;
    const a = digitsInt(rng, digs);
    const b = digitsInt(rng, digs);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `${a} + \\square = ${a + b}`,
      value: b,
      hints: H(
        L('What do you add to the first number to get the total?', 'ماذا نجمع مع العدد الأول لنحصل على المجموع؟'),
        L('Subtract the known number from the total.', 'اطرح العدد المعلوم من المجموع.'),
        L(`${a + b} − ${a} = ?`, `${a + b} − ${a} = ؟`),
      ),
      steps: [L('Addition and subtraction undo each other.', 'الجمع والطرح عمليتان متعاكستان.'), L(`${a + b} − ${a} = ${b}`, `${a + b} − ${a} = ${b}`)],
      explanation: L('To find a missing addend, subtract.', 'لإيجاد المجموع الناقص نستخدم الطرح.'),
    });
  }),

  G('story', 'addition', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const a = digitsInt(rng, d + 1);
    const b = digitsInt(rng, d + 1);
    const item = rng.pick([
      L('books', 'كتبًا'),
      L('stickers', 'ملصقًا'),
      L('marbles', 'كرة زجاجية'),
    ]);
    return typed({
      prompt: L(
        `${p.en} has ${a} ${item.en}. A friend gives ${p.en} ${b} more. How many ${item.en} does ${p.en} have now?`,
        `لدى ${p.ar} ${a} ${item.ar}. أعطاه/ها صديق ${b} أخرى. كم أصبح لديه/ها الآن؟`,
      ),
      value: a + b,
      hints: H(
        L('"More" tells you to put amounts together.', 'كلمة «أخرى» تعني أن نجمع الكميتين.'),
        L('Add the two amounts.', 'اجمع الكميتين.'),
        L(`${a} + ${b}`, `${a} + ${b}`),
      ),
      steps: [L('Joining amounts means adding.', 'ضمّ الكميات يعني الجمع.'), L(`${a} + ${b} = ${a + b}`, `${a} + ${b} = ${a + b}`)],
      explanation: L('When two amounts are combined, we add them.', 'عندما نضم كميتين معًا فإننا نجمعهما.'),
    });
  }),

  G('true-sum', 'addition', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const a = digitsInt(rng, d + 1);
    const b = digitsInt(rng, d + 1);
    const truth = rng.chance(0.5);
    const wrong = a + b + rng.pick(d > 2 ? [-10, 10, -1, 1, 100] : [-10, 10, -1, 1]);
    const shown = truth ? a + b : wrong;
    return tfBody({
      prompt: L('Is this statement true or false?', 'هل العبارة صحيحة أم خاطئة؟'),
      display: `${a} + ${b} = ${shown}`,
      truth,
      pid: 'carry-error',
      hints: H(
        L('Work out the sum yourself first.', 'احسب المجموع بنفسك أولًا.'),
        L('Add column by column.', 'اجمع عمودًا عمودًا.'),
        L(`The sum is ${a + b}.`, `المجموع هو ${a + b}.`),
      ),
      steps: [L(`${a} + ${b} = ${a + b}`, `${a} + ${b} = ${a + b}`), L(`The statement says ${shown}, so it is ${truth ? 'true' : 'false'}.`, `العبارة تقول ${shown}، فهي ${truth ? 'صحيحة' : 'خاطئة'}.`)],
      explanation: L('Check a claim by calculating it yourself.', 'تحقق من العبارة بحسابها بنفسك.'),
    });
  }),
];

// ───────────────────────── Subtraction ─────────────────────────

const subtraction: Generator[] = [
  G('difference', 'subtraction', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const digs = [1, 2, 3, 4, 5][d - 1] as number;
    let a = digitsInt(rng, digs);
    let b = rng.int(1, Math.max(1, a - 1));
    if (d >= 3 && digs > 1) b = digitsInt(rng, digs - 1);
    if (b >= a) [a, b] = [b + 1, a];
    return typed({
      prompt: L('Subtract.', 'اطرح.'),
      display: `${a} - ${b}`,
      value: a - b,
      errors: [
        [a - b + 10, 'borrow-error'],
        [a - b - 10, 'borrow-error'],
        [a + b, 'inverse-op'],
      ],
      hints: H(
        L('Line up the numbers by place value.', 'رتّب الأعداد حسب الخانات.'),
        L('Subtract from the right; borrow from the next column when the top digit is smaller.', 'اطرح من اليمين، واستلف من العمود التالي إذا كان الرقم العلوي أصغر.'),
        L(`The answer is smaller than ${a}.`, `الناتج أصغر من ${a}.`),
      ),
      steps: [
        L('Write the numbers in columns.', 'اكتب الأعداد في أعمدة.'),
        L('Subtract each column, borrowing when needed.', 'اطرح كل عمود مع الاستلاف عند الحاجة.'),
        L(`${a} − ${b} = ${a - b}`, `${a} − ${b} = ${a - b}`),
      ],
      explanation: L('When a digit is too small, borrow 1 from the next place: it is worth 10 here.', 'إذا كان الرقم صغيرًا نستلف 1 من الخانة التالية فيصبح 10 هنا.'),
    });
  }),

  G('check-by-adding', 'subtraction', 'mcq', [1, 2, 3, 4], (rng, d) => {
    const a = digitsInt(rng, d + 1) + 20;
    const b = rng.int(5, a - 5);
    return mcqNum(rng, {
      prompt: L('Which number is the result?', 'ما الناتج الصحيح؟'),
      display: `${a} - ${b}`,
      correct: a - b,
      cands: [cand(a + b, 'inverse-op'), cand(a - b + 10, 'borrow-error'), cand(a - b - 10, 'borrow-error'), cand(a - b + 1, 'off-by-one')],
      hints: H(
        L('Pick the answer, then add it to the small number to check.', 'اختر الإجابة ثم اجمعها مع العدد الصغير للتحقق.'),
        L('The result plus the small number must equal the big number.', 'الناتج + العدد الصغير يجب أن يساوي العدد الكبير.'),
        L(`${a} − ${b}`, `${a} − ${b}`),
      ),
      steps: [L(`${a} − ${b} = ${a - b}`, `${a} − ${b} = ${a - b}`), L(`Check: ${a - b} + ${b} = ${a}`, `تحقق: ${a - b} + ${b} = ${a}`)],
      explanation: L('Adding the answer back to the subtracted number checks your work.', 'إضافة الناتج إلى العدد المطروح تتحقق من صحة الحل.'),
    });
  }),

  G('missing-minuend', 'subtraction', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const b = digitsInt(rng, d + 1);
    const c = digitsInt(rng, d + 1);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `\\square - ${b} = ${c}`,
      value: b + c,
      errors: [[Math.abs(c - b), 'inverse-op']],
      hints: H(
        L('Something minus the small number gives the result.', 'عدد ما ناقص العدد الصغير يعطي الناتج.'),
        L('Do the opposite: add.', 'اعكس العملية: اجمع.'),
        L(`${c} + ${b} = ?`, `${c} + ${b} = ؟`),
      ),
      steps: [L('To undo subtraction, add.', 'للتراجع عن الطرح نجمع.'), L(`${c} + ${b} = ${b + c}`, `${c} + ${b} = ${b + c}`)],
      explanation: L('If x − b = c, then x = c + b.', 'إذا كان س − ب = ج فإن س = ج + ب.'),
    });
  }),

  G('story', 'subtraction', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const p = person(rng);
    const a = digitsInt(rng, d + 1) + 10;
    const b = rng.int(2, a - 1);
    return typed({
      prompt: L(
        `${p.en} had ${a} stickers and gave away ${b}. How many stickers are left?`,
        `كان مع ${p.ar} ${a} ملصقًا فأعطى ${b} منها. كم ملصقًا بقي؟`,
      ),
      value: a - b,
      hints: H(
        L('"Gave away" means some are taken away.', '«أعطى» تعني أن جزءًا انتقص.'),
        L('Subtract what was given from what there was.', 'اطرح ما أُعطي من الكمية الأصلية.'),
        L(`${a} − ${b}`, `${a} − ${b}`),
      ),
      steps: [L('Taking away means subtract.', 'الإنقاص يعني الطرح.'), L(`${a} − ${b} = ${a - b}`, `${a} − ${b} = ${a - b}`)],
      explanation: L('When some of an amount is removed, we subtract.', 'عندما نزيل جزءًا من كمية فإننا نطرح.'),
    });
  }),
];

// ───────────────────────── Multiplication ─────────────────────────

const multiplication: Generator[] = [
  G('product', 'multiplication', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const [a, b] =
      d === 1 ? [rng.int(2, 5), rng.int(2, 5)]
      : d === 2 ? [rng.int(3, 9), rng.int(3, 9)]
      : d === 3 ? [rng.int(11, 25), rng.int(3, 9)]
      : d === 4 ? [rng.int(12, 40), rng.int(11, 25)]
      : [rng.int(100, 400), rng.int(11, 35)];
    const p = a * b;
    return typed({
      prompt: L('Multiply.', 'اضرب.'),
      display: `${a} \\times ${b}`,
      value: p,
      errors: [
        [a + b, 'wrong-operation'],
        [p + a, 'table-slip'],
        [p - a, 'table-slip'],
        [p + b, 'table-slip'],
        [p - b, 'table-slip'],
      ],
      hints: H(
        L('Multiplication is repeated addition.', 'الضرب جمع متكرر.'),
        L(a > 12 || b > 12 ? 'Split one number into tens and ones, multiply each part, then add.' : 'Use the times table.', a > 12 || b > 12 ? 'جزّئ أحد العددين إلى عشرات وآحاد، واضرب كل جزء ثم اجمع.' : 'استخدم جدول الضرب.'),
        L(`Think of ${a} groups of ${b}.`, `فكّر في ${a} مجموعات في كل منها ${b}.`),
      ),
      steps:
        a > 12 || b > 12
          ? [
              L(`Split ${Math.max(a, b)} into ${Math.floor(Math.max(a, b) / 10) * 10} + ${Math.max(a, b) % 10}.`, `جزّئ ${Math.max(a, b)} إلى ${Math.floor(Math.max(a, b) / 10) * 10} + ${Math.max(a, b) % 10}.`),
              L(`Multiply each part by ${Math.min(a, b)} and add.`, `اضرب كل جزء في ${Math.min(a, b)} ثم اجمع.`),
              L(`${a} × ${b} = ${p}`, `${a} × ${b} = ${p}`),
            ]
          : [L(`${a} × ${b} = ${p}`, `${a} × ${b} = ${p}`)],
      explanation: L('Breaking a number into parts makes big products easy.', 'تجزئة العدد إلى أجزاء تجعل الضرب الكبير سهلًا.'),
    });
  }),

  G('table-choice', 'multiplication', 'mcq', [1, 2, 3], (rng, d) => {
    const a = rng.int(3, 6 + d * 2);
    const b = rng.int(3, 6 + d * 2);
    return mcqNum(rng, {
      prompt: L('Choose the right answer.', 'اختر الإجابة الصحيحة.'),
      display: `${a} \\times ${b}`,
      correct: a * b,
      cands: [cand(a * b + a, 'table-slip'), cand(a * b - b, 'table-slip'), cand(a + b, 'wrong-operation'), cand(a * b + 1, 'table-slip')],
      hints: H(
        L('Use the times table for the smaller number.', 'استعن بجدول ضرب العدد الأصغر.'),
        L(`Count in steps of ${Math.min(a, b)}.`, `عُدّ قفزات بمقدار ${Math.min(a, b)}.`),
        L(`${a} × ${b - 1} = ${a * (b - 1)}, then add ${a}.`, `${a} × ${b - 1} = ${a * (b - 1)}، ثم أضف ${a}.`),
      ),
      steps: [L(`${a} × ${b} = ${a * b}`, `${a} × ${b} = ${a * b}`)],
      explanation: L('Learning the table well makes everything faster.', 'إتقان جدول الضرب يجعل كل شيء أسرع.'),
    });
  }),

  G('rows', 'multiplication', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const rows = d <= 2 ? rng.int(3, 8) : rng.int(6, 15);
    const per = d <= 2 ? rng.int(3, 9) : rng.int(8, 24);
    const what = rng.pick([
      L('chairs', 'كرسيًا'),
      L('cookies', 'قطعة بسكويت'),
      L('plants', 'نبتة'),
    ]);
    return typed({
      prompt: L(
        `There are ${rows} rows with ${per} ${what.en} in each row. How many ${what.en} are there in total?`,
        `هناك ${rows} صفوف، في كل صف ${per} ${what.ar}. كم المجموع؟`,
      ),
      value: rows * per,
      errors: [[rows + per, 'wrong-operation']],
      hints: H(
        L('Equal groups mean multiplication.', 'المجموعات المتساوية تعني الضرب.'),
        L('Multiply the number of rows by the amount in each row.', 'اضرب عدد الصفوف في عدد العناصر في كل صف.'),
        L(`${rows} × ${per}`, `${rows} × ${per}`),
      ),
      steps: [L('Equal rows → multiply.', 'صفوف متساوية ← اضرب.'), L(`${rows} × ${per} = ${rows * per}`, `${rows} × ${per} = ${rows * per}`)],
      explanation: L('Multiplication finds the total of equal groups quickly.', 'الضرب يجد مجموع المجموعات المتساوية بسرعة.'),
    });
  }),

  G('missing-factor', 'multiplication', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const a = rng.int(2, 5 + d * 2);
    const b = rng.int(2, 5 + d * 2);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `${a} \\times \\square = ${a * b}`,
      value: b,
      errors: [[a * b - a, 'inverse-op']],
      hints: H(
        L('Think: how many groups of the first number make the total?', 'فكّر: كم مرة نكرر العدد الأول لنصل إلى الناتج؟'),
        L('Divide the product by the known factor.', 'اقسم الناتج على العامل المعلوم.'),
        L(`${a * b} ÷ ${a}`, `${a * b} ÷ ${a}`),
      ),
      steps: [L('Undo multiplication with division.', 'نتراجع عن الضرب بالقسمة.'), L(`${a * b} ÷ ${a} = ${b}`, `${a * b} ÷ ${a} = ${b}`)],
      explanation: L('Multiplication and division are opposites.', 'الضرب والقسمة عمليتان متعاكستان.'),
    });
  }),

  G('true-product', 'multiplication', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const a = rng.int(3, 8 + d * 2);
    const b = rng.int(3, 8 + d * 2);
    const truth = rng.chance(0.5);
    const shown = truth ? a * b : a * b + rng.pick([-a, a, -b, b]);
    return tfBody({
      prompt: L('True or false?', 'صحيح أم خطأ؟'),
      display: `${a} \\times ${b} = ${shown}`,
      truth,
      pid: 'table-slip',
      hints: H(L('Calculate it yourself.', 'احسبها بنفسك.'), L('Use the times table.', 'استعن بجدول الضرب.'), L(`${a} × ${b} = ${a * b}`, `${a} × ${b} = ${a * b}`)),
      steps: [L(`${a} × ${b} = ${a * b}`, `${a} × ${b} = ${a * b}`)],
      explanation: L('A product that is off by one group is a common slip.', 'الخطأ بمقدار مجموعة واحدة خطأ شائع.'),
    });
  }),
];

// ───────────────────────── Division ─────────────────────────

const division: Generator[] = [
  G('quotient', 'division', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const divisor = d === 1 ? rng.int(2, 5) : d === 2 ? rng.int(2, 9) : d === 3 ? rng.int(3, 12) : rng.int(6, 25);
    const q = d === 1 ? rng.int(2, 9) : d === 2 ? rng.int(3, 12) : d === 3 ? rng.int(10, 40) : d === 4 ? rng.int(20, 80) : rng.int(50, 400);
    const total = divisor * q;
    return typed({
      prompt: L('Divide.', 'اقسم.'),
      display: `${total} \\div ${divisor}`,
      value: q,
      errors: [
        [total - divisor, 'wrong-operation'],
        [divisor, 'swapped-operands'],
      ],
      hints: H(
        L('How many times does the divisor fit in?', 'كم مرة يتسع المقسوم عليه؟'),
        L(`Think: ${divisor} × ? = ${total}.`, `فكّر: ${divisor} × ؟ = ${total}.`),
        L(`Try ${divisor} × ${q - 1} = ${divisor * (q - 1)}; how much more is needed?`, `جرّب ${divisor} × ${q - 1} = ${divisor * (q - 1)}؛ كم يلزم بعد؟`),
      ),
      steps: [L(`Ask: ${divisor} × ? = ${total}.`, `اسأل: ${divisor} × ؟ = ${total}.`), L(`${divisor} × ${q} = ${total}, so ${total} ÷ ${divisor} = ${q}.`, `${divisor} × ${q} = ${total}، إذن ${total} ÷ ${divisor} = ${q}.`)],
      explanation: L('Division asks how many equal groups fit; check by multiplying back.', 'القسمة تسأل كم مجموعة متساوية تتسع؛ تحقق بالضرب.'),
    });
  }),

  G('share', 'division', 'word-problem', [1, 2, 3, 4, 5], (rng, d) => {
    const people = d <= 2 ? rng.int(2, 6) : rng.int(4, 12);
    const each = d <= 2 ? rng.int(2, 9) : rng.int(6, 30);
    const total = people * each;
    return typed({
      prompt: L(
        `${total} candies are shared equally among ${people} children. How many does each child get?`,
        `وُزعت ${total} حلوى بالتساوي على ${people} أطفال. كم يأخذ كل طفل؟`,
      ),
      value: each,
      errors: [[total - people, 'wrong-operation'], [people, 'swapped-operands']],
      hints: H(
        L('"Shared equally" means divide.', '«بالتساوي» تعني القسمة.'),
        L('Divide the total by the number of children.', 'اقسم المجموع على عدد الأطفال.'),
        L(`${total} ÷ ${people}`, `${total} ÷ ${people}`),
      ),
      steps: [L(`${total} ÷ ${people} = ${each}`, `${total} ÷ ${people} = ${each}`)],
      explanation: L('Sharing equally is division.', 'التوزيع المتساوي هو قسمة.'),
    });
  }),

  G('remainder', 'division', 'mcq', [2, 3, 4], (rng, d) => {
    const divisor = rng.int(3, 4 + d * 2);
    const q = rng.int(3, 9 + d * 3);
    const r = rng.int(1, divisor - 1);
    const total = divisor * q + r;
    return mcqNum(rng, {
      prompt: L(`What is the remainder when ${total} is divided by ${divisor}?`, `ما باقي قسمة ${total} على ${divisor}؟`),
      correct: r,
      cands: [cand(q, 'quotient-for-remainder'), cand(divisor - r, 'remainder-complement'), cand(0), cand(r + 1)],
      hints: H(
        L('Find the biggest multiple of the divisor that fits.', 'ابحث عن أكبر مضاعف للمقسوم عليه لا يتجاوز العدد.'),
        L(`${divisor} × ${q} = ${divisor * q}.`, `${divisor} × ${q} = ${divisor * q}.`),
        L(`Subtract: ${total} − ${divisor * q}.`, `اطرح: ${total} − ${divisor * q}.`),
      ),
      steps: [L(`${divisor} × ${q} = ${divisor * q}`, `${divisor} × ${q} = ${divisor * q}`), L(`${total} − ${divisor * q} = ${r}`, `${total} − ${divisor * q} = ${r}`)],
      explanation: L('The remainder is what is left over and is always smaller than the divisor.', 'الباقي هو ما تبقى، وهو دائمًا أصغر من المقسوم عليه.'),
    });
  }),

  G('missing-dividend', 'division', 'fill-blank', [1, 2, 3, 4], (rng, d) => {
    const divisor = rng.int(2, 5 + d * 2);
    const q = rng.int(2, 6 + d * 3);
    return typed({
      prompt: L('Find the missing number.', 'أوجد العدد الناقص.'),
      display: `\\square \\div ${divisor} = ${q}`,
      value: divisor * q,
      errors: [[divisor + q, 'wrong-operation']],
      hints: H(
        L('Undo the division.', 'تراجع عن القسمة.'),
        L('Multiply the answer by the divisor.', 'اضرب الناتج في المقسوم عليه.'),
        L(`${q} × ${divisor}`, `${q} × ${divisor}`),
      ),
      steps: [L(`${q} × ${divisor} = ${q * divisor}`, `${q} × ${divisor} = ${q * divisor}`)],
      explanation: L('If x ÷ b = c then x = c × b.', 'إذا كان س ÷ ب = ج فإن س = ج × ب.'),
    });
  }),
];

// ───────────────────────── Comparing numbers ─────────────────────────

const comparing: Generator[] = [
  G('compare-two', 'comparing-numbers', 'compare', [1, 2, 3, 4, 5], (rng, d) => {
    if (d <= 2) {
      const a = digitsInt(rng, d + 1);
      const b = rng.chance(0.12) ? a : digitsInt(rng, d + 1);
      return compareBody({
        prompt: L('Choose <, = or >.', 'اختر <  أو = أو >.'),
        a: F(a), b: F(b), aTex: String(a), bTex: String(b),
        hints: H(L('Compare the number of digits first.', 'قارن عدد الأرقام أولًا.'), L('If equal, compare from the left.', 'إن تساويا قارن من اليسار.'), L(`${a} vs ${b}`, `${a} مقابل ${b}`)),
        steps: [L(`${a} is ${a < b ? 'less than' : a > b ? 'greater than' : 'equal to'} ${b}.`, `${a} ${a < b ? 'أصغر من' : a > b ? 'أكبر من' : 'يساوي'} ${b}.`)],
        explanation: L('Compare digits from the left, the first difference decides.', 'قارن الأرقام من اليسار، فأول اختلاف يحسم الأمر.'),
      });
    }
    // decimals: longer is not bigger
    const places = d === 3 ? 1 : 2;
    const base = rng.int(1, 9);
    const x = base + rng.int(1, 9) / 10 ** 1;
    const a = F(Math.round(x * 10 ** places), 10 ** places);
    const bn = Math.round((x + (rng.chance(0.5) ? 0.05 : -0.05)) * 10 ** (places + 1));
    const b = F(bn, 10 ** (places + 1));
    return compareBody({
      prompt: L('Choose <, = or >.', 'اختر <  أو = أو >.'),
      a, b, aTex: a.toDecimal(4), bTex: b.toDecimal(4),
      pids: { lt: 'compare-decimal-length', gt: 'compare-decimal-length', eq: 'compare-decimal-length' },
      hints: H(L('Line up the decimal points.', 'حاذِ الفواصل العشرية.'), L('Add zeros to make both numbers the same length.', 'أضف أصفارًا لتتساوى الأطوال.'), L(`${a.toDecimal(4)} and ${b.toDecimal(4)}`, `${a.toDecimal(4)} و ${b.toDecimal(4)}`)),
      steps: [L('Write both with the same number of decimal places.', 'اكتب العددين بنفس عدد المنازل العشرية.'), L('Compare digit by digit from the left.', 'قارن رقمًا برقم من اليسار.')],
      explanation: L('More decimal digits does not mean a bigger number.', 'كثرة الأرقام بعد الفاصلة لا تعني أن العدد أكبر.'),
    });
  }),

  G('order-numbers', 'comparing-numbers', 'ordering', [1, 2, 3, 4, 5], (rng, d) => {
    const count = Math.min(3 + (d > 2 ? 1 : 0) + (d > 4 ? 1 : 0), 5);
    const asc = rng.chance(0.6);
    const set = new Set<number>();
    while (set.size < count) set.add(d <= 3 ? digitsInt(rng, d + 1) : rng.int(-50, 500));
    return orderBody(rng, {
      prompt: asc ? L('Put the numbers in order, smallest first.', 'رتّب الأعداد من الأصغر إلى الأكبر.') : L('Put the numbers in order, largest first.', 'رتّب الأعداد من الأكبر إلى الأصغر.'),
      entries: [...set].map((n) => ({ value: F(n), label: same(String(n)) })),
      ascending: asc,
      hints: H(L('Find the smallest (or largest) first.', 'ابحث عن الأصغر (أو الأكبر) أولًا.'), L('Compare the number of digits, then the digits.', 'قارن عدد الأرقام ثم الأرقام نفسها.'), L('Place them one by one.', 'ضعها واحدًا بعد الآخر.')),
      steps: [L('Compare the numbers two at a time.', 'قارن العددين اثنين اثنين.'), L('Arrange them in the requested order.', 'رتّبها كما هو مطلوب.')],
      explanation: L('Ordering is repeated comparison.', 'الترتيب هو مقارنة متكررة.'),
    });
  }),

  G('largest', 'comparing-numbers', 'mcq', [1, 2, 3], (rng, d) => {
    const set = new Set<number>();
    while (set.size < 4) set.add(digitsInt(rng, d + 1));
    const nums = [...set];
    const biggest = Math.max(...nums);
    const wantMax = rng.chance(0.5);
    const target = wantMax ? biggest : Math.min(...nums);
    return mcqNum(rng, {
      prompt: wantMax ? L('Which is the largest number?', 'ما هو أكبر عدد؟') : L('Which is the smallest number?', 'ما هو أصغر عدد؟'),
      correct: target,
      cands: nums.filter((n) => n !== target).map((n) => cand(n)),
      hints: H(L('Compare digits from the left.', 'قارن الأرقام من اليسار.'), L('More digits means a bigger number.', 'الأكثر أرقامًا هو الأكبر.'), L(`Check ${nums.join(', ')}.`, `افحص ${nums.join('، ')}.`)),
      steps: [L(`The ${wantMax ? 'largest' : 'smallest'} is ${target}.`, `${wantMax ? 'الأكبر' : 'الأصغر'} هو ${target}.`)],
      explanation: L('Compare from the highest place value down.', 'قارن بدءًا من أعلى خانة.'),
    });
  }),
];

// ───────────────────────── Rounding & estimation ─────────────────────────

const rounding: Generator[] = [
  G('round-to', 'rounding', 'type-answer', [1, 2, 3, 4, 5], (rng, d) => {
    const place = d <= 2 ? 10 : d <= 4 ? 100 : 1000;
    const n = d <= 2 ? rng.int(11, 99) : d <= 4 ? rng.int(101, 999) : rng.int(1001, 9999);
    const rounded = Math.round(n / place) * place;
    const down = Math.floor(n / place) * place;
    const up = down + place;
    // Avoid exact halves with ambiguity (they round up by convention; still valid)
    return typed({
      prompt: L(`Round ${fmt(n)} to the nearest ${place}.`, `قرّب ${fmt(n)} إلى أقرب ${place}.`),
      value: rounded,
      errors: [[rounded === up ? down : up, 'rounding-direction']],
      hints: H(
        L('Look at the digit just to the right of the place you round to.', 'انظر إلى الرقم الذي على يمين الخانة المطلوبة.'),
        L('5 or more → round up. 4 or less → keep.', '5 فأكثر ← قرّب للأعلى. 4 فأقل ← أبقِ كما هو.'),
        L(`The choices are ${down} and ${up}.`, `الخياران هما ${down} و ${up}.`),
      ),
      steps: [
        L(`${fmt(n)} is between ${fmt(down)} and ${fmt(up)}.`, `${fmt(n)} بين ${fmt(down)} و ${fmt(up)}.`),
        L(`It is closer to ${fmt(rounded)}.`, `هو أقرب إلى ${fmt(rounded)}.`),
      ],
      explanation: L('Rounding finds the nearest friendly number; halfway goes up.', 'التقريب يجد أقرب عدد مريح؛ والنصف يُقرَّب للأعلى.'),
    });
  }),

  G('estimate-sum', 'rounding', 'mcq', [2, 3, 4, 5], (rng, d) => {
    const a = digitsInt(rng, d + 1);
    const b = digitsInt(rng, d + 1);
    const place = 10 ** (Math.max(1, d));
    const ra = Math.round(a / place) * place;
    const rb = Math.round(b / place) * place;
    return mcqNum(rng, {
      prompt: L(`Estimate by rounding each number to the nearest ${place}.`, `قدّر الناتج بتقريب كل عدد إلى أقرب ${place}.`),
      display: `${a} + ${b} \\approx \\;?`,
      correct: ra + rb,
      cands: [cand(a + b, 'not-estimated'), cand(ra + rb + place, 'rounding-direction'), cand(ra + rb - place, 'rounding-direction')],
      hints: H(L('Round each number first.', 'قرّب كل عدد أولًا.'), L('Then add the rounded numbers.', 'ثم اجمع العددين المقرّبين.'), L(`${ra} + ${rb}`, `${ra} + ${rb}`)),
      steps: [L(`${a} ≈ ${ra}, ${b} ≈ ${rb}.`, `${a} ≈ ${ra}، ${b} ≈ ${rb}.`), L(`${ra} + ${rb} = ${ra + rb}`, `${ra} + ${rb} = ${ra + rb}`)],
      explanation: L('Estimating gives a quick check that your exact answer is sensible.', 'التقدير فحص سريع لمعقولية الإجابة الدقيقة.'),
    });
  }),

  G('round-true', 'rounding', 'true-false', [1, 2, 3, 4], (rng, d) => {
    const place = d <= 2 ? 10 : 100;
    const n = place === 10 ? rng.int(11, 99) : rng.int(101, 999);
    const right = Math.round(n / place) * place;
    const truth = rng.chance(0.5);
    const shown = truth ? right : right + (rng.chance(0.5) ? place : -place);
    return tfBody({
      prompt: L('True or false?', 'صحيح أم خطأ؟'),
      display: `${n} \\approx ${shown} \\text{ (nearest ${place})}`,
      truth,
      pid: 'rounding-direction',
      hints: H(L('Find the two possible rounded values.', 'ابحث عن القيمتين الممكنتين.'), L('Which one is nearer?', 'أيهما أقرب؟'), L(`${n} rounds to ${right}.`, `${n} تُقرَّب إلى ${right}.`)),
      steps: [L(`${n} rounds to ${right}.`, `${n} تُقرَّب إلى ${right}.`)],
      explanation: L('Check the digit to the right of the rounding place.', 'افحص الرقم الذي على يمين خانة التقريب.'),
    });
  }),
];

export const L1_GENERATORS: Generator[] = [
  ...placeValue,
  ...addition,
  ...subtraction,
  ...multiplication,
  ...division,
  ...comparing,
  ...rounding,
];
