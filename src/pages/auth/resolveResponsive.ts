import { useSyncExternalStore } from 'react';

/**
 * Responsive override keys (CSS-pasteable later):
 *
 *   '<900'              → @media (width < 900px)     // width shorthand
 *   'w<900'             → @media (width < 900px)
 *   'h<900'             → @media (height < 900px)
 *   'w<=960'            → @media (width <= 960px)
 *   'h>=800'            → @media (height >= 800px)
 *   '>1200'             → @media (width > 1200px)
 *   'h<960,w<1000'      → @media (height < 960px) and (width < 1000px)
 *   'w<1200,w>=1024'    → @media (width < 1200px) and (width >= 1024px)
 *   '1024<=w<1200'      → same band (range sugar)
 *   'h<960px,w<1000px'  → optional `px` suffix on any form
 *
 * Optional `px` suffix is accepted (`'<900px'` ≡ `'<900'`).
 * Combine with commas (AND) — same axis or mixed. Spaces around `,` are fine.
 * Narrower matching `<` / `<=` overrides win over wider ones.
 * Merge order: height singles → width singles → combined (AND) keys,
 * so width layouts (e.g. `w<1024`) win over height tweaks, and AND
 * keys can refine further.
 */
const CLAUSE_RE = /^(h|w)?(<=|>=|<|>)(\d+)(?:px)?$/;
/** e.g. `1024<=w<1200`, `800<=h<=900`, `1024px<=w<1200px` */
const RANGE_RE = /^(\d+)(?:px)?(<=?)([wh])(<=?)(\d+)(?:px)?$/;

export type ViewportSize = { width: number; height: number };

export type Responsive<T extends object> = T & {
  [K: string]: Partial<T> | T[keyof T] | undefined;
};

type ParsedClause = {
  axis: 'w' | 'h';
  op: '<' | '<=' | '>' | '>=';
  px: number;
};

type ParsedBreakpoint = {
  key: string;
  clauses: ParsedClause[];
};

function parseClause(raw: string): ParsedClause | null {
  const match = CLAUSE_RE.exec(raw.trim());
  if (!match) return null;
  const axis = (match[1] ?? 'w') as 'w' | 'h';
  const op = match[2] as ParsedClause['op'];
  const px = Number(match[3]);
  if (Number.isNaN(px)) return null;
  return { axis, op, px };
}

/** Map `1024<=w<1200` → width >= 1024 AND width < 1200. */
function parseRange(key: string): ParsedBreakpoint | null {
  const match = RANGE_RE.exec(key.trim());
  if (!match) return null;
  const lo = Number(match[1]);
  const loBound = match[2]; // '<' | '<='
  const axis = match[3] as 'w' | 'h';
  const hiBound = match[4]; // '<' | '<='
  const hi = Number(match[5]);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;

  return {
    key,
    clauses: [
      { axis, op: loBound === '<' ? '>' : '>=', px: lo },
      { axis, op: hiBound === '<' ? '<' : '<=', px: hi },
    ],
  };
}

function parseBreakpoint(key: string): ParsedBreakpoint | null {
  const range = parseRange(key);
  if (range) return range;

  const parts = key.split(',');
  const clauses: ParsedClause[] = [];
  for (const part of parts) {
    const clause = parseClause(part);
    if (!clause) return null;
    clauses.push(clause);
  }
  if (clauses.length === 0) return null;
  return { key, clauses };
}

function isBreakpointKey(key: string): boolean {
  return parseBreakpoint(key) != null;
}

function matchesClause(clause: ParsedClause, viewport: ViewportSize): boolean {
  const value = clause.axis === 'h' ? viewport.height : viewport.width;
  switch (clause.op) {
    case '<':
      return value < clause.px;
    case '<=':
      return value <= clause.px;
    case '>':
      return value > clause.px;
    case '>=':
      return value >= clause.px;
    default:
      return false;
  }
}

