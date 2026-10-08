import { CheckCircle2, Circle, PlayCircle, Star } from 'lucide-react';
import { ALL_LESSONS, LEVELS, lessonsOfLevel } from '@/content/english';
import { levelPercent } from '@/english-engine/progress';
import { levelIndex } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';

export function EnLearn() {
  const { l, t, n } = useI18n();
  const go = useRouter((s) => s.go);
  const lessons = useEnglish((s) => s.lessons);
  const placed = useSettings((s) => s.settings.enStartLevel);
  const placements = useEnglish((s) => s.placements);
  const lastPlaced = placements[0]?.level;
  const mine = lastPlaced ?? placed;
  const nextId = ALL_LESSONS.find((x) => lessons[x.id]?.status !== 'completed')?.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title={t('nav.en.learn')}
        subtitle={l({ en: 'Five levels, from your first words to confident everyday English. Nothing is locked.', ar: 'خمسة مستويات، من أولى الكلمات إلى إنجليزية يومية واثقة. لا شيء مقفل.' })}
        actions={
          <button className="btn-soft btn-sm" onClick={() => go({ name: 'en-placement' })}>
            {l({ en: 'Find my level', ar: 'حدد مستواي' })}
          </button>
        }
      />
      {LEVELS.map((lv) => {
        const list = lessonsOfLevel(lv.id);
        const done = list.filter((x) => lessons[x.id]?.status === 'completed').length;
        return (
          <section key={lv.id} className="card space-y-4 p-5" aria-labelledby={`lv-${lv.id}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-en-soft px-2.5 py-1 text-sm font-bold text-en">
                <EnglishText>{lv.code}</EnglishText>
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`lv-${lv.id}`} className="h-section">
                  {l(lv.name)}
                  {mine && levelIndex(mine as never) === levelIndex(lv.id) && (
                    <span className="chip ms-2">{l({ en: 'Your level', ar: 'مستواك' })}</span>
                  )}
                </h2>
                <p className="muted text-sm">{l(lv.blurb)}</p>
              </div>
              <span className="muted num text-sm">
                {n(done)}/{n(list.length)}
              </span>
            </div>
            <Bar ratio={levelPercent(done, list.length) / 100} />
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((x) => {
                const row = lessons[x.id];
                const status = row?.status;
                const Icon = status === 'completed' ? CheckCircle2 : status === 'started' ? PlayCircle : Circle;
                return (
                  <li key={x.id}>
                    <button
                      onClick={() => go({ name: 'en-lesson', lessonId: x.id })}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-start transition-colors hover:bg-surface-2 ${
                        x.id === nextId ? 'border-en' : 'border-line'
                      }`}
                    >
                      <Icon size={20} className={status === 'completed' ? 'text-good' : status === 'started' ? 'text-en' : 'text-ink-2'} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{l(x.title)}</span>
                        <span className="muted block truncate text-xs">
                          {l(x.summary)} · {n(x.minutes)} {l({ en: 'min', ar: 'د' })}
                        </span>
                      </span>
                      {status === 'completed' && (
                        <span className="flex text-gold" aria-label={`${row?.stars ?? 0}/3`}>
                          {[1, 2, 3].map((i) => (
                            <Star key={i} size={14} fill={i <= (row?.stars ?? 0) ? 'currentColor' : 'none'} />
                          ))}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
