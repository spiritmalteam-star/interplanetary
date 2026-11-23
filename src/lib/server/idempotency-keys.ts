/* Pure helpers (no imports, no database) for the wallet's idempotency
   claims, so they can be unit-tested. A claim is one SystemEvent row whose
   UNIQUE `eventId` is the claim: the first writer wins, any second writer
   gets a unique-violation (Prisma P2002) and knows it is a duplicate. */

export const REFUND_CLAIM_TYPE = "wallet.refund_claim";
export const SPEND_CLAIM_TYPE = "wallet.idem";
/** spend claims older than this are swept (a retry window, not a ledger) */
export const SPEND_CLAIM_TTL_MS = 48 * 60 * 60 * 1000;

/** One refund per spend row, ever. */
export function refundClaimId(ledgerId: string): string {
  return `refund:${ledgerId}`;
}

/** A visitor-chosen key is trusted only as a short token. */
export function parseIdempotencyKey(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(key) ? key : null;
}

/** Scoped to the user, so one visitor's key can never collide with, or
    block, another's. */
export function spendClaimId(userId: string, key: string): string {
  return `idem:${userId}:${key}`;
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}
