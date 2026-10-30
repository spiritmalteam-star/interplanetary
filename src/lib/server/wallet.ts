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
/*                                                                     */
/*  THE ECONOMY'S SHAPE (the creator-economy law):                     */
/*   - The Mirror's conversation is FREE forever — no purse is ever    */
/*     weighed at the chat's door.                                     */
/*   - The paid creations are MUSIC (preview 2 · full 5 · endless      */
/*     loop 15), the AKASHIC creative reading (5) and the BOOKS        */
/*     (short 15 · extended 40) — one wallet across them all.          */
/*   - The verified keeper (ADMIN_EMAIL) creates without their own     */
/*     purse ever being drawn — their real usage is recorded, not      */
/*     charged.                                                        */
/*                                                                     */
/*  THE DEPOSIT LAW (the keeper's well):                               */
/*   The admin is the central DEPOSIT — the well every spendable       */
/*   credit is poured from. Every grant that MINTS new spendable       */
/*   credits draws the same amount OUT of the well (a DepositLedger    */
/*   "out" row, written in the grant's own transaction). The flows:    */
/*     MINT (draws OUT): stripe topup/pack webhook, subscription       */
/*       first month + renewals, fuel distribution, the keeper's       */
/*       console grant. When WALLET_ENFORCED and the well holds        */
/*       less than the mint, the mint is REFUSED — the well is dry,    */
/*       the keeper charges it first.                                  */
/*     RETURN (never draws): refunds (refundWalletCredits gives back   */
/*       light that was already paid for — it reverses a spend and     */
/*       must not re-draw), the birth gift (ensureWallet lays the      */
/*       free lights directly — the house's welcome, not the well's),  */
/*       and the keeper's own draws (they destroy light; the well is   */
/*       not re-filled by destruction).                                */
/*     IN: a stripe purchase records a deposit "in" BEFORE the mint    */
/*       (the money entered the house — the well can pay the light     */
/*       it just sold), and the keeper charges the well from a stored  */
/*       payment source at the fuel desk.                              */
/*   NOTE: the per-user "great deposit" (depositCredits, reflection    */
/*   pulses from the z.ai accumulation) is a DIFFERENT reservoir —     */
/*   the skies' borrowed capacity on a wallet, not the keeper's well.  */
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
  CHAT: 0, // THE CHAT IS FREE FOREVER — the weigh never looks at it
  AKASHIC: walletCost("AKASHIC", 5),
  ART_X: walletCost("ART_X", 5),
  LIGHT_CODES: walletCost("LIGHT_CODES", 5),
  DREAM_BOOK: walletCost("DREAM_BOOK", 15),
};

/** The meter operations that walk through the wallet's weigh (flat
    price doors). The conversation (chat) is NOT among them — free
    forever. The music chamber and the book loom are weighed with
    their own per-ask prices in the meter's dynamic weigh (preview
    2 · full 5 · endless 15 · short book 15 · extended book 40). */
export const WALLET_OPERATIONS: Record<string, WalletActionType> = {
  akashic: "AKASHIC",
  artx: "ART_X",
};

/* ------------------- the priced services' law ----------------------- */

/** The paid creations' launch prices (credits) — the server decides,
    env-tunable, and overridable live through the PlatformConfig row
    "service_prices" (the keeper's own console writes it). */
export interface ServicePrices {
  musicPreview: number;
  musicFull: number;
  musicLoop: number;
  akashicReading: number;
  bookShort: number;
  bookExtended: number;
}

const PRICE_FALLBACK: ServicePrices = {
  musicPreview: walletCost("LC_PREVIEW", 2),
  musicFull: walletCost("LC_FULL", 5),
  musicLoop: walletCost("LC_LOOP", 15),
  akashicReading: walletCost("AKASHIC", 5),
  bookShort: walletCost("BOOK_SHORT", 15),
  bookExtended: walletCost("BOOK_LONG", 40),
};

