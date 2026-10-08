import clsx from 'clsx';
import { AlertTriangle, ArrowLeft, ArrowRight, Flag, LogOut, Send, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnswerInput } from '@/components/AnswerInput';
import { Rich, Tex } from '@/components/Math';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/ui';
import { isBlank, initialValue } from '@/features/shared/answers';
import { useI18n } from '@/i18n';
import { useExam } from '@/stores/exam';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';

type Phase = 'loading' | 'ready' | 'missing' | 'finished';

/** One exam in progress: navigator, flagging, a single timer, and a confirmation before submitting. */
export function ExamRun({ examId }: { examId: number }) {
  const { t, l, n, clock, isRtl } = useI18n();
  const go = useRouter((s) => s.go);
  const replace = useRouter((s) => s.replace);

  const exam = useExam((s) => s.exam);
  const index = useExam((s) => s.index);
  const answers = useExam((s) => s.answers);
  const flags = useExam((s) => s.flags);
  const elapsedS = useExam((s) => s.elapsedS);
  const grade = useExam((s) => s.grade);
  const submitting = useExam((s) => s.submitting);

  const [phase, setPhase] = useState<Phase>('loading');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Make sure the store holds this exam (it is already there when we arrive from the setup page).
  useEffect(() => {
    let alive = true;
    const s = useExam.getState();
    if (s.exam && s.exam.id === examId && s.exam.status === 'in_progress') {
      setPhase('ready');
      return;
    }
    setPhase('loading');
    void s.resume(examId).then(async (ok) => {
      if (!alive) return;
      if (ok) setPhase('ready');
      else {
        const { loadExam } = await import('@/database/repos/exams');
        const row = await loadExam(examId).catch(() => null);
        if (alive) setPhase(row && row.status === 'finished' ? 'finished' : 'missing');
      }
    });
    return () => {
      alive = false;
    };
  }, [examId]);

  // Save on the way out, whichever way the learner leaves this page.
  useEffect(
    () => () => {
      void useExam.getState().persist();
    },
    [],
  );

  // The one clock. It only runs while this page is mounted, so time away is not counted.
  useEffect(() => {
    if (phase !== 'ready') return;
    const id = window.setInterval(() => useExam.getState().tick(), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Once marked (by the learner or by the clock running out), show the result.
  useEffect(() => {
    if (grade && exam && exam.id === examId) {
      setConfirmSubmit(false);
      replace({ name: 'exam-result', examId });
    }
  }, [grade, exam, examId, replace]);

  if (phase === 'loading' || !exam || exam.id !== examId) {
    if (phase === 'missing' || phase === 'finished') {
      return (
        <EmptyState
          icon={phase === 'missing' ? AlertTriangle : Flag}
          title={t(phase === 'missing' ? 'exams.run.notFound' : 'exams.run.finished')}
          action={
            <div className="flex gap-2">
              {phase === 'finished' && (
                <button type="button" className="btn btn-primary" onClick={() => replace({ name: 'exam-result', examId })}>
                  {t('exams.run.viewResult')}
                </button>
              )}
              <button type="button" className="btn" onClick={() => go({ name: 'exams' })}>{t('exams.run.toExams')}</button>
            </div>
          }
        />
      );
    }
    return <div className="muted p-8 text-center">{t('common.loading')}</div>;
  }

  const total = exam.questions.length;
  const q = exam.questions[index];
  const value = answers[q.id] ?? initialValue(q);
  const flagged = flags.includes(q.id);
  const answeredIds = exam.questions.filter((x) => !isBlank(x, answers[x.id]));
  const unanswered = total - answeredIds.length;
  const limit = exam.timeLimitS;
  const left = limit !== null ? Math.max(0, limit - elapsedS) : null;
  const low = left !== null && left <= 60;
  const st = useExam.getState;

  const leave = async () => {
    await st().persist();
    st().leave();
    go({ name: 'exams' });
  };

  const submit = async () => {
    const g = await st().submit();
    if (!g) toast({ kind: 'error', title: t('error.generic') });
  };

  const Next = isRtl ? ArrowLeft : ArrowRight;
  const Prev = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{exam.title}</h1>
          <p className="muted text-sm">{t('exams.run.question', { n: index + 1, t: total })}</p>
        </div>
        <div
          className={clsx('chip !px-3 !py-1.5 tabular-nums', low && '!bg-bad-soft !text-bad anim-pulse')}
          role="timer"
          aria-label={t(left !== null ? 'exams.run.timeLeft' : 'exams.run.elapsed')}
        >
          <Timer size={14} />
          <span className="num">{clock(left !== null ? left : elapsedS)}</span>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setConfirmLeave(true)}>
          <LogOut size={14} className="rtl:rotate-180" />
          {t('exams.run.exit')}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
          <Send size={14} className="rtl:-scale-x-100" />
          {t('exams.run.submit')}
        </button>
      </header>
      {low && <p role="alert" className="text-sm font-medium text-bad">{t('exams.run.lowTime')}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
        <section className="card space-y-5" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <span className="chip">{t(`qtype.${q.qtype}` as never)}</span>
            <button
              type="button"
              className={clsx('btn btn-sm', flagged && '!border-warn !bg-warn-soft !text-warn')}
              aria-pressed={flagged}
              onClick={() => st().toggleFlag(q.id)}
            >
              <Flag size={14} />
              {t(flagged ? 'exams.run.unflag' : 'exams.run.flag')}
            </button>
          </div>

          <div className="text-lg leading-relaxed">
            <Rich text={l(q.prompt)} />
          </div>
          {q.display && (
            <div className="overflow-x-auto py-2 text-center">
              <Tex tex={q.display} block />
            </div>
          )}

          <AnswerInput
            key={q.id}
            q={q}
            value={value}
            onChange={(v) => st().setAnswer(q.id, v)}
            onSubmit={() => index < total - 1 && st().go(index + 1)}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <button type="button" className="btn" disabled={index === 0} onClick={() => st().go(index - 1)}>
              <Prev size={16} />
              {t('exams.run.prev')}
            </button>
            <button type="button" className="btn btn-ghost" disabled={isBlank(q, answers[q.id])} onClick={() => st().setAnswer(q.id, null)}>
              {t('exams.run.clear')}
            </button>
            <button type="button" className="btn" disabled={index >= total - 1} onClick={() => st().go(index + 1)}>
              {t('exams.run.next')}
              <Next size={16} />
            </button>
          </div>
        </section>

        <aside className="card h-fit space-y-3" aria-label={t('exams.run.navigator')}>
          <h2 className="h-section !m-0">{t('exams.run.navigator')}</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {exam.questions.map((x, i) => {
              const done = !isBlank(x, answers[x.id]);
              const fl = flags.includes(x.id);
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => st().go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`${t('exams.run.question', { n: i + 1, t: total })}${done ? ` · ${t('exams.run.legendAnswered')}` : ''}${fl ? ` · ${t('exams.run.legendFlagged')}` : ''}`}
                  className={clsx(
                    'relative flex h-9 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors',
                    done ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface-2 text-ink-2 hover:border-ink-3',
                    i === index && 'ring-2 ring-brand ring-offset-1 ring-offset-surface',
                  )}
                >
                  {n(i + 1, 0)}
                  {fl && <span className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-warn" />}
                </button>
              );
            })}
          </div>
          <ul className="muted space-y-1 text-xs">
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-brand bg-brand-soft" />{t('exams.run.legendAnswered')} · {n(answeredIds.length, 0)}</li>
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line bg-surface-2" />{t('exams.run.legendEmpty')} · {n(unanswered, 0)}</li>
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warn" />{t('exams.run.legendFlagged')} · {n(flags.length, 0)}</li>
          </ul>
        </aside>
      </div>

      <Modal
        open={confirmSubmit}
        onClose={() => !submitting && setConfirmSubmit(false)}
        title={t('exams.run.submitTitle')}
        footer={
          <>
            <button type="button" className="btn" disabled={submitting} onClick={() => setConfirmSubmit(false)}>{t('exams.run.keepGoing')}</button>
            <button type="button" data-autofocus className="btn btn-primary" disabled={submitting} onClick={() => void submit()}>
              {submitting ? t('exams.run.submitting') : t('exams.run.submit')}
            </button>
          </>
        }
      >
        <ul className="space-y-2 text-ink-2">
          <li>{unanswered === 0 ? t('exams.run.submitAll') : t('exams.run.submitUnanswered', { n: unanswered })}</li>
          {flags.length > 0 && <li>{t('exams.run.submitFlagged', { n: flags.length })}</li>}
        </ul>
      </Modal>

      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t('exams.run.leave')}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setConfirmLeave(false)}>{t('exams.run.keepGoing')}</button>
            <button type="button" data-autofocus className="btn btn-primary" onClick={() => void leave()}>{t('exams.run.leaveYes')}</button>
          </>
        }
      >
        <p className="text-ink-2">{t('exams.run.leaveBody')}</p>
      </Modal>
    </div>
  );
}
