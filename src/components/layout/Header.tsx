import type { Review, ReviewStatus } from '../../types/review';

interface Props {
  review: Review | null;
}

const statusLabel: Record<ReviewStatus, string> = {
  created: 'Created',
  processing: 'Processing',
  on_review: 'In Review',
  submitted: 'Submitted',
};

const statusClass: Record<ReviewStatus, string> = {
  created: 'bg-gray-100 text-gray-600',
  processing: 'bg-purple-100 text-purple-700',
  on_review: 'bg-blue-100 text-blue-700',
  submitted: 'bg-green-100 text-green-700',
};

export function Header({ review }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Product name */}
        <span className="text-base font-semibold text-blue-700 shrink-0">Document Review</span>

        {review && (
          <>
            <span className="text-gray-300 hidden sm:block">|</span>

            {/* File name */}
            <span className="hidden sm:block truncate text-sm text-gray-700 font-medium max-w-xs lg:max-w-sm">
              {review.name}
            </span>

            {/* Version badge */}
            <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
              v{review.version}
            </span>

            {/* Status badge */}
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[review.status]}`}
            >
              {statusLabel[review.status]}
            </span>

            {/* Assignee — pushed right */}
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                {review.user.first_name[0]}
                {review.user.last_name[0]}
              </div>
              <span className="hidden md:block text-sm text-gray-600">
                {review.user.first_name} {review.user.last_name}
              </span>
            </div>
          </>
        )}

        {!review && (
          <div className="ml-auto h-7 w-32 animate-pulse rounded bg-gray-200" />
        )}
      </div>
    </header>
  );
}
