/* ------------------------------------------------------------------ */
/*  STAR PLAY — the Mirror's majestic arcana deck (1,443 cards).       */
/*  The full deck lives in star-play-deck.ts (37 constellations × 39   */
/*  movements, with the 24 handcrafted elder arcana folded in).        */
/*  Every card carries its own AI impression (derived, seeded per      */
/*  card). Card text is oracle data (like the OS formulas) — the AI    */
/*  reading is composed in the visitor's language by /api/star-play.   */
/* ------------------------------------------------------------------ */

import { starPlayDeck, type ArcanaCard } from "./star-play-deck";

export type { ArcanaCard };

/** The complete majestic deck — exactly 1,443 arcana (666 + 777). */
export const arcanaDeck = starPlayDeck;

export const arcanaTotal = arcanaDeck.length; // 1,443

/** The three positions of the majestic spread (i18n keys). */
export const spreadPositions = [
  "What is",
  "What is hidden",
  "What is emerging",
] as const;

/** Draw n distinct cards from the deck (uniform shuffle). */
export function drawArcana(n: number): ArcanaCard[] {
  const pool = [...arcanaDeck];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
