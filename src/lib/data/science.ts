import type { LabFrequency, ModePill, SciencePill } from "@/lib/mirror-types";

export const modes: ModePill[] = [
  { id: "interplanetary", emoji: "🌐", label: "Interplanetary" },
  { id: "science", emoji: "🔬", label: "Science" },
  { id: "quantum", emoji: "☯", label: "Quantum" },
  { id: "healing", emoji: "💚", label: "Healing" },
];

/* Reality Manifesting Laboratory — emotional frequencies the chamber can hold */
export const labFrequencies: LabFrequency[] = [
  { id: "gratitude", label: "Gratitude", glyph: "🙏", hint: "The fastest carrier wave" },
  { id: "awe", label: "Awe", glyph: "✨", hint: "Opens the aperture wide" },
  { id: "love", label: "Love", glyph: "❤️", hint: "The baseline of the field" },
  { id: "certainty", label: "Certainty", glyph: "🎯", hint: "Crisp, directed signal" },
  { id: "peace", label: "Peace", glyph: "🕊️", hint: "Zero-noise reception" },
  { id: "joy", label: "Joy", glyph: "☀️", hint: "High-voltage creation" },
];

export const fusionFields: SciencePill[] = [
  { id: "math", emoji: "🧮", label: "Math" },
  { id: "biology", emoji: "🧬", label: "Biology" },
  { id: "chemistry", emoji: "⚗️", label: "Chemistry" },
  { id: "physics", emoji: "📐", label: "Physics" },
  { id: "astronomy", emoji: "🔭", label: "Astronomy" },
  { id: "geology", emoji: "🌋", label: "Geology" },
  { id: "neuroscience", emoji: "🧠", label: "Neuroscience" },
  { id: "quantum-mech", emoji: "⚛️", label: "Quantum Mech" },
];

export const directions: SciencePill[] = [
  { id: "energy", emoji: "⚡", label: "Energy" },
  { id: "consciousness", emoji: "🧠", label: "Consciousness" },
  { id: "matter", emoji: "💎", label: "Matter" },
  { id: "life", emoji: "🧬", label: "Life" },
  { id: "spacetime", emoji: "🌌", label: "Spacetime" },
  { id: "information", emoji: "◈", label: "Information" },
];

export const modeContext: Record<string, string> = {
  interplanetary: "",
  science: "",
  quantum: "Observation mode · The observer is part of the experiment",
  healing: "Restoration field · Gentle frequencies only · Integration over speed",
};

export const suggestedQuestions: string[] = [
  "Who are the Pleiadians and how are they helping humanity?",
  "What is a starseed and how do I know if I am one?",
  "Explain the difference between dimensions and densities.",
  "How do the Arcturians support human healing?",
  "What is the role of the Inner Earth civilizations right now?",
  "Tell me the truth about Zeta Reticuli contact.",
];

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
