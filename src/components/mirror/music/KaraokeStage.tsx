"use client";

/* ------------------------------------------------------------------ */
/*  THE KARAOKE STAGE — lyrics that follow the actual singing.         */
/*                                                                     */
/*  Law: the ONLY clock is the player's own currentTime. Pause,        */
/*  resume, seek and playback-speed changes can never accumulate       */
/*  drift, because nothing here integrates time on its own.            */
/*                                                                     */
/*  Honesty law: timings arrive either ESTIMATED (distributed across   */
/*  the track, labeled as such) or MANUAL (stamped by the visitor      */
/*  while listening — then they are real). Nothing is ever displayed   */
/*  as more accurate than it is.                                       */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Stamp, X } from "lucide-react";
import { usePlayerStore } from "@/lib/player-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LcSync, LcSyncLine } from "@/lib/data/light-codes";

interface Props {
  open: boolean;
  onClose: () => void;
  sync: LcSync | null;
  lyrics: string | null;
  onSyncEdited: (sync: LcSync) => void;
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function KaraokeStage({ open, onClose, sync, lyrics, onSyncEdited }: Props) {
  const t = useT();
  const time = usePlayerStore((s) => s.time);
  const playing = usePlayerStore((s) => s.playing);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const toggle = usePlayerStore((s) => s.toggle);

  const [scale, setScale] = useState(1.15);
  const [stamping, setStamping] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const lines: LcSyncLine[] = useMemo(() => {
    if (sync && sync.lines.length > 0) return sync.lines;
    return [];
  }, [sync]);

  const activeIdx = useMemo(() => {
    if (lines.length === 0) return -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (time >= lines[i].start - 0.15) return i;
    }
    return -1;
  }, [lines, time]);

  /* smooth auto-scroll — the active line centers itself, gently */
  useEffect(() => {
    if (activeIdx >= 0 && activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [activeIdx]);

  if (!open) return null;

  /* THE STAMP — a line's start becomes the current playback moment;
     everything before it keeps its previous stamps, everything after
     is redistributed to fill the remaining time honestly. */
  const stampLine = (idx: number) => {
    if (!sync || sync.lines.length === 0) return;
    const stamped = [...sync.lines];
    const current = Math.min(time, stamped[stamped.length - 1].end - 0.1);
    stamped[idx] = { ...stamped[idx], start: current };
    /* re-fill the following lines from this moment onward */
    const availableEnd = Math.max(stamped[idx].start + 0.4, stamped[stamped.length - 1].end);
    let cursor = stamped[idx].start;
    for (let i = idx; i < stamped.length; i++) {
      const span = Math.max(0.4, stamped[i].end - stamped[i].start);
      stamped[i] = {
        ...stamped[i],
        start: cursor,
        end: Math.min(cursor + span, availableEnd),
      };
      cursor = stamped[i].end;
    }
    onSyncEdited({ level: "manual", lines: stamped });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex flex-col bg-[#0c0b0f] text-[#f2f0ea]"
      data-testid="karaoke-stage"
      role="dialog"
      aria-label={t("Karaoke — sing along")}
    >
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
        <p className="mono-label text-[9px] uppercase tracking-[0.24em] text-white/50">
          {t("Karaoke")} · {fmtTime(time)} / {fmtTime(duration)}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.8, s - 0.15))}
            aria-label={t("Smaller text")}
            className="focus-glow flex size-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2, s + 0.15))}
            aria-label={t("Larger text")}
            className="focus-glow flex size-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close karaoke")}
            data-testid="karaoke-close"
            className="focus-glow flex size-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* the honesty ribbon */}
      <div className="shrink-0 px-4 pb-1">
        <p className="text-center text-[10.5px] text-white/40" data-testid="karaoke-sync-level">
          {stamping
            ? t("Sync mode — the line stamps itself at your tap")
            : lines.length > 0 && sync?.level === "manual"
              ? t("Timings verified by ear — word flow follows your stamps")
              : lines.length > 0
                ? t("Estimated timing — use Sync mode to stamp the words true")
                : t("No lyric timing for this transmission yet")}
        </p>
      </div>

      {/* the lyrics */}
      <div ref={listRef} className="nice-scroll min-h-0 flex-1 overflow-y-auto px-6 py-8">
        {lines.length === 0 && lyrics && (
          <p className="whitespace-pre-line text-center text-[19px] leading-relaxed text-white/70">
            {lyrics}
          </p>
        )}
        {lines.length === 0 && !lyrics && (
          <p className="text-center text-[15px] text-white/50">
            {t("This transmission is instrumental — the melody is the voice.")}
          </p>
        )}
        {lines.map((line, i) => {
          const active = i === activeIdx;
          const sung = i < activeIdx;
          return (
            <button
              key={`${i}-${line.start}`}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => (stamping ? stampLine(i) : seek(line.start))}
              data-testid={`karaoke-line-${i}`}
              aria-current={active}
              className={cn(
                "block w-full py-2 text-center font-serif leading-snug transition-all duration-300",
                active
                  ? "scale-[1.03] font-medium text-white"
                  : sung
                    ? "text-white/35"
                    : "text-white/60"
              )}
              style={{ fontSize: `${scale * 1.25}rem` }}
            >
              {line.text}
            </button>
          );
        })}
      </div>

      {/* bottom controls */}
      <div className="flex shrink-0 items-center justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {sync && sync.lines.length > 0 && (
          <button
            type="button"
            onClick={() => setStamping((v) => !v)}
            aria-pressed={stamping}
            data-testid="karaoke-stamp-toggle"
            className={cn(
              "flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] transition-all",
              stamping
                ? "border-[#d4b16a] bg-[#d4b16a]/15 text-[#e8cf9a]"
                : "border-white/15 text-white/70 hover:bg-white/10"
            )}
          >
            <Stamp className="size-4" aria-hidden="true" />
            {stamping ? t("Stamping — tap the next line") : t("Sync mode")}
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t("Pause") : t("Play")}
          data-testid="karaoke-play"
          className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
        >
          {playing ? (
            <span className="flex gap-[3px]" aria-hidden="true">
              <span className="h-4 w-[3px] rounded bg-black" />
              <span className="h-4 w-[3px] rounded bg-black" />
            </span>
          ) : (
            <span className="ml-1 size-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-black" aria-hidden="true" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
