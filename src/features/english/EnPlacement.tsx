import { Compass } from 'lucide-react';
import { useRef, useState } from 'react';
import { LEVELS, PLACEMENT } from '@/content/english';
import { isPlacementDone, pickQuestion, placementResult, PLACEMENT_MAX, PLACEMENT_MIN, recordAnswer, startPlacement, type PlacementState } from '@/english-engine/placement';
import type { EnLevel } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { ExerciseView } from './ExerciseView';

export function EnPlacement() {
  const { l, n, t } = useI18n();
  const go = useRouter((s) => s.go);
  const savePlacement = useEnglish((s) => s.savePlacement);
  const last = useEnglish((s) => s.placements[0]);
  const setSetting = useSettings((s) => s.set);
  const [state, setState] = useState<PlacementState | null>(null);
  const [result, setResult] = useState<EnLevel | null>(null);
  const saved = useRef(false);

  const levelName = (id: EnLevel) => LEVELS.find((x) => x.id === id);

  const finish = async (s: PlacementState) => {
    const lv = placementResult(s.answers);
    const correct = s.answers.filter((a) => a.correct).length;
    setResult(lv);
    if (saved.current) return;
    saved.current = true;
    await savePlacement(lv, Math.round((correct / Math.max(1, s.answers.length)) * 100), s.answers.length, correct, s.answers);
  };

  const q = state && !result ? pickQuestion(PLACEMENT, state) : null;

  const onAnswer = (correct: boolean) => {
    if (!state || !q) return;
    const next = recordAnswer(state, q, correct);
    setState(next);
    if (isPlacementDone(next) || !pickQuestion(PLACEMENT, next)) void finish(next);
  };

  if (result) {
    const lv = levelName(result);
    return (
      <div className="mx-auto max-w-xl space-y-5 p-6">
        <div className="card space-y-4 p-8 text-center">
          <Compass className="mx-auto text-en" size={36} />
          <h1 className="h-page">{l({ en: 'Your level', ar: 'مستواك' })}</h1>
          <p className="text-4xl font-bold text-en"><EnglishText>{lv?.code ?? result}</EnglishText></p>
          <p className="font-semibold">{lv ? l(lv.name) : ''}</p>
          <p className="muted text-sm">{l({ en: 'This is a starting point only. Every lesson stays open and you can retake the test any time.', ar: 'هذه نقطة بداية فقط. جميع الدروس تبقى مفتوحة ويمكنك إعادة الاختبار في أي وقت.' })}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn" onClick={() => { void setSetting('enStartLevel', result); go({ name: 'en-learn' }); }}>{l({ en: 'Use as my starting level', ar: 'اعتمده مستوى بداية' })}</button>
            <button className="btn-ghost" onClick={() => go({ name: 'en-home' })}>{t('nav.en.home')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-xl space-y-5 p-6">
        <PageHeader title={t('nav.en.placement')} subtitle={l({ en: 'About 15–25 questions that adapt to you. It takes around 10 minutes.', ar: 'نحو ١٥–٢٥ سؤالًا تتكيف معك، وتستغرق حوالي ١٠ دقائق.' })} />
        <div className="card space-y-3 p-6">
          <p className="leading-8">{l({ en: 'Answer honestly and skip nothing. If you do not know, pick your best guess. The result never locks any lesson. It only suggests where to start.', ar: 'أجب بصدق ولا تتخطَّ شيئًا. إن لم تعرف فخمّن. النتيجة لا تقفل أي درس، وإنما تقترح أين تبدأ.' })}</p>
          {last && <p className="muted text-sm">{l({ en: `Last result: ${levelName(last.level)?.code ?? last.level} (${last.correct}/${last.total})`, ar: `آخر نتيجة: ${levelName(last.level)?.code ?? last.level} (${n(last.correct)}/${n(last.total)})` })}</p>}
          <button className="btn" onClick={() => { saved.current = false; setState(startPlacement()); }}>{l({ en: 'Start the test', ar: 'ابدأ الاختبار' })}</button>
        </div>
      </div>
    );
  }

  const done = state.answers.length;
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-3">
        <Bar ratio={Math.min(1, done / PLACEMENT_MIN)} />
        <span className="muted num text-xs">{n(done + 1)}</span>
      </div>
      {q ? (
        <div className="card p-6">
          <ExerciseView key={q.id} exercise={q.exercise} record={false} onDone={(o) => onAnswer(o.correct)} nextLabel={l({ en: 'Next', ar: 'التالي' })} />
        </div>
      ) : null}
      <p className="muted text-center text-xs">{l({ en: `Up to ${PLACEMENT_MAX} questions`, ar: `حتى ${n(PLACEMENT_MAX)} سؤالًا` })}</p>
    </div>
  );
}
