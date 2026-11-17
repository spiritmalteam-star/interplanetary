"use client";

/* ------------------------------------------------------------------ */
/*  MUSIC ENGINE 2.0 — THE STUDIO CONTROLS.                            */
/*                                                                     */
/*  The advanced creative panel: BPM, key, moods, energy, vocal mode   */
/*  and language, duration, structure, instruments, production         */
/*  texture, acoustic/electronic balance, experimental intensity,      */
/*  explicit exclusions and lyrics authorship.                         */
/*                                                                     */
/*  THE NARROWING LAW — these controls NARROW the visitor's stated     */
/*  intention; they never replace it. Every control rests at "Auto"    */
/*  unless the visitor's own hand moves it.                            */
/* ------------------------------------------------------------------ */

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LcStudio } from "@/lib/data/light-codes";

const KEYS = [
  "Auto", "C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab",
  "Am", "Em", "Dm", "Bm", "F#m", "Gm", "Cm", "Fm",
] as const;

const MOODS = [
  "Uplifted", "Melancholic", "Romantic", "Dark", "Dreamy", "Aggressive",
  "Nostalgic", "Playful", "Serene", "Hypnotic", "Epic", "Intimate",
] as const;

const VOCAL_MODES = [
  "Auto", "Instrumental", "Male", "Female", "Duet", "Choir", "Synthetic",
] as const;

const VOCAL_LANGUAGES = [
  "Auto", "English", "Albanian", "Spanish", "Italian", "French", "German",
  "Portuguese", "Turkish", "Greek", "Arabic", "Hindi", "Russian", "Chinese",
] as const;

const DURATIONS = [
  "Auto", "30 seconds", "60 seconds", "90 seconds", "2 minutes",
  "3 minutes", "4 minutes", "5 minutes",
] as const;

const SECTIONS = [
  "Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Drop", "Break", "Outro",
] as const;

const TEXTURES = [
  "Auto", "Warm analog", "Clean digital", "Lo-fi tape", "Crisp studio",
  "Raw live", "Polished radio",
] as const;

const LYRICS_MODES = ["Auto", "Mirror writes", "I write", "Instrumental"] as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <label className="block">
      <span className="mono-label mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {t(label)}
      </span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}) {
  const t = useT();
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[13px] text-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {t(o)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "focus-glow rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_60%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_14%,transparent)] text-[var(--scope-a)]"
          : "border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      {t(typeof children === "string" ? children : "")}
    </button>
  );
}

