//! SQLite access layer: connection setup, versioned migrations, generic
//! query/execute helpers (JSON in / JSON out) and backup export / import.

use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{params_from_iter, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::path::Path;

pub struct Migration {
    pub version: i64,
    pub name: &'static str,
    pub sql: &'static str,
}

/// Ordered list of migrations. Append only — never edit a released migration.
pub const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "init",
        sql: include_str!("../migrations/0001_init.sql"),
    },
    Migration {
        version: 2,
        name: "exam_times",
        sql: include_str!("../migrations/0002_exam_times.sql"),
    },
    Migration {
        version: 3,
        name: "english",
        sql: include_str!("../migrations/0003_english.sql"),
    },
];

pub const BACKUP_FORMAT: &str = "raqam-backup";
pub const BACKUP_VERSION: i64 = 1;

#[derive(Debug)]
pub struct DbError(pub String);

impl std::fmt::Display for DbError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<rusqlite::Error> for DbError {
    fn from(e: rusqlite::Error) -> Self {
        DbError(e.to_string())
    }
}
impl From<std::io::Error> for DbError {
    fn from(e: std::io::Error) -> Self {
        DbError(e.to_string())
    }
}
impl From<serde_json::Error> for DbError {
    fn from(e: serde_json::Error) -> Self {
        DbError(e.to_string())
    }
}

pub type DbResult<T> = Result<T, DbError>;

#[derive(Debug, Deserialize)]
pub struct Statement {
    pub sql: String,
    #[serde(default)]
    pub params: Vec<Value>,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct ExecResult {
    pub changes: usize,
    pub last_insert_id: i64,
}

pub fn open(path: &Path) -> DbResult<Connection> {
    let conn = Connection::open(path)?;
    configure(&conn)?;
    Ok(conn)
}

#[cfg(test)]
pub fn open_memory() -> DbResult<Connection> {
    let conn = Connection::open_in_memory()?;
    configure(&conn)?;
    Ok(conn)
}

fn configure(conn: &Connection) -> DbResult<()> {
    conn.execute_batch(
        "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;",
    )?;
    Ok(())
}

pub fn applied_versions(conn: &Connection) -> DbResult<Vec<i64>> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
           version    INTEGER PRIMARY KEY,
           name       TEXT NOT NULL,
           applied_at INTEGER NOT NULL
         );",
    )?;
    let mut stmt = conn.prepare("SELECT version FROM schema_migrations ORDER BY version")?;
    let rows = stmt.query_map([], |r| r.get::<_, i64>(0))?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r?);
    }
    Ok(out)
}

/// Versions that still need to be applied.
pub fn pending(conn: &Connection) -> DbResult<Vec<&'static Migration>> {
    let applied = applied_versions(conn)?;
    Ok(MIGRATIONS
        .iter()
        .filter(|m| !applied.contains(&m.version))
        .collect())
}

