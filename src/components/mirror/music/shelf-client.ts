"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useMirror } from "@/lib/mirror-store";
import type { LightCodesMode } from "@/lib/data/light-codes";

/* ------------------------------------------------------------------ */
/*  THE SHELF'S OWN HAND — the client half of the durable generation.  */
/*                                                                     */
/*  The server keeps the book; this hand starts the job, watches it    */
/*  breathe (a quiet poll), plays the songs that land, and carries     */
/*  the continue action. A start that cannot begin (the vault rests,  */
/*  the sky sleeps) answers "fallback" so the legacy single-song      */
/*  flow carries the visit — the visitor is never left at a wall.      */
/* ------------------------------------------------------------------ */

export interface ShelfTrack {
  id: string;
  index: number;
  title: string | null;
  status: string;
  audioUrl: string | null;
  durationMs: number | null;
  error: string | null;
}

export interface ShelfJob {
  id: string;
  status: string;
  mode: string;
  intention: string;
  notes: string | null;
  trackCount: number;
  chargedCount: number;
  readyCount: number;
  pendingCount: number;
  createdAt: string;
  tracks: ShelfTrack[];
}

export interface ShelfStartPayload {
  count: number;
  mode: string;
  intention: string;
  civilization: string | null;
  shape: Record<string, unknown>;
  studio: Record<string, unknown>;
  userLyrics: string | null;
  instrumental: boolean;
  language: string;
}

interface ShelfState {
  jobs: ShelfJob[];
  loadingShelf: boolean;
  activeJob: ShelfJob | null;
  busy: boolean;
  error: string | null;
}

let state: ShelfState = {
  jobs: [],
  loadingShelf: false,
  activeJob: null,
  busy: false,
  error: null,
};
const listeners = new Set<() => void>();

function setState(patch: Partial<ShelfState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = (): ShelfState => state;
const getServerSnapshot = (): ShelfState => state;

/* ------------------------- the poll loop --------------------------- */

let pollTimer: number | null = null;
let pollJobId: string | null = null;
let pollStarted = 0;

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearTimeout(pollTimer);
    pollTimer = null;
  }
  pollJobId = null;
}

function speakError(message: string): void {
  setState({ error: message });
  try {
    useMirror.setState({ lcStatus: "error", lcError: message });
  } catch {
    /* the mirror store rests */
  }
}

function applyJobUpdate(job: ShelfJob): void {
  const next = state.jobs.filter((j) => j.id !== job.id);
  setState({
    jobs: [job, ...next].slice(0, 24),
    activeJob:
      state.activeJob?.id === job.id
        ? job
        : job.pendingCount > 0 && !state.activeJob
          ? job
          : state.activeJob,
    busy:
      state.activeJob?.id === job.id
        ? job.pendingCount > 0
        : state.busy,
  });
  if (state.activeJob && state.activeJob.pendingCount === 0) {
    setState({ activeJob: null, busy: false });
    stopPolling();
    void refreshShelf();
  }
}

function pollOnce(): void {
  if (!pollJobId) return;
  const jobId = pollJobId;
  /* a watch that never sleeps forever — ten quiet minutes end it */
  if (Date.now() - pollStarted > 10 * 60 * 1000) {
    stopPolling();
    void refreshShelf();
    return;
  }
  fetch(`/api/music/generate?jobId=${encodeURIComponent(jobId)}`, {
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: { job?: ShelfJob }) => {
      if (data?.job) applyJobUpdate(data.job);
    })
    .catch(() => undefined)
    .finally(() => {
      if (pollJobId === jobId) {
        pollTimer = window.setTimeout(pollOnce, 4200);
      }
    });
}

function watchJob(job: ShelfJob): void {
  stopPolling();
  if (job.pendingCount === 0) {
    setState({ activeJob: null, busy: false });
    void refreshShelf();
    return;
  }
  pollStarted = Date.now();
  pollJobId = job.id;
  pollTimer = window.setTimeout(pollOnce, 3000);
}

/* --------------------------- the actions --------------------------- */

