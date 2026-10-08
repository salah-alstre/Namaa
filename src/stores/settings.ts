import { create } from 'zustand';
import { loadSettings, saveSetting } from '@/database/repos/settings';
import { DEFAULT_SETTINGS, type Settings } from '@/types';
import { dirOf } from '@/i18n/core';
import { logEvent } from '@/lib/log';

interface SettingsState {
  settings: Settings;
  ready: boolean;
  load: () => Promise<void>;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  /** Replace everything (after an import or reset). */
  reload: () => Promise<void>;
}

const media = (q: string): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

/** Write the visual settings onto <html>, where the CSS picks them up. */
export function applyToDocument(s: Settings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = s.theme === 'dark' || (s.theme === 'system' && media('(prefers-color-scheme: dark)'));
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.density = s.density;
  root.dataset.textSize = s.textSize;
  root.dataset.motion = s.reducedMotion === 'on' || (s.reducedMotion === 'system' && media('(prefers-reduced-motion: reduce)')) ? 'reduced' : 'full';
  root.lang = s.language;
  root.dir = dirOf(s.language);
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  ready: false,
  load: async () => {
    const settings = await loadSettings();
    applyToDocument(settings);
    set({ settings, ready: true });
  },
  reload: async () => {
    const settings = await loadSettings();
    applyToDocument(settings);
    set({ settings });
  },
  set: async (key, value) => {
    const settings = { ...get().settings, [key]: value };
    applyToDocument(settings);
    set({ settings });
    try {
      await saveSetting(key, value);
    } catch (e) {
      logEvent('error', `saveSetting ${String(key)} failed: ${String(e)}`);
    }
  },
}));

/** Follow the operating system's light/dark and motion preferences while the matching setting is "system". */
export function watchSystemPreferences(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const queries = [window.matchMedia('(prefers-color-scheme: dark)'), window.matchMedia('(prefers-reduced-motion: reduce)')];
  const onChange = () => applyToDocument(useSettings.getState().settings);
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => queries.forEach((q) => q.removeEventListener('change', onChange));
}
