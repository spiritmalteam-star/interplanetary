"use client";

/* ------------------------------------------------------------------ */
/*  THE ADVANCED DESKTOP — an opt-in docking mode for the workspace.   */
/*  The DEFAULT experience stays exactly as the house built it: one    */
/*  active room in a single frame. When the visitor turns the dock     */
/*  on (≥1024px only), dockview takes the workspace body: rooms open   */
/*  as panels that can be dragged to split, floated, and closed —     */
/*  capped at three, because three rooms at once is the house's limit. */
/*                                                                     */
/*  THE VANILLA BRIDGE — the installed dockview is v8 (headless:       */
/*  createDockview + DockviewApi, no React wrapper). This component    */
/*  owns the React side: it creates the dock in a host div, wires its  */
/*  events to the mirror store both ways, and hands every panel a      */
/*  ToolPanelRenderer (see tool-panels.tsx) that mounts the SAME lazy  */
/*  registry view a normal tab would.                                  */
/*                                                                     */
/*  THE STORE STAYS THE TRUTH — toolTabs (the header pills) and        */
/*  activeToolTab keep leading: a pill click focuses or re-opens a     */
/*  panel; closing a panel closes its pill; the dock's active panel    */
/*  turns the store's active tab. Turning the dock off unmounts it     */
/*  FULLY — the single-panel view returns showing the tool whose       */
/*  panel was last active.                                             */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useRef } from "react";
import { createDockview, type DockviewApi } from "dockview";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";
import { WORKSPACES, WORKSPACE_ORDER } from "@/lib/mirror/workspaces";
import { useT } from "@/lib/i18n";
import { DockWatermarkRenderer, ToolPanelRenderer } from "./tool-panels";
import {
  clearDockLayout,
  createLayoutSaver,
  loadDockLayout,
  MAX_DOCK_PANELS,
} from "./dock-layout";
import "./dock-theme.css";

/* THE PANEL ID LAW — one room, one panel, one predictable id (the
   scheme the saved layouts are written and validated against). */
function panelIdFor(toolId: ToolTabKey): string {
  return `tool-${toolId}`;
}

