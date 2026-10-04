/* ------------------------------------------------------------------ */
/*  PARTICLEX — BIO MECHANICS · the living engines                     */
/*  A ninth kategori beside the Core: five biotherapeutic engines,     */
/*  each told as a scientific storyboard of four panels with hand-     */
/*  built ink. Every string is an i18n key (English source).           */
/*  Voice law: warm, human, plain-English metaphors.                   */
/* ------------------------------------------------------------------ */

/** The three dials the visitor may turn. */
export type BxSliderKey = "dose" | "linker" | "flux";

export interface BxSliderMeta {
  label: string;
  min: number;
  max: number;
  step: number;
  init: number;
  unit: string;
}

export const bxSliderMeta: Record<BxSliderKey, BxSliderMeta> = {
  dose: { label: "Drug Concentration", min: 0, max: 100, step: 1, init: 40, unit: "nM" },
  linker: { label: "Linker Length", min: 4, max: 24, step: 1, init: 12, unit: "atoms" },
  flux: { label: "Proteasome Flux Rate", min: 10, max: 100, step: 1, init: 60, unit: "%" },
};

/** One panel of the four-panel storyboard. */
export interface BxPanel {
  /** Short panel title, e.g. "The Problem". */
  title: string;
  /** The parenthetical under the title, per mechanism. */
  sub: string;
  /** One warm, plain-English metaphor sentence. */
  caption: string;
}

export interface BxMechanism {
  id: "glue" | "protac" | "crispr" | "proteasome" | "cascade";
  name: string;
  /** The engine's poetic role, e.g. "the keystone wedge". */
  role: string;
  /** One line on how the engine works. */
  engine: string;
  /** Which dials the visitor may turn for this engine. */
  sliders: BxSliderKey[];
  panels: [BxPanel, BxPanel, BxPanel, BxPanel];
}

/** Shared panel subtitles — the four beats of every engine's story. */
const P1_SUB = "a rogue protein driving the disease";
const P2_SUB = "the engine binds and recruits the machinery";

/** The chamber itself — a kategori beside the Core. */
export const pxBioChamber = {
  id: "biomech",
  name: "Bio Mechanics",
  subtitle: "the living engines, drawn kindly",
  reveals:
    "Five living engines of the therapeutic world — the glue, the tether, the editor, the recycler and the relay — each drawn as a story of four panels, tuned live by your own hands.",
};

