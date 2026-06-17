import { Link } from 'react-router-dom';

export function UploadPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-700">Upload — Out of Scope</h1>
        <p className="mt-2 text-sm text-gray-500">
          This page is a placeholder. The Upload and Processing pages are owned by another team and
          are out of scope for this challenge.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          In the full flow: Upload &rarr; Processing &rarr; Review (new version).
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Review
        </Link>
      </div>
    </div>
  );
}
