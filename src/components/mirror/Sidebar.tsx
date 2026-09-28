"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  DraftingCompass,
  Moon,
  Scroll,
  Search,
  Settings,
  Orbit,
  X,
} from "lucide-react";
import {
  civilizations,
} from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { innerEarth, type InnerEarthSpecies } from "@/lib/data/inner-earth";
import { archiveTotals, useMirror } from "@/lib/mirror-store";
import { LANGUAGES, useT } from "@/lib/i18n";
import { entityImage, searchEntities } from "@/lib/entity-utils";
import { cn } from "@/lib/utils";
import type { CivilizationGroup, InterdimGroup } from "@/lib/mirror-types";

/* ------------------------------------------------------------------ */
/*  The laboratory shelf — four books standing side by side at the     */
/*  bottom of the sidebar: Manifest, Akashic, Star Play, Invent.       */
/*  Each book is a spine with its own color, height and slight lean;   */
/*  hovering lifts it out of the shelf, the way a reader draws a       */
/*  volume from its place.                                             */
/* ------------------------------------------------------------------ */

interface ShelfBook {
  key: "manifest" | "akashic" | "starplay" | "invent";
  label: string;
  aria: string;
  action: () => void;
  icon: typeof Moon;
  color: string;
  height: number;
  lean: number;
}

function Bookshelf() {
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const openAkashic = useMirror((s) => s.openAkashic);
  const openInvent = useMirror((s) => s.openInvent);
  const openModal = useMirror((s) => s.openModal);
  const t = useT();

  const books: ShelfBook[] = [
    {
      key: "manifest",
      label: t("Manifest"),
      aria: t("Open the Mirror OS — Reality Guidance"),
      action: openMirrorOS,
      icon: Moon,
      color: "var(--cy)",
      height: 128,
      lean: -1.4,
    },
    {
      key: "akashic",
      label: t("Akashic"),
      aria: t("Open the Akashic Library — records of the ancient one"),
      action: openAkashic,
      icon: Scroll,
      color: "var(--gd)",
      height: 121,
      lean: -0.7,
    },
    {
      key: "starplay",
      label: t("Star Play"),
      aria: t("Open Star Play — the Mirror's arcana deck"),
      action: () => openModal({ type: "starplay" }),
      icon: Orbit,
      color: "var(--sp-a)",
      height: 111,
      lean: 1.6,
    },
    {
      key: "invent",
      label: t("Invent"),
      aria: t("Open Invent — the Forge, the invention workshop of the Mirror"),
      action: openInvent,
      icon: DraftingCompass,
      color: "var(--iv-a)",
      height: 104,
      lean: 1.1,
    },
  ];

  return (
    <div
      className="shrink-0 px-3 pb-3 pt-2"
      role="group"
      aria-label={t("The laboratory shelf")}
      data-testid="sidebar-bookshelf"
    >
      <div className="flex items-end justify-center gap-1.5">
        {books.map((book, i) => {
          const Icon = book.icon;
          return (
            <motion.button
              key={book.key}
              type="button"
              onClick={book.action}
              aria-label={book.aria}
              title={book.aria}
              data-testid={`shelf-book-${book.key}`}
              initial={{ opacity: 0, y: 30, rotate: book.lean * 2.2 }}
              animate={{ opacity: 1, y: 0, rotate: book.lean }}
              transition={{
                delay: 0.09 * i,
                type: "spring",
                stiffness: 240,
                damping: 19,
              }}
              whileHover={{
                y: -10,
                rotate: 0,
                transition: { type: "spring", stiffness: 320, damping: 15 },
              }}
              whileTap={{ y: -2, scale: 0.97 }}
              className={cn(
                "book-spine focus-glow group relative flex w-12 cursor-pointer flex-col items-center justify-start gap-1 rounded-[5px] rounded-l-[3px] border pt-2 pb-2.5 transition-shadow duration-300"
              )}
              style={{
                height: book.height,
                "--book": book.color,
              } as CSSProperties}
            >
              {/* the gilt band near the crown of the spine */}
              <span
                aria-hidden="true"
                className="book-band block h-[3px] w-6 shrink-0 rounded-full"
              />
              <Icon
                className="size-3 shrink-0 transition-transform duration-500 group-hover:scale-110"
                aria-hidden="true"
              />
              <span className="book-label mono-label min-h-0 flex-1 text-[9.5px] font-semibold tracking-[0.05em] whitespace-nowrap">
                {book.label}
              </span>
              {/* the page edge — fine lines on the fore-edge */}
              <span
                aria-hidden="true"
                className="book-edge pointer-events-none absolute inset-y-[5px] right-[3px] w-px"
              />
            </motion.button>
          );
        })}
      </div>

      {/* the plank the books stand on */}
      <div
        aria-hidden="true"
        className="shelf-plank relative mt-0 h-[9px] rounded-b-md"
      >
        <span className="shelf-lip absolute inset-x-0 bottom-0 h-[3px] rounded-b-md" />
      </div>
    </div>
  );
}

