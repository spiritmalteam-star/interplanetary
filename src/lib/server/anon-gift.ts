import { db } from "@/lib/db";
import { anonBirthsPerIpPerDay, giftForBirth, hashIp } from "@/lib/server/birth-gift-rules";

/* ------------------------------------------------------------------ */
/*  THE BIRTH-GIFT BRAKE — one anonymous cookie is cheap to mint, so   */
/*  the free lights an anonymous passage is born with are capped per   */
/*  network address per day. Past the cap a passage is born with an    */
/*  empty purse and is asked to sign in at its first paid act (every   */
/*  legitimate visitor keeps the free exploration the house offers).   */
/*                                                                     */
/*  Records are kept in the existing SystemEvent log (no schema        */
/*  change): the address is stored only as a salted one-way hash.      */
/* ------------------------------------------------------------------ */

const EVENT_TYPE = "wallet.anon_birth";
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * The gift a NEW anonymous wallet should be born with, or `undefined`
 * when this passage already has a wallet (nothing to decide).
 * Throws when the database cannot answer — the caller fails closed and
 * must NOT create a wallet on a guess.
 */
export async function anonBirthGift(
  userId: string,
  ip: string,
  fullGift: number
): Promise<number | undefined> {
  const existing = await db.userWallet.findUnique({ where: { userId } });
  if (existing) return undefined;

  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - WINDOW_MS);
  const births = await db.systemEvent.count({
    where: {
      type: EVENT_TYPE,
      createdAt: { gte: since },
      payload: { contains: `"ipHash":"${ipHash}"` },
    },
  });
  const gift = giftForBirth(births, anonBirthsPerIpPerDay(), fullGift);

  /* the record of this birth (idempotent by event id) */
  await db.systemEvent.upsert({
    where: { eventId: `anon-birth:${userId}` },
    update: {},
    create: {
      eventId: `anon-birth:${userId}`,
      type: EVENT_TYPE,
      actorType: "system",
      actorId: userId,
      source: "wallet",
      payload: JSON.stringify({ ipHash, gift }),
      /* bookkeeping, not a message: born delivered (see events.ts) */
      deliveredAt: new Date(),
    },
  });
  return gift;
}
