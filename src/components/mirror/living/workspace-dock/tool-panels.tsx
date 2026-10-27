"use client";

/* ------------------------------------------------------------------ */
/*  THE DOCK'S OWN PANEL SHELF — how a registry room comes to live     */
/*  inside a dock panel. dockview (vanilla v8) hands every panel a     */
/*  plain DOM element; this file is the React bridge: one renderer     */
/*  class mounts a React root into that element and shows THE SAME     */
/*  lazy tool view the registry's loader resolves — the identical      */
/*  component the single-panel workspace mounts, boundary and all.     */
/*                                                                     */
/*  THE RESOLUTION LAW — React component identity must be stable per   */
/*  toolId, so a tool opened twice (two panels, or opened again after  */
/*  a close) always receives the SAME component from a module-level    */
/*  Map. The loader itself is the lazy door: a room's code only        */
/*  travels when its panel first stands.                               */
/* ------------------------------------------------------------------ */

import { useEffect, useState, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import type {
  GroupPanelPartInitParameters,
  IContentRenderer,
  IWatermarkRenderer,
  PanelUpdateEvent,
} from "dockview-core";
import { WORKSPACES } from "@/lib/mirror/workspaces";
import type { ToolTabKey } from "@/lib/mirror-store";
import { PageScaffold, WorkspaceBoundary } from "../ToolWorkspace";

/* THE RESOLVED SHELF — module-level, so every renderer instance and
   every remount shares one stable component per room. */
const RESOLVED_TOOL_VIEWS = new Map<ToolTabKey, ComponentType>();

/* Resolve a room's view through the registry's lazy loader, memoizing
   the component identity on the shelf. While the chunk travels, the
   room's quiet scaffold stands (the same one the single panel uses).
   The shelf is read during render (a stable identity per toolId); the
   effect only carries the lazy fetch itself — every setState happens
   in the loader's callbacks, never synchronously in the effect. */
function useResolvedToolView(toolId: ToolTabKey): {
  Comp: ComponentType | null;
  failed: boolean;
} {
  const [Comp, setComp] = useState<ComponentType | null>(
    () => RESOLVED_TOOL_VIEWS.get(toolId) ?? null
  );
  const [failed, setFailed] = useState(false);

  /* a changed toolId (a panel handed a different room) starts fresh —
     adjusted during render, the React way to reset state when a
     watched value changes */
  const [prevToolId, setPrevToolId] = useState(toolId);
  if (prevToolId !== toolId) {
    setPrevToolId(toolId);
    setComp(RESOLVED_TOOL_VIEWS.get(toolId) ?? null);
    setFailed(false);
  }

  useEffect(() => {
    if (Comp || failed) return;
    let alive = true;
    WORKSPACES[toolId]
      .loader()
      .then((m) => {
        const resolved = m.default;
        RESOLVED_TOOL_VIEWS.set(toolId, resolved);
        if (alive) setComp(resolved);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [toolId, Comp, failed]);

  return { Comp, failed };
}

/* ONE ROOM, ONE PANEL — the same structure the single-panel workspace
   gives a page: an absolute-inset-0 frame, the page boundary around
   the view (a stumble lays the room down with honor, never the dock).
   Each panel wears its room's own standing light, so a purple music
   panel can live beside a yellow book panel in one dock. */
export function ToolPanelSurface({ toolId }: { toolId: ToolTabKey }) {
  const { Comp, failed } = useResolvedToolView(toolId);
  const meta = WORKSPACES[toolId];
  return (
    <div
      className="relative h-full w-full"
      style={
        meta?.theme?.accent
          ? ({ "--scope-a": meta.theme.accent } as React.CSSProperties)
          : undefined
      }
    >
      <div key={toolId} className="absolute inset-0">
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <p className="text-[12px] text-muted-foreground/70">
              This room could not arrive — its code failed to travel.
            </p>
          </div>
        ) : Comp ? (
          <WorkspaceBoundary label={meta.title}>
            <Comp />
          </WorkspaceBoundary>
        ) : (
          <PageScaffold />
        )}
      </div>
    </div>
  );
}

/* THE REACT BRIDGE — dockview's IContentRenderer contract, wearing a
   React root. One instance per panel; `init` carries the panel's
   params ({ toolId }), `dispose` lays the root down. */
export class ToolPanelRenderer implements IContentRenderer {
  readonly element: HTMLElement;
  private root: Root | null = null;
  private toolId: ToolTabKey | null = null;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "mirror-dock-tool-part";
    this.element.style.width = "100%";
    this.element.style.height = "100%";
  }

  init(parameters: GroupPanelPartInitParameters): void {
    const toolId = parameters.params?.toolId;
    if (typeof toolId !== "string" || !(toolId in WORKSPACES)) return;
    this.toolId = toolId as ToolTabKey;
    this.render();
  }

  /* params only move through api-level updates; a changed toolId is
     the one change that matters to this surface */
  update(event: PanelUpdateEvent): void {
    const toolId = event.params?.toolId;
    if (
      typeof toolId === "string" &&
      toolId in WORKSPACES &&
      toolId !== this.toolId
    ) {
      this.toolId = toolId as ToolTabKey;
      this.render();
    }
  }

  private render(): void {
    if (!this.toolId) return;
    if (!this.root) this.root = createRoot(this.element);
    const toolId = this.toolId;
    this.root.render(<ToolPanelSurface toolId={toolId} />);
  }

  dispose(): void {
    this.root?.unmount();
    this.root = null;
    this.toolId = null;
  }
}

/* THE EMPTY DOCK — when every room has been closed, the dock shows an
   honest watermark instead of an empty grid (static markup; the
   renderer lives outside the React tree). */
export class DockWatermarkRenderer implements IWatermarkRenderer {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "mirror-dock-watermark";
    this.element.setAttribute("aria-hidden", "true");
    this.element.innerHTML =
      '<div class="mirror-dock-watermark-inner">' +
      '<span class="mirror-dock-watermark-title">No rooms open</span>' +
      '<span class="mirror-dock-watermark-hint">Add a room from the toolbar above</span>' +
      "</div>";
  }

  init(): void {
    /* the watermark carries no state */
  }
}
