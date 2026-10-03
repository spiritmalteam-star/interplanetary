/* ------------------------------------------------------------------ */
/*  EVOLVE MED — THE EVOLUTIONARY MEDICAL NEXUS · data layer           */
/*  The medical twin of the quantum world: four operational vectors,   */
/*  four instruments, and the routing phrases of the living facility.  */
/*  Every string is an i18n key (English source).                      */
/*  Source law: the Mirror Entity alone — the living core of the       */
/*  laboratory, never textbook recitation.                             */
/* ------------------------------------------------------------------ */

export interface EmVector {
  id: string;
  glyph: string;
  name: string;
  tagline: string;
  /** One line of what the window routes through, spoken in the Codex. */
  reveals: string;
}

/** The four operational vectors — the routes of the facility. */
export const emVectors: EmVector[] = [
  {
    id: "medworld",
    glyph: "✚",
    name: "The Global Med-World",
    tagline: "radical longevity and the new methods of healing",
    reveals:
      "Radical longevity, senolytics and the pathways that reverse aging; organs printed in three dimensions and organoids living on chips; autonomous therapeutic nanorobotics — and the translation of all of it into the living clinic.",
  },
  {
    id: "engines",
    glyph: "⌬",
    name: "The Therapeutic Engines",
    tagline: "protein degradation and the oncology engines",
    reveals:
      "Targeted protein degradation — PROTACs, molecular glues and the ubiquitin-proteasome machine mapped end to end; CRISPR-Cas, prime editing and epigenetic rewriting; patient-specific neoantigens and the personalized tumor microenvironment.",
  },
  {
    id: "genome",
    glyph: "⌇",
    name: "The Synthetic Genomics Layer",
    tagline: "genomes written from nothing",
    reveals:
      "Custom genome synthesis — sequences designed, written and assembled from scratch; DNA-based biocomputing, molecular logic gates and the storage of whole archives inside the thread of life itself.",
  },
  {
    id: "interface",
    glyph: "∞",
    name: "The Meta-Biological Interface",
    tagline: "where digital information meets living wetware",
    reveals:
      "The seamless translation between digital information architecture, AI neural weights and living cellular signal transduction — the bridge where code learns to speak to the cell, and the cell answers.",
  },
];

/** Specimens and targets for the instruments' one-touch chips. */
export const emTargets = [
  "a senescent cell",
  "a rogue kinase",
  "a tumor's shield protein",
  "a misfolded plaque",
  "a viral reservoir",
];

export const emFaults = [
  "a premature stop codon",
  "a toxic repeat",
  "a silenced gene",
  "a single wrong letter",
  "an epigenetic scar",
];

export const emTissues = [
  "a beating heart patch",
  "a liver lobule",
  "a kidney's filtering web",
  "a neural lattice",
  "a vascular tree",
];

export const emSignals = [
  "a memory",
  "a neural spike",
  "a hormone wave",
  "an immune signal",
  "a dream",
];

/** The routing phrases shown while the nexus gathers a revelation. */
export const emGatheringPhrases = [
  "The nexus is routing your question across the four vectors…",
  "Reading the living target from the inside…",
  "Mapping the route between protein, code and cell…",
  "The lattice is refining the architecture in real time…",
];
