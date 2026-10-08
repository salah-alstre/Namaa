import type { LevelInfo, Topic } from '@/types';

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: { en: 'Foundations', ar: 'الأساسيات' },
    summary: { en: 'Numbers and the four operations.', ar: 'الأعداد والعمليات الأربع.' },
    color: '#4f8cff',
  },
  {
    level: 2,
    title: { en: 'Fractions & Decimals', ar: 'الكسور والأعداد العشرية' },
    summary: { en: 'Parts of a whole, in every form.', ar: 'أجزاء الكل بكل صورها.' },
    color: '#14b8a6',
  },
  {
    level: 3,
    title: { en: 'Everyday Mathematics', ar: 'رياضيات الحياة اليومية' },
    summary: { en: 'Percentages, ratios, money and units.', ar: 'النسب المئوية والمقارنات والمال والوحدات.' },
    color: '#22c55e',
  },
  {
    level: 4,
    title: { en: 'Pre-Algebra', ar: 'ما قبل الجبر' },
    summary: { en: 'Order of operations, negatives, powers.', ar: 'ترتيب العمليات والأعداد السالبة والقوى.' },
    color: '#eab308',
  },
  {
    level: 5,
    title: { en: 'Algebra', ar: 'الجبر' },
    summary: { en: 'Equations, expressions and functions.', ar: 'المعادلات والمقادير والدوال.' },
    color: '#f97316',
  },
  {
    level: 6,
    title: { en: 'Geometry', ar: 'الهندسة' },
    summary: { en: 'Shapes, measures and the plane.', ar: 'الأشكال والقياسات والمستوى.' },
    color: '#ec4899',
  },
  {
    level: 7,
    title: { en: 'Advanced Topics', ar: 'موضوعات متقدمة' },
    summary: { en: 'Quadratics, data, chance and more.', ar: 'المعادلات التربيعية والبيانات والاحتمال وغيرها.' },
    color: '#8b5cf6',
  },
];

const T = (
  id: string,
  level: number,
  order: number,
  icon: string,
  en: string,
  ar: string,
  sEn: string,
  sAr: string,
): Topic => ({ id, level, order, icon, title: { en, ar }, summary: { en: sEn, ar: sAr } });

