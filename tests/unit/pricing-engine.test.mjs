import test from "node:test";
import assert from "node:assert/strict";
import { quote, priceFor, tokenCostMicro, simulateChange, MICRO } from "../../src/lib/server/pricing-engine.ts";

test("default 2.0x: 100% markup = 50% margin (never confused)", () => {
  const q = quote(4 * MICRO);
  assert.equal(q.priceMicro, 8 * MICRO);
  assert.equal(q.markupPct, 100);
  assert.equal(q.grossMarginPct, 50);
  assert.equal(q.grossProfitMicro, 4 * MICRO);
});
test("1.5x is 50% markup but 33.33% margin", () => {
  const q = quote(4 * MICRO, { mode: "multiplier", multiplier: 1.5 });
  assert.equal(q.priceMicro, 6 * MICRO);
  assert.equal(q.markupPct, 50);
  assert.equal(q.grossMarginPct, 33.33);
});
test("target margin 60% prices at cost/(1-0.6)", () => {
  assert.equal(priceFor(2 * MICRO, { mode: "target_margin", targetMargin: 0.6 }), 5 * MICRO);
});
test("min_profit floors a tiny multiplier", () => {
  const p = priceFor(100, { mode: "min_profit", multiplier: 2, minProfitMicro: 5000 });
  assert.equal(p, 5100);
});
test("fees reduce contribution, not gross profit", () => {
  const q = quote(1 * MICRO, { mode: "multiplier", multiplier: 2 }, { percent: 0.029, fixedMicro: 300000 });
  assert.equal(q.grossProfitMicro, 1 * MICRO);
  assert.equal(q.feeMicro, Math.round(2 * MICRO * 0.029 + 300000));
  assert.equal(q.contributionMicro, q.grossProfitMicro - q.feeMicro);
});
test("zero cost / zero price never divide by zero", () => {
  assert.equal(quote(0).markupPct, null);
  assert.equal(quote(5, { mode: "fixed_price", fixedPriceMicro: 0 }).grossMarginPct, null);
});
test("token cost separates input, cached input and output", () => {
  const c = tokenCostMicro({ inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 500_000 }, { inputPerM: 600_000, cachedInputPerM: 110_000, outputPerM: 2_200_000 });
  assert.equal(c, 600_000 * 0.6 + 110_000 * 0.4 + 2_200_000 * 0.5);
});
test("simulation shows the delta before publishing", () => {
  const s = simulateChange(10 * MICRO, { mode: "multiplier", multiplier: 2 }, { mode: "multiplier", multiplier: 2.3 });
  assert.equal(s.priceDeltaMicro, 3 * MICRO);
});
test("min margin flag", () => {
  assert.equal(quote(10, { mode: "multiplier", multiplier: 1.2 }, undefined, 25).belowMinMargin, true);
});
