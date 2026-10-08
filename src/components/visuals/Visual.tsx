import type { ReactNode } from 'react';
import { Tex } from '@/components/Math';
import { useI18n } from '@/i18n';
import type { VisualSpec } from '@/types';

const W = 360;

function Frame({ h, children, label }: { h: number; children: ReactNode; label?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      className="mx-auto block h-auto w-full max-w-[28rem]"
      role="img"
      aria-label={label}
      direction="ltr"
    >
      {children}
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function sectorPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function fmt(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

function FractionBar({ num, den }: { num: number; den: number }) {
  const bars = Math.max(1, Math.ceil(num / den));
  const bw = 300;
  const bh = 34;
  const gap = 12;
  const h = bars * (bh + gap) + 24;
  return (
    <Frame h={h} label={`${num}/${den}`}>
      {Array.from({ length: bars }, (_, b) => {
        const filled = Math.max(0, Math.min(den, num - b * den));
        const y = 12 + b * (bh + gap);
        const cw = bw / den;
        return (
          <g key={b}>
            {Array.from({ length: den }, (_, i) => (
              <rect
                key={i}
                x={30 + i * cw}
                y={y}
                width={cw}
                height={bh}
                className={i < filled ? 'fill-brand stroke-surface' : 'fill-surface-3 stroke-surface'}
                strokeWidth={2}
                rx={3}
              />
            ))}
          </g>
        );
      })}
    </Frame>
  );
}

function Pie({ num, den }: { num: number; den: number }) {
  const pies = Math.max(1, Math.ceil(num / den));
  const r = pies > 2 ? 42 : 62;
  const perRow = Math.min(pies, 3);
  const rows = Math.ceil(pies / perRow);
  const cellW = W / perRow;
  const cellH = r * 2 + 20;
  return (
    <Frame h={rows * cellH + 10} label={`${num}/${den}`}>
      {Array.from({ length: pies }, (_, p) => {
        const filled = Math.max(0, Math.min(den, num - p * den));
        const cx = (p % perRow) * cellW + cellW / 2;
        const cy = Math.floor(p / perRow) * cellH + r + 10;
        const step = 360 / den;
        return (
          <g key={p}>
            <circle cx={cx} cy={cy} r={r} className="fill-surface-3 stroke-surface" strokeWidth={2} />
            {den === 1 && filled === 1 && <circle cx={cx} cy={cy} r={r} className="fill-brand" />}
            {den > 1 &&
              Array.from({ length: den }, (_, i) => (
                <path
                  key={i}
                  d={sectorPath(cx, cy, r, i * step, (i + 1) * step)}
                  className={i < filled ? 'fill-brand stroke-surface' : 'fill-surface-3 stroke-surface'}
                  strokeWidth={2}
                />
              ))}
          </g>
        );
      })}
    </Frame>
  );
}

function niceStep(min: number, max: number): number {
  const span = max - min;
  const raw = span / 10;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  const n = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return n * pow;
}

function NumberLine({ spec }: { spec: Extract<VisualSpec, { type: 'number-line' }> }) {
  const { min, max, marks = [], jump } = spec;
  let step = spec.step && spec.step > 0 ? spec.step : niceStep(min, max);
  while ((max - min) / step > 40) step *= 2;
  const x0 = 24;
  const x1 = W - 24;
  const y = jump ? 92 : 70;
  const at = (v: number) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  const count = Math.round((max - min) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) => min + i * step);
  const labelEvery = ticks.length > 14 ? 2 : 1;
  const h = jump ? 130 : 110;
  return (
    <Frame h={h} label="number line">
      <line x1={x0 - 8} x2={x1 + 8} y1={y} y2={y} className="stroke-ink-3" strokeWidth={2} strokeLinecap="round" />
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={at(v)} x2={at(v)} y1={y - 6} y2={y + 6} className="stroke-ink-3" strokeWidth={1.5} />
          {i % labelEvery === 0 && (
            <text x={at(v)} y={y + 24} textAnchor="middle" className="fill-ink-2 num" fontSize={11}>
              {fmt(v)}
            </text>
          )}
        </g>
      ))}
      {marks.map((m, i) => (
        <g key={`m${i}`}>
          <circle cx={at(m)} cy={y} r={6} className="fill-brand stroke-surface" strokeWidth={2} />
          <text x={at(m)} y={y - 14} textAnchor="middle" className="fill-brand num" fontSize={12} fontWeight={700}>
            {fmt(m)}
          </text>
        </g>
      ))}
      {jump && (
        <g>
          {(() => {
            const a = at(jump.from);
            const b = at(jump.to);
            const mid = (a + b) / 2;
            const lift = Math.min(54, Math.max(24, Math.abs(b - a) / 2));
            const dir = b >= a ? 1 : -1;
            return (
              <>
                <path d={`M ${a} ${y - 8} Q ${mid} ${y - 8 - lift * 1.6} ${b} ${y - 8}`} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinecap="round" />
                <path d={`M ${b - 6 * dir} ${y - 17} L ${b} ${y - 8} L ${b - 9 * dir} ${y - 6}`} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </>
            );
          })()}
        </g>
      )}
    </Frame>
  );
}

