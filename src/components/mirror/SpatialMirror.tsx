"use client";

/* ------------------------------------------------------------------ */
/*  THE SPATIAL MIRROR — the missing room made whole.                  */
/*                                                                     */
/*  A living field built on @xyflow/react: the Mirror stands at the    */
/*  center, every settled turn of the conversation becomes a ring      */
/*  node, and each turn grows its field of suggestions — branches,     */
/*  creations, links, continuations and questions — into five fixed    */
/*  wedges around the ring. The wedges are packed on computed arcs,    */
/*  so items and sections can never overlap by construction.           */
/*                                                                     */
/*  THE CATEGORY HAND: the dropdown turns the whole field toward a     */
/*  chosen category — the field rotates so that category's wedge       */
/*  faces the top, the room wears its colour, and the other petals     */
/*  rest dimmed.                                                       */
/*                                                                     */
/*  THE LIVE LINE: the room hears the landing chat through the thread  */
/*  bridge AND carries its own whisper — a small composer that asks    */
/*  the Mirror directly; every answer settles as a new ring section    */
/*  and the whole field zooms out to receive it. Tapping a petal       */
/*  sends its question to the Mirror in the same breath.               */
/*                                                                     */
/*  THE QUIET LAW (no device heating): no animation loops, no rAF,     */
/*  no canvases beyond the static dot background, fixed node sizes,    */
/*  capped node counts (6 turns × 5 petals), memoized nodes and        */
/*  visible-only rendering. The field is still until spoken to.        */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Leaf, LocateFixed, Send, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLandingTurns, type BridgeTurn } from "@/lib/spatial/thread-bridge";

/* ------------------------- the categories ------------------------- */

type SuggestionKind =
  | "branches"
  | "creations"
  | "links"
  | "continuations"
  | "questions";

const CATEGORIES: Record<
  SuggestionKind,
  { lane: number; color: string; label: string }
> = {
  branches: { lane: -90, color: "#a78bfa", label: "Branches" },
  creations: { lane: -18, color: "#e6c887", label: "Creations" },
  links: { lane: 54, color: "#7dd3fc", label: "Links" },
  continuations: { lane: 126, color: "#ff7a91", label: "Continuations" },
  questions: { lane: 198, color: "#86efac", label: "Questions" },
};
const KIND_ORDER: SuggestionKind[] = [
  "branches",
  "creations",
  "links",
  "continuations",
  "questions",
];
const FIELD_GOLD = "#d8b571";
const RING_RADIUS = 340;
const WEDGE_RADII = [640, 820, 1000];
const WEDGE_SPAN = 64;
const MAX_TURNS = 6;
const TURN_SIZE = { w: 300, h: 132 };
const SUG_SIZE = { w: 240, h: 92 };
const SEED_SIZE = 210;

/* --------------------------- node data ---------------------------- */

type SeedData = {
  accent: string;
  busy: boolean;
  turns: number;
};
type TurnData = {
  q: string;
  a: string;
  index: number;
  dim: boolean;
};
type SugData = {
  kind: SuggestionKind;
  label: string;
  sub: string;
  ask: string;
  color: string;
  dim: boolean;
  turnIdx: number;
};

type SeedNode = Node<SeedData, "seed">;
type TurnNode = Node<TurnData, "turn">;
type SugNode = Node<SugData, "suggestion">;
type FieldNode = SeedNode | TurnNode | SugNode;
type FieldEdge = Edge;

/* --------------------------- small math --------------------------- */

