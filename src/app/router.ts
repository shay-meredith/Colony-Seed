/**
 * Hash router (`#/body/verdance`). Hash routing is used because GitHub Pages
 * has no server-side rewrites, so deep links and refreshes always resolve to
 * index.html without a 404.html hack.
 */

export interface ParsedLocation {
  path: string;
  query: URLSearchParams;
}

export function parseHash(hash: string): ParsedLocation {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart = '/', queryPart = ''] = raw.split('?');
  const path = '/' + pathPart.split('/').filter(Boolean).join('/');
  return { path, query: new URLSearchParams(queryPart) };
}

/** Match `/body/:id` style patterns. Returns params or null. */
export function matchPattern(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const seg = pp[i]!;
    const actual = ap[i]!;
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(actual);
    else if (seg !== actual) return null;
  }
  return params;
}

export function startHashRouter(onChange: (location: ParsedLocation) => void): () => void {
  const handler = () => onChange(parseHash(window.location.hash));
  window.addEventListener('hashchange', handler);
  handler();
  return () => window.removeEventListener('hashchange', handler);
}

export function navigate(path: string): void {
  const target = '#' + path;
  if (window.location.hash !== target) window.location.hash = path;
}
