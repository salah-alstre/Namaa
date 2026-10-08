import type { EnLevel, ListeningItem } from '@/english-engine/types';
import { T, listenChoose, listenType, mcq, tf } from './build';

const item = (
  id: string,
  level: EnLevel,
  title: [string, string],
  lines: ListeningItem['lines'],
  questions: ListeningItem['questions'],
): ListeningItem => ({ id, level, title: T(title[0], title[1]), lines, questions });

export const LISTENING: ListeningItem[] = [
  item('ls-st-greet', 'starter', ['Hello and goodbye', 'مرحبا ومع السلامة'],
    [
      { who: 'Sam', text: 'Hello! My name is Sam.', ar: 'مرحبا! اسمي سام.' },
      { who: 'Mona', text: 'Hello, Sam. I am Mona.', ar: 'مرحبا يا سام. أنا منى.' },
      { who: 'Sam', text: 'Goodbye, Mona.', ar: 'مع السلامة يا منى.' },
    ],
    [
      listenChoose('ls-st-greet-1', 'My name is Sam.', 'What is the name?', ['Sam', 'Mona', 'Sara'], 0),
      listenType('ls-st-greet-2', 'Hello, I am Mona.', ['Hello I am Mona', 'Hello I\'m Mona']),
      tf('ls-st-greet-3', 'Mona says goodbye first.', false, { skill: 'listening' }),
    ]),
  item('ls-st-numbers', 'starter', ['Numbers', 'الأعداد'],
    [
      { text: 'One, two, three, four, five.', ar: 'واحد، اثنان، ثلاثة، أربعة، خمسة.' },
      { text: 'I have three books and two pens.', ar: 'لدي ثلاثة كتب وقلمان.' },
    ],
    [
      listenChoose('ls-st-num-1', 'I have three books.', 'How many books?', ['Two', 'Three', 'Five'], 1),
      listenType('ls-st-num-2', 'I have two pens.', ['I have two pens']),
    ]),
  item('ls-a1-cafe', 'a1', ['At the cafe', 'في المقهى'],
    [
      { who: 'Waiter', text: 'Good morning. What would you like?', ar: 'صباح الخير. ماذا تريد؟' },
      { who: 'Ali', text: 'I want a coffee and a sandwich, please.', ar: 'أريد قهوة وشطيرة من فضلك.' },
      { who: 'Waiter', text: 'Anything else?', ar: 'أي شيء آخر؟' },
      { who: 'Ali', text: 'No, thank you.', ar: 'لا، شكرا.' },
    ],
    [
      listenChoose('ls-a1-cafe-1', 'I want a coffee and a sandwich, please.', 'What does Ali want?', ['Tea and bread', 'Coffee and a sandwich', 'Juice and rice'], 1),
      tf('ls-a1-cafe-2', 'Ali wants something else.', false, { skill: 'listening' }),
      listenType('ls-a1-cafe-3', 'Good morning. What would you like?', ['Good morning What would you like']),
    ]),
  item('ls-a1-routine', 'a1', ['My morning', 'صباحي'],
    [
      { text: 'I get up at seven. I wash my face and drink tea.', ar: 'أستيقظ في السابعة. أغسل وجهي وأشرب الشاي.' },
      { text: 'Then I go to work by bus.', ar: 'ثم أذهب إلى العمل بالحافلة.' },
    ],
    [
      listenChoose('ls-a1-rt-1', 'I get up at seven.', 'What time does the speaker get up?', ['At six', 'At seven', 'At eight'], 1),
      mcq('ls-a1-rt-2', 'How does the speaker go to work?', ['By bus', 'By car', 'On foot'], 0, { skill: 'listening' }),
      listenType('ls-a1-rt-3', 'Then I go to work by bus.', ['Then I go to work by bus']),
    ]),
  item('ls-a2-airport', 'a2', ['At the airport', 'في المطار'],
    [
      { who: 'Officer', text: 'Can I see your passport, please?', ar: 'هل يمكنني رؤية جواز سفرك من فضلك؟' },
      { who: 'Tom', text: 'Here you are. I am visiting my friend for a week.', ar: 'تفضل. أزور صديقي لمدة أسبوع.' },
      { who: 'Officer', text: 'Enjoy your stay.', ar: 'أتمنى لك إقامة ممتعة.' },
    ],
    [
      listenChoose('ls-a2-ap-1', 'I am visiting my friend for a week.', 'How long will Tom stay?', ['A day', 'A week', 'A month'], 1),
      listenType('ls-a2-ap-2', 'Can I see your passport, please?', ['Can I see your passport please']),
      tf('ls-a2-ap-3', 'Tom is visiting his brother.', false, { skill: 'listening' }),
    ]),
  item('ls-b1-advice', 'b1', ['Asking for advice', 'طلب النصيحة'],
    [
      { who: 'Lina', text: 'I have an interview tomorrow and I am nervous.', ar: 'لدي مقابلة غدا وأنا متوترة.' },
      { who: 'Karim', text: 'I suggest you prepare a few answers. If you stay calm, you will probably do well.', ar: 'أقترح أن تجهزي بعض الإجابات. إذا بقيت هادئة فمن المحتمل أن تنجحي.' },
    ],
    [
      listenChoose('ls-b1-adv-1', 'I suggest you prepare a few answers.', 'What does Karim suggest?', ['Cancel the interview', 'Prepare answers', 'Buy new clothes'], 1),
      listenType('ls-b1-adv-2', 'If you stay calm, you will probably do well.', ['If you stay calm you will probably do well']),
    ]),
  item('ls-b2-news', 'b2', ['A news headline', 'عنوان خبر'],
    [
      { text: 'The government has announced new regulations to reduce pollution. Nevertheless, experts say the consequences will take years to appear.', ar: 'أعلنت الحكومة أنظمة جديدة لتقليل التلوث. ومع ذلك يقول الخبراء إن النتائج ستحتاج سنوات لتظهر.' },
    ],
    [
      listenChoose('ls-b2-news-1', 'The government has announced new regulations to reduce pollution.', 'What did the government announce?', ['New regulations', 'New taxes', 'A holiday'], 0),
      tf('ls-b2-news-2', 'Experts say results will appear immediately.', false, { skill: 'listening' }),
    ]),
];

export const LISTENING_BY_ID: Record<string, ListeningItem> = Object.fromEntries(LISTENING.map((l) => [l.id, l]));
