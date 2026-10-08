/** Thin wrapper so the rest of the app never touches Tauri directly (and works in a plain browser for dev/tests). */

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: raw } = await import('@tauri-apps/api/core');
  return raw<T>(cmd, args);
}
