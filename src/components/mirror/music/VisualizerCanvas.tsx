"use client";

/* ------------------------------------------------------------------ */
/*  THE VISUALIZER — the transmission made visible.                    */
/*                                                                     */
/*  Every frame reads REAL audio data through the shared AnalyserNode  */
/*  (Web Audio API) — bass-reactive bodies, mid-frequency motion,      */
/*  high-frequency sparkle, beat-synced pulses. Nothing here is        */
/*  random decoration.                                                 */
/*                                                                     */
/*  Performance law: one canvas, one rAF; frame rate capped on         */
/*  low-powered devices; rendering halts when hidden or closed;        */
/*  prefers-reduced-motion rests the motion entirely. Audio playback   */
/*  never depends on any of this — the player works when it is off.    */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import { getActiveAnalyser } from "@/lib/audio/analyser";

export const VISUALIZER_STYLES = [
  { id: "pearl-gold", name: "Pearl & Gold" },
  { id: "cosmic-purple", name: "Deep Cosmic" },
  { id: "minimal-wave", name: "Minimal Wave" },
  { id: "liquid-glass", name: "Liquid Glass" },
  { id: "neon-club", name: "Neon Club" },
  { id: "cinematic-particles", name: "Cinematic Particles" },
  { id: "organic-resonance", name: "Organic Resonance" },
] as const;

export type VisualizerStyle = (typeof VISUALIZER_STYLES)[number]["id"];

interface Props {
  style: VisualizerStyle;
  className?: string;
  /** dark backdrop beneath the art (canvas is transparent) */
  dark?: boolean;
}

const STYLE_COLORS: Record<VisualizerStyle, { a: string; b: string; glow: string; bg: [string, string] }> = {
  "pearl-gold": { a: "#d4b16a", b: "#f3e6c8", glow: "rgba(212,177,106,0.5)", bg: ["#171310", "#241d14"] },
  "cosmic-purple": { a: "#9a7bd8", b: "#d8c8f5", glow: "rgba(122,84,214,0.5)", bg: ["#120c1e", "#1e1430"] },
  "minimal-wave": { a: "#8a8a92", b: "#e6e6e2", glow: "rgba(138,138,146,0.3)", bg: ["#101011", "#1a1a1c"] },
  "liquid-glass": { a: "#7fd4c9", b: "#d8f5ef", glow: "rgba(127,212,201,0.45)", bg: ["#0a1514", "#12211f"] },
  "neon-club": { a: "#ff4d8f", b: "#5cf2ff", glow: "rgba(255,77,143,0.55)", bg: ["#0d0612", "#16081c"] },
  "cinematic-particles": { a: "#c9a25e", b: "#efe0c3", glow: "rgba(201,162,94,0.5)", bg: ["#0c0a08", "#171310"] },
  "organic-resonance": { a: "#8fbf7f", b: "#e2f2d8", glow: "rgba(143,191,127,0.45)", bg: ["#0c130a", "#141f10"] },
};

