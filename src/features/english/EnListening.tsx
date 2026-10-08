import { Eye, EyeOff, Headphones, Play, RotateCcw, Turtle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LEVELS, LISTENING } from '@/content/english';
import type { ListeningItem } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { speak, speechPossible, speeds, stopSpeaking } from '@/lib/tts';
import { useSettings } from '@/stores/settings';
import { EmptyState, PageHeader } from '@/components/ui';
import { EnglishText } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';
import { ExerciseRun } from './EnPractice';

function Player({ item, onBack }: { item: ListeningItem; onBack: () => void }) {
  const { l, n } = useI18n();
  const showAr = useSettings((s) => s.settings.enShowTranslation) ?? true;
  const [playing, setPlaying] = useState(-1);
  const [showText, setShowText] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const token = useRef(0);
  const lastSlow = useRef(false);

  useEffect(() => () => { token.current++; stopSpeaking(); }, []);

  const playAll = async (slow: boolean) => {
    stopSpeaking();
    const my = ++token.current;
    lastSlow.current = slow;
    const sp = speeds();
    for (let i = 0; i < item.lines.length; i++) {
      if (my !== token.current) return;
      setPlaying(i);
      const res = await speak(item.lines[i]!.text, { speed: slow ? sp.slow : sp.normal });
      if (!res.ok) break;
    }
    if (my === token.current) setPlaying(-1);
  };
  const stop = () => { token.current++; stopSpeaking(); setPlaying(-1); };

  if (quiz) {
    return <ExerciseRun exercises={item.questions} onExit={() => { setQuiz(false); onBack(); }} exitLabel={l({ en: 'Back to listening', ar: 'العودة إلى الاستماع' })} />;
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-6">
        {!speechPossible() && <p className="chip bg-warn-soft text-warn">{l({ en: 'Speech is not available here, so read the transcript instead.', ar: 'النطق غير متاح هنا، لذا اقرأ النص بدلًا من ذلك.' })}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={() => (playing >= 0 ? stop() : void playAll(false))}><Play size={16} /> {playing >= 0 ? l({ en: 'Stop', ar: 'إيقاف' }) : l({ en: 'Play', ar: 'تشغيل' })}</button>
          <button className="btn-soft btn-sm" onClick={() => void playAll(true)} title={l({ en: 'Play slowly', ar: 'تشغيل ببطء' })}><Turtle size={15} /> {l({ en: 'Slow', ar: 'ببطء' })}</button>
          <button className="btn-soft btn-sm" onClick={() => void playAll(lastSlow.current)} title={l({ en: 'Replay', ar: 'أعد التشغيل' })}><RotateCcw size={15} /> {l({ en: 'Replay', ar: 'إعادة' })}</button>
          <button className="btn-ghost btn-sm" onClick={() => setShowText((x) => !x)}>{showText ? <EyeOff size={15} /> : <Eye size={15} />} {showText ? l({ en: 'Hide transcript', ar: 'إخفاء النص' }) : l({ en: 'Reveal transcript', ar: 'إظهار النص' })}</button>
        </div>
        {showText && (
          <ul className="space-y-2">
            {item.lines.map((ln, i) => (
              <li key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${playing === i ? 'border-en bg-en-soft' : 'border-line'}`}>
                <div className="min-w-0 flex-1">
                  {ln.who && <EnglishText className="chip me-2">{ln.who}</EnglishText>}
                  <EnglishText>{ln.text}</EnglishText>
                  {showAr && <p className="muted text-sm">{ln.ar}</p>}
                </div>
                <SpeakButton text={ln.text} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => { stop(); setQuiz(true); }}>{l({ en: `Answer ${item.questions.length} questions`, ar: `أجب عن ${n(item.questions.length)} أسئلة` })}</button>
        <button className="btn-ghost" onClick={() => { stop(); onBack(); }}>{l({ en: 'Back', ar: 'رجوع' })}</button>
      </div>
    </div>
  );
}

export function EnListening() {
  const { l, t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const item = LISTENING.find((x) => x.id === openId);

  if (item) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 p-6">
        <PageHeader title={l(item.title)} subtitle={l({ en: 'Listen first. Check the transcript only if you need it.', ar: 'استمع أولًا. افتح النص فقط عند الحاجة.' })} />
        <Player item={item} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <PageHeader title={t('nav.en.listening')} subtitle={l({ en: 'Natural spoken English with questions. The transcript stays hidden until you ask.', ar: 'إنجليزية منطوقة بصوت طبيعي مع أسئلة. يبقى النص مخفيًا حتى تطلبه.' })} />
      {LISTENING.length === 0 && <EmptyState icon={Headphones} title={l({ en: 'No listening items', ar: 'لا توجد مواد استماع' })} />}
      {LEVELS.map((lv) => {
        const items = LISTENING.filter((x) => x.level === lv.id);
        if (items.length === 0) return null;
        return (
          <section key={lv.id} className="space-y-2">
            <h2 className="h-section"><EnglishText>{lv.code}</EnglishText> · {l(lv.name)}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((x) => (
                <li key={x.id}>
                  <button className="card flex w-full cursor-pointer items-center gap-3 p-4 text-start transition-colors hover:bg-surface-2" onClick={() => setOpenId(x.id)}>
                    <Headphones size={18} className="text-en" />
                    <span className="font-semibold">{l(x.title)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
