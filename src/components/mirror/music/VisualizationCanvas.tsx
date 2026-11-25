"use client";

/* ------------------------------------------------------------------ */
/*  THE VISUALIZATION CANVAS — the one rAF loop of the field.           */
/*                                                                      */
/*  It listens to the shared analyser (the ONE player's voice), folds   */
/*  the frequency bins into 32 bands, and hands the engine a frame.     */
/*  Laws: devicePixelRatio capped at 2, no per-frame allocations, the   */
/*  loop sleeps while the tab hides, and prefers-reduced-motion turns   */
/*  the whole field into a held still.                                  */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";
import {
  VisualizationEngine,
  presetById,
  type AudioFrame,
  type VizPreset,
} from "@/lib/audio/visualization-engine";
import { getPlayerAnalyser } from "@/lib/player-store";
import { useVizStore } from "./viz-store";

const BANDS = 32;

/** The reusable buffers — filled every frame, never reallocated. */
const freqBuf = new Uint8Array(1024);
const bands = new Float32Array(BANDS);

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function frameFromAnalyser(analyser: AnalyserNode, time: number): AudioFrame {
  analyser.getByteFrequencyData(freqBuf);
  /* 32 log-ish buckets across 1024 bins — the voice of the song */
  for (let b = 0; b < BANDS; b++) {
    const lo = Math.floor(Math.pow(b / BANDS, 1.7) * 700);
    const hi = Math.max(lo + 2, Math.floor(Math.pow((b + 1) / BANDS, 1.7) * 700));
    let sum = 0;
    for (let i = lo; i < hi && i < freqBuf.length; i++) sum += freqBuf[i];
    const v = sum / (hi - lo) / 255;
    bands[b] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  let bass = 0;
  for (let i = 0; i < 6; i++) bass += bands[i];
  bass /= 6;
  let mid = 0;
  for (let i = 6; i < 18; i++) mid += bands[i];
  mid /= 12;
  let treble = 0;
  for (let i = 18; i < BANDS; i++) treble += bands[i];
  treble /= BANDS - 18;
  let level = 0;
  for (let i = 0; i < 24; i++) level += bands[i];
  level = (level / 24) * 1.6;
  if (level > 1) level = 1;
  return { time, level, bass, mid, treble, bpm: null, bands };
}

interface Props {
  /** The active track's key — a change lets AUTO choose a fresh style. */
  trackKey?: string;
  className?: string;
  /** Sits behind content when true (a quiet aurora under the player). */
  decorative?: boolean;
  /** The style now wearing the field (AUTO picks — the panel labels it). */
  onPresetChange?: (preset: VizPreset) => void;
}

export default function VisualizationCanvas({ trackKey, className, decorative = false, onPresetChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VisualizationEngine | null>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const startRef = useRef(0);
  const trackKeyRef = useRef(trackKey);
  const pinnedRef = useRef<VizPreset | null>(null);
  const autoRef = useRef(true);
  const onPresetRef = useRef(onPresetChange);
  const lastPresetIdRef = useRef("");

  useEffect(() => {
    onPresetRef.current = onPresetChange;
  }, [onPresetChange]);

  /* the style choice — AUTO or a pinned preset from the shelf */
  const auto = useVizStore((s) => s.auto);
  const presetId = useVizStore((s) => s.presetId);
  const version = useVizStore((s) => s.version);

  useEffect(() => {
    autoRef.current = auto;
    pinnedRef.current = presetId ? presetById(presetId) : null;
  }, [auto, presetId, version]);

  useEffect(() => {
    trackKeyRef.current = trackKey;
  }, [trackKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = new VisualizationEngine(canvas, pinnedRef.current);
    engineRef.current = engine;
    if (!autoRef.current && pinnedRef.current) engine.setAuto(false);

    /* the DPR cap: sharp enough, cheap enough */
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(w, h);
      /* reduced motion: one held frame on every resize */
      if (reducedMotion()) {
        engine.step(0.016, null);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let hidden = document.visibilityState === "hidden";
    const onVisibility = () => {
      hidden = document.visibilityState === "hidden";
      if (!hidden && !reducedMotion()) {
        lastTimeRef.current = performance.now();
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;
      const t = (now - startRef.current) / 1000;

      const engineMod = engineRef.current;
      if (!engineMod) return;
      const analyser = getPlayerAnalyser();
      engineMod.noteTrackChange(trackKeyRef.current ?? "");
      if (autoRef.current) engineMod.setAuto(true);
      else if (pinnedRef.current) {
        engineMod.setAuto(false);
        engineMod.setPreset(pinnedRef.current);
      }
      const frame = analyser ? frameFromAnalyser(analyser, t) : null;
      engineMod.step(dt, frame);
      /* the style of the moment, reported once per change */
      const active = engineMod.activePreset;
      if (active.id !== lastPresetIdRef.current) {
        lastPresetIdRef.current = active.id;
        onPresetRef.current?.(active);
      }
    };
    const loop = (now: number) => {
      if (hidden || reducedMotion()) return;
      tick(now);
      rafRef.current = requestAnimationFrame(loop);
    };

    if (reducedMotion()) {
      /* the field holds one still frame — beauty without the motion */
      engine.step(0.016, null);
    } else {
      startRef.current = performance.now();
      lastTimeRef.current = startRef.current;
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={decorative ? { position: "absolute", inset: 0, pointerEvents: "none" } : undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
