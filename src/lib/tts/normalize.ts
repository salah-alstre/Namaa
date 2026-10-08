import { SPEEDS } from './types';

/**
 * Turn lesson text into plain English for the voice: no markdown, HTML, UI marks or Arabic. Punctuation is kept
 * because it drives the pauses and intonation.
 */
export function normalizeForSpeech(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿‎‏‪-‮⁦-⁩]/g, ' ')
    .replace(/_{2,}/g, ' blank ')
    .replace(/`+/g, '')
    .replace(/(\*\*|__|\*|~~)/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Snap any stored/odd rate to one of the offered speeds (0.65, 0.75, 1, 1.1). */
export function normalizeRate(r: number): number {
  if (!Number.isFinite(r) || r <= 0) return 1;
  return [...SPEEDS].sort((a, b) => Math.abs(a - r) - Math.abs(b - r))[0] ?? 1;
}
