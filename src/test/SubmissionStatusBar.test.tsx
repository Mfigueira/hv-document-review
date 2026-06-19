/**
 * Component tests for SubmissionStatusBar.
 * Tests the most important user-visible behaviour: CTA disabled state and
 * Submit / Re-upload routing logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubmissionStatusBar } from '../components/submission/SubmissionStatusBar';
import { useReviewStore } from '../store/useReviewStore';
import { getBlockingIssues } from '../lib/issues';
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';
import type { Review } from '../types/review';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Render the status bar inside a router so useNavigate works. */
function renderStatusBar(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="*" element={<SubmissionStatusBar />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Reset the Zustand store to a clean state before each test. */
function resetStore(review: Review | null = null, resolvedIds: string[] = []) {
  const resolvedIssueIds: Record<string, string[]> = {};
  if (review && resolvedIds.length > 0) {
    const key = `${review.id}:v${review.version}`;
    resolvedIssueIds[key] = resolvedIds;
  }
  useReviewStore.setState({
    review,
    status: review ? 'ready' : 'idle',
    submitting: false,
    resolvedIssueIds,
    severityFilter: 'all',
    selectedPage: null,
    selectedIssueId: null,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SubmissionStatusBar — Scenario A (needs revision)', () => {
  const review = needsRevision as Review;
  const blockingIds = getBlockingIssues(review.issues).map((i) => i.id);

  beforeEach(() => resetStore(review, []));

  it('renders the Re-upload button when there are critical/major issues', () => {
    renderStatusBar();
    expect(screen.getByRole('button', { name: /re-upload/i })).toBeInTheDocument();
  });

  it('CTA is disabled when no blocking issues are resolved', () => {
    renderStatusBar();
    const btn = screen.getByRole('button', { name: /re-upload/i });
    expect(btn).toBeDisabled();
  });

  it('CTA remains disabled when only some blocking issues are resolved', () => {
    resetStore(review, blockingIds.slice(0, 6));
    renderStatusBar();
    expect(screen.getByRole('button', { name: /re-upload/i })).toBeDisabled();
  });

  it('CTA becomes enabled when ALL blocking issues are resolved', () => {
    resetStore(review, blockingIds);
    renderStatusBar();
    expect(screen.getByRole('button', { name: /re-upload/i })).not.toBeDisabled();
  });

  it('resolving minor issues alone does not enable the CTA', () => {
    const minorIds = review.issues
      .filter((i) => i.severity === 'minor')
      .map((i) => i.id);
    resetStore(review, minorIds);
    renderStatusBar();
    expect(screen.getByRole('button', { name: /re-upload/i })).toBeDisabled();
  });

  it('shows how many blocking issues remain in the status text', () => {
    renderStatusBar();
    // 12 blocking total, 0 resolved → "0 of 12 … 12 left"
    expect(screen.getByText(/12 left before re-upload/i)).toBeInTheDocument();
  });

  it('shows resolved count in the progress message', () => {
    resetStore(review, blockingIds.slice(0, 5));
    renderStatusBar();
    expect(screen.getByText(/5 of 12/i)).toBeInTheDocument();
  });

  it('has a progressbar with correct aria values', () => {
    resetStore(review, blockingIds.slice(0, 4));
    renderStatusBar();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '4');
    expect(bar).toHaveAttribute('aria-valuemax', '12');
  });
});

describe('SubmissionStatusBar — Scenario B (clean / submit mode)', () => {
  const review = clean as Review;

  beforeEach(() => resetStore(review, []));

  it('renders the Submit button for a clean review', () => {
    renderStatusBar();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('Submit button is enabled immediately (no blocking issues to resolve)', () => {
    renderStatusBar();
    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled();
  });
});

describe('SubmissionStatusBar — ARIA & semantics', () => {
  const review = needsRevision as Review;

  beforeEach(() => resetStore(review));

  it('has role="status" and aria-live="polite" for screen-reader announcements', () => {
    renderStatusBar();
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('returns null when no review is loaded', () => {
    resetStore(null);
    const { container } = renderStatusBar();
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SubmissionStatusBar — Submit navigation', () => {
  it('navigates to /submitted after successful submit in clean scenario', async () => {
    const review = clean as Review;
    resetStore(review, []);

    // Spy on the store's submit action so it resolves immediately
    const submitSpy = vi.fn().mockResolvedValue(undefined);
    useReviewStore.setState({ submit: submitSpy });

    let navigatedTo = '';
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SubmissionStatusBar />} />
          <Route
            path="/submitted"
            element={<div>Submitted Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    // Before clicking
    expect(screen.queryByText('Submitted Page')).not.toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitBtn);

    expect(submitSpy).toHaveBeenCalledOnce();
    // After navigation the submitted page should be shown
    expect(await screen.findByText('Submitted Page')).toBeInTheDocument();

    void navigatedTo; // suppress unused warning
  });
});

describe('Persistence behaviour', () => {
  it('resolved IDs are stored keyed by review id + version', () => {
    const review = needsRevision as Review;
    resetStore(review, ['c1', 'c2']);

    const state = useReviewStore.getState();
    const key = `${review.id}:v${review.version}`;
    expect(state.resolvedIssueIds[key]).toEqual(['c1', 'c2']);
  });

  it('toggleResolved adds an id if not present', () => {
    const review = needsRevision as Review;
    resetStore(review, []);
    const { toggleResolved } = useReviewStore.getState();

    toggleResolved(review.issues[0].id);

    const key = `${review.id}:v${review.version}`;
    expect(useReviewStore.getState().resolvedIssueIds[key]).toContain(
      review.issues[0].id,
    );
  });

  it('toggleResolved removes an id if already present', () => {
    const review = needsRevision as Review;
    const id = review.issues[0].id;
    resetStore(review, [id]);
    const { toggleResolved } = useReviewStore.getState();

    toggleResolved(id);

    const key = `${review.id}:v${review.version}`;
    expect(useReviewStore.getState().resolvedIssueIds[key]).not.toContain(id);
  });

  it('resetResolved clears only the current review key', () => {
    const review = needsRevision as Review;
    const key = `${review.id}:v${review.version}`;
    resetStore(review, ['c1', 'c2']);
    // Add a key for a different review to ensure it survives reset
    useReviewStore.setState({
      resolvedIssueIds: {
        [key]: ['c1', 'c2'],
        'other:v1': ['x1'],
      },
    });

    useReviewStore.getState().resetResolved();

    const newState = useReviewStore.getState();
    expect(newState.resolvedIssueIds[key]).toBeUndefined();
    expect(newState.resolvedIssueIds['other:v1']).toEqual(['x1']);
  });
});
