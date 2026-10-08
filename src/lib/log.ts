import { invoke, isTauri } from './tauri';

export type LogLevel = 'info' | 'warn' | 'error';

/** Internal log (file in the app data folder when packaged, console otherwise). Never throws, never shown to the user. */
export function logEvent(level: LogLevel, message: string): void {
  if (!isTauri()) {
    if (level !== 'info') console[level === 'error' ? 'error' : 'warn'](`[raqam] ${message}`);
    return;
  }
  invoke('log_event', { level, message }).catch(() => undefined);
}

/** Catch anything that escapes React and the promise chain, and write it to the log. */
export function installGlobalErrorLogging(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => logEvent('error', `window.error: ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => logEvent('error', `unhandledrejection: ${String(e.reason)}`));
}
