"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

/* one row per tool — the small mark and the name the tab wears */
const TAB_META: Record<ToolTabKey, { icon: LucideIcon; label: string }> = {
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
/*  THE WORKSPACE — the tools open as mini tabs over the living tree:  */
/*  one floating window carries every open room, one tab active at a   */
/*  time. The window stands BELOW the where-pill's hands and every     */
/*  modal, and only over the walk — when a full-screen room owns the   */
/*  screen (a tab was expanded), the window rests and the tab stays    */
/*  parked until the room's own back hand returns. Desktop windows     */
/*  drag by their header (mouse only, clamped to the frame); small     */
/*  screens wear a sheet under the pill instead — no drag.             */
/* ------------------------------------------------------------------ */
function ToolWorkspaceImpl() {
  const view = useMirror((s) => s.view);
  const toolTabs = useMirror((s) => s.toolTabs);
  const activeToolTab = useMirror((s) => s.activeToolTab);
  const activateToolTab = useMirror((s) => s.activateToolTab);
  const closeToolTab = useMirror((s) => s.closeToolTab);
  const expandActiveToolTab = useMirror((s) => s.expandActiveToolTab);
  const t = useT();

  /* THE STANDING LAW — the window lives only over the walk: a parked
     tab (or a full-screen room owning the screen) lays it down.
     "transmission" IS the walk — the realm renders it as its own room
     (AppShell has no early-return for it; it is only the view the
     channel's asks carry), so the window keeps standing there. */
  const active =
    activeToolTab && (view === "observatory" || view === "transmission")
      ? activeToolTab
      : null;

  /* the drag — desktop pointers only, the header is the handle */
  const [desktop, setDesktop] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      setDesktop(mq.matches);
      if (!mq.matches) setPos(null);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const onHeaderPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!desktop || e.button !== 0) return;
      /* the tabs' and hands' own presses stay presses — never drags */
      if ((e.target as HTMLElement).closest("button")) return;
      const win = winRef.current;
      if (!win) return;
      const rect = win.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY };
      const base = { x: rect.left, y: rect.top };
      setPos(base);
      const move = (ev: PointerEvent) => {
        /* clamp inside the frame that holds the window — the walk's
           realm, or the docked lens on the threshold */
        const parent = win.offsetParent as HTMLElement | null;
        const b = parent
          ? parent.getBoundingClientRect()
          : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const x = Math.min(
          Math.max(base.x + (ev.clientX - start.x), b.left - (rect.width - 132)),
          b.left + b.width - 132
        );
        const y = Math.min(
          Math.max(base.y + (ev.clientY - start.y), b.top),
          b.top + b.height - 60
        );
        setPos({ x, y });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [desktop]
  );

  /* the guard itself — no tab standing (or a full-screen room owning
     the screen): the window does not exist; hooks have all run above */
  if (!active) return null;

  const winStyle: CSSProperties = {
    borderColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 25%, var(--hairline))",
    ...(desktop
      ? pos
        ? { left: pos.x, top: pos.y }
        : {
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(4.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
            width: "min(880px, calc(100% - 2rem))",
            height: "min(600px, calc(100% - 8rem))",
          }
      : {
          top: "calc(env(safe-area-inset-top) + 3.25rem)",
          bottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }),
  };

  const ActiveView = active ? TOOL_VIEWS[active] : null;

  return (
    <div
      ref={winRef}
      data-testid="tool-workspace"
      className={cn(
        "pointer-events-auto z-30 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-[0_24px_70px_-30px_rgba(0,0,0,0.6)]",
        desktop ? "absolute" : "fixed inset-x-2"
      )}
      style={winStyle}
    >
      {/* THE HEADER — the drag handle and the row of open rooms */}
      <div
        className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b px-1.5"
        style={{ borderColor: "var(--hairline)" }}
        onPointerDown={onHeaderPointerDown}
      >
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
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] transition-colors duration-300",
                isActive
                  ? "bg-foreground/10 font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
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

        {/* THE EXPAND HAND — the active room's old full-screen self */}
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

      {/* THE BODY — the active room fills the window; the keyed mount
          gives every tab its own clean scroll */}
      <div className="relative min-h-0 flex-1">
        {ActiveView && active ? (
          <div key={active} className="absolute inset-0">
            <ActiveView />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const ToolWorkspace = memo(ToolWorkspaceImpl);
