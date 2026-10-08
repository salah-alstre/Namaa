import { describe, expect, it } from 'vitest';
import { QTYPES } from '@/types';
import { MISTAKE_BY_ID } from '@/content/mistakes';
import { TOPICS, TOPIC_BY_ID } from '@/content/topics';
import { createRng } from '../rng';
import { checkAnswer } from '../validate';
import { problemsWith } from '../kit';
import { perfectAnswer } from '../solve';
import { ALL_GENERATORS, generatorsFor, makeQuestion, rebuildQuestion } from './index';

const SEEDS = 40;

describe('generator registry', () => {
  it('has unique ids and known topics', () => {
    const ids = ALL_GENERATORS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of ALL_GENERATORS) {
      expect((g.topicId in TOPIC_BY_ID), `${g.id} topic`).toBe(true);
      expect(g.levels.length).toBeGreaterThan(0);
    }
  });

  it('covers every topic with at least two generators', () => {
    for (const t of TOPICS) expect(generatorsFor(t.id).length, t.id).toBeGreaterThanOrEqual(2);
  });

  it('covers all ten question types', () => {
    const used = new Set(ALL_GENERATORS.map((g) => g.qtype));
    for (const t of QTYPES) expect(used.has(t), t).toBe(true);
  });
});

describe('every generator, every level, many seeds', () => {
  for (const g of ALL_GENERATORS) {
    it(`${g.id} produces valid, self-consistent questions`, () => {
      for (const level of g.levels) {
        for (let s = 1; s <= SEEDS; s++) {
          const q = makeQuestion(g, level, createRng(s * 7919 + level));
          const where = `${g.id} d${level} seed ${s}`;
          expect(problemsWith(q), where).toEqual([]);
          // The stored solution must be accepted by the real validator.
          const verdict = checkAnswer(q, perfectAnswer(q));
          expect(verdict.correct, `${where} rejects its own answer (${JSON.stringify(q.answer)})`).toBe(true);
          // Mistake patterns must exist so the My Mistakes screen can explain them.
          for (const e of q.likelyErrors ?? []) expect((e.patternId in MISTAKE_BY_ID), `${where} pattern ${e.patternId}`).toBe(true);
          // A likely wrong answer must never be the right one.
          for (const e of q.likelyErrors ?? []) {
            if (q.answer.kind === 'choice') expect(q.answer.correct.includes(e.answer), where).toBe(false);
            if (q.answer.kind === 'choice') expect(q.options?.some((o) => o.id === e.answer), `${where} dangling option`).toBe(true);
          }
        }
      }
    });
  }

  it('is deterministic for a seed and rebuildable from its id', () => {
    for (const g of ALL_GENERATORS.slice(0, 40)) {
      const lvl = g.levels[0] as 1;
      const a = makeQuestion(g, lvl, createRng(99));
      const b = makeQuestion(g, lvl, createRng(99));
      expect(b).toEqual(a);
      expect(rebuildQuestion(a.id)).toEqual(a);
    }
  });

  it('gives variety (not the same question every time)', () => {
    for (const g of ALL_GENERATORS) {
      const lvl = g.levels[g.levels.length - 1] as 1;
      const prompts = new Set<string>();
      for (let s = 1; s <= 25; s++) {
        const q = makeQuestion(g, lvl, createRng(s));
        // Ids can be positional (matching/ordering), so include the visible labels too.
        prompts.add(JSON.stringify([q.prompt.en, q.display, q.answer, q.options, q.items, q.left, q.right]));
      }
      expect(prompts.size, g.id).toBeGreaterThan(3);
    }
  });
});
