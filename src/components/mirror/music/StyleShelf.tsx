"use client";

/* ------------------------------------------------------------------ */
/*  THE STYLE SHELF — a thousand styles of light, searchable.           */
/*                                                                      */
/*  AUTO sits at the top (the engine listens to the song and chooses).  */
/*  Below, the ten families open into their hundred variations; every   */
/*  chip carries the palette of the style it will paint.                */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { Search, Wand2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  VIZ_FAMILIES,
  VIZ_PRESET_COUNT,
  allPresets,
  type VizPreset,
} from "@/lib/audio/visualization-engine";
import { useVizStore } from "./viz-store";

function paletteSwatch(p: VizPreset): string {
  return `linear-gradient(135deg, ${p.palette[0]} 0%, ${p.palette[1]} 55%, ${p.palette[2]} 100%)`;
}

export default function StyleShelf({
  currentId,
  onClose,
}: {
  currentId: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const auto = useVizStore((s) => s.auto);
  const setAuto = useVizStore((s) => s.setAuto);
  const pinPreset = useVizStore((s) => s.pinPreset);
  const [query, setQuery] = useState("");
  const [openFamily, setOpenFamily] = useState<string | null>(VIZ_FAMILIES[0]?.id ?? null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = allPresets();
    if (!q) return null;
    return all
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.familyName.toLowerCase().includes(q) ||
          p.match.energyBias.includes(q)
      )
      .slice(0, 60);
  }, [query]);

  return (
    <div
      className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3"
      data-testid="viz-style-shelf"
    >
      {/* the head — search + the AUTO choice */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search a thousand styles")}
            data-testid="viz-style-search"
            className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] pl-8 pr-2 text-[12.5px] text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <span className="mono-label shrink-0 text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
          {VIZ_PRESET_COUNT.toLocaleString("en-US")} {t("styles")}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setAuto();
          onClose();
        }}
        aria-pressed={auto}
        data-testid="viz-style-auto"
        className={cn(
          "focus-glow mt-2.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all duration-300",
          auto
            ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
            : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] hover:border-[var(--hairline-hover)]"
        )}
      >
        <Wand2
          className={cn("size-4 shrink-0", auto ? "text-[var(--scope-a)]" : "text-muted-foreground")}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[13px] font-semibold", auto ? "text-[var(--scope-a)]" : "text-foreground/85")}>
            {t("Auto — the field listens")}
          </span>
          <span className="block text-[11.5px] leading-snug text-muted-foreground">
            {t("The style follows the song: calm stays soft, rhythm blooms, and a new style fades in every minute or so.")}
          </span>
        </span>
        {auto && (
          <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.18em] text-[var(--scope-a)]">
            {t("On")}
          </span>
        )}
      </button>

      {/* the search results — or the families */}
      {matches ? (
        <div className="nice-scroll mt-2 max-h-56 overflow-y-auto pr-1">
          {matches.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-muted-foreground">
              {t("No style answers to that name.")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {matches.map((p) => (
                <StyleChip key={p.id} preset={p} active={p.id === currentId} onPick={pinPreset} onDone={onClose} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="nice-scroll mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
          {VIZ_FAMILIES.map((family) => {
            const open = openFamily === family.id;
            return (
              <div key={family.id}>
                <button
                  type="button"
                  onClick={() => setOpenFamily(open ? null : family.id)}
                  aria-expanded={open}
                  className="focus-glow flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--scope-a)_6%,transparent)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-medium text-foreground/85">{t(family.name)}</span>
                    <span className="block truncate text-[10.5px] text-muted-foreground/80">{t(family.hint)}</span>
                  </span>
                  <span className="mono-label shrink-0 text-[8px] uppercase tracking-[0.14em] text-muted-foreground/60">
                    105
                  </span>
                </button>
                {open && (
                  <div className="grid grid-cols-2 gap-1.5 pb-1.5 sm:grid-cols-3">
                    {allPresets()
                      .filter((p) => p.family === family.id)
                      .map((p) => (
                        <StyleChip key={p.id} preset={p} active={p.id === currentId} onPick={pinPreset} onDone={onClose} />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StyleChip({
  preset,
  active,
  onPick,
  onDone,
}: {
  preset: VizPreset;
  active: boolean;
  onPick: (id: string) => void;
  onDone: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        onPick(preset.id);
        onDone();
      }}
      aria-pressed={active}
      title={`${preset.name} — ${t(preset.familyName)}`}
      data-testid={`viz-style-${preset.id}`}
      className={cn(
        "focus-glow flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
          : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] hover:border-[var(--hairline-hover)]"
      )}
    >
      <span
        className="size-5 shrink-0 rounded-md border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
        style={{ background: paletteSwatch(preset) }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-medium text-foreground/85">{t(preset.name)}</span>
        <span className="mono-label block text-[7.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
          {t(preset.match.energyBias)}
        </span>
      </span>
    </button>
  );
}
