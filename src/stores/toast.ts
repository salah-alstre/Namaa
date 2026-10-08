import { create } from 'zustand';

export type ToastKind = 'info' | 'achievement' | 'levelup' | 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  icon?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>, ms?: number) => void;
  dismiss: (id: number) => void;
}

let seq = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t, ms = 4800) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-4) }));
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (t: Omit<Toast, 'id'>, ms?: number): void => useToasts.getState().push(t, ms);
