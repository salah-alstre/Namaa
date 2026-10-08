import { BookOpenText, Languages } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LEVELS, READINGS, WORDS } from '@/content/english';
import type { Reading } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useSettings } from '@/stores/settings';
import { EmptyState, PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';
import { ExerciseRun } from './EnPractice';

const WORD_BY_EN = new Map(WORDS.map((w) => [w.en.toLowerCase(), w]));

/** Looks a token up in the text's own gloss first, then the vocabulary list. */
function meaningOf(token: string, gloss: Record<string, string>): { ar: string; id?: string } | null {
  const k = token.toLowerCase();
  if (gloss[k]) return { ar: gloss[k], id: WORD_BY_EN.get(k)?.id };
  const w = WORD_BY_EN.get(k);
  return w ? { ar: w.ar, id: w.id } : null;
}

function Text({ r }: { r: Reading }) {
  const { l } = useI18n();
  const showAr = useSettings((s) => s.settings.enShowTranslation) ?? true;
  const [sel, setSel] = useState<{ word: string; ar: string; id?: string } | null>(null);
  const [tr, setTr] = useState(false);
  const vocab = useEnglish((s) => s.vocab);
  const addWords = useEnglish((s) => s.addWords);

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-6">
        {r.paragraphs.map((p, i) => (
          <div key={i} className="space-y-1">
            <p dir="ltr" className="text-start text-lg leading-9">
              {p.split(/(\s+)/).map((tok, j) => {
                const word = tok.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
                if (!word) return <span key={j}>{tok}</span>;
                const m = meaningOf(word, r.gloss);
                return m ? (
                  <button key={j} type="button" className="cursor-pointer rounded px-0.5 underline decoration-en/50 decoration-dotted underline-offset-4 hover:bg-en-soft" onClick={() => setSel({ word, ...m })}>{tok}</button>
                ) : (
                  <span key={j}>{tok}</span>
                );
              })}
            </p>
            {tr && showAr && <p className="muted text-sm leading-7">{r.translation[i]}</p>}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <SpeakButton text={r.paragraphs.join(' ')} />
          {showAr && <button className="btn-ghost btn-sm" aria-pressed={tr} onClick={() => setTr((x) => !x)}><Languages size={15} /> {l({ en: 'Translation', ar: 'الترجمة' })}</button>}
        </div>
      </div>
      <div className="card min-h-16 p-4" aria-live="polite">
        {sel ? (
          <div className="flex items-center gap-3">
            <EnglishText className="text-lg font-bold">{sel.word}</EnglishText>
            <span>{sel.ar}</span>
            <SpeakButton text={sel.word} size="sm" slow={false} />
            {sel.id && !vocab[sel.id] && <button className="btn-soft btn-sm ms-auto" onClick={() => addWords([sel.id!], 'reading')}>{l({ en: 'Add to review', ar: 'أضف إلى المراجعة' })}</button>}
            {sel.id && vocab[sel.id] && <span className="chip ms-auto bg-good-soft text-good">{l({ en: 'In review', ar: 'في المراجعة' })}</span>}
          </div>
        ) : (
          <p className="muted text-sm">{l({ en: 'Tap an underlined word to see its meaning.', ar: 'اضغط على كلمة مسطّرة لترى معناها.' })}</p>
        )}
      </div>
    </div>
  );
}

export function EnReading() {
  const { l, n, t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState(false);
  const r = useMemo(() => READINGS.find((x) => x.id === openId), [openId]);

  if (r) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-6">
        <PageHeader title={l(r.title)} subtitle={l({ en: 'Read, tap words you do not know, then answer the questions.', ar: 'اقرأ، واضغط على الكلمات الجديدة، ثم أجب عن الأسئلة.' })} />
        {quiz ? (
          <ExerciseRun exercises={r.questions} onExit={() => { setQuiz(false); setOpenId(null); }} exitLabel={l({ en: 'Back to reading', ar: 'العودة إلى القراءة' })} />
        ) : (
          <>
            <Text r={r} />
            <div className="flex gap-2">
              <button className="btn" onClick={() => setQuiz(true)}>{l({ en: `Answer ${r.questions.length} questions`, ar: `أجب عن ${n(r.questions.length)} أسئلة` })}</button>
              <button className="btn-ghost" onClick={() => setOpenId(null)}>{l({ en: 'Back', ar: 'رجوع' })}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader title={t('nav.en.reading')} subtitle={l({ en: 'Short graded texts. Tap any word for its meaning.', ar: 'نصوص قصيرة متدرجة. اضغط على أي كلمة لمعناها.' })} />
      {READINGS.length === 0 && <EmptyState icon={BookOpenText} title={l({ en: 'No texts yet', ar: 'لا توجد نصوص بعد' })} />}
      {LEVELS.map((lv) => {
        const items = READINGS.filter((x) => x.level === lv.id);
        if (items.length === 0) return null;
        return (
          <section key={lv.id} className="space-y-2">
            <h2 className="h-section"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((x) => (
                <li key={x.id}>
                  <button className="card flex w-full cursor-pointer items-center gap-3 p-4 text-start transition-colors hover:bg-surface-2" onClick={() => { setQuiz(false); setOpenId(x.id); }}>
                    <BookOpenText size={18} className="text-en" />
                    <span className="font-semibold">{l(x.title)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
