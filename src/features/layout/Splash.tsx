import { useI18n } from '@/i18n';

interface Props {
  error?: string | null;
}

/** The loading screen, and the friendly failure screen if the database cannot be opened. */
export function Splash({ error }: Props) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-bg p-8 text-center">
      <img src="/logo.svg" alt="" width={84} height={84} className={error ? '' : 'anim-pulse'} />
      <h1 className="h-page">{t('app.name')}</h1>
      {error ? (
        <div className="card max-w-md">
          <h2 className="h-section mb-1">{t('splash.failedTitle')}</h2>
          <p className="muted text-sm">{t('splash.failedBody')}</p>
          <p className="ltr mt-3 break-words text-xs text-ink-3">{error}</p>
        </div>
      ) : (
        <p className="muted text-sm">{t('splash.loading')}</p>
      )}
    </div>
  );
}
