# 02 — Architecture & Tech Stack

## 1. Stack decision (LOCKED)

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **React 18 + TypeScript** | Explicitly preferred by the brief; types make the data model + business rules safe. |
| Build tool | **Vite** | Fast, zero-config SPA. Next.js would be overkill — no SSR/server needs. |
| Styling | **Tailwind CSS** | Fast iteration, consistent spacing/color via config, no runtime cost. |
| State | **Zustand** + `persist` middleware | Small global store; `persist` writes the resolved-issues state to `localStorage`. |
| Routing | **react-router-dom** | A real router so the app is structured to support the other (out-of-scope) pages later. |
| PDF rendering + search | **`@react-pdf-viewer/core` + `@react-pdf-viewer/search`** | Ready-made search plugin (highlight, next/prev, jump-to-match) that we bind to Cmd/Ctrl+F — easiest robust path to AC #1. |
| Data | **Static JSON** mocks served through a fake async API | Mimics a real fetch (loading/error) without a backend. |
| Testing | **Vitest + React Testing Library** | Cover the gating rule + a couple of component tests. |
| Lint/format | **ESLint + Prettier** | Standard hygiene. |

> Pin exact versions at implementation time (`npm create vite@latest` ? `react-ts`,
> then add deps via **npm** (`npm install`); verify `@react-pdf-viewer` version + MIT
> license at build time).

## 2. Routing (react-router)

We use a real router so the codebase mirrors the full product flow and the other
pages can be dropped in later without restructuring.

| Path | Page | Status |
|------|------|--------|
| `/` | **ReviewPage** | **In scope** (the ticket). |
| `/submitted` | **SubmittedPage** | **In scope** (minimal: check icon + title + doc name/version). |
| `/upload` | **UploadPage** | **Out of scope** — ship a tiny placeholder stub so the "Re-upload" CTA has a real destination and the route exists. |
| `/processing` | **ProcessingPage** | **Out of scope** — placeholder stub only. |

- A **layout route** renders `<Header/>` + `<Outlet/>` + `<Footer/>` (and the
  `<DevPanel/>`), so all pages share the chrome.
- Navigation:
  - **Submit** CTA ? `navigate('/submitted')` (after the simulated submit call).
  - **Re-upload** CTA ? `navigate('/upload')` (the stub explains the real flow is
    Upload ? Processing ? new Review, out of scope here).
- Use `createBrowserRouter` + `RouterProvider`. (Static hosting needs an
  SPA fallback to `index.html` — see §10.)

## 3. Project structure

```
home-vision-challenge/
?? public/
?  ?? example_document.pdf          # copied from challenge-spec/, served statically
?? src/
?  ?? main.tsx                      # <RouterProvider/>
?  ?? router.tsx                    # createBrowserRouter: layout route + pages
?  ?? types/
?  ?  ?? review.ts                  # the types from doc 1
?  ?? mocks/
?  ?  ?? review_v2_needs_revision.json   # given mock (critical+major+minor) -> Scenario A
?  ?  ?? review_v3_clean.json            # minor-only variant            -> Scenario B
?  ?? api/
?  ?  ?? reviewApi.ts               # getReview(scenario), submitReview() (fake latency)
?  ?? store/
?  ?  ?? useReviewStore.ts          # review + resolved set (persisted) + scenario + selection
?  ?? lib/
?  ?  ?? issues.ts                  # counts, blocking logic, CTA-mode, grouping by page
?  ?  ?? format.ts                  # date, name helpers
?  ?? pages/
?  ?  ?? ReviewPage.tsx             # the main page (Split View)
?  ?  ?? SubmittedPage.tsx          # minimal confirmation
?  ?  ?? UploadPage.tsx             # out-of-scope placeholder stub
?  ?  ?? ProcessingPage.tsx         # out-of-scope placeholder stub
?  ?? components/
?  ?  ?? layout/
?  ?  ?  ?? AppLayout.tsx           # Header + <Outlet/> + Footer + DevPanel
?  ?  ?  ?? Header.tsx
?  ?  ?  ?? Footer.tsx
?  ?  ?? submission/
?  ?  ?  ?? SubmissionStatusBar.tsx # blocking summary/progress + Re-upload | Submit CTA
?  ?  ?? document/
?  ?  ?  ?? DocumentViewer.tsx      # @react-pdf-viewer host + page markers
?  ?  ?  ?? usePdfSearch.ts         # bind Cmd/Ctrl+F to the search plugin
?  ?  ?? issues/
?  ?  ?  ?? IssuesPanel.tsx
?  ?  ?  ?? IssueFilters.tsx        # severity tabs + counts
?  ?  ?  ?? IssueList.tsx
?  ?  ?  ?? IssueCard.tsx           # checkbox + title + severity tag + page + "Go to page"
?  ?  ?? dev/
?  ?     ?? DevPanel.tsx            # scenario switch A/B + reset resolved state
?  ?? hooks/
?  ?  ?? useReview.ts               # loads review via api into store
?  ?? styles/
?     ?? index.css                  # Tailwind directives + a few tokens
?? index.html
?? tailwind.config.ts
?? postcss.config.js
?? vite.config.ts
?? package.json
```

