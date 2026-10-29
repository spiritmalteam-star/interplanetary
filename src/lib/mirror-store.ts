"use client";

import { create } from "zustand";
import { raiseEnergy, speakDoor } from "@/lib/speak-client";
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
import {
  defaultTreeMix,
  loadTreeMix,
  saveTreeMix,
  type TreeMix,
} from "@/lib/tree-mix";
import { interdimensional, interdimTotal } from "@/lib/data/interdimensional";
import { innerEarthTotal } from "@/lib/data/inner-earth";
import {
  DEFAULT_VOICE,
  isLanguageCode,
  isVoiceId,
  ensureDict,
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
  type SideArtifactKind,
  type SideArtifactRef,
} from "@/lib/artifact-intent";
import {
  blendVisualRequest,
  isVisualIntent,
} from "@/lib/visual-intent";
import type { RemedyKind } from "@/lib/data/remedy";
import type { LearnedBranch } from "@/lib/learning-branches";
import {
  deleteChat as deleteChatOnShelf,
  getActiveChatId,
  getChat,
  saveActiveChat,
  setActiveChat as setActiveChatOnShelf,
  startNewChat,
  type ChatSurface,
} from "@/lib/chat-archive";
import { pxScopes } from "@/lib/data/particlex";
import { emVectors } from "@/lib/data/evolvemed";
import type {
  LcTrack,
  LcShape,
  LcBrief,
  LcLyricOp,
  LightCodesMode,
} from "@/lib/data/light-codes";
import { LC_DEFAULT_SHAPE } from "@/lib/data/light-codes";
import {
  base64ToBytes,
  lcAudioDelete,
  lcAudioGet,
  lcAudioSave,
} from "@/lib/client/lc-audio";
import { journeyDepth } from "@/lib/learning-branches";

export type ModalState =
  | { type: "federation" }
  | { type: "astral" }
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
  /* the Generative Side-Activity Engine — a whole side activity brought
     INTO the channel: the akashic letter, the star draw, the manifesting
     ritual or the forge strike, living beneath the mirror's words. */
  sideArtifact?: SideArtifactRef;
  /* the learning branches grown at the reply's foot — typed, reasoned,
     connected to this very exchange and to the living tree's hub. */
  branches?: LearnedBranch[];
  /** The words reached the sky but no answer came back — the question
      rests here marked, never lost, ready to be sent again. */
  failed?: boolean;
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
  | "artx"
  | "lightcodes"
  | "library"
  | "video";

/* THE WORKSPACE — the tools of the house that ride as mini tabs over
   the living tree (every key is also a MainView: expanding a tab hands
   the screen to that view's own full-screen room). */
export type ToolTabKey =
  | "akashic"
  | "invent"
  | "dreambook"
  | "lightcodes"
  | "video"
  | "register"
  | "mirroros"
  | "library"
  | "quantum"
  | "healx"
  | "artx"
  | "scopes"
  | "market";

/* THE LANDING'S OWN SCOPE — the field the threshold's docked chat
   walks in (the crown's Scopes hand chooses it). THE MIRROR is the
   house's own reflection — the standing default (the old "General"):
   the whole house's own voice answering from the open floor. The
   other four keys are family keys, so the suggestions, the accent
   light and the banks all resolve through the walk's own families.
   Every scope is its own world: its own doors, its own light, its
   own conversation and its own memory. */
export type LandingScopeKey =
  | "mirror"
  | "interplanetary"
  | "quantum"
  | "healing"
  | "artx";

export const LANDING_SCOPES: LandingScopeKey[] = [
  "mirror",
  "interplanetary",
  "quantum",
  "healing",
  "artx",
];

/** The standing field of the threshold — THE MIRROR, always. */
export const LANDING_DEFAULT_SCOPE: LandingScopeKey = "mirror";

export type RegisterKind = DossierKind;

/* -------- the passage — the visitor's account and the free door -------- */

export interface MeUser {
  email: string;
  name: string | null;
  tier: "crystalline" | "light";
  /** The keeper's own light — true only for the ADMIN_EMAIL passage. */
  admin?: boolean;
}

/* -------- the visitor's own light — the wallet at a glance ---------- */

export interface WalletBalance {
  planTier: "FREE" | "SEEKER" | "OBSERVATORY_PRO";
  freeCreditsRemaining: number;
  paidCreditsRemaining: number;
  /** The great deposit — reflection pulses converted from the skies'
      own API accumulation (present only where a deposit was laid). */
  depositCredits?: number;
  depositSource?: string | null;
  total: number;
}

/** What a 402 door said — why the unlock modal was called. */
export interface WalletNotice {
  required: number;
  current: number;
  planTier?: string;
  actionType?: string;
}

/** The paid creations' standing prices — the server's own law, read
    from the wallet's glance and shown beside the hands that spend. */
export interface WalletPrices {
  musicPreview: number;
  musicFull: number;
  musicLoop: number;
  akashicReading: number;
  bookShort: number;
  bookExtended: number;
}

/** A credit pack as the wallet's glance lays it out. */
export interface WalletPack {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  currency: string;
  note: string;
}

/* -------- the dream book's keeping — a volume brought back -------- */

export interface DreamBookResumePage {
  n: number;
  part?: string;
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
  /** Where the reading rested — the resume reopens at the same leaf
   *  (Adaptive Reading). Optional: older shelves never carried one. */
  pageIdx?: number;
  /** The volume's own face — the album cover painted by the sky
   *  (optional: volumes woven before the cover brush rested bare). */
  cover?: string;
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

/* re-exported so the chamber's own surface reads one truth */
export type { LcBrief, LcLyricOp } from "@/lib/data/light-codes";

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

/* -------- direct line to the Manifest OS (reality refining) ------- */

export interface OsMessage {
  id: string;
  role: "visitor" | "os";
  text: string;
  attachments?: { images: number; docNames: string[] };
  /* the Universal Visualization Engine — the OS also answers in images */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
  /* the learning branches grown at the reply's foot — connected to the
     manifesting branch of the living tree */
  branches?: LearnedBranch[];
  /** The line reached the sky but no answer came back — kept, retryable. */
  failed?: boolean;
}

/* -------- the atelier — Art X's own line --------- */

export interface AxMessage {
  id: string;
  role: "visitor" | "ax";
  text: string;
  attachments?: { images: number; docNames: string[] };
  /* the Universal Visualization Engine — the atelier also paints */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
  /* the learning branches grown at the reply's foot — connected to the
     Art X branch of the living tree */
  branches?: LearnedBranch[];
  /** The line reached the sky but no answer came back — kept, retryable. */
  failed?: boolean;
}

/* -------- the quantum narrator — ParticleX's own line --------- */

export interface PxMessage {
  id: string;
  role: "visitor" | "px";
  text: string;
  /** The formulas that ran this revelation (ParticleX notation). */
  formulas?: string[];
  /** The structured movements of the teaching — the named sections
      between the opening revelation and the formulas block. */
  sections?: { heading: string; body: string }[];
  seal?: string;
  /** When set, this thread item is a pinned cluster of the window's
      note stickers (illustrated sections inside the chat flow). */
  notesScope?: string;
  /* the learning branches grown at the reply's foot — connected to the
     quantum branch of the living tree */
  branches?: LearnedBranch[];
  /** The line reached the sky but no answer came back — kept, retryable. */
  failed?: boolean;
}

/* -------- the evolutionary medical nexus — Evolve Med's own line -------- */

export interface EmMessage {
  id: string;
  role: "visitor" | "em";
  text: string;
  /** The mechanisms that ran this revelation (nexus notation). */
  formulas?: string[];
  /** The structured movements of the blueprint — the named sections
      between the opening revelation and the formulas block. */
  sections?: { heading: string; body: string }[];
  seal?: string;
  /** When set, this thread item is a pinned cluster of the vector's
      note stickers (illustrated sections inside the chat flow). */
  notesVector?: string;
  /* the Universal Visualization Engine — the nexus also answers in images */
  artifact?: VisualizationArtifact;
  visual?: "pending" | "error";
  visualRequest?: string;
  /* the learning branches grown at the reply's foot — connected to the
     Evolve Med branch of the living tree */
  branches?: LearnedBranch[];
  /** The line reached the sky but no answer came back — kept, retryable. */
  failed?: boolean;
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
  /** THE FLOOR'S OWN SEED — first words a threshold door hands the
      realm's whisper line (the image door's inviting stem). Taken
      once by the floor, then spent. */
  floorSeed: string;

  /* THE SWIPE'S MEMORY — every view change is recorded, so a right
     swipe anywhere walks back through the journey and a left swipe
     returns forward again. The whole page is the gesture's canvas. */
  viewPast: MainView[];
  viewFuture: MainView[];
  navigateBack: () => void;
  navigateForward: () => void;

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

  /* Manifest OS — the direct reality-refining chat */
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

  /* Art X — the atelier (fully independent) */
  axMessages: AxMessage[];
  axStatus: TransmissionStatus;
  axError: string | null;
  axDraft: string;
  /** The active window id (an axWindows id) or null. */
  axScope: string | null;

  /* The passage — the visitor's account and modals. Everything is free:
     the passage only keeps the cosmic library with its one owner. */
  me: MeUser | null;
  googleConfigured: boolean;
  authOpen: boolean;
  authMode: "signin" | "register";
  accountOpen: boolean;

  /* The visitor's own light — the wallet (planTier + both buckets),
     the unlock modal and its cause. The modal opens by itself when any
     door answers 402 INSUFFICIENT_CREDITS, and from the badge on tap. */
  wallet: WalletBalance | null;
  walletPrices: WalletPrices | null;
  walletPacks: WalletPack[] | null;
  walletModalOpen: boolean;
  walletNotice: WalletNotice | null;
  setWallet: (wallet: WalletBalance | null) => void;
  refreshWallet: () => Promise<void>;
  openWalletModal: (notice?: WalletNotice | null) => void;
  closeWalletModal: () => void;

  refreshMe: () => Promise<void>;
  setMe: (user: MeUser | null) => void;
  openAuth: (mode?: "signin" | "register") => void;
  closeAuth: () => void;
  openAccount: () => void;
  closeAccount: () => void;
  signOut: () => Promise<void>;
  openLibrary: () => void;

  /* A volume brought back from the cosmic library, waiting to be read
     and continued where it was left. */
  dreamResume: DreamBookResume | null;
  resumeDreamBook: (resume: DreamBookResume) => void;
  clearDreamResume: () => void;

  /* The birth echo of the visitor's LAST conjured volume — carried in
     the session's own keeping (never persisted, never shelved) so the
     NEXT conjuring's resonance draw can refuse every one of its bones:
     no two books asked back to back may share a single axis. */
  lastBookResonance: Record<string, string> | null;
  setLastBookResonance: (echo: Record<string, string> | null) => void;

  /* The chat's own paused volume — the weaving instrument's keeping.
     `chatBook` is hydrated from the browser's own keeping on boot. */
  chatBook: ChatBookPause | null;
  pauseChatBook: (book: ChatBookPause) => void;
  clearChatBook: () => void;

  /* THE CHAT ARCHIVE — the ChatGPT keeping, in the browser alone:
     conversations survive reloads and journeys between worlds; "new
     chat" lays the present one to rest on the shelf and opens a fresh
     page; the old ones can always be reopened from the panel. No
     server ever holds a word. */
  archiveTick: number;
  hydrateChats: () => void;
  newChat: (surface: ChatSurface) => void;
  openChat: (surface: ChatSurface, id: string) => void;
  deleteChat: (surface: ChatSurface, id: string) => void;
  retryFailed: (
    target: Mode | "forge" | "os" | "px" | "em" | "ax",
    messageId: string
  ) => void;

  /* THE FORGE — the Invent book's own direct chat + mystery creation */
  forgeSession: ScopeSession;
  mysteryStatus: MysteryStatus;
  mysteryDials: ForgeDials;
  mystery: MysteryCreation | null;
  mysteryError: string | null;
  /* THE CREATION SEED — the whisper a creation chip was grown from:
     the living tree's akashic / book / invent suggestions carry the
     branch's own words here, and the theme page that opens forges
     its making from them (made in the moment, never the same twice). */
  branchCreationSeed: {
    kind: "akashic" | "book" | "invent" | "music" | "video";
    topic: string;
  } | null;
  setBranchCreationSeed: (seed: {
    kind: "akashic" | "book" | "invent" | "music" | "video";
    topic: string;
  } | null) => void;
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
  strikeMystery: (directive?: string) => Promise<void>;
  setToolId: (id: string) => void;
  setToolInput: (value: string) => void;
  workTool: (attachments?: ChatAttachment[]) => Promise<void>;

  /* Universal language + transcript voice */
  language: LanguageCode;
  voice: VoiceId;
  pace: number;

  /* THE VISITOR'S OWN LEVEL — how deep the house answers, held in the
     visitor's own hand: -1 lets the walk's own DNA decide (the standing
     law), 0–4 names the tier the visitor says their experience has
     reached (the profile's settings room raises it). */
  expLevel: number;
  setExpLevel: (level: number) => void;

  /* THE MIX OF WORLDS — how much of each family the living tree
     carries, held in the store so the tree, the Laboratory's settings
     and the profile's own settings room all speak the same proportions. */
  treeMix: TreeMix;
  setTreeMix: (mix: TreeMix) => void;

  /* THE LANDING'S OWN SCOPE — the threshold's docked chat wears one
     field's light and suggestions; THE MIRROR is the standing default
     (the house's own reflection, the old "General"). Kept for the
     session only: a new visit wakes in the Mirror again. */
  landingScope: LandingScopeKey;
  setLandingScope: (scope: LandingScopeKey) => void;

  setLanguage: (code: LanguageCode) => void;
  setVoice: (id: VoiceId) => void;
  setPace: (value: number) => void;
  /** The depth every channeling sends — the walk's own tier unless the
      visitor raised their own level in the profile's settings. */
  sendDepth: () => { steps: number; tier: number };
  /** Restore persisted preferences (called once after mount). */
  bootPreferences: () => void;

  /* the visitor's own tuning — settings belong to the PASSAGE, not the
     device: every sign-in re-tunes the laboratory to its keeper */
  /** The fields of expansion — coherent phrases become seeds for new
      branches in all fields of the living tree. */
  expansionSeeds: string[];
  setExpansionSeeds: (seeds: string[]) => void;
  /** Apply a signed-in visitor's tuning (from /api/auth/me). */
  applyRemoteSettings: (settings: unknown) => void;
  /** Push the current tuning to the passage (debounced, signed-in only). */
  pushSettings: () => Promise<void>;

  /* the full-screen profile room */
  profilePageOpen: boolean;
  openProfilePage: () => void;
  closeProfilePage: () => void;

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

