"use client";

/* ------------------------------------------------------------------ */
/*  THE STUDIO CONTROLS — advanced creative settings, disclosed        */
/*  only when asked. BPM, key, moods, energy, vocal mode, language,    */
/*  duration, structure, instruments, texture, acoustic/electronic     */
/*  balance, experimental intensity, exclusions, lyrics authorship.    */
/*                                                                     */
/*  Progressive disclosure law: the primary flow stays                 */
/*  describe → select style → generate. These never clutter it.        */
/* ------------------------------------------------------------------ */

import { Slider } from "@/components/ui/slider";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LC_STUDIO, type LcStudio } from "@/lib/data/light-codes";

interface Props {
  studio: LcStudio;
  onChange: (patch: Partial<LcStudio>) => void;
}

export default function StudioControls({ studio, onChange }: Props) {
  const t = useT();

  const toggleMood = (mood: string) => {
    if (studio.moods.includes(mood)) {
      onChange({ moods: studio.moods.filter((m) => m !== mood) });
    } else {
      onChange({ moods: [...studio.moods, mood].slice(0, 4) });
    }
  };

  const toggleStructure = (section: string) => {
    if (studio.structure.includes(section)) {
      onChange({ structure: studio.structure.filter((s) => s !== section) });
    } else {
      onChange({ structure: [...studio.structure, section] });
    }
  };

  return (
    <div className="space-y-4" data-testid="studio-controls">
      {/* tempo & key */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("BPM")}
            <span className="ml-1.5 normal-case tracking-normal text-[var(--scope-a)]">
              {studio.bpm ? `${studio.bpm}` : t("Auto")}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={40}
              max={240}
              value={studio.bpm ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                onChange({ bpm: Number.isFinite(v) && v >= 40 && v <= 240 ? v : null });
              }}
              placeholder={t("Auto")}
              data-testid="studio-bpm"
              className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/50"
            />
            {studio.bpm !== null && (
              <button
                type="button"
                onClick={() => onChange({ bpm: null })}
                className="focus-glow shrink-0 rounded-lg border hairline px-2 py-1.5 text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                {t("Auto")}
              </button>
            )}
          </div>
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Musical key")}
          </span>
          <select
            value={studio.key}
            onChange={(e) => onChange({ key: e.target.value })}
            data-testid="studio-key"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.keys.map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* moods */}
      <div>
        <span className="mono-label mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("Mood")} <span className="normal-case tracking-normal">({t("up to four")})</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LC_STUDIO.moods.map((mood) => {
            const active = studio.moods.includes(mood);
            return (
              <button
                key={mood}
                type="button"
                onClick={() => toggleMood(mood)}
                aria-pressed={active}
                className={cn(
                  "focus-glow rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
                  active
                    ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                    : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
                )}
              >
                {t(mood)}
              </button>
            );
          })}
        </div>
      </div>

      {/* vocal & language & duration */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Vocal mode")}
          </span>
          <select
            value={studio.vocalMode}
            onChange={(e) => onChange({ vocalMode: e.target.value })}
            data-testid="studio-vocal"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.vocalModes.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Vocal language")}
          </span>
          <select
            value={studio.vocalLanguage}
            onChange={(e) => onChange({ vocalLanguage: e.target.value })}
            data-testid="studio-language"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.languages.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Duration")}
          </span>
          <select
            value={studio.duration}
            onChange={(e) => onChange({ duration: e.target.value })}
            data-testid="studio-duration"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.durations.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* structure */}
      <div>
        <span className="mono-label mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("Structure")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {LC_STUDIO.structures.map((section) => {
            const active = studio.structure.includes(section);
            return (
              <button
                key={section}
                type="button"
                onClick={() => toggleStructure(section)}
                aria-pressed={active}
                className={cn(
                  "focus-glow rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
                  active
                    ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                    : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
                )}
              >
                {t(section)}
              </button>
            );
          })}
        </div>
      </div>

      {/* sliders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span className="mono-label mb-2 flex justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{t("Acoustic ⇄ Electronic")}</span>
            <span className="normal-case tracking-normal text-[var(--scope-a)]">
              {studio.acousticBalance === 50
                ? t("Balanced")
                : studio.acousticBalance > 62
                  ? t("Acoustic")
                  : studio.acousticBalance < 38
                    ? t("Electronic")
                    : `${studio.acousticBalance}`}
            </span>
          </span>
          <Slider
            value={[studio.acousticBalance]}
            onValueChange={([v]) => onChange({ acousticBalance: v })}
            min={0}
            max={100}
            step={5}
            aria-label={t("Acoustic to electronic balance")}
            data-testid="studio-acoustic"
          />
        </div>
        <div>
          <span className="mono-label mb-2 flex justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>{t("Experimental intensity")}</span>
            <span className="normal-case tracking-normal text-[var(--scope-a)]">
              {studio.experimental <= 15
                ? t("Grounded")
                : studio.experimental >= 75
                  ? t("Fearless")
                  : `${studio.experimental}%`}
            </span>
          </span>
          <Slider
            value={[studio.experimental]}
            onValueChange={([v]) => onChange({ experimental: v })}
            min={0}
            max={100}
            step={5}
            aria-label={t("Experimental intensity")}
            data-testid="studio-experimental"
          />
        </div>
      </div>

      {/* instruments, texture, exclusions, lyrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Instruments")}
          </span>
          <input
            value={studio.instruments}
            onChange={(e) => onChange({ instruments: e.target.value })}
            placeholder={t("e.g. cifteli, 808s, grand piano, analog Juno")}
            data-testid="studio-instruments"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/50"
          />
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Production texture")}
          </span>
          <select
            value={studio.texture}
            onChange={(e) => onChange({ texture: e.target.value })}
            data-testid="studio-texture"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.textures.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Explicitly excluded sounds")}
          </span>
          <input
            value={studio.exclusions}
            onChange={(e) => onChange({ exclusions: e.target.value })}
            placeholder={t("e.g. saxophone, no spiritual themes, no auto-tune")}
            data-testid="studio-exclusions"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2.5 text-[12.5px] text-foreground placeholder:text-muted-foreground/50"
          />
        </label>
        <label className="block">
          <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("Lyrics")}
          </span>
          <select
            value={studio.lyricsMode}
            onChange={(e) => onChange({ lyricsMode: e.target.value })}
            data-testid="studio-lyrics-mode"
            className="focus-glow h-9 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12.5px] text-foreground"
          >
            {LC_STUDIO.lyricsModes.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
