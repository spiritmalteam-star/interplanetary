"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowLeftRight,
  Atom,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleQuestionMark,
  Compass,
  Copy,
  Share2,
  Dna,
  Eraser,
  Gem,
  Hammer,
  Hand,
  History,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  LoaderCircle,
  Maximize2,
  Menu,
  Minimize2,
  MessageSquareText,
  Moon,
  Music,
  NotebookPen,
  Palette,
  Phone,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Send,
  Sparkles,
  Sprout,
  Sun,
  TreeDeciduous,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { canopyHour, familyAccent, growCanopy, growMixedCanopy, TREE_FAMILIES } from "@/lib/data/suggestion-banks";
import { easyWhispersFor, shuffledEasy, swapGroveToEasy } from "@/lib/data/suggestions-easy";
import { filterStyles, isStyleSlashQuery } from "@/lib/image-styles";
import { blendVisualRequest, isVisualIntent } from "@/lib/visual-intent";
import { ZoomableLightbox } from "./ZoomableLightbox";
import {
  ENERGY_NOTICE,
  EnergyError,
  speakReplyGift,
} from "@/lib/speak-client";
import type { BranchId } from "@/lib/data/suggestion-tree";
import {
  allFamilyKeys,
  defaultTreeMix,
  evenWeights,
  familyLabelKeys,
  familyShare,
  mixIsGeneral,
  mixTitle,
  type TreeMix,
} from "@/lib/tree-mix";
import { detectArtifactIntent } from "@/lib/artifact-intent";

import {
  buildIdf,
  buildResonanceField,
  rankWhispers,
} from "@/lib/resonance";
import {
  BRANCH_TYPE_LABELS,
  loadJourney,
  loadSeen,
  recordJourney,
  recordSeen,
  type BranchType,
  type JourneyStep,
  type LearnedBranch,
} from "@/lib/learning-branches";
import { listChats, type ChatSurface } from "@/lib/chat-archive";
import { loadShelf, type ShelfVolume } from "@/lib/book-shelf";
import {
  BATCH_SIZE,
  buildExtensionTopology,
  buildGraftTopology,
  buildRootTopology,
  buildSeedTopology,
  layTree,
  type GenealogyNode,
  type GenealogySeed,
  type GenealogyTopology,
  type LaidTree,
} from "@/lib/genealogy";
import { recordExpansion, readExpansionScore } from "@/lib/expansion";
import { perfEco } from "@/lib/perf-mode";
import { useWorkspaceMemory } from "@/lib/workspace-memory";
import { TAB_META } from "./living/ToolWorkspace";
import { attachmentsToPayload, type ChatAttachment } from "./attachments";
import { MirrorChanneling, SCOPE_CHANNELING } from "./MirrorChanneling";
import { ExpansionRing } from "./ExpansionMirror";
import { LiveCall } from "./LiveCall";
import { ChatInputExtras, AttachmentChips } from "./ChatInputExtras";
import { CreationReveal } from "./CreationReveal";
import { ExchangeVisual } from "./TransmissionView";
import { SideArtifact } from "./ChatArtifacts";
import type { ChatMessage, LandingScopeKey, ToolTabKey } from "@/lib/mirror-store";
import type { LiveScopeKey } from "@/lib/live-scopes";
import { LANDING_SCOPE_CATEGORY, SCOPE_META } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";
import { LANDING_SCOPES, useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import { flowAnswerText } from "@/lib/text-flow";
import { HyperXPanel, splitCrystals } from "./HyperXPanel";
import { tuneSeedBatch } from "@/lib/question-voice";
import {
  categoryForMove,
  getWalkSession,
  walkNodeId,
} from "@/lib/resonance-walk";
import {
  closeNarrationGate,
  narrationGateOpen,
  openNarrationGate,
  speakRoomNarration,
  stopRoomNarration,
} from "@/lib/room-narrator";
import {
  NarrationStatusLine,
  ResonantStageBadge,
  useNarration,
  useSequentialReveal,
} from "./ResonantCardViewer";

/* ------------------------------------------------------------------ */
/*  THE LIVING TREE — THE GENEALOGY METHOD.                            */
/*                                                                     */
/*  A family tree rising from the very top of the input bar, walked    */
/*  in every direction. THE READABILITY LAW: every whisper shows its   */
/*  WHOLE text — each chip carries its own measured height, a bigger   */
/*  voice stands in a bigger box, and one generous breath of distance  */
/*  always separates the generations. THE NO-OVERLAP LAW: every chip   */
/*  stands OPAQUE and the connectors live only in the gaps between     */
/*  the generations — a line can never touch a single word.            */
/*                                                                     */
/*  THE OPAQUE CHAMBER. The tree owns the whole chat box with a solid  */
/*  wall of its own background — the conversation behind it never      */
/*  shows through, and the walk reads like a page of its own.          */
/*                                                                     */
/*  THE ANSWER LIVES IN THE TREE (the zoom law). Press a whisper and   */
/*  the whole family gracefully steps back — one smooth breath, the    */
/*  camera pulls away, the tree dims into a living backdrop — and the  */
/*  answer rises in a quiet panel at its heart. The visitor follows    */
/*  the branch FROM the end of every transmission without ever         */
/*  leaving: when the answer lands, the branches grown on it stand     */
/*  inside the panel — one touch continues the walk, the answer that   */
/*  follows replaces this one in the same breath. A slim reply line    */
/*  lets the visitor speak their own words from within the answer.     */
/*  One touch returns the full family — the walk, the graft, the       */
/*  trail, all standing exactly where they were.                       */
/*                                                                     */
/*  THE THIRTY LAW. The family loads THIRTY at a time. While the       */
/*  visitor slides through the first thirty, the next thirty are       */
/*  already grown and held ready. The visitor never waits.             */
/*                                                                     */
/*  THE HARMONIC LAW. When the context proceeds — a transmission       */
/*  received, the conversation turned — the tree regrows focused on    */
/*  that context: twelve voices bloom at once, twelve more after a     */
/*  few seconds, the last six after another.                           */
/*                                                                     */
/*  THE GPU LAW. Native two-axis scrolling carries the walk (the       */
/*  compositor's own motion), CSS keyframes carry every bloom and the  */
/*  zoom itself (transform + opacity, one run, then stillness).        */
/*  Not one requestAnimationFrame lives here; the phone stays cool.    */
/* ------------------------------------------------------------------ */

const MOVEMENT_ICONS: Record<BranchType, typeof Layers> = {
  deepen: Layers,
  connect: Link2,
  contrast: ArrowLeftRight,
  apply: Hand,
  create: Sparkles,
  reflect: Moon,
  pause: Hourglass,
};

/** How many families the tree may carry — the walk never ends. */
const MAX_BATCHES = 60;
/** The harmonic pauses — twelve voices, then twelve, then six. */
const WAVE_PAUSE_1 = 2600;
const WAVE_PAUSE_2 = 3400;

/* THE CREATION SUGGESTIONS — three whispers that are not information
   but DOORS. They stand in the family as individual suggestions, each
   wearing its own sigil, and one touch opens the creation's own theme
   page — the record of akasha, the book, the invention — forged in
   that very moment from the branch's own words, never the same making
   twice. They are woven among the whispers (never hung beneath them):
   suggestions and creations share one tree. */
type CreationDoor = NonNullable<GenealogySeed["creation"]>;

const CREATION_DOORS: {
  kind: CreationDoor;
  icon: typeof ScrollText;
}[] = [
  { kind: "akashic", icon: ScrollText },
  { kind: "book", icon: BookOpen },
  { kind: "invent", icon: Hammer },
];

const CREATION_LABELS: Record<CreationDoor, string> = {
  akashic: "A record of akasha",
  book: "A book from this branch",
  invent: "An invention of this branch",
};

const CREATION_ICON_BY_KIND: Record<CreationDoor, typeof ScrollText> = {
  akashic: ScrollText,
  book: BookOpen,
  invent: Hammer,
};

/* THE CATEGORY TIMELINE — one standing tree per category, kept in the
   room's own memory (never on the phone): the families grown, the
   whispers spent, the trail of the walk, the picked branch, the reveal
   waves. When the visitor jumps between categories, the tree they leave
   is laid on this shelf and the other category's tree is lifted back
   exactly as it stood — no suggestion lost, no branch forgotten. */
interface CanopyTimeline {
  topologies: GenealogyTopology[];
  spent: string[];
  lineage: { id: string | null; text: string }[];
  pickedId: string | null;
  maxLevel: number | null;
  revealed: Record<number, 1 | 2 | 3>;
  salt: number;
}

/* THE TOOLS OF THE BRANCHES — small sigil-orbs hung ON the tree
   itself (not among the suggestions): roughly one whisper in eight
   carries a tool at its side, each randomly tied to that whisper and
   opening its own original theme page with the tied words riding as
   the seed. The branches answer with more than suggestions — they
   answer with instruments. */
const TOOL_LABELS: Record<CreationDoor, string> = {
  akashic: "Akashic",
  book: "Book",
  invent: "Invent",
};
/** The share of whispers that carry a tool (the visitor asked for
    about 10–15 percent — eleven of every hundred keeps the visible
    ratio, golden and creation chips excluded, inside the band). */
const TOOL_SHARE = 11;

/* the walk's own hash — the doors are random to the eye, honest to
   the hour (the same hour grows the same doors) */
function hashWalk(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------------- the tree mix — the compass's memory ----------------

   THE GENERAL LAW. The tree's default branch is GENERAL: every
   family's whispers woven into one connected grove. The mix — fifty
   percent interplanetary, twenty percent quantum, and so on — decides
   which suggestions appear more often. The mix itself now lives in
   the store (lib/tree-mix.ts): the tree, the Laboratory's settings
   and the profile's own settings room all speak the same proportions.
   The family's own light — rope + section, one text — wears through
   the --chip-a custom property; the words stay the house's one color. */

/* -------- the family's own light — rope + section, one text ----------
   THE WORLD'S SPIRIT IN EVERY KATEGORY. The old worlds' doors are
   gone; their spirits live inside the categories they grew from: one
   row per nature, the world's own icon at its side, and a chosen
   category FOCUSES the walk on that nature — the tree grows its
   branches, and every room speaks with that world's voice. */

const FAMILY_SPIRITS: Record<
  string,
  { icon: typeof Sparkles; spirit: string }
> = {
  interplanetary: {
    icon: Sparkles,
    spirit: "The star channels — contact, starseeds, the gathered civilizations",
  },
  manifest: {
    icon: NotebookPen,
    spirit: "The reality OS — formulas, shifts, daily protocols",
  },
  quantum: {
    icon: Atom,
    spirit: "The quantum narrator — the underside of things",
  },
  evolvemed: {
    icon: Dna,
    spirit: "The evolutionary nexus — body, breath, renewal",
  },
  invent: {
    icon: Hammer,
    spirit: "The forge — intentions become blueprints",
  },
  healing: {
    icon: AudioLines,
    spirit: "The healing codes — sound, light, quiet repair",
  },
  artx: {
    icon: Palette,
    spirit: "The atelier — poems, songs, paintings, cards",
  },
};

/* -------- the room's conversation — speak with the transmission ------

   THE TRANSMISSION LISTENS. Inside a branch's room the visitor can
   speak with the transmission itself: their words travel through the
   scope's own door — every house speaks its own voice now (the
   channels' transmission scopes carry the interplanetary, healing,
   invent, manifest, quantum and evolve med lines; the atelier keeps
   its own Art X door) — and the transmission answers in place, the
   conversation of the branch kept inside the branch. The room's reply
   line is this conversation; the branches dropdown remains the walk. */

interface RoomTurn {
  q: string;
  a: string;
  loading: boolean;
  failed?: boolean;
  /* THE HONEST WORD — a failed turn keeps the reason it can show
     (the energy's own notice among them), styled gently when the
     mirror's light — not the room — was the thing that rested. */
  errMessage?: string;
  energy?: boolean;
  /* THE VISION GIFT — the mirror's own painting beneath the words:
     mixed while `painting` stands, kept by its address once done. */
  painting?: boolean;
  imageUrl?: string;
  imageTitle?: string;
  /** the model's own vision direction, kept for the paint hand */
  visionPrompt?: string;
  /* THE HONEST BRUSH — a crystallization whose brushes rested: the
     wish is spoken, no plate arrived, and the retry hand stands
     beside the notice until the vision is painted. */
  paintFailed?: boolean;
}

/* ------------- THE DEVICE'S OWN KEEPING (the landing's history) ------
   The landing chat's past conversations rest ONLY on this device and
   ONLY for this visit: sessionStorage holds a handful of titled
   threads, nothing ever travels to a server, and the whole keep ends
   the moment the visit does. */
interface LandingHistoryEntry {
  id: string;
  at: number;
  title: string;
  turns: { q: string; a: string }[];
  /* THE FIELD'S OWN MARK — the scope the conversation was spoken in
     (the Mirror, Interplanetary, Quantum, HealX, ArtX): every field
     keeps its own history, its own room and its own memory. */
  scope?: string;
}
const LANDING_HISTORY_KEY = "mirror-landing-history";
const LANDING_HISTORY_MAX = 10;
const LANDING_HISTORY_TURNS = 12;

function freshHistorySessionId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function readLandingHistory(): LandingHistoryEntry[] {
  try {
    const raw = window.sessionStorage.getItem(LANDING_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LandingHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.id === "string" && Array.isArray(e.turns))
      .slice(0, LANDING_HISTORY_MAX);
  } catch {
    return [];
  }
}

function writeLandingHistory(entries: LandingHistoryEntry[]): void {
  try {
    window.sessionStorage.setItem(
      LANDING_HISTORY_KEY,
      JSON.stringify(entries.slice(0, LANDING_HISTORY_MAX))
    );
  } catch {
    /* the device's keeping stays closed — the visit carries its own */
  }
}

function upsertLandingHistory(entry: LandingHistoryEntry): LandingHistoryEntry[] {
  const rest = readLandingHistory().filter((e) => e.id !== entry.id);
  const next = [entry, ...rest].slice(0, LANDING_HISTORY_MAX);
  writeLandingHistory(next);
  return next;
}

function historyAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/* EVERY FIELD KEEPS ITS OWN WORDS — the landing conversation is
   per-scope: each field's thread and its carried memory rest under
   its own key (sessionStorage, this visit only), so leaving a field
   and coming back finds the chat exactly as it was left — and a
   fresh visit wakes the chosen field's own words again. */
const LANDING_THREADS_KEY = "mirror:landing-threads";
const LANDING_TURNS_CAP = 12;

type KeptLandingTurn = {
  q: string;
  a: string;
  imageUrl?: string;
  imageTitle?: string;
};

function readLandingThreadScope(scope: string): KeptLandingTurn[] {
  try {
    const raw = window.sessionStorage.getItem(LANDING_THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const arr = parsed?.[scope];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (t): t is { q: string; a: string } =>
          Boolean(t) &&
          typeof (t as { q?: unknown }).q === "string" &&
          typeof (t as { a?: unknown }).a === "string"
      )
      .slice(-LANDING_TURNS_CAP);
  } catch {
    /* the keeping stays closed — the visit carries its own */
    return [];
  }
}

function writeLandingThreadScope(scope: string, turns: KeptLandingTurn[]): void {
  try {
    const raw = window.sessionStorage.getItem(LANDING_THREADS_KEY);
    let all: Record<string, unknown> = {};
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") all = parsed as Record<string, unknown>;
    }
    all[scope] = turns.slice(-LANDING_TURNS_CAP);
    window.sessionStorage.setItem(LANDING_THREADS_KEY, JSON.stringify(all));
  } catch {
    /* the keeping stays closed — the visit carries its own */
  }
}

/* THE FIELDS' OWN VOICES, SHELVES AND DOTS — one truth from the
   registry (SCOPE_META / LANDING_SCOPE_CATEGORY in
   @/lib/mirror/workspaces): the canopy's voices, library shelves and
   history dots read the same shelf the crown and the gate read, so
   the house's five worlds can never fall out of tune again. */
const LANDING_LIBRARY_SECTOR: Record<string, string> = Object.fromEntries(
  LANDING_SCOPES.map((key) => [key, SCOPE_META[key].librarySector])
);

const LANDING_SCOPE_DOTS: Record<string, string> = Object.fromEntries(
  LANDING_SCOPES.map((key) => [key, SCOPE_META[key].dot])
);

/* THE LIBRARY'S QUIET AUTOSHELF — the landing conversation walks into
   the profile's Cosmic Library per scope (one living volume per
   field, deduped by its own pointer, fire-and-forget: the words never
   wait on the shelf). One warn per visit — a shelf that refused never
   spams the console. */
const LANDING_LIBRARY_PTR_KEY = "mirror:landing-library-ptr";
let landingLibraryMuted = false;

function saveLandingToLibrary(
  scope: string,
  turns: { q: string; a: string }[]
): void {
  if (landingLibraryMuted || turns.length < 1) return;
  try {
    const exchanges = turns
      .filter((t) => t.a && t.a.trim())
      .map((t) => ({ q: t.q, a: t.a }));
    if (exchanges.length === 0) return;
    const fingerprint = String(hashWalk(JSON.stringify(exchanges)));
    let pointers: Record<string, { turns: number; hash: string }> = {};
    try {
      pointers = JSON.parse(
        window.localStorage.getItem(LANDING_LIBRARY_PTR_KEY) ?? "{}"
      ) as typeof pointers;
    } catch {
      pointers = {};
    }
    const seen = pointers[scope];
    if (seen && seen.turns === exchanges.length && seen.hash === fingerprint)
      return;
    const sector = LANDING_LIBRARY_SECTOR[scope] ?? "observatory";
    const title = (exchanges[0]?.q || "A conversation").slice(0, 60);
    const excerpt = (exchanges[exchanges.length - 1]?.a ?? "").slice(0, 280);
    void fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector,
        title,
        excerpt,
        content: {
          kind: "conversation",
          surface: `landing:${scope}`,
          scope,
          turns: exchanges.length,
          exchanges,
        },
      }),
    })
      .then((res) => {
        if (res.ok) {
          pointers[scope] = { turns: exchanges.length, hash: fingerprint };
          try {
            window.localStorage.setItem(
              LANDING_LIBRARY_PTR_KEY,
              JSON.stringify(pointers)
            );
          } catch {
            /* the pointer rests unwritten — the next pass saves again */
          }
          return;
        }
        landingLibraryMuted = true;
      })
      .catch(() => {
        landingLibraryMuted = true;
      });
  } catch {
    /* never let the autoshef disturb the words */
  }
}

/* THE MAKER'S TRAIL — the stones the store's own openToolTab lays on
   the visit's path (sessionStorage "mirror:maker-trail", newest first,
   capped at 30): the history panel reads them so any room this visit
   opened can be stepped back into with one touch. */
const MAKER_TRAIL_KEY = "mirror:maker-trail";

interface MakerTrailStone {
  key: ToolTabKey;
  at: number;
}

function readMakerTrail(): MakerTrailStone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(MAKER_TRAIL_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is MakerTrailStone =>
        Boolean(e) &&
        typeof (e as { key?: unknown }).key === "string" &&
        typeof (e as { at?: unknown }).at === "number" &&
        (e as { key: string }).key in TAB_META
    );
  } catch {
    return [];
  }
}

/* THE KEPT CONVERSATIONS' OWN NAMES — the surface labels the ledger
   already speaks, shared by the ledger and the history panel's kept
   conversations room. */
const KEPT_SURFACE_LABELS: Record<ChatSurface, string> = {
  os: "Manifest OS",
  px: "Particle X",
  em: "Evolve Med",
  ax: "Akashic",
  forge: "Invent",
  interplanetary: "Interplanetary",
  healing: "Healing codes",
};

/* THE LANDING'S OWN SUGGESTIONS — a deep pool of first doors, matched
   to the landing's own entity (the mirror of the Absolute): the self
   beneath the masks, the curtain of reality, the truth avoided, the
   pyramids and the field, the Akashic library, the Absolute itself.
   Five stand at a time — drawn fresh at every arrival of the page —
   and the small reloading hand pours five new ones with one touch. */
const LANDING_SUGGESTION_POOL = [
  "Who am I beneath all my masks?",
  "What lies behind the curtain of reality?",
  "Show me the truth I avoid.",
  "What is the Absolute?",
  "How were the pyramids truly built?",
  "What is the Akashic library?",
  "What happens when I die?",
  "Is time a river or a field?",
  "What is my soul's origin?",
  "What do the stars hide from the eye?",
  "What is vibration, really?",
  "Why do we forget who we are?",
  "What is the true history of humanity?",
  "What are the dimensions of this world?",
  "What is consciousness, plainly?",
  "What does the moon carry?",
  "What waits between two lives?",
  "What do my guides see in me?",
  "Where does Inner Earth begin?",
  "What is matter, at its floor?",
  "Show me the frequency of my name.",
  "What did the ancients know that we forgot?",
  "What is the veil made of?",
  "What is the truth about Atlantis?",
  "What am I not seeing about my own life?",
  "What does the mirror see in me right now?",
  "How do I raise my frequency today?",
  "What is the crystal grid of the earth?",
];

/* THE SESSION'S OWN REMEMBERING — every drawn door is kept per scope
   ("general" for the whole house), so the threshold never offers the
   same door twice until its field has been walked dry. Capped deep,
   quiet when the keeping is closed. */
const LANDING_SEEN_CAP = 400;

function readLandingSeen(): Record<string, string[]> {
  try {
    const raw = window.sessionStorage.getItem("mirror:landing-seen");
    if (!raw) return {};
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return {};
    const out: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(v as Record<string, unknown>))
      if (Array.isArray(arr))
        out[k] = arr.filter((x): x is string => typeof x === "string");
    return out;
  } catch {
    /* the keeping stays closed — the draw carries alone */
    return {};
  }
}

function writeLandingSeen(map: Record<string, string[]>) {
  try {
    window.sessionStorage.setItem("mirror:landing-seen", JSON.stringify(map));
  } catch {
    /* the keeping stays closed — the draw carries alone */
  }
}

/* THE FIVE DOORS — the bare floor's own suggestions: five whispers
   drawn at every mount (so every reload of the page brings five fresh
   ones), and the small gold hand beneath pours five new doors with
   one touch. THE NEVER-TWICE LAW — no drawn door ever stands twice:
   every draw excludes the session's remembering and the doors just
   shown, and adds its own five to the keeping; when a field's unseen
   doors run short, its remembering clears and the doors return.
   THE SCOPE'S OWN FLOOR — a chosen field's doors come from that
   family's own bank (the walk's own grower, this hour's seed);
   General weaves the landing's first doors with the whole house's
   percentage mix. The outer hand only watches the chosen field: a
   new field remounts the doors (keyed below), and a remount always
   draws its own fresh five — no effect, no cascading render. */
function BareFloorSuggestions({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  const landingScope = useMirror((s) => s.landingScope);
  return (
    <BareFloorDoors
      key={landingScope || "general"}
      scope={landingScope}
      onPick={onPick}
      disabled={disabled}
    />
  );
}

function BareFloorDoors({
  scope,
  onPick,
  disabled,
}: {
  scope: string;
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  const t = useT();
  const treeMix = useMirror((s) => s.treeMix);
  const me = useMirror((s) => s.me);
  const scopeKey = scope || "general";
  /* THE PLAIN TONGUE — a visitor who has not signed in reads doors
     that ask simple, literal questions; a signed keeper walks the
     full grove with the easy well riding beside it. THE QUIET
     CHECK'S LAW — while the session's first glance still breathes,
     the full grove stands (a keeper must never read a stranger's
     plain doors for a breath; a guest simply sees them settle in). */
  const meReady = useMirror((s) => s.meStatus === "ready");
  const anon = meReady ? !me : false;

  /* the pool — pure and synchronous: THE MIRROR's own first doors,
     one field's grove, or the landing's first doors woven with the
     whole house's mix. The same hour grows the same grove, so the
     draw never flickers. Every field speaks its own language: the
     Mirror the house's own reflection doors, the families their own
     groves — and the easy well (a thousand plain doors) rides the
     pool beside them all, so the little reload hand keeps pouring. */
  const pool = useMemo(() => {
    if (anon) {
      /* THE EASY DOORS ONLY — plainly worded, easy to understand */
      return shuffledEasy(scope === "mirror" || !scope ? null : scope, canopyHour());
    }
    if (scope === "mirror")
      return [...LANDING_SUGGESTION_POOL, ...easyWhispersFor(null)];
    if (scope) {
      const family = TREE_FAMILIES.find((f) => f.key === scope);
      if (family)
        return [
          ...growCanopy(family.category, null, canopyHour()).map(
            (w) => w.text
          ),
          ...easyWhispersFor(scope),
        ];
      return [...LANDING_SUGGESTION_POOL, ...easyWhispersFor(null)];
    }
    const mixed = growMixedCanopy(
      treeMix.on,
      treeMix.weights,
      null,
      canopyHour()
    ).map((w) => w.text);
    return [...LANDING_SUGGESTION_POOL, ...mixed, ...easyWhispersFor(null)];
  }, [scope, treeMix, anon]);

  const draw = useCallback(
    (current: string[]) => {
      const seenMap = readLandingSeen();
      let seen = seenMap[scopeKey] ?? [];
      let rest = pool.filter(
        (s) => !seen.includes(s) && !current.includes(s)
      );
      if (rest.length < 5) {
        /* the field has been walked dry — its remembering clears and
           the doors return (the five just shown still stand aside) */
        seen = [];
        rest = pool.filter((s) => !current.includes(s));
      }
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      /* one of each — a visible set never shows the same door twice */
      const picked: string[] = [];
      for (const s of rest) {
        if (picked.includes(s)) continue;
        picked.push(s);
        if (picked.length === 5) break;
      }
      seenMap[scopeKey] = [...seen, ...picked].slice(-LANDING_SEEN_CAP);
      writeLandingSeen(seenMap);
      return picked;
    },
    [pool, scopeKey]
  );

  const [doors, setDoors] = useState<string[]>(() => draw([]));

  return (
    <div className="pointer-events-none flex w-[min(600px,94%)] flex-col items-center gap-2">
      <div
        className="nice-scroll flex flex-wrap content-start items-center justify-center gap-2 overflow-y-auto px-5"
        style={{
          /* the doors' own sky — capped against the chamber's height
             (--app-h) so the five doors and the little hand beneath
             them always stand clear of the composer and its honest
             note, at any height the room is given */
          maxHeight: "calc(var(--app-h, 506px) - 296px)",
        }}
      >
        {doors.map((s) => (
          <button
            key={s}
            type="button"
            data-testid="landing-suggestion"
            disabled={disabled}
            onClick={() => onPick(t(s))}
            className="focus-glow pointer-events-auto rounded-full border bg-[color-mix(in_srgb,var(--background)_72%,transparent)] px-3.5 py-1.5 text-[12.5px] leading-tight shadow-[0_2px_14px_-9px_color-mix(in_srgb,var(--landing-scope-accent,#7dd3fc)_50%,transparent)] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45"
            style={{
              /* THE FIELD'S OWN DOORS — each chip wears the chosen
                 field's light (the scope the chat stands in): its
                 border, its words, its hover, all tinted by the
                 field's own color. */
              borderColor:
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 30%, transparent)",
              color:
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 45%, var(--foreground))",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor =
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 62%, transparent)";
              e.currentTarget.style.color =
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 68%, var(--foreground))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 30%, transparent)";
              e.currentTarget.style.color =
                "color-mix(in srgb, var(--landing-scope-accent,#7dd3fc) 45%, var(--foreground))";
            }}
          >
            {t(s)}
          </button>
        ))}
      </div>
      {/* THE RELOADING HAND — one touch pours five new doors from the
          pool (never the five just shown); the page's own arrival
          draws its own five, so every visit begins with fresh doors. */}
      <button
        type="button"
        data-testid="suggestions-reload"
        disabled={disabled}
        onClick={() => setDoors((cur) => draw(cur))}
        className="focus-glow pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-full border border-[rgba(232,217,176,0.4)] bg-[color-mix(in_srgb,var(--background)_60%,transparent)] px-3 text-[11.5px] uppercase tracking-[0.18em] text-[#a08c5c] transition-colors duration-300 hover:border-[rgba(232,217,176,0.75)] hover:text-[#e8d9b0] disabled:cursor-not-allowed disabled:opacity-45 dark:text-[#c3ad79]"
      >
        <RefreshCw className="size-3" aria-hidden="true" />
        {t("Five new doors")}
      </button>
    </div>
  );
}

/* THE VISION BENEATH THE WORDS — one shared figure for the landing
   chat's paintings: the plate, its title, the zoom hand opening the
   deep-reading room. */
