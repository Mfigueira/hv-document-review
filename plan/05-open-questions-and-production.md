# 05 ù Decisions & Production Readiness

## Part 1 ù Decisions (RESOLVED after first review)

### Q1 (BIGGEST) ù How does a user "resolve" a blocking issue? ? Hybrid w/ checkboxes
**Decision:** Interactive **checkbox** resolution + **scenario switcher**.

- The page shows the PDF **and** the full issue list. The user marks issues as
  resolved one by one via **checkboxes** as they work through them.
- Resolution state is **persisted to `localStorage`** (keyed by review id +
  version), so a page reload does **not** lose checked state.
- The **primary CTA is context-dependent** and modeled on the real flow:
  - **Scenario A ù needs revision** (the given `v2` mock, has critical/major):
    CTA is **"Re-upload"**, **disabled until all critical and major issues are
    checked**. Clicking it represents going back to fix + re-upload the revised
    document ? Upload ? Processing ? a new Review (these pages are **out of
    scope**, so the app stops / shows a small note there). Minor issues optional.
  - **Scenario B ù clean** (a minor-only mock): CTA is **"Submit"** (no blocking
    issues), and clicking it navigates to the **Submitted Page**.
- A **minimal dev panel** toggles between Scenario A and Scenario B for the demo.
- Framing note for the README: checking a box is a **front-end simulation** of
  the user having fixed that issue; in production the cleared state is produced
  by the backend re-processing a newly uploaded version.

> All issues are checkable for consistent UX, but only **critical + major** gate
> the Re-upload CTA. Minor checkboxes are optional tracking.

### Q2 ù Styling ? **Tailwind CSS**.

### Q3 ù PDF viewer ? **`@react-pdf-viewer` core + search plugin** (recommended /
easiest for Cmd-Ctrl+F across the whole document). Confirm versions/license at
build time; fall back to `react-pdf` + custom search only if needed.

### Q4 ù State ? **Zustand** (with a `localStorage` persistence layer for
resolved issues; the `persist` middleware is fine).

### Q5 ù After submit ? **a very simple Submitted Page**: a check icon, a title
("Review submitted"), and a short confirmation showing the document name +
version. Nothing fancy. Implemented as a dedicated **`/submitted`** route via
**react-router** (we use a real router so the out-of-scope pages can be added later) ù keep it minimal.

### Q6 ù Layout ? **Split View (Option A)**.

### Q7 ù Sketches ? **keep the ASCII wireframes** in doc 3 for now. (Hi-fi image
mockups can be produced later if useful for the presentation.)

---

## Part 2 ù Bonus: Development approach narrative (for the final README)

Notes to expand into prose once built ù "what most required your expertise":

- **The Cmd/Ctrl+F-across-the-whole-PDF requirement** is the standout technical
  challenge: native browser find only sees rendered DOM, and a 34-page PDF is
  virtualized, so we bind the shortcut to `@react-pdf-viewer`'s search plugin to
  search every page's text content, with highlighting and match navigation. This
  is where most of the engineering judgment goes (library choice, performance,
  text-layer rendering, cross-browser shortcut handling, graceful fallback).
- **Modeling the business rule cleanly:** isolating the gating logic into pure,
  unit-tested functions (`getBlockingRemaining`, `getCanSubmit`, and the
  CTA-mode selector) so the most important behavior is correct and verifiable
  independent of UI.
- **A faithful interaction model:** mapping the real product flow onto a single
  page ù checkbox resolution + `localStorage` persistence, a context-dependent
  **Re-upload vs Submit** CTA, and a dev scenario switcher ù so both the
  "needs revision" and "clean / submittable" states are demonstrable while
  staying honest about what's simulated vs real.
- **Communicating "what's blocking" well** is a UX problem, not just a flag:
  surfacing counts/progress, making each blocking issue findable, and linking
  issues to their location in the document.

## Part 3 ù Bonus: What's needed for production

- **Real API integration:** replace the mock `getReview`/`submitReview` with
  real endpoints; add auth tokens, retries, error/timeout handling, and proper
  loading/empty/error states. Consider React Query/SWR for caching + retries.
- **Real resolution flow:** wire the "Re-upload" CTA to the actual Upload ?
  Processing ? new Review flow; replace the `localStorage` checkbox simulation
  with backend-derived issue state per version.
- **Versioning/polling:** reflect new versions after re-upload (poll or
  websockets while `status` is `processing`); handle `created`/`processing`/
  `submitted` states, not just `on_review`.
- **PDF delivery:** signed/expiring URLs, large-file streaming, CORS, range
  requests, and caching for big documents; handle load failures gracefully.
- **Security:** authn/authz (only the assigned user sees the review), no
  sensitive data in logs, sanitize any rendered content, CSP, dependency audit.
- **Performance & scale:** virtualization for very long documents; lazy-load the
  PDF worker; bundle splitting; test with 100+ page docs and many issues.
- **Accessibility:** full WCAG pass, screen-reader testing, keyboard-only flows.
- **Observability:** error tracking (Sentry), analytics on key actions (submit,
  re-upload, search, navigate-to-issue), performance monitoring.
- **Testing/CI:** unit + component + E2E (Playwright) for the gating + search; CI
  pipeline with lint/test/build; preview deployments per PR.
- **Internationalization & formatting:** locale-aware dates; i18n-ready strings.
- **Resilience/UX:** offline/slow-network handling, optimistic submit with
  rollback, confirm dialogs, audit trail of who submitted and when.
- **Design system:** promote tokens/components into a shared library so other
  pages (Upload/Processing/Submitted) stay consistent.
- **Remove the dev panel** (or gate it behind an env flag) for production builds.
