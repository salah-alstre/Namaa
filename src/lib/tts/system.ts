/**
 * Fallback provider: the system / WebView `speechSynthesis`. Fully offline (uses installed OS voices) and never
 * throws anything but `TtsError('unavailable')` when no engine or English voice exists.
 */
import { normalizeRate } from './normalize';
import { TtsError, type Accent, type SpeakRequest, type TtsProvider, type TtsVoice } from './types';

type Voice = Pick<SpeechSynthesisVoice, 'voiceURI' | 'name' | 'lang' | 'localService'>;

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' ? window.speechSynthesis : null;

export const ttsAvailable = (): boolean => synth() !== null;

export const isEnglishVoice = (v: Voice): boolean => /^en([-_]|$)/i.test(v.lang);

/** Prefer the chosen voice, then a local voice of the wanted accent, then any English voice. */
export function pickVoice<T extends Voice>(voices: T[], uri: string, accent: Accent = 'us'): T | null {
  const en = voices.filter(isEnglishVoice);
  if (!en.length) return null;
  const chosen = uri ? voices.find((v) => v.voiceURI === uri) : undefined;
  if (chosen && isEnglishVoice(chosen)) return chosen;
  const want = accent === 'gb' ? /^en[-_]GB/i : /^en[-_]US/i;
  const other = accent === 'gb' ? /^en[-_]US/i : /^en[-_]GB/i;
  const score = (v: T) => (v.localService ? 2 : 0) + (want.test(v.lang) ? 3 : other.test(v.lang) ? 1 : 0) + (/natural|online/i.test(v.name) ? 1 : 0);
  return [...en].sort((a, b) => score(b) - score(a))[0] ?? null;
}

let cached: SpeechSynthesisVoice[] = [];

/** Voices load asynchronously in WebView2; resolve with whatever is available after a short wait. */
export function loadVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) {
    cached = now;
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    const done = () => {
      s.removeEventListener?.('voiceschanged', done);
      cached = s.getVoices();
      resolve(cached);
    };
    s.addEventListener?.('voiceschanged', done);
    setTimeout(done, timeoutMs);
  });
}

export class SystemSpeechProvider implements TtsProvider {
  readonly id = 'system' as const;
  private finish: (() => void) | null = null;

  isAvailable(): Promise<boolean> {
    return Promise.resolve(ttsAvailable());
  }

  async getVoices(accent?: Accent): Promise<TtsVoice[]> {
    const voices = await loadVoices();
    return voices
      .filter(isEnglishVoice)
      .map((v): TtsVoice => ({ id: v.voiceURI, name: v.name, accent: /^en[-_]GB/i.test(v.lang) ? 'gb' : 'us', provider: 'system' }))
      .filter((v) => !accent || v.accent === accent);
  }

  generate(): Promise<ArrayBuffer> {
    return Promise.reject(new TtsError('unavailable'));
  }

  speak(text: string, req: SpeakRequest): Promise<void> {
    const s = synth();
    if (!s || !text) return Promise.reject(new TtsError('unavailable'));
    return new Promise((resolve, reject) => {
      try {
        this.stop();
        const u = new SpeechSynthesisUtterance(text);
        const all = cached.length ? cached : s.getVoices();
        const v = pickVoice(all, req.voice, req.accent);
        // An engine with no English voice may never fire onend/onerror, which would leave the UI stuck on "playing".
        if (!v && !all.some(isEnglishVoice)) {
          reject(new TtsError('unavailable'));
          return;
        }
        if (v) {
          u.voice = v;
          u.lang = v.lang;
        } else {
          u.lang = req.accent === 'gb' ? 'en-GB' : 'en-US';
        }
        u.rate = normalizeRate(req.speed);
        let started = false;
        const watchdog = setTimeout(() => {
          if (started) return;
          try {
            s.cancel();
          } catch {
            /* nothing to cancel */
          }
          done();
        }, 5000);
        const done = () => {
          clearTimeout(watchdog);
          if (this.finish === done) this.finish = null;
          resolve();
        };
        this.finish = done;
        u.onstart = () => {
          started = true;
          req.onStart?.();
        };
        u.onend = done;
        u.onerror = done;
        s.speak(u);
      } catch {
        reject(new TtsError('unavailable'));
      }
    });
  }

  stop(): void {
    try {
      synth()?.cancel();
    } catch {
      /* nothing to stop */
    }
    const f = this.finish;
    this.finish = null;
    f?.();
  }
}
