import type { GrammarTopic } from '@/english-engine/types';
import { T } from './build';

export const GRAMMAR: GrammarTopic[] = [
  {
    id: 'g-be',
    level: 'starter',
    pattern: 'be-verb',
    title: T('To be: am / is / are', 'فعل الكينونة: am / is / are'),
    summary: T('Say who or what someone is.', 'نقول من هو الشخص أو ما هو الشيء.'),
    body: [
      T('In English every sentence needs a verb. To say "I am a student", you must include am. Arabic does not need this verb, so it is easy to forget.', 'في الإنجليزية لا بد أن تحتوي كل جملة على فعل. لقول "أنا طالب" يجب أن تضيف am. العربية لا تحتاج هذا الفعل، لذلك يسهل نسيانه.'),
      T('Use am with I, is with he / she / it, and are with you / we / they.', 'استخدم am مع I، و is مع he / she / it، و are مع you / we / they.'),
    ],
    patterns: ['I am', 'You are', 'He / She / It is', 'We / You / They are'],
    examples: [
      { en: 'I am a developer.', ar: 'أنا مبرمج.' },
      { en: 'She is happy.', ar: 'هي سعيدة.' },
      { en: 'They are at home.', ar: 'هم في البيت.' },
    ],
    mistakes: [
      { wrong: 'I a student.', right: 'I am a student.', note: T('Do not drop the verb.', 'لا تحذف الفعل.') },
      { wrong: 'He are tall.', right: 'He is tall.', note: T('He goes with is.', 'He تأتي مع is.') },
    ],
  },
  {
    id: 'g-be-neg-q',
    level: 'starter',
    pattern: 'be-verb',
    title: T('To be: negative and questions', 'الكينونة: النفي والسؤال'),
    summary: T('Add not, or swap the order, to make negatives and questions.', 'أضف not أو اقلب الترتيب لتكوّن النفي والسؤال.'),
    body: [
      T('Negative: put not after am / is / are. Is not can be shortened to isn\'t; are not to aren\'t.', 'النفي: ضع not بعد am / is / are. ويمكن اختصار is not إلى isn\'t و are not إلى aren\'t.'),
      T('Question: put the verb first. "You are tired" becomes "Are you tired?".', 'السؤال: ضع الفعل أولا. "You are tired" تصبح "Are you tired?".'),
    ],
    patterns: ['I am not', 'He is not / isn\'t', 'Are you ...?', 'Is she ...?'],
    examples: [
      { en: 'I am not tired.', ar: 'أنا لست متعبا.' },
      { en: 'Is he a doctor?', ar: 'هل هو طبيب؟' },
      { en: 'Are they at school?', ar: 'هل هم في المدرسة؟' },
    ],
    mistakes: [
      { wrong: 'You are tired?', right: 'Are you tired?', note: T('Put the verb before the subject.', 'ضع الفعل قبل الفاعل.') },
      { wrong: 'I amn\'t late.', right: 'I am not late.', note: T('Do not shorten am not.', 'لا نختصر am not هكذا.') },
    ],
  },
  {
    id: 'g-articles',
    level: 'starter',
    pattern: 'article',
    title: T('A, an and the', 'أدوات التنكير والتعريف: a / an / the'),
    summary: T('Use a / an for one of something, the for a specific thing.', 'استخدم a / an لشيء واحد غير محدد و the لشيء محدد.'),
    body: [
      T('Use a before a consonant sound (a book) and an before a vowel sound (an apple).', 'استخدم a قبل صوت ساكن (a book) و an قبل صوت متحرك (an apple).'),
      T('Use the when both people know which one: "The book is on the table."', 'استخدم the عندما يعرف المتحدث والسامع أي شيء تقصد: "The book is on the table."'),
    ],
    patterns: ['a + consonant sound', 'an + vowel sound', 'the + specific thing'],
    examples: [
      { en: 'I have a pen.', ar: 'عندي قلم.' },
      { en: 'She eats an apple.', ar: 'هي تأكل تفاحة.' },
      { en: 'The teacher is kind.', ar: 'المعلم لطيف.' },
    ],
    mistakes: [
      { wrong: 'I have a apple.', right: 'I have an apple.', note: T('Apple starts with a vowel sound.', 'كلمة apple تبدأ بصوت متحرك.') },
      { wrong: 'I am student.', right: 'I am a student.', note: T('Singular jobs need a / an.', 'المهن بصيغة المفرد تحتاج a / an.') },
    ],
  },
  {
    id: 'g-plural',
    level: 'starter',
    pattern: 'plural',
    title: T('Plural nouns', 'جمع الأسماء'),
    summary: T('Add -s for more than one.', 'أضف -s عند وجود أكثر من واحد.'),
    body: [
      T('Most nouns add -s: book → books. Nouns ending in -s, -sh, -ch, -x add -es: box → boxes.', 'معظم الأسماء تضيف -s: book → books. والأسماء المنتهية بـ -s أو -sh أو -ch أو -x تضيف -es: box → boxes.'),
      T('A few are irregular: man → men, woman → women, child → children.', 'بعضها شاذ: man → men و woman → women و child → children.'),
    ],
    patterns: ['book → books', 'box → boxes', 'child → children'],
    examples: [
      { en: 'I have two books.', ar: 'عندي كتابان.' },
      { en: 'The children are happy.', ar: 'الأطفال سعداء.' },
    ],
    mistakes: [
      { wrong: 'two book', right: 'two books', note: T('After a number above one, use the plural.', 'بعد رقم أكبر من واحد استخدم الجمع.') },
    ],
  },
  {
    id: 'g-this-that',
    level: 'starter',
    pattern: 'demonstrative',
    title: T('This, that, these, those', 'أسماء الإشارة'),
    summary: T('Point at things that are near or far.', 'للإشارة إلى القريب والبعيد.'),
    body: [
      T('This / these are for things near you. That / those are for things far from you. This and that are singular; these and those are plural.', 'this / these للقريب، و that / those للبعيد. this و that للمفرد، و these و those للجمع.'),
    ],
    patterns: ['This is ...', 'That is ...', 'These are ...', 'Those are ...'],
    examples: [
      { en: 'This is my bag.', ar: 'هذه حقيبتي.' },
      { en: 'Those are his shoes.', ar: 'تلك أحذيته.' },
    ],
    mistakes: [{ wrong: 'These is my book.', right: 'This is my book.', note: T('Match the singular with this.', 'المفرد مع this.') }],
  },
  {
    id: 'g-present-simple',
    level: 'a1',
    pattern: 'present-simple',
    title: T('Present simple', 'المضارع البسيط'),
    summary: T('Habits, routines and facts.', 'للعادات والروتين والحقائق.'),
    body: [
      T('Use the base verb with I / you / we / they: I work. With he / she / it add -s: she works.', 'استخدم الفعل الأساسي مع I / you / we / they: I work. ومع he / she / it أضف -s: she works.'),
      T('Verbs ending in -s, -sh, -ch, -o, -x add -es: watch → watches, go → goes. Consonant + y becomes -ies: study → studies.', 'الأفعال المنتهية بـ -s أو -sh أو -ch أو -o أو -x تضيف -es: watch → watches. وإذا سبق y حرف ساكن تصبح -ies: study → studies.'),
    ],
    patterns: ['I / you / we / they + verb', 'he / she / it + verb + s'],
    examples: [
      { en: 'I drink tea every morning.', ar: 'أشرب الشاي كل صباح.' },
      { en: 'He works in a bank.', ar: 'هو يعمل في بنك.' },
      { en: 'She studies English.', ar: 'هي تدرس الإنجليزية.' },
    ],
    mistakes: [
      { wrong: 'He work here.', right: 'He works here.', note: T('Add -s with he / she / it.', 'أضف -s مع he / she / it.') },
      { wrong: 'She studys.', right: 'She studies.', note: T('Consonant + y → -ies.', 'حرف ساكن + y ← -ies.') },
    ],
  },
  {
    id: 'g-do-does',
    level: 'a1',
    pattern: 'do-does',
    title: T('Do and does: questions and negatives', 'do و does: الأسئلة والنفي'),
    summary: T('Present simple questions and negatives need do / does.', 'أسئلة ونفي المضارع البسيط تحتاج do / does.'),
    body: [
      T('Use do / don\'t with I, you, we, they and does / doesn\'t with he, she, it. After does the main verb loses its -s.', 'استخدم do / don\'t مع I, you, we, they و does / doesn\'t مع he, she, it. وبعد does يفقد الفعل الأساسي حرف s.'),
    ],
    patterns: ['Do you like tea?', 'Does she work here?', 'I don\'t know.', 'He doesn\'t drink coffee.'],
    examples: [
      { en: 'Do you speak English?', ar: 'هل تتحدث الإنجليزية؟' },
      { en: 'She doesn\'t like coffee.', ar: 'هي لا تحب القهوة.' },
    ],
    mistakes: [
      { wrong: 'Does he works here?', right: 'Does he work here?', note: T('After does, use the base verb.', 'بعد does استخدم الفعل الأساسي.') },
      { wrong: 'He don\'t like tea.', right: 'He doesn\'t like tea.', note: T('He goes with doesn\'t.', 'He مع doesn\'t.') },
    ],
  },
  {
    id: 'g-wh',
    level: 'a1',
    pattern: 'question-word',
    title: T('Question words', 'أدوات الاستفهام'),
    summary: T('What, where, who, when, why, how.', 'what و where و who و when و why و how.'),
    body: [
      T('Put the question word first, then the verb: "Where is the bank?", "What do you do?".', 'ضع أداة الاستفهام أولا ثم الفعل: "Where is the bank?" و "What do you do?".'),
    ],
    patterns: ['What + is / do ...?', 'Where + is / are ...?', 'Who + is ...?', 'How + are you?'],
    examples: [
      { en: 'Where do you live?', ar: 'أين تسكن؟' },
      { en: 'What time is it?', ar: 'كم الساعة؟' },
    ],
    mistakes: [{ wrong: 'Where you live?', right: 'Where do you live?', note: T('Do not forget do / does.', 'لا تنس do / does.') }],
  },
  {
    id: 'g-prepositions',
    level: 'a1',
    pattern: 'preposition',
    title: T('In, on, at, under', 'حروف الجر: in / on / at / under'),
    summary: T('Where things are, and when things happen.', 'مكان الأشياء ووقت حدوثها.'),
    body: [
      T('In = inside (in the bag). On = on a surface (on the table). Under = below. Next to = beside.', 'in = داخل، on = فوق سطح، under = تحت، next to = بجانب.'),
      T('For time: at + clock time (at 5), on + day (on Monday), in + month / year (in May).', 'للزمن: at مع الساعة، on مع اليوم، in مع الشهر والسنة.'),
    ],
    patterns: ['in the room', 'on the table', 'at 7 o\'clock', 'on Friday', 'in July'],
    examples: [
      { en: 'The pen is on the table.', ar: 'القلم على الطاولة.' },
      { en: 'I wake up at six.', ar: 'أستيقظ في السادسة.' },
    ],
    mistakes: [{ wrong: 'I work in Monday.', right: 'I work on Monday.', note: T('Days take on.', 'الأيام مع on.') }],
  },
  {
    id: 'g-have-got',
    level: 'a1',
    pattern: 'have',
    title: T('Have / has and possessives', 'have / has وصيغ الملكية'),
    summary: T('Say what you own, and use my / your / his / her.', 'للتعبير عن الملكية.'),
    body: [
      T('Use have with I / you / we / they and has with he / she / it. my, your, his, her, our, their go before a noun.', 'استخدم have مع I / you / we / they و has مع he / she / it. وكلمات my و your و his و her و our و their تأتي قبل الاسم.'),
    ],
    patterns: ['I have a car.', 'She has two sisters.', 'my / your / his / her + noun'],
    examples: [
      { en: 'He has a new phone.', ar: 'عنده هاتف جديد.' },
      { en: 'Her name is Lina.', ar: 'اسمها لينا.' },
    ],
    mistakes: [{ wrong: 'She have a dog.', right: 'She has a dog.', note: T('She goes with has.', 'She مع has.') }],
  },
  {
    id: 'g-past-simple',
    level: 'a2',
    pattern: 'past-simple',
    title: T('Past simple', 'الماضي البسيط'),
    summary: T('Finished actions in the past.', 'أحداث انتهت في الماضي.'),
    body: [
      T('Regular verbs add -ed: work → worked. Irregular verbs change: go → went, eat → ate, have → had.', 'الأفعال المنتظمة تضيف -ed: work → worked. والشاذة تتغير: go → went و eat → ate.'),
      T('Questions and negatives use did + base verb: "Did you go?", "I did not go."', 'الأسئلة والنفي تستخدم did + الفعل الأساسي: "Did you go?" و "I did not go."'),
    ],
    patterns: ['verb + ed', 'went / ate / had ...', 'Did you + verb?', 'didn\'t + verb'],
    examples: [
      { en: 'I visited my uncle yesterday.', ar: 'زرت عمي أمس.' },
      { en: 'She didn\'t go to school.', ar: 'هي لم تذهب إلى المدرسة.' },
    ],
    mistakes: [
      { wrong: 'I goed to school.', right: 'I went to school.', note: T('Go is irregular.', 'الفعل go شاذ.') },
      { wrong: 'Did you went?', right: 'Did you go?', note: T('After did, use the base verb.', 'بعد did استخدم الفعل الأساسي.') },
    ],
  },
  {
    id: 'g-comparatives',
    level: 'a2',
    pattern: 'comparative',
    title: T('Comparatives and superlatives', 'المقارنة والتفضيل'),
    summary: T('Compare two things, or pick the best of many.', 'للمقارنة بين شيئين أو اختيار الأفضل.'),
    body: [
      T('Short adjectives: add -er and than (taller than). Long adjectives: more + adjective (more expensive than).', 'الصفات القصيرة: أضف -er مع than (taller than). والطويلة: more + الصفة (more expensive than).'),
      T('The best of three or more: the + -est (the tallest) or the most + adjective.', 'للأفضل بين ثلاثة أو أكثر: the + -est أو the most + الصفة.'),
    ],
    patterns: ['taller than', 'more expensive than', 'the tallest', 'the most beautiful'],
    examples: [
      { en: 'My brother is taller than me.', ar: 'أخي أطول مني.' },
      { en: 'This is the best book.', ar: 'هذا أفضل كتاب.' },
    ],
    mistakes: [{ wrong: 'more taller', right: 'taller', note: T('Do not use more with -er.', 'لا تجمع more مع -er.') }],
  },
  {
    id: 'g-future',
    level: 'a2',
    pattern: 'future',
    title: T('Future: will and going to', 'المستقبل: will و going to'),
    summary: T('Plans, predictions and quick decisions.', 'الخطط والتوقعات والقرارات السريعة.'),
    body: [
      T('Use going to for plans you already made: "I am going to study tonight." Use will for quick decisions and predictions: "I will help you."', 'استخدم going to للخطط المسبقة، و will للقرارات الفورية والتوقعات.'),
    ],
    patterns: ['am / is / are going to + verb', 'will + verb'],
    examples: [
      { en: 'We are going to travel next week.', ar: 'سنسافر الأسبوع القادم.' },
      { en: 'I will carry your bag.', ar: 'سأحمل حقيبتك.' },
    ],
    mistakes: [{ wrong: 'I will to go.', right: 'I will go.', note: T('No to after will.', 'لا نضع to بعد will.') }],
  },
  {
    id: 'g-present-perfect',
    level: 'b1',
    pattern: 'present-perfect',
    title: T('Present perfect', 'المضارع التام'),
    summary: T('Experiences and results that matter now.', 'التجارب والنتائج المرتبطة بالحاضر.'),
    body: [
      T('Form: have / has + past participle (been, seen, done). Use it for life experience ("I have visited Turkey") and for changes up to now.', 'الصيغة: have / has + التصريف الثالث. تستخدم للتجارب ("I have visited Turkey") وللتغيرات حتى الآن.'),
      T('Do not use it with a finished time word like yesterday. Use the past simple instead.', 'لا تستخدمه مع وقت منتهٍ مثل yesterday، بل استخدم الماضي البسيط.'),
    ],
    patterns: ['have / has + past participle', 'ever / never / already / yet'],
    examples: [
      { en: 'I have never eaten sushi.', ar: 'لم آكل السوشي من قبل.' },
      { en: 'She has finished her homework.', ar: 'لقد أنهت واجبها.' },
    ],
    mistakes: [{ wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.', note: T('Yesterday needs the past simple.', 'مع yesterday نستخدم الماضي البسيط.') }],
  },
  {
    id: 'g-conditionals',
    level: 'b1',
    pattern: 'conditional',
    title: T('First conditional', 'الجملة الشرطية الأولى'),
    summary: T('Real possibilities in the future.', 'احتمالات حقيقية في المستقبل.'),
    body: [
      T('If + present simple, will + base verb: "If it rains, we will stay home."', 'If + مضارع بسيط، will + فعل أساسي: "If it rains, we will stay home."'),
    ],
    patterns: ['If + present, will + verb'],
    examples: [
      { en: 'If you study, you will pass.', ar: 'إذا درست فستنجح.' },
    ],
    mistakes: [{ wrong: 'If it will rain, we stay.', right: 'If it rains, we will stay.', note: T('No will in the if-part.', 'لا نضع will في جزء if.') }],
  },
  {
    id: 'g-passive',
    level: 'b2',
    pattern: 'passive',
    title: T('Passive voice', 'المبني للمجهول'),
    summary: T('Focus on the action, not who did it.', 'التركيز على الحدث لا على فاعله.'),
    body: [
      T('Form: be + past participle. "They built the bridge in 1990" becomes "The bridge was built in 1990."', 'الصيغة: be + التصريف الثالث. "They built the bridge" تصبح "The bridge was built".'),
    ],
    patterns: ['is / are + past participle', 'was / were + past participle'],
    examples: [
      { en: 'English is spoken all over the world.', ar: 'تُتحدث الإنجليزية في كل أنحاء العالم.' },
    ],
    mistakes: [{ wrong: 'The door was open by him.', right: 'The door was opened by him.', note: T('Use the past participle.', 'استخدم التصريف الثالث.') }],
  },
  {
    id: 'g-reported',
    level: 'b2',
    pattern: 'reported-speech',
    title: T('Reported speech', 'الكلام المنقول'),
    summary: T('Tell what someone said.', 'نقل ما قاله شخص آخر.'),
    body: [
      T('Move the verb one step back: "I am tired" → He said he was tired. am / is → was, will → would, can → could.', 'ارجع بالفعل خطوة للخلف: "I am tired" ← He said he was tired.'),
    ],
    patterns: ['said (that) + past', 'told me (that) ...'],
    examples: [
      { en: 'She said she was busy.', ar: 'قالت إنها مشغولة.' },
    ],
    mistakes: [{ wrong: 'He said me that he is late.', right: 'He told me that he was late.', note: T('Use told me, not said me.', 'استخدم told me وليس said me.') }],
  },
];

export const GRAMMAR_BY_ID: Record<string, GrammarTopic> = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]));