export default function StudioControls({
  studio,
  onChange,
}: {
  studio: LcStudio;
  onChange: (patch: Partial<LcStudio>) => void;
}) {
  const t = useT();

  const toggleMood = (m: string) =>
    onChange({
      moods: studio.moods.includes(m)
        ? studio.moods.filter((x) => x !== m)
        : [...studio.moods, m].slice(0, 4),
    });

  const toggleSection = (s: string) =>
    onChange({
      structure: studio.structure.includes(s)
        ? studio.structure.filter((x) => x !== s)
        : [...studio.structure, s].slice(0, 8),
    });

  return (
    <div className="space-y-3">
      {/* ------- tempo & key ------- */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mono-label mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Tempo (BPM)")}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-pressed={studio.bpm === null}
              onClick={() => onChange({ bpm: null })}
              data-testid="studio-bpm-auto"
              className={cn(
                "focus-glow h-8 shrink-0 rounded-lg border px-2.5 text-[12px] transition-colors duration-300",
                studio.bpm === null
                  ? "border-[color-mix(in_srgb,var(--scope-a)_60%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_14%,transparent)] text-[var(--scope-a)]"
                  : "border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] text-muted-foreground hover:text-foreground"
              )}
            >
              {t("Auto")}
            </button>
            <input
              type="number"
              min={40}
              max={220}
              value={studio.bpm ?? ""}
              placeholder={t("Auto")}
              onChange={(e) => {
                const v = Number(e.target.value);
                onChange({ bpm: Number.isFinite(v) && v >= 40 && v <= 220 ? Math.round(v) : null });
              }}
              data-testid="studio-bpm"
              aria-label={t("Tempo in beats per minute")}
              className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[13px] text-foreground placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <SelectField
          label="Key"
          options={KEYS}
          value={studio.key}
          onChange={(v) => onChange({ key: v })}
          testId="studio-key"
        />
      </div>

      {/* ------- moods ------- */}
      <Field label="Moods — up to four">
        <div className="flex flex-wrap gap-1.5" data-testid="studio-moods" role="group" aria-label={t("Moods")}>
          {MOODS.map((m) => (
            <Chip
              key={m}
              active={studio.moods.includes(m)}
              onClick={() => toggleMood(m)}
              testId={`studio-mood-${m.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {m}
            </Chip>
          ))}
        </div>
      </Field>

      {/* ------- energy ------- */}
      <div>
        <span className="mono-label mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("Energy")}
        </span>
        <div className="flex items-center gap-1" role="radiogroup" aria-label={t("Energy")} data-testid="studio-energy">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={studio.energy === v}
              aria-label={t(`Energy ${v} of 5`)}
              onClick={() => onChange({ energy: v })}
              className={cn(
                "focus-glow h-7 flex-1 rounded-md border text-[11.5px] transition-colors duration-300",
                studio.energy === v
                  ? "border-[color-mix(in_srgb,var(--scope-a)_60%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_16%,transparent)] text-[var(--scope-a)]"
                  : "border-[color-mix(in_srgb,var(--hairline)_70%,transparent)] text-muted-foreground hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ------- voice & duration ------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SelectField
          label="Voice"
          options={VOCAL_MODES}
          value={studio.vocalMode}
          onChange={(v) => onChange({ vocalMode: v })}
          testId="studio-vocal-mode"
        />
        <SelectField
          label="Vocal language"
          options={VOCAL_LANGUAGES}
          value={studio.vocalLanguage}
          onChange={(v) => onChange({ vocalLanguage: v })}
          testId="studio-vocal-language"
        />
        <SelectField
          label="Duration"
          options={DURATIONS}
          value={studio.duration}
          onChange={(v) => onChange({ duration: v })}
          testId="studio-duration"
        />
        <SelectField
          label="Texture"
          options={TEXTURES}
          value={studio.texture}
          onChange={(v) => onChange({ texture: v })}
          testId="studio-texture"
        />
      </div>

      {/* ------- structure ------- */}
      <Field label="Structure — the walk, in order">
        <div className="flex flex-wrap gap-1.5" data-testid="studio-structure" role="group" aria-label={t("Structure")}>
          {SECTIONS.map((s) => (
            <Chip
              key={s}
              active={studio.structure.includes(s)}
              onClick={() => toggleSection(s)}
              testId={`studio-section-${s.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              {s}
            </Chip>
          ))}
        </div>
        {studio.structure.length > 0 && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {studio.structure.map((s) => t(s)).join(" → ")}
          </p>
        )}
      </Field>

      {/* ------- instruments & exclusions ------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Instruments — the voices you want">
          <input
            type="text"
            value={studio.instruments}
            onChange={(e) => onChange({ instruments: e.target.value })}
            placeholder={t("e.g. nylon guitar, upright bass, brushed drums")}
            data-testid="studio-instruments"
            className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[13px] text-foreground placeholder:text-muted-foreground/60"
          />
        </Field>
        <Field label="Excluded sounds — never heard">
          <input
            type="text"
            value={studio.exclusions}
            onChange={(e) => onChange({ exclusions: e.target.value })}
            placeholder={t("e.g. no saxophone, no sirens, no sudden drops")}
            data-testid="studio-exclusions"
            className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[13px] text-foreground placeholder:text-muted-foreground/60"
          />
        </Field>
      </div>

      {/* ------- the two dials ------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="mono-label mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{t("Acoustic / electronic balance")}</span>
            <span className="text-[10.5px] normal-case tracking-normal text-[var(--scope-a)]">
              {studio.acousticBalance <= 25
                ? t("Electronic")
                : studio.acousticBalance <= 45
                  ? t("Mostly electronic")
                  : studio.acousticBalance <= 60
                    ? t("Balanced")
                    : studio.acousticBalance <= 80
                      ? t("Mostly acoustic")
                      : t("Acoustic")}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={studio.acousticBalance}
            onChange={(e) => onChange({ acousticBalance: Number(e.target.value) })}
            aria-label={t("Acoustic versus electronic balance")}
            data-testid="studio-acoustic"
            className="h-1 w-full cursor-pointer accent-[var(--scope-a)]"
          />
        </div>
        <div>
          <span className="mono-label mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{t("Experimental intensity")}</span>
            <span className="text-[10.5px] normal-case tracking-normal text-[var(--scope-a)]">
              {studio.experimental <= 15
                ? t("Faithful")
                : studio.experimental <= 45
                  ? t("Adventurous")
                  : studio.experimental <= 70
                    ? t("Bold")
                    : t("Boundless")}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={studio.experimental}
            onChange={(e) => onChange({ experimental: Number(e.target.value) })}
            aria-label={t("Experimental intensity")}
            data-testid="studio-experimental"
            className="h-1 w-full cursor-pointer accent-[var(--scope-a)]"
          />
        </div>
      </div>

      {/* ------- lyrics authorship ------- */}
      <SelectField
        label="Lyrics"
        options={LYRICS_MODES}
        value={studio.lyricsMode}
        onChange={(v) => onChange({ lyricsMode: v })}
        testId="studio-lyrics-mode"
      />
    </div>
  );
}
