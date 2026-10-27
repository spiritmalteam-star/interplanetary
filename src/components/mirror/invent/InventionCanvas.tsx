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
import { Download, DraftingCompass, Eraser, Map as MapIcon, Plus } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n";
import { usePerfMode } from "@/lib/perf-mode";
import { InventionPiece, KindDot, LabContext, type LabHands } from "./InventionNode";
import {
  DEFAULT_NAMES,
  INVENTION_KINDS,
  KIND_META,
  MAX_EDGES,
  MAX_NODES,
  clearLabDraft,
  loadLabDraft,
  saveLabDraft,
  type InventionNode,
  type InventionNodeKind,
  type LabDraft,
} from "./lab-types";

/* ------------------------------------------------------------------ */
/*  THE INVENTION LAB — the Invent room's own canvas. An obsidian      */
/*  bench where a plan is laid out in pieces: ideas, components,       */
/*  evidence and risks, joined by the bonds that support them.         */
/*                                                                     */
/*  THE HONEST KEEP — there is no server shelf for forge artifacts     */
/*  (the forge's doors are stateless), so the bench rests on the       */
/*  visitor's own device: an autosaved draft under                     */
/*  `mirror-invent-canvas-v1`, restored with a quiet word on return.   */
/*  The room's memory law holds: device-local, never a server's.       */
/* ------------------------------------------------------------------ */

/* the restore word is spoken once per visit — not on every quiet
   remount of the mode toggle */
let draftToastShownThisVisit = false;

/* THE LAB'S OWN SCOPED SHEET — React Flow's internals wear the
   house's dialect here: glass controls at 44px, chalk handles,
   scope-tinted bonds, stillness under prefers-reduced-motion. */
