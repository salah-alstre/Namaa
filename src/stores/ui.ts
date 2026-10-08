import { create } from 'zustand';

interface UiState {
  paletteOpen: boolean;
  scratchOpen: boolean;
  focus: boolean;
  sidebarCollapsed: boolean;
  weeklyOpen: boolean;
  setPalette: (open: boolean) => void;
  setScratch: (open: boolean) => void;
  setFocus: (on: boolean) => void;
  toggleSidebar: () => void;
  setWeekly: (open: boolean) => void;
}

const SIDEBAR_KEY = 'raqam.sidebar';

function initialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}

export const useUi = create<UiState>((set, get) => ({
  paletteOpen: false,
  scratchOpen: false,
  focus: false,
  sidebarCollapsed: initialCollapsed(),
  weeklyOpen: false,
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setScratch: (scratchOpen) => set({ scratchOpen }),
  setFocus: (focus) => {
    document.documentElement.dataset.focus = focus ? 'true' : 'false';
    set({ focus });
  },
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
    } catch {
      /* private mode: just keep it in memory */
    }
    set({ sidebarCollapsed: next });
  },
  setWeekly: (weeklyOpen) => set({ weeklyOpen }),
}));
