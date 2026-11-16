"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  AudioLines,
  ChevronDown,
  Download,
  Gauge,
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  Wand2,
  Waves,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMirror } from "@/lib/mirror-store";
import { usePlayerStore } from "@/lib/player-store";
import { useT } from "@/lib/i18n";
import {
  LC_MODES,
  LC_SHAPE,
  type LcMode,
  type LcSync,
  type LcTrack,
} from "@/lib/data/light-codes";
import { genreName, suggestedVisual } from "@/lib/data/music-genres";
import { cn } from "@/lib/utils";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import type { ChatAttachment } from "./attachments";
import GenreSelector from "./music/GenreSelector";
import StudioControls from "./music/StudioControls";
import VisualizerCanvas, {
  VISUALIZER_STYLES,
  type VisualizerStyle,
} from "./music/VisualizerCanvas";
import KaraokeStage from "./music/KaraokeStage";
import { estimateSync } from "@/lib/audio/analyze";

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the musical chamber, evolved. Music Engine 2.0:      */
/*                                                                     */
/*  describe your music → select the style → generate.                 */
/*                                                                     */
/*  The Mirror reads the intention as the highest law; the genre       */
/*  fusion is a binding contract; the studio controls wait hidden.     */
/*  The player is ONE voice; the karaoke follows its own clock; the    */
/*  visualizer listens to real audio data; the QA ear measures what    */
/*  was born; and The Gathering receives real, playable music.         */
/* ------------------------------------------------------------------ */

const RENDERING_PHRASES = [
  "The Mirror is translating intention into sound…",
  "The chamber hums — the transmission is taking shape…",
  "Frequencies are finding their places…",
  "The sound is being woven — hold still…",
];

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** A tiny deterministic seed-face for the seek bar — decoration only;
    the honest, audio-reactive art lives in the visualizer panel. */
function waveHeights(seed: string, bars = 34): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < bars; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 0.18 + ((h >>> 8) % 1000) / 1000 * 0.82;
    heights.push(base);
  }
  return heights;
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

/* --------------------------- shape chips ---------------------------- */

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

/* ------------------------- the studio player ------------------------- */

