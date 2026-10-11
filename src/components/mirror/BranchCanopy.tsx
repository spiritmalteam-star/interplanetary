"use client";

import {
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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  LoaderCircle,
  Maximize2,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  TreeDeciduous,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  canopyHour,
  familyAccent,
  growMixedCanopy,
  TREE_FAMILIES,
} from "@/lib/data/suggestion-banks";
import type { BranchId } from "@/lib/data/suggestion-tree";
import {
  buildIdf,
  buildResonanceField,
  rankWhispers,
} from "@/lib/resonance";
import {
  BRANCH_TYPE_LABELS,
  loadSeen,
  recordJourney,
  recordSeen,
  type BranchType,
  type LearnedBranch,
} from "@/lib/learning-branches";
import {
  BATCH_SIZE,
  buildExtensionTopology,
  buildGraftTopology,
  buildSeedTopology,
  layTree,
  type GenealogyNode,
  type GenealogySeed,
  type GenealogyTopology,
  type LaidTree,
} from "@/lib/genealogy";
import { recordExpansion, readExpansionScore } from "@/lib/expansion";
import { ExpansionRing } from "./ExpansionMirror";
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

/* ---------------- the tree mix — the compass's memory ----------------

   THE GENERAL LAW. The tree's default branch is GENERAL: every
   family's whispers woven into one connected grove. The compass lets
   the visitor choose which families the walk explores, and the mix —
   fifty percent interplanetary, twenty percent quantum, and so on —
   decides which suggestions appear more often. The mix persists on
   the visitor's own device: the whole app is becoming the walk. */

interface TreeMix {
  on: string[];
  weights: Record<string, number>;
}

const MIX_STORE_KEY = "mirror:tree-mix";

function allFamilyKeys(): string[] {
  return TREE_FAMILIES.map((f) => f.key);
}

function evenWeights(): Record<string, number> {
  const w: Record<string, number> = {};
  for (const f of TREE_FAMILIES) w[f.key] = 1;
  return w;
}

function defaultTreeMix(): TreeMix {
  return { on: allFamilyKeys(), weights: evenWeights() };
}

