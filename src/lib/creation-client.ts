"use client";

/* ------------------------------------------------------------------ */
/*  THE UNIVERSAL WORKFLOW ORCHESTRATOR — the client's own half.       */
/*                                                                     */
/*  The engine's law (directive 03): Understand → Plan → Select →      */
/*  Execute → Validate → Connect. The server holds the ledger and the  */
/*  sky's doors; THIS side drives the walk step by step, reports every */
/*  step's truth to the ledger, cancels cleanly, and never hides a     */
/*  failure. The heavy assembly itself belongs to the visitor's own    */
/*  device — the studio's recorder owns it through a callback.         */
/* ------------------------------------------------------------------ */

import type { VideoSceneSpec, VideoWorkflowInput, WorkflowPlan } from "@/lib/capabilities/types";

export interface WorkflowEvents {
  onPlan?: (plan: WorkflowPlan) => void;
  onProgress?: (percent: number, note: string) => void;
  onSceneStatus?: (sceneId: string, status: "pending" | "narrating" | "narrated" | "clipping" | "clipped" | "failed", note?: string) => void;
  onNarration?: (sceneId: string, audio: ArrayBuffer) => void;
  onClip?: (sceneId: string, url: string | null, note?: string) => void;
  onDone?: (artifact: SavedArtifact | null) => void;
  onError?: (message: string) => void;
}

export interface SavedArtifact {
  id: string;
  type: string;
  title: string;
  storageKey?: string;
  mime?: string;
}

export interface WorkflowHandle {
  jobId: string | null;
  cancel: () => void;
}

interface PlanResponse {
  jobId?: string | null;
  plan?: WorkflowPlan;
  error?: string;
  ledgerNote?: string;
}

/** THE CLEAN TALKER — every fetch bounded and honest. */
async function postJson<T>(url: string, body: unknown, timeoutMs = 180_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok || data?.error) throw new Error(data?.error || `the door answered ${res.status}`);
    return data;
  } finally {
    window.clearTimeout(timer);
  }
}

async function patchJob(jobId: string | null, data: Record<string, unknown>): Promise<void> {
  if (!jobId) return;
  try {
    await fetch("/api/creation/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId, ...data }),
    });
  } catch {
    /* the ledger's silence never stops the walk */
  }
}

/* ------------------- the files' own device shelf -------------------- */
/*  The house keeps creations on the visitor's own device (the same    */
/*  law the walk's memory holds). One small, quiet IndexedDB shelf.    */

const DB_NAME = "mirror-creations";
const STORE = "files";

