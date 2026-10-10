/* ------------------------------------------------------------------ */
/*  THE RESONANCE WALK — v4.0 engine of the Mirror Entity.             */
/*                                                                     */
/*  Two instruments, one law: the walk never stutters.                 */
/*                                                                     */
/*  THE PREDICTIVE RESONANCE CACHE (PRC) — the walk's memory and       */
/*  horizon. Every node the visitor stands on is known to it; the      */
/*  media of the children and the grandchildren (d ≤ 2) are computed   */
/*  and pre-loaded BEFORE the visitor ever presses them, so a pressed  */
/*  branch opens with its frequency and its sigil already resident in  */
/*  the browser — no network wait, no main-thread stutter, no jank.    */
/*                                                                     */
/*  THE SESSION CONTROLLER — the cognitive walk itself: which nodes    */
/*  were stood upon, in which order, and the ambient light-code        */
/*  frequency of the current node, crossfaded smoothly every time the  */
/*  walk moves. The visitor's own hand (the sound gate) enables the    */
/*  field's voice once — autoplay laws are honored, never fought.      */
/*                                                                     */
/*  THE PRUNING LAW — the walk stays light: nodes deeper than three    */
/*  steps from the standing place leave the map, and preload marks      */
/*  beyond the current horizon are released. Memory stays small; the   */
/*  walk stays weightless.                                             */
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

/** A dream book archetype waiting on a branch (the Dream Book atelier
    weaves the full volume when the visitor opens it). */
export interface DreamBookPayload {
  title: string;
  targetReader:
    | "Little dreamers"
    | "Young readers"
    | "Teens"
    | "Grown dreamers"
    | "All ages";
  /** 1: clear daylight → 5: multidimensional. */
  depthLevel: 1 | 2 | 3 | 4 | 5;
  summary: string;
}

/** A light-code frequency — the ambient voice of a node. */
export interface LightCodeMusicPayload {
  trackId: string;
  /** e.g. "432Hz — Lyran Memory". */
  ambientFrequency: string;
  streamUrl: string;
}

export interface MediaPayload {
  book?: DreamBookPayload;
  music?: LightCodeMusicPayload;
  image?: {
    imageUrl: string;
    /** The question whose resonance shaped this sigil. */
    prompt: string;
  };
}

/** One standing place of the walk. Nodes are born the moment the
    visitor reaches them; the cache knows them all. */
export interface ResonanceNode {
  id: string;
  parentId: string | null;
  category: ResonanceCategory;
  /** The whisper that opened this room. */
  title: string;
  /** The transmission — the answer, streamed in as it lands. */
  transmission: string;
  media: MediaPayload;
  childrenIds: string[];
}

/** The node id of a question — deterministic, so the walk remembers
    its rooms by their words alone. */
export function walkNodeId(question: string): string {
  return `rn-${fnv1a(question.trim().toLowerCase()).toString(36)}`;
}

/* ------------------ 2. THE PREDICTIVE RESONANCE CACHE -------------- */

export class PredictiveResonanceCache {
  private nodeMap = new Map<string, ResonanceNode>();
  private preloadedAssets = new Set<string>();

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

  /**
   * THE HORIZON — pre-load the standing room's own media first (the
   * first room of a session was never anyone's child), then the media
   * of the children (depth 1) and the grandchildren (depth 2). Called
   * on every registration; by the time a branch is pressed, its sigil
   * is decoded and its frequency is known to the browser.
   */
  public precomputeHorizon(currentNodeId: string): void {
    if (typeof window === "undefined") return;
    const current = this.nodeMap.get(currentNodeId);
    if (!current) return;

    this.preloadMediaAssets(current);
    current.childrenIds.forEach((childId) => {
      const child = this.nodeMap.get(childId);
      if (!child) return;
      this.preloadMediaAssets(child);
      child.childrenIds.forEach((grandChildId) => {
        const grandChild = this.nodeMap.get(grandChildId);
        if (grandChild) this.preloadMediaAssets(grandChild);
      });
    });
  }

