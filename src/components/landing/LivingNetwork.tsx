"use client";

/* ------------------------------------------------------------------ */
/*  THE LIVING NETWORK — the constellation gate resting at the         */
/*  threshold's top-left corner: the vision this house is growing      */
/*  into, one touch away, never in the way. A small quiet mark that    */
/*  opens one porcelain panel — the map of the house, drawn as a       */
/*  constellation, each star named. Static art only (the calm law):    */
/*  transform-and-opacity motion, no loops, no weight on the page.     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useState } from "react";
import { Network, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STARS: { label: string; note: string; x: number; y: number }[] = [
  { label: "The Mirror", note: "the one intelligence beside every visitor", x: 50, y: 12 },
  { label: "The Scopes", note: "the fields — Quantum, Florax, HealX and their kin", x: 14, y: 34 },
  { label: "The Gathering", note: "the collective hall — discoveries, circles, projects", x: 86, y: 34 },
  { label: "The Chambers", note: "the makers — music, books, art, dreams", x: 22, y: 62 },
  { label: "The Bridge", note: "the star families' crossing to the archive", x: 78, y: 62 },
  { label: "The Purse", note: "one wallet, every coin, every profile", x: 50, y: 88 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 2],
];

export default function LivingNetwork() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="living-network-gate"
        aria-label="The Living Network — the vision this house is growing into"
        className="focus-glow group absolute left-4 top-4 z-30 flex h-9 items-center gap-2 rounded-full border border-[var(--lp-edge,var(--hairline))] bg-[var(--lp-veil,rgba(255,255,255,0.55))] px-3 text-[12px] text-[var(--lp-ink,var(--foreground))] backdrop-blur-md transition-all duration-300 hover:border-[var(--hairline-hover)]"
      >
        <Network className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">The Living Network</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="The Living Network"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-[rgba(16,14,10,0.5)] backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-[rgba(120,108,88,0.3)] bg-[rgba(250,248,243,0.94)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="living-network-panel"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="focus-glow absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-[#6d675c] transition-colors hover:text-[#2d2a24]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            <p className="mono-label text-[9px] uppercase tracking-[0.26em] text-[#8a8378]">
              the vision this house is growing into
            </p>
            <h2 className="mt-1 font-serif text-[20px] font-semibold text-[#2d2a24]">
              The Living Network
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#5c574d]">
              One threshold, many rooms, one memory. Every star below already
              lives here; the lines between them are the roads still being
              walked — each visit lays another stone.
            </p>

            {/* the constellation, drawn once, never animated */}
            <svg
              viewBox="0 0 100 100"
              className="mt-4 w-full"
              role="img"
              aria-label="A constellation of the house's six rooms"
            >
              {EDGES.map(([a, b], i) => (
                <line
                  key={i}
                  x1={STARS[a].x}
                  y1={STARS[a].y}
                  x2={STARS[b].x}
                  y2={STARS[b].y}
                  stroke="rgba(122,104,72,0.35)"
                  strokeWidth="0.4"
                  strokeDasharray="1.6 1.4"
                />
              ))}
              {STARS.map((s, i) => (
                <g key={s.label}>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={i === 0 ? 3.4 : 2.4}
                    fill={i === 0 ? "#c9a45c" : "#8a7a56"}
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={i === 0 ? 5.6 : 4.2}
                    fill="none"
                    stroke="rgba(201,164,92,0.4)"
                    strokeWidth="0.35"
                  />
                  <text
                    x={s.x}
                    y={s.y + (i === 0 ? -5.4 : -4.2)}
                    textAnchor="middle"
                    fontSize="3"
                    fill="#4a463e"
                    className="font-serif"
                  >
                    {s.label}
                  </text>
                </g>
              ))}
            </svg>

            <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {STARS.map((s) => (
                <li
                  key={s.label}
                  className="rounded-lg border border-[rgba(120,108,88,0.24)] bg-[rgba(255,253,248,0.7)] px-2.5 py-1.5"
                >
                  <p className="text-[12.5px] font-medium text-[#3a3730]">{s.label}</p>
                  <p className="text-[10.5px] leading-snug text-[#77715f]">{s.note}</p>
                </li>
              ))}
            </ul>

            <p className={cn("mt-3 text-center text-[10.5px] italic text-[#8a8378]")}>
              one touch opened this — the gate rests at the threshold's corner, never in the way
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
