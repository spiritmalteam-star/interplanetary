"use client";

import { useMemo } from "react";
import { BookOpenText, ChevronRight, Gift, Search, X } from "lucide-react";
import {
  civilizations,
} from "@/lib/data/civilizations";
import { interdimensional } from "@/lib/data/interdimensional";
import { giftLines } from "@/lib/data/science";
import { archiveTotals, useMirror } from "@/lib/mirror-store";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CivilizationGroup, InterdimGroup } from "@/lib/mirror-types";

function RefineRealityCard() {
  const handleGift = () => {
    const line = giftLines[Math.floor(Math.random() * giftLines.length)];
    toast({
      title: "✦ A gift from the stars",
      description: line,
      duration: 7000,
    });
  };

  return (
    <div className="p-3">
      <button
        type="button"
        onClick={handleGift}
        aria-label="Refine Reality — receive a gift from the stars"
        className="focus-glow group block w-full rounded-2xl bg-gradient-to-br from-[var(--cy)]/45 via-[#8f6bff]/30 to-[var(--pk)]/45 p-[1px] text-left transition-all duration-300 hover:-translate-y-0.5 hover:glow"
      >
        <span className="flex items-start gap-3 rounded-[15px] bg-[var(--glass-bg-strong)] p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border hairline bg-gradient-to-br from-[var(--cy)]/15 to-[var(--pk)]/15">
            <Gift
              className="size-4 text-[var(--cy)] transition-transform duration-500 group-hover:rotate-12"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            <span className="mono-label block text-[10.5px] font-semibold text-foreground">
              Refine Reality
            </span>
            <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
              A gift from the stars — remember you are the creator
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
        <ChevronRight
          className="size-3 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--cy)]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium uppercase tracking-[0.09em] text-foreground/75 transition-colors duration-200 group-hover:text-[var(--cy)]">
          {entry.name}
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70">
          {entry.count}
        </span>
      </button>
    </li>
  );
}

export function SidebarContent() {
  const sidebarTab = useMirror((s) => s.sidebarTab);
  const setSidebarTab = useMirror((s) => s.setSidebarTab);
  const search = useMirror((s) => s.search);
  const setSearch = useMirror((s) => s.setSearch);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);

  const source =
    sidebarTab === "civilizations"
      ? civilizations
      : interdimensional;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((entry) =>
      entry.name.toLowerCase().includes(q)
    );
  }, [search, source]);

  const emptyLabel =
    sidebarTab === "civilizations"
      ? "No matching civilizations found."
      : "No matching interdimensional categories found.";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border hairline bg-[color-mix(in_srgb,var(--cy)_10%,transparent)]">
            <BookOpenText
              className="size-3.5 text-[var(--cy)]"
              aria-hidden="true"
            />
          </span>
          <h2 className="mono-label text-[11px] font-semibold text-foreground">
            Galactic Encyclopedia
          </h2>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close encyclopedia"
            className="focus-glow ml-auto flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Browse {archiveTotals.civilizations} civilizations and{" "}
          {archiveTotals.interdim} interdimensional beings. Click any to open
          its dossier.
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
            placeholder="Search civilizations, beings, origins..."
            aria-label="Search civilizations, beings, origins"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent pl-9 pr-8 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pt-3" role="tablist" aria-label="Encyclopedia archives">
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === "civilizations"}
          onClick={() => setSidebarTab("civilizations")}
          className={cn(
            "focus-glow rounded-lg border px-2 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            sidebarTab === "civilizations"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Civilizations ({archiveTotals.civilizations})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === "interdim"}
          onClick={() => setSidebarTab("interdim")}
          className={cn(
            "focus-glow rounded-lg border px-2 py-1.5 text-[9.5px] font-medium uppercase tracking-[0.12em] transition-all duration-300",
            sidebarTab === "interdim"
              ? "border-[var(--hairline-active)] bg-[color-mix(in_srgb,var(--cy)_12%,transparent)] text-foreground glow-sm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Interdim. ({archiveTotals.interdim})
        </button>
      </div>

      {/* List */}
      <ul
        className="nice-scroll mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"
        aria-live="polite"
      >
        {filtered.map((entry) => (
          <Row key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <li className="px-2.5 py-3 text-[11px] italic leading-relaxed text-muted-foreground/80">
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
  return (
    <aside
      aria-label="Galactic Encyclopedia"
      className="z-20 hidden shrink-0 flex-col border-r hairline bg-[var(--glass-bg-soft)] backdrop-blur-xl md:flex md:w-[240px] lg:w-[295px]"
    >
      <SidebarContent />
    </aside>
  );
}