/** Short Arabic-first hint per mistake pattern, shown in the Mistakes center. */
export const PATTERN_LABELS: Record<string, { en: string; ar: string; grammarId?: string }> = {
  'be-verb': { en: 'am / is / are', ar: 'am / is / are', grammarId: 'g-be' },
  article: { en: 'Articles (a / an / the)', ar: 'أدوات التنكير والتعريف', grammarId: 'g-articles' },
  plural: { en: 'Plural nouns', ar: 'جمع الأسماء', grammarId: 'g-plural' },
  demonstrative: { en: 'this / that / these / those', ar: 'أسماء الإشارة', grammarId: 'g-this-that' },
  'present-simple': { en: 'Present simple', ar: 'المضارع البسيط', grammarId: 'g-present-simple' },
  'do-does': { en: 'do / does', ar: 'do / does', grammarId: 'g-do-does' },
  'question-word': { en: 'Question words', ar: 'أدوات الاستفهام', grammarId: 'g-wh' },
  preposition: { en: 'Prepositions', ar: 'حروف الجر', grammarId: 'g-prepositions' },
  have: { en: 'have / has', ar: 'have / has', grammarId: 'g-have-got' },
  'past-simple': { en: 'Past simple', ar: 'الماضي البسيط', grammarId: 'g-past-simple' },
  comparative: { en: 'Comparatives', ar: 'المقارنة', grammarId: 'g-comparatives' },
  future: { en: 'Future', ar: 'المستقبل', grammarId: 'g-future' },
  'present-perfect': { en: 'Present perfect', ar: 'المضارع التام', grammarId: 'g-present-perfect' },
  conditional: { en: 'Conditionals', ar: 'الجمل الشرطية', grammarId: 'g-conditionals' },
  passive: { en: 'Passive voice', ar: 'المبني للمجهول', grammarId: 'g-passive' },
  'reported-speech': { en: 'Reported speech', ar: 'الكلام المنقول', grammarId: 'g-reported' },
  'word-order': { en: 'Word order', ar: 'ترتيب الكلمات' },
  vocabulary: { en: 'Vocabulary', ar: 'المفردات' },
  spelling: { en: 'Spelling', ar: 'الإملاء' },
  listening: { en: 'Listening', ar: 'الاستماع' },
  reading: { en: 'Reading', ar: 'القراءة' },
};