  /** Images decode into memory; audio learns its metadata — quietly,
      off the render path, once per asset per session. Only what the
      room truly carries is preloaded — nothing is invented. */
  private preloadMediaAssets(node: ResonanceNode): void {
    if (typeof window === "undefined") return;
    if (this.preloadedAssets.has(node.id)) return;
    this.preloadedAssets.add(node.id);

    if (node.media.image?.imageUrl) {
      const img = new Image();
      img.decoding = "async";
      img.src = node.media.image.imageUrl;
    }
    if (node.media.music?.streamUrl) {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = node.media.music.streamUrl;
    }
  }

  /** THE PRUNING LAW — release what the walk no longer stands near:
      nodes farther than `keepDepth` steps from the current room leave
      the map, and their preload marks are freed with them. */
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
      if (!keep.has(id)) {
        this.preloadedAssets.delete(id);
        this.nodeMap.delete(id);
      }
    }
    for (const id of [...this.preloadedAssets]) {
      if (!keep.has(id)) this.preloadedAssets.delete(id);
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
  private activeAudio: HTMLAudioElement | null = null;
  private fadeTimer: number | null = null;
  /** The visitor's own gate — the field stays silent until opened. */
  public soundEnabled = false;

  constructor(private prc: PredictiveResonanceCache) {}

  /** The standing node of the walk (null before the first step). */
  public get currentNodeId(): string | null {
    return this.walkPath.length > 0
      ? this.walkPath[this.walkPath.length - 1]
      : null;
  }

  /**
   * THE NAVIGATION — the visitor steps onto a branch: the node is
   * registered, the horizon is pre-computed, and if the field's voice
   * is open, the ambient frequency crossfades to the new room's own
   * tone. Returns the node so the room can render it at once.
   */
  public navigateToBranch(node: ResonanceNode): ResonanceNode {
    this.prc.addNode(node);
    this.walkPath.push(node.id);
    if (this.walkPath.length > 12) this.walkPath = this.walkPath.slice(-12);

    /* the horizon is prepared the moment the foot lands */
    this.prc.precomputeHorizon(node.id);
    /* and the rooms one step back are kept too — the walk walks back */
    const parent = node.parentId ? this.prc.getNode(node.parentId) : null;
    if (parent) this.prc.precomputeHorizon(parent.id);

    if (this.soundEnabled && node.media.music?.streamUrl) {
      this.crossfadeAudio(node.media.music.streamUrl);
    }
    this.prc.prune(node.id);
    return node;
  }

  /** Re-anchor without moving — e.g. the same room refreshed. */
  public touch(nodeId: string): void {
    this.prc.precomputeHorizon(nodeId);
  }

  /** The room's shape, if the walk knows it. */
  public getNode(id: string): ResonanceNode | undefined {
    return this.prc.getNode(id);
  }

  /** A room registered without stepping onto it — a child waiting on
      the horizon, so its media can be pre-loaded before its visit. */
  public register(node: ResonanceNode): void {
    this.prc.addNode(node);
  }

  /** THE SETTLING — the transmission has landed and the branches have
      grown: the node is refreshed (transmission + children) and the
      horizon is pre-computed again, so every child's sigil and
      frequency are resident BEFORE the visitor presses them. */
  public settle(node: ResonanceNode): void {
    this.prc.addNode(node);
    this.prc.precomputeHorizon(node.id);
  }

  public getWalkHistory(): string[] {
    return [...this.walkPath];
  }

  public rewind(): void {
    this.walkPath = [];
  }

  /** THE FIELD'S VOICE — opened by the visitor's own hand. */
  public enableSound(): void {
    this.soundEnabled = true;
    const id = this.currentNodeId;
    const node = id ? this.prc.getNode(id) : null;
    if (node?.media.music?.streamUrl) {
      this.crossfadeAudio(node.media.music.streamUrl);
    }
  }

  public disableSound(): void {
    this.soundEnabled = false;
    this.stopAudio();
  }

  /** The smooth crossfade — the previous stream breathes out while the
      new one breathes in; two overlapping elements, interval-driven
      ramps, no main-thread cost beyond ten tiny steps per breath. */
  private crossfadeAudio(newUrl: string): void {
    if (typeof window === "undefined") return;

    const tail = newUrl.split("/").pop() ?? "";
    const old = this.activeAudio;
    /* the same tone already breathing — let it continue */
    if (old && old.src.split("/").pop() === tail) {
      if (old.paused) old.play().catch(() => {});
      return;
    }

    if (old) {
      let volume = old.volume;
      const fadeOut = window.setInterval(() => {
        volume -= 0.1;
        if (volume <= 0) {
          old.pause();
          window.clearInterval(fadeOut);
        } else {
          old.volume = volume;
        }
      }, 100);
    }

    const next = new Audio(newUrl);
    next.loop = true;
    next.volume = 0;
    next.play().catch(() => {
      /* the autoplay law — the gate stays open for the next gesture */
    });
    let inVolume = 0;
    if (this.fadeTimer) window.clearInterval(this.fadeTimer);
    this.fadeTimer = window.setInterval(() => {
      inVolume += 0.1;
      if (inVolume >= 0.55) {
        next.volume = 0.55;
        window.clearInterval(this.fadeTimer ?? 0);
        this.fadeTimer = null;
      } else {
        next.volume = inVolume;
      }
    }, 120);

    this.activeAudio = next;
  }

  private stopAudio(): void {
    if (this.fadeTimer) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
  }
}

