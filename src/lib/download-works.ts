"use client";

/* ------------------------------------------------------------------ */
/*  download-works.ts — THE DOWNLOAD WORKS.                            */
/*                                                                     */
/*  A module-level registry of every download the visitor has set in   */
/*  motion. Because the works live HERE — outside any component — a    */
/*  download is never interrupted by navigation, a closing panel, or   */
/*  an unmounted room: it keeps walking until it lands or until the    */
/*  visitor's own hand cancels it. THE ONE CANCEL LAW — only an        */
/*  explicit cancel (the tray's hand) can stop a work; network stumbles */
/*  are absorbed by automatic retries with a growing breath between    */
/*  them, so a flicker in the sky never costs the visitor their book.  */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";

export type DownloadWorkState = "running" | "done" | "failed" | "cancelled";

export interface DownloadWork {
  id: string;
  label: string;
  stage: string;
  /** 0..100, or -1 while the work's size is not yet known */
  progress: number;
  state: DownloadWorkState;
  startedAt: number;
  /** the work's own hand — the only honest way to stop it */
  cancel: () => void;
  /** how many automatic breaths the work has already taken */
  attempts: number;
  error?: string | null;
}

interface WorkEntry extends DownloadWork {
  /* the visitor's cancel request — read by the runner through the signal */
  controller: AbortController;
  /** settled works linger a breath so the tray can speak, then leave */
  lingerUntil?: number;
  listeners: Set<() => void>;
}

const works = new Map<string, WorkEntry>();
const watchers = new Set<() => void>();

/* THE DOOR'S OWN COURTESY — while a download is in motion, a hand on
   the tab's close or a refresh is met with the browser's own leave
   warning: a book in the binding is never lost to a stray gesture.
   The only honest stop stays the tray's cancel hand. */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    for (const entry of works.values()) {
      if (entry.state === "running") {
        e.preventDefault();
        e.returnValue = ""; /* the browser speaks its own leave warning */
        return;
      }
    }
  });
}

function emit(): void {
  for (const w of watchers) {
    try {
      w();
    } catch {
      /* a sleeping watcher is simply skipped */
    }
  }
}

function touch(entry: WorkEntry): void {
  /* entries are mutated in place; version bump through a fresh map
     reference keeps React honest without cloning every field */
  works.set(entry.id, { ...entry });
  emit();
}

function sweep(): void {
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of works) {
    if (entry.lingerUntil && entry.lingerUntil <= now) {
      works.delete(id);
      changed = true;
    }
  }
  if (changed) emit();
}

export function listDownloadWorks(): DownloadWork[] {
  return Array.from(works.values()).map((e) => ({
    id: e.id,
    label: e.label,
    stage: e.stage,
    progress: e.progress,
    state: e.state,
    startedAt: e.startedAt,
    attempts: e.attempts,
    error: e.error ?? null,
    cancel: () => cancelDownloadWork(e.id),
  }));
}

export function subscribeDownloadWorks(cb: () => void): () => void {
  watchers.add(cb);
  return () => watchers.delete(cb);
}

/** THE REACT HAND — a component's window into the works. */
export function useDownloadWorks(): DownloadWork[] {
  const [snapshot, setSnapshot] = useState<DownloadWork[]>(() => listDownloadWorks());
  useEffect(() => {
    let alive = true;
    const sync = () => {
      if (alive) setSnapshot(listDownloadWorks());
    };
    const unsub = subscribeDownloadWorks(sync);
    /* the sweep's own quiet clock — settled works leave after a breath */
    const timer = window.setInterval(() => {
      sweep();
      sync();
    }, 500);
    return () => {
      alive = false;
      unsub();
      window.clearInterval(timer);
    };
  }, []);
  return snapshot;
}

