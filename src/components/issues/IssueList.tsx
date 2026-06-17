import type { Issue, Severity } from '../../types/review';
import { IssueCard } from './IssueCard';
import { filterIssuesBySeverity } from '../../lib/issues';

interface Props {
  issues: Issue[];
  resolvedIds: string[];
  severityFilter: Severity | 'all';
  onToggle: (id: string) => void;
  onGoToPage: (issueId: string) => void;
}

export function IssueList({ issues, resolvedIds, severityFilter, onToggle, onGoToPage }: Props) {
  const visible = filterIssuesBySeverity(issues, severityFilter);

  if (visible.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
        No issues
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list" aria-label="Issues">
      {visible.map((issue) => (
        <li key={issue.id}>
          <IssueCard
            issue={issue}
            resolved={resolvedIds.includes(issue.id)}
            onToggle={() => onToggle(issue.id)}
            onGoToPage={() => onGoToPage(issue.id)}
          />
        </li>
      ))}
    </ul>
  );
}
