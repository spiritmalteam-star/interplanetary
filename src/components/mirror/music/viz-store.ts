"use client";

/* ------------------------------------------------------------------ */
/*  THE STYLE KEEPER — which of the thousand styles the field wears.   */
/*                                                                      */
/*  One tiny store for the whole studio: AUTO (the engine listens to    */
/*  the song and cross-fades) or a pinned preset from the shelf. The    */
/*  choice persists in the visitor's own browser.                       */
/* ------------------------------------------------------------------ */

import { create } from "zustand";
import { presetById, type VizPreset } from "@/lib/audio/visualization-engine";

const STORAGE_KEY = "mirror-viz-style";

interface PersistedStyle {
  auto: boolean;
  presetId: string | null;
}

function readPersisted(): PersistedStyle {
  if (typeof window === "undefined") return { auto: true, presetId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { auto: true, presetId: null };
    const parsed = JSON.parse(raw) as PersistedStyle;
    return {
      auto: parsed.auto !== false,
      presetId: typeof parsed.presetId === "string" ? parsed.presetId : null,
    };
  } catch {
    return { auto: true, presetId: null };
  }
}

function persist(state: { auto: boolean; presetId: string | null }): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ auto: state.auto, presetId: state.presetId } satisfies PersistedStyle)
    );
  } catch {
    /* storage unavailable — the choice stays for this visit only */
  }
}

interface VizStoreState {
  auto: boolean;
  presetId: string | null;
  /** bumped whenever the choice changes — the canvas listens to it */
  version: number;
  setAuto: () => void;
  pinPreset: (id: string) => void;
}

export const useVizStore = create<VizStoreState>()((set) => {
  const initial = readPersisted();
  return {
    auto: initial.auto,
    presetId: initial.presetId,
    version: 0,
    setAuto: () =>
      set((s) => {
        persist({ auto: true, presetId: s.presetId });
        return { auto: true, version: s.version + 1 };
      }),
    pinPreset: (id) =>
      set((s) => {
        persist({ auto: false, presetId: id });
        return { auto: false, presetId: id, version: s.version + 1 };
      }),
  };
});

/** The pinned preset, resolved from the field (null → the engine's own). */
export function pinnedPreset(state: { presetId: string | null }): VizPreset | null {
  return presetById(state.presetId);
}
