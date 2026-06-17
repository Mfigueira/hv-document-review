import type { Issue } from '../../types/review';

interface Props {
  issue: Issue;
  resolved: boolean;
  onToggle: () => void;
  onGoToPage: () => void;
}

const severityConfig = {
  critical: {
    label: 'Critical',
    icon: '⛔',
    tag: 'bg-red-100 text-red-700 ring-red-200',
  },
  major: {
    label: 'Major',
    icon: '⚠️',
    tag: 'bg-amber-100 text-amber-700 ring-amber-200',
  },
  minor: {
    label: 'Minor',
    icon: 'ℹ️',
    tag: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
} as const;

export function IssueCard({ issue, resolved, onToggle, onGoToPage }: Props) {
  const cfg = severityConfig[issue.severity];

  return (
    <div
      className={`group rounded-lg border p-3 transition-colors ${
        resolved
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <label className="mt-0.5 flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={resolved}
            onChange={onToggle}
            aria-label={`Mark "${issue.title}" as resolved`}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
        </label>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-sm font-medium leading-snug ${
                resolved ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {issue.title}
            </span>
          </div>

          {/* Severity tag + page */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cfg.tag}`}
              aria-label={`Severity: ${cfg.label}`}
            >
              <span aria-hidden="true">{cfg.icon}</span>
              {cfg.label}
            </span>
            <span className="text-[11px] text-gray-400">p.{issue.page}</span>
          </div>

          {/* Description */}
          <p
            className={`mt-1.5 text-xs leading-relaxed ${resolved ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {issue.description}
          </p>

          {/* Go to page */}
          <button
            onClick={onGoToPage}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          >
            Go to page {issue.page}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
