"use client";

/* ------------------------------------------------------------------ */
/*  tool-history.ts — THE HISTORY OF EVERY WORK.                       */
/*                                                                     */
/*  One quiet shelf that gathers everything the visitor's tools have   */
/*  made and kept on their own device — every standing room thread,    */
/*  every kept conversation of the deep walks, every woven dream       */
/*  volume, every light code — so a closed tab, a mistaken swipe, a    */
/*  dying battery never takes a work away. The profile's HISTORY       */
/*  section reads this shelf and hands each work back exactly where    */
/*  it was left: the same room, the same conversation, the same page.  */
/*                                                                     */
/*  Nothing new is stored here — the tools already keep their own      */
/*  works (the rooms' own keeps, the chat archive, the dream shelf,    */
/*  the light codes). This module only walks those shelves and lines   */
/*  them up: the standing room threads first, then everything newest   */
/*  first.                                                             */
/* ------------------------------------------------------------------ */

import {
  listChats,
  type ArchivedChat,
  type ChatSurface,
} from "@/lib/chat-archive";
import { loadShelf, type ShelfVolume } from "@/lib/book-shelf";
import type { LcTrack } from "@/lib/data/light-codes";
import type { ToolTabKey } from "@/lib/mirror-store";

export type ToolWorkKind =
  | "manifest" // the Manifest room's standing thread
  | "quantum" // the Quantum room / the deep quantum walk
  | "evolvemed" // Evolve Med's kept conversation
  | "healx" // the evolved medical field's room
  | "forge" // the Invent / forge room
  | "artx" // the atelier of visions
  | "interplanetary" // the interplanetary walk
  | "healing" // the healing walk
  | "akashic" // the Akashic records
  | "dreambook" // a dream volume on the shelf
  | "lightcodes"; // a light code

export interface ToolWork {
  id: string;
  kind: ToolWorkKind;
  title: string;
  at: string; // ISO timestamp — "" for the standing threads
  detail?: string;
  /* the precise way back */
  resume:
    | { type: "chat"; surface: ChatSurface; chatId: string }
    | { type: "tab"; tab: ToolTabKey }
    | { type: "dreambook"; volume: ShelfVolume }
    | { type: "view"; kind: Extract<ToolWorkKind, "lightcodes"> };
}

/* ---- the rooms' own keeps (the merged app's standing threads) ----- */

interface StoredRoomTurn {
  q?: unknown;
  a?: unknown;
}

const ROOM_SHELVES: {
  key: string;
  kind: ToolWorkKind;
  tab: ToolTabKey;
}[] = [
  { key: "mirror:room-manifest", kind: "manifest", tab: "mirroros" },
  { key: "mirror:room-invent", kind: "forge", tab: "invent" },
  { key: "mirror:room-quantum", kind: "quantum", tab: "quantum" },
  { key: "mirror:room-healx", kind: "healx", tab: "healx" },
  { key: "mirror:room-artx", kind: "artx", tab: "artx" },
];

function roomWorks(): ToolWork[] {
  if (typeof window === "undefined") return [];
  const out: ToolWork[] = [];
  for (const shelf of ROOM_SHELVES) {
    try {
      const raw = window.localStorage.getItem(shelf.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) continue;
      const turns = (parsed as StoredRoomTurn[]).filter(
        (t) => typeof t?.q === "string" && (t.q as string).trim()
      );
      if (turns.length === 0) continue;
      out.push({
        id: `room:${shelf.key}`,
        kind: shelf.kind,
        title: String(turns[turns.length - 1].q).slice(0, 80),
        at: "", // the standing thread — no time, it lives now
        detail: String(turns.length),
        resume: { type: "tab", tab: shelf.tab },
      });
    } catch {
      /* a closed keep is simply no work at all */
    }
  }
  return out;
}

/* ---- the deep walks' kept conversations --------------------------- */

const CHAT_TOOLS: {
  surface: ChatSurface;
  kind: ToolWorkKind;
}[] = [
  { surface: "px", kind: "quantum" },
  { surface: "em", kind: "evolvemed" },
  { surface: "interplanetary", kind: "interplanetary" },
  { surface: "healing", kind: "healing" },
];

function chatWorks(): ToolWork[] {
  const out: ToolWork[] = [];
  for (const { surface, kind } of CHAT_TOOLS) {
    const chats = listChats(surface).filter((c) => c.messages.length > 0);
    for (const c of chats.slice(0, 12)) {
      out.push({
        id: `${surface}:${c.id}`,
        kind,
        title: c.title || "…",
        at: c.savedAt,
        detail: `${c.messages.length}`,
        resume: { type: "chat", surface, chatId: c.id },
      });
    }
  }
  return out;
}

/* ---- the dream shelf and the light codes --------------------------- */

function dreamWorks(): ToolWork[] {
  return loadShelf()
    .filter((v) => v.pages.length > 0)
    .map((v) => ({
      id: `dream:${v.bookId}`,
      kind: "dreambook" as const,
      title: v.title || "…",
      at: v.savedAt,
      detail: `${v.pages.length}`,
      resume: { type: "dreambook" as const, volume: v },
    }));
}

function lightWorks(tracks: LcTrack[]): ToolWork[] {
  return tracks
    .filter((t) => t && (t.title || t.intention))
    .slice(0, 12)
    .map((t): ToolWork => ({
      id: `lc:${t.id}`,
      kind: "lightcodes" as const,
      title: t.title || t.intention || "…",
      at: new Date(t.createdAt).toISOString(),
      detail: t.mode,
      resume: { type: "view" as const, kind: "lightcodes" as const },
    }));
}

/** The whole shelf — standing rooms first, then newest first. */
export function listToolWorks(lcTracks: LcTrack[] = []): ToolWork[] {
  const standing = roomWorks();
  const dated = [...chatWorks(), ...dreamWorks(), ...lightWorks(lcTracks)].sort(
    (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)
  );
  return [...standing, ...dated];
}

export const TOOL_WORK_LABELS: Record<ToolWorkKind, string> = {
  manifest: "Manifest OS",
  quantum: "Quantum World",
  evolvemed: "Evolve Med",
  healx: "The evolved medical field",
  forge: "The Forge",
  artx: "The Atelier",
  interplanetary: "Interplanetary walk",
  healing: "Healing walk",
  akashic: "Akashic records",
  dreambook: "Dream Book",
  lightcodes: "Light codes",
};

export type { ArchivedChat };
