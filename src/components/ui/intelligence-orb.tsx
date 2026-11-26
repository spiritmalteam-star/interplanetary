"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE INTELLIGENCE ORB — the house's one honest thinking light       */
/*  (directive §7, appendix C's sphere geometry distilled).            */
/*                                                                     */
/*  A dotted sphere drawn on one small canvas: points seeded by the    */
/*  golden angle across a Fibonacci lattice (never random), turning    */
/*  with a motion pattern that belongs to the STATE — and to nothing   */
/*  else. The orb NEVER fakes activity: it is mounted only while a     */
/*  real event is alive, and every state maps to a real one:           */
/*                                                                     */
/*    base       the orb at rest (rarely mounted)                      */
/*    waiting    the request is queued — the slow turn                 */
/*    working    the sky is computing — a brisk ordered turn           */
/*    generating words are streaming — brisk turn + a breathing glow   */
/*    retrying   a rung gave way — the surge that spins and rewinds    */
/*    error      the sky refused — a still, dimmed sphere              */
/*    complete   the answer stands — settling back to rest             */
/*                                                                     */
/*  THE ROOMS' OWN LIGHTS (flavor): mirror wears pearl/silver,         */
/*  scopes wears its living teal, invent wears champagne/amber with    */
/*  a gyroscopic tilt, manifest wears opalescent violet/rose/turquoise */
/*  banded by latitude. Never mounted on Gathering, Codex, Book,       */
/*  Akashic or Music (directive §7 law).                               */
/*                                                                     */
/*  THE COOL LAWS: geometry is computed once per size and cached;      */
/*  density is capped; the frame gap is capped so a tab returning      */
/*  from the background never jumps; the loop STOPS when the orb is    */
/*  offscreen (IntersectionObserver), when the tab hides (visibility)  */
/*  and on unmount; stillness hands receive one painted frame and no   */
/*  loop at all. Transform-free — every frame repaints a ≤48px canvas. */
/* ------------------------------------------------------------------ */

export type OrbState =
  | "base"
  | "waiting"
  | "working"
  | "generating"
  | "retrying"
  | "error"
  | "complete";

export type OrbFlavor = "mirror" | "scopes" | "invent" | "manifest";

/* one motion vocabulary per state: yaw speed (rad/s), tilt wobble,
   glow breathing (1 = on), surge (the retry's rewind) */
const MOTION: Record<
  OrbState,
  { yaw: number; tiltAmp: number; breathe: boolean; surge: boolean }
> = {
  base: { yaw: 0.09, tiltAmp: 0.02, breathe: false, surge: false },
  waiting: { yaw: 0.1, tiltAmp: 0.03, breathe: false, surge: false },
  working: { yaw: 0.55, tiltAmp: 0.08, breathe: false, surge: false },
  generating: { yaw: 0.5, tiltAmp: 0.05, breathe: true, surge: false },
  retrying: { yaw: 0.6, tiltAmp: 0.06, breathe: false, surge: true },
  error: { yaw: 0.02, tiltAmp: 0.01, breathe: false, surge: false },
  complete: { yaw: 0.12, tiltAmp: 0.02, breathe: false, surge: false },
};

/* the rooms' own lights — dot ink at full depth, glow at the heart */
const FLAVORS: Record<
  OrbFlavor,
  { dot: [number, number, number]; glow: [number, number, number]; banded?: [number, number, number][] }
> = {
  mirror: { dot: [236, 240, 248], glow: [214, 222, 236] },
  scopes: { dot: [96, 172, 148], glow: [88, 158, 138] },
  invent: { dot: [206, 172, 104], glow: [188, 150, 84] },
  manifest: {
    dot: [172, 140, 200],
    glow: [150, 116, 184],
    banded: [
      [124, 150, 196], /* turquoise crown */
      [186, 132, 168], /* rose equator */
      [150, 118, 188], /* violet root */
    ],
  },
};

/* the golden angle's own lattice — the same seeds every render */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;
const MAX_DOTS = 96;

type Lattice = { pts: Float32Array; count: number };

/* the Fibonacci sphere, cached per dot count — the geometry is
   computed once and shared by every orb of that size class */
const latticeCache = new Map<number, Lattice>();
function lattice(size: number): Lattice {
  const count = size <= 24 ? 46 : size <= 36 ? 66 : MAX_DOTS;
  const cached = latticeCache.get(count);
  if (cached) return cached;
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * i) / (count - 1);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    pts[i * 3] = Math.cos(theta) * r;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = Math.sin(theta) * r;
  }
  const made = { pts, count };
  latticeCache.set(count, made);
  return made;
}

