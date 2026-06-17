import type { Review } from '../types/review';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';

export type Scenario = 'needs_revision' | 'clean';

export async function getReview(scenario: Scenario): Promise<Review> {
  await new Promise((r) => setTimeout(r, 500));
  return (scenario === 'clean' ? clean : needsRevision) as Review;
}

export async function submitReview(_id: string): Promise<{ ok: true }> {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true };
}
