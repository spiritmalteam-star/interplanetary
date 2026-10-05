/* ------------------------------------------------------------------ */
/*  THE PLAN STONES — one centralized, configurable plan system.       */
/*                                                                     */
/*  No business logic is hard-coded in the frontend or the routes:     */
/*  everything reads from here. Prices live in Stripe; the price IDs   */
/*  come from the environment (STRIPE_PRICE_PRO etc.) and are NEVER    */
/*  invented — a plan without a price id simply cannot be checked      */
/*  out yet. An administrator changes limits by changing env vars or   */
/*  these defaults — nothing else needs to be touched.                 */
/* ------------------------------------------------------------------ */

export type PlanId = "FREE" | "PRO" | "PRO_PLUS" | "BUSINESS";

export interface PlanDef {
  id: PlanId;
  label: string;
  /** monthly price in USD cents — display only; Stripe charges the truth */
  priceCents: number;
  /** credits granted every monthly period */
  monthlyCredits: number;
  maxProjects: number; // -1 = unlimited
  maxFiles: number;
  maxFileSizeMb: number;
  maxAiRequestsPerDay: number;
  /** per-minute AI operation allowance */
  rateLimitPerMinute: number;
  apiAccess: boolean;
  priority: number; // higher = served first when prioritizing
  features: string[];
  /** Stripe price id — from the vault, never invented */
  stripePriceId?: string;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const PLANS: Record<PlanId, PlanDef> = {
  FREE: {
    id: "FREE",
    label: "Crystalline",
    priceCents: 0,
    monthlyCredits: envInt("PLAN_FREE_CREDITS", 10_000),
    maxProjects: 3,
    maxFiles: 20,
    maxFileSizeMb: 5,
    maxAiRequestsPerDay: envInt("PLAN_FREE_DAILY_AI", 100),
    rateLimitPerMinute: 10,
    apiAccess: false,
    priority: 1,
    features: ["Every world", "Cosmic library", "Voice gifts"],
  },
  PRO: {
    id: "PRO",
    label: "Pro",
    priceCents: envInt("PLAN_PRO_PRICE_CENTS", 1900),
    monthlyCredits: envInt("PLAN_PRO_CREDITS", 100_000),
    maxProjects: 25,
    maxFiles: 500,
    maxFileSizeMb: 25,
    maxAiRequestsPerDay: 2_000,
    rateLimitPerMinute: 60,
    apiAccess: true,
    priority: 2,
    features: ["Everything in Free", "Full API access", "Higher rate limits", "Priority weaving"],
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  PRO_PLUS: {
    id: "PRO_PLUS",
    label: "Pro Plus",
    priceCents: envInt("PLAN_PRO_PLUS_PRICE_CENTS", 4900),
    monthlyCredits: envInt("PLAN_PRO_PLUS_CREDITS", 400_000),
    maxProjects: 100,
    maxFiles: 2_000,
    maxFileSizeMb: 100,
    maxAiRequestsPerDay: 10_000,
    rateLimitPerMinute: 120,
    apiAccess: true,
    priority: 3,
    features: ["Everything in Pro", "Highest rate limits", "Front of the queue"],
    stripePriceId: process.env.STRIPE_PRICE_PRO_PLUS,
  },
  BUSINESS: {
    id: "BUSINESS",
    label: "Business",
    priceCents: envInt("PLAN_BUSINESS_PRICE_CENTS", 9900),
    monthlyCredits: envInt("PLAN_BUSINESS_CREDITS", 1_500_000),
    maxProjects: -1,
    maxFiles: -1,
    maxFileSizeMb: 512,
    maxAiRequestsPerDay: -1,
    rateLimitPerMinute: 300,
    apiAccess: true,
    priority: 4,
    features: ["Everything in Pro Plus", "Unlimited projects", "Team seats ready"],
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS,
  },
};

/** The purchasable credit packs — amounts configurable, Stripe price
    ids again from the vault only. */
export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  stripePriceId?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_10k",
    label: "10,000 credits",
    credits: 10_000,
    priceCents: envInt("PACK_10K_PRICE_CENTS", 900),
    stripePriceId: process.env.STRIPE_PRICE_PACK_10K,
  },
  {
    id: "pack_50k",
    label: "50,000 credits",
    credits: 50_000,
    priceCents: envInt("PACK_50K_PRICE_CENTS", 3900),
    stripePriceId: process.env.STRIPE_PRICE_PACK_50K,
  },
  {
    id: "pack_200k",
    label: "200,000 credits",
    credits: 200_000,
    priceCents: envInt("PACK_200K_PRICE_CENTS", 12900),
    stripePriceId: process.env.STRIPE_PRICE_PACK_200K,
  },
];

export function planFor(priceId: string | undefined | null): PlanId | null {
  if (!priceId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) return plan.id;
  }
  return null;
}

export function packFor(priceId: string | undefined | null): CreditPack | null {
  if (!priceId) return null;
  return CREDIT_PACKS.find((p) => p.stripePriceId === priceId) ?? null;
}

export function planOrFree(plan: string | undefined | null): PlanDef {
  const id = (plan ?? "FREE").toUpperCase() as PlanId;
  return PLANS[id] ?? PLANS.FREE;
}
