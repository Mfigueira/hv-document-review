import { useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';

/**
 * Loads the review for the active scenario into the store on mount.
 * Re-loads whenever the scenario changes.
 */
export function useReview() {
  const status = useReviewStore((s) => s.status);
  const scenario = useReviewStore((s) => s.scenario);
  const load = useReviewStore((s) => s.load);
  const review = useReviewStore((s) => s.review);

  useEffect(() => {
    if (status === 'idle') {
      void load(scenario);
    }
  }, [load, status, scenario]);

  return { status, review };
}
