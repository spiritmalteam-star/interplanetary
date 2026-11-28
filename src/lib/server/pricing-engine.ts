/* ------------------------------------------------------------------ */
/*  THE INTELLIGENCE ECONOMICS ENGINE — pure arithmetic, no I/O.       */
/*  Markup, margin and profit are three different things and never     */
/*  share a name here:                                                 */
/*    markup % = (price - cost) / cost                                 */
/*    gross margin % = (price - cost) / price                          */
/*    contribution = price - cost - payment fees - other attributable  */
/*  Revenue is never called profit. Money is integer micro-dollars     */
/*  (1e-6 USD) so token-priced costs never drift in floating point.    */
/* ------------------------------------------------------------------ */

export type PricingMode =
  | "multiplier"      // price = cost × m (default 2.0)
  | "target_margin"   // price = cost / (1 - margin)
  | "fixed_price"     // price is the founder's own number
  | "min_profit";     // multiplier, but never less than cost + floor

export interface PricingRule {
  mode: PricingMode;
  multiplier?: number;      // multiplier / min_profit
  targetMargin?: number;    // 0..0.95  (target_margin)
  fixedPriceMicro?: number; // fixed_price
  minProfitMicro?: number;  // min_profit
}

export const DEFAULT_RULE: PricingRule = { mode: "multiplier", multiplier: 2 };
export const MICRO = 1_000_000;

export interface FeeModel {
  /** percentage of the customer price, e.g. 0.029 */
  percent: number;
  /** fixed fee per charge in micro-dollars, e.g. 0.30 USD = 300000 */
  fixedMicro: number;
}

export interface Quote {
  costMicro: number;
  priceMicro: number;
  feeMicro: number;
  grossProfitMicro: number;      // price - cost
  contributionMicro: number;     // price - cost - fees
  markupPct: number | null;      // null when cost is 0
  grossMarginPct: number | null; // null when price is 0
  belowMinMargin: boolean;
}

const round = (n: number) => Math.round(n);

export function priceFor(costMicro: number, rule: PricingRule = DEFAULT_RULE): number {
  const cost = Math.max(0, round(costMicro));
  switch (rule.mode) {
    case "fixed_price":
      return Math.max(0, round(rule.fixedPriceMicro ?? 0));
    case "target_margin": {
      const m = Math.min(0.95, Math.max(0, rule.targetMargin ?? 0.5));
      return round(cost / (1 - m));
    }
    case "min_profit": {
      const byMultiplier = round(cost * Math.max(1, rule.multiplier ?? 2));
      return Math.max(byMultiplier, cost + Math.max(0, round(rule.minProfitMicro ?? 0)));
    }
    case "multiplier":
    default:
      return round(cost * Math.max(0, rule.multiplier ?? 2));
  }
}

export function quote(
  costMicro: number,
  rule: PricingRule = DEFAULT_RULE,
  fees: FeeModel = { percent: 0, fixedMicro: 0 },
  minMarginPct = 0
): Quote {
  const cost = Math.max(0, round(costMicro));
  const price = priceFor(cost, rule);
  const fee = price > 0 ? round(price * fees.percent + fees.fixedMicro) : 0;
  const gross = price - cost;
  const markup = cost > 0 ? (gross / cost) * 100 : null;
  const margin = price > 0 ? (gross / price) * 100 : null;
  return {
    costMicro: cost,
    priceMicro: price,
    feeMicro: fee,
    grossProfitMicro: gross,
    contributionMicro: gross - fee,
    markupPct: markup === null ? null : Math.round(markup * 100) / 100,
    grossMarginPct: margin === null ? null : Math.round(margin * 100) / 100,
    belowMinMargin: margin !== null && margin < minMarginPct,
  };
}

/** Token-priced provider cost. Prices are micro-dollars per 1M tokens. */
export function tokenCostMicro(
  u: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number },
  p: { inputPerM: number; outputPerM: number; cachedInputPerM?: number }
): number {
  const input = Math.max(0, u.inputTokens ?? 0);
  const cached = Math.min(input, Math.max(0, u.cachedInputTokens ?? 0));
  const fresh = input - cached;
  return round(
    (fresh * p.inputPerM + cached * (p.cachedInputPerM ?? p.inputPerM) + Math.max(0, u.outputTokens ?? 0) * p.outputPerM) / 1_000_000
  );
}

/** What a price change would do to margin, BEFORE anyone publishes it. */
export function simulateChange(
  costMicro: number,
  current: PricingRule,
  next: PricingRule,
  fees?: FeeModel
) {
  const a = quote(costMicro, current, fees);
  const b = quote(costMicro, next, fees);
  return { current: a, next: b, priceDeltaMicro: b.priceMicro - a.priceMicro, contributionDeltaMicro: b.contributionMicro - a.contributionMicro };
}
