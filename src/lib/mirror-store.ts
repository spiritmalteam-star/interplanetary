"use client";

import { create } from "zustand";
import type { Mode, SidebarTab, DossierKind } from "@/lib/mirror-types";
import {
  civilizations,
  civilizationTotal,
} from "@/lib/data/civilizations";
import {
  interdimensional,
  interdimTotal,
} from "@/lib/data/interdimensional";

export type ModalState =
  | { type: "federation" }
  | { type: "astral" }
  | { type: "dossier"; kind: DossierKind; id: string }
  | null;

export type TransmissionStatus = "idle" | "loading" | "ready" | "error";

export interface TransmissionRecord {
  query: string;
  text: string;
  classification: string;
  createdAt: string;
}

interface MirrorState {
  activeMode: Mode;
  activeScienceField: string | null;
  activeDirection: string | null;
  sidebarTab: SidebarTab;
  search: string;
  modal: ModalState;
  mobileNavOpen: boolean;
  query: string;
  view: "observatory" | "transmission";
  status: TransmissionStatus;
  transmission: TransmissionRecord | null;
  activeQuery: string;
  error: string | null;
  composerFocusNonce: number;

  setMode: (mode: Mode) => void;
  setScienceField: (id: string | null) => void;
  setDirection: (id: string | null) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSearch: (value: string) => void;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setQuery: (value: string) => void;
  focusComposer: () => void;
  returnToObservatory: () => void;
  resetField: () => void;
  askMirror: (question: string) => Promise<void>;
}

const defaultTabForMode = (mode: Mode): SidebarTab =>
  mode === "interplanetary" || mode === "healing" ? "civilizations" : "interdim";

export const useMirror = create<MirrorState>()((set, get) => ({
  activeMode: "interplanetary",
  activeScienceField: null,
  activeDirection: null,
  sidebarTab: "civilizations",
  search: "",
  modal: null,
  mobileNavOpen: false,
  query: "",
  view: "observatory",
  status: "idle",
  transmission: null,
  error: null,
  composerFocusNonce: 0,

  setMode: (mode) =>
    set((s) => ({
      activeMode: mode,
      sidebarTab: defaultTabForMode(mode),
      // keep filters if user returns to science mode, else leave untouched
      activeScienceField: s.activeScienceField,
      activeDirection: s.activeDirection,
    })),

  setScienceField: (id) =>
    set((s) => ({
      activeScienceField: s.activeScienceField === id ? null : id,
    })),

  setDirection: (id) =>
    set((s) => ({
      activeDirection: s.activeDirection === id ? null : id,
    })),

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSearch: (value) => set({ search: value }),
  openModal: (modal) => set({ modal, mobileNavOpen: false }),
  closeModal: () => set({ modal: null }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setQuery: (value) => set({ query: value }),
  focusComposer: () =>
    set((s) => ({ composerFocusNonce: s.composerFocusNonce + 1 })),

  returnToObservatory: () => set({ view: "observatory" }),

  resetField: () =>
    set({
      activeMode: "interplanetary",
      activeScienceField: null,
      activeDirection: null,
      sidebarTab: "civilizations",
      search: "",
      modal: null,
      mobileNavOpen: false,
      query: "",
      view: "observatory",
      status: "idle",
      transmission: null,
      activeQuery: "",
      error: null,
    }),

  askMirror: async (question) => {
    const query = question.trim();
    if (!query || get().status === "loading") return;

    set({
      query: "",
      view: "transmission",
      status: "loading",
      transmission: null,
      activeQuery: query,
      error: null,
      mobileNavOpen: false,
    });

    try {
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: get().activeMode,
          scienceField: get().activeScienceField,
          direction: get().activeDirection,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The field is momentarily quiet. Rest, then try again."
        );
      }

      set({
        status: "ready",
        transmission: {
          query,
          text: data.transmission,
          classification: data.classification,
          createdAt: data.createdAt ?? new Date().toISOString(),
        },
      });
    } catch (err) {
      set({
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "The field is momentarily quiet. Rest, then try again.",
      });
    }
  },
}));

/* Archive totals for labels */
export const archiveTotals = {
  civilizations: civilizationTotal, // 514
  interdim: interdimTotal, // 106
};

export function findDossier(kind: DossierKind, id: string) {
  const list = kind === "civilization" ? civilizations : interdimensional;
  return list.find((d) => d.id === id) ?? null;
}
