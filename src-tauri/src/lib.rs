//! Raqam — Tauri backend: SQLite persistence, backups, logging.

mod db;
mod logging;
mod tts;

use rusqlite::Connection;
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Manager, State};

pub struct AppState {
    conn: Mutex<Connection>,
    pub(crate) data_dir: PathBuf,
    db_path: PathBuf,
}

type CmdResult<T> = Result<T, String>;

fn lock<'a>(state: &'a State<'_, AppState>) -> CmdResult<std::sync::MutexGuard<'a, Connection>> {
    state.conn.lock().map_err(|_| "db_locked".to_string())
}

fn fail(context: &str, e: db::DbError) -> String {
    logging::write("error", &format!("{context}: {e}"));
    e.0
}

#[tauri::command]
fn db_query(state: State<'_, AppState>, sql: String, params: Vec<Value>) -> CmdResult<Vec<Value>> {
    let conn = lock(&state)?;
    db::query(&conn, &sql, &params).map_err(|e| fail("db_query", e))
}

#[tauri::command]
fn db_execute(
    state: State<'_, AppState>,
    sql: String,
    params: Vec<Value>,
) -> CmdResult<db::ExecResult> {
    let conn = lock(&state)?;
    db::execute(&conn, &sql, &params).map_err(|e| fail("db_execute", e))
}

#[tauri::command]
fn db_batch(
    state: State<'_, AppState>,
    statements: Vec<db::Statement>,
) -> CmdResult<Vec<db::ExecResult>> {
    let mut conn = lock(&state)?;
    db::batch(&mut conn, &statements).map_err(|e| fail("db_batch", e))
}

#[tauri::command]
fn backup_export(state: State<'_, AppState>, path: String) -> CmdResult<usize> {
    let conn = lock(&state)?;
    let text = db::export_json(&conn).map_err(|e| fail("backup_export", e))?;
    fs::write(&path, &text).map_err(|e| {
        logging::write("error", &format!("backup_export write: {e}"));
        e.to_string()
    })?;
    Ok(text.len())
}

#[tauri::command]
fn backup_import(state: State<'_, AppState>, path: String) -> CmdResult<usize> {
    let text = fs::read_to_string(&path).map_err(|e| {
        logging::write("error", &format!("backup_import read: {e}"));
        "read_failed".to_string()
    })?;
    let mut conn = lock(&state)?;
    // Safety net: snapshot current data before replacing it.
    if let Ok(snapshot) = db::export_json(&conn) {
        let _ = fs::create_dir_all(state.data_dir.join("backups"));
        let _ = fs::write(
            state.data_dir.join("backups").join("before-import.json"),
            snapshot,
        );
    }
    db::import_json(&mut conn, &text).map_err(|e| fail("backup_import", e))
}

#[tauri::command]
fn data_reset_progress(state: State<'_, AppState>) -> CmdResult<()> {
    let mut conn = lock(&state)?;
    db::reset_progress(&mut conn).map_err(|e| fail("reset_progress", e))
}

#[tauri::command]
fn data_reset_all(state: State<'_, AppState>) -> CmdResult<()> {
    let mut conn = lock(&state)?;
    db::reset_all(&mut conn).map_err(|e| fail("reset_all", e))
}

#[tauri::command]
fn log_event(level: String, message: String) {
    logging::write(&level, &message);
}

#[derive(Serialize)]
struct AppInfo {
    version: String,
    data_dir: String,
    db_path: String,
    log_path: String,
    schema: i64,
}

#[tauri::command]
fn app_info(state: State<'_, AppState>) -> CmdResult<AppInfo> {
    let conn = lock(&state)?;
    let schema = db::applied_versions(&conn)
        .map_err(|e| fail("app_info", e))?
        .last()
        .copied()
        .unwrap_or(0);
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        data_dir: state.data_dir.display().to_string(),
        db_path: state.db_path.display().to_string(),
        log_path: logging::path()
            .map(|p| p.display().to_string())
            .unwrap_or_default(),
        schema,
    })
}

/// Copy the database aside before applying a migration to an existing database.
fn snapshot_before_migration(conn: &Connection, db_path: &Path, dir: &Path) {
    let has_data = db::applied_versions(conn)
        .map(|v| !v.is_empty())
        .unwrap_or(false);
    let has_pending = db::pending(conn).map(|p| !p.is_empty()).unwrap_or(false);
    if has_data && has_pending {
        let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
        let _ = fs::create_dir_all(dir);
        let target = dir.join(format!("pre-migration-{}.db", db::now_ms()));
        if let Err(e) = fs::copy(db_path, &target) {
            logging::write("warn", &format!("pre-migration snapshot failed: {e}"));
        }
    }
}

/// Keep one automatic JSON backup per day, the newest seven.
fn rotate_auto_backups(conn: &Connection, dir: &Path) {
    let day = db::now_ms() / 86_400_000;
    let _ = fs::create_dir_all(dir);
    let today = dir.join(format!("auto-{day}.json"));
    if !today.exists() {
        match db::export_json(conn) {
            Ok(text) => {
                let _ = fs::write(&today, text);
            }
            Err(e) => logging::write("warn", &format!("auto backup failed: {e}")),
        }
    }
    if let Ok(entries) = fs::read_dir(dir) {
        let mut autos: Vec<PathBuf> = entries
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| {
                p.file_name()
                    .and_then(|n| n.to_str())
                    .map(|n| n.starts_with("auto-") && n.ends_with(".json"))
                    .unwrap_or(false)
            })
            .collect();
        autos.sort_by_key(|p| {
            p.file_stem()
                .and_then(|s| s.to_str())
                .and_then(|s| s.trim_start_matches("auto-").parse::<i64>().ok())
                .unwrap_or(0)
        });
        while autos.len() > 7 {
            let _ = fs::remove_file(autos.remove(0));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            logging::init(&data_dir.join("logs"));
            logging::install_panic_hook();

            let db_path = data_dir.join("raqam.db");
            let mut conn = db::open(&db_path).map_err(|e| e.0)?;
            let backups = data_dir.join("backups");
            snapshot_before_migration(&conn, &db_path, &backups);
            match db::migrate(&mut conn) {
                Ok(applied) if !applied.is_empty() => {
                    logging::write("info", &format!("applied migrations: {applied:?}"))
                }
                Ok(_) => {}
                Err(e) => {
                    logging::write("fatal", &e.0);
                    return Err(e.0.into());
                }
            }
            rotate_auto_backups(&conn, &backups);
            logging::write("info", "Raqam started");
            app.manage(AppState {
                conn: Mutex::new(conn),
                data_dir,
                db_path,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_query,
            db_execute,
            db_batch,
            backup_export,
            backup_import,
            data_reset_progress,
            data_reset_all,
            log_event,
            app_info,
            tts::tts_audio,
            tts::tts_key_set,
            tts::tts_key_clear,
            tts::tts_key_status,
            tts::tts_cache_info,
            tts::tts_cache_path,
            tts::tts_cache_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running Raqam");
}
