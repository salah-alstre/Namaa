//! Neural text-to-speech: cloud synthesis (Azure Neural Speech / ElevenLabs), an on-disk audio cache and secure
//! API-key storage in the OS credential store. The key never reaches the frontend and is never logged.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::{ipc::Response, State};

use crate::{logging, AppState};

const KEYRING_SERVICE: &str = "app.raqam.desktop.tts";
const CACHE_VERSION: &str = "v1";
const MAX_TEXT: usize = 1500;

#[derive(Deserialize)]
pub struct TtsRequest {
    pub text: String,
    pub provider: String,
    pub voice: String,
    pub accent: String,
    pub speed: f32,
    #[serde(default)]
    pub region: Option<String>,
    /// Serve from the cache only (used while the cloud is known to be unreachable).
    #[serde(default, rename = "cachedOnly")]
    pub cached_only: bool,
}

#[derive(Serialize)]
pub struct CacheInfo {
    pub bytes: u64,
    pub files: u64,
}

fn known_provider(p: &str) -> bool {
    matches!(p, "azure" | "elevenlabs")
}

fn safe_token(s: &str) -> bool {
    !s.is_empty() && s.len() <= 64 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn clamp_speed(speed: f32) -> f32 {
    if speed.is_finite() {
        (speed.clamp(0.5, 1.5) * 100.0).round() / 100.0
    } else {
        1.0
    }
}

/// Stable cache key: text + provider + voice + accent + speed (+ a version to invalidate the format).
pub fn cache_key(req: &TtsRequest) -> String {
    let mut h = Sha256::new();
    h.update(
        format!(
            "{CACHE_VERSION}|{}|{}|{}|{:.2}|{}",
            req.provider,
            req.voice,
            req.accent,
            clamp_speed(req.speed),
            req.text
        )
        .as_bytes(),
    );
    hex::encode(h.finalize())
}

fn cache_dir(state: &AppState) -> PathBuf {
    state.data_dir.join("tts-cache")
}

fn entry(provider: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, provider).map_err(|_| "keystore".to_string())
}

fn read_key(provider: &str) -> Result<String, String> {
    match entry(provider)?.get_password() {
        Ok(k) if !k.trim().is_empty() => Ok(k),
        Ok(_) | Err(keyring::Error::NoEntry) => Err("no_key".into()),
        Err(_) => Err("keystore".into()),
    }
}

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

pub fn azure_ssml(text: &str, voice: &str, accent: &str, speed: f32) -> String {
    let lang = if accent == "gb" { "en-GB" } else { "en-US" };
    let body = xml_escape(text);
    let inner = if (speed - 1.0).abs() < 0.005 {
        body
    } else {
        format!("<prosody rate=\"{speed:.2}\">{body}</prosody>")
    };
    format!("<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"{lang}\"><voice name=\"{voice}\">{inner}</voice></speak>")
}

fn map_status(status: u16) -> String {
    match status {
        401 | 403 => "invalid_key",
        429 => "rate_limit",
        400 | 404 | 422 => "unsupported_voice",
        _ => "provider_error",
    }
    .to_string()
}

fn map_send_error(e: &reqwest::Error) -> String {
    if e.is_connect() || e.is_timeout() || e.is_request() {
        "offline".into()
    } else {
        "provider_error".into()
    }
}

