import { describe, expect, it } from 'vitest';
import { isolateMath, plainMath, splitMathRuns } from './Math';

const runs = (s: string) => splitMathRuns(s).filter((p) => p.ltr).map((p) => p.value);

describe('mixed Arabic + maths (Bug 1 cases)', () => {
  it('isolates only the maths; the Arabic punctuation stays in the RTL prose', () => {
    expect(runs('اسأل: 8 × 3 = 24؟')).toEqual(['8 × 3 = 24']);
    expect(runs('24 = 8 × 3، إذن 24 ÷ 8 = 3.')).toEqual(['24 = 8 × 3', '24 ÷ 8 = 3']);
    expect(runs('إذا كان x + 5 = 12، فإن x = 7.')).toEqual(['x + 5 = 12', 'x = 7']);
    expect(runs('لأن 3/4 + 1/4 = 1.')).toEqual(['3/4 + 1/4 = 1']);
    expect(runs('بما أن -4 < 3، فالإجابة صحيحة.')).toEqual(['-4 < 3']);
    expect(runs('25% من 80 = 20.')).toEqual(['25%', '80 = 20']);
  });

  it('keeps powers, roots and tuples in one run', () => {
    expect(runs('إذن b² = c² − a² = 25 − 9.')).toEqual(['b² = c² − a² = 25 − 9']);
    expect(runs('عندما y = 0 إذن')).toEqual(['y = 0']);
    expect(runs('نصف القطر r = 5.')).toEqual(['r = 5']);
    expect(runs('النقطة (3, 4) هنا')).toEqual(['(3, 4)']);
    expect(runs('x = 7، إذن')).toEqual(['x = 7']);
  });

  it('keeps a leading list number as its own run at the start of the line', () => {
    expect(splitMathRuns('1. اسأل: 8 × 3 = 24؟')[0]).toEqual({ ltr: true, value: '1.' });
    expect(runs('2) احسب 5 + 5 = 10')).toEqual(['2)', '5 + 5 = 10']);
  });
});

describe('plainMath', () => {
  it('renders simple arithmetic as plain text with normalised spacing', () => {
    expect(plainMath('1 + 1 = 2')).toBe('1 + 1 = 2');
    expect(plainMath('1+1=2')).toBe('1 + 1 = 2');
    expect(plainMath('8 \\times 3 = 24')).toBe('8 × 3 = 24');
    expect(plainMath('24 \\div 8 = 3')).toBe('24 ÷ 8 = 3');
    expect(plainMath('x + 5 = 12')).toBe('x + 5 = 12');
    expect(plainMath('3/4 + 1/4 = 1')).toBe('3/4 + 1/4 = 1');
    expect(plainMath('-4 < 3')).toBe('−4 < 3');
    expect(plainMath('7 \\ge 2 \\times 3')).toBe('7 ≥ 2 × 3');
    expect(plainMath('537 \\square 178')).toBe('537 ? 178');
  });

  it('hands real typesetting (powers, fractions, roots, words) to KaTeX', () => {
    expect(plainMath('x^2')).toBeNull();
    expect(plainMath('\\frac{1}{2}')).toBeNull();
    expect(plainMath('\\sqrt{9}')).toBeNull();
    expect(plainMath('25\\% \\text{ of } 80')).toBeNull();
    expect(plainMath('\\alpha + 1')).toBeNull();
  });
});

describe('splitMathRuns', () => {
  it('keeps each maths expression in Arabic text as one left-to-right run', () => {
    expect(runs('قارن: 537 ? 178')).toEqual(['537 ? 178']);
    expect(runs('احسب: 15 + 7 = ?')).toEqual(['15 + 7 = ?']);
    expect(runs('حل المعادلة x + 5 = 12')).toEqual(['x + 5 = 12']);
    expect(runs('أوجد 25% من 80')).toEqual(['25%', '80']);
    expect(runs('أي علاقة صحيحة؟ -4 < 3')).toEqual(['-4 < 3']);
    expect(runs('النسبة 3:4 و 0.75')).toEqual(['3:4', '0.75']);
  });

  it('isolates a lone comparison symbol so it is never mirrored', () => {
    expect(runs('<')).toEqual(['<']);
    expect(runs('>')).toEqual(['>']);
    expect(runs('≤')).toEqual(['≤']);
  });

  it('leaves prose without digits or operators alone', () => {
    expect(splitMathRuns('اختر الإجابة الصحيحة')).toEqual([{ ltr: false, value: 'اختر الإجابة الصحيحة' }]);
  });

  it('never drops or reorders characters', () => {
    const s = 'المتباينة 7 ≥ 2 × 3 ثم 12 ÷ 4 = 3';
    expect(splitMathRuns(s).map((p) => p.value).join('')).toBe(s);
  });
});

describe('isolateMath', () => {
  it('wraps maths runs in LRI…PDI and leaves the prose untouched', () => {
    expect(isolateMath('قارن 3 < 5')).toBe('قارن ⁦3 < 5⁩');
    expect(isolateMath('<')).toBe('⁦<⁩');
  });
});
