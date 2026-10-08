import type { Dict } from '../core';

export const notify = {
  'notify.title': ['Time for a little maths', 'حان وقت القليل من الرياضيات'],
  'notify.body': ['A few minutes today keeps the habit alive.', 'بضع دقائق اليوم تُبقي العادة حيّة.'],
  'notify.bodyStreak': ['Keep your {n}-day streak going with a short session.', 'حافظ على سلسلتك البالغة {n} يومًا بجلسة قصيرة.'],
} as const satisfies Dict;
