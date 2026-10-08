import { Component, type ErrorInfo, type ReactNode } from 'react';
import { currentI18n } from '@/i18n';
import { logEvent } from '@/lib/log';

interface Props {
  children: ReactNode;
  /** Called when the user chooses to go home; also clears the error. */
  onHome?: () => void;
}

interface State {
  error: Error | null;
}

/** Catches render errors so a bug in one screen never leaves a blank window. The details go to the log file. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logEvent('error', `render error: ${error.message}\n${info.componentStack ?? ''}`);
  }

  private reset = (): void => {
    this.setState({ error: null });
    this.props.onHome?.();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const t = currentI18n().t;
    return (
      <div className="flex h-full items-center justify-center p-8" role="alert">
        <div className="card max-w-md text-center">
          <h1 className="h-page mb-2">{t('error.boundaryTitle')}</h1>
          <p className="muted mb-5">{t('error.boundaryBody')}</p>
          <button className="btn btn-primary" onClick={this.reset}>
            {t('error.goHome')}
          </button>
        </div>
      </div>
    );
  }
}
