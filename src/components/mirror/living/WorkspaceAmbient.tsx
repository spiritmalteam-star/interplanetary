"use client";

import { memo } from "react";
import type { ToolTabKey } from "@/lib/mirror-store";

/* ------------------------------------------------------------------ */
/*  THE WORKPLACE'S OWN SKY — every making room of the living book     */
/*  breathes beneath its own theme: the Book's drifting pages, the     */
/*  Akashic archive's rings, the Atelier's paint, the Forge's          */
/*  schematics, Manifest's expanding light. THE THREE LAWS (the        */
/*  scope sky's own, kept whole): it never takes a touch; it folds     */
/*  away while the visitor writes; a visitor who asked for less        */
/*  motion receives a still sky. Few elements, low light, the edges    */
/*  of the room — the work itself always leads.                        */
/* ------------------------------------------------------------------ */

/* ---------------------- THE BOOK — drifting pages ------------------ */

function BookSky() {
  return (
    <>
      {/* the drifting leaves — abstract pages riding a slow wind */}
      {[
        { top: "12%", left: "6%", r: "-9deg", d: "0s", dur: "26s", w: 44 },
        { top: "58%", left: "3%", r: "7deg", d: "-9s", dur: "31s", w: 34 },
        { top: "24%", left: "90%", r: "12deg", d: "-15s", dur: "24s", w: 40 },
        { top: "72%", left: "86%", r: "-5deg", d: "-4s", dur: "29s", w: 30 },
        { top: "86%", left: "38%", r: "4deg", d: "-19s", dur: "34s", w: 26 },
      ].map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="ws-page absolute rounded-[2px] border border-[color-mix(in_srgb,var(--gd,#9a781e)_45%,transparent)] bg-[color-mix(in_srgb,var(--gd,#9a781e)_7%,transparent)] shadow-[0_6px_18px_-12px_rgba(0,0,0,0.4)]"
          style={{
            top: p.top,
            left: p.left,
            width: p.w,
            height: Math.round(p.w * 1.35),
            rotate: p.r,
            animationDelay: p.d,
            animationDuration: p.dur,
          }}
        />
      ))}
      {/* the quill's arc — one stroke that never lands */}
      <svg
        viewBox="0 0 200 90"
        className="absolute right-[10%] top-[16%] w-[170px] opacity-[0.12] dark:opacity-[0.15]"
        aria-hidden="true"
      >
        <path
          d="M4 84 C 60 10, 130 6, 196 44"
          fill="none"
          stroke="#eab308"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="10 180"
          className="[animation:amb-dash_13s_linear_infinite]"
        />
      </svg>
      {/* the ink swirl — thought dissolving into paper */}
      <svg
        viewBox="0 0 120 120"
        className="absolute bottom-[6%] left-[10%] w-[110px] opacity-[0.1] dark:opacity-[0.13] [animation:amb-drift_27s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <path
          d="M60 60 m0 -34 a34 34 0 1 1 -24 58 a26 26 0 1 0 18 -46 a18 18 0 1 1 -12 32"
          fill="none"
          stroke="#eab308"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

/* --------------------- MUSIC — the sound's sky --------------------- */

function MusicSky() {
  return (
    <>
      {/* the staff lines — five quiet rows the notes live on */}
      <svg
        viewBox="0 0 260 90"
        className="absolute left-[5%] top-[14%] w-[220px] opacity-[0.1] dark:opacity-[0.13] [animation:amb-sway_21s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="0"
            y1={12 + i * 16}
            x2="260"
            y2={12 + i * 16}
            stroke="#a855f7"
            strokeWidth="1"
          />
        ))}
        <circle cx="60" cy="44" r="6" fill="#a855f7" opacity="0.75" />
        <circle cx="140" cy="20" r="5" fill="#e879f9" opacity="0.6" />
        <circle cx="210" cy="60" r="5.5" fill="#a855f7" opacity="0.65" />
      </svg>
      {/* the sound's own wave — one long breath */}
      <svg
        viewBox="0 0 320 60"
        className="absolute bottom-[12%] right-[6%] w-[240px] opacity-[0.12] dark:opacity-[0.15]"
        aria-hidden="true"
      >
        <path
          d="M0 30 Q 20 6, 40 30 T 80 30 T 120 30 T 160 30 T 200 30 T 240 30 T 280 30 T 320 30"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.5"
          strokeDasharray="9 200"
          className="[animation:amb-dash_10s_linear_infinite]"
        />
      </svg>
      {/* three drifting notes */}
      {[
        { glyph: "♪", left: "78%", d: "0s", dur: "19s" },
        { glyph: "♫", left: "16%", d: "-7s", dur: "24s" },
        { glyph: "♩", left: "48%", d: "-13s", dur: "27s" },
      ].map((n, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] select-none text-[#a855f7]"
          style={{ left: n.left, fontSize: "1.1rem", animationDelay: n.d, animationDuration: n.dur }}
        >
          {n.glyph}
        </span>
      ))}
    </>
  );
}

