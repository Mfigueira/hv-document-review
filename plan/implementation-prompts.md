# Implementation Prompts (for fresh context windows)

This file contains **copy-paste prompts** to build the HomeVision Review Page from
the plan in this `plan/` folder. The work is split into **5 sequential stages**,
each sized for its own **fresh context window**. Run them **in order** � each
stage assumes the previous one is finished and working.

## How to use

1. Open a new chat/context **at the repo root** (`home-vision-challenge/`).
2. Paste the prompt for the current stage **verbatim**.
3. Let the agent read the referenced plan docs and implement the stage.
4. Verify the stage's **Done when** checklist before moving on.
5. Repeat for the next stage in a new context.

> The plan docs (`plan/01..05` + `README.md`) are the source of truth. Every
> prompt tells the agent to read the relevant ones first, so these prompts stay
> short while the full detail lives in the plan.

## Global constraints (apply to every stage)

- Stack: **React 18 + TypeScript + Vite**, **Tailwind CSS**, **Zustand** (+`persist`),
  **react-router-dom**, **`@react-pdf-viewer`** (core + search), **Vitest + RTL**.
- Use **npm** as the package manager (commit `package-lock.json`; do not use
  yarn/pnpm). Add dependencies via `npm install <pkg>` at latest stable � do **not** hand-write versions.
- Only build what's in scope: the **Review Page** + minimal **Submitted Page** +
  out-of-scope **placeholder** routes (`/upload`, `/processing`). Do not build the
  Upload/Processing flows.
- TypeScript strict; keep business logic in pure, testable functions.
- After each stage: `npm run lint`, `npm run build`, and `npm run test` must pass,
  and `npm run dev` must run without console errors.
- Do not commit unless explicitly asked.

---

## STAGE 1 � Scaffold, routing, layout shell, data layer & store

```text
You are implementing the HomeVision "Review Page" take-home challenge. The repo
root is the current directory and already contains a `plan/` folder and a
`challenge-spec/` folder.

FIRST, read these plan docs fully and follow them as the source of truth:
- plan/README.md
- plan/01-challenge-analysis.md   (data model in �5; business rule; scope)
- plan/02-architecture.md         (�1 stack, �2 routing, �3 structure, �4 tree,
                                    �5 store, �6 data flow, �11 hosting)
- plan/04-implementation-plan.md  (Stage 1)

GOAL OF THIS STAGE: stand up the project skeleton end-to-end (no PDF, no issue
logic yet) so the app boots, routes, and loads mock data.

DO THE FOLLOWING:
1. Scaffold a Vite React+TS app at the repo root (keep plan/ and challenge-spec/).
2. Add and configure: Tailwind (+PostCSS), ESLint + Prettier, Vitest + React
   Testing Library, react-router-dom, zustand. Add npm scripts: dev, build,
   preview, lint, test. Configure a Tailwind theme with severity colors
   (critical=red, major=amber/orange, minor=slate) and a status palette.
3. Create src/types/review.ts with the exact types from plan doc 01 �5
   (Severity, ReviewStatus, Issue, DocumentPage, ReviewDocument, ReviewUser, Review).
4. Copy challenge-spec/example_document.pdf into public/.
5. Create src/mocks/review_v2_needs_revision.json by copying
   challenge-spec/review_mock.json and changing `document.pdf_url` to
   "/example_document.pdf". Create src/mocks/review_v3_clean.json as a variant of
   the same review but with ONLY minor issues (drop all critical & major issues;
   keep the minor ones; bump version to 3). Both reference the same local PDF.
6. Create src/api/reviewApi.ts: getReview(scenario) returns the right mock after a
   ~500ms delay; submitReview(id) resolves {ok:true} after ~600ms. (Backend is
   skipped per the brief.)
7. Create the Zustand store src/store/useReviewStore.ts per plan doc 02 �5
   (review, status, scenario, severityFilter, selectedPage, selectedIssueId,
   submitting, resolvedIssueIds, and the listed actions). Use the `persist`
   middleware persisting ONLY resolvedIssueIds and scenario, keyed sensibly;
   resolvedIssueIds is keyed by `${reviewId}:v${version}`.
8. Create src/hooks/useReview.ts that loads the review for the active scenario into
   the store (handles loading/error/ready states).
9. Routing per plan doc 02 �2 & �4 using createBrowserRouter + RouterProvider in
   src/main.tsx and src/router.tsx:
   - AppLayout (components/layout/AppLayout.tsx) = Header + <Outlet/> + Footer
     (+ a DevPanel placeholder slot).
   - Routes: "/" -> pages/ReviewPage.tsx, "/submitted" -> pages/SubmittedPage.tsx,
     "/upload" -> pages/UploadPage.tsx (out-of-scope stub),
     "/processing" -> pages/ProcessingPage.tsx (out-of-scope stub).
   - For now ReviewPage can render the loaded review's name/version/status and a
     placeholder for the two panes; SubmittedPage/Upload/Processing are simple
     stubs (Upload/Processing clearly say "Out Of Scope � placeholder").
10. Header.tsx shows: product name "Document Review", file name, v{version},
    status badge, assignee (first + last name). Footer.tsx minimal.
11. Make the shell responsive (mobile-first) with a two-column layout placeholder
    on desktop that stacks on mobile. Show loading and error states.

DONE WHEN:
- `npm run dev` boots; "/" shows the review file name/version/status from the
  needs_revision mock; navigating to /submitted, /upload, /processing works.
- Refreshing /submitted does not 404 in dev.
- lint, build, and test (even if only a trivial smoke test) all pass.
- No PDF rendering or issue logic yet � that's later stages.

Do NOT implement: the issues panel logic, PDF viewer, search, dev panel behavior,
or CTA gating. Stop after Stage 1 and summarize what you built + how to run it.
```

