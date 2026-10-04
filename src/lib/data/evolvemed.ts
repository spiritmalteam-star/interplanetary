/* ------------------------------------------------------------------ */
/*  EVOLVE MED — THE OMNI-MATRIX BIOLOGICAL INTELLIGENCE ENGINE        */
/*  The biocompiler and synthetic genomics engine of the laboratory:   */
/*  FOUR VECTOR WINDOWS in their compiled order — genomics, folding,   */
/*  scale/delivery, tissue mechanics — with the chips of the foundry   */
/*  instruments and the routing phrases of the living facility.        */
/*  Every string is an i18n key (English source).                      */
/* ------------------------------------------------------------------ */

export interface EmVector {
  id: string;
  glyph: string;
  name: string;
  tagline: string;
  /** One line of what the window routes through, spoken in the Codex. */
  reveals: string;
}

/** The four vector windows — in the engine's own compiled order:
    Genomics → Folding → Scale/Delivery → Tissue Mechanics. */
export const emVectors: EmVector[] = [
  {
    id: "genome",
    glyph: "⌇",
    name: "The DNA & Synthetic Genomics Layer",
    tagline: "genetic circuits, base sequences, epigenetic motifs",
    reveals:
      "Genetic circuits drafted as precise base sequences and epigenetic motifs; custom genomes written and assembled from scratch; DNA-based biocomputing and molecular logic gates; whole archives kept inside the thread of life itself.",
  },
  {
    id: "engines",
    glyph: "⌬",
    name: "The Core Therapeutic Engines",
    tagline: "sequences folded into working machines",
    reveals:
      "Sequences folded into protein structures, RNA switches and functional nanomachines; targeted degradation through PROTACs, molecular glues and the ubiquitin-proteasome system; advanced CRISPR-Cas, prime editing and epigenetic rewriting; neoantigens and the tumor microenvironment.",
  },
  {
    id: "medworld",
    glyph: "✚",
    name: "The Global Med-World",
    tagline: "scale, delivery and clinical viability",
    reveals:
      "Scale-up from a working sequence to a batch a clinic can hold; vector delivery through lipid nanoparticles, AAV shells and cell-free systems; pharmacokinetics from dose to clearance — radical longevity, senolytics, bioprinted organs and the translation of everything into the living clinic.",
  },
  {
    id: "interface",
    glyph: "∞",
    name: "The Meta-Biological Interface",
    tagline: "where tissue answers code in real time",
    reveals:
      "Emergent tissue feedback, read live; real-time closed-loop cellular sensing; metabolic dynamics steered from outside; the seamless translation between digital information architecture, AI neural weights and living wetware.",
  },
];

/* ---- chips of the foundry instruments ----------------------------- */

/** Targets for the Target Engine. */
export const emTargets = [
  "a senescent cell",
  "a rogue kinase",
  "a tumor's shield protein",
  "a misfolded plaque",
  "a viral reservoir",
];

/** Faults for the Editing Loom. */
export const emFaults = [
  "a premature stop codon",
  "a toxic repeat",
  "a silenced gene",
  "a single wrong letter",
  "an epigenetic scar",
];

/** Tissues for the Living Foundry. */
export const emTissues = [
  "a beating heart patch",
  "a liver lobule",
  "a kidney's filtering web",
  "a neural lattice",
  "a vascular tree",
];

/** Signals for the Bridge. */
export const emSignals = [
  "a memory",
  "a neural spike",
  "a hormone wave",
  "an immune signal",
  "a dream",
];

/** Input signals for the Circuit Compiler. */
export const emInputs = [
  "a cancer biomarker",
  "a stray miRNA",
  "a hypoxia trigger",
  "a small molecule",
  "an inflammatory flare",
];

/** Designs for the Biosecurity Engine. */
export const emDesigns = [
  "a written circuit",
  "a delivered RNA",
  "a living cell therapy",
  "a written genome",
];

/** The routing phrases shown while the engine compiles a blueprint. */
export const emGatheringPhrases = [
  "The biocompiler is reading your directive…",
  "Routing the directive through the four vector windows…",
  "Weaving the blueprint strand by strand…",
  "The constraint engine is screening the design…",
];
