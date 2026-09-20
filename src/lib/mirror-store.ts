"use client";

import { create } from "zustand";
import type {
  Mode,
  SidebarTab,
  DossierKind,
  ManifestBlueprint,
} from "@/lib/mirror-types";
import { civilizations, civilizationTotal } from "@/lib/data/civilizations";
import { interdimensional, interdimTotal } from "@/lib/data/interdimensional";

export type ModalState =
  | { type: "federation" }
  | { type: "astral" }
  | { type: "dossier"; kind: DossierKind; id: string }
  | { type: "entity"; kind: DossierKind; id: string }
  | { type: "replication" }
  | null;

export type TransmissionStatus = "idle" | "loading" | "ready" | "error";
export type LabStatus = "idle" | "charging" | "ready" | "error";

/* ------------------------------------------------------------------ */
/*  Per-scope chat channels                                            */
/*  Every scope owns a fully independent channel: its own history,     */
/*  status, in-flight query, error and composer draft. Switching       */
/*  scopes never carries content from one channel into another.        */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  query: string;
  text: string;
  classification: string;
  createdAt: string;
}

export interface ScopeSession {
  /** Completed Q/A pairs — the permanent, private history of this channel. */
  messages: ChatMessage[];
  status: TransmissionStatus;
  error: string | null;
  /** Query currently being transmitted (loading state). */
  activeQuery: string;
  /** Composer draft — kept per channel so drafts never leak across scopes. */
  draft: string;
}

const emptySession = (): ScopeSession => ({
  messages: [],
  status: "idle",
  error: null,
  activeQuery: "",
  draft: "",
});

const emptySessions = (): Record<Mode, ScopeSession> => ({
  interplanetary: emptySession(),
  science: emptySession(),
  quantum: emptySession(),
  healing: emptySession(),
});

export type MainView = "observatory" | "transmission" | "manifesting" | "register";
export type RegisterKind = DossierKind;

interface MirrorState {
  activeMode: Mode;
  activeScienceField: string | null;
  activeDirection: string | null;
  sidebarTab: SidebarTab;
  search: string;
  modal: ModalState;
  mobileNavOpen: boolean;
  view: MainView;
  composerFocusNonce: number;

  /** One independent channel per scope. */
  sessions: Record<Mode, ScopeSession>;

  /* Full-archive register */
  registerKind: RegisterKind;

  /* Reality Manifesting Lab */
  labStage: "compose" | "charging" | "blueprint";
  labIntention: string;
  labEmotion: string;
  labIntensity: number;
  labProgress: number;
  labBlueprint: ManifestBlueprint | null;
  labError: string | null;

  setMode: (mode: Mode) => void;
  setScienceField: (id: string | null) => void;
  setDirection: (id: string | null) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSearch: (value: string) => void;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setDraft: (value: string) => void;
  focusComposer: () => void;
  returnToObservatory: () => void;
  clearChannel: (mode?: Mode) => void;
  askMirror: (question: string) => Promise<void>;
  /** Full recalibration: wipe every scope channel, the lab and search. */
  resetField: () => void;

  /* Full-archive register */
  openRegister: (kind: RegisterKind) => void;
  exitRegister: () => void;

  openLab: () => void;
  exitLab: () => void;
  setLabIntention: (v: string) => void;
  setLabEmotion: (id: string) => void;
  setLabIntensity: (v: number) => void;
  chargeIntention: () => Promise<void>;
  resetLabDraft: () => void;
}

const defaultTabForMode = (mode: Mode): SidebarTab =>
  mode === "interplanetary" || mode === "healing" ? "civilizations" : "interdim";

const emptyLab = {
  labStage: "compose" as const,
  labIntention: "",
  labEmotion: "gratitude",
  labIntensity: 6,
  labProgress: 0,
  labBlueprint: null,
  labError: null,
};

let messageCounter = 0;
const nextMessageId = () => `m-${Date.now().toString(36)}-${(messageCounter++).toString(36)}`;

