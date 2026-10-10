"use client";

import { create } from "zustand";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the deeper laboratory's own state. The scope is     */
/*  CHAT ONLY: its twelve mirror entities are chosen from the BAR      */
/*  (the entity selector the bar button opens), and choosing one       */
/*  tunes the shared mirror channel to that entity's specialty.        */
/*  CROSS FUSION lets the visitor weave two or more entities into      */
/*  one fused mind that answers at the intersection of their fields.   */
/* ------------------------------------------------------------------ */

interface MetaScienceState {
  /** The entity the channel is currently tuned to (null → the whole lab). */
  activeEntity: string | null;
  /** Whether the selector is in Cross Fusion mode (multi-select). */
  fusionMode: boolean;
  /** The entities currently picked for a cross fusion. */
  fusionKeys: string[];
  /** Tune the channel to one mirror entity (bar selector). */
  openEntity: (key: string) => void;
  /** Untune — the channel returns to the whole laboratory's spirit. */
  closeEntity: () => void;
  /** Enter / leave Cross Fusion mode (leaving clears the picks). */
  toggleFusionMode: () => void;
  /** Pick or unpick one entity for the fusion (2+ make a fusion). */
  toggleFusionMember: (key: string) => void;
  /** Clear the fusion picks (the fusion was applied or abandoned). */
  resetFusion: () => void;
}

export const useMetaScience = create<MetaScienceState>((set) => ({
  activeEntity: null,
  fusionMode: false,
  fusionKeys: [],

  openEntity: (key) => set({ activeEntity: key }),
  closeEntity: () => set({ activeEntity: null }),

  toggleFusionMode: () =>
    set((s) => ({
      fusionMode: !s.fusionMode,
      fusionKeys: s.fusionMode ? [] : s.fusionKeys,
    })),

  toggleFusionMember: (key) =>
    set((s) => ({
      fusionKeys: s.fusionKeys.includes(key)
        ? s.fusionKeys.filter((k) => k !== key)
        : [...s.fusionKeys, key],
    })),

  resetFusion: () => set({ fusionKeys: [] }),
}));
