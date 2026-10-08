/** Exact rational arithmetic. Values are always stored in lowest terms with a positive denominator. */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b);
}

export class Fraction {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (!Number.isFinite(n) || !Number.isFinite(d)) throw new RangeError('non-finite fraction');
    if (d === 0) throw new RangeError('division by zero');
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new RangeError('non-integer fraction parts');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1;
    this.n = n / g || 0; // normalise -0
    this.d = d / g;
    if (!Number.isSafeInteger(this.n) || !Number.isSafeInteger(this.d)) throw new RangeError('fraction overflow');
  }

  static of(n: number, d = 1): Fraction {
    return new Fraction(n, d);
  }

  /** Exact parse of "p/q", "-3", "0.125", "1.5e2" is NOT supported (kept strict on purpose). */
  static parse(text: string): Fraction {
    const s = text.trim();
    let m = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(s);
    if (m) return new Fraction(Number(m[1]), Number(m[2]));
    m = /^(-?)(\d*)\.(\d+)$/.exec(s);
    if (m) {
      const digits = (m[3] as string).length;
      if (digits > 12) throw new RangeError('too many decimals');
      const den = 10 ** digits;
      const whole = Number(m[2] || '0');
      const num = whole * den + Number(m[3]);
      return new Fraction(m[1] === '-' ? -num : num, den);
    }
    if (/^-?\d+$/.test(s)) return new Fraction(Number(s), 1);
    throw new RangeError(`cannot parse fraction: ${text}`);
  }

  add(o: Fraction): Fraction {
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Fraction): Fraction {
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Fraction): Fraction {
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o: Fraction): Fraction {
    if (o.n === 0) throw new RangeError('division by zero');
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  neg(): Fraction {
    return new Fraction(-this.n, this.d);
  }
  abs(): Fraction {
    return new Fraction(Math.abs(this.n), this.d);
  }
  inv(): Fraction {
    return Fraction.of(1).div(this);
  }
  pow(e: number): Fraction {
    if (!Number.isInteger(e)) throw new RangeError('integer exponent required');
    if (e < 0) return this.inv().pow(-e);
    let out = new Fraction(1);
    for (let i = 0; i < e; i++) out = out.mul(this);
    return out;
  }
  cmp(o: Fraction): number {
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o: Fraction): boolean {
    return this.n === o.n && this.d === o.d;
  }
  lt(o: Fraction): boolean {
    return this.cmp(o) < 0;
  }
  gt(o: Fraction): boolean {
    return this.cmp(o) > 0;
  }
  isInt(): boolean {
    return this.d === 1;
  }
  isZero(): boolean {
    return this.n === 0;
  }
  sign(): number {
    return Math.sign(this.n);
  }
  toNumber(): number {
    return this.n / this.d;
  }
  floor(): number {
    return Math.floor(this.n / this.d);
  }
  /** True when the decimal expansion terminates (denominator only has factors 2 and 5). */
  terminates(): boolean {
    let d = this.d;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }
  /** Canonical string, e.g. "3/4" or "-2". */
  toString(): string {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }
  /** LaTeX, e.g. "\\frac{3}{4}" or "-\\frac{1}{2}". */
  toLatex(): string {
    if (this.d === 1) return String(this.n);
    return `${this.n < 0 ? '-' : ''}\\frac{${Math.abs(this.n)}}{${this.d}}`;
  }
  /** LaTeX mixed number when improper (e.g. 7/4 → "1\\frac{3}{4}"). */
  toMixedLatex(): string {
    if (this.d === 1 || Math.abs(this.n) < this.d) return this.toLatex();
    const whole = Math.trunc(this.n / this.d);
    const rem = Math.abs(this.n) - Math.abs(whole) * this.d;
    return `${this.n < 0 ? '-' : ''}${Math.abs(whole)}\\frac{${rem}}{${this.d}}`;
  }
  /** Decimal string with at most `max` places, trailing zeros trimmed. */
  toDecimal(max = 6): string {
    const v = this.toNumber();
    const s = v.toFixed(max);
    return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
  }
}

export const F = Fraction.of;
