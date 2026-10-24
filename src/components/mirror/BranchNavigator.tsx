"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useEdgesState,
  useInternalNode,
  useNodesState,
  useReactFlow,
  type EdgeProps,
  type InternalNode,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeftRight,
  BookOpen,
  ChevronRight,
  Compass,
  Hammer,
  Hand,
  Hourglass,
  Layers,
  Link2,
  ListTree,
  LoaderCircle,
  Maximize2,
  Minus,
  Moon,
  NotebookPen,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Send,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  journeyDepth,
  recordJourney,
  recordSeen,
  type BranchType,
} from "@/lib/learning-branches";
import { cn } from "@/lib/utils";
import {
  NAV_HYSTERESIS,
  NAV_MAX_AUTO,
  NAV_MAX_CROSS,
  NAV_MAX_INFLIGHT,
  NAV_NODE_H,
  NAV_NODE_W,
  angleToward,
  dropSnapshot,
  freePosition,
  frontierPick,
  navHash,
  navId,
  navKindForText,
  overlapWords,
  peekSnapshot,
  placeAround,
  pruneGraph,
  saveSnapshot,
  seedGraph,
  setPersistOk,
  tierToScore,
  type NavEdge,
  type NavEdgeData,
  type NavNode,
  type NavNodeData,
  type SeedWhisper,
} from "@/lib/navigator-graph";

/* ------------------------------------------------------------------ */
/*  THE BRANCHING NAVIGATOR — the wall of blocks becomes a living map. */
/*                                                                     */
/*  One welcoming question at the heart, simple doors around it, and   */
/*  every branch leading to further branches. The visitor walks in     */
/*  every direction: dragging the ground pans, a pinch or the quiet    */
/*  controls zoom, a touch focuses a question and shows its own        */
/*  possibilities, a clear hand sends it to the mirror. Approaching    */
/*  an unexplored frontier grows one small connected cluster — never   */
/*  a storm, never a reorganization: every node is born where it       */
/*  stands and never moves.                                            */
/*                                                                     */
/*  THE PERFORMANCE LAW — React Flow carries the camera; panning and   */
/*  zooming never re-render this tree. Only the visible nodes stand    */
/*  in the DOM, the graph itself is bounded, the frontier's ear fires  */
/*  once per settled walk (with hysteresis against tiny wanderings),   */
/*  and every callback keeps one identity for its whole life.          */
/* ------------------------------------------------------------------ */

const MOVEMENT_ICONS: Record<BranchType, typeof Layers> = {
  deepen: Layers,
  connect: Link2,
  contrast: ArrowLeftRight,
  apply: Hand,
  create: Sparkles,
  reflect: Moon,
  pause: Hourglass,
};

const CREATION_ICONS = {
  akashic: ScrollText,
  book: BookOpen,
  invent: Hammer,
} as const;

const KIND_LABELS: Record<NavNodeData["kind"], string> = {
  mirror: "mirror",
  image: "image",
  creation: "creation",
  manifest: "manifest",
  book: "book",
  akashic: "akashic",
};

/** The gentle phrase each movement wears in the journey's reflection. */
const MOVEMENT_PHRASES: Record<BranchType, string> = {
  reflect: "your own reflections",
  deepen: "going deeper",
  connect: "connections between things",
  apply: "small doable steps",
  create: "making something",
  contrast: "another perspective",
  pause: "a resting point",
};

/** The branch voice each walk speaks to the sky. */
const VOICE_BY_BRANCH: Record<string, string> = {
  interplanetary: "interplanetary",
  healing: "healing",
  quantum: "quantum",
  evolvemed: "evolvemed",
  invent: "invent",
  manifest: "manifesting",
  manifesting: "manifesting",
  artx: "artx",
};

export interface NavigatorApi {
  attachTypedQuestion: (text: string) => void;
}

/* --------------------------- the node's face ------------------------ */

function accentMix(a: string, pct: number, fallback: string): string {
  if (a.startsWith("var(")) return fallback;
  return `color-mix(in srgb, ${a} ${pct}%, transparent)`;
}

