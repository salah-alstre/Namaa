import clsx from 'clsx';
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, Clock, Compass, Flame, GraduationCap, Lightbulb, Medal, NotebookText, Play, Sparkles, Swords, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MasteryBar, Stat } from '@/components/ui';
import { LESSON_BY_ID } from '@/content/lessons';
import { TOPIC_BY_ID } from '@/content/topics';
import { recentSessions, type SessionSummary } from '@/database/repos/attempts';
import { listExams } from '@/database/repos/exams';
import { lastWeekSummary } from '@/domain/weekly';
import { recommend, strongestTopic, weakestTopic, type Recommendation } from '@/domain/recommend';
import { rankFor } from '@/domain/xp';
import { useI18n } from '@/i18n';
import { dayKey, lastNDays } from '@/lib/dates';
import { logEvent } from '@/lib/log';
import { startPractice } from '@/features/practice/quick';
import { usePlayer } from '@/stores/player';
import { useProfile } from '@/stores/profile';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { useUi } from '@/stores/ui';
import type { ExamRow } from '@/types';

interface RecentItem {
  key: string;
  at: number;
  icon: ReactNode;
  title: string;
  detail?: string;
}

function greetingKey(): 'home.greeting.morning' | 'home.greeting.afternoon' | 'home.greeting.evening' {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting.morning';
  if (h < 18) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

/** Home: where you are, what to do next, and how this week is going. */
export function Dashboard() {
  const { t, l, n, pct, lang } = useI18n();
  const go = useRouter((s) => s.go);
  const profile = useProfile((s) => s.profile);
  const dailyGoal = useSettings((s) => s.settings.dailyGoal);
  const lastWeeklySeen = useSettings((s) => s.settings.lastWeeklySeen);
  const setWeekly = useUi((s) => s.setWeekly);
  const player = usePlayer();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([recentSessions(6), listExams()])
      .then(([s, e]) => {
        if (!alive) return;
        setSessions(s);
        setExams(e.slice(0, 6));
      })
      .catch((e) => logEvent('error', `dashboard load failed: ${String(e)}`));
    return () => {
      alive = false;
    };
  }, [player.xp]);

  const today = player.today;
  const todayRow = player.activity.find((a) => a.day === today);
  const questionsToday = todayRow?.questions ?? 0;
  const correctToday = todayRow?.correct ?? 0;
  const goalRatio = dailyGoal > 0 ? Math.min(1, questionsToday / dailyGoal) : 0;

  const fresh = player.xp === 0 && Object.keys(player.lessons).length === 0 && player.activity.length === 0;
  const lesson = player.nextLessonId ? LESSON_BY_ID[player.nextLessonId] : null;
  const started = lesson ? player.lessons[lesson.id] : undefined;
  const resumeLesson = Object.values(player.lessons)
    .filter((x) => x.status === 'started' && LESSON_BY_ID[x.lessonId])
    .sort((a, b) => b.lastOpened - a.lastOpened)[0];
  const resume = resumeLesson ? LESSON_BY_ID[resumeLesson.lessonId] : null;

  const weakest = weakestTopic(player.topics);
  const strongest = strongestTopic(player.topics);
  const challengeToday = player.daily.find((d) => d.day === today);

  const week = useMemo(() => lastNDays(7, today).map((day) => ({ day, row: player.activity.find((a) => a.day === day) })), [player.activity, today]);
  const weekActive = week.filter((w) => (w.row?.questions ?? 0) > 0 || (w.row?.lessons ?? 0) > 0).length;
  const weekMax = Math.max(1, ...week.map((w) => w.row?.questions ?? 0));

  const recs = useMemo(
    () =>
      recommend({
        progress: player.topics,
        doneLessons: player.doneLessons,
        openLessons: player.openLessons,
        nextLessonId: player.nextLessonId,
        openMistakes: player.openMistakes,
      }).slice(0, 4),
    [player.topics, player.doneLessons, player.openLessons, player.nextLessonId, player.openMistakes],
  );

  const recent = useMemo<RecentItem[]>(() => {
    const items: RecentItem[] = [];
    for (const s of sessions) {
      const topic = s.topicId ? TOPIC_BY_ID[s.topicId] : null;
      items.push({
        key: `s${s.id}`,
        at: s.at,
        icon: <Zap size={16} />,
        title: topic ? l(topic.title) : t('home.recentPractice'),
        detail: t('home.recentDetail', { c: s.correct, t: s.total }),
      });
    }
    for (const x of Object.values(player.lessons)) {
      if (x.status !== 'completed' || !x.completedAt) continue;
      const les = LESSON_BY_ID[x.lessonId];
      if (!les) continue;
      items.push({ key: `l${x.lessonId}`, at: x.completedAt, icon: <BookOpen size={16} />, title: l(les.title), detail: t('home.recentLesson') });
    }
    for (const e of exams) {
      if (!e.finishedAt) continue;
      items.push({
        key: `e${e.id}`,
        at: e.finishedAt,
        icon: <ClipboardCheck size={16} />,
        title: e.title || t('home.recentExam'),
        detail: e.score !== null ? t('home.recentDetail', { c: e.score, t: e.total }) : undefined,
      });
    }
    return items.sort((a, b) => b.at - a.at).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, exams, player.lessons, t, l]);

  const streakText = player.streak.current > 0 ? (player.streak.current === 1 ? t('home.streakDay') : t('home.streakDays', { n: player.streak.current })) : '0';
  const streakHint = player.streak.doneToday ? t('home.streakDone') : player.streak.atRisk ? t('home.streakRisk') : player.streak.current === 0 ? t('home.streakStart') : t('home.streakRisk');

  const rank = t(`rank.${rankFor(player.level.level)}` as never);
  const lastWeek = lastWeekSummary(player.activity, today).week;
  const weeklyReady = lastWeek.start !== lastWeeklySeen && (lastWeek.questions > 0 || lastWeek.lessons > 0);
  const dayName = (day: string) => shortDate(lang, day, { weekday: 'short' });

  const openRec = (r: Recommendation) => {
    if (r.kind === 'next' && r.lessonId) go({ name: 'lesson', lessonId: r.lessonId });
    else if (r.kind === 'mistakes') go({ name: 'mistakes' });
    else if (r.topicId) void startPractice({ mode: 'normal', topicIds: [r.topicId], difficulty: 'adaptive', count: 10, timeLimitS: null });
  };
  const recTitle = (r: Recommendation) => {
    const topic = r.topicId ? l(TOPIC_BY_ID[r.topicId]?.title ?? { en: '', ar: '' }) : '';
    switch (r.kind) {
      case 'next':
        return t('home.rec.next', { title: r.lessonId ? l(LESSON_BY_ID[r.lessonId]?.title ?? { en: '', ar: '' }) : '' });
      case 'mistakes':
        return t('home.rec.mistakes', { n: r.count ?? 0 });
      default:
        return t(`home.rec.${r.kind}` as never, { title: topic });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="card anim-fade flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="muted text-sm">{t(greetingKey())}</p>
          <h1 className="h-page">{fresh ? t('home.welcomeNew') : profile.name ? t('home.welcome', { name: profile.name }) : t('home.welcomeNoName')}</h1>
          {fresh ? (
            <p className="muted">{t('home.welcomeNewBody')}</p>
          ) : (
            <p className="muted flex flex-wrap items-center gap-x-3">
              <span className="font-medium text-ink-2">{t('home.levelLine', { n: player.level.level, rank })}</span>
              <span className="num text-sm">{t('home.xpToNext', { n: Math.max(0, player.level.needed - player.level.into), next: player.level.level + 1 })}</span>
            </p>
          )}
          <div className="progress mt-2 max-w-sm" role="progressbar" aria-valuenow={Math.round(player.level.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.round(player.level.progress * 100)}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {resume && resume.id !== lesson?.id ? (
            <button className="btn btn-primary btn-lg" onClick={() => go({ name: 'lesson', lessonId: resume.id })}>
              <Play size={18} /> {t('home.continueLesson')}
            </button>
          ) : lesson ? (
            <button className="btn btn-primary btn-lg" onClick={() => go({ name: 'lesson', lessonId: lesson.id })}>
              <Play size={18} /> {started ? t('home.continueLearning') : t('home.startLesson')}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => go({ name: 'practice' })}>
              <Zap size={18} /> {t('nav.practice')}
            </button>
          )}
        </div>
      </section>

      {weeklyReady && (
        <button className="card-flat anim-fade flex w-full items-center justify-between gap-3 !border-brand bg-brand-soft text-start" onClick={() => setWeekly(true)}>
          <span className="flex items-center gap-2 font-medium text-brand">
            <CalendarDays size={18} /> {t('home.weeklyReady')}
          </span>
          <span className="btn btn-soft btn-sm">{t('home.weeklyOpen')}</span>
        </button>
      )}

      {/* Lesson + goal + streak */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card flex flex-col gap-3 lg:col-span-1">
          <h2 className="h-section flex items-center gap-2">
            <GraduationCap size={18} className="text-brand" /> {t('home.todayLesson')}
          </h2>
          {lesson ? (
            <>
              <div>
                <p className="text-lg font-semibold">{l(lesson.title)}</p>
                <p className="muted text-sm">{l(lesson.summary)}</p>
              </div>
              <div className="muted flex items-center gap-3 text-sm">
                <span className="chip">{t('common.level', { n: lesson.level })}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> {t('common.minutes', { n: lesson.minutes })}
                </span>
              </div>
              {started && started.status === 'started' && <p className="text-sm text-brand">{t('home.continueStep', { n: started.step + 1, total: 6 })}</p>}
              <button className="btn btn-soft mt-auto self-start" onClick={() => go({ name: 'lesson', lessonId: lesson.id })}>
                {started ? t('home.continueLearning') : t('home.startLesson')} <ArrowRight size={16} className="rtl:rotate-180" />
              </button>
            </>
          ) : (
            <p className="muted">{t('home.todayLessonNone')}</p>
          )}
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="h-section flex items-center gap-2">
            <Target size={18} className="text-accent" /> {t('home.goal')}
          </h2>
          <p className="num text-2xl font-semibold">{t('home.goalProgress', { n: questionsToday, goal: dailyGoal })}</p>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(goalRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.round(goalRatio * 100)}%` }} />
          </div>
          <p className="muted text-sm">{questionsToday >= dailyGoal ? t('home.goalDone') : t('home.goalLeft', { n: Math.max(0, dailyGoal - questionsToday) })}</p>
          <button className="btn btn-soft mt-auto self-start" onClick={() => go({ name: 'practice' })}>
            <Zap size={16} /> {t('nav.practice')}
          </button>
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="h-section flex items-center gap-2">
            <Flame size={18} className="text-warn" /> {t('home.streak')}
          </h2>
          <p className="num text-2xl font-semibold">{streakText}</p>
          <p className="muted text-sm">{streakHint}</p>
          <p className="muted mt-auto text-sm">{t('home.streakBest', { n: player.streak.longest })}</p>
        </section>
      </div>

      {/* Today stats */}
      <section aria-label={t('home.today')} className="space-y-3">
        <h2 className="h-section">{t('home.today')}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Compass} tone="brand" label={t('home.questions')} value={n(questionsToday, 0)} />
          <Stat icon={Medal} tone="good" label={t('home.accuracy')} value={questionsToday > 0 ? pct(correctToday / questionsToday) : '—'} />
          <Stat icon={Clock} tone="accent" label={t('home.studyTime')} value={t('common.minutes', { n: todayRow?.minutes ?? 0 })} />
          <Stat icon={Sparkles} tone="gold" label={t('home.xp')} value={n(todayRow?.xp ?? 0, 0)} />
        </div>
      </section>

      {/* Weakest / strongest */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopicCard
          icon={<TrendingDown size={18} className="text-bad" />}
          title={t('home.weakest')}
          empty={t('home.needMore')}
          topicId={weakest?.topicId}
          mastery={weakest?.mastery}
          action={
            weakest && (
              <button
                className="btn btn-soft btn-sm"
                onClick={() => void startPractice({ mode: 'normal', topicIds: [weakest.topicId], difficulty: 'adaptive', count: 10, timeLimitS: null })}
              >
                {t('home.practiceTopic')}
              </button>
            )
          }
        />
        <TopicCard icon={<TrendingUp size={18} className="text-good" />} title={t('home.strongest')} empty={t('home.needMore')} topicId={strongest?.topicId} mastery={strongest?.mastery} />
      </div>

      {/* Challenge + week */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card flex flex-col gap-3">
          <h2 className="h-section flex items-center gap-2">
            <Swords size={18} className="text-gold" /> {t('home.challenge')}
          </h2>
          <p className="muted text-sm">{challengeToday?.completed ? t('home.challengeDone', { c: challengeToday.score, t: challengeToday.total }) : t('home.challengeBody')}</p>
          <button className="btn btn-soft mt-auto self-start" onClick={() => go({ name: 'challenges' })}>
            {t('home.challengeGo')}
          </button>
        </section>

        <section className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="h-section flex items-center gap-2">
              <CalendarDays size={18} className="text-brand" /> {t('home.week')}
            </h2>
            <span className="muted text-sm">{weekActive > 0 ? t('home.weekDays', { n: weekActive }) : t('home.weekEmpty')}</span>
          </div>
          <div className="flex h-24 items-end gap-2" role="img" aria-label={t('home.week')}>
            {week.map(({ day, row }) => {
              const q = row?.questions ?? 0;
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end">
                    <div
                      className={clsx('w-full rounded-md transition-all', q > 0 ? 'bg-brand' : 'bg-surface-3', day === today && 'ring-2 ring-brand/40')}
                      style={{ height: `${q > 0 ? Math.max(12, (q / weekMax) * 100) : 8}%` }}
                      title={`${q}`}
                    />
                  </div>
                  <span className="muted text-[11px]">{dayName(day)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recommended + recent */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="h-section flex items-center gap-2">
            <Lightbulb size={18} className="text-gold" /> {t('home.recommended')}
          </h2>
          {recs.length === 0 ? (
            <p className="muted text-sm">{t('home.recEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {recs.map((r, i) => (
                <li key={`${r.kind}${i}`}>
                  <button className="card-flat flex w-full items-center gap-3 !p-3 text-start transition-colors hover:border-brand" onClick={() => openRec(r)}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      {r.kind === 'mistakes' ? <NotebookText size={18} /> : r.kind === 'next' ? <BookOpen size={18} /> : <Zap size={18} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{recTitle(r)}</span>
                      <span className="muted block text-sm">{t(`home.rec.${r.kind}Why` as never)}</span>
                    </span>
                    <ArrowRight size={16} className="muted shrink-0 rtl:rotate-180" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!profile.placementDone && (
            <div className="rounded-xl bg-accent-soft p-4">
              <p className="font-medium text-accent">{t('home.placement')}</p>
              <p className="muted mt-1 text-sm">{t('home.placementBody')}</p>
              <button className="btn btn-soft btn-sm mt-3" onClick={() => go({ name: 'placement' })}>
                {t('home.placementGo')}
              </button>
            </div>
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="h-section">{t('home.recent')}</h2>
          {recent.length === 0 ? (
            <p className="muted text-sm">{t('home.recentEmpty')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li key={r.key} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">{r.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.title}</span>
                    {r.detail && <span className="muted block text-sm">{r.detail}</span>}
                  </span>
                  <span className="muted num shrink-0 text-xs">{when(r.at, today, t, lang)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function shortDate(lang: string, day: string | number, opts: Intl.DateTimeFormatOptions): string {
  const d = typeof day === 'number' ? new Date(day) : new Date(`${day}T12:00:00`);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en', opts).format(d);
}

function when(at: number, today: string, t: ReturnType<typeof useI18n>['t'], lang: string): string {
  const d = dayKey(at);
  if (d === today) return t('common.today');
  const yesterday = dayKey(new Date(`${today}T12:00:00`).getTime() - 86_400_000);
  if (d === yesterday) return t('common.yesterday');
  return shortDate(lang, at, { day: 'numeric', month: 'short' });
}

function TopicCard({ icon, title, empty, topicId, mastery, action }: { icon: ReactNode; title: string; empty: string; topicId?: string; mastery?: number; action?: ReactNode }) {
  const { l } = useI18n();
  const topic = topicId ? TOPIC_BY_ID[topicId] : null;
  return (
    <section className="card space-y-3">
      <h2 className="h-section flex items-center gap-2">
        {icon} {title}
      </h2>
      {topic && mastery !== undefined ? (
        <>
          <p className="text-lg font-semibold">{l(topic.title)}</p>
          <MasteryBar value={mastery} showLabel />
          {action}
        </>
      ) : (
        <p className="muted text-sm">{empty}</p>
      )}
    </section>
  );
}
