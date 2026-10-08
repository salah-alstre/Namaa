import { CheckCircle2, Eye, Repeat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WORD_BY_ID } from '@/content/english';
import { previewInterval, SRS_GRADES } from '@/english-engine/srs';
import type { SrsGrade } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, EmptyState, PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';

const GRADE_LABEL: Record<SrsGrade, { en: string; ar: string; cls: string }> = {
  again: { en: 'Again', ar: 'مجددًا', cls: 'bg-bad-soft text-bad' },
  hard: { en: 'Hard', ar: 'صعب', cls: 'bg-warn-soft text-warn' },
  good: { en: 'Good', ar: 'جيد', cls: 'bg-good-soft text-good' },
  easy: { en: 'Easy', ar: 'سهل', cls: 'bg-en-soft text-en' },
};

export function WordCard({ wordId, onGrade, intervalFor }: { wordId: string; onGrade: (g: SrsGrade) => void; intervalFor: (g: SrsGrade) => string }) {
  const { l } = useI18n();
  const word = WORD_BY_ID[wordId];
  const [shown, setShown] = useState(false);
  const autoPlay = useSettings((s) => s.settings.enAutoPlay);
  const showTr = useSettings((s) => s.settings.enShowTranslation);
  if (!word) return null;
  void autoPlay;
  return (
    <div className="card space-y-5 p-8 text-center">
      <div className="space-y-2">
        <EnglishText block className="text-4xl font-bold">{word.en}</EnglishText>
        <EnglishText block className="muted text-sm">/{word.pron}/ · {word.pos}</EnglishText>
        <SpeakButton text={word.en} />
      </div>
      {shown ? (
        <>
          <p className="text-2xl font-semibold text-en">{word.ar}</p>
          <div className="rounded-xl bg-surface-2 p-3 text-start">
            <EnglishText block>{word.exEn}</EnglishText>
            {showTr !== false && <p className="muted mt-1 text-sm">{word.exAr}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SRS_GRADES.map((g) => (
              <button key={g} className={`btn-soft flex-col !py-3 ${GRADE_LABEL[g].cls}`} onClick={() => { setShown(false); onGrade(g); }}>
                <span className="font-semibold">{l(GRADE_LABEL[g])}</span>
                <span className="text-xs opacity-80">{intervalFor(g)}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <button className="btn" onClick={() => setShown(true)} autoFocus>
          <Eye size={18} /> {l({ en: 'Show meaning', ar: 'أظهر المعنى' })}
        </button>
      )}
    </div>
  );
}

export function useIntervalLabel() {
  const { l, n } = useI18n();
  return (card: Parameters<typeof previewInterval>[0], g: SrsGrade) => {
    const p = previewInterval(card, g, Date.now());
    const unit = p.unit === 'm' ? { en: 'min', ar: 'د' } : p.unit === 'h' ? { en: 'h', ar: 'س' } : { en: 'd', ar: 'يوم' };
    return `${n(p.value)} ${l(unit)}`;
  };
}

export function EnReview() {
  const { l, n, t } = useI18n();
  const go = useRouter((s) => s.go);
  const vocab = useEnglish((s) => s.vocab);
  const reviewWord = useEnglish((s) => s.reviewWord);
  const dueWords = useEnglish((s) => s.dueWords);
  const reviewedToday = useEnglish((s) => s.reviewedToday);
  const label = useIntervalLabel();
  // Fixed queue for the session so the card order doesn't jump while grading.
  const [queue] = useState(() => dueWords().map((w) => w.wordId));
  const [i, setI] = useState(0);
  const [done, setDone] = useState(0);
  const total = queue.length;
  const wordId = queue[i];
  const card = wordId ? vocab[wordId] : undefined;
  const dueNow = useMemo(() => dueWords().length, [dueWords, vocab]);

  const grade = async (g: SrsGrade) => {
    if (!wordId) return;
    await reviewWord(wordId, g);
    setDone((d) => d + 1);
    setI((x) => x + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <PageHeader
        title={t('gh.wordsDue', { n: dueNow })}
        subtitle={l({ en: 'Spaced repetition: words you know come back later, hard words come back sooner.', ar: 'التكرار المتباعد: الكلمات التي تعرفها تعود لاحقًا، والصعبة تعود أسرع.' })}
      />
      {Object.keys(vocab).length === 0 ? (
        <EmptyState icon={Repeat} title={l({ en: 'No words yet', ar: 'لا توجد كلمات بعد' })} body={l({ en: 'Finish a lesson and its words are added here automatically.', ar: 'أكمل درسًا وستُضاف كلماته هنا تلقائيًا.' })} action={<button className="btn" onClick={() => go({ name: 'en-learn' })}>{t('nav.en.learn')}</button>} />
      ) : !wordId || !card ? (
        <EmptyState
          icon={CheckCircle2}
          title={done > 0 ? l({ en: `Done! You reviewed ${done} words.`, ar: `أحسنت! راجعت ${n(done)} كلمات.` }) : l({ en: 'Nothing is due right now', ar: 'لا شيء مستحق الآن' })}
          body={l({ en: `Reviewed today: ${reviewedToday}. Come back later or learn something new.`, ar: `راجعت اليوم: ${n(reviewedToday)}. عد لاحقًا أو تعلّم شيئًا جديدًا.` })}
          action={<button className="btn" onClick={() => go({ name: 'en-home' })}>{l({ en: 'English home', ar: 'الرئيسية' })}</button>}
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Bar ratio={total ? i / total : 0} />
            <span className="muted num text-xs">{n(i + 1)}/{n(total)}</span>
          </div>
          <WordCard wordId={wordId} onGrade={grade} intervalFor={(g) => label(card, g)} />
        </>
      )}
    </div>
  );
}
