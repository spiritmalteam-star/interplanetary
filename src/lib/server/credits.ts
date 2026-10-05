import { db } from "@/lib/db";
import { planOrFree } from "@/lib/server/plans";

/* ------------------------------------------------------------------ */
/*  THE LEDGER — credits are truth written twice.                      */
/*                                                                     */
/*  Laws of the ledger:                                                */
/*   1. The balance is a bucket; the CreditTransaction rows are the    */
/*      truth. Nothing is trusted from the client — ever.              */
/*   2. Deductions are ATOMIC: a conditional updateMany requires       */
/*      balance >= amount, so two simultaneous requests can never      */
/*      spend the same credits or drive the balance below zero.        */
/*   3. Grants carry (source, referenceId) and the pair is unique —    */
/*      the same Stripe webhook delivered twice grants once.           */
/*   4. The free month renews itself lazily: the first look after      */
/*      periodEnd rolls the period and lays the new gift — no cron.    */
/* ------------------------------------------------------------------ */

export interface CreditSnapshot {
  balance: number;
  monthlyGrant: number;
  periodEnd: Date;
  plan: string;
}

export interface SpendResult {
  ok: boolean;
  balance: number;
  reason?: "insufficient" | "no_account";
  required?: number;
}

/** Reads the account, laying the new month's gift when the period has
    quietly passed. Does not fail when no account exists. */
export async function getCredits(workspaceId: string): Promise<CreditSnapshot | null> {
  const account = await db.creditAccount.findUnique({ where: { workspaceId } });
  if (!account) return null;

  const now = new Date();
  if (account.periodEnd > now) {
    const subscription = await db.subscription.findFirst({
      where: { workspaceId, status: { in: ["active", "trialing", "past_due"] } },
    });
    return { balance: account.balance, monthlyGrant: account.monthlyGrant, periodEnd: account.periodEnd, plan: subscription?.plan ?? "FREE" };
  }

  /* the month has passed — roll it forward inside one transaction */
  const plan = planOrFree(
    (
      await db.subscription.findFirst({
        where: { workspaceId, status: { in: ["active", "trialing", "past_due"] } },
      })
    )?.plan
  );
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  try {
    const rolled = await db.$transaction(async (tx) => {
      const fresh = await tx.creditAccount.update({
        where: { id: account.id },
        data: {
          balance: plan.monthlyCredits,
          monthlyGrant: plan.monthlyCredits,
          periodStart: now,
          periodEnd,
        },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: plan.monthlyCredits,
          type: "renewal",
          source: "system",
          referenceId: `renewal:${account.id}:${now.toISOString().slice(0, 10)}`,
          description: `Monthly renewal — ${plan.label} gift`,
        },
      });
      return fresh;
    });
    return { balance: rolled.balance, monthlyGrant: rolled.monthlyGrant, periodEnd: rolled.periodEnd, plan: plan.id };
  } catch (err) {
    /* a simultaneous roll already wrote the renewal — read and pass */
    console.error("[credits] rollover raced:", err instanceof Error ? err.message : err);
    const again = await db.creditAccount.findUnique({ where: { workspaceId } });
    return again
      ? { balance: again.balance, monthlyGrant: again.monthlyGrant, periodEnd: again.periodEnd, plan: plan.id }
      : null;
  }
}

/**
 * The atomic spend. Returns ok:false when the balance would fall below
 * zero — never partially, never negatively, never twice.
 */
export async function spendCredits(
  workspaceId: string,
  amount: number,
  meta: { operation: string; description?: string; source?: string }
): Promise<SpendResult> {
  if (amount <= 0) return { ok: true, balance: -1 };
  try {
    const updated = await db.creditAccount.updateMany({
      where: { workspaceId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (updated.count === 0) {
      const account = await db.creditAccount.findUnique({ where: { workspaceId } });
      return {
        ok: false,
        reason: account ? "insufficient" : "no_account",
        balance: account?.balance ?? 0,
        required: amount,
      };
    }
    const account = await db.creditAccount.findUnique({ where: { workspaceId } });
    await db.creditTransaction.create({
      data: {
        accountId: account!.id,
        amount: -amount,
        type: "consumption",
        source: meta.source ?? "api",
        description: meta.description ?? `Consumption — ${meta.operation}`,
      },
    });
    return { ok: true, balance: account!.balance };
  } catch (err) {
    console.error("[credits] spend failed:", err instanceof Error ? err.message : err);
    return { ok: false, reason: "no_account", balance: 0 };
  }
}

/**
 * Grants credits (subscription renewal, purchase, refund, admin gift).
 * Idempotent per (source, referenceId) — safe against webhook replays.
 */
export async function grantCredits(
  workspaceId: string,
  amount: number,
  meta: {
    type: "subscription_grant" | "renewal" | "purchase" | "refund" | "admin";
    source: "stripe" | "system" | "api" | "admin";
    referenceId?: string;
    description: string;
  }
): Promise<{ ok: boolean; balance?: number; duplicate?: boolean }> {
  try {
    const result = await db.$transaction(async (tx) => {
      let account = await tx.creditAccount.findUnique({ where: { workspaceId } });
      if (!account) return null;
      if (meta.referenceId) {
        const seen = await tx.creditTransaction.findFirst({
          where: { source: meta.source, referenceId: meta.referenceId },
        });
        if (seen) return { duplicate: true as const, balance: account.balance };
      }
      const fresh = await tx.creditAccount.update({
        where: { id: account.id },
        data: { balance: { increment: amount } },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount,
          type: meta.type,
          source: meta.source,
          referenceId: meta.referenceId ?? null,
          description: meta.description,
        },
      });
      return { duplicate: false as const, balance: fresh.balance };
    });
    if (!result) return { ok: false };
    return { ok: true, balance: result.balance, duplicate: result.duplicate };
  } catch (err) {
    /* the unique pair caught a replay race — that is success enough */
    console.error("[credits] grant failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

/** Server-side enforcement switch — the free law stands until the
    keeper flips CREDITS_ENFORCED=true in the vault. */
export function creditsEnforced(): boolean {
  return process.env.CREDITS_ENFORCED === "true";
}
