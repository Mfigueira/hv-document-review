import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  /** When set, renders a compact inline error card instead of a full-page takeover */
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.label) {
        return (
          <SectionErrorCard
            label={this.props.label}
            error={this.state.error}
            onRetry={() => this.setState({ error: null })}
          />
        );
      }
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function SectionErrorCard({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: Error;
  onRetry: () => void;
}) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">{label} failed to load.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        Retry
      </button>

      {isDev && (
        <details className="mt-2 w-full text-left" open>
          <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600">
            Error details (dev only)
          </summary>
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-red-700 break-all whitespace-pre-wrap">
            <p className="font-semibold">{error.message}</p>
            {error.stack && <p className="mt-2 text-gray-500">{error.stack}</p>}
          </div>
        </details>
      )}
    </div>
  );
}
