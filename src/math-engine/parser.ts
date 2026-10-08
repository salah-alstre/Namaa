import { Fraction } from './fraction';
import { normalizeMathInput, parsePoly, polyConstantValue } from './poly';

/**
 * Turns what a person typed into an exact Fraction.
 * Understands: 3/4, -2, 0.75, ٠٫٧٥, 1,000, 1 3/4 (mixed), 50%, x = 5, 2*3, (1/2)+(1/4), ½.
 * It never uses float string comparison.
 */

export interface ParsedNumber {
  value: Fraction;
  /** The input ended with a percent sign. */
  hadPercent: boolean;
  /** Normalised text the value was parsed from. */
  text: string;
}

const MAX_DECIMALS = 12;

function fromDecimalString(s: string): Fraction {
  const m = /^(-?)(\d*)\.(\d+)$/.exec(s);
  if (m && (m[3] as string).length > MAX_DECIMALS) {
    // Too precise for an exact fraction: round to what we can represent.
    return Fraction.parse(Number(s).toFixed(MAX_DECIMALS));
  }
  return Fraction.parse(s.startsWith('.') ? `0${s}` : s.startsWith('-.') ? `-0${s.slice(1)}` : s);
}

/** Resolve thousands separators / decimal commas in a plain numeric token. */
function normalizeSeparators(s: string): string {
  if (!s.includes(',')) return s;
  if (s.includes('.')) return s.replace(/,/g, ''); // 1,234.5
  if (/^-?\d{1,3}(,\d{3})+$/.test(s)) return s.replace(/,/g, ''); // 1,000 → 1000
  if ((s.match(/,/g) ?? []).length === 1) return s.replace(',', '.'); // 3,5 → 3.5
  return s;
}

export function parseNumberInput(input: string): ParsedNumber | null {
  if (!input || input.length > 80) return null;
  let s = normalizeMathInput(input).trim();
  s = s.replace(/^[a-z]\s*=\s*/, '').replace(/\s*=\s*$/, '').trim();
  if (!s) return null;

  let hadPercent = false;
  if (s.endsWith('%')) {
    hadPercent = true;
    s = s.slice(0, -1).trim();
    if (!s) return null;
  }
  s = s.replace(/\s+/g, ' ');

  try {
    // Mixed number: "1 3/4", "-2 1/2"
    let m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s);
    if (m) {
      const whole = Fraction.of(Number(m[2]));
      const frac = Fraction.of(Number(m[3]), Number(m[4]));
      const v = whole.add(frac);
      return { value: m[1] === '-' ? v.neg() : v, hadPercent, text: s };
    }

    const compact = normalizeSeparators(s.replace(/ /g, ''));

    // Plain integer, decimal or p/q
    if (/^-?(\d+|\d*\.\d+)$/.test(compact)) {
      return { value: fromDecimalString(compact), hadPercent, text: compact };
    }
    m = /^(-?\d+)\/(-?\d+)$/.exec(compact);
    if (m) {
      return { value: Fraction.of(Number(m[1]), Number(m[2])), hadPercent, text: compact };
    }
    m = /^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/.exec(compact);
    if (m) {
      return { value: fromDecimalString(m[1] as string).div(fromDecimalString(m[2] as string)), hadPercent, text: compact };
    }

    // Constant expression: 2*3, (1/2)+(1/4), 3-5 …
    if (/[a-z]/.test(s)) return null;
    const poly = parsePoly(s);
    const c = poly ? polyConstantValue(poly) : null;
    if (c) return { value: c, hadPercent, text: s };
  } catch {
    return null; // division by zero, overflow …
  }
  return null;
}

/** All p/q pairs written in the input (used to check "lowest terms"). */
export function writtenFractions(input: string): [number, number][] {
  const out: [number, number][] = [];
  const re = /(\d+)\s*\/\s*(\d+)/g;
  const s = normalizeMathInput(input);
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push([Number(m[1]), Number(m[2])]);
  return out;
}

/** Split "3, 5", "x=3 or x=5", "3 و 5", "3 5" into parts. */
export function splitList(input: string): string[] {
  const s = normalizeMathInput(input)
    .replace(/\b(or|and)\b/g, ',')
    .replace(/[وأ]/g, ',')
    .replace(/[;،؛]/g, ',');
  let parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  // "3 5" with no commas: split on spaces unless it looks like a mixed number.
  if (parts.length === 1 && /\s/.test(parts[0] as string) && !/^-?\d+ \d+\/\d+$/.test(parts[0] as string)) {
    parts = (parts[0] as string).split(/\s+/);
  }
  return parts;
}
