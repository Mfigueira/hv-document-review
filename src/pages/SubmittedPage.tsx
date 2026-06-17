import { Link } from 'react-router-dom';
import { useReviewStore } from '../store/useReviewStore';

export function SubmittedPage() {
  const review = useReviewStore((s) => s.review);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm">
        {/* Check icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">Review Submitted</h1>

        {review && (
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{review.name}</span>
            <br />
            Version {review.version} has been successfully submitted.
          </p>
        )}

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Back to Review
        </Link>
      </div>
    </div>
  );
}