## 4. Component / route tree

```
<RouterProvider>
?? <AppLayout>                 Header + <Outlet/> + Footer + DevPanel
   ?? "/"            ? <ReviewPage>
   ?     ?? <SubmissionStatusBar>   blocking summary + progress + [Re-upload | Submit]
   ?     ?? <DocumentViewer>        PDF render + page markers + Cmd/Ctrl+F search
   ?     ?? <IssuesPanel>
   ?        ?? <IssueFilters>       All / Critical / Major / Minor (with counts)
   ?        ?? <IssueList>
   ?           ?? <IssueCard> (×N)  [?] checkbox · title · severity · page · "Go to page"
   ?? "/submitted"  ? <SubmittedPage>    check icon · "Review submitted" · doc name + version
   ?? "/upload"     ? <UploadPage>       (out-of-scope stub)
   ?? "/processing" ? <ProcessingPage>   (out-of-scope stub)
```

### Cross-component interactions
- **Checkbox** on an IssueCard ? `toggleResolved(id)` ? persisted ? recomputes
  `blockingRemaining` / CTA enabled state.
- Click an IssueCard "Go to page" ? store sets `selectedPage`/`selectedIssueId` ?
  `DocumentViewer` scrolls to that page and highlights the marker.
- **DocumentViewer** page markers; clicking a marker selects the issue in panel.
- **SubmissionStatusBar** reads `ctaMode` + `canProceed`, renders the right CTA,
  and uses `useNavigate()` to route on click.
- **DevPanel** sets `scenario` ? reloads the matching mock ? resets selection.

## 5. State management (Zustand + persist)

Routing/navigation is the router's job; the store holds data + resolution + UI.

```ts
type Scenario = 'needs_revision' | 'clean';
type CtaMode = 'reupload' | 'submit';

interface ReviewState {
  // data
  review: Review | null;
  status: 'idle' | 'loading' | 'error' | 'ready';
  scenario: Scenario;            // chosen via DevPanel; selects which mock to load
  // ui
  severityFilter: Severity | 'all';
  selectedPage: number | null;
  selectedIssueId: string | null;
  submitting: boolean;
  // resolution (PERSISTED to localStorage, keyed by `${reviewId}:v${version}`)
  resolvedIssueIds: Record<string, string[]>; // key -> resolved issue ids
  // actions
  load(scenario?: Scenario): Promise<void>;
  setScenario(s: Scenario): void;
  toggleResolved(issueId: string): void;
  setFilter(f: Severity | 'all'): void;
  selectIssue(id: string): void;
  submit(): Promise<void>;       // simulated API call only; navigation handled in component
  resetResolved(): void;         // dev panel
}
```

- Use Zustand `persist` middleware, but **only persist `resolvedIssueIds`** (and
  maybe `scenario`) — not the loaded review or transient UI.
- Keying resolved state by review id + version means a future version starts fresh.

Pure selectors in `lib/issues.ts` (unit-testable):
```ts
getCounts(issues)                         // { critical, major, minor }
getBlockingIssues(issues)                 // critical + major
getBlockingRemaining(issues, resolvedIds) // count of unresolved critical+major
getCtaMode(issues): CtaMode               // 'submit' if no critical+major else 'reupload'
getCanProceed(issues, resolvedIds)        // mode==='submit' -> true; else blockingRemaining===0
groupIssuesByPage(issues)
```

