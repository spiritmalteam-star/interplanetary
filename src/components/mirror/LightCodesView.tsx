"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Music4,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Send,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMirror } from "@/lib/mirror-store";
import { useT } from "@/lib/i18n";
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
/*  LIGHT CODES — the musical chamber. A compact room: the intention,  */
/*  the chambers, one generating breath — and THE MIRROR'S BRIEF, the  */
/*  composition sheet the visitor reads and shapes before any sound    */
/*  is woven. The round is four steps, honestly kept:                  */
/*                                                                     */
/*      DESCRIBE → MIRROR COMPOSES → GENERATE → LISTEN                 */
/*                                                                     */
/*  The engine's name stays behind the veil; the Mirror is the voice.  */
/*  (Behind that veil: Google DeepMind's Lyria, through the official   */
/*  Gemini API — the keeper's GEMINI_API_KEY opens its door.)          */
/* ------------------------------------------------------------------ */

/* ------------------------- the house's dress ------------------------- */
/*  The musical chamber keeps its own silver ink (--scope-a/--scope-b)
    for everything that IS the sound — modes, waveform, the generate
    breath — while the room's quiet chrome wears the house palette:
    gold glass pills, the braided seam (plum violet → feather green →
    gold) and three rarely-sung light-language seals in the corners.  */

/** The braided seam — a section rule woven of the two kind colors and
 *  the gold, fading at both ends so it never cuts the page. */
const BRAID_RULE =
  "bg-[linear-gradient(90deg,transparent_0%,color-mix(in_srgb,var(--lp-violet)_55%,transparent)_22%,color-mix(in_srgb,var(--lp-feather)_52%,transparent)_50%,color-mix(in_srgb,var(--lp-gold)_72%,transparent)_78%,transparent_100%)]";

