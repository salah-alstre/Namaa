import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL1_LESSONS: Lesson[] = [
  lesson('place-value', {
    minutes: 6,
    explanation: [
      p('Every digit in a number has a value that depends on its **place**. In 3,472 the digit 4 is in the hundreds place, so it is worth 400, not 4.', 'لكل رقم في العدد قيمة تعتمد على **مكانه**. في العدد 3,472 الرقم 4 في خانة المئات، فقيمته 400 وليست 4.'),
      p('Places go up by ten each step to the left: ones, tens, hundreds, thousands. Moving one place left makes a digit ten times bigger.', 'الخانات تكبر عشر مرات كلما اتجهنا يسارًا: آحاد، عشرات، مئات، آلاف. الانتقال خانة إلى اليسار يجعل الرقم أكبر عشر مرات.'),
      p('Zero is a placeholder. It holds a place open so the other digits stay where they belong: 305 is not the same as 35.', 'الصفر يحجز المكان حتى تبقى الأرقام الأخرى في مواضعها: 305 ليس مثل 35.'),
    ],
    visual: { type: 'place-value', value: '3472' },
    visualCaption: p('Each column is worth ten times the one to its right.', 'كل عمود يساوي عشرة أمثال العمود الذي على يمينه.'),
    example: {
      problem: p('What is the value of the digit 7 in 7,208?', 'ما قيمة الرقم 7 في العدد 7,208؟'),
      steps: [
        p('Write the places: thousands, hundreds, tens, ones.', 'اكتب الخانات: آلاف، مئات، عشرات، آحاد.'),
        p('7 is in the thousands place.', 'الرقم 7 في خانة الآلاف.'),
        p('So its value is $7 \\times 1000 = 7000$.', 'إذن قيمته $7 \\times 1000 = 7000$.'),
      ],
      result: p('The 7 is worth 7,000.', 'قيمة الرقم 7 هي 7,000.'),
    },
    why: p('Place value is the reason we can write any number with only ten digits, and it is why adding and multiplying column by column works.', 'القيمة المكانية هي السبب في أننا نكتب أي عدد بعشرة أرقام فقط، وهي سبب نجاح الجمع والضرب عمودًا بعمود.'),
    tryGen: 'digit-value',
    check: ['digit-value', 'expanded-form', 'place-name', 'match-places'],
    keywords: p('digit place ones tens hundreds thousands value', 'رقم خانة آحاد عشرات مئات آلاف قيمة مكانية'),
  }),
  lesson('addition', {
    minutes: 5,
    explanation: [
      p('Addition puts amounts together. The result is called the **sum**. Order does not matter: $3 + 8 = 8 + 3$.', 'الجمع هو ضم الكميات معًا، والناتج يسمى **المجموع**. الترتيب لا يهم: $3 + 8 = 8 + 3$.'),
      p('For big numbers, line them up by place and add from the right. When a column reaches 10 or more, **carry** the extra ten to the next column.', 'مع الأعداد الكبيرة، رتّبها حسب الخانات واجمع من اليمين. إذا بلغ العمود 10 أو أكثر **احمل** العشرة إلى العمود التالي.'),
      p('A fast trick: make a ten first. $8 + 5$ is $8 + 2 + 3 = 10 + 3 = 13$.', 'حيلة سريعة: كوّن عشرة أولًا. $8 + 5$ تساوي $8 + 2 + 3 = 10 + 3 = 13$.'),
    ],
    visual: { type: 'number-line', min: 0, max: 20, marks: [8, 13], jump: { from: 8, to: 13 } },
    visualCaption: p('Adding 5 is a jump of 5 to the right.', 'إضافة 5 تعني قفزة بمقدار 5 نحو اليمين.'),
    example: {
      problem: p('Find $478 + 256$.', 'أوجد $478 + 256$.'),
      steps: [
        p('Ones: $8 + 6 = 14$. Write 4, carry 1.', 'الآحاد: $8 + 6 = 14$. اكتب 4 واحمل 1.'),
        p('Tens: $7 + 5 + 1 = 13$. Write 3, carry 1.', 'العشرات: $7 + 5 + 1 = 13$. اكتب 3 واحمل 1.'),
        p('Hundreds: $4 + 2 + 1 = 7$.', 'المئات: $4 + 2 + 1 = 7$.'),
      ],
      result: p('$478 + 256 = 734$', '$478 + 256 = 734$'),
    },
    why: p('Almost every other skill in maths uses addition. Doing it quickly and accurately frees your attention for harder ideas.', 'تقريبًا كل مهارة رياضية أخرى تستخدم الجمع. إتقانه بسرعة ودقة يفرّغ تركيزك للأفكار الأصعب.'),
    tryGen: 'sum',
    check: ['sum', 'missing-addend', 'story', 'true-sum'],
    keywords: p('add plus sum total carry together', 'جمع زائد مجموع حمل ضم'),
  }),
  lesson('subtraction', {
    minutes: 5,
    explanation: [
      p('Subtraction takes an amount away, or finds the **difference** between two numbers. $12 - 5 = 7$.', 'الطرح يأخذ كمية بعيدًا، أو يوجد **الفرق** بين عددين. $12 - 5 = 7$.'),
      p('Unlike addition, order matters: $12 - 5$ is not $5 - 12$.', 'على عكس الجمع، الترتيب مهم: $12 - 5$ ليست $5 - 12$.'),
      p('If a digit on top is too small, **borrow**: take one ten from the next column and add 10 to this one. You can always check by adding the answer back.', 'إذا كان الرقم العلوي أصغر من اللازم **استلف**: خذ عشرة من الخانة التالية وأضف 10 لهذه الخانة. ويمكنك دائمًا التحقق بجمع الناتج مع المطروح.'),
    ],
    visual: { type: 'number-line', min: 0, max: 20, marks: [7, 12], jump: { from: 12, to: 7 } },
    visualCaption: p('Subtracting 5 is a jump of 5 to the left.', 'الطرح بمقدار 5 قفزة نحو اليسار.'),
    example: {
      problem: p('Find $503 - 267$.', 'أوجد $503 - 267$.'),
      steps: [
        p('Ones: 3 is less than 7, so borrow. The 0 tens cannot lend, so borrow from the hundreds: 503 becomes 4 hundreds, 10 tens, 3 ones, then 4 hundreds, 9 tens, 13 ones.', 'الآحاد: 3 أصغر من 7 فنستلف. خانة العشرات صفر فلا تعطي، فنستلف من المئات: يصبح 503 هو 4 مئات و9 عشرات و13 آحاد.'),
        p('Ones: $13 - 7 = 6$. Tens: $9 - 6 = 3$. Hundreds: $4 - 2 = 2$.', 'الآحاد: $13 - 7 = 6$. العشرات: $9 - 6 = 3$. المئات: $4 - 2 = 2$.'),
        p('Check: $236 + 267 = 503$. ✓', 'تحقق: $236 + 267 = 503$. ✓'),
      ],
      result: p('$503 - 267 = 236$', '$503 - 267 = 236$'),
    },
    why: p('Subtraction answers "how much more?" and "how much is left?", questions you meet with money, time and measuring every day.', 'الطرح يجيب عن "كم الزيادة؟" و"كم بقي؟"، وهي أسئلة تقابلها يوميًا مع المال والوقت والقياس.'),
    tryGen: 'difference',
    check: ['difference', 'check-by-adding', 'missing-minuend', 'story'],
    keywords: p('subtract minus difference borrow take away', 'طرح ناقص فرق استلاف'),
  }),
  lesson('multiplication', {
    minutes: 6,
    explanation: [
      p('Multiplication is repeated addition. $4 \\times 3$ means four groups of three: $3 + 3 + 3 + 3 = 12$.', 'الضرب جمع متكرر. $4 \\times 3$ تعني أربع مجموعات في كل منها ثلاثة: $3 + 3 + 3 + 3 = 12$.'),
      p('Order does not matter: $4 \\times 3 = 3 \\times 4$. A rectangle of dots with 4 rows and 3 columns shows both.', 'الترتيب لا يهم: $4 \\times 3 = 3 \\times 4$. مستطيل من النقاط بأربعة صفوف وثلاثة أعمدة يوضح ذلك.'),
      p('For larger numbers, break one number apart: $14 \\times 6 = 10 \\times 6 + 4 \\times 6 = 60 + 24 = 84$.', 'مع الأعداد الكبيرة فكّك أحد العددين: $14 \\times 6 = 10 \\times 6 + 4 \\times 6 = 60 + 24 = 84$.'),
    ],
    visual: { type: 'grid', rows: 4, cols: 3 },
    visualCaption: p('4 rows of 3 make 12.', '4 صفوف في كل منها 3 تعطي 12.'),
    example: {
      problem: p('Find $23 \\times 4$.', 'أوجد $23 \\times 4$.'),
      steps: [
        p('Split 23 into 20 and 3.', 'جزّئ 23 إلى 20 و3.'),
        p('$20 \\times 4 = 80$ and $3 \\times 4 = 12$.', '$20 \\times 4 = 80$ و $3 \\times 4 = 12$.'),
        p('Add: $80 + 12 = 92$.', 'اجمع: $80 + 12 = 92$.'),
      ],
      result: p('$23 \\times 4 = 92$', '$23 \\times 4 = 92$'),
    },
    why: p('Multiplication scales things: prices, areas, recipes. Knowing your tables makes fractions, percentages and algebra much easier.', 'الضرب يكبّر الأشياء: الأسعار والمساحات والوصفات. معرفة الجداول تسهّل الكسور والنسب والجبر كثيرًا.'),
    tryGen: 'product',
    check: ['product', 'table-choice', 'rows', 'missing-factor', 'true-product'],
    keywords: p('multiply times product table groups', 'ضرب جداء جدول مجموعات'),
  }),
  lesson('division', {
    minutes: 6,
    explanation: [
      p('Division shares an amount equally, or asks how many groups fit. $12 \\div 3 = 4$ because $4 \\times 3 = 12$.', 'القسمة توزع كمية بالتساوي أو تسأل كم مجموعة تتسع. $12 \\div 3 = 4$ لأن $4 \\times 3 = 12$.'),
      p('Division is the opposite of multiplication, so you can always check an answer by multiplying back.', 'القسمة عكس الضرب، لذلك يمكنك دائمًا التحقق من الناتج بالضرب.'),
      p('When it does not divide exactly, something is left over: the **remainder**. $14 \\div 4 = 3$ remainder $2$. You can never divide by zero.', 'عندما لا تنقسم تمامًا يبقى شيء: **الباقي**. $14 \\div 4 = 3$ والباقي $2$. ولا يمكن القسمة على صفر أبدًا.'),
    ],
    visual: { type: 'grid', rows: 3, cols: 4 },
    visualCaption: p('12 dots shared into 3 rows gives 4 in each row.', '12 نقطة موزعة على 3 صفوف تعطي 4 في كل صف.'),
    example: {
      problem: p('Share 38 sweets between 5 children. How many each, and how many are left?', 'وزّع 38 حلوى على 5 أطفال. كم لكل طفل وكم يبقى؟'),
      steps: [
        p('Find the biggest multiple of 5 that fits in 38: $5 \\times 7 = 35$.', 'أوجد أكبر مضاعف للعدد 5 لا يتجاوز 38: $5 \\times 7 = 35$.'),
        p('Each child gets 7.', 'يحصل كل طفل على 7.'),
        p('Left over: $38 - 35 = 3$.', 'الباقي: $38 - 35 = 3$.'),
      ],
      result: p('7 each, 3 left over.', 'لكل طفل 7 ويبقى 3.'),
    },
    why: p('Sharing, rates, averages and fractions are all division in disguise.', 'التقاسم والمعدلات والمتوسطات والكسور كلها قسمة بأشكال مختلفة.'),
    tryGen: 'quotient',
    check: ['quotient', 'share', 'remainder', 'missing-dividend'],
    keywords: p('divide share quotient remainder groups', 'قسمة توزيع ناتج القسمة باقي'),
  }),
  lesson('comparing-numbers', {
    minutes: 4,
    explanation: [
      p('To compare numbers, compare their places from the left. The first place where they differ decides which is bigger.', 'لمقارنة عددين قارن خاناتهما من اليسار. أول خانة يختلفان فيها تحدد الأكبر.'),
      p('Use $>$ for "greater than", $<$ for "less than" and $=$ for "equal". The open side of the sign always faces the bigger number.', 'استخدم $>$ لـ"أكبر من" و$<$ لـ"أصغر من" و$=$ لـ"يساوي". الجهة المفتوحة من العلامة تتجه دائمًا نحو العدد الأكبر.'),
      p('A number with more digits is bigger (for whole numbers without leading zeros): 1,000 is more than 999.', 'العدد الأكثر أرقامًا أكبر (للأعداد الصحيحة بلا أصفار في البداية): 1,000 أكبر من 999.'),
    ],
    visual: { type: 'number-line', min: 0, max: 100, marks: [47, 74], step: 10 },
    visualCaption: p('On a number line, the number further right is bigger.', 'على خط الأعداد، العدد الأبعد نحو اليمين هو الأكبر.'),
    example: {
      problem: p('Which is bigger: 4,825 or 4,852?', 'أيهما أكبر: 4,825 أم 4,852؟'),
      steps: [
        p('Thousands: 4 and 4, the same.', 'الآلاف: 4 و4، متساويان.'),
        p('Hundreds: 8 and 8, the same.', 'المئات: 8 و8، متساويان.'),
        p('Tens: 2 and 5. Since 5 is bigger, 4,852 is bigger.', 'العشرات: 2 و5. بما أن 5 أكبر فإن 4,852 هو الأكبر.'),
      ],
      result: p('$4852 > 4825$', '$4852 > 4825$'),
    },
    why: p('Comparing is the first step of sorting, estimating and checking whether an answer makes sense.', 'المقارنة هي الخطوة الأولى في الترتيب والتقدير والتأكد من منطقية الجواب.'),
    tryGen: 'compare-two',
    check: ['compare-two', 'order-numbers', 'largest'],
    keywords: p('compare greater less order sort bigger smaller', 'مقارنة أكبر أصغر ترتيب'),
  }),
  lesson('rounding', {
    minutes: 5,
    explanation: [
      p('Rounding swaps a number for a nearby, friendlier one. To round to the nearest ten, look at the ones digit.', 'التقريب يبدّل العدد بعدد قريب منه أسهل. للتقريب لأقرب عشرة انظر إلى رقم الآحاد.'),
      p('If that digit is **5 or more**, round up. If it is **4 or less**, round down. 47 rounds to 50; 42 rounds to 40.', 'إذا كان الرقم **5 أو أكثر** قرّب لأعلى، وإذا كان **4 أو أقل** قرّب لأسفل. العدد 47 يقرّب إلى 50 والعدد 42 إلى 40.'),
      p('Estimating means rounding first, then calculating. $398 + 205$ is about $400 + 200 = 600$.', 'التقدير يعني أن نقرّب أولًا ثم نحسب. $398 + 205$ تقريبًا $400 + 200 = 600$.'),
    ],
    visual: { type: 'number-line', min: 40, max: 50, marks: [47], step: 1, jump: { from: 47, to: 50 } },
    visualCaption: p('47 is closer to 50 than to 40.', 'العدد 47 أقرب إلى 50 منه إلى 40.'),
    example: {
      problem: p('Round 3,468 to the nearest hundred.', 'قرّب 3,468 إلى أقرب مئة.'),
      steps: [
        p('The hundreds digit is 4. Look at the tens digit: 6.', 'رقم المئات هو 4. انظر إلى رقم العشرات: 6.'),
        p('6 is 5 or more, so round the 4 up to 5.', '6 يساوي 5 أو أكثر، لذا نرفع 4 إلى 5.'),
        p('Everything after becomes zero.', 'وكل ما بعدها يصبح أصفارًا.'),
      ],
      result: p('3,468 ≈ 3,500', '3,468 ≈ 3,500'),
    },
    why: p('Quick estimates catch big mistakes before they matter, and they make shopping and planning easy.', 'التقدير السريع يكشف الأخطاء الكبيرة مبكرًا ويسهّل التسوق والتخطيط.'),
    tryGen: 'round-to',
    check: ['round-to', 'estimate-sum', 'round-true'],
    keywords: p('round estimate nearest approximate', 'تقريب تقدير أقرب'),
  }),
];
