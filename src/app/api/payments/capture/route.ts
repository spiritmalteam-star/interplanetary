import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { captureEntry, markApproved } from "@/lib/server/payments/ledger";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  POST /api/payments/capture                                          */
/*                                                                      */
/*  Body: { ref: "<ledger id or provider ref>" }                        */
/*                                                                      */
/*  Asks the provider for the truth of the payment, credits the purse   */
/*  ONCE through the wallet's own idempotent grant, and marks the       */
/*  ledger captured. A second capture of the same ref answers           */
/*  { already: true } and touches nothing.                              */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`payments-capture:${requestIp(req)}`, GATES.password);
    if (!gate.ok) {
      return NextResponse.json({ error: "One moment — the doors rest a little." }, { status: 429 });
    }

    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json(
        { error: "Sign in first — a passage is needed before coins change hands." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => null)) as { ref?: string; provider?: string } | null;
    const ref = typeof body?.ref === "string" ? body.ref : null;
    if (!ref) {
      return NextResponse.json({ error: "Name the payment to capture." }, { status: 400 });
    }

    /* PayPal's return carries an approved order — remember it before
       the capture, so an interrupted capture is never lost */
    if (body?.provider === "paypal") {
      await markApproved(ref);
    }

    const outcome = await captureEntry(ref, user.id);
    if (!outcome.ok) {
      if (outcome.reason === "unknown" || outcome.reason === "forbidden") {
        return NextResponse.json({ error: "That payment is not in the ledger." }, { status: 404 });
      }
      return NextResponse.json(
        {
          ok: false,
          error:
            outcome.reason === "provider_error"
              ? "The provider's door did not answer. Rest, then try again — nothing was lost."
              : "The payment has not landed yet — nothing was charged.",
          reason: outcome.reason,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      already: outcome.already === true,
      coinsCredited: outcome.coinsCredited ?? 0,
      planId: outcome.planId ?? null,
      walletTotal: outcome.walletTotal ?? null,
      status: outcome.row?.status ?? "captured",
    });
  } catch (err) {
    console.error("[payments/capture] failed:", err);
    return NextResponse.json(
      { error: "The capture could not be finished. Nothing is lost — try again." },
      { status: 500 }
    );
  }
}
