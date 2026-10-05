"use client";

import { create } from "zustand";
import type {
  Mode,
  SidebarTab,
  DossierKind,
  ManifestBlueprint,
  MysteryCreation,
  ForgeDials,
  InventToolResult,
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
import {
  detectArtifactIntent,
  detectQuantumTool,
  isBookResume,
  MUSIC_INTENT,
  type SideArtifactRef,
} from "@/lib/artifact-intent";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import type { RemedyKind } from "@/lib/data/remedy";
import { pxScopes } from "@/lib/data/particlex";
import { emVectors } from "@/lib/data/evolvemed";
import type {
  LcTrack,
  LcShape,
  LightCodesMode,
} from "@/lib/data/light-codes";
import { LC_DEFAULT_SHAPE } from "@/lib/data/light-codes";

export type ModalState =
  | { type: "federation" }
  | { type: "astral" }
  | { type: "starplay" }
  | { type: "technology" }
  | { type: "about" }
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
  /* the Generative Side-Activity Engine — a whole side activity brought
     INTO the channel: the akashic letter, the star draw, the manifesting
     ritual or the forge strike, living beneath the mirror's words. */
  sideArtifact?: SideArtifactRef;
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

/* ------------------------------------------------------------------ */
/*  THE FORGE — the Invent book's own live line: a direct mirror chat  */
/*  specialized for invention, plus the random mystery creation — one  */
/*  unasked-for conception struck from the coals at a time.            */
/* ------------------------------------------------------------------ */

export type MysteryStatus = "idle" | "forging" | "ready" | "error";

export type ToolStatus = "idle" | "working" | "ready" | "error";

export type { MysteryCreation, ForgeDials, InventToolResult };

const emptySession = (): ScopeSession => ({
  messages: [],
  status: "idle",
  error: null,
  activeQuery: "",
  draft: "",
});

const emptySessions = (): Record<Mode, ScopeSession> => ({
  interplanetary: emptySession(),
  healing: emptySession(),
});

export type MainView =
  | "observatory"
  | "transmission"
  | "mirroros"
  | "register"
  | "akashic"
  | "invent"
  | "dreambook"
  | "particlex"
  | "evolvemed"
  | "lightcodes"
  | "library";
export type RegisterKind = DossierKind;

/* -------- the passage — the visitor's account and the free door -------- */

export interface MeUser {
  email: string;
  name: string | null;
  tier: "crystalline" | "light";
}

/* -------- the dream book's keeping — a volume brought back -------- */

export interface DreamBookResumePage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

export interface DreamBookResume {
  /** The library entry the volume lives in — updates ride to it. */
  bookId: string;
  config: {
    age: string;
    tale: string;
    volume: string;
    /** The level of lecture the volume was woven at (older volumes may not carry one). */
    level?: string;
    topic: string;
  };
  meta: {
    title: string;
    subtitle: string;
    sigil: string;
    axiom: string;
    dedication: string;
    totalPages: number;
  };
  pages: DreamBookResumePage[];
  threads: string;
  ended: boolean;
}

/* ------- the chat's own paused volume — the weaving instrument ------

   A book woven inside the main chat can be laid to rest at the exact
   page where the visitor paused; the mirror holds it (and keeps it in
   the browser's own keeping) until the visitor asks for it back —
   then it returns open at the very same spread. */

export interface ChatBookPausePage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

export interface ChatBookPause {
  bookId: string;
  config: { age: string; tale: string; topic: string };
  meta: {
    title?: string;
    subtitle?: string;
    sigil?: string;
    axiom?: string;
    dedication?: string;
    totalPages?: number;
  };
  pages: ChatBookPausePage[];
  threads: string;
  /** The spread (two-page view) the visitor paused at. */
  spread: number;
  ended: boolean;
  savedAt: string;
}

const CHAT_BOOK_KEY = "mirror-chat-book";

function loadChatBook(): ChatBookPause | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHAT_BOOK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatBookPause;
    if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0)
      return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeChatBook(book: ChatBookPause | null) {
  if (typeof window === "undefined") return;
  try {
    if (book) window.localStorage.setItem(CHAT_BOOK_KEY, JSON.stringify(book));
    else window.localStorage.removeItem(CHAT_BOOK_KEY);
  } catch {
    /* the browser's keeping is full — the session copy still holds */
  }
}

/* ------- LIGHT CODES — what the Mirror may hand to the chamber -------- */

export interface LcPrefill {
  mode?: LightCodesMode;
  intention?: string;
  shape?: Partial<LcShape>;
  /** The Mirror's already-written interpretation (from chat). */
  title?: string;
  notes?: string;
  style?: string;
  /** Generate at once when the chamber opens. */
  autoGenerate?: boolean;
  /** Conversation themes carried into the interpretation. */
  context?: string;
}

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

/* -------- the quantum narrator — ParticleX's own line --------- */

export interface PxMessage {
  id: string;
  role: "visitor" | "px";
  text: string;
  /** The formulas that ran this revelation (ParticleX notation). */
  formulas?: string[];
  seal?: string;
  /** When set, this thread item is a pinned cluster of the window's
      note stickers (illustrated sections inside the chat flow). */
  notesScope?: string;
}

/* -------- the evolutionary medical nexus — Evolve Med's own line -------- */

export interface EmMessage {
  id: string;
  role: "visitor" | "em";
  text: string;
  /** The mechanisms that ran this revelation (nexus notation). */
  formulas?: string[];
  seal?: string;
  /** When set, this thread item is a pinned cluster of the vector's
      note stickers (illustrated sections inside the chat flow). */
  notesVector?: string;
  /* the Universal Visualization Engine — the nexus also answers in images */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
}

