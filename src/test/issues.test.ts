import { describe, it, expect } from 'vitest';
import type { Issue } from '../types/review';
import {
  getCounts,
  getBlockingIssues,
  getBlockingRemaining,
  getCtaMode,
  getCanProceed,
  groupIssuesByPage,
  filterIssuesBySeverity,
} from '../lib/issues';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';
import type { Review } from '../types/review';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeIssue(
  id: string,
  severity: 'critical' | 'major' | 'minor',
  page = 1,
): Issue {
  return {
    id,
    severity,
    page,
    title: `Issue ${id}`,
    description: `Description for ${id}`,
  };
}

const CRITICAL = makeIssue('c1', 'critical', 1);
const CRITICAL2 = makeIssue('c2', 'critical', 3);
const MAJOR = makeIssue('m1', 'major', 2);
const MAJOR2 = makeIssue('m2', 'major', 2);
const MINOR = makeIssue('mi1', 'minor', 5);
const MINOR2 = makeIssue('mi2', 'minor', 5);

// ── getCounts ──────────────────────────────────────────────────────────────────

describe('getCounts', () => {
  it('returns zero counts for empty list', () => {
    expect(getCounts([])).toEqual({ critical: 0, major: 0, minor: 0, total: 0 });
  });

  it('counts each severity correctly', () => {
    const counts = getCounts([CRITICAL, CRITICAL2, MAJOR, MINOR, MINOR2]);
    expect(counts).toEqual({ critical: 2, major: 1, minor: 2, total: 5 });
  });

  it('total equals the sum of all severities', () => {
    const issues = [CRITICAL, MAJOR, MAJOR2, MINOR];
    const { critical, major, minor, total } = getCounts(issues);
    expect(total).toBe(critical + major + minor);
  });

  it('matches the real mock: 4 critical, 8 major, 13 minor', () => {
    const counts = getCounts((needsRevision as Review).issues);
    expect(counts).toEqual({ critical: 4, major: 8, minor: 13, total: 25 });
  });

  it('clean mock has only minor issues', () => {
    const counts = getCounts((clean as Review).issues);
    expect(counts.critical).toBe(0);
    expect(counts.major).toBe(0);
    expect(counts.minor).toBeGreaterThan(0);
  });
});

// ── getBlockingIssues ──────────────────────────────────────────────────────────

describe('getBlockingIssues', () => {
  it('returns empty array when no blocking issues', () => {
    expect(getBlockingIssues([MINOR, MINOR2])).toHaveLength(0);
  });

  it('includes critical and major, excludes minor', () => {
    const blocking = getBlockingIssues([CRITICAL, MAJOR, MINOR]);
    expect(blocking).toHaveLength(2);
    expect(blocking.map((i) => i.id)).toEqual(expect.arrayContaining(['c1', 'm1']));
    expect(blocking.map((i) => i.id)).not.toContain('mi1');
  });

  it('returns all blocking issues from the real mock', () => {
    const blocking = getBlockingIssues((needsRevision as Review).issues);
    expect(blocking).toHaveLength(12); // 4 critical + 8 major
  });
});

// ── getBlockingRemaining ───────────────────────────────────────────────────────

describe('getBlockingRemaining', () => {
  const issues = [CRITICAL, CRITICAL2, MAJOR, MINOR];

  it('returns total blocking count when nothing resolved', () => {
    expect(getBlockingRemaining(issues, [])).toBe(3);
  });

  it('decrements as blocking issues are resolved', () => {
    expect(getBlockingRemaining(issues, ['c1'])).toBe(2);
    expect(getBlockingRemaining(issues, ['c1', 'c2'])).toBe(1);
    expect(getBlockingRemaining(issues, ['c1', 'c2', 'm1'])).toBe(0);
  });

  it('resolving a minor issue does not reduce blocking count', () => {
    expect(getBlockingRemaining(issues, ['mi1'])).toBe(3);
  });

  it('returns 0 when there are no blocking issues', () => {
    expect(getBlockingRemaining([MINOR, MINOR2], ['mi1'])).toBe(0);
  });
});

// ── getCtaMode ─────────────────────────────────────────────────────────────────

