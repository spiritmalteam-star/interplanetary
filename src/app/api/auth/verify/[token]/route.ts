import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  GET /api/auth/verify/<token> — the return of the verification      */
/*  letter. The raw token was never stored; only its scrypt hash       */
/*  rests in the register. One use, then it sleeps.                    */
/* ------------------------------------------------------------------ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const origin = req.nextUrl.origin;
  try {
    const { token } = await params;
    if (!token || token.length < 20 || token.length > 200) {
      return NextResponse.redirect(`${origin}/?verified=invalid`);
    }

    const candidates = await db.verificationToken.findMany({
      where: { type: "verify_email", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    for (const row of candidates) {
      if (!verifyPassword(token, row.tokenHash)) continue;
      await db.$transaction([
        db.verificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
        db.user.update({ where: { email: row.identifier }, data: { emailVerifiedAt: new Date() } }),
      ]);
      return NextResponse.redirect(`${origin}/?verified=1`);
    }

    return NextResponse.redirect(`${origin}/?verified=expired`);
  } catch (err) {
    console.error("[auth/verify] failed:", err);
    return NextResponse.redirect(`${origin}/?verified=error`);
  }
}
