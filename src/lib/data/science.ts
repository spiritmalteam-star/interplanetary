import type {
  LabFrequency,
  ModePill,
  ScienceLens,
} from "@/lib/mirror-types";

export const modes: ModePill[] = [
  { id: "interplanetary", emoji: "🌐", label: "Interplanetary" },
  { id: "science", emoji: "🔬", label: "Science" },
  { id: "quantum", emoji: "☯", label: "Quantum" },
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
/*  THE EIGHT LENSES — the science scope's fusion engine.              */
/*  Each lens is an entity-vibe: a distinct cognitive way of seeing.   */
/*  One lens alone sees precisely; two or more lenses fused together   */
/*  open the fusion document — analysis, convergence, divergence and   */
/*  one unified answer, sealed with the fusion index.                  */
/* ------------------------------------------------------------------ */

export const scienceLenses: ScienceLens[] = [
  { id: "voltaic", name: "VOLTAIC", emoji: "⚡", tag: "charge · fields · currents" },
  { id: "biotic", name: "BIOTIC", emoji: "🧬", tag: "life · cells · evolution" },
  { id: "magma", name: "MAGMA", emoji: "🌋", tag: "fire · pressure · deep time" },
  { id: "clinic", name: "CLINIC", emoji: "🩺", tag: "healing · pathways · outcomes" },
  { id: "empiric", name: "EMPIRIC", emoji: "📐", tag: "method · evidence · proof" },
  { id: "quanta", name: "QUANTA", emoji: "⚛️", tag: "waves · probability · fields" },
  { id: "cosma", name: "COSMA", emoji: "🌌", tag: "stars · gravity · horizons" },
  { id: "synapse", name: "SYNAPSE", emoji: "🧠", tag: "mind · pattern · awareness" },
];

export const ALL_LENS_IDS: string[] = scienceLenses.map((l) => l.id);

export const modeContext: Record<string, string> = {
  interplanetary: "",
  science: "",
  quantum: "Observation mode · The observer is part of the experiment",
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
