/* ------------------------------------------------------------------ */
/*  THE BRANCHING NAVIGATOR'S OWN GRAPH LAW — pure, server-safe.       */
/*                                                                     */
/*  The main portal's wall of stone blocks becomes a living map of     */
/*  connected questions: one welcoming node at the heart, simple       */
/*  suggestions around it, and every branch leading to further         */
/*  branches — multidirectional, bounded, and stable. This module      */
/*  holds the graph's own mathematics: stable placement with collision */
/*  avoidance, the frontier's ear (when an unexplored direction is     */
/*  near), the depth of the walk, and the session's own keeping.       */
/*                                                                     */
/*  THE STABILITY LAW — a node is born at one position and never       */
/*  moves: new clusters are laid around their parent into free space,  */
/*  and the existing map never reorganizes.                            */
/*  THE BOUNDED LAW — the map, the cache and the expansions all carry  */
/*  explicit budgets; nothing grows without end.                       */
/* ------------------------------------------------------------------ */

import type { Edge, Node } from "@xyflow/react";
import type { BranchType } from "@/lib/learning-branches";
import { detectArtifactIntent } from "@/lib/artifact-intent";
import { isVisualIntent } from "@/lib/visual-intent";

/* ----------------------------- the shapes --------------------------- */

/** What a stone says it opens — carried straight from the wall's law. */
export type NavKind =
  | "mirror"
  | "image"
  | "creation"
  | "manifest"
  | "book"
  | "akashic";

/** The node's own role in the map. A "conversation" node is a branch
 *  that became a living conversation (the branch's own room). */
export type NavRole = "home" | "question" | "typed" | "creation" | "conversation";

export interface NavNodeData extends Record<string, unknown> {
  text: string;
  movement: BranchType;
  accent: string;
  kind: NavKind;
  role: NavRole;
  status: "idle" | "loading" | "failed";
  childCount: number;
  depth: number;
  parentId: string | null;
  creation?: "akashic" | "book" | "invent";
  topic?: string;
  reason?: string;
  focused?: boolean;
  inTrail?: boolean;
  golden?: boolean;
  revisits?: number;
  /** The living conversation this node carries (role "conversation"). */
  convId?: string;
}

export type NavNode = Node<NavNodeData>;

export interface NavEdgeData extends Record<string, unknown> {
  accent: string;
  cross?: boolean;
  reason?: string;
  trail?: boolean;
}

export type NavEdge = Edge<NavEdgeData>;

export interface SeedWhisper {
  text: string;
  movement: BranchType;
  accent: string;
  golden?: boolean;
  creation?: "akashic" | "book" | "invent";
  topic?: string;
}

/* ----------------------------- the budgets -------------------------- */

/** The map's whole depth — nodes stored, never more. */
export const NAV_MAX_NODES = 240;
/** Distant clusters summarized away when the budget is reached. */
export const NAV_PRUNE_TO = 170;
/** Cross-connections the map may carry. */
export const NAV_MAX_CROSS = 10;
/** Automatic frontier expansions per map, bounded. */
export const NAV_MAX_AUTO = 64;
/** Concurrent growth requests, bounded. */
export const NAV_MAX_INFLIGHT = 2;
/** The frontier's band — a fraction of the viewport's dimension. */
export const NAV_BAND = 0.24;
/** Hysteresis — the net movement (px) required before the next
    automatic expansion may fire: tiny wanderings never grow the map. */
export const NAV_HYSTERESIS = 110;
/** How many categories keep their map on the session's shelf. */
export const NAV_SHELF = 6;

/** The node's own measure (the card is fixed-width; the height bends
    a little — the average is used for centering mathematics). */
export const NAV_NODE_W = 232;
export const NAV_NODE_H = 104;
/** The resting distance between neighboring hearts. */
export const NAV_MIN_DIST = 228;

/* ------------------------- the simple seeds ------------------------- */

/** THE FIRST WORDS — the newcomer's own doors: short, familiar, one
    clear idea, warm and direct. No unexplained vocabulary. The deeper
    ground is never far — it grows as the walk deepens. */
