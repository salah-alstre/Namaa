import clsx from 'clsx';
import { ClipboardCheck, Flag, Gauge, History, Layers, Play, Settings2, Trash2, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState, PageHeader, Segmented } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { LEVELS } from '@/content/topics';
import { abandonExam, deleteExam, listExams } from '@/database/repos/exams';
import { EXAM_PRESETS, PRACTICABLE, examTitleKey, levelColor } from '@/domain/planner';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { useExam } from '@/stores/exam';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';
import { DIFFICULTIES, type Difficulty, type ExamConfig, type ExamKind, type ExamRow } from '@/types';
import { LETTER_COLOR, letterFor } from './grade';

type BuildKind = 'topic' | 'level' | 'custom';

const PRESET_ICON = { quick: Zap, mixed: Layers, final: Flag } as const;
const TIME_OPTIONS = [0, 5, 10, 20, 30, 60];
const COUNT_OPTIONS = [5, 10, 15, 20, 30, 40];

function answeredCount(exam: ExamRow): number {
  return exam.questions.filter((q) => {
    const a = exam.answers[q.id];
    return a !== null && a !== undefined && !(typeof a === 'string' && a.trim() === '');
  }).length;
}

/** Exams home: ready-made papers, a builder, a resume banner and the history of finished exams. */
export function Exams() {
  const { t, l, n, pct, clock, lang } = useI18n();
  const go = useRouter((s) => s.go);
  const begin = useExam((s) => s.begin);
  const resume = useExam((s) => s.resume);
  const findOpen = useExam((s) => s.findOpen);

  const [open, setOpen] = useState<ExamRow | null>(null);
  const [history, setHistory] = useState<ExamRow[] | null>(null);
  const [pending, setPending] = useState<ExamConfig | null>(null);
  const [starting, setStarting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExamRow | null>(null);

  const [kind, setKind] = useState<BuildKind>('topic');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [minutes, setMinutes] = useState(10);

  const date = useMemo(() => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en', { day: 'numeric', month: 'short', year: 'numeric' }), [lang]);

  const refresh = useCallback(async () => {
    try {
      const [o, h] = await Promise.all([findOpen(), listExams()]);
      setOpen(o);
      setHistory(h);
    } catch (e) {
      logEvent('error', `exams refresh failed: ${String(e)}`);
      setHistory([]);
    }
  }, [findOpen]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const byLevel = useMemo(() => LEVELS.map((lv) => ({ lv, topics: PRACTICABLE.filter((tp) => tp.level === lv.level) })).filter((g) => g.topics.length > 0), []);
  const levelsWithTopics = byLevel.map((g) => g.lv.level);

  const toggle = (id: string) => setTopicIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const needsTopics = kind !== 'level';
  const canBuild = !needsTopics || topicIds.length > 0;

  const review = () => {
    if (!canBuild) return;
    const cfg: ExamConfig =
      kind === 'level'
        ? { kind: 'level', topicIds: [], level, count, difficulty, timeLimitS: minutes ? minutes * 60 : null }
        : { kind, topicIds, count, difficulty, timeLimitS: minutes ? minutes * 60 : null };
    setPending(cfg);
  };

  const startPending = async () => {
    if (!pending || starting) return;
    setStarting(true);
    try {
      const id = await begin(pending);
      setPending(null);
      go({ name: 'exam-run', examId: id });
    } catch (e) {
      logEvent('error', `exam start failed: ${String(e)}`);
      toast({ kind: 'error', title: t('error.generic') });
    } finally {
      setStarting(false);
    }
  };

  const doResume = async () => {
    if (!open) return;
    const ok = await resume(open.id);
    if (ok) go({ name: 'exam-run', examId: open.id });
    else void refresh();
  };

  const doDiscard = async () => {
    if (!open) return;
    try {
      await abandonExam(open.id);
    } catch (e) {
      logEvent('error', `exam discard failed: ${String(e)}`);
    }
    setDiscardOpen(false);
    await refresh();
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await deleteExam(deleting.id);
    } catch (e) {
      logEvent('error', `exam delete failed: ${String(e)}`);
      toast({ kind: 'error', title: t('error.generic') });
    }
    setDeleting(null);
    await refresh();
  };

  const infoDifficulty = pending ? (pending.difficulty === 'mixed' ? t('diff.mixed') : t(`diff.${pending.difficulty}` as never)) : '';

  return (
    <div className="space-y-8">
      <PageHeader title={t('exams.title')} subtitle={t('exams.subtitle')} />

      {open && (
        <section className="card flex flex-wrap items-center gap-4 !border-brand bg-brand-soft" aria-label={t('exams.resume.title')}>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{t('exams.resume.title')}</h2>
            <p className="muted mt-0.5">{t('exams.resume.body', { title: open.title, a: answeredCount(open), n: open.questions.length })}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => setDiscardOpen(true)}>{t('exams.discard')}</button>
            <button type="button" className="btn btn-primary" onClick={() => void doResume()}>
              <Play size={16} className="rtl:rotate-180" />
              {t('exams.resume')}
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="presets-h" className="space-y-3">
        <h2 id="presets-h" className="h-section">{t('exams.presets')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(EXAM_PRESETS) as (keyof typeof EXAM_PRESETS)[]).map((k) => {
            const cfg = EXAM_PRESETS[k];
            const Icon = PRESET_ICON[k];
            return (
              <button key={k} type="button" onClick={() => setPending(cfg)} className="card-flat flex flex-col items-start gap-3 !p-4 text-start transition-all hover:border-brand">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block font-semibold">{t(examTitleKey(k as ExamKind) as never)}</span>
                  <span className="muted mt-1 block text-sm">{t(`exams.kind.${k}.desc` as never)}</span>
                </span>
                <span className="chip mt-auto">{n(cfg.count, 0)} · {cfg.timeLimitS ? t('exams.config.min', { n: Math.round(cfg.timeLimitS / 60) }) : t('exams.config.noLimit')}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="build-h" className="card space-y-5">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-brand" />
          <h2 id="build-h" className="h-section !m-0">{t('exams.build')}</h2>
        </div>
        <Segmented<BuildKind>
          value={kind}
          onChange={setKind}
          label={t('exams.build')}
          options={[
            { value: 'topic', label: t('exams.kind.topic') },
            { value: 'level', label: t('exams.kind.level') },
            { value: 'custom', label: t('exams.kind.custom') },
          ]}
        />
        <p className="muted text-sm">{t(`exams.kind.${kind}.desc` as never)}</p>

        {kind === 'level' ? (
          <div className="space-y-2">
            <div className="label">{t('exams.config.level')}</div>
            <div className="flex flex-wrap gap-2">
              {levelsWithTopics.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  aria-pressed={level === lv}
                  onClick={() => setLevel(lv)}
                  className={clsx('chip !px-3 !py-1.5', level === lv && '!bg-brand !text-brand-ink')}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: levelColor(lv) }} />
                  {n(lv, 0)} · {l(LEVELS[lv - 1].title)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="label">{t('exams.config.topics')}</div>
            {byLevel.map(({ lv, topics }) => {
              const ids = topics.map((x) => x.id);
              const all = ids.every((i) => topicIds.includes(i));
              return (
                <div key={lv.level} className="space-y-1.5">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
                    onClick={() => setTopicIds((cur) => (all ? cur.filter((x) => !ids.includes(x)) : Array.from(new Set([...cur, ...ids]))))}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: lv.color }} />
                    {n(lv.level, 0)} · {l(lv.title)}
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((tp) => (
                      <button
                        key={tp.id}
                        type="button"
                        aria-pressed={topicIds.includes(tp.id)}
                        onClick={() => toggle(tp.id)}
                        className={clsx('chip !px-3 !py-1.5', topicIds.includes(tp.id) && '!bg-brand !text-brand-ink')}
                      >
                        {l(tp.title)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="label">{t('exams.config.count')}</div>
            <Segmented<number> value={count} onChange={setCount} label={t('exams.config.count')} options={COUNT_OPTIONS.map((c) => ({ value: c, label: n(c, 0) }))} />
          </div>
          <div className="space-y-2">
            <div className="label">{t('exams.config.time')}</div>
            <Segmented<number>
              value={minutes}
              onChange={setMinutes}
              label={t('exams.config.time')}
              options={TIME_OPTIONS.map((m) => ({ value: m, label: m === 0 ? t('exams.config.noLimit') : t('exams.config.min', { n: m }) }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="label">{t('exams.config.difficulty')}</div>
            <Segmented<string>
              value={String(difficulty)}
              onChange={(v) => setDifficulty(v === 'mixed' ? 'mixed' : (Number(v) as Difficulty))}
              label={t('exams.config.difficulty')}
              options={[{ value: 'mixed', label: t('diff.mixed') }, ...DIFFICULTIES.map((d) => ({ value: String(d), label: t(`diff.${d}` as never) }))]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={!canBuild} onClick={review}>
            <ClipboardCheck size={16} />
            {t('exams.info.title')}
          </button>
          {!canBuild && <span className="muted text-sm">{t('exams.config.needTopics')}</span>}
        </div>
      </section>

      <section aria-labelledby="hist-h" className="space-y-3">
        <div className="flex items-center gap-2">
          <History size={18} className="text-ink-2" />
          <h2 id="hist-h" className="h-section !m-0">{t('exams.history')}</h2>
        </div>
        {history === null ? (
          <div className="muted">{t('common.loading')}</div>
        ) : history.length === 0 ? (
          <EmptyState icon={Gauge} title={t('exams.history.empty.title')} body={t('exams.history.empty.body')} />
        ) : (
          <ul className="space-y-2">
            {history.map((e) => {
              const total = e.total || e.questions.length;
              const ratio = total ? (e.score ?? 0) / total : 0;
              const letter = letterFor(ratio);
              return (
                <li key={e.id} className="card-flat flex flex-wrap items-center gap-3 !p-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                    style={{ color: LETTER_COLOR[letter], background: `color-mix(in srgb, ${LETTER_COLOR[letter]} 14%, transparent)` }}
                    aria-label={t(`exams.grade.${letter}` as never)}
                  >
                    {letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.title}</div>
                    <div className="muted text-sm">
                      {e.finishedAt ? date.format(new Date(e.finishedAt)) : ''} · {t('exams.history.score', { c: e.score ?? 0, t: total })} · {pct(ratio)} · {clock(e.elapsedS)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-sm" onClick={() => go({ name: 'exam-result', examId: e.id })}>
                      {t('exams.history.open')}
                    </button>
                    <button type="button" className="icon-btn" aria-label={t('exams.history.delete')} title={t('exams.history.delete')} onClick={() => setDeleting(e)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        open={pending !== null}
        onClose={() => !starting && setPending(null)}
        title={pending ? `${t('exams.info.title')} — ${pending.kind === 'level' && pending.level ? `${t('exams.kind.level')} ${n(pending.level, 0)}` : t(examTitleKey(pending.kind) as never)}` : ''}
        footer={
          <>
            <button type="button" className="btn" disabled={starting} onClick={() => setPending(null)}>{t('common.cancel')}</button>
            <button type="button" data-autofocus className="btn btn-primary" disabled={starting} onClick={() => void startPending()}>
              {starting ? t('exams.starting') : t('exams.info.start')}
            </button>
          </>
        }
      >
        {pending && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div className="card-flat !p-3">
                <dt className="muted text-xs">{t('exams.info.questions')}</dt>
                <dd className="mt-1 text-lg font-semibold">{n(pending.count, 0)}</dd>
              </div>
              <div className="card-flat !p-3">
                <dt className="muted text-xs">{t('exams.info.time')}</dt>
                <dd className="mt-1 text-lg font-semibold">{pending.timeLimitS ? t('exams.config.min', { n: Math.round(pending.timeLimitS / 60) }) : t('exams.config.noLimit')}</dd>
              </div>
              <div className="card-flat !p-3">
                <dt className="muted text-xs">{t('exams.info.difficulty')}</dt>
                <dd className="mt-1 text-lg font-semibold">{infoDifficulty}</dd>
              </div>
            </dl>
            <p className="text-sm text-ink-2">{t('exams.info.rules')}</p>
            <p className="muted text-sm">{t('exams.info.autosave')}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={t('exams.discardConfirm')}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDiscardOpen(false)}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={() => void doDiscard()}>{t('exams.discard')}</button>
          </>
        }
      >
        <p className="text-ink-2">{t('exams.discardBody')}</p>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('exams.history.deleteConfirm')}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDeleting(null)}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={() => void doDelete()}>{t('exams.history.delete')}</button>
          </>
        }
      >
        <p className="text-ink-2">{deleting?.title}</p>
      </Modal>
    </div>
  );
}
