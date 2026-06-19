import {
  useRef,
  useCallback,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { searchPlugin } from '@react-pdf-viewer/search';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
// Lazy-load the PDF.js worker as a separate chunk via Vite's ?url suffix.
// This avoids bundling the ~1 MB worker into the main JS payload.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { usePdfSearch } from './usePdfSearch';

// ─── Search panel (pure props — no render-prop plugin component) ──────────────

interface SearchPanelProps {
  keyword: string;
  matchCount: number;
  currentMatch: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onKeywordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

function SearchPanel({
  keyword,
  matchCount,
  currentMatch,
  inputRef,
  onKeywordChange,
  onNext,
  onPrev,
  onClose,
}: SearchPanelProps) {
  const hasMatches = matchCount > 0;
  const noResults = keyword.length > 0 && matchCount === 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNext();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-0" role="search" aria-label="PDF text search">
      <div className="flex items-center gap-1.5 p-2">
        {/* Search icon */}
        <svg
          className="h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={keyword}
          onChange={onKeywordChange}
          onKeyDown={handleKeyDown}
          placeholder="Search PDF…"
          aria-label="Search term"
          autoComplete="off"
          spellCheck={false}
          className={[
            'min-w-0 flex-1 rounded border bg-gray-50 px-2 py-1 text-sm outline-none',
            'focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500',
            noResults ? 'border-red-300 bg-red-50' : 'border-gray-200',
          ].join(' ')}
        />

        {/* Match counter */}
        <span
          aria-live="polite"
          aria-atomic="true"
          className="shrink-0 text-xs text-gray-500 tabular-nums"
        >
          {hasMatches ? `${currentMatch} / ${matchCount}` : noResults ? 'No results' : ''}
        </span>

        {/* Prev */}
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasMatches}
          title="Previous match"
          aria-label="Previous match"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={onNext}
          disabled={!hasMatches}
          title="Next match (Enter)"
          aria-label="Next match"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Document viewer ──────────────────────────────────────────────────────────

/**
 * Renders the 34-page PDF with @react-pdf-viewer/core (virtualized, text layer
 * enabled) and wires Cmd/Ctrl+F to an in-app search panel.
 *
 * Instead of using the plugin's <Search> render-prop component (whose internal
 * hook subscriptions conflicted with conditional rendering), we use the plugin's
 * programmatic API directly: highlight(), jumpToNextMatch(),
 * jumpToPreviousMatch(), and clearHighlights(). Our own search state is plain
 * useState — unconditional and stable — so there are no hooks-count violations.
 *
 * The search plugin indexes ALL pages so matches on pages that are not yet
 * scrolled into view (e.g. "Birch Lane" pp.15/26, "Flood Zone" p.7) are still
 * found and the viewer jumps to each one.
 */
export function DocumentViewer() {
  const { isOpen, open, close, inputRef } = usePdfSearch();

  // searchPlugin is a custom hook (calls React.useMemo internally). It MUST be
  // called at the component top level on every render — never inside useMemo or
  // any other hook callback. The library's own internal useMemo([], []) for the
  // store ensures stable state across renders even though the returned object
  // reference is new each time.
  // enableShortcuts: false — we own Cmd/Ctrl+F via usePdfSearch.
  const searchPluginInstance = searchPlugin({ enableShortcuts: false });

  // Search state — all unconditional useState calls so hooks order never changes.
  const [keyword, setKeyword] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Run search against all pages via the plugin's programmatic API.
  const doSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        searchPluginInstance.clearHighlights();
        setMatchCount(0);
        setCurrentMatch(0);
        return;
      }
      const matches = await searchPluginInstance.highlight(term);
      setMatchCount(matches.length);
      setCurrentMatch(matches.length > 0 ? 1 : 0);
    },
    [searchPluginInstance],
  );

  const handleKeywordChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setKeyword(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => void doSearch(val), 300);
    },
    [doSearch],
  );

  const handleNext = useCallback(() => {
    searchPluginInstance.jumpToNextMatch();
    setCurrentMatch((prev) => (prev >= matchCount ? 1 : prev + 1));
  }, [searchPluginInstance, matchCount]);

  const handlePrev = useCallback(() => {
    searchPluginInstance.jumpToPreviousMatch();
    setCurrentMatch((prev) => (prev <= 1 ? matchCount : prev - 1));
  }, [searchPluginInstance, matchCount]);

  const handleClose = useCallback(() => {
    clearTimeout(debounceRef.current);
    searchPluginInstance.clearHighlights();
    setKeyword('');
    setMatchCount(0);
    setCurrentMatch(0);
    close();
  }, [searchPluginInstance, close]);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Document</p>
        {/* Explicit search button — fallback if Cmd/Ctrl+F interception fails */}
        <button
          type="button"
          onClick={open}
          title="Search (Cmd/Ctrl+F)"
          aria-label="Open PDF search"
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <kbd className="hidden rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] sm:inline">
            ⌘F
          </kbd>
        </button>
      </div>

      {/* ── Floating search panel ── */}
      {isOpen && (
        <div
          className="absolute right-4 top-12 z-50 w-[340px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          role="dialog"
          aria-modal="false"
          aria-label="PDF search"
        >
          <SearchPanel
            keyword={keyword}
            matchCount={matchCount}
            currentMatch={currentMatch}
            inputRef={inputRef}
            onKeywordChange={handleKeywordChange}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
          />
        </div>
      )}

      {/* ── PDF viewer ── */}
      <div className="flex-1 overflow-auto">
        <Worker workerUrl={workerUrl}>
          <Viewer
            fileUrl="/example_document.pdf"
            defaultScale={SpecialZoomLevel.PageWidth}
            plugins={[searchPluginInstance]}
          />
        </Worker>
      </div>
    </div>
  );
}
