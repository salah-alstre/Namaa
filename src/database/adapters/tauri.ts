import type { DbClient, ExecResult, Row, SqlParam, Stmt } from '../client';
import { invoke } from '@/lib/tauri';

export function createTauriClient(): DbClient {
  return {
    kind: 'tauri',
    query: <T = Row>(sql: string, params: SqlParam[] = []) => invoke<T[]>('db_query', { sql, params }),
    execute: (sql, params = []) => invoke<ExecResult>('db_execute', { sql, params }),
    batch: (stmts: Stmt[]) => invoke<ExecResult[]>('db_batch', { statements: stmts.map((s) => ({ sql: s.sql, params: s.params ?? [] })) }),
  };
}
