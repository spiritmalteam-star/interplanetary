import { NextRequest } from "next/server";

/* ------------------------------------------------------------------ */
/*  THE FLOOD-GATES — a gentle but firm rate limiter.                  */
/*                                                                     */
/*  A sliding-window counter, keyed by a bucket name and an identity   */
/*  (IP for the doors, user id / api key for the worlds). Configured   */
/*  per endpoint; the plan can raise a visitor's allowance.            */
/*                                                                     */
/*  Honest limitation (documented, not hidden): in serverless skies    */
/*  the map lives per warm instance — it stops brute force bursts      */
/*  and abusive loops, and for hard global ceilings a hosted counter   */
/*  (e.g. Upstash) can be dropped in behind the same interface later.  */
/* ------------------------------------------------------------------ */

export interface RateLimitRule {
  /** allowed requests inside the window */
  limit: number;
  /** window length in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

const buckets = new Map<string, number[]>();

function sweep(now: number): void {
  /* keep the map light — drop dead windows when the map grows */
  if (buckets.size < 5000) return;
  for (const [key, hits] of buckets) {
    const alive = hits.filter((t) => t > now);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

export function rateLimit(
  key: string,
  rule: RateLimitRule
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const hits = (buckets.get(key) ?? []).filter((t) => t > now - rule.windowMs);
  if (hits.length >= rule.limit) {
    const oldest = hits[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: rule.limit - hits.length, retryAfterSec: 0 };
}

/** Best-effort client IP (Vercel sets x-forwarded-for; fall back through
    the usual proxies, then to a stable local placeholder). */
export function requestIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 60);
  return (
    req.headers.get("x-real-ip")?.slice(0, 60) ??
    req.headers.get("cf-connecting-ip")?.slice(0, 60) ??
    "0.0.0.0"
  );
}

/** Named flood-gates for the laboratory's doors. */
export const GATES: Record<string, RateLimitRule> = {
  /* the passages: 12 tries per 15 minutes per IP */
  auth: { limit: 12, windowMs: 15 * 60 * 1000 },
  /* password requests: 5 per hour per IP */
  password: { limit: 5, windowMs: 60 * 60 * 1000 },
  /* the worlds: 60 operations per minute per visitor */
  ai: { limit: 60, windowMs: 60 * 1000 },
  /* the public API: 30 calls per minute per key */
  api: { limit: 30, windowMs: 60 * 1000 },
  /* dashboard reads: 120 per minute */
  account: { limit: 120, windowMs: 60 * 1000 },
};
