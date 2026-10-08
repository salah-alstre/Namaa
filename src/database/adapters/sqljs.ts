import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { DbClient, ExecResult, Row, SqlParam, Stmt } from '../client';
import { MIGRATION_FILES } from '../migrations';

export interface SqlJsClient extends DbClient {
  /** Serialised database file, for persistence tests and the browser preview. */
  exportBytes(): Uint8Array;
  close(): void;
}

async function loadSql() {
  // Under vitest (node) sql.js finds its own wasm file; in a browser we point it at the bundled asset.
  return import.meta.env.MODE === 'test' ? initSqlJs() : initSqlJs({ locateFile: () => wasmUrl });
}

function run(db: Database, sql: string, params: SqlParam[]): { rows: Row[]; result: ExecResult } {
  const stmt = db.prepare(sql);
  const rows: Row[] = [];
  try {
    stmt.bind(params.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p)));
    while (stmt.step()) rows.push(stmt.getAsObject() as Row);
  } finally {
    stmt.free();
  }
  const changes = db.getRowsModified();
  const idRow = db.exec('SELECT last_insert_rowid()');
  const last = (idRow[0]?.values[0]?.[0] as number | undefined) ?? 0;
  return { rows, result: { changes, last_insert_id: last } };
}

function migrate(db: Database): void {
  db.run('PRAGMA foreign_keys = ON');
  db.run('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  const applied = new Set<number>();
  const res = db.exec('SELECT version FROM schema_migrations');
  for (const v of res[0]?.values ?? []) applied.add(Number(v[0]));
  for (const m of MIGRATION_FILES) {
    if (applied.has(m.version)) continue;
    db.run('BEGIN');
    try {
      db.exec(m.sql);
      db.run('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [m.version, m.name, Date.now()]);
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  }
}

export async function createSqlJsClient(bytes?: Uint8Array): Promise<SqlJsClient> {
  const SQL = await loadSql();
  const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  migrate(db);
  return {
    kind: 'sqljs',
    async query<T = Row>(sql: string, params: SqlParam[] = []) {
      return run(db, sql, params).rows as T[];
    },
    async execute(sql, params = []) {
      return run(db, sql, params).result;
    },
    async batch(stmts: Stmt[]) {
      db.run('BEGIN');
      try {
        const out = stmts.map((s) => run(db, s.sql, s.params ?? []).result);
        db.run('COMMIT');
        return out;
      } catch (e) {
        db.run('ROLLBACK');
        throw e;
      }
    },
    exportBytes: () => db.export(),
    close: () => db.close(),
  };
}
