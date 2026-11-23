import test from "node:test";
import assert from "node:assert/strict";
import { packOwned, unpackOwned, boundedJson, OWNER_KEY } from "../../src/lib/server/owned-json.ts";

test("object keeps its shape and gains the owner", () => {
  const text = packOwned({ topic: "dna", n: 3 }, "u1");
  assert.deepEqual(unpackOwned(text), { value: { topic: "dna", n: 3 }, owner: "u1" });
});

test("non-object input is wrapped and unwrapped exactly", () => {
  for (const v of ["hello", 7, [1, 2], null]) {
    assert.deepEqual(unpackOwned(packOwned(v, "u1")), { value: v, owner: "u1" });
  }
});

test("a client-supplied __owner key cannot override the real owner", () => {
  const text = packOwned({ [OWNER_KEY]: "victim", x: 1 }, "attacker");
  assert.equal(unpackOwned(text).owner, "attacker");
});

test("a nested __owner key does not count as the row's owner", () => {
  const text = packOwned({ nested: { [OWNER_KEY]: "victim" } }, "me");
  assert.equal(unpackOwned(text).owner, "me");
});

test("legacy rows (no owner) and garbage have no owner", () => {
  assert.equal(unpackOwned('{"topic":"x"}').owner, null);
  assert.equal(unpackOwned("not json").owner, null);
  assert.equal(unpackOwned(null).owner, null);
  assert.equal(unpackOwned("[1,2]").owner, null);
});

test("owner key never leaks into the presented value", () => {
  const { value } = unpackOwned(packOwned({ a: 1 }, "u1"));
  assert.equal(Object.prototype.hasOwnProperty.call(value, OWNER_KEY), false);
});

test("boundedJson enforces the size ceiling", () => {
  assert.equal(boundedJson({ a: "x".repeat(50) }, 20), null);
  assert.ok(boundedJson({ a: 1 }, 20));
  const cyc = {}; cyc.self = cyc;
  assert.equal(boundedJson(cyc, 1000), null);
});

test("the contains() prefilter needle matches only the exact top-level owner format", () => {
  const needle = `"${OWNER_KEY}":"u1"`;
  assert.ok(packOwned({ a: 1 }, "u1").includes(needle));
  assert.ok(!packOwned({ a: 1 }, "u10").includes(needle));
});
