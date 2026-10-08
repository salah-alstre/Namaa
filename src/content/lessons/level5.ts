import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL5_LESSONS: Lesson[] = [
  lesson('one-step-equations', {
    minutes: 6,
    explanation: [
      p('An equation is a balance: both sides are equal. To find the unknown, do the **opposite** operation to both sides so the balance stays level.', 'المعادلة ميزان: الطرفان متساويان. لإيجاد المجهول نفّذ العملية **العكسية** على الطرفين معًا ليبقى الميزان متوازنًا.'),
      p('Addition is undone by subtraction, and multiplication by division. $x + 5 = 12$ → subtract 5 from both sides → $x = 7$. $3x = 12$ → divide both sides by 3 → $x = 4$.', 'الجمع يُلغيه الطرح والضرب تُلغيه القسمة. $x + 5 = 12$ ← اطرح 5 من الطرفين ← $x = 7$. و $3x = 12$ ← اقسم الطرفين على 3 ← $x = 4$.'),
      p('Always check: put your answer back into the equation. If both sides match, you are right.', 'تحقق دائمًا: ضع جوابك في المعادلة. إذا تساوى الطرفان فجوابك صحيح.'),
    ],
    visual: { type: 'balance', left: 'x + 5', right: '12' },
    visualCaption: p('Remove 5 from both sides: $x = 7$.', 'أزل 5 من الطرفين: $x = 7$.'),
    example: {
      problem: p('Solve $\\frac{x}{4} = 6$.', 'حلّ $\\frac{x}{4} = 6$.'),
      steps: [
        p('$x$ is divided by 4, so multiply both sides by 4.', 'العدد $x$ مقسوم على 4 فنضرب الطرفين في 4.'),
        p('$x = 6 \\times 4 = 24$. Check: $24 \\div 4 = 6$ ✓', '$x = 6 \\times 4 = 24$. تحقق: $24 \\div 4 = 6$ ✓'),
      ],
      result: p('$x = 24$', '$x = 24$'),
    },
    why: p('Every "find the missing number" question in life is an equation.', 'كل سؤال "أوجد العدد الناقص" في الحياة هو معادلة.'),
    tryGen: 'add-sub',
    check: ['add-sub', 'mul-div', 'number-puzzle', 'is-solution', 'which-operation'],
    keywords: p('equation solve unknown inverse operation', 'معادلة حل مجهول عملية عكسية'),
  }),
  lesson('two-step-equations', {
    minutes: 8,
    explanation: [
      p('Two operations were done to $x$, so undo them in **reverse order**. In $2x + 3 = 11$, $x$ was first multiplied by 2, then 3 was added. Undo the adding first, then the multiplying.', 'أُجريت عمليتان على $x$ لذلك ألغِهما **بترتيب معكوس**. في $2x + 3 = 11$ ضُرب $x$ في 2 ثم أُضيف 3. ألغِ الجمع أولًا ثم الضرب.'),
      p('$2x + 3 = 11$ → subtract 3: $2x = 8$ → divide by 2: $x = 4$.', '$2x + 3 = 11$ ← اطرح 3: $2x = 8$ ← اقسم على 2: $x = 4$.'),
      p('Real situations fit this shape: a fixed fee plus a price per item. "20 plus 5 per hour equals 55" is $5h + 20 = 55$.', 'مواقف كثيرة تأخذ هذا الشكل: رسم ثابت وسعر لكل وحدة. "20 زائد 5 لكل ساعة تساوي 55" هي $5h + 20 = 55$.'),
    ],
    visual: { type: 'balance', left: '2x + 3', right: '11' },
    example: {
      problem: p('A phone plan costs 10 plus 4 per GB. Your bill is 50. How many GB?', 'باقة هاتف تكلف 10 زائد 4 لكل غيغابايت. فاتورتك 50. كم غيغابايت استخدمت؟'),
      steps: [
        p('Write $4g + 10 = 50$.', 'اكتب $4g + 10 = 50$.'),
        p('Subtract 10: $4g = 40$. Divide by 4: $g = 10$.', 'اطرح 10: $4g = 40$. اقسم على 4: $g = 10$.'),
      ],
      result: p('10 GB', '10 غيغابايت'),
    },
    why: p('Most everyday problems with a start value and a repeated amount are two-step equations.', 'معظم مسائل الحياة التي فيها قيمة ابتدائية ومقدار متكرر هي معادلات من خطوتين.'),
    tryGen: 'solve',
    check: ['solve', 'first-step', 'phone-plan', 'missing-term', 'check-solution'],
    keywords: p('two-step equation solve reverse order', 'معادلة من خطوتين حل ترتيب معكوس'),
  }),
  lesson('both-sides', {
    minutes: 8,
    explanation: [
      p('Sometimes $x$ appears on both sides. First collect the $x$ terms on one side and the plain numbers on the other, then finish as before.', 'أحيانًا يظهر $x$ في الطرفين. اجمع حدود $x$ في طرف والأعداد في الطرف الآخر ثم أكمل كما سبق.'),
      p('$5x - 4 = 2x + 8$ → subtract $2x$: $3x - 4 = 8$ → add 4: $3x = 12$ → divide by 3: $x = 4$.', '$5x - 4 = 2x + 8$ ← اطرح $2x$: $3x - 4 = 8$ ← أضف 4: $3x = 12$ ← اقسم على 3: $x = 4$.'),
      p('When you move a term across the equals sign, **its sign changes**. Forgetting this is the most common mistake here.', 'عندما تنقل حدًا عبر علامة المساواة **تتغير إشارته**. نسيان ذلك هو الخطأ الأشيع هنا.'),
    ],
    visual: { type: 'balance', left: '5x - 4', right: '2x + 8' },
    example: {
      problem: p('Plan A costs 20 + 3 per visit. Plan B costs 5 per visit. When are they equal?', 'الخطة أ تكلف 20 + 3 لكل زيارة والخطة ب تكلف 5 لكل زيارة. متى تتساويان؟'),
      steps: [
        p('$20 + 3v = 5v$.', '$20 + 3v = 5v$.'),
        p('Subtract $3v$: $20 = 2v$. Divide by 2: $v = 10$.', 'اطرح $3v$: $20 = 2v$. اقسم على 2: $v = 10$.'),
      ],
      result: p('After 10 visits both plans cost the same.', 'بعد 10 زيارات تتساوى التكلفتان.'),
    },
    why: p('Comparing two options and finding the break-even point is a real decision tool.', 'مقارنة خيارين وإيجاد نقطة التعادل أداة حقيقية لاتخاذ القرار.'),
    tryGen: 'solve',
    check: ['solve', 'plans', 'next-line'],
    keywords: p('equation both sides variables collect terms', 'معادلة طرفين متغيرات جمع الحدود'),
  }),
  lesson('simplifying-expressions', {
    minutes: 6,
    explanation: [
      p('Simplifying means writing an expression in a shorter equal form by combining like terms. $4x + 3 + 2x - 1 = 6x + 2$.', 'التبسيط يعني كتابة التعبير بصورة أقصر مساوية له بجمع الحدود المتشابهة. $4x + 3 + 2x - 1 = 6x + 2$.'),
      p('Group the terms by type: all the $x$ terms, all the plain numbers. Keep the sign that sits in front of each term.', 'جمّع الحدود حسب نوعها: كل حدود $x$ وكل الأعداد المجردة. وأبقِ الإشارة التي أمام كل حد.'),
      p('Two expressions are **equivalent** if they give the same value for every $x$. $2(x+1)$ and $2x+2$ are equivalent, but $2x+1$ is not.', 'يكون التعبيران **متكافئين** إذا أعطيا القيمة نفسها لكل قيمة $x$. $2(x+1)$ و $2x+2$ متكافئان أما $2x+1$ فلا.'),
    ],
    visual: { type: 'none' },
    example: {
      problem: p('Simplify $7a - 3 + 2a + 8 - a$.', 'بسّط $7a - 3 + 2a + 8 - a$.'),
      steps: [
        p('The $a$ terms: $7a + 2a - a = 8a$.', 'حدود $a$: $7a + 2a - a = 8a$.'),
        p('The numbers: $-3 + 8 = 5$.', 'الأعداد: $-3 + 8 = 5$.'),
      ],
      result: p('$8a + 5$', '$8a + 5$'),
    },
    why: p('A simpler expression is easier to read, calculate and solve.', 'التعبير الأبسط أسهل في القراءة والحساب والحل.'),
    tryGen: 'combine',
    check: ['combine', 'equivalent', 'true-false'],
    keywords: p('simplify combine like terms equivalent', 'تبسيط جمع حدود متشابهة تكافؤ'),
  }),
  lesson('distributive', {
    minutes: 7,
    explanation: [
      p('The distributive property: multiply what is outside the brackets by **every** term inside. $3(x + 4) = 3x + 12$.', 'خاصية التوزيع: اضرب ما خارج القوس في **كل** حد داخله. $3(x + 4) = 3x + 12$.'),
      p('A common slip is multiplying only the first term: $3(x+4) \\ne 3x + 4$. Another: with a minus outside, every sign inside flips. $-(x - 2) = -x + 2$.', 'خطأ شائع أن نضرب الحد الأول فقط: $3(x+4) \\ne 3x + 4$. وآخر: عند وجود ناقص خارج القوس تنقلب كل الإشارات داخله. $-(x - 2) = -x + 2$.'),
      p('It is also how you calculate in your head: $7 \\times 98 = 7(100 - 2) = 700 - 14 = 686$.', 'وهي أيضًا طريقة الحساب الذهني: $7 \\times 98 = 7(100 - 2) = 700 - 14 = 686$.'),
    ],
    visual: { type: 'shape', shape: 'rect', labels: ['3', 'x', '4'] },
    visualCaption: p('A rectangle of width 3 split into $x$ and 4.', 'مستطيل عرضه 3 مقسوم إلى $x$ و 4.'),
    example: {
      problem: p('Expand $-2(3x - 5)$.', 'فكّ $-2(3x - 5)$.'),
      steps: [
        p('$-2 \\times 3x = -6x$.', '$-2 \\times 3x = -6x$.'),
        p('$-2 \\times (-5) = +10$.', '$-2 \\times (-5) = +10$.'),
      ],
      result: p('$-6x + 10$', '$-6x + 10$'),
    },
    why: p('Expanding is needed to simplify, to solve equations with brackets, and to multiply polynomials later.', 'التوسيع ضروري للتبسيط ولحل المعادلات التي فيها أقواس ولضرب كثيرات الحدود لاحقًا.'),
    tryGen: 'expand',
    check: ['expand', 'which-equal', 'missing-number', 'true-false'],
    keywords: p('distributive property expand brackets multiply', 'خاصية التوزيع فك الأقواس ضرب'),
  }),
  lesson('factoring', {
    minutes: 8,
    explanation: [
      p('Factoring is expanding in reverse: pull out what all the terms share. $6x + 12 = 6(x + 2)$ because 6 divides both.', 'التحليل إلى عوامل هو التوسيع بالعكس: أخرج ما تشترك فيه كل الحدود. $6x + 12 = 6(x + 2)$ لأن 6 تقسم الحدين.'),
      p('Find the greatest common factor of the numbers and of the letters. $10x^2 + 15x = 5x(2x + 3)$.', 'أوجد القاسم المشترك الأكبر للأعداد وللحروف. $10x^2 + 15x = 5x(2x + 3)$.'),
      p('For $x^2 + bx + c$, look for two numbers that **multiply to** $c$ and **add to** $b$. $x^2 + 5x + 6 = (x+2)(x+3)$ since $2 \\times 3 = 6$ and $2 + 3 = 5$.', 'في $x^2 + bx + c$ ابحث عن عددين **حاصل ضربهما** $c$ و**مجموعهما** $b$. $x^2 + 5x + 6 = (x+2)(x+3)$ لأن $2 \\times 3 = 6$ و $2 + 3 = 5$.'),
    ],
    visual: { type: 'shape', shape: 'rect', labels: ['x + 2', 'x + 3', 'x² + 5x + 6'] },
    example: {
      problem: p('Factor $x^2 - 7x + 12$.', 'حلّل $x^2 - 7x + 12$.'),
      steps: [
        p('Need two numbers with product 12 and sum $-7$.', 'نحتاج عددين حاصل ضربهما 12 ومجموعهما $-7$.'),
        p('$-3$ and $-4$ work: $(-3)(-4) = 12$ and $-3 + -4 = -7$.', 'العددان $-3$ و $-4$ يصلحان: $(-3)(-4) = 12$ و $-3 + -4 = -7$.'),
      ],
      result: p('$(x - 3)(x - 4)$', '$(x - 3)(x - 4)$'),
    },
    why: p('Factored form reveals the solutions of a quadratic and lets you cancel fractions.', 'الصيغة المحللة تكشف حلول المعادلة التربيعية وتسمح باختصار الكسور.'),
    tryGen: 'common-factor',
    check: ['common-factor', 'gcf-number', 'quadratic', 'missing-number', 'check-expand'],
    keywords: p('factor factorise common factor quadratic', 'تحليل عوامل عامل مشترك تربيعي'),
  }),
  lesson('inequalities', {
    minutes: 7,
    explanation: [
      p('An inequality compares with $<$, $>$, $\\le$, $\\ge$. Its answer is usually a whole range of numbers: $x > 3$ means any number greater than 3.', 'المتباينة تقارن باستخدام $<$ و $>$ و $\\le$ و $\\ge$. وجوابها عادةً مجال كامل من الأعداد: $x > 3$ تعني أي عدد أكبر من 3.'),
      p('Solve it just like an equation. One new rule: when you **multiply or divide by a negative number, flip the sign**. $-2x < 6$ → $x > -3$.', 'تُحل مثل المعادلة. وهناك قاعدة جديدة: عند **الضرب أو القسمة في عدد سالب اقلب الإشارة**. $-2x < 6$ ← $x > -3$.'),
      p('On a number line, an open circle means "not included" ($<$, $>$) and a filled circle means "included" ($\\le$, $\\ge$).', 'على خط الأعداد الدائرة المفتوحة تعني "غير مشمول" ($<$ و $>$) والدائرة المملوءة تعني "مشمول" ($\\le$ و $\\ge$).'),
    ],
    visual: { type: 'number-line', min: -2, max: 8, step: 1, marks: [3] },
    visualCaption: p('$x > 3$', '$x > 3$'),
    example: {
      problem: p('Solve $3x - 4 \\le 11$.', 'حلّ $3x - 4 \\le 11$.'),
      steps: [
        p('Add 4: $3x \\le 15$.', 'أضف 4: $3x \\le 15$.'),
        p('Divide by 3 (positive, so no flip): $x \\le 5$.', 'اقسم على 3 (موجب فلا نقلب): $x \\le 5$.'),
      ],
      result: p('$x \\le 5$', '$x \\le 5$'),
    },
    why: p('Budgets and limits are "at most" and "at least" situations, not exact values.', 'الميزانيات والحدود مواقف "على الأكثر" و"على الأقل" لا قيم دقيقة.'),
    tryGen: 'solve',
    check: ['solve', 'integer-solution', 'is-solution'],
    keywords: p('inequality solve greater less flip sign', 'متباينة حل أكبر أصغر قلب الإشارة'),
  }),
  lesson('linear-functions', {
    minutes: 9,
    explanation: [
      p('A linear function makes a straight line: $y = mx + b$. The **slope** $m$ says how much $y$ changes when $x$ goes up by 1. The **y-intercept** $b$ is where the line crosses the $y$-axis (where $x = 0$).', 'الدالة الخطية ترسم مستقيمًا: $y = mx + b$. **الميل** $m$ يبين كم يتغير $y$ عندما يزيد $x$ بمقدار 1. و**المقطع الصادي** $b$ هو نقطة تقاطع المستقيم مع المحور $y$ (حيث $x = 0$).'),
      p('Slope from two points: $m = \\frac{y_2 - y_1}{x_2 - x_1}$ (rise over run). Positive slope goes up to the right; negative goes down.', 'الميل من نقطتين: $m = \\frac{y_2 - y_1}{x_2 - x_1}$ (الارتفاع على الامتداد). الميل الموجب يصعد نحو اليمين والسالب ينزل.'),
      p('Taxi fare "5 starting fee plus 2 per km" is $y = 2x + 5$: slope 2, intercept 5.', 'أجرة سيارة الأجرة "5 رسم بداية زائد 2 لكل كم" هي $y = 2x + 5$: الميل 2 والمقطع 5.'),
    ],
    visual: { type: 'line-graph', m: 2, b: 1 },
    visualCaption: p('$y = 2x + 1$', '$y = 2x + 1$'),
    example: {
      problem: p('Find the slope of the line through $(1, 3)$ and $(4, 12)$.', 'أوجد ميل المستقيم المار بالنقطتين $(1, 3)$ و $(4, 12)$.'),
      steps: [
        p('Rise: $12 - 3 = 9$. Run: $4 - 1 = 3$.', 'الارتفاع: $12 - 3 = 9$. الامتداد: $4 - 1 = 3$.'),
        p('Slope $= 9 \\div 3 = 3$.', 'الميل $= 9 \\div 3 = 3$.'),
      ],
      result: p('$m = 3$', '$m = 3$'),
    },
    why: p('Constant-rate relationships such as speed, wages and fares are straight lines, and graphs show them at a glance.', 'العلاقات ذات المعدل الثابت كالسرعة والأجور والأجرة مستقيمات والرسم يوضحها بنظرة.'),
    tryGen: 'evaluate',
    check: ['evaluate', 'slope', 'y-intercept', 'equation-pick', 'fare'],
    keywords: p('linear function slope intercept line graph', 'دالة خطية ميل مقطع مستقيم رسم'),
  }),
];
