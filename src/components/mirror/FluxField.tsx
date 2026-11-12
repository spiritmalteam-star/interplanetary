"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Flame,
  Image as ImageIcon,
  BookOpen,
  Music,
  Minimize2,
  Play,
  Sparkles,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useMirror } from "@/lib/mirror-store";
import {
  FLUX_ARTWORKS,
  FLUX_INSIGHTS,
  FLUX_PAGES,
  FLUX_PRACTICES,
  type FluxCellKind,
} from "@/lib/data/flux-corridor";

/* ------------------------------------------------------------------ */
/*  THE FLUX — the four-directional current.                           */
/*                                                                     */
/*  Not a feed of strangers: a FIELD of creations walked in EVERY      */
/*  direction — up, down, left, right — one full-screen work at a      */
/*  time. Videos, voices, paintings, the house's artworks, the         */
/*  mirror's illuminations: practices, principles, pages.              */
/*                                                                     */
/*  THE MIRROR'S PATH — the algorithm does not trap; it ILLUMINATES.   */
/*  From wherever the walker stands, a golden path of seven steps is   */
/*  lit toward what EVOLVES them — art, insight, craft. The walker may */
/*  follow the light or step anywhere freely; the path re-lights from  */
/*  the new ground without ever judging the choice.                    */
/*                                                                     */
/*  THE COOL LAW — transform-and-opacity only; only nine cells ever    */
/*  live in the DOM; only the standing cell plays.                     */
/* ------------------------------------------------------------------ */

const GRID_W = 10;
const GRID_H = 10;
const CELLS = GRID_W * GRID_H;
const PATH_LENGTH = 7;

interface FluxWork {
  id: string;
  kind: string;
  title: string;
  mime: string;
  url: string;
  authorName: string;
  resonance: number;
  own: boolean;
}

interface FluxItem {
  kind: FluxCellKind;
  title: string;
  body?: string;
  imageUrl?: string;
  mediaUrl?: string;
  author: string;
  resonance: number;
  mediaId?: string;
}

interface FluxCell {
  col: number;
  row: number;
  item: FluxItem;
}

