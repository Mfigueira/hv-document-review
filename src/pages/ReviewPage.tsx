import { useReview } from '../hooks/useReview';
import { useReviewStore } from '../store/useReviewStore';
import { SubmissionStatusBar } from '../components/submission/SubmissionStatusBar';
import { IssuesPanel } from '../components/issues/IssuesPanel';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { ErrorBoundary } from '../components/error/ErrorBoundary';

export function ReviewPage() {
  const { status } = useReview();
  const review = useReviewStore((s) => s.review);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading review&hellip;</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !review) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center">
          <p className="text-sm font-medium text-red-700">Failed to load review.</p>
          <p className="mt-1 text-xs text-red-500">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sticky submission bar */}
      <SubmissionStatusBar />

      {/* Two-pane split view */}
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-7xl gap-4 px-4 py-4 sm:px-6">
        {/* Document pane */}
        <main
          aria-label="Document viewer"
          className="hidden flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white lg:flex lg:flex-col"
        >
          <ErrorBoundary label="Document viewer">
            <DocumentViewer />
          </ErrorBoundary>
        </main>

        {/* Issues pane */}
        <aside
          aria-label="Issues panel"
          className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 lg:w-[400px] xl:w-[440px]"
        >
          <ErrorBoundary label="Issues panel">
            <IssuesPanel />
          </ErrorBoundary>
        </aside>
      </div>
    </>
  );
}
