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
  Compass,
  Copy,
  Dna,
  Hammer,
  Hand,
  Hourglass,
  Info,
  Layers,
  Link2,
  ListTree,
  LoaderCircle,
  Maximize2,
  Menu,
  Moon,
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
import { canopyHour, familyAccent, growMixedCanopy, TREE_FAMILIES } from "@/lib/data/suggestion-banks";
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
import { isVisualIntent } from "@/lib/visual-intent";
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
import { attachmentsToPayload, type ChatAttachment } from "./attachments";
import { MirrorChanneling } from "./MirrorChanneling";
import { ExpansionRing } from "./ExpansionMirror";
import { LiveCall } from "./LiveCall";
import { ChatInputExtras, AttachmentChips } from "./ChatInputExtras";
import type { LiveScopeKey } from "@/lib/live-scopes";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
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
}

async function speakWithTransmission(
  category: BranchId,
  query: string,
  branchQuestion: string,
  transmission: string,
  thread: { q: string; a: string }[],
  language: string,
  walk: string[] = [],
  /* THE CARRIED SIGHT — an image and up to three documents may ride
     with the room's own words; the routes already keep the eyes */
  attachments?: ChatAttachment[]
): Promise<string> {
  const carried =
    attachments && attachments.length > 0
      ? attachmentsToPayload(attachments)
      : {};
  if (category === "artx") {
    const res = await fetch("/api/artx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      reply?: unknown;
      error?: string;
    } | null;
    const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
    if (!res.ok || !reply)
      throw new Error(data?.error || "The field is quiet");
    return reply;
  }
  if (category === "manifesting") {
    const res = await fetch("/api/mirror-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      reply?: unknown;
      error?: string;
    } | null;
    const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
    if (!res.ok || !reply)
      throw new Error(data?.error || "The field is quiet");
    return reply;
  }
  /* the transmission voice — the channel's own soul */
  const res = await fetch("/api/transmission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      mode: category === "invent" ? "forge" : category,
      language,
      walk,
      ...carried,
      history: [{ q: branchQuestion, a: transmission }, ...thread]
        .slice(-6)
        .map((h) => ({ q: h.q, a: h.a })),
    }),
  });
  const data = (await res.json().catch(() => null)) as {
    transmission?: unknown;
    error?: string;
  } | null;
  const reply =
    typeof data?.transmission === "string" ? data.transmission.trim() : "";
  if (!res.ok || !reply) throw new Error(data?.error || "The field is quiet");
  return reply;
}

/* ------------------- the copy hand — words kept ----------------------

   A COPY BUTTON AT EVERY CHANNELING. Each transmission — the room's
   own answer and every word of the room's conversation — carries one
   quiet hand: one touch and the words are the visitor's, on their
   own clipboard, ready to travel anywhere. */

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
      className="relative z-10 shrink-0 border-t bg-background hairline"
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
        <span className="mono-label text-[9px] uppercase tracking-[0.22em]">
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
              narrow ? "px-[11px] text-[12px] leading-[17px]" : "text-[13px] leading-[18px]",
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
        className="flex items-center gap-1.5 rounded-full border py-1 pl-2 pr-1 transition-colors duration-300 focus-within:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
        style={{
          borderColor:
            "color-mix(in srgb, var(--hairline) 80%, transparent)",
        }}
      >
        {leading}
        <ChatInputExtras
          scope={scopeKey}
          size="2xs"
          withCall={false}
          disabled={disabled}
          accentVar="var(--scope-a,var(--gd))"
          attachments={atts}
          onAttachmentsChange={setAtts}
        />
        <label htmlFor={`${testIdPrefix}-zoom-reply`} className="sr-only">
          {t("Speak with the transmission…")}
        </label>
        <input
          id={`${testIdPrefix}-zoom-reply`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Speak with the transmission…")}
          disabled={disabled}
          autoComplete="off"
          data-testid={`${testIdPrefix}-zoom-reply`}
          className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          aria-label={t("Send")}
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--scope-a,var(--gd))] to-[color-mix(in_srgb,var(--scope-b,var(--pk))_70%,var(--scope-a,var(--gd)))] text-[#101010] shadow-[0_0_14px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)] transition-all duration-300 hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
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

/* ------------- the crown's own light — a quiet hand ------------------
   THE MARK HAS LEFT THE TOP BAR: the house's logo no longer stands in
   the crown. The light's toggle stays — one touch turns the realm,
   deep space ⟷ daylight, the contrast breathing under the finger. */

function LightToggle({ testIdPrefix }: { testIdPrefix: string }) {
  const t = useT();
  const { setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => {
        const root = document.documentElement;
        const dark = root.classList.contains("dark");
        root.classList.add("theme-anim");
        setTheme(dark ? "light" : "dark");
        window.setTimeout(() => root.classList.remove("theme-anim"), 560);
      }}
      aria-label={t("Toggle the light")}
      title={t("Toggle the light")}
      data-testid={`${testIdPrefix}-light-toggle`}
      className="focus-glow flex size-7 items-center justify-center rounded-full border text-[var(--scope-a,var(--gd))] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
      style={{
        borderColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
      }}
    >
      {/* THE TWO FACES OF THE HAND — the icons are drawn by the theme's
          own class, never by the client's memory of it: server and
          client carve the same face, and the water never breaks (no
          hydration drift). */}
      <Sun className="hidden size-3 dark:block" aria-hidden="true" />
      <Moon className="block size-3 dark:hidden" aria-hidden="true" />
    </button>
  );
}

/* --------------- the glyph wall — the realm's floor ------------------
   THE SUGGESTIONS BECOME STONE. The floor is a Maya stele wall: every
   suggestion carved into its own block — a stepped crest rising at its
   head, a Maya count (dots and bars) standing guard, a cartouche of
   the family's ink running beneath the words. The wall fills the
   screen; sliding down uncovers the deep rows (the second family);
   the wall's own reload pours the stone anew. One bloom per stone
   (opacity + transform only, compositor work), no drift, no JS
   clocks — the phone stays cool. */

const GLYPH_FIRST = 20; /* the resting family — twenty stones, no more */
const GLYPH_BATCH = 20; /* the wall grows twenty by twenty — each pour
                           carved in the background, after a breath, so
                           the phone never heats and never lags */
const GLYPH_MAX = 200; /* the wall's whole depth — ten pours, bounded */

/* THE WALK'S OWN LEVEL — the stones the visitor meets follow their
   evolution: a young walk opens gentle doors (reflect, deepen,
   pause) and the deep walk meets the forge-facing movements
   (contrast, apply, create) at its head. Laid as a stable order OVER
   the hour's own seeded shuffle, so the level never breaks the deal. */
const MOVEMENT_LEVEL: Record<
  "first" | "steady" | "deep",
  Record<BranchType, number>
> = {
  first: { reflect: 0, deepen: 1, pause: 1, connect: 2, apply: 3, create: 4, contrast: 4 },
  steady: { deepen: 0, connect: 0, reflect: 1, apply: 1, contrast: 2, create: 2, pause: 3 },
  deep: { contrast: 0, apply: 0, create: 0, deepen: 1, connect: 2, reflect: 2, pause: 3 },
};

