import test from "node:test";
import assert from "node:assert/strict";
import { classifyAiError } from "../../src/lib/server/ai-errors.ts";

test("provider statuses map to stable codes", () => {
  assert.equal(classifyAiError(new Error("Z.ai chat 429: {\"error\":{\"code\":\"1302\"}}")).code, "AI_RATE_LIMITED");
  assert.equal(classifyAiError(new Error("Z.ai chat 401: bad key")).code, "AI_AUTH");
  assert.equal(classifyAiError(new Error("Z.ai chat 503: down")).code, "AI_UNAVAILABLE");
  assert.equal(classifyAiError(new Error("Z.ai chat 400: bad param")).code, "AI_BAD_RESPONSE");
  assert.equal(classifyAiError(new Error("No AI provider is configured on this deployment.")).code, "AI_NOT_CONFIGURED");
  assert.equal(classifyAiError(new Error("insufficient balance 1113")).code, "AI_QUOTA");
  const t = new Error("x"); t.name = "TimeoutError";
  assert.equal(classifyAiError(t).code, "AI_TIMEOUT");
  assert.equal(classifyAiError(new TypeError("Cannot read properties of undefined")).code, "AI_INTERNAL");
});

test("never leaks the provider body", () => {
  const f = classifyAiError(new Error("Z.ai chat 401: sk-SECRET-KEY-VALUE"));
  assert.equal(JSON.stringify(f).includes("SECRET"), false);
  assert.equal(f.upstreamStatus, 401);
});