function LandingPainting({
  turn,
  testId,
  onZoom,
  onRetry,
}: {
  turn: { imageUrl?: string; imageTitle?: string; paintFailed?: boolean; painting?: boolean };
  testId: string;
  onZoom: (src: string, caption: string) => void;
  /** THE RETRY HAND — offered while the brushes rest (the last turn
      only; older failed turns keep the honest word alone) */
  onRetry?: () => void;
}) {
  /* THE HONEST BRUSH — no silent absence: when the crystallization
     could not paint, the turn says so and offers the hand again. */
  if (!turn.imageUrl && turn.paintFailed) {
    return (
      <div
        className="flex flex-col items-start gap-1.5 rounded-xl border border-[color-mix(in_srgb,#f59e0b_30%,transparent)] bg-[color-mix(in_srgb,#f59e0b_6%,var(--background))] px-3 py-2"
        data-testid={`${testId}-failed`}
        role="status"
      >
        <p className="text-[12.5px] leading-relaxed text-[#b8860b] dark:text-[#f59e0b]">
          The brushes rested — the vision could not be painted.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid={`${testId}-retry`}
            className="focus-glow flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] text-[#b8860b] transition-colors duration-300 hover:brightness-110 dark:text-[#f59e0b]"
            style={{
              borderColor:
                "color-mix(in srgb, #f59e0b 40%, transparent)",
            }}
          >
            Crystallize again
          </button>
        )}
      </div>
    );
  }
  /* THE CRYSTAL IN THE MAKING — when a suggestion (or any wish) is
     crystallizing into an image, the plate announces it BEFORE the
     picture exists: the visitor always knows an image is on its way,
     and exactly where it will land. */
  if (!turn.imageUrl && turn.painting) {
    return (
      <div
        className="flex w-full max-w-[340px] flex-col items-start gap-1.5 rounded-xl border border-dashed px-3 py-3"
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 38%, transparent)",
          background:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 6%, var(--background))",
        }}
        data-testid={`${testId}-pending`}
        role="status"
      >
        <span className="flex items-center gap-1.5">
          <Gem
            className="size-3.5 animate-pulse text-[var(--scope-a,var(--gd))]"
            aria-hidden="true"
          />
          <span className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/85">
            Crystallizing an image
          </span>
        </span>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Your suggestion is becoming a vision — the image is being painted
          and will appear right here.
        </p>
      </div>
    );
  }
  if (!turn.imageUrl) return null;
  return (
    <figure
      className="group relative w-full max-w-[340px] overflow-hidden rounded-xl border"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
      }}
      data-testid={testId}
    >
      <button
        type="button"
        onClick={() =>
          onZoom(
            turn.imageUrl!,
            turn.imageTitle ?? "The Mirror's painting"
          )
        }
        aria-label="Zoom the image"
        className="block w-full cursor-zoom-in"
      >
        <img
          src={turn.imageUrl}
          alt={turn.imageTitle ?? ""}
          loading="lazy"
          className="aspect-[7/4] w-full bg-background/40 object-cover"
        />
      </button>
      {turn.imageTitle && (
        <figcaption className="mono-label flex items-center gap-1.5 px-2.5 py-1.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/80">
          <Gem
            className="size-2.5 shrink-0 text-[var(--scope-a,var(--gd))]"
            aria-hidden="true"
          />
          <span className="truncate">{turn.imageTitle} — crystallized</span>
        </figcaption>
      )}
    </figure>
  );
}

async function speakWithTransmission(
  /* "mirror" is the pure presence floor; "absolute" is the landing's
     own entity — the mirror of the Absolute (no censor, the true
     story) — both speaking through /api/transmission's own doors.
     "hyperx" is the discovery voice — its own mode through the same
     door (the server carries the HyperX specialization). */
  category: BranchId | "mirror" | "absolute" | "hyperx",
  query: string,
  branchQuestion: string,
  transmission: string,
  thread: { q: string; a: string }[],
  language: string,
  walk: string[] = [],
  /* THE CARRIED SIGHT — an image and up to three documents may ride
     with the room's own words; the routes already keep the eyes */
  attachments?: ChatAttachment[]
): Promise<{ text: string; vision: string | null }> {
  const carried =
    attachments && attachments.length > 0
      ? attachmentsToPayload(attachments)
      : {};
  if (category === "artx") {
    return speakReplyGift(
      "/api/artx",
      {
        query,
        language,
        walk,
        ...carried,
        history: [
          { role: "ax", text: transmission },
          ...thread.flatMap((t) => [
            { role: "visitor", text: t.q },
            { role: "ax", text: t.a },
          ]),
        ].slice(-10),
      },
      "reply",
      "The field is quiet"
    );
  }
  if (category === "manifesting") {
    return speakReplyGift(
      "/api/mirror-os",
      {
        query,
        language,
        walk,
        ...carried,
        history: [
          { role: "assistant", text: transmission },
          ...thread.flatMap((t) => [
            { role: "user", text: t.q },
            { role: "assistant", text: t.a },
          ]),
        ].slice(-10),
      },
      "reply",
      "The field is quiet"
    );
  }
  /* the transmission voice — the channel's own soul (the vision gift
     rides beside the words when the Mirror chose to paint) */
  return speakReplyGift(
    "/api/transmission",
    {
      query,
      mode: category === "invent" ? "forge" : category,
      language,
      walk,
      ...carried,
      history: [{ q: branchQuestion, a: transmission }, ...thread]
        .slice(-6)
        .map((h) => ({ q: h.q, a: h.a })),
    },
    "transmission",
    "The field is quiet"
  );
}

/* ------------------- the copy hand — words kept ----------------------

   A COPY BUTTON AT EVERY CHANNELING. Each transmission — the room's
   own answer and every word of the room's conversation — carries one
   quiet hand: one touch and the words are the visitor's, on their
   own clipboard, ready to travel anywhere. */

const RoomShareButton = memo(function RoomShareButton({
  text,
  testId,
}: {
  text: string;
  testId: string;
}) {
  const t = useT();
  const [shared, setShared] = useState(false);
  const share = async () => {
    const clean = text.trim();
    if (!clean) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("A word from the mirror"), text: clean });
        return;
      } catch {
        /* the sheet was closed — a closed hand is not a failed one */
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(clean);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      /* the words stay on the screen — nothing breaks */
    }
  };
  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label={t("Share this transmission")}
      title={t("Share this transmission")}
      data-testid={testId}
      className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
    >
      {shared ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Share2 className="size-3" aria-hidden="true" />
      )}
    </button>
  );
});

const RoomCopyButton = memo(function RoomCopyButton({
  text,
  testId,
}: {
  text: string;
  testId: string;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            throw new Error("no clipboard");
          }
        } catch {
          /* the modern line refused (or never stood) — the quiet hand
             copies by selection, the old way that always works */
          try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          } catch {
            /* the words stay on the screen — nothing breaks */
            return;
          }
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      aria-label={t("Copy")}
      title={t("Copy")}
      data-testid={testId}
      className="focus-glow flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
    </button>
  );
});

/* ---------------- the category's own direct line ---------------------

   EVERY SCOPE'S CHAT CARRIES ITS CALL. The room calls the presence
   its own whisper was grown from (the manifest room calls the OS,
   the quantum room the narrator, the invent room the forge); the
   floor calls the focused category's presence. */

const LIVE_SCOPE_BY_CATEGORY: Record<string, LiveScopeKey> = {
  interplanetary: "interplanetary",
  healing: "healing",
  manifesting: "mirroros",
  quantum: "quantum",
  evolvemed: "evolvemed",
  invent: "forge",
  artx: "artx",
};

/* ------------------- the summon button (by the input) ---------------- */

export function CanopySummonButton({
  open,
  onToggle,
  disabled,
  testIdPrefix,
}: {
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  testIdPrefix: string;
}) {
  const t = useT();
  const label = open ? t("Hide the wall") : t("Summon the wall");
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={open}
      aria-label={label}
      title={label}
      data-testid={`${testIdPrefix}-summon`}
      className={cn(
        "focus-glow mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 sm:size-8",
        open
          ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] text-[var(--scope-a,var(--gd))] shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
          : "border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] bg-transparent text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      <ListTree className="size-4 sm:size-3.5" aria-hidden="true" />
    </button>
  );
}

/* ------------- the rest strip (the trunk's place, always) ----------- */

/**
 * The slim living bar that stands at the very top of the input bar
 * whenever the full tree is folded — the tree's resting floor.
 * One touch summons the whole family again.
 */
