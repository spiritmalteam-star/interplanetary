import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword } from "@/lib/server/access";
import { sendLetter, mailConfigured, envelope } from "@/lib/server/mail";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/verify/resend — a fresh verification letter.        */
/*  When the messenger rests (no RESEND_API_KEY), the letter is        */
/*  written to the server log and the route says so honestly.          */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`verify:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The letters rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json({ error: "Sign in first — the letter needs a passage." }, { status: 401 });
    }

    const fresh = await db.user.findUnique({ where: { id: user.id } });
    if (fresh?.emailVerifiedAt) {
      return NextResponse.json({ verified: true, message: "The passage already shines — the email is verified." });
    }

    const raw = randomBytes(32).toString("base64url");
    await db.verificationToken.create({
      data: {
        identifier: user.email,
        tokenHash: hashPassword(raw),
        type: "verify_email",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const origin = process.env.APP_URL || req.nextUrl.origin;
    const link = `${origin}/?verify=${raw}`;
    const body =
      "One tap and your email is part of your passage — your library stays yours, forever.";
    const { text, html } = envelope(body, link, "Verify my email");
    const outcome = await sendLetter({
      to: user.email,
      subject: "Verify your passage — Reflective Me",
      text,
      html,
    });

    return NextResponse.json({
      queued: outcome.sent,
      configured: mailConfigured(),
      message: outcome.sent
        ? "A letter of light is on its way."
        : "The messenger rests for now (no email provider configured) — the letter rests in the server log.",
    });
  } catch (err) {
    console.error("[auth/verify/resend] failed:", err);
    return NextResponse.json(
      { error: "The letter could not be written. Rest, then try again." },
      { status: 500 }
    );
  }
}
