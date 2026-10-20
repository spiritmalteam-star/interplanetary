/* ------------------------------------------------------------------ */
/*  THE CARD PROVIDER — the vault's Stripe door, wrapped honestly.     */
/*  Cards travel through Stripe Checkout's own hosted page: the house  */
/*  never touches a card number, and the browser only ever receives    */
/*  a redirect URL. The keys live only in the env vault.               */
/* ------------------------------------------------------------------ */

export function cardConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const { default: Stripe } = await import("stripe");
  return new Stripe(key);
}

export interface CardCheckoutInput {
  amountCents: number;
  currency: string;
  label: string;
  sku: string;
  kind: "membership" | "coins";
  planId: string | null;
  localRef: string;
  origin: string;
}

export interface CardCheckout {
  ok: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

export async function createCardCheckout(
  input: CardCheckoutInput
): Promise<CardCheckout> {
  const stripe = await stripeClient();
  if (!stripe) return { ok: false, error: "stripe key not placed" };
  try {
    /* a membership rides its own configured price when the vault
       carries one — never a dead door on arrival */
    const planStripePriceId =
      input.kind === "membership"
        ? (input.planId === "SEEKER"
            ? process.env.STRIPE_PRICE_SEEKER
            : input.planId === "OBSERVATORY_PRO"
              ? process.env.STRIPE_PRICE_OBSERVATORY_PRO
              : null) ?? null
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: input.kind === "membership" ? "subscription" : "payment",
      line_items: [
        planStripePriceId
          ? { price: planStripePriceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: input.currency,
                unit_amount: input.amountCents,
                ...(input.kind === "membership"
                  ? { recurring: { interval: "month" as const } }
                  : {}),
                product_data: { name: input.label.slice(0, 120) },
              },
            },
      ],
      success_url: `${input.origin}/?purse=card&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/?purse=cancelled`,
      client_reference_id: input.localRef,
      metadata: {
        localRef: input.localRef,
        sku: input.sku,
        kind: input.kind,
        planId: input.planId ?? "",
      },
    });
    return { ok: true, sessionId: session.id, url: session.url ?? undefined };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "stripe checkout failed",
    };
  }
}

export interface CardVerify {
  ok: boolean;
  paid?: boolean;
  amountCents?: number;
  error?: string;
}

/** the truth of one checkout session — was it paid? */
export async function verifyCardSession(
  sessionId: string
): Promise<CardVerify> {
  const stripe = await stripeClient();
  if (!stripe) return { ok: false, error: "stripe key not placed" };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      ok: true,
      paid: session.payment_status === "paid" || session.status === "complete",
      amountCents: session.amount_total ?? undefined,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "stripe read failed",
    };
  }
}
