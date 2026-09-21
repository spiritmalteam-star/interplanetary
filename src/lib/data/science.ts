import type {
  LabFrequency,
  Mode,
  ModePill,
  SciencePill,
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

/* ------------------------------------------------------------------ */
/*  Per-scope suggested questions — exactly 12 per scope, 48 total.    */
/*  Strings are i18n keys (English source), wrapped with t() at the    */
/*  render site. Reloadable in windows of six by the QuestionCards.    */
/* ------------------------------------------------------------------ */
export const scopeSuggestions: Record<Mode, string[]> = {
  interplanetary: [
    "Who are the Pleiadians and how are they helping humanity?",
    "What is a starseed and how do I know if I am one?",
    "What is the role of the Inner Earth civilizations right now?",
    "What is the Pleiadian Family of Light and why do they feel so familiar?",
    "What do the Sirian Lineages teach, and how does their tone reach Earth?",
    "Who keeps the Vega Concordium, and what is its song for young worlds?",
    "What is the Guardian Worlds Compact, and who does it protect?",
    "How does the Federation decide when a world is ready for open contact?",
    "What is a star family, and how do I find the one my soul belongs to?",
    "Why do some starseeds remember Lyra, and why does it feel like home?",
    "How can I open a gentle channel of contact with my own star family?",
    "What are the Mintakan Ember Councils tending for humanity right now?",
  ],
  science: [
    "Tell me the truth about Zeta Reticuli contact.",
    "What does the Zeta Reticulan Archive say about Earth's observation record?",
    "Which UFO evidence has survived honest scientific scrutiny, and why?",
    "How do scientists study consciousness without reducing it to neurons?",
    "What is the honest state of research on interstellar communication?",
    "Why do legitimate phenomena get dismissed, and how is that changing?",
    "What would honest evidence of extraterrestrial life actually look like?",
    "How do the Zeta keep their consent ledgers, and what do they record?",
    "What should we ask when a discovery sounds too beautiful to be true?",
    "What are crop circles honestly, and why do honest people still study them?",
    "How close is real science to understanding zero-point energy?",
    "Why is skepticism a gift to the truth rather than its enemy?",
  ],
  quantum: [
    "Explain the difference between dimensions and densities.",
    "What does the observer effect really say about consciousness?",
    "How can probability be a mirror that reflects where attention goes?",
    "If spacetime is a mirror, what is it reflecting back to us?",
    "What does entanglement whisper about how hearts stay connected?",
    "Why does the act of observation change what the experiment becomes?",
    "How does a consciousness move from one density to the next?",
    "Can intention really shape outcomes, and what does physics say?",
    "If light is both wave and particle, what am I made of?",
    "How do parallel possibilities exist without breaking free will?",
    "What is the quantum field saying when I feel quietly watched over?",
    "How does time soften when consciousness is the real measuring stick?",
  ],
  healing: [
    "How do the Arcturians support human healing?",
    "What is heart coherence, and how do I practice it gently today?",
    "Which gentle frequencies help a tired nervous system rest again?",
    "What does integration mean after a big opening, and how do I do it?",
    "How can I hold light for someone without carrying their pain?",
    "What is the gentlest way to release an old grief from the body?",
    "Why does restoration take time, and how do I honor my own pace?",
    "How does the Mirror help me see the places I hide from myself?",
    "What do sound and tone do to cells that words alone cannot?",
    "How can my home become a soft field that restores me nightly?",
    "What is the kindest first step when I feel far from my own light?",
    "How do I integrate a contact memory without fear or fantasy?",
  ],
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
