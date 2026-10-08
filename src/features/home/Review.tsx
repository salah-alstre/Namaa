import { useState } from 'react';
import { EnReview } from '@/features/english/EnReview';
import { Mistakes } from '@/features/mistakes/Mistakes';
import { useI18n } from '@/i18n';
import { PageHeader, Segmented } from '@/components/ui';
import { useEnglish } from '@/stores/english';
import { usePlayer } from '@/stores/player';

type Tab = 'english' | 'math';

/** Global review center: English spaced review and Mathematics mistakes in one place. */
export function ReviewCenter() {
  const { t, n } = useI18n();
  const due = useEnglish((s) => s.dueWords().length);
  const mathOpen = usePlayer((s) => s.openMistakes);
  const [tab, setTab] = useState<Tab>(due > 0 || mathOpen === 0 ? 'english' : 'math');

  return (
    <div>
      <div className="mx-auto max-w-4xl space-y-4 px-6 pt-6">
        <PageHeader title={t('rv.title')} subtitle={t('rv.sub')} />
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          label={t('rv.title')}
          options={[
            { value: 'english', label: `${t('subject.english')} · ${n(due)}` },
            { value: 'math', label: `${t('subject.math')} · ${n(mathOpen)}` },
          ]}
        />
      </div>
      {tab === 'english' ? <EnReview /> : <Mistakes />}
    </div>
  );
}
