import { ArrowLeft, ArrowRight, BookOpen, Dumbbell } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ALL_EXERCISES, GRAMMAR, GRAMMAR_BY_ID, LEVELS } from '@/content/english';
import { useI18n } from '@/i18n';
import { useRouter } from '@/stores/router';
import { EmptyState, PageHeader } from '@/components/ui';
import { EnglishText, Mixed } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';

export function EnGrammar({ topicId }: { topicId?: string }) {
  const { l, t, isRtl } = useI18n();
  const go = useRouter((s) => s.go);
  const topic = topicId ? GRAMMAR_BY_ID[topicId] : undefined;

  if (topicId && !topic) {
    return <EmptyState icon={BookOpen} title={l({ en: 'Topic not found', ar: 'الموضوع غير موجود' })} action={<button className="btn" onClick={() => go({ name: 'en-grammar' })}>{t('nav.en.grammar')}</button>} />;
  }

  if (topic) {
    const drills = ALL_EXERCISES.filter((e) => e.pattern === topic.pattern).length;
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-6">
        <PageHeader
          title={l(topic.title)}
          subtitle={l(topic.summary)}
          back={<button className="btn-ghost btn-sm mb-2" onClick={() => go({ name: 'en-grammar' })}>{isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {t('nav.en.grammar')}</button>}
          actions={drills > 0 ? <button className="btn-soft btn-sm" onClick={() => go({ name: 'en-practice', pattern: topic.pattern })}><Dumbbell size={15} /> {l({ en: `Practise (${drills})`, ar: 'تدرّب' })}</button> : undefined}
        />
        <section className="card space-y-3 p-5">
          {topic.body.map((b, i) => (
            <p key={i} className="leading-8"><Mixed text={l(b)} /></p>
          ))}
        </section>
        {topic.patterns.length > 0 && (
          <section className="card space-y-2 border-en bg-en-soft p-5">
            <h2 className="h-section">{l({ en: 'Pattern', ar: 'النمط' })}</h2>
            {topic.patterns.map((p, i) => (
              <EnglishText key={i} block className="font-mono text-base font-semibold text-en">{p}</EnglishText>
            ))}
          </section>
        )}
        <section className="card space-y-3 p-5">
          <h2 className="h-section">{l({ en: 'Examples', ar: 'أمثلة' })}</h2>
          <ul className="space-y-2">
            {topic.examples.map((ex, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <div className="min-w-0 flex-1">
                  <EnglishText block className="font-semibold">{ex.en}</EnglishText>
                  <span className="muted text-sm">{ex.ar}</span>
                </div>
                <SpeakButton text={ex.en} size="sm" />
              </li>
            ))}
          </ul>
        </section>
        {topic.mistakes.length > 0 && (
          <section className="card space-y-3 p-5">
            <h2 className="h-section">{l({ en: 'Common mistakes', ar: 'أخطاء شائعة' })}</h2>
            <ul className="space-y-3">
              {topic.mistakes.map((m, i) => (
                <li key={i} className="space-y-1 rounded-xl bg-surface-2 p-3">
                  <p><span className="chip bg-bad-soft text-bad">✗</span> <EnglishText className="line-through opacity-80">{m.wrong}</EnglishText></p>
                  <p><span className="chip bg-good-soft text-good">✓</span> <EnglishText className="font-semibold">{m.right}</EnglishText></p>
                  <p className="muted text-sm"><Mixed text={l(m.note)} /></p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return <GrammarList isRtl={isRtl} />;
}

function GrammarList({ isRtl }: { isRtl: boolean }) {
  const { l, t } = useI18n();
  const go = useRouter((s) => s.go);
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LEVELS.map((lv) => ({
      lv,
      items: GRAMMAR.filter((g) => g.level === lv.id && (!needle || g.title.en.toLowerCase().includes(needle) || g.title.ar.includes(needle))),
    })).filter((g) => g.items.length > 0);
  }, [q]);
  const Chevron = isRtl ? ArrowLeft : ArrowRight;
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <PageHeader title={t('nav.en.grammar')} subtitle={l({ en: 'Short, clear rules with examples and the mistakes to avoid.', ar: 'قواعد قصيرة وواضحة مع أمثلة وأخطاء يجب تجنبها.' })} />
      <input className="input" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder={l({ en: 'Search grammar', ar: 'ابحث في القواعد' })} aria-label={l({ en: 'Search grammar', ar: 'ابحث في القواعد' })} />
      {groups.length === 0 && <p className="muted py-8 text-center">{l({ en: 'No topics match.', ar: 'لا توجد مواضيع مطابقة.' })}</p>}
      {groups.map(({ lv, items }) => (
        <section key={lv.id} className="space-y-2">
          <h2 className="h-section"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((g) => (
              <li key={g.id}>
                <button className="card flex w-full cursor-pointer items-center gap-3 p-4 text-start transition-colors hover:bg-surface-2" onClick={() => go({ name: 'en-grammar', topicId: g.id })}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{l(g.title)}</span>
                    <span className="muted block truncate text-sm">{l(g.summary)}</span>
                  </span>
                  <Chevron size={16} className="text-ink-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
