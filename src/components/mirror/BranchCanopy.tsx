"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeftRight,
  ChevronUp,
  Flame,
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  Moon,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import {
  canopyHour,
  growCanopy,
  type CanopyWhisper,
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
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE BRANCH CANOPY — the living tree of every chat, reborn.         */
/*                                                                     */
/*  THE OLD SHAPE, BIGGER. The tree the visitor remembers — the one    */
/*  that slid in all directions — stands here again, grown greater:    */
/*  a trunk rising from the very top of the input bar, limbs curving   */
/*  outward to the left and the right, whispers hanging at every       */
/*  tip, and distant echo fields wandering on both horizons.           */
/*                                                                     */
/*  THE CAMERA LAW. The canopy is not a page and not a scroll. It is   */
/*  a window looking into a large world: the pointer (finger or        */
/*  mouse) moves the CAMERA in every direction — up, down, left,       */
/*  right — with a gentle coast after release. Coordinates live in     */
/*  refs, the transform is written once per frame under a single       */
/*  rAF lock, and only while a walk is alive. Between walks the        */
/*  engine is completely silent — no interval, no loop, no work.       */
/*                                                                     */
/*  THE SPHERE. There are no walls. The grove is periodic — the walk   */
/*  past either end re-anchors by exactly one world-height, so the     */
/*  tree continues forever in every direction.                         */
/*                                                                     */
/*  THE RESONANCE EAR (the hyper-advanced algorithm). Every summon     */
/*  the grove is heard once through the resonance engine: the scope    */
/*  the visitor is exploring weighs triple, the branches grown of     */
/*  the exchange weigh double, the context that follows — the last     */
/*  transmissions — carries the middle, and the whole ranking is       */
/*  tuned by rarity, harmony and one deterministic shimmer of the      */
/*  hour. The resonant whispers rise to the first limbs; the rest      */
/*  of the grove waits beyond.                                         */
/*                                                                     */
/*  THE 500 LAW: every category grows 560 unique whispers, keyed to    */
/*  the UTC hour — the grove renews itself every hour with no          */
/*  timers, no polling, no refetch storms.                             */
/*                                                                     */
/*  THE FADE LAW: the tree stands in the empty room; when the          */
/*  answer is revealed it fades out and makes space. The slim rest     */
/*  strip (CanopyRestStrip) then holds the trunk's place at the top    */
/*  of the input bar — one touch, and the tree stands again.          */
/*                                                                     */
/*  THE STILLNESS LAW: no intervals, no polling, no physics loops.     */
/*  The grove renders once and goes silent; the only perpetual         */
/*  motion is one breathing trunk line. Offscreen limbs are never      */
/*  laid out; the canopy unmounts entirely when it fades. The phone    */
/*  stays cool.                                                        */
/* ------------------------------------------------------------------ */

/* --------------------------- the world ------------------------------ */

/** The world's width: an echo field, the tree, an echo field. */
const CANVAS_W = 1900;
/** The trunk's world x — the exact middle. */
const TRUNK_X = 950;
/** Whispers per limb cluster. */
const PER_CLUSTER = 3;
/** Vertical distance between cluster anchors. */
const CLUSTER_STEP = 208;
/** Extra gap at each seam (a fresh hour of grove begins). */
const SEAM_EVERY = 16;
const SEAM_GAP = 72;
/** World paddings. */
const PAD_TOP = 120;
const PAD_BOTTOM = 200;
/** The culling buffer — how far beyond the window the world is drawn. */
const BAND_BUFFER = 560;
/** A structural refresh every few hundred pixels, never per pixel. */
const BAND_BUCKET = 240;
/** A tap under this many px of travel is a touch, not a drag. */
const GESTURE_SLOP = 9;
/** Inertia: the gentle coast after release — brief by design. */
const COAST_TAU = 120; /* ms — exponential decay constant */
const COAST_MAX_MS = 340;
const COAST_MIN_V = 0.05; /* px/ms */
const COAST_MAX_V = 3.2; /* px/ms — a flick is heard, not obeyed forever */
/** How long after a drag a click is suspected of being one. */
const CLICK_GUARD_MS = 320;
/** The echo rows — distant whispers on both horizons. */
const ECHO_ROW = 122;
const ECHO_W = 230;

const MOVEMENT_ICONS: Record<BranchType, typeof Layers> = {
  deepen: Layers,
  connect: Link2,
  contrast: ArrowLeftRight,
  apply: Hand,
  create: Sparkles,
  reflect: Moon,
  pause: Hourglass,
};

/** One deterministic degree of organic variation, ±8px, per cluster. */
function organic(i: number): number {
  let h = Math.imul(i + 1, 2654435761) >>> 0;
  h ^= h >>> 13;
  return (h % 17) - 8;
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
 * whenever the full tree is folded — the old tree's resting floor.
 * One touch summons the whole grove again.
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
        {/* the trunk's base — a tiny living line rising from the bar */}
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
  /** The thread's last breaths — received transmissions focus the walk. */
  contextText?: string;
  /** The branches grown on the conversation's own replies — the crown. */
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

  /* THE HOURLY GROVE — captured at summon; a rolled hour regrows it. */
  const [hour, setHour] = useState(() => canopyHour());
  const [salt, setSalt] = useState(0);

  /* THE HYDRATION LAW — the learning memory joins after first paint. */
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    const id = window.setTimeout(() => setAwake(true), 0);
    return () => window.clearTimeout(id);
  }, [mounted]);

  const grove = useMemo(
    () => growCanopy(category, scopeHint ?? null, hour, salt),
    [category, scopeHint, hour, salt]
  );

  /* THE RESONANCE EAR — one listen per summon, then silence.
     The scope leads threefold, the grown branches twofold, the
     context that follows carries the middle; rarity, harmony, the
     conversation's phase and one shimmer of the hour tune the rest.
     The grown branches are keyed by content — the parent re-derives
     them on every render, the ear must not re-listen for that. */
  const budsKey = channeling?.map((b) => b.question).join("\u0001") ?? "";
  const field = useMemo(
    () =>
      buildResonanceField({
        scope: scopeHint ?? null,
        context: contextText ?? null,
        buds: budsKey ? budsKey.split("\u0001") : null,
        hour,
      }),
    [scopeHint, contextText, budsKey, hour]
  );
  const idf = useMemo(() => buildIdf(grove.map((w) => w.text)), [grove]);
  const seenSet = useMemo(
    () => (awake ? new Set(loadSeen().map((s) => s.toLowerCase())) : null),
    [awake]
  );
  const ranked = useMemo(() => {
    const hits = rankWhispers(grove, field, {
      idf,
      seen: seenSet,
      limit: grove.length,
      perSubject: 2,
    });
    if (hits.length === 0) return grove.map((w) => ({ ...w, score: 0 }));
    const hitTexts = new Set(hits.map((h) => h.text.toLowerCase()));
    const rest = grove.filter((w) => !hitTexts.has(w.text.toLowerCase()));
    return [...hits, ...rest.map((w) => ({ ...w, score: 0 }))];
  }, [grove, field, idf, seenSet]);

  /* THE WORLD — clusters of three whispers climbing the trunk from
     the very base upward (cluster 0 nearest the input bar), echo
     rows wandering both horizons. All anchors are deterministic. */
  const world = useMemo(() => {
    const total = Math.ceil(ranked.length / PER_CLUSTER);
    /* cumulative height measured upward from the base */
    let acc = 0;
    const clusters: {
      i: number;
      y: number;
      side: "left" | "right";
      seamBefore: boolean;
      items: (CanopyWhisper & { score: number })[];
    }[] = [];
    for (let i = 0; i < total; i++) {
      const seamBefore = i > 0 && i % SEAM_EVERY === 0;
      if (seamBefore) acc += SEAM_GAP;
      clusters.push({
        i,
        y: 0,
        side: i % 2 === 0 ? "right" : "left",
        seamBefore,
        items: ranked.slice(i * PER_CLUSTER, (i + 1) * PER_CLUSTER),
      });
      acc += CLUSTER_STEP;
    }
    const height = PAD_BOTTOM + acc + PAD_TOP;
    /* cluster 0 drinks from the base; every next limb stands higher */
    let run = 0;
    for (let i = 0; i < total; i++) {
      const seamBefore = i > 0 && i % SEAM_EVERY === 0;
      if (seamBefore) run += SEAM_GAP;
      clusters[i].y = height - PAD_BOTTOM - run;
      run += CLUSTER_STEP;
    }
    return { clusters, height };
  }, [ranked]);

  const echoPool = useMemo(() => {
    const texts: string[] = [];
    for (const w of grove) if (!texts.includes(w.text)) texts.push(w.text);
    return texts;
  }, [grove]);

  /* THE GEOMETRY OF THE WINDOW — narrow phones carry a tighter reach
     and narrower leaves, so the trunk and its whispers always share
     the first view together. */
  const [geom, setGeom] = useState({ reach: 250, leaf: 300 });

  /* ------------------------- the camera ----------------------------- */
  /*  Coordinates live in refs; the transform is written once per
      frame under a single rAF lock, and only while a walk is alive. */
  const vpRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const cam = useRef({ x: 0, y: 0 });
  const vpSize = useRef({ w: 0, h: 0 });
  const worldH = useRef(0);
  const rafId = useRef(0);
  const walking = useRef(false);
  const dragging = useRef(false);
  const downTarget = useRef<HTMLElement | null>(null);
  const lastPtr = useRef({ x: 0, y: 0 });
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  const movedPx = useRef(0);
  const suppressUntil = useRef(0);
  const lastBucket = useRef(Number.NaN);
  const [band, setBand] = useState({ y0: -1, y1: -1 });

  /* the framing law — the left field opens with a breath, so the
     trunk and the first limbs stand together in the window */
  const frameX = (vw: number, reach: number, leaf: number) => {
    if (vw >= CANVAS_W) return 0;
    const contentLeft = TRUNK_X - reach - leaf;
    return Math.max(0, contentLeft - 20);
  };

  const applyCam = () => {
    const el = worldRef.current;
    if (!el) return;
    /* THE SPHERE — the walk past either end re-anchors by one world */
    const H = worldH.current;
    if (H > 0) {
      if (cam.current.y < 0) cam.current.y += H;
      else if (cam.current.y >= H) cam.current.y -= H;
    }
    /* the horizontal horizon — the echo fields bound the sideways walk.
       cam.x is the world x at the viewport's left edge (the transform
       negates it), so it walks from 0 to the world's far right. */
    const maxX = Math.max(0, CANVAS_W - vpSize.current.w);
    if (cam.current.x < 0) cam.current.x = 0;
    else if (cam.current.x > maxX) cam.current.x = maxX;
    /* on windows wider than the world, the world itself centers */
    el.style.left = `${Math.max(0, (vpSize.current.w - CANVAS_W) / 2)}px`;
    el.style.transform = `translate3d(${-cam.current.x}px, ${-cam.current.y}px, 0)`;
  };

  const publishBand = () => {
    const b0 = cam.current.y - BAND_BUFFER;
    const b1 = cam.current.y + vpSize.current.h + BAND_BUFFER;
    const bucket = Math.floor(cam.current.y / BAND_BUCKET);
    if (bucket !== lastBucket.current) {
      lastBucket.current = bucket;
      setBand({ y0: b0, y1: b1 });
    }
  };

  const startWalk = () => {
    if (walking.current) return;
    walking.current = true;
  };

  const endWalk = () => {
    walking.current = false;
  };

  const walkLoop = () => {
    if (!walking.current) return;
    applyCam();
    publishBand();
    rafId.current = 0;
  };

  const scheduleFrame = () => {
    if (rafId.current) return;
    rafId.current = window.requestAnimationFrame(walkLoop);
  };

  /* the coast — the gentle exponential glide after release */
  const coast = (v0x: number, v0y: number) => {
    const start = performance.now();
    let vx = Math.abs(v0x) > COAST_MAX_V ? Math.sign(v0x) * COAST_MAX_V : v0x;
    let vy = Math.abs(v0y) > COAST_MAX_V ? Math.sign(v0y) * COAST_MAX_V : v0y;
    let last = start;
    const step = (now: number) => {
      if (!walking.current) return;
      const dt = Math.max(1, now - last);
      last = now;
      cam.current.x += vx * dt;
      cam.current.y += vy * dt;
      const decay = Math.exp(-dt / COAST_TAU);
      vx *= decay;
      vy *= decay;
      applyCam();
      publishBand();
      if (now - start > COAST_MAX_MS || Math.hypot(vx, vy) < COAST_MIN_V) {
        rafId.current = 0;
        endWalk();
        return;
      }
      rafId.current = window.requestAnimationFrame(step);
    };
    rafId.current = window.requestAnimationFrame(step);
  };

  /* camera start: the trunk's base rises from the top of the input bar.
     The first framing is scheduled async — the engine never renders
     synchronously inside an effect. */
  useEffect(() => {
    const el = vpRef.current;
    if (!el || !mounted) return;
    const measure = (w: number) => ({
      reach: w < 760 ? 90 : 250,
      leaf: w < 760 ? Math.max(190, Math.min(300, w * 0.55)) : 300,
    });
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      vpSize.current = { w: r.width, h: r.height };
      setGeom(measure(r.width));
      if (!dragging.current && !walking.current) {
        if (cam.current.y === 0 && worldH.current > 0) {
          cam.current.y = worldH.current - r.height;
        }
        cam.current.x = frameX(
          r.width,
          measure(r.width).reach,
          measure(r.width).leaf
        );
        applyCam();
        lastBucket.current = Number.NaN;
        publishBand();
      }
    });
    ro.observe(el);
    vpSize.current = {
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
    };
    setGeom(measure(vpSize.current.w));
    const id = window.requestAnimationFrame(() => {
      if (worldH.current > 0 && cam.current.y === 0) {
        cam.current.y = worldH.current - vpSize.current.h;
      }
      cam.current.x = frameX(
        vpSize.current.w,
        measure(vpSize.current.w).reach,
        measure(vpSize.current.w).leaf
      );
      applyCam();
      lastBucket.current = Number.NaN;
      publishBand();
    });
    return () => {
      window.cancelAnimationFrame(id);
      ro.disconnect();
      if (rafId.current) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
      walking.current = false;
      dragging.current = false;
    };
    /* the camera engine lives entirely in refs — the closures read
        and write refs only, never stale state */
  }, [mounted]);

  useEffect(() => {
    worldH.current = world.height;
  }, [world.height]);

  /* THE GESTURES — pointer down moves the camera; a quiet tap picks.
     The pointer is captured by the viewport, so the browser's derived
     click lands on the viewport — a mouse tap is therefore completed
     by hand (the captured down-target's own click); touch keeps the
     browser's native tap on the chip itself. */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging.current = true;
    movedPx.current = 0;
    downTarget.current = e.target as HTMLElement | null;
    lastPtr.current = { x: e.clientX, y: e.clientY };
    samples.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    if (rafId.current) {
      window.cancelAnimationFrame(rafId.current);
      rafId.current = 0;
    }
    startWalk();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPtr.current.x;
    const dy = e.clientY - lastPtr.current.y;
    lastPtr.current = { x: e.clientX, y: e.clientY };
    movedPx.current += Math.abs(dx) + Math.abs(dy);
    cam.current.x += dx;
    cam.current.y += dy;
    const now = performance.now();
    samples.current.push({ x: e.clientX, y: e.clientY, t: now });
    if (samples.current.length > 6) samples.current.shift();
    scheduleFrame();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* the capture may already be gone */
    }
    if (movedPx.current > GESTURE_SLOP) {
      suppressUntil.current = performance.now() + CLICK_GUARD_MS;
      /* the coast — velocity from the last samples, brief by design */
      const s = samples.current;
      let v = { x: 0, y: 0 };
      if (s.length >= 2) {
        const a = s[0];
        const b = s[s.length - 1];
        const dt = Math.max(1, b.t - a.t);
        v = { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
      }
      if (Math.hypot(v.x, v.y) > COAST_MIN_V) {
        coast(v.x, v.y);
      } else {
        endWalk();
        publishBand();
      }
      return;
    }
    endWalk();
    /* the quiet tap — a mouse tap is finished by hand, for the capture
        carried the browser's own click to the viewport */
    if (e.pointerType === "mouse") {
      const el = downTarget.current?.closest?.(
        "button[data-canopy-pick]"
      ) as HTMLButtonElement | null;
      if (el && !el.disabled) el.click();
    }
  };

  /* a drag must never pick a whisper */
  const guardClick = () => performance.now() < suppressUntil.current;

  const pick = (q: string) => {
    if (disabled || guardClick()) return;
    /* the walk is kept — the helix reflects the branch this step took */
    recordJourney({ b: category, s: scopeHint ?? undefined });
    recordSeen([q]);
    onPick(q);
  };

  if (!mounted) return null;

  /* ---------------- the culled world -------------------------------
     Only the limbs and echo rows near the window are ever laid out;
     wrapped copies across the seam render in the same pass, so the
     sphere has no walls and the DOM stays feather-light. */
  const clusterBlocks: ReactNode[] = [];
  for (const c of world.clusters) {
    for (const dy of [0, -world.height, world.height]) {
      const y = c.y + dy;
      if (y < band.y0 - 200 || y > band.y1 + 200) continue;
      const side = c.side;
      const wobble = organic(c.i);
      const left = side === "left";
      const svgLeft = left ? TRUNK_X - geom.reach - 6 : TRUNK_X - 6;
      const svgW = geom.reach + 10;
      const leafLeft = left
        ? TRUNK_X - geom.reach - geom.leaf
        : TRUNK_X + geom.reach;
      const movement = c.items[0]?.movement ?? "deepen";
      const Icon = MOVEMENT_ICONS[movement] ?? Layers;
      clusterBlocks.push(
        <div
          key={`${c.i}:${dy}`}
          className="canopy-radial absolute"
          style={
            {
              left: 0,
              top: y - 96 + wobble,
              width: CANVAS_W,
              height: 236,
              "--rad-x": left ? "30px" : "-30px",
              "--rad-y": "8px",
              animationDelay: `${Math.min(c.i * 36, 420)}ms`,
            } as CSSProperties
          }
        >
          {/* the seam of the hour — a fresh grove begins here */}
          {c.seamBefore && (
            <p
              className="mono-label absolute left-1/2 top-[-26px] -translate-x-1/2 whitespace-nowrap rounded-full border hairline px-3 py-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/50"
              style={{ left: TRUNK_X, transform: "translateX(-50%)" }}
            >
              {t("The grove renews each hour")}
            </p>
          )}

          {/* the limb — two strokes (a glow and its core) curving from
              the trunk out to the whispers */}
          <svg
            aria-hidden="true"
            className="absolute"
            style={{ left: svgLeft, top: 8 }}
            width={svgW}
            height={144}
            viewBox={`0 0 ${svgW} 144`}
            fill="none"
          >
            {left ? (
              <>
                <path
                  d={`M ${geom.reach + 4} 116 C ${geom.reach - 75} 108, ${Math.max(10, geom.reach - 165)} 88, 6 44`}
                  stroke="color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`M ${geom.reach + 4} 116 C ${geom.reach - 75} 108, ${Math.max(10, geom.reach - 165)} 88, 6 44`}
                  stroke="color-mix(in srgb, var(--scope-a,var(--gd)) 70%, transparent)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <path
                  d={`M 6 116 C ${Math.max(10, geom.reach - 167)} 108, ${Math.max(20, geom.reach - 77)} 88, ${geom.reach + 2} 44`}
                  stroke="color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d={`M 6 116 C ${Math.max(10, geom.reach - 167)} 108, ${Math.max(20, geom.reach - 77)} 88, ${geom.reach + 2} 44`}
                  stroke="color-mix(in srgb, var(--scope-a,var(--gd)) 70%, transparent)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </>
            )}
            {/* the knot on the trunk */}
            <circle
              cx={left ? geom.reach + 4 : 6}
              cy="116"
              r="4"
              fill="var(--scope-a,var(--gd))"
            />
          </svg>

          {/* the whispers at the limb's tip */}
          <div
            className="absolute flex flex-col gap-1.5"
            style={{ left: leafLeft, top: 22, width: geom.leaf }}
          >
            <p
              className={cn(
                "mono-label mb-0.5 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.2em] text-muted-foreground/70",
                left ? "justify-start" : "justify-end"
              )}
            >
              {left ? (
                <>
                  <Icon className="size-3 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
                  {t(BRANCH_TYPE_LABELS[movement])}
                </>
              ) : (
                <>
                  {t(BRANCH_TYPE_LABELS[movement])}
                  <Icon className="size-3 text-[var(--scope-a,var(--gd))]" aria-hidden="true" />
                </>
              )}
            </p>
            {c.items.map((w) => {
              const deep = w.score >= 2.4;
              const attuned = !deep && w.score > 0;
              return (
                <button
                  key={w.text}
                  type="button"
                  data-canopy-pick=""
                  onClick={() => pick(w.text)}
                  disabled={disabled}
                  data-testid={`${testIdPrefix}-whisper`}
                  className={cn(
                    "focus-glow relative line-clamp-2 rounded-2xl border px-3.5 py-2 text-left text-[13.5px] leading-snug transition-all duration-300 hover:-translate-y-px hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                    deep
                      ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_62%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_13%,var(--glass-bg))] text-foreground shadow-[0_0_16px_-6px_color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)]"
                      : attuned
                        ? "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_42%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,var(--glass-bg))] text-foreground/90"
                        : "border-[color-mix(in_srgb,var(--scope-a,var(--gd))_28%,transparent)] bg-[color-mix(in_srgb,var(--glass-bg)_94%,transparent)] text-foreground/85 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_58%,transparent)]"
                  )}
                >
                  {(deep || attuned) && (
                    <span
                      key={`reveal-${w.text}`}
                      aria-hidden="true"
                      className="resonance-reveal pointer-events-none absolute inset-0 rounded-2xl"
                    />
                  )}
                  {w.text}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
  }

  /* the echo rows — distant whispers on both horizons, wrapped across
     the seam exactly like the limbs, so the sphere has no walls */
  const echoBlocks: ReactNode[] = [];
  if (echoPool.length > 0) {
    for (const dy of [0, -world.height, world.height]) {
      const row0 = Math.max(0, Math.floor((band.y0 - 120 - dy) / ECHO_ROW));
      const row1 = Math.ceil((band.y1 + 120 - dy) / ECHO_ROW);
      for (let j = row0; j <= row1; j++) {
        const top = j * ECHO_ROW + dy;
        if (top < band.y0 - 120 || top > band.y1 + 120) continue;
        for (const side of ["left", "right"] as const) {
          const seed = side === "left" ? 53 : 1613;
          const text = echoPool[(j * 7 + seed) % echoPool.length];
          if (!text) continue;
          const left = side === "left";
          const x = left
            ? 24 + (j % 2) * 38
            : CANVAS_W - ECHO_W - 24 - (j % 2) * 38;
          echoBlocks.push(
            <button
              key={`echo-${side}-${j}:${dy}`}
              type="button"
              data-canopy-pick=""
              onClick={() => pick(text)}
              disabled={disabled}
              data-testid={`${testIdPrefix}-echo`}
              title={text}
              className="canopy-radial focus-glow absolute line-clamp-2 rounded-full border px-3 py-1.5 text-left text-[11px] leading-[1.25] text-muted-foreground/60 transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_34%,transparent)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              style={
                {
                  left: x,
                  top,
                  width: ECHO_W,
                  borderColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 14%, var(--hairline))",
                  background:
                    "color-mix(in srgb, var(--glass-bg) 82%, transparent)",
                  "--rad-x": left ? "18px" : "-18px",
                  "--rad-y": "0px",
                  animationDelay: "560ms",
                } as CSSProperties
              }
            >
              {text}
            </button>
          );
        }
      }
    }
  }

  /* THE CROWN — the exchange's own grown branches, and the whispers
     the resonance ear lifted highest, hanging above the trunk. */
  const crownBuds = channeling ?? [];
  const crownFocused = ranked
    .filter((w) => w.score > 0)
    .slice(0, 6);
  const crownVisible = crownBuds.length > 0 || crownFocused.length > 0;

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
          The tree reaches the very top of the chat box, sliding beneath
          the floating world controls. */}
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
                {grove.length} {t("whispers on this branch")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
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
      </div>

      {/* --------------------- the pannable world ---------------------- */}
      <div
        ref={vpRef}
        role="region"
        aria-label={t("The living tree")}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        style={{ overscrollBehavior: "contain" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* THE WORLD — one container, moved by translate3d. */}
        <div
          ref={worldRef}
          className="absolute left-0 top-0"
          style={{
            width: CANVAS_W,
            height: world.height,
            willChange: "transform",
          }}
        >
          {/* the trunk — one breathing line rising from the input bar */}
          <div
            aria-hidden="true"
            className="canopy-radial animate-line-breathe absolute"
            style={
              {
                left: TRUNK_X,
                top: 40,
                bottom: 24,
                width: 2,
                marginLeft: -1,
                background:
                  "linear-gradient(180deg, transparent, var(--scope-a,var(--gd)) 7%, var(--scope-b,var(--pk)) 93%, transparent)",
                "--rad-y": "0px",
                "--rad-s": "0.7",
              } as CSSProperties
            }
          />
          {/* the root flare — the tree drinks from the input bar */}
          <div
            aria-hidden="true"
            className="canopy-radial absolute rounded-full"
            style={
              {
                left: TRUNK_X - 90,
                bottom: 0,
                width: 180,
                height: 60,
                background:
                  "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent), transparent 70%)",
                "--rad-y": "10px",
                animationDelay: "60ms",
              } as CSSProperties
            }
          />

          {clusterBlocks}
          {echoBlocks}
        </div>

        {/* THE CROWN — hanging above the trunk, always with the visitor */}
        {crownVisible && (
          <section
            className="canopy-radial pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3"
            style={{ "--rad-y": "-14px" } as CSSProperties}
            data-testid={`${testIdPrefix}-crown`}
          >
            <div className="pointer-events-auto w-full max-w-[620px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_30%,transparent)] bg-[color-mix(in_srgb,var(--background)_78%,transparent)] px-3.5 py-2.5 backdrop-blur-xl">
              <p className="mono-label mb-1.5 flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.2em] text-[var(--scope-a,var(--gd))]">
                <Flame className="size-3" aria-hidden="true" />
                {t("Focused on this exchange")}
              </p>
              <div className="flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto nice-scroll">
                {crownBuds.map((b, i) => (
                  <button
                    key={`grown-${i}`}
                    type="button"
                    data-canopy-pick=""
                    onClick={() => pick(b.question)}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-crown-chip`}
                    className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_52%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_13%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_20%,var(--glass-bg))] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {b.question}
                  </button>
                ))}
                {crownFocused.map((w) => (
                  <button
                    key={`focused-${w.text}`}
                    type="button"
                    data-canopy-pick=""
                    onClick={() => pick(w.text)}
                    disabled={disabled}
                    data-testid={`${testIdPrefix}-crown-chip`}
                    className="focus-glow max-w-full rounded-full border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_8%,var(--glass-bg))] px-3 py-1.5 text-left font-serif text-[12.5px] italic leading-snug text-foreground/90 transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_15%,var(--glass-bg))] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {w.text}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* THE EMPTY ROOM'S OWN IDENTITY — spoken above the trunk base */}
        {(introSub || introSubExtra || introExtra) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2 px-4 text-center">
            {introSub && (
              <p className="canopy-radial max-w-[460px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,transparent)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] px-4 py-2.5 text-[13.5px] leading-relaxed text-muted-foreground backdrop-blur-xl">
                {introSub}
              </p>
            )}
            {introSubExtra && (
              <p className="canopy-radial max-w-[440px] rounded-2xl border border-[color-mix(in_srgb,var(--scope-a,var(--gd))_16%,transparent)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] px-4 py-2 text-[13px] italic leading-relaxed text-muted-foreground/80 backdrop-blur-xl">
                {introSubExtra}
              </p>
            )}
            {introExtra && (
              <div className="canopy-radial pointer-events-auto flex justify-center">
                {introExtra}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