export function cancelDownloadWork(id: string): void {
  const entry = works.get(id);
  if (!entry) return;
  if (entry.state === "running") {
    entry.state = "cancelled";
    entry.stage = "Cancelled by your hand";
    entry.lingerUntil = Date.now() + 2600;
    entry.controller.abort();
    touch(entry);
  } else {
    works.delete(id);
    emit();
  }
}

/** THE ABORT GEM — a clean AbortError, understood by every browser. */
export function abortError(): Error {
  try {
    return new DOMException("The work was cancelled", "AbortError");
  } catch {
    const e = new Error("The work was cancelled");
    e.name = "AbortError";
    return e;
  }
}

export function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" ||
      (err.name !== "ValidationError" &&
        err.message.toLowerCase().includes("abort")))
  );
}

export interface WorkReporter {
  stage: (text: string) => void;
  progress: (percent: number) => void;
  signal: AbortSignal;
  throwIfCancelled: () => void;
}

export interface StartWorkOptions {
  /** a second label lookup at run time (translations may land late) */
  label: string;
}

/** THE WORK ITSELF — run something under the registry's watch. The
    runner receives a reporter (stage / progress / signal). Whatever
    it returns is handed back to the caller; a thrown AbortError is
    folded into a cancelled work, any other throw marks the work
    failed and rethrows so the caller may speak. */