const QuestionNode = memo(function QuestionNode({
  id,
  data,
}: NodeProps<NavNode>) {
  const t = useT();
  const d = data;
  const Icon = d.creation
    ? CREATION_ICONS[d.creation]
    : (MOVEMENT_ICONS[d.movement] ?? Layers);
  const isHome = d.role === "home";
  const focused = !!d.focused;

  const select = useCallback(
    () => window.dispatchEvent(new CustomEvent<{ id: string }>("nav:select", { detail: { id } })),
    [id]
  );
  const act = useCallback(
    (name: "send" | "grow" | "creation") =>
      window.dispatchEvent(
        new CustomEvent<{ id: string; act: string }>("nav:act", { detail: { id, act: name } })
      ),
    [id]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      select();
    }
  };

  return (
    <div
      role={isHome ? "group" : "button"}
      tabIndex={isHome ? -1 : 0}
      aria-pressed={focused || undefined}
      aria-label={isHome ? t("The heart of the map") : t(d.text)}
      data-testid={`nav-node-${isHome ? "home" : d.kind}`}
      data-status={d.status}
      data-focused={focused || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "nav-node relative flex flex-col rounded-[14px] border p-2.5 text-left transition-[box-shadow,border-color] duration-300",
        "w-[196px] sm:w-[232px]",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--na)] focus-visible:outline-none",
        d.status === "loading" && "nav-node-loading",
        d.status === "failed" && "nav-node-failed"
      )}
      style={
        {
          "--na": d.accent,
          borderColor: focused
            ? accentMix(d.accent, 62, "var(--hairline-hover)")
            : d.role === "typed"
              ? accentMix(d.accent, 46, "var(--hairline)")
              : accentMix(d.accent, 30, "var(--hairline)"),
          background: `linear-gradient(168deg, ${accentMix(d.accent, 9, "transparent")} 0%, var(--background) 58%)`,
          boxShadow: focused
            ? `0 0 0 1.5px ${accentMix(d.accent, 55, "var(--gd)")}, 0 14px 34px -18px rgba(0,0,0,0.55)`
            : "0 6px 22px -16px rgba(0,0,0,0.5)",
        } as CSSProperties
      }
    >
      {/* THE QUIET HANDS — invisible, measured only: the floating
          edges find their own way from the nodes' real bounds, but
          React Flow's bookkeeping needs these two to exist. */}
      <Handle
        type="target"
        position={Position.Top}
        className="nav-handle"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="nav-handle"
        isConnectable={false}
      />
      {/* the head — the movement's own sigil, the kind it opens */}
      <span className="relative flex items-center gap-1.5">
        {d.inTrail && (
          <i
            aria-hidden="true"
            className="size-[5px] shrink-0 rounded-full"
            style={{ backgroundColor: d.golden ? "#f59e0b" : d.accent }}
          />
        )}
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3 shrink-0",
            d.golden ? "text-[#f59e0b]" : "opacity-80"
          )}
          style={d.golden ? undefined : { color: d.accent }}
        />
        <span
          className={cn(
            "mono-label shrink-0 text-[7.5px] uppercase tracking-[0.16em]",
            d.golden ? "text-[#f59e0b]" : "opacity-70"
          )}
          style={d.golden ? undefined : { color: d.accent }}
        >
          {t(KIND_LABELS[d.kind])}
        </span>
        {d.status === "loading" && (
          <LoaderCircle
            aria-hidden="true"
            className="nav-spin ml-auto size-3 shrink-0 text-muted-foreground"
          />
        )}
        {!d.inTrail && d.status !== "loading" && (
          <ChevronRight
            aria-hidden="true"
            className="ml-auto size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-0"
          />
        )}
        {d.revisits && d.revisits > 1 && (
          <span
            className="mono-label ml-auto shrink-0 text-[7.5px] uppercase tracking-[0.14em] text-muted-foreground"
            title={t("You returned here")}
          >
            ×{d.revisits}
          </span>
        )}
      </span>

      {/* the question itself — the words are the map */}
      <span
        className={cn(
          "mt-1.5 line-clamp-3 break-words text-[12.5px] leading-[16px] text-foreground sm:text-[13px] sm:leading-[17px]",
          isHome && "font-[family-name:var(--font-literata)] italic",
          d.golden && "font-serif italic"
        )}
      >
        {t(d.text)}
      </span>

      {/* the branch's honest reason — spoken when the branch is focused */}
      {focused && d.reason && (
        <span className="mt-1 line-clamp-2 text-[10.5px] italic leading-[14px] text-muted-foreground">
          {d.reason}
        </span>
      )}

      {/* the hands — a clear action, never a hidden one */}
      {focused && !isHome && (
        <span className="nodrag nowheel mt-2 flex items-center gap-1.5">
          {d.creation ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                act("creation");
              }}
              data-testid="nav-act-creation"
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] text-foreground transition-colors duration-200 hover:bg-foreground/5"
              style={{ borderColor: accentMix(d.accent, 45, "var(--hairline)") }}
            >
              <Send className="size-3" aria-hidden="true" />
              {t("Open the making")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  act("send");
                }}
                data-testid="nav-act-send"
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] text-foreground transition-colors duration-200 hover:bg-foreground/5"
                style={{ borderColor: accentMix(d.accent, 45, "var(--hairline)") }}
              >
                <Send className="size-3" aria-hidden="true" />
                {t("Ask the mirror")}
              </button>
              {d.status !== "loading" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    act("grow");
                  }}
                  data-testid="nav-act-grow"
                  title={
                    d.status === "failed"
                      ? t("The sky was silent — try again")
                      : t("Grow this branch")
                  }
                  className="flex size-[24px] items-center justify-center rounded-full border text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  style={{ borderColor: accentMix(d.accent, 30, "var(--hairline)") }}
                >
                  {d.status === "failed" ? (
                    <RefreshCw className="size-3" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-3" aria-hidden="true" />
                  )}
                </button>
              )}
            </>
          )}
        </span>
      )}

      {isHome && (
        <span className="mono-label mt-1.5 text-[7.5px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("The heart — touch to come home")}
        </span>
      )}
    </div>
  );
});

const nodeTypes = { "nav-question": QuestionNode };

/* -------------------------- the edge's face ------------------------- */

/* THE FLOATING LINE — a multidirectional map never knows from which
   side a branch approaches: each edge reads its two nodes' real
   bounds and leaves from the closest sides, one gentle bezier, thin
   and still. No handles, no fixed top-and-bottom tree law. */

function nodeBounds(n: InternalNode): {
  cx: number;
  cy: number;
  w: number;
  h: number;
} {
  const w = n.measured?.width ?? NAV_NODE_W;
  const h = n.measured?.height ?? NAV_NODE_H;
  return {
    cx: n.internals.positionAbsolute.x + w / 2,
    cy: n.internals.positionAbsolute.y + h / 2,
    w,
    h,
  };
}

function FloatingNavEdge({
  source,
  target,
  style,
}: EdgeProps<NavEdge>) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t || !s.internals || !t.internals) return null;
  const sc = nodeBounds(s);
  const tc = nodeBounds(t);
  const dx = tc.cx - sc.cx;
  const dy = tc.cy - sc.cy;
  let sx: number;
  let sy: number;
  let tx: number;
  let ty: number;
  let sp: Position;
  let tp: Position;
  if (Math.abs(dx) >= Math.abs(dy)) {
    sp = dx > 0 ? Position.Right : Position.Left;
    tp = dx > 0 ? Position.Left : Position.Right;
    sx = sc.cx + (dx > 0 ? sc.w / 2 : -sc.w / 2);
    sy = sc.cy;
    tx = tc.cx + (dx > 0 ? -tc.w / 2 : tc.w / 2);
    ty = tc.cy;
  } else {
    sp = dy > 0 ? Position.Bottom : Position.Top;
    tp = dy > 0 ? Position.Top : Position.Bottom;
    sx = sc.cx;
    sy = sc.cy + (dy > 0 ? sc.h / 2 : -sc.h / 2);
    tx = tc.cx;
    ty = tc.cy + (dy > 0 ? -tc.h / 2 : tc.h / 2);
  }
  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sp,
    targetX: tx,
    targetY: ty,
    targetPosition: tp,
    curvature: 0.3,
  });
  return (
    <path
      className="react-flow__edge-path"
      d={path}
      style={style}
      fill="none"
    />
  );
}

const edgeTypes = { nav: FloatingNavEdge };

/* --------------------------- the navigator -------------------------- */

interface BranchNavigatorProps {
  whispers: SeedWhisper[];
  golden: SeedWhisper[];
  focusKey: string;
  category: string;
  scopeHint?: string | null;
  disabled?: boolean;
  testIdPrefix: string;
  onPick: (text: string, move: BranchType) => void;
  onCreation: (kind: "akashic" | "book" | "invent", topic: string) => void;
  apiRef?: { current: NavigatorApi | null };
}

