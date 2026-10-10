"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeftRight,
  ChevronRight,
  ChevronUp,
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  Moon,
  RefreshCw,
  Sparkles,
  Sprout,
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
} from "@/lib/genealogy";
import { recordExpansion } from "@/lib/expansion";
import { ExpansionRing } from "./ExpansionMirror";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE LIVING TREE — THE GENEALOGY METHOD.                            */
/*                                                                     */
/*  A different method, as asked: the branches stand as a FAMILY TREE, */
/*  very well arranged, expanding in all directions. The trunk rises   */
/*  from the very top of the input bar; the first forks spread left    */
/*  and right; every fork forks again — a tidy genealogy whose         */
/*  generations climb upward and outward the further the walk goes.    */
/*                                                                     */
/*  THE NO-OVERLAP LAW. Every whisper carries a fixed box, its text    */
/*  clamped inside; the connectors live only in the gap between the    */
/*  generations and every chip stands OPAQUE — a line can never touch  */
/*  a single word of a suggestion.                                     */
/*                                                                     */
/*  THE GRAFT LAW. Press a whisper and the tree GROWS FROM THERE: a    */
/*  whole sub-family blooms directly above the pressed chip, its       */
/*  voices tuned to the channeling context; everything that stood      */
/*  above folds away. The pressed chip keeps its mark and the header   */
/*  holds the trail of the walk — the visitor is never lost.           */
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
/*  compositor's own motion), CSS keyframes carry every bloom — one    */
/*  run, then stillness. Not one requestAnimationFrame lives here;    */
/*  the phone stays cool.                                              */
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

/* ------------- the answer's space (the fold on reveal) -------------- */

/**
 * THE ANSWER'S SPACE — while a transmission is channeled the walk may
 * keep growing from its last choice; when the answer is revealed the
 * tree holds one graceful breath (the visitor watches the new branches
 * bloom from their own choice) and then folds to make space for the
 * answer. One touch of the summon (or the rest strip) brings the whole
 * family back, graft and trail intact.
 */
