import { userKey } from '@/math-engine/validate';
import type { I18n } from '@/i18n';
import type { Question, UserAnswer } from '@/types';

/** The control's starting value: ordering questions start from the shuffled list, everything else is empty. */
export function initialValue(q: Question): UserAnswer | null {
  return q.answer.kind === 'order' ? (q.items ?? []).map((i) => i.id) : null;
}

/** Whether the current value is complete enough to be submitted. */
export function isReady(q: Question, v: UserAnswer | null): boolean {
  if (v === null) return false;
  if (q.answer.kind === 'match') {
    const keys = Object.keys(q.answer.pairs);
    return typeof v === 'object' && !Array.isArray(v) && keys.every((k) => (v as Record<string, string>)[k]);
  }
  if (typeof v === 'string') return v.trim().length > 0;
  return true;
}

/** Human-readable text for an answer the learner gave, in the current language. */
export function answerText(q: Question, submitted: UserAnswer | null | undefined, i18n: Pick<I18n, 't' | 'l'>): string {
  const { t, l } = i18n;
  if (submitted === null || submitted === undefined) return t('q.noAnswer');
  if (q.options && typeof submitted === 'string') {
    const o = q.options.find((x) => x.id === submitted);
    return o ? l(o.label) : submitted;
  }
  if (typeof submitted === 'boolean') return t(submitted ? 'q.true' : 'q.false');
  if (submitted === 'true' || submitted === 'false') return t(submitted === 'true' ? 'q.true' : 'q.false');
  if (Array.isArray(submitted) && q.items) return submitted.map((id) => l(q.items?.find((i) => i.id === id)?.label ?? { en: id, ar: id })).join('  ›  ');
  if (typeof submitted === 'object' && !Array.isArray(submitted)) {
    return Object.entries(submitted)
      .map(([a, b]) => `${l(q.left?.find((i) => i.id === a)?.label ?? { en: a, ar: a })} ↔ ${l(q.right?.find((i) => i.id === b)?.label ?? { en: b, ar: b })}`)
      .join('  ·  ');
  }
  return userKey(submitted) ?? t('q.noAnswer');
}

/** True when the learner left the question untouched. Ordering questions count as unanswered until changed or submitted. */
export function isBlank(q: Question, v: UserAnswer | null | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (q.answer.kind === 'match' && typeof v === 'object' && !Array.isArray(v)) return Object.keys(v).length === 0;
  return false;
}
