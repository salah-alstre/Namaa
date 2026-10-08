import type { Question, UserAnswer } from '@/types';

/**
 * The answer a perfect student would give, expressed as a UserAnswer.
 * Used by tests (every generated question must accept its own solution) and by the
 * "reveal solution" flow so what we show is exactly what we would accept.
 */
export function perfectAnswer(q: Question): UserAnswer {
  const a = q.answer;
  switch (a.kind) {
    case 'number':
      return a.value;
    case 'numbers':
      return a.values.join(', ');
    case 'expression':
      return a.value;
    case 'text':
      return a.accepted[0] ?? '';
    case 'choice':
      return a.correct;
    case 'bool':
      return a.value;
    case 'order':
      return a.order;
    case 'match':
      return a.pairs;
  }
}
