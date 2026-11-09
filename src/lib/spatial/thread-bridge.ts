"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  THE THREAD BRIDGE — the quiet hand between the realm's own         */
/*  conversation and the Spatial Mirror's room.                        */
/*                                                                     */
/*  The landing thread lives inside the canopy as local state (the     */
/*  house's own design — the docked chat never touches the store's     */
/*  channel). This bridge mirrors the finished turns into a tiny       */
/*  external store so a workplace room may read them without the       */
/*  canopy ever lifting its state or changing a single call site.      */
/*  Only settled words cross — loading and failed turns rest.          */
/* ------------------------------------------------------------------ */

export interface BridgeTurn {
  q: string;
  a: string;
}

let turns: BridgeTurn[] = [];
const listeners = new Set<() => void>();

export const landingThreadBridge = {
  set(next: BridgeTurn[]): void {
    // only settled words travel; identity changes even when content
    // matches, so compare shallowly to keep listeners quiet
    if (
      turns.length === next.length &&
      turns.every((t, i) => t.q === next[i].q && t.a === next[i].a)
    ) {
      return;
    }
    turns = next;
    for (const listener of listeners) listener();
  },
  get(): BridgeTurn[] {
    return turns;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** The canopy's one-line hand: call with the live landing thread. */
export function useLandingThreadBridge(
  live: readonly { q: string; a: string; loading?: boolean; failed?: boolean }[]
): void {
  useEffect(() => {
    landingThreadBridge.set(
      live
        .filter((turn) => !turn.loading && !turn.failed && turn.a.trim())
        .map((turn) => ({ q: turn.q, a: turn.a }))
    );
  }, [live]);
}

/** The room's own ear — the mirrored turns, read reactively. */
export function useLandingTurns(): BridgeTurn[] {
  return useSyncExternalStore(
    landingThreadBridge.subscribe,
    landingThreadBridge.get,
    landingThreadBridge.get
  );
}
