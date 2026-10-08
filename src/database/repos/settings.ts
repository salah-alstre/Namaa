import { db } from '../index';
import { DEFAULT_SETTINGS, type Settings } from '@/types';

/** Settings are stored as key → JSON value, so new settings never need a migration. */

export async function loadSettings(): Promise<Settings> {
  const rows = await db().query<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (!(r.key in DEFAULT_SETTINGS)) continue;
    try {
      const v: unknown = JSON.parse(r.value);
      // Keep only values with the same type as the default (guards against hand-edited or old data).
      if (typeof v === typeof (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[r.key]) out[r.key] = v;
    } catch {
      /* ignore a corrupt value; the default stays */
    }
  }
  return out as unknown as Settings;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db().execute(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)],
  );
}
