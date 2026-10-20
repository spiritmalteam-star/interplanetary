"use client";

/* ------------------------------------------------------------------ */
/*  THE STUDIO — the professional controls of the chamber: the genre   */
/*  shelf, tempo and key, moods, voice, structure, texture and the     */
/*  two honest dials. Kept in the visitor's own browser; everything    */
/*  here speaks verbatim into the engine's contract.                   */
/* ------------------------------------------------------------------ */

import { Music2, X } from "lucide-react";
import { LC_STUDIO, type LcStudio } from "@/lib/data/light-codes";
import GenreSelector from "./GenreSelector";
import { cn } from "@/lib/utils";

interface Props {
  studio: LcStudio;
  onChange: (patch: Partial<LcStudio>) => void;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </span>
  );
}

const selectClass =
  "focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12px] text-foreground";

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        "focus-glow rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
          : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function StudioControls({ studio, onChange }: Props) {
  const toggleMood = (mood: string) => {
    const moods = studio.moods ?? [];
    const next = moods.includes(mood)
      ? moods.filter((m) => m !== mood)
      : moods.length < 3
        ? [...moods, mood]
        : moods;
    onChange({ moods: next });
  };

  const toggleStructure = (section: string) => {
    const structure = studio.structure ?? [];
    const next = structure.includes(section)
      ? structure.filter((s) => s !== section)
      : structure.length < 6
        ? [...structure, section]
        : structure;
    onChange({ structure: next });
  };

  return (
    <div className="space-y-3" data-testid="lc-studio">
      {/* the musical style — the searchable genre shelf */}
      <div>
        <FieldLabel>Musical style — up to four voices, fused</FieldLabel>
        <GenreSelector
          selected={studio.genres ?? []}
          onChange={(ids) => onChange({ genres: ids })}
          testId="lc-genre-selector"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* tempo — auto or exact */}
        <div className="col-span-2">
          <FieldLabel>Tempo {studio.bpm ? `· ${studio.bpm} BPM` : "· auto"}</FieldLabel>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ bpm: studio.bpm ? null : 100 })}
              aria-pressed={studio.bpm === null}
              className={cn(
                "focus-glow h-8 shrink-0 rounded-lg border px-2.5 text-[11.5px] transition-all",
                studio.bpm === null
                  ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                  : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
              )}
            >
              Auto
            </button>
            <input
              type="range"
              min={60}
              max={180}
              step={1}
              value={studio.bpm ?? 100}
              disabled={studio.bpm === null}
              onChange={(e) => onChange({ bpm: Number(e.target.value) })}
              aria-label="Tempo in BPM"
              className="h-1.5 w-full accent-[var(--scope-a)] disabled:opacity-40"
            />
          </div>
        </div>

        <label className="block">
          <FieldLabel>Key</FieldLabel>
          <select
            value={studio.key}
            onChange={(e) => onChange({ key: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Voice</FieldLabel>
          <select
            value={studio.vocalMode}
            onChange={(e) => onChange({ vocalMode: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.vocalModes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Vocal language</FieldLabel>
          <select
            value={studio.vocalLanguage}
            onChange={(e) => onChange({ vocalLanguage: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Length</FieldLabel>
          <select
            value={studio.duration}
            onChange={(e) => onChange({ duration: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.durations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Texture</FieldLabel>
          <select
            value={studio.texture}
            onChange={(e) => onChange({ texture: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.textures.map((tx) => (
              <option key={tx} value={tx}>{tx}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Lyrics</FieldLabel>
          <select
            value={studio.lyricsMode}
            onChange={(e) => onChange({ lyricsMode: e.target.value })}
            className={selectClass}
          >
            {LC_STUDIO.lyricsModes.map((lm) => (
              <option key={lm} value={lm}>{lm}</option>
            ))}
          </select>
        </label>
      </div>

      {/* moods — at most three */}
      <div>
        <FieldLabel>Moods · up to three</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {LC_STUDIO.moods.map((m) => (
            <Chip key={m} active={(studio.moods ?? []).includes(m)} onClick={() => toggleMood(m)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>

      {/* structure — an ordered walk, at most six sections */}
      <div>
        <FieldLabel>
          Structure {studio.structure && studio.structure.length > 0 ? `· ${studio.structure.join(" → ")}` : "· free"}
        </FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {LC_STUDIO.structures.map((s) => (
            <Chip key={s} active={(studio.structure ?? []).includes(s)} onClick={() => toggleStructure(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Instruments — the room's own hands</FieldLabel>
          <input
            type="text"
            value={studio.instruments}
            onChange={(e) => onChange({ instruments: e.target.value })}
            placeholder="e.g. felt piano, cello, soft brushes…"
            maxLength={200}
            className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12px] text-foreground placeholder:text-muted-foreground/60"
          />
        </label>
        <label className="block">
          <FieldLabel>Excluded — what must never sound</FieldLabel>
          <input
            type="text"
            value={studio.exclusions}
            onChange={(e) => onChange({ exclusions: e.target.value })}
            placeholder="e.g. no drums, no synth lead…"
            maxLength={200}
            className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12px] text-foreground placeholder:text-muted-foreground/60"
          />
        </label>
      </div>

      {/* the two honest dials */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div>
          <FieldLabel>
            Acoustic balance · {typeof studio.acousticBalance === "number" ? studio.acousticBalance : 50}
          </FieldLabel>
          <input
            type="range"
            min={0}
            max={100}
            value={typeof studio.acousticBalance === "number" ? studio.acousticBalance : 50}
            onChange={(e) => onChange({ acousticBalance: Number(e.target.value) })}
            aria-label="Acoustic balance — electronic to acoustic"
            className="h-1.5 w-full accent-[var(--scope-a)]"
          />
          <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/60">
            <span>Electronic</span>
            <span>Acoustic</span>
          </div>
        </div>
        <div>
          <FieldLabel>
            Experimentation · {typeof studio.experimental === "number" ? studio.experimental : 30}
          </FieldLabel>
          <input
            type="range"
            min={0}
            max={100}
            value={typeof studio.experimental === "number" ? studio.experimental : 30}
            onChange={(e) => onChange({ experimental: Number(e.target.value) })}
            aria-label="How experimental the weave may be"
            className="h-1.5 w-full accent-[var(--scope-a)]"
          />
          <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/60">
            <span>Faithful</span>
            <span>Boundless</span>
          </div>
        </div>
      </div>

      {(studio.genres ?? []).length > 0 ? (
        <p className="mono-label flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
          <Music2 className="size-3" aria-hidden="true" />
          {(studio.genres ?? []).length} genre voices riding this chamber
          <button
            type="button"
            onClick={() => onChange({ genres: [] })}
            aria-label="Clear the chosen genres"
            className="focus-glow text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </p>
      ) : null}
    </div>
  );
}
