import { useEffect, useState } from 'react';
import { openDb } from '@/database';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { Shell } from '@/features/layout/Shell';
import { Splash } from '@/features/layout/Splash';
import { lastWeekSummary } from '@/domain/weekly';
import { logEvent } from '@/lib/log';
import { startReminderLoop } from '@/lib/notify';
import { useProfile } from '@/stores/profile';
import { usePlayer } from '@/stores/player';
import { goToStartPage } from '@/stores/router';
import { useSettings, watchSystemPreferences } from '@/stores/settings';
import { useUi } from '@/stores/ui';

type Phase = 'booting' | 'ready' | 'failed';

/** Opens the database, loads settings, profile and progress, then shows onboarding or the app. */
export function App() {
  const [phase, setPhase] = useState<Phase>('booting');
  const [error, setError] = useState<string | null>(null);
  const onboarded = useProfile((s) => s.profile.onboarded);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await openDb();
        await useSettings.getState().load();
        await useProfile.getState().load();
        await usePlayer.getState().reload();
        if (cancelled) return;
        if (useProfile.getState().profile.onboarded) {
          goToStartPage();
          const { activity, today } = usePlayer.getState();
          const { week } = lastWeekSummary(activity, today);
          const seen = useSettings.getState().settings.lastWeeklySeen;
          if (week.start !== seen && (week.questions > 0 || week.lessons > 0)) useUi.getState().setWeekly(true);
        }
        setPhase('ready');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logEvent('error', `boot failed: ${msg}`);
        if (!cancelled) {
          setError(msg);
          setPhase('failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stopWatch = watchSystemPreferences();
    const stopReminder = startReminderLoop();
    return () => {
      stopWatch();
      stopReminder();
    };
  }, []);

  if (phase === 'booting') return <Splash />;
  if (phase === 'failed') return <Splash error={error} />;
  if (!onboarded) return <Onboarding />;
  return <Shell />;
}
