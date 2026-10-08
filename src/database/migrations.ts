/**
 * The SQL files in src-tauri/migrations are the single source of truth. Rust embeds them with
 * include_str!, and the sql.js adapter (tests and browser preview) loads the very same files.
 */
const files = import.meta.glob('../../src-tauri/migrations/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface MigrationFile {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATION_FILES: MigrationFile[] = Object.entries(files)
  .map(([path, sql]) => {
    const m = /(\d+)_([^/\\]+)\.sql$/.exec(path);
    return { version: m ? Number(m[1]) : 0, name: m?.[2] ?? 'unknown', sql };
  })
  .filter((m) => m.version > 0)
  .sort((a, b) => a.version - b.version);
