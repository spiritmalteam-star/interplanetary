"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Check,
  ChevronDown,
  Copy,
  Dices,
  Download,
  Eye,
  Feather,
  Gauge,
  Mic,
  Music4,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Send,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Volume2,
  VolumeX,
  Wand2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { MusicSequencer } from "./living/MusicSequencer";
import { MirrorBridge } from "./living/MirrorBridge";
import {
  LC_MODES,
  LC_SHAPE,
  type LcBrief,
  type LcLyricOp,
  type LcMode,
} from "@/lib/data/light-codes";
import { cn } from "@/lib/utils";
import { AttachmentChips, ChatInputExtras } from "./ChatInputExtras";
import type { ChatAttachment } from "./attachments";

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the musical chamber, poured in thick purple liquid.  */
/*  A compact two-zone room: on the left the channeling flows (one     */
/*  describe line → the Mirror composes → the brief), on the right     */
/*  everything there is to HEAR (the player, the kept transmissions).  */
/*  The round is four steps, honestly kept:                            */
/*                                                                     */
/*      DESCRIBE → MIRROR COMPOSES → GENERATE → LISTEN                 */
/*                                                                     */
/*  THE FIRST LAW, LITERAL: the style row carries a chip — "No style   */
/*  — just my words". While it stands, every selector dims and locks   */
/*  (inert) and the brief is composed from the visitor's free text     */
/*  ALONE — no chamber, no shape, no voice rides with the ask.         */
/*                                                                     */
/*  The engine's name stays behind the veil; the Mirror is the voice.  */
/*  (Behind that veil: Google DeepMind's Lyria, through the official   */
/*  Gemini API — the keeper's GEMINI_API_KEY opens its door.)          */
/* ------------------------------------------------------------------ */

/* ------------------------- the house's dress ------------------------- */
/*  The musical chamber wears its own accent (--scope-a, the purple of
    the room's liquid) for everything that IS the sound — chips, wave,
    the weave breath — over the slow liquid backdrop (.lc-wash and the
    drifting .lc-blob drops, styled in globals.css). The braided seam
    and three rarely-sung light-language seals stay the house's own.   */

/** The braided seam — a section rule woven of the two kind colors and
 *  the gold, fading at both ends so it never cuts the page. */
const BRAID_RULE =
  "bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--lp-violet)_55%,transparent)_22%,color-mix(in_srgb,var(--lp-feather)_52%,transparent)_50%,color-mix(in_srgb,var(--lp-gold)_72%,transparent)_78%,transparent_100%)]";

/** Scope glass — the quiet chrome of the chamber's controls, tinted
 *  by the room's own accent instead of the old gold. */
const LC_PILL =
  "border-[color-mix(in_srgb,var(--scope-a)_28%,var(--hairline))] bg-[color-mix(in_srgb,var(--scope-a)_6%,var(--glass-bg-soft))] hover:border-[color-mix(in_srgb,var(--scope-a)_50%,transparent)]";

/** The touch veil — small hands stay honest to 44px fingers: the hit
    area breathes out invisibly past the chip's visible edge. */
const TOUCH_VEIL =
  "relative after:absolute after:-inset-2 after:rounded-full after:content-['']";

/** A rarely-used light-language seal resting in an empty corner —
 *  printed as warm bronze ink on the vanilla daylight paper through
 *  lp-sigil-img, glowing softly in the crystal night. It never takes
 *  a touch and never covers a control. */
