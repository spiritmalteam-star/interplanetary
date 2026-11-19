"use client";

/* ------------------------------------------------------------------ */
/*  THE FIELD — a thousand styles listening to this song.              */
/*                                                                     */
/*  Ten pattern families × ten palettes × ten motion characters =      */
/*  1000 named visualizations, enumerated deterministically. The       */
/*  auto hand matches one to each new song by its own key; a chosen    */
/*  style stays pinned across songs until the visitor unpins it.       */
/*                                                                     */
/*  Every frame reads REAL audio data through the shared AnalyserNode  */
/*  — bass-reactive bodies, mid motion, high sparkle. Nothing random   */
/*  decorates.                                                         */
/*                                                                     */
/*  THE QUIET LAW (no device heating): one canvas, one rAF; the loop   */
/*  rests when the song rests, when the tab hides, and when reduced    */
/*  motion is asked; frame rate capped on coarse-pointer devices;      */
/*  DPR capped at 1.5.                                                 */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Dices, Sparkles } from "lucide-react";
import { getActiveAnalyser } from "@/lib/audio/analyser";
import { usePlayerStore } from "@/lib/player-store";
import { cn } from "@/lib/utils";

/* ------------------------- the taxonomy ---------------------------- */

interface Palette {
  name: string;
  a: string;
  b: string;
  glow: string;
  bg: [string, string];
}

const PALETTES: Palette[] = [
  { name: "Gold Ember", a: "#d4b16a", b: "#f3e6c8", glow: "rgba(212,177,106,0.45)", bg: ["#171310", "#241d14"] },
  { name: "Pearl", a: "#e8e2d4", b: "#c9b98f", glow: "rgba(232,226,212,0.35)", bg: ["#14120f", "#201c15"] },
  { name: "Emerald", a: "#34d399", b: "#d1fae5", glow: "rgba(52,211,153,0.4)", bg: ["#0c1512", "#12211b"] },
  { name: "Rose", a: "#ff7a91", b: "#ffe1e7", glow: "rgba(255,122,145,0.4)", bg: ["#181012", "#241518"] },
  { name: "Amethyst", a: "#a78bfa", b: "#f0abfc", glow: "rgba(167,139,250,0.4)", bg: ["#130f1a", "#1c1424"] },
  { name: "Teal Tide", a: "#2dd4bf", b: "#7dd3fc", glow: "rgba(45,212,191,0.4)", bg: ["#0b1414", "#101f20"] },
  { name: "Copper", a: "#e6a06a", b: "#f6d9b8", glow: "rgba(230,160,106,0.42)", bg: ["#161009", "#231812"] },
  { name: "Forest Dusk", a: "#86efac", b: "#fde68a", glow: "rgba(134,239,172,0.38)", bg: ["#0d1410", "#152018"] },
  { name: "Crimson Silk", a: "#ef6a6a", b: "#fbcabc", glow: "rgba(239,106,106,0.4)", bg: ["#170f0f", "#241515"] },
  { name: "Moon Silver", a: "#c7d2cb", b: "#f2f7f0", glow: "rgba(199,210,203,0.32)", bg: ["#101312", "#191f1c"] },
];

const PATTERNS = [
  "Bars", "Wave", "Orbs", "Rings", "Motes",
  "Lattice", "Spiral", "Aurora", "Veil", "Prism",
];

const MOTIONS = [
  { name: "Slow", speed: 0.45, react: 0.7, detail: 0.6 },
  { name: "Drifting", speed: 0.7, react: 0.85, detail: 0.7 },
  { name: "Awake", speed: 1.0, react: 1.0, detail: 0.8 },
  { name: "Keen", speed: 1.25, react: 1.15, detail: 0.9 },
  { name: "Restless", speed: 1.55, react: 1.25, detail: 1.0 },
  { name: "Steady", speed: 0.85, react: 0.9, detail: 0.75 },
  { name: "Deep", speed: 0.55, react: 1.1, detail: 0.5 },
  { name: "Shimmering", speed: 1.1, react: 0.8, detail: 1.1 },
  { name: "Gliding", speed: 0.8, react: 0.75, detail: 0.85 },
  { name: "Torrent", speed: 1.8, react: 1.3, detail: 0.95 },
];

const STYLE_COUNT = 1000;

export function styleAt(index: number): {
  name: string;
  pattern: number;
  palette: Palette;
  motion: (typeof MOTIONS)[number];
} {
  const i = ((index % STYLE_COUNT) + STYLE_COUNT) % STYLE_COUNT;
  const pattern = i % PATTERNS.length;
  const palette = PALETTES[Math.floor(i / PATTERNS.length) % PALETTES.length];
  const motion = MOTIONS[Math.floor(i / (PATTERNS.length * PALETTES.length)) % MOTIONS.length];
  return {
    name: `${motion.name} ${palette.name} ${PATTERNS[pattern]}`,
    pattern,
    palette,
    motion,
  };
}