/* --------------------- AKASHIC — the archive sky ------------------- */

function AkashicSky() {
  return (
    <>
      {/* the archive rings — layered knowledge, concentric and old */}
      <svg
        viewBox="0 0 220 220"
        className="absolute -left-14 top-[8%] w-[210px] opacity-[0.12] dark:opacity-[0.15] [animation:amb-spin_90s_linear_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="var(--gd,#9a781e)" strokeWidth="1">
          <circle cx="110" cy="110" r="96" />
          <circle cx="110" cy="110" r="72" strokeDasharray="4 7" />
          <circle cx="110" cy="110" r="48" />
          <circle cx="110" cy="110" r="26" strokeDasharray="2 5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="110"
              y1="14"
              x2="110"
              y2="26"
              transform={`rotate(${a} 110 110)`}
            />
          ))}
        </g>
      </svg>
      {/* the papyrus column — the record's own fine rules */}
      <svg
        viewBox="0 0 90 200"
        className="absolute right-[4%] top-[30%] h-[180px] opacity-[0.11] dark:opacity-[0.14] [animation:amb-sway_25s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <rect x="6" y="4" width="78" height="192" rx="4" fill="none" stroke="var(--gd,#9a781e)" strokeWidth="1.2" />
        {[24, 44, 64, 84, 104, 124, 144, 164, 184].map((y) => (
          <line key={y} x1="14" y1={y} x2="76" y2={y} stroke="var(--gd,#9a781e)" strokeWidth="0.8" opacity="0.7" />
        ))}
      </svg>
      {/* the rising embers of the lamp */}
      {[
        { left: "30%", d: "0s", dur: "26s" },
        { left: "64%", d: "-11s", dur: "30s" },
        { left: "84%", d: "-6s", dur: "23s" },
      ].map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] rounded-full bg-[var(--gd,#9a781e)]"
          style={{ left: m.left, width: "3px", height: "3px", animationDelay: m.d, animationDuration: m.dur }}
        />
      ))}
    </>
  );
}

/* --------------------- ATELIER — the painted sky ------------------- */

function ArtxWorkspaceSky() {
  const daubs = [
    { top: "14%", left: "8%", c: "#e879f9", s: "66px", d: "24s" },
    { top: "64%", left: "5%", c: "#f0c96a", s: "50px", d: "-9s" },
    { top: "22%", left: "86%", c: "#9fe8c1", s: "58px", d: "-15s" },
    { top: "76%", left: "88%", c: "#c9a7f5", s: "44px", d: "21s" },
  ];
  return (
    <>
      {daubs.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full opacity-[0.12] blur-xl dark:opacity-[0.15] [animation:amb-drift_26s_ease-in-out_infinite]"
          style={{
            top: b.top,
            left: b.left,
            width: b.s,
            height: b.s,
            background: b.c,
            animationDelay: b.d,
          }}
        />
      ))}
      <svg
        viewBox="0 0 200 110"
        className="absolute bottom-[8%] left-[28%] w-[180px] opacity-[0.13] dark:opacity-[0.16]"
        aria-hidden="true"
      >
        <path
          d="M6 96 C 60 20, 140 20, 194 88"
          fill="none"
          stroke="#e879f9"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 170"
          className="[animation:amb-dash_12s_linear_infinite]"
        />
        <path
          d="M20 110 C 70 50, 130 46, 186 104"
          fill="none"
          stroke="#f0c96a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 160"
          className="[animation:amb-dash_15s_linear_infinite_reverse]"
        />
      </svg>
    </>
  );
}