export default function VisualizerCanvas({ style, className, dark = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const styleRef = useRef(style);

  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower =
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      /Android|iPhone|iPad/i.test(navigator.userAgent);
    const maxFps = reduced ? 12 : lowPower ? 30 : 60;

    let raf = 0;
    let disposed = false;
    let lastFrame = 0;
    let bassSmooth = 0;
    let beatFlash = 0;
    let beatCooldown = 0;
    let phase = 0;

    /* the particle field — born once, moved by the music */
    const particleCount = lowPower ? 42 : 90;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0012,
      vy: -(0.0006 + Math.random() * 0.0012),
      r: 0.6 + Math.random() * 1.8,
      seed: i * 13.37,
    }));

    const freq = new Uint8Array(1024);
    const time = new Uint8Array(2048);

    const bands = () => {
      /* read the shared analyser — real frequency data of the ONE player */
      const analyser = getActiveAnalyser();
      if (!analyser) return { bass: 0, mid: 0, high: 0, beat: false, time };
      analyser.getByteFrequencyData(freq as Uint8Array<ArrayBuffer>);
      analyser.getByteTimeDomainData(time as Uint8Array<ArrayBuffer>);
      const bassAvg = avgOf(freq, 2, 28);
      const midAvg = avgOf(freq, 28, 220);
      const highAvg = avgOf(freq, 220, 900);
      /* beat detection: bass energy jump over its own smoothed floor */
      const beat =
        beatCooldown <= 0 &&
        bassAvg > 0.18 &&
        bassAvg > bassSmooth * 1.34 &&
        freq[0] > 90;
      return { bass: bassAvg, mid: midAvg, high: highAvg, beat, time };
    };

    function avgOf(arr: Uint8Array, from: number, to: number): number {
      let sum = 0;
      for (let i = from; i < to; i++) sum += arr[i];
      return sum / (to - from) / 255;
    }

    const draw = (ts: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (ts - lastFrame < 1000 / maxFps - 1) return;
      lastFrame = ts;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { bass, mid, high, beat, time } = bands();
      bassSmooth = bassSmooth * 0.92 + bass * 0.08;
      if (beat) {
        beatFlash = 1;
        beatCooldown = 0.18;
      }
      beatFlash = Math.max(0, beatFlash - 0.06);
      beatCooldown = Math.max(0, beatCooldown - 1 / maxFps);
      phase += 0.008 + mid * 0.05;

      const colors = STYLE_COLORS[styleRef.current] ?? STYLE_COLORS["pearl-gold"];
      if (reduced) {
        /* a still presence: soft radial glow only */
        paintBackground(ctx, w, h, colors.bg);
        ctx.globalAlpha = 0.55;
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.42);
        grad.addColorStop(0, colors.glow);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        return;
      }

      paintBackground(ctx, w, h, colors.bg);
      const cx = w / 2;
      const cy = h / 2;

      switch (styleRef.current) {
        case "pearl-gold":
          radialBars(ctx, cx, cy, w, h, bass, mid, high, colors, true);
          halo(ctx, cx, cy, 60 + bass * 150, colors.glow, beatFlash);
          break;
        case "cosmic-purple":
          radialBars(ctx, cx, cy, w, h, bass, mid, high, colors, false);
          halo(ctx, cx, cy, 70 + bass * 170, colors.glow, beatFlash * 0.8);
          particlesField(ctx, particles, w, h, mid, high, colors.b, 1);
          break;
        case "minimal-wave":
          waveformLine(ctx, w, cy, time, colors.b, 1.4 + bass * 2);
          break;
        case "liquid-glass":
          glassBlobs(ctx, cx, cy, w, h, bass, mid, phase, colors);
          break;
        case "neon-club":
          spectrumGrid(ctx, w, h, freq, colors, bass);
          break;
        case "cinematic-particles":
          particlesField(ctx, particles, w, h, mid, high, colors.a, 1.4);
          halo(ctx, cx, cy, 40 + bass * 200, colors.glow, beatFlash);
          break;
        case "organic-resonance":
          ripples(ctx, cx, cy, w, h, bass, mid, phase, colors);
          break;
      }
    };

    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ background: dark ? "#0e0c0a" : "transparent" }}
      aria-hidden="true"
      data-testid="visualizer-canvas"
    />
  );
}

/* ----------------------------- painters ----------------------------- */

