import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { NamedIcon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { FORMULAS } from '@/content/formulas';
import { LESSONS } from '@/content/lessons';
import { ALL_LESSONS as EN_LESSONS, GRAMMAR, WORDS } from '@/content/english';
import { TOPICS } from '@/content/topics';
import { PRACTICABLE } from '@/domain/planner';
import { useI18n, type Key } from '@/i18n';
import { search, type Searchable } from '@/lib/search';
import { startPractice, startQuickPractice } from '@/features/practice/quick';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { useUi } from '@/stores/ui';
import type { Route } from '@/types';

interface Entry {
  id: string;
  group: Key;
  icon: string;
  label: string;
  hint?: string;
  run: () => void;
  keys: Searchable<string>;
}

const PAGES: { route: Route; label: Key; icon: string }[] = [
  { route: { name: 'home' }, label: 'nav.home', icon: 'House' },
  { route: { name: 'math' }, label: 'nav.math', icon: 'Calculator' },
  { route: { name: 'en-home' }, label: 'nav.english', icon: 'Languages' },
  { route: { name: 'review' }, label: 'nav.review', icon: 'Repeat' },
  { route: { name: 'en-quick' }, label: 'gh.quickEnglish', icon: 'Zap' },
  { route: { name: 'en-learn' }, label: 'nav.en.learn', icon: 'BookOpen' },
  { route: { name: 'en-vocab' }, label: 'nav.en.vocab', icon: 'Library' },
  { route: { name: 'en-grammar' }, label: 'nav.en.grammar', icon: 'GraduationCap' },
  { route: { name: 'en-listening' }, label: 'nav.en.listening', icon: 'Volume2' },
  { route: { name: 'en-reading' }, label: 'nav.en.reading', icon: 'BookOpen' },
  { route: { name: 'en-writing' }, label: 'nav.en.writing', icon: 'NotebookPen' },
  { route: { name: 'en-speaking' }, label: 'nav.en.speaking', icon: 'Volume2' },
  { route: { name: 'en-placement' }, label: 'nav.en.placement', icon: 'Compass' },
  { route: { name: 'learn' }, label: 'nav.learn', icon: 'BookOpen' },
  { route: { name: 'practice' }, label: 'nav.practice', icon: 'Dumbbell' },
  { route: { name: 'challenges' }, label: 'nav.challenges', icon: 'Swords' },
  { route: { name: 'exams' }, label: 'nav.exams', icon: 'ClipboardCheck' },
  { route: { name: 'mistakes' }, label: 'nav.mistakes', icon: 'NotebookText' },
  { route: { name: 'formulas' }, label: 'nav.formulas', icon: 'FunctionSquare' },
  { route: { name: 'progress' }, label: 'nav.progress', icon: 'BarChart3' },
  { route: { name: 'achievements' }, label: 'nav.achievements', icon: 'Award' },
  { route: { name: 'settings' }, label: 'nav.settings', icon: 'Settings' },
];

/** Ctrl+K: jump to pages, run actions, and search topics, lessons and formulas in either language. */
export function CommandPalette() {
  const { t, l } = useI18n();
  const open = useUi((s) => s.paletteOpen);
  const setPalette = useUi((s) => s.setPalette);
  const go = useRouter((s) => s.go);
  const nextLessonId = usePlayer((s) => s.nextLessonId);
  const settings = useSettings((s) => s.settings);
  const setSetting = useSettings((s) => s.set);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => setPalette(false);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    const ar = (x: { en: string; ar: string }) => [x.en, x.ar];
    const done = (fn: () => void) => () => {
      close();
      fn();
    };

    // Names of pages and actions are searched in both languages by using the same key in each.
    for (const p of PAGES) {
      out.push({
        id: `page:${p.route.name}`,
        group: 'palette.pages',
        icon: p.icon,
        label: t(p.label),
        run: done(() => go(p.route)),
        keys: { item: `page:${p.route.name}`, titles: [t(p.label), p.route.name], extra: [] },
      });
    }

    const actions: { id: string; label: Key; icon: string; run: () => void }[] = [
      { id: 'quick', label: 'palette.act.quick', icon: 'Zap', run: () => { go({ name: 'practice' }); startQuickPractice(); } },
      { id: 'daily', label: 'palette.act.daily', icon: 'Swords', run: () => go({ name: 'challenges' }) },
      { id: 'mistakes', label: 'palette.act.mistakes', icon: 'NotebookText', run: () => go({ name: 'mistakes' }) },
      { id: 'continue', label: 'palette.act.continue', icon: 'Play', run: () => go(nextLessonId ? { name: 'lesson', lessonId: nextLessonId } : { name: 'learn' }) },
      { id: 'theme', label: 'palette.act.theme', icon: 'SunMoon', run: () => void setSetting('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark') },
      { id: 'language', label: 'palette.act.language', icon: 'Languages', run: () => void setSetting('language', settings.language === 'ar' ? 'en' : 'ar') },
      { id: 'focus', label: 'palette.act.focus', icon: 'Maximize2', run: () => useUi.getState().setFocus(!useUi.getState().focus) },
      { id: 'scratch', label: 'palette.act.scratchpad', icon: 'NotebookPen', run: () => useUi.getState().setScratch(true) },
    ];
    for (const a of actions) {
      out.push({
        id: `act:${a.id}`,
        group: 'palette.actions',
        icon: a.icon,
        label: t(a.label),
        run: done(a.run),
        keys: { item: `act:${a.id}`, titles: [t(a.label)], extra: [] },
      });
    }

    for (const topic of PRACTICABLE) {
      out.push({
        id: `topic:${topic.id}`,
        group: 'palette.topicsGroup',
        icon: topic.icon,
        label: t('palette.practiceTopic', { name: l(topic.title) }),
        hint: l(topic.summary),
        run: done(() => {
          go({ name: 'practice' });
          void startPractice({ mode: 'normal', topicIds: [topic.id], difficulty: 'adaptive', count: 10, timeLimitS: null });
        }),
        keys: { item: `topic:${topic.id}`, titles: ar(topic.title), extra: ar(topic.summary) },
      });
    }
    void TOPICS;

    for (const lesson of LESSONS) {
      out.push({
        id: `lesson:${lesson.id}`,
        group: 'palette.lessons',
        icon: 'BookOpen',
        label: l(lesson.title),
        hint: l(lesson.summary),
        run: done(() => go({ name: 'lesson', lessonId: lesson.id })),
        keys: { item: `lesson:${lesson.id}`, titles: ar(lesson.title), extra: [...ar(lesson.summary), ...ar(lesson.keywords)] },
      });
    }

    for (const f of FORMULAS) {
      out.push({
        id: `formula:${f.id}`,
        group: 'palette.formulasGroup',
        icon: 'FunctionSquare',
        label: l(f.name),
        hint: l(f.whenToUse),
        run: done(() => {
          sessionStorage.setItem('raqam.formula', f.id);
          go({ name: 'formulas' });
        }),
        keys: { item: `formula:${f.id}`, titles: ar(f.name), extra: [...ar(f.explanation), f.latex] },
      });
    }
    for (const lesson of EN_LESSONS) {
      out.push({
        id: `enlesson:${lesson.id}`,
        group: 'palette.enLessons',
        icon: 'Languages',
        label: l(lesson.title),
        hint: l(lesson.summary),
        run: done(() => go({ name: 'en-lesson', lessonId: lesson.id })),
        keys: { item: `enlesson:${lesson.id}`, titles: ar(lesson.title), extra: ar(lesson.summary) },
      });
    }
    for (const g of GRAMMAR) {
      out.push({
        id: `engrammar:${g.id}`,
        group: 'palette.enGrammar',
        icon: 'GraduationCap',
        label: l(g.title),
        hint: l(g.summary),
        run: done(() => go({ name: 'en-grammar', topicId: g.id })),
        keys: { item: `engrammar:${g.id}`, titles: ar(g.title), extra: [...ar(g.summary), ...g.patterns] },
      });
    }
    for (const w of WORDS) {
      out.push({
        id: `enword:${w.id}`,
        group: 'palette.enWords',
        icon: 'Library',
        label: `${w.en} — ${w.ar}`,
        hint: w.exEn,
        run: done(() => { sessionStorage.setItem('namaa.word', w.id); go({ name: 'en-vocab' }); }),
        keys: { item: `enword:${w.id}`, titles: [w.en, w.ar], extra: [w.exEn, w.exAr] },
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, l, go, nextLessonId, settings.language]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return entries.filter((e) => e.group === 'palette.pages' || e.group === 'palette.actions');
    }
    const byId = new Map(entries.map((e) => [e.id, e]));
    const ids = search(query, entries.map((e) => e.keys), 24);
    return ids.map((id) => byId.get(id)).filter((e): e is Entry => !!e);
  }, [entries, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    }
  };

  const rows: ReactNode[] = [];
  let lastGroup: Key | null = null;
  results.forEach((r, i) => {
    if (r.group !== lastGroup) {
      lastGroup = r.group;
      rows.push(
        <p key={`g-${r.group}`} className="label px-3 pb-1 pt-3 first:pt-1">
          {t(r.group)}
        </p>,
      );
    }
    rows.push(
      <button
        key={r.id}
        data-active={i === active}
        onMouseMove={() => setActive(i)}
        onClick={r.run}
        className={clsx(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors',
          i === active ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-surface-2',
        )}
      >
        <NamedIcon name={r.icon} size={17} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{r.label}</span>
          {r.hint && <span className="muted block truncate text-xs">{r.hint}</span>}
        </span>
        {i === active && <CornerDownLeft size={14} className="shrink-0 opacity-60 rtl:-scale-x-100" />}
      </button>,
    );
  });

  return (
    <Modal open={open} onClose={close} top hideClose>
      <div onKeyDown={onKey} className="-mx-5 -my-4">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={18} className="shrink-0 text-ink-3" />
          <input
            data-autofocus
            dir="auto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('palette.placeholder')}
            className="w-full bg-transparent text-base outline-none placeholder:text-ink-3"
            aria-label={t('palette.placeholder')}
          />
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? <p className="muted px-3 py-8 text-center text-sm">{t('palette.empty', { q: query })}</p> : rows}
        </div>
        <p className="muted border-t border-line px-4 py-2 text-xs">{t('palette.hint')}</p>
      </div>
    </Modal>
  );
}
