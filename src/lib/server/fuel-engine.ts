import { db } from "@/lib/db";
import { grantWalletCredits } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  THE FUEL ENGINE INCUBATOR — the protected pipeline.                */
/*                                                                     */
/*  The house takes the raw energy of its available APIs (the sky's    */
/*  brushes, the chat engine, the messenger, the payment rails, the    */
/*  Google passage) and fuses them with Mirror Entity energy inside    */
/*  the incubator's reserves. The fused fuel is then distributed to    */
/*  passages on request — every drop landing in a wallet, every drop   */
/*  written twice (reserve + grant ledger).                            */
/*                                                                     */
/*  Pipeline:  APIs → FUSION (incubator) → RESERVES → DISTRIBUTION →   */
/*             the visitor's wallet → the doors weigh and serve.       */
/*                                                                     */
/*  Only the keeper's admin passage (see admin.ts) may read or move    */
/*  this machinery.                                                    */
/* ------------------------------------------------------------------ */

export interface ReserveDef {
  key: string;
  name: string;
  source: "openai" | "zai" | "resend" | "stripe" | "google" | "internal";
  role: string;
  capacity: number;
  /** The vault keys that make this pipeline real. */
  ready: () => boolean;
}

/** The incubator's tanks — each one a real pipeline of the house. */
export const RESERVE_DEFS: ReserveDef[] = [
  {
    key: "mirror_core",
    name: "Mirror Entity Core",
    source: "internal",
    role: "The house's own energy — the heart every other tank is fused against. Chat, akashic records, the walk, the branches.",
    capacity: 5_000_000,
    ready: () => true,
  },
  {
    key: "zai_chat_engine",
    name: "Z.ai Chat Engine",
    source: "zai",
    role: "The chat completions sky — every transmission, channel and record is woven here before it is fused.",
    capacity: 2_000_000,
    ready: () => Boolean(process.env.ZAI_API_KEY),
  },
  {
    key: "zai_cogview",
    name: "Z.ai CogView Brush",
    source: "zai",
    role: "The first image brush — paintings channeled through the Higher Self, served when the OpenAI brush rests.",
    capacity: 800_000,
    ready: () => Boolean(process.env.ZAI_API_KEY),
  },
  {
    key: "zai_atelier",
    name: "Z.ai Atelier (SDK)",
    source: "zai",
    role: "The final atelier brush via the z-ai SDK — the always-ready canvas in the laboratory.",
    capacity: 400_000,
    ready: () => true, // the SDK carries its own sky
  },
  {
    key: "openai_brush",
    name: "OpenAI Brush (DALL·E 3 / gpt-image-1)",
    source: "openai",
    role: "The visitor's chosen painter — the leading brush for every Higher Self visualization when its key rests in the vault.",
    capacity: 1_200_000,
    ready: () => Boolean(process.env.OPENAI_API_KEY),
  },
  {
    key: "messenger",
    name: "Resend Messenger",
    source: "resend",
    role: "The letters of the house — verification, password return, every transactional word. Letters rest in the log when unconfigured.",
    capacity: 50_000,
    ready: () => Boolean(process.env.RESEND_API_KEY),
  },
  {
    key: "stripe_rails",
    name: "Stripe Rails",
    source: "stripe",
    role: "The money pipelines — subscriptions and fuel packs flow through the signed webhooks into wallets.",
    capacity: 1_000_000,
    ready: () => Boolean(process.env.STRIPE_SECRET_KEY),
  },
  {
    key: "google_passage",
    name: "Google Passage",
    source: "google",
    role: "The Google door — one tap and a named passage is carved.",
    capacity: 100_000,
    ready: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },
  {
    key: "voice_skies",
    name: "Voice Skies (TTS · ASR)",
    source: "internal",
    role: "The voice gifts — speech spoken and heard through the house's own skies.",
    capacity: 150_000,
    ready: () => true,
  },
];

export interface FuelStatus {
  reserves: {
    key: string;
    name: string;
    source: string;
    role: string;
    capacity: number;
    fused: number;
    distributed: number;
    remaining: number;
    status: string;
    wired: boolean; // the vault holds the keys this pipeline needs
    lastFusedAt: string | null;
  }[];
  totals: {
    fused: number;
    distributed: number;
    remaining: number;
    grants: number;
    granted: number;
    passages: number;
    walletCredits: number;
  };
  recentGrants: {
    id: string;
    email: string;
    amount: number;
    kind: string;
    reserve: string;
    note: string | null;
    createdAt: string;
  }[];
  adminEmail: string;
}

/** The reserves, laid down idempotently — the incubator is always whole. */
export async function ensureReserves() {
  for (const def of RESERVE_DEFS) {
    await db.fuelReserve.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        name: def.name,
        source: def.source,
        role: def.role,
        capacity: def.capacity,
        status: def.ready() ? "active" : "resting",
      },
      update: {}, // the keeper's numbers are never overwritten by a re-read
    });
  }
}

