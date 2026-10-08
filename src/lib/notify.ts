import { currentI18n } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { logEvent } from '@/lib/log';
import { isTauri } from '@/lib/tauri';
import { usePlayer } from '@/stores/player';
import { useSettings } from '@/stores/settings';

const SENT_KEY = 'raqam.reminderSent';

async function ensurePermission(ask: boolean): Promise<boolean> {
  try {
    if (isTauri()) {
      const n = await import('@tauri-apps/plugin-notification');
      if (await n.isPermissionGranted()) return true;
      if (!ask) return false;
      return (await n.requestPermission()) === 'granted';
    }
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (!ask) return false;
    return (await Notification.requestPermission()) === 'granted';
  } catch (e) {
    logEvent('warn', `notification permission failed: ${String(e)}`);
    return false;
  }
}

/** Asks for permission (only called when the user turns reminders on). */
export const requestNotificationPermission = (): Promise<boolean> => ensurePermission(true);

export async function sendLocalNotification(title: string, body: string): Promise<boolean> {
  if (!(await ensurePermission(false))) return false;
  try {
    if (isTauri()) {
      const n = await import('@tauri-apps/plugin-notification');
      n.sendNotification({ title, body });
    } else {
      new Notification(title, { body });
    }
    return true;
  } catch (e) {
    logEvent('warn', `notification failed: ${String(e)}`);
    return false;
  }
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => Number(x));
  return (Number.isFinite(h) ? (h as number) : 19) * 60 + (Number.isFinite(m) ? (m as number) : 0);
}

function alreadySent(day: string): boolean {
  try {
    return localStorage.getItem(SENT_KEY) === day;
  } catch {
    return false;
  }
}

function markSent(day: string): void {
  try {
    localStorage.setItem(SENT_KEY, day);
  } catch {
    /* ignore */
  }
}

/** One check. Reminds at most once a day, never after the day's practice is already done. */
export async function checkReminder(now = new Date()): Promise<boolean> {
  const { notificationsEnabled, reminderTime } = useSettings.getState().settings;
  if (!notificationsEnabled) return false;
  const day = dayKey(now.getTime());
  if (alreadySent(day)) return false;
  if (now.getHours() * 60 + now.getMinutes() < minutesOf(reminderTime)) return false;
  const player = usePlayer.getState();
  if (!player.ready || player.streak.doneToday) {
    markSent(day);
    return false;
  }
  const i18n = currentI18n();
  const key = player.streak.current > 0 ? 'notify.bodyStreak' : 'notify.body';
  const ok = await sendLocalNotification(i18n.t('notify.title'), i18n.t(key, { n: player.streak.current }));
  if (ok) markSent(day);
  return ok;
}

/** Starts the minute timer. Returns a stop function. */
export function startReminderLoop(): () => void {
  const id = window.setInterval(() => void checkReminder(), 60_000);
  const first = window.setTimeout(() => void checkReminder(), 8_000);
  return () => {
    window.clearInterval(id);
    window.clearTimeout(first);
  };
}
