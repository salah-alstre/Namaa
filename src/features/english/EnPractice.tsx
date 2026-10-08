import { Dumbbell, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { ALL_EXERCISES } from '@/content/english';
import { SKILL_ORDER } from '@/english-engine/progress';
import type { EnSkill, Exercise } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useRouter } from '@/stores/router';
import { Bar, EmptyState, PageHeader } from '@/components/ui';
import { ExerciseView } from './ExerciseView';

const SKILL_LABEL: Record<EnSkill, { en: string; ar: string }> = {
  vocab: { en: 'Vocabulary', ar: 'المفردات' },
  grammar: { en: 'Grammar', ar: 'القواعد' },
  listening: { en: 'Listening', ar: 'الاستماع' },
  reading: { en: 'Reading', ar: 'القراءة' },
  writing: { en: 'Writing', ar: 'الكتابة' },
};

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Runs a fixed list of exercises one after another and shows a small summary. */
export function ExerciseRun({ exercises, onExit, exitLabel }: { exercises: Exercise[]; onExit: () => void; exitLabel: string }) {
  const { l, n } = useI18n();
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const ex = exercises[i];
  if (!ex) {
    return (
      <div className="card space-y-4 p-8 text-center">
        <PartyPopper className="mx-auto text-en" size={36} />
        <h2 className="h-section">{l({ en: 'Set complete', ar: 'اكتملت المجموعة' })}</h2>
        <p className="muted">{l({ en: `${correct} of ${exercises.length} correct.`, ar: `${n(correct)} من ${n(exercises.length)} صحيحة.` })}</p>
        <button className="btn" onClick={onExit}>{exitLabel}</button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bar ratio={i / exercises.length} />
        <span className="muted num text-xs">{n(i + 1)}/{n(exercises.length)}</span>
      </div>
      <div className="card p-6">
        <ExerciseView key={ex.id + i} exercise={ex} onDone={(o) => { if (o.correct) setCorrect((c) => c + 1); setI((x) => x + 1); }} />
      </div>
    </div>
  );
}

export function EnPractice({ skill, pattern }: { skill?: string; pattern?: string }) {
  const { l, t } = useI18n();
  const go = useRouter((s) => s.go);
  const [run, setRun] = useState<Exercise[] | null>(null);

  const start = (pool: Exercise[]) => setRun(shuffled(pool).slice(0, 10));

  if (run) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-6">
        <ExerciseRun exercises={run} onExit={() => setRun(null)} exitLabel={l({ en: 'Back to practice', ar: 'العودة إلى التمارين' })} />
      </div>
    );
  }

  const byPattern = pattern ? ALL_EXERCISES.filter((e) => e.pattern === pattern) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader title={t('nav.en.practice')} subtitle={l({ en: 'Ten exercises at a time. Pick a skill or mix everything.', ar: 'عشرة تمارين في كل مرة. اختر مهارة أو اخلط كل شيء.' })} />
      {pattern && byPattern.length > 0 && (
        <button className="card flex w-full cursor-pointer items-center gap-3 border-en bg-en-soft p-5 text-start" onClick={() => start(byPattern)}>
          <Dumbbell className="text-en" />
          <span className="font-semibold">{l({ en: `Practise this grammar topic (${byPattern.length} exercises)`, ar: 'تدرّب على هذا الموضوع' })}</span>
        </button>
      )}
      <button className="card flex w-full cursor-pointer items-center gap-3 p-5 text-start transition-colors hover:bg-surface-2" onClick={() => start(ALL_EXERCISES)}>
        <Dumbbell className="text-en" />
        <span className="font-semibold">{l({ en: 'Mixed practice', ar: 'تدريب متنوع' })}</span>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {SKILL_ORDER.map((s) => {
          const pool = ALL_EXERCISES.filter((e) => e.skill === s);
          if (pool.length === 0) return null;
          return (
            <button key={s} className={`card cursor-pointer p-4 text-start transition-colors hover:bg-surface-2 ${skill === s ? 'border-en' : ''}`} onClick={() => start(pool)}>
              <span className="block font-semibold">{l(SKILL_LABEL[s])}</span>
              <span className="muted text-sm">{l({ en: `${pool.length} exercises`, ar: `${pool.length} تمرينًا` })}</span>
            </button>
          );
        })}
      </div>
      {ALL_EXERCISES.length === 0 && <EmptyState icon={Dumbbell} title={l({ en: 'No exercises', ar: 'لا توجد تمارين' })} />}
      <button className="btn-ghost btn-sm" onClick={() => go({ name: 'en-mistakes' })}>{t('nav.en.mistakes')}</button>
    </div>
  );
}