export function useCanopyAnswerFold(
  loading: boolean,
  fold: (v: boolean) => void
) {
  const wasLoading = useRef(false);
  useEffect(() => {
    const was = wasLoading.current;
    wasLoading.current = loading;
    if (was && !loading) {
      const id = window.setTimeout(() => fold(false), 3200);
      return () => window.clearTimeout(id);
    }
  }, [loading, fold]);
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
}) {
  const t = useT();

  /* THE FADE LAW — mount → visible on open; fade → unmount on close.
     Pure CSS transitions; render-time guarded resets only. */
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [seenOpen, setSeenOpen] = useState(open);

  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setMounted(true);
      setShown(false);
    } else {
      setShown(false);
    }
  }

  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(() => setMounted(false), 700);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setShown(true), 30);
    return () => window.clearTimeout(id);
  }, [open]);

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
    const combined =
      hits.length === 0
        ? grove.map((w) => ({ ...w, score: 0 }))
        : [...hits, ...grove.filter((w) => !hits.some((h) => h.text === w.text)).map((w) => ({ ...w, score: 0 }))];
    /* the dedupe law — one whisper never stands twice in the family */
    const seenTexts = new Set<string>();
    const unique: typeof combined = [];
    for (const w of combined) {
      const k = w.text.toLowerCase();
      if (!seenTexts.has(k)) {
        seenTexts.add(k);
        unique.push(w);
      }
    }
    return unique;
  }, [grove, field, idf, seenSnapshot]);

  /* THE GOLDEN ROW — the exchange's own grown branches stand nearest
     the trunk; deduped by content, the compiler keeps this stable. */
  const goldenSeeds: GenealogySeed[] = [];
  {
    const gSeen = new Set<string>();
    for (const b of channeling ?? []) {
      const k = b.question.toLowerCase();
      if (gSeen.has(k)) continue;
      gSeen.add(k);
      goldenSeeds.push({ text: b.question, movement: b.type, score: 3 });
      if (goldenSeeds.length >= 6) break;
    }
  }

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
     without cause. The tree keeps standing across open and close. */
  const lastRankedRef = useRef<unknown>(null);
  useEffect(() => {
    if (!mounted || ranked.length === 0) return;
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
  }, [ranked, mounted, markSpent]);

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
     to the floor; a fresh graft pans once so the new house is in view.
     One layout pass per change — never per frame. */
  useLayoutEffect(() => {
    const vp = vpRef.current;
    if (!vp || !mounted) return;
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
  }, [tree.geometry.width, tree.geometry.height, mounted, tree]);

  /* ---------------- THE GRAFT — the walk grows from a choice -------- */

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

  /* the pan effect is folded into the anchored view's layout pass */

  /* THE QUIET PICK — the walk grows FROM the pressed whisper: the
     pressed chip is marked, a whole sub-family is grafted directly
     above it, tuned to the channeling context, and everything that
     stood above folds away. The trail remembers every step. */
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
        const hits = rankWhispers(fresh, pickField, {
          idf,
          seen: seenSnapshot,
          limit: BATCH_SIZE,
          perSubject: 2,
        });
        const chosen =
          hits.length > 0
            ? hits
            : fresh
                .map((w) => ({ ...w, score: 0 }))
                .slice(0, BATCH_SIZE);
        const seeds: GenealogySeed[] = chosen
          .slice(0, BATCH_SIZE)
          .map((w) => ({ text: w.text, movement: w.movement, score: w.score }));
        if (seeds.length > 0) {
          const graft = buildGraftTopology(seeds, node.id, narrowRef.current);
          markSpent(seeds);
          commitTopologies((t) =>
            t.length >= MAX_BATCHES ? t : [...t, graft]
          );
          panReqRef.current = node.id; /* one quiet pan — the new house in view */
        }
      }
      onPick(node.text);
    },
    [
      category,
      disabled,
      onPick,
      scopeHint,
      tree,
      grove,
      idf,
      seenSnapshot,
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

  if (!mounted) return null;

  /* ---------------- the rendered family -----------------------------
     Only the revealed nodes ever enter the DOM — the later waves are
     simply not there yet; each bloom is one CSS keyframe, run once. */
  const batchCount = topologies.length;
  const geo = tree.geometry;

  const nodeVisible = (n: GenealogyNode): boolean => {
    if (n.golden) return true;
    const b = Number(n.id.slice(1, n.id.indexOf(".")));
    if (b < batchCount - 1) return true;
    return n.wave < latestReveal;
  };

  const nodes: GenealogyNode[] = [];
  for (const n of tree.nodes) {
    if (nodeVisible(n)) nodes.push(n);
  }

  /* the connectors — one path per revealed child, drawn from its
     parent's foot to its own crown, kept OUT of the chips themselves
     (two pixels of air at each end — a line never touches a word) */
  const paths: {
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
    const y1 = p.y + geo.chipH + 2;
    const x2 = n.x;
    const y2 = n.y - 2;
    const mid1 = y1 + (y2 - y1) * 0.45;
    const mid2 = y2 - (y2 - y1) * 0.45;
    paths.push({
      key: `p-${n.id}`,
      d: `M ${x1} ${y1} C ${x1} ${mid1}, ${x2} ${mid2}, ${x2} ${y2}`,
      golden: !!n.golden,
      chain: chainSet.has(n.id),
      delay: Math.min(n.wave * 130 + (ni % 12) * 26, 640),
    });
  });
  /* the trunk's own arms — from the trunk's crown to the first row and
     the golden row (the root's children) */
  const trunkTop = geo.height - geo.trunkH;
  const trunkArms: { d: string; key: string; chain: boolean }[] = [];
  for (const n of nodes) {
    if (n.parent) continue;
    trunkArms.push({
      key: `ta-${n.id}`,
      d: `M ${geo.width / 2} ${trunkTop + 8} C ${geo.width / 2} ${trunkTop + 26}, ${n.x} ${n.y - 34}, ${n.x} ${n.y}`,
      chain: chainSet.has(n.id),
    });
  }

  const preparedCount = prepared
    ? prepared.rows.reduce((a, r) => a + r.seeds.length, 0)
    : 0;

  return (
    <div
      data-testid={testIdPrefix}
      aria-hidden={!shown}
      className={cn(
        "absolute inset-0 z-20 flex min-h-0 flex-col bg-[color-mix(in_srgb,var(--background)_94%,transparent)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
      <div className="shrink-0 border-b hairline bg-[color-mix(in_srgb,var(--background)_70%,transparent)] px-3 pb-2 pt-[52px] backdrop-blur-xl sm:px-5 sm:pt-[60px]">
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
      <div
        ref={vpRef}
        role="region"
        aria-label={t("The living tree")}
        className="nice-scroll relative min-h-0 flex-1 overflow-auto"
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

        {/* THE CANVAS — the whole family, walked in every direction */}
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

          {/* the whispers — the family's own chips: opaque by law, so a
              line can never cross a word */}
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
                onClick={() => pick(n)}
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
                  "genea-bloom focus-glow absolute z-10 flex flex-col items-start gap-0.5 overflow-hidden rounded-2xl border px-3 py-2 text-left shadow-[0_3px_14px_-8px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
                  narrow
                    ? "text-[11px] leading-[1.3]"
                    : "text-[12.5px] leading-[1.35]",
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
                    height: geo.chipH,
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
                <span
                  className={cn(
                    "w-full",
                    narrow ? "line-clamp-3" : "line-clamp-2"
                  )}
                >
                  {n.text}
                </span>
              </button>
            );
          })}
        </div>

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
    </div>
  );
}
