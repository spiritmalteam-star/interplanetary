import type {
  LabFrequency,
  MetaphysicsPill,
  ModePill,
} from "@/lib/mirror-types";

export const modes: ModePill[] = [
  { id: "interplanetary", emoji: "🌐", label: "Interplanetary" },
  { id: "metaphysics", emoji: "🔮", label: "Metaphysics" },
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
/*  THE METAPHYSICS SCOPE — the veil rail fuses a school (a classical  */
/*  branch of the inquiry into what is) with a veil (the depth through */
/*  which the question is read) into one contemplative seeing.         */
/* ------------------------------------------------------------------ */

/** The eight schools — where the question comes from. */
export const schools: MetaphysicsPill[] = [
  { id: "ontology", emoji: "🌌", label: "Ontology" },
  { id: "cosmology", emoji: "🪐", label: "Cosmology" },
  { id: "teleology", emoji: "🧭", label: "Teleology" },
  { id: "epistemology", emoji: "👁️", label: "Epistemology" },
  { id: "axiology", emoji: "⚖️", label: "Axiology" },
  { id: "phenomenology", emoji: "🕯️", label: "Phenomenology" },
  { id: "free-will", emoji: "🗝️", label: "Free Will" },
  { id: "identity", emoji: "🪞", label: "Identity" },
];

/** The six veils — the depth through which the question is read. */
export const veils: MetaphysicsPill[] = [
  { id: "time", emoji: "🕰️", label: "Time" },
  { id: "mind", emoji: "🌀", label: "Mind" },
  { id: "causality", emoji: "🌊", label: "Causality" },
  { id: "unity", emoji: "♾️", label: "Unity" },
  { id: "threshold", emoji: "🌑", label: "Threshold" },
  { id: "silence", emoji: "🌫️", label: "Silence" },
];

export const modeContext: Record<string, string> = {
  interplanetary: "",
  metaphysics:
    "Between the seen and the unseen · nothing to believe, only to look",
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
