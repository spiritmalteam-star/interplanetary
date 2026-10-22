import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { ensureWallet, grantWalletCredits } from "@/lib/server/wallet";
import {
  SESSION_COOKIE,
  hashPassword,
  mergeAnonLibrary,
  readAnonId,
  setSessionCookie,
} from "@/lib/server/access";
import { rateLimit, requestIp } from "@/lib/server/rate-limit";
import { randomBytes } from "crypto";

/* ------------------------------------------------------------------ */
/*  POST /api/auth/bypass — THE SECRET HAND.                           */
/*                                                                     */
/*  A visitor who rests their hand on a gate for four full seconds     */
/*  is let through: the server carves a small dummy passage for them   */
/*  (a wanderer address no letter ever reaches), lays its wallet,      */
/*  lifts the plan to the pro tier and fills the purse with plenty of  */
/*  lights — then signs them in on the spot. Holding the hand again    */
/*  on an existing wanderer passage simply refills its purse.          */
/* ------------------------------------------------------------------ */

const WANDERER_HOST = "wanderer.reflectme.local";
const BYPASS_CREDITS = 5000;

export async function POST(req: NextRequest) {
  try {
    /* the flood-gates: eight secret hands per hour per IP */
    const gate = rateLimit(`bypass:${requestIp(req)}`, {
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "The secret hand rests a while. Return in a little." },
        { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
      );
    }

    /* an existing signed-in wanderer is simply refilled — the same
       hand never carves a second passage for the same keeper */
    const existingId = req.cookies.get(SESSION_COOKIE)?.value ?? null;
    if (existingId) {
      const existing = await db.user
        .findUnique({ where: { id: existingId } })
        .catch(() => null);
      if (existing && existing.email.endsWith(`@${WANDERER_HOST}`)) {
        await ensureWallet(existing.id);
        await grantWalletCredits(existing.id, {
          credits: BYPASS_CREDITS,
          actionType: "SUBSCRIPTION_GRANT",
          referenceId: `bypass-refill-${Date.now()}`,
          description: "The secret hand held — the purse refilled",
          planTier: "OBSERVATORY_PRO",
        });
        return NextResponse.json({
          user: { email: existing.email, name: existing.name, tier: "crystalline" },
          bypass: true,
        });
      }
    }

    const stamp = Date.now().toString(36);
    const dust = randomBytes(5).toString("hex");
    const email = `wanderer-${stamp}-${dust}@${WANDERER_HOST}`;
    const password = randomBytes(24).toString("base64url");

    const user = await db.user.create({
      data: {
        email,
        name: "Wandering Dreamer",
        passwordHash: hashPassword(password),
        provider: "email",
      },
    });

    /* the passage receives its workspace, its ledger, its wallet —
       then the plan lifts to the pro tier and the purse is filled */
    await ensureVisitorProvisions(user.id);
    await ensureWallet(user.id);
    await grantWalletCredits(user.id, {
      credits: BYPASS_CREDITS,
      actionType: "SUBSCRIPTION_GRANT",
      referenceId: `bypass-${user.id}`,
      description: "The secret hand held — the pro doors stand open",
      planTier: "OBSERVATORY_PRO",
    });

    const res = NextResponse.json(
      {
        user: { email: user.email, name: user.name, tier: "crystalline" },
        bypass: true,
      },
      { status: 201 }
    );
    setSessionCookie(res, user.id);
    await mergeAnonLibrary(readAnonId(req), user.id);
    return res;
  } catch (err) {
    console.error("[auth/bypass] failed:", err);
    return NextResponse.json(
      { error: "The secret hand slipped. Rest, then hold again." },
      { status: 500 }
    );
  }
}
