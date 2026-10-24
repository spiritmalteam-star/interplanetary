"use client";

/* ------------------------------------------------------------------ */
/*  THE LIVING CONVERSATIONS — the branch's own room, kept.            */
/*                                                                     */
/*  Every conversation lives INSIDE the branch tree: a branch becomes  */
/*  a conversation, the conversation grows further branches, and every */
/*  exchange stays where it was born. This store is the quiet ledger   */
/*  behind the living conversation nodes — it holds each branch's own  */
/*  thread so a collapsed conversation reopens with every word it      */
/*  carried, and a sibling branch never mutates another's history.     */
/*                                                                     */
/*  THE PRESERVATION LAW — this ledger touches no Mirror Entity        */
/*  voice: the asks below ride the exact same doors (per-family        */
/*  endpoints, the same history shapes) the tree's own rooms have      */
/*  always spoken through. Nothing new is invented; nothing is moved.  */
/* ------------------------------------------------------------------ */

import { create } from "zustand";
import type { BranchType } from "@/lib/learning-branches";
import type { LearnedBranch } from "@/lib/learning-branches";
import type { BranchId } from "@/lib/data/suggestion-tree";
import { speakReply, EnergyError } from "@/lib/speak-client";
import { attachmentsToPayload, type ChatAttachment } from "@/components/mirror/attachments";
import { useMirror, type ChatMessage } from "@/lib/mirror-store";
import type { LanguageCode } from "@/lib/i18n/core";
import type { SideArtifactRef } from "@/lib/artifact-intent";
import type { VisualizationArtifact } from "@/lib/visualization";

/* ------------------------------ types ------------------------------ */

export type TurnStatus = "pending" | "loading" | "landed" | "failed";

export interface BranchTurn {
  q: string;
  a: string;
  status: TurnStatus;
  /** An honest failure line — the sky's own reason, spoken once. */
  error?: string;
  /** The words reached the sky but the fuel was out. */
  energy?: boolean;
  /** A restored transmission — the walk's own memory, not a new ask. */
  restored?: boolean;
  /** The channel message this turn belongs to (makings ride beside). */
  messageId?: string;
  /** The making's image answer (the visualization engine). */
  artifact?: VisualizationArtifact | null;
  /** A whole side activity brought into the conversation. */
  side?: SideArtifactRef | null;
}

export interface BranchConversation {
  id: string;
  /** The branch question — the tab's own title, never rewritten. */
  question: string;
  movement: BranchType;
  accent: string;
  /** The family voice this branch speaks through (suggestions' BranchId). */
  category: BranchId;
  /** The questions from the map's heart down to this branch. */
  lineage: string[];
  turns: BranchTurn[];
  /** The follow-up branches grown on the latest landed answer. */
  branches: LearnedBranch[];
  createdAt: number;
  exploredAt: number;
}

interface ConvState {
  convs: Record<string, BranchConversation>;
  activeConvId: string | null;
  /** Create (or find) a conversation; returns its id. */
  open: (input: {
    question: string;
    movement: BranchType;
    accent: string;
    category: BranchId;
    lineage: string[];
    restoredAnswer?: string;
  }) => string;
  setActive: (id: string | null) => void;
  markLoading: (question: string) => void;
  complete: (
    question: string,
    answer: string,
    opts?: { error?: string; energy?: boolean; message?: ChatMessage | null }
  ) => void;
  pushTurn: (convId: string, q: string) => void;
  patchTurn: (convId: string, index: number, patch: Partial<BranchTurn>) => void;
  setBranches: (convId: string, branches: LearnedBranch[]) => void;
  forgetAll: () => void;
}

/* --------------------------- persistence --------------------------- */

const PERSIST_KEY = "mirror:living-convos-v1";
const MAX_CONVS = 40;
const MAX_TURNS = 24;
const Q_CAP = 600;
const A_CAP = 6000;

type StoredConv = BranchConversation;