function openShelf(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const dbp = req.result;
        if (!dbp.objectStoreNames.contains(STORE)) dbp.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function keepFile(key: string, blob: Blob): Promise<boolean> {
  const dbp = await openShelf();
  if (!dbp) return false;
  return new Promise((resolve) => {
    try {
      const tx = dbp.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function readFile(key: string): Promise<Blob | null> {
  const dbp = await openShelf();
  if (!dbp) return null;
  return new Promise((resolve) => {
    try {
      const tx = dbp.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/* ------------------------ the video walk ---------------------------- */

export async function runVideoWorkflow(
  input: VideoWorkflowInput,
  events: WorkflowEvents,
  assemble: (
    plan: WorkflowPlan,
    narrations: Map<string, ArrayBuffer>,
    clips: Map<string, string>,
    report: (percent: number, note: string) => void,
    cancelled: () => boolean
  ) => Promise<{ blob: Blob; mime: string } | null>
): Promise<WorkflowHandle> {
  let cancelled = false;
  const handle: WorkflowHandle = {
    jobId: null,
    cancel: () => {
      cancelled = true;
      void patchJob(handle.jobId, { status: "cancelled" }).then(() => undefined);
    },
  };

  const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  try {
    /* 1–3 · UNDERSTAND · PLAN · SELECT — the storyboard is woven */
    events.onProgress?.(4, "Understanding the wish…");
    const planRes = await postJson<PlanResponse>("/api/creation/video/plan", {
      topic: input.topic,
      sceneCount: input.sceneCount,
      mode: input.mode,
      sourceConvId: input.sourceConvId,
      sourceBranch: input.sourceBranch,
    });
    if (cancelled) return handle;
    if (!planRes.plan) throw new Error(planRes.error || "The plan could not be woven.");
    const plan = planRes.plan;
    handle.jobId = planRes.jobId ?? null;
    events.onPlan?.(plan);
    events.onProgress?.(12, "The storyboard stands.");

    const scenes = plan.scenes ?? [];
    const narrations = new Map<string, ArrayBuffer>();
    const clips = new Map<string, string>();
    const narrStep = 46 / Math.max(1, scenes.length);

    /* 4 · EXECUTE — narration, one scene at a time (conversation pace) */
    for (let i = 0; i < scenes.length; i++) {
      if (cancelled) return handle;
      const scene = scenes[i];
      events.onSceneStatus?.(scene.id, "narrating");
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: scene.narration }),
        });
        if (!res.ok) throw new Error(`the voice answered ${res.status}`);
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 1000) throw new Error("the voice came back empty");
        narrations.set(scene.id, buf);
        events.onNarration?.(scene.id, buf);
        events.onSceneStatus?.(scene.id, "narrated");
      } catch (err) {
        /* a silent scene is an honest scene — the words still show */
        events.onSceneStatus?.(
          scene.id,
          "failed",
          err instanceof Error ? err.message : "the voice could not cross"
        );
      }
      events.onProgress?.(pct(12 + narrStep * (i + 1)), `Narration ${i + 1}/${scenes.length}`);
    }

    /* 4b · EXECUTE — generative clips, when the film asked for them */
    if (input.mode === "generative") {
      const clipStep = 30 / Math.max(1, scenes.length);
      for (let i = 0; i < scenes.length; i++) {
        if (cancelled) return handle;
        const scene = scenes[i];
        if (!scene.clipPrompt) continue;
        events.onSceneStatus?.(scene.id, "clipping");
        let taskId: string | undefined;
        let url: string | null = null;
        for (let attempt = 0; attempt < 12; attempt++) {
          if (cancelled) return handle;
          try {
            const res = await postJson<{ status: string; url?: string; taskId?: string }>(
              "/api/creation/video/clip",
              { prompt: scene.clipPrompt, jobId: handle.jobId, sceneId: scene.id, taskId },
              150_000
            );
            taskId = res.taskId ?? taskId;
            if (res.status === "ready" && res.url) {
              url = res.url;
              break;
            }
            if (res.status === "failed") break;
          } catch {
            break;
          }
        }
        if (url) {
          clips.set(scene.id, url);
          events.onClip?.(scene.id, url);
          events.onSceneStatus?.(scene.id, "clipped");
        } else {
          /* the honest fallback: the template scene stands in */
          events.onClip?.(scene.id, null, "the sky's clip could not be gathered — the drawn scene stands in");
        }
        events.onProgress?.(pct(58 + clipStep * (i + 1)), `Scenes ${i + 1}/${scenes.length}`);
      }
    }

    if (cancelled) return handle;

    /* 4c · EXECUTE — the assembly, on the visitor's own device */
    events.onProgress?.(62, "Assembling the film…");
    const made = await assemble(plan, narrations, clips, (p, note) => {
      events.onProgress?.(pct(62 + p * 0.33), note);
    }, () => cancelled);
    if (cancelled) return handle;

    if (!made) {
      await patchJob(handle.jobId, { status: "failed", error: "the assembly did not finish" });
      events.onError?.("The film could not be recorded this moment — ask once more.");
      events.onDone?.(null);
      return handle;
    }

    /* 5 · VALIDATE — a film that cannot play is not a film */
    if (made.blob.size < 10_000) {
      await patchJob(handle.jobId, { status: "failed", error: "the recording came back empty" });
      events.onError?.("The recording came back empty — the film was not kept.");
      events.onDone?.(null);
      return handle;
    }

    /* 6 · CONNECT — the artifact by its branch, the file on the device */
    events.onProgress?.(97, "Keeping the film…");
    const storageKey = `creation:${Date.now().toString(36)}`;
    const kept = await keepFile(storageKey, made.blob);
    let artifact: SavedArtifact | null = null;
    try {
      const res = await postJson<{ artifact: { id: string } }>("/api/creation/artifacts", {
        type: "video",
        title: plan.title,
        description: plan.synopsis,
        jobId: handle.jobId,
        sourceConvId: input.sourceConvId,
        sourceBranch: input.sourceBranch,
        files: kept ? [{ storage: "idb", key: storageKey, mime: made.mime, bytes: made.blob.size }] : [],
        metadata: {
          mode: input.mode ?? "motion",
          sceneCount: scenes.length,
          bytes: made.blob.size,
          mime: made.mime,
        },
      });
      artifact = { id: res.artifact.id, type: "video", title: plan.title, storageKey: kept ? storageKey : undefined, mime: made.mime };
    } catch {
      /* the register rested — the film still exists on the device */
      artifact = { id: storageKey, type: "video", title: plan.title, storageKey: kept ? storageKey : undefined, mime: made.mime };
    }

    await patchJob(handle.jobId, { status: "completed", progress: 100 });
    events.onProgress?.(100, "The film stands complete.");
    events.onDone?.(artifact);
    return handle;
  } catch (err) {
    const message = err instanceof Error ? err.message : "the walk stumbled";
    await patchJob(handle.jobId, { status: "failed", error: message.slice(0, 300) });
    events.onError?.(message);
    events.onDone?.(null);
    return handle;
  }
}
