import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearForeignSessionCookies,
  ensureSteadySecret,
  safeVerifyNext,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { ensureWallet } from "@/lib/server/wallet";
import { isAdminEmail } from "@/lib/server/admin";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/verify/confirm — the verification letter's answer.  */
/*                                                                     */
/*  THE SCANNER'S SAFETY: email clients and link previews follow the   */
/*  letter's address with a bare GET — they never speak POST. The      */
/*  letter therefore lands on a quiet page (?verify=…) where a human   */
/*  hand presses one button, and ONLY that button's POST can consume   */
/*  a token. A scanner that walks the link finds a page, not a spent   */
/*  key.                                                               */
/*                                                                     */
/*  THE ONE USE: the raw token was never stored — only its scrypt      */
/*  hash rests in the register; the comparison is timing-safe; one     */
/*  use marks it forever. Expired, used and unknown keys each speak    */
/*  their own honest word, and none of them may open a door.          */
/*                                                                     */
/*  THE SESSION'S GIFT: a proven mailbox earns the same persistent     */
/*  30-day signed passage the Google door carves — the visitor who     */
/*  clicked the letter never signs in again right after.               */
/* ------------------------------------------------------------------ */

/** The validated way back — only a same-origin path survives.
    (The shared law rests in lib/server/access.ts.) */
const safeNext = safeVerifyNext;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    /* the flood-gates: the letter's key is tried at most a handful of
       times per quarter hour per address — guessing never pays */
    const gate = rateLimit(`verify-confirm:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The keys rest a while. Return in a little.", code: "rate_limited" },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      token?: string;
      next?: string;
    } | null;
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token || token.length < 20 || token.length > 200) {
      return NextResponse.json(
        { error: "That key does not carry a passage's shape.", code: "invalid" },
        { status: 400 }
      );
    }

    /* every recent key of the letter's kind is read once and compared
       in safety — unknown, spent and rested keys are told apart so the
       screen can speak the truth (and offer a fresh letter) */
    const candidates = await db.verificationToken.findMany({
      where: { type: "verify_email" },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    type Match = { state: "live" | "used" | "expired"; id: string; identifier: string };
    let matched: Match | null = null;
    for (const row of candidates) {
      if (!verifyPassword(token, row.tokenHash)) continue;
      matched = {
        state: row.usedAt ? "used" : row.expiresAt.getTime() <= Date.now() ? "expired" : "live",
        id: row.id,
        identifier: row.identifier,
      };
      break;
    }

    if (!matched || matched.state !== "live") {
      return NextResponse.json(
        {
          error:
            matched?.state === "used"
              ? "That key has already rested — the passage it opened may already shine. Sign in to see."
              : matched?.state === "expired"
                ? "That key has grown old. A fresh letter can be asked for anytime."
                : "That key does not answer. Ask for a fresh letter.",
          code: matched?.state ?? "invalid",
        },
        { status: 400 }
      );
    }

    /* THE LIVE KEY — mark it spent and prove the mailbox in one breath */
    const user = await db.user.findUnique({ where: { email: matched.identifier } });
    if (!user || !EMAIL_RE.test(user.email) || user.email.startsWith("anon:")) {
      return NextResponse.json(
        { error: "The passage this key named no longer rests here.", code: "invalid" },
        { status: 400 }
      );
    }
    await db.$transaction([
      db.verificationToken.update({ where: { id: matched.id }, data: { usedAt: new Date() } }),
      db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
    ]);

    /* THE STEADY SECRET — the session about to be carved must be signed
       with the one shared key, never an instance's cold-start mint */
    await ensureSteadySecret();

    const res = NextResponse.json({
      verified: true,
      next: safeNext(body?.next),
      user: {
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        tier: user.tier === "light" ? "light" : "crystalline",
        admin: isAdminEmail(user.email),
        provider: user.provider,
        emailVerified: true,
      },
    });
    res.headers.set("cache-control", "private, no-store");
    setSessionCookie(res, user.id, user.sessionVersion ?? 0, req);
    clearForeignSessionCookies(res);
    /* the passage's provisions ride best-effort — they never stand
       between a proven mailbox and its signed cookie */
    try {
      await ensureVisitorProvisions(user.id);
      await ensureWallet(user.id);
    } catch (provisionErr) {
      console.error(
        "[auth/verify/confirm] provisions lagged behind the passage:",
        provisionErr instanceof Error ? provisionErr.message : provisionErr
      );
    }
    return res;
  } catch (err) {
    console.error("[auth/verify/confirm] failed:", err);
    return NextResponse.json(
      { error: "The key could not be read. Rest, then try again.", code: "error" },
      { status: 500 }
    );
  }
}
