# HomeVision � Review Page Challenge: Plan

This folder is the **complete, self-contained plan** for the HomeVision Frontend
Take-Home Challenge (the "Review Page"). It is written so the implementation can
be picked up in a fresh context window from scratch, with no other input needed.

## Goal in one sentence

Build a **Review Page** as a React + TypeScript + Vite **single-page app** that
shows a processed document, lists the issues the backend found, lets the user
read/search the PDF, lets them check off issues as resolved, and gates the
primary action (Re-upload / Submit) on the business rule � deployed as a static
site with mocked data so it can be presented at a live URL.

## Documents in this plan

| #   | File                                                                           | What it covers                                                                                                                                |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [`01-challenge-analysis.md`](./01-challenge-analysis.md)                       | Requirements, acceptance criteria, the data model, and the core business rules distilled from the PDF + mock JSON.                            |
| 2   | [`02-architecture.md`](./02-architecture.md)                                   | Tech stack, project structure, component tree, state management, the PDF + Cmd/Ctrl+F search strategy, and hosting.                           |
| 3   | [`03-design-options.md`](./03-design-options.md)                               | The chosen **Split View** layout (desktop + mobile wireframes), the Submitted Page, and the dev panel � plus the two alternatives considered. |
| 4   | [`04-implementation-plan.md`](./04-implementation-plan.md)                     | Phased milestones and a component-by-component build order.                                                                                   |
| 5   | [`05-open-questions-and-production.md`](./05-open-questions-and-production.md) | The resolved decisions, plus the bonus-point sections (dev approach narrative + production readiness).                                        |
| 6   | [`implementation-prompts.md`](./implementation-prompts.md)                     | **Copy-paste prompts** to execute the build in a fresh context window, split into 5 sequential stages (one per fresh context).                |

## Key decisions (LOCKED � updated after first review)

- **Stack:** React 18 + TypeScript + Vite. No backend; mocked data + static PDF.
- **Styling:** **Tailwind CSS**.
- **State:** **Zustand**, with the resolution state **persisted to `localStorage`**.
- **Routing:** **react-router-dom** (`/` review, `/submitted`), with stub routes
  for the out-of-scope `/upload` + `/processing` pages so the structure is ready
  to support the full product flow later.
- **PDF + search:** **`@react-pdf-viewer`** core + **search plugin**, with
  **Cmd/Ctrl+F** bound to a search across **all** pages (easiest robust path).
- **Layout:** **Split View** (doc 3, Option A).
- **Scope:** The **Review Page** + a **minimal Submitted Page**. The Upload /
  Processing pages stay Out Of Scope � but we scaffold placeholder routes for
  them (the "Re-upload" CTA routes to the `/upload` stub).
- **Hosting:** Static build deployed to Vercel / Netlify / Cloudflare Pages.

## The resolution model (DECIDED � the app's core interaction)

The user works through issues with **checkboxes**, marking each as resolved as
they go. This state **persists in `localStorage`** (survives reload). The primary
CTA is **context-dependent**, and a **dev panel** switches between two demo
scenarios:

| Scenario                                 | Issues present           | Primary CTA   | CTA enabled when                                       | On click ?                                                                        |
| ---------------------------------------- | ------------------------ | ------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **A � Needs revision** (given `v2` mock) | critical + major + minor | **Re-upload** | all critical **and** major issues are checked/resolved | conceptually goes to Upload ? Processing ? new Review Out Of Scope; we stop here) |
| **B � Clean** (minor-only mock)          | minor only               | **Submit**    | always (no blocking issues)                            | navigates to the **Submitted Page**                                               |

See `05-open-questions-and-production.md` for the full rationale and the resolved
decision list.
