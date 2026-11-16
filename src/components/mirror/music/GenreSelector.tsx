"use client";

/* ------------------------------------------------------------------ */
/*  MUSICAL STYLE — the searchable genre selector of the studio.       */
/*                                                                     */
/*  Ten families, one hundred voices. Search, multi-select, fusion.    */
/*  The selected genres are displayed prominently; the full taxonomy   */
/*  rests inside the dropdown — mobile screens stay uncluttered.       */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { ChevronsUpDown, Music2, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
            className="w-[min(92vw,420px)] p-0"
            align="start"
            sideOffset={6}
          >
            <Command>
              <CommandInput
                placeholder={t("Search genres — techno, bachata, K-pop…")}
                data-testid="genre-search"
              />
              <CommandList className="nice-scroll max-h-[300px]">
                <CommandEmpty>{t("No genre by that name — describe it in your words instead.")}</CommandEmpty>
                {MUSIC_GENRE_FAMILIES.map((family) => (
                  <CommandGroup
                    key={family.id}
                    heading={t(family.name)}
                    className="[&_[cmdk-group-heading]]:mono-label [&_[cmdk-group-heading]]:text-[8.5px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-muted-foreground/70"
                  >
                    {family.genres.map((genre) => {
                      const active = selected.includes(genre.id);
                      return (
                        <CommandItem
                          key={genre.id}
                          value={`${genre.name} ${family.name}`}
                          onSelect={() => toggle(genre.id)}
                          className="cursor-pointer"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mr-2 flex size-4 items-center justify-center rounded-full border text-[8px]",
                              active
                                ? "border-transparent bg-[var(--scope-a)] text-white"
                                : "border-[var(--hairline)]"
                            )}
                          >
                            {active ? "✓" : ""}
                          </span>
                          {t(genre.name)}
                          <span className="ml-auto text-[10px] text-muted-foreground/50">
                            {selected.length >= MUSIC_GENRE_LIMIT && !active
                              ? t("fusion full")
                              : ""}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
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