  /* THE WORKSPACE — the tools open as mini tabs over the walk; one
     window carries every open room, one tab active at a time. */
  toolTabs: ToolTabKey[];
  activeToolTab: ToolTabKey | null;
  /** THE LAST MAKER — the maker tab the visitor last stood in (the
      InDream hand reopens it; "scopes" never rides here). */
  lastMakerTab: Exclude<ToolTabKey, "scopes"> | null;
  /** opts.bare — open from the landing's docked portal: the tab is
      pushed and activated, but the view never leaves the landing. */
  openToolTab: (key: ToolTabKey, opts?: { bare?: boolean }) => void;
  closeToolTab: (key: ToolTabKey) => void;
  activateToolTab: (key: ToolTabKey) => void;
  /** THE ONE BACK — the whole workplace lays down at once: every tab
      closes and the main chat landing stands again. */
  closeWorkspace: () => void;
  /** THE SCOPES' OWN BACK — the fields' workplace is independent: its
      back hand lays only the scopes down (the InDream tabs keep
      resting beneath) and the main chat landing stands again. */
  closeScopes: () => void;

  /* THE MIRROR BRIDGE — a workspace's compact assistant may carry its
     own context to the floor: the draft waits in the room's reply line
     until the visitor's own hand sends it (the Mirror advises, never
     speaks unbidden). */
  bridgeDraft: { text: string; at: number } | null;
  composeBridgePrompt: (text: string) => void;
  consumeBridgeDraft: () => void;

  /* THE CREATIONS' OWN DOOR — the profile's library rows hand their
     sector to the creations room, so a saved work opens on its own
     shelf (LibraryView clears it once it has taken the helm). */
  libraryFocus: { sector: string; at: number } | null;
  setLibraryFocus: (sector: string) => void;
  clearLibraryFocus: () => void;

  /* The Akashic Library — the ancient one's papyrus records */
  openAkashic: (opts?: { bare?: boolean }) => void;
  exitAkashic: () => void;

  /* The Invent — the fourth book: the inventor's compact studio */
  openInvent: () => void;
  exitInvent: () => void;
  openDreamBook: (opts?: { bare?: boolean }) => void;
  exitDreamBook: () => void;

  /* LIGHT CODES — the musical chamber of the Mirror Entity */
  lcMode: LightCodesMode;
  lcCivilization: string | null;
  lcIntention: string;
  lcUserLyrics: string;
  lcShape: LcShape;
  /** The weave's length: the 30-second preview or the full song. */
  lcLength: "preview" | "full" | "loop";
  /* THE VISITOR'S OWN STYLE — the image look chosen through the "/"
     hand in any composer; every crystallization wears it. */
  visualStyle: string | null;
  lcStatus: "idle" | "interpreting" | "polling" | "ready" | "error";
  /** THE MIRROR'S BRIEF — the chamber's composition draft: the direction
      the Mirror wrote (or one carried in from the chat), editable by
      the visitor's own hand before any sound is woven. */
  lcBrief: LcBrief | null;
  /** the laboratory hand at work ("refine" | "lyrics:<op>") — the brief
      stays readable while a craft runs */
  lcBusyOp: string | null;
  /** the lab's own word — what a craft hand changed, or where it slipped */
  lcLabNote: string | null;
  /** an honest word: refining after a weave means a NEW version, never
      an edit of the sound already woven */
  lcRefineNote: string | null;
  /** the session's previous lyric sheets — the restore shelf */
  lcLyricsDrafts: string[];
  /** the visitor's image carried into the chamber (memory only, never
      written to any shelf) */
  lcCarriedImage: string | null;
  lcTrack: LcTrack | null; // the finished, playable transmission
  lcError: string | null;
  /** A gentle word for the shelf — a sound the device no longer holds. */
  lcNotice: string | null;
  lcHistory: LcTrack[];
  /** THE FIRST LAW, LITERAL — "no style, just my words": when the
      visitor holds this, the brief is composed from their free text
      ALONE — no chamber, no shape, no voice selector rides with the
      ask, in the compose or in the weave. */
  lcRaw: boolean;
  setLcRaw: (v: boolean) => void;
  openLightCodes: (prefill?: LcPrefill, opts?: { bare?: boolean }) => void;
  exitLightCodes: () => void;
  /* THE VIDEO STUDIO — the motion picture's own room: a seed (the
     conversation's own words) in, a narrated film out. */
  videoSeed: { topic: string; sourceConvId?: string } | null;
  openVideo: (seed?: { topic: string; sourceConvId?: string }) => void;
  exitVideo: () => void;
  setVideoSeed: (seed: { topic: string; sourceConvId?: string } | null) => void;
  setLcMode: (mode: LightCodesMode) => void;
  setLcCivilization: (id: string | null) => void;
  setLcIntention: (v: string) => void;
  setLcUserLyrics: (v: string) => void;
  setLcShape: (shape: Partial<LcShape>) => void;
  setLcLength: (length: "preview" | "full" | "loop") => void;
  setVisualStyle: (style: string | null) => void;
  /** Mirror translation → the weave → the player. The chamber's full
      round: the Mirror composes the brief, then the engine renders it.
      Kept for one-ask paths (chips, prefills, error retries). */
  generateLightCode: (opts?: {
    interpretOnly?: boolean;
    context?: string;
    intention?: string;
    attachments?: ChatAttachment[];
  }) => Promise<void>;
  /** THE FIRST DOOR ONLY — the Mirror composes the brief; nothing is
      woven until the visitor's own hand strikes the generate. */
  composeBrief: (opts?: {
    intention?: string;
    context?: string;
    attachments?: ChatAttachment[];
  }) => Promise<boolean>;
  /** THE SECOND DOOR — the standing brief is woven into sound. */
  weaveBrief: () => Promise<void>;
  /** The visitor's own hand on the brief — direct edits, no Mirror. */
  updateBriefDraft: (patch: Partial<LcBrief>) => void;
  /** Conversational refinement: the instruction reshapes the standing
      brief. No audio is regenerated here — a new version is woven only
      when the visitor strikes generate. */
  refineBrief: (instruction: string) => Promise<void>;
  /** THE LYRICS LABORATORY — one craft hand at a time on the brief's
      lyric sheet. */
  lyricsLabOp: (op: LcLyricOp) => Promise<void>;
  /** Restore a previous lyric sheet from the session shelf. */
  restoreLyricsDraft: (index: number) => void;
  /** The Mirror chooses everything — a fresh brief from an empty ask. */
  surpriseMe: () => Promise<void>;
  /** Back to the brief from the player — a new version may be woven. */
  newVersionFromTrack: () => void;
  clearLcBrief: () => void;
  /** Play a kept transmission — recalls the sound from the visitor's
      own device; when the device no longer holds it, a gentle notice
      stands in its place. A vault-kept transmission plays straight
      from the house's serve door — any device, any visit. */
  playLc: (track: LcTrack) => Promise<void>;
  reshapeLc: (track: LcTrack) => void;
  clearLcPlayer: () => void;
  /** THE STAGE'S OWN DIAL — how the playlist turns when a transmission
      ends: off (stop at the shelf's end), all (turn around), one
      (the same piece again). */
  lcRepeat: "off" | "one" | "all";
  setLcRepeat: (mode: "off" | "one" | "all") => void;
  /** THE QUEUE'S OWN HAND — step through the shelf of kept sounds:
      1 = the next older transmission, -1 = the one before it. */
  lcAdvance: (dir: 1 | -1) => Promise<void>;
  forgetLc: (id: string) => void;
  /** THE VAULT SHELF — a signed passage's heart, laid or lifted on a
      vault-kept row (the server holds the truth; the shelf follows). */
  toggleLcFavorite: (id: string) => void;
  /** THE KEEPING THREAD — fetch the vault shelf into the chamber's
      history, and when weaves are still standing (a refresh mid-weave),
      watch them through the same shelf until they land. Guests keep
      their device-only keeping — this door stays shut for them. */
  resumeLcLibrary: () => Promise<void>;

  /** ET Technology: consult the Mirror about a specific technology —
      closes modals, opens the Interplanetary channel, preloads the
      composer with a prepared question. */
  askAboutTechnology: (name: string) => void;
  setDraft: (value: string) => void;
  seedFloor: (value: string) => void;
  takeFloorSeed: () => string;
  focusComposer: () => void;
  returnToObservatory: () => void;
  clearChannel: (mode?: Mode | "forge") => void;
  askMirror: (
    question: string,
    attachments?: ChatAttachment[],
    /** THE CATEGORY'S OWN DOOR — when the walk stands focused on a
        category (or a family's own whisper is pressed), the ask rides
        that scope's own voice, never the general channel. */
    scope?: string,
    /** THE MINIATURE PORTAL'S OWN VOICE — when the ask arrives from a
        small surface (the landing's mirror in miniature), the answer
        travels as a presence across a line: one to three short spoken
        sentences. The full portal always hears the whole transmission. */
    opts?: { live?: boolean }
  ) => Promise<void>;
  /** The learning branches grown for one landed reply — attached once,
      quietly, so they persist with the exchange. Every thread of the
      laboratory is served: the scope channels, the forge, and the
      OS / ParticleX / Evolve Med lines. */
  attachBranches: (
    target: Mode | "forge" | "os" | "px" | "em" | "ax",
    messageId: string,
    branches: LearnedBranch[]
  ) => void;
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

  /** A fresh chat inside one world: the manifest core, the quantum
      core or the med nexus returns to its quiet origin. */
  clearWorldChat: (world: "manifest" | "quantum" | "evolvemed" | "artx") => void;

  /* ParticleX — the quantum narrator (fully independent) */
  openParticleX: () => void;
  exitParticleX: () => void;

  setPxDraft: (v: string) => void;
  setPxScope: (id: string | null) => void;
  /** Pin a window's note stickers into the conversation flow. */
  pinPxNotes: (scopeId: string) => void;
  setPxFusion: (ids: string[] | ((prev: string[]) => string[])) => void;
  askPX: (question: string, attachments?: ChatAttachment[]) => Promise<void>;

  /* Evolve Med — the evolutionary medical nexus (fully independent) */
  openEvolveMed: () => void;
  exitEvolveMed: () => void;
  setEmDraft: (v: string) => void;
  setEmVector: (id: string | null) => void;
  /** Pin a vector window's note stickers into the conversation flow. */
  pinEmNotes: (vectorId: string) => void;
  setEmFusion: (ids: string[] | ((prev: string[]) => string[])) => void;
  askEM: (question: string, attachments?: ChatAttachment[]) => Promise<void>;
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

