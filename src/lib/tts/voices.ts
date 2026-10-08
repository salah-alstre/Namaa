import type { Accent, ProviderId, TtsVoice } from './types';

/** Curated calm, clear voices per cloud provider (ids are public identifiers, not secrets). */
const AZURE: TtsVoice[] = [
  { id: 'en-US-JennyNeural', name: 'Jenny', accent: 'us', provider: 'azure' },
  { id: 'en-US-AriaNeural', name: 'Aria', accent: 'us', provider: 'azure' },
  { id: 'en-US-GuyNeural', name: 'Guy', accent: 'us', provider: 'azure' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', accent: 'gb', provider: 'azure' },
  { id: 'en-GB-LibbyNeural', name: 'Libby', accent: 'gb', provider: 'azure' },
  { id: 'en-GB-RyanNeural', name: 'Ryan', accent: 'gb', provider: 'azure' },
];

const ELEVENLABS: TtsVoice[] = [
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', accent: 'us', provider: 'elevenlabs' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', accent: 'us', provider: 'elevenlabs' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', accent: 'gb', provider: 'elevenlabs' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', accent: 'gb', provider: 'elevenlabs' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', accent: 'gb', provider: 'elevenlabs' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', accent: 'gb', provider: 'elevenlabs' },
];

export function cloudVoices(provider: ProviderId, accent?: Accent): TtsVoice[] {
  const all = provider === 'azure' ? AZURE : provider === 'elevenlabs' ? ELEVENLABS : [];
  return accent ? all.filter((v) => v.accent === accent) : all;
}

/** The chosen voice if it fits the accent, otherwise the first voice for that accent. */
export function resolveCloudVoice(provider: ProviderId, accent: Accent, wanted: string): TtsVoice | null {
  const list = cloudVoices(provider, accent);
  return list.find((v) => v.id === wanted) ?? list[0] ?? null;
}

export const accentLabel = (a: Accent): string => (a === 'gb' ? 'British English' : 'American English');

/** "Jessica — American English" (always shown left-to-right). */
export const voiceLabel = (v: Pick<TtsVoice, 'name' | 'accent'>): string => `${v.name} — ${accentLabel(v.accent)}`;