function SigilMark({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      width={1254}
      height={1254}
      className={cn(
        "lp-sigil-img pointer-events-none absolute select-none opacity-[0.13] dark:opacity-[0.16]",
        className
      )}
    />
  );
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** The long clock — a journey of half an hour and beyond reads its
    hours honestly instead of folding into an endless minute count. */
function fmtTimeLong(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = Math.floor(s % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/* ------------------------- the style row ----------------------------- */

/** A chamber chip — the modes no longer carry cards; one small glass
    chip each, the chamber's number whispered before its name. */
function ModeChip({
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
      title={t(mode.tagline)}
      aria-label={`${mode.n} — ${t(mode.name)}. ${t(mode.tagline)}`}
      className={cn("btn-chip", active && "btn-chip-active")}
    >
      <span className="mono-label text-[9px] opacity-60" aria-hidden="true">
        {mode.n}
      </span>
      <span className="max-w-[150px] truncate">{t(mode.name)}</span>
    </button>
  );
}

/* --------------------------- the player ------------------------------ */

/* THE WAVEFORM'S HONESTY LAW: the wave on the page is either the
   sound's own peaks (WaveSurfer, reading the real audio) or a plain
   progress line — never a decorative imitation of a waveform that
   was never measured. The endless journeys ride the plain line: a
   half-hour piece is never decoded into memory just to be looked at. */

function HonestTimeline({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (ratio: number) => void;
}) {
  return (
    <div
      className="flex h-12 items-center"
      role="slider"
      aria-label="Seek within the transmission"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      data-testid="lc-timeline"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
      }}
    >
      <div className="relative h-[3px] w-full rounded-full bg-[color-mix(in_srgb,var(--scope-a)_20%,transparent)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--scope-a)]"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--scope-a)] shadow-[0_0_10px_-2px_var(--scope-a)]"
          style={{ left: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** The real wave — the sound's own peaks, drawn by WaveSurfer against
    the very element that plays. Never decoded for the long journeys. */
function WaveSurferWave({
  audioEl,
  onFallback,
}: {
  audioEl: HTMLAudioElement | null;
  onFallback: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    let instance: import("wavesurfer.js").default | null = null;
    if (!audioEl || !containerRef.current) return;
    const styles = getComputedStyle(document.documentElement);
    const scopeA = styles.getPropertyValue("--scope-a").trim() || "#a855f7";
    const scopeB = styles.getPropertyValue("--scope-b").trim() || "#d8c9a8";
    import("wavesurfer.js")
      .then(({ default: WS }) => {
        if (cancelled || !containerRef.current) return;
        const created = WS.create({
          container: containerRef.current,
          media: audioEl,
          height: 48,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          normalize: true,
          cursorWidth: 1,
          waveColor: scopeA,
          progressColor: scopeB,
          cursorColor: scopeB,
        });
        instance = created;
        created.on("error", () => onFallback());
      })
      .catch(() => {
        if (!cancelled) onFallback();
      });
    return () => {
      cancelled = true;
      try {
        instance?.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [audioEl]);
  return <div ref={containerRef} data-testid="lc-wave-real" className="h-12" />;
}

/* --------------------- the voice's own door -------------------------- */
/*  THE SIMPLEST ASK — the visitor speaks the music they want to hear;
    the house transcribes their voice and the Mirror proceeds. The
    spoken words are the visitor's own intention, and the First Law
    gives them authority over every selector. */

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("the recording could not be read"));
    reader.readAsDataURL(blob);
  });
}

function VoiceRecordButton({
  onTranscript,
  disabled,
  testId,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  testId: string;
}) {
  const t = useT();
  const rec = useVoiceRecorder();
  const [busyAsr, setBusyAsr] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const stopAndSend = async () => {
    const result = await rec.stop();
    if (!result) return;
    if (result.durationMs < 600) {
      setNote(t("A breath too short — speak once more."));
      return;
    }
    setBusyAsr(true);
    setNote(null);
    try {
      const audio = await blobToDataUrl(result.wav);
      const res = await fetch("/api/asr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio }),
      });
      const data = (await res.json().catch(() => null)) as {
        text?: string;
        error?: string;
      } | null;
      const text = data?.text?.trim();
      if (!res.ok || !text) {
        setNote(t("The words didn't land — speak once more, a little closer."));
        return;
      }
      onTranscript(text.slice(0, 600));
    } catch {
      setNote(t("The words didn't land — speak once more."));
    } finally {
      setBusyAsr(false);
    }
  };

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => {
          setNote(null);
          if (rec.recording) void stopAndSend();
          else void rec.start();
        }}
        disabled={disabled || busyAsr || rec.error === "unavailable"}
        aria-label={
          rec.recording
            ? t("Stop speaking")
            : t("Speak the music you want to hear")
        }
        title={
          rec.error === "denied"
            ? t("The microphone was not given passage — allow it in the browser")
            : undefined
        }
        data-testid={testId}
        aria-pressed={rec.recording}
        className={cn(
          "focus-glow flex size-9 items-center justify-center rounded-full border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35",
          TOUCH_VEIL,
          rec.recording
            ? "border-[color-mix(in_srgb,var(--destructive)_55%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-[var(--destructive)]"
            : cn(LC_PILL, "text-muted-foreground hover:text-foreground")
        )}
      >
        {busyAsr ? (
          <span
            className="size-3.5 animate-spin rounded-full border border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : rec.recording ? (
          <Square className="size-3.5" aria-hidden="true" />
        ) : (
          <Mic className="size-3.5" aria-hidden="true" />
        )}
      </button>
      {rec.recording && (
        <span
          role="status"
          className="absolute -top-9 right-0 z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full border hairline bg-card px-2.5 py-1 text-[11px] text-foreground/85 shadow-sm"
          data-testid={`${testId}-listening`}
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--destructive)]" aria-hidden="true" />
          {t("Listening — speak the music you want to hear")}
        </span>
      )}
      {note && (
        <span
          role="status"
          className="absolute -top-9 right-0 z-10 whitespace-nowrap rounded-full border hairline bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm"
        >
          {note}
        </span>
      )}
    </span>
  );
}

