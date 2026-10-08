import clsx from 'clsx';
import { Bookmark, BookmarkCheck, Check, ChevronDown, ChevronUp, Lightbulb, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnswerInput } from '@/components/AnswerInput';
import { Rich, Steps, Tex } from '@/components/Math';
import { MISTAKE_BY_ID } from '@/content/mistakes';
import { saveMistakeManually } from '@/database/repos/attempts';
import { HINT_FACTOR } from '@/domain/xp';
import { answerText, initialValue, isReady } from '@/features/shared/answers';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { playCue } from '@/lib/sound';
import { checkAnswer, userKey } from '@/math-engine/validate';
import { useSettings } from '@/stores/settings';
import type { Question, UserAnswer, Verdict } from '@/types';

export interface PanelOutcome {
  verdict: Verdict;
  xp: number;
}

interface Props {
  q: Question;
  /** Judges and records the answer. Resolves with the verdict and the XP earned. */
  onSubmit: (answer: UserAnswer | null, hintsUsed: number, timeMs: number) => Promise<PanelOutcome>;
  onNext: () => void;
  /** Offered after a wrong answer when present. */
  onSimilar?: () => void;
  /** Label of the continue button (defaults to "Next"). */
  nextLabel?: string;
  /** Called once the answer is judged, e.g. so a parent can stop a timer. */
  onJudged?: (outcome: PanelOutcome) => void;
  /** Hide "Save for review" (for contexts that already store mistakes). */
  hideSave?: boolean;
}

