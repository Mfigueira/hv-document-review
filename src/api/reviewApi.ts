import { ReviewSchema } from '../types/review';
import type { Review } from '../types/review';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';

export type Scenario = 'needs_revision' | 'clean';

export type ApiErrorCode = 'REVIEW_NOT_FOUND' | 'REVIEW_LOAD_FAILED' | 'SUBMIT_FAILED';

export class ApiError extends Error {
  readonly cause?: unknown;

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorCode: ApiErrorCode = 'REVIEW_LOAD_FAILED',
    cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.cause = cause;
  }
}

export async function getReview(scenario: Scenario): Promise<Review> {
  try {
    await new Promise((r) => setTimeout(r, 500));

    const data = scenario === 'clean' ? clean : needsRevision;

    const review = ReviewSchema.parse(data);

    return review;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to load review', 500, 'REVIEW_LOAD_FAILED', err);
  }
}

export async function submitReview(_id: string): Promise<{ ok: true }> {
  try {
    await new Promise((r) => setTimeout(r, 600));

    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to submit review', 500, 'SUBMIT_FAILED', err);
  }
}
