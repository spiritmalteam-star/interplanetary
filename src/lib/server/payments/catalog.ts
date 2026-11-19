import { WALLET_PACKS, WALLET_PLANS } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  THE SHOP — the one catalog both the Purse and the checkout read.   */
/*  Membership passes and coin packs, priced in one place; the sku     */
/*  is the whole contract between the browser and the ledger.          */
/* ------------------------------------------------------------------ */

export interface CatalogMembership {
  sku: string;
  planId: string;
  label: string;
  priceCents: number;
  currency: string;
  monthlyCredits: number;
  note: string;
}

export interface CatalogCoins {
  sku: string;
  label: string;
  coins: number;
  priceCents: number;
  currency: string;
  note: string;
}

export interface ShopCatalog {
  memberships: CatalogMembership[];
  coins: CatalogCoins[];
}

export function shopCatalog(): ShopCatalog {
  return {
    memberships: [
      {
        sku: "membership_SEEKER",
        planId: WALLET_PLANS.SEEKER.id,
        label: WALLET_PLANS.SEEKER.label,
        priceCents: WALLET_PLANS.SEEKER.priceCents,
        currency: "eur",
        monthlyCredits: WALLET_PLANS.SEEKER.monthlyCredits,
        note: "A monthly allowance of light — every passage's coin purse refilled each period.",
      },
      {
        sku: "membership_OBSERVATORY_PRO",
        planId: WALLET_PLANS.OBSERVATORY_PRO.id,
        label: WALLET_PLANS.OBSERVATORY_PRO.label,
        priceCents: WALLET_PLANS.OBSERVATORY_PRO.priceCents,
        currency: "eur",
        monthlyCredits: WALLET_PLANS.OBSERVATORY_PRO.monthlyCredits,
        note: "The pro passage — the deeper allowance, HyperX's own door included.",
      },
    ],
    coins: WALLET_PACKS.map((pack) => ({
      sku: pack.id,
      label: pack.label,
      coins: pack.credits,
      priceCents: pack.priceCents,
      currency: pack.currency,
      note: pack.note,
    })),
  };
}

export interface ResolvedSku {
  kind: "membership" | "coins";
  amountCents: number;
  currency: string;
  coinsCredited: number;
  planId: string | null;
  label: string;
}

/** The sku's own truth — the checkout never trusts the browser's price. */
export function resolveSku(sku: string): ResolvedSku | null {
  const catalog = shopCatalog();

  const membership = catalog.memberships.find(
    (m) => m.sku === sku || m.planId.toLowerCase() === sku.toLowerCase()
  );
  if (membership) {
    return {
      kind: "membership",
      amountCents: membership.priceCents,
      currency: membership.currency,
      coinsCredited: 0,
      planId: membership.planId,
      label: `${membership.label} membership`,
    };
  }

  const pack = catalog.coins.find((c) => c.sku === sku);
  if (pack) {
    return {
      kind: "coins",
      amountCents: pack.priceCents,
      currency: pack.currency,
      coinsCredited: pack.coins,
      planId: null,
      label: pack.label,
    };
  }

  /* the loose coin naming — coins_<n> resolves to the pack carrying n
     lights when one exists, so old links never die */
  if (sku.startsWith("coins_")) {
    const n = Number.parseInt(sku.slice(6), 10);
    const match = catalog.coins.find((c) => c.coins === n);
    if (match) return resolveSku(match.sku);
  }

  return null;
}
