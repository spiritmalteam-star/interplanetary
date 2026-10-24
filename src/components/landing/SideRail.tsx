"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SideRail — THE SHOULDERS' NEW DRESS (desktop, xl and wider).       */
/*                                                                     */
/*  Where the six still artworks once hung, the house now wears words: */
/*                                                                     */
/*  1. REMEMBRANCE STICKERS — five colored paper squares per side,     */
/*     stuck by hand just below the hero banner (the same line the     */
/*     old gallery hung from). Each carries a remembrance code (R·01)  */
/*     and a small phrase of the Remembrance Law: humans who remember; */
/*     the star seed is a consciousness that forgets less who it is —  */
/*     a human who remembers. Ten pastels, ten phrases, and a          */
/*     DETERMINISTIC hand: rotation, offset, size and tape are seeded  */
/*     by the UTC hour, so the server and the visitor agree on where   */
/*     every sticker fell (no Math.random, no hydration mismatch).     */
/*                                                                     */
/*  2. MIRROR QUOTES — three porcelain plates per side beneath the     */
/*     stickers, fed by /api/mirror-quote: one set of words per UTC     */
/*     hour, refetched at the top of the hour (and when a hidden tab   */
/*     returns into a new hour). If the sky is silent, the house       */
/*     speaks its own shelf. The quotes are real content — never       */
/*     aria-hidden, selectable, calmly readable.                       */
/*                                                                     */
/*  CALM LAWS: one gentle settle-in (transform + opacity only), no     */
/*     constant animation, no pointer surface on the decorations.      */
/* ------------------------------------------------------------------ */

type RailSide = "left" | "right";

/* -------------------- the remembrance stickers --------------------- */

/* ten distinct pastels — five to a shoulder */
const STICKER_COLORS: Record<RailSide, readonly string[]> = {
  left: ["#a7f3d0", "#ddd6fe", "#fecdd3", "#fde68a", "#bae6fd"],
  right: ["#fed7aa", "#d9f99d", "#fbcfe8", "#fef3c7", "#cffafe"],
};

/* the Remembrance Law, ten small ways — five phrases per side */
const REMEMBER: Record<RailSide, readonly { code: string; text: string }[]> = {
  left: [
    { code: "R·01", text: "You are human, and you remember." },
    { code: "R·02", text: "The forgetting was never the end." },
    { code: "R·03", text: "Your home walks beside you." },
    { code: "R·04", text: "What you miss, you carried here." },
    { code: "R·05", text: "Remembering is a returning, not a reach." },
  ],
  right: [
    { code: "R·06", text: "The stars are early, not far." },
    { code: "R·07", text: "You knew the way before the map." },
    { code: "R·08", text: "A name once heard is never lost." },
    { code: "R·09", text: "Long ago is closer than it looks." },
    { code: "R·10", text: "You are the light's kept promise." },
  ],
};

/* one corner sticks up a little — the hand was not a machine */
const CORNERS = [
  "rounded-tl-[12px]",
  "rounded-tr-[12px]",
  "rounded-br-[12px]",
  "rounded-bl-[12px]",
] as const;

/* deterministic hand-sticking: FNV-1a seed → mulberry32 stream, all
   from the UTC hour so server and client cut the same tape */
type StickerPose = {
  rot: number; // -9..9 deg
  x: number; // -10..10 px
  size: number; // 96..110 px square
  pull: number; // negative top margin — the loose overlap
  corner: string; // the one slightly-lifted corner
  tape: number; // tape strip tilt, -4..4 deg
};

function stickerPose(seed: string): StickerPose {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    rot: round1(rnd() * 18 - 9),
    x: round1(rnd() * 20 - 10),
    size: Math.round(96 + rnd() * 14),
    pull: round1(-(10 + rnd() * 14)),
    corner: CORNERS[Math.floor(rnd() * 4)],
    tape: round1(rnd() * 8 - 4),
  };
}

function utcHourKey(date = new Date()): string {
  return date.toISOString().slice(0, 13);
}

/* ------------------- the mirror's hourly words --------------------- */

/* the house's own shelf — the exact words the route speaks when the
   sky is silent, kept here so an error still dresses the rails */
const FALLBACK_QUOTES: string[] = [
  "You do not have to carry it all today.",
  "What you notice, you nourish.",
  "The question is already a door.",
  "Rest is not a reward; it is a rhythm.",
  "You are allowed to begin again, quietly.",
  "What keeps pulling your attention is worth a gentle look.",
  "Small honesty outlasts loud certainty.",
  "The mirror does not judge; it remembers with you.",
];

/* one shared memory for both shoulders — a single fetch per hour
   serves the left and the right rail alike */
type SharedWords = { quotes: string[] | null; hour: string; done: boolean };
let shared: SharedWords = { quotes: null, hour: "", done: false };
let inFlight = false;
const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

async function loadQuotes(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const res = await fetch("/api/mirror-quote", { cache: "no-store" });
    if (!res.ok) throw new Error(`mirror-quote ${res.status}`);
    const data = (await res.json()) as { quotes?: unknown; hour?: unknown };
    const quotes = Array.isArray(data.quotes)
      ? data.quotes.filter(
          (q): q is string => typeof q === "string" && q.trim().length > 0
        )
      : [];
    if (quotes.length < 6) throw new Error("the mirror spoke too thin");
    shared = {
      quotes: quotes.slice(0, 8),
      hour: typeof data.hour === "string" ? data.hour : utcHourKey(),
      done: true,
    };
  } catch {
    shared = { quotes: FALLBACK_QUOTES, hour: utcHourKey(), done: true };
  } finally {
    inFlight = false;
    announce();
  }
}

