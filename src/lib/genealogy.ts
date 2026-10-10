"use client";

import type { BranchType } from "@/lib/learning-branches";

/* ------------------------------------------------------------------ */
/*  THE GENEALOGY ENGINE — the family-tree method of the branches.     */
/*                                                                     */
/*  A batch is a family: the trunk forks, every fork forks again, and  */
/*  the whole house rises from the top of the input bar and spreads    */
/*  in all directions. Thirty whispers stand in one batch; the next    */
/*  thirty are grown in the idle breaths and stand ready before the    */
/*  visitor ever asks. Each batch arrives in harmonic waves — twelve   */
/*  voices, then twelve more after a few seconds, then the last six —  */
/*  so the tree proceeds with the context instead of dumping itself.   */
/*                                                                     */
/*  THE GPU LAW: this engine only ever computes positions once per     */
/*  batch. The browser's compositor owns every motion after that —    */
/*  native two-axis scrolling carries the walk, CSS keyframes carry    */
/*  the bloom. Not one requestAnimationFrame lives here.               */
/* ------------------------------------------------------------------ */

export interface GenealogySeed {
  text: string;
  movement: BranchType;
  score: number;
}

export interface GenealogyNode {
  id: string;
  text: string;
  movement: BranchType;
  score: number;
  /** 0-based generation of the whole tree (the trunk's children are 0). */
  gen: number;
  parent: string | null;
  /** The harmonic wave this node blooms in — never earlier than its parent. */
  wave: 0 | 1 | 2;
  /** The exchange's own grown branch — golden, standing nearest the root. */
  golden?: boolean;
  /** Canvas coordinates; x is the chip's center, y the chip's top. */
  x: number;
  y: number;
}

/** One generation of one batch, in pure topology form. */
export interface GenealogyRow {
  seeds: GenealogySeed[];
  /** parentLocal[i] = index into the previous row of the SAME batch (-1 = the trunk). */
  parentLocal: number[];
}

/** One batch in pure topology form — laid out later, together with all others. */
export interface GenealogyTopology {
  index: number;
  rows: GenealogyRow[];
  /** Frontier tips (global node ids) this batch grew from — empty for the seed. */
  fromTips: string[];
}

export interface GenealogyGeometry {
  chipW: number;
  chipH: number;
  step: number;
  rowH: number;
  trunkH: number;
  goldenRowH: number;
  width: number;
  height: number;
}

/** The harmonic waves: 12 voices, 12 after a breath, the last 6 after another. */
export const WAVE_COUNTS: [number, number, number] = [12, 12, 6];
export const BATCH_SIZE = WAVE_COUNTS[0] + WAVE_COUNTS[1] + WAVE_COUNTS[2]; // 30

/** The seed house — the first family the trunk raises (wide screens). */
const SEED_GENS_WIDE = [2, 4, 8, 16];
/** Narrow screens raise a taller, slimmer house — the same thirty. */
const SEED_GENS_NARROW = [2, 3, 5, 8, 12];

const CHIP_W_WIDE = 188;
const CHIP_W_NARROW = 124;
const CHIP_H_WIDE = 66;
const CHIP_H_NARROW = 64;
const STEP_WIDE = 206;
const STEP_NARROW = 134;
const ROW_H_WIDE = 126;
const ROW_H_NARROW = 104;
const TRUNK_H_WIDE = 92;
const TRUNK_H_NARROW = 72;
const GOLDEN_ROW_H = 92;
const SIDE_PAD = 30;

/* ------------------------- the geometry law ------------------------ */

export function genealogyGeometry(narrow: boolean): GenealogyGeometry {
  return narrow
    ? {
        chipW: CHIP_W_NARROW,
        chipH: CHIP_H_NARROW,
        step: STEP_NARROW,
        rowH: ROW_H_NARROW,
        trunkH: TRUNK_H_NARROW,
        goldenRowH: GOLDEN_ROW_H,
        width: 0,
        height: 0,
      }
    : {
        chipW: CHIP_W_WIDE,
        chipH: CHIP_H_WIDE,
        step: STEP_WIDE,
        rowH: ROW_H_WIDE,
        trunkH: TRUNK_H_WIDE,
        goldenRowH: GOLDEN_ROW_H,
        width: 0,
        height: 0,
      };
}

/* --------------------- the topology builders ----------------------- */

/**
 * The seed batch — the first family grown straight from the trunk:
 * generations fork upward and outward until thirty voices stand.
 */
