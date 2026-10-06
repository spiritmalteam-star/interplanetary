"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Atom,
  ChevronDown,
  ChevronUp,
  Dna,
  HeartPulse,
  ListTree,
  NotebookPen,
  Orbit,
  Sparkle,
  Sparkles,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  buildSuggestionTree,
  type BranchId,
} from "@/lib/data/suggestion-tree";
import {
  BRANCH_TYPE_LABELS,
  LEARNING_IDENTITY_EVENT,
  TREE_DRIFT_EVENT,
  loadSeen,
  recordJourney,
  recordOpened,
  recordSeen,
  type BranchType,
  type LearnedBranch,
} from "@/lib/learning-branches";

/* ------------------------------------------------------------------ */
/*  THE LIVING SUGGESTION TREE — the boundless grove                   */
/*                                                                     */
/*  THE CAMERA LAW. The grove is not a page and not a scrollable DOM.  */
/*  It is a small fixed window looking into a large virtual world:     */
/*                                                                     */
/*      viewport (fixed, still)                                        */
/*        └── world (ONE container, moved by translate3d)              */
/*               ├── connection layer (one svg per visible tile)       */
/*               └── visible nodes only                                */
/*                                                                     */
/*  The pointer moves the CAMERA, never React state. Coordinates live  */
/*  in refs, the transform is written once per frame under a single    */
/*  rAF lock, and when the walk settles the heavy work happens once:   */
/*  the groves re-anchor, the echo fields turn, fresh whispers render, */
/*  the memory is written. Between walks the engine is completely      */
/*  silent — no interval, no loop, no physics, no work at all.         */
/*                                                                     */
/*  THE SPHERE. There are no walls anywhere. The tree is periodic —    */
/*  identical groves stacked one period apart — and only the one or    */
/*  two groves near the window are ever drawn. Crossing a seam is a    */
/*  silent re-anchor by exactly one period: pixel for pixel the same   */
/*  view, so the walk continues forever, in every direction.           */
/*                                                                     */
/*  At the top hangs the CHANNELING branch — the conversation's own    */
/*  branch, grown from the exchanges themselves — tied to the leading  */
/*  general branch by an elastic golden line.                          */
/*                                                                     */
/*  While a transmission loads, the whole line drops down to rest;     */
/*  it lifts again only when the visitor wishes to jump to another     */
/*  branch. And the walk itself is kept — quietly — so the visitor's   */
/*  profile can draw its DNA evolutionary helix.                       */
/*                                                                     */
/*  HYDRATION LAW: the first paint (server and client alike) is        */
/*  deterministic — the learning memory is applied only after the      */
/*  mount, so the rendered tree never disagrees with its own shadow.   */
/* ------------------------------------------------------------------ */

type TreeState = "rest" | "grove" | "canopy";

/** The window's three sizes: rested away, the 2 cm grove, the open canopy. */
const HEIGHTS: Record<TreeState, number> = {
  rest: 36,
  grove: 76, /* ≈ 2 cm */
  canopy: 264,
};

/** The tree itself — trunk, scopes, whispers — exactly as it always was. */
const TREE_W = 780;
/** The echo fields on either side — the tree reflected into the distance. */
const ECHO_W = 400;
/** The whole canvas: an echo field, the tree, an echo field. */
const CANVAS_W = ECHO_W + TREE_W + ECHO_W;
const TRUNK_X = 22;
const ROOT_X = 44;
const ROOT_LABEL_X = 62;
const SCOPE_DOT_X = 240;
const SCOPE_LABEL_X = 252;
const SCOPE_LABEL_W = 182;
const LEAF_X = 446;
const LEAF_W = 316;
const LABEL_H = 30;
const LEAF_ROW_H = 42;
const BLOCK_GAP = 10;
const BRANCH_GAP = 22;
/** Whispers shown per scope before a bloom (or a walk) reveals more. */
const SHOWN = 2;
/** The vertical period — past the tree's end, the next grove begins. */
const WRAP_GAP = 200;
/** The echo lanes: two fields of distant whispers on each side. */
const ECHO_LANE_X = [12, 100, ECHO_W + TREE_W + 12, ECHO_W + TREE_W + 100];
const ECHO_ROW = 110;
const ECHO_CHIP_W = 290;
/** Lane seeds — each lane wanders its own face of the pool. */
const ECHO_SEEDS = [53, 211, 977, 1613];

/* ------------------------- the camera engine ------------------------ */

/** The culling buffer — how far beyond the window the world is drawn. */
function bandBuffer(vpH: number): number {
  return Math.min(560, Math.max(180, vpH * 2.2));
}
/** The drawn band follows the camera in steps of this many px — a
 *  structural refresh every few hundred pixels, never per pixel. */
const BAND_BUCKET = 240;
/** A tap under this many px of travel is a touch, not a drag. */
const GESTURE_SLOP = 9;
/** Inertia: the gentle coast after release — brief by design (§7). */
const COAST_TAU = 120; /* ms — exponential decay constant */
const COAST_MAX_MS = 340; /* the coast never outlives ~a third of a second */
const COAST_MIN_V = 0.05; /* px/ms — below this, stillness */
const COAST_MAX_V = 3.5; /* px/ms — a flick is heard, not obeyed forever */
/** How long after a gesture a click is still suspected of being a drag. */
const CLICK_GUARD_MS = 300;
/** The settle debounce — the heavy work runs once, after the walk rests. */
const SETTLE_MS = 140;

interface Sample {
  x: number;
  y: number;
  t: number;
}

const BRANCH_ICONS: Record<BranchId | "channeling", typeof Atom> = {
  interplanetary: Orbit,
  healing: HeartPulse,
  quantum: Atom,
  evolvemed: Dna,
  invent: NotebookPen,
  manifesting: Sparkles,
  channeling: Sparkle,
};

const STORE_KEY = "mirror-suggestion-tree";
const HINT_KEY = "mirror-suggestion-tree-hint";

/* ------------------------------ layout ------------------------------ */

type TreeNodeId = BranchId | "channeling";

interface LeafPos {
  text: string;
  score: number;
  y: number;
  isBud: boolean;
  /** A grown branch's movement — the seventh, the pause, rests open. */
  type?: BranchType;
  /** Why this branch grew here — its honest reason. */
  reason?: string;
  /** The channel's resting note — before anything has been grown. */
  quiet?: boolean;
}

interface ScopePos {
  key: string;
  label: string;
  y: number;
  leaves: LeafPos[];
  bloomable: boolean;
  connected: boolean;
  /** The leading scope's continuation is revealed one whisper further. */
  continuation?: boolean;
}

interface BranchPos {
  id: TreeNodeId;
  label: string;
  y: number;
  top: number;
  bottom: number;
  leading: boolean;
  scopes: ScopePos[];
}

interface TreeLayout {
  height: number;
  branches: BranchPos[];
}

/* ------------------------------ chips ------------------------------- */

