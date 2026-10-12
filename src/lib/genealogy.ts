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
/*  THE READABILITY LAW. Every whisper shows its WHOLE text — nothing  */
/*  is ever clamped or cut. Each chip carries its own measured height  */
/*  (a bigger voice stands in a bigger box — that is welcome), and the */
/*  generations keep one generous breath of distance between them, so  */
/*  every suggestion is readable at a glance.                          */
/*                                                                     */
/*  THE NO-OVERLAP LAW. Rows hold one full connector gap between       */
/*  generations and every chip stands OPAQUE — a line can never touch  */
/*  a single word of a suggestion. A final sweep walks every row and   */
/*  widens the canvas rather than ever letting two whispers touch.     */
/*                                                                     */
/*  THE GRAFT LAW. When the visitor presses a whisper, a whole new     */
/*  sub-family is grown FROM that very chip — its topology carries the */
/*  parent's id, the layout seats its rows directly above their        */
/*  parent's row, and every row that stood above folds away (the       */
/*  choice prunes the speculation). The walk never loses its place.    */
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
  /** THE FAMILY'S LIGHT — the rope and the section wear this color;
      the words always wear the house's one text color. */
  accent?: string;
  /** THE CREATION WHISPER — an individual suggestion that is not
      information but a DOOR: the record, the book, the invention,
      born from this very branch ("topic" carries the whisper it
      grew from). One touch opens the creation's own theme page. */
  creation?: "akashic" | "book" | "invent";
  /** The whisper the creation is tied to — the branch's own words. */
  topic?: string;
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
  /** The family's own light — rope + section color (text stays one). */
  accent?: string;
  /** The creation door this chip carries (see GenealogySeed). */
  creation?: "akashic" | "book" | "invent";
  /** The whisper the creation is tied to — the branch's own words. */
  topic?: string;
  /** Canvas coordinates; x is the chip's center, y the chip's top. */
  x: number;
  y: number;
  /** The chip's own measured height — the whole text always fits. */
  h: number;
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
  /**
   * THE GRAFT — when set, this batch is a sub-family grown from the
   * named node: its rows seat directly above that node's row, and the
   * rows that stood above it are folded by the caller (maxLevel).
   */
  above?: string;
  /**
   * Every row of this batch hangs from the frontier tips themselves
   * (the extension batches — the next thirty, generation after
   * generation instead of one endless row).
   */
  hangAll?: boolean;
  /**
   * THE WING — when set, this batch grows out to one SIDE of the
   * family ("left" or "right"): its first row seats beyond the
   * family's edge instead of stacking on top, so the tree spreads in
   * every direction and never runs out of sky. Alternated batch by
   * batch, the walk extends sideways and upward together — infinite
   * in every direction.
   */
  wing?: "left" | "right";
  /**
   * THE ROOT — when set, this batch grows DOWNWARD: the family seats
   * below the trunk and descends generation by generation, flanking
   * the seed to one side. The tree fills the ground under its crown —
   * branches in every direction, and no empty corner anywhere.
   */
  root?: boolean;
}

export interface GenealogyGeometry {
  chipW: number;
  /** The typical chip height (the smallest box a whisper may stand in). */
  chipH: number;
  step: number;
  /** The generous breath of distance between two generations. */
  rowGap: number;
  trunkH: number;
  width: number;
  height: number;
  /** The Y where the trunk's base stands — the seed's own floor.
      Root rows descend BELOW this line; the floor anchor keeps this
      line at the seed, whatever the roots carry underneath. */
  trunkBaseY: number;
}

/** The harmonic waves: 12 voices, 12 after a breath, the last 6 after another. */
export const WAVE_COUNTS: [number, number, number] = [12, 12, 6];
export const BATCH_SIZE = WAVE_COUNTS[0] + WAVE_COUNTS[1] + WAVE_COUNTS[2]; // 30

/** The seed house — the first family the trunk raises (wide screens). */
const SEED_GENS_WIDE = [2, 4, 8, 16];
/** Narrow screens raise a taller, slimmer house — the same thirty. */
const SEED_GENS_NARROW = [2, 3, 5, 8, 12];

