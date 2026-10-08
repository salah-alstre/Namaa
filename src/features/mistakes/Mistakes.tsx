import clsx from 'clsx';
import { BookX, Check, RotateCcw, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Rich } from '@/components/Math';
import { EmptyState, PageHeader, Segmented } from '@/components/ui';
import { MISTAKE_BY_ID } from '@/content/mistakes';
import { TOPIC_BY_ID } from '@/content/topics';
import { clearUnderstoodMistakes, deleteMistake, loadMistakes, setMistakeFlag } from '@/database/repos/attempts';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { usePlayer } from '@/stores/player';
import { usePractice } from '@/stores/practice';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';
import type { MistakeRow } from '@/types';

type Filter = 'all' | 'open' | 'favorite' | 'understood';

export function Mistakes() {
  const { t, l, n } = useI18n();
  const [rows, setRows] = useState<MistakeRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  const refresh = useCallback(async () => {
    try {
      setRows(await loadMistakes());
    } catch (e) {
      logEvent('error', `mistakes load: ${String(e)}`);
      setRows([]);
    }
    void usePlayer.getState().reload();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      logEvent('error', `mistakes update: ${String(e)}`);
      toast({ kind: 'error', title: t('mist.error') });
    }
  };

  const review = async () => {
    await usePractice.getState().start({ mode: 'review', topicIds: [], difficulty: 'adaptive', count: 20, timeLimitS: null });
    useRouter.getState().go({ name: 'practice-run' });
  };

  if (rows === null) return <div className="muted p-8 text-center">{t('common.loading')}</div>;

  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'open' ? !r.understood : filter === 'favorite' ? r.favorite : r.understood));
  const openCount = rows.filter((r) => !r.understood).length;
  const hasUnderstood = rows.some((r) => r.understood);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={t('mist.title')}
        subtitle={t('mist.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            {hasUnderstood && (
              <button className="btn btn-ghost btn-sm" onClick={() => void act(() => clearUnderstoodMistakes())}>
                <Trash2 size={15} /> {t('mist.clearUnderstood')}
              </button>
            )}
            <button className="btn btn-primary btn-sm" disabled={openCount === 0} onClick={() => void review()}>
              <RotateCcw size={15} /> {t('mist.review')}
            </button>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={BookX} title={t('mist.empty')} body={t('mist.emptyBody')} action={<button className="btn btn-primary" onClick={() => useRouter.getState().go({ name: 'practice' })}>{t('nav.practice')}</button>} />
      ) : (
        <>
          <Segmented
            value={filter}
            onChange={setFilter}
            label={t('mist.title')}
            options={[
              { value: 'open', label: `${t('mist.filter.open')} · ${n(openCount, 0)}` },
              { value: 'favorite', label: t('mist.filter.favorite') },
              { value: 'understood', label: t('mist.filter.understood') },
              { value: 'all', label: t('mist.filter.all') },
            ]}
          />
          {shown.length === 0 ? (
            <EmptyState icon={BookX} title={t('mist.emptyFilter')} />
          ) : (
            <ul className="space-y-3">
              {shown.map((r) => {
                const pattern = r.patternId ? MISTAKE_BY_ID[r.patternId] : undefined;
                const topic = TOPIC_BY_ID[r.topicId];
                return (
                  <li key={r.id} className={clsx('card space-y-3', r.understood && 'opacity-70')}>
                    <div className="flex flex-wrap items-center gap-2">
                      {topic && <span className="chip">{l(topic.title)}</span>}
                      <span className="chip">{t(`qtype.${r.qtype}` as never)}</span>
                      <span className="chip">{t('mist.wrongTimes', { n: r.timesWrong })}</span>
                      <span className="flex-1" />
                      <button className="icon-btn" aria-pressed={r.favorite} title={t(r.favorite ? 'mist.unstar' : 'mist.star')} aria-label={t(r.favorite ? 'mist.unstar' : 'mist.star')} onClick={() => void act(() => setMistakeFlag(r.id, 'favorite', !r.favorite))}>
                        <Star size={17} className={r.favorite ? 'fill-current text-gold' : ''} />
                      </button>
                      <button className="icon-btn" title={t('mist.delete')} aria-label={t('mist.delete')} onClick={() => void act(() => deleteMistake(r.id))}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="text-lg leading-relaxed"><Rich text={l(r.question.prompt)} /></div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-bad-soft p-3">
                        <div className="label">{t('mist.yourAnswer')}</div>
                        <div className="num text-bad">{r.userAnswer || t('mist.blank')}</div>
                      </div>
                      <div className="rounded-lg bg-good-soft p-3">
                        <div className="label">{t('mist.correctAnswer')}</div>
                        <div className="text-good"><Rich text={l(r.question.correctText)} /></div>
                      </div>
                    </div>
                    <div className="text-sm text-ink-2">
                      <span className="label">{t('mist.explanation')}</span>
                      <Rich text={l(r.question.explanation)} />
                    </div>
                    {pattern && (
                      <div className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
                        <div className="font-semibold">{t('mist.pattern')}: {l(pattern.title)}</div>
                        <div>{l(pattern.tip)}</div>
                      </div>
                    )}
                    <div>
                      <button className="btn btn-soft btn-sm" onClick={() => void act(() => setMistakeFlag(r.id, 'understood', !r.understood))}>
                        <Check size={15} /> {t(r.understood ? 'mist.unmarkUnderstood' : 'mist.markUnderstood')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
