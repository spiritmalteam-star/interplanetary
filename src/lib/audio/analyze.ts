/* ------------------------------------------------------------------ */
/*  THE HONEST LISTENER — the chamber's own quality ear. A finished    */
/*  transmission is decoded on the visitor's machine and read once:    */
/*  its true length, its true loudness, its clipping, its silences.    */
/*  The report speaks plainly and never blocks playback — analysis     */
/*  is a luxury, the sound itself never waits for it.                  */
/* ------------------------------------------------------------------ */

export interface QualityReport {
  /** the decoded length in seconds */
  durationSec: number;
  /** peak level in dBFS (0 = full scale) */
  peakDb: number;
  /** average loudness in dBFS */
  meanDb: number;
  /** the fraction of samples sitting at (or within 0.1% of) full scale */
  clippingRatio: number;
  /** the fraction of samples below the quiet floor */
  silenceRatio: number;
  /** the longest continuous silence, in seconds */
  longestSilenceSec: number;
  /** honest flags */
  tooQuiet: boolean;
  clipped: boolean;
  longSilence: boolean;
  /** the report's own verdict */
  verdict: "good" | "watch" | "poor";
  /** the plain words beneath the numbers */
  notes: string[];
}

export interface AnalyzeOptions {
  /** families that wear heavy studio effects are read with wider
      honest margins (brickwall masters are their nature) */
  effectsTolerant?: boolean;
  /** cap how much of the song is scanned, in seconds */
  durationLimitSec?: number;
}

const FULL_SCALE = 0.999;
const QUIET_FLOOR = 0.004; // ≈ -48 dBFS
const BLOCK = 4096;

function toDb(v: number): number {
  return 20 * Math.log10(Math.max(v, 1e-6));
}

export async function analyzeTrackAudio(
  audioUrl: string,
  options: AnalyzeOptions = {}
): Promise<QualityReport> {
  const effectsTolerant = options.effectsTolerant === true;
  const durationLimitSec =
    typeof options.durationLimitSec === "number" && options.durationLimitSec > 0
      ? options.durationLimitSec
      : 600;

  const res = await fetch(audioUrl, { cache: "force-cache" });
  if (!res.ok) throw new Error("the sound could not be fetched for reading");
  const bytes = await res.arrayBuffer();

  const OfflineCtx =
    window.OfflineAudioContext ??
    (window.webkitAudioContext as unknown as typeof OfflineAudioContext | undefined);
  if (!OfflineCtx) throw new Error("this browser cannot decode for reading");
  const ctx = new OfflineCtx(1, 1, 44100);
  const buffer = await ctx.decodeAudioData(bytes);

  const durationSec = buffer.duration;
  const limit = Math.min(durationSec, durationLimitSec);
  const sampleRate = buffer.sampleRate;
  const scanLength = Math.floor(limit * sampleRate);

  let peak = 0;
  let sumSquares = 0;
  let count = 0;
  let clipped = 0;
  let silent = 0;
  let longestSilenceSec = 0;
  let runSilentSamples = 0;

  const channels = Math.min(2, buffer.numberOfChannels);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    const n = Math.min(scanLength, data.length);
    for (let i = 0; i < n; i += 4) {
      // stride of 4 — a faithful sample at a tenth of the cost
      const v = data[i];
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
      sumSquares += v * v;
      count += 1;
      if (abs >= FULL_SCALE) clipped += 1;
      if (abs < QUIET_FLOOR) {
        silent += 1;
        runSilentSamples += 4;
        if (runSilentSamples / sampleRate > longestSilenceSec) {
          longestSilenceSec = runSilentSamples / sampleRate;
        }
      } else {
        runSilentSamples = 0;
      }
    }
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, count));
  const clippingRatio = count > 0 ? clipped / count : 0;
  const silenceRatio = count > 0 ? silent / count : 0;
  const peakDb = toDb(peak);
  const meanDb = toDb(rms);

  const clipLimit = effectsTolerant ? 0.02 : 0.003;
  const clipSampleLimit = effectsTolerant ? 0.012 : 0.002;
  const quietFloorDb = effectsTolerant ? -34 : -28;
  const tooQuiet = meanDb < quietFloorDb;
  const isClipped = clippingRatio > clipLimit || clippingRatio > clipSampleLimit;
  const longSilence = longestSilenceSec > 6;

  const notes: string[] = [];
  notes.push(`its true length: ${Math.round(durationSec)}s`);
  if (isClipped) {
    notes.push(
      effectsTolerant
        ? "the master sits hard against the ceiling — loudness worn openly, as its family does"
        : "some peaks press the ceiling — a gentler master would breathe"
    );
  }
  if (tooQuiet) notes.push("the song speaks quietly — raise the volume to hear it fully");
  if (longSilence) {
    notes.push(`a quiet passage of ${Math.round(longestSilenceSec)}s rests inside`);
  }
  if (!isClipped && !tooQuiet && !longSilence) {
    notes.push("the mix sits balanced — nothing to forgive");
  }

  const verdict: QualityReport["verdict"] = isClipped || tooQuiet || longSilence
    ? (isClipped && !effectsTolerant) || tooQuiet
      ? "poor"
      : "watch"
    : "good";

  return {
    durationSec,
    peakDb: Math.round(peakDb * 10) / 10,
    meanDb: Math.round(meanDb * 10) / 10,
    clippingRatio: Math.round(clippingRatio * 10000) / 10000,
    silenceRatio: Math.round(silenceRatio * 10000) / 10000,
    longestSilenceSec: Math.round(longestSilenceSec * 10) / 10,
    tooQuiet,
    clipped: isClipped,
    longSilence,
    verdict,
    notes,
  };
}
