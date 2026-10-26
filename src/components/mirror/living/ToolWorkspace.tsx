"use client";

import { memo, type ComponentType, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Clapperboard,
  Hammer,
  Library,
  Maximize2,
  Music,
  NotebookPen,
  ScrollText,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMirror, type ToolTabKey } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* THE LAZY ROOMS — the eight tools ride their own chunks, exactly like
   AppShell's own rooms: their code only arrives when first shown, never
   in the frame's opening bundle (client-only, no server weight, nothing
   on the first paint but a null). */
const AkashicView = dynamic(
  () => import("../AkashicView").then((m) => ({ default: m.AkashicView })),
  { ssr: false, loading: () => null }
);
const DreamBookView = dynamic(
  () => import("../DreamBookView").then((m) => ({ default: m.DreamBookView })),
  { ssr: false, loading: () => null }
);
const LightCodesView = dynamic(
  () => import("../LightCodesView").then((m) => ({ default: m.LightCodesView })),
  { ssr: false, loading: () => null }
);
const InventView = dynamic(
  () => import("../InventView").then((m) => ({ default: m.InventView })),
  { ssr: false, loading: () => null }
);
const MirrorOS = dynamic(
  () => import("../MirrorOS").then((m) => ({ default: m.MirrorOS })),
  { ssr: false, loading: () => null }
);
const LibraryView = dynamic(
  () => import("../LibraryView").then((m) => ({ default: m.LibraryView })),
  { ssr: false, loading: () => null }
);
const ArchiveRegister = dynamic(
  () => import("../ArchiveRegister").then((m) => ({ default: m.ArchiveRegister })),
  { ssr: false, loading: () => null }
);
const VideoStudioView = dynamic(
  () => import("../VideoStudioView").then((m) => ({ default: m.VideoStudioView })),
  { ssr: false, loading: () => null }
);

/* one row per tool — the small mark and the name the tab wears
   (exported so the history panel's maker trail wears the same marks) */
export const TAB_META: Record<ToolTabKey, { icon: LucideIcon; label: string }> = {
  mirroros: { icon: Sparkles, label: "Manifest" },
  akashic: { icon: ScrollText, label: "Akashic" },
  dreambook: { icon: BookOpen, label: "Book" },
  lightcodes: { icon: Music, label: "Music" },
  invent: { icon: Hammer, label: "Invent" },
  video: { icon: Clapperboard, label: "Video" },
  register: { icon: NotebookPen, label: "Register" },
  library: { icon: Library, label: "Library" },
};

const TOOL_VIEWS: Record<ToolTabKey, ComponentType> = {
  akashic: AkashicView,
  invent: InventView,
  dreambook: DreamBookView,
  lightcodes: LightCodesView,
  video: VideoStudioView,
  register: ArchiveRegister,
  mirroros: MirrorOS,
  library: LibraryView,
};

/* ------------------------------------------------------------------ */
/*  THE WORKSPACE — the tools open as tabs over the one chat: one      */
/*  window carries every open room, one tab active at a time. The      */
/*  window is ALWAYS the chat's own exact frame (absolute inset-0 of   */
/*  the realm — the lens clips its corners), in both of the chat's     */
/*  gears; it stands BELOW the crown's hands and every modal, and      */
/*  only over the chat — when a full-screen room owns the frame (a     */
/*  tab was expanded), the window rests and the tab stays parked       */
/*  until the room's own back hand returns.                            */
/* ------------------------------------------------------------------ */
function ToolWorkspaceImpl({ bare = false }: { bare?: boolean }) {
  const view = useMirror((s) => s.view);
  const toolTabs = useMirror((s) => s.toolTabs);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const closeToolTab = useMirror((s) => s.closeToolTab);
  const expandActiveToolTab = useMirror((s) => s.expandActiveToolTab);
  const t = useT();

  /* THE STANDING LAW — the window lives only over the chat: a parked
     tab (or a full-screen room owning the frame) lays it down.
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
  const winStyle: CSSProperties = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    borderColor:
      "color-mix(in srgb, var(--scope-a,var(--gd)) 25%, var(--hairline))",
  };

  const ActiveView = active ? TOOL_VIEWS[active] : null;

  return (
    <div
      data-testid="tool-workspace"
      data-workplace="true"
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col overflow-hidden rounded-none border bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.6)]"
      style={winStyle}
    >
      {/* THE WORKPLACE HEADER — the row of open rooms, worn as compact
          pills so many workplaces fit the chat's own frame. The active
          room wears the house's light: var(--scope-a) is the scope the
          visitor chose (LandingGate sets it on the whole chamber), so
          every workplace tints itself with its own house. */}
      <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto px-1">
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

        {/* THE EXPAND HAND — the room's full-frame depth: the view
            becomes the room itself (AppShell's early-return renders it
            across the whole frame), and the room's own back hand
            returns to this window */}
        <button
          type="button"
          onClick={expandActiveToolTab}
          aria-label={t("Fullscreen")}
          title={t("Fullscreen")}
          data-testid="tool-workspace-expand"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <Maximize2 className="size-3.5" aria-hidden="true" />
        </button>

        {/* THE CLOSE HAND — lays the whole window down */}
        <button
          type="button"
          onClick={() => active && closeToolTab(active)}
          aria-label={t("Close")}
          title={t("Close")}
          data-testid="tool-workspace-close"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
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

      {/* THE BODY — the active room fills the window; the keyed mount
          gives every tab its own clean scroll. A whisper of the house's
          light washes the workplace's ceiling (pointer-events-none, no
          blur, no motion — every touch passes through to the room). */}
      <div className="relative min-h-0 flex-1">
        {ActiveView && active ? (
          <div key={active} className="absolute inset-0">
            <ActiveView />
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
}

export const ToolWorkspace = memo(ToolWorkspaceImpl);
