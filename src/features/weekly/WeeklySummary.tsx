import { CalendarDays, Clock, Flame, HelpCircle, Sparkles, Target, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { Modal } from '@/components/Modal';
import { lastWeekSummary } from '@/domain/weekly';
import { useI18n } from '@/i18n';
import { addDays } from '@/lib/dates';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { useUi } from '@/stores/ui';
import { startQuickPractice } from '@/features/practice/quick';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-flat flex items-center gap-3 !p-3">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">{icon}</span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight num">{value}</p>
        <p className="muted truncate text-xs">{label}</p>
      </div>
    </div>
  );
}

/** Shown once at the start of a new week, and on demand from the Progress page. */
export function WeeklySummary() {
  const { t, n, pct, mins, lang } = useI18n();
  const open = useUi((s) => s.weeklyOpen);
  const setWeekly = useUi((s) => s.setWeekly);
  const activity = usePlayer((s) => s.activity);
  const today = usePlayer((s) => s.today);
  const setSetting = useSettings((s) => s.set);
  const go = useRouter((s) => s.go);

  const summary = useMemo(() => lastWeekSummary(activity, today), [activity, today]);
  const w = summary.week;

  const dateFmt = (day: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' }).format(new Date(`${day}T12:00:00`));
  const dayName = (day: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { weekday: 'long' }).format(new Date(`${day}T12:00:00`));

  const close = () => {
    setWeekly(false);
    void setSetting('lastWeeklySeen', w.start);
  };

  let note: string;
  if (w.questions === 0 && w.lessons === 0) note = t('weekly.quiet');
  else if (summary.previous.questions === 0) note = t('weekly.firstWeek');
  else if (w.questions > summary.previous.questions) note = t('weekly.moreThanBefore', { n: n(w.questions - summary.previous.questions, 0) });
  else if (w.questions < summary.previous.questions) note = t('weekly.lessThanBefore');
  else note = t('weekly.same');

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('weekly.title')}
      wide
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            {t('weekly.dismiss')}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              close();
              go({ name: 'practice' });
              startQuickPractice();
            }}
          >
            <Zap size={16} />
            {t('weekly.cta')}
          </button>
        </>
      }
    >
      <p className="muted mb-4 text-sm">{t('weekly.sub', { from: dateFmt(w.start), to: dateFmt(addDays(w.start, 6)) })}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<HelpCircle size={18} />} label={t('weekly.questions')} value={n(w.questions, 0)} />
        <Stat icon={<Target size={18} />} label={t('weekly.accuracy')} value={w.accuracy === null ? '—' : pct(w.accuracy)} />
        <Stat icon={<Clock size={18} />} label={t('weekly.time')} value={mins(w.minutes)} />
        <Stat icon={<Sparkles size={18} />} label={t('weekly.xp')} value={n(w.xp, 0)} />
        <Stat icon={<CalendarDays size={18} />} label={t('weekly.lessons')} value={n(w.lessons, 0)} />
        <Stat icon={<Flame size={18} />} label={t('weekly.activeDays')} value={`${n(w.activeDays, 0)}/7`} />
      </div>
      {w.bestDay && <p className="mt-4 text-sm font-medium">{t('weekly.bestDay', { day: dayName(w.bestDay) })}</p>}
      <p className="muted mt-2 text-sm">{note}</p>
    </Modal>
  );
}
