"use client";

/* ------------------------------------------------------------------ */
/*  THE L-SHAPED TOOLBAR'S VERTICAL ARM — directive 06's own component.*/
/*                                                                     */
/*  The horizontal crown remains the navigation foundation; this rail  */
/*  is its direct continuation down the right edge — one shared        */
/*  surface, one border, one corner. At the meeting point stands the   */
/*  JUNCTION BUTTON (a minimalist right-angle mark): it folds the      */
/*  vertical arm away and unfolds it again, never touching the canvas  */
/*  state, the camera, or the living conversations.                    */
/*                                                                     */
/*  The walk's own hands live here now (directive 07): the tree level  */
/*  readout, the depth's choice, zoom, fit, home, the step back, the   */
/*  clarity dusk, the journey and the list — all carried by events to  */
/*  the navigator, which reports its state back. Nothing here moves    */
/*  the map by itself; every hand is the visitor's own.                */
/*                                                                     */
/*  THE ONE UNIVERSAL CONTROL (the Intelligent Simplicity Protocol):   */
/*  one quiet button under the corner opens the single menu that       */
/*  gathers the destinations — find anything, continue the last        */
/*  activity, the saved spaces, clarity, the account. It stays closed  */
/*  by default: most of the walk happens in the conversation itself,   */
/*  not in managing settings. No new permanent toolbar was added —     */
/*  the menu lives inside the arm the house already owns.              */
/* ------------------------------------------------------------------ */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  Bookmark,
  ChevronDown,
  Compass,
  Eye,
  History,
  Layers,
  ListTree,
  Maximize2,
  Minus,
  NotebookPen,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useMirror } from "@/lib/mirror-store";
import { useConversations } from "@/lib/branch-conversations";
import { loadShelf } from "@/lib/book-shelf";
import {
  useWorkspaceMemory,
  type LastActivity,
} from "@/lib/workspace-memory";
import {
  peekCatalog,
  searchAll,
  type CatalogNode,
  type SearchHit,
} from "@/lib/universal-search";

interface RailState {
  depthBias: number;
  journeyOpen: boolean;
  listOpen: boolean;
  depth: number;
  clarity: boolean;
}

const EMPTY: RailState = {
  depthBias: 0,
  journeyOpen: false,
  listOpen: false,
  depth: 0,
  clarity: false,
};

/** THE JUNCTION'S OWN MARK — a minimalist right angle: the horizontal
 *  arm flowing into the vertical, the two halves of one toolbar. */
