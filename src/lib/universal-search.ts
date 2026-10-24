"use client";

/* ------------------------------------------------------------------ */
/*  UNIVERSAL SEARCH — one field that finds everything the house keeps.*/
/*                                                                     */
/*  One index over the visitor's own authorized content: the living    */
/*  conversations, the map's branch stones, the pinned spaces, the     */
/*  readings in progress, and the makings. Pure mathematics — no sky,  */
/*  no server, no waiting: the visitor's own words answered from the   */
/*  visitor's own shelf (protocol 5).                                  */
/*                                                                     */
/*  Selecting a result restores the appropriate context: a             */
/*  conversation reopens where it stood, a branch focuses, a reading   */
/*  resumes, a making returns to the map or its own workspace.         */
/* ------------------------------------------------------------------ */

import type { PinEntry, ReadingPos, MemoryCreation } from "@/lib/workspace-memory";

export interface CatalogNode {
  id: string;
  text: string;
  role: string;
  kind: string;
  creation?: string;
  convId?: string;
  depth: number;
}

/* THE CATALOG'S OWN SHELF — the navigator broadcasts quietly, but a
   menu opened later must still read the latest map: one module-level
   mirror keeps the freshest catalog for late subscribers. */
let latestCatalog: CatalogNode[] = [];

export function setLatestCatalog(nodes: CatalogNode[]): void {
  latestCatalog = nodes;
}

export function peekCatalog(): CatalogNode[] {
  return latestCatalog;
}

export interface SearchHit {
  type: "conversation" | "branch" | "creation" | "pin" | "reading";
  title: string;
  sub?: string;
  score: number;
  payload: {
    convId?: string;
    question?: string;
    /** A live map node — the navigator focuses it directly. */
    nodeId?: string;
    creation?: MemoryCreation;
    view?: string;
    bookId?: string;
    pageIdx?: number;
    pinId?: string;
  };
}

interface SearchSources {
  catalog: CatalogNode[];
  pins: PinEntry[];
  /** The living conversations' own threads (question + spoken words). */
  convs: { question: string; convId: string; excerpt: string; turns: number }[];
  readings: { key: string; pos: ReadingPos }[];
}

function norm(s: string): string {
  return (s ?? "").toLowerCase().trim();
}

function words(s: string): string[] {
  return norm(s).match(/[a-zà-ÿа-я\u0400-\u04ff\u0370-\u03ff][a-zà-ÿа-я\u0400-\u04ff\u0370-\u03ff']{2,}/g) ?? [];
}

/** A light score: title containment leads, shared words follow. */
function scoreMatch(query: string, title: string, sub?: string): number {
  const q = norm(query);
  if (!q) return 0;
  const t = norm(title);
  let s = 0;
  if (t === q) s += 12;
  else if (t.startsWith(q)) s += 9;
  else if (t.includes(q)) s += 7;
  if (sub && norm(sub).includes(q)) s += 3;
  const qw = words(query);
  if (qw.length > 0) {
    const tw = new Set(words(title));
    let shared = 0;
    for (const w of qw) {
      if (tw.has(w)) shared += 1;
      else if ([...tw].some((x) => x.startsWith(w) || w.startsWith(x))) shared += 0.5;
    }
    s += (shared / qw.length) * 4;
  }
  return s;
}

/** THE ONE SEARCH — every saved ground, one honest ranking. */
export function searchAll(query: string, src: SearchSources): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  const push = (h: SearchHit) => {
    if (h.score <= 0) return;
    /* one ground, one row — a pinned conversation and its own thread
       are the same place (the pin wins: it is the visitor's own mark) */
    const key =
      h.payload.convId ?? h.payload.question ?? h.payload.bookId ?? h.title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(h);
  };

  /* 1 — the visitor's own pins lead (they saved these on purpose) */
  for (const p of src.pins) {
    const s = scoreMatch(q, p.text) + 2.5;
    push({
      type: "pin",
      title: p.text,
      sub:
        p.kind === "conversation"
          ? "Saved conversation"
          : p.kind === "creation"
            ? "Saved making"
            : "Saved branch",
      score: s,
      payload: {
        convId: p.convId,
        question: p.convId ? undefined : p.text,
        creation: p.creation,
        pinId: p.id,
      },
    });
  }

  /* 2 — the living conversations (their threads carry the words) */
  for (const c of src.convs) {
    const inThread = norm(c.excerpt).includes(q);
    let s = scoreMatch(q, c.question, c.excerpt);
    if (inThread) s += 2;
    push({
      type: "conversation",
      title: c.question,
      sub:
        c.turns > 1
          ? `Conversation · ${c.turns} exchanges`
          : "Conversation",
      score: s,
      payload: { convId: c.convId, question: c.question },
    });
  }

  /* 3 — the map's branch stones and makings (the walk's own ground) */
  for (const n of src.catalog) {
    const isCreation = n.role === "creation" || !!n.creation;
    const s =
      scoreMatch(q, n.text) + (isCreation ? 0.4 : 0) - Math.min(1.2, n.depth * 0.08);
    push({
      type: isCreation ? "creation" : "branch",
      title: n.text,
      sub: isCreation
        ? `${n.creation ?? n.kind} on the map`
        : n.depth <= 1
          ? "Branch near the heart"
          : "Branch on the map",
      score: s,
      payload: {
        nodeId: n.id,
        question: n.text,
        creation: (n.creation as MemoryCreation) ?? undefined,
      },
    });
  }

  /* 4 — the readings (books remember their page) */
  for (const { key, pos } of src.readings) {
    const s = scoreMatch(q, pos.title, key);
    push({
      type: "reading",
      title: pos.title || key,
      sub: pos.view === "dreambook" ? "A book you were reading" : "The Akashic Library",
      score: s,
      payload: { view: pos.view, bookId: pos.bookId, pageIdx: pos.pageIdx },
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}
