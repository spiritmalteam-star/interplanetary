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
import { ArrowLeft, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";
import { WORKSPACES, WORKSPACE_ORDER } from "@/lib/mirror/workspaces";
import { runWorkspaceCleanup } from "@/lib/mirror/workspace-lifecycle";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ------------------------------------------------------------------ */
/*  THE LAZY PAGES — every room rides its own chunk through the        */
/*  registry's loader (their code only arrives when first shown, never */
/*  in the frame's opening bundle). While a chunk travels, the page's  */
/*  own quiet scaffold stands in the frame — no blank air, no jumps.   */
/* ------------------------------------------------------------------ */

/* the loading scaffold — still, honest, scope-tinted: the shape of a
   room about to stand (no spinner loop, no shimmer — the house's calm
   laws hold even while a chunk travels). */
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

/* ------------------------------------------------------------------ */
/*  THE PAGE BOUNDARY — a room that stumbles lays itself down with     */
/*  honor: an honest word, a retry hand, the frame never broken. A     */
/*  provider failure is the page's own weather, never the book's       */
/*  collapse (the chat beneath keeps standing).                        */
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

/* THE STANDING RAIL — the InDream shelf's own order (the makers the
   visitor named, the ArtX atelier standing where the Quantum and the
   HealX once stood — the two deep rooms rest at the scopes' shore
   now). These pills stand in the header always; the other rooms ride
   the rail only while they are open. THE SCOPES ARE NOT HERE — the
   fields' workplace is its own independent room (the crown's Scopes
   hand opens it directly), never a tab of InDream. */
const STANDING_RAIL: ToolTabKey[] = [
  "dreambook",
  "lightcodes",
  "akashic",
  "artx",
  "invent",
];

/* ------------------------------------------------------------------ */
/*  THE WORKSPACE — the pages open as tabs over the one chat: one      */
/*  window carries every open room, one tab active at a time.          */
/*                                                                     */
/*  THE PERSISTENCE LAW (the visitor named it): the workplace works    */
/*  as a real tab bar — every open room STAYS MOUNTED while its pill   */
/*  stands, even when another room is on the stage. A book being      */
/*  woven keeps weaving while the visitor checks the Invent; nothing  */
/*  is laid down unless its own x lays it down (and then only after   */
/*  the house asks again), or the visitor closes it from the pill.    */
/*  The hidden rooms rest display:none — no render cost, no lost      */
/*  state, no interrupted work.                                       */
/*                                                                     */
/*  THE ROOM'S OWN ZOOM — every room may grow to fill the whole sky   */
/*  while staying exactly where it is: the same room, the same state, */
/*  the same work, only bigger. The zoom KEEPS through tab turns now  */
/*  (the visitor named this too): only the visitor's own hand — the   */
/*  zoom hand again, the Esc key, or going back to the chat — lays    */
/*  it down.                                                          */
/* ------------------------------------------------------------------ */
function ToolWorkspaceImpl({ bare = false }: { bare?: boolean }) {
  const view = useMirror((s) => s.view);
  const toolTabs = useMirror((s) => s.toolTabs);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const openToolTab = useMirror((s) => s.openToolTab);
  const closeToolTab = useMirror((s) => s.closeToolTab);
  const closeWorkspace = useMirror((s) => s.closeWorkspace);
  /* THE ROOM'S OWN ZOOM — see the persistence law above. */
  const [zoomed, setZoomed] = useState(false);
  /* the room whose x was pressed — the house asks again before laying
     a room (and any work still in flight inside it) down */
  const [confirmClose, setConfirmClose] = useState<ToolTabKey | null>(null);

  /* a tab turn never lays the zoom down any more — only the visitor's
     own hand does (the zoom hand, Esc, or going back to the chat) */
  const [prevActive, setPrevActive] = useState<string | null>(activeToolTab);
  if (prevActive !== activeToolTab) {
    setPrevActive(activeToolTab);
    if (activeToolTab === null && zoomed) setZoomed(false);
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
     like the profile does; no hand may yank the view to a page. */
  const active =
    activeToolTab &&
    activeToolTab !== "scopes" &&
    (view === "observatory" ||
      view === "transmission" ||
      (bare && toolTabs.length > 0))
      ? activeToolTab
      : null;

  /* the rooms the window actually carries (the scopes never ride here) */
  const openRoomTabs = toolTabs.filter(
    (key) => key !== "scopes" && PAGE_VIEWS[key]
  );

  /* THE PERSISTENCE LAW'S HANDS — a room's cleanups run only when its
     own tab is laid down (its x, confirmed), never on a tab turn. The
     hidden rooms keep their work breathing: the book keeps weaving,
     the music keeps its sequencer, the thread keeps its place. */
  const prevTabsRef = useRef<ToolTabKey[]>(toolTabs);
  useEffect(() => {
    const removed = prevTabsRef.current.filter((k) => !toolTabs.includes(k));
    for (const k of removed) runWorkspaceCleanup(k);
    prevTabsRef.current = toolTabs;
  }, [toolTabs]);
  useEffect(
    () => () => {
      for (const k of prevTabsRef.current) runWorkspaceCleanup(k);
    },
    []
  );

  /* the guard itself — no room standing: the window does not exist */
  if (openRoomTabs.length === 0) return null;

  /* THE PARKED WORKPLACE — the visitor went back to the chat: every
     room stays mounted in a hidden keeper, so the book's weaving and
     every other work continue while the chat stands. One touch on any
     maker in the crown lifts the workplace again, exactly where it
     was left. */
  const parked = !active;

  /* THE CHAT'S OWN FRAME — the window is always the exact frame of
     the chat (absolute inset-0 of the realm): full size, no cap, no
     drag — it replaces the chat while it stands. The parent lens
     clips the corners, so the window wears none of its own. */
  const activeMeta = active ? WORKSPACES[active] : null;

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

  /* ONE PILL — the tab button and (when the room stands open) its own
     close hand, side by side inside one quiet capsule. The close hand
     never springs the room open; it asks the house first. */
  const renderPill = (key: ToolTabKey) => {
    const meta = TAB_META[key];
    const Icon = meta.icon;
    const opened = toolTabs.includes(key);
    const isActive = key === activeToolTab;
    return (
      <div
        key={key}
        data-testid={`tool-tab-${key}`}
        className={cn(
          "flex shrink-0 items-center rounded-full border transition-colors duration-300",
          isActive ? "border-transparent" : "border-transparent",
          opened
            ? "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            : "border-dashed text-muted-foreground/55 hover:border-[var(--hairline-hover)] hover:text-foreground"
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
        <button
          type="button"
          onClick={() => (opened ? activateToolTab(key) : openToolTab(key))}
          aria-pressed={isActive}
          title={t(meta.label)}
          className={cn(
            "focus-glow flex items-center gap-1 rounded-full py-0.5 pl-2 text-[11.5px] transition-colors duration-300",
            opened ? "pr-1.5" : "pr-2",
            isActive && "font-medium"
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {t(meta.label)}
        </button>
        {opened && (
          <button
            type="button"
            onClick={() => setConfirmClose(key)}
            aria-label={`${t(meta.label)} — ${t("Close the room")}`}
            title={t("Close the room")}
            data-testid={`tool-tab-close-${key}`}
            className="focus-glow flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="size-2.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  };

  const frame = (
    <div
      data-testid="tool-workspace"
      data-workplace="true"
      data-zoomed={zoomed || undefined}
      data-parked={parked || undefined}
      data-resource-profile={activeMeta?.resourceProfile ?? undefined}
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
          touch lays the workplace down and the main chat landing stands
          again — every room keeps working beneath, and the crown's
          makers lift the workplace exactly where it was. Beside it,
          THE STANDING RAIL — the five makers as horizontal tab buttons,
          every one always present, each open room carrying its own
          close hand. */}
      <div className="relative z-10 flex h-9 shrink-0 items-center gap-1 overflow-x-auto px-1">
        {/* THE ONE BACK HAND — the single return every tool and every
            room shares: leftmost, always the same place */}
        <button
          type="button"
          onClick={closeWorkspace}
          aria-label={t("Back to the chat")}
          title={t("Back to the chat")}
          data-testid="tool-workspace-back"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
        </button>

        {/* THE STANDING RAIL — the InDream shelf, one row, always
            standing */}
        {STANDING_RAIL.map(renderPill)}

        {/* the extra rooms — video, register, library: they ride the
            same rail when some other hand has opened them (the scopes
            never ride here — their workplace is independent) */}
        {toolTabs
          .filter((key) => !STANDING_RAIL.includes(key) && key !== "scopes")
          .map(renderPill)}

        <span className="flex-1" aria-hidden="true" />

        {/* THE ROOM'S OWN ZOOM — the same room, the same state, the
            same work: only bigger. The zoom keeps through tab turns;
            only the visitor's own hand lays it down. */}
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
      </div>

      {/* THE WORKPLACE IDENTITY STRIP — one slim line of the house's
          light under the rooms: the tint flows from the doors and fades
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

      {/* THE BODY — the persistence law's own room: EVERY open room
          stays mounted here, the active one on the stage, the others
          resting display:none beneath it. The keyed mount gives each
          room its own scroll and its own undisturbed state — switching
          tools never unmounts anything, so a weaving book keeps
          weaving and a sequencer keeps its pattern. */}
      <div className="relative min-h-0 flex-1">
        {openRoomTabs.map((key) => {
          const RoomView = PAGE_VIEWS[key];
          if (!RoomView) return null;
          const isOnStage = key === active && !parked;
          return (
            <div
              key={key}
              data-room-tab={key}
              aria-hidden={!isOnStage || undefined}
              className={cn("absolute inset-0", !isOnStage && "hidden")}
            >
              <WorkspaceBoundary label={t(WORKSPACES[key].title)}>
                <RoomView />
              </WorkspaceBoundary>
            </div>
          );
        })}
        {!parked && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[90px]"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--scope-a,var(--gd)) 5%, transparent), transparent)",
            }}
          />
        )}
      </div>

      {/* THE HOUSE ASKS AGAIN — laying a room down is the visitor's
          own hand, confirmed once: any work still in flight inside it
          (a weaving, a pattern, a words-thread) is laid down with it,
          and the house says so plainly before it happens. */}
      <AlertDialog
        open={confirmClose !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmClose(null);
        }}
      >
        <AlertDialogContent
          className="max-w-[340px] rounded-2xl border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a,var(--gd)) 30%, var(--hairline))",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">
              {t("Lay this room down?")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed">
              {t(
                "Its work rests with it — a weaving still in flight will be laid down too. The words already spoken keep their place."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full text-[12.5px]">
              {t("Let it keep working")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="tool-tab-close-confirm"
              className="rounded-full text-[12.5px]"
              style={{
                background:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 14%, transparent)",
                color: "var(--scope-a,var(--gd))",
                border:
                  "1px solid color-mix(in srgb, var(--scope-a,var(--gd)) 40%, transparent)",
              }}
              onClick={() => {
                if (confirmClose) closeToolTab(confirmClose);
                setConfirmClose(null);
              }}
            >
              {t("Lay it down")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  /* the parked workplace rests hidden — mounted, warm, unseen */
  if (parked) {
    return (
      <div className="hidden" aria-hidden="true" data-testid="tool-workspace-parked">
        {frame}
      </div>
    );
  }

  /* when the room is zoomed, the frame is lifted to the sky itself —
     above every transform of the page, still the very same room */
  if (zoomed && typeof document !== "undefined") {
    return createPortal(frame, document.body);
  }
  return frame;
}

export const ToolWorkspace = memo(ToolWorkspaceImpl);
