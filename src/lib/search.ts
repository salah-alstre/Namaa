/** Text search that treats Arabic spelling variants and Arabic-Indic digits as equal. */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export function normalizeSearch(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\$/g, '')
    .replace(/[\\{}^_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Searchable<T> {
  item: T;
  /** Strongest fields first: title in both languages, then secondary text. */
  titles: string[];
  extra: string[];
}

/** 0 = no match. Starts-with beats word-start beats substring beats "all words appear". */
export function scoreMatch(query: string, titles: string[], extra: string[]): number {
  const q = normalizeSearch(query);
  if (!q) return 1;
  const words = q.split(' ').filter(Boolean);
  let best = 0;
  for (const raw of titles) {
    const t = normalizeSearch(raw);
    if (!t) continue;
    if (t === q) best = Math.max(best, 100);
    else if (t.startsWith(q)) best = Math.max(best, 80);
    else if (t.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 65);
    else if (t.includes(q)) best = Math.max(best, 50);
    else if (words.length > 1 && words.every((w) => t.includes(w))) best = Math.max(best, 40);
  }
  if (best > 0) return best;
  const hay = normalizeSearch(extra.join(' '));
  if (hay.includes(q)) return 20;
  if (words.length > 1 && words.every((w) => hay.includes(w))) return 10;
  return 0;
}

export function search<T>(query: string, items: Searchable<T>[], limit = 8): T[] {
  return items
    .map((s) => ({ item: s.item, score: scoreMatch(query, s.titles, s.extra) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}
