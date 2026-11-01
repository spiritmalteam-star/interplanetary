"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Mic, Minimize2, Pause, Play, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  THE KARAOKE ROOM — the words grown big, riding the melody.         */
/*                                                                     */
/*  THE VISITOR'S LAW: a transmission that was woven WITH words can    */
/*  be sung — one hand opens the karaoke and the lyrics stand tall     */
/*  line by line, the line the melody is breathing lit in the room's   */
/*  own light, every other line waiting its turn.                      */
/*                                                                     */
/*  THE HONEST CLOCK: the brief's lyrics carry no timestamps of their  */
/*  own, so the song's own duration is shared among the lines by       */
/*  their length — a long line holds the melody longer, a short line   */
/*  yields, and the rests between verses hold only a breath. A line    */
/*  touched by the visitor's hand travels the melody to that moment.   */
/*                                                                     */
/*  THE ONE DEVICE LAW: the room fits every screen — the words scale   */
/*  with the viewport, the hands keep their 44px promise, the safe     */
/*  areas are kept, and the visitor's own scroll is never seized       */
/*  while the room stands open.                                        */
/* ------------------------------------------------------------------ */

type KaraokeLine = {
  text: string;
  /** where the line's turn begins along the song (0..1) */
  start: number;
  /** where the line's turn ends and the next may begin (0..1) */
  end: number;
  /** a rest between verses — never sung, only breathed */
  blank: boolean;
};

/** THE TIMESTAMP'S OWN KEY — a lyric line may arrive with its own
    moment woven in (the LRC shape: "[mm:ss.xx] text"); when at least
    two lines carry their moments, the karaoke walks by THEM, exactly,
    instead of sharing the song by length. */
const LRC_TIME = /^\s*\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]\s*/;

/** THE SHARE OF THE MELODY — with timestamps, the lines walk their
    own clock (seconds → the song's span); without them, the song's
    duration is divided among the lines by their own length (long
    lines hold it longer, rests hold a breath), so the light walks
    the words the way a voice would. THE HONEST LIMITATION: an
    untimed brief is an approximation, and the room says so. */
function buildLines(
  lyrics: string,
  dur: number
): { lines: KaraokeLine[]; timed: boolean } {
  const raw = lyrics.split(/\r?\n/);
  const stamps: (number | null)[] = [];
  const texts: string[] = [];
  for (const line of raw) {
    const m = line.match(LRC_TIME);
    if (m) {
      const sec =
        parseInt(m[1], 10) * 60 +
        parseInt(m[2], 10) +
        (m[3] ? parseFloat(`0.${m[3]}`) : 0);
      stamps.push(sec);
      texts.push(line.slice(m[0].length));
    } else {
      stamps.push(null);
      texts.push(line);
    }
  }
  const timedStamps = stamps.filter((t): t is number => t !== null);
  const timed = timedStamps.length >= 2 && dur > 0;

  if (timed) {
    /* the timed walk — each line's own second, mapped into the song */
    const span = Math.max(dur, timedStamps[timedStamps.length - 1] + 0.1);
    const idxs: number[] = [];
    stamps.forEach((t, i) => {
      if (t !== null) idxs.push(i);
    });
    const lines: KaraokeLine[] = raw.map((_, i) => ({
      text: texts[i],
      start: 0,
      end: 0,
      blank: !texts[i].trim(),
    }));
    idxs.forEach((i, k) => {
      const at = (stamps[i] as number) / span;
      const next = k + 1 < idxs.length ? (stamps[idxs[k + 1]] as number) / span : 1;
      lines[i].start = Math.min(0.999, at);
      lines[i].end = Math.min(1, Math.max(next, at + 0.001));
    });
    /* lines before the first stamp walk from zero; gaps between timed
       lines inherit the span their timestamps open */
    let last = 0;
    for (let i = 0; i < lines.length; i++) {
      if (stamps[i] !== null) {
        last = lines[i].start;
      } else {
        lines[i].start = last;
        lines[i].end = last;
      }
    }
    return { lines, timed: true };
  }

  /* the proportional walk — no timestamps woven in */
  const weights = texts.map((l) =>
    l.trim() ? Math.max(6, l.trim().length) : 2.2
  );
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let at = 0;
  const lines = raw.map((text, i) => {
    const start = at / total;
    at += weights[i];
    return { text, start, end: at / total, blank: !text.trim() };
  });
  return { lines, timed: false };
}

