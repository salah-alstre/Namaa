import clsx from 'clsx';
import { Check, Lightbulb, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EnglishText, Mixed } from '@/components/EnglishText';
import { SpeakButton } from '@/components/SpeakButton';
import type { Exercise, Response } from '@/english-engine/types';
import { useI18n } from '@/i18n';
import { speak } from '@/lib/tts';
import { useEnglish } from '@/stores/english';
import { gradeExercise } from '@/english-engine/grade';
import { useSettings } from '@/stores/settings';

export interface ExerciseOutcome {
  correct: boolean;
  close?: boolean;
  expected: string;
  given: string;
  xp: number;
}

/** Deterministic shuffle so a re-render never reorders the bank. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function shuffled<T>(items: T[], seed: string, avoid?: T[]): T[] {
  const rnd = seeded(seed);
  for (let attempt = 0; attempt < 6; attempt++) {
    const a = items.map((x, i) => ({ x, k: rnd() + i * 0 }));
    a.sort((p, q) => p.k - q.k);
    const out = a.map((p) => p.x);
    if (!avoid || out.length < 2 || out.join('\u0000') !== avoid.join('\u0000')) return out;
  }
  return [...items].reverse();
}

const CHOICE_KINDS = ['mcq', 'en-ar', 'ar-en', 'choose-word', 'choose-sentence', 'complete-sentence', 'listen-choose', 'reading-comp'];
const TEXT_KINDS = ['fill-blank', 'grammar-fix', 'listen-type', 'vocab-recall', 'short-written'];

/** Renders any of the 17 exercise kinds, grades through the English store, and shows feedback. */
export function ExerciseView({
  exercise: ex,
  onDone,
  nextLabel,
  autoFocus = true,
  record = true,
}: {
  exercise: Exercise;
  onDone: (o: ExerciseOutcome) => void;
  nextLabel?: string;
  autoFocus?: boolean;
  /** false = grade only (placement test): no attempt, mistake or XP is stored. */
  record?: boolean;
}) {
  const { l, t } = useI18n();
  const answer = useEnglish((s) => s.answer);
  const autoPlay = useSettings((s) => s.settings.enAutoPlay);
  const showHelp = useSettings((s) => s.settings.enArabicHelp);

  const started = useRef(Date.now());
  const [choice, setChoice] = useState<number | null>(null);
  const [bool, setBool] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExerciseOutcome | null>(null);

  // Reset when the exercise changes.
  useEffect(() => {
    started.current = Date.now();
    setChoice(null);
    setBool(null);
    setText('');
    setPicked([]);
    setPairs({});
    setLeftSel(null);
    setHintShown(false);
    setResult(null);
    setBusy(false);
  }, [ex.id]);

  const spoken = 'say' in ex ? ex.say : undefined;
  useEffect(() => {
    if (autoPlay && spoken) void speak(spoken);
  }, [ex.id, autoPlay, spoken]);

  const bank = useMemo(() => {
    if (ex.kind === 'word-order') return shuffled(ex.words, ex.id, ex.answer.split(' '));
    if (ex.kind === 'sentence-order') return shuffled(ex.lines, ex.id, ex.lines);
    return [] as string[];
  }, [ex]);
  const rightBank = useMemo(() => (ex.kind === 'matching' ? shuffled(ex.pairs.map((p) => p[1]), ex.id) : []), [ex]);

  const response: Response | null = (() => {
    if (CHOICE_KINDS.includes(ex.kind)) return choice === null ? null : { kind: 'choice', index: choice };
    if (ex.kind === 'true-false') return bool === null ? null : { kind: 'bool', value: bool };
    if (TEXT_KINDS.includes(ex.kind)) return text.trim() ? { kind: 'text', text } : null;
    if (ex.kind === 'word-order') return picked.length ? { kind: 'order', items: picked } : null;
    if (ex.kind === 'sentence-order') return picked.length === ex.lines.length ? { kind: 'order', items: picked } : null;
    if (ex.kind === 'matching') return Object.keys(pairs).length === ex.pairs.length ? { kind: 'pairs', pairs } : null;
    return null;
  })();

  const locked = result !== null;

  const check = async () => {
    if (!response || locked || busy) return;
    setBusy(true);
    try {
      const r = record ? await answer(ex, response, Date.now() - started.current, hintShown ? 1 : 0) : { ...gradeExercise(ex, response), xp: 0 };
      setResult(r);
    } finally {
      setBusy(false);
    }
  };

  const wordOrderStyle = ex.kind === 'word-order' || ex.kind === 'sentence-order';

  const stateOf = (i: number): 'correct' | 'wrong' | undefined => {
    if (!result || !('answer' in ex) || typeof ex.answer !== 'number') return undefined;
    if (i === ex.answer) return 'correct';
    if (i === choice) return 'wrong';
    return undefined;
  };

  const header = (() => {
    switch (ex.kind) {
      case 'fill-blank':
        return (
          <>
            <Instruction>{l({ en: 'Fill in the blank', ar: 'املأ الفراغ' })}</Instruction>
            <EnglishText block className="text-xl font-semibold leading-relaxed">{ex.sentence}</EnglishText>
            {ex.translation && showHelp && <p className="muted mt-1 text-sm">{ex.translation}</p>}
          </>
        );
      case 'grammar-fix':
        return (
          <>
            <Instruction>{l({ en: 'Correct the mistake', ar: 'صحّح الخطأ' })}</Instruction>
            <EnglishText block className="text-xl font-semibold leading-relaxed">{ex.wrong}</EnglishText>
          </>
        );
      case 'true-false':
        return (
          <>
            <Instruction>{l({ en: 'True or false?', ar: 'صح أم خطأ؟' })}</Instruction>
            <EnglishText block className="text-xl font-semibold leading-relaxed">{ex.statement}</EnglishText>
          </>
        );
      case 'listen-type':
        return (
          <>
            <Instruction>{l({ en: 'Listen and type what you hear', ar: 'استمع واكتب ما تسمعه' })}</Instruction>
            <SpeakButton text={ex.say} />
          </>
        );
      case 'listen-choose':
        return (
          <>
            <Instruction>{l({ en: 'Listen and choose', ar: 'استمع واختر' })}</Instruction>
            <SpeakButton text={ex.say} />
            <p className="mt-2 font-medium"><Mixed text={ex.prompt} /></p>
          </>
        );
      case 'word-order':
        return (
          <>
            <Instruction>{l({ en: 'Put the words in order', ar: 'رتّب الكلمات' })}</Instruction>
            {ex.translation && <p className="font-medium">{ex.translation}</p>}
          </>
        );
      case 'sentence-order':
        return (
          <>
            <Instruction>{l({ en: 'Put the sentences in order', ar: 'رتّب الجمل' })}</Instruction>
            {ex.prompt && <p className="font-medium"><Mixed text={ex.prompt} /></p>}
          </>
        );
      case 'matching':
        return <Instruction>{l({ en: 'Match each item with its pair', ar: 'صِل كل عنصر بما يناسبه' })}</Instruction>;
      case 'vocab-recall':
        return (
          <>
            <Instruction>{l({ en: 'Type the English word', ar: 'اكتب الكلمة بالإنجليزية' })}</Instruction>
            <p className="text-xl font-semibold"><Mixed text={ex.prompt} /></p>
          </>
        );
      case 'short-written':
        return (
          <>
            <Instruction>{l({ en: 'Write a short answer', ar: 'اكتب إجابة قصيرة' })}</Instruction>
            <p className="font-medium"><Mixed text={ex.prompt} /></p>
          </>
        );
      case 'complete-sentence':
        return (
          <>
            <Instruction>{l({ en: 'Complete the sentence', ar: 'أكمل الجملة' })}</Instruction>
            <EnglishText block className="text-xl font-semibold leading-relaxed">{ex.stem}</EnglishText>
            <p className="muted mt-1 text-sm"><Mixed text={ex.prompt} /></p>
          </>
        );
      case 'reading-comp':
        return (
          <>
            <EnglishText block className="card-flat mb-3 p-4 leading-relaxed">{ex.passage}</EnglishText>
            <p className="font-semibold"><Mixed text={ex.prompt} /></p>
          </>
        );
      default:
        return (
          <>
            {ex.kind === 'en-ar' && <Instruction>{l({ en: 'What does it mean?', ar: 'ما معناها؟' })}</Instruction>}
            {ex.kind === 'ar-en' && <Instruction>{l({ en: 'How do you say it in English?', ar: 'كيف تقولها بالإنجليزية؟' })}</Instruction>}
            <p className="text-xl font-semibold leading-relaxed"><Mixed text={ex.prompt} /></p>
          </>
        );
    }
  })();

  const options = 'options' in ex ? ex.options : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">{header}</div>

      {options && (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => (
            <button
              key={i}
              type="button"
              className="choice"
              data-selected={choice === i && !result ? 'true' : undefined}
              data-state={stateOf(i)}
              disabled={locked}
              onClick={() => setChoice(i)}
            >
              <Mixed text={o} />
            </button>
          ))}
        </div>
      )}

      {ex.kind === 'true-false' && (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              className="choice justify-center"
              data-selected={bool === v && !result ? 'true' : undefined}
              data-state={result ? (v === ex.answer ? 'correct' : bool === v ? 'wrong' : undefined) : undefined}
              disabled={locked}
              onClick={() => setBool(v)}
            >
              {v ? l({ en: 'True', ar: 'صح' }) : l({ en: 'False', ar: 'خطأ' })}
            </button>
          ))}
        </div>
      )}

      {TEXT_KINDS.includes(ex.kind) &&
        (ex.kind === 'short-written' ? (
          <textarea
            className="input min-h-24 en-text"
            dir="ltr"
            lang="en"
            value={text}
            disabled={locked}
            autoFocus={autoFocus}
            onChange={(e) => setText(e.target.value)}
            placeholder={l({ en: 'Write in English…', ar: 'اكتب بالإنجليزية…' })}
          />
        ) : (
          <input
            className="input en-text"
            dir="ltr"
            lang="en"
            spellCheck={false}
            autoComplete="off"
            value={text}
            disabled={locked}
            autoFocus={autoFocus}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (result ? onDone(result) : check())}
            placeholder={l({ en: 'Type your answer…', ar: 'اكتب إجابتك…' })}
          />
        ))}

      {wordOrderStyle && (
        <div className="space-y-3">
          <div className="card-flat flex min-h-14 flex-wrap items-center gap-2 p-3" dir="ltr">
            {picked.length === 0 && <span className="muted text-sm" dir="auto">{l({ en: 'Tap items below', ar: 'اضغط على العناصر بالأسفل' })}</span>}
            {picked.map((p, i) => (
              <button
                key={`${p}-${i}`}
                type="button"
                className="chip en-text cursor-pointer"
                disabled={locked}
                onClick={() => setPicked(picked.filter((_, j) => j !== i))}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {bank.map((w, i) => {
              const used = picked.filter((p) => p === w).length >= bank.filter((b) => b === w).length;
              return (
                <button
                  key={`${w}-${i}`}
                  type="button"
                  className="chip en-text cursor-pointer disabled:opacity-35"
                  disabled={locked || used}
                  onClick={() => setPicked([...picked, w])}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ex.kind === 'matching' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {ex.pairs.map(([a]) => (
              <button
                key={a}
                type="button"
                className="choice"
                data-selected={leftSel === a ? 'true' : undefined}
                data-state={result ? (pairs[a] === ex.pairs.find((p) => p[0] === a)?.[1] ? 'correct' : 'wrong') : undefined}
                disabled={locked}
                onClick={() => setLeftSel(a)}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <Mixed text={a} />
                  {pairs[a] && <span className="chip text-xs"><Mixed text={pairs[a]!} /></span>}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {rightBank.map((b) => {
              const taken = Object.values(pairs).includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  className="choice"
                  disabled={locked || taken || !leftSel}
                  onClick={() => {
                    if (!leftSel) return;
                    setPairs({ ...pairs, [leftSel]: b });
                    setLeftSel(null);
                  }}
                >
                  <Mixed text={b} />
                </button>
              );
            })}
            {Object.keys(pairs).length > 0 && !locked && (
              <button type="button" className="btn-ghost btn-sm btn" onClick={() => { setPairs({}); setLeftSel(null); }}>
                {l({ en: 'Reset', ar: 'إعادة' })}
              </button>
            )}
          </div>
        </div>
      )}

      {ex.hint && !locked && (
        <div>
          {hintShown ? (
            <p className="card-flat flex items-start gap-2 p-3 text-sm"><Lightbulb size={16} className="mt-0.5 shrink-0 text-warn" /><Mixed text={l(ex.hint)} /></p>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHintShown(true)}>
              <Lightbulb size={15} /> {l({ en: 'Hint', ar: 'تلميح' })}
            </button>
          )}
        </div>
      )}

      {result && (
        <div
          role="status"
          className={clsx('card-flat space-y-1.5 p-4', result.correct ? 'border-good bg-good-soft' : result.close ? 'border-warn bg-warn-soft' : 'border-bad')}
        >
          <p className="flex items-center gap-2 font-semibold">
            {result.correct ? <Check size={18} className="text-good" /> : <X size={18} className="text-bad" />}
            {result.correct
              ? l({ en: 'Correct!', ar: 'أحسنت!' })
              : result.close
                ? l({ en: 'Very close, check the spelling', ar: 'قريب جدًا، راجع الإملاء' })
                : l({ en: 'Not quite', ar: 'ليست صحيحة' })}
            {result.xp > 0 && <span className="chip ms-auto text-xs">+{result.xp} XP</span>}
          </p>
          {!result.correct && (
            <p className="text-sm">
              {l({ en: 'Answer:', ar: 'الإجابة:' })} <EnglishText className="font-semibold">{result.expected}</EnglishText>
            </p>
          )}
          {ex.explain && <p className="text-sm text-ink-2"><Mixed text={l(ex.explain)} /></p>}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {result ? (
          <button type="button" className="btn" onClick={() => onDone(result)} autoFocus>
            {nextLabel ?? t('common.next')}
          </button>
        ) : (
          <button type="button" className="btn" disabled={!response || busy} onClick={check}>
            {l({ en: 'Check', ar: 'تحقق' })}
          </button>
        )}
      </div>
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-en">{children}</p>;
}
