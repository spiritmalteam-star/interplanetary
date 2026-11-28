import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE FOUNDER'S TRUTH — every number carries its own source and      */
/*  definition, and says plainly when it cannot be known.              */
/*    verified      read straight from the production database        */
/*    estimated     computed from partial records (coverage stated)    */
/*    unavailable   a read failed — never replaced with a guess        */
/*    not_connected the house does not collect this yet                */
/*  Nothing here invents history: what was never recorded stays        */
/*  "not_connected".                                                   */
/* ------------------------------------------------------------------ */

export type MetricStatus = "verified" | "estimated" | "unavailable" | "not_connected";
export interface Metric {
  value: number | null;
  status: MetricStatus;
  source: string;
  definition: string;
  note?: string;
}

const ok = (value: number, source: string, definition: string, note?: string): Metric => ({ value, status: "verified", source, definition, note });
const est = (value: number, source: string, definition: string, note: string): Metric => ({ value, status: "estimated", source, definition, note });
const na = (source: string, definition: string, note?: string): Metric => ({ value: null, status: "unavailable", source, definition, note });
export const notConnected = (definition: string, note: string): Metric => ({ value: null, status: "not_connected", source: "none", definition, note });

async function guard(fn: () => Promise<Metric>, source: string, definition: string): Promise<Metric> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[founder] ${source} unavailable:`, err instanceof Error ? err.message : err);
    return na(source, definition, "The read failed; no value is shown rather than a guess.");
  }
}

const DAY = 86_400_000;
const REAL_PAYMENT = { status: "complete", type: { in: ["subscription", "credit_pack"] }, amountCents: { gt: 0 } };

export async function buildFounderOverview(rangeDays: number, now = new Date()) {
  const days = Math.min(365, Math.max(1, Math.floor(rangeDays) || 30));
  const since = new Date(now.getTime() - days * DAY);
  const prevSince = new Date(since.getTime() - days * DAY);
  const real = { not: { startsWith: "anon:" } };

  const activeSince = (ms: number, label: string) =>
    guard(async () => {
      const g = await db.usageEvent.groupBy({ by: ["userId"], where: { createdAt: { gte: new Date(now.getTime() - ms) } } });
      return ok(g.length, "UsageEvent", `Distinct accounts (incl. guests) with at least one recorded AI request in the ${label}.`, "Active = made a request. Page visits are not recorded.");
    }, "UsageEvent", `Active ${label}`);

  const [
    registered, anonymous, newRegs, prevRegs, activeNow, dau, wau, mau,
    revenueRange, revenuePrev, revenueAll, buyersAll, buyersRange, complimentary, subsActive, walletSubs,
    ledgerCost, ledgerCostNull, liability,
  ] = await Promise.all([
    guard(async () => ok(await db.user.count({ where: { email: real } }), "User", "Accounts with a real email or Google identity (guests excluded)."), "User", "Registered users"),
    guard(async () => ok(await db.user.count({ where: { email: { startsWith: "anon:" } } }), "User", "Guest passages that touched a feature. Not page visitors: visits are not recorded."), "User", "Guests"),
    guard(async () => ok(await db.user.count({ where: { email: real, createdAt: { gte: since } } }), "User", `Registrations in the last ${days} days.`), "User", "New registrations"),
    guard(async () => ok(await db.user.count({ where: { email: real, createdAt: { gte: prevSince, lt: since } } }), "User", `Registrations in the ${days} days before that.`), "User", "Previous registrations"),
    activeSince(5 * 60_000, "last 5 minutes"),
    activeSince(DAY, "last 24 hours"),
    activeSince(7 * DAY, "last 7 days"),
    activeSince(30 * DAY, "last 30 days"),
    guard(async () => {
      const a = await db.payment.aggregate({ where: { ...REAL_PAYMENT, createdAt: { gte: since } }, _sum: { amountCents: true }, _count: { _all: true } });
      return ok((a._sum.amountCents ?? 0) / 100, "Payment (written only by the verified Stripe webhook)", `Gross card revenue in the last ${days} days, USD, status=complete. Before refunds, fees and taxes.`, `${a._count._all} completed payments`);
    }, "Payment", "Gross revenue"),
    guard(async () => {
      const a = await db.payment.aggregate({ where: { ...REAL_PAYMENT, createdAt: { gte: prevSince, lt: since } }, _sum: { amountCents: true } });
      return ok((a._sum.amountCents ?? 0) / 100, "Payment", `Gross revenue in the ${days} days before that.`);
    }, "Payment", "Previous revenue"),
    guard(async () => {
      const a = await db.payment.aggregate({ where: REAL_PAYMENT, _sum: { amountCents: true }, _count: { _all: true } });
      return ok((a._sum.amountCents ?? 0) / 100, "Payment", "Gross card revenue, all time, USD.", `${a._count._all} completed payments since records began`);
    }, "Payment", "Lifetime revenue"),
    guard(async () => {
      const g = await db.payment.groupBy({ by: ["userId", "workspaceId"], where: REAL_PAYMENT });
      return ok(g.length, "Payment", "Distinct buyers (account or workspace) with a completed payment, all time.");
    }, "Payment", "Unique buyers"),
    guard(async () => {
      const g = await db.payment.groupBy({ by: ["userId", "workspaceId"], where: { ...REAL_PAYMENT, createdAt: { gte: since } } });
      return ok(g.length, "Payment", `Distinct buyers with a completed payment in the last ${days} days.`);
    }, "Payment", "Paying customers (range)"),
    guard(async () => ok(await db.payment.count({ where: { type: "complimentary" } }), "Payment", "Complimentary grants (not revenue, shown separately)."), "Payment", "Complimentary"),
    guard(async () => ok(await db.subscription.count({ where: { status: { in: ["active", "trialing"] } } }), "Subscription", "Workspace subscriptions currently active or trialing."), "Subscription", "Active subscriptions"),
    guard(async () => ok(await db.userWallet.count({ where: { stripeSubscriptionId: { not: null } } }), "UserWallet", "Wallets carrying a Stripe subscription id (pass holders)."), "UserWallet", "Pass holders"),
    guard(async () => {
      const a = await db.creditLedger.aggregate({ where: { createdAt: { gte: since }, rawCostUsd: { not: null } }, _sum: { rawCostUsd: true }, _count: { _all: true } });
      return ok(a._sum.rawCostUsd ?? 0, "CreditLedger.rawCostUsd", `Recorded AI provider cost in the last ${days} days, USD.`, `${a._count._all} ledger rows carry a recorded cost`);
    }, "CreditLedger", "AI cost"),
    guard(async () => ok(await db.creditLedger.count({ where: { createdAt: { gte: since }, rawCostUsd: null, creditsDeducted: { lt: 0 } } }), "CreditLedger", "Spend rows in range with no recorded provider cost."), "CreditLedger", "Uncosted spends"),
    guard(async () => {
      const w = await db.userWallet.aggregate({ _sum: { freeCreditsRemaining: true, paidCreditsRemaining: true } });
      return ok((w._sum.freeCreditsRemaining ?? 0) + (w._sum.paidCreditsRemaining ?? 0), "UserWallet", "Credits owed to customers (free + paid, excluding the founder's deposit), in credits — not dollars.");
    }, "UserWallet", "Credit liability"),
  ]);

  /* AI cost is only partly recorded; say so instead of presenting it whole */
  const aiCost: Metric =
    ledgerCost.status === "verified" && ledgerCostNull.status === "verified" && (ledgerCostNull.value ?? 0) > 0
      ? est(ledgerCost.value ?? 0, "CreditLedger.rawCostUsd", ledgerCost.definition, `${ledgerCostNull.value} spend rows in range have no recorded cost, so the true cost is at least this.`)
      : ledgerCost;

  const revenueV = revenueRange.status === "verified" ? revenueRange.value ?? 0 : null;
  const costV = aiCost.value;
  const grossAfterAi: Metric =
    revenueV !== null && costV !== null
      ? est(Math.round((revenueV - costV) * 100) / 100, "Payment − CreditLedger.rawCostUsd", "Gross revenue minus recorded AI cost. NOT profit: processing fees, hosting, taxes, refunds and uncosted spends are excluded.", "Estimated; upper bound of gross profit.")
      : na("Payment − CreditLedger", "Gross revenue minus recorded AI cost.");

  /* providers: straight from the usage events */
  let providers: unknown[] | { status: "unavailable" } = { status: "unavailable" };
  try {
    const g = await db.usageEvent.groupBy({
      by: ["provider", "model"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
      _avg: { latencyMs: true },
      _max: { createdAt: true },
    });
    const failed = await db.usageEvent.groupBy({ by: ["provider", "model"], where: { createdAt: { gte: since }, success: false }, _count: { _all: true } });
    const failMap = new Map(failed.map((f) => [`${f.provider}|${f.model ?? ""}`, f._count._all]));
    providers = g
      .map((r) => {
        const fails = failMap.get(`${r.provider}|${r.model ?? ""}`) ?? 0;
        return {
          provider: r.provider,
          model: r.model,
          requests: r._count._all,
          failed: fails,
          errorRatePct: Math.round((fails / r._count._all) * 1000) / 10,
          inputTokens: r._sum.inputTokens ?? 0,
          outputTokens: r._sum.outputTokens ?? 0,
          avgLatencyMs: r._avg.latencyMs === null ? null : Math.round(r._avg.latencyMs),
          lastUsed: r._max.createdAt,
        };
      })
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 40);
  } catch (err) {
    console.error("[founder] providers unavailable:", err instanceof Error ? err.message : err);
  }

  const delta = (cur: Metric, prev: Metric) =>
    cur.value !== null && prev.value !== null ? Math.round((cur.value - prev.value) * 100) / 100 : null;

  return {
    generatedAt: now.toISOString(),
    rangeDays: days,
    metrics: {
      registeredUsers: registered,
      guests: anonymous,
      newRegistrations: { ...newRegs, note: `vs previous ${days} days: ${delta(newRegs, prevRegs) ?? "n/a"}` },
      activeNow, dau, wau, mau,
      returningUsers: notConnected("Users who came back after a first visit.", "Visit tracking is not collected, so this is not computed."),
      grossRevenue: { ...revenueRange, note: `${revenueRange.note ?? ""} · vs previous period: ${delta(revenueRange, revenuePrev) ?? "n/a"}`.trim() },
      lifetimeRevenue: revenueAll,
      uniqueBuyers: buyersAll,
      payingCustomersInRange: buyersRange,
      complimentaryGrants: complimentary,
      activeSubscriptions: subsActive,
      passHolders: walletSubs,
      cancelledSubscriptions: notConnected("Subscriptions cancelled.", "Cancellations overwrite the subscription row, so history is not kept."),
      failedPayments: notConnected("Failed card payments.", "The Stripe webhook records completed checkouts only."),
      refunds: notConnected("Refunded payments.", "No refund webhook handler exists yet (charge.refunded)."),
      processingFees: notConnected("Stripe fees.", "Fees are not stored; Stripe balance transactions are not connected."),
      hostingCosts: notConnected("Hosting and database cost.", "Vercel billing is not connected."),
      aiCost,
      grossRevenueMinusAiCost: grossAfterAi,
      operatingProfit: notConnected("Revenue minus all operating expenses.", "Needs fees, hosting and provider invoices to be connected first."),
      creditLiability: liability,
      conversion: notConnected("Visitors who become buyers.", "Needs visit tracking to define the denominator."),
    },
    providers,
    providerBalances: notConnected("Provider account balances.", "Z.ai exposes no official balance API wired here; use the manual reconciliation field (planned) or the official billing page."),
  };
}
