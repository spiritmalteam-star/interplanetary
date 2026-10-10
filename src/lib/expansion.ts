"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  studyExpansion,
  type ExpansionEventKind,
  type ExpansionEventLite,
  type ExpansionMirror,
  type ExpansionSignals,
} from "@/lib/expansion-core";

/* ------------------------------------------------------------------ */
/*  THE EXPANSION MIRROR — the visitor's own reactive window into the  */
/*  algorithm that studies their walk.                                 */
/*                                                                     */
/*  The pure law lives in expansion-core.ts (shared with the server's  */
/*  keeper). This file is the visitor's side: local events recorded    */
/*  in the same breath a branch is picked, the server's studied        */
/*  reading settling over them, one event to re-render every mirror    */
/*  on the page.                                                       */
/* ------------------------------------------------------------------ */

export type {
  ExpansionEventKind,
  ExpansionEventLite,
  ExpansionMirror,
  ExpansionSignals,
};
export {
  EXPANSION_STAGES,
  stageForScore,
  studyExpansion,
} from "@/lib/expansion-core";

const EVENTS_KEY = "mirror-expansion-events";
const MIRROR_KEY = "mirror-expansion-mirror";
const EVENTS_CAP = 400;
export const EXPANSION_EVENT = "mirror:expansion";

function loadLocalEvents(): ExpansionEventLite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is ExpansionEventLite =>
          !!e &&
          typeof e === "object" &&
          typeof (e as ExpansionEventLite).kind === "string" &&
          typeof (e as ExpansionEventLite).at === "number"
      )
      .slice(0, EVENTS_CAP);
  } catch {
    return [];
  }
}

function saveLocalEvents(events: ExpansionEventLite[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify(events.slice(-EVENTS_CAP))
    );
  } catch {
    /* quiet */
  }
}

function loadCachedMirror(): ExpansionMirror | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExpansionMirror;
    if (typeof parsed?.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedMirror(m: ExpansionMirror): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify(m));
  } catch {
    /* quiet */
  }
}

/** Record one expansion event — locally instant, server-side forever. */
export function recordExpansion(
  kind: ExpansionEventKind,
  opts?: { scope?: string | null; movement?: string | null }
): void {
  if (typeof window === "undefined") return;
  const events = loadLocalEvents();
  events.push({
    kind,
    scope: opts?.scope ?? null,
    movement: opts?.movement ?? null,
    at: Date.now(),
  });
  saveLocalEvents(events);
  window.dispatchEvent(new CustomEvent(EXPANSION_EVENT));

  /* the server studies the continuations at its own pace — never the
     visitor's */
  void fetch("/api/expansion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      scope: opts?.scope ?? null,
      movement: opts?.movement ?? null,
    }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.mirror) saveCachedMirror(data.mirror as ExpansionMirror);
    })
    .catch(() => {
      /* the mirror rests until the server returns */
    });
}

/** Pull the server's own reading of the mirror. */
export async function fetchExpansionMirror(): Promise<ExpansionMirror | null> {
  try {
    const r = await fetch("/api/expansion", { cache: "no-store" });
    if (!r.ok) return null;
    const data = (await r.json()) as { mirror?: ExpansionMirror };
    if (data.mirror) saveCachedMirror(data.mirror);
    return data.mirror ?? null;
  } catch {
    return null;
  }
}

/* ------------------------ the reactive hook ------------------------- */

/**
 * The visitor's mirror, reactive: the server's studied reading when it
 * arrives, the local study in the same breath a branch is picked.
 */
export function useExpansionMirror(): {
  mirror: ExpansionMirror | null;
  ready: boolean;
  record: typeof recordExpansion;
  refresh: () => void;
} {
  const [mirror, setMirror] = useState<ExpansionMirror | null>(null);
  const [ready, setReady] = useState(false);
  const inFlight = useRef(false);

  const localStudy = useCallback(() => {
    const events = loadLocalEvents();
    if (events.length === 0) return null;
    const cached = loadCachedMirror();
    return studyExpansion(events, cached?.score ?? 0);
  }, []);

  const refresh = useCallback(() => {
    /* local truth first — the same breath */
    const local = localStudy();
    setMirror((prev) => local ?? prev ?? null);
    /* the server's studied reading settles over it */
    if (!inFlight.current) {
      inFlight.current = true;
      void fetchExpansionMirror()
        .then((m) => {
          if (m) setMirror(m);
        })
        .finally(() => {
          inFlight.current = false;
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, [localStudy]);

  useEffect(() => {
    /* hydration law — never study inside the first paint */
    const id = window.setTimeout(refresh, 0);
    window.addEventListener(EXPANSION_EVENT, refresh);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(EXPANSION_EVENT, refresh);
    };
  }, [refresh]);

  return { mirror, ready, record: recordExpansion, refresh };
}
