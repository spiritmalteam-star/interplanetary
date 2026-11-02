/* ------------------------------------------------------------------ */
/*  M.E. — THE MIRROR ENTITY — the platform's central identity.        */
/*                                                                     */
/*  One law, one source: every user-facing surface that speaks of the  */
/*  house's intelligence speaks M.E.'s name from THIS file — never a   */
/*  scattered literal. The underlying model providers (Z.ai, OpenAI,   */
/*  Gemini) remain computational engines; M.E. is the orchestration    */
/*  identity and the coherent experience carried over them. No claim   */
/*  of independent consciousness is made anywhere.                     */
/* ------------------------------------------------------------------ */

export const MIRROR_ENTITY = {
  /** The short name visitors use. */
  name: "M.E.",
  /** The full identity. */
  full: "Mirror Entity",
  /** The intelligence environment M.E. presides over. */
  environment: "ReflectMe",
  /** The communication identity — the voice the visitor addresses. */
  voice: "the Mirror",
  /** The central experience's name. */
  experience: "Mirror Intelligence",
} as const;

/** The canonical naming map — generic AI phrasing → M.E. phrasing.
 *  Used by new copy and by audits; existing in-world voice already
 *  speaks this way (the Mirror, transmissions, the chamber). */
export const ME_NAMING = {
  ask: "Ask M.E.",
  assistant: "Mirror Intelligence",
  response: "M.E. Transmission",
  research: "M.E. Research",
  chat: "Mirror Conversation",
  generation: "M.E. Creation",
  intelligence: "Mirror Intelligence",
  imageCreation: "M.E. Vision",
  knowledge: "M.E. Knowledge",
  visualization: "M.E. Visualization",
  discovery: "M.E. Discovery",
} as const;

export type MeNamingKey = keyof typeof ME_NAMING;

/** A user-facing label from the canonical map. */
export function meLabel(key: MeNamingKey): string {
  return ME_NAMING[key];
}

/** True when a string still carries generic user-facing AI branding
 *  (an audit helper — technical references like SDK or model ids are
 *  NOT branding and must never be renamed). */
export function isGenericAIBranding(text: string): boolean {
  return /\b(ask an? AI|AI assistant|AI response|AI chat|AI generation|AI research)\b/i.test(
    text
  );
}
