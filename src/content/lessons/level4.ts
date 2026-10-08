import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL4_LESSONS: Lesson[] = [
  lesson('order-of-operations', {
    minutes: 6,
    explanation: [
      p('When an expression has several operations, everyone must get the same answer, so we use an agreed order: Brackets first, then Powers, then Multiplication and Division (left to right), then Addition and Subtraction (left to right).', 'عندما يحتوي تعبير على عدة عمليات يجب أن يصل الجميع إلى الجواب نفسه، لذا نتفق على ترتيب: الأقواس أولًا ثم القوى ثم الضرب والقسمة (من اليسار إلى اليمين) ثم الجمع والطرح (من اليسار إلى اليمين).'),
      p('Multiplication does **not** always come before division. They have equal rank, so go left to right. The same goes for addition and subtraction.', 'الضرب **ليس** دائمًا قبل القسمة. لهما المرتبة نفسها فنسير من اليسار إلى اليمين. وكذلك الجمع والطرح.'),
      p('Work one step at a time and rewrite the expression after each step. It is slower, but you will not lose track.', 'اعمل خطوة بخطوة وأعد كتابة التعبير بعد كل خطوة. هذا أبطأ قليلًا لكنك لن تضيع.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Evaluate $2 + 3 \\times (8 - 4)^2$.', 'احسب $2 + 3 \\times (8 - 4)^2$.'),
      steps: [
        p('Brackets: $8 - 4 = 4$, so $2 + 3 \\times 4^2$.', 'الأقواس: $8 - 4 = 4$ فيصبح $2 + 3 \\times 4^2$.'),
        p('Powers: $4^2 = 16$, so $2 + 3 \\times 16$.', 'القوى: $4^2 = 16$ فيصبح $2 + 3 \\times 16$.'),
        p('Multiply: $3 \\times 16 = 48$, then add: $2 + 48 = 50$.', 'الضرب: $3 \\times 16 = 48$ ثم الجمع: $2 + 48 = 50$.'),
      ],
      result: p('50', '50'),
    },
    why: p('Without a shared order, the same line of maths would have many answers. Calculators, spreadsheets and code all follow it.', 'من دون ترتيب متفق عليه سيكون للسطر نفسه عدة أجوبة. الآلات الحاسبة والجداول والبرمجة كلها تتبعه.'),
    tryGen: 'evaluate',
    check: ['evaluate', 'first-step', 'true-false', 'missing-number', 'compare-values'],
    keywords: p('order of operations BODMAS PEMDAS brackets', 'أولوية العمليات الأقواس الترتيب'),
  }),
  lesson('negative-numbers', {
    minutes: 8,
    explanation: [
      p('Negative numbers are below zero: temperatures in winter, debts, floors below ground. On the number line they sit to the left of zero, and the further left, the smaller.', 'الأعداد السالبة أقل من الصفر: درجات الحرارة شتاءً والديون والطوابق تحت الأرض. على خط الأعداد تقع يسار الصفر وكلما ابتعدت يسارًا صغرت.'),
      p('Adding a negative is like subtracting: $5 + (-3) = 2$. Subtracting a negative is like adding: $5 - (-3) = 8$.', 'جمع عدد سالب مثل الطرح: $5 + (-3) = 2$. وطرح عدد سالب مثل الجمع: $5 - (-3) = 8$.'),
      p('Multiplying or dividing: **same signs give positive, different signs give negative.** $(-4)\\times(-3) = 12$ but $(-4)\\times 3 = -12$.', 'في الضرب والقسمة: **الإشارتان المتشابهتان تعطيان موجبًا والمختلفتان تعطيان سالبًا.** $(-4)\\times(-3) = 12$ لكن $(-4)\\times 3 = -12$.'),
    ],
    visual: { type: 'number-line', min: -6, max: 6, step: 1, marks: [-3, 2], jump: { from: 2, to: -3 } },
    visualCaption: p('$2 - 5 = -3$: five steps left from 2.', '$2 - 5 = -3$: خمس خطوات يسارًا من 2.'),
    example: {
      problem: p('Calculate $-7 + 4 - (-2)$.', 'احسب $-7 + 4 - (-2)$.'),
      steps: [
        p('Subtracting a negative becomes adding: $-7 + 4 + 2$.', 'طرح السالب يصبح جمعًا: $-7 + 4 + 2$.'),
        p('$-7 + 4 = -3$, then $-3 + 2 = -1$.', '$-7 + 4 = -3$ ثم $-3 + 2 = -1$.'),
      ],
      result: p('$-1$', '$-1$'),
    },
    why: p('Money owed, temperatures, altitude and later algebra all need numbers below zero.', 'الديون ودرجات الحرارة والارتفاع والجبر لاحقًا كلها تحتاج أعدادًا أقل من الصفر.'),
    tryGen: 'add-subtract',
    check: ['add-subtract', 'multiply-divide', 'order-numbers', 'compare', 'sign-rules'],
    keywords: p('negative numbers integers sign minus temperature', 'أعداد سالبة صحيحة إشارة ناقص حرارة'),
  }),
  lesson('exponents', {
    minutes: 7,
    explanation: [
      p('An exponent says how many times to multiply a number by itself. $2^4 = 2 \\times 2 \\times 2 \\times 2 = 16$. The big number is the **base**, the small raised number is the **exponent**.', 'الأس يخبرك كم مرة تضرب العدد في نفسه. $2^4 = 2 \\times 2 \\times 2 \\times 2 = 16$. العدد الكبير هو **الأساس** والعدد الصغير المرفوع هو **الأس**.'),
      p('Special cases: $a^1 = a$ and $a^0 = 1$ (for $a \\ne 0$). Also $2^3$ is not $2 \\times 3$; it is $2 \\times 2 \\times 2 = 8$.', 'حالات خاصة: $a^1 = a$ و $a^0 = 1$ (عندما $a \\ne 0$). وانتبه: $2^3$ ليست $2 \\times 3$ بل $2 \\times 2 \\times 2 = 8$.'),
      p('Laws: same base multiplied → add exponents, $a^m \\cdot a^n = a^{m+n}$. Same base divided → subtract, $a^m \\div a^n = a^{m-n}$. A power of a power → multiply, $(a^m)^n = a^{mn}$.', 'القوانين: الضرب بالأساس نفسه ← اجمع الأسس $a^m \\cdot a^n = a^{m+n}$. القسمة بالأساس نفسه ← اطرح $a^m \\div a^n = a^{m-n}$. قوة قوة ← اضرب $(a^m)^n = a^{mn}$.'),
    ],
    visual: { type: 'bars', values: [{ label: '2¹', value: 2 }, { label: '2²', value: 4 }, { label: '2³', value: 8 }, { label: '2⁴', value: 16 }] },
    visualCaption: p('Powers of 2 double each time.', 'قوى العدد 2 تتضاعف في كل مرة.'),
    example: {
      problem: p('Simplify $3^2 \\cdot 3^4$ and evaluate $(-2)^3$.', 'بسّط $3^2 \\cdot 3^4$ واحسب $(-2)^3$.'),
      steps: [
        p('Same base, add exponents: $3^{2+4} = 3^6 = 729$.', 'الأساس نفسه فنجمع الأسس: $3^{2+4} = 3^6 = 729$.'),
        p('$(-2)^3 = (-2)(-2)(-2) = 4 \\times (-2) = -8$.', '$(-2)^3 = (-2)(-2)(-2) = 4 \\times (-2) = -8$.'),
      ],
      result: p('729 and $-8$', '729 و $-8$'),
    },
    why: p('Growth, areas, volumes, compound interest and scientific numbers are all written with powers.', 'النمو والمساحات والحجوم والفائدة المركبة والأعداد العلمية كلها تُكتب بالقوى.'),
    tryGen: 'evaluate',
    check: ['evaluate', 'laws', 'compare-powers', 'find-exponent', 'true-false'],
    keywords: p('exponent power index square cube laws', 'أس قوة أساس مربع مكعب قوانين'),
  }),
  lesson('square-roots', {
    minutes: 6,
    explanation: [
      p('A square root undoes squaring. $\\sqrt{49} = 7$ because $7^2 = 49$. Numbers like 1, 4, 9, 16, 25, 36 are **perfect squares**.', 'الجذر التربيعي يعكس التربيع. $\\sqrt{49} = 7$ لأن $7^2 = 49$. الأعداد 1 و4 و9 و16 و25 و36 **مربعات كاملة**.'),
      p('For other numbers, find which two perfect squares it sits between. $\\sqrt{40}$ is between $\\sqrt{36} = 6$ and $\\sqrt{49} = 7$, so it is a bit above 6.', 'في الأعداد الأخرى ابحث عن مربعين كاملين تقع بينهما. $\\sqrt{40}$ بين $\\sqrt{36} = 6$ و $\\sqrt{49} = 7$ فهي أكبر قليلًا من 6.'),
      p('A square with area $A$ has side $\\sqrt{A}$. Careful: $\\sqrt{9+16}$ is $\\sqrt{25} = 5$, **not** $3 + 4$.', 'مربع مساحته $A$ طول ضلعه $\\sqrt{A}$. انتبه: $\\sqrt{9+16}$ تساوي $\\sqrt{25} = 5$ **وليس** $3 + 4$.'),
    ],
    visual: { type: 'grid', rows: 5, cols: 5, shaded: 25 },
    visualCaption: p('Area 25, side $\\sqrt{25} = 5$.', 'المساحة 25 وطول الضلع $\\sqrt{25} = 5$.'),
    example: {
      problem: p('Between which two whole numbers is $\\sqrt{70}$?', 'بين أي عددين صحيحين يقع $\\sqrt{70}$؟'),
      steps: [
        p('$8^2 = 64$ and $9^2 = 81$.', '$8^2 = 64$ و $9^2 = 81$.'),
        p('70 is between 64 and 81.', 'العدد 70 بين 64 و 81.'),
      ],
      result: p('$\\sqrt{70}$ is between 8 and 9 (closer to 8).', '$\\sqrt{70}$ بين 8 و 9 (أقرب إلى 8).'),
    },
    why: p('Square roots appear whenever you go from an area back to a length, and in the Pythagorean theorem.', 'الجذور تظهر كلما انتقلنا من المساحة إلى الطول وفي نظرية فيثاغورس.'),
    tryGen: 'perfect',
    check: ['perfect', 'between', 'fill-root', 'order-roots', 'square-side'],
    keywords: p('square root perfect square radical', 'جذر تربيعي مربع كامل'),
  }),
  lesson('factors-multiples', {
    minutes: 7,
    explanation: [
      p('**Factors** of a number divide it exactly. Factors of 12: 1, 2, 3, 4, 6, 12. **Multiples** are what you get in its times table: 12, 24, 36, …', '**عوامل** العدد هي الأعداد التي تقسمه تمامًا. عوامل 12: 1 و2 و3 و4 و6 و12. أما **المضاعفات** فهي جدول ضربه: 12 و24 و36 …'),
      p('The **GCF** (greatest common factor) is the biggest factor two numbers share. The **LCM** (least common multiple) is the smallest number both divide into. GCF of 12 and 18 is 6, LCM is 36.', '**القاسم المشترك الأكبر** هو أكبر عامل يشترك فيه عددان. و**المضاعف المشترك الأصغر** هو أصغر عدد يقبل القسمة عليهما. القاسم المشترك الأكبر للعددين 12 و18 هو 6 والمضاعف المشترك الأصغر 36.'),
      p('Divisibility tricks: by 2 if it ends in an even digit; by 3 if the digits add to a multiple of 3; by 5 if it ends in 0 or 5; by 10 if it ends in 0.', 'حيل قابلية القسمة: على 2 إذا انتهى برقم زوجي؛ على 3 إذا كان مجموع أرقامه من مضاعفات 3؛ على 5 إذا انتهى بـ 0 أو 5؛ على 10 إذا انتهى بـ 0.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Find the GCF and LCM of 8 and 12.', 'أوجد القاسم المشترك الأكبر والمضاعف المشترك الأصغر للعددين 8 و12.'),
      steps: [
        p('Factors of 8: 1, 2, 4, 8. Factors of 12: 1, 2, 3, 4, 6, 12. Largest shared: 4.', 'عوامل 8: 1 و2 و4 و8. عوامل 12: 1 و2 و3 و4 و6 و12. أكبر مشترك: 4.'),
        p('Multiples of 8: 8, 16, 24. 24 is also a multiple of 12.', 'مضاعفات 8: 8 و16 و24. والعدد 24 مضاعف للعدد 12 أيضًا.'),
      ],
      result: p('GCF = 4, LCM = 24', 'القاسم = 4 والمضاعف = 24'),
    },
    why: p('GCF simplifies fractions; LCM gives common denominators and tells you when repeating events line up.', 'القاسم المشترك يبسّط الكسور، والمضاعف المشترك يعطي المقامات الموحدة ويحدد متى تتزامن الأحداث المتكررة.'),
    tryGen: 'list-factors',
    check: ['list-factors', 'gcf-lcm', 'multiples', 'divisibility', 'word-gcd'],
    keywords: p('factors multiples GCF LCM divisibility', 'عوامل مضاعفات قاسم مشترك قابلية القسمة'),
  }),
  lesson('primes', {
    minutes: 6,
    explanation: [
      p('A **prime** number has exactly two factors: 1 and itself. 2, 3, 5, 7, 11, 13 are prime. 1 is not prime, and 2 is the only even prime.', 'العدد **الأولي** له عاملان فقط: 1 ونفسه. 2 و3 و5 و7 و11 و13 أولية. العدد 1 ليس أوليًا و2 هو العدد الأولي الزوجي الوحيد.'),
      p('To test a number, try dividing by the primes 2, 3, 5, 7… up to its square root. If none works, it is prime.', 'لاختبار عدد جرّب القسمة على الأعداد الأولية 2 و3 و5 و7… حتى جذره التربيعي. إن لم ينجح أي منها فهو أولي.'),
      p('Every whole number above 1 is a product of primes in exactly one way. Use a factor tree: $60 = 2 \\times 2 \\times 3 \\times 5 = 2^2 \\times 3 \\times 5$.', 'كل عدد صحيح أكبر من 1 هو حاصل ضرب أعداد أولية بطريقة واحدة فقط. استخدم شجرة العوامل: $60 = 2 \\times 2 \\times 3 \\times 5 = 2^2 \\times 3 \\times 5$.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Write 84 as a product of primes.', 'اكتب 84 كحاصل ضرب أعداد أولية.'),
      steps: [
        p('$84 = 2 \\times 42$, and $42 = 2 \\times 21$.', '$84 = 2 \\times 42$ و $42 = 2 \\times 21$.'),
        p('$21 = 3 \\times 7$. All of 2, 2, 3, 7 are prime.', '$21 = 3 \\times 7$. والأعداد 2 و2 و3 و7 كلها أولية.'),
      ],
      result: p('$84 = 2^2 \\times 3 \\times 7$', '$84 = 2^2 \\times 3 \\times 7$'),
    },
    why: p('Primes are the building blocks of numbers. They help with GCF, LCM, simplifying and even with secure encryption.', 'الأعداد الأولية هي لبنات الأعداد. تفيد في القاسم والمضاعف والتبسيط وحتى في التشفير الآمن.'),
    tryGen: 'is-prime',
    check: ['is-prime', 'prime-check-tf', 'prime-factorization', 'count-primes', 'match-type'],
    keywords: p('prime composite factor tree factorization', 'أولي مركب شجرة العوامل تحليل'),
  }),
  lesson('expressions', {
    minutes: 7,
    explanation: [
      p('A letter stands for a number we do not know yet or one that can change. In $3x + 2$, $x$ is a **variable**, 3 is the **coefficient**, and 2 is a **constant**.', 'الحرف يمثل عددًا لا نعرفه بعد أو عددًا يتغير. في $3x + 2$ الحرف $x$ هو **المتغير** والعدد 3 هو **المعامل** والعدد 2 **ثابت**.'),
      p('To **substitute**, replace the letter with its value and calculate. If $x = 4$, then $3x + 2 = 3(4) + 2 = 14$. Note that $3x$ means $3 \\times x$.', '**للتعويض** استبدل الحرف بقيمته واحسب. إذا كانت $x = 4$ فإن $3x + 2 = 3(4) + 2 = 14$. لاحظ أن $3x$ تعني $3 \\times x$.'),
      p('**Like terms** have the same letter part and can be combined: $5x + 2x = 7x$. But $5x + 2$ cannot be combined; they are different kinds of things.', '**الحدود المتشابهة** لها الجزء الحرفي نفسه ويمكن جمعها: $5x + 2x = 7x$. لكن $5x + 2$ لا تُجمع لأنهما من نوعين مختلفين.'),
    ],
    visual: { type: 'balance', left: '3x + 2', right: '14' },
    example: {
      problem: p('Write "five more than twice a number" and evaluate it for $n = 6$.', 'اكتب "خمسة أكثر من ضعف عدد" واحسبها عندما $n = 6$.'),
      steps: [
        p('Twice a number: $2n$. Five more: $2n + 5$.', 'ضعف العدد: $2n$. وخمسة أكثر: $2n + 5$.'),
        p('Substitute: $2(6) + 5 = 17$.', 'بالتعويض: $2(6) + 5 = 17$.'),
      ],
      result: p('$2n + 5$, which is 17 when $n = 6$', '$2n + 5$ وتساوي 17 عندما $n = 6$'),
    },
    why: p('Expressions are how we describe rules that work for any number, the first step into algebra.', 'التعابير الجبرية هي طريقتنا لوصف قواعد تصلح لأي عدد، وهي الخطوة الأولى في الجبر.'),
    tryGen: 'substitute',
    check: ['substitute', 'translate-words', 'like-terms', 'perimeter-expression'],
    keywords: p('expression variable coefficient substitute like terms', 'تعبير جبري متغير معامل تعويض حدود متشابهة'),
  }),
];
