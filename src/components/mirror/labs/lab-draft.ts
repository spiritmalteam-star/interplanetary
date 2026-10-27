"use client";

import type { Edge, Node } from "@xyflow/react";
import {
  isLabStatus,
  type LabConfig,
  type LabNodeStatus,
  type LabPieceData,
} from "./lab-config";

/* ------------------------------------------------------------------ */
/*  THE KEEP'S HANDS — the labs' shared draft store. Every lab's       */
/*  bench rests on the visitor's own device (localStorage), exactly    */
/*  like the room's own words: the Mirror's rooms keep their memory    */
/*  on the device, never on a server. Layout drafts are the house's    */
/*  allowed luggage (only MP3s are banned).                            */
/*                                                                     */
/*  THE FORGE'S OLD KEEP — the Invention Lab's draft key               */
/*  (`mirror-invent-canvas-v1`) is unchanged and the shape is          */
/*  backward-compatible: older benches (no status field) wake with     */
/*  every piece standing in Draft, nothing lost.                       */
/* ------------------------------------------------------------------ */

export type LabPieceNode = Node<LabPieceData, "lab-piece">;

export type LabDraft = {
  version: 1;
  savedAt: string;
  nodes: LabPieceNode[];
  edges: Edge[];
  /** the side map's own standing (restored with the bench) */
  miniMap?: boolean;
};

/** THE BENCHES' CAPACITY — honest limits so the device's keep never
    drowns: 120 pieces, 240 bonds per lab. The add/connect hands
    refuse gently before the cap, so the saved draft is never
    silently truncated. */
export const MAX_NODES = 120;
export const MAX_EDGES = 240;

function isKind(config: LabConfig, v: unknown): boolean {
  return typeof v === "string" && v in config.kinds;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function loadLabDraft(config: LabConfig): LabDraft | null {
  try {
    const raw = window.localStorage.getItem(config.draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LabDraft;
    if (!parsed || parsed.version !== 1) return null;

    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const nodes: LabPieceNode[] = [];
    for (const n of rawNodes.slice(0, MAX_NODES)) {
      const x = num(n?.position?.x);
      const y = num(n?.position?.y);
      if (!n || typeof n.id !== "string" || x === null || y === null) continue;
      if (!isKind(config, n.data?.kind)) continue;
      nodes.push({
        id: n.id,
        type: "lab-piece",
        position: { x, y },
        data: {
          kind: n.data.kind,
          name:
            typeof n.data.name === "string" && n.data.name.trim()
              ? n.data.name
              : config.defaultNames[n.data.kind],
          note: typeof n.data.note === "string" ? n.data.note : "",
          status: isLabStatus(n.data.status) ? n.data.status : "draft",
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
    measured, dim classes) so only the honest plan rests on the device */
export function saveLabDraft(
  config: LabConfig,
  nodes: LabPieceNode[],
  edges: Edge[],
  miniMap: boolean
): void {
  const draft: LabDraft = {
    version: 1,
    savedAt: new Date().toISOString(),
    nodes: nodes.slice(0, MAX_NODES).map((n) => ({
      id: n.id,
      type: "lab-piece" as const,
      position: { x: n.position.x, y: n.position.y },
      data: {
        kind: n.data.kind,
        name: n.data.name,
        note: n.data.note,
        status: n.data.status,
      },
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
    window.localStorage.setItem(config.draftKey, JSON.stringify(draft));
  } catch {
    /* the keep stays closed — the visit's own memory serves */
  }
}

export function clearLabDraft(config: LabConfig): void {
  try {
    window.localStorage.removeItem(config.draftKey);
  } catch {
    /* quiet */
  }
}

/** a fresh piece's own id */
export function labNodeId(): string {
  return `lab-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export type { LabNodeStatus, LabPieceData };
