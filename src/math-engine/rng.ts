import type { Rng } from '@/types';

/** Small, fast, seedable PRNG (mulberry32). Same seed → same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => {
    if (max < min) [min, max] = [max, min];
    return min + Math.floor(next() * (max - min + 1));
  };
  const pick = <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)] as T;
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  };
  const chance = (p: number): boolean => next() < p;
  const sample = <T>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, n);
  return { next, int, pick, shuffle, chance, sample, seed };
}

/** A fresh non-deterministic seed. */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] as number;
  }
  return Math.floor(Math.random() * 4294967296);
}

/** Stable seed from a string (e.g. a date) — used for the daily challenge. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
