import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { masteryBand, BAND_COLOR } from '@/domain/mastery';
import { useI18n } from '@/i18n';

/** Page title block with an optional subtitle and a right-aligned action area. */
export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: string; actions?: ReactNode; back?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back}
        <h1 className="h-page">{title}</h1>
        {subtitle && <p className="muted mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A friendly empty state: icon, headline, hint and an optional call to action. */
export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon size={26} />
      </span>
      <h2 className="h-section">{title}</h2>
      {body && <p className="muted max-w-md">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Small statistic card: icon, big value, label. */
export function Stat({ icon: Icon, label, value, hint, tone = 'brand' }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string; tone?: 'brand' | 'good' | 'warn' | 'accent' | 'gold' | 'bad' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-soft text-brand',
    good: 'bg-good-soft text-good',
    warn: 'bg-warn-soft text-warn',
    accent: 'bg-accent-soft text-accent',
    gold: 'bg-gold-soft text-gold',
    bad: 'bg-bad-soft text-bad',
  };
  return (
    <div className="card-flat flex items-center gap-3 !p-4">
      <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="num text-xl font-semibold leading-tight">{value}</div>
        <div className="muted truncate text-xs">{label}</div>
        {hint && <div className="muted truncate text-[11px]">{hint}</div>}
      </div>
    </div>
  );
}

/** Mastery value (0-100) as a coloured bar with its band label. */
export function MasteryBar({ value, showLabel = true, className }: { value: number; showLabel?: boolean; className?: string }) {
  const { t, n } = useI18n();
  const band = masteryBand(value);
  const color = BAND_COLOR[band];
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="progress flex-1" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
      </div>
      {showLabel && (
        <span className="muted num w-24 shrink-0 text-end text-xs">
          {n(Math.round(value), 0)} · {t(`band.${band}` as never)}
        </span>
      )}
    </div>
  );
}

/** Plain progress bar for 0..1 ratios. */
export function Bar({ ratio, className }: { ratio: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className={clsx('progress', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Segmented toggle (radio group) used for settings and filters. */
export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            o.value === value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line')}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'start-[1.375rem]' : 'start-0.5',
        )}
      />
    </button>
  );
}

/** Settings-style row: title + description on one side, control on the other. */
export function Row({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1 basis-60">
        <div className="font-medium">{title}</div>
        {hint && <div className="muted text-sm">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
