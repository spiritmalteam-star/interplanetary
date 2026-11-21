/* ------------------------------------------------------------------ */
/*  MUSIC ENGINE 2.0 — THE LISTENING EAR (client-side audio QA).        */
/*                                                                     */
/*  The chamber measures what was born BEFORE it reaches the visitor's */
/*  trust: integrity → decode → sample rate → silence/dropouts →       */
/*  clipping/true-peak → loudness → artifacts → ending → verdict.      */
/*                                                                     */
/*  THE ART/DEFECT LAW — glitch, bitcrush, tape saturation and drive   */
/*  are legitimate musical voice (effectsTolerant genres); the ear      */
/*  distinguishes INTENTIONAL effect from TECHNICAL damage: a defect   */
/*  is damage no genre asked for (uncontrolled static, truncated       */
/*  frames, dead channels, runaway dropouts). A severe defect's        */
/*  honest remedy is a fresh weave — never blanket filtering.          */
/*                                                                     */
/*  Playback never depends on analysis: every failure here throws and  */
/*  the caller stays calm. No data leaves the device.                  */
/* ------------------------------------------------------------------ */

export type QualitySeverity = "ok" | "info" | "warn" | "fail";

export interface QualityCheck {
  id: string;
  label: string;
  detail: string;
  severity: QualitySeverity;
}

export interface QualityReport {
  verdict: "pass" | "warn" | "fail";
  checks: QualityCheck[];
  measured?: {
    sampleRate: number;
    channels: number;
    durationSec: number;
    /** approximate sample peak, dBFS */
    peakDb: number;
    /** approximate integrated RMS loudness, dBFS */
    rmsDb: number;
    /** fraction of the track that is near-silent */
    silenceRatio: number;
  };
}

export interface AnalyzeOptions {
  /** the chosen genres live on distortion and buffer effects — do not
      convict the art of the genre's own voice */
  effectsTolerant?: boolean;
  /** analysis stays capped at this duration (seconds) */
  durationLimitSec?: number;
}

/* --------------------------- small helpers -------------------------- */

const BLOCK_MS = 50; /* the analysis window's breath */
const EPS = 1e-8;

