import { Flame, Plus, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WORDS } from '@/content/english';
import { wordMastery, type WordMastery } from '@/english-engine/srs';
import { EN_LEVELS, type EnLevel } from '@/english-engine/types';
import { normalizeEnglish } from '@/english-engine/normalize';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { PageHeader, Segmented } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';

type Filter = 'all' | 'due' | 'favorite' | 'difficult' | 'new' | 'mastered';

const MASTERY_LABEL: Record<WordMastery, { en: string; ar: string; cls: string }> = {
  new: { en: 'New', ar: 'جديدة', cls: 'bg-surface-2 text-ink-2' },
  learning: { en: 'Learning', ar: 'قيد التعلم', cls: 'bg-warn-soft text-warn' },
  familiar: { en: 'Familiar', ar: 'مألوفة', cls: 'bg-brand-soft text-brand' },
  mastered: { en: 'Mastered', ar: 'متقنة', cls: 'bg-good-soft text-good' },
};

export function EnVocab() {
  const { l, n } = useI18n();
  const vocab = useEnglish((s) => s.vocab);
  const toggleFlag = useEnglish((s) => s.toggleFlag);
  const addWords = useEnglish((s) => s.addWords);
  const [filter, setFilter] = useState<Filter>('all');
  const [level, setLevel] = useState<EnLevel | 'all'>('all');
  const [q, setQ] = useState(() => {
    try {
      const id = sessionStorage.getItem('namaa.word');
      sessionStorage.removeItem('namaa.word');
      return WORDS.find((w) => w.id === id)?.en ?? '';
    } catch {
      return '';
    }
  });
  const now = Date.now();

  const list = useMemo(() => {
    const needle = normalizeEnglish(q);
    return WORDS.filter((w) => {
      const row = vocab[w.id];
      if (level !== 'all' && w.level !== level) return false;
      if (needle && !normalizeEnglish(w.en).includes(needle) && !w.ar.includes(q.trim())) return false;
      switch (filter) {
        case 'due': return !!row && row.dueAt <= now;
        case 'favorite': return !!row?.favorite;
        case 'difficult': return !!row?.difficult;
        case 'new': return !row || row.reps === 0;
        case 'mastered': return wordMastery(row ?? null) === 'mastered';
        default: return true;
      }
    }).slice(0, 200);
  }, [vocab, filter, level, q, now]);

  const known = Object.keys(vocab).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <PageHeader
        title={l({ en: 'Vocabulary', ar: 'المفردات' })}
        subtitle={l({ en: `${known} of ${WORDS.length} words in your review`, ar: `${n(known)} من ${n(WORDS.length)} كلمة في مراجعتك` })}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-2" />
          <input className="input !ps-9" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder={l({ en: 'Search a word or meaning', ar: 'ابحث عن كلمة أو معنى' })} aria-label={l({ en: 'Search words', ar: 'ابحث في الكلمات' })} />
        </div>
        <select className="input !w-auto" value={level} onChange={(e) => setLevel(e.target.value as EnLevel | 'all')} aria-label={l({ en: 'Level', ar: 'المستوى' })}>
          <option value="all">{l({ en: 'All levels', ar: 'كل المستويات' })}</option>
          {EN_LEVELS.map((v) => (
            <option key={v} value={v}>{v === 'starter' ? 'A0' : v.toUpperCase()}</option>
          ))}
        </select>
      </div>
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: l({ en: 'All', ar: 'الكل' }) },
          { value: 'due', label: l({ en: 'Due', ar: 'مستحقة' }) },
          { value: 'new', label: l({ en: 'New', ar: 'جديدة' }) },
          { value: 'favorite', label: l({ en: 'Favorites', ar: 'المفضلة' }) },
          { value: 'difficult', label: l({ en: 'Difficult', ar: 'صعبة' }) },
          { value: 'mastered', label: l({ en: 'Mastered', ar: 'متقنة' }) },
        ]}
      />
      {list.length === 0 && <p className="muted py-8 text-center">{l({ en: 'No words match.', ar: 'لا توجد كلمات مطابقة.' })}</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {list.map((w) => {
          const row = vocab[w.id];
          const m = MASTERY_LABEL[wordMastery(row ?? null)];
          return (
            <li key={w.id} className="card-flat flex items-start gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <EnglishText className="text-lg font-bold">{w.en}</EnglishText>
                  <EnglishText className="muted text-xs">{w.pos}</EnglishText>
                  <span className={`chip ${m.cls}`}>{l(m)}</span>
                </div>
                <p className="text-sm">{w.ar}</p>
                <EnglishText block className="muted text-xs">/{w.pron}/</EnglishText>
                <EnglishText block className="mt-1 text-sm">{w.exEn}</EnglishText>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <SpeakButton text={w.en} size="sm" slow={false} />
                {row ? (
                  <>
                    <button className={`icon-btn !h-7 !w-7 ${row.favorite ? 'text-gold' : ''}`} onClick={() => toggleFlag(w.id, 'favorite')} aria-pressed={row.favorite} title={l({ en: 'Favorite', ar: 'مفضلة' })}>
                      <Star size={15} fill={row.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button className={`icon-btn !h-7 !w-7 ${row.difficult ? 'text-bad' : ''}`} onClick={() => toggleFlag(w.id, 'difficult')} aria-pressed={row.difficult} title={l({ en: 'Mark as difficult', ar: 'علّمها كصعبة' })}>
                      <Flame size={15} />
                    </button>
                  </>
                ) : (
                  <button className="icon-btn !h-7 !w-7" onClick={() => addWords([w.id], 'manual')} title={l({ en: 'Add to review', ar: 'أضف إلى المراجعة' })}>
                    <Plus size={15} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