function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, [top, bottom]: [string, string]) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function halo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  flash: number
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * (1 + flash * 0.35));
  grad.addColorStop(0, color);
  grad.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.35 + flash * 0.3;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + flash * 0.35), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function radialBars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bass: number,
  mid: number,
  high: number,
  colors: { a: string; b: string },
  mirror: boolean
) {
  const count = 72;
  const baseR = Math.min(w, h) * 0.16 + bass * Math.min(w, h) * 0.08;
  const maxLen = Math.min(w, h) * 0.3;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const bandEnergy =
      t < 0.25
        ? bass * (0.6 + Math.sin(i * 3.1) * 0.4)
        : t < 0.65
          ? mid * (0.5 + Math.sin(i * 2.3) * 0.5)
          : high * (0.4 + Math.sin(i * 4.7) * 0.6);
    const len = baseR * 0.25 + bandEnergy * maxLen;
    const angle = t * Math.PI * 2 + performance.now() * 0.00012;
    const x1 = cx + Math.cos(angle) * baseR;
    const y1 = cy + Math.sin(angle) * baseR;
    const x2 = cx + Math.cos(angle) * (baseR + len);
    const y2 = cy + Math.sin(angle) * (baseR + len);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, colors.a);
    grad.addColorStop(1, colors.b);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (mirror) {
      ctx.moveTo(cx - (x1 - cx), cy - (y1 - cy));
      ctx.lineTo(cx - (x2 - cx), cy - (y2 - cy));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function waveformLine(
  ctx: CanvasRenderingContext2D,
  w: number,
  cy: number,
  time: Uint8Array,
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  const step = Math.max(1, Math.floor(time.length / Math.min(w, 900)));
  let x = 0;
  for (let i = 0; i < time.length; i += step) {
    const v = (time[i] - 128) / 128;
    const y = cy + v * 64;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += w / (time.length / step);
  }
  ctx.stroke();
}

function glassBlobs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bass: number,
  mid: number,
  phase: number,
  colors: { a: string; b: string; glow: string }
) {
  const blobs = 5;
  for (let i = 0; i < blobs; i++) {
    const energy = i % 2 === 0 ? bass : mid;
    const r = Math.min(w, h) * (0.08 + energy * 0.22) * (1 + Math.sin(phase * 2 + i) * 0.12);
    const ox = cx + Math.cos(phase + (i * Math.PI * 2) / blobs) * w * 0.22;
    const oy = cy + Math.sin(phase * 1.3 + (i * Math.PI * 2) / blobs) * h * 0.2;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    grad.addColorStop(0, i % 2 === 0 ? colors.a : colors.b);
    grad.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function spectrumGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freq: Uint8Array,
  colors: { a: string; b: string },
  bass: number
) {
  const bars = 48;
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const v = freq[Math.floor((i / bars) * 320)] / 255;
    const bh = v * h * 0.7 + bass * 12;
    const grad = ctx.createLinearGradient(0, h - bh, 0, h);
    grad.addColorStop(0, colors.b);
    grad.addColorStop(1, colors.a);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    ctx.globalAlpha = 0.2;
    ctx.fillRect(i * bw + 1, h - bh - 3, bw - 2, 2);
  }
  ctx.globalAlpha = 1;
}

function particlesField(
  ctx: CanvasRenderingContext2D,
  particles: { x: number; y: number; vx: number; vy: number; r: number }[],
  w: number,
  h: number,
  mid: number,
  high: number,
  color: string,
  drive: number
) {
  ctx.fillStyle = color;
  for (const p of particles) {
    p.x += p.vx * (1 + mid * 6 * drive);
    p.y += p.vy * (1 + high * 10 * drive);
    if (p.y < -0.05) {
      p.y = 1.05;
      p.x = Math.random();
    }
    if (p.x < -0.05) p.x = 1.05;
    if (p.x > 1.05) p.x = -0.05;
    ctx.globalAlpha = 0.25 + high * 0.7;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.r * (1 + high * 1.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function ripples(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  bass: number,
  mid: number,
  phase: number,
  colors: { a: string; b: string }
) {
  const rings = 6;
  for (let i = 0; i < rings; i++) {
    const t = (phase * 0.6 + i / rings) % 1;
    const r = Math.min(w, h) * 0.08 + t * Math.min(w, h) * 0.44 * (0.6 + bass);
    ctx.strokeStyle = i % 2 === 0 ? colors.a : colors.b;
    ctx.globalAlpha = (1 - t) * (0.28 + mid * 0.5);
    ctx.lineWidth = 1.6 + (1 - t) * 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
