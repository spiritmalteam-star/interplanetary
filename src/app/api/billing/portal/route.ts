import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/access";
import { ensureStripeCustomer, getStripe, stripeConfigured } from "@/lib/server/billing";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

/* ------------------------------------------------------------------ */
/*  POST /api/billing/portal — the Stripe Customer Portal.             */
/*  Plan changes, invoices and cancellations happen inside Stripe's    */
/*  own guarded hall; this server only opens its door.                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    if (!stripeConfigured()) {
      return NextResponse.json(
        {
          error: "Billing rests — STRIPE_SECRET_KEY is not yet placed in the vault.",
          code: "stripe_not_configured",
        },
        { status: 503 }
      );
    }

    const provisions = await ensureVisitorProvisions(user.id);
    const customerId = await ensureStripeCustomer(provisions.workspaceId, user.email, user.name);
    if (!customerId) {
      return NextResponse.json({ error: "The customer could not be found." }, { status: 500 });
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/?billing=portal`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("[billing/portal] failed:", err);
    return NextResponse.json(
      { error: "The portal could not be opened. Rest, then try again." },
      { status: 500 }
    );
  }
}
