import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { getCredits } from "@/lib/server/credits";
import { mailConfigured } from "@/lib/server/mail";
import { stripeConfigured, webhookConfigured } from "@/lib/server/billing";
import { CREDIT_PACKS, PLANS, planOrFree } from "@/lib/server/plans";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

/* ------------------------------------------------------------------ */
/*  GET /api/account/summary — everything the dashboard needs, in one  */
/*  honest page: plan, ledger balance, the month's usage, renewal,     */
/*  capabilities (what is configured and what rests) and the           */
/*  workspace. Ownership comes from the signed session — a client      */
/*  can only ever look into its own chamber.                           */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.email.startsWith("anon:")) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const gateUser = await db.user.findUnique({ where: { id: user.id } });
    const provisions = await ensureVisitorProvisions(user.id);

    const [credits, subscription, usageByOp, usageTotal, transactions] = await Promise.all([
      getCredits(provisions.workspaceId),
      db.subscription.findFirst({
        where: { workspaceId: provisions.workspaceId },
        orderBy: { updatedAt: "desc" },
      }),
      db.usageEvent.groupBy({
        by: ["operation"],
        where: {
          workspaceId: provisions.workspaceId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { operation: true },
        _sum: { creditsCharged: true },
      }),
      db.usageEvent.aggregate({
        where: {
          workspaceId: provisions.workspaceId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
        _sum: { creditsCharged: true },
      }),
      db.creditTransaction.findMany({
        where: { account: { workspaceId: provisions.workspaceId } },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    const plan = planOrFree(subscription?.plan);
    const libraryCount = await db.libraryEntry.count({ where: { userId: user.id } });

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        tier: user.tier,
        emailVerified: Boolean(gateUser?.emailVerifiedAt),
        createdAt: gateUser?.createdAt ?? null,
      },
      workspace: { id: provisions.workspaceId, name: null },
      plan: {
        id: plan.id,
        label: plan.label,
        priceCents: plan.priceCents,
        features: plan.features,
        monthlyCredits: plan.monthlyCredits,
        status: subscription?.status ?? "active",
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        renewsAt: credits?.periodEnd ?? subscription?.currentPeriodEnd ?? null,
        stripeConfigured: stripeConfigured(),
      },
      credits: {
        balance: credits?.balance ?? null,
        monthlyGrant: credits?.monthlyGrant ?? plan.monthlyCredits,
        enforced: process.env.CREDITS_ENFORCED === "true",
      },
      usage: {
        events30d: usageTotal._count.id,
        credits30d: usageTotal._sum.creditsCharged ?? 0,
        byOperation: usageByOp
          .map((row) => ({
            operation: row.operation,
            count: row._count.operation,
            credits: row._sum.creditsCharged ?? 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      libraryCount,
      capabilities: {
        stripe: stripeConfigured(),
        stripeWebhook: webhookConfigured(),
        mail: mailConfigured(),
        google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        creditsEnforced: process.env.CREDITS_ENFORCED === "true",
      },
      offers: {
        plans: Object.values(PLANS).map((p) => ({
          id: p.id,
          label: p.label,
          priceCents: p.priceCents,
          monthlyCredits: p.monthlyCredits,
          features: p.features,
          available: Boolean(p.stripePriceId) || p.id === "FREE",
        })),
        packs: CREDIT_PACKS.map((p) => ({
          id: p.id,
          label: p.label,
          credits: p.credits,
          priceCents: p.priceCents,
          available: Boolean(p.stripePriceId),
        })),
      },
    });
  } catch (err) {
    console.error("[account/summary] failed:", err);
    return NextResponse.json(
      { error: "The account chamber is momentarily veiled. Rest, then return." },
      { status: 500 }
    );
  }
}