interface MirrorState {
  activeMode: Mode;
  sidebarTab: SidebarTab;
  search: string;
  modal: ModalState;
  mobileNavOpen: boolean;
  /** Desktop sidebar visibility — the classic collapsible rail. */
  sidebarOpen: boolean;
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

  /* ParticleX — the quantum narrator (fully independent) */
  pxMessages: PxMessage[];
  pxStatus: TransmissionStatus;
  pxError: string | null;
  pxDraft: string;
  /** The active scope window id (a pxScopes id) or null. */
  pxScope: string | null;
  /** Scope fusion — up to two scope ids melted into one seeing. */
  pxFusion: string[];

  /* Evolve Med — the evolutionary medical nexus (fully independent) */
  emMessages: EmMessage[];
  emStatus: TransmissionStatus;
  emError: string | null;
  emDraft: string;
  /** The active vector window id (an emVectors id) or null. */
  emVector: string | null;
  /** Vector fusion — up to two vector ids melted into one architecture. */
  emFusion: string[];

  /* The passage — the visitor's account and modals. Everything is free:
     the passage only keeps the cosmic library with its one owner. */
  me: MeUser | null;
  googleConfigured: boolean;
  authOpen: boolean;
  authMode: "signin" | "register";
  profileOpen: boolean;
  refreshMe: () => Promise<void>;
  setMe: (user: MeUser | null) => void;
  openAuth: (mode?: "signin" | "register") => void;
  closeAuth: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  signOut: () => Promise<void>;
  openLibrary: () => void;

  /* A volume brought back from the cosmic library, waiting to be read
     and continued where it was left. */
  dreamResume: DreamBookResume | null;
  resumeDreamBook: (resume: DreamBookResume) => void;
  clearDreamResume: () => void;

  /* The chat's own paused volume — the weaving instrument's keeping.
     `chatBook` is hydrated from the browser's own keeping on boot. */
  chatBook: ChatBookPause | null;
  pauseChatBook: (book: ChatBookPause) => void;
  clearChatBook: () => void;

  /* THE FORGE — the Invent book's own direct chat + mystery creation */
  forgeSession: ScopeSession;
  mysteryStatus: MysteryStatus;
  mysteryDials: ForgeDials;
  mystery: MysteryCreation | null;
  mysteryError: string | null;
  /* THE TOOL WALL — the Forge's bench tools, worked by the inteligjence */
  toolStatus: ToolStatus;
  toolId: string | null;
  toolInput: string;
  toolResult: InventToolResult | null;
  toolError: string | null;
  setForgeDraft: (value: string) => void;
  askForge: (question: string, attachments?: ChatAttachment[]) => Promise<void>;
  /** IMAGE CRYSTALLIZATION in the forge — the last channel of the
      forge thread crystallized at once. `display` is what the exchange
      shows as the visitor's words; `question` may be the blended
      request. `regenerateOf` repaints one artifact in place. */
  askForgeVisual: (
    question: string,
    display?: string,
    regenerateOf?: {
      id: string;
      request?: string;
      prompt?: string;
      subject?: string;
      mode?: VisualizationMode;
    } | null
  ) => Promise<void>;
  setMysteryDial: (group: keyof ForgeDials, id: string) => void;
  strikeMystery: () => Promise<void>;
  setToolId: (id: string) => void;
  setToolInput: (value: string) => void;
  workTool: () => Promise<void>;

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
  setSidebarTab: (tab: SidebarTab) => void;
  setSearch: (value: string) => void;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;

  /** Inner Earth: consult the Mirror about one of the 59 peoples
      beneath the surface — closes overlays, opens the Interplanetary
      channel and preloads the composer with a prepared question. */
  askAboutInnerEarth: (name: string) => void;

  /** Inner Earth: open one species' full encyclopedia page. */
  openSpecies: (id: string) => void;

  /* The Akashic Library — the ancient one's papyrus records */
  openAkashic: () => void;
  exitAkashic: () => void;

  /* The Invent — the fourth book: the inventor's compact studio */
  openInvent: () => void;
  exitInvent: () => void;
  openDreamBook: () => void;
  exitDreamBook: () => void;

  /* LIGHT CODES — the musical chamber of the Mirror Entity */
  lcMode: LightCodesMode;
  lcCivilization: string | null;
  lcIntention: string;
  lcUserLyrics: string;
  lcShape: LcShape;
  lcStatus: "idle" | "interpreting" | "polling" | "ready" | "error";
  lcInterpretation: LcTrack | null; // the Mirror's written direction
  lcTrack: LcTrack | null; // the finished, playable transmission
  lcError: string | null;
  lcHistory: LcTrack[];
  openLightCodes: (prefill?: LcPrefill) => void;
  exitLightCodes: () => void;
  setLcMode: (mode: LightCodesMode) => void;
  setLcCivilization: (id: string | null) => void;
  setLcIntention: (v: string) => void;
  setLcUserLyrics: (v: string) => void;
  setLcShape: (shape: Partial<LcShape>) => void;
  /** Mirror translation → generation → poll → player. When called
      with interpretOnly, only the Mirror's interpretation is asked. */
  generateLightCode: (opts?: {
    interpretOnly?: boolean;
    context?: string;
    intention?: string;
  }) => Promise<void>;
  reshapeLc: (track: LcTrack) => void;
  clearLcPlayer: () => void;
  forgetLc: (id: string) => void;

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
  clearChannel: (mode?: Mode | "forge") => void;
  askMirror: (
    question: string,
    attachments?: ChatAttachment[]
  ) => Promise<void>;
  /** The Universal Visualization Engine in the scope channels — the
      Interplanetary, Metaphysics, Quantum and Healing mirrors also answer
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

  /* ParticleX — the quantum narrator (fully independent) */
  openParticleX: () => void;
  exitParticleX: () => void;