  /* Art X — the atelier (fully independent) */
  openArtX: () => void;
  exitArtX: () => void;
  setAxDraft: (v: string) => void;
  /** Open one of the atelier's windows (an axWindows id) or close it. */
  setAxScope: (id: string | null) => void;
  askArtX: (question: string, attachments?: ChatAttachment[]) => Promise<void>;
  /** IMAGE CRYSTALLIZATION in the atelier — the Mirror Entity paints
      what is asked to be seen. `display` is what the visitor's bubble
      shows (the raw words) when `question` carries a blended request.
      `regenerateOf` repaints one existing artifact in place. */
  askArtXVisual: (
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

  setLabIntention: (v: string) => void;
  setLabEmotion: (id: string) => void;
  setLabIntensity: (v: number) => void;
  chargeIntention: (attachments?: ChatAttachment[]) => Promise<void>;
  resetLabDraft: () => void;

  /* Manifest OS — direct chat */
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
        /* the visitor's own style — chosen through the "/" hand — rides along */
        ...(useMirror.getState().visualStyle
          ? { style: useMirror.getState().visualStyle }
          : {}),
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

    /* THE ONE ACTIVATION LAW — the image creator never fires twice on
       its own. When the brushes rested before the canvas took the
       paint (an artifact without an image), the prepared-prompt card
       stands in its place with a one-touch recompose; the visitor —
       never a timer — decides whether the atelier tries again. */
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

/* The archive's hydration hand — true while conversations return to
   the live rooms, so the autosave never writes back mid-restore. */
let hydrating = false;

/* THE CHANNEL'S OWN GENERATION — every reset of a channel (a new chat,
   a kept volume restored, a category's fresh page) turns this wheel
   once, and every in-flight answer carries the number it was born
   with. An answer that comes home to a channel that has moved on is
   laid down gently — never written into a conversation it does not
   belong to. THIS IS THE CARRY LAW: without it, an ask made in one
   room could land in another room's fresh page when the visitor walks
   on while the mirror still speaks. */
let channelGeneration = 0;
/* The swipe's own hand — true while a back/forward turn is in flight,
   so the view recorder never mistakes the return for a fresh journey
   and wipes the road ahead. */
let navLock = false;

/* THE OS STREAM'S OWN BREATH — the Manifest OS chat gathers its
   streaming deltas in one pending buffer that reaches the store at
   most once per beat, so a flowing answer re-renders the room a
   dozen times a second instead of once per token. The stream's own
   end always flushes synchronously — the last words never wait. */
const OS_FLUSH_MS = 80;
const osStream = {
  id: null as string | null,
  text: null as string | null,
  timer: null as number | null,
};

/* ------------------------------------------------------------------ */
/*  THE ENDLESS JOURNEY — the client's own thread of the six-part      */
/*  weave. Each part is a real engine movement; the honest part count  */
/*  rides in the notice ("weaving movement k of six" — never an        */
/*  invented percentage). The journey's token rests between requests,  */
/*  so a stumbled part resumes where it stood instead of weaving the   */
/*  whole journey again. When the final movement lands, the joined     */
/*  piece is fetched once from the journey's own door and kept on the  */
/*  visitor's device.                                                  */
/* ------------------------------------------------------------------ */
const LOOP_PARTS = 6;
const FULL_SONG_PARTS = 2;
let journeyToken: string | null = null;
let journeyPartsDone = 0;
/* the thread's own shape — a stale token from another journey's shape
   (endless vs the song's two movements) must never resume across */
let journeyKind: "loop" | "full" | null = null;

/* THE JOURNEY'S OWN LOOM — one engine for both long weaves: the
   endless journey (six movements ≈ thirty minutes) and the full
   song's own two movements (the opening and the closing, joined into
   one composition past the two-minute wall). The journey was weighed
   once at its first part; every continuation rides free, and a
   stumbled part resumes where it stood. */
async function runJourney(
  get: () => MirrorState,
  set: (partial: Partial<MirrorState>) => void,
  kind: "loop" | "full"
): Promise<void> {
  const total = kind === "loop" ? LOOP_PARTS : FULL_SONG_PARTS;
  /* a thread of another shape never resumes here */
  if (journeyKind !== kind) {
    journeyToken = null;
    journeyPartsDone = 0;
    journeyKind = kind;
  }
  const brief = get().lcBrief!;
  const raw = get().lcRaw;
  let lastStructure: string | undefined;
  let lastNote: string | undefined;
  for (let k = journeyPartsDone + 1; k <= total; k++) {
    set({
      lcNotice:
        k === 1
          ? kind === "loop"
            ? "Weaving the journey's first movement — one of six. A long piece takes several breaths."
            : `Weaving the song's opening movement — one of two. A full song takes several breaths.`
          : kind === "loop"
            ? `Weaving movement ${k} of six — the journey continues.`
            : `Weaving the song's closing movement — two of two.`,
    });
    const resume = k > 1 && journeyToken;
    const res = await fetch("/api/light-codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: brief.mode,
        intention: brief.intention,
        civilization:
          !raw && brief.mode === "other-stars"
            ? (get().lcCivilization ?? undefined)
            : undefined,
        shape: raw ? undefined : get().lcShape,
        instrumental: raw ? !brief.lyrics : get().lcShape.voice === "None" || !brief.lyrics,
        language: get().language,
        compose: true,
        length: kind,
        ...(resume
          ? { loopToken: journeyToken, loopPart: { index: k, total, nonce: Math.random().toString(36).slice(2, 10) } }
          : { loopPart: { index: 1, total } }),
        interp: {
          title: brief.title,
          style: brief.style,
          lyrics: brief.lyrics,
          notes: brief.notes,
        },
        ...(k === 1 && get().lcCarriedImage ? { image: get().lcCarriedImage } : {}),
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | {
          loopToken?: string;
          loopProgress?: string;
          loopFinalized?: boolean;
          audioUrl?: string;
          loopDurationSec?: number;
          loopNote?: string;
          structure?: string;
          error?: string;
        }
      | null;
    if (!res.ok || !data) {
      throw new Error(
        (data && data.error) ||
          "The weaving rested a moment. Ask again — it continues where it stood."
      );
    }
    lastStructure =
      typeof data.structure === "string" && data.structure ? data.structure : lastStructure;
    lastNote = typeof data.loopNote === "string" ? data.loopNote : lastNote;
    if (!data.loopFinalized) {
      journeyToken = data.loopToken ?? journeyToken;
      journeyPartsDone = k;
      continue;
    }
    /* the journey is joined — fetch it once from its own door */
    set({
      lcNotice:
        kind === "loop"
          ? "Crossing the movements into one long journey…"
          : "Crossing the song's movements into one whole piece…",
    });
    const audioRes = await fetch(data.audioUrl ?? "");
    if (!audioRes.ok) {
      const errData = (await audioRes.json().catch(() => null)) as { error?: string } | null;
      throw new Error(
        (errData && errData.error) ||
          "The sound rested before it reached you. Ask again — the brief still stands."
      );
    }
    const bytes = new Uint8Array(await audioRes.arrayBuffer());
    const id = `lc-${Date.now()}`;
    const audioUrl = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "audio/mpeg" }));
    void lcAudioSave(id, bytes, "audio/mpeg");
    const track: LcTrack = {
      id,
      title: brief.title,
      mode: brief.mode,
      intention: brief.intention,
      audioUrl,
      style: brief.style || undefined,
      lyrics: brief.lyrics,
      notes: brief.notes || undefined,
      length: kind,
      duration: data.loopDurationSec || undefined,
      structure: [lastNote, lastStructure].filter(Boolean).join("\n\n") || undefined,
      createdAt: Date.now(),
    };
    const history = [
      { ...track, audioUrl: "" },
      ...get().lcHistory.filter((t) => t.id !== track.id),
    ].slice(0, 40);
    try {
      localStorage.setItem("mirror-lc-history", JSON.stringify(history));
    } catch {
      /* storage unavailable */
    }
    journeyToken = null;
    journeyPartsDone = 0;
    journeyKind = null;
    set({
      lcTrack: track,
      lcStatus: "ready",
      lcNotice: null,
      lcHistory: history,
      lcCarriedImage: null,
    });
    return;
  }
  /* every part landed but none declared itself final — the thread rested */
  throw new Error(
    "The journey's thread rested before its ending. Ask once more — the weaving continues where it stood."
  );
}

/* ------------------------------------------------------------------ */
/*  THE VAULT SHELF — the house's own keeping for signed passages.     */
/*  The chamber's weaves land as MusicTrack rows; this thread fetches  */
/*  the shelf, merges it into the visitor's history (the local,        */
/*  device-kept rows are never displaced), and — after a refresh       */
/*  mid-weave — watches the standing jobs until they resolve, each     */
/*  spoken to exactly once. Guests never walk this path: their keeping */
/*  stays on their own device, exactly as it always has.               */
/* ------------------------------------------------------------------ */

interface LcLibraryTrack {
  id: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  status: string;
  favorite: boolean;
  createdAt: string;
}

interface LcLibraryJob {
  id: string;
  status: string;
  providerTaskId: string | null;
  creditsDrawn: number;
  refunded: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LcLibraryPayload {
  tracks: LcLibraryTrack[];
  jobs: LcLibraryJob[];
}

/* one watcher at a time, wherever in the house the visitor wanders */
let lcVaultPoll: ReturnType<typeof setTimeout> | null = null;
let lcVaultWatched = new Set<string>();
let lcVaultTicks = 0;

function persistLcHistory(history: LcTrack[]): void {
  try {
    localStorage.setItem("mirror-lc-history", JSON.stringify(history));
  } catch {
    /* storage unavailable */
  }
}

/** Fold the vault's rows into the chamber's shelf: server rows are the
    truth for their own ids, local rows stand untouched beside them. */
function mergeVaultShelf(
  get: () => MirrorState,
  set: (partial: Partial<MirrorState>) => void,
  payload: LcLibraryPayload
): void {
  const existing = get().lcHistory;
  const byLibrary = new Map<string, LcTrack>();
  for (const t of existing) if (t.libraryId) byLibrary.set(t.libraryId, t);
  const rows: LcTrack[] = [];
  for (const row of payload.tracks) {
    if (row.status === "failed" || !row.audioUrl) continue;
    const prev = byLibrary.get(row.id);
    const createdAt = Date.parse(row.createdAt) || 0;
    rows.push(
      prev
        ? {
            ...prev,
            favorite: row.favorite,
            duration: row.durationSec ?? prev.duration,
            audioUrl: row.audioUrl,
            durable: true,
            createdAt: prev.createdAt || createdAt,
          }
        : {
            id: row.id,
            title: row.title,
            mode: "light-transmission",
            intention: "",
            audioUrl: row.audioUrl,
            duration: row.durationSec ?? undefined,
            libraryId: row.id,
            favorite: row.favorite,
            durable: true,
            createdAt,
          }
    );
  }
  const keptIds = new Set(
    rows.map((r) => r.libraryId).filter((v): v is string => Boolean(v))
  );
  const merged = [
    ...rows,
    ...existing.filter((t) => t.libraryId && !keptIds.has(t.libraryId)),
    ...existing.filter((t) => !t.libraryId),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 48);
  set({ lcHistory: merged });
  persistLcHistory(merged);
}

/** The keeping thread — watch standing weave jobs through the shelf
    itself (one door, no second machinery) until each resolves, then
    speak honestly: what landed, and what light came home. */
function watchVaultJobs(
  get: () => MirrorState,
  set: (partial: Partial<MirrorState>) => void,
  jobs: LcLibraryJob[]
): void {
  const processing = jobs.filter((j) => j.status === "processing");
  if (processing.length === 0) return;
  for (const j of processing) lcVaultWatched.add(j.id);
  if (lcVaultPoll !== null) return; // the watcher already walks

  const schedule = (): void => {
    if (lcVaultPoll !== null || lcVaultWatched.size === 0) return;
    lcVaultPoll = setTimeout(() => {
      void tick();
    }, 5000);
  };

  const tick = async (): Promise<void> => {
    lcVaultPoll = null;
    const me = get().me;
    if (!me || me.email.startsWith("anon:") || lcVaultWatched.size === 0) return;
    lcVaultTicks += 1;
    if (lcVaultTicks > 120) {
      /* ten quiet minutes — the thread rests; the room's next mount
         picks the watch up again */
      lcVaultWatched.clear();
      return;
    }
    let payload: LcLibraryPayload | null = null;
    try {
      const res = await fetch("/api/music-library");
      if (res.status === 401) return; // the passage rested
      payload = res.ok
        ? ((await res.json().catch(() => null)) as LcLibraryPayload | null)
        : null;
    } catch {
      payload = null;
    }
    if (!payload) {
      schedule(); // one breath, then ask again
      return;
    }
    mergeVaultShelf(get, set, payload);
    const resolved = payload.jobs.filter(
      (j) => j.status !== "processing" && lcVaultWatched.has(j.id)
    );
    for (const j of resolved) lcVaultWatched.delete(j.id);
    if (resolved.length > 0) {
      const recovered = resolved.filter((j) => j.status === "succeeded");
      const failed = resolved.filter((j) => j.status === "failed");
      const lights = failed.reduce((n, j) => n + (j.creditsDrawn || 0), 0);
      const words: string[] = [];
      if (recovered.length > 0) {
        words.push(
          "A weave that outlived the refresh has landed — its transmission now rests on your shelf."
        );
      }
      if (failed.length > 0) {
        words.push(
          lights > 0
            ? `A weave could not finish — its ${lights} ${
                lights === 1 ? "light" : "lights"
              } returned to your purse.`
            : "A weave could not finish — nothing had been drawn from your purse."
        );
      }
      if (words.length > 0) set({ lcNotice: words.join(" ") });
    }
    if (lcVaultWatched.size > 0) schedule();
  };

  schedule();
}

export const useMirror = create<MirrorState>()((set, get) => ({
  activeMode: "interplanetary",
  sidebarTab: "civilizations",
  search: "",
  modal: null,
  mobileNavOpen: false,
  sidebarOpen: true,
  view: "observatory",
  toolTabs: [],
  activeToolTab: null,
  lastMakerTab: null,
  bridgeDraft: null,
  libraryFocus: null,
  composerFocusNonce: 0,
  floorSeed: "",
  viewPast: [],
  viewFuture: [],
  archiveTick: 0,
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

  axMessages: [],
  axStatus: "idle" as TransmissionStatus,
  axError: null,
  axDraft: "",
  axScope: null,

  /* LIGHT CODES — the musical chamber */
  lcMode: "light-transmission" as LightCodesMode,
  lcCivilization: null,
  lcIntention: "",
  lcUserLyrics: "",
  lcShape: { ...LC_DEFAULT_SHAPE },
  lcLength: "preview" as "preview" | "full" | "loop",
  visualStyle: null,
  lcStatus: "idle" as "idle" | "interpreting" | "polling" | "ready" | "error",
  lcBrief: null,
  lcBusyOp: null,
  lcLabNote: null,
  lcRefineNote: null,
  lcLyricsDrafts: [],
  lcCarriedImage: null,
  lcTrack: null,
  lcError: null,
  lcNotice: null,
  lcHistory: [],
  lcRepeat: "off" as "off" | "one" | "all",
  /* THE FIRST LAW, DEFAULTED: the visitor's words need no style — the
     no-style door stands open at birth, and the creativity leads until
     the visitor's own hand chooses a chamber. */
  lcRaw: true,

  me: null,
  googleConfigured: false,
  accountOpen: false,
  authOpen: false,
  authMode: "signin" as const,
  profilePageOpen: false,
  wallet: null,
  walletPrices: null,
  walletPacks: null,
  walletModalOpen: false,
  walletNotice: null,
  expansionSeeds: [],
  dreamResume: null,
  lastBookResonance: null,
  /* the chat's paused volume — the browser's own keeping, read once */
  chatBook: loadChatBook(),

  forgeSession: emptySession(),
  mysteryStatus: "idle" as MysteryStatus,
  mysteryDials: { domain: "device", scale: "pocket", spark: "sun" },
  mystery: null,
  mysteryError: null,
  branchCreationSeed: null,
  toolStatus: "idle" as ToolStatus,
  toolId: null,
  toolInput: "",
  toolResult: null,
  toolError: null,

  language: "en" as LanguageCode,
  voice: DEFAULT_VOICE,
  pace: 0.95,
  expLevel: -1,

  /* the whole house, mixed — the GENERAL walk stands until the
     visitor's own proportions join from their device */
  treeMix: defaultTreeMix(),
  setTreeMix: (mix) => {
    set({ treeMix: mix });
    saveTreeMix(mix);
  },

  /* THE LANDING'S OWN SCOPE — THE MIRROR stands until the crown's
     Scopes hand chooses another field; the choice rides the session's
     own keeping (the setter writes it, bootPreferences wakes it).
     Only the house's own keys are ever kept — anything else falls
     back to the Mirror. */
  landingScope: LANDING_DEFAULT_SCOPE,
  setLandingScope: (scope) => {
    const next = LANDING_SCOPES.includes(scope) ? scope : LANDING_DEFAULT_SCOPE;
    set({ landingScope: next });
    try {
      window.sessionStorage.setItem("mirror:landing-scope", next);
    } catch {
      /* the session's keeping stays closed — the store carries */
    }
  },

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

  /* ---------------- THE WORKSPACE ----------------
     The tools no longer swallow the whole screen: each one opens as a
     mini tab over the one chat — one window, many rooms, one tab
     active at a time. THE NEVER-YANK LAW — opening a tool tab NEVER
     changes `view`: the realm IS the landing chat now, in both of its
     gears (docked and fullscreen), so the window simply rises over
     the chat wherever it stands. (The old yank — `view:
     "observatory"` for non-bare callers — is gone with the walk; the
     old expand hand that pulled a room out into a full-screen page
     is gone with it — every room plays within the chat frame, the
     visitor's word.) The opts param stays accepted (callers pass
     {bare:true}); it no longer gears anything. */
  openToolTab: (key, opts) => {
    /* THE MAKER'S TRAIL — every open leaves one stone on the visit's
       own path (sessionStorage, capped), so the history panel's trail
       room can hand any opened tool back with one touch. */
    recordMakerTrail(key);
    return set((s) => ({
      mobileNavOpen: false,
      modal: null,
      toolTabs: s.toolTabs.includes(key) ? s.toolTabs : [...s.toolTabs, key],
      activeToolTab: key,
      /* the market is the house's own hall, never a maker's bench —
         it never becomes the InDream trail's last stone */
      ...(key !== "scopes" && key !== "market" ? { lastMakerTab: key } : {}),
    }));
  },
  /* THE PARKED WORKPLACE — going back never lays the rooms down: the
     tabs keep standing (hidden, still working — a weaving book keeps
     weaving), and any maker's touch in the crown lifts the workplace
     exactly where it was left. Only a room's own x lays that room
     down (the house asks first). */
  closeWorkspace: () => set({ activeToolTab: null }),
  closeScopes: () =>
    set((s) => ({
      activeToolTab: s.activeToolTab === "scopes" ? null : s.activeToolTab,
      toolTabs: s.toolTabs.filter((k) => k !== "scopes"),
    })),
  closeToolTab: (key) =>
    set((s) => {
      const tabs = s.toolTabs.filter((k) => k !== key);
      const active =
        s.activeToolTab === key ? (tabs[tabs.length - 1] ?? null) : s.activeToolTab;
      return { toolTabs: tabs, activeToolTab: active };
    }),
  activateToolTab: (key) =>
    set((s) => ({
      activeToolTab: key,
      ...(key !== "scopes" && key !== "market"
        ? { lastMakerTab: key }
        : {}),
    })),

  /* THE MIRROR BRIDGE — the draft is stamped so the room's reply line
     only lifts the newest carry (an older draft never re-fires). */
  composeBridgePrompt: (text) =>
    set({ bridgeDraft: { text, at: Date.now() } }),
  consumeBridgeDraft: () => set({ bridgeDraft: null }),

  /* THE CREATIONS' OWN DOOR */
  setLibraryFocus: (sector) =>
    set({ libraryFocus: { sector, at: Date.now() } }),
  clearLibraryFocus: () => set({ libraryFocus: null }),

  /* THE ONE FRAME — every room lives at the chat's own size, in both
     of the chat's gears: there is no expansion beyond the frame any
     more (the old expand hand that yanked the view into a full-screen
     page is gone — the visitor's word: everything plays within the
     chat frame, never a new page; the chat's own corner hand gears
     the SIZE of the whole frame, and every room rides inside it). */

  /* ---------------- The Akashic Library ----------------
     The Library is its own ancient world: opening it suspends every
     other surface — one papyrus room, one record at a time. */
  openAkashic: (opts) => get().openToolTab("akashic", opts),
  /* the room's own back hand — from the full-screen room it returns to
     the walk with the mini window still waiting (the tab stays); from
     inside the mini window it lays the tab down (leaving the room) */
  exitAkashic: () =>
    set((s) =>
      s.view === "akashic"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "akashic"),
            activeToolTab:
              s.activeToolTab === "akashic" ? null : s.activeToolTab,
          }
    ),

  /* -------- The Invent — the fourth book --------
     The inventor's compact studio: opening it suspends every other
     surface, exactly like the Manifest and the Akashic Library. */
  openInvent: () => get().openToolTab("invent"),
  exitInvent: () =>
    set((s) =>
      s.view === "invent"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "invent"),
            activeToolTab:
              s.activeToolTab === "invent" ? null : s.activeToolTab,
          }
    ),