function CornerMark({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("transition-transform duration-300", !open && "rotate-90")}
    >
      {/* the corner: horizontal arm bending into the vertical arm */}
      <path d="M2.5 3h4.2a2.3 2.3 0 0 1 2.3 2.3v7.2" />
      <circle cx="12.6" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  THE UNIVERSAL MENU — one field, one return, one shelf of saved      */
/*  spaces. Everything here restores context: a result focuses its      */
/*  branch, a reading resumes its page, a conversation reopens where    */
/*  it stood.                                                           */
/* ------------------------------------------------------------------ */

function UniversalMenu({
  testIdPrefix,
  clarity,
  onClose,
}: {
  testIdPrefix: string;
  clarity: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  /* the map's own catalog — broadcast quietly by the navigator */
  const catalogRef = useRef<CatalogNode[]>([]);
  const [catalogTick, setCatalogTick] = useState(0);
  /* a menu opened later still reads the freshest map */
  const initialCatalog = useRef<CatalogNode[]>(peekCatalog());
  const pins = useWorkspaceMemory((s) => s.pins);
  const reading = useWorkspaceMemory((s) => s.reading);
  const last = useWorkspaceMemory((s) => s.last);

  useEffect(() => {
    inputRef.current?.focus();
    const onCat = (e: Event) => {
      catalogRef.current =
        (e as CustomEvent<{ nodes?: CatalogNode[] }>).detail?.nodes ?? [];
      setCatalogTick((n) => n + 1);
    };
    window.addEventListener("nav:catalog", onCat);
    return () => window.removeEventListener("nav:catalog", onCat);
  }, []);

  const send = useCallback((name: string, detail?: unknown) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }, []);

  /* A BOOK RESUMES AT ITS PAGE — the shelf keeps the whole volume, the
     workspace memory keeps where the reading rested */
  const resumeBook = useCallback(
    (bookId: string, pageIdx?: number) => {
      try {
        const v = loadShelf().find((x) => x.bookId === bookId);
        const m = useMirror.getState();
        if (v) {
          m.resumeDreamBook({
            bookId: v.bookId,
            config: v.config,
            meta: {
              title: v.title,
              subtitle: v.subtitle,
              sigil: v.sigil,
              axiom: v.axiom,
              dedication: v.dedication ?? "",
              totalPages: v.totalPages,
            },
            pages: v.pages,
            threads: v.threads,
            ended: v.ended,
            pageIdx,
          });
        }
        m.openDreamBook();
      } catch {
        useMirror.getState().openDreamBook();
      }
    },
    []
  );

  const openCreationView = useCallback((last: LastActivity) => {
    const m = useMirror.getState();
    switch (last.view) {
      case "dreambook":
        m.openDreamBook();
        break;
      case "akashic":
        m.openAkashic();
        break;
      case "lightcodes":
        m.openLightCodes();
        break;
      case "invent":
        m.openInvent();
        break;
      case "video":
        m.openVideo();
        break;
      default:
        break;
    }
  }, []);

  const openHit = useCallback(
    (h: SearchHit) => {
      onClose();
      if (h.payload.convId) {
        const conv = useConversations.getState().convs[h.payload.convId];
        if (conv) {
          send("nav:rail-open-conv", { question: conv.question });
          return;
        }
      }
      if (h.payload.nodeId) {
        send("nav:rail-goto", { nodeId: h.payload.nodeId });
        return;
      }
      if (h.payload.bookId) {
        resumeBook(h.payload.bookId, h.payload.pageIdx);
        return;
      }
      if (h.payload.view === "akashic") {
        useMirror.getState().openAkashic();
      }
    },
    [onClose, resumeBook, send]
  );

  const continueLast = useCallback(() => {
    if (!last) return;
    onClose();
    if (last.kind === "conversation" && last.question) {
      send("nav:rail-open-conv", { question: last.question });
    } else if (last.kind === "reading") {
      if (last.view === "dreambook" && last.bookId) {
        /* the page itself rests in the workspace memory's reading shelf */
        const pos = useWorkspaceMemory.getState().reading[`book:${last.bookId}`];
        resumeBook(last.bookId, pos?.pageIdx);
      } else if (last.view === "akashic") useMirror.getState().openAkashic();
    } else if (last.kind === "creation") {
      openCreationView(last);
    } else {
      send("nav:rail-fit");
    }
  }, [last, onClose, openCreationView, resumeBook, send]);

  const openPin = useCallback(
    (pinId: string) => {
      const p = pins.find((x) => x.id === pinId);
      if (!p) return;
      onClose();
      if (p.convId) {
        const conv = useConversations.getState().convs[p.convId];
        if (conv) {
          send("nav:rail-open-conv", { question: conv.question });
          return;
        }
      }
      send("nav:rail-goto", { text: p.text });
    },
    [onClose, pins, send]
  );

  const convs = useConversations.getState().convs;
  const hits = useMemo(
    () =>
      searchAll(query, {
        catalog: catalogRef.current.length ? catalogRef.current : initialCatalog.current,
        pins,
        convs: Object.values(convs).map((c) => ({
          question: c.question,
          convId: c.id,
          excerpt: c.turns.map((x) => `${x.q} ${x.a}`).join(" ").slice(0, 1200),
          turns: c.turns.length,
        })),
        readings: Object.entries(reading).map(([key, pos]) => ({ key, pos })),
      }),
    [query, pins, reading, catalogTick, convs]
  );

  const lastLabel = !last
    ? ""
    : last.kind === "conversation"
      ? t("Continue the conversation")
      : last.kind === "reading"
        ? t("Continue reading")
        : last.kind === "creation"
          ? t("Return to the making")
          : t("Return to the walk");

  return (
    <div
      role="dialog"
      aria-label={t("Menu")}
      data-testid={`${testIdPrefix}-menu-panel`}
      className="flex max-h-[min(64vh,520px)] w-[min(320px,calc(100vw-5rem))] flex-col overflow-hidden rounded-2xl border bg-background/97 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]"
      style={{ borderColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, var(--hairline))" }}
    >
      {/* the one search field — everything the house keeps */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>
        <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            } else if (e.key === "Enter" && hits.length > 0) {
              e.preventDefault();
              openHit(hits[0]);
            }
          }}
          placeholder={t("Find conversations, branches, books, makings…")}
          aria-label={t("Find conversations, branches, books, makings…")}
          data-testid={`${testIdPrefix}-menu-search`}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Close")}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {/* the one-action return — the last meaningful activity */}
        {last && (
          <button
            type="button"
            onClick={continueLast}
            data-testid={`${testIdPrefix}-menu-continue`}
            className="focus-glow flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors duration-200 hover:bg-foreground/5"
          >
            <History
              aria-hidden="true"
              className="size-3.5 shrink-0"
              style={{ color: "var(--scope-a, var(--gd))" }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] text-foreground/90">{lastLabel}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{last.title}</span>
            </span>
          </button>
        )}

        {/* the search's own answers */}
        {query.trim().length >= 2 && (
          <div className="mt-1" data-testid={`${testIdPrefix}-menu-results`}>
            {hits.length === 0 ? (
              <p className="px-2.5 py-3 text-[12px] italic text-muted-foreground">
                {t("Nothing found — the words may rest elsewhere.")}
              </p>
            ) : (
              hits.map((h, i) => (
                <button
                  key={`${h.type}:${h.title}:${i}`}
                  type="button"
                  onClick={() => openHit(h)}
                  className="focus-glow flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors duration-200 hover:bg-foreground/5"
                >
                  {h.type === "pin" ? (
                    <Bookmark aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : h.type === "reading" ? (
                    <BookMarked aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <i
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--scope-a, var(--gd))" }}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-foreground/90">{h.title}</span>
                    {h.sub && (
                      <span className="block truncate text-[10.5px] text-muted-foreground">{t(h.sub)}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* the saved spaces — pinned by the visitor, kept on this device */}
        {pins.length > 0 && (
          <div className="mt-1">
            <p className="mono-label px-2.5 pb-1 pt-2 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("Saved spaces")}
            </p>
            {pins.slice(0, 8).map((p) => (
              <div key={p.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => openPin(p.id)}
                  data-testid={`${testIdPrefix}-menu-pin`}
                  className="focus-glow flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 pr-8 text-left transition-colors duration-200 hover:bg-foreground/5"
                >
                  <Bookmark
                    aria-hidden="true"
                    className="size-3 shrink-0"
                    style={{ color: "var(--scope-a, var(--gd))", fill: "currentColor" }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/90">{p.text}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorkspaceMemory.getState().unpin(p.id);
                  }}
                  aria-label={t("Remove this saved space")}
                  className="absolute right-1.5 flex size-6 items-center justify-center rounded-full text-muted-foreground/60 opacity-0 transition-opacity duration-200 hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* the foot — the quiet essentials */}
      <div className="flex items-center gap-1 border-t px-2 py-1.5" style={{ borderColor: "var(--hairline)" }}>
        <button
          type="button"
          onClick={() => {
            send("nav:rail-clarity");
          }}
          aria-pressed={clarity}
          data-testid={`${testIdPrefix}-menu-clarity`}
          className={cn(
            "focus-glow flex flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground",
            clarity && "text-foreground"
          )}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          {t("Clarity mode")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            useMirror.getState().openProfile();
          }}
          data-testid={`${testIdPrefix}-menu-account`}
          className="focus-glow flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
        >
          <UserRound className="size-3.5" aria-hidden="true" />
          {t("Account")}
        </button>
      </div>
    </div>
  );
}

export const ToolbarRail = memo(function ToolbarRail({
  testIdPrefix,
}: {
  testIdPrefix: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(true);
  const [depthPick, setDepthPick] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<RailState>(EMPTY);

  /* the navigator's own state, reported as it changes */
  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<Partial<RailState>>).detail;
      if (!d) return;
      setState((s) => ({ ...s, ...d }));
    };
    window.addEventListener("nav:rail-state", onState);
    return () => window.removeEventListener("nav:rail-state", onState);
  }, []);

  const send = useCallback((name: string, detail?: unknown) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }, []);

  const closeDepthPick = useCallback(() => setDepthPick(false), []);

  const railBtn =
    "focus-glow flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground";

  const hands: {
    key: string;
    icon: typeof Plus;
    label: string;
    on: () => void;
    active?: boolean;
    event?: string;
  }[] = [
    { key: "zoom-in", icon: Plus, label: "Zoom in", on: () => send("nav:rail-zoom", { dir: 1 }) },
    { key: "zoom-out", icon: Minus, label: "Zoom out", on: () => send("nav:rail-zoom", { dir: -1 }) },
    { key: "fit", icon: Maximize2, label: "Fit the journey into view", on: () => send("nav:rail-fit") },
    { key: "home", icon: Compass, label: "Return home", on: () => send("nav:rail-home") },
    { key: "back", icon: RotateCcw, label: "Return to the previous focus", on: () => send("nav:rail-back") },
    {
      key: "clarity",
      icon: Eye,
      label: "Clarity mode — dim what stands away",
      on: () => send("nav:rail-clarity"),
      active: state.clarity,
    },
    {
      key: "journey",
      icon: NotebookPen,
      label: "My journey",
      on: () => send("nav:rail-journey"),
      active: state.journeyOpen,
    },
    {
      key: "list",
      icon: ListTree,
      label: "The walk as a list",
      on: () => send("nav:rail-list"),
      active: state.listOpen,
    },
  ];

  return (
    <div
      className="absolute z-40 flex flex-col items-center"
      style={{
        top: "max(0.5rem, env(safe-area-inset-top))",
        right: "max(0.5rem, env(safe-area-inset-right))",
      }}
      data-testid={`${testIdPrefix}-rail`}
    >
      <div
        className={cn(
          "flex flex-col items-center rounded-2xl border bg-background/92 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] transition-colors duration-300",
          open ? "gap-0.5 p-1" : "p-1"
        )}
        style={{
          borderColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 22%, var(--hairline))",
        }}
      >
        {/* THE JUNCTION BUTTON — the corner where the two arms meet */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setDepthPick(false);
            setMenuOpen(false);
          }}
          aria-expanded={open}
          aria-label={open ? t("Fold the walk's hands away") : t("Show the walk's hands")}
          title={open ? t("Fold the walk's hands away") : t("Show the walk's hands")}
          data-testid={`${testIdPrefix}-rail-toggle`}
          className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--scope-a,var(--gd))] transition-colors duration-200 hover:bg-foreground/5"
          style={{
            backgroundColor: "color-mix(in srgb, var(--scope-a,var(--gd)) 9%, transparent)",
          }}
        >
          <CornerMark open={open} />
        </button>

        {/* THE VERTICAL ARM — folded and unfolded as one breath */}
        <div
          aria-hidden={!open}
          className="grid w-9 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
          }}
        >
          <div className="flex min-h-0 flex-col items-center overflow-hidden">
            {/* THE ONE UNIVERSAL CONTROL — closed by default; opened it
                gathers find · continue · saved spaces · clarity · account.
                The panel itself rises OUTSIDE the folding arm (the arm's
                own column clips its overflow) — one level up, anchored to
                the rail. */}
            <div className="relative mt-0.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setDepthPick(false);
                }}
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-label={t("Menu")}
                title={t("Menu")}
                data-testid={`${testIdPrefix}-rail-menu`}
                className={cn(
                  "focus-glow flex size-8 items-center justify-center rounded-full text-[var(--scope-a,var(--gd))] transition-colors duration-200 hover:bg-foreground/5",
                  menuOpen && "bg-foreground/10"
                )}
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a,var(--gd)) 9%, transparent)",
                }}
              >
                <Search className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* the tree level's own readout — the walk's depth, small
                and always honest (directive 07) */}
            <span
              className="mono-label pointer-events-none mt-0.5 text-[8px] tabular-nums tracking-[0.1em] text-muted-foreground"
              title={t("Your depth in the walk")}
              data-testid={`${testIdPrefix}-rail-depth`}
            >
              L{Math.max(0, state.depth)}
            </span>
            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {/* the depth's own choice — the same two words, folded in
                a small popover so the arm stays slim */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDepthPick((v) => !v)}
                aria-expanded={depthPick}
                aria-label={t("Simpler or deeper words")}
                title={t("Simpler or deeper words")}
                data-testid={`${testIdPrefix}-nav-depth`}
                className={cn(
                  railBtn,
                  state.depthBias !== 0 && "text-[var(--scope-a,var(--gd))]"
                )}
              >
                <Layers className="size-3.5" aria-hidden="true" />
                {state.depthBias !== 0 && (
                  <i
                    aria-hidden="true"
                    className="absolute right-1 top-1 size-1 rounded-full"
                    style={{ backgroundColor: "var(--scope-a,var(--gd))" }}
                  />
                )}
              </button>
              {depthPick && (
                <>
                  <div
                    aria-hidden="true"
                    className="fixed inset-0 z-30"
                    onClick={closeDepthPick}
                  />
                  <div className="absolute right-10 top-0 z-40 flex flex-col gap-1 rounded-2xl border bg-background p-1.5 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.6)]">
                    <button
                      type="button"
                      onClick={() => {
                        send("nav:rail-depth", { bias: state.depthBias === -1 ? 0 : -1 });
                        closeDepthPick();
                      }}
                      aria-pressed={state.depthBias === -1}
                      data-testid={`${testIdPrefix}-nav-simpler`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] transition-colors duration-200",
                        state.depthBias === -1
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t("Simpler")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        send("nav:rail-depth", { bias: state.depthBias === 1 ? 0 : 1 });
                        closeDepthPick();
                      }}
                      aria-pressed={state.depthBias === 1}
                      data-testid={`${testIdPrefix}-nav-deeper`}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-[11px] transition-colors duration-200",
                        state.depthBias === 1
                          ? "bg-foreground/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t("Explore deeper")}
                    </button>
                  </div>
                </>
              )}
            </div>

            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {hands.slice(0, 6).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.on}
                aria-label={t(c.label)}
                aria-pressed={c.active}
                title={t(c.label)}
                data-testid={`${testIdPrefix}-nav-${c.key}`}
                className={cn(
                  railBtn,
                  c.active && "bg-foreground/10 text-foreground"
                )}
              >
                <c.icon className="size-3.5" aria-hidden="true" />
              </button>
            ))}

            <i
              aria-hidden="true"
              className="my-1 h-px w-5"
              style={{ backgroundColor: "var(--hairline)" }}
            />

            {hands.slice(6).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.on}
                aria-label={t(c.label)}
                aria-pressed={c.active}
                title={t(c.label)}
                data-testid={`${testIdPrefix}-nav-${c.key}`}
                className={cn(
                  railBtn,
                  c.active && "bg-foreground/10 text-foreground"
                )}
              >
                <c.icon className="size-3.5" aria-hidden="true" />
              </button>
            ))}

            <span className="pb-0.5 pt-1">
              <ChevronDown
                aria-hidden="true"
                className="size-3 text-muted-foreground/40"
              />
            </span>
          </div>
        </div>
      </div>

      {/* THE UNIVERSAL MENU — mounted at the rail's own level so the
          folding arm's clipping never touches it */}
      {menuOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-full top-1 z-50 mr-2">
            <UniversalMenu
              testIdPrefix={testIdPrefix}
              clarity={state.clarity}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
});