function TreeLeafChip({
  leaf,
  leading,
  onPick,
  disabled,
  testId,
}: {
  leaf: LeafPos;
  leading: boolean;
  onPick: () => void;
  disabled: boolean;
  testId?: string;
}) {
  const t = useT();
  const label = t(leaf.text);
  const connected = leaf.isBud || leaf.score > 0;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid={testId}
      title={leaf.reason ? `${label} — ${leaf.reason}` : label}
      style={{ width: LEAF_W }}
      className={`focus-glow relative line-clamp-2 rounded-full border px-3 py-1 text-left text-[11.5px] leading-[1.25] transition-colors duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
        leaf.isBud
          ? "border-[color-mix(in_srgb,var(--gd)_55%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,var(--glass-bg))] text-foreground/90"
          : connected
            ? "border-[color-mix(in_srgb,var(--gd)_38%,transparent)] bg-[var(--glass-bg)] text-foreground/85"
            : "hairline bg-[var(--glass-bg)] text-muted-foreground"
      } ${
        leading && connected
          ? "shadow-[0_0_12px_color-mix(in_srgb,var(--gd)_16%,transparent)]"
          : ""
      }`}
    >
      {/* the resonance reveal — when the conversation moves and this
          whisper arrives (or re-arrives) at the tip, it shimmers once,
          gold, and then simply belongs. The keyed remount plays the
          animation exactly once per arrival. */}
      {leading && connected && (
        <span
          key={`reveal-${leaf.text}`}
          aria-hidden="true"
          className="resonance-reveal pointer-events-none absolute inset-0 rounded-full"
        />
      )}
      {leaf.isBud && leaf.type && leaf.type !== "pause" && (
        <span
          className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] leading-[1.6] text-[var(--gd)]"
          style={{
            border: "1px solid color-mix(in srgb, var(--gd) 34%, transparent)",
          }}
        >
          {t(BRANCH_TYPE_LABELS[leaf.type])}
        </span>
      )}
      {label}
    </button>
  );
}