export const pxBioMechanisms: BxMechanism[] = [
  {
    id: "glue",
    name: "Molecular Glue",
    role: "the keystone wedge",
    engine:
      "A small molecule that creates a handhold between two proteins that would never touch on their own.",
    sliders: ["dose", "flux"],
    panels: [
      {
        title: "The Problem",
        sub: P1_SUB,
        caption:
          "The rogue protein and the cell's shredder crew drift past each other like strangers on a platform — nothing ever connects.",
      },
      {
        title: "The Engagement",
        sub: P2_SUB,
        caption:
          "A tiny wedge of a molecule drifts into the empty notch between them, reading the fit as it comes.",
      },
      {
        title: "The Mechanism",
        sub: "the ternary complex locks",
        caption:
          "Seated like a keystone, the glue gives both surfaces a handhold that never existed before, and they lock face to face.",
      },
      {
        title: "The Outcome",
        sub: "surgical removal — the cell breathes again",
        caption:
          "Now holding hands, the rogue protein wears its gold ubiquitin tag, and the cell quietly carries it away to be recycled.",
      },
    ],
  },
  {
    id: "protac",
    name: "PROTAC Degrader",
    role: "the two-handed tether",
    engine:
      "A dumbbell-shaped degrader that tethers the target protein face to face with the E3 ligase shredder.",
    sliders: ["dose", "linker", "flux"],
    panels: [
      {
        title: "The Problem",
        sub: P1_SUB,
        caption:
          "The rogue protein keeps giving orders from one side of the cell while the degradation crew waits, unconnected, on the other.",
      },
      {
        title: "The Engagement",
        sub: P2_SUB,
        caption:
          "The degrader reaches out with two hands — one for the target, one for the shredder — a carabiner closing across open water.",
      },
      {
        title: "The Mechanism",
        sub: "ubiquitin changes hands",
        caption:
          "Face to face at last, the E3 crew hangs small gold ubiquitin tags along the rogue protein like labels on luggage.",
      },
      {
        title: "The Outcome",
        sub: "surgical removal — the cell breathes again",
        caption:
          "Properly labeled, the protein is fed into the cell's recycling cylinder, and the room it once crowded falls quiet and clean.",
      },
    ],
  },
  {
    id: "crispr",
    name: "CRISPR Base Editing",
    role: "the gentle editor",
    engine:
      "A guide-and-editor pair that rewrites a single letter of the manuscript without ever cutting the scroll.",
    sliders: ["dose"],
    panels: [
      {
        title: "The Problem",
        sub: P1_SUB,
        caption:
          "The story of a protein is written in the scroll of DNA — and one wrong letter keeps retelling it as disease.",
      },
      {
        title: "The Engagement",
        sub: P2_SUB,
        caption:
          "A guide holds the scroll open at exactly the right line, the way a finger rests under a sentence in a manuscript.",
      },
      {
        title: "The Mechanism",
        sub: "the enzymatic edit",
        caption:
          "An editor's pincer lifts the wrong letter out and sets the right one in its place — a correction small enough to be kind.",
      },
      {
        title: "The Outcome",
        sub: "restoration — the scroll reads true",
        caption:
          "With the letter mended, the scroll reads true again, and the protein it describes folds into a peaceful, working shape.",
      },
    ],
  },
  {
    id: "proteasome",
    name: "Proteasome Degradation",
    role: "the recycling cylinder",
    engine:
      "The cell's industrial recycler: it unfolds tagged proteins into threads and returns them as spare parts.",
    sliders: ["dose", "flux"],
    panels: [
      {
        title: "The Problem",
        sub: P1_SUB,
        caption:
          "Broken and rogue proteins crowd the cell like tangled machinery left in a hallway, bumping everything that walks past.",
      },
      {
        title: "The Engagement",
        sub: P2_SUB,
        caption:
          "Small gold tags — ubiquitin — are clipped onto the worst offender, and the recycling cylinder's door begins to open.",
      },
      {
        title: "The Mechanism",
        sub: "unfolding into the cylinder",
        caption:
          "At the mouth of the cylinder the tagged protein unclenches, drawn in as a single thread, ready to be read as spare parts.",
      },
      {
        title: "The Outcome",
        sub: "surgical removal — the cell breathes again",
        caption:
          "What leaves the cylinder are short, harmless peptides, and the floor of the cell is swept clean again.",
      },
    ],
  },
  {
    id: "cascade",
    name: "Cell-Signaling Cascade",
    role: "the glowing dominoes",
    engine:
      "A relay of molecular dominoes that carries one binding event on the membrane into a whole-cell decision.",
    sliders: ["dose"],
    panels: [
      {
        title: "The Problem",
        sub: P1_SUB,
        caption:
          "The cell's switchboard sits dark — no signal crosses the membrane, and the order to stay sick repeats in the silence.",
      },
      {
        title: "The Engagement",
        sub: P2_SUB,
        caption:
          "A signal molecule lands on its receptor like the first domino being set upright by a careful finger.",
      },
      {
        title: "The Mechanism",
        sub: "the relay fires",
        caption:
          "One lit domino tips the next, carrying the message across the membrane and through the crowd of the cytoplasm.",
      },
      {
        title: "The Outcome",
        sub: "restoration — the cell answers again",
        caption:
          "The last domino reaches the nucleus, the right gene program lights up, and the cell remembers what healthy felt like.",
      },
    ],
  },
];