function StudioPlayer({ track }: { track: LcTrack }) {
  const t = useT();
  const trackId = track.trackId;

  /* the ONE authoritative voice */
  const playing = usePlayerStore((s) => s.playing);
  const time = usePlayerStore((s) => s.time);
  const duration = usePlayerStore((s) => s.duration);
  const loading = usePlayerStore((s) => s.loading);
  const volume = usePlayerStore((s) => s.volume);
  const speed = usePlayerStore((s) => s.speed);
  const repeat = usePlayerStore((s) => s.repeat);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const toggle = usePlayerStore((s) => s.toggle);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setSpeed = usePlayerStore((s) => s.setSpeed);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);

  const lcQuality = useMirror((s) => s.lcQuality);
  const runLcQuality = useMirror((s) => s.runLcQuality);
  const favoriteLc = useMirror((s) => s.favoriteLc);
  const publishLc = useMirror((s) => s.publishLc);
  const lcSync = useMirror((s) => s.lcSync);
  const setLcSync = useMirror((s) => s.setLcSync);
  const lcHistory = useMirror((s) => s.lcHistory);
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const reshapeLc = useMirror((s) => s.reshapeLc);

  const [karaokeOpen, setKaraokeOpen] = useState(false);
  const [vizOpen, setVizOpen] = useState(false);
  const [vizPicked, setVizPicked] = useState<VisualizerStyle | null>(null);
  const [showQuality, setShowQuality] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState(false);
  const [caption, setCaption] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);

  const bars = useMemo(() => waveHeights(track.id + track.title), [track.id, track.title]);
  const dur = duration || track.duration || 0;
  const progress = dur > 0 ? Math.min(1, time / dur) : 0;
  const hasVocals = !!(track.lyrics && track.lyrics.trim());

  /* the karaoke timing — the stored stamps win; otherwise an honest
     estimate stretches the lyrics across the MEASURED duration, and
     the stage itself says so. Never fabricated as accurate. */
  const effectiveSync = useMemo(() => {
    if (lcSync && lcSync.lines.length > 0) return lcSync;
    if (track.lyrics && dur > 30) return estimateSync(track.lyrics, dur);
    return null;
  }, [lcSync, track.lyrics, dur]);

  /* the genre SUGGESTS a visual style — the visitor's own pick always wins */
  const suggested = useMemo(
    () => (suggestedVisual(track.genres ?? []) as VisualizerStyle | null) ?? null,
    [track.genres]
  );
  const vizStyle: VisualizerStyle = vizPicked ?? suggested ?? "pearl-gold";

  /* the visitor's own heart — kept per track, no effects needed */
  const favorite = trackId ? (favorites[trackId] ?? false) : false;

  const ensurePlaying = () => {
    if (!playing) playTrack(track, lcHistory);
    else toggle();
  };

  const seekFromBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * dur);
  };

  const share = async () => {
    const text = `"${track.title}" — a transmission from ReflectMe\n${track.audioUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("The share text rests in your clipboard."));
    } catch {
      toast.error(t("The clipboard kept its silence."));
    }
  };

  const publish = async () => {
    if (!trackId) return;
    const ok = await publishLc(trackId, caption.trim() || undefined);
    if (ok) {
      toast.success(t("The transmission now plays in The Gathering."));
      setPublishing(false);
      setCaption("");
    }
  };

  const modeName = LC_MODES.find((m) => m.id === track.mode)?.name ?? track.mode;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative rounded-2xl p-4 sm:p-5"
      data-testid="lc-player"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground"
            data-testid="lc-player-mode"
          >
            {t(modeName)}
            {track.genres && track.genres.length > 0
              ? " · " + track.genres.map((g) => t(genreName(g))).join(" + ")
              : ""}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-[17px] font-semibold text-foreground">
            {track.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => useMirror.setState({ lcTrack: null, lcStatus: "idle", lcSync: null, lcQuality: null })}
          aria-label={t("Close the player")}
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* THE VISUALIZER — real audio-reactive art, opened on demand */}
      <AnimatePresence>
        {vizOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              <div className="nice-scroll flex gap-1.5 overflow-x-auto pb-1">
                {VISUALIZER_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setVizStyle(s.id)}
                    aria-pressed={vizStyle === s.id}
                    data-testid={`viz-style-${s.id}`}
                    className={cn(
                      "focus-glow shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
                      vizStyle === s.id
                        ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                        : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(s.name)}
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl" data-testid="lc-visualizer">
                <VisualizerCanvas style={vizStyle} className="h-44 w-full sm:h-56" />
              </div>
              <p className="text-center text-[10px] text-muted-foreground/60">
                {t("The art listens to the real audio — nothing here is decoration.")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* seek bar — the honest clock face */}
      <div
        className="mt-3 cursor-pointer"
        onClick={seekFromBar}
        role="slider"
        aria-label={t("Seek within the transmission")}
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        data-testid="lc-seekbar"
      >
        <div className="flex h-10 items-center gap-[2.5px]" aria-hidden="true">
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
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10.5px] text-muted-foreground">
        <span data-testid="lc-time-now">{fmtTime(time)}</span>
        <span data-testid="lc-time-total">{fmtTime(dur)}</span>
      </div>

      {/* transport */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={ensurePlaying}
          data-testid="lc-play"
          aria-label={playing ? t("Pause") : t("Play")}
          className="focus-glow flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-all duration-300 hover:-translate-y-px"
        >
          {loading ? (
            <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          ) : playing ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-[1px]" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={prev}
          aria-label={t("Previous")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipBack className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label={t("Next")}
          className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipForward className="size-3.5" aria-hidden="true" />
        </button>
        <PlayerChip
          onClick={cycleRepeat}
          icon={Repeat}
          label={
            repeat === "one"
              ? "Repeats this one"
              : repeat === "all"
                ? "Repeats the shelf"
                : "Turn into loop"
          }
          active={repeat !== "off"}
          testId="lc-loop"
        />
        <PlayerChip
          onClick={() => setVizOpen((v) => !v)}
          icon={Waves}
          label="Visualizer"
          active={vizOpen}
          testId="lc-visualizer-toggle"
        />
        {hasVocals && (
          <PlayerChip
            onClick={() => setKaraokeOpen(true)}
            icon={Mic2}
            label="Karaoke"
            testId="lc-karaoke"
          />
        )}
        {(track.style || track.lyrics) && (
          <PlayerChip
            onClick={() => setShowTranslation((v) => !v)}
            icon={Gauge}
            label="View the direction"
            active={showTranslation}
            testId="lc-translation"
          />
        )}
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
      </div>

      {/* second row — the visitor's marks */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (!trackId) return;
            const next = !favorite;
            setFavorites((f) => ({ ...f, [trackId]: next }));
            void favoriteLc(trackId, next);
          }}
          aria-pressed={favorite}
          data-testid="lc-favorite"
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition-all duration-300",
            favorite
              ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
              : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:border-[var(--hairline-hover)] hover:text-foreground"
          )}
        >
          <Heart className={cn("size-3", favorite && "fill-current")} aria-hidden="true" />
          {favorite ? t("Held close") : t("Hold close")}
        </button>
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
        {trackId && (
          <PlayerChip
            onClick={() => setPublishing((v) => !v)}
            icon={Upload}
            label="Share with the Gathering"
            active={publishing}
            testId="lc-publish"
          />
        )}
        <PlayerChip onClick={() => void share()} icon={Share2} label="Share" testId="lc-share" />
        <PlayerChip
          onClick={() => {
            setShowQuality((v) => !v);
            if (!lcQuality) void runLcQuality();
          }}
          icon={Gauge}
          label={
            lcQuality?.verdict === "pass"
              ? "Studio pass"
              : lcQuality?.verdict === "warn"
                ? "Studio note"
                : lcQuality?.verdict === "fail"
                  ? "Studio flag"
                  : "Quality"
          }
          active={showQuality}
          testId="lc-quality"
        />
      </div>

      {/* publish form */}
      <AnimatePresence>
        {publishing && trackId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
              <label htmlFor="lc-publish-caption" className="sr-only">
                {t("A few words to carry with the sound")}
              </label>
              <textarea
                id="lc-publish-caption"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t("A few words to carry with the sound (optional)")}
                maxLength={280}
                data-testid="lc-publish-caption"
                className="focus-glow w-full resize-none rounded-lg border hairline bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPublishing(false)}
                  className="focus-glow rounded-full border hairline px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  {t("Not yet")}
                </button>
                <button
                  type="button"
                  onClick={() => void publish()}
                  data-testid="lc-publish-confirm"
                  className="focus-glow rounded-full bg-[var(--scope-a)] px-4 py-1.5 text-[12px] font-semibold text-white transition-transform hover:-translate-y-px"
                >
                  {t("Publish to The Gathering")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the QA ear — honest quality report */}
      <AnimatePresence>
        {showQuality && lcQuality && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 space-y-1.5 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_4%,transparent)] p-3"
              data-testid="lc-quality-report"
            >
              <p className="mono-label text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("The chamber's listening ear")} ·{" "}
                {lcQuality.verdict === "pass"
                  ? t("studio pass")
                  : lcQuality.verdict === "warn"
                    ? t("notes to consider")
                    : lcQuality.verdict === "fail"
                      ? t("flags raised")
                      : t("unknown")}
              </p>
              {lcQuality.checks.map((check) => (
                <p key={check.id} className="flex gap-2 text-[12px] leading-relaxed">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      check.severity === "ok"
                        ? "bg-emerald-500/70"
                        : check.severity === "info"
                          ? "bg-muted-foreground/50"
                          : check.severity === "warn"
                            ? "bg-amber-500/80"
                            : "bg-red-500/80"
                    )}
                  />
                  <span className="text-muted-foreground">
                    <span className="text-foreground/80">{t(check.label)}:</span> {check.detail}
                  </span>
                </p>
              ))}
              {lcQuality.verdict === "fail" && (
                <button
                  type="button"
                  onClick={() => void generateLightCode()}
                  className="focus-glow mt-1 text-[12px] text-[var(--scope-a)] underline-offset-4 hover:underline"
                >
                  {t("Ask for a fresh rendering — the lights return for a failed one")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* VIEW THE DIRECTION — the engine-facing contract, revealed on request */}
      <AnimatePresence>
        {showTranslation && (track.style || track.lyrics || track.spec) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
              {track.spec && (track.spec.bpm || track.spec.key || track.spec.structure) && (
                <p className="mono-label text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {track.spec.bpm ? `${t("BPM")} ${track.spec.bpm}` : ""}
                  {track.spec.key ? ` · ${track.spec.key}` : ""}
                  {track.spec.structure ? ` · ${track.spec.structure}` : ""}
                </p>
              )}
              {track.style && (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">
                    {t("Sonic language")}
                  </span>
                  {track.style}
                </p>
              )}
              {track.spec?.negative && (
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">
                    {t("Exclusions honored")}
                  </span>
                  {track.spec.negative}
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

      {/* the karaoke stage — full screen, one clock */}
      <AnimatePresence>
        {karaokeOpen && (
          <KaraokeStage
            open
            onClose={() => setKaraokeOpen(false)}
            sync={effectiveSync}
            lyrics={track.lyrics ?? null}
            onSyncEdited={(sync: LcSync) => {
              setLcSync(sync);
              if (trackId) {
                void fetch(`/api/tracks/${encodeURIComponent(trackId)}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sync }),
                }).catch(() => undefined);
              }
            }}
          />
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

