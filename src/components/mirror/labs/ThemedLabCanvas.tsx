"use client";

import "@xyflow/react/dist/style.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Download,
  DraftingCompass,
  Eraser,
  LayoutList,
  Map as MapIcon,
  MessageCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type IsValidConnection,
} from "@xyflow/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { usePerfMode } from "@/lib/perf-mode";
import { LabPiece, LabConfigContext, LabHandsContext, PIECE_WIDTH, type LabHands } from "./LabPieceNode";
import {
  STATUS_META,
  type LabConfig,
  type LabNodeStatus,
} from "./lab-config";
import {
  MAX_EDGES,
  MAX_NODES,
  clearLabDraft,
  labNodeId,
  loadLabDraft,
  saveLabDraft,
  type LabDraft,
  type LabPieceNode,
} from "./lab-draft";
import type { LaidPiece } from "./parse-reply";

/* ------------------------------------------------------------------ */
/*  THE THEMED LAB — one shared bench for every lab in the house.      */
/*  The Invention Lab and the Manifesting Lab are the same canvas      */
/*  wearing different lights: the kinds, the words and the draft key   */
/*  come from the lab's own config; the standing light always rides    */
/*  `var(--scope-a)` — the accent the workspace frame already wears.   */
/*                                                                     */
/*  THE HONEST KEEP — there is no server shelf for lab artifacts, so   */
/*  each bench rests on the visitor's own device: an autosaved draft   */
/*  under the lab's own key (the forge's `mirror-invent-canvas-v1`     */
/*  unchanged — no one loses their bench), restored with a quiet word. */
/* ------------------------------------------------------------------ */

/* the restore word is spoken once per visit, per lab — not on every
   quiet remount of the mode toggle */
const draftToastShown: Record<string, boolean> = {};

/* THE LAB'S OWN SCOPED SHEET — React Flow's internals wear the
   house's dialect here: glass controls at 44px, chalk handles,
   scope-tinted bonds, stillness under prefers-reduced-motion. */
const LAB_SHEET = `
.lab-canvas { --lab-chalk: #f2eee4; }
html.dark .lab-canvas { --lab-chalk: var(--foreground); }
.lab-canvas .react-flow__handle {
  width: 9px; height: 9px; border: none; border-radius: 9999px;
  background-color: color-mix(in srgb, var(--lab-chalk) 38%, transparent);
  opacity: 0.45;
  transition: opacity 200ms ease, background-color 200ms ease;
}
.lab-canvas .react-flow__node:hover .react-flow__handle,
.lab-canvas .react-flow__node.selected .react-flow__handle {
  opacity: 1;
  background-color: color-mix(in srgb, var(--lab-chalk) 72%, transparent);
}
.lab-canvas .react-flow__edge-path {
  stroke: color-mix(in srgb, var(--lab-chalk) 32%, transparent);
  stroke-width: 1.5;
}
.lab-canvas .react-flow__edge:hover .react-flow__edge-path,
.lab-canvas .react-flow__edge.selected .react-flow__edge-path {
  stroke: color-mix(in srgb, var(--scope-a, var(--gd)) 78%, transparent);
}
.lab-canvas .react-flow__connection-path {
  stroke: color-mix(in srgb, var(--scope-a, var(--gd)) 72%, transparent);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
}
.lab-canvas .react-flow__node.lab-dim { opacity: 0.22; }
.lab-canvas .react-flow__node {
  transition: opacity 300ms ease;
}
.lab-canvas .react-flow__controls {
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px -18px rgba(0, 0, 0, 0.9);
}
.lab-canvas .react-flow__controls-button {
  width: 44px; height: 44px; padding: 0;
  background: rgba(13, 15, 19, 0.78);
  border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  transition: background-color 200ms ease, color 200ms ease;
}
.lab-canvas .react-flow__controls-button:last-child { border-bottom: none; }
.lab-canvas .react-flow__controls-button:hover {
  background: rgba(255, 255, 255, 0.12); color: #fff;
}
.lab-canvas .react-flow__controls-button svg {
  max-width: 15px; max-height: 15px; fill: currentColor;
}
.lab-canvas .react-flow__minimap {
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.lab-canvas .react-flow__attribution { background: transparent; }
.lab-canvas .react-flow__attribution a { color: rgba(255, 255, 255, 0.3); }
@media (prefers-reduced-motion: reduce) {
  .lab-canvas .react-flow__handle,
  .lab-canvas .react-flow__edge-path,
  .lab-canvas .react-flow__node,
  .lab-canvas .react-flow__controls-button { transition: none !important; }
}
`;