  /* -------- The Dream Book --------
     A world of its own: the magical atelier where tales are woven
     from resonance and read as they are being written.
     Free for every visitor. */
  openDreamBook: (opts) => get().openToolTab("dreambook", opts),
  exitDreamBook: () =>
    set((s) =>
      s.view === "dreambook"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "dreambook"),
            activeToolTab:
              s.activeToolTab === "dreambook" ? null : s.activeToolTab,
          }
    ),

  /* -------- LIGHT CODES — the musical chamber --------
     Its own quiet world: intention in, transmission out. The Mirror
     interprets; the sound engine renders; the visitor listens. */
  openLightCodes: (prefill, opts) => {
    const hydrate: Partial<MirrorState> = {
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
      const prefillBrief: LcBrief | null =
        prefill.title || prefill.notes || prefill.style
          ? {
              title: prefill.title ?? "Untitled transmission",
              style: prefill.style ?? "",
              lyrics: null,
              notes: prefill.notes ?? "",
              intention: prefill.intention ?? "",
              mode: prefill.mode ?? get().lcMode,
            }
          : null;
      hydrate.lcBrief = prefillBrief ?? get().lcBrief;
    }
    set(hydrate);
    /* the musical chamber rides as a mini tab — the tab call happens
       BEFORE the auto-generate, so the chamber is standing when the
       first transmission is asked for. opts.bare keeps the landing's
       docked portal on the threshold (no view change). */
    get().openToolTab("lightcodes", opts);
    if (prefill?.autoGenerate) {
      /* a brief carried in from the chat is woven as it stands — no
         second interpretation is asked of the Mirror */
      if (get().lcBrief) void get().weaveBrief();
      else void get().generateLightCode({ context: prefill.context });
    }
  },
  exitLightCodes: () =>
    set((s) =>
      s.view === "lightcodes"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "lightcodes"),
            activeToolTab:
              s.activeToolTab === "lightcodes" ? null : s.activeToolTab,
          }
    ),
  videoSeed: null,
  openVideo: (seed) => {
    set({ videoSeed: seed ?? null });
    get().openToolTab("video");
  },
  exitVideo: () =>
    set((s) =>
      s.view === "video"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "video"),
            activeToolTab:
              s.activeToolTab === "video" ? null : s.activeToolTab,
          }
    ),
  setVideoSeed: (seed) => set({ videoSeed: seed }),
  setLcMode: (mode) =>
    set((s) => ({
      lcMode: mode,
      lcCivilization: mode === "other-stars" ? s.lcCivilization : null,
    })),
  setLcCivilization: (id) => set({ lcCivilization: id }),
  setLcIntention: (v) => set({ lcIntention: v }),
  setLcUserLyrics: (v) => set({ lcUserLyrics: v }),
  setLcShape: (shape) => set((s) => ({ lcShape: { ...s.lcShape, ...shape } })),
  setLcLength: (length) => set({ lcLength: length }),
  setVisualStyle: (style) => set({ visualStyle: style }),
  setLcRaw: (v) => set({ lcRaw: v }),
  /* THE CHAMBER'S ROUND — the Mirror composes the brief; the visitor
     reads it, shapes it, and strikes the generate with their own hand;
     the engine weaves the standing brief. Never both doors at once
     unless a caller asks for the full round. */
  composeBrief: async (opts) => {
    const s = get();
    if (
      s.lcStatus === "interpreting" ||
      s.lcStatus === "polling" ||
      s.lcBusyOp
    )
      return false;
    const intention = (opts?.intention ?? s.lcIntention).trim();
    /* the visitor's image rides both doors: seen by the Mirror first,
       handed to the engine's own input in the weave (memory only) */
    const carriedImage =
      opts?.attachments?.find((a) => a.kind === "image" && a.dataUrl)?.dataUrl ??
      null;
    set({
      lcStatus: "interpreting",
      lcError: null,
      lcNotice: null,
      lcLabNote: null,
      lcRefineNote: null,
      lcCarriedImage: carriedImage,
    });
    try {
      /* THE FIRST DOOR — the Mirror's written direction.
         THE FIRST LAW, LITERAL: when lcRaw stands ("no style, just my
         words"), the ask carries the visitor's free text ALONE — no
         chamber, no shape, no voice selector rides with it. */
      const res = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(s.lcRaw
            ? {}
            : {
                mode: s.lcMode,
                civilization: s.lcCivilization ?? undefined,
                shape: s.lcShape,
                userLyrics:
                  s.lcShape.lyricsMode === "USER WRITES" && s.lcUserLyrics.trim()
                    ? s.lcUserLyrics.trim()
                    : undefined,
                instrumental: s.lcShape.voice === "None",
              }),
          intention,
          language: s.language,
          context: opts?.context,
          interpretOnly: true,
          ...(opts?.attachments ? attachmentsToPayload(opts.attachments) : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | (Partial<LcBrief> & { error?: string })
        | null;
      if (!res.ok || !data) {
        throw new Error(
          (data && data.error) ||
            "The chamber rests a moment. Breathe, then ask for the transmission again."
        );
      }
      /* the brief — one sheet the visitor may shape before any sound
         is asked for. The visitor's own lyrics are the sheet (never
         in the raw round — there the words alone are the sheet). */
      const brief: LcBrief = {
        title: String(data.title ?? "Untitled transmission"),
        style: String(data.style ?? ""),
        lyrics:
          !s.lcRaw &&
          s.lcShape.lyricsMode === "USER WRITES" &&
          s.lcUserLyrics.trim()
            ? s.lcUserLyrics.trim()
            : data.lyrics
              ? String(data.lyrics)
              : null,
        notes: String(data.notes ?? ""),
        intention,
        mode: s.lcMode,
      };
      set({ lcBrief: brief, lcStatus: "idle", lcLyricsDrafts: [] });
      return true;
    } catch (err) {
      set({
        lcStatus: "error",
        lcError:
          err instanceof Error
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
      });
      return false;
    }
  },

  weaveBrief: async () => {
    const s = get();
    const brief = s.lcBrief;
    if (!brief || s.lcStatus === "polling" || s.lcStatus === "interpreting")
      return;
    /* THE SECOND DOOR — the standing brief is woven. Nothing is claimed
       until playable audio actually lands. The raw law rides the whole
       round: when lcRaw stands, no selector rides the weave either. */
    const raw = s.lcRaw;
    set({ lcStatus: "polling", lcError: null, lcNotice: null, lcRefineNote: null });
    try {
      /* THE LONG WEAVES — the endless journey (six movements) and the
         full song (two movements joined into one piece) both ride the
         journey's own loom; the preview and the plain full song keep
         the single call. */
      if (s.lcLength === "loop" || s.lcLength === "full") {
        await runJourney(get, set, s.lcLength);
        return;
      }
      const weave = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: brief.mode,
          intention: brief.intention,
          civilization: !raw && brief.mode === "other-stars" ? (s.lcCivilization ?? undefined) : undefined,
          shape: raw ? undefined : s.lcShape,
          instrumental: raw ? !brief.lyrics : s.lcShape.voice === "None" || !brief.lyrics,
          language: s.language,
          compose: true,
          length: s.lcLength,
          interp: {
            title: brief.title,
            style: brief.style,
            lyrics: brief.lyrics,
            notes: brief.notes,
          },
          ...(s.lcCarriedImage ? { image: s.lcCarriedImage } : {}),
        }),
      });
      const wdata = (await weave.json().catch(() => null)) as
        | {
            audio?: string;
            mimeType?: string;
            structure?: string;
            engine?: string;
            error?: string;
            code?: string;
            /* the house's keeping, when the weave was kept for a
               signed passage: the vault row's id and its serve key */
            audioUrl?: string;
            trackId?: string;
            jobId?: string;
          }
        | null;
      if (!weave.ok) {
        throw new Error(
          (wdata && wdata.error) ||
            "The chamber rests a moment. Breathe, then ask for the transmission again."
        );
      }
      /* THE WEIGHT LAW (the visitor's side): when the house kept the
         sound, the answer carries only its serve key — the heavy bytes
         never ride the JSON again. The key IS the sound's address; the
         inline base64 rides only when no shelf held it. */
      const serveKey =
        typeof wdata?.audioUrl === "string" &&
        wdata.audioUrl.startsWith("/api/music-audio/")
          ? wdata.audioUrl
          : null;
      const rowId =
        typeof wdata?.trackId === "string" && wdata.trackId
          ? wdata.trackId
          : null;
      const durable = Boolean(serveKey && rowId);
      const b64 = typeof wdata?.audio === "string" ? wdata.audio : "";
      if (!b64 && !serveKey) {
        throw new Error(
          (wdata && wdata.error) ||
            "The chamber answered without a sound. Try again."
        );
      }
      const bytes = b64 ? base64ToBytes(b64) : null;
      const mime = String(wdata?.mimeType ?? "audio/mpeg");
      const id = `lc-${Date.now()}`;
      let audioUrl: string;
      if (serveKey) {
        /* the vault's own serve key — the sound is fetched from the
           house, and the house holds it across visits */
        audioUrl = serveKey;
      } else {
        /* the keeping law: a guest's sound rests on their own device */
        const localBytes = bytes as Uint8Array;
        audioUrl = URL.createObjectURL(
          new Blob([localBytes.buffer as ArrayBuffer], { type: mime })
        );
        void lcAudioSave(id, localBytes, mime);
      }
      const track: LcTrack = {
        id,
        title: brief.title,
        mode: brief.mode,
        intention: brief.intention,
        audioUrl,
        style: brief.style || undefined,
        lyrics: brief.lyrics,
        notes: brief.notes || undefined,
        length: "preview",
        structure:
          typeof wdata?.structure === "string" && wdata.structure
            ? wdata.structure
            : undefined,
        engineId: wdata?.engine ? String(wdata.engine) : undefined,
        ...(durable && rowId
          ? { libraryId: rowId, favorite: false, durable: true }
          : {}),
        createdAt: Date.now(),
      };
      /* the shelf remembers the shape, never the blob — a durable row
         carries its serve key so any visit can replay it; a local row
         carries nothing and leans on the visitor's own IndexedDB */
      const history = [
        { ...track, audioUrl: durable && serveKey ? serveKey : "" },
        ...get().lcHistory.filter((t) => t.id !== track.id),
      ].slice(0, 40);
      try {
        localStorage.setItem("mirror-lc-history", JSON.stringify(history));
      } catch {
        /* storage unavailable */
      }
      set({
        lcTrack: track,
        lcStatus: "ready",
        lcHistory: history,
        lcCarriedImage: null,
      });
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

  updateBriefDraft: (patch) =>
    set((s) => ({ lcBrief: s.lcBrief ? { ...s.lcBrief, ...patch } : s.lcBrief })),

  refineBrief: async (instruction) => {
    const s = get();
    const brief = s.lcBrief;
    if (!brief || s.lcBusyOp || s.lcStatus === "polling") return;
    const word = instruction.trim();
    if (!word) return;
    set({
      lcBusyOp: "refine",
      lcLabNote: null,
      lcError: null,
      /* keep the sheet the visitor had, in case the refinement slips */
      lcLyricsDrafts: brief.lyrics
        ? [brief.lyrics, ...s.lcLyricsDrafts].slice(0, 8)
        : s.lcLyricsDrafts,
    });
    try {
      const res = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: brief.mode,
          intention: brief.intention,
          language: s.language,
          refine: { instruction: word },
          interp: {
            title: brief.title,
            style: brief.style,
            lyrics: brief.lyrics,
            notes: brief.notes,
          },
        }),
      });
      const data = (await res.json().catch(() => null)) as Partial<LcBrief> & {
        error?: string;
      } | null;
      if (!res.ok || !data) {
        throw new Error(
          (data && data.error) ||
            "The Mirror's refinement dissolved before it landed. Speak the change once more."
        );
      }
      set({
        lcBrief: {
          ...brief,
          title: String(data.title ?? brief.title),
          style: String(data.style ?? brief.style),
          lyrics:
            data.lyrics === undefined ? brief.lyrics : data.lyrics,
          notes: String(data.notes ?? brief.notes),
        },
        lcBusyOp: null,
        /* THE HONESTY LAW: if a sound was already woven from the older
           brief, refining means a NEW version will be woven — the
           existing waveform is never edited in place. */
        lcRefineNote: s.lcTrack
          ? "The brief has been reshaped — strike generate and a new version will be woven. The sound already woven is never edited in place."
          : null,
        lcStatus: s.lcStatus === "ready" ? "idle" : s.lcStatus,
      });
    } catch (err) {
      set({
        lcBusyOp: null,
        lcError:
          err instanceof Error
            ? err.message
            : "The Mirror's refinement dissolved before it landed.",
      });
    }
  },

  lyricsLabOp: async (op) => {
    const s = get();
    const brief = s.lcBrief;
    if (!brief || s.lcBusyOp || s.lcStatus === "polling") return;
    set({
      lcBusyOp: `lyrics:${op}`,
      lcLabNote: null,
      lcError: null,
      lcLyricsDrafts: brief.lyrics
        ? [brief.lyrics, ...s.lcLyricsDrafts].slice(0, 8)
        : s.lcLyricsDrafts,
    });
    try {
      const res = await fetch("/api/light-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: brief.mode,
          intention: brief.intention,
          language: s.language,
          lyricsOp: op,
          interp: {
            title: brief.title,
            style: brief.style,
            lyrics: brief.lyrics,
            notes: brief.notes,
          },
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        lyrics?: string;
        notes?: string;
        error?: string;
      } | null;
      if (!res.ok || !data) {
        throw new Error(
          (data && data.error) ||
            "The Lyrics Laboratory's hand slipped — ask for the craft once more."
        );
      }
      const sheet = (data.lyrics ?? "").trim();
      if (!sheet) {
        throw new Error(
          "The Lyrics Laboratory's hand slipped — ask for the craft once more."
        );
      }
      set({
        lcBrief: { ...brief, lyrics: sheet },
        lcBusyOp: null,
        lcLabNote: data.notes || null,
        lcRefineNote: s.lcTrack
          ? "The words have been reshaped — strike generate and a new version will be woven."
          : null,
        lcStatus: s.lcStatus === "ready" ? "idle" : s.lcStatus,
      });
    } catch (err) {
      set({
        lcBusyOp: null,
        lcError:
          err instanceof Error
            ? err.message
            : "The Lyrics Laboratory's hand slipped — ask for the craft once more.",
      });
    }
  },

  restoreLyricsDraft: (index) =>
    set((s) => {
      const sheet = s.lcLyricsDrafts[index];
      if (!sheet || !s.lcBrief) return {};
      return {
        lcBrief: { ...s.lcBrief, lyrics: sheet },
        lcLyricsDrafts: s.lcLyricsDrafts.filter((_, i) => i !== index),
        lcLabNote: null,
      };
    }),

  surpriseMe: async () => {
    set({ lcIntention: "" });
    await get().composeBrief({});
  },

  newVersionFromTrack: () =>
    set({
      lcStatus: "idle",
      lcError: null,
      lcNotice: null,
      lcRefineNote: null,
      lcLabNote: null,
    }),

  clearLcBrief: () =>
    set({
      lcBrief: null,
      lcBusyOp: null,
      lcLabNote: null,
      lcRefineNote: null,
      lcCarriedImage: null,
      lcLyricsDrafts: [],
    }),

  /* the chamber's full round in one ask — kept for chips, prefills and
     the error card's retry hand */
  generateLightCode: async (opts) => {
    const ok = await get().composeBrief(opts);
    if (ok) await get().weaveBrief();
  },
  playLc: async (track) => {
    /* the house's kept sound — served from the vault, owner-checked,
       any device, any visit; no device copy is ever needed */
    if (track.durable && track.audioUrl.startsWith("/api/")) {
      set({
        lcTrack: { ...track, audioUrl: track.audioUrl },
        lcStatus: "ready",
        lcError: null,
        lcNotice: null,
      });
      return;
    }
    const stored = await lcAudioGet(track.id);
    if (stored) {
      const audioUrl = URL.createObjectURL(
        new Blob([stored.bytes], { type: stored.mime })
      );
      set({
        lcTrack: { ...track, audioUrl },
        lcStatus: "ready",
        lcError: null,
        lcNotice: null,
      });
    } else {
      set({
        lcTrack: null,
        lcStatus: "idle",
        lcNotice:
          "This transmission's sound rests with the visit that wove it — ask the Mirror to weave it again.",
      });
    }
  },
  reshapeLc: (track) =>
    set({
      lcMode: track.mode,
      lcIntention: track.intention,
      lcTrack: null,
      lcBrief: null,
      lcBusyOp: null,
      lcLabNote: null,
      lcRefineNote: null,
      lcCarriedImage: null,
      lcLyricsDrafts: [],
      lcStatus: "idle",
      lcError: null,
    }),
  clearLcPlayer: () => set({ lcTrack: null, lcStatus: "idle" }),
  setLcRepeat: (mode) => set({ lcRepeat: mode }),
  lcAdvance: async (dir) => {
    const s = get();
    const shelf = s.lcHistory;
    if (shelf.length === 0) return;
    const at = shelf.findIndex((t) => t.id === s.lcTrack?.id);
    /* the shelf runs newest-first: 1 walks down it (older), -1 walks up */
    let next = at + dir;
    if (next >= shelf.length) {
      if (s.lcRepeat !== "all") return; // the shelf's end — the stage rests
      next = 0;
    }
    if (next < 0) {
      if (s.lcRepeat !== "all") return;
      next = shelf.length - 1;
    }
    await get().playLc(shelf[next]);
  },
  forgetLc: (id) =>
    set((s) => {
      /* the visitor's own hand forgets — the sound leaves the device,
         and a vault-kept sound leaves the house's keeping too */
      const track = s.lcHistory.find((t) => t.id === id);
      const libraryId = track?.libraryId ?? null;
      if (libraryId) {
        void fetch(`/api/music-library?id=${encodeURIComponent(libraryId)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
      void lcAudioDelete(id);
      const history = s.lcHistory.filter((t) => t.id !== id);
      try {
        localStorage.setItem("mirror-lc-history", JSON.stringify(history));
      } catch {
        /* storage unavailable */
      }
      return { lcHistory: history };
    }),
  toggleLcFavorite: (id) =>
    set((s) => {
      const track = s.lcHistory.find((t) => t.id === id);
      if (!track?.libraryId) return {}; // only vault rows carry a heart
      const favorite = !track.favorite;
      void fetch("/api/music-library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: track.libraryId, favorite }),
      }).catch(() => undefined);
      const history = s.lcHistory.map((t) =>
        t.id === id ? { ...t, favorite } : t
      );
      persistLcHistory(history);
      return {
        history,
        ...(s.lcTrack && s.lcTrack.id === id
          ? { lcTrack: { ...s.lcTrack, favorite } }
          : {}),
      };
    }),
  resumeLcLibrary: async () => {
    const me = get().me;
    if (!me || me.email.startsWith("anon:")) return; // guests keep their own keeping
    try {
      const res = await fetch("/api/music-library");
      if (res.status === 401) return; // the passage rested — the device keeps what it has
      if (!res.ok) return;
      const payload = (await res.json().catch(() => null)) as
        | LcLibraryPayload
        | null;
      if (!payload) return;
      mergeVaultShelf(get, set, payload);
      watchVaultJobs(get, set, payload.jobs ?? []);
    } catch {
      /* the vault rested — the shelf stays as it was */
    }
  },

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

  /* THE FLOOR'S OWN SEED — a threshold door's first words for the
     realm's whisper line; the floor takes them once and spends them. */
  seedFloor: (value) => set({ floorSeed: value }),
  takeFloorSeed: () => {
    const v = get().floorSeed;
    if (v) set({ floorSeed: "" });
    return v;
  },

  focusComposer: () =>
    set((s) => ({ composerFocusNonce: s.composerFocusNonce + 1 })),

  returnToObservatory: () => set({ view: "observatory" }),

  /* the whole-page swipe — a right swipe walks back through the
     journey, a left swipe returns forward, like the page turning */
  navigateBack: () => {
    const s = get();
    const prev = s.viewPast[s.viewPast.length - 1];
    if (!prev) return;
    navLock = true;
    set({
      viewPast: s.viewPast.slice(0, -1),
      viewFuture: [...s.viewFuture, s.view].slice(-40),
      view: prev,
      mobileNavOpen: false,
      modal: null,
    });
    navLock = false;
  },
  navigateForward: () => {
    const s = get();
    const next = s.viewFuture[s.viewFuture.length - 1];
    if (!next) return;
    navLock = true;
    set({
      viewFuture: s.viewFuture.slice(0, -1),
      viewPast: [...s.viewPast, s.view].slice(-40),
      view: next,
      mobileNavOpen: false,
      modal: null,
    });
    navLock = false;
  },

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

  /** A fresh chat inside one world — the manifest core (with its
      blueprint bench), the quantum core or the med nexus returns to
      its quiet origin. */
  clearWorldChat: (world) =>
    set(() => {
      if (world === "manifest") {
        return {
          osMessages: [],
          osStatus: "idle" as TransmissionStatus,
          osError: null,
          osDraft: "",
          ...emptyLab,
        };
      }
      if (world === "quantum") {
        return {
          pxMessages: [],
          pxStatus: "idle" as TransmissionStatus,
          pxError: null,
          pxDraft: "",
        };
      }
      if (world === "artx") {
        return {
          axMessages: [],
          axStatus: "idle" as TransmissionStatus,
          axError: null,
          axDraft: "",
        };
      }
      return {
        emMessages: [],
        emStatus: "idle" as TransmissionStatus,
        emError: null,
        emDraft: "",
      };
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

  /* ------- the chat archive — the ChatGPT keeping, client-side only -- */

  hydrateChats: () => {
    /* THE CARRY LAW — the shelf returning its volumes turns the wheel:
       an answer still in flight belongs to the breath before this one. */
    channelGeneration += 1;
    /* THE GUEST'S OWN LAW — the landing chat is temporary for the
       unnamed: nothing returns from the shelf, nothing rests on it.
       Only a signed keeper's words come home on a reload. */
    const keeper = get().me;
    if (!keeper || keeper.email.startsWith("anon:")) return;
    /* The archive wakes: every surface's active conversation returns to
       the live room exactly as it was left — reload, journey, nothing
       parts the visitor from their words. */
    try {
      const patch: Record<string, unknown> = {};
      const surfaces: ChatSurface[] = [
        "os",
        "px",
        "em",
        "ax",
        "forge",
        "interplanetary",
        "healing",
      ];
      for (const surface of surfaces) {
        const chat = getChat(surface, getActiveChatId(surface));
        if (!chat || chat.messages.length === 0) continue;
        const messages = chat.messages as never[];
        if (surface === "os") {
          patch.osMessages = messages;
        } else if (surface === "px") {
          patch.pxMessages = messages;
          if (chat.meta?.scope !== undefined) patch.pxScope = chat.meta.scope;
          if (chat.meta?.fusion) patch.pxFusion = chat.meta.fusion;
        } else if (surface === "em") {
          patch.emMessages = messages;
          if (chat.meta?.scope !== undefined) patch.emVector = chat.meta.scope;
          if (chat.meta?.fusion) patch.emFusion = chat.meta.fusion;
        } else if (surface === "ax") {
          patch.axMessages = messages;
          if (chat.meta?.scope !== undefined) patch.axScope = chat.meta.scope;
        } else if (surface === "forge") {
          patch.forgeSession = {
            ...emptySession(),
            messages: messages as ChatMessage[],
          };
        } else {
          patch.sessions = {
            ...get().sessions,
            [surface]: {
              ...emptySession(),
              messages: messages as ChatMessage[],
            },
          };
        }
      }
      if (Object.keys(patch).length > 0) {
        hydrating = true;
        set(patch as Partial<MirrorState>);
        hydrating = false;
      }
    } catch {
      /* the shelf stayed closed — the session simply begins fresh */
    }
  },

  newChat: (surface) => {
    /* THE CARRY LAW — a fresh page turns the wheel: any answer still in
       flight belongs to the page that just closed, never to this one. */
    channelGeneration += 1;
    /* THE CHATGPT TURN — the present conversation already rests on the
       shelf (the autosave kept it current); a fresh page opens and the
       old one can always be reopened from the conversation panel.
       THE GUEST'S OWN LAW — a temporary chat lays nothing down: only a
       signed keeper's "new chat" touches the shelf. */
    const turner = get().me;
    if (turner && !turner.email.startsWith("anon:")) startNewChat(surface);
    if (surface === "os") {
      set({
        osMessages: [],
        osStatus: "idle" as TransmissionStatus,
        osError: null,
        osDraft: "",
        ...emptyLab,
      });
    } else if (surface === "px") {
      set({
        pxMessages: [],
        pxStatus: "idle" as TransmissionStatus,
        pxError: null,
        pxDraft: "",
      });
    } else if (surface === "em") {
      set({
        emMessages: [],
        emStatus: "idle" as TransmissionStatus,
        emError: null,
        emDraft: "",
      });
    } else if (surface === "ax") {
      set({
        axMessages: [],
        axStatus: "idle" as TransmissionStatus,
        axError: null,
        axDraft: "",
      });
    } else if (surface === "forge") {
      set({
        forgeSession: emptySession(),
        toolStatus: "idle" as ToolStatus,
        toolId: null,
        toolInput: "",
        toolResult: null,
        toolError: null,
      });
    } else {
      set((s) => ({ sessions: { ...s.sessions, [surface]: emptySession() } }));
    }
    set((s) => ({ archiveTick: s.archiveTick + 1 }));
  },

  openChat: (surface, id) => {
    /* THE CARRY LAW — a restored volume turns the wheel: an answer in
       flight from the old page never stains the volume being opened. */
    channelGeneration += 1;
    /* the guest's law — a temporary chat has no shelf to reopen */
    const opener = get().me;
    if (!opener || opener.email.startsWith("anon:")) return;
    const chat = getChat(surface, id);
    if (!chat) return;
    setActiveChatOnShelf(surface, id);
    hydrating = true;
    try {
      const messages = chat.messages as never[];
      if (surface === "os") {
        set({
          osMessages: messages,
          osStatus: "idle" as TransmissionStatus,
          osError: null,
          osDraft: "",
        });
      } else if (surface === "px") {
        set({
          pxMessages: messages,
          pxStatus: "idle" as TransmissionStatus,
          pxError: null,
          pxDraft: "",
          ...(chat.meta?.scope !== undefined
            ? { pxScope: chat.meta.scope }
            : {}),
          ...(chat.meta?.fusion ? { pxFusion: chat.meta.fusion } : {}),
        });
      } else if (surface === "em") {
        set({
          emMessages: messages,
          emStatus: "idle" as TransmissionStatus,
          emError: null,
          emDraft: "",
          ...(chat.meta?.scope !== undefined
            ? { emVector: chat.meta.scope }
            : {}),
          ...(chat.meta?.fusion ? { emFusion: chat.meta.fusion } : {}),
        });
      } else if (surface === "ax") {
        set({
          axMessages: messages,
          axStatus: "idle" as TransmissionStatus,
          axError: null,
          axDraft: "",
          ...(chat.meta?.scope !== undefined
            ? { axScope: chat.meta.scope }
            : {}),
        });
      } else if (surface === "forge") {
        set({
          forgeSession: {
            ...emptySession(),
            messages: messages as ChatMessage[],
          },
          toolError: null,
        });
      } else {
        set((s) => ({
          sessions: {
            ...s.sessions,
            [surface]: {
              ...emptySession(),
              messages: messages as ChatMessage[],
            },
          },
        }));
      }
    } finally {
      hydrating = false;
    }
    set((s) => ({ archiveTick: s.archiveTick + 1 }));
  },

  deleteChat: (surface, id) => {
    const wasActive = getActiveChatId(surface) === id;
    deleteChatOnShelf(surface, id);
    /* the room itself quiets when the deleted conversation was open */
    if (wasActive) {
      if (surface === "os") {
        set({ osMessages: [], osStatus: "idle" as TransmissionStatus, osError: null, osDraft: "" });
      } else if (surface === "px") {
        set({ pxMessages: [], pxStatus: "idle" as TransmissionStatus, pxError: null, pxDraft: "" });
      } else if (surface === "em") {
        set({ emMessages: [], emStatus: "idle" as TransmissionStatus, emError: null, emDraft: "" });
      } else if (surface === "ax") {
        set({ axMessages: [], axStatus: "idle" as TransmissionStatus, axError: null, axDraft: "" });
      } else if (surface === "forge") {
        set({ forgeSession: emptySession() });
      } else {
        set((s) => ({ sessions: { ...s.sessions, [surface]: emptySession() } }));
      }
    }
    set((s) => ({ archiveTick: s.archiveTick + 1 }));
  },

  retryFailed: (target, messageId) => {
    /* ONE TOUCH RE-SENDS the words the field could not hold — the
       visitor never retypes a question the chamber went quiet on. */
    let query = "";
    if (target === "os") {
      const m = get().osMessages.find((x) => x.id === messageId);
      query = m?.text ?? "";
      set((s) => ({
        osMessages: s.osMessages.filter((x) => x.id !== messageId),
        osStatus: "idle" as TransmissionStatus,
        osError: null,
      }));
    } else if (target === "px") {
      const m = get().pxMessages.find((x) => x.id === messageId);
      query = m?.text ?? "";
      set((s) => ({
        pxMessages: s.pxMessages.filter((x) => x.id !== messageId),
        pxStatus: "idle" as TransmissionStatus,
        pxError: null,
      }));
    } else if (target === "em") {
      const m = get().emMessages.find((x) => x.id === messageId);
      query = m?.text ?? "";
      set((s) => ({
        emMessages: s.emMessages.filter((x) => x.id !== messageId),
        emStatus: "idle" as TransmissionStatus,
        emError: null,
      }));
    } else if (target === "ax") {
      const m = get().axMessages.find((x) => x.id === messageId);
      query = m?.text ?? "";
      set((s) => ({
        axMessages: s.axMessages.filter((x) => x.id !== messageId),
        axStatus: "idle" as TransmissionStatus,
        axError: null,
      }));
    } else if (target === "forge") {
      const m = get().forgeSession.messages.find((x) => x.id === messageId);
      query = m?.query ?? "";
      set((s) => ({
        forgeSession: {
          ...s.forgeSession,
          messages: s.forgeSession.messages.filter((x) => x.id !== messageId),
          status: "idle",
          error: null,
        },
      }));
    } else {
      const m = get().sessions[target].messages.find(
        (x) => x.id === messageId
      );
      query = m?.query ?? "";
      set((s) => ({
        sessions: {
          ...s.sessions,
          [target]: {
            ...s.sessions[target],
            messages: s.sessions[target].messages.filter(
              (x) => x.id !== messageId
            ),
            status: "idle",
            error: null,
          },
        },
      }));
    }
    if (!query) return;
    if (target === "os") void get().askOS(query);
    else if (target === "px") void get().askPX(query);
    else if (target === "em") void get().askEM(query);
    else if (target === "ax") void get().askArtX(query);
    else if (target === "forge") void get().askForge(query);
    else void get().askMirror(query);
  },

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
      const history = session.messages.slice(-10).map((m) => ({
        q: m.query,
        a: m.text,
      }));
      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await speakDoor("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "forge",
          language: get().language,
          history,
          depth: get().sendDepth(),
          ...(payload ?? {}),
        }),
      });
      const data = await res.json().catch(() => null);
      raiseEnergy(res.status, data);
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
      /* the coals' quiet law — the visitor's words stay on the anvil,
         marked and retryable; nothing is asked twice by hand */
      set((s) => ({
        forgeSession: {
          ...s.forgeSession,
          status: "error",
          activeQuery: "",
          messages: [
            ...s.forgeSession.messages,
            {
              id: nextMessageId(),
              query,
              text: "",
              classification: "WORLD_BUILDING" as const,
              createdAt: new Date().toISOString(),
              failed: true,
            },
          ],
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

  /* ---- the creation seed — the branch's words riding to a theme page ---- */
  setBranchCreationSeed: (seed) => set({ branchCreationSeed: seed }),

  /* ---- the random mystery creation — one strike, one conception ---- */
  setMysteryDial: (group, id) =>
    set((s) => ({
      mysteryDials: { ...s.mysteryDials, [group]: id },
      /* a new dial setting cools the previous creation */
      mysteryStatus: s.mysteryStatus === "ready" ? "idle" : s.mysteryStatus,
      mystery: s.mysteryStatus === "ready" ? null : s.mystery,
    })),

  strikeMystery: async (directive) => {
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
          /* THE BRANCH'S OWN WORDS — a creation chip's whisper leads
             the forge: the dials and the embers yield to the branch
             the visitor walked in from (the creation is born of the
             branch, made in this exact moment). */
          directive: directive?.trim() || undefined,
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

  workTool: async (attachments) => {
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
          ...(attachments ? attachmentsToPayload(attachments) : {}),
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

  attachBranches: (target, messageId, branches) => {
    if (branches.length === 0) return;
    if (target === "os" || target === "px" || target === "em" || target === "ax") {
      set((s) => {
        const grown = <T extends { id: string; branches?: LearnedBranch[] }>(
          list: T[]
        ): T[] =>
          list.map((m) =>
            m.id === messageId && !m.branches ? { ...m, branches } : m
          );
        if (target === "os") return { osMessages: grown(s.osMessages) };
        if (target === "px") return { pxMessages: grown(s.pxMessages) };
        if (target === "ax") return { axMessages: grown(s.axMessages) };
        return { emMessages: grown(s.emMessages) };
      });
      return;
    }
    if (target === "forge") {
      set((s) => ({
        forgeSession: {
          ...s.forgeSession,
          messages: s.forgeSession.messages.map((m) =>
            m.id === messageId && !m.branches ? { ...m, branches } : m
          ),
        },
      }));
      return;
    }
    set((s) => ({
      sessions: {
        ...s.sessions,
        [target]: {
          ...s.sessions[target],
          messages: s.sessions[target].messages.map((m) =>
            m.id === messageId && !m.branches ? { ...m, branches } : m
          ),
        },
      },
    }));
  },

  askMirror: async (question, attachments, askScope, opts) => {
    const query = question.trim();
    const mode = get().activeMode;
    /* THE CATEGORY'S OWN DOOR — the ask speaks with the focused
       category's own voice (the forge answers for invent, the OS for
       the manifest, the narrator for quantum); without a scope the
       standing channel keeps its own door. THE THRESHOLD'S OWN VOICE —
       the open floor of the standing channel is NOT the interplanetary
       choir: it is the Mirror itself — humble, understanding,
       non-judging, a pure loving reflection — the voice the visitor
       meets at the landing and hears from the floor. */
    const apiMode = askScope
      ? askScope === "invent"
        ? "forge"
        : askScope
      : mode === "interplanetary"
        ? "mirror"
        : mode;
    const session = get().sessions[mode];
    /* THE CARRY LAW — the number this ask was born with; the answer
       may only land in a channel that has not turned its wheel. */
    const gen = channelGeneration;
    if (!query || session.status === "loading") return;

    /* IMAGE CRYSTALLIZATION — the visitor asked for an image by name:
       no LLM round-trip travels. The last channel (this thread's most
       recent reply) is crystallized at once, shaped by the visitor's
       own words; with an empty thread, the words themselves crystallize.
       THE MUSIC'S OWN DOOR — a song ask is a SOUND making, never a
       painting: the named music door outranks the generic visual
       detector ("create a song" opens the sound chamber's making
       inline), while a painted vision still paints. */
    if (isVisualIntent(query) && !MUSIC_INTENT.test(query)) {
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

    /* THE DIRECT GENERATION LAW — when the visitor's words ask a world
       to MAKE something (an akashic record, a card, an intention, a
       forging, a book, a poem, a sound transmission, a revelation, a
       remedy), no mirror speech travels and nothing waits at the
       bottom: the channel opens STRAIGHT into the making itself. The
       artifact is the reply — it mounts at once and conducts its own
       generation; where a making needs the visitor's hand (the forge's
       dials, the loom's shaping, the intention's charge), its own
       bench asks within the generation, and the strike follows. */
    if (sideKind || soundGift) {
      const kind: SideArtifactKind = sideKind ?? "codes";
      const artifact: SideArtifactRef = {
        kind,
        resonance: query,
        ...(kind === "book" && isBookResume(query) ? { resume: true } : {}),
        ...(kind === "codes" && themesForCodes ? { themes: themesForCodes } : {}),
        ...(kind === "quantum"
          ? { tool: detectQuantumTool(query) ?? undefined }
          : {}),
      };
      set((s) => ({
        view: "transmission",
        mobileNavOpen: false,
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "ready",
            activeQuery: "",
            draft: "",
            error: null,
            messages: [
              ...s.sessions[mode].messages,
              {
                id: nextMessageId(),
                query,
                text: "",
                classification: "WORLD_BUILDING" as const,
                createdAt: new Date().toISOString(),
                sideArtifact: artifact,
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
      void get().refreshMe();
      return;
    }

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
      const history = session.messages.slice(-10).map((m) => ({
        q: m.query,
        a: m.text,
      }));
      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await speakDoor("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: apiMode,
          language: get().language,
          history,
          depth: get().sendDepth(),
          ...(payload ?? {}),
          /* the miniature's own law — a small ask is met by a small,
             warm presence (the route's live-call voice) */
          ...(opts?.live ? { live: true } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      raiseEnergy(res.status, data);

      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The field is momentarily quiet. Rest, then try again."
        );
      }

      void get().refreshMe();

      /* THE CARRY LAW — the visitor walked on while the mirror spoke
         (a new chat, another category's fresh page, a kept volume
         restored): the answer stays with the page it belongs to, the
         words already resting on the archive's own shelf. */
      if (gen !== channelGeneration) return;

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
    } catch (err) {
      /* THE QUIET FIELD LAW — the visitor's words are never lost to a
         failed transmission: the question rests in the channel marked
         "not delivered", and one touch sends it again. No retyping. */
      if (gen !== channelGeneration) return;
      set((s) => ({
        sessions: {
          ...s.sessions,
          [mode]: {
            ...s.sessions[mode],
            status: "error",
            activeQuery: "",
            messages: [
              ...s.sessions[mode].messages,
              {
                id: nextMessageId(),
                query,
                text: "",
                classification: "WORLD_BUILDING" as const,
                createdAt: new Date().toISOString(),
                failed: true,
              },
            ],
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
          /* the visitor's own style — chosen through the "/" hand — rides along */
          ...(get().visualStyle ? { style: get().visualStyle } : {}),
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

      /* THE ONE ACTIVATION LAW — no silent second pass here either:
         the prepared-prompt card (with its one-touch recompose) is the
         graceful rest when the canvas stayed empty. */
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

  openRegister: (kind) => {
    set({ registerKind: kind });
    get().openToolTab("register");
  },

  exitRegister: () =>
    set((s) =>
      s.view === "register"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "register"),
            activeToolTab:
              s.activeToolTab === "register" ? null : s.activeToolTab,
          }
    ),

  /* ---------------- Mirror OS — Reality Guidance ---------------- */

  /** The OS is its own world: opening it suspends every other surface. */
  openMirrorOS: () => {
    set((s) => ({ labStage: s.labBlueprint ? "blueprint" : "compose" }));
    get().openToolTab("mirroros");
  },

  exitMirrorOS: () =>
    set((s) =>
      s.view === "mirroros"
        ? { view: "observatory" }
        : {
            view: "observatory",
            toolTabs: s.toolTabs.filter((k) => k !== "mirroros"),
            activeToolTab:
              s.activeToolTab === "mirroros" ? null : s.activeToolTab,
          }
    ),

  /* ------------- The passage — account, free door, profile ------------- */

  refreshMe: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        /* a degraded greeting (the vault resting — 503) keeps the last
           known face: a stale name beats an erased passage. Only an
           honest "signed out" body may clear the me. */
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        user?: MeUser | null;
        admin?: boolean;
        googleConfigured?: boolean;
        settings?: unknown;
        wallet?: WalletBalance | null;
      } | null;
      set({
        me: data?.user ? { ...data.user, admin: Boolean(data.admin) } : null,
        googleConfigured: Boolean(data?.googleConfigured),
        wallet: data?.wallet ?? get().wallet,
      });
      /* THE KEEPER'S RETURN — once the passage names its keeper, the
         conversations come home from the shelf (a guest keeps none:
         their chat is temporary by the house's own law). */
      const keeper = data?.user ?? null;
      if (keeper && !keeper.email.startsWith("anon:")) {
        get().hydrateChats();
      }
      /* the passage's own tuning comes home — language, voice, pace,
         the fields of expansion — on every device, every sign-in */
      if (data?.settings) get().applyRemoteSettings(data.settings);
      /* and when the vault has not met this visitor's tuning yet (the
         first sign-in), what they shaped as a guest travels up to it */
      if (data?.user && !data.user.email.startsWith("anon:") && !data.settings) {
        void get().pushSettings();
      }
    } catch {
      /* the passage keeps its silence — the laboratory stays open */
    }
  },

  setMe: (user) => set({ me: user }),

  /* ------------- The visitor's own light — the wallet ------------- */

  setWallet: (wallet) => set({ wallet }),

  refreshWallet: async () => {
    try {
      const res = await fetch("/api/wallet");
      const data = (await res.json().catch(() => null)) as {
        wallet?: WalletBalance | null;
        prices?: WalletPrices;
        packs?: WalletPack[];
      } | null;
      if (data && "wallet" in data)
        set({
          wallet: data.wallet ?? null,
          walletPrices: data.prices ?? get().walletPrices,
          walletPacks: data.packs ?? get().walletPacks,
        });
    } catch {
      /* the glance keeps its silence — the purse stays as it was */
    }
  },

  openWalletModal: (notice) => set({ walletModalOpen: true, walletNotice: notice ?? null }),
  closeWalletModal: () => set({ walletModalOpen: false, walletNotice: null }),

  openAuth: (mode = "signin") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),

  /* the full-screen profile room — the visitor's own room within the
     chat's frame (mounted inside AppShell's passageModals) */
  openProfilePage: () =>
    set({ profilePageOpen: true, authOpen: false, mobileNavOpen: false }),
  closeProfilePage: () => set({ profilePageOpen: false }),

  openAccount: () => set({ accountOpen: true, mobileNavOpen: false }),
  closeAccount: () => set({ accountOpen: false }),

  signOut: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* even if the line is quiet, the visitor leaves cleanly */
    }
    set({ me: null, wallet: null, walletModalOpen: false, walletNotice: null, authOpen: false, view: "observatory", toolTabs: [], activeToolTab: null, lastMakerTab: null });
  },

  /** The visitor's own cosmic library — free for everyone. */
  openLibrary: () => {
    get().openToolTab("library");
  },

  resumeDreamBook: (resume) => {
    set({ dreamResume: resume });
    get().openToolTab("dreambook");
  },
  clearDreamResume: () => set({ dreamResume: null }),
  setLastBookResonance: (echo) => set({ lastBookResonance: echo }),

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

  /* ---------------- Art X — the atelier ---------------- */

  /** THE ATELIER'S OWN DOOR — the atelier rides the makers' workplace
      now (the eleventh page of the registry): opening it lifts the
      workplace tab, exactly like every other maker. The old
      full-page world is gone with the one-frame law. */
  openArtX: () => get().openToolTab("artx"),

  exitArtX: () => set({ view: "observatory" }),

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

  askPX: async (question, attachments) => {
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

      const res = await speakDoor("/api/particlex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          scope: scopeName,
          fusion: fusionNames.length === 2 ? fusionNames : [],
          depth: get().sendDepth(),
          ...(attachments ? attachmentsToPayload(attachments) : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        revelation?: string;
        sections?: { heading: string; body: string }[];
        formulas?: string[];
        seal?: string;
        code?: string;
        error?: string;
      } | null;
      raiseEnergy(res.status, data);
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
            sections: Array.isArray(data?.sections)
              ? data.sections.filter(
                  (s) =>
                    s &&
                    typeof s.heading === "string" &&
                    typeof s.body === "string"
                )
              : undefined,
            seal: typeof data?.seal === "string" ? data.seal : "— ParticleX",
          },
        ],
      }));
    } catch (err) {
      /* the quiet law — the visitor's line stays in the thread, marked
         and retryable; the words are never asked twice by hand */
      set((s) => ({
        pxStatus: "error",
        pxMessages: s.pxMessages.map((m) =>
          m.id === visitorId ? { ...m, failed: true } : m
        ),
        pxError:
          err instanceof Error
            ? err.message
            : "ParticleX is momentarily quiet. Rest, then reach again.",
      }));
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

  askEM: async (question, attachments) => {
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

      const res = await speakDoor("/api/evolve-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          scope: vectorName,
          fusion: fusionNames.length === 2 ? fusionNames : [],
          depth: get().sendDepth(),
          ...(attachments ? attachmentsToPayload(attachments) : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        revelation?: string;
        sections?: { heading: string; body: string }[];
        formulas?: string[];
        seal?: string;
        code?: string;
        error?: string;
      } | null;
      raiseEnergy(res.status, data);
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
            sections: Array.isArray(data?.sections)
              ? data.sections.filter(
                  (s) =>
                    s &&
                    typeof s.heading === "string" &&
                    typeof s.body === "string"
                )
              : undefined,
            seal: typeof data?.seal === "string" ? data.seal : "— Evolve Med",
          },
        ],
      }));
    } catch (err) {
      /* the quiet law — the visitor's line stays in the thread, marked
         and retryable; the words are never asked twice by hand */
      set((s) => ({
        emStatus: "error",
        emMessages: s.emMessages.map((m) =>
          m.id === visitorId ? { ...m, failed: true } : m
        ),
        emError:
          err instanceof Error
            ? err.message
            : "Evolve Med is momentarily quiet. Rest, then reach again.",
      }));
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
          /* the visitor's own style — chosen through the "/" hand — rides along */
          ...(get().visualStyle ? { style: get().visualStyle } : {}),
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

      /* THE ONE ACTIVATION LAW — when the brushes rested, the prepared
         prompt and the painter's journal are shown and the visitor
         decides. The atelier never wakes a second time on its own: a
         silent re-run read to the visitor as the image creator
         activating twice. */
    } catch {
      set((s) => ({
        emStatus: "ready",
        emMessages: s.emMessages.map((m) =>
          m.id === visualId ? { ...m, visual: "error" as const } : m
        ),
      }));
    }
  },

  /* ---------------- Art X — the atelier's direct chat ---------------- */

  setAxDraft: (v) => set({ axDraft: v }),
  setAxScope: (id) => set({ axScope: id }),

  askArtX: async (question, attachments) => {
    const query = question.trim();
    if (!query || get().axStatus === "loading") return;

    const visitorId = nextMessageId();
    set((s) => ({
      axStatus: "loading",
      axError: null,
      axDraft: "",
      axMessages: [
        ...s.axMessages,
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
        .axMessages.filter((m) => m.id !== visitorId)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));

      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await speakDoor("/api/artx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          depth: get().sendDepth(),
          window: get().axScope ?? undefined,
          ...(payload ?? {}),
        }),
      });
      const data = await res.json().catch(() => null);
      raiseEnergy(res.status, data);
      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
            "The atelier is momentarily quiet. Rest, then reach again."
        );
      }

      void get().refreshMe();

      set((s) => ({
        axStatus: "ready",
        axMessages: [
          ...s.axMessages,
          { id: nextMessageId(), role: "ax" as const, text: data.reply },
        ],
      }));
    } catch (err) {
      /* the quiet law — the visitor's line stays in the thread, marked
         and retryable; the words are never asked twice by hand */
      set((s) => ({
        axStatus: "error",
        axMessages: s.axMessages.map((m) =>
          m.id === visitorId ? { ...m, failed: true } : m
        ),
        axError:
          err instanceof Error
            ? err.message
            : "The atelier is momentarily quiet. Rest, then reach again.",
      }));
    }
  },

  /* ------- Art X — the visualization engine (the atelier paints) ------- */

  askArtXVisual: async (question, context, regenerateOf, display) => {
    if (get().axStatus === "loading") return;
    const visualId = regenerateOf ? regenerateOf.id : nextMessageId();

    set((s) => ({
      axStatus: "loading",
      axError: null,
      axDraft: "",
      axMessages: regenerateOf
        ? s.axMessages.map((m) =>
            m.id === regenerateOf.id ? { ...m, visual: "pending" as const } : m
          )
        : [
            ...s.axMessages,
            {
              id: nextMessageId(),
              role: "visitor" as const,
              text: display ?? question,
            },
            {
              id: visualId,
              role: "ax" as const,
              text: "",
              visual: "pending" as const,
              visualRequest: question,
            },
          ],
    }));

    try {
      const history = get()
        .axMessages.filter((m) => !m.visual && m.id !== visualId)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          text: m.artifact
            ? `[a vision was created: "${m.artifact.title}" — ${m.artifact.subject}]`
            : m.text,
        }));

      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: get().language,
          /* the visitor's own style — chosen through the "/" hand — rides along */
          ...(get().visualStyle ? { style: get().visualStyle } : {}),
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
        axStatus: "ready",
        axMessages: s.axMessages.map((m) =>
          m.id === visualId
            ? { ...m, visual: undefined, artifact, text: "" }
            : m
        ),
      }));

      /* THE ONE ACTIVATION LAW — as in every channel: the atelier never
         wakes a second time on its own. A rested brush shows the
         prepared prompt; the visitor's hand decides on a repaint. */
    } catch {
      set((s) => ({
        axStatus: "ready",
        axMessages: s.axMessages.map((m) =>
          m.id === visualId ? { ...m, visual: "error" as const } : m
        ),
      }));
    }
  },

  setLabIntention: (v) => set({ labIntention: v }),
  setLabEmotion: (id) => set({ labEmotion: id }),
  setLabIntensity: (v) => set({ labIntensity: v }),

  resetLabDraft: () => set({ ...emptyLab }),

  /* ---------------- Manifest OS — direct chat ---------------- */

  setOsDraft: (v) => set({ osDraft: v }),

  askOS: async (question, attachments) => {
    const query = question.trim();
    if (!query || get().osStatus === "loading") return;

    const visitorId = nextMessageId();
    const osId = nextMessageId();
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
        /* the OS's own line is opened at once — the streaming answer
           fills it word by word, so the room is never blank */
        { id: osId, role: "os" as const, text: "" },
      ],
    }));

    /* the streaming answer — deltas gather in the stream's pending
       buffer and the os line drinks at most once per beat (the words
       still arrive whole; the room stops re-rendering per token);
       `immediate` (stream end, one-shot replies) lands the words at
       once and retires any beat still waiting, so no tail is lost */
    const writeOs = (text: string) =>
      set((s) => ({
        osMessages: s.osMessages.map((m) =>
          m.id === osId ? { ...m, text } : m
        ),
      }));
    const appendOs = (full: string, immediate = false) => {
      if (immediate) {
        if (osStream.timer != null) {
          window.clearTimeout(osStream.timer);
          osStream.timer = null;
        }
        osStream.id = null;
        osStream.text = null;
        writeOs(full);
        return;
      }
      osStream.id = osId;
      osStream.text = full;
      if (osStream.timer == null) {
        osStream.timer = window.setTimeout(() => {
          osStream.timer = null;
          const beatId = osStream.id;
          const text = osStream.text;
          osStream.id = null;
          osStream.text = null;
          if (!beatId || text == null) return;
          set((s) => ({
            osMessages: s.osMessages.map((m) =>
              m.id === beatId ? { ...m, text } : m
            ),
          }));
        }, OS_FLUSH_MS);
      }
    };

    try {
      const history = get()
        .osMessages.filter((m) => m.id !== visitorId && m.id !== osId)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const payload = attachments ? attachmentsToPayload(attachments) : null;
      const res = await speakDoor("/api/mirror-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          language: get().language,
          depth: get().sendDepth(),
          stream: true,
          ...(payload ?? {}),
        }),
      });

      /* a house without the streaming line — the whole reply at once */
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        raiseEnergy(res.status, data);
        if (!res.ok) {
          throw new Error(
            (data && data.error) ||
              "The OS is momentarily quiet. Rest, then reach again."
          );
        }
        appendOs(String(data.reply ?? ""), true);
        set({ osStatus: "ready" });
        void get().refreshMe();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      let settled = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buf.indexOf("\n\n")) !== -1) {
          const rawEvent = buf.slice(0, sep);
          buf = buf.slice(sep + 2);
          const line = rawEvent
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          let evt: {
            type?: string;
            text?: string;
            reply?: string;
            error?: string;
          };
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (evt.type === "delta" && evt.text) {
            full += evt.text;
            appendOs(full);
          } else if (evt.type === "done") {
            settled = true;
            full = evt.reply || full;
            appendOs(full, true);
            set({ osStatus: "ready" });
            void get().refreshMe();
          } else if (evt.type === "error") {
            throw new Error(
              evt.error ||
                "The OS is momentarily quiet. Rest, then reach again."
            );
          }
        }
      }
      /* the line closed without a settled end — what arrived stays */
      if (!settled) {
        if (full.trim()) {
          /* the tail lands now, synchronously */
          appendOs(full, true);
          set({ osStatus: "ready" });
          void get().refreshMe();
        } else {
          throw new Error(
            "The OS is momentarily quiet. Rest, then reach again."
          );
        }
      }
    } catch (err) {
      /* the stream's last breath — this line's pending beat flushes
         at once, so the error state never swallows words already
         received; a line that never received a word still leaves */
      if (osStream.id === osId) {
        if (osStream.timer != null) {
          window.clearTimeout(osStream.timer);
          osStream.timer = null;
        }
        const last = osStream.text;
        osStream.id = null;
        osStream.text = null;
        if (last != null && last.trim()) writeOs(last);
      }
      /* the quiet law — the visitor's line stays in the thread, marked
         and retryable; the words are never asked twice by hand */
      set((s) => ({
        osStatus: "error",
        osMessages:
          /* an os line that never received a word leaves the thread */
          s.osMessages.filter(
            (m) => !(m.id === osId && !m.text.trim())
          ),
        osError:
          err instanceof Error
            ? err.message
            : "The OS is momentarily quiet. Rest, then reach again.",
      }));
    }
  },

  /* ------- Manifest OS — the visualization engine ------- */

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
          /* the visitor's own style — chosen through the "/" hand — rides along */
          ...(get().visualStyle ? { style: get().visualStyle } : {}),
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

      /* THE ONE ACTIVATION LAW — as in every channel: the atelier never
         wakes a second time on its own. A rested brush shows the
         prepared prompt; the visitor's hand decides on a repaint. */
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
    /* THE LAZY VOICES — the chosen tongue travels at once */
    void ensureDict(code);
    try {
      localStorage.setItem("mirror-entity-language", code);
    } catch {
      /* storage unavailable */
    }
    void get().pushSettings();
  },

  setVoice: (id) => {
    set({ voice: id });
    try {
      localStorage.setItem("mirror-entity-voice", id);
    } catch {
      /* storage unavailable */
    }
    void get().pushSettings();
  },

  setPace: (value) => {
    const clamped = Math.min(2, Math.max(0.5, value));
    set({ pace: clamped });
    try {
      localStorage.setItem("mirror-entity-pace", String(clamped));
    } catch {
      /* storage unavailable */
    }
    void get().pushSettings();
  },

  /* THE VISITOR'S OWN LEVEL — raised by the visitor's own hand in the
     profile's settings room; -1 lays the decision back in the walk's
     own DNA (the standing law). Kept on the device like the voice. */
  setExpLevel: (level) => {
    const sane = Number.isFinite(level)
      ? Math.min(4, Math.max(-1, Math.floor(level)))
      : -1;
    set({ expLevel: sane });
    try {
      localStorage.setItem("mirror-entity-exp-level", String(sane));
    } catch {
      /* storage unavailable */
    }
  },

  sendDepth: () => {
    const walk = journeyDepth();
    const own = get().expLevel;
    /* the visitor's own tier stands above the walk's automatic one —
       but the walk still carries its honest step count */
    return own >= 0 ? { steps: walk.steps, tier: own } : walk;
  },

  setExpansionSeeds: (seeds) => {
    const clean = Array.from(
      new Set(
        seeds
          .map((s) => s.trim().replace(/\s+/g, " ").slice(0, 160))
          .filter((s) => s.length >= 2)
      )
    ).slice(0, 6);
    set({ expansionSeeds: clean });
    try {
      localStorage.setItem("mirror-entity-seeds", JSON.stringify(clean));
    } catch {
      /* storage unavailable */
    }
    void get().pushSettings();
  },

  applyRemoteSettings: (settings) => {
    if (!settings || typeof settings !== "object") return;
    const s = settings as {
      language?: string;
      voice?: string;
      pace?: number;
      seeds?: string[];
    };
    if (s.language && isLanguageCode(s.language)) {
      set({ language: s.language });
      try {
        localStorage.setItem("mirror-entity-language", s.language);
      } catch {
        /* storage unavailable */
      }
    }
    if (s.voice && isVoiceId(s.voice)) {
      set({ voice: s.voice });
      try {
        localStorage.setItem("mirror-entity-voice", s.voice);
      } catch {
        /* storage unavailable */
      }
    }
    if (typeof s.pace === "number" && Number.isFinite(s.pace)) {
      const clamped = Math.min(2, Math.max(0.5, s.pace));
      set({ pace: clamped });
      try {
        localStorage.setItem("mirror-entity-pace", String(clamped));
      } catch {
        /* storage unavailable */
      }
    }
    if (Array.isArray(s.seeds)) {
      const clean = s.seeds
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().slice(0, 160))
        .filter((x) => x.length >= 2)
        .slice(0, 6);
      set({ expansionSeeds: clean });
      try {
        localStorage.setItem("mirror-entity-seeds", JSON.stringify(clean));
      } catch {
        /* storage unavailable */
      }
    }
  },

  pushSettings: async () => {
    const { me, language, voice, pace, expansionSeeds } = get();
    if (!me || me.email.startsWith("anon:")) return;
    try {
      await fetch("/api/account/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { language, voice, pace, seeds: expansionSeeds },
        }),
      });
    } catch {
      /* the vault keeps its silence — the tuning stays local for now */
    }
  },

  bootPreferences: () => {
    if (typeof window === "undefined") return;
    /* the archive wakes first — the conversations return before the
       tuning is read, so the visitor lands back inside their words */
    get().hydrateChats();
    try {
      const lang = localStorage.getItem("mirror-entity-language");
      const voice = localStorage.getItem("mirror-entity-voice");
      const pace = Number(localStorage.getItem("mirror-entity-pace"));
      /* the visitor's own level — only an actually-kept value speaks
         (Number(null) is 0, and 0 is "first light", never a default) */
      const rawExpLevel = localStorage.getItem("mirror-entity-exp-level");
      const expLevel = rawExpLevel === null ? NaN : Number(rawExpLevel);
      const savedMix = loadTreeMix();
      const rawSeeds = localStorage.getItem("mirror-entity-seeds");
      const landingScope = sessionStorage.getItem("mirror:landing-scope");
      const seeds = rawSeeds
        ? (JSON.parse(rawSeeds) as unknown[]).filter(
            (s): s is string => typeof s === "string" && s.trim().length >= 2
          )
        : [];
      set({
        ...(isLanguageCode(lang) ? { language: lang } : {}),
        ...(isVoiceId(voice) ? { voice } : {}),
        ...(Number.isFinite(pace) && pace >= 0.5 && pace <= 2
          ? { pace }
          : {}),
        ...(Number.isFinite(expLevel) && expLevel >= -1 && expLevel <= 4
          ? { expLevel: Math.floor(expLevel) }
          : {}),
        ...(seeds.length > 0 ? { expansionSeeds: seeds.slice(0, 6) } : {}),
        ...(savedMix ? { treeMix: savedMix } : {}),
        /* THE LANDING'S OWN SCOPE — the session's choice wakes with
           the threshold (only the house's own keys are honored; an
           empty or stranger key falls back to the Mirror). */
        ...(landingScope && LANDING_SCOPES.includes(landingScope as LandingScopeKey)
          ? { landingScope: landingScope as LandingScopeKey }
          : {}),
      });
      /* THE LAZY VOICES — the visitor's own tongue wakes with the house */
      void ensureDict(isLanguageCode(lang) ? lang : "en");
    } catch {
      /* storage unavailable */
    }
  },

  chargeIntention: async (attachments) => {
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
          ...(attachments ? attachmentsToPayload(attachments) : {}),
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

/* ------------------------------------------------------------------ */
/*  THE MAKER'S TRAIL — every tool-tab open leaves one stone on the    */
/*  visit's own path (sessionStorage, capped, newest first): the       */
/*  history panel's trail room reads it, so the visitor can step back  */
/*  into any room this visit has opened. Nothing travels anywhere.     */
/* ------------------------------------------------------------------ */

const MAKER_TRAIL_KEY = "mirror:maker-trail";
const MAKER_TRAIL_MAX = 30;

interface MakerTrailStone {
  key: ToolTabKey;
  at: number;
}

function recordMakerTrail(key: ToolTabKey): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(MAKER_TRAIL_KEY);
    let trail: MakerTrailStone[] = [];
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        trail = parsed.filter(
          (e): e is MakerTrailStone =>
            Boolean(e) &&
            typeof (e as { key?: unknown }).key === "string" &&
            typeof (e as { at?: unknown }).at === "number"
        );
      }
    }
    const next: MakerTrailStone[] = [
      { key, at: Date.now() },
      ...trail,
    ].slice(0, MAKER_TRAIL_MAX);
    window.sessionStorage.setItem(MAKER_TRAIL_KEY, JSON.stringify(next));
  } catch {
    /* the visit's keeping stays closed — the tab still opens */
  }
}

/* ------------------------------------------------------------------ */
/*  THE LIBRARY'S OWN AUTOSHELF — a signed keeper's conversations walk */
/*  into the profile's Cosmic Library by themselves: after the         */
/*  browser's shelf write, the active thread of every surface is       */
/*  offered to /api/library (fire-and-forget — the words never wait).  */
/*  A tiny pointer (mirror:library-autoptr) remembers what each        */
/*  surface already laid on the shelf, so unchanged threads never      */
/*  travel twice. The sectors are the honest ones the house's own      */
/*  routes save to (mirror-os → manifest, the quantum world → quantum, */
/*  the nexus → evolvemed, the atelier → artx, the forge → invent,     */
/*  the main scopes → observatory).                                    */
/* ------------------------------------------------------------------ */

const LIBRARY_SECTOR_BY_SURFACE: Record<ChatSurface, string> = {
  os: "manifest",
  px: "quantum",
  em: "evolvemed",
  ax: "artx",
  forge: "invent",
  interplanetary: "observatory",
  healing: "observatory",
};

const LIBRARY_AUTOPTR_KEY = "mirror:library-autoptr";
/** one warn per visit — a shelf that refused never spams the console */
let libraryAutosaveMuted = false;

/** The conversation's own words, whatever shape the surface keeps. */
function surfaceMessages(
  surface: ChatSurface,
  s: MirrorState
): readonly unknown[] {
  switch (surface) {
    case "os":
      return s.osMessages;
    case "px":
      return s.pxMessages;
    case "em":
      return s.emMessages;
    case "ax":
      return s.axMessages;
    case "forge":
      return s.forgeSession.messages;
    case "interplanetary":
    case "healing":
      return s.sessions[surface].messages;
  }
}

/** The visitor's own first words — the thread's title, the way the
    archive names a chat (the scopes' pairs speak in `query`, the
    direct lines in a visitor-role `text`). */
function conversationFirstWhisper(messages: readonly unknown[]): string {
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const rec = m as { query?: unknown; role?: unknown; text?: unknown };
    const words =
      typeof rec.query === "string" && rec.query.trim()
        ? rec.query
        : (rec.role === undefined || rec.role === "visitor") &&
            typeof rec.text === "string" &&
            rec.text.trim()
          ? rec.text
          : "";
    if (words.trim()) return words.trim();
  }
  return "";
}

/** The mirror's last words — the excerpt the library's rows read. */
function conversationLastReply(messages: readonly unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || typeof m !== "object") continue;
    const rec = m as { query?: unknown; role?: unknown; text?: unknown };
    if (typeof rec.query === "string") {
      /* the scopes' own pair — the text is the mirror's reply */
      if (typeof rec.text === "string" && rec.text.trim())
        return rec.text.trim();
      continue;
    }
    const isVisitor = rec.role === undefined || rec.role === "visitor";
    if (!isVisitor && typeof rec.text === "string" && rec.text.trim())
      return rec.text.trim();
  }
  return "";
}

/** The thread in its smallest honest dress — the last pairs only,
    each side trimmed, the travel kept light. */
function conversationTurns(
  messages: readonly unknown[]
): { q?: string; a?: string }[] {
  const turns: { q?: string; a?: string }[] = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const rec = m as { query?: unknown; role?: unknown; text?: unknown };
    if (typeof rec.query === "string" && rec.query.trim()) {
      turns.push({
        q: rec.query.trim().slice(0, 2000),
        ...(typeof rec.text === "string" && rec.text.trim()
          ? { a: rec.text.trim().slice(0, 2000) }
          : {}),
      });
      continue;
    }
    const words = typeof rec.text === "string" ? rec.text.trim() : "";
    if (!words) continue;
    if (rec.role === undefined || rec.role === "visitor") {
      turns.push({ q: words.slice(0, 2000) });
    } else if (turns.length > 0) {
      turns[turns.length - 1].a = words.slice(0, 2000);
    } else {
      turns.push({ a: words.slice(0, 2000) });
    }
  }
  return turns.slice(-30);
}

function hashWords(words: string): string {
  let h = 5381;
  for (let i = 0; i < words.length; i++)
    h = ((h << 5) + h + words.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function saveConversationToLibrary(surface: ChatSurface, s: MirrorState): void {
  if (libraryAutosaveMuted || typeof window === "undefined") return;
  try {
    const messages = surfaceMessages(surface, s);
    /* a thread needs two words before it may rest on the library's shelf */
    if (messages.length < 2) return;
    const exchanges = conversationTurns(messages);
    if (exchanges.length === 0) return;
    const hash = hashWords(JSON.stringify(exchanges));
    let pointers: Record<string, { turns: number; hash: string }> = {};
    try {
      pointers = JSON.parse(
        window.localStorage.getItem(LIBRARY_AUTOPTR_KEY) ?? "{}"
      ) as typeof pointers;
    } catch {
      pointers = {};
    }
    const seen = pointers[surface];
    if (seen && seen.turns === messages.length && seen.hash === hash) return;
    const title = (conversationFirstWhisper(messages) || "A conversation").slice(
      0,
      60
    );
    const excerpt = conversationLastReply(messages).slice(0, 280);
    void fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector: LIBRARY_SECTOR_BY_SURFACE[surface],
        surface,
        title,
        excerpt,
        content: {
          kind: "conversation",
          surface,
          turns: messages.length,
          exchanges,
        },
      }),
    })
      .then((res) => {
        if (res.ok) {
          pointers[surface] = { turns: messages.length, hash };
          try {
            window.localStorage.setItem(
              LIBRARY_AUTOPTR_KEY,
              JSON.stringify(pointers)
            );
          } catch {
            /* the pointer rests unwritten — the next pass saves again, harmlessly */
          }
          return;
        }
        libraryAutosaveMuted = true;
        console.warn(
          `[library] autosave rests — /api/library answered ${res.status}; the threads stay on the browser's own shelf`
        );
      })
      .catch(() => {
        libraryAutosaveMuted = true;
        console.warn("[library] autosave could not reach the shelf");
      });
  } catch {
    /* never let the autoshef disturb the words */
  }
}

