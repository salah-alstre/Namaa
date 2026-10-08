import clsx from 'clsx';
import { BarChart3, Bell, Database, Info, Keyboard, Languages, Palette, SlidersHorizontal, Volume2, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal } from '@/components/Modal';
import { PageHeader, Row, Segmented, Switch } from '@/components/ui';
import { useI18n } from '@/i18n';
import { Pronunciation } from './Pronunciation';
import { logEvent } from '@/lib/log';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notify';
import { playCue } from '@/lib/sound';
import { invoke, isTauri } from '@/lib/tauri';
import { usePlayer } from '@/stores/player';
import { useProfile } from '@/stores/profile';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import { toast } from '@/stores/toast';
import type { Lang, StartPage, ThemeMode } from '@/types';

type Section = 'general' | 'learning' | 'english' | 'appearance' | 'sound' | 'notifications' | 'keyboard' | 'data' | 'about';

const SECTIONS: { id: Section; icon: typeof Info }[] = [
  { id: 'general', icon: SlidersHorizontal },
  { id: 'learning', icon: BarChart3 },
  { id: 'english', icon: Languages },
  { id: 'appearance', icon: Palette },
  { id: 'sound', icon: Volume2 },
  { id: 'notifications', icon: Bell },
  { id: 'keyboard', icon: Keyboard },
  { id: 'data', icon: Database },
  { id: 'about', icon: Info },
];

const START_PAGES: StartPage[] = ['home', 'learn', 'practice', 'challenges', 'exams', 'mistakes', 'formulas', 'progress', 'achievements', 'settings'];

interface AppInfo {
  version: string;
  data_dir: string;
  db_path: string;
  log_path: string;
  schema: number;
}

type Confirm = null | 'progress' | 'all';

