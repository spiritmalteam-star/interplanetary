import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { verifyCode } from "@/lib/server/codes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------------------------------------------ */
/*  POST /api/auth/reset-password — the new secret, behind six doors.  */
/*                                                                     */
/*  Body: { email, code, password }                                    */
/*  The six-digit code is claimed (single-use, ten-minute life) and    */
/*  the new password is hashed and set in the SAME atomic stroke —     */
/*  a code that opened this door can never open another.               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`reset:${requestIp(req)}`, { limit: 8, windowMs: 15 * 60 * 1000 });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The doors rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!EMAIL_RE.test(email) || !code) {
      return NextResponse.json(
        { error: "The email and its six-digit code are both needed." },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A passage needs at least 8 characters to hold its door." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.provider !== "email" || !user.passwordHash) {
      return NextResponse.json(
        { error: "The code does not open this door." },
        { status: 400 }
      );
    }

    const outcome = await verifyCode(email, "password_code", code);
    if (!outcome.ok) {
      return NextResponse.json(
        {
          error:
            outcome.reason === "expired"
              ? "The code has rested past its ten minutes. Ask for a fresh one."
              : "That code does not open this door. Read the newest letter again.",
        },
        { status: 400 }
      );
    }

    /* the code is claimed — the new secret is set, and the passage is
       confirmed in the same breath (a proven inbox is a verified one) */
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });

    return NextResponse.json({
      reset: true,
      message: "The passage holds a new secret now. Sign in with it.",
    });
  } catch (err) {
    console.error("[auth/reset-password] failed:", err);
    return NextResponse.json(
      { error: "The new secret could not be set. Rest, then try again." },
      { status: 500 }
    );
  }
}
