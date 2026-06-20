import type { Issue, Severity } from '../types/review';

export type CtaMode = 'reupload' | 'submit';

export interface IssueCounts {
  critical: number;
  major: number;
  minor: number;
  total: number;
}

export interface ReviewStats {
  counts: IssueCounts;
  blocking: Issue[];
  blockingRemaining: number;
  ctaMode: CtaMode;
  canProceed: boolean;
}

export function getCounts(issues: Issue[]): IssueCounts {
  const counts: IssueCounts = { critical: 0, major: 0, minor: 0, total: 0 };
  for (const issue of issues) {
    if (issue.severity === 'critical') counts.critical++;
    else if (issue.severity === 'major') counts.major++;
    else if (issue.severity === 'minor') counts.minor++;
  }
  counts.total = counts.critical + counts.major + counts.minor;
  return counts;
}

export function getBlockingIssues(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.severity === 'critical' || i.severity === 'major');
}

export function getBlockingRemaining(issues: Issue[], resolvedIds: string[]): number {
  const resolvedSet = new Set(resolvedIds);
  let remaining = 0;
  for (const issue of issues) {
    if (
      (issue.severity === 'critical' || issue.severity === 'major') &&
      !resolvedSet.has(issue.id)
    ) {
      remaining++;
    }
  }
  return remaining;
}

export function getCtaMode(issues: Issue[]): CtaMode {
  return getBlockingIssues(issues).length === 0 ? 'submit' : 'reupload';
}

/** Avoids calling getBlockingIssues twice (once for mode, once for remaining). */
export function getCanProceed(issues: Issue[], resolvedIds: string[]): boolean {
  const blocking = getBlockingIssues(issues);
  if (blocking.length === 0) return true;
  const resolvedSet = new Set(resolvedIds);
  return blocking.every((i) => resolvedSet.has(i.id));
}

/**
 * Single-pass computation of all derived review state.
 * Prefer this over calling getCounts / getBlockingIssues / getCtaMode /
 * getCanProceed individually when multiple values are needed at once.
 */
export function deriveReviewStats(issues: Issue[], resolvedIds: string[]): ReviewStats {
  const counts: IssueCounts = { critical: 0, major: 0, minor: 0, total: 0 };
  const blocking: Issue[] = [];

  for (const issue of issues) {
    if (issue.severity === 'critical') {
      counts.critical++;
      blocking.push(issue);
    } else if (issue.severity === 'major') {
      counts.major++;
      blocking.push(issue);
    } else if (issue.severity === 'minor') {
      counts.minor++;
    }
  }
  counts.total = counts.critical + counts.major + counts.minor;

  const resolvedSet = new Set(resolvedIds);
  const blockingRemaining = blocking.filter((i) => !resolvedSet.has(i.id)).length;
  const ctaMode: CtaMode = blocking.length === 0 ? 'submit' : 'reupload';
  const canProceed = ctaMode === 'submit' || blockingRemaining === 0;

  return { counts, blocking, blockingRemaining, ctaMode, canProceed };
}

export function groupIssuesByPage(issues: Issue[]): Map<number, Issue[]> {
  const map = new Map<number, Issue[]>();
  for (const issue of issues) {
    const bucket = map.get(issue.page);
    if (bucket) {
      bucket.push(issue);
    } else {
      map.set(issue.page, [issue]);
    }
  }
  return map;
}

export function filterIssuesBySeverity(
  issues: Issue[],
  filter: Severity | 'all',
): Issue[] {
  if (filter === 'all') return issues;
  return issues.filter((i) => i.severity === filter);
}
