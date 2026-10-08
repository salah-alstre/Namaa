/**
 * Neural cloud provider (Azure Neural Speech / ElevenLabs). All network access, the API key and the audio cache live
 * in the Rust side (`src-tauri/src/tts.rs`); this class only asks for audio bytes and plays them. The key is never
 * available to JavaScript.
 */
import { invoke, isTauri } from '@/lib/tauri';
import { cloudVoices } from './voices';
import { TtsError, type Accent, type ProviderId, type SpeakRequest, type TtsErrorCode, type TtsProvider, type TtsVoice } from './types';

const KNOWN: TtsErrorCode[] = ['no_key', 'invalid_key', 'rate_limit', 'offline', 'provider_error', 'unsupported_voice', 'not_cached', 'keystore'];

function toError(e: unknown): TtsError {
  const raw = typeof e === 'string' ? e : e instanceof Error ? e.message : '';
  const code = KNOWN.find((k) => raw === k);
  return new TtsError(code ?? 'provider_error');
}

let ctx: AudioContext | null = null;
let current: { src: AudioBufferSourceNode; done: () => void } | null = null;

function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new TtsError('playback');
    ctx = new Ctor();
  }
  return ctx;
}

export function stopAudio(): void {
  const c = current;
  current = null;
  if (!c) return;
  try {
    c.src.onended = null;
    c.src.stop();
  } catch {
    /* already stopped */
  }
  c.done();
}

async function playBuffer(data: ArrayBuffer, onStart?: () => void): Promise<void> {
  stopAudio();
  try {
    const c = audioContext();
    if (c.state === 'suspended') await c.resume();
    const buf = await c.decodeAudioData(data.slice(0));
    await new Promise<void>((resolve) => {
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      current = { src, done: resolve };
      src.onended = () => {
        if (current?.src === src) current = null;
        resolve();
      };
      src.start();
      onStart?.();
    });
  } catch (e) {
    throw e instanceof TtsError ? e : new TtsError('playback');
  }
}

/** After a connectivity/provider failure, skip network attempts for a while (cached audio still plays). */
let downUntil = 0;
let downReason: TtsErrorCode = 'offline';

export function resetCloudState(): void {
  downUntil = 0;
}

export class NeuralCloudTtsProvider implements TtsProvider {
  constructor(public readonly id: Exclude<ProviderId, 'system'>) {}

  async isAvailable(): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      return await invoke<boolean>('tts_key_status', { provider: this.id });
    } catch {
      return false;
    }
  }

  getVoices(accent?: Accent): Promise<TtsVoice[]> {
    return Promise.resolve(cloudVoices(this.id, accent));
  }

  async generate(text: string, req: SpeakRequest): Promise<ArrayBuffer> {
    if (!isTauri()) throw new TtsError('unavailable');
    const cachedOnly = !req.force && Date.now() < downUntil;
    try {
      const data = await invoke<ArrayBuffer | number[]>('tts_audio', {
        req: { text, provider: this.id, voice: req.voice, accent: req.accent, speed: req.speed, region: req.region, cachedOnly },
      });
      downUntil = 0;
      return data instanceof ArrayBuffer ? data : new Uint8Array(data).buffer;
    } catch (e) {
      const err = toError(e);
      if (err.code === 'not_cached') throw new TtsError(downReason);
      if (err.code !== 'unsupported_voice') {
        downReason = err.code;
        downUntil = Date.now() + (err.code === 'rate_limit' ? 60_000 : 30_000);
      }
      throw err;
    }
  }

  async speak(text: string, req: SpeakRequest): Promise<void> {
    const data = await this.generate(text, req);
    if (req.isStale?.()) return;
    await playBuffer(data, req.onStart);
  }

  stop(): void {
    stopAudio();
  }
}
