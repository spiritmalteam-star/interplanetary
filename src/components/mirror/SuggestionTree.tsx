"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
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
/*  THE LIVING SUGGESTION TREE                                         */
/*                                                                     */
/*  The suggestions stop being a strip and become a tree: every        */
/*  branch first belongs to a scope of the laboratory — Interplanetary,*/
/*  Healing, Quantum, Evolve Med, Invent, Manifesting — and every      */
/*  branch opens its own scopes, each scope holding a deep rotation    */
/*  of whispers ranked against the conversation's last topic.          */
/*                                                                     */
/*  The whole tree could never fit, so it lives on a wide canvas       */
/*  behind a small window — about two centimetres tall — that can be   */
/*  dragged in ALL directions, up, down, left and right, to reveal     */
/*  the whispers nearest the last topic. The movement is near-         */
/*  instant in every direction, and every first move renders NEW       */
/*  branches — never a repeat of what was already heard.               */
/*                                                                     */
/*  At the top hangs the CHANNELING branch — the conversation's own    */
/*  branch, grown from the exchanges themselves — tied to the leading  */
/*  general branch by an elastic golden line that stretches and        */
/*  draws itself as the connection deepens.                            */
/*                                                                     */
/*  While a transmission loads, the whole line drops down to rest;     */
/*  it lifts again only when the visitor wishes to jump to another     */
/*  branch. And the walk itself is kept — quietly, one step at a       */
/*  time — so the visitor's profile can draw its DNA evolutionary      */
/*  helix: the tree stays a tree, the walk lives in the profile.       */
/* ------------------------------------------------------------------ */

type TreeState = "rest" | "grove" | "canopy";

/** The window's three sizes: rested away, the 2 cm grove, the open canopy. */
const HEIGHTS: Record<TreeState, number> = {
  rest: 36,
  grove: 76, /* ≈ 2 cm */
  canopy: 264,
};