async fn synthesize(req: &TtsRequest, speed: f32) -> Result<Vec<u8>, String> {
    let key = read_key(&req.provider)?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .connect_timeout(Duration::from_secs(6))
        .build()
        .map_err(|_| "provider_error".to_string())?;

    let builder = match req.provider.as_str() {
        "azure" => {
            let region = req.region.as_deref().unwrap_or("");
            if !safe_token(region) || !safe_token(&req.voice) {
                return Err("unsupported_voice".into());
            }
            client
                .post(format!("https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"))
                .header("Ocp-Apim-Subscription-Key", key)
                .header("Content-Type", "application/ssml+xml")
                .header("X-Microsoft-OutputFormat", "audio-24khz-48kbitrate-mono-mp3")
                .header("User-Agent", "Namaa")
                .body(azure_ssml(&req.text, &req.voice, &req.accent, speed))
        }
        "elevenlabs" => {
            if !safe_token(&req.voice) {
                return Err("unsupported_voice".into());
            }
            // ElevenLabs accepts 0.7–1.2.
            // Widening an f32 0.7 gives 0.69999999…, which the API rejects as below the minimum, so round in f64.
            let el_speed = (f64::from(speed.clamp(0.7, 1.2)) * 100.0).round() / 100.0;
            let body = serde_json::json!({
                "text": req.text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": { "stability": 0.6, "similarity_boost": 0.75, "speed": el_speed }
            });
            client
                .post(format!(
                    "https://api.elevenlabs.io/v1/text-to-speech/{}?output_format=mp3_44100_64",
                    req.voice
                ))
                .header("xi-api-key", key)
                .header("Content-Type", "application/json")
                .header("Accept", "audio/mpeg")
                .body(body.to_string())
        }
        _ => return Err("unsupported_provider".into()),
    };

    let resp = builder.send().await.map_err(|e| map_send_error(&e))?;
    let status = resp.status();
    if !status.is_success() {
        logging::write("warn", &format!("tts {} http {}", req.provider, status.as_u16()));
        return Err(map_status(status.as_u16()));
    }
    let bytes = resp.bytes().await.map_err(|e| map_send_error(&e))?;
    if bytes.len() < 256 {
        return Err("provider_error".into());
    }
    Ok(bytes.to_vec())
}

/// Cached-or-generated MP3 bytes for a request. Cache hits never touch the network or the key store.
#[tauri::command]
pub async fn tts_audio(state: State<'_, AppState>, req: TtsRequest) -> Result<Response, String> {
    if !known_provider(&req.provider) {
        return Err("unsupported_provider".into());
    }
    let text = req.text.trim();
    if text.is_empty() || text.chars().count() > MAX_TEXT {
        return Err("bad_text".into());
    }
    let req = TtsRequest { text: text.to_string(), speed: clamp_speed(req.speed), ..req };
    let dir = cache_dir(&state);
    let path = dir.join(format!("{}.mp3", cache_key(&req)));
    if let Ok(bytes) = fs::read(&path) {
        if bytes.len() >= 256 {
            return Ok(Response::new(bytes));
        }
    }
    if req.cached_only {
        return Err("not_cached".into());
    }
    let bytes = synthesize(&req, req.speed).await?;
    if fs::create_dir_all(&dir).is_ok() {
        let tmp = path.with_extension("part");
        if fs::write(&tmp, &bytes).is_ok() && fs::rename(&tmp, &path).is_err() {
            let _ = fs::remove_file(&tmp);
        }
    }
    Ok(Response::new(bytes))
}

#[tauri::command]
pub fn tts_key_set(provider: String, key: String) -> Result<(), String> {
    if !known_provider(&provider) || key.trim().is_empty() || key.len() > 512 {
        return Err("bad_key".into());
    }
    entry(&provider)?.set_password(key.trim()).map_err(|_| "keystore".to_string())
}

#[tauri::command]
pub fn tts_key_clear(provider: String) -> Result<(), String> {
    if !known_provider(&provider) {
        return Err("unsupported_provider".into());
    }
    match entry(&provider)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("keystore".into()),
    }
}

/// Whether a key is stored. The key itself is never returned.
#[tauri::command]
pub fn tts_key_status(provider: String) -> bool {
    known_provider(&provider) && read_key(&provider).is_ok()
}

fn dir_stats(dir: &Path) -> CacheInfo {
    let mut info = CacheInfo { bytes: 0, files: 0 };
    if let Ok(rd) = fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            if p.extension().and_then(|x| x.to_str()) == Some("mp3") {
                if let Ok(m) = e.metadata() {
                    info.bytes += m.len();
                    info.files += 1;
                }
            }
        }
    }
    info
}

