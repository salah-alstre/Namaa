import { modeDefaults, type PracticeConfig } from '@/domain/planner';
import { logEvent } from '@/lib/log';
import { usePractice } from '@/stores/practice';
import { useRouter } from '@/stores/router';
import { toast } from '@/stores/toast';
import { currentI18n } from '@/i18n';

/** Starts a session and opens the run screen. Shared by the setup screen, the topbar, the palette and the dashboard. */
export async function startPractice(cfg: PracticeConfig): Promise<void> {
  try {
    await usePractice.getState().start(cfg);
    useRouter.getState().go({ name: 'practice-run' });
  } catch (e) {
    logEvent('error', `could not start practice: ${String(e)}`);
    toast({ kind: 'error', title: currentI18n().t('error.generic') });
  }
}

/** The global "Quick Practice" button: five adaptive questions, no setup. */
export function startQuickPractice(): void {
  void startPractice({ mode: 'quick', topicIds: [], difficulty: 'adaptive', count: 5, timeLimitS: null, ...modeDefaults('quick') });
}
