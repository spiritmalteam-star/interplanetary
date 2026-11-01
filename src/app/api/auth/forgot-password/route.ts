import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { sendCodeEmail } from "@/lib/server/codes";
import { mailConfigured } from "@/lib/server/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------------------------------------------ */
/*  POST /api/auth/forgot-password — the door that never leaks.        */
/*                                                                     */
/*  Body: { email }                                                    */
/*  A six-digit code flies to the email when (and only when) a real    */
/*  email+password passage holds it. The answer's shape NEVER varies   */
/*  with the email's existence — the same words, the same status — so  */
/*  no stranger can learn who holds a passage here.                    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const ipGate = rateLimit(`forgot-ip:${requestIp(req)}`, GATES.password);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: "The letters rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(ipGate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_RE.test(email) || email.length > 160) {
      /* the shape is still the same — the field was simply not usable */
      return NextResponse.json({
        queued: true,
        message: "If a passage holds that email, a six-digit code is on its way. It rests for ten minutes.",
      });
    }

    const emailGate = rateLimit(`forgot:${email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!emailGate.ok) {
      /* the same honest shape even under the flood-gate */
      return NextResponse.json({
        queued: true,
        message: "If a passage holds that email, a six-digit code is on its way. It rests for ten minutes.",
      });
    }

    const user = await db.user.findUnique({ where: { email } });

    /* a reset code only makes sense for an email+password passage —
       Google passages reset through Google, anonymous passages have
       no email at all */
    if (
      user &&
      user.provider === "email" &&
      user.passwordHash &&
      mailConfigured()
    ) {
      await sendCodeEmail(email, "password_code");
    }

    return NextResponse.json({
      queued: true,
      message: "If a passage holds that email, a six-digit code is on its way. It rests for ten minutes.",
    });
  } catch (err) {
    console.error("[auth/forgot-password] failed:", err);
    /* even the failure keeps the shape — the existence never leaks */
    return NextResponse.json({
      queued: true,
      message: "If a passage holds that email, a six-digit code is on its way. It rests for ten minutes.",
    });
  }
}
