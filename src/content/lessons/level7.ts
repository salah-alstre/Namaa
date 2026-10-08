import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL7_LESSONS: Lesson[] = [
  lesson('quadratics', {
    minutes: 10,
    explanation: [
      p('A quadratic has an $x^2$ term: $ax^2 + bx + c = 0$. Its graph is a U-shaped curve (a parabola) and it can have 0, 1 or 2 solutions.', 'المعادلة التربيعية فيها حد $x^2$: $ax^2 + bx + c = 0$. ورسمها منحنى على شكل U (قطع مكافئ) ولها 0 أو 1 أو 2 من الحلول.'),
      p('If it factors, set each factor to zero: $(x-2)(x-5) = 0$ gives $x = 2$ or $x = 5$. If it is $x^2 = k$, take $\\pm\\sqrt{k}$.', 'إن أمكن تحليلها ساوِ كل عامل بالصفر: $(x-2)(x-5) = 0$ تعطي $x = 2$ أو $x = 5$. وإذا كانت $x^2 = k$ فخذ $\\pm\\sqrt{k}$.'),
      p('The general formula always works: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. The **discriminant** $b^2 - 4ac$ tells you how many solutions: positive → 2, zero → 1, negative → none.', 'القانون العام يصلح دائمًا: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. و**المميّز** $b^2 - 4ac$ يخبرك بعدد الحلول: موجب ← حلان، صفر ← حل واحد، سالب ← لا حل.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Solve $x^2 - 7x + 10 = 0$.', 'حلّ $x^2 - 7x + 10 = 0$.'),
      steps: [
        p('Two numbers with product 10 and sum $-7$: $-2$ and $-5$.', 'عددان حاصل ضربهما 10 ومجموعهما $-7$: هما $-2$ و $-5$.'),
        p('$(x - 2)(x - 5) = 0$, so $x = 2$ or $x = 5$.', '$(x - 2)(x - 5) = 0$ إذن $x = 2$ أو $x = 5$.'),
      ],
      result: p('$x = 2$ or $x = 5$', '$x = 2$ أو $x = 5$'),
    },
    why: p('Quadratics describe thrown objects, areas and many optimisation problems.', 'المعادلات التربيعية تصف الأجسام المقذوفة والمساحات والكثير من مسائل الأمثلة.'),
    tryGen: 'factored',
    check: ['factored', 'square-root', 'standard-form', 'discriminant', 'how-many-roots', 'rectangle'],
    keywords: p('quadratic parabola discriminant roots formula', 'تربيعية قطع مكافئ مميز جذور قانون'),
  }),
  lesson('systems', {
    minutes: 9,
    explanation: [
      p('A system is two equations with two unknowns that must be true at the same time. The answer is a pair $(x, y)$, the point where the two lines cross.', 'الجملة معادلتان بمجهولين يجب أن تتحققا معًا. وجوابها زوج $(x, y)$ وهو نقطة تقاطع المستقيمين.'),
      p('**Substitution:** solve one equation for a letter, then put it into the other. **Elimination:** add or subtract the equations to cancel one letter.', '**التعويض:** حلّ إحدى المعادلتين لأحد المجهولين ثم عوّضه في الأخرى. **الحذف:** اجمع المعادلتين أو اطرحهما لحذف أحد المجهولين.'),
      p('Always check the pair in **both** equations.', 'تحقق دائمًا من الزوج في **المعادلتين معًا**.'),
    ],
    visual: { type: 'line-graph', m: 1, b: 1 },
    example: {
      problem: p('Solve $x + y = 10$ and $x - y = 4$.', 'حلّ $x + y = 10$ و $x - y = 4$.'),
      steps: [
        p('Add the equations: $2x = 14$, so $x = 7$.', 'اجمع المعادلتين: $2x = 14$ إذن $x = 7$.'),
        p('Then $y = 10 - 7 = 3$. Check: $7 - 3 = 4$ ✓', 'ثم $y = 10 - 7 = 3$. تحقق: $7 - 3 = 4$ ✓'),
      ],
      result: p('$(x, y) = (7, 3)$', '$(x, y) = (7, 3)$'),
    },
    why: p('Whenever two facts constrain two unknowns (prices, ages, mixtures), you have a system.', 'كلما قيّدت حقيقتان مجهولين (أسعار أو أعمار أو خلطات) فأنت أمام جملة معادلات.'),
    tryGen: 'elimination',
    check: ['elimination', 'substitution', 'tickets', 'is-solution', 'which-pair'],
    keywords: p('system equations simultaneous elimination substitution', 'جملة معادلات حذف تعويض'),
  }),
  lesson('statistics', {
    minutes: 8,
    explanation: [
      p('Statistics summarises data. The centre: **mean**, **median**, **mode**. The spread: **range** (max − min).', 'الإحصاء يلخّص البيانات. المركز: **المتوسط** و**الوسيط** و**المنوال**. والتشتت: **المدى** (الأكبر − الأصغر).'),
      p('An **outlier** is a value far from the others. It drags the mean but barely moves the median, so for skewed data (like salaries) the median is more honest.', '**القيمة الشاذة** بعيدة عن البقية. تسحب المتوسط لكنها بالكاد تحرّك الوسيط، لذلك في البيانات المائلة (كالرواتب) يكون الوسيط أصدق.'),
      p('If you know the mean of $n$ values, the total is $\\text{mean} \\times n$. That lets you find a missing value.', 'إذا عرفت متوسط $n$ من القيم فالمجموع هو $\\text{المتوسط} \\times n$. وبذلك تجد القيمة المفقودة.'),
    ],
    visual: { type: 'bars', values: [{ label: '1', value: 3 }, { label: '2', value: 5 }, { label: '3', value: 5 }, { label: '4', value: 8 }, { label: '5', value: 20 }] },
    visualCaption: p('The 20 is an outlier.', 'العدد 20 قيمة شاذة.'),
    example: {
      problem: p('Four test scores average 78. A fifth score of 93 is added. What is the new mean?', 'متوسط أربع درجات 78. أُضيفت درجة خامسة 93. ما المتوسط الجديد؟'),
      steps: [
        p('Old total: $78 \\times 4 = 312$.', 'المجموع القديم: $78 \\times 4 = 312$.'),
        p('New total: $312 + 93 = 405$; mean $= 405 \\div 5 = 81$.', 'المجموع الجديد: $312 + 93 = 405$ والمتوسط $= 405 \\div 5 = 81$.'),
      ],
      result: p('81', '81'),
    },
    why: p('Understanding data protects you from misleading averages in news and ads.', 'فهم البيانات يحميك من المتوسطات المضللة في الأخبار والإعلانات.'),
    tryGen: 'mean',
    check: ['mean', 'median', 'mode', 'range', 'missing-value', 'outlier', 'mean-vs-median'],
    keywords: p('statistics mean median mode range outlier data', 'إحصاء متوسط وسيط منوال مدى قيمة شاذة بيانات'),
  }),
  lesson('probability', {
    minutes: 9,
    explanation: [
      p('Probability measures chance from 0 (impossible) to 1 (certain): $P = \\frac{\\text{favourable outcomes}}{\\text{all outcomes}}$. A die shows an even number with $P = \\frac{3}{6} = \\frac{1}{2}$.', 'الاحتمال يقيس الفرصة من 0 (مستحيل) إلى 1 (مؤكد): $P = \\frac{\\text{النتائج المرغوبة}}{\\text{كل النتائج}}$. احتمال ظهور عدد زوجي على حجر نرد $P = \\frac{3}{6} = \\frac{1}{2}$.'),
      p('Complement: $P(\\text{not } A) = 1 - P(A)$. For independent events, **and** means multiply: two heads in a row is $\\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}$. For exclusive events, **or** means add.', 'المتمم: $P(\\text{ليس } A) = 1 - P(A)$. للحوادث المستقلة **و** تعني الضرب: صورتان متتاليتان $\\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}$. وللحوادث المتنافية **أو** تعني الجمع.'),
      p('Past results do not change the next one: after five heads, the coin is still 50/50.', 'النتائج السابقة لا تغيّر القادمة: بعد خمس صور تبقى العملة 50/50.'),
    ],
    visual: { type: 'grid', rows: 2, cols: 3, shaded: 3 },
    visualCaption: p('3 of 6 faces are even.', '3 من 6 أوجه زوجية.'),
    example: {
      problem: p('A bag has 3 red and 5 blue marbles. What is the chance of drawing red?', 'كيس فيه 3 كرات حمراء و5 زرقاء. ما احتمال سحب كرة حمراء؟'),
      steps: [
        p('Favourable: 3. Total: $3 + 5 = 8$.', 'المرغوب: 3. الكل: $3 + 5 = 8$.'),
        p('$P = \\frac{3}{8}$.', '$P = \\frac{3}{8}$.'),
      ],
      result: p('$\\frac{3}{8} = 0.375 = 37.5\\%$', '$\\frac{3}{8} = 0.375 = 37.5\\%$'),
    },
    why: p('Probability helps you judge risk, odds, forecasts and games fairly.', 'الاحتمال يساعدك على تقدير المخاطر والفرص والتوقعات والألعاب بإنصاف.'),
    tryGen: 'simple',
    check: ['simple', 'dice', 'complement', 'either-or', 'and-independent', 'true-false'],
    keywords: p('probability chance dice coin independent complement', 'احتمال فرصة نرد عملة مستقل متمم'),
  }),
  lesson('trigonometry', {
    minutes: 10,
    explanation: [
      p('In a right triangle, pick an angle $\\theta$. The side opposite it is **opposite**, the side next to it (not the hypotenuse) is **adjacent**.', 'في مثلث قائم اختر زاوية $\\theta$. الضلع المقابل لها هو **المقابل** والضلع المجاور لها (غير الوتر) هو **المجاور**.'),
      p('**SOH-CAH-TOA:** $\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}}$, $\\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}}$, $\\tan\\theta = \\frac{\\text{opp}}{\\text{adj}}$.', '**SOH-CAH-TOA:** $\\sin\\theta = \\frac{\\text{مقابل}}{\\text{وتر}}$ و $\\cos\\theta = \\frac{\\text{مجاور}}{\\text{وتر}}$ و $\\tan\\theta = \\frac{\\text{مقابل}}{\\text{مجاور}}$.'),
      p('Good values to remember: $\\sin 30° = 0.5$, $\\cos 60° = 0.5$, $\\tan 45° = 1$. Use the ratio that contains the side you know and the side you want.', 'قيم يجب حفظها: $\\sin 30° = 0.5$ و $\\cos 60° = 0.5$ و $\\tan 45° = 1$. استخدم النسبة التي تحوي الضلع المعلوم والضلع المطلوب.'),
    ],
    visual: { type: 'shape', shape: 'right-triangle', labels: ['opp', 'adj', 'hyp'] },
    example: {
      problem: p('A ladder 10 m long makes a 30° angle with the ground. How high does it reach?', 'سلّم طوله 10 م يصنع زاوية 30° مع الأرض. ما ارتفاعه على الجدار؟'),
      steps: [
        p('Height is opposite the angle, ladder is the hypotenuse: use sine.', 'الارتفاع مقابل للزاوية والسلّم هو الوتر: نستخدم الجيب.'),
        p('$\\text{height} = 10 \\times \\sin 30° = 10 \\times 0.5 = 5$.', '$\\text{الارتفاع} = 10 \\times \\sin 30° = 10 \\times 0.5 = 5$.'),
      ],
      result: p('5 m', '5 م'),
    },
    why: p('Trigonometry measures heights and distances you cannot reach: buildings, slopes, waves.', 'حساب المثلثات يقيس ارتفاعات ومسافات لا يمكن الوصول إليها: المباني والمنحدرات والموجات.'),
    tryGen: 'ratio',
    check: ['ratio', 'pick-ratio', 'special-angle', 'ladder', 'find-side', 'soh-cah-toa', 'true-false'],
    keywords: p('trigonometry sine cosine tangent SOH CAH TOA', 'حساب المثلثات جيب جيب التمام ظل'),
  }),
  lesson('sequences', {
    minutes: 8,
    explanation: [
      p('A sequence is a list of numbers following a rule. **Arithmetic**: add the same step each time (3, 7, 11, 15; step 4). **Geometric**: multiply by the same ratio each time (2, 6, 18, 54; ratio 3).', 'المتتالية قائمة أعداد تتبع قاعدة. **الحسابية**: نضيف الخطوة نفسها كل مرة (3 و7 و11 و15؛ الخطوة 4). **الهندسية**: نضرب في النسبة نفسها كل مرة (2 و6 و18 و54؛ النسبة 3).'),
      p('Arithmetic nth term: $a_n = a_1 + (n-1)d$. Geometric: $a_n = a_1 \\cdot r^{n-1}$.', 'الحد النوني للحسابية: $a_n = a_1 + (n-1)d$. وللهندسية: $a_n = a_1 \\cdot r^{n-1}$.'),
      p('Sum of an arithmetic series: $S_n = \\frac{n}{2}(a_1 + a_n)$. Gauss added 1 to 100 as 50 pairs of 101.', 'مجموع متتالية حسابية: $S_n = \\frac{n}{2}(a_1 + a_n)$. جمع غاوس الأعداد من 1 إلى 100 على أنها 50 زوجًا مجموع كل منها 101.'),
    ],
    visual: { type: 'bars', values: [{ label: '1', value: 3 }, { label: '2', value: 7 }, { label: '3', value: 11 }, { label: '4', value: 15 }] },
    example: {
      problem: p('Find the 10th term of 5, 8, 11, 14, …', 'أوجد الحد العاشر في 5 و8 و11 و14 …'),
      steps: [
        p('First term 5, step $d = 3$.', 'الحد الأول 5 والخطوة $d = 3$.'),
        p('$a_{10} = 5 + 9 \\times 3 = 32$.', '$a_{10} = 5 + 9 \\times 3 = 32$.'),
      ],
      result: p('32', '32'),
    },
    why: p('Savings plans, patterns, growth and repayment schedules follow sequences.', 'خطط الادخار والأنماط والنمو وجداول السداد كلها تتبع متتاليات.'),
    tryGen: 'next-term',
    check: ['next-term', 'common-step', 'nth-term', 'geometric-next', 'series-sum', 'which-rule', 'is-arithmetic'],
    keywords: p('sequence arithmetic geometric nth term series', 'متتالية حسابية هندسية الحد النوني مجموع'),
  }),
  lesson('logs-scientific', {
    minutes: 10,
    explanation: [
      p('**Scientific notation** writes big or small numbers as $a \\times 10^n$ with $1 \\le a < 10$. 45 000 is $4.5 \\times 10^4$; 0.0032 is $3.2 \\times 10^{-3}$.', '**الصيغة العلمية** تكتب الأعداد الكبيرة أو الصغيرة بالشكل $a \\times 10^n$ حيث $1 \\le a < 10$. العدد 45 000 هو $4.5 \\times 10^4$ والعدد 0.0032 هو $3.2 \\times 10^{-3}$.'),
      p('A **logarithm** answers: "what exponent?" $\\log_{10} 1000 = 3$ because $10^3 = 1000$. In general $\\log_b x = y$ means $b^y = x$.', '**اللوغاريتم** يجيب عن سؤال: "ما الأس؟" $\\log_{10} 1000 = 3$ لأن $10^3 = 1000$. وبشكل عام $\\log_b x = y$ تعني $b^y = x$.'),
      p('Log rules: $\\log(xy) = \\log x + \\log y$, $\\log\\frac{x}{y} = \\log x - \\log y$, $\\log x^k = k\\log x$. Logs turn multiplying into adding.', 'قواعد اللوغاريتم: $\\log(xy) = \\log x + \\log y$ و $\\log\\frac{x}{y} = \\log x - \\log y$ و $\\log x^k = k\\log x$. فاللوغاريتم يحوّل الضرب إلى جمع.'),
    ],
    visual: { type: 'bars', values: [{ label: '10¹', value: 10 }, { label: '10²', value: 100 }, { label: '10³', value: 1000 }] },
    example: {
      problem: p('Multiply $(3 \\times 10^4)(2 \\times 10^5)$.', 'اضرب $(3 \\times 10^4)(2 \\times 10^5)$.'),
      steps: [
        p('Multiply the front numbers: $3 \\times 2 = 6$.', 'اضرب الأعداد الأمامية: $3 \\times 2 = 6$.'),
        p('Add the exponents: $10^{4+5} = 10^9$.', 'اجمع الأسس: $10^{4+5} = 10^9$.'),
      ],
      result: p('$6 \\times 10^9$', '$6 \\times 10^9$'),
    },
    why: p('Scientists use these to handle the size of atoms and galaxies, and logs measure earthquakes, sound and acidity.', 'يستخدمها العلماء للتعامل مع حجم الذرات والمجرات، وتقيس اللوغاريتمات الزلازل والصوت والحموضة.'),
    tryGen: 'to-scientific',
    check: ['to-scientific', 'exponent-blank', 'from-scientific', 'compare-sci', 'multiply-sci', 'log-value', 'log-to-power', 'log-rules'],
    keywords: p('logarithm scientific notation exponent powers of ten', 'لوغاريتم صيغة علمية أس قوى العشرة'),
  }),
];
