//! Tiny file logger. Errors are written locally only — nothing leaves the machine.

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

static LOG_PATH: OnceLock<PathBuf> = OnceLock::new();
const MAX_BYTES: u64 = 1_000_000;

pub fn init(dir: &Path) {
    let _ = fs::create_dir_all(dir);
    let _ = LOG_PATH.set(dir.join("raqam.log"));
}

pub fn path() -> Option<&'static PathBuf> {
    LOG_PATH.get()
}

pub fn write(level: &str, message: &str) {
    let Some(p) = LOG_PATH.get() else { return };
    if let Ok(meta) = fs::metadata(p) {
        if meta.len() > MAX_BYTES {
            let _ = fs::rename(p, p.with_extension("log.old"));
        }
    }
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(p) {
        let clean: String = message.chars().take(4000).collect();
        let _ = writeln!(
            f,
            "{} [{}] {}",
            crate::db::now_ms(),
            level,
            clean.replace('\n', " | ")
        );
    }
}

pub fn install_panic_hook() {
    std::panic::set_hook(Box::new(|info| {
        write("panic", &info.to_string());
    }));
}
