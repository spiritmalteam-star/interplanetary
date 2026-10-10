"use client";

import { useMemo, useState } from "react";
import { Activity, LayoutGrid, Search, X } from "lucide-react";
import {
  LAB_CATEGORIES,
  getLabCategory,
  type LabCategoryId,
} from "@/lib/data/heal-evolution";
import { useHealScope } from "@/lib/heal-scope-store";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "../heal/category-icons";

/* ------------------------------------------------------------------ */
/*  HEAL EVOLUTION · the scope's own sidebar register. The same shelf  */
/*  that holds the Galactic Encyclopedia now lists the twelve healing  */
/*  disciplines — same frame, its own emerald light. Choosing one      */
/*  TUNES the shared mirror channel to that discipline: the chat is    */
/*  the only surface of this scope.                                    */
/* ------------------------------------------------------------------ */

export function HealEvolutionSidebar() {
  const activeCategoryId = useHealScope((s) => s.activeCategoryId);
  const openCategory = useHealScope((s) => s.openCategory);
  const closeCategory = useHealScope((s) => s.closeCategory);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const t = useT();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LAB_CATEGORIES;
    return LAB_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [query]);

  const choose = (id: LabCategoryId) => {
    const category = getLabCategory(id);
    openCategory(id);
    if (category) {
      /* The register tunes the channel — and offers the discipline's
         OWN tone: its field line takes the welcome and its own mirror
         prompts become the suggestion field. No draft is preloaded;
         the cards are the invitation. */
      useMirror.getState().tuneChannel(category.name);
    }
    setMobileNavOpen(false);
  };

  const untune = () => {
    closeCategory();
    useMirror.getState().tuneChannel(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="he-sidebar">
      {/* Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,#34d399_40%,transparent)] bg-[color-mix(in_srgb,#34d399_10%,transparent)]">
            <Activity className="size-3.5 text-[#34d399]" aria-hidden="true" />
          </span>
          <h2 className="mono-label text-[13.5px] font-semibold text-foreground">
            {t("Heal Evolution")}
          </h2>
          <span className="mono-label ml-auto shrink-0 text-[9.5px] text-[#34d399]/80">
            {t("{n} disciplines", { n: LAB_CATEGORIES.length })}
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search the disciplines...")}
            aria-label={t("Search the disciplines")}
            className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent pl-9 pr-8 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("Clear search")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* All-disciplines reset — visible while the channel is tuned */}
      {activeCategoryId && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={untune}
            data-testid="he-sidebar-all"
            className="focus-glow flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            style={{
              borderColor:
                "color-mix(in srgb, #34d399 30%, transparent)",
            }}
          >
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            {t("All Disciplines")}
          </button>
        </div>
      )}

      {/* The twelve disciplines */}
      <div className="relative mt-3 min-h-0 flex-1">
        <ul
          className="nice-scroll h-full space-y-0.5 overflow-y-auto px-3 pb-3"
          aria-label={t("Heal Evolution")}
          data-testid="he-sidebar-list"
        >
          {filtered.map((category) => {
            const Icon = CATEGORY_ICONS[category.icon];
            const active = activeCategoryId === category.id;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => choose(category.id)}
                  data-testid={`he-sidebar-category-${category.id}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "focus-glow group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-200",
                    active
                      ? "bg-[color-mix(in_srgb,#34d399_10%,transparent)]"
                      : "hover:bg-[color-mix(in_srgb,#34d399_6%,transparent)]"
                  )}
                  style={
                    active
                      ? {
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${category.color} 45%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md border"
                    style={{
                      borderColor: `color-mix(in srgb, ${category.color} 35%, transparent)`,
                      background: `color-mix(in srgb, ${category.color} 12%, transparent)`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon
                      className="size-3"
                      style={{ color: category.color }}
                    />
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13.5px] transition-colors duration-200",
                      active
                        ? "font-semibold text-foreground"
                        : "text-foreground/75 group-hover:text-foreground"
                    )}
                  >
                    {t(category.name)}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/60">
                    {category.tools.length}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-2.5 py-3 text-[14px] italic leading-relaxed text-muted-foreground/80">
              {t("No matching disciplines found.")}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