export const NAV_SIMPLE_SEEDS: SeedWhisper[] = [
  { text: "What is on my mind?", movement: "reflect", accent: "#a78bfa" },
  { text: "What would help today?", movement: "deepen", accent: "#2dd4bf" },
  { text: "What do I want to understand?", movement: "deepen", accent: "#22d3ee" },
  { text: "What could I create?", movement: "create", accent: "#f59e0b" },
  { text: "What keeps pulling my attention?", movement: "reflect", accent: "#e879f9" },
  { text: "What am I carrying that I can set down?", movement: "pause", accent: "#34d399" },
  { text: "What would I say to a friend in my place?", movement: "connect", accent: "#fb7185" },
  { text: "What is one small step I could take?", movement: "apply", accent: "#fbbf24" },
];

/* --------------------------- tiny engines --------------------------- */

export function navHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What a whisper opens — the same law the wall carried. */
export function navKindForText(text: string): NavKind {
  const art = detectArtifactIntent(text);
  if (art) {
    if (art === "book") return "book";
    if (art === "akashic") return "akashic";
    if (art === "manifest") return "manifest";
    return "creation";
  }
  if (isVisualIntent(text)) return "image";
  return "mirror";
}

/* ------------------------- the seeded graph ------------------------- */

let navUid = 0;
export function navId(): string {
  navUid += 1;
  return `n${Date.now().toString(36)}${navUid.toString(36)}`;
}

function makeNode(
  seed: SeedWhisper,
  id: string,
  pos: { x: number; y: number },
  depth: number,
  parentId: string | null,
  extra?: Partial<NavNodeData>
): NavNode {
  const creation = seed.creation;
  return {
    id,
    type: "nav-question",
    position: pos,
    data: {
      text: seed.text,
      movement: seed.movement,
      accent: seed.accent,
      kind: creation ? (creation === "book" ? "book" : creation === "akashic" ? "akashic" : "creation") : navKindForText(seed.text),
      role: creation ? "creation" : "question",
      status: "idle",
      childCount: 0,
      depth,
      parentId,
      creation,
      topic: seed.topic,
      ...extra,
    },
  };
}

/** THE WELCOMING MAP — one home at the heart, five simple doors and
    (when the conversation has grown its own) one golden branch around
    it, laid on a gentle circle so every direction stands open. */
export function seedGraph(
  _whispers: SeedWhisper[],
  golden: SeedWhisper[],
  focusKey: string,
  homeText: string
): { nodes: NavNode[]; edges: NavEdge[]; homeId: string } {
  const rng = mulberry32(navHash(`seed:${focusKey}`));
  const home: NavNode = {
    id: "home",
    type: "nav-question",
    position: { x: -NAV_NODE_W / 2, y: -NAV_NODE_H / 2 },
    data: {
      text: homeText,
      movement: "reflect",
      accent: "var(--scope-a, var(--gd))",
      kind: "mirror",
      role: "home",
      status: "idle",
      childCount: 0,
      depth: 0,
      parentId: null,
    },
  };
  /* the simple doors — a fresh draw from the first words every time
     the map is born; the same hour draws the same map (no drift) */
  const pool = [...NAV_SIMPLE_SEEDS];
  const picked: SeedWhisper[] = [];
  const n = 5 + (rng() < 0.5 ? 1 : 0);
  while (picked.length < n && pool.length > 0) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  /* the conversation's own branch — the golden seed rides the first
     ring, wearing the amber light (never twice) */
  const gold = golden[0];
  const nodes: NavNode[] = [home];
  const edges: NavEdge[] = [];
  const edgeStyle = (accent: string, cross = false) => ({
    stroke: accent,
    strokeOpacity: cross ? 0.6 : 0.55,
    strokeWidth: cross ? 1 : 1.4,
    strokeDasharray: cross ? "3 5" : undefined,
  });
  const ring = picked.length;
  for (let i = 0; i < ring; i++) {
    const angle = (i / ring) * Math.PI * 2 + rng() * 0.5;
    const r = 262 + rng() * 46;
    const id = navId();
    nodes.push(
      makeNode(picked[i], id, { x: Math.cos(angle) * r - NAV_NODE_W / 2, y: Math.sin(angle) * r * 0.78 - NAV_NODE_H / 2 }, 1, "home")
    );
    edges.push({
      id: `e:${"home"}:${id}`,
      source: "home",
      target: id,
      type: "nav",
      data: { accent: picked[i].accent },
      style: edgeStyle(picked[i].accent),
    });
    home.data.childCount += 1;
  }
  if (gold) {
    const angle = rng() * Math.PI * 2;
    const r = 262 + 120;
    const id = navId();
    nodes.push(
      makeNode(gold, id, { x: Math.cos(angle) * r - NAV_NODE_W / 2, y: Math.sin(angle) * r * 0.78 - NAV_NODE_H / 2 }, 1, "home", { golden: true })
    );
    edges.push({
      id: `e:home:${id}`,
      source: "home",
      target: id,
      type: "nav",
      data: { accent: "#f59e0b" },
      style: edgeStyle("#f59e0b"),
    });
    home.data.childCount += 1;
  }
  return { nodes, edges, homeId: "home" };
}

