import { describe, it, expect } from 'vitest';
import type { Review } from '../types/review';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';

describe('mock data integrity', () => {
  it('needs_revision mock has the expected structure', () => {
    const r = needsRevision as Review;
    expect(r.id).toBe('souj5sd12c8a3f');
    expect(r.version).toBe(2);
    expect(r.document.pdf_url).toBe('/example_document.pdf');
    expect(r.issues.length).toBe(25);
    expect(r.issues.filter((i) => i.severity === 'critical').length).toBe(4);
    expect(r.issues.filter((i) => i.severity === 'major').length).toBe(8);
    expect(r.issues.filter((i) => i.severity === 'minor').length).toBe(13);
  });

  it('clean mock has only minor issues', () => {
    const r = clean as Review;
    expect(r.version).toBe(3);
    expect(r.document.pdf_url).toBe('/example_document.pdf');
    const blocking = r.issues.filter((i) => i.severity === 'critical' || i.severity === 'major');
    expect(blocking.length).toBe(0);
    expect(r.issues.length).toBeGreaterThan(0);
  });
});
