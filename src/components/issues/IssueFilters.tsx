import type { Severity } from '../../types/review';
import type { IssueCounts } from '../../lib/issues';

interface Props {
  counts: IssueCounts;
  active: Severity | 'all';
  onChange: (filter: Severity | 'all') => void;
}

type FilterOption = { value: Severity | 'all'; label: string; count: number };

export function IssueFilters({ counts, active, onChange }: Props) {
  const options: FilterOption[] = [
    { value: 'all', label: 'All', count: counts.total },
    { value: 'critical', label: 'Critical', count: counts.critical },
    { value: 'major', label: 'Major', count: counts.major },
    { value: 'minor', label: 'Minor', count: counts.minor },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter issues by severity"
      className="flex gap-1 rounded-lg bg-gray-100 p-1"
    >
      {options.map(({ value, label, count }) => {
        const isActive = active === value;
        const dotColor =
          value === 'critical'
            ? 'bg-red-500'
            : value === 'major'
              ? 'bg-amber-500'
              : value === 'minor'
                ? 'bg-slate-400'
                : 'bg-gray-400';

        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(value)}
            className={`cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {value !== 'all' && (
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
            )}
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                isActive ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