/** THE FUSION — raw API capacity is fused with Mirror Entity energy:
    every wired, unpaused reserve receives its full capacity again,
    its counter grows, and the incubator marks the moment. */
export async function fuseAll(): Promise<{ fused: string[]; resting: string[] }> {
  await ensureReserves();
  const fused: string[] = [];
  const resting: string[] = [];
  const now = new Date();
  for (const def of RESERVE_DEFS) {
    const row = await db.fuelReserve.findUnique({ where: { key: def.key } });
    if (!row) continue;
    if (row.status === "paused") {
      resting.push(def.key);
      continue;
    }
    if (!def.ready()) {
      await db.fuelReserve.update({
        where: { key: def.key },
        data: { status: "resting" },
      });
      resting.push(def.key);
      continue;
    }
    await db.fuelReserve.update({
      where: { key: def.key },
      data: {
        status: "active",
        fused: { increment: def.capacity },
        lastFusedAt: now,
      },
    });
    fused.push(def.key);
  }
  return { fused, resting };
}

export interface DistributeResult {
  ok: boolean;
  error?: string;
  grant?: { id: string; email: string; amount: number; walletTotal: number };
}

/** THE DISTRIBUTION — fuel leaves the core reserve and lands, atomically
    and idempotently, in a passage's own wallet (paid credits), with the
    grant ledger written beside the wallet's own ledger rows. */
export async function distributeFuel(input: {
  email: string;
  amount: number;
  kind: string;
  note?: string;
  referenceId?: string;
}): Promise<DistributeResult> {
  const email = input.email.trim().toLowerCase();
  const amount = Math.max(1, Math.min(2_000_000, Math.floor(input.amount)));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "That email does not look like a passage." };
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false, error: "No passage holds that email yet." };
  }
  if (user.email.startsWith("anon:")) {
    return { ok: false, error: "Anonymous wanderers hold no purse — ask for a named passage." };
  }

  const grant = await db.fuelGrant.create({
    data: {
      email,
      userId: user.id,
      amount,
      kind: ["plan_fuel", "topup", "gift", "repair"].includes(input.kind) ? input.kind : "gift",
      reserve: "mirror_core",
      note: input.note?.slice(0, 300) ?? null,
    },
  });

  const wallet = await grantWalletCredits(user.id, {
    credits: amount,
    actionType: "TOPUP_PURCHASE",
    referenceId: input.referenceId ?? `fuel:${grant.id}`,
    description: `Fuel Engine · ${input.kind === "repair" ? "a repair" : input.kind === "plan_fuel" ? "the plan's fuel" : input.kind === "topup" ? "a fuel top-up" : "a gift of the house"}`,
  });
  if (!wallet.ok) {
    await db.fuelGrant.delete({ where: { id: grant.id } }).catch(() => undefined);
    return { ok: false, error: "The wallet would not receive the fuel — rest, then try again." };
  }

  await db.fuelReserve.update({
    where: { key: "mirror_core" },
    data: { distributed: { increment: amount } },
  });

  return {
    ok: true,
    grant: { id: grant.id, email, amount, walletTotal: wallet.total ?? amount },
  };
}

/** The whole incubator, read for the keeper's console. */
export async function fuelStatus(adminEmail: string): Promise<FuelStatus> {
  await ensureReserves();
  const [reserves, grants, passages, wallets] = await Promise.all([
    db.fuelReserve.findMany({ orderBy: [{ source: "asc" }, { key: "asc" }] }),
    db.fuelGrant.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.user.count({ where: { NOT: { email: { startsWith: "anon:" } } } }),
    db.userWallet.aggregate({ _sum: { freeCreditsRemaining: true, paidCreditsRemaining: true } }),
  ]);

  const granted = grants.reduce((sum, g) => sum + g.amount, 0);

  return {
    reserves: reserves.map((r) => ({
      key: r.key,
      name: r.name,
      source: r.source,
      role: r.role,
      capacity: r.capacity,
      fused: r.fused,
      distributed: r.distributed,
      remaining: Math.max(0, r.fused - r.distributed),
      status: r.status,
      wired: RESERVE_DEFS.find((d) => d.key === r.key)?.ready() ?? false,
      lastFusedAt: r.lastFusedAt ? r.lastFusedAt.toISOString() : null,
    })),
    totals: {
      fused: reserves.reduce((s, r) => s + r.fused, 0),
      distributed: reserves.reduce((s, r) => s + r.distributed, 0),
      remaining: reserves.reduce((s, r) => s + Math.max(0, r.fused - r.distributed), 0),
      grants: grants.length,
      granted,
      passages,
      walletCredits: (wallets._sum.freeCreditsRemaining ?? 0) + (wallets._sum.paidCreditsRemaining ?? 0),
    },
    recentGrants: grants.map((g) => ({
      id: g.id,
      email: g.email,
      amount: g.amount,
      kind: g.kind,
      reserve: g.reserve,
      note: g.note,
      createdAt: g.createdAt.toISOString(),
    })),
    adminEmail,
  };
}