export function buildSeedTopology(
  seeds: GenealogySeed[],
  goldenSeeds: GenealogySeed[],
  narrow: boolean
): GenealogyTopology {
  const gens = narrow ? SEED_GENS_NARROW : SEED_GENS_WIDE;
  const pool = seeds.slice(0, BATCH_SIZE);
  const rows: GenealogyRow[] = [];
  let cursor = 0;

  for (let g = 0; g < gens.length && cursor < pool.length; g++) {
    const want = Math.min(gens[g], pool.length - cursor);
    const parentCount = g === 0 ? 1 : rows[g - 1].seeds.length;
    const seedsRow: GenealogySeed[] = [];
    const parentLocal: number[] = [];
    for (let i = 0; i < want; i++, cursor++) {
      seedsRow.push(pool[cursor]);
      parentLocal.push(g === 0 ? -1 : i % parentCount);
    }
    rows.push({ seeds: seedsRow, parentLocal });
  }

  void goldenSeeds;
  return { index: 0, rows, fromTips: [] };
}

/**
 * The next family: thirty children of the current frontier — the tree
 * keeps expanding outward in every direction, generation after
 * generation, and never makes the visitor wait (the caller has already
 * grown this topology in the idle breaths).
 */
export function buildExtensionTopology(
  seeds: GenealogySeed[],
  frontier: { id: string }[]
): GenealogyTopology {
  const parents = frontier.length > 0 ? frontier : [{ id: "root" }];
  const seedsRow: GenealogySeed[] = [];
  const parentLocal: number[] = [];
  const pool = seeds.slice(0, BATCH_SIZE);
  for (let i = 0; i < pool.length; i++) {
    seedsRow.push(pool[i]);
    parentLocal.push(i % parents.length);
  }
  return { index: 0, rows: [{ seeds: seedsRow, parentLocal }], fromTips: parents.map((p) => p.id) };
}

/* --------------------------- the layout ---------------------------- */

export interface LaidTree {
  nodes: GenealogyNode[];
  byId: Map<string, GenealogyNode>;
  geometry: GenealogyGeometry;
  frontier: { id: string; gen: number }[];
  golden: GenealogyNode[];
  /** How many batches the tree carries. */
  batchCount: number;
}

/**
 * Lay every batch together — one coordinate space, re-centered as the
 * family widens, connectors readable from any parent to any child.
 */
