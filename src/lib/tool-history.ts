"use client";

/* ------------------------------------------------------------------ */
/*  tool-history.ts — THE HISTORY OF EVERY WORK.                       */
/*                                                                     */
/*  One quiet shelf that gathers everything the visitor's tools have   */
/*  made and kept on their own device — every kept conversation of     */
/*  every room, every woven dream volume, every light code — so a      */
/*  closed tab, a mistaken swipe, a dying battery never takes a work   */
/*  away. The profile's HISTORY section reads this shelf and hands     */
/*  each work back exactly where it was left: the same room, the       */
/*  same conversation, the same page.                                  */
/*                                                                     */
/*  Nothing new is stored here — the tools already keep their own      */
/*  works (the chat archive, the dream shelf, the light codes). This   */
/*  module only walks those shelves and lines them up newest first.    */
/* ------------------------------------------------------------------ */

import {
  listChats,
  type ArchivedChat,
  type ChatSurface,
} from "@/lib/chat-archive";
import { loadShelf, type ShelfVolume } from "@/lib/book-shelf";
import type { LcTrack } from "@/lib/data/light-codes";

export type ToolWorkKind =
  | "manifest" // os — the Manifest OS
  | "quantum" // px — the Quantum World
  | "evolvemed" // em — Evolve Med
  | "akashic" // ax — the Akashic records
  | "forge" // forge — the Invent/Forge
  | "interplanetary" // the interplanetary walk
  | "healing" // the healing walk
  | "dreambook" // a dream volume on the shelf
  | "lightcodes"; // a light code

export interface ToolWork {
  id: string;
  kind: ToolWorkKind;
  title: string;
  at: string; // ISO timestamp
  detail?: string;
  /* the precise way back */
  resume:
    | { type: "chat"; surface: ChatSurface; chatId: string }
    | { type: "dreambook"; volume: ShelfVolume }
    | { type: "view"; kind: Extract<ToolWorkKind, "lightcodes"> };
}

const CHAT_TOOLS: {
  surface: ChatSurface;
  kind: ToolWorkKind;
}[] = [
  { surface: "os", kind: "manifest" },
  { surface: "px", kind: "quantum" },
  { surface: "em", kind: "evolvemed" },
  { surface: "ax", kind: "akashic" },
  { surface: "forge", kind: "forge" },
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

/** The whole shelf, newest first. */
export function listToolWorks(lcTracks: LcTrack[] = []): ToolWork[] {
  const all = [...chatWorks(), ...dreamWorks(), ...lightWorks(lcTracks)];
  return all.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

export const TOOL_WORK_LABELS: Record<ToolWorkKind, string> = {
  manifest: "Manifest OS",
  quantum: "Quantum World",
  evolvemed: "Evolve Med",
  akashic: "Akashic records",
  forge: "The Forge",
  interplanetary: "Interplanetary walk",
  healing: "Healing walk",
  dreambook: "Dream Book",
  lightcodes: "Light codes",
};

export type { ArchivedChat };
