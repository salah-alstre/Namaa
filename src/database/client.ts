export type SqlParam = string | number | boolean | null;
export type Row = Record<string, unknown>;

export interface ExecResult {
  changes: number;
  last_insert_id: number;
}

export interface Stmt {
  sql: string;
  params?: SqlParam[];
}

/** The only door to storage. Two adapters implement it: Tauri (SQLite file) and sql.js (tests / browser preview). */
export interface DbClient {
  readonly kind: 'tauri' | 'sqljs';
  query<T = Row>(sql: string, params?: SqlParam[]): Promise<T[]>;
  execute(sql: string, params?: SqlParam[]): Promise<ExecResult>;
  /** Runs all statements in one transaction: all succeed or none do. */
  batch(stmts: Stmt[]): Promise<ExecResult[]>;
}
