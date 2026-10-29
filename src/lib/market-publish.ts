"use client";

import { create } from "zustand";
import { useMirror } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE PUBLISHING STATE — one small keep for every publish hand in    */
/*  the house. A creation's hand reads its own listing here; a press   */
/*  publishes (asking the passage first when the visitor walks       */
/*  anonymously), the progress is polled until the Mirror's words are  */
/*  written and the offering stands live — and the visitor never       */
/*  leaves the place where they pressed.                               */
/* ------------------------------------------------------------------ */

export type MarketKind = "book" | "music" | "art" | "research";

export interface OwnListing {
  id: string;
  kind: MarketKind;
  refId: string;
  refKind: string;
  title: string;
  creatorName: string;
  note: string | null;
  excerpt: string | null;
  cover: string | null;
  audioUrl: string | null;
  durationSec: number | null;
  pages: number | null;
  status: "publishing" | "live" | "cancelled" | "failed";
  progress: number;
  createdAt: string;
}

interface PublishStore {
  /** the keeper's own listings, by the creation's refId */
  byRef: Record<string, OwnListing>;
  loaded: boolean;
  /** a creation waiting for the passage: published the moment the
      visitor signs in (the same place, the same hand) */
  pendingRef: { kind: MarketKind; refId: string; refKind: string; payload?: Record<string, unknown> } | null;
  error: string | null;
  loadMine: () => Promise<void>;
  publish: (
    kind: MarketKind,
    refId: string,
    refKind: "library" | "music",
    payload?: Record<string, unknown>
  ) => Promise<boolean>;
  cancel: (listingId: string) => Promise<void>;
  clearPending: () => void;
  setError: (e: string | null) => void;
}

let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function readOwn(refId?: string): Promise<OwnListing[] | null> {
  try {
    const res = await fetch(
      `/api/marketplace/publish${refId ? `?refId=${encodeURIComponent(refId)}` : ""}`,
      { cache: "no-store" }
    );
    if (res.status === 401) return null;
    const data = (await res.json().catch(() => null)) as {
      listings?: OwnListing[];
    } | null;
    return data?.listings ?? null;
  } catch {
    return null;
  }
}

function schedulePoll(get: () => PublishStore, set: (p: Partial<PublishStore>) => void) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    const anyPublishing = Object.values(get().byRef).some((l) => l.status === "publishing");
    if (!anyPublishing) return;
    const rows = await readOwn();
    if (rows) {
      set({ byRef: { ...get().byRef, ...Object.fromEntries(rows.map((r) => [r.refId, r])) } });
      schedulePoll(get, set);
    }
  }, 2500);
}

/* THE LAYERING LAW — the passage modal rests beneath the zoomed room
   (z-95) and beneath the market world (z-92): every layer above it is
   laid down before the ask rises, so the ask is always seen. */
function askPassageHere(): void {
  const s = useMirror.getState();
  if (s.workspaceZoomed) s.setWorkspaceZoomed(false);
  if (s.marketOpen) s.closeMarket();
  s.openAuth("signin");
}

export const useMarketPublish = create<PublishStore>((set, get) => ({
  byRef: {},
  loaded: false,
  pendingRef: null,
  error: null,

  loadMine: async () => {
    const me = useMirror.getState().me;
    if (!me) {
      set({ byRef: {}, loaded: true });
      return;
    }
    const rows = await readOwn();
    if (rows) {
      set({
        byRef: { ...get().byRef, ...Object.fromEntries(rows.map((r) => [r.refId, r])) },
        loaded: true,
      });
    }
    schedulePoll(get, set);
  },

  publish: async (kind, refId, refKind, payload) => {
    const me = useMirror.getState().me;
    set({ error: null });
    if (!me) {
      /* THE PASSAGE FIRST — the visitor is asked to sign in where they
         stand; the offering publishes itself the moment they arrive.
         THE LAYERING LAW — the passage modal rests beneath the zoomed
         room and beneath the market world, so every layer above it is
         laid down first: the ask must be SEEN to be answered. */
      askPassageHere();
      set({ pendingRef: { kind, refId, refKind, payload } });
      return false;
    }
    try {
      const res = await fetch("/api/marketplace/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, refId, refKind, ...payload }),
      });
      const data = (await res.json().catch(() => null)) as {
        listing?: OwnListing;
        error?: string;
        code?: string;
      } | null;
      if (res.status === 401 || data?.code === "SIGN_IN_REQUIRED") {
        askPassageHere();
        set({ pendingRef: { kind, refId, refKind, payload } });
        return false;
      }
      if (!res.ok || !data?.listing) {
        set({ error: data?.error ?? "The shelf rested a moment." });
        return false;
      }
      set({
        byRef: { ...get().byRef, [data.listing.refId]: data.listing },
        pendingRef: null,
      });
      schedulePoll(get, set);
      return true;
    } catch {
      set({ error: "The shelf rested a moment. Breathe, then offer again." });
      return false;
    }
  },

  cancel: async (listingId) => {
    try {
      const res = await fetch(`/api/marketplace/publish?id=${encodeURIComponent(listingId)}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      const byRef = { ...get().byRef };
      for (const [refId, l] of Object.entries(byRef)) {
        if (l.id === listingId) byRef[refId] = { ...l, status: "cancelled", progress: 0 };
      }
      set({ byRef });
    } catch {
      /* the hand rests */
    }
  },

  clearPending: () => set({ pendingRef: null }),
  setError: (e) => set({ error: e }),
}));

/* THE ARRIVAL LAW — the moment the visitor's passage stands, a waiting
   offering publishes itself: the same hand, the same place. */
if (typeof window !== "undefined") {
  let lastMe: string | null = null;
  useMirror.subscribe((s) => {
    const meKey = s.me?.email ?? null;
    if (meKey === lastMe) return;
    const wasAnon = lastMe === null;
    lastMe = meKey;
    if (meKey && wasAnon) {
      const st = useMarketPublish.getState();
      void st.loadMine();
      const pending = st.pendingRef;
      if (pending) {
        void useMarketPublish
          .getState()
          .publish(pending.kind, pending.refId, pending.refKind as "library" | "music", pending.payload);
      }
    }
  });
}
