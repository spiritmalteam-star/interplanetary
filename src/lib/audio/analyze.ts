"use client";

/* ------------------------------------------------------------------ */
/*  THE AUDIO QA PIPELINE — the chamber's listening ear.               */
/*                                                                     */
/*  The generated file is decoded with the browser's own decoder and   */
/*  measured honestly: silence and dropouts, clipping and peaks,       */
/*  loudness (approximate LUFS), and sample discontinuities.           */
/*                                                                     */
/*  Law of effects: intentional distortion belongs to the music —      */
/*  glitch, industrial, gabber, metal and their kin are judged with    */
/*  tolerance, never "corrected" into blandness. A severely defective  */
/*  render is flagged for regeneration, not aggressively filtered.     */
/* ------------------------------------------------------------------ */

export interface QualityCheck {
  id: string;
  label: string;
  severity: "ok" | "warn" | "fail" | "info";
  detail: string;
}

export interface QualityReport {
  verdict: "pass" | "warn" | "fail" | "unknown";
  checks: QualityCheck[];
  measuredAt: string;
  sampleRate: number | null;
  channels: number | null;
  durationSec: number | null;
  peak: number | null;
  lufsApprox: number | null;
  clippingRatio: number | null;
}

interface AnalyzeOpts {
  effectsTolerant?: boolean; // glitch/industrial/metal kin — distortion is music
  durationLimitSec?: number; // expected max duration (provider capability)
}

async function decode(url: string): Promise<AudioBuffer | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    try {
      return await ctx.decodeAudioData(buf);
    } finally {
      void ctx.close().catch(() => undefined);
    }
  } catch {
    return null;
  }
}

