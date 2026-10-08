import clsx from 'clsx';
import { Search, Sigma, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Rich, Tex } from '@/components/Math';
import { EmptyState, PageHeader } from '@/components/ui';
import { FORMULAS, FORMULA_BY_ID, FORMULA_CATEGORIES } from '@/content/formulas';
import { TOPIC_BY_ID } from '@/content/topics';
import { useI18n } from '@/i18n';
import { usePlayer } from '@/stores/player';
import { usePractice } from '@/stores/practice';
import { useRouter } from '@/stores/router';
import type { FormulaCategory } from '@/types';

export function Formulas() {
  const { t, l } = useI18n();
  const favorites = usePlayer((s) => s.favorites);
  const toggleFavorite = usePlayer((s) => s.toggleFavorite);
  const [cat, setCat] = useState<FormulaCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // The command palette hands over a formula id through sessionStorage.
  useEffect(() => {
    try {
      const id = sessionStorage.getItem('raqam.formula');
      if (id) {
        sessionStorage.removeItem('raqam.formula');
        if (FORMULA_BY_ID[id]) {
          setSelected(id);
          setCat('all');
        }
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FORMULAS.filter((f) => {
      if (cat !== 'all' && f.category !== cat) return false;
      if (onlyFav && !favorites.includes(f.id)) return false;
      if (!q) return true;
      return `${f.name.en} ${f.name.ar} ${f.explanation.en} ${f.explanation.ar}`.toLowerCase().includes(q);
    });
  }, [cat, query, onlyFav, favorites]);

  const current = (selected && FORMULA_BY_ID[selected]) || null;
  const topic = current?.topicId ? TOPIC_BY_ID[current.topicId] : undefined;

  const practise = async () => {
    if (!current?.topicId) return;
    await usePractice.getState().start({ mode: 'normal', topicIds: [current.topicId], difficulty: 'adaptive', count: 10, timeLimitS: null });
    useRouter.getState().go({ name: 'practice-run' });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader title={t('form.title')} subtitle={t('form.subtitle')} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="input !ps-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('form.search')} aria-label={t('form.search')} />
        </div>
        <button className={clsx('btn btn-sm', onlyFav && 'btn-primary')} aria-pressed={onlyFav} onClick={() => setOnlyFav(!onlyFav)}>
          <Star size={14} /> {t('form.favorites')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...FORMULA_CATEGORIES] as const).map((c) => (
          <button key={c} className={clsx('chip cursor-pointer', cat === c && '!bg-brand !text-white')} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c === 'all' ? t('common.all') : t(`form.cat.${c}` as never)}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-2">
          {list.length === 0 ? (
            <EmptyState icon={Sigma} title={t('form.empty')} body={t('form.emptyBody')} />
          ) : (
            <ul className="space-y-1.5">
              {list.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setSelected(f.id)}
                    aria-current={selected === f.id}
                    className={clsx('card-flat flex w-full items-center gap-3 !p-3 text-start', selected === f.id && 'ring-2 ring-brand')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{l(f.name)}</span>
                      <span className="muted block text-xs">{t(`form.cat.${f.category}` as never)}</span>
                    </span>
                    {favorites.includes(f.id) && <Star size={14} className="fill-current text-gold" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="card min-h-[16rem] space-y-5">
          {!current ? (
            <EmptyState icon={Sigma} title={t('form.select')} />
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span className="chip">{t(`form.cat.${current.category}` as never)}</span>
                  <h2 className="h-section mt-2">{l(current.name)}</h2>
                </div>
                <button className="btn btn-sm" aria-pressed={favorites.includes(current.id)} onClick={() => void toggleFavorite(current.id)}>
                  <Star size={14} className={favorites.includes(current.id) ? 'fill-current text-gold' : ''} />
                  {t(favorites.includes(current.id) ? 'form.unstar' : 'form.star')}
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl bg-surface-2 py-4 text-center text-xl" dir="ltr">
                <Tex tex={current.latex} block />
              </div>
              <p className="text-ink-2"><Rich text={l(current.explanation)} /></p>
              {current.variables.length > 0 && (
                <div>
                  <h3 className="label">{t('form.variables')}</h3>
                  <ul className="mt-1 space-y-1.5">
                    {current.variables.map((v) => (
                      <li key={v.symbol} className="flex items-baseline gap-3 text-sm">
                        <span className="min-w-[2.5rem]" dir="ltr"><Tex tex={v.symbol} /></span>
                        <span className="text-ink-2">{l(v.meaning)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl border border-line p-4">
                <h3 className="label">{t('form.example')}</h3>
                <div className="mt-1"><Rich text={l(current.example.problem)} /></div>
                <h3 className="label mt-3">{t('form.solution')}</h3>
                <div className="overflow-x-auto" dir="ltr"><Tex tex={current.example.solution} block /></div>
              </div>
              <div>
                <h3 className="label">{t('form.when')}</h3>
                <p className="text-ink-2"><Rich text={l(current.whenToUse)} /></p>
              </div>
              {topic && (
                <button className="btn btn-soft" onClick={() => void practise()}>
                  {t('form.practice')}: {l(topic.title)}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
