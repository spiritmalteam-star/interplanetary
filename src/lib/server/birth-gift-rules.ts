import { createHash } from "node:crypto";

/* Pure rules for the anonymous birth-gift brake (no database access,
   so they are unit-testable). The brake itself lives in anon-gift.ts. */

export function anonBirthsPerIpPerDay(): number {
  const raw = Number(process.env.ANON_BIRTH_GIFTS_PER_IP_PER_DAY);
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 10;
}

export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET || "reflectme-anon-birth";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 24);
}

/** Pure: how many free lights a new anonymous passage may be born with. */
export function giftForBirth(birthsFromThisIpToday: number, cap: number, fullGift: number): number {
  return birthsFromThisIpToday < cap ? fullGift : 0;
}
