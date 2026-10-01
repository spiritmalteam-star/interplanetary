/* ------------------------------------------------------------------ */
/*  Mystic card auras                                                  */
/*  Every channeling card is bathed in one of these softly glowing     */
/*  palettes, drawn in silence — the way an old deck never repeats     */
/*  the same light twice. The colors stay inside the laboratory's      */
/*  desaturated, atmospheric register in both themes.                  */
/* ------------------------------------------------------------------ */

export interface Aura {
  id: string;
  /** Primary tone — borders, corner marks, sparkles. */
  a: string;
  /** Companion tone — gradients and secondary glows. */
  b: string;
}

/** The classic white page draws no color: every card wears the same
    clean neutral ink (the light-mode voice of every aura). */
export const INK_AURA: Aura = { id: "ink", a: "#2b2b30", b: "#6b6b74" };

export const AURAS: Aura[] = [
  { id: "rose-quartz", a: "#c26a8d", b: "#b06a9e" },
  { id: "amber-veil", a: "#b98a3e", b: "#b06a44" },
  { id: "jade-whisper", a: "#3e9a7a", b: "#6fa06a" },
  { id: "violet-mist", a: "#8d6bb8", b: "#a86ab8" },
  { id: "teal-ember", a: "#3a9a9e", b: "#9a7a4a" },
  { id: "magenta-dawn", a: "#b85a92", b: "#8a6ac2" },
  { id: "moss-gold", a: "#7a9a4a", b: "#b8923e" },
  { id: "coral-moon", a: "#c97a6a", b: "#9a6ab0" },
  { id: "orchid-dusk", a: "#a86aa8", b: "#c28a5a" },
  { id: "fern-candle", a: "#5a9a8a", b: "#b87a6a" },
  { id: "plum-ember", a: "#9a5a78", b: "#8a9a5a" },
  { id: "saffron-sea", a: "#b8894a", b: "#4a9a8a" },
];

/** FNV-1a — deterministic, so a card keeps its aura across re-renders. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The aura drawn for a given seed (message id, query, …). */
export function auraFor(seed: string): Aura {
  return AURAS[hashString(seed) % AURAS.length];
}