export function IntelligenceOrb({
  state = "base",
  flavor = "mirror",
  accent,
  size = 32,
  className,
}: {
  state?: OrbState;
  /** the room's own light — pearl, teal, champagne, opal */
  flavor?: OrbFlavor;
  /** a live accent (any CSS color the canvas can parse) that overrides
   * the flavor — the chat wears its room's own light through this hand */
  accent?: string;
  /** full diameter in px — inline 18–24, primary 32–48 (directive §7) */
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<OrbState>(state);
  /* the RAF loop reads the state through this ref — kept current in
     an effect, never during render (the refs law) */
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;

    const { pts, count } = lattice(size);
    /* the palette: a live accent (the room's own worn light) when given,
       the flavor's own otherwise. Any CSS color is accepted — invalid
       strings fall back to the flavor, so a var that never resolves
       can never darken the sphere. */
    const base = FLAVORS[flavor];
    let pal = base;
    if (accent) {
      ctx.fillStyle = "#000000"; /* sentinel */
      ctx.fillStyle = accent;
      const resolved = ctx.fillStyle;
      if (resolved !== "#000000") {
        let r = 0, g = 0, b = 0;
        if (resolved.startsWith("#")) {
          r = parseInt(resolved.slice(1, 3), 16);
          g = parseInt(resolved.slice(3, 5), 16);
          b = parseInt(resolved.slice(5, 7), 16);
        } else {
          const m = resolved.match(/rgba?\(([^)]+)\)/);
          if (m) {
            const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
            r = parts[0] | 0;
            g = parts[1] | 0;
            b = parts[2] | 0;
          }
        }
        if (r || g || b) pal = { dot: [r, g, b], glow: [r, g, b] };
      }
    }
    const motion = MOTION;

    let raf = 0;
    let running = false;
    let t = 0; /* the orb's own clock, seconds */
    let last: number | null = null;
    let yaw = 0;
    let speed = motion[stateRef.current].yaw; /* eased toward the state's own pace */

    const draw = (now: number) => {
      const s = motion[stateRef.current];
      /* frame gap capped at 100ms — background returns never jump */
      if (last === null) last = now;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t += dt;

      /* the yaw eases toward the state's own pace; the surge spins
         fast then rewinds every 3.2s (the retry's honest labor) */
      let target = s.yaw;
      if (s.surge) {
        const u = (t % 3.2) / 3.2;
        target = u < 0.62 ? 2.6 : u < 0.72 ? 2.6 * (1 - (u - 0.62) / 0.1) : u < 0.94 ? -1.5 * Math.sin(((u - 0.72) / 0.22) * Math.PI) : 0.6;
      }
      speed += (target - speed) * Math.min(1, dt * 6);
      yaw += speed * dt;

      const c = px / 2;
      const R = px * 0.34;
      ctx.clearRect(0, 0, px, px);

      /* the heart's glow — breathing only while words stream */
      const breathe = s.breathe ? 1 + 0.18 * Math.sin(t * 3.4) : 1;
      const glowR = R * (stateRef.current === "error" ? 1.15 : 1.7) * breathe;
      const [gr, gg, gb] = pal.glow;
      const glowAlpha = stateRef.current === "error" ? 0.16 : 0.3;
      const grad = ctx.createRadialGradient(c, c, 0, c, c, glowR);
      grad.addColorStop(0, `rgba(${gr},${gg},${gb},${glowAlpha})`);
      grad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c, c, glowR, 0, TAU);
      ctx.fill();

      /* the tilt wobble per state, then the dotted sphere */
      const tilt = Math.sin(t * 1.7) * s.tiltAmp;
      const sinT = Math.sin(tilt);
      const cosT = Math.cos(tilt);
      const dim = stateRef.current === "error" ? 0.4 : 1;
      const fov = 3.2;

      for (let i = 0; i < count; i++) {
        const x0 = pts[i * 3];
        const y0 = pts[i * 3 + 1];
        const z0 = pts[i * 3 + 2];
        /* yaw about the vertical axis, then the small tilt */
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const x1 = x0 * cosY - z0 * sinY;
        const z1 = x0 * sinY + z0 * cosY;
        const y1 = y0 * cosT - z1 * sinT;
        const z2 = y0 * sinT + z1 * cosT;
        /* perspective */
        const k = fov / (fov - z2);
        const sx = c + x1 * R * k;
        const sy = c + y1 * R * k;
        /* depth light: near dots bright and larger, far dots faint */
        const depth = (z2 + 1) / 2;
        const alpha = (0.16 + depth * 0.74) * dim;
        let [dr, dg, db] = pal.dot;
        if (pal.banded) {
          const band = y1 < -0.33 ? 0 : y1 < 0.33 ? 1 : 2;
          [dr, dg, db] = pal.banded[band];
        }
        ctx.fillStyle = `rgba(${dr},${dg},${db},${alpha.toFixed(3)})`;
        const r = Math.max(0.75, (px / 96) * (0.9 + depth * 1.5));
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, TAU);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = null;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    /* one painted frame for still hands — honest, no loop */
    if (reduced) {
      draw(performance.now());
    }

    /* THE VISIBILITY LAWS — the loop lives only while seen */
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (!reduced) start();
        } else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduced) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, flavor, accent]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-orb-state={state}
      data-orb-flavor={flavor}
      style={{ width: size, height: size }}
      className={cn("inline-block shrink-0", className)}
    />
  );
}

/* THE WORN LIGHT — an orb that wears whatever light its room already
   wears: it reads the inherited --scope-a from the cascade at mount
   (the scope dress paints it at the gate) and falls back to the
   flavor's own palette when no dress stands above it. This is the
   chat's per-turn thinking light (directive §7). */
export function WornAccentOrb({
  size = 18,
  state = "working",
  className,
}: {
  size?: number;
  state?: OrbState;
  className?: string;
}) {
  const [accent, setAccent] = useState<string | undefined>(undefined);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const v = getComputedStyle(el).getPropertyValue("--scope-a").trim();
    if (v) setAccent(v);
  }, []);
  return (
    <span ref={ref} className={cn("inline-flex shrink-0 items-center", className)}>
      <IntelligenceOrb state={state} accent={accent} size={size} />
    </span>
  );
}
