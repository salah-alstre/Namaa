import { Fraction } from './fraction';

/**
 * Multivariate polynomials with exact rational coefficients, plus a forgiving
 * parser ("2x+3", "3(x - 1)", "(x+1)(x-1)", "x^2 - 4", "½x"). Used to check
 * algebraic answers by *equivalence*, never by string comparison.
 */

export type Poly = Map<string, Fraction>;

const ZERO = new Fraction(0);

export function polyConst(c: Fraction): Poly {
  const p: Poly = new Map();
  if (!c.isZero()) p.set('', c);
  return p;
}

export function polyVar(v: string): Poly {
  return new Map([[`${v}1`, new Fraction(1)]]);
}

function parseKey(key: string): [string, number][] {
  const out: [string, number][] = [];
  const re = /([a-z])(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(key))) out.push([m[1] as string, Number(m[2])]);
  return out;
}

function buildKey(powers: Map<string, number>): string {
  return [...powers.entries()]
    .filter(([, e]) => e > 0)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([v, e]) => `${v}${e}`)
    .join('');
}

export function polyAdd(a: Poly, b: Poly, sign = 1): Poly {
  const out: Poly = new Map(a);
  for (const [k, c] of b) {
    const next = (out.get(k) ?? ZERO).add(sign === 1 ? c : c.neg());
    if (next.isZero()) out.delete(k);
    else out.set(k, next);
  }
  return out;
}

export function polyMul(a: Poly, b: Poly): Poly {
  const out: Poly = new Map();
  for (const [ka, ca] of a) {
    for (const [kb, cb] of b) {
      const powers = new Map<string, number>();
      for (const [v, e] of parseKey(ka)) powers.set(v, (powers.get(v) ?? 0) + e);
      for (const [v, e] of parseKey(kb)) powers.set(v, (powers.get(v) ?? 0) + e);
      const key = buildKey(powers);
      const next = (out.get(key) ?? ZERO).add(ca.mul(cb));
      if (next.isZero()) out.delete(key);
      else out.set(key, next);
    }
  }
  return out;
}

export function polyPow(a: Poly, e: number): Poly {
  let out = polyConst(new Fraction(1));
  for (let i = 0; i < e; i++) out = polyMul(out, a);
  return out;
}

export function polyScale(a: Poly, c: Fraction): Poly {
  const out: Poly = new Map();
  if (c.isZero()) return out;
  for (const [k, v] of a) out.set(k, v.mul(c));
  return out;
}

export function polyEquals(a: Poly, b: Poly): boolean {
  if (a.size !== b.size) return false;
  for (const [k, c] of a) {
    const o = b.get(k);
    if (!o || !o.eq(c)) return false;
  }
  return true;
}

export function polyConstantValue(a: Poly): Fraction | null {
  if (a.size === 0) return new Fraction(0);
  if (a.size === 1 && a.has('')) return a.get('') as Fraction;
  return null;
}

export function polyDegree(a: Poly): number {
  let d = 0;
  for (const k of a.keys()) d = Math.max(d, parseKey(k).reduce((s, [, e]) => s + e, 0));
  return d;
}

/** Evaluate with all variables bound (used for spot-checking). */
export function polyEval(a: Poly, vars: Record<string, Fraction>): Fraction {
  let sum = new Fraction(0);
  for (const [k, c] of a) {
    let term = c;
    for (const [v, e] of parseKey(k)) term = term.mul((vars[v] ?? new Fraction(0)).pow(e));
    sum = sum.add(term);
  }
  return sum;
}

function orderedTerms(a: Poly): [string, Fraction][] {
  return [...a.entries()].sort(([ka], [kb]) => {
    const da = parseKey(ka).reduce((s, [, e]) => s + e, 0);
    const db = parseKey(kb).reduce((s, [, e]) => s + e, 0);
    if (da !== db) return db - da;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** Canonical text, stable for equal polynomials. */
export function polyCanon(a: Poly): string {
  if (a.size === 0) return '0';
  return orderedTerms(a)
    .map(([k, c]) => `${c.toString()}*${k || '1'}`)
    .join('+');
}

/** Pretty LaTeX, e.g. "2x^{2} - 3x + 1". */
export function polyLatex(a: Poly): string {
  if (a.size === 0) return '0';
  let out = '';
  orderedTerms(a).forEach(([k, c], i) => {
    const mag = c.abs();
    const vars = parseKey(k)
      .map(([v, e]) => (e === 1 ? v : `${v}^{${e}}`))
      .join('');
    const coefStr = vars && mag.eq(new Fraction(1)) ? '' : mag.toLatex();
    const body = vars ? `${coefStr}${vars}` : mag.toLatex();
    if (i === 0) out += (c.n < 0 ? '-' : '') + body;
    else out += (c.n < 0 ? ' - ' : ' + ') + body;
  });
  return out;
}

// ───────────────────────── Parser ─────────────────────────

const MAX_LEN = 240;
const MAX_EXP = 12;

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const SUPERS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
const VULGAR: Record<string, string> = { '½': '(1/2)', '¼': '(1/4)', '¾': '(3/4)', '⅓': '(1/3)', '⅔': '(2/3)', '⅕': '(1/5)', '⅛': '(1/8)' };

/** Normalise typographic variants, Arabic digits and Arabic variable letters. */
export function normalizeMathInput(text: string): string {
  let s = text.normalize('NFKC');
  s = s.replace(/[٠-٩]/g, (c) => String(ARABIC_DIGITS.indexOf(c)));
  s = s.replace(/[۰-۹]/g, (c) => String(PERSIAN_DIGITS.indexOf(c)));
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => `^${SUPERS[c]}`);
  s = s.replace(/[½¼¾⅓⅔⅕⅛]/g, (c) => VULGAR[c] as string);
  s = s
    .replace(/[−–—‒]/g, '-')
    .replace(/[×·∙⋅]/g, '*')
    .replace(/[÷∕⁄]/g, '/')
    .replace(/٫/g, '.')
    .replace(/[٬،]/g, ',')
    .replace(/٪/g, '%')
    .replace(/[\[{]/g, '(')
    .replace(/[\]}]/g, ')')
    .replace(/س/g, 'x')
    .replace(/ص/g, 'y')
    .replace(/ع/g, 'z')
    .replace(/\*\*/g, '^');
  return s.toLowerCase();
}

type Tok = { t: 'num'; v: Fraction } | { t: 'var'; v: string } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j] as string)) j++;
      const raw = src.slice(i, j);
      if ((raw.match(/\./g) ?? []).length > 1 || raw === '.') return null;
      try {
        toks.push({ t: 'num', v: Fraction.parse(raw.startsWith('.') ? `0${raw}` : raw.endsWith('.') ? raw.slice(0, -1) : raw) });
      } catch {
        return null;
      }
      i = j;
      continue;
    }
    if (/[a-z]/.test(c)) {
      toks.push({ t: 'var', v: c });
      i++;
      continue;
    }
    if ('+-*/^()'.includes(c)) {
      toks.push({ t: 'op', v: c });
      i++;
      continue;
    }
    return null;
  }
  return toks;
}

