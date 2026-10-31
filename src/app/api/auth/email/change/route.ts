import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { envelope, mailConfigured, sendLetter } from "@/lib/server/mail";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/email/change — the pending passage's new address.   */
/*                                                                     */
/*  A passage carved by email that has NOT yet proven its mailbox may  */
/*  re-name itself once the first letter went astray: the account      */
/*  holds nothing verified yet, so no ownership is being transferred — */
/*  the new address simply becomes the one that must now be proven.    */
/*  A VERIFIED passage never walks this door (a proven identity's      */
/*  address is its own keeper's business, asked for through support).  */
/*                                                                     */
/*  The old letters' keys die with the address they named: the         */
/*  register's rows for the old identifier are erased, a fresh key     */
/*  flies to the new address alone.                                    */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`email-change:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The letters rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const session = await getSessionUser(req);
    if (!session || session.email.startsWith("anon:")) {
      return NextResponse.json(
        { error: "Sign in first — the letter needs a passage." },
        { status: 401 }
      );
    }
    if (session.emailVerified) {
      return NextResponse.json(
        { error: "This passage has already proven its mailbox." },
        { status: 403 }
      );
    }
    if (!mailConfigured()) {
      return NextResponse.json(
        { error: "The messenger rests — no letters can fly just yet." },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 160) {
      return NextResponse.json(
        { error: "That email does not look ready to receive light." },
        { status: 400 }
      );
    }
    if (email === session.email) {
      return NextResponse.json(
        { error: "That is already this passage's address." },
        { status: 400 }
      );
    }

    const taken = await db.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json(
        { error: "This email already holds a passage. Sign in instead." },
        { status: 409 }
      );
    }

    const oldEmail = session.email;
    await db.$transaction([
      db.user.update({ where: { id: session.id }, data: { email } }),
      db.verificationToken.deleteMany({ where: { identifier: oldEmail, usedAt: null } }),
    ]);

    /* a fresh key flies to the new address alone */
    const raw = randomBytes(32).toString("base64url");
    await db.verificationToken.create({
      data: {
        identifier: email,
        tokenHash: hashPassword(raw),
        type: "verify_email",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const origin = process.env.APP_URL || req.nextUrl.origin;
    const { text, html } = envelope(
      "One tap and your email is part of your passage — your library stays yours, forever.",
      `${origin}/?verify=${raw}`,
      "Verify my email"
    );
    const outcome = await sendLetter({
      to: email,
      subject: "Your new address — Reflective Me",
      text,
      html,
    });

    return NextResponse.json({
      email,
      queued: outcome.sent,
      configured: true,
      message: outcome.sent
        ? "A fresh letter of light flies to the new address."
        : outcome.reason === "mail_not_configured"
          ? "The messenger rests for now — the letter rests in the server log."
          : "The messenger could not carry the letter just now — the attempt rests in the server log.",
    });
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "This email already holds a passage." },
        { status: 409 }
      );
    }
    console.error("[auth/email/change] failed:", err);
    return NextResponse.json(
      { error: "The address could not be re-named. Rest, then try again." },
      { status: 500 }
    );
  }
}