/* --------------------- the placement's own law ---------------------- */

function collides(x: number, y: number, nodes: NavNode[]): boolean {
  for (const n of nodes) {
    const dx = n.position.x + NAV_NODE_W / 2 - x;
    const dy = n.position.y + NAV_NODE_H / 2 - y;
    if (dx * dx + dy * dy < NAV_MIN_DIST * NAV_MIN_DIST) return true;
  }
  return false;
}

/** THE INCREMENTAL LAY — children spread inside a cone around the
    direction they grew toward, never on top of what stands, never
    beyond a bounded reach. Returns positions only; the caller owns
    the map. */
export function placeAround(
  parent: { x: number; y: number },
  dirAngle: number,
  nodes: NavNode[],
  count: number,
  seed: number
): { x: number; y: number }[] {
  const rng = mulberry32(seed);
  const out: { x: number; y: number }[] = [];
  const spread = Math.PI * 0.62;
  const free = (x: number, y: number) =>
    !collides(x, y, nodes) &&
    !out.some((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return dx * dx + dy * dy < NAV_MIN_DIST * NAV_MIN_DIST;
    });
  for (let i = 0; i < count; i++) {
    let placed: { x: number; y: number } | null = null;
    let ang = dirAngle;
    let r = 248;
    for (let attempt = 0; attempt < 24 && !placed; attempt++) {
      const widen = attempt < 12 ? 1 : 1.9;
      ang = dirAngle + (rng() - 0.5) * 2 * spread * widen + attempt * 0.32;
      r = 248 + rng() * 78 + (attempt >= 12 ? 130 : 0);
      const x = parent.x + Math.cos(ang) * r;
      const y = parent.y + Math.sin(ang) * r * 0.8;
      if (free(x, y)) placed = { x: x - NAV_NODE_W / 2, y: y - NAV_NODE_H / 2 };
    }
    /* a crowded ground still grows — the golden spiral's patient
       word: wider and wider, always collision-free, never beyond a
       bounded reach */
    if (!placed) {
      ang = dirAngle + 2.399963 + i * 0.7;
      r = 320 + i * 70;
      for (let k = 0; k < 48 && !placed; k++) {
        ang += 0.41;
        r += 22;
        if (r > 1500) break;
        const x = parent.x + Math.cos(ang) * r;
        const y = parent.y + Math.sin(ang) * r * 0.8;
        if (free(x, y)) placed = { x: x - NAV_NODE_W / 2, y: y - NAV_NODE_H / 2 };
      }
    }
    /* the ground's very last word — place anyway (the caller's own
       set-updater resolves any remaining collision against the true
       latest map) */
    if (!placed) {
      placed = {
        x: parent.x + Math.cos(ang) * r - NAV_NODE_W / 2,
        y: parent.y + Math.sin(ang) * r * 0.8 - NAV_NODE_H / 2,
      };
    }
    out.push(placed);
  }
  return out;
}

/** THE SETTLING LAW — a node born where another now stands (two
    clusters grown at once) is nudged along a golden spiral until the
    ground is free. Runs inside the state updater, against the true
    latest map, so no concurrency ever overlaps the family. */
