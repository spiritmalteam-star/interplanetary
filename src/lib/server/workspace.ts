import { db } from "@/lib/db";
import { PLANS, planOrFree, type PlanDef } from "@/lib/server/plans";

/* ------------------------------------------------------------------ */
/*  THE PROVISIONS — every passage receives its tenancy at birth.      */
/*                                                                     */
/*  One transaction lays down, idempotently:                           */
/*    Workspace (personal) ← → WorkspaceMember (owner)                 */
/*    CreditAccount (the FREE gift inside)                             */
/*  Existing visitors receive theirs on the next door they open.       */
/* ------------------------------------------------------------------ */

export interface Provisions {
  workspaceId: string;
  creditAccountId: string;
  plan: PlanDef;
}

/** Creates the tenancy for a user when it does not exist yet.
    Safe to call on every door — it simply passes when all stands. */
export async function ensureVisitorProvisions(userId: string): Promise<Provisions> {
  /* fast path — most calls find everything standing */
  const existing = await db.workspaceMember.findFirst({
    where: { userId, role: "owner" },
    include: { workspace: { include: { creditAccount: true } } },
  });
  if (existing?.workspace.creditAccount) {
    const subscription = await db.subscription.findFirst({
      where: { workspaceId: existing.workspaceId, status: { in: ["active", "trialing", "past_due"] } },
    });
    if (subscription) {
      const plan = planOrFree(subscription.plan);
      return { workspaceId: existing.workspaceId, creditAccountId: existing.workspace.creditAccount.id, plan };
    }
    /* no plan row yet — fall through so the transaction lays the Free plan */
  }

  const created = await db.$transaction(async (tx) => {
    let member = await tx.workspaceMember.findFirst({
      where: { userId, role: "owner" },
      include: { workspace: true },
    });
    let workspace = member?.workspace ?? null;
    if (!workspace) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const label = user?.email?.startsWith("anon:")
        ? "The Quiet Chamber"
        : user?.name
          ? `${user.name}'s Laboratory`
          : "My Laboratory";
      workspace = await tx.workspace.create({ data: { name: label, ownerId: userId } });
    }
    const m =
      member ??
      (await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId, role: "owner" },
      }));
    let account = await tx.creditAccount.findUnique({ where: { workspaceId: workspace.id } });
    if (!account) {
      account = await tx.creditAccount.create({
        data: {
          workspaceId: workspace.id,
          balance: PLANS.FREE.monthlyCredits,
          monthlyGrant: PLANS.FREE.monthlyCredits,
          periodStart: new Date(),
          periodEnd: monthFromNow(),
        },
      });
      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: PLANS.FREE.monthlyCredits,
          type: "subscription_grant",
          source: "system",
          referenceId: `free-grant:${workspace.id}:${account.periodStart.toISOString().slice(0, 10)}`,
          description: "The Crystalline gift — a month of free credits",
        },
      });
    }
    /* every workspace stands on the Free plan from birth — Stripe's
       webhook is the only hand that lifts it later */
    const existingSub = await tx.subscription.findFirst({
      where: { workspaceId: workspace.id },
    });
    if (!existingSub) {
      await tx.subscription.create({
        data: { workspaceId: workspace.id, plan: "FREE", status: "active" },
      });
    }
    return { workspaceId: workspace.id, creditAccountId: account.id, plan: PLANS.FREE as PlanDef, member: m };
  });

  return { workspaceId: created.workspaceId, creditAccountId: created.creditAccountId, plan: created.plan };
}

function monthFromNow(): Date {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
