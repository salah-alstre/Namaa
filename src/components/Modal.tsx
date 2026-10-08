import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { useI18n } from '@/i18n';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Align near the top (command palette) instead of the centre. */
  top?: boolean;
  hideClose?: boolean;
}

/** A dialog with a backdrop, Esc to close and focus restored afterwards. */
export function Modal({ open, onClose, title, children, footer, wide, top, hideClose }: ModalProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const first = ref.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, button');
    first?.focus();
    return () => {
      window.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={clsx('fixed inset-0 z-[70] flex justify-center bg-black/45 p-4 backdrop-blur-[2px] anim-fade', top ? 'items-start pt-[12vh]' : 'items-center')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx('card anim-pop flex max-h-[88vh] w-full flex-col !p-0 shadow-pop', wide ? 'max-w-2xl' : 'max-w-md')}
      >
        {(title || !hideClose) && (
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <h2 className="h-section flex-1 !m-0">{title}</h2>
            {!hideClose && (
              <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
