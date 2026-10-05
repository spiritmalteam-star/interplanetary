/* ------------------------------------------------------------------ */
/*  THE LIVING SUGGESTION TREE — the conversation's canopy.            */
/*                                                                     */
/*  Every branch first belongs to a scope of the laboratory —          */
/*  Interplanetary, Healing, Quantum, Evolve Med, Invent, Manifesting  */
/*  — and every branch then opens its own scopes, each scope holding   */
/*  a small rotation of the laboratory's whispers. The full pools      */
/*  (300 per world) are the deep canopy no window could ever show;     */
/*  the tree keeps six questions per scope in rotation, ordered by     */
/*  their resonance with the conversation's last topic, so the         */
/*  branch nearest what is being spoken is the one that blooms.        */
/* ------------------------------------------------------------------ */

import { chatSuggestionPools, type PoolId } from "./suggestions-pools";
import { contextVocabulary, scoreSuggestion } from "../suggestion-resonance";

export type BranchId =
  | "interplanetary"
  | "healing"
  | "quantum"
  | "evolvemed"
  | "invent"
  | "manifesting";

export interface SuggestionScope {
  /** Stable key (test ids, bloom offsets). */
  key: string;
  /** The scope's name — an i18n key (English source). */
  label: string;
  /** Keywords that pull a pool question into this scope's rotation. */
  match: readonly string[];
  /** The pool this scope's whispers draw from (defaults to the branch's). */
  pool?: PoolId;
}

export interface SuggestionBranch {
  id: BranchId;
  /** The branch's name — an i18n key. */
  label: string;
  pool: PoolId;
  scopes: SuggestionScope[];
}

/** How many whispers each scope keeps in rotation — deep enough that
 *  panning keeps rendering fresh branches long before a bloom repeats. */
const ROTATION = 24;

