import clsx from 'clsx';
import { Lock, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NamedIcon } from '@/components/Icon';
import { EmptyState, PageHeader, Segmented } from '@/components/ui';
import { ACHIEVEMENTS } from '@/content/achievements';
import { useI18n } from '@/i18n';
import { usePlayer } from '@/stores/player';

type Filter = 'all' | 'done' | 'todo';

export function Achievements() {
  const { t, l, n, lang } = useI18n();
  const unlocked = usePlayer((s) => s.achievements);
  const [filter, setFilter] = useState<Filter>('all');
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' }), [lang]);

  const done = ACHIEVEMENTS.filter((a) => unlocked[a.id] !== undefined).length;
  const shown = ACHIEVEMENTS.filter((a) => (filter === 'all' ? true : filter === 'done' ? unlocked[a.id] !== undefined : unlocked[a.id] === undefined));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title={t('ach.title')} subtitle={t('ach.subtitle', { c: n(done, 0), t: n(ACHIEVEMENTS.length, 0) })} />
      <Segmented
        value={filter}
        onChange={setFilter}
        label={t('ach.title')}
        options={[
          { value: 'all', label: t('ach.filter.all') },
          { value: 'done', label: t('ach.filter.done') },
          { value: 'todo', label: t('ach.filter.todo') },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState icon={Trophy} title={t('ach.empty')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => {
            const at = unlocked[a.id];
            const got = at !== undefined;
            const masked = !got && a.hidden;
            return (
              <li key={a.id} className={clsx('card-flat flex gap-3 !p-4', !got && 'opacity-70')}>
                <span className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', got ? 'bg-gold-soft text-gold' : 'bg-surface-2 text-ink-3')}>
                  {masked || !got ? (masked ? <Lock size={22} /> : <NamedIcon name={a.icon} size={22} />) : <NamedIcon name={a.icon} size={22} />}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold">{masked ? t('ach.hidden') : l(a.title)}</div>
                  <div className="muted text-sm">{masked ? t('ach.hiddenBody') : l(a.description)}</div>
                  <div className="mt-1 text-xs text-ink-3">
                    {got ? t('ach.unlocked', { d: dateFmt.format(new Date(at)) }) : t('ach.locked')} · {t('common.xp', { n: a.xp } as never)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