/* THE READABLE BOX — a wide enough line of text per chip, the WHOLE
   whisper inside it (measured, never clamped), and a generous breath
   of distance between the generations. The visitor asked for BIGGER
   sections that hold the whole question with air to spare. */
const CHIP_W_WIDE = 250;
const CHIP_W_NARROW = 184;
const STEP_WIDE = 268;
const STEP_NARROW = 198;
const ROW_GAP_WIDE = 56;
const ROW_GAP_NARROW = 48;
const TRUNK_H_WIDE = 92;
const TRUNK_H_NARROW = 72;
/** The golden row's own breath above the trunk. */
const GOLDEN_GAP = 22;
const SIDE_PAD = 30;

const CHIP_H_WIDE = 66;
const CHIP_H_NARROW = 62;
/* Chip anatomy — must mirror the rendered chip's own classes. */
const PAD_X_WIDE = 13; // px-[13px]
const PAD_X_NARROW = 11;
const PAD_Y = 9; // py-[9px]
const ICON_H = 13; // size-3.5 sigil
const ICON_GAP = 3;
const SAFETY_H = 6; // the box never pinches a descender

/* ------------------------- the text measure ------------------------ */

let measureCanvas: HTMLCanvasElement | null = null;

const SANS_STACK =
  'var(--font-jakarta, "Plus Jakarta Sans"), system-ui, -apple-system, sans-serif';
const SERIF_STACK = 'var(--font-literata, Georgia), "Times New Roman", serif';

/**
 * The greedy word-wrap of one whisper at a given width — measured by
 * the same canvas the browser lays out with, so the chip's box is cut
 * to its own words. Falls back to an honest estimate off-device.
 */
function measureLines(
  text: string,
  innerW: number,
  fontPx: number,
  font: string
): number {
  try {
    if (typeof document !== "undefined") {
      if (!measureCanvas) measureCanvas = document.createElement("canvas");
      const ctx = measureCanvas.getContext("2d");
      if (ctx) {
        ctx.font = `${fontPx}px ${font}`;
        const words = text.split(/\s+/).filter(Boolean);
        let lines = 1;
        let cur = "";
        for (const w of words) {
          const cand = cur ? `${cur} ${w}` : w;
          if (!cur || ctx.measureText(cand).width <= innerW) {
            cur = cand;
          } else {
            lines++;
            cur = w;
          }
        }
        return Math.max(1, lines);
      }
    }
  } catch {
    /* the honest estimate below carries it */
  }
  const perLine = Math.max(8, Math.floor(innerW / (fontPx * 0.52)));
  return Math.max(1, Math.ceil(text.length / perLine));
}

/** The measured height of one chip — the WHOLE text, never clamped. */
const heightCache = new Map<string, number>();
function chipHeight(text: string, narrow: boolean, serif: boolean): number {
  const key = `${narrow ? "n" : "w"}${serif ? "s" : "p"}:${text}`;
  const hit = heightCache.get(key);
  if (hit !== undefined) return hit;
  const padX = narrow ? PAD_X_NARROW : PAD_X_WIDE;
  const fontPx = narrow ? 12 : 13;
  const lineH = narrow ? 17 : 18;
  const innerW = (narrow ? CHIP_W_NARROW : CHIP_W_WIDE) - padX * 2;
  const font = serif
    ? `italic ${fontPx}px ${SERIF_STACK}`
    : `${fontPx}px ${SANS_STACK}`;
  const lines = measureLines(text, innerW, fontPx, font);
  const h = Math.max(
    narrow ? CHIP_H_NARROW : CHIP_H_WIDE,
    Math.ceil(PAD_Y * 2 + ICON_H + ICON_GAP + lines * lineH) + SAFETY_H
  );
  /* the cache holds one hour's grove at most, then steps aside */
  if (heightCache.size > 2400) heightCache.clear();
  heightCache.set(key, h);
  return h;
}

/* ------------------------- the geometry law ------------------------ */

