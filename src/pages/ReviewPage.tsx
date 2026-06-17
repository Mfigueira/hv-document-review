import { useReview } from '../hooks/useReview';
import { useReviewStore } from '../store/useReviewStore';
import { SubmissionStatusBar } from '../components/submission/SubmissionStatusBar';
import { IssuesPanel } from '../components/issues/IssuesPanel';

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
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Document</p>
            <p className="mt-0.5 text-sm text-gray-600">
              Use <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Cmd</kbd>
              {' + '}
              <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">F</kbd> to search
              — PDF viewer coming in Stage 3
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center text-sm text-gray-300">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 text-3xl">
                📄
              </div>
              <p className="font-medium text-gray-400">PDF Viewer</p>
              <p className="mt-0.5 text-xs text-gray-300">Stage 3</p>
            </div>
          </div>
        </main>

        {/* Issues pane */}
        <aside
          aria-label="Issues panel"
          className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 lg:w-[400px] xl:w-[440px]"
        >
          <IssuesPanel />
        </aside>
      </div>
    </>
  );
}
