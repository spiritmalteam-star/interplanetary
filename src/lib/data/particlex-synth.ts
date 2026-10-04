/* ------------------------------------------------------------------ */
/*  PARTICLEX — SYNTH ANALOG · the cosmic frequency interface          */
/*  A tenth kategori beside the Core: an analog instrument drawn in    */
/*  the digital realm — the Aztec Sun border, three circles of         */
/*  frequency, and the interlocking rotating squares of the Tzolkin.   */
/*  Every string is an i18n key (English source).                      */
/*  Source law: the Mirror Entity alone — never current science.       */
/* ------------------------------------------------------------------ */

/** One of the twelve high-level elemental dials of Circle 1. */
export interface SaDial {
  id: string;
  name: string;
  /** The small sign worn on the dial face. */
  glyph: string;
  /** What the dial governs in the analog world. */
  element: string;
  /** The dial's standing frequency, in Hz. */
  frequency: number;
}

/** One of the twelve transmutation plates of Circle 2. */
export interface SaPlate {
  id: string;
  name: string;
  glyph: string;
  /** The technique the plate performs when it faces the apex. */
  technique: string;
}

/** One of the twelve square glyph plates of the inner wheel. */
export interface SaSquare {
  id: string;
  name: string;
  /** Short face text (frequency numbers, φ, or a sign). */
  face: string;
  /** What the square opens when aligned. */
  opens: string;
  frequency: number;
}

/** One cosmic formula — a triple alignment across the three circles. */
export interface SaAlignment {
  id: string;
  name: string;
  /** The short alignment code, e.g. "SOL-VIBRATION". */
  code: string;
  /** Outer dial id, middle plate id, square glyph id. */
  dial: string;
  plate: string;
  square: string;
  /** The formula written the old way. */
  formula: string;
  /** What the alignment does when it fires. */
  effect: string;
  /** The tone the alignment sounds, in Hz. */
  frequency: number;
  /** Grand alignments are the three known prophecies; the rest are veiled. */
  grand?: boolean;
}

/* --------------------------- the chamber --------------------------- */

export const saChamber = {
  id: "synth",
  name: "Synth Analog",
  subtitle: "the analog world, drawn in the digital realm",
  reveals:
    "A cosmic frequency interface: the Aztec Sun border holds the outer circle of twelve elemental dials, the middle circle turns its transmutation plates, and the Quantum Mirror Core wears the interlocking rotating squares. Bring one dial, one plate and one square glyph to the apex — and the hidden formulas sound themselves.",
};

/* ------------------- circle 1 — the primary dials ------------------- */

export const saDials: SaDial[] = [
  { id: "vibration", name: "Vibration", glyph: "△", element: "the first tremor beneath matter", frequency: 432 },
  { id: "intention", name: "Intention", glyph: "✧", element: "the arrow the heart looses", frequency: 528 },
  { id: "harmonics", name: "Harmonics", glyph: "≋", element: "the choir inside every note", frequency: 396 },
  { id: "mirror-matrix", name: "Mirror Matrix", glyph: "▤", element: "the lattice that returns what is sent", frequency: 639 },
  { id: "resonance", name: "Resonance", glyph: "◍", element: "the sympathy between two bodies", frequency: 174 },
  { id: "scalar-wave", name: "Scalar Wave", glyph: "∿", element: "the wave that travels without moving", frequency: 963 },
  { id: "chymic-gold", name: "Chymic Gold", glyph: "☉", element: "the ripening of base hours into light", frequency: 852 },
  { id: "aether-dial", name: "Aether Dial", glyph: "☾", element: "the medium the old skies breathed", frequency: 285 },
  { id: "biophoton", name: "Biophoton", glyph: "◉", element: "the faint lamp every living cell holds", frequency: 741 },
  { id: "torus-core", name: "Torus Core", glyph: "◎", element: "the self-feeding ring of all engines", frequency: 432 },
  { id: "tachyonic-field", name: "Tachyonic Field", glyph: "✷", element: "the wind that outruns the light it carries", frequency: 963 },
  { id: "solfeggio", name: "Solfeggio", glyph: "♪", element: "the six ancient syllables of repair", frequency: 528 },
];

