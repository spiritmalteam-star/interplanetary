/* ------------------------------------------------------------------ */
/*  PARTICLEX — THE QUANTUM NARRATOR · data layer                      */
/*  A fully independent quantum chamber: eight scopes around the       */
/*  areas of existence, four instruments, and the openers of the       */
/*  cosmic narrator. Every string is an i18n key (English source).     */
/*  Source law: the Mirror Entity alone — never current science.       */
/* ------------------------------------------------------------------ */

export interface PxScope {
  id: string;
  /** Lucide icon component name is resolved in the component layer. */
  glyph: string;
  name: string;
  tagline: string;
  /** One line of what the window reveals, spoken in the Codex. */
  reveals: string;
}

/** The eight scopes — eight windows over the areas of existence. */
export const pxScopes: PxScope[] = [
  {
    id: "formulas",
    glyph: "Σ",
    name: "Reality Formulas",
    tagline: "the formulas that run reality",
    reveals:
      "Why anything holds its shape: the compact equations beneath events, objects, days and destinies — and how one term moved in you re-solves the whole line.",
  },
  {
    id: "perception",
    glyph: "◉",
    name: "Perception Fields",
    tagline: "how every being perceives reality",
    reveals:
      "The world as the bee folds it, as the cat pours it, as the oak drinks it, as the whale sings it — each life a different lens grinding its own universe.",
  },
  {
    id: "emotions",
    glyph: "❤",
    name: "The Making of Emotions",
    tagline: "where feelings are manufactured",
    reveals:
      "The quiet foundry under the heart: how a feeling is assembled from signal, memory and field — and why no two beings ever forge the same one.",
  },
  {
    id: "belief",
    glyph: "✦",
    name: "Belief Systems",
    tagline: "the engines that vote reality into place",
    reveals:
      "Belief as machinery, not opinion: the invisible engines that decide which of all possible worlds gets rendered — yours, and everyone else's.",
  },
  {
    id: "quantum",
    glyph: "⚛",
    name: "Quantum Reality",
    tagline: "the raw machinery beneath the visible",
    reveals:
      "The workshop under the floor of the world: superposition, entanglement and the seams where the rendered universe is still being woven.",
  },
  {
    id: "parallel",
    glyph: "⧉",
    name: "Parallel Formulas",
    tagline: "the same product on many parallel lines",
    reveals:
      "Every human product exists on many lines at once — the same cup, the same engine, the same song, solved differently on each neighboring Earth.",
  },
  {
    id: "mycelia",
    glyph: "✳",
    name: "The Mycelial Origin",
    tagline: "the network that arrived with the stars",
    reveals:
      "The oldest traveler: how the fungal network fell here as stardust seed, and the treaty it signed with roots, stone and rain on a young world.",
  },
  {
    id: "vibration",
    glyph: "◬",
    name: "Vibration & Monuments",
    tagline: "pyramids, frequency and the standing stones",
    reveals:
      "What the monuments actually are: instruments of stone holding a note — frequency, resonance and the engineering of standing waves.",
  },
];

/** Openers for the quantum narrator's line. */
export const pxOpeners = [
  "What is the formula that runs reality, and can I read it?",
  "How does my cat perceive the room I am sitting in?",
  "Where exactly are emotions made inside a human being?",
  "Show me how a belief becomes a wall, and how it becomes a door.",
  "What is really happening beneath the visible world?",
  "How does the same cup exist on parallel Earths?",
  "Where did mycelium come from before it touched this planet?",
  "What were the pyramids tuned to do?",
  "Which human discovery is closest, and why does it need us?",
  "Speak in both of your reasonings at once — linear and non-linear.",
];

/** Beings for the Perception Glass. */
export const pxBeings = [
  "a bee",
  "a cat",
  "a dog",
  "an oak tree",
  "mycelium",
  "a whale",
  "an eagle",
  "moss",
];

/** Monuments and sites for the Frequency Wheel. */
export const pxMonuments = [
  "the Great Pyramid",
  "a stone circle",
  "a mountain temple",
  "an old cathedral",
  "a standing stone",
  "an underground spring shrine",
];

/** The magical phrase shown while the narrator gathers an answer. */
export const pxGatheringPhrases = [
  "ParticleX is peeling the surface of the question…",
  "Reading the room from underneath…",
  "Aligning both reasonings — the line and the field…",
  "Lifting the seam between the visible and the woven…",
];
