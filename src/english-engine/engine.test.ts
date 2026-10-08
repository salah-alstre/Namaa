import { describe, expect, it } from 'vitest';
import { editDistance, matchTyped, normalizeArabic, normalizeEnglish } from './normalize';
import { gradeExercise } from './grade';
import { endOfDay, isDue, newCard, previewInterval, schedule, wordMastery } from './srs';
import {
  isPlacementDone,
  pickQuestion,
  placementResult,
  recordAnswer,
  startPlacement,
  type PlacementAnswer,
} from './placement';
import { englishLessonXp, englishQuestionXp, isEnglishReason, enReason, lessonStars, pushRecent, skillMastery } from './progress';
import { EN_LEVELS, type Exercise, type PlacementQuestion } from './types';

describe('normalizeEnglish', () => {
  it('ignores case, punctuation and spacing', () => {
    expect(normalizeEnglish('  I   Am a Developer! ')).toBe('i am a developer');
  });
  it('treats contractions as their expansions', () => {
    expect(normalizeEnglish("I'm happy")).toBe(normalizeEnglish('I am happy'));
    expect(normalizeEnglish('She’s here')).toBe('she is here');
    expect(normalizeEnglish("They don't know")).toBe('they do not know');
    expect(normalizeEnglish("I won't go")).toBe('i will not go');
    expect(normalizeEnglish("can't")).toBe(normalizeEnglish('can not'));
  });
  it('normalises Arabic variants', () => {
    expect(normalizeArabic('أَنا مُبَرمج.')).toBe(normalizeArabic('انا مبرمج'));
  });
});

describe('matchTyped', () => {
  it('accepts any listed answer', () => {
    expect(matchTyped("it's a book", ['It is a book']).correct).toBe(true);
  });
  it('flags one-typo answers as close, not correct', () => {
    const m = matchTyped('beautifull', ['beautiful']);
    expect(m.correct).toBe(false);
    expect(m.close).toBe(true);
  });
  it('does not flag short words as close', () => {
    expect(matchTyped('cat', ['car']).close).toBe(false);
  });
  it('empty is wrong', () => {
    expect(matchTyped('  ', ['a']).correct).toBe(false);
  });
  it('editDistance', () => {
    expect(editDistance('kitten', 'sitting', 5)).toBe(3);
  });
});

describe('gradeExercise', () => {
  const base = { id: 'x', skill: 'grammar' as const };
  it('grades choice, bool, text, order, pairs', () => {
    const mcq: Exercise = { ...base, kind: 'mcq', prompt: 'I ___ a student', options: ['is', 'am', 'are'], answer: 1 };
    expect(gradeExercise(mcq, { kind: 'choice', index: 1 }).correct).toBe(true);
    expect(gradeExercise(mcq, { kind: 'choice', index: 0 })).toMatchObject({ correct: false, expected: 'am', given: 'is' });
    expect(gradeExercise(mcq, { kind: 'text', text: 'am' }).correct).toBe(false);

    const tf: Exercise = { ...base, kind: 'true-false', statement: 'Cats bark.', answer: false };
    expect(gradeExercise(tf, { kind: 'bool', value: false }).correct).toBe(true);

    const fb: Exercise = { ...base, kind: 'fill-blank', sentence: 'She ___ a teacher.', answers: ['is'] };
    expect(gradeExercise(fb, { kind: 'text', text: 'Is' }).correct).toBe(true);

    const wo: Exercise = { ...base, kind: 'word-order', words: ['am', 'I', 'happy'], answer: 'I am happy', accept: ["I'm happy"] };
    expect(gradeExercise(wo, { kind: 'order', items: ['I', 'am', 'happy'] }).correct).toBe(true);
    expect(gradeExercise(wo, { kind: 'order', items: ['am', 'I', 'happy'] }).correct).toBe(false);

    const so: Exercise = { ...base, kind: 'sentence-order', lines: ['Hello.', 'Hi!', 'How are you?'] };
    expect(gradeExercise(so, { kind: 'order', items: ['Hello.', 'Hi!', 'How are you?'] }).correct).toBe(true);

    const mt: Exercise = { ...base, kind: 'matching', pairs: [['cat', 'قطة'], ['dog', 'كلب']] };
    expect(gradeExercise(mt, { kind: 'pairs', pairs: { cat: 'قطة', dog: 'كلب' } }).correct).toBe(true);
    expect(gradeExercise(mt, { kind: 'pairs', pairs: { cat: 'كلب', dog: 'قطة' } }).correct).toBe(false);
  });
  it('short-written uses accepted answers or keyword groups', () => {
    const sw: Exercise = {
      ...base,
      kind: 'short-written',
      prompt: 'Say your name.',
      accept: ['My name is Sam'],
      keywords: [['name'], ['is', 'am']],
      sample: 'My name is Sam.',
    };
    expect(gradeExercise(sw, { kind: 'text', text: 'my name is Ali' }).correct).toBe(true);
    expect(gradeExercise(sw, { kind: 'text', text: 'hello' }).correct).toBe(false);
  });
  it('grammar-fix accepts contraction variants', () => {
    const gf: Exercise = { ...base, kind: 'grammar-fix', wrong: 'He are tall.', answers: ['He is tall.'] };
    expect(gradeExercise(gf, { kind: 'text', text: "he's tall" }).correct).toBe(true);
  });
});

