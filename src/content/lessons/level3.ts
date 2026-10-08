import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL3_LESSONS: Lesson[] = [
  lesson('percent-basics', {
    minutes: 5,
    explanation: [
      p('"Percent" means "out of 100". 35% is 35 out of 100, which is $\\frac{35}{100}$ or 0.35.', '"النسبة المئوية" تعني "من كل مئة". 35% تعني 35 من 100 أي $\\frac{35}{100}$ أو 0.35.'),
      p('Percent to decimal: move the point two places left (divide by 100). Decimal to percent: move it two places right.', 'من نسبة إلى عدد عشري: حرّك الفاصلة خانتين لليسار (قسمة على 100). ومن عشري إلى نسبة: حرّكها خانتين لليمين.'),
      p('Useful anchors: 50% is a half, 25% a quarter, 10% a tenth, 100% the whole thing. Percentages can be above 100%.', 'مرتكزات مفيدة: 50% نصف، 25% ربع، 10% عُشر، 100% الكل. ويمكن أن تتجاوز النسبة 100%.'),
    ],
    visual: { type: 'grid', rows: 10, cols: 10, shaded: 35 },
    visualCaption: p('35 of 100 squares = 35%.', '35 مربعًا من 100 = 35%.'),
    example: {
      problem: p('Write 8% as a decimal and as a fraction.', 'اكتب 8% على صورة عدد عشري وكسر.'),
      steps: [
        p('Decimal: $8 \\div 100 = 0.08$.', 'العشري: $8 \\div 100 = 0.08$.'),
        p('Fraction: $\\frac{8}{100} = \\frac{2}{25}$.', 'الكسر: $\\frac{8}{100} = \\frac{2}{25}$.'),
      ],
      result: p('$8\\% = 0.08 = \\frac{2}{25}$', '$8\\% = 0.08 = \\frac{2}{25}$'),
    },
    why: p('Discounts, taxes, interest, exam scores and statistics are all given in percent.', 'التخفيضات والضرائب والفوائد والدرجات والإحصاءات تُعطى جميعها بالنسبة المئوية.'),
    tryGen: 'to-decimal',
    check: ['to-fraction', 'to-decimal', 'match-forms', 'statement', 'fill-over'],
    keywords: p('percent percentage hundred convert', 'نسبة مئوية بالمئة تحويل'),
  }),
  lesson('percent-of', {
    minutes: 7,
    explanation: [
      p('To find a percentage of a number, turn the percent into a decimal and multiply. 20% of 150 is $0.20 \\times 150 = 30$.', 'لإيجاد نسبة مئوية من عدد حوّلها إلى عدد عشري واضرب. 20% من 150 هي $0.20 \\times 150 = 30$.'),
      p('To find what percent one number is of another, divide and multiply by 100: 18 out of 24 is $\\frac{18}{24} \\times 100 = 75\\%$.', 'لمعرفة كم نسبة عدد من آخر اقسم واضرب في 100: 18 من 24 هي $\\frac{18}{24} \\times 100 = 75\\%$.'),
      p('To find the whole when you know a part: divide the part by the percent (as a decimal). 30 is 20% of what? $30 \\div 0.20 = 150$.', 'لإيجاد الكل عند معرفة الجزء: اقسم الجزء على النسبة (عشريًا). 30 هي 20% من كم؟ $30 \\div 0.20 = 150$.'),
    ],
    visual: { type: 'bars', values: [{ label: '10%', value: 15 }, { label: '20%', value: 30 }, { label: '50%', value: 75 }] },
    visualCaption: p('Percentages of 150.', 'نسب مئوية من 150.'),
    example: {
      problem: p('A class has 40 students and 35% are absent. How many are absent?', 'في صف 40 طالبًا وغاب 35% منهم. كم عدد الغائبين؟'),
      steps: [
        p('35% = 0.35.', '35% = 0.35.'),
        p('$0.35 \\times 40 = 14$.', '$0.35 \\times 40 = 14$.'),
      ],
      result: p('14 students are absent.', 'غاب 14 طالبًا.'),
    },
    why: p('"What part of this is that?" is one of the most common real-life questions.', 'سؤال "كم هذا من ذاك؟" من أكثر أسئلة الحياة شيوعًا.'),
    tryGen: 'of-number',
    check: ['of-number', 'find-percent', 'reverse', 'class-story', 'which-expression'],
    keywords: p('percent of find part whole', 'نسبة مئوية من جزء كل'),
  }),
  lesson('discounts', {
    minutes: 7,
    explanation: [
      p('A discount takes a percentage off the price. Sale price = original − discount.', 'التخفيض يطرح نسبة من السعر. سعر البيع = السعر الأصلي − التخفيض.'),
      p('A shortcut: paying after a 30% discount means paying 70%. So sale price = original × 0.70.', 'اختصار: الدفع بعد تخفيض 30% يعني دفع 70%. إذن سعر البيع = الأصلي × 0.70.'),
      p('Tax works the other way: add it. Two discounts in a row are **not** added together; the second applies to the already-reduced price.', 'الضريبة تعمل بالعكس: تُضاف. وتخفيضان متتاليان **لا** يُجمعان؛ فالثاني يُحسب على السعر المخفّض.'),
    ],
    visual: { type: 'bars', values: [{ label: '100%', value: 100 }, { label: '70%', value: 70 }] },
    visualCaption: p('A 30% discount leaves 70% to pay.', 'تخفيض 30% يترك 70% للدفع.'),
    example: {
      problem: p('A jacket costs 80. It is 25% off. What do you pay?', 'سعر سترة 80. عليها تخفيض 25%. كم تدفع؟'),
      steps: [
        p('Discount: $0.25 \\times 80 = 20$.', 'التخفيض: $0.25 \\times 80 = 20$.'),
        p('Pay: $80 - 20 = 60$. (Or $0.75 \\times 80 = 60$.)', 'تدفع: $80 - 20 = 60$. (أو $0.75 \\times 80 = 60$.)'),
      ],
      result: p('You pay 60.', 'تدفع 60.'),
    },
    why: p('Knowing the real price after a sale protects you from clever advertising.', 'معرفة السعر الحقيقي بعد التخفيض تحميك من الإعلانات المضللة.'),
    tryGen: 'sale-price',
    check: ['sale-price', 'savings', 'compare-deals', 'with-tax', 'stacked'],
    keywords: p('discount sale price tax off', 'تخفيض خصم سعر ضريبة'),
  }),
  lesson('ratios', {
    minutes: 6,
    explanation: [
      p('A ratio compares two amounts. 3 red to 5 blue is written 3 : 5. It says nothing about the total; there could be 3 and 5, or 30 and 50.', 'النسبة تقارن بين كميتين. 3 أحمر إلى 5 أزرق تكتب 3 : 5. وهي لا تحدد المجموع؛ قد يكون 3 و5 أو 30 و50.'),
      p('Ratios simplify like fractions: 12 : 18 = 2 : 3.', 'تُبسّط النسب مثل الكسور: 12 : 18 = 2 : 3.'),
      p('To share an amount in a ratio, add the parts, find the value of one part, then multiply. Share 40 in the ratio 3 : 5 → 8 parts, each part 5, so 15 and 25.', 'لتوزيع كمية بنسبة معينة اجمع الأجزاء ثم أوجد قيمة الجزء الواحد ثم اضرب. وزّع 40 بنسبة 3 : 5 ← 8 أجزاء، الجزء 5، فالنتيجة 15 و25.'),
    ],
    visual: { type: 'bars', values: [{ label: '3', value: 3 }, { label: '5', value: 5 }] },
    example: {
      problem: p('Share 60 between Sara and Omar in the ratio 2 : 3.', 'وزّع 60 بين سارة وعمر بنسبة 2 : 3.'),
      steps: [
        p('Total parts: $2 + 3 = 5$.', 'مجموع الأجزاء: $2 + 3 = 5$.'),
        p('One part: $60 \\div 5 = 12$.', 'الجزء الواحد: $60 \\div 5 = 12$.'),
        p('Sara: $2 \\times 12 = 24$. Omar: $3 \\times 12 = 36$.', 'سارة: $2 \\times 12 = 24$. عمر: $3 \\times 12 = 36$.'),
      ],
      result: p('Sara gets 24, Omar gets 36.', 'تحصل سارة على 24 ويحصل عمر على 36.'),
    },
    why: p('Ratios describe mixtures, maps, recipes and fair sharing.', 'النسب تصف الخلطات والخرائط والوصفات والتقسيم العادل.'),
    tryGen: 'share',
    check: ['fill-equal', 'share', 'part-of-whole', 'simplify'],
    keywords: p('ratio share parts simplify', 'نسبة تناسب أجزاء توزيع'),
  }),
  lesson('proportions', {
    minutes: 7,
    explanation: [
      p('A proportion says two ratios are equal: $\\frac{3}{4} = \\frac{9}{12}$. Quantities in proportion grow or shrink together at the same rate.', 'التناسب يعني أن نسبتين متساويتان: $\\frac{3}{4} = \\frac{9}{12}$. الكميات المتناسبة تكبر وتصغر معًا بالمعدل نفسه.'),
      p('The easiest way: find the **unit rate** (the value for 1). If 4 pens cost 10, one pen costs $10 \\div 4 = 2.5$.', 'أسهل طريقة: أوجد **المعدل للواحد**. إذا كانت 4 أقلام بسعر 10 فالقلم الواحد $10 \\div 4 = 2.5$.'),
      p('Watch out: not everything is proportional. If you are 10 now and your sister is 12, in 10 years you will be 20 and 22, not 20 and 24.', 'انتبه: ليس كل شيء متناسبًا. إن كان عمرك 10 وعمر أختك 12 فبعد 10 سنوات ستكونان 20 و22 لا 20 و24.'),
    ],
    visual: { type: 'bars', values: [{ label: '1', value: 2.5 }, { label: '2', value: 5 }, { label: '4', value: 10 }] },
    example: {
      problem: p('A car travels 150 km in 2 hours. How far in 5 hours at the same speed?', 'تقطع سيارة 150 كم في ساعتين. كم تقطع في 5 ساعات بالسرعة نفسها؟'),
      steps: [
        p('Unit rate: $150 \\div 2 = 75$ km per hour.', 'المعدل: $150 \\div 2 = 75$ كم في الساعة.'),
        p('For 5 hours: $75 \\times 5 = 375$.', 'لخمس ساعات: $75 \\times 5 = 375$.'),
      ],
      result: p('375 km', '375 كم'),
    },
    why: p('Scaling recipes, converting currency and reading maps all rely on proportion.', 'تكبير الوصفات وتحويل العملات وقراءة الخرائط كلها تعتمد على التناسب.'),
    tryGen: 'unit-rate',
    check: ['unit-rate', 'solve-blank', 'recipe', 'additive-trap', 'speed'],
    keywords: p('proportion unit rate scale speed recipe', 'تناسب معدل سرعة وصفة'),
  }),
  lesson('money-time', {
    minutes: 6,
    explanation: [
      p('Money uses decimals with two places. Add the items, then subtract what you paid from what you gave to find the **change**.', 'المال يستخدم عشريًا بخانتين. اجمع الأسعار ثم اطرح المدفوع من المعطى لتجد **الباقي**.'),
      p('Time is not decimal: 60 seconds in a minute, 60 minutes in an hour, 24 hours in a day. 1.5 hours is 1 hour 30 minutes, not 1 hour 50.', 'الوقت ليس عشريًا: 60 ثانية في الدقيقة و60 دقيقة في الساعة و24 ساعة في اليوم. 1.5 ساعة هي ساعة و30 دقيقة لا ساعة و50.'),
      p('To find how long between two times, count up to the next hour, then the rest. From 2:45 to 4:10 is 15 min + 1 h + 10 min = 1 h 25 min.', 'لإيجاد المدة بين وقتين عدّ إلى الساعة التالية ثم أكمل. من 2:45 إلى 4:10 هي 15 دقيقة + ساعة + 10 دقائق = ساعة و25 دقيقة.'),
    ],
    visual: { type: 'number-line', min: 0, max: 60, step: 15, marks: [15, 30, 45] },
    visualCaption: p('Minutes on a clock face.', 'الدقائق على وجه الساعة.'),
    example: {
      problem: p('A film starts at 6:50 and ends at 8:35. How long is it?', 'يبدأ فيلم الساعة 6:50 وينتهي 8:35. كم مدته؟'),
      steps: [
        p('6:50 to 7:00 is 10 minutes.', 'من 6:50 إلى 7:00 عشر دقائق.'),
        p('7:00 to 8:00 is 60 minutes; 8:00 to 8:35 is 35 minutes.', 'من 7:00 إلى 8:00 ستون دقيقة، ومن 8:00 إلى 8:35 خمس وثلاثون.'),
        p('Total: $10 + 60 + 35 = 105$ minutes.', 'المجموع: $10 + 60 + 35 = 105$ دقيقة.'),
      ],
      result: p('1 hour 45 minutes', 'ساعة و45 دقيقة'),
    },
    why: p('You handle money and time every day: budgeting, schedules, deadlines.', 'تتعامل مع المال والوقت يوميًا: الميزانية والجداول والمواعيد.'),
    tryGen: 'change',
    check: ['change', 'minutes-between', 'convert-time', 'unit-price', 'shopping-total'],
    keywords: p('money change time minutes hours clock price', 'مال باقي وقت دقائق ساعات سعر'),
  }),
  lesson('average', {
    minutes: 6,
    explanation: [
      p('The **mean** is the fair-share value: add all the values and divide by how many there are. Mean of 4, 6, 11 is $\\frac{21}{3} = 7$.', '**المتوسط الحسابي** هو القيمة العادلة: اجمع القيم واقسم على عددها. متوسط 4 و6 و11 هو $\\frac{21}{3} = 7$.'),
      p('The **median** is the middle value after sorting. The **mode** is the value that appears most. The **range** is biggest minus smallest.', '**الوسيط** هو القيمة الوسطى بعد الترتيب. و**المنوال** هو القيمة الأكثر تكرارًا. و**المدى** هو الأكبر ناقص الأصغر.'),
      p('For an even number of values, the median is the mean of the two middle ones.', 'إذا كان عدد القيم زوجيًا فالوسيط هو متوسط القيمتين الوسطيتين.'),
    ],
    visual: { type: 'bars', values: [{ label: 'A', value: 4 }, { label: 'B', value: 6 }, { label: 'C', value: 11 }] },
    example: {
      problem: p('Test scores: 70, 85, 90, 75. What is the mean?', 'درجات اختبارات: 70 و85 و90 و75. ما المتوسط؟'),
      steps: [
        p('Sum: $70 + 85 + 90 + 75 = 320$.', 'المجموع: $70 + 85 + 90 + 75 = 320$.'),
        p('Divide by 4: $320 \\div 4 = 80$.', 'اقسم على 4: $320 \\div 4 = 80$.'),
      ],
      result: p('Mean = 80', 'المتوسط = 80'),
    },
    why: p('One number that summarises many: grades, temperatures, prices.', 'رقم واحد يلخّص عددًا كبيرًا: الدرجات ودرجات الحرارة والأسعار.'),
    tryGen: 'mean',
    check: ['mean', 'median', 'missing-score', 'claim', 'range'],
    keywords: p('average mean median range', 'متوسط وسيط مدى معدل'),
  }),
  lesson('unit-conversion', {
    minutes: 6,
    explanation: [
      p('To convert units, use the relationship between them. 1 km = 1000 m, 1 m = 100 cm, 1 kg = 1000 g, 1 L = 1000 mL.', 'لتحويل الوحدات استخدم العلاقة بينها. 1 كم = 1000 م، 1 م = 100 سم، 1 كغ = 1000 غ، 1 لتر = 1000 مل.'),
      p('Going to a **smaller** unit → there will be **more** of them: multiply. Going to a bigger unit → fewer: divide.', 'الانتقال إلى وحدة **أصغر** يعني عددًا **أكبر**: اضرب. والانتقال إلى وحدة أكبر يعني عددًا أقل: اقسم.'),
      p('Always convert to the same unit before adding or comparing.', 'حوّل دائمًا إلى الوحدة نفسها قبل الجمع أو المقارنة.'),
    ],
    visual: { type: 'number-line', min: 0, max: 100, step: 10, marks: [100], jump: { from: 0, to: 100 } },
    visualCaption: p('1 m = 100 cm', '1 م = 100 سم'),
    example: {
      problem: p('Convert 3.5 km to metres.', 'حوّل 3.5 كم إلى أمتار.'),
      steps: [
        p('Metres are smaller than kilometres, so multiply.', 'المتر أصغر من الكيلومتر فنضرب.'),
        p('$3.5 \\times 1000 = 3500$.', '$3.5 \\times 1000 = 3500$.'),
      ],
      result: p('3.5 km = 3500 m', '3.5 كم = 3500 م'),
    },
    why: p('Recipes, travel, shopping and science all mix units.', 'الوصفات والسفر والتسوق والعلوم كلها تخلط الوحدات.'),
    tryGen: 'convert',
    check: ['convert', 'match-units', 'best-unit', 'which-operation', 'order-lengths'],
    keywords: p('unit conversion metric length mass volume', 'تحويل وحدات طول كتلة حجم'),
  }),
];
