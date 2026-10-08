import { describe, expect, it } from 'vitest';
import { LESSONS, LESSON_BY_ID } from './index';
import { TOPICS } from '@/content/topics';
import { getGenerator, supportsDifficulty } from '@/math-engine/generators';

describe('lesson content', () => {
  it('has exactly one lesson for each topic', () => {
    expect(LESSONS.length).toBe(TOPICS.length);
    for (const t of TOPICS) {
      expect(LESSONS.filter((l) => l.topicId === t.id), t.id).toHaveLength(1);
    }
  });

  it('has unique ids', () => {
    expect(Object.keys(LESSON_BY_ID).length).toBe(LESSONS.length);
  });

  it('references only existing generators', () => {
    for (const l of LESSONS) {
      expect(getGenerator(l.tryGenerator), `${l.id} try`).toBeTruthy();
      expect(l.checkGenerators.length, `${l.id} check count`).toBeGreaterThanOrEqual(2);
      for (const g of l.checkGenerators) {
        expect(getGenerator(g), `${l.id} -> ${g}`).toBeTruthy();
      }
      expect(supportsDifficulty).toBeTypeOf('function');
    }
  });

  it('is fully bilingual and non-empty', () => {
    const bad = (s: { en: string; ar: string }) => !s.en.trim() || !s.ar.trim();
    for (const l of LESSONS) {
      expect(l.explanation.length, l.id).toBeGreaterThanOrEqual(3);
      for (const e of l.explanation) expect(bad(e), `${l.id} explanation`).toBe(false);
      expect(bad(l.why), `${l.id} why`).toBe(false);
      expect(bad(l.example.problem), `${l.id} problem`).toBe(false);
      expect(bad(l.example.result), `${l.id} result`).toBe(false);
      for (const s of l.example.steps) expect(bad(s), `${l.id} step`).toBe(false);
    }
  });
});