describe('SRS', () => {
  const t0 = new Date('2026-01-10T10:00:00').getTime();
  const DAY = 86_400_000;
  it('is deterministic', () => {
    const c = newCard(t0);
    expect(schedule(c, 'good', t0)).toEqual(schedule(c, 'good', t0));
  });
  it('learning cards: again/hard stay in learning, good graduates, easy jumps', () => {
    const c = newCard(t0);
    expect(schedule(c, 'again', t0)).toMatchObject({ state: 'learning', dueAt: t0 + 10 * 60_000 });
    expect(schedule(c, 'hard', t0)).toMatchObject({ state: 'learning', dueAt: t0 + 3_600_000 });
    expect(schedule(c, 'good', t0)).toMatchObject({ state: 'review', intervalDays: 1, dueAt: t0 + DAY });
    expect(schedule(c, 'easy', t0)).toMatchObject({ state: 'review', intervalDays: 3 });
  });
  it('review intervals grow with grade and ease', () => {
    const r = { state: 'review' as const, reps: 4, lapses: 0, intervalDays: 10, ease: 2.5, dueAt: t0 };
    const hard = schedule(r, 'hard', t0);
    const good = schedule(r, 'good', t0);
    const easy = schedule(r, 'easy', t0);
    expect(hard.intervalDays).toBe(12);
    expect(good.intervalDays).toBe(25);
    expect(easy.intervalDays).toBeGreaterThan(good.intervalDays);
    expect(hard.ease).toBeLessThan(r.ease);
    expect(easy.ease).toBeGreaterThan(r.ease);
  });
  it('lapse resets to learning and lowers ease, never below 1.3', () => {
    let c = { state: 'review' as const, reps: 4, lapses: 0, intervalDays: 10, ease: 1.4, dueAt: t0 };
    c = schedule(c, 'again', t0) as typeof c;
    expect(c.state).toBe('learning');
    expect(c.lapses).toBe(1);
    expect(c.ease).toBe(1.3);
  });
  it('caps the interval at a year', () => {
    const r = { state: 'review' as const, reps: 9, lapses: 0, intervalDays: 300, ease: 3, dueAt: t0 };
    expect(schedule(r, 'easy', t0).intervalDays).toBe(365);
  });
  it('due today includes anything due before midnight', () => {
    expect(isDue({ dueAt: t0 + 5 * 3_600_000 }, t0)).toBe(true);
    expect(isDue({ dueAt: endOfDay(t0) + 1 }, t0)).toBe(false);
  });
  it('previews and mastery bands', () => {
    expect(previewInterval(newCard(t0), 'again', t0)).toEqual({ unit: 'm', value: 10 });
    expect(previewInterval(newCard(t0), 'hard', t0)).toEqual({ unit: 'h', value: 1 });
    expect(previewInterval(newCard(t0), 'good', t0)).toEqual({ unit: 'd', value: 1 });
    expect(wordMastery(null)).toBe('new');
    expect(wordMastery({ state: 'review', intervalDays: 3, reps: 2 })).toBe('learning');
    expect(wordMastery({ state: 'review', intervalDays: 10, reps: 3 })).toBe('familiar');
    expect(wordMastery({ state: 'review', intervalDays: 30, reps: 5 })).toBe('mastered');
  });
});