export const useMirror = create<MirrorState>()((set, get) => ({
  activeMode: "interplanetary",
  activeScienceField: null,
  activeDirection: null,
  sidebarTab: "civilizations",
  search: "",
  modal: null,
  mobileNavOpen: false,
  view: "observatory",
  composerFocusNonce: 0,
  sessions: emptySessions(),

  registerKind: "civilization",

  labStage: "compose",
  labIntention: "",
  labEmotion: "gratitude",
  labIntensity: 6,
  labProgress: 0,
  labBlueprint: null,
  labError: null,

  setMode: (mode) =>
    set((s) => {
      const target = s.sessions[mode];
      // Scopes are independent channels: switching scopes reveals THAT
      // scope's own channel — never content from another scope.
      const showChannel = target.messages.length > 0 || target.status === "loading";
      return {
        activeMode: mode,
        sidebarTab: defaultTabForMode(mode),
        view:
          s.view === "manifesting"
            ? s.view // deliberate: only leaving the lab via exit/return actions
            : showChannel || s.view === "transmission"
              ? "transmission"
              : s.view,
      };
    }),

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

  setDraft: (value) =>
    set((s) => ({
      sessions: {
        ...s.sessions,
        [s.activeMode]: { ...s.sessions[s.activeMode], draft: value },
      },
    })),

  focusComposer: () =>
    set((s) => ({ composerFocusNonce: s.composerFocusNonce + 1 })),

  returnToObservatory: () => set({ view: "observatory" }),

  /** Full recalibration: every scope channel returns to its quiet origin. */
  resetField: () =>
    set({
      sessions: emptySessions(),
      view: "observatory",
      search: "",
      modal: null,
      mobileNavOpen: false,
      ...emptyLab,
    }),

  /** Wipe the current channel (or an explicit one) back to a quiet state. */
  clearChannel: (mode) =>
    set((s) => {
      const target = mode ?? s.activeMode;
      return {
        sessions: { ...s.sessions, [target]: emptySession() },
      };
    }),

  askMirror: async (question) => {
    const query = question.trim();
    const mode = get().activeMode;
    const session = get().sessions[mode];
    if (!query || session.status === "loading") return;

    set((s) => ({
      view: "transmission",
      mobileNavOpen: false,
      sessions: {
        ...s.sessions,
        [mode]: {
          ...s.sessions[mode],
          status: "loading",
          activeQuery: query,
          draft: "",
          error: null,
        },
      },
    }));

    try {
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
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

      set((s) => ({
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "ready",
            activeQuery: "",
            messages: [
              ...s.sessions[mode].messages,
              {
                id: nextMessageId(),
                query,
                text: data.transmission,
                classification: data.classification,
                createdAt: data.createdAt ?? new Date().toISOString(),
              },
            ],
          },
        },
      }));
    } catch (err) {
      set((s) => ({
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "error",
            activeQuery: "",
            error:
              err instanceof Error
                ? err.message
                : "The field is momentarily quiet. Rest, then try again.",
          },
        },
      }));
    }
  },

  /* ---------------- Full-archive register ---------------- */

  openRegister: (kind) =>
    set({ registerKind: kind, view: "register", mobileNavOpen: false, modal: null }),

  exitRegister: () => set({ view: "observatory" }),

  /* ---------------- Reality Manifesting Lab ---------------- */

  openLab: () =>
    set((s) => ({
      view: "manifesting",
      mobileNavOpen: false,
      modal: null,
      labStage: s.labBlueprint ? "blueprint" : "compose",
    })),

  exitLab: () => set({ view: "observatory" }),

  setLabIntention: (v) => set({ labIntention: v }),
  setLabEmotion: (id) => set({ labEmotion: id }),
  setLabIntensity: (v) => set({ labIntensity: v }),

  resetLabDraft: () => set({ ...emptyLab }),

  chargeIntention: async () => {
    const intention = get().labIntention.trim();
    if (!intention || get().labStage === "charging") return;

    set({
      labStage: "charging",
      labProgress: 0,
      labBlueprint: null,
      labError: null,
    });

    // Gentle charging animation while the field works.
    const timer = window.setInterval(() => {
      const p = get().labProgress;
      if (p < 92) set({ labProgress: Math.min(92, p + 2 + Math.random() * 5) });
    }, 140);

    try {
      const res = await fetch("/api/manifest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intention,
          emotion: get().labEmotion,
          intensity: get().labIntensity,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The chamber is momentarily quiet. Rest, then charge again."
        );
      }
      window.clearInterval(timer);
      set({
        labProgress: 100,
        labStage: "blueprint",
        labBlueprint: data.blueprint as ManifestBlueprint,
      });
    } catch (err) {
      window.clearInterval(timer);
      set({
        labStage: "compose",
        labProgress: 0,
        labError:
          err instanceof Error
            ? err.message
            : "The chamber is momentarily quiet. Rest, then charge again.",
      });
    }
  },
}));

/* Archive totals for labels — always the exact, derived-from-data numbers */
export const archiveTotals = {
  civilizations: civilizationTotal, // 870
  interdim: interdimTotal, // 202
};

export function findDossier(kind: DossierKind, id: string) {
  const list = kind === "civilization" ? civilizations : interdimensional;
  return list.find((d) => d.id === id) ?? null;
}