function Grid({ rows, cols, shaded = 0 }: { rows: number; cols: number; shaded?: number }) {
  const cell = Math.min(34, Math.floor(300 / cols), Math.floor(200 / rows));
  const w = cols * cell;
  const h = rows * cell;
  const ox = (W - w) / 2;
  return (
    <Frame h={h + 20} label={`${rows}×${cols}`}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return (
          <rect
            key={i}
            x={ox + c * cell}
            y={10 + r * cell}
            width={cell}
            height={cell}
            className={i < shaded ? 'fill-brand stroke-surface' : 'fill-surface-3 stroke-surface'}
            strokeWidth={cell > 20 ? 2 : 1}
            rx={cell > 20 ? 4 : 1}
          />
        );
      })}
    </Frame>
  );
}

function Balance({ left, right }: { left: string; right: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center" dir="ltr">
      <div className="flex w-full items-center justify-center gap-3">
        <div className="flex min-h-[3.5rem] flex-1 items-center justify-center rounded-xl border border-line bg-brand-soft px-3 py-2 text-lg text-brand">
          <Tex tex={left} />
        </div>
        <span className="text-xl font-semibold text-ink-3">=</span>
        <div className="flex min-h-[3.5rem] flex-1 items-center justify-center rounded-xl border border-line bg-accent-soft px-3 py-2 text-lg text-accent">
          <Tex tex={right} />
        </div>
      </div>
      <svg viewBox="0 0 200 40" className="mt-1 h-10 w-52" aria-hidden>
        <line x1={10} x2={190} y1={8} y2={8} className="stroke-ink-3" strokeWidth={4} strokeLinecap="round" />
        <path d="M 100 8 L 84 36 L 116 36 Z" className="fill-ink-3" />
      </svg>
    </div>
  );
}

