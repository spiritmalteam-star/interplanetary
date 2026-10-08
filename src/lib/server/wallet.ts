import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE VISITOR'S OWN WALLET — the per-user credit pipeline.           */
/*                                                                     */
/*  Laws of the wallet:                                                */
/*   1. Every passage carries one wallet from birth — five free        */
/*      lights laid in at the moment the passage opens (email door,    */
/*      Google door, even the quiet anonymous keeper).                 */
/*   2. The FREE lights are spent FIRST; whatever remains of the       */
/*      price is drawn from the purchased lights. Never the reverse.   */
/*   3. Spending is ATOMIC and PRE-EXECUTION: the weigh happens        */
/*      before the door serves, and a passage that cannot pay is       */
/*      answered at once with 402 INSUFFICIENT_CREDITS — the work      */
/*      is never done on light that is not there.                      */
/*   4. Every movement is written twice: the wallet's buckets AND the  */
/*      CreditLedger (signed rows — negative spent, positive granted   */
/*      or refunded). The ledger is the truth; the buckets are hands.  */
/*   5. A door that stumbles (any 4xx/5xx after the weigh) gives the   */
/*      light back — the exact free/paid split returned, a refund row  */
/*      laid beside the spend. No one pays for a silence.              */
/*   6. Grants are idempotent: the same Stripe checkout session or     */
/*      invoice can never pay the wallet twice.                        */
/*                                                                     */
/*  PlanTier values : FREE | SEEKER | OBSERVATORY_PRO                  */
/*  ActionType values: CHAT | AKASHIC | ART_X | LIGHT_CODES |          */
/*                     DREAM_BOOK | SUBSCRIPTION_GRANT |               */
/*                     TOPUP_PURCHASE                                  */
/*  (SQLite keeps no enums — these written values are the law.)        */
/* ------------------------------------------------------------------ */

export type PlanTier = "FREE" | "SEEKER" | "OBSERVATORY_PRO";

export type WalletActionType =
  | "CHAT"
  | "AKASHIC"
  | "ART_X"
  | "LIGHT_CODES"
  | "DREAM_BOOK"
  | "SUBSCRIPTION_GRANT"
  | "TOPUP_PURCHASE";

/** The weigh stones of the five gated doors — the server decides, the
    browser may ask. Costs are env-tunable (WALLET_COST_<TYPE>). */
