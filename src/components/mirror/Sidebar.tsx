"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookMarked,
  BookOpen,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Cpu,
  Heart,
  Landmark,
  Mountain,
  NotebookPen,
  Plus,
  RotateCcw,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Orbit,
  Users,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  civilizations,
} from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { innerEarth, type InnerEarthSpecies } from "@/lib/data/inner-earth";
import { archiveTotals, useMirror } from "@/lib/mirror-store";
import { LANGUAGES, useT } from "@/lib/i18n";
import { entityImage, searchEntities } from "@/lib/entity-utils";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import type { CivilizationGroup, InterdimGroup } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  The sidebar — everything the old header held, arranged calmly:     */
/*  the cosmic logo, New chat, the worlds, the registers, the          */
/*  galactic encyclopedia, and the quiet footer of the laboratory.     */
/* ------------------------------------------------------------------ */

/** One quiet row of the sidebar navigation. */
function NavRow({
  icon: Icon,
  label,
  aria,
  onClick,
  testId,
}: {
  icon: typeof BookOpen;
  label: string;
  aria?: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria ?? label}
      title={aria ?? label}
      data-testid={testId}
      className="focus-glow group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_8%,transparent)]"
    >
      <Icon
        className="size-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-[var(--cy)]"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground/80 transition-colors duration-200 group-hover:text-foreground">
        {label}
      </span>
    </button>
  );
}

/** A tiny section label above a group of rows. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mono-label px-2.5 pb-1 pt-3 text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/60">
      {children}
    </p>
  );
}

function EntityAvatar({ id, kind }: { id: string; kind: string }) {
  const src =
    kind === "civilization"
      ? `/images/ai/fam-${id}.jpg`
      : `/images/ai/ord-${id}.jpg`;
  return (
    <span
      className="relative size-5 shrink-0 overflow-hidden rounded-full border hairline"
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="size-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}

function Row({ entry }: { entry: CivilizationGroup | InterdimGroup }) {
  const openModal = useMirror((s) => s.openModal);
  const kind = entry.category === "civilization" ? "civilization" : "interdim";

  return (
    <li>
      <button
        type="button"
        onClick={() => openModal({ type: "dossier", kind, id: entry.id })}
        className="focus-glow group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_7%,transparent)]"
      >
        <EntityAvatar id={entry.id} kind={kind} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium uppercase tracking-[0.06em] text-foreground/75 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {entry.name}
        </span>
        <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground/70">
          {entry.count}
        </span>
      </button>
    </li>
  );
}

function SpeciesRow({ species }: { species: InnerEarthSpecies }) {
  const openSpecies = useMirror((s) => s.openSpecies);
  const t = useT();

  return (
    <li data-testid="inner-earth-row">
      <button
        type="button"
        onClick={() => openSpecies(species.id)}
        aria-label={t("Open the dossier of {name}", { name: species.name })}
        className="focus-glow group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_7%,transparent)]"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border hairline bg-muted font-serif text-[12px] leading-none text-muted-foreground"
        >
          {species.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium tracking-[0.02em] text-foreground/85 transition-colors duration-200 group-hover:text-foreground">
            {species.name}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-muted-foreground/70">
            {species.hall}
          </span>
        </span>
        <ChevronRight
          className="mt-1 size-3.5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

function EntityResultRow({
  entityId,
  name,
  kind,
}: {
  entityId: string;
  name: string;
  kind: "civilization" | "interdim";
}) {
  const openModal = useMirror((s) => s.openModal);
  return (
    <li>
      <button
        type="button"
        onClick={() => openModal({ type: "entity", kind, id: entityId })}
        className="focus-glow group flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-7 pr-2.5 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_7%,transparent)]"
      >
        <span
          className="relative size-6 shrink-0 overflow-hidden rounded-full border hairline"
          aria-hidden="true"
        >
          <img
            src={entityImage(entityId)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/70 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {name}
        </span>
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  The galactic encyclopedia — collapsible so the sidebar stays calm. */
/* ------------------------------------------------------------------ */

type BookId = "civilizations" | "interdim" | "innerearth";