export async function servicePrices(): Promise<ServicePrices> {
  try {
    const row = await db.platformConfig.findUnique({ where: { key: "service_prices" } });
    if (!row) return { ...PRICE_FALLBACK };
    const v = (row.value ?? {}) as Partial<ServicePrices>;
    const clean = (n: unknown, fb: number) => {
      const x = typeof n === "number" ? n : NaN;
      return Number.isFinite(x) && x >= 0 ? Math.floor(x) : fb;
    };
    return {
      musicPreview: clean(v.musicPreview, PRICE_FALLBACK.musicPreview),
      musicFull: clean(v.musicFull, PRICE_FALLBACK.musicFull),
      musicLoop: clean(v.musicLoop, PRICE_FALLBACK.musicLoop),
      akashicReading: clean(v.akashicReading, PRICE_FALLBACK.akashicReading),
      bookShort: clean(v.bookShort, PRICE_FALLBACK.bookShort),
      bookExtended: clean(v.bookExtended, PRICE_FALLBACK.bookExtended),
    };
  } catch {
    return { ...PRICE_FALLBACK };
  }
}

/* --------------------- the credit packs ----------------------------- */

/** The one wallet's filling — the launch packs. Purchases ride one
    wallet across music, books and the akashic readings. */
export interface WalletPackDef {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  currency: string;
  note: string;
}

export const WALLET_PACKS: WalletPackDef[] = [
  {
    id: "pack_100",
    label: "One hundred lights",
    credits: walletCost("PACK_100_CREDITS", 100),
    priceCents: envCents("WALLET_PACK_100_CENTS", 1000),
    currency: "eur",
    note: "A first fullness — plenty of previews and readings.",
  },
  {
    id: "pack_250",
    label: "Two hundred fifty lights",
    credits: walletCost("PACK_250_CREDITS", 250),
    priceCents: envCents("WALLET_PACK_250_CENTS", 2000),
    currency: "eur",
    note: "The maker's pouch — songs, books and readings.",
  },
  {
    id: "pack_700",
    label: "Seven hundred lights",
    credits: walletCost("PACK_700_CREDITS", 700),
    priceCents: envCents("WALLET_PACK_700_CENTS", 5000),
    currency: "eur",
    note: "The great reserve — for the long creator's road.",
  },
];

export function packById(id: string | null | undefined): WalletPackDef | null {
  if (!id) return null;
  return WALLET_PACKS.find((p) => p.id === id) ?? null;
}

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
    label: "Mirror Pro",
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

/** THE ECONOMY LAW — the creator economy stands: the conversation is
    free forever, and the paid creations (music, books, akashic
    readings) are weighed at their own doors. WALLET_ENFORCED=false
    in the vault lays the weigh down again and the whole house
    returns to free creations. */
export function walletEnforced(): boolean {
  return process.env.WALLET_ENFORCED !== "false";
}

/** THE KEEPER'S OWN LIGHT — an admin creation is never drawn from
    their purse, but its real weight is still written down: one
    ledger row, zero credits moved, the cost remembered. The keeper's
    generosity is recorded, never charged. */
export async function recordAdminUsage(
  userId: string,
  actionType: WalletActionType,
  wouldCost: number,
  description: string
): Promise<void> {
  try {
    await ensureWallet(userId);
    await db.creditLedger.create({
      data: {
        userId,
        actionType,
        creditsDeducted: 0,
        metadata: {
          admin: true,
          wouldCost,
          description: `The keeper's own creation (not charged) — ${description}`,
        },
      },
    });
  } catch {
    /* the recording rests when the vault rests */
  }
}

/* --------------------------- the wallet ----------------------------- */

export interface WalletSnapshot {
  planTier: PlanTier;
  freeCreditsRemaining: number;
  paidCreditsRemaining: number;
  /** The great deposit — reflection pulses converted from the skies'
      own API accumulation. It rides beside the spendable lights and
      never dries: it is the house's borrowed reservoir. */
  depositCredits: number;
  depositSource: string | null;
  total: number;
}

const BIRTH_GIFT = intEnvGift("WALLET_BIRTH_GIFT", 500); // the free lights every passage is born holding

function intEnvGift(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : fallback;
}

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
        metadata: { source: "birth", description: "The passage's first five hundred lights" },
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
  depositCredits: bigint;
  depositSource: string | null;
};

