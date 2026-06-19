import { useNavigate } from 'react-router-dom';
import { useReviewStore, useResolvedIds } from '../../store/useReviewStore';
import {
  getCounts,
  getBlockingIssues,
  getBlockingRemaining,
  getCtaMode,
  getCanProceed,
} from '../../lib/issues';
import clsx from 'clsx';

export function SubmissionStatusBar() {
  const navigate = useNavigate();
  const review = useReviewStore((s) => s.review);
  const submitting = useReviewStore((s) => s.submitting);
  const submit = useReviewStore((s) => s.submit);
  const resolvedIds = useResolvedIds();

  if (!review) return null;

  const issues = review.issues;
  const counts = getCounts(issues);
  const blocking = getBlockingIssues(issues);
  const blockingTotal = blocking.length;
  const blockingRemaining = getBlockingRemaining(issues, resolvedIds);
  const blockingResolved = blockingTotal - blockingRemaining;
  const ctaMode = getCtaMode(issues);
  const canProceed = getCanProceed(issues, resolvedIds);

  const isSubmitMode = ctaMode === 'submit';
  const isCleared = isSubmitMode || (canProceed && blockingTotal > 0);

  const progressPct = blockingTotal > 0 ? (blockingResolved / blockingTotal) * 100 : 100;

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
      role="status"
      aria-live="polite"
      aria-label="Submission status"
      className={`sticky top-0 z-10 border-b px-4 py-3 transition-colors sm:px-6 ${
        isCleared ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="mx-auto flex max-w-7xl xl:max-w-[1232px] flex-wrap items-center gap-3">
        {/* Status message */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {isSubmitMode ? (
            <p className="text-sm font-medium text-green-800">
              No critical or major issues — ready to submit
            </p>
          ) : isCleared ? (
            <p className="text-sm font-medium text-green-800">
              All {blockingTotal} blocking issues resolved — ready to re-upload
            </p>
          ) : (
            <p className="text-sm font-medium text-amber-800">
              {blockingResolved} of {blockingTotal} blocking issues resolved —{' '}
              <span className="font-semibold">{blockingRemaining} left before re-upload</span>
            </p>
          )}

          {/* Secondary hint */}
          {!isSubmitMode && (
            <p className={`text-xs ${!isCleared ? 'text-amber-700/80' : 'text-gray-600/80'}`}>
              {isCleared
                ? 'Click Re-upload to continue to the upload step.'
                : `Resolve all ${counts.critical > 0 ? `${counts.critical} critical` : ''}${counts.critical > 0 && counts.major > 0 ? ' and ' : ''}${counts.major > 0 ? `${counts.major} major` : ''} issue${blockingTotal !== 1 ? 's' : ''} to enable re-upload. Minor issues may be ignored.`}
            </p>
          )}

          {/* Progress bar (only shown when there are blocking issues) */}
          {blockingTotal > 0 && (
            <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-amber-200">
              <div
                role="progressbar"
                aria-valuenow={blockingResolved}
                aria-valuemin={0}
                aria-valuemax={blockingTotal}
                aria-label={`${blockingResolved} of ${blockingTotal} blocking issues resolved`}
                style={{ width: `${progressPct}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isCleared ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
            </div>
          )}
        </div>

        {/* CTA button — hidden on mobile (MobileCtaBar handles it there) */}
        <div className="relative hidden shrink-0 lg:block">
          {!canProceed && (
            <span
              id="cta-tooltip"
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-center text-xs text-white shadow-lg group-hover:block"
            >
              {isSubmitMode ? '' : 'Resolve all critical & major issues first'}
            </span>
          )}
          <button
            onClick={() => void handleCta()}
            aria-disabled={!canProceed || submitting}
            disabled={!canProceed || submitting}
            aria-describedby={!canProceed ? 'cta-tooltip' : undefined}
            title={!canProceed ? 'Resolve all critical & major issues first' : undefined}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all focus:outline-none',
              {
                'cursor-pointer bg-green-600 text-white hover:bg-green-700':
                  canProceed && !submitting,
                'cursor-default bg-gray-200 text-gray-400 shadow-none': !canProceed || submitting,
              },
            )}
          >
            {submitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {isSubmitMode ? 'Submit' : 'Re-upload'}
            {!submitting && <span aria-hidden="true">{isSubmitMode ? '✓' : '↑'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
