/*  THE STEADY SECRET — carved once, read forever.
 *
 *  The session cookie is signed with a secret. When that secret changes,
 *  every signed passage in every browser turns unreadable and the house
 *  asks its visitors to sign in again — the very complaint this file ends.
 *
 *  The law:
 *    1. If the environment vault already carries AUTH_SECRET (or
 *       NEXTAUTH_SECRET), it wins — nothing is read, nothing is written.
 *    2. Otherwise the vault row `auth_secret` in PlatformConfig is read.
 *    3. If even the vault is empty, a strong secret is minted ONCE and
 *       carved into PlatformConfig — every instance, every cold sleep,
 *       every future boot reads the same one.
 *    4. The secret is injected into process.env.AUTH_SECRET before any
 *       route signs or reads a cookie (access.ts reads it lazily per call,
 *       so ordering is safe either way).
 *
 *  Everything here is best-effort: if the database cannot be reached the
 *  boot proceeds exactly as before and access.ts falls back on its own.
 */

export async function register(): Promise<void> {
  try {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    /* the keeper's binding: the ADMIN_EMAIL env carves the ADMIN role
       onto its user row, once, so the platform's hands are bound in the
       database — never to a request's own claim. Runs on every boot,
       before the secret's own early bow-out. */
    const { ensureAdminBinding } = await import("@/lib/server/access");
    await ensureAdminBinding();

    /* THE GREAT BIRTH GIFT — one carve, one time: the passage's
       birthright rose from five lights to five hundred, and every
       wallet still holding less is lifted to the new floor at boot.
       Guarded by its own vault key so it runs exactly once per
       database — in this vessel and in every cold sleep after it.
       Best-effort: a closed vault delays the gift, never the boot. */
    try {
      const { db: bootDb } = await import("@/lib/db");
      const GIFT_KEY = "wallet_birth_gift_500_applied";
      const GIFT_FLOOR = 500;
      const giftDone = await bootDb.platformConfig.findUnique({
        where: { key: GIFT_KEY },
      });
      if (!giftDone) {
        const poor = await bootDb.userWallet.findMany({
          where: { freeCreditsRemaining: { lt: GIFT_FLOOR } },
          select: { userId: true, freeCreditsRemaining: true },
        });
        for (const w of poor) {
          await bootDb.userWallet.update({
            where: { userId: w.userId },
            data: { freeCreditsRemaining: GIFT_FLOOR },
          });
          await bootDb.creditLedger.create({
            data: {
              userId: w.userId,
              actionType: "PROMOTIONAL_GRANT",
              creditsDeducted: GIFT_FLOOR - w.freeCreditsRemaining,
              metadata: {
                source: "birth-gift-500",
                description:
                  "The great birth gift — the purse lifted to its five hundred",
              },
            },
          });
        }
        await bootDb.platformConfig.create({
          data: {
            key: GIFT_KEY,
            value: { lifted: poor.length, floor: GIFT_FLOOR },
            updatedBy: "instrumentation:boot",
          },
        });
        console.info(
          `[instrumentation] the great birth gift: ${poor.length} purse(s) lifted to ${GIFT_FLOOR} lights.`
        );
      }
    } catch (giftError) {
      console.warn(
        "[instrumentation] the birth gift waited — the vault was not reachable:",
        giftError instanceof Error ? giftError.message : giftError
      );
    }

    const existing =
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
    if (existing.length >= 16) return; // the vault already speaks — bow out

    const { db } = await import("@/lib/db");
    const { randomBytes } = await import("node:crypto");

    const KEY = "auth_secret";
    const row = await db.platformConfig.findUnique({ where: { key: KEY } });
    let secret =
      row && typeof row.value === "object" && row.value !== null && "secret" in row.value
        ? String((row.value as { secret: unknown }).secret)
        : "";

    if (!secret || secret.length < 16) {
      secret = randomBytes(32).toString("hex");
      await db.platformConfig.upsert({
        where: { key: KEY },
        update: {}, // never rotate an existing row on a race — first carve wins
        create: {
          key: KEY,
          value: { secret },
          updatedBy: "instrumentation:boot",
        },
      });
      console.info(
        "[instrumentation] a steady AUTH_SECRET was carved into PlatformConfig — passages now survive every cold sleep."
      );
    }

    process.env.AUTH_SECRET = secret;
  } catch (error) {
    /* the boot never breaks on the secret's account — access.ts keeps
       its own fallback and the warning it already carries */
    console.warn(
      "[instrumentation] the steady secret could not be secured this boot:",
      error instanceof Error ? error.message : error
    );
  }
}
