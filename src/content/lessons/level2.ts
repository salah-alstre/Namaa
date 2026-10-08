import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL2_LESSONS: Lesson[] = [
  lesson('fraction-basics', {
    minutes: 6,
    explanation: [
      p('A fraction describes part of a whole. The **denominator** (bottom) says how many equal parts the whole is cut into. The **numerator** (top) says how many parts we take.', 'الكسر يصف جزءًا من كل. **المقام** (الأسفل) يبيّن إلى كم جزء متساوٍ قُسّم الكل، و**البسط** (الأعلى) يبيّن كم جزءًا أخذنا.'),
      p('$\\frac{3}{4}$ means 3 of 4 equal parts. The parts must be equal, otherwise it is not a fraction of the whole.', '$\\frac{3}{4}$ تعني 3 من 4 أجزاء متساوية. يجب أن تكون الأجزاء متساوية وإلا فليس كسرًا من الكل.'),
      p('If the numerator is smaller than the denominator, the fraction is less than one whole (a **proper** fraction). If it is bigger or equal, it is an **improper** fraction.', 'إذا كان البسط أصغر من المقام فالكسر أقل من واحد صحيح (كسر **اعتيادي**). وإذا كان أكبر أو مساويًا فهو كسر **غير حقيقي**.'),
    ],
    visual: { type: 'fraction-bar', num: 3, den: 4 },
    visualCaption: p('3 of the 4 equal parts are shaded.', 'تم تظليل 3 من 4 أجزاء متساوية.'),
    example: {
      problem: p('A pizza is cut into 8 equal slices and you eat 3. What fraction did you eat?', 'قُطعت بيتزا إلى 8 شرائح متساوية وأكلت 3. ما الكسر الذي أكلته؟'),
      steps: [
        p('The whole is cut into 8 parts, so the denominator is 8.', 'الكل مقسّم إلى 8 أجزاء، فالمقام 8.'),
        p('You took 3 parts, so the numerator is 3.', 'أخذت 3 أجزاء، فالبسط 3.'),
      ],
      result: p('You ate $\\frac{3}{8}$ of the pizza.', 'أكلت $\\frac{3}{8}$ من البيتزا.'),
    },
    why: p('Fractions let us talk about amounts between whole numbers: half a cup, a quarter of an hour, three fifths of a class.', 'تتيح لنا الكسور الحديث عن كميات بين الأعداد الصحيحة: نصف كوب، ربع ساعة، ثلاثة أخماس الصف.'),
    tryGen: 'part-of-whole',
    check: ['part-of-whole', 'numerator-denominator', 'proper-or-improper', 'fraction-story'],
    keywords: p('fraction numerator denominator part whole proper improper', 'كسر بسط مقام جزء كل'),
  }),
  lesson('equivalent-fractions', {
    minutes: 6,
    explanation: [
      p('Different fractions can show the same amount. $\\frac{1}{2}$, $\\frac{2}{4}$ and $\\frac{4}{8}$ are all equal. These are **equivalent fractions**.', 'كسور مختلفة قد تمثل المقدار نفسه. $\\frac{1}{2}$ و$\\frac{2}{4}$ و$\\frac{4}{8}$ كلها متساوية. تسمى **كسورًا متكافئة**.'),
      p('To make an equivalent fraction, multiply (or divide) the numerator and the denominator by the **same** number.', 'لإيجاد كسر مكافئ اضرب (أو اقسم) البسط والمقام في العدد **نفسه**.'),
      p('Never add the same number to both parts: $\\frac{1+1}{2+1}$ is not equal to $\\frac{1}{2}$.', 'لا تضف العدد نفسه إلى البسط والمقام: $\\frac{1+1}{2+1}$ لا تساوي $\\frac{1}{2}$.'),
    ],
    visual: { type: 'fraction-bar', num: 2, den: 4 },
    visualCaption: p('2 of 4 covers the same length as 1 of 2.', '2 من 4 تغطي الطول نفسه الذي يغطيه 1 من 2.'),
    example: {
      problem: p('Find the missing number: $\\frac{3}{5} = \\frac{?}{20}$', 'أوجد العدد الناقص: $\\frac{3}{5} = \\frac{?}{20}$'),
      steps: [
        p('The denominator went from 5 to 20: that is $\\times 4$.', 'المقام انتقل من 5 إلى 20: أي $\\times 4$.'),
        p('Do the same to the numerator: $3 \\times 4 = 12$.', 'افعل الشيء نفسه بالبسط: $3 \\times 4 = 12$.'),
      ],
      result: p('$\\frac{3}{5} = \\frac{12}{20}$', '$\\frac{3}{5} = \\frac{12}{20}$'),
    },
    why: p('To add, subtract or compare fractions you almost always need to rewrite them with the same denominator.', 'لجمع الكسور أو طرحها أو مقارنتها تحتاج غالبًا إلى كتابتها بالمقام نفسه.'),
    tryGen: 'missing-numerator',
    check: ['missing-numerator', 'missing-denominator', 'which-equal', 'true-equal', 'match-equivalent'],
    keywords: p('equivalent equal fractions multiply same', 'كسور متكافئة متساوية'),
  }),
  lesson('simplifying-fractions', {
    minutes: 6,
    explanation: [
      p('Simplifying (reducing) a fraction means writing it with the smallest possible numbers, without changing its value.', 'تبسيط الكسر يعني كتابته بأصغر أعداد ممكنة دون تغيير قيمته.'),
      p('Divide the numerator and denominator by a **common factor**. Best of all, divide by the greatest common factor (GCF) and you finish in one step.', 'اقسم البسط والمقام على **عامل مشترك**. والأفضل أن تقسم على القاسم المشترك الأكبر فتنتهي بخطوة واحدة.'),
      p('A fraction is fully simplified when the only common factor left is 1. Example: $\\frac{12}{18} = \\frac{2}{3}$.', 'يكون الكسر مبسّطًا تمامًا عندما لا يبقى بين البسط والمقام عامل مشترك غير 1. مثال: $\\frac{12}{18} = \\frac{2}{3}$.'),
    ],
    visual: { type: 'fraction-bar', num: 2, den: 3 },
    visualCaption: p('$\\frac{4}{6}$ and $\\frac{2}{3}$ cover the same part.', '$\\frac{4}{6}$ و$\\frac{2}{3}$ تغطيان الجزء نفسه.'),
    example: {
      problem: p('Simplify $\\frac{24}{36}$.', 'بسّط $\\frac{24}{36}$.'),
      steps: [
        p('Factors of 24 and 36 in common: the biggest is 12.', 'العوامل المشتركة بين 24 و36: أكبرها 12.'),
        p('Divide both: $24 \\div 12 = 2$ and $36 \\div 12 = 3$.', 'اقسم كليهما: $24 \\div 12 = 2$ و$36 \\div 12 = 3$.'),
      ],
      result: p('$\\frac{24}{36} = \\frac{2}{3}$', '$\\frac{24}{36} = \\frac{2}{3}$'),
    },
    why: p('Simple fractions are easier to read, compare and use. Teachers and exams expect answers in lowest terms.', 'الكسور البسيطة أسهل قراءة ومقارنة واستخدامًا، وتتوقع الاختبارات الجواب في أبسط صورة.'),
    tryGen: 'simplify',
    check: ['simplify', 'pick-simplest', 'is-simplest', 'score-story'],
    keywords: p('simplify reduce lowest terms gcf common factor', 'تبسيط اختزال أبسط صورة عامل مشترك'),
  }),
  lesson('comparing-fractions', {
    minutes: 6,
    explanation: [
      p('Same denominator? The bigger numerator wins: $\\frac{5}{8} > \\frac{3}{8}$.', 'المقام نفسه؟ البسط الأكبر هو الأكبر: $\\frac{5}{8} > \\frac{3}{8}$.'),
      p('Same numerator? The **smaller** denominator wins, because the pieces are bigger: $\\frac{1}{3} > \\frac{1}{5}$.', 'البسط نفسه؟ المقام **الأصغر** هو الأكبر لأن القطع أكبر: $\\frac{1}{3} > \\frac{1}{5}$.'),
      p('Otherwise, rewrite both with a common denominator, or use cross-multiplying. A handy benchmark: compare each fraction to $\\frac{1}{2}$ first.', 'غير ذلك، اكتب الكسرين بمقام مشترك أو استخدم الضرب التبادلي. ومن الحيل المفيدة أن تقارن كل كسر بالنصف $\\frac{1}{2}$ أولًا.'),
    ],
    visual: { type: 'fraction-bar', num: 5, den: 8 },
    example: {
      problem: p('Which is bigger, $\\frac{3}{4}$ or $\\frac{5}{7}$?', 'أيهما أكبر: $\\frac{3}{4}$ أم $\\frac{5}{7}$؟'),
      steps: [
        p('Cross-multiply: $3 \\times 7 = 21$ and $5 \\times 4 = 20$.', 'اضرب تبادليًا: $3 \\times 7 = 21$ و$5 \\times 4 = 20$.'),
        p('$21 > 20$, so the first fraction is bigger.', '$21 > 20$ لذا الكسر الأول هو الأكبر.'),
      ],
      result: p('$\\frac{3}{4} > \\frac{5}{7}$', '$\\frac{3}{4} > \\frac{5}{7}$'),
    },
    why: p('Comparing fractions is how you decide which deal, recipe amount or measurement is larger.', 'مقارنة الكسور تساعدك على اختيار العرض الأفضل أو المقدار الأكبر في وصفة أو قياس.'),
    tryGen: 'compare-two',
    check: ['compare-two', 'order-fractions', 'largest', 'half-benchmark'],
    keywords: p('compare fractions bigger smaller order cross multiply', 'مقارنة كسور أكبر أصغر ترتيب'),
  }),
  lesson('add-sub-fractions', {
    minutes: 8,
    explanation: [
      p('Same denominator: add or subtract the numerators and keep the denominator. $\\frac{2}{7} + \\frac{3}{7} = \\frac{5}{7}$.', 'المقام نفسه: اجمع أو اطرح البسطين وأبقِ المقام. $\\frac{2}{7} + \\frac{3}{7} = \\frac{5}{7}$.'),
      p('Different denominators: first find a **common denominator** (the least common multiple works best). Rewrite each fraction, then add the tops.', 'مقامان مختلفان: أوجد أولًا **مقامًا مشتركًا** (والأفضل المضاعف المشترك الأصغر). أعد كتابة كل كسر ثم اجمع البسطين.'),
      p('The most common mistake is adding denominators: $\\frac{1}{2} + \\frac{1}{3}$ is **not** $\\frac{2}{5}$. Always simplify at the end.', 'الخطأ الأشهر هو جمع المقامين: $\\frac{1}{2} + \\frac{1}{3}$ **ليست** $\\frac{2}{5}$. ولا تنسَ التبسيط في النهاية.'),
    ],
    visual: { type: 'fraction-bar', num: 5, den: 6 },
    visualCaption: p('$\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$', '$\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$'),
    example: {
      problem: p('Find $\\frac{3}{4} - \\frac{1}{6}$.', 'أوجد $\\frac{3}{4} - \\frac{1}{6}$.'),
      steps: [
        p('The least common denominator of 4 and 6 is 12.', 'المقام المشترك الأصغر للعددين 4 و6 هو 12.'),
        p('$\\frac{3}{4} = \\frac{9}{12}$ and $\\frac{1}{6} = \\frac{2}{12}$.', '$\\frac{3}{4} = \\frac{9}{12}$ و$\\frac{1}{6} = \\frac{2}{12}$.'),
        p('Subtract: $\\frac{9}{12} - \\frac{2}{12} = \\frac{7}{12}$.', 'اطرح: $\\frac{9}{12} - \\frac{2}{12} = \\frac{7}{12}$.'),
      ],
      result: p('$\\frac{7}{12}$', '$\\frac{7}{12}$'),
    },
    why: p('Combining parts of different sizes is a daily task: ingredients, time, distances and measurements.', 'ضم أجزاء بأحجام مختلفة مهمة يومية: المقادير والوقت والمسافات والقياسات.'),
    tryGen: 'add-unlike',
    check: ['add-like', 'add-unlike', 'subtract-unlike', 'pizza-story', 'first-step'],
    keywords: p('add subtract fractions common denominator lcm', 'جمع طرح كسور مقام مشترك'),
  }),
  lesson('mul-div-fractions', {
    minutes: 8,
    explanation: [
      p('To multiply fractions, multiply the tops and multiply the bottoms. $\\frac{2}{3} \\times \\frac{4}{5} = \\frac{8}{15}$. No common denominator is needed.', 'لضرب الكسور اضرب البسطين معًا والمقامين معًا. $\\frac{2}{3} \\times \\frac{4}{5} = \\frac{8}{15}$. لا حاجة لمقام مشترك.'),
      p('"Of" means multiply: half of 12 is $\\frac{1}{2} \\times 12 = 6$.', 'كلمة "من" تعني ضرب: نصف 12 هو $\\frac{1}{2} \\times 12 = 6$.'),
      p('To divide by a fraction, **flip** it (take the reciprocal) and multiply: $\\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\times \\frac{5}{4}$.', 'للقسمة على كسر **اقلبه** (خذ مقلوبه) ثم اضرب: $\\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\times \\frac{5}{4}$.'),
    ],
    visual: { type: 'grid', rows: 3, cols: 5, shaded: 8 },
    visualCaption: p('Shading 2 of 3 rows and 4 of 5 columns covers 8 of 15 squares.', 'تظليل صفين من 3 و4 أعمدة من 5 يغطي 8 مربعات من 15.'),
    example: {
      problem: p('Find $\\frac{3}{4} \\div \\frac{3}{8}$.', 'أوجد $\\frac{3}{4} \\div \\frac{3}{8}$.'),
      steps: [
        p('Flip the second fraction and multiply: $\\frac{3}{4} \\times \\frac{8}{3}$.', 'اقلب الكسر الثاني واضرب: $\\frac{3}{4} \\times \\frac{8}{3}$.'),
        p('Multiply: $\\frac{24}{12}$, which simplifies to 2.', 'اضرب: $\\frac{24}{12}$ وتبسيطها 2.'),
      ],
      result: p('$\\frac{3}{4} \\div \\frac{3}{8} = 2$', '$\\frac{3}{4} \\div \\frac{3}{8} = 2$'),
    },
    why: p('Scaling recipes, finding a share of an amount and working out "how many pieces fit" all use these two operations.', 'تكبير الوصفات وإيجاد حصة من كمية ومعرفة "كم قطعة تتسع" كلها تستخدم هاتين العمليتين.'),
    tryGen: 'multiply',
    check: ['multiply', 'divide', 'fraction-of-amount', 'division-rule', 'reciprocal'],
    keywords: p('multiply divide fractions reciprocal flip of', 'ضرب قسمة كسور مقلوب'),
  }),
  lesson('mixed-numbers', {
    minutes: 6,
    explanation: [
      p('A **mixed number** has a whole part and a fraction part: $2\\frac{3}{4}$ means 2 wholes and $\\frac{3}{4}$ more.', '**العدد الكسري** له جزء صحيح وجزء كسري: $2\\frac{3}{4}$ تعني صحيحين و$\\frac{3}{4}$ إضافية.'),
      p('Mixed to improper: multiply the whole by the denominator, add the numerator, keep the denominator. $2\\frac{3}{4} = \\frac{2 \\times 4 + 3}{4} = \\frac{11}{4}$.', 'من كسري إلى غير حقيقي: اضرب الصحيح في المقام وأضف البسط وأبقِ المقام. $2\\frac{3}{4} = \\frac{2 \\times 4 + 3}{4} = \\frac{11}{4}$.'),
      p('Improper to mixed: divide the numerator by the denominator. The quotient is the whole part and the remainder is the new numerator.', 'من غير حقيقي إلى كسري: اقسم البسط على المقام. الناتج هو الجزء الصحيح والباقي هو البسط الجديد.'),
    ],
    visual: { type: 'fraction-bar', num: 11, den: 4 },
    example: {
      problem: p('Write $\\frac{17}{5}$ as a mixed number.', 'اكتب $\\frac{17}{5}$ على صورة عدد كسري.'),
      steps: [
        p('$17 \\div 5 = 3$ remainder $2$.', '$17 \\div 5 = 3$ والباقي $2$.'),
        p('The whole part is 3 and the fraction is $\\frac{2}{5}$.', 'الجزء الصحيح 3 والكسر $\\frac{2}{5}$.'),
      ],
      result: p('$3\\frac{2}{5}$', '$3\\frac{2}{5}$'),
    },
    why: p('We say "two and a half hours", not "five halves of an hour". Mixed numbers are the natural way to talk about quantities, and improper fractions are the easy way to calculate with them.', 'نقول "ساعتان ونصف" لا "خمسة أنصاف ساعة". الأعداد الكسرية هي الطريقة الطبيعية للحديث عن الكميات، وغير الحقيقية أسهل في الحساب.'),
    tryGen: 'to-improper',
    check: ['to-improper', 'to-mixed', 'convert-choice', 'add-mixed', 'compare-mixed'],
    keywords: p('mixed number improper fraction whole', 'عدد كسري كسر غير حقيقي'),
  }),
  lesson('decimals', {
    minutes: 6,
    explanation: [
      p('Decimals extend place value to the right of the point: tenths, hundredths, thousandths. In 3.47 the 4 is 4 tenths and the 7 is 7 hundredths.', 'الكسور العشرية توسّع القيمة المكانية إلى يمين الفاصلة: أعشار ومئويات وآلاف. في 3.47 الرقم 4 هو 4 أعشار والرقم 7 هو 7 من مئة.'),
      p('To compare decimals, compare digit by digit from the left. **Longer does not mean bigger**: 0.5 is bigger than 0.45 because 5 tenths > 4 tenths.', 'لمقارنة الكسور العشرية قارن رقمًا برقم من اليسار. **الأطول ليس الأكبر**: 0.5 أكبر من 0.45 لأن 5 أعشار > 4 أعشار.'),
      p('Adding zeros at the end does not change the value: $0.5 = 0.50 = 0.500$.', 'إضافة أصفار في آخر العدد العشري لا تغيّر قيمته: $0.5 = 0.50 = 0.500$.'),
    ],
    visual: { type: 'place-value', value: '3.47' },
    example: {
      problem: p('Order from smallest to biggest: 0.7, 0.07, 0.705.', 'رتب من الأصغر إلى الأكبر: 0.7 و 0.07 و 0.705.'),
      steps: [
        p('Give them the same length: 0.700, 0.070, 0.705.', 'اجعلها بالطول نفسه: 0.700 و 0.070 و 0.705.'),
        p('Compare as whole numbers: 70 < 700 < 705.', 'قارنها كأعداد صحيحة: 70 < 700 < 705.'),
      ],
      result: p('0.07, 0.7, 0.705', '0.07 ثم 0.7 ثم 0.705'),
    },
    why: p('Money, measurements and almost every calculator display use decimals.', 'المال والقياسات وشاشات الحاسبات كلها تستخدم الكسور العشرية.'),
    tryGen: 'compare-decimals',
    check: ['place-name', 'expand-decimal', 'compare-decimals', 'order-decimals', 'round-decimal'],
    keywords: p('decimal tenths hundredths point place', 'عشري أعشار مئويات فاصلة'),
  }),
  lesson('decimal-operations', {
    minutes: 7,
    explanation: [
      p('Adding and subtracting: line up the decimal points so each place sits above the same place. Fill gaps with zeros.', 'للجمع والطرح رتّب الفواصل العشرية فوق بعضها بحيث تتقابل الخانات المتشابهة. املأ الفراغات بأصفار.'),
      p('Multiplying: ignore the points, multiply as whole numbers, then put the point back so the answer has as many decimal places as both factors together. $0.3 \\times 0.4 = 0.12$.', 'للضرب: تجاهل الفواصل واضرب كأعداد صحيحة ثم أعد الفاصلة بحيث يكون عدد الخانات العشرية مساويًا لمجموعها في العاملين. $0.3 \\times 0.4 = 0.12$.'),
      p('Dividing: move the point in the divisor until it is a whole number, and move the dividend\'s point the same number of places.', 'للقسمة: حرّك الفاصلة في المقسوم عليه حتى يصبح عددًا صحيحًا، وحرّك فاصلة المقسوم بالعدد نفسه من الخانات.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Find $2.5 \\times 0.6$.', 'أوجد $2.5 \\times 0.6$.'),
      steps: [
        p('Ignore points: $25 \\times 6 = 150$.', 'تجاهل الفواصل: $25 \\times 6 = 150$.'),
        p('There is 1 decimal place in each factor, 2 in total.', 'في كل عامل خانة عشرية واحدة، فالمجموع 2.'),
        p('Put the point back two places from the right: 1.50.', 'ضع الفاصلة بعد خانتين من اليمين: 1.50.'),
      ],
      result: p('$2.5 \\times 0.6 = 1.5$', '$2.5 \\times 0.6 = 1.5$'),
    },
    why: p('Shopping totals, change, fuel and measurements all need decimal arithmetic.', 'مجاميع التسوق والباقي والوقود والقياسات كلها تحتاج حسابًا عشريًا.'),
    tryGen: 'add-sub',
    check: ['add-sub', 'multiply-decimals', 'divide-decimals', 'shopping-story', 'shift-places'],
    keywords: p('decimal add subtract multiply divide point', 'عشري جمع طرح ضرب قسمة فاصلة'),
  }),
  lesson('fraction-decimal', {
    minutes: 6,
    explanation: [
      p('A fraction is a division: $\\frac{3}{4}$ means $3 \\div 4 = 0.75$.', 'الكسر عملية قسمة: $\\frac{3}{4}$ تعني $3 \\div 4 = 0.75$.'),
      p('A decimal becomes a fraction by reading its place value: $0.35 = \\frac{35}{100} = \\frac{7}{20}$. Then simplify.', 'يتحول العدد العشري إلى كسر بقراءة قيمته المكانية: $0.35 = \\frac{35}{100} = \\frac{7}{20}$. ثم بسّط.'),
      p('Some fractions never end: $\\frac{1}{3} = 0.333\\ldots$ (repeating). Memorise the common ones: $\\frac{1}{2} = 0.5$, $\\frac{1}{4} = 0.25$, $\\frac{1}{5} = 0.2$, $\\frac{1}{8} = 0.125$.', 'بعض الكسور لا تنتهي: $\\frac{1}{3} = 0.333\\ldots$ (دوري). احفظ الشائعة: $\\frac{1}{2} = 0.5$ و$\\frac{1}{4} = 0.25$ و$\\frac{1}{5} = 0.2$ و$\\frac{1}{8} = 0.125$.'),
    ],
    visual: { type: 'number-line', min: 0, max: 1, step: 0.25, marks: [0.25, 0.5, 0.75] },
    example: {
      problem: p('Write $\\frac{7}{8}$ as a decimal.', 'اكتب $\\frac{7}{8}$ على صورة عدد عشري.'),
      steps: [
        p('Divide: $7 \\div 8$.', 'اقسم: $7 \\div 8$.'),
        p('$8$ goes into $7.000$ exactly $0.875$ times.', 'العدد 8 يدخل في $7.000$ تمامًا $0.875$ مرة.'),
      ],
      result: p('$\\frac{7}{8} = 0.875$', '$\\frac{7}{8} = 0.875$'),
    },
    why: p('Being able to switch between fractions, decimals and percentages lets you choose the easiest form for each problem.', 'القدرة على التبديل بين الكسور والأعداد العشرية والنسب تتيح لك اختيار الصيغة الأسهل لكل مسألة.'),
    tryGen: 'frac-to-dec',
    check: ['frac-to-dec', 'dec-to-frac', 'same-value', 'match-forms', 'repeating'],
    keywords: p('fraction decimal convert repeating', 'كسر عشري تحويل دوري'),
  }),
];