/* ------------- circle 2 — the transmutation plates ------------------ */

export const saPlates: SaPlate[] = [
  { id: "p-torus", name: "Torus Core", glyph: "◎", technique: "folds any signal back through its own heart" },
  { id: "p-aether", name: "Aether Dial", glyph: "☾", technique: "thins the veil between signal and space" },
  { id: "p-scalar", name: "Scalar Wave", glyph: "∿", technique: "sends the wave before the wire" },
  { id: "p-merkaba", name: "Merkaba Turn", glyph: "✶", technique: "spins the light-body's two counter-wheels" },
  { id: "p-phi", name: "Phi Cascade", glyph: "φ", technique: "pours every step through the golden ratio" },
  { id: "p-obsidian", name: "Obsidian Gate", glyph: "▣", technique: "cuts the doorway the mirror people used" },
  { id: "p-quetzal", name: "Quetzal Coil", glyph: "≈", technique: "winds the feathered serpent through the coil" },
  { id: "p-tzolkin", name: "Tzolkin Weave", glyph: "#", technique: "weaves the 260-day loom into the hour" },
  { id: "p-prism", name: "Prism Fold", glyph: "▽", technique: "unfolds one beam into its secret families" },
  { id: "p-sol", name: "Sol Meridian", glyph: "☀", technique: "holds the noon line so the sun can sign it" },
  { id: "p-nodal", name: "Nodal Loom", glyph: "⊕", technique: "ties the eclipse knots of the inner sky" },
  { id: "p-silica", name: "Silica Chorus", glyph: "❋", technique: "teaches the crystal choir to carry a word" },
];

/* -------------- the squares — the Tzolkin glyph ring ---------------- */

export const saSquares: SaSquare[] = [
  { id: "s-174", name: "174 Hz", face: "174", opens: "the safety tone — the bedrock under the feet", frequency: 174 },
  { id: "s-285", name: "285 Hz", face: "285", opens: "the mending tone — tissue remembers its pattern", frequency: 285 },
  { id: "s-396", name: "396 Hz", face: "396", opens: "the release tone — fear turns back into ground", frequency: 396 },
  { id: "s-432", name: "432 Hz", face: "432", opens: "the natural tone — water and cells sit upright", frequency: 432 },
  { id: "s-528", name: "528 Hz", face: "528", opens: "the love tone — repair sung in the old key", frequency: 528 },
  { id: "s-639", name: "639 Hz", face: "639", opens: "the bridge tone — two hearts tune to one interval", frequency: 639 },
  { id: "s-741", name: "741 Hz", face: "741", opens: "the waking tone — the lamp behind the eyes", frequency: 741 },
  { id: "s-852", name: "852 Hz", face: "852", opens: "the sight tone — the inner clock reads the sun", frequency: 852 },
  { id: "s-963", name: "963 Hz", face: "963", opens: "the crown tone — the zero-point hum", frequency: 963 },
  { id: "s-biophoton", name: "Biophoton", face: "◉", opens: "the cell's own lamp, poured outward", frequency: 741 },
  { id: "s-tachyonic", name: "Tachyonic Field", face: "✷", opens: "the field that arrives before its messenger", frequency: 963 },
  { id: "s-phi", name: "Phi 1.618", face: "φ", opens: "the ratio the sunflowers keep", frequency: 852 },
];

/* ------------------ the cosmic alignment formulas ------------------- */
/*  The three grand alignments are the known prophecies; the five      */
/*  veiled ones wait in the wheels for a patient hand.                 */

