import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { limiterTypeFor, shouldPurge, MAX_WINDOW_MS, PURGE_AFTER_MS } from "../../src/lib/server/rate-limit-rules.ts";

const h = (s) => createHash("sha256").update(s).digest("hex").slice(0, 20);

test("bucket type is stable, bounded and never contains the raw key", () => {
  const t = limiterTypeFor("door-mirror-entity-ip", "203.0.113.9", h);
  assert.equal(t, limiterTypeFor("door-mirror-entity-ip", "203.0.113.9", h));
  assert.ok(t.startsWith("rl:door-mirror-entity-ip:"));
  assert.ok(!t.includes("203.0.113.9"));
  assert.ok(t.length <= 80);
});

test("different keys and different doors never share a bucket", () => {
  assert.notEqual(limiterTypeFor("a", "k1", h), limiterTypeFor("a", "k2", h));
  assert.notEqual(limiterTypeFor("a", "k1", h), limiterTypeFor("b", "k1", h));
});

test("hostile bucket names are sanitised and length-capped", () => {
  const t = limiterTypeFor("x:y/../ z" + "q".repeat(100), "k", h);
  assert.match(t, /^rl:[a-z0-9._-]{1,40}:[0-9a-f]{20}$/i);
});

test("purge horizon outlives the longest supported window", () => {
  assert.ok(PURGE_AFTER_MS > MAX_WINDOW_MS);
});

test("purge runs on roughly 2% of calls", () => {
  assert.equal(shouldPurge(0.0), true);
  assert.equal(shouldPurge(0.5), false);
  let n = 0; for (let i = 0; i < 100000; i++) if (shouldPurge(Math.random())) n++;
  assert.ok(n > 1200 && n < 2800, `got ${n}`);
});
