import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/access";
import {
  ensureStripeCustomer,
  getStripe,
  stripeConfigured,
} from "@/lib/server/billing";
import { CREDIT_PACKS, PLANS } from "@/lib/server/plans";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { GATES, rateLimit, requestIp } from "@/lib/server/rate-limit";

/* ------------------------------------------------------------------ */
/*  POST /api/billing/checkout — a Stripe Checkout session.            */
/*                                                                     */
/*  Body: { plan: "PRO" | "PRO_PLUS" | "BUSINESS" }                    */
/*     or { pack: "pack_10k" | "pack_50k" | "pack_200k" }              */
/*                                                                     */
/*  Honest gates:                                                      */
/*   - no STRIPE_SECRET_KEY        → 503, nothing pretended            */
/*   - plan/pack without a price id → 503, no price id invented        */
/*   - the answer is a URL, never a promise of payment — Stripe's    */
/*     signed webhook is the only thing that flips a plan.             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const gate = rateLimit(`checkout:${requestIp(req)}`, GATES.password);
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
    if (!stripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Billing rests — STRIPE_SECRET_KEY is not yet placed in the environment vault. Add it (and the STRIPE_PRICE_* ids) on Vercel, then this door opens.",
          code: "stripe_not_configured",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    const planId = typeof body?.plan === "string" ? body.plan.toUpperCase() : null;
    const packId = typeof body?.pack === "string" ? body.pack : null;

    const provisions = await ensureVisitorProvisions(user.id);
    const stripe = getStripe();

    if (planId && planId in PLANS && planId !== "FREE") {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan.stripePriceId) {
        return NextResponse.json(
          {
            error: `The ${plan.label} plan has no Stripe price id yet (STRIPE_PRICE_${planId} in the vault) — nothing was charged.`,
            code: "price_not_configured",
          },
          { status: 503 }
        );
      }
      const customerId = await ensureStripeCustomer(provisions.workspaceId, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          workspaceId: provisions.workspaceId,
          plan: plan.id,
          grantCredits: String(plan.monthlyCredits),
        },
        subscription_data: {
          metadata: { workspaceId: provisions.workspaceId, plan: plan.id },
        },
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    if (packId) {
      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return NextResponse.json({ error: "That credit pack does not exist." }, { status: 400 });
      }
      if (!pack.stripePriceId) {
        return NextResponse.json(
          {
            error: `That pack has no Stripe price id yet (${pack.id}) — nothing was charged.`,
            code: "price_not_configured",
          },
          { status: 503 }
        );
      }
      const customerId = await ensureStripeCustomer(provisions.workspaceId, user.email, user.name);
      if (!customerId) {
        return NextResponse.json({ error: "The customer could not be created." }, { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: pack.stripePriceId, quantity: 1 }],
        success_url: `${req.nextUrl.origin}/?billing=success`,
        cancel_url: `${req.nextUrl.origin}/?billing=cancelled`,
        metadata: {
          workspaceId: provisions.workspaceId,
          packPriceId: pack.stripePriceId,
          credits: String(pack.credits),
        },
      });
      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json(
      { error: 'Say which plan ("plan") or credit pack ("pack") the passage seeks.' },
      { status: 400 }
    );
  } catch (err) {
    console.error("[billing/checkout] failed:", err);
    return NextResponse.json(
      { error: "The checkout could not be opened. Rest, then try again." },
      { status: 500 }
    );
  }
}
