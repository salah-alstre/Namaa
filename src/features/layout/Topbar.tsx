import { Flame, Languages, Maximize2, Moon, NotebookPen, Search, Sun, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { usePlayer } from '@/stores/player';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { useUi } from '@/stores/ui';
import { startQuickPractice } from '@/features/practice/quick';

/** Search, quick practice, scratchpad, focus mode, language and theme, plus the streak and XP chips. */
export function Topbar() {
  const { t, n } = useI18n();
  const setPalette = useUi((s) => s.setPalette);
  const setScratch = useUi((s) => s.setScratch);
  const setFocus = useUi((s) => s.setFocus);
  const settings = useSettings((s) => s.settings);
  const setSetting = useSettings((s) => s.set);
  const streak = usePlayer((s) => s.streak);
  const level = usePlayer((s) => s.level);
  const go = useRouter((s) => s.go);

  const dark = document.documentElement.dataset.theme === 'dark';
  const toggleTheme = () => void setSetting('theme', dark ? 'light' : 'dark');
  const toggleLang = () => void setSetting('language', settings.language === 'ar' ? 'en' : 'ar');

  return (
    <header data-chrome className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
      <button
        className="input flex !w-auto min-w-0 max-w-sm flex-1 cursor-pointer items-center gap-2 !text-ink-3"
        onClick={() => setPalette(true)}
        aria-label={t('top.search')}
      >
        <Search size={16} className="shrink-0" />
        <span className="truncate text-start">{t('top.search')}</span>
        <span className="kbd ms-auto hidden sm:inline-flex">Ctrl K</span>
      </button>

      <div className="ms-auto flex items-center gap-1.5">
        <button className="chip cursor-pointer" onClick={() => go({ name: 'progress' })} title={t('top.streakTip', { n: streak.current })}>
          <Flame size={14} className={streak.current > 0 ? 'text-warn' : ''} />
          {n(streak.current, 0)}
        </button>
        <span className="chip hidden md:inline-flex" title={t('common.level', { n: level.level })}>
          <Zap size={14} className="text-gold" />
          {t('common.xp', { n: level.totalXp })}
        </span>

        <button className="btn btn-soft btn-sm" onClick={startQuickPractice} title={t('top.quickPracticeTip')}>
          <Zap size={15} />
          <span className="hidden lg:inline">{t('top.quickPractice')}</span>
        </button>
        <button className="icon-btn" onClick={() => setScratch(true)} title={t('top.scratchpad')} aria-label={t('top.scratchpad')}>
          <NotebookPen size={18} />
        </button>
        <button className="icon-btn" onClick={() => setFocus(true)} title={t('top.focus')} aria-label={t('top.focus')}>
          <Maximize2 size={18} />
        </button>
        <button className="icon-btn" onClick={toggleLang} title={t('top.language')} aria-label={t('top.language')}>
          <Languages size={18} />
        </button>
        <button className="icon-btn" onClick={toggleTheme} title={t('top.theme')} aria-label={t('top.theme')}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