/* ---------------------- the interpretation card ----------------------- */

function InterpretationCard() {
  const t = useT();
  const interpretation = useMirror((s) => s.lcInterpretation);
  const lcStatus = useMirror((s) => s.lcStatus);
  const [editing, setEditing] = useState(false);

  if (!interpretation) return null;
  if (lcStatus === "ready") return null;
  const spec = interpretation.spec;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative mt-6 rounded-2xl p-4 sm:p-5"
      data-testid="lc-interpretation"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("The Mirror's interpretation")}
          </p>
          {interpretation.title && (
            <h3 className="mt-0.5 font-serif text-[16.5px] font-semibold text-foreground">
              {interpretation.title}
            </h3>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          data-testid="lc-edit-direction"
          className="focus-glow flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] text-muted-foreground transition-all hover:border-[var(--hairline-hover)] hover:text-foreground"
        >
          <Wand2 className="size-3" aria-hidden="true" />
          {editing ? t("Close the editing") : t("Edit the direction")}
        </button>
      </div>

      {interpretation.notes && (
        <p className="mt-1.5 text-[13.5px] italic leading-relaxed text-foreground/80">
          {interpretation.notes}
        </p>
      )}

      {/* the structured specification — the separation made visible */}
      {spec && (spec.bpm || spec.key || spec.structure || spec.arc || spec.negative) && (
        <div className="mt-3 space-y-1 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_4%,transparent)] p-3 text-[12px] text-muted-foreground">
          {spec.bpm ? (
            <p>
              <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">{t("Tempo")}</span>
              {spec.bpm} BPM{spec.key ? ` · ${spec.key}` : ""}
            </p>
          ) : null}
          {spec.structure ? (
            <p>
              <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">{t("Structure")}</span>
              {spec.structure}
            </p>
          ) : null}
          {spec.arc ? (
            <p>
              <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">{t("Arc")}</span>
              {spec.arc}
            </p>
          ) : null}
          {spec.negative ? (
            <p>
              <span className="mono-label mr-1.5 text-[9px] uppercase tracking-[0.18em]">{t("Exclusions")}</span>
              {spec.negative}
            </p>
          ) : null}
        </div>
      )}

      {/* EDIT THE DIRECTION — the visitor inspects and edits the spec;
          what is rendered is exactly what stands here. The form remounts
          per interpretation, so its words always start from the truth. */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <EditDirectionForm
              key={interpretation.createdAt + interpretation.title}
              interpretation={interpretation}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function EditDirectionForm({ interpretation }: { interpretation: LcTrack }) {
  const t = useT();
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const [title, setTitle] = useState(interpretation.title);
  const [style, setStyle] = useState(interpretation.style ?? "");
  const [lyrics, setLyrics] = useState(interpretation.lyrics ?? "");

  return (
            <div className="mt-3 space-y-2" data-testid="lc-edit-form">
              <label className="block">
                <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Title")}
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="lc-edit-title"
                  className="focus-glow h-9 w-full rounded-lg border hairline bg-transparent px-3 text-[13px] text-foreground"
                />
              </label>
              <label className="block">
                <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Sonic language — rendered exactly as written")}
                </span>
                <textarea
                  rows={4}
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  data-testid="lc-edit-style"
                  className="focus-glow w-full resize-none rounded-lg border hairline bg-transparent px-3 py-2 text-[12.5px] leading-relaxed text-foreground"
                />
              </label>
              <label className="block">
                <span className="mono-label mb-1 block text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Lyrics — optional")}
                </span>
                <textarea
                  rows={3}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  data-testid="lc-edit-lyrics"
                  className="focus-glow w-full resize-none rounded-lg border hairline bg-transparent px-3 py-2 font-serif text-[13px] italic leading-relaxed text-foreground"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  void generateLightCode({
                    styleOverride: {
                      title: title.trim() || undefined,
                      style: style.trim() || undefined,
                      lyrics: lyrics.trim() || null,
                    },
                  })
                }
                data-testid="lc-sound-direction"
                className="focus-glow flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--scope-a)] text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-px"
              >
                <AudioLines className="size-4" aria-hidden="true" />
                {t("Sound this direction")}
              </button>
              <p className="text-[11px] leading-relaxed text-muted-foreground/70">
                {t("What stands here is what the engine receives — nothing is reinterpreted behind your back.")}
              </p>
            </div>
  );
}

