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
  Heart,
  ListMusic,
  Mic,
  MoreHorizontal,
  Music4,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Repeat1,
  Send,
  SkipBack,
  SkipForward,
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

/* THE DOOR'S OWN VOICE — the machinery's two refusals (a passage asked
   for, a purse run dry) are spoken by the Mirror, never by the
   machinery; the unlock modal itself rises beside these words. */
function doorVoice(error: string): string {
  const e = error.trim();
  if (e === "SIGN_IN_REQUIRED")
    return "The purse has spent its gift — a passage carries the next five hundred lights.";
  if (e === "INSUFFICIENT_CREDITS")
    return "The purse has run dry — bring more light and the mirror keeps speaking.";
  return error;
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

/* THE STAGE AT THE DOOR — the room's own media player, pinned above
   everything: the transmission now playing, the hands that move it
   (back, play, forward, the repeat dial, the volume), and the shelf
   of every sound this device still holds. When a new weave lands,
   the stage answers with a light — the camera is already here. */

/* THE WEAVING BARS — the channeling's own seven-bar breath, shared by
   the stage (where the sound will land) and the strip beneath it. */
function WeavingBars() {
  return (
    <div className="flex h-8 shrink-0 items-end gap-[3px]" aria-hidden="true">
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
  );
}

function PlayerBar() {
  const track = useMirror((s) => s.lcTrack);
  const status = useMirror((s) => s.lcStatus);
  const history = useMirror((s) => s.lcHistory);
  const repeat = useMirror((s) => s.lcRepeat);
  const lcLength = useMirror((s) => s.lcLength);
  const lcNotice = useMirror((s) => s.lcNotice);
  const setLcRepeat = useMirror((s) => s.setLcRepeat);
  const lcAdvance = useMirror((s) => s.lcAdvance);
  const playLc = useMirror((s) => s.playLc);
  const clearLcPlayer = useMirror((s) => s.clearLcPlayer);
  const reshapeLc = useMirror((s) => s.reshapeLc);
  const newVersionFromTrack = useMirror((s) => s.newVersionFromTrack);
  const forgetLc = useMirror((s) => s.forgetLc);
  const toggleLcFavorite = useMirror((s) => s.toggleLcFavorite);
  const t = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [waveFailed, setWaveFailed] = useState(false);
  /* THE QUIET MORE-DOOR — the craft hands (new version, reshape,
     download, translation) rest folded inside one more-hand, so
     the transport stays small, symmetric and uncluttered */
  const [moreOpen, setMoreOpen] = useState(false);
  /* the stage answers a fresh weave with one slow breath of light */
  const [glow, setGlow] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const seenTrack = useRef<string | null>(null);
  const live = status === "ready" && track !== null;
  /* THE CHANNELING'S STAGE — the weaving is seen forming in the very
     player that will hold the sound: while the chamber works, the
     stage carries the animation (full, when no sound holds the room
     yet; a quiet strip beneath the transport when one does). */
  const weaving = status === "interpreting" || status === "polling";
  const weavePhrase = !weaving
    ? ""
    : status === "interpreting"
      ? t("The Mirror is translating intention into sound…")
      : (lcLength === "loop" || lcLength === "full") && lcNotice
        ? lcNotice
        : lcLength === "full"
          ? t("The full song is being woven — verses finding their chorus…")
          : t("The sound is being woven — hold still…");
  const active = track;
  const realWaveAllowed = !!active && active.length !== "loop" && !waveFailed;
  const progress = active && dur > 0 ? Math.min(1, time / dur) : 0;

  /* THE CAMERA'S LAW — the moment a woven (or chosen) transmission
     takes the stage, the stage breathes once and holds the focus. */
  useEffect(() => {
    if (!active) {
      seenTrack.current = null;
      return;
    }
    if (seenTrack.current === active.id) return;
    seenTrack.current = active.id;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = stageRef.current;
    el?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    const focusTimer = window.setTimeout(
      () => el?.focus({ preventScroll: true }),
      reduce ? 0 : 320
    );
    const glowOn = window.setTimeout(() => setGlow(true), 0);
    const glowOff = window.setTimeout(
      () => setGlow(false),
      reduce ? 600 : 2400
    );
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(glowOn);
      window.clearTimeout(glowOff);
    };
  }, [active?.id]);

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

  /* the repeat dial's own cycle: off → all → one → off */
  const cycleRepeat = () =>
    setLcRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");

  const repeatLabel =
    repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat";

  const modeName = active
    ? LC_MODES.find((m) => m.id === active.mode)?.name ?? active.mode
    : "";

  return (
    <section
      className="relative z-10 mx-auto w-full max-w-[1020px] shrink-0 px-4 pt-3 sm:px-6"
      data-testid="lc-player-bar"
    >
      <div
        ref={stageRef}
        tabIndex={-1}
        aria-label={t("The music player")}
        className={cn(
          "scope-frame-card relative rounded-2xl p-3.5 outline-none transition-shadow duration-700 sm:p-4",
          glow &&
            "shadow-[0_0_0_1px_var(--scope-a),0_14px_52px_-16px_color-mix(in_srgb,var(--scope-a)_80%,transparent)]"
        )}
        data-testid="lc-player"
      >
        {live && active ? (
          <>
            <audio
              ref={(el) => {
                audioRef.current = el;
                setAudioEl(el);
              }}
              src={active.audioUrl}
              loop={active.length === "loop"}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                const el = audioRef.current;
                if (useMirror.getState().lcRepeat === "one" && el) {
                  el.currentTime = 0;
                  void el.play().catch(() => undefined);
                  return;
                }
                void useMirror.getState().lcAdvance(1);
              }}
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
            <div className="flex items-center gap-3">
              {/* THE PLATE — the transmission's own disc, breathing while
                  the sound moves */}
              <div
                aria-hidden="true"
                className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_75%,var(--scope-a))] shadow-[0_6px_22px_-10px_color-mix(in_srgb,var(--scope-a)_90%,transparent)]"
              >
                <Music4
                  className={cn(
                    "size-5 text-[#f6f4ef] transition-transform duration-700",
                    playing && "scale-110"
                  )}
                />
                {playing && (
                  <span className="absolute inset-x-1.5 bottom-1.5 flex items-end justify-center gap-[3px]">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-[#f6f4ef]/90"
                        style={{
                          height: `${5 + ((i * 5) % 8)}px`,
                          animation: `lc-wave 1.${4 + i * 3}s ease-in-out ${i * 0.18}s infinite`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="mono-label truncate text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
                  data-testid="lc-player-mode"
                >
                  {t(modeName)}
                  {active.length === "full"
                    ? " · full song"
                    : active.length === "loop"
                      ? " · endless journey"
                      : ""}
                </p>
                <h3 className="mt-0.5 truncate font-serif text-[15.5px] font-semibold text-foreground">
                  {active.title}
                </h3>
                {active.intention && (
                  <p className="truncate text-[11.5px] italic leading-snug text-muted-foreground/80">
                    {active.intention}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShelfOpen((v) => !v)}
                aria-expanded={shelfOpen}
                aria-label={`${t("My transmissions")} (${history.length})`}
                data-testid="lc-shelf-hand"
                className={cn(
                  "btn-chip shrink-0",
                  shelfOpen && "btn-chip-active",
                  history.length === 0 && "pointer-events-none opacity-40"
                )}
              >
                <ListMusic className="size-3" aria-hidden="true" />
                <span className="whitespace-nowrap tabular-nums">
                  {history.length}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform duration-300",
                    shelfOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
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
            <div className="mt-1">
              {realWaveAllowed ? (
                <WaveSurferWave
                  key={active.id}
                  audioEl={audioEl}
                  onFallback={() => setWaveFailed(true)}
                />
              ) : (
                <HonestTimeline progress={progress} onSeek={seekTo} />
              )}
            </div>
            <div className="flex items-center justify-between font-mono text-[10.5px] text-muted-foreground">
              <span>{fmtTimeLong(time)}</span>
              <span>{fmtTimeLong(dur)}</span>
            </div>

            {/* THE TRANSPORT — one compact glass bar, small and
                symmetric: back, play, forward, the repeat dial, one
                quiet more-hand (the craft hands folded inside), the
                volume. Nothing crowds the bench. */}
            <div
              className="mt-2 flex flex-wrap items-center gap-1 rounded-full border hairline bg-[var(--glass-bg-soft)] p-1"
              data-testid="lc-transport"
            >
              <button
                type="button"
                onClick={() => void lcAdvance(-1)}
                aria-label={t("Previous transmission")}
                data-testid="lc-prev"
                className={cn(
                  "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
                  TOUCH_VEIL
                )}
              >
                <SkipBack className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={toggle}
                data-testid="lc-play"
                aria-label={playing ? t("Pause") : t("Play")}
                className={cn(
                  "focus-glow mx-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] text-[#f6f4ef] shadow-[0_4px_20px_-8px_color-mix(in_srgb,var(--scope-a)_85%,transparent)] transition-all duration-300 hover:-translate-y-px",
                  TOUCH_VEIL
                )}
              >
                {playing ? (
                  <Pause className="size-3.5" aria-hidden="true" />
                ) : (
                  <Play className="size-3.5 translate-x-[1px]" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void lcAdvance(1)}
                aria-label={t("Next transmission")}
                data-testid="lc-next"
                className={cn(
                  "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
                  TOUCH_VEIL
                )}
              >
                <SkipForward className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                aria-label={t(repeatLabel)}
                aria-pressed={repeat !== "off"}
                data-testid="lc-loop"
                className={cn(
                  "btn-chip uppercase",
                  repeat !== "off" && "btn-chip-active"
                )}
              >
                {repeat === "one" ? (
                  <Repeat1 className="size-3" aria-hidden="true" />
                ) : (
                  <Repeat className="size-3" aria-hidden="true" />
                )}
                <span className="whitespace-nowrap">
                  {repeat === "one" ? "1" : repeat === "all" ? "All" : t("Loop")}
                </span>
              </button>

              {/* THE QUIET MORE-HAND — the craft hands folded inside one
                  small dial, so the transport stays symmetric */}
              <span className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  aria-label={t("More hands")}
                  title={t("More hands")}
                  data-testid="lc-more"
                  className={cn(
                    "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
                    moreOpen && "text-foreground",
                    TOUCH_VEIL
                  )}
                >
                  <MoreHorizontal className="size-3.5" aria-hidden="true" />
                </button>
                {moreOpen && (
                  <>
                    <span
                      aria-hidden="true"
                      className="fixed inset-0 z-30"
                      onClick={() => setMoreOpen(false)}
                    />
                    <span
                      role="menu"
                      aria-label={t("More hands")}
                      className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-40 flex w-[168px] -translate-x-1/2 flex-col gap-0.5 rounded-2xl border bg-background p-1.5 lift-lg"
                      style={{
                        borderColor:
                          "color-mix(in srgb, var(--scope-a) 30%, transparent)",
                      }}
                      data-testid="lc-more-menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          newVersionFromTrack();
                        }}
                        data-testid="lc-new-version"
                        className="focus-glow flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] text-foreground transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)]"
                      >
                        <RefreshCw className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                        {t("New version")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          reshapeLc(active);
                        }}
                        data-testid="lc-reshape"
                        className="focus-glow flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] text-foreground transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)]"
                      >
                        <Wand2 className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                        {t("Reshape")}
                      </button>
                      <a
                        role="menuitem"
                        href={active.audioUrl}
                        download={`${active.title}.mp3`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setMoreOpen(false)}
                        data-testid="lc-download"
                        className="focus-glow flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] text-foreground transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)]"
                      >
                        <Download className="size-3.5 text-[var(--scope-a)]" aria-hidden="true" />
                        {t("Download")}
                      </a>
                      {(active.style || active.lyrics) && (
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={showTranslation}
                          onClick={() => setShowTranslation((v) => !v)}
                          data-testid="lc-translation"
                          className="focus-glow flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[12.5px] text-foreground transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_8%,transparent)]"
                        >
                          <Eye
                            className={cn(
                              "size-3.5 text-[var(--scope-a)]",
                              showTranslation && "fill-current"
                            )}
                            aria-hidden="true"
                          />
                          {t("Translation")}
                        </button>
                      )}
                    </span>
                  </>
                )}
              </span>

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
            </div>

            {/* THE CHANNELING STRIP — a sound already holds the stage,
                so the weaving breathes quietly beneath the transport */}
            {weaving && (
              <div
                className="mt-2 flex items-center gap-2.5 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_6%,transparent)] px-3 py-2"
                data-testid="lc-stage-weaving"
                aria-live="polite"
                aria-busy="true"
              >
                <WeavingBars />
                <p className="min-w-0 flex-1 text-[12.5px] italic leading-snug text-muted-foreground">
                  {weavePhrase}
                </p>
              </div>
            )}

            {/* VIEW TRANSLATION — the engine-facing direction, revealed on request */}
            <AnimatePresence>
              {showTranslation && (active.style || active.lyrics) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
                    {active.style && (
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        <span className="mono-label mr-1.5 text-[10px] uppercase tracking-[0.18em]">
                          {t("Sonic language")}
                        </span>
                        {active.style}
                      </p>
                    )}
                    {active.lyrics && (
                      <p className="whitespace-pre-line font-serif text-[13.5px] italic leading-relaxed text-foreground/85">
                        {active.lyrics}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : weaving ? (
          /* THE CHANNELING ON THE STAGE — the music that is about to be
             channeled is seen forming right here, where it will land:
             the weaving animation stands where the empty shelf stood. */
          <div
            className="flex items-center gap-3 py-1"
            data-testid="lc-stage-weaving"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              aria-hidden="true"
              className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_75%,var(--scope-a))] shadow-[0_6px_22px_-10px_color-mix(in_srgb,var(--scope-a)_90%,transparent)]"
            >
              <AudioLines className="size-5 text-[#f6f4ef]" />
              <span className="absolute inset-0 animate-pulse rounded-xl border border-[#f6f4ef]/30" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("The music player")}
              </p>
              <div className="mt-1 flex items-center gap-2.5">
                <WeavingBars />
                <p className="min-w-0 flex-1 text-[12.5px] italic leading-snug text-muted-foreground">
                  {weavePhrase}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* THE STAGE AT REST — honest, before any sound holds the room */
          <div
            className="flex items-center gap-3 py-1"
            data-testid="lc-listen-empty"
          >
            <div
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border hairline bg-[var(--glass-bg-soft)]"
            >
              <AudioLines
                className="size-5 text-[var(--scope-a)] opacity-70"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("The music player")}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Nothing woven yet — the sounds you weave will rest here, ready to listen."
                )}
              </p>
            </div>
          </div>
        )}

        {/* THE SHELF — every sound this device still holds, one touch
            from the stage; the playing row wears the room's own light */}
        <AnimatePresence>
          {shelfOpen && history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-3 border-t hairline pt-2.5">
                <p className="mono-label mb-1.5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {t("My transmissions")}
                </p>
                <div
                  className="nice-scroll max-h-56 space-y-1 overflow-y-auto pr-1"
                  data-testid="lc-shelf"
                >
                  {history.map((shelfTrack) => {
                    const isLive = shelfTrack.id === active?.id;
                    return (
                      <div
                        key={shelfTrack.id}
                        className={cn(
                          "group flex h-11 items-center gap-2.5 rounded-xl border px-2.5 transition-colors duration-300",
                          isLive
                            ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)]"
                            : "border-[color-mix(in_srgb,var(--scope-a)_18%,var(--hairline))] bg-[var(--glass-bg-soft)]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => void playLc(shelfTrack)}
                          aria-label={`${t("Play")} ${shelfTrack.title}`}
                          data-testid={`lc-history-play-${shelfTrack.id}`}
                          className={cn(
                            "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground",
                            TOUCH_VEIL
                          )}
                        >
                          {isLive && playing ? (
                            <Pause className="size-3" aria-hidden="true" />
                          ) : (
                            <Play
                              className="size-3 translate-x-[1px]"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[13px] font-medium",
                              isLive
                                ? "text-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {shelfTrack.title}
                          </span>
                          <span className="mono-label block truncate text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
                            {shelfTrack.durable && !shelfTrack.intention
                              ? t("Kept transmission")
                              : t(
                                  LC_MODES.find((m) => m.id === shelfTrack.mode)
                                    ?.name ?? shelfTrack.mode
                                )}
                            {" · "}
                            {new Date(shelfTrack.createdAt).toLocaleDateString()}
                            {shelfTrack.duration
                              ? ` · ${fmtTime(shelfTrack.duration)}`
                              : ""}
                          </span>
                        </span>
                        {shelfTrack.durable && (
                          <button
                            type="button"
                            onClick={() => toggleLcFavorite(shelfTrack.id)}
                            aria-pressed={Boolean(shelfTrack.favorite)}
                            aria-label={
                              shelfTrack.favorite
                                ? `${t("Unfavorite")} ${shelfTrack.title}`
                                : `${t("Favorite")} ${shelfTrack.title}`
                            }
                            data-testid={`lc-favorite-${shelfTrack.id}`}
                            className={cn(
                              "focus-glow flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:text-foreground",
                              TOUCH_VEIL,
                              shelfTrack.favorite
                                ? "text-[var(--scope-a)] opacity-100"
                                : "text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                            )}
                          >
                            <Heart
                              className={cn(
                                "size-3.5",
                                shelfTrack.favorite && "fill-current"
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                        {LC_MODES.some((m) => m.id === shelfTrack.mode) &&
                          Boolean(shelfTrack.intention) && (
                            <button
                              type="button"
                              onClick={() => reshapeLc(shelfTrack)}
                              aria-label={`${t("Reshape")} ${shelfTrack.title}`}
                              className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => forgetLc(shelfTrack.id)}
                          aria-label={`${t("Forget")} ${shelfTrack.title}`}
                          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all duration-300 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
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
    { id: "preview" as const, label: t("Preview"), price: previewPrice, testId: "lc-length-preview", title: t("A listening that finds its own natural length — 2 lights") },
    { id: "full" as const, label: t("Full song"), price: fullPrice, testId: "lc-length-full", title: t("The whole composition — woven in two movements and joined into one piece") },
    { id: "loop" as const, label: t("Endless"), price: loopPrice, testId: "lc-length-loop", title: t("One long seamless journey, woven in six movements, looping for hours") },
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
  const lyricsLabOp = useMirror((s) => s.lyricsLabOp);
  const restoreLyricsDraft = useMirror((s) => s.restoreLyricsDraft);
  const clearLcBrief = useMirror((s) => s.clearLcBrief);
  /* the honesty line, read live from the store — has a sound already
     been woven this session? */
  const hasAudio = useMirror((s) => Boolean(s.lcTrack));
  const t = useT();

  const [styleOpen, setStyleOpen] = useState(false);
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

      {/* THE ONE INPUT LAW — the describe line above the brief is the
          room's only input: the old refinement line (a second field
          nested inside the room's input) has been lifted at the
          visitor's word. The words typed above re-ask the Mirror and
          reshape the brief the honest way. */}

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
  /* THE STYLE DOOR — one dropdown button instead of the old rows of
     chips: compact, symmetric, and closed by default (the visitor's
     own words carry the ask — the creativity leads). */
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  /* THE DEEPENING HAND — the small wand that turns the visitor's own
     idea into a more advanced telling, relying on the core idea: the
     refined words land in the input, the visitor's hand sends them. */
  const [enhancing, setEnhancing] = useState(false);
  const deepenIdea = useCallback(async () => {
    const idea = lcIntention.trim();
    const state = useMirror.getState();
    const roomBusy =
      state.lcStatus === "interpreting" || state.lcStatus === "polling";
    if (!idea || roomBusy || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/light-codes/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, language: useMirror.getState().language }),
      });
      const data = (await res.json().catch(() => null)) as {
        refined?: string;
        error?: string;
      } | null;
      if (res.ok && data?.refined) {
        setLcIntention(data.refined);
      } else {
        import("sonner").then(({ toast }) =>
          toast.error(
            t(data?.error || "The deepening hand slipped — the idea stays as it was.")
          )
        );
      }
    } catch {
      import("sonner").then(({ toast }) =>
        toast.error(t("The deepening hand slipped — the idea stays as it was."))
      );
    } finally {
      setEnhancing(false);
    }
  }, [lcIntention, enhancing, setLcIntention, t]);
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

  /* THE KEEPING THREAD — a signed passage's shelf wakes with the room:
     the vault's rows join the history, and any weave that outlived a
     refresh is picked up and watched until it lands. Guests never
     knock — their keeping lives on their own device, untouched. */
  const me = useMirror((s) => s.me);
  const resumeLcLibrary = useMirror((s) => s.resumeLcLibrary);
  useEffect(() => {
    if (me && !me.email.startsWith("anon:")) void resumeLcLibrary();
  }, [me, resumeLcLibrary]);

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
    (opts?: { intention?: string }) => {
      void composeBrief(opts).then((ok) => {
        if (ok) window.setTimeout(focusChanneling, 120);
      });
    },
    [composeBrief, focusChanneling]
  );

  /* THE STAGE'S OWN LAW — when a weave lands (or stumbles), the room
     rises to its very top so the stage stands before the eye: the
     music is never left loading below the fold. The stage itself is
     pinned above the chamber, so this one rise shows it. */
  const chamberRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (lcStatus !== "ready" && lcStatus !== "error") return;
    const el = chamberRef.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [lcStatus]);

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

      {/* THE STAGE — the room's media player rests above every
          bench, so the newest weave is always one glance away */}
      <PlayerBar />

      {/* ---------- the chamber ---------- */}
      <div
        ref={chamberRef}
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
            <div className="mt-3 grid items-start gap-4">
              {/* ================= LEFT — the channeling ================= */}
              <div className="flex min-w-0 flex-col">
                {/* THE DESCRIBE LINE STANDS AT THE FLOOR now — the ask is
                    pinned at the bottom of the room (like every other
                    room's line); the channeling itself flows here, above
                    the words that called it. */}

                {/* the chamber's honest error, spoken in the Mirror's voice:
                    the weaving itself has moved up to the stage — the
                    animation stands where the music will land */}
                <div className="mt-4 flex flex-col items-center">
                  <AnimatePresence mode="wait">
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
                          {doorVoice(lcError)}
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

                {/* THE STYLE DOOR — one compact dropdown instead of the
                    old rows of chips: the visitor's words carry the ask
                    by default (no style until a chamber is chosen by
                    hand), and everything a style may add rests folded
                    inside one button — compact, symmetric, quiet. */}
                <div
                  role="group"
                  aria-label={t("The style of the transmission")}
                  className="mt-3"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStyleMenuOpen((v) => !v)}
                      aria-expanded={styleMenuOpen}
                      data-testid="lc-style-door"
                      title={t(
                        "No style — just my words: the brief is composed from this input alone"
                      )}
                      className={cn(
                        "btn-chip max-w-[78%] sm:max-w-none",
                        !lcRaw && "btn-chip-active"
                      )}
                    >
                      <Type className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {lcRaw
                          ? t("No style — just my words")
                          : t(mode.name)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3 shrink-0 transition-transform duration-300",
                          styleMenuOpen && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => void surpriseMe()}
                      disabled={busy}
                      data-testid="lc-surprise"
                      aria-label={t("Surprise me — let the Mirror choose")}
                      className="btn-chip h-7 px-3 text-[11.5px] disabled:opacity-45"
                    >
                      <Dices className="size-3" aria-hidden="true" />
                      <span className="hidden sm:inline">{t("Surprise me")}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {styleMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div
                          data-testid="lc-style-selectors"
                          className="mt-2 space-y-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_4%,var(--glass-bg-soft))] p-3.5"
                        >
                          {/* the First Law, literal — the no-style chip
                              stands first; while it is held, the brief is
                              composed from the visitor's words ALONE */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLcRaw(true)}
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

                          {/* everything a style may add — one touch on a
                              chamber lifts the no-style law by itself */}
                          <div
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
                                  active={!lcRaw && m.id === lcMode}
                                  onClick={() => {
                                    setLcMode(m.id);
                                    setLcRaw(false);
                                  }}
                                />
                              ))}
                            </div>

                            {/* one-tap intents of the chosen chamber */}
                            {!lcRaw && mode.intents && (
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
                            {!lcRaw && mode.civilizations && (
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
                            {!lcRaw && lcShape.lyricsMode === "USER WRITES" && (
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
                            {!lcRaw && (
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
                            )}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>

                        {/* THE KEEPER'S DIAGNOSTIC — silence for every ordinary visitor */}
            <ChamberStatus />
            </>
          )}
        </div>
      </div>

      {/* THE COMPOSER AT THE FLOOR — the ask stands pinned at the
          bottom of the room, the way every other room carries its
          line: the content rests above it in its own scroll, and the
          words are always one glance away — never a scroll down. */}
      {bench === "transmissions" && (
        <div
          className="relative z-10 shrink-0 border-t bg-background/75 backdrop-blur-md"
          style={{
            borderColor:
              "color-mix(in srgb, var(--scope-a) 22%, var(--hairline))",
          }}
        >
          <div className="mx-auto w-full max-w-[1020px] px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendDescribe();
                  }}
                  className="relative rounded-2xl border hairline bg-card/85 p-2 shadow-[0_18px_48px_-30px_rgba(0,0,0,0.55)] backdrop-blur-md"
                  data-testid="lc-composer"
                >
                  <div className="flex items-center gap-1.5">
                    <VoiceRecordButton
                      testId="lc-voice"
                      disabled={busy}
                      onTranscript={(text) => {
                        /* THE SIMPLEST ROUND — they speak, the Mirror proceeds */
                        setLcIntention(text);
                        sendDescribe({ intention: text });
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
                      className="focus-glow h-9 min-w-0 flex-1 rounded-full border hairline bg-background/70 px-3.5 text-[14.5px] text-foreground placeholder:text-muted-foreground/60 transition-all duration-300"
                    />
                    {/* THE DEEPENING HAND — while the visitor's own idea
                        stands in the input, one small wand turns it into
                        a more advanced telling that still relies on the
                        core idea; the words land in the input, the
                        visitor's own hand sends them */}
                    {lcIntention.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => void deepenIdea()}
                        disabled={busy || enhancing}
                        aria-label={t("Deepen the idea — more advanced, same core")}
                        title={t("Deepen the idea — more advanced, same core")}
                        data-testid="lc-deepen"
                        className={cn(
                          "focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border text-[var(--scope-a)] transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-40",
                          TOUCH_VEIL
                        )}
                      >
                        {enhancing ? (
                          <span
                            className="size-3.5 animate-pulse rounded-full bg-[var(--scope-a)]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Wand2 className="size-3.5" aria-hidden="true" />
                        )}
                      </button>
                    )}
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
                        "focus-glow flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] px-3.5 text-[12.5px] font-semibold text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35",
                        TOUCH_VEIL
                      )}
                    >
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {t("Compose")}
                    </button>
                  </div>
                </form>
          </div>
        </div>
      )}
    </div>
  );
}