/** One echo whisper — a distant star of the far field. */
function EchoChip({
  text,
  onPick,
  disabled,
  testId,
}: {
  text: string;
  onPick: () => void;
  disabled: boolean;
  testId?: string;
}) {
  const t = useT();
  const label = t(text);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid={testId}
      title={label}
      style={{ width: ECHO_CHIP_W }}
      className="focus-glow line-clamp-2 rounded-full border border-[color-mix(in_srgb,var(--gd)_16%,var(--hairline))] bg-[color-mix(in_srgb,var(--glass-bg)_55%,transparent)] px-3 py-1 text-left text-[10.5px] leading-[1.25] text-muted-foreground/70 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--gd)_34%,transparent)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

/* ------------------------------ the tree ---------------------------- */

export function SuggestionTree({
  focusBranch,
  lockedBranch,
  prioritizeScopes,
  contextText,
  onPick,
  disabled = false,
  testIdPrefix = "tree",
  ariaLabel,
  className,
  channeling,
  transmitting,
}: {
  /** The branch the window rests on when nothing is being spoken yet. */
  focusBranch?: BranchId;
  /** THE CATEGORIZATION LAW: when set, the tree grows only this
      branch — the branches of suggestions belong to the category the
      visitor is walking in (the channel's mode, the world's branch). */
  lockedBranch?: BranchId;
  /** Tree scope keys that lead the locked branch when a window is
      open — quantum's active scope, the med nexus' active vector. */
  prioritizeScopes?: string[];
  contextText: string;
  onPick: (suggestion: string) => void;
  disabled?: boolean;
  testIdPrefix?: string;
  ariaLabel?: string;
  className?: string;
  /** The branches grown from THIS conversation — they hang at the top
      as the channeling branch, tied to the general branch by an
      elastic line. Grown quietly with every exchange; no button. */
  channeling?: LearnedBranch[];
  /** True while a transmission is being revealed — the tree drops
      down to rest and lifts only when the visitor reaches for it. */
  transmitting?: boolean;
}) {
  const t = useT();
  const reduceMotion = useReducedMotion();

  /* ---------------- the hydration law ------------------------------- */
  /*  The first render — on the server and on the client alike — must
      be one deterministic tree. The learning memory (a browser thing)
      joins only after the mount; a plain re-render, never a mismatch. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    /* deferred — the learning memory joins after the first paint */
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  /* ---------------- the never-repeating memory ---------------------- */
  /*  The whispers already offered (per identity) are withheld from
      every rotation — the tree renders new branches as it is walked. */
  const [seenNonce, setSeenNonce] = useState(0);
  useEffect(() => {
    const onIdentity = () => setSeenNonce((n) => n + 1);
    window.addEventListener(LEARNING_IDENTITY_EVENT, onIdentity);
    return () => window.removeEventListener(LEARNING_IDENTITY_EVENT, onIdentity);
  }, []);

  /* ---------------- the living tree, ranked by the conversation ---- */
  const ranked = useMemo(
    () =>
      buildSuggestionTree(
        contextText,
        mounted ? loadSeen() : undefined,
        lockedBranch,
        prioritizeScopes
      ),
    [contextText, seenNonce, mounted, lockedBranch, prioritizeScopes]
  );
  const rankedRef = useRef(ranked);
  useEffect(() => {
    rankedRef.current = ranked;
  }, [ranked]);

  /* ---------------- the echo fields --------------------------------- */
  /*  Every whisper of the tree, flattened — the far fields wander
      this pool with their own strides, so walking sideways always
      meets another face of the laboratory's questions. Data only. */
  const echoPool = useMemo(() => {
    const texts: string[] = [];
    for (const b of ranked)
      for (const s of b.scopes)
        for (const l of s.leaves)
          if (l.text && !texts.includes(l.text)) texts.push(l.text);
    return texts;
  }, [ranked]);
  const [echoPhase] = useState(0);

  /* ---------------- geometry ---------------------------------------- */
  const leadingId: BranchId = useMemo(() => {
    let best: BranchId | null = null;
    let bestScore = 0;
    for (const b of ranked) {
      const s = b.resonance;
      if (s > bestScore) {
        bestScore = s;
        best = b.id;
      }
    }
    if (bestScore > 0 && best) return best;
    return focusBranch ?? ranked[0]?.id ?? "interplanetary";
  }, [ranked, focusBranch]);

  /* bloom offsets — which whispers each scope shows.
     THE VARIETY LAW: the FIRST rotation of every scope is drawn fresh
     per visit (a stable random offset per scope), so no visitor — and
     no visit — begins at the same fragment of the Absolute; the walk
     then keeps turning the fields, and the per-identity memory
     withholds everything already offered. */
  const [offsets, setOffsets] = useState<Map<string, number>>(new Map());
  const offsetsRef = useRef(offsets);
  const setOffsetsBoth = useCallback((next: Map<string, number>) => {
    offsetsRef.current = next;
    setOffsets(next);
  }, []);

  /* THE VARIETY LAW — dealt AFTER the first paint (hydration stays
     deterministic): one gentle re-deal per visit gives every scope a
     fresh starting fragment, so no visitor — and no visit — begins at
     the same whispers; the walk then keeps turning the fields and the
     per-identity memory withholds everything already offered. */
  const dealtRef = useRef(false);
  useEffect(() => {
    if (dealtRef.current) return;
    dealtRef.current = true;
    const next = new Map(offsetsRef.current);
    let changed = false;
    for (const b of ranked) {
      for (const s of b.scopes) {
        if (!next.has(s.key) && s.leaves.length > 1) {
          next.set(s.key, Math.floor(Math.random() * s.leaves.length));
          changed = true;
        }
      }
    }
    if (changed) setOffsetsBoth(next);
  }, [ranked, setOffsetsBoth]);

  /* the layout is computed ONLY when the graph's structure changes —
     never during a pan. Panning moves the camera; the graph stands. */
  const layout: TreeLayout = useMemo(() => {
    type ScopeDefLeaf = {
      text: string;
      score: number;
      isBud?: boolean;
      type?: BranchType;
      reason?: string;
      quiet?: boolean;
    };
    /* the leading scope of the leading branch — its continuation
       breathes one whisper further open, revealed by resonance */
    const leadingBranch = ranked.find((b) => b.id === leadingId);
    let leadingScopeKey: string | null = null;
    if (leadingBranch) {
      let best = -1;
      for (const s of leadingBranch.scopes) {
        const top = s.leaves[0]?.score ?? 0;
        if (top > best) {
          best = top;
          leadingScopeKey = s.key;
        }
      }
    }
    const branches: BranchPos[] = [];
    let y = 10;

    /* ---- the channeling branch — the conversation's own branch ---- */
    const grownLeaves: ScopeDefLeaf[] = (channeling ?? []).map((b) => ({
      text: b.question,
      score: 1,
      isBud: true,
      type: b.type,
      reason: b.reason,
    }));
    const chLeaves: ScopeDefLeaf[] =
      grownLeaves.length > 0
        ? grownLeaves
        : [
            {
              text: "Speak, and branches grow from your words",
              score: 0,
              quiet: true,
            },
          ];
    {
      const top = y;
      const shown: LeafPos[] = chLeaves.map((leaf, i) => ({
        text: leaf.text,
        score: leaf.score,
        y: y + LABEL_H + i * LEAF_ROW_H,
        isBud: !!leaf.isBud,
        type: leaf.type,
        reason: leaf.reason,
        quiet: leaf.quiet,
      }));
      y += LABEL_H + shown.length * LEAF_ROW_H + BLOCK_GAP;
      branches.push({
        id: "channeling",
        label: t("Channeling"),
        y: (top + y - BLOCK_GAP) / 2,
        top,
        bottom: y - BLOCK_GAP,
        leading: false,
        scopes: [
          {
            key: "channeling",
            label: t("From this conversation"),
            y: top + LABEL_H / 2,
            leaves: shown,
            bloomable: false,
            connected: grownLeaves.length > 0,
          },
        ],
      });
      y += BRANCH_GAP;
    }

    for (const branch of ranked) {
      const top = y;
      const scopes: ScopePos[] = [];
      const scopeDefs: {
        key: string;
        label: string;
        leaves: ScopeDefLeaf[];
        bloomable: boolean;
      }[] = branch.scopes.map((s) => ({
        key: s.key,
        label: t(s.label),
        leaves: s.leaves as ScopeDefLeaf[],
        bloomable: true,
      }));
      for (const scope of scopeDefs) {
        const offset = offsets.get(scope.key) ?? 0;
        const revealContinuation =
          branch.id === leadingId &&
          scope.key === leadingScopeKey &&
          scope.leaves.length > SHOWN;
        const count = scope.bloomable
          ? revealContinuation
            ? SHOWN + 1
            : SHOWN
          : scope.leaves.length;
        const shown: LeafPos[] = [];
        for (let i = 0; i < count; i++) {
          const idx =
            scope.bloomable && scope.leaves.length > 0
              ? (offset + i) % scope.leaves.length
              : i;
          const leaf = scope.leaves[idx];
          if (leaf)
            shown.push({
              text: leaf.text,
              score: leaf.score,
              y: y + LABEL_H + i * LEAF_ROW_H,
              isBud: false,
            });
        }
        scopes.push({
          key: scope.key,
          label: scope.label,
          y: y + LABEL_H / 2,
          leaves: shown,
          bloomable: scope.bloomable,
          connected: shown.some((l) => l.score > 0),
          continuation: revealContinuation,
        });
        y += LABEL_H + count * LEAF_ROW_H + BLOCK_GAP;
      }
      branches.push({
        id: branch.id,
        label: t(branch.label),
        y: (top + y - BLOCK_GAP) / 2,
        top,
        bottom: y - BLOCK_GAP,
        leading: branch.id === leadingId,
        scopes,
      });
      y += BRANCH_GAP;
    }
    return { height: Math.max(y - BRANCH_GAP + 14, 400), branches };
  }, [ranked, offsets, leadingId, channeling, t]);
  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  /* ---------------- the period and the refs ------------------------- */
  /*  One grove's height — the tree plus the air between groves. The
      groves are identical, so any shift by a whole period is pixel for
      pixel the same view: the law the endless walk lives by. */
  const period = layout.height + WRAP_GAP;
  const periodRef = useRef(period);
  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  /* ---------------- the window -------------------------------------- */
  const [state, setState] = useState<TreeState>("grove");
  const stateRef = useRef<TreeState>("grove");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const vpRef = useRef(vp);
  useEffect(() => {
    vpRef.current = vp;
  }, [vp]);
  const [hintSeen, setHintSeen] = useState(false);
  const hintSeenRef = useRef(false);
  useEffect(() => {
    hintSeenRef.current = hintSeen;
  }, [hintSeen]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORE_KEY) as TreeState | null;
    const hasHint = !!window.localStorage.getItem(HINT_KEY);
    /* deferred — the saved resting size returns after the first paint */
    const id = window.setTimeout(() => {
      if (saved === "rest" || saved === "grove" || saved === "canopy")
        setState(saved);
      if (hasHint) {
        setHintSeen(true);
        hintSeenRef.current = true;
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  /* ---------------- the transmission law ----------------------------- */
  /*  When a transmission starts loading, every branch drops down —
      the reveal deserves the whole frame. The line lifts only when
      the visitor wants to jump to another branch. */
  const programmaticDrop = useRef(false);
  const prevTransmitRef = useRef(false);
  useEffect(() => {
    const now = !!transmitting;
    const was = prevTransmitRef.current;
    prevTransmitRef.current = now;
    if (now && !was && stateRef.current !== "rest") {
      programmaticDrop.current = true;
      /* deferred — the drop lands after this render settles */
      const id = window.setTimeout(() => setState("rest"), 0);
      return () => window.clearTimeout(id);
    }
  }, [transmitting]);

  useEffect(() => {
    /* the transmission law — an auto-drop is never the visitor's choice,
       so it is never saved as their preferred resting size */
    if (programmaticDrop.current) {
      programmaticDrop.current = false;
      return;
    }
    window.localStorage.setItem(STORE_KEY, state);
  }, [state]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || state === "rest") return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setVp((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  /* ==================================================================
     THE CAMERA — everything below runs on refs, never on state.
     During a gesture: ZERO React renders. Only the world's transform
     is written, once per frame, under one rAF lock. When the walk
     settles, the heavy work happens exactly once.
     ================================================================== */

  const cam = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<"idle" | "drag" | "coast" | "glide">("idle");
  const glideRef = useRef<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    start: number;
    dur: number;
  } | null>(null);
  const lastFrameRef = useRef(0);
  const coastStartRef = useRef(0);
  const dragPointerRef = useRef(-1);
  const lastPtRef = useRef({ x: 0, y: 0, t: 0 });
  const samplesRef = useRef<Sample[]>([]);
  const movedRef = useRef(0);
  const gestureEndAtRef = useRef(0);
  const lastPanRef = useRef(0);
  const settleTimerRef = useRef<number | null>(null);
  const driftTimerRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);
  useEffect(() => {
    reduceMotionRef.current = !!reduceMotion;
  }, [reduceMotion]);

  /* the visible world — a handful of grove tiles around the window,
     re-derived only when the needed set changes (seam crossings) */
  const [tiles, setTiles] = useState<number[]>([0]);
  const tilesRef = useRef<number[]>([0]);
  /* the drawn band — which rows of the graph exist as elements,
     recomputed when the walk settles, never while the finger moves */
  const [band, setBand] = useState(() => ({
    top: -bandBuffer(0),
    bottom: HEIGHTS.canopy + bandBuffer(0),
  }));
  const bandBucketRef = useRef<number | null>(null);

  /* ---------------- the one paint ------------------------------------ */
  const paint = useCallback(() => {
    const el = worldRef.current;
    if (el)
      el.style.transform = `translate3d(${cam.current.x}px, ${cam.current.y}px, 0)`;
  }, []);

  /* ---------------- which grove tiles does the window need ----------- */
  const checkTiles = useCallback(() => {
    const h = periodRef.current;
    if (h <= 0) return;
    const v = vpRef.current;
    const buf = bandBuffer(v.h);
    const top = -cam.current.y - buf;
    const bottom = -cam.current.y + v.h + buf;
    const kMin = Math.floor(top / h);
    const kMax = Math.floor(bottom / h);
    const next: number[] = [];
    for (let k = kMin; k <= kMax && next.length < 4; k++) next.push(k);
    const cur = tilesRef.current;
    if (next.length !== cur.length || next.some((k, i) => k !== cur[i])) {
      tilesRef.current = next;
      setTiles(next);
    }
  }, []);

  /* ---------------- the forward doors ---------------------------------
     The engine is one circle — the frame ends in a settle, the settle
     may begin a glide, the glide lives inside a frame. The circle is
     closed through refs, so every function is declared before it is
     used and no closure is ever captured half-born. */
  const frameRef = useRef<(now: number) => void>(() => {});
  const glideToRef = useRef<(toX: number, toY: number, dur: number) => void>(
    () => {}
  );
  /* the walk's last reveal point — where the fresh-whisper counter sits */
  const lastRevealRef = useRef({ x: 0, y: 0 });

  /* ---------------- the settle --------------------------------------- */
  /*  The walk has rested. Now — and only now — the heavy work: the
      stability reconciliation, the memory, the re-anchor, the drawn
      band. Once. */

  /* --- THE STABILITY LAW ---------------------------------------------
     The whispers under the resting hand never swap. When the walk
     draws a new stretch of the grove, only the scopes that are
     ENTERING the window turn their fields — and they turn BEFORE they
     are drawn, so the fresh face is the first face the visitor sees.
     A scope that stays visible through the walk keeps its whispers
     exactly where they stood: the visitor who stops to choose is
     never answered with a moving target. A scope that leaves and
     returns meets a fresh face — the grove still turns, but only
     where the visitor is not. (The echo fields hold still for the
     same reason; their rows are fresh by their own stride.) */
  const prevVisibleRef = useRef<Set<string> | null>(null);
  const rotateEnteringScopes = useCallback(() => {
    const v = vpRef.current;
    if (v.h === 0) return;
    const h = periodRef.current;
    if (h <= 0) return;
    const cyM = ((cam.current.y % h) + h) % h;
    const homeTop = -cyM - 40;
    const homeBottom = -cyM + v.h + 40;
    const rankedNow = rankedRef.current;
    const layoutNow = layoutRef.current;
    const visible: {
      scopeKey: string;
      total: number;
      branch: TreeNodeId;
      label: string;
    }[] = [];
    for (const b of layoutNow.branches) {
      if (b.id === "channeling") continue;
      if (b.bottom < homeTop || b.top > homeBottom) continue;
      for (const s of b.scopes) {
        if (!s.bloomable) continue;
        if (s.y < homeTop || s.y > homeBottom) continue;
        const total =
          rankedNow
            .find((rb) => rb.id === b.id)
            ?.scopes.find((rs) => rs.key === s.key)?.leaves.length ?? 0;
        if (total <= SHOWN) continue;
        visible.push({ scopeKey: s.key, total, branch: b.id, label: s.label });
      }
    }
    const visibleKeys = new Set(visible.map((s) => s.scopeKey));
    const prev = prevVisibleRef.current;
    prevVisibleRef.current = visibleKeys;
    /* the first inventory only takes note — nothing turns yet */
    if (!prev) return;
    const entering = visible.filter((s) => !prev.has(s.scopeKey));
    if (entering.length === 0) return;
    /* the next offsets are computed from the offsets we already hold —
       the whispers about to stand at the tips are remembered at once,
       so what was shown is never offered again */
    const nextOffsets = new Map(offsetsRef.current);
    const freshTexts: string[] = [];
    for (const tScope of entering) {
      const nextOffset =
        ((nextOffsets.get(tScope.scopeKey) ?? 0) + SHOWN) % tScope.total;
      nextOffsets.set(tScope.scopeKey, nextOffset);
      const leaves =
        rankedNow
          .find((rb) => rb.id === tScope.branch)
          ?.scopes.find((rs) => rs.key === tScope.scopeKey)?.leaves ?? [];
      for (let i = 0; i < SHOWN; i++) {
        const leaf = leaves[(nextOffset + i) % leaves.length];
        if (leaf) freshTexts.push(leaf.text);
      }
    }
    offsetsRef.current = nextOffsets;
    setOffsets(nextOffsets);
    recordSeen(freshTexts);
    recordJourney({ b: entering[0].branch, s: entering[0].label });
  }, []);

  const runSettle = useCallback(() => {
    settleTimerRef.current = null;
    if (stateRef.current === "rest" || vpRef.current.h === 0) return;
    if (modeRef.current !== "idle") return;

    /* --- the stability reconciliation — scopes that entered the
       window during the last stretch of the walk turn their fields
       now; scopes that were already visible keep their whispers --- */
    rotateEnteringScopes();

    /* --- the seam — past the tree's end, the next grove begins. A
       shift by one whole period is pixel for pixel the same view. --- */
    const cy = cam.current.y;
    const h = periodRef.current;
    if (h > 0) {
      const rebased = ((cy % h) + h) % h;
      if (rebased !== cy) {
        cam.current.y = rebased;
        paint();
      }
    }
    lastRevealRef.current = { x: cam.current.x, y: cam.current.y };

    /* --- the elastic homing — a window hanging beyond the echo fields
       drifts gently back into the grove; a breath, not a snap --- */
    const w = vpRef.current.w;
    if (w > 0) {
      const lo = Math.min(0, w - CANVAS_W);
      const clamped = Math.max(lo, Math.min(0, cam.current.x));
      if (Math.abs(clamped - cam.current.x) >= 8) {
        glideToRef.current(clamped, cam.current.y, 700);
      }
    }

    /* --- the drawn band — computed around where the camera NOW rests
       (after the re-anchor), so the culled rows are exactly the rows
       the window will see --- */
    const v = vpRef.current;
    const buf = bandBuffer(v.h);
    const bandTopNow = -cam.current.y - buf;
    const bandBottomNow = -cam.current.y + v.h + buf;
    setBand({ top: bandTopNow, bottom: bandBottomNow });
    bandBucketRef.current = Math.round(-cam.current.y / BAND_BUCKET);
    checkTiles();
  }, [paint, checkTiles, rotateEnteringScopes]);

  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current != null)
      window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(runSettle, SETTLE_MS);
  }, [runSettle]);

  /* ---------------- the rAF lock ------------------------------------- */
  /*  At most ONE frame is ever scheduled. While nothing moves, there
      is no frame at all — the CPU rests with the visitor. The frame
      reaches itself through frameRef, so the loop needs no self-name. */
  const scheduleFrame = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame((n) => frameRef.current(n));
  }, []);

  const stopMotion = useCallback(() => {
    glideRef.current = null;
    vel.current.x = 0;
    vel.current.y = 0;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* the drawn band in wide steps — a structural refresh at most once
     every BAND_BUCKET pixels of travel, so rows rise while the walk
     is still moving without ever rerendering per pixel. The stability
     law rides the same moment: scopes entering the band turn their
     fields BEFORE the band is drawn, so their fresh face is the first
     face the visitor sees — never a swap after the hand rests. */
  const syncBand = useCallback(() => {
    const v = vpRef.current;
    if (v.h === 0) return;
    const bucket = Math.round(-cam.current.y / BAND_BUCKET);
    if (bucket === bandBucketRef.current) return;
    bandBucketRef.current = bucket;
    rotateEnteringScopes();
    const buf = bandBuffer(v.h);
    setBand({
      top: -cam.current.y - buf,
      bottom: -cam.current.y + v.h + buf,
    });
  }, [rotateEnteringScopes]);

  /* ---------------- the glide ---------------------------------------- */
  /*  A short, finite journey — homing, centering, the arrow keys.
      The rAF loop exists only while the glide breathes. */
  const glideTo = useCallback(
    (toX: number, toY: number, dur: number) => {
      glideRef.current = {
        fromX: cam.current.x,
        fromY: cam.current.y,
        toX,
        toY,
        start: performance.now(),
        dur,
      };
      modeRef.current = "glide";
      lastFrameRef.current = 0;
      scheduleFrame();
    },
    [scheduleFrame]
  );

  const frame = useCallback(
    (now: number) => {
      rafRef.current = null;
      const m = modeRef.current;

      if (m === "coast") {
        const dt = Math.min(48, now - (lastFrameRef.current || now));
        lastFrameRef.current = now;
        const decay = Math.exp(-dt / COAST_TAU);
        vel.current.x *= decay;
        vel.current.y *= decay;
        cam.current.x += vel.current.x * dt;
        cam.current.y += vel.current.y * dt;
        const still =
          Math.abs(vel.current.x) + Math.abs(vel.current.y) < COAST_MIN_V;
        const spent = now - coastStartRef.current > COAST_MAX_MS;
        paint();
        syncBand();
        checkTiles();
        if (still || spent) {
          vel.current.x = 0;
          vel.current.y = 0;
          modeRef.current = "idle";
          scheduleSettle();
        } else {
          rafRef.current = requestAnimationFrame((n) => frameRef.current(n));
        }
        return;
      }

      if (m === "glide" && glideRef.current) {
        const g = glideRef.current;
        const p = Math.min(1, (now - g.start) / g.dur);
        /* the house ease — one breath, then rest */
        const e = 1 - Math.pow(1 - p, 5);
        cam.current.x = g.fromX + (g.toX - g.fromX) * e;
        cam.current.y = g.fromY + (g.toY - g.fromY) * e;
        paint();
        syncBand();
        checkTiles();
        if (p >= 1) {
          modeRef.current = "idle";
          glideRef.current = null;
          lastRevealRef.current = { x: cam.current.x, y: cam.current.y };
          scheduleSettle();
        } else {
          rafRef.current = requestAnimationFrame((n) => frameRef.current(n));
        }
        return;
      }

      /* drag — the pointer already moved the world; this frame only
         puts it on screen, keeps the tiles honest, and advances the
         drawn band in wide steps so new rows rise while walking */
      paint();
      syncBand();
      checkTiles();
    },
    [paint, checkTiles, syncBand, scheduleSettle]
  );

  /* the doors are hung once — the callbacks are stable, so the refs
     they close the circle through are set in an effect, never in a
     render */
  useEffect(() => {
    glideToRef.current = glideTo;
    frameRef.current = frame;
  }, [glideTo, frame]);

  /* ---------------- the pointer gestures ------------------------------ */
  /*  Pointer Events own the walk: down captures the gesture on the
      window, move accumulates into the camera (refs only), up hands
      the walk to a brief coast. Extra fingers are ignored. Every end
      — up, cancel, lost gesture — cleans up after itself. The three
      window handlers are STABLE callbacks, registered once per gesture
      and removed by their exact identities — a removal can never fail. */

  const pushSample = useCallback((x: number, y: number, t: number) => {
    const arr = samplesRef.current;
    arr.push({ x, y, t });
    if (arr.length > 6) arr.shift();
  }, []);

  const velocityFromSamples = useCallback(() => {
    const arr = samplesRef.current;
    if (arr.length < 2) return { x: 0, y: 0 };
    const last = arr[arr.length - 1];
    let first = arr[0];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (last.t - arr[i].t <= 90) first = arr[i];
      else break;
    }
    const dt = last.t - first.t;
    if (dt <= 0) return { x: 0, y: 0 };
    const clamp = (v: number) =>
      Math.max(-COAST_MAX_V, Math.min(COAST_MAX_V, v));
    return {
      x: clamp((last.x - first.x) / dt),
      y: clamp((last.y - first.y) / dt),
    };
  }, []);

  /* the gesture's listener trio lives in a ref so the remover — used
     by the handlers themselves, by the sleeping tab, and by the final
     silence — can always reach the exact functions that were added */
  const gestureListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  }>({ move: () => {}, up: () => {}, cancel: () => {} });

  const detachGesture = useCallback(() => {
    const h = gestureListenersRef.current;
    window.removeEventListener("pointermove", h.move);
    window.removeEventListener("pointerup", h.up);
    window.removeEventListener("pointercancel", h.cancel);
  }, []);

  /* the shared ending of every gesture — cancel and release alike */
  const finishGesture = useCallback(
    (cancelled: boolean) => {
      gestureEndAtRef.current = Date.now();
      lastPanRef.current = Date.now();
      if (modeRef.current !== "drag") return;
      if (cancelled || reduceMotionRef.current) {
        modeRef.current = "idle";
        paint();
        scheduleSettle();
        return;
      }
      const v = velocityFromSamples();
      if (Math.abs(v.x) + Math.abs(v.y) > COAST_MIN_V * 3) {
        vel.current = v;
        coastStartRef.current = performance.now();
        lastFrameRef.current = performance.now();
        modeRef.current = "coast";
        scheduleFrame();
      } else {
        modeRef.current = "idle";
        paint();
        scheduleSettle();
      }
    },
    [paint, scheduleSettle, scheduleFrame, velocityFromSamples]
  );

  const onWindowMove = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== dragPointerRef.current) return;
      const p = lastPtRef.current;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      lastPtRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      if (dx === 0 && dy === 0) return;
      movedRef.current += Math.abs(dx) + Math.abs(dy);
      cam.current.x += dx;
      cam.current.y += dy;
      lastPanRef.current = Date.now();
      pushSample(e.clientX, e.clientY, e.timeStamp);
      scheduleFrame();
    },
    [pushSample, scheduleFrame]
  );
  const onWindowUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== dragPointerRef.current) return;
      dragPointerRef.current = -1;
      detachGesture();
      finishGesture(false);
    },
    [detachGesture, finishGesture]
  );
  const onWindowCancel = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== dragPointerRef.current) return;
      dragPointerRef.current = -1;
      detachGesture();
      finishGesture(true);
    },
    [detachGesture, finishGesture]
  );
  useEffect(() => {
    gestureListenersRef.current = {
      move: onWindowMove,
      up: onWindowUp,
      cancel: onWindowCancel,
    };
  }, [onWindowMove, onWindowUp, onWindowCancel]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (stateRef.current === "rest") return;
    if (dragPointerRef.current !== -1) return; /* one finger owns the walk */
    if (!e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragPointerRef.current = e.pointerId;
    movedRef.current = 0;
    lastPtRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    samplesRef.current = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
    /* a new touch silences every coast and glide — the finger is king */
    stopMotion();
    modeRef.current = "drag";
    lastPanRef.current = Date.now();
    if (!hintSeenRef.current) {
      hintSeenRef.current = true;
      setHintSeen(true);
      window.localStorage.setItem(HINT_KEY, "seen");
    }
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowCancel);
  };

  /* a click that arrives just after a real drag is the drag's shadow —
     it is heard once and ignored. No timers, no delay patches. */
  const clickGuarded = useCallback(() => {
    return (
      movedRef.current > GESTURE_SLOP &&
      Date.now() - gestureEndAtRef.current < CLICK_GUARD_MS
    );
  }, []);

  /* ---------------- wheel panning -------------------------------------
     the canvas answers the wheel too — instant in every direction,
     unbounded: the window follows the hand, and ONE settle timer (not
     one per event) runs the heavy work a breath after the last turn. */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || state === "rest") return;
    const onWheel = (e: WheelEvent) => {
      if (vpRef.current.w === 0) return;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dx = -(e.shiftKey ? e.deltaY : e.deltaX) * k;
      const dy = e.shiftKey ? 0 : -e.deltaY * k;
      if (dx === 0 && dy === 0) return;
      e.preventDefault();
      stopMotion();
      modeRef.current = "idle";
      cam.current.x += dx;
      cam.current.y += dy;
      lastPanRef.current = Date.now();
      if (!hintSeenRef.current) {
        hintSeenRef.current = true;
        setHintSeen(true);
        window.localStorage.setItem(HINT_KEY, "seen");
      }
      paint();
      checkTiles();
      scheduleSettle();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [state, paint, checkTiles, scheduleSettle, stopMotion]);

  /* ---------------- the window drifts to the leading branch ---------- */
  const firstCenterRef = useRef(true);
  const centerOn = useCallback(
    (id: TreeNodeId) => {
      const v = vpRef.current;
      if (v.w === 0) return;
      const branch = layoutRef.current.branches.find((b) => b.id === id);
      /* wide windows see the whole tree, trunk to whispers; narrow
         windows rest on the leaf field, as they always have */
      const lo = Math.min(0, v.w - CANVAS_W);
      const tx =
        v.w >= TREE_W - 8
          ? -ECHO_W
          : Math.max(lo, Math.min(0, -(ECHO_W + LEAF_X - v.w * 0.12)));
      const targetY = branch ? (branch.top + branch.bottom) / 2 : 0;
      const minY = Math.min(0, v.h - layoutRef.current.height);
      const ty = Math.max(minY, Math.min(0, v.h / 2 - targetY));
      if (firstCenterRef.current || reduceMotionRef.current) {
        /* the first rest lands without a journey — no load-time slide */
        firstCenterRef.current = false;
        stopMotion();
        modeRef.current = "idle";
        cam.current.x = tx;
        cam.current.y = ty;
        lastRevealRef.current = { x: tx, y: ty };
        paint();
        scheduleSettle();
      } else {
        glideTo(tx, ty, 1050);
      }
    },
    [paint, scheduleSettle, stopMotion, glideTo]
  );

  useEffect(() => {
    if (Date.now() - lastPanRef.current < 6000) return;
    centerOn(leadingId);
    /* re-center on branch change, resize and window-size change */
  }, [leadingId, vp.w, vp.h, state, centerOn]);

  /* ---------------- the walk ----------------------------------------- */
  /*  The DNA evolutionary timeline — every arrival at a leading branch
      is one rung of the helix. The helix itself rests in the visitor's
      profile; the tree only keeps the walk. */
  useEffect(() => {
    recordJourney({ b: leadingId });
  }, [leadingId]);

  /* ---------------- the hub link -------------------------------------
     the branches grown at a reply's foot are linked with the tree: the
     drift event opens the resting line and glides to their branch */
  useEffect(() => {
    const onDrift = (e: Event) => {
      const detail = (e as CustomEvent<{ branch?: string }>).detail;
      const id = detail?.branch;
      if (!id) return;
      if (stateRef.current === "rest") setState("grove");
      lastPanRef.current = 0;
      if (driftTimerRef.current != null)
        window.clearTimeout(driftTimerRef.current);
      /* one breath for the window to take its size again */
      driftTimerRef.current = window.setTimeout(() => {
        driftTimerRef.current = null;
        centerOn(id as TreeNodeId);
      }, 80);
    };
    window.addEventListener(TREE_DRIFT_EVENT, onDrift);
    return () => {
      window.removeEventListener(TREE_DRIFT_EVENT, onDrift);
      if (driftTimerRef.current != null) {
        window.clearTimeout(driftTimerRef.current);
        driftTimerRef.current = null;
      }
    };
  }, [centerOn]);

  /* ---------------- keyboard panning --------------------------------- */
  const onKeyPan = (e: React.KeyboardEvent) => {
    const step = 90;
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = step;
    else if (e.key === "ArrowRight") dx = -step;
    else if (e.key === "ArrowUp") dy = step;
    else if (e.key === "ArrowDown") dy = -step;
    else return;
    e.preventDefault();
    lastPanRef.current = Date.now();
    if (!hintSeenRef.current) {
      hintSeenRef.current = true;
      setHintSeen(true);
      window.localStorage.setItem(HINT_KEY, "seen");
    }
    if (reduceMotionRef.current) {
      stopMotion();
      modeRef.current = "idle";
      cam.current.x += dx;
      cam.current.y += dy;
      paint();
      scheduleSettle();
    } else {
      glideTo(cam.current.x + dx, cam.current.y + dy, 140);
    }
  };

  /* ---------------- the tab sleeps, the walk sleeps ------------------- */
  /*  When the page hides, every motion stops mid-breath and the engine
      goes silent. Nothing resumes on return — stillness is the rest. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        stopMotion();
        modeRef.current = "idle";
        paint();
        if (settleTimerRef.current != null) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
      } else if (dragPointerRef.current !== -1) {
        /* the gesture died with the tab — clean up its remains */
        dragPointerRef.current = -1;
        detachGesture();
        gestureEndAtRef.current = Date.now();
        scheduleSettle();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stopMotion, paint, detachGesture, scheduleSettle]);

  /* ---------------- the final silence --------------------------------- */
  /*  On unmount: no frame pending, no timer breathing, no listener
      left behind. The engine leaves no trace. */
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current != null)
        window.clearTimeout(settleTimerRef.current);
      detachGesture();
    };
  }, [detachGesture]);

  /* ---------------- the bloom ----------------------------------------- */
  const bloom = (scopeKey: string, total: number, branch: TreeNodeId, label: string) => {
    if (total <= SHOWN) return;
    const nextOffset = ((offsetsRef.current.get(scopeKey) ?? 0) + SHOWN) % total;
    const nextOffsets = new Map(offsetsRef.current);
    nextOffsets.set(scopeKey, nextOffset);
    setOffsetsBoth(nextOffsets);
    /* what the bloom reveals is remembered too — never a repeat */
    const leaves =
      ranked
        .find((rb) => rb.id === branch)
        ?.scopes.find((rs) => rs.key === scopeKey)?.leaves ?? [];
    const freshTexts: string[] = [];
    for (let i = 0; i < SHOWN; i++) {
      const leaf = leaves[(nextOffset + i) % leaves.length];
      if (leaf) freshTexts.push(leaf.text);
    }
    recordSeen(freshTexts);
    recordJourney({ b: branch, s: label });
  };

  const prefix = testIdPrefix;

  /* ---------------- the rested line ---------------------------------- */
  if (state === "rest") {
    return (
      <div
        className={`relative mx-auto w-full max-w-[780px] ${className ?? ""}`}
        data-testid={`${prefix}-tree`}
      >
        <button
          type="button"
          onClick={() => setState("grove")}
          data-testid={`${prefix}-open`}
          aria-label={t("Open the tree")}
          className="focus-glow flex h-9 w-full items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-3.5 text-muted-foreground backdrop-blur-xl transition-colors duration-300 hover:text-foreground"
        >
          <ListTree className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate font-serif text-[12px] italic">
            {t("The whispers")}
          </span>
          <ChevronUp className="ml-auto size-3.5 shrink-0 opacity-70" aria-hidden="true" />
        </button>
      </div>
    );
  }

  /* the elastic line — the channeling branch hangs from the leading
     general branch: the further apart they stand, the more the golden
     thread stretches; each new growth draws it again */
  const elastic = (() => {
    const ch = layout.branches.find((b) => b.id === "channeling");
    const lead = layout.branches.find((b) => b.id === leadingId);
    if (!ch || !lead) return null;
    const y1 = ch.y;
    const y2 = lead.y;
    const dist = Math.abs(y2 - y1);
    const bow = Math.min(96, 30 + dist * 0.24);
    return `M ${TRUNK_X} ${y1.toFixed(1)} C ${(TRUNK_X + bow).toFixed(1)} ${(y1 + (y2 - y1) * 0.3).toFixed(1)}, ${(TRUNK_X + bow).toFixed(1)} ${(y2 - (y2 - y1) * 0.3).toFixed(1)}, ${TRUNK_X} ${y2.toFixed(1)}`;
  })();
  const grownCount = channeling?.length ?? 0;

  /* ---------------- one grove — only the rows near the window --------- */
  /*  The graph's data holds every branch; the DOM holds only the ones
      the window can (almost) see. Everything farther away stays pure
      data — the infinity lives in the data, not in the elements. */
  const renderGrove = (k: number) => {
    /* every grove is the same grove — its whispers all answer to the
       same names, wherever the camera happens to rest */
    const tid = (name: string) => `${prefix}-${name}`;
    const localTop = band.top - k * period;
    const localBottom = band.bottom - k * period;
    const visBranches = layout.branches.filter(
      (b) => b.bottom >= localTop && b.top <= localBottom
    );

    /* the echo rows this grove needs — per lane, a small band of stars */
    const maxEchoRows = Math.max(1, Math.floor((layout.height - 70) / ECHO_ROW));
    const echoRowsFor = (lane: number) => {
      const half = (lane % 2) * (ECHO_ROW / 2);
      const rMin = Math.max(
        0,
        Math.floor((localTop - 14 - half) / ECHO_ROW) - 1
      );
      const rMax = Math.min(
        maxEchoRows - 1,
        Math.ceil((localBottom - 14 - half) / ECHO_ROW)
      );
      const rows: number[] = [];
      for (let r = rMin; r <= rMax; r++) rows.push(r);
      return rows;
    };
    const echoText = (lane: number, r: number): string | null => {
      const len = echoPool.length;
      if (len === 0) return null;
      const idx =
        (((echoPhase + ECHO_SEEDS[lane % 4] + r * 7) % len) + len) % len;
      return echoPool[idx] ?? null;
    };

    return (
      <>
        {/* the echo fields — distant whispers on both sides, only the
            ones the window can almost see */}
        {echoPool.length > 0 &&
          ECHO_LANE_X.map((lx, n) => (
            <div key={`echo-${n}`}>
              {echoRowsFor(n).map((r) => {
                const text = echoText(n, r);
                if (!text) return null;
                return (
                  <div
                    key={r}
                    className="absolute"
                    style={{
                      left: lx,
                      top: 14 + r * ECHO_ROW + (n % 2) * (ECHO_ROW / 2),
                    }}
                  >
                    <EchoChip
                      text={text}
                      disabled={disabled}
                      onPick={() => {
                        if (clickGuarded()) return;
                        recordSeen([text]);
                        setSeenNonce((v) => v + 1);
                        onPick(text);
                      }}
                      testId={tid("echo-chip")}
                    />
                  </div>
                );
              })}
            </div>
          ))}

        {/* the tree itself */}
        <div
          className="absolute top-0"
          style={{ left: ECHO_W, width: TREE_W, height: layout.height }}
        >
          {/* the connectors — one svg per grove, only visible paths,
              riding the world's transform untouched during the pan */}
          <svg
            className="absolute inset-0"
            width={TREE_W}
            height={layout.height}
            aria-hidden="true"
          >
            <line
              x1={TRUNK_X}
              y1={6}
              x2={TRUNK_X}
              y2={layout.height - 6}
              stroke="var(--gd)"
              strokeOpacity={0.4}
              strokeWidth={1.5}
            />
            {elastic && visBranches.some((b) => b.id === "channeling") && (
              <motion.path
                key={`elastic-${leadingId}-${grownCount}`}
                d={elastic}
                fill="none"
                stroke="var(--gd)"
                strokeOpacity={0.7}
                strokeWidth={1.6}
                strokeLinecap="round"
                className="elastic-line"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            {visBranches
              .filter((b) => b.id !== "channeling")
              .map((b) => (
                <g key={b.id}>
                  <line
                    x1={TRUNK_X}
                    y1={b.y}
                    x2={ROOT_X - 12}
                    y2={b.y}
                    stroke="var(--gd)"
                    strokeOpacity={b.leading ? 0.8 : 0.35}
                    strokeWidth={b.leading ? 1.6 : 1}
                  />
                  {b.scopes.map((s) => {
                    const scopeTop = s.y - 16;
                    const scopeBottom =
                      (s.leaves.length > 0
                        ? s.leaves[s.leaves.length - 1].y + 42
                        : s.y + 20);
                    if (scopeBottom < localTop || scopeTop > localBottom)
                      return null;
                    return (
                      <g key={s.key}>
                        <path
                          d={`M ${ROOT_X + 12} ${b.y} C ${(ROOT_X + 12 + SCOPE_DOT_X - 8) / 2} ${b.y}, ${(ROOT_X + 12 + SCOPE_DOT_X - 8) / 2} ${s.y}, ${SCOPE_DOT_X - 8} ${s.y}`}
                          fill="none"
                          stroke="var(--gd)"
                          strokeOpacity={
                            b.leading && s.connected ? 0.7 : b.leading ? 0.5 : 0.26
                          }
                          strokeWidth={b.leading ? 1.2 : 1}
                        />
                        {s.leaves.map((leaf, i) => (
                          <path
                            key={`${s.key}-${i}`}
                            d={`M ${SCOPE_DOT_X + 3} ${s.y} C ${(SCOPE_DOT_X + 3 + LEAF_X - 8) / 2} ${s.y}, ${(SCOPE_DOT_X + 3 + LEAF_X - 8) / 2} ${leaf.y + 19}, ${LEAF_X - 8} ${leaf.y + 19}`}
                            fill="none"
                            stroke="var(--gd)"
                            strokeOpacity={
                              b.leading && leaf.score > 0 ? 0.65 : 0.24
                            }
                            strokeWidth={leaf.score > 0 && b.leading ? 1.2 : 1}
                          />
                        ))}
                      </g>
                    );
                  })}
                </g>
              ))}
          </svg>

          {/* the branch roots */}
          {visBranches.map((b) => {
            const Icon = BRANCH_ICONS[b.id];
            return (
              <div key={b.id} className="absolute" style={{ left: 0, top: 0 }}>
                <div
                  className="absolute flex items-center"
                  style={{ left: ROOT_X - 12, top: b.y - 12 }}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border bg-[var(--glass-bg)] transition-colors duration-500 ${
                      b.leading
                        ? "border-[color-mix(in_srgb,var(--gd)_60%,transparent)] shadow-[0_0_14px_color-mix(in_srgb,var(--gd)_22%,transparent)]"
                        : b.id === "channeling"
                          ? "border-[color-mix(in_srgb,var(--gd)_42%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,var(--gd)_14%,transparent)]"
                          : "hairline"
                    }`}
                  >
                    <Icon
                      className={`size-3 ${
                        b.leading || b.id === "channeling"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <span
                  className={`absolute whitespace-nowrap text-[11.5px] font-medium leading-6 transition-colors duration-500 ${
                    b.leading || b.id === "channeling"
                      ? "text-foreground"
                      : "text-muted-foreground/80"
                  }`}
                  style={{ left: ROOT_LABEL_X, top: b.y - 12 }}
                  data-testid={tid(`root-${b.id}`)}
                >
                  {b.label}
                </span>
              </div>
            );
          })}

          {/* the scopes and their whispers — only the visible rows */}
          {visBranches.map((b) =>
            b.scopes.map((s) => {
              const scopeTop = s.y - 16;
              const scopeBottom =
                s.leaves.length > 0
                  ? s.leaves[s.leaves.length - 1].y + 42
                  : s.y + 20;
              if (scopeBottom < localTop || scopeTop > localBottom) return null;
              return (
                <div key={`${b.id}-${s.key}`}>
                  <span
                    className="absolute rounded-full bg-[var(--gd)]"
                    style={{
                      left: SCOPE_DOT_X - 2.5,
                      top: s.y - 2.5,
                      width: 5,
                      height: 5,
                      opacity: s.connected ? 0.95 : 0.45,
                    }}
                  />
                  <span
                    className={`absolute text-[10.5px] leading-[1.2] ${
                      s.connected ? "text-foreground/85" : "text-muted-foreground/75"
                    }`}
                    style={{
                      left: SCOPE_LABEL_X,
                      top: s.y - 13,
                      width: SCOPE_LABEL_W,
                    }}
                  >
                    {s.label}
                  </span>
                  {s.leaves.map((leaf, i) =>
                    leaf.type === "pause" || leaf.quiet ? (
                      /* the seventh movement — the pause is not another
                         click: it rests open as an invitation to stay
                         with what has just been understood. Before any
                         branch has grown, the channel rests as a quiet
                         note with the same honesty. */
                      <div
                        key={`${b.id}-${s.key}-${i}-pause`}
                        role="note"
                        aria-label={
                          leaf.quiet ? t(leaf.text) : t("Pause & integrate")
                        }
                        style={{ left: LEAF_X, top: leaf.y, width: LEAF_W }}
                        className="absolute rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--gd)_30%,transparent)] bg-[color-mix(in_srgb,var(--gd)_5%,transparent)] px-3 py-1"
                      >
                        {!leaf.quiet && (
                          <span className="mono-label mr-1.5 inline-block rounded-full px-1.5 align-middle text-[8px] uppercase tracking-[0.14em] leading-[1.6] text-[var(--gd)]">
                            {t("Pause & integrate")}
                          </span>
                        )}
                        <span className="line-clamp-2 align-middle text-[11.5px] italic leading-[1.25] text-foreground/80">
                          {t(leaf.text)}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={`${b.id}-${s.key}-${i}`}
                        className="absolute flex items-center"
                        style={{ left: LEAF_X, top: leaf.y }}
                      >
                        <TreeLeafChip
                          leaf={leaf}
                          leading={b.leading}
                          disabled={disabled}
                          onPick={() => {
                            if (clickGuarded()) return;
                            /* the learning memory: what was walked is
                               remembered, so the tree never repeats itself */
                            if (leaf.isBud && leaf.type)
                              recordOpened(leaf.type);
                            recordSeen([leaf.text]);
                            setSeenNonce((n) => n + 1);
                            recordJourney({
                              b: b.id,
                              s: b.id === "channeling" ? undefined : s.label,
                            });
                            onPick(leaf.text);
                          }}
                          testId={tid("chip")}
                        />
                      </div>
                    )
                  )}
                  {s.bloomable && (
                    <button
                      type="button"
                      onClick={() => {
                        const total =
                          ranked
                            .find((rb) => rb.id === b.id)
                            ?.scopes.find((rs) => rs.key === s.key)?.leaves
                            .length ?? 0;
                        bloom(s.key, total, b.id, s.label);
                      }}
                      data-testid={tid("bloom")}
                      aria-label={t("More whispers")}
                      title={t("More whispers")}
                      className="focus-glow absolute flex size-5 items-center justify-center rounded-full text-[var(--gd)]/70 transition-[transform,color] duration-300 hover:rotate-45 hover:text-[var(--gd)]"
                      style={{ left: 442, top: s.y - 10 }}
                    >
                      <Sparkle className="size-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  /* ---------------- the tree ------------------------------------------ */
  return (
    <div
      className={`relative mx-auto w-full max-w-[780px] ${className ?? ""}`}
      data-testid={`${prefix}-tree`}
    >
      {/* the control row — the rest and the canopy */}
      <div className="mb-1 flex items-center justify-end px-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setState("rest")}
            data-testid={`${prefix}-rest`}
            aria-label={t("Rest the tree")}
            title={t("Rest the tree")}
            className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] hover:text-foreground"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setState(state === "canopy" ? "grove" : "canopy")}
            data-testid={`${prefix}-canopy`}
            aria-label={
              state === "canopy" ? t("Lower the canopy") : t("Open the canopy")
            }
            title={
              state === "canopy" ? t("Lower the canopy") : t("Open the canopy")
            }
            className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] hover:text-foreground"
          >
            {state === "canopy" ? (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* the window — two centimetres of a boundless sphere. Stillness
          itself: the camera moves, the window never does. */}
      <div
        ref={viewportRef}
        role="group"
        aria-label={ariaLabel ?? t("The living tree")}
        tabIndex={0}
        onKeyDown={onKeyPan}
        onPointerDown={onPointerDown}
        data-testid={`${prefix}-viewport`}
        /* the branches are deaf to the floating bar — their wheel and
           their drag belong to the tree alone, never to the top reveal */
        data-bar-deaf="true"
        style={{
          height: HEIGHTS[state],
          touchAction: "none",
          overscrollBehavior: "contain",
          contain: "layout paint",
        }}
        className={`no-scrollbar relative cursor-grab overflow-hidden rounded-2xl border hairline bg-[color-mix(in_srgb,var(--glass-bg)_72%,transparent)] backdrop-blur-xl transition-[height] duration-300 active:cursor-grabbing ${
          disabled ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {/* the world — ONE container, moved by the camera. Nothing
            inside it is individually translated or animated. */}
        <div
          ref={worldRef}
          data-testid={`${prefix}-canvas`}
          className="absolute left-0 top-0 will-change-transform"
          style={{ width: CANVAS_W, height: 0 }}
        >
          {tiles.map((k) => (
            <div
              key={k}
              className="absolute left-0"
              style={{
                top: k * period,
                width: CANVAS_W,
                height: layout.height,
              }}
            >
              {renderGrove(k)}
            </div>
          ))}
        </div>

        {/* the window's breath — edge fades and the first hint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[var(--background)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[var(--background)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[var(--background)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[var(--background)] to-transparent"
        />
        {!hintSeen && (
          <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border hairline bg-[var(--glass-bg)] px-2.5 py-0.5 text-[9.5px] text-muted-foreground/80 backdrop-blur-xl">
            {t("Drag the tree in any direction")}
          </div>
        )}
      </div>
    </div>
  );
}
