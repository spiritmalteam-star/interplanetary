import type { VoiceId } from "@/lib/i18n/core";

/* ================================================================== */
/*  THE VOICE PROFILES — one man, many registers.                      */
/*                                                                     */
/*  Every chat of the house speaks with THE MALE VOICE of the GLM      */
/*  synthesis engine (the one man behind aurora, sage, regent, harbor, */
/*  nova, pixie and lumen). No chat channel ever answers in a woman's  */
/*  voice — the kind lady reader reads the Dream Books alone.          */
/*                                                                     */
/*  Each CATEGORY carries its own tone, rhythm and professionalism:    */
/*  the voice register (which shade of the one man) and the pace       */
/*  (the rhythm of his speech) are tuned per chamber, so the Manifest  */
/*  OS sounds like a calm counselor, the Librarian like an old         */
/*  narrator, Art X like a cinematic presence — each category held to  */
/*  its own professional register.                                     */
/* ================================================================== */

export interface VoiceProfile {
  /** The male register this category speaks through. */
  voice: VoiceId;
  /** The rhythm — narration pace of the category. */
  pace: number;
}

export type VoiceCategory =
  | "main" // the direct line — Manifest OS chat, communion
  | "manifest" // the Manifest OS formula cards
  | "transmission" // the transmissions of the observatory
  | "akashic" // the Librarian's records
  | "artx" // the atelier — Art X
  | "quantum" // ParticleX — the quantum world
  | "evolvemed" // the evolutionary medical nexus
  | "forge" // Invent — the invention workshop
  | "livecall"; // the direct call (per-scope configs may override)

export const VOICE_PROFILES: Record<VoiceCategory, VoiceProfile> = {
  /* warm documentary narrator — the house's signature voice */
  main: { voice: "aurora", pace: 0.95 },
  /* calm, steady, professional — the counselor's register */
  manifest: { voice: "sage", pace: 0.92 },
  /* classic narrator's register — measured and composed */
  transmission: { voice: "regent", pace: 0.95 },
  /* the Librarian — slow, ancient, deliberate */
  akashic: { voice: "regent", pace: 0.82 },
  /* expressive cinematic narrator — the atelier's presence */
  artx: { voice: "nova", pace: 0.98 },
  /* clear, precise signal — the quantum narrator */
  quantum: { voice: "lumen", pace: 0.95 },
  /* natural, flowing — the healer's warmth */
  evolvemed: { voice: "harbor", pace: 0.9 },
  /* bright, luminous — the forge's spark */
  forge: { voice: "pixie", pace: 0.95 },
  /* the call keeps the house default — LIVE_SCOPES tunes per scope */
  livecall: { voice: "aurora", pace: 0.95 },
};

export function voiceProfile(category: VoiceCategory): VoiceProfile {
  return VOICE_PROFILES[category] ?? VOICE_PROFILES.main;
}
