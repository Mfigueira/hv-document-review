# HomeVision — Document Review Challenge

> **Live demo:** [https://mfigueira.github.io/hv-document-review/](https://mfigueira.github.io/hv-document-review/)

A single-page React application that lets a compliance reviewer read a PDF document, triage annotated issues by severity, mark them as resolved, and then submit or re-upload the document depending on the review outcome.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm run build`      | TypeScript + Vite production build → `dist/` |
| `npm run preview`    | Serve the production build locally           |
| `npm run lint`       | ESLint                                       |
| `npm test`           | Vitest (unit + component tests)              |
| `npm run test:watch` | Vitest in watch mode                         |

---

## The two demo scenarios

Use the **Dev panel** (⚙ bottom-right, development mode only) to switch scenarios.

| Scenario                         | Mock                                        | What you see                                                                         |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| **A — Needs revision** (default) | `v2` — 4 critical, 8 major, 13 minor issues | CTA is **Re-upload**, disabled until all 12 blocking issues are checked.             |
| **B — Clean**                    | `v3` — minor issues only                    | CTA is **Submit**, immediately enabled. Clicking navigates to the confirmation page. |

---

## Key technical decisions

### 1. PDF search across all pages (`@react-pdf-viewer` + custom shortcut)

The hardest part of the spec: native browser find (`Cmd/Ctrl+F`) only searches rendered DOM, but a 34-page PDF is virtualized — most pages are never rendered. The solution is `@react-pdf-viewer/core` with its `searchPlugin`, whose programmatic `highlight()` API indexes **all pages' text layers** regardless of scroll position. A capture-phase keydown listener intercepts `Cmd/Ctrl+F`, prevents the browser dialog, and opens the in-app search panel. `Esc` closes it. A fallback toolbar button is always visible in case shortcut interception is blocked by a browser.

### 2. Business rules isolated as pure functions

`getCtaMode`, `getCanProceed`, `getBlockingRemaining`, and friends live in `src/lib/issues.ts` with no React imports — they are plain functions over the data model. This makes the gating logic independently unit-testable and trivially replaceable when a real API arrives. The UI reads derived values from these functions; it does not contain branching logic itself.

### 3. Resolution model and localStorage persistence

Checking a checkbox is a **front-end simulation** of the user having fixed that issue. In production this state would come from the backend after re-processing a new upload. The app persists `resolvedIssueIds` to `localStorage` via Zustand's `persist` middleware, keyed by `${reviewId}:v${version}` so a future document version starts fresh. Only `resolvedIssueIds` and the active scenario are persisted — transient UI state is not.

### 4. Context-dependent dual CTA

The primary action changes based on the review state: **Re-upload** when there are critical/major issues (blocked until all are resolved), **Submit** when there are none. This mirrors the real product flow honestly while staying in scope.

### 5. Responsive layout

- **Desktop (≥1024 px):** side-by-side Document + Issues split view; sticky submission bar at top; CTA inside the bar.
- **Mobile (<1024 px):** segmented tab switch between Document and Issues panes; status bar stays at top (status + progress); CTA moves to a sticky bottom action bar.

### 6. Routing

`react-router-dom` with `createBrowserRouter` keeps the codebase ready for the out-of-scope pages (`/upload`, `/processing`). GitHub Pages uses a `404.html` → `index.html` redirect trick for SPA fallback so `/submitted` works on direct load.

---

## Accessibility

- `role="status"` + `aria-live="polite"` on the submission bar → screen readers announce progress changes.
- `role="progressbar"` with `aria-valuenow/min/max` on the blocking-issues bar.
- Severity conveyed by **icon + label + color** — never color alone.
- Keyboard: `Cmd/Ctrl+F` opens PDF search; `Enter` navigates to next match; `Esc` closes panel.
- Logical tab order; all interactive elements have visible focus rings (`focus:ring-2 focus:ring-blue-600`).
- `prefers-reduced-motion` respected globally in CSS (animations and transitions collapse to ≤1 ms).

---

## Dev panel

In development (`npm run dev`) a floating ⚙ **Dev panel** is shown (bottom-right). It lets you switch between Scenario A and B and reset resolved state. In the production build it should be hidden unless setting `VITE_SHOW_DEV_PANEL=true` at build time (for demo purposes, it is indeed set to `true`).

---

## Data and PDF

All data is **mocked** — no backend or API calls are made. The two JSON fixtures in `src/mocks/` simulate a real `getReview()` endpoint with a 500 ms artificial delay. The PDF (`public/example_document.pdf`) is a local static file served by Vite; `pdf_url` in both mocks points to `/example_document.pdf`.

---

## Production readiness checklist

_(Summarized from architecture notes)_

- [ ] **Real API:** replace `getReview`/`submitReview` with authenticated endpoints; add retries, error/timeout states, React Query or SWR.
- [ ] **Real resolution flow:** wire Re-upload CTA to Upload → Processing → new Review; replace `localStorage` simulation with backend-derived issue state per version.
- [ ] **Loading/Polling:** handle all status transitions and loading states.
- [ ] **PDF delivery:** signed/expiring URLs, large-file streaming, CORS, range requests, load-failure UX.
- [ ] **Security:** auth User (only assigned reviewer sees the review).
- [ ] **Performance:** test with 100-page docs and 100+ issues; lazy-load PDF worker (already done); code-split per-route.
- [ ] **Full a11y audit:** WCAG 2.1 AA, screen-reader smoke test, keyboard-only walkthrough.
- [ ] **Observability:** Sentry for error tracking; analytics on key actions (submit, re-upload, search, issue navigation).
- [ ] **Testing/CI:** add E2E tests (Playwright) for gating and search; CI pipeline with lint/test/build; preview deployments per PR.
- [ ] **i18n:** locale-aware dates; i18n-ready strings.
- [ ] **SEO:** replace the `/og-image.png` placeholder with a real 1200×630 social preview image; add per-route `<title>` via `<Helmet>`; flip `robots` to `index, follow` on any public-facing pages; add `<link rel="canonical">` once the domain is stable; add an `apple-touch-icon` and `manifest.json` for PWA installation.
- [ ] **Remove or restrict the dev panel** for real production; use feature flags.