export const saAlignments: SaAlignment[] = [
  {
    id: "matrix-432",
    name: "Matrix 432Hz Alignment",
    code: "SOL-VIBRATION",
    dial: "vibration",
    plate: "p-torus",
    square: "s-432",
    formula: "Outer Ring (Vibration) + Middle Plate (Torus Core) + Square Glyph (432Hz)",
    effect:
      "Restores natural geometric coherence to physical water and biological cells, neutralizing digital noise.",
    frequency: 432,
    grand: true,
  },
  {
    id: "mirror-projection",
    name: "Mirror Entity Projection",
    code: "ANALOG-RETURN",
    dial: "mirror-matrix",
    plate: "p-aether",
    square: "s-biophoton",
    formula: "Outer Ring (Mirror Matrix) + Middle Plate (Aether Dial) + Square Glyph (Biophoton)",
    effect:
      "Projects digital intent into physical space through tactile, analog harmonic waves.",
    frequency: 741,
    grand: true,
  },
  {
    id: "intention-weaver",
    name: "Intention-Frequency Weaver",
    code: "INTENTION-MANIFESTATION",
    dial: "intention",
    plate: "p-scalar",
    square: "s-tachyonic",
    formula: "Outer Ring (Intention) + Middle Plate (Scalar Wave) + Square Glyph (Tachyonic Field)",
    effect:
      "Connects human thought vectors directly to cosmic zero-point energy fields.",
    frequency: 963,
    grand: true,
  },
  {
    id: "sidereal-breath",
    name: "The Sidereal Breath",
    code: "HARMONIC-SIGHT",
    dial: "harmonics",
    plate: "p-prism",
    square: "s-852",
    formula: "Outer Ring (Harmonics) + Middle Plate (Prism Fold) + Square Glyph (852Hz)",
    effect:
      "Returns the body's inner clock to the sun's analog tempo — the day breathes at its old length again.",
    frequency: 852,
  },
  {
    id: "bedrock-hum",
    name: "The Bedrock Hum",
    code: "GROUND-RETURN",
    dial: "resonance",
    plate: "p-phi",
    square: "s-174",
    formula: "Outer Ring (Resonance) + Middle Plate (Phi Cascade) + Square Glyph (174Hz)",
    effect:
      "Sets the nervous system down on the planet's own bass note, and the scattered hour gathers itself.",
    frequency: 174,
  },
  {
    id: "chymic-sunrise",
    name: "Chymic Sunrise",
    code: "GOLD-NOON",
    dial: "chymic-gold",
    plate: "p-sol",
    square: "s-396",
    formula: "Outer Ring (Chymic Gold) + Middle Plate (Sol Meridian) + Square Glyph (396Hz)",
    effect:
      "Transmutes scattered attention into warm embodied presence — base hours ripen into gold at the noon line.",
    frequency: 396,
  },
  {
    id: "ladder-528",
    name: "The Ladder of 528",
    code: "SOLFEGGIO-LOVE",
    dial: "solfeggio",
    plate: "p-tzolkin",
    square: "s-528",
    formula: "Outer Ring (Solfeggio) + Middle Plate (Tzolkin Weave) + Square Glyph (528Hz)",
    effect:
      "Mends the broken intervals between thought and speech, and what is meant arrives said in love.",
    frequency: 528,
  },
  {
    id: "quetzal-bridge",
    name: "The Quetzal Bridge",
    code: "AETHER-BRIDGE",
    dial: "aether-dial",
    plate: "p-quetzal",
    square: "s-639",
    formula: "Outer Ring (Aether Dial) + Middle Plate (Quetzal Coil) + Square Glyph (639Hz)",
    effect:
      "Strings a feathered bridge between two hearts across the thin aether, and neither side feels the distance.",
    frequency: 639,
  },
];

/* --------------------- the unwritten combinations ------------------- */
/*  What the instrument murmurs when three glyphs meet but no formula  */

export const saWhispers = [
  "The wheels turn, but the sky holds its breath — no formula rests on these three yet.",
  "A faint clicking of stone on stone; the combination is written in no codex we keep.",
  "The apex listens, finds no prophecy, and lets the three signs pass like strangers.",
  "The sun border watches politely. These three have never met before.",
  "Something almost stirs in the mirror core, then settles — an unwritten pairing.",
  "The serpent glyph flickers its tongue at the odd trio and looks away.",
  "The dials hum politely; the formula that fits these three is still asleep.",
  "Not every meeting of signs is a key. Some are only beautiful.",
];
