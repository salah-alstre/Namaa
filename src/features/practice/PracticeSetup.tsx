import clsx from 'clsx';
import { AlarmClock, Dices, Infinity as InfinityIcon, Play, RotateCcw, Shuffle, Target, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NamedIcon } from '@/components/Icon';
import { PageHeader, Segmented } from '@/components/ui';
import { LEVELS } from '@/content/topics';
import { modeDefaults, PRACTICE_COUNTS, PRACTICABLE, type PracticeConfig } from '@/domain/planner';
import { useI18n } from '@/i18n';
import { usePlayer } from '@/stores/player';
import { DIFFICULTIES, type Difficulty, type SessionMode } from '@/types';
import { startPractice } from './quick';

const MODES: { id: SessionMode; icon: typeof Play }[] = [
  { id: 'normal', icon: Play },
  { id: 'quick', icon: Zap },
  { id: 'endless', icon: InfinityIcon },
  { id: 'timed', icon: AlarmClock },
  { id: 'weak', icon: Target },
  { id: 'mix', icon: Shuffle },
  { id: 'review', icon: RotateCcw },
];

/** Practice setup: mode, topics, difficulty and length. */
export function PracticeSetup() {
  const { t, l, n } = useI18n();
  const openMistakes = usePlayer((s) => s.openMistakes);
  const [mode, setMode] = useState<SessionMode>('normal');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | 'adaptive'>('adaptive');
  const [count, setCount] = useState<number>(10);
  const [starting, setStarting] = useState(false);

  const byLevel = useMemo(() => LEVELS.map((lv) => ({ lv, topics: PRACTICABLE.filter((tp) => tp.level === lv.level) })).filter((g) => g.topics.length > 0), []);

  const usesTopics = mode === 'normal' || mode === 'endless' || mode === 'timed' || mode === 'quick' || mode === 'review';
  const usesDifficulty = mode !== 'review';
  const fixedCount = mode === 'quick' || mode === 'endless' || mode === 'timed';
  const reviewEmpty = mode === 'review' && openMistakes === 0;

  const toggle = (id: string) => setTopicIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const toggleLevel = (ids: string[]) =>
    setTopicIds((cur) => (ids.every((i) => cur.includes(i)) ? cur.filter((x) => !ids.includes(x)) : Array.from(new Set([...cur, ...ids]))));

  const start = async () => {
    if (starting) return;
    setStarting(true);
    const cfg: PracticeConfig = {
      mode,
      topicIds: usesTopics ? topicIds : [],
      difficulty,
      count: mode === 'review' ? PRACTICE_COUNTS[2] : count,
      timeLimitS: null,
      ...modeDefaults(mode),
    };
    try {
      await startPractice(cfg);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('prac.title')} subtitle={t('prac.subtitle')} />

      <section aria-labelledby="mode-h" className="space-y-3">
        <h2 id="mode-h" className="h-section">{t('prac.mode')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={clsx('card-flat flex flex-col items-start gap-2 !p-4 text-start transition-all hover:border-brand', mode === id && '!border-brand bg-brand-soft')}
            >
              <span className={clsx('flex h-9 w-9 items-center justify-center rounded-xl', mode === id ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink-2')}>
                <Icon size={18} />
              </span>
              <span className="font-semibold">{t(`prac.mode.${id}` as never)}</span>
              <span className="muted text-sm">{t(`prac.mode.${id}.desc` as never)}</span>
            </button>
          ))}
        </div>
        {mode === 'review' && <p className="muted text-sm">{openMistakes > 0 ? t('prac.reviewCount', { n: openMistakes }) : t('prac.reviewNone')}</p>}
      </section>

      {usesTopics && (
        <section aria-labelledby="topics-h" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="topics-h" className="h-section">{t('prac.topics')}</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="muted">{topicIds.length > 0 ? t('prac.selected', { n: topicIds.length }) : t('prac.noTopicsHint')}</span>
              {topicIds.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setTopicIds([])}>
                  {t('prac.clearTopics')}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {byLevel.map(({ lv, topics }) => {
              const ids = topics.map((x) => x.id);
              return (
                <div key={lv.level} className="card-flat !p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: lv.color }} />
                      <h3 className="font-semibold">
                        {t('common.level', { n: lv.level })} · {l(lv.title)}
                      </h3>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleLevel(ids)}>
                      {t('prac.selectLevel')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((tp) => {
                      const on = topicIds.includes(tp.id);
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(tp.id)}
                          className={clsx('chip !px-3 !py-1.5 transition-colors', on ? '!bg-brand !text-brand-ink' : 'hover:bg-surface-3')}
                        >
                          <NamedIcon name={tp.icon} size={14} />
                          {l(tp.title)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {usesDifficulty && (
          <div className="space-y-3">
            <h2 className="h-section">{t('prac.difficulty')}</h2>
            <Segmented<string>
              label={t('prac.difficulty')}
              value={String(difficulty)}
              onChange={(v) => setDifficulty(v === 'adaptive' ? 'adaptive' : (Number(v) as Difficulty))}
              options={[{ value: 'adaptive', label: t('diff.adaptive') }, ...DIFFICULTIES.map((d) => ({ value: String(d), label: t(`diff.${d}` as never) }))]}
            />
          </div>
        )}
        {!fixedCount && mode !== 'review' && (
          <div className="space-y-3">
            <h2 className="h-section">{t('prac.count')}</h2>
            <Segmented<number>
              label={t('prac.count')}
              value={count}
              onChange={setCount}
              options={PRACTICE_COUNTS.map((c) => ({ value: c, label: n(c, 0) }))}
            />
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-lg" onClick={() => void start()} disabled={starting || reviewEmpty}>
          <Dices size={18} />
          {t('prac.start')}
        </button>
        {reviewEmpty && <span className="muted text-sm">{t('prac.reviewNone')}</span>}
      </div>
    </div>
  );
}
