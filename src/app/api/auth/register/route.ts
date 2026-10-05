import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, mergeAnonLibrary, readAnonId, setSessionCookie } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { mailConfigured, sendLetter, envelope } from "@/lib/server/mail";
import { randomBytes } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicUser(u: { email: string; name: string | null; tier: string }) {
  return { email: u.email, name: u.name, tier: u.tier === "light" ? "light" : "crystalline" };
}

export async function POST(req: NextRequest) {
  try {
    /* the flood-gates: twelve passage attempts per quarter hour per IP */
    const gate = rateLimit(`register:${requestIp(req)}`, GATES.auth);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The doors rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";

    if (!EMAIL_RE.test(email) || email.length > 160) {
      return NextResponse.json(
        { error: "That email does not look ready to receive light." },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "A passage needs at least 8 characters to hold its door." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "This email already holds a passage. Sign in instead." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: { email, name: name || null, passwordHash: hashPassword(password), provider: "email" },
    });

    /* the new passage receives its workspace, its ledger and its gift */
    await ensureVisitorProvisions(user.id);

    const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
    setSessionCookie(res, user.id);
    /* everything the anonymous cookie kept comes with the new passage */
    await mergeAnonLibrary(readAnonId(req), user.id);

    /* when a messenger is configured, a verification letter flies out;
       without one the account simply works (honest, nothing faked) */
    if (mailConfigured()) {
      try {
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
          "Welcome to your laboratory. One tap and your email is part of your passage.",
          `${origin}/?verify=${raw}`,
          "Verify my email"
        );
        void sendLetter({ to: email, subject: "Welcome to the Laboratory — Reflective Me", text, html });
      } catch (verifyErr) {
        console.error("[auth/register] verification letter failed:", verifyErr);
      }
    }

    return res;
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "This email already holds a passage." }, { status: 409 });
    }
    console.error("[auth/register] failed:", err);
    return NextResponse.json(
      { error: "The passage could not be carved. Rest, then try again." },
      { status: 500 }
    );
  }
}
