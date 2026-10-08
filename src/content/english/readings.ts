import type { EnLevel, Reading } from '@/english-engine/types';
import { T, readComp, readTf } from './build';

type Q = Reading['questions'][number];

interface Def {
  id: string;
  level: EnLevel;
  title: [string, string];
  paragraphs: string[];
  translation: string[];
  gloss: Record<string, string>;
  /** [prompt, options, answerIndex] */
  mc: [string, string[], number][];
  /** [statement, answer] */
  tf: [string, boolean][];
}

const make = (d: Def): Reading => {
  const passage = d.paragraphs.join(' ');
  const questions: Q[] = [
    ...d.mc.map(([p, o, a], i) => readComp(`${d.id}-q${i + 1}`, passage, p, o, a)),
    ...d.tf.map(([s, a], i) => readTf(`${d.id}-t${i + 1}`, s, a)),
  ];
  return {
    id: d.id,
    level: d.level,
    title: T(d.title[0], d.title[1]),
    paragraphs: d.paragraphs,
    translation: d.translation,
    questions,
    gloss: d.gloss,
  };
};

export const READINGS: Reading[] = [
  make({
    id: 'rd-st-my-name',
    level: 'starter',
    title: ['My name is Sara', 'اسمي سارة'],
    paragraphs: [
      'Hello! My name is Sara. I am a student. I am happy.',
      'I have a cat. The cat is white. I like my cat.',
    ],
    translation: [
      'مرحبا! اسمي سارة. أنا طالبة. أنا سعيدة.',
      'لدي قطة. القطة بيضاء. أحب قطتي.',
    ],
    gloss: { hello: 'مرحبا', name: 'اسم', student: 'طالب', happy: 'سعيد', cat: 'قطة', white: 'أبيض', like: 'يحب' },
    mc: [
      ['What is her name?', ['Sara', 'Sam', 'Salma'], 0],
      ['What colour is the cat?', ['Black', 'White', 'Red'], 1],
    ],
    tf: [['Sara is a teacher.', false], ['Sara has a cat.', true]],
  }),
  make({
    id: 'rd-st-my-family',
    level: 'starter',
    title: ['My family', 'عائلتي'],
    paragraphs: [
      'This is my family. My father is a doctor. My mother is a teacher.',
      'I have one brother and one sister. We are happy. We eat bread and eggs in the morning.',
    ],
    translation: [
      'هذه عائلتي. أبي طبيب. أمي معلمة.',
      'لدي أخ واحد وأخت واحدة. نحن سعداء. نأكل الخبز والبيض في الصباح.',
    ],
    gloss: { family: 'عائلة', father: 'أب', doctor: 'طبيب', mother: 'أم', teacher: 'معلم', brother: 'أخ', sister: 'أخت', bread: 'خبز', eggs: 'بيض', morning: 'صباح' },
    mc: [
      ['What is the father?', ['A teacher', 'A doctor', 'A student'], 1],
      ['How many brothers does the writer have?', ['One', 'Two', 'Three'], 0],
    ],
    tf: [['The family eats rice in the morning.', false], ['The mother is a teacher.', true]],
  }),
  make({
    id: 'rd-a1-daily-day',
    level: 'a1',
    title: ['A day in the life of Omar', 'يوم في حياة عمر'],
    paragraphs: [
      'Omar gets up at six o\'clock every morning. He washes his face and eats breakfast with his family. He usually drinks tea and eats bread and cheese.',
      'He works in a shop in the city. The shop opens at nine and closes at six. Omar likes his job because he meets many people.',
      'In the evening he goes home. He cooks dinner and watches TV. He goes to bed at ten.',
    ],
    translation: [
      'يستيقظ عمر في السادسة كل صباح. يغسل وجهه ويتناول الفطور مع عائلته. غالبا يشرب الشاي ويأكل الخبز والجبن.',
      'يعمل في متجر في المدينة. يفتح المتجر في التاسعة ويغلق في السادسة. يحب عمر عمله لأنه يقابل كثيرا من الناس.',
      'في المساء يعود إلى البيت. يطبخ العشاء ويشاهد التلفاز. ينام في العاشرة.',
    ],
    gloss: { cheese: 'جبن', evening: 'مساء', meets: 'يقابل', usually: 'غالبا', face: 'وجه', cooks: 'يطبخ', opens: 'يفتح', closes: 'يغلق', job: 'عمل', people: 'ناس' },
    mc: [
      ['What time does Omar get up?', ['At five', 'At six', 'At nine'], 1],
      ['Why does he like his job?', ['It is near his house', 'He meets many people', 'It is easy'], 1],
      ['What does Omar do in the evening?', ['He cooks dinner', 'He opens the shop', 'He eats breakfast'], 0],
    ],
    tf: [['The shop opens at six.', false], ['Omar goes to bed at ten.', true]],
  }),
  make({
    id: 'rd-a1-my-city',
    level: 'a1',
    title: ['My city', 'مدينتي'],
    paragraphs: [
      'I live in a big city. There are many shops, a park and a hospital near my house. The streets are busy in the morning.',
      'My favourite place is the park. It is quiet and beautiful. On Friday I walk there with my friends. We talk and drink juice.',
    ],
    translation: [
      'أعيش في مدينة كبيرة. توجد متاجر كثيرة وحديقة ومستشفى قرب بيتي. الشوارع مزدحمة في الصباح.',
      'مكاني المفضل هو الحديقة. إنها هادئة وجميلة. يوم الجمعة أتمشى هناك مع أصدقائي. نتحدث ونشرب العصير.',
    ],
    gloss: { favourite: 'مفضل', quiet: 'هادئ', talk: 'يتحدث', busy: 'مزدحم', park: 'حديقة', hospital: 'مستشفى', streets: 'شوارع' },
    mc: [
      ['What is the writer\'s favourite place?', ['The shop', 'The park', 'The hospital'], 1],
      ['When does the writer go to the park?', ['On Friday', 'On Monday', 'Every night'], 0],
    ],
    tf: [['The streets are quiet in the morning.', false], ['The writer drinks juice with friends.', true]],
  }),
  make({
    id: 'rd-a2-trip',
    level: 'a2',
    title: ['A weekend trip', 'رحلة نهاية الأسبوع'],
    paragraphs: [
      'Last weekend we visited my uncle in Alexandria. We took an early train, and the journey was comfortable. When we arrived, the weather was sunny but a little cold.',
      'We walked along the sea and ate delicious fish for lunch. In the afternoon it started to rain, so we went back to the house and played cards.',
      'I enjoyed the trip very much. Next month I am going to visit him again, and I will take my camera.',
    ],
    translation: [
      'في نهاية الأسبوع الماضي زرنا عمي في الإسكندرية. ركبنا قطارا مبكرا وكانت الرحلة مريحة. عندما وصلنا كان الطقس مشمسا لكنه بارد قليلا.',
      'مشينا على طول البحر وأكلنا سمكا لذيذا على الغداء. بعد الظهر بدأ المطر، فعدنا إلى البيت ولعبنا الورق.',
      'استمتعت بالرحلة كثيرا. في الشهر القادم سأزوره مجددا وسآخذ كاميرتي.',
    ],
    gloss: { uncle: 'عم / خال', journey: 'رحلة', arrived: 'وصل', sea: 'بحر', afternoon: 'بعد الظهر', camera: 'كاميرا', cards: 'ورق اللعب', along: 'على طول' },
    mc: [
      ['How did they travel?', ['By car', 'By train', 'By plane'], 1],
      ['What did they do when it rained?', ['Went to the sea', 'Played cards at the house', 'Ate lunch'], 1],
      ['What will the writer do next month?', ['Visit the uncle again', 'Buy a camera', 'Stay home'], 0],
    ],
    tf: [['The weather was rainy when they arrived.', false], ['They ate fish for lunch.', true]],
  }),
  make({
    id: 'rd-a2-new-job',
    level: 'a2',
    title: ['A new job', 'وظيفة جديدة'],
    paragraphs: [
      'Huda has a new job at a travel company. She is a customer assistant, and she answers phone calls and writes messages to customers.',
      'Her manager is very kind. Yesterday he gave her an important task: she has to prepare a meeting for next Tuesday. Huda was nervous, but she decided to work carefully and ask for advice when she needs it.',
    ],
    translation: [
      'لدى هدى وظيفة جديدة في شركة سفر. هي مساعدة عملاء، وترد على المكالمات وتكتب الرسائل للعملاء.',
      'مديرها لطيف جدا. أمس أعطاها مهمة مهمة: عليها أن تجهز لاجتماع يوم الثلاثاء القادم. كانت هدى متوترة لكنها قررت أن تعمل بعناية وتطلب النصيحة عند الحاجة.',
    ],
    gloss: { assistant: 'مساعد', kind: 'لطيف', task: 'مهمة', nervous: 'متوتر', calls: 'مكالمات', carefully: 'بعناية' },
    mc: [
      ['Where does Huda work?', ['At a school', 'At a travel company', 'At a hospital'], 1],
      ['What must she prepare?', ['A trip', 'A meeting', 'A report'], 1],
    ],
    tf: [['Her manager is unkind.', false], ['Huda decided to work carefully.', true]],
  }),
  make({
    id: 'rd-b1-learning',
    level: 'b1',
    title: ['Learning a language', 'تعلّم لغة'],
    paragraphs: [
      'Many people believe that learning a language is only about memorising words. However, experts suggest that regular practice is far more important than long study sessions.',
      'If you study for twenty minutes every day, you will probably improve faster than someone who studies for three hours once a week. Although it feels slow at first, small habits create real progress.',
      'Therefore, the best advice is simple: be patient, listen a lot, and do not avoid making mistakes. Mistakes are an opportunity to learn.',
    ],
    translation: [
      'يعتقد كثير من الناس أن تعلم لغة يعني فقط حفظ الكلمات. ومع ذلك يقترح الخبراء أن الممارسة المنتظمة أهم بكثير من جلسات الدراسة الطويلة.',
      'إذا درست عشرين دقيقة كل يوم فمن المحتمل أن تتحسن أسرع ممن يدرس ثلاث ساعات مرة في الأسبوع. ومع أن الأمر يبدو بطيئا في البداية، فالعادات الصغيرة تصنع تقدما حقيقيا.',
      'لذلك فأفضل نصيحة بسيطة: كن صبورا واستمع كثيرا ولا تتجنب الأخطاء. الأخطاء فرصة للتعلم.',
    ],
    gloss: { memorising: 'حفظ', experts: 'خبراء', habits: 'عادات', patient: 'صبور', regular: 'منتظم', sessions: 'جلسات', progress: 'تقدم' },
    mc: [
      ['What do experts say is most important?', ['Long study sessions', 'Regular practice', 'Memorising words'], 1],
      ['What is the best advice in the text?', ['Avoid mistakes', 'Study once a week', 'Be patient and listen a lot'], 2],
    ],
    tf: [['Studying 20 minutes daily can be better than 3 hours weekly.', true], ['The writer says mistakes should be avoided.', false]],
  }),
  make({
    id: 'rd-b2-attention',
    level: 'b2',
    title: ['The attention economy', 'اقتصاد الانتباه'],
    paragraphs: [
      'Every notification competes for a share of our attention, and companies deliberately design apps to keep us scrolling. Whereas earlier technologies mostly saved time, many modern platforms consume it.',
      'Researchers acknowledge that the consequences are considerable: shorter concentration, disturbed sleep and, for some, a growing sense of inequality when comparing lives online. Nevertheless, it would be a mistake to assume that technology itself is the problem.',
      'The attitude we bring matters. Setting limits, turning off alerts and choosing what deserves our focus are small steps that contribute to a more sustainable relationship with our devices.',
    ],
    translation: [
      'كل إشعار ينافس على حصة من انتباهنا، وتصمم الشركات التطبيقات عمدا لتبقينا نتصفح. وبينما وفّرت التقنيات القديمة الوقت غالبا، تستهلكه كثير من المنصات الحديثة.',
      'يقر الباحثون بأن العواقب كبيرة: تركيز أقصر ونوم مضطرب، وعند بعضهم شعور متزايد بعدم المساواة عند مقارنة الحياة على الإنترنت. ومع ذلك سيكون من الخطأ أن نفترض أن التقنية نفسها هي المشكلة.',
      'الموقف الذي نتبناه مهم. وضع حدود وإيقاف التنبيهات واختيار ما يستحق تركيزنا خطوات صغيرة تسهم في علاقة أكثر استدامة بأجهزتنا.',
    ],
    gloss: { notification: 'إشعار', scrolling: 'تمرير الشاشة', concentration: 'تركيز', alerts: 'تنبيهات', devices: 'أجهزة', disturbed: 'مضطرب', researchers: 'باحثون' },
    mc: [
      ['What do many modern platforms do with our time?', ['Save it', 'Consume it', 'Measure it'], 1],
      ['What is the writer\'s main message?', ['Technology is the only problem', 'Our attitude and limits matter', 'Apps should be banned'], 1],
      ['Which is NOT mentioned as a consequence?', ['Disturbed sleep', 'Shorter concentration', 'Higher salaries'], 2],
    ],
    tf: [['The writer thinks technology itself is entirely to blame.', false], ['Turning off alerts is suggested.', true]],
  }),
];

export const READING_BY_ID: Record<string, Reading> = Object.fromEntries(READINGS.map((r) => [r.id, r]));
export const readingsOfLevel = (level: EnLevel) => READINGS.filter((r) => r.level === level);
