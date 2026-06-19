/**
 * Resolves a root-relative path (e.g. "/example_document.pdf") against
 * Vite's BASE_URL so that public assets work correctly when the app is
 * deployed under a sub-path (e.g. GitHub Pages).
 *
 * Full URLs (http/https) are returned unchanged.
 */
export function publicUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  return `${base}${path}`;
}
