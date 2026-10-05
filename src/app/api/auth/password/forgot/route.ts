import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/server/access";
import { sendLetter, mailConfigured, envelope } from "@/lib/server/mail";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/password/forgot — a reset letter.                   */
/*  Always answers the same way: no email-existence ever leaks.        */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`forgot:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The letters rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const gentle = {
      message:
        "If a passage holds that email, a letter of return is on its way (or rests in the server log when no messenger is configured).",
      configured: mailConfigured(),
    };

    if (!email) return NextResponse.json(gentle);

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.email.startsWith("anon:")) {
      /* same answer for every sky — nothing leaks */
      return NextResponse.json(gentle);
    }

    const raw = randomBytes(32).toString("base64url");
    await db.verificationToken.create({
      data: {
        identifier: email,
        tokenHash: hashPassword(raw),
        type: "password_reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const origin = process.env.APP_URL || req.nextUrl.origin;
    const link = `${origin}/?reset=${raw}`;
    const bodyText =
      "A key to carve your passage anew. It opens for one hour, then rests forever.";
    const { text, html } = envelope(bodyText, link, "Choose a new password");
    const outcome = await sendLetter({
      to: email,
      subject: "A new key for your passage — Reflective Me",
      text,
      html,
    });

    return NextResponse.json({ ...gentle, queued: outcome.sent });
  } catch (err) {
    console.error("[auth/password/forgot] failed:", err);
    return NextResponse.json({ message: "If a passage holds that email, a letter of return is on its way." });
  }
}
