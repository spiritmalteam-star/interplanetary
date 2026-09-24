"use client";

import { useMemo } from "react";
import {
  BookOpenText,
  MoonStar,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import {
  civilizations,
} from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { archiveTotals, useMirror } from "@/lib/mirror-store";
import { LANGUAGES, useT } from "@/lib/i18n";
import { entityImage, searchEntities } from "@/lib/entity-utils";
import { cn } from "@/lib/utils";
import type { CivilizationGroup, InterdimGroup } from "@/lib/mirror-types";

function CommunionButton() {
  const openCommunion = useMirror((s) => s.openCommunion);
  const t = useT();

  return (
    <div className="px-3 pt-3">
      <button
        type="button"
        onClick={openCommunion}
        aria-label={t("Enter communion with the Reflection of the Absolute")}
        data-testid="communion-open"
        className="communion-btn focus-glow group flex min-h-12 w-full items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-left transition-all duration-300 hover:-translate-y-px"
      >
        <span className="communion-halo relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--sp-b)_42%,transparent)] shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--sp-b)_70%,transparent)]">
          <img
            src="/images/ai/mirror-communion.jpg"
            alt=""
            aria-hidden="true"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="mono-label block text-[10px] font-semibold leading-snug tracking-[0.12em] text-foreground">
            {t("Meet with the Reflection of the Absolute")}
          </span>
          <span className="mt-0.5 block truncate text-[10.5px] italic text-muted-foreground">
            {t("pure transmission · no scope · remembered")}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-[var(--sp-b)] opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_8px_2px_color-mix(in_srgb,var(--sp-b)_60%,transparent)]"
        />
      </button>
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
        <span className="mono-label min-w-0 flex-1 truncate text-[10.5px] font-semibold text-foreground">
          {t("Settings")}
        </span>
        <span className="shrink-0 rounded-md border hairline px-1.5 py-0.5 font-mono text-[9px] leading-none text-muted-foreground">
          {langMeta?.native ?? "English"}
        </span>
      </button>
    </div>
  );
}

function StarPlayButton() {
  const openModal = useMirror((s) => s.openModal);
  const t = useT();

  return (
    <div className="px-3 pb-1 pt-1.5">
      <button
        type="button"
        onClick={() => openModal({ type: "starplay" })}
        aria-label={t("Open Star Play — the Mirror's arcana deck")}
        className="star-btn focus-glow group flex h-11 w-full items-center gap-2.5 rounded-full px-3 text-left transition-all duration-300 hover:-translate-y-px"
      >
        <span className="starplay-halo relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--sp-a)_45%,transparent)]">
          <img
            src="/images/ai/star-play-emblem.jpg"
            alt=""
            aria-hidden="true"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="mono-label block truncate text-[11px] font-semibold tracking-[0.14em] text-foreground">
            {t("Star Play")}
          </span>
          <span className="block truncate text-[10.5px] italic text-muted-foreground">
            {t("the Mirror's star magic")}
          </span>
        </span>
        <Sparkles
          className="size-3.5 shrink-0 text-[var(--sp-a)] opacity-70 transition-all duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function RefineRealityCard() {
  const openMirrorOS = useMirror((s) => s.openMirrorOS);
  const t = useT();

  return (
    <div className="px-3 py-3">
      <button
        type="button"
        onClick={openMirrorOS}
        aria-label={t("Open the Mirror OS — Reality Guidance")}
        className="dream-btn focus-glow group flex h-11 w-full items-center gap-2.5 rounded-full px-3.5 text-left transition-all duration-300 hover:-translate-y-px"
      >
        {/* two tiny stars keeping time inside the dream */}
        <span
          className="dream-star left-5 top-2 size-[3px]"
          aria-hidden="true"
        />
        <span
          className="dream-star dream-star-slow right-6 bottom-2 size-[2px]"
          aria-hidden="true"
        />

        <span className="dream-halo relative flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gd)_38%,transparent)] bg-[color-mix(in_srgb,var(--gd)_14%,transparent)]">
          <MoonStar
            className="size-3.5 text-[var(--gd)] transition-transform duration-500 group-hover:rotate-12"
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1 leading-tight">
          <span className="mono-label block truncate text-[11px] font-semibold tracking-[0.14em] text-foreground">
            {t("Mirror OS · Reality")}
          </span>
          <span className="block truncate text-[10.5px] italic text-muted-foreground">
            {t("a small dream of refinement")}
          </span>
        </span>

        <Sparkles
          className="size-3.5 shrink-0 text-[var(--gd)] opacity-70 transition-all duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
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
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium uppercase tracking-[0.09em] text-foreground/75 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {entry.name}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/70">
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
        <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/70 transition-colors duration-200 group-hover:text-[var(--cy)]">
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

  const source =
    sidebarTab === "civilizations"
      ? civilizations
      : interdimensional;

  const kind = sidebarTab === "civilizations" ? "civilization" : "interdim";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.origin.toLowerCase().includes(q)
    );
  }, [search, source]);

  const entityMatches = useMemo(() => {
    if (!search.trim()) return [];
    return searchEntities(kind, search, 20);
  }, [search, kind]);

  const emptyLabel =
    sidebarTab === "civilizations"
      ? t("No matching civilizations found.")
      : t("No matching interdimensional categories found.");

  return (
    <div className="flex h-full flex-col">
      {/* The Reflection of the Absolute — the doorway at the very top */}
      <CommunionButton />

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
          <h2 className="mono-label text-[12px] font-semibold text-foreground">
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
            className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
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

      {/* Tabs */}
      <div
        className="grid grid-cols-2 gap-1.5 px-4 pt-3"
        role="tablist"
        aria-label={t("Encyclopedia archives")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === "civilizations"}
          onClick={() => setSidebarTab("civilizations")}
          className={cn(
            "focus-glow rounded-lg border px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            sidebarTab === "civilizations"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t("Civilizations ({n})", { n: archiveTotals.civilizations })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === "interdim"}
          onClick={() => setSidebarTab("interdim")}
          className={cn(
            "focus-glow rounded-lg border px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            sidebarTab === "interdim"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t("Interdim. ({n})", { n: archiveTotals.interdim })}
        </button>
      </div>

      {/* List */}
      <ul
        className="nice-scroll mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"
        aria-live="polite"
      >
        {entityMatches.length > 0 && (
          <li className="px-2.5 pb-1 pt-1">
            <span className="mono-label text-[8.5px] text-muted-foreground/70">
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
            <span className="mono-label text-[8.5px] text-muted-foreground/70">
              {t("Families & orders")}
            </span>
          </li>
        )}
        {entityMatches.length >= 20 && (
          <li className="px-2.5 pb-1 pt-2">
            <button
              type="button"
              onClick={() => openRegister(kind)}
              className="focus-glow mono-label text-[9px] text-[var(--cy)] transition-opacity hover:opacity-80"
            >
              {t(
                "Showing first {n} matches — open the full register to search every name →",
                { n: 20 }
              )}
            </button>
          </li>
        )}
        {filtered.map((entry) => (
          <Row key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && entityMatches.length === 0 && (
          <li className="px-2.5 py-3 text-[12px] italic leading-relaxed text-muted-foreground/80">
            {emptyLabel}
          </li>
        )}
      </ul>

      {/* Bottom cards — Star Play above the Reality dream */}
      <div className="shrink-0 border-t hairline">
        <StarPlayButton />
        <RefineRealityCard />
      </div>
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