export function Settings() {
  const { t, n, l, lang } = useI18n();
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const profile = useProfile((s) => s.profile);
  const go = useRouter((s) => s.go);
  const [section, setSection] = useState<Section>('general');
  const [name, setName] = useState(profile.name);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<AppInfo | null>(null);
  const desktop = isTauri();
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }), [lang]);

  useEffect(() => {
    if (section !== 'about' || !desktop) return;
    invoke<AppInfo>('app_info').then(setInfo).catch((e) => logEvent('error', `app_info: ${String(e)}`));
  }, [section, desktop]);

  const reloadAll = async () => {
    await Promise.all([useSettings.getState().reload(), useProfile.getState().load(), usePlayer.getState().reload()]);
  };

  const errText = (e: unknown): string => {
    const code = String(e);
    for (const k of ['not_a_backup', 'backup_too_new', 'read_failed'] as const) if (code.includes(k)) return t(`set.data.err.${k}` as never);
    return t('set.data.err.generic');
  };

  const exportBackup = async () => {
    setBusy(true);
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const path = await save({ defaultPath: `namaa-backup-${new Date().toISOString().slice(0, 10)}.json`, filters: [{ name: 'Namaa backup', extensions: ['json'] }] });
      if (!path) return;
      await invoke<number>('backup_export', { path });
      await set('lastBackupAt', Date.now());
      toast({ kind: 'success', title: t('set.data.exported') });
    } catch (e) {
      logEvent('error', `backup export: ${String(e)}`);
      toast({ kind: 'error', title: errText(e) });
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    setBusy(true);
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const path = await open({ multiple: false, directory: false, filters: [{ name: 'Namaa backup', extensions: ['json'] }] });
      if (!path || typeof path !== 'string') return;
      await invoke('backup_import', { path });
      await reloadAll();
      toast({ kind: 'success', title: t('set.data.imported') });
    } catch (e) {
      logEvent('error', `backup import: ${String(e)}`);
      toast({ kind: 'error', title: errText(e) });
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    const which = confirm;
    setConfirm(null);
    if (!which) return;
    setBusy(true);
    try {
      await invoke(which === 'all' ? 'data_reset_all' : 'data_reset_progress');
      await reloadAll();
      toast({ kind: 'success', title: t('set.data.done') });
      if (which === 'all') go({ name: 'home' });
    } catch (e) {
      logEvent('error', `reset ${which}: ${String(e)}`);
      toast({ kind: 'error', title: t('set.data.err.generic') });
    } finally {
      setBusy(false);
    }
  };

  const toggleNotifications = async (on: boolean) => {
    if (on) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        toast({ kind: 'error', title: t('set.notif.denied') });
        return;
      }
    }
    await set('notificationsEnabled', on);
  };

  const body: Record<Section, ReactNode> = {
    general: (
      <>
        <Row title={t('set.language')} hint={t('set.language.hint')}>
          <Segmented<Lang> value={settings.language} onChange={(v) => void set('language', v)} label={t('set.language')} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
        </Row>
        <Row title={t('set.name')}>
          <input
            className="input w-56"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() !== profile.name) void useProfile.getState().update({ name: name.trim() });
            }}
          />
        </Row>
        <Row title={t('set.startPage')} hint={t('set.startPage.hint')}>
          <select className="input w-56" value={settings.startPage} onChange={(e) => void set('startPage', e.target.value as StartPage)}>
            {START_PAGES.map((p) => (
              <option key={p} value={p}>{t(`nav.${p}` as never)}</option>
            ))}
          </select>
        </Row>
        <Row title={t('set.arabicDigits')} hint={t('set.arabicDigits.hint')}>
          <Switch checked={settings.arabicDigits} onChange={(v) => void set('arabicDigits', v)} label={t('set.arabicDigits')} />
        </Row>
      </>
    ),
    learning: (
      <>
        <Row title={t('set.dailyGoal')} hint={t('set.dailyGoal.hint')}>
          <input className="input w-28" type="number" min={5} max={200} step={5} value={settings.dailyGoal} onChange={(e) => {
            const v = Math.round(Number(e.target.value));
            if (Number.isFinite(v)) void set('dailyGoal', Math.min(200, Math.max(5, v)));
          }} />
        </Row>
        <Row title={t('set.adaptive')} hint={t('set.adaptive.hint')}>
          <Switch checked={settings.adaptive} onChange={(v) => void set('adaptive', v)} label={t('set.adaptive')} />
        </Row>
        <Row title={t('set.showSolution')}>
          <Switch checked={settings.showSolutionAuto} onChange={(v) => void set('showSolutionAuto', v)} label={t('set.showSolution')} />
        </Row>
        <Row title={t('set.autoNext')}>
          <Switch checked={settings.autoNext} onChange={(v) => void set('autoNext', v)} label={t('set.autoNext')} />
        </Row>
        <Row title={t('set.unlockAll')} hint={t('set.unlockAll.hint')}>
          <Switch checked={settings.unlockAll} onChange={(v) => void set('unlockAll', v)} label={t('set.unlockAll')} />
        </Row>
        <Row title={t('set.retakePlacement')} hint={t('set.retakePlacement.hint')}>
          <button className="btn btn-soft" onClick={() => go({ name: 'placement' })}>{t('set.retakePlacement.btn')}</button>
        </Row>
      </>
    ),
    english: (
      <>
        <Row title={l({ en: 'Starting level', ar: 'مستوى البداية' })} hint={l({ en: 'Where English suggestions begin. Nothing is ever locked.', ar: 'من أين تبدأ اقتراحات الإنجليزية. لا شيء يُقفل أبدًا.' })}>
          <select className="input w-40" value={settings.enStartLevel} onChange={(e) => void set('enStartLevel', e.target.value as typeof settings.enStartLevel)}>
            {(['starter', 'a1', 'a2', 'b1', 'b2'] as const).map((v) => <option key={v} value={v}>{v === 'starter' ? 'Starter (A0)' : v.toUpperCase()}</option>)}
          </select>
        </Row>
        <Row title={l({ en: 'English daily goal', ar: 'هدف الإنجليزية اليومي' })} hint={l({ en: 'Answers per day.', ar: 'عدد الإجابات يوميًا.' })}>
          <input className="input w-28" type="number" min={5} max={200} step={5} value={settings.enDailyGoal} onChange={(e) => {
            const v = Math.round(Number(e.target.value));
            if (Number.isFinite(v)) void set('enDailyGoal', Math.min(200, Math.max(5, v)));
          }} />
        </Row>
        <Row title={l({ en: 'Show Arabic translation', ar: 'إظهار الترجمة العربية' })}>
          <Switch checked={settings.enShowTranslation} onChange={(v) => void set('enShowTranslation', v)} label="translation" />
        </Row>
        <Row title={l({ en: 'Arabic explanations', ar: 'الشرح بالعربية' })} hint={l({ en: 'Arabic help inside lessons.', ar: 'مساعدة عربية داخل الدروس.' })}>
          <Switch checked={settings.enArabicHelp} onChange={(v) => void set('enArabicHelp', v)} label="arabic help" />
        </Row>
        <Pronunciation />
      </>
    ),
    appearance: (
      <>
        <Row title={t('set.theme')}>
          <Segmented<ThemeMode> value={settings.theme} onChange={(v) => void set('theme', v)} label={t('set.theme')} options={[{ value: 'light', label: t('set.theme.light') }, { value: 'dark', label: t('set.theme.dark') }, { value: 'system', label: t('set.theme.system') }]} />
        </Row>
        <Row title={t('set.density')}>
          <Segmented value={settings.density} onChange={(v) => void set('density', v)} label={t('set.density')} options={[{ value: 'comfortable', label: t('set.density.comfortable') }, { value: 'compact', label: t('set.density.compact') }]} />
        </Row>
        <Row title={t('set.textSize')}>
          <Segmented value={settings.textSize} onChange={(v) => void set('textSize', v)} label={t('set.textSize')} options={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' }]} />
        </Row>
        <Row title={t('set.motion')}>
          <Segmented value={settings.reducedMotion} onChange={(v) => void set('reducedMotion', v)} label={t('set.motion')} options={[{ value: 'system', label: t('set.motion.system') }, { value: 'on', label: t('set.motion.on') }, { value: 'off', label: t('set.motion.off') }]} />
        </Row>
      </>
    ),
    sound: (
      <>
        <Row title={t('set.sound')}>
          <Switch checked={settings.soundEnabled} onChange={(v) => void set('soundEnabled', v)} label={t('set.sound')} />
        </Row>
        <Row title={t('set.volume')}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            className="w-48"
            value={settings.soundVolume}
            aria-label={t('set.volume')}
            onChange={(e) => void set('soundVolume', Number(e.target.value))}
          />
        </Row>
        <Row title={t('set.sound.test')}>
          <button className="btn btn-soft" onClick={() => playCue('correct', true)}>{t('set.sound.test')}</button>
        </Row>
      </>
    ),
    notifications: (
      <>
        <Row title={t('set.notif')} hint={t('set.notif.hint')}>
          <Switch checked={settings.notificationsEnabled} onChange={(v) => void toggleNotifications(v)} label={t('set.notif')} />
        </Row>
        <Row title={t('set.notif.time')}>
          <input className="input w-32" type="time" value={settings.reminderTime} onChange={(e) => e.target.value && void set('reminderTime', e.target.value)} />
        </Row>
        <Row title={t('set.notif.test')}>
          <button
            className="btn btn-soft"
            onClick={async () => {
              const ok = await sendLocalNotification('Namaa', t('set.notif.testBody'));
              if (!ok) toast({ kind: 'error', title: t('set.notif.denied') });
            }}
          >
            {t('set.notif.test')}
          </button>
        </Row>
      </>
    ),
    keyboard: (
      <>
        <p className="muted py-2 text-sm">{t('set.keys.title')}</p>
        {[
          ['Ctrl + K', t('set.keys.palette')],
          ['Esc', t('set.keys.escape')],
          ['Enter', t('set.keys.enter')],
          ['1 – 4', t('set.keys.choice')],
        ].map(([k, d]) => (
          <Row key={k} title={d as string}>
            <kbd className="kbd" dir="ltr">{k}</kbd>
          </Row>
        ))}
      </>
    ),
    data: (
      <>
        <Row
          title={t('set.data.backup')}
          hint={`${t('set.data.backup.hint')} ${settings.lastBackupAt ? t('set.data.last', { d: dateFmt.format(new Date(settings.lastBackupAt)) }) : t('set.data.never')}`}
        >
          <button className="btn btn-primary" disabled={!desktop || busy} onClick={() => void exportBackup()}>{t('set.data.export')}</button>
        </Row>
        <Row title={t('set.data.import')} hint={t('set.data.import.hint')}>
          <button className="btn btn-soft" disabled={!desktop || busy} onClick={() => void importBackup()}>{t('set.data.import')}</button>
        </Row>
        <Row title={t('set.data.resetProgress')} hint={t('set.data.resetProgress.hint')}>
          <button className="btn btn-danger" disabled={!desktop || busy} onClick={() => setConfirm('progress')}>{t('set.data.resetProgress')}</button>
        </Row>
        <Row title={t('set.data.resetAll')} hint={t('set.data.resetAll.hint')}>
          <button className="btn btn-danger" disabled={!desktop || busy} onClick={() => setConfirm('all')}>{t('set.data.resetAll')}</button>
        </Row>
        {!desktop && <p className="muted pt-2 text-sm">{t('set.data.desktopOnly')}</p>}
      </>
    ),
    about: (
      <>
        <p className="py-3 text-ink-2">{t('set.about.body')}</p>
        {desktop && info ? (
          <>
            <Row title={t('set.about.version')}><span className="num">{info.version}</span></Row>
            <Row title={t('set.about.schema')}><span className="num">{n(info.schema, 0)}</span></Row>
            <Row title={t('set.about.data')}><code className="break-all text-xs" dir="ltr">{info.data_dir}</code></Row>
            <Row title={t('set.about.log')}><code className="break-all text-xs" dir="ltr">{info.log_path}</code></Row>
          </>
        ) : (
          !desktop && <p className="muted text-sm">{t('set.about.browser')}</p>
        )}
      </>
    ),
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title={t('set.title')} />
      <div className="grid gap-5 md:grid-cols-[13rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label={t('set.title')}>
          {SECTIONS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              aria-current={section === id}
              onClick={() => setSection(id)}
              className={clsx('flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-start text-sm font-medium', section === id ? 'bg-brand-soft text-brand' : 'text-ink-2 hover:bg-surface-2')}
            >
              <Icon size={17} /> {t(`set.sec.${id}` as never)}
            </button>
          ))}
        </nav>
        <section className="card" aria-label={t(`set.sec.${section}` as never)}>
          <h2 className="h-section mb-2 flex items-center gap-2"><Wrench size={18} className="text-ink-3" /> {t(`set.sec.${section}` as never)}</h2>
          {body[section]}
        </section>
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'all' ? t('set.data.confirmAll') : t('set.data.confirmProgress')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={() => void doReset()}>{t('common.confirm')}</button>
          </>
        }
      >
        <p>{t('set.data.confirmBody')}</p>
      </Modal>
    </div>
  );
}