function walletCost(name: string, fallback: number): number {
  const raw = process.env[`WALLET_COST_${name}`];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const WALLET_COSTS: Record<string, number> = {
  CHAT: walletCost("CHAT", 1),
  AKASHIC: walletCost("AKASHIC", 2),
  ART_X: walletCost("ART_X", 5),
  LIGHT_CODES: walletCost("LIGHT_CODES", 12),
  DREAM_BOOK: walletCost("DREAM_BOOK", 2),
};

/** The meter operations that walk through the wallet's weigh. */
export const WALLET_OPERATIONS: Record<string, WalletActionType> = {
  chat: "CHAT",
  akashic: "AKASHIC",
  artx: "ART_X",
  light_codes: "LIGHT_CODES",
  dream_book: "DREAM_BOOK",
};

/* ---------------------------- the plans ----------------------------- */

export interface WalletPlanDef {
  id: PlanTier;
  label: string;
  priceCents: number;
  /** credits laid into the wallet every monthly period */
  monthlyCredits: number;
  /** Stripe price id from the vault — when absent the checkout mints
      its own inline price_data so the door is never dead on arrival */
  stripePriceId?: string;
}

function envCents(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const WALLET_PLANS: Record<PlanTier, WalletPlanDef> = {
  FREE: { id: "FREE", label: "Crystalline", priceCents: 0, monthlyCredits: 0 },
  SEEKER: {
    id: "SEEKER",
    label: "Seeker",
    priceCents: envCents("WALLET_SEEKER_PRICE_CENTS", 999),
    monthlyCredits: walletCost("SEEKER_CREDITS", 100),
    stripePriceId: process.env.STRIPE_PRICE_SEEKER,
  },
  OBSERVATORY_PRO: {
    id: "OBSERVATORY_PRO",
    label: "Observatory Pro",
    priceCents: envCents("WALLET_OBSERVATORY_PRO_PRICE_CENTS", 1999),
    monthlyCredits: walletCost("OBSERVATORY_PRO_CREDITS", 250),
    stripePriceId: process.env.STRIPE_PRICE_OBSERVATORY_PRO,
  },
};

/** The one-time pouch of light — the top-up. */
export const WALLET_TOPUP = {
  id: "topup",
  label: "A pouch of light",
  priceCents: envCents("WALLET_TOPUP_PRICE_CENTS", 499),
  credits: walletCost("TOPUP_CREDITS", 50),
  stripePriceId: process.env.STRIPE_PRICE_TOPUP,
};

export function planTierFor(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (WALLET_PLANS.SEEKER.stripePriceId && WALLET_PLANS.SEEKER.stripePriceId === priceId)
    return "SEEKER";
  if (
    WALLET_PLANS.OBSERVATORY_PRO.stripePriceId &&
    WALLET_PLANS.OBSERVATORY_PRO.stripePriceId === priceId
  )
    return "OBSERVATORY_PRO";
  return null;
}

/* ------------------------- enforcement ------------------------------ */

/** The wallet's law stands by default (the frontier pipeline is live);
    the keeper may rest it with WALLET_ENFORCED=false in the vault. */
export function walletEnforced(): boolean {
  return process.env.WALLET_ENFORCED !== "false";
}

/* --------------------------- the wallet ----------------------------- */

export interface WalletSnapshot {
  planTier: PlanTier;
  freeCreditsRemaining: number;
  paidCreditsRemaining: number;
  total: number;
}

const BIRTH_GIFT = 5; // the free lights every passage is born holding

/** The passage's wallet, laid down idempotently. Safe to call at every
    door — an existing wallet simply passes through untouched. */
export async function ensureWallet(userId: string): Promise<WalletSnapshot> {
  const existing = await db.userWallet.findUnique({ where: { userId } });
  if (existing) return snapshotOf(existing);

  try {
    const fresh = await db.userWallet.create({
      data: { userId, planTier: "FREE", freeCreditsRemaining: BIRTH_GIFT },
    });
    await db.creditLedger.create({
      data: {
        userId,
        actionType: "SUBSCRIPTION_GRANT",
        creditsDeducted: BIRTH_GIFT,
        metadata: { source: "birth", description: "The passage's first five lights" },
      },
    });
    return snapshotOf(fresh);
  } catch {
    /* a simultaneous birth already laid the wallet — read and pass */
    const again = await db.userWallet.findUnique({ where: { userId } });
    if (again) return snapshotOf(again);
    throw new Error("wallet could not be provisioned");
  }
}

type WalletRow = {
  planTier: string;
  freeCreditsRemaining: number;
  paidCreditsRemaining: number;
};

function snapshotOf(row: WalletRow): WalletSnapshot {
  return {
    planTier: (["FREE", "SEEKER", "OBSERVATORY_PRO"].includes(row.planTier)
      ? row.planTier
      : "FREE") as PlanTier,
    freeCreditsRemaining: row.freeCreditsRemaining,
    paidCreditsRemaining: row.paidCreditsRemaining,
    total: row.freeCreditsRemaining + row.paidCreditsRemaining,
  };
}

export interface SpendResult {
  ok: boolean;
  free: number;
  paid: number;
  total: number;
  required?: number;
  /** the ledger row of the spend — carried so a stumble can be refunded */
  ledgerId?: string;
}

/**
 * The atomic weigh & draw. Free lights first, purchased lights second —
 * both decremented in ONE conditional update inside one transaction, so
 * two simultaneous doors can never draw from the same light. The ledger
 * row is written in the same breath; a race simply retries (twice).
 */
export async function spendWalletCredits(
  userId: string,
  actionType: WalletActionType,
  meta: {
    cost: number;
    rawCostUsd?: number | null;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<SpendResult> {
  const cost = Math.max(0, Math.floor(meta.cost));
  if (cost === 0) {
    const w = await ensureWallet(userId);
    return { ok: true, free: w.freeCreditsRemaining, paid: w.paidCreditsRemaining, total: w.total };
  }

  let lastRace: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.$transaction(async (tx) => {
        const wallet = await tx.userWallet.findUnique({ where: { userId } });
        if (!wallet) {
          /* no wallet (stateless or racing birth) — the free-first law
             cannot weigh; the door answers dry rather than overspend */
          return { kind: "dry" as const, total: 0 };
        }
        const have = wallet.freeCreditsRemaining + wallet.paidCreditsRemaining;
        if (have < cost) {
          return { kind: "dry" as const, total: have };
        }
        const freePart = Math.min(wallet.freeCreditsRemaining, cost);
        const paidPart = cost - freePart;

        /* the one conditional UPDATE — atomic against every racer */
        const drawn = await tx.userWallet.updateMany({
          where: {
            userId,
            freeCreditsRemaining: { gte: freePart },
            paidCreditsRemaining: { gte: paidPart },
          },
          data: {
            freeCreditsRemaining: { decrement: freePart },
            paidCreditsRemaining: { decrement: paidPart },
          },
        });
        if (drawn.count === 0) {
          throw new Error("WALLET_RACE");
        }

        const ledger = await tx.creditLedger.create({
          data: {
            userId,
            actionType,
            creditsDeducted: -cost,
            rawCostUsd: meta.rawCostUsd ?? null,
            metadata: {
              ...(meta.metadata ?? {}),
              description: meta.description ?? `The ${actionType.toLowerCase()} weigh`,
              freePart,
              paidPart,
            },
          },
        });

        return {
          kind: "spent" as const,
          free: wallet.freeCreditsRemaining - freePart,
          paid: wallet.paidCreditsRemaining - paidPart,
          ledgerId: ledger.id,
          freePart,
          paidPart,
        };
      });

      if (result.kind === "dry") {
        return { ok: false, free: -1, paid: -1, total: result.total, required: cost };
      }
      return {
        ok: true,
        free: result.free,
        paid: result.paid,
        total: result.free + result.paid,
        ledgerId: result.ledgerId,
      };
    } catch (err) {
      if (err instanceof Error && err.message === "WALLET_RACE") {
        lastRace = err; // another hand moved the same light — weigh again
        continue;
      }
      console.error("[wallet] spend failed:", err instanceof Error ? err.message : err);
      return { ok: false, free: -1, paid: -1, total: 0, required: cost };
    }
  }
  console.error("[wallet] spend raced out:", lastRace instanceof Error ? lastRace.message : lastRace);
  return { ok: false, free: -1, paid: -1, total: 0, required: cost };
}

/**
 * The giving-back. A door that stumbled after the weigh returns the
 * exact free/paid split it drew, and the ledger receives the refund
 * row beside the spend — the truth stays double-written.
 */
export async function refundWalletCredits(userId: string, ledgerId: string): Promise<void> {
  try {
    const spend = await db.creditLedger.findUnique({ where: { id: ledgerId } });
    if (!spend || spend.creditsDeducted >= 0) return;
    const meta = (spend.metadata ?? {}) as { freePart?: number; paidPart?: number; refunded?: boolean };
    if (meta.refunded) return; // the same spend never refunds twice
    const freePart = Math.max(0, Math.floor(meta.freePart ?? 0));
    const paidPart = Math.max(0, Math.floor(meta.paidPart ?? 0));
    if (freePart + paidPart === 0) return;

    await db.$transaction(async (tx) => {
      await tx.userWallet.update({
        where: { userId },
        data: {
          freeCreditsRemaining: { increment: freePart },
          paidCreditsRemaining: { increment: paidPart },
        },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          actionType: spend.actionType,
          creditsDeducted: freePart + paidPart,
          metadata: { refundOf: spend.id, description: "The door stumbled — the light returned" },
        },
      });
      /* mark the original row refunded so a replay cannot double-give */
      await tx.creditLedger.update({
        where: { id: spend.id },
        data: { metadata: { ...(spend.metadata as object), refunded: true } },
      });
    });
  } catch (err) {
    console.error("[wallet] refund failed:", err instanceof Error ? err.message : err);
  }
}

export interface GrantResult {
  ok: boolean;
  total?: number;
  duplicate?: boolean;
}

/**
 * The purse filling — a purchase, a subscription's monthly gift, laid
 * into paidCreditsRemaining (and the plan lifted when one rides along).
 * Idempotent per referenceId: the same Stripe session or invoice can
 * never fill the purse twice.
 */
export async function grantWalletCredits(
  userId: string,
  input: {
    credits: number;
    actionType: "SUBSCRIPTION_GRANT" | "TOPUP_PURCHASE";
    referenceId?: string;
    description: string;
    planTier?: PlanTier | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    rawCostUsd?: number | null;
  }
): Promise<GrantResult> {
  const credits = Math.max(0, Math.floor(input.credits));
  try {
    await ensureWallet(userId);
    const result = await db.$transaction(async (tx) => {
      if (input.referenceId) {
        /* the replay guard — the same reference never grants twice */
        const recent = await tx.creditLedger.findMany({
          where: { userId, actionType: input.actionType },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: { metadata: true },
        });
        const seen = recent.some((row) => {
          const m = row.metadata as { referenceId?: string } | null;
          return m?.referenceId === input.referenceId;
        });
        if (seen) return { duplicate: true as const };
      }

      const wallet = await tx.userWallet.update({
        where: { userId },
        data: {
          paidCreditsRemaining: { increment: credits },
          ...(input.planTier ? { planTier: input.planTier } : {}),
          ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
          ...(input.stripeSubscriptionId ? { stripeSubscriptionId: input.stripeSubscriptionId } : {}),
        },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          actionType: input.actionType,
          creditsDeducted: credits,
          rawCostUsd: input.rawCostUsd ?? null,
          metadata: {
            description: input.description,
            referenceId: input.referenceId ?? null,
          },
        },
      });
      return {
        duplicate: false as const,
        total: wallet.freeCreditsRemaining + wallet.paidCreditsRemaining,
      };
    });
    if (result.duplicate) return { ok: true, duplicate: true };
    return { ok: true, total: result.total };
  } catch (err) {
    console.error("[wallet] grant failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

/** Reads the wallet without ever creating one — for the visitor's own
    glance (the badge). Returns null when no wallet rests yet. */
export async function peekWallet(userId: string): Promise<WalletSnapshot | null> {
  const row = await db.userWallet.findUnique({ where: { userId } });
  return row ? snapshotOf(row) : null;
}