function Shape({ spec }: { spec: Extract<VisualSpec, { type: 'shape' }> }) {
  const { shape, labels } = spec;
  const lab = (i: number) => labels[i] ?? '';
  const txt = 'fill-ink-2 num';
  const body = 'fill-brand-soft stroke-brand';
  if (shape === 'rect' || shape === 'square') {
    const w = shape === 'square' ? 120 : 190;
    const h = shape === 'square' ? 120 : 110;
    const x = (W - w) / 2;
    const y = 24;
    return (
      <Frame h={h + 70} label="shape">
        <rect x={x} y={y} width={w} height={h} rx={6} className={body} strokeWidth={2.5} />
        <text x={W / 2} y={y + h + 24} textAnchor="middle" className={txt} fontSize={14}>{lab(0)}</text>
        <text x={x + w + 12} y={y + h / 2 + 5} textAnchor="start" className={txt} fontSize={14}>{shape === 'square' ? '' : lab(1)}</text>
        {labels.length > 2 && (
          <text x={W / 2} y={y + h / 2 + 5} textAnchor="middle" className="fill-brand num" fontSize={14} fontWeight={700}>{lab(2)}</text>
        )}
      </Frame>
    );
  }
  if (shape === 'triangle') {
    const bx = 70;
    const bw = 220;
    const top = 28;
    const h = 120;
    const apex = 150;
    return (
      <Frame h={h + 70} label="triangle">
        <path d={`M ${bx} ${top + h} L ${bx + bw} ${top + h} L ${apex} ${top} Z`} className={body} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={apex} x2={apex} y1={top} y2={top + h} className="stroke-accent" strokeWidth={2} strokeDasharray="5 4" />
        <text x={bx + bw / 2} y={top + h + 24} textAnchor="middle" className={txt} fontSize={14}>{lab(0)}</text>
        <text x={apex + 8} y={top + h / 2 + 5} className="fill-accent num" fontSize={14}>{lab(1)}</text>
      </Frame>
    );
  }
  if (shape === 'circle') {
    const r = 70;
    const cx = W / 2;
    const cy = 90;
    return (
      <Frame h={190} label="circle">
        <circle cx={cx} cy={cy} r={r} className={body} strokeWidth={2.5} />
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} className="stroke-accent" strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={3.5} className="fill-ink" />
        <text x={cx + r / 2} y={cy - 8} textAnchor="middle" className="fill-accent num" fontSize={14}>{lab(0)}</text>
      </Frame>
    );
  }
  // right-triangle: vertical leg, horizontal leg, hypotenuse
  const x = 90;
  const base = 170;
  const lw = 190;
  const lh = 130;
  const s = 14;
  return (
    <Frame h={base + 50} label="right triangle">
      <path d={`M ${x} ${base} L ${x + lw} ${base} L ${x} ${base - lh} Z`} className={body} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M ${x} ${base - s} L ${x + s} ${base - s} L ${x + s} ${base}`} fill="none" className="stroke-ink-3" strokeWidth={1.5} />
      <text x={x - 10} y={base - lh / 2} textAnchor="end" className={txt} fontSize={14}>{lab(0)}</text>
      <text x={x + lw / 2} y={base + 24} textAnchor="middle" className={txt} fontSize={14}>{lab(1)}</text>
      <text x={x + lw / 2 + 14} y={base - lh / 2 - 6} textAnchor="start" className="fill-accent num" fontSize={14}>{lab(2)}</text>
    </Frame>
  );
}

function Angle({ degrees }: { degrees: number }) {
  const cx = 110;
  const cy = 140;
  const len = 150;
  const a = Math.max(1, Math.min(359, degrees));
  const [ex, ey] = [cx + len * Math.cos((-a * Math.PI) / 180), cy + len * Math.sin((-a * Math.PI) / 180)];
  const r = 44;
  const [ax, ay] = [cx + r * Math.cos((-a * Math.PI) / 180), cy + r * Math.sin((-a * Math.PI) / 180)];
  const large = a > 180 ? 1 : 0;
  const mid = (-a / 2) * (Math.PI / 180);
  return (
    <Frame h={170} label={`${degrees}°`}>
      <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 ${large} 0 ${ax} ${ay}`} fill="none" className="stroke-accent" strokeWidth={3} />
      <line x1={cx} y1={cy} x2={cx + len} y2={cy} className="stroke-ink" strokeWidth={3} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} className="stroke-ink" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} className="fill-brand" />
      <text x={cx + (r + 22) * Math.cos(mid)} y={cy + (r + 22) * Math.sin(mid) + 5} textAnchor="middle" className="fill-accent num" fontSize={14} fontWeight={700}>
        {degrees}°
      </text>
    </Frame>
  );
}

function Bars({ values }: { values: { label: string; value: number }[] }) {
  const maxV = Math.max(1, ...values.map((v) => v.value));
  const area = 120;
  const gap = 12;
  const bw = Math.min(56, (W - 60 - gap * (values.length - 1)) / Math.max(1, values.length));
  const total = values.length * bw + (values.length - 1) * gap;
  const ox = (W - total) / 2;
  return (
    <Frame h={area + 56} label="bar chart">
      <line x1={ox - 10} x2={ox + total + 10} y1={area + 20} y2={area + 20} className="stroke-ink-3" strokeWidth={1.5} />
      {values.map((v, i) => {
        const bh = Math.max(2, (v.value / maxV) * area);
        const x = ox + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={area + 20 - bh} width={bw} height={bh} rx={5} className="fill-brand" />
            <text x={x + bw / 2} y={area + 20 - bh - 6} textAnchor="middle" className="fill-ink-2 num" fontSize={12} fontWeight={600}>{fmt(v.value)}</text>
            <text x={x + bw / 2} y={area + 38} textAnchor="middle" className="fill-ink-2 num" fontSize={12}>{v.label}</text>
          </g>
        );
      })}
    </Frame>
  );
}