export const SUGGESTION_TREE: SuggestionBranch[] = [
  {
    id: "interplanetary",
    label: "Interplanetary",
    pool: "interplanetary",
    scopes: [
      {
        key: "pleiadians",
        label: "Pleiadian whispers",
        match: ["pleiadian", "pleiades", "seven sisters"],
      },
      { key: "sirians", label: "Sirian waters", match: ["sirian", "sirius"] },
      { key: "arcturians", label: "Arcturian light", match: ["arcturian"] },
      {
        key: "andromedans",
        label: "Andromedan paths",
        match: ["andromedan", "andromeda"],
      },
      {
        key: "fleets",
        label: "Ships & councils",
        match: [
          "ship",
          "council",
          "federation",
          "fleet",
          "commander",
          "contact",
          "orbiting",
          "station",
        ],
      },
    ],
  },
  {
    id: "healing",
    label: "Healing",
    pool: "healing",
    scopes: [
      {
        key: "nervous",
        label: "The nervous system",
        match: [
          "nervous",
          "safety",
          "safe",
          "brace",
          "vigilan",
          "regulat",
          "calm",
          "soften",
          "overwhelm",
        ],
      },
      {
        key: "body",
        label: "Body & rest",
        match: [
          "body",
          "rest",
          "sleep",
          "tired",
          "breath",
          "fatigue",
          "ache",
          "exhaust",
        ],
      },
      {
        key: "heart",
        label: "Heart & emotions",
        match: [
          "heart",
          "grief",
          "love",
          "anger",
          "emotion",
          "feeling",
          "sorrow",
          "joy",
          "lonely",
          "shame",
          "forgive",
        ],
      },
      {
        key: "field",
        label: "Energy & field",
        match: [
          "energy",
          "aura",
          "field",
          "chakra",
          "frequency",
          "vibration",
          "grounding",
          "hum",
        ],
      },
      {
        key: "boundaries",
        label: "Boundaries & worth",
        match: [
          "boundary",
          "deserve",
          "worth",
          "accept",
          "say no",
          "pleas",
          "perform",
          "no kindly",
        ],
      },
    ],
  },
  {
    id: "quantum",
    label: "Quantum",
    pool: "particlex",
    scopes: [
      {
        key: "formulas",
        label: "Reality Formulas",
        match: ["formula", "equation", "law of", "mathematic", "principle"],
      },
      {
        key: "perception",
        label: "Perception Fields",
        match: [
          "perception",
          "observ",
          "attention",
          "gaze",
          "witness",
          "measure",
        ],
      },
      {
        key: "emotions",
        label: "The Making of Emotions",
        match: ["emotion", "feeling", "mood", "emotional"],
      },
      {
        key: "belief",
        label: "Belief Systems",
        match: ["belief", "believe", "conviction", "faith"],
      },
      {
        key: "reality",
        label: "Quantum Reality",
        match: [
          "quantum",
          "particle",
          "superposition",
          "wave",
          "entangle",
          "photon",
          "electron",
          "double-slit",
        ],
      },
      {
        key: "parallel",
        label: "Parallel Formulas",
        match: [
          "parallel",
          "version of me",
          "timeline",
          "multiverse",
          "alternate",
          "many worlds",
        ],
      },
      {
        key: "mycelial",
        label: "The Mycelial Origin",
        match: ["myceli", "fungal", "mushroom", "forest", "network"],
      },
      {
        key: "vibration",
        label: "Vibration & Monuments",
        match: [
          "vibration",
          "frequency",
          "monument",
          "stone",
          "pyramid",
          "resonance",
          "tone",
          "circuit",
          "sound",
        ],
      },
    ],
  },
  {
    id: "evolvemed",
    label: "Evolve Med",
    pool: "evolvemed",
    scopes: [
      {
        key: "genomics",
        label: "The DNA & Synthetic Genomics Layer",
        match: [
          "dna",
          "genome",
          "genetic",
          "gene ",
          "sequence",
          "cell",
          "codon",
          "chromosom",
          "rna",
        ],
      },
      {
        key: "engines",
        label: "The Core Therapeutic Engines",
        match: [
          "heal",
          "therap",
          "repair",
          "regenerat",
          "treatment",
          "medicine",
          "cure",
          "immune",
          "collagen",
        ],
      },
      {
        key: "medworld",
        label: "The Global Med-World",
        match: [
          "global",
          "epidemic",
          "public health",
          "hospital",
          "pandemic",
          "world",
          "planet",
          "gut",
        ],
      },
      {
        key: "interface",
        label: "The Meta-Biological Interface",
        match: [
          "mind",
          "conscious",
          "interface",
          "thought",
          "awareness",
          "memory",
          "dream",
        ],
      },
    ],
  },
  {
    id: "invent",
    label: "Invent",
    pool: "invent",
    scopes: [
      {
        key: "crucible",
        label: "The Crucible",
        match: [
          "build",
          "make",
          "create",
          "forge",
          "prototype",
          "material",
          "workshop",
          "tool",
          "repair",
          "machine",
        ],
      },
      {
        key: "namegiver",
        label: "The Name-Giver",
        match: ["name", "call it", "word", "language", "title", "letter"],
      },
      {
        key: "nature",
        label: "The Nature Mirror",
        match: [
          "nature",
          "garden",
          "plant",
          "tree",
          "animal",
          "river",
          "seed",
          "kite",
          "wind",
          "sky",
        ],
      },
      {
        key: "spark",
        label: "The Honest Spark",
        match: [
          "idea",
          "spark",
          "sketch",
          "imagination",
          "imagine",
          "begin",
          "doubt",
          "child",
          "story",
        ],
      },
    ],
  },
  {
    id: "manifesting",
    label: "Manifesting",
    pool: "mirroros",
    scopes: [
      {
        key: "mirrorformula",
        label: "The Mirror Formula",
        match: [
          "mirror",
          "reflection",
          "outer world",
          "rehears",
          "reflect",
          "same scene",
        ],
      },
      {
        key: "assumption",
        label: "The Assumption Formula",
        match: ["assum", "as if", "persist", "pretend"],
      },
      {
        key: "twoglass",
        label: "The Two-Glass Shift",
        match: ["glass", "shift", "door", "version", "choose"],
      },
      {
        key: "frequencylock",
        label: "The Frequency Lock",
        match: [
          "frequency",
          "vibration",
          "state",
          "tone",
          "tune",
          "hum",
          "coherence",
          "chest",
        ],
      },
      {
        key: "scripting",
        label: "The Scripting Method",
        match: ["script", "writ", "journal", "page", "pen", "story", "letter"],
      },
      {
        key: "vacuum",
        label: "The Vacuum Release",
        match: [
          "vacuum",
          "release",
          "letting go",
          "let go",
          "empty",
          "detach",
          "grip",
          "room",
        ],
      },
      {
        key: "intentions",
        label: "Aimed intentions",
        match: [
          "intention",
          "wish",
          "desire",
          "aim",
          "manifest",
          "goal",
          "money",
          "visualize",
          "ritual",
        ],
        pool: "manifest",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  THE ASSIGNMENT — computed once: every pool question pulled into    */
/*  the scope it resonates with; unmatched questions kept as the       */
/*  deep canopy each scope tops its rotation up from.                  */
/* ------------------------------------------------------------------ */

export interface ScopeNode extends SuggestionScope {
  /** The scope's six whispers, in pool order (ranked per context later). */
  rotation: string[];
}

export interface BranchNode extends SuggestionBranch {
  scopes: ScopeNode[];
}

interface ScopeBucket {
  matched: string[];
  rest: string[];
}

/** One branch's pools, split per scope by keyword resonance. */
function assignBranch(branch: SuggestionBranch): ScopeBucket[] {
  const buckets: ScopeBucket[] = branch.scopes.map(() => ({
    matched: [],
    rest: [],
  }));
  const pools = new Set<SuggestionScope["pool"] | SuggestionBranch["pool"]>(
    branch.scopes.map((s) => s.pool ?? branch.pool)
  );
  pools.add(branch.pool);
  for (const poolId of pools) {
    const questions = chatSuggestionPools[poolId as PoolId] ?? [];
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const lower = q.toLowerCase();
      let best = -1;
      let bestScore = 0;
      branch.scopes.forEach((scope, si) => {
        if ((scope.pool ?? branch.pool) !== poolId) return;
        let s = 0;
        for (const w of scope.match) if (lower.includes(w)) s++;
        if (s > bestScore) {
          bestScore = s;
          best = si;
        }
      });
      if (best >= 0) buckets[best].matched.push(q);
      /* unmatched questions stay in the canopy of every scope drawing
         from this pool — the rotation tops itself up from them */
      else
        for (let si = 0; si < buckets.length; si++)
          if ((branch.scopes[si].pool ?? branch.pool) === poolId)
            buckets[si].rest.push(q);
    }
  }
  return buckets;
}

/** Six whispers per scope — keyword matches first, canopy top-up after. */
function scopeRotation(
  bucket: ScopeBucket,
  scopeIndex: number
): string[] {
  const rotation = [...bucket.matched];
  const stride = 13;
  const offset = (scopeIndex * 5 + 3) % Math.max(1, bucket.rest.length);
  for (
    let i = 0;
    rotation.length < ROTATION && bucket.rest.length > 0;
    i++
  ) {
    const q = bucket.rest[(offset + i * stride) % bucket.rest.length];
    if (!rotation.includes(q)) rotation.push(q);
    if (i > bucket.rest.length * 2) break; /* safety — never spin */
  }
  return rotation.slice(0, ROTATION);
}

/** The static tree — rotations in pool order, ranked per context later. */
const STATIC_TREE: BranchNode[] = SUGGESTION_TREE.map((branch) => {
  const buckets = assignBranch(branch);
  return {
    ...branch,
    scopes: branch.scopes.map((scope, si) => ({
      ...scope,
      rotation: scopeRotation(buckets[si], si),
    })),
  };
});

/* ------------------------------------------------------------------ */
/*  THE LIVING RANKING — the same tree, with every scope's rotation    */
/*  re-ordered so the whispers closest to the conversation's last      */
/*  topic stand at its tip.                                            */
/* ------------------------------------------------------------------ */

export interface RankedLeaf {
  text: string;
  /** Resonance with the conversation (0 = no connection). */
  score: number;
}

export interface RankedScope extends ScopeNode {
  leaves: RankedLeaf[];
}

export interface RankedBranch extends BranchNode {
  scopes: RankedScope[];
  /** This branch's strongest single resonance with the conversation. */
  resonance: number;
}

export function buildSuggestionTree(
  contextText: string,
  seen?: string[]
): RankedBranch[] {
  const vocab = contextVocabulary(contextText);
  /* the memory of what was already offered — the tree never repeats
     itself: exact whispers and close siblings (same opening words)
     are withheld from every rotation before the ranking begins */
  const seenSet = new Set<string>();
  const seenOpenings = new Set<string>();
  if (seen && seen.length > 0) {
    for (const s of seen) {
      const norm = s.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
      if (norm) seenSet.add(norm);
      const opening = norm.split(/\s+/).slice(0, 5).join(" ");
      if (opening.split(" ").length >= 4) seenOpenings.add(opening);
    }
  }
  const isSeen = (text: string): boolean => {
    const norm = text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
    if (seenSet.has(norm)) return true;
    const opening = norm.split(/\s+/).slice(0, 5).join(" ");
    return opening.split(" ").length >= 4 && seenOpenings.has(opening);
  };
  return STATIC_TREE.map((branch) => {
    let resonance = 0;
    const scopes: RankedScope[] = branch.scopes.map((scope) => {
      /* the memory withholds what was already heard — but it never
         starves a scope: if every whisper was already offered, the
         rotation returns whole. The tree prefers a repeated whisper
         to an empty branch; there is always something to ask. */
      const kept =
        seen && seen.length > 0
          ? scope.rotation.filter((text) => !isSeen(text))
          : scope.rotation;
      const pool = kept.length > 0 ? kept : scope.rotation;
      const ranked = pool
        .map((text, i) => ({ text, i, score: scoreSuggestion(text, vocab) }))
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .map(({ text, score }) => ({ text, score }));
      resonance = Math.max(resonance, ranked[0]?.score ?? 0);
      return { ...scope, leaves: ranked };
    });
    return { ...branch, scopes, resonance };
  });
}
