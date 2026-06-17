import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Review, Severity } from '../types/review';
import { getReview, submitReview, type Scenario } from '../api/reviewApi';

interface ReviewState {
  // data
  review: Review | null;
  status: 'idle' | 'loading' | 'error' | 'ready';
  scenario: Scenario;
  // ui
  severityFilter: Severity | 'all';
  selectedPage: number | null;
  selectedIssueId: string | null;
  submitting: boolean;
  // resolution — persisted to localStorage, keyed by `${reviewId}:v${version}`
  resolvedIssueIds: Record<string, string[]>;
  // actions
  load: (scenario?: Scenario) => Promise<void>;
  setScenario: (s: Scenario) => void;
  toggleResolved: (issueId: string) => void;
  setFilter: (f: Severity | 'all') => void;
  selectIssue: (id: string | null) => void;
  submit: () => Promise<void>;
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
      scenario: 'needs_revision',
      severityFilter: 'all',
      selectedPage: null,
      selectedIssueId: null,
      submitting: false,
      resolvedIssueIds: {},

      load: async (scenario?: Scenario) => {
        const activeScenario = scenario ?? get().scenario;
        set({ status: 'loading', review: null, selectedPage: null, selectedIssueId: null });
        try {
          const review = await getReview(activeScenario);
          set({ review, status: 'ready', scenario: activeScenario });
        } catch {
          set({ status: 'error' });
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
        if (!review) return;
        set({ submitting: true });
        try {
          await submitReview(review.id);
        } finally {
          set({ submitting: false });
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