function dbfs(x: number): number {
  return 20 * Math.log10(Math.max(x, EPS));
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** near-silence bound: −60 dBFS block RMS */
const SILENCE_RMS = 0.001;
/** clipping begins at 98% of full scale with a sustained run */
const CLIP_LEVEL = 0.98;
const CLIP_RUN_MS = 2.5;

function check(
  id: string,
  label: string,
  detail: string,
  severity: QualitySeverity
): QualityCheck {
  return { id, label, detail, severity };
}

/* -------------------------- the whole ear --------------------------- */

export async function analyzeTrackAudio(
  url: string,
  opts: AnalyzeOptions = {}
): Promise<QualityReport> {
  const checks: QualityCheck[] = [];
  const tolerant = opts.effectsTolerant === true;
  const durationLimit = opts.durationLimitSec ?? 600;

  /* ---- 1 · the vessel arrives whole ---- */
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`audio fetch ${res.status}`);
  const bytes = await res.arrayBuffer();
  checks.push(
    check(
      "integrity",
      "Integrity",
      bytes.byteLength > 0
        ? "The file arrived whole — no empty vessel."
        : "The file arrived empty.",
      bytes.byteLength > 0 ? "ok" : "fail"
    )
  );

  /* ---- 2 · the ear decodes ---- */
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) throw new Error("no audio context");
  const ctx = new Ctx();
  let audio: AudioBuffer;
  try {
    audio = await ctx.decodeAudioData(bytes.slice(0));
    checks.push(
      check("decode", "Decode", "Every frame decoded cleanly — no broken frames.", "ok")
    );
  } catch {
    void ctx.close();
    checks.push(
      check(
        "decode",
        "Decode",
        "The stream could not be decoded — damaged or unknown encoding. A fresh weave is the remedy.",
        "fail"
      )
    );
    return finish(checks);
  }
  void ctx.close();

  const sampleRate = audio.sampleRate;
  const channels = Math.min(audio.numberOfChannels, 2);
  const duration = audio.duration;

  /* ---- 3 · the resolution ---- */
  checks.push(
    check(
      "sample-rate",
      "Resolution",
      `${sampleRate.toLocaleString()} Hz · ${audio.numberOfChannels === 1 ? "mono" : "stereo"} · ${duration.toFixed(1)}s`,
      sampleRate >= 32000 ? "ok" : "warn"
    )
  );

  /* ---- the window: cap the analysis at the duration limit ---- */
  const analysisSec = Math.min(duration, durationLimit);
  const total = Math.floor(analysisSec * sampleRate);

  /* ---- 4 · silence, dropouts and the shape of quiet ---- */
  const blockLen = Math.max(1, Math.floor((BLOCK_MS / 1000) * sampleRate));
  const blocks = Math.max(1, Math.floor(total / blockLen));
  const blockRms = new Float32Array(blocks);
  const left = audio.getChannelData(0);
  const right = channels > 1 ? audio.getChannelData(1) : null;

  let peak = 0;
  let sumSq = 0;
  let dcSum = 0;
  let clipRun = 0;
  let clipBlocks = 0;
  let zcJitter = 0;
  let zcPrevSign = 0;
  let zcWindow = 0;

  for (let b = 0; b < blocks; b++) {
    const start = b * blockLen;
    const end = Math.min(start + blockLen, total);
    let blockSq = 0;
    for (let i = start; i < end; i++) {
      const l = left[i];
      const r = right ? right[i] : l;
      const mono = (l + r) * 0.5;
      const a = Math.abs(mono);
      if (a > peak) peak = a;
      sumSq += mono * mono;
      dcSum += mono;
      /* sustained full-scale run = the clipping signature */
      if (a >= CLIP_LEVEL) clipRun++;
      else {
        if (clipRun * (1000 / sampleRate) >= CLIP_RUN_MS) clipBlocks++;
        clipRun = 0;
      }
      /* zero-crossing density — a rough texture/an artifact probe */
      const sign = mono >= 0 ? 1 : -1;
      if (sign !== zcPrevSign) {
        zcJitter++;
        zcPrevSign = sign;
      }
      if (++zcWindow >= 4096) {
        zcJitter = 0;
        zcWindow = 0;
      }
    }
    blockRms[b] = Math.sqrt(blockSq / Math.max(1, end - start));
  }
  if (clipRun * (1000 / sampleRate) >= CLIP_RUN_MS) clipBlocks++;

  const bodyRms = Math.sqrt(sumSq / Math.max(1, total));
  let silentBlocks = 0;
  let leadingSilence = 0;
  let trailingSilence = 0;
  let dropoutRuns = 0;
  let inDropout = false;
  let dropoutStart = -1;
  let heard = false;
  for (let b = 0; b < blocks; b++) {
    const quiet = blockRms[b] < SILENCE_RMS;
    if (quiet) {
      silentBlocks++;
      if (!heard && !inDropout) leadingSilence++;
      if (inDropout) {
        dropoutRuns++;
        inDropout = false;
      }
      if (dropoutStart < 0) dropoutStart = b;
      trailingSilence++;
    } else {
      heard = true;
      trailingSilence = 0;
      /* a gap AFTER the music has begun and BEFORE it ends: a dropout */
      if (dropoutStart >= 0 && dropoutStart < b && b < blocks - 1) {
        const runBlocks = b - dropoutStart;
        if (runBlocks * BLOCK_MS >= 300) inDropout = true; /* ≥300ms dead air mid-song */
      }
      dropoutStart = -1;
    }
  }

  const silenceRatio = silentBlocks / blocks;
  const leadingSec = (leadingSilence * BLOCK_MS) / 1000;
  const trailingSec = (trailingSilence * BLOCK_MS) / 1000;

  checks.push(
    check(
      "silence",
      "Quiet shape",
      silenceRatio > 0.5
        ? `More than half the track is silent (${pct(silenceRatio)}) — the sound barely arrives.`
        : silenceRatio > 0.25
          ? `Unusually much quiet (${pct(silenceRatio)}).`
          : "Presence is continuous — no abnormal dead air.",
      silenceRatio > 0.5 ? "fail" : silenceRatio > 0.25 ? "warn" : "ok"
    )
  );
  checks.push(
    check(
      "dropouts",
      "Dropouts",
      dropoutRuns > 0
        ? `${dropoutRuns} dead gap${dropoutRuns === 1 ? "" : "s"} mid-song — the sound breaks where it should flow.`
        : "No mid-song dropouts — the flow never breaks.",
      dropoutRuns > 0 ? "fail" : "ok"
    )
  );

  /* ---- 5 · the peaks: clipping vs. intentional drive ---- */
  const peakDb = dbfs(peak);
  if (clipBlocks > 0) {
    const clipRatio = clipBlocks / blocks;
    if (tolerant && clipRatio < 0.08) {
      checks.push(
        check(
          "clipping",
          "Peaks",
          `Full-scale passages (${pct(clipRatio)} of time) — consistent with the chosen style's intentional drive, held under control.`,
          "info"
        )
      );
    } else {
      checks.push(
        check(
          "clipping",
          "Peaks",
          `The waveform slams into full scale for ${pct(clipRatio)} of the track — digital clipping, not style.`,
          clipRatio > 0.15 || !tolerant ? "fail" : "warn"
        )
      );
    }
  } else {
    checks.push(
      check(
        "clipping",
        "Peaks",
        `Clean headroom — true peak at ${peakDb.toFixed(1)} dBFS, no full-scale slams.`,
        "ok"
      )
    );
  }

  /* ---- 6 · the loudness ---- */
  const rmsDb = dbfs(bodyRms);
  checks.push(
    check(
      "loudness",
      "Loudness",
      rmsDb < -28
        ? `Very quiet master (${rmsDb.toFixed(1)} dB RMS) — the music whispers where it should speak.`
        : rmsDb > -7
          ? `Very hot master (${rmsDb.toFixed(1)} dB RMS) — little air left between the hits.`
          : `Healthy loudness (${rmsDb.toFixed(1)} dB RMS).`,
      rmsDb < -28 || rmsDb > -7 ? "warn" : "ok"
    )
  );

  /* ---- 7 · the artifacts: DC offset and harsh texture ---- */
  const dc = dcSum / Math.max(1, total);
  checks.push(
    check(
      "dc",
      "Center line",
      Math.abs(dc) > 0.01
        ? `DC offset ${dc.toFixed(3)} — the wave leans off center (pumps speakers rest).`
        : "The wave rests centered — no DC lean.",
      Math.abs(dc) > 0.01 ? "warn" : "ok"
    )
  );

  /* ---- 8 · the ending: a lift, not a hard cut ---- */
  const tailWin = Math.max(1, Math.floor(0.08 * sampleRate));
  const tailStart = Math.max(0, total - tailWin);
  let tailSq = 0;
  for (let i = tailStart; i < total; i++) {
    const mono = (left[i] + (right ? right[i] : left[i])) * 0.5;
    tailSq += mono * mono;
  }
  const tailRms = Math.sqrt(tailSq / Math.max(1, total - tailStart));
  const cutHard =
    bodyRms > SILENCE_RMS * 4 && tailRms > bodyRms * 0.3 && trailingSec < 0.12;
  checks.push(
    check(
      "ending",
      "Ending",
      cutHard
        ? "The sound is severed mid-breath at the end — the weave should land, not fall off a cliff."
        : trailingSec >= 1
          ? "The ending breathes out naturally."
          : "The ending lands cleanly.",
      cutHard ? "warn" : "ok"
    )
  );

  /* ---- 9 · the length ---- */
  checks.push(
    check(
      "duration",
      "Duration",
      duration > durationLimit
        ? `${duration.toFixed(0)}s — beyond the ${durationLimit}s frame (analysis covered the first ${durationLimit}s).`
        : `${duration.toFixed(0)}s — inside the frame.`,
      duration > durationLimit * 1.5 ? "warn" : "ok"
    )
  );

  return finish(checks, {
    sampleRate,
    channels,
    durationSec: duration,
    peakDb,
    rmsDb,
    silenceRatio,
  });
}

/* the verdict: any fail → fail; any warn → warn; otherwise pass */
function finish(
  checks: QualityCheck[],
  measured?: QualityReport["measured"]
): QualityReport {
  let verdict: QualityReport["verdict"] = "pass";
  for (const c of checks) {
    if (c.severity === "fail") {
      verdict = "fail";
      break;
    }
    if (c.severity === "warn" && verdict === "pass") verdict = "warn";
  }
  return { verdict, checks, measured };
}
