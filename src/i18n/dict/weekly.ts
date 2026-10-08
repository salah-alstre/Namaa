import type { Dict } from '../core';

export const weekly = {
  'weekly.title': ['Your week in review', 'ملخص أسبوعك'],
  'weekly.sub': ['{from} – {to}', '{from} – {to}'],
  'weekly.questions': ['Questions', 'الأسئلة'],
  'weekly.accuracy': ['Accuracy', 'الدقة'],
  'weekly.time': ['Study time', 'وقت الدراسة'],
  'weekly.xp': ['XP earned', 'نقاط الخبرة'],
  'weekly.lessons': ['Lessons', 'الدروس'],
  'weekly.activeDays': ['Active days', 'الأيام النشطة'],
  'weekly.bestDay': ['Best day: {day}', 'أفضل يوم: {day}'],
  'weekly.moreThanBefore': ['{n} more questions than the week before. Nice rhythm.', 'أسئلة أكثر بمقدار {n} من الأسبوع السابق. إيقاع جميل.'],
  'weekly.lessThanBefore': ['A lighter week, and that is fine. Even five minutes today keeps things warm.', 'أسبوع أخف، وهذا لا بأس به. خمس دقائق اليوم تكفي لإبقاء الحماس.'],
  'weekly.same': ['About the same pace as the week before. Steady wins.', 'الوتيرة نفسها تقريبًا كالأسبوع السابق. الثبات يربح.'],
  'weekly.firstWeek': ['Your first tracked week. Every question from here builds the picture.', 'أول أسبوع يُسجَّل. كل سؤال من الآن يكمل الصورة.'],
  'weekly.quiet': ['No practice last week. A fresh start is just one question away.', 'لا تدريب الأسبوع الماضي. بداية جديدة على بُعد سؤال واحد.'],
  'weekly.cta': ['Practice this week', 'تدرّب هذا الأسبوع'],
  'weekly.dismiss': ['Close', 'إغلاق'],
  'weekly.open': ['Last week’s summary', 'ملخص الأسبوع الماضي'],
} as const satisfies Dict;
