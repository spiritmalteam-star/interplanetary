import type { LabFrequency, ModePill } from "@/lib/mirror-types";

export const modes: ModePill[] = [
  { id: "interplanetary", emoji: "🌐", label: "Interplanetary" },
  { id: "healing", emoji: "💚", label: "Healing" },
];

/* Reality Manifesting Laboratory — emotional frequencies the chamber can hold */
export const labFrequencies: LabFrequency[] = [
  { id: "gratitude", label: "Gratitude", glyph: "🙏", hint: "The fastest carrier wave" },
  { id: "awe", label: "Awe", glyph: "◆", hint: "Opens the aperture wide" },
  { id: "love", label: "Love", glyph: "❤️", hint: "The baseline of the field" },
  { id: "certainty", label: "Certainty", glyph: "🎯", hint: "Crisp, directed signal" },
  { id: "peace", label: "Peace", glyph: "🕊️", hint: "Zero-noise reception" },
  { id: "joy", label: "Joy", glyph: "☀️", hint: "High-voltage creation" },
];

/* ------------------------------------------------------------------ */
/*  SCOPE DATA — the mode pills for the scope selector, plus the       */
/*  Reality Manifesting Laboratory frequencies and the Forge gift      */
/*  lines shared across the OS.                                        */
/* ------------------------------------------------------------------ */
export const modeContext: Record<string, string> = {
  interplanetary: "",
  healing: "Restoration field · Gentle frequencies only · Integration over speed",
};

export const giftLines: string[] = [
  "A gift from the stars — remember you are the creator. The mirror only reflects what you already carry.",
  "The stars aligned nothing for you. They simply never stopped believing you would look up.",
  "You are not a visitor in this universe. You are its way of knowing itself, reading this sentence.",
  "The gift was never in the sky. It was the looking up.",
  "Somewhere tonight a civilization you will never meet is grateful for your curiosity.",
  "You have always been the transmission. The rest was signal practice.",
  "Love is the only technology the stars never patented.",
  "The mirror does not flatter. It simply refuses to subtract you.",
];