/// Apply every pending migration, each inside its own transaction.
/// Returns the list of versions that were applied.
pub fn migrate(conn: &mut Connection) -> DbResult<Vec<i64>> {
    let todo = pending(conn)?;
    let mut done = Vec::new();
    for m in todo {
        let tx = conn.transaction()?;
        tx.execute_batch(m.sql)
            .map_err(|e| DbError(format!("migration {} ({}) failed: {}", m.version, m.name, e)))?;
        tx.execute(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![m.version, m.name, now_ms()],
        )?;
        tx.commit()?;
        done.push(m.version);
    }
    Ok(done)
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn json_to_sql(v: &Value) -> SqlValue {
    match v {
        Value::Null => SqlValue::Null,
        Value::Bool(b) => SqlValue::Integer(i64::from(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                SqlValue::Integer(i)
            } else {
                SqlValue::Real(n.as_f64().unwrap_or(0.0))
            }
        }
        Value::String(s) => SqlValue::Text(s.clone()),
        other => SqlValue::Text(other.to_string()),
    }
}

fn sql_to_json(v: ValueRef<'_>) -> Value {
    match v {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(i) => json!(i),
        ValueRef::Real(f) => json!(f),
        ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
        ValueRef::Blob(b) => Value::String(format!("<blob {} bytes>", b.len())),
    }
}

pub fn query(conn: &Connection, sql: &str, params: &[Value]) -> DbResult<Vec<Value>> {
    let mut stmt = conn.prepare(sql)?;
    let names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    let mut rows = stmt.query(params_from_iter(params.iter().map(json_to_sql)))?;
    let mut out = Vec::new();
    while let Some(row) = rows.next()? {
        let mut obj = Map::new();
        for (i, name) in names.iter().enumerate() {
            obj.insert(name.clone(), sql_to_json(row.get_ref(i)?));
        }
        out.push(Value::Object(obj));
    }
    Ok(out)
}

pub fn execute(conn: &Connection, sql: &str, params: &[Value]) -> DbResult<ExecResult> {
    let changes = conn.execute(sql, params_from_iter(params.iter().map(json_to_sql)))?;
    Ok(ExecResult {
        changes,
        last_insert_id: conn.last_insert_rowid(),
    })
}

/// Run many statements atomically. Rolls back everything if one fails.
pub fn batch(conn: &mut Connection, stmts: &[Statement]) -> DbResult<Vec<ExecResult>> {
    let tx = conn.transaction()?;
    let mut out = Vec::with_capacity(stmts.len());
    for s in stmts {
        out.push(execute(&tx, &s.sql, &s.params)?);
    }
    tx.commit()?;
    Ok(out)
}

fn user_tables(conn: &Connection) -> DbResult<Vec<String>> {
    let rows = query(
        conn,
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' \
         AND name <> 'schema_migrations' ORDER BY name",
        &[],
    )?;
    Ok(rows
        .iter()
        .filter_map(|r| r.get("name").and_then(|v| v.as_str()).map(String::from))
        .collect())
}

fn quote_ident(name: &str) -> String {
    format!("\"{}\"", name.replace('"', "\"\""))
}

fn table_columns(conn: &Connection, table: &str) -> DbResult<Vec<String>> {
    let rows = query(conn, &format!("PRAGMA table_info({})", quote_ident(table)), &[])?;
    Ok(rows
        .iter()
        .filter_map(|r| r.get("name").and_then(|v| v.as_str()).map(String::from))
        .collect())
}

/// Serialise every user table into a single JSON document.
pub fn export_json(conn: &Connection) -> DbResult<String> {
    let mut tables = Map::new();
    for t in user_tables(conn)? {
        let rows = query(conn, &format!("SELECT * FROM {}", quote_ident(&t)), &[])?;
        tables.insert(t, Value::Array(rows));
    }
    let versions = applied_versions(conn)?;
    let doc = json!({
        "format": BACKUP_FORMAT,
        "version": BACKUP_VERSION,
        "schema": versions.last().copied().unwrap_or(0),
        "exported_at": now_ms(),
        "tables": Value::Object(tables),
    });
    Ok(serde_json::to_string(&doc)?)
}

/// Replace all user data with the contents of a backup. Validates the whole
/// document first and runs in a single transaction, so a bad file changes nothing.
pub fn import_json(conn: &mut Connection, text: &str) -> DbResult<usize> {
    let doc: Value = serde_json::from_str(text).map_err(|_| DbError("not_a_backup".into()))?;
    if doc.get("format").and_then(|v| v.as_str()) != Some(BACKUP_FORMAT) {
        return Err(DbError("not_a_backup".into()));
    }
    let schema = doc.get("schema").and_then(|v| v.as_i64()).unwrap_or(0);
    let current = MIGRATIONS.last().map(|m| m.version).unwrap_or(0);
    if schema > current {
        return Err(DbError("backup_too_new".into()));
    }
    let tables = doc
        .get("tables")
        .and_then(|v| v.as_object())
        .ok_or_else(|| DbError("not_a_backup".into()))?;

    let known = user_tables(conn)?;
    let tx = conn.transaction()?;
    // Defer FK checks while tables are emptied and refilled in arbitrary order.
    tx.execute_batch("PRAGMA defer_foreign_keys = ON;")?;
    let mut inserted = 0usize;
    for t in &known {
        tx.execute(&format!("DELETE FROM {}", quote_ident(t)), [])?;
    }
    for (table, rows) in tables {
        if !known.contains(table) {
            continue; // table from a newer/older schema that no longer exists
        }
        let cols = table_columns(&tx, table)?;
        let rows = rows.as_array().ok_or_else(|| DbError("not_a_backup".into()))?;
        for row in rows {
            let obj = row.as_object().ok_or_else(|| DbError("not_a_backup".into()))?;
            let used: Vec<&String> = cols.iter().filter(|c| obj.contains_key(*c)).collect();
            if used.is_empty() {
                continue;
            }
            let sql = format!(
                "INSERT OR REPLACE INTO {} ({}) VALUES ({})",
                quote_ident(table),
                used.iter().map(|c| quote_ident(c)).collect::<Vec<_>>().join(","),
                (1..=used.len()).map(|i| format!("?{i}")).collect::<Vec<_>>().join(",")
            );
            let vals: Vec<SqlValue> = used.iter().map(|c| json_to_sql(&obj[*c])).collect();
            tx.execute(&sql, params_from_iter(vals))?;
            inserted += 1;
        }
    }
    tx.commit()?;
    Ok(inserted)
}

/// Wipe progress and settings but keep the schema. Re-creates the singleton rows.
pub fn reset_all(conn: &mut Connection) -> DbResult<()> {
    let tables = user_tables(conn)?;
    let tx = conn.transaction()?;
    tx.execute_batch("PRAGMA defer_foreign_keys = ON;")?;
    for t in &tables {
        tx.execute(&format!("DELETE FROM {}", quote_ident(t)), [])?;
        // keep AUTOINCREMENT counters tidy
        let _ = tx.execute("DELETE FROM sqlite_sequence WHERE name = ?1", [t]);
    }
    let now = now_ms();
    tx.execute("INSERT INTO profile (id, created_at) VALUES (1, ?1)", [now])?;
    tx.execute("INSERT INTO notes (id, updated_at) VALUES (1, ?1)", [now])?;
    tx.commit()?;
    Ok(())
}

/// Reset only learning progress (keeps profile, settings, favourites of formulas).
pub fn reset_progress(conn: &mut Connection) -> DbResult<()> {
    let tx = conn.transaction()?;
    tx.execute_batch("PRAGMA defer_foreign_keys = ON;")?;
    for t in [
        "topic_progress",
        "lesson_progress",
        "attempts",
        "sessions",
        "mistakes",
        "exams",
        "xp_events",
        "activity_days",
        "achievements",
        "daily_challenges",
        "english_lesson_progress",
        "english_vocab",
        "english_attempts",
        "english_skill_progress",
        "english_mistakes",
        "english_placement",
        "english_writing",
        "english_speaking",
        "english_bookmarks",
    ] {
        tx.execute(&format!("DELETE FROM {t}"), [])?;
        let _ = tx.execute("DELETE FROM sqlite_sequence WHERE name = ?1", [t]);
    }
    tx.execute("UPDATE profile SET placement_done = 0 WHERE id = 1", [])?;
    tx.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> Connection {
        let mut c = open_memory().unwrap();
        migrate(&mut c).unwrap();
        c
    }

    #[test]
    fn migrations_are_ordered_and_unique() {
        let mut last = 0;
        for m in MIGRATIONS {
            assert!(m.version > last, "versions must strictly increase");
            last = m.version;
        }
    }

    #[test]
    fn migrate_applies_once_and_is_idempotent() {
        let mut c = open_memory().unwrap();
        let first = migrate(&mut c).unwrap();
        assert_eq!(first, vec![1, 2, 3]);
        let second = migrate(&mut c).unwrap();
        assert!(second.is_empty());
        assert_eq!(applied_versions(&c).unwrap(), vec![1, 2, 3]);
    }

    #[test]
    fn english_migration_upgrades_a_math_only_database_without_losing_data() {
        let mut c = open_memory().unwrap();
        // Simulate an installed, math-only app: only migrations 1 and 2 applied, with real progress.
        c.execute_batch("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);")
            .unwrap();
        for m in MIGRATIONS.iter().filter(|m| m.version <= 2) {
            c.execute_batch(m.sql).unwrap();
            c.execute(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, 0)",
                rusqlite::params![m.version, m.name],
            )
            .unwrap();
        }
        c.execute("INSERT INTO settings (key, value) VALUES ('dailyGoal', '40')", []).unwrap();
        c.execute("INSERT INTO activity_days (day, xp, questions, correct, lessons, minutes) VALUES ('2026-01-01', 50, 10, 8, 1, 5)", [])
            .unwrap();
        let applied = migrate(&mut c).unwrap();
        assert_eq!(applied, vec![3]);
        let kept = query(&c, "SELECT xp FROM activity_days WHERE day='2026-01-01'", &[]).unwrap();
        assert_eq!(kept[0]["xp"], json!(50));
        let s = query(&c, "SELECT value FROM settings WHERE key='dailyGoal'", &[]).unwrap();
        assert_eq!(s[0]["value"], json!("40"));
        let t = query(&c, "SELECT count(*) AS n FROM english_vocab", &[]).unwrap();
        assert_eq!(t[0]["n"], json!(0));
    }

    #[test]
    fn init_creates_singletons() {
        let c = fresh();
        let p = query(&c, "SELECT * FROM profile", &[]).unwrap();
        assert_eq!(p.len(), 1);
        assert_eq!(p[0]["onboarded"], json!(0));
    }

    #[test]
    fn query_and_execute_round_trip_with_params() {
        let c = fresh();
        let r = execute(
            &c,
            "INSERT INTO settings (key, value) VALUES (?1, ?2)",
            &[json!("lang"), json!("ar")],
        )
        .unwrap();
        assert_eq!(r.changes, 1);
        let rows = query(&c, "SELECT value FROM settings WHERE key = ?1", &[json!("lang")]).unwrap();
        assert_eq!(rows[0]["value"], json!("ar"));
    }

    #[test]
    fn unicode_and_arabic_text_survive() {
        let c = fresh();
        let txt = "ما هو ناتج ٣ + ٤؟ — ½";
        execute(&c, "INSERT INTO settings VALUES ('t', ?1)", &[json!(txt)]).unwrap();
        let rows = query(&c, "SELECT value FROM settings WHERE key='t'", &[]).unwrap();
        assert_eq!(rows[0]["value"], json!(txt));
    }

    #[test]
    fn batch_is_atomic() {
        let mut c = fresh();
        let stmts = vec![
            Statement { sql: "INSERT INTO settings VALUES ('a','1')".into(), params: vec![] },
            Statement { sql: "INSERT INTO nope VALUES (1)".into(), params: vec![] },
        ];
        assert!(batch(&mut c, &stmts).is_err());
        let rows = query(&c, "SELECT * FROM settings", &[]).unwrap();
        assert!(rows.is_empty(), "failed batch must roll back");
    }

    #[test]
    fn export_import_round_trip() {
        let mut c = fresh();
        execute(&c, "INSERT INTO settings VALUES ('theme','dark')", &[]).unwrap();
        execute(&c, "INSERT INTO achievements VALUES ('first_steps', 123)", &[]).unwrap();
        execute(&c, "UPDATE profile SET name = 'ليلى' WHERE id = 1", &[]).unwrap();
        let dump = export_json(&c).unwrap();

        let mut other = fresh();
        execute(&other, "INSERT INTO settings VALUES ('junk','x')", &[]).unwrap();
        let n = import_json(&mut other, &dump).unwrap();
        assert!(n >= 3);
        let s = query(&other, "SELECT key FROM settings ORDER BY key", &[]).unwrap();
        assert_eq!(s.len(), 1);
        assert_eq!(s[0]["key"], json!("theme"));
        let p = query(&other, "SELECT name FROM profile", &[]).unwrap();
        assert_eq!(p[0]["name"], json!("ليلى"));
        assert_eq!(query(&other, "SELECT * FROM achievements", &[]).unwrap().len(), 1);
        let _ = &mut c;
    }

    #[test]
    fn import_rejects_garbage_and_changes_nothing() {
        let mut c = fresh();
        execute(&c, "INSERT INTO settings VALUES ('keep','me')", &[]).unwrap();
        assert!(import_json(&mut c, "not json").is_err());
        assert!(import_json(&mut c, "{\"format\":\"other\"}").is_err());
        let too_new = json!({"format": BACKUP_FORMAT, "version": 1, "schema": 999, "tables": {}}).to_string();
        assert_eq!(import_json(&mut c, &too_new).unwrap_err().0, "backup_too_new");
        assert_eq!(query(&c, "SELECT * FROM settings", &[]).unwrap().len(), 1);
    }

    #[test]
    fn import_ignores_unknown_tables_and_columns() {
        let mut c = fresh();
        let doc = json!({
            "format": BACKUP_FORMAT, "version": 1, "schema": 1,
            "tables": {
                "settings": [{"key": "k", "value": "v", "extra": 1}],
                "ghost": [{"a": 1}]
            }
        })
        .to_string();
        import_json(&mut c, &doc).unwrap();
        assert_eq!(query(&c, "SELECT * FROM settings", &[]).unwrap().len(), 1);
    }

    #[test]
    fn reset_progress_keeps_profile_and_settings() {
        let mut c = fresh();
        execute(&c, "INSERT INTO settings VALUES ('theme','dark')", &[]).unwrap();
        execute(&c, "UPDATE profile SET name='Sam', onboarded=1 WHERE id=1", &[]).unwrap();
        execute(&c, "INSERT INTO achievements VALUES ('x', 1)", &[]).unwrap();
        execute(&c, "INSERT INTO xp_events (amount, reason, created_at) VALUES (10,'t',1)", &[]).unwrap();
        reset_progress(&mut c).unwrap();
        assert!(query(&c, "SELECT * FROM achievements", &[]).unwrap().is_empty());
        assert!(query(&c, "SELECT * FROM xp_events", &[]).unwrap().is_empty());
        assert_eq!(query(&c, "SELECT * FROM settings", &[]).unwrap().len(), 1);
        assert_eq!(query(&c, "SELECT name FROM profile", &[]).unwrap()[0]["name"], json!("Sam"));
    }

    #[test]
    fn reset_all_restores_defaults() {
        let mut c = fresh();
        execute(&c, "INSERT INTO settings VALUES ('theme','dark')", &[]).unwrap();
        execute(&c, "UPDATE profile SET name='Sam', onboarded=1 WHERE id=1", &[]).unwrap();
        reset_all(&mut c).unwrap();
        assert!(query(&c, "SELECT * FROM settings", &[]).unwrap().is_empty());
        let p = query(&c, "SELECT name, onboarded FROM profile", &[]).unwrap();
        assert_eq!(p.len(), 1);
        assert_eq!(p[0]["onboarded"], json!(0));
        assert_eq!(p[0]["name"], json!(""));
    }

    #[test]
    fn data_survives_reopen_on_disk() {
        let dir = std::env::temp_dir().join(format!("raqam-test-{}", now_ms()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("t.db");
        {
            let mut c = open(&path).unwrap();
            migrate(&mut c).unwrap();
            execute(&c, "INSERT INTO settings VALUES ('persist','yes')", &[]).unwrap();
        }
        let mut c = open(&path).unwrap();
        assert!(migrate(&mut c).unwrap().is_empty());
        let r = query(&c, "SELECT value FROM settings WHERE key='persist'", &[]).unwrap();
        assert_eq!(r[0]["value"], json!("yes"));
        drop(c);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