### CTA logic (the heart of the business rule)
```
const blocking = critical + major issues
ctaMode    = blocking.length === 0 ? 'submit' : 'reupload'
canProceed = ctaMode === 'submit'
              ? true                              // Scenario B: always submittable
              : allChecked(blocking, resolvedIds) // Scenario A: all critical+major resolved

onProceed() (in SubmissionStatusBar, using useNavigate):
  if ctaMode === 'submit'   -> await submit(); navigate('/submitted')
  if ctaMode === 'reupload' -> navigate('/upload')   // stub explains out-of-scope flow
```

## 6. Data flow (mocked "API")

`api/reviewApi.ts`:
```ts
import needsRevision from '../mocks/review_v2_needs_revision.json';
import clean from '../mocks/review_v3_clean.json';

export async function getReview(scenario: Scenario): Promise<Review> {
  await new Promise(r => setTimeout(r, 500));     // simulate latency
  return (scenario === 'clean' ? clean : needsRevision) as Review; // pdf_url already local
}

export async function submitReview(id: string): Promise<{ ok: true }> {
  await new Promise(r => setTimeout(r, 600));
  return { ok: true };                            // submit endpoint is skipped per brief
}
```
Two mocks: the provided `v2` (Scenario A) and a derived **minor-only** `v3`
(Scenario B). This gives real loading/error states and a clean seam for a real
`fetch` later.

## 7. The PDF + Cmd/Ctrl+F search (the hard part)

**Why it's hard:** native Cmd/Ctrl+F only searches rendered DOM; a 34-page PDF is
virtualized, so off-screen pages would be missed. The AC wants search across the
**entire** PDF via Cmd/Ctrl+F.

**Approach (locked):** use `@react-pdf-viewer/core` + `@react-pdf-viewer/search`.
1. Render the document with the viewer (text layer enabled so matches highlight).
2. `usePdfSearch`: a global key handler intercepts **Cmd/Ctrl+F**
   (`preventDefault()`), opens the search UI, and focuses the input.
3. The search plugin searches across **all** pages, highlights matches, supports
   next/prev + "N of M", and jumps the viewer to each match. `Esc` closes it.

**Performance:** virtualized page rendering is built in; the plugin indexes text
across pages. Lazy-load the PDF.js worker.

**Risk / fallback:** if binding Cmd/Ctrl+F is flaky cross-browser, fall back to
rendering all text layers so **native** find works end-to-end, plus an explicit
in-app search button. Spike this on day 1 (Stage 3) before building further.

## 8. Issue ? page linking

- `groupIssuesByPage(issues)` ? markers/badges per page in the viewer (handle
  multiple issues per page, e.g. page 14).
- "Go to page" on an IssueCard scrolls the viewer to that page.
- Severity color is consistent everywhere via Tailwind theme tokens.

## 9. Responsive strategy (desktop + mobile)

- **Desktop (?1024px):** two-pane Split View (document + issues), sticky
  submission bar; issues panel collapsible to give the document more room.
- **Tablet (768–1023px):** narrower issues panel.
- **Mobile (<768px):** single column with a **segmented switch** between
  "Document" and "Issues"; submission status pinned top; CTA sticky at bottom.
- Build mobile-first with Tailwind; test at 360 / 768 / 1280px.

## 10. Accessibility & quality bar

- Keyboard: Cmd/Ctrl+F, Esc to close search, logical Tab order, checkboxes and
  cards operable via keyboard.
- Semantic landmarks (`header`, `main`, `footer`), ARIA `role="status"` /
  `aria-live` on the submission bar so "what's blocking" is announced.
- Severity is never color-only — pair with icon + label.
- Respect `prefers-reduced-motion`.

## 11. Hosting (the deliverable URL)

- `vite build` ? static `dist/`.
- Deploy to **Vercel / Netlify / Cloudflare Pages / GitHub Pages**. PDF + mocks
  ship as static assets.
- **SPA fallback for client-side routing:** because we use `createBrowserRouter`,
  configure the host to rewrite unknown paths to `index.html`
  (Netlify `_redirects`: `/* /index.html 200`; Vercel `rewrites`; or use a hash
  router / `404.html` trick for GitHub Pages). Required so `/submitted` etc. work
  on refresh/direct link.
- Set `base` in `vite.config.ts` if deploying under a subpath (e.g. GitHub Pages).
- Gate/remove the **DevPanel** behind an env flag for the public build (or keep a
  subtle one for the demo — decide at build time).
- Add a one-command deploy note + the live URL to the top-level README.
