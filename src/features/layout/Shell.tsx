import { Minimize2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CommandPalette } from '@/features/search/CommandPalette';
import { Scratchpad } from '@/features/scratchpad/Scratchpad';
import { WeeklySummary } from '@/features/weekly/WeeklySummary';
import { Pages } from '@/features/layout/Pages';
import { Sidebar } from '@/features/layout/Sidebar';
import { Toasts } from '@/features/layout/Toasts';
import { Topbar } from '@/features/layout/Topbar';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useI18n } from '@/i18n';
import { useRouter } from '@/stores/router';
import { useUi } from '@/stores/ui';

/** Sidebar, top bar and the scrolling page area, plus the app-wide overlays. */
export function Shell() {
  const { t } = useI18n();
  const nonce = useRouter((s) => s.nonce);
  const focus = useUi((s) => s.focus);
  const setFocus = useUi((s) => s.setFocus);
  const main = useRef<HTMLElement>(null);
  useShortcuts();

  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [nonce]);

  return (
    <div className="flex h-full bg-bg text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main ref={main} id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          {focus && (
            <button className="btn btn-soft btn-sm fixed end-4 top-4 z-40" onClick={() => setFocus(false)} title={t('top.focusExit')}>
              <Minimize2 size={15} />
              {t('top.focusExit')}
            </button>
          )}
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
            <Pages key={nonce} />
          </div>
        </main>
      </div>
      <CommandPalette />
      <Scratchpad />
      <WeeklySummary />
      <Toasts />
    </div>
  );
}
