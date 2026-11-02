import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { logger } from "@/lib/server/logger";
import { recordAudit } from "@/lib/server/audit";

/* ------------------------------------------------------------------ */
/*  POST /api/account/delete — THE PASSAGE'S OWN GOODBYE.              */
/*                                                                     */
/*  The GDPR-aligned erasure: the signed passage asks once, confirms   */
/*  by name (body.confirm must equal "DELETE"), and the whole          */
/*  passage is erased — every library entry, transmission, track,      */
/*  loop, job, expansion profile, wallet and workspace row carried     */
/*  away by the database's own cascade law. Financial records          */
/*  (Payment rows — the money's own history) remain, as the law        */
/*  requires; they carry no conversation content. The email is kept    */
/*  ONLY inside the audit ledger's own line, so the erasure itself     */
/*  is provable. The visitor is signed out at once.                    */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json(
        { error: "Sign in first — an anonymous passage holds nothing to erase." },
        { status: 401 }
      );
    }
    const body = (await req.json().catch(() => null)) as { confirm?: string } | null;
    if (body?.confirm !== "DELETE") {
      return NextResponse.json(
        {
          error: "Type DELETE to confirm. This erases every reflection, transmission, track and job — it cannot be undone.",
        },
        { status: 400 }
      );
    }

    const uid = user.id;
    const email = user.email;

    /* the admin/owner's passage never self-erases through this door —
       the keeper's own hand is the console's business */
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "The keeper's passage is the platform's own — erase it through the reset ceremony, not this door." },
        { status: 403 }
      );
    }

    /* one row, and every cascade takes its own — the database does the
       erasure atomically, not stanza by stanza */
    await db.user.delete({ where: { id: uid } });

    await recordAudit({
      actorEmail: email,
      action: "account_deleted",
      target: uid,
      detail: { erasedAt: new Date().toISOString(), financialRecordsKept: true },
    });
    logger.info("account_deleted", { userId: uid });

    const res = NextResponse.json({ ok: true, erased: true });
    /* the session cookie can never sign again — its user row is gone */
    res.cookies.set("mirror_session", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    logger.error("account_delete_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "The erasure could not be completed." }, { status: 500 });
  }
}
