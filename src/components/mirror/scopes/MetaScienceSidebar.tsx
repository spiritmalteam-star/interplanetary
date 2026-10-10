"use client";

import { useMemo, useState } from "react";
import { FlaskConical, LayoutGrid, Search, X } from "lucide-react";
import { META_ENTITIES, getMetaEntity } from "@/lib/data/meta-science";
import { useMetaScience } from "@/lib/meta-science-store";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  META SCIENCE · the scope's own sidebar register. The same shelf    */
/*  that holds the Galactic Encyclopedia now lists the twelve mirror   */
/*  entities of the deeper laboratory — same frame, its own spirit.    */
/*  Choosing one TUNES the shared mirror channel to that entity: the   */
/*  chat is the only surface of this scope.                            */
/* ------------------------------------------------------------------ */

export function MetaScienceSidebar() {
  const activeEntity = useMetaScience((s) => s.activeEntity);
  const openEntity = useMetaScience((s) => s.openEntity);
  const closeEntity = useMetaScience((s) => s.closeEntity);
  const setMobileNavOpen = useMirror((s) => s.setMobileNavOpen);
  const t = useT();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return META_ENTITIES;
    return META_ENTITIES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q) ||
        e.tagline.toLowerCase().includes(q)
    );
  }, [query]);

  const choose = (key: string) => {
    const entity = getMetaEntity(key);
    openEntity(key);
    if (entity) {
      /* The register tunes the channel — and offers the entity's OWN
         tone: its motto takes the welcome and its own questions become
         the suggestion field. No draft is preloaded; the cards are the
         invitation. */
      useMirror.getState().tuneChannel(`${entity.name} · ${entity.domain}`);
    }
    setMobileNavOpen(false);
  };

  const untune = () => {
    closeEntity();
    useMirror.getState().tuneChannel(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="ms-sidebar">
      {/* Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,#d946ef_40%,transparent)] bg-[color-mix(in_srgb,#d946ef_10%,transparent)]">
            <FlaskConical
              className="size-3.5 text-[#d946ef]"
              aria-hidden="true"
            />
          </span>
          <h2 className="mono-label text-[13.5px] font-semibold text-foreground">
            {t("Meta Science")}
          </h2>
          <span className="mono-label ml-auto shrink-0 text-[9.5px] text-[#d946ef]/80">
            {t("{n} mirror entities", { n: META_ENTITIES.length })}
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

      {/* All-entities reset — visible while the channel is tuned */}
      {activeEntity && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={untune}
            data-testid="ms-sidebar-all"
            className="focus-glow flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            style={{
              borderColor:
                "color-mix(in srgb, #d946ef 30%, transparent)",
            }}
          >
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            {t("The whole laboratory")}
          </button>
        </div>
      )}

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
            placeholder={t("Search the twelve entities...")}
            aria-label={t("Search the twelve entities")}
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

      {/* The twelve entities */}
      <div className="relative mt-3 min-h-0 flex-1">
        <ul
          className="nice-scroll h-full space-y-0.5 overflow-y-auto px-3 pb-3"
          aria-label={t("Meta Science")}
          data-testid="ms-sidebar-list"
        >
          {filtered.map((entity) => {
            const active = activeEntity === entity.key;
            return (
              <li key={entity.key}>
                <button
                  type="button"
                  onClick={() => choose(entity.key)}
                  data-testid={`ms-sidebar-entity-${entity.key}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "focus-glow group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-200",
                    active
                      ? "bg-[color-mix(in_srgb,#d946ef_12%,transparent)]"
                      : "hover:bg-[color-mix(in_srgb,#d946ef_7%,transparent)]"
                  )}
                  style={
                    active
                      ? {
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${entity.accent} 40%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="relative size-6 shrink-0 overflow-hidden rounded-full border"
                    style={{
                      borderColor: active
                        ? `color-mix(in srgb, ${entity.accent} 55%, transparent)`
                        : "var(--hairline)",
                    }}
                    aria-hidden="true"
                  >
                    <img
                      src={entity.image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13.5px] font-semibold tracking-[0.08em] transition-colors duration-200",
                        active
                          ? "text-foreground"
                          : "text-foreground/75 group-hover:text-foreground"
                      )}
                    >
                      {entity.name}
                    </span>
                    <span className="block truncate text-[11px] leading-snug text-muted-foreground/70">
                      {entity.domain}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[13px] leading-none transition-transform duration-300 group-hover:scale-110"
                    style={{ color: entity.accent }}
                  >
                    {entity.glyph}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-2.5 py-3 text-[14px] italic leading-relaxed text-muted-foreground/80">
              {t("No matching entities found.")}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
