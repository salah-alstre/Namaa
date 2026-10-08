import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('@/lib/tauri', () => ({ isTauri: () => true, invoke: (...a: unknown[]) => invoke(...a) }));

import { useSettings } from '@/stores/settings';
import { cloudVoices, normalizeForSpeech, normalizeRate, resetCloudState, resolveCloudVoice, speak, voiceLabel } from '@/lib/tts';

describe('normalizeForSpeech', () => {
  it('keeps punctuation and removes markup, Arabic and blanks', () => {
    expect(normalizeForSpeech('Hello, how are you?')).toBe('Hello, how are you?');
    expect(normalizeForSpeech('**I am** a <b>developer</b>.')).toBe('I am a developer .');
    expect(normalizeForSpeech('أنا I don\'t understand.')).toBe("I don't understand.");
    expect(normalizeForSpeech('We ___ not eat.')).toBe('We blank not eat.');
    expect(normalizeForSpeech('[link](http://x.y) text')).toBe('link text');
  });
});

describe('speeds and voices', () => {
  it('snaps to the offered speeds', () => {
    expect(normalizeRate(0.6)).toBe(0.65);
    expect(normalizeRate(0.72)).toBe(0.75);
    expect(normalizeRate(1.08)).toBe(1.1);
    expect(normalizeRate(0)).toBe(1);
  });
  it('lists voices per accent with LTR labels', () => {
    for (const p of ['azure', 'elevenlabs'] as const) {
      expect(cloudVoices(p, 'us').every((v) => v.accent === 'us')).toBe(true);
      expect(cloudVoices(p, 'gb').length).toBeGreaterThan(0);
    }
    expect(voiceLabel({ name: 'Jessica', accent: 'us' })).toBe('Jessica — American English');
    expect(resolveCloudVoice('azure', 'gb', 'nope')?.accent).toBe('gb');
  });
});

describe('speak fallback', () => {
  beforeEach(() => {
    resetCloudState();
    invoke.mockReset();
    useSettings.setState({ settings: { ...useSettings.getState().settings, ttsProvider: 'azure', enAccent: 'us' } });
    const spoken: string[] = [];
    (globalThis as unknown as { __spoken: string[] }).__spoken = spoken;
    class Utt { constructor(public text: string) {} onend: (() => void) | null = null; onerror: (() => void) | null = null; onstart: (() => void) | null = null; rate = 1; lang = ''; voice = null; }
    vi.stubGlobal('SpeechSynthesisUtterance', Utt);
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [{ voiceURI: 'en-us-test', name: 'Test US', lang: 'en-US', localService: true }],
      cancel: () => undefined,
      speak: (u: Utt) => { spoken.push(u.text); queueMicrotask(() => u.onend?.()); },
    });
    Object.defineProperty(window, 'speechSynthesis', { value: globalThis.speechSynthesis, configurable: true });
  });

  it('uses the device voice when the cloud is offline, without throwing', async () => {
    invoke.mockRejectedValue('offline');
    const r = await speak('Hello, how are you?');
    expect(r.ok).toBe(true);
    expect(r.via).toBe('system');
    expect(r.fallback).toBe('offline');
    expect((globalThis as unknown as { __spoken: string[] }).__spoken).toEqual(['Hello, how are you?']);
  });

  it('never sends Arabic text to the provider', async () => {
    invoke.mockRejectedValue('no_key');
    await speak('مرحبا Hello');
    const req = invoke.mock.calls[0]?.[1] as { req: { text: string } };
    expect(req.req.text).toBe('Hello');
  });
});