export function freePosition(
  node: NavNode,
  grown: NavNode[]
): { x: number; y: number } {
  const others = grown.filter((n) => n.id !== node.id);
  if (!collides(node.position.x + NAV_NODE_W / 2, node.position.y + NAV_NODE_H / 2, others))
    return node.position;
  const cx0 = node.position.x + NAV_NODE_W / 2;
  const cy0 = node.position.y + NAV_NODE_H / 2;
  const a0 = navHash(node.id) % 628 / 100;
  for (let k = 1; k <= 56; k++) {
    const ang = a0 + k * 2.399963;
    const r = k * 30;
    const x = cx0 + Math.cos(ang) * r;
    const y = cy0 + Math.sin(ang) * r * 0.8;
    if (!collides(x, y, others)) {
      return { x: x - NAV_NODE_W / 2, y: y - NAV_NODE_H / 2 };
    }
  }
  return node.position;
}

/* ------------------------ the frontier's ear ------------------------ */

export type NavDirection = "left" | "right" | "top" | "bottom";

export interface ViewportRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FrontierHit {
  nodeId: string;
  dir: NavDirection;
  dist: number;
}

/** The nearest unexplored branch to any viewport edge — the frontier
    the visitor's walk is approaching (or has deliberately reached). */
export function frontierPick(
  nodes: NavNode[],
  rect: ViewportRect,
  attempted: Set<string>
): FrontierHit | null {
  const w = rect.right - rect.left;
  const h = rect.bottom - rect.top;
  const bandX = w * NAV_BAND;
  const bandY = h * NAV_BAND;
  let best: FrontierHit | null = null;
  for (const n of nodes) {
    if (n.data.status !== "idle" || attempted.has(n.id)) continue;
    if (n.data.role === "creation" || n.data.role === "home") continue;
    const cx = n.position.x + NAV_NODE_W / 2;
    const cy = n.position.y + NAV_NODE_H / 2;
    /* the frontier must stand near the edge the walk approaches —
       ahead of it (outside) or just inside the band */
    if (cx > rect.right + bandX || cx < rect.left - bandX) continue;
    if (cy > rect.bottom + bandY || cy < rect.top - bandY) continue;
    const dRight = rect.right - cx;
    const dLeft = cx - rect.left;
    const dBottom = rect.bottom - cy;
    const dTop = cy - rect.top;
    const cand: { dir: NavDirection; dist: number; band: number }[] = [
      { dir: "right", dist: -dRight, band: bandX },
      { dir: "left", dist: -dLeft, band: bandX },
      { dir: "bottom", dist: -dBottom, band: bandY },
      { dir: "top", dist: -dTop, band: bandY },
    ];
    for (const c of cand) {
      /* ahead of the edge (dist < 0) counts double-near; inside the
         band (dist > 0) still counts while it remains in reach */
      const reach = c.dist < 0 ? -c.dist : c.dist * 2.2;
      if (reach > c.band) continue;
      if (!best || reach < best.dist) {
        best = { nodeId: n.id, dir: c.dir, dist: reach };
      }
    }
  }
  return best;
}

/** The angle a direction speaks in (graph radians). */
export function directionAngle(dir: NavDirection): number {
  switch (dir) {
    case "right":
      return 0;
    case "left":
      return Math.PI;
    case "bottom":
      return Math.PI / 2;
    case "top":
      return -Math.PI / 2;
  }
}

/** The angle from a node toward the map's edge it leans to — the
    direction its cluster should grow in. */
export function angleToward(
  from: { x: number; y: number },
  dir: NavDirection,
  center: { x: number; y: number }
): number {
  /* the cluster grows outward: away from the map's living centre and
     toward the frontier's own direction, blended */
  const outward = directionAngle(dir);
  const dx = from.x - center.x;
  const dy = from.y - center.y;
  const radial = Math.atan2(dy, dx);
  /* if the node already sits radial to the walk's heart, trust that
     radial line; otherwise trust the frontier's direction */
  return Math.abs(dx) + Math.abs(dy) < NAV_MIN_DIST ? outward : radial * 0.55 + outward * 0.45;
}

/* ---------------------- the depth of the walk ----------------------- */

/** The walker's depth spoken as the branch engine's own score. */
export function tierToScore(tier: number, bias: number): number {
  const base = [8, 26, 46, 66, 86][Math.min(Math.max(tier, 0), 4)];
  return Math.min(96, Math.max(4, base + bias * 18));
}

/* --------------------- the resonance of words ----------------------- */

function words(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of s.toLowerCase().match(/[a-zà-ÿа-я\u0400-\u04ff\u0370-\u03ff]{4,}/g) ?? []) {
    out.add(w);
  }
  return out;
}

