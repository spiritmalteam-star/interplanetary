"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  ChevronDown,
  Download,
  Eye,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import {
  LC_MODES,
  LC_SHAPE,
  type LcMode,
} from "@/lib/data/light-codes";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the musical chamber. A compact room: the heading,    */
/*  the intention, six modes, one generating breath — and the player.  */
/*  Everything else reveals itself only when asked for.                */
/* ------------------------------------------------------------------ */

const RENDERING_PHRASES = [
  "The Mirror is translating intention into sound…",
  "The chamber hums — the transmission is taking shape…",
  "Frequencies are finding their places…",
  "The sound is being woven — hold still…",
];

/** A tiny deterministic pseudo-wave, so every track has its own face. */
function waveHeights(seed: string, bars = 34): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 0.18 + ((h >>> 8) % 1000) / 1000 * 0.82;
    const swell = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI * 2.2);
    heights.push(Math.max(0.14, Math.min(1, base * swell)));
  }
  return heights;
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/* ------------------------- mode card -------------------------------- */

function ModeCard({
  mode,
  active,
  onClick,
}: {
  mode: LcMode;
  active: boolean;
  onClick: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`lc-mode-${mode.id}`}
      className={cn(
        "focus-glow group relative flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] glow-sm"
          : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] hover:border-[var(--hairline-hover)] hover:bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)]"
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="mono-label text-[9px] text-muted-foreground/60">
          {mode.n}
        </span>
        <span
          className={cn(
            "truncate text-[12.5px] font-semibold tracking-wide",
            active ? "text-[var(--scope-a)]" : "text-foreground/85"
          )}
        >
          {t(mode.name)}
        </span>
      </span>
      <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
        {t(mode.tagline)}
      </span>
    </button>
  );
}

/* --------------------------- the player ------------------------------ */

