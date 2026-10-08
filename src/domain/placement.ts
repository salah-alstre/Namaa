import { TOPIC_BY_ID, topicsOfLevel } from '@/content/topics';
import type { Difficulty, Question } from '@/types';
import { createRng } from '@/math-engine/rng';
import { generatorsFor, makeQuestion } from '@/math-engine/generators';

export const PLACEMENT_LEVELS = [1, 2, 3, 4, 5, 6, 7];
const PER_LEVEL = 2;

/** 14 questions: two per level, a little harder as the levels climb. A different mix each time. */
export function buildPlacementTest(seed: number): Question[] {
  const rng = createRng(seed);
  const out: Question[] = [];
  const used = new Set<string>();
  for (const level of PLACEMENT_LEVELS) {
    const topics = rng.shuffle(topicsOfLevel(level).filter((t) => generatorsFor(t.id).length > 0));
    for (let i = 0; i < PER_LEVEL; i++) {
      const topic = topics[i % topics.length];
      if (!topic) continue;
      const gens = generatorsFor(topic.id).filter((g) => !used.has(g.id));
      const g = rng.pick(gens.length > 0 ? gens : generatorsFor(topic.id));
      used.add(g.id);
      const diff = (level <= 2 ? 2 : 3) as Difficulty;
      out.push(makeQuestion(g, diff, rng));
    }
  }
  return out;
}

export interface PlacementLevelResult {
  level: number;
  correct: number;
  total: number;
}

export interface PlacementResult {
  byLevel: PlacementLevelResult[];
  /** The level to start at: the first one where less than half was right (7 when everything went well). */
  placedLevel: number;
  correct: number;
  total: number;
}

export function scorePlacement(questions: Question[], results: boolean[]): PlacementResult {
  const byLevel: PlacementLevelResult[] = PLACEMENT_LEVELS.map((level) => ({ level, correct: 0, total: 0 }));
  questions.forEach((q, i) => {
    const level = TOPIC_BY_ID[q.topicId]?.level ?? 1;
    const row = byLevel[level - 1];
    if (!row) return;
    row.total++;
    if (results[i]) row.correct++;
  });
  let placed = 7;
  for (const r of byLevel) {
    if (r.total > 0 && r.correct / r.total < 0.5) {
      placed = r.level;
      break;
    }
  }
  return { byLevel, placedLevel: placed, correct: results.filter(Boolean).length, total: questions.length };
}

/** Starting adaptive difficulty for a level's topics, from how the learner did there. */
export function levelStartDifficulty(r: PlacementLevelResult | undefined): number {
  if (!r || r.total === 0) return 2;
  const ratio = r.correct / r.total;
  return ratio >= 1 ? 3 : ratio >= 0.5 ? 2.2 : 1.4;
}
