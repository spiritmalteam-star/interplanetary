/* ------------------------------------------------------------------ */
/*  THE COIN KEEPER — Stripe, server-side only, honestly gated.        */
/*                                                                     */
/*  Laws of the coin:                                                  */
/*   1. The secret key never leaves the server (no NEXT_PUBLIC_*).     */
/*   2. Money's truth arrives ONLY through signed webhooks — never     */
/*      from a browser redirect, never from success=true.              */
/*   3. Every webhook is signature-verified (STRIPE_WEBHOOK_SECRET)    */
/*      and processed exactly once (ProcessedEvent register).          */
/*   4. No price id is ever invented: a plan without its STRIPE_PRICE_* */
/*      simply cannot be checked out yet, and the route says so.       */
/* ------------------------------------------------------------------ */

import Stripe from "stripe";
import { db } from "@/lib/db";
import { grantCredits } from "@/lib/server/credits";
import { packFor, planFor } from "@/lib/server/plans";
import {
  WALLET_PLANS,
  grantWalletCredits,
  recordDepositIn,
  type PlanTier,
} from "@/lib/server/wallet";

let stripeClient: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function webhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set — the coin keeper rests.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      /* pinned apiVersion would fight the SDK's typings — let the SDK
         choose the version it was built for */
      typescript: true,
    });
  }
  return stripeClient;
}

/** The workspace's Stripe customer, created on first need. */
export async function ensureStripeCustomer(
  workspaceId: string,
  email: string,
  name: string | null
): Promise<string | null> {
  if (!stripeConfigured()) return null;
  const sub = await db.subscription.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { workspaceId },
  });
  await db.subscription.create({
    data: {
      workspaceId,
      plan: "FREE",
      status: "active",
      stripeCustomerId: customer.id,
    },
  });
  return customer.id;
}

