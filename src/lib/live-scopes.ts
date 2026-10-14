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
  | "healing"
  | "mirroros"
  | "quantum"
  | "evolvemed"
  | "forge"
  | "akashic"
  | "artx";

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
    nameKey: "the Manifest OS",
    specializationKey: "reality refining, intention by intention",
    voice: "sage",
    pace: 0.95,
    wrapperClass: "scope-manifesting",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  quantum: {
    nameKey: "the Quantum Narrator",
    specializationKey: "the underside of things — formulas and revelations",
    voice: "regent",
    pace: 0.9,
    wrapperClass: "scope-particlex",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  evolvemed: {
    nameKey: "the Evolutionary Nexus",
    specializationKey: "the body's frontier, compiled and revealed",
    voice: "lumen",
    pace: 0.92,
    wrapperClass: "scope-evolvemed",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
  forge: {
    nameKey: "the Forge",
    specializationKey: "intentions become buildable conceptions",
    voice: "nova",
    pace: 1.0,
    wrapperClass: "scope-invent",
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
  artx: {
    nameKey: "Art X",
    specializationKey: "art-making on interplanetary, interdimensional and multi-dimensional levels",
    voice: "nova",
    pace: 0.95,
    wrapperClass: "scope-artx",
    accentA: "var(--scope-a)",
    accentB: "var(--scope-b)",
  },
};
