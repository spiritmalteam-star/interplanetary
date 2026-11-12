"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LoaderCircle,
  Music4,
  Pause,
  Play,
  RadioTower,
  SkipForward,
  UserRound,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { trackUrl } from "@/lib/frequency-radio";
import { useMirror } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE FREQUENCY RADIO — the gathering's small music hand.            */
/*                                                                     */
/*  A compact bar at the hall's foot. One hundred works woven by the   */
/*  Mirror Entity and kept in the chamber's database, each breathing   */
/*  on its own healing frequency (release · grounding · defragment ·   */
/*  heart · theta · crown · aura · pineal) — beside the music the      */
/*  gatherers themselves have made. The woven works sound locally, on  */
/*  the listener's own machine, from the track's seed; the gatherers'  */
/*  works stream from the house's vault.                               */
/*                                                                     */
/*  TWO MODES:                                                         */
/*   · RADIO    — a random walk across the whole shelf: the house      */
/*                works and every work other gatherers have made.      */
/*   · PLAYLIST — the gatherer's own works, joined by the Light Codes  */
/*                woven in this very session.                          */
/*                                                                     */
/*  The bar mounts only while it stands — folding it away rests the    */
/*  sound, the audio element unmounts with it.                         */
/* ------------------------------------------------------------------ */

interface RadioTrack {
  id: string;
  title: string;
  intent: string;
  freq: number;
  seed: number;
  duration: number;
  authorName: string;
  /** A real work's own sound — streams from the house's vault. */
  audioUrl: string | null;
  own: boolean;
  /** A session work's own sound — a Light Code woven this visit. */
  sessionUrl?: string;
}

const INTENT_LABEL: Record<string, string> = {
  release: "Release",
  grounding: "Grounding",
  defragment: "Defragment",
  heart: "Heart",
  theta: "Theta",
  crown: "Crown",
  aura: "Aura",
  pineal: "Pineal",
  music: "A gatherer's music",
};