class Parser {
  private pos = 0;
  constructor(private toks: Tok[]) {}

  parse(): Poly {
    const p = this.expr();
    if (this.pos !== this.toks.length) throw new Error('trailing input');
    return p;
  }

  private peek(): Tok | undefined {
    return this.toks[this.pos];
  }
  private isOp(v: string): boolean {
    const t = this.peek();
    return !!t && t.t === 'op' && t.v === v;
  }

  private expr(): Poly {
    let left = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const op = (this.toks[this.pos++] as { v: string }).v;
      const right = this.term();
      left = polyAdd(left, right, op === '+' ? 1 : -1);
    }
    return left;
  }

  private startsFactor(): boolean {
    const t = this.peek();
    if (!t) return false;
    return t.t === 'num' || t.t === 'var' || (t.t === 'op' && t.v === '(');
  }

  private term(): Poly {
    let left = this.unary();
    for (;;) {
      if (this.isOp('*')) {
        this.pos++;
        left = polyMul(left, this.unary());
      } else if (this.isOp('/')) {
        this.pos++;
        const right = this.unary();
        const c = polyConstantValue(right);
        if (!c || c.isZero()) throw new Error('division by non-constant');
        left = polyScale(left, c.inv());
      } else if (this.startsFactor()) {
        left = polyMul(left, this.power());
      } else break;
    }
    return left;
  }

  private unary(): Poly {
    if (this.isOp('-')) {
      this.pos++;
      return polyScale(this.unary(), new Fraction(-1));
    }
    if (this.isOp('+')) {
      this.pos++;
      return this.unary();
    }
    return this.power();
  }

  private power(): Poly {
    const base = this.atom();
    if (this.isOp('^')) {
      this.pos++;
      let neg = false;
      let paren = false;
      if (this.isOp('(')) {
        paren = true;
        this.pos++;
      }
      if (this.isOp('-')) {
        neg = true;
        this.pos++;
      }
      const t = this.peek();
      if (!t || t.t !== 'num' || !t.v.isInt()) throw new Error('bad exponent');
      this.pos++;
      if (paren) {
        if (!this.isOp(')')) throw new Error('missing )');
        this.pos++;
      }
      const e = t.v.n;
      if (e > MAX_EXP) throw new Error('exponent too large');
      if (neg) {
        const c = polyConstantValue(base);
        if (!c || c.isZero()) throw new Error('negative exponent of non-constant');
        return polyConst(c.pow(-e));
      }
      return polyPow(base, e);
    }
    return base;
  }

  private atom(): Poly {
    const t = this.toks[this.pos++];
    if (!t) throw new Error('unexpected end');
    if (t.t === 'num') return polyConst(t.v);
    if (t.t === 'var') return polyVar(t.v);
    if (t.v === '(') {
      const p = this.expr();
      if (!this.isOp(')')) throw new Error('missing )');
      this.pos++;
      return p;
    }
    throw new Error('unexpected token');
  }
}

/** Parse an algebraic expression into a polynomial, or null when it is not valid. */
export function parsePoly(text: string): Poly | null {
  if (text.length > MAX_LEN) return null;
  const toks = tokenize(normalizeMathInput(text));
  if (!toks || toks.length === 0) return null;
  try {
    return new Parser(toks).parse();
  } catch {
    return null;
  }
}

/** Canonical form of an expression (equal for algebraically equal inputs). */
export function canonExpr(text: string): string | null {
  const p = parsePoly(text);
  return p ? polyCanon(p) : null;
}

export function exprEquivalent(a: string, b: string): boolean {
  const pa = parsePoly(a);
  const pb = parsePoly(b);
  return !!pa && !!pb && polyEquals(pa, pb);
}