describe('getCtaMode', () => {
  it('returns "submit" when there are no critical or major issues', () => {
    expect(getCtaMode([MINOR, MINOR2])).toBe('submit');
    expect(getCtaMode([])).toBe('submit');
  });

  it('returns "reupload" when there are critical issues', () => {
    expect(getCtaMode([CRITICAL, MINOR])).toBe('reupload');
  });

  it('returns "reupload" when there are major issues only', () => {
    expect(getCtaMode([MAJOR, MINOR])).toBe('reupload');
  });

  it('returns "reupload" for the needs_revision mock', () => {
    expect(getCtaMode((needsRevision as Review).issues)).toBe('reupload');
  });

  it('returns "submit" for the clean mock', () => {
    expect(getCtaMode((clean as Review).issues)).toBe('submit');
  });
});

// ── getCanProceed ──────────────────────────────────────────────────────────────

describe('getCanProceed', () => {
  describe('Scenario B — clean (submit mode)', () => {
    it('always returns true regardless of resolvedIds', () => {
      expect(getCanProceed([MINOR], [])).toBe(true);
      expect(getCanProceed([MINOR], ['mi1'])).toBe(true);
      expect(getCanProceed([], [])).toBe(true);
    });
  });

  describe('Scenario A — needs revision (reupload mode)', () => {
    const issues = [CRITICAL, MAJOR, MINOR];

    it('returns false when no blocking issues are resolved', () => {
      expect(getCanProceed(issues, [])).toBe(false);
    });

    it('returns false when some but not all blocking issues are resolved', () => {
      expect(getCanProceed(issues, ['c1'])).toBe(false);
    });

    it('returns true when all blocking issues are resolved', () => {
      expect(getCanProceed(issues, ['c1', 'm1'])).toBe(true);
    });

    it('returns true even when a minor is NOT resolved (minor is optional)', () => {
      expect(getCanProceed(issues, ['c1', 'm1'])).toBe(true);
    });

    it('resolving a minor only is not enough to proceed', () => {
      expect(getCanProceed(issues, ['mi1'])).toBe(false);
    });

    it('CTA is blocked for the real needs_revision mock until all 12 blocking resolved', () => {
      const realIssues = (needsRevision as Review).issues;
      const allBlockingIds = getBlockingIssues(realIssues).map((i) => i.id);
      expect(getCanProceed(realIssues, [])).toBe(false);
      expect(getCanProceed(realIssues, allBlockingIds.slice(0, 11))).toBe(false);
      expect(getCanProceed(realIssues, allBlockingIds)).toBe(true);
    });
  });
});

// ── groupIssuesByPage ──────────────────────────────────────────────────────────

describe('groupIssuesByPage', () => {
  it('returns empty map for empty input', () => {
    expect(groupIssuesByPage([])).toEqual(new Map());
  });

  it('groups issues by their page number', () => {
    const issues = [CRITICAL, MAJOR, MAJOR2, MINOR]; // pages 1, 2, 2, 5
    const map = groupIssuesByPage(issues);
    expect(map.get(1)).toHaveLength(1);
    expect(map.get(2)).toHaveLength(2);
    expect(map.get(5)).toHaveLength(1);
    expect(map.has(3)).toBe(false);
  });

  it('preserves issue order within a page', () => {
    const issues = [MAJOR, MAJOR2]; // both on page 2
    const map = groupIssuesByPage(issues);
    expect(map.get(2)!.map((i) => i.id)).toEqual(['m1', 'm2']);
  });
});

// ── filterIssuesBySeverity ────────────────────────────────────────────────────

describe('filterIssuesBySeverity', () => {
  const issues = [CRITICAL, MAJOR, MINOR];

  it('returns all issues for "all" filter', () => {
    expect(filterIssuesBySeverity(issues, 'all')).toHaveLength(3);
  });

  it('filters to only critical', () => {
    const result = filterIssuesBySeverity(issues, 'critical');
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('critical');
  });

  it('filters to only major', () => {
    expect(filterIssuesBySeverity(issues, 'major')).toHaveLength(1);
  });

  it('filters to only minor', () => {
    expect(filterIssuesBySeverity(issues, 'minor')).toHaveLength(1);
  });

  it('returns empty when no issues match the filter', () => {
    expect(filterIssuesBySeverity([MINOR], 'critical')).toHaveLength(0);
  });
});
