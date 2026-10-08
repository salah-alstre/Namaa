import { describe, expect, it } from 'vitest';
import { ALL_EXERCISES } from './index';
import { navKeyFor } from '@/stores/router';

describe('regressions', () => {
  it('past-simple do/did question carries a past-time context', () => {
    const ex = ALL_EXERCISES.find((e) => e.id === 'a2-pi-5');
    expect(ex).toBeTruthy();
    expect(JSON.stringify(ex)).toMatch(/Yesterday, we ___ not eat breakfast\./);
    expect(JSON.stringify(ex)).not.toMatch(/"We ___ not eat breakfast\./);
  });

  it('English placement does not highlight Lessons in the sidebar', () => {
    expect(navKeyFor({ name: 'en-placement' })).not.toBe('en-learn');
    expect(navKeyFor({ name: 'en-placement' })).toBe('en-progress');
    expect(navKeyFor({ name: 'en-lesson', lessonId: 'x' })).toBe('en-learn');
  });
});
