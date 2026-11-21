import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearForeignSessionCookies,
  ensureSteadySecret,
  mergeAnonLibrary,
  readAnonId,
  setSessionCookie,
} from "@/lib/server/access";
import { rateLimit, requestIp } from "@/lib/server/rate-limit";
import { verifyCode } from "@/lib/server/codes";
import { isAdminEmail } from "@/lib/server/admin";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/verify-code — the six doors open the passage.       */
/*                                                                     */
/*  Body: { email, code }                                              */
/*  The final step of the registration: the six-digit code from the    */
/*  letter is verified (single-use, ten-minute life, hashed at rest)   */
/*  and only then is the passage confirmed and the session granted.    */
/*  Normal sign-in never comes here — email + password remains the     */
/*  whole law of the everyday door.                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    /* eight verify attempts per quarter hour per IP — six digits and
       ten minutes cannot be crossed through so narrow a door */
    const gate = rateLimit(`verify-code:${requestIp(req)}`, {
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The doors rest a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "The code needs both the email it belongs to and its six digits." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No passage waits behind that email. Carve yours first." },
        { status: 404 }
      );
    }

    /* the shared signing key before the passage is carved */
    await ensureSteadySecret();

    if (user.emailVerifiedAt) {
      /* already confirmed — grant the session and let the visitor in */
      const res = NextResponse.json({
        user: {
          email: user.email,
          name: user.name,
          image: user.image ?? null,
          tier: user.tier === "light" ? "light" : "crystalline",
          admin: isAdminEmail(user.email),
          provider: user.provider,
          emailVerified: true,
        },
        verified: true,
      });
      res.headers.set("cache-control", "private, no-store");
      setSessionCookie(res, user.id, user.sessionVersion ?? 0, req);
      clearForeignSessionCookies(res);
      return res;
    }

    const outcome = await verifyCode(email, "email_code", code);
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

    /* the passage is confirmed — one honest stroke, then the session */
    await db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    const res = NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        tier: user.tier === "light" ? "light" : "crystalline",
        admin: isAdminEmail(user.email),
        provider: user.provider,
        emailVerified: true,
      },
      verified: true,
    });
    res.headers.set("cache-control", "private, no-store");
    setSessionCookie(res, user.id, user.sessionVersion ?? 0, req);
    clearForeignSessionCookies(res);
    /* everything the anonymous cookie kept comes with the confirmed
       passage — THE COOKIE NEVER FALLS (a stumbling merge must never
       strip the session that was already carved) */
    try {
      await mergeAnonLibrary(readAnonId(req), user.id);
    } catch (mergeErr) {
      console.error("[auth/verify-code] library merge stumbled (the passage stands):", mergeErr);
    }
    return res;
  } catch (err) {
    console.error("[auth/verify-code] failed:", err);
    return NextResponse.json(
      { error: "The code could not be read. Rest, then try again." },
      { status: 500 }
    );
  }
}
