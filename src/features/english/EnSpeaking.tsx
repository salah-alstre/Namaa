import { useState } from 'react';
import { LEVELS, SPEAKING } from '@/content/english';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';

export function EnSpeaking() {
  const { l, t } = useI18n();
  const rated = useEnglish((s) => s.speaking);
  const rate = useEnglish((s) => s.rateSpeaking);
  const [tip, setTip] = useState<string | null>(null);

  const RATINGS: { v: 1 | 2 | 3; label: { en: string; ar: string }; cls: string }[] = [
    { v: 1, label: { en: 'Hard', ar: 'صعبة' }, cls: 'bg-bad-soft text-bad' },
    { v: 2, label: { en: 'OK', ar: 'مقبولة' }, cls: 'bg-warn-soft text-warn' },
    { v: 3, label: { en: 'Easy', ar: 'سهلة' }, cls: 'bg-good-soft text-good' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader title={t('nav.en.speaking')} subtitle={l({ en: 'Listen, say it out loud, then rate yourself honestly. There is no automatic scoring.', ar: 'استمع، وانطق بصوت عالٍ، ثم قيّم نفسك بصدق. لا يوجد تقييم آلي.' })} />
      {LEVELS.map((lv) => {
        const items = SPEAKING.filter((x) => x.level === lv.id);
        if (items.length === 0) return null;
        return (
          <section key={lv.id} className="space-y-2">
            <h2 className="h-section"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</h2>
            <ul className="space-y-2">
              {items.map((x) => (
                <li key={x.id} className="card space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <EnglishText block className="text-lg font-semibold">{x.en}</EnglishText>
                      <span className="muted text-sm">{x.ar}</span>
                    </div>
                    <SpeakButton text={x.en} size="sm" />
                    <SpeakButton text={x.en} size="sm" slow />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {RATINGS.map((r) => (
                      <button key={r.v} className={`chip cursor-pointer ${rated[x.id] === r.v ? `${r.cls} ring-1 ring-current` : ''}`} aria-pressed={rated[x.id] === r.v} onClick={() => rate(x.id, r.v)}>{l(r.label)}</button>
                    ))}
                    <button className="btn-ghost btn-sm ms-auto" onClick={() => setTip(tip === x.id ? null : x.id)}>{l({ en: 'Tip', ar: 'نصيحة' })}</button>
                  </div>
                  {tip === x.id && <p className="muted rounded-xl bg-surface-2 p-3 text-sm">{l(x.tip)}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