function WorkspaceDockImpl() {
  const t = useT();
  const toolTabs = useMirror((s) => s.toolTabs);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const openToolTab = useMirror((s) => s.openToolTab);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<DockviewApi | null>(null);
  /* the insertion order of live panel ids — the cap lays the OLDEST
     room down first when a fourth arrives */
  const orderRef = useRef<string[]>([]);
  /* the dock is being unmounted: events stop driving the store */
  const teardownRef = useRef(false);
  /* a reset is in flight: panel removals must not close header pills */
  const resetMuteRef = useRef(false);
  const saverRef = useRef<ReturnType<typeof createLayoutSaver> | null>(null);

  /* ---------------------------------------------------------------- */
  /*  THE CAP LAW — three rooms at once is the house's limit. A fourth */
  /*  is refused honestly: the oldest open room lays itself down and   */
  /*  the house says so with a toast.                                  */
  /* ---------------------------------------------------------------- */
  const enforceCap = useCallback(
    (api: DockviewApi) => {
      const alive = orderRef.current.filter((id) =>
        api.panels.some((p) => p.id === id)
      );
      orderRef.current = alive;
      if (alive.length <= MAX_DOCK_PANELS) return;
      const doomed = alive.slice(0, alive.length - MAX_DOCK_PANELS);
      window.setTimeout(() => {
        for (const id of doomed) {
          const panel = api.panels.find((p) => p.id === id);
          if (panel) api.removePanel(panel);
        }
      }, 0);
      toast(t("Three rooms at once is the house's limit"));
    },
    [t]
  );

  /* open a room's panel if it isn't standing yet (id-guarded) */
  const addToolPanel = useCallback(
    (api: DockviewApi, toolId: ToolTabKey) => {
      const existing = api.panels.find((p) => p.id === panelIdFor(toolId));
      if (existing) return existing;
      return api.addPanel({
        id: panelIdFor(toolId),
        component: "tool",
        params: { toolId },
        title: t(WORKSPACES[toolId].title),
      });
    },
    [t]
  );

  /* THE FIRST LAYOUT — the active room alone, plus the previously
     active room beside it when another tab stands open. */
  const buildInitialLayout = useCallback(
    (api: DockviewApi) => {
      const state = useMirror.getState();
      const primary =
        state.activeToolTab ??
        state.toolTabs[0] ??
        WORKSPACE_ORDER[0];
      if (!primary) return;
      const first = addToolPanel(api, primary);
      const previous = state.toolTabs.find((k) => k !== primary);
      if (previous) {
        api.addPanel({
          id: panelIdFor(previous),
          component: "tool",
          params: { toolId: previous },
          title: t(WORKSPACES[previous].title),
          position: { direction: "right", referencePanel: first },
        });
      }
    },
    [addToolPanel, t]
  );

  /* ---------------------------------------------------------------- */
  /*  THE DOCK'S LIFE — created once per dock-mode stand.             */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    teardownRef.current = false;
    orderRef.current = [];
    const saver = createLayoutSaver(500);
    saverRef.current = saver;

    const api = createDockview(host, {
      className: "mirror-dock-theme",
      noPanelsOverlay: "watermark",
      createComponent: () => new ToolPanelRenderer(),
      createWatermarkComponent: () => new DockWatermarkRenderer(),
    });
    apiRef.current = api;

    const disposables = [
      api.onDidAddPanel((panel) => {
        if (!orderRef.current.includes(panel.id)) {
          orderRef.current.push(panel.id);
        }
        if (!teardownRef.current) enforceCap(api);
      }),
      api.onDidRemovePanel((panel) => {
        orderRef.current = orderRef.current.filter((id) => id !== panel.id);
        if (teardownRef.current || resetMuteRef.current) return;
        const toolId = panel.params?.toolId as ToolTabKey | undefined;
        if (toolId && useMirror.getState().toolTabs.includes(toolId)) {
          /* the room's pill lays down with its panel (registry law:
             closing unmounts the tool — same as switching tabs today) */
          useMirror.getState().closeToolTab(toolId);
        }
      }),
      api.onDidActivePanelChange((event) => {
        if (teardownRef.current) return;
        const toolId = event.panel?.params?.toolId as ToolTabKey | undefined;
        if (toolId && toolId !== useMirror.getState().activeToolTab) {
          /* the dock's focus turns the store's tab — the workspace's
             own lifecycle runs the leaving room's cleanups */
          useMirror.getState().activateToolTab(toolId);
        }
      }),
      api.onDidLayoutChange(() => {
        if (teardownRef.current) return;
        saver.schedule(api);
      }),
    ];

    /* THE STANDING LAYOUT — the saved arrangement returns; a layout
       that fails the house's validation is treated as never saved. */
    const restored = loadDockLayout();
    if (restored) {
      try {
        api.fromJSON(restored);
      } catch {
        /* a broken arrangement is forgotten, not mourned */
      }
    }
    if (api.panels.length === 0) {
      buildInitialLayout(api);
    }

    return () => {
      teardownRef.current = true;
      for (const d of disposables) d.dispose();
      /* the last arrangement survives the toggle-off */
      saver.flush(api);
      api.dispose();
      apiRef.current = null;
      saverRef.current = null;
    };
  }, [buildInitialLayout, enforceCap]);

  /* ---------------------------------------------------------------- */
  /*  THE STORE SPEAKS TO THE DOCK —                                  */
  /*  a header pill's click focuses (or re-opens) the room's panel;   */
  /*  a header pill's close lays the room's panel down.               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const api = apiRef.current;
    if (!api || teardownRef.current || !activeToolTab) return;
    const panel = api.panels.find(
      (p) => (p.params?.toolId as string | undefined) === activeToolTab
    );
    if (panel) {
      if (api.activePanel?.id !== panel.id) panel.api.setActive();
    } else {
      addToolPanel(api, activeToolTab);
    }
  }, [activeToolTab, addToolPanel]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || teardownRef.current) return;
    for (const panel of [...api.panels]) {
      const toolId = panel.params?.toolId as ToolTabKey | undefined;
      if (toolId && !toolTabs.includes(toolId)) {
        api.removePanel(panel);
      }
    }
  }, [toolTabs]);

  /* ---------------------------------------------------------------- */
  /*  THE VISITOR'S HANDS — add a room, reset the arrangement.        */
  /* ---------------------------------------------------------------- */
  const openRoom = useCallback(
    (toolId: ToolTabKey) => {
      /* the store law does the work: pill + active tab — the sync
         effects above focus or create the room's panel */
      openToolTab(toolId);
    },
    [openToolTab]
  );

  const resetLayout = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    clearDockLayout();
    /* rooms keep their pills; only the ARRANGEMENT is forgotten */
    resetMuteRef.current = true;
    try {
      for (const panel of [...api.panels]) api.removePanel(panel);
    } finally {
      resetMuteRef.current = false;
    }
    buildInitialLayout(api);
  }, [buildInitialLayout]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="workspace-dock"
    >
      {/* THE DOCK'S OWN THIN TOOLBAR — the add-room hand and the reset
          hand; the rest of the strip stays quiet. */}
      <div
        className="relative z-20 flex h-8 shrink-0 items-center gap-2 px-1.5"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        <span className="mono-label text-[10px] text-muted-foreground/55">
          {t("Advanced desktop")}
        </span>
        <span className="flex-1" aria-hidden="true" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="dock-add-panel"
              aria-label={t("Add room")}
              className="focus-glow relative flex h-6 items-center gap-1 rounded-full border px-2 text-[11.5px] text-foreground/80 transition-colors duration-300 after:absolute after:-inset-2 after:content-[''] hover:bg-foreground/5 hover:text-foreground"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, transparent)",
              }}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {t("Add room")}
              <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {WORKSPACE_ORDER.map((id) => {
              const meta = WORKSPACES[id];
              const Icon = meta.icon;
              const isOpen = toolTabs.includes(id);
              return (
                <DropdownMenuItem
                  key={id}
                  onSelect={() => openRoom(id)}
                  className="gap-2"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{t(meta.title)}</span>
                  {isOpen ? (
                    <span
                      className="ml-auto size-1.5 shrink-0 rounded-full"
                      aria-label={t("Open")}
                      style={{ background: "var(--scope-a,var(--gd))" }}
                    />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={resetLayout}
              data-testid="dock-reset-layout"
              className="gap-2"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("Reset layout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* THE DOCK HOST — the whole dockview tree lives inside this
          isolated stacking context (.mirror-dock, see dock-theme.css):
          floating groups and drag layers can never rise above the
          workspace header, and the room-zoom overlay (the zoomed frame
          at z-[95]) contains all of it when it stands. */}
      <div className="min-h-0 flex-1">
        <div
          ref={hostRef}
          data-testid="workspace-dock-host"
          className="mirror-dock h-full w-full"
        />
      </div>
    </div>
  );
}

export default WorkspaceDockImpl;
