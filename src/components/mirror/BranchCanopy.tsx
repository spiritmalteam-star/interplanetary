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
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  Moon,
  RefreshCw,
  Send,
  Sparkles,
  Sprout,
  TreeDeciduous,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { canopyHour, growCanopy } from "@/lib/data/suggestion-banks";
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
import { recordExpansion } from "@/lib/expansion";
import { ExpansionRing } from "./ExpansionMirror";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import { cn } from "@/lib/utils";
import {
  categoryForMove,
  getWalkSession,
  mediaForQuestion,
  walkNodeId,
  type MediaPayload,
} from "@/lib/resonance-walk";
import {
  ResonantMediaStage,
  ResonantStageBadge,
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

/** How many families the tree may carry in one hour's grove. */
const MAX_BATCHES = 12;
/** The harmonic pauses — twelve voices, then twelve, then six. */
const WAVE_PAUSE_1 = 2600;
const WAVE_PAUSE_2 = 3400;

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
      className="relative z-10 shrink-0 border-t bg-[color-mix(in_srgb,var(--background)_72%,transparent)] backdrop-blur-xl hairline"
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
     (two pixels of air at each end — a line never touches a word) */
  const paths = useMemo(() => {
    const out: {
      d: string;
      golden: boolean;
      chain: boolean;
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

      {/* the connectors — every family tie, one static SVG; each
          line keeps two pixels of air clear of every chip, and the
          walk's own chain burns brighter than the rest */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        width={geo.width}
        height={geo.height}
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        fill="none"
      >
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
            style={{ animationDelay: `${p.delay + 180}ms` }}
          >
            <path
              d={p.d}
              stroke={
                p.golden
                  ? "color-mix(in srgb, #f59e0b 30%, transparent)"
                  : p.chain
                    ? "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)"
                    : "color-mix(in srgb, var(--scope-a,var(--gd)) 16%, transparent)"
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
                    ? "color-mix(in srgb, var(--scope-a,var(--gd)) 88%, transparent)"
                    : "color-mix(in srgb, var(--scope-a,var(--gd)) 62%, transparent)"
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
              "genea-bloom focus-glow absolute z-10 flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2 text-left shadow-[0_3px_14px_-8px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
              narrow ? "px-2.5 text-[11.5px] leading-4" : "text-[12.5px] leading-[17px]",
              n.golden
                ? "border-[color-mix(in_srgb,#f59e0b_52%,transparent)] bg-[color-mix(in_srgb,#f59e0b_14%,var(--background)_86%)] font-serif italic text-foreground shadow-[0_0_16px_-6px_color-mix(in_srgb,#f59e0b_60%,transparent)]"
                : isPicked
                  ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_85%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_18%,var(--background)_82%)] text-foreground shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)]"
                  : onChain
                    ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_66%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_12%,var(--background)_88%)] text-foreground"
                    : deep
                      ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_62%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_13%,var(--background)_87%)] text-foreground shadow-[0_0_16px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
                      : attuned
                        ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,var(--background)_93%)] text-foreground/90"
                        : "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_28%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background)_97%)] text-foreground/85 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_58%,transparent)]",
              flashing && "genea-flash"
            )}
            style={
              {
                left: n.x,
                top: n.y,
                width: geo.chipW,
                height: n.h,
                transform: "translateX(-50%)",
                animationDelay: `${n.golden ? i * 40 : Math.min(n.wave * 130 + (i % 12) * 26, 640)}ms`,
              } as CSSProperties
            }
          >
            {isPicked && (
              <span
                aria-hidden="true"
                className="animate-pulse absolute right-1.5 top-1.5 flex size-1.5 rounded-full bg-[var(--scope-a,var(--gd))]"
              />
            )}
            <Icon
              className={cn(
                "size-3 shrink-0",
                n.golden
                  ? "text-[#f59e0b]"
                  : "text-[var(--scope-a,var(--gd))] opacity-80"
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
        {t("Reply within the branch…")}
      </label>
      <input
        id={`${testIdPrefix}-zoom-reply`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t("Reply within the branch…")}
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
  introHeading,
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
  /** The empty room's own identity, spoken above the trunk. */
  introHeading?: string | null;
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
  const openDreamBook = useMirror((s) => s.openDreamBook);

  /* THE RESONANCE WALK — v4.0 rooms: the field's voice gate (state up
     front; the wiring effects live further below, where the walk's
     context is ready). The standing room's media constellation is
     read, not stored — derived from the session at render time. */
  const [fieldOn, setFieldOn] = useState(false);

  /* THE FADE LAW — mount → visible on open; fade → unmount on close.
     THE LATCH LAW: while the answer lives in the tree (the zoom), the
     canopy holds its place even when the parent's open relaxes — the
     visitor follows the branch from the end of the transmission; the
     moment they step back to the walk, the parent's law applies again.
     Pure CSS transitions; render-time guarded resets only. */
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [seenOpen, setSeenOpen] = useState(open);

  /* ------------------- THE ZOOM — the answer's room ------------------ */
  const [zoom, setZoom] = useState<{ q: string; move: BranchType | null } | null>(
    null
  );
  const zoomed = zoom !== null;
  const active = open || zoomed;

  if (active !== seenOpen) {
    setSeenOpen(active);
    if (active) {
      setMounted(true);
      setShown(false);
    } else {
      setShown(false);
      /* THE FOLD CLOSES THE GATE — the field's voice rests with the walk */
      if (fieldOn) setFieldOn(false);
    }
  }

  useEffect(() => {
    if (!active) {
      /* the fold silences the field (external system — the audio) */
      getWalkSession().disableSound();
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
  if (zoom && !liveLoading && !liveAnswer) {
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
    () => growCanopy(category, scopeHint ?? null, hour, salt),
    [category, scopeHint, hour, salt]
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
     a pending regrow simply waits for the room to hand back. */
  const lastRankedRef = useRef<unknown>(null);
  useEffect(() => {
    if (!mounted || ranked.length === 0) return;
    if (zoomed) return;
    if (lastRankedRef.current === ranked) return;
    lastRankedRef.current = ranked;
    /* the engine never renders synchronously inside an effect */
    const id = window.setTimeout(() => {
      const seeds: GenealogySeed[] = ranked
        .slice(0, BATCH_SIZE)
        .map((w) => ({ text: w.text, movement: w.movement, score: w.score }));
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
  }, [ranked, mounted, markSpent, zoomed]);

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
     Sliced from the ranked grove beyond every voice already spent;
     the visitor never waits. */
  const prepared = useMemo(() => {
    if (topologies.length === 0 || topologies.length >= MAX_BATCHES) return null;
    const slice = ranked
      .filter((w) => !spent.has(w.text.toLowerCase()))
      .slice(0, BATCH_SIZE);
    if (slice.length === 0) return null;
    const seeds: GenealogySeed[] = slice.map((w) => ({
      text: w.text,
      movement: w.movement,
      score: w.score,
    }));
    return tree.frontier.length > 0
      ? buildExtensionTopology(seeds, tree.frontier, narrow)
      : buildSeedTopology(seeds, [], narrow);
  }, [ranked, topologies, tree, narrow, spent]);

  const groveDone =
    ranked.length > 0 && !ranked.some((w) => !spent.has(w.text.toLowerCase()));

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
      vp.scrollTop += dH;
      vp.scrollLeft += dW;
    }
    prevSize.current = { w: width, h: height };
  }, [tree.geometry.width, tree.geometry.height, mounted, tree, narrow]);

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
      if (hits.length >= BATCH_SIZE || fresh.length <= hits.length) {
        return hits
          .slice(0, BATCH_SIZE)
          .map((w) => ({ text: w.text, movement: w.movement, score: w.score }));
      }
      /* the fill — the resonance leads, the family is never starved */
      const hitTexts = new Set(hits.map((h) => h.text));
      const fill = fresh
        .filter((w) => !hitTexts.has(w.text))
        .slice(0, BATCH_SIZE - hits.length)
        .map((w) => ({ ...w, score: 0 }));
      return [...hits, ...fill].map(
        (w) => ({ text: w.text, movement: w.movement, score: w.score })
      );
    },
    [idf, seenSnapshot]
  );

  /* the pan — one quiet assignment, never an animation loop */
  const panToNode = useCallback(
    (id: string | null) => {
      const vp = vpRef.current;
      if (!vp || !id) return;
      const n = tree.byId.get(id);
      if (!n) return;
      vp.scrollTop = Math.max(0, n.y - vp.clientHeight * 0.38);
      vp.scrollLeft = Math.max(0, n.x - vp.clientWidth / 2);
    },
    [tree]
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

  /* the trail's own touch — pan to a past step and flash it once */
  const walkBack = useCallback(
    (id: string | null) => {
      panToNode(id);
      if (!id) return;
      setFlashId(id);
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
     the panel; the walk's own reply line beneath them. */
  const contSeeds = useMemo(() => {
    const seen = new Set<string>();
    const out: LearnedBranch[] = [];
    for (const b of channeling ?? []) {
      const k = b.question.toLowerCase();
      if (seen.has(k) || (zoom && k === zoom.q.toLowerCase())) continue;
      seen.add(k);
      out.push(b);
      if (out.length >= 6) break;
    }
    return out;
  }, [channeling, zoom]);

  /* the panel's streaming body — pinned to the newest words while the
     answer grows, unless the visitor scrolled up to read */
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

  /* the room the walk just left — the parent of the standing room,
     kept in state (render-time guarded, the official pattern) */
  const [seenRoomQ, setSeenRoomQ] = useState<string | null>(null);
  const [lastRoomQ, setLastRoomQ] = useState<string | null>(null);
  if (zoomQ !== seenRoomQ) {
    setSeenRoomQ(zoomQ);
    setLastRoomQ(seenRoomQ);
  }

  /* the standing room's media — read from the walk's own session;
     before the room is registered, the same deterministic draw the
     registration will use keeps the very first paint correct */
  const roomMedia = useMemo(() => {
    if (!zoomQ) return null;
    const id = walkNodeId(zoomQ);
    const known = getWalkSession().getNode(id);
    if (known?.media) return known.media;
    const parentId =
      lastRoomQ && walkNodeId(lastRoomQ) !== id ? walkNodeId(lastRoomQ) : null;
    return mediaForQuestion(zoomQ, parentId, categoryForMove(zoomMove));
  }, [zoomQ, zoomMove, lastRoomQ]);

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
        media: known?.media ?? mediaForQuestion(zoomQ, parentId, cat),
        childrenIds: known?.childrenIds ?? [],
      });
    }
  }, [zoomQ, zoomMove, lastRoomQ]);

  /* THE SETTLING — the transmission lands, the branches grow: the room
     is refreshed and the horizon (children, with their deterministic
     media) is registered and pre-loaded — so the next press never
     waits on the network, exactly as the PRC promises. */
  const answerLen = (liveAnswer ?? "").trim().length;
  const answerLanded = !liveLoading && answerLen > 0;
  const settledKey = `${zoomQ ?? ""}|${answerLanded ? "1" : "0"}|${answerLen}|${contSeeds.length}`;
  useEffect(() => {
    if (!zoomQ || !answerLanded) return;
    const session = getWalkSession();
    const id = walkNodeId(zoomQ);
    const known = session.getNode(id);
    const cat = known?.category ?? categoryForMove(zoomMove);
    const parentId = known?.parentId ?? null;
    for (const b of contSeeds) {
      const cid = walkNodeId(b.question);
      const existingChild = session.getNode(cid);
      session.register({
        id: cid,
        parentId: id,
        category: categoryForMove(b.type),
        title: b.question,
        transmission: "",
        media:
          existingChild?.media ??
          mediaForQuestion(b.question, id, categoryForMove(b.type)),
        childrenIds: [],
      });
    }
    session.settle({
      id,
      parentId,
      category: cat,
      title: zoomQ,
      transmission: (liveAnswer ?? "").trim(),
      media: known?.media ?? mediaForQuestion(zoomQ, parentId, cat),
      childrenIds: contSeeds.map((b) => walkNodeId(b.question)),
    });
  }, [settledKey, answerLanded, zoomQ, zoomMove, contSeeds, liveAnswer]);

  /* THE FIELD'S GATE — the visitor's own hand opens the voice. */
  const toggleField = useCallback(() => {
    const session = getWalkSession();
    if (fieldOn) {
      session.disableSound();
      setFieldOn(false);
    } else {
      session.enableSound();
      setFieldOn(true);
    }
  }, [fieldOn]);

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

  /* the room's own reply — handed to the memoized form (the form owns
     its draft; the walk's continuation rides through here) */
  const sendReplyFromPanel = useCallback(
    (text: string) => sendFromPanel(text, null),
    [sendFromPanel]
  );

  if (!mounted) return null;

  /* ---------------- the rendered family -----------------------------
     The whole drawn family lives in the memoized TreeCanvas — while
     the answer streams or the visitor types, that layer stands still. */
  const batchCount = topologies.length;
  const answer = (liveAnswer ?? "").trim();
  const ZoomIcon = zoom?.move ? (MOVEMENT_ICONS[zoom.move] ?? Layers) : Layers;

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
          The tree reaches the very top of the chat box. The Expansion
          Mirror rides here — the score that evolves with the walk —
          and beneath the title, the trail of the walk itself: every
          pressed whisper, in order, so the visitor is never lost. */}
      <div className="shrink-0 border-b hairline bg-background px-3 pb-2 pt-[52px] sm:px-5 sm:pt-[60px]">
        <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
              aria-hidden="true"
            >
              <ListTree className="size-3.5 text-[var(--scope-a,var(--gd))]" />
            </span>
            <div className="min-w-0">
              <p className="scope-gradient-text truncate text-[14.5px] font-semibold leading-tight">
                {t("The living tree")}
                {introHeading ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {introHeading}
                  </span>
                ) : null}
              </p>
              <p className="mono-label truncate text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
                {tree.nodes.length} {t("whispers on this branch")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
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
                    onClick={() => walkBack(l.id)}
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
                  "pointer-events-auto mt-2 flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] backdrop-blur-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
                  prepared
                    ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_44%,transparent)] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] text-[var(--scope-a,var(--gd))] hover:shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)]"
                    : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] text-muted-foreground"
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
              Memoized: the walk stands still while the room speaks. */}
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

          {/* THE EMPTY ROOM'S OWN IDENTITY — spoken above the trunk */}
          {(introSub || introSubExtra || introExtra) && (
            <div className="pointer-events-none sticky bottom-2 z-10 flex flex-col items-center gap-2 px-4 text-center">
              {introSub && (
                <p className="genea-bloom still-bloom max-w-[460px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,transparent)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] px-4 py-2.5 text-[13.5px] leading-relaxed text-muted-foreground backdrop-blur-xl">
                  {introSub}
                </p>
              )}
              {introSubExtra && (
                <p className="genea-bloom still-bloom max-w-[440px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] px-4 py-2 text-[13px] italic leading-relaxed text-muted-foreground/80 backdrop-blur-xl">
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

        {/* ------------------- THE ZOOM — the veil -------------------
            the family steps back into a living backdrop; one touch of
            it returns the walk */}
        {zoomed && (
          <div
            onClick={exitZoom}
            aria-hidden="true"
            data-testid={`${testIdPrefix}-veil`}
            className="canopy-veil absolute inset-0 z-20 bg-[color-mix(in_srgb,var(--background)_28%,transparent)]"
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
              key={zoom.q}
              data-testid={`${testIdPrefix}-zoom`}
              aria-label={zoom.q}
              className="canopy-panel pointer-events-auto flex min-h-0 w-full max-w-[720px] flex-col overflow-hidden rounded-3xl border bg-background shadow-[0_28px_80px_-32px_rgba(0,0,0,0.65)]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              {/* the question — the whisper the visitor walked to */}
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
                    <p className="break-words text-[14px] font-medium leading-snug text-foreground">
                      {zoom.q}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {/* THE FIELD'S GATE — the walk's own ambient voice */}
                  <button
                    type="button"
                    onClick={toggleField}
                    aria-pressed={fieldOn}
                    aria-label={fieldOn ? t("Silence the field") : t("Open the field's voice")}
                    title={fieldOn ? t("Silence the field") : t("Open the field's voice")}
                    data-testid={`${testIdPrefix}-zoom-field`}
                    className={cn(
                      "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      fieldOn
                        ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[var(--scope-a,var(--gd))]"
                        : "hairline text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
                    )}
                  >
                    {fieldOn ? (
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
                  (2), media (3) — every step one compositor breath */}
              <div
                ref={bodyRef}
                onScroll={onBodyScroll}
                data-testid={`${testIdPrefix}-zoom-answer`}
                className="nice-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3.5 sm:px-5"
              >
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

                {/* STAGE 3 — the room's own media, pre-loaded by the PRC */}
                <ResonantMediaStage
                  media={roomMedia}
                  visible={revealStage >= 3 && answerLanded}
                  fieldOn={fieldOn}
                  onFieldToggle={toggleField}
                  onOpenBook={openDreamBook}
                  testIdPrefix={`${testIdPrefix}-zoom`}
                />
              </div>

              {/* the walk continues from the answer's own branches —
                  THE DROPDOWN: the branches stand behind one quiet
                  button, folded by default, opened wide with the whole
                  of every whisper — and a slim line (the room's one
                  input) carries the visitor's own words */}
              {!liveLoading && answer && (
                <footer
                  className="flex shrink-0 flex-col gap-2.5 border-t px-4 py-3 sm:px-5"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--hairline) 70%, transparent)",
                  }}
                >
                  {/* STAGE 4 — the next horizon, dropped down to explore */}
                  {revealStage >= 4 && contSeeds.length > 0 && (
                    <div className="flex flex-col gap-2">
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
                          className="nice-scroll grid max-h-[42vh] gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2"
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
                                className="focus-glow group flex items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-300 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_60%,transparent)] disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                  borderColor:
                                    "color-mix(in srgb, var(--scope-a,var(--gd)) 24%, transparent)",
                                  backgroundColor:
                                    "color-mix(in srgb, var(--scope-a,var(--gd)) 5%, var(--background))",
                                }}
                              >
                                <CIcon
                                  className="mt-0.5 size-3.5 shrink-0 text-[var(--scope-a,var(--gd))] opacity-80"
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="mono-label block text-[8px] uppercase tracking-[0.18em] text-muted-foreground/60">
                                    {t(BRANCH_TYPE_LABELS[b.type])}
                                  </span>
                                  <span className="mt-0.5 block whitespace-pre-wrap break-words text-[12.5px] leading-snug text-foreground/90">
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
                    disabled={disabled || liveLoading}
                    onSend={sendReplyFromPanel}
                    testIdPrefix={testIdPrefix}
                  />
                </footer>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