/* ------------------------- the gathering shelf ------------------------ */

interface GatheringPost {
  id: string;
  caption: string | null;
  createdAt: string;
  creator: string;
  reactions: { kind: string; count: number; mine: boolean }[];
  track: {
    id: string;
    title: string;
    audioUrl: string | null;
    duration: number | null;
    genres: string[];
    lyrics: string | null;
    style: string | null;
  };
}

function GatheringShelf() {
  const t = useT();
  const lcHistory = useMirror((s) => s.lcHistory);
  const publishedNonce = useMirror((s) => s.lcPublishedNonce);
  const [posts, setPosts] = useState<GatheringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const lastTrackId = lcHistory[0]?.trackId;

  const load = async () => {
    try {
      const res = await fetch("/api/gathering/music", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { posts?: GatheringPost[] };
        setPosts(data.posts ?? []);
      }
    } catch {
      /* the shelf rests */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [lastTrackId, publishedNonce]);

  const react = async (postId: string, kind: string) => {
    /* the optimistic press — the answer recomputes honestly */
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const reactions = p.reactions.map((r) =>
          r.kind === kind ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r
        );
        if (!reactions.some((r) => r.kind === kind)) {
          reactions.push({ kind, count: 1, mine: true });
        }
        return { ...p, reactions };
      })
    );
    try {
      await fetch(`/api/gathering/music/${encodeURIComponent(postId)}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
    } catch {
      void load();
    }
  };

  const playPost = (post: GatheringPost) => {
    if (!post.track.audioUrl) return;
    const asTrack: LcTrack = {
      id: post.track.id,
      title: post.track.title,
      mode: "freestyle",
      intention: "",
      audioUrl: post.track.audioUrl,
      duration: post.track.duration ?? undefined,
      lyrics: post.track.lyrics,
      style: post.track.style ?? undefined,
      genres: post.track.genres,
      createdAt: new Date(post.createdAt).getTime(),
    };
    const queue = posts
      .filter((p) => p.track.audioUrl)
      .map(
        (p): LcTrack => ({
          id: p.track.id,
          title: p.track.title,
          mode: "freestyle",
          intention: "",
          audioUrl: p.track.audioUrl as string,
          duration: p.track.duration ?? undefined,
          lyrics: p.track.lyrics,
          genres: p.track.genres,
          createdAt: new Date(p.createdAt).getTime(),
        })
      );
    usePlayerStore.getState().playTrack(asTrack, queue);
  };

  const REACTIONS: { kind: string; glyph: string; label: string }[] = [
    { kind: "resonance", glyph: "◈", label: "Resonance" },
    { kind: "gratitude", glyph: "❦", label: "Gratitude" },
    { kind: "awe", glyph: "✧", label: "Awe" },
  ];

  return (
    <section className="mt-8" aria-label={t("The Gathering — shared transmissions")} data-testid="gathering-shelf">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="focus-glow mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="mono-label text-[9.5px] uppercase tracking-[0.24em] text-muted-foreground">
          {t("The Gathering — shared transmissions")}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-300",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {loading ? (
              <p className="py-4 text-center text-[12.5px] text-muted-foreground/70">
                {t("The shelf listens for its first transmissions…")}
              </p>
            ) : posts.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-muted-foreground/70">
                {t("No transmission has been shared yet — be the first voice.")}
              </p>
            ) : (
              <div className="nice-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3"
                    data-testid={`gathering-post-${post.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => playPost(post)}
                        aria-label={`${t("Play")} ${post.track.title}`}
                        data-testid={`gathering-play-${post.track.id}`}
                        className="focus-glow flex size-8 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                      >
                        <Play className="size-3.5 translate-x-[1px]" aria-hidden="true" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground/90">
                          {post.track.title}
                        </p>
                        <p className="mono-label text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                          {post.creator} ·{" "}
                          {post.track.genres.map((g) => t(genreName(g))).join(" + ") || t("free form")} ·{" "}
                          {post.track.duration ? fmtTime(post.track.duration) : ""}
                        </p>
                      </div>
                    </div>
                    {post.caption && (
                      <p className="mt-2 text-[12.5px] italic leading-relaxed text-foreground/75">
                        {post.caption}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {REACTIONS.map((r) => {
                        const hit = post.reactions.find((x) => x.kind === r.kind);
                        return (
                          <button
                            key={r.kind}
                            type="button"
                            onClick={() => void react(post.id, r.kind)}
                            aria-pressed={!!hit?.mine}
                            aria-label={t(r.label)}
                            data-testid={`gathering-react-${post.id}-${r.kind}`}
                            className={cn(
                              "focus-glow flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] transition-all duration-300",
                              hit?.mine
                                ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] text-[var(--scope-a)]"
                                : "border-[color-mix(in_srgb,var(--hairline)_80%,transparent)] text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span aria-hidden="true">{r.glyph}</span>
                            {hit?.count ? hit.count : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
  const lcGenres = useMirror((s) => s.lcGenres);
  const lcStudio = useMirror((s) => s.lcStudio);
  const setLcMode = useMirror((s) => s.setLcMode);
  const setLcCivilization = useMirror((s) => s.setLcCivilization);
  const setLcIntention = useMirror((s) => s.setLcIntention);
  const setLcUserLyrics = useMirror((s) => s.setLcUserLyrics);
  const setLcShape = useMirror((s) => s.setLcShape);
  const setLcGenres = useMirror((s) => s.setLcGenres);
  const setLcStudio = useMirror((s) => s.setLcStudio);
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const forgetLc = useMirror((s) => s.forgetLc);
  const t = useT();

  const [shapeOpen, setShapeOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  /* what the transmission carries — one image, up to three documents */
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

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

  const showAdvanced =
    lcStudio.bpm !== null ||
    lcStudio.key !== "Auto" ||
    lcStudio.moods.length > 0 ||
    lcStudio.vocalMode !== "Auto" ||
    lcStudio.vocalLanguage !== "Auto" ||
    lcStudio.duration !== "Auto" ||
    lcStudio.structure.length > 0 ||
    lcStudio.instruments.trim() ||
    lcStudio.texture !== "Auto" ||
    lcStudio.acousticBalance !== 50 ||
    lcStudio.experimental !== 20 ||
    lcStudio.exclusions.trim() ||
    lcStudio.lyricsMode !== "Auto";

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
            <span className="hidden sm:inline">{t("Back to the wall")}</span>
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
              {t("The music studio of the Mirror Entity")}
            </p>
            <p className="mt-0.5 font-serif text-[13.5px] italic text-foreground/75">
              {t("“Describe your music — the Mirror renders exactly that world.”")}
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
            {/* what the intention carries — chips and the paperclip/camera */}
            <div className="mt-2 flex items-center gap-2">
              <AttachmentChips
                attachments={attachments}
                onRemove={(id) =>
                  setAttachments((prev) => prev.filter((a) => a.id !== id))
                }
              />
              <ChatInputExtras
                scope="healing"
                size="2xs"
                withCall={false}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>

            {/* MUSICAL STYLE — the searchable genre contract */}
            <div className="mt-3">
              <GenreSelector
                selected={lcGenres}
                onChange={setLcGenres}
                testId="lc-genre-selector"
              />
            </div>

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
            {(lcShape.lyricsMode === "USER WRITES" || lcStudio.lyricsMode === "I write") && (
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

          {/* modes — creative startpoints */}
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

          {/* ADVANCED CREATIVE CONTROLS — disclosed only when asked */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setStudioOpen((v) => !v)}
              aria-expanded={studioOpen}
              data-testid="lc-studio-toggle"
              className="focus-glow flex w-full items-center justify-center gap-1.5 text-[11.5px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("Studio controls")}
              {showAdvanced && (
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[var(--scope-a)]"
                />
              )}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-300",
                  studioOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence>
              {studioOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 rounded-xl border hairline bg-[var(--glass-bg-soft)] p-3.5">
                    <StudioControls studio={lcStudio} onChange={setLcStudio} />

                    {/* the chamber's own dials — kept for their poetry */}
                    <div className="grid grid-cols-1 gap-3 border-t hairline pt-3 sm:grid-cols-2">
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
                      <ShapeSelect
                        label="Time feel"
                        options={LC_SHAPE.timeFeel}
                        value={lcShape.timeFeel}
                        onChange={(v) => setLcShape({ timeFeel: v })}
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
              onClick={() => {
                const carried = attachments;
                setAttachments([]);
                void generateLightCode({ attachments: carried });
              }}
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
          <InterpretationCard />

          {/* the player — one voice, real art, honest QA */}
          {lcStatus === "ready" && lcTrack && (
            <div className="mt-6">
              <StudioPlayer track={lcTrack} />
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
                      onClick={() => {
                        useMirror.setState({ lcTrack: track, lcStatus: "ready" });
                        usePlayerStore.getState().playTrack(track, lcHistory);
                      }}
                      aria-label={`${t("Play")} ${track.title}`}
                      data-testid={`lc-history-play-${track.id}`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <Play className="size-3 translate-x-[1px]" aria-hidden="true" />
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground/85">
                        {track.title}
                      </span>
                      <span className="mono-label block text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                        {track.genres && track.genres.length > 0
                          ? track.genres.map((g) => t(genreName(g))).join(" + ")
                          : t(
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

          {/* THE GATHERING — shared transmissions, real audio */}
          <GatheringShelf />
        </div>
      </div>
    </div>
  );
}