/** the floating notes of the karaoke's own sky — five notes, slow and
    few, the room breathing music without ever crowding the words */
const FLOATING_NOTES = [
  { glyph: "♪", left: "8%", delay: "0s", dur: "17s", size: "1.5rem" },
  { glyph: "♫", left: "24%", delay: "-6s", dur: "21s", size: "1.1rem" },
  { glyph: "♩", left: "55%", delay: "-11s", dur: "19s", size: "1.3rem" },
  { glyph: "♬", left: "74%", delay: "-3s", dur: "23s", size: "1.6rem" },
  { glyph: "♪", left: "90%", delay: "-14s", dur: "16s", size: "1rem" },
] as const;

export function LcKaraoke({
  open,
  onClose,
  lyrics,
  title,
  playing,
  time,
  dur,
  onToggle,
  onSeekRatio,
}: {
  open: boolean;
  onClose: () => void;
  lyrics: string;
  title: string;
  playing: boolean;
  time: number;
  dur: number;
  onToggle: () => void;
  /** the visitor touched a line — the melody travels there (0..1) */
  onSeekRatio: (ratio: number) => void;
}) {
  const t = useT();
  const { lines, timed } = useMemo(() => buildLines(lyrics, dur), [lyrics, dur]);
  const progress = dur > 0 ? Math.min(1, Math.max(0, time / dur)) : 0;

  /* the line the melody is breathing right now — the last line whose
     turn has begun (the active one leads, the rest follow) */
  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (progress >= lines[i].start) idx = i;
      else break;
    }
    return idx;
  }, [lines, progress]);

  /* THE LIT LINE — while the melody crosses a rest between two lines,
     the light stays on the line being held (never a dark breath: the
     visitor always sees where the song stands). */
  const litIndex = useMemo(() => {
    for (let i = Math.min(activeIndex, lines.length - 1); i >= 0; i--) {
      if (!lines[i].blank) return i;
    }
    return -1;
  }, [activeIndex, lines]);

  /* the sung line stands at the room's center — the room walks with
     the melody, never yanked, a smooth breath per line. One steady
     hand after the room has settled (fonts, layout, the first
     breath), so the first line is never left above the eye. */
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(-1);
  const settleTimer = useRef<number | null>(null);
  const centerLine = (i: number, smooth: boolean) => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lineRefs.current[i]?.scrollIntoView({
      block: "center",
      behavior: !smooth || reduce ? "auto" : "smooth",
    });
  };
  useEffect(() => {
    if (!open) return;
    if (activeRef.current === litIndex) return;
    const first = activeRef.current === -1;
    activeRef.current = litIndex;
    centerLine(litIndex, !first);
    if (first) {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(
        () => centerLine(litIndex, false),
        420
      );
    }
  }, [litIndex, open]);
  useEffect(() => {
    if (open) activeRef.current = -1;
    return () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, [open]);

  /* the room's own laws — the body's scroll rests while the karaoke
     stands, and the Escape key is the quiet exit */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* THE ROOM'S OWN DOORWAY — the karaoke rises through a portal into
     the document's body, so no docked lens, no transformed ancestor
     can ever trap it: the words stand over EVERYTHING, on every
     device, docked or full-screen alike. The host is resolved once,
     lazily — a server render simply has no doorway yet. */
  const [host] = useState<HTMLElement | null>(() =>
    typeof document !== "undefined" ? document.body : null
  );

  /* THE ROOM'S OWN FULLSCREEN — where the device grants it (Android,
     desktop), one hand lifts the room into the OS's own screen and
     back; where the device refuses (an iPhone's Safari on a div), the
     room already fills the viewport and the hand rests gently. */
  const roomRef = useRef<HTMLDivElement | null>(null);
  const [osFullscreen, setOsFullscreen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onFs = () => setOsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [open]);
  useEffect(() => {
    if (!open && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [open]);
  const toggleFullscreen = () => {
    const el = roomRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else if (typeof el.requestFullscreen === "function") {
      void el.requestFullscreen().catch(() => undefined);
    }
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={`${t("Karaoke")} — ${title}`}
          data-testid="lc-karaoke-room"
          ref={roomRef}
          className="lc-karaoke fixed inset-0 z-[95] flex flex-col overflow-hidden"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          {/* THE KARAOKE SKY — the room's own light, poured deep: the
              purple liquid over a darkened ground, the same room in
              daylight and crystal night — the words always lead */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,color-mix(in_srgb,var(--scope-a, #a855f7)_42%,transparent),transparent_62%)]" />
            <span className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_115%,color-mix(in_srgb,var(--scope-a, #a855f7)_30%,transparent),transparent_58%)]" />
            <span className="absolute inset-0 bg-[#0d0a14]/82 backdrop-blur-2xl" />
            {FLOATING_NOTES.map((n, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="lc-karaoke-note absolute bottom-[-8%] select-none text-[var(--scope-a, #a855f7)]"
                style={{
                  left: n.left,
                  fontSize: n.size,
                  animationDelay: n.delay,
                  animationDuration: n.dur,
                }}
              >
                {n.glyph}
              </span>
            ))}
          </div>

          {/* THE ROOM'S CROWN — the song's own name and the quiet exit */}
          <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 pb-1 sm:px-6">
            <span className="lc-karaoke-mic flex size-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--scope-a, #a855f7)_40%,transparent)] bg-[color-mix(in_srgb,var(--scope-a, #a855f7)_12%,transparent)]">
              <Mic
                className={cn(
                  "size-4 text-[var(--scope-a, #a855f7)] transition-transform duration-500",
                  playing && "scale-110"
                )}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mono-label truncate text-[9.5px] uppercase tracking-[0.26em] text-[var(--scope-a, #a855f7)]">
                {t("Karaoke")}
              </p>
              <h2 className="truncate font-serif text-[15px] font-semibold text-[#f6f4ef]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={osFullscreen ? t("Return from the fullscreen") : t("Lift the room to the fullscreen")}
              title={osFullscreen ? t("Return from the fullscreen") : t("Lift the room to the fullscreen")}
              data-testid="lc-karaoke-fullscreen"
              className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors duration-300 hover:text-white"
            >
              {osFullscreen ? (
                <Minimize2 className="size-4.5" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("Leave the karaoke")}
              title={t("Leave the karaoke")}
              data-testid="lc-karaoke-exit"
              className="focus-glow flex size-11 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors duration-300 hover:text-white"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          {/* THE HONEST CLOCK'S NOTE — the room speaks its own measure:
              when the brief carried no per-line timestamps, the words
              ride the melody's share by length, and the room says so */}
          {!timed && (
            <p
              className="mono-label relative z-10 shrink-0 px-4 pb-1 text-center text-[8.5px] uppercase tracking-[0.2em] text-white/35 sm:px-6"
              data-testid="lc-karaoke-timing-note"
            >
              {t(
                "No per-line timing was woven into this song — the words ride the melody's own measure"
              )}
            </p>
          )}

          {/* THE WORDS — the whole lyric, the sung line lit and leading */}
          <div
            className="nice-scroll relative z-10 min-h-0 flex-1 overflow-y-auto"
            data-testid="lc-karaoke-lyrics"
          >
            <div className="mx-auto flex w-full max-w-[720px] flex-col items-stretch gap-1 px-4 py-[16vh] sm:px-6">
              {lines.map((line, i) => {
                const sung = i < litIndex;
                const active = i === litIndex;
                if (line.blank) {
                  return (
                    <div
                      key={`rest-${i}`}
                      aria-hidden="true"
                      className="h-[clamp(0.9rem,3vh,1.8rem)]"
                    />
                  );
                }
                return (
                  <button
                    key={`line-${i}`}
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    type="button"
                    onClick={() => onSeekRatio(line.start)}
                    aria-label={`${t("Travel to this line")}: ${line.text}`}
                    aria-current={active ? "true" : undefined}
                    data-testid={`lc-karaoke-line-${i}`}
                    className={cn(
                      "focus-glow group text-left font-serif leading-[1.35] transition-all duration-500",
                      active
                        ? "lc-karaoke-line-active scale-[1.02] text-[clamp(1.55rem,6vw,2.9rem)]"
                        : "text-[clamp(1.15rem,4.4vw,2.05rem)] hover:opacity-90",
                      sung
                        ? "text-white/45"
                        : active
                          ? ""
                          : "text-white/30",
                      "min-h-[44px] rounded-lg px-1 py-1"
                    )}
                  >
                    <span
                      className={cn(
                        "whitespace-pre-wrap break-words",
                        active &&
                          "lc-karaoke-gradient bg-clip-text text-transparent"
                      )}
                    >
                      {line.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* THE MELODY'S OWN BENCH — the honest line of the song, the
              big play hand, and the clock at both ends */}
          <footer
            className="relative z-10 shrink-0 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2 sm:px-6"
            data-testid="lc-karaoke-bench"
          >
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-1.5">
              <div
                role="slider"
                aria-label={t("Seek within the transmission")}
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                tabIndex={0}
                data-testid="lc-karaoke-seek"
                className="group flex h-8 cursor-pointer items-center"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSeekRatio(
                    Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight")
                    onSeekRatio(Math.min(1, progress + 0.02));
                  if (e.key === "ArrowLeft")
                    onSeekRatio(Math.max(0, progress - 0.02));
                }}
              >
                <div className="relative h-[3px] w-full rounded-full bg-[color-mix(in_srgb,var(--scope-a, #a855f7)_22%,transparent)]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--scope-a, #a855f7)] to-[color-mix(in_srgb,var(--scope-b, #d8c9a8)_70%,var(--scope-a, #a855f7))]"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                  <div
                    className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--scope-a, #a855f7)] shadow-[0_0_12px_-1px_var(--scope-a, #a855f7)] transition-transform duration-300 group-hover:scale-125"
                    style={{ left: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="mono-label w-10 shrink-0 text-left text-[10px] tabular-nums text-white/55">
                  {fmt(time)}
                </span>
                <button
                  type="button"
                  onClick={onToggle}
                  aria-label={playing ? t("Pause") : t("Play")}
                  data-testid="lc-karaoke-toggle"
                  className="focus-glow mx-auto flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[var(--scope-a, #a855f7)] to-[color-mix(in_srgb,var(--scope-b, #d8c9a8)_80%,var(--scope-a, #a855f7))] text-[#f6f4ef] shadow-[0_6px_26px_-8px_color-mix(in_srgb,var(--scope-a, #a855f7)_90%,transparent)] transition-transform duration-300 hover:scale-105 active:scale-95"
                >
                  {playing ? (
                    <Pause className="size-6" aria-hidden="true" />
                  ) : (
                    <Play
                      className="size-6 translate-x-[2px]"
                      aria-hidden="true"
                    />
                  )}
                </button>
                <span className="mono-label w-10 shrink-0 text-right text-[10px] tabular-nums text-white/55">
                  {fmt(dur)}
                </span>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>,
    host
  );
}
