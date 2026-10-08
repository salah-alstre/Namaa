import { describe, expect, it } from 'vitest';
import { buildQuickSession, estimateMinutes } from './session';
import type { Exercise } from './types';

const ex = (id: string): Exercise => ({ id, kind: 'true-false', skill: 'grammar', statement: id, answer: true });
const many = (p: string, n: number) => Array.from({ length: n }, (_, i) => ex(`${p}${i}`));

describe('quick session builder', () => {
  it('puts due words first and caps them at five', () => {
    const s = buildQuickSession({ dueWordIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], mistakes: [], nextLesson: many('n', 20), filler: [] });
    expect(s[0]).toEqual({ type: 'word', wordId: 'a' });
    expect(s.filter((i) => i.type === 'word')).toHaveLength(5);
    expect(s).toHaveLength(10);
  });

  it('includes at most three mistake retries and never duplicates an exercise', () => {
    const m = many('m', 6);
    const s = buildQuickSession({ dueWordIds: [], mistakes: m, nextLesson: [m[0]!, ...many('n', 20)], filler: [] });
    const ids = s.flatMap((i) => (i.type === 'exercise' ? [i.exercise.id] : []));
    expect(ids.filter((id) => id.startsWith('m'))).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tops up from filler when the lesson is short, and is deterministic', () => {
    const input = { dueWordIds: [], mistakes: [], nextLesson: many('n', 2), filler: many('f', 20) };
    const a = buildQuickSession(input);
    expect(a).toHaveLength(10);
    expect(buildQuickSession(input)).toEqual(a);
  });

  it('copes with nothing to do', () => {
    expect(buildQuickSession({ dueWordIds: [], mistakes: [], nextLesson: [], filler: [] })).toEqual([]);
  });

  it('estimates minutes within the 5-10 minute promise for a full session', () => {
    expect(estimateMinutes(10)).toBeGreaterThanOrEqual(5);
    expect(estimateMinutes(10)).toBeLessThanOrEqual(10);
    expect(estimateMinutes(0)).toBe(1);
  });
});