const LAB_SHEET = `
.invention-lab { --lab-chalk: #f2eee4; }
html.dark .invention-lab { --lab-chalk: var(--foreground); }
.invention-lab .react-flow__handle {
  width: 9px; height: 9px; border: none; border-radius: 9999px;
  background-color: color-mix(in srgb, var(--lab-chalk) 38%, transparent);
  opacity: 0.45;
  transition: opacity 200ms ease, background-color 200ms ease;
}
.invention-lab .react-flow__node:hover .react-flow__handle,
.invention-lab .react-flow__node.selected .react-flow__handle {
  opacity: 1;
  background-color: color-mix(in srgb, var(--lab-chalk) 72%, transparent);
}
.invention-lab .react-flow__edge-path {
  stroke: color-mix(in srgb, var(--lab-chalk) 32%, transparent);
  stroke-width: 1.5;
}
.invention-lab .react-flow__edge:hover .react-flow__edge-path,
.invention-lab .react-flow__edge.selected .react-flow__edge-path {
  stroke: color-mix(in srgb, var(--scope-a, var(--gd)) 78%, transparent);
}
.invention-lab .react-flow__connection-path {
  stroke: color-mix(in srgb, var(--scope-a, var(--gd)) 72%, transparent);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
}
.invention-lab .react-flow__controls {
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px -18px rgba(0, 0, 0, 0.9);
}
.invention-lab .react-flow__controls-button {
  width: 44px; height: 44px; padding: 0;
  background: rgba(13, 15, 19, 0.78);
  border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  transition: background-color 200ms ease, color 200ms ease;
}
.invention-lab .react-flow__controls-button:last-child { border-bottom: none; }
.invention-lab .react-flow__controls-button:hover {
  background: rgba(255, 255, 255, 0.12); color: #fff;
}
.invention-lab .react-flow__controls-button svg {
  max-width: 15px; max-height: 15px; fill: currentColor;
}
.invention-lab .react-flow__minimap {
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.invention-lab .react-flow__attribution { background: transparent; }
.invention-lab .react-flow__attribution a { color: rgba(255, 255, 255, 0.3); }
@media (prefers-reduced-motion: reduce) {
  .invention-lab .react-flow__handle,
  .invention-lab .react-flow__edge-path,
  .invention-lab .react-flow__controls-button { transition: none !important; }
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

const NODE_TYPES = { invention: InventionPiece };

function LabBench() {
  const t = useT();
  const rf = useReactFlow();
  const eco = usePerfMode((s) => s.tier === "eco");

  /* THE FIRST BREATH — the draft is read once, lazily, before the
     first render settles, so the bench wakes with its pieces already
     standing and React Flow's own fitView finds them where they were
     left. useState's own lazy door — read once, never re-read. */
  const [boot] = useState<{ draft: LabDraft | null; miniMap: boolean }>(() => {
    const draft = loadLabDraft();
    return {
      draft,
      miniMap:
        draft?.miniMap ??
        (typeof window !== "undefined" && window.innerWidth >= 640),
    };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<InventionNode>(
    boot.draft?.nodes ?? []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    boot.draft?.edges ?? []
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [miniMapOn, setMiniMapOn] = useState(boot.miniMap);
  const [clearArmed, setClearArmed] = useState(false);

  const benchRef = useRef<HTMLDivElement | null>(null);
  const armTimerRef = useRef<number | null>(null);

  /* THE RESTORED DRAFT — one honest word when the bench wakes with
     work on it (spoken once per visit, never on every remount) */
  useEffect(() => {
    const draft = boot.draft;
    if (draft && draft.nodes.length > 0 && !draftToastShownThisVisit) {
      draftToastShownThisVisit = true;
      toast(t("Draft restored"), {
        description: t(
          "The Invention Lab kept your bench on this device — nothing travels to a server."
        ),
      });
    }
  }, [boot.draft, t]);

  /* THE AUTOSAVE — every settled change rests on the device a breath
     later (debounced). The lamp on the toolbar keeps one standing
     honest line: the draft lives on this device, never on a server. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      saveLabDraft(nodes, edges, miniMapOn);
    }, 700);
    return () => window.clearTimeout(id);
  }, [nodes, edges, miniMapOn]);

  /* the arm of the clear hand lays itself down when the room leaves */
  useEffect(() => {
    return () => {
      if (armTimerRef.current) window.clearTimeout(armTimerRef.current);
    };
  }, []);

  const openEditor = useCallback((id: string | null) => {
    setEditingId(id);
  }, []);

  const updateData = useCallback(
    (id: string, patch: Partial<InventionNode["data"]>) => {
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

  const hands: LabHands = useMemo(
    () => ({ editingId, openEditor, updateData, removeNode }),
    [editingId, openEditor, updateData, removeNode]
  );

  /* THE ADD HAND — a new piece lands near the bench's heart, a breath
     to the side each time so pieces never stack, and its editor opens
     at once: the kind is chosen, the words come next. */
  const addNode = useCallback(
    (kind: InventionNodeKind) => {
      if (nodes.length >= MAX_NODES) {
        toast.error(t("The bench is full — it holds {max} pieces at most.", { max: MAX_NODES }));
        return;
      }
      const id = `lab-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
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
      const node: InventionNode = {
        id,
        type: "invention",
        position,
        data: { kind, name: DEFAULT_NAMES[kind], note: "" },
      };
      setNodes((nds) => [...nds, node]);
      setEditingId(id);
    },
    [nodes, rf, setNodes, t]
  );

  /* THE BOND HAND — a connection is a claim: this supports that.
     Self-bonds and second copies of the same claim are refused. */
  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      if (edges.some((e) => e.source === c.source && e.target === c.target))
        return;
      if (edges.length >= MAX_EDGES) {
        toast.error(t("The bench holds {max} bonds at most.", { max: MAX_EDGES }));
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
    [edges, setEdges, t]
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
    setNodes([]);
    setEdges([]);
    clearLabDraft();
    toast.success(t("The bench is cleared — a fresh spark waits."));
  }, [clearArmed, setEdges, setNodes, t]);

  /* THE EXPORT HAND — the plan leaves as a plain JSON file */
  const exportJson = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      pieceCount: nodes.length,
      bondCount: edges.length,
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.data.kind,
        name: n.data.name,
        note: n.data.note,
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
    a.download = "invention-lab.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t("The lab's plan is yours — the JSON file is downloaded."));
  }, [nodes, edges, t]);

  const miniMapVisible = miniMapOn && !eco;

  const miniMapColor = useCallback(
    (n: InventionNode) => KIND_META[n.data.kind]?.accent ?? "#9aa0a6",
    []
  );

  return (
    <LabContext.Provider value={hands}>
      <style>{LAB_SHEET}</style>
      <div
        ref={benchRef}
        data-testid="invention-canvas"
        className="invention-lab absolute inset-0 overflow-hidden"
        style={BENCH_STYLE}
      >
        <ReactFlow<InventionNode>
          nodes={nodes}
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
              ariaLabel={t("The bench's small map")}
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
              {t("The bench is empty")}
            </p>
            <p className="max-w-[300px] text-[12px] leading-relaxed text-white/55">
              {t(
                "Add a spark — an idea, a component, a proof, a risk — and connect what supports what."
              )}
            </p>
          </div>
        )}

        {/* THE FLOATING HANDS — glass toolbar on the bench's top edge;
            every hand 44px tall, wrapping (never overflowing) at 390px */}
        <div
          role="toolbar"
          aria-label={t("Invention Lab tools")}
          data-testid="invention-toolbar"
          className="absolute left-2 right-2 top-2 z-10 flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/12 bg-[rgba(13,15,19,0.72)] p-1 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:left-3 sm:right-3 sm:top-3"
        >
          {/* THE ADD HAND — one door, four kinds */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                className={`${TOOL_HAND} px-3 text-[12.5px]`}
                data-testid="invention-add"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("Add piece")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {INVENTION_KINDS.map((kind) => {
                const Icon = KIND_META[kind].icon;
                return (
                  <DropdownMenuItem
                    key={kind}
                    onSelect={() => addNode(kind)}
                    data-testid={`invention-add-${kind}`}
                    className="gap-2 text-[12.5px]"
                  >
                    <KindDot kind={kind} />
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {t(KIND_META[kind].label)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* THE SMALL MAP — desktop's own compass (eco and phones rest) */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMiniMapOn((v) => !v)}
            aria-pressed={miniMapVisible}
            aria-label={t("The bench's small map")}
            title={t("The bench's small map")}
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
            data-testid="invention-export"
            className={`${TOOL_HAND} px-3 text-[12.5px]`}
          >
            <Download className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("Export")}</span>
          </Button>

          <span className="flex-1" aria-hidden="true" />

          {/* THE LAMP — the draft's own standing, one honest line */}
          <span
            data-testid="invention-save-state"
            className="mono-label hidden px-1.5 text-[8.5px] uppercase tracking-[0.16em] text-white/45 min-[420px]:block"
          >
            {t("Draft · this device")}
          </span>

          {/* THE CLEAR HAND — two taps, no accidents */}
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            aria-label={
              clearArmed
                ? t("Tap again to erase the whole bench")
                : t("Clear the bench")
            }
            title={
              clearArmed
                ? t("Tap again to erase the whole bench")
                : t("Clear the bench")
            }
            data-testid="invention-clear"
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
    </LabContext.Provider>
  );
}

/** THE INVENTION LAB — the canvas fills its container's height
    (the room's flex layout owns the height; no viewport hacks). */
export default function InventionCanvas() {
  return (
    <ReactFlowProvider>
      <LabBench />
    </ReactFlowProvider>
  );
}