function OuterRealmsSection() {
  const openRegister = useMirror((s) => s.openRegister);
  const search = useMirror((s) => s.search);
  const setSearch = useMirror((s) => s.setSearch);
  const t = useT();
  const [open, setOpen] = useState(false);
  const [book, setBook] = useState<BookId | null>(null);

  const listRef = useRef<HTMLUListElement | null>(null);
  const [scrollState, setScrollState] = useState({
    scrollable: false,
    atEnd: true,
  });

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 8;
    const atEnd =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 14 || !scrollable;
    setScrollState((prev) =>
      prev.scrollable === scrollable && prev.atEnd === atEnd
        ? prev
        : { scrollable, atEnd }
    );
  }, []);

  useEffect(() => {
    if (!open || !book) return;
    measure();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [measure, open, book]);

  useEffect(() => {
    if (!open || !book) return;
    const id = window.setTimeout(measure, 60);
    return () => window.clearTimeout(id);
  }, [measure, open, book, search]);

  const source =
    book === "civilizations"
      ? civilizations
      : book === "interdim"
        ? interdimensional
        : null;

  const kind = book === "civilizations" ? "civilization" : "interdim";

  const filtered = useMemo(() => {
    if (!source) return [];
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.origin.toLowerCase().includes(q)
    );
  }, [search, source]);

  const filteredSpecies = useMemo(() => {
    if (book !== "innerearth") return [];
    const q = search.trim().toLowerCase();
    if (!q) return innerEarth;
    return innerEarth.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.hall.toLowerCase().includes(q)
    );
  }, [search, book]);

  const entityMatches = useMemo(() => {
    if (!search.trim() || !book || book === "innerearth") return [];
    return searchEntities(kind, search, 20);
  }, [search, kind, book]);

  const emptyLabel =
    book === "civilizations"
      ? t("No matching civilizations found.")
      : book === "interdim"
        ? t("No matching interdimensional categories found.")
        : t("No matching inner earth peoples found.");

  const books: {
    id: BookId;
    icon: typeof Users;
    label: string;
    count: number;
  }[] = [
    {
      id: "civilizations",
      icon: Users,
      label: t("Civilizations"),
      count: archiveTotals.civilizations,
    },
    {
      id: "interdim",
      icon: Orbit,
      label: t("Interdimensional"),
      count: archiveTotals.interdim,
    },
    {
      id: "innerearth",
      icon: Mountain,
      label: t("Inner Earth"),
      count: archiveTotals.innerearth,
    },
  ];

  return (
    <div className="min-h-0 shrink-0 border-t hairline">
      {/* the one quiet door of the library */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid="encyclopedia-toggle"
        className="focus-glow group flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors duration-200 hover:text-foreground"
      >
        <BookOpenText
          className="size-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
          aria-hidden="true"
        />
        <span className="mono-label min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground/85">
          {t("Outer Realms")}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="min-h-0 pb-2">
          {/* one shared search for every book */}
          <div className="px-3.5 pb-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search civilizations, beings, origins...")}
                aria-label={t("Search civilizations, beings, origins")}
                className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent pl-9 pr-8 text-[13.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={t("Clear search")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* the books — dropdown buttons, one open at a time */}
          <div className="flex flex-col gap-1 px-3">
            {books.map((b) => {
              const isOpen = book === b.id;
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-xl border hairline bg-[var(--glass-bg-soft)]"
                >
                  <button
                    type="button"
                    onClick={() => setBook(isOpen ? null : b.id)}
                    aria-expanded={isOpen}
                    data-testid={`book-${b.id}`}
                    className="focus-glow flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--cy)_7%,transparent)]"
                  >
                    <Icon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/80">
                      {b.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/70">
                      {b.count}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="relative border-t hairline">
                      <ul
                        ref={listRef}
                        onScroll={measure}
                        className={cn(
                          "nice-scroll archive-scroll max-h-[30vh] space-y-0.5 overflow-y-auto px-1.5 py-1.5",
                          scrollState.scrollable &&
                            !scrollState.atEnd &&
                            "is-scrollable"
                        )}
                        aria-live="polite"
                        data-testid="archive-list"
                      >
                        {entityMatches.length > 0 && (
                          <li className="px-2.5 pb-1 pt-1">
                            <span className="mono-label text-[10.5px] text-muted-foreground/70">
                              {t("Named representatives")}
                            </span>
                          </li>
                        )}
                        {entityMatches.map((e) => (
                          <EntityResultRow
                            key={e.id}
                            entityId={e.id}
                            name={e.name}
                            kind={kind}
                          />
                        ))}
                        {b.id === "innerearth" &&
                          filteredSpecies.map((s) => (
                            <SpeciesRow key={s.id} species={s} />
                          ))}

                        {b.id !== "innerearth" &&
                          filtered.map((entry) => (
                            <Row key={entry.id} entry={entry} />
                          ))}

                        {b.id === "innerearth"
                          ? filteredSpecies.length === 0 && (
                              <li className="px-2.5 py-3 text-[13.5px] italic leading-relaxed text-muted-foreground/80">
                                {emptyLabel}
                              </li>
                            )
                          : filtered.length === 0 &&
                            entityMatches.length === 0 && (
                              <li className="px-2.5 py-3 text-[13.5px] italic leading-relaxed text-muted-foreground/80">
                                {emptyLabel}
                              </li>
                            )}

                        {entityMatches.length >= 20 && (
                          <li className="px-2.5 pb-2 pt-1">
                            <button
                              type="button"
                              onClick={() => openRegister(kind)}
                              className="focus-glow mono-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {t(
                                "Showing first {n} matches — open the full register to search every name →",
                                { n: 20 }
                              )}
                            </button>
                          </li>
                        )}
                      </ul>

                      {scrollState.scrollable && !scrollState.atEnd && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[color-mix(in_srgb,var(--background)_88%,transparent)] to-transparent"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The sidebar content — shared by the desktop rail and mobile sheet. */
/* ------------------------------------------------------------------ */

export function SidebarContent() {
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const openAkashic = useMirror((s) => s.openAkashic);
  const openInvent = useMirror((s) => s.openInvent);
  const openModal = useMirror((s) => s.openModal);
  const resetField = useMirror((s) => s.resetField);
  const clearChannel = useMirror((s) => s.clearChannel);
  const returnToObservatory = useMirror((s) => s.returnToObservatory);
  const language = useMirror((s) => s.language);
  const t = useT();
  const langMeta = LANGUAGES.find((l) => l.code === language);

  const newChat = () => {
    clearChannel();
    returnToObservatory();
    setMobileNavOpen(false);
    toast({
      title: t("New chat"),
      description: t("The channel returns to its quiet origin."),
    });
  };

  const recalibrate = () => {
    resetField();
    setMobileNavOpen(false);
    toast({
      title: t("Field recalibrated"),
      description: t("All scopes returned to origin. Free will honored always."),
    });
  };

  const worlds: {
    key: string;
    icon: typeof BookOpen;
    label: string;
    aria: string;
    action: () => void;
  }[] = [
    {
      key: "mirroros",
      icon: BookOpen,
      label: t("Manifest"),
      aria: t("Open the Mirror OS — Reality Guidance"),
      action: openMirrorOS,
    },
    {
      key: "akashic",
      icon: BookMarked,
      label: t("Akashic"),
      aria: t("Open the Akashic Library — records of the ancient one"),
      action: openAkashic,
    },
    {
      key: "starplay",
      icon: Sparkles,
      label: t("Star Play"),
      aria: t("Open Star Play — the Mirror's arcana deck"),
      action: () => openModal({ type: "starplay" }),
    },
    {
      key: "invent",
      icon: NotebookPen,
      label: t("Invent"),
      aria: t("Open Invent — the Forge, the invention workshop of the Mirror"),
      action: openInvent,
    },
  ];

  const registers: {
    key: string;
    icon: typeof Landmark;
    label: string;
    aria?: string;
    action: () => void;
  }[] = [
    {
      key: "federation",
      icon: Landmark,
      label: t("Federation"),
      action: () => openModal({ type: "federation" }),
    },
    {
      key: "technology",
      icon: Cpu,
      label: t("ET Technology"),
      aria: t("Open ET Technology — the xenotechnology register"),
      action: () => openModal({ type: "technology" }),
    },
    {
      key: "astral",
      icon: ScrollText,
      label: t("Astral Jobs"),
      action: () => openModal({ type: "astral" }),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Brand — the simple cosmic mark speaks for the laboratory */}
      <div className="flex shrink-0 items-center gap-2 px-3 pt-3">
        <img
          src="/images/ai/cosmic-mark.png"
          alt={t("Mirror Entity Laboratory")}
          title={t("Mirror Entity Laboratory")}
          data-testid="cosmic-logo"
          className="size-9 rounded-full object-cover shadow-[0_1px_10px_-4px_rgba(0,0,0,0.3)]"
        />
        <span className="mono-label flex min-w-0 flex-1 items-center gap-1.5 truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          <span className="truncate">{t("With love")}</span>
          <Heart
            className="size-2.5 shrink-0 fill-current"
            aria-hidden="true"
          />
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t("Close encyclopedia")}
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* New chat */}
      <div className="shrink-0 px-3 pt-3">
        <button
          type="button"
          onClick={newChat}
          data-testid="new-chat"
          className="focus-glow flex h-9 w-full items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
        >
          <Plus className="size-4 shrink-0 text-[var(--cy)]" aria-hidden="true" />
          <span className="text-[13.5px] font-medium text-foreground/85">
            {t("New chat")}
          </span>
        </button>
      </div>

      {/* Worlds */}
      <div className="shrink-0 px-3">
        <SectionLabel>{t("Worlds")}</SectionLabel>
        <nav aria-label={t("Worlds")} className="flex flex-col">
          {worlds.map((w) => (
            <NavRow
              key={w.key}
              icon={w.icon}
              label={w.label}
              aria={w.aria}
              onClick={() => {
                w.action();
                setMobileNavOpen(false);
              }}
              testId={`world-${w.key}`}
            />
          ))}
        </nav>
      </div>

      {/* Registers */}
      <div className="shrink-0 px-3">
        <SectionLabel>{t("Registers")}</SectionLabel>
        <nav aria-label={t("Registers")} className="flex flex-col">
          {registers.map((r) => (
            <NavRow
              key={r.key}
              icon={r.icon}
              label={r.label}
              aria={r.aria}
              onClick={() => {
                r.action();
                setMobileNavOpen(false);
              }}
              testId={`register-${r.key}`}
            />
          ))}
        </nav>
      </div>

      {/* Outer Realms — the library as dropdown books */}
      <div className="mt-1">
        <OuterRealmsSection />
      </div>

      {/* Footer — theme, recalibrate, settings */}
      <div className="mt-auto flex shrink-0 items-center gap-1.5 border-t hairline px-3 py-2.5">
        <ThemeToggle />
        <button
          type="button"
          onClick={recalibrate}
          aria-label={t("Recalibrate the field")}
          title={t("Recalibrate the field")}
          className="focus-glow group flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <RotateCcw
            className="size-3.5 transition-transform duration-500 group-hover:-rotate-180"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={() => openModal({ type: "settings" })}
          aria-label={t("Open laboratory settings")}
          data-testid="settings-open"
          className="focus-glow flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full border hairline px-2.5 text-left transition-all duration-300 hover:border-[var(--hairline-hover)]"
        >
          <Settings className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground/80">
            {t("Settings")}
          </span>
          <span className="shrink-0 rounded-md border hairline px-1.5 py-0.5 font-mono text-[9.5px] leading-none text-muted-foreground">
            {langMeta?.native ?? "English"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const sidebarOpen = useMirror((s) => s.sidebarOpen);
  const t = useT();

  return (
    <aside
      aria-label={t("Outer Realms")}
      data-testid="sidebar"
      className={cn(
        "z-20 hidden shrink-0 flex-col overflow-hidden border-r hairline bg-[var(--glass-bg-soft)] backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
        sidebarOpen ? "w-[264px] lg:w-[288px]" : "w-0 border-r-0"
      )}
      aria-hidden={!sidebarOpen}
    >
      <SidebarContent />
    </aside>
  );
}