export function layTree(
  topologies: GenealogyTopology[],
  goldenSeeds: GenealogySeed[],
  narrow: boolean
): LaidTree {
  const geo = genealogyGeometry(narrow);

  /* ---- pass 1: every row's span, and the canvas that holds them all */
  interface LaidRow {
    batch: number;
    row: number;
    count: number;
    span: number;
  }
  const laidRows: LaidRow[] = [];
  for (let b = 0; b < topologies.length; b++) {
    const topo = topologies[b];
    for (let r = 0; r < topo.rows.length; r++) {
      const count = topo.rows[r].seeds.length;
      const span = count * geo.step;
      laidRows.push({ batch: b, row: r, count, span });
    }
  }
  const goldenCount = Math.min(goldenSeeds.length, 6);
  const goldenSpan = goldenCount * (geo.chipW + 12);
  const widest = Math.max(
    0,
    ...laidRows.map((r) => r.span),
    goldenSpan,
    geo.chipW + geo.step * 2
  );
  const width = Math.max(widest + SIDE_PAD * 2, 640);

  /* ---- pass 2: vertical order — THE TREE RISES FROM THE TRUNK.
     The trunk holds the floor (bottom of the canvas, at the top of
     the input bar); the golden row stands nearest the root; every
     batch rises above the last, frontier at the very top. */
  const totalRows = laidRows.length;
  const goldenOff = goldenCount > 0 ? geo.goldenRowH : 0;
  const height =
    geo.trunkH + goldenOff + totalRows * geo.rowH + SIDE_PAD;
  const rowBase = (g: number) =>
    height - SIDE_PAD - geo.trunkH - goldenOff - (g + 1) * geo.rowH;
  const rowTop = new Map<string, number>();
  const rowGen = new Map<string, number>();
  for (let g = 0; g < laidRows.length; g++) {
    const r = laidRows[g];
    const key = `${r.batch}:${r.row}`;
    rowTop.set(key, rowBase(g));
    rowGen.set(key, g);
  }

  /* ---- pass 3: x positions — leaves slot in order, parents center
     over their children, every row centered over the canvas */
  const xById = new Map<string, number>();
  const idOf = new Map<string, string>(); // "batch:row:idx" → node id
  const nodes: GenealogyNode[] = [];

  for (const r of laidRows) {
    const key = `${r.batch}:${r.row}`;
    const topo = topologies[r.batch];
    const row = topo.rows[r.row];
    const left0 = (width - r.span) / 2;
    const gen = rowGen.get(key) ?? 0;
    const top = rowTop.get(key) ?? 0;

    row.seeds.forEach((seed, i) => {
      const id = `n${r.batch}.${r.row}.${i}`;
      idOf.set(`${r.batch}:${r.row}:${i}`, id);

      /* parent resolution — same batch's previous row, an earlier
         batch's frontier tip, or the trunk itself */
      let parent: string | null = null;
      const pl = row.parentLocal[i] ?? -1;
      if (r.row === 0 && topo.fromTips.length > 0) {
        parent = topo.fromTips[pl] ?? topo.fromTips[0];
      } else if (r.row === 0) {
        parent = null; /* the trunk */
      } else {
        parent = idOf.get(`${r.batch}:${r.row - 1}:${pl}`) ?? null;
      }

      /* the x law — slots first; children of earlier batches' tips lean
         toward their family in pass 3b below */
      const x = left0 + geo.step / 2 + i * geo.step;
      const node: GenealogyNode = {
        id,
        text: seed.text,
        movement: seed.movement,
        score: seed.score,
        gen,
        parent,
        wave: 2,
        golden: false,
        x,
        y: top,
      };
      xById.set(id, x);
      nodes.push(node);
    });
  }

  /* ---- pass 3b: children of frontier tips lean toward their parent —
     applied per family group, sliding each group to avoid overlap */
  for (let b = 0; b < topologies.length; b++) {
    const topo = topologies[b];
    if (topo.fromTips.length === 0 || topo.rows.length === 0) continue;
    const row = topo.rows[0];

    /* group children by parent tip, in the parents' own left-to-right order */
    const groups = new Map<string, number[]>();
    row.seeds.forEach((_, i) => {
      const tip = topo.fromTips[row.parentLocal[i] ?? 0] ?? topo.fromTips[0];
      const g = groups.get(tip);
      if (g) g.push(i);
      else groups.set(tip, [i]);
    });
    const orderedTips = [...groups.keys()].sort((a, b2) => {
      const ax = xById.get(a) ?? width / 2;
      const bx = xById.get(b2) ?? width / 2;
      return ax - bx;
    });

    let prevEnd = -Infinity;
    for (const tip of orderedTips) {
      const idxs = groups.get(tip)!;
      const px = xById.get(tip) ?? width / 2;
      const minCenter = Math.max(px, prevEnd + geo.step * (idxs.length / 2));
      const center = Math.max(
        minCenter,
        SIDE_PAD + (idxs.length * geo.step) / 2 - geo.step / 2
      );
      idxs.forEach((i, k) => {
        const id = `n${b}.0.${i}`;
        const x = center - ((idxs.length - 1) * geo.step) / 2 + k * geo.step;
        const node = nodes.find((n) => n.id === id);
        if (node) node.x = x;
        xById.set(id, x);
      });
      prevEnd = center + ((idxs.length - 1) * geo.step) / 2;
    }
  }

  /* ---- the golden row — the exchange's own branches, centered,
     standing nearest the trunk, blooming first */
  const goldenNodes: GenealogyNode[] = [];
  if (goldenCount > 0) {
    const x0 = width / 2 - goldenSpan / 2;
    const gy = height - SIDE_PAD - geo.trunkH - geo.goldenRowH + (geo.goldenRowH - geo.chipH) / 2;
    for (let i = 0; i < goldenCount; i++) {
      goldenNodes.push({
        id: `gold.${i}`,
        text: goldenSeeds[i].text,
        movement: goldenSeeds[i].movement,
        score: goldenSeeds[i].score,
        gen: -1,
        parent: null,
        wave: 0,
        golden: true,
        x: x0 + i * (geo.chipW + 12) + geo.chipW / 2,
        y: gy,
      });
    }
  }

  /* ---- pass 5: harmonic waves — by resonance, raised to never
     outrun the parent (a family never blooms upside down) */
  const baseWave = (rank: number): 0 | 1 | 2 =>
    rank < WAVE_COUNTS[0] ? 0 : rank < WAVE_COUNTS[0] + WAVE_COUNTS[1] ? 1 : 2;
  const waveOf = new Map<string, 0 | 1 | 2>();
  for (const g of goldenNodes) waveOf.set(g.id, 0);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const parentWave = n.parent ? (waveOf.get(n.parent) ?? 0) : 0;
    const w = Math.max(baseWave(i), parentWave) as 0 | 1 | 2;
    waveOf.set(n.id, w);
    n.wave = w;
  }

  const byId = new Map<string, GenealogyNode>();
  for (const n of [...goldenNodes, ...nodes]) byId.set(n.id, n);

  /* the frontier — the deepest row of the last batch invites the next */
  const frontier: { id: string; gen: number }[] = [];
  if (topologies.length > 0) {
    const lastIdx = topologies.length - 1;
    const last = topologies[lastIdx];
    const lastRowIdx = last.rows.length - 1;
    const lastRow = last.rows[lastRowIdx];
    for (let i = 0; i < lastRow.seeds.length; i++) {
      const id = idOf.get(`${lastIdx}:${lastRowIdx}:${i}`);
      if (id) frontier.push({ id, gen: rowGen.get(`${lastIdx}:${lastRowIdx}`) ?? 0 });
    }
  }

  return {
    nodes: [...goldenNodes, ...nodes],
    byId,
    geometry: { ...geo, width, height },
    frontier,
    golden: goldenNodes,
    batchCount: topologies.length,
  };
}