function matchesBreakpoint(
  parsed: ParsedBreakpoint,
  viewport: ViewportSize,
): boolean {
  return parsed.clauses.every((clause) => matchesClause(clause, viewport));
}

/** Sort group: height singles (0) → width singles (1) → combined AND (2). */
function sortGroup(parsed: ParsedBreakpoint): number {
  if (parsed.clauses.length > 1) return 2;
  return parsed.clauses[0].axis === 'h' ? 0 : 1;
}

function isMaxConstraint(op: ParsedClause['op']): boolean {
  return op.startsWith('<');
}

/**
 * Within a sort group, apply looser max-constraints first so narrower ones win.
 * For combined keys, fewer clauses first (less specific); same count → larger
 * max-threshold sum first.
 */
function compareWithinGroup(a: ParsedBreakpoint, b: ParsedBreakpoint): number {
  if (a.clauses.length !== b.clauses.length) {
    return a.clauses.length - b.clauses.length;
  }

  const aMax = a.clauses.every((c) => isMaxConstraint(c.op)) ? 1 : 0;
  const bMax = b.clauses.every((c) => isMaxConstraint(c.op)) ? 1 : 0;
  if (aMax !== bMax) return aMax - bMax;

  const aPx = a.clauses.reduce((sum, c) => sum + c.px, 0);
  const bPx = b.clauses.reduce((sum, c) => sum + c.px, 0);
  if (aMax) return bPx - aPx;
  return aPx - bPx;
}

/**
 * Merge base config props with any matching media overrides.
 * Height overrides apply before width so `w<…` mobile layouts win over
 * `h<…` desktop height tweaks. Combined AND keys apply last.
 * Within an axis, wider max-constraints apply first so narrower ones win.
 */
export function resolveResponsive<T extends object>(
  entry: T,
  viewport: ViewportSize | number,
): T {
  const size: ViewportSize =
    typeof viewport === 'number'
      ? { width: viewport, height: viewport }
      : viewport;

  const base: Record<string, unknown> = {};
  const overrides: { parsed: ParsedBreakpoint; value: Partial<T> }[] = [];

  for (const [key, value] of Object.entries(entry)) {
    const parsed = parseBreakpoint(key);
    if (parsed) {
      if (value != null && typeof value === 'object') {
        overrides.push({ parsed, value: value as Partial<T> });
      }
    } else {
      base[key] = value;
    }
  }

  overrides.sort((a, b) => {
    const groupDiff = sortGroup(a.parsed) - sortGroup(b.parsed);
    if (groupDiff !== 0) return groupDiff;
    return compareWithinGroup(a.parsed, b.parsed);
  });

  let resolved = { ...base } as T;
  for (const { parsed, value } of overrides) {
    if (matchesBreakpoint(parsed, size)) {
      resolved = { ...resolved, ...value };
    }
  }
  return resolved;
}

function subscribeViewport(onStoreChange: () => void): () => void {
  window.addEventListener('resize', onStoreChange);
  return () => window.removeEventListener('resize', onStoreChange);
}

const SERVER_VIEWPORT: ViewportSize = { width: 1440, height: 900 };
let cachedViewport: ViewportSize = SERVER_VIEWPORT;

function getViewportSize(): ViewportSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  // useSyncExternalStore requires a stable snapshot reference when values
  // are unchanged — returning a fresh object every call causes an infinite loop.
  if (cachedViewport.width !== width || cachedViewport.height !== height) {
    cachedViewport = { width, height };
  }
  return cachedViewport;
}

function getServerViewportSize(): ViewportSize {
  return SERVER_VIEWPORT;
}

/** Live viewport size for resolving responsive auth config knobs. */
export function useViewportSize(): ViewportSize {
  return useSyncExternalStore(
    subscribeViewport,
    getViewportSize,
    getServerViewportSize,
  );
}

/** @deprecated Prefer useViewportSize — kept for call-site migration. */
export function useViewportWidth(): number {
  return useViewportSize().width;
}

export { isBreakpointKey };
