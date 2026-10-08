import { Calculator, Clock, Flame, Languages, Repeat, Target, Zap, type LucideIcon } from 'lucide-react';
import { ALL_LESSONS } from '@/content/english';
import { LESSON_BY_ID } from '@/content/lessons';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, PageHeader, Stat } from '@/components/ui';
import type { Route } from '@/types';

interface PlanItem {
  key: string;
  Icon: LucideIcon;
  title: string;
  detail?: string;
  route: Route;
  english: boolean;
}

/** Global Home: both subjects, one streak, and what to do today. */
export function GlobalHome() {
  const { t, l, n, mins } = useI18n();
  const go = useRouter((s) => s.go);
  const player = usePlayer();
  const goal = useSettings((s) => s.settings.dailyGoal);
  const enXp = useEnglish((s) => s.xp);
  const enLessons = useEnglish((s) => s.lessons);
  const dueWords = useEnglish((s) => s.dueWords().length);
  const enOpen = useEnglish((s) => s.mistakes.filter((m) => !m.understood).length);

  const todayRow = player.activity.find((a) => a.day === player.today);
  const xpToday = todayRow?.xp ?? 0;
  const minutesToday = todayRow?.minutes ?? 0;
  const goalRatio = goal > 0 ? Math.min(1, (todayRow?.questions ?? 0) / goal) : 0;

  const mathLesson = player.nextLessonId ? LESSON_BY_ID[player.nextLessonId] : null;
  const enDone = ALL_LESSONS.filter((x) => enLessons[x.id]?.status === 'completed').length;
  const enNext = ALL_LESSONS.find((x) => enLessons[x.id]?.status === 'started') ?? ALL_LESSONS.find((x) => enLessons[x.id]?.status !== 'completed');

  const plan: PlanItem[] = [];
  if (dueWords > 0) plan.push({ key: 'words', Icon: Repeat, title: t('gh.wordsDue', { n: dueWords }), route: { name: 'en-review' }, english: true });
  if (mathLesson) plan.push({ key: 'math', Icon: Calculator, title: l(mathLesson.title), detail: t('nav.math'), route: { name: 'lesson', lessonId: mathLesson.id }, english: false });
  if (enNext) plan.push({ key: 'en', Icon: Languages, title: l(enNext.title), detail: t('nav.english'), route: { name: 'en-lesson', lessonId: enNext.id }, english: true });
  if (player.openMistakes > 0) plan.push({ key: 'mm', Icon: Target, title: l({ en: `${player.openMistakes} math mistakes to revisit`, ar: `${n(player.openMistakes)} أخطاء رياضيات للمراجعة` }), route: { name: 'mistakes' }, english: false });
  if (enOpen > 0) plan.push({ key: 'em', Icon: Target, title: l({ en: `${enOpen} English mistakes to revisit`, ar: `${n(enOpen)} أخطاء إنجليزية للمراجعة` }), route: { name: 'en-mistakes' }, english: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <PageHeader title={t('gh.title')} subtitle={t('gh.sub')} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} tone="warn" label={l({ en: 'Streak', ar: 'السلسلة' })} value={l({ en: `${player.streak.current} days`, ar: `${n(player.streak.current)} يومًا` })} />
        <Stat icon={Zap} tone="gold" label={t('gh.totalXp')} value={n(player.xp)} hint={`${t('gh.xpToday')}: ${n(xpToday)}`} />
        <Stat icon={Clock} tone="accent" label={t('gh.studyToday')} value={mins(minutesToday)} />
        <div className="card space-y-2 p-4">
          <p className="muted text-sm">{t('gh.dailyGoal')}</p>
          <p className="num text-xl font-bold">{n(todayRow?.questions ?? 0)}/{n(goal)}</p>
          <Bar ratio={goalRatio} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={() => go({ name: 'math' })} className="card flex cursor-pointer flex-col items-start gap-3 p-6 text-start transition-transform hover:-translate-y-0.5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Calculator size={24} /></span>
          <span className="text-xl font-bold">{t('subject.math')}</span>
          <span className="muted text-sm leading-7">{t('gh.mathCard')}</span>
          <span className="chip bg-brand-soft text-brand">{t('gh.progressTotal', { n: Math.max(0, player.xp - enXp) })}</span>
        </button>
        <button onClick={() => go({ name: 'en-home' })} className="card flex cursor-pointer flex-col items-start gap-3 border-en p-6 text-start transition-transform hover:-translate-y-0.5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-en-soft text-en"><Languages size={24} /></span>
          <span className="text-xl font-bold">{t('subject.english')}</span>
          <span className="muted text-sm leading-7">{t('gh.enCard')}</span>
          <span className="flex flex-wrap gap-2">
            <span className="chip bg-en-soft text-en">{t('gh.progressTotal', { n: enXp })}</span>
            <span className="chip bg-surface-2">{t('gh.lessonsDone', { n: enDone })}</span>
          </span>
        </button>
      </div>

      <button onClick={() => go({ name: 'en-quick' })} className="card flex w-full cursor-pointer items-center gap-3 border-en bg-en-soft p-4 text-start">
        <Zap className="text-en" size={22} />
        <span className="font-bold text-en">{t('gh.quickEnglish')}</span>
      </button>

      <section className="space-y-2">
        <h2 className="h-section">{t('gh.plan')}</h2>
        {plan.length === 0 ? (
          <p className="muted card p-4 text-sm">{t('gh.planEmpty')}</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {plan.slice(0, 6).map((p) => (
              <li key={p.key}>
                <button onClick={() => go(p.route)} className="card flex w-full cursor-pointer items-center gap-3 p-4 text-start transition-colors hover:bg-surface-2">
                  <p.Icon size={18} className={p.english ? 'text-en' : 'text-brand'} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.title}</span>
                    {p.detail && <span className="muted block text-xs">{p.detail}</span>}
                  </span>
                  <span className="muted text-xs">{t('gh.open')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
