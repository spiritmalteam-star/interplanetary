"use client";

/* ------------------------------------------------------------------ */
/*  THE ONE VOICE — ReflectMe's authoritative music player.            */
/*                                                                     */
/*  Music Engine 2.0 law: ONE audio element, ONE store, everywhere.    */
/*  The chamber, the karaoke stage, the visualizer and The Gathering   */
/*  shelf all read this same clock — never a competing instance.       */
/*                                                                     */
/*  The <audio> element is created lazily in the browser and lives     */
/*  outside React, so playback continues while views switch. Karaoke   */
/*  reads `time` (the element's own clock — seek, pause, resume and    */
/*  playbackRate changes can never accumulate drift).                  */
/* ------------------------------------------------------------------ */

import { create } from "zustand";
import type { LcTrack, LcSync } from "@/lib/data/light-codes";

export type RepeatMode = "off" | "one" | "all";

interface PlayerState {
  track: LcTrack | null;
  playing: boolean;
  time: number;
  duration: number;
  volume: number; // 0..1
  speed: number; // 0.5..2
  repeat: RepeatMode;
  muted: boolean;
  loading: boolean;
  queue: LcTrack[];
  /* actions */
  playTrack: (track: LcTrack, queue?: LcTrack[]) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  nudge: (delta: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setSpeed: (s: number) => void;
  cycleRepeat: () => void;
  /** Sets the repeat mode directly — the chamber's loop chip and any
      other surface choose "one" | "all" | "off" without cycling. */
  setRepeat: (mode: RepeatMode) => void;
  playFromQueue: (id: string) => void;
  next: () => void;
  prev: () => void;
  close: () => void;
}

/* ------------------------- the element ------------------------------ */

let el: HTMLAudioElement | null = null;
let analyserRef: AnalyserNode | null = null;
let audioCtx: AudioContext | null = null;

function element(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "metadata";
    el.crossOrigin = "anonymous";
    wire();
    /* a quiet handle for the chamber's own diagnostics — playback
       never depends on it, but a silent failure must never stay silent */
    (window as unknown as { __reflectmeAudio?: HTMLAudioElement }).__reflectmeAudio = el;
  }
  return el;
}

/** The shared analyser — one AnalyserNode for every visualizer view.
    Returns null until the element exists and the source is attached. */
export function getPlayerAnalyser(): AnalyserNode | null {
  return analyserRef;
}

function wire() {
  const audio = el;
  if (!audio) return;
  const st = usePlayerStore.getState();
  const sync = () => usePlayerStore.setState({ time: audio.currentTime });
  audio.addEventListener("timeupdate", sync);
  /* rAF-driven clock: timeupdate alone can stutter karaoke on slow devices */
  let raf = 0;
  const tick = () => {
    if (!audio.paused) usePlayerStore.setState({ time: audio.currentTime });
    raf = requestAnimationFrame(tick);
  };
  audio.addEventListener("play", () => {
    usePlayerStore.setState({ playing: true });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    /* THE CLOCK'S LAW — a suspended AudioContext stalls the element's
       own clock (the analyser reroutes its sound). Every play wakes it. */
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume().catch(() => undefined);
    }
  });
  audio.addEventListener("pause", () => {
    usePlayerStore.setState({ playing: false });
    cancelAnimationFrame(raf);
    raf = 0;
  });
  audio.addEventListener("loadedmetadata", () => {
    if (Number.isFinite(audio.duration)) {
      usePlayerStore.setState({ duration: audio.duration, loading: false });
    }
  });
  audio.addEventListener("waiting", () => usePlayerStore.setState({ loading: true }));
  audio.addEventListener("playing", () => usePlayerStore.setState({ loading: false }));
  audio.addEventListener("canplay", () => usePlayerStore.setState({ loading: false }));
  audio.addEventListener("ended", () => {
    const s = usePlayerStore.getState();
    if (s.repeat === "one") {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
      return;
    }
    if (s.repeat === "all" && s.queue.length > 1) {
      s.next();
      return;
    }
    usePlayerStore.setState({ playing: false });
  });
  audio.volume = st.volume;
  audio.playbackRate = st.speed;
  void st;
}

