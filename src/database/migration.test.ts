import initSqlJs from 'sql.js';
import { describe, expect, it } from 'vitest';
import { createSqlJsClient } from './adapters/sqljs';
import { MIGRATION_FILES } from './migrations';

/** Builds a database exactly as the math-only app left it (migrations 0001 and 0002 only), with real user data. */
async function mathOnlyBytes(): Promise<Uint8Array> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  for (const m of MIGRATION_FILES.filter((x) => x.version < 3)) {
    db.exec(m.sql);
    db.run('INSERT INTO schema_migrations VALUES (?, ?, ?)', [m.version, m.name, 1]);
  }
  db.run("INSERT INTO lesson_progress (lesson_id, status, step, stars, started_at, last_opened) VALUES ('alg-1', 'completed', 4, 3, 1, 1)");
  db.run("INSERT INTO xp_events (amount, reason, created_at) VALUES (40, 'lesson', 1)");
  db.run("INSERT INTO achievements (id, unlocked_at) VALUES ('first-lesson', 1)");
  db.run("INSERT INTO settings (key, value) VALUES ('dailyGoal', '35')");
  db.run("UPDATE profile SET name = 'Sara' WHERE id = 1");
  const bytes = db.export();
  db.close();
  return bytes;
}

describe('migration from a math-only database', () => {
  it('adds the English tables and keeps every math row', async () => {
    const client = await createSqlJsClient(await mathOnlyBytes());
    try {
      const tables = (await client.query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name);
      for (const t of ['english_lesson_progress', 'english_vocab', 'english_attempts', 'english_skill_progress']) expect(tables).toContain(t);

      expect((await client.query("SELECT * FROM lesson_progress WHERE lesson_id = 'alg-1'"))).toHaveLength(1);
      expect((await client.query<{ amount: number }>('SELECT amount FROM xp_events'))[0]?.amount).toBe(40);
      expect(await client.query("SELECT id FROM achievements WHERE id = 'first-lesson'")).toHaveLength(1);
      expect((await client.query<{ value: string }>("SELECT value FROM settings WHERE key = 'dailyGoal'"))[0]?.value).toBe('35');
      expect((await client.query<{ name: string }>('SELECT name FROM profile WHERE id = 1'))[0]?.name).toBe('Sara');
      const versions = (await client.query<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version')).map((r) => r.version);
      expect(versions).toEqual(MIGRATION_FILES.map((m) => m.version));
    } finally {
      client.close();
    }
  });

  it('is idempotent: reopening an up-to-date database changes nothing', async () => {
    const first = await createSqlJsClient(await mathOnlyBytes());
    const bytes = first.exportBytes();
    first.close();
    const second = await createSqlJsClient(bytes);
    try {
      expect(await second.query('SELECT version FROM schema_migrations')).toHaveLength(MIGRATION_FILES.length);
      expect(await second.query('SELECT * FROM lesson_progress')).toHaveLength(1);
    } finally {
      second.close();
    }
  });
});
