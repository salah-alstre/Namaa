import { ClipboardCheck, Clock, Home, NotebookText, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { QuestionPanel } from '@/components/QuestionPanel';
import { Modal } from '@/components/Modal';
import { Bar, EmptyState, Stat } from '@/components/ui';
import { TOPIC_BY_ID } from '@/content/topics';
import { sessionPace } from '@/domain/adaptive';
import { useI18n } from '@/i18n';
import { playCue } from '@/lib/sound';
import { usePlayer } from '@/stores/player';
import { usePractice } from '@/stores/practice';
import { useRouter } from '@/stores/router';
import { startPractice } from './quick';

/** The live practice session, or its summary once finished. */
export function PracticeRun() {
  const status = usePractice((s) => s.status);
  const go = useRouter((s) => s.go);
  const replace = useRouter((s) => s.replace);

  // Landing here without a session (e.g. after a reload) goes back to the setup.
  useEffect(() => {
    if (status === 'idle') replace({ name: 'practice' });
  }, [status, replace]);

  if (status === 'running') return <Running />;
  if (status === 'summary') return <Summary onHome={() => go({ name: 'math' })} />;
  return null;
}

function Running() {
  const { t, n, clock } = useI18n();
  const q = usePractice((s) => s.question);
  const config = usePractice((s) => s.config);
  const results = usePractice((s) => s.results);
  const deadline = usePractice((s) => s.deadline);
  const submit = usePractice((s) => s.submit);
  const next = usePractice((s) => s.next);
  const similar = usePractice((s) => s.similar);
  const finish = usePractice((s) => s.finish);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [judgedId, setJudgedId] = useState<string | null>(null);

  useEffect(() => {
    if (deadline === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [deadline]);

  const countable = results.filter((r) => !r.extra);
  const answered = countable.length;
  const correct = results.filter((r) => r.correct).length;
  const total = config?.count ?? null;
  const pace = sessionPace(results.map((r) => r.correct));
  const left = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  // Once a question is judged it is already counted in `answered`.
  const judged = q !== null && judgedId === q.id;
  const current = judged ? answered : answered + 1;
  const isLast = total !== null && answered >= total;

  // The last second of a timed session ends it, even in the middle of a question.
  useEffect(() => {
    if (left === 0) void finish();
  }, [left, finish]);

  if (!q) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card-flat flex flex-wrap items-center gap-x-5 gap-y-2 !p-4">
        <div className="min-w-[10rem] flex-1">
          <div className="text-sm font-semibold">{total !== null ? t('prac.run.of', { n: Math.min(Math.max(current, 1), total), total }) : t('prac.run.n', { n: Math.max(current, 1) })}</div>
          {total !== null && <Bar ratio={answered / total} className="mt-2" />}
        </div>
        <span className="chip">{t('prac.run.correctSoFar', { n: correct })}</span>
        {left !== null && (
          <span className="chip num" aria-label={t('prac.run.timeLeft')}>
            <Clock size={14} /> {clock(left)}
          </span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmQuit(true)}>
          <X size={15} /> {t('prac.run.quit')}
        </button>
      </div>

      {pace !== 'steady' && (
        <p className="anim-fade flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-2 text-sm text-accent">
          <Sparkles size={16} />
          {pace === 'too-easy' ? t('prac.run.paceUp') : t('prac.run.paceDown')}
        </p>
      )}

      <QuestionPanel
        key={q.id}
        q={q}
        onSubmit={(a, h, ms) => submit(a, h, ms)}
        onJudged={() => setJudgedId(q.id)}
        onNext={next}
        onSimilar={similar}
        nextLabel={isLast ? t('q.finish') : undefined}
      />

      <Modal
        open={confirmQuit}
        onClose={() => setConfirmQuit(false)}
        title={t('prac.run.quitTitle')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>
              {t('prac.run.keep')}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setConfirmQuit(false);
                void finish();
              }}
            >
              {t('prac.run.quit')}
            </button>
          </>
        }
      >
        <p>{t('prac.run.quitBody')}</p>
        <p className="muted mt-2 text-sm">{t('prac.sum.score', { c: n(correct, 0), t: n(results.length, 0) })}</p>
      </Modal>
    </div>
  );
}

function Summary({ onHome }: { onHome: () => void }) {
  const { t, l, n, clock } = useI18n();
  const go = useRouter((s) => s.go);
  const results = usePractice((s) => s.results);
  const config = usePractice((s) => s.config);
  const empty = usePractice((s) => s.empty);
  const masteryBefore = usePractice((s) => s.masteryBefore);
  const reset = usePractice((s) => s.reset);
  const topics = usePlayer((s) => s.topics);
  const timedOut = config?.timeLimitS != null;

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const xp = results.reduce((a, r) => a + r.xp, 0);
  const timeMs = results.reduce((a, r) => a + r.timeMs, 0);
  const hints = results.reduce((a, r) => a + r.hints, 0);
  const ratio = total ? correct / total : 0;

  useEffect(() => {
    if (total > 0) playCue('finish');
  }, [total]);

  const byTopic = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const r of results) {
      const e = map.get(r.topicId) ?? { total: 0, correct: 0 };
      e.total += 1;
      if (r.correct) e.correct += 1;
      map.set(r.topicId, e);
    }
    return [...map.entries()];
  }, [results]);

  const leave = (after: () => void) => {
    reset();
    after();
  };

  if (empty) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={ClipboardCheck}
          title={t('prac.sum.empty')}
          body={t('prac.sum.emptyBody')}
          action={
            <button className="btn btn-primary" onClick={() => leave(() => go({ name: 'practice' }))}>
              {t('prac.sum.again')}
            </button>
          }
        />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={ClipboardCheck}
          title={t('prac.sum.title')}
          body={t('prac.sum.noAnswers')}
          action={
            <button className="btn btn-primary" onClick={() => leave(() => go({ name: 'practice' }))}>
              {t('prac.sum.again')}
            </button>
          }
        />
      </div>
    );
  }

  const message = ratio >= 0.85 ? t('prac.sum.great') : ratio >= 0.55 ? t('prac.sum.good') : t('prac.sum.keep');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card anim-pop flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-soft text-gold">
          <Trophy size={32} />
        </span>
        <h1 className="h-page">{timedOut ? t('prac.sum.timesUp') : t('prac.sum.title')}</h1>
        <p className="num text-3xl font-semibold">{t('prac.sum.score', { c: correct, t: total })}</p>
        <p className="muted">{message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Sparkles} tone="gold" label={t('prac.sum.xp')} value={n(xp, 0)} />
        <Stat icon={Clock} tone="brand" label={t('prac.sum.time')} value={clock(Math.round(timeMs / 1000))} />
        <Stat icon={Clock} tone="accent" label={t('prac.sum.avg')} value={clock(Math.round(timeMs / 1000 / total))} />
        <Stat icon={NotebookText} tone="warn" label={t('prac.sum.hints')} value={n(hints, 0)} />
      </div>

      {byTopic.length > 0 && (
        <section className="card space-y-3">
          <h2 className="h-section">{t('prac.sum.byTopic')}</h2>
          <ul className="divide-y divide-line">
            {byTopic.map(([id, e]) => {
              const delta = Math.round((topics[id]?.mastery ?? 0) - (masteryBefore[id] ?? 0));
              const topic = TOPIC_BY_ID[id];
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 font-medium">{topic ? l(topic.title) : id}</span>
                  <span className="muted num text-sm">{t('prac.sum.score', { c: e.correct, t: e.total })}</span>
                  {delta !== 0 && (
                    <span className={delta > 0 ? 'chip !bg-good-soft !text-good' : 'chip !bg-bad-soft !text-bad'}>
                      {delta > 0 ? t('prac.sum.masteryUp', { n: delta }) : t('prac.sum.masteryDown', { n: delta })}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            const cfg = config;
            reset();
            if (cfg) void startPractice(cfg);
            else go({ name: 'practice' });
          }}
        >
          <RotateCcw size={16} /> {t('prac.sum.again')}
        </button>
        {results.some((r) => !r.correct) && (
          <button className="btn btn-soft" onClick={() => leave(() => go({ name: 'mistakes' }))}>
            <NotebookText size={16} /> {t('prac.sum.mistakes')}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => leave(onHome)}>
          <Home size={16} /> {t('prac.sum.home')}
        </button>
      </div>
    </div>
  );
}