function LineGraph({ m, b }: { m: number; b: number }) {
  const xMin = -1;
  const xMax = 5;
  const ys = [m * xMin + b, m * xMax + b, 0];
  const yMin = Math.floor(Math.min(...ys, -1));
  const yMax = Math.ceil(Math.max(...ys, 1));
  const L = 40;
  const R = W - 16;
  const T = 14;
  const B = 176;
  const px = (x: number) => L + ((x - xMin) / (xMax - xMin)) * (R - L);
  const py = (y: number) => B - ((y - yMin) / (yMax - yMin)) * (B - T);
  const ySpan = yMax - yMin;
  const yStep = ySpan > 12 ? 4 : ySpan > 6 ? 2 : 1;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) yTicks.push(v);
  const xTicks = Array.from({ length: xMax - xMin + 1 }, (_, i) => xMin + i);
  return (
    <Frame h={200} label={`y = ${m}x + ${b}`}>
      {xTicks.map((x) => (
        <g key={`x${x}`}>
          <line x1={px(x)} x2={px(x)} y1={T} y2={B} className="stroke-line" strokeWidth={1} />
          <text x={px(x)} y={B + 16} textAnchor="middle" className="fill-ink-3 num" fontSize={10}>{x}</text>
        </g>
      ))}
      {yTicks.map((y) => (
        <g key={`y${y}`}>
          <line x1={L} x2={R} y1={py(y)} y2={py(y)} className="stroke-line" strokeWidth={1} />
          <text x={L - 6} y={py(y) + 3} textAnchor="end" className="fill-ink-3 num" fontSize={10}>{y}</text>
        </g>
      ))}
      <line x1={px(0)} x2={px(0)} y1={T} y2={B} className="stroke-ink-3" strokeWidth={1.8} />
      <line x1={L} x2={R} y1={py(0)} y2={py(0)} className="stroke-ink-3" strokeWidth={1.8} />
      <line x1={px(xMin)} y1={py(m * xMin + b)} x2={px(xMax)} y2={py(m * xMax + b)} className="stroke-brand" strokeWidth={3} strokeLinecap="round" />
      <circle cx={px(0)} cy={py(b)} r={5} className="fill-accent stroke-surface" strokeWidth={2} />
    </Frame>
  );
}

const PLACES = ['tenThousands', 'thousands', 'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'] as const;

function PlaceValue({ value }: { value: string }) {
  const { t } = useI18n();
  const [whole = '', frac = ''] = value.split('.');
  const wholeDigits = whole.replace(/\D/g, '').split('');
  const fracDigits = frac.replace(/\D/g, '').split('');
  const cols: { digit: string; place: (typeof PLACES)[number] }[] = [];
  wholeDigits.forEach((d, i) => {
    const idx = 4 - (wholeDigits.length - 1 - i);
    cols.push({ digit: d, place: PLACES[Math.max(0, idx)] });
  });
  fracDigits.forEach((d, i) => cols.push({ digit: d, place: PLACES[Math.min(PLACES.length - 1, 5 + i)] }));
  return (
    <div className="mx-auto flex max-w-lg flex-wrap items-end justify-center gap-1.5" dir="ltr">
      {cols.map((c, i) => (
        <div key={i} className="flex items-end gap-1.5">
          {i === wholeDigits.length && fracDigits.length > 0 && <span className="pb-9 text-2xl font-semibold text-ink-3">.</span>}
          <div className="flex w-[4.2rem] flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-1 py-2">
            <span className="num text-2xl font-semibold text-brand">{c.digit}</span>
            <span className="text-center text-[0.68rem] leading-tight text-ink-3">{t(`vis.pv.${c.place}` as never)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Draws a lesson's `VisualSpec` as a small, theme-aware, always-LTR diagram. */
export function Visual({ spec }: { spec: VisualSpec }) {
  switch (spec.type) {
    case 'fraction-bar':
      return <FractionBar num={spec.num} den={spec.den} />;
    case 'pie':
      return <Pie num={spec.num} den={spec.den} />;
    case 'number-line':
      return <NumberLine spec={spec} />;
    case 'grid':
      return <Grid rows={spec.rows} cols={spec.cols} shaded={spec.shaded} />;
    case 'balance':
      return <Balance left={spec.left} right={spec.right} />;
    case 'shape':
      return <Shape spec={spec} />;
    case 'angle':
      return <Angle degrees={spec.degrees} />;
    case 'bars':
      return <Bars values={spec.values} />;
    case 'line-graph':
      return <LineGraph m={spec.m} b={spec.b} />;
    case 'place-value':
      return <PlaceValue value={spec.value} />;
    default:
      return null;
  }
}
