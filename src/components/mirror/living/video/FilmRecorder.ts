"use client";

/* ------------------------------------------------------------------ */
/*  THE FILM RECORDER — Mode A/B's assembly law (directive 03's        */
/*  Execute step, run on the visitor's own device).                    */
/*                                                                     */
/*  The storyboard's scenes are painted onto one canvas at 30fps;      */
/*  the narration plays in the same breath through the audio graph;    */
/*  the two streams are married by MediaRecorder into one honest       */
/*  file — mp4 where the browser speaks it, webm otherwise. Progress   */
/*  is real (elapsed against total), cancellation is immediate, and    */
/*  a scene whose generative clip could not be gathered is drawn by    */
/*  the house's own hand instead — never a hole in the film.           */
/* ------------------------------------------------------------------ */

import { drawFilmFrame } from "./SceneCanvas";
import type { VideoSceneSpec } from "@/lib/capabilities/types";

export interface RecordResult {
  blob: Blob;
  mime: string;
  durationSec: number;
}

export interface RecordOptions {
  scenes: VideoSceneSpec[];
  narrations: Map<string, ArrayBuffer>;
  clips: Map<string, string>;
  /** The canvas the film is painted on — pass the studio's own so the
   *  visitor watches the film being made; one is created otherwise. */
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  onProgress?: (percent: number, note: string) => void;
  isCancelled?: () => boolean;
}

const SCENE_MIN = 3.6;
const SCENE_PAD = 1.35;
const SCENE_MAX = 9.5;

/** Pick the best mime the browser honestly speaks. */
function pickMime(): string {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    try {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* keep looking */
    }
  }
  return "";
}

