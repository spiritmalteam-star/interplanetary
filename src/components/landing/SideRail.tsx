"use client";

/* ------------------------------------------------------------------ */
/*  THE SIDE RAILS — the threshold's shoulders. Each edge wears five   */
/*  hand-stuck remembrance stickers (a different pastel each, the      */
/*  Remembrance Law's codes) and three porcelain plates of the         */
/*  Mirror's hourly quotes — one fresh set every hour, fed by          */
/*  /api/mirror-quote. The rails scroll with the house and never       */
/*  move on their own (the calm law); they rest on every small         */
/*  screen, and stand only where the page is empty.                    */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* the Remembrance Law's codes — ten small laws, five on each shoulder */
const CODES: { code: string; word: string; pastel: string; ink: string }[] = [
  { code: "R·01", word: "Notice", pastel: "#f5e6cf", ink: "#6b5232" },
  { code: "R·02", word: "Rest", pastel: "#e7eef7", ink: "#3f5878" },
  { code: "R·03", word: "Begin", pastel: "#e8f2e4", ink: "#3f6b46" },
  { code: "R·04", word: "Remember", pastel: "#f7e7ee", ink: "#7a4058" },
  { code: "R·05", word: "Tend", pastel: "#f2ecfb", ink: "#5b4a80" },
  { code: "R·06", word: "Ask", pastel: "#e4f1f2", ink: "#33646b" },
  { code: "R·07", word: "Trust", pastel: "#fbeee2", ink: "#7d5232" },
  { code: "R·08", word: "Soften", pastel: "#f3e8e2", ink: "#6e4a3c" },
  { code: "R·09", word: "Keep", pastel: "#eef0e3", ink: "#57603a" },
  { code: "R·10", word: "Return", pastel: "#ecebf5", ink: "#4a4a78" },
];

/* a tiny module-level hand so the two rails never fetch twice */
let quoteCache: { hourKey: string; quotes: string[] } | null = null;

function hourKey(): string {
  return new Date().toISOString().slice(0, 13);
}

async function readQuotes(): Promise<string[]> {
  const key = hourKey();
  if (quoteCache && quoteCache.hourKey === key) return quoteCache.quotes;
  try {
    const res = await fetch("/api/mirror-quote", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as { quotes?: string[] } | null;
    const quotes = Array.isArray(data?.quotes) && data.quotes.length >= 6
      ? (data.quotes as string[])
      : [];
    if (quotes.length >= 6) {
      quoteCache = { hourKey: key, quotes };
      return quotes;
    }
  } catch {
    /* the shelf forgives — the static words stand below */
  }
  quoteCache = {
    hourKey: key,
    quotes: [
      "You do not have to carry it all today.",
      "What you notice, you nourish.",
      "The question is already a door.",
      "Rest is not a reward; it is a rhythm.",
      "You are allowed to begin again, quietly.",
      "What keeps pulling your attention is worth a gentle look.",
    ],
  };
  return quoteCache.quotes;
}

function Sticker({
  code,
  word,
  pastel,
  ink,
  tilt,
}: {
  code: string;
  word: string;
  pastel: string;
  ink: string;
  tilt: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="select-none rounded-[2px] px-3 py-2.5 text-center shadow-[0_3px_10px_-4px_rgba(30,24,14,0.35)]"
      style={{
        background: pastel,
        color: ink,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <p className="mono-label text-[8px] tracking-[0.24em] opacity-70">{code}</p>
      <p className="font-serif text-[13.5px] italic leading-tight">{word}</p>
    </div>
  );
}

function Plate({ quote }: { quote: string }) {
  return (
    <div className="rounded-xl border border-[rgba(120,108,88,0.28)] bg-[rgba(248,246,240,0.88)] px-3.5 py-3 shadow-[0_2px_14px_-8px_rgba(40,34,20,0.4)] backdrop-blur-sm">
      <p className="font-serif text-[12px] italic leading-snug text-[#44403a]">
        {quote}
      </p>
      <p className="mono-label mt-1.5 text-[7.5px] uppercase tracking-[0.22em] text-[#8a8378]">
        the Mirror · this hour
      </p>
    </div>
  );
}

interface Props {
  side: "left" | "right";
}

export default function SideRail({ side }: Props) {
  const [quotes, setQuotes] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    void readQuotes().then((all) => {
      if (alive) setQuotes(all);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* five stickers on each shoulder, each stuck a little differently */
  const stickers = side === "left" ? CODES.slice(0, 5) : CODES.slice(5);
  const tilts = side === "left" ? [-2.2, 1.6, -1.1, 2.4, -1.8] : [2.1, -1.5, 1.2, -2.5, 1.7];
  /* three plates per shoulder — the hour's six words split in two */
  const plates =
    side === "left" ? quotes.slice(0, 3) : quotes.slice(3, 6);

  return (
    <aside
      aria-hidden="true"
      data-testid={`side-rail-${side}`}
      className={cn(
        "pointer-events-none absolute z-0 hidden w-[190px] flex-col gap-3 xl:flex",
        side === "left" ? "left-4" : "right-4"
      )}
      style={{ top: "min(80vh, 600px)" }}
    >
      <div className="flex flex-col items-center gap-2.5">
        {stickers.map((s, i) => (
          <Sticker key={s.code} {...s} tilt={tilts[i]} />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {plates.map((q, i) => (
          <Plate key={`${hourKey()}-${i}`} quote={q} />
        ))}
      </div>
    </aside>
  );
}
