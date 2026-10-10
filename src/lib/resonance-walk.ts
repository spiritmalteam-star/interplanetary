/* ------------------------------------------------------------------ */
/*  THE RESONANCE WALK — v4.1, the quiet walk.                         */
/*                                                                     */
/*  The media constellation is retired: a room no longer carries a     */
/*  dream-book card, a sigil image, or a light-code frequency tone.    */
/*  The walk's ONE voice is the male narrator (lib/room-narrator.ts)   */
/*  — a man, the documentary register, reading each room's             */
/*  transmission aloud.                                                */
/*                                                                     */
/*  What remains is the walk's MEMORY — the Predictive Resonance       */
/*  Cache as a pure room registry and the session controller that      */
/*  follows the visitor's path. With nothing to pre-fetch (no images   */
/*  to decode, no audio to open, no tones to crossfade), the cache is  */
/*  bookkeeping so light it can never touch the network nor the main   */
/*  thread: the lag the media once carried is gone at the root.        */
/*                                                                     */
/*  THE PRUNING LAW — the walk stays light: nodes deeper than three    */
/*  steps from the standing place leave the map. Memory stays small;   */
/*  the walk stays weightless.                                         */
/*                                                                     */
/*  Client-safe: guards every window touch, no server imports.         */
/* ------------------------------------------------------------------ */

import { fnv1a } from "./hash";

/* ------------------------- 1. THE SHAPES --------------------------- */

/** The four resonant movements of the walk, spoken above every node. */
export type ResonanceCategory =
  | "REFLECT"
  | "CONTINUE THE WALK"
  | "INNER LIGHT"
  | "OUTER REALM";

/** One standing place of the walk. Nodes are born the moment the
    visitor reaches them; the registry knows them all. */
export interface ResonanceNode {
  id: string;
  parentId: string | null;
  category: ResonanceCategory;
  /** The whisper that opened this room. */
  title: string;
  /** The transmission — the answer, refreshed as it lands. */
  transmission: string;
  childrenIds: string[];
}

/** The node id of a question — deterministic, so the walk remembers
    its rooms by their words alone. */
export function walkNodeId(question: string): string {
  return `rn-${fnv1a(question.trim().toLowerCase()).toString(36)}`;
}

/* ------------------ 2. THE RESONANCE REGISTRY ---------------------- */

/** The cache keeps the rooms of the walk — nothing else. There is no
    media to pre-load anymore, so the old horizon pass is pure
    bookkeeping: it can never fetch, decode, or stutter. */
export class PredictiveResonanceCache {
  private nodeMap = new Map<string, ResonanceNode>();

  constructor(initialNodes: ResonanceNode[] = []) {
    initialNodes.forEach((node) => this.nodeMap.set(node.id, node));
  }

  public getNode(id: string): ResonanceNode | undefined {
    return this.nodeMap.get(id);
  }

  /** A room is entered — register it (or refresh its transmission). */
  public addNode(node: ResonanceNode): void {
    this.nodeMap.set(node.id, node);
  }

  /** THE HORIZON — once the pre-fetcher of sigils and tones; now the
      pruning sweep alone (the walk keeps only what stands near). */
  public precomputeHorizon(currentNodeId: string): void {
    this.prune(currentNodeId);
  }

  /** THE PRUNING LAW — release what the walk no longer stands near:
      nodes farther than `keepDepth` steps from the current room leave
      the map. */
  public prune(currentNodeId: string, keepDepth = 3): void {
    const current = this.nodeMap.get(currentNodeId);
    if (!current) return;

    const keep = new Set<string>([currentNodeId]);
    let frontier = [currentNodeId];
    for (let d = 0; d < keepDepth; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        const n = this.nodeMap.get(id);
        if (!n) continue;
        /* both directions — the walk may step back */
        if (n.parentId && this.nodeMap.has(n.parentId)) next.push(n.parentId);
        for (const c of n.childrenIds) if (this.nodeMap.has(c)) next.push(c);
      }
      next.forEach((id) => keep.add(id));
      frontier = next;
    }

    for (const id of [...this.nodeMap.keys()]) {
      if (!keep.has(id)) this.nodeMap.delete(id);
    }
  }

  /** How many rooms the walk currently remembers. */
  public get size(): number {
    return this.nodeMap.size;
  }
}

/* --------------------- 3. THE SESSION CONTROLLER ------------------- */

/** The walk's own controller — one per session (see getWalkSession). */
export class MirrorSessionController {
  private walkPath: string[] = [];

  constructor(private prc: PredictiveResonanceCache) {}

  /** The standing node of the walk (null before the first step). */
  public get currentNodeId(): string | null {
    return this.walkPath.length > 0
      ? this.walkPath[this.walkPath.length - 1]
      : null;
  }

  /**
   * THE NAVIGATION — the visitor steps onto a branch: the node is
   * registered and the walk is pruned to the rooms near it. The room
   * returns at once; the narrator (lib/room-narrator.ts) speaks for
   * the walk now, and only by the visitor's own hand.
   */
  public navigateToBranch(node: ResonanceNode): ResonanceNode {
    this.prc.addNode(node);
    this.walkPath.push(node.id);
    if (this.walkPath.length > 12) this.walkPath = this.walkPath.slice(-12);
    this.prc.prune(node.id);
    return node;
  }

  /** Re-anchor without moving — e.g. the same room refreshed. */
  public touch(nodeId: string): void {
    this.prc.prune(nodeId);
  }

  /** The room's shape, if the walk knows it. */
  public getNode(id: string): ResonanceNode | undefined {
    return this.prc.getNode(id);
  }

  /** A room registered without stepping onto it — a child waiting on
      the horizon, so the walk remembers where it may go next. */
  public register(node: ResonanceNode): void {
    this.prc.addNode(node);
  }

  /** THE SETTLING — the transmission has landed and the branches have
      grown: the node is refreshed (transmission + children). */
  public settle(node: ResonanceNode): void {
    this.prc.addNode(node);
  }

  public getWalkHistory(): string[] {
    return [...this.walkPath];
  }

  public rewind(): void {
    this.walkPath = [];
  }
}

/* ------------------- 4. THE SESSION SINGLETON ---------------------- */

let session: MirrorSessionController | null = null;

/** The one walk of this browser session. */
export function getWalkSession(): MirrorSessionController {
  if (typeof window === "undefined") {
    /* SSR safety — a memoryless shell */
    return new MirrorSessionController(new PredictiveResonanceCache());
  }
  if (!session) session = new MirrorSessionController(new PredictiveResonanceCache());
  return session;
}

/* ---------------- 5. THE WALK'S CATEGORIES ------------------------- */

/** The four movements of the walk, from the learning movement that
    grew the branch. */
export function categoryForMove(
  move: string | null | undefined
): ResonanceCategory {
  switch (move) {
    case "reflect":
    case "pause":
      return "REFLECT";
    case "apply":
    case "create":
      return "INNER LIGHT";
    case "contrast":
      return "OUTER REALM";
    default:
      return "CONTINUE THE WALK";
  }
}