export async function recordFilm(opts: RecordOptions): Promise<RecordResult | null> {
  const scenes = opts.scenes;
  if (!scenes.length) return null;
  const W = opts.width ?? 960;
  const H = opts.height ?? 540;

  /* THE DETACHED LAW — the film is painted on a canvas that never
     enters the DOM: its frames flow whether the tab is visible,
     occluded, or backgrounded (an attached canvas borrows the
     compositor's clock, and the compositor sleeps when the page is
     unseen). The studio's own canvas, when given, receives a mirrored
     copy each frame — the visitor watches exactly what is recorded. */
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const mirror = opts.canvas ?? null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  /* the narration's own clock — each scene lasts its words + air */
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  const audioCtx = new AudioCtor();
  try {
    await audioCtx.resume();
  } catch {
    /* some browsers wake on their own */
  }

  const durations: number[] = [];
  const buffers: (AudioBuffer | null)[] = [];
  for (const scene of scenes) {
    const raw = opts.narrations.get(scene.id);
    let buf: AudioBuffer | null = null;
    if (raw) {
      try {
        buf = await audioCtx.decodeAudioData(raw.slice(0));
      } catch {
        buf = null;
      }
    }
    buffers.push(buf);
    const spoken = buf?.duration ?? 0;
    durations.push(Math.min(SCENE_MAX, Math.max(SCENE_MIN, spoken + SCENE_PAD)));
  }
  const total = durations.reduce((a, b) => a + b, 0);
  const starts: number[] = [];
  let acc = 0;
  for (const d of durations) {
    starts.push(acc);
    acc += d;
  }

  /* the generative clips — gathered to same-origin blobs when the sky allows */
  const clipEls = new Map<string, HTMLVideoElement>();
  for (const scene of scenes) {
    const url = opts.clips.get(scene.id);
    if (!url) continue;
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const blob = await res.blob();
      const el = document.createElement("video");
      el.src = URL.createObjectURL(blob);
      el.muted = true;
      el.playsInline = true;
      el.preload = "auto";
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        el.onloadeddata = done;
        el.onerror = () => resolve();
        window.setTimeout(done, 8000);
      });
      if (el.readyState >= 2) clipEls.set(scene.id, el);
    } catch {
      /* the drawn scene stands in */
    }
  }

  /* the audio graph — a bed of silence holds the track alive for the
     whole film (an idle audio track bends the recorded timeline when
     scenes fall silent), and the narration plays over it scene by
     scene. The visitor hears exactly what was spoken; the muxer keeps
     its honest clock. */
  const dest = audioCtx.createMediaStreamDestination();
  const startAt = audioCtx.currentTime + 0.35;
  const silence = audioCtx.createBuffer(
    1,
    Math.ceil((total + 0.8) * audioCtx.sampleRate),
    audioCtx.sampleRate
  );
  const bed = audioCtx.createBufferSource();
  bed.buffer = silence;
  bed.connect(dest);
  bed.start(startAt);

  /* the video stream */
  const stream = canvas.captureStream(30);
  for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);

  const mime = pickMime();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      ...(mime ? { mimeType: mime } : {}),
      videoBitsPerSecond: 2_600_000,
      audioBitsPerSecond: 96_000,
    });
  } catch {
    void audioCtx.close();
    return null;
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  recorder.onerror = (e) => {
    (window as unknown as Record<string, unknown>).__filmErr = String(
      (e as unknown as { error?: { name?: string } }).error?.name ?? "unknown"
    );
  };
  /* the film's own flight recorder — the truth of what happened,
     readable from the console when a film misbehaves */
  const diag = (window as unknown as Record<string, unknown>);
  diag.__film = { frames: 0, total, durations, tracksStart: stream.getTracks().map((t) => t.readyState), mime: recorder.mimeType };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
  });

  recorder.start(500);

  /* the narration, scheduled at each scene's own start */
  buffers.forEach((buf, i) => {
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(dest);
    src.start(startAt + starts[i]);
  });

  /* the frames — every scene drawn by the same hand that previews it.
     THE WALL-CLOCK LAW: the film is driven by a real timer, not by
     requestAnimationFrame — a throttled or hidden tab must never bend
     the film's own time (the muxer stamps frames by count, so the
     paint rate IS the film's clock). */
  const t0 = performance.now();
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      /* already resting */
    }
    for (const el of clipEls.values()) {
      el.pause();
      URL.revokeObjectURL(el.src);
    }
    void audioCtx.close().then(() => undefined);
  };

  await new Promise<void>((resolve) => {
    const paint = () => {
      const now = (performance.now() - t0) / 1000;
      if (opts.isCancelled?.()) {
        window.clearInterval(iv);
        stop();
        resolve();
        return;
      }
      if (now >= total + 0.4) {
        window.clearInterval(iv);
        stop();
        resolve();
        return;
      }
      /* which scene breathes now */
      let idx = 0;
      for (let i = 0; i < starts.length; i++) {
        if (now >= starts[i]) idx = i;
      }
      const scene = scenes[idx];
      const local = now - starts[idx];
      const p = Math.min(1, local / durations[idx]);
      const clip = clipEls.get(scene.id);
      if (clip) {
        /* the sky's own footage, fitted to the frame */
        if (clip.paused && clip.readyState >= 2) {
          clip.currentTime = Math.min(local % Math.max(0.1, clip.duration || 5), (clip.duration || 5) - 0.05);
          void clip.play().then(() => undefined).catch(() => undefined);
        }
        const vw = clip.videoWidth || W;
        const vh = clip.videoHeight || H;
        const scale = Math.max(W / vw, H / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.fillStyle = "#fbf7ee";
        ctx.fillRect(0, 0, W, H);
        try {
          ctx.drawImage(clip, (W - dw) / 2, (H - dh) / 2, dw, dh);
        } catch {
          drawFilmFrame(ctx, W, H, {
            template: scene.visual.template,
            heading: scene.heading,
            onScreenText: scene.onScreenText,
            labels: scene.visual.labels,
            accent: scene.visual.accent,
            t: local,
            p,
          });
        }
        /* the film's own caption over the footage */
        ctx.font = `italic 500 ${Math.round(H * 0.05)}px Georgia, serif`;
        ctx.fillStyle = "rgba(251,247,238,0.94)";
        ctx.strokeStyle = "rgba(30,24,12,0.55)";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.strokeText(scene.heading, W / 2, H * 0.9, W * 0.86);
        ctx.fillText(scene.heading, W / 2, H * 0.9, W * 0.86);
        ctx.textAlign = "left";
      } else {
        drawFilmFrame(ctx, W, H, {
          template: scene.visual.template,
          heading: scene.heading,
          onScreenText: scene.onScreenText,
          narration: scene.narration,
          labels: scene.visual.labels,
          accent: scene.visual.accent,
          t: local,
          p,
        });
      }
      const d = diag as { __film?: { frames: number } };
      if (d.__film) d.__film.frames += 1;
      if (mirror) {
        const mctx = mirror.getContext("2d");
        mctx?.drawImage(canvas, 0, 0);
      }
      const tNow = performance.now();
      if (tNow - lastReport > 250) {
        lastReport = tNow;
        opts.onProgress?.(
          Math.min(99, Math.round((now / total) * 100)),
          `Filming ${idx + 1}/${scenes.length} — ${scene.heading}`
        );
      }
    };
    let lastReport = 0;
    const iv = window.setInterval(paint, 33);
  });

  const blob = await finished;
  diag.__film = {
    ...(diag.__film as Record<string, unknown>),
    framesEnd: (diag.__film as { frames?: number })?.frames ?? 0,
    tracksEnd: stream.getTracks().map((t) => t.readyState),
    recState: recorder.state,
    blobSize: blob?.size ?? 0,
    chunks: chunks.length,
    err: diag.__filmErr ?? null,
  };
  if (opts.isCancelled?.()) return null;
  if (!blob || blob.size < 10_000) return null;
  return { blob, mime: blob.type || mime || "video/webm", durationSec: total };
}