/** How strongly two whispers speak the same ground (0..1). */
export function overlapWords(a: string, b: string): number {
  const sa = words(a);
  const sb = words(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared++;
  return shared / Math.min(sa.size, sb.size);
}

/* ------------------- the session's own keeping ---------------------- */
/*  The map lives in memory by default — nothing travels, nothing is
    written down unless the visitor asks. One shelf per focused
    category, the shelf bounded, the visitor's return exact. */

export interface NavSnapshot {
  nodes: NavNode[];
  edges: NavEdge[];
  camera: { x: number; y: number; zoom: number } | null;
  selectedId: string | null;
  /** The focus's own trail — the questions the walk stood on, in order. */
  trail: string[];
  notes: Record<string, string>;
  depthBias: number;
  attempted: string[];
  autoCount: number;
  crossCount: number;
  homeId: string;
  persistOk: boolean;
  at: number;
}

const PERSIST_KEY = "mirror:navigator-map";
const mem = new Map<string, NavSnapshot>();

function touch(key: string, snap: NavSnapshot): void {
  mem.delete(key);
  mem.set(key, snap);
  while (mem.size > NAV_SHELF) {
    const oldest = mem.keys().next().value;
    if (oldest === undefined) break;
    mem.delete(oldest);
  }
}

function readPersistent(): Record<string, NavSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, NavSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function peekSnapshot(key: string): NavSnapshot | null {
  const mine = mem.get(key);
  if (mine) return mine;
  /* the visitor's own kept journey — only when they asked for it */
  try {
    if (typeof window !== "undefined" && window.localStorage.getItem(`${PERSIST_KEY}:ok`) === "1") {
      const all = readPersistent();
      const snap = all[key];
      if (snap && Array.isArray(snap.nodes) && snap.nodes.length > 0) {
        snap.persistOk = true;
        touch(key, snap);
        return snap;
      }
    }
  } catch {
    /* quiet */
  }
  return null;
}

export function saveSnapshot(key: string, snap: NavSnapshot): void {
  snap.at = Date.now();
  touch(key, snap);
  if (snap.persistOk && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(`${PERSIST_KEY}:ok`, "1");
      const all = readPersistent();
      all[key] = snap;
      /* the kept shelf is bounded too — the newest six maps */
      const entries = Object.entries(all)
        .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
        .slice(0, NAV_SHELF);
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      /* a closed vault holds no grudge */
    }
  }
}

export function dropSnapshot(key: string): void {
  mem.delete(key);
  try {
    if (typeof window === "undefined") return;
    const all = readPersistent();
    if (all[key]) {
      delete all[key];
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(all));
    }
  } catch {
    /* quiet */
  }
}

export function setPersistOk(ok: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (ok) window.localStorage.setItem(`${PERSIST_KEY}:ok`, "1");
    else {
      window.localStorage.removeItem(`${PERSIST_KEY}:ok`);
      window.localStorage.removeItem(PERSIST_KEY);
    }
  } catch {
    /* quiet */
  }
}

/** A distant cluster laid to rest — its compact data kept on the
    shelf so the walk can return without asking the sky again. */
export function pruneGraph(nodes: NavNode[], edges: NavEdge[], homeId: string): {
  nodes: NavNode[];
  edges: NavEdge[];
  pruned: number;
} {
  if (nodes.length <= NAV_MAX_NODES) return { nodes, edges, pruned: 0 };
  /* BFS depth from the home — the farthest leaves rest first.
     THE VISITOR'S ROOMS NEVER REST — a living conversation is the
     walker's own kept exchange; it is never pruned away. */
  const sorted = [...nodes]
    .filter(
      (n) =>
        n.id !== homeId &&
        n.data.role !== "home" &&
        n.data.role !== "conversation"
    )
    .sort((a, b) => b.data.depth - a.data.depth || b.data.childCount - a.data.childCount);
  const remove = new Set<string>();
  for (const n of sorted) {
    if (nodes.length - remove.size <= NAV_PRUNE_TO) break;
    remove.add(n.id);
  }
  const kept = nodes.filter((n) => !remove.has(n.id));
  const keptEdges = edges.filter((e) => !remove.has(e.source) && !remove.has(e.target));
  return { nodes: kept, edges: keptEdges, pruned: remove.size };
}