/* the walk's own hash — the same honest randomness the tree uses */
function hashCell(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** what the mirror favors — everything that grows the walker */
const KIND_WEIGHT: Record<FluxCellKind, number> = {
  video: 2.6,
  audio: 2.2,
  image: 2.4,
  art: 2.4,
  insight: 2.8,
  practice: 3.0,
  page: 2.6,
};

function kindOfMime(mime: string, kind: string): FluxCellKind {
  if (kind === "video") return "video";
  if (kind === "audio") return "audio";
  return "image";
}

const KIND_CHIP: Record<FluxCellKind, string> = {
  video: "A moving vision",
  audio: "A kept voice",
  image: "A kept image",
  art: "The house's art",
  insight: "An illumination",
  practice: "Today's step",
  page: "A page",
};

const KIND_ICON: Record<FluxCellKind, typeof Video> = {
  video: Video,
  audio: Music,
  image: ImageIcon,
  art: ImageIcon,
  insight: Sparkles,
  practice: Sparkles,
  page: BookOpen,
};

/* --------------------- assemble the field's cells ------------------- */

function buildField(works: FluxWork[], daySeed: number): FluxCell[] {
  const houseItems: FluxItem[] = [
    ...FLUX_ARTWORKS.map(
      (a): FluxItem => ({
        kind: "art",
        title: a.title,
        body: a.line,
        imageUrl: a.image,
        author: "The Mirror Entity",
        resonance: 0,
      })
    ),
    ...FLUX_INSIGHTS.map(
      (a): FluxItem => ({
        kind: "insight",
        title: a.title,
        body: a.body,
        author: "The Mirror Entity",
        resonance: 0,
      })
    ),
    ...FLUX_PRACTICES.map(
      (a): FluxItem => ({
        kind: "practice",
        title: a.title,
        body: a.body,
        author: "The Mirror Entity",
        resonance: 0,
      })
    ),
    ...FLUX_PAGES.map(
      (a): FluxItem => ({
        kind: "page",
        title: a.title,
        body: a.body,
        author: "The house's volumes",
        resonance: 0,
      })
    ),
  ];

  /* the published works ride first — the field belongs to its makers */
  const workItems: FluxItem[] = works.map(
    (w): FluxItem => ({
      kind: kindOfMime(w.mime, w.kind),
      title: w.title,
      mediaUrl: w.url,
      author: w.authorName,
      resonance: w.resonance,
      mediaId: w.id,
    })
  );

  const mixed: FluxItem[] = [];
  const wi = [...workItems];
  const hi = seededShuffle(houseItems, daySeed);
  /* weave: every 3rd cell belongs to a maker, the rest to the house —
     then the whole field repeats seeded so the walk never ends */
  while (mixed.length < CELLS) {
    for (let k = 0; k < 3 && wi.length > 0; k++) {
      mixed.push(wi.shift()!);
    }
    for (let k = 0; k < 5 && hi.length > 0; k++) {
      const it = hi.shift()!;
      mixed.push(it);
      hi.push(it);
    }
    if (wi.length === 0 && hi.length === 0) break;
  }
  while (mixed.length < CELLS) {
    mixed.push(houseItems[hashCell(`${daySeed}:${mixed.length}`) % houseItems.length]);
  }

  const cells: FluxCell[] = [];
  for (let i = 0; i < CELLS; i++) {
    cells.push({
      col: i % GRID_W,
      row: Math.floor(i / GRID_W),
      item: mixed[i % mixed.length],
    });
  }
  return cells;
}

/* ------------------------ the mirror's path ------------------------- */

function computePath(
  cells: FluxCell[],
  from: { x: number; y: number },
  daySeed: number
): { x: number; y: number }[] {
  const affinity = (c: FluxCell) =>
    KIND_WEIGHT[c.item.kind] +
    (hashCell(`${c.col},${c.row},${daySeed}`) % 100) / 100;

  const byKey = new Map<string, FluxCell>();
  cells.forEach((c) => byKey.set(`${c.col},${c.row}`, c));

  const path: { x: number; y: number }[] = [];
  const seen = new Set<string>([`${from.x},${from.y}`]);
  let cur = { x: from.x, y: from.y };
  for (let step = 0; step < PATH_LENGTH; step++) {
    const neighbors = [
      { x: cur.x, y: cur.y - 1 },
      { x: cur.x + 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x - 1, y: cur.y },
    ].filter(
      (n) =>
        n.x >= 0 &&
        n.x < GRID_W &&
        n.y >= 0 &&
        n.y < GRID_H &&
        !seen.has(`${n.x},${n.y}`)
    );
    if (neighbors.length === 0) break;
    let best = neighbors[0];
    let bestA = -1;
    for (const n of neighbors) {
      const cell = byKey.get(`${n.x},${n.y}`);
      if (!cell) continue;
      const a = affinity(cell) + hashCell(`${n.x}:${n.y}:${step}`) % 7 / 10;
      if (a > bestA) {
        bestA = a;
        best = n;
      }
    }
    seen.add(`${best.x},${best.y}`);
    path.push(best);
    cur = best;
  }
  return path;
}

/* ---------------------------- the cell ------------------------------ */

const FluxCard = memo(function FluxCard({
  cell,
  standing,
  onPath,
  pathStep,
  onAmplify,
  amplified,
  onStep,
}: {
  cell: FluxCell;
  standing: boolean;
  onPath: boolean;
  pathStep: number | null;
  onAmplify: (cell: FluxCell) => void;
  amplified: boolean;
  onStep: (x: number, y: number) => void;
}) {
  const t = useT();
  const item = cell.item;
  const Icon = KIND_ICON[item.kind];

  return (
    <div
      className="absolute left-0 top-0 h-full w-full overflow-hidden bg-[#070a12]"
      style={{
        transform: `translate3d(${cell.col * 100}vw, ${cell.row * 100}%, 0)`,
        visibility: standing || onPath ? "visible" : undefined,
      }}
      data-testid={`flux-cell-${cell.col}-${cell.row}`}
    >
      {/* the work itself */}
      {item.kind === "video" && item.mediaUrl ? (
        standing ? (
          <video
            key={item.mediaId}
            src={item.mediaUrl}
            className="absolute inset-0 size-full object-contain"
            autoPlay
            loop
            muted
            playsInline
            controls
            data-testid="flux-video"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="size-10 text-white/30" aria-hidden="true" />
          </div>
        )
      ) : item.kind === "audio" && item.mediaUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10">
          <span
            aria-hidden="true"
            className="flex h-24 items-end gap-1.5"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-[color-mix(in_srgb,var(--gd)_70%,#ffffff)]"
                style={{
                  height: `${28 + ((hashCell(`${cell.col}:${cell.row}:${i}`) % 60))}%`,
                  opacity: 0.5,
                }}
              />
            ))}
          </span>
          {standing && (
            <audio
              src={item.mediaUrl}
              controls
              className="w-full max-w-[420px]"
              data-testid="flux-audio"
            />
          )}
        </div>
      ) : item.kind === "image" && item.mediaUrl ? (
        /* a published image streams straight from its keeper's vault */
        <img
          src={item.mediaUrl}
          alt={item.title}
          className="absolute inset-0 size-full object-cover"
          loading={standing ? "eager" : "lazy"}
          data-testid="flux-image"
        />
      ) : item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority={standing}
        />
      ) : null}

      {/* the text cards — the mirror's own pages */}
      {(item.kind === "insight" || item.kind === "practice" || item.kind === "page") && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#070a12] px-6 sm:px-14">
          <div className="max-w-[620px]">
            <p className="mono-label text-[9px] uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--gd)_75%,#ffffff)]">
              {t(KIND_CHIP[item.kind])}
            </p>
            <h2 className="mt-4 font-serif text-[26px] leading-snug text-[#f0e7cd] sm:text-[34px]">
              {item.title}
            </h2>
            <span
              aria-hidden="true"
              className="my-5 block h-px w-24 bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--gd)_60%,transparent)] to-transparent"
            />
            <p className="whitespace-pre-wrap text-[15.5px] leading-[1.85] text-white/78 sm:text-[17px]">
              {item.body}
            </p>
          </div>
        </div>
      )}

      {/* the legibility scrim — a quiet ink wash at the base */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[rgba(4,6,12,0.88)] via-[rgba(4,6,12,0.4)] to-transparent"
      />

      {/* the crown — kind, author, path mark (beneath the realm's own
          crown, never colliding with it) */}
      <div className="absolute left-4 top-14 flex max-w-[80%] flex-wrap items-center gap-2 sm:left-6 sm:top-[60px]">
        <span className="mono-label flex shrink-0 items-center gap-1.5 rounded-full border border-white/16 bg-[rgba(6,9,16,0.72)] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/85">
          <Icon className="size-3" aria-hidden="true" />
          {t(KIND_CHIP[item.kind])}
        </span>
        <span className="mono-label truncate rounded-full border border-white/10 bg-[rgba(6,9,16,0.6)] px-2.5 py-1 text-[9px] tracking-[0.1em] text-white/70">
          {item.author}
        </span>
        {onPath && pathStep !== null && (
          <span
            className="mono-label shrink-0 rounded-full border border-[rgba(232,217,176,0.5)] bg-[rgba(232,217,176,0.12)] px-2.5 py-1 text-[9px] tracking-[0.14em] text-[#f0e7cd]"
            data-testid="flux-path-mark"
          >
            {t("The mirror's path")} · {pathStep}
          </span>
        )}
      </div>

      {/* the base — title, line, the hands */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:p-6">
        <div className="max-w-[720px]">
          <h3 className="text-[19px] font-medium leading-snug text-white sm:text-[22px]">
            {item.title}
          </h3>
          {item.kind !== "insight" && item.kind !== "practice" && item.kind !== "page" && item.body && (
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-white/70">
              {item.body}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAmplify(cell)}
            aria-label={t("Amplify this work")}
            title={t("Amplify this work")}
            data-testid={`flux-amplify-${cell.col}-${cell.row}`}
            className={cn(
              "focus-glow flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition-all duration-300",
              amplified
                ? "border-[rgba(232,217,176,0.7)] bg-[rgba(232,217,176,0.16)] text-[#f0e7cd]"
                : "border-white/20 bg-[rgba(6,9,16,0.66)] text-white/80 hover:border-[rgba(232,217,176,0.5)] hover:text-[#f0e7cd]"
            )}
          >
            <Flame className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">
              {item.resonance + (amplified ? 1 : 0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

/* --------------------------- the flux ------------------------------- */

export function FluxField() {
  const t = useT();
  const returnToObservatory = useMirror((s) => s.returnToObservatory);

  const [works, setWorks] = useState<FluxWork[] | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [snapping, setSnapping] = useState(false);
  const [following, setFollowing] = useState(false);
  const [amplified, setAmplified] = useState<Set<string>>(new Set());
  const [dims, setDims] = useState({ vw: 0, vh: 0 });
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: number;
    sx: number;
    sy: number;
    lx: number;
    ly: number;
    moved: boolean;
  } | null>(null);
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  const wheelAcc = useRef({ x: 0, y: 0, at: 0 });

  const daySeed = useMemo(
    () => hashCell(new Date().toISOString().slice(0, 10)),
    []
  );
  const cells = useMemo(
    () => buildField(works ?? [], daySeed),
    [works, daySeed]
  );
  const cellKey = (x: number, y: number) => `${x},${y}`;
  const cellAt = useCallback(
    (x: number, y: number) =>
      cells.find((c) => c.col === x && c.row === y) ?? null,
    [cells]
  );

  /* the mirror's path — re-lit from wherever the walker stands */
  const path = useMemo(
    () => computePath(cells, pos, daySeed),
    [cells, pos, daySeed]
  );
  const pathIndex = useMemo(() => {
    const idx = path.findIndex((p) => p.x === pos.x && p.y === pos.y);
    return idx;
  }, [path, pos]);
  const pathKeys = useMemo(() => new Set(path.map((p) => `${p.x},${p.y}`)), [path]);
  const nextPathStep = pathIndex >= 0 ? path[pathIndex + 1] ?? null : path[0] ?? null;

  /* the field's own feed — the hall's published works */
  useEffect(() => {
    let dead = false;
    fetch("/api/media?scope=feed&take=60")
      .then((r) => r.json())
      .then((d: { works?: FluxWork[] }) => {
        if (!dead) setWorks(d.works ?? []);
      })
      .catch(() => {
        if (!dead) setWorks([]);
      });
    return () => {
      dead = true;
    };
  }, []);

  /* the viewport's own measures */
  useEffect(() => {
    const apply = () =>
      setDims({ vw: window.innerWidth, vh: window.innerHeight });
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const clampPos = useCallback((x: number, y: number) => {
    const cx = Math.max(0, Math.min(GRID_W - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(GRID_H - 1, Math.round(y)));
    setPos((p) => (p.x === cx && p.y === cy ? p : { x: cx, y: cy }));
  }, []);

  /* THE FOLLOWING HAND — one glide per step, the walker's own pace */
  const followNext = useCallback(() => {
    if (!nextPathStep) return;
    setSnapping(true);
    setPos({ x: nextPathStep.x, y: nextPathStep.y });
    window.setTimeout(() => setSnapping(false), 520);
  }, [nextPathStep]);

  useEffect(() => {
    if (!following || !nextPathStep) return;
    const id = window.setInterval(followNext, 6400);
    return () => window.clearInterval(id);
  }, [following, nextPathStep, followNext]);

  /* THE FREE HANDS — drag in any direction; the release snaps */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) return;
    dragRef.current = {
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
      d.lx = e.clientX;
      d.ly = e.clientY;
      setDrag({ dx, dy });
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d || d.id !== e.pointerId) return;
      setFollowing(false);
      if (!d.moved) {
        setDrag(null);
        return;
      }
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      const vw = dims.vw || window.innerWidth;
      const vh = dims.vh || window.innerHeight;
      const vx = dx / Math.max(1, vw);
      const vy = dy / Math.max(1, vh);
      setDrag(null);
      setSnapping(true);
      const p = posRef.current;
      /* one cell per gesture — the strongest axis leads */
      if (Math.abs(vx) > Math.abs(vy)) {
        clampPos(p.x + (vx < 0 ? 1 : -1), p.y);
      } else {
        clampPos(p.x, p.y + (vy < 0 ? 1 : -1));
      }
      window.setTimeout(() => setSnapping(false), 520);
    },
    [clampPos, dims.vh, dims.vw]
  );

  /* the wheel — one breath per notch */
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      const acc = wheelAcc.current;
      if (now - acc.at > 700) {
        acc.x = 0;
        acc.y = 0;
      }
      acc.at = now;
      acc.x += e.shiftKey ? e.deltaY : e.deltaX;
      acc.y += e.shiftKey ? 0 : e.deltaY;
      const p = posRef.current;
      if (Math.abs(acc.y) > 60) {
        setFollowing(false);
        setSnapping(true);
        clampPos(p.x, p.y + (acc.y > 0 ? 1 : -1));
        acc.y = 0;
        acc.x = 0;
        window.setTimeout(() => setSnapping(false), 520);
      } else if (Math.abs(acc.x) > 60) {
        setFollowing(false);
        setSnapping(true);
        clampPos(p.x + (acc.x > 0 ? 1 : -1), p.y);
        acc.y = 0;
        acc.x = 0;
        window.setTimeout(() => setSnapping(false), 520);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampPos]);

  /* the keyboard — the walker's own four directions */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = posRef.current;
      const step = (dx: number, dy: number) => {
        e.preventDefault();
        setFollowing(false);
        setSnapping(true);
        clampPos(p.x + dx, p.y + dy);
        window.setTimeout(() => setSnapping(false), 520);
      };
      if (e.key === "ArrowUp") step(0, -1);
      else if (e.key === "ArrowDown") step(0, 1);
      else if (e.key === "ArrowLeft") step(-1, 0);
      else if (e.key === "ArrowRight") step(1, 0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clampPos]);

  /* the amplify hand — the field's own warmth */
  const onAmplify = useCallback((cell: FluxCell) => {
    const key = `${cell.col},${cell.row}`;
    setAmplified((prev) => {
      const next = new Set(prev);
      if (next.has(key)) return prev;
      next.add(key);
      return next;
    });
    if (cell.item.mediaId) {
      void fetch(`/api/media/${cell.item.mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resonate" }),
      }).catch(() => {});
    }
  }, []);

  /* the visible window — the standing cell and its eight neighbors */
  const visible = useMemo(() => {
    const list: FluxCell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const c = cellAt(pos.x + dx, pos.y + dy);
        if (c) list.push(c);
      }
    }
    return list;
  }, [cellAt, pos]);

  const offsetX = (dims.vw || 1280) * pos.x - (drag?.dx ?? 0);
  const offsetY = (dims.vh || 800) * pos.y - (drag?.dy ?? 0);

  /* the compass — what rests in each direction */
  const compass = useMemo(
    () => ({
      up: cellAt(pos.x, pos.y - 1),
      down: cellAt(pos.x, pos.y + 1),
      left: cellAt(pos.x - 1, pos.y),
      right: cellAt(pos.x + 1, pos.y),
    }),
    [cellAt, pos]
  );

  return (
    <div
      ref={fieldRef}
      className="fixed inset-0 z-40 touch-none overflow-hidden bg-[#04060c] select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-testid="flux-field"
      role="region"
      aria-label={t("The flux — walk in every direction")}
    >
      {/* the walking canvas — one transform carries the whole field */}
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: "100vw",
          height: "100%",
          transform: `translate3d(${-offsetX}px, ${-offsetY}px, 0)`,
          transition:
            snapping && !drag
              ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
        }}
        data-testid="flux-canvas"
      >
        {visible.map((c) => (
          <FluxCard
            key={`${c.col}-${c.row}`}
            cell={c}
            standing={c.col === pos.x && c.row === pos.y}
            onPath={pathKeys.has(cellKey(c.col, c.row))}
            pathStep={
              path.findIndex((p) => p.x === c.col && p.y === c.row) >= 0
                ? path.findIndex((p) => p.x === c.col && p.y === c.row) + 1
                : null
            }
            onAmplify={onAmplify}
            amplified={amplified.has(cellKey(c.col, c.row))}
            onStep={(x, y) => {
              setSnapping(true);
              clampPos(x, y);
              window.setTimeout(() => setSnapping(false), 520);
            }}
          />
        ))}
      </div>

      {/* ---------------- THE CROWN — back, title, follow ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={returnToObservatory}
            aria-label={t("Back to the tree")}
            title={t("Back to the tree")}
            data-testid="flux-back"
            className="focus-glow flex size-8 items-center justify-center rounded-full border border-white/16 bg-[rgba(6,9,16,0.72)] text-white/85 transition-colors duration-300 hover:border-white/40 hover:text-white"
          >
            <Minimize2 className="size-3.5" aria-hidden="true" />
          </button>
          <span className="mono-label rounded-full border border-white/12 bg-[rgba(6,9,16,0.66)] px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-white/80">
            {t("The Flux")}
          </span>
          {works !== null && works.length > 0 && (
            <span className="mono-label hidden rounded-full border border-white/10 bg-[rgba(6,9,16,0.55)] px-2.5 py-1.5 text-[9px] tracking-[0.1em] text-white/60 sm:inline">
              {works.length} {t("works in the hall")}
            </span>
          )}
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFollowing((f) => !f)}
            aria-pressed={following}
            aria-label={following ? t("Rest from the path") : t("Follow the mirror's path")}
            title={following ? t("Rest from the path") : t("Follow the mirror's path")}
            data-testid="flux-follow"
            className={cn(
              "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-all duration-300",
              following
                ? "border-[rgba(232,217,176,0.7)] bg-[rgba(232,217,176,0.16)] text-[#f0e7cd]"
                : "border-white/16 bg-[rgba(6,9,16,0.72)] text-white/80 hover:border-[rgba(232,217,176,0.5)] hover:text-[#f0e7cd]"
            )}
          >
            <Compass className="size-3.5" aria-hidden="true" />
            {following ? t("Following") : t("Follow the mirror")}
          </button>
        </div>
      </div>

      {/* ------------- THE MIRROR'S NEXT HAND — the step forward -------- */}
      {nextPathStep && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-30 flex justify-center sm:bottom-[92px]">
          <button
            type="button"
            onClick={() => {
              setFollowing(false);
              setSnapping(true);
              clampPos(nextPathStep.x, nextPathStep.y);
              window.setTimeout(() => setSnapping(false), 520);
            }}
            aria-label={t("Take the mirror's next step")}
            title={t("Take the mirror's next step")}
            data-testid="flux-next-step"
            className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border border-[rgba(232,217,176,0.45)] bg-[rgba(9,13,21,0.85)] px-4 text-[12px] font-medium text-[#f0e7cd] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.85)] transition-all duration-300 hover:border-[rgba(232,217,176,0.85)]"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {pathIndex >= 0
              ? t("The mirror's path — step {n} of {m}", {
                  n: pathIndex + 1,
                  m: path.length,
                })
              : t("Step onto the mirror's path")}
          </button>
        </div>
      )}

      {/* ------------------- THE COMPASS — the four ways ----------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-2 p-3 sm:p-4">
        <div
          data-testid="flux-compass"
          className="grid grid-cols-2 gap-1 text-white/45"
        >
          {(
            [
              ["left", compass.left, ChevronLeft],
              ["up", compass.up, ChevronUp],
              ["down", compass.down, ChevronDown],
              ["right", compass.right, ChevronRight],
            ] as const
          ).map(([dir, cell, Chevron]) => (
            <span
              key={dir}
              aria-hidden="true"
              className={cn(
                "flex size-7 items-center justify-center rounded-full border border-white/10 bg-[rgba(6,9,16,0.6)] transition-opacity duration-300",
                cell ? "opacity-80" : "opacity-20"
              )}
            >
              <Chevron className="size-3.5" />
            </span>
          ))}
        </div>
        <p className="mono-label max-w-[46%] text-right text-[8.5px] uppercase tracking-[0.2em] text-white/40">
          {t("Drag, wheel or arrow keys — the walk is yours")}
        </p>
      </div>
    </div>
  );
}
