export type Letter = 'A' | 'B' | 'C' | 'D' | 'F';

/** Letter grade for a 0..1 score. */
export function letterFor(ratio: number): Letter {
  if (ratio >= 0.9) return 'A';
  if (ratio >= 0.8) return 'B';
  if (ratio >= 0.7) return 'C';
  if (ratio >= 0.5) return 'D';
  return 'F';
}

export const LETTER_COLOR: Record<Letter, string> = {
  A: 'var(--good)',
  B: 'var(--accent)',
  C: 'var(--brand)',
  D: 'var(--warn)',
  F: 'var(--bad)',
};