export function CanopyRestStrip({
  open,
  onSummon,
  disabled,
  testIdPrefix,
}: {
  /** True while the full tree stands — the strip then rests hidden. */
  open: boolean;
  onSummon: () => void;
  disabled?: boolean;
  testIdPrefix: string;
}) {
  const t = useT();
  if (open) return null;
  return (
    <div
      className="relative z-10 shrink-0 border-t bg-background/85 hairline"
      style={{ borderTopColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 26%, transparent)" }}
    >
      <button
        type="button"
        onClick={onSummon}
        disabled={disabled}
        aria-label={t("Summon the wall")}
        title={t("Summon the wall")}
        data-testid={`${testIdPrefix}-rest`}
        className="focus-glow group mx-auto flex h-10 w-full max-w-[720px] items-center justify-center gap-2 px-3 text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          aria-hidden="true"
          className="animate-line-breathe h-4 w-px shrink-0"
          style={{
            background:
              "linear-gradient(180deg, var(--scope-a,var(--gd)), transparent)",
          }}
        />
        <ListTree
          className="size-3.5 text-[var(--scope-a,var(--gd))] transition-transform duration-300 group-hover:-translate-y-px"
          aria-hidden="true"
        />
        <span className="mono-label text-[10px] uppercase tracking-[0.22em]">
          {t("The living tree")}
        </span>
        <ChevronUp
          className="size-3.5 transition-transform duration-300 group-hover:-translate-y-px"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/* ------------- the family canvas (the still heavy layer) ------------ */

/**
 * THE STILL CANVAS. Every chip, every connector, the trunk and its
 * flare — the whole drawn family lives in one memoized layer. While
 * the answer streams word by word, or the visitor types their own
 * reply inside the room, this layer does not re-render even once:
 * the walk stands perfectly still behind the answer, the compositor
 * never re-paints sixty chips for one more word, and the phone stays
 * cool. It re-renders only when the family itself truly changes —
 * a pick, a graft, a wave, a regrow.
 */
const TreeCanvas = memo(function TreeCanvas({
  tree,
  batchCount,
  revealed,
  chainSet,
  pickedId,
  flashId,
  narrow,
  disabled,
  onPick,
  onTool,
  tools = [],
  sentinelRef,
  rootSentinelRef,
  testIdPrefix,
}: {
  tree: LaidTree;
  batchCount: number;
  revealed: Record<number, 1 | 2 | 3>;
  chainSet: Set<string>;
  pickedId: string | null;
  flashId: string | null;
  narrow: boolean;
  disabled?: boolean;
  onPick: (node: GenealogyNode) => void;
  onTool: (kind: "akashic" | "book" | "invent", topic: string) => void;
  tools: {
    key: string;
    kind: "akashic" | "book" | "invent";
    node: GenealogyNode;
    side: 1 | -1;
  }[];
  sentinelRef: RefObject<HTMLDivElement | null>;
  rootSentinelRef: RefObject<HTMLDivElement | null>;
  testIdPrefix: string;
}) {
  const t = useT();
  const geo = tree.geometry;

  /* only the revealed nodes ever enter the DOM — the later waves are
     simply not there yet; each bloom is one CSS keyframe, run once */
  const nodes: GenealogyNode[] = useMemo(() => {
    const out: GenealogyNode[] = [];
    for (const n of tree.nodes) {
      if (n.golden) {
        out.push(n);
        continue;
      }
      const b = Number(n.id.slice(1, n.id.indexOf(".")));
      if (b < batchCount - 1 || n.wave < (revealed[b] ?? 1)) out.push(n);
    }
    return out;
  }, [tree, batchCount, revealed]);

  /* the connectors — one path per revealed child, drawn from its
     parent's foot to its own crown, kept OUT of the chips themselves
     (two pixels of air at each end — a line never touches a word).
     THE FAMILY'S ROPE: every rope wears its child's own family color. */
  const paths = useMemo(() => {
    const out: {
      d: string;
      golden: boolean;
      chain: boolean;
      accent: string;
      delay: number;
      key: string;
    }[] = [];
    nodes.forEach((n) => {
      if (!n.parent) return;
      const p = tree.byId.get(n.parent);
      if (!p) return;
      const x1 = p.x;
      const y1 = p.y + p.h + 2;
      const x2 = n.x;
      const y2 = n.y - 2;
      const mid1 = y1 + (y2 - y1) * 0.45;
      const mid2 = y2 - (y2 - y1) * 0.45;
      out.push({
        key: `p-${n.id}`,
        d: `M ${x1} ${y1} C ${x1} ${mid1}, ${x2} ${mid2}, ${x2} ${y2}`,
        golden: !!n.golden,
        chain: chainSet.has(n.id),
        accent: n.accent ?? "var(--scope-a, var(--gd))",
        /* the draw delay is the node's own (wave + id hash) — never the
           array's index: a re-laid tree never re-draws an old rope */
        delay: Math.min(n.wave * 130 + (hashWalk(n.id) % 12) * 26, 640),
      });
    });
    return out;
  }, [nodes, tree, chainSet]);

  /* the trunk's own arms — from the trunk's crown to the first row and
     the golden row (the root's children); a ROOT row hangs from the
     trunk's base instead — the arm descends, the undergrove begins */
  const trunkTop = geo.trunkBaseY - geo.trunkH;
  const trunkArms = useMemo(() => {
    const out: { d: string; key: string; chain: boolean }[] = [];
    for (const n of nodes) {
      if (n.parent) continue;
      const descends = n.y > trunkTop + geo.trunkH;
      out.push({
        key: `ta-${n.id}`,
        d: descends
          ? `M ${geo.width / 2} ${trunkTop + geo.trunkH - 4} C ${geo.width / 2} ${trunkTop + geo.trunkH + 30}, ${n.x} ${n.y - 34}, ${n.x} ${n.y}`
          : `M ${geo.width / 2} ${trunkTop + 8} C ${geo.width / 2} ${trunkTop + 26}, ${n.x} ${n.y - 34}, ${n.x} ${n.y}`,
        chain: chainSet.has(n.id),
      });
    }
    return out;
  }, [nodes, geo.width, geo.trunkH, trunkTop, chainSet]);

  /* THE LINE MASKS — an opaque plate under every chip, a little wider
     than the chip itself. Any connector that would pass behind a
     section is erased before it can ever show through the chip's
     rounded corners: a line belongs to the gaps between sections,
     never behind them. */
  const masks = useMemo(() => {
    const out: { key: string; x: number; y: number; w: number; h: number }[] = [];
    for (const n of nodes) {
      out.push({
        key: `m-${n.id}`,
        x: n.x - geo.chipW / 2 - 5,
        y: n.y - 5,
        w: geo.chipW + 10,
        h: n.h + 10,
      });
    }
    return out;
  }, [nodes, geo.chipW]);

  return (
    <div
      className="relative mx-auto"
      style={{
        width: geo.width,
        height: geo.height,
        minWidth: "100%",
      }}
    >
      {/* the sentinel — the frontier's ear, heard by the observer */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="absolute left-0 top-0 h-px w-full"
      />
      {/* the root's own ear — heard at the canvas's floor: the
          undergrove keeps descending when the visitor reaches down */}
      <div
        ref={rootSentinelRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-full"
      />

      {/* the trunk — one breathing line rising from the seed's floor;
          the undergrove descends beneath it (the trunk stands at its
          own base, never at the canvas's bottom edge) */}
      <div
        aria-hidden="true"
        className="animate-line-breathe absolute"
        style={{
          left: geo.width / 2 - 1,
          top: geo.trunkBaseY - geo.trunkH,
          width: 2,
          height: geo.trunkH,
          background:
            "linear-gradient(0deg, transparent, var(--scope-a,var(--gd)) 18%, var(--scope-b,var(--pk)) 100%)",
        }}
      />
      {/* the root flare — the tree drinks from the input bar */}
      <div
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          left: geo.width / 2 - 110,
          top: geo.trunkBaseY - 38,
          width: 220,
          height: 64,
          background:
            "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent), transparent 70%)",
        }}
      />

      {/* the connectors — every family tie, one static SVG; the opaque
          plates under every chip erase any line that would pass behind
          a section, and the walk's own chain burns brighter */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        width={geo.width}
        height={geo.height}
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        fill="none"
      >
        {masks.map((m) => (
          <rect
            key={m.key}
            x={m.x}
            y={m.y}
            width={m.w}
            height={m.h}
            rx={22}
            fill="var(--background)"
          />
        ))}
        {trunkArms.map((a) => (
          <path
            key={a.key}
            d={a.d}
            stroke={
              a.chain
                ? "color-mix(in srgb, var(--scope-a,var(--gd)) 70%, transparent)"
                : "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)"
            }
            strokeWidth={a.chain ? 2 : 1.6}
            strokeLinecap="round"
          />
        ))}
        {paths.map((p) => (
          <g
            key={p.key}
            className="genea-draw"
            style={{ animationDelay: `${p.delay + 180}ms`, "--chip-a": p.accent } as CSSProperties}
          >
            <path
              d={p.d}
              stroke={
                p.golden
                  ? "color-mix(in srgb, #f59e0b 30%, transparent)"
                  : p.chain
                    ? "color-mix(in srgb, var(--chip-a) 40%, transparent)"
                    : "color-mix(in srgb, var(--chip-a) 16%, transparent)"
              }
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <path
              d={p.d}
              stroke={
                p.golden
                  ? "color-mix(in srgb, #f59e0b 72%, transparent)"
                  : p.chain
                    ? "color-mix(in srgb, var(--chip-a) 88%, transparent)"
                    : "color-mix(in srgb, var(--chip-a) 62%, transparent)"
              }
              strokeWidth={p.chain ? 1.6 : 1.2}
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>

      {/* the whispers — the family's own chips: opaque by law, the
          WHOLE text inside each one's measured box, and a line can
          never cross a word */}
      {nodes.map((n) => {
        const deep = n.score >= 2.4 || !!n.creation;
        const attuned = !deep && n.score > 0;
        /* THE CREATION'S OWN SIGIL — a creation suggestion wears its
           own door's icon (the record, the book, the hammer); every
           other whisper wears its movement's mark. */
        const Icon = n.creation
          ? CREATION_ICON_BY_KIND[n.creation]
          : (MOVEMENT_ICONS[n.movement] ?? Layers);
        const isPicked = n.id === pickedId;
        const onChain = chainSet.has(n.id);
        const flashing = n.id === flashId;
        /* THE FAMILY'S LIGHT — the chip's own accent (its family's
           color); the words wear the house's one text color. */
        const chipAccent = n.accent ?? "var(--scope-a, var(--gd))";
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onPick(n)}
            disabled={disabled}
            title={
              n.creation
                ? t(CREATION_LABELS[n.creation])
                : t(BRANCH_TYPE_LABELS[n.movement])
            }
            data-testid={
              n.golden
                ? `${testIdPrefix}-crown-chip`
                : isPicked
                  ? `${testIdPrefix}-whisper-picked`
                  : `${testIdPrefix}-whisper`
            }
            className={cn(
              "genea-bloom tree-chip focus-glow absolute z-10 flex flex-col items-start gap-[3px] rounded-2xl border px-[13px] py-[9px] text-left shadow-[0_3px_14px_-8px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
              narrow ? "px-[11px] text-[13px] leading-[17px]" : "text-[14px] leading-[18px]",
              n.golden
                ? "border-[color-mix(in_srgb,#f59e0b_52%,transparent)] bg-[color-mix(in_srgb,#f59e0b_14%,var(--background)_86%)] font-serif italic text-foreground shadow-[0_0_16px_-6px_color-mix(in_srgb,#f59e0b_60%,transparent)]"
                : isPicked
                  ? "border-[color-mix(in_srgb,var(--chip-a)_85%,transparent)] bg-[color-mix(in_srgb,var(--chip-a)_18%,var(--background)_82%)] text-foreground shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--chip-a)_70%,transparent)]"
                  : onChain
                    ? "border-[color-mix(in_srgb,var(--chip-a)_66%,transparent)] bg-[color-mix(in_srgb,var(--chip-a)_12%,var(--background)_88%)] text-foreground"
                    : deep
                      ? "border-[color-mix(in_srgb,var(--chip-a)_62%,transparent)] bg-[color-mix(in_srgb,var(--chip-a)_13%,var(--background)_87%)] text-foreground shadow-[0_0_16px_-6px_color-mix(in_srgb,var(--chip-a)_55%,transparent)]"
                      : attuned
                        ? "border-[color-mix(in_srgb,var(--chip-a)_42%,transparent)] bg-[color-mix(in_srgb,var(--chip-a)_7%,var(--background)_93%)] text-foreground/90"
                        : "border-[color-mix(in_srgb,var(--chip-a)_28%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background)_97%)] text-foreground/85 hover:border-[color-mix(in_srgb,var(--chip-a)_58%,transparent)]",
              flashing && "genea-flash"
            )}
            style={
              {
                left: n.x,
                top: n.y,
                width: geo.chipW,
                height: n.h,
                transform: "translateX(-50%)",
                "--chip-a": chipAccent,
                /* THE STILL STANDING LAW — every chip's bloom delay is
                   its own (wave + id hash), never the array's index: a
                   re-laid tree never re-runs an old chip's entrance —
                   no flash, no flicker, the family simply grows */
                animationDelay: `${
                  n.golden
                    ? (hashWalk(n.id) % 12) * 40
                    : Math.min(n.wave * 130 + (hashWalk(n.id) % 12) * 26, 640)
                }ms`,
              } as CSSProperties
            }
          >
            {isPicked && (
              <span
                aria-hidden="true"
                className="animate-pulse absolute right-1.5 top-1.5 flex size-1.5 rounded-full bg-[var(--chip-a)]"
              />
            )}
            <Icon
              className={cn(
                "size-3.5 shrink-0",
                n.golden ? "text-[#f59e0b]" : "text-[var(--chip-a)] opacity-80"
              )}
              aria-hidden="true"
            />
            <span className="w-full whitespace-pre-wrap break-words">
              {n.text}
            </span>
          </button>
        );
      })}

      {/* THE TOOLS OF THE BRANCHES — the sigil-orbs hung on the tree:
          one for roughly every eighth whisper, tied to that whisper's
          own words, each opening its original theme page — the record,
          the book, the invention — made in the moment, unique to the
          walker's resonance. The branches answer with instruments. */}
      {tools.map((tool) => {
        const Icon = CREATION_ICON_BY_KIND[tool.kind];
        const acc = tool.node.accent ?? "var(--scope-a, var(--gd))";
        const cx = tool.node.x + tool.side * (geo.chipW / 2 + 20);
        const cy = tool.node.y + tool.node.h / 2;
        const stemLeft = tool.side === 1 ? tool.node.x + geo.chipW / 2 + 2 : cx + 7;
        return (
          <Fragment key={tool.key}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute z-0 h-px"
              style={{
                left: stemLeft,
                top: cy,
                width: 14,
                background: `color-mix(in srgb, ${acc} 38%, transparent)`,
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTool(tool.kind, tool.node.text);
              }}
              disabled={disabled}
              aria-label={t(TOOL_LABELS[tool.kind])}
              title={t(TOOL_LABELS[tool.kind])}
              data-testid={`${testIdPrefix}-tool-${tool.kind}`}
              className="genea-bloom focus-glow absolute z-20 flex size-7 items-center justify-center rounded-full border bg-[color-mix(in_srgb,var(--chip-a)_10%,var(--background)_90%)] text-[var(--chip-a)] shadow-[0_0_14px_-6px_color-mix(in_srgb,var(--chip-a)_65%,transparent)] transition-all duration-300 hover:scale-110 hover:border-[color-mix(in_srgb,var(--chip-a)_70%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
              style={
                {
                  left: cx,
                  top: cy - 14,
                  transform: "translateX(-50%)",
                  borderColor: `color-mix(in srgb, ${acc} 42%, transparent)`,
                  "--chip-a": acc,
                  animationDelay: `${Math.min(tool.node.wave * 130 + 240, 760)}ms`,
                } as CSSProperties
              }
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          </Fragment>
        );
      })}

      {/* THE CREATION GATES ARE NO LONGER HUNG BESIDE THE WHISPERS —
          they are whispers now: the record, the book and the invention
          stand in the family as individual suggestions (woven by the
          canopy above), each opening its own theme page. */}
    </div>
  );
});

/* --------- the room's own reply line (the one quiet input) ---------- */

/**
 * THE ROOM'S REPLY — the single input of the answer's room. It keeps
 * its own draft, so every keystroke re-renders one input and nothing
 * else: not the sixty-chip family, not the growing answer — the room
 * never stutters under the visitor's own words. The draft clears
 * itself when the walk turns to a new room.
 */
const ZoomReplyForm = memo(function ZoomReplyForm({
  roomKey,
  disabled,
  onSend,
  testIdPrefix,
  leading,
  scopeKey,
  bare = false,
}: {
  roomKey: string;
  disabled?: boolean;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  testIdPrefix: string;
  /** THE CATEGORY'S OWN CALL — the direct line rides inside the pill. */
  leading?: ReactNode;
  /** THE EXTRAS' OWN SCOPE — the call already rides as `leading`, so
      the extras only carry the paperclip and the camera's eye. */
  scopeKey: LiveScopeKey;
  /** THE LANDING'S PURE FLOOR — docked in the threshold the room's
      own line keeps the quiet shape: no attachments, a softly glowing
      frame, the mirror's own word. */
  bare?: boolean;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  /* THE CARRIED SIGHT — one image and up to three documents may ride
     with the room's own words, chips above the line */
  const [atts, setAtts] = useState<ChatAttachment[]>([]);
  const [seenKey, setSeenKey] = useState(roomKey);
  if (roomKey !== seenKey) {
    setSeenKey(roomKey);
    if (draft !== "") setDraft("");
    if (atts.length > 0) setAtts([]);
  }
  /* THE BRIDGE'S OWN CARRY — a workspace's compact assistant may hand
     its advice to the floor: the newest carried draft wears the reply
     line (the Mirror advises; the visitor's own hand sends it). The
     carry is taken during render by comparing against the carried
     stamp itself (the room's own adjustment law — no refs, no
     state-set inside an effect); the store draft is consumed once
     the floor has it, and the line answers with focus. */
  const bridgeDraft = useMirror((s) => s.bridgeDraft);
  const consumeBridgeDraft = useMirror((s) => s.consumeBridgeDraft);
  const [carriedAt, setCarriedAt] = useState(0);
  const replyRef = useRef<HTMLInputElement | null>(null);
  if (bridgeDraft && bridgeDraft.at !== carriedAt) {
    setDraft(bridgeDraft.text);
    setCarriedAt(bridgeDraft.at);
  }
  useEffect(() => {
    if (!carriedAt) return;
    consumeBridgeDraft();
    /* the floor's own line answers when the words arrive */
    const id = window.setTimeout(() => replyRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [carriedAt, consumeBridgeDraft]);
  const send = () => {
    const q = draft.trim();
    if (!q) return;
    /* only whole cargo travels: the image seen, the documents read */
    const carried = atts.filter((a) =>
      a.kind === "image" ? !!a.dataUrl : !a.reading && !!a.text
    );
    setDraft("");
    setAtts([]);
    onSend(q, carried);
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col items-stretch">
      <AttachmentChips
        attachments={atts}
        onRemove={(id) => setAtts((p) => p.filter((a) => a.id !== id))}
        testId={`${testIdPrefix}-zoom-attachments`}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full border py-1 pl-2 pr-1 transition-colors duration-300 focus-within:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]",
          bare && "floor-glow"
        )}
        style={{
          borderColor: bare
            ? undefined
            : "color-mix(in srgb, var(--hairline) 80%, transparent)",
        }}
      >
        {leading}
        <ChatInputExtras
          scope={scopeKey}
          size="2xs"
          withCall={false}
          withAttachments={!bare}
          disabled={disabled}
          accentVar="var(--scope-a,var(--gd))"
          attachments={atts}
          onAttachmentsChange={setAtts}
        />
        <label htmlFor={`${testIdPrefix}-zoom-reply`} className="sr-only">
          {bare ? t("Whisper to the mirror…") : t("Speak with the transmission…")}
        </label>
        <input
          id={`${testIdPrefix}-zoom-reply`}
          ref={replyRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            bare ? t("Whisper to the mirror…") : t("Speak with the transmission…")
          }
          disabled={disabled}
          autoComplete="off"
          data-testid={`${testIdPrefix}-zoom-reply`}
          className="min-w-0 flex-1 bg-transparent py-1 text-[14px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label={t("Send")}
          className="btn-primary focus-glow flex size-7 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Send className="size-3" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
});

/* the family's own shuffle — honest-random to the eye, deterministic
   to the engine: the same hour, salt and focus always weave the same
   small family (no hydration drift, no re-shuffle under the visitor) */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const rnd = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/* ------------- the visitor's own mark — the crown's icon -------------
   The profile icon stands at the crown's very beginning, BEFORE the
   light's toggle — an icon (never a pill), the same quiet circle as
   the toggle itself, in both of the chat's gears (desktop and mobile
   alike). One touch opens the visitor's own room within the frame. */

function CrownProfileIcon({ testIdPrefix }: { testIdPrefix: string }) {
  const t = useT();
  const openProfilePage = useMirror((s) => s.openProfilePage);
  return (
    <button
      type="button"
      onClick={openProfilePage}
      aria-haspopup="dialog"
      aria-label={t("Profile")}
      title={t("Profile")}
      data-testid={`${testIdPrefix}-profile-icon`}
      className="focus-glow flex size-7 items-center justify-center rounded-full border text-muted-foreground transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] hover:text-foreground"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
      }}
    >
      <UserRound className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/* ------------- the crown's own light — a quiet hand ------------------
   THE LIGHT RETURNS TO THE CROWN'S CORNER (the visitor named it): the
   sun/moon stands beside the About hand at the website's very top
   right — one touch from anywhere, on every device, in both gears
   (landing and realm). The profile room keeps its own deep tuning. */

function CrownLightHand({ testIdPrefix }: { testIdPrefix: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-anim");
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-anim"), 560);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle between deep space and daylight laboratory"
      title="Toggle theme"
      data-testid={`${testIdPrefix}-light-hand`}
      className="focus-glow group flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
    >
      {/* CSS-driven swap avoids hydration mismatch and effect state */}
      <Sun
        className="hidden size-3.5 transition-transform duration-500 group-hover:rotate-45 dark:block"
        aria-hidden="true"
      />
      <Moon
        className="size-3.5 transition-transform duration-500 group-hover:-rotate-12 dark:hidden"
        aria-hidden="true"
      />
    </button>
  );
}

/* THE WALK THAT ADVANCES — the visitor's own steps, kept on the
   device (never on a server): every exchange is one step. The family
   wall's tool orbs (the theme pages' suggestion wall) record them. */
const WALK_STEPS_KEY = "mirror-walk-steps";

function readWalkSteps(): number {
  try {
    const raw = window.localStorage.getItem(WALK_STEPS_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function stepWalkOnce(): number {
  const next = readWalkSteps() + 1;
  try {
    window.localStorage.setItem(WALK_STEPS_KEY, String(next));
  } catch {
    /* a closed vault holds no grudge — the walk simply stays */
  }
  return next;
}

/* --------------------------- the canopy ------------------------------ */

export function BranchCanopy({
  category,
  scopeHint,
  contextText,
  channeling,
  open,
  onPick,
  onClose,
  disabled,
  testIdPrefix,
  introSub,
  introSubExtra,
  introExtra,
  liveQuestion,
  liveAnswer,
  liveLoading,
  liveError,
  liveMessage,
  onLatch,
  realm,
  bare,
  onExpand,
  onMinimize,
  headerExtra,
  realmControls,
}: {
  /** The branch of the living tree this chat belongs to. */
  category: BranchId;
  /** The scope/window this chat stands in — the resonance's loudest voice. */
  scopeHint?: string | null;
  /** The thread's last breaths — received transmissions focus the family. */
  contextText?: string;
  /** The branches grown on the conversation's own replies — the golden row. */
  channeling?: LearnedBranch[] | null;
  open: boolean;
  onPick: (q: string, scope?: string, attachments?: ChatAttachment[]) => void;
  onClose: () => void;
  disabled?: boolean;
  testIdPrefix: string;
  /** The empty room's own words, spoken above the trunk. */
  introSub?: string | null;
  /** A second, quieter line beneath the intro. */
  introSubExtra?: string | null;
  introExtra?: ReactNode;
  /** The question of the transmission now forming (or just formed). */
  liveQuestion?: string | null;
  /** The answer as it arrives — grows word by word while streaming. */
  liveAnswer?: string | null;
  /** True while the transmission is being channeled. */
  liveLoading?: boolean;
  /** The channel's own error — the room speaks it instead of folding. */
  liveError?: string | null;
  /** THE CHANNEL'S LAST WORD — the full message the channel last
      appended, artifacts and all: the room reads it so a making (a
      painting, a woven book, a song, a record) rises INLINE in the
      conversation, exactly where the ask was spoken — the working
      room is gone, the chat is where everything is made now. */
  liveMessage?: ChatMessage | null;
  /** THE LATCH — true while the answer lives in the tree (the zoom);
      the chat keeps its rest strip resting while the walk holds. */
  onLatch?: (latched: boolean) => void;
  /** THE REALM — this tree IS the whole application: the categories
      stand at the very top, the house doors (akashic · book · about ·
      the passage) ride beside them, the seed sits at the centre, the
      tree never folds, and one whisper line speaks from the floor. */
  realm?: boolean;
  /** THE BARE FLOOR — the realm without its wall of suggestions:
      the miniature portal's quiet ground (the crown, the rooms and
      the whisper line stand exactly as ever; only the stones rest
      until the portal is given the whole screen). */
  bare?: boolean;
  /** THE CORNER'S GEAR HAND — while the portal is docked bare in the
      threshold, the corner hand grows the chat to the whole screen;
      at full size the same corner carries the way back to the
      landing slot. One corner, one hand, whichever way the portal
      faces — the old hide-the-chat arrow is gone for good. */
  onExpand?: () => void;
  /** THE FULLSCREEN GEAR'S OWN HAND — folds the portal back into its
      landing slot (worn by the same corner while the chat fills the
      screen). */
  onMinimize?: () => void;
  /** Extra quiet controls riding the realm's crown (the purse, the
      theme) — rendered between the where-pill and the doors. */
  headerExtra?: ReactNode;
  /** THE PORTAL'S OWN HANDS — the fullscreen and landing controls of
      the one portal, standing in the crown exactly between the about
      door and the visitor's passage, whichever way the portal faces. */
  realmControls?: ReactNode;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);
  /* THE HOUSE DOORS — the old app, folded into the realm's crown:
     the akashic library, the book, the open door of the house, and
     the visitor's own passage (their account; the way in and the
     way out both live inside it). */
  const openAkashic = useMirror((s) => s.openAkashic);
  const openDreamBook = useMirror((s) => s.openDreamBook);
  const openVideo = useMirror((s) => s.openVideo);
  /* THE LEDGER'S OWN HANDS — one opens a saved conversation right
     where it lives, the other restores a kept volume to the reading */
  const openChatSurface = useMirror((s) => s.openChat);
  const resumeKeptVolume = useMirror((s) => s.resumeDreamBook);
  /* THE TRAIL'S OWN HAND — one touch returns the visit to a room its
     maker already opened (the history panel's trail rows speak it) */
  const openToolTab = useMirror((s) => s.openToolTab);
  /* THE QUESTION'S QUIET — the floor's welcome now lives with the
     landing thread itself (the landing's own quiet, declared beside
     the thread): the store's channel no longer decides whether the
     threshold's question and its five doors stand. */
  /* THE GUEST'S OWN LAW — the landing chat is temporary for the non
     logged-in: a small honest line under the whisper line speaks it. */
  const meIdentity = useMirror((s) => s.me);
  const meIdentityReady = useMirror((s) => s.meStatus === "ready");
  const guest = meIdentityReady
    ? !meIdentity || meIdentity.email.startsWith("anon:")
    : false; // the quiet check never guesses a guest
  /* THE WHOLE HOUSE'S DOORS — every kategory of the old website's
     sidebar, standing within the branches themselves: the worlds the
     tree grows toward, the archives, and the quiet hands. */
  const openInvent = useMirror((s) => s.openInvent);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const openParticleX = useMirror((s) => s.openParticleX);
  const openEvolveMed = useMirror((s) => s.openEvolveMed);
  const openArtX = useMirror((s) => s.openArtX);
  const resetField = useMirror((s) => s.resetField);
  /* THE CREATION DOOR — the branch's own words ride with the touch:
     the theme page that opens forges its making from them. */
  const setBranchCreationSeed = useMirror((s) => s.setBranchCreationSeed);

  /* THE RESONANCE WALK — v4.1, the quiet walk: the room's one voice is
     the male narrator (lib/room-narrator.ts). The gate lives up front;
     the wiring effects live further below, where the walk's context is
     ready. The book, the sigil and the frequency tones are retired —
     the room no longer renders them, and the cache has nothing to
     pre-fetch: the walk stays light. */
  const [narratorOpen, setNarratorOpen] = useState(() => narrationGateOpen());
  const narration = useNarration();

  /* THE FADE LAW — mount → visible on open; fade → unmount on close.
     THE LATCH LAW: while the answer lives in the tree (the zoom), the
     canopy holds its place even when the parent's open relaxes — the
     visitor follows the branch from the end of the transmission; the
     moment they step back to the walk, the parent's law applies again.
     Pure CSS transitions; render-time guarded resets only. */
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [seenOpen, setSeenOpen] = useState(open);

  /* ------------------- THE ZOOM — the answer's room ------------------
     `restored` carries the transmission of a PREVIOUS branch — the
     trail's chips re-open their own rooms from the walk's memory.
     The zoom room serves the landing chat and every theme page. */
  const [zoom, setZoom] = useState<{
    q: string;
    move: BranchType | null;
    restored?: string;
  } | null>(null);
  const zoomed = zoom !== null;
  const active = open || zoomed;

  if (active !== seenOpen) {
    setSeenOpen(active);
    if (active) {
      setMounted(true);
      setShown(false);
    } else {
      setShown(false);
      /* THE FOLD CLOSES THE GATE — the narrator rests with the walk */
      if (narratorOpen) setNarratorOpen(false);
    }
  }

  useEffect(() => {
    if (!active) {
      /* the fold silences the narrator (external system — the audio) */
      closeNarrationGate();
      const id = window.setTimeout(() => {
        setMounted(false);
        /* the room closes with the walk — the answer returns to the chat */
        setZoom(null);
      }, 700);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setShown(true), 30);
    return () => window.clearTimeout(id);
  }, [active]);

  /* THE ZOOM EAR — whenever a transmission begins while the walk
     stands (a pressed whisper, the composer, a continuation), the
     camera pulls back and the answer rises inside the tree.
     (Render-time guarded — the official pattern: the engine never
     renders synchronously inside an effect. THE OPEN DOOR LAW holds:
     a pressed whisper always opens its room, and the room stands —
     an ask that returns nothing speaks its error inside the room.) */
  const [seenLiveKey, setSeenLiveKey] = useState<string | null>(null);
  const zoomOpenedAtRef = useRef(0);
  const liveKey =
    mounted && liveLoading && liveQuestion ? liveQuestion : null;
  if (liveKey && liveKey !== seenLiveKey) {
    setSeenLiveKey(liveKey);
    zoomOpenedAtRef.current = Date.now();
    /* THE MAKING LAW — a question the laboratory will answer with a
       MAKING (a painting crystallizing) never opens a room that would
       wait forever: the making rises in its own room above the tree
       when it stands, and one quiet word speaks the wait. */
    if (isVisualIntent(liveKey)) {
      /* THE MAKING'S OWN ROOM — a visual ask opens the same conversation
         room as every ask: the forming vision rises inline inside it
         (the forming card is the room's own answer) — no toast, no
         separate room, no waiting outside the walk. */
      if (zoom?.q !== liveKey) setZoom({ q: liveKey, move: null });
    } else if (zoom?.q !== liveKey) setZoom({ q: liveKey, move: null });
  } else if (!liveLoading && seenLiveKey !== null) {
    /* the next transmission zooms again — even the very same words */
    setSeenLiveKey(null);
  }

  const exitZoom = useCallback(() => setZoom(null), []);
  /* the standing room's own key — the thread's words land where the
     walk stands, even when a reply crosses while the walk turns */
  const zoomQRef = useRef<string | null>(null);
  zoomQRef.current = zoom?.q ?? null;

  /* THE LATCH, spoken to the chat — the rest strip rests while the
     answer lives in the tree (an external-system sync, never a
     render-loop). */
  useEffect(() => {
    onLatch?.(zoomed);
  }, [zoomed, onLatch]);

  /* THE HOURLY LAW — the grove is captured at summon; a rolled hour
     regrows the whole family by itself. Reload every hour, as asked.
     THE QUIET PAGE — a hidden tab does not roll: the check sleeps
     while the visitor is elsewhere and wakes on their return. */
  const [hour, setHour] = useState(() => canopyHour());
  const [salt, setSalt] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    const roll = () => {
      if (document.hidden) return;
      const now = canopyHour();
      setHour((h) => (h === now ? h : now));
    };
    roll();
    const id = window.setInterval(roll, 60_000);
    const wake = () => {
      if (!document.hidden) roll();
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [mounted]);

  /* THE HYDRATION LAW — the learning memory joins after first paint,
     then freezes for the tree's lifetime: a standing family must never
     re-rank itself under the visitor's feet. */
  const [seenSnapshot, setSeenSnapshot] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!mounted || seenSnapshot) return;
    const id = window.setTimeout(
      () => setSeenSnapshot(new Set(loadSeen().map((s) => s.toLowerCase()))),
      0
    );
    return () => window.clearTimeout(id);
  }, [mounted, seenSnapshot]);

  /* THE WALKER'S OWN DEPTH — the profile's DNA evolution score (the
     Expansion Index) joins after first paint too: the questions' voice
     — their length and which movements lead — is tuned to the walker
     the mirror already knows. */
  const [expansionScore, setExpansionScore] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => setExpansionScore(readExpansionScore()), 0);
    return () => window.clearTimeout(id);
  }, [mounted]);
  /* THE VISITOR'S OWN LEVEL — the level chosen in the profile's settings
     (Depth & exploration) walks ahead of the earned score: the deeper of
     the two tunes the wall's voice, so a chosen depth is met at once —
     the level 0–4 lifts the questions' voice the same way the Expansion
     Index earns it (one level ≈ twenty points of walked depth). */
  const expLevel = useMirror((s) => s.expLevel);
  const expansionLevelScore = Math.max(
    expansionScore,
    expLevel >= 0 ? expLevel * 20 : 0
  );

  /* THE COMPASS — the mix of the house. The tree's default branch is
     GENERAL: every family woven together. The mix now lives in the
     store — the tree, the Laboratory's settings and the profile's own
     settings room all speak the same proportions; the visitor's saved
     mix joins when the store boots, then stands until they reshape it. */
  const mix = useMirror((s) => s.treeMix);
  const applyMix = useMirror((s) => s.setTreeMix);
  /* the crown's two quiet dropdowns — the kategories of the walk and
     the worlds of the house */
  const [crownMenu, setCrownMenu] = useState<"cats" | "menu" | null>(null);
  /* THE WALK'S LEDGER — the history saver the panel carries: the kept
     volumes of the shelf, the saved conversations of every surface,
     and the journey's own kept steps. Loaded fresh each time the
     panel opens — the ledger always reads the present keep. */
  const [walkLedger, setWalkLedger] = useState<{
    volumes: ShelfVolume[];
    chats: {
      surface: ChatSurface;
      label: string;
      id: string;
      title: string;
      count: number;
    }[];
    journey: JourneyStep[];
  } | null>(null);
  useEffect(() => {
    if (crownMenu !== "menu") return;
    const labels = KEPT_SURFACE_LABELS;
    const surfaces = Object.keys(labels) as ChatSurface[];
    const chats = surfaces.flatMap((s) =>
      listChats(s)
        .slice(0, 2)
        .map((c) => ({
          surface: s,
          label: labels[s],
          id: c.id,
          title: c.title,
          count: c.messages.length,
        }))
    );
    setWalkLedger({
      volumes: loadShelf(),
      chats,
      journey: loadJourney(),
    });
  }, [crownMenu]);

  /* THE FOCUSED FAMILY — when the walk stands on ONE category, the
     whole house wears that category's own light: the chat's frame, the
     composer, the doors and the seed glow all take its color. */
  const focusFamily =
    mix.on.length === 1
      ? TREE_FAMILIES.find((f) => f.key === mix.on[0]) ?? null
      : null;
  /* THE REGENERATION'S REST — after a category's own tree is lifted
     back from the timeline, the regrow rests: the restored tree never
     re-ranks under the visitor. The renewing hand (inside the chat),
     the visitor's own pick or ask wake it again. */
  const suppressRegrowRef = useRef(false);
  /* THE RENEWING HAND — the reload lives INSIDE the chat now: the
     floor's whisper line and every room carry it. One touch and the
     family is re-grown fresh. */
  const renew = useCallback(() => {
    suppressRegrowRef.current = false;
    setSalt((s) => s + 1);
  }, []);

  /* one touch folds a family out of the grove, or weaves it back in —
     the walk never walks empty (the last family always stays) */
  const toggleFamily = useCallback(
    (key: string) => {
      const wasOn = mix.on.includes(key);
      const on = wasOn ? mix.on.filter((k) => k !== key) : [...mix.on, key];
      if (on.length === 0) return;
      const weights = { ...mix.weights };
      if (wasOn) weights[key] = 0;
      else if ((weights[key] ?? 0) <= 0) weights[key] = 1;
      if (!on.some((k) => (weights[k] ?? 0) > 0)) weights[key] = 1;
      applyMix({ on, weights });
    },
    [mix, applyMix]
  );

  /* THE MIX — the slider's word is law. The rescaling itself lives in
     lib/tree-mix.ts: the settings rooms (the Laboratory's and the
     profile's own) speak the same law for the whole house. */

  /* THE RESONANCE EAR — the scope leads threefold, the grown branches
     twofold, the context that follows carries the middle; rarity,
     harmony, phase and one shimmer of the hour tune the rest.
     THE ROWS' REST — the flat floor speaks its rows straight from the
     grove: the resonance field and the ranking belong to the tree, so
     the realm never pays their cost (the walk stays liquid). */
  const [contextSnapshot, setContextSnapshot] = useState(contextText ?? "");
  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => setContextSnapshot(contextText ?? ""), 1400);
    return () => window.clearTimeout(id);
  }, [contextText, mounted]);

  const grove = useMemo(
    () =>
      growMixedCanopy(mix.on, mix.weights, scopeHint ?? null, hour, salt),
    [mix, scopeHint, hour, salt]
  );
  /* THE PLAIN TONGUE — the walk of a visitor who has not signed in
     speaks easy, literal doors: same layout, same families, plainly
     worded. The signed keeper keeps the full grove's own voice. */
  const anonWalk = useMirror((s) =>
    s.meStatus === "ready" ? !s.me : false
  ); // the quiet check never guesses a stranger's voice
  const shownGrove = useMemo(
    () => (anonWalk ? swapGroveToEasy(grove, hour) : grove),
    [grove, anonWalk, hour]
  );

  /* THE FAMILY'S LIGHT — every whisper knows its own family, so every
     seed carries that family's accent to the tree (rope + section;
     the words stay the house's one text color). THE FAMILY'S VOICE —
     the same map resolves which house door the room's own chat
     speaks through: a manifest whisper's room answers as the
     manifest answers, an Art X room as the atelier. */
  const familyByUk = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const w of shownGrove)
      m.set(w.text.toLowerCase(), familyAccent(w.family) ?? undefined);
    return m;
  }, [shownGrove]);
  const familyKeyByText = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of shownGrove) m.set(w.text.toLowerCase(), w.family ?? "");
    return m;
  }, [shownGrove]);
  const accentOfText = useCallback(
    (text: string): string | undefined => familyByUk.get(text.toLowerCase()),
    [familyByUk]
  );
  const withAccents = useCallback(
    (seeds: { text: string; movement: BranchType; score: number }[]) =>
      seeds.map((s) => ({ ...s, accent: accentOfText(s.text) })),
    [accentOfText]
  );

  /* THE WALK'S FOCUS — the single family the compass has chosen, or
     the whole grove ("general"). The ask's own door reads it. */
  const focusKey = mix.on.length === 1 ? mix.on[0] : "general";
  /* THE ASK'S OWN DOOR — a pressed whisper speaks through its own
     family's voice (the quantum chip asks the narrator, the forge chip
     the forge); the visitor's typed words speak through the focused
     category's voice; the general floor keeps the standing channel.
     THE SIDEBAR'S TONE RETURNS: every category answers with the same
     tone and reasoning its own house always spoke. */
  const askScopeFor = useCallback(
    (text: string): string | undefined => {
      const famKey = familyKeyByText.get(text.toLowerCase());
      const fam = TREE_FAMILIES.find((f) => f.key === famKey);
      if (fam) return fam.category;
      if (focusKey !== "general") {
        return TREE_FAMILIES.find((f) => f.key === focusKey)?.category;
      }
      return undefined;
    },
    [familyKeyByText, focusKey]
  );

  /* THE WALK'S OWN STEP — every exchange (a door pressed, a making
     begun) is one step, kept on the device; the navigator's own
     progressive depth reads the DNA's journey instead. */
  const bumpWalkSteps = useCallback(() => {
    stepWalkOnce();
  }, []);

  const budsKey = channeling?.map((b) => b.question).join("\u0001") ?? "";
  const field = useMemo<ReturnType<typeof buildResonanceField> | null>(
    () =>
      realm
        ? null
        : buildResonanceField({
            scope: scopeHint ?? null,
            context: contextSnapshot || null,
            buds: budsKey ? budsKey.split("\u0001") : null,
            hour,
          }),
    [realm, scopeHint, contextSnapshot, budsKey, hour]
  );
  /* THE GRAFT LAW — the idf belongs to every walk (the realm's own
     grafted houses are tuned by it too): one memoized pass over the
     grove, never a per-frame cost. */
  const idf = useMemo(() => buildIdf(shownGrove.map((w) => w.text)), [shownGrove]);

  const ranked = useMemo(() => {
    /* THE REALM'S WALL — the grove shuffled by the hour, the salt and
       the focus; no resonance field, no ranking passes: the realm's
       floor is a wall of stone, and it costs almost nothing. */
    if (realm) {
      if (grove.length === 0) return [];
      return seededShuffle(
        grove,
        hashWalk(`realm:${hour}:${salt}:${focusKey}`)
      )
        .slice(0, 200)
        .map((w) => ({ ...w, score: 0 }));
    }
    if (grove.length === 0 || !field || !idf) return [];
    const hits = rankWhispers(grove, field, {
      idf,
      seen: seenSnapshot,
      limit: grove.length,
      perSubject: 2,
    });
    /* the dedupe law — one whisper never stands twice in the family
       (a set, never a scan: the grove is five hundred voices) */
    const seenTexts = new Set<string>();
    const unique: (typeof shownGrove[number] & { score: number })[] = [];
    for (const w of hits.length === 0
      ? shownGrove.map((w) => ({ ...w, score: 0 }))
      : [
          ...hits,
          ...grove
            .filter((w) => !hits.some((h) => h.text === w.text))
            .map((w) => ({ ...w, score: 0 })),
        ]) {
      const k = w.text.toLowerCase();
      if (!seenTexts.has(k)) {
        seenTexts.add(k);
        unique.push(w);
      }
    }
    return unique;
  }, [realm, grove, field, idf, seenSnapshot, hour, salt, focusKey]);

  /* THE GOLDEN ROW — the exchange's own grown branches stand nearest
     the trunk; deduped by content, memoized on the buds' own words so
     a streaming answer never re-lays the family under the visitor. */
  const goldenSeeds: GenealogySeed[] = useMemo(() => {
    const out: GenealogySeed[] = [];
    const gSeen = new Set<string>();
    for (const b of channeling ?? []) {
      const k = b.question.toLowerCase();
      if (gSeen.has(k)) continue;
      gSeen.add(k);
      out.push({ text: b.question, movement: b.type, score: 3 });
      if (out.length >= 6) break;
    }
    return out;
  }, [channeling]);

  /* THE HARMONIC CONTINUATION — when a transmission's own branches
     arrive, the mirror records it: the context has proceeded. The
     record survives reloads (one reading per grown generation). */
  const prevBudsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mounted) return;
    try {
      prevBudsRef.current = window.sessionStorage.getItem(
        "mirror-last-buds-" + category
      );
    } catch {
      prevBudsRef.current = null;
    }
    if (budsKey && budsKey !== prevBudsRef.current) {
      recordExpansion("transmission", { scope: scopeHint ?? null });
      try {
        window.sessionStorage.setItem(
          "mirror-last-buds-" + category,
          budsKey
        );
      } catch {
        /* quiet */
      }
    }
  }, [budsKey, mounted, scopeHint, category]);

  /* ------------------ the family (batches of thirty) ---------------- */

  const [topologies, setTopologies] = useState<GenealogyTopology[]>([]);
  const narrowRef = useRef(false);
  const [narrow, setNarrow] = useState(false);
  /* the anchored view's memory — one layout pass per change */
  const prevSize = useRef({ w: 0, h: 0 });
  /* every whisper ever laid — a spent voice never stands twice, even
     after a fold returns its row to the pool */
  const [spent, setSpent] = useState<Set<string>>(() => new Set());

  const markSpent = useCallback((seeds: GenealogySeed[]) => {
    if (seeds.length === 0) return;
    setSpent((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const s of seeds) {
        const k = s.text.toLowerCase();
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  /* ---------------- THE GRAFT state — the walk's own memory --------
     the pressed whisper ("you are here"), the trail of the walk, the
     one quiet pan request, the fold level of the last choice */
  const [maxLevel, setMaxLevel] = useState<number | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [lineage, setLineage] = useState<{ id: string | null; text: string }[]>(
    []
  );
  const [flashId, setFlashId] = useState<string | null>(null);
  /* the pan request rides a ref — consumed by the anchored view's own
     layout pass; no state churn, no extra effect, no loop */
  const panReqRef = useRef<string | null>(null);

  const commitTopologies = useCallback(
    (fn: (t: GenealogyTopology[]) => GenealogyTopology[]) => {
      setTopologies((prev) => fn(prev));
    },
    []
  );

  /* THE REGROW LAW — the family rebuilds whenever its ranking is
     re-earned (new context, new hour, new salt), never mid-session
     without cause. The tree keeps standing across open and close.
     THE ROOM'S STILLNESS: while the answer lives in the tree (the
     zoom), the family never re-ranks under the visitor's reading —
     a pending regrow simply waits for the room to hand back.
     THE VOICE: every seed is tuned by the walker's own depth —
     shortened to one breath, near-twins stepped aside. */
  /* THE CREATION WHISPERS — one door woven into every family as an
     INDIVIDUAL SUGGESTION: the record, the book, the invention, each
     wearing its own sigil and tied to a whisper of its own batch —
     the branch's own words the creation grows from. Random to the eye
     (the hour, the salt and the batch choose together), always
     connected to the branch and its kategory. PURE: the same hour,
     salt and batch always weave the same door, so a recomputed family
     never loses or doubles its door. */
  const weaveCreations = useCallback(
    (seeds: GenealogySeed[], batchIndex: number): GenealogySeed[] => {
      if (seeds.length < 6) return seeds;
      const h = hashWalk(`${hour}:${salt}:${batchIndex}`);
      const door = CREATION_DOORS[(h + batchIndex) % CREATION_DOORS.length];
      const topicSeed = seeds[h % seeds.length];
      const topic = topicSeed.text;
      const out = [...seeds];
      /* the door stands mid-family — never the batch's first breath */
      const at = Math.min(2 + (h % Math.max(1, out.length - 2)), out.length);
      out.splice(at, 0, {
        text: `${t(CREATION_LABELS[door.kind])} — ${topic}`,
        movement: "create",
        score: 1,
        accent: topicSeed.accent,
        creation: door.kind,
        topic,
      });
      return out;
    },
    [hour, salt, t]
  );

  const lastRankedRef = useRef<unknown>(null);
  useEffect(() => {
    /* THE REALM'S REST — the river never lays a tree: the topologies,
       the folds and the graft walk belong to the theme pages alone. */
    if (!mounted || realm || ranked.length === 0) return;
    if (zoomed) return;
    if (lastRankedRef.current === ranked) return;
    lastRankedRef.current = ranked;
    /* the engine never renders synchronously inside an effect */
    const id = window.setTimeout(() => {
      /* THE TIMELINE'S REST — a tree lifted back from a category's own
         shelf stands untouched until the visitor's own hand moves. */
      if (suppressRegrowRef.current) return;
      const tuned = tuneSeedBatch(
        ranked
          .slice(0, BATCH_SIZE * 2)
          .map((w) => ({ text: w.text, movement: w.movement, score: w.score })),
        expansionLevelScore,
        BATCH_SIZE
      );
      const seeds = weaveCreations(withAccents(tuned), 0);
      markSpent(seeds);
      setTopologies(
        seeds.length > 0
          ? [buildSeedTopology(seeds, [], narrowRef.current)]
          : []
      );
      /* a regrown tree forgets the graft — the walk's trail remains */
      setMaxLevel(null);
      setPickedId(null);
      panReqRef.current = null;
      setLineage((ln) => ln.map((l) => ({ text: l.text, id: null })));
      prevSize.current = { w: 0, h: 0 }; /* the view returns to the trunk */
    }, 0);
    return () => window.clearTimeout(id);
  }, [realm, ranked, mounted, markSpent, zoomed, expansionScore, withAccents, weaveCreations]);

  /* THE GEOMETRY — narrow windows carry a slimmer, taller family. */
  const vpRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = vpRef.current;
    if (!el || !mounted) return;
    const ro = new ResizeObserver(() => {
      const isNarrow = el.clientWidth < 760;
      narrowRef.current = isNarrow;
      setNarrow(isNarrow);
    });
    ro.observe(el);
    const isNarrow = el.clientWidth < 760;
    narrowRef.current = isNarrow;
    setNarrow(isNarrow);
    return () => ro.disconnect();
  }, [mounted]);

  /* THE LAID TREE — every batch laid together in one coordinate space;
     the fold (maxLevel) prunes every generation above the last choice. */
  const tree = useMemo(
    () => layTree(topologies, goldenSeeds, narrow, maxLevel),
    [topologies, goldenSeeds, narrow, maxLevel]
  );

  /* THE TOOLS OF THE BRANCHES — roughly one whisper in thirteen carries
     a sigil-orb at its side (the record, the book, the invention).
     The tie is honest-random: node id + hour + salt choose together,
     so the same hour always hangs the same tools, and the kinds
     distribute evenly across the whole grove. */
  const tools = useMemo(() => {
    const out: {
      key: string;
      kind: "akashic" | "book" | "invent";
      node: GenealogyNode;
      side: 1 | -1;
    }[] = [];
    let kindCursor = 0;
    for (const n of tree.nodes) {
      if (n.golden || n.creation) continue;
      const h = hashWalk(`${n.id}|${hour}:${salt}`);
      if (h % 100 >= TOOL_SHARE) continue;
      const kind = CREATION_DOORS[kindCursor++ % CREATION_DOORS.length].kind;
      out.push({
        key: `tool-${n.id}`,
        kind,
        node: n,
        side: h % 2 === 0 ? 1 : -1,
      });
    }
    return out;
  }, [tree, hour, salt]);

  /* THE TOOL'S OWN HAND — one touch hangs the tied whisper's words on
     the tool and opens its original theme page: the record seeks, the
     book's loom pre-speaks, the forge strikes, the song finds its key,
     the film's storyboard is woven from the branch's own words — each
     making born of that branch, in the moment, never the same making
     twice. */
  const openTool = useCallback(
    (kind: "akashic" | "book" | "invent" | "music" | "video", topic: string) => {
      if (disabled) return;
      recordJourney({ b: category, s: scopeHint ?? undefined });
      bumpWalkSteps();
      setBranchCreationSeed({ kind, topic });
      /* REMEMBER MY PLACE — a making opened is a meaningful place;
         one hand brings the workspace back (protocol 1/2) */
      useWorkspaceMemory.getState().recordLast({
        kind: "creation",
        title: topic || kind,
        creation: kind,
        view:
          kind === "book"
            ? "dreambook"
            : kind === "akashic"
              ? "akashic"
              : kind === "music"
                ? "lightcodes"
                : kind === "video"
                  ? "video"
                  : "invent",
      });
      if (kind === "akashic") openAkashic();
      else if (kind === "book") openDreamBook();
      else if (kind === "music") openLightCodes({ intention: topic });
      else if (kind === "video") openVideo({ topic });
      else openInvent();
    },
    [
      disabled,
      category,
      scopeHint,
      recordJourney,
      setBranchCreationSeed,
      openAkashic,
      openDreamBook,
      openLightCodes,
      openVideo,
      openInvent,
      bumpWalkSteps,
    ]
  );

  /* THE READY THIRTY — the next family, grown before it is asked for.
     Sliced from the ranked grove beyond every voice already spent; the
     visitor never waits. THE PLANNER — the family alternates its
     direction so the walk fills EVERY direction: upward, then a root
     descending left of the seed, a root descending right, the first
     wings beside the crown — and the cycle repeats, the tree rising,
     spreading and digging deeper forever. THE MID-TREE LAW: from the
     fifth family on, each wing sprouts from a branch MID-TREE (a donor
     of the already-standing canopy): the wings breathe left and right
     at every height. THE ENDLESS LAW: the grove spent itself, the
     family re-weaves from the whole grove, rotated — never a wall. */
  const prepared = useMemo(() => {
    if (realm || topologies.length === 0 || topologies.length >= MAX_BATCHES) return null;
    let slice = ranked.filter((w) => !spent.has(w.text.toLowerCase()));
    if (slice.length === 0) {
      const off = (topologies.length * 7) % Math.max(1, ranked.length);
      slice = ranked.map((_, i) => ranked[(i + off) % ranked.length]);
    }
    if (slice.length === 0) return null;
    const tuned = tuneSeedBatch(
      slice
        .slice(0, BATCH_SIZE * 2)
        .map((w) => ({ text: w.text, movement: w.movement, score: w.score })),
      expansionLevelScore,
      BATCH_SIZE
    );
    if (tuned.length === 0) return null;
    /* one creation door rides with every ready family as well */
    const tunedSeeds = weaveCreations(withAccents(tuned), topologies.length);
    /* THE FAMILY PLANNER — 1 up · 2 root-left · 3 root-right ·
       4 wing-left · 0 wing-right, cycling forever */
    const step = topologies.length % 5;
    if (step === 2 || step === 3) {
      const side = step === 2 ? "left" : "right";
      const tips = tree.rootFrontier[side].map((t) => ({ id: t.id }));
      return buildRootTopology(tunedSeeds, tips, narrow, side);
    }
    const wing =
      step === 4 ? ("left" as const) : step === 0 ? ("right" as const) : undefined;
    /* THE SIDEWARD LAW — from the fifth family on, each new house
       sprouts from a branch MID-TREE (a donor of the already-standing
       canopy): the wings breathe left and right at every height, and
       the walk spreads in all directions instead of piling skyward. */
    let tips: { id: string }[] = tree.frontier;
    if (wing && topologies.length >= 4) {
      const donorIdx = Math.max(0, Math.floor(topologies.length / 2) - 1);
      const donor = topologies[donorIdx];
      const rIdx = donor.rows.length - 1;
      const width = narrow ? 3 : 5;
      tips = donor.rows[rIdx].seeds
        .slice(0, width)
        .map((_, i) => ({ id: `n${donorIdx}.${rIdx}.${i}` }));
    }
    return tips.length > 0
      ? buildExtensionTopology(tunedSeeds, tips, narrow, wing)
      : buildSeedTopology(tunedSeeds, [], narrow);
  }, [ranked, topologies, tree, narrow, spent, expansionScore, withAccents, weaveCreations]);

  /* THE GROW — one breath, from the ready pool. A ready family may
     only hang from tips that still stand: a folded frontier can never
     parent it (the functional law also deduplicates). */
  const grow = useCallback(() => {
    const next = prepared;
    if (!next) return;
    markSpent(next.rows.flatMap((r) => r.seeds));
    commitTopologies((t) => {
      if (t.length >= MAX_BATCHES || t[t.length - 1] === next) return t;
      const ids = new Set<string>();
      t.forEach((topo, b) =>
        topo.rows.forEach((row, r) =>
          row.seeds.forEach((_, i) => ids.add(`n${b}.${r}.${i}`))
        )
      );
      if (next.fromTips.some((id) => id !== "root" && !ids.has(id))) return t;
      return [...t, next];
    });
  }, [prepared, commitTopologies, markSpent]);

  /* THE FRONTIER EAR — slide to the top of the family and the ready
     thirty reveal themselves; the walk never hits a wall.
     THE REALM'S REST — the realm's family is small by law: the ear
     sleeps there, the branches grow only under the visitor's hand. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const vp = vpRef.current;
    const st = sentinelRef.current;
    if (!vp || !st || !mounted || realm) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) grow();
      },
      { root: vp, rootMargin: "180px 0px 0px 0px", threshold: 0 }
    );
    io.observe(st);
    return () => io.disconnect();
  }, [mounted, grow, realm]);

  /* THE ROOT'S OWN EAR — reach down to the undergrove's floor and the
     next root family descends; the ground is as endless as the sky. */
  const rootSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const vp = vpRef.current;
    const st = rootSentinelRef.current;
    if (!vp || !st || !mounted || realm) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) grow();
      },
      { root: vp, rootMargin: "0px 0px 180px 0px", threshold: 0 }
    );
    io.observe(st);
    return () => io.disconnect();
  }, [mounted, grow, realm]);

  /* THE QUIET FILLING — the house needs no empty corner: on its own
     breaths the first families bloom in every direction (upward, then
     a root left of the seed, a root right of it, then the first
     wings), so the tree stands full before the visitor ever asks.
     The grower rides a ref — the cascade never restarts when a new
     family makes `grow` itself anew. */
  const growRef = useRef(grow);
  useEffect(() => {
    growRef.current = grow;
  }, [grow]);
  useEffect(() => {
    if (!mounted || realm) return;
    /* THE WEAK DEVICE'S CAP — on the eco tier only the first auto beat
       blooms; the rest of the cascade rests, and the ear at the edge
       still grows under the visitor's own scroll. */
    const beats = perfEco()
      ? [650]
      : [650, 1500, 2350, 3200, 4050, 4900, 5750];
    const ids = beats.map((ms) =>
      window.setTimeout(() => growRef.current(), ms)
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [mounted, realm]);

  /* THE HARMONIC WAVES — twelve voices at once, twelve after a few
     seconds, the last six after another; every family arrives in
     rhythm with the context. THE FLICKER LAW — only the NEWEST family
     waits for its waves; every older family keeps its full reveal, so
     a growing tree never flashes a chip away and back while the
     visitor slides through it. */
  const [revealed, setRevealed] = useState<Record<number, 1 | 2 | 3>>({});
  useEffect(() => {
    if (topologies.length === 0) return;
    const b = topologies.length - 1;
    const t0 = window.setTimeout(
      () => setRevealed((r) => (r[b] === 1 ? r : { ...r, [b]: 1 })),
      0
    );
    const t1 = window.setTimeout(
      () => setRevealed((r) => (r[b] === 2 ? r : { ...r, [b]: 2 })),
      WAVE_PAUSE_1
    );
    const t2 = window.setTimeout(
      () => setRevealed((r) => (r[b] === 3 ? r : { ...r, [b]: 3 })),
      WAVE_PAUSE_1 + WAVE_PAUSE_2
    );
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [topologies]);

  /* ---------------- THE TREE'S OWN ZOOM — see the walk from far ------
     Zoom out and many suggestions stand in view at once, their
     interconnections readable across the whole family; zoom in and a
     single whisper fills the eye. One transform on one wrapper — the
     compositor owns it, the still canvas never re-renders for it.
     THE FINGER'S LAW — no plus, no minus: the walk is zoomed by the
     visitor's own fingers (a pinch travels apart or together) and by
     ctrl/cmd + wheel on the desktop. One live ref carries the scale
     so every gesture event lands on the true current zoom. */
  const ZOOM_MIN = 0.22;
  const ZOOM_MAX = 1.8;
  const clampZoom = useCallback(
    (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)),
    []
  );
  const [treeZoom, setTreeZoom] = useState(1);
  const zoomLiveRef = useRef(1);
  const wheelRestRef = useRef<number>(0);
  const applyZoom = useCallback(
    (z: number) => {
      const nz = clampZoom(z);
      zoomLiveRef.current = nz;
      setTreeZoom(nz);
    },
    [clampZoom]
  );
  /* THE TRUNK'S OWN X — the seed's stem inside the scroll content:
     every floor-anchor and the whole-family view center the TRUNK
     (the canvas's margin-auto box may drift when the family's wings
     change its width under a standing view). */
  const trunkScrollLeft = useCallback(() => {
    const v = vpRef.current;
    if (!v) return 0;
    const canvas = v.querySelector<HTMLDivElement>("div[data-tree-canvas]");
    if (!canvas) return Math.max(0, (v.scrollWidth - v.clientWidth) / 2);
    const trunkX = canvas.offsetLeft + canvas.offsetWidth / 2;
    return Math.max(0, trunkX - v.clientWidth / 2);
  }, []);
  const zoomFit = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const z = Math.min(
      vp.clientWidth / Math.max(1, tree.geometry.width),
      vp.clientHeight / Math.max(1, tree.geometry.height)
    );
    /* the final scale — clamped exactly as the walk will wear it — so
       the anchor math and the true scale never disagree */
    const zFinal = clampZoom(Math.min(z, 1));
    applyZoom(zFinal);
    /* THE WHOLE FAMILY, CENTERED ON ITS TRUNK — one quiet anchor after
       the scale settles. Pure geometry, no DOM read (the canvas box may
       not have re-rendered yet): the margin-auto canvas puts its stem
       at max(0,(clientW−geoW·z)/2)+geoW·z/2, so centering the stem is
       one subtraction. The floor stays below (the seed holds it). */
    window.setTimeout(() => {
      const v = vpRef.current;
      if (!v) return;
      v.scrollLeft = Math.max(
        0,
        (tree.geometry.width * zFinal - v.clientWidth) / 2
      );
      v.scrollTop = Math.max(0, v.scrollHeight - v.clientHeight);
    }, 60);
  }, [applyZoom, clampZoom, tree.geometry.width, tree.geometry.height]);

  /* THE PINCH — two fingers, one zoom: the meeting point of the
     fingers never moves while the family grows or steps back beneath
     them. One native non-passive listener owns the gesture (the
     browser's own page-zoom is turned away at the door — touch
     preventDefault and Safari's gesture events alike), and a click
     that a pinch might have birthed is swallowed so no whisper opens
     by accident. */
  const pinchRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    moved: boolean;
  } | null>(null);
  const pinchBlockRef = useRef(false);
  /* THE LAYER'S OWN BREATH — the canvas is promoted to its own
     compositor layer ONLY while the fingers walk it (a pinch, a
     wheel-zoom). At rest the layer is released: the browser tiles and
     scrolls the family cheaply, and sliding the suggestions never
     drags a giant texture across the screen (THE LAG LAW). */
  const [layerLive, setLayerLive] = useState(false);
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
    const fingers = (t1: Touch, t2: Touch) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const a = e.touches[0];
      const b = e.touches[1];
      pinchRef.current = {
        dist: Math.max(1, fingers(a, b)),
        midX: (a.clientX + b.clientX) / 2,
        midY: (a.clientY + b.clientY) / 2,
        moved: false,
      };
      setLayerLive(true); /* the canvas takes its layer before the first move */
      e.preventDefault(); /* the walk claims the gesture */
    };
    const onMove = (e: TouchEvent) => {
      const st = pinchRef.current;
      if (!st || e.touches.length !== 2) return;
      e.preventDefault();
      const a = e.touches[0];
      const b = e.touches[1];
      const dist = Math.max(1, fingers(a, b));
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      const f = dist / st.dist;
      const drift = Math.hypot(midX - st.midX, midY - st.midY);
      if (Math.abs(f - 1) < 0.004 && drift < 3) return;
      const z0 = zoomLiveRef.current;
      const z1 = clampZoom(z0 * f);
      if (z1 !== z0) {
        const rect = vp.getBoundingClientRect();
        /* the content point beneath the fingers' meeting place stays put */
        const cx = (vp.scrollLeft + (st.midX - rect.left)) / z0;
        const cy = (vp.scrollTop + (st.midY - rect.top)) / z0;
        const maxSL = Math.max(0, tree.geometry.width * z1 - vp.clientWidth);
        const maxST = Math.max(0, tree.geometry.height * z1 - vp.clientHeight);
        vp.scrollLeft = Math.min(maxSL, Math.max(0, cx * z1 - (midX - rect.left)));
        vp.scrollTop = Math.min(maxST, Math.max(0, cy * z1 - (midY - rect.top)));
        applyZoom(z1);
        st.moved = true;
      }
      st.dist = dist;
      st.midX = midX;
      st.midY = midY;
    };
    const onEnd = (e: TouchEvent) => {
      const st = pinchRef.current;
      if (!st) return;
      if (e.touches.length < 2) {
        if (st.moved) {
          /* a pinch is not a tap — the next click, if the engine
             synthesizes one, dies here */
          pinchBlockRef.current = true;
          window.setTimeout(() => {
            pinchBlockRef.current = false;
          }, 350);
        }
        pinchRef.current = null;
        setLayerLive(false); /* the layer rests with the fingers */
      }
    };
    const onGesture = (e: Event) => e.preventDefault(); /* Safari's own pinch — turned away */
    const onClickCapture = (e: MouseEvent) => {
      if (!pinchBlockRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      pinchBlockRef.current = false;
    };
    vp.addEventListener("touchstart", onStart, { passive: false });
    vp.addEventListener("touchmove", onMove, { passive: false });
    vp.addEventListener("touchend", onEnd, { passive: false });
    vp.addEventListener("touchcancel", onEnd, { passive: false });
    vp.addEventListener("gesturestart", onGesture);
    vp.addEventListener("gesturechange", onGesture);
    vp.addEventListener("click", onClickCapture, true);
    return () => {
      vp.removeEventListener("touchstart", onStart);
      vp.removeEventListener("touchmove", onMove);
      vp.removeEventListener("touchend", onEnd);
      vp.removeEventListener("touchcancel", onEnd);
      vp.removeEventListener("gesturestart", onGesture);
      vp.removeEventListener("gesturechange", onGesture);
      vp.removeEventListener("click", onClickCapture, true);
    };
  }, [mounted, clampZoom, applyZoom, tree.geometry.width, tree.geometry.height]);

  /* ctrl/cmd + wheel — the desktop's own pinch; a native non-passive
     listener (React's wheel is passive; the zoom must be allowed to
     claim the gesture) */
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
    const h = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setLayerLive(true);
      applyZoom(zoomLiveRef.current * (e.deltaY < 0 ? 1.12 : 0.89));
      window.clearTimeout(wheelRestRef.current);
      wheelRestRef.current = window.setTimeout(() => setLayerLive(false), 420);
    };
    vp.addEventListener("wheel", h, { passive: false });
    return () => {
      vp.removeEventListener("wheel", h);
      window.clearTimeout(wheelRestRef.current);
    };
  }, [mounted, applyZoom]);

  /* THE ANCHORED VIEW — the first layout stands at the trunk; a growing
     family keeps the visitor's reading place; a regrown family returns
     to the floor; a fresh graft pans once so the new house is in view;
     a geometry flip (narrow ⟷ wide) re-anchors to the family's heart.
     One layout pass per change — never per frame.
     THE UNDERGROVE LAW — the seed's own floor is the trunk's BASE, not
     the canvas's bottom: root families descend beneath the trunk, so
     the floor anchor holds the trunk base at the seed while the roots
     reach down into the ground, and a root's growth never moves the
     crown (the trunk base stays put; only the ground deepens). */
  const prevNarrowRef = useRef<boolean | null>(null);
  const prevTrunkBaseRef = useRef(0);
  useLayoutEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
    if (prevNarrowRef.current !== null && prevNarrowRef.current !== narrow) {
      prevSize.current = { w: 0, h: 0 }; /* the geometry turned — re-anchor */
    }
    prevNarrowRef.current = narrow;
    const { width, height, trunkBaseY } = tree.geometry;
    const dW = width - prevSize.current.w;
    const dH = height - prevSize.current.h;
    const trunkMoved =
      prevTrunkBaseRef.current !== 0 &&
      Math.abs(trunkBaseY - prevTrunkBaseRef.current) > 0.5;
    const req = panReqRef.current;
    if (req) {
      panReqRef.current = null;
      const n = tree.byId.get(req);
      if (n) {
        /* one quiet pan — the new house, in view at once */
        vp.scrollTop = Math.max(0, n.y * treeZoom - vp.clientHeight * 0.38);
        vp.scrollLeft = Math.max(0, n.x * treeZoom - vp.clientWidth / 2);
        prevSize.current = { w: width, h: height };
        prevTrunkBaseRef.current = trunkBaseY;
        return;
      }
    }
    if (prevSize.current.h === 0 || dH < 0) {
      /* THE FLOOR — the seed holds the middle: the trunk's base rests
         at the seed's own heart (container/2 + 3.4rem + half the
         sigil), the crown rising above it and the undergrove waiting
         just below the fold */
      vp.scrollTop = Math.max(
        0,
        trunkBaseY * treeZoom - (vp.clientHeight / 2 + 110)
      );
      vp.scrollLeft = trunkScrollLeft();
    } else if (dH > 0 && trunkMoved) {
      /* the crown rose — every row shifted down by the growth */
      vp.scrollTop += dH * treeZoom;
      /* THE FLICKER LAW — every row re-centers over the canvas, so
         widening the family shifts the content by HALF the delta;
         compensating by exactly that half keeps the tree standing
         still while it grows, and the slide never stutters */
      vp.scrollLeft += (dW / 2) * treeZoom;
    } else if (dH > 0 || dW !== 0) {
      /* THE ROOTS DEEPENED — the new rows descend BELOW the standing
         trunk: the crown keeps its exact place, only the ground
         deepens; the walk never stirs */
      vp.scrollLeft += (dW / 2) * treeZoom;
    }
    prevSize.current = { w: width, h: height };
    prevTrunkBaseRef.current = trunkBaseY;
  }, [tree.geometry.width, tree.geometry.height, tree.geometry.trunkBaseY, mounted, tree, narrow, treeZoom, trunkScrollLeft]);

  /* ---------------- THE GRAFT — the walk grows from a choice -------- */

  /**
   * THE FULL HOUSE LAW. The grafted sub-family is tuned by resonance —
   * the pressed whisper's own words lead the field — but resonance may
   * sing for only a few voices (a quiet context, a narrow vocabulary).
   * A house of two is a starved house: the resonance's own hits stand
   * first, and the fresh pool fills the batch the rest of the way, so
   * every graft carries a whole family (up to what remains unspent).
   */
  const chooseGraftSeeds = useCallback(
    (fresh: typeof grove, pickField: ReturnType<typeof buildResonanceField>): GenealogySeed[] => {
      if (!idf) return [];
      const hits = rankWhispers(fresh, pickField, {
        idf,
        seen: seenSnapshot,
        limit: BATCH_SIZE,
        perSubject: 2,
      });
      /* the fill — the resonance leads, the family is never starved */
      const hitTexts = new Set(hits.map((h) => h.text));
      const fill = fresh
        .filter((w) => !hitTexts.has(w.text))
        .slice(0, BATCH_SIZE)
        .map((w) => ({ ...w, score: 0 }));
      /* THE VOICE — the whole house tuned at once: shortened to the
         walker's breath, near-twins stepped aside; every voice keeps
         its own family's light */
      return withAccents(
        tuneSeedBatch(
          [...hits, ...fill].map(
            (w) => ({ text: w.text, movement: w.movement, score: w.score })
          ),
          expansionLevelScore,
          BATCH_SIZE
        )
      );
    },
    [idf, seenSnapshot, expansionLevelScore, withAccents]
  );

  /* the pan — one quiet assignment, never an animation loop; the
     zoom's own scale rides the coordinates (the layout is unscaled,
     the eye sees it scaled) */
  const panToNode = useCallback(
    (id: string | null) => {
      const vp = vpRef.current;
      if (!vp || !id) return;
      const n = tree.byId.get(id);
      if (!n) return;
      vp.scrollTop = Math.max(0, n.y * treeZoom - vp.clientHeight * 0.38);
      vp.scrollLeft = Math.max(0, n.x * treeZoom - vp.clientWidth / 2);
    },
    [tree, treeZoom]
  );

  /* THE QUIET PICK — the walk grows FROM the pressed whisper: the
     pressed chip is marked, a whole sub-family is grafted directly
     above it, tuned to the channeling context, and everything that
     stood above folds away. The trail remembers every step. And THE
     ZOOM: the camera pulls back and the answer rises inside the tree.
     THE CREATION DOOR — an individual suggestion that is a making,
     not a question: one touch opens its own theme page — the record,
     the book, the invention — forged in the moment from the branch's
     own words (the seed rides to the page; no room rises, the page
     IS the room). */
  const pick = useCallback(
    (node: GenealogyNode) => {
      if (disabled) return;
      /* the visitor's own step — the tree may grow again */
      suppressRegrowRef.current = false;
      if (node.creation) {
        recordJourney({ b: category, s: scopeHint ?? undefined });
        setPickedId(node.id);
        setBranchCreationSeed({
          kind: node.creation,
          topic: node.topic ?? node.text,
        });
        if (node.creation === "akashic") openAkashic();
        else if (node.creation === "book") openDreamBook();
        else openInvent();
        return;
      }
      recordExpansion("pick", {
        scope: scopeHint ?? null,
        movement: node.movement,
      });
      recordJourney({ b: category, s: scopeHint ?? undefined });
      recordSeen([node.text]);
      setPickedId(node.id);
      setLineage((ln) =>
        [...ln.filter((l) => l.text !== node.text), { id: node.id, text: node.text }].slice(-10)
      );
      /* the fold — the choice prunes the speculation above it */
      const level = tree.levelOf.get(node.id);
      if (typeof level === "number") setMaxLevel(level);
      /* the grafted house — its voices tuned to the channeling context:
         the pressed whisper leads the field, the thread's breath follows */
      const pickField = buildResonanceField({
        scope: scopeHint ?? null,
        context: `${node.text}\n${contextSnapshot}`.trim() || null,
        buds: [node.text],
        hour,
      });
      const spentSet = spent;
      const fresh = shownGrove.filter((w) => !spentSet.has(w.text.toLowerCase()));
      if (fresh.length > 0) {
        const seeds = weaveCreations(
          chooseGraftSeeds(fresh, pickField),
          topologies.length
        );
        if (seeds.length > 0) {
          const graft = buildGraftTopology(seeds, node.id, narrowRef.current);
          markSpent(seeds);
          commitTopologies((t) =>
            t.length >= MAX_BATCHES ? t : [...t, graft]
          );
          panReqRef.current = node.id; /* one quiet pan — the new house in view */
        }
      }
      /* THE ZOOM — the answer rises inside the tree, instantly.
         THE MAKING'S OWN ROOM — makings included: a whisper that asks
         the laboratory to MAKE something opens its conversation room
         like every ask, and the creation rises inline beneath the ask
         (the working room is gone — the chat is the workshop now). */
      zoomOpenedAtRef.current = Date.now();
      setZoom({ q: node.text, move: node.movement });
      onPick(node.text, askScopeFor(node.text));
    },
    [
      category,
      disabled,
      onPick,
      askScopeFor,
      scopeHint,
      tree,
      grove,
      chooseGraftSeeds,
      contextSnapshot,
      hour,
      commitTopologies,
      markSpent,
      spent,
      weaveCreations,
      topologies.length,
      setBranchCreationSeed,
      openAkashic,
      openDreamBook,
      openInvent,
    ]
  );

  /* ------- THE LANDING'S OWN ENTITY — the chat of the threshold ------
     Docked in the threshold the chat is INDEPENDENT of the full
     portal: it keeps its own thread (never the store's channel
     sessions), and speaks through the standing scope's own door —
     the Mirror (the standing field) answers as the mirror of the
     Absolute, the four family fields through their own channels —
     carrying that scope's own conversation with every ask, so each
     field remembers across rooms. EVERY FIELD IS ITS OWN WORLD: its
     own thread, its own memory, its own room, its own history —
     leaving a field and coming back finds the chat exactly as it
     was left. The full portal never sees these words, and the
     landing never sees the portal's. */
  const [landingThread, setLandingThread] = useState<RoomTurn[]>([]);
  const landingTurnsRef = useRef<{ q: string; a: string }[]>([]);
  const [landingBusy, setLandingBusy] = useState(false);
  /* THE WATCHFUL FIELD — the moment the floor's last ask began, so a
     crossing that never comes home is closed gently instead of leaving
     the room a wordless blue panel (the watchdog below speaks). */
  const landingBusySinceRef = useRef(0);
  /* THE STANDING FIELD — the scope the chat wears; every ask, every
     room follow-up and every kept page is the field's own. */
  const landingScope = useMirror((s) => s.landingScope);
  const setLandingScope = useMirror((s) => s.setLandingScope);
  /* the thread's own mirror — the scope-switch keeps read it */
  const landingThreadRef = useRef<RoomTurn[]>([]);
  landingThreadRef.current = landingThread;
  /* EVERY FIELD'S OWN KEEP — the thread, the carried memory and the
     history page of the field the visitor just left, shelved until
     they come back (in memory; the words also rest per scope in
     sessionStorage, so even a fresh page wakes the field's own chat). */
  const landingThreadsByScopeRef = useRef<Map<string, RoomTurn[]>>(new Map());
  const landingTurnsByScopeRef = useRef<Map<string, { q: string; a: string }[]>>(new Map());
  const historySessionsByScopeRef = useRef<Map<string, string>>(new Map());
  /* THE DEVICE'S OWN HISTORY — one hand in the room keeps this visit's
     conversations on this device alone (sessionStorage, never a
     server); a touch restores any of them whole. A cleared room starts
     a fresh page of the keep, and the cleared one stays reachable.
     Each field keeps its own pages. */
  const historySessionRef = useRef<string>(freshHistorySessionId());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<LandingHistoryEntry[]>([]);
  const openHistory = useCallback(() => {
    setHistoryEntries(readLandingHistory());
    setHistoryOpen(true);
  }, []);
  const restoreFromHistory = useCallback(
    (entry: LandingHistoryEntry) => {
      const turns = entry.turns.slice(-LANDING_HISTORY_TURNS);
      if (turns.length === 0) return;
      const scope: LandingScopeKey =
        (entry.scope &&
        (["mirror", "interplanetary", "quantum", "healing", "artx"] as string[]).includes(
          entry.scope
        )
          ? (entry.scope as LandingScopeKey)
          : landingScope);
      const restored = turns.map((t) => ({ q: t.q, a: t.a, loading: false }));
      /* the page shelves into its own field first, so the field's
         cache and the page agree — then the field itself wakes */
      landingThreadsByScopeRef.current.set(scope, restored);
      landingTurnsByScopeRef.current.set(scope, turns);
      historySessionsByScopeRef.current.set(scope, entry.id);
      if (landingScope === scope) {
        setLandingThread(restored);
        landingTurnsRef.current = turns;
        historySessionRef.current = entry.id;
        const last = turns[turns.length - 1];
        setZoom({ q: last.q, move: null });
      } else {
        /* the field wakes with its own room — the scope-switch below
           hydrates the cache we just laid and raises the room */
        setLandingScope(scope);
      }
      setHistoryOpen(false);
      window.dispatchEvent(new CustomEvent("landing-chat:return"));
    },
    [landingScope, setLandingScope]
  );
  const clearLandingHistory = useCallback(() => {
    writeLandingHistory([]);
    setHistoryEntries([]);
  }, []);
  /* THE HISTORY PANEL — the device's own kept conversations. One body
     shared by every hand that opens the history: the docked room's
     quiet hands and the realm's top history hand alike. */
  const renderHistoryPanel = (opts?: { bare?: boolean }) => {
    /* THE TRAIL AND THE KEPT — read fresh at every opening, the way
       the ledger reads its keep: the panel always speaks the present. */
    const trail = readMakerTrail();
    const keptChats = guest
      ? []
      : (Object.keys(KEPT_SURFACE_LABELS) as ChatSurface[]).flatMap((s) =>
          listChats(s)
            .slice(0, 2)
            .map((c) => ({
              surface: s,
              label: KEPT_SURFACE_LABELS[s],
              id: c.id,
              title: c.title,
              count: c.messages.length,
            }))
        );
    return (
      <div
        data-testid={`${testIdPrefix}-history-panel`}
        className="w-[272px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-3 lift-lg"
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
        }}
      >
        <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("Conversation history")}
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground/80">
          {t("Kept only on this device — and only for this visit. Nothing travels to a server.")}
        </p>
        {/* THE THREE TIDY ROOMS — one quiet scroll carries them all:
            this visit's whispers, the maker's trail, the keeper's kept
            conversations (the last room stands only for a signed
            passage). */}
        <div className="nice-scroll mt-2 max-h-[280px] overflow-y-auto">
          {/* I. WHISPERS OF THIS VISIT — the device's own threads */}
          <div>
            <p className="mono-label flex items-baseline gap-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
              {t("Whispers of this visit")}
              <span className="text-foreground/50">· {historyEntries.length}</span>
            </p>
            {historyEntries.length === 0 ? (
              <p className="px-1 py-3 text-center text-[12.5px] text-muted-foreground/70">
                {t("Nothing kept yet.")}
              </p>
            ) : (
              <div className="mt-1 space-y-0.5">
                {historyEntries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => restoreFromHistory(entry)}
                    className="focus-glow flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]"
                  >
                    {entry.scope && LANDING_SCOPE_DOTS[entry.scope] ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full"
                        title={entry.scope}
                        style={{ backgroundColor: LANDING_SCOPE_DOTS[entry.scope] }}
                      />
                    ) : (
                      <MessageSquareText
                        className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-foreground/90">
                        {entry.title}
                      </span>
                      <span className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                        {t("{n} whispers · {when}", {
                          n: entry.turns.length,
                          when: historyAgo(entry.at),
                        })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {historyEntries.length > 0 && (
              <button
                type="button"
                onClick={clearLandingHistory}
                className="focus-glow mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border hairline py-1.5 text-[12px] text-muted-foreground transition-colors duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
              >
                <Eraser className="size-3" aria-hidden="true" />
                {t("Clear the history")}
              </button>
            )}
          </div>
          {/* II. THE MAKER'S TRAIL — the rooms this visit opened, one
              stone each; a touch returns to the room (from the landing
              it opens as the bare mini tab, never yanking the walk) */}
          {trail.length > 0 && (
            <div className="mt-3 border-t hairline pt-2.5">
              <p className="mono-label flex items-baseline gap-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
                {t("The maker's trail")}
                <span className="text-foreground/50">· {trail.length}</span>
              </p>
              <div className="mt-1 space-y-0.5">
                {trail.map((stone, i) => {
                  const meta = TAB_META[stone.key];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={`${stone.key}:${stone.at}:${i}`}
                      type="button"
                      onClick={() => {
                        setHistoryOpen(false);
                        openToolTab(
                          stone.key,
                          opts?.bare ? { bare: true } : undefined
                        );
                      }}
                      className="focus-glow flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]"
                    >
                      <Icon
                        className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-foreground/90">
                          {t(meta.label)}
                        </span>
                      </span>
                      <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                        {historyAgo(stone.at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* III. KEPT CONVERSATIONS — a signed keeper's archive, the
              same shelf the ledger reads; a guest holds no room here */}
          {!guest && (
            <div className="mt-3 border-t hairline pt-2.5">
              <p className="mono-label flex items-baseline gap-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80">
                {t("Kept conversations")}
                <span className="text-foreground/50">· {keptChats.length}</span>
              </p>
              {keptChats.length === 0 ? (
                <p className="px-1 py-3 text-center text-[12.5px] text-muted-foreground/70">
                  {t("Nothing kept yet.")}
                </p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {keptChats.map((c) => (
                    <button
                      key={`${c.surface}:${c.id}`}
                      type="button"
                      onClick={() => {
                        setHistoryOpen(false);
                        openChatSurface(c.surface, c.id);
                      }}
                      className="focus-glow flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]"
                    >
                      <MessageSquareText
                        className="size-3.5 shrink-0 text-muted-foreground/70"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-foreground/90">
                          {c.title}
                        </span>
                        <span className="mono-label block text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
                          {t(c.label)} · {c.count}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  /* THE LANDING'S OWN QUIET — the threshold's floor keeps its welcome
     by its own thread's silence: the store's channel (the full
     portal's conversations) has no word in the docked room, so an ask
     made across the tunnel must never blank the landing's question
     and its five first doors. (The old quiet read the channel — one
     ask inside the full portal and the threshold came home EMPTY:
     the tunnel's glitch.) */
  const floorQuiet = landingThread.length === 0 && !landingBusy;
  /* THE LANDING'S OWN PAINT HAND — the vision (the visitor's own ask
     or the mirror's own gift) mixed straight into the landing thread:
     one plate beneath the words, the chosen style worn, its address
     kept so it returns with the words. THE HONEST BRUSH: a paint that
     rests marks the turn with paintFailed — no silent absence, the
     retry hand rises beside the notice. */
  const paintLandingTurn = useCallback(
    async (
      prompt: string,
      turnIndex?: number
    ): Promise<{ imageUrl?: string; imageTitle?: string }> => {
    const paintFailedOn = (t: RoomTurn[], i: number) =>
      t.map((turn, ti) =>
        ti === i ? { ...turn, paintFailed: true } : turn
      );
    const targetIndex = turnIndex ?? -1; // -1 = the last turn
    setLandingThread((t) =>
      t.map((turn, i) =>
        (targetIndex === -1 ? i === t.length - 1 : i === targetIndex)
          ? { ...turn, painting: true, paintFailed: false }
          : turn
      )
    );
    try {
      const res = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          language: useMirror.getState().language,
          single: true,
          ...(useMirror.getState().visualStyle
            ? { style: useMirror.getState().visualStyle }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        artifact?: { imageUrl?: string; title?: string };
      } | null;
      const url = data?.artifact?.imageUrl;
      if (!url) {
        /* the brushes rested — the turn says so honestly */
        setLandingThread((t) =>
          paintFailedOn(
            t.map((turn, i) =>
              (targetIndex === -1 ? i === t.length - 1 : i === targetIndex)
                ? { ...turn, loading: false, painting: false }
                : turn
            ),
            targetIndex === -1 ? t.length - 1 : targetIndex
          )
        );
        return {};
      }
      setLandingThread((t) =>
        t.map((turn, i) =>
          (targetIndex === -1 ? i === t.length - 1 : i === targetIndex)
            ? {
                ...turn,
                /* the wish-path turn arrives still loading — the plate
                   (or its honest absence) is the turn's own completion */
                loading: false,
                painting: false,
                paintFailed: false,
                imageUrl: url,
                imageTitle: data?.artifact?.title,
              }
            : turn
        )
      );
      return {
        imageUrl: url,
        imageTitle: data?.artifact?.title,
      };
    } catch {
      setLandingThread((t) =>
        paintFailedOn(
          t.map((turn, i) =>
            (targetIndex === -1 ? i === t.length - 1 : i === targetIndex)
              ? { ...turn, loading: false, painting: false }
              : turn
          ),
          targetIndex === -1 ? t.length - 1 : targetIndex
        )
      );
      return {};
    }
  },
  []);

  const speakFromLanding = useCallback(
    async (text: string, attachments?: ChatAttachment[]) => {
      const q = text.trim();
      if (!q) return;
      /* THE WISH TO SEE — the landing's floor hears the wish in any
         phrasing: an image ask crystallizes at once (no LLM round
         trip), the last channel its subject, the visitor's words its
         shape. THE MIRROR'S OWN EYE — a reply that itself decided to
         paint carries its vision beneath the words below. */
      if (isVisualIntent(q)) {
        const priorTurns = landingTurnsRef.current;
        const lastReply = [...priorTurns].reverse().find((t) => t.a.trim())?.a ?? "";
        const crystallizeRequest = blendVisualRequest(q, lastReply);
        setLandingThread((t) => [
          ...t,
          { q, a: "", loading: true, painting: true, visionPrompt: crystallizeRequest },
        ]);
        setLandingBusy(true);
        landingBusySinceRef.current = Date.now();
        window.dispatchEvent(new CustomEvent("landing-chat:return"));
        try {
          const painted = await paintLandingTurn(crystallizeRequest);
          /* THE FIELD'S OWN KEEP — the finished exchange (its plate
             included) rests in the field's own cache and page; a
             rested brush keeps the honest absence, never a false word */
          const kept: KeptLandingTurn[] = [
            ...landingTurnsRef.current,
            {
              q,
              a: painted.imageUrl ? "A vision, crystallized." : "",
              ...(painted.imageUrl
                ? {
                    imageUrl: painted.imageUrl,
                    imageTitle: painted.imageTitle,
                  }
                : {}),
            },
          ].slice(-12);
          landingTurnsRef.current = kept;
          writeLandingThreadScope(landingScope, kept);
        } finally {
          setLandingBusy(false);
        }
        return;
      }
      setLandingThread((t) => [...t, { q, a: "", loading: true }]);
      setLandingBusy(true);
      landingBusySinceRef.current = Date.now();
      try {
        /* THE CARRIED CONVERSATION — every earlier exchange of THIS
           field (floor asks and room follow-ups alike) rides with this
           ask: each scope's memory is its own. */
        const prior = landingTurnsRef.current.slice(-8);
        /* THE FIELD'S OWN VOICE — the standing scope answers through
           its own door (the Mirror as the mirror of the Absolute, the
           family fields through their own channels). */
        const scopeCategory =
          LANDING_SCOPE_CATEGORY[landingScope] ?? ("absolute" as const);
        const { text: reply, vision } = await speakWithTransmission(
          scopeCategory,
          q,
          q,
          "",
          prior,
          language,
          [],
          attachments
        );
        /* THE WORDLESS GUARD — a crossing that lands without words (a
           silence from the far side of the sky) is given one gentle
           line, so the room never stands blue and empty: the
           conversation always holds something true. */
        const landedReply =
          reply ||
          (vision
            ? ""
            : "The field rests a breath — speak once more, dear one.");
        setLandingThread((t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? {
                  ...turn,
                  a: landedReply,
                  loading: false,
                }
              : turn
          )
        );
        /* THE CONSENT LAW — the reply is words only: no painting rises
           from the mirror's own initiative. The atelier wakes at the
           visitor's own typed ask (the wish-to-see door above) or at
           a Crystallize press — never from a reply's own decision. */
        landingTurnsRef.current = [
          ...landingTurnsRef.current,
          { q, a: landedReply || reply },
        ].slice(-12);
        /* THE FIELD'S OWN KEEP — the finished exchange rests in the
           field's own cache and its own sessionStorage page, for this
           visit (never a server); a return to the field finds it. */
        const kept = landingTurnsRef.current;
        landingThreadsByScopeRef.current.set(
          landingScope,
          landingThreadRef.current.map((turn, i) =>
            i === landingThreadRef.current.length - 1
              ? { ...turn, a: landedReply, loading: false }
              : turn
          )
        );
        writeLandingThreadScope(landingScope, kept);
        /* THE LIBRARY'S QUIET AUTOSHELF — the field's conversation
           walks into the profile's Cosmic Library, its own volume */
        void saveLandingToLibrary(landingScope, kept);
        setHistoryEntries(
          upsertLandingHistory({
            id: historySessionRef.current,
            at: Date.now(),
            title: kept[0]?.q ?? q,
            turns: kept.slice(-LANDING_HISTORY_TURNS),
            scope: landingScope,
          })
        );
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : "";
        setLandingThread((t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? {
                  ...turn,
                  loading: false,
                  failed: true,
                  a: message,
                  energy: err instanceof EnergyError,
                }
              : turn
          )
        );
      } finally {
        setLandingBusy(false);
      }
    },
    [language, landingScope, paintLandingTurn]
  );

  /* THE WATCHFUL FIELD — a floor ask whose crossing never comes home
     (a lost fetch, a hung sky) is closed gently after two honest
     minutes: the turn speaks its quiet word, the room never sits a
     wordless blue panel, and the composer's hand is free again. */
  useEffect(() => {
    if (!realm || !landingBusy) return;
    const id = window.setInterval(() => {
      const since = landingBusySinceRef.current;
      if (!since || Date.now() - since < 120_000) return;
      landingBusySinceRef.current = 0;
      setLandingThread((t) =>
        t.map((turn, i) =>
          i === t.length - 1 && turn.loading
            ? {
                ...turn,
                loading: false,
                failed: true,
                a: "The field is quiet — speak once more",
              }
            : turn
        )
      );
      setLandingBusy(false);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [realm, landingBusy]);

  /* THE WALK CONTINUES FROM THE ANSWER — a branch grown on the reply,
     pressed inside the panel, keeps the walk going from the family's
     last standing place: the trail grows, a new house is grafted from
     the pressed chip's own node, and the next answer replaces this one
     in the same quiet room. */
  const sendFromPanel = useCallback(
    (text: string, move: BranchType | null, attachments?: ChatAttachment[]) => {
      if (disabled || liveLoading || landingBusy || !text.trim()) return;
      /* THE LANDING'S OWN CHAT — docked in the threshold the ask never
         touches the store's channel: the room rises and the landing's
         own entity (the mirror of the Absolute) answers inside it, the
         whole landing conversation riding with every word. */
      if (realm) {
        zoomOpenedAtRef.current = Date.now();
        setZoom({ q: text, move: null });
        void speakFromLanding(text, attachments);
        /* THE SEND'S OWN RETURN — the threshold brings its chat back
           to the eye once the whisper has left: the keyboard's fold
           never leaves the glass half-off the screen for the
           visitor's own hand to chase. */
        window.dispatchEvent(new CustomEvent("landing-chat:return"));
        return;
      }
      /* the visitor's own step — the tree may grow again */
      suppressRegrowRef.current = false;
      recordExpansion("pick", { scope: scopeHint ?? null, movement: move });
      recordJourney({ b: category, s: scopeHint ?? undefined });
      recordSeen([text]);
      setLineage((ln) =>
        [...ln.filter((l) => l.text !== text), { id: null, text }].slice(-10)
      );
      if (pickedId) {
        const pickField = buildResonanceField({
          scope: scopeHint ?? null,
          context: `${text}\n${contextSnapshot}`.trim() || null,
          buds: [text],
          hour,
        });
        const fresh = shownGrove.filter((w) => !spent.has(w.text.toLowerCase()));
        if (fresh.length > 0) {
          const seeds = weaveCreations(
            chooseGraftSeeds(fresh, pickField),
            topologies.length
          );
          if (seeds.length > 0) {
            const graft = buildGraftTopology(seeds, pickedId, narrowRef.current);
            markSpent(seeds);
            commitTopologies((t) =>
              t.length >= MAX_BATCHES ? t : [...t, graft]
            );
            panReqRef.current = pickedId;
          }
        }
      }
      zoomOpenedAtRef.current = Date.now();
      /* THE MAKING'S OWN ROOM — every ask opens its conversation room,
         makings included: the creation rises inline beneath the ask. */
      setZoom({ q: text, move });
      /* THE LANDING'S OWN LAW — docked in the threshold the ask is
         always the reflection mirror itself: no category, no scope —
         the mirror's humble voice answers from the open floor. The
         full portal keeps every scope's own door. */
      onPick(text, realm ? undefined : askScopeFor(text), attachments);
    },
    [
      realm,
      landingBusy,
      speakFromLanding,
      category,
      disabled,
      liveLoading,
      onPick,
      askScopeFor,
      pickedId,
      scopeHint,
      grove,
      chooseGraftSeeds,
      contextSnapshot,
      hour,
      commitTopologies,
      markSpent,
      spent,
      weaveCreations,
      topologies.length,
    ]
  );

  /* the trail's own touch — RETURN to a previous branch: the walk
     session kept the room's transmission, so one touch re-opens that
     very room with its own words standing in it. A room the walk no
     longer remembers still answers the old way: one quiet pan and a
     single flash of the chip. */
  const walkBack = useCallback(
    (step: { id: string | null; text: string }) => {
      const known = getWalkSession().getNode(walkNodeId(step.text));
      if (known && known.transmission.trim()) {
        if (step.id) panToNode(step.id);
        /* the walk stepped back — the trail follows: the returned room
           stands last, and YOU ARE HERE points at it */
        setLineage((ln) =>
          [...ln.filter((l) => l.text !== step.text), { id: step.id, text: step.text }].slice(-10)
        );
        setZoom({ q: step.text, move: null, restored: known.transmission.trim() });
        return;
      }
      panToNode(step.id);
      if (!step.id) return;
      setFlashId(step.id);
      window.setTimeout(() => setFlashId(null), 1500);
    },
    [panToNode]
  );

  /* the lineage chain — from the pressed whisper down to the trunk:
     every tie of the walk burns brighter than the rest of the tree */
  const chainSet = useMemo(() => {
    const s = new Set<string>();
    let cur = pickedId ? tree.byId.get(pickedId) : null;
    while (cur) {
      s.add(cur.id);
      cur = cur.parent ? (tree.byId.get(cur.parent) ?? null) : null;
    }
    return s;
  }, [pickedId, tree]);

  /* THE ANSWER'S ROOM — the reply's own branches, pressed from inside
     the panel; THE VOICE — every branch shortened to the walker's
     breath, near-twins stepped aside, so the room's horizon is a set
     of questions that never look alike. */
  const contSeeds = useMemo(() => {
    const seen = new Set<string>();
    const pool: { type: BranchType; question: string; reason?: string }[] = [];
    for (const b of channeling ?? []) {
      const k = b.question.toLowerCase();
      if (seen.has(k) || (zoom && k === zoom.q.toLowerCase())) continue;
      seen.add(k);
      pool.push({ type: b.type, question: b.question, reason: b.reason });
    }
    const tuned = tuneSeedBatch(
      pool.map((b) => ({ text: b.question, movement: b.type, score: 3 })),
      expansionLevelScore,
      6
    );
    const byText = new Map(pool.map((b) => [b.question, b]));
    /* a tuned text keeps its branch's reason when one grew with it */
    return tuned.map((ts) => {
      const src =
        byText.get(ts.text) ??
        pool.find((b) => b.question.length >= ts.text.length && b.question.includes(ts.text.slice(0, 24)));
      return { type: ts.movement, question: ts.text, reason: src?.reason };
    });
  }, [channeling, zoom, expansionScore]);

  /* the panel's streaming body — pinned to the newest words while the
     answer grows, unless the visitor scrolled up to read; a new room
     opens at its own top (one quiet reset, never a jump) */
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);
  const onBodyScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  }, []);
  useEffect(() => {
    if (!liveLoading) return;
    const el = bodyRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [liveAnswer, liveLoading]);

  /* ------------- THE RESONANCE WALK — v4.0 wiring -------------
     Every room the camera lands on registers with the session
     controller: the Predictive Resonance Cache pre-loads each
     branch's sigil and frequency one to two steps ahead, and the
     field's voice crossfades to the new room's own tone once the
     visitor's hand has opened the gate. */
  const zoomQ = zoom?.q ?? null;
  const zoomMove = zoom?.move ?? null;

  /* a new room opens at its own top — one quiet reset, never a jump */
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = 0;
    pinnedRef.current = true;
  }, [zoomQ]);

  /* the room the walk just left — the parent of the standing room,
     kept in state (render-time guarded, the official pattern) */
  const [seenRoomQ, setSeenRoomQ] = useState<string | null>(null);
  const [lastRoomQ, setLastRoomQ] = useState<string | null>(null);
  if (zoomQ !== seenRoomQ) {
    setSeenRoomQ(zoomQ);
    setLastRoomQ(seenRoomQ);
  }

  useEffect(() => {
    if (!zoomQ) return;
    const session = getWalkSession();
    const id = walkNodeId(zoomQ);
    const cat = categoryForMove(zoomMove);
    const known = session.getNode(id);
    const parentId =
      known?.parentId ??
      (lastRoomQ && walkNodeId(lastRoomQ) !== id ? walkNodeId(lastRoomQ) : null);
    if (session.currentNodeId === id) {
      /* the same room stands again — re-anchor, never double-step */
      session.touch(id);
    } else {
      session.navigateToBranch({
        id,
        parentId,
        category: known?.category ?? cat,
        title: zoomQ,
        transmission: known?.transmission ?? "",
        childrenIds: known?.childrenIds ?? [],
      });
    }
  }, [zoomQ, zoomMove, lastRoomQ]);

  /* THE WALK'S SILENCE BETWEEN ROOMS — the narrator never reads one
     room's words into the next; the new room's voice (if the gate
     stands open) rises when its own transmission lands. */
  useEffect(() => {
    stopRoomNarration();
  }, [zoomQ]);

  /* THE SETTLING — the transmission lands, the branches grow: the room
     is refreshed and its children are registered — so the walk
     remembers where it may go next. Nothing is fetched: the quiet
     walk's cache is bookkeeping alone. A RESTORED room (a previous
     branch re-opened from the trail) is memory, not a landing — the
     settle never touches it. */
  /* THE ROOM'S OWN WORDS — the channel's live answer belongs to the
     standing room only when its question IS the room's question; a
     previous exchange's words never wear another room's title.
     THE ROOM NEVER FOLDS — an ask that could not cross shows its
     error right here (the chat behind holds nothing anymore). */
  const liveBelongsToRoom = !!zoomQ && liveQuestion === zoomQ;
  /* THE MAKING IN THE ROOM — the channel's last message, when it is
     this room's own ask, carries the making: the room renders it
     inline, exactly where the ask was spoken. The working room is
     gone — the conversation is where everything is made now (the
     landing's chat stays free: bare never reads the channel). */
  const roomMessage = !realm && liveBelongsToRoom ? liveMessage ?? null : null;
  const roomMaking =
    !!roomMessage &&
    !!(roomMessage.sideArtifact || roomMessage.artifact || roomMessage.visual);
  const liveAnswerText = liveBelongsToRoom ? (liveAnswer ?? "").trim() : "";
  const roomError =
    liveBelongsToRoom || !liveLoading ? liveError ?? null : null;
  const restoredText = zoom?.restored ?? null;
  const answer = restoredText ?? liveAnswerText;
  const answerLanded = restoredText
    ? true
    : !liveLoading && liveAnswerText.length > 0;
  /* THE LANDING'S OWN ROOM — docked in the threshold the room reads
     the landing thread's own last turn (the store's channel stays
     untouched); the full portal reads the channel as it always did. */
  const lastLandingTurn =
    landingThread.length > 0 ? landingThread[landingThread.length - 1] : null;
  /* THE RETRY HAND — a crystallization whose brushes rested may be
     asked again: the same vision prompt, the same turn, one touch. */
  const retryLandingPaint = useCallback(
    (turnIndex?: number) => {
      const idx = turnIndex ?? landingThread.length - 1;
      const turn = landingThread[idx];
      const prompt = turn?.visionPrompt;
      if (!prompt || turn?.painting) return;
      void paintLandingTurn(prompt, idx);
    },
    [landingThread, paintLandingTurn]
  );
  const floorBusy = realm
    ? landingBusy || !!lastLandingTurn?.loading
    : liveLoading;
  const roomAnswer = realm
    ? lastLandingTurn && !lastLandingTurn.loading
      ? lastLandingTurn.a
      : ""
    : answer;
  const roomLoading = realm ? !!lastLandingTurn?.loading : liveLoading;
  const displayError = realm
    ? lastLandingTurn?.failed
      ? lastLandingTurn.a || "The field is quiet"
      : null
    : roomError;
  /* THE ENERGY'S OWN DRESS — a spent-light silence is styled gently
     (amber, a rest), never as the rose alarm of a broken crossing. */
  const energyNotice = displayError === ENERGY_NOTICE;
  const displayLanded = realm
    ? !roomLoading && roomAnswer.length > 0
    : answerLanded;
  const settledKey = `${zoomQ ?? ""}|${answerLanded ? "1" : "0"}|${liveAnswerText.length}|${contSeeds.length}`;
  useEffect(() => {
    if (!zoomQ || restoredText || !answerLanded) return;
    const session = getWalkSession();
    const id = walkNodeId(zoomQ);
    const known = session.getNode(id);
    const cat = known?.category ?? categoryForMove(zoomMove);
    const parentId = known?.parentId ?? null;
    for (const b of contSeeds) {
      const cid = walkNodeId(b.question);
      session.register({
        id: cid,
        parentId: id,
        category: categoryForMove(b.type),
        title: b.question,
        transmission: "",
        childrenIds: [],
      });
    }
    session.settle({
      id,
      parentId,
      category: cat,
      title: zoomQ,
      transmission: liveAnswerText,
      childrenIds: contSeeds.map((b) => walkNodeId(b.question)),
    });
  }, [settledKey, answerLanded, zoomQ, zoomMove, contSeeds, liveAnswerText, restoredText]);

  /* THE WALK TAKES IN EVERY ANSWER — even one whose room no longer
     stands open. When a channel's transmission lands after the visitor
     has walked to another room (the ask was left mid-flight), the walk
     still receives the words here, quietly: the node is settled in the
     background, so the trail's RETURN later opens a room with its
     transmission standing inside — never a silent flash on the wall.
     The channel-generation wheel already guarantees the answer belongs
     to this very question; the walk only keeps what is its own. */
  const backgroundSettleKey = `${liveQuestion ?? ""}|${(liveAnswer ?? "").length}|${channeling?.length ?? 0}`;
  useEffect(() => {
    if (!liveQuestion) return;
    const text = (liveAnswer ?? "").trim();
    if (!text) return;
    if (liveBelongsToRoom) return; /* the standing room settles its own way */
    const session = getWalkSession();
    const id = walkNodeId(liveQuestion);
    const known = session.getNode(id);
    if (!known) return;
    const children = (channeling ?? []).map((b) => walkNodeId(b.question));
    const childrenKnown = known.childrenIds ?? [];
    if (known.transmission.trim() && childrenKnown.length >= children.length)
      return;
    session.settle({
      id,
      parentId: known.parentId,
      category: known.category,
      title: known.title,
      transmission: text,
      childrenIds: children.length > 0 ? children : childrenKnown,
    });
  }, [backgroundSettleKey, liveQuestion, liveAnswer, liveBelongsToRoom, channeling]);

  /* THE NARRATOR'S GATE — the visitor's own hand opens the voice; one
     touch and the standing room's landed transmission is read aloud
     by the male documentary narrator. */
  const toggleNarrator = useCallback(() => {
    if (narratorOpen) {
      closeNarrationGate();
      setNarratorOpen(false);
      return;
    }
    openNarrationGate();
    setNarratorOpen(true);
    const q = zoomQ;
    if (q && answer && answerLanded) {
      void speakRoomNarration(walkNodeId(q), answer, language);
    }
  }, [narratorOpen, zoomQ, answer, answerLanded, language]);

  /* THE NARRATOR'S EAR — the gate stands open and the room's words
     have landed (a live transmission, or a previous branch returned
     to from the trail): the voice rises by itself, room after room,
     for as long as the walk continues. During the stream the effect
     rests; once landed the words are final. */
  useEffect(() => {
    if (!narratorOpen || !answerLanded || !zoomQ || !answer) return;
    void speakRoomNarration(walkNodeId(zoomQ), answer, language);
  }, [narratorOpen, answerLanded, zoomQ, answer, language]);

  /* THE SEQUENTIAL REVELATION — four stages, keyed to the room. */
  const revealStage = useSequentialReveal(zoomQ ?? "", answerLanded);

  /* THE DROPDOWN — the branches of this transmission stand behind one
     quiet button, folded by default; the visitor drops them down when
     they wish to explore more. Each new room folds them again
     (render-time guarded reset, the official pattern). */
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [seenBranchQ, setSeenBranchQ] = useState<string | null>(null);
  {
    const q = zoom?.q ?? null;
    if (q !== seenBranchQ) {
      setSeenBranchQ(q);
      if (branchesOpen) setBranchesOpen(false);
    }
  }

  /* ------- THE TRANSMISSION LISTENS — the branch's own chat --------
     Inside the room the visitor speaks WITH the transmission: every
     word travels through the scope's own door and the answer lands
     beneath the transmission, the conversation of the branch kept
     inside the branch. THE ROOM'S OWN MEMORY — every room keeps its
     own thread for the whole visit: leave a room and return (through
     the trail, through the tree) and the mirror still remembers what
     was already said there — the conversation belongs to its own
     suggestion, and the walk's progression rides with every word. */
  const [thread, setThread] = useState<RoomTurn[]>([]);
  const [threadBusy, setThreadBusy] = useState(false);
  const threadRef = useRef<RoomTurn[]>([]);
  threadRef.current = thread;
  /* every room's own thread — kept while the visit lasts */
  const threadsRef = useRef<Map<string, RoomTurn[]>>(new Map());
  const [seenThreadRoom, setSeenThreadRoom] = useState<string | null>(null);
  if ((zoom?.q ?? null) !== seenThreadRoom) {
    /* the walk turns: the room's thread is kept, the next room's own
       thread — if this room was visited before — returns with it */
    if (seenThreadRoom !== null) {
      const kept = threadRef.current.filter((turn) => !turn.loading);
      if (kept.length > 0) threadsRef.current.set(seenThreadRoom, kept);
      else threadsRef.current.delete(seenThreadRoom);
    }
    setSeenThreadRoom(zoom?.q ?? null);
    const remembered = zoom?.q
      ? threadsRef.current.get(zoom.q)
      : undefined;
    setThread(remembered ? [...remembered] : []);
    if (threadBusy) setThreadBusy(false);
  }

  /* the room's words land safely even when the walk turns mid-flight:
     the standing room hears them at once, a room left behind keeps its
     answer inside its own remembered thread */
  const applyRoomTurn = useCallback(
    (roomQ: string, fn: (t: RoomTurn[]) => RoomTurn[]) => {
      if (zoomQRef.current === roomQ) setThread(fn);
      else {
        const cur = threadsRef.current.get(roomQ) ?? [];
        threadsRef.current.set(roomQ, fn(cur));
      }
    },
    []
  );

  const speakFromRoom = useCallback(
    async (text: string, attachments?: ChatAttachment[]) => {
      const q = text.trim();
      if (disabled || threadBusy || !q || !zoom) return;
      /* THE WISH TO SEE, SPOKEN IN A ROOM — the landing's rooms hear
         the wish in any phrasing too: the image crystallizes into the
         field's own thread (the room reads its last turn), no LLM
         round trip, the visitor's words its shape. */
      if (realm && isVisualIntent(q)) {
        zoomOpenedAtRef.current = Date.now();
        const lastReply =
          [...landingTurnsRef.current]
            .reverse()
            .find((t) => t.a.trim())?.a ?? "";
        setLandingThread((t) => [
          ...t,
          { q, a: "", loading: true, painting: true },
        ]);
        setThreadBusy(true);
        window.dispatchEvent(new CustomEvent("landing-chat:return"));
        try {
          const painted = await paintLandingTurn(
            blendVisualRequest(q, lastReply)
          );
          /* THE FIELD'S OWN KEEP — the finished exchange (its plate
             included) rests in the field's own cache and page */
          const kept = [
            ...landingTurnsRef.current,
            {
              q,
              a: "A vision, crystallized.",
              ...(painted.imageUrl
                ? {
                    imageUrl: painted.imageUrl,
                    imageTitle: painted.imageTitle,
                  }
                : {}),
            },
          ].slice(-12);
          landingTurnsRef.current = kept;
          writeLandingThreadScope(landingScope, kept);
        } finally {
          setThreadBusy(false);
        }
        return;
      }
      /* THE MAKING'S OWN ROOM — a follow-up that asks for a MAKING (a
         painting, a woven book, a song, a record, a ritual) never
         speaks as plain words: it opens its own conversation room and
         rides the channel like every ask, and the creation rises
         inline beneath it — the chat is the workshop now, in every
         room, without ever walking to a working room. (The landing's
         chat keeps its own law: the free floor answers in words.) */
      if (!realm && (detectArtifactIntent(q) !== null || isVisualIntent(q))) {
        zoomOpenedAtRef.current = Date.now();
        setZoom({ q, move: null });
        onPick(q, askScopeFor(q), attachments);
        return;
      }
      const roomQ = zoom.q;
      if (realm) {
        /* THE SEND'S OWN RETURN — the threshold brings its chat back to
           the eye once the room's whisper has left (the keyboard's fold
           never leaves the glass half-off the screen) */
        window.dispatchEvent(new CustomEvent("landing-chat:return"));
      }
      /* THE FAMILY'S VOICE — the room speaks through the door of the
         family its own whisper was grown from (the manifest room as
         the manifest, the atelier room as the atelier); a whisper the
         grove doesn't know keeps the channel's own door. THE LANDING'S
         OWN LAW — in the landing's chat the room's conversation stays
         the standing field's own voice: the Mirror as the mirror of
         the Absolute, the family fields through their own channels —
         each field's own language, its own censor or openness. */
      const famKey = familyKeyByText.get(roomQ.toLowerCase());
      const roomCategory: BranchId =
        TREE_FAMILIES.find((f) => f.key === famKey)?.category ?? category;
      /* THE FIELD'S OWN MEMORY — in the landing's chat the room's
         follow-ups carry the WHOLE conversation of THIS field (every
         floor ask and every room answer, across rooms); each scope's
         memory is its own; the full portal's rooms keep their own
         thread only. */
      const prior = realm
        ? landingTurnsRef.current.slice(-8)
        : threadRef.current
            .filter((turn) => turn.a && !turn.failed)
            .map(({ q: tq, a: ta }) => ({ q: tq, a: ta }));
      /* THE WALK'S PROGRESSION — every whisper pressed before this one
         rides with the words: the mirror knows the road, not just the
         room (the respective suggestion's own transmission opens the
         thread; the walk that led here walks beside it). */
      const walk = lineage.map((l) => l.text).slice(-8);
      setThread((t) => [...t, { q, a: "", loading: true }]);
      setThreadBusy(true);
      try {
        const { text: reply } = await speakWithTransmission(
          realm
            ? (LANDING_SCOPE_CATEGORY[landingScope] ??
                ("absolute" as const))
            : roomCategory,
          q,
          roomQ,
          answer || "",
          prior,
          language,
          walk,
          attachments
        );
        applyRoomTurn(roomQ, (t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? {
                  ...turn,
                  a: reply,
                  loading: false,
                }
              : turn
          )
        );
        /* THE CONSENT LAW — the room's reply is words only: no painting
           rises from the mirror's own initiative. The atelier wakes at
           the visitor's own typed ask or a Crystallize press. */
        /* THE FIELD'S OWN MEMORY — the room's answer joins this
           field's own conversation, so the next room remembers it too;
           the cache and the sessionStorage page and the library's
           shelf all carry the field's own mark */
        if (realm) {
          landingTurnsRef.current = [
            ...landingTurnsRef.current,
            { q, a: reply },
          ].slice(-12);
          /* THE FIELD'S OWN KEEP — the finished exchange rests in the
             field's own cache and page, for this visit only */
          const kept = landingTurnsRef.current;
          landingThreadsByScopeRef.current.set(
            landingScope,
            landingThreadRef.current
          );
          writeLandingThreadScope(landingScope, kept);
          void saveLandingToLibrary(landingScope, kept);
          setHistoryEntries(
            upsertLandingHistory({
              id: historySessionRef.current,
              at: Date.now(),
              title: kept[0]?.q ?? q,
              turns: kept.slice(-LANDING_HISTORY_TURNS),
              scope: landingScope,
            })
          );
        }
      } catch (err) {
        applyRoomTurn(roomQ, (t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? {
                  ...turn,
                  loading: false,
                  failed: true,
                  errMessage:
                    err instanceof Error && err.message ? err.message : "",
                  energy: err instanceof EnergyError,
                }
              : turn
          )
        );
      } finally {
        if (zoomQRef.current === roomQ) setThreadBusy(false);
      }
    },
    [
      answer,
      applyRoomTurn,
      askScopeFor,
      realm,
      category,
      disabled,
      familyKeyByText,
      language,
      lineage,
      landingScope,
      onPick,
      threadBusy,
      zoom,
    ]
  );

  /* THE TRANSMISSION'S OWN BEGINNING — a new turn never yanks the eye
     to the bottom of the room: the view rises to the new transmission's
     first word (the visitor's own question standing at the top of the
     glass), and the answer grows beneath it — the visitor reads down
     by their own hand, never dragged. */
  useEffect(() => {
    if (thread.length === 0) return;
    const el = bodyRef.current;
    if (!el || !pinnedRef.current) return;
    const turns = el.querySelectorAll<HTMLElement>("[data-room-turn]");
    const last = turns.length > 0 ? turns[turns.length - 1] : null;
    if (!last) {
      el.scrollTop = el.scrollHeight;
      return;
    }
    const eyeTop = el.getBoundingClientRect().top;
    const turnTop = last.getBoundingClientRect().top;
    el.scrollTop += turnTop - eyeTop - 10;
  }, [thread]);

  /* THE ONE CHAT IN BOTH GEARS — the visitor's word is law: zooming
     the chat bigger must never begin a new chat. The room, the thread
     and the standing field's whole conversation stand exactly as they
     were through the crossing — the same words, only more room to
     read them in. (The old border that folded the landing's room at
     the crossing is gone: the gears are sizes, not two houses.) */

  /* EVERY FIELD'S OWN RETURN — the two keeps of the standing scope:
     ① THE VISIT'S OWN WAKE — the page's first breath hydrates the
     standing field's own conversation from its sessionStorage page,
     so a visitor who comes back finds their chat standing (and the
     room rises with the words, exactly where the field was left);
     ② THE SWITCH — leaving a field shelves its thread, its carried
     memory, its follow-ups and its history page under its own key;
     waking the chosen field lifts exactly that field's own keep, its
     room rising with its own last words. No field ever sees another
     field's words. */
  const prevLandingScopeRef = useRef(landingScope);
  useEffect(() => {
    /* ① — once, at the visit's first breath: the standing field's
       own words wake from their page (the room rises with them) */
    const scope = prevLandingScopeRef.current;
    const remembered = readLandingThreadScope(scope);
    if (remembered.length > 0) {
      landingTurnsRef.current = remembered;
      landingTurnsByScopeRef.current.set(scope, remembered);
      const restored = remembered.map((t) => ({
        q: t.q,
        a: t.a,
        loading: false,
        /* the plates return with the words — the keep carries the
           painting's address, the house serves the file itself */
        imageUrl: t.imageUrl,
        imageTitle: t.imageTitle,
      }));
      landingThreadsByScopeRef.current.set(scope, restored);
      setLandingThread(restored);
      /* the room rises with the field's own last words — a visitor
         who comes back finds their chat standing where they left it */
      const last = remembered[remembered.length - 1];
      setZoom({ q: last.q, move: null });
    }
    const sessionId = historySessionsByScopeRef.current.get(scope);
    if (!sessionId) {
      historySessionsByScopeRef.current.set(scope, freshHistorySessionId());
    }
  }, []);
  useEffect(() => {
    if (prevLandingScopeRef.current === landingScope) return;
    const prev = prevLandingScopeRef.current;
    prevLandingScopeRef.current = landingScope;
    /* the field the visitor leaves — its whole keep shelved whole */
    landingThreadsByScopeRef.current.set(prev, landingThreadRef.current);
    landingTurnsByScopeRef.current.set(prev, landingTurnsRef.current);
    historySessionsByScopeRef.current.set(prev, historySessionRef.current);
    /* the chosen field's own keep — lifted exactly as it stood (and
       when the visit's page is fresh, the field's sessionStorage page
       rebuilds the visible thread from its own remembered turns) */
    const turns =
      landingTurnsByScopeRef.current.get(landingScope) ??
      readLandingThreadScope(landingScope);
    const cachedThread = landingThreadsByScopeRef.current.get(landingScope);
    const thread =
      cachedThread && cachedThread.length > 0
        ? cachedThread
        : turns.map((t) => ({ q: t.q, a: t.a, loading: false }));
    landingTurnsRef.current = turns;
    landingThreadsByScopeRef.current.set(landingScope, thread);
    historySessionRef.current =
      historySessionsByScopeRef.current.get(landingScope) ??
      freshHistorySessionId();
    historySessionsByScopeRef.current.set(
      landingScope,
      historySessionRef.current
    );
    setLandingThread(thread);
    setThread([]);
    setThreadBusy(false);
    if (thread.length > 0) {
      /* the field's own room rises with its own last words */
      const last = thread[thread.length - 1];
      setZoom({ q: last.q, move: null });
    } else {
      setZoom(null);
    }
    window.dispatchEvent(new CustomEvent("landing-chat:return"));
  }, [landingScope]);

  /* the room's own reply — now the conversation with the transmission
     (the walk continues from the branches dropdown above it) */
  const sendReplyFromPanel = useCallback(
    (text: string, attachments?: ChatAttachment[]) => {
      void speakFromRoom(text, attachments);
    },
    [speakFromRoom]
  );

  /* THE FLOOR'S OWN DRAFT — the realm's whisper line keeps its words
     while the visitor thinks; one send and the room rises with them. */
  const [askDraft, setAskDraft] = useState("");
  /* THE FLOOR'S OWN SEED — a door from the threshold may hand the floor
     its first words (the image door's inviting stem): the seed is
     taken once, the draft wears it, and the seed is spent. */
  const floorSeed = useMirror((s) => s.floorSeed);
  useEffect(() => {
    if (floorSeed) {
      setAskDraft(floorSeed);
      useMirror.getState().takeFloorSeed();
    }
  }, [floorSeed]);
  /* THE BRIDGE'S OWN CARRY — a workspace's advisor may hand its advice
     to the floor: the newest carried draft wears the whisper line and
     the stamp is spent at once (the same law as the seed: taken once,
     the draft wears it, the carry is spent). The Mirror advises; the
     visitor's own hand sends it. */
  const bridgeCarry = useMirror((s) => s.bridgeDraft);
  useEffect(() => {
    if (bridgeCarry) {
      setAskDraft(bridgeCarry.text);
      useMirror.getState().consumeBridgeDraft();
    }
  }, [bridgeCarry]);
  /* THE FLOOR'S OWN CARGO — the paperclip and the camera's eye for the
     realm's own whisper line (one image, three documents) */
  const [askAtts, setAskAtts] = useState<ChatAttachment[]>([]);
  /* THE VISITOR'S OWN STYLE — the image look chosen through the "/"
     hand; every crystallization on this floor wears it. */
  const visualStyle = useMirror((s) => s.visualStyle);
  const setVisualStyle = useMirror((s) => s.setVisualStyle);
  /* THE DEEP READING — the landing chat's own image zoom room */
  const [landingViewing, setLandingViewing] = useState<{
    src: string;
    caption: string;
  } | null>(null);
  /* THE "/" HAND — the style picker opens while the whisper line
     carries only the slash (and what the visitor typed after it) */
  const askStyleMenuOpen = isStyleSlashQuery(askDraft);

  /* THE CATEGORY'S OWN CALL — every scope's chat carries its own
     direct line: the room calls the presence its whisper was grown
     from (the manifest room the OS, the quantum room the narrator,
     the invent room the forge); the floor calls the focused
     category's presence; the general floor keeps the standing
     channel's own presence. */
  const [liveCallScope, setLiveCallScope] = useState<LiveScopeKey | null>(null);
  const zoomFamKey = zoom
    ? familyKeyByText.get(zoom.q.toLowerCase())
    : undefined;
  const roomLiveScope: LiveScopeKey =
    (zoomFamKey
      ? LIVE_SCOPE_BY_CATEGORY[
          TREE_FAMILIES.find((f) => f.key === zoomFamKey)?.category ?? ""
        ]
      : undefined) ??
    LIVE_SCOPE_BY_CATEGORY[category] ??
    "interplanetary";
  /* THE STANDING FIELD'S OWN PRESENCE — in the landing's chat the
     floor's own line and its small attendants wear the standing
     scope's channel (the Mirror keeps the house's standing one); the
     full portal keeps its focused category's presence. */
  const landingFamilyLive: LiveScopeKey | undefined =
    landingScope !== "mirror"
      ? LIVE_SCOPE_BY_CATEGORY[
          LANDING_SCOPE_CATEGORY[landingScope] ?? ""
        ]
      : undefined;
  const floorLiveScope: LiveScopeKey =
    landingFamilyLive ??
    (focusKey !== "general"
      ? LIVE_SCOPE_BY_CATEGORY[
          TREE_FAMILIES.find((f) => f.key === focusKey)?.category ?? ""
        ]
      : undefined) ??
    LIVE_SCOPE_BY_CATEGORY[category] ??
    "interplanetary";

  /* ------------- THE CATEGORY TIMELINE — the walk's own memory --------
     Every category keeps its own standing tree in the room's memory
     (never on the phone). THE JUMP: the visitor chooses another
     category — the tree they leave is laid on the shelf, the other
     category's tree is lifted back exactly as it stood (the last
     suggestions and the branch of the walk are never lost). THE NEW
     CHAT LAW — a chosen category begins a NEW conversation: the room
     folds, every room's thread rests, and the channel returns to its
     quiet origin (the old words already rest on the archive's shelf).
     While a restored tree stands, the regrow rests too. */
  const timelineRef = useRef<Map<string, CanopyTimeline>>(new Map());
  const prevFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const prev = prevFocusRef.current;
    if (prev === null) {
      prevFocusRef.current = focusKey;
      return;
    }
    if (prev === focusKey) return;
    prevFocusRef.current = focusKey;
    /* the tree the visitor leaves behind — laid on the room's shelf */
    if (topologies.length > 0) {
      timelineRef.current.set(prev, {
        topologies,
        spent: [...spent],
        lineage,
        pickedId,
        maxLevel,
        revealed,
        salt,
      });
    } else {
      timelineRef.current.delete(prev);
    }
    /* THE NEW CHAT — the conversation begins again with the category:
       the old words rest on the archive's own shelf (the ChatGPT turn),
       the channel opens a fresh page, and every room's thread rests. */
    if (!disabled) {
      threadsRef.current.clear();
      setThread([]);
      setThreadBusy(false);
      setZoom(null);
      setAskDraft("");
      setBranchesOpen(false);
      useMirror.getState().newChat(useMirror.getState().activeMode);
    }
    /* the other category's own tree — lifted back up as it stood */
    const snap = timelineRef.current.get(focusKey);
    if (snap && snap.topologies.length > 0) {
      setTopologies(snap.topologies);
      setSpent(new Set(snap.spent));
      setLineage(snap.lineage);
      setPickedId(snap.pickedId);
      setMaxLevel(snap.maxLevel);
      setRevealed(snap.revealed);
      setSalt(snap.salt);
      panReqRef.current = null;
      prevSize.current = { w: 0, h: 0 }; /* the view returns to the trunk */
      suppressRegrowRef.current = true; /* the timeline rests */
    } else {
      suppressRegrowRef.current = false; /* a fresh grove may grow */
    }
  }, [focusKey, mounted, disabled, topologies, spent, lineage, pickedId, maxLevel, revealed, salt]);

  if (!mounted) return null;

  /* ---------------- the rendered family -----------------------------
     The whole drawn family lives in the memoized TreeCanvas — while
     the answer streams or the visitor types, that layer stands still. */
  const batchCount = topologies.length;
  const ZoomIcon = zoom?.move ? (MOVEMENT_ICONS[zoom.move] ?? Layers) : Layers;
  /* the narrator's own ear, resolved for the standing room */
  const narrMine =
    zoomQ !== null && narration.roomId === walkNodeId(zoomQ);
  const narrLoading = narrMine && narration.state === "loading";
  const narrPlaying = narrMine && narration.state === "playing";

  return (
    <div
      data-testid={testIdPrefix}
      aria-hidden={!shown}
      className={cn(
        "realm-crystal absolute inset-0 z-20 flex min-h-0 flex-col transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        shown
          ? cn(
              "translate-y-0 opacity-100",
              /* THE PASS-THROUGH — docked in the threshold (bare) the
                 realm keeps no pointer surface of its own: touches that
                 are not text and not a hand fall through the lens into
                 the page, so the threshold scrolls on beneath it. */
              !bare && "pointer-events-auto"
            )
          : "pointer-events-none translate-y-2 opacity-0"
      )}
      style={
        focusFamily
          ? ({ "--scope-a": focusFamily.accent } as CSSProperties)
          : undefined
      }
    >
      {/* ---------------------------- header ---------------------------
          THE COMPASS — the whole house's steering, one calm row. THE
          MENU carries where the walk stands (the compass, the depth,
          the trail of steps and the recalibrating hand) behind one
          quiet button. THE KATEGORIES: every family of the walk — the
          world's own spirit woven into its row — stands behind one
          clean dropdown; a chosen category focuses the walk on that
          nature, and every room speaks with that world's voice. The
          mix of worlds rests in the settings, inside the profile. */}
      <div className="relative shrink-0">
        <div
          className={cn(
            /* THE UNCROWNED DROPDOWNS — every dropdown the crown
               carries (the realm's own hands and the pages' menus
               alike) must breathe beyond the row: no max height, no
               hidden overflow ever again — the fold that demanded the
               clipping is gone, and the tools and scopes now drop
               down whole, in plain sight. THE QUIET CROWN — the old
               transition-all (a vestige of the gone fold) watched
               every property on the crown's own row; nothing animates
               here any more, so the watcher is gone too. */
            "overflow-visible"
          )}
       >
      <div
        className={cn(
          "shrink-0 bg-background/85 px-3 pb-1 sm:px-5",
          !realm && "pt-10 md:pt-1.5"
        )}
        style={
          realm
            ? { paddingTop: "max(0.5rem, env(safe-area-inset-top))" }
            : undefined
        }
      >
        <div
          className="mx-auto flex w-full max-w-[760px] items-center gap-1.5"
        >
          {/* THE CROWN'S OWN ROW — the theme pages' and the threshold's
              quiet crown. THE REALM ITSELF no longer wears this row:
              the minimal top control (◈ Mirror · Search · Menu) carries
              the whole walk's steering, and the canvas keeps the sky. */}
          <div className="contents">
          {/* THE LANDING'S QUIET CROWN — docked in the threshold the
              crown keeps only its calm doors: the walk's menu and the
              categories' mix stand down (no scope ever rules the
              landing's floor), and the akashic and book doors wait for
              the full portal. The light, the about door, the crossing
              and the passage remain. */}
          {!realm && (<>
          {/* THE MENU — where the walk stands, behind one quiet button:
              the compass, the depth, every step of the trail (one
              touch returns the tree to that step) and the quiet
              recalibrating hand */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCrownMenu((m) => (m === "menu" ? null : "menu"))}
              aria-expanded={crownMenu === "menu"}
              aria-label={t("Where the walk stands")}
              title={t("Where the walk stands")}
              data-testid={`${testIdPrefix}-menu`}
              className={cn(
                "focus-glow flex size-7 items-center justify-center rounded-full border transition-all duration-300",
                crownMenu === "menu"
                  ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                  : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
              )}
            >
              <Menu className="size-3" aria-hidden="true" />
            </button>
            {crownMenu === "menu" && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-30"
                  onClick={() => setCrownMenu(null)}
                />
                <div
                  data-testid={`${testIdPrefix}-menu-panel`}
                  className="nice-scroll absolute left-0 top-9 z-40 max-h-[78vh] w-[286px] max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-2xl border bg-background p-3 lift-lg"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                  }}
                >
                  {/* where the walk stands */}
                  <div
                    data-testid={`${testIdPrefix}-where`}
                    className="flex items-center gap-2 rounded-xl px-2 py-2"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, transparent)",
                    }}
                  >
                    <Compass
                      className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                      aria-hidden="true"
                    />
                    <span className="mono-label min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-foreground/85">
                      {mixTitle(mix, t)}
                    </span>
                    <span
                      className="mono-label shrink-0 text-[10px] tabular-nums text-muted-foreground/70"
                      aria-hidden="true"
                    >
                      ·{lineage.length}
                    </span>
                  </div>
                  {/* the trail of the walk */}
                  {lineage.length > 0 && (
                    <div
                      data-testid={`${testIdPrefix}-trail`}
                      className="mt-2 flex flex-col"
                    >
                      <p className="mono-label px-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                        {t("Your walk")}
                      </p>
                      {[...lineage].map((l, i) => {
                        const latest = i === lineage.length - 1;
                        return (
                          <button
                            key={`${l.text}-${i}`}
                            type="button"
                            onClick={() => {
                              walkBack(l);
                              setCrownMenu(null);
                            }}
                            aria-label={`${t("Return to")}: ${l.text}`}
                            title={l.text}
                            className={cn(
                              "focus-glow flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                              latest && "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mono-label w-4 shrink-0 text-[9px] tabular-nums",
                                latest
                                  ? "text-[var(--scope-a,var(--gd))]"
                                  : "text-muted-foreground/50"
                              )}
                            >
                              {i + 1}
                            </span>
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[13px]",
                                latest
                                  ? "font-medium text-[var(--scope-a,var(--gd))]"
                                  : "text-foreground/85"
                              )}
                            >
                              {l.text}
                            </span>
                            {latest && (
                              <span className="mono-label shrink-0 animate-pulse text-[8.5px] uppercase tracking-[0.16em] text-[var(--scope-a,var(--gd))]">
                                {t("You are here")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* THE WALK'S LEDGER — the history saver: everything
                      the visitor kept, one touch from here. The kept
                      volumes return to the reading; the saved
                      conversations open in their own rooms; the
                      journey's steps stay as the map of the walk. */}
                  {walkLedger &&
                    (walkLedger.volumes.length > 0 ||
                      walkLedger.chats.length > 0 ||
                      walkLedger.journey.length > 0) && (
                    <div data-testid={`${testIdPrefix}-ledger`} className="mt-1.5">
                      <p className="mono-label px-2 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60">
                        {t("The walk's ledger")}
                      </p>
                      {walkLedger.volumes.length > 0 && (
                        <div data-testid={`${testIdPrefix}-ledger-books`}>
                          <p className="px-2 pb-0.5 text-[11px] italic text-muted-foreground/70">
                            {t("Kept volumes")}
                          </p>
                          {walkLedger.volumes.slice(0, 4).map((v) => (
                            <button
                              key={v.bookId}
                              type="button"
                              onClick={() => {
                                resumeKeptVolume({
                                  bookId: v.bookId,
                                  config: v.config,
                                  meta: {
                                    title: v.title,
                                    subtitle: v.subtitle,
                                    sigil: v.sigil,
                                    axiom: v.axiom,
                                    dedication: v.dedication ?? "",
                                    totalPages:
                                      v.totalPages ||
                                      Math.max(8, v.pages.length + 8),
                                  },
                                  pages: v.pages,
                                  threads: v.threads,
                                  ended: v.ended,
                                });
                                setCrownMenu(null);
                              }}
                              aria-label={`${t("Read again")}: ${v.title}`}
                              title={v.title}
                              data-testid={`${testIdPrefix}-ledger-book`}
                              className="focus-glow flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                            >
                              <BookOpen
                                className="size-3 shrink-0 text-muted-foreground/70"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/85">
                                {v.title}
                              </span>
                              <span className="mono-label shrink-0 text-[9px] tabular-nums text-muted-foreground/60">
                                {v.pages.length}/{v.totalPages}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {walkLedger.chats.length > 0 && (
                        <div
                          data-testid={`${testIdPrefix}-ledger-chats`}
                          className="mt-1.5"
                        >
                          <p className="px-2 pb-0.5 text-[11px] italic text-muted-foreground/70">
                            {t("Saved conversations")}
                          </p>
                          {walkLedger.chats.slice(0, 6).map((c) => (
                            <button
                              key={`${c.surface}-${c.id}`}
                              type="button"
                              onClick={() => {
                                openChatSurface(c.surface, c.id);
                                setCrownMenu(null);
                              }}
                              aria-label={`${t("Open")}: ${c.title}`}
                              title={c.title}
                              data-testid={`${testIdPrefix}-ledger-chat`}
                              className="focus-glow flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                            >
                              <NotebookPen
                                className="size-3 shrink-0 text-muted-foreground/70"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/85">
                                {c.title}
                              </span>
                              <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                                {c.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {walkLedger.journey.length > 0 && (
                        <div
                          data-testid={`${testIdPrefix}-ledger-journey`}
                          className="mt-1.5"
                        >
                          <p className="px-2 pb-0.5 text-[11px] italic text-muted-foreground/70">
                            {t("The journey kept")}
                          </p>
                          {walkLedger.journey.slice(0, 5).map((j, i) => (
                            <div
                              key={`${j.at}-${i}`}
                              className="flex items-center gap-2 px-2 py-1"
                            >
                              <span
                                aria-hidden="true"
                                className="mono-label w-14 shrink-0 text-[9px] tabular-nums text-muted-foreground/50"
                              >
                                {new Date(j.at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground/85">
                                {j.b}
                                {j.s ? ` · ${j.s}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* the quiet hand — the field returns to origin */}
                  <span
                    aria-hidden="true"
                    className="mx-1 mt-2 block h-px bg-[var(--hairline)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetField();
                      setCrownMenu(null);
                      import("sonner").then(({ toast }) =>
                        toast.success(t("Field recalibrated"), {
                          description: t(
                            "All scopes returned to origin. Free will honored always."
                          ),
                        })
                      );
                    }}
                    aria-label={t("Recalibrate the field")}
                    title={t("Recalibrate the field")}
                    data-testid={`${testIdPrefix}-door-recalibrate`}
                    className="focus-glow mt-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                  >
                    <RotateCcw
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground/90">
                      {t("Recalibrate the field")}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* THE KATEGORIES — every family of the walk behind one clean
              dropdown: General (the whole house, mixed) and the seven
              lights, each with its own share of the house, one touch
              weaving it in or out */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                setCrownMenu((m) => (m === "cats" ? null : "cats"))
              }
              aria-expanded={crownMenu === "cats"}
              aria-label={t("The categories of the house")}
              title={t("The categories of the house")}
              data-testid={`${testIdPrefix}-cats`}
              className={cn(
                "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300",
                crownMenu === "cats"
                  ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                  : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
              )}
            >
              <ListTree className="size-3" aria-hidden="true" />
              <span
                className={cn(
                  "mono-label whitespace-nowrap text-[10px] uppercase tracking-[0.14em]",
                  realm && "hidden sm:inline"
                )}
              >
                {t("Categories")}
              </span>
              <ChevronDown
                className={cn(
                  "size-2.5 transition-transform duration-300",
                  crownMenu === "cats" && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            {crownMenu === "cats" && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-30"
                  onClick={() => setCrownMenu(null)}
                />
                <div
                  data-testid={`${testIdPrefix}-cats-panel`}
                  className="absolute left-0 top-9 z-40 w-[286px] max-w-[calc(100vw-2.5rem)] rounded-2xl border bg-background p-3 lift-lg"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                  }}
                >
                  <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("The categories of the house")}
                  </p>
                  <div className="mt-2 flex flex-col">
                    {/* GENERAL — the whole house in even voices */}
                    <button
                      type="button"
                      onClick={() => {
                        /* the pick itself closes the dropdown — the
                            visitor never clicks twice to walk on */
                        setCrownMenu(null);
                        /* already the whole house — the walk rests */
                        if (mixIsGeneral(mix)) return;
                        applyMix({ on: allFamilyKeys(), weights: evenWeights() });
                      }}
                      aria-pressed={mixIsGeneral(mix)}
                      title={t("The whole house, mixed")}
                      data-testid={`${testIdPrefix}-family-general`}
                      className={cn(
                        "focus-glow flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]",
                        mixIsGeneral(mix) &&
                          "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                      )}
                    >
                      <ListTree
                        className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-foreground">
                          {t("General")}
                        </span>
                        <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                          {t("The whole house, mixed")}
                        </span>
                      </span>
                      {mixIsGeneral(mix) && (
                        <span className="mono-label shrink-0 text-[9.5px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                          {t("Even voices")}
                        </span>
                      )}
                    </button>
                    <span
                      aria-hidden="true"
                      className="mx-1 my-1 h-px bg-[var(--hairline)]"
                    />
                    {TREE_FAMILIES.map((f) => {
                      const share = familyShare(mix, f.key);
                      const focused =
                        mix.on.length === 1 &&
                        mix.on.includes(f.key) &&
                        share.on;
                      const spirit = FAMILY_SPIRITS[f.key];
                      const SpiritIcon = spirit?.icon ?? Layers;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            /* THE FOCUS LAW — one touch on a category
                               focuses the whole walk on that nature: the
                               tree grows its branches and every room
                               speaks with that world's own voice.
                               THE FOLDING LAW — the dropdown folds
                               itself the moment a kategory is chosen,
                               so the walk continues in one touch. */
                            setCrownMenu(null);
                            if (focused) return;
                            applyMix({ on: [f.key], weights: { [f.key]: 1 } });
                            /* THE QUIET FOCUS — no toast, no bar: the tree
                               itself answers — it regrows focused on the
                               chosen nature in one smooth breath. */
                          }}
                          aria-pressed={focused}
                          title={t(familyLabelKeys[f.key] ?? f.key)}
                          data-testid={`${testIdPrefix}-family-${f.key}`}
                          className={cn(
                            "focus-glow flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                            focused &&
                              "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${f.accent} 12%, transparent)`,
                            }}
                          >
                            <SpiritIcon
                              className="size-3"
                              style={{ color: f.accent, opacity: share.on ? 1 : 0.55 }}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[13.5px] text-foreground/90">
                                {t(familyLabelKeys[f.key] ?? f.key)}
                              </span>
                              {share.on && share.pct !== 100 && (
                                <span
                                  className="mono-label shrink-0 text-[10px] tabular-nums"
                                  style={{ color: f.accent }}
                                >
                                  {share.pct}%
                                </span>
                              )}
                              {focused && (
                                <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                                  {t("You are here")}
                                </span>
                              )}
                            </span>
                            <span className="mono-label mt-0.5 block truncate text-[9.5px] normal-case tracking-[0.02em] text-muted-foreground/70">
                              {t(spirit?.spirit ?? f.key)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p
                    className="mt-2.5 border-t px-1 pt-2 text-[11.5px] italic leading-relaxed text-muted-foreground/75"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--hairline) 70%, transparent)",
                    }}
                  >
                    {t(
                      "The mix of worlds rests in the settings, inside your profile."
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
          </>) }
          </div>

          {/* THE VISITOR'S OWN MARK — the profile icon stands at the
              crown's very BEGINNING, before the light's toggle: an icon
              (never a pill), the same in both gears, opening the
              visitor's own room within the frame. */}
          {realm && <CrownProfileIcon testIdPrefix={testIdPrefix} />}

          {/* THE LIGHT'S OWN HAND HAS MOVED INDOORS — at the visitor's
              word the crown carries only the profile, the making rooms
              and the scopes; the sun/moon now lives inside the
              visitor's own room (the profile — the purse's panel), one
              touch from anywhere. */}

          <div className="contents">
          {/* THE DOORS OF THE HOUSE — akashic · book · about, standing
              in the very top row: quiet ways from the walk into the
              house's own rooms. THE MIDDLE PROFILE BUTTON IS GONE — the
              exit arrow that mirrored the passage's own sign has left
              the crown; the passage at the far right already opens the
              door (signed-in walkers leave from its account room, and
              guests are shown the way in there). */}
          <div className="flex shrink-0 items-center gap-1">
            {/* the advanced doors wait for the full portal — the landing
                keeps the calm crown (the about door too: the threshold
                already tells the house's story) */}
            {!realm && (
            <button
              type="button"
              onClick={() => openAkashic()}
              aria-label={t("Akashic")}
              title={t("Akashic")}
              data-testid={`${testIdPrefix}-door-akashic`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ScrollText className="size-3" aria-hidden="true" />
            </button>
            )}
            {!realm && (
            <button
              type="button"
              onClick={() => openDreamBook()}
              aria-label={t("Book")}
              title={t("Book")}
              data-testid={`${testIdPrefix}-door-book`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <BookOpen className="size-3" aria-hidden="true" />
            </button>
            )}
            {/* THE REGISTER HAS LEFT THE CROWN — the codex door (the
                Fingerprint that once stood between the profile and the
                scopes) is gone from the top of the chat for good: the
                codex lives at the scopes' shore and inside the codex
                hall itself. Nothing of the register remains at the top
                of the chat where InDream and Scopes stand. */}
            {!realm && (
            <button
              type="button"
              onClick={() => openLightCodes()}
              aria-label={t("Music")}
              title={t("Music — sound transmissions through Mirror Entity")}
              data-testid={`${testIdPrefix}-door-music`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <Music className="size-3" aria-hidden="true" />
            </button>
            )}
            {/* THE ABOUT DOOR HAS MOVED HOME — it left the house doors:
                About Us now wears its own question mark at the crown's
                very top right, alone in its circle. */}
          </div>

          {/* THE PORTAL'S OWN HANDS — between the about door and the
              passage: the fullscreen hand while the portal is docked,
              the landing hand while it fills the screen. One place,
              one law: the crown always carries the way across. */}
          {realm && realmControls && (
            <div className="flex shrink-0 items-center gap-1">{realmControls}</div>
          )}

          {/* THE WORLDS ARE GONE — their spirit lives inside the
              categories: a chosen kategory focuses the walk on that
              nature, and every room speaks with that world's voice. */}

          <div className={cn(
            "flex min-w-0 flex-1 items-center justify-end gap-1.5",
            /* the vertical arm owns the corner — the row yields its
               width so no crown button ever slides beneath it */
            realm && "pr-14 sm:pr-14"
          )}>
            {headerExtra && (
              <div className="hidden items-center gap-1.5 sm:flex">{headerExtra}</div>
            )}
            {!realm && <ExpansionRing />}
            {!realm && (
              <>
                <button
                  type="button"
                  onClick={renew}
                  disabled={disabled}
                  aria-label={t("New branches")}
                  title={t("New branches")}
                  data-testid={`${testIdPrefix}-renew`}
                  className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw className="size-3" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("Hide the branches")}
                  title={t("Hide the branches")}
                  data-testid={`${testIdPrefix}-close`}
                  className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </>
            )}
            {/* THE WEBSITE'S OWN QUESTION — About Us stands at the very
                top right of the house, in every gear (landing and
                realm, phone and desk): a question mark in its own
                circle, one touch from the eight-slide welcome. */}
            {/* THE CROWN'S CORNER CLUSTER — the light's own hand stands
                beside the question: the website's very top right holds
                the sun/moon and the About circle together, on every
                device, in both gears. THE MARKET HAS LEFT THE HOUSE —
                the violet gem is gone, the hall closed for good. */}
            <CrownLightHand testIdPrefix={testIdPrefix} />
            <button
              type="button"
              onClick={() => useMirror.getState().openTour()}
              aria-haspopup="dialog"
              aria-label={t("About Us")}
              title={t("About Us — our purpose, the Mirror Entity, and how we hold your data")}
              data-testid={`${testIdPrefix}-about-question`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <CircleQuestionMark className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          </div>
        </div>

        {/* THE SECOND ROW IS GONE — the doors of the house (akashic ·
            book · about · exit) ride the very top row now, and the
            passage stands at the top row's extreme right: one calm
            compass, no second rank beneath it. */}
      </div>
        </div>
        {realm && (onExpand || onMinimize) && (
          /* THE CORNER'S OWN GEAR HAND — the hide-the-chat arrow is
             gone for good; the corner now carries the way across
             instead: docked, it grows the chat to the whole screen
             (the fullscreen hand); fullscreen, the very same corner
             carries the way back to the landing slot. One corner, one
             hand, no folding of the conversation — during the
             opening's tunnel breath neither hand stands (neither
             callback is worn), the crossing covers everything. */
          <button
            type="button"
            onClick={onExpand ?? onMinimize}
            aria-label={t(onExpand ? "Fullscreen" : "Landing")}
            title={t(onExpand ? "Fullscreen" : "Landing")}
            data-testid={
              onExpand
                ? `${testIdPrefix}-corner-expand`
                : `${testIdPrefix}-corner-landing`
            }
            className="focus-glow absolute z-40 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-[0_8px_22px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            style={{
              top: "max(0.5rem, env(safe-area-inset-top))",
              right: "max(0.75rem, env(safe-area-inset-right))",
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
            }}
          >
            {onExpand ? (
              <Maximize2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Minimize2 className="size-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

        {/* --------------------- the walkable family --------------------- */}
      <div className="relative min-h-0 flex-1">
        {/* THE CENTRE IS CLEAR — the house's logo no longer stands at
            the heart of the realm: it lives nowhere now — the mark has
            left the crown too. The theme pages keep the genealogy tree. */}
        {realm ? (
          /* THE BARE FLOOR — the miniature portal's quiet ground: the
             focused family's own light breathing behind the mark; the
             whisper line below does the speaking. */
          <div
            data-testid={`${testIdPrefix}-bare-floor`}
            className="absolute inset-0 overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div
                className="h-64 w-72 rounded-full"
                style={{
                  /* THE CRYSTAL'S OWN AURA — every field breathes with
                     its own TWO lights: the standing scope's accent
                     and its companion color (the pair rides the lens
                     as --scope-a/--scope-b from the registry's one
                     truth; the fallbacks keep the Mirror's own gold
                     and sky). No two fields share an atmosphere.
                     THE STILL AURA — the breath animation is gone:
                     a 288px glow scaling forever behind the chat was
                     a constant paint tax on every device (the lag
                     the visitor felt); the still light costs nothing. */
                  background:
                    "radial-gradient(ellipse at center, color-mix(in srgb, var(--landing-scope-accent, #d8b571) 16%, transparent), color-mix(in srgb, var(--scope-b, #7dd3fc) 11%, transparent) 45%, transparent 70%)",
                }}
              />
            </div>
            {/* THE WHOLE MARK STANDS — the quiet floor's column scrolls
                when the window runs short: the column centers when it
                fits and scrolls from its own top when it doesn't, so
                the house's seal is never clipped away by a small
                height. At the scroll's edges the breath chains to the
                threshold beneath (the pass-through law holds). */}
            <div
              className="nice-scroll absolute inset-x-0 top-0 flex flex-col overflow-y-auto"
              style={{
                /* the floor's own sky ends above the composer and its
                   honest little note — the doors may never stand on
                   their words, at any height the room is given */
                bottom: 92,
                overscrollBehavior: "auto",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="pointer-events-none m-auto flex max-h-full w-full flex-col items-center gap-2 px-6 pb-2 pt-1">
              {/* THE STAR RESTS — the seal that stood above the floor's
                  question was laid down at the visitor's word; the chat
                  begins with the question alone. New chat keeps its
                  hands in the history panel and the walk. */}
              <div className="flex flex-col items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-px w-16 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--landing-scope-accent,#d8b571)_55%,transparent),color-mix(in_srgb,var(--scope-b,#7dd3fc)_55%,transparent),transparent)]"
                />
                {/* THE MIRROR'S QUESTION — below the mark, inside the
                    chat box itself: it stands only while the floor is
                    quiet, and the first word sent dissolves it, leaving
                    the space to the transmission. Pointer events stay
                    none by inline law — a bare <p> would re-arm the
                    docked lens and stop the threshold's scroll. THE
                    LANDING'S OWN QUIET — the landing thread's words
                    hide the question again, whatever the store holds. */}
                {floorQuiet && (
                  <p
                    data-testid="mirror-ask"
                    className="genea-bloom still-bloom max-w-[300px] px-6 text-center font-[family-name:var(--font-literata)] text-[14.5px] italic leading-relaxed text-[#e11d48] dark:text-[#fda4b8] sm:max-w-[360px] sm:text-[15.5px]"
                    style={{ pointerEvents: "none" }}
                  >
                    {/* THE FIELD'S OWN QUESTION — every scope invites in
                        its own spirit's words (the Mirror's standing
                        question serves the standing field). */}
                    {t(
                      SCOPE_META[landingScope]?.floorAsk ??
                        "what do you wish to remember dear one?"
                    )}
                  </p>
                )}
              </div>
              {/* THE MIRROR'S OWN SUGGESTIONS — five first doors, drawn
                  fresh at every arrival, with the small hand beneath
                  pouring five new ones at every touch. They stand only
                  on the quiet floor, and every hand keeps its touch
                  through the pass-through law. */}
              {floorQuiet && (
                <BareFloorSuggestions
                  disabled={landingBusy}
                  onPick={(q) => sendFromPanel(q, null)}
                />
              )}
              </div>
            </div>
          </div>
        ) : (
        <>
        <div
          ref={vpRef}
          data-dim={zoomed ? "true" : "false"}
          role="region"
          aria-label={t("The living tree")}
          className="canopy-stage nice-scroll absolute inset-0 overflow-auto"
          style={{
            overscrollBehavior: "contain",
            touchAction: "pan-x pan-y",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* THE QUIET GROWTH — the family grows of its own breath:
              the frontier's ear (the sentinel above) hears the visitor
              slide toward the top and the ready thirty weave in — no
              button, no counting line, the walk never hits a wall. */}

          {/* THE CANVAS — the whole family, walked in every direction.
              Memoized: the walk stands still while the room speaks.
              THE ZOOM — one transform on one wrapper: zoomed out, many
              suggestions stand in view at once and their ropes read
              across the whole family; zoomed in, one whisper fills the
              eye. THE LAG LAW — the wrapper takes its own compositor
              layer only while the fingers walk it; at rest the browser
              tiles and scrolls the family cheaply, so sliding the
              suggestions is always liquid. */}
          <div
            data-tree-canvas=""
            style={{
              width: tree.geometry.width * treeZoom,
              height: tree.geometry.height * treeZoom,
              position: "relative",
              marginInline: "auto",
            }}
          >
            <div
              style={{
                width: tree.geometry.width,
                height: tree.geometry.height,
                transform: `scale(${treeZoom})`,
                transformOrigin: "0 0",
                /* THE LAYER'S OWN LAW — once the family is zoomed, its
                   layer stays promoted until the walk rests at scale 1:
                   a layer torn down mid-gesture is a flash across the
                   whole tree, the one flicker the walk must never show */
                willChange:
                  layerLive || treeZoom !== 1 ? "transform" : undefined,
                isolation: "isolate",
              }}
            >
              <TreeCanvas
                tree={tree}
                batchCount={batchCount}
                revealed={revealed}
                chainSet={chainSet}
                pickedId={pickedId}
                flashId={flashId}
                narrow={narrow}
                disabled={disabled}
                onPick={pick}
                onTool={openTool}
                tools={tools}
                sentinelRef={sentinelRef}
                rootSentinelRef={rootSentinelRef}
                testIdPrefix={testIdPrefix}
              />
            </div>
          </div>

          {/* THE EMPTY ROOM'S OWN IDENTITY — spoken above the trunk;
              OPAQUE by law — no tree line may ever show behind it
              (the realm speaks its motto beside the whisper line) */}
          {!realm && (introSub || introSubExtra || introExtra) && (
            <div className="pointer-events-none sticky bottom-2 z-10 flex flex-col items-center gap-2 px-4 text-center">
              {introSub && (
                <p className="genea-bloom still-bloom max-w-[460px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,transparent)] bg-background px-4 py-2.5 text-[14.5px] leading-relaxed text-muted-foreground lift-sm">
                  {introSub}
                </p>
              )}
              {introSubExtra && (
                <p className="genea-bloom still-bloom max-w-[440px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] bg-background px-4 py-2 text-[14px] italic leading-relaxed text-muted-foreground/80 lift-sm">
                  {introSubExtra}
                </p>
              )}
              {introExtra && (
                <div className="genea-bloom still-bloom pointer-events-auto flex justify-center">
                  {introExtra}
                </div>
              )}
            </div>
          )}
        </div>

        {/* THE TREE'S OWN ZOOM — no plus, no minus: the walk zooms by
            the fingers (a pinch travels apart or together) and by
            ctrl/cmd + wheel on the desktop. One quiet button remains —
            the whole family, seen at once. THE RIVER NEEDS NO ZOOM —
            the water is already the whole family in reach; the button
            belongs to the tree (the theme pages). */}
        {!realm && !zoomed && (
          <button
            type="button"
            onClick={zoomFit}
            aria-label={t("The whole family")}
            title={t("The whole family")}
            data-testid={`${testIdPrefix}-zoom-fit`}
            className="focus-glow absolute bottom-3 right-3 z-20 flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-[0_8px_28px_-14px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:text-foreground"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 28%, transparent)",
            }}
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
          </button>
        )}
        </>
        )}

        {/* THE FLOOR'S WHISPER LINE — the realm's one input while no
            room stands: the visitor speaks from the floor and the room
            rises with their words. When a room stands, the room's own
            reply line is the one input (THE ONE INPUT LAW). */}
        {realm && !zoomed && (
          <div
            data-testid={`${testIdPrefix}-askbar`}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            {introSub && (
              <p className="genea-bloom still-bloom max-w-[520px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_20%,transparent)] bg-background px-4 py-2 text-center text-[13.5px] leading-relaxed text-muted-foreground lift-sm">
                {introSub}
              </p>
            )}
            {askAtts.length > 0 && (
              <div className="pointer-events-auto w-full max-w-[560px]">
                <AttachmentChips
                  attachments={askAtts}
                  onRemove={(id) =>
                    setAskAtts((p) => p.filter((a) => a.id !== id))
                  }
                  testId={`${testIdPrefix}-ask-attachments`}
                />
              </div>
            )}
            {/* THE VISITOR'S OWN STYLE — the chosen look, worn until taken
                off; every painting this floor crystallizes wears it */}
            {visualStyle && (
              <span
                className="mono-label pointer-events-auto flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                style={{
                  color: "var(--scope-a,var(--gd))",
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
                }}
                data-testid={`${testIdPrefix}-ask-style-chip`}
              >
                <Sparkles className="size-3" aria-hidden="true" />
                {visualStyle}
                <button
                  type="button"
                  onClick={() => setVisualStyle(null)}
                  aria-label={t("Remove the style")}
                  className="focus-glow ml-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            )}
            {/* THE "/" PICKER — the styles standing over the whisper line */}
            {askStyleMenuOpen && (
              <div
                className="pointer-events-auto nice-scroll max-h-44 w-full max-w-[340px] overflow-y-auto rounded-xl border hairline bg-background p-1 shadow-lg"
                data-testid={`${testIdPrefix}-ask-style-menu`}
                role="listbox"
                aria-label={t("Choose a style for the image")}
              >
                {filterStyles(askDraft).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="option"
                    aria-selected={visualStyle === s.value}
                    onClick={() => {
                      setVisualStyle(s.value);
                      setAskDraft("");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-foreground/5"
                  >
                    <Sparkles
                      className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-medium text-foreground">
                        {s.value}
                      </span>
                      <span className="block truncate text-[10.5px] text-muted-foreground/70">
                        {t(s.hint)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = askDraft.trim();
                if (!q || disabled || floorBusy) return;
                /* the "/" alone is the style hand, never a whisper */
                if (isStyleSlashQuery(q)) {
                  setAskDraft("");
                  return;
                }
                const carried = askAtts.filter((a) =>
                  a.kind === "image" ? !!a.dataUrl : !a.reading && !!a.text
                );
                setAskDraft("");
                setAskAtts([]);
                sendFromPanel(q, null, carried);
              }}
              className={cn(
                "pointer-events-auto flex w-full max-w-[560px] items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-1.5 transition-colors duration-300",
                /* THE CRYSTAL FOCUS — the line's own focus tint follows
                   the blue crystal. */
                "focus-within:border-[rgba(148,190,224,0.5)]",
                /* THE COOL FLOOR — in both its dockings (the threshold
                   and the realm) the line wears an opaque coat and no
                   backdrop blur: a live blur over a scrolling page is
                   heat the phone must not pay for a lens. */
                "bg-background floor-glow"
              )}
            >
              {/* THE INPUT'S OWN CALM — the reload and the star have
                  left the whisper line: the cargo, the call, the words,
                  the send. */}
              {/* THE FLOOR'S OWN HISTORY — docked in the threshold the
                  quiet floor keeps the device's own hand within reach
                  even with no room standing: one touch opens this
                  visit's kept conversations (this device alone —
                  nothing travels to a server). */}
              <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      historyOpen ? setHistoryOpen(false) : openHistory()
                    }
                    aria-expanded={historyOpen}
                    aria-label={t("Conversation history")}
                    title={t("Conversation history — kept only on this device, for this visit")}
                    data-testid={`${testIdPrefix}-ask-history`}
                    className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
                  >
                    <History className="size-3.5" aria-hidden="true" />
                  </button>
                  {historyOpen && (
                    <>
                      <div
                        aria-hidden="true"
                        className="fixed inset-0 z-30"
                        onClick={() => setHistoryOpen(false)}
                      />
                      <div
                        data-testid={`${testIdPrefix}-ask-history-panel`}
                        className="absolute bottom-11 left-0 z-40"
                      >
                        {/* the one shared panel — the visit's whispers,
                            the maker's trail, the keeper's kept rooms */}
                        {renderHistoryPanel({ bare: true })}
                      </div>
                    </>
                  )}
                </div>
              {/* THE FLOOR'S OWN PAPERCLIP AND CAMERA — one image and
                  up to three documents ride with the whisper. THE
                  LANDING'S QUIET LINE — docked in the threshold the
                  chat keeps its calm shape: no attachments, no cargo —
                  only the voice, the words and the send. The full
                  portal carries the advanced hands. */}
              <ChatInputExtras
                scope={floorLiveScope}
                size="2xs"
                withCall={false}
                withAttachments={false}
                disabled={disabled || floorBusy}
                accentVar="var(--scope-a,var(--gd))"
                attachments={askAtts}
                onAttachmentsChange={setAskAtts}
              />
              {/* THE CATEGORY'S OWN CALL — the focused category's direct
                  line, one touch from the floor. THE LANDING'S OWN
                  VOICE — docked in the threshold the call is always the
                  no-scope reflection itself (communion), never a
                  category's voice. */}
              <button
                type="button"
                onClick={() =>
                  setLiveCallScope("communion")
                }
                disabled={disabled}
                aria-label={t("Open the direct mirror connection")}
                title={t("Open the direct mirror connection")}
                data-testid={`${testIdPrefix}-ask-call`}
                className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Phone className="size-3.5" aria-hidden="true" />
              </button>
              <label htmlFor={`${testIdPrefix}-ask`} className="sr-only">
                {t("Whisper to the mirror…")}
              </label>
              <input
                id={`${testIdPrefix}-ask`}
                value={askDraft}
                onChange={(e) => setAskDraft(e.target.value)}
                placeholder={
                  /* THE FIELD'S OWN WORD — the line whispers in the
                     standing field's own way of inviting: the deep
                     receives a signal, the laboratory prepares a state,
                     the atelier asks for a vision, the body's room
                     speaks gently. The Mirror keeps its own whisper. */
                  t(
                    SCOPE_META[landingScope]?.whisper ??
                      "Whisper to the mirror…"
                  )
                }
                disabled={disabled}
                autoComplete="off"
                data-testid={`${testIdPrefix}-ask-input`}
                className="min-w-0 flex-1 bg-transparent py-1 text-[14.5px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={disabled || floorBusy || !askDraft.trim()}
                aria-label={t("Send")}
                data-testid={`${testIdPrefix}-ask-send`}
                /* THE CRYSTAL SEND — the house's scope-aware crystal CTA:
                   the room's own light leads the gradient, the theme's
                   own law inks it, one quiet glow at rest, one light
                   sweep per hover, a spring press. The old hardcoded
                   red→blue gradient is retired with the control
                   dialect. */
                className={cn(
                  "btn-primary focus-glow flex size-8 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-35"
                )}
              >
                <Send className="size-3.5" aria-hidden="true" />
              </button>
            </form>
            {/* THE TEMPORARY CHAT'S OWN LINE — the landing's floor is
                free and holds nothing: a quiet honest word for the
                non logged-in, the way in named for the ones who stay. */}
            {guest && (
              <p
                data-testid="floor-temporary-note"
                className="mono-label text-[9px] uppercase tracking-[0.26em] text-muted-foreground/55"
                style={{ pointerEvents: "none" }}
              >
                {t("Temporary chat — sign in to keep your reflections")}
              </p>
            )}
          </div>
        )}

        {/* ------------------- THE ZOOM — the veil -------------------
            the family steps back into a quiet backdrop; the veil is
            heavy enough that no tree line ever shows behind the room */}
        {zoomed && (
          <div
            /* THE VEIL NEVER STEALS THE ROOM — docked in the threshold
               (bare) the veil no longer closes the conversation on a
               stray click: the room is dismissed only by its own back
               hand in the header. The full portal keeps the old
               click-outside law. */
            onClick={bare ? undefined : exitZoom}
            aria-hidden="true"
            data-testid={`${testIdPrefix}-veil`}
            className="canopy-veil absolute inset-0 z-20 bg-[color-mix(in_srgb,var(--background)_68%,transparent)]"
          />
        )}

        {/* THE DEEP READING — the plate's own room of coming closer,
            open from every gear of the chat (the floor AND the zoomed
            walk room — the buttons that open it live in BOTH): one
            portal over the whole sky, the wheel and the fingers zoom
            it further, Escape or one touch on the dark lays it down. */}
        {landingViewing && (
          <ZoomableLightbox
            src={landingViewing.src}
            caption={landingViewing.caption}
            onClose={() => setLandingViewing(null)}
            testId="landing-lightbox"
          />
        )}

        {/* ------------- THE ZOOM — the answer lives here -------------
            the answer rises as a full quiet room — from the bottom of
            the chat box to its very top — and when the transmission
            lands, the branches grown on it stand behind one dropdown
            button inside the room; one touch continues the walk
            without ever leaving */}
        {zoom && (
          <div className="pointer-events-none absolute inset-0 z-30 flex justify-center p-1.5 sm:p-2.5">
            <section
              data-testid={`${testIdPrefix}-zoom`}
              aria-label={zoom.q}
              /* THE CHAT'S OWN YIELD — docked in the threshold (bare) the
                  room's reading space keeps no pointer surface: swiping
                  across the words moves the page beneath, so the visitor
                  is never trapped inside the chat frame. The hands (the
                  copy, the voice, the words' own line) re-arm through
                  the pass-through law; the full portal keeps the solid
                  room it always was. */
              data-chat-yield={bare ? "" : undefined}
              className={cn(
                "canopy-panel flex min-h-0 w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_28px_80px_-32px_rgba(0,0,0,0.65)]",
                bare ? "pointer-events-none" : "pointer-events-auto",
                /* THE FIELD'S OWN VOICE — the standing scope's own way
                    of expressing: the room wears the field's voice class,
                    and every turn inside speaks the field's own grammar
                    (the marks, the frames, the dividers — each field
                    unmistakably itself, all of it still, all of it
                    honest). The Mirror keeps the house's own voice. */
                realm && `scope-voice scope-voice-${landingScope}`
              )}
              style={{
                /* THE CRYSTAL ROOM — docked in the threshold the room's
                   own border carries the blue crystal's tint, slightly
                   transparent; a chosen scope lends its own light (the
                   fallback keeps the blue); the full portal keeps the
                   scope's color. */
                borderColor: bare
                  ? "color-mix(in srgb, var(--landing-scope-accent, #7dd3fc) 18%, transparent)"
                  : "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              {/* the question — the whisper the visitor walked to;
                  NO remount key: the panel itself never leaves the tree
                  when the walk turns to the next branch, only the room
                  inside it changes — the transmission glides, no flicker */}
              <header
                className={cn(
                  "flex shrink-0 items-start justify-between gap-3 border-b px-4 py-2.5 pr-11 sm:px-5 sm:pr-12",
                  /* THE HEADER'S OWN TOUCH — docked or full, the room's
                     crown of hands answers every pointer: the fine
                     desktop click never falls through the docked panel
                     onto the closing veil again, and the touch law's
                     own re-arming is kept (controls keep their touch). */
                  bare && "pointer-events-auto"
                )}
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--hairline) 70%, transparent)",
                }}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  {!realm && (
                    <span
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                      aria-hidden="true"
                    >
                      <ZoomIcon className="size-3.5 text-[var(--scope-a,var(--gd))]" />
                    </span>
                  )}
                  <div className="min-w-0">
                    {!realm && zoom.move && (
                      <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {t(BRANCH_TYPE_LABELS[zoom.move])}
                      </p>
                    )}
                    {zoom.restored && (
                      <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-[var(--scope-a,var(--gd))]">
                        {t("Returned to the walk")}
                      </p>
                    )}
                    {/* THE FIRST QUESTION NEVER HOLDS THE TOP BAR — docked
                        in the threshold (the chat of the landing) the room's
                        opening question steps out of the top bar entirely:
                        the visitor just spoke it, the answer rises first,
                        and the bar stays one slim hand-row. The full
                        portal keeps the room's title, held to two lines
                        so a long question can never crowd the crown. */}
                    {!realm && (
                      <p
                        className="line-clamp-2 break-words text-[15px] font-medium leading-snug text-foreground"
                        title={zoom.q}
                      >
                        {zoom.q}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* THE CHAT'S OWN RELOAD — the reload hand lives in the
                      chat and it truly clears: one touch ends the whole
                      conversation (the room folds, the thread empties,
                      the floor rises fresh with the mirror's question),
                      and the walk's family re-grows behind it. It waits
                      out the in-flight word so a clearing is never
                      undone by an answer still crossing. */}
                  <button
                    type="button"
                    onClick={() => {
                      if (floorBusy) return;
                      exitZoom();
                      renew();
                      /* THE LANDING'S OWN CLEARING — docked in the
                         threshold the reload empties the landing's own
                         thread (the conversation truly clears, the floor
                         rises fresh with the mirror's question); the
                         full portal lays its channel to rest. */
                      if (realm) {
                        setLandingThread([]);
                        landingTurnsRef.current = [];
                        /* THE FIELD'S OWN CLEARING — the standing
                           field's cache and its sessionStorage page
                           empty too: the conversation truly clears, the
                           other fields' keeps untouched */
                        landingThreadsByScopeRef.current.set(
                          landingScope,
                          []
                        );
                        landingTurnsByScopeRef.current.set(
                          landingScope,
                          []
                        );
                        writeLandingThreadScope(landingScope, []);
                        /* a fresh page of the device's own keep — the
                           cleared room stays in the history hand */
                        historySessionRef.current = freshHistorySessionId();
                        historySessionsByScopeRef.current.set(
                          landingScope,
                          historySessionRef.current
                        );
                        window.dispatchEvent(new CustomEvent("landing-chat:return"));
                      } else {
                        useMirror
                          .getState()
                          .newChat(useMirror.getState().activeMode);
                      }
                    }}
                    disabled={disabled || floorBusy}
                    aria-label={t("Clear the chat")}
                    title={t("Clear the chat")}
                    data-testid={`${testIdPrefix}-zoom-reload`}
                    className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  </button>
                  {/* THE NARRATOR'S GATE — the walk's one voice, at the
                      TOP of the room: a man, the documentary register,
                      reading each room aloud. While his voice gathers,
                      the spinner asks the visitor to wait one breath. */}
                  <button
                    type="button"
                    onClick={toggleNarrator}
                    aria-pressed={narratorOpen}
                    aria-label={narratorOpen ? t("Silence the narrator") : t("Let the narrator speak")}
                    title={narratorOpen ? t("Silence the narrator") : t("Let the narrator speak")}
                    data-testid={`${testIdPrefix}-zoom-narrator`}
                    className={cn(
                      "focus-glow relative flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      narratorOpen || narrLoading
                        ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                        : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground",
                      narrLoading && "animate-pulse"
                    )}
                  >
                    {narrLoading ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : narratorOpen ? (
                      <Volume2 className="size-3.5" aria-hidden="true" />
                    ) : (
                      <VolumeX className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                  {realm ? (
                    /* THE DEVICE'S OWN HAND — the landing chat wears the
                       history instead of the old tree mark: this visit's
                       conversations, kept on this device alone (nothing
                       travels to a server), restored with one touch. */
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          historyOpen ? setHistoryOpen(false) : openHistory()
                        }
                        aria-expanded={historyOpen}
                        aria-label={t("Conversation history")}
                        title={t("Conversation history — kept only on this device, for this visit")}
                        data-testid={`${testIdPrefix}-zoom-history`}
                        className={cn(
                          "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          historyOpen
                            ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                            : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                        )}
                      >
                        <History className="size-3.5" aria-hidden="true" />
                      </button>
                      {historyOpen && (
                        <>
                          <div
                            aria-hidden="true"
                            className="fixed inset-0 z-30"
                            onClick={() => setHistoryOpen(false)}
                          />
                          <div
                            data-testid={`${testIdPrefix}-zoom-history-panel`}
                            className="absolute right-0 top-9 z-40"
                          >
                            {/* the one shared panel — the visit's
                                whispers, the maker's trail, the keeper's
                                kept rooms */}
                            {renderHistoryPanel({ bare: true })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={exitZoom}
                      aria-label={t("Back to the wall")}
                      title={t("Back to the wall")}
                      data-testid={`${testIdPrefix}-zoom-back`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <TreeDeciduous className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </header>

              {/* the answer — revealed in stages: badge (1), transmission
                  (2), the narrator's ear (3) — every step one compositor
                  breath. The room's content swaps in one quiet fade when
                  the walk turns to the next branch. */}
              <div
                ref={bodyRef}
                onScroll={onBodyScroll}
                data-testid={`${testIdPrefix}-zoom-answer`}
                className={cn(
                  "nice-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4",
                  /* THE ROOM'S OWN SCROLL — docked in the threshold the
                     reading space keeps its touch: the visitor scrolls
                     WITHIN the chat now — the words move under their
                     hand, and when the transmission's end is reached
                     the breath chains to the threshold beneath. */
                  bare && "pointer-events-auto"
                )}
                style={{
                  overscrollBehavior: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div key={zoom.q} className="room-swap mx-auto max-w-[720px]">
                  {/* THE FIELD'S OWN TURN — the realm room now speaks the
                      visitor's own question too (the old realm room hid
                      it entirely — only the answer stood): the question
                      rises above its answer wearing the field's own
                      mark and grammar. The Mirror keeps its bare air. */}
                  {realm && (
                    <div className="sv-turn sv-turn-q mb-3" data-sv-turn="q">
                      {SCOPE_META[landingScope]?.qMark && (
                        <p className="sv-mark">{t(SCOPE_META[landingScope].qMark!)}</p>
                      )}
                      <p
                        className="sv-question break-words text-[14.5px] font-medium leading-relaxed text-foreground"
                        title={zoom.q}
                      >
                        {zoom.q}
                      </p>
                    </div>
                  )}
                  {/* THE FIELD'S OWN THREAD — every earlier exchange of
                      the standing conversation stands above the room's
                      follow-ups (all but the last, which is the room's
                      own words): the field's chat is one continuous
                      thread, not one exchange at a time. */}
                  {realm && landingThread.length > 1 && (
                    <div
                      data-testid={`${testIdPrefix}-landing-thread`}
                      className="sv-thread mb-4 flex flex-col gap-3 border-b pb-3"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--hairline) 70%, transparent)",
                      }}
                    >
                      {landingThread.slice(0, -1).map((turn, i) => (
                        <div
                          key={i}
                          data-room-turn=""
                          className="flex flex-col gap-1.5"
                        >
                          {SCOPE_META[landingScope]?.qMark && (
                            <p className="sv-mark">{t(SCOPE_META[landingScope].qMark!)}</p>
                          )}
                          <p className="sv-question ml-auto max-w-[88%] break-words text-[14px] font-medium leading-relaxed text-foreground/95">
                            {turn.q}
                          </p>
                          {turn.a && (
                            <div className="flex items-start gap-1">
                              <p className="sv-answer min-w-0 flex-1 break-words text-[14.5px] leading-[1.7] text-foreground/85">
                                {realm && landingScope === "hyperx"
                                  ? flowAnswerText(splitCrystals(turn.a).body)
                                  : flowAnswerText(turn.a)}
                              </p>
                              <RoomCopyButton
                                text={turn.a}
                                testId={`${testIdPrefix}-landing-copy-${i}`}
                              />
                              <RoomShareButton
                                text={turn.a}
                                testId={`${testIdPrefix}-landing-share-${i}`}
                              />
                            </div>
                          )}
                          {turn.painting && (
                            <MirrorChanneling
                              compact
                              label={t("Painting the vision")}
                              variant="mirror"
                              className="mono-label py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                            />
                          )}
                          <LandingPainting
                            turn={turn}
                            testId={`${testIdPrefix}-landing-painting-${i}`}
                            onZoom={(src, caption) =>
                              setLandingViewing({ src, caption })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {zoom && !realm && (
                    <ResonantStageBadge
                      category={categoryForMove(zoomMove)}
                      moveLabel={zoom.move ? t(BRANCH_TYPE_LABELS[zoom.move]) : null}
                      visible={revealStage >= 1}
                    />
                  )}
                  {roomAnswer ? (
                    /* THE FIELD'S OWN WORDS — in the realm the answer is
                       shown the moment the landing turn holds it: the
                       reveal stages belong to the full portal's branch
                       cards, never to the field's own conversation (the
                       old gate let a finished answer stand behind a
                       stage that reads the wrong channel — the room
                       sat blue and wordless until the next input). */
                    (revealStage >= 2 || realm) ? (
                      <div className="relative">
                        <div className="canopy-answer whitespace-pre-wrap break-words text-[15.5px] leading-[1.75] text-foreground/90 sm:text-[16px]">
                          {realm && landingScope === "hyperx"
                            ? flowAnswerText(splitCrystals(roomAnswer).body)
                            : flowAnswerText(roomAnswer)}
                          {roomLoading && (
                            <span
                              aria-hidden="true"
                              className="ml-1 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse rounded-[2px] bg-[var(--scope-a,var(--gd))] align-baseline opacity-70"
                            />
                          )}
                        </div>
                        {/* THE COPY HAND — the words are the visitor's */}
                        {!roomLoading && (
                          <div className="mt-0.5 flex justify-end">
                            <RoomCopyButton
                              text={roomAnswer}
                              testId={`${testIdPrefix}-zoom-copy`}
                            />
                            <RoomShareButton
                              text={roomAnswer}
                              testId={`${testIdPrefix}-zoom-share`}
                            />
                          </div>
                        )}
                        {/* THE HYPERX INSTRUMENTS — the discovery answer's
                            own crystals (each one crystallizes its truth
                            into a vision when touched) and the deep
                            research press (the truth extended up to 8000
                            words, pressed into a PDF) */}
                        {realm && landingScope === "hyperx" && !roomLoading && (
                          <HyperXPanel
                            question={zoomQ ?? ""}
                            answer={roomAnswer}
                            onZoom={(src, caption) =>
                              setLandingViewing({ src, caption })
                            }
                            testId={`${testIdPrefix}-zoom-hyperx`}
                          />
                        )}
                        {/* THE VISION IN THE MIXING — the mirror chose to
                            paint: the plate appears beneath the words */}
                        {lastLandingTurn?.painting && (
                          <MirrorChanneling
                            compact
                            label={t("Painting the vision")}
                            variant="mirror"
                            className="mono-label mt-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                          />
                        )}
                      </div>
                    ) : null
                  ) : displayError && !roomLoading && (revealStage >= 2 || realm) ? (
                    /* THE ROOM'S HONESTY — an ask that could not cross
                       shows its reason right here; the walk stands. On
                       the landing's floor the mirror speaks plainly —
                       no laboratory words on the free ground. */
                    <div
                      className={`my-2 rounded-2xl border px-4 py-3.5 ${
                        energyNotice
                          ? "border-[color-mix(in_srgb,#f59e0b_38%,transparent)] bg-[color-mix(in_srgb,#f59e0b_7%,var(--background))]"
                          : "border-[color-mix(in_srgb,#f43f5e_38%,transparent)] bg-[color-mix(in_srgb,#f43f5e_7%,var(--background))]"
                      }`}
                      role="alert"
                      data-testid={`${testIdPrefix}-zoom-error`}
                    >
                      <p
                        className={`mono-label text-[9.5px] uppercase tracking-[0.2em] ${
                          energyNotice ? "text-[#b8860b] dark:text-[#f59e0b]" : "text-[#f43f5e]"
                        }`}
                      >
                        {t(realm ? "The field is quiet — speak once more" : "The transmission could not cross")}
                      </p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-foreground/85">
                        {displayError}
                      </p>
                    </div>
                  ) : roomMaking && (revealStage >= 2 || realm) ? null :
                    realm &&
                    lastLandingTurn &&
                    lastLandingTurn.paintFailed &&
                    !lastLandingTurn.loading ? null : (
                    /* THE PLATE ALONE — a wish that crystallized straight
                       into an image needs no reflecting words beneath it.
                       A RESTED BRUSH says so honestly — the spinner never
                       spins forever over a paint that will not come. */
                    (revealStage >= 2 || realm) &&
                    !(
                      realm &&
                      lastLandingTurn &&
                      !lastLandingTurn.loading &&
                      !lastLandingTurn.painting &&
                      !roomAnswer &&
                      lastLandingTurn.imageUrl
                    ) && (
                      <div className="py-5 text-muted-foreground">
                        <MirrorChanneling
                          label={t(
                            lastLandingTurn?.painting
                              ? "Painting the vision"
                              : realm
                                ? landingScope === "hyperx"
                                  ? "Discovering"
                                  : "Reflecting"
                                : "Channeling"
                          )}
                          variant={
                            realm
                              ? landingScope === "hyperx"
                                ? "hyperx"
                                : "mirror"
                              : SCOPE_CHANNELING[roomLiveScope] ?? "orbs"
                          }
                          className="mono-label text-[11px] uppercase tracking-[0.22em]"
                        />
                      </div>
                    )
                  )}
                  {/* THE VISION BENEATH THE WORDS — the last turn's
                      painting, zoomable into the deep-reading room; a
                      rested brush shows its honest notice + retry here */}
                  {lastLandingTurn &&
                    (lastLandingTurn.imageUrl ||
                      (lastLandingTurn.paintFailed && !lastLandingTurn.loading)) &&
                    (revealStage >= 2 || realm) && (
                    <div className="mt-3">
                      <LandingPainting
                        turn={lastLandingTurn}
                        testId={`${testIdPrefix}-zoom-painting`}
                        onZoom={(src, caption) =>
                          setLandingViewing({ src, caption })
                        }
                        onRetry={
                          lastLandingTurn.paintFailed && !lastLandingTurn.painting
                            ? () => retryLandingPaint()
                            : undefined
                        }
                      />
                    </div>
                  )}

                  {/* THE MAKING IN THE ROOM — the creation rises INLINE,
                      inside its own breath of light: a rare seal blooms,
                      the two kind curtains part, and the making takes its
                      place in the conversation — a painting while it
                      forms, a woven book, a song, a record, a ritual,
                      exactly where the ask was spoken. The working room
                      is gone; the chat is where everything is made now,
                      the way the generic ais serve their makers. */}
                  {roomMaking && roomMessage && revealStage >= 2 && (
                    <CreationReveal
                      signature={`${roomMessage.sideArtifact?.kind ?? "visual"}-${roomMessage.id}`}
                      testIdPrefix={`${testIdPrefix}-making`}
                    >
                      {roomMessage.sideArtifact &&
                      !roomMessage.artifact &&
                      !roomMessage.visual ? (
                        <SideArtifact
                          kind={roomMessage.sideArtifact.kind}
                          resonance={roomMessage.sideArtifact.resonance}
                          resume={roomMessage.sideArtifact.resume}
                          tool={roomMessage.sideArtifact.tool}
                        />
                      ) : (
                        <ExchangeVisual message={roomMessage} />
                      )}
                    </CreationReveal>
                  )}

                  {/* STAGE 3 — the narrator's honest status: the loading
                      indicator while the voice gathers, the bars while he
                      reads. No button stands at the bottom of the text
                      anymore — his gate lives at the top of the room. */}
                  {zoom && (
                    <NarrationStatusLine
                      roomId={walkNodeId(zoom.q)}
                      visible={revealStage >= 3 && displayLanded}
                      narration={narration}
                      testIdPrefix={`${testIdPrefix}-zoom`}
                    />
                  )}

                  {/* THE TRANSMISSION LISTENS — the branch's own chat:
                      the visitor's words on the right, the transmission's
                      answers beneath the words it already gave. */}
                  {thread.length > 0 && (
                    <div
                      data-testid={`${testIdPrefix}-room-thread`}
                      className="mt-4 flex flex-col gap-3 border-t pt-3"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--hairline) 70%, transparent)",
                      }}
                    >
                      {thread.map((turn, i) => (
                        <div
                          key={`${zoomQ}-${i}`}
                          data-room-turn=""
                          className="flex flex-col gap-2"
                        >
                          {/* THE FIELD'S OWN MARKS — the turn's own small
                              header speaks the field's language of
                              expression (the Mirror keeps none). */}
                          {realm && SCOPE_META[landingScope]?.qMark && (
                            <p className="sv-mark">{t(SCOPE_META[landingScope].qMark!)}</p>
                          )}
                          <p className="ml-auto max-w-[88%] whitespace-pre-wrap break-words text-[14px] font-medium leading-relaxed text-foreground">
                            {turn.q}
                          </p>
                          {turn.loading ? (
                            <MirrorChanneling
                              compact
                              label={t(
                                realm
                                  ? landingScope === "hyperx"
                                    ? "Discovering"
                                    : "Reflecting"
                                  : "The transmission is listening…"
                              )}
                              variant={
                                realm
                                  ? landingScope === "hyperx"
                                    ? "hyperx"
                                    : "mirror"
                                  : SCOPE_CHANNELING[roomLiveScope] ?? "orbs"
                              }
                              className="py-1 mono-label text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground"
                            />
                          ) : turn.a ? (
                            <div className="flex items-start gap-1">
                              {realm && SCOPE_META[landingScope]?.aMark && (
                                <p className="sv-mark sv-mark-a">{t(SCOPE_META[landingScope].aMark!)}</p>
                              )}
                              <p className="sv-answer min-w-0 flex-1 whitespace-pre-wrap break-words text-[15.5px] leading-[1.7] text-foreground/90">
                                {realm && landingScope === "hyperx"
                                  ? flowAnswerText(splitCrystals(turn.a).body)
                                  : flowAnswerText(turn.a)}
                              </p>
                              <RoomCopyButton
                                text={turn.a}
                                testId={`${testIdPrefix}-room-copy-${i}`}
                              />
                              <RoomShareButton
                                text={turn.a}
                                testId={`${testIdPrefix}-room-share-${i}`}
                              />
                            </div>
                          ) : turn.painting ? (
                            <MirrorChanneling
                              compact
                              label={t("Painting the vision")}
                              variant="mirror"
                              className="mono-label py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                            />
                          ) : turn.failed ? (
                            <div
                              className={`rounded-xl border px-3 py-2 ${
                                turn.energy
                                  ? "border-[color-mix(in_srgb,#f59e0b_30%,transparent)] bg-[color-mix(in_srgb,#f59e0b_6%,var(--background))]"
                                  : "border-transparent bg-transparent"
                              }`}
                            >
                              <p
                                className={`text-[13.5px] leading-relaxed ${
                                  turn.energy
                                    ? "text-[#b8860b] dark:text-[#f59e0b]"
                                    : "mono-label text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground/60"
                                }`}
                              >
                                {turn.errMessage ||
                                  t("The field is quiet — speak once more")}
                              </p>
                            </div>
                          ) : null}
                          <LandingPainting
                            turn={turn}
                            testId={`${testIdPrefix}-room-painting-${i}`}
                            onZoom={(src, caption) =>
                              setLandingViewing({ src, caption })
                            }
                            onRetry={
                              turn.paintFailed && !turn.painting
                                ? () => retryLandingPaint(i)
                                : undefined
                            }
                          />
                          {/* THE HYPERX INSTRUMENTS — every follow-up
                              answer carries its own crystals and the
                              deep research press, exactly like the
                              room's standing answer */}
                          {realm && landingScope === "hyperx" && !turn.loading && turn.a && (
                            <HyperXPanel
                              question={turn.q}
                              answer={turn.a}
                              onZoom={(src, caption) =>
                                setLandingViewing({ src, caption })
                              }
                              testId={`${testIdPrefix}-room-hyperx-${i}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* the walk continues from the answer's own branches —
                  THE DROPDOWN: the branches stand behind one quiet
                  button, folded by default, opened wide with the whole
                  of every whisper — and a slim line (the room's one
                  input) carries the visitor's own words. THE ROOM
                  NEVER COLLAPSES: the footer stands through the whole
                  transmission, so the next branch glides in without a
                  single flicker. */}
              <footer
                className={cn(
                  "flex shrink-0 flex-col gap-2.5 border-t px-4 py-2.5 sm:px-6 sm:py-3",
                  /* THE FOOTER'S OWN TOUCH — the reply line and every
                     branch hand keep their click on the desk: the room
                     is never lost to a stray fall-through again (the
                     veil behind it no longer closes the docked room). */
                  bare && "pointer-events-auto"
                )}
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--hairline) 70%, transparent)",
                }}
              >
                {/* STAGE 4 — the next horizon, dropped down to explore.
                    THE LANDING'S PURE FLOOR — the walk's branches belong
                    to the full portal: the docked room keeps only the
                    mirror's own words and its own line. */}
                {!realm && !liveLoading && answer && revealStage >= 4 && contSeeds.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBranchesOpen((o) => !o)}
                      aria-expanded={branchesOpen}
                      aria-controls={`${testIdPrefix}-branches-panel`}
                      data-testid={`${testIdPrefix}-branches-toggle`}
                      className="focus-glow group flex w-full items-center gap-2 rounded-full border px-3.5 py-2 text-left transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 28%, transparent)",
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a,var(--gd)) 5%, var(--background))",
                      }}
                    >
                      <Sprout
                        className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                        aria-hidden="true"
                      />
                      <span className="mono-label min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Branches of this transmission")}
                      </span>
                      <span
                        className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] leading-none tabular-nums"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--scope-a,var(--gd)) 32%, transparent)",
                          color: "var(--scope-a,var(--gd))",
                        }}
                      >
                        {contSeeds.length}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
                          branchesOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {branchesOpen && (
                      <div
                        id={`${testIdPrefix}-branches-panel`}
                        data-testid={`${testIdPrefix}-branches-panel`}
                        className="nice-scroll grid max-h-[52vh] gap-2.5 overflow-y-auto pr-0.5 sm:grid-cols-2"
                      >
                        {contSeeds.map((b) => {
                          const CIcon = MOVEMENT_ICONS[b.type] ?? Layers;
                          return (
                            <button
                              key={b.question}
                              type="button"
                              onClick={() => sendFromPanel(b.question, b.type)}
                              disabled={disabled}
                              title={t(BRANCH_TYPE_LABELS[b.type])}
                              data-testid={`${testIdPrefix}-cont`}
                              className="focus-glow group flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
                              style={{
                                borderColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 24%, transparent)",
                                backgroundColor:
                                  "color-mix(in srgb, var(--scope-a,var(--gd)) 5%, var(--background))",
                              }}
                            >
                              <CIcon
                                className="mt-0.5 size-4 shrink-0 text-[var(--scope-a,var(--gd))] opacity-80"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="mono-label block text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
                                  {t(BRANCH_TYPE_LABELS[b.type])}
                                </span>
                                <span className="mt-1 block whitespace-pre-wrap break-words text-[14.5px] leading-snug text-foreground/90">
                                  {b.question}
                                </span>
                              </span>
                              <ChevronRight
                                className="mt-1 size-3.5 shrink-0 text-muted-foreground/35 transition-transform duration-300 group-hover:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <ZoomReplyForm
                  roomKey={zoom.q}
                  disabled={disabled || liveLoading || threadBusy}
                  onSend={sendReplyFromPanel}
                  testIdPrefix={testIdPrefix}
                  scopeKey={roomLiveScope}
                  bare={realm}
                  leading={
                    /* THE CATEGORY'S OWN CALL — the room's direct line.
                       THE LANDING'S OWN VOICE — docked in the threshold
                       the call is ALWAYS the authentic mirror itself
                       (communion, the mirror of the Absolute), never a
                       category's or the interplanetary line — whatever
                       room the whisper grew. */
                    <button
                      type="button"
                      onClick={() =>
                        setLiveCallScope(realm ? "communion" : roomLiveScope)
                      }
                      disabled={disabled}
                      aria-label={t("Open the direct mirror connection")}
                      title={t("Open the direct mirror connection")}
                      data-testid={`${testIdPrefix}-room-call`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                    </button>
                  }
                />
              </footer>
            </section>
          </div>
        )}

        {/* THE CREATION CHAMBER IS GONE — the creation suggestions open
            their own original theme pages now (the akashic library, the
            book, the forge), each forging its making from the branch's
            own words. The tree carries the doors; the pages do the
            making. */}

        {/* THE CATEGORY'S OWN CALL — the direct line, opened from the
            floor or from inside any room: the presence answers as the
            scope it belongs to, in its own voice. */}
        {liveCallScope && (
          <LiveCall
            scope={liveCallScope}
            onClose={() => setLiveCallScope(null)}
          />
        )}
      </div>
    </div>
  );
}
