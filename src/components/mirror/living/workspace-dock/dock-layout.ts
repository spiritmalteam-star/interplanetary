"use client";

/* ------------------------------------------------------------------ */
/*  THE DOCK'S OWN MEMORY — the advanced desktop's saved arrangements. */
/*  When the visitor reshapes the dock (splits, floats, closes), the   */
/*  layout is serialized and laid down in localStorage after a quiet   */
/*  half-second; the next toggle-on reads it back and the dock stands  */
/*  exactly as it was left. UI layout only — the house's storage law   */
/*  bans audio blobs, never arrangements.                              */
/* ------------------------------------------------------------------ */

import type { DockviewApi } from "dockview";
import type { SerializedDockview } from "dockview-core";
import { WORKSPACES } from "@/lib/mirror/workspaces";
import type { ToolTabKey } from "@/lib/mirror-store";

export const DOCK_LAYOUT_KEY = "mirror-dock-layout-v1";

/* THE HOUSE'S OWN CAP — three rooms at once, no more. */
export const MAX_DOCK_PANELS = 3;

type SavedDockLayout = {
  version: 1;
  savedAt: number;
  layout: SerializedDockview;
};

/** Serialize the dock's live arrangement into the house's shelf. */
export function saveDockLayout(api: DockviewApi): void {
  try {
    const payload: SavedDockLayout = {
      version: 1,
      savedAt: Date.now(),
      layout: api.toJSON(),
    };
    window.localStorage.setItem(DOCK_LAYOUT_KEY, JSON.stringify(payload));
  } catch {
    /* private browsing or a full shelf — the dock stands without a
       saved arrangement, nothing else in the house is touched */
  }
}

/** THE DEBOUNCED HAND — schedule a save ~500ms after the last layout
    movement; `flush` lays it down immediately (used when the dock
    unmounts, so a toggle-off never loses the final arrangement). */
export function createLayoutSaver(delayMs = 500) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule(api: DockviewApi) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        saveDockLayout(api);
      }, delayMs);
    },
    flush(api: DockviewApi) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      saveDockLayout(api);
    },
  };
}

/** Read a saved arrangement back, with honest validation: the version
    must match, every panel must name a real room (toolId in the
    registry), a room may hold only ONE panel, and the cap holds. A
    layout that fails any law is treated as no layout at all. */
export function loadDockLayout(): SerializedDockview | null {
  try {
    const raw = window.localStorage.getItem(DOCK_LAYOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDockLayout | null;
    if (!parsed || parsed.version !== 1 || !parsed.layout) return null;
    const layout = parsed.layout;
    if (!layout.grid || typeof layout.grid !== "object") return null;

    const states = Object.values(layout.panels ?? {});
    if (states.length === 0 || states.length > MAX_DOCK_PANELS) return null;

    const seen = new Set<ToolTabKey>();
    for (const state of states) {
      const toolId = (
        state as { params?: { toolId?: unknown } }
      ).params?.toolId;
      if (typeof toolId !== "string" || !(toolId in WORKSPACES)) return null;
      if (seen.has(toolId as ToolTabKey)) return null;
      seen.add(toolId as ToolTabKey);
    }
    return layout;
  } catch {
    return null;
  }
}

/** THE FORGETTING HAND — clear the saved arrangement ("Reset layout"). */
export function clearDockLayout(): void {
  try {
    window.localStorage.removeItem(DOCK_LAYOUT_KEY);
  } catch {
    /* nothing to forget, nothing to mourn */
  }
}
