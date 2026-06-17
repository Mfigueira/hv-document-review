import { describe, it, expect } from 'vitest';
import type { Issue } from '../types/review';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';
import {
  getCounts,
  getBlockingIssues,
  getBlockingRemaining,
  getCtaMode,
  getCanProceed,
  groupIssuesByPage,
} from './issues';
import type { Review } from '../types/review';

const revisionIssues = (needsRevision as Review).issues;
const cleanIssues = (clean as Review).issues;

describe('getCounts', () => {
  it('returns correct counts for needs_revision mock (4/8/13)', () => {
    const counts = getCounts(revisionIssues);
    expect(counts.critical).toBe(4);
    expect(counts.major).toBe(8);
    expect(counts.minor).toBe(13);
    expect(counts.total).toBe(25);
  });

  it('returns zero critical/major for clean mock', () => {
    const counts = getCounts(cleanIssues);
    expect(counts.critical).toBe(0);
    expect(counts.major).toBe(0);
    expect(counts.minor).toBeGreaterThan(0);
  });
});

describe('getBlockingIssues', () => {
  it('returns only critical and major issues', () => {
    const blocking = getBlockingIssues(revisionIssues);
    expect(blocking.length).toBe(12);
    expect(blocking.every((i) => i.severity !== 'minor')).toBe(true);
  });

  it('returns empty for clean mock', () => {
    expect(getBlockingIssues(cleanIssues)).toHaveLength(0);
  });
});

describe('getBlockingRemaining', () => {
  it('returns 12 when nothing resolved for needs_revision', () => {
    expect(getBlockingRemaining(revisionIssues, [])).toBe(12);
  });

  it('decrements as issues are resolved', () => {
    const blocking = getBlockingIssues(revisionIssues);
    const resolved = blocking.slice(0, 5).map((i) => i.id);
    expect(getBlockingRemaining(revisionIssues, resolved)).toBe(7);
  });

  it('returns 0 when all blocking resolved', () => {
    const allBlockingIds = getBlockingIssues(revisionIssues).map((i) => i.id);
    expect(getBlockingRemaining(revisionIssues, allBlockingIds)).toBe(0);
  });

  it('minor issues do not count as blocking', () => {
    const minorIds = revisionIssues.filter((i) => i.severity === 'minor').map((i) => i.id);
    expect(getBlockingRemaining(revisionIssues, minorIds)).toBe(12);
  });
});

describe('getCtaMode', () => {
  it('returns reupload when critical/major issues exist', () => {
    expect(getCtaMode(revisionIssues)).toBe('reupload');
  });

  it('returns submit for clean mock (no critical/major)', () => {
    expect(getCtaMode(cleanIssues)).toBe('submit');
  });

  it('returns submit for empty issues list', () => {
    expect(getCtaMode([])).toBe('submit');
  });
});

describe('getCanProceed', () => {
  it('needs_revision is not proceedable until all 12 blocking resolved', () => {
    expect(getCanProceed(revisionIssues, [])).toBe(false);

    const partial = getBlockingIssues(revisionIssues)
      .slice(0, 11)
      .map((i) => i.id);
    expect(getCanProceed(revisionIssues, partial)).toBe(false);
  });

  it('needs_revision becomes proceedable when all 12 blocking resolved', () => {
    const allBlockingIds = getBlockingIssues(revisionIssues).map((i) => i.id);
    expect(getCanProceed(revisionIssues, allBlockingIds)).toBe(true);
  });

  it('clean mock is always proceedable (submit mode)', () => {
    expect(getCanProceed(cleanIssues, [])).toBe(true);
  });
});

describe('groupIssuesByPage', () => {
  it('groups issues by page number', () => {
    const issues: Issue[] = [
      { id: 'a', title: 'A', description: '', severity: 'critical', page: 3 },
      { id: 'b', title: 'B', description: '', severity: 'major', page: 3 },
      { id: 'c', title: 'C', description: '', severity: 'minor', page: 5 },
    ];
    const grouped = groupIssuesByPage(issues);
    expect(grouped.get(3)).toHaveLength(2);
    expect(grouped.get(5)).toHaveLength(1);
    expect(grouped.get(1)).toBeUndefined();
  });

  it('handles real mock data (page 14 has multiple issues)', () => {
    const grouped = groupIssuesByPage(revisionIssues);
    const page14 = grouped.get(14) ?? [];
    expect(page14.length).toBeGreaterThan(1);
  });
});
