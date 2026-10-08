import {
  Award, BarChart3, BookA, BookOpen, Calculator, ChevronsLeft, ChevronsRight, ClipboardCheck, Dumbbell, Ear, FunctionSquare, GraduationCap, Headphones,
  House, Languages, Library, Mic, NotebookText, PenLine, Repeat, ScrollText, Settings, Swords, type LucideIcon,
} from 'lucide-react';
import { useI18n, type Key } from '@/i18n';
import { navKeyFor, subjectOf, useRouter } from '@/stores/router';
import { useEnglish } from '@/stores/english';
import { usePlayer } from '@/stores/player';
import { useUi } from '@/stores/ui';
import type { Route } from '@/types';

interface Item {
  key: string;
  label: Key;
  route: Route;
  Icon: LucideIcon;
}

const GLOBAL_TOP: Item[] = [{ key: 'home', label: 'nav.home', route: { name: 'home' }, Icon: House }];
const SUBJECTS: Item[] = [
  { key: 'math', label: 'nav.math', route: { name: 'math' }, Icon: Calculator },
  { key: 'en-home', label: 'nav.english', route: { name: 'en-home' }, Icon: Languages },
];
const GLOBAL_BOTTOM: Item[] = [
  { key: 'review', label: 'nav.review', route: { name: 'review' }, Icon: Repeat },
  { key: 'progress', label: 'nav.progress', route: { name: 'progress' }, Icon: BarChart3 },
  { key: 'achievements', label: 'nav.achievements', route: { name: 'achievements' }, Icon: Award },
  { key: 'settings', label: 'nav.settings', route: { name: 'settings' }, Icon: Settings },
];

const MATH_SUB: Item[] = [
  { key: 'math', label: 'nav.overview', route: { name: 'math' }, Icon: House },
  { key: 'learn', label: 'nav.learn', route: { name: 'learn' }, Icon: BookOpen },
  { key: 'practice', label: 'nav.practice', route: { name: 'practice' }, Icon: Dumbbell },
  { key: 'challenges', label: 'nav.challenges', route: { name: 'challenges' }, Icon: Swords },
  { key: 'exams', label: 'nav.exams', route: { name: 'exams' }, Icon: ClipboardCheck },
  { key: 'mistakes', label: 'nav.mistakes', route: { name: 'mistakes' }, Icon: NotebookText },
  { key: 'formulas', label: 'nav.formulas', route: { name: 'formulas' }, Icon: FunctionSquare },
];

const EN_SUB: Item[] = [
  { key: 'en-home', label: 'nav.overview', route: { name: 'en-home' }, Icon: House },
  { key: 'en-learn', label: 'nav.en.learn', route: { name: 'en-learn' }, Icon: GraduationCap },
  { key: 'en-vocab', label: 'nav.en.vocab', route: { name: 'en-vocab' }, Icon: BookA },
  { key: 'en-review', label: 'nav.en.review', route: { name: 'en-review' }, Icon: Repeat },
  { key: 'en-grammar', label: 'nav.en.grammar', route: { name: 'en-grammar' }, Icon: Library },
  { key: 'en-practice', label: 'nav.en.practice', route: { name: 'en-practice' }, Icon: Dumbbell },
  { key: 'en-listening', label: 'nav.en.listening', route: { name: 'en-listening' }, Icon: Headphones },
  { key: 'en-reading', label: 'nav.en.reading', route: { name: 'en-reading' }, Icon: ScrollText },
  { key: 'en-writing', label: 'nav.en.writing', route: { name: 'en-writing' }, Icon: PenLine },
  { key: 'en-speaking', label: 'nav.en.speaking', route: { name: 'en-speaking' }, Icon: Mic },
  { key: 'en-mistakes', label: 'nav.en.mistakes', route: { name: 'en-mistakes' }, Icon: Ear },
  { key: 'en-progress', label: 'nav.en.progress', route: { name: 'en-progress' }, Icon: BarChart3 },
];

export function Sidebar() {
  const { t, n, isRtl } = useI18n();
  const route = useRouter((s) => s.route);
  const go = useRouter((s) => s.go);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  const openMistakes = usePlayer((s) => s.openMistakes);
  const level = usePlayer((s) => s.level);
  const enMistakes = useEnglish((s) => s.mistakes.filter((m) => !m.understood).length);
  const subject = subjectOf(route);
  const active = navKeyFor(route);
  const Collapse = collapsed === isRtl ? ChevronsLeft : ChevronsRight;

  const topActive = (key: string): boolean => {
    if (key === 'math') return subject === 'math';
    if (key === 'en-home') return subject === 'english';
    return active === key;
  };

  const button = (it: Item, opts: { on: boolean; sub?: boolean; badge?: number }) => {
    const { Icon } = it;
    return (
      <button
        key={`${opts.sub ? 's' : 't'}-${it.key}`}
        onClick={() => go(it.route)}
        title={collapsed ? t(it.label) : undefined}
        aria-current={opts.on ? 'page' : undefined}
        className={`relative flex w-full cursor-pointer items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
          opts.sub ? 'px-3 py-1.5' : 'px-3 py-2.5'
        } ${
          opts.on
            ? subject === 'english' && (opts.sub || it.key === 'en-home')
              ? 'bg-en-soft text-en'
              : 'bg-brand-soft text-brand'
            : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon size={opts.sub ? 17 : 19} className="shrink-0" />
        {!collapsed && <span className="truncate">{t(it.label)}</span>}
        {!!opts.badge && opts.badge > 0 && (
          <span className={`rounded-full bg-bad px-1.5 text-[0.65rem] font-bold leading-5 text-white ${collapsed ? 'absolute end-1.5 top-1' : 'ms-auto'}`}>
            {n(opts.badge, 0)}
          </span>
        )}
      </button>
    );
  };

  const subItems = subject === 'math' ? MATH_SUB : subject === 'english' ? EN_SUB : [];

  return (
    <aside
      data-chrome
      className={`flex shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-200 ${collapsed ? 'w-[4.5rem]' : 'w-60'}`}
      aria-label={t('app.name')}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <img src="/logo.svg" alt="" width={36} height={36} className="shrink-0 rounded-xl" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight">{t('app.name')}</p>
            <p className="muted truncate text-xs">{t('app.tagline')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-1">
        {GLOBAL_TOP.map((it) => button(it, { on: topActive(it.key) }))}
        {SUBJECTS.map((it) => (
          <div key={it.key}>
            {button(it, { on: topActive(it.key) && !(subject && subItems.length) })}
            {!collapsed && topActive(it.key) && (
              <div className="ms-4 mt-0.5 mb-1 space-y-0.5 border-s border-line ps-2">
                {subItems.map((s) =>
                  button(s, {
                    on: active === s.key,
                    sub: true,
                    badge: s.key === 'mistakes' ? openMistakes : s.key === 'en-mistakes' ? enMistakes : 0,
                  }),
                )}
              </div>
            )}
          </div>
        ))}
        {GLOBAL_BOTTOM.map((it) => button(it, { on: topActive(it.key) }))}
      </nav>

      <div className="space-y-2 border-t border-line p-3">
        {!collapsed && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold">{t('common.level', { n: level.level })}</span>
              <span className="muted">{t('common.xp', { n: level.totalXp })}</span>
            </div>
            <div className="progress">
              <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
            </div>
          </div>
        )}
        <button
          className="icon-btn w-full"
          onClick={toggle}
          title={collapsed ? t('top.expand') : t('top.collapse')}
          aria-label={collapsed ? t('top.expand') : t('top.collapse')}
        >
          <Collapse size={18} />
        </button>
      </div>
    </aside>
  );
}