function loadTreeMix(): TreeMix | null {
  try {
    const raw = window.localStorage.getItem(MIX_STORE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TreeMix;
    if (!v || !Array.isArray(v.on) || !v.weights) return null;
    const on = v.on.filter((k) => TREE_FAMILIES.some((f) => f.key === k));
    if (on.length === 0) return null;
    const weights: Record<string, number> = {};
    for (const f of TREE_FAMILIES) {
      const n = Number(v.weights[f.key]);
      weights[f.key] =
        Number.isFinite(n) && n > 0 ? Math.min(100, Math.round(n)) : 0;
    }
    if (!on.some((k) => (weights[k] ?? 0) > 0)) return null;
    return { on, weights };
  } catch {
    return null;
  }
}

function saveTreeMix(m: TreeMix) {
  try {
    window.localStorage.setItem(MIX_STORE_KEY, JSON.stringify(m));
  } catch {
    /* quiet — the mix is a preference, never a promise */
  }
}

/** True when the mix is the whole house in even voices — GENERAL. */
function mixIsGeneral(m: TreeMix): boolean {
  const ws = TREE_FAMILIES.map((f) =>
    m.on.includes(f.key) ? (m.weights[f.key] ?? 0) : 0
  );
  return ws.every((w) => w > 0) && new Set(ws).size === 1;
}

/** The compass's word for where the walk stands — GENERAL, or the
    families the mix carries, named and counted. */
function mixTitle(
  m: TreeMix,
  t: (k: string) => string
): string {
  if (mixIsGeneral(m)) return t("General");
  const onFams = TREE_FAMILIES.filter(
    (f) => m.on.includes(f.key) && (m.weights[f.key] ?? 0) > 0
  );
  if (onFams.length === 0) return t("General");
  const names = onFams
    .slice(0, 2)
    .map((f) => t(familyLabelKeys[f.key] ?? f.key));
  return (
    names.join(" · ") + (onFams.length > 2 ? ` +${onFams.length - 2}` : "")
  );
}

/* -------- the family's own light — rope + section, one text ----------
   Each chip and each rope wears its family's color through the
   --chip-a custom property; the words always wear the house's one
   text color. The existing color classes read var(--chip-a) — the
   still canvas never re-renders for color, only for family. */

const familyLabelKeys: Record<string, string> = {
  interplanetary: "Interplanetary",
  manifest: "Manifest",
  quantum: "Quantum",
  evolvemed: "Evolve Med",
  invent: "Invent",
  healing: "Healing",
  artx: "Art X",
};

/* -------- the room's conversation — speak with the transmission ------

   THE TRANSMISSION LISTENS. Inside a branch's room the visitor can
   speak with the transmission itself: their words travel through the
   scope's own door — the channels' transmission voice for the
   interplanetary, healing and invent lines, the atelier for Art X,
   the OS for the manifest, quantum and evolve med houses — and the
   transmission answers in place, the conversation of the branch kept
   inside the branch. The room's reply line is this conversation; the
   branches dropdown remains the walk. */

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
  language: string
): Promise<string> {
  if (category === "artx") {
    const res = await fetch("/api/artx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        language,
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
  if (category === "manifesting" || category === "quantum" || category === "evolvemed") {
    const res = await fetch("/api/mirror-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        language,
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
  const label = open ? t("Hide the branches") : t("Summon the branches");
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
        aria-label={t("Summon the branches")}
        title={t("Summon the branches")}
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
  latestReveal,
  chainSet,
  pickedId,
  flashId,
  narrow,
  disabled,
  onPick,
  sentinelRef,
  testIdPrefix,
}: {
  tree: LaidTree;
  batchCount: number;
  latestReveal: 1 | 2 | 3;
  chainSet: Set<string>;
  pickedId: string | null;
  flashId: string | null;
  narrow: boolean;
  disabled?: boolean;
  onPick: (node: GenealogyNode) => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
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
      if (b < batchCount - 1 || n.wave < latestReveal) out.push(n);
    }
    return out;
  }, [tree, batchCount, latestReveal]);

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
    nodes.forEach((n, ni) => {
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
        delay: Math.min(n.wave * 130 + (ni % 12) * 26, 640),
      });
    });
    return out;
  }, [nodes, tree, chainSet]);

  /* the trunk's own arms — from the trunk's crown to the first row and
     the golden row (the root's children) */
  const trunkTop = geo.height - geo.trunkH;
  const trunkArms = useMemo(() => {
    const out: { d: string; key: string; chain: boolean }[] = [];
    for (const n of nodes) {
      if (n.parent) continue;
      out.push({
        key: `ta-${n.id}`,
        d: `M ${geo.width / 2} ${trunkTop + 8} C ${geo.width / 2} ${trunkTop + 26}, ${n.x} ${n.y - 34}, ${n.x} ${n.y}`,
        chain: chainSet.has(n.id),
      });
    }
    return out;
  }, [nodes, geo.width, trunkTop, chainSet]);

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

      {/* the trunk — one breathing line rising from the input bar */}
      <div
        aria-hidden="true"
        className="animate-line-breathe absolute"
        style={{
          left: geo.width / 2 - 1,
          bottom: 0,
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
          bottom: -26,
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
      {nodes.map((n, i) => {
        const deep = n.score >= 2.4;
        const attuned = !deep && n.score > 0;
        const Icon = MOVEMENT_ICONS[n.movement] ?? Layers;
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
            title={t(BRANCH_TYPE_LABELS[n.movement])}
            data-testid={
              n.golden
                ? `${testIdPrefix}-crown-chip`
                : isPicked
                  ? `${testIdPrefix}-whisper-picked`
                  : `${testIdPrefix}-whisper`
            }
            className={cn(
              "genea-bloom focus-glow absolute z-10 flex flex-col items-start gap-[3px] rounded-2xl border px-[13px] py-[9px] text-left shadow-[0_3px_14px_-8px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
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
                animationDelay: `${n.golden ? i * 40 : Math.min(n.wave * 130 + (i % 12) * 26, 640)}ms`,
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
}: {
  roomKey: string;
  disabled?: boolean;
  onSend: (text: string) => void;
  testIdPrefix: string;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [seenKey, setSeenKey] = useState(roomKey);
  if (roomKey !== seenKey) {
    setSeenKey(roomKey);
    if (draft !== "") setDraft("");
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = draft.trim();
        if (!q) return;
        setDraft("");
        onSend(q);
      }}
      className="flex items-center gap-1.5 rounded-full border py-1 pl-3.5 pr-1 transition-colors duration-300 focus-within:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
      style={{
        borderColor:
          "color-mix(in srgb, var(--hairline) 80%, transparent)",
      }}
    >
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
  onLatch,
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
  onPick: (q: string) => void;
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
  /** THE LATCH — true while the answer lives in the tree (the zoom);
      the chat keeps its rest strip resting while the walk holds. */
  onLatch?: (latched: boolean) => void;
}) {
  const t = useT();
  const language = useMirror((s) => s.language);

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
     THE QUIET FIELD — a transmission that returned nothing (an error
     held by the chat behind) sends the visitor gently back to the walk.
     Both render-time guarded (the official pattern — the engine never
     renders synchronously inside an effect). */
  const [seenLiveKey, setSeenLiveKey] = useState<string | null>(null);
  const liveKey =
    mounted && liveLoading && liveQuestion ? liveQuestion : null;
  if (liveKey && liveKey !== seenLiveKey) {
    setSeenLiveKey(liveKey);
    if (zoom?.q !== liveKey) setZoom({ q: liveKey, move: null });
  } else if (!liveLoading && seenLiveKey !== null) {
    /* the next transmission zooms again — even the very same words */
    setSeenLiveKey(null);
  }
  /* a live room whose transmission returned nothing folds back to the
     walk; a RESTORED room (a previous branch re-opened from the trail)
     is its own words — the guard never touches it. */
  if (zoom && !zoom.restored && !liveLoading && !liveAnswer) {
    setZoom(null);
  }

  const exitZoom = useCallback(() => setZoom(null), []);

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
     GENERAL: every family woven together. The visitor's own mix (which
     families, how much of each) joins after first paint from their own
     device, then freezes for the tree's lifetime until they reshape it. */
  const [mix, setMixState] = useState<TreeMix>(() => defaultTreeMix());
  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => {
      const saved = loadTreeMix();
      if (saved) setMixState(saved);
    }, 0);
    return () => window.clearTimeout(id);
  }, [mounted]);
  const applyMix = useCallback((next: TreeMix) => {
    setMixState(next);
    saveTreeMix(next);
  }, []);
  const [mixOpen, setMixOpen] = useState(false);

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

  /* THE MIX — the slider's word is law: how much of each family the
     grove carries, and which suggestions visit more often. The house
     rescales around every word: raising one family to fifty percent
     makes the whole house speak fifty percent of it, the rest sharing
     what remains in their own proportions. */
  const setFamilyWeight = useCallback(
    (key: string, v: number) => {
      const value = Math.max(0, Math.min(100, v));
      if (value <= 0) {
        /* the family rests — the others keep their proportions; the
           walk never walks empty (the last family always stays) */
        const weights = { ...mix.weights, [key]: 0 };
        const remaining = TREE_FAMILIES.filter(
          (f) => f.key !== key && (weights[f.key] ?? 0) > 0
        );
        if (remaining.length === 0) {
          applyMix({ on: [key], weights: { ...weights, [key]: 1 } });
          return;
        }
        applyMix({
          on: remaining.map((f) => f.key),
          weights,
        });
        return;
      }
      const rest = 100 - value;
      const others = TREE_FAMILIES.filter((f) => f.key !== key);
      const onOthers = others.filter((f) => (mix.weights[f.key] ?? 0) > 0);
      const weights: Record<string, number> = { [key]: value };
      if (onOthers.length > 0) {
        const sumOthers = onOthers.reduce(
          (a, f) => a + (mix.weights[f.key] ?? 0),
          0
        );
        for (const f of onOthers) {
          weights[f.key] = Math.max(
            1,
            Math.round(((mix.weights[f.key] ?? 0) / sumOthers) * rest)
          );
        }
      } else {
        const even = Math.max(1, Math.round(rest / others.length));
        for (const f of others) weights[f.key] = even;
      }
      /* families already resting stay resting */
      for (const f of others)
        if (!(f.key in weights)) weights[f.key] = 0;
      applyMix({
        on: TREE_FAMILIES.filter((f) => (weights[f.key] ?? 0) > 0).map(
          (f) => f.key
        ),
        weights,
      });
    },
    [mix, applyMix]
  );

  /* THE RESONANCE EAR — the scope leads threefold, the grown branches
     twofold, the context that follows carries the middle; rarity,
     harmony, phase and one shimmer of the hour tune the rest. */
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
     the words stay the house's one text color). */
  const familyByUk = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const w of grove)
      m.set(w.text.toLowerCase(), familyAccent(w.family) ?? undefined);
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

  const budsKey = channeling?.map((b) => b.question).join("\u0001") ?? "";
  const field = useMemo(
    () =>
      buildResonanceField({
        scope: scopeHint ?? null,
        context: contextSnapshot || null,
        buds: budsKey ? budsKey.split("\u0001") : null,
        hour,
      }),
    [scopeHint, contextSnapshot, budsKey, hour]
  );
  const idf = useMemo(() => buildIdf(grove.map((w) => w.text)), [grove]);

  const ranked = useMemo(() => {
    if (grove.length === 0) return [];
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
  }, [grove, field, idf, seenSnapshot]);

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
  const lastRankedRef = useRef<unknown>(null);
  useEffect(() => {
    if (!mounted || ranked.length === 0) return;
    if (zoomed) return;
    if (lastRankedRef.current === ranked) return;
    lastRankedRef.current = ranked;
    /* the engine never renders synchronously inside an effect */
    const id = window.setTimeout(() => {
      const tuned = tuneSeedBatch(
        ranked
          .slice(0, BATCH_SIZE * 2)
          .map((w) => ({ text: w.text, movement: w.movement, score: w.score })),
        expansionScore,
        BATCH_SIZE
      );
      const seeds = withAccents(tuned);
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
  }, [ranked, mounted, markSpent, zoomed, expansionScore, withAccents]);

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

  /* THE READY THIRTY — the next family, grown before it is asked for.
     Sliced from the ranked grove beyond every voice already spent; the
     visitor never waits. THE WINGS: from the third family on, each new
     family grows out to one SIDE of the house (alternating), so the
     tree spreads in every direction instead of one column. THE ENDLESS
     LAW: the grove spent itself, the family re-weaves from the whole
     grove, rotated — the walk never hits a wall. */
  const prepared = useMemo(() => {
    if (topologies.length === 0 || topologies.length >= MAX_BATCHES) return null;
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
    const tunedSeeds = withAccents(tuned);
    const wing =
      topologies.length >= 2
        ? topologies.length % 2 === 0
          ? ("right" as const)
          : ("left" as const)
        : undefined;
    return tree.frontier.length > 0
      ? buildExtensionTopology(tunedSeeds, tree.frontier, narrow, wing)
      : buildSeedTopology(tunedSeeds, [], narrow);
  }, [ranked, topologies, tree, narrow, spent, expansionScore, withAccents]);

  const groveDone = topologies.length >= MAX_BATCHES;

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
     thirty reveal themselves; the walk never hits a wall. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const vp = vpRef.current;
    const st = sentinelRef.current;
    if (!vp || !st || !mounted) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) grow();
      },
      { root: vp, rootMargin: "180px 0px 0px 0px", threshold: 0 }
    );
    io.observe(st);
    return () => io.disconnect();
  }, [mounted, grow]);

  /* THE HARMONIC WAVES — twelve voices at once, twelve after a few
     seconds, the last six after another; every family arrives in
     rhythm with the context. */
  const [latestReveal, setLatestReveal] = useState<1 | 2 | 3>(1);
  useEffect(() => {
    if (topologies.length === 0) return;
    const t0 = window.setTimeout(() => setLatestReveal(1), 0);
    const t1 = window.setTimeout(() => setLatestReveal(2), WAVE_PAUSE_1);
    const t2 = window.setTimeout(
      () => setLatestReveal(3),
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
     Ctrl/cmd + wheel and the quiet cluster of buttons both steer it. */
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 1.8;
  const clampZoom = useCallback(
    (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)),
    []
  );
  const [treeZoom, setTreeZoom] = useState(1);
  const zoomBy = useCallback(
    (f: number) => setTreeZoom((z) => clampZoom(z * f)),
    [clampZoom]
  );
  const zoomFit = useCallback(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const z = Math.min(
      vp.clientWidth / Math.max(1, tree.geometry.width),
      vp.clientHeight / Math.max(1, tree.geometry.height)
    );
    setTreeZoom(clampZoom(Math.min(z, 1)));
    /* THE WHOLE FAMILY, CENTERED — one quiet anchor after the scale
       settles: the trunk holds the floor, the wings breathe to both
       sides (one timeout, never an animation loop) */
    window.setTimeout(() => {
      const v = vpRef.current;
      if (!v) return;
      v.scrollLeft = Math.max(0, (v.scrollWidth - v.clientWidth) / 2);
      v.scrollTop = Math.max(0, v.scrollHeight - v.clientHeight);
    }, 60);
  }, [clampZoom, tree.geometry.width, tree.geometry.height]);
  /* ctrl/cmd + wheel — a native non-passive listener (React's wheel is
     passive; the zoom must be allowed to claim the gesture) */
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
    const h = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setTreeZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.89)));
    };
    vp.addEventListener("wheel", h, { passive: false });
    return () => vp.removeEventListener("wheel", h);
  }, [mounted, clampZoom]);

  /* THE ANCHORED VIEW — the first layout stands at the trunk; a growing
     family keeps the visitor's reading place; a regrown family returns
     to the floor; a fresh graft pans once so the new house is in view;
     a geometry flip (narrow ⟷ wide) re-anchors to the family's heart.
     One layout pass per change — never per frame. */
  const prevNarrowRef = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
    if (prevNarrowRef.current !== null && prevNarrowRef.current !== narrow) {
      prevSize.current = { w: 0, h: 0 }; /* the geometry turned — re-anchor */
    }
    prevNarrowRef.current = narrow;
    const { width, height } = tree.geometry;
    const dW = width - prevSize.current.w;
    const dH = height - prevSize.current.h;
    const req = panReqRef.current;
    if (req) {
      panReqRef.current = null;
      const n = tree.byId.get(req);
      if (n) {
        /* one quiet pan — the new house, in view at once */
        vp.scrollTop = Math.max(0, n.y - vp.clientHeight * 0.38);
        vp.scrollLeft = Math.max(0, n.x - vp.clientWidth / 2);
        prevSize.current = { w: width, h: height };
        return;
      }
    }
    if (prevSize.current.h === 0 || dH < 0) {
      vp.scrollTop = vp.scrollHeight;
      vp.scrollLeft = Math.max(0, (vp.scrollWidth - vp.clientWidth) / 2);
    } else if (dH > 0 || dW !== 0) {
      vp.scrollTop += dH * treeZoom;
      vp.scrollLeft += dW * treeZoom;
    }
    prevSize.current = { w: width, h: height };
  }, [tree.geometry.width, tree.geometry.height, mounted, tree, narrow, treeZoom]);

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
     ZOOM: the camera pulls back and the answer rises inside the tree. */
  const pick = useCallback(
    (node: GenealogyNode) => {
      if (disabled) return;
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
        const seeds = chooseGraftSeeds(fresh, pickField);
        if (seeds.length > 0) {
          const graft = buildGraftTopology(seeds, node.id, narrowRef.current);
          markSpent(seeds);
          commitTopologies((t) =>
            t.length >= MAX_BATCHES ? t : [...t, graft]
          );
          panReqRef.current = node.id; /* one quiet pan — the new house in view */
        }
      }
      /* THE ZOOM — the answer rises inside the tree, instantly */
      setZoom({ q: node.text, move: node.movement });
      onPick(node.text);
    },
    [
      category,
      disabled,
      onPick,
      scopeHint,
      tree,
      grove,
      chooseGraftSeeds,
      contextSnapshot,
      hour,
      commitTopologies,
      markSpent,
      spent,
    ]
  );

  /* THE WALK CONTINUES FROM THE ANSWER — a branch grown on the reply,
     pressed inside the panel, keeps the walk going from the family's
     last standing place: the trail grows, a new house is grafted from
     the pressed chip's own node, and the next answer replaces this one
     in the same quiet room. */
  const sendFromPanel = useCallback(
    (text: string, move: BranchType | null) => {
      if (disabled || liveLoading || !text.trim()) return;
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
          const seeds = chooseGraftSeeds(fresh, pickField);
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
      setZoom({ q: text, move });
      onPick(text);
    },
    [
      category,
      disabled,
      liveLoading,
      onPick,
      pickedId,
      scopeHint,
      grove,
      chooseGraftSeeds,
      contextSnapshot,
      hour,
      commitTopologies,
      markSpent,
      spent,
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
  const liveAnswerText = (liveAnswer ?? "").trim();
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
     inside the branch. The thread resets when the walk turns rooms. */
  const [thread, setThread] = useState<RoomTurn[]>([]);
  const [threadBusy, setThreadBusy] = useState(false);
  const threadRef = useRef<RoomTurn[]>([]);
  threadRef.current = thread;
  const [seenThreadRoom, setSeenThreadRoom] = useState<string | null>(null);
  if ((zoom?.q ?? null) !== seenThreadRoom) {
    setSeenThreadRoom(zoom?.q ?? null);
    if (threadRef.current.length > 0) setThread([]);
    if (threadBusy) setThreadBusy(false);
  }

  const speakFromRoom = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (disabled || threadBusy || !q || !zoom) return;
      const roomQ = zoom.q;
      const prior = threadRef.current
        .filter((turn) => turn.a && !turn.failed)
        .map(({ q: tq, a: ta }) => ({ q: tq, a: ta }));
      setThread((t) => [...t, { q, a: "", loading: true }]);
      setThreadBusy(true);
      try {
        const reply = await speakWithTransmission(
          category,
          q,
          roomQ,
          answer || "",
          prior,
          language
        );
        setThread((t) =>
          t.map((turn, i) =>
            i === t.length - 1 ? { ...turn, a: reply, loading: false } : turn
          )
        );
      } catch {
        setThread((t) =>
          t.map((turn, i) =>
            i === t.length - 1
              ? { ...turn, loading: false, failed: true }
              : turn
          )
        );
      } finally {
        setThreadBusy(false);
      }
    },
    [answer, category, disabled, language, threadBusy, zoom]
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
    (text: string) => {
      void speakFromRoom(text);
    },
    [speakFromRoom]
  );

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

  const preparedCount = prepared
    ? prepared.rows.reduce((a, r) => a + r.seeds.length, 0)
    : 0;

  return (
    <div
      data-testid={testIdPrefix}
      aria-hidden={!shown}
      className={cn(
        "absolute inset-0 z-20 flex min-h-0 flex-col bg-background transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        shown
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      {/* ---------------------------- header ---------------------------
          THE COMPASS — the whole house's steering, one quiet row:
          where the walk stands, which families it explores, and the
          mix that decides which suggestions visit more often. The
          chat reaches the very top of the box — no title block, no
          count line; the place speaks through the compass alone. */}
      <div className="shrink-0 bg-background px-3 pb-1 pt-10 md:pt-1.5 sm:px-5">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-2">
          {/* WHERE THE WALK STANDS — the little compass of the place:
              the family the tree speaks in, and how deep the walk is */}
          <span
            data-testid={`${testIdPrefix}-where`}
            title={t("Where the walk stands")}
            className="flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-2 pr-2.5"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 34%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, var(--background))",
            }}
          >
            <Compass
              className="size-3 shrink-0 text-[var(--scope-a,var(--gd))]"
              aria-hidden="true"
            />
            <span className="mono-label max-w-[92px] truncate whitespace-nowrap text-[9px] uppercase tracking-[0.16em] text-foreground/85 sm:max-w-[140px]">
              {mixTitle(mix, t)}
            </span>
            {lineage.length > 0 && (
              <span
                className="mono-label whitespace-nowrap text-[9px] tabular-nums text-muted-foreground/70"
                aria-hidden="true"
              >
                ·{lineage.length}
              </span>
            )}
          </span>

          {/* THE FAMILIES — which lights the walk explores; one touch
              folds a family out of the grove or weaves it back in */}
          <div
            data-testid={`${testIdPrefix}-families`}
            className="nice-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() =>
                applyMix({ on: allFamilyKeys(), weights: evenWeights() })
              }
              aria-pressed={mixIsGeneral(mix)}
              title={t("The whole house, mixed")}
              data-testid={`${testIdPrefix}-family-general`}
              className={cn(
                "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 transition-all duration-300",
                mixIsGeneral(mix)
                  ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_12%,var(--background))] text-[var(--scope-a,var(--gd))]"
                  : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
              )}
            >
              <ListTree className="size-3" aria-hidden="true" />
              <span className="mono-label whitespace-nowrap text-[9px] uppercase tracking-[0.14em]">
                {t("General")}
              </span>
            </button>
            {TREE_FAMILIES.map((f) => {
              const on =
                mix.on.includes(f.key) && (mix.weights[f.key] ?? 0) > 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleFamily(f.key)}
                  aria-pressed={on}
                  title={t(familyLabelKeys[f.key] ?? f.key)}
                  data-testid={`${testIdPrefix}-family-${f.key}`}
                  className={cn(
                    "focus-glow flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 transition-all duration-300",
                    on
                      ? "text-foreground"
                      : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                  )}
                  style={
                    on
                      ? {
                          borderColor: `color-mix(in srgb, ${f.accent} 55%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${f.accent} 12%, var(--background))`,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full transition-opacity duration-300"
                    style={{ backgroundColor: f.accent, opacity: on ? 1 : 0.3 }}
                  />
                  <span className="mono-label whitespace-nowrap text-[9px] uppercase tracking-[0.14em]">
                    {t(familyLabelKeys[f.key] ?? f.key)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* THE MIX — how much of each family the grove carries */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMixOpen((o) => !o)}
                aria-expanded={mixOpen}
                aria-label={t("The mix of the house")}
                title={t("The mix of the house")}
                data-testid={`${testIdPrefix}-mix`}
                className={cn(
                  "focus-glow flex size-7 items-center justify-center rounded-full border transition-all duration-300",
                  mixOpen
                    ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                    : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="size-3" aria-hidden="true" />
              </button>
              {mixOpen && (
                <>
                  <div
                    aria-hidden="true"
                    className="fixed inset-0 z-30"
                    onClick={() => setMixOpen(false)}
                  />
                  <div
                    data-testid={`${testIdPrefix}-mix-panel`}
                    className="absolute right-0 top-9 z-40 w-[272px] rounded-2xl border bg-background p-3 shadow-[0_18px_48px_-20px_rgba(0,0,0,0.6)]"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                    }}
                  >
                    <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("The mix of the house")}
                    </p>
                    <div className="mt-2.5 flex flex-col gap-2">
                      {TREE_FAMILIES.map((f) => {
                        const w = mix.weights[f.key] ?? 0;
                        const on = mix.on.includes(f.key) && w > 0;
                        const sum =
                          TREE_FAMILIES.reduce(
                            (a, x) =>
                              a +
                              (mix.on.includes(x.key)
                                ? (mix.weights[x.key] ?? 0)
                                : 0),
                            0
                          ) || 1;
                        const pct = on ? Math.round((w / sum) * 100) : 0;
                        return (
                          <div key={f.key} className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor: f.accent,
                                opacity: on ? 1 : 0.3,
                              }}
                            />
                            <span className="w-[86px] shrink-0 truncate text-[11px] text-foreground/85">
                              {t(familyLabelKeys[f.key] ?? f.key)}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={on ? w : 0}
                              onChange={(e) =>
                                setFamilyWeight(f.key, Number(e.target.value))
                              }
                              aria-label={t(familyLabelKeys[f.key] ?? f.key)}
                              data-testid={`${testIdPrefix}-mix-${f.key}`}
                              className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[color-mix(in_srgb,var(--hairline)_90%,transparent)] accent-[var(--scope-a,var(--gd))]
                              [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
                              style={{ accentColor: f.accent }}
                            />
                            <span
                              className="w-8 shrink-0 text-right text-[10px] tabular-nums"
                              style={{ color: on ? f.accent : undefined }}
                            >
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyMix({ on: allFamilyKeys(), weights: evenWeights() });
                        setMixOpen(false);
                      }}
                      data-testid={`${testIdPrefix}-mix-even`}
                      className="focus-glow mt-3 w-full rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground transition-all duration-300 hover:text-foreground"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--hairline) 80%, transparent)",
                      }}
                    >
                      {t("Even voices")}
                    </button>
                  </div>
                </>
              )}
            </div>
            <ExpansionRing />
            <button
              type="button"
              onClick={() => setSalt((s) => s + 1)}
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
          </div>
        </div>

        {/* THE TRAIL OF THE WALK — every pressed whisper, oldest first;
            one touch pans the tree back to that very step. */}
        {lineage.length > 0 && (
          <div
            data-testid={`${testIdPrefix}-trail`}
            className="nice-scroll mx-auto mt-1.5 flex w-full max-w-[680px] items-center gap-1 overflow-x-auto pb-0.5"
          >
            <span className="mono-label shrink-0 pr-0.5 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/60">
              {t("Your walk")}
            </span>
            {lineage.map((l, i) => {
              const latest = i === lineage.length - 1;
              return (
                <span key={`${l.text}-${i}`} className="flex shrink-0 items-center gap-1">
                  {i > 0 && (
                    <ChevronRight
                      className="size-3 shrink-0 text-muted-foreground/35"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => walkBack(l)}
                    aria-label={`${t("Return to")}: ${l.text}`}
                    title={l.text}
                    className={cn(
                      "focus-glow max-w-[170px] truncate rounded-full border px-2 py-0.5 text-[10.5px] leading-snug transition-all duration-300",
                      latest
                        ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_66%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,var(--background))] font-medium text-[var(--scope-a,var(--gd))]"
                        : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                    )}
                  >
                    {l.text}
                  </button>
                </span>
              );
            })}
            <span
              className="mono-label shrink-0 animate-pulse pl-1 text-[8px] uppercase tracking-[0.18em] text-[var(--scope-a,var(--gd))]"
              aria-hidden="true"
            >
              {t("You are here")}
            </span>
          </div>
        )}
      </div>

      {/* --------------------- the walkable family --------------------- */}
      <div className="relative min-h-0 flex-1">
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
          {/* THE GROW — the ready thirty, one breath away, always in reach */}
          <div className="pointer-events-none sticky top-0 z-20 flex h-0 justify-center px-3">
            {prepared || groveDone ? (
              <button
                type="button"
                onClick={grow}
                disabled={!prepared || disabled}
                aria-label={
                  prepared
                    ? t("Grow the family — 30 more branches stand ready")
                    : t("This hour's family is complete")
                }
                data-testid={`${testIdPrefix}-grow`}
                className={cn(
                  "pointer-events-auto mt-2 flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] shadow-[0_4px_18px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
                  prepared
                    ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_44%,transparent)] bg-background text-[var(--scope-a,var(--gd))] hover:shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)]"
                    : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] bg-background text-muted-foreground"
                )}
              >
                <Sprout className="size-3.5" aria-hidden="true" />
                {prepared
                  ? t("{count} more stand ready — grow the family", {
                      count: preparedCount,
                    })
                  : groveDone
                    ? t("This hour's family is complete")
                    : t("The family is complete")}
              </button>
            ) : null}
          </div>

          {/* THE CANVAS — the whole family, walked in every direction.
              Memoized: the walk stands still while the room speaks.
              THE ZOOM — one transform on one wrapper: zoomed out, many
              suggestions stand in view at once and their ropes read
              across the whole family; zoomed in, one whisper fills the
              eye. The compositor owns the motion; the canvas never
              re-renders for it. */}
          <div
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
                transform: `translate3d(0,0,0) scale(${treeZoom})`,
                transformOrigin: "0 0",
                willChange: "transform",
              }}
            >
              <TreeCanvas
                tree={tree}
                batchCount={batchCount}
                latestReveal={latestReveal}
                chainSet={chainSet}
                pickedId={pickedId}
                flashId={flashId}
                narrow={narrow}
                disabled={disabled}
                onPick={pick}
                sentinelRef={sentinelRef}
                testIdPrefix={testIdPrefix}
              />
            </div>
          </div>

          {/* THE EMPTY ROOM'S OWN IDENTITY — spoken above the trunk;
              OPAQUE by law — no tree line may ever show behind it */}
          {(introSub || introSubExtra || introExtra) && (
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

        {/* THE TREE'S OWN ZOOM — the quiet cluster: out, the reading,
            in, and the whole family at once; ctrl/cmd + wheel zooms too */}
        {!zoomed && (
          <div
            data-testid={`${testIdPrefix}-zoomctl`}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.55)]"
            style={{
              borderColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 28%, transparent)",
            }}
          >
            <button
              type="button"
              onClick={() => zoomBy(0.87)}
              disabled={treeZoom <= ZOOM_MIN + 0.001}
              aria-label={t("Zoom out")}
              title={t("Zoom out")}
              data-testid={`${testIdPrefix}-zoom-out`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span
              className="mono-label w-9 text-center text-[9px] tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              {Math.round(treeZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => zoomBy(1.15)}
              disabled={treeZoom >= ZOOM_MAX - 0.001}
              aria-label={t("Zoom in")}
              title={t("Zoom in")}
              data-testid={`${testIdPrefix}-zoom-in`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
            <span
              aria-hidden="true"
              className="mx-0.5 h-4 w-px bg-[color-mix(in_srgb,var(--hairline)_90%,transparent)]"
            />
            <button
              type="button"
              onClick={zoomFit}
              aria-label={t("The whole family")}
              title={t("The whole family")}
              data-testid={`${testIdPrefix}-zoom-fit`}
              className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              <Maximize2 className="size-3" aria-hidden="true" />
            </button>
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
          <div className="pointer-events-none absolute inset-0 z-30 flex justify-center p-2 sm:p-3">
            <section
              data-testid={`${testIdPrefix}-zoom`}
              aria-label={zoom.q}
              className="canopy-panel pointer-events-auto flex min-h-0 w-full max-w-[720px] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_28px_80px_-32px_rgba(0,0,0,0.65)]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              {/* the question — the whisper the visitor walked to;
                  NO remount key: the panel itself never leaves the tree
                  when the walk turns to the next branch, only the room
                  inside it changes — the transmission glides, no flicker */}
              <header className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "color-mix(in srgb, var(--hairline) 70%, transparent)" }}>
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
                    aria-label={t("Back to the tree")}
                    title={t("Back to the tree")}
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
                className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3.5 sm:px-5"
              >
                <div key={zoom.q} className="room-swap">
                  {zoom && (
                    <ResonantStageBadge
                      category={categoryForMove(zoomMove)}
                      moveLabel={zoom.move ? t(BRANCH_TYPE_LABELS[zoom.move]) : null}
                      visible={revealStage >= 1}
                    />
                  )}
                  {answer ? (
                    revealStage >= 2 ? (
                      <div className="canopy-answer whitespace-pre-wrap break-words text-[13.5px] leading-[1.75] text-foreground/90 sm:text-[14px]">
                        {answer}
                        {liveLoading && (
                          <span
                            aria-hidden="true"
                            className="ml-1 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse rounded-[2px] bg-[var(--scope-a,var(--gd))] align-baseline opacity-70"
                          />
                        )}
                      </div>
                    ) : null
                  ) : (
                    revealStage >= 2 && (
                      <div className="flex items-center gap-2 py-5 text-muted-foreground" aria-live="polite">
                        <span
                          aria-hidden="true"
                          className="animate-line-breathe h-4 w-px shrink-0"
                          style={{
                            background:
                              "linear-gradient(180deg, var(--scope-a,var(--gd)), transparent)",
                          }}
                        />
                        <span className="mono-label text-[10px] uppercase tracking-[0.22em]">
                          {t("Channeling")}
                        </span>
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
                          <p
                            className="ml-auto max-w-[86%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md border px-3.5 py-2 text-[13px] leading-relaxed text-foreground"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
                              backgroundColor:
                                "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, var(--background) 90%)",
                            }}
                          >
                            {turn.q}
                          </p>
                          {turn.loading ? (
                            <p
                              className="flex items-center gap-2 py-1 text-muted-foreground"
                              aria-live="polite"
                            >
                              <span
                                aria-hidden="true"
                                className="animate-line-breathe h-3.5 w-px shrink-0"
                                style={{
                                  background:
                                    "linear-gradient(180deg, var(--scope-a,var(--gd)), transparent)",
                                }}
                              />
                              <span className="mono-label text-[9.5px] uppercase tracking-[0.2em]">
                                {t("The transmission is listening…")}
                              </span>
                            </p>
                          ) : turn.a ? (
                            <p className="max-w-[94%] whitespace-pre-wrap break-words text-[13.5px] leading-[1.7] text-foreground/90">
                              {turn.a}
                            </p>
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
                className="flex shrink-0 flex-col gap-2.5 border-t px-4 py-3 sm:px-5"
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
                />
              </footer>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