/* ------------------------------------------------------------------ */
/*  THE ARCHIVE'S QUIET HANDS — client-side keeping, zero servers.     */
/*  Every change to any conversation settles onto the browser's own    */
/*  shelf (debounced); every view change is recorded so the whole-page */
/*  swipe can walk the visitor back and return them forward.           */
/* ------------------------------------------------------------------ */

let saveTimer: number | null = null;

function archiveSurface(surface: ChatSurface, s: MirrorState) {
  switch (surface) {
    case "os":
      saveActiveChat("os", { messages: s.osMessages });
      break;
    case "px":
      saveActiveChat("px", {
        messages: s.pxMessages,
        meta: { scope: s.pxScope, fusion: s.pxFusion },
      });
      break;
    case "em":
      saveActiveChat("em", {
        messages: s.emMessages,
        meta: { scope: s.emVector, fusion: s.emFusion },
      });
      break;
    case "ax":
      saveActiveChat("ax", {
        messages: s.axMessages,
        meta: { scope: s.axScope },
      });
      break;
    case "forge":
      saveActiveChat("forge", { messages: s.forgeSession.messages });
      break;
    case "interplanetary":
    case "healing":
      saveActiveChat(surface, { messages: s.sessions[surface].messages });
      break;
  }
}

if (typeof window !== "undefined") {
  /* the autosave — the words settle on the shelf shortly after they land */
  useMirror.subscribe((state) => {
    if (hydrating) return;
    /* THE GUEST'S OWN LAW — nothing an unnamed visitor whispers ever
       settles on the shelf: the landing chat stays temporary for the
       non logged-in, and only a keeper's words survive the reload. */
    const keeperNow = useMirror.getState().me;
    if (!keeperNow || keeperNow.email.startsWith("anon:")) return;
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      const s = useMirror.getState();
      hydrating = true;
      try {
        const surfaces: ChatSurface[] = [
          "os",
          "px",
          "em",
          "ax",
          "forge",
          "interplanetary",
          "healing",
        ];
        for (const surface of surfaces) {
          archiveSurface(surface, s);
          /* THE LIBRARY'S OWN AUTOSHELF — the same thread walks into
             the profile's Cosmic Library (keeper's pass only — the
             gate above —, deduped by its own pointer, fire-and-forget:
             the words never wait on the shelf). */
          saveConversationToLibrary(surface, s);
        }
      } catch {
        /* the shelf refused — the session copy still holds */
      } finally {
        hydrating = false;
      }
    }, 700);
  });

  /* the swipe's memory — every view change is recorded once, unless
     the change IS a back/forward turn (its own hands already placed
     the stones of the path) */
  useMirror.subscribe((state, prev) => {
    if (navLock || state.view === prev.view) return;
    useMirror.setState((st) => ({
      viewPast: [...st.viewPast, prev.view].slice(-40),
      viewFuture: [],
    }));
  });
}

export function findDossier(kind: DossierKind, id: string) {
  const list = kind === "civilization" ? civilizations : interdimensional;
  return list.find((d) => d.id === id) ?? null;
}
