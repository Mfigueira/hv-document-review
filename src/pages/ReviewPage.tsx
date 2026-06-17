import { useReview } from '../hooks/useReview';
import { useReviewStore } from '../store/useReviewStore';

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

  const criticalCount = review.issues.filter((i) => i.severity === 'critical').length;
  const majorCount = review.issues.filter((i) => i.severity === 'major').length;
  const minorCount = review.issues.filter((i) => i.severity === 'minor').length;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{review.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Version {review.version} &middot; Uploaded{' '}
          {new Date(review.uploaded_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}{' '}
          &middot; Assigned to {review.user.first_name} {review.user.last_name}
        </p>
      </div>

      {/* Issue summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {criticalCount} critical
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {majorCount} major
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          {minorCount} minor
        </span>
      </div>

      {/* Two-pane split view — placeholder for Stage 2/3 */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Document pane */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Document
          </p>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm">
            PDF viewer — Stage 3
          </div>
        </div>

        {/* Issues pane */}
        <div className="w-full lg:w-96 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Issues ({review.issues.length})
          </p>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm">
            Issues panel — Stage 2
          </div>
        </div>
      </div>
    </div>
  );
}