/** The canvas the tree is drawn on — far larger than the window. */
const CANVAS_W = 780;
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
/** Whispers shown per scope before a bloom (or a pan) reveals more. */
const SHOWN = 2;
/** Pan distance that renders the next breath of new branches. */
const REVEAL_STEP = 150;

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
  testId: string;
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
      className={`focus-glow relative line-clamp-2 rounded-full border px-3 py-1 text-left text-[11.5px] leading-[1.25] transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
        leaf.isBud
          ? "border-[color-mix(in_srgb,var(--gd)_55%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,var(--glass-bg))] text-foreground/90"
          : connected
            ? "border-[color-mix(in_srgb,var(--gd)_38%,transparent)] bg-[var(--glass-bg)] text-foreground/85 backdrop-blur-xl"
            : "hairline bg-[var(--glass-bg)] text-muted-foreground backdrop-blur-xl"
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

/* ------------------------------ the tree ---------------------------- */

export function SuggestionTree({
  focusBranch,
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
    () => buildSuggestionTree(contextText, loadSeen()),
    [contextText, seenNonce]
  );

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

  /* bloom offsets — which whispers each scope shows */
  const [offsets, setOffsets] = useState<Map<string, number>>(new Map());

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

  /* ---------------- the window -------------------------------------- */
  const [state, setState] = useState<TreeState>("grove");
  const stateRef = useRef<TreeState>("grove");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [hintSeen, setHintSeen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORE_KEY) as TreeState | null;
    const hasHint = !!window.localStorage.getItem(HINT_KEY);
    /* deferred — the saved resting size returns after the first paint */
    const id = window.setTimeout(() => {
      if (saved === "rest" || saved === "grove" || saved === "canopy")
        setState(saved);
      if (hasHint) setHintSeen(true);
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
    const measure = () =>
      setVp({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  const x = useMotionValue(0);
  const yv = useMotionValue(0);

  const minX = Math.min(0, vp.w - CANVAS_W);
  const minY = Math.min(0, vp.h - layout.height);

  /* dragging bookkeeping — the last pan, and tap-vs-drag on the chips */
  const lastPanRef = useRef(0);
  const draggingRef = useRef(false);
  /* the walk's last reveal point — panning renders new branches */
  const lastRevealRef = useRef({ x: 0, y: 0 });

  /* the window drifts to the leading branch — unless the visitor is
     walking the tree themselves at this moment */
  const centerOn = useCallback(
    (id: TreeNodeId) => {
      if (vp.w === 0) return;
      const branch = layout.branches.find((b) => b.id === id);
      const tx = Math.max(
        minX,
        Math.min(0, -(LEAF_X - vp.w * 0.12))
      );
      const targetY = branch ? (branch.top + branch.bottom) / 2 : 0;
      const ty = Math.max(minY, Math.min(0, vp.h / 2 - targetY));
      if (reduceMotion) {
        x.set(tx);
        yv.set(ty);
      } else {
        /* the drift is a breath, not a snap — the house ease carries
           the window the whole way so the movement reads as one glide */
        animate(x, tx, { duration: 1.05, ease: [0.22, 1, 0.36, 1] });
        animate(yv, ty, { duration: 1.05, ease: [0.22, 1, 0.36, 1] });
      }
    },
    [layout.branches, minX, minY, vp.w, vp.h, reduceMotion, x, yv]
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

  /* ---------------- render new branches on the move ------------------
     Each significant stretch of panning advances the visible scopes'
     rotations — fresh whispers render as the visitor moves, and what
     was shown is remembered so nothing ever repeats. */
  const revealOnMove = useCallback(() => {
    if (state === "rest" || vp.h === 0) return;
    const cx = x.get();
    const cy = yv.get();
    const last = lastRevealRef.current;
    if (Math.hypot(cx - last.x, cy - last.y) < REVEAL_STEP) return;
    lastRevealRef.current = { x: cx, y: cy };
    const top = -cy - 40;
    const bottom = -cy + vp.h + 40;
    const touched: { scopeKey: string; total: number; branch: TreeNodeId; label: string }[] = [];
    for (const b of layout.branches) {
      if (b.id === "channeling") continue;
      for (const s of b.scopes) {
        if (!s.bloomable) continue;
        if (s.y < top || s.y > bottom) continue;
        const total =
          ranked
            .find((rb) => rb.id === b.id)
            ?.scopes.find((rs) => rs.key === s.key)?.leaves.length ?? 0;
        if (total <= SHOWN) continue;
        touched.push({ scopeKey: s.key, total, branch: b.id, label: s.label });
      }
    }
    if (touched.length === 0) return;
    /* the next offsets are computed from the offsets we already hold —
       the whispers about to stand at the tips are remembered at once,
       so what was shown is never offered again */
    const nextOffsets = new Map(offsets);
    const freshTexts: string[] = [];
    for (const tScope of touched) {
      const nextOffset =
        ((nextOffsets.get(tScope.scopeKey) ?? 0) + SHOWN) % tScope.total;
      nextOffsets.set(tScope.scopeKey, nextOffset);
      const leaves =
        ranked
          .find((rb) => rb.id === tScope.branch)
          ?.scopes.find((rs) => rs.key === tScope.scopeKey)?.leaves ?? [];
      for (let i = 0; i < SHOWN; i++) {
        const leaf = leaves[(nextOffset + i) % leaves.length];
        if (leaf) freshTexts.push(leaf.text);
      }
    }
    setOffsets(nextOffsets);
    recordSeen(freshTexts);
    /* the memory is NOT re-read here — the whispers that just appeared
       stay on their tips; the filtering applies from the next exchange */
    recordJourney({ b: touched[0].branch, s: touched[0].label });
  }, [state, vp.h, layout.branches, ranked, offsets, x, yv]);

  const bloom = (scopeKey: string, total: number, branch: TreeNodeId, label: string) => {
    if (total <= SHOWN) return;
    const nextOffset = ((offsets.get(scopeKey) ?? 0) + SHOWN) % total;
    const nextOffsets = new Map(offsets);
    nextOffsets.set(scopeKey, nextOffset);
    setOffsets(nextOffsets);
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

  /* ---------------- wheel panning ------------------------------------
     the canvas answers the wheel too — NEARLY INSTANT in every
     direction: the window follows the hand at once, and at an edge
     the page keeps its own scroll */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (vp.w === 0) return;
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dx = -(e.shiftKey ? e.deltaY : e.deltaX) * k;
      const dy = e.shiftKey ? 0 : -e.deltaY * k;
      const cx = x.get();
      const cy = yv.get();
      const canPanX =
        dx !== 0 && ((dx < 0 && cx > minX) || (dx > 0 && cx < 0));
      const canPanY =
        dy !== 0 && ((dy < 0 && cy > minY) || (dy > 0 && cy < 0));
      if (!canPanX && !canPanY) return; /* the page keeps its scroll */
      e.preventDefault();
      lastPanRef.current = Date.now();
      setHintSeen(true);
      window.localStorage.setItem(HINT_KEY, "seen");
      x.set(Math.max(minX, Math.min(0, cx + dx)));
      yv.set(Math.max(minY, Math.min(0, cy + dy)));
      revealOnMove();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [vp.w, minX, minY, x, yv, revealOnMove]);

  /* ---------------- the hub link -------------------------------------
     the branches grown at a reply's foot are linked with the tree: the
     drift event opens the resting line and glides to their branch */
  useEffect(() => {
    const onDrift = (e: Event) => {
      const detail = (e as CustomEvent<{ branch?: string }>).detail;
      const id = detail?.branch;
      if (!id) return;
      if (state === "rest") setState("grove");
      lastPanRef.current = 0;
      /* one breath for the window to take its size again */
      window.setTimeout(() => centerOn(id as TreeNodeId), 80);
    };
    window.addEventListener(TREE_DRIFT_EVENT, onDrift);
    return () => window.removeEventListener(TREE_DRIFT_EVENT, onDrift);
  }, [state, centerOn]);

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
    setHintSeen(true);
    const nx = Math.max(minX, Math.min(0, x.get() + dx));
    const ny = Math.max(minY, Math.min(0, yv.get() + dy));
    if (reduceMotion) {
      x.set(nx);
      yv.set(ny);
    } else {
      /* the keys answer almost instantly — never a jump, never a wait */
      animate(x, nx, { duration: 0.14, ease: "easeOut" });
      animate(yv, ny, { duration: 0.14, ease: "easeOut" });
    }
    revealOnMove();
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
          className="focus-glow flex h-9 w-full items-center gap-2 rounded-full border hairline bg-[var(--glass-bg)] px-3.5 text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:text-foreground"
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
            className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] hover:text-foreground"
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
            className="focus-glow flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] hover:text-foreground"
          >
            {state === "canopy" ? (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* the window — two centimetres of a far larger tree */}
      <div
        ref={viewportRef}
        role="group"
        aria-label={ariaLabel ?? t("The living tree")}
        tabIndex={0}
        onKeyDown={onKeyPan}
        data-testid={`${prefix}-viewport`}
        style={{ height: HEIGHTS[state] }}
        className={`no-scrollbar relative overflow-hidden rounded-2xl border hairline bg-[color-mix(in_srgb,var(--glass-bg)_72%,transparent)] backdrop-blur-xl transition-[height] duration-300 ${
          disabled ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <motion.div
          drag
          dragConstraints={{ left: minX, right: 0, top: minY, bottom: 0 }}
          dragMomentum
          /* the glide after the hand lifts — short and light now, so a
             change of direction answers at once, almost without delay */
          dragTransition={{
            power: 0.18,
            timeConstant: 120,
            bounceStiffness: 220,
            bounceDamping: 26,
          }}
          dragElastic={0.07}
          onDragStart={() => {
            draggingRef.current = true;
            lastPanRef.current = Date.now();
            setHintSeen(true);
            window.localStorage.setItem(HINT_KEY, "seen");
          }}
          onDrag={() => {
            lastPanRef.current = Date.now();
            revealOnMove();
          }}
          onDragEnd={() => {
            lastPanRef.current = Date.now();
            window.setTimeout(() => {
              draggingRef.current = false;
            }, 150);
          }}
          style={{
            x,
            y: yv,
            width: CANVAS_W,
            height: layout.height,
            touchAction: "none",
          }}
          className="absolute left-0 top-0 will-change-transform"
          data-testid={`${prefix}-canvas`}
        >
          {/* the connectors */}
          <svg
            className="absolute inset-0"
            width={CANVAS_W}
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
            {elastic && (
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
            {layout.branches
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
                  {b.scopes.map((s) => (
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
                  ))}
                </g>
              ))}
          </svg>

          {/* the branch roots */}
          {layout.branches.map((b) => {
            const Icon = BRANCH_ICONS[b.id];
            return (
              <div key={b.id} className="absolute" style={{ left: 0, top: 0 }}>
                <div
                  className="absolute flex items-center"
                  style={{ left: ROOT_X - 12, top: b.y - 12 }}
                >
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border bg-[var(--glass-bg)] backdrop-blur-xl transition-all duration-500 ${
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
                  data-testid={`${prefix}-root-${b.id}`}
                >
                  {b.label}
                </span>
              </div>
            );
          })}

          {/* the scopes and their whispers */}
          {layout.branches.map((b) =>
            b.scopes.map((s) => (
              <div key={`${b.id}-${s.key}`}>
                <span
                  className="absolute rounded-full bg-[var(--gd)] transition-all duration-500"
                  style={{
                    left: SCOPE_DOT_X - 2.5,
                    top: s.y - 2.5,
                    width: 5,
                    height: 5,
                    opacity: s.connected ? 0.95 : 0.45,
                  }}
                />
                <span
                  className={`absolute text-[10.5px] leading-[1.2] transition-colors duration-500 ${
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
                          if (draggingRef.current) return;
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
                        testId={`${prefix}-chip`}
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
                    data-testid={`${prefix}-bloom`}
                    aria-label={t("More whispers")}
                    title={t("More whispers")}
                    className="focus-glow absolute flex size-5 items-center justify-center rounded-full text-[var(--gd)]/70 transition-all duration-300 hover:rotate-45 hover:text-[var(--gd)]"
                    style={{ left: 442, top: s.y - 10 }}
                  >
                    <Sparkle className="size-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))
          )}
        </motion.div>

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
