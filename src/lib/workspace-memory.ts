"use client";

/* ------------------------------------------------------------------ */
/*  THE WORKSPACE'S QUIET MEMORY — the invisible layer of navigation.  */
/*                                                                     */
/*  The visitor should never think about where something was saved or  */
/*  how to return to an idea. This ledger remembers the meaningful     */
/*  state of the workspace — the last conversation, the readings, the  */
/*  saved spaces (pins), and the composer's own drafts — so the house  */
/*  can offer ONE gentle return instead of forcing the visitor into    */
/*  any state they did not choose.                                     */
/*                                                                     */
/*  THE RESPECT LAW — nothing opens by itself. The memory only powers  */
/*  a one-action "continue where you left off" hand and the universal  */
/*  search; the visitor still chooses where to stand. No pointer       */
/*  movements, no unnecessary personal data — only what serves the     */
/*  return. Everything rests on this device alone (the house's own     */
/*  zero-database law).                                                */
/* ------------------------------------------------------------------ */

import { create } from "zustand";

export type MemoryCreation = "akashic" | "book" | "invent" | "music" | "video";

/** The last meaningful activity — the one hand the house extends. */
export interface LastActivity {
  kind: "conversation" | "creation" | "reading" | "walk";
  title: string;
  /** For conversations — the ledger's own id. */
  convId?: string;
  /** The conversation's own question (the stable key across maps). */
  question?: string;
  /** For creations and readings — the workspace that holds them. */
  view?: string;
  creation?: MemoryCreation;
  /** For books — the shelf's own volume id. */
  bookId?: string;
  at: number;
}

/** A saved space — a branch, a conversation or a making the visitor
 *  pinned so the highlighted pathway stays discoverable later. */
export interface PinEntry {
  /** Stable across maps: `conv:<id>` for living conversations,
   *  `q:<text>` for branches, `cr:<kind>` for makings. */
  id: string;
  kind: "conversation" | "branch" | "creation";
  text: string;
  convId?: string;
  creation?: MemoryCreation;
  at: number;
}

/** Where a reading rested — books keep their page; the Library keeps
 *  the door it last opened. */
export interface ReadingPos {
  at: number;
  title: string;
  view: string;
  pageIdx?: number;
  bookId?: string;
}

interface MemoryState {
  last: LastActivity | null;
  pins: PinEntry[];
  reading: Record<string, ReadingPos>;
  /** The composer's own drafts, per conversation — a navigation away
   *  never eats a half-spoken thought. */
  drafts: Record<string, string>;
  recordLast: (a: Omit<LastActivity, "at">) => void;
  pin: (p: Omit<PinEntry, "at">) => void;
  unpin: (id: string) => void;
  togglePin: (p: Omit<PinEntry, "at">) => boolean;
  setReading: (key: string, pos: Omit<ReadingPos, "at">) => void;
  setDraft: (convId: string, text: string) => void;
  forget: () => void;
}

/* --------------------------- persistence --------------------------- */

const PERSIST_KEY = "mirror:workspace-memory-v1";
const MAX_PINS = 24;
const MAX_READING = 24;
const MAX_DRAFTS = 12;
const DRAFT_CAP = 2000;

function loadStored(): {
  last: LastActivity | null;
  pins: PinEntry[];
  reading: Record<string, ReadingPos>;
  drafts: Record<string, string>;
} {
  if (typeof window === "undefined") {
    return { last: null, pins: [], reading: {}, drafts: {} };
  }
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return { last: null, pins: [], reading: {}, drafts: {} };
    const p = JSON.parse(raw) as {
      last?: LastActivity | null;
      pins?: PinEntry[];
      reading?: Record<string, ReadingPos>;
      drafts?: Record<string, string>;
    };
    return {
      last: p.last && p.last.title ? p.last : null,
      pins: Array.isArray(p.pins) ? p.pins.filter((x) => x?.id && x.text) : [],
      reading: p.reading && typeof p.reading === "object" ? p.reading : {},
      drafts: p.drafts && typeof p.drafts === "object" ? p.drafts : {},
    };
  } catch {
    return { last: null, pins: [], reading: {}, drafts: {} };
  }
}

let persistTimer: number | null = null;
function schedulePersist(get: () => MemoryState) {
  if (typeof window === "undefined") return;
  if (persistTimer != null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const s = get();
      const reading = Object.fromEntries(
        Object.entries(s.reading)
          .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
          .slice(0, MAX_READING)
      );
      window.localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({
          last: s.last,
          pins: s.pins.slice(0, MAX_PINS),
          reading,
          drafts: Object.fromEntries(
            Object.entries(s.drafts)
              .filter(([, v]) => v.trim().length > 0)
              .slice(-MAX_DRAFTS)
          ),
        })
      );
    } catch {
      /* a closed vault holds no grudge */
    }
  }, 600);
}

const boot =
  typeof window !== "undefined"
    ? loadStored()
    : { last: null, pins: [] as PinEntry[], reading: {}, drafts: {} };

export const useWorkspaceMemory = create<MemoryState>((set, get) => ({
  last: boot.last,
  pins: boot.pins,
  reading: boot.reading,
  drafts: boot.drafts,

  recordLast: (a) => {
    if (!a.title?.trim()) return;
    set({ last: { ...a, title: a.title.trim(), at: Date.now() } });
    schedulePersist(get);
  },

  pin: (p) => {
    const id = p.id;
    set((s) =>
      s.pins.some((x) => x.id === id)
        ? s
        : { pins: [{ ...p, at: Date.now() }, ...s.pins].slice(0, MAX_PINS) }
    );
    schedulePersist(get);
  },

  unpin: (id) => {
    set((s) => ({ pins: s.pins.filter((x) => x.id !== id) }));
    schedulePersist(get);
  },

  togglePin: (p) => {
    const s = get();
    const exists = s.pins.some((x) => x.id === p.id);
    if (exists) {
      set({ pins: s.pins.filter((x) => x.id !== p.id) });
    } else {
      set({ pins: [{ ...p, at: Date.now() }, ...s.pins].slice(0, MAX_PINS) });
    }
    schedulePersist(get);
    return !exists;
  },

  setReading: (key, pos) => {
    if (!key) return;
    set((s) => ({
      reading: {
        ...s.reading,
        [key]: { ...pos, at: Date.now() },
      },
      last:
        pos.view === "dreambook" || pos.view === "akashic"
          ? {
              kind: "reading",
              title: pos.title || s.last?.title || "",
              view: pos.view,
              bookId: pos.bookId,
              at: Date.now(),
            }
          : s.last,
    }));
    schedulePersist(get);
  },

  setDraft: (convId, text) => {
    set((s) => {
      const clean = (text ?? "").slice(0, DRAFT_CAP);
      if (!clean) {
        if (!(convId in s.drafts)) return s;
        const drafts = { ...s.drafts };
        delete drafts[convId];
        return { drafts };
      }
      if (s.drafts[convId] === clean) return s;
      return { drafts: { ...s.drafts, [convId]: clean } };
    });
    schedulePersist(get);
  },

  forget: () => {
    set({ last: null, pins: [], reading: {}, drafts: {} });
    schedulePersist(get);
  },
}));

/* --------------------------- read helpers -------------------------- */

/** The stable pin id for a living conversation. */
export function convPinId(convId: string): string {
  return `conv:${convId}`;
}

/** The stable pin id for a branch stone or a making. */
export function nodePinId(text: string, creation?: string): string {
  return creation ? `cr:${creation}:${text}` : `q:${text}`;
}

/** The reading key for a book volume. */
export function bookReadingKey(bookId: string): string {
  return `book:${bookId}`;
}
