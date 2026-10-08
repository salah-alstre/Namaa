export type Accent = 'us' | 'gb';
export type ProviderId = 'system' | 'azure' | 'elevenlabs';

export type TtsErrorCode =
  | 'no_key'
  | 'invalid_key'
  | 'rate_limit'
  | 'offline'
  | 'provider_error'
  | 'unsupported_voice'
  | 'unavailable'
  | 'playback'
  | 'not_cached'
  | 'keystore';

export class TtsError extends Error {
  constructor(public readonly code: TtsErrorCode) {
    super(code);
  }
}

export interface TtsVoice {
  id: string;
  /** Short name, e.g. "Jessica". */
  name: string;
  accent: Accent;
  provider: ProviderId;
}

/** Fully resolved request handed to a provider. */
export interface SpeakRequest {
  accent: Accent;
  /** Cloud voice id, or the system voiceURI ('' = automatic). */
  voice: string;
  /** 0.65 very slow · 0.75 slow · 1 normal · 1.1 fast. */
  speed: number;
  region: string;
  /** Skip the "cloud is down" shortcut (used by Test voice). */
  force?: boolean;
  onStart?: () => void;
  /** True when a newer request replaced this one while audio was being fetched. */
  isStale?: () => boolean;
}

/**
 * Every pronunciation backend implements this. A future fully local neural engine (e.g. Kokoro) is just another
 * implementation registered in `index.ts`; no lesson component knows which provider is active.
 */
export interface TtsProvider {
  readonly id: ProviderId;
  isAvailable(): Promise<boolean>;
  getVoices(accent?: Accent): Promise<TtsVoice[]>;
  /** Audio bytes for the text (cloud providers). Providers that cannot produce audio throw `unavailable`. */
  generate(text: string, req: SpeakRequest): Promise<ArrayBuffer>;
  /** Play the text; resolves when playback ends (or is stopped). Throws `TtsError` on failure. */
  speak(text: string, req: SpeakRequest): Promise<void>;
  stop(): void;
}

export interface SpeakOptions {
  /** Explicit speed; defaults to the user's chosen default speed. */
  speed?: number;
  /** Fires when audio actually starts. */
  onStart?: () => void;
}

export interface SpeakOutcome {
  ok: boolean;
  via: 'cloud' | 'system' | 'none';
  /** Why the cloud was skipped, when the system voice was used instead. */
  fallback?: TtsErrorCode;
}

export const SPEEDS = [0.65, 0.75, 1, 1.1] as const;
