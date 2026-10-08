import { useEffect, useRef } from 'react';

export type HotkeyMap = Partial<Record<string, () => void>>;

/** True when the keystroke belongs to something the user is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return !['checkbox', 'radio', 'button', 'submit', 'range'].includes(type);
  }
  return false;
}

/**
 * Single-key shortcuts for a screen: 'Enter', '1'..'9', 'n', 'h', 'Escape'.
 * They never fire while typing in a field, with Ctrl/Alt/Meta held, or while a dialog is open.
 * Handlers are read through a ref so a screen can pass fresh closures every render.
 */
export function useHotkeys(map: HotkeyMap, enabled = true): void {
  const ref = useRef(map);
  ref.current = map;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      // Enter on a focused button should press that button, not the screen shortcut.
      if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const fn = ref.current[key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
