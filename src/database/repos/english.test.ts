import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSqlJsClient, type SqlJsClient } from '../adapters/sqljs';
import { setDb } from '../index';
import { addXp } from './progress';
import { enReason } from '@/english-engine/progress';
import { newCard, schedule } from '@/english-engine/srs';
import * as en from './english';

let client: SqlJsClient;
beforeEach(async () => {
  client = await createSqlJsClient();
  setDb(client);
});
afterEach(() => {
  setDb(null);
  client.close();
});

describe('english repo', () => {
  it('tracks lesson progress and keeps the best stars', async () => {
    await en.touchEnLesson('l1', 2);
    expect((await en.loadEnLessons()).l1.status).toBe('started');
    expect(await en.completeEnLesson('l1', 2)).toBe(true);
    expect(await en.completeEnLesson('l1', 1)).toBe(false);
    const l = (await en.loadEnLessons()).l1;
    expect(l.status).toBe('completed');
    expect(l.stars).toBe(2);
    // re-opening a completed lesson does not downgrade it
    await en.touchEnLesson('l1', 1);
    expect((await en.loadEnLessons()).l1.status).toBe('completed');
  });

  it('adds words once and stores SRS reviews', async () => {
    expect(await en.addEnWords(['w1', 'w2'], 'lesson:l1')).toBe(2);
    expect(await en.addEnWords(['w2', 'w3'], 'lesson:l2')).toBe(1);
    const now = Date.now();
    const card = schedule(newCard(now), 'good', now);
    await en.saveEnReview('w1', card, true);
    const v = (await en.loadEnVocab()).w1;
    expect(v.reps).toBe(card.reps);
    expect(v.dueAt).toBe(card.dueAt);
    expect(v.seen).toBe(1);
    expect(v.correct).toBe(1);
    await en.setEnWordFlag('w1', 'favorite', true);
    await en.setEnWordFlag('zz', 'difficult', true);
    const all = await en.loadEnVocab();
    expect(all.w1.favorite).toBe(true);
    expect(all.zz.difficult).toBe(true);
  });

  it('records attempts and rolls up skill mastery', async () => {
    for (let i = 0; i < 4; i++) {
      await en.recordEnAttempt({ exercise: { id: `e${i}`, kind: 'mcq', skill: 'grammar' }, correct: i !== 1, answer: 'x', timeMs: 1200 });
    }
    const s = (await en.loadEnSkills()).grammar;
    expect(s.attempts).toBe(4);
    expect(s.correct).toBe(3);
    expect(s.mastery).toBeGreaterThan(0);
    const t = await en.enAttemptTotals();
    expect(t.total).toBe(4);
    expect(t.today).toBe(4);
  });

  it('upserts mistakes per exercise and re-opens them', async () => {
    const m = { exerciseId: 'e1', kind: 'mcq', skill: 'grammar' as const, patternId: 'be-verb', prompt: 'I ___ a student', given: 'is', expected: 'am', explanation: { en: 'Use am with I.', ar: 'استخدم am مع I.' } };
    await en.saveEnMistake(m);
    await en.saveEnMistake(m);
    let list = await en.loadEnMistakes();
    expect(list).toHaveLength(1);
    expect(list[0].timesWrong).toBe(2);
    expect(list[0].explanation?.ar).toContain('am');
    await en.markEnMistakeUnderstood('e1', true);
    expect((await en.loadEnMistakes())[0].understood).toBe(true);
    await en.saveEnMistake(m);
    list = await en.loadEnMistakes();
    expect(list[0].understood).toBe(false);
  });

  it('stores placement, writing, speaking and bookmarks', async () => {
    await en.saveEnPlacement('a2', 62, 20, 13, { x: 1 });
    expect((await en.loadEnPlacements())[0].level).toBe('a2');
    await en.saveEnWriting('wp1', 'My name is Sara.', [{ label: 'name', ok: true }]);
    expect((await en.loadEnWriting())[0].checks[0].ok).toBe(true);
    await en.saveEnSpeaking('sp1', 1);
    await en.saveEnSpeaking('sp1', 3);
    expect((await en.loadEnSpeaking()).sp1).toBe(3);
    await en.setEnBookmark('reading', 'r1', 'saved');
    expect((await en.loadEnBookmarks())['reading:r1']).toBe('saved');
    await en.setEnBookmark('reading', 'r1', null);
    expect(await en.loadEnBookmarks()).toEqual({});
  });

  it('splits XP by subject using the reason prefix', async () => {
    await addXp(10, 'question');
    await addXp(7, enReason('lesson'));
    await addXp(3, enReason('review'));
    expect(await en.englishXp()).toBe(10);
    expect((await en.englishXpByDay(0)).reduce((a, d) => a + d.xp, 0)).toBe(10);
  });
});
