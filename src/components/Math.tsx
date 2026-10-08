import { memo, useMemo } from 'react';
import katex from 'katex';
import clsx from 'clsx';
import { useI18n } from '@/i18n';

const cache = new Map<string, string>();

function render(tex: string, display: boolean): string {
  const key = (display ? 'D' : 'I') + tex;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let html: string;
  try {
    // Blanks and comparison slots read as "?", not as KaTeX's thin empty box.
    html = katex.renderToString(tex.replace(/\\square(?![A-Za-z])/g, '\\mathord{?}'), { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
  } catch {
    html = tex.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
  }
  if (cache.size > 800) cache.clear();
  cache.set(key, html);
  return html;
}

const PLAIN_CMD: Record<string, string> = {
  times: '×', div: '÷', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', cdot: '·', pm: '±',
  square: '?', '%': '%', ',': ' ', ';': ' ', ' ': ' ', '!': '',
};
const TEX_CMD = /\\([A-Za-z]+|[%,;! ])/g;

/**
 * Simple arithmetic (digits, + − × ÷ = < > ≤ ≥ ≠ %, ( ), "?", single-letter variables) as plain text, or null when the
 * TeX needs real typesetting (powers, fractions, roots, words…). One run of text in one font sits on one baseline,
 * stays selectable as exactly what it shows, and has no nested boxes for the layout engine to misplace.
 */
export function plainMath(tex: string): string | null {
  if (/[\^_{}~$&#]/.test(tex)) return null;
  let bad = false;
  let out = tex.replace(TEX_CMD, (_, c: string) => {
    const v = PLAIN_CMD[c];
    if (v === undefined) bad = true;
    return v ?? '';
  });
  if (bad || out.includes('\\')) return null;
  out = out.replace(/-/g, '−');
  if (!/^[\d\s.,:+−×÷=<>≤≥≠±%?/()·  A-Za-z]*$/.test(out)) return null;
  if (/[A-Za-z]{2,}/.test(out)) return null;
  out = out.replace(/\s+/g, ' ').trim();
  // Binary operators and relations get a space on both sides; a leading sign stays tight ("−4", "= −3").
  return out.replace(/(?<=[\w)%?])\s*([+−×÷=<>≤≥≠±])\s*(?=[\w(−?])/g, ' $1 ');
}

function PlainMath({ text }: { text: string }) {
  return (
    <>
      {text.split(/([A-Za-z])/).map((part, i) =>
        i % 2 === 1 ? (
          <i key={i} className="mv">
            {part}
          </i>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** A LaTeX expression. Always laid out left-to-right, even inside Arabic text. */
export const Tex = memo(function Tex({ tex, block = false, className }: { tex: string; block?: boolean; className?: string }) {
  const plain = useMemo(() => plainMath(tex), [tex]);
  const html = useMemo(() => (plain === null ? render(tex, block) : ''), [tex, block, plain]);
  if (plain !== null) {
    return block ? (
      <div className={clsx('math-block math-plain', className)} dir="ltr">
        <PlainMath text={plain} />
      </div>
    ) : (
      <span className={clsx('math-plain', className)} dir="ltr">
        <PlainMath text={plain} />
      </span>
    );
  }
  return block ? (
    <div className={clsx('math-block', className)} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className={clsx('math', className)} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

type Piece = { kind: 'text' | 'math' | 'bold'; value: string };

/** Split "text $x^2$ and **bold**" into pieces. A lone "$" (e.g. a price) stays text. */
export function parseRich(src: string): Piece[] {
  const out: Piece[] = [];
  const re = /\$([^$\n]+)\$|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ kind: 'text', value: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: 'math', value: m[1] });
    else out.push({ kind: 'bold', value: m[2] ?? '' });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ kind: 'text', value: src.slice(last) });
  return out;
}

/**
 * A run of plain-text maths: numbers, single-letter variables, operators, brackets and "?".
 * Kept together so it can be laid out left-to-right inside Arabic text.
 */
const ATOM = String.raw`(?:\d+(?:[.,٫:]\d+)*|[٠-٩]+|\b[A-Za-z]\b|[-−+×÷*=<>≤≥≠±%?/^()\[\]{}|²³¹⁰⁴-⁹ⁿ√π°′″∞∠·])`;
/** An ASCII comma joins two maths atoms ("(3, 4)") but never ends a run, so "x = 7، إذن" keeps its comma in the prose. */
const RUN = new RegExp(`${ATOM}(?:[ \t]*${ATOM}|,[ \t]*(?=${ATOM}))*`, 'g');
/** A run only counts as maths when it holds a digit or a relation / arithmetic operator. */
const MATHY = /[\d٠-٩=<>≤≥≠×÷²³√π°]/;
/** "1. " or "2) " opening a line: a list number, kept as one run so it stays at the start of the line. */
const LIST_MARKER = /^[ \t]*\d{1,2}[.)](?=[ \t])/;

type TextPiece = { ltr: boolean; value: string };

/** Split plain text into prose and left-to-right maths runs ("537 ? 178", "15 + 7 = ?", "<"). */
export function splitMathRuns(src: string): TextPiece[] {
  const out: TextPiece[] = [];
  let last = 0;
  const marker = LIST_MARKER.exec(src);
  if (marker) {
    const lead = marker[0].length - marker[0].trimStart().length;
    if (lead > 0) out.push({ ltr: false, value: marker[0].slice(0, lead) });
    out.push({ ltr: true, value: marker[0].slice(lead) });
    last = marker[0].length;
  }
  for (const m of src.matchAll(RUN)) {
    const at = m.index ?? 0;
    if (at < last || !MATHY.test(m[0])) continue;
    if (at > last) out.push({ ltr: false, value: src.slice(last, at) });
    out.push({ ltr: true, value: m[0] });
    last = at + m[0].length;
  }
  if (last < src.length) out.push({ ltr: false, value: src.slice(last) });
  return out;
}

/** The same isolation for places that only accept a string (e.g. native <option>): wraps maths runs in LRI…PDI. */
export function isolateMath(src: string): string {
  return splitMathRuns(src)
    .map((p) => (p.ltr ? `⁦${p.value}⁩` : p.value))
    .join('');
}

function Text({ value }: { value: string }) {
  const parts = useMemo(() => splitMathRuns(value), [value]);
  return (
    <>
      {parts.map((p, i) =>
        p.ltr ? (
          <span key={i} className="ltr math-plain" dir="ltr">
            {p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </>
  );
}

/** Text with inline maths ($…$) and **bold**. Maths, and numbers or operators in plain text, never flip in RTL. */
export const Rich = memo(function Rich({ text, className }: { text: string; className?: string }) {
  const pieces = useMemo(() => parseRich(text), [text]);
  return (
    <span className={className}>
      {pieces.map((p, i) =>
        p.kind === 'math' ? (
          <Tex key={i} tex={p.value} />
        ) : p.kind === 'bold' ? (
          <strong key={i}>
            <Text value={p.value} />
          </strong>
        ) : (
          <Text key={i} value={p.value} />
        ),
      )}
    </span>
  );
});

/** True when a hint/step string contains maths markup. */
export const hasMarkup = (s: string): boolean => /\$|\*\*/.test(s);

/** Numbered steps. The number is its own left-to-right box at the start of the line, so the bidi algorithm cannot move it. */
export function Steps({ items, className }: { items: string[]; className?: string }) {
  const { n } = useI18n();
  return (
    <ol className={clsx('space-y-1.5', className)}>
      {items.map((s, i) => (
        <li key={i} className="flex items-baseline gap-2">
          <span className="ltr num shrink-0 font-semibold text-ink-3" dir="ltr">
            {n(i + 1)}.
          </span>
          <span className="min-w-0 flex-1">
            <Rich text={s} />
          </span>
        </li>
      ))}
    </ol>
  );
}
