import clsx from 'clsx';
import { RotateCcw, Turtle, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { noticeText, speak, speechPossible, speeds, useTtsNotice } from '@/lib/tts';

type Mode = 'normal' | 'slow';

/**
 * Pronunciation buttons: Listen, Listen slowly and (full size) Replay. All audio goes through the shared TTS service,
 * so the chosen neural voice, the cache and the device-voice fallback apply everywhere.
 */
export function SpeakButton({ text, slow = true, replay = true, size = 'md', className }: { text: string; slow?: boolean; replay?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const { l, lang } = useI18n();
  const [playing, setPlaying] = useState<Mode | null>(null);
  const [last, setLast] = useState<Mode | null>(null);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  const run = useRef(0);
  const notice = useTtsNotice((s) => s.reason);
  const available = speechPossible();

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const play = async (mode: Mode) => {
    const id = ++run.current;
    setFailed(false);
    setLast(mode);
    setPlaying(mode);
    const sp = speeds();
    const res = await speak(text, { speed: mode === 'slow' ? sp.slow : sp.normal });
    if (!alive.current || run.current !== id) return;
    setPlaying(null);
    if (!res.ok) setFailed(true);
  };

  const dim = size === 'sm' ? 15 : 18;
  const cls = size === 'sm' ? 'icon-btn !h-7 !w-7' : 'icon-btn';
  const hint = l({ en: 'Speech is not available on this device', ar: 'النطق غير متاح على هذا الجهاز' });
  const showReplay = replay && size === 'md' && last !== null;

  return (
    <span className={clsx('inline-flex items-center gap-1', className)}>
      <button
        type="button"
        className={clsx(cls, playing === 'normal' && 'text-en')}
        onClick={() => void play('normal')}
        disabled={!available}
        title={available ? l({ en: 'Listen', ar: 'استمع' }) : hint}
        aria-label={l({ en: 'Listen', ar: 'استمع' })}
      >
        <Volume2 size={dim} />
      </button>
      {slow && (
        <button
          type="button"
          className={clsx(cls, playing === 'slow' && 'text-en')}
          onClick={() => void play('slow')}
          disabled={!available}
          title={l({ en: 'Listen slowly', ar: 'استمع ببطء' })}
          aria-label={l({ en: 'Listen slowly', ar: 'استمع ببطء' })}
        >
          <Turtle size={dim} />
        </button>
      )}
      {showReplay && (
        <button
          type="button"
          className={cls}
          onClick={() => void play(last)}
          disabled={!available}
          title={l({ en: 'Replay', ar: 'أعد التشغيل' })}
          aria-label={l({ en: 'Replay', ar: 'أعد التشغيل' })}
        >
          <RotateCcw size={dim} />
        </button>
      )}
      {(failed || !available) && size === 'md' && <span className="muted text-xs">{hint}</span>}
      {!failed && available && notice && size === 'md' && <span className="muted text-xs">{noticeText(notice, lang === 'ar')}</span>}
    </span>
  );
}
