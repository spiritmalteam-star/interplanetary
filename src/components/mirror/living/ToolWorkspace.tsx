"use client";

import {
  Component,
  Fragment,
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { ArrowLeft, Columns, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";
import { WORKSPACES, WORKSPACE_ORDER } from "@/lib/mirror/workspaces";
import { runWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE LAZY PAGES — every room rides its own chunk through the        */
/*  registry's loader (their code only arrives when first shown, never */
/*  in the frame's opening bundle). While a chunk travels, the page's  */
/*  own quiet scaffold stands in the frame — no blank air, no jumps.   */
/* ------------------------------------------------------------------ */

/* the loading scaffold — still, honest, scope-tinted: the shape of a
   room about to stand (no spinner loop, no shimmer — the house's calm
   laws hold even while a chunk travels). Exported so the advanced
   desktop's dock panels wear the same quiet scaffold. */
export function PageScaffold() {
  return (
    <div className="absolute inset-0 flex flex-col gap-3 p-4" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
            boxShadow:
              "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--gd)) 22%, transparent)",
          }}
        />
        <div
          className="h-3 w-28 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 9%, transparent)",
          }}
        />
      </div>
      <div className="mt-1 flex flex-col gap-2.5">
        <div
          className="h-3 w-3/4 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--foreground) 6%, transparent)",
          }}
        />
        <div
          className="h-3 w-2/3 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--foreground) 5%, transparent)",
          }}
        />
        <div
          className="h-3 w-1/2 rounded-full"
          style={{
            background:
              "color-mix(in srgb, var(--foreground) 4%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

const PAGE_VIEWS = WORKSPACE_ORDER.reduce(
  (acc, id) => {
    acc[id] = dynamic(WORKSPACES[id].loader, {
      ssr: false,
      loading: () => <PageScaffold />,
    });
    return acc;
  },
  {} as Record<ToolTabKey, ComponentType>
);

/* THE ADVANCED DESKTOP — the dock is its own lazy chunk: while the
   dock is off, zero dockview code rides in the tree (the chunk only
   travels when the visitor first turns the dock on). */
const WorkspaceDock = dynamic(
  () => import("./workspace-dock/WorkspaceDock"),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="mono-label text-[10px] text-muted-foreground/50">
          The dock wakes…
        </span>
      </div>
    ),
  }
);

/* ------------------------------------------------------------------ */
/*  THE PAGE BOUNDARY — a room that stumbles lays itself down with     */
/*  honor: an honest word, a retry hand, the frame never broken. A     */
/*  provider failure is the page's own weather, never the book's       */
/*  collapse (the chat beneath keeps standing). Exported so the        */
/*  advanced desktop's dock panels live under the same honor.          */
/* ------------------------------------------------------------------ */

export class WorkspaceBoundary extends Component<
  { children: ReactNode; label: string },
  { failed: boolean; nonce: number }
> {
  state = { failed: false, nonce: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  /* THE RETRY HAND — the boundary lays its verdict down and remounts
     the page fresh (a new nonce lifts a new attempt of the room). */
  reset = () =>
    this.setState((s) => ({ failed: false, nonce: s.nonce + 1 }));
  render() {
    if (this.state.failed)
      return <BoundaryFallback label={this.props.label} onRetry={this.reset} />;
    return <Fragment key={this.state.nonce}>{this.props.children}</Fragment>;
  }
}

function BoundaryFallback({
  label,
  onRetry,
}: {
  label: string;
  onRetry: () => void;
}) {
  const t = useT();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-[14px] font-medium text-foreground/85">
        {t("This room stumbled — its own weather, not the book's.")}
      </p>
      <p className="text-[12px] text-muted-foreground/70">{label}</p>
      <button
        type="button"
        onClick={onRetry}
        data-testid="workspace-retry"
        className="focus-glow flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] text-foreground transition-colors duration-300 hover:bg-foreground/5"
        style={{
          borderColor:
            "color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
          color: "var(--scope-a,var(--gd))",
        }}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t("Try again")}
      </button>
    </div>
  );
}

