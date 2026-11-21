"use client";

/* ------------------------------------------------------------------ */
/*  THE SHARED EAR — one AnalyserNode for the house's own player.      */
/*                                                                     */
/*  Music Engine 2.0 law: the visualizer reads REAL audio data, but    */
/*  the analysis must never own the audio. The element stays the       */
/*  master; this module only clips a listening tap onto it. A          */
/*  suspended AudioContext would stall the element's own clock (the    */
/*  sound is rerouted through the context), so every play wakes it.    */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let attachedEl: HTMLAudioElement | null = null;

export function getActiveAnalyser(): AnalyserNode | null {
  return analyser;
}

/** Clip the listening tap onto the player's element — once per element.
    Safe to call on every render; only the first call builds the graph. */
export function attachPlayerAnalyser(el: HTMLAudioElement | null): void {
  if (!el || typeof window === "undefined") return;
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
  if (attachedEl === el && analyser) return;
  if (attachedEl === el) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    /* an element's sound can only be routed through ONE context graph
       in its lifetime — the same context is reused for every element */
    const source = ctx.createMediaElementSource(el);
    const node = ctx.createAnalyser();
    node.fftSize = 2048;
    node.smoothingTimeConstant = 0.82;
    source.connect(node);
    node.connect(ctx.destination);
    analyser = node;
    attachedEl = el;
    void ctx.resume().catch(() => undefined);
    /* the clock's law — every play wakes the context */
    el.addEventListener("play", () => {
      if (ctx && ctx.state === "suspended") {
        void ctx.resume().catch(() => undefined);
      }
    });
  } catch {
    /* analysis is a luxury — playback never depends on it */
  }
}
