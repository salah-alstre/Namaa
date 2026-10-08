import { create } from 'zustand';
import type { Route } from '@/types';
import { useSettings } from './settings';

interface RouterState {
  route: Route;
  history: Route[];
  /** Bumps on every navigation so pages can reset scroll. */
  nonce: number;
  go: (route: Route) => void;
  replace: (route: Route) => void;
  back: (fallback?: Route) => void;
}

const same = (a: Route, b: Route): boolean => JSON.stringify(a) === JSON.stringify(b);

export const useRouter = create<RouterState>((set, get) => ({
  route: { name: 'home' },
  history: [],
  nonce: 0,
  go: (route) => {
    const cur = get().route;
    if (same(cur, route)) return;
    set((s) => ({ route, history: [...s.history, cur].slice(-40), nonce: s.nonce + 1 }));
  },
  replace: (route) => set((s) => ({ route, nonce: s.nonce + 1 })),
  back: (fallback) => {
    const { history } = get();
    const prev = history[history.length - 1];
    if (prev) set((s) => ({ route: prev, history: s.history.slice(0, -1), nonce: s.nonce + 1 }));
    else if (fallback) set((s) => ({ route: fallback, nonce: s.nonce + 1 }));
  },
}));

/** Jump to the page chosen in Settings → General → Startup page. */
export function goToStartPage(): void {
  const page = useSettings.getState().settings.startPage;
  useRouter.getState().replace({ name: page } as Route);
}

/** The subject a route belongs to (null = global pages). */
export function subjectOf(route: Route): 'math' | 'english' | null {
  if (route.name.startsWith('en-')) return 'english';
  switch (route.name) {
    case 'math': case 'learn': case 'lesson': case 'practice': case 'practice-run': case 'challenges':
    case 'exams': case 'exam-run': case 'exam-result': case 'mistakes': case 'formulas': case 'placement':
      return 'math';
    default:
      return null;
  }
}

/** Which sidebar item should be highlighted for a route. */
export function navKeyFor(route: Route): string {
  switch (route.name) {
    case 'lesson':
      return 'learn';
    case 'practice-run':
      return 'practice';
    case 'exam-run':
    case 'exam-result':
      return 'exams';
    case 'placement':
      return 'learn';
    case 'en-lesson':
      return 'en-learn';
    case 'en-quick':
      return 'en-home';
    case 'en-placement':
      return 'en-progress';
    default:
      return route.name;
  }
}
