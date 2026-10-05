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
  Loader2,
  NotebookPen,
  Orbit,
  Sparkle,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import {
  buildSuggestionTree,
  type BranchId,
} from "@/lib/data/suggestion-tree";

/* ------------------------------------------------------------------ */
/*  THE LIVING SUGGESTION TREE                                         */
/*                                                                     */
/*  The suggestions stop being a strip and become a tree: every        */
/*  branch first belongs to a scope of the laboratory — Interplanetary,*/
/*  Healing, Quantum, Evolve Med, Invent, Manifesting — and every      */
/*  branch opens its own scopes, each scope holding a small rotation   */
/*  of whispers ranked against the conversation's last topic.          */
/*                                                                     */
/*  The whole tree could never fit, so it lives on a wide canvas       */
/*  behind a small window — about two centimetres tall — that can be   */
/*  dragged in ALL directions, up, down, left and right, to reveal     */
/*  the branches connected to what is being spoken. The branch nearest */
/*  the conversation's last topic glows and the window drifts to it.   */
/*  A ✦ on every scope blooms more whispers; a golden bud can be       */
/*  grown straight from the conversation itself. And the whole line    */
/*  can be dropped down (or rested away) whenever the visitor wishes.  */
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
/** Whispers shown per scope before the ✦ blooms more. */
const SHOWN = 2;

const BRANCH_ICONS: Record<BranchId, typeof Atom> = {
  interplanetary: Orbit,
  healing: HeartPulse,
  quantum: Atom,
  evolvemed: Dna,
  invent: NotebookPen,
  manifesting: Sparkles,
};

const STORE_KEY = "mirror-suggestion-tree";
const HINT_KEY = "mirror-suggestion-tree-hint";

/* ------------------------------ layout ------------------------------ */

interface LeafPos {
  text: string;
  score: number;
  y: number;
  isBud: boolean;
}

interface ScopePos {
  key: string;
  label: string;
  y: number;
  leaves: LeafPos[];
  bloomable: boolean;
  connected: boolean;
}

