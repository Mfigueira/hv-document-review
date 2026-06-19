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
  const counts = issues.reduce(
    (acc, i) => {
      if (i.severity === 'critical') acc.critical++;
      else if (i.severity === 'major') acc.major++;
      else if (i.severity === 'minor') acc.minor++;
      return acc;
    },
    { critical: 0, major: 0, minor: 0 },
  );
  return { ...counts, total: counts.critical + counts.major + counts.minor };
}

export function getBlockingIssues(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.severity === 'critical' || i.severity === 'major');
}

export function getBlockingRemaining(issues: Issue[], resolvedIds: string[]): number {
  return getBlockingIssues(issues).filter((i) => !resolvedIds.includes(i.id)).length;
}

export function getCtaMode(issues: Issue[]): CtaMode {
  return getBlockingIssues(issues).length === 0 ? 'submit' : 'reupload';
}

/** Avoids calling getBlockingIssues twice (once for mode, once for remaining). */
export function getCanProceed(issues: Issue[], resolvedIds: string[]): boolean {
  const blocking = getBlockingIssues(issues);
  if (blocking.length === 0) return true;
  return blocking.filter((i) => !resolvedIds.includes(i.id)).length === 0;
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

  const blockingRemaining = blocking.filter((i) => !resolvedIds.includes(i.id)).length;
  const ctaMode: CtaMode = blocking.length === 0 ? 'submit' : 'reupload';
  const canProceed = ctaMode === 'submit' || blockingRemaining === 0;

  return { counts, blocking, blockingRemaining, ctaMode, canProceed };
}

export function groupIssuesByPage(issues: Issue[]): Map<number, Issue[]> {
  const map = new Map<number, Issue[]>();
  for (const issue of issues) {
    const existing = map.get(issue.page) ?? [];
    map.set(issue.page, [...existing, issue]);
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
