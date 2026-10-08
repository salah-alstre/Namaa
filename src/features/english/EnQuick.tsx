import { PartyPopper, Zap } from 'lucide-react';
import { useState } from 'react';
import { ALL_EXERCISES, ALL_LESSONS, EXERCISE_BY_ID, lessonExercises } from '@/content/english';
import { buildQuickSession, estimateMinutes, type SessionItem } from '@/english-engine/session';
import type { SrsGrade } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { Bar, EmptyState } from '@/components/ui';
import { ExerciseView } from './ExerciseView';
import { WordCard, useIntervalLabel } from './EnReview';

/** Quick English: a fixed 5-10 minute mix of due words, past mistakes and the next lesson's exercises. */
export function EnQuick() {
  const { l, n } = useI18n();
  const go = useRouter((s) => s.go);
  const label = useIntervalLabel();
  const vocab = useEnglish((s) => s.vocab);
  const reviewWord = useEnglish((s) => s.reviewWord);
  const [items] = useState<SessionItem[]>(() => {
    const st = useEnglish.getState();
    const next = ALL_LESSONS.find((x) => st.lessons[x.id]?.status !== 'completed') ?? ALL_LESSONS[0];
    return buildQuickSession({
      dueWordIds: st.dueWords().map((w) => w.wordId),
      mistakes: st.openMistakes().flatMap((m) => (EXERCISE_BY_ID[m.exerciseId] ? [EXERCISE_BY_ID[m.exerciseId]!] : [])),
      nextLesson: next ? lessonExercises(next) : [],
      filler: ALL_EXERCISES,
    });
  });
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[i];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <EmptyState icon={Zap} title={l({ en: 'Nothing to do yet', ar: 'لا شيء لفعله بعد' })} action={<button className="btn" onClick={() => go({ name: 'en-learn' })}>{l({ en: 'Start a lesson', ar: 'ابدأ درسًا' })}</button>} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="card space-y-4 p-8 text-center">
          <PartyPopper className="mx-auto text-en" size={40} />
          <h1 className="h-page">{l({ en: 'Quick English done!', ar: 'أنهيت الإنجليزية السريعة!' })}</h1>
          <p className="muted">{l({ en: `${correct} correct out of ${items.filter((x) => x.type === 'exercise').length} exercises.`, ar: `${n(correct)} صحيحة من ${n(items.filter((x) => x.type === 'exercise').length)} تمرينًا.` })}</p>
          <div className="flex justify-center gap-2">
            <button className="btn" onClick={() => go({ name: 'en-home' })}>{l({ en: 'English home', ar: 'الرئيسية' })}</button>
            <button className="btn-soft" onClick={() => go({ name: 'en-learn' })}>{l({ en: 'Continue a lesson', ar: 'تابع درسًا' })}</button>
          </div>
        </div>
      </div>
    );
  }

  const grade = async (g: SrsGrade) => {
    if (item.type === 'word') await reviewWord(item.wordId, g);
    setI((x) => x + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-3">
        <Zap size={20} className="text-en" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{l({ en: 'Quick English', ar: 'إنجليزية سريعة' })} · {l({ en: `about ${estimateMinutes(items.length)} min`, ar: `نحو ${n(estimateMinutes(items.length))} دقائق` })}</p>
          <Bar ratio={i / items.length} />
        </div>
        <span className="muted num text-xs">{n(i + 1)}/{n(items.length)}</span>
      </div>
      {item.type === 'word' ? (
        <WordCard key={`w${i}`} wordId={item.wordId} onGrade={grade} intervalFor={(g) => (vocab[item.wordId] ? label(vocab[item.wordId]!, g) : '')} />
      ) : (
        <div className="card p-6">
          <ExerciseView key={`e${i}`} exercise={item.exercise} onDone={(o) => { if (o.correct) setCorrect((c) => c + 1); setI((x) => x + 1); }} />
        </div>
      )}
    </div>
  );
}
