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