function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* ---------------------- the audio features ------------------------- */

interface Features {
  bass: number;
  mid: number;
  high: number;
  level: number;
  beat: number;
  bins: Uint8Array;
}

function readFeatures(prevBass: number, bins: Uint8Array): Features | null {
  const analyser = getActiveAnalyser();
  if (!analyser) return null;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const n = data.length;
  const avg = (from: number, to: number) => {
    let sum = 0;
    const a = Math.max(0, Math.min(n, from));
    const b = Math.max(a, Math.min(n, to));
    for (let i = a; i < b; i++) sum += data[i];
    return sum / Math.max(1, b - a) / 255;
  };
  const bass = avg(0, 8);
  const beat = Math.max(0, bass - prevBass);
  bins.set(data.subarray(0, Math.min(bins.length, n)));
  return {
    bass,
    mid: avg(8, 34),
    high: avg(34, 64),
    level: avg(0, n),
    beat,
    bins,
  };
}

/* ------------------------- the renderer ---------------------------- */

interface DrawArgs {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  f: Features;
  style: ReturnType<typeof styleAt>;
}

function drawFrame(args: DrawArgs): void {
  const { ctx, w, h, t, f, style } = args;
  const { a, b, glow, bg } = style.palette;
  const m = style.motion;
  const time = t * 0.001 * m.speed;

  /* the room behind the art */
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, bg[0]);
  grad.addColorStop(1, bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const pulse = 1 + f.beat * 2.2 * m.react;
  const level = Math.min(1, f.level * 1.4 * m.react + 0.04);
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 14 * m.detail;

  switch (style.pattern) {
    case 0: {
      /* BARS — the spectrum standing upright */
      const count = Math.round(28 * m.detail) + 12;
      const bw = w / count;
      for (let i = 0; i < count; i++) {
        const v = f.bins[Math.floor((i / count) * f.bins.length)] / 255;
        const bh = Math.max(2, v * h * 0.72 * pulse);
        ctx.fillStyle = i % 2 ? a : b;
        ctx.globalAlpha = 0.24 + v * 0.76;
        ctx.fillRect(i * bw + bw * 0.18, h - bh - h * 0.12, bw * 0.64, bh);
      }
      break;
    }
    case 1: {
      /* WAVE — the spectrum as one moving line */
      ctx.strokeStyle = b;
      ctx.lineWidth = 2 + level * 2;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const points = 64;
      for (let i = 0; i <= points; i++) {
        const v = f.bins[Math.floor((i / points) * (f.bins.length * 0.8))] / 255;
        const x = (i / points) * w;
        const y = h / 2 + Math.sin(i * 0.35 + time * 2) * (4 + v * h * 0.3 * pulse);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = a;
      ctx.lineWidth = 6;
      ctx.stroke();
      break;
    }
    case 2: {
      /* ORBS — bodies breathing with the bass */
      const count = Math.round(7 * m.detail) + 3;
      for (let i = 0; i < count; i++) {
        const phase = time * (0.4 + i * 0.13) + i * 2.4;
        const x = w / 2 + Math.cos(phase) * w * 0.3 * (0.5 + level * 0.5);
        const y = h / 2 + Math.sin(phase * 1.3) * h * 0.28;
        const r = (10 + i * 9) * (0.6 + f.bass * 1.8 * pulse * m.react);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, i % 2 ? b : a);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 3: {
      /* RINGS — concentric circles answering the mid */
      const rings = Math.round(6 * m.detail) + 3;
      ctx.strokeStyle = a;
      for (let i = 0; i < rings; i++) {
        const v = f.bins[Math.floor((i / rings) * f.bins.length * 0.6)] / 255;
        const r = (18 + i * (w * 0.055)) * (0.85 + v * 0.5 * pulse);
        ctx.globalAlpha = 0.7 - (i / rings) * 0.5;
        ctx.lineWidth = 1.5 + v * 3;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = i % 2 ? b : a;
      }
      break;
    }
    case 4: {
      /* MOTES — high frequencies as drifting sparkle */
      const count = Math.round(46 * m.detail) + 16;
      for (let i = 0; i < count; i++) {
        const seed = i * 2654435761;
        const sx = ((seed >>> 8) % 1000) / 1000;
        const sy = ((seed >>> 18) % 1000) / 1000;
        const x = (sx * w + time * 14 * (0.4 + sy)) % w;
        const y = (sy * h + Math.sin(time + i) * 8 + h) % h;
        const v = f.bins[(i * 3) % f.bins.length] / 255;
        const r = 1 + v * 3.4 * m.react;
        ctx.globalAlpha = 0.18 + v * 0.8;
        ctx.fillStyle = i % 3 ? b : a;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 5: {
      /* LATTICE — a dot grid breathing with the level */
      const cols = Math.round(14 * m.detail) + 8;
      const rows = Math.round(8 * m.detail) + 4;
      const gx = w / cols;
      const gy = h / rows;
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const dist = Math.hypot(cx - cols / 2, cy - rows / 2) / (cols / 2);
          const v = Math.max(0, 1 - dist) * (0.4 + level);
          const wave = 0.5 + 0.5 * Math.sin(time * 2 - dist * 4);
          ctx.globalAlpha = Math.min(0.9, v * wave * 1.4);
          ctx.fillStyle = (cx + cy) % 2 ? a : b;
          ctx.beginPath();
          ctx.arc(cx * gx + gx / 2, cy * gy + gy / 2, 1.4 + v * 3.6 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 6: {
      /* SPIRAL — arms of the spectrum turning */
      const arms = 3;
      ctx.strokeStyle = a;
      for (let arm = 0; arm < arms; arm++) {
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const v = f.bins[Math.floor((i / 60) * f.bins.length * 0.7)] / 255;
          const ang = (i / 60) * Math.PI * 1.6 * (0.8 + level * 0.5) + time * 0.9 + (arm * Math.PI * 2) / arms;
          const r = 8 + i * (Math.min(w, h) * 0.0042) * (0.8 + v * 0.6 * pulse);
          const x = w / 2 + Math.cos(ang) * r;
          const y = h / 2 + Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.6 + level * 2;
        ctx.stroke();
        ctx.strokeStyle = arm % 2 ? b : a;
      }
      break;
    }
    case 7: {
      /* AURORA — layered bands of light */
      const bands = Math.round(4 * m.detail) + 2;
      for (let i = 0; i < bands; i++) {
        const v = f.bins[Math.floor((i / bands) * f.bins.length * 0.5)] / 255;
        ctx.globalAlpha = 0.14 + v * 0.3;
        const g = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.9);
        g.addColorStop(0, i % 2 ? a : b);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 14) {
          const y =
            h * 0.45 +
            Math.sin((x / w) * 4 + time * (1 + i * 0.4) + i * 2) *
              (h * 0.1 + v * h * 0.16 * pulse);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 8: {
      /* VEIL — translucent curtains rising and falling */
      const curtains = Math.round(9 * m.detail) + 5;
      for (let i = 0; i < curtains; i++) {
        const v = f.bins[Math.floor((i / curtains) * f.bins.length * 0.6)] / 255;
        const sway = Math.sin(time * (0.7 + i * 0.11) + i) * (w * 0.06);
        const cw = w / curtains;
        const ch = h * (0.24 + v * 0.6 * pulse * m.react);
        ctx.globalAlpha = 0.12 + v * 0.4;
        ctx.fillStyle = i % 2 ? a : b;
        ctx.fillRect(i * cw + sway * 0.3, (h - ch) / 2, cw * 0.82, ch);
      }
      break;
    }
    default: {
      /* PRISM — a turning fan of spectrum wedges */
      const wedges = Math.round(16 * m.detail) + 8;
      for (let i = 0; i < wedges; i++) {
        const v = f.bins[Math.floor((i / wedges) * f.bins.length * 0.75)] / 255;
        const ang0 = (i / wedges) * Math.PI * 2 + time * 0.5;
        const ang1 = ang0 + (Math.PI * 2) / wedges * 0.72;
        const r = (Math.min(w, h) * 0.16) * (0.6 + v * 0.9 * pulse);
        ctx.globalAlpha = 0.2 + v * 0.65;
        ctx.fillStyle = i % 2 ? b : a;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.arc(w / 2, h / 2, r, ang0, ang1);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

/* --------------------------- the panel ----------------------------- */

const STORAGE_KEY = "mirror:lc-viz:v1";

interface PinnedShape {
  pinned: number | null;
}

interface Props {
  /** the song's own key — the auto hand matches a style to it */
  trackKey: string;
  className?: string;
}

function readPinnedShape(): { pinned: number | null } {
  if (typeof window === "undefined") return { pinned: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pinned: null };
    const parsed = JSON.parse(raw) as PinnedShape;
    if (typeof parsed.pinned === "number") return { pinned: parsed.pinned };
  } catch {
    /* the shelf forgives */
  }
  return { pinned: null };
}

export default function VizPanel({ trackKey, className }: Props) {
  const playing = usePlayerStore((s) => s.playing);

  /* the visitor's own shelf, read once — this room never rides the
     server's sky (ssr:false), so the device's own words are safe here */
  const [pinned, setPinned] = useState<number | null>(
    () => readPinnedShape().pinned
  );
  const [auto, setAuto] = useState<boolean>(() => readPinnedShape().pinned === null);
  const [manualIndex, setManualIndex] = useState<number>(
    () => readPinnedShape().pinned ?? 0
  );

  /* THE MATCH HAND — each new song receives its own style */
  const matched = useMemo(() => hashKey(trackKey) % STYLE_COUNT, [trackKey]);
  const activeIndex = auto ? matched : manualIndex;
  const style = useMemo(() => styleAt(activeIndex), [activeIndex]);

  const persist = useCallback((next: number | null) => {
    setPinned(next);
    try {
      const value: PinnedShape = { pinned: next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* the shelf forgives */
    }
  }, []);

  const choose = useCallback(
    (index: number) => {
      const next = ((index % STYLE_COUNT) + STYLE_COUNT) % STYLE_COUNT;
      setAuto(false);
      setManualIndex(next);
      persist(next);
    },
    [persist]
  );

  const unpin = useCallback(() => {
    setAuto(true);
    persist(null);
  }, [persist]);

  /* ---------------------- the one canvas --------------------------- */

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const prevBassRef = useRef(0);
  const binsRef = useRef<Uint8Array>(new Uint8Array(64));
  const styleRef = useRef(style);
  useEffect(() => {
    styleRef.current = style;
  }, [style]);
  const reducedRef = useRef(false);

  const drawOnce = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const f = readFeatures(prevBassRef.current, binsRef.current);
    if (f) prevBassRef.current = f.bass;
    drawFrame({
      ctx,
      w,
      h,
      t: now,
      f:
        f ??
        {
          bass: 0.12, mid: 0.1, high: 0.06, level: 0.1, beat: 0,
          bins: binsRef.current,
        },
      style: styleRef.current,
    });
  }, []);

  /* the loop — alive only while the song plays */
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* one still frame, always — the art exists even when still */
    drawOnce(performance.now());

    const capped =
      window.matchMedia("(pointer: coarse)").matches
        ? Math.floor(1000 / 30)
        : 0;

    const loop = (now: number) => {
      if (document.hidden) {
        rafRef.current = window.requestAnimationFrame(loop);
        return;
      }
      if (capped && now - lastFrameRef.current < capped) {
        rafRef.current = window.requestAnimationFrame(loop);
        return;
      }
      lastFrameRef.current = now;
      drawOnce(now);
      rafRef.current = window.requestAnimationFrame(loop);
    };

    if (playing && !reducedRef.current) {
      lastFrameRef.current = 0;
      rafRef.current = window.requestAnimationFrame(loop);
    }
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [playing, drawOnce]);

  return (
    <div
      className={cn("overflow-hidden rounded-2xl border hairline", className)}
      data-testid="lc-viz-panel"
      aria-label="The field of a thousand visualizations"
    >
      <div className="relative h-40 sm:h-48">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
        {/* the field's own name, over the art */}
        <div className="pointer-events-none absolute left-3 top-2.5">
          <p className="mono-label text-[8.5px] uppercase tracking-[0.2em] text-white/60">
            {auto ? "matched to this song" : "chosen style"}
          </p>
          <p className="font-serif text-[13px] text-white/90">
            {style.name}
          </p>
          <p className="mono-label text-[8.5px] tracking-[0.16em] text-white/45">
            N° {activeIndex + 1} / {STYLE_COUNT}
          </p>
        </div>
      </div>

      {/* the field's hand — match, walk, wander */}
      <div className="flex items-center gap-1.5 border-t hairline bg-[var(--glass-bg-soft)] px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => (auto ? choose(matched) : unpin())}
          aria-pressed={auto}
          data-testid="lc-viz-auto"
          className={cn(
            "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-all duration-300",
            auto
              ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
              : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3" aria-hidden="true" />
          {auto ? "Matching the song" : "Match the song"}
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => choose(activeIndex - 1)}
            aria-label="The style before"
            className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => choose(activeIndex + 1)}
            aria-label="The style after"
            className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => choose(Math.floor(Math.random() * STYLE_COUNT))}
            aria-label="A chance style"
            data-testid="lc-viz-random"
            className="focus-glow flex size-7 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
          >
            <Dices className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