/* --------------------- THE FORGE — engineering sky ----------------- */

function InventSky() {
  return (
    <>
      {/* the schematic grid — the draughtsman's own paper */}
      <span className="absolute inset-0 ws-blueprint-grid" aria-hidden="true" />
      {/* the gear — one slow wheel of the machine */}
      <svg
        viewBox="0 0 120 120"
        className="absolute -left-8 top-[12%] w-[130px] opacity-[0.13] dark:opacity-[0.16] [animation:amb-spin_46s_linear_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#1d4ed8" strokeWidth="1.4">
          <circle cx="60" cy="60" r="30" />
          <circle cx="60" cy="60" r="12" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="60"
              y1="22"
              x2="60"
              y2="10"
              transform={`rotate(${i * 30} 60 60)`}
            />
          ))}
        </g>
      </svg>
      {/* the measurement — a caliper's honest marks */}
      <svg
        viewBox="0 0 220 60"
        className="absolute right-[6%] top-[24%] w-[200px] opacity-[0.13] dark:opacity-[0.16] [animation:amb-drift_29s_ease-in-out_infinite]"
        aria-hidden="true"
      >
        <g stroke="#1d4ed8" strokeWidth="1.2">
          <line x1="4" y1="40" x2="216" y2="40" />
          {[10, 40, 70, 100, 130, 160, 190].map((x, i) => (
            <line key={x} x1={x} y1="32" x2={x} y2={i % 2 === 0 ? "48" : "44"} />
          ))}
          <path d="M10 12 L 34 12 L 34 24" fill="none" />
          <circle cx="150" cy="16" r="7" fill="none" />
        </g>
      </svg>
      {/* the second wheel, counter-turning */}
      <svg
        viewBox="0 0 90 90"
        className="absolute bottom-[8%] right-[12%] w-[84px] opacity-[0.12] dark:opacity-[0.15] [animation:amb-spin-rev_38s_linear_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#1d4ed8" strokeWidth="1.3">
          <circle cx="45" cy="45" r="24" />
          <circle cx="45" cy="45" r="9" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="45" y1="15" x2="45" y2="6" transform={`rotate(${i * 45} 45 45)`} />
          ))}
        </g>
      </svg>
    </>
  );
}

/* --------------------- MANIFEST — expanding light ------------------ */

function ManifestSky() {
  return (
    <>
      {/* the expanding rings — intention becoming structure */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute left-[68%] top-[10%] size-[30vh] rounded-full border border-[color-mix(in_srgb,#be185d_35%,transparent)] [animation:amb-breathe_13s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 4.3}s` }}
        />
      ))}
      {/* the radiant polygon — creation's own geometry */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-10 bottom-[6%] w-[190px] opacity-[0.12] dark:opacity-[0.15] [animation:amb-spin_80s_linear_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#be185d" strokeWidth="1.1">
          <polygon points="100,16 171,58 171,142 100,184 29,142 29,58" />
          <polygon points="100,42 148,71 148,129 100,158 52,129 52,71" strokeDasharray="4 6" />
          <line x1="100" y1="16" x2="100" y2="184" opacity="0.6" />
          <line x1="29" y1="58" x2="171" y2="142" opacity="0.6" />
          <line x1="171" y1="58" x2="29" y2="142" opacity="0.6" />
        </g>
      </svg>
      {/* the rising sparks of making */}
      {[
        { left: "18%", d: "0s", dur: "25s" },
        { left: "42%", d: "-9s", dur: "30s" },
        { left: "72%", d: "-16s", dur: "27s" },
      ].map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] rounded-full bg-[#be185d]"
          style={{ left: m.left, width: "3px", height: "3px", animationDelay: m.d, animationDuration: m.dur }}
        />
      ))}
    </>
  );
}

/* ------------------- the borrowed skies (labs) --------------------- */

