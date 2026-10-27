"use client";

import {
  AlertTriangle,
  Cog,
  Lightbulb,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { Edge, Node } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/*  THE INVENTION LAB'S OWN TYPES — one honest shelf for the canvas:   */
/*  the four kinds of pieces, their accents, and the draft keep.       */
/*                                                                     */
/*  THE KEEP'S LAW — the canvas rests on the device (localStorage),    */
/*  exactly like the room's own words: the Mirror's rooms keep their   */
/*  memory on the visitor's device, never on a server. Layout drafts   */
/*  are the house's allowed luggage (only MP3s are banned).            */
/* ------------------------------------------------------------------ */

/** the four kinds of lab pieces */
export type InventionNodeKind = "idea" | "component" | "evidence" | "risk";

export type InventionNodeData = {
  kind: InventionNodeKind;
  /** the piece's name — short, plain */
  name: string;
  /** the piece's note — what it means, how it works, what it proves */
  note: string;
};

/** a lab node as React Flow wears it */
export type InventionNode = Node<InventionNodeData, "invention">;

export const INVENTION_KINDS: InventionNodeKind[] = [
  "idea",
  "component",
  "evidence",
  "risk",
];

/* THE KINDS' OWN ACCENTS — the standing law of the canvas:
   idea amber-300 · component lavender · evidence cyan · risk rose-400.
   No default blue, no indigo — the forge's own four lights. */
export const KIND_META: Record<
  InventionNodeKind,
  { label: string; icon: LucideIcon; accent: string }
> = {
  idea: { label: "Idea", icon: Lightbulb, accent: "#fcd34d" },
  component: { label: "Component", icon: Cog, accent: "#c4b5fd" },
  evidence: { label: "Evidence", icon: Search, accent: "#67e8f9" },
  risk: { label: "Risk", icon: AlertTriangle, accent: "#fb7185" },
};

export const DEFAULT_NAMES: Record<InventionNodeKind, string> = {
  idea: "New idea",
  component: "New component",
  evidence: "New evidence",
  risk: "New risk",
};

/* THE BENCH'S CAPACITY — honest limits so the device's keep never
   drowns: 120 pieces, 240 bonds. The add/connect hands refuse gently
   before the cap, so the saved draft is never silently truncated. */
export const MAX_NODES = 120;
export const MAX_EDGES = 240;

/** the draft's own key on the device */
export const LAB_DRAFT_KEY = "mirror-invent-canvas-v1";

export type LabDraft = {
  version: 1;
  savedAt: string;
  nodes: InventionNode[];
  edges: Edge[];
  /** the side map's own standing (restored with the bench) */
  miniMap?: boolean;
};

/* ------------------------------------------------------------------ */
/*  THE KEEP'S HANDS — load, save, clear. Every reader validates       */
/*  gently: a stranger's JSON lays down nothing, it only rests.        */
/* ------------------------------------------------------------------ */

function isKind(v: unknown): v is InventionNodeKind {
  return typeof v === "string" && (INVENTION_KINDS as string[]).includes(v);
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function loadLabDraft(): LabDraft | null {
  try {
    const raw = window.localStorage.getItem(LAB_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LabDraft;
    if (!parsed || parsed.version !== 1) return null;

    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const nodes: InventionNode[] = [];
    for (const n of rawNodes.slice(0, MAX_NODES)) {
      const x = num(n?.position?.x);
      const y = num(n?.position?.y);
      if (!n || typeof n.id !== "string" || x === null || y === null) continue;
      if (!isKind(n.data?.kind)) continue;
      nodes.push({
        id: n.id,
        type: "invention",
        position: { x, y },
        data: {
          kind: n.data.kind,
          name:
            typeof n.data.name === "string" && n.data.name.trim()
              ? n.data.name
              : DEFAULT_NAMES[n.data.kind],
          note: typeof n.data.note === "string" ? n.data.note : "",
        },
      });
    }

    const rawEdges = Array.isArray(parsed.edges) ? parsed.edges : [];
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const e of rawEdges.slice(0, MAX_EDGES)) {
      if (
        !e ||
        typeof e.id !== "string" ||
        typeof e.source !== "string" ||
        typeof e.target !== "string" ||
        e.source === e.target ||
        seen.has(`${e.source}->${e.target}`)
      )
        continue;
      seen.add(`${e.source}->${e.target}`);
      edges.push({ id: e.id, source: e.source, target: e.target, type: "smoothstep" });
    }

    return {
      version: 1,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
      nodes,
      edges,
      miniMap: typeof parsed.miniMap === "boolean" ? parsed.miniMap : undefined,
    };
  } catch {
    return null;
  }
}

/** the keep's writer — strips the runtime fields (selected, dragging,
    measured) so only the honest plan rests on the device */
export function saveLabDraft(
  nodes: InventionNode[],
  edges: Edge[],
  miniMap: boolean
): void {
  const draft: LabDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    nodes: nodes.slice(0, MAX_NODES).map((n) => ({
      id: n.id,
      type: "invention" as const,
      position: { x: n.position.x, y: n.position.y },
      data: { kind: n.data.kind, name: n.data.name, note: n.data.note },
    })),
    edges: edges.slice(0, MAX_EDGES).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep" as const,
    })),
    miniMap,
  };
  try {
    window.localStorage.setItem(LAB_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* the keep stays closed — the visit's own memory serves */
  }
}

export function clearLabDraft(): void {
  try {
    window.localStorage.removeItem(LAB_DRAFT_KEY);
  } catch {
    /* quiet */
  }
}