export async function upsertSubscriptionFromStripe(input: {
  workspaceId: string;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  const existing = input.stripeSubscriptionId
    ? await db.subscription.findUnique({ where: { stripeSubscriptionId: input.stripeSubscriptionId } })
    : await db.subscription.findFirst({
        where: { workspaceId: input.workspaceId, stripeSubscriptionId: null },
        orderBy: { createdAt: "desc" },
      });
  if (existing) {
    await db.subscription.update({
      where: { id: existing.id },
      data: { ...input },
    });
  } else {
    await db.subscription.create({ data: { ...input } });
  }
}

/* --------------------------- webhook events -------------------------- */

/**
 * THE DEPOSIT LAW — money entered the house. Every wallet purchase
 * fills the keeper's well (a DepositLedger "in" row) BEFORE the mint
 * pours the buyer's light into their purse, so the well can always
 * pay for the light it just sold. Idempotent per reference: a replay
 * can never fill the well twice, even beside the ProcessedEvent guard.
 */
async function recordPurchaseDeposit(input: {
  userId: string;
  credits: number;
  reference: string;
  note: string;
}): Promise<void> {
  if (input.credits <= 0) return;
  try {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    await recordDepositIn({
      amount: input.credits,
      sourceName: "stripe",
      reference: input.reference,
      actorEmail: user?.email ?? null,
      userId: input.userId,
      note: input.note,
    });
  } catch (err) {
    console.error(
      "[billing] deposit-in failed:",
      err instanceof Error ? err.message : err
    );
  }
}

/** The mint beside a purchase — the deposit IN is already recorded, so
    a dry refusal here can only be a racing distribution drinking the
    fresh light; one honest retry, then a loud debt the keeper's console
    can see (the Payment row exists, the wallet grant does not). */
async function mintWithDepositRetry(input: {
  userId: string;
  credits: number;
  actionType: "SUBSCRIPTION_GRANT" | "TOPUP_PURCHASE";
  referenceId: string;
  description: string;
  planTier?: PlanTier | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  purchaseReference: string;
  purchaseNote: string;
}): Promise<void> {
  await recordPurchaseDeposit({
    userId: input.userId,
    credits: input.credits,
    reference: input.purchaseReference,
    note: input.purchaseNote,
  });
  let result = await grantWalletCredits(input.userId, {
    credits: input.credits,
    actionType: input.actionType,
    referenceId: input.referenceId,
    description: input.description,
    planTier: input.planTier ?? null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
  });
  if (!result.ok && result.depositDry) {
    result = await grantWalletCredits(input.userId, {
      credits: input.credits,
      actionType: input.actionType,
      referenceId: input.referenceId,
      description: input.description,
      planTier: input.planTier ?? null,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    });
  }
  if (!result.ok && !result.duplicate) {
    console.error(
      `[billing] PURCHASE OWED — the wallet grant failed after the deposit IN (${input.purchaseReference}); the keeper owes this light:`,
      input.description
    );
  }
}

/**
 * Handles one verified Stripe event exactly once. Returns true when
 * the event changed something (for logging only — the answer to
 * Stripe is always 200 so it never storms a retrying sky).
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  /* the register: the same event never pays twice */
  try {
    await db.processedEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    /* unique id collision — this event already did its work */
    console.info(`[billing] event ${event.id} already processed`);
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const walletUserId = session.metadata?.wallet === "1" ? session.metadata?.userId ?? null : null;

        /* ---------- the wallet's own passages (the frontier law) -------
           metadata.userId + wallet:"1" — the checkout that fills the
           visitor's OWN wallet. The subscription's first month and the
           one-time pouch both land here, idempotently. */
        if (walletUserId) {
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
          const creditsToGrant = session.metadata?.creditsToGrant
            ? parseInt(session.metadata.creditsToGrant, 10)
            : 0;

          if (session.mode === "subscription") {
            const tier = (session.metadata?.planTier ?? "SEEKER") as PlanTier;
            let subId: string | null = null;
            if (typeof session.subscription === "string") subId = session.subscription;
            if (creditsToGrant > 0 || subId) {
              await mintWithDepositRetry({
                userId: walletUserId,
                credits: creditsToGrant,
                actionType: "SUBSCRIPTION_GRANT",
                referenceId: `sub-active:${session.id}`,
                description: `The ${tier} pass opened — ${creditsToGrant.toLocaleString()} credits of light`,
                planTier: tier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subId,
                purchaseReference: `stripe:${session.id}`,
                purchaseNote: `Stripe purchase — the ${tier} pass, first moon`,
              });
            }
            await db.payment.create({
              data: {
                userId: walletUserId,
                stripeId: session.id,
                type: "subscription",
                amountCents: session.amount_total ?? 0,
                currency: session.currency ?? "usd",
                status: session.status ?? "complete",
                description: `Wallet pass — ${tier}`,
              },
            });
          } else if (session.mode === "payment") {
            if (creditsToGrant > 0) {
              await mintWithDepositRetry({
                userId: walletUserId,
                credits: creditsToGrant,
                actionType: "TOPUP_PURCHASE",
                referenceId: `topup:${session.id}`,
                description: `A pouch of light — ${creditsToGrant.toLocaleString()} credits`,
                stripeCustomerId: customerId,
                purchaseReference: `stripe:${session.id}`,
                purchaseNote: "Stripe purchase — a pouch of light",
              });
            }
            await db.payment.create({
              data: {
                userId: walletUserId,
                stripeId: session.id,
                type: "credit_pack",
                amountCents: session.amount_total ?? 0,
                currency: session.currency ?? "usd",
                status: session.status ?? "complete",
                description: `Wallet top-up — ${creditsToGrant.toLocaleString()} credits`,
              },
            });
          }
          break;
        }

        const workspaceId = session.metadata?.workspaceId ?? null;
        if (!workspaceId) return;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

        if (session.mode === "subscription") {
          const priceId =
            (typeof session.line_items === "object" && session.line_items?.data?.[0]?.price?.id) || null;
          const plan = planFor(priceId) ?? session.metadata?.plan ?? "PRO";
          let subId: string | null = null;
          let periodEnd: Date | null = null;
          let periodStart: Date | null = null;
          if (typeof session.subscription === "string") {
            const stripe = getStripe();
            const sub = (await stripe.subscriptions.retrieve(
              session.subscription
            )) as unknown as {
              id: string;
              current_period_start?: number;
              current_period_end?: number;
            };
            subId = sub.id;
            periodStart = sub.current_period_start
              ? new Date(sub.current_period_start * 1000)
              : new Date();
            periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
          }
          await upsertSubscriptionFromStripe({
            workspaceId,
            plan,
            status: "active",
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            stripePriceId: priceId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
          });
          await grantCredits(workspaceId, session.metadata?.grantCredits
            ? parseInt(session.metadata.grantCredits, 10)
            : 0, {
            type: "subscription_grant",
            source: "stripe",
            referenceId: `sub-active:${session.id}`,
            description: `Subscription activated — ${plan}`,
          });
          await db.payment.create({
            data: {
              workspaceId,
              stripeId: session.id,
              type: "subscription",
              amountCents: session.amount_total ?? 0,
              currency: session.currency ?? "usd",
              status: session.status ?? "complete",
              description: `Subscription checkout — ${plan}`,
            },
          });
        } else if (session.mode === "payment") {
          const pack = packFor(session.metadata?.packPriceId ?? null);
          const credits = pack?.credits ?? (session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0);
          if (credits > 0) {
            await grantCredits(workspaceId, credits, {
              type: "purchase",
              source: "stripe",
              referenceId: `pack:${session.id}`,
              description: `Credit pack — ${credits.toLocaleString()} credits`,
            });
            await db.payment.create({
              data: {
                workspaceId,
                stripeId: session.id,
                type: "credit_pack",
                amountCents: session.amount_total ?? 0,
                currency: session.currency ?? "usd",
                status: session.status ?? "complete",
                description: `Credit pack — ${credits.toLocaleString()} credits`,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as unknown as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };
        const walletSubUser = sub.metadata?.wallet === "1" ? sub.metadata?.userId ?? null : null;
        if (walletSubUser) {
          /* the wallet's own subscription — status rides onto the wallet */
          const tier = (sub.metadata?.planTier ?? "SEEKER") as PlanTier;
          await db.userWallet.updateMany({
            where: { userId: walletSubUser },
            data: {
              planTier: sub.status === "canceled" ? "FREE" : tier,
              ...(sub.status === "canceled" ? { stripeSubscriptionId: null } : {}),
            },
          });
          break;
        }
        const workspaceId = sub.metadata?.workspaceId;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const plan = planFor(priceId) ?? sub.metadata?.plan ?? "PRO";
        if (workspaceId) {
          await upsertSubscriptionFromStripe({
            workspaceId,
            plan,
            status: sub.status,
            stripeCustomerId: customerId ?? null,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
            currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        /* the wallet's own pass ends — the tier returns to FREE, the
           remaining light stays in the purse (nothing is taken back) */
        const walletSub = await db.userWallet.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (walletSub) {
          await db.userWallet.update({
            where: { id: walletSub.id },
            data: { planTier: "FREE", stripeSubscriptionId: null },
          });
          break;
        }
        const existing = await db.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
        if (existing) {
          await db.subscription.update({
            where: { id: existing.id },
            data: { status: "canceled", plan: "FREE", cancelAtPeriodEnd: false },
          });
        }
        break;
      }

      case "invoice.paid": {
        /* every renewal month lays the plan's new gift in the ledger */
        const invoice = event.data.object as Stripe.Invoice & { billing_reason?: string };
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId || invoice.billing_reason !== "subscription_cycle") break;

        /* the wallet's own pass renews first — the monthly lights land
           in the visitor's purse, idempotent per invoice id */
        const wallet = await db.userWallet.findUnique({ where: { stripeCustomerId: customerId } });
        if (wallet && wallet.stripeSubscriptionId) {
          const tier = (wallet.planTier in WALLET_PLANS ? wallet.planTier : "SEEKER") as PlanTier;
          await mintWithDepositRetry({
            userId: wallet.userId,
            credits: WALLET_PLANS[tier].monthlyCredits,
            actionType: "SUBSCRIPTION_GRANT",
            referenceId: `invoice:${invoice.id}`,
            description: `The ${tier} pass renewed — ${WALLET_PLANS[tier].monthlyCredits.toLocaleString()} credits of light`,
            purchaseReference: `stripe:${invoice.id}`,
            purchaseNote: `Stripe renewal — the ${tier} pass, a new moon`,
          });
          break;
        }

        const sub = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId, status: { in: ["active", "trialing", "past_due"] } },
        });
        if (!sub) break;
        const { PLANS, planOrFree } = await import("@/lib/server/plans");
        const plan = planOrFree(sub.plan);
        await grantCredits(sub.workspaceId, plan.monthlyCredits, {
          type: "renewal",
          source: "stripe",
          referenceId: `invoice:${invoice.id}`,
          description: `Monthly renewal — ${plan.label} (${plan.monthlyCredits.toLocaleString()} credits)`,
        });
        void PLANS;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        await db.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "past_due" },
        });
        break;
      }

      default:
        /* unwatched events pass quietly */
        break;
    }
  } catch (err) {
    console.error("[billing] event handling failed:", err instanceof Error ? err.message : err);
  }
}