interface BranchPos {
  id: BranchId;
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
      title={label}
      style={{ width: LEAF_W }}
      className={`focus-glow line-clamp-2 rounded-full border px-3 py-1 text-left text-[11.5px] leading-[1.25] transition-all duration-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
        leaf.isBud
          ? "border-[color-mix(in_srgb,var(--gd)_55%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,var(--glass-bg))] text-foreground/90"
          : connected
            ? "border-[color-mix(in_srgb,var(--gd)_38%,transparent)] bg-[var(--glass-bg)] text-foreground/85 backdrop-blur-xl"
            : "hairline bg-[var(--glass-bg)] text-muted-foreground backdrop-blur-xl"
      } ${leading && connected ? "shadow-[0_0_12px_color-mix(in_srgb,var(--gd)_16%,transparent)]" : ""}`}
    >
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
}: {
  /** The branch the window rests on when nothing is being spoken yet. */
  focusBranch?: BranchId;
  contextText: string;
  onPick: (suggestion: string) => void;
  disabled?: boolean;
  testIdPrefix?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const t = useT();
  const reduceMotion = useReducedMotion();

  /* ---------------- the living tree, ranked by the conversation ---- */
  const ranked = useMemo(() => buildSuggestionTree(contextText), [contextText]);

  /* buds grown from the conversation itself, per branch */
  const [buds, setBuds] = useState<Map<BranchId, string[]>>(new Map());
  const [budState, setBudState] = useState<"idle" | "loading" | "error">(
    "idle"
  );

  /* bloom offsets — which two whispers each scope shows */
  const [offsets, setOffsets] = useState<Map<string, number>>(new Map());

  /* the leading branch — the one most connected to the last topic */
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

  /* ---------------- geometry ---------------------------------------- */
  const layout: TreeLayout = useMemo(() => {
    const branches: BranchPos[] = [];
    let y = 10;
    for (const branch of ranked) {
      const top = y;
      const scopes: ScopePos[] = [];
      const branchBuds = buds.get(branch.id);
      const scopeDefs = branchBuds
        ? [
            {
              key: "bud",
              label: t("From this conversation"),
              leaves: branchBuds.map((text) => ({
                text,
                score: 1,
                isBud: true,
              })),
              bloomable: false,
            },
            ...branch.scopes.map((s) => ({
              key: s.key,
              label: t(s.label),
              leaves: s.leaves,
              bloomable: true,
            })),
          ]
        : branch.scopes.map((s) => ({
            key: s.key,
            label: t(s.label),
            leaves: s.leaves,
            bloomable: true,
          }));
      for (const scope of scopeDefs) {
        const offset = offsets.get(scope.key) ?? 0;
        const count = scope.bloomable ? SHOWN : scope.leaves.length;
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
              isBud: scope.key === "bud",
            });
        }
        scopes.push({
          key: scope.key,
          label: scope.label,
          y: y + LABEL_H / 2,
          leaves: shown,
          bloomable: scope.bloomable,
          connected: shown.some((l) => l.score > 0),
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
  }, [ranked, buds, offsets, leadingId, t]);

  /* ---------------- the window -------------------------------------- */
  const [state, setState] = useState<TreeState>("grove");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [hintSeen, setHintSeen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORE_KEY) as TreeState | null;
    if (saved === "rest" || saved === "grove" || saved === "canopy")
      setState(saved);
    if (window.localStorage.getItem(HINT_KEY)) setHintSeen(true);
  }, []);

  useEffect(() => {
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
  /* set when a bud is grown — the next drift goes to the bud itself */
  const budDriftRef = useRef<BranchId | null>(null);

  /* the window drifts to the leading branch — unless the visitor is
     walking the tree themselves at this moment */
  const centerOn = useCallback(
    (id: BranchId) => {
      if (vp.w === 0) return;
      const branch = layout.branches.find((b) => b.id === id);
      const tx = Math.max(
        minX,
        Math.min(0, -(LEAF_X - vp.w * 0.12))
      );
      /* after a bud is grown the window drifts to the bud itself —
         the golden scope waiting at the top of its branch */
      const goingToBud = budDriftRef.current === id;
      const targetY = branch
        ? goingToBud
          ? branch.top + 78
          : (branch.top + branch.bottom) / 2
        : 0;
      const ty = Math.max(minY, Math.min(0, vp.h / 2 - targetY));
      if (goingToBud) budDriftRef.current = null;
      if (reduceMotion) {
        x.set(tx);
        yv.set(ty);
      } else {
        animate(x, tx, { duration: 0.75, ease: "easeOut" });
        animate(yv, ty, { duration: 0.75, ease: "easeOut" });
      }
    },
    [layout.branches, minX, minY, vp.w, vp.h, reduceMotion, x, yv]
  );

  useEffect(() => {
    if (Date.now() - lastPanRef.current < 9000) return;
    centerOn(leadingId);
    /* re-center on branch change, resize and window-size change */
  }, [leadingId, vp.w, vp.h, state, centerOn]);
  const bloom = (scopeKey: string, total: number) => {
    if (total <= SHOWN) return;
    setOffsets((prev) => {
      const next = new Map(prev);
      next.set(scopeKey, ((prev.get(scopeKey) ?? 0) + SHOWN) % total);
      return next;
    });
  };

  /* ---------------- the bud ------------------------------------------ */
  const growBud = useCallback(async () => {
    if (budState === "loading") return;
    setBudState("loading");
    try {
      const res = await fetch("/api/suggestions/bud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: leadingId,
          context: contextText.slice(-2400),
        }),
      });
      const data = await res.json().catch(() => null);
      const grown: string[] = Array.isArray(data?.buds)
        ? data.buds
            .filter((b: unknown): b is string => typeof b === "string" && b.trim().length > 0)
            .slice(0, 3)
        : [];
      if (grown.length === 0) throw new Error("empty");
      setBuds((prev) => {
        const next = new Map(prev);
        next.set(leadingId, grown);
        return next;
      });
      /* the window's next drift goes straight to the new bud */
      budDriftRef.current = leadingId;
      lastPanRef.current = 0;
      setBudState("idle");
    } catch {
      setBudState("error");
      toast({ description: t("The bud could not open just now") });
      window.setTimeout(() => setBudState("idle"), 2500);
    }
  }, [budState, leadingId, contextText, t]);

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
    x.set(nx);
    yv.set(ny);
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

  /* ---------------- the tree ------------------------------------------ */
  return (
    <div
      className={`relative mx-auto w-full max-w-[780px] ${className ?? ""}`}
      data-testid={`${prefix}-tree`}
    >
      {/* the control row — the bud, the rest, the canopy */}
      <div className="mb-1 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => void growBud()}
          disabled={disabled || budState === "loading"}
          data-testid={`${prefix}-bud`}
          aria-label={t("Grow a bud")}
          title={t("Grow a bud")}
          className="focus-glow flex h-6 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--gd)_32%,transparent)] bg-[var(--glass-bg)] px-2.5 text-[10.5px] text-muted-foreground backdrop-blur-xl transition-all duration-300 hover:text-foreground disabled:opacity-60"
        >
          {budState === "loading" ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkle
              className={`size-3 ${budState === "error" ? "text-muted-foreground/50" : "text-[var(--gd)]"}`}
              aria-hidden="true"
            />
          )}
          <span className="whitespace-nowrap">
            {budState === "loading" ? t("Growing a bud…") : t("Grow a bud")}
          </span>
        </button>
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
          dragElastic={0.07}
          onDragStart={() => {
            draggingRef.current = true;
            lastPanRef.current = Date.now();
            setHintSeen(true);
            window.localStorage.setItem(HINT_KEY, "seen");
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
            {layout.branches.map((b) => (
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
                        : "hairline"
                    }`}
                  >
                    <Icon
                      className={`size-3 ${b.leading ? "text-foreground" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <span
                  className={`absolute whitespace-nowrap text-[11.5px] font-medium leading-6 transition-colors duration-500 ${
                    b.leading ? "text-foreground" : "text-muted-foreground/80"
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
                {s.leaves.map((leaf, i) => (
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
                        onPick(leaf.text);
                      }}
                      testId={`${prefix}-chip`}
                    />
                  </div>
                ))}
                {s.bloomable && (
                  <button
                    type="button"
                    onClick={() => {
                      const total =
                        ranked
                          .find((rb) => rb.id === b.id)
                          ?.scopes.find((rs) => rs.key === s.key)?.leaves
                          .length ?? 0;
                      bloom(s.key, total);
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
