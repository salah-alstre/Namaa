import clsx from 'clsx';
import { BookOpen, Check, ChevronDown, ChevronUp, Clock, Flag, ListChecks, Target, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Rich, Steps, Tex } from '@/components/Math';
import { EmptyState, PageHeader, Segmented } from '@/components/ui';
import { LESSON_BY_TOPIC } from '@/content/lessons';
import { TOPIC_BY_ID } from '@/content/topics';
import { saveMistakeManually } from '@/database/repos/attempts';
import { loadExam } from '@/database/repos/exams';
import { startPractice } from '@/features/practice/quick';
import { answerText, isBlank } from '@/features/shared/answers';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { checkAnswer, userKey } from '@/math-engine/validate';
import { useExam } from '@/stores/exam';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';
import type { ExamRow, Verdict } from '@/types';
import { LETTER_COLOR, letterFor } from './grade';

type Filter = 'all' | 'wrong' | 'flagged';

interface TopicTally {
  topicId: string;
  correct: number;
  total: number;
}

/** Everything about a finished exam: the grade, where the learner is strong or weak, and every question reviewed. */
export function ExamResult({ examId }: { examId: number }) {
  const i18n = useI18n();
  const { t, l, n, pct, clock } = i18n;
  const go = useRouter((s) => s.go);

  const live = useExam((s) => s.grade);
  const liveExam = useExam((s) => s.exam);

  const [exam, setExam] = useState<ExamRow | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'unfinished'>('loading');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const row = await loadExam(examId);
        if (!alive) return;
        if (!row) return setState('missing');
        if (row.status !== 'finished') return setState('unfinished');
        setExam(row);
        setState('ok');
      } catch (e) {
        logEvent('error', `exam result load failed: ${String(e)}`);
        if (alive) setState('missing');
      }
    })();
    return () => {
      alive = false;
    };
  }, [examId]);

  // XP is only known right after handing in; a result opened from history does not claim to know it.
  useEffect(() => {
    if (live && liveExam && liveExam.id === examId) setXp(live.xp);
  }, [live, liveExam, examId]);

  // Leaving the result clears the in-memory exam so the next one starts clean.
  useEffect(
    () => () => {
      const s = useExam.getState();
      if (s.exam && s.grade) s.leave();
    },
    [],
  );

  const verdicts = useMemo<Record<string, Verdict>>(() => {
    if (!exam) return {};
    const out: Record<string, Verdict> = {};
    for (const q of exam.questions) {
      out[q.id] = live && liveExam?.id === examId && live.verdicts[q.id] ? live.verdicts[q.id] : checkAnswer(q, isBlank(q, exam.answers[q.id]) ? null : exam.answers[q.id]);
    }
    return out;
  }, [exam, live, liveExam, examId]);

  const stats = useMemo(() => {
    if (!exam) return null;
    const total = exam.questions.length;
    let correct = 0;
    let unanswered = 0;
    let timeMs = 0;
    const byTopic = new Map<string, TopicTally>();
    for (const q of exam.questions) {
      const ok = verdicts[q.id]?.correct === true;
      if (ok) correct++;
      if (isBlank(q, exam.answers[q.id])) unanswered++;
      timeMs += exam.times[q.id] ?? 0;
      const row = byTopic.get(q.topicId) ?? { topicId: q.topicId, correct: 0, total: 0 };
      row.total++;
      if (ok) row.correct++;
      byTopic.set(q.topicId, row);
    }
    const topics = [...byTopic.values()].sort((a, b) => b.correct / b.total - a.correct / a.total || b.total - a.total);
    const strong = topics.filter((x) => x.correct / x.total >= 0.8);
    const weak = topics.filter((x) => x.correct / x.total < 0.6).reverse();
    return { total, correct, unanswered, timeMs, topics, strong, weak };
  }, [exam, verdicts]);

  if (state === 'loading') return <div className="muted p-8 text-center">{t('common.loading')}</div>;
  if (state !== 'ok' || !exam || !stats) {
    return (
      <EmptyState
        icon={Flag}
        title={t(state === 'unfinished' ? 'exams.res.notFinished' : 'exams.res.notFound')}
        action={<button type="button" className="btn btn-primary" onClick={() => go({ name: 'exams' })}>{t('exams.res.toExams')}</button>}
      />
    );
  }

  const ratio = stats.total ? stats.correct / stats.total : 0;
  const letter = letterFor(ratio);
  const wrongCount = stats.total - stats.correct - stats.unanswered;
  const avgS = stats.total ? stats.timeMs / stats.total / 1000 : 0;
  const nextKey = ratio >= 1 ? 'exams.res.nextPerfect' : ratio >= 0.8 ? 'exams.res.nextGood' : ratio >= 0.5 ? 'exams.res.nextOk' : 'exams.res.nextLow';
  const weakIds = stats.weak.map((x) => x.topicId);
  const timedOut = exam.timeLimitS !== null && exam.elapsedS >= exam.timeLimitS;

  const shown = exam.questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => (filter === 'wrong' ? verdicts[q.id]?.correct !== true : filter === 'flagged' ? exam.flags.includes(q.id) : true));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const saveMistake = async (qid: string) => {
    const q = exam.questions.find((x) => x.id === qid);
    if (!q) return;
    try {
      const submitted = exam.answers[qid];
      await saveMistakeManually(q, userKey(submitted ?? null) ?? '', verdicts[qid]?.patternId ?? null);
      setSaved((prev) => new Set(prev).add(qid));
    } catch (e) {
      logEvent('error', `save mistake failed: ${String(e)}`);
      toast({ kind: 'error', title: t('error.saveFailed') });
    }
  };

  const practiceWeak = () =>
    startPractice({ mode: 'normal', topicIds: weakIds, difficulty: 'adaptive', count: 10, timeLimitS: null });

  const topicName = (id: string) => (TOPIC_BY_ID[id] ? l(TOPIC_BY_ID[id].title) : id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('exams.res.title')}
        subtitle={exam.title}
        actions={<button type="button" className="btn" onClick={() => go({ name: 'exams' })}>{t('exams.res.toExams')}</button>}
      />
      {timedOut && <p className="card-flat text-sm text-warn">{t('exams.res.autoSubmitted')}</p>}

      <section className="card grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div
          className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 anim-pop"
          style={{ borderColor: LETTER_COLOR[letter], color: LETTER_COLOR[letter] }}
          role="img"
          aria-label={`${t('exams.res.grade')}: ${t(`exams.grade.${letter}` as never)}`}
        >
          <span className="text-4xl font-bold leading-none">{letter}</span>
          <span className="mt-1 text-xs font-medium">{pct(ratio)}</span>
        </div>
        <div className="space-y-4">
          <p className="text-lg font-semibold">{t(`exams.grade.${letter}` as never)}</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label={t('exams.res.score')} value={`${n(stats.correct, 0)} / ${n(stats.total, 0)}`} />
            <Metric label={t('exams.res.percent')} value={pct(ratio)} />
            <Metric label={t('exams.res.correct')} value={n(stats.correct, 0)} tone="good" />
            <Metric label={t('exams.res.incorrect')} value={n(wrongCount, 0)} tone="bad" />
            <Metric label={t('exams.res.unanswered')} value={n(stats.unanswered, 0)} />
            {xp !== null && <Metric label={t('exams.res.xp')} value={`+${n(xp, 0)}`} tone="gold" />}
          </dl>
          <p className="muted flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5"><Clock size={14} />{t('exams.res.totalTime')}: <b className="num text-ink">{clock(exam.elapsedS)}</b></span>
            <span className="inline-flex items-center gap-1.5"><Target size={14} />{t('exams.res.avgTime')}: <b className="num text-ink">{clock(Math.round(avgS))}</b></span>
          </p>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="h-section !m-0">{t('exams.res.next')}</h2>
        <p className="text-ink-2">{t(nextKey)}</p>
        <div className="flex flex-wrap gap-2">
          {weakIds.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => void practiceWeak()}>
              <Target size={16} />
              {t('exams.res.practiceWeak')}
            </button>
          )}
          <button type="button" className="btn" onClick={() => go({ name: 'exams' })}>{t('exams.res.newExam')}</button>
        </div>
        {weakIds.some((id) => LESSON_BY_TOPIC[id]) && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {weakIds.filter((id) => LESSON_BY_TOPIC[id]).slice(0, 4).map((id) => (
              <li key={id}>
                <button type="button" className="chip hover:border-brand" onClick={() => go({ name: 'lesson', lessonId: LESSON_BY_TOPIC[id].id })}>
                  <BookOpen size={13} />
                  {t('exams.res.reviewLesson')}: {topicName(id)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="h-section !m-0">{t('exams.res.byTopic')}</h2>
          <ul className="space-y-3">
            {stats.topics.map((x) => (
              <li key={x.topicId} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{topicName(x.topicId)}</span>
                  <span className="num muted shrink-0">{n(x.correct, 0)}/{n(x.total, 0)}</span>
                </div>
                <div className="progress"><span style={{ width: `${(x.correct / x.total) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card space-y-4">
          <TopicList title={t('exams.res.strong')} items={stats.strong} name={topicName} tone="good" />
          <TopicList title={t('exams.res.weak')} items={stats.weak} name={topicName} tone="warn" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="h-section !m-0 inline-flex items-center gap-2"><ListChecks size={18} />{t('exams.res.review')}</h2>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            label={t('exams.res.review')}
            options={[
              { value: 'all', label: t('exams.res.filterAll') },
              { value: 'wrong', label: t('exams.res.filterWrong') },
              { value: 'flagged', label: t('exams.res.filterFlagged') },
            ]}
          />
        </div>
        {shown.length === 0 && <p className="muted card-flat text-center">{t('common.nothingYet')}</p>}
        <ul className="space-y-3">
          {shown.map(({ q, i }) => {
            const ok = verdicts[q.id]?.correct === true;
            const submitted = exam.answers[q.id];
            const expanded = open.has(q.id);
            return (
              <li key={q.id} className="card space-y-3">
                <div className="flex items-start gap-3">
                  <span
                    className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', ok ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad')}
                    aria-label={t(ok ? 'common.correct' : 'common.incorrect')}
                  >
                    {ok ? <Check size={16} /> : <X size={16} />}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="muted flex flex-wrap items-center gap-2 text-xs">
                      <span className="num">{n(i + 1, 0)}</span>
                      <span>·</span>
                      <span>{topicName(q.topicId)}</span>
                      {exam.flags.includes(q.id) && <Flag size={12} className="text-warn" />}
                    </p>
                    <div><Rich text={l(q.prompt)} /></div>
                    {q.display && <div className="overflow-x-auto"><Tex tex={q.display} block /></div>}
                    <dl className="grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
                      <dt className="muted">{t('exams.res.yourAnswer')}</dt>
                      <dd className={clsx('font-medium', !ok && 'text-bad')}><Rich text={answerText(q, submitted, i18n)} /></dd>
                      {!ok && (
                        <>
                          <dt className="muted">{t('exams.res.correctAnswer')}</dt>
                          <dd className="font-medium text-good"><Rich text={l(q.correctText)} /></dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ps-10">
                  <button type="button" className="btn btn-sm" aria-expanded={expanded} onClick={() => toggle(q.id)}>
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {t(expanded ? 'exams.res.hideSteps' : 'exams.res.showSteps')}
                  </button>
                  {!ok && (
                    <button type="button" className="btn btn-sm" disabled={saved.has(q.id)} onClick={() => void saveMistake(q.id)}>
                      {saved.has(q.id) ? <Check size={14} /> : null}
                      {t(saved.has(q.id) ? 'exams.res.saved' : 'exams.res.saveMistake')}
                    </button>
                  )}
                </div>
                {expanded && (
                  <div className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm anim-fade ms-10">
                    <Steps items={q.steps.map(l)} />
                    <p className="text-ink-2"><Rich text={l(q.explanation)} /></p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'gold' }) {
  return (
    <div>
      <dt className="muted text-xs">{label}</dt>
      <dd className={clsx('num text-lg font-semibold', tone === 'good' && 'text-good', tone === 'bad' && 'text-bad', tone === 'gold' && 'text-gold')}>{value}</dd>
    </div>
  );
}

function TopicList({ title, items, name, tone }: { title: string; items: TopicTally[]; name: (id: string) => string; tone: 'good' | 'warn' }) {
  const { n } = useI18n();
  return (
    <div className="space-y-2">
      <h3 className="label">{title}</h3>
      {items.length === 0 ? (
        <p className="muted text-sm">—</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((x) => (
            <li key={x.topicId} className={clsx('chip', tone === 'good' ? '!bg-good-soft !text-good' : '!bg-warn-soft !text-warn')}>
              {name(x.topicId)} · <span className="num">{n(x.correct, 0)}/{n(x.total, 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
