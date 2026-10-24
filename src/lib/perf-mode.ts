"use client";

/* ------------------------------------------------------------------ */
/*  AUTOMATIC PERFORMANCE MODE — the house dresses for the room.       */
/*                                                                     */
/*  High-capability devices receive the full living presentation;      */
/*  weaker ones receive the lightweight alternatives automatically —   */
/*  while every interaction, every word and every creation tool stays  */
/*  exactly as reachable as before (protocol 8). Text readability and  */
/*  necessary functions are never reduced; only the expensive          */
/*  decoration bends.                                                  */
/*                                                                     */
/*  The tier is computed once from the device's own honest signals —   */
/*  the visitor never configures anything. `prefers-reduced-motion`    */
/*  keeps its own separate law (the stronger one): it silences         */
/*  animation entirely, while a tier only lightens it.                 */
/* ------------------------------------------------------------------ */

import { create } from "zustand";

export type PerfTier = "high" | "balanced" | "eco";

interface PerfState {
  tier: PerfTier;
  reducedMotion: boolean;
}

function compute(): PerfState {
  if (typeof window === "undefined") return { tier: "high", reducedMotion: false };
  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    /* quiet */
  }
  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
    const saveData = nav.connection?.saveData === true;
    /* data-saver visitors and small machines take the light path;
       generous machines take the full one; the rest walk balanced */
    if (saveData || cores <= 4 || (mem !== undefined && mem <= 4)) {
      return { tier: "eco", reducedMotion: reduced };
    }
    if (cores >= 8 && (mem === undefined || mem >= 8)) {
      return { tier: "high", reducedMotion: reduced };
    }
    return { tier: "balanced", reducedMotion: reduced };
  } catch {
    return { tier: "balanced", reducedMotion: reduced };
  }
}

export const usePerfMode = create<PerfState>()(compute);

/** One imperative read for non-reactive spots (effects, engines). */
export function perfTier(): PerfTier {
  return usePerfMode.getState().tier;
}

export function perfEco(): boolean {
  return usePerfMode.getState().tier === "eco";
}

export function perfReducedMotion(): boolean {
  return usePerfMode.getState().reducedMotion;
}

/** A data attribute on the root — the CSS's own honest signal, so
    stylesheets can dress the eco room without re-rendering React. */
export function applyPerfAttribute(): void {
  if (typeof document === "undefined") return;
  const { tier } = usePerfMode.getState();
  if (tier === "eco") document.documentElement.dataset.perf = "eco";
  else if (tier === "high") document.documentElement.dataset.perf = "high";
  else delete document.documentElement.dataset.perf;
}