/* ------------------- 4. THE SESSION SINGLETON ---------------------- */

let session: MirrorSessionController | null = null;

/** The one walk of this browser session. */
export function getWalkSession(): MirrorSessionController {
  if (typeof window === "undefined") {
    /* SSR safety — a voiceless, memoryless shell */
    return new MirrorSessionController(new PredictiveResonanceCache());
  }
  if (!session) session = new MirrorSessionController(new PredictiveResonanceCache());
  return session;
}

/* ---------------- 5. THE DETERMINISTIC MEDIA SEED ------------------ */

import {
  RESONANCE_BOOKS,
  RESONANCE_FREQUENCIES,
  RESONANCE_SIGILS,
} from "./data/resonance-media";

/** The frequency a question's resonance hums at — deterministic. */
export function seededFrequency(seed: string): LightCodeMusicPayload {
  const pick = RESONANCE_FREQUENCIES[fnv1a(`fr-${seed}`) % RESONANCE_FREQUENCIES.length];
  return { ...pick };
}

/** The sigil shaped by a question's resonance — deterministic; the
    prompt stays honest: it IS the question the walk stood upon. */
export function seededImage(
  question: string,
  seed?: string
): { imageUrl: string; prompt: string } {
  const pick =
    RESONANCE_SIGILS[fnv1a(`sg-${seed ?? question}`) % RESONANCE_SIGILS.length];
  return { imageUrl: pick.imageUrl, prompt: question };
}

/** The dream-book archetype waiting on a branch — deterministic. */
export function seededBook(seed: string): DreamBookPayload {
  const pick = RESONANCE_BOOKS[fnv1a(`bk-${seed}`) % RESONANCE_BOOKS.length];
  return { ...pick };
}

/** THE MEDIA CONSTELLATION OF A ROOM — which cards rise in stage 3.
    The frequency always hums; the sigil and the book stir by the
    question's own draw (r varies across six weathers, so some rooms
    carry one card, some two, some three — sections may differ in
    size; the distance between them is always kept). */
export function mediaForQuestion(
  question: string,
  parentId: string | null,
  category: ResonanceCategory
): MediaPayload {
  const id = walkNodeId(question);
  const r = fnv1a(`wx-${question.trim().toLowerCase()}`) % 6;
  const media: MediaPayload = {
    music: seededFrequency(`${question}|${id}`),
  };
  if (r !== 3 && r !== 5) media.image = seededImage(question, id);
  if (r === 2 || r === 3) media.book = seededBook(`${question}|${parentId ?? category}`);
  return media;
}

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

