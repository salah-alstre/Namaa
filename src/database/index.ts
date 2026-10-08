import type { DbClient } from './client';
import { isTauri } from '@/lib/tauri';

export type { DbClient, ExecResult, Row, SqlParam, Stmt } from './client';

let current: DbClient | null = null;

/** The open database. Throws if called before `openDb()` (a programming error, not a user error). */
export function db(): DbClient {
  if (!current) throw new Error('database not opened');
  return current;
}

export function setDb(client: DbClient | null): void {
  current = client;
}

/**
 * Opens the app database. Inside the packaged app this is SQLite on disk (Rust side, with migrations).
 * In a plain browser (design preview) it falls back to an in-memory sql.js database.
 */
export async function openDb(): Promise<DbClient> {
  if (current) return current;
  if (isTauri()) {
    const { createTauriClient } = await import('./adapters/tauri');
    current = createTauriClient();
  } else {
    const { createSqlJsClient } = await import('./adapters/sqljs');
    current = await createSqlJsClient();
  }
  return current;
}

export const bool = (v: unknown): boolean => v === 1 || v === true || v === '1';
export const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
export const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
export const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

export function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== 'string' || v === '') return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