export const TOPICS: Topic[] = [
  // Level 1
  T('place-value', 1, 1, 'Hash', 'Place Value', 'القيمة المكانية', 'What each digit is worth.', 'ماذا يساوي كل رقم.'),
  T('addition', 1, 2, 'Plus', 'Addition', 'الجمع', 'Putting amounts together.', 'جمع الكميات معًا.'),
  T('subtraction', 1, 3, 'Minus', 'Subtraction', 'الطرح', 'Taking away and finding differences.', 'الطرح وإيجاد الفرق.'),
  T('multiplication', 1, 4, 'X', 'Multiplication', 'الضرب', 'Repeated addition made fast.', 'جمع متكرر بسرعة.'),
  T('division', 1, 5, 'Divide', 'Division', 'القسمة', 'Sharing equally and grouping.', 'التقسيم بالتساوي والتجميع.'),
  T('comparing-numbers', 1, 6, 'ArrowLeftRight', 'Comparing Numbers', 'مقارنة الأعداد', 'Bigger, smaller, equal.', 'أكبر وأصغر ومساوٍ.'),
  T('rounding', 1, 7, 'Target', 'Rounding & Estimating', 'التقريب والتقدير', 'Close enough, quickly.', 'قريب بما يكفي وبسرعة.'),
  // Level 2
  T('fraction-basics', 2, 1, 'PieChart', 'Fraction Basics', 'أساسيات الكسور', 'Numerator, denominator and parts.', 'البسط والمقام والأجزاء.'),
  T('equivalent-fractions', 2, 2, 'Equal', 'Equivalent Fractions', 'الكسور المتكافئة', 'Different names, same amount.', 'أسماء مختلفة والمقدار نفسه.'),
  T('simplifying-fractions', 2, 3, 'Shrink', 'Simplifying Fractions', 'تبسيط الكسور', 'Lowest terms.', 'أبسط صورة.'),
  T('comparing-fractions', 2, 4, 'Scale', 'Comparing Fractions', 'مقارنة الكسور', 'Which fraction is larger?', 'أي الكسرين أكبر؟'),
  T('add-sub-fractions', 2, 5, 'Combine', 'Adding & Subtracting Fractions', 'جمع الكسور وطرحها', 'Common denominators.', 'توحيد المقامات.'),
  T('mul-div-fractions', 2, 6, 'Layers', 'Multiplying & Dividing Fractions', 'ضرب الكسور وقسمتها', 'Fractions of fractions.', 'كسور من كسور.'),
  T('mixed-numbers', 2, 7, 'Blocks', 'Mixed Numbers', 'الأعداد الكسرية', 'Whole numbers with fractions.', 'أعداد صحيحة مع كسور.'),
  T('decimals', 2, 8, 'Dot', 'Decimals', 'الأعداد العشرية', 'Tenths, hundredths and beyond.', 'الأعشار والأجزاء من مئة وما بعدها.'),
  T('decimal-operations', 2, 9, 'Calculator', 'Decimal Operations', 'العمليات على العشرية', 'Add, subtract, multiply, divide.', 'جمع وطرح وضرب وقسمة.'),
  T('fraction-decimal', 2, 10, 'Repeat', 'Fractions ↔ Decimals', 'الكسور ↔ العشرية', 'Converting between the two.', 'التحويل بين الصورتين.'),
  // Level 3
  T('percent-basics', 3, 1, 'Percent', 'Percent Basics', 'أساسيات النسبة المئوية', 'Parts per hundred.', 'أجزاء من مئة.'),
  T('percent-of', 3, 2, 'BadgePercent', 'Percent of a Number', 'نسبة مئوية من عدد', 'Finding a percentage of an amount.', 'إيجاد نسبة من كمية.'),
  T('discounts', 3, 3, 'Tag', 'Discounts & Tax', 'الخصومات والضريبة', 'Prices after change.', 'الأسعار بعد التغيير.'),
  T('ratios', 3, 4, 'Ratio', 'Ratios', 'النسب', 'Comparing quantities.', 'مقارنة الكميات.'),
  T('proportions', 3, 5, 'GitCompare', 'Proportions & Rates', 'التناسب والمعدلات', 'Equal ratios and unit rates.', 'نسب متساوية ومعدل الوحدة.'),
  T('money-time', 3, 6, 'Clock', 'Money & Time', 'المال والوقت', 'Everyday calculations.', 'حسابات يومية.'),
  T('average', 3, 7, 'BarChart2', 'Averages', 'المتوسط', 'The mean of a set.', 'متوسط مجموعة من الأعداد.'),
  T('unit-conversion', 3, 8, 'Ruler', 'Unit Conversion', 'تحويل الوحدات', 'Metres, grams, litres and more.', 'أمتار وغرامات ولترات وغيرها.'),
  // Level 4
  T('order-of-operations', 4, 1, 'ListOrdered', 'Order of Operations', 'ترتيب العمليات', 'What to do first.', 'ماذا نفعل أولًا.'),
  T('negative-numbers', 4, 2, 'MinusCircle', 'Negative Numbers', 'الأعداد السالبة', 'Numbers below zero.', 'أعداد أقل من الصفر.'),
  T('exponents', 4, 3, 'Superscript', 'Exponents', 'الأسس', 'Repeated multiplication.', 'ضرب متكرر.'),
  T('square-roots', 4, 4, 'Radical', 'Square Roots', 'الجذور التربيعية', 'The opposite of squaring.', 'عكس التربيع.'),
  T('factors-multiples', 4, 5, 'Grid3x3', 'Factors & Multiples', 'العوامل والمضاعفات', 'GCD and LCM.', 'القاسم المشترك الأكبر والمضاعف المشترك الأصغر.'),
  T('primes', 4, 6, 'Sparkle', 'Prime Numbers', 'الأعداد الأولية', 'Numbers with exactly two factors.', 'أعداد لها عاملان فقط.'),
  T('expressions', 4, 7, 'Variable', 'Expressions & Variables', 'المقادير والمتغيرات', 'Letters standing for numbers.', 'حروف تمثل أعدادًا.'),
  // Level 5
  T('one-step-equations', 5, 1, 'Equal', 'One-Step Equations', 'معادلات من خطوة واحدة', 'Undo one operation.', 'إلغاء عملية واحدة.'),
  T('two-step-equations', 5, 2, 'Equal', 'Two-Step Equations', 'معادلات من خطوتين', 'Undo two operations.', 'إلغاء عمليتين.'),
  T('both-sides', 5, 3, 'ArrowLeftRight', 'Variables on Both Sides', 'متغيرات في الطرفين', 'Gather the variable first.', 'اجمع المتغير أولًا.'),
  T('simplifying-expressions', 5, 4, 'Merge', 'Simplifying Expressions', 'تبسيط المقادير', 'Combine like terms.', 'جمع الحدود المتشابهة.'),
  T('distributive', 5, 5, 'Split', 'The Distributive Property', 'خاصية التوزيع', 'Multiply into brackets.', 'الضرب داخل الأقواس.'),
  T('factoring', 5, 6, 'Binary', 'Factoring', 'التحليل إلى عوامل', 'Rewrite as a product.', 'الكتابة على صورة حاصل ضرب.'),
  T('inequalities', 5, 7, 'ChevronsLeftRight', 'Inequalities', 'المتباينات', 'Solving with < and >.', 'الحل باستخدام < و >.'),
  T('linear-functions', 5, 8, 'TrendingUp', 'Linear Functions', 'الدوال الخطية', 'Slope and intercept.', 'الميل والمقطع.'),
  // Level 6
  T('angles', 6, 1, 'Triangle', 'Angles', 'الزوايا', 'Measuring turns.', 'قياس الدوران.'),
  T('perimeter', 6, 2, 'Square', 'Perimeter', 'المحيط', 'Distance around a shape.', 'المسافة حول الشكل.'),
  T('area', 6, 3, 'RectangleHorizontal', 'Area', 'المساحة', 'Space inside a shape.', 'الحيّز داخل الشكل.'),
  T('circles', 6, 4, 'Circle', 'Circles', 'الدوائر', 'Circumference and area.', 'المحيط والمساحة.'),
  T('triangles', 6, 5, 'Triangle', 'Triangles & Pythagoras', 'المثلثات وفيثاغورس', 'The right-triangle rule.', 'قاعدة المثلث القائم.'),
  T('volume', 6, 6, 'Box', 'Volume', 'الحجم', 'Space inside solids.', 'الحيّز داخل المجسّمات.'),
  T('coordinate', 6, 7, 'Crosshair', 'Coordinate Plane', 'المستوى الإحداثي', 'Points, distance and midpoints.', 'النقاط والمسافة ومنتصف القطعة.'),
  // Level 7
  T('quadratics', 7, 1, 'Spline', 'Quadratic Equations', 'المعادلات التربيعية', 'Roots and the formula.', 'الجذور والقانون العام.'),
  T('systems', 7, 2, 'Workflow', 'Systems of Equations', 'أنظمة المعادلات', 'Two equations, two unknowns.', 'معادلتان ومجهولان.'),
  T('statistics', 7, 3, 'ChartColumn', 'Statistics', 'الإحصاء', 'Median, mode and range.', 'الوسيط والمنوال والمدى.'),
  T('probability', 7, 4, 'Dices', 'Probability', 'الاحتمال', 'How likely is it?', 'ما مدى احتمال حدوثه؟'),
  T('trigonometry', 7, 5, 'Waves', 'Trigonometry', 'حساب المثلثات', 'Sine, cosine and tangent.', 'الجيب وجيب التمام والظل.'),
  T('sequences', 7, 6, 'Rows3', 'Sequences', 'المتتاليات', 'Patterns that continue.', 'أنماط تستمر.'),
  T('logs-scientific', 7, 7, 'Atom', 'Logarithms & Scientific Notation', 'اللوغاريتمات والصيغة العلمية', 'Very large and small numbers.', 'الأعداد الكبيرة جدًا والصغيرة جدًا.'),
];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function topicsOfLevel(level: number): Topic[] {
  return TOPICS.filter((t) => t.level === level).sort((a, b) => a.order - b.order);
}
