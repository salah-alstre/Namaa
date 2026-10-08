import { Compass } from 'lucide-react';
import { useRef, useState } from 'react';
import { QuestionPanel } from '@/components/QuestionPanel';
import { Bar, PageHeader } from '@/components/ui';
import { topicsOfLevel } from '@/content/topics';
import { seedTopicDifficulty } from '@/database/repos/progress';
import { judgeAndRecord } from '@/features/shared/judge';
import { useI18n } from '@/i18n';
import { buildPlacementTest, levelStartDifficulty, scorePlacement, type PlacementResult } from '@/domain/placement';
import { logEvent } from '@/lib/log';
import { usePlayer } from '@/stores/player';
import { useProfile } from '@/stores/profile';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { toast } from '@/stores/toast';
import type { Question } from '@/types';

type Phase = 'intro' | 'run' | 'result';

export function Placement() {
  const { t, n } = useI18n();
  const go = useRouter((s) => s.go);
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const answers = useRef<boolean[]>([]);

  const begin = () => {
    answers.current = [];
    setQuestions(buildPlacementTest(Math.floor(Math.random() * 2 ** 31)));
    setIndex(0);
    setPhase('run');
  };

  const skip = async () => {
    try {
      await useProfile.getState().update({ placementDone: true });
    } catch (e) {
      logEvent('error', `placement skip: ${String(e)}`);
    }
    go({ name: 'math' });
  };

  const finish = async () => {
    const scored = scorePlacement(questions, answers.current);
    try {
      for (const row of scored.byLevel) {
        await seedTopicDifficulty(
          topicsOfLevel(row.level).map((tp) => tp.id),
          levelStartDifficulty(row),
        );
      }
      await useSettings.getState().set('placedLevel', scored.placedLevel);
      await useProfile.getState().update({ placementDone: true });
      await usePlayer.getState().reload();
      setResult(scored);
      setPhase('result');
    } catch (e) {
      logEvent('error', `placement save: ${String(e)}`);
      toast({ kind: 'error', title: t('place.error') });
    }
  };

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Compass size={32} /></span>
        <PageHeader title={t('place.title')} subtitle={t('place.intro')} />
        <div className="flex justify-center gap-2">
          <button className="btn btn-primary btn-lg" onClick={begin}>{t('place.start')}</button>
          <button className="btn btn-ghost btn-lg" onClick={() => void skip()}>{t('place.skip')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <PageHeader title={t('place.result')} subtitle={t('place.resultBody', { n: n(result.placedLevel, 0) })} />
        <div className="card space-y-3">
          <div className="text-lg font-semibold">{t('place.score', { c: n(result.correct, 0), t: n(result.total, 0) })}</div>
          <div className="label">{t('place.byLevel')}</div>
          {result.byLevel.map((r) => (
            <div key={r.level} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0">{t('prog.levelN', { n: n(r.level, 0) })}</span>
              <Bar ratio={r.total ? r.correct / r.total : 0} className="flex-1" />
              <span className="num w-12 text-end">{n(r.correct, 0)}/{n(r.total, 0)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => go({ name: 'learn' })}>{t('place.go')}</button>
          <button className="btn btn-ghost" onClick={() => go({ name: 'math' })}>{t('place.home')}</button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return null;
  const last = index === questions.length - 1;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={t('place.title')} subtitle={t('place.progress', { n: n(index + 1, 0), t: n(questions.length, 0) })} />
      <Bar ratio={index / questions.length} />
      <QuestionPanel
        key={q.id}
        q={q}
        hideSave
        nextLabel={last ? t('place.finish') : undefined}
        onSubmit={async (a, h, ms) => {
          const out = await judgeAndRecord(q, a, h, ms, { awardXp: false, adaptive: false, saveMistake: false });
          answers.current[index] = out.verdict.correct;
          return out;
        }}
        onNext={() => {
          if (last) void finish();
          else setIndex(index + 1);
        }}
      />
    </div>
  );
}