function useMirrorWords(): { quotes: string[] | null; hour: string } {
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    if (!shared.done && !inFlight) void loadQuotes();

    /* the hour's clock: sleep until the next top of the hour, then
       breathe once an hour — always aligned to the mirror's own hour */
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    const now = new Date();
    const nextHour = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours() + 1,
      0,
      0,
      0
    );
    timeout = setTimeout(() => {
      void loadQuotes();
      interval = setInterval(() => void loadQuotes(), 3_600_000);
    }, Math.max(nextHour - now.getTime(), 0));

    /* a tab that slept through the hour's turn catches up on return */
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        shared.done &&
        utcHourKey() !== shared.hour
      ) {
        void loadQuotes();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      listeners.delete(listener);
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return { quotes: shared.quotes, hour: shared.hour };
}

/* --------------------------- the rail ------------------------------ */

export default function SideRail({ side }: { side: RailSide }) {
  /* one gentle settle-in, then the rail rests forever */
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  /* the hour's seed — the same string on server and client, so the
     hand-stuck randomness agrees across hydration */
  const hourSeed = useMemo(() => utcHourKey(), []);
  const stickers = useMemo(
    () =>
      REMEMBER[side].map((sticker, i) => ({
        ...sticker,
        color: STICKER_COLORS[side][i],
        pose: stickerPose(`${hourSeed}:${side}:${i}`),
      })),
    [hourSeed, side]
  );

  const { quotes, hour } = useMirrorWords();
  const railQuotes = quotes
    ? side === "left"
      ? quotes.slice(0, 3)
      : quotes.slice(3, 6)
    : [];
  const captionHour = hour ? `${hour.slice(11, 13)}:00` : "";

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-[calc(min(84vh,680px)+36px)] z-0 hidden select-none xl:block",
        side === "left" ? "left-5" : "right-5"
      )}
      style={{
        /* the old gallery's exact footing: half again the old shard's
           width, never reaching into the 900px column */
        width: "min(18vw, 340px, calc((100vw - 920px) / 2))",
      }}
    >
      <div
        className={cn(
          "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
          settled ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {/* the remembrance stickers — stuck by hand below the banner */}
        <div aria-hidden="true" className="relative flex flex-col">
          {stickers.map((sticker, i) => (
            <div
              key={sticker.code}
              className="relative"
              style={{ marginTop: i === 0 ? 0 : sticker.pose.pull }}
            >
              <div
                className={cn(
                  "relative flex flex-col justify-between rounded-[3px] p-2",
                  sticker.pose.corner
                )}
                style={{
                  width: sticker.pose.size,
                  height: sticker.pose.size,
                  backgroundColor: sticker.color,
                  transform: `translate(${sticker.pose.x}px, 0) rotate(${sticker.pose.rot}deg)`,
                  boxShadow:
                    "0 10px 18px rgba(44,37,23,0.16), 0 2px 5px rgba(44,37,23,0.12)",
                }}
              >
                {/* hairline inner border — the paper's own edge */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-[3px] rounded-[2px] border border-[rgba(63,58,46,0.22)]",
                    sticker.pose.corner
                  )}
                />
                {/* the tape strip */}
                <span
                  aria-hidden="true"
                  className="absolute -top-[7px] left-1/2 h-[14px] w-[44px] rounded-[1px] bg-[rgba(255,253,246,0.55)] shadow-[0_1px_2px_rgba(44,37,23,0.12)]"
                  style={{
                    transform: `translateX(-50%) rotate(${sticker.pose.tape}deg)`,
                  }}
                />
                <span className="mono-label text-[8px] uppercase tracking-[0.22em] text-[rgba(63,58,46,0.66)]">
                  {sticker.code}
                </span>
                <p className="font-[family-name:var(--font-literata)] text-[10px] leading-[1.32] text-[#3f3a2e]">
                  {sticker.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* the mirror's words — real content, selectable, never hidden */}
        <div
          className="pointer-events-auto mt-9 flex flex-col gap-5"
          role="list"
          aria-label={
            side === "left"
              ? "Words from the mirror — left side"
              : "Words from the mirror — right side"
          }
        >
          {railQuotes.length === 0
            ? [0, 1, 2].map((i) => (
                <div
                  key={`waiting-${i}`}
                  aria-hidden="true"
                  className="h-[104px] animate-pulse rounded-[10px] border border-[rgba(63,58,46,0.12)] motion-reduce:animate-none"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, #fffdf6 70%, transparent)",
                  }}
                />
              ))
            : railQuotes.map((quote, i) => (
                <figure
                  key={`${hour}-${i}`}
                  role="listitem"
                  className="rounded-[10px] border border-[rgba(63,58,46,0.16)] p-4 shadow-[0_10px_24px_rgba(44,37,23,0.10)]"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, #fffdf6 88%, transparent)",
                  }}
                >
                  <blockquote className="font-[family-name:var(--font-literata)] text-[15px] italic leading-relaxed text-[var(--lp-head)]">
                    “{quote}”
                  </blockquote>
                  <figcaption className="mono-label mt-3 text-[9px] uppercase tracking-[0.24em] text-[var(--lp-faint)]">
                    the mirror · {captionHour}
                  </figcaption>
                </figure>
              ))}
        </div>
      </div>
    </div>
  );
}
