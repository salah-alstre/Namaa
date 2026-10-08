import { BookOpen, GraduationCap, Layers, Sparkles, Target, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { ALL_LESSONS, LEVELS, WORDS, lessonsOfLevel } from '@/content/english';
import { levelPercent, SKILL_ORDER } from '@/english-engine/progress';
import { wordMastery } from '@/english-engine/srs';
import type { EnSkill } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { useRouter } from '@/stores/router';
import { Bar, PageHeader, Stat } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';

const SKILL_LABEL: Record<EnSkill, { en: string; ar: string }> = {
  vocab: { en: 'Vocabulary', ar: 'المفردات' },
  grammar: { en: 'Grammar', ar: 'القواعد' },
  listening: { en: 'Listening', ar: 'الاستماع' },
  reading: { en: 'Reading', ar: 'القراءة' },
  writing: { en: 'Writing', ar: 'الكتابة' },
};

export function EnProgress() {
  const { l, n, pct, t } = useI18n();
  const go = useRouter((s) => s.go);
  const lessons = useEnglish((s) => s.lessons);
  const vocab = useEnglish((s) => s.vocab);
  const skills = useEnglish((s) => s.skills);
  const attempts = useEnglish((s) => s.attempts);
  const xp = useEnglish((s) => s.xp);
  const placement = useEnglish((s) => s.placements[0]);

  const counts = useMemo(() => {
    const c = { new: 0, learning: 0, familiar: 0, mastered: 0 };
    for (const w of WORDS) c[wordMastery(vocab[w.id] ?? null)]++;
    return c;
  }, [vocab]);
  const done = ALL_LESSONS.filter((x) => lessons[x.id]?.status === 'completed').length;
  const acc = attempts.total ? attempts.correct / attempts.total : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader title={t('nav.en.progress')} subtitle={l({ en: 'Your English by level and by skill.', ar: 'إنجليزيتك حسب المستوى وحسب المهارة.' })} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={Zap} label={l({ en: 'English XP', ar: 'نقاط الإنجليزية' })} value={n(xp)} />
        <Stat icon={GraduationCap} label={l({ en: 'Lessons', ar: 'الدروس' })} value={`${n(done)}/${n(ALL_LESSONS.length)}`} />
        <Stat icon={Layers} label={l({ en: 'Words learning', ar: 'كلمات قيد التعلم' })} value={n(WORDS.length - counts.new)} />
        <Stat icon={Target} label={l({ en: 'Accuracy', ar: 'الدقة' })} value={attempts.total ? pct(acc) : '—'} />
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="h-section">{l({ en: 'Skills', ar: 'المهارات' })}</h2>
        {SKILL_ORDER.map((s) => {
          const r = skills[s];
          const m = r?.mastery ?? 0;
          return (
            <div key={s} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{l(SKILL_LABEL[s])}</span>
                <span className="muted num">{r && r.attempts > 0 ? `${pct(m / 100)} · ${l({ en: `${r.attempts} answers`, ar: `${n(r.attempts)} إجابة` })}` : l({ en: 'Not started', ar: 'لم تبدأ' })}</span>
              </div>
              <Bar ratio={m / 100} />
            </div>
          );
        })}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="h-section">{l({ en: 'Levels', ar: 'المستويات' })}</h2>
        {LEVELS.map((lv) => {
          const ls = lessonsOfLevel(lv.id);
          const d = ls.filter((x) => lessons[x.id]?.status === 'completed').length;
          return (
            <div key={lv.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</span>
                <span className="muted num">{n(d)}/{n(ls.length)}</span>
              </div>
              <Bar ratio={levelPercent(d, ls.length) / 100} />
            </div>
          );
        })}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="h-section">{l({ en: 'Vocabulary', ar: 'المفردات' })}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Sparkles} label={l({ en: 'New', ar: 'جديدة' })} value={n(counts.new)} />
          <Stat icon={BookOpen} label={l({ en: 'Learning', ar: 'قيد التعلم' })} value={n(counts.learning)} />
          <Stat icon={Layers} label={l({ en: 'Familiar', ar: 'مألوفة' })} value={n(counts.familiar)} />
          <Stat icon={GraduationCap} label={l({ en: 'Mastered', ar: 'متقنة' })} value={n(counts.mastered)} />
        </div>
      </section>

      <section className="card flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="h-section">{t('nav.en.placement')}</h2>
          <p className="muted text-sm">{placement ? l({ en: `Last result: ${placement.level.toUpperCase()}`, ar: `آخر نتيجة: ${placement.level.toUpperCase()}` }) : l({ en: 'Find out where to start.', ar: 'اعرف من أين تبدأ.' })}</p>
        </div>
        <button className="btn-soft" onClick={() => go({ name: 'en-placement' })}>{placement ? l({ en: 'Retake', ar: 'أعد الاختبار' }) : l({ en: 'Take the test', ar: 'ابدأ الاختبار' })}</button>
      </section>
    </div>
  );
}
