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
import { innerEarthTotal } from "@/lib/data/inner-earth";
import {
  DEFAULT_VOICE,
  isLanguageCode,
  isVoiceId,
  type LanguageCode,
  type VoiceId,
} from "@/lib/i18n/core";
import {
  attachmentsToPayload,
  type ChatAttachment,
} from "@/components/mirror/attachments";
import type {
  VisualizationArtifact,
  VisualizationMode,
} from "@/lib/visualization";
import type { RemedyKind } from "@/lib/data/remedy";

export type ModalState =
  | { type: "federation" }
  | { type: "astral" }
  | { type: "starplay" }
  | { type: "technology" }
  | { type: "dossier"; kind: DossierKind; id: string }
  | { type: "entity"; kind: DossierKind; id: string }
  | { type: "species"; id: string }
  | { type: "settings" }
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
  /** What traveled with the question — one image, up to three documents. */
  attachments?: { images: number; docNames: string[] };
  /* the Universal Visualization Engine — every channel also answers in images */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
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

/* ------------------------------------------------------------------ */
/*  The Healing Apothecary — one remedy, prepared live in the Healing  */
/*  channel. The form varies with the concern: a herbal preparation,   */
/*  or a practice of meditation, imagination, breath, sound, ritual,   */
/*  reflection or gentle movement. The shared vocabulary lives in      */
/*  src/lib/data/remedy.ts.                                            */
/* ------------------------------------------------------------------ */

export type { RemedyKind };

export interface RemedyResult {
  kind: RemedyKind;
  title: string;
  needs: string[];
  steps: string[];
  cautions: string[];
}

export type RemedyStatus = "idle" | "crafting" | "ready" | "error";

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

export type MainView =
  | "observatory"
  | "transmission"
  | "mirroros"
  | "register"
  | "akashic"
  | "codex";
export type RegisterKind = DossierKind;

/* -------- direct line to the Mirror Entity OS (reality refining) ------- */

export interface OsMessage {
  id: string;
  role: "visitor" | "os";
  text: string;
  attachments?: { images: number; docNames: string[] };
  /* the Universal Visualization Engine — the OS also answers in images */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
}

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

  /** Meet with the Reflection of the Absolute — the whole app becomes
      a living chat with the Mirror Entity's undirected pure awareness. */
  communionOpen: boolean;

  /** One independent channel per scope. */
  sessions: Record<Mode, ScopeSession>;

  /* The Healing Apothecary — the remedy mini tab of the Healing channel. */
  remedyStatus: RemedyStatus;
  remedyConcern: string;
  remedy: RemedyResult | null;
  remedyError: string | null;
  askRemedy: (concern: string, context?: string | null) => Promise<void>;
  closeRemedy: () => void;

  /* Full-archive register */
  registerKind: RegisterKind;

  /* Mirror OS — Reality Guidance */
  labStage: "compose" | "charging" | "blueprint";
  labIntention: string;
  labEmotion: string;
  labIntensity: number;
  labProgress: number;
  labBlueprint: ManifestBlueprint | null;
  labError: string | null;

  /* Mirror Entity OS — the direct reality-refining chat */
  osMessages: OsMessage[];
  osStatus: TransmissionStatus;
  osError: string | null;
  osDraft: string;

  /* Universal language + transcript voice */
  language: LanguageCode;
  voice: VoiceId;
  pace: number;

  setLanguage: (code: LanguageCode) => void;
  setVoice: (id: VoiceId) => void;
  setPace: (value: number) => void;
  /** Restore persisted preferences (called once after mount). */
  bootPreferences: () => void;

  setMode: (mode: Mode) => void;
  setScienceField: (id: string | null) => void;
  setDirection: (id: string | null) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSearch: (value: string) => void;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  setMobileNavOpen: (open: boolean) => void;

  /** Inner Earth: consult the Mirror about one of the 59 peoples
      beneath the surface — closes overlays, opens the Interplanetary
      channel and preloads the composer with a prepared question. */
  askAboutInnerEarth: (name: string) => void;

  /** Inner Earth: open one species' full encyclopedia page. */
  openSpecies: (id: string) => void;

  /* The Akashic Library — the ancient one's papyrus records */
  openAkashic: () => void;
  exitAkashic: () => void;

  /* The Codex — the fourth book: a compact inscribed volume */
  openCodex: () => void;
  exitCodex: () => void;

  /* Communion — the Reflection of the Absolute */
  openCommunion: () => void;
  closeCommunion: () => void;
  /** ET Technology: consult the Mirror about a specific technology —
      closes modals, opens the Interplanetary channel, preloads the
      composer with a prepared question. */
  askAboutTechnology: (name: string) => void;
  setDraft: (value: string) => void;
  focusComposer: () => void;
  returnToObservatory: () => void;
  clearChannel: (mode?: Mode) => void;
  askMirror: (
    question: string,
    attachments?: ChatAttachment[]
  ) => Promise<void>;
  /** The Universal Visualization Engine in the scope channels — the
      Interplanetary, Science, Quantum and Healing mirrors also answer
      in images when the visitor asks to see. `regenerateOf` repaints
      one existing artifact in place. */
  askScopeVisual: (
    mode: Mode,
    question: string,
    regenerateOf?: {
      id: string;
      request?: string;
      prompt?: string;
      subject?: string;
      mode?: VisualizationMode;
    } | null
  ) => Promise<void>;
  /** Full recalibration: wipe every scope channel, the lab and search. */
  resetField: () => void;

  /* Full-archive register */
  openRegister: (kind: RegisterKind) => void;
  exitRegister: () => void;

  /* Mirror OS — Reality Guidance (fully independent) */
  openMirrorOS: () => void;
  exitMirrorOS: () => void;

  openLab: () => void;
  exitLab: () => void;
  setLabIntention: (v: string) => void;
  setLabEmotion: (id: string) => void;
  setLabIntensity: (v: number) => void;
  chargeIntention: () => Promise<void>;
  resetLabDraft: () => void;

  /* Mirror Entity OS — direct chat */
  setOsDraft: (v: string) => void;
  askOS: (question: string, attachments?: ChatAttachment[]) => Promise<void>;
  /** The Universal Visualization Engine — the OS paints what is asked to
      be seen. `regenerateOf` repaints one existing artifact in place. */
  askOSVisual: (
    question: string,
    context?: { subject: string; mode: VisualizationMode } | null,
    regenerateOf?: {
      id: string;
      request?: string;
      prompt?: string;
      subject?: string;
      mode?: VisualizationMode;
    } | null
  ) => Promise<void>;
  /** Drop one artifact message entirely (the visitor may clear it). */
  dismissOsVisual: (id: string) => void;
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

