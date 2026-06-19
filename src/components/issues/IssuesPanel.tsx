import { useEffect } from 'react';
import { useReviewStore, useResolvedIds } from '../../store/useReviewStore';
import { getCounts } from '../../lib/issues';
import { IssueFilters } from './IssueFilters';
import { IssueList } from './IssueList';

export function IssuesPanel() {
  const review = useReviewStore((s) => s.review);
  const severityFilter = useReviewStore((s) => s.severityFilter);
  const setFilter = useReviewStore((s) => s.setFilter);
  const toggleResolved = useReviewStore((s) => s.toggleResolved);
  const selectIssue = useReviewStore((s) => s.selectIssue);
  const selectedIssueId = useReviewStore((s) => s.selectedIssueId);
  const resolvedIds = useResolvedIds();

  // If the selected issue is hidden by the current severity filter, clear the
  // filter so it becomes visible in the list.
  useEffect(() => {
    if (!selectedIssueId || !review) return;
    const issue = review.issues.find((i) => i.id === selectedIssueId);
    if (issue && severityFilter !== 'all' && issue.severity !== severityFilter) {
      setFilter('all');
    }
  }, [selectedIssueId, review, severityFilter, setFilter]);

  if (!review) return null;

  const counts = getCounts(review.issues);

  return (
    <section aria-label="Issues panel" className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Issues</h2>
        <span className="text-xs text-gray-400">{review.issues.length} total</span>
      </div>

      {/* Filters */}
      <div className="mb-3">
        <IssueFilters counts={counts} active={severityFilter} onChange={setFilter} />
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        <IssueList
          issues={review.issues}
          resolvedIds={resolvedIds}
          severityFilter={severityFilter}
          selectedIssueId={selectedIssueId}
          onToggle={toggleResolved}
          onGoToPage={(issueId) => selectIssue(issueId)}
        />
      </div>
    </section>
  );
}
