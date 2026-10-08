import clsx from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { isolateMath, Rich } from '@/components/Math';
import { useI18n } from '@/i18n';
import type { Question, UserAnswer } from '@/types';

interface Props {
  q: Question;
  value: UserAnswer | null;
  onChange: (v: UserAnswer | null) => void;
  onSubmit: () => void;
  disabled?: boolean;
  /** Correct/wrong marking of the chosen option once the question has been judged. */
  revealed?: boolean;
}

/** Renders the right control for each of the ten question types, driven by `q.answer.kind`. */
export function AnswerInput({ q, value, onChange, onSubmit, disabled, revealed }: Props) {
  const { l, t } = useI18n();
  const kind = q.answer.kind;

  if (kind === 'choice' || kind === 'bool') {
    const opts =
      q.options && q.options.length > 0
        ? q.options
        : [
            { id: 'true', label: { en: t('q.true'), ar: t('q.true') } },
            { id: 'false', label: { en: t('q.false'), ar: t('q.false') } },
          ];
    const picked = typeof value === 'boolean' ? String(value) : typeof value === 'string' ? value : null;
    const correctIds = q.answer.kind === 'choice' ? q.answer.correct : [String(q.answer.kind === 'bool' && q.answer.value)];
    return (
      <div className="space-y-2" role="radiogroup">
        {opts.map((o, i) => {
          const state = revealed ? (correctIds.includes(o.id) ? 'correct' : picked === o.id ? 'wrong' : undefined) : undefined;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={picked === o.id}
              className="choice"
              data-selected={picked === o.id}
              data-state={state}
              disabled={disabled}
              onClick={() => onChange(o.id)}
            >
              <span className="kbd">{i + 1}</span>
              <span className="min-w-0 flex-1 text-start">
                <Rich text={l(o.label)} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (kind === 'order') {
    const items = q.items ?? [];
    const order = Array.isArray(value) ? value : items.map((it) => it.id);
    const move = (from: number, to: number) => {
      if (to < 0 || to >= order.length) return;
      const next = order.slice();
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      onChange(next);
    };
    return (
      <ol className="space-y-2">
        {order.map((id, i) => {
          const it = items.find((x) => x.id === id);
          return (
            <li key={id} className="choice !cursor-default">
              <span className="kbd">{i + 1}</span>
              <span className="min-w-0 flex-1 text-start">{it && <Rich text={l(it.label)} />}</span>
              <button type="button" className="icon-btn" disabled={disabled || i === 0} onClick={() => move(i, i - 1)} aria-label={t('q.moveUp')}>
                <ArrowUp size={16} />
              </button>
              <button type="button" className="icon-btn" disabled={disabled || i === order.length - 1} onClick={() => move(i, i + 1)} aria-label={t('q.moveDown')}>
                <ArrowDown size={16} />
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  if (kind === 'match') {
    const left = q.left ?? [];
    const right = q.right ?? [];
    const current = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return (
      <div className="space-y-2">
        {left.map((a) => (
          <div key={a.id} className="flex items-center gap-3">
            <div className="card-flat min-w-0 flex-1 !p-3">
              <Rich text={l(a.label)} />
            </div>
            <select
              className="input !w-auto min-w-[8rem] flex-1"
              disabled={disabled}
              value={current[a.id] ?? ''}
              onChange={(e) => onChange({ ...current, [a.id]: e.target.value })}
            >
              <option value="">{t('q.choose')}</option>
              {right.map((b) => (
                <option key={b.id} value={b.id}>
                  {isolateMath(l(b.label).replace(/\$/g, ''))}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  // number, numbers, expression, text
  return (
    <div className="flex items-center gap-2">
      <input
        className={clsx('input flex-1', q.inputMode !== 'text' && 'ltr num')}
        dir={q.inputMode === 'text' ? 'auto' : 'ltr'}
        inputMode={q.inputMode === 'number' ? 'decimal' : 'text'}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        data-autofocus
      />
      {q.suffix && <span className="muted">{q.suffix}</span>}
    </div>
  );
}