function SettingsButton() {
  const openModal = useMirror((s) => s.openModal);
  const language = useMirror((s) => s.language);
  const t = useT();
  const langMeta = LANGUAGES.find((l) => l.code === language);

  return (
    <div className="px-4 pt-4">
      <button
        type="button"
        onClick={() => openModal({ type: "settings" })}
        aria-label={t("Open laboratory settings")}
        className="focus-glow group flex h-9 w-full items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 text-left transition-all duration-300 hover:border-[var(--hairline-hover)] hover:glow-sm"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
          <Settings
            className="size-3.5 text-muted-foreground transition-colors duration-300 group-hover:text-[var(--cy)]"
            aria-hidden="true"
          />
        </span>
        <span className="mono-label min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">
          {t("Settings")}
        </span>
        <span className="shrink-0 rounded-md border hairline px-1.5 py-0.5 font-mono text-[10.5px] leading-none text-muted-foreground">
          {langMeta?.native ?? "English"}
        </span>
      </button>
    </div>
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
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium uppercase tracking-[0.09em] text-foreground/75 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {entry.name}
        </span>
        <span className="shrink-0 font-mono text-[12.5px] tabular-nums text-muted-foreground/70">
          {entry.count}
        </span>
      </button>
    </li>
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
      { }
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

/* ------------------------------------------------------------------ */
/*  Inner Earth — one of the 59 peoples beneath the surface.           */
/*  A quiet register row: opening it turns the page — the species'     */
/*  full encyclopedia dossier with its context images.                 */
/* ------------------------------------------------------------------ */

function SpeciesRow({ species }: { species: InnerEarthSpecies }) {
  const openSpecies = useMirror((s) => s.openSpecies);
  const t = useT();

  return (
    <li data-testid="inner-earth-row">
      <button
        type="button"
        onClick={() => openSpecies(species.id)}
        aria-label={t("Open the dossier of {name}", { name: species.name })}
        className="focus-glow group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--gd)_7%,transparent)]"
      >
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_40%,transparent)] bg-[color-mix(in_srgb,var(--gd)_10%,transparent)] font-serif text-[12px] leading-none text-[var(--gd)]"
        >
          {species.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium tracking-[0.02em] text-foreground/85 transition-colors duration-200 group-hover:text-[var(--gd)]">
            {species.name}
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-muted-foreground/70">
            {species.hall}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="mono-label mt-1 shrink-0 text-[9px] text-muted-foreground/50"
        >
          {t("dossier")}
        </span>
        <ChevronRight
          className="mt-1 size-3.5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--gd)]"
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
          { }
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
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground/70 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {name}
        </span>
      </button>
    </li>
  );
}

export function SidebarContent() {
  const sidebarTab = useMirror((s) => s.sidebarTab);
  const setSidebarTab = useMirror((s) => s.setSidebarTab);
  const openRegister = useMirror((s) => s.openRegister);
  const search = useMirror((s) => s.search);
  const setSearch = useMirror((s) => s.setSearch);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const t = useT();

  /* ---------- scroll indicator state for the archive list ---------- */
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
    measure();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => ro.disconnect();
  }, [measure]);

  const onScroll = useCallback(() => measure(), [measure]);

  /* re-measure whenever the archive tab or the query reshapes the list */
  useEffect(() => {
    const id = window.setTimeout(measure, 60);
    return () => window.clearTimeout(id);
  }, [measure, sidebarTab, search]);

  const source =
    sidebarTab === "civilizations"
      ? civilizations
      : sidebarTab === "interdim"
        ? interdimensional
        : null;

  const kind = sidebarTab === "civilizations" ? "civilization" : "interdim";

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
    if (sidebarTab !== "innerearth") return [];
    const q = search.trim().toLowerCase();
    if (!q) return innerEarth;
    return innerEarth.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.hall.toLowerCase().includes(q)
    );
  }, [search, sidebarTab]);

  const entityMatches = useMemo(() => {
    if (!search.trim() || sidebarTab === "innerearth") return [];
    return searchEntities(kind, search, 20);
  }, [search, kind, sidebarTab]);

  const emptyLabel =
    sidebarTab === "civilizations"
      ? t("No matching civilizations found.")
      : sidebarTab === "interdim"
        ? t("No matching interdimensional categories found.")
        : t("No matching inner earth peoples found.");

  const tabs: { id: "civilizations" | "interdim" | "innerearth"; label: string; count: number }[] = [
    { id: "civilizations", label: t("Civilizations"), count: archiveTotals.civilizations },
    { id: "interdim", label: t("Interdim."), count: archiveTotals.interdim },
    { id: "innerearth", label: t("Inner Earth"), count: archiveTotals.innerearth },
  ];

  /* narrow columns: long single words get a soft hyphen at the midpoint
     so they wrap cleanly ("CIVILI-/ZATIONS") instead of hard-breaking */
  const softWrap = (s: string) => {
    if (s.includes(" ") || s.length <= 9) return s;
    const cut = Math.ceil(s.length / 2);
    return `${s.slice(0, cut)}\u00AD${s.slice(cut)}`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Settings */}
      <SettingsButton />

      {/* Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
            <BookOpenText
              className="size-3.5 text-[var(--cy)]"
              aria-hidden="true"
            />
          </span>
          <h2 className="mono-label text-[13.5px] font-semibold text-foreground">
            {t("Galactic Encyclopedia")}
          </h2>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label={t("Close encyclopedia")}
            className="focus-glow ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3.5">
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
            className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent pl-9 pr-8 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
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

      {/* Tabs — three archives: above, between, and beneath */}
      <div
        className="grid grid-cols-[1.25fr_1fr_1fr] gap-1 px-3 pt-3"
        role="tablist"
        aria-label={t("Encyclopedia archives")}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={sidebarTab === tab.id}
            onClick={() => setSidebarTab(tab.id)}
            className={cn(
              "focus-glow rounded-lg border px-1.5 py-1.5 text-center transition-all duration-300",
              sidebarTab === tab.id
                ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] glow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "block text-[10px] font-semibold uppercase leading-tight tracking-[0.02em] break-words",
                sidebarTab === tab.id && "text-foreground"
              )}
            >
              {softWrap(tab.label)}
            </span>
            <span className="block font-mono text-[9.5px] tabular-nums leading-tight opacity-70">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List — with a visible scroll indicator */}
      <div className="relative mt-3 min-h-0 flex-1">
        <ul
          ref={listRef}
          onScroll={onScroll}
          className={cn(
            "nice-scroll archive-scroll h-full space-y-0.5 overflow-y-auto px-3 pb-3",
            scrollState.scrollable && !scrollState.atEnd && "is-scrollable"
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
          {entityMatches.length > 0 && filtered.length > 0 && (
            <li className="px-2.5 pb-1 pt-2">
              <span className="mono-label text-[10.5px] text-muted-foreground/70">
                {t("Families & orders")}
              </span>
            </li>
          )}
          {entityMatches.length >= 20 && (
            <li className="px-2.5 pb-1 pt-2">
              <button
                type="button"
                onClick={() => openRegister(kind)}
                className="focus-glow mono-label text-[11.5px] text-[var(--cy)] transition-opacity hover:opacity-80"
              >
                {t(
                  "Showing first {n} matches — open the full register to search every name →",
                  { n: 20 }
                )}
              </button>
            </li>
          )}

          {/* the 59 peoples beneath the Earth — each opens its page */}
          {sidebarTab === "innerearth" &&
            filteredSpecies.map((s) => <SpeciesRow key={s.id} species={s} />)}

          {sidebarTab !== "innerearth" &&
            filtered.map((entry) => <Row key={entry.id} entry={entry} />)}

          {sidebarTab === "innerearth"
            ? filteredSpecies.length === 0 && (
                <li className="px-2.5 py-3 text-[14px] italic leading-relaxed text-muted-foreground/80">
                  {emptyLabel}
                </li>
              )
            : filtered.length === 0 &&
              entityMatches.length === 0 && (
                <li className="px-2.5 py-3 text-[14px] italic leading-relaxed text-muted-foreground/80">
                  {emptyLabel}
                </li>
              )}
        </ul>

        {/* the scroll indicator — a soft fade and a breathing chevron */}
        {scrollState.scrollable && !scrollState.atEnd && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[color-mix(in_srgb,var(--background)_88%,transparent)] to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-1.5 flex flex-col items-center gap-0.5"
              data-testid="scroll-indicator"
            >
              <span className="mono-label text-[9.5px] tracking-[0.2em] text-muted-foreground/80">
                {t("scroll")}
              </span>
              <ChevronDown className="scroll-hint size-4 text-[var(--cy)]" />
            </div>
          </>
        )}
      </div>

      {/* The laboratory shelf — four books standing side by side:
          Manifest · Akashic · Star Play · Invent */}
      <Bookshelf />
    </div>
  );
}

export default function Sidebar() {
  const t = useT();
  return (
    <aside
      aria-label={t("Galactic Encyclopedia")}
      className="z-20 hidden shrink-0 flex-col border-r hairline bg-[var(--glass-bg-soft)] backdrop-blur-xl md:flex md:w-[240px] lg:w-[295px]"
    >
      <SidebarContent />
    </aside>
  );
}
