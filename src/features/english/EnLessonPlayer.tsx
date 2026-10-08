import { ArrowLeft, ArrowRight, PartyPopper, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LESSON_BY_ID, WORD_BY_ID } from '@/content/english';
import { lessonStars } from '@/english-engine/progress';
import type { LessonStep } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, EmptyState } from '@/components/ui';
import { EnglishText, Mixed } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';
import { ExerciseView, type ExerciseOutcome } from './ExerciseView';
import { BookA } from 'lucide-react';

export function EnLessonPlayer({ lessonId }: { lessonId: string }) {
  const { l, t, n, isRtl } = useI18n();
  const lesson = LESSON_BY_ID[lessonId];
  const back = useRouter((s) => s.back);
  const go = useRouter((s) => s.go);
  const saved = useEnglish((s) => s.lessons[lessonId]);
  const openLesson = useEnglish((s) => s.openLesson);
  const finishLesson = useEnglish((s) => s.finishLesson);
  const arabicHelp = useSettings((s) => s.settings.enArabicHelp);
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(() => (saved?.status === 'started' ? Math.min(saved.step, (lesson?.steps.length ?? 1) - 1) : 0));
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [result, setResult] = useState<{ xp: number; stars: number; added: number; firstTime: boolean } | null>(null);

  useEffect(() => {
    if (lesson) void openLesson(lessonId, step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lessonId]);

  const steps = lesson?.steps ?? [];
  const cur: LessonStep | undefined = steps[step];
  const last = step === steps.length - 1;

  const outcome = (o: ExerciseOutcome) => {
    setStats((s) => ({ correct: s.correct + (o.correct ? 1 : 0), total: s.total + 1 }));
    setStep((x) => x + 1);
  };

  const advance = async () => {
    if (!lesson) return;
    if (last) {
      const stars = lessonStars(stats.correct, Math.max(stats.total, 1));
      const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
      const r = await finishLesson(lessonId, stars, minutes);
      setResult({ ...r, stars });
      return;
    }
    setStep(step + 1);
  };

  const words = useMemo(() => (lesson?.vocab ?? []).map((id) => WORD_BY_ID[id]).filter(Boolean), [lesson]);

  if (!lesson) return <EmptyState icon={BookA} title={l({ en: 'Lesson not found', ar: 'الدرس غير موجود' })} action={<button className="btn" onClick={() => go({ name: 'en-learn' })}>{t('nav.en.learn')}</button>} />;

  if (result) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="card space-y-5 p-8 text-center">
          <PartyPopper className="mx-auto text-en" size={40} />
          <h1 className="h-page">{l({ en: 'Lesson complete!', ar: 'أحسنت! أكملت الدرس' })}</h1>
          <p className="muted">{l(lesson.title)}</p>
          <div className="flex justify-center gap-1 text-gold" aria-label={`${result.stars}/3`}>
            {[1, 2, 3].map((i) => (
              <Star key={i} size={30} fill={i <= result.stars ? 'currentColor' : 'none'} />
            ))}
          </div>
          <p className="text-sm">
            {result.firstTime ? `+${n(result.xp)} XP · ` : ''}
            {stats.total > 0 && `${n(stats.correct)}/${n(stats.total)} ${l({ en: 'correct', ar: 'صحيحة' })}`}
          </p>
          {result.added > 0 && (
            <p className="rounded-xl bg-en-soft p-3 text-sm text-en">
              {l({ en: `${result.added} new words were added to your review.`, ar: `أُضيفت ${n(result.added)} كلمات جديدة إلى مراجعتك.` })}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn" onClick={() => go({ name: 'en-learn' })}>{l({ en: 'Back to lessons', ar: 'العودة إلى الدروس' })}</button>
            <button className="btn-soft" onClick={() => go({ name: 'en-review' })}>{l({ en: 'Review words', ar: 'راجع الكلمات' })}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-3">
        <button className="icon-btn" onClick={() => back({ name: 'en-learn' })} aria-label={t('common.back')}>
          {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{l(lesson.title)}</p>
          <Bar ratio={(step + 1) / steps.length} />
        </div>
        <span className="muted num text-xs">{n(step + 1)}/{n(steps.length)}</span>
      </div>

      <div className="card space-y-4 p-6" key={step}>
        {cur?.type === 'explain' && (
          <>
            <h2 className="h-section">{l(cur.title)}</h2>
            {cur.body.map((b, i) => (
              <p key={i} className="leading-8"><Mixed text={l(b)} /></p>
            ))}
          </>
        )}

        {cur?.type === 'examples' && (
          <>
            <h2 className="h-section">{l(cur.title)}</h2>
            <ul className="space-y-3">
              {cur.items.map((it, i) => (
                <li key={i} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2">
                    <EnglishText className="flex-1 text-lg font-semibold">{it.en}</EnglishText>
                    <SpeakButton text={it.en} size="sm" />
                  </div>
                  {arabicHelp !== false && <p className="muted mt-1 text-sm">{it.ar}</p>}
                  {it.breakdown && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {it.breakdown.map(([en, ar], j) => (
                        <span key={j} className="chip">
                          <EnglishText>{en}</EnglishText> <span className="muted">{ar}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {cur?.type === 'pronounce' && (
          <>
            <h2 className="h-section">{l(cur.title)}</h2>
            <p className="muted text-sm">{l({ en: 'Listen, then say it out loud. Use the turtle for slow speech.', ar: 'استمع ثم انطقها بصوت عالٍ. استخدم السلحفاة للنطق البطيء.' })}</p>
            <ul className="space-y-2">
              {cur.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <EnglishText block className="font-semibold">{it.en}</EnglishText>
                    <span className="muted text-sm">{it.ar}</span>
                  </div>
                  <SpeakButton text={it.en} />
                </li>
              ))}
            </ul>
          </>
        )}

        {cur?.type === 'vocab' && (
          <>
            <h2 className="h-section">{l(cur.title)}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {cur.ids.map((id) => {
                const w = WORD_BY_ID[id];
                if (!w) return null;
                return (
                  <li key={id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center gap-2">
                      <EnglishText className="flex-1 text-lg font-bold">{w.en}</EnglishText>
                      <SpeakButton text={w.en} size="sm" slow={false} />
                    </div>
                    <p className="text-sm">{w.ar}</p>
                    <EnglishText block className="muted mt-1 text-xs">{w.exEn}</EnglishText>
                  </li>
                );
              })}
            </ul>
            <p className="muted text-xs">{l({ en: 'These words are added to your review when you finish the lesson.', ar: 'تُضاف هذه الكلمات إلى مراجعتك عند إنهاء الدرس.' })}</p>
          </>
        )}

        {cur?.type === 'tryit' && (
          <>
            <h2 className="h-section">{l({ en: 'Try it', ar: 'جرّب' })}</h2>
            <ExerciseView key={cur.exercise.id} exercise={cur.exercise} onDone={outcome} nextLabel={t('common.next')} />
          </>
        )}

        {cur?.type === 'practice' && <PracticeStep step={cur} onOutcome={(c) => setStats((s) => ({ correct: s.correct + (c ? 1 : 0), total: s.total + 1 }))} onFinished={() => setStep((x) => x + 1)} />}

        {cur?.type === 'summary' && (
          <>
            <h2 className="h-section">{l({ en: 'Summary', ar: 'الخلاصة' })}</h2>
            <ul className="list-disc space-y-2 ps-5">
              {cur.points.map((p, i) => (
                <li key={i} className="leading-7"><Mixed text={l(p)} /></li>
              ))}
            </ul>
            {words.length > 0 && (
              <p className="muted text-xs">
                {l({ en: `${words.length} words from this lesson will join your review.`, ar: `ستنضم ${n(words.length)} كلمات من هذا الدرس إلى مراجعتك.` })}
              </p>
            )}
          </>
        )}
      </div>

      {cur?.type !== 'practice' && cur?.type !== 'tryit' && (
        <div className="flex justify-between">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            {t('common.back')}
          </button>
          <button className="btn" onClick={advance}>
            {last ? l({ en: 'Finish lesson', ar: 'إنهاء الدرس' }) : t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}

function PracticeStep({ step, onOutcome, onFinished }: { step: Extract<LessonStep, { type: 'practice' }>; onOutcome: (correct: boolean) => void; onFinished: () => void }) {
  const { l, n } = useI18n();
  const [i, setI] = useState(0);
  const total = step.exercises.length;
  const ex = step.exercises[i];
  if (!ex) return null;
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="h-section">{l(step.title)}</h2>
        <span className="muted num text-xs">{n(i + 1)}/{n(total)}</span>
      </div>
      <ExerciseView
        key={ex.id}
        exercise={ex}
        nextLabel={i + 1 < total ? undefined : l({ en: 'Done', ar: 'تم' })}
        onDone={(o) => {
          onOutcome(o.correct);
          if (i + 1 < total) setI(i + 1);
          else onFinished();
        }}
      />
    </>
  );
}