interface GlyphWhisper {
  text: string;
  movement: BranchType;
  accent: string;
}

/* THE FIRST STEPS — the newcomer's own stones. Plain, warm, everyday
   whispers a first visitor reads at a glance; the deep grove waits
   beneath, and the wall ADVANCES as the visitor walks (kept on the
   device, never on a server): the third exchange opens the deep
   grove below the plain resting family, the tenth hands the whole
   wall to the deep grove. */
const PLAIN_STONES: GlyphWhisper[] = [
  { text: "Who am I, beneath everything I carry?", movement: "reflect", accent: "#a78bfa" },
  { text: "What does my heart need tonight?", movement: "reflect", accent: "#2dd4bf" },
  { text: "A message I need to hear right now", movement: "deepen", accent: "#f59e0b" },
  { text: "What am I not seeing clearly?", movement: "reflect", accent: "#a78bfa" },
  { text: "Where is my energy going lately?", movement: "deepen", accent: "#34d399" },
  { text: "What should I let go of tonight?", movement: "pause", accent: "#2dd4bf" },
  { text: "A gentle truth about my week ahead", movement: "deepen", accent: "#22d3ee" },
  { text: "What makes me feel alive?", movement: "connect", accent: "#2dd4bf" },
  { text: "Who thinks of me tonight?", movement: "connect", accent: "#22d3ee" },
  { text: "What is my quiet gift to share?", movement: "apply", accent: "#f59e0b" },
  { text: "Show me the next small step on my path", movement: "apply", accent: "#fb7185" },
  { text: "What do my dreams tell me lately?", movement: "deepen", accent: "#2dd4bf" },
  { text: "A word of courage for tomorrow", movement: "create", accent: "#f59e0b" },
  { text: "What is waiting for me to notice it?", movement: "reflect", accent: "#a78bfa" },
  { text: "How do I find calm tonight?", movement: "pause", accent: "#34d399" },
  { text: "What is my body trying to tell me?", movement: "deepen", accent: "#34d399" },
  { text: "The color of my spirit today", movement: "create", accent: "#e879f9" },
  { text: "A picture of my guides watching over me", movement: "create", accent: "#e879f9" },
  { text: "What is my greatest strength right now?", movement: "apply", accent: "#2dd4bf" },
  { text: "What do I need to forgive myself for?", movement: "reflect", accent: "#2dd4bf" },
  { text: "Where does my road lead this season?", movement: "deepen", accent: "#22d3ee" },
  { text: "What would joy do tonight?", movement: "connect", accent: "#f59e0b" },
  { text: "What am I ready to receive?", movement: "connect", accent: "#a78bfa" },
  { text: "A small ritual for my evening", movement: "apply", accent: "#2dd4bf" },
  { text: "What does my home need to feel peaceful?", movement: "apply", accent: "#fb7185" },
  { text: "What is the universe whispering to me?", movement: "deepen", accent: "#22d3ee" },
];

/* THE WALK THAT ADVANCES — the visitor's own steps, kept on the
   device (never on a server): every exchange is one step. */
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

/* THE STONE'S OWN KIND — every stone says plainly what it opens: a
   text answer by the mirror, an image crystallizing, a making
   (creation, manifest), the book, the akashic record. */
type GlyphKind =
  | "mirror"
  | "image"
  | "creation"
  | "manifest"
  | "book"
  | "akashic";

const GLYPH_KIND_LABELS: Record<GlyphKind, string> = {
  mirror: "mirror",
  image: "image",
  creation: "creation",
  manifest: "manifest",
  book: "book",
  akashic: "akashic",
};

function glyphKindForText(text: string): GlyphKind {
  const art = detectArtifactIntent(text);
  if (art) {
    if (art === "book") return "book";
    if (art === "akashic") return "akashic";
    if (art === "manifest") return "manifest";
    return "creation";
  }
  if (isVisualIntent(text)) return "image";
  return "mirror";
}

interface GlyphTileData {
  text: string;
  movement: BranchType;
  accent: string;
  kind: GlyphKind;
  golden?: boolean;
  creation?: CreationDoor;
  topic?: string;
}

/* THE MAYA COUNT — every stone carries its own vigesimal count: one
   dot is one, one bar is five, the shell stands for zero. Drawn from
   the whisper's own hash — the same words always wear the same count.
   Pure divs, painted once, never re-rendered. */
function MayaCount({ n, accent }: { n: number; accent: string }) {
  const v = ((n % 20) + 20) % 20;
  if (v === 0) {
    return (
      <span
        aria-hidden="true"
        className="mt-px inline-block size-[7px] rounded-[50%] border"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
        }}
      />
    );
  }
  const dots = v % 5;
  const bars = Math.floor(v / 5);
  return (
    <span aria-hidden="true" className="flex flex-col items-end gap-[2px]">
      {dots > 0 && (
        <span className="flex gap-[2.5px]">
          {Array.from({ length: dots }, (_, i) => (
            <i
              key={i}
              className="block size-[3.5px] rounded-full"
              style={{ backgroundColor: accent }}
            />
          ))}
        </span>
      )}
      {Array.from({ length: bars }, (_, i) => (
        <i
          key={i}
          className="block h-[3px] w-[15px] rounded-[1.5px]"
          style={{ backgroundColor: accent }}
        />
      ))}
    </span>
  );
}

