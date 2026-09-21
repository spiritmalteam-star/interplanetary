"use client";

import { useMemo } from "react";
import {
  BookOpenText,
  FlaskConical,
  Layers,
  Search,
  Settings,
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

function RefineRealityCard() {
  const openLab = useMirror((s) => s.openLab);
  const t = useT();

  return (
    <div className="p-3">
      <button
        type="button"
        onClick={openLab}
        aria-label={t("Open the Reality Manifesting Laboratory")}
        className="focus-glow group block w-full rounded-2xl bg-gradient-to-br from-[var(--gd)]/50 via-[#8f6bff]/25 to-[var(--pk)]/45 p-[1px] text-left transition-all duration-300 hover:-translate-y-0.5 hover:glow"
      >
        <span className="flex items-start gap-3 rounded-[15px] bg-[var(--glass-bg-strong)] p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline bg-gradient-to-br from-[var(--gd)]/20 to-[var(--pk)]/15">
            <FlaskConical
              className="size-4 text-[var(--gd)] transition-transform duration-500 group-hover:rotate-12"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            <span className="mono-label block text-[11.5px] font-semibold text-foreground">
              {t("Refine Reality")}
            </span>
            <span className="mt-1.5 block text-[12px] leading-relaxed text-muted-foreground">
              {t(
                "Enter the Reality Manifesting Laboratory — refine an intention into a sealed blueprint"
              )}
            </span>
          </span>
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

function FullRegisterButton() {
  const openRegister = useMirror((s) => s.openRegister);
  const sidebarTab = useMirror((s) => s.sidebarTab);
  const t = useT();
  const kind = sidebarTab === "civilizations" ? "civilization" : "interdim";
  const isCiv = sidebarTab === "civilizations";

  return (
    <div className="px-3 pt-2">
      <button
        type="button"
        onClick={() => openRegister(kind)}
        className="focus-glow group flex w-full items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-px hover:border-[var(--hairline-hover)] hover:glow-sm"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
          <Layers
            className="size-3.5 text-[var(--cy)] transition-transform duration-500 group-hover:scale-110"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mono-label block text-[10.5px] font-semibold text-foreground">
            {t("Open the full register")}
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            {t(
              isCiv
                ? "Reveal all {n} named representatives — exact count, searchable, every profile in depth"
                : "Reveal all {n} named presences — exact count, searchable, every profile in depth",
              { n: isCiv ? archiveTotals.civilizations : archiveTotals.interdim }
            )}
          </span>
        </span>
      </button>
    </div>
  );
}

export function SidebarContent() {
  const sidebarTab = useMirror((s) => s.sidebarTab);
  const setSidebarTab = useMirror((s) => s.setSidebarTab);
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
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {t(
            "Browse {civ} civilizations and {int} interdimensional beings — every single one carries a name, a portrait and a full deep dossier. Exact numbers, nothing summarized.",
            { civ: archiveTotals.civilizations, int: archiveTotals.interdim }
          )}
        </p>
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

      {/* Full register entry */}
      <FullRegisterButton />

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

      {/* Bottom card */}
      <div className="shrink-0 border-t hairline">
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
