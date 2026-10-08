import { BookOpen, Repeat, Target, Zap } from 'lucide-react';
import { ALL_LESSONS } from '@/content/english';
import { SKILL_ORDER } from '@/english-engine/progress';
import { estimateMinutes, QUICK_TARGET } from '@/english-engine/session';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { Bar, PageHeader } from '@/components/ui';

const SKILL_LABEL = {
  vocab: { en: 'Vocabulary', ar: 'المفردات' },
  grammar: { en: 'Grammar', ar: 'القواعد' },
  listening: { en: 'Listening', ar: 'الاستماع' },
  reading: { en: 'Reading', ar: 'القراءة' },
  writing: { en: 'Writing', ar: 'الكتابة' },
} as const;

const SKILL_ROUTE = { vocab: 'en-vocab', grammar: 'en-grammar', listening: 'en-listening', reading: 'en-reading', writing: 'en-writing' } as const;

export function EnHome() {
  const { l, n, t } = useI18n();
  const go = useRouter((s) => s.go);
  const lessons = useEnglish((s) => s.lessons);
  const vocab = useEnglish((s) => s.vocab);
  const placements = useEnglish((s) => s.placements);
  const attempts = useEnglish((s) => s.attempts);
  const reviewedToday = useEnglish((s) => s.reviewedToday);
  const dueWords = useEnglish((s) => s.dueWords);
  const mistakes = useEnglish((s) => s.mistakes);
  const goal = useSettings((s) => s.settings.enDailyGoal) ?? 10;

  const due = dueWords().length;
  const open = mistakes.filter((m) => !m.understood).length;
  const started = ALL_LESSONS.find((x) => lessons[x.id]?.status === 'started');
  const next = started ?? ALL_LESSONS.find((x) => lessons[x.id]?.status !== 'completed');
  const done = ALL_LESSONS.filter((x) => lessons[x.id]?.status === 'completed').length;
  const todayCount = attempts.today + reviewedToday;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader title={t('nav.en.home')} subtitle={l({ en: 'What should I do today? Start here.', ar: 'ماذا أفعل اليوم؟ ابدأ من هنا.' })} />

      <button
        onClick={() => go({ name: 'en-quick' })}
        className="card flex w-full cursor-pointer items-center gap-4 border-en bg-en-soft p-6 text-start transition-transform hover:-translate-y-0.5"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-en text-white"><Zap size={28} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold text-en">{t('gh.quickEnglish')}</span>
          <span className="muted block text-sm">
            {l({ en: `${QUICK_TARGET} quick steps · about ${estimateMinutes(QUICK_TARGET)} minutes. Due words, past mistakes and a bit of your next lesson.`, ar: `${n(QUICK_TARGET)} خطوات سريعة · نحو ${n(estimateMinutes(QUICK_TARGET))} دقائق. كلمات مستحقة وأخطاء سابقة وجزء من درسك القادم.` })}
          </span>
        </span>
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="card space-y-2 p-5">
          <div className="flex items-center gap-2"><BookOpen size={18} className="text-en" /><h2 className="h-section">{l({ en: 'Continue learning', ar: 'تابع التعلم' })}</h2></div>
          {next ? (
            <>
              <p className="font-semibold">{l(next.title)}</p>
              <p className="muted text-sm">{started ? l({ en: 'Pick up where you stopped.', ar: 'أكمل من حيث توقفت.' }) : l({ en: 'Your next lesson.', ar: 'درسك التالي.' })}</p>
              <button className="btn btn-sm" onClick={() => go({ name: 'en-lesson', lessonId: next.id })}>{t('gh.continue')}</button>
            </>
          ) : (
            <p className="muted text-sm">{l({ en: 'You finished every lesson. Great work!', ar: 'أنهيت كل الدروس. عمل رائع!' })}</p>
          )}
        </section>
        <section className="card space-y-2 p-5">
          <div className="flex items-center gap-2"><Repeat size={18} className="text-en" /><h2 className="h-section">{t('gh.wordsDue', { n: due })}</h2></div>
          <p className="muted text-sm">{Object.keys(vocab).length === 0 ? l({ en: 'Finish a lesson to start collecting words.', ar: 'أكمل درسًا لتبدأ بجمع الكلمات.' }) : l({ en: 'A few minutes keeps them in memory.', ar: 'بضع دقائق تُبقيها في الذاكرة.' })}</p>
          <button className="btn btn-sm" disabled={due === 0} onClick={() => go({ name: 'en-review' })}>{t('gh.start')}</button>
        </section>
        <section className="card space-y-2 p-5">
          <div className="flex items-center gap-2"><Target size={18} className="text-en" /><h2 className="h-section">{l({ en: 'Today', ar: 'اليوم' })}</h2></div>
          <p className="num text-2xl font-bold">{n(todayCount)}<span className="muted text-sm"> / {n(goal)}</span></p>
          <Bar ratio={Math.min(1, todayCount / goal)} />
          <p className="muted text-xs">{l({ en: 'answers and reviews today', ar: 'إجابات ومراجعات اليوم' })}</p>
        </section>
      </div>

      {!placements[0] && (
        <section className="card flex flex-wrap items-center gap-3 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="h-section">{l({ en: 'Not sure where to start?', ar: 'لست متأكدًا من أين تبدأ؟' })}</h2>
            <p className="muted text-sm">{l({ en: 'A short adaptive test (15–25 questions) suggests your level. Nothing gets locked.', ar: 'اختبار قصير متكيّف (١٥–٢٥ سؤالًا) يقترح مستواك. لا شيء يُقفل.' })}</p>
          </div>
          <button className="btn-soft" onClick={() => go({ name: 'en-placement' })}>{t('nav.en.placement')}</button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="h-section">{l({ en: 'Skills', ar: 'المهارات' })}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SKILL_ORDER.map((s) => (
            <button key={s} className="card cursor-pointer p-4 text-center text-sm font-semibold transition-colors hover:bg-surface-2" onClick={() => go({ name: SKILL_ROUTE[s] } as never)}>
              {l(SKILL_LABEL[s])}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="chip cursor-pointer" onClick={() => go({ name: 'en-mistakes' })}>{l({ en: `Mistakes to review: ${open}`, ar: `أخطاء للمراجعة: ${n(open)}` })}</button>
          <button className="chip cursor-pointer" onClick={() => go({ name: 'en-speaking' })}>{t('nav.en.speaking')}</button>
          <span className="chip">{l({ en: `${done}/${ALL_LESSONS.length} lessons`, ar: `${n(done)}/${n(ALL_LESSONS.length)} درسًا` })}</span>
        </div>
      </section>
    </div>
  );
}
