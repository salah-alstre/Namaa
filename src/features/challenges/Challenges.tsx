import clsx from 'clsx';
import { CalendarCheck, Flame, Sparkles, Star, Swords, Target, Trophy, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { QuestionPanel } from '@/components/QuestionPanel';
import { Bar, EmptyState, PageHeader, Stat } from '@/components/ui';
import { TOPIC_BY_ID } from '@/content/topics';
import { completeDailyChallenge, loadDailyChallenges, saveDailyChallenge } from '@/database/repos/progress';
import { DAILY_QUESTIONS, dailyChallengeQuestions, dailySeed } from '@/domain/planner';
import { DAILY_CHALLENGE_XP } from '@/domain/xp';
import { judgeAndRecord } from '@/features/shared/judge';
import { useI18n } from '@/i18n';
import { dayKey, lastNDays } from '@/lib/dates';
import { logEvent } from '@/lib/log';
import { playCue } from '@/lib/sound';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';

type Phase = 'home' | 'run' | 'result';

export function Challenges() {
  const { t, l, n } = useI18n();
  const daily = usePlayer((s) => s.daily);
  const today = dayKey();
  const seed = dailySeed(today);
  const questions = useMemo(() => dailyChallengeQuestions(seed), [seed]);
  const todayRow = daily.find((d) => d.day === today);
  const done = !!todayRow?.completed;

  const [phase, setPhase] = useState<Phase>('home');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [practiceOnly, setPracticeOnly] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [quit, setQuit] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!todayRow) void saveDailyChallenge(today, seed).then(() => usePlayer.getState().reload()).catch((e) => logEvent('error', `daily save: ${String(e)}`));
  }, [todayRow, today, seed]);

  const begin = () => {
    setIndex(0);
    setResults([]);
    setBonus(0);
    setFailed(false);
    setPracticeOnly(done);
    setPhase('run');
  };

  const finish = async (final: boolean[]) => {
    const score = final.filter(Boolean).length;
    try {
      const fresh = (await loadDailyChallenges()).find((d) => d.day === today);
      if (!fresh?.completed) {
        await saveDailyChallenge(today, seed);
        await completeDailyChallenge(today, score, final.length);
        await usePlayer.getState().reload();
        const xp = DAILY_CHALLENGE_XP + score * 2;
        await usePlayer.getState().grant(xp, 'daily', { questions: 0, correct: 0 });
        setBonus(xp);
        setPracticeOnly(false);
      } else setPracticeOnly(true);
    } catch (e) {
      logEvent('error', `daily complete: ${String(e)}`);
      setFailed(true);
      toast({ kind: 'error', title: t('chal.error') });
    }
    playCue('finish');
    setPhase('result');
  };

  const onSubmit = async (a: Parameters<typeof judgeAndRecord>[1], h: number, ms: number) =>
    judgeAndRecord(questions[index], a, h, ms, { awardXp: false, adaptive: false });

  if (phase === 'run') {
    const q = questions[index];
    const last = index + 1 >= questions.length;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="card-flat flex flex-wrap items-center gap-x-5 gap-y-2 !p-4">
          <div className="min-w-[10rem] flex-1">
            <div className="text-sm font-semibold">{t('chal.run.of', { n: index + 1, total: questions.length })}</div>
            <Bar ratio={index / questions.length} className="mt-2" />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setQuit(true)}>
            <X size={15} /> {t('chal.run.quit')}
          </button>
        </div>
        <QuestionPanel
          key={q.id}
          q={q}
          onSubmit={async (a, h, ms) => {
            const out = await onSubmit(a, h, ms);
            setResults((r) => [...r.slice(0, index), out.verdict.correct]);
            return out;
          }}
          onNext={() => {
            if (last) void finish(results);
            else setIndex(index + 1);
          }}
          nextLabel={last ? t('chal.run.finish') : undefined}
        />
        <Modal
          open={quit}
          onClose={() => setQuit(false)}
          title={t('chal.run.quitTitle')}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setQuit(false)}>{t('chal.run.keep')}</button>
              <button className="btn btn-primary" onClick={() => { setQuit(false); setPhase('home'); }}>{t('chal.run.quit')}</button>
            </>
          }
        >
          <p>{t('chal.run.quitBody')}</p>
        </Modal>
      </div>
    );
  }

  if (phase === 'result') {
    const score = results.filter(Boolean).length;
    const ratio = results.length ? score / results.length : 0;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="card anim-pop flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-soft text-gold"><Trophy size={32} /></span>
          <h1 className="h-page">{t('chal.res.title')}</h1>
          <p className="num text-3xl font-semibold">{t('prac.sum.score', { c: score, t: results.length })}</p>
          <p className="muted">{ratio === 1 ? t('chal.res.perfect') : ratio >= 0.6 ? t('chal.res.good') : t('chal.res.keep')}</p>
          {bonus > 0 && <span className="chip !bg-gold-soft !text-gold"><Sparkles size={14} /> {t('chal.reward', { n: bonus })}</span>}
          {practiceOnly && <p className="muted text-sm">{t('chal.res.practiceOnly')}</p>}
          {failed && <p className="text-sm text-bad">{t('chal.error')}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setPhase('home')}>{t('chal.res.home')}</button>
          {score < results.length && (
            <button className="btn btn-soft" onClick={() => useRouter.getState().go({ name: 'mistakes' })}>{t('chal.res.mistakes')}</button>
          )}
          <button className="btn btn-ghost" onClick={() => useRouter.getState().go({ name: 'math' })}>{t('chal.res.dash')}</button>
        </div>
      </div>
    );
  }

  const completed = daily.filter((d) => d.completed);
  const perfect = completed.filter((d) => d.total > 0 && d.score === d.total).length;
  const best = completed.reduce((a, d) => Math.max(a, d.total ? Math.round((d.score / d.total) * 100) : 0), 0);
  const days = lastNDays(14, today);
  const byDay = new Map(daily.map((d) => [d.day, d]));
  let run = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = byDay.get(days[i]);
    if (d?.completed) run++;
    else if (i === days.length - 1) continue;
    else break;
  }
  const themes = [...new Set(questions.map((q) => q.topicId))];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t('chal.title')} subtitle={t('chal.subtitle')} />
      <section className="card space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Swords size={28} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="h-section !m-0">{done ? t('chal.doneTitle') : t('chal.daily')}</h2>
            <p className="muted mt-1">{done && todayRow ? t('chal.doneBody', { c: todayRow.score, t: todayRow.total }) : t('chal.dailyDesc')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="chip"><Target size={14} /> {t('chal.questions', { n: DAILY_QUESTIONS })}</span>
          <span className="chip !bg-gold-soft !text-gold"><Sparkles size={14} /> {t('chal.reward', { n: DAILY_CHALLENGE_XP })}</span>
          <span className="chip">{t('chal.noHints')}</span>
        </div>
        <div>
          <div className="label">{t('chal.topics')}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {themes.map((id) => <span key={id} className="chip">{TOPIC_BY_ID[id] ? l(TOPIC_BY_ID[id].title) : id}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary btn-lg" onClick={begin}>{done ? t('chal.retry') : t('chal.start')}</button>
          {done && <span className="muted text-sm">{t('chal.retryNote')} {t('chal.comeBack')}.</span>}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CalendarCheck} tone="brand" label={t('chal.stats.done')} value={n(completed.length, 0)} />
        <Stat icon={Star} tone="gold" label={t('chal.stats.perfect')} value={n(perfect, 0)} />
        <Stat icon={Trophy} tone="good" label={t('chal.stats.best')} value={completed.length ? `${n(best, 0)}%` : '—'} />
        <Stat icon={Flame} tone="warn" label={t('chal.stats.streak')} value={n(run, 0)} />
      </div>

      <section className="card space-y-3">
        <h2 className="h-section !m-0">{t('chal.history')}</h2>
        {completed.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={t('chal.history.empty')} body={t('chal.history.emptyBody')} />
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const row = byDay.get(d);
              const state = row?.completed ? 'done' : row ? 'open' : 'none';
              const label = state === 'done' && row ? `${row.score}/${row.total}` : '';
              return (
                <div
                  key={d}
                  title={`${d} · ${state === 'done' ? label : state === 'open' ? t('chal.history.open') : t('chal.history.none')}`}
                  className={clsx(
                    'flex h-12 flex-col items-center justify-center rounded-lg border text-xs tabular-nums',
                    state === 'done' ? 'border-good bg-good-soft text-good' : 'border-line bg-surface-2 text-ink-3',
                    d === today && 'ring-2 ring-brand',
                  )}
                >
                  <span>{d.slice(8)}</span>
                  <span className="font-semibold">{label || '·'}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
