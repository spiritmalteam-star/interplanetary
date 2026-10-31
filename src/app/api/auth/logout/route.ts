import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clearSessionCookie, readSessionMeta } from "@/lib/server/access";

/* POST /api/auth/logout — the passage is laid down.
   THE TRUE INVALIDATION: the row's session version is bumped in the
   durable shared database, so every token carved before this breath
   — this browser, another browser, another device, a copied cookie —
   no longer opens the door. The clear itself is best-effort honest:
   even if the vault rests, the cookies still fall (and their version
   will be found stale the moment the vault wakes). */
export async function POST(req: NextRequest) {
  const meta = readSessionMeta(req);
  if (meta) {
    try {
      await db.user.update({
        where: { id: meta.uid },
        data: { sessionVersion: { increment: 1 } },
      });
    } catch (err) {
      console.error(
        "[auth/logout] the version could not be bumped (vault resting):",
        err instanceof Error ? err.message : err
      );
    }
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("cache-control", "private, no-store");
  clearSessionCookie(res);
  return res;
}