export function genealogyGeometry(narrow: boolean): GenealogyGeometry {
  return narrow
    ? {
        chipW: CHIP_W_NARROW,
        chipH: CHIP_H_NARROW,
        step: STEP_NARROW,
        rowGap: ROW_GAP_NARROW,
        trunkH: TRUNK_H_NARROW,
        width: 0,
        height: 0,
      }
    : {
        chipW: CHIP_W_WIDE,
        chipH: CHIP_H_WIDE,
        step: STEP_WIDE,
        rowGap: ROW_GAP_WIDE,
        trunkH: TRUNK_H_WIDE,
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
 * grown this topology in the idle breaths). The thirty stand in tidy
 * generations — never one endless row: the first forks straight from
 * the frontier tips, and every next generation forks from the row
 * beneath it, so every family tie stays short and clean.
 */
export function buildExtensionTopology(
  seeds: GenealogySeed[],
  frontier: { id: string }[],
  narrow: boolean,
  wing?: "left" | "right"
): GenealogyTopology {
  const parents = frontier.length > 0 ? frontier : [{ id: "root" }];
  const cap = narrow ? 7 : 11;
  const pool = seeds.slice(0, BATCH_SIZE);
  const rows: GenealogyRow[] = [];
  for (let start = 0; start < pool.length; start += cap) {
    const chunk = pool.slice(start, start + cap);
    const seedsRow: GenealogySeed[] = [];
    const parentLocal: number[] = [];
    const parentCount =
      rows.length === 0 ? parents.length : rows[rows.length - 1].seeds.length;
    for (let i = 0; i < chunk.length; i++) {
      seedsRow.push(chunk[i]);
      parentLocal.push(i % parentCount);
    }
    rows.push({ seeds: seedsRow, parentLocal });
  }
  return {
    index: 0,
    rows,
    fromTips: parents.map((p) => p.id),
    ...(wing ? { wing } : {}),
  };
}

/**
 * THE ROOT — the undergrove: a family that grows DOWNWARD, flanking
 * the seed to one side. Its first row hangs from the trunk's base (or
 * from the deepest tips of its side's already-standing roots); every
 * later row forks again, the root system descending generation by
 * generation. The layout seats it below the trunk (root batches carry
 * negative levels).
 */
export function buildRootTopology(
  seeds: GenealogySeed[],
  tips: { id: string }[],
  narrow: boolean,
  side: "left" | "right"
): GenealogyTopology {
  const cap = narrow ? 5 : 6;
  const pool = seeds.slice(0, BATCH_SIZE);
  const rows: GenealogyRow[] = [];
  for (let start = 0; start < pool.length; start += cap) {
    const chunk = pool.slice(start, start + cap);
    const seedsRow: GenealogySeed[] = [];
    const parentLocal: number[] = [];
    const parentCount =
      rows.length === 0
        ? Math.max(1, tips.length)
        : rows[rows.length - 1].seeds.length;
    for (let i = 0; i < chunk.length; i++) {
      seedsRow.push(chunk[i]);
      /* the first row of a trunk-hung root rises from the trunk itself */
      parentLocal.push(tips.length === 0 && rows.length === 0 ? -1 : i % parentCount);
    }
    rows.push({ seeds: seedsRow, parentLocal });
  }
  return {
    index: 0,
    rows,
    fromTips: tips.map((t) => t.id),
    wing: side,
    root: true,
  };
}

/**
 * THE GRAFT — the sub-family born of a pressed whisper. The first row
 * forks straight from the pressed node; every later row forks again,
 * a whole house rising from that one choice. The layout seats it
 * directly above the pressed node's row (topology.above).
 */
export function buildGraftTopology(
  seeds: GenealogySeed[],
  parentId: string,
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
      parentLocal.push(g === 0 ? 0 : i % parentCount);
    }
    rows.push({ seeds: seedsRow, parentLocal });
  }
  return {
    index: 0,
    rows,
    fromTips: [parentId],
    above: parentId,
  };
}

/* --------------------------- the layout ---------------------------- */

