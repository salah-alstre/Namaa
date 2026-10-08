import { Check, Eraser, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadNotes, saveNotes } from '@/database/repos/profile';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { useUi } from '@/stores/ui';

/** A slide-in notes panel. It saves what you type, and never solves anything. */
export function Scratchpad() {
  const { t } = useI18n();
  const open = useUi((s) => s.scratchOpen);
  const setOpen = useUi((s) => s.setScratch);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    loadNotes()
      .then((v) => {
        setText(v);
        setLoaded(true);
      })
      .catch((e) => logEvent('warn', `notes load failed: ${String(e)}`));
  }, [open, loaded]);

  useEffect(() => {
    if (open) window.setTimeout(() => area.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const change = (value: string) => {
    setText(value);
    setSaved(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      saveNotes(value)
        .then(() => setSaved(true))
        .catch((e) => logEvent('warn', `notes save failed: ${String(e)}`));
    }, 500);
  };

  // Flush a pending save when the panel unmounts.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!open) return null;
  return (
    <aside
      className="fixed bottom-0 top-0 z-[60] flex w-[min(92vw,24rem)] flex-col border-s border-line bg-surface shadow-pop anim-fade end-0"
      aria-label={t('scratch.title')}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="h-section !m-0 flex-1">{t('scratch.title')}</h2>
        <span className="muted flex items-center gap-1 text-xs">{saved && <Check size={13} />}{saved ? t('scratch.saved') : '…'}</span>
        <button
          className="icon-btn"
          title={t('scratch.clear')}
          aria-label={t('scratch.clear')}
          onClick={() => {
            change('');
            area.current?.focus();
          }}
        >
          <Eraser size={17} />
        </button>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label={t('common.close')}>
          <X size={18} />
        </button>
      </div>
      <p className="muted px-4 pt-3 text-xs">{t('scratch.hint')}</p>
      <textarea
        ref={area}
        dir="auto"
        value={text}
        onChange={(e) => change(e.target.value)}
        placeholder={t('scratch.placeholder')}
        spellCheck={false}
        className="input m-4 flex-1 resize-none !font-mono !text-base leading-relaxed"
      />
    </aside>
  );
}
