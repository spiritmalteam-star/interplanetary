import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/* ------------------------------------------------------------------ */
/*  THE KEY FORGE — one shape, one truth for every API key.            */
/*  `mir_live_<43 base62>` — the register keeps only a scrypt hash     */
/*  and a visible prefix; the full secret is seen exactly once.        */
/* ------------------------------------------------------------------ */

export const KEY_PREFIX = "mir_live_";
/** The visible prefix length stored and looked up (prefix + 6 chars). */
export const KEY_PREFIX_LEN = KEY_PREFIX.length + 6;

export function newRawKey(): string {
  return `${KEY_PREFIX}${randomBytes(24).toString("base64url")}`;
}

export function hashKey(raw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(raw, salt, 32).toString("hex");
  return `k1:${salt}:${hash}`;
}

export function keyMatches(raw: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "k1" || !salt || !hash) return false;
  const candidate = scryptSync(raw, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