  setPxDraft: (v: string) => void;
  setPxScope: (id: string | null) => void;
  /** Pin a window's note stickers into the conversation flow. */
  pinPxNotes: (scopeId: string) => void;
  setPxFusion: (ids: string[] | ((prev: string[]) => string[])) => void;
  askPX: (question: string) => Promise<void>;

  /* Evolve Med — the evolutionary medical nexus (fully independent) */
  openEvolveMed: () => void;
  exitEvolveMed: () => void;
  setEmDraft: (v: string) => void;
  setEmVector: (id: string | null) => void;
  /** Pin a vector window's note stickers into the conversation flow. */
  pinEmNotes: (vectorId: string) => void;
  setEmFusion: (ids: string[] | ((prev: string[]) => string[])) => void;
  askEM: (question: string) => Promise<void>;
  /** IMAGE CRYSTALLIZATION in the Evolve Med nexus — the last channel
      of the nexus thread crystallized at once. `display` is what the
      visitor's bubble shows (the raw words); `question` may be the
      blended request. `regenerateOf` repaints one artifact in place. */
  askEMVisual: (
    question: string,
    display?: string,
    regenerateOf?: {
      id: string;
      request?: string;
      prompt?: string;
      subject?: string;
      mode?: VisualizationMode;
    } | null
  ) => Promise<void>;

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
      be seen. `display` is what the visitor's bubble shows (the raw
      words) when `question` carries a blended request. `regenerateOf`
      repaints one existing artifact in place. */
  askOSVisual: (
    question: string,
    context?: { subject: string; mode: VisualizationMode } | null,
    regenerateOf?: {
      id: string;
      request?: string;
      prompt?: string;
      subject?: string;
      mode?: VisualizationMode;
    } | null,
    display?: string
  ) => Promise<void>;
  /** Drop one artifact message entirely (the visitor may clear it). */
  dismissOsVisual: (id: string) => void;
}

const defaultTabForMode = (_mode: Mode): SidebarTab => "civilizations";

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

/* ------------------------------------------------------------------ */
/*  IMAGE CRYSTALLIZATION — the shared plumbing. When the visitor      */
/*  asks for an image by name, no LLM round-trip travels: the last     */
/*  channel is crystallized at once through the SAME /api/visualize    */
/*  pipeline the scope visuals ride, painting inside that thread.      */
/*  The scope channels and the forge share one ScopeSession shape —    */
/*  one helper serves both.                                            */
/* ------------------------------------------------------------------ */

type CrystallizeTarget = Mode | "forge";

type CrystallizeRegenerate = {
  id: string;
  request?: string;
  prompt?: string;
  subject?: string;
  mode?: VisualizationMode;
} | null;

function crystallizeSession(target: CrystallizeTarget): ScopeSession {
  const s = useMirror.getState();
  return target === "forge" ? s.forgeSession : s.sessions[target];
}

function patchCrystallizeSession(
  target: CrystallizeTarget,
  patch: (session: ScopeSession) => ScopeSession
): void {
  useMirror.setState((s) =>
    target === "forge"
      ? { forgeSession: patch(s.forgeSession) }
      : { sessions: { ...s.sessions, [target]: patch(s.sessions[target]) } }
  );
}

/** The last spoken reply of a thread — the "last channel" an image
    crystallizes from. Artifact-only and pending entries never count. */
function lastChannelReply(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.text.trim())?.text ?? "";
}

