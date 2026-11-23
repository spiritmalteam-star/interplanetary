import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { rateLimit, type RateLimitResult, type RateLimitRule } from "@/lib/server/rate-limit";
import { limiterTypeFor, shouldPurge, MAX_WINDOW_MS, PURGE_AFTER_MS } from "@/lib/server/rate-limit-rules";

/* ------------------------------------------------------------------ */
/*  THE SHARED FLOOD-GATES — a rate limiter that holds across every    */
/*  Vercel instance.                                                   */
/*                                                                     */
/*  The in-memory limiter (rate-limit.ts) lives per warm instance, so  */
/*  N instances meant N times the allowance. This one keeps its hits   */
/*  in the existing SystemEvent table (no schema change): one row per  */
/*  hit, its `type` carrying the bucket (`rl:<name>:<hash of key>`),   */
/*  so a count is a single indexed range scan on (type, createdAt).    */
/*                                                                     */
/*  Order: the in-memory limiter answers first (it stops bursts for    */
/*  free, with no database trip), then the shared count decides.       */
/*  If the database cannot answer, the in-memory verdict stands — a    */
/*  limiter must never take a free door down with it. (Billing is a    */
/*  different matter: money paths fail CLOSED, see meter.ts.)          */
/*                                                                     */
/*  The count-then-insert is not a lock: two simultaneous calls can    */
/*  both pass at the edge, so a limit may be exceeded by the number of */
/*  in-flight requests. That is accepted for abuse control.            */
/* ------------------------------------------------------------------ */

export async function sharedRateLimit(
  name: string,
  key: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const local = rateLimit(`${name}:${key}`, rule);
  if (!local.ok) return local;
  if (rule.windowMs > MAX_WINDOW_MS) return local; // would outlive the purge horizon

  const type = limiterTypeFor(name, key, hashOf);
  const now = Date.now();
  try {
    const since = new Date(now - rule.windowMs);
    const hits = await db.systemEvent.count({ where: { type, createdAt: { gte: since } } });
    if (hits >= rule.limit) {
      const oldest = await db.systemEvent.findFirst({
        where: { type, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const oldestMs = oldest?.createdAt.getTime() ?? now;
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil((oldestMs + rule.windowMs - now) / 1000)),
      };
    }
    await db.systemEvent.create({
      data: {
        eventId: `rl:${randomUUID()}`,
        type,
        actorType: "system",
        source: "ratelimit",
        payload: "{}",
        /* bookkeeping, not a message: born delivered so no poller or
           "pending" counter ever mistakes it for work */
        deliveredAt: new Date(),
      },
    });
    if (shouldPurge(Math.random())) {
      /* opportunistic housekeeping — expired hits only, never anything else */
      void db.systemEvent
        .deleteMany({
          where: {
            type: { startsWith: "rl:" },
            createdAt: { lt: new Date(now - PURGE_AFTER_MS) },
          },
        })
        .catch(() => undefined);
    }
    return { ok: true, remaining: Math.max(0, rule.limit - hits - 1), retryAfterSec: 0 };
  } catch (err) {
    console.error(
      `[ratelimit:${name}] shared count unavailable, in-memory verdict stands:`,
      err instanceof Error ? err.message : err
    );
    return local;
  }
}

function hashOf(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 20);
}
