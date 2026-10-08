import type { EnLevel, WritingPrompt } from '@/english-engine/types';
import { T } from './build';

const wp = (
  id: string,
  level: EnLevel,
  title: [string, string],
  prompt: [string, string],
  frames: string[],
  minWords: number,
  expect: [[string, string], string[]][],
  sample: string,
): WritingPrompt => ({
  id, level, title: T(title[0], title[1]), prompt: T(prompt[0], prompt[1]), frames, minWords,
  expect: expect.map(([l, any]) => ({ label: T(l[0], l[1]), any })), sample,
});

export const WRITING: WritingPrompt[] = [
  wp('wr-st-me', 'starter', ['About me', 'عن نفسي'],
    ['Write 3 short sentences about yourself.', 'اكتب ثلاث جمل قصيرة عن نفسك.'],
    ['My name is ...', 'I am a ...', 'I like ...'], 8,
    [[['Your name', 'اسمك'], ['name']], [['I am …', 'I am …'], ['i am', "i'm"]], [['Something you like', 'شيء تحبه'], ['like', 'love']]],
    'My name is Ali. I am a student. I like football.'),
  wp('wr-st-family', 'starter', ['My family', 'عائلتي'],
    ['Write about two people in your family.', 'اكتب عن شخصين من عائلتك.'],
    ['My father is ...', 'My sister is ...'], 10,
    [[['A family word', 'كلمة من العائلة'], ['father', 'mother', 'brother', 'sister']], [['Use is or are', 'استخدم is أو are'], ['is', 'are']]],
    'My father is a doctor. My sister is a student.'),
  wp('wr-a1-day', 'a1', ['My day', 'يومي'],
    ['Describe your day. Use time words and the present simple.', 'صف يومك. استخدم كلمات الوقت والمضارع البسيط.'],
    ['I get up at ...', 'Then I ...', 'In the evening I ...'], 25,
    [[['A time', 'وقت'], ['at', 'o\'clock', 'am', 'pm']], [['A sequence word', 'كلمة ترتيب'], ['then', 'after', 'first', 'in the']], [['A routine verb', 'فعل روتيني'], ['get up', 'eat', 'go', 'work', 'study']]],
    'I get up at seven. Then I eat breakfast and go to work. In the evening I study English.'),
  wp('wr-a1-place', 'a1', ['My favourite place', 'مكاني المفضل'],
    ['Describe a place you like.', 'صف مكانا تحبه.'],
    ['My favourite place is ...', 'It is ...', 'I go there ...'], 25,
    [[['The place', 'المكان'], ['favourite', 'favorite', 'place']], [['A description', 'وصف'], ['big', 'small', 'quiet', 'beautiful', 'busy']]],
    'My favourite place is the park. It is quiet and beautiful. I go there on Friday with my friends.'),
  wp('wr-a2-trip', 'a2', ['A past trip', 'رحلة سابقة'],
    ['Write about a trip you took. Use the past simple.', 'اكتب عن رحلة قمت بها. استخدم الماضي البسيط.'],
    ['Last ... I went to ...', 'We ... and ...', 'It was ...'], 40,
    [[['Past verbs', 'أفعال ماضية'], ['went', 'visited', 'ate', 'saw', 'took']], [['Was or were', 'was أو were'], ['was', 'were']], [['A feeling', 'شعور'], ['enjoyed', 'happy', 'tired', 'loved']]],
    'Last summer I went to Alexandria. We visited my uncle and ate fish. It was a great trip and I enjoyed it.'),
  wp('wr-b1-opinion', 'b1', ['My opinion', 'رأيي'],
    ['Do you prefer studying alone or with friends? Give your opinion and a reason.', 'هل تفضل الدراسة وحدك أم مع الأصدقاء؟ اذكر رأيك وسببا.'],
    ['In my opinion ...', 'This is because ...', 'However, ...'], 60,
    [[['An opinion phrase', 'عبارة رأي'], ['i think', 'in my opinion', 'i prefer']], [['A reason', 'سبب'], ['because', 'therefore', 'so']], [['A contrast', 'تعارض'], ['however', 'although', 'but']]],
    'In my opinion, studying alone is better because I can focus. However, I sometimes study with friends when a topic is difficult.'),
  wp('wr-b2-essay', 'b2', ['Short essay', 'مقال قصير'],
    ['Write a short paragraph about the effect of technology on society.', 'اكتب فقرة قصيرة عن تأثير التقنية في المجتمع.'],
    ['Technology has ...', 'Furthermore, ...', 'Nevertheless, ...'], 80,
    [[['Linking word', 'أداة ربط'], ['furthermore', 'nevertheless', 'whereas', 'moreover']], [['A consequence', 'نتيجة'], ['consequence', 'result', 'effect']], [['A conclusion', 'خلاصة'], ['in conclusion', 'overall', 'to sum up']]],
    'Technology has significantly changed society. Furthermore, it has created new opportunities. Nevertheless, it has consequences we must manage. In conclusion, balance is essential.'),
];

export const WRITING_BY_ID: Record<string, WritingPrompt> = Object.fromEntries(WRITING.map((w) => [w.id, w]));