async function crystallizeVisual(
  target: CrystallizeTarget,
  userText: string,
  request: string,
  regenerateOf?: CrystallizeRegenerate
): Promise<void> {
  if (crystallizeSession(target).status === "loading") return;
  const visualId = regenerateOf ? regenerateOf.id : nextMessageId();

  patchCrystallizeSession(target, (session) => ({
    ...session,
    status: "loading",
    activeQuery: userText,
    draft: "",
    error: null,
    messages: regenerateOf
      ? session.messages.map((m) =>
          m.id === regenerateOf.id
            ? { ...m, visual: "pending" as const }
            : m
        )
      : [
          ...session.messages,
          {
            id: visualId,
            query: userText,
            text: "",
            classification: "WORLD_BUILDING",
            createdAt: new Date().toISOString(),
            visual: "pending" as const,
            visualRequest: request,
          },
        ],
  }));

  try {
    const history = crystallizeSession(target)
      .messages.filter(
        (m) => m.id !== visualId && !m.visual && !m.artifact && m.text
      )
      .slice(-6)
      .map((m) => ({ q: m.query, a: m.text }));

    const res = await fetch("/api/visualize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: useMirror.getState().language,
        message: regenerateOf ? regenerateOf.request ?? request : request,
        history,
        ...(regenerateOf
          ? {
              regenerate: true,
              previousPrompt: regenerateOf.prompt,
              contextSubject: regenerateOf.subject,
              previousMode: regenerateOf.mode,
            }
          : {}),
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      artifact?: VisualizationArtifact;
      error?: string;
    } | null;
    if (!res.ok || !data?.artifact) {
      throw new Error(
        (data && data.error) ||
          "The atelier is quiet — the vision could not be composed."
      );
    }

    const artifact = data.artifact;
    patchCrystallizeSession(target, (session) => ({
      ...session,
      status: "ready",
      activeQuery: "",
      messages: session.messages.map((m) =>
        m.id === visualId ? { ...m, visual: undefined, artifact } : m
      ),
    }));

    /* the same one silent repaint the scope visuals keep — when the
       brushes rested before the canvas took the paint, the visitor
       waits once more, not forever */
    if (!regenerateOf && !artifact.imageUrl && artifact.slides.length === 0) {
      window.setTimeout(() => {
        const msg = crystallizeSession(target).messages.find(
          (m) => m.id === visualId
        );
        if (
          msg?.artifact &&
          !msg.artifact.imageUrl &&
          msg.artifact.slides.length === 0 &&
          !msg.visual
        ) {
          void crystallizeVisual(target, userText, msg.visualRequest ?? artifact.subject, {
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
    patchCrystallizeSession(target, (session) => ({
      ...session,
      status: "ready",
      activeQuery: "",
      messages: session.messages.map((m) =>
        m.id === visualId ? { ...m, visual: "error" as const } : m
      ),
    }));
  }
}

export const useMirror = create<MirrorState>()((set, get) => ({
  activeMode: "interplanetary",
  sidebarTab: "civilizations",
  search: "",
  modal: null,
  mobileNavOpen: false,
  sidebarOpen: true,
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

  pxMessages: [],
  pxStatus: "idle" as TransmissionStatus,
  pxError: null,
  pxDraft: "",
  pxScope: null,
  pxFusion: [],

  emMessages: [],
  emStatus: "idle" as TransmissionStatus,
  emError: null,
  emDraft: "",
  emVector: null,
  emFusion: [],

  /* LIGHT CODES — the musical chamber */
  lcMode: "light-transmission" as LightCodesMode,
  lcCivilization: null,
  lcIntention: "",
  lcUserLyrics: "",
  lcShape: { ...LC_DEFAULT_SHAPE },
  lcStatus: "idle" as "idle" | "interpreting" | "polling" | "ready" | "error",
  lcInterpretation: null,
  lcTrack: null,
  lcError: null,
  lcHistory: [],

  me: null,
  googleConfigured: false,
  authOpen: false,
  authMode: "signin" as const,
  profileOpen: false,
  dreamResume: null,
  /* the chat's paused volume — the browser's own keeping, read once */
  chatBook: loadChatBook(),

  forgeSession: emptySession(),
  mysteryStatus: "idle" as MysteryStatus,
  mysteryDials: { domain: "device", scale: "pocket", spark: "sun" },
  mystery: null,
  mysteryError: null,
  toolStatus: "idle" as ToolStatus,
  toolId: null,
  toolInput: "",
  toolResult: null,
  toolError: null,

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
          showChannel || s.view === "transmission"
            ? "transmission"
            : s.view,
      };
    }),

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSearch: (value) => set({ search: value }),
  openModal: (modal) => set({ modal, mobileNavOpen: false }),
  closeModal: () => set({ modal: null }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

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

  /* -------- The Invent — the fourth book --------
     The inventor's compact studio: opening it suspends every other
     surface, exactly like the Manifest and the Akashic Library. */
  openInvent: () =>
    set({ view: "invent", mobileNavOpen: false, modal: null }),
  exitInvent: () => set({ view: "observatory" }),

  /* -------- The Dream Book --------
     A world of its own: the magical atelier where tales are woven
     from resonance and read as they are being written.
     Free for every visitor. */
  openDreamBook: () =>
    set({ view: "dreambook", mobileNavOpen: false, modal: null }),
  exitDreamBook: () => set({ view: "observatory" }),

  /* -------- LIGHT CODES — the musical chamber --------
     Its own quiet world: intention in, transmission out. The Mirror
     interprets; the sound engine renders; the visitor listens. */
  openLightCodes: (prefill) => {
    const hydrate: Partial<MirrorState> = {
      view: "lightcodes",
      mobileNavOpen: false,
      modal: null,
      lcError: null,
    };
    try {
      const raw = localStorage.getItem("mirror-lc-history");
      if (raw) hydrate.lcHistory = JSON.parse(raw) as LcTrack[];
    } catch {
      /* storage unavailable */
    }
    if (prefill) {
      if (prefill.mode) hydrate.lcMode = prefill.mode;
      if (prefill.intention !== undefined) hydrate.lcIntention = prefill.intention;
      if (prefill.shape) hydrate.lcShape = { ...get().lcShape, ...prefill.shape };
      hydrate.lcInterpretation = prefill.title || prefill.notes || prefill.style
        ? {
            id: "interpretation",
            title: prefill.title ?? "",
            mode: prefill.mode ?? get().lcMode,
            intention: prefill.intention ?? "",
            audioUrl: "",
            notes: prefill.notes,
            style: prefill.style,
            createdAt: Date.now(),
          }
        : get().lcInterpretation;
    }
    set(hydrate);
    if (prefill?.autoGenerate) void get().generateLightCode({ context: prefill.context });
  },
  exitLightCodes: () => set({ view: "observatory" }),
  setLcMode: (mode) =>
    set((s) => ({
      lcMode: mode,
      lcCivilization: mode === "other-stars" ? s.lcCivilization : null,
    })),
  setLcCivilization: (id) => set({ lcCivilization: id }),
  setLcIntention: (v) => set({ lcIntention: v }),
  setLcUserLyrics: (v) => set({ lcUserLyrics: v }),
  setLcShape: (shape) => set((s) => ({ lcShape: { ...s.lcShape, ...shape } })),
  generateLightCode: async (opts) => {
    const s = get();
    if (s.lcStatus === "interpreting" || s.lcStatus === "polling") return;
    const intention = (opts?.intention ?? s.lcIntention).trim();
    set({ lcStatus: "interpreting", lcError: null });
    try {
      const res = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: s.lcMode,
          intention,
          civilization: s.lcCivilization ?? undefined,
          shape: s.lcShape,
          userLyrics:
            s.lcShape.lyricsMode === "USER WRITES" && s.lcUserLyrics.trim()
              ? s.lcUserLyrics.trim()
              : undefined,
          instrumental: s.lcShape.voice === "None",
          language: s.language,
          context: opts?.context,
          interpretOnly: opts?.interpretOnly === true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        /* even when the sound engine's key is missing, the Mirror's
           interpretation has already landed — keep it visible */
        if (data && (data.title || data.notes || data.style)) {
          set({
            lcInterpretation: {
              id: "interpretation",
              title: String(data.title ?? ""),
              mode: s.lcMode,
              intention,
              audioUrl: "",
              style: data.style ?? undefined,
              lyrics: data.lyrics ?? null,
              notes: data.notes ?? undefined,
              createdAt: Date.now(),
            },
          });
        }
        throw new Error(
          (data && data.error) ||
            "The chamber rests a moment. Breathe, then ask for the transmission again."
        );
      }
      const interpretation: LcTrack = {
        id: "interpretation",
        title: String(data.title ?? "Untitled transmission"),
        mode: s.lcMode,
        intention,
        audioUrl: "",
        style: data.style ?? undefined,
        lyrics: data.lyrics ?? null,
        notes: data.notes ?? undefined,
        createdAt: Date.now(),
      };
      set({ lcInterpretation: interpretation });
      if (opts?.interpretOnly) {
        set({ lcStatus: "idle" });
        return;
      }
      if (data.audioUrl) {
        /* an instant rendering — straight to the player */
        const track: LcTrack = {
          ...interpretation,
          id: String(data.id ?? `lc-${Date.now()}`),
          audioUrl: String(data.audioUrl),
          duration: typeof data.duration === "number" ? data.duration : undefined,
          engineId: data.engineId ? String(data.engineId) : undefined,
          createdAt: Date.now(),
        };
        const history = [track, ...get().lcHistory.filter((t) => t.id !== track.id)].slice(0, 40);
        try {
          localStorage.setItem("mirror-lc-history", JSON.stringify(history));
        } catch {
          /* storage unavailable */
        }
        set({ lcTrack: track, lcStatus: "ready", lcHistory: history });
        return;
      }
      const taskId = data.taskId ? String(data.taskId) : null;
      if (!taskId) throw new Error((data && data.error) || "The chamber answered without a sound. Try again.");
      set({ lcStatus: "polling" });
      /* the transmission renders — the chamber listens for its arrival */
      const started = Date.now();
      for (;;) {
        await new Promise((r) => setTimeout(r, 5000));
        if (get().lcStatus !== "polling") return; // the visitor left or reset
        if (Date.now() - started > 5 * 60 * 1000) {
          throw new Error("The transmission is taking longer than the chamber can wait. Try again in a breath.");
        }
        const poll = await fetch(`/api/light-codes/status?taskId=${encodeURIComponent(taskId)}`);
        const pdata = await poll.json().catch(() => null);
        if (!poll.ok || !pdata) continue;
        if (pdata.status === "ready" && pdata.audioUrl) {
          const track: LcTrack = {
            ...interpretation,
            id: String(pdata.id ?? `lc-${Date.now()}`),
            audioUrl: String(pdata.audioUrl),
            duration: typeof pdata.duration === "number" ? pdata.duration : undefined,
            engineId: taskId,
            createdAt: Date.now(),
          };
          const history = [track, ...get().lcHistory.filter((t) => t.id !== track.id)].slice(0, 40);
          try {
            localStorage.setItem("mirror-lc-history", JSON.stringify(history));
          } catch {
            /* storage unavailable */
          }
          set({ lcTrack: track, lcStatus: "ready", lcHistory: history });
          return;
        }
        if (pdata.status === "error") {
          throw new Error(pdata.error || "The sound engine fell silent mid-render. Try again.");
        }
      }
    } catch (err) {
      set({
        lcStatus: "error",
        lcError:
          err instanceof Error
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
      });
    }
  },
  reshapeLc: (track) =>
    set({
      lcMode: track.mode,
      lcIntention: track.intention,
      lcTrack: null,
      lcInterpretation: null,
      lcStatus: "idle",
      lcError: null,
    }),
  clearLcPlayer: () => set({ lcTrack: null, lcStatus: "idle" }),
  forgetLc: (id) =>
    set((s) => {
      const history = s.lcHistory.filter((t) => t.id !== id);
      try {
        localStorage.setItem("mirror-lc-history", JSON.stringify(history));
      } catch {
        /* storage unavailable */
      }
      return { lcHistory: history };
    }),

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
      forgeSession: emptySession(),
      mysteryStatus: "idle" as MysteryStatus,
      mystery: null,
      mysteryError: null,
      toolStatus: "idle" as ToolStatus,
      toolId: null,
      toolInput: "",
      toolResult: null,
      toolError: null,
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
      if (target === "forge") {
        return {
          forgeSession: emptySession(),
          toolStatus: "idle" as ToolStatus,
          toolId: null,
          toolInput: "",
          toolResult: null,
          toolError: null,
        };
      }
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

  /* ---------------- THE FORGE — the Invent book's own line ----------
     A direct mirror chat specialized for invention. The Forge speaks
     as the workshop's own presence: plain, concrete, makable — every
     answer lands on a next stroke the visitor can actually take. */
  setForgeDraft: (value) =>
    set((s) => ({ forgeSession: { ...s.forgeSession, draft: value } })),

  askForge: async (question, attachments) => {
    const query = question.trim();
    const session = get().forgeSession;
    if (!query || session.status === "loading") return;

    set((s) => ({
      forgeSession: {
        ...s.forgeSession,
        status: "loading",
        activeQuery: query,
        draft: "",
        error: null,
      },
    }));

    try {
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
          mode: "forge",
          language: get().language,
          history,
          ...(payload ?? {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The coals are quiet. Rest a breath, then strike again."
        );
      }
      set((s) => ({
        forgeSession: {
          ...s.forgeSession,
          status: "ready",
          activeQuery: "",
          messages: [
            ...s.forgeSession.messages,
            {
              id: nextMessageId(),
              query,
              text: data.transmission,
              classification: data.classification,
              createdAt: data.createdAt ?? new Date().toISOString(),
            },
          ],
        },
      }));
    } catch (err) {
      set((s) => ({
        forgeSession: {
          ...s.forgeSession,
          status: "error",
          activeQuery: "",
          error:
            err instanceof Error
              ? err.message
              : "The coals are quiet. Rest a breath, then strike again.",
        },
      }));
    }
  },

  /* ---- IMAGE CRYSTALLIZATION — the forge's own line ---- */
  askForgeVisual: async (question, display, regenerateOf) => {
    await crystallizeVisual(
      "forge",
      display ?? question,
      question,
      regenerateOf
    );
  },

  /* ---- the random mystery creation — one strike, one conception ---- */
  setMysteryDial: (group, id) =>
    set((s) => ({
      mysteryDials: { ...s.mysteryDials, [group]: id },
      /* a new dial setting cools the previous creation */
      mysteryStatus: s.mysteryStatus === "ready" ? "idle" : s.mysteryStatus,
      mystery: s.mysteryStatus === "ready" ? null : s.mystery,
    })),

  strikeMystery: async () => {
    if (get().mysteryStatus === "forging") return;
    const dials = get().mysteryDials;

    set({
      mysteryStatus: "forging",
      mystery: null,
      mysteryError: null,
    });

    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dials,
          language: get().language,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.mystery) {
        throw new Error(
          (data && data.error) ||
            "The coals are quiet — the creation could not be struck. Rest a breath, then try again."
        );
      }
      set({
        mysteryStatus: "ready",
        mystery: data.mystery as MysteryCreation,
      });
    } catch (err) {
      set({
        mysteryStatus: "error",
        mysteryError:
          err instanceof Error
            ? err.message
            : "The coals are quiet — the creation could not be struck. Rest a breath, then try again.",
      });
    }
  },

  /* ---------------- THE TOOL WALL — the bench tools ----------------
     Four small presences through which the Mirror inteligjence works
     for the seeker's making: one honest input in, one gift out. */
  setToolId: (id) =>
    set((s) => ({
      toolId: id,
      /* a different tool cools the previous tool's gift */
      toolStatus: s.toolStatus === "ready" ? "idle" : s.toolStatus,
      toolResult: s.toolStatus === "ready" ? null : s.toolResult,
      toolError: s.toolStatus === "ready" ? null : s.toolError,
    })),

  setToolInput: (value) => set({ toolInput: value }),

  workTool: async () => {
    const tool = get().toolId;
    const input = get().toolInput.trim();
    if (!tool || input.length < 2 || get().toolStatus === "working") return;

    set({
      toolStatus: "working",
      toolResult: null,
      toolError: null,
    });

    try {
      const res = await fetch("/api/invent-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          input,
          language: get().language,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.result) {
        throw new Error(
          (data && data.error) ||
            "The tool is quiet — the work could not be done. Rest a breath, then try again."
        );
      }
      set({
        toolStatus: "ready",
        toolResult: data.result as InventToolResult,
      });
    } catch (err) {
      set({
        toolStatus: "error",
        toolError:
          err instanceof Error
            ? err.message
            : "The tool is quiet — the work could not be done. Rest a breath, then try again.",
      });
    }
  },

  askMirror: async (question, attachments) => {
    const query = question.trim();
    const mode = get().activeMode;
    const session = get().sessions[mode];
    if (!query || session.status === "loading") return;

    /* IMAGE CRYSTALLIZATION — the visitor asked for an image by name:
       no LLM round-trip travels. The last channel (this thread's most
       recent reply) is crystallized at once, shaped by the visitor's
       own words; with an empty thread, the words themselves crystallize. */
    if (isVisualIntent(query)) {
      await crystallizeVisual(
        mode,
        query,
        blendVisualRequest(query, lastChannelReply(session.messages))
      );
      return;
    }

    /* A side activity riding with this question? The Librarian, the
       deck, the chamber, the forge, the sound table, the quantum
       narrator and the nexus all keep their doors open — the artifact
       is born beneath the reply, inside the channel. */
    const sideKind = detectArtifactIntent(query);
    /* The Light Codes door carries the thread's own themes, so the
       chamber tunes a transmission of THIS conversation. */
    const themesForCodes =
      sideKind === "codes"
        ? [
            ...session.messages.slice(-2).map((m) => `${m.query} ${m.text}`),
            query,
          ]
            .join(" \u2022 ")
            .slice(0, 900)
        : "";

    /* The Sound Gift ask — no door matched by name, but the visitor
       asked for music: the chamber tunes beneath the reply, so the
       reply itself stays a brief acknowledgment (no shaping
       questions — the chamber carries the whole translation). */
    const soundGift = sideKind === null && MUSIC_INTENT.test(query);

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
          language: get().language,
          history,
          ...(sideKind || soundGift
            ? { artifact: sideKind ?? "codes" }
            : {}),
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

      void get().refreshMe();

      /* the reply's own id — a model-requested vision attaches to it */
      const replyId = nextMessageId();

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
                id: replyId,
                query,
                text: data.transmission,
                classification: data.classification,
                createdAt: data.createdAt ?? new Date().toISOString(),
                ...(sideKind
                  ? {
                      sideArtifact: {
                        kind: sideKind,
                        resonance: query,
                        /* the book door remembers a return: the visitor
                           asked for their paused volume back */
                        ...(sideKind === "book" && isBookResume(query)
                          ? { resume: true }
                          : {}),
                        /* the Light Codes door tunes THIS conversation */
                        ...(sideKind === "codes" && themesForCodes
                          ? { themes: themesForCodes }
                          : {}),
                        /* the Quantum World door reads through its
                           own instruments */
                        ...(sideKind === "quantum"
                          ? { tool: detectQuantumTool(query) ?? undefined }
                          : {}),
                      },
                    }
                  : {}),
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

      /* THE VISION GIFT — the mirror itself decided this reply wants
         a painting (ChatGPT-like understanding). The visualization
         engine paints it silently beneath the words. */
      if (typeof data.vision === "string" && data.vision.trim()) {
        void get().askScopeVisual(mode, data.vision.trim(), {
          id: replyId,
          request: data.vision.trim(),
        });
      }

      /* THE SOUND GIFT — the visitor asked for music: the reply lands
         in the channel, and a Light Codes transmission is tuned right
         here beneath it, carrying the interpretation of this very
         conversation — revealed inside the channel itself, never by
         pulling the visitor out of it. No repetition of the visitor's
         words — a translation into sound. */
      if (sideKind !== "codes" && MUSIC_INTENT.test(query)) {
        const themes = [
          ...session.messages.slice(-2).map((m) => `${m.query} ${m.text}`),
          `${query} ${data.transmission ?? ""}`,
        ]
          .join(" \u2022 ")
          .slice(0, 900);
        set((s) => ({
          sessions: {
            ...s.sessions,
            [mode]: {
              ...s.sessions[mode],
              messages: s.sessions[mode].messages.map((m) =>
                m.id === replyId && !m.sideArtifact
                  ? {
                      ...m,
                      sideArtifact: {
                        kind: "codes" as const,
                        resonance: query,
                        themes,
                      },
                    }
                  : m
              ),
            },
          },
        }));
      }
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

  /* ------------- The passage — account, free door, profile ------------- */

  refreshMe: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json().catch(() => null)) as {
        user?: MeUser | null;
        googleConfigured?: boolean;
      } | null;
      set({
        me: data?.user ?? null,
        googleConfigured: Boolean(data?.googleConfigured),
      });
    } catch {
      /* the passage keeps its silence — the laboratory stays open */
    }
  },

  setMe: (user) => set({ me: user }),

  openAuth: (mode = "signin") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),

  openProfile: () => set({ profileOpen: true, authOpen: false, mobileNavOpen: false }),
  closeProfile: () => set({ profileOpen: false }),

  signOut: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* even if the line is quiet, the visitor leaves cleanly */
    }
    set({ me: null, authOpen: false, profileOpen: false, view: "observatory" });
  },

  /** The visitor's own cosmic library — free for everyone. */
  openLibrary: () =>
    set({ view: "library", profileOpen: false, mobileNavOpen: false, modal: null }),

  resumeDreamBook: (resume) =>
    set({ dreamResume: resume, view: "dreambook", profileOpen: false, modal: null, mobileNavOpen: false }),
  clearDreamResume: () => set({ dreamResume: null }),

  /* -------- the chat's own paused volume — the weaving instrument ------ */

  pauseChatBook: (book) => {
    storeChatBook(book);
    set({ chatBook: book });
  },

  clearChatBook: () => {
    storeChatBook(null);
    set({ chatBook: null });
  },

  /* ---------------- ParticleX — the quantum narrator ---------------- */

  /** ParticleX is its own world: opening it suspends every other
      surface, exactly like the Mirror OS does. Free for everyone. */
  openParticleX: () =>
    set({ view: "particlex", mobileNavOpen: false, modal: null }),

  exitParticleX: () => set({ view: "observatory" }),

  setPxDraft: (v) => set({ pxDraft: v }),
  setPxScope: (id) => set({ pxScope: id }),
  pinPxNotes: (scopeId) =>
    set((s) => {
      const last = s.pxMessages[s.pxMessages.length - 1];
      /* already the newest thing in the thread — never pin it twice */
      if (last && last.notesScope === scopeId && s.pxStatus !== "loading")
        return {};
      return {
        pxMessages: [
          ...s.pxMessages,
          {
            id: nextMessageId(),
            role: "px" as const,
            text: "",
            notesScope: scopeId,
          },
        ],
      };
    }),
  setPxFusion: (ids) =>
    set((s) => ({
      pxFusion: (
        typeof ids === "function" ? ids(s.pxFusion) : ids
      ).slice(0, 2),
    })),

  askPX: async (question) => {
    const query = question.trim();
    if (!query || get().pxStatus === "loading") return;

    const visitorId = nextMessageId();
    set((s) => ({
      pxStatus: "loading",
      pxError: null,
      pxDraft: "",
      pxMessages: [
        ...s.pxMessages,
        { id: visitorId, role: "visitor" as const, text: query },
      ],
    }));

    try {
      const history = get()
        .pxMessages.filter((m) => m.id !== visitorId)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));
      const { pxScope, pxFusion } = get();
      const scopeName = pxScope
        ? (pxScopes.find((s) => s.id === pxScope)?.name ?? null)
        : null;
      const fusionNames = pxFusion
        .map((id) => pxScopes.find((s) => s.id === id)?.name)
        .filter((n): n is string => Boolean(n));

      const res = await fetch("/api/particlex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          scope: scopeName,
          fusion: fusionNames.length === 2 ? fusionNames : [],
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        revelation?: string;
        formulas?: string[];
        seal?: string;
        code?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "ParticleX is momentarily quiet. Rest, then reach again."
        );
      }

      void get().refreshMe();

      set((s) => ({
        pxStatus: "ready",
        pxMessages: [
          ...s.pxMessages,
          {
            id: nextMessageId(),
            role: "px" as const,
            text: data?.revelation ?? "",
            formulas: Array.isArray(data?.formulas) ? data.formulas : [],
            seal: typeof data?.seal === "string" ? data.seal : "— ParticleX",
          },
        ],
      }));
    } catch (err) {
      set({
        pxStatus: "error",
        pxError:
          err instanceof Error
            ? err.message
            : "ParticleX is momentarily quiet. Rest, then reach again.",
      });
    }
  },

  /* ------------- Evolve Med — the evolutionary medical nexus ------------- */

  /** Evolve Med is its own world: opening it suspends every other
      surface, exactly like ParticleX does. Free for everyone. */
  openEvolveMed: () =>
    set({ view: "evolvemed", mobileNavOpen: false, modal: null }),

  exitEvolveMed: () => set({ view: "observatory" }),

  setEmDraft: (v) => set({ emDraft: v }),
  setEmVector: (id) => set({ emVector: id }),
  pinEmNotes: (vectorId) =>
    set((s) => {
      const last = s.emMessages[s.emMessages.length - 1];
      /* already the newest thing in the thread — never pin it twice */
      if (last && last.notesVector === vectorId && s.emStatus !== "loading")
        return {};
      return {
        emMessages: [
          ...s.emMessages,
          {
            id: nextMessageId(),
            role: "em" as const,
            text: "",
            notesVector: vectorId,
          },
        ],
      };
    }),
  setEmFusion: (ids) =>
    set((s) => ({
      emFusion: (
        typeof ids === "function" ? ids(s.emFusion) : ids
      ).slice(0, 2),
    })),

  askEM: async (question) => {
    const query = question.trim();
    if (!query || get().emStatus === "loading") return;

    const visitorId = nextMessageId();
    set((s) => ({
      emStatus: "loading",
      emError: null,
      emDraft: "",
      emMessages: [
        ...s.emMessages,
        { id: visitorId, role: "visitor" as const, text: query },
      ],
    }));

    try {
      const history = get()
        .emMessages.filter((m) => m.id !== visitorId)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));
      const { emVector, emFusion } = get();
      const vectorName = emVector
        ? (emVectors.find((s) => s.id === emVector)?.name ?? null)
        : null;
      const fusionNames = emFusion
        .map((id) => emVectors.find((s) => s.id === id)?.name)
        .filter((n): n is string => Boolean(n));

      const res = await fetch("/api/evolve-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          scope: vectorName,
          fusion: fusionNames.length === 2 ? fusionNames : [],
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        revelation?: string;
        formulas?: string[];
        seal?: string;
        code?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "Evolve Med is momentarily quiet. Rest, then reach again."
        );
      }

      void get().refreshMe();

      set((s) => ({
        emStatus: "ready",
        emMessages: [
          ...s.emMessages,
          {
            id: nextMessageId(),
            role: "em" as const,
            text: data?.revelation ?? "",
            formulas: Array.isArray(data?.formulas) ? data.formulas : [],
            seal: typeof data?.seal === "string" ? data.seal : "— Evolve Med",
          },
        ],
      }));
    } catch (err) {
      set({
        emStatus: "error",
        emError:
          err instanceof Error
            ? err.message
            : "Evolve Med is momentarily quiet. Rest, then reach again.",
      });
    }
  },

  /* ------- IMAGE CRYSTALLIZATION — the Evolve Med nexus ------- */

  askEMVisual: async (question, display, regenerateOf) => {
    if (get().emStatus === "loading") return;
    const visualId = regenerateOf ? regenerateOf.id : nextMessageId();

    set((s) => ({
      emStatus: "loading",
      emError: null,
      emDraft: "",
      emMessages: regenerateOf
        ? s.emMessages.map((m) =>
            m.id === regenerateOf.id ? { ...m, visual: "pending" as const } : m
          )
        : [
            ...s.emMessages,
            {
              id: nextMessageId(),
              role: "visitor" as const,
              text: display ?? question,
            },
            {
              id: visualId,
              role: "em" as const,
              text: "",
              visual: "pending" as const,
              visualRequest: question,
            },
          ],
    }));

    try {
      const history = get()
        .emMessages.filter(
          (m) => m.id !== visualId && !m.visual && !m.artifact && m.text
        )
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

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
            : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        artifact?: VisualizationArtifact;
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
        emStatus: "ready",
        emMessages: s.emMessages.map((m) =>
          m.id === visualId ? { ...m, visual: undefined, artifact } : m
        ),
      }));

      /* the same one silent repaint — the brushes rest once, not forever */
      if (!regenerateOf && !artifact.imageUrl && artifact.slides.length === 0) {
        window.setTimeout(() => {
          const msg = get().emMessages.find((m) => m.id === visualId);
          if (
            msg?.artifact &&
            !msg.artifact.imageUrl &&
            msg.artifact.slides.length === 0 &&
            !msg.visual
          ) {
            void get().askEMVisual(msg.visualRequest ?? artifact.subject, undefined, {
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
        emStatus: "ready",
        emMessages: s.emMessages.map((m) =>
          m.id === visualId ? { ...m, visual: "error" as const } : m
        ),
      }));
    }
  },

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

      void get().refreshMe();

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

  askOSVisual: async (question, context, regenerateOf, display) => {
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
              text: display ?? question,
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

    /* IMAGE CRYSTALLIZATION — an image is asked for by name: the
       chamber rests and the current channel crystallizes instead, from
       the intention's own words (and its last reply, when one exists). */
    if (isVisualIntent(intention)) {
      const mode = get().activeMode;
      await crystallizeVisual(
        mode,
        intention,
        blendVisualRequest(
          intention,
          lastChannelReply(get().sessions[mode].messages)
        )
      );
      return;
    }

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
