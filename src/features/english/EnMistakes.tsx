import { CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ALL_EXERCISES, EXERCISE_BY_ID } from '@/content/english';
import type { Exercise } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { EmptyState, PageHeader, Segmented } from '@/components/ui';
import { EnglishText, Mixed } from '@/components/EnglishText';
import { ExerciseRun } from './EnPractice';

type Filter = 'open' | 'understood';

export function EnMistakes() {
  const { l, n, t } = useI18n();
  const mistakes = useEnglish((s) => s.mistakes);
  const understood = useEnglish((s) => s.understood);
  const [filter, setFilter] = useState<Filter>('open');
  const [run, setRun] = useState<Exercise[] | null>(null);

  const open = mistakes.filter((m) => !m.understood);
  const list = mistakes.filter((m) => (filter === 'open' ? !m.understood : m.understood));

  // Pattern detection: grammar/vocab patterns that keep coming back.
  const patterns = useMemo(() => {
    const by = new Map<string, number>();
    for (const m of open) if (m.patternId) by.set(m.patternId, (by.get(m.patternId) ?? 0) + m.timesWrong);
    return [...by.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [open]);

  /** Similar exercises: same pattern, excluding ones already wrong, plus the mistakes themselves. */
  const similarFor = (patternId: string, exerciseId: string): Exercise[] =>
    ALL_EXERCISES.filter((e) => e.pattern && e.pattern === patternId && e.id !== exerciseId).slice(0, 5);

  if (run) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ExerciseRun exercises={run} onExit={() => setRun(null)} exitLabel={l({ en: 'Back to mistakes', ar: 'العودة إلى الأخطاء' })} />
      </div>
    );
  }

  const retry = open.flatMap((m) => (EXERCISE_BY_ID[m.exerciseId] ? [EXERCISE_BY_ID[m.exerciseId]!] : [])).slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader
        title={t('nav.en.mistakes')}
        subtitle={l({ en: 'Every mistake is saved with an explanation. Retry them until they stick.', ar: 'كل خطأ يُحفظ مع شرحه. أعد المحاولة حتى يثبت.' })}
        actions={retry.length > 0 ? <button className="btn btn-sm" onClick={() => setRun(retry)}><RotateCcw size={15} /> {l({ en: `Retry ${retry.length}`, ar: `أعد ${n(retry.length)}` })}</button> : undefined}
      />
      {patterns.length > 0 && (
        <section className="card space-y-2 border-warn bg-warn-soft p-5">
          <div className="flex items-center gap-2"><ShieldAlert size={18} className="text-warn" /><h2 className="h-section">{l({ en: 'Patterns to watch', ar: 'أنماط تحتاج انتباهًا' })}</h2></div>
          <p className="muted text-sm">{l({ en: 'You keep missing these topics:', ar: 'تتكرر أخطاؤك في هذه المواضيع:' })}</p>
          <div className="flex flex-wrap gap-2">
            {patterns.map(([p, c]) => (
              <button key={p} className="chip cursor-pointer" onClick={() => setRun(ALL_EXERCISES.filter((e) => e.pattern === p).slice(0, 8))}>
                <EnglishText>{p}</EnglishText> ×{n(c)}
              </button>
            ))}
          </div>
        </section>
      )}
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'open', label: l({ en: `Open (${open.length})`, ar: `مفتوحة (${n(open.length)})` }) },
          { value: 'understood', label: l({ en: 'Understood', ar: 'مفهومة' }) },
        ]}
      />
      {list.length === 0 && (
        <EmptyState icon={CheckCircle2} title={filter === 'open' ? l({ en: 'No open mistakes', ar: 'لا أخطاء مفتوحة' }) : l({ en: 'Nothing here yet', ar: 'لا شيء هنا بعد' })} body={l({ en: 'Mistakes you make in lessons and practice will appear here.', ar: 'ستظهر هنا الأخطاء التي ترتكبها في الدروس والتمارين.' })} />
      )}
      <ul className="space-y-3">
        {list.map((m) => {
          const ex = EXERCISE_BY_ID[m.exerciseId];
          const similar = similarFor(m.patternId, m.exerciseId);
          return (
            <li key={m.id} className="card space-y-2 p-4">
              <p className="font-semibold"><Mixed text={m.prompt} /></p>
              <p className="text-sm"><span className="chip bg-bad-soft text-bad">✗</span> <EnglishText>{m.given || '—'}</EnglishText></p>
              <p className="text-sm"><span className="chip bg-good-soft text-good">✓</span> <EnglishText className="font-semibold">{m.expected}</EnglishText></p>
              {m.explanation && <p className="muted text-sm"><Mixed text={l(m.explanation)} /></p>}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="muted text-xs">{l({ en: `Wrong ${m.timesWrong}×`, ar: `خطأ ${n(m.timesWrong)} مرات` })}</span>
                {ex && <button className="btn-soft btn-sm" onClick={() => setRun([ex, ...similar])}>{l({ en: 'Retry + similar', ar: 'أعد مع تمارين مشابهة' })}</button>}
                <button className="btn-ghost btn-sm" onClick={() => understood(m.exerciseId, !m.understood)}>
                  {m.understood ? l({ en: 'Reopen', ar: 'أعد الفتح' }) : l({ en: 'I understand now', ar: 'فهمتها الآن' })}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