const rad = (deg: number) => (deg * Math.PI) / 180;
const mix = (accent: string, pct: number): string =>
  `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

function polar(deg: number, r: number): { x: number; y: number } {
  return { x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r };
}

function rotatePoint(p: { x: number; y: number }, deg: number) {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
}

/** the wedge's per-row capacity so petals can never touch */
function wedgeCapacity(radius: number): number {
  const stepDeg = Math.max(
    16,
    (Math.atan2(SUG_SIZE.w + 36, radius) * 180) / Math.PI
  );
  return Math.max(1, Math.floor(WEDGE_SPAN / stepDeg));
}

type HandleSide = "t" | "r" | "b" | "l";
const SIDE_POS: Record<HandleSide, Position> = {
  t: Position.Top,
  r: Position.Right,
  b: Position.Bottom,
  l: Position.Left,
};

function handlePair(dx: number, dy: number): { s: HandleSide; t: HandleSide } {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax > ay * 1.6) return dx > 0 ? { s: "r", t: "l" } : { s: "l", t: "r" };
  if (ay > ax * 1.6) return dy > 0 ? { s: "b", t: "t" } : { s: "t", t: "b" };
  if (dx >= 0 && dy >= 0) return { s: "r", t: "t" };
  if (dx >= 0 && dy < 0) return { s: "r", t: "b" };
  if (dx < 0 && dy >= 0) return { s: "l", t: "t" };
  return { s: "l", t: "b" };
}

/* --------------------- suggestion derivation ---------------------- */

const STOPWORDS = new Set([
  "the", "and", "that", "with", "this", "from", "have", "for", "not", "you",
  "your", "was", "are", "been", "were", "they", "their", "them", "which",
  "will", "would", "could", "should", "into", "about", "what", "when",
  "where", "while", "than", "then", "also", "just", "like", "make", "made",
  "very", "much", "more", "most", "over", "under", "some", "such", "only",
  "even", "here", "there", "because", "through", "between", "being",
  "does", "doing", "ours", "out", "down", "all", "any", "each", "can",
  "may", "might", "must", "shall", "onto", "upon", "itself", "everything",
  "something", "nothing", "everything's", "isn't", "doesn't", "don't",
]);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clampText(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

function keywords(text: string, n: number): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, n);
}

function firstWords(s: string, n: number): string {
  return s.split(/\s+/).slice(0, n).join(" ");
}

interface DerivedSuggestion {
  kind: SuggestionKind;
  label: string;
  sub: string;
  ask: string;
}

function deriveSuggestions(
  turn: BridgeTurn,
  prev: BridgeTurn | undefined,
  scopeLabel: string
): DerivedSuggestion[] {
  const a = turn.a.trim();
  const h = hash(turn.q + a);
  const kws = keywords(`${turn.q} ${a}`, 6);
  const kw = (i: number) => kws[i] ?? kws[0] ?? "the unseen";
  const out: DerivedSuggestion[] = [];

  /* questions — real interrogatives from the answer, else an open door */
  const qs = a
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.endsWith("?") && s.length > 18)
    .slice(0, 2);
  if (qs[0]) {
    out.push({
      kind: "questions",
      label: clampText(qs[0], 96),
      sub: "asked inside the answer",
      ask: clampText(qs[0], 200),
    });
  } else {
    out.push({
      kind: "questions",
      label: `What lives inside “${kw(0)}”?`,
      sub: "an open door",
      ask: `What lives inside ${kw(0)}? Speak to its heart.`,
    });
  }

  /* branches — one keyword becomes a new limb */
  out.push({
    kind: "branches",
    label: `Branch · ${kw(1)}`,
    sub: "a limb of the same root",
    ask: `Open the branch of ${kw(1)} — speak deeper into it and what grows from it.`,
  });

  /* continuations — the thread keeps walking */
  out.push({
    kind: "continuations",
    label: `Continue — ${clampText(firstWords(a, 7), 72)}`,
    sub: "walk the thread further",
    ask: `Continue the thread: ${clampText(a, 160)}`,
  });

  /* creations — make the idea touchable */
  const verbs = ["Compose", "Sketch", "Weave", "Shape", "Name"];
  out.push({
    kind: "creations",
    label: `${verbs[h % verbs.length]} · ${kw(2)}`,
    sub: "make it touchable",
    ask: `${verbs[h % verbs.length]} a small creation about ${kw(2)} — bring it into words.`,
  });

  /* links — bridge to the previous turn or to a kindred field */
  if (prev) {
    const pk = keywords(prev.a, 2)[0];
    out.push({
      kind: "links",
      label: `Link · ${kw(0)} ↔ ${pk ?? "the earlier thread"}`,
      sub: "two shores, one bridge",
      ask: `What connects ${kw(0)} and ${pk ?? "the earlier thread"}? Show the bridge.`,
    });
  } else {
    out.push({
      kind: "links",
      label: `Link · ${kw(0)} ↔ ${scopeLabel}`,
      sub: "cross to a kindred field",
      ask: `What connects ${kw(0)} with ${scopeLabel}? Walk the bridge.`,
    });
  }

  return out;
}

/* the field's standing petals — never an empty room */
const STARTERS: DerivedSuggestion[] = [
  {
    kind: "questions",
    label: "What is the Mirror, really?",
    sub: "an open door",
    ask: "What is the Mirror, really?",
  },
  {
    kind: "branches",
    label: "Branch · the unlived day",
    sub: "a limb of the same root",
    ask: "Open the branch of the unlived day — what grows from it?",
  },
  {
    kind: "continuations",
    label: "Continue — the unfinished thread",
    sub: "walk the thread further",
    ask: "Continue the thread we never finished.",
  },
  {
    kind: "creations",
    label: "Compose · a verse for tonight",
    sub: "make it touchable",
    ask: "Compose a short verse for tonight.",
  },
  {
    kind: "links",
    label: "Link · dreams ↔ waking",
    sub: "two shores, one bridge",
    ask: "What connects dreams and waking? Show the bridge.",
  },
];

/* ------------------------- the field build ------------------------ */

interface FieldBuild {
  nodes: FieldNode[];
  edges: FieldEdge[];
  sugIdsByTurn: Map<number, string[]>;
}

function buildField(
  turns: BridgeTurn[],
  category: SuggestionKind | "all",
  busy: boolean,
  scopeLabel: string
): FieldBuild {
  const rotation = category === "all" ? 0 : -90 - CATEGORIES[category].lane;
  const shown = turns.slice(-MAX_TURNS);
  const nodes: FieldNode[] = [];
  const edges: FieldEdge[] = [];
  const sugIdsByTurn = new Map<number, string[]>();

  /* the seed — the Mirror itself, at the still center */
  nodes.push({
    id: "seed",
    type: "seed",
    position: { x: -SEED_SIZE / 2, y: -SEED_SIZE / 2 },
    data: { accent: category === "all" ? FIELD_GOLD : CATEGORIES[category].color, busy, turns: shown.length },
    draggable: false,
  });

  /* the ring of settled turns */
  shown.forEach((turn, i) => {
    const angle = -90 + (360 / shown.length) * i;
    const center = polar(angle, RING_RADIUS);
    nodes.push({
      id: `turn-${i}`,
      type: "turn",
      position: { x: center.x - TURN_SIZE.w / 2, y: center.y - TURN_SIZE.h / 2 },
      data: { q: turn.q, a: turn.a, index: i, dim: false },
      draggable: false,
    });
    const pair = handlePair(center.x, center.y);
    edges.push({
      id: `e-seed-turn-${i}`,
      source: "seed",
      target: `turn-${i}`,
      sourceHandle: pair.t,
      targetHandle: pair.s,
      type: "straight",
      style: { stroke: "#a8946a", strokeWidth: 1.1, opacity: 0.42 },
    });
  });

  /* the five wedges — suggestions grouped by category, packed on arcs */
  const byKind = new Map<SuggestionKind, { turnIdx: number; sug: DerivedSuggestion }[]>();
  shown.forEach((turn, i) => {
    const prev = i > 0 ? shown[i - 1] : undefined;
    for (const sug of deriveSuggestions(turn, prev, scopeLabel)) {
      const list = byKind.get(sug.kind) ?? [];
      list.push({ turnIdx: i, sug });
      byKind.set(sug.kind, list);
    }
  });
  if (shown.length === 0) {
    for (const sug of STARTERS) {
      const list = byKind.get(sug.kind) ?? [];
      list.push({ turnIdx: -1, sug });
      byKind.set(sug.kind, list);
    }
  }

  for (const kind of KIND_ORDER) {
    const items = byKind.get(kind) ?? [];
    if (items.length === 0) continue;
    const base = CATEGORIES[kind].lane;
    const color = CATEGORIES[kind].color;
    const dim = category !== "all" && category !== kind;
    let placed = 0;
    for (let row = 0; row < WEDGE_RADII.length && placed < items.length; row += 1) {
      const radius = WEDGE_RADII[row];
      const cap = wedgeCapacity(radius);
      const slice = items.slice(placed, placed + cap);
      placed += slice.length;
      slice.forEach((item, slot) => {
        const offset =
          (slot - (slice.length - 1) / 2) *
          Math.max(
            16,
            (Math.atan2(SUG_SIZE.w + 36, radius) * 180) / Math.PI
          );
        const center = rotatePoint(polar(base + offset, radius), rotation);
        const id = `sug-${kind}-${item.turnIdx}-${slot}`;
        nodes.push({
          id,
          type: "suggestion",
          position: { x: center.x - SUG_SIZE.w / 2, y: center.y - SUG_SIZE.h / 2 },
          data: {
            kind,
            label: item.sug.label,
            sub: item.sug.sub,
            ask: item.sug.ask,
            color,
            dim,
            turnIdx: item.turnIdx,
          },
          draggable: false,
        });
        if (item.turnIdx >= 0) {
          const turnCenter = polar(-90 + (360 / shown.length) * item.turnIdx, RING_RADIUS);
          const vec = { x: center.x - turnCenter.x, y: center.y - turnCenter.y };
          const pair = handlePair(vec.x, vec.y);
          edges.push({
            id: `e-${kind}-${item.turnIdx}-${slot}`,
            source: `turn-${item.turnIdx}`,
            target: id,
            sourceHandle: pair.s,
            targetHandle: pair.t,
            type: "straight",
            style: { stroke: color, strokeWidth: 1.1, opacity: dim ? 0.07 : 0.5 },
          });
        } else {
          const pair = handlePair(center.x, center.y);
          edges.push({
            id: `e-${kind}-starter-${slot}`,
            source: "seed",
            target: id,
            sourceHandle: pair.t,
            targetHandle: pair.s,
            type: "straight",
            style: { stroke: color, strokeWidth: 1, opacity: dim ? 0.07 : 0.4 },
          });
        }
        if (item.turnIdx >= 0) {
          const list = sugIdsByTurn.get(item.turnIdx) ?? [];
          list.push(id);
          sugIdsByTurn.set(item.turnIdx, list);
        }
      });
    }
  }

  return { nodes, edges, sugIdsByTurn };
}

/* ------------------------- custom nodes --------------------------- */

function NodeHandles() {
  return (
    <>
      {(Object.keys(SIDE_POS) as HandleSide[]).map((side) => (
        <Handle
          key={`s-${side}`}
          id={side}
          type="source"
          position={SIDE_POS[side]}
          style={{ width: 6, height: 6, background: "transparent", border: "none", opacity: 0, pointerEvents: "none" }}
        />
      ))}
      {(Object.keys(SIDE_POS) as HandleSide[]).map((side) => (
        <Handle
          key={`g-${side}`}
          id={side}
          type="target"
          position={SIDE_POS[side]}
          style={{ width: 6, height: 6, background: "transparent", border: "none", opacity: 0, pointerEvents: "none" }}
        />
      ))}
    </>
  );
}

const SeedView = memo(function SeedView({ data }: NodeProps<SeedNode>) {
  const t = useT();
  return (
    <div
      className="flex flex-col items-center justify-center rounded-full border text-center"
      style={{
        width: SEED_SIZE,
        height: SEED_SIZE,
        borderColor: mix(data.accent, 50),
        background: `radial-gradient(circle at 50% 40%, ${mix(data.accent, 22)}, transparent 74%)`,
        boxShadow: `inset 0 0 42px ${mix(data.accent, 14)}`,
      }}
    >
      <Sparkles className="size-6" style={{ color: data.accent }} aria-hidden="true" />
      <p className="mt-1.5 font-serif text-[15px] text-foreground">{t("The Mirror")}</p>
      <p className="mono-label mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {data.busy
          ? t("The mirror is receiving…")
          : data.turns > 0
            ? `${data.turns} ${t("settled turns")}`
            : t("live")}
      </p>
      {data.busy ? (
        <span className="mt-1.5 size-1.5 animate-pulse rounded-full motion-reduce:animate-none" style={{ background: data.accent }} aria-hidden="true" />
      ) : null}
      <NodeHandles />
    </div>
  );
});

const TurnView = memo(function TurnView({ data }: NodeProps<TurnNode>) {
  const t = useT();
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border bg-background/85 p-3 shadow-lg backdrop-blur transition-opacity duration-300"
      style={{
        width: TURN_SIZE.w,
        height: TURN_SIZE.h,
        borderColor: data.dim ? "transparent" : mix(FIELD_GOLD, 38),
        opacity: data.dim ? 0.35 : 1,
      }}
    >
      <p className="mono-label text-[8px] uppercase tracking-[0.18em] text-muted-foreground/80">
        {t("you asked")} · {data.index + 1}
      </p>
      <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-[15px] text-foreground">
        {data.q}
      </p>
      <p className="mt-1 line-clamp-4 text-[11px] leading-[14px] text-muted-foreground">
        {data.a}
      </p>
      <NodeHandles />
    </div>
  );
});

const SugView = memo(function SugView({ data }: NodeProps<SugNode>) {
  const t = useT();
  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border bg-background/80 p-2.5 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-0.5"
      style={{
        width: SUG_SIZE.w,
        height: SUG_SIZE.h,
        borderColor: data.dim ? "transparent" : mix(data.color, 42),
        opacity: data.dim ? 0.28 : 1,
        boxShadow: data.dim ? "none" : `0 0 18px ${mix(data.color, 10)}`,
      }}
    >
      <p className="mono-label text-[8px] uppercase tracking-[0.18em]" style={{ color: mix(data.color, 80) }}>
        {t(CATEGORIES[data.kind].label)}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11.5px] font-medium leading-[14px] text-foreground">
        {data.label}
      </p>
      <p className="mt-auto truncate text-[9.5px] text-muted-foreground/80">{t(data.sub)}</p>
      <NodeHandles />
    </div>
  );
});

const NODE_TYPES: NodeTypes = {
  seed: SeedView,
  turn: TurnView,
  suggestion: SugView,
};

/* --------------------------- the room ----------------------------- */

const STORAGE_KEY = "mirror:spatial-turns:v1";

function SpatialRoom() {
  const t = useT();
  const bridgeTurns = useLandingTurns();
  const { fitView } = useReactFlow();

  const [spatialTurns, setSpatialTurns] = useState<BridgeTurn[]>([]);
  const [category, setCategory] = useState<SuggestionKind | "all">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const bridgeRef = useRef<BridgeTurn[]>([]);
  const spatialRef = useRef<BridgeTurn[]>([]);
  const sugIdsRef = useRef<Map<number, string[]>>(new Map());

  useEffect(() => {
    bridgeRef.current = bridgeTurns;
  }, [bridgeTurns]);
  useEffect(() => {
    spatialRef.current = spatialTurns;
  }, [spatialTurns]);

  /* restore the room's own whispers across remounts */
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const restored = (parsed as BridgeTurn[])
        .filter((x) => x && typeof x.q === "string" && typeof x.a === "string")
        .slice(-8);
      if (restored.length > 0) setSpatialTurns(restored);
    } catch {
      /* the shelf forgives */
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(spatialTurns.slice(-8)));
    } catch {
      /* the shelf forgives */
    }
  }, [spatialTurns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* the merged thread — the landing chat's settled words and the room's own */
  const allTurns = useMemo(() => {
    const seen = new Set<string>();
    const merged: BridgeTurn[] = [];
    for (const turn of [...bridgeTurns, ...spatialTurns]) {
      const key = `${turn.q}::${turn.a.slice(0, 48)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(turn);
    }
    return merged;
  }, [bridgeTurns, spatialTurns]);

  const build = useMemo(
    () => buildField(allTurns, category, busy, "the Mirror"),
    [allTurns, category, busy]
  );
  useEffect(() => {
    sugIdsRef.current = build.sugIdsByTurn;
  }, [build.sugIdsByTurn]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FieldNode>(build.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FieldEdge>(build.edges);

  useEffect(() => {
    setNodes(build.nodes);
  }, [build.nodes, setNodes]);
  useEffect(() => {
    setEdges(build.edges);
  }, [build.edges, setEdges]);

  /* THE ZOOM LAW — each new answer makes the whole field step back
     and receive its new section; choosing a category re-frames too.
     THE CLEARANCE LAW: the frame keeps the room's chrome (the head
     above, the composer below) — no petal ever rests beneath it. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      void fitView({
        padding: { top: "104px", bottom: "148px", left: "36px", right: "36px" },
        duration: 620,
        maxZoom: 1.05,
      });
    }, 90);
    return () => window.clearTimeout(id);
  }, [allTurns.length, category, fitView]);

  const recenter = useCallback(() => {
    void fitView({
      padding: { top: "104px", bottom: "148px", left: "36px", right: "36px" },
      duration: 500,
      maxZoom: 1.05,
    });
  }, [fitView]);

  const focusTurn = useCallback(
    (turnIdx: number) => {
      const ids = [{ id: `turn-${turnIdx}` }];
      for (const sugId of sugIdsRef.current.get(turnIdx) ?? []) ids.push({ id: sugId });
      void fitView({
        nodes: ids,
        padding: { top: "104px", bottom: "148px", left: "48px", right: "48px" },
        duration: 500,
        maxZoom: 1.15,
      });
    },
    [fitView]
  );

  /* THE LIVE LINE — the room's own whisper to the Mirror */
  const askMirror = useCallback(async (raw: string) => {
    const query = raw.trim();
    if (!query || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setValue("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const history = [...bridgeRef.current, ...spatialRef.current]
        .slice(-4)
        .map((turn) => ({ q: turn.q, a: turn.a }));
      const res = await fetch("/api/transmission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "mirror", history }),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as
        | { transmission?: string; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "The field is momentarily quiet. Rest, then try again.");
      }
      const answer = String(data?.transmission ?? "").trim();
      setSpatialTurns((prev) => [...prev.slice(-7), { q: query, a: answer || "…" }]);
    } catch (err) {
      if ((err as Error | null)?.name === "AbortError") return;
      setError(
        (err as Error | null)?.message ??
          "The field is momentarily quiet. Rest, then try again."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FieldNode) => {
      if (node.type === "suggestion") {
        void askMirror(node.data.ask);
      } else if (node.type === "turn") {
        focusTurn(node.data.index);
      }
    },
    [askMirror, focusTurn]
  );

  const accent = category === "all" ? FIELD_GOLD : CATEGORIES[category].color;
  const empty = allTurns.length === 0;

  return (
    <section
      aria-label={t("The Spatial Mirror")}
      className="relative h-full w-full overflow-hidden bg-background"
    >
      {/* the still aura — one static gradient, never animated */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 46%, ${mix(accent, 7)}, transparent 70%)`,
        }}
      />

      {/* the room's head — title, the category hand, the legend */}
      <header className="pointer-events-auto absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-1.5 backdrop-blur">
          <Leaf className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
          <h1 className="truncate font-serif text-[13px] text-foreground">
            {t("The Spatial Mirror")}
          </h1>
          <span
            className="size-1.5 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
            style={{ background: accent }}
            aria-hidden="true"
          />
          <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("live")} · {allTurns.length}
          </span>
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor="spatial-category">
            {t("Field of suggestions")}
          </label>
          <select
            id="spatial-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SuggestionKind | "all")}
            className="mono-label min-h-[36px] cursor-pointer appearance-none rounded-full border border-border bg-background/75 py-1.5 pl-3 pr-7 text-[10px] uppercase tracking-[0.12em] text-foreground outline-none backdrop-blur transition-colors hover:text-foreground"
            style={{ color: category === "all" ? undefined : accent }}
          >
            <option value="all">{t("All directions")}</option>
            {KIND_ORDER.map((kind) => (
              <option key={kind} value={kind}>
                {t(CATEGORIES[kind].label)}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground"
          >
            ▼
          </span>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-background/70 px-2 py-1.5 backdrop-blur sm:flex">
          {KIND_ORDER.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setCategory((c) => (c === kind ? "all" : kind))}
              aria-pressed={category === kind}
              title={t(CATEGORIES[kind].label)}
              className="focus-glow flex min-h-[24px] items-center gap-1 rounded-full px-1.5 text-[9.5px] transition-opacity hover:opacity-100"
              style={{ opacity: category === "all" || category === kind ? 1 : 0.4 }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: CATEGORIES[kind].color, boxShadow: `0 0 6px ${mix(CATEGORIES[kind].color, 60)}` }}
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{t(CATEGORIES[kind].label)}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={recenter}
          title={t("Recenter")}
          aria-label={t("Recenter")}
          className="focus-glow ml-auto flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-border bg-background/75 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
        </button>
      </header>

      {/* the field itself */}
      <div className="absolute inset-0">
        <ReactFlow<FieldNode, FieldEdge>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{
            padding: { top: "104px", bottom: "148px", left: "36px", right: "36px" },
          }}
          minZoom={0.2}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          zoomOnDoubleClick={false}
          onlyRenderVisibleElements
          defaultEdgeOptions={{ type: "straight" }}
          className="spatial-flow"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={1.4}
            color="rgba(178, 166, 138, 0.16)"
          />
        </ReactFlow>
      </div>

      {/* the empty room's own invitation */}
      {empty ? (
        <div className="pointer-events-none absolute bottom-[86px] left-1/2 z-10 w-[min(92%,460px)] -translate-x-1/2 text-center">
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            {t("The room stands ready — speak in the walk, and the words will float here.")}
          </p>
          <p className="mono-label mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {t("tap a petal — the mirror answers here")}
          </p>
        </div>
      ) : null}

      {/* the composer — the room's own live line */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void askMirror(value);
        }}
        className="pointer-events-auto absolute bottom-3 left-1/2 z-20 w-[min(94%,560px)] -translate-x-1/2"
      >
        {error ? (
          <p className="mb-1.5 rounded-lg border border-border bg-background/85 px-3 py-1.5 text-center text-[10.5px] text-muted-foreground backdrop-blur">
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/85 p-1.5 pl-4 shadow-xl backdrop-blur">
          <Sparkles className="size-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t("whisper to the mirror…")}
            placeholder={t("whisper to the mirror…")}
            className="min-h-[40px] w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
            maxLength={400}
          />
          <button
            type="submit"
            disabled={busy || !value.trim()}
            aria-label={t("Send")}
            className="focus-glow flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor: mix(accent, 45),
              background: mix(accent, 14),
              color: accent,
            }}
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}

export function SpatialMirror() {
  return (
    <ReactFlowProvider>
      <SpatialRoom />
    </ReactFlowProvider>
  );
}
