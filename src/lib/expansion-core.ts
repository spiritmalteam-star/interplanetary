/* ------------------------------------------------------------------ */
/*  THE EXPANSION MIRROR — the algorithm that studies the walk.        */
/*                                                                     */
/*  Every branch the visitor follows is a continuation; the continu-   */
/*  ations, read together, are a portrait. This engine observes the    */
/*  portrait and returns a score — the Expansion Index — so every      */
/*  logged-in profile carries a mirror in which its own progression    */
/*  can be noticed, digitally: breadth of scopes, depth of chains,     */
/*  harmony with the received context, constancy of the visits, and    */
/*  the creative range of the movements chosen.                        */
/*                                                                     */
/*  The core is pure — the server's route and the client's local       */
/*  mirror run the very same law, so the mirror never disagrees with   */
/*  itself.                                                            */
/* ------------------------------------------------------------------ */

export type ExpansionEventKind = "pick" | "transmission" | "grow";

export interface ExpansionEventLite {
  kind: ExpansionEventKind;
  scope?: string | null;
  movement?: string | null;
  at: number;
}

export interface ExpansionSignals {
  /** Distinct scopes explored. */
  breadth: number;
  /** How deep the continuations run — chain length of the walk. */
  depth: number;
  /** How often a pick followed a received transmission — context harmony. */
  harmony: number;
  /** How constantly the visitor returns. */
  constancy: number;
  /** The range of learning movements chosen. */
  creation: number;
}

export interface ExpansionMirror {
  /** The Expansion Index — 0 to 100. */
  score: number;
  /** The stage of the garden, 0 to 5. */
  stage: number;
  signals: ExpansionSignals;
  totalPicks: number;
  chains: number;
  deepestChain: number;
  /** Growth since the previous reading — "the tree grew +6 this cycle". */
  delta: number;
  updatedAt: number;
}

/* ------------------------- the six stages --------------------------- */

export const EXPANSION_STAGES: {
  min: number;
  name: string;
  whisper: string;
}[] = [
  {
    min: 0,
    name: "The First Spark",
    whisper: "A first branch has turned toward the light.",
  },
  {
    min: 12,
    name: "The Awakened Root",
    whisper: "The walk has taken hold — roots drink in more than one soil.",
  },
  {
    min: 28,
    name: "The Standing Tree",
    whisper: "A trunk of your own now stands; the branches answer to it.",
  },
  {
    min: 46,
    name: "The Wide Canopy",
    whisper: "The canopy spreads in all directions — others rest in its shade.",
  },
  {
    min: 66,
    name: "The Singing Constellation",
    whisper: "Your continuations sing together — the walk has become a music.",
  },
  {
    min: 84,
    name: "The Infinite Garden",
    whisper: "The garden grows itself now. You are the creator of your reality.",
  },
];

export function stageForScore(score: number): number {
  let stage = 0;
  for (let i = 0; i < EXPANSION_STAGES.length; i++) {
    if (score >= EXPANSION_STAGES[i].min) stage = i;
  }
  return stage;
}

/* ------------------- the pure core — the study ---------------------- */

const CHAIN_GAP_MS = 45 * 60 * 1000; /* one walk = picks within 45 minutes */
const HARMONY_WINDOW_MS = 90 * 1000; /* a pick just after a transmission */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The algorithm that studies and observes the continuation of branches
 * and proceeds a score — the same law on the server and in the mirror.
 */
export function studyExpansion(
  events: ExpansionEventLite[],
  previousScore = 0
): ExpansionMirror {
  const sorted = [...events].sort((a, b) => a.at - b.at);
  const picks = sorted.filter((e) => e.kind === "pick");

  /* ---- the chains: a walk is a run of picks that hold together ---- */
  const chains: number[] = [];
  let run = 0;
  let lastAt = 0;
  for (const p of picks) {
    if (run > 0 && p.at - lastAt > CHAIN_GAP_MS) {
      chains.push(run);
      run = 0;
    }
    run += 1;
    lastAt = p.at;
  }
  if (run > 0) chains.push(run);

  const deepestChain = chains.reduce((m, c) => Math.max(m, c), 0);
  const avgChain =
    chains.length > 0 ? picks.length / chains.length : 0;

  /* ---- breadth: the scopes the walk has touched ------------------- */
  const scopes = new Set<string>();
  for (const p of picks) {
    if (p.scope) scopes.add(p.scope);
  }
  const breadth = Math.min(1, scopes.size / 6);

  /* ---- depth: how far a single walk reaches into the tree --------- */
  const depth = Math.min(1, (avgChain * 0.6 + deepestChain * 0.4) / 10);

  /* ---- harmony: picks that follow the received context ------------ */
  let transmissions = 0;
  let harmonic = 0;
  let tIdx = -1;
  const tTimes: number[] = [];
  for (const e of sorted) {
    if (e.kind === "transmission") {
      transmissions += 1;
      tTimes.push(e.at);
    }
  }
  for (const p of picks) {
    /* the latest transmission before this pick */
    while (tIdx + 1 < tTimes.length && tTimes[tIdx + 1] <= p.at) tIdx += 1;
    if (tIdx >= 0 && p.at - tTimes[tIdx] <= HARMONY_WINDOW_MS) harmonic += 1;
  }
  const harmony =
    picks.length === 0
      ? 0
      : transmissions === 0
        ? 0
        : Math.min(1, harmonic / Math.max(3, picks.length * 0.4));

  /* ---- constancy: the days the visitor returned ------------------- */
  const now = sorted.length > 0 ? sorted[sorted.length - 1].at : Date.now();
  const days = new Set<string>();
  for (const e of sorted) {
    const d = new Date(e.at);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  const recentDays = new Set<string>();
  for (const e of sorted) {
    if (now - e.at <= 14 * DAY_MS) {
      const d = new Date(e.at);
      recentDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }
  const constancy = Math.min(1, recentDays.size / 7);

  /* ---- creation: the range of movements chosen -------------------- */
  const movements = new Set<string>();
  for (const p of picks) {
    if (p.movement) movements.add(p.movement);
  }
  const creation = Math.min(1, movements.size / 7);

  /* ---- the Expansion Index ---------------------------------------- */
  const score = Math.round(
    100 *
      (0.24 * breadth +
        0.26 * depth +
        0.2 * harmony +
        0.16 * constancy +
        0.14 * creation)
  );
  const stage = stageForScore(score);

  return {
    score,
    stage,
    signals: { breadth, depth, harmony, constancy, creation },
    totalPicks: picks.length,
    chains: chains.length,
    deepestChain,
    delta: score - previousScore,
    updatedAt: now,
  };
}

