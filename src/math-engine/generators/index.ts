import type { Difficulty, Generator, Question, Rng } from '@/types';
import { createRng } from '../rng';
import { problemsWith } from '../kit';
import { L1_GENERATORS } from './l1-foundations';
import { L2_GENERATORS } from './l2-fractions';
import { L3_GENERATORS } from './l3-everyday';
import { L4_GENERATORS } from './l4-prealgebra';
import { L5_GENERATORS } from './l5-algebra';
import { L6_GENERATORS } from './l6-geometry';
import { L7_GENERATORS } from './l7-advanced';

/** Every question template in the app. Add a new level's list here and it appears everywhere. */
export const ALL_GENERATORS: Generator[] = [...L1_GENERATORS, ...L2_GENERATORS, ...L3_GENERATORS, ...L4_GENERATORS, ...L5_GENERATORS, ...L6_GENERATORS, ...L7_GENERATORS];

const BY_ID = new Map<string, Generator>(ALL_GENERATORS.map((g) => [g.id, g]));
const BY_TOPIC = new Map<string, Generator[]>();
for (const g of ALL_GENERATORS) {
  const list = BY_TOPIC.get(g.topicId) ?? [];
  list.push(g);
  BY_TOPIC.set(g.topicId, list);
}

export function getGenerator(id: string): Generator | undefined {
  return BY_ID.get(id);
}

export function generatorsFor(topicId: string): Generator[] {
  return BY_TOPIC.get(topicId) ?? [];
}

/** Difficulty a generator can honour: if it does not cover `d` we use the closest level it supports. */
export function nearestLevel(g: Generator, d: Difficulty): Difficulty {
  if (g.levels.includes(d)) return d;
  let best = g.levels[0] as Difficulty;
  for (const l of g.levels) if (Math.abs(l - d) < Math.abs(best - d)) best = l;
  return best;
}

export function supportsDifficulty(g: Generator, d: Difficulty): boolean {
  return g.levels.includes(d);
}

/** Build one finished question. Retries with a fresh seed when a template yields a malformed result. */
export function makeQuestion(g: Generator, difficulty: Difficulty, rng: Rng): Question {
  const level = nearestLevel(g, difficulty);
  let last: Question | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const seed = rng.int(1, 2_000_000_000);
    const local = createRng(seed);
    let body: ReturnType<Generator['make']>;
    try {
      body = g.make(local, level);
    } catch (e) {
      // RangeError from Fraction overflow or a generator running out of retries: just try another seed.
      if (attempt === 7) throw e;
      continue;
    }
    const q: Question = {
      ...body,
      id: `${g.id}:${level}:${seed}`,
      generatorId: g.id,
      topicId: g.topicId,
      qtype: g.qtype,
      difficulty: level,
    };
    if (problemsWith(q).length === 0) return q;
    last = q;
  }
  return last as Question;
}

/** Rebuild a question from its id (used by "Try similar" and for reviewing mistakes). */
export function rebuildQuestion(id: string): Question | null {
  const parts = id.split(':');
  const seed = Number(parts[parts.length - 1]);
  const level = Number(parts[parts.length - 2]) as Difficulty;
  const genId = parts.slice(0, -2).join(':');
  const g = getGenerator(genId);
  if (!g || !Number.isFinite(seed)) return null;
  const body = g.make(createRng(seed), level);
  return { ...body, id, generatorId: g.id, topicId: g.topicId, qtype: g.qtype, difficulty: level };
}