/* the obsidian bench's own ground — a still depth, no motion */
const BENCH_STYLE: CSSProperties = {
  background:
    "radial-gradient(120% 90% at 50% 0%, #17181d 0%, #0e0f13 48%, #0a0b0e 100%)",
};

/* the toolbar's glass hand — dark glass on the obsidian bench */
const TOOL_HAND =
  "h-11 rounded-xl border-white/12 bg-white/8 text-white/85 hover:border-white/20 hover:bg-white/14";

/* the small glass chip — h-8, hairline scope edge, hover glow
   (the house's btn-chip dialect, worn by the summary panel's hands) */
const CHIP =
  "focus-glow inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors duration-300";

const NODE_TYPES = { "lab-piece": LabPiece };

/* the ask message's own clip — context, not scripture */
function clipLine(s: string, cap: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= cap ? t : t.slice(0, cap).trimEnd() + "…";
}

export type ThemedLabProps = {
  config: LabConfig;
  /** pieces laid from the room's conversation — drained on sight */
  inbox?: LaidPiece[];
  onInboxConsumed?: () => void;
  /** the lab→chat hand: a context message dropped into the room's
      conversation (the room's own send flow carries it) */
  onAskMirror?: (message: string) => void;
};

function LabBench({ config, inbox, onInboxConsumed, onAskMirror }: ThemedLabProps) {
  const t = useT();
  const rf = useReactFlow();
  const eco = usePerfMode((s) => s.tier === "eco");

  /* THE FIRST BREATH — the draft is read once, lazily, before the
     first render settles, so the bench wakes with its pieces already
     standing and React Flow's own fitView finds them where they were
     left. useState's own lazy door — read once, never re-read. */
  const [boot] = useState<{ draft: LabDraft | null; miniMap: boolean }>(() => {
    const draft = loadLabDraft(config);
    return {
      draft,
      miniMap:
        draft?.miniMap ??
        (typeof window !== "undefined" && window.innerWidth >= 640),
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<LabPieceNode>(
    boot.draft?.nodes ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    boot.draft?.edges ?? []
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [miniMapOn, setMiniMapOn] = useState(boot.miniMap);
  const [clearArmed, setClearArmed] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const focusTimerRef = useRef<number | null>(null);

  const benchRef = useRef<HTMLDivElement | null>(null);
  const armTimerRef = useRef<number | null>(null);

  /* the autosave's own mirrors — synced after each render (never
     during it), so the flush-on-leave reads the bench as it stood */
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const miniMapRef = useRef(miniMapOn);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    miniMapRef.current = miniMapOn;
  }, [nodes, edges, miniMapOn]);

  /* THE RESTORED DRAFT — one honest word when the bench wakes with
     work on it (spoken once per visit, never on every remount) */
  useEffect(() => {
    const draft = boot.draft;
    if (draft && draft.nodes.length > 0 && !draftToastShown[config.id]) {
      draftToastShown[config.id] = true;
      toast(t("Draft restored"), {
        description: t(config.restoreToast),
      });
    }
  }, [boot.draft, config.id, config.restoreToast, t]);

  /* THE AUTOSAVE — every settled change rests on the device a breath
     later (debounced). The lamp on the toolbar keeps one standing
     honest line: the draft lives on this device, never on a server. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      saveLabDraft(config, nodes, edges, miniMapOn);
    }, 700);
    return () => window.clearTimeout(id);
  }, [nodes, edges, miniMapOn, config]);

  /* THE FLUSH ON LEAVING — the bench saves itself the moment the
     visitor turns away, so a quick ask-the-Mirror never loses a move */
  useEffect(() => {
    return () => {
      saveLabDraft(config, nodesRef.current, edgesRef.current, miniMapRef.current);
    };
  }, [config]);

  /* the arms of the clear and focus hands lay themselves down */
  useEffect(() => {
    return () => {
      if (armTimerRef.current) window.clearTimeout(armTimerRef.current);
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    };
  }, []);

  const openEditor = useCallback((id: string | null) => {
    setEditingId(id);
  }, []);

  const updateData = useCallback(
    (id: string, patch: Partial<LabPieceNode["data"]>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
    },
    [setNodes]
  );

  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges]
  );

  /* THE ASK HANDS — the bench's words carried into the room's own
     conversation. The message is built here, from the honest state of
     the bench; the room's existing send flow does the carrying. */
  const askAboutPiece = useCallback(
    (id: string) => {
      if (!onAskMirror) return;
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node) return;
      const kindLabel =
        config.kinds[node.data.kind]?.label ?? node.data.kind;
      const statusLabel = t(STATUS_META[node.data.status].label);
      const others = nodesRef.current.length - 1;
      const note = node.data.note.trim();
      const message = [
        `From my ${config.surfaceWord}, one piece to weigh:`,
        `“${node.data.name}” — ${kindLabel} · ${statusLabel}${note ? ` — ${clipLine(note, 160)}` : ""}`,
        `It stands among ${others === 1 ? "1 other piece" : `${others} other pieces`} on my ${config.surfaceWord}. What does the Mirror see in it, and what would make it stronger?`,
      ].join("\n");
      onAskMirror(message);
    },
    [config, onAskMirror, t]
  );

  const askAboutBench = useCallback(() => {
    if (!onAskMirror) return;
    const all = nodesRef.current;
    if (all.length === 0) {
      toast(t("The bench is empty"), {
        description: t("Lay a piece down first, then ask."),
      });
      return;
    }
    const byKind = config.kindOrder
      .map((k) => {
        const c = all.filter((n) => n.data.kind === k).length;
        return c > 0 ? `${c} ${config.kinds[k].label.toLowerCase()}` : null;
      })
      .filter(Boolean)
      .join(", ");
    const byStatus = (
      ["draft", "active", "done"] as LabNodeStatus[]
    )
      .map((s) => {
        const c = all.filter((n) => n.data.status === s).length;
        return c > 0 ? `${c} ${t(STATUS_META[s].label).toLowerCase()}` : null;
      })
      .filter(Boolean)
      .join(", ");
    const shown = all.slice(0, 10);
    const lines = shown.map((n) => {
      const note = n.data.note.trim();
      return `• ${n.data.name} (${config.kinds[n.data.kind]?.label ?? n.data.kind} · ${t(STATUS_META[n.data.status].label)})${note ? ` — ${clipLine(note, 70)}` : ""}`;
    });
    const rest = all.length - shown.length;
    const message = [
      `Here is my ${config.surfaceWord} as it stands — ${all.length} ${config.summary.pieces} (${byKind}), ${edgesRef.current.length} ${config.summary.bonds}, ${byStatus}:`,
      ...lines,
      rest > 0 ? t("…and {n} more pieces.", { n: rest }) : "",
      `What should I strengthen first, and what is missing?`,
    ]
      .filter(Boolean)
      .join("\n");
    onAskMirror(message);
  }, [config, onAskMirror, t]);

  const hands: LabHands = useMemo(
    () => ({
      editingId,
      openEditor,
      updateData,
      removeNode,
      askAboutPiece,
      focusId,
    }),
    [editingId, openEditor, updateData, removeNode, askAboutPiece, focusId]
  );

  /* THE ADD HAND — a new piece lands near the bench's heart, a breath
     to the side each time so pieces never stack, and its editor opens
     at once: the kind is chosen, the words come next. */
  const addNode = useCallback(
    (kind: string) => {
      if (nodes.length >= config.maxNodes) {
        toast.error(
          t("The bench is full — it holds {max} pieces at most.", {
            max: config.maxNodes,
          })
        );
        return;
      }
      const k = nodes.length;
      const dx = ((k % 3) - 1) * 56;
      const dy = ((k % 4) - 1.5) * 44;
      let position = { x: 0, y: 0 };
      const el = benchRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const base = rf.screenToFlowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.4,
        });
        position = { x: base.x + dx, y: base.y + dy };
      }
      const node: LabPieceNode = {
        id: labNodeId(),
        type: "lab-piece",
        position,
        data: {
          kind,
          name: config.defaultNames[kind] ?? config.kinds[kind]?.label ?? "Piece",
          note: "",
          status: "draft",
        },
      };
      setNodes((nds) => [...nds, node]);
      setEditingId(node.id);
    },
    [config, nodes.length, rf, setNodes, t]
  );

  /* THE BLUEPRINT HAND — a starter graph laid in one tap, centered on
     the bench's view so the whole shape is seen at once */
  const addTemplate = useCallback(
    (templateId: string) => {
      const tpl = config.templates.find((tp) => tp.id === templateId);
      if (!tpl) return;
      if (nodes.length + tpl.nodes.length > config.maxNodes) {
        toast.error(
          t("The bench is full — it holds {max} pieces at most.", {
            max: config.maxNodes,
          })
        );
        return;
      }
      if (edges.length + tpl.bonds.length > config.maxEdges) {
        toast.error(
          t("The bench holds {max} bonds at most.", { max: config.maxEdges })
        );
        return;
      }
      const el = benchRef.current;
      let base = { x: 0, y: 0 };
      if (el) {
        const rect = el.getBoundingClientRect();
        base = rf.screenToFlowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.42,
        });
      }
      const stamp = labNodeId();
      const newNodes: LabPieceNode[] = tpl.nodes.map((tn, i) => ({
        id: `${stamp}-t${i}`,
        type: "lab-piece",
        position: { x: base.x + tn.dx, y: base.y + tn.dy },
        data: { kind: tn.kind, name: tn.name, note: "", status: "draft" },
      }));
      const ids = newNodes.map((n) => n.id);
      const newEdges: Edge[] = tpl.bonds.map(([s, tg], i) => ({
        id: `${stamp}-b${i}`,
        source: ids[s],
        target: ids[tg],
        type: "smoothstep",
        animated: false,
      }));
      setEditingId(null);
      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      window.setTimeout(() => {
        void rf.fitView({ padding: 0.35, maxZoom: 1, duration: reduced ? 0 : 400 });
      }, 80);
    },
    [config, edges.length, nodes.length, rf, setEdges, setNodes, t]
  );

  /* THE LAYS FROM THE CONVERSATION — pieces the room's chat handed
     over ("Lay it on the bench"), drained the moment they are seen */
  const inboxConsumedRef = useRef(false);
  useEffect(() => {
    if (!inbox || inbox.length === 0 || inboxConsumedRef.current) return;
    inboxConsumedRef.current = true;
    const el = benchRef.current;
    let base = { x: 0, y: 0 };
    if (el) {
      const rect = el.getBoundingClientRect();
      base = rf.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height * 0.4,
      });
    }
    setNodes((nds) => {
      const room = config.maxNodes - nds.length;
      if (room <= 0) return nds;
      const k = nds.length;
      const laid = inbox.slice(0, room).map((p, i) => ({
        id: labNodeId() + `-l${i}`,
        type: "lab-piece" as const,
        position: {
          x: base.x + (((k + i) % 3) - 1) * 60,
          y: base.y + ((k + i) % 4) * 54,
        },
        data: { kind: p.kind, name: p.name, note: p.note, status: p.status },
      }));
      return [...nds, ...laid];
    });
    onInboxConsumed?.();
  }, [config.maxNodes, inbox, onInboxConsumed, rf, setNodes]);

  /* THE BOND HAND — a connection is a claim: this supports that.
     Self-bonds and second copies of the same claim are refused. */
  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      if (edges.some((e) => e.source === c.source && e.target === c.target))
        return;
      if (edges.length >= config.maxEdges) {
        toast.error(
          t("The bench holds {max} bonds at most.", { max: config.maxEdges })
        );
        return;
      }
      const edge: Edge = {
        id: `lab-e-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        source: c.source,
        target: c.target,
        sourceHandle: c.sourceHandle,
        targetHandle: c.targetHandle,
        type: "smoothstep",
        animated: false,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [config.maxEdges, edges, setEdges, t]
  );

  const isValidConnection = useCallback<IsValidConnection<Edge>>(
    (c) => {
      const source = "source" in c ? c.source : null;
      const target = "target" in c ? c.target : null;
      return !!source && !!target && source !== target;
    },
    []
  );

  /* THE CLEAR HAND — two honest taps: the first arms it, the second
     lays the whole bench down (and the device's draft with it) */
  const onClear = useCallback(() => {
    if (!clearArmed) {
      setClearArmed(true);
      armTimerRef.current = window.setTimeout(() => setClearArmed(false), 4000);
      return;
    }
    if (armTimerRef.current) window.clearTimeout(armTimerRef.current);
    setClearArmed(false);
    setEditingId(null);
    setFilter("");
    setNodes([]);
    setEdges([]);
    clearLabDraft(config);
    toast.success(t("The bench is cleared — a fresh spark waits."));
  }, [clearArmed, config, setEdges, setNodes, t]);

  /* THE EXPORT HAND — the plan leaves as a plain JSON file */
  const exportJson = useCallback(() => {
    const payload = {
      version: 1,
      lab: config.id,
      exportedAt: new Date().toISOString(),
      pieceCount: nodes.length,
      bondCount: edges.length,
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        name: n.data.name,
        note: n.data.note,
        status: n.data.status,
        position: { x: n.position.x, y: n.position.y },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.toolbar.exportFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t("The lab's plan is yours — the JSON file is downloaded."));
  }, [config, edges, nodes, t]);

  /* THE FOCUS HAND — a summary line asks its piece to be seen */
  const focusNode = useCallback(
    (id: string) => {
      const node = nodesRef.current.find((n) => n.id === id);
      if (!node) return;
      setFocusId(id);
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = window.setTimeout(() => setFocusId(null), 2000);
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      void rf.setCenter(
        node.position.x + PIECE_WIDTH / 2,
        node.position.y + 40,
        { zoom: 1, duration: reduced ? 0 : 400 }
      );
    },
    [rf]
  );

  /* THE FILTER — past eight pieces, the bench can be searched; the
     summary list keeps the matches, the canvas dims the rest */
  const filterActive = filter.trim().length > 0;
  const matches = useMemo(() => {
    if (!filterActive) return null;
    const q = filter.trim().toLowerCase();
    const set = new Set<string>();
    for (const n of nodes) {
      const kindLabel = config.kinds[n.data.kind]?.label ?? n.data.kind;
      if (
        n.data.name.toLowerCase().includes(q) ||
        n.data.note.toLowerCase().includes(q) ||
        kindLabel.toLowerCase().includes(q)
      )
        set.add(n.id);
    }
    return set;
  }, [config.kinds, filter, filterActive, nodes]);

  const shownNodes = useMemo(() => {
    if (!matches) return nodes;
    return nodes.map((n) =>
      matches.has(n.id)
        ? n
        : { ...n, className: "lab-dim", selected: false }
    );
  }, [matches, nodes]);

  const miniMapVisible = miniMapOn && !eco;

  const miniMapColor = useCallback(
    (n: LabPieceNode) => config.kinds[n.data.kind]?.accent ?? "#9aa0a6",
    [config.kinds]
  );

  /* the summary's own honest numbers */
  const statusCounts = useMemo(() => {
    const counts: Record<LabNodeStatus, number> = {
      draft: 0,
      active: 0,
      done: 0,
    };
    for (const n of nodes) counts[n.data.status] += 1;
    return counts;
  }, [nodes]);

  const listPieces = useMemo(() => {
    const all = nodes;
    return matches ? all.filter((n) => matches.has(n.id)) : all;
  }, [matches, nodes]);

  const summaryOpenPanel = summaryOpen && nodes.length > 0;

  return (
    <LabConfigContext.Provider value={config}>
      <LabHandsContext.Provider value={hands}>
        <style>{LAB_SHEET}</style>
        <div
          ref={benchRef}
          data-testid={`${config.testPrefix}-canvas`}
          className="lab-canvas absolute inset-0 overflow-hidden"
          style={BENCH_STYLE}
        >
          <ReactFlow<LabPieceNode>
            nodes={shownNodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeDoubleClick={(_, node) => openEditor(node.id)}
            onPaneClick={() => openEditor(null)}
            onNodesDelete={(deleted) => {
              if (deleted.some((n) => n.id === editingId)) openEditor(null);
            }}
            deleteKeyCode={["Delete", "Backspace"]}
            zoomOnDoubleClick={false}
            defaultEdgeOptions={{ type: "smoothstep", animated: false }}
            connectionRadius={16}
            minZoom={0.2}
            maxZoom={1.5}
            fitView
            fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.7}
              color="color-mix(in srgb, var(--lab-chalk) 13%, transparent)"
            />
            <Controls position="bottom-left" showInteractive={false} />
            {miniMapVisible && (
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeColor={miniMapColor}
                nodeStrokeWidth={0}
                bgColor="rgba(9, 10, 13, 0.92)"
                maskColor="rgba(9, 10, 13, 0.65)"
                ariaLabel={t(config.toolbar.map)}
              />
            )}
          </ReactFlow>

          {/* THE EMPTY BENCH — an honest invitation, never a nudge */}
          {nodes.length === 0 && (
            <div
              className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2.5 px-6 text-center"
              aria-hidden="true"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <DraftingCompass className="size-4 text-white/70" />
              </span>
              <p className="text-[13px] font-medium text-white/85">
                {t(config.empty.title)}
              </p>
              <p className="max-w-[320px] text-[12px] leading-relaxed text-white/55">
                {t(config.empty.body)}
              </p>
            </div>
          )}

          {/* THE BENCH SUMMARY — counts by kind and standing, the
              pieces as one-line whispers, the filter past eight, and
              the ask hand that carries the whole bench to the Mirror */}
          {summaryOpenPanel && (
            <aside
              data-testid={`${config.testPrefix}-summary`}
              aria-label={t(config.toolbar.summary)}
              className="glass-strong absolute right-2 top-[62px] z-10 flex max-h-[calc(100%-140px)] w-[236px] flex-col rounded-2xl p-2.5 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.9)] sm:right-3 sm:top-[66px] sm:w-[264px]"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a, var(--gd)) 26%, transparent)",
                background:
                  "color-mix(in srgb, var(--scope-a, var(--gd)) 10%, rgba(13, 15, 19, 0.88))",
              }}
            >
              <div className="flex shrink-0 items-center gap-1.5">
                <p className="mono-label min-w-0 flex-1 text-[9px] uppercase tracking-[0.18em] text-white/70">
                  {t(config.summary.title)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSummaryOpen(false);
                    setFilter("");
                  }}
                  aria-label={t("Close the summary")}
                  title={t("Close the summary")}
                  className="focus-glow flex size-6 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-1 shrink-0 text-[11.5px] text-white/70">
                {nodes.length} {t(config.summary.pieces)} · {edges.length}{" "}
                {t(config.summary.bonds)}
                {(() => {
                  const parts = (
                    ["draft", "active", "done"] as LabNodeStatus[]
                  )
                    .map((s) => {
                      const c = statusCounts[s];
                      if (c === 0) return null;
                      const meta = STATUS_META[s];
                      return (
                        <span key={s} className="ml-2 inline-flex items-center gap-1">
                          <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full"
                            style={{ background: meta.color }}
                          />
                          {c}
                        </span>
                      );
                    })
                    .filter(Boolean);
                  return parts;
                })()}
              </p>

              {nodes.length > 8 && (
                <div className="relative mt-1.5 shrink-0">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-white/45"
                    aria-hidden="true"
                  />
                  <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={t(config.summary.filter)}
                    aria-label={t(config.summary.filter)}
                    data-testid={`${config.testPrefix}-filter`}
                    className="h-8 rounded-lg border-white/12 bg-white/8 pl-7 text-[12px] text-white/90 placeholder:text-white/40"
                  />
                </div>
              )}

              <div
                className="nice-scroll mt-1.5 min-h-[42px] flex-1 overflow-y-auto pr-0.5"
                data-testid={`${config.testPrefix}-summary-list`}
              >
                {listPieces.length === 0 ? (
                  <p className="px-1 py-2 text-[11.5px] italic text-white/45">
                    {t(config.summary.empty)}
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {listPieces.map((n) => {
                      const kindMeta = config.kinds[n.data.kind];
                      const sMeta = STATUS_META[n.data.status];
                      return (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => focusNode(n.id)}
                            data-testid={`${config.testPrefix}-summary-item`}
                            className="focus-glow flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-left transition-colors duration-200 hover:bg-white/8"
                            title={t("See this piece")}
                          >
                            <span
                              aria-hidden="true"
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ background: kindMeta?.accent ?? "#9aa0a6" }}
                            />
                            <span
                              aria-hidden="true"
                              className="size-1.5 shrink-0 rounded-full opacity-80"
                              style={{ background: sMeta.color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-[11.5px] leading-snug text-white/85">
                              {n.data.name}
                            </span>
                            <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.14em] text-white/40">
                              {t(sMeta.label)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {onAskMirror && (
                <button
                  type="button"
                  onClick={askAboutBench}
                  data-testid={`${config.testPrefix}-ask-bench`}
                  className={`${CHIP} mt-1.5 shrink-0 border-[color-mix(in_srgb,var(--scope-a,var(--gd))_34%,transparent)] bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_14%,transparent)] text-[color-mix(in_srgb,var(--scope-a,var(--gd))_82%,white)] hover:border-[color-mix(in_srgb,var(--scope-a,var(--gd))_55%,transparent)] hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_22%,transparent)] hover:shadow-[0_0_16px_-8px_color-mix(in_srgb,var(--scope-a,var(--gd))_70%,transparent)]`}
                >
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  <span className="truncate">{t(config.summary.ask)}</span>
                </button>
              )}
            </aside>
          )}

          {/* THE FLOATING HANDS — glass toolbar on the bench's top edge;
              every hand 44px tall, wrapping (never overflowing) at 390px */}
          <div
            role="toolbar"
            aria-label={t(config.toolbar.summary)}
            data-testid={`${config.testPrefix}-toolbar`}
            className="absolute left-2 right-2 top-2 z-10 flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/12 bg-[rgba(13,15,19,0.72)] p-1 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:left-3 sm:right-3 sm:top-3"
          >
            {/* THE ADD HAND — one door, the lab's kinds */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className={`${TOOL_HAND} px-3 text-[12.5px]`}
                  data-testid={`${config.testPrefix}-add`}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t(config.toolbar.add)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {config.kindOrder.map((kind) => {
                  const meta = config.kinds[kind];
                  const Icon = meta.icon;
                  return (
                    <DropdownMenuItem
                      key={kind}
                      onSelect={() => addNode(kind)}
                      data-testid={`${config.testPrefix}-add-${kind}`}
                      className="gap-2 text-[12.5px]"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: meta.accent }}
                      />
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {t(meta.label)}
                    </DropdownMenuItem>
                  );
                })}
                {config.templates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        data-testid={`${config.testPrefix}-templates`}
                        className="gap-2 text-[12.5px]"
                      >
                        <DraftingCompass
                          className="size-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {t(config.toolbar.templates)}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-60">
                        {config.templates.map((tpl) => (
                          <DropdownMenuItem
                            key={tpl.id}
                            onSelect={() => addTemplate(tpl.id)}
                            data-testid={`${config.testPrefix}-template-${tpl.id}`}
                            className="flex-col items-start gap-0.5 py-2"
                          >
                            <span className="text-[12.5px] font-medium">
                              {t(tpl.label)}
                            </span>
                            <span className="text-[11px] leading-snug text-muted-foreground">
                              {t(tpl.hint)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* THE SUMMARY HAND — the bench's honest numbers, one tap */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-pressed={summaryOpenPanel}
              aria-label={t(config.toolbar.summary)}
              title={t(config.toolbar.summary)}
              data-testid={`${config.testPrefix}-summary-toggle`}
              className={`${TOOL_HAND} px-3 text-[12.5px]`}
            >
              <LayoutList
                className="size-4"
                aria-hidden="true"
                style={{
                  color: summaryOpenPanel
                    ? "var(--scope-a,var(--gd))"
                    : undefined,
                }}
              />
              <span className="hidden sm:inline">{nodes.length}</span>
            </Button>

            {/* THE SMALL MAP — desktop's own compass (eco and phones rest) */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMiniMapOn((v) => !v)}
              aria-pressed={miniMapVisible}
              aria-label={t(config.toolbar.map)}
              title={t(config.toolbar.map)}
              className={`${TOOL_HAND} hidden size-11 p-0 sm:flex`}
            >
              <MapIcon
                className="size-4"
                aria-hidden="true"
                style={{
                  color: miniMapVisible ? "var(--scope-a,var(--gd))" : undefined,
                }}
              />
            </Button>

            {/* THE EXPORT HAND */}
            <Button
              type="button"
              variant="ghost"
              onClick={exportJson}
              aria-label={t("Export the plan as JSON")}
              title={t("Export the plan as JSON")}
              data-testid={`${config.testPrefix}-export`}
              className={`${TOOL_HAND} px-3 text-[12.5px]`}
            >
              <Download className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t(config.toolbar.export)}</span>
            </Button>

            <span className="flex-1" aria-hidden="true" />

            {/* THE LAMP — the draft's own standing, one honest line */}
            <span
              data-testid={`${config.testPrefix}-save-state`}
              className="mono-label hidden px-1.5 text-[8.5px] uppercase tracking-[0.16em] text-white/45 min-[420px]:block"
            >
              {t(config.toolbar.draftLamp)}
            </span>

            {/* THE CLEAR HAND — two taps, no accidents */}
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              aria-label={
                clearArmed ? t(config.toolbar.clearArmed) : t(config.toolbar.clear)
              }
              title={
                clearArmed ? t(config.toolbar.clearArmed) : t(config.toolbar.clear)
              }
              data-testid={`${config.testPrefix}-clear`}
              className={`h-11 rounded-xl border px-3 text-[12.5px] ${
                clearArmed
                  ? "border-rose-400/40 bg-rose-400/15 text-rose-300 hover:bg-rose-400/25"
                  : "border-white/12 bg-white/8 text-white/85 hover:bg-white/14"
              }`}
            >
              <Eraser className="size-4" aria-hidden="true" />
              {clearArmed ? t("Erase?") : ""}
            </Button>
          </div>
        </div>
      </LabHandsContext.Provider>
    </LabConfigContext.Provider>
  );
}

/** THE THEMED LAB — the canvas fills its container's height
    (the room's flex layout owns the height; no viewport hacks). */
export default function ThemedLabCanvas(props: ThemedLabProps) {
  return (
    <ReactFlowProvider>
      <LabBench {...props} />
    </ReactFlowProvider>
  );
}