function QuantumWorkspaceSky() {
  return (
    <>
      <svg
        viewBox="0 0 360 70"
        className="absolute bottom-[10%] left-[4%] w-[min(300px,68vw)] opacity-[0.13] dark:opacity-[0.16]"
        aria-hidden="true"
      >
        <path
          d="M0 40 C 40 40, 50 10, 90 10 C 130 10, 140 52, 180 52 C 220 52, 230 14, 270 14 C 300 14, 320 40, 360 40"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.6"
          strokeDasharray="12 220"
          className="[animation:amb-dash_11s_linear_infinite]"
        />
      </svg>
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-8 top-[8%] w-[170px] opacity-[0.12] dark:opacity-[0.15] [animation:amb-spin_60s_linear_infinite]"
        aria-hidden="true"
      >
        <g fill="none" stroke="#a78bfa" strokeWidth="1.1">
          <ellipse cx="100" cy="100" rx="84" ry="30" />
          <ellipse cx="100" cy="100" rx="84" ry="30" transform="rotate(60 100 100)" />
          <ellipse cx="100" cy="100" rx="84" ry="30" transform="rotate(120 100 100)" />
        </g>
        <circle cx="100" cy="100" r="6" fill="#e879f9" opacity="0.75" />
      </svg>
      {[
        { top: "40%", left: "30%", d: "0s" },
        { top: "66%", left: "72%", d: "-7s" },
      ].map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute size-[4px] rounded-full bg-[#a78bfa] opacity-30 [animation:amb-twinkle_8s_ease-in-out_infinite]"
          style={{ top: s.top, left: s.left, animationDelay: s.d }}
        />
      ))}
    </>
  );
}

function HealxWorkspaceSky() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute bottom-[-20%] left-[58%] size-[32vh] rounded-full border border-[color-mix(in_srgb,#2dd4bf_35%,transparent)] [animation:amb-breathe_12s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 4}s` }}
        />
      ))}
      <svg
        viewBox="0 0 300 60"
        className="absolute left-[6%] top-[16%] w-[min(250px,60vw)] opacity-[0.15] dark:opacity-[0.18]"
        aria-hidden="true"
      >
        <path
          d="M0 32 H90 L104 10 L120 52 L134 32 H300"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="1.6"
          strokeDasharray="14 260"
          className="[animation:amb-dash_10s_linear_infinite]"
        />
      </svg>
    </>
  );
}

/* ------------------- the quiet default (motes) --------------------- */

function QuietSky() {
  return (
    <>
      {[
        { left: "14%", d: "0s", dur: "27s" },
        { left: "38%", d: "-10s", dur: "31s" },
        { left: "62%", d: "-5s", dur: "24s" },
        { left: "86%", d: "-18s", dur: "29s" },
      ].map((m, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="amb-mote absolute bottom-[-4%] rounded-full bg-[var(--scope-a,#9a781e)]"
          style={{ left: m.left, width: "3px", height: "3px", animationDelay: m.d, animationDuration: m.dur }}
        />
      ))}
    </>
  );
}

function SkyFor(tab: ToolTabKey | null) {
  switch (tab) {
    case "dreambook":
      return <BookSky />;
    case "lightcodes":
      return <MusicSky />;
    case "akashic":
      return <AkashicSky />;
    case "artx":
      return <ArtxWorkspaceSky />;
    case "invent":
      return <InventSky />;
    case "mirroros":
      return <ManifestSky />;
    case "quantum":
      return <QuantumWorkspaceSky />;
    case "healx":
      return <HealxWorkspaceSky />;
    default:
      return <QuietSky />;
  }
}

/** THE WORKPLACE'S OWN SKY — mounted behind every making room; keyed
    by the active tab so each room rises with its own world. Folds away
    while the visitor writes (data-dormant). */
export const WorkspaceAmbient = memo(function WorkspaceAmbient({
  tab,
  dormant = false,
}: {
  tab: ToolTabKey | null;
  dormant?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="workspace-ambient"
      data-tab={tab ?? "quiet"}
      data-dormant={dormant ? "true" : "false"}
      className="scope-ambient pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
    >
      {SkyFor(tab)}
    </div>
  );
});
