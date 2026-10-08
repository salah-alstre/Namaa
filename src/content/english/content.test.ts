import { describe, expect, it } from 'vitest';
import {
  ALL_EXERCISES, ALL_LESSONS, GRAMMAR_BY_ID, LEVELS, LISTENING, PLACEMENT, READINGS, SPEAKING, WORDS,
  WORD_BY_ID, WRITING, lessonExercises,
} from './index';
import { EXERCISE_KINDS, EN_LEVELS } from '@/english-engine/types';

const choiceKinds = ['mcq', 'en-ar', 'ar-en', 'choose-word', 'choose-sentence', 'complete-sentence', 'listen-choose', 'reading-comp'];

describe('english content integrity', () => {
  it('has lessons for every level', () => {
    for (const lv of EN_LEVELS) expect(ALL_LESSONS.filter((l) => l.level === lv).length).toBeGreaterThan(0);
    expect(ALL_LESSONS.length).toBeGreaterThanOrEqual(40);
    expect(LEVELS.map((l) => l.id)).toEqual([...EN_LEVELS]);
  });

  it('lesson ids and exercise ids are unique', () => {
    const lid = ALL_LESSONS.map((l) => l.id);
    expect(new Set(lid).size).toBe(lid.length);
    const eid = ALL_EXERCISES.map((e) => e.id);
    const dup = eid.filter((id, i) => eid.indexOf(id) !== i);
    expect(dup).toEqual([]);
  });

  it('every referenced word and grammar topic exists', () => {
    for (const l of ALL_LESSONS) {
      for (const id of l.vocab) expect(WORD_BY_ID[id], `${l.id} -> ${id}`).toBeTruthy();
      if (l.grammarId) expect(GRAMMAR_BY_ID[l.grammarId], l.id).toBeTruthy();
      for (const s of l.steps) if (s.type === 'vocab') for (const id of s.ids) expect(WORD_BY_ID[id], `${l.id} step -> ${id}`).toBeTruthy();
    }
    for (const e of ALL_EXERCISES) if (e.kind === 'vocab-recall' && e.wordId) expect(WORD_BY_ID[e.wordId]).toBeTruthy();
  });

  it('vocabulary rows are complete and unique', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(250);
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of WORDS) {
      expect(w.en && w.ar && w.pos && w.exEn && w.exAr && w.category, w.id).toBeTruthy();
    }
  });

  it('choice answers are in range and options are distinct', () => {
    for (const e of ALL_EXERCISES) {
      if (choiceKinds.includes(e.kind)) {
        const c = e as { options: string[]; answer: number };
        expect(c.options.length, e.id).toBeGreaterThanOrEqual(2);
        expect(c.answer, e.id).toBeGreaterThanOrEqual(0);
        expect(c.answer, e.id).toBeLessThan(c.options.length);
        expect(new Set(c.options).size, e.id).toBe(c.options.length);
      }
    }
  });

  it('typed exercises have answers; ordering exercises are consistent', () => {
    for (const e of ALL_EXERCISES) {
      if (e.kind === 'fill-blank' || e.kind === 'grammar-fix' || e.kind === 'listen-type' || e.kind === 'vocab-recall') {
        expect(e.answers.length, e.id).toBeGreaterThan(0);
      }
      if (e.kind === 'fill-blank') expect(e.sentence, e.id).toContain('___');
      if (e.kind === 'word-order') {
        const bag = (s: string) => s.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
        expect(bag(e.words.join(' ')), e.id).toBe(bag(e.answer));
      }
      if (e.kind === 'matching') expect(e.pairs.length, e.id).toBeGreaterThanOrEqual(3);
      if (e.kind === 'sentence-order') expect(e.lines.length, e.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('covers all 17 exercise kinds', () => {
    const kinds = new Set(ALL_EXERCISES.map((e) => e.kind));
    for (const k of EXERCISE_KINDS) expect(kinds.has(k), `missing kind ${k}`).toBe(true);
  });

  it('every lesson has an explain step, a try-it and practice', () => {
    for (const l of ALL_LESSONS) {
      const types = l.steps.map((s) => s.type);
      expect(types, l.id).toContain('explain');
      expect(types, l.id).toContain('tryit');
      expect(types, l.id).toContain('practice');
      expect(types[types.length - 1], l.id).toBe('summary');
      expect(lessonExercises(l).length, l.id).toBeGreaterThanOrEqual(5);
    }
  });

  it('readings, listening, writing and speaking are valid', () => {
    expect(READINGS.length).toBeGreaterThanOrEqual(6);
    for (const r of READINGS) {
      expect(r.translation.length, r.id).toBe(r.paragraphs.length);
      expect(r.questions.length, r.id).toBeGreaterThanOrEqual(3);
    }
    expect(LISTENING.length).toBeGreaterThanOrEqual(6);
    for (const l of LISTENING) expect(l.lines.length && l.questions.length, l.id).toBeTruthy();
    expect(WRITING.length).toBeGreaterThanOrEqual(6);
    expect(SPEAKING.length).toBeGreaterThanOrEqual(10);
  });

  it('placement bank has enough questions per level', () => {
    for (const lv of EN_LEVELS) expect(PLACEMENT.filter((p) => p.level === lv).length, lv).toBeGreaterThanOrEqual(8);
    const ids = PLACEMENT.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
