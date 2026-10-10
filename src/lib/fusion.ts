import { fusionFields } from "@/lib/data/science";

/**
 * Fusion color helpers — the mixed disciplines each carry their own light;
 * the blend is the visible fusion of the mix (green+violet, blue+red…).
 */

export function fusionColorsOf(ids: string[]): string[] {
  return ids
    .map((id) => fusionFields.find((f) => f.id === id)?.color)
    .filter((c): c is string => Boolean(c));
}

/** Gradient of the mix — or a single color when one discipline is fused. */
export function fusionGradientOf(ids: string[]): string | null {
  const colors = fusionColorsOf(ids);
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];
  return `linear-gradient(120deg, ${colors.join(", ")})`;
}

/** A soft ambient glow string built from the mix (for shadows). */
export function fusionGlowOf(ids: string[]): string | null {
  const colors = fusionColorsOf(ids);
  if (colors.length === 0) return null;
  const inner = colors.slice(0, 3).join(", ");
  return `0 0 70px -18px color-mix(in srgb, ${inner} 55%, transparent)`;
}