export async function refreshShelf(): Promise<void> {
  setState({ loadingShelf: true });
  try {
    const res = await fetch("/api/music/shelf", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as { jobs?: ShelfJob[] } | null;
    const jobs = Array.isArray(data?.jobs) ? (data!.jobs as ShelfJob[]) : [];
    /* the freshest still-breathing job keeps the watch alive */
    const breathing = jobs.find((j) => j.pendingCount > 0);
    setState({ jobs, loadingShelf: false });
    if (breathing) {
      setState({ activeJob: breathing, busy: true });
      watchJob(breathing);
    }
  } catch {
    setState({ loadingShelf: false });
  }
}

async function start(payload: ShelfStartPayload): Promise<"ok" | "fallback"> {
  setState({ busy: true, error: null, activeJob: null });
  try {
    const res = await fetch("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as
      | { job?: ShelfJob; interpretation?: { title?: string; style?: string; notes?: string; lyrics?: string | null }; error?: string; code?: string }
      | null;

    if (!res.ok || !data?.job) {
      if (res.status === 503 || data?.code === "shelf_unavailable" || res.status >= 500) {
        setState({ busy: false });
        return "fallback";
      }
      if (res.status === 501) {
        speakError(
          data?.error ??
            "The chamber is tuned, but the sound engine's key is not yet placed."
        );
        setState({ busy: false });
        return "fallback";
      }
      speakError(
        data?.error ??
          "The shelf could not begin this generation — the legacy loom carries it instead."
      );
      setState({ busy: false });
      return "fallback";
    }

    const job = data.job;
    setState({ jobs: [job, ...state.jobs].slice(0, 24), activeJob: job });
    watchJob(job);
    return "ok";
  } catch {
    setState({ busy: false });
    return "fallback";
  }
}

async function resume(jobId: string): Promise<void> {
  setState({ busy: true, error: null });
  try {
    const res = await fetch("/api/music/generate/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    const data = (await res.json().catch(() => null)) as
      | { job?: ShelfJob; error?: string }
      | null;
    if (!res.ok || !data?.job) {
      speakError(data?.error ?? "The continue stumbled. Rest, then try again.");
      setState({ busy: false });
      return;
    }
    applyJobUpdate(data.job);
    if (data.job.pendingCount > 0) {
      setState({ activeJob: data.job, busy: true });
      watchJob(data.job);
    }
  } catch {
    speakError("The continue stumbled. Rest, then try again.");
    setState({ busy: false });
  }
}

async function hideJob(jobId: string): Promise<void> {
  setState({ jobs: state.jobs.filter((j) => j.id !== jobId) });
  try {
    await fetch(`/api/music/shelf?id=${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    });
  } catch {
    /* the shelf forgives — the row rests hidden on the next read */
  }
}

/* --------------------------- the hook ------------------------------ */

export function useMusicShelf() {
  const shelf = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refreshShelfStable = useCallback(() => void refreshShelf(), []);
  const startStable = useCallback(
    (payload: ShelfStartPayload) => start(payload),
    []
  );
  const resumeStable = useCallback((jobId: string) => void resume(jobId), []);
  const hideStable = useCallback((jobId: string) => void hideJob(jobId), []);

  return {
    jobs: shelf.jobs,
    loadingShelf: shelf.loadingShelf,
    busy: shelf.busy,
    activeJob: shelf.activeJob,
    error: shelf.error,
    refreshShelf: refreshShelfStable,
    start: startStable,
    resume: resumeStable,
    hideJob: hideStable,
  };
}

/* ------------------------ the shelf's play ------------------------- */

/** One landed song walks to the chamber's own player — durable, served
    from the vault, owner-checked, any device. */
export function playShelfTrack(job: ShelfJob, track: ShelfTrack): void {
  if (!track.audioUrl) return;
  try {
    void useMirror.getState().playLc({
      id: track.id,
      title: track.title ?? `Take ${track.index + 1}`,
      mode: job.mode as LightCodesMode,
      intention: job.intention,
      audioUrl: track.audioUrl,
      durable: true,
      createdAt: Date.now(),
      style: job.notes ?? undefined,
      notes: job.notes ?? undefined,
      length: "full",
      genres: undefined,
    });
  } catch {
    /* the player rests */
  }
}
