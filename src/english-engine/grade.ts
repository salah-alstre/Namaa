import { matchTyped, normalizeAny, normalizeEnglish } from './normalize';
import type { Exercise, GradeResult, Response } from './types';

const miss = (expected: string, given = ''): GradeResult => ({ correct: false, expected, given });

/** Pure grading for all 17 exercise kinds. A response of the wrong shape is simply wrong. */
export function gradeExercise(ex: Exercise, r: Response): GradeResult {
  switch (ex.kind) {
    case 'mcq':
    case 'en-ar':
    case 'ar-en':
    case 'choose-word':
    case 'choose-sentence':
    case 'complete-sentence':
    case 'listen-choose':
    case 'reading-comp': {
      const expected = ex.options[ex.answer] ?? '';
      if (r.kind !== 'choice') return miss(expected);
      return { correct: r.index === ex.answer, expected, given: ex.options[r.index] ?? '' };
    }
    case 'true-false': {
      const expected = ex.answer ? 'True' : 'False';
      if (r.kind !== 'bool') return miss(expected);
      return { correct: r.value === ex.answer, expected, given: r.value ? 'True' : 'False' };
    }
    case 'fill-blank':
    case 'grammar-fix':
    case 'listen-type':
    case 'vocab-recall': {
      const expected = ex.answers[0] ?? '';
      if (r.kind !== 'text') return miss(expected);
      const m = matchTyped(r.text, ex.answers);
      return { correct: m.correct, close: m.close, expected, given: r.text.trim() };
    }
    case 'word-order': {
      if (r.kind !== 'order') return miss(ex.answer);
      const given = r.items.join(' ');
      const ok = [ex.answer, ...(ex.accept ?? [])].some((a) => normalizeEnglish(a) === normalizeEnglish(given));
      return { correct: ok, expected: ex.answer, given };
    }
    case 'sentence-order': {
      const expected = ex.lines.join(' / ');
      if (r.kind !== 'order') return miss(expected);
      const ok = r.items.length === ex.lines.length && r.items.every((x, i) => x === ex.lines[i]);
      return { correct: ok, expected, given: r.items.join(' / ') };
    }
    case 'matching': {
      const expected = ex.pairs.map(([a, b]) => `${a} = ${b}`).join(', ');
      if (r.kind !== 'pairs') return miss(expected);
      const ok = ex.pairs.every(([a, b]) => r.pairs[a] === b);
      const given = Object.entries(r.pairs)
        .map(([a, b]) => `${a} = ${b}`)
        .join(', ');
      return { correct: ok, expected, given };
    }
    case 'short-written': {
      if (r.kind !== 'text') return miss(ex.sample);
      const m = matchTyped(r.text, ex.accept);
      let ok = m.correct;
      if (!ok && ex.keywords?.length) {
        const n = ` ${normalizeAny(r.text)} `;
        ok = ex.keywords.every((group) => group.some((k) => n.includes(` ${normalizeAny(k)} `)));
      }
      return { correct: ok, close: !ok && m.close, expected: ex.sample, given: r.text.trim() };
    }
  }
}

/** The text a listening exercise should speak, if any. */
export function spokenText(ex: Exercise): string | null {
  return ex.kind === 'listen-choose' || ex.kind === 'listen-type' ? ex.say : null;
}