export async function analyzeTrackAudio(
  url: string,
  opts: AnalyzeOpts = {}
): Promise<QualityReport> {
  const buffer = await decode(url);
  const now = new Date().toISOString();
  if (!buffer) {
    return {
      verdict: "unknown",
      checks: [
        {
          id: "decode",
          label: "Decode",
          severity: "info",
          detail: "The file could not be decoded in this browser — playback still works.",
        },
      ],
      measuredAt: now,
      sampleRate: null,
      channels: null,
      durationSec: null,
      peak: null,
      lufsApprox: null,
      clippingRatio: null,
    };
  }

  const checks: QualityCheck[] = [];
  const sr = buffer.sampleRate;
  const ch = buffer.numberOfChannels;
  const dur = buffer.duration;

  /* mono view (max across channels) for silence/peak analysis */
  const n = buffer.length;
  const mono = new Float32Array(n);
  for (let c = 0; c < ch; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < n; i++) {
      const v = data[i];
      if (v > mono[i] || -v > mono[i]) mono[i] = v;
    }
  }

  /* -------- peak & clipping -------- */
  let peak = 0;
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.abs(mono[i]);
    if (a > peak) peak = a;
    if (a >= 0.999) clipped++;
  }
  const clippingRatio = clipped / n;
  if (clippingRatio > 0.003 && !opts.effectsTolerant) {
    checks.push({
      id: "clipping",
      label: "Clipping",
      severity: clippingRatio > 0.01 ? "fail" : "warn",
      detail: `${(clippingRatio * 100).toFixed(2)}% of samples sit at the digital ceiling — a remaster would help this render.`,
    });
  } else if (clippingRatio > 0.003 && opts.effectsTolerant) {
    checks.push({
      id: "clipping",
      label: "Saturation",
      severity: "info",
      detail: "Heavy saturation detected — kept as the intentional color of this genre.",
    });
  } else {
    checks.push({ id: "clipping", label: "Clipping", severity: "ok", detail: "Peaks stay under the ceiling." });
  }

  /* -------- silence: lead-in / tail / internal dropouts -------- */
  const silenceFloor = 0.004; // ~ -48 dBFS
  let lead = 0;
  while (lead < n && mono[lead] < silenceFloor) lead++;
  let tail = 0;
  while (tail < n && mono[n - 1 - tail] < silenceFloor) tail++;
  const leadSec = lead / sr;
  const tailSec = tail / sr;
  if (leadSec > 3.5) {
    checks.push({
      id: "lead-silence",
      label: "Lead-in silence",
      severity: leadSec > 8 ? "warn" : "info",
      detail: `The music begins after ${leadSec.toFixed(1)}s of silence.`,
    });
  }
  if (tailSec > 3.5) {
    checks.push({
      id: "tail-silence",
      label: "Tail silence",
      severity: tailSec > 10 ? "warn" : "info",
      detail: `The music ends ${tailSec.toFixed(1)}s before the file does.`,
    });
  }
  /* internal dropouts — windows of ≥1.5s of near-silence, ignoring the ends */
  const win = Math.floor(sr * 0.25);
  let silentRun = 0;
  let dropouts = 0;
  const startGuard = Math.max(lead + sr, Math.floor(n * 0.05));
  const endGuard = Math.min(n - Math.max(tail + sr, Math.floor(n * 0.05)), n);
  for (let i = startGuard; i < endGuard; i += win) {
    let sum = 0;
    for (let j = i; j < Math.min(i + win, n); j++) sum += mono[j] * mono[j];
    const rms = Math.sqrt(sum / win);
    if (rms < silenceFloor) silentRun += 0.25;
    else silentRun = 0;
    if (silentRun >= 1.5) {
      dropouts++;
      silentRun = 0;
    }
  }
  if (dropouts > 0) {
    checks.push({
      id: "dropouts",
      label: "Dropouts",
      severity: dropouts >= 2 ? "fail" : "warn",
      detail: `${dropouts} unexplained silence window${dropouts > 1 ? "s" : ""} inside the music.`,
    });
  } else {
    checks.push({ id: "dropouts", label: "Dropouts", severity: "ok", detail: "No unexplained silences inside the music." });
  }

  /* -------- loudness (approximate integrated LUFS, gated RMS) -------- */
  let sumSq = 0;
  let count = 0;
  const block = Math.floor(sr * 0.4);
  for (let i = 0; i + block <= n; i += block) {
    let sq = 0;
    for (let j = i; j < i + block; j++) sq += mono[j] * mono[j];
    sumSq += sq;
    count += block;
  }
  const rmsOverall = count > 0 ? Math.sqrt(sumSq / count) : 0;
  /* a rough K-weighting-ish translation: RMS dBFS − ~1 dB */
  const lufsApprox = rmsOverall > 0 ? 20 * Math.log10(rmsOverall) - 1 : -Infinity;
  if (lufsApprox > -40) {
    const tooQuiet = lufsApprox < -30;
    const tooLoud = lufsApprox > -8;
    checks.push({
      id: "loudness",
      label: "Loudness",
      severity: tooQuiet || tooLoud ? "warn" : "ok",
      detail: tooQuiet
        ? `The render sits very quietly (~${lufsApprox.toFixed(0)} LUFS).`
        : tooLoud
          ? `The render is very hot (~${lufsApprox.toFixed(0)} LUFS) — pumping is possible.`
          : `Integrated loudness ≈ ${lufsApprox.toFixed(0)} LUFS — a healthy range.`,
    });
  }

  /* -------- discontinuities (digital cracks) -------- */
  let cracks = 0;
  const hop = Math.max(64, Math.floor(sr / 2000));
  for (let i = hop; i < n; i += hop) {
    const d = Math.abs(mono[i] - mono[i - 1]);
    if (d > 0.9) cracks++;
  }
  /* a handful of cracks is percussion; a storm of them is corruption */
  if (cracks > Math.max(20, (dur / 60) * 60) && !opts.effectsTolerant) {
    checks.push({
      id: "discontinuity",
      label: "Discontinuities",
      severity: cracks > (dur / 60) * 200 ? "fail" : "warn",
      detail: `${cracks} hard sample jumps detected — possible corrupted frames.`,
    });
  }

  /* -------- duration sanity -------- */
  if (opts.durationLimitSec && dur > opts.durationLimitSec + 45) {
    checks.push({
      id: "duration",
      label: "Duration",
      severity: "warn",
      detail: `The render runs ${(dur / 60).toFixed(1)} min — longer than the engine's usual promise.`,
    });
  }

  checks.push({
    id: "format",
    label: "Format",
    severity: sr >= 44100 ? "ok" : "warn",
    detail: `${sr >= 44100 ? "Studio-grade" : "Low"} sample rate ${(sr / 1000).toFixed(1)} kHz · ${ch === 1 ? "mono" : "stereo"} · ${dur.toFixed(1)}s`,
  });

  const verdict: QualityReport["verdict"] = checks.some((c) => c.severity === "fail")
    ? "fail"
    : checks.some((c) => c.severity === "warn")
      ? "warn"
      : "pass";

  return {
    verdict,
    checks,
    measuredAt: now,
    sampleRate: sr,
    channels: ch,
    durationSec: dur,
    peak: Math.round(peak * 1000) / 1000,
    lufsApprox: Number.isFinite(lufsApprox) ? Math.round(lufsApprox * 10) / 10 : null,
    clippingRatio: Math.round(clippingRatio * 1e6) / 1e6,
  };
}

/* ------------------- estimated karaoke timing ------------------------ */
/*  Line timing is DISTRIBUTED honestly: weighted by syllable count,    */
/*  stretched across the measured duration, and always labeled          */
/*  "estimated" until the visitor stamps real timings by hand.          */
/*  Never displayed as accurate.                                        */

export function estimateSync(
  lyrics: string,
  durationSec: number
): { level: "estimated" | "manual"; lines: { text: string; start: number; end: number }[] } {
  const rawLines = lyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l)); // [Verse]/[Chorus] markers never sing

  if (rawLines.length === 0 || durationSec <= 0) {
    return { level: "estimated", lines: [] };
  }

  const weight = (line: string): number => {
    const vowels = (line.match(/[aeiouyàáâãäåèéêëìíîïòóôõöùúûüæœøAEIOUY]/g) ?? []).length;
    return Math.max(2, line.length * 0.55 + vowels * 1.6);
  };
  const weights = rawLines.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);

  /* the song breathes before the first line and after the last — 6% each */
  const usable = durationSec * 0.88;
  const leadIn = durationSec * 0.06;

  let t = leadIn;
  const lines = rawLines.map((text, i) => {
    const span = (weights[i] / total) * usable;
    const start = t;
    const end = t + span;
    t = end;
    return { text, start, end };
  });
  return { level: "estimated", lines };
}
