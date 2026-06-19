import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useReview } from '../hooks/useReview';
import { useReviewStore, useResolvedIds } from '../store/useReviewStore';
import { SubmissionStatusBar } from '../components/submission/SubmissionStatusBar';
import { IssuesPanel } from '../components/issues/IssuesPanel';
import { DocumentViewer } from '../components/document/DocumentViewer';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { getCtaMode, getCanProceed } from '../lib/issues';

type MobilePane = 'document' | 'issues';

/** Sticky bottom CTA shown only on mobile (<lg). The top bar hides its own CTA
 *  on small screens so there is exactly one action button at any breakpoint. */
function MobileCtaBar() {
  const navigate = useNavigate();
  const review = useReviewStore((s) => s.review);
  const submitting = useReviewStore((s) => s.submitting);
  const submit = useReviewStore((s) => s.submit);
  const resolvedIds = useResolvedIds();

  if (!review) return null;

  const ctaMode = getCtaMode(review.issues);
  const canProceed = getCanProceed(review.issues, resolvedIds);
  const isSubmitMode = ctaMode === 'submit';

  const handleCta = async () => {
    if (!canProceed || submitting) return;
    if (isSubmitMode) {
      await submit();
      void navigate('/submitted');
    } else {
      void navigate('/upload');
    }
  };

  return (
    <div
      className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 lg:hidden"
      aria-label="Submit action"
    >
      <button
        onClick={() => void handleCta()}
        disabled={!canProceed || submitting}
        aria-disabled={!canProceed || submitting}
        title={!canProceed ? 'Resolve all critical & major issues first' : undefined}
        className={clsx(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          canProceed && !submitting
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'cursor-default bg-gray-200 text-gray-400 shadow-none',
        )}
      >
        {submitting && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {isSubmitMode ? 'Submit' : 'Re-upload'}
        {!submitting && <span aria-hidden="true">{isSubmitMode ? '✓' : '↑'}</span>}
      </button>
    </div>
  );
}

export function ReviewPage() {
  const { status } = useReview();
  const review = useReviewStore((s) => s.review);
  const [activePane, setActivePane] = useState<MobilePane>('issues');

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
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky submission status bar */}
      <SubmissionStatusBar />

      {/* Mobile-only segmented tab switcher */}
      <div
        role="tablist"
        aria-label="View selector"
        className="flex shrink-0 gap-1 border-b border-gray-200 bg-white px-4 py-2 lg:hidden"
      >
        {(['document', 'issues'] as const).map((pane) => (
          <button
            key={pane}
            role="tab"
            aria-selected={activePane === pane}
            aria-controls={`view-tabpanel-${pane}`}
            id={`view-tab-${pane}`}
            onClick={() => setActivePane(pane)}
            className={clsx(
              'flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-inset',
              activePane === pane
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
          >
            {pane === 'document' ? 'Document' : 'Issues'}
          </button>
        ))}
      </div>

      {/* Two-pane layout — side-by-side on lg+, single pane on mobile */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 overflow-hidden px-4 py-4 sm:px-6">
        {/* Document pane */}
        <main
          id="view-tabpanel-document"
          role="tabpanel"
          aria-labelledby="view-tab-document"
          aria-label="Document viewer"
          className={clsx(
            'flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white',
            activePane === 'document' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
          )}
        >
          <ErrorBoundary label="Document viewer">
            <DocumentViewer />
          </ErrorBoundary>
        </main>

        {/* Issues pane */}
        <aside
          id="view-tabpanel-issues"
          role="tabpanel"
          aria-labelledby="view-tab-issues"
          aria-label="Issues panel"
          className={clsx(
            'overflow-hidden rounded-xl border border-gray-200 bg-white p-4 lg:flex lg:w-[400px] lg:flex-col xl:w-[440px]',
            activePane === 'issues' ? 'flex w-full flex-col' : 'hidden lg:flex',
          )}
        >
          <ErrorBoundary label="Issues panel">
            <IssuesPanel />
          </ErrorBoundary>
        </aside>
      </div>

      {/* Sticky bottom CTA — mobile only */}
      <MobileCtaBar />
    </div>
  );
}
