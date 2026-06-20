# 01 � Challenge Analysis

Source material lives in `challenge-spec/`:

- `challenge-description.pdf` � the brief + ticket + acceptance criteria.
- `review_mock.json` � the mocked API response we build against.
- `example_document.pdf` � the document the review refers to (34 pages).

## 1. The product context

HomeVision is building a **Document Review** product. Users upload externally
created documents (e.g. PDFs). The backend runs AI processing to find **issues**
that must be resolved before the document can be submitted.

The product is a small flow of pages:

```
Upload ??? Processing ??? Review ??? Submitted
                ?             ?
                ??? re-upload ?  (new version, version + 1)
```

**We only build the Review Page.** Teammates own the other pages and the backend.

### How "resolving an issue" actually works (important)

Per the brief, a user does **not** edit the document inside our app. To resolve a
blocking issue they:

1. Go back to their own system,
2. Fix the issue and generate a **new document**,
3. Upload the new version into the app,
4. The backend re-processes it ? produces a **new review** with `version + 1`,
   containing only the latest version's data.

So the Review Page is a **status-driven** view of the current version. **Decided
interaction model:** the user checks off issues as they resolve them (state
persisted in `localStorage`); the primary CTA is **"Re-upload"** while critical/
major issues remain (representing leaving to fix + re-upload), and **"Submit"**
when none block (representing a final submission ? Submitted Page). A dev panel
switches between these two demo scenarios. See
`05-open-questions-and-production.md` (Q1) for the full decision.

## 2. The ticket (what we must deliver)

> Create the Review page so users can see the issues encountered with the
> document, understand what needs to be fixed, and submit the review once the
> review process is complete. Since the submit endpoint is not ready yet, we can
> skip the backend API call.

## 3. Issue severity & the core business rule

Issues are classified into three severities:

| Severity   | Blocks submission? | Meaning                                                           |
| ---------- | ------------------ | ----------------------------------------------------------------- |
| `critical` | **Yes**            | Must be fixed (re-upload) before submitting.                      |
| `major`    | **Yes**            | Must be fixed (re-upload) before submitting.                      |
| `minor`    | No                 | Can be ignored; a review with only minor issues can be submitted. |

**The rule:** A review can be submitted **iff** there are **zero unresolved
critical and major issues**. Minor issues never block.

### Counts in the provided mock (`review_mock.json`)

- **4 critical**, **8 major**, **13 minor** = **25 total** issues.
- ? With this dataset as-is, the review is **blocked** (12 blocking issues).
- This matters for the demo: the default data shows the _blocked_ state. We need
  a way to also showcase the _submittable_ state (see doc 5).

## 4. Acceptance criteria (verbatim ? our interpretation)

1. **"Users should be able to see the document and search for text across the
   entire PDF using CMD+F / Ctrl+F."**
   - Render the full 34-page PDF.
   - Pressing **Cmd/Ctrl+F** opens a search box and finds matches across **all**
     pages (not just the visible/rendered ones), with next/prev navigation and
     match highlighting. This is the trickiest requirement � see `02-architecture.md`.

2. **"Users cannot submit the review until all critical and major issues are
   resolved. Minor issues may be ignored."**
   - The Submit action is disabled while any critical/major issue is unresolved.

3. **"The page should clearly communicate what's blocking submission."**
   - A prominent, always-visible submission status that summarizes how many
     critical/major issues remain and what to do about them. Each blocking issue
     should be easy to find and jump to in the document.

4. **"The design is up to you."** � We own the UX (see doc 3).

## 5. Data model (from `review_mock.json`)

Proposed TypeScript types (single source of truth for the app):

```ts
export type Severity = 'critical' | 'major' | 'minor';

export type ReviewStatus = 'created' | 'processing' | 'on_review' | 'submitted';

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  page: number; // 1-based page where the issue appears
}

export interface DocumentPage {
  page_num: number; // 1-based
  height: number; // points
  width: number; // points
}

export interface ReviewDocument {
  pdf_url: string; // we replace example.com URL with a local static file
  pages: DocumentPage[];
}

export interface ReviewUser {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Review {
  id: string;
  name: string; // file name, e.g. "Annual Compliance Report..."
  uploaded_at: string; // ISO datetime of latest version upload
  status: ReviewStatus;
  version: number;
  document: ReviewDocument;
  user: ReviewUser;
  issues: Issue[];
}
```

### Notes / gotchas from the data

- `document.pdf_url` points at `https://example.com/...`. Per the brief we
  **replace it with the local static file** (`/example_document.pdf` in `public/`).
- Page sizes are uniform `612 � 792` (US Letter) � useful for sizing/placeholders.
- Multiple issues can point at the **same page** (e.g. issues 3, 6, 20 ? page 14).
  The UI should handle multiple markers per page.
- `status` is `on_review` in the mock � the state where the Review Page is active.

## 6. Derived values the UI needs

```ts
const counts = {
  critical: issues.filter((i) => i.severity === 'critical').length,
  major: issues.filter((i) => i.severity === 'major').length,
  minor: issues.filter((i) => i.severity === 'minor').length,
};

// resolvedIds = issue ids the user checked off (persisted in localStorage)
const blockingIssues = issues.filter((i) => i.severity !== 'minor');
const blockingRemaining = blockingIssues.filter((i) => !resolvedIds.has(i.id)).length;

// CTA is context-dependent (see doc 2 + doc 5/Q1):
const ctaMode = blockingIssues.length === 0 ? 'submit' : 'reupload';
const canProceed = ctaMode === 'submit' ? true : blockingRemaining === 0;
```

## 7. Scope

In scope:

- The **Review Page** (the ticket).
- A **minimal Submitted Page** (check icon + title + doc name/version) reached
  when the "Submit" CTA is used in the clean scenario.
- A small **dev panel** to switch demo scenarios (needs-revision vs clean).

Out of Scope (explicitly):

- The **Upload** and **Processing** pages. The "Re-upload" CTA routes to a tiny
  `/upload` placeholder stub. We scaffold `/upload` + `/processing` routes (via
  react-router) so the structure is ready to support the full flow, but we do not
  build those pages/flows.
- Real backend calls (submit endpoint is skipped; we simulate success).
- Auth / multi-user (the mock has a single assigned user).
- Editing the PDF or the document content.
