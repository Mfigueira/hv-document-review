import type { Issue, Severity } from '../types/review';

export type CtaMode = 'reupload' | 'submit';

export interface IssueCounts {
  critical: number;
  major: number;
  minor: number;
  total: number;
}

export function getCounts(issues: Issue[]): IssueCounts {
  const critical = issues.filter((i) => i.severity === 'critical').length;
  const major = issues.filter((i) => i.severity === 'major').length;
  const minor = issues.filter((i) => i.severity === 'minor').length;
  return { critical, major, minor, total: critical + major + minor };
}

export function getBlockingIssues(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.severity === 'critical' || i.severity === 'major');
}

export function getBlockingRemaining(issues: Issue[], resolvedIds: string[]): number {
  const blocking = getBlockingIssues(issues);
  return blocking.filter((i) => !resolvedIds.includes(i.id)).length;
}

export function getCtaMode(issues: Issue[]): CtaMode {
  return getBlockingIssues(issues).length === 0 ? 'submit' : 'reupload';
}

export function getCanProceed(issues: Issue[], resolvedIds: string[]): boolean {
  const mode = getCtaMode(issues);
  if (mode === 'submit') return true;
  return getBlockingRemaining(issues, resolvedIds) === 0;
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