function Player() {
  const track = useMirror((s) => s.lcTrack)!;
  const clearLcPlayer = useMirror((s) => s.clearLcPlayer);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const newVersionFromTrack = useMirror((s) => s.newVersionFromTrack);
  const modeName =
    LC_MODES.find((m) => m.id === track.mode)?.name ?? track.mode;
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(track.duration ?? 0);
  /* the endless journeys are born to turn — their loop stands on from birth */
  const [loop, setLoop] = useState(track.length === "loop");
  const [showTranslation, setShowTranslation] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  /* the honest wave: real peaks when the piece is small enough to
     read them from; a plain line for the long journeys and when the
     wave cannot be read at all */
  const [waveFailed, setWaveFailed] = useState(false);
  const realWaveAllowed = track.length !== "loop" && !waveFailed;

  const progress = dur > 0 ? Math.min(1, time / dur) : 0;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const seekTo = (ratio: number) => {
    const el = audioRef.current;
    if (!el || !dur) return;
    el.currentTime = ratio * dur;
  };

  const applyVolume = (v: number, mute?: boolean) => {
    const el = audioRef.current;
    setVolume(v);
    if (typeof mute === "boolean") setMuted(mute);
    if (el) {
      el.volume = v;
      el.muted = typeof mute === "boolean" ? mute : muted;
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative rounded-2xl p-3.5 sm:p-4"
      data-testid="lc-player"
    >
      <audio
        ref={(el) => {
          audioRef.current = el;
          setAudioEl(el);
        }}
        src={track.audioUrl}
        loop={loop}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration)) {
            setDur(el.duration);
            el.volume = volume;
            el.muted = muted;
          }
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            data-testid="lc-player-mode"
          >
            {t(modeName)}
            {track.length === "full"
              ? " · full song"
              : track.length === "loop"
                ? " · endless journey"
                : " · preview"}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-[16px] font-semibold text-foreground">
            {track.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={clearLcPlayer}
          aria-label={t("Close the player")}
          className={cn(
            "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
            TOUCH_VEIL
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* the wave — the sound's own peaks, or the honest line */}
      {realWaveAllowed ? (
        <WaveSurferWave
          key={track.id}
          audioEl={audioEl}
          onFallback={() => setWaveFailed(true)}
        />
      ) : (
        <HonestTimeline progress={progress} onSeek={seekTo} />
      )}
      {track.length === "loop" && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
          {t(
            "The journey turns on itself — when it ends it begins again, for as long as you listen."
          )}
        </p>
      )}
      <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>{fmtTimeLong(time)}</span>
        <span>{fmtTimeLong(dur)}</span>
      </div>

      {/* THE TRANSPORT — one compact glass bar: play, new version,
          reshape, download, loop, the volume dial and the engine-facing
          words. Every hand a chip; the play hand the only large one. */}
      <div
        className="mt-2.5 flex flex-wrap items-center gap-1 rounded-full border hairline bg-[var(--glass-bg-soft)] p-1"
        data-testid="lc-transport"
      >
        <button
          type="button"
          onClick={toggle}
          data-testid="lc-play"
          aria-label={playing ? t("Pause") : t("Play")}
          className={cn(
            "focus-glow mx-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] text-[#f6f4ef] shadow-[0_4px_20px_-8px_color-mix(in_srgb,var(--scope-a)_85%,transparent)] transition-all duration-300 hover:-translate-y-px",
            TOUCH_VEIL
          )}
        >
          {playing ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-[1px]" aria-hidden="true" />
          )}
        </button>
        <PlayerChip
          onClick={newVersionFromTrack}
          icon={RefreshCw}
          label="New version"
          testId="lc-new-version"
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
          className="btn-chip"
        >
          <Download className="size-3" aria-hidden="true" />
          {t("Download")}
        </a>
        <PlayerChip
          onClick={() => setLoop((l) => !l)}
          icon={Repeat}
          label={loop ? "Looping" : "Loop"}
          active={loop}
          testId="lc-loop"
        />
        {/* the volume hand — the visitor's own quiet dial */}
        <span className="ml-auto flex items-center gap-1 pl-0.5">
          <button
            type="button"
            onClick={() => applyVolume(volume, !muted)}
            aria-label={muted ? t("Unmute") : t("Mute")}
            aria-pressed={muted}
            data-testid="lc-mute"
            className={cn("btn-chip w-8 px-0", TOUCH_VEIL)}
          >
            {muted || volume === 0 ? (
              <VolumeX className="size-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => applyVolume(Number(e.target.value), false)}
            aria-label={t("Volume")}
            data-testid="lc-volume"
            className="h-1 w-12 cursor-pointer accent-[var(--scope-a)] sm:w-16"
          />
        </span>
        {(track.style || track.lyrics) && (
          <PlayerChip
            onClick={() => setShowTranslation((v) => !v)}
            icon={Eye}
            label="Translation"
            active={showTranslation}
            testId="lc-translation"
          />
        )}
      </div>

      {/* TRANSMISSION NOTES */}
      {track.notes && (
        <div className="mt-3 border-t hairline pt-2.5">
          <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
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
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  <span className="mono-label mr-1.5 text-[10px] uppercase tracking-[0.18em]">
                    {t("Sonic language")}
                  </span>
                  {track.style}
                </p>
              )}
              {track.lyrics && (
                <p className="whitespace-pre-line font-serif text-[14px] italic leading-relaxed text-foreground/85">
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
      className={cn("btn-chip", active && "btn-chip-active")}
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
      <p className="mono-label mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{t(label)}</span>
        <span className="text-[10.5px] normal-case tracking-normal text-[var(--scope-a)]">
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
      <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/60">
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
      <span className="mono-label mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {t(label)}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-glow h-8 w-full rounded-lg border hairline bg-[var(--glass-bg)] px-2 text-[13px] text-foreground"
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

/* --------------------- the length toggle ----------------------------- */

function LengthToggle() {
  const lcLength = useMirror((s) => s.lcLength);
  const setLcLength = useMirror((s) => s.setLcLength);
  const prices = useMirror((s) => s.walletPrices);
  const t = useT();
  const previewPrice = prices?.musicPreview ?? 2;
  const fullPrice = prices?.musicFull ?? 5;
  const loopPrice = prices?.musicLoop ?? 15;
  const options = [
    { id: "preview" as const, label: t("Preview · 30s"), price: previewPrice, testId: "lc-length-preview", title: t("A thirty-second listening — 2 lights") },
    { id: "full" as const, label: t("Full song · 3+ min"), price: fullPrice, testId: "lc-length-full", title: t("The whole composition — at least three minutes") },
    { id: "loop" as const, label: t("Endless · ~30 min"), price: loopPrice, testId: "lc-length-loop", title: t("One long seamless journey, woven in six movements, looping for hours") },
  ];
  return (
    <div
      role="group"
      aria-label={t("The transmission's length")}
      className="flex w-fit items-center gap-0.5 rounded-full border hairline p-0.5"
      data-testid="lc-length"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setLcLength(o.id)}
          aria-pressed={lcLength === o.id}
          data-testid={o.testId}
          title={o.title}
          className={cn(
            "focus-glow flex h-6 items-center rounded-full px-2.5 text-[11.5px] transition-colors duration-300",
            lcLength === o.id
              ? "font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          style={
            lcLength === o.id
              ? {
                  backgroundColor:
                    "color-mix(in srgb, var(--scope-a) 13%, transparent)",
                  color: "var(--scope-a)",
                }
              : undefined
          }
        >
          {o.label}
          <span className="ml-1.5 opacity-75" aria-label={t("lights")}>
            ✦{o.price}
          </span>
        </button>
      ))}
    </div>
  );
}

/* --------------------- THE MIRROR'S BRIEF ---------------------------- */
/*  The channeling itself: what the Mirror wrote, laid open for the
    visitor's own hand — the title, the words, the production direction,
    the refinement line and the generate hand. Nothing is woven until
    the visitor strikes generate. After every describe-send the room
    scrolls here and hands this sheet the focus.                        */

const LYRIC_HANDS: { op: LcLyricOp; label: string }[] = [
  { op: "generate", label: "Write lyrics" },
  { op: "rewrite", label: "Rewrite" },
  { op: "rhyme", label: "Improve rhyme" },
  { op: "language", label: "Into my language" },
  { op: "tone", label: "Warmer tone" },
  { op: "chorus", label: "Shape the chorus" },
  { op: "simplify", label: "Simpler" },
  { op: "poetic", label: "More poetic" },
];

function BriefCard() {
  const brief = useMirror((s) => s.lcBrief)!;
  const busyOp = useMirror((s) => s.lcBusyOp);
  const labNote = useMirror((s) => s.lcLabNote);
  const refineNote = useMirror((s) => s.lcRefineNote);
  const drafts = useMirror((s) => s.lcLyricsDrafts);
  const status = useMirror((s) => s.lcStatus);
  const updateBriefDraft = useMirror((s) => s.updateBriefDraft);
  const weaveBrief = useMirror((s) => s.weaveBrief);
  const refineBrief = useMirror((s) => s.refineBrief);
  const lyricsLabOp = useMirror((s) => s.lyricsLabOp);
  const restoreLyricsDraft = useMirror((s) => s.restoreLyricsDraft);
  const clearLcBrief = useMirror((s) => s.clearLcBrief);
  /* the honesty line, read live from the store — has a sound already
     been woven this session? */
  const hasAudio = useMirror((s) => Boolean(s.lcTrack));
  const t = useT();

  const [styleOpen, setStyleOpen] = useState(false);
  const [refine, setRefine] = useState("");
  const [copied, setCopied] = useState(false);

  const weaving = status === "polling";
  const labBusy = busyOp !== null;

  const copyLyrics = async () => {
    if (!brief.lyrics) return;
    try {
      await navigator.clipboard.writeText(brief.lyrics);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* the clipboard rests — the sheet stays editable by hand */
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="scope-frame-card relative rounded-2xl p-3.5 sm:p-4"
      data-testid="lc-brief"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            {t("The Mirror's brief")}
          </p>
          <label htmlFor="lc-brief-title" className="sr-only">
            {t("Composition title")}
          </label>
          <input
            id="lc-brief-title"
            type="text"
            value={brief.title}
            onChange={(e) => updateBriefDraft({ title: e.target.value })}
            placeholder={t("Composition title")}
            maxLength={90}
            data-testid="lc-brief-title"
            className="focus-glow mt-0.5 w-full truncate rounded-lg border border-transparent bg-transparent font-serif text-[17px] font-semibold text-foreground outline-none transition-colors duration-300 hover:border-[var(--hairline)] focus:border-[var(--hairline)]"
          />
        </div>
        <button
          type="button"
          onClick={clearLcBrief}
          aria-label={t("Lay the brief down")}
          data-testid="lc-brief-dismiss"
          className={cn(
            "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
            TOUCH_VEIL
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {brief.notes && (
        <p className="mt-1 text-[14px] italic leading-relaxed text-foreground/80">
          {brief.notes}
        </p>
      )}

      {/* ---------- THE LYRICS LABORATORY ---------- */}
      {brief.lyrics !== null && (
        <div className="mt-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="mono-label flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Feather className="size-3.5" aria-hidden="true" />
              {t("The Lyrics Laboratory")}
            </p>
            <div className="flex items-center gap-1">
              {brief.lyrics && (
                <button
                  type="button"
                  onClick={() => void copyLyrics()}
                  aria-label={t("Copy the lyrics")}
                  data-testid="lc-lyrics-copy"
                  className={cn(
                    "focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
                    TOUCH_VEIL
                  )}
                >
                  {copied ? (
                    <Check className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          </div>
          <label htmlFor="lc-brief-lyrics" className="sr-only">
            {t("The lyric sheet")}
          </label>
          <textarea
            id="lc-brief-lyrics"
            rows={Math.min(10, Math.max(3, (brief.lyrics ?? "").split("\n").length + 1))}
            value={brief.lyrics ?? ""}
            onChange={(e) => updateBriefDraft({ lyrics: e.target.value })}
            placeholder={t("The words the song will carry — write them here, or ask a craft hand below.")}
            maxLength={1200}
            data-testid="lc-brief-lyrics"
            className="focus-glow nice-scroll mt-1.5 w-full resize-none rounded-lg border border-transparent bg-transparent px-1 font-serif text-[14px] italic leading-relaxed text-foreground outline-none transition-colors duration-300 placeholder:text-muted-foreground/50 hover:border-[var(--hairline)] focus:border-[var(--hairline)]"
          />
          {/* the craft hands — one at a time */}
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="lc-lyric-hands">
            {LYRIC_HANDS.map((hand) => (
              <button
                key={hand.op}
                type="button"
                disabled={labBusy || weaving}
                onClick={() => void lyricsLabOp(hand.op)}
                aria-label={`${t(hand.label)} — a craft hand of the Lyrics Laboratory`}
                data-testid={`lc-lyric-${hand.op}`}
                className={cn(
                  "btn-chip h-7 px-2.5 text-[12px]",
                  busyOp === `lyrics:${hand.op}` && "btn-chip-active"
                )}
              >
                {busyOp === `lyrics:${hand.op}` && (
                  <span
                    className="inline-block size-1.5 animate-pulse rounded-full bg-[var(--scope-a)]"
                    aria-hidden="true"
                  />
                )}
                {t(hand.label)}
              </button>
            ))}
          </div>
          {/* the restore shelf — previous sheets of this session */}
          {drafts.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Undo2 className="size-3 text-muted-foreground/70" aria-hidden="true" />
              {drafts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => restoreLyricsDraft(i)}
                  disabled={labBusy || weaving}
                  data-testid={`lc-lyrics-restore-${i}`}
                  className="focus-glow rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:opacity-45"
                >
                  {t("Restore previous draft")}
                  {i > 0 ? ` · ${i + 1}` : ""}
                </button>
              ))}
            </div>
          )}
          {labNote && (
            <p className="mt-2 text-[12.5px] italic leading-relaxed text-muted-foreground" data-testid="lc-lab-note">
              {labNote}
            </p>
          )}
        </div>
      )}

      {/* ---------- THE PRODUCTION DIRECTION — revealed on request ---------- */}
      {brief.style && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setStyleOpen((v) => !v)}
            aria-expanded={styleOpen}
            data-testid="lc-brief-style-toggle"
            className={cn(
              "focus-glow mx-auto flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] uppercase tracking-[0.18em] text-muted-foreground transition-all duration-300 hover:text-foreground",
              LC_PILL
            )}
          >
            {t("The production direction")}
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-300", styleOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          <AnimatePresence>
            {styleOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <label htmlFor="lc-brief-style" className="sr-only">
                  {t("The production direction")}
                </label>
                <textarea
                  id="lc-brief-style"
                  rows={5}
                  value={brief.style}
                  onChange={(e) => updateBriefDraft({ style: e.target.value })}
                  maxLength={1400}
                  data-testid="lc-brief-style"
                  className="focus-glow nice-scroll mt-2 w-full resize-none rounded-lg border hairline bg-transparent px-3 py-2 font-mono text-[12px] leading-relaxed text-muted-foreground outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ---------- THE REFINEMENT LINE — conversation shapes the brief ---------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const word = refine;
          setRefine("");
          void refineBrief(word);
        }}
        className="mt-3.5"
        data-testid="lc-refine-form"
      >
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={refine}
            onChange={(e) => setRefine(e.target.value)}
            placeholder={t("Tell the Mirror what to change — \u201cmake it more emotional\u201d\u2026")}
            aria-label={t("Tell the Mirror what to change")}
            maxLength={300}
            disabled={labBusy || weaving}
            data-testid="lc-refine-input"
            className="focus-glow h-9 min-w-0 flex-1 rounded-full border hairline bg-background/60 px-3.5 text-[13.5px] text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/55 disabled:opacity-50"
          />
          <VoiceRecordButton
            testId="lc-refine-voice"
            disabled={labBusy || weaving}
            onTranscript={(text) => {
              setRefine("");
              void refineBrief(text);
            }}
          />
          <button
            type="submit"
            disabled={labBusy || weaving || !refine.trim()}
            aria-label={t("Reshape the brief")}
            data-testid="lc-refine-send"
            className={cn(
              "focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] text-[var(--scope-a)] transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-35",
              TOUCH_VEIL
            )}
          >
            <Send className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>

      {refineNote && (
        <p
          className="mt-2 rounded-lg border border-[color-mix(in_srgb,var(--scope-a)_28%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_6%,transparent)] px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground"
          data-testid="lc-refine-note"
        >
          {refineNote}
        </p>
      )}

      {/* ---------- THE GENERATE HAND — the visitor strikes the weave ---------- */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t hairline pt-3">
        <LengthToggle />
        <button
          type="button"
          onClick={() => void weaveBrief()}
          disabled={labBusy || weaving}
          data-testid="lc-weave"
          aria-label={
            hasAudio && status !== "polling"
              ? t("Weave a new version")
              : t("Generate the transmission")
          }
          className={cn(
            "focus-glow flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] px-4 text-[13.5px] font-semibold text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
            TOUCH_VEIL
          )}
        >
          <AudioLines className="size-4" aria-hidden="true" />
          {hasAudio && status !== "polling" ? t("Weave again") : t("Weave")}
        </button>
      </div>
      <PriceLine />
      {hasAudio && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/75">
          {t(
            "Generating weaves a fresh version — the engine does not edit a sound already woven."
          )}
        </p>
      )}
    </motion.section>
  );
}

/* ------------------------- the price line ---------------------------- */
/*  The honest weigh, spoken before the hand strikes: what this weave
    costs, what the purse holds — and the keeper's own freedom.        */

function PriceLine() {
  const lcLength = useMirror((s) => s.lcLength);
  const wallet = useMirror((s) => s.wallet);
  const prices = useMirror((s) => s.walletPrices);
  const t = useT();
  const price =
    lcLength === "loop"
      ? prices?.musicLoop ?? 15
      : lcLength === "full"
        ? prices?.musicFull ?? 5
        : prices?.musicPreview ?? 2;
  /* THE ONE PURSE — no free ride for any hand, the keeper's included:
     the honest weigh is spoken the same way to every visitor. */
  if (!wallet) return null;
  return (
    <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground/75" data-testid="lc-price-line">
      {t("This weave weighs {price} light — the purse holds {total}.", {
        price,
        total: wallet.total,
      })}
      {wallet.total < price
        ? " " + t("Bring more light and the loom turns for you.")
        : ""}
    </p>
  );
}

/* ------------------- THE KEEPER'S DIAGNOSTIC ------------------------ */
/*  The chamber status, for the keeper's own eyes only: the server's
    403 answer is silence — an ordinary visitor never sees this at all. */

interface LcEngineStatus {
  provider: string;
  via: string;
  keyConfigured: boolean;
  models: {
    preview: { id: string; purpose: string };
    full: { id: string; purpose: string };
  };
  limits: { previewPerKeeperPerDay: number; fullPerKeeperPerDay: number; globalPerDay: number };
  weavingNow: number;
  generationsToday: number;
  lastSuccess: { model: string; at: number } | null;
  lastError: { code: string; message: string; at: number } | null;
  instanceNote: string;
}

function StatusRow({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="mono-label shrink-0 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
        {k}
      </span>
      <span
        className={cn(
          "truncate text-right text-[11.5px]",
          warn ? "text-[color-mix(in_srgb,var(--destructive)_75%,var(--foreground))]" : "text-foreground/80"
        )}
      >
        {v}
      </span>
    </div>
  );
}

function ChamberStatus() {
  const t = useT();
  const [status, setStatus] = useState<LcEngineStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/light-codes/status")
      .then(async (r) => {
        if (!alive || !r.ok) return;
        const data = (await r.json().catch(() => null)) as LcEngineStatus | null;
        if (alive && data) setStatus(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  /* not the keeper — the room keeps its silence */
  if (!status) return null;

  return (
    <section className="mt-6" aria-label={t("Chamber status")} data-testid="lc-status">
      <div className={cn("mb-3 h-px w-full", BRAID_RULE)} aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="lc-status-toggle"
        className="focus-glow flex w-fit items-center gap-1.5 text-[10.5px] uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        <Gauge className="size-3.5" aria-hidden="true" />
        {t("Chamber status")}
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="nice-scroll mt-2 max-h-72 overflow-y-auto rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_4%,var(--glass-bg-soft))] p-3.5"
              data-testid="lc-status-panel"
            >
              <StatusRow k={t("Provider")} v={status.provider} />
              <StatusRow k={t("Door")} v={status.via} />
              <StatusRow
                k={t("Engine key")}
                v={status.keyConfigured ? t("placed") : t("not placed — add GEMINI_API_KEY")}
                warn={!status.keyConfigured}
              />
              <StatusRow
                k={t("Preview model")}
                v={`${status.models.preview.id} · ${
                  status.lastSuccess?.model === status.models.preview.id
                    ? t("verified")
                    : t("unverified")
                }`}
              />
              <StatusRow
                k={t("Full model")}
                v={`${status.models.full.id} · ${
                  status.lastSuccess?.model === status.models.full.id
                    ? t("verified")
                    : t("unverified")
                }`}
              />
              <StatusRow
                k={t("Last successful weave")}
                v={
                  status.lastSuccess
                    ? new Date(status.lastSuccess.at).toLocaleString()
                    : t("none yet")
                }
              />
              {status.lastError && (
                <StatusRow
                  k={t("Engine's last word")}
                  v={`${status.lastError.code} — ${status.lastError.message}`}
                  warn
                />
              )}
              <StatusRow
                k={t("Daily allowance")}
                v={`${status.limits.previewPerKeeperPerDay} ${t("previews")} · ${status.limits.fullPerKeeperPerDay} ${t("full")} · ${status.limits.globalPerDay} ${t("house total")}`}
              />
              <StatusRow
                k={t("Today")}
                v={`${status.generationsToday} ${t("woven")} · ${status.weavingNow} ${t("weaving now")}`}
              />
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/60">
                {status.instanceNote}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ----------------------------- the world ----------------------------- */

export function LightCodesView() {
  const lcMode = useMirror((s) => s.lcMode);
  const lcCivilization = useMirror((s) => s.lcCivilization);
  const lcIntention = useMirror((s) => s.lcIntention);
  const lcUserLyrics = useMirror((s) => s.lcUserLyrics);
  const lcShape = useMirror((s) => s.lcShape);
  const lcStatus = useMirror((s) => s.lcStatus);
  const lcBrief = useMirror((s) => s.lcBrief);
  const lcTrack = useMirror((s) => s.lcTrack);
  const lcError = useMirror((s) => s.lcError);
  const lcHistory = useMirror((s) => s.lcHistory);
  const lcLength = useMirror((s) => s.lcLength);
  const lcRaw = useMirror((s) => s.lcRaw);
  const setLcMode = useMirror((s) => s.setLcMode);
  const setLcCivilization = useMirror((s) => s.setLcCivilization);
  const setLcIntention = useMirror((s) => s.setLcIntention);
  const setLcUserLyrics = useMirror((s) => s.setLcUserLyrics);
  const setLcShape = useMirror((s) => s.setLcShape);
  const setLcRaw = useMirror((s) => s.setLcRaw);
  const composeBrief = useMirror((s) => s.composeBrief);
  const weaveBrief = useMirror((s) => s.weaveBrief);
  const generateLightCode = useMirror((s) => s.generateLightCode);
  const surpriseMe = useMirror((s) => s.surpriseMe);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const forgetLc = useMirror((s) => s.forgetLc);
  const t = useT();

  const [shapeOpen, setShapeOpen] = useState(false);
  /* what the transmission carries — one image, up to three documents */
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const lcNotice = useMirror((s) => s.lcNotice);
  const playLc = useMirror((s) => s.playLc);
  /* THE TWO BENCHES — the chamber's own instruments: the standing
     transmissions (the Mirror's briefs woven by the engine) and the
     local sequencer (a genuine instrument that plays on the visitor's
     own device, no server, no credits). The transmissions stay the
     default; the sequencer mounts only when chosen, so its device
     breath is released the moment the bench is left. */
  const [bench, setBench] = useState<"transmissions" | "sequencer">(
    "transmissions"
  );

  const mode = LC_MODES.find((m) => m.id === lcMode) ?? LC_MODES[0];
  const busy = lcStatus === "interpreting" || lcStatus === "polling";

  /* FOCUS THE CHANNELING — after the visitor sends their describe
     input, the room glides to the Mirror's brief and hands it the
     focus (scrollIntoView nearest, smooth unless reduced motion is
     asked; the focus is real, so screen readers land on the sheet).
     An aria-live line above announces the composing and its arrival. */
  const briefFocusRef = useRef<HTMLDivElement | null>(null);
  const focusChanneling = useCallback(() => {
    const el = briefFocusRef.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
    window.setTimeout(
      () => el.focus({ preventScroll: true }),
      reduce ? 0 : 280
    );
  }, []);

  /* the one describe-send — the words go up; when the brief comes
     back, the channeling takes the stage */
  const sendDescribe = useCallback(
    (opts?: { intention?: string; attachments?: ChatAttachment[] }) => {
      void composeBrief(opts).then((ok) => {
        if (ok) window.setTimeout(focusChanneling, 120);
      });
    },
    [composeBrief, focusChanneling]
  );

  return (
    <div className="scope-lightcodes relative flex h-full flex-col">
      {/* THE THICK LIQUID — the room's signature atmosphere: one layered
          wash of radial and conic purple light over the glass, three
          enormous blurred drops drifting through it on 36–58 second
          loops (CSS-only transforms; they rest under the eco tier and
          for reduced-motion visitors), and three rarely-sung
          light-language seals in the empty corners. Decoration never
          takes a touch and never covers a control. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="lc-wash absolute inset-0" />
        <div className="lc-blob lc-blob-a" />
        <div className="lc-blob lc-blob-b" />
        <div className="lc-blob lc-blob-c" />
        {/* intricate_04 — unsung anywhere else in the realm */}
        <SigilMark
          src="/sigils/intricate_04.png"
          className="-right-8 -top-9 size-[clamp(140px,26vw,250px)] [transform:rotate(12deg)] opacity-[0.12] sm:-right-4 dark:opacity-[0.16] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--scope-a)_55%,transparent))]"
        />
        {/* sigil_02 — a light-language mark no other room has worn */}
        <SigilMark
          src="/sigils/sigil_02.png"
          className="-left-12 top-[38%] size-[clamp(150px,24vw,270px)] [transform:rotate(-8deg)] opacity-[0.12] sm:-left-8 dark:opacity-[0.15] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--scope-a)_55%,transparent))]"
        />
        {/* intricate_09 — sung once, long ago, in the guide's pages */}
        <SigilMark
          src="/sigils/intricate_09.png"
          className="-bottom-10 -right-8 size-[clamp(140px,24vw,260px)] [transform:rotate(9deg)] opacity-[0.13] sm:-right-5 dark:opacity-[0.16] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--scope-b)_60%,transparent))]"
        />
      </div>

      {/* ---------- the chamber ---------- */}
      <div
        className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="light-codes"
      >
        <div className="mx-auto w-full max-w-[1020px] px-4 pb-10 pt-3 sm:px-6">
          {/* THE TWO BENCHES — one quiet switch between the Mirror's
              studio and the visitor's own local instrument */}
          <div
            role="group"
            aria-label={t("Choose the bench")}
            className="flex justify-center"
          >
            <div className="flex items-center gap-1 rounded-full border hairline p-1">
              <button
                type="button"
                onClick={() => setBench("transmissions")}
                aria-pressed={bench === "transmissions"}
                data-testid="lc-bench-transmissions"
                className="btn-chip h-7 px-3 text-[12px]"
                style={
                  bench === "transmissions"
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                        color: "var(--scope-a)",
                        boxShadow:
                          "inset 0 0 0 1px color-mix(in srgb, var(--scope-a) 35%, transparent)",
                      }
                    : undefined
                }
              >
                <AudioLines className="size-3.5" aria-hidden="true" />
                {t("Transmissions")}
              </button>
              <button
                type="button"
                onClick={() => setBench("sequencer")}
                aria-pressed={bench === "sequencer"}
                data-testid="lc-bench-sequencer"
                className="btn-chip h-7 px-3 text-[12px]"
                style={
                  bench === "sequencer"
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                        color: "var(--scope-a)",
                        boxShadow:
                          "inset 0 0 0 1px color-mix(in srgb, var(--scope-a) 35%, transparent)",
                      }
                    : undefined
                }
              >
                <Music4 className="size-3.5" aria-hidden="true" />
                {t("Sequencer")}
              </button>
            </div>
          </div>

          {bench === "sequencer" ? (
            /* THE LOCAL INSTRUMENT — mounts only while chosen; the
               bridge rides at the room's own corner with the pattern
               read at ask-time from the visitor's saved pattern */
            <div className="relative mx-auto mt-4 max-w-[720px]">
              <MusicSequencer />
              <MirrorBridge
                workspaceKey="lightcodes"
                buildContext={() => {
                  try {
                    const raw = window.localStorage.getItem("mirror:music-pattern");
                    if (!raw) return null;
                    const p = JSON.parse(raw) as {
                      tempo?: number;
                      pattern?: boolean[][];
                      mutes?: boolean[];
                    };
                    if (!p?.pattern) return null;
                    const names = ["Kick", "Hush", "Breath", "Tone"];
                    const lines = p.pattern
                      .map((row, i) => {
                        if (p.mutes?.[i]) return `${names[i]}: muted`;
                        const on = row
                          .map((v, s) => (v ? s + 1 : 0))
                          .filter(Boolean)
                          .join(",");
                        return on ? `${names[i]}: steps ${on}` : null;
                      })
                      .filter(Boolean);
                    if (lines.length === 0) return null;
                    return `${t("Tempo")}: ${p.tempo ?? "?"} bpm\n${lines.join("\n")}`;
                  } catch {
                    return null;
                  }
                }}
              />
            </div>
          ) : (
            <>
            {/* the round's own voice, for those who listen otherwise */}
            <p aria-live="polite" className="sr-only" data-testid="lc-round-live">
              {lcStatus === "interpreting"
                ? t("The Mirror is composing the brief from your words…")
                : lcBrief && lcStatus !== "ready"
                  ? t("The Mirror's brief is ready — shape it, or weave it into sound.")
                  : ""}
            </p>

            {/* THE TWO ZONES — the channeling flows on the left, the
                listening rests on the right; one column on small hands */}
            <div className="mt-3 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
              {/* ================= LEFT — describe & channeling ================= */}
              <div className="flex min-w-0 flex-col">
                {/* THE DESCRIBE LINE — the ask, spoken or typed, with the
                    paperclip and the voice; sending it begins the
                    channeling and the room turns to the brief below. */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const carried = attachments;
                    setAttachments([]);
                    sendDescribe({ attachments: carried });
                  }}
                  className="relative rounded-2xl border hairline bg-card/85 p-2 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.55)] backdrop-blur-md"
                  data-testid="lc-composer"
                >
                  <AttachmentChips
                    attachments={attachments}
                    onRemove={(id) =>
                      setAttachments((prev) => prev.filter((a) => a.id !== id))
                    }
                    accentVar="var(--scope-a)"
                    testId="lc-attachments"
                  />
                  <div className="flex items-center gap-1.5">
                    <VoiceRecordButton
                      testId="lc-voice"
                      disabled={busy}
                      onTranscript={(text) => {
                        /* THE SIMPLEST ROUND — they speak, the Mirror proceeds */
                        setLcIntention(text);
                        const carried = attachments;
                        setAttachments([]);
                        sendDescribe({ intention: text, attachments: carried });
                      }}
                    />
                    <input
                      type="text"
                      value={lcIntention}
                      onChange={(e) => setLcIntention(e.target.value)}
                      placeholder={
                        lcRaw
                          ? t("Just your words — the Mirror adds no style of its own.")
                          : t(mode.placeholder)
                      }
                      aria-label={
                        lcRaw
                          ? t("Your words — the only style")
                          : t(mode.placeholder)
                      }
                      maxLength={600}
                      data-testid="lc-intention"
                      className="focus-glow h-10 min-w-0 flex-1 rounded-full border hairline bg-background/70 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60 transition-all duration-300"
                    />
                    <ChatInputExtras
                      scope="healing"
                      size="2xs"
                      withCall={false}
                      mobileLarger
                      accentVar="var(--scope-a)"
                      disabled={busy}
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      aria-label={
                        mode.id === "mirror-transmission"
                          ? t("Compose with the Mirror")
                          : t("Ask the Mirror to compose")
                      }
                      data-testid="lc-generate"
                      className={cn(
                        "focus-glow flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] px-4 text-[13px] font-semibold text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35",
                        TOUCH_VEIL
                      )}
                    >
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {t("Compose")}
                    </button>
                  </div>
                  <div className="mt-1.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void surpriseMe()}
                      disabled={busy}
                      data-testid="lc-surprise"
                      aria-label={t("Surprise me — let the Mirror choose")}
                      className="btn-chip h-7 px-3 text-[11.5px] disabled:opacity-45"
                    >
                      <Dices className="size-3" aria-hidden="true" />
                      {t("Surprise me")}
                    </button>
                  </div>
                </form>

                {/* THE STYLE ROW — the First Law, literal: the no-style
                    chip stands first. While it is held, every selector
                    below dims and locks (inert) — the brief is composed
                    from the visitor's words ALONE. */}
                <div
                  role="group"
                  aria-label={t("The style of the transmission")}
                  className="mt-3 flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLcRaw(!lcRaw)}
                      aria-pressed={lcRaw}
                      data-testid="lc-raw"
                      title={t(
                        "No style — just my words: the brief is composed from this input alone"
                      )}
                      aria-label={t(
                        "No style — just my words: the brief is composed from your input alone, every selector set aside"
                      )}
                      className={cn(
                        "btn-chip",
                        lcRaw && "btn-chip-active border-dashed"
                      )}
                    >
                      <Type className="size-3.5" aria-hidden="true" />
                      {t("No style — just my words")}
                    </button>
                  </div>

                  {/* everything a selector — locked while the words stand alone */}
                  <div
                    inert={lcRaw ? true : undefined}
                    data-testid="lc-style-selectors"
                    className={cn(
                      "flex flex-col gap-2.5 transition-opacity duration-300",
                      lcRaw && "pointer-events-none opacity-40"
                    )}
                  >
                    {/* the chambers — one row of small glass chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LC_MODES.map((m) => (
                        <ModeChip
                          key={m.id}
                          mode={m}
                          active={m.id === lcMode}
                          onClick={() => setLcMode(m.id)}
                        />
                      ))}
                    </div>

                    {/* one-tap intents of the chosen chamber */}
                    {mode.intents && (
                      <div className="flex flex-wrap gap-1.5">
                        {mode.intents.map((intent) => (
                          <button
                            key={intent}
                            type="button"
                            onClick={() => setLcIntention(intent)}
                            className={cn("btn-chip h-7 text-[12px]", LC_PILL)}
                          >
                            {t(intent)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* civilizations */}
                    {mode.civilizations && (
                      <div className="flex flex-wrap gap-1.5">
                        {mode.civilizations.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setLcCivilization(lcCivilization === c.id ? null : c.id)
                            }
                            aria-pressed={lcCivilization === c.id}
                            className={cn(
                              "btn-chip h-7 text-[12px]",
                              lcCivilization === c.id && "btn-chip-active"
                            )}
                          >
                            {t(c.name)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* the visitor's own lyrics */}
                    {lcShape.lyricsMode === "USER WRITES" && (
                      <div>
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
                          className="focus-glow w-full resize-none rounded-xl border hairline bg-transparent px-3 py-2 font-serif text-[14px] italic leading-relaxed text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    )}

                    {/* SHAPE THE TRANSMISSION — hidden until asked */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShapeOpen((v) => !v)}
                        aria-expanded={shapeOpen}
                        data-testid="lc-shape-toggle"
                        className={cn(
                          "focus-glow mx-auto flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] uppercase tracking-[0.2em] text-muted-foreground transition-all duration-300 hover:text-foreground",
                          LC_PILL
                        )}
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
                            <div className="mt-2.5 space-y-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_4%,var(--glass-bg-soft))] p-3.5">
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
                  </div>

                  {/* the raw whisper — the law, spoken once */}
                  {lcRaw && (
                    <p
                      className="text-[11.5px] italic leading-relaxed text-muted-foreground/80"
                      data-testid="lc-raw-whisper"
                    >
                      {t(
                        "Your words alone — no chamber, shape or voice rides with the ask."
                      )}
                    </p>
                  )}
                </div>

                {/* the chamber at work — the results breathe here, in the
                    channeling's own column (the only place the room scrolls) */}
                <div className="mt-4 flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {busy && (
                      <motion.div
                        key="busy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 flex flex-col items-center"
                        aria-live="polite"
                        aria-busy="true"
                        data-testid="lc-busy"
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
                        <p className="mt-2 text-[13.5px] italic text-muted-foreground">
                          {lcStatus === "interpreting"
                            ? t("The Mirror is translating intention into sound…")
                            : lcLength === "full"
                              ? t("The full song is being woven — verses finding their chorus…")
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
                        className="mt-1 rounded-xl border border-[color-mix(in_srgb,var(--destructive)_30%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3 text-center"
                        data-testid="lc-error"
                      >
                        <p className="text-[14px] leading-relaxed text-foreground/85">
                          {lcError}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            /* a standing brief is woven again; no brief asks
                               the Mirror for a fresh round */
                            if (lcBrief) void weaveBrief();
                            else void generateLightCode();
                          }}
                          data-testid="lc-ask-again"
                          className="focus-glow mt-2 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          {t("Ask again")}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* a gentle word for the shelf — a sound the device no longer holds */}
                {lcNotice && lcStatus !== "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,var(--glass-bg-soft))] px-4 py-3 text-center"
                    data-testid="lc-notice"
                  >
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground">{lcNotice}</p>
                  </motion.div>
                )}

                {/* THE MIRROR'S BRIEF — the channeling, before the sound.
                    This sheet takes the focus after every describe-send. */}
                {lcBrief && lcStatus !== "ready" && (
                  <div
                    ref={briefFocusRef}
                    tabIndex={-1}
                    data-testid="lc-brief-wrap"
                    className="mt-4 scroll-mt-4 outline-none"
                  >
                    <BriefCard />
                  </div>
                )}
              </div>

              {/* ================= RIGHT — the listen zone ================= */}
              <div className="flex min-w-0 flex-col lg:sticky lg:top-2">
                {/* the player */}
                {lcStatus === "ready" && lcTrack && <Player />}

                {/* MY TRANSMISSIONS — the shelf of kept sounds */}
                {lcHistory.length > 0 && (
                  <section className="mt-4 lg:mt-0" aria-label={t("My transmissions")}>
                    <p className="mono-label mb-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                      {t("My transmissions")}
                    </p>
                    <div className="nice-scroll max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {lcHistory.map((track) => (
                        <div
                          key={track.id}
                          className="group flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--scope-a)_24%,var(--hairline))] bg-[var(--glass-bg-soft)] px-2.5 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => void playLc(track)}
                            aria-label={`${t("Play")} ${track.title}`}
                            data-testid={`lc-history-play-${track.id}`}
                            className={cn(
                              "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground",
                              TOUCH_VEIL
                            )}
                          >
                            <Play className="size-3 translate-x-[1px]" aria-hidden="true" />
                          </button>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-foreground/85">
                              {track.title}
                            </span>
                            <span className="mono-label block text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
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
                            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Wand2 className="size-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => forgetLc(track.id)}
                            aria-label={`${t("Forget")} ${track.title}`}
                            className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* the listen zone's empty breath — honest, before the
                    first weave has ever landed here */}
                {!busy &&
                  !(lcStatus === "ready" && lcTrack) &&
                  lcHistory.length === 0 && (
                    <div
                      className="scope-frame-card flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-8 text-center"
                      data-testid="lc-listen-empty"
                    >
                      <AudioLines
                        className="size-5 text-[var(--scope-a)] opacity-70"
                        aria-hidden="true"
                      />
                      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                        {t(
                          "Nothing woven yet — the sounds you weave will rest here, ready to listen."
                        )}
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* THE KEEPER'S DIAGNOSTIC — silence for every ordinary visitor */}
            <ChamberStatus />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
