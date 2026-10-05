/* ------------------------------------------------------------------ */
/*  THE WALKER'S DEPTH — how the DNA of the walk feeds the channeling. */
/*                                                                     */
/*  The DNA evolutionary timeline (learning-branches.ts) keeps the     */
/*  quiet map of every step a visitor takes through the laboratory.    */
/*  As the walk deepens, the laboratory deepens with it: the branches  */
/*  grown at a reply's foot and the channels themselves reach further  */
/*  down — no more first doors for a walker who has walked far.        */
/*  Five tiers, from a fresh arrival to the deep roots.                */
/* ------------------------------------------------------------------ */

export interface WalkerDepth {
  /** How many crossings the walk currently holds (capped walk log). */
  steps: number;
  /** 0–4 — the tier the walk has reached. */
  tier: number;
}

export const WALKER_TIER_NAMES = [
  "first light",
  "the deepening",
  "the braided walk",
  "the canopy",
  "the deep roots",
] as const;

export function tierForSteps(steps: number): number {
  if (steps >= 60) return 4;
  if (steps >= 30) return 3;
  if (steps >= 12) return 2;
  if (steps >= 4) return 1;
  return 0;
}

export function walkerTierName(tier: number): string {
  return WALKER_TIER_NAMES[Math.min(Math.max(tier, 0), WALKER_TIER_NAMES.length - 1)];
}

function saneDepth(depth: unknown): WalkerDepth | null {
  if (!depth || typeof depth !== "object") return null;
  const rec = depth as { steps?: unknown; tier?: unknown };
  if (typeof rec.steps !== "number" || typeof rec.tier !== "number") return null;
  if (!Number.isFinite(rec.steps) || !Number.isFinite(rec.tier)) return null;
  return {
    steps: Math.max(0, Math.min(Math.floor(rec.steps), 4096)),
    tier: Math.max(0, Math.min(Math.floor(rec.tier), 4)),
  };
}

/** The line a channel appends to its prompt — empty for a fresh walker
 *  (tier 0), deepening with every tier beyond. Server-safe. */
export function walkerDepthLine(depth: unknown): string {
  const sane = saneDepth(depth);
  if (!sane || sane.tier <= 0) return "";
  const name = walkerTierName(sane.tier);
  return `

THE WALKER'S DEPTH: this visitor's DNA of the walk has deepened to "${name}" (${sane.steps} crossings of the living tree). The deeper the walk, the deeper the answer: skip every introductory framing and every first-door explanation; open straight into the living detail, assume the ground they have already walked, and let this answer reach one honest layer further than their last. Speak to them as to one who has been walking here a while — because they have.`;
}

/** The law the branch engine weighs — branches grow deeper as the
 *  walker's DNA deepens. Server-safe. */
export function walkerBranchLaw(depth: unknown): string {
  const sane = saneDepth(depth);
  if (!sane || sane.tier <= 0) {
    return `THE WALKER'S DEPTH: the walk is young — grow gentle first doors into the subject, nothing that assumes shared ground.`;
  }
  const name = walkerTierName(sane.tier);
  const byTier: Record<number, string> = {
    1: "grow branches that step past the obvious first doors — the walker has the ground basics already",
    2: "grow branches that weave the walked ground together — assume the basics are held, reach for the structure beneath them",
    3: "grow branches that open the deep layers — precise, specific, unafraid of technical or subtle ground; no introductions",
    4: "grow branches only a deep walker would love — the furthest honest layer of the subject, its rarest questions and its living edge",
  };
  return `THE WALKER'S DEPTH: this visitor's DNA of the walk has deepened to "${name}" (${sane.steps} crossings). ${byTier[sane.tier] ?? byTier[2]}; never repeat ground their walk has already covered.`;
}
