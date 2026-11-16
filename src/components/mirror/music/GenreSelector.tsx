"use client";

/* ------------------------------------------------------------------ */
/*  MUSICAL STYLE — the searchable genre selector of the studio.       */
/*                                                                     */
/*  Ten families, one hundred voices. Search, multi-select, fusion.    */
/*  The selected genres are displayed prominently; the full taxonomy   */
/*  rests inside the dropdown — mobile screens stay uncluttered.       */
/*  Built on the house's own popover: no new dependencies.             */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { ChevronsUpDown, Music2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  MUSIC_GENRE_FAMILIES,
  MUSIC_GENRE_LIMIT,
  genreById,
  genreName,
} from "@/lib/data/music-genres";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  testId?: string;
}

export default function GenreSelector({ selected, onChange, testId }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id));
    } else if (selected.length < MUSIC_GENRE_LIMIT) {
      onChange([...selected, id]);
    }
  };

  const summary = useMemo(() => {
    if (selected.length === 0) return null;
    return selected.map((id) => genreName(id)).join(" + ");
  }, [selected]);

  const q = query.trim().toLowerCase();
  const families = useMemo(() => {
    if (!q) return MUSIC_GENRE_FAMILIES;
    return MUSIC_GENRE_FAMILIES.map((family) => ({
      ...family,
      genres: family.genres.filter(
        (g) => g.name.toLowerCase().includes(q) || family.name.toLowerCase().includes(q)
      ),
    })).filter((family) => family.genres.length > 0);
  }, [q]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              data-testid={testId}
              className={cn(
                "focus-glow flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-all duration-300",
                selected.length > 0
                  ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] text-[var(--scope-a)]"
                  : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] bg-[var(--glass-bg-soft)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
              )}
            >
              <Music2 className="size-3.5" aria-hidden="true" />
              <span className="max-w-[240px] truncate">
                {summary ? summary : t("Musical Style — choose a genre")}
              </span>
              <ChevronsUpDown className="size-3 opacity-60" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(92vw,420px)] overflow-hidden p-0"
            align="start"
            sideOffset={6}
          >
            <div data-testid="genre-picker">
              {/* the search line */}
              <div className="border-b hairline">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search genres — techno, bachata, K-pop…")}
                  data-testid="genre-search"
                  aria-label={t("Search genres")}
                  className="focus-glow h-10 w-full bg-transparent px-3.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              {/* the taxonomy — families and their voices */}
              <div className="nice-scroll max-h-[300px] overflow-y-auto" role="listbox" aria-label={t("Musical Style")}>
                {families.length === 0 && (
                  <p className="px-3.5 py-4 text-[12.5px] text-muted-foreground">
                    {t("No genre by that name — describe it in your words instead.")}
                  </p>
                )}
                {families.map((family) => (
                  <div key={family.id} className="px-1.5 py-1.5">
                    <p className="mono-label px-2 pb-1 pt-1.5 text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
                      {t(family.name)}
                    </p>
                    {family.genres.map((genre) => {
                      const active = selected.includes(genre.id);
                      const full = selected.length >= MUSIC_GENRE_LIMIT && !active;
                      return (
                        <button
                          key={genre.id}
                          type="button"
                          role="option"
                          aria-selected={active}
                          disabled={full}
                          onClick={() => toggle(genre.id)}
                          className="focus-glow flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground/90 transition-colors hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)] disabled:opacity-40"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border text-[8px]",
                              active
                                ? "border-transparent bg-[var(--scope-a)] text-white"
                                : "border-[var(--hairline)]"
                            )}
                          >
                            {active ? "✓" : ""}
                          </span>
                          {t(genre.name)}
                          <span className="ml-auto text-[10px] text-muted-foreground/50">
                            {full ? t("fusion full") : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* the chosen fusion — prominent, removable */}
        {selected.map((id) => {
          const hit = genreById(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-label={`${t("Remove")} ${hit?.genre.name ?? id}`}
              data-testid={`genre-chip-${id}`}
              className="focus-glow group flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)] px-3 text-[12.5px] text-[var(--scope-a)] transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_14%,transparent)]"
            >
              <span className="max-w-[130px] truncate">{t(hit?.genre.name ?? id)}</span>
              <X className="size-3 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
