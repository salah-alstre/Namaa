import clsx from 'clsx';
import { Check, ChevronRight, Compass, Lock, Play } from 'lucide-react';
import { NamedIcon } from '@/components/Icon';
import { PageHeader } from '@/components/ui';
import { LESSONS, lessonsOfLevel } from '@/content/lessons';
import { LEVELS, TOPIC_BY_ID } from '@/content/topics';
import { masteryBand } from '@/domain/mastery';
import { useI18n } from '@/i18n';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import type { Lesson } from '@/types';

/** The seven-level roadmap. Lessons open one after another; a setting can open everything. */
export function Learn() {
  const { t, l, n } = useI18n();
  const go = useRouter((s) => s.go);
  const { doneLessons, openLessons, lessons, topics, nextLessonId } = usePlayer();
  const placed = useSettings((s) => s.settings.placedLevel);
  const unlockAll = useSettings((s) => s.settings.unlockAll);

  const total = LESSONS.length;
  const done = LESSONS.filter((x) => doneLessons.has(x.id)).length;

  const open = (lesson: Lesson) => go({ name: 'lesson', lessonId: lesson.id });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={t('learn.title')}
        subtitle={t('learn.subtitle')}
        actions={
          <button className="btn btn-soft" onClick={() => go({ name: 'placement' })}>
            <Compass size={16} /> {t('learn.placementCta')}
          </button>
        }
      />

      <div className="card flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{t('learn.progress', { c: done, t: total })}</div>
          <div className="progress mt-2">
            <span style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
        {placed > 1 && !unlockAll && <span className="chip">{t('learn.placedAt', { n: placed })}</span>}
        {nextLessonId && LESSONS.find((x) => x.id === nextLessonId) && (
          <button className="btn btn-primary" onClick={() => open(LESSONS.find((x) => x.id === nextLessonId) as Lesson)}>
            <Play size={16} className="rtl:rotate-180" /> {t('learn.continue', { title: l((LESSONS.find((x) => x.id === nextLessonId) as Lesson).title) })}
          </button>
        )}
      </div>

      {LEVELS.map((lv) => {
        const list = lessonsOfLevel(lv.level);
        const c = list.filter((x) => doneLessons.has(x.id)).length;
        return (
          <section key={lv.level} className="space-y-3" aria-labelledby={`lv-${lv.level}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: lv.color }}>
                {n(lv.level)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`lv-${lv.level}`} className="h-section !mb-0">
                  {l(lv.title)}
                </h2>
                <p className="muted text-sm">{l(lv.summary)}</p>
              </div>
              <span className="chip shrink-0">{t('learn.levelProgress', { c, t: list.length })}</span>
            </div>

            <ol className="relative space-y-2 ps-5 before:absolute before:inset-y-2 before:start-[1.05rem] before:w-0.5 before:rounded before:bg-line">
              {list.map((lesson) => {
                const isDone = doneLessons.has(lesson.id);
                const isOpen = openLessons.has(lesson.id);
                const prog = lessons[lesson.id];
                const started = prog?.status === 'started';
                const isNext = nextLessonId === lesson.id;
                const mastery = topics[lesson.topicId]?.mastery ?? 0;
                const topic = TOPIC_BY_ID[lesson.topicId];
                return (
                  <li key={lesson.id} className="relative">
                    <span
                      className={clsx(
                        'absolute -start-5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 bg-surface',
                        isDone ? 'border-good bg-good text-white' : isNext ? 'border-brand' : 'border-line',
                      )}
                      style={isDone ? undefined : isNext ? { borderColor: lv.color } : undefined}
                      aria-hidden
                    >
                      {isDone && <Check size={12} strokeWidth={3} />}
                      {!isOpen && !isDone && <Lock size={10} className="text-ink-3" />}
                    </span>
                    <button
                      type="button"
                      disabled={!isOpen}
                      onClick={() => open(lesson)}
                      title={isOpen ? undefined : t('learn.lockedHint')}
                      className={clsx(
                        'card-flat flex w-full items-center gap-3 text-start transition',
                        isOpen ? 'hover:border-brand hover:shadow-card' : 'cursor-not-allowed opacity-60',
                        isNext && 'ring-2 ring-brand/40',
                      )}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${lv.color}22`, color: lv.color }}>
                        <NamedIcon name={topic?.icon ?? 'Sigma'} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{l(lesson.title)}</span>
                        <span className="muted block truncate text-sm">{l(lesson.summary)}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                          <span>{t('learn.minutes', { n: lesson.minutes })}</span>
                          {isDone && <span className="text-good">{t('learn.done')}</span>}
                          {started && !isDone && <span className="text-warn">{t('learn.inProgress')}</span>}
                          {isNext && !started && <span className="text-brand">{t('learn.next')}</span>}
                          {!isOpen && <span>{t('learn.locked')}</span>}
                          {mastery > 0 && <span>{t(`band.${masteryBand(mastery)}` as never)}</span>}
                        </span>
                      </span>
                      {isDone && prog && (
                        <span className="num text-gold" aria-label={t('learn.stars', { n: prog.stars })}>
                          {'★'.repeat(prog.stars)}
                          <span className="text-line">{'★'.repeat(Math.max(0, 3 - prog.stars))}</span>
                        </span>
                      )}
                      {isOpen && <ChevronRight size={18} className="shrink-0 text-ink-3 rtl:rotate-180" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {!unlockAll && (
        <p className="muted text-center text-sm">
          {t('learn.unlockHint')}{' '}
          <button className="text-brand underline" onClick={() => go({ name: 'settings' })}>
            {t('learn.unlockHintAction')}
          </button>
        </p>
      )}
    </div>
  );
}
