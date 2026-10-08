import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useI18n, type Key } from '@/i18n';
import { logEvent } from '@/lib/log';
import { useProfile } from '@/stores/profile';
import { useRouter } from '@/stores/router';
import { useSettings } from '@/stores/settings';
import type { ComfortLevel, Goal, Lang } from '@/types';

const COMFORT: { id: ComfortLevel; label: Key; sub: Key }[] = [
  { id: 'beginner', label: 'onb.comfort.beginner', sub: 'onb.comfort.beginnerSub' },
  { id: 'some', label: 'onb.comfort.some', sub: 'onb.comfort.someSub' },
  { id: 'comfortable', label: 'onb.comfort.comfortable', sub: 'onb.comfort.comfortableSub' },
];

const GOALS: { id: Goal; label: Key }[] = [
  { id: 'zero', label: 'onb.goal.zero' },
  { id: 'everyday', label: 'onb.goal.everyday' },
  { id: 'algebra', label: 'onb.goal.algebra' },
  { id: 'school', label: 'onb.goal.school' },
  { id: 'general', label: 'onb.goal.general' },
];

const TOTAL = 4;

/** Four short steps: language, name and comfort, goal, then an optional placement test. */
export function Onboarding() {
  const { t, isRtl } = useI18n();
  const settings = useSettings((s) => s.settings);
  const setSetting = useSettings((s) => s.set);
  const update = useProfile((s) => s.update);
  const go = useRouter((s) => s.go);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [comfort, setComfort] = useState<ComfortLevel>('some');
  const [goal, setGoal] = useState<Goal>('general');
  const [busy, setBusy] = useState(false);
  const Next = isRtl ? ArrowLeft : ArrowRight;
  const Prev = isRtl ? ArrowRight : ArrowLeft;

  const finish = async (placement: 'math' | 'en' | false) => {
    if (busy) return;
    setBusy(true);
    try {
      await update({ name: name.trim(), comfortLevel: comfort, goal, onboarded: true });
      go(placement === 'math' ? { name: 'placement' } : placement === 'en' ? { name: 'en-placement' } : { name: 'home' });
    } catch (e) {
      logEvent('error', `onboarding save failed: ${String(e)}`);
      setBusy(false);
    }
  };

  const langs: { id: Lang; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'ar', label: 'العربية' },
  ];

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-bg p-4">
      <div className="card anim-pop w-full max-w-xl !p-8">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.svg" alt="" width={44} height={44} />
          <div className="min-w-0 flex-1">
            <h1 className="h-page !text-2xl">{t('onb.welcome')}</h1>
            <p className="muted text-xs">{t('onb.step', { n: step + 1, total: TOTAL })}</p>
          </div>
        </div>
        <div className="progress mb-6" aria-hidden="true">
          <span style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>

        {step === 0 && (
          <section className="space-y-4">
            <p className="muted text-sm">{t('onb.welcomeSub')}</p>
            <h2 className="h-section">{t('onb.chooseLanguage')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {langs.map((l) => (
                <button
                  key={l.id}
                  className="choice !justify-center !py-5 !text-lg"
                  data-selected={settings.language === l.id}
                  onClick={() => void setSetting('language', l.id)}
                  lang={l.id}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="muted text-xs">{t('onb.langNote')}</p>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="h-section">{t('onb.yourName')}</h2>
            <input
              className="input"
              dir="auto"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onb.namePlaceholder')}
              aria-label={t('onb.yourName')}
              data-autofocus
            />
            <h2 className="h-section pt-2">{t('onb.comfortTitle')}</h2>
            <div className="space-y-2">
              {COMFORT.map((c) => (
                <button key={c.id} className="choice" data-selected={comfort === c.id} onClick={() => setComfort(c.id)}>
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block font-semibold">{t(c.label)}</span>
                    <span className="muted block text-xs font-normal">{t(c.sub)}</span>
                  </span>
                  {comfort === c.id && <Check size={18} className="text-brand" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="h-section">{t('onb.goalTitle')}</h2>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button key={g.id} className="choice" data-selected={goal === g.id} onClick={() => setGoal(g.id)}>
                  <span className="flex-1 text-start font-medium">{t(g.label)}</span>
                  {goal === g.id && <Check size={18} className="text-brand" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="h-section">{t('onb.placementTitle')}</h2>
            <p className="muted text-sm">{t('onb.placementBody')}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button className="btn btn-primary btn-lg flex-1" disabled={busy} onClick={() => void finish('math')}>
                {t('onb.takePlacement')}
              </button>
              <button className="btn btn-primary btn-lg flex-1" disabled={busy} onClick={() => void finish('en')}>
                {t('onb.takeEnPlacement')}
              </button>
              <button className="btn btn-soft btn-lg flex-1" disabled={busy} onClick={() => void finish(false)}>
                {t('onb.startLearning')}
              </button>
            </div>
          </section>
        )}

        {step < TOTAL - 1 && (
          <div className={clsx('mt-8 flex items-center', step === 0 ? 'justify-end' : 'justify-between')}>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                <Prev size={16} />
                {t('common.back')}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {t('common.next')}
              <Next size={16} />
            </button>
          </div>
        )}
        {step === TOTAL - 1 && (
          <div className="mt-6">
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              <Prev size={16} />
              {t('common.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
