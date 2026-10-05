import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  POST /api/account/password — carve a new secret behind the old.    */
/*  The current password is always required; anonymous passages are    */
/*  turned away; the answer never says whether the old one was close.  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`changepw:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json({ error: "The doors rest a while. Return in a little." }, { status: 429 });
    }

    const session = await getSessionUser(req);
    if (!session || session.email.startsWith("anon:")) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (next.length < 8 || next.length > 200) {
      return NextResponse.json(
        { error: "A passage needs at least 8 characters to hold its door." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    /* Google-only passages have no key to change — they may carve one */
    if (user.passwordHash && !verifyPassword(current, user.passwordHash)) {
      return NextResponse.json(
        { error: "The current secret does not open this passage." },
        { status: 403 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(next), provider: user.provider === "google" ? "email" : user.provider },
    });

    return NextResponse.json({ message: "The new secret holds the door." });
  } catch (err) {
    console.error("[account/password] failed:", err);
    return NextResponse.json({ error: "The secret could not be carved. Rest, then try again." }, { status: 500 });
  }
}
