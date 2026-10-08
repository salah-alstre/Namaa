import type { EnLevel, SpeakingPhrase } from '@/english-engine/types';
import { T } from './build';

const p = (id: string, level: EnLevel, en: string, ar: string, tipEn: string, tipAr: string): SpeakingPhrase => ({
  id, level, en, ar, tip: T(tipEn, tipAr),
});

export const SPEAKING: SpeakingPhrase[] = [
  p('sp-hello', 'starter', 'Hello, how are you?', 'مرحبا، كيف حالك؟', 'Stress "how" and let your voice fall at the end.', 'ركّز على how واخفض صوتك في النهاية.'),
  p('sp-name', 'starter', 'My name is Sara.', 'اسمي سارة.', 'Say "name" with a long ay sound.', 'انطق name بصوت ay طويل.'),
  p('sp-thanks', 'starter', 'Thank you very much.', 'شكرا جزيلا.', 'The "th" sound: put your tongue lightly between your teeth.', 'صوت th: ضع لسانك بخفة بين أسنانك.'),
  p('sp-sorry', 'starter', 'I am sorry.', 'أنا آسف.', 'Link "I am" smoothly: "I\'m".', 'صِل I am بسلاسة: I\'m.'),
  p('sp-water', 'a1', 'Can I have some water, please?', 'هل يمكنني الحصول على بعض الماء من فضلك؟', 'Raise your voice at the end of a question.', 'ارفع صوتك في نهاية السؤال.'),
  p('sp-where', 'a1', 'Where is the bus station?', 'أين محطة الحافلات؟', 'Stress "where" and "station".', 'ركّز على where و station.'),
  p('sp-routine', 'a1', 'I usually get up at seven.', 'أستيقظ عادة في السابعة.', 'Say "get up" as one smooth sound: "getup".', 'انطق get up كصوت واحد سلس.'),
  p('sp-repeat', 'a1', 'Could you repeat that, please?', 'هل يمكنك أن تعيد ذلك من فضلك؟', 'Soften "could you" - it sounds like "cudja".', 'خفّف could you فتبدو كأنها cudja.'),
  p('sp-past', 'a2', 'Yesterday I visited my uncle.', 'زرت عمي أمس.', '"Visited" has three syllables: VIZ-i-tid.', 'كلمة visited من ثلاثة مقاطع.'),
  p('sp-future', 'a2', 'I am going to travel next month.', 'سأسافر الشهر القادم.', '"Going to" often sounds like "gonna".', 'غالبا تُنطق going to مثل gonna.'),
  p('sp-opinion', 'b1', 'In my opinion, it is a good idea.', 'في رأيي هذه فكرة جيدة.', 'Pause briefly after "opinion".', 'توقف قليلا بعد opinion.'),
  p('sp-advice', 'b1', 'If I were you, I would prepare more.', 'لو كنت مكانك لاستعددت أكثر.', 'Stress "were" and "would".', 'ركّز على were و would.'),
  p('sp-formal', 'b2', 'Nevertheless, we should consider the consequences.', 'ومع ذلك علينا أن ننظر في العواقب.', 'Stress the second syllable of "consequences": CON-se-quen-ces.', 'قسّم الكلمة مقاطع واضحة.'),
];

export const SPEAKING_BY_ID: Record<string, SpeakingPhrase> = Object.fromEntries(SPEAKING.map((s) => [s.id, s]));
