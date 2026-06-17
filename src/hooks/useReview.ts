import { useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';

/**
 * Loads the review for the active scenario into the store on mount.
 * Re-loads whenever the scenario changes.
 */
export function useReview() {
  const { load, status, review, scenario } = useReviewStore();

  useEffect(() => {
    if (status === 'idle') {
      void load(scenario);
    }
  }, [load, status, scenario]);

  return { status, review };
}
