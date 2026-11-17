/* ================================================================== */
/*  THE ENERGY'S OWN NAME — when the sky's light runs low, the doors   */
/*  say so plainly instead of mumbling a generic storm.                */
/*                                                                     */
/*  The provider bridge (zai-client) already spends every patient      */
/*  retry on transient storms and hands the words to a second sky      */
/*  when one quota burns out. But when EVERY sky's light is spent      */
/*  (or the purse's own weigh answers 402), the error that rises is    */
/*  a word about ENERGY — and it deserves to reach the visitor as a    */
/*  gentle notice, never as mute static.                               */
/* ================================================================== */

/** The notice the visitor reads when the mirror cannot answer
    because its energy ran out momentarily. */
export const ENERGY_NOTICE =
  "The mirror's energy ran out momentarily — it will speak again once the light returns.";

/** The machine word riding beside the notice (the client listens
    for it and raises its own gentle hand). */
export const ENERGY_CODE = "energy_exhausted";

/** The words the skies use when their light is spent — gateway code
    1113 ("insufficient balance"), the resource package spent, the
    recharge plea, the quota wall, the meter's own purse word. */
export function isEnergyError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /1113|insufficient balance|no resource package|recharge|arrears|quota|insufficient_credits|energy_exhausted/i.test(
    msg
  );
}