export interface LaidTree {
  nodes: GenealogyNode[];
  byId: Map<string, GenealogyNode>;
  geometry: GenealogyGeometry;
  frontier: { id: string; gen: number }[];
  /** The deepest root tips per side — the frontier of the UNDERGROVE:
      the next root family hangs from these, descending still farther. */
  rootFrontier: { left: { id: string; gen: number }[]; right: { id: string; gen: number }[] };
  golden: GenealogyNode[];
  /** node id → its generation level in the whole tree (0 = nearest the trunk;
      negative levels are the root rows beneath it). */
  levelOf: Map<string, number>;
  /** How many batches the tree carries. */
  batchCount: number;
}

/**
 * Lay every batch together — one coordinate space, re-centered as the
 * family widens, connectors readable from any parent to any child.
 * `maxLevel` folds every row above that generation (the choice prunes
 * the speculation).
 */
export function layTree(
  topologies: GenealogyTopology[],
  goldenSeeds: GenealogySeed[],
  narrow: boolean,
  maxLevel?: number | null
): LaidTree {
  const geo = genealogyGeometry(narrow);

  /* ---- pass 1: generation levels — array order, with grafts seated
     directly above the node they grew from; every row above shifts up.
     Levels stay contiguous, so pruning a level folds a clean band. */
  interface LaidRow {
    batch: number;
    row: number;
    count: number;
    span: number;
    level: number;
    graftOf?: string;
  }
  const laidRows: LaidRow[] = [];
  const levelOfId = new Map<string, number>();
  for (let b = 0; b < topologies.length; b++) {
    const topo = topologies[b];
    /* where does the graft's parent row stand? */
    let seat = -1;
    if (topo.above) {
      /* the parent's level is known once its own batch was laid —
         the ids are deterministic: n{batch}.{row}.{i} */
      const m = topo.above.match(/^n(\d+)\.(\d+)\.(\d+)$/);
      if (m) {
        const pb = Number(m[1]);
        const pr = Number(m[2]);
        const found = laidRows.find(
          (lr) => lr.batch === pb && lr.row === pr
        );
        if (found) seat = found.level;
      }
    } else if (topo.wing && !topo.root) {
      /* THE WING'S OWN SEAT — the new family takes its place directly
         BESIDE the branch it sprouts from (often a mid-tree donor):
         the canopy spreads left and right at every height, instead of
         piling only toward the sky. Rows above shift up, exactly as a
         graft's house slides in between. */
      const m = topo.fromTips[0]?.match(/^n(\d+)\.(\d+)\.(\d+)$/);
      if (m) {
        const found = laidRows.find(
          (lr) => lr.batch === Number(m[1]) && lr.row === Number(m[2])
        );
        if (found) seat = found.level;
      }
    }
    if (seat < 0 && !topo.above && topo.root) {
      /* THE ROOT'S OWN LEVELS — the undergrove takes the negative
         floors beneath the trunk: row r seats at level −(r+1). The
         fold never reaches them (roots stand through every choice)
         and the grafts' upward shifts never disturb them. */
      topo.rows.forEach((row, r) => {
        laidRows.push({
          batch: b,
          row: r,
          count: row.seeds.length,
          span: row.seeds.length * geo.step,
          level: -(r + 1),
        });
      });
      topo.rows.forEach((row, r) => {
        row.seeds.forEach((_, i) => {
          levelOfId.set(`n${b}.${r}.${i}`, -(r + 1));
        });
      });
      continue;
    }
    if (seat >= 0) {
      /* every row already seated above the parent rises by this batch's
         height — the new house slides in between */
      const shift = topo.rows.length;
      for (const lr of laidRows) if (lr.level > seat) lr.level += shift;
      topo.rows.forEach((row, r) => {
        laidRows.push({
          batch: b,
          row: r,
          count: row.seeds.length,
          span: row.seeds.length * geo.step,
          level: seat + 1 + r,
          graftOf: topo.above,
        });
      });
    } else {
      const base =
        laidRows.length > 0
          ? Math.max(...laidRows.map((lr) => lr.level)) + 1
          : 0;
      topo.rows.forEach((row, r) => {
        laidRows.push({
          batch: b,
          row: r,
          count: row.seeds.length,
          span: row.seeds.length * geo.step,
          level: base + r,
        });
      });
    }
    /* record the ids this batch contributes (deterministic names) */
    topo.rows.forEach((row, r) => {
      const lr = laidRows.find((lr) => lr.batch === b && lr.row === r)!;
      row.seeds.forEach((_, i) => {
        levelOfId.set(`n${b}.${r}.${i}`, lr.level);
      });
    });
  }

  /* ---- the fold: rows above the pruned level never stand — except
     the house just planted by the choice itself (the newest graft
     rises directly above the pressed whisper; the fold clears the
     speculation that stood there before it) */
  const lastIdx = topologies.length - 1;
  const lastTopo = lastIdx >= 0 ? topologies[lastIdx] : null;
  const newestGraft = lastTopo?.above !== undefined;
  const keptRows = laidRows.filter(
    (lr) =>
      typeof maxLevel !== "number" ||
      lr.level <= maxLevel ||
      (newestGraft && lr.batch === lastIdx)
  );
  keptRows.sort((a, b2) => a.level - b2.level);
  /* the undergrove descends nearest-first: −1 hugs the trunk, −2
     stands beneath it, and so on down */
  const rootLaid = keptRows
    .filter((lr) => lr.level < 0)
    .sort((a, b2) => b2.level - a.level);
  const upRows = keptRows.filter((lr) => lr.level >= 0);

  /* ---- pass 2: the canvas that holds them all */
  const goldenCount = Math.min(goldenSeeds.length, 6);
  const goldenSpan = goldenCount * (geo.chipW + 12);
  let width = Math.max(
    0,
    ...keptRows.map((r) => r.span),
    goldenSpan,
    geo.chipW + geo.step * 2,
    640
  );

  /* ---- pass 3: vertical order — THE TREE RISES FROM THE TRUNK AND
     DESCENDS BENEATH IT. The trunk stands above the undergrove; the
     golden row rests nearest the root; every generation rises above
     the last, frontier at the very top — and the root families sink
     below the trunk, row beneath row, flanking the seed. Every row
     carries the FULL height its own whispers measured — a taller
     voice takes a taller band, and one generous breath of distance
     always separates the generations. */
  const rowHOf = new Map<string, number>();
  for (const r of keptRows) {
    const row = topologies[r.batch].rows[r.row];
    let h = geo.chipH;
    for (const s of row.seeds) h = Math.max(h, chipHeight(s.text, narrow, false));
    rowHOf.set(`${r.batch}:${r.row}`, h);
  }
  const goldenH =
    goldenCount > 0
      ? Math.max(
          geo.chipH,
          ...goldenSeeds
            .slice(0, goldenCount)
            .map((s) => chipHeight(s.text, narrow, true))
        )
      : 0;

  const upBlock =
    upRows.reduce((a, r) => a + (rowHOf.get(`${r.batch}:${r.row}`) ?? 0), 0) +
    geo.rowGap * upRows.length;
  const rootBlock =
    rootLaid.reduce((a, r) => a + (rowHOf.get(`${r.batch}:${r.row}`) ?? 0), 0) +
    geo.rowGap * rootLaid.length;
  const height = Math.ceil(
    SIDE_PAD * 2 +
      geo.trunkH +
      rootBlock +
      (goldenCount > 0 ? GOLDEN_GAP + goldenH : 0) +
      upBlock +
      8
  );

  /* the trunk's top — the crown rows seat upward from here, the
     undergrove descends from the trunk's base */
  const trunkTop = height - SIDE_PAD - geo.trunkH - rootBlock;
  const trunkBaseY = trunkTop + geo.trunkH;
  const rowTop = new Map<string, number>();
  const rowGen = new Map<string, number>();
  {
    let cursorY = trunkTop - (goldenCount > 0 ? GOLDEN_GAP + goldenH : 0);
    upRows.forEach((r, idx) => {
      const key = `${r.batch}:${r.row}`;
      cursorY -= geo.rowGap;
      rowTop.set(key, cursorY - (rowHOf.get(key) ?? 0));
      rowGen.set(key, idx);
      cursorY -= rowHOf.get(key) ?? 0;
    });
  }
  {
    let cursorY = trunkBaseY;
    rootLaid.forEach((r, idx) => {
      const key = `${r.batch}:${r.row}`;
      cursorY += geo.rowGap;
      rowTop.set(key, cursorY);
      rowGen.set(key, -(idx + 1));
      cursorY += rowHOf.get(key) ?? 0;
    });
  }

  /* ---- pass 4: x positions — leaves slot in order, parents center
     over their children, every row centered over the canvas */
  const xById = new Map<string, number>();
  const idOf = new Map<string, string>(); // "batch:row:idx" → node id
  const nodes: GenealogyNode[] = [];

  for (const r of keptRows) {
    const key = `${r.batch}:${r.row}`;
    const topo = topologies[r.batch];
    const row = topo.rows[r.row];
    const gen = rowGen.get(key) ?? 0;
    const top = rowTop.get(key) ?? 0;

    /* THE ROOT'S OWN SEAT — a trunk-hung root family's first row
       flanks the seed: one whole row beyond the trunk's side, its
       deeper rows descending beneath (centered over their own house,
       the branch below handles that). A root family hung from deeper
       root tips is dragged beneath them by the lean pass instead. */
    let left0 = (width - r.span) / 2;
    if (topo.root && r.row === 0 && topo.fromTips.length === 0) {
      const margin = geo.chipW * 0.62 + 26;
      left0 =
        topo.wing === "right"
          ? width / 2 + margin
          : width / 2 - margin - r.span;
    } else if (topo.wing && !topo.root && r.row === 0) {
      const tipXs = topo.fromTips
        .map((id) => xById.get(id))
        .filter((x): x is number => typeof x === "number");
      /* THE WING'S OWN BREATH — one generous gap between the donor
         branch and the family that sprouts from it, so every flank
         reads as its own house and the ropes stay readable */
      const margin = geo.step * 0.9;
      if (tipXs.length > 0) {
        const tmin = Math.min(...tipXs);
        const tmax = Math.max(...tipXs);
        left0 =
          topo.wing === "right" ? tmax + margin : tmin - r.span - margin;
      } else {
        let minX = Infinity;
        let maxX = -Infinity;
        for (const x of xById.values()) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
        if (!Number.isFinite(minX)) {
          minX = width / 2;
          maxX = width / 2;
        }
        left0 =
          topo.wing === "right" ? maxX + margin : minX - r.span - margin;
      }
    } else if (
      r.row > 0 &&
      (r.graftOf ||
        topologies[r.batch].fromTips.length > 0 ||
        topologies[r.batch].root)
    ) {
      const prevRow = topo.rows[r.row - 1];
      let sum = 0;
      let n = 0;
      prevRow.seeds.forEach((_, i) => {
        const pid = idOf.get(`${r.batch}:${r.row - 1}:${i}`);
        const px = pid ? xById.get(pid) : undefined;
        if (typeof px === "number") {
          sum += px;
          n++;
        }
      });
      if (n > 0) {
        const mean = sum / n;
        left0 = Math.min(
          Math.max(SIDE_PAD, mean - r.span / 2),
          Math.max(SIDE_PAD, width - SIDE_PAD - r.span)
        );
      }
    }

    row.seeds.forEach((seed, i) => {
      const id = `n${r.batch}.${r.row}.${i}`;
      idOf.set(`${r.batch}:${r.row}:${i}`, id);

      /* parent resolution — the extension's rows hang from the frontier
         tips themselves; the seed's first row rises from the trunk; a
         graft's first row rises from the pressed whisper; every deeper
         row forks from the row beneath it */
      let parent: string | null = null;
      const pl = row.parentLocal[i] ?? -1;
      if (topo.hangAll && topo.fromTips.length > 0) {
        parent = topo.fromTips[pl] ?? topo.fromTips[0];
      } else if (r.row === 0 && topo.fromTips.length > 0) {
        parent = topo.fromTips[pl] ?? topo.fromTips[0];
      } else if (r.row === 0) {
        parent = null; /* the trunk */
      } else {
        parent = idOf.get(`${r.batch}:${r.row - 1}:${pl}`) ?? null;
      }

      const x = left0 + geo.step / 2 + i * geo.step;
      const node: GenealogyNode = {
        id,
        text: seed.text,
        movement: seed.movement,
        score: seed.score,
        accent: seed.accent,
        creation: seed.creation,
        topic: seed.topic,
        gen,
        parent,
        wave: 2,
        golden: false,
        x,
        y: top,
        h: chipHeight(seed.text, narrow, false),
      };
      xById.set(id, x);
      nodes.push(node);
    });
  }

  /* ---- pass 5: children lean toward their parents — every row that
     hangs from frontier tips (extensions, graft roots) slides its
     family groups under the tips themselves, spaced by the law */
  for (let b = 0; b < topologies.length; b++) {
    const topo = topologies[b];
    if (topo.fromTips.length === 0 || topo.rows.length === 0) continue;
    /* THE WING keeps its own flank seat — the family must not be
       dragged back under the tips it grew from. A ROOT hung from
       deeper root tips leans beneath them like any other family. */
    if (topo.wing && !topo.root) continue;
    for (let rr = 0; rr < topo.rows.length; rr++) {
      const lr = keptRows.find((r) => r.batch === b && r.row === rr);
      if (!lr) continue; /* folded by the prune */
      const row = topo.rows[rr];
      if (rr > 0 && !topo.hangAll) continue; /* deeper rows center over their own family */

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
        /* THE SPACING LAW — one full step between families: the first
           chip of a house never leans on the last chip of the one before */
        const minCenter =
          prevEnd === -Infinity
            ? -Infinity
            : prevEnd + geo.step + ((idxs.length - 1) * geo.step) / 2;
        const center = Math.max(
          px,
          minCenter,
          SIDE_PAD + ((idxs.length - 1) * geo.step) / 2
        );
        idxs.forEach((i, k) => {
          const id = `n${b}.${rr}.${i}`;
          const x = center - ((idxs.length - 1) * geo.step) / 2 + k * geo.step;
          const node = nodes.find((n) => n.id === id);
          if (node) node.x = x;
          xById.set(id, x);
        });
        prevEnd = center + ((idxs.length - 1) * geo.step) / 2;
      }
    }
  }

  /* ---- pass 6: the sweep — every row walked once; two whispers can
     never stand closer than one step, and the canvas widens rather
     than ever clipping a family at its edge */
  {
    const byRow = new Map<string, GenealogyNode[]>();
    for (const r of keptRows) {
      byRow.set(`${r.batch}:${r.row}`, []);
    }
    for (const n of nodes) {
      const m = n.id.match(/^n(\d+)\.(\d+)\.(\d+)$/);
      if (!m) continue;
      const key = `${m[1]}:${m[2]}`;
      byRow.get(key)?.push(n);
    }
    let minX = Infinity;
    let maxX = -Infinity;
    for (const [, rowNodes] of byRow) {
      rowNodes.sort((a, b2) => a.x - b2.x);
      for (let i = 1; i < rowNodes.length; i++) {
        const need = rowNodes[i - 1].x + geo.step;
        if (rowNodes[i].x < need) {
          rowNodes[i].x = need;
          xById.set(rowNodes[i].id, need);
        }
      }
      for (const n of rowNodes) {
        minX = Math.min(minX, n.x - geo.chipW / 2);
        maxX = Math.max(maxX, n.x + geo.chipW / 2);
      }
    }
    if (minX < SIDE_PAD) {
      const dx = SIDE_PAD - minX;
      for (const n of nodes) n.x += dx;
      for (const [id, x] of xById) xById.set(id, x + dx);
      minX += dx;
      maxX += dx;
    }
    const needed = maxX - minX + SIDE_PAD * 2;
    if (needed > width) {
      const dx = (needed - width) / 2;
      for (const n of nodes) n.x += dx;
      for (const [id, x] of xById) xById.set(id, x + dx);
      width = Math.ceil(needed);
    }
  }

  /* ---- the golden row — the exchange's own branches, centered,
     standing nearest the trunk, blooming first; every chip aligned to
     the same floor line, whatever its own measured height */
  const goldenNodes: GenealogyNode[] = [];
  if (goldenCount > 0) {
    const x0 = width / 2 - goldenSpan / 2;
    const floor = trunkTop - GOLDEN_GAP;
    for (let i = 0; i < goldenCount; i++) {
      const h = chipHeight(goldenSeeds[i].text, narrow, true);
      goldenNodes.push({
        id: `gold.${i}`,
        text: goldenSeeds[i].text,
        movement: goldenSeeds[i].movement,
        score: goldenSeeds[i].score,
        accent: goldenSeeds[i].accent,
        gen: -1,
        parent: null,
        wave: 0,
        golden: true,
        x: x0 + i * (geo.chipW + 12) + geo.chipW / 2,
        y: floor - h,
        h,
      });
    }
  }

  /* ---- pass 7: harmonic waves — twelve voices at once, twelve after
     a breath, the last six after another — counted WITHIN each family,
     so a grafted house blooms the moment it is planted (its parent
     already stands — the visitor pressed it). A family never blooms
     upside down: within one batch, children never outrun their parent. */
  const baseWave = (rank: number): 0 | 1 | 2 =>
    rank < WAVE_COUNTS[0] ? 0 : rank < WAVE_COUNTS[0] + WAVE_COUNTS[1] ? 1 : 2;
  const waveOf = new Map<string, 0 | 1 | 2>();
  for (const g of goldenNodes) waveOf.set(g.id, 0);
  const batchRank = new Map<number, number>();
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const m = n.id.match(/^n(\d+)\./);
    const b = m ? Number(m[1]) : -1;
    const rank = batchRank.get(b) ?? 0;
    batchRank.set(b, rank + 1);
    /* the parent's wave binds only inside its own batch — a parent from
       an earlier batch is already standing in the tree */
    const sameBatchParent =
      n.parent && n.parent.startsWith(`n${b}.`)
        ? (waveOf.get(n.parent) ?? 0)
        : 0;
    const w = Math.max(baseWave(rank), sameBatchParent) as 0 | 1 | 2;
    waveOf.set(n.id, w);
    n.wave = w;
  }

  const byId = new Map<string, GenealogyNode>();
  for (const n of [...goldenNodes, ...nodes]) byId.set(n.id, n);

  /* the level each standing node occupies (grafts and all) */
  const levelOf = new Map<string, number>();
  for (const [id, lv] of levelOfId) {
    const m = id.match(/^n(\d+)\.(\d+)\.(\d+)$/);
    if (!m) continue;
    const standing = keptRows.some(
      (r) => r.batch === Number(m[1]) && r.row === Number(m[2])
    );
    if (standing) levelOf.set(id, lv);
  }

  /* the frontier — the topmost standing row invites the next family
     upward; the deepest root row of each side invites the next family
     downward (the undergrove keeps descending) */
  const frontier: { id: string; gen: number }[] = [];
  if (upRows.length > 0) {
    const top = upRows[upRows.length - 1];
    const topGen = rowGen.get(`${top.batch}:${top.row}`) ?? 0;
    for (let i = 0; i < top.count; i++) {
      const id = idOf.get(`${top.batch}:${top.row}:${i}`);
      if (id) frontier.push({ id, gen: topGen });
    }
  }
  const rootFrontier: LaidTree["rootFrontier"] = { left: [], right: [] };
  for (const side of ["left", "right"] as const) {
    const mine = rootLaid.filter(
      (lr) =>
        topologies[lr.batch].root && topologies[lr.batch].wing === side
    );
    if (mine.length === 0) continue;
    const deepest = mine.reduce((a, b2) => (a.level < b2.level ? a : b2));
    const gen = rowGen.get(`${deepest.batch}:${deepest.row}`) ?? 0;
    for (let i = 0; i < deepest.count; i++) {
      const id = idOf.get(`${deepest.batch}:${deepest.row}:${i}`);
      if (id) rootFrontier[side].push({ id, gen });
    }
  }

  return {
    nodes: [...goldenNodes, ...nodes],
    byId,
    geometry: { ...geo, width, height, trunkBaseY },
    frontier,
    rootFrontier,
    golden: goldenNodes,
    levelOf,
    batchCount: topologies.length,
  };
}
