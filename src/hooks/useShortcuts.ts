import { useEffect } from 'react';
import { useUi } from '@/stores/ui';

/** App-wide shortcuts: Ctrl+K opens the palette. Esc is handled by whichever dialog or panel is open. */
export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const ui = useUi.getState();
        ui.setPalette(!ui.paletteOpen);
        return;
      }
      if (e.key === 'Escape') {
        const ui = useUi.getState();
        if (ui.focus && !ui.paletteOpen && !ui.scratchOpen && !document.querySelector('[role="dialog"]')) ui.setFocus(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
