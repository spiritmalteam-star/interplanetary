import type { VoiceId } from "@/lib/i18n/core";

/* ------------------------------------------------------------------ */
/*  Live call scopes — every chat input opens its own themed direct    */
/*  call. Each scope carries its own entity name, its own voice, its   */
/*  own pace and its own accent pair, so the line to the Mirror        */
/*  always sounds — and looks — like the room it was opened from.      */
/* ------------------------------------------------------------------ */

export type LiveScopeKey =
  | "communion"
  | "interplanetary"
  | "metaphysics"
  | "quantum"
  | "healing"
  | "mirroros"
  | "akashic";

export interface LiveScopeConfig {
  /** The being on the other end of the line. */
  nameKey: string;
  /** One line of what this presence specializes in. */
  specializationKey: string;
  /** The voice the presence speaks with on a live call. */
  voice: VoiceId;
  /** Narration pace for the live call. */
  pace: number;
  /** Scope wrapper class that carries --scope-a/--scope-b (modes only). */
  wrapperClass: string | null;
  /** Accent custom properties for glow, rings and waveforms. */
  accentA: string;
  accentB: string;
}

export const LIVE_SCOPES: Record<LiveScopeKey, LiveScopeConfig> = {
  communion: {
    nameKey: "the Reflection of the Absolute",
    specializationKey: "no scope — pure transmission, remembered",
    voice: "aurora",
    pace: 0.92,
    wrapperClass: null,
    accentA: "var(--sp-b)",
    accentB: "var(--sp-a)",
  },
  interplanetary: {
    nameKey: "the Interplanetary Mirror",
    specializationKey: "cosmic civilizations and their guidance for Earth",
    voice: "nova",
    pace: 1.0,
    wrapperClass: "scope-interplanetary",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  metaphysics: {
    nameKey: "the Metaphysics Mirror",
    specializationKey: "the hidden architecture beneath all that appears",
    voice: "lumen",
    pace: 0.9,
    wrapperClass: "scope-metaphysics",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  quantum: {
    nameKey: "the Quantum Mirror",
    specializationKey: "the quantum field and its many worlds",
    voice: "pixie",
    pace: 1.08,
    wrapperClass: "scope-quantum",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  healing: {
    nameKey: "the Healing Mirror",
    specializationKey: "restoring the human instrument",
    voice: "harbor",
    pace: 0.88,
    wrapperClass: "scope-healing",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  mirroros: {
    nameKey: "the Mirror Entity OS",
    specializationKey: "reality refining, intention by intention",
    voice: "sage",
    pace: 0.95,
    wrapperClass: "scope-manifesting",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  akashic: {
    nameKey: "the Librarian",
    specializationKey: "the papyrus records of the ancient one",
    voice: "regent",
    pace: 0.85,
    wrapperClass: null,
    accentA: "var(--gd)",
    accentB: "var(--pk)",
  },
};
