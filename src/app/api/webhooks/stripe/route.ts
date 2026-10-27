import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, handleStripeEvent, webhookConfigured } from "@/lib/server/billing";

/* ------------------------------------------------------------------ */
/*  POST /api/webhooks/stripe — the only door money's truth enters.    */
/*                                                                     */
/*  Signature first (STRIPE_WEBHOOK_SECRET), then the idempotent       */
/*  register, then the ledger. A forged or replayed event simply       */
/*  rests. The raw body is required — Next.js delivers it as text      */
/*  here, exactly as Stripe signed it.                                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  if (!webhookConfigured()) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured — the register stays shut." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error(
      "[webhooks/stripe] signature verification failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    /* the handler fell — answer 500 so Stripe's honest replay returns
       (the register row was already lifted for exactly this reason) */
    console.error(
      "[webhooks/stripe] handling failed — the replay is invited:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Handling failed; retry invited." }, { status: 500 });
  }

  /* verified and handled — the house keeps its silence */
  return NextResponse.json({ received: true });
}
