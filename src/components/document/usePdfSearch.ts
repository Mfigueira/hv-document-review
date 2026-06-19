import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface UsePdfSearchReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * Intercepts Cmd/Ctrl+F (capture phase so it fires before the browser's native
 * find dialog), opens the in-app PDF search panel, and auto-focuses the input.
 * Esc is handled by the panel itself (it calls `close`).
 *
 * Tradeoff note: intercepting Cmd/Ctrl+F in the capture phase is reliable in
 * modern Chromium/Firefox/Safari. If a future browser refuses `preventDefault`
 * for that combo we fall back to an always-visible search button in the toolbar
 * (see DocumentViewer.tsx) so there's always a way to invoke search.
 */
export function usePdfSearch(): UsePdfSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Intercept Cmd/Ctrl+F in the capture phase so we can preventDefault before
  // the browser opens its native find dialog.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown, /* capture */ true);
    return () =>
      window.removeEventListener('keydown', handleKeyDown, /* capture */ true);
  }, []);

  // Focus the search input whenever the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return { isOpen, open, close, inputRef };
}
