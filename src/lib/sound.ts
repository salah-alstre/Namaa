import { useSettings } from '@/stores/settings';

/** Small synthesized cues (no audio files): quiet, short, and off when the user says so. */
export type Cue = 'correct' | 'wrong' | 'levelup' | 'achievement' | 'click' | 'finish';

type Note = { f: number; at: number; dur: number; type?: OscillatorType; gain?: number };

const CUES: Record<Cue, Note[]> = {
  correct: [
    { f: 659.25, at: 0, dur: 0.11 },
    { f: 880, at: 0.09, dur: 0.18 },
  ],
  wrong: [
    { f: 233.08, at: 0, dur: 0.16, type: 'triangle' },
    { f: 196, at: 0.12, dur: 0.22, type: 'triangle' },
  ],
  levelup: [
    { f: 523.25, at: 0, dur: 0.14 },
    { f: 659.25, at: 0.12, dur: 0.14 },
    { f: 783.99, at: 0.24, dur: 0.14 },
    { f: 1046.5, at: 0.36, dur: 0.34 },
  ],
  achievement: [
    { f: 783.99, at: 0, dur: 0.12 },
    { f: 987.77, at: 0.1, dur: 0.12 },
    { f: 1174.66, at: 0.2, dur: 0.3 },
  ],
  click: [{ f: 520, at: 0, dur: 0.04, gain: 0.5 }],
  finish: [
    { f: 440, at: 0, dur: 0.14 },
    { f: 554.37, at: 0.12, dur: 0.14 },
    { f: 659.25, at: 0.24, dur: 0.3 },
  ],
};

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Plays a cue. `force` ignores the on/off setting (used by the "test sound" button). */
export function playCue(cue: Cue, force = false): void {
  const { soundEnabled, soundVolume } = useSettings.getState().settings;
  if (!force && !soundEnabled) return;
  const ac = context();
  if (!ac) return;
  const master = Math.max(0, Math.min(1, soundVolume)) * 0.22;
  const t0 = ac.currentTime + 0.01;
  for (const n of CUES[cue]) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.value = n.f;
    const peak = master * (n.gain ?? 1);
    const s = t0 + n.at;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), s + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + n.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(s);
    osc.stop(s + n.dur + 0.02);
  }
}
