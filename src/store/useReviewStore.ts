import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Review, Severity } from '../types/review';
import { getReview, submitReview, ApiError, type Scenario } from '../api/reviewApi';
import { publicUrl } from '../lib/utils';

interface ReviewState {
  // data
  review: Review | null;
  status: 'idle' | 'loading' | 'error' | 'ready';
  error: string | null;
  scenario: Scenario;
  // ui
  severityFilter: Severity | 'all';
  selectedPage: number | null;
  selectedIssueId: string | null;
  submitting: boolean;
  submitError: string | null;
  // resolution — persisted to localStorage, keyed by `${reviewId}:v${version}`
  resolvedIssueIds: Record<string, string[]>;
  // actions
  load: (scenario?: Scenario) => Promise<void>;
  setScenario: (s: Scenario) => void;
  toggleResolved: (issueId: string) => void;
  setFilter: (f: Severity | 'all') => void;
  selectIssue: (id: string | null) => void;
  submit: () => Promise<boolean>;
  resetResolved: () => void;
}

function resolvedKey(review: Review): string {
  return `${review.id}:v${review.version}`;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      review: null,
      status: 'idle',
      error: null,
      scenario: 'needs_revision',
      severityFilter: 'all',
      selectedPage: null,
      selectedIssueId: null,
      submitting: false,
      submitError: null,
      resolvedIssueIds: {},

      load: async (scenario?: Scenario) => {
        const activeScenario = scenario ?? get().scenario;
        set({
          status: 'loading',
          review: null,
          error: null,
          selectedPage: null,
          selectedIssueId: null,
        });
        try {
          const review = await getReview(activeScenario);
          review.document.pdf_url = publicUrl(review.document.pdf_url);
          set({ review, status: 'ready', scenario: activeScenario });
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to load review. Please try again.';
          set({ status: 'error', error: message });
        }
      },

      setScenario: (s: Scenario) => {
        set({ scenario: s });
        void get().load(s);
      },

      toggleResolved: (issueId: string) => {
        const { review, resolvedIssueIds } = get();
        if (!review) return;
        const key = resolvedKey(review);
        const current = resolvedIssueIds[key] ?? [];
        const next = current.includes(issueId)
          ? current.filter((id) => id !== issueId)
          : [...current, issueId];
        set({ resolvedIssueIds: { ...resolvedIssueIds, [key]: next } });
      },

      setFilter: (f: Severity | 'all') => set({ severityFilter: f }),

      selectIssue: (id: string | null) => {
        const { review } = get();
        if (id === null) {
          set({ selectedIssueId: null, selectedPage: null });
          return;
        }
        const issue = review?.issues.find((i) => i.id === id);
        set({ selectedIssueId: id, selectedPage: issue?.page ?? null });
      },

      submit: async () => {
        const { review } = get();
        if (!review) return false;
        set({ submitting: true, submitError: null });
        try {
          await submitReview(review.id);
          set({ submitting: false });
          return true;
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to submit review. Please try again.';
          set({ submitting: false, submitError: message });
          return false;
        }
      },

      resetResolved: () => {
        const { review, resolvedIssueIds } = get();
        if (!review) return;
        const key = resolvedKey(review);
        const { [key]: _drop, ...rest } = resolvedIssueIds;
        set({ resolvedIssueIds: rest });
      },
    }),
    {
      name: 'home-vision-review',
      partialize: (state) => ({
        resolvedIssueIds: state.resolvedIssueIds,
        scenario: state.scenario,
      }),
    },
  ),
);

/** Selector: resolved ids for the currently loaded review (shallow-compared to avoid infinite loops) */
export function useResolvedIds(): string[] {
  return useReviewStore(
    useShallow((s) => {
      if (!s.review) return [];
      const key = resolvedKey(s.review);
      return s.resolvedIssueIds[key] ?? [];
    }),
  );
}
