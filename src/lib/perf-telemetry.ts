"use client";

/* ------------------------------------------------------------------ */
/*  PERF TELEMETRY — the house measures itself, privately.             */
/*                                                                     */
/*  In-memory, privacy-conscious metrics: web vitals, long tasks,      */
/*  JS errors, stream latency (TTFT / total), visibility suspend /     */
/*  resume counts, network drops. NOTHING is sent anywhere; NO        */
/*  conversation content is ever recorded. The snapshot is reachable  */
/*  in development builds through window.__reflectmePerf.snapshot()   */
/*  (the same dev-keyhole law as the mirror store).                   */
/* ------------------------------------------------------------------ */

export interface StreamSample {
  id: string;
  ttftMs: number | null;
  totalMs: number | null;
  chars: number;
  interrupted: boolean;
}

export interface PerfSnapshot {
  webVitals: {
    lcpMs: number | null;
    cls: number | null;
    inpMs: number | null;
    fcpMs: number | null;
  };
  longTasks: { count: number; totalMs: number; worstMs: number };
  jsErrors: number;
  streams: {
    started: number;
    completed: number;
    interrupted: number;
    last: StreamSample | null;
    avgTtftMs: number | null;
    avgTotalMs: number | null;
  };
  lifecycle: {
    hiddenCount: number;
    resumeCount: number;
    networkDrops: number;
    lastHiddenMs: number | null;
    discardedRestore: boolean;
  };
  memoryMb: number | null;
  uptimeMs: number;
}

interface StreamTrack {
  id: string;
  startedAt: number;
  ttftMs: number | null;
  chars: number;
  firstDeltaSeen: boolean;
}

const startedAt = Date.now();

/* Minimal local shapes — `LayoutShift` / `PerformanceEventTiming` are
   not in every TypeScript DOM lib the house compiles against. */
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}
let hiddenCount = 0;
let resumeCount = 0;
let networkDrops = 0;
let lastHiddenMs: number | null = null;
let hiddenTimestamp = 0;
let jsErrors = 0;
let discardedRestore = false;

let lcp: number | null = null;
let cls: number | null = null;
let inp: number | null = null;
let fcp: number | null = null;

let longTaskCount = 0;
let longTaskTotal = 0;
let longTaskWorst = 0;

const streamsStarted = new Map<string, StreamTrack>();
let streamsCompleted = 0;
let streamsInterrupted = 0;
const recentStreams: StreamSample[] = [];

function pushRecent(sample: StreamSample): void {
  recentStreams.push(sample);
  if (recentStreams.length > 20) recentStreams.shift();
}

function observePerformance(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          lcp = Math.round(entry.startTime);
        } else if (entry.entryType === "layout-shift" && !(entry as LayoutShiftEntry).hadRecentInput) {
          cls = (cls ?? 0) + ((entry as LayoutShiftEntry).value ?? 0);
        } else if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          fcp = Math.round(entry.startTime);
        } else if (entry.entryType === "event") {
          const dur = (entry as unknown as { duration?: number }).duration ?? 0;
          if (dur > (inp ?? 0)) inp = Math.round(dur);
        } else if (entry.entryType === "longtask") {
          longTaskCount += 1;
          longTaskTotal += entry.duration;
          longTaskWorst = Math.max(longTaskWorst, Math.round(entry.duration));
        }
      }
    }).observe({
      type: "largest-contentful-paint",
      buffered: true,
    } as PerformanceObserverInit);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "layout-shift" && !(entry as LayoutShiftEntry).hadRecentInput) {
          cls = (cls ?? 0) + ((entry as LayoutShiftEntry).value ?? 0);
        }
      }
    }).observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          fcp = Math.round(entry.startTime);
        }
      }
    }).observe({ type: "paint", buffered: true } as PerformanceObserverInit);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "event") {
          const dur = (entry as unknown as { duration?: number }).duration ?? 0;
          if (dur > (inp ?? 0)) inp = Math.round(dur);
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 200 } as PerformanceObserverInit);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "longtask") {
          longTaskCount += 1;
          longTaskTotal += entry.duration;
          longTaskWorst = Math.max(longTaskWorst, Math.round(entry.duration));
        }
      }
    }).observe({ type: "longtask", buffered: true } as PerformanceObserverInit);
  } catch {
    /* observers unsupported — the metrics stay honestly empty */
  }
}

