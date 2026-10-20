import { NextResponse } from "next/server";
import { paypalConfigured } from "@/lib/server/payments/providers/paypal";
import { cardConfigured } from "@/lib/server/payments/providers/card";

/* ------------------------------------------------------------------ */
/*  GET /api/payments/config                                            */
/*                                                                      */
/*  Which providers are configured RIGHT NOW, read from the vault's     */
/*  env presence alone. The Purse uses this to show a provider as       */
/*  ready or as "available soon" — no key ever reaches the browser.     */
/* ------------------------------------------------------------------ */

export function GET() {
  return NextResponse.json({
    paypal: paypalConfigured(),
    card: cardConfigured(),
    stripePublishable: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  });
}