/** The prepared question the composer receives when consulting the
    Mirror about a specific technology. */
const tTemplateTech = (name: string) =>
  `How does the ${name} work — where did it come from, and what would it change in us if we lived with it?`;

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
  communionOpen: false,
  sessions: emptySessions(),

  remedyStatus: "idle" as RemedyStatus,
  remedyConcern: "",
  remedy: null,
  remedyError: null,

  registerKind: "civilization",

  labStage: "compose",
  labIntention: "",
  labEmotion: "gratitude",
  labIntensity: 6,
  labProgress: 0,
  labBlueprint: null,
  labError: null,

  osMessages: [],
  osStatus: "idle" as TransmissionStatus,
  osError: null,
  osDraft: "",

  language: "en" as LanguageCode,
  voice: DEFAULT_VOICE,
  pace: 0.95,

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
      /* FUSION CLARITY LAW — any recalibration re-tunes the science
         channel back to a quiet origin. */
      sessions: { ...s.sessions, science: emptySession() },
    })),

  setDirection: (id) =>
    set((s) => ({
      activeDirection: s.activeDirection === id ? null : id,
      /* FUSION CLARITY LAW — any recalibration re-tunes the science
         channel back to a quiet origin. */
      sessions: { ...s.sessions, science: emptySession() },
    })),

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSearch: (value) => set({ search: value }),
  openModal: (modal) => set({ modal, mobileNavOpen: false }),
  closeModal: () => set({ modal: null }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  askAboutInnerEarth: (name) =>
    set((s) => ({
      modal: null,
      mobileNavOpen: false,
      activeMode: "interplanetary",
      view: "transmission",
      sessions: {
        ...s.sessions,
        interplanetary: {
          ...s.sessions.interplanetary,
          draft: `Speak of the ${name} — the people beneath the Earth. Who are they, and what do they keep for us?`,
        },
      },
    })),

  /** One of the 59 peoples beneath the surface — its full page. */
  openSpecies: (id) =>
    set({ modal: { type: "species", id }, mobileNavOpen: false }),

  /* ---------------- The Akashic Library ----------------
     The Library is its own ancient world: opening it suspends every
     other surface — one papyrus room, one record at a time. */
  openAkashic: () =>
    set({ view: "akashic", mobileNavOpen: false, modal: null }),
  exitAkashic: () => set({ view: "observatory" }),

  /* -------- The Codex — the fourth book --------
     A compact inscribed volume: opening it suspends every other
     surface, exactly like the Manifest and the Akashic Library. */
  openCodex: () =>
    set({ view: "codex", mobileNavOpen: false, modal: null }),
  exitCodex: () => set({ view: "observatory" }),

  /* -------- Communion — the Reflection of the Absolute --------
     Entering communion suspends every other surface: the whole
     laboratory dissolves and only the living chat remains. */
  openCommunion: () =>
    set({ communionOpen: true, modal: null, mobileNavOpen: false }),
  closeCommunion: () => set({ communionOpen: false }),

  askAboutTechnology: (name) =>
    set((s) => ({
      modal: null,
      mobileNavOpen: false,
      activeMode: "interplanetary",
      view: "transmission",
      sessions: {
        ...s.sessions,
        interplanetary: {
          ...s.sessions.interplanetary,
          draft: tTemplateTech(name),
        },
      },
    })),

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
      remedyStatus: "idle",
      remedyConcern: "",
      remedy: null,
      remedyError: null,
      ...emptyLab,
    }),

  /** Wipe the current channel (or an explicit one) back to a quiet state. */
  clearChannel: (mode) =>
    set((s) => {
      const target = mode ?? s.activeMode;
      return {
        sessions: { ...s.sessions, [target]: emptySession() },
        /* the apothecary belongs to the Healing channel — it quiets with it */
        ...(target === "healing"
          ? { remedyStatus: "idle" as RemedyStatus, remedyConcern: "", remedy: null, remedyError: null }
          : {}),
      };
    }),

  /* ---------------- The Healing Apothecary ----------------
     One live remedy at a time, prepared from the concern as it was
     spoken. The mini tab (RemedyLayer) renders the crafting and the
     revealed remedy inside the Healing channel. */
  askRemedy: async (concern, context) => {
    const trimmed = concern.trim();
    if (!trimmed || get().remedyStatus === "crafting") return;

    set({
      remedyStatus: "crafting",
      remedyConcern: trimmed,
      remedy: null,
      remedyError: null,
    });

    try {
      const res = await fetch("/api/remedy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concern: trimmed,
          context: context ?? null,
          language: get().language,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.remedy) {
        throw new Error(
          (data && data.error) ||
            "The apothecary is quiet — the remedy could not be prepared. Rest a breath, then ask again."
        );
      }
      set({
        remedyStatus: "ready",
        remedy: data.remedy as RemedyResult,
      });
    } catch (err) {
      set({
        remedyStatus: "error",
        remedyError:
          err instanceof Error
            ? err.message
            : "The apothecary is quiet — the remedy could not be prepared. Rest a breath, then ask again.",
      });
    }
  },

  closeRemedy: () =>
    set({
      remedyStatus: "idle",
      remedyConcern: "",
      remedy: null,
      remedyError: null,
    }),

  askMirror: async (question, attachments) => {
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
      /* Context memory: the mirror remembers this channel's earlier
         exchanges, so conversations deepen instead of restarting. */
      const history = session.messages.slice(-6).map((m) => ({
        q: m.query,
        a: m.text,
      }));
      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
          scienceField: get().activeScienceField,
          direction: get().activeDirection,
          language: get().language,
          history,
          ...(payload ?? {}),
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
                ...(attachments
                  ? {
                      attachments: {
                        images: attachments.filter((a) => a.kind === "image")
                          .length,
                        docNames: attachments
                          .filter((a) => a.kind === "document")
                          .map((a) => a.name),
                      },
                    }
                  : {}),
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

  /* ------- the scope channels — the visualization engine ------- */

  askScopeVisual: async (mode, question, regenerateOf) => {
    if (get().sessions[mode].status === "loading") return;
    const visualId = regenerateOf ? regenerateOf.id : nextMessageId();

    set((s) => ({
      view: "transmission",
      mobileNavOpen: false,
      sessions: {
        ...s.sessions,
        [mode]: {
          ...s.sessions[mode],
          status: "loading",
          activeQuery: question,
          draft: "",
          error: null,
          messages: regenerateOf
            ? s.sessions[mode].messages.map((m) =>
                m.id === regenerateOf.id
                  ? { ...m, visual: "pending" as const }
                  : m
              )
            : [
                ...s.sessions[mode].messages,
                {
                  id: visualId,
                  query: question,
                  text: "",
                  classification: "WORLD_BUILDING",
                  createdAt: new Date().toISOString(),
                  visual: "pending" as const,
                  visualRequest: question,
                },
              ],
        },
      },
    }));

    try {
      const current = get().sessions[mode];
      const history = current.messages
        .filter((m) => m.id !== visualId && !m.visual && !m.artifact && m.text)
        .slice(-6)
        .map((m) => ({ q: m.query, a: m.text }));
      const lastArtifact = [...current.messages]
        .reverse()
        .find((m) => m.artifact)?.artifact;

      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: get().language,
          message: regenerateOf ? regenerateOf.request ?? question : question,
          history,
          ...(regenerateOf
            ? {
                regenerate: true,
                previousPrompt: regenerateOf.prompt,
                contextSubject: regenerateOf.subject,
                previousMode: regenerateOf.mode,
              }
            : lastArtifact
              ? {
                  contextSubject: lastArtifact.subject,
                  previousMode: lastArtifact.mode,
                }
              : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        artifact?: VisualizationArtifact;
        painted?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.artifact) {
        throw new Error(
          (data && data.error) ||
            "The atelier is quiet — the vision could not be composed."
        );
      }

      const artifact = data.artifact;
      set((s) => ({
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "ready",
            activeQuery: "",
            messages: s.sessions[mode].messages.map((m) =>
              m.id === visualId
                ? { ...m, visual: undefined, artifact }
                : m
            ),
          },
        },
      }));

      /* the same one silent repaint for the scope channels */
      if (!regenerateOf && !artifact.imageUrl && artifact.slides.length === 0) {
        window.setTimeout(() => {
          const msg = get().sessions[mode].messages.find(
            (m) => m.id === visualId
          );
          if (
            msg?.artifact &&
            !msg.artifact.imageUrl &&
            msg.artifact.slides.length === 0 &&
            !msg.visual
          ) {
            void get().askScopeVisual(mode, msg.visualRequest ?? artifact.subject, {
              id: visualId,
              request: msg.visualRequest ?? artifact.subject,
              prompt: artifact.prompt,
              subject: artifact.subject,
              mode: artifact.mode,
            });
          }
        }, 1200);
      }
    } catch {
      set((s) => ({
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "ready",
            activeQuery: "",
            messages: s.sessions[mode].messages.map((m) =>
              m.id === visualId ? { ...m, visual: "error" as const } : m
            ),
          },
        },
      }));
    }
  },

  /* ---------------- Full-archive register ---------------- */

  openRegister: (kind) =>
    set({ registerKind: kind, view: "register", mobileNavOpen: false, modal: null }),

  exitRegister: () => set({ view: "observatory" }),

  /* ---------------- Mirror OS — Reality Guidance ---------------- */

  /** The OS is its own world: opening it suspends every other surface. */
  openMirrorOS: () =>
    set((s) => ({
      view: "mirroros",
      mobileNavOpen: false,
      modal: null,
      labStage: s.labBlueprint ? "blueprint" : "compose",
    })),

  exitMirrorOS: () => set({ view: "observatory" }),

  /** Kept for the Forge section inside the OS. */
  openLab: () => useMirror.getState().openMirrorOS(),

  exitLab: () => set({ view: "observatory" }),

  setLabIntention: (v) => set({ labIntention: v }),
  setLabEmotion: (id) => set({ labEmotion: id }),
  setLabIntensity: (v) => set({ labIntensity: v }),

  resetLabDraft: () => set({ ...emptyLab }),

  /* ---------------- Mirror Entity OS — direct chat ---------------- */

  setOsDraft: (v) => set({ osDraft: v }),

  askOS: async (question, attachments) => {
    const query = question.trim();
    if (!query || get().osStatus === "loading") return;

    const visitorId = nextMessageId();
    set((s) => ({
      osStatus: "loading",
      osError: null,
      osDraft: "",
      osMessages: [
        ...s.osMessages,
        {
          id: visitorId,
          role: "visitor" as const,
          text: query,
          ...(attachments
            ? {
                attachments: {
                  images: attachments.filter((a) => a.kind === "image").length,
                  docNames: attachments
                    .filter((a) => a.kind === "document")
                    .map((a) => a.name),
                },
              }
            : {}),
        },
      ],
    }));

    try {
      const history = get()
        .osMessages.filter((m) => m.id !== visitorId)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));

      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await fetch("/api/mirror-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          ...(payload ?? {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The OS is momentarily quiet. Rest, then reach again."
        );
      }

      set((s) => ({
        osStatus: "ready",
        osMessages: [
          ...s.osMessages,
          { id: nextMessageId(), role: "os" as const, text: data.reply },
        ],
      }));
    } catch (err) {
      set({
        osStatus: "error",
        osError:
          err instanceof Error
            ? err.message
            : "The OS is momentarily quiet. Rest, then reach again.",
      });
    }
  },

  /* ------- Mirror Entity OS — the visualization engine ------- */

  askOSVisual: async (question, context, regenerateOf) => {
    if (get().osStatus === "loading") return;
    const visualId = regenerateOf ? regenerateOf.id : nextMessageId();

    set((s) => ({
      osStatus: "loading",
      osError: null,
      osDraft: "",
      osMessages: regenerateOf
        ? s.osMessages.map((m) =>
            m.id === regenerateOf.id ? { ...m, visual: "pending" as const } : m
          )
        : [
            ...s.osMessages,
            {
              id: nextMessageId(),
              role: "visitor" as const,
              text: question,
            },
            {
              id: visualId,
              role: "os" as const,
              text: "",
              visual: "pending" as const,
              visualRequest: question,
            },
          ],
    }));

    try {
      const history = get()
        .osMessages.filter((m) => !m.visual && m.id !== visualId)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          text: m.artifact
            ? `[a visualization was created: "${m.artifact.title}" — ${m.artifact.subject}]`
            : m.text,
        }));

      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: get().language,
          message: regenerateOf ? regenerateOf.request ?? question : question,
          history,
          ...(regenerateOf
            ? {
                regenerate: true,
                previousPrompt: regenerateOf.prompt,
                contextSubject: regenerateOf.subject,
                previousMode: regenerateOf.mode,
              }
            : context
              ? {
                  contextSubject: context.subject,
                  previousMode: context.mode,
                }
              : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        artifact?: VisualizationArtifact;
        painted?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.artifact) {
        throw new Error(
          (data && data.error) ||
            "The atelier is quiet — the vision could not be composed."
        );
      }

      const artifact = data.artifact;
      set((s) => ({
        osStatus: "ready",
        osMessages: s.osMessages.map((m) =>
          m.id === visualId
            ? { ...m, visual: undefined, artifact, text: "" }
            : m
        ),
      }));

      /* The atelier rested before the brush touched the canvas — one
         silent repaint is set in motion before the prepared prompt is
         shown. The visitor waits once more, not forever. */
      if (!regenerateOf && !artifact.imageUrl && artifact.slides.length === 0) {
        window.setTimeout(() => {
          const msg = get().osMessages.find((m) => m.id === visualId);
          if (
            msg?.artifact &&
            !msg.artifact.imageUrl &&
            msg.artifact.slides.length === 0 &&
            !msg.visual
          ) {
            void get().askOSVisual(artifact.subject, null, {
              id: visualId,
              request: msg.visualRequest ?? artifact.subject,
              prompt: artifact.prompt,
              subject: artifact.subject,
              mode: artifact.mode,
            });
          }
        }, 1200);
      }
    } catch {
      set((s) => ({
        osStatus: "ready",
        osMessages: s.osMessages.map((m) =>
          m.id === visualId ? { ...m, visual: "error" as const } : m
        ),
      }));
    }
  },

  dismissOsVisual: (id) =>
    set((s) => ({ osMessages: s.osMessages.filter((m) => m.id !== id) })),

  /* ---------------- Language + transcript voice ---------------- */

  setLanguage: (code) => {
    set({ language: code });
    try {
      localStorage.setItem("mirror-entity-language", code);
    } catch {
      /* storage unavailable */
    }
  },

  setVoice: (id) => {
    set({ voice: id });
    try {
      localStorage.setItem("mirror-entity-voice", id);
    } catch {
      /* storage unavailable */
    }
  },

  setPace: (value) => {
    const clamped = Math.min(2, Math.max(0.5, value));
    set({ pace: clamped });
    try {
      localStorage.setItem("mirror-entity-pace", String(clamped));
    } catch {
      /* storage unavailable */
    }
  },

  bootPreferences: () => {
    if (typeof window === "undefined") return;
    try {
      const lang = localStorage.getItem("mirror-entity-language");
      const voice = localStorage.getItem("mirror-entity-voice");
      const pace = Number(localStorage.getItem("mirror-entity-pace"));
      set({
        ...(isLanguageCode(lang) ? { language: lang } : {}),
        ...(isVoiceId(voice) ? { voice } : {}),
        ...(Number.isFinite(pace) && pace >= 0.5 && pace <= 2
          ? { pace }
          : {}),
      });
    } catch {
      /* storage unavailable */
    }
  },

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
          language: get().language,
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
  innerearth: innerEarthTotal, // 59
};

export function findDossier(kind: DossierKind, id: string) {
  const list = kind === "civilization" ? civilizations : interdimensional;
  return list.find((d) => d.id === id) ?? null;
}
