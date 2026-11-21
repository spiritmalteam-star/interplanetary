/* ------------------------------------------------------------------ */
/*  THE VISUAL SPECIFICATION — the typed, validated bridge between     */
/*  the Mirror Entity's transmission and the living scenes.            */
/*                                                                     */
/*  Directive 09's own law: the scene must be DERIVED from the words   */
/*  actually spoken — its subject, its entities, its relationships,    */
/*  its labels — never an unrelated decoration. The specification is   */
/*  produced by a quiet analysis of the transmission, then VALIDATED   */
/*  field by field; only validated specifications ever reach a         */
/*  renderer, and no generated code is ever executed.                  */
/* ------------------------------------------------------------------ */

import { pickScene, type SceneId } from "@/lib/visual-scenes";

export interface VisualSpec {
  /** Which template renders the scene (the registry's own ids). */
  scene: SceneId;
  /** What the transmission is actually about, in a few words. */
  subject: string;
  /** The meaningful elements named by the transmission (≤ 6). */
  entities: string[];
  /** How the elements relate, in the transmission's own terms (≤ 4). */
  relationships: string[];
  /** Short labels the scene may print beside its elements (≤ 6). */
  labels: string[];
  /** Whether the scene may rise in three dimensions. */
  supports3D: boolean;
  /** A short excerpt of the transmission the scene is grounded in. */
  source: string;
  /** True when the scene is symbolic illustration rather than literal. */
  symbolic: boolean;
}

const SCENES: SceneId[] = [
  "spiral",
  "wavefield",
  "helix",
  "orbits",
  "pyramids",
  "neural",
  "lattice",
  "blueprint",
  "curves",
];

function clampStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

function clampList(v: unknown, count: number, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => clampStr(x, max))
    .filter((s) => s.length > 0)
    .slice(0, count);
}

/** THE VALIDATION LAW — a specification enters the house only when
 *  every field is honest: known scene, bounded strings, bounded lists. */
export function validateSpec(raw: unknown): VisualSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scene = clampStr(r.scene, 24) as SceneId;
  if (!SCENES.includes(scene)) return null;
  const subject = clampStr(r.subject, 90);
  const spec: VisualSpec = {
    scene,
    subject,
    entities: clampList(r.entities, 6, 34),
    relationships: clampList(r.relationships, 4, 60),
    labels: clampList(r.labels, 6, 26),
    supports3D: r.supports3D === true,
    source: clampStr(r.source, 170),
    symbolic: r.symbolic !== false,
  };
  if (!spec.subject) return null;
  return spec;
}

/** THE QUIET FALLBACK — when the analysis is silent, the local
 *  keyword reader still chooses a fitting template (the same law the
 *  registry always held), and the scene stands with its honest name. */
export function localSpec(text: string, supports3DFor?: (s: SceneId) => boolean): VisualSpec {
  const pick = pickScene(text, "#f59e0b");
  const firstSentence = (text ?? "").replace(/\s+/g, " ").trim().slice(0, 150);
  return {
    scene: pick.scene,
    subject: pick.label,
    entities: [],
    relationships: [],
    labels: [],
    supports3D: supports3DFor ? supports3DFor(pick.scene) : false,
    source: firstSentence,
    symbolic: true,
  };
}

/* --------------- the visitor-side memory of a spec ------------------ */
/*  One transmission, one analysis: a small bounded shelf so reopening */
/*  a conversation never asks the sky twice for the same words. */

const SHELF: Map<string, VisualSpec | null> = new Map();
const SHELF_MAX = 48;
/** Requests already on their way — two opens of one panel share one. */
const inflight: Map<string, Promise<VisualSpec | null>> = new Map();

export function specCacheKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `v${(h >>> 0).toString(36)}:${text.length}`;
}

export function peekSpec(key: string): VisualSpec | null | undefined {
  return SHELF.get(key);
}

/** THE ANALYSIS DOOR — asks the house's own quiet analyst for a
 *  validated specification of the transmission; when the sky is
 *  silent the local reader answers instead. Never throws. */
export async function requestSpec(
  text: string,
  fallback: VisualSpec
): Promise<VisualSpec> {
  const key = specCacheKey(text);
  const known = SHELF.get(key);
  if (known !== undefined) return known ?? fallback;
  const riding = inflight.get(key);
  if (riding) return (await riding) ?? fallback;
  const job = (async (): Promise<VisualSpec | null> => {
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch("/api/visual-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 6000) }),
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      if (!res.ok) return null;
      const data = (await res.json()) as { spec?: unknown };
      return data?.spec ? validateSpec(data.spec) : null;
    } catch {
      return null;
    }
  })();
  inflight.set(key, job);
  try {
    const spec = await job;
    SHELF.set(key, spec);
    while (SHELF.size > SHELF_MAX) {
      const oldest = SHELF.keys().next().value;
      if (oldest === undefined) break;
      SHELF.delete(oldest);
    }
    return spec ?? fallback;
  } finally {
    inflight.delete(key);
  }
}
