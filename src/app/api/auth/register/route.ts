import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearForeignSessionCookies,
  ensureSteadySecret,
  hashPassword,
  mergeAnonLibrary,
  readAnonId,
  safeVerifyNext,
  setSessionCookie,
} from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { ensureWallet } from "@/lib/server/wallet";
import { isAdminEmail } from "@/lib/server/admin";
import { mailConfigured } from "@/lib/server/mail";
import { sendCodeEmail } from "@/lib/server/codes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicUser(u: {
  email: string;
  name: string | null;
  image?: string | null;
  tier: string;
  provider?: string;
  emailVerifiedAt?: Date | null;
}) {
  return {
    email: u.email,
    name: u.name,
    image: u.image ?? null,
    tier: u.tier === "light" ? "light" : "crystalline",
    admin: isAdminEmail(u.email),
    provider: u.provider,
    emailVerified: Boolean(u.emailVerifiedAt) || u.provider === "google",
  };
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
    /* the room the visitor stood in when the passage was carved — the
       verification letter carries it so the click returns them exactly
       where their walk was interrupted */
    const next = safeVerifyNext(body?.next);

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

    /* THE CONFIRMATION LAW — a passage that exists but was never
       confirmed meets the code door again (a fresh six-digit code flies
       to its own inbox); a confirmed one simply answers "sign in".
       The code can only be read by the inbox's true owner, so nothing
       is handed to a stranger. */
    if (existing && existing.emailVerifiedAt) {
      return NextResponse.json(
        { error: "This email already holds a passage. Sign in instead." },
        { status: 409 }
      );
    }
    if (existing && !existing.emailVerifiedAt) {
      const codeGate = rateLimit(`code-issue:${email}`, GATES.password);
      if (!codeGate.ok) {
        return NextResponse.json(
          { error: "The letters rest a while. Return in a little." },
          { status: 429, headers: { "retry-after": String(codeGate.retryAfterSec) } }
        );
      }
      await sendCodeEmail(email, "email_code");
      const res = NextResponse.json(
        {
          needsVerification: true,
          email,
          user: publicUser(existing),
          mailConfigured: true,
          verificationSent: true,
        },
        { status: 200 }
      );
      res.headers.set("cache-control", "private, no-store");
      return res;
    }

    /* the keeper's binding at the door: when the platform's ADMIN_EMAIL
       registers, the role is carved in the same breath — the keeper never
       waits for a restart to be the keeper */
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const role = email === adminEmail ? "ADMIN" : "user";

    const user = await db.user.create({
      data: { email, name: name || null, passwordHash: hashPassword(password), provider: "email", role },
    });

    /* the new passage receives its workspace, its ledger and its gift */
    await ensureVisitorProvisions(user.id);
    /* and its own wallet — five free lights, laid in at the birth */
    await ensureWallet(user.id);

    /* the shared signing key before the passage is carved */
    await ensureSteadySecret();

    /* THE CONFIRMATION LAW — with a messenger standing (RESEND_API_KEY),
       the passage waits for its six-digit echo: the session is granted
       only when the code verifies (POST /api/auth/verify-code), and the
       registration screen itself is untouched. Without a messenger (a
       development vault) the birth itself is the confirmation — honest,
       nothing faked. */
    if (mailConfigured()) {
      const codeGate = rateLimit(`code-issue:${email}`, GATES.password);
      if (!codeGate.ok) {
        return NextResponse.json(
          { error: "The letters rest a while. Return in a little." },
          { status: 429, headers: { "retry-after": String(codeGate.retryAfterSec) } }
        );
      }
      try {
        await sendCodeEmail(email, "email_code");
      } catch (codeErr) {
        console.error("[auth/register] code letter failed:", codeErr);
      }
      const res = NextResponse.json(
        {
          needsVerification: true,
          email,
          user: publicUser(user),
          mailConfigured: true,
          verificationSent: true,
        },
        { status: 201 }
      );
      res.headers.set("cache-control", "private, no-store");
      return res;
    }

    await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });

    const res = NextResponse.json(
      {
        user: publicUser(user),
        /* the door's own honest word: whether a letter of light is on
           its way, so the screen can show the "check your email" room */
        mailConfigured: mailConfigured(),
        verificationSent: false,
      },
      { status: 201 }
    );
    res.headers.set("cache-control", "private, no-store");
    setSessionCookie(res, user.id, user.sessionVersion ?? 0, req);
    clearForeignSessionCookies(res);
    /* everything the anonymous cookie kept comes with the new passage.
       THE COOKIE NEVER FALLS — a stumbling merge must never strip the
       session that was already carved (the callback's own law). */
    try {
      await mergeAnonLibrary(readAnonId(req), user.id);
    } catch (mergeErr) {
      console.error("[auth/register] library merge stumbled (the passage stands):", mergeErr);
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