function readMemoryMb(): number | null {
  if (typeof performance === "undefined") return null;
  const mem = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  if (!mem || !mem.usedJSHeapSize) return null;
  return Math.round(mem.usedJSHeapSize / 1048576);
}

/* --- stream instrumentation ---------------------------------------- */

export function perfStreamStart(id: string): void {
  streamsStarted.set(id, {
    id,
    startedAt: Date.now(),
    ttftMs: null,
    chars: 0,
    firstDeltaSeen: false,
  });
}

/** First bytes of the answer actually rendered — the honest TTFT. */
export function perfStreamFirstDelta(id: string, chars: number): void {
  const track = streamsStarted.get(id);
  if (!track || track.firstDeltaSeen) return;
  track.firstDeltaSeen = true;
  track.ttftMs = Date.now() - track.startedAt;
  track.chars = Math.max(track.chars, chars);
}

export function perfStreamDelta(id: string, chars: number): void {
  const track = streamsStarted.get(id);
  if (!track) return;
  track.chars = Math.max(track.chars, chars);
}

export function perfStreamEnd(id: string, interrupted = false): void {
  const track = streamsStarted.get(id);
  if (!track) return;
  streamsStarted.delete(id);
  if (interrupted) streamsInterrupted += 1;
  else streamsCompleted += 1;
  pushRecent({
    id,
    ttftMs: track.ttftMs,
    totalMs: Date.now() - track.startedAt,
    chars: track.chars,
    interrupted,
  });
}

/* --- lifecycle wiring ---------------------------------------------- */

let booted = false;

export function bootPerfTelemetry(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;
  discardedRestore =
    (document as Document & { wasDiscarded?: boolean }).wasDiscarded === true;

  observePerformance();

  window.addEventListener("error", () => {
    jsErrors += 1;
  });
  window.addEventListener("unhandledrejection", () => {
    jsErrors += 1;
  });

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") {
        hiddenCount += 1;
        hiddenTimestamp = Date.now();
      } else if (hiddenTimestamp > 0) {
        resumeCount += 1;
        lastHiddenMs = Date.now() - hiddenTimestamp;
        hiddenTimestamp = 0;
      }
    },
    { passive: true },
  );

  window.addEventListener("offline", () => {
    networkDrops += 1;
  });
}

/* --- snapshot ------------------------------------------------------- */

export function perfSnapshot(): PerfSnapshot {
  const recent = recentStreams.filter((s) => s.ttftMs !== null);
  const avg = (pick: (s: StreamSample) => number | null): number | null => {
    const vals = recent.map(pick).filter((v): v is number => typeof v === "number");
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  return {
    webVitals: { lcpMs: lcp, cls: cls === null ? null : Math.round(cls * 1000) / 1000, inpMs: inp, fcpMs: fcp },
    longTasks: { count: longTaskCount, totalMs: Math.round(longTaskTotal), worstMs: longTaskWorst },
    jsErrors,
    streams: {
      started: streamsCompleted + streamsInterrupted + streamsStarted.size,
      completed: streamsCompleted,
      interrupted: streamsInterrupted,
      last: recentStreams.length ? recentStreams[recentStreams.length - 1] : null,
      avgTtftMs: avg((s) => s.ttftMs),
      avgTotalMs: avg((s) => s.totalMs),
    },
    lifecycle: {
      hiddenCount,
      resumeCount,
      networkDrops,
      lastHiddenMs,
      discardedRestore,
    },
    memoryMb: readMemoryMb(),
    uptimeMs: Date.now() - startedAt,
  };
}
