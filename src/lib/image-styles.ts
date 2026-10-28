/* ------------------------------------------------------------------ */
/*  THE IMAGE STYLES — the visitor's own palette of looks, chosen      */
/*  through the "/" hand in any composer that paints. The chosen style */
/*  rides with every crystallization and sketches the look of the      */
/*  vision before the brushes move.                                    */
/* ------------------------------------------------------------------ */

export type ImageStyleOption = {
  /** the style's name as it travels to the atelier */
  value: string;
  /** one small hint shown in the picker */
  hint: string;
};

export const IMAGE_STYLES: ImageStyleOption[] = [
  { value: "Ethereal dream", hint: "soft light, weightless air" },
  { value: "Cosmic nebula", hint: "deep space, starlight veils" },
  { value: "Bioluminescent", hint: "living glow, night gardens" },
  { value: "Crystalline", hint: "glass geometry, prismatic edges" },
  { value: "Ancient fresco", hint: "aged plaster, sacred walls" },
  { value: "Golden baroque", hint: "ornate shadow, candle gold" },
  { value: "Watercolor wash", hint: "loose pigment, paper breath" },
  { value: "Oil painting", hint: "thick brushwork, museum depth" },
  { value: "Cinematic film", hint: "anamorphic light, quiet grain" },
  { value: "Retro anime", hint: "hand-drawn cells, bold skies" },
  { value: "Ink line art", hint: "black line, white silence" },
  { value: "Vaporwave neon", hint: "electric dusk, chrome haze" },
];

/** True when the draft's leading word opens the style picker ("…" —
    the bare slash, or "/eth" mid-thought). */
export function isStyleSlashQuery(draft: string): boolean {
  return /^\s*\/[\w-]*$/.test(draft);
}

/** The style names filtered by what the visitor already typed after
    the slash ("", "eth" → [Ethereal dream]). */
export function filterStyles(query: string): ImageStyleOption[] {
  const q = query.replace(/^\//, "").trim().toLowerCase();
  if (!q) return IMAGE_STYLES;
  return IMAGE_STYLES.filter((s) =>
    s.value.toLowerCase().includes(q)
  );
}