function loadStored(): {
  convs: Record<string, BranchConversation>;
  activeConvId: string | null;
} {
  if (typeof window === "undefined") return { convs: {}, activeConvId: null };
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return { convs: {}, activeConvId: null };
    const parsed = JSON.parse(raw) as {
      convs?: Record<string, StoredConv>;
      activeConvId?: string | null;
    };
    const convs: Record<string, BranchConversation> = {};
    for (const [id, c] of Object.entries(parsed.convs ?? {})) {
      if (!id || !c?.question || !Array.isArray(c.turns)) continue;
      /* THE HONEST LEDGER — a word still "loading" after the page's
         return can never arrive: interrupted turns are named, never
         left pending (a turn0 still pending rests until a live ask
         claims it or the visitor speaks again). */
      const turns = c.turns.map((t, i) =>
        t.status === "loading" || (t.status === "pending" && i > 0)
          ? {
              ...t,
              status: "failed" as TurnStatus,
              error:
                t.error ||
                "The words rested while you were away — speak once more.",
            }
          : t
      );
      convs[id] = { ...c, turns, branches: Array.isArray(c.branches) ? c.branches : [] };
    }
    const active =
      parsed.activeConvId && convs[parsed.activeConvId]
        ? parsed.activeConvId
        : null;
    return { convs, activeConvId: active };
  } catch {
    return { convs: {}, activeConvId: null };
  }
}

let persistTimer: number | null = null;
function schedulePersist(get: () => ConvState) {
  if (typeof window === "undefined") return;
  if (persistTimer != null) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const { convs } = get();
      const ranked = Object.values(convs)
        .sort((a, b) => b.exploredAt - a.exploredAt)
        .slice(0, MAX_CONVS);
      const out: Record<string, BranchConversation> = {};
      for (const c of ranked) {
        out[c.id] = {
          ...c,
          turns: c.turns.slice(-MAX_TURNS).map((t) => ({
            ...t,
            q: t.q.slice(0, Q_CAP),
            a: t.a.slice(0, A_CAP),
          })),
        };
      }
      window.localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({ convs: out, activeConvId: get().activeConvId })
      );
    } catch {
      /* a closed vault holds no grudge — the walk simply stays */
    }
  }, 800);
}

let convSeq = 0;
function newConvId(): string {
  convSeq += 1;
  return `conv:${Date.now().toString(36)}:${convSeq.toString(36)}:${Math.floor(
    Math.random() * 1e6
  ).toString(36)}`;
}

/* ------------------------------ store ------------------------------ */

const boot =
  typeof window !== "undefined"
    ? loadStored()
    : { convs: {} as Record<string, BranchConversation>, activeConvId: null };

export const useConversations = create<ConvState>((set, get) => ({
  convs: boot.convs,
  activeConvId: null, // the visitor chooses where to stand — nothing opens by itself

  open: ({
    question,
    movement,
    accent,
    category,
    lineage,
    restoredAnswer,
  }) => {
    const q = question.trim();
    if (!q) return "";
    const existing = Object.values(get().convs).find(
      (c) => c.question.toLowerCase() === q.toLowerCase()
    );
    const now = Date.now();
    if (existing) {
      set((s) => ({
        activeConvId: existing.id,
        convs: {
          ...s.convs,
          [existing.id]: { ...existing, exploredAt: now },
        },
      }));
      schedulePersist(get);
      return existing.id;
    }
    const id = newConvId();
    const conv: BranchConversation = {
      id,
      question: q,
      movement,
      accent,
      category,
      lineage: lineage.slice(-12),
      turns: [
        restoredAnswer
          ? {
              q,
              a: restoredAnswer,
              status: "landed",
              restored: true,
            }
          : { q, a: "", status: "pending" },
      ],
      branches: [],
      createdAt: now,
      exploredAt: now,
    };
    set((s) => ({
      convs: { ...s.convs, [id]: conv },
      activeConvId: id,
    }));
    schedulePersist(get);
    return id;
  },

  setActive: (id) => {
    set({ activeConvId: id });
    schedulePersist(get);
  },

  markLoading: (question) => {
    const q = question.trim().toLowerCase();
    set((s) => {
      const conv = Object.values(s.convs).find(
        (c) => c.question.toLowerCase() === q
      );
      if (!conv) return s;
      const turns = conv.turns.map((t, i) =>
        i === 0 && (t.status === "pending" || t.status === "failed")
          ? { ...t, status: "loading" as TurnStatus, error: undefined, energy: undefined }
          : t
      );
      return {
        convs: { ...s.convs, [conv.id]: { ...conv, turns, exploredAt: Date.now() } },
      };
    });
    schedulePersist(get);
  },

  complete: (question, answer, opts) => {
    const q = question.trim().toLowerCase();
    set((s) => {
      const conv = Object.values(s.convs).find(
        (c) => c.question.toLowerCase() === q
      );
      if (!conv) return s;
      const turns = conv.turns.map((t, i) =>
        i === 0 && (t.status === "pending" || t.status === "loading")
          ? {
              ...t,
              status: (opts?.error ? "failed" : "landed") as TurnStatus,
              a: opts?.error ? t.a : answer,
              error: opts?.error,
              energy: opts?.energy,
              messageId: opts?.message?.id,
              artifact: opts?.message?.artifact ?? null,
              side: opts?.message?.sideArtifact ?? null,
            }
          : t
      );
      return {
        convs: { ...s.convs, [conv.id]: { ...conv, turns, exploredAt: Date.now() } },
      };
    });
    schedulePersist(get);
  },

  pushTurn: (convId, q) => {
    set((s) => {
      const conv = s.convs[convId];
      if (!conv) return s;
      const turns = [
        ...conv.turns,
        { q: q.trim(), a: "", status: "loading" as TurnStatus },
      ].slice(-MAX_TURNS);
      return {
        convs: {
          ...s.convs,
          [convId]: { ...conv, turns, exploredAt: Date.now() },
        },
      };
    });
    schedulePersist(get);
  },

  patchTurn: (convId, index, patch) => {
    set((s) => {
      const conv = s.convs[convId];
      if (!conv) return s;
      const turns = conv.turns.map((t, i) => (i === index ? { ...t, ...patch } : t));
      return {
        convs: {
          ...s.convs,
          [convId]: { ...conv, turns, exploredAt: Date.now() },
        },
      };
    });
    schedulePersist(get);
  },

  setBranches: (convId, branches) => {
    set((s) => {
      const conv = s.convs[convId];
      if (!conv) return s;
      return {
        convs: { ...s.convs, [convId]: { ...conv, branches } },
      };
    });
    schedulePersist(get);
  },

  forgetAll: () => {
    set({ convs: {}, activeConvId: null });
    schedulePersist(get);
  },
}));

