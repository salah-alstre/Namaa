import clsx from 'clsx';
import { BarChart3, Clock, Flame, Target, Trophy, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, EmptyState, MasteryBar, PageHeader, Stat } from '@/components/ui';
import { LEVELS, TOPICS, topicsOfLevel } from '@/content/topics';
import { attemptTotals, difficultyStats, recentSessions, typeStats } from '@/database/repos/attempts';
import { useI18n } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { logEvent } from '@/lib/log';
import { usePlayer } from '@/stores/player';

type Totals = Awaited<ReturnType<typeof attemptTotals>>;
type Sessions = Awaited<ReturnType<typeof recentSessions>>;
type Diffs = Awaited<ReturnType<typeof difficultyStats>>;
type Types = Awaited<ReturnType<typeof typeStats>>;

interface Loaded {
  totals: Totals;
  sessions: Sessions;
  diffs: Diffs;
  types: Types;
}

const WEEKS = 12;

export function Progress() {
  const { t, l, n, pct, mins, lang } = useI18n();
  const player = usePlayer();
  const [data, setData] = useState<Loaded | null>(null);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' }), [lang]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [totals, sessions, diffs, types] = await Promise.all([attemptTotals(), recentSessions(8), difficultyStats(), typeStats()]);
        if (alive) setData({ totals, sessions, diffs, types });
      } catch (e) {
        logEvent('error', `progress load: ${String(e)}`);
        if (alive) setData({ totals: { total: 0, correct: 0, timeMs: 0 }, sessions: [], diffs: [], types: [] });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const grid = useMemo(() => {
    const byDay = new Map(player.activity.map((a) => [a.day, a]));
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (WEEKS - 1) * 7); // Monday, 12 weeks ago
    const cols: { key: string; q: number; xp: number; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        const key = dayKey(dt.getTime());
        const a = byDay.get(key);
        col.push({ key, q: a?.questions ?? 0, xp: a?.xp ?? 0, future: dt > today });
      }
      cols.push(col);
    }
    return cols;
  }, [player.activity]);

  if (!data) return <div className="muted p-8 text-center">{t('common.loading')}</div>;
  if (data.totals.total === 0 && player.xp === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader title={t('prog.title')} subtitle={t('prog.subtitle')} />
        <EmptyState icon={BarChart3} title={t('prog.empty')} body={t('prog.emptyBody')} />
      </div>
    );
  }

  const { totals } = data;
  const practised = Object.values(player.topics).filter((p) => p.attempts > 0);
  const ranked = [...practised].sort((a, b) => a.mastery - b.mastery);
  const weakest = ranked.slice(0, 4);
  const strongest = [...ranked].reverse().slice(0, 4);
  const topicName = (id: string) => {
    const tp = TOPICS.find((x) => x.id === id);
    return tp ? l(tp.title) : id;
  };
  const cell = (q: number) => (q === 0 ? 'bg-surface-2' : q < 5 ? 'bg-brand/30' : q < 15 ? 'bg-brand/60' : 'bg-brand');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={t('prog.title')} subtitle={t('prog.subtitle')} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={Zap} label={t('prog.totalXp')} value={n(player.xp, 0)} hint={`${t('prog.level')} ${n(player.level.level, 0)}`} tone="gold" />
        <Stat icon={Flame} label={t('prog.streak')} value={n(player.streak.current, 0)} hint={t('prog.longest', { n: n(player.streak.longest, 0) })} tone="warn" />
        <Stat icon={Target} label={t('prog.answered')} value={n(totals.total, 0)} tone="brand" />
        <Stat icon={Trophy} label={t('prog.accuracy')} value={totals.total ? pct(totals.correct / totals.total) : '—'} tone="good" />
        <Stat icon={Clock} label={t('prog.time')} value={mins(Math.round(totals.timeMs / 60000))} tone="accent" />
      </div>

      <section className="card space-y-3">
        <h2 className="h-section">{t('prog.activity')}</h2>
        <div className="flex gap-1 overflow-x-auto pb-1" dir="ltr" role="img" aria-label={t('prog.activity')}>
          {grid.map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              {col.map((c) => (
                <div
                  key={c.key}
                  title={c.future ? '' : c.q ? `${c.key} — ${t('prog.activityDay', { q: n(c.q, 0), xp: n(c.xp, 0) })}` : `${c.key} — ${t('prog.activityNone')}`}
                  className={clsx('h-4 w-4 rounded-[4px]', c.future ? 'opacity-0' : cell(c.q))}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="h-section">{t('prog.byLevel')}</h2>
        {LEVELS.map((lv) => {
          const ts = topicsOfLevel(lv.level);
          const avg = ts.length ? ts.reduce((s, tp) => s + (player.topics[tp.id]?.mastery ?? 0), 0) / ts.length : 0;
          return (
            <div key={lv.level} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 truncate">{t('prog.levelN', { n: n(lv.level, 0) })}</span>
              <MasteryBar value={Math.round(avg)} className="flex-1" />
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="h-section">{t('prog.weakest')}</h2>
          {weakest.length === 0 ? <p className="muted text-sm">{t('prog.topicsEmpty')}</p> : weakest.map((p) => (
            <div key={p.topicId} className="space-y-1">
              <div className="text-sm">{topicName(p.topicId)}</div>
              <MasteryBar value={Math.round(p.mastery)} />
            </div>
          ))}
        </section>
        <section className="card space-y-3">
          <h2 className="h-section">{t('prog.strongest')}</h2>
          {strongest.length === 0 ? <p className="muted text-sm">{t('prog.topicsEmpty')}</p> : strongest.map((p) => (
            <div key={p.topicId} className="space-y-1">
              <div className="text-sm">{topicName(p.topicId)}</div>
              <MasteryBar value={Math.round(p.mastery)} />
            </div>
          ))}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="h-section">{t('prog.byDifficulty')}</h2>
          {data.diffs.map((d) => (
            <div key={d.difficulty} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0">{n(d.difficulty, 0)}</span>
              <Bar ratio={d.total ? d.correct / d.total : 0} className="flex-1" />
              <span className="num w-12 text-end">{d.total ? pct(d.correct / d.total) : '—'}</span>
            </div>
          ))}
        </section>
        <section className="card space-y-3">
          <h2 className="h-section">{t('prog.byType')}</h2>
          {data.types.map((d) => (
            <div key={d.qtype} className="space-y-1 text-sm">
              <div className="flex justify-between"><span>{t(`qtype.${d.qtype}` as never)}</span><span className="num">{d.total ? pct(d.correct / d.total) : '—'}</span></div>
              <Bar ratio={d.total ? d.correct / d.total : 0} />
            </div>
          ))}
        </section>
      </div>

      <section className="card space-y-3">
        <h2 className="h-section">{t('prog.sessions')}</h2>
        {data.sessions.length === 0 ? (
          <p className="muted text-sm">{t('prog.sessionsEmpty')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="chip">{t(`prog.mode.${s.mode}` as never)}</span>
                <span className="flex-1">{t('prog.perQ', { c: n(s.correct, 0), t: n(s.total, 0) })}</span>
                <span className="num text-gold">+{n(s.xp, 0)} XP</span>
                <span className="muted">{dateFmt.format(new Date(s.at))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