---

## STAGE 2 � Issues panel + business rule + persistence

```text
You are continuing the HomeVision "Review Page" challenge. Stage 1 (scaffold,
routing, store, mocks, layout) is complete and working.

FIRST, read these plan docs and follow them as the source of truth:
- plan/01-challenge-analysis.md   (�3 business rule, �6 derived values)
- plan/02-architecture.md         (�5 state + CTA logic)
- plan/03-design-options.md        (Option A "CHOSEN" + shared elements)
- plan/04-implementation-plan.md  (Stage 2)

GOAL OF THIS STAGE: implement the issues panel and the full submission business
rule, with checkbox resolution persisted to localStorage. (Still no PDF viewer.)

DO THE FOLLOWING:
1. Create src/lib/issues.ts with PURE functions (no React) per plan doc 02 �5:
   - getCounts(issues) -> {critical, major, minor}
   - getBlockingIssues(issues) -> critical + major issues
   - getBlockingRemaining(issues, resolvedIds) -> count of unresolved critical+major
   - getCtaMode(issues) -> 'submit' if zero critical+major else 'reupload'
   - getCanProceed(issues, resolvedIds) -> mode==='submit' ? true : blockingRemaining===0
   - groupIssuesByPage(issues)
2. Unit-test src/lib/issues.ts with Vitest, including: counts for the given mock
   are critical=4, major=8, minor=13; needs_revision is 'reupload' & not proceedable
   until all 12 blocking are resolved; clean mock is 'submit' & proceedable.
3. Build the issues UI under src/components/issues/:
   - IssueFilters: All / Critical / Major / Minor segmented control with counts,
     wired to store.severityFilter.
   - IssueList + IssueCard. Each IssueCard has a CHECKBOX (toggleResolved), the
     title, a severity tag (color+icon+label, never color alone), the page number,
     a short description, and a "Go to page" affordance (wire the click to set
     selectedPage/selectedIssueId in the store; actual scrolling comes in Stage 4).
   - Resolved (checked) issues should be visually distinct (e.g. muted/struck).
4. Wire checkbox state through the store's resolvedIssueIds and confirm it
   PERSISTS across reload via the persist middleware (keyed by reviewId:vVersion).
5. Build src/components/submission/SubmissionStatusBar.tsx:
   - Shows progress of blocking issues (e.g. "4 of 12 resolved", a progress bar)
     and a clear message of what's blocking submission.
   - Renders the context-dependent CTA: label "Re-upload" when ctaMode==='reupload'
     (disabled until canProceed), or "Submit" when ctaMode==='submit'. Disabled
     state has an explanatory tooltip. Positive/cleared state styled green.
   - For THIS stage, the CTA onClick can be a no-op/placeholder; navigation is
     wired in Stage 4. Make the enabled/disabled logic correct now.
6. Lay these into ReviewPage using the Split View (Option A): issues panel on the
   right, a placeholder for the document on the left, submission bar on top.

DONE WHEN:
- Counts render 4/8/13; checking all 12 critical+major issues enables the
  "Re-upload" CTA; the clean scenario shows an enabled "Submit" CTA.
- Checked state survives a page reload.
- lib/issues.ts unit tests pass; lint, build, test all pass.

Do NOT implement the PDF viewer/search or the actual CTA navigation yet. Stop
after Stage 2 and summarize.
```