/* one row per page — read from the registry (the tab bar and the
   history panel's maker trail wear the same marks from the same shelf) */
export const TAB_META: Record<
  ToolTabKey,
  { icon: (typeof WORKSPACES)[ToolTabKey]["icon"]; label: string }
> = WORKSPACE_ORDER.reduce(
  (acc, id) => {
    acc[id] = { icon: WORKSPACES[id].icon, label: WORKSPACES[id].title };
    return acc;
  },
  {} as Record<
    ToolTabKey,
    { icon: (typeof WORKSPACES)[ToolTabKey]["icon"]; label: string }
  >
);

/* ------------------------------------------------------------------ */
/*  THE WORKSPACE — the pages open as tabs over the one chat: one      */
/*  window carries every open room, one tab active at a time. The      */
/*  window is ALWAYS the chat's own exact frame (absolute inset-0 of   */
/*  the realm — the lens clips its corners), in both of the chat's     */
/*  gears; it stands BELOW the crown's hands and every modal, and      */
/*  only over the chat — when a full-screen room owns the frame (a     */
/*  tab was expanded), the window rests and the tab stays parked       */
/*  until the room's own back hand returns.                            */
/*                                                                     */
/*  THE LIFECYCLE LAW — when the active page turns (or the window      */
/*  closes), the leaving page's registered hands are run: audio        */
/*  paused, timers cleared, synthesizers suspended. Only the open      */
/*  page owns the device's breath.                                     */
/* ------------------------------------------------------------------ */
function ToolWorkspaceImpl({ bare = false }: { bare?: boolean }) {
  const view = useMirror((s) => s.view);
  const toolTabs = useMirror((s) => s.toolTabs);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const closeToolTab = useMirror((s) => s.closeToolTab);
  /* THE ROOM'S OWN ZOOM — every room may grow to fill the whole sky
     while staying exactly where it is: the same room, the same state,
     the same work, only bigger. Nothing moves elsewhere; the portal
     simply lifts the frame above every transform. */
  const [zoomed, setZoomed] = useState(false);
  /* THE ADVANCED DESKTOP — an opt-in docking mode for wide frames
     (≥1024px): the same rooms, several at once, dragged into place.     
     A viewport that narrows below the law lays the dock down gently —
     the single-panel view returns with the last active room. */
  const [dockOn, setDockOn] = useState(false);
  useEffect(() => {
    if (!dockOn) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (!mql.matches) setDockOn(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [dockOn]);

  /* a tab turn lays the zoom down — adjusted during render (the React
     way to reset state when a watched value changes), never in an
     effect, so the room that opens always opens at its own size */
  const [prevTab, setPrevTab] = useState<string | null>(activeToolTab);
  if (prevTab !== activeToolTab) {
    setPrevTab(activeToolTab);
    if (zoomed) setZoomed(false);
  }
  const t = useT();

  /* Esc lays the zoom down; the page's own scroll rests while it stands */
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomed]);

  /* THE STANDING LAW — the window lives only over the chat: the realm
     IS the landing chat now, in both of its gears (docked and
     fullscreen), so the window simply rises over the chat wherever it
     stands — every room plays WITHIN the chat's own frame, exactly
     like the profile does; no hand may yank the view to a page.
     "transmission" IS the realm — the realm renders it as its own room
     (AppShell has no early-return for it; it is only the view the
     channel's asks carry), so the window keeps standing there.
     THE ONE WINDOW — the same law in both gears: the never-yank store
     law keeps the view on the chat when a tab opens, so the window is
     always the chat's own overlay. */
  const active =
    activeToolTab &&
    (view === "observatory" ||
      view === "transmission" ||
      (bare && toolTabs.length > 0))
      ? activeToolTab
      : null;

  /* THE LIFECYCLE — the leaving page lays its hands down. A ref carries
     the last standing page so the turn (and the window's own unmount)
     both run its cleanups exactly once. */
  const prevActiveRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev && prev !== active) runWorkspaceCleanup(prev);
    prevActiveRef.current = active;
    return () => {
      if (prevActiveRef.current) runWorkspaceCleanup(prevActiveRef.current);
    };
  }, [active]);

  /* the guard itself — no tab standing (or a full-screen room owning
     the frame): the window does not exist; hooks have all run above */
  if (!active) return null;

  /* THE CHAT'S OWN FRAME — the window is always the exact frame of
     the chat (absolute inset-0 of the realm): full size, no cap, no
     drag — it replaces the chat while it stands, and the last closed
     tab reveals the chat again. The parent lens clips the corners,
     so the window wears none of its own. The bare prop stays
     accepted but no longer gears anything — the realm is one chat in
     two gears, and the window is the chat's own in both. */
  const ActiveView = PAGE_VIEWS[active];
  const activeMeta = WORKSPACES[active];

  const winStyle: CSSProperties = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    borderColor:
      "color-mix(in srgb, var(--scope-a,var(--gd)) 25%, var(--hairline))",
    /* THE ROOM'S OWN LIGHT — each workspace wears its standing accent
       (music's purple liquid, the book's yellow, the manifesting dark
       pink, the forge's blue) through --scope-a on the frame; a room
       without its own accent inherits the chamber's chosen scope. */
    ...(activeMeta?.theme?.accent
      ? { "--scope-a": activeMeta.theme.accent }
      : {}),
  };
  const frame = (
    <div
      data-testid="tool-workspace"
      data-workplace="true"
      data-zoomed={zoomed || undefined}
      data-dock={dockOn ? "on" : undefined}
      data-resource-profile={
        dockOn ? "multi" : (activeMeta?.resourceProfile ?? undefined)
      }
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden border bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.6)]",
        zoomed
          ? "fixed inset-0 z-[95] rounded-none"
          : "absolute inset-0 z-30 rounded-none"
      )}
      style={winStyle}
    >
      {/* THE WORKPLACE HEADER — THE ONE BACK at the row's very left
          (the same place for every room, the same in both gears): one
          touch lays the standing room down and the chat stands again —
          the per-room back hands and top bars are gone from the house.
          Beside it, the row of open rooms as compact pills. The active
          room wears the house's light: var(--scope-a) is the scope the
          visitor chose (LandingGate sets it on the whole chamber), so
          every workplace tints itself with its own house. */}
      <div className="relative z-10 flex h-9 shrink-0 items-center gap-1 overflow-x-auto px-1">
        {/* THE ONE BACK HAND — the single return every tool and every
            room shares: leftmost, always the same place */}
        <button
          type="button"
          onClick={() => active && closeToolTab(active)}
          aria-label={t("Back to the chat")}
          title={t("Back to the chat")}
          data-testid="tool-workspace-back"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
        </button>
        {toolTabs.map((key) => {
          const meta = TAB_META[key];
          const Icon = meta.icon;
          const isActive = key === activeToolTab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => activateToolTab(key)}
              aria-pressed={isActive}
              title={t(meta.label)}
              data-testid={`tool-tab-${key}`}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] transition-colors duration-300",
                isActive
                  ? "font-medium"
                  : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
              style={
                isActive
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
                      color: "var(--scope-a,var(--gd))",
                      borderColor:
                        "color-mix(in srgb, var(--scope-a,var(--gd)) 35%, transparent)",
                    }
                  : undefined
              }
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {t(meta.label)}
              {/* the tiny close affordance — a span, for a button may
                  never nest inside a button */}
              <span
                role="button"
                tabIndex={0}
                aria-label={`${t("Close")} ${t(meta.label)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeToolTab(key);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    closeToolTab(key);
                  }
                }}
                className="ml-0.5 flex size-4 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-3" aria-hidden="true" />
              </span>
            </button>
          );
        })}

        <span className="flex-1" aria-hidden="true" />

        {/* THE ADVANCED DESKTOP HAND — an opt-in for wide frames only
            (hidden below 1024px): one glass icon toggles the docking
            mode. The after-pseudo widens the touch target to the
            house's 44px law without swelling the header row. */}
        <button
          type="button"
          onClick={() => setDockOn((d) => !d)}
          aria-pressed={dockOn}
          aria-label={t("Advanced desktop")}
          title={t("Advanced desktop")}
          data-testid="tool-workspace-dock-toggle"
          className="focus-glow relative mr-1 hidden size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 after:absolute after:-inset-2 after:rounded-full after:content-[''] hover:bg-foreground/10 hover:text-foreground lg:inline-flex"
          style={
            dockOn
              ? {
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 12%, transparent)",
                  color: "var(--scope-a,var(--gd))",
                }
              : undefined
          }
        >
          <Columns className="size-3.5" aria-hidden="true" />
        </button>

        {/* THE ROOM'S OWN ZOOM — the same room, the same state, the
            same work: only bigger. One hand serves every tool; the
            room never moves elsewhere, it simply fills the sky. */}
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? t("Return the room to its place") : t("Enlarge the room")}
          aria-pressed={zoomed}
          title={zoomed ? t("Return the room to its place") : t("Enlarge the room")}
          data-testid="tool-workspace-zoom"
          className="focus-glow mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          {zoomed ? (
            <Minimize2 className="size-3.5" aria-hidden="true" />
          ) : (
            <Maximize2 className="size-3.5" aria-hidden="true" />
          )}
        </button>

        {/* THE ONE FRAME — the old expand hand (the room's full-page
            depth) is gone: every room plays within the chat's own
            frame, exactly like the profile does. The chat's corner
            hand gears the SIZE of the whole frame — the room rides
            inside it, bigger or smaller, never elsewhere. The old
            right-corner close hand has rested too: THE ONE BACK at the
            row's left is the single return of the whole house. */}
      </div>

      {/* THE WORKPLACE IDENTITY STRIP — one slim line of the house's
          light under the rooms (the plain hairline it replaces never
          carried the scope): the tint flows from the doors and fades
          across the frame, so the window reads as a workplace of this
          scope, not a floating sheet. */}
      <div
        aria-hidden="true"
        className="h-px shrink-0"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--scope-a,var(--gd)) 45%, transparent), color-mix(in srgb, var(--scope-a,var(--gd)) 18%, transparent) 42%, transparent 100%)",
        }}
      />

      {/* THE BODY — two laws, one frame. The DEFAULT stays as the house
          built it: the active page fills the window inside its own
          boundary (a stumble lays the page down with honor, never the
          book); the keyed mount gives every tab its own clean scroll.
          When the ADVANCED DESKTOP is on (desktop widths only), the
          dock fills the same body instead — the same rooms, several at
          once — and the dock's own toolbar stands above it. Turning
          the dock off unmounts it fully; the single view returns with
          the room whose panel was last active. */}
      <div className="relative min-h-0 flex-1">
        {dockOn ? (
          <div key="dock" className="absolute inset-0">
            <WorkspaceDock />
          </div>
        ) : ActiveView && active ? (
          <div key={active} className="absolute inset-0">
            <WorkspaceBoundary label={t(activeMeta.title)}>
              <ActiveView />
            </WorkspaceBoundary>
          </div>
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[90px]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--scope-a,var(--gd)) 5%, transparent), transparent)",
          }}
        />
      </div>
    </div>
  );

  /* when the room is zoomed, the frame is lifted to the sky itself —
     above every transform of the page, still the very same room */
  if (zoomed && typeof document !== "undefined") {
    return createPortal(frame, document.body);
  }
  return frame;
}

export const ToolWorkspace = memo(ToolWorkspaceImpl);