/** One question with its answer control, 3-level hints, and full feedback after checking. */
export function QuestionPanel({ q, onSubmit, onNext, onSimilar, nextLabel, onJudged, hideSave }: Props) {
  const { t, l } = useI18n();
  const settings = useSettings((s) => s.settings);
  const [value, setValue] = useState<UserAnswer | null>(() => initialValue(q));
  const [hints, setHints] = useState(0);
  const [outcome, setOutcome] = useState<PanelOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSteps, setOpenSteps] = useState(settings.showSolutionAuto);
  const [submitted, setSubmitted] = useState<UserAnswer | null>(null);
  const startedAt = useRef(Date.now());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    root.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  const judged = outcome !== null;
  const correct = outcome?.verdict.correct ?? false;

  const submit = async (answer: UserAnswer | null) => {
    if (busy || judged) return;
    if (answer !== null && checkAnswer(q, answer).unparsed) {
      setWarn(true);
      return;
    }
    setWarn(false);
    setBusy(true);
    try {
      const out = await onSubmit(answer, hints, Date.now() - startedAt.current);
      setSubmitted(answer);
      setOutcome(out);
      playCue(out.verdict.correct ? 'correct' : 'wrong');
      onJudged?.(out);
    } catch (e) {
      logEvent('error', `submit failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  // Moves on by itself after a correct answer when "auto-next" is on.
  useEffect(() => {
    if (!judged || !correct || !settings.autoNext) return;
    const id = window.setTimeout(onNext, 1400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judged, correct, settings.autoNext]);

  const showHint = () => {
    if (judged) return;
    setHints((h) => Math.min(4, h + 1));
  };

  const optionCount = q.options?.length ?? (q.answer.kind === 'bool' ? 2 : 0);
  const pick = (n: number) => {
    if (judged || n > optionCount) return;
    const id = q.options?.[n - 1]?.id ?? (n === 1 ? 'true' : 'false');
    setValue(id);
  };

  useHotkeys({
    Enter: () => (judged ? onNext() : isReady(q, value) ? void submit(value) : undefined),
    h: showHint,
    n: () => (judged ? onNext() : undefined),
    '1': () => pick(1),
    '2': () => pick(2),
    '3': () => pick(3),
    '4': () => pick(4),
  });

  const patternId = outcome?.verdict.patternId;
  const pattern = patternId ? MISTAKE_BY_ID[patternId] : undefined;

  const shownAnswer = useMemo(() => answerText(q, submitted, { t, l }), [submitted, q, t, l]);

  const save = async () => {
    try {
      await saveMistakeManually(q, userKey(submitted), patternId ?? null);
      setSaved(true);
    } catch (e) {
      logEvent('error', `save mistake failed: ${String(e)}`);
    }
  };

  const factor = HINT_FACTOR[Math.min(hints, 4)] ?? 1;

  return (
    <div ref={root} className="space-y-4">
      <div className="card space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{t(`qtype.${q.qtype}` as never)}</span>
          <span className="chip">{t(`diff.${q.difficulty}` as never)}</span>
        </div>

        <div className="space-y-3">
          <Rich text={l(q.prompt)} className="block text-lg font-medium leading-relaxed" />
          {q.display && <Tex tex={q.display} block className="text-xl" />}
          {q.answer.kind === 'order' && <p className="muted text-sm">{t('q.orderHint')}</p>}
          {q.answer.kind === 'match' && <p className="muted text-sm">{t('q.matchHint')}</p>}
        </div>

        <AnswerInput q={q} value={value} onChange={(v) => { setValue(v); setWarn(false); }} onSubmit={() => isReady(q, value) && void submit(value)} disabled={judged || busy} revealed={judged} />

        {warn && (
          <p role="alert" className="anim-nudge rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
            {typeof value === 'string' && value.trim() ? t('q.unparsed') : t('q.unparsedText')}
          </p>
        )}

        {!judged && hints > 0 && (
          <div className="anim-fade space-y-2 rounded-xl bg-accent-soft p-4 text-sm">
            {q.hints.slice(0, Math.min(hints, 3)).map((h, i) => (
              <p key={i} className="flex gap-2">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" />
                <Rich text={l(h)} />
              </p>
            ))}
            {hints >= 4 && (
              <Steps items={q.steps.map(l)} className="space-y-1" />
            )}
          </div>
        )}

        {!judged && (
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" disabled={busy || !isReady(q, value)} onClick={() => void submit(value)}>
              {t('q.check')}
            </button>
            {hints < 4 && (
              <button className="btn btn-soft" onClick={showHint} title={t('q.hintCost')}>
                <Lightbulb size={16} />
                {hints < 3 ? t('q.hintN', { n: hints + 1 }) : t('q.hintSolution')}
              </button>
            )}
            <button className="btn btn-ghost" disabled={busy} onClick={() => void submit(null)}>
              {t('q.giveUp')}
            </button>
            {hints > 0 && <span className="muted text-xs">×{factor}</span>}
            <span className="muted ms-auto hidden text-xs md:inline">{t('q.keysHint')}</span>
          </div>
        )}
      </div>

      {judged && outcome && (
        <div className={clsx('card anim-pop space-y-4 border-2', correct ? 'border-good' : 'border-bad')} role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className={clsx('flex h-9 w-9 items-center justify-center rounded-full text-white', correct ? 'bg-good' : 'bg-bad')}>
              {correct ? <Check size={20} /> : <X size={20} />}
            </span>
            <h2 className="h-section flex-1">{correct ? t('q.correctTitle') : t('q.wrongTitle')}</h2>
            {outcome.xp > 0 && <span className="chip anim-xp">{t('q.xpGained', { n: outcome.xp })}</span>}
          </div>

          {!correct && (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-bad-soft p-3">
                <dt className="label">{t('q.yourAnswer')}</dt>
                <dd className="mt-1 font-medium">{shownAnswer}</dd>
              </div>
              <div className="rounded-xl bg-good-soft p-3">
                <dt className="label">{t('q.correctAnswer')}</dt>
                <dd className="mt-1 font-medium">
                  <Rich text={l(q.correctText)} />
                </dd>
              </div>
            </dl>
          )}

          {!correct && pattern && (
            <div className="rounded-xl bg-warn-soft p-3 text-sm">
              <p className="label">{t('q.likelyWrong')}</p>
              <p className="mt-1 font-semibold">{l(pattern.title)}</p>
              <p className="mt-0.5">{l(pattern.tip)}</p>
            </div>
          )}

          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpenSteps((o) => !o)} aria-expanded={openSteps}>
              {openSteps ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {t('q.steps')}
            </button>
            {openSteps && (
              <Steps items={q.steps.map(l)} className="anim-fade mt-2 text-sm" />
            )}
          </div>

          <div className="text-sm">
            <p className="label">{t('q.explanation')}</p>
            <p className="mt-1 leading-relaxed">
              <Rich text={l(q.explanation)} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button className="btn btn-primary" onClick={onNext} data-autofocus>
              {nextLabel ?? t('q.next')}
            </button>
            {!correct && onSimilar && (
              <button className="btn btn-soft" onClick={onSimilar}>
                <RefreshCw size={16} />
                {t('q.similar')}
              </button>
            )}
            {!correct && !hideSave && (
              <button className="btn btn-ghost" onClick={() => void save()} disabled={saved}>
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {saved ? t('q.saved') : t('q.save')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
