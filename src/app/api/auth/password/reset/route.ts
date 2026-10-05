import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/password/reset — carving the passage anew.          */
/*  The raw token is compared against stored scrypt hashes, used       */
/*  exactly once, and every older reset token for the email sleeps.    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`reset:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The doors rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A passage needs at least 8 characters to hold its door." },
        { status: 400 }
      );
    }

    const candidates = await db.verificationToken.findMany({
      where: { type: "password_reset", usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    let matched: { id: string; identifier: string } | null = null;
    for (const row of candidates) {
      if (verifyPassword(token, row.tokenHash)) {
        matched = { id: row.id, identifier: row.identifier };
        break;
      }
    }
    if (!matched) {
      return NextResponse.json(
        { error: "That key has already rested or was never carved. Ask for a fresh one." },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.verificationToken.update({ where: { id: matched.id }, data: { usedAt: new Date() } }),
      db.verificationToken.updateMany({
        where: { identifier: matched.identifier, type: "password_reset", usedAt: null },
        data: { usedAt: new Date() },
      }),
      db.user.update({
        where: { email: matched.identifier },
        data: { passwordHash: hashPassword(password), provider: "email" },
      }),
    ]);

    return NextResponse.json({ message: "The passage is carved anew. Sign in with your new secret." });
  } catch (err) {
    console.error("[auth/password/reset] failed:", err);
    return NextResponse.json(
      { error: "The passage could not be carved. Rest, then try again." },
      { status: 500 }
    );
  }
}