function Waveform({
  seed,
  progress,
  playing,
}: {
  seed: string;
  progress: number;
  playing: boolean;
}) {
  const bars = useMemo(() => waveHeights(seed), [seed]);
  return (
    <div className="flex h-12 items-center gap-[2.5px]" aria-hidden="true">
      {bars.map((h, i) => {
        const lit = i / bars.length <= progress;
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] flex-1 rounded-full transition-[background-color] duration-200",
              lit
                ? "bg-[var(--scope-a)]"
                : "bg-[color-mix(in_srgb,var(--scope-a)_22%,transparent)]"
            )}
            style={{
              height: `${Math.round(h * 100 * (playing && lit ? 1.08 : 1))}%`,
              animation:
                playing && lit
                  ? `lc-wave 1.4s ease-in-out ${i * 0.045}s infinite`
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function Player() {
  const track = useMirror((s) => s.lcTrack)!;
  const clearLcPlayer = useMirror((s) => s.clearLcPlayer);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const modeName =
    LC_MODES.find((m) => m.id === track.mode)?.name ?? track.mode;
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(track.duration ?? 0);
  const [loop, setLoop] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const progress = dur > 0 ? Math.min(1, time / dur) : 0;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * dur;
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative rounded-2xl p-4 sm:p-5"
      data-testid="lc-player"
    >
      <audio
        ref={audioRef}
        src={track.audioUrl}
        loop={loop}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDur(e.currentTarget.duration);
          }
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground"
            data-testid="lc-player-mode"
          >
            {t(modeName)}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-[17px] font-semibold text-foreground">
            {track.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={clearLcPlayer}
          aria-label={t("Close the player")}
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* waveform */}
      <div
        className="mt-3 cursor-pointer"
        onClick={seek}
        role="slider"
        aria-label={t("Seek within the transmission")}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        <Waveform seed={track.id + track.title} progress={progress} playing={playing} />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px] text-muted-foreground">
        <span>{fmtTime(time)}</span>
        <span>{fmtTime(dur)}</span>
      </div>

      {/* transport */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          data-testid="lc-play"
          aria-label={playing ? t("Pause") : t("Play")}
          className="focus-glow flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:-translate-y-px"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-[1px]" aria-hidden="true" />
          )}
        </button>
        <PlayerChip
          onClick={() => void generateLightCode()}
          icon={RefreshCw}
          label="Generate again"
          testId="lc-again"
        />
        <PlayerChip
          onClick={() => reshapeLc(track)}
          icon={Wand2}
          label="Reshape"
          testId="lc-reshape"
        />
        <a
          href={track.audioUrl}
          download={`${track.title}.mp3`}
          target="_blank"
          rel="noreferrer"
          data-testid="lc-download"
          className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Download className="size-3" aria-hidden="true" />
          {t("Download")}
        </a>
        <PlayerChip
          onClick={() => setLoop((l) => !l)}
          icon={Repeat}
          label={loop ? "Looping" : "Turn into loop"}
          active={loop}
          testId="lc-loop"
        />
        {(track.style || track.lyrics) && (
          <PlayerChip
            onClick={() => setShowTranslation((v) => !v)}
            icon={Eye}
            label="View translation"
            active={showTranslation}
            testId="lc-translation"
          />
        )}
      </div>

      {/* TRANSMISSION NOTES */}
      {track.notes && (
        <div className="mt-3.5 border-t hairline pt-3">
          <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("Transmission notes")}
          </p>
          <p className="mt-1 text-[13.5px] italic leading-relaxed text-foreground/80">
            {track.notes}
          </p>
        </div>
      )}

      {/* VIEW TRANSLATION — the engine-facing direction, revealed on request */}
      <AnimatePresence>
        {showTranslation && (track.style || track.lyrics) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
              {track.style && (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">
                    {t("Sonic language")}
                  </span>
                  {track.style}
                </p>
              )}
              {track.lyrics && (
                <p className="whitespace-pre-line font-serif text-[13px] italic leading-relaxed text-foreground/85">
                  {track.lyrics}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function PlayerChip({
  onClick,
  icon: Icon,
  label,
  active,
  testId,
}: {
  onClick: () => void;
  icon: typeof Play;
  label: string;
  active?: boolean;
  testId?: string;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={cn(
        "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
          : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      <span className="whitespace-nowrap">{t(label)}</span>
    </button>
  );
}

/* ------------------------- shape controls ---------------------------- */

function ShapeDial({
  label,
  ends,
  value,
  onChange,
}: {
  label: string;
  ends: readonly string[];
  value: number;
  onChange: (v: number) => void;
}) {
  const t = useT();
  return (
    <div>
      <p className="mono-label mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{t(label)}</span>
        <span className="text-[9.5px] normal-case tracking-normal text-[var(--scope-a)]">
          {t(ends[value] ?? "")}
        </span>
      </p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t(label)}>
        {ends.map((_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            onClick={() => onChange(i)}
            className={cn(
              "focus-glow h-1.5 flex-1 rounded-full transition-all duration-300",
              i <= value
                ? "bg-[color-mix(in_srgb,var(--scope-a)_65%,transparent)]"
                : "bg-[color-mix(in_srgb,var(--hairline)_70%,transparent)]"
            )}
          />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground/60">
        <span>{t(ends[0])}</span>
        <span>{t(ends[ends.length - 1])}</span>
      </div>
    </div>
  );
}

function ShapeSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  return (
    <label className="block">
      <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {t(label)}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[12px] text-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {t(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ----------------------------- the world ----------------------------- */

export function LightCodesView() {
  const exitLightCodes = useMirror((s) => s.exitLightCodes);
  const lcMode = useMirror((s) => s.lcMode);
  const lcCivilization = useMirror((s) => s.lcCivilization);
  const lcIntention = useMirror((s) => s.lcIntention);
  const lcUserLyrics = useMirror((s) => s.lcUserLyrics);
  const lcShape = useMirror((s) => s.lcShape);
  const lcStatus = useMirror((s) => s.lcStatus);
  const lcTrack = useMirror((s) => s.lcTrack);
  const lcError = useMirror((s) => s.lcError);
  const lcHistory = useMirror((s) => s.lcHistory);
  const interpretation = useMirror((s) => s.lcInterpretation);
  const setLcMode = useMirror((s) => s.setLcMode);
  const setLcCivilization = useMirror((s) => s.setLcCivilization);
  const setLcIntention = useMirror((s) => s.setLcIntention);
  const setLcUserLyrics = useMirror((s) => s.setLcUserLyrics);
  const setLcShape = useMirror((s) => s.setLcShape);
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const forgetLc = useMirror((s) => s.forgetLc);
  const t = useT();

  const [shapeOpen, setShapeOpen] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  const mode = LC_MODES.find((m) => m.id === lcMode) ?? LC_MODES[0];
  const busy = lcStatus === "interpreting" || lcStatus === "polling";

  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(
      () => setPhraseIdx((i) => (i + 1) % RENDERING_PHRASES.length),
      2600
    );
    return () => window.clearInterval(id);
  }, [busy]);

  return (
    <div className="scope-lightcodes relative flex h-full flex-col">
      {/* ---------- top bar ---------- */}
      <header className="relative z-30 shrink-0 border-b hairline bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="bar-safe flex items-center justify-between gap-2 px-3 sm:px-5">
          <button
            type="button"
            onClick={exitLightCodes}
            className="focus-glow group flex h-9 items-center gap-2 rounded-full border hairline px-3 text-[14px] font-medium text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground sm:px-3.5"
          >
            <ArrowLeft
              className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{t("Return to the Observatory")}</span>
            <span className="sm:hidden">{t("Back")}</span>
          </button>
          <span className="flex items-center gap-2" aria-hidden="true">
            <AudioLines className="size-4 text-[var(--scope-a)]" />
            <span className="mono-label hidden text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:inline">
              {t("Light Codes")}
            </span>
          </span>
        </div>
      </header>

      {/* ---------- the chamber ---------- */}
      <div
        className="nice-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="light-codes"
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pb-10 pt-6 sm:px-6">
          {/* heading */}
          <div className="text-center">
            <h1 className="scope-gradient-text text-[22px] font-semibold tracking-[0.14em] sm:text-[26px]">
              {t("LIGHT CODES")}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("Sound transmissions through Mirror Entity")}
            </p>
            <p className="mt-0.5 font-serif text-[13.5px] italic text-foreground/75">
              {t("“Translate intention into sound.”")}
            </p>
          </div>

          {/* intention */}
          <div className="mt-5">
            <label htmlFor="lc-intention" className="sr-only">
              {t(mode.placeholder)}
            </label>
            <textarea
              id="lc-intention"
              rows={2}
              value={lcIntention}
              onChange={(e) => setLcIntention(e.target.value)}
              placeholder={t(mode.placeholder)}
              maxLength={600}
              data-testid="lc-intention"
              className="focus-glow w-full resize-none rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3.5 py-2.5 text-[14.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            />
            {/* one-tap intents of the chosen chamber */}
            {mode.intents && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mode.intents.map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setLcIntention(intent)}
                    className="focus-glow rounded-full border px-2.5 py-1 text-[11.5px] text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                  >
                    {t(intent)}
                  </button>
                ))}
              </div>
            )}
            {/* civilizations */}
            {mode.civilizations && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mode.civilizations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setLcCivilization(lcCivilization === c.id ? null : c.id)
                    }
                    aria-pressed={lcCivilization === c.id}
                    className={cn(
                      "focus-glow rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-300",
                      lcCivilization === c.id
                        ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                        : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(c.name)}
                  </button>
                ))}
              </div>
            )}
            {/* the visitor's own lyrics */}
            {lcShape.lyricsMode === "USER WRITES" && (
              <div className="mt-2">
                <label htmlFor="lc-lyrics" className="sr-only">
                  {t("Your words")}
                </label>
                <textarea
                  id="lc-lyrics"
                  rows={2}
                  value={lcUserLyrics}
                  onChange={(e) => setLcUserLyrics(e.target.value)}
                  placeholder={t("Your words — the Mirror will set them to sound.")}
                  maxLength={600}
                  className="focus-glow w-full resize-none rounded-xl border hairline bg-transparent px-3 py-2 font-serif text-[13.5px] italic leading-relaxed text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
            )}
          </div>

          {/* six modes */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {LC_MODES.map((m) => (
              <ModeCard
                key={m.id}
                mode={m}
                active={m.id === lcMode}
                onClick={() => setLcMode(m.id)}
              />
            ))}
          </div>

          {/* SHAPE THE TRANSMISSION — hidden until asked */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShapeOpen((v) => !v)}
              aria-expanded={shapeOpen}
              data-testid="lc-shape-toggle"
              className="focus-glow flex w-full items-center justify-center gap-1.5 text-[11.5px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("Shape the transmission")}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-300",
                  shapeOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence>
              {shapeOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ShapeDial
                        label="Energy"
                        ends={LC_SHAPE.energy}
                        value={lcShape.energy}
                        onChange={(v) => setLcShape({ energy: v })}
                      />
                      <ShapeDial
                        label="Light / Dark"
                        ends={LC_SHAPE.light}
                        value={lcShape.light}
                        onChange={(v) => setLcShape({ light: v })}
                      />
                      <ShapeDial
                        label="Familiarity"
                        ends={LC_SHAPE.familiarity}
                        value={lcShape.familiarity}
                        onChange={(v) => setLcShape({ familiarity: v })}
                      />
                      <ShapeDial
                        label="Structure"
                        ends={LC_SHAPE.structure}
                        value={lcShape.structure}
                        onChange={(v) => setLcShape({ structure: v })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <ShapeSelect
                        label="Time feel"
                        options={LC_SHAPE.timeFeel}
                        value={lcShape.timeFeel}
                        onChange={(v) => setLcShape({ timeFeel: v })}
                      />
                      <ShapeSelect
                        label="Voice"
                        options={LC_SHAPE.voice}
                        value={lcShape.voice}
                        onChange={(v) => setLcShape({ voice: v })}
                      />
                      <ShapeSelect
                        label="Vocal language"
                        options={LC_SHAPE.vocalLanguage}
                        value={lcShape.vocalLanguage}
                        onChange={(v) => setLcShape({ vocalLanguage: v })}
                      />
                      <ShapeSelect
                        label="Lyrics mode"
                        options={LC_SHAPE.lyricsMode}
                        value={lcShape.lyricsMode}
                        onChange={(v) => setLcShape({ lyricsMode: v })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GENERATE */}
          <div className="mt-5 flex flex-col items-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => void generateLightCode()}
              data-testid="lc-generate"
              className="focus-glow group flex h-12 items-center gap-2.5 rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] px-8 text-[14.5px] font-semibold tracking-wide text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode.id === "mirror-transmission" ? (
                <Sparkles className="size-4" aria-hidden="true" />
              ) : (
                <AudioLines className="size-4" aria-hidden="true" />
              )}
              {mode.id === "mirror-transmission"
                ? t("Generate from Mirror")
                : t("Generate the transmission")}
            </button>

            {/* the chamber at work */}
            <AnimatePresence mode="wait">
              {busy && (
                <motion.div
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex flex-col items-center"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-[var(--scope-a)]"
                        style={{
                          height: `${30 + (i % 3) * 26}%`,
                          animation: `lc-wave 1.2s ease-in-out ${i * 0.12}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[13px] italic text-muted-foreground">
                    {lcStatus === "interpreting"
                      ? t(RENDERING_PHRASES[0])
                      : t("The sound is being woven — hold still…")}
                  </p>
                </motion.div>
              )}
              {lcStatus === "error" && lcError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--destructive)_30%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3 text-center"
                >
                  <p className="text-[13.5px] leading-relaxed text-foreground/85">
                    {lcError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void generateLightCode()}
                    className="focus-glow mt-2 text-[12.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {t("Ask again")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* the Mirror's written interpretation — before the sound */}
          {lcStatus !== "ready" && interpretation && (interpretation.notes || interpretation.title) && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="scope-frame-card relative mt-6 rounded-2xl p-4 sm:p-5"
              data-testid="lc-interpretation"
            >
              <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("The Mirror's interpretation")}
              </p>
              {interpretation.title && (
                <h3 className="mt-0.5 font-serif text-[16.5px] font-semibold text-foreground">
                  {interpretation.title}
                </h3>
              )}
              {interpretation.notes && (
                <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-foreground/80">
                  {interpretation.notes}
                </p>
              )}
            </motion.section>
          )}

          {/* the player */}
          {lcStatus === "ready" && lcTrack && (
            <div className="mt-6">
              <Player />
            </div>
          )}

          {/* MY TRANSMISSIONS */}
          {lcHistory.length > 0 && (
            <section className="mt-8" aria-label={t("My transmissions")}>
              <p className="mono-label mb-2 text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("My transmissions")}
              </p>
              <div className="nice-scroll max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {lcHistory.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-2.5 rounded-xl border hairline bg-[var(--glass-bg-soft)] px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        useMirror.setState({ lcTrack: track, lcStatus: "ready" })
                      }
                      aria-label={`${t("Play")} ${track.title}`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <Play className="size-3 translate-x-[1px]" aria-hidden="true" />
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground/85">
                        {track.title}
                      </span>
                      <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                        {t(
                          LC_MODES.find((m) => m.id === track.mode)?.name ??
                            track.mode
                        )}
                        {" · "}
                        {new Date(track.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => reshapeLc(track)}
                      aria-label={`${t("Reshape")} ${track.title}`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100"
                    >
                      <Wand2 className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => forgetLc(track.id)}
                      aria-label={`${t("Forget")} ${track.title}`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