/* ------------------------- read helpers ---------------------------- */

export function findConvByQuestion(question: string): BranchConversation | null {
  const q = question.trim().toLowerCase();
  if (!q) return null;
  const convs = useConversations.getState().convs;
  return Object.values(convs).find((c) => c.question.toLowerCase() === q) ?? null;
}

/* ------------------- the family's own continuation ------------------ */

/* THE SAME DOORS — a follow-up inside a living conversation rides the
   exact doors the tree's rooms have always used: the atelier speaks
   through /api/artx, the manifest room through /api/mirror-os, every
   other family through /api/transmission with its own mode. The
   history reuses the shared exchange up to the branching point (the
   branch's own transmission) plus this branch's own continuation —
   sibling branches are never mixed in. */

export async function askBranchRoom(
  conv: BranchConversation,
  query: string,
  thread: { q: string; a: string }[],
  attachments?: ChatAttachment[]
): Promise<string> {
  const language = useMirror.getState().language as LanguageCode;
  const walk = conv.lineage.slice(-8);
  const carried =
    attachments && attachments.length > 0
      ? attachmentsToPayload(attachments)
      : {};
  const branchQuestion = conv.turns[0]?.q ?? conv.question;
  const transmission = conv.turns[0]?.a ?? "";
  if (conv.category === "artx") {
    return speakReply(
      "/api/artx",
      {
        query,
        language,
        walk,
        ...carried,
        history: [
          { role: "ax", text: transmission },
          ...thread.flatMap((t) => [
            { role: "visitor", text: t.q },
            { role: "ax", text: t.a },
          ]),
        ].slice(-10),
      },
      "reply",
      "The field is quiet"
    );
  }
  if (conv.category === "manifesting") {
    return speakReply(
      "/api/mirror-os",
      {
        query,
        language,
        walk,
        ...carried,
        history: [
          { role: "assistant", text: transmission },
          ...thread.flatMap((t) => [
            { role: "user", text: t.q },
            { role: "assistant", text: t.a },
          ]),
        ].slice(-10),
      },
      "reply",
      "The field is quiet"
    );
  }
  return speakReply(
    "/api/transmission",
    {
      query,
      mode: conv.category === "invent" ? "forge" : conv.category,
      language,
      walk,
      ...carried,
      history: [{ q: branchQuestion, a: transmission }, ...thread]
        .slice(-6)
        .map((h) => ({ q: h.q, a: h.a })),
    },
    "transmission",
    "The field is quiet"
  );
}

export { EnergyError };