function NavInner({
  golden,
  focusKey,
  category,
  scopeHint,
  disabled,
  testIdPrefix,
  onPick,
  onCreation,
  apiRef,
}: BranchNavigatorProps) {
  const t = useT();
  const rf = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const homeId = "home";
  const branchVoice = VOICE_BY_BRANCH[category] ?? "interplanetary";
  const homeText = "what do you wish to remember dear one?";

  /* ------------------- the map's birth (once) --------------------- */
  const [boot] = useState(() => {
    const saved = peekSnapshot(focusKey);
    if (saved) {
      return {
        nodes: saved.nodes,
        edges: saved.edges,
        camera: saved.camera,
        selectedId: saved.selectedId,
        trail: saved.trail,
        notes: saved.notes,
        depthBias: saved.depthBias,
        attempted: new Set(saved.attempted),
        autoCount: saved.autoCount,
        crossCount: saved.crossCount,
      };
    }
    const seeded = seedGraph([], golden, focusKey, homeText);
    return {
      nodes: seeded.nodes,
      edges: seeded.edges,
      camera: null,
      selectedId: null,
      trail: [] as string[],
      notes: {} as Record<string, string>,
      depthBias: 0,
      attempted: new Set<string>(),
      autoCount: 0,
      crossCount: 0,
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<NavNode>(boot.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<NavEdge>(boot.edges);

  const [selectedId, setSelectedId] = useState<string | null>(boot.selectedId);
  const [trail, setTrail] = useState<string[]>(boot.trail);
  const [notes, setNotes] = useState<Record<string, string>>(boot.notes);
  const [depthBias, setDepthBias] = useState(boot.depthBias);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [persistOk, setPersistState] = useState(false);
  const [frontierDir, setFrontierDir] = useState<string | null>(null);
  const [hintSeen, setHintSeen] = useState(true);
  const [growCount, setGrowCount] = useState(0);

  const attemptedRef = useRef<Set<string>>(boot.attempted);
  const inflightRef = useRef<Set<string>>(new Set());
  const abortsRef = useRef<Map<string, AbortController>>(new Map());
  const lastAutoRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const autoCountRef = useRef(boot.autoCount);
  const crossCountRef = useRef(boot.crossCount);
  const growCountRef = useRef(0);
  const prevFocusRef = useRef<string[]>([]);
  const revisitsRef = useRef<Map<string, number>>(new Map());
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const trailRef = useRef(trail);
  const biasRef = useRef(depthBias);
  const notesRef = useRef(notes);
  const cameraRef = useRef(boot.camera);
  const selectedRef = useRef(selectedId);
  const persistTimerRef = useRef<number | null>(null);
  const persistOkRef = useRef(persistOk);
  const reducedMotionRef = useRef(false);

  nodesRef.current = nodes;
  edgesRef.current = edges;
  trailRef.current = trail;
  biasRef.current = depthBias;
  notesRef.current = notes;
  selectedRef.current = selectedId;
  persistOkRef.current = persistOk;

  /* ------------------- the map's own keeping ---------------------- */
  const buildSnapshot = useCallback(
    () => ({
      nodes: nodesRef.current,
      edges: edgesRef.current,
      camera: cameraRef.current,
      selectedId: selectedRef.current,
      trail: trailRef.current,
      notes: notesRef.current,
      depthBias: biasRef.current,
      attempted: [...attemptedRef.current],
      autoCount: autoCountRef.current,
      crossCount: crossCountRef.current,
      homeId,
      persistOk: persistOkRef.current,
      at: Date.now(),
    }),
    []
  );

  const persist = useCallback(() => {
    saveSnapshot(focusKey, buildSnapshot());
  }, [buildSnapshot, focusKey]);

  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current != null) return;
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      persist();
    }, 700);
  }, [persist]);

  /* --------------------- the trail's emphasis --------------------- */
  const pathIdsOf = useCallback((id: string | null): Set<string> => {
    const out = new Set<string>();
    /* one pass lays the index; the walk up the ancestors then reads
       it directly instead of searching the whole branch at every step */
    const byId = new Map(nodesRef.current.map((n) => [n.id, n]));
    let cur = id;
    let guard = 0;
    while (cur && guard++ < 64) {
      out.add(cur);
      cur = (byId.get(cur)?.data.parentId as string | null) ?? null;
    }
    return out;
  }, []);

  const applyFocusVisuals = useCallback(
    (id: string | null) => {
      const path = pathIdsOf(id);
      setNodes((nds) =>
        nds.map((n) => {
          const focused = n.id === id;
          const inTrail = n.id !== id && path.has(n.id);
          const revisits = revisitsRef.current.get(n.data.text);
          if (
            n.data.focused === focused &&
            n.data.inTrail === inTrail &&
            n.data.revisits === revisits
          )
            return n;
          return { ...n, data: { ...n.data, focused, inTrail, revisits } };
        })
      );
      setEdges((es) =>
        es.map((e) => {
          const onTrail =
            path.has(e.source) && path.has(e.target) && e.source !== e.target;
          if (!!e.data?.trail === onTrail) return e;
          const accent = e.data?.accent ?? "var(--gd)";
          const data: NavEdgeData = {
            accent,
            cross: e.data?.cross,
            reason: e.data?.reason,
            trail: onTrail,
          };
          return {
            ...e,
            data,
            style: onTrail
              ? { stroke: accent, strokeOpacity: 0.95, strokeWidth: 2 }
              : {
                  stroke: accent,
                  strokeOpacity: e.data?.cross ? 0.6 : 0.55,
                  strokeWidth: e.data?.cross ? 1 : 1.4,
                  strokeDasharray: e.data?.cross ? "3 5" : undefined,
                },
          };
        })
      );
    },
    [pathIdsOf, setEdges, setNodes]
  );

  /* --------------------- the frontier's growth -------------------- */
  const seenListFor = useCallback((node: NavNode): string[] => {
    const cx = node.position.x + NAV_NODE_W / 2;
    const cy = node.position.y + NAV_NODE_H / 2;
    return [...nodesRef.current]
      .filter((n) => n.id !== node.id)
      .sort((a, b) => {
        const da = (a.position.x - cx) ** 2 + (a.position.y - cy) ** 2;
        const db = (b.position.x - cx) ** 2 + (b.position.y - cy) ** 2;
        return da - db;
      })
      .slice(0, 30)
      .map((n) => n.data.text);
  }, []);

  const buildContext = useCallback((node: NavNode): string => {
    const chain: string[] = [];
    let cur: NavNode | undefined = node;
    let guard = 0;
    while (cur && guard++ < 32) {
      chain.push(cur.data.text);
      cur = nodesRef.current.find((x) => x.id === cur?.data.parentId);
    }
    const path = chain.reverse();
    const typed = nodesRef.current
      .filter((n) => n.data.role === "typed")
      .slice(-3)
      .map((n) => n.data.text);
    return [
      `Starting question: ${path[0] ?? ""}`,
      path.length > 2 ? `Path the walker followed: ${path.join(" → ")}` : "",
      `Current focus: ${node.data.text}`,
      typed.length ? `The walker's own questions: ${typed.join(" | ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, []);

  const growChildren = useCallback(
    (
      parent: NavNode,
      branches: { type: BranchType; question: string; reason?: string }[],
      dir?: string
    ) => {
      const existing = nodesRef.current;
      growCountRef.current += 1;
      /* the ring's seeds — every third growth weaves one making */
      const candidates: { seed: SeedWhisper; reason?: string }[] = [];
      const weaveMaking = growCountRef.current % 3 === 0 && branches.length >= 3;
      branches.forEach((b, i) => {
        if (weaveMaking && i === 1) {
          const kinds = ["akashic", "book", "invent"] as const;
          const kind = kinds[navHash(parent.data.text) % 3];
          candidates.push({
            seed: {
              text: b.question,
              movement: "create",
              accent: parent.data.accent.startsWith("var(")
                ? "#f59e0b"
                : parent.data.accent,
              creation: kind,
              topic: b.question,
            },
            reason: b.reason,
          });
          return;
        }
        candidates.push({
          seed: {
            text: b.question,
            movement: b.type,
            accent: parent.data.accent.startsWith("var(")
              ? "var(--scope-a, var(--gd))"
              : parent.data.accent,
          },
          reason: b.reason,
        });
      });
      const fresh = candidates.filter(
        (c) => !existing.some((n) => overlapWords(n.data.text, c.seed.text) >= 0.62)
      );
      if (fresh.length === 0) return;
      const parentCx = parent.position.x + NAV_NODE_W / 2;
      const parentCy = parent.position.y + NAV_NODE_H / 2;
      const home = existing.find((n) => n.id === homeId);
      const map = home
        ? { x: home.position.x + NAV_NODE_W / 2, y: home.position.y + NAV_NODE_H / 2 }
        : { x: 0, y: 0 };
      const angle = dir
        ? angleToward(
            { x: parentCx, y: parentCy },
            dir as "left" | "right" | "top" | "bottom",
            map
          )
        : Math.atan2(parentCy - map.y, parentCx - map.x) ||
          (navHash(parent.data.text) % 628) / 100;
      const positions = placeAround(
        { x: parentCx, y: parentCy },
        angle,
        existing,
        fresh.length,
        navHash(`${parent.id}:${fresh.length}:${growCountRef.current}`)
      );
      const ids = fresh.map(() => navId());
      const newNodes: NavNode[] = fresh.map((c, i) => ({
        id: ids[i],
        type: "nav-question",
        position: positions[i],
        data: {
          text: c.seed.text,
          movement: c.seed.movement,
          accent: c.seed.accent,
          kind: c.seed.creation
            ? c.seed.creation === "book"
              ? "book"
              : c.seed.creation === "akashic"
                ? "akashic"
                : "creation"
            : navKindForText(c.seed.text),
          role: c.seed.creation ? "creation" : "question",
          status: "idle",
          childCount: 0,
          depth: parent.data.depth + 1,
          parentId: parent.id,
          creation: c.seed.creation,
          topic: c.seed.topic,
          reason: c.reason,
        },
      }));
      const newEdges: NavEdge[] = ids.map((id, i) => ({
        id: `e:${parent.id}:${id}`,
        source: parent.id,
        target: id,
        type: "nav",
        data: { accent: fresh[i].seed.accent },
        style: {
          stroke: fresh[i].seed.accent,
          strokeOpacity: 0.55,
          strokeWidth: 1.4,
        },
      }));

      /* THE DISTANT HANDSHAKE — a cross-connection only when a new
         branch genuinely shares ground with a far one */
      const cross: NavEdge[] = [];
      const anc = pathIdsOf(parent.id);
      if (crossCountRef.current < NAV_MAX_CROSS) {
        for (const nn of newNodes) {
          if (crossCountRef.current + cross.length >= NAV_MAX_CROSS) break;
          for (const ex of existing) {
            if (ex.id === parent.id || ex.id === homeId) continue;
            if (anc.has(ex.id) || ex.data.parentId === parent.id) continue;
            if (ex.data.parentId && anc.has(ex.data.parentId)) continue;
            if (overlapWords(ex.data.text, nn.data.text) < 0.52) continue;
            const shared = [
              ...new Set(nn.data.text.toLowerCase().match(/[a-zà-ÿ]{5,}/g) ?? []),
            ]
              .slice(0, 2)
              .join(" and ");
            cross.push({
              id: `x:${ex.id}:${nn.id}`,
              source: ex.id,
              target: nn.id,
              type: "nav",
              data: {
                accent: nn.data.accent,
                cross: true,
                reason: shared ? `Both walk around ${shared}` : "Two paths met",
              },
              style: {
                stroke: nn.data.accent,
                strokeOpacity: 0.6,
                strokeWidth: 1,
                strokeDasharray: "3 5",
              },
            });
            break;
          }
        }
      }
      crossCountRef.current += cross.length;

      setNodes((nds) => {
        /* THE SETTLING LAW — two clusters grown at once never overlap:
           every newcomer settles against the true latest map */
        const grown = [...nds];
        for (const nn of newNodes) {
          grown.push({ ...nn, position: freePosition(nn, grown) });
        }
        const kept = pruneGraph(grown, edgesRef.current, homeId);
        return kept.pruned > 0 ? kept.nodes : grown;
      });
      setEdges((es) => [...es, ...newEdges, ...cross]);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === parent.id
            ? {
                ...n,
                data: { ...n.data, childCount: n.data.childCount + newNodes.length },
              }
            : n
        )
      );
    },
    [pathIdsOf, setEdges, setNodes]
  );

  const expandNode = useCallback(
    async (id: string, dir?: string, auto?: boolean) => {
      if (disabled) return;
      if (inflightRef.current.has(id) || attemptedRef.current.has(id)) return;
      if (inflightRef.current.size >= NAV_MAX_INFLIGHT) return;
      if (auto && autoCountRef.current >= NAV_MAX_AUTO) return;
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node || node.data.status === "loading") return;
      attemptedRef.current.add(id);
      if (auto) autoCountRef.current += 1;
      const setBusy = (status: NavNodeData["status"]) =>
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, status } } : n
          )
        );
      setBusy("loading");
      const ctrl = new AbortController();
      abortsRef.current.set(id, ctrl);
      inflightRef.current.add(id);
      try {
        const depth = journeyDepth();
        const res = await fetch("/api/suggestions/bud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            branch: branchVoice,
            scope: scopeHint ?? undefined,
            context: buildContext(node),
            seen: seenListFor(node),
            seeds: nodesRef.current
              .filter((n) => n.data.role === "typed")
              .slice(-6)
              .map((n) => n.data.text),
            depth,
            score: tierToScore(depth.tier, biasRef.current),
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          branches?: { type: BranchType; question: string; reason?: string }[];
        };
        if (ctrl.signal.aborted) return;
        const branches = data.branches ?? [];
        if (branches.length === 0) {
          setBusy("failed");
        } else {
          growChildren(node, branches, dir);
          setBusy("idle");
          recordSeen(branches.slice(0, 5).map((b) => b.question));
        }
      } catch {
        if (ctrl.signal.aborted) return;
        setBusy("failed");
      } finally {
        inflightRef.current.delete(id);
        abortsRef.current.delete(id);
        schedulePersist();
      }
    },
    [
      branchVoice,
      buildContext,
      disabled,
      growChildren,
      schedulePersist,
      scopeHint,
      seenListFor,
      setNodes,
    ]
  );

  /* ---------------------- the walk's focus ------------------------ */
  const focusNode = useCallback(
    (id: string, opts?: { record?: boolean; center?: boolean }) => {
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node || disabled) return;
      if (selectedRef.current && selectedRef.current !== id) {
        prevFocusRef.current = [
          ...prevFocusRef.current.filter((p) => p !== selectedRef.current),
          selectedRef.current,
        ].slice(-24);
      }
      const key = node.data.text;
      revisitsRef.current.set(key, (revisitsRef.current.get(key) ?? 0) + 1);
      setSelectedId(id);
      selectedRef.current = id;
      applyFocusVisuals(id);
      setTrail((tr) => [...tr.filter((x) => x !== id), id].slice(-40));
      setGrowCount((g) => g);
      if (opts?.record !== false) {
        /* THE DNA'S OWN STEP — every question the walk stands on is
           one rung of the helix: the profile evolves with the path */
        recordJourney({
          b: category,
          s: key.length > 52 ? `${key.slice(0, 52)}…` : key,
        });
      }
      if (opts?.center !== false) {
        const zoom = Math.max(rf.getZoom(), 0.82);
        rf.setCenter(
          node.position.x + NAV_NODE_W / 2,
          node.position.y + NAV_NODE_H / 2 - 44 / zoom,
          { zoom, duration: reducedMotionRef.current ? 0 : 420 }
        );
      }
      setHintSeen(true);
      /* a focused branch shows its own possibilities — one deliberate
         growth when none stand yet */
      if (node.data.childCount === 0 && node.data.role !== "creation") {
        void expandNode(id, undefined, false);
      }
      schedulePersist();
    },
    [applyFocusVisuals, category, disabled, expandNode, rf, schedulePersist]
  );

  /* the node's own hands — events ride the DOM so the node component
     stays memoized and its props never change identity */
  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id) focusNode(id);
    };
    const onAct = (e: Event) => {
      const { id, act } =
        (e as CustomEvent<{ id: string; act: string }>).detail ?? {};
      if (!id) return;
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node) return;
      if (act === "send") {
        recordSeen([node.data.text]);
        setTrail((tr) => [...tr.filter((x) => x !== id), id].slice(-40));
        onPick(node.data.text, node.data.movement);
        schedulePersist();
      } else if (act === "grow") {
        attemptedRef.current.delete(id);
        void expandNode(id, undefined, false);
      } else if (act === "creation") {
        onCreation(node.data.creation ?? "book", node.data.topic ?? node.data.text);
      }
    };
    window.addEventListener("nav:select", onSelect);
    window.addEventListener("nav:act", onAct);
    return () => {
      window.removeEventListener("nav:select", onSelect);
      window.removeEventListener("nav:act", onAct);
    };
  }, [expandNode, focusNode, onCreation, onPick, schedulePersist]);

  /* ------------------- the camera's settled ear ------------------- */
  const onMoveEnd = useCallback(
    (_e: unknown, vp: { x: number; y: number; zoom: number }) => {
      cameraRef.current = vp;
      schedulePersist();
      const last = lastAutoRef.current;
      if (
        last &&
        Math.hypot(vp.x - last.x, vp.y - last.y) < NAV_HYSTERESIS &&
        Math.abs(vp.zoom - last.zoom) < 0.08
      )
        return;
      const wrap = wrapperRef.current?.getBoundingClientRect();
      if (!wrap) return;
      const tl = rf.screenToFlowPosition({ x: wrap.left, y: wrap.top });
      const br = rf.screenToFlowPosition({ x: wrap.right, y: wrap.bottom });
      const hit = frontierPick(
        nodesRef.current,
        { left: tl.x, top: tl.y, right: br.x, bottom: br.y },
        attemptedRef.current
      );
      setFrontierDir(hit ? hit.dir : null);
      if (!hit) return;
      lastAutoRef.current = { x: vp.x, y: vp.y, zoom: vp.zoom };
      void expandNode(hit.nodeId, hit.dir, true);
    },
    [expandNode, rf, schedulePersist]
  );

  /* ------------------ the visitor's typed question ---------------- */
  const attachTypedQuestion = useCallback(
    (text: string) => {
      if (!text.trim() || disabled) return;
      const anchorId = selectedRef.current ?? homeId;
      const anchor = nodesRef.current.find((n) => n.id === anchorId);
      if (!anchor) return;
      /* the question connects to the current focus, born on the side
         with the most free ground */
      const children = nodesRef.current.filter(
        (n) => n.data.parentId === anchor.id
      );
      const cx = anchor.position.x + NAV_NODE_W / 2;
      const cy = anchor.position.y + NAV_NODE_H / 2;
      let fx = 0;
      let fy = 0;
      for (const c of children) {
        fx += c.position.x - anchor.position.x;
        fy += c.position.y - anchor.position.y;
      }
      const away = children.length
        ? Math.atan2(-fy, -fx)
        : (navHash(text) % 628) / 100;
      const [pos] = placeAround(
        { x: cx, y: cy },
        away,
        nodesRef.current,
        1,
        navHash(text)
      );
      const id = navId();
      const node: NavNode = {
        id,
        type: "nav-question",
        position: pos,
        data: {
          text,
          movement: "reflect",
          accent: "var(--scope-a, var(--gd))",
          kind: navKindForText(text),
          role: "typed",
          status: "idle",
          childCount: 0,
          depth: anchor.data.depth + 1,
          parentId: anchor.id,
        },
      };
      const edge: NavEdge = {
        id: `e:${anchor.id}:${id}`,
        source: anchor.id,
        target: id,
        type: "nav",
        data: { accent: "var(--scope-a, var(--gd))" },
        style: { stroke: "var(--scope-a, var(--gd))", strokeOpacity: 0.55, strokeWidth: 1.4 },
      };
      setNodes((nds) => {
        const settled = freePosition(node, nds);
        return [...nds, { ...node, position: settled }];
      });
      setEdges((es) => [...es, edge]);
      setSelectedId(id);
      selectedRef.current = id;
      applyFocusVisuals(id);
      setTrail((tr) => [...tr.filter((x) => x !== id), id].slice(-40));
      void expandNode(id, undefined, false);
      schedulePersist();
    },
    [applyFocusVisuals, disabled, expandNode, schedulePersist, setEdges, setNodes]
  );

  const attachRef = useRef(attachTypedQuestion);
  attachRef.current = attachTypedQuestion;
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      attachTypedQuestion: (text: string) => attachRef.current(text),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  /* --------------------- the quiet controls ----------------------- */
  useEffect(() => {
    try {
      reducedMotionRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    } catch {
      /* quiet */
    }
    /* the first visit's own hint — one gentle line, then it rests */
    let known = true;
    try {
      known = !!window.localStorage.getItem("mirror:navigator-hint");
    } catch {
      known = false;
    }
    setHintSeen(known);
    const timer = window.setTimeout(() => {
      setHintSeen(true);
      try {
        window.localStorage.setItem("mirror:navigator-hint", "1");
      } catch {
        /* quiet */
      }
    }, 11000);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissHint = useCallback(() => {
    setHintSeen(true);
    try {
      window.localStorage.setItem("mirror:navigator-hint", "1");
    } catch {
      /* quiet */
    }
  }, []);

  const comeHome = useCallback(() => {
    focusNode(homeId, { record: false, center: false });
    rf.fitView({ padding: 0.42, duration: reducedMotionRef.current ? 0 : 520 });
  }, [focusNode, rf]);

  const backToPrevious = useCallback(() => {
    const prev = prevFocusRef.current.pop();
    if (prev && nodesRef.current.some((n) => n.id === prev)) {
      focusNode(prev, { record: false });
    } else {
      comeHome();
    }
  }, [comeHome, focusNode]);

  const startFreshJourney = useCallback(() => {
    dropSnapshot(focusKey);
    attemptedRef.current = new Set();
    inflightRef.current = new Set();
    autoCountRef.current = 0;
    crossCountRef.current = 0;
    growCountRef.current = 0;
    prevFocusRef.current = [];
    revisitsRef.current = new Map();
    lastAutoRef.current = null;
    const seeded = seedGraph(
      [],
      golden,
      `${focusKey}:${Date.now()}`,
      homeText
    );
    setNodes(seeded.nodes);
    setEdges(seeded.edges);
    setSelectedId(null);
    selectedRef.current = null;
    setTrail([]);
    applyFocusVisuals(null);
    window.setTimeout(
      () => rf.fitView({ padding: 0.4, duration: reducedMotionRef.current ? 0 : 400 }),
      60
    );
    schedulePersist();
  }, [applyFocusVisuals, focusKey, golden, rf, schedulePersist, setEdges, setNodes]);

  /* ------------------- the journey's own panel -------------------- */
  const journeyData = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const steps = trail
      .map((id) => byId.get(id))
      .filter((n): n is NavNode => !!n)
      .slice(-12);
    const revisited = [...revisitsRef.current.entries()]
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const cross = edges
      .filter((e) => e.data?.cross)
      .slice(0, 6)
      .map((e) => ({
        a: byId.get(e.source)?.data.text ?? "",
        b: byId.get(e.target)?.data.text ?? "",
        reason: e.data?.reason ?? "",
      }));
    const reflection = steps
      .slice(-3)
      .map((n) => MOVEMENT_PHRASES[n.data.movement] ?? n.data.movement);
    return { steps, revisited, cross, reflection };
  }, [edges, nodes, trail]);

  const listData = useMemo(() => {
    const home = nodes.find((n) => n.id === homeId);
    const rest = [...nodes]
      .filter((n) => n.id !== homeId)
      .sort((a, b) => a.data.depth - b.data.depth || a.position.y - b.position.y)
      .slice(0, 80);
    return { home, rest };
  }, [nodes]);

  /* ----------------------- the caretaking ------------------------- */
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => {
    schedulePersist();
    return () => {
      if (persistTimerRef.current != null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      for (const ctrl of abortsRef.current.values()) ctrl.abort();
      abortsRef.current.clear();
      persistRef.current();
    };
  }, [schedulePersist]);

  const onInit = useCallback(() => {
    const saved = boot.camera;
    /* the composer's own ground — the fit leaves the whisper line's
       floor clear (a deeper bottom padding), the crown's sky clear */
    const pad = { top: "7%", left: "13%", right: "13%", bottom: "22%" } as const;
    if (saved) {
      rf.setViewport(saved, { duration: 0 });
    } else {
      rf.fitView({ padding: pad, duration: 0 });
      /* the second fit — once every node has stood measured once, the
         whole welcoming map rests inside the view */
      window.setTimeout(
        () => rf.fitView({ padding: pad, duration: reducedMotionRef.current ? 0 : 260 }),
        220
      );
    }
    /* the keeper's own instrument (dev only) — seed a representative
       journey of n stored nodes to profile the mounted subset */
    if (process.env.NODE_ENV !== "production") {
      const stressMoves: BranchType[] = [
        "reflect",
        "deepen",
        "connect",
        "apply",
        "create",
        "contrast",
        "pause",
      ];
      (window as unknown as Record<string, unknown>).__navStress = (n?: number) => {
        const count = Math.max(1, Math.min(200, Math.floor(n ?? 120)));
        const extra: NavNode[] = [];
        for (let i = 0; i < count; i++) {
          const a = i * 2.399963;
          const r = 300 + i * 26;
          const id = navId();
          extra.push({
            id,
            type: "nav-question",
            position: {
              x: Math.cos(a) * r - NAV_NODE_W / 2,
              y: Math.sin(a) * r * 0.8 - NAV_NODE_H / 2,
            },
            data: {
              text: `Stress question ${i + 1} — what does the walk notice here?`,
              movement: stressMoves[i % 7],
              accent: "#22d3ee",
              kind: "mirror",
              role: "question",
              status: "idle",
              childCount: 0,
              depth: 2 + (i % 6),
              parentId: i === 0 ? "home" : extra[i - 1].id,
            },
          });
        }
        setNodes((nds) => [...nds, ...extra]);
        setEdges((es) => [
          ...es,
          ...extra.map((n, i) => ({
            id: `e:${n.data.parentId}:${n.id}`,
            source: n.data.parentId!,
            target: n.id,
            type: "nav",
            data: { accent: "#22d3ee" },
            style: { stroke: "#22d3ee", strokeOpacity: 0.55, strokeWidth: 1.4 },
          })),
        ]);
        return count;
      };
    }
  }, [boot.camera, rf, setEdges, setNodes]);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div
      ref={wrapperRef}
      role="region"
      aria-label={t("The branching navigator")}
      data-testid={`${testIdPrefix}-navigator`}
      className="nav-flow absolute inset-0"
    >
      <ReactFlow<NavNode, NavEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, n) => {
          if (n.id === homeId) comeHome();
          else focusNode(n.id);
        }}
        onMoveEnd={onMoveEnd}
        onInit={onInit}
        onPaneClick={dismissHint}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onlyRenderVisibleElements
        zoomOnScroll={false}
        panOnScroll={false}
        zoomOnPinch
        zoomOnDoubleClick={false}
        nodeClickDistance={8}
        minZoom={0.34}
        maxZoom={1.5}
        panOnDrag
        defaultEdgeOptions={{ type: "nav" }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={30}
          size={1.5}
          color="color-mix(in srgb, var(--gd) 16%, transparent)"
        />
      </ReactFlow>

      {/* THE FLOOR'S OWN LIGHT — one soft glow behind the walk, the
          focused family's color breathing under the map */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-56 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--scope-a,var(--gd)) 13%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* THE FIRST VISIT'S HINT — one gentle line, then it rests */}
      {!hintSeen && (
        <button
          type="button"
          onClick={dismissHint}
          className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border bg-background/95 px-4 py-1.5 text-[12px] italic text-muted-foreground shadow-[0_8px_26px_-14px_rgba(0,0,0,0.5)]"
          data-testid={`${testIdPrefix}-nav-hint`}
        >
          {t("Follow a question, or move around to discover new paths.")}
        </button>
      )}

      {/* THE DEPTH'S OWN CONTROLS — simple words for a simple choice */}
      <div
        className="absolute left-2 z-20 flex items-center gap-1 rounded-full border bg-background/90 px-1 py-0.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]"
        style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          onClick={() => setDepthBias((b) => (b === -1 ? 0 : -1))}
          aria-pressed={depthBias === -1}
          data-testid={`${testIdPrefix}-nav-simpler`}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] transition-colors duration-200",
            depthBias === -1
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("Simpler")}
        </button>
        <button
          type="button"
          onClick={() => setDepthBias((b) => (b === 1 ? 0 : 1))}
          aria-pressed={depthBias === 1}
          data-testid={`${testIdPrefix}-nav-deeper`}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] transition-colors duration-200",
            depthBias === 1
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t("Explore deeper")}
        </button>
      </div>

      {/* THE WALK'S OWN HANDS — zoom, fit, home, back, journey, list */}
      <div
        className="absolute right-2 z-20 flex flex-col gap-1 rounded-full border bg-background/90 p-1 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]"
        style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        {(
          [
            {
              key: "zoom-in",
              icon: Plus,
              label: "Zoom in",
              on: () => rf.zoomIn({ duration: reducedMotionRef.current ? 0 : 240 }),
            },
            {
              key: "zoom-out",
              icon: Minus,
              label: "Zoom out",
              on: () => rf.zoomOut({ duration: reducedMotionRef.current ? 0 : 240 }),
            },
            {
              key: "fit",
              icon: Maximize2,
              label: "Fit the journey into view",
              on: () =>
                rf.fitView({
                  padding: 0.34,
                  duration: reducedMotionRef.current ? 0 : 480,
                  nodes: trail.length ? trail.map((id) => ({ id })) : undefined,
                }),
            },
            {
              key: "home",
              icon: Compass,
              label: "Return home",
              on: comeHome,
            },
            {
              key: "back",
              icon: RotateCcw,
              label: "Return to the previous focus",
              on: backToPrevious,
            },
            {
              key: "journey",
              icon: NotebookPen,
              label: "My journey",
              on: () => setJourneyOpen((v) => !v),
              active: journeyOpen,
            },
            {
              key: "list",
              icon: ListTree,
              label: "The walk as a list",
              on: () => setListOpen((v) => !v),
              active: listOpen,
            },
          ] as {
            key: string;
            icon: typeof Plus;
            label: string;
            on: () => void;
            active?: boolean;
          }[]
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={c.on}
            aria-label={t(c.label)}
            aria-pressed={c.active}
            title={t(c.label)}
            data-testid={`${testIdPrefix}-nav-${c.key}`}
            className={cn(
              "focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground",
              c.active && "bg-foreground/10 text-foreground"
            )}
          >
            <c.icon className="size-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* THE FRONTIER'S OWN CUE — a quiet whisper that more paths wait */}
      {frontierDir && !journeyOpen && !listOpen && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 rounded-full border bg-background/80 px-2.5 py-1 text-[10px] italic text-muted-foreground"
          style={
            frontierDir === "left"
              ? { left: 8, top: "50%" }
              : frontierDir === "right"
                ? { right: 8, top: "50%" }
                : frontierDir === "top"
                  ? { left: "50%", top: 60 }
                  : { left: "50%", bottom: 96 }
          }
        >
          {t("more paths this way")}{" "}
          <ChevronRight className="inline size-3" aria-hidden="true" />
        </div>
      )}

      {/* MY JOURNEY — the walk's own quiet mirror */}
      {journeyOpen && (
        <div
          role="dialog"
          aria-label={t("My journey")}
          data-testid={`${testIdPrefix}-nav-journey`}
          className="absolute bottom-24 right-2 z-30 flex max-h-[52vh] w-[min(320px,calc(100vw-2rem))] flex-col rounded-2xl border bg-background/97 p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("My journey")}
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={startFreshJourney}
                className="rounded-full px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
                title={t("Start a fresh journey")}
              >
                {t("Fresh journey")}
              </button>
              <button
                type="button"
                onClick={() => setJourneyOpen(false)}
                aria-label={t("Close")}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          </div>
          <div className="nice-scroll mt-2 flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-0.5 text-[12px] leading-relaxed">
            {/* the trail */}
            <div>
              <p className="mono-label mb-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                {t("The questions you followed")}
              </p>
              {journeyData.steps.length === 0 && (
                <p className="text-[11.5px] italic text-muted-foreground">
                  {t("Touch a question to begin the trail.")}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {journeyData.steps.map((n) => (
                  <li key={n.id} className="flex items-center gap-1.5">
                    <i
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: n.data.accent }}
                    />
                    <button
                      type="button"
                      onClick={() => focusNode(n.id)}
                      className="min-w-0 flex-1 truncate text-left text-foreground/90 hover:text-foreground"
                      title={t(n.data.text)}
                    >
                      {t(n.data.text)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrail((tr) => tr.filter((x) => x !== n.id))}
                      aria-label={t("Remove this step")}
                      className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {/* the tentative reflection */}
            {journeyData.reflection.length > 0 && (
              <div className="rounded-xl border border-dashed p-2.5">
                <p className="text-[11.5px] italic leading-relaxed text-muted-foreground">
                  {t("Tentatively —")}
                </p>
                <p className="text-[12px] leading-relaxed text-foreground/90">
                  {t("You explored")}{" "}
                  {journeyData.reflection.map((p, i) => (
                    <span key={i}>
                      {i > 0 &&
                        (i === journeyData.reflection.length - 1
                          ? ` ${t("and")} `
                          : ", ")}
                      {t(p)}
                    </span>
                  ))}
                  .{" "}
                  {t(
                    "Correct or dismiss this if it does not fit — only you know your walk."
                  )}
                </p>
              </div>
            )}
            {/* revisited themes */}
            {journeyData.revisited.length > 0 && (
              <div>
                <p className="mono-label mb-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Themes you revisited")}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {journeyData.revisited.map(([text, c]) => (
                    <li
                      key={text}
                      className="truncate text-[11.5px] text-foreground/80"
                    >
                      {t(text)} <span className="text-muted-foreground">×{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* cross-connections */}
            {journeyData.cross.length > 0 && (
              <div>
                <p className="mono-label mb-1 flex items-center gap-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Waypoints className="size-3" aria-hidden="true" />
                  {t("Useful crossings")}
                </p>
                <ul className="flex flex-col gap-1">
                  {journeyData.cross.map((c, i) => (
                    <li
                      key={i}
                      className="text-[11.5px] leading-snug text-foreground/80"
                    >
                      {t(c.a)} <span className="text-muted-foreground">↔</span>{" "}
                      {t(c.b)}
                      {c.reason && (
                        <span className="block text-[10.5px] italic text-muted-foreground">
                          {c.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* the note for the standing focus */}
            {selectedNode && selectedNode.id !== homeId && (
              <div>
                <p className="mono-label mb-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("A note on the standing question")}
                </p>
                <textarea
                  value={notes[selectedNode.id] ?? ""}
                  onChange={(e) =>
                    setNotes((ns) => ({ ...ns, [selectedNode.id]: e.target.value }))
                  }
                  placeholder={t("Your own words, kept only for you")}
                  rows={2}
                  className="w-full resize-none rounded-lg border bg-transparent p-2 text-[11.5px] leading-snug text-foreground outline-none focus:border-foreground/30"
                />
              </div>
            )}
            {/* the explicit ask — nothing is kept unless the visitor says so */}
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={persistOk}
                onChange={(e) => {
                  setPersistState(e.target.checked);
                  setPersistOk(e.target.checked);
                  schedulePersist();
                }}
                className="accent-foreground"
              />
              {t("Remember my journeys on this device")}
            </label>
          </div>
        </div>
      )}

      {/* THE WALK AS A LIST — the same map, spoken in a line */}
      {listOpen && (
        <div
          role="dialog"
          aria-label={t("The walk as a list")}
          data-testid={`${testIdPrefix}-nav-list`}
          className="absolute inset-x-2 top-12 z-30 flex max-h-[58vh] flex-col rounded-2xl border bg-background/97 p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)]"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("The walk as a list")}
            </span>
            <button
              type="button"
              onClick={() => setListOpen(false)}
              aria-label={t("Close")}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="nice-scroll flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-0.5">
            {listData.home && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    comeHome();
                    setListOpen(false);
                  }}
                  className="w-full truncate rounded-lg px-2 py-1.5 text-left text-[12.5px] italic text-foreground/90 hover:bg-foreground/5"
                >
                  {t(listData.home.data.text)}
                </button>
              </li>
            )}
            {listData.rest.map((n) => (
              <li key={n.id}>
                <div
                  className="flex items-center gap-1 rounded-lg px-1 py-0.5 hover:bg-foreground/5"
                  style={{ marginLeft: Math.min(n.data.depth - 1, 5) * 14 }}
                >
                  <i
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: n.data.accent }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      focusNode(n.id);
                      setListOpen(false);
                    }}
                    className="min-w-0 flex-1 truncate py-1 text-left text-[12.5px] text-foreground/90 hover:text-foreground"
                    title={t(n.data.text)}
                  >
                    {t(n.data.text)}
                  </button>
                  {n.data.role !== "creation" && (
                    <button
                      type="button"
                      onClick={() => {
                        recordSeen([n.data.text]);
                        onPick(n.data.text, n.data.movement);
                      }}
                      aria-label={t("Ask the mirror")}
                      title={t("Ask the mirror")}
                      className="shrink-0 p-1 text-muted-foreground/70 hover:text-foreground"
                    >
                      <Send className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ----------------------- the outer wrapper -------------------------- */

export function BranchNavigator(props: BranchNavigatorProps) {
  return (
    <ReactFlowProvider>
      <NavInner {...props} />
    </ReactFlowProvider>
  );
}
