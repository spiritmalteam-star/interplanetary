import test from "node:test";
import assert from "node:assert/strict";
import { giftForBirth, hashIp, anonBirthsPerIpPerDay } from "../../src/lib/server/birth-gift-rules.ts";

test("full gift while under the per-IP daily cap", () => {
  assert.equal(giftForBirth(0, 10, 500), 500);
  assert.equal(giftForBirth(9, 10, 500), 500);
});

test("empty purse once the cap is reached or exceeded", () => {
  assert.equal(giftForBirth(10, 10, 500), 0);
  assert.equal(giftForBirth(99, 10, 500), 0);
});

test("a cap of 0 disables the anonymous gift entirely", () => {
  assert.equal(giftForBirth(0, 0, 500), 0);
});

test("the IP is stored only as a stable, non-reversible, salted hash", () => {
  const a = hashIp("203.0.113.7");
  assert.equal(a, hashIp("203.0.113.7"));
  assert.notEqual(a, hashIp("203.0.113.8"));
  assert.match(a, /^[0-9a-f]{24}$/);
  assert.ok(!a.includes("203"));
});

test("cap defaults to 10 and honours a valid env value, ignoring junk", () => {
  const prev = process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY;
  delete process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY;
  assert.equal(anonBirthsPerIpPerDay(), 10);
  process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY = "3";
  assert.equal(anonBirthsPerIpPerDay(), 3);
  process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY = "-4";
  assert.equal(anonBirthsPerIpPerDay(), 10);
  process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY = "abc";
  assert.equal(anonBirthsPerIpPerDay(), 10);
  if (prev === undefined) delete process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY; else process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY = prev;
});
