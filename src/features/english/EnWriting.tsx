import { CheckCircle2, Circle, PenLine } from 'lucide-react';
import { useState } from 'react';
import { LEVELS, WRITING } from '@/content/english';
import type { WritingPrompt } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { useEnglish } from '@/stores/english';
import { PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** Deterministic checks: length, a capital letter, end punctuation and the prompt's expected ideas. */
export function checkWriting(p: WritingPrompt, body: string): { label: { en: string; ar: string }; ok: boolean }[] {
  const text = body.trim();
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ')} `;
  const checks = [
    { label: { en: `At least ${p.minWords} words`, ar: `${p.minWords} كلمات على الأقل` }, ok: wordCount(text) >= p.minWords },
    { label: { en: 'Starts with a capital letter', ar: 'يبدأ بحرف كبير' }, ok: /^[A-Z]/.test(text) },
    { label: { en: 'Ends with . ! or ?', ar: 'ينتهي بعلامة ترقيم' }, ok: /[.!?]["')]?$/.test(text) },
  ];
  for (const e of p.expect) {
    checks.push({ label: e.label, ok: e.any.some((w) => lower.includes(` ${w.toLowerCase()} `)) });
  }
  return checks;
}

function Editor({ p, onBack }: { p: WritingPrompt; onBack: () => void }) {
  const { l, n } = useI18n();
  const saveWriting = useEnglish((s) => s.saveWriting);
  const [body, setBody] = useState('');
  const [result, setResult] = useState<ReturnType<typeof checkWriting> | null>(null);
  const words = wordCount(body);

  const submit = async () => {
    const checks = checkWriting(p, body);
    setResult(checks);
    await saveWriting(p.id, body.trim(), checks.map((c) => ({ label: c.label.en, ok: c.ok })));
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-6">
        <p className="leading-8">{l(p.prompt)}</p>
        {p.frames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.frames.map((f) => (
              <button key={f} type="button" className="chip cursor-pointer" onClick={() => setBody((b) => (b ? `${b} ${f}` : f))}><EnglishText>{f}</EnglishText></button>
            ))}
          </div>
        )}
        <textarea dir="ltr" className="input min-h-40 text-start text-lg leading-8" value={body} onChange={(e) => { setBody(e.target.value); setResult(null); }} aria-label={l({ en: 'Your writing', ar: 'كتابتك' })} spellCheck />
        <div className="flex items-center justify-between">
          <span className="muted num text-sm">{l({ en: `${words} words`, ar: `${n(words)} كلمة` })}</span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onBack}>{l({ en: 'Back', ar: 'رجوع' })}</button>
            <button className="btn" disabled={words === 0} onClick={submit}>{l({ en: 'Check my writing', ar: 'افحص كتابتي' })}</button>
          </div>
        </div>
      </div>
      {result && (
        <div className="card space-y-3 p-6">
          <h2 className="h-section">{l({ en: 'Checklist', ar: 'قائمة الفحص' })}</h2>
          <p className="muted text-sm">{l({ en: 'This is a simple rule-based check, not a grade. Compare with the sample below.', ar: 'هذا فحص بسيط قائم على قواعد وليس تقييمًا. قارن بالنموذج أدناه.' })}</p>
          <ul className="space-y-1">
            {result.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {c.ok ? <CheckCircle2 size={17} className="text-good" /> : <Circle size={17} className="text-warn" />}
                <span>{l(c.label)}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="muted mb-1 text-xs">{l({ en: 'Sample answer', ar: 'إجابة نموذجية' })}</p>
            <EnglishText block className="leading-8">{p.sample}</EnglishText>
          </div>
        </div>
      )}
    </div>
  );
}

export function EnWriting() {
  const { l, t } = useI18n();
  const writing = useEnglish((s) => s.writing);
  const [openId, setOpenId] = useState<string | null>(null);
  const p = WRITING.find((x) => x.id === openId);

  if (p) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-6">
        <PageHeader title={l(p.title)} subtitle={l({ en: 'Write in English, then check it against a checklist.', ar: 'اكتب بالإنجليزية ثم افحصها بقائمة فحص.' })} />
        <Editor key={p.id} p={p} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader title={t('nav.en.writing')} subtitle={l({ en: 'Short guided tasks. Your answers are saved on this device.', ar: 'مهام قصيرة موجهة. تُحفظ إجاباتك على هذا الجهاز.' })} />
      {LEVELS.map((lv) => {
        const items = WRITING.filter((x) => x.level === lv.id);
        if (items.length === 0) return null;
        return (
          <section key={lv.id} className="space-y-2">
            <h2 className="h-section"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((x) => {
                const done = writing.some((w) => w.promptId === x.id);
                return (
                  <li key={x.id}>
                    <button className="card flex w-full cursor-pointer items-center gap-3 p-4 text-start transition-colors hover:bg-surface-2" onClick={() => setOpenId(x.id)}>
                      <PenLine size={18} className="text-en" />
                      <span className="min-w-0 flex-1 font-semibold">{l(x.title)}</span>
                      {done && <CheckCircle2 size={16} className="text-good" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