/** Gold glass — the pill chrome of the chamber's quiet controls. */
const GOLD_PILL =
  "border-[color-mix(in_srgb,var(--lp-gold)_32%,var(--hairline))] bg-[color-mix(in_srgb,var(--lp-gold)_7%,var(--glass-bg-soft))] hover:border-[color-mix(in_srgb,var(--lp-gold)_58%,transparent)]";

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
          : cn(
              GOLD_PILL,
              "bg-[color-mix(in_srgb,var(--lp-gold)_5%,var(--glass-bg-soft))] hover:bg-[color-mix(in_srgb,var(--lp-gold)_9%,var(--glass-bg-soft))]"
            )
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="mono-label text-[10px] text-[color-mix(in_srgb,var(--lp-gold)_60%,var(--muted-foreground))]">
          {mode.n}
        </span>
        <span
          className={cn(
            "text-[13.5px] font-semibold leading-tight tracking-wide",
            active ? "text-[var(--scope-a)]" : "text-foreground/85"
          )}
        >
          {t(mode.name)}
        </span>
      </span>
      <span className="text-[12px] leading-snug text-muted-foreground">
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
  const newVersionFromTrack = useMirror((s) => s.newVersionFromTrack);
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
            className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground"
            data-testid="lc-player-mode"
          >
            {t(modeName)}
            {track.length === "full" ? " · full song" : " · preview"}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-[18px] font-semibold text-foreground">
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
      <div className="mt-1.5 flex items-center justify-between font-mono text-[11.5px] text-muted-foreground">
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
          className="focus-glow flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-[var(--lp-gold)] to-[color-mix(in_srgb,var(--lp-gold)_58%,var(--lp-violet))] text-[#f8f3e6] shadow-[0_4px_20px_-8px_color-mix(in_srgb,var(--lp-gold)_85%,transparent)] transition-all duration-300 hover:-translate-y-px dark:to-[color-mix(in_srgb,var(--lp-gold)_78%,white)] dark:text-[#2a2313]"
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
          className={cn(
            "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground",
            GOLD_PILL
          )}
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
          <p className="mono-label text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("Transmission notes")}
          </p>
          <p className="mt-1 text-[14.5px] italic leading-relaxed text-foreground/80">
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
      className={cn(
        "focus-glow flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
          : cn(
              GOLD_PILL,
              "text-muted-foreground hover:text-foreground"
            )
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
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("The transmission's length")}
      className="flex w-fit items-center gap-0.5 rounded-full border hairline p-0.5"
      data-testid="lc-length"
    >
      <button
        type="button"
        onClick={() => setLcLength("preview")}
        aria-pressed={lcLength === "preview"}
        data-testid="lc-length-preview"
        className={cn(
          "focus-glow flex h-6 items-center rounded-full px-2.5 text-[11.5px] transition-colors duration-300",
          lcLength === "preview"
            ? "font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        style={
          lcLength === "preview"
            ? {
                backgroundColor:
                  "color-mix(in srgb, var(--scope-a,var(--lp-gold)) 13%, transparent)",
                color: "var(--scope-a,var(--lp-gold))",
              }
            : undefined
        }
      >
        {t("Preview · 30s")}
      </button>
      <button
        type="button"
        onClick={() => setLcLength("full")}
        aria-pressed={lcLength === "full"}
        data-testid="lc-length-full"
        className={cn(
          "focus-glow flex h-6 items-center rounded-full px-2.5 text-[11.5px] transition-colors duration-300",
          lcLength === "full"
            ? "font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        style={
          lcLength === "full"
            ? {
                backgroundColor:
                  "color-mix(in srgb, var(--scope-a,var(--lp-gold)) 13%, transparent)",
                color: "var(--scope-a,var(--lp-gold))",
              }
            : undefined
        }
      >
        {t("Full song")}
      </button>
    </div>
  );
}

/* --------------------- THE MIRROR'S BRIEF ---------------------------- */
/*  The composition sheet: what the Mirror wrote, laid open for the
    visitor's own hand — the title, the words, the production direction,
    the refinement line and the generate hand. Nothing is woven until
    the visitor strikes generate.                                        */

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
      className="scope-frame-card relative rounded-2xl p-4 sm:p-5"
      data-testid="lc-brief"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label text-[10.5px] uppercase tracking-[0.24em] text-muted-foreground">
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
            className="focus-glow mt-0.5 w-full truncate rounded-lg border border-transparent bg-transparent font-serif text-[18px] font-semibold text-foreground outline-none transition-colors duration-300 hover:border-[var(--hairline)] focus:border-[var(--hairline)]"
          />
        </div>
        <button
          type="button"
          onClick={clearLcBrief}
          aria-label={t("Lay the brief down")}
          data-testid="lc-brief-dismiss"
          className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {brief.notes && (
        <p className="mt-1.5 text-[14.5px] italic leading-relaxed text-foreground/80">
          {brief.notes}
        </p>
      )}

      {/* ---------- THE LYRICS LABORATORY ---------- */}
      {brief.lyrics !== null && (
        <div className="mt-4 rounded-xl border hairline bg-[color-mix(in_srgb,var(--scope-a)_5%,transparent)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="mono-label flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
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
                  className="focus-glow flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
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
                  "focus-glow flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45",
                  busyOp === `lyrics:${hand.op}`
                    ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                    : cn(GOLD_PILL, "text-muted-foreground hover:text-foreground")
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
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setStyleOpen((v) => !v)}
            aria-expanded={styleOpen}
            data-testid="lc-brief-style-toggle"
            className={cn(
              "focus-glow mx-auto flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground transition-all duration-300 hover:text-foreground",
              GOLD_PILL
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
        className="mt-4"
        data-testid="lc-refine-form"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={refine}
            onChange={(e) => setRefine(e.target.value)}
            placeholder={t("Tell the Mirror what to change — \u201cmake it more emotional\u201d\u2026")}
            aria-label={t("Tell the Mirror what to change")}
            maxLength={300}
            disabled={labBusy || weaving}
            data-testid="lc-refine-input"
            className="focus-glow h-10 min-w-0 flex-1 rounded-full border hairline bg-background/60 px-4 text-[14.5px] text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/55 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={labBusy || weaving || !refine.trim()}
            aria-label={t("Reshape the brief")}
            data-testid="lc-refine-send"
            className="focus-glow flex size-10 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a)_40%,transparent)] text-[var(--scope-a)] transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--scope-a)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      {refineNote && (
        <p
          className="mt-2 rounded-lg border border-[color-mix(in_srgb,var(--lp-gold)_28%,transparent)] bg-[color-mix(in_srgb,var(--lp-gold)_6%,transparent)] px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground"
          data-testid="lc-refine-note"
        >
          {refineNote}
        </p>
      )}

      {/* ---------- THE GENERATE HAND — the visitor strikes the weave ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t hairline pt-3.5">
        <LengthToggle />
        <button
          type="button"
          onClick={() => void weaveBrief()}
          disabled={labBusy || weaving}
          data-testid="lc-weave"
          className="focus-glow flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] px-5 text-[14px] font-semibold text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lp-gold)_35%,transparent)] transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AudioLines className="size-4" aria-hidden="true" />
          {hasAudio && status !== "polling"
            ? t("Weave a new version")
            : t("Generate the transmission")}
        </button>
      </div>
      {hasAudio && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground/75">
          {t(
            "Generating weaves a fresh version — the engine does not edit a sound already woven."
          )}
        </p>
      )}
    </motion.section>
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
    <section className="mt-8" aria-label={t("Chamber status")} data-testid="lc-status">
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
              className="nice-scroll mt-2 max-h-72 overflow-y-auto rounded-xl border hairline bg-[color-mix(in_srgb,var(--lp-gold)_4%,var(--glass-bg-soft))] p-3.5"
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
  const setLcMode = useMirror((s) => s.setLcMode);
  const setLcCivilization = useMirror((s) => s.setLcCivilization);
  const setLcIntention = useMirror((s) => s.setLcIntention);
  const setLcUserLyrics = useMirror((s) => s.setLcUserLyrics);
  const setLcShape = useMirror((s) => s.setLcShape);
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

  return (
    <div className="scope-lightcodes relative flex h-full flex-col">
      {/* THE HOUSE'S MARKS — two kind-colored breaths and three rarely-sung
          light-language seals resting in the chamber's empty corners:
          bronze ink on the vanilla daylight paper, a soft glow in the
          crystal night. They breathe on one slow opacity cycle, never
          take a touch and never cover a control. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(42% 30% at 0% 10%, color-mix(in srgb, var(--lp-feather) 11%, transparent), transparent 70%), radial-gradient(40% 30% at 100% 92%, color-mix(in srgb, var(--lp-violet) 13%, transparent), transparent 72%)",
          }}
        />
        {/* intricate_04 — unsung anywhere else in the realm */}
        <SigilMark
          src="/sigils/intricate_04.png"
          className="-right-8 -top-9 size-[clamp(140px,26vw,250px)] [transform:rotate(12deg)] opacity-[0.12] sm:-right-4 dark:opacity-[0.16] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--lp-gold)_55%,transparent))]"
        />
        {/* sigil_02 — a light-language mark no other room has worn */}
        <SigilMark
          src="/sigils/sigil_02.png"
          className="-left-12 top-[38%] size-[clamp(150px,24vw,270px)] [transform:rotate(-8deg)] opacity-[0.12] sm:-left-8 dark:opacity-[0.15] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--lp-violet)_55%,transparent))]"
        />
        {/* intricate_09 — sung once, long ago, in the guide's pages */}
        <SigilMark
          src="/sigils/intricate_09.png"
          className="-bottom-10 -right-8 size-[clamp(140px,24vw,260px)] [transform:rotate(9deg)] opacity-[0.13] sm:-right-5 dark:opacity-[0.16] dark:[filter:drop-shadow(0_0_18px_color-mix(in_srgb,var(--lp-feather)_60%,transparent))]"
        />
      </div>

      {/* ---------- the chamber ---------- */}
      <div
        className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-testid="light-codes"
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pb-28 pt-3 sm:px-6">
          {/* the naming has rested — the bench switch opens the room */}

          {/* THE TWO BENCHES — one quiet switch between the Mirror's
              studio and the visitor's own local instrument */}
          <div
            role="group"
            aria-label={t("Choose the bench")}
            className="mt-4 flex justify-center"
          >
            <div className="flex items-center gap-1 rounded-full border p-1">
              <button
                type="button"
                onClick={() => setBench("transmissions")}
                aria-pressed={bench === "transmissions"}
                data-testid="lc-bench-transmissions"
                className={cn(
                  "focus-glow flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors duration-300",
                  bench === "transmissions"
                    ? "font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  bench === "transmissions"
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a,var(--lp-gold)) 12%, transparent)",
                        color: "var(--scope-a,var(--lp-gold))",
                        boxShadow:
                          "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--lp-gold)) 35%, transparent)",
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
                className={cn(
                  "focus-glow flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors duration-300",
                  bench === "sequencer"
                    ? "font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  bench === "sequencer"
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--scope-a,var(--lp-gold)) 12%, transparent)",
                        color: "var(--scope-a,var(--lp-gold))",
                        boxShadow:
                          "inset 0 0 0 1px color-mix(in srgb, var(--scope-a,var(--lp-gold)) 35%, transparent)",
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
            <div className="relative mt-4">
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

          {/* the chambers — one compact sheet, two to a row */}
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
            {LC_MODES.map((m) => (
              <ModeCard
                key={m.id}
                mode={m}
                active={m.id === lcMode}
                onClick={() => setLcMode(m.id)}
              />
            ))}
          </div>

          {/* one-tap intents of the chosen chamber */}
          {mode.intents && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mode.intents.map((intent) => (
                <button
                  key={intent}
                  type="button"
                  onClick={() => setLcIntention(intent)}
                  className={cn(
                    "focus-glow rounded-full border px-2.5 py-1 text-[12.5px] text-muted-foreground transition-all duration-300 hover:text-foreground",
                    GOLD_PILL
                  )}
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
                    "focus-glow rounded-full border px-2.5 py-1 text-[12.5px] transition-all duration-300",
                    lcCivilization === c.id
                      ? "border-[color-mix(in_srgb,var(--scope-a)_55%,transparent)] bg-[color-mix(in_srgb,var(--scope-a)_12%,transparent)] text-[var(--scope-a)]"
                      : cn(
                          GOLD_PILL,
                          "text-muted-foreground hover:text-foreground"
                        )
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
                className="focus-glow w-full resize-none rounded-xl border hairline bg-transparent px-3 py-2 font-serif text-[14.5px] italic leading-relaxed text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          )}

          {/* SHAPE THE TRANSMISSION — hidden until asked */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShapeOpen((v) => !v)}
              aria-expanded={shapeOpen}
              data-testid="lc-shape-toggle"
              className={cn(
                "focus-glow mx-auto flex w-fit items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12.5px] uppercase tracking-[0.2em] text-muted-foreground transition-all duration-300 hover:text-foreground",
                GOLD_PILL
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
                  <div className="mt-3 space-y-3 rounded-xl border hairline bg-[color-mix(in_srgb,var(--lp-gold)_4%,var(--glass-bg-soft))] p-3.5">
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

          {/* the chamber at work — the results breathe here, above the
              composer (the only place the room may scroll) */}
          <div className="mt-5 flex flex-col items-center">
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
                  <p className="mt-2 text-[14px] italic text-muted-foreground">
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
                  className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--destructive)_30%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_6%,transparent)] px-4 py-3 text-center"
                  data-testid="lc-error"
                >
                  <p className="text-[14.5px] leading-relaxed text-foreground/85">
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
                    className="focus-glow mt-2 text-[13.5px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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
              className="mt-4 rounded-xl border hairline bg-[color-mix(in_srgb,var(--lp-gold)_5%,var(--glass-bg-soft))] px-4 py-3 text-center"
              data-testid="lc-notice"
            >
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">{lcNotice}</p>
            </motion.div>
          )}

          {/* THE MIRROR'S BRIEF — the composition sheet, before the sound */}
          {lcBrief && lcStatus !== "ready" && (
            <div className="mt-6" data-testid="lc-brief-wrap">
              <BriefCard />
            </div>
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
              {/* the braided seam before the shelf of kept sounds */}
              <div className={cn("mb-3 h-px w-full", BRAID_RULE)} aria-hidden="true" />
              <p className="mono-label mb-2 text-[10.5px] uppercase tracking-[0.24em] text-muted-foreground">
                {t("My transmissions")}
              </p>
              <div className="nice-scroll max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {lcHistory.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--lp-gold)_24%,var(--hairline))] bg-[var(--glass-bg-soft)] px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => void playLc(track)}
                      aria-label={`${t("Play")} ${track.title}`}
                      data-testid={`lc-history-play-${track.id}`}
                      className="focus-glow flex size-7 shrink-0 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:border-[var(--hairline-hover)] hover:text-foreground"
                    >
                      <Play className="size-3 translate-x-[1px]" aria-hidden="true" />
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-foreground/85">
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

          {/* THE KEEPER'S DIAGNOSTIC — silence for every ordinary visitor */}
          <ChamberStatus />
          </>
          )}
        </div>
      </div>

      {/* ---------- the ask bar — the Akashic's own style of composer,
          tuned to the chamber of sound: one floating card at the foot
          of the room, the intention and the paperclip inside it, the
          send hand asking the Mirror to compose the brief. No saying
          beneath it — the results breathe above, and the room never
          scrolls to reach the words. ---------- */}
      {bench === "transmissions" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const carried = attachments;
              setAttachments([]);
              void composeBrief({ attachments: carried });
            }}
            className="pointer-events-auto relative w-full max-w-[640px] rounded-2xl border hairline bg-card p-2.5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.42)]"
            data-testid="lc-composer"
          >
            <AttachmentChips
              attachments={attachments}
              onRemove={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
              accentVar="var(--scope-a,var(--lp-gold))"
              testId="lc-attachments"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lcIntention}
                onChange={(e) => setLcIntention(e.target.value)}
                placeholder={t(mode.placeholder)}
                aria-label={t(mode.placeholder)}
                maxLength={600}
                data-testid="lc-intention"
                className="focus-glow h-11 min-w-0 flex-1 rounded-full border hairline bg-background/70 px-4 text-[16px] text-foreground placeholder:text-muted-foreground/60 transition-all duration-300"
              />
              <ChatInputExtras
                scope="healing"
                size="2xs"
                withCall={false}
                mobileLarger
                accentVar="var(--scope-a,var(--lp-gold))"
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
                className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--scope-a)] to-[color-mix(in_srgb,var(--scope-b)_80%,var(--scope-a))] text-[#f6f4ef] shadow-[0_6px_28px_-10px_color-mix(in_srgb,var(--scope-a)_75%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lp-gold)_35%,transparent)] transition-all duration-300 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Sparkles className="size-4" aria-hidden="true" />
              </button>
            </div>
            {/* the Mirror's own choice — a fresh brief from an empty ask */}
            <div className="mt-1.5 flex justify-center">
              <button
                type="button"
                onClick={() => void surpriseMe()}
                disabled={busy}
                data-testid="lc-surprise"
                className={cn(
                  "focus-glow flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] text-muted-foreground transition-all duration-300 hover:text-foreground disabled:opacity-45",
                  GOLD_PILL
                )}
              >
                <Dices className="size-3.5" aria-hidden="true" />
                {t("Surprise me — let the Mirror choose")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
