"use client";

/* ------------------------------------------------------------------ */
/*  THE UNIVERSAL MENU — the one menu of the house.                    */
/*                                                                     */
/*  THE UNIVERSAL EVOLUTION PROTOCOL, part II: one small universal     */
/*  top tab, and behind its Menu hand one elegant popover — find       */
/*  anything, continue the last activity, the saved spaces, the walk's */
/*  ledger, the trail, the navigation hands, the categories, the doors */
/*  of the house, the light, and the passage. Nothing here is a        */
/*  dashboard: one flowing column, secondary groups folded quiet, and  */
/*  every choice closes the menu and restores its own context.         */
/*                                                                     */
/*  It stays closed by default. Most of the walk happens inside the    */
/*  conversation — never in managing settings.                         */
/* ------------------------------------------------------------------ */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import {
  BookMarked,
  Bookmark,
  BookOpen,
  ChevronDown,
  Compass,
  Eye,
  Hand,
  History,
  ListTree,
  Maximize2,
  Moon,
  Music2,
  RotateCcw,
  ScrollText,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
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

/* the categories, prebuilt by the canopy (it owns the mix's law) */
export interface TopCatItem {
  key: string;
  label: string;
  spirit: string;
  accent: string;
  pct: number | null;
  focused: boolean;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
}

/* the walk's ledger, prebuilt by the canopy */
export interface TopLedger {
  volumes: { key: string; title: string; pages: number; total: number }[];
  chats: { key: string; title: string; label: string }[];
}

export interface TopDoor {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  on: () => void;
}

export function UniversalMenu({
  testIdPrefix,
  clarity,
  onClose,
  mixTitle,
  lineage,
  onTrailStep,
  onRecalibrate,
  ledger,
  onLedgerVolume,
  onLedgerChat,
  generalFocused,
  cats,
  onPickCategory,
  doors,
  onPassage,
}: {
  testIdPrefix: string;
  clarity: boolean;
  onClose: () => void;
  /* where the walk stands */
  mixTitle: string;
  lineage: { id: string | null; text: string }[];
  onTrailStep: (step: { id: string | null; text: string }) => void;
  onRecalibrate: () => void;
  /* the walk's ledger (kept volumes, saved conversations) */
  ledger: TopLedger | null;
  onLedgerVolume: (key: string) => void;
  onLedgerChat: (key: string) => void;
  /* the categories of the house */
  generalFocused: boolean;
  cats: TopCatItem[];
  onPickCategory: (key: string | "general") => void;
  /* the doors of the house */
  doors: TopDoor[];
  /* the passage */
  onPassage: () => void;
}) {
  const t = useT();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [catsOpen, setCatsOpen] = useState(false);
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

  /* the trail, quiet — the newest step stands last, YOU ARE HERE on it */
  const trailSteps = useMemo(() => {
    const arr = [...lineage];
    return { shown: arr.slice(-4), count: arr.length };
  }, [lineage]);

  const navHands = [
    {
      key: "home",
      icon: Compass,
      label: "Return to the root of the walk",
      on: () => {
        onClose();
        send("nav:rail-home");
      },
    },
    {
      key: "fit",
      icon: Maximize2,
      label: "Fit the journey into view",
      on: () => {
        onClose();
        send("nav:rail-fit");
      },
    },
    {
      key: "back",
      icon: RotateCcw,
      label: "Return to the previous focus",
      on: () => {
        onClose();
        send("nav:rail-back");
      },
    },
    {
      key: "hands",
      icon: Hand,
      label: "Show the walk's hands",
      on: () => {
        onClose();
        send("nav:rail-unfold");
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-label={t("Menu")}
      data-testid={`${testIdPrefix}-menu-panel`}
      className="flex max-h-[min(74vh,560px)] w-[min(324px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-background/97 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]"
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
            {pins.slice(0, 6).map((p) => (
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

        {/* where the walk stands — the compass context and the trail */}
        <div className="mt-1" data-testid={`${testIdPrefix}-top-where`}>
          <p className="mono-label px-2.5 pb-1 pt-2 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Where the walk stands")}
          </p>
          <div
            className="mx-1 flex items-center gap-2 rounded-xl px-2 py-1.5"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--scope-a,var(--gd)) 8%, transparent)",
            }}
          >
            <Compass
              className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
              aria-hidden="true"
            />
            <span className="mono-label min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.16em] text-foreground/85">
              {mixTitle}
            </span>
            {trailSteps.count > 0 && (
              <span
                className="mono-label shrink-0 text-[10px] tabular-nums text-muted-foreground/70"
                aria-hidden="true"
              >
                ·{trailSteps.count}
              </span>
            )}
          </div>
          {trailSteps.shown.map((l, i) => {
            const latest = i === trailSteps.shown.length - 1;
            return (
              <button
                key={`${l.text}-${i}`}
                type="button"
                onClick={() => {
                  onClose();
                  onTrailStep(l);
                }}
                aria-label={`${t("Return to")}: ${l.text}`}
                title={l.text}
                className={cn(
                  "focus-glow mx-1 mt-0.5 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                  latest && "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mono-label w-4 shrink-0 text-[9px] tabular-nums",
                    latest
                      ? "text-[var(--scope-a,var(--gd))]"
                      : "text-muted-foreground/50"
                  )}
                >
                  {trailSteps.count - trailSteps.shown.length + i + 1}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[12.5px]",
                    latest
                      ? "font-medium text-[var(--scope-a,var(--gd))]"
                      : "text-foreground/85"
                  )}
                >
                  {l.text}
                </span>
                {latest && (
                  <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                    {t("You are here")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* the walk's own hands — home, fit, step back, the arm */}
        <div className="mt-1.5 flex items-center justify-between gap-1 px-1">
          {navHands.map((h) => (
            <button
              key={h.key}
              type="button"
              onClick={h.on}
              aria-label={t(h.label)}
              title={t(h.label)}
              data-testid={`${testIdPrefix}-menu-hand-${h.key}`}
              className="focus-glow flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
            >
              <h.icon className="size-3.5" aria-hidden="true" />
              <span className="max-w-full truncate text-[8.5px] leading-none opacity-80">
                {h.key === "home"
                  ? t("Root")
                  : h.key === "fit"
                    ? t("Fit")
                    : h.key === "back"
                      ? t("Back")
                      : t("Hands")}
              </span>
            </button>
          ))}
        </div>

        {/* THE WALK'S LEDGER — everything the visitor kept */}
        {ledger && (ledger.volumes.length > 0 || ledger.chats.length > 0) && (
          <div className="mt-1.5" data-testid={`${testIdPrefix}-top-ledger`}>
            <p className="mono-label px-2.5 pb-1 pt-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("The walk's ledger")}
            </p>
            {ledger.volumes.slice(0, 3).map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => onLedgerVolume(v.key)}
                aria-label={`${t("Read again")}: ${v.title}`}
                title={v.title}
                className="focus-glow flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
              >
                <BookOpen className="size-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/85">{v.title}</span>
                <span className="mono-label shrink-0 text-[9px] tabular-nums text-muted-foreground/60">
                  {v.pages}/{v.total}
                </span>
              </button>
            ))}
            {ledger.chats.slice(0, 4).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => onLedgerChat(c.key)}
                aria-label={`${t("Open")}: ${c.title}`}
                title={c.title}
                className="focus-glow flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
              >
                <History className="size-3 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/85">{c.title}</span>
                <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* THE KATEGORIES — folded quiet: one touch opens the families */}
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setCatsOpen((v) => !v)}
            aria-expanded={catsOpen}
            data-testid={`${testIdPrefix}-top-cats`}
            className="focus-glow flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] text-foreground/85 transition-colors duration-200 hover:bg-foreground/5"
          >
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--scope-a,var(--gd)) 10%, transparent)",
              }}
            >
              <ListTree
                className="size-3 text-[var(--scope-a,var(--gd))]"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1 truncate">{t("The categories of the house")}</span>
            <ChevronDown
              className={cn(
                "size-3 shrink-0 text-muted-foreground transition-transform duration-300",
                catsOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          {catsOpen && (
            <div className="mt-0.5 flex flex-col" data-testid={`${testIdPrefix}-top-cats-list`}>
              <button
                type="button"
                onClick={() => onPickCategory("general")}
                aria-pressed={generalFocused}
                title={t("The whole house, mixed")}
                className={cn(
                  "focus-glow flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_7%,transparent)]",
                  generalFocused &&
                    "bg-[color-mix(in_srgb,var(--scope-a,var(--gd))_10%,transparent)]"
                )}
              >
                <ListTree
                  className="size-3.5 shrink-0 text-[var(--scope-a,var(--gd))]"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
                  {t("General")}
                </span>
                {generalFocused && (
                  <span className="mono-label shrink-0 text-[9px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                    {t("You are here")}
                  </span>
                )}
              </button>
              {cats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onPickCategory(c.key)}
                  aria-pressed={c.focused}
                  title={c.label}
                  className={cn(
                    "focus-glow flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                    c.focused && "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${c.accent} 12%, transparent)` }}
                  >
                    <c.icon className="size-3" style={{ color: c.accent, opacity: c.pct !== null || c.focused ? 1 : 0.55 }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-foreground/90">{c.label}</span>
                      {c.pct !== null && (
                        <span className="mono-label shrink-0 text-[10px] tabular-nums" style={{ color: c.accent }}>
                          {c.pct}%
                        </span>
                      )}
                      {c.focused && (
                        <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.14em] text-[var(--scope-a,var(--gd))]">
                          {t("You are here")}
                        </span>
                      )}
                    </span>
                    <span className="mono-label mt-0.5 block truncate text-[9px] normal-case tracking-[0.02em] text-muted-foreground/70">
                      {c.spirit}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* THE DOORS OF THE HOUSE — the reading rooms, one row */}
        {doors.length > 0 && (
          <div className="mt-1.5 flex items-center justify-between gap-1 px-1" data-testid={`${testIdPrefix}-top-doors`}>
            {doors.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  onClose();
                  d.on();
                }}
                aria-label={t(d.label)}
                title={t(d.label)}
                data-testid={`${testIdPrefix}-top-door-${d.key}`}
                className="focus-glow flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
              >
                <d.icon className="size-3.5" aria-hidden="true" />
                <span className="max-w-full truncate text-[8.5px] leading-none opacity-80">{t(d.label)}</span>
              </button>
            ))}
          </div>
        )}

        {/* the quiet hand — the field returns to origin */}
        <button
          type="button"
          onClick={onRecalibrate}
          aria-label={t("Recalibrate the field")}
          title={t("Recalibrate the field")}
          data-testid={`${testIdPrefix}-top-recalibrate`}
          className="focus-glow mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
        >
          <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground/90">
            {t("Recalibrate the field")}
          </span>
        </button>
      </div>

      {/* the foot — clarity, the light, and the visitor's passage */}
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
            const root = document.documentElement;
            const dark = root.classList.contains("dark");
            root.classList.add("theme-anim");
            const next = dark ? "light" : "dark";
            setTheme(next);
            /* THE SESSION'S OWN WORD — the choice rides the visit: the
               website's default stays the vanilla daylight at every fresh
               arrival, and the blue crystal waits through this visit only. */
            try {
              window.sessionStorage.setItem("mirror-entity-realm-session", next);
            } catch {
              /* the session's keeping stays closed — the realm's state carries */
            }
            window.setTimeout(() => root.classList.remove("theme-anim"), 560);
          }}
          aria-label={t("Toggle the light")}
          title={t("Toggle the light")}
          data-testid={`${testIdPrefix}-top-light`}
          className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
        >
          {/* THE TWO FACES OF THE HAND — drawn by the theme's own class,
              never by the client's memory (no hydration drift) */}
          <Sun className="hidden size-3.5 dark:block" aria-hidden="true" />
          <Moon className="block size-3.5 dark:hidden" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onPassage();
          }}
          data-testid={`${testIdPrefix}-top-passage`}
          className="focus-glow flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
        >
          <UserRound className="size-3.5" aria-hidden="true" />
          {t("Passage")}
        </button>
      </div>
    </div>
  );
}

/* the doors' default set lives beside the menu — the canopy builds its
   own with the house's own hands, this constant only names the accents */
export const UNIVERSAL_DOOR_ICONS = { ScrollText, BookOpen, Music2 };
