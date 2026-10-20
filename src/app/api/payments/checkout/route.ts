import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/access";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";
import { resolveSku } from "@/lib/server/payments/catalog";
import { createCheckoutEntry } from "@/lib/server/payments/ledger";
import { paypalConfigured } from "@/lib/server/payments/providers/paypal";
import { cardConfigured } from "@/lib/server/payments/providers/card";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  POST /api/payments/checkout                                         */
/*                                                                      */
/*  Body: { provider: "paypal" | "card", kind: "membership" | "coins",  */
/*          sku: "coins_1200" | "membership_SEEKER" | … }               */
/*                                                                      */
/*  Creates the unified ledger entry and the provider's own order —     */
/*  the answer is a redirect URL, never a promise of payment. The       */
/*  truth arrives only when the capture route reads the provider.       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`payments-checkout:${requestIp(req)}`, GATES.password);
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

    const body = (await req.json().catch(() => null)) as {
      provider?: string;
      kind?: string;
      sku?: string;
    } | null;
    const provider = body?.provider === "paypal" ? "paypal" : body?.provider === "card" ? "card" : null;
    const kind = body?.kind === "membership" ? "membership" : body?.kind === "coins" ? "coins" : null;
    const sku = typeof body?.sku === "string" ? body.sku : null;
    if (!provider || !kind || !sku) {
      return NextResponse.json(
        { error: 'Say the provider, the kind and the sku — {"provider":"card","kind":"coins","sku":"coins_1200"}.' },
        { status: 400 }
      );
    }

    /* honest gates: an unconfigured provider is named, never pretended */
    if (provider === "paypal" && !paypalConfigured()) {
      return NextResponse.json(
        { error: "PayPal rests — PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not yet in the vault.", code: "provider_not_configured" },
        { status: 503 }
      );
    }
    if (provider === "card" && !cardConfigured()) {
      return NextResponse.json(
        { error: "Card payments rest — STRIPE_SECRET_KEY is not yet in the vault.", code: "provider_not_configured" },
        { status: 503 }
      );
    }

    const resolved = resolveSku(sku);
    if (!resolved) {
      return NextResponse.json({ error: "That sku is not in the shop." }, { status: 400 });
    }

    const origin = req.nextUrl.origin;
    const intent = await createCheckoutEntry({
      visitorId: user.id,
      userId: user.id,
      provider,
      kind,
      sku,
      amountCents: resolved.amountCents,
      coinsCredited: resolved.coinsCredited,
      planId: resolved.planId,
      label: resolved.label,
      origin,
    });

    return NextResponse.json({
      provider,
      kind,
      sku,
      providerRef: intent.row.providerRef,
      redirectUrl: intent.redirectUrl,
    });
  } catch (err) {
    console.error("[payments/checkout] failed:", err);
    return NextResponse.json(
      { error: "The checkout could not be opened. Rest, then try again." },
      { status: 500 }
    );
  }
}
