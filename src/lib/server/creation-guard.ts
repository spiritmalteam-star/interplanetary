import { NextRequest, NextResponse } from "next/server";
import {
  resolveVisitor,
  withAnonCookie,
  type Visitor,
} from "@/lib/server/access";
import { rateLimit, requestIp, type RateLimitRule } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  THE CREATION GUARD — identity, ownership and flood-gates for the   */
/*  /api/creation/* doors.                                             */
/*                                                                     */
/*  These doors once answered anyone: they ran paid sky work (film     */
/*  planning, clip generation) and wrote or read a ledger shared by    */
/*  every visitor. Now every call carries a visitor identity (a        */
/*  signed session, or the quiet anonymous cookie like the other       */
/*  worlds), is rate limited per visitor AND per IP, and the ledger    */
/*  rows are owned.                                                    */
/*                                                                     */
/*  Ownership lives in the rows' existing JSON text (`__owner`), so no */
/*  schema change and no migration is needed. Rows written before this */
/*  guard carry no owner: they are never listed, and never changed.    */
/* ------------------------------------------------------------------ */

import { OWNER_KEY, boundedJson, packOwned, unpackOwned } from "@/lib/server/owned-json";

export { OWNER_KEY, boundedJson, packOwned, unpackOwned };

export type GuardResult =
  | { ok: true; visitor: Visitor; userId: string; anon: boolean; reply: <T extends Response>(res: T) => T }
  | { ok: false; res: NextResponse };

function tooMany(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "too many requests — rest a moment and try again" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

/**
 * Resolve the visitor and apply the flood-gates.
 * `bucket` names the door; `perVisitor` and `perIp` are its allowances.
 * When `requireAccount` is true an anonymous cookie is refused (401):
 * used for the paid film clip door, where cookie rotation would
 * otherwise mint unlimited free callers.
 */
export async function guardCreation(
  req: NextRequest,
  opts: {
    bucket: string;
    perVisitor: RateLimitRule;
    perIp: RateLimitRule;
    requireAccount?: boolean;
  }
): Promise<GuardResult> {
  let visitor: Visitor;
  try {
    visitor = await resolveVisitor(req);
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "the doors could not tell who is knocking" }, { status: 503 }),
    };
  }
  const user = visitor.user;
  const anon = Boolean(user.anon) || user.email.startsWith("anon:");

  if (opts.requireAccount && anon) {
    return {
      ok: false,
      res: withAnonCookie(
        NextResponse.json(
          { error: "sign in to make films — this door spends the house's own light", code: "account_required" },
          { status: 401 }
        ),
        visitor
      ),
    };
  }

  const ip = requestIp(req);
  const byIp = rateLimit(`${opts.bucket}:ip:${ip}`, opts.perIp);
  if (!byIp.ok) return { ok: false, res: withAnonCookie(tooMany(byIp.retryAfterSec), visitor) };
  const byUser = rateLimit(`${opts.bucket}:user:${user.id}`, opts.perVisitor);
  if (!byUser.ok) return { ok: false, res: withAnonCookie(tooMany(byUser.retryAfterSec), visitor) };

  return {
    ok: true,
    visitor,
    userId: user.id,
    anon,
    reply: (res) => withAnonCookie(res, visitor),
  };
}