export async function startDownloadWork<T>(
  label: string,
  runner: (report: WorkReporter) => Promise<T>
): Promise<T> {
  const id = `dw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const controller = new AbortController();
  const entry: WorkEntry = {
    id,
    label,
    stage: "Setting out…",
    progress: -1,
    state: "running",
    startedAt: Date.now(),
    attempts: 1,
    controller,
    listeners: new Set(),
    cancel: () => cancelDownloadWork(id),
  };
  works.set(id, entry);
  emit();

  const report: WorkReporter = {
    stage: (text: string) => {
      const cur = works.get(id);
      if (!cur || cur.state !== "running") return;
      cur.stage = text;
      touch(cur);
    },
    progress: (percent: number) => {
      const cur = works.get(id);
      if (!cur || cur.state !== "running") return;
      cur.progress = Math.max(0, Math.min(100, Math.round(percent)));
      touch(cur);
    },
    signal: controller.signal,
    throwIfCancelled: () => {
      if (controller.signal.aborted) throw abortError();
    },
  };

  try {
    const out = await runner(report);
    const cur = works.get(id);
    if (cur) {
      if (cur.state === "running") {
        cur.state = "done";
        cur.stage = "Complete";
        cur.progress = 100;
      }
      cur.lingerUntil = Date.now() + 2400;
      touch(cur);
    }
    return out;
  } catch (err) {
    const cur = works.get(id);
    if (cur) {
      if (isAbortError(err) || controller.signal.aborted) {
        if (cur.state === "running") {
          cur.state = "cancelled";
          cur.stage = "Cancelled by your hand";
        }
      } else {
        cur.state = "failed";
        cur.stage = "Interrupted — the sky took it";
        cur.error = err instanceof Error ? err.message.slice(0, 160) : "Unknown stumble";
      }
      cur.lingerUntil = Date.now() + 4200;
      touch(cur);
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  THE RESILIENT FETCH — a fetch that refuses to die quietly.         */
/*                                                                     */
/*  · streams the body with honest byte progress (when the sky sends   */
/*    a Content-Length);                                               */
/*  · retries network failures, 5xx and 429s automatically — up to     */
/*    `retries` extra breaths, each twice as long as the last;         */
/*  · a cancelled work is never retried — the visitor's hand is law;   */
/*  · `keepalive` rides along so even a closing tab lets the request   */
/*    finish its last breath.                                          */
/* ------------------------------------------------------------------ */

export interface ResilientFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  retries?: number;
  /** streaming progress — 0..100 when the length is known, else pulse */
  onProgress?: (percent: number, received: number, total: number | null) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function resilientFetch(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const {
    method = "GET",
    headers,
    body,
    retries = 4,
    onProgress,
    signal,
    timeoutMs = 0,
  } = options;

  const merged = new AbortController();
  const onOuterAbort = () => merged.abort();
  if (signal) {
    if (signal.aborted) throw abortError();
    signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  let attempt = 0;
  let lastErr: unknown = null;

  /* returns true when this stumble deserves another breath */
  const worthRetry = (err: unknown, status?: number): boolean => {
    if (merged.signal.aborted) return false;
    if (status && status < 500 && status !== 429 && status !== 408) return false;
    if (err instanceof TypeError) return true; /* network fell */
    return status === undefined || status >= 500 || status === 429 || status === 408;
  };

  while (attempt <= retries) {
    attempt += 1;
    /* a breath taken because the sky itself stalled — never a cancel */
    let timedOut = false;
    try {
      const timer =
        timeoutMs > 0
          ? window.setTimeout(() => {
              timedOut = true;
              merged.abort();
            }, timeoutMs)
          : null;
      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers,
          body: body ?? undefined,
          keepalive: true,
          cache: "no-store",
          signal: merged.signal,
          credentials: "same-origin",
        });
      } finally {
        if (timer) window.clearTimeout(timer);
      }

      if (!res.ok) {
        if (attempt <= retries && worthRetry(null, res.status)) {
          await breathe(attempt, merged.signal);
          continue;
        }
        throw new Error(`The sky answered ${res.status}`);
      }

      if (!onProgress || !res.body) {
        if (signal) signal.removeEventListener("abort", onOuterAbort);
        return res;
      }

      /* THE STREAMED BODY — honest progress, byte by byte */
      const totalHeader = res.headers.get("Content-Length");
      const total = totalHeader ? Number(totalHeader) : null;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      let lastPulse = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (merged.signal.aborted) {
          try {
            await reader.cancel();
          } catch {
            /* the reader may already rest */
          }
          throw abortError();
        }
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          const now = Date.now();
          if (total && total > 0) {
            onProgress(Math.round((received / total) * 100), received, total);
          } else if (now - lastPulse > 220) {
            /* no length — the work still speaks, a pulse every few hundred ms */
            lastPulse = now;
            onProgress(-1, received, null);
          }
        }
      }
      const blob = new Blob(chunks as BlobPart[], {
        type: res.headers.get("Content-Type") || "application/octet-stream",
      });
      /* rebuild a response-like object the callers can treat the same */
      const rebuilt = new Response(blob, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
      if (signal) signal.removeEventListener("abort", onOuterAbort);
      return rebuilt;
    } catch (err) {
      lastErr = err;
      if ((isAbortError(err) || merged.signal.aborted) && !timedOut) throw abortError();
      if (attempt <= retries && worthRetry(err)) {
        await breathe(attempt, merged.signal);
        continue;
      }
      throw lastErr instanceof Error ? lastErr : new Error("The download stumbled");
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("The download stumbled");
}

/** THE BREATH — exponential backoff between automatic retries. */
async function breathe(attempt: number, signal: AbortSignal): Promise<void> {
  const ms = Math.min(8000, 600 * Math.pow(2, attempt - 1)) + Math.random() * 220;
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(done, ms);
    function done() {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

/** THE RESILIENT BLOB — fetch + stream + retries, handed back whole. */
export async function resilientFetchBlob(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<Blob> {
  const res = await resilientFetch(url, options);
  return res.blob();
}

/** THE HAND-OVER — a blob saved to the visitor's device. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** THE RETRYING FETCH — for small JSON calls that deserve the same
    stubbornness (font shelves, job polls). Retries network stumbles,
    never a cancel. */
export async function resilientText(url: string, attempts = 3): Promise<string> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "no-store", keepalive: true });
      if (res.ok) return await res.text();
      lastErr = new Error(`The shelf answered ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => window.setTimeout(r, 400 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("The shelf stayed shut");
}
