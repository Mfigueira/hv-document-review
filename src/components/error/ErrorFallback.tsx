import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

interface Props {
  /** Passed explicitly when used inside the class ErrorBoundary */
  error?: Error;
}

function resolveMessage(error: unknown): { title: string; detail: string; stack?: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      detail: typeof error.data === 'string' ? error.data : 'A routing error occurred.',
    };
  }
  if (error instanceof Error) {
    return { title: error.message, detail: '', stack: error.stack };
  }
  return { title: 'An unexpected error occurred.', detail: String(error) };
}

/** Used as the React Router errorElement — reads the route error via hook */
export function RouteErrorFallback() {
  const routeError = useRouteError();
  return <ErrorFallback error={routeError as Error} />;
}

/** Standalone fallback — accepts an error prop or a router error via hook */
export function ErrorFallback({ error }: Props) {
  const { title, detail, stack } = resolveMessage(error ?? 'Unknown error');
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-6xl rounded-xl border border-red-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
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

        <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500">
          An unexpected error occurred. Please reload the page to try again.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reload page
        </button>

        {isDev && (
          <details className="mt-6 text-left" open>
            <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600">
              Error details (dev only)
            </summary>
            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-red-700 font-mono break-all whitespace-pre-wrap border border-gray-200">
              <p className="font-semibold">{title}</p>
              {detail && <p className="mt-1 text-gray-600">{detail}</p>}
              {stack && <p className="mt-2 text-gray-500">{stack}</p>}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