/* ------------------------- narration courtesy ----------------------- */
/*  When a spoken voice (room narration) takes the air, the music       */
/*  bows out — one voice at a time, by design.                          */
export const PAUSE_MUSIC_EVENT = "reflectme:pause-music";

/* --------------------------- the store ------------------------------ */

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  track: null,
  playing: false,
  time: 0,
  duration: 0,
  volume: 1,
  speed: 1,
  repeat: "off" as RepeatMode,
  muted: false,
  loading: false,
  queue: [],

  playTrack: (track, queue) => {
    const audio = element();
    if (!audio) return;
    const s = get();
    const sameTrack = s.track?.audioUrl === track.audioUrl && s.track?.audioUrl;
    set({
      track,
      time: sameTrack ? s.time : 0,
      duration: track.duration ?? (sameTrack ? s.duration : 0),
      loading: !sameTrack,
      queue: queue ?? (s.track ? [s.track, ...s.queue.filter((q) => q.audioUrl !== s.track!.audioUrl)].slice(0, 20) : s.queue),
    });
    if (track.audioUrl && s.track?.audioUrl !== track.audioUrl) {
      audio.src = track.audioUrl;
      audio.currentTime = 0;
    }
    audio.playbackRate = get().speed;
    audio.volume = get().muted ? 0 : get().volume;
    void audio.play().catch(() => undefined);
    ensureAnalyser();
  },

  toggle: () => {
    const audio = element();
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  },

  pause: () => {
    const audio = element();
    if (!audio) return;
    audio.pause();
  },

  resume: () => {
    const audio = element();
    if (!audio) return;
    void audio.play().catch(() => undefined);
  },

  seek: (seconds) => {
    const audio = element();
    if (!audio) return;
    const dur = get().duration || audio.duration || 0;
    audio.currentTime = Math.min(Math.max(0, seconds), dur || seconds);
    usePlayerStore.setState({ time: audio.currentTime });
  },

  nudge: (delta) => get().seek(get().time + delta),

  setVolume: (v) => {
    const audio = element();
    const vol = Math.min(1, Math.max(0, v));
    set({ volume: vol, muted: vol === 0 });
    if (audio) audio.volume = vol;
  },

  setMuted: (m) => {
    const audio = element();
    set({ muted: m });
    if (audio) audio.volume = m ? 0 : get().volume;
  },

  setSpeed: (s) => {
    const audio = element();
    const speed = Math.min(2, Math.max(0.5, Math.round(s * 4) / 4));
    set({ speed });
    if (audio) audio.playbackRate = speed;
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const next = order[(order.indexOf(get().repeat) + 1) % order.length];
    set({ repeat: next });
  },

  setRepeat: (mode) => set({ repeat: mode }),

  playFromQueue: (id) => {
    const hit = get().queue.find((q) => q.id === id);
    if (hit) get().playTrack(hit, get().queue);
  },

  next: () => {
    const { queue, track } = get();
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((q) => q.audioUrl === track.audioUrl);
    const nextTrack = queue[(idx + 1) % queue.length];
    if (nextTrack) get().playTrack(nextTrack, queue);
  },

  prev: () => {
    const { queue, track, time } = get();
    if (time > 3) {
      get().seek(0);
      return;
    }
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((q) => q.audioUrl === track.audioUrl);
    const prevTrack = queue[(idx - 1 + queue.length) % queue.length];
    if (prevTrack) get().playTrack(prevTrack, queue);
  },

  close: () => {
    const audio = element();
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    set({ track: null, playing: false, time: 0, duration: 0, queue: [] });
  },
}));

/* --------------------- the analyser attachment ----------------------- */

function ensureAnalyser() {
  const audio = el;
  if (!audio) return;
  /* the context wakes with its birth gesture — and every play after */
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => undefined);
  }
  if (analyserRef) return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef = analyser;
    audioCtx = ctx;
    void ctx.resume().catch(() => undefined);
  } catch {
    /* analysis is a luxury — playback never depends on it */
  }
}

/* ---------- the pause-music courtesy, wired once per page ---------- */
if (typeof window !== "undefined") {
  window.addEventListener(PAUSE_MUSIC_EVENT, () => {
    const audio = el;
    if (audio && !audio.paused) audio.pause();
  });
}
