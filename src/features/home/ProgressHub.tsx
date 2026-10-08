import { useState } from 'react';
import { EnProgress } from '@/features/english/EnProgress';
import { Progress } from '@/features/progress/Progress';
import { useI18n } from '@/i18n';
import { PageHeader, Segmented } from '@/components/ui';
import { usePlayer } from '@/stores/player';
import { useEnglish } from '@/stores/english';

type Tab = 'math' | 'english';

/** Progress for both subjects, with shared XP at the top. */
export function ProgressHub() {
  const { t, n } = useI18n();
  const total = usePlayer((s) => s.xp);
  const enXp = useEnglish((s) => s.xp);
  const [tab, setTab] = useState<Tab>('math');
  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-4 px-6 pt-6">
        <PageHeader title={t('pg.title')} subtitle={`${t('gh.totalXp')}: ${n(total)} · ${t('gh.xpMath')}: ${n(Math.max(0, total - enXp))} · ${t('gh.xpEnglish')}: ${n(enXp)}`} />
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          label={t('pg.title')}
          options={[
            { value: 'math', label: t('subject.math') },
            { value: 'english', label: t('subject.english') },
          ]}
        />
      </div>
      {tab === 'math' ? <Progress /> : <EnProgress />}
    </div>
  );
}
