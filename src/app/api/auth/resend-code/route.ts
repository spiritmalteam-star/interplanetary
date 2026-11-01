import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { sendCodeEmail } from "@/lib/server/codes";
import { mailConfigured } from "@/lib/server/mail";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/resend-code — a fresh six-digit letter.             */
/*                                                                     */
/*  Body: { email, flow: "register" | "reset" }                        */
/*  The answer is always the same shape whether or not the email       */
/*  holds a passage — the email's existence never leaks. Rate-limited  */
/*  hard: three letters per email per hour, five per IP.               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const ipGate = rateLimit(`resend-code-ip:${requestIp(req)}`, GATES.password);
    if (!ipGate.ok) {
      return NextResponse.json(
        { error: "The letters rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(ipGate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const flow = body?.flow === "reset" ? "reset" : "register";

    if (!email) {
      return NextResponse.json({ error: "The email the letter belongs to is missing." }, { status: 400 });
    }

    /* the email's own flood-gate: three letters per hour */
    const emailGate = rateLimit(`resend-code:${email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!emailGate.ok) {
      return NextResponse.json(
        { error: "A few letters were already sent to this email. Rest an hour, then ask again." },
        { status: 429, headers: { "retry-after": String(emailGate.retryAfterSec) } }
      );
    }

    if (!mailConfigured()) {
      return NextResponse.json({
        queued: false,
        configured: false,
        message:
          "The messenger rests for now (no email provider configured) — set RESEND_API_KEY in the environment vault.",
      });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (flow === "register") {
      /* only an existing, still-unconfirmed passage receives a code */
      if (user && !user.emailVerifiedAt) {
        await sendCodeEmail(email, "email_code");
      }
    } else {
      /* a reset code flies whenever the passage exists (a confirmed
         email+password passage is the only one that can lose a password) */
      if (user && user.provider === "email" && user.passwordHash) {
        await sendCodeEmail(email, "password_code");
      }
    }

    return NextResponse.json({
      queued: true,
      configured: true,
      message: "A fresh code is on its way — read the newest letter.",
    });
  } catch (err) {
    console.error("[auth/resend-code] failed:", err);
    return NextResponse.json(
      { error: "The letter could not be written. Rest, then try again." },
      { status: 500 }
    );
  }
}
