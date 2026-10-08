import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rich } from '@/components/Math';
import { Modal } from '@/components/Modal';
import { QuestionPanel } from '@/components/QuestionPanel';
import { EmptyState } from '@/components/ui';
import { Visual } from '@/components/visuals/Visual';
import { LESSON_BY_ID, LESSONS } from '@/content/lessons';
import { touchLesson } from '@/database/repos/progress';
import { difficultyLevel, startingDifficulty } from '@/domain/adaptive';
import { judgeAndRecord } from '@/features/shared/judge';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { playCue } from '@/lib/sound';
import { getGenerator, makeQuestion, nearestLevel } from '@/math-engine/generators';
import { createRng, randomSeed } from '@/math-engine/rng';
import { usePlayer } from '@/stores/player';
import { useProfile } from '@/stores/profile';
import { useRouter } from '@/stores/router';
import type { Difficulty, Lesson, Question } from '@/types';

const STEPS = ['explain', 'visual', 'steps', 'why', 'try', 'check'] as const;
type StepName = (typeof STEPS)[number];
const RESULT = STEPS.length;
const MAX_CHECK = 4;

function starsFor(correct: number, total: number): number {
  if (total === 0) return 1;
  const r = correct / total;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}

function build(genId: string, d: Difficulty): Question | null {
  const g = getGenerator(genId);
  if (!g) return null;
  try {
    return makeQuestion(g, nearestLevel(g, d), createRng(randomSeed()));
  } catch (e) {
    logEvent('error', `lesson question failed (${genId}): ${String(e)}`);
    return null;
  }
}

/** Six-step lesson: explanation, visual example, step by step, why, try it yourself, quick check. */
export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { t } = useI18n();
  const go = useRouter((s) => s.go);
  const lesson = LESSON_BY_ID[lessonId];
  const open = usePlayer((s) => s.openLessons.has(lessonId));

  if (!lesson) {
    return <EmptyState icon={Lightbulb} title={t('lesson.notFound')} action={<button className="btn btn-primary" onClick={() => go({ name: 'learn' })}>{t('lesson.toPath')}</button>} />;
  }
  if (!open) {
    return <EmptyState icon={Lightbulb} title={t('lesson.locked')} action={<button className="btn btn-primary" onClick={() => go({ name: 'learn' })}>{t('lesson.toPath')}</button>} />;
  }
  return <Player key={lessonId} lesson={lesson} />;
}

