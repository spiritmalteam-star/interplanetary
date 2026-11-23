/* Pure helpers (no imports, no database) for the shared limiter, so
   they can be unit-tested. The limiter itself is shared-rate-limit.ts. */

/** The longest window the shared limiter supports: hits older than
    PURGE_AFTER_MS are swept away, so no window may reach past it. */
export const MAX_WINDOW_MS = 2 * 60 * 60 * 1000;
export const PURGE_AFTER_MS = 3 * 60 * 60 * 1000;

/** The SystemEvent `type` that carries one bucket: bounded, indexable,
    and never containing the raw key (an address or user id). */
export function limiterTypeFor(name: string, key: string, hash: (s: string) => string): string {
  const safeName = name.replace(/[^a-z0-9._-]/gi, "").slice(0, 40) || "gate";
  return `rl:${safeName}:${hash(key)}`;
}

/** Housekeeping runs on about 2% of calls. */
export function shouldPurge(random: number): boolean {
  return random < 0.02;
}
