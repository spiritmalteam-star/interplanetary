import { db } from "@/lib/db";
import {
  ensureWallet,
  grantWalletCredits,
} from "@/lib/server/wallet";
import {
  createPaypalOrder,
  capturePaypalOrder,
} from "@/lib/server/payments/providers/paypal";
import {
  createCardCheckout,
  verifyCardSession,
} from "@/lib/server/payments/providers/card";

/* ------------------------------------------------------------------ */
/*  THE ONE LEDGER — every purchase (membership or coins) is one row   */
/*  in PaymentLedger, whichever provider carried it. The capture is    */
/*  idempotent: a double capture never double-credits — the row's own  */
/*  status is the lock, and the wallet grant carries a replay guard.   */
/* ------------------------------------------------------------------ */

function localRef(): string {
  return `me${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export interface CheckoutEntryInput {
  visitorId: string;
  userId: string;
  provider: "paypal" | "card";
  kind: "membership" | "coins";
  sku: string;
  amountCents: number;
  coinsCredited: number;
  planId: string | null;
  label: string;
  origin: string;
}

export interface CheckoutIntent {
  redirectUrl: string;
  row: {
    id: string;
    providerRef: string;
    provider: string;
    status: string;
  };
}

export async function createCheckoutEntry(
  input: CheckoutEntryInput
): Promise<CheckoutIntent> {
  const ref = localRef();

  if (input.provider === "paypal") {
    const order = await createPaypalOrder({
      amountCents: input.amountCents,
      currency: input.currency,
      label: input.label,
      sku: input.sku,
      localRef: ref,
      returnUrl: `${input.origin}/?purse=paypal&token={order_id}`,
      cancelUrl: `${input.origin}/?purse=cancelled`,
    });
    if (!order.ok || !order.orderId || !order.approveUrl) {
      throw new Error(order.error ?? "the paypal order could not be opened");
    }
    const row = await db.paymentLedger.create({
      data: {
        visitorId: input.visitorId,
        userId: input.userId,
        provider: "paypal",
        providerRef: order.orderId,
        kind: input.kind,
        sku: input.sku,
        amountCents: input.amountCents,
        currency: input.currency.toUpperCase(),
        coinsCredited: input.coinsCredited,
        planId: input.planId,
        status: "created",
        metadata: { localRef: ref, label: input.label },
      },
    });
    return {
      redirectUrl: order.approveUrl,
      row: { id: row.id, providerRef: row.providerRef, provider: row.provider, status: row.status },
    };
  }

  /* the card rides Stripe's own hosted page */
  const checkout = await createCardCheckout({
    amountCents: input.amountCents,
    currency: input.currency,
    label: input.label,
    sku: input.sku,
    kind: input.kind,
    planId: input.planId,
    localRef: ref,
    origin: input.origin,
  });
  if (!checkout.ok || !checkout.sessionId || !checkout.url) {
    throw new Error(checkout.error ?? "the card checkout could not be opened");
  }
  const row = await db.paymentLedger.create({
    data: {
      visitorId: input.visitorId,
      userId: input.userId,
      provider: "card",
      providerRef: checkout.sessionId,
      kind: input.kind,
      sku: input.sku,
      amountCents: input.amountCents,
      currency: input.currency.toUpperCase(),
      coinsCredited: input.coinsCredited,
      planId: input.planId,
      status: "created",
      metadata: { localRef: ref, label: input.label },
    },
  });
  return {
    redirectUrl: checkout.url,
    row: { id: row.id, providerRef: row.providerRef, provider: row.provider, status: row.status },
  };
}

/** PayPal's return carries an approved order — remember it before the
    capture, so an interrupted capture is never lost. */
export async function markApproved(ref: string): Promise<void> {
  try {
    await db.paymentLedger.updateMany({
      where: { providerRef: ref, status: "created" },
      data: { status: "approved" },
    });
  } catch {
    /* the mark is a courtesy — the capture itself is the law */
  }
}

export type CaptureReason =
  | "unknown"
  | "forbidden"
  | "provider_error"
  | "pending";

export interface CaptureOutcome {
  ok: boolean;
  already?: boolean;
  coinsCredited?: number;
  planId?: string | null;
  walletTotal?: number;
  row?: { id: string; status: string };
  reason?: CaptureReason;
}

/** The truth of one payment: ask the provider, credit ONCE, mark the
    ledger captured. A second capture answers already:true and touches
    nothing. */
export async function captureEntry(
  ref: string,
  userId: string
): Promise<CaptureOutcome> {
  const row = await db.paymentLedger.findFirst({
    where: { OR: [{ providerRef: ref }, { id: ref }] },
  });
  if (!row) return { ok: false, reason: "unknown" };
  if (row.userId && row.userId !== userId) {
    return { ok: false, reason: "forbidden" };
  }

  /* the once law — the row itself is the lock */
  if (row.status === "captured") {
    const wallet = await ensureWallet(userId);
    return {
      ok: true,
      already: true,
      coinsCredited: row.coinsCredited,
      planId: row.planId,
      walletTotal: wallet.total,
      row: { id: row.id, status: row.status },
    };
  }

  let paid = false;
  if (row.provider === "paypal") {
    const capture = await capturePaypalOrder(row.providerRef);
    if (!capture.ok) {
      const declined = /not landed|INSTRUMENT_DECLINED/i.test(capture.error ?? "");
      return {
        ok: false,
        reason: declined ? "pending" : "provider_error",
      };
    }
    paid = capture.completed === true;
  } else {
    const verify = await verifyCardSession(row.providerRef);
    if (!verify.ok) return { ok: false, reason: "provider_error" };
    paid = verify.paid === true;
  }

  if (!paid) return { ok: false, reason: "pending" };

  /* the purse is credited once — the wallet grant's replay guard is
     the second lock (a racing capture can never mint twice) */
  if (row.kind === "coins") {
    await grantWalletCredits(userId, {
      credits: row.coinsCredited,
      actionType: "TOPUP_PURCHASE",
      referenceId: `ledger:${row.id}`,
      description: "Coins purchased through the purse",
    });
  } else {
    await grantWalletCredits(userId, {
      credits: row.coinsCredited || 0,
      actionType: "SUBSCRIPTION_GRANT",
      referenceId: `ledger:${row.id}`,
      description: "Membership allowance — the passage's own light",
      planTier: (row.planId as "SEEKER" | "OBSERVATORY_PRO" | null) ?? null,
      extraMetadata: { ledgerId: row.id, sku: row.sku },
    });
    await db.userWallet.updateMany({
      where: { userId },
      data: {
        planTier: (row.planId as "SEEKER" | "OBSERVATORY_PRO" | null) ?? "SEEKER",
      },
    });
  }

  const wallet = await ensureWallet(userId);
  const updated = await db.paymentLedger.update({
    where: { id: row.id },
    data: {
      status: "captured",
      metadata: {
        ...(row.metadata as Record<string, unknown> | null) ?? {},
        capturedAt: new Date().toISOString(),
      },
    },
  });

  return {
    ok: true,
    already: false,
    coinsCredited: row.coinsCredited,
    planId: row.planId,
    walletTotal: wallet.total,
    row: { id: updated.id, status: updated.status },
  };
}
