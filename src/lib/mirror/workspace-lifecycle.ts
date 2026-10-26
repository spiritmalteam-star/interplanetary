"use client";

/* ------------------------------------------------------------------ */
/*  THE RESOURCE LIFECYCLE MANAGER — the book's quiet librarian of     */
/*  device resources. A page may register the hands that must be laid  */
/*  down when the visitor turns away from it: audio paused, timers     */
/*  cleared, synthesizers suspended, streams stopped. When the active  */
/*  page changes (or its window closes), the manager runs that page's  */
/*  cleanups — the visitor's work is never touched, only the device's  */
/*  breath is released.                                                */
/*                                                                     */
/*  THE LAW: only the open page may own expensive resources. A page    */
/*  that keeps playing after the visitor left it has failed the house. */
/* ------------------------------------------------------------------ */

const cleanups = new Map<string, Set<() => void>>();

/**
 * Register a cleanup hand for a workspace page. Returns the unregister
 * hand (safe to call twice). The cleanup must be idempotent and must
 * never destroy the visitor's work — pause, don't erase.
 */
export function registerWorkspaceCleanup(
  key: string,
  fn: () => void
): () => void {
  let set = cleanups.get(key);
  if (!set) {
    set = new Set();
    cleanups.set(key, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) cleanups.delete(key);
  };
}

/**
 * Run (and keep) every cleanup hand registered for a page. Called by
 * the workspace renderer when the active page turns, and by pages
 * themselves on unmount. Errors are swallowed — a failing hand may
 * never break the page turn.
 */
export function runWorkspaceCleanup(key: string): void {
  const set = cleanups.get(key);
  if (!set || set.size === 0) return;
  for (const fn of [...set]) {
    try {
      fn();
    } catch {
      /* a failing hand is laid down quietly */
    }
  }
}
