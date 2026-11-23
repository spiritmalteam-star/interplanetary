import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, readAnonId } from "@/lib/server/access";
import { requestIp, type RateLimitRule } from "@/lib/server/rate-limit";
import { sharedRateLimit } from "@/lib/server/shared-rate-limit";

/* ------------------------------------------------------------------ */
/*  THE OPEN DOOR — flood-gates for the free, anonymous-friendly AI    */
/*  doors (a quote, a study, a tool analysis...).                      */
/*                                                                     */
/*  Anonymous exploration stays open: no sign-in, no charge. What is   */
/*  bounded is the RATE, per visitor identity (signed session, or the  */
/*  anonymous cookie when one exists) AND per network address, shared  */
/*  across all instances. An address alone is never the only identity: */
/*  shared networks get a roomier address ceiling, while an individual */
/*  visitor is held to the tighter personal one.                       */
/*                                                                     */
/*  This door does not mint anonymous accounts or touch the wallet.    */
/* ------------------------------------------------------------------ */

export interface DoorRules {
  perVisitor: RateLimitRule;
  perIp: RateLimitRule;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

/** Allowances per door (requests per window). Tuned for real use: a
    person reading and asking, not a script. */
export const DOORS = {
  "generate-study": { perVisitor: { limit: 6, windowMs: 10 * MIN }, perIp: { limit: 40, windowMs: HOUR } },
  "mirror-entity": { perVisitor: { limit: 30, windowMs: 10 * MIN }, perIp: { limit: 150, windowMs: HOUR } },
  "tool-analysis": { perVisitor: { limit: 20, windowMs: 10 * MIN }, perIp: { limit: 100, windowMs: HOUR } },
  "visual-scene": { perVisitor: { limit: 30, windowMs: 10 * MIN }, perIp: { limit: 150, windowMs: HOUR } },
  "light-codes-idea": { perVisitor: { limit: 20, windowMs: 10 * MIN }, perIp: { limit: 100, windowMs: HOUR } },
  "particlex-novel": { perVisitor: { limit: 6, windowMs: 10 * MIN }, perIp: { limit: 40, windowMs: HOUR } },
  "mirror-quote": { perVisitor: { limit: 30, windowMs: 10 * MIN }, perIp: { limit: 150, windowMs: HOUR } },
} satisfies Record<string, DoorRules>;

export type DoorName = keyof typeof DOORS;

function tooMany(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      error: "RATE_LIMITED",
      message: "Too many requests just now — rest a moment and try again.",
      retryable: true,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec), "cache-control": "private, no-store" } }
  );
}

/**
 * Apply a door's flood-gates. Returns a 429 response to send back, or
 * `null` when the request may proceed:
 *
 *   const limited = await openDoor(req, "mirror-quote");
 *   if (limited) return limited;
 */
export async function openDoor(req: NextRequest, name: DoorName): Promise<NextResponse | null> {
  const rules = DOORS[name];

  const ip = requestIp(req);
  const byIp = await sharedRateLimit(`door-${name}-ip`, ip, rules.perIp);
  if (!byIp.ok) return tooMany(byIp.retryAfterSec);

  /* the visitor's own identity — read, never minted */
  let identity: string | null = null;
  try {
    const user = await getSessionUser(req);
    identity = user ? `u:${user.id}` : null;
  } catch {
    identity = null;
  }
  if (!identity) {
    const anon = readAnonId(req);
    identity = anon ? `a:${anon}` : null;
  }
  if (identity) {
    const byVisitor = await sharedRateLimit(`door-${name}-who`, identity, rules.perVisitor);
    if (!byVisitor.ok) return tooMany(byVisitor.retryAfterSec);
  } else {
    /* no identity at all (cookies cleared on every call, or a script):
       hold the address to the personal ceiling, not the roomy one */
    const bare = await sharedRateLimit(`door-${name}-bare`, ip, rules.perVisitor);
    if (!bare.ok) return tooMany(bare.retryAfterSec);
  }
  return null;
}
