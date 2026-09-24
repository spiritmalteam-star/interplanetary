/* ------------------------------------------------------------------ */
/*  Deterministic hashing — 32-bit FNV-1a.                             */
/*  The registers use this wherever stable "randomness" is needed:     */
/*  the same input always draws the same card, the same light.         */
/* ------------------------------------------------------------------ */

/** 32-bit FNV-1a — offset 2166136261, prime 16777619, unsigned. */
export function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