describe('placement', () => {
  const q = (id: string, level: PlacementQuestion['level']): PlacementQuestion => ({
    id,
    level,
    exercise: { id, skill: 'grammar', kind: 'mcq', prompt: '?', options: ['a', 'b'], answer: 0 },
  });
  const bank = EN_LEVELS.flatMap((lv) => Array.from({ length: 8 }, (_, i) => q(`${lv}-${i}`, lv)));

  function run(ability: number) {
    let s = startPlacement();
    while (!isPlacementDone(s)) {
      const next = pickQuestion(bank, s);
      if (!next) break;
      const lvIdx = EN_LEVELS.indexOf(next.level);
      s = recordAnswer(s, next, lvIdx <= ability);
    }
    return s;
  }

  it('asks 15–25 questions and finds the learner level', () => {
    for (let ability = 0; ability < EN_LEVELS.length; ability++) {
      const s = run(ability);
      expect(s.answers.length).toBeGreaterThanOrEqual(15);
      expect(s.answers.length).toBeLessThanOrEqual(25);
      expect(placementResult(s.answers)).toBe(EN_LEVELS[ability]);
    }
  });
  it('never repeats a question', () => {
    const s = run(2);
    expect(new Set(s.asked).size).toBe(s.asked.length);
  });
  it('result scoring', () => {
    const ans: PlacementAnswer[] = [
      { level: 'a1', correct: true },
      { level: 'a1', correct: true },
      { level: 'a2', correct: true },
      { level: 'a2', correct: true },
      { level: 'a2', correct: false },
      { level: 'b1', correct: false },
      { level: 'b1', correct: false },
    ];
    expect(placementResult(ans)).toBe('a2');
    expect(placementResult([{ level: 'a1', correct: false }, { level: 'a1', correct: false }])).toBe('starter');
    expect(placementResult([])).toBe('starter');
  });
});

describe('English progress & XP', () => {
  it('question and lesson XP', () => {
    expect(englishQuestionXp(true)).toBe(5);
    expect(englishQuestionXp(true, 1)).toBe(3);
    expect(englishQuestionXp(false)).toBe(1);
    expect(englishLessonXp(3)).toBe(60);
    expect(englishLessonXp(9)).toBe(60);
  });
  it('reasons are tagged', () => {
    expect(isEnglishReason(enReason('lesson'))).toBe(true);
    expect(isEnglishReason('lesson')).toBe(false);
  });
  it('stars follow accuracy', () => {
    expect(lessonStars(10, 10)).toBe(3);
    expect(lessonStars(7, 10)).toBe(2);
    expect(lessonStars(3, 10)).toBe(1);
  });
  it('skill mastery needs evidence', () => {
    expect(skillMastery(0, 0, [])).toBe(0);
    expect(skillMastery(2, 2, [1, 1])).toBeLessThan(skillMastery(20, 20, Array(10).fill(1)));
    expect(skillMastery(20, 20, Array(10).fill(1))).toBe(100);
    expect(pushRecent(Array(10).fill(1), false)).toHaveLength(10);
  });
});
