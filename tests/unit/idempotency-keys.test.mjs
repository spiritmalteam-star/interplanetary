import test from "node:test";
import assert from "node:assert/strict";
import {
  refundClaimId, spendClaimId, parseIdempotencyKey, isUniqueViolation,
  REFUND_CLAIM_TYPE, SPEND_CLAIM_TYPE, SPEND_CLAIM_TTL_MS,
} from "../../src/lib/server/idempotency-keys.ts";

test("one refund claim per spend row, stable", () => {
  assert.equal(refundClaimId("abc"), "refund:abc");
  assert.equal(refundClaimId("abc"), refundClaimId("abc"));
  assert.notEqual(refundClaimId("abc"), refundClaimId("abd"));
});

test("spend claims are scoped to the user", () => {
  assert.notEqual(spendClaimId("u1", "key-12345678"), spendClaimId("u2", "key-12345678"));
});

test("idempotency keys accept short safe tokens only", () => {
  assert.equal(parseIdempotencyKey("  req_1234-abcd "), "req_1234-abcd");
  for (const bad of ["short", "x".repeat(65), "has space 12345", "semi;colon12", "", null, undefined, "a:b:c:d:e:f"]) {
    assert.equal(parseIdempotencyKey(bad), null, String(bad));
  }
});

test("a key cannot forge another user's claim id", () => {
  // ':' is not allowed in keys, so "u2:key" cannot be smuggled inside a key
  assert.equal(parseIdempotencyKey("u2:key-1234567"), null);
});

test("only a Prisma P2002 counts as a duplicate", () => {
  assert.equal(isUniqueViolation({ code: "P2002" }), true);
  assert.equal(isUniqueViolation({ code: "P2025" }), false);
  assert.equal(isUniqueViolation(new Error("x")), false);
  assert.equal(isUniqueViolation(null), false);
});

test("constants are distinct and the sweep window is sane", () => {
  assert.notEqual(REFUND_CLAIM_TYPE, SPEND_CLAIM_TYPE);
  assert.ok(SPEND_CLAIM_TTL_MS >= 24 * 3600 * 1000);
});
