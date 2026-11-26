import test from "node:test";
import assert from "node:assert/strict";
import { isModelRungRefusal, steadyRungFor, isResting } from "../../src/lib/server/model-ladder.ts";

test("model-side refusals climb down a rung", () => {
  assert.equal(isModelRungRefusal("Z.ai chat 402: payment required"), true);
  assert.equal(isModelRungRefusal("Z.ai stream 429: rate limit"), true);
  assert.equal(isModelRungRefusal("Z.ai chat 403: forbidden"), true);
  assert.equal(isModelRungRefusal("Z.ai chat 404: model not found"), true);
  assert.equal(isModelRungRefusal('Z.ai chat 400: {"error":{"code":"1113"}}'), true);
  assert.equal(isModelRungRefusal("Z.ai chat 400: Insufficient balance"), true);
});

test("request-side failures do not (a bad prompt fails on both rungs)", () => {
  assert.equal(isModelRungRefusal("Z.ai chat 400: invalid messages"), false);
  assert.equal(isModelRungRefusal("Z.ai chat 500: internal"), false);
  assert.equal(isModelRungRefusal("fetch failed"), false);
});

test("steady rung: default, override, off, and same-as-primary", () => {
  assert.equal(steadyRungFor("glm-4.6", undefined), "glm-4.5-flash");
  assert.equal(steadyRungFor("glm-4.6", "glm-4.5-air"), "glm-4.5-air");
  assert.equal(steadyRungFor("glm-4.6", "none"), undefined);
  assert.equal(steadyRungFor("glm-4.5-flash", undefined), undefined);
});

test("a refused rung rests, then is tried again", () => {
  const m = new Map([["glm-4.6", 1000]]);
  assert.equal(isResting(m, "glm-4.6", 500), true);
  assert.equal(isResting(m, "glm-4.6", 1000), false);
  assert.equal(m.has("glm-4.6"), false);
});
