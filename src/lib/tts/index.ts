/**
 * The single pronunciation service. Every English "listen" button, auto-play and Listening exercise goes through
 * `speak()`; nothing outside this folder knows which provider is active. Order: chosen neural cloud provider (or its
 * on-disk cache) → system speech synthesis → a gentle "not available" result. It never throws.
 */
import { create } from 'zustand';
import { isTauri } from '@/lib/tauri';
import { useSettings } from '@/stores/settings';
import { NeuralCloudTtsProvider, resetCloudState } from './cloud';
import { normalizeForSpeech, normalizeRate } from './normalize';
import { SystemSpeechProvider, ttsAvailable } from './system';
import { resolveCloudVoice } from './voices';
import { TtsError, type ProviderId, type SpeakOptions, type SpeakOutcome, type SpeakRequest, type TtsErrorCode, type TtsProvider } from './types';

export { isEnglishVoice, loadVoices, pickVoice, ttsAvailable } from './system';
export { normalizeForSpeech, normalizeRate } from './normalize';
export { accentLabel, cloudVoices, resolveCloudVoice, voiceLabel } from './voices';
export { resetCloudState } from './cloud';
export { SPEEDS, TtsError } from './types';
export type { Accent, ProviderId, SpeakOptions, SpeakOutcome, TtsErrorCode, TtsVoice } from './types';

const system = new SystemSpeechProvider();
const cloud: Record<'azure' | 'elevenlabs', NeuralCloudTtsProvider> = {
  azure: new NeuralCloudTtsProvider('azure'),
  elevenlabs: new NeuralCloudTtsProvider('elevenlabs'),
};

/** Registry: add a future local neural provider (e.g. Kokoro) here. */
export const providerFor = (id: ProviderId): TtsProvider => (id === 'system' ? system : cloud[id]);

/** Why the last playback used the device voice instead of the chosen neural one (null = all fine). */
export const useTtsNotice = create<{ reason: TtsErrorCode | null }>(() => ({ reason: null }));

/** Friendly, non-technical wording for each fallback reason. */
export function noticeText(reason: TtsErrorCode, ar: boolean): string {
  const t: Record<string, [string, string]> = {
    no_key: ['Add a voice key in Settings to use the natural voice. Using your device voice.', 'أضف مفتاح الصوت في الإعدادات لاستخدام الصوت الطبيعي. نستخدم صوت الجهاز.'],
    invalid_key: ['The voice key was not accepted. Using your device voice.', 'لم يتم قبول مفتاح الصوت. نستخدم صوت الجهاز.'],
    rate_limit: ['The voice service is busy. Using your device voice for now.', 'خدمة الصوت مشغولة. نستخدم صوت الجهاز الآن.'],
    offline: ['No internet. Using your device voice.', 'لا يوجد إنترنت. نستخدم صوت الجهاز.'],
    provider_error: ['The voice service is unavailable. Using your device voice.', 'خدمة الصوت غير متاحة. نستخدم صوت الجهاز.'],
    unsupported_voice: ['That voice is not available. Using your device voice.', 'هذا الصوت غير متاح. نستخدم صوت الجهاز.'],
  };
  const pair = t[reason] ?? t.provider_error!;
  return ar ? pair[1] : pair[0];
}

let token = 0;

function config() {
  const s = useSettings.getState().settings;
  return {
    provider: (isTauri() ? s.ttsProvider : 'system') as ProviderId,
    region: s.ttsRegion || 'eastus',
    accent: s.enAccent === 'gb' ? ('gb' as const) : ('us' as const),
    voice: s.ttsVoice,
    systemVoice: s.enVoice,
    rate: normalizeRate(s.enRate),
  };
}

/** The user's default speed, and the slower one used by the turtle / Slow buttons. */
export function speeds(): { normal: number; slow: number } {
  const { rate } = config();
  return { normal: rate, slow: rate > 0.75 ? 0.75 : 0.65 };
}

/** True when some way of speaking exists (device voice, or a configured cloud provider). */
export const speechPossible = (): boolean => ttsAvailable() || config().provider !== 'system';

export function stopSpeaking(): void {
  token++;
  system.stop();
  cloud.azure.stop();
  cloud.elevenlabs.stop();
}

function setNotice(reason: TtsErrorCode | null): void {
  if (useTtsNotice.getState().reason !== reason) useTtsNotice.setState({ reason });
}

/**
 * Speak English text. Resolves when playback has finished (or been stopped). `ok:false` only when nothing at all
 * could speak.
 */
export async function speak(text: string, opts: SpeakOptions & { force?: boolean } = {}): Promise<SpeakOutcome> {
  stopSpeaking();
  const mine = token;
  const clean = normalizeForSpeech(text);
  if (!clean) return { ok: false, via: 'none' };
  const c = config();
  const speed = normalizeRate(opts.speed ?? c.rate);
  const base: Omit<SpeakRequest, 'voice'> = { accent: c.accent, speed, region: c.region, force: opts.force, onStart: opts.onStart, isStale: () => mine !== token };

  let fallback: TtsErrorCode | undefined;
  if (c.provider !== 'system') {
    const voice = resolveCloudVoice(c.provider, c.accent, c.voice);
    if (!voice) {
      fallback = 'unsupported_voice';
    } else {
      try {
        await providerFor(c.provider).speak(clean, { ...base, voice: voice.id });
        if (mine === token) setNotice(null);
        return { ok: true, via: 'cloud' };
      } catch (e) {
        if (mine !== token) return { ok: true, via: 'cloud' };
        fallback = e instanceof TtsError ? e.code : 'provider_error';
        // A playback problem is not the cloud's fault; still fall back so the learner hears something.
      }
    }
  }

  try {
    await system.speak(clean, { ...base, voice: c.systemVoice });
    if (mine === token) setNotice(fallback ?? null);
    return { ok: true, via: 'system', fallback };
  } catch {
    if (mine === token) setNotice(fallback ?? null);
    return { ok: false, via: 'none', fallback };
  }
}

/** Test one provider/voice with the current settings (used by Settings → Test voice); reports cloud errors. */
export async function testCloud(text: string): Promise<{ ok: boolean; reason?: TtsErrorCode }> {
  stopSpeaking();
  const c = config();
  if (c.provider === 'system') {
    const r = await speak(text);
    return { ok: r.ok };
  }
  resetCloudState();
  const voice = resolveCloudVoice(c.provider, c.accent, c.voice);
  if (!voice) return { ok: false, reason: 'unsupported_voice' };
  try {
    await providerFor(c.provider).speak(normalizeForSpeech(text), { accent: c.accent, speed: c.rate, region: c.region, voice: voice.id, force: true });
    setNotice(null);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof TtsError ? e.code : 'provider_error' };
  }
}