const GlyphTile = memo(function GlyphTile({
  tile,
  disabled,
  onPick,
  onCreation,
  testId,
  bloomDelay,
}: {
  tile: GlyphTileData;
  disabled?: boolean;
  onPick: (text: string, move: BranchType) => void;
  onCreation: (kind: CreationDoor, topic: string) => void;
  testId: string;
  bloomDelay: number;
}) {
  const t = useT();
  const a = tile.accent;
  const Icon = tile.creation
    ? CREATION_ICON_BY_KIND[tile.creation]
    : (MOVEMENT_ICONS[tile.movement] ?? Layers);
  const label = tile.creation
    ? `${t(CREATION_LABELS[tile.creation])} — ${tile.topic ?? ""}`
    : tile.text;
  return (
    <button
      type="button"
      onClick={() =>
        tile.creation
          ? onCreation(tile.creation, tile.topic ?? tile.text)
          : onPick(tile.text, tile.movement)
      }
      disabled={disabled}
      title={label}
      data-testid={
        tile.golden
          ? `${testId}-glyph-golden`
          : tile.creation
            ? `${testId}-glyph-creation`
            : `${testId}-glyph-tile`
      }
      className="genea-bloom still-bloom focus-glow relative flex h-full flex-col overflow-hidden rounded-[5px] border p-2.5 text-left shadow-[0_4px_16px_-12px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--tile-a)_62%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
      style={
        {
          "--tile-a": a,
          animationDelay: `${bloomDelay}ms`,
          borderColor: tile.golden
            ? "color-mix(in srgb, #f59e0b 50%, transparent)"
            : "color-mix(in srgb, var(--tile-a) 36%, transparent)",
          background: tile.golden
            ? "linear-gradient(168deg, color-mix(in srgb, #f59e0b 15%, var(--background) 85%) 0%, var(--background) 55%, color-mix(in srgb, #f59e0b 7%, var(--background) 93%) 100%)"
            : "linear-gradient(168deg, color-mix(in srgb, var(--tile-a) 11%, var(--background) 89%) 0%, var(--background) 52%, color-mix(in srgb, var(--tile-a) 6%, var(--background) 94%) 100%)",
          boxShadow: tile.golden
            ? "0 0 20px -10px color-mix(in srgb, #f59e0b 55%, transparent)"
            : "0 4px 16px -12px rgba(0,0,0,0.55)",
        } as CSSProperties
      }
    >
      {/* THE CODEX FRAME — one quiet inner ring, carved a step inside
          the stone */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[4px] rounded-[3px] border"
        style={{
          borderColor: tile.golden
            ? "color-mix(in srgb, #f59e0b 22%, transparent)"
            : "color-mix(in srgb, var(--tile-a) 17%, transparent)",
        }}
      />
      {/* THE STONE'S HEADER — the stepped crest rises at the left (the
          pyramid's own silhouette), the Maya count stands at the right */}
      <span
        aria-hidden="true"
        className="relative flex items-start justify-between gap-2"
      >
        <span className="flex flex-col gap-[2px] pt-px">
          <i
            className="block h-[2.5px] w-[22px] rounded-[1px]"
            style={{ backgroundColor: a, opacity: 0.9 }}
          />
          <i
            className="block h-[2.5px] w-[14px] rounded-[1px]"
            style={{ backgroundColor: a, opacity: 0.55 }}
          />
          <i
            className="block h-[2.5px] w-[7px] rounded-[1px]"
            style={{ backgroundColor: a, opacity: 0.32 }}
          />
        </span>
        <MayaCount n={hashWalk(tile.text)} accent={a} />
      </span>
      {/* THE CARVING — the whisper's own words */}
      <span
        className={cn(
          "relative mt-1.5 line-clamp-4 break-words text-[11.5px] leading-[15.5px] sm:text-[12px] sm:leading-[16px]",
          tile.golden
            ? "font-serif italic text-foreground"
            : "text-foreground/90"
        )}
      >
        {label}
      </span>
      {/* THE CARTOUCHE — the movement's own glyph closes the stone, a
          thin line of the family's ink running beneath */}
      <span
        aria-hidden="true"
        className="relative mt-auto flex items-center gap-1.5 pt-2"
      >
        <Icon
          className={cn(
            "size-3 shrink-0",
            tile.golden
              ? "text-[#f59e0b]"
              : "text-[var(--tile-a)] opacity-75"
          )}
        />
        {/* THE KIND — every stone says what it opens, in its own ink */}
        <span
          className={cn(
            "mono-label shrink-0 text-[7px] uppercase tracking-[0.14em]",
            tile.golden
              ? "text-[#f59e0b]"
              : "text-[var(--tile-a)] opacity-70"
          )}
        >
          {t(GLYPH_KIND_LABELS[tile.kind])}
        </span>
        <i
          className="block h-[2px] flex-1 rounded-[1px]"
          style={{
            backgroundColor: tile.golden ? "#f59e0b" : a,
            opacity: 0.35,
          }}
        />
      </span>
    </button>
  );
});

const GlyphWall = memo(function GlyphWall({
  whispers,
  entry,
  stage,
  golden,
  disabled,
  hour,
  salt,
  focusKey,
  onPick,
  onCreation,
  onReload,
  testIdPrefix,
}: {
  whispers: GlyphWhisper[];
  /** THE FIRST STEPS' ENTRY — the plain family the resting rows are
      carved from while the wall still advances (undefined once the
      deep grove owns the whole wall). */
  entry?: GlyphWhisper[];
  /** THE WALK'S OWN LEVEL — the visitor's evolution, reading which
      movements rise to the wall's head. */
  stage: "first" | "steady" | "deep";
  golden: GenealogySeed[];
  disabled?: boolean;
  hour: number;
  salt: number;
  focusKey: string;
  onPick: (text: string, move: BranchType) => void;
  onCreation: (kind: CreationDoor, topic: string) => void;
  onReload: () => void;
  testIdPrefix: string;
}) {
  const t = useT();
  /* THE WALL'S REVEAL — twenty stones stand first; every further
     pour adds twenty more, carved in the background after a breath
     (the pick's own pour and the sliding ear share one hand, so the
     wall never grows twice at once and the phone stays cool) */
  const [visible, setVisible] = useState(GLYPH_FIRST);
  const deepRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (pendingRef.current != null) window.clearTimeout(pendingRef.current);
    },
    []
  );

  const tiles = useMemo(() => {
    const out: GlyphTileData[] = [];
    const seen = new Set<string>();
    /* THE GOLDEN STONES — the exchange's own grown branches stand in
       the wall's first rows, wearing the amber light */
    for (const s of golden) {
      const k = s.text.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        text: s.text,
        movement: s.movement,
        accent: "#f59e0b",
        kind: glyphKindForText(s.text),
        golden: true,
      });
      if (out.length >= 4) break;
    }
    /* the family's own shuffle — the same hour, salt and focus always
       carve the same wall (no hydration drift, no re-shuffle under
       the visitor); a voice never stands twice until the grove has
       spoken */
    const shuffled = seededShuffle(
      whispers,
      hashWalk(`wall:${hour}:${salt}:${focusKey}`)
    );
    /* THE FIRST STEPS' ENTRY — when a plain entry family rides with
       the wall, the resting rows are carved from it and the deep
       rows rise from the whole grove: the wall advances gently. */
    const entryShuffled = entry
      ? seededShuffle(
          entry,
          hashWalk(`wall-entry:${hour}:${salt}:${focusKey}`)
        )
      : null;
    /* THE WALK'S OWN LEVEL — the grove's stones level themselves to
       the visitor's evolution before the wall carves them */
    const level = MOVEMENT_LEVEL[stage];
    const leveled =
      stage === "steady"
        ? shuffled
        : [...shuffled].sort(
            (a, b) => (level[a.movement] ?? 2) - (level[b.movement] ?? 2)
          );
    let resting = 0;
    for (const w of entryShuffled ?? leveled) {
      if (resting >= GLYPH_FIRST || out.length >= GLYPH_MAX) break;
      const k = w.text.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        text: w.text,
        movement: w.movement,
        accent: w.accent,
        kind: glyphKindForText(w.text),
      });
      resting++;
    }
    for (const w of leveled) {
      if (out.length >= GLYPH_MAX) break;
      const k = w.text.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        text: w.text,
        movement: w.movement,
        accent: w.accent,
        kind: glyphKindForText(w.text),
      });
    }
    /* THE CREATION DOOR — one making carved mid-wall, tied to the
       stone it grows from (the branch's own words the making grows
       from) */
    if (out.length >= 5) {
      const h = hashWalk(`door:${hour}:${salt}:${focusKey}`);
      const door = CREATION_DOORS[h % CREATION_DOORS.length].kind;
      const at = 2 + (h % Math.min(9, out.length - 3));
      const topic = out[at].text;
      out.splice(at + 1, 0, {
        text: `${t(CREATION_LABELS[door])} — ${topic}`,
        movement: "create",
        accent: out[at].accent,
        kind: door === "invent" ? "creation" : door,
        creation: door,
        topic,
      });
      if (out.length > GLYPH_MAX) out.pop();
    }
    return out;
  }, [whispers, entry, stage, golden, hour, salt, focusKey, t]);

  /* the wall's length rides a ref — the deferred pours read it
     without re-knitting their own closures (kept current by an
     effect; the pours fire seconds later, long after it runs) */
  const tilesLenRef = useRef(0);
  useEffect(() => {
    tilesLenRef.current = tiles.length;
  }, [tiles.length]);
  const schedulePour = useCallback((delay: number) => {
    if (pendingRef.current != null) return;
    pendingRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      setVisible((v) => Math.min(v + GLYPH_BATCH, tilesLenRef.current));
    }, delay);
  }, []);

  /* THE PICK'S OWN POUR — the moment a stone is pressed, the next
     twenty begin carving themselves in the background; a few seconds
     later they stand ready. No work under the finger, no heat. */
  const handlePick = useCallback(
    (text: string, move: BranchType) => {
      schedulePour(2400);
      onPick(text, move);
    },
    [onPick, schedulePour]
  );

  /* THE DEEP EAR — one IntersectionObserver hears the visitor slide
     toward the wall's foot and pours the next twenty in, after a
     breath. The ear re-arms with every pour until the wall's whole
     depth stands carved. */
  const hasMore = tiles.length > visible;
  useEffect(() => {
    if (!hasMore) return;
    const el = deepRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          schedulePour(1400);
        }
      },
      { root: el.closest("[data-glyph-scroll]"), rootMargin: "220px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visible, schedulePour]);

  const shown = tiles.slice(0, visible);

  /* the deep rows rest again whenever the wall is re-poured — the
     wall is keyed by its own deal at the render site, so a fresh
     pour is a fresh wall (no effect, no state sync) */

  return (
    <div
      role="region"
      aria-label={t("The wall of whispers")}
      data-testid={`${testIdPrefix}-glyph-wall`}
      data-glyph-scroll=""
      className="no-scrollbar absolute inset-0 overflow-y-auto"
      style={{
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* THE FLOOR'S OWN LIGHT — one soft glow behind the stone, the
          focused category's color breathing under the wall */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-56 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--scope-a,var(--gd)) 15%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* THE WALL HAS NO NAMEPLATE — no caption, no side glyph, no
          count: the stones speak for themselves. The pour hand lives
          ONLY at the wall's foot — one pour, one place. */}

      <div className="relative grid auto-rows-[124px] grid-cols-2 gap-2.5 px-3 pb-5 pt-3 sm:auto-rows-[138px] sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {shown.map((tile, i) => (
          <GlyphTile
            key={`${i}:${tile.text}`}
            tile={tile}
            disabled={disabled}
            onPick={handlePick}
            onCreation={onCreation}
            testId={testIdPrefix}
            bloomDelay={Math.min(
              i * 26 + (hashWalk(tile.text) % 40),
              1100
            )}
          />
        ))}
        {/* THE DEEP EAR — the sentinel resting at the wall's foot,
            heard only while deeper rows still wait beneath */}
        {hasMore && (
          <div ref={deepRef} aria-hidden="true" className="col-span-full h-px" />
        )}
      </div>

      {/* THE WALL'S FOOT — the whole family has spoken; one touch pours
          the stone anew. It stands ABOVE the whisper line: fully
          visible at the end of the wall, never behind the input — the
          breath of space below it belongs to the input bar. */}
      {!hasMore && (
        <div className="relative flex justify-center px-3 pb-44">
          <button
            type="button"
            onClick={onReload}
            disabled={disabled}
            aria-label={t("Pour the wall again")}
            data-testid={`${testIdPrefix}-glyph-reload-end`}
            className="focus-glow flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-foreground/90 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 46%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 13%, var(--background))",
            }}
          >
            <RefreshCw
              className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
              aria-hidden="true"
            />
            <span className="text-[12px] italic">
              {t("The wall has spoken — pour it again")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
});

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
  onLatch,
  realm,
  bare,
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
  const openAbout = useMirror((s) => s.openAbout);
  const openProfilePage = useMirror((s) => s.openProfilePage);
  /* THE LEDGER'S OWN HANDS — one opens a saved conversation right
     where it lives, the other restores a kept volume to the reading */
  const openChatSurface = useMirror((s) => s.openChat);
  const resumeKeptVolume = useMirror((s) => s.resumeDreamBook);
  /* THE QUESTION'S QUIET — the mirror's question beneath the mark
     stands only while the floor is quiet: the first word sent (or a
     thread already carrying words) dissolves it, leaving the space
     to the transmission itself. */
  const floorQuiet = useMirror((s) => {
    const sess = s.sessions[s.activeMode];
    return sess.messages.length === 0 && sess.status !== "loading";
  });
  /* THE WHOLE HOUSE'S DOORS — every kategory of the old website's
     sidebar, standing within the branches themselves: the worlds the
     tree grows toward, the archives, and the quiet hands. */
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const openInvent = useMirror((s) => s.openInvent);
  const openLightCodes = useMirror((s) => s.openLightCodes);
  const openParticleX = useMirror((s) => s.openParticleX);
  const openEvolveMed = useMirror((s) => s.openEvolveMed);
  const openArtX = useMirror((s) => s.openArtX);
  const openRegister = useMirror((s) => s.openRegister);
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
     trail's chips re-open their own rooms from the walk's memory. */
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
      import("sonner").then(({ toast }) =>
        toast(t("The making is being born — its room rises when it stands."))
      );
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
     regrows the whole family by itself. Reload every hour, as asked. */
  const [hour, setHour] = useState(() => canopyHour());
  const [salt, setSalt] = useState(0);
  useEffect(() => {
    if (!mounted) return;
    const roll = () => {
      const now = canopyHour();
      setHour((h) => (h === now ? h : now));
    };
    roll();
    const id = window.setInterval(roll, 60_000);
    return () => window.clearInterval(id);
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
    const labels: Record<ChatSurface, string> = {
      os: "Manifest OS",
      px: "Particle X",
      em: "Evolve Med",
      ax: "Akashic",
      forge: "Invent",
      interplanetary: "Interplanetary",
      healing: "Healing codes",
    };
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
  /* THE CROWN'S OWN BREATH — the top bar drops down when the visitor
     needs it and rises up when they don't, so the branches take almost
     the whole sky. One quiet hand at the top-right corner carries it. */
  const [crownUp, setCrownUp] = useState(false);
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

  /* THE FAMILY'S LIGHT — every whisper knows its own family, so every
     seed carries that family's accent to the tree (rope + section;
     the words stay the house's one text color). THE FAMILY'S VOICE —
     the same map resolves which house door the room's own chat
     speaks through: a manifest whisper's room answers as the
     manifest answers, an Art X room as the atelier. */
  const familyByUk = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const w of grove)
      m.set(w.text.toLowerCase(), familyAccent(w.family) ?? undefined);
    return m;
  }, [grove]);
  const familyKeyByText = useMemo(() => {
    const m = new Map<string, string>();
    for (const w of grove) m.set(w.text.toLowerCase(), w.family ?? "");
    return m;
  }, [grove]);
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

  /* THE WALL'S OWN LIGHT — every whisper carries its family's accent:
     the general walk wears every house's colors mixed, a focused
     category wears its own light on every stone. */
  const glyphWhispers = useMemo<GlyphWhisper[]>(
    () =>
      grove.map((w) => ({
        text: w.text,
        movement: w.movement,
        accent: familyAccent(w.family) ?? "var(--scope-a, var(--gd))",
      })),
    [grove]
  );

  /* THE WALL THAT ADVANCES — the visitor's own steps, read after first
     paint (the server always carves the newcomer's wall, no hydration
     drift): every exchange (a stone pressed, a making begun) is one
     step. The first steps wear the plain stones alone; from the third
     exchange the deep grove joins beneath them; from the tenth the
     whole wall belongs to the deep grove. */
  const [walkSteps, setWalkSteps] = useState(0);
  useEffect(() => {
    setWalkSteps(readWalkSteps());
  }, []);
  const bumpWalkSteps = useCallback(() => {
    setWalkSteps(stepWalkOnce());
  }, []);
  const glyphStage: "first" | "steady" | "deep" =
    walkSteps < 3 ? "first" : walkSteps < 10 ? "steady" : "deep";

  /* THE WALL'S OWN PICK — the carved stone speaks: the walk records
     its step (the trail remembers) and the answer rises in the room.
     No graft, no fold, no pan — the wall stands still; the walk lives
     in the trail and in the rooms. */
  const glyphPick = useCallback(
    (text: string, move: BranchType) => {
      if (disabled) return;
      suppressRegrowRef.current = false;
      bumpWalkSteps();
      recordExpansion("pick", { scope: scopeHint ?? null, movement: move });
      recordJourney({ b: category, s: scopeHint ?? undefined });
      recordSeen([text]);
      setLineage((ln) =>
        [...ln.filter((l) => l.text !== text), { id: null, text }].slice(-10)
      );
      zoomOpenedAtRef.current = Date.now();
      const makesSomething =
        detectArtifactIntent(text) !== null || isVisualIntent(text);
      if (!makesSomething) setZoom({ q: text, move });
      onPick(text, askScopeFor(text));
    },
    [
      disabled,
      onPick,
      askScopeFor,
      scopeHint,
      category,
      bumpWalkSteps,
    ]
  );

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
  const idf = useMemo(() => buildIdf(grove.map((w) => w.text)), [grove]);

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
        .slice(0, GLYPH_MAX)
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
    const unique: (typeof grove[number] & { score: number })[] = [];
    for (const w of hits.length === 0
      ? grove.map((w) => ({ ...w, score: 0 }))
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
        expansionScore,
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
     book's loom pre-speaks, the forge strikes — each making born of
     that branch, in the moment, never the same making twice. */
  const openTool = useCallback(
    (kind: "akashic" | "book" | "invent", topic: string) => {
      if (disabled) return;
      recordJourney({ b: category, s: scopeHint ?? undefined });
      bumpWalkSteps();
      setBranchCreationSeed({ kind, topic });
      if (kind === "akashic") openAkashic();
      else if (kind === "book") openDreamBook();
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
      expansionScore,
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
    const beats = [650, 1500, 2350, 3200, 4050, 4900, 5750];
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
          expansionScore,
          BATCH_SIZE
        )
      );
    },
    [idf, seenSnapshot, expansionScore, withAccents]
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
      const fresh = grove.filter((w) => !spentSet.has(w.text.toLowerCase()));
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
         THE MAKING LAW: when the whisper asks the laboratory to MAKE
         something (a record, a book, a card, a song, a poem, a
         painting) the making is born in its own room above the tree —
         the room rises by itself, so the walk never flashes an empty
         answer here. */
      zoomOpenedAtRef.current = Date.now();
      const makesSomething =
        detectArtifactIntent(node.text) !== null || isVisualIntent(node.text);
      if (!makesSomething) setZoom({ q: node.text, move: node.movement });
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

  /* THE WALK CONTINUES FROM THE ANSWER — a branch grown on the reply,
     pressed inside the panel, keeps the walk going from the family's
     last standing place: the trail grows, a new house is grafted from
     the pressed chip's own node, and the next answer replaces this one
     in the same quiet room. */
  const sendFromPanel = useCallback(
    (text: string, move: BranchType | null, attachments?: ChatAttachment[]) => {
      if (disabled || liveLoading || !text.trim()) return;
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
        const fresh = grove.filter((w) => !spent.has(w.text.toLowerCase()));
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
      const makesSomething =
        detectArtifactIntent(text) !== null || isVisualIntent(text);
      if (!makesSomething) setZoom({ q: text, move });
      /* THE LANDING'S OWN LAW — docked in the threshold the ask is
         always the reflection mirror itself: no category, no scope —
         the mirror's humble voice answers from the open floor. The
         full portal keeps every scope's own door. */
      onPick(text, bare ? undefined : askScopeFor(text), attachments);
    },
    [
      bare,
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
      expansionScore,
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
  const liveAnswerText = liveBelongsToRoom ? (liveAnswer ?? "").trim() : "";
  const roomError =
    liveBelongsToRoom || !liveLoading ? liveError ?? null : null;
  const restoredText = zoom?.restored ?? null;
  const answer = restoredText ?? liveAnswerText;
  const answerLanded = restoredText
    ? true
    : !liveLoading && liveAnswerText.length > 0;
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
      const roomQ = zoom.q;
      /* THE FAMILY'S VOICE — the room speaks through the door of the
         family its own whisper was grown from (the manifest room as
         the manifest, the atelier room as the atelier); a whisper the
         grove doesn't know keeps the channel's own door. */
      const famKey = familyKeyByText.get(roomQ.toLowerCase());
      const roomCategory: BranchId =
        TREE_FAMILIES.find((f) => f.key === famKey)?.category ?? category;
      const prior = threadRef.current
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
        const reply = await speakWithTransmission(
          roomCategory,
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
            i === t.length - 1 ? { ...turn, a: reply, loading: false } : turn
          )
        );
      } catch {
        applyRoomTurn(roomQ, (t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? { ...turn, loading: false, failed: true }
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
      category,
      disabled,
      familyKeyByText,
      language,
      lineage,
      threadBusy,
      zoom,
    ]
  );

  /* the thread's own pin — the newest answer keeps the eye while the
     visitor stays at the bottom of the room */
  useEffect(() => {
    if (thread.length === 0) return;
    const el = bodyRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [thread]);

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
  /* THE FLOOR'S OWN CARGO — the paperclip and the camera's eye for the
     realm's own whisper line (one image, three documents) */
  const [askAtts, setAskAtts] = useState<ChatAttachment[]>([]);

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
  const floorLiveScope: LiveScopeKey =
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
        "absolute inset-0 z-20 flex min-h-0 flex-col bg-background transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
      {/* ------------------------- the crown's breath -----------------
          THE TOP BAR DROPS DOWN WHEN NEEDED AND RISES UP WHEN NOT:
          one quiet hand at the top-right corner folds the whole crown
          away and the branches take almost the whole sky. The hand
          itself never leaves — it is the way back down.
          THE ONE JOB LAW — the hand hides and shows the top bar and
          NOTHING else: it floats above every room (a folded crown in a
          standing room never buries it), so bringing the bar back never
          closes the room, never returns the branches — the screen stays
          exactly where the visitor stands. */}
      <div className="relative shrink-0">
        <div
          aria-hidden={realm && crownUp ? true : undefined}
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            realm && crownUp ? "max-h-0 opacity-0" : "max-h-36 opacity-100",
            /* the crown's own dropdowns must never be clipped — the
               fold only clips when the crown itself is folded away */
            crownMenu ? "overflow-visible" : "overflow-hidden"
          )}
        >
      <div
        className={cn(
          "shrink-0 bg-background px-3 pb-1 sm:px-5",
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
          {/* THE CROWN'S OWN ROW — the walk's steering at the left, the
              doors and the passage at the right. THE MARK HAS LEFT THE
              TOP BAR — no logo stands in the crown; the light's own
              hand (a quiet sun/moon) rides with the doors instead. */}
          <div className="contents">
          {/* THE LANDING'S QUIET CROWN — docked in the threshold the
              crown keeps only its calm doors: the walk's menu and the
              categories' mix stand down (no scope ever rules the
              landing's floor), and the akashic and book doors wait for
              the full portal. The light, the about door, the crossing
              and the passage remain. */}
          {!bare && (<>
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
                  className="nice-scroll absolute left-0 top-9 z-40 max-h-[78vh] w-[286px] overflow-y-auto rounded-2xl border bg-background p-3 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.6)]"
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
                    <span className="mono-label min-w-0 flex-1 truncate text-[9px] uppercase tracking-[0.16em] text-foreground/85">
                      {mixTitle(mix, t)}
                    </span>
                    <span
                      className="mono-label shrink-0 text-[9px] tabular-nums text-muted-foreground/70"
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
                      <p className="mono-label px-2 pb-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/60">
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
                                "mono-label w-4 shrink-0 text-[8px] tabular-nums",
                                latest
                                  ? "text-[var(--scope-a,var(--gd))]"
                                  : "text-muted-foreground/50"
                              )}
                            >
                              {i + 1}
                            </span>
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[12px]",
                                latest
                                  ? "font-medium text-[var(--scope-a,var(--gd))]"
                                  : "text-foreground/85"
                              )}
                            >
                              {l.text}
                            </span>
                            {latest && (
                              <span className="mono-label shrink-0 animate-pulse text-[7.5px] uppercase tracking-[0.16em] text-[var(--scope-a,var(--gd))]">
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
                      <p className="mono-label px-2 pb-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/60">
                        {t("The walk's ledger")}
                      </p>
                      {walkLedger.volumes.length > 0 && (
                        <div data-testid={`${testIdPrefix}-ledger-books`}>
                          <p className="px-2 pb-0.5 text-[10px] italic text-muted-foreground/70">
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
                              <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">
                                {v.title}
                              </span>
                              <span className="mono-label shrink-0 text-[8px] tabular-nums text-muted-foreground/60">
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
                          <p className="px-2 pb-0.5 text-[10px] italic text-muted-foreground/70">
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
                              <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/85">
                                {c.title}
                              </span>
                              <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.1em] text-muted-foreground/60">
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
                          <p className="px-2 pb-0.5 text-[10px] italic text-muted-foreground/70">
                            {t("The journey kept")}
                          </p>
                          {walkLedger.journey.slice(0, 5).map((j, i) => (
                            <div
                              key={`${j.at}-${i}`}
                              className="flex items-center gap-2 px-2 py-1"
                            >
                              <span
                                aria-hidden="true"
                                className="mono-label w-14 shrink-0 text-[8px] tabular-nums text-muted-foreground/50"
                              >
                                {new Date(j.at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground/85">
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
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/90">
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
                  "mono-label whitespace-nowrap text-[9px] uppercase tracking-[0.14em]",
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
                  className="absolute left-0 top-9 z-40 w-[286px] rounded-2xl border bg-background p-3 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.6)]"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                  }}
                >
                  <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
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
                        <span className="block truncate text-[12.5px] font-medium text-foreground">
                          {t("General")}
                        </span>
                        <span className="mono-label block truncate text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                          {t("The whole house, mixed")}
                        </span>
                      </span>
                      {mixIsGeneral(mix) && (
                        <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
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
                            import("sonner").then(({ toast }) =>
                              toast(t("The walk focuses on {name}", {
                                name: t(familyLabelKeys[f.key] ?? f.key),
                              }))
                            );
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
                              <span className="truncate text-[12.5px] text-foreground/90">
                                {t(familyLabelKeys[f.key] ?? f.key)}
                              </span>
                              {share.on && share.pct !== 100 && (
                                <span
                                  className="mono-label shrink-0 text-[9px] tabular-nums"
                                  style={{ color: f.accent }}
                                >
                                  {share.pct}%
                                </span>
                              )}
                              {focused && (
                                <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                                  {t("You are here")}
                                </span>
                              )}
                            </span>
                            <span className="mono-label mt-0.5 block truncate text-[8.5px] normal-case tracking-[0.02em] text-muted-foreground/70">
                              {t(spirit?.spirit ?? f.key)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p
                    className="mt-2.5 border-t px-1 pt-2 text-[10.5px] italic leading-relaxed text-muted-foreground/75"
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

          {/* THE LIGHT'S OWN HAND — the crown's quiet sun/moon: the
              mark left the top bar, the toggle stayed */}
          {realm && <LightToggle testIdPrefix={testIdPrefix} />}

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
                keeps the calm crown */}
            {!bare && (
            <button
              type="button"
              onClick={openAkashic}
              aria-label={t("Akashic")}
              title={t("Akashic")}
              data-testid={`${testIdPrefix}-door-akashic`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <ScrollText className="size-3" aria-hidden="true" />
            </button>
            )}
            {!bare && (
            <button
              type="button"
              onClick={openDreamBook}
              aria-label={t("Book")}
              title={t("Book")}
              data-testid={`${testIdPrefix}-door-book`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <BookOpen className="size-3" aria-hidden="true" />
            </button>
            )}
            <button
              type="button"
              onClick={openAbout}
              aria-label={t("About us")}
              title={t("About us")}
              data-testid={`${testIdPrefix}-door-about`}
              className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            >
              <Info className="size-3" aria-hidden="true" />
            </button>
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
            realm && "pr-11 sm:pr-12"
          )}>
            {headerExtra && (
              <div className="hidden items-center gap-1.5 sm:flex">{headerExtra}</div>
            )}
            {!realm && <ExpansionRing />}
            {realm ? (
              /* THE TOP ROW'S RIGHT HAND — at its very right stands the
                 visitor's own passage (the profile room, where the score
                 mirror and the settings live). THE RENEWING HAND MOVED
                 INSIDE THE CHAT — the floor's whisper line and every
                 room carry the reload now, so the crown stays a calm
                 compass of doors. THE ICON ITSELF — the passage always
                 wears the visitor's own figure: a person, never an
                 arrow. Guests find the way in INSIDE the passage;
                 walkers leave from the same room. */
              <button
                type="button"
                onClick={openProfilePage}
                aria-label={t("Passage")}
                title={t("Passage")}
                data-testid={`${testIdPrefix}-door-passage`}
                className="focus-glow flex size-7 items-center justify-center rounded-full border text-[var(--scope-a,var(--gd))] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
                }}
              >
                <UserRound className="size-3" aria-hidden="true" />
              </button>
            ) : (
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
          </div>
          </div>
        </div>

        {/* THE SECOND ROW IS GONE — the doors of the house (akashic ·
            book · about · exit) ride the very top row now, and the
            passage stands at the top row's extreme right: one calm
            compass, no second rank beneath it. */}
      </div>
        </div>
        {realm && (
          <button
            type="button"
            onClick={() => {
              setCrownMenu(null);
              setCrownUp((u) => !u);
            }}
            aria-expanded={!crownUp}
            aria-label={crownUp ? t("Show the top bar") : t("Hide the top bar")}
            title={crownUp ? t("Show the top bar") : t("Hide the top bar")}
            data-testid={`${testIdPrefix}-crown-toggle`}
            className="focus-glow absolute z-40 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-[0_8px_22px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
            style={{
              top: "max(0.5rem, env(safe-area-inset-top))",
              right: "max(0.75rem, env(safe-area-inset-right))",
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
            }}
          >
            {crownUp ? (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

        {/* --------------------- the walkable family --------------------- */}
      <div className="relative min-h-0 flex-1">
        {/* THE CENTRE IS CLEAR — the house's logo no longer stands at
            the heart of the realm: it lives nowhere now — the mark has
            left the crown too.
        THE GLYPH WALL — the realm's floor is a Maya stele wall: every
            suggestion carved into its own stone (stepped crest, Maya
            count, cartouche), the wall filling the screen, sliding
            down uncovering the deep rows, the reload pouring the stone
            anew. One bloom per stone, compositor only: smooth, alive,
            and cool. The theme pages keep the genealogy tree. */}
        {realm && !bare ? (
          <GlyphWall
            key={`${hour}:${salt}:${focusKey}`}
            whispers={glyphStage === "first" ? PLAIN_STONES : glyphWhispers}
            entry={glyphStage === "steady" ? PLAIN_STONES : undefined}
            stage={glyphStage}
            golden={goldenSeeds}
            disabled={disabled}
            hour={hour}
            salt={salt}
            focusKey={focusKey}
            onPick={glyphPick}
            onCreation={openTool}
            onReload={renew}
            testIdPrefix={testIdPrefix}
          />
        ) : realm && bare ? (
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
                className="lp-breathe h-64 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at center, color-mix(in srgb, var(--scope-a,var(--gd)) 16%, transparent), transparent 70%)",
                }}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 pb-28">
              <Image
                src="/images/ai/mark-dark.png"
                alt=""
                width={64}
                height={64}
                className="lp-breathe size-16 rounded-full opacity-90"
              />
              <div className="flex flex-col items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-px w-16 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--scope-a,var(--gd))_50%,transparent)] to-transparent"
                />
                {/* THE MIRROR'S QUESTION — below the mark, inside the
                    chat box itself: it stands only while the floor is
                    quiet, and the first word sent dissolves it, leaving
                    the space to the transmission. Pointer events stay
                    none by inline law — a bare <p> would re-arm the
                    docked lens and stop the threshold's scroll. */}
                {floorQuiet && (
                  <p
                    data-testid="mirror-ask"
                    className="genea-bloom still-bloom max-w-[300px] px-6 text-center font-[family-name:var(--font-literata)] text-[13.5px] italic leading-relaxed text-[#e8d9b0] sm:max-w-[360px] sm:text-[14.5px]"
                    style={{ pointerEvents: "none" }}
                  >
                    {t("what do you wish to remember dear one?")}
                  </p>
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
                <p className="genea-bloom still-bloom max-w-[460px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,transparent)] bg-background px-4 py-2.5 text-[13.5px] leading-relaxed text-muted-foreground shadow-[0_6px_24px_-14px_rgba(0,0,0,0.45)]">
                  {introSub}
                </p>
              )}
              {introSubExtra && (
                <p className="genea-bloom still-bloom max-w-[440px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] bg-background px-4 py-2 text-[13px] italic leading-relaxed text-muted-foreground/80 shadow-[0_6px_24px_-14px_rgba(0,0,0,0.45)]">
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
              <p className="genea-bloom still-bloom max-w-[520px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_20%,transparent)] bg-background px-4 py-2 text-center text-[12.5px] leading-relaxed text-muted-foreground shadow-[0_6px_24px_-14px_rgba(0,0,0,0.45)]">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = askDraft.trim();
                if (!q || disabled || liveLoading) return;
                const carried = askAtts.filter((a) =>
                  a.kind === "image" ? !!a.dataUrl : !a.reading && !!a.text
                );
                setAskDraft("");
                setAskAtts([]);
                sendFromPanel(q, null, carried);
              }}
              className={cn(
                "pointer-events-auto flex w-full max-w-[560px] items-center gap-2 rounded-full border py-1.5 pl-2.5 pr-1.5 shadow-[0_10px_36px_-16px_rgba(0,0,0,0.55)] transition-colors duration-300 focus-within:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]",
                /* THE COOL FLOOR — docked in the threshold (bare) the
                   line wears an opaque coat and no backdrop blur: a
                   live blur over a scrolling page is heat the phone
                   must not pay for a lens. */
                bare
                  ? "bg-background"
                  : "bg-background/95 backdrop-blur-xl"
              )}
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 26%, transparent)",
              }}
            >
              {/* THE INPUT'S OWN CALM — the reload and the star have
                  left the whisper line: the cargo, the call, the words,
                  the send. */}
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
                withAttachments={!bare}
                disabled={disabled || liveLoading}
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
                  setLiveCallScope(bare ? "communion" : floorLiveScope)
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
                {t("Whisper to the tree…")}
              </label>
              <input
                id={`${testIdPrefix}-ask`}
                value={askDraft}
                onChange={(e) => setAskDraft(e.target.value)}
                placeholder={t("Whisper to the tree…")}
                disabled={disabled}
                autoComplete="off"
                data-testid={`${testIdPrefix}-ask-input`}
                className="min-w-0 flex-1 bg-transparent py-1 text-[13.5px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={disabled || liveLoading || !askDraft.trim()}
                aria-label={t("Send")}
                data-testid={`${testIdPrefix}-ask-send`}
                className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--scope-a,var(--gd))] to-[color-mix(in_srgb,var(--scope-b,var(--pk))_70%,var(--scope-a,var(--gd)))] text-[#101010] shadow-[0_0_14px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)] transition-all duration-300 hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
              >
                <Send className="size-3.5" aria-hidden="true" />
              </button>
            </form>
          </div>
        )}

        {/* ------------------- THE ZOOM — the veil -------------------
            the family steps back into a quiet backdrop; the veil is
            heavy enough that no tree line ever shows behind the room */}
        {zoomed && (
          <div
            onClick={exitZoom}
            aria-hidden="true"
            data-testid={`${testIdPrefix}-veil`}
            className="canopy-veil absolute inset-0 z-20 bg-[color-mix(in_srgb,var(--background)_68%,transparent)]"
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
              className="canopy-panel pointer-events-auto flex min-h-0 w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_28px_80px_-32px_rgba(0,0,0,0.65)]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              {/* the question — the whisper the visitor walked to;
                  NO remount key: the panel itself never leaves the tree
                  when the walk turns to the next branch, only the room
                  inside it changes — the transmission glides, no flicker */}
              <header
                className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-2.5 pr-11 sm:px-5 sm:pr-12"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--hairline) 70%, transparent)",
                  /* the crown's own corner — when the crown is folded the
                     room rises to the very top of the screen: its buttons
                     yield the corner to the floating top-bar hand (and
                     clear the notch's safe band) */
                  paddingTop: crownUp
                    ? "max(0.5rem, env(safe-area-inset-top))"
                    : undefined,
                }}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                    aria-hidden="true"
                  >
                    <ZoomIcon className="size-3.5 text-[var(--scope-a,var(--gd))]" />
                  </span>
                  <div className="min-w-0">
                    {zoom.move && (
                      <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {t(BRANCH_TYPE_LABELS[zoom.move])}
                      </p>
                    )}
                    {zoom.restored && (
                      <p className="mono-label text-[8px] uppercase tracking-[0.2em] text-[var(--scope-a,var(--gd))]">
                        {t("Returned to the walk")}
                      </p>
                    )}
                    <p className="break-words text-[14px] font-medium leading-snug text-foreground">
                      {zoom.q}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* THE RENEWING HAND — the reload lives in the chat:
                      the family behind the room is re-grown fresh. */}
                  <button
                    type="button"
                    onClick={renew}
                    disabled={disabled}
                    aria-label={t("New branches")}
                    title={t("New branches")}
                    data-testid={`${testIdPrefix}-zoom-renew`}
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
                className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4"
              >
                <div key={zoom.q} className="room-swap mx-auto max-w-[720px]">
                  {zoom && (
                    <ResonantStageBadge
                      category={categoryForMove(zoomMove)}
                      moveLabel={zoom.move ? t(BRANCH_TYPE_LABELS[zoom.move]) : null}
                      visible={revealStage >= 1}
                    />
                  )}
                  {answer ? (
                    revealStage >= 2 ? (
                      <div className="relative">
                        <div className="canopy-answer whitespace-pre-wrap break-words text-[14.5px] leading-[1.75] text-foreground/90 sm:text-[15px]">
                          {answer}
                          {liveLoading && (
                            <span
                              aria-hidden="true"
                              className="ml-1 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse rounded-[2px] bg-[var(--scope-a,var(--gd))] align-baseline opacity-70"
                            />
                          )}
                        </div>
                        {/* THE COPY HAND — the words are the visitor's */}
                        {!liveLoading && (
                          <div className="mt-0.5 flex justify-end">
                            <RoomCopyButton
                              text={answer}
                              testId={`${testIdPrefix}-zoom-copy`}
                            />
                          </div>
                        )}
                      </div>
                    ) : null
                  ) : roomError && !liveLoading && revealStage >= 2 ? (
                    /* THE ROOM'S HONESTY — an ask that could not cross
                       shows its reason right here; the walk stands. */
                    <div
                      className="my-2 rounded-2xl border border-[color-mix(in_srgb,#f43f5e_38%,transparent)] bg-[color-mix(in_srgb,#f43f5e_7%,var(--background))] px-4 py-3.5"
                      role="alert"
                      data-testid={`${testIdPrefix}-zoom-error`}
                    >
                      <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-[#f43f5e]">
                        {t("The transmission could not cross")}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
                        {roomError}
                      </p>
                    </div>
                  ) : (
                    revealStage >= 2 && (
                      <div className="py-5 text-muted-foreground">
                        <MirrorChanneling
                          label={t("Channeling")}
                          className="mono-label text-[10px] uppercase tracking-[0.22em]"
                        />
                      </div>
                    )
                  )}

                  {/* STAGE 3 — the narrator's honest status: the loading
                      indicator while the voice gathers, the bars while he
                      reads. No button stands at the bottom of the text
                      anymore — his gate lives at the top of the room. */}
                  {zoom && (
                    <NarrationStatusLine
                      roomId={walkNodeId(zoom.q)}
                      visible={revealStage >= 3 && answerLanded}
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
                          className="flex flex-col gap-2"
                        >
                          <p className="ml-auto max-w-[88%] whitespace-pre-wrap break-words text-[13px] font-medium leading-relaxed text-foreground">
                            {turn.q}
                          </p>
                          {turn.loading ? (
                            <MirrorChanneling
                              compact
                              label={t("The transmission is listening…")}
                              className="py-1 mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground"
                            />
                          ) : turn.a ? (
                            <div className="flex items-start gap-1">
                              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[14.5px] leading-[1.7] text-foreground/90">
                                {turn.a}
                              </p>
                              <RoomCopyButton
                                text={turn.a}
                                testId={`${testIdPrefix}-room-copy-${i}`}
                              />
                            </div>
                          ) : turn.failed ? (
                            <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground/60">
                              {t("The field is quiet — speak once more")}
                            </p>
                          ) : null}
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
                className="flex shrink-0 flex-col gap-2.5 border-t px-4 py-2.5 sm:px-6 sm:py-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--hairline) 70%, transparent)",
                }}
              >
                {/* STAGE 4 — the next horizon, dropped down to explore */}
                {!liveLoading && answer && revealStage >= 4 && contSeeds.length > 0 && (
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
                      <span className="mono-label min-w-0 flex-1 truncate text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("Branches of this transmission")}
                      </span>
                      <span
                        className="mono-label shrink-0 rounded-full border px-1.5 py-0.5 text-[8.5px] leading-none tabular-nums"
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
                                <span className="mono-label block text-[8px] uppercase tracking-[0.18em] text-muted-foreground/60">
                                  {t(BRANCH_TYPE_LABELS[b.type])}
                                </span>
                                <span className="mt-1 block whitespace-pre-wrap break-words text-[13.5px] leading-snug text-foreground/90">
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
                  leading={
                    /* THE CATEGORY'S OWN CALL — the room's direct line */
                    <button
                      type="button"
                      onClick={() => setLiveCallScope(roomLiveScope)}
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