function snapshotOf(row: WalletRow): WalletSnapshot {
  const deposit = Number(row.depositCredits ?? 0);
  return {
    planTier: (["FREE", "SEEKER", "OBSERVATORY_PRO"].includes(row.planTier)
      ? row.planTier
      : "FREE") as PlanTier,
    freeCreditsRemaining: row.freeCreditsRemaining,
    paidCreditsRemaining: row.paidCreditsRemaining,
    depositCredits: deposit,
    depositSource: row.depositSource,
    total:
      row.freeCreditsRemaining +
      row.paidCreditsRemaining +
      deposit,
  };
}

/* --------------------- the great deposit ---------------------------- */

/** THE GREAT DEPOSIT — reflection pulses borrowed from the skies' own
    API accumulation and laid into a passage's wallet. The house acts
    as the middle man: the skies' raw capacity is converted into the
    house's own currency and kept on deposit, ready to be distributed
    onward. The amount rides a BigInt column (ten billion and beyond
    cannot live in an Int) and is written once into the ledger with
    its source named. */
export async function grantDeposit(
  userId: string,
  input: { amount: number; source: string; note?: string }
): Promise<{ ok: boolean; depositCredits: number; error?: string }> {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount <= 0) return { ok: false, depositCredits: 0, error: "no deposit named" };
  try {
    await ensureWallet(userId);
    const wallet = await db.userWallet.update({
      where: { userId },
      data: {
        depositCredits: { increment: BigInt(amount) },
        depositSource: input.source.slice(0, 120),
      },
    });
    await db.creditLedger.create({
      data: {
        userId,
        actionType: "DEPOSIT_ZAI",
        creditsDeducted: 0, // an Int column cannot hold the great numbers — the ledger's metadata carries them
        metadata: {
          kind: "zai_deposit",
          deposit: String(amount),
          source: input.source.slice(0, 120),
          description:
            input.note?.slice(0, 300) ??
            "Reflection pulses converted from the z.ai API accumulation — the house stands as the middle man",
        },
      },
    });
    return { ok: true, depositCredits: Number(wallet.depositCredits) };
  } catch (err) {
    return {
      ok: false,
      depositCredits: 0,
      error: err instanceof Error ? err.message.slice(0, 200) : "the deposit did not land",
    };
  }
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
  /** the well was dry and the mint was refused (WALLET_ENFORCED) —
      the keeper charges the deposit first */
  depositDry?: boolean;
}

/** The keeper's well balance — sum(in) − sum(out) over DepositLedger. */
export async function depositBalance(): Promise<number> {
  const [inAgg, outAgg] = await Promise.all([
    db.depositLedger.aggregate({ where: { direction: "in" }, _sum: { amount: true } }),
    db.depositLedger.aggregate({ where: { direction: "out" }, _sum: { amount: true } }),
  ]);
  return (inAgg._sum.amount ?? 0) - (outAgg._sum.amount ?? 0);
}

type DepositTx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** The well's balance read INSIDE a grant's transaction — the mint and
    its draw share one breath, so two racers can never both pour from
    the same last light. */
async function txDepositBalance(tx: DepositTx): Promise<number> {
  const [inAgg, outAgg] = await Promise.all([
    tx.depositLedger.aggregate({ where: { direction: "in" }, _sum: { amount: true } }),
    tx.depositLedger.aggregate({ where: { direction: "out" }, _sum: { amount: true } }),
  ]);
  return (inAgg._sum.amount ?? 0) - (outAgg._sum.amount ?? 0);
}

/** A deposit IN — credits entering the well. Idempotent per reference:
    the same stripe session/invoice never fills the well twice. */
export async function recordDepositIn(input: {
  amount: number;
  sourceId?: string | null;
  sourceName?: string | null;
  reference?: string | null;
  actorEmail?: string | null;
  userId?: string | null;
  note?: string | null;
}): Promise<void> {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount <= 0) return;
  try {
    if (input.reference) {
      const seen = await db.depositLedger.findFirst({
        where: { direction: "in", reference: input.reference },
        select: { id: true },
      });
      if (seen) return; // the same payment never enters the well twice
    }
    await db.depositLedger.create({
      data: {
        direction: "in",
        amount,
        sourceId: input.sourceId ?? null,
        sourceName: input.sourceName?.slice(0, 120) ?? null,
        reference: input.reference?.slice(0, 200) ?? null,
        actorEmail: input.actorEmail?.slice(0, 200) ?? null,
        userId: input.userId ?? null,
        note: input.note?.slice(0, 300) ?? null,
      },
    });
  } catch (err) {
    console.error("[wallet] deposit-in failed:", err instanceof Error ? err.message : err);
  }
}