function Player({ lesson }: { lesson: Lesson }) {
  const { t, l, n } = useI18n();
  const router = useRouter();
  const player = usePlayer();
  const comfort = useProfile((s) => s.profile?.comfortLevel ?? 'some');
  const wasDone = player.doneLessons.has(lesson.id);

  const startStep = useMemo(() => {
    const p = player.lessons[lesson.id];
    return p && p.status === 'started' ? Math.min(Math.max(p.step, 0), STEPS.length - 1) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const [step, setStep] = useState(startStep);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const startedAt = useRef(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  // Questions are built from the learner's current difficulty for the topic, capped at 3 for lessons.
  const difficulty = useMemo<Difficulty>(() => {
    const d = player.topics[lesson.topicId]?.difficulty ?? startingDifficulty(comfort);
    return Math.min(3, difficultyLevel(d)) as Difficulty;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.topicId]);

  // Try it yourself
  const [tryQ, setTryQ] = useState<Question | null>(() => build(lesson.tryGenerator, difficulty));
  const [tryDone, setTryDone] = useState(false);

  // Quick check
  const [round, setRound] = useState(0);
  const checkQs = useMemo(() => {
    const ids = Array.from(new Set(lesson.checkGenerators)).slice(0, MAX_CHECK);
    const qs = ids.map((id) => build(id, difficulty)).filter((q): q is Question => q !== null);
    if (qs.length < 2) {
      const extra = build(lesson.tryGenerator, difficulty);
      if (extra) qs.push(extra);
    }
    return qs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, round]);
  const [checkIdx, setCheckIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [checkStarted, setCheckStarted] = useState(false);
  const [reward, setReward] = useState<{ xp: number; firstTime: boolean; stars: number } | null>(null);

  const finished = step === RESULT;
  const name: StepName | null = finished ? null : STEPS[step];

  useEffect(() => {
    if (!finished) void touchLesson(lesson.id, step).catch((e) => logEvent('error', `touchLesson: ${String(e)}`));
    topRef.current?.scrollIntoView({ block: 'nearest' });
  }, [step, finished, lesson.id]);

  const nextLesson = useMemo(() => {
    const i = LESSONS.findIndex((x) => x.id === lesson.id);
    const cand = LESSONS[i + 1];
    return cand && player.openLessons.has(cand.id) ? cand : null;
  }, [lesson.id, player.openLessons]);

  const exit = useCallback(() => router.back({ name: 'learn' }), [router]);
  const requestExit = () => (name === 'check' && checkStarted && results.length > 0 ? setLeaveOpen(true) : exit());

  const finishCheck = async (all: boolean[]) => {
    const correct = all.filter(Boolean).length;
    const stars = starsFor(correct, all.length);
    const minutes = (Date.now() - startedAt.current) / 60000;
    const out = await usePlayer.getState().finishLesson(lesson.id, stars, minutes);
    playCue('finish');
    setReward({ ...out, stars });
    setStep(RESULT);
  };

  const restartCheck = () => {
    setRound((r) => r + 1);
    setCheckIdx(0);
    setResults([]);
    setCheckStarted(false);
    setReward(null);
    setStep(STEPS.indexOf('check'));
  };

  const progressPct = ((finished ? STEPS.length : step) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-5" ref={topRef}>
      <div className="flex items-center gap-3">
        <button className="icon-btn" onClick={requestExit} aria-label={t('lesson.toPath')} title={t('lesson.toPath')}>
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="h-page !mb-0 truncate">{l(lesson.title)}</h1>
          <p className="muted truncate text-sm">
            {finished ? t('lesson.result.title') : `${t('lesson.step', { n: step + 1, total: STEPS.length })} · ${t(`lesson.step.${name}` as never)}`}
          </p>
        </div>
        {wasDone && <span className="chip !bg-good-soft !text-good"><Check size={14} /> {t('learn.done')}</span>}
      </div>

      <div className="progress" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={clsx('chip', i === step && !finished && '!bg-brand-soft !text-brand', (i < step || finished) && '!bg-good-soft !text-good')}>
            {i < step || finished ? <Check size={12} /> : null}
            {t(`lesson.step.${s}` as never)}
          </span>
        ))}
      </div>

      {name === 'explain' && (
        <div className="card anim-fade space-y-3">
          {lesson.explanation.map((para, i) => (
            <p key={i} className="leading-relaxed">
              <Rich text={l(para)} />
            </p>
          ))}
        </div>
      )}

      {name === 'visual' && (
        <div className="card anim-fade space-y-4">
          <div className="rounded-xl bg-surface-2 p-4">
            <Visual spec={lesson.visual} />
            {lesson.visualCaption && <p className="muted mt-3 text-center text-sm"><Rich text={l(lesson.visualCaption)} /></p>}
          </div>
          <div>
            <div className="label">{t('lesson.problem')}</div>
            <p className="text-lg"><Rich text={l(lesson.example.problem)} /></p>
          </div>
        </div>
      )}

      {name === 'steps' && (
        <div className="card anim-fade space-y-4">
          <div>
            <div className="label">{t('lesson.problem')}</div>
            <p className="text-lg"><Rich text={l(lesson.example.problem)} /></p>
          </div>
          <ol className="space-y-2">
            {lesson.example.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{n(i + 1)}</span>
                <span className="min-w-0 flex-1 leading-relaxed"><Rich text={l(s)} /></span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-good-soft p-3 text-good">
            <div className="label !text-good">{t('lesson.result')}</div>
            <Rich text={l(lesson.example.result)} />
          </div>
        </div>
      )}

      {name === 'why' && (
        <div className="card anim-fade flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold"><Lightbulb size={20} /></span>
          <p className="min-w-0 flex-1 leading-relaxed"><Rich text={l(lesson.why)} /></p>
        </div>
      )}

      {name === 'try' && (
        <div className="space-y-3 anim-fade">
          <p className="muted text-sm">{t('lesson.tryIntro')}</p>
          {tryQ ? (
            <QuestionPanel
              key={tryQ.id}
              q={tryQ}
              nextLabel={t('lesson.tryAnother')}
              onSubmit={(a, h, ms) => judgeAndRecord(tryQ, a, h, ms, { awardXp: false })}
              onJudged={() => setTryDone(true)}
              onNext={() => {
                setTryDone(false);
                setTryQ(build(lesson.tryGenerator, difficulty));
              }}
              onSimilar={() => {
                setTryDone(false);
                setTryQ(build(lesson.tryGenerator, difficulty));
              }}
            />
          ) : (
            <p className="card muted">{t('error.generic')}</p>
          )}
          {tryDone && (
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={() => setStep(STEPS.indexOf('check'))}>
                {t('lesson.tryContinue')} <ArrowRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {name === 'check' && !checkStarted && (
        <div className="card anim-fade space-y-3 text-center">
          <p>{t('lesson.checkIntro', { n: checkQs.length })}</p>
          <button className="btn btn-primary btn-lg mx-auto" disabled={checkQs.length === 0} onClick={() => setCheckStarted(true)}>
            {t('lesson.checkStart')}
          </button>
        </div>
      )}

      {name === 'check' && checkStarted && checkQs[checkIdx] && (
        <div className="space-y-3 anim-fade">
          <div className="flex items-center justify-between text-sm">
            <span className="chip">{t('lesson.checkProgress', { n: checkIdx + 1, total: checkQs.length })}</span>
          </div>
          <QuestionPanel
            key={`${round}-${checkQs[checkIdx].id}`}
            q={checkQs[checkIdx]}
            hideSave
            nextLabel={checkIdx + 1 >= checkQs.length ? t('lesson.checkFinish') : t('lesson.checkNext')}
            onSubmit={(a, h, ms) => judgeAndRecord(checkQs[checkIdx], a, h, ms, { awardXp: true })}
            onJudged={(o) => setResults((r) => (r.length > checkIdx ? r : [...r, o.verdict.correct]))}
            onNext={() => {
              if (checkIdx + 1 >= checkQs.length) void finishCheck(results);
              else setCheckIdx((i) => i + 1);
            }}
          />
        </div>
      )}

      {finished && reward && (
        <div className="card anim-pop space-y-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-good-soft text-good"><Check size={28} /></div>
          <h2 className="h-section !mb-0">{t('lesson.result.title')}</h2>
          <div className="flex justify-center gap-1" aria-label={t('learn.stars', { n: reward.stars })}>
            {[1, 2, 3].map((i) => (
              <Star key={i} size={30} className={i <= reward.stars ? 'fill-gold text-gold' : 'text-line'} />
            ))}
          </div>
          <p className="num text-lg">{t('lesson.result.score', { c: results.filter(Boolean).length, t: results.length })}</p>
          {reward.firstTime ? <p className="chip mx-auto !bg-gold-soft !text-gold">{t('lesson.result.xp', { n: reward.xp })}</p> : <p className="muted text-sm">{t('lesson.result.replay')}</p>}
          <p className="muted">{t(reward.stars === 3 ? 'lesson.result.good' : reward.stars === 2 ? 'lesson.result.ok' : 'lesson.result.low')}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {nextLesson && (
              <button className="btn btn-primary" onClick={() => router.replace({ name: 'lesson', lessonId: nextLesson.id })}>
                {t('lesson.nextLesson')} <ArrowRight size={16} className="rtl:rotate-180" />
              </button>
            )}
            <button className="btn btn-soft" onClick={() => router.go({ name: 'practice' })}>{t('lesson.practice')}</button>
            <button className="btn btn-ghost" onClick={restartCheck}><RotateCcw size={16} /> {t('lesson.retry')}</button>
            <button className="btn btn-ghost" onClick={() => router.go({ name: 'learn' })}>{t('lesson.toPath')}</button>
          </div>
        </div>
      )}

      {!finished && name !== 'check' && name !== 'try' && (
        <div className="flex justify-between gap-2">
          <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('lesson.back')}
          </button>
          <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            {t('lesson.next')} <ArrowRight size={16} className="rtl:rotate-180" />
          </button>
        </div>
      )}
      {name === 'try' && (
        <div className="flex">
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('lesson.back')}
          </button>
        </div>
      )}

      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('lesson.leave')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setLeaveOpen(false)}>{t('lesson.stay')}</button>
            <button className="btn btn-primary" onClick={exit}>{t('lesson.leaveYes')}</button>
          </>
        }
      >
        <p className="muted">{t('lesson.leaveBody')}</p>
      </Modal>
    </div>
  );
}
