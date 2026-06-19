import type { Review } from '../types/review';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';

export type Scenario = 'needs_revision' | 'clean';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getReview(scenario: Scenario): Promise<Review> {
  try {
    await new Promise((r) => setTimeout(r, 500));

    if (!scenario) {
      throw new ApiError('Scenario is required', 400);
    }

    const data = scenario === 'clean' ? clean : needsRevision;

    if (!data) {
      throw new ApiError(`Review data not found for scenario: ${scenario}`, 404);
    }

    return data as Review;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to load review');
  }
}

export async function submitReview(_id: string): Promise<{ ok: true }> {
  try {
    await new Promise((r) => setTimeout(r, 600));

    if (!_id) {
      throw new ApiError('Review ID is required', 400);
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to submit review');
  }
}