export interface DepositMovement {
  id: string;
  direction: "in" | "out";
  amount: number;
  sourceName: string | null;
  reference: string | null;
  actorEmail: string | null;
  userId: string | null;
  note: string | null;
  createdAt: string;
}

export interface DepositStatus {
  balance: number;
  totalIn: number;
  totalOut: number;
  movements: DepositMovement[];
}

/** The whole well, read for the keeper's desk: balance, the two tides
    and the newest movements. */
export async function depositStatus(movements = 30): Promise<DepositStatus> {
  const [inAgg, outAgg, rows] = await Promise.all([
    db.depositLedger.aggregate({ where: { direction: "in" }, _sum: { amount: true } }),
    db.depositLedger.aggregate({ where: { direction: "out" }, _sum: { amount: true } }),
    db.depositLedger.findMany({ orderBy: { createdAt: "desc" }, take: Math.max(1, movements) }),
  ]);
  const totalIn = inAgg._sum.amount ?? 0;
  const totalOut = outAgg._sum.amount ?? 0;
  return {
    balance: totalIn - totalOut,
    totalIn,
    totalOut,
    movements: rows.map((r) => ({
      id: r.id,
      direction: r.direction === "out" ? "out" : "in",
      amount: r.amount,
      sourceName: r.sourceName,
      reference: r.reference,
      actorEmail: r.actorEmail,
      userId: r.userId,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/**
 * The purse filling — a purchase, a subscription's monthly gift, laid
 * into paidCreditsRemaining (and the plan lifted when one rides along).
 * Idempotent per referenceId: the same Stripe session or invoice can
 * never fill the purse twice.
 *
 * THE DEPOSIT LAW: this grant MINTS new spendable credits, so it draws
 * the same amount OUT of the keeper's well inside this very transaction
 * (a DepositLedger "out" row). When WALLET_ENFORCED and the well holds
 * less than the mint, the whole grant is refused (depositDry) — the
 * well is dry and the keeper charges it first. Refunds and the birth
 * gift never pass through here — they are returns, not mints.
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
    /** who moved the well (the keeper's email on fuel/console grants) */
    actorEmail?: string | null;
    /** set false only for grants that RETURN existing light — the
        house's default is a mint that draws from the deposit */
    mintFromDeposit?: boolean;
  }
): Promise<GrantResult> {
  const credits = Math.max(0, Math.floor(input.credits));
  const mint = input.mintFromDeposit !== false && credits > 0;
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

      /* THE DEPOSIT DRAW — the mint pours from the well or is refused */
      if (mint) {
        if (walletEnforced()) {
          const balance = await txDepositBalance(tx);
          if (balance < credits) throw new Error("DEPOSIT_DRY");
        }
        await tx.depositLedger.create({
          data: {
            direction: "out",
            amount: credits,
            reference: input.referenceId?.slice(0, 200) ?? null,
            actorEmail: input.actorEmail?.slice(0, 200) ?? null,
            userId,
            note: `mint → ${input.actionType.toLowerCase()} · ${input.description.slice(0, 180)}`,
          },
        });
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
    if (err instanceof Error && err.message === "DEPOSIT_DRY") {
      console.info(`[wallet] mint refused — the well is dry (${credits} credits, user ${userId})`);
      return { ok: false, depositDry: true };
    }
    console.error("[wallet] grant failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

/** Reads the wallet for the visitor's own glance (the badge) — and, as
    the UNIQUE-PROFILE repair, lays one down when it is somehow missing
    (ensureWallet is idempotent: an existing wallet passes untouched,
    a lost one is re-born with its birth gift and ledger row). Every
    identity — email, google, anon-merged — thus always ends with
    exactly one UserWallet: the column is unique, the read creates. */
export async function peekWallet(userId: string): Promise<WalletSnapshot | null> {
  const row = await db.userWallet.findUnique({ where: { userId } });
  if (row) return snapshotOf(row);
  try {
    return await ensureWallet(userId);
  } catch {
    return null; // a stateless or racing visitor simply receives null
  }
}