---

## STAGE 3 � PDF viewer + Cmd/Ctrl+F search (the risky part � isolate it)

```text
You are continuing the HomeVision "Review Page" challenge. Stages 1-2 are done
(scaffold/routing/store, issues panel + business rule + persistence).

FIRST, read these plan docs and follow them as the source of truth:
- plan/01-challenge-analysis.md   (AC #1 about search)
- plan/02-architecture.md         (�7 PDF + search, �8 issue?page linking)
- plan/04-implementation-plan.md  (Stage 3)

GOAL OF THIS STAGE: render the full PDF and satisfy AC #1 � searching text across
the ENTIRE document via Cmd/Ctrl+F.

DO THE FOLLOWING:
1. Add @react-pdf-viewer/core and @react-pdf-viewer/search (and pdfjs-dist worker
   as required). Import their CSS. Verify the package version + MIT license.
2. Create src/components/document/DocumentViewer.tsx that loads
   /example_document.pdf and renders all 34 pages with the viewer (zoom + page
   navigation). Lazy-load the PDF.js worker.
3. Create src/components/document/usePdfSearch.ts (or integrate the search plugin)
   so that pressing Cmd/Ctrl+F:
   - calls preventDefault() (suppresses the browser's native find),
   - opens an in-app search box and focuses it,
   - searches across ALL pages (not just visible ones), highlights matches,
     supports next/previous and an "N of M" indicator, jumps the viewer to each
     match, and closes on Esc.
4. Place DocumentViewer into ReviewPage's left pane (replacing the placeholder),
   keeping the Split View layout.
5. Verify search works on text that lives on non-initially-visible pages, e.g.
   "Birch Lane" (pages 15 & 26) and "Flood Zone" (page 7).
6. If binding Cmd/Ctrl+F proves unreliable cross-browser, implement the documented
   fallback (render all text layers so native find covers the whole doc + an
   explicit search button) and note the tradeoff in code comments / README notes.

DONE WHEN:
- The 34-page PDF renders and is navigable.
- Cmd/Ctrl+F opens the in-app search and finds matches across the whole document
  with highlight + next/prev + count.
- lint, build, test all pass; no console errors.

Do NOT implement page markers, go-to-page scrolling, dev panel, or CTA navigation
yet (Stage 4). Stop after Stage 3 and summarize, including any fallback used.
```

---

## STAGE 4 � Linking, scenarios, dev panel, CTA outcomes, Submitted Page

```text
You are continuing the HomeVision "Review Page" challenge. Stages 1-3 are done
(scaffold/routing/store, issues + business rule, PDF viewer + Cmd/Ctrl+F search).

FIRST, read these plan docs and follow them as the source of truth:
- plan/02-architecture.md         (�2 routing, �4 tree, �5 CTA logic, �8 linking)
- plan/03-design-options.md        (Submitted Page sketch + Dev panel sketch)
- plan/04-implementation-plan.md  (Stage 4)
- plan/05-open-questions-and-production.md (Q1 model, Q5 Submitted Page)

GOAL OF THIS STAGE: connect everything � issue?document navigation, the two demo
scenarios, the dev panel, the real CTA navigation, and the Submitted Page.

DO THE FOLLOWING:
1. Issue ? document linking:
   - Clicking "Go to page" on an IssueCard scrolls the DocumentViewer to that page
     and visually highlights it.
   - Render per-page markers/badges in the viewer for pages that have issues
     (handle multiple issues on one page, e.g. page 14). Clicking a marker selects
     that issue in the panel (sync via store selectedPage/selectedIssueId).
2. Dev panel (src/components/dev/DevPanel.tsx), mounted via AppLayout:
   - Radio toggle between Scenario A "Needs revision" (loads
     review_v2_needs_revision.json) and Scenario B "Clean" (loads
     review_v3_clean.json); switching reloads the review and resets selection.
   - A "Reset resolved state" button that clears the persisted checkboxes.
   - Keep it visually unobtrusive (corner/floating). Plan to gate behind an env
     flag for production (Stage 5).
3. Wire the SubmissionStatusBar CTA with react-router useNavigate:
   - ctaMode==='submit': call store.submit() (simulated), then navigate('/submitted').
   - ctaMode==='reupload' (only enabled once all critical+major are checked):
     navigate('/upload').
4. Build pages/SubmittedPage.tsx (minimal, per doc 03/Q5): a check icon, title
   "Review submitted", and a short confirmation showing the document name +
   version. Optional "Back to review" link.
5. Ensure pages/UploadPage.tsx + ProcessingPage.tsx remain clear out-of-scope
   placeholder stubs (the Upload stub should briefly explain the real flow:
   Upload ? Processing ? new Review).
6. Positive cleared state: when there are no blocking issues remaining, the
   submission bar reflects the ready/green state.

DONE WHEN:
- In Scenario A: resolving all 12 critical+major enables "Re-upload" ? /upload stub.
- In Scenario B: "Submit" is enabled ? navigates to /submitted showing the doc
  name + version.
- Go-to-page and markers work both directions; dev panel switches scenarios and
  resets resolved state.
- lint, build, test all pass.

Stop after Stage 4 and summarize.
```