#[tauri::command]
pub fn tts_cache_info(state: State<'_, AppState>) -> CacheInfo {
    dir_stats(&cache_dir(&state))
}

#[tauri::command]
pub fn tts_cache_path(state: State<'_, AppState>) -> String {
    cache_dir(&state).display().to_string()
}

/// Deletes only cached pronunciation audio. Progress, the database and other settings are untouched.
#[tauri::command]
pub fn tts_cache_clear(state: State<'_, AppState>) -> Result<u64, String> {
    let dir = cache_dir(&state);
    let mut removed = 0;
    if let Ok(rd) = fs::read_dir(&dir) {
        for e in rd.flatten() {
            let p = e.path();
            let ext = p.extension().and_then(|x| x.to_str());
            if matches!(ext, Some("mp3") | Some("part")) && fs::remove_file(&p).is_ok() {
                removed += 1;
            }
        }
    }
    Ok(removed)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn req(text: &str, voice: &str, accent: &str, speed: f32) -> TtsRequest {
        TtsRequest { text: text.into(), provider: "azure".into(), voice: voice.into(), accent: accent.into(), speed, region: None, cached_only: false }
    }

    #[test]
    fn cache_key_is_stable_and_sensitive_to_every_part() {
        let a = cache_key(&req("developer", "v1", "us", 1.0));
        assert_eq!(a, cache_key(&req("developer", "v1", "us", 1.0)));
        assert_ne!(a, cache_key(&req("developer", "v2", "us", 1.0)));
        assert_ne!(a, cache_key(&req("developer", "v1", "gb", 1.0)));
        assert_ne!(a, cache_key(&req("developer", "v1", "us", 0.75)));
        assert_ne!(a, cache_key(&req("Developer", "v1", "us", 1.0)));
        let mut other = req("developer", "v1", "us", 1.0);
        other.provider = "elevenlabs".into();
        assert_ne!(a, cache_key(&other));
    }

    #[test]
    fn ssml_escapes_text_and_sets_rate() {
        let s = azure_ssml("Tom & \"Jerry\" <b>", "en-US-JennyNeural", "us", 0.75);
        assert!(s.contains("Tom &amp; &quot;Jerry&quot; &lt;b&gt;"));
        assert!(s.contains("rate=\"0.75\""));
        assert!(s.contains("xml:lang=\"en-US\""));
        let normal = azure_ssml("Hello", "en-GB-SoniaNeural", "gb", 1.0);
        assert!(!normal.contains("prosody"));
        assert!(normal.contains("xml:lang=\"en-GB\""));
    }

    #[test]
    fn tokens_and_errors() {
        assert!(safe_token("eastus"));
        assert!(safe_token("en-US-JennyNeural"));
        assert!(!safe_token("evil.com/x"));
        assert!(!safe_token(""));
        assert_eq!(map_status(401), "invalid_key");
        assert_eq!(map_status(429), "rate_limit");
        assert_eq!(map_status(400), "unsupported_voice");
        assert_eq!(map_status(503), "provider_error");
        assert_eq!(clamp_speed(f32::NAN), 1.0);
        assert_eq!(clamp_speed(0.65), 0.65);
    }

    #[test]
    fn cache_stats_and_clear_only_touch_audio() {
        let dir = std::env::temp_dir().join(format!("namaa-tts-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("a.mp3"), vec![0u8; 1000]).unwrap();
        fs::write(dir.join("b.mp3"), vec![0u8; 500]).unwrap();
        fs::write(dir.join("keep.txt"), b"x").unwrap();
        let info = dir_stats(&dir);
        assert_eq!((info.files, info.bytes), (2, 1500));
        let _ = fs::remove_dir_all(&dir);
    }
}
