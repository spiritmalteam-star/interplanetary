"use client";

import { create } from "zustand";
import type { LabCategoryId } from "@/lib/data/heal-evolution";

/* ------------------------------------------------------------------ */
/*  HEAL EVOLUTION scope navigation — shared between the scope's       */
/*  sidebar register and the scope panel itself, so choosing a         */
/*  discipline in the sidebar opens its board in the content column.   */
/* ------------------------------------------------------------------ */

interface HealScopeState {
  /** The discipline currently open on the board (null → the hub). */
  activeCategoryId: LabCategoryId | null;
  openCategory: (id: LabCategoryId) => void;
  closeCategory: () => void;
}

export const useHealScope = create<HealScopeState>()((set) => ({
  activeCategoryId: null,
  openCategory: (id) => set({ activeCategoryId: id }),
  closeCategory: () => set({ activeCategoryId: null }),
}));