---

## STAGE 5 � Responsive & a11y polish, tests, docs, deploy

```text
You are finishing the HomeVision "Review Page" challenge. Stages 1-4 are complete
and functional end-to-end.

FIRST, read these plan docs and follow them as the source of truth:
- plan/02-architecture.md         (�9 responsive, �10 a11y, �11 hosting)
- plan/04-implementation-plan.md  (Stage 5 + Definition of Done)
- plan/05-open-questions-and-production.md (Parts 2 & 3 for the README write-up)

GOAL OF THIS STAGE: production-quality polish, tests, documentation, and a live
deployment URL.

DO THE FOLLOWING:
1. Responsive: on mobile (<768px), replace the side-by-side panes with a segmented
   switch between "Document" and "Issues"; keep the submission status visible and
   make the CTA a sticky bottom action; the PDF fits width. Verify at 360/768/1280.
2. Accessibility: keyboard support (Cmd/Ctrl+F, Esc closes search, logical tab
   order, keyboard-operable checkboxes/cards), semantic landmarks, role="status" /
   aria-live on the submission bar, color contrast, severity conveyed by more than
   color, and prefers-reduced-motion handling.
3. Tests: expand Vitest coverage � business rule (getCtaMode, getCanProceed,
   counts, blocking), persistence behavior, and a couple of component tests
   (e.g. CTA disabled until blocking resolved; Submit navigates to /submitted).
4. Gate the DevPanel behind an env flag (e.g. import.meta.env) so production builds
   can hide it (or keep a subtle toggle for the demo � your call, documented).
5. Write the top-level README.md (repo root, NOT in plan/): what the app is, how
   to run/build, the key decisions, the two demo scenarios, the development-approach
   narrative and the production-readiness checklist (summarize from plan doc 05
   Parts 2 & 3), and a note that data is mocked + the PDF is a local static file.
6. Deploy as a static site (Vercel / Netlify / Cloudflare Pages / GitHub Pages).
   Configure the SPA fallback so client-side routes (e.g. /submitted) work on
   direct load/refresh (e.g. Netlify _redirects "/* /index.html 200", or Vercel
   rewrites). Set vite `base` if deploying under a subpath. Capture the LIVE URL
   and add it to the top of the README.

DONE WHEN (Definition of Done from plan doc 04):
- AC1: PDF renders; Cmd/Ctrl+F searches the entire document.
- AC2: CTA blocked until all critical+major resolved; minor ignorable.
- AC3: page clearly communicates what's blocking.
- Resolution persists across reloads; both scenarios demoable; Submit reaches
  /submitted; responsive desktop + mobile; deployed at a public URL with SPA
  fallback.
- lint, build, and all tests pass.

Summarize the final result and include the live URL and run instructions.
```

---

## Notes

- If a stage runs long, it is safe to pause and resume within the same stage � the
  boundaries above are the natural fresh-context split points.
- If you (the planner) later change a decision, update the relevant `plan/` doc;
  the prompts deliberately defer detail to those docs so they stay in sync.