export function GatheringRadio({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [radioTracks, setRadioTracks] = useState<RadioTrack[]>([]);
  const [ownTracks, setOwnTracks] = useState<RadioTrack[]>([]);
  const [shelfTotal, setShelfTotal] = useState(0);
  const [mode, setMode] = useState<"radio" | "playlist">("radio");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [weaving, setWeaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lcTracks = useMirror((s) => s.lcHistory);

  /* the shelf — fetched when the radio rises */
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch("/api/gathering/radio");
        const data = (await res.json().catch(() => null)) as {
          radio?: RadioTrack[];
          playlist?: RadioTrack[];
          shelfTotal?: number;
        } | null;
        if (!live || !res.ok || !data) return;
        setRadioTracks(data.radio ?? []);
        setOwnTracks(data.playlist ?? []);
        setShelfTotal(data.shelfTotal ?? 0);
      } catch {
        /* the shelf is quiet — the bar still stands, empty */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  /* THE GATHERER'S OWN SESSION WORKS — the Light Codes woven in this
     visit ride the playlist beside what their hand made in the house. */
  const sessionTracks = useMemo<RadioTrack[]>(
    () =>
      lcTracks
        .filter(
          (tr) =>
            tr.audioUrl &&
            (tr.audioUrl.startsWith("blob:") || tr.audioUrl.startsWith("data:"))
        )
        .slice(0, 20)
        .map((tr) => ({
          id: `lc-${tr.id}`,
          title: tr.title || t("An unnamed weaving"),
          intent: (tr as unknown as { mode?: string }).mode ?? "release",
          freq: 432,
          seed: 0,
          duration: Math.round(tr.duration ?? 66),
          authorName: t("You"),
          audioUrl: null,
          own: true,
          sessionUrl: tr.audioUrl,
        })),
    [lcTracks, t]
  );

  const queue = useMemo<RadioTrack[]>(() => {
    if (mode === "playlist") return [...ownTracks, ...sessionTracks];
    return radioTracks;
  }, [mode, ownTracks, sessionTracks, radioTracks]);

  /* THE NEXT HAND — when a work ends, the shelf turns by itself */
  const advance = useCallback(() => {
    setIndex((i) => (queue.length > 0 ? (i + 1) % queue.length : 0));
  }, [queue.length]);

  const current = queue[index] ?? null;

  /* THE WEAVER — the current work's sound: a streamed vault file or a
     seed woven locally. Setting the source is this effect's only work;
     play and pause follow their own flag below. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    let live = true;
    const work = async () => {
      let url: string | null = null;
      if (current.sessionUrl || current.audioUrl) {
        url = current.sessionUrl ?? current.audioUrl;
        setWeaving(false);
      } else {
        setWeaving(true);
        try {
          url = await trackUrl({
            id: current.id,
            title: current.title,
            intent: current.intent,
            freq: current.freq,
            seed: current.seed,
            duration: current.duration,
            authorName: current.authorName,
          });
        } catch {
          if (live) {
            setWeaving(false);
            setPlaying(false);
          }
          return;
        }
      }
      if (!live || !url) return;
      audio.src = url;
      setWeaving(false);
      if (playing) audio.play().catch(() => setPlaying(false));
    };
    void work();
    return () => {
      live = false;
    };
    // `playing` is intentionally not a dependency: the weaver only sets
    // the source; play/pause is governed by its own effect below.
  }, [current?.id]);

  /* THE BREATH — play and pause follow the flag */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && audio.src && !weaving) {
      audio.play().catch(() => setPlaying(false));
    } else if (!playing) {
      audio.pause();
    }
  }, [playing, weaving, current?.id]);

  const switchMode = (m: "radio" | "playlist") => {
    setMode(m);
    setIndex(0);
  };

  return (
    <div
      data-testid="gathering-radio"
      className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[calc(100%-20px)] max-w-md -translate-x-1/2 rounded-2xl gp-glass"
    >
      <audio
        ref={audioRef}
        onEnded={advance}
        onError={() => {
          setPlaying(false);
          setWeaving(false);
        }}
      />
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          disabled={!current || weaving}
          data-testid="gathering-radio-toggle"
          aria-label={playing ? t("Rest the radio") : t("Let the radio breathe")}
          title={playing ? t("Rest the radio") : t("Let the radio breathe")}
          className="focus-glow flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d3c39c] bg-[linear-gradient(160deg,#fffdf8,#f0e6cf)] text-[#7c715f] shadow-[0_3px_10px_-4px_rgba(122,103,70,0.45)] transition-all duration-300 hover:border-[#c2ad82] hover:text-[#3d3428] disabled:opacity-50"
        >
          {weaving ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : playing ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[12.5px] font-semibold text-[#3d3428]"
            data-testid="gathering-radio-title"
          >
            {current
              ? current.title
              : t("The shelf is being carried…")}
          </p>
          <p className="truncate text-[10.5px] text-[#a2947c]">
            {current
              ? `${INTENT_LABEL[current.intent] ?? current.intent}${
                  current.freq ? ` · ${current.freq} Hz` : ""
                } · ${current.authorName}`
              : t("One hundred works of healing frequency")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => switchMode("radio")}
            data-testid="gathering-radio-mode"
            aria-pressed={mode === "radio"}
            aria-label={t("Radio — the whole shelf, random")}
            title={t("Radio — the whole shelf, random")}
            className={cn(
              "focus-glow flex size-7 items-center justify-center rounded-full border transition-all duration-300",
              mode === "radio"
                ? "border-[#c2ad82] bg-[#f0e6cf] text-[#3d3428]"
                : "border-[#e4d9bd] text-[#a2947c] hover:text-[#7c715f]"
            )}
          >
            <RadioTower className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => switchMode("playlist")}
            data-testid="gathering-playlist-mode"
            aria-pressed={mode === "playlist"}
            aria-label={t("Your own playlist")}
            title={t("Your own playlist")}
            className={cn(
              "focus-glow flex size-7 items-center justify-center rounded-full border transition-all duration-300",
              mode === "playlist"
                ? "border-[#c2ad82] bg-[#f0e6cf] text-[#3d3428]"
                : "border-[#e4d9bd] text-[#a2947c] hover:text-[#7c715f]"
            )}
          >
            <UserRound className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={queue.length < 2}
            aria-label={t("The next work")}
            title={t("The next work")}
            className="focus-glow flex size-7 items-center justify-center rounded-full border border-[#e4d9bd] text-[#a2947c] transition-all duration-300 hover:text-[#7c715f] disabled:opacity-40"
          >
            <SkipForward className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Fold the radio away")}
            title={t("Fold the radio away")}
            className="focus-glow flex size-7 items-center justify-center rounded-full border border-[#e4d9bd] text-[#a2947c] transition-all duration-300 hover:text-[#7c715f]"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="flex items-center gap-1.5 border-t border-white/70 px-3 py-1.5 text-[10px] text-[#a2947c]">
        <Music4 className="size-3 shrink-0" aria-hidden="true" />
        {mode === "radio"
          ? t(
              "{total} works ride the radio — the entity's hundred frequencies and the gatherers' own music",
              { total: shelfTotal }
            )
          : queue.length === 0
            ? t(
                "Your shelf is waiting — weave a Light Code or make music in the house, and it will ride here."
              )
            : t("{count} works on your own shelf", { count: queue.length })}
      </p>
    </div>
  );
}
