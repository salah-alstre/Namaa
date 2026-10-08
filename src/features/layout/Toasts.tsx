import { X } from 'lucide-react';
import { NamedIcon } from '@/components/Icon';
import { useI18n } from '@/i18n';
import { useToasts, type ToastKind } from '@/stores/toast';

const TONE: Record<ToastKind, string> = {
  info: 'text-brand bg-brand-soft',
  achievement: 'text-gold bg-gold-soft',
  levelup: 'text-accent bg-accent-soft',
  success: 'text-good bg-good-soft',
  error: 'text-bad bg-bad-soft',
};

const DEFAULT_ICON: Record<ToastKind, string> = {
  info: 'Sparkles',
  achievement: 'Trophy',
  levelup: 'ArrowUpCircle',
  success: 'CheckCheck',
  error: 'X',
};

export function Toasts() {
  const { t } = useI18n();
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      className="pointer-events-none fixed bottom-4 end-4 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((x) => (
        <div key={x.id} className="card anim-pop pointer-events-auto flex items-start gap-3 !p-3 shadow-pop">
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${TONE[x.kind]}`}>
            <NamedIcon name={x.icon ?? DEFAULT_ICON[x.kind]} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{x.title}</p>
            {x.body && <p className="muted text-xs">{x.body}</p>}
          </div>
          <button className="icon-btn !size-7" onClick={() => dismiss(x.id)} aria-label={t('common.close')}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
