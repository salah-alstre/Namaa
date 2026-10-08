import type { Lesson } from '@/types';
import { lesson, p } from './helpers';

export const LEVEL6_LESSONS: Lesson[] = [
  lesson('angles', {
    minutes: 7,
    explanation: [
      p('An angle measures a turn, in degrees. A full turn is 360°, a straight line 180°, a right angle 90°. Acute is less than 90°, obtuse is between 90° and 180°.', 'الزاوية تقيس دورانًا بالدرجات. الدورة الكاملة 360° والمستقيم 180° والزاوية القائمة 90°. الحادة أقل من 90° والمنفرجة بين 90° و180°.'),
      p('Complementary angles add to 90°, supplementary angles add to 180°. Angles on a straight line add to 180°.', 'الزاويتان المتتامتان مجموعهما 90° والمتكاملتان مجموعهما 180°. والزوايا على مستقيم مجموعها 180°.'),
      p('The three angles of any triangle add to 180°. In an isosceles triangle two angles are equal. An exterior angle equals the sum of the two opposite inside angles.', 'زوايا أي مثلث الثلاث مجموعها 180°. في المثلث المتساوي الساقين زاويتان متساويتان. والزاوية الخارجية تساوي مجموع الزاويتين الداخليتين البعيدتين عنها.'),
    ],
    visual: { type: 'angle', degrees: 60 },
    example: {
      problem: p('A triangle has angles 50° and 65°. Find the third angle.', 'مثلث فيه زاويتان 50° و65°. أوجد الزاوية الثالثة.'),
      steps: [
        p('Sum of two: $50 + 65 = 115$.', 'مجموع الزاويتين: $50 + 65 = 115$.'),
        p('Third: $180 - 115 = 65$.', 'الثالثة: $180 - 115 = 65$.'),
      ],
      result: p('65° (so this triangle is isosceles).', '65° (إذن المثلث متساوي الساقين).'),
    },
    why: p('Angles describe turning, slopes, buildings and navigation.', 'الزوايا تصف الدوران والانحدار والبناء والملاحة.'),
    tryGen: 'triangle-angle',
    check: ['complement', 'triangle-angle', 'isosceles', 'exterior', 'angle-types', 'straight-line'],
    keywords: p('angle degrees triangle straight line acute obtuse', 'زاوية درجات مثلث مستقيم حادة منفرجة'),
  }),
  lesson('perimeter', {
    minutes: 5,
    explanation: [
      p('Perimeter is the distance around a shape: add all the side lengths. It is measured in length units (cm, m).', 'المحيط هو المسافة حول الشكل: اجمع أطوال كل الأضلاع. ويُقاس بوحدات الطول (سم، م).'),
      p('Rectangle: $P = 2(l + w)$. Square: $P = 4s$. A regular shape with $n$ equal sides: $P = n \\times s$.', 'المستطيل: $P = 2(l + w)$. المربع: $P = 4s$. الشكل المنتظم ذو $n$ ضلعًا متساويًا: $P = n \\times s$.'),
      p('If a side is missing, use what you know. A rectangle with $P = 30$ and $l = 9$ has $w = 15 - 9 = 6$.', 'إذا نقص ضلع فاستعن بما تعرف. مستطيل محيطه $30$ وطوله $9$ عرضه $w = 15 - 9 = 6$.'),
    ],
    visual: { type: 'shape', shape: 'rect', labels: ['8 cm', '5 cm'] },
    example: {
      problem: p('How much fence is needed around a 12 m by 7 m garden?', 'كم من السياج يلزم حول حديقة أبعادها 12 م × 7 م؟'),
      steps: [
        p('$P = 2(12 + 7)$.', '$P = 2(12 + 7)$.'),
        p('$= 2 \\times 19 = 38$.', '$= 2 \\times 19 = 38$.'),
      ],
      result: p('38 m', '38 م'),
    },
    why: p('Fences, frames, borders and trimming all need the distance around.', 'الأسوار والإطارات والحدود والتزيين كلها تحتاج المسافة حول الشكل.'),
    tryGen: 'rectangle',
    check: ['rectangle', 'missing-side', 'regular', 'formula', 'fence'],
    keywords: p('perimeter distance around rectangle square', 'محيط مسافة حول مستطيل مربع'),
  }),
  lesson('area', {
    minutes: 8,
    explanation: [
      p('Area is the amount of surface inside a shape, counted in squares: cm², m². Rectangle: $A = l \\times w$. Triangle: $A = \\frac{1}{2} b h$. Trapezoid: $A = \\frac{(a+b)}{2} h$.', 'المساحة مقدار السطح داخل الشكل وتُعد بالمربعات: سم² و م². المستطيل: $A = l \\times w$. المثلث: $A = \\frac{1}{2} b h$. شبه المنحرف: $A = \\frac{(a+b)}{2} h$.'),
      p('The height is **perpendicular** to the base, not the slanted side.', 'الارتفاع **عمودي** على القاعدة وليس الضلع المائل.'),
      p('For a compound shape, split it into rectangles and triangles, find each area, and add (or subtract a hole).', 'للشكل المركب قسّمه إلى مستطيلات ومثلثات واحسب مساحة كل جزء ثم اجمع (أو اطرح الفجوة).'),
    ],
    visual: { type: 'shape', shape: 'triangle', labels: ['b = 10', 'h = 6'] },
    example: {
      problem: p('Find the area of a triangle with base 10 cm and height 6 cm.', 'أوجد مساحة مثلث قاعدته 10 سم وارتفاعه 6 سم.'),
      steps: [
        p('$A = \\frac{1}{2} \\times 10 \\times 6$.', '$A = \\frac{1}{2} \\times 10 \\times 6$.'),
        p('$= \\frac{1}{2} \\times 60 = 30$.', '$= \\frac{1}{2} \\times 60 = 30$.'),
      ],
      result: p('30 cm²', '30 سم²'),
    },
    why: p('Painting walls, buying tiles, and planning land are all area problems.', 'طلاء الجدران وشراء البلاط وتخطيط الأراضي كلها مسائل مساحة.'),
    tryGen: 'rectangle',
    check: ['rectangle', 'triangle', 'trapezoid', 'compound', 'formula', 'missing-dimension'],
    keywords: p('area square units rectangle triangle trapezoid', 'مساحة وحدات مربعة مستطيل مثلث شبه منحرف'),
  }),
  lesson('circles', {
    minutes: 7,
    explanation: [
      p('The **radius** $r$ goes from the centre to the edge; the **diameter** $d = 2r$ goes across through the centre. The edge length is the **circumference**.', '**نصف القطر** $r$ من المركز إلى المحيط، و**القطر** $d = 2r$ يعبر الدائرة عبر المركز. وطول الحافة هو **المحيط**.'),
      p('Circumference: $C = 2\\pi r = \\pi d$. Area: $A = \\pi r^2$. $\\pi \\approx 3.14$ is the same for every circle.', 'محيط الدائرة: $C = 2\\pi r = \\pi d$. المساحة: $A = \\pi r^2$. والعدد $\\pi \\approx 3.14$ هو نفسه لكل الدوائر.'),
      p('Do not mix them: circumference is a length (cm), area is a surface (cm²) and uses $r$ **squared**.', 'لا تخلط بينهما: المحيط طول (سم) والمساحة سطح (سم²) وتستخدم $r$ **مربعًا**.'),
    ],
    visual: { type: 'shape', shape: 'circle', labels: ['r = 5'] },
    example: {
      problem: p('A circle has radius 5 cm. Find its area (use $\\pi = 3.14$).', 'دائرة نصف قطرها 5 سم. أوجد مساحتها (استخدم $\\pi = 3.14$).'),
      steps: [
        p('$A = \\pi r^2 = 3.14 \\times 5^2$.', '$A = \\pi r^2 = 3.14 \\times 5^2$.'),
        p('$= 3.14 \\times 25 = 78.5$.', '$= 3.14 \\times 25 = 78.5$.'),
      ],
      result: p('78.5 cm²', '78.5 سم²'),
    },
    why: p('Wheels, pipes, plates and clocks are circles.', 'العجلات والأنابيب والصحون والساعات كلها دوائر.'),
    tryGen: 'radius-diameter',
    check: ['radius-diameter', 'parts', 'circumference', 'area', 'pi-approx', 'wheel'],
    keywords: p('circle radius diameter circumference pi area', 'دائرة نصف قطر قطر محيط باي مساحة'),
  }),
  lesson('triangles', {
    minutes: 8,
    explanation: [
      p('In a **right triangle** (one 90° angle), the longest side is the **hypotenuse** $c$, opposite the right angle. Pythagoras: $a^2 + b^2 = c^2$.', 'في **المثلث القائم** (زاوية 90°) أطول ضلع هو **الوتر** $c$ المقابل للزاوية القائمة. فيثاغورس: $a^2 + b^2 = c^2$.'),
      p('To find the hypotenuse add the squares of the legs, then take the square root. To find a leg, subtract: $a^2 = c^2 - b^2$.', 'لإيجاد الوتر اجمع مربعي الضلعين ثم خذ الجذر. ولإيجاد ضلع اطرح: $a^2 = c^2 - b^2$.'),
      p('Famous right triangles: 3-4-5, 5-12-13, 8-15-17. If three sides satisfy $a^2 + b^2 = c^2$, the triangle is right-angled.', 'مثلثات قائمة مشهورة: 3-4-5 و5-12-13 و8-15-17. إذا حققت الأضلاع الثلاثة $a^2 + b^2 = c^2$ فالمثلث قائم.'),
    ],
    visual: { type: 'shape', shape: 'right-triangle', labels: ['3', '4', '5'] },
    example: {
      problem: p('A ladder 13 m long leans on a wall, its foot 5 m from the wall. How high does it reach?', 'سلّم طوله 13 م مسنود إلى جدار وقاعدته تبعد 5 م عنه. ما الارتفاع الذي يصل إليه؟'),
      steps: [
        p('The ladder is the hypotenuse: $h^2 + 5^2 = 13^2$.', 'السلّم هو الوتر: $h^2 + 5^2 = 13^2$.'),
        p('$h^2 = 169 - 25 = 144$, so $h = 12$.', '$h^2 = 169 - 25 = 144$ إذن $h = 12$.'),
      ],
      result: p('12 m', '12 م'),
    },
    why: p('The Pythagorean theorem measures distances you cannot measure directly: ladders, screens, diagonals.', 'نظرية فيثاغورس تقيس مسافات يصعب قياسها مباشرة: السلالم والشاشات والأقطار.'),
    tryGen: 'hypotenuse',
    check: ['hypotenuse', 'missing-leg', 'is-right', 'hypotenuse-which', 'triangle-kind', 'ladder'],
    keywords: p('triangle Pythagoras hypotenuse right angle', 'مثلث فيثاغورس وتر زاوية قائمة'),
  }),
  lesson('volume', {
    minutes: 7,
    explanation: [
      p('Volume is the space inside a 3D shape, in cubic units (cm³, m³). Cuboid: $V = l \\times w \\times h$. Cube: $V = s^3$. Cylinder: $V = \\pi r^2 h$.', 'الحجم هو الحيّز داخل المجسم بوحدات مكعبة (سم³، م³). متوازي المستطيلات: $V = l \\times w \\times h$. المكعب: $V = s^3$. الأسطوانة: $V = \\pi r^2 h$.'),
      p('Think "base area × height". A cylinder is a circle stacked up to the height $h$.', 'فكّر "مساحة القاعدة × الارتفاع". الأسطوانة دائرة مرصوصة حتى الارتفاع $h$.'),
      p('Useful link: 1 litre = 1000 cm³, and 1 m³ = 1000 litres.', 'علاقة مفيدة: 1 لتر = 1000 سم³ و 1 م³ = 1000 لتر.'),
    ],
    visual: { type: 'grid', rows: 3, cols: 4, shaded: 12 },
    visualCaption: p('One layer of 12 cubes. Stack layers for volume.', 'طبقة واحدة من 12 مكعبًا. كدّس الطبقات لتحصل على الحجم.'),
    example: {
      problem: p('A fish tank is 50 cm long, 30 cm wide and 40 cm high. How many litres?', 'حوض سمك طوله 50 سم وعرضه 30 سم وارتفاعه 40 سم. كم لترًا يتسع؟'),
      steps: [
        p('$V = 50 \\times 30 \\times 40 = 60\\,000$ cm³.', '$V = 50 \\times 30 \\times 40 = 60\\,000$ سم³.'),
        p('Divide by 1000 to get litres: 60.', 'اقسم على 1000 للحصول على اللترات: 60.'),
      ],
      result: p('60 litres', '60 لترًا'),
    },
    why: p('Tanks, boxes, pipes and packaging are all about how much fits inside.', 'الخزانات والصناديق والأنابيب والتغليف كلها تدور حول ما يتسع بداخلها.'),
    tryGen: 'cuboid',
    check: ['cuboid', 'cube', 'cylinder', 'units', 'formula', 'tank'],
    keywords: p('volume cube cuboid cylinder litres', 'حجم مكعب متوازي مستطيلات أسطوانة لتر'),
  }),
  lesson('coordinate', {
    minutes: 7,
    explanation: [
      p('A point is written $(x, y)$: go **along** by $x$ first, then **up** by $y$. The axes split the plane into four quadrants; the first has both coordinates positive.', 'تُكتب النقطة $(x, y)$: تحرك **أفقيًا** بمقدار $x$ ثم **رأسيًا** بمقدار $y$. يقسم المحوران المستوى إلى أربعة أرباع، والأول إحداثياه موجبان.'),
      p('Midpoint: average the coordinates, $\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)$. Distance: $\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$, which is Pythagoras again.', 'نقطة المنتصف: متوسط الإحداثيات $\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)$. والمسافة: $\\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$ وهي فيثاغورس مرة أخرى.'),
      p('Reflecting in the $x$-axis changes the sign of $y$; reflecting in the $y$-axis changes the sign of $x$.', 'الانعكاس حول المحور $x$ يغيّر إشارة $y$، والانعكاس حول المحور $y$ يغيّر إشارة $x$.'),
    ],
    visual: { type: 'line-graph', m: 1, b: 0 },
    example: {
      problem: p('Find the distance between $(1, 2)$ and $(4, 6)$.', 'أوجد المسافة بين $(1, 2)$ و $(4, 6)$.'),
      steps: [
        p('Differences: $4 - 1 = 3$ and $6 - 2 = 4$.', 'الفروق: $4 - 1 = 3$ و $6 - 2 = 4$.'),
        p('$\\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.', '$\\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.'),
      ],
      result: p('5 units', '5 وحدات'),
    },
    why: p('Maps, screens, games and graphs all place things with coordinates.', 'الخرائط والشاشات والألعاب والرسوم البيانية كلها تحدد المواقع بالإحداثيات.'),
    tryGen: 'quadrant',
    check: ['quadrant', 'distance', 'midpoint', 'reflect', 'describe-point', 'on-axis'],
    keywords: p('coordinate plane quadrant distance midpoint reflection', 'مستوى إحداثي ربع مسافة منتصف انعكاس'),
  }),
];
