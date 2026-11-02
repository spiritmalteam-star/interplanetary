"use client";

/* ------------------------------------------------------------------ */
/*  PAGE LIFECYCLE — one ear for the whole house.                      */
/*                                                                     */
/*  Every loop, poll and scheduler in ReflectMe asks this module       */
/*  whether the visitor is actually looking. When the tab is hidden    */
/*  the house stops paying CPU for background work: no fetches, no     */
/*  frame work, no ticking phrases. When the visitor returns, the      */
/*  house wakes in one bounded pass — refresh what went stale, flush   */
/*  what buffered, resume what lives — and never spins forever.        */
/*                                                                     */
/*  Handles: visibilitychange · pagehide · pageshow (bfcache) ·        */
/*  freeze/resume (Android page lifecycle) · online/offline ·          */
/*  document.wasDiscarded. Bounded retries, graceful failure.          */
/* ------------------------------------------------------------------ */

type Callback = () => void;

const visibleCbs = new Set<Callback>();
const hiddenCbs = new Set<Callback>();
const resumeCbs = new Set<Callback>();
const onlineCbs = new Set<Callback>();
const offlineCbs = new Set<Callback>();
const cleanupCbs = new Set<Callback>();

let hiddenAt = 0;
let booted = false;
let online = true;

/* --- honest state readers ---------------------------------------- */

export function isPageHidden(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "hidden";
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

export function wasDiscarded(): boolean {
  if (typeof document === "undefined") return false;
  const nav = document as Document & { wasDiscarded?: boolean };
  return nav.wasDiscarded === true;
}

/* --- subscriptions ------------------------------------------------- */

export function onPageVisible(cb: Callback): () => void {
  visibleCbs.add(cb);
  return () => visibleCbs.delete(cb);
}

export function onPageHidden(cb: Callback): () => void {
  hiddenCbs.add(cb);
  return () => hiddenCbs.delete(cb);
}

/** Fired when the visitor truly comes back after an absence
 *  (>= ~1s hidden), on bfcache restore, or on the Android `resume`
 *  event — the "wake up and revalidate" moment. */
export function onPageResume(cb: Callback): () => void {
  resumeCbs.add(cb);
  return () => resumeCbs.delete(cb);
}

export function onNetworkOnline(cb: Callback): () => void {
  onlineCbs.add(cb);
  return () => onlineCbs.delete(cb);
}

export function onNetworkOffline(cb: Callback): () => void {
  offlineCbs.add(cb);
  return () => offlineCbs.delete(cb);
}

/** Registered work is suspended on pagehide/freeze (audio, streams,
 *  recorders). Returns an unsubscribe. */
export function registerPageCleanup(cb: Callback): () => void {
  cleanupCbs.add(cb);
  return () => cleanupCbs.delete(cb);
}

/* --- gated timers ---------------------------------------------------
   setInterval that refuses to burn CPU while the tab is hidden, and
   fires ONE catch-up tick the moment the visitor returns (so data
   never sits stale behind a hidden tab). Returns a clear function.  */

export function gateInterval(fn: Callback, ms: number): () => void {
  const id = setInterval(() => {
    if (!isPageHidden()) fn();
  }, ms);
  const offVisible = onPageVisible(() => {
    /* catch-up tick on return, then the normal cadence resumes */
    try {
      fn();
    } catch {
      /* a single failed tick never kills the loop */
    }
  });
  return () => {
    clearInterval(id);
    offVisible();
  };
}

/** setTimeout that runs even when hidden is NOT desired: if the tab
 *  is hidden the callback is deferred until the tab is visible. */
export function visibleTimeout(fn: Callback, ms: number): () => void {
  let id: ReturnType<typeof setTimeout> | null = null;
  const run = () => {
    id = null;
    fn();
  };
  const offVisible = onPageVisible(() => {
    if (id !== null) {
      clearTimeout(id);
      id = null;
      fn();
    }
  });
  id = setTimeout(() => {
    if (isPageHidden()) {
      id = setTimeout(run, ms);
      return;
    }
    run();
  }, ms);
  return () => {
    if (id !== null) clearTimeout(id);
    offVisible();
  };
}

/** Run now when visible, otherwise the moment the tab returns. */
export function whenVisible(fn: Callback): void {
  if (!isPageHidden()) {
    fn();
    return;
  }
  const off = onPageVisible(() => {
    off();
    fn();
  });
}

/* --- bounded retry with backoff + jitter ---------------------------- */

export async function boundedRetry<T>(
  attempt: () => Promise<T>,
  opts?: { tries?: number; baseMs?: number },
): Promise<T> {
  const tries = opts?.tries ?? 3;
  const baseMs = opts?.baseMs ?? 600;
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    if (i > 0) {
      if (!isOnline()) {
        await waitUntilOnline(10_000);
      }
      const backoff = baseMs * 2 ** (i - 1);
      const jitter = Math.random() * backoff * 0.3;
      await new Promise((r) => setTimeout(r, backoff + jitter));
    }
    try {
      return await attempt();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function waitUntilOnline(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }
    const timer = setTimeout(done, timeoutMs);
    function done() {
      clearTimeout(timer);
      window.removeEventListener("online", done);
      resolve();
    }
    window.addEventListener("online", done, { once: true });
  });
}

/* --- boot -----------------------------------------------------------
   Installed once by PerfGate; every listener is passive and cheap.  */

export function bootPageLifecycle(): void {
  if (booted || typeof window === "undefined") return;
  booted = true;
  online = isOnline();

  document.addEventListener(
    "visibilitychange",
    () => {
      if (isPageHidden()) {
        hiddenAt = Date.now();
        for (const cb of hiddenCbs) safe(cb);
        for (const cb of cleanupCbs) safe(cb);
      } else {
        for (const cb of visibleCbs) safe(cb);
        /* a real return after an absence is a resume */
        if (Date.now() - hiddenAt > 1_000) {
          for (const cb of resumeCbs) safe(cb);
        }
        hiddenAt = 0;
      }
    },
    { passive: true },
  );

  /* bfcache restore — the page came back from the back/forward cache */
  window.addEventListener("pageshow", (event) => {
    const persisted = (event as PageTransitionEvent).persisted === true;
    if (persisted) {
      for (const cb of resumeCbs) safe(cb);
    }
  });

  /* the visitor is leaving — drop what can be dropped early */
  window.addEventListener("pagehide", () => {
    for (const cb of cleanupCbs) safe(cb);
  });

  /* Android page lifecycle: the browser may freeze or kill the page */
  document.addEventListener("freeze", () => {
    for (const cb of cleanupCbs) safe(cb);
  });
  document.addEventListener("resume", () => {
    for (const cb of resumeCbs) safe(cb);
  });

  window.addEventListener("online", () => {
    online = true;
    for (const cb of onlineCbs) safe(cb);
  });
  window.addEventListener("offline", () => {
    online = false;
    for (const cb of offlineCbs) safe(cb);
  });
}

function safe(cb: Callback): void {
  try {
    cb();
  } catch {
    /* one listener's failure never takes down the house */
  }
}
