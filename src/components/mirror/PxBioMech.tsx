"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  X,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  bxSliderMeta,
  pxBioChamber,
  pxBioMechanisms,
  type BxMechanism,
  type BxSliderKey,
} from "@/lib/data/particlex-bio";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  PARTICLEX — BIO MECHANICS · the living engines, drawn kindly       */
/*  A scientific storyboard engine: five biotherapeutic mechanisms,    */
/*  each told in four hand-built ink panels. Functional color law:     */
/*  native machinery = slate / bone · disease = coral, pulsing ·       */
/*  engines = cyan / emerald / gold · action moments = light flashes.  */
/*  Depth: the cell stays soft-blurred; the engines stay sharp.        */
/* ================================================================== */

/* --------------------------- ink palette --------------------------- */

const CORAL = "#FF7A5C";
const CORAL_DEEP = "#E85D3D";
const CYAN = "#35E0D2";
const CYAN_DEEP = "#17B8AC";
const EMERALD = "#3FD68F";
const EMERALD_DEEP = "#2AA96F";
const GOLD = "#E6B54A";
const GOLD_DEEP = "#C99A2E";
const SLATE = "#5A6478";
const SLATE_DEEP = "#3E4A5C";
const SLATE_LIGHT = "#8A93A6";
const BONE = "#C9C4B8";

const MECH_DOT: Record<BxMechanism["id"], string> = {
  glue: CYAN,
  protac: EMERALD,
  crispr: GOLD,
  proteasome: SLATE_LIGHT,
  cascade: CORAL,
};

/* ---------------------- component-scoped motion -------------------- */
/*  Kept here so globals.css stays untouched; reduced-motion is        */
/*  honored inside this block, matching the app's global law.          */

const BX_CSS = `
@keyframes bx-pulse { 0%, 100% { transform: scale(1); opacity: 0.92; } 50% { transform: scale(1.07); opacity: 1; } }
.bx-pulse { animation: bx-pulse 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes bx-flash { 0%, 100% { opacity: 0.18; } 50% { opacity: 1; } }
.bx-flash { animation: bx-flash var(--bx-dur, 2.4s) ease-in-out infinite; }
@keyframes bx-drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.bx-drift { animation: bx-drift 5.5s ease-in-out infinite; }
@keyframes bx-flow { to { stroke-dashoffset: -26; } }
.bx-flow { stroke-dasharray: 6 7; animation: bx-flow var(--bx-dur, 1.6s) linear infinite; }
@keyframes bx-twinkle { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.85; } }
.bx-twinkle { animation: bx-twinkle 3.2s ease-in-out infinite; }
.bx-twinkle-2 { animation-delay: 1.1s; }
.bx-twinkle-3 { animation-delay: 2.1s; }
@media (prefers-reduced-motion: reduce) {
  .bx-pulse, .bx-flash, .bx-drift, .bx-flow, .bx-twinkle { animation: none !important; }
}
`;

const cssVar = (o: Record<string, string>) => o as CSSProperties;

/* ------------------------- shared ink parts ------------------------ */

const ROGUE_PATH =
  "M -26 4 C -30 -12 -14 -28 2 -26 C 20 -24 30 -10 26 6 C 22 22 8 30 -6 26 C -18 22 -23 16 -26 4 Z";

function BxDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <filter id={`${uid}-soft`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id={`${uid}-glow`} x="-90%" y="-90%" width="280%" height="280%">
        <feGaussianBlur stdDeviation="3.4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id={`${uid}-goldflash`}>
        <stop offset="0%" stopColor={GOLD} stopOpacity="0.9" />
        <stop offset="55%" stopColor={GOLD} stopOpacity="0.32" />
        <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-cyanflash`}>
        <stop offset="0%" stopColor={CYAN} stopOpacity="0.9" />
        <stop offset="55%" stopColor={CYAN} stopOpacity="0.3" />
        <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-emflash`}>
        <stop offset="0%" stopColor={EMERALD} stopOpacity="0.9" />
        <stop offset="55%" stopColor={EMERALD} stopOpacity="0.3" />
        <stop offset="100%" stopColor={EMERALD} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-coralflash`}>
        <stop offset="0%" stopColor={CORAL} stopOpacity="0.9" />
        <stop offset="55%" stopColor={CORAL} stopOpacity="0.3" />
        <stop offset="100%" stopColor={CORAL} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-cyl`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#39445A" />
        <stop offset="0.28" stopColor={SLATE_LIGHT} />
        <stop offset="0.55" stopColor="#4A5568" />
        <stop offset="1" stopColor="#2E3849" />
      </linearGradient>
    </defs>
  );
}

/** The soft cell interior — always blurred, always beneath the story. */
function BxBackdrop({ uid, dim = false }: { uid: string; dim?: boolean }) {
  return (
    <g filter={`url(#${uid}-soft)`} opacity={dim ? 0.32 : 0.55}>
      <ellipse cx="80" cy="58" rx="54" ry="34" fill={SLATE_LIGHT} opacity="0.2" />
      <ellipse cx="336" cy="196" rx="66" ry="40" fill={SLATE} opacity="0.16" />
      <ellipse cx="248" cy="38" rx="42" ry="26" fill={BONE} opacity="0.16" />
      <ellipse cx="120" cy="205" rx="48" ry="30" fill={SLATE_LIGHT} opacity="0.14" />
    </g>
  );
}

function BxFlash({
  uid,
  x,
  y,
  r = 10,
  tone = "gold",
  delay = 0,
  intensity = 1,
}: {
  uid: string;
  x: number;
  y: number;
  r?: number;
  tone?: "gold" | "cyan" | "emerald" | "coral";
  delay?: number;
  intensity?: number;
}) {
  const core =
    tone === "gold" ? GOLD : tone === "cyan" ? CYAN : tone === "emerald" ? EMERALD : CORAL;
  return (
    <g opacity={Math.max(0.15, Math.min(1, intensity))}>
      <g className="bx-flash" style={{ animationDelay: `${delay}s` }}>
        <circle cx={x} cy={y} r={r} fill={`url(#${uid}-${tone}flash)`} />
        <circle cx={x} cy={y} r={2.2} fill={core} />
      </g>
    </g>
  );
}

/** The disease target — warm coral, pulsing while it lives. */
function BxRogue({
  x,
  y,
  s = 1,
  ghost = false,
  pulse = true,
}: {
  x: number;
  y: number;
  s?: number;
  ghost?: boolean;
  pulse?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={ghost ? 0.3 : 1}>
      <g className={pulse && !ghost ? "bx-pulse" : undefined}>
        {ghost ? (
          <path d={ROGUE_PATH} fill="none" stroke={CORAL} strokeWidth="1.6" strokeDasharray="5 5" />
        ) : (
          <>
            <path d={ROGUE_PATH} fill={CORAL} opacity="0.92" />
            <path d={ROGUE_PATH} fill="none" stroke={CORAL_DEEP} strokeWidth="1.4" />
            <circle cx="-7" cy="-6" r="4.5" fill="#FFD2C4" opacity="0.55" />
            <circle cx="24" cy="-14" r="3.4" fill={CORAL} opacity="0.8" />
            <circle cx="-26" cy="10" r="2.8" fill={CORAL} opacity="0.7" />
            <circle cx="12" cy="26" r="3" fill={CORAL} opacity="0.7" />
          </>
        )}
      </g>
    </g>
  );
}

/** The rogue's output — little scribbles of disease drifting away. */
function BxScribble({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <g className="bx-drift" style={{ animationDelay: `${delay}s` }} opacity="0.6">
      <path
        d={`M ${x} ${y} q 5 -5 10 0 q 5 5 10 0 q 5 -5 10 0`}
        fill="none"
        stroke={CORAL}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/** The E3 ligase — the cell's shredder crew, patient native machinery. */
function BxE3({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M -32 -6 C -34 -22 -18 -32 0 -32 C 20 -32 34 -20 32 -4 C 30 10 20 18 0 18 C -20 18 -30 10 -32 -6 Z"
        fill={SLATE}
        stroke={SLATE_DEEP}
        strokeWidth="1.4"
      />
      <path
        d="M -18 -26 l 5 -6 l 5 6 M -6 -29 l 5 -6 l 5 6 M 8 -27 l 5 -6 l 5 6"
        fill="none"
        stroke={SLATE_DEEP}
        strokeWidth="1.2"
      />
      <circle cx="-16" cy="2" r="3" fill={SLATE_DEEP} />
      <circle cx="16" cy="0" r="3" fill={SLATE_DEEP} />
      <rect x="-9" y="14" width="18" height="6" rx="3" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.9" />
    </g>
  );
}

/** The proteasome — an industrial recycling cylinder of the cell. */
function BxProteasome({
  uid,
  x,
  y,
  s = 1,
  speed = 1.6,
  open = false,
  active = false,
}: {
  uid: string;
  x: number;
  y: number;
  s?: number;
  speed?: number;
  open?: boolean;
  active?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* the 19S cap — it lifts when the door opens */}
      <rect
        x="-30"
        y={open ? -82 : -76}
        width="60"
        height="18"
        rx="7"
        fill={SLATE}
        stroke={SLATE_DEEP}
        strokeWidth="1.3"
      />
      <circle cx="-14" cy={open ? -73 : -67} r="2.6" fill={SLATE_DEEP} />
      <circle cx="14" cy={open ? -73 : -67} r="2.6" fill={SLATE_DEEP} />
      {/* the 20S barrel */}
      <rect
        x="-24"
        y="-60"
        width="48"
        height="122"
        rx="9"
        fill={`url(#${uid}-cyl)`}
        stroke={SLATE_DEEP}
        strokeWidth="1.3"
      />
      {[-44, -30, -16, -2, 12, 26, 40].map((gy) => (
        <line key={gy} x1="-20" y1={gy} x2="20" y2={gy} stroke={SLATE_DEEP} strokeWidth="1" opacity="0.45" />
      ))}
      {/* the mouth */}
      <ellipse cx="0" cy="-60" rx="20" ry="6" fill="#1F2733" />
      <ellipse cx="0" cy="-60" rx="12" ry="3.4" fill="#0E131B" />
      {open && <ellipse cx="0" cy="-60" rx="24" ry="8" fill={GOLD} opacity="0.14" />}
      {active && (
        <rect x="-7" y="-52" width="14" height="104" rx="7" fill={GOLD} opacity="0.12" filter={`url(#${uid}-glow)`} />
      )}
      {active && (
        <line
          x1="0"
          y1="-40"
          x2="0"
          y2="46"
          stroke={GOLD}
          strokeWidth="1.8"
          className="bx-flow"
          style={cssVar({ "--bx-dur": `${speed}s` })}
        />
      )}
      {/* the exit port */}
      <ellipse cx="0" cy="62" rx="12" ry="4" fill="#1F2733" stroke={SLATE_DEEP} strokeWidth="1" />
    </g>
  );
}

/** Ubiquitin — small gold pearls, the cell's own luggage labels. */
function BxUbChain({
  x,
  y,
  n = 4,
  delay0 = 0,
}: {
  x: number;
  y: number;
  n?: number;
  delay0?: number;
}) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <circle
          key={i}
          cx={x + i * 4.6}
          cy={y - i * 6.2}
          r="3.1"
          fill={GOLD}
          stroke={GOLD_DEEP}
          strokeWidth="0.8"
          className="bx-flash"
          style={{ animationDelay: `${delay0 + i * 0.22}s` }}
        />
      ))}
    </g>
  );
}

/** The molecular glue — a precise keystone wedge. */
function BxWedge({
  uid,
  x,
  y,
  s = 1,
  seated = false,
}: {
  uid: string;
  x: number;
  y: number;
  s?: number;
  seated?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {seated && <circle r="17" fill={`url(#${uid}-cyanflash)`} opacity="0.6" />}
      <path d="M -15 9 L -7 -9 L 7 -9 L 15 9 Z" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.3" />
      <path d="M -7 -9 L -4 9" stroke="#BFFFF6" strokeWidth="1" opacity="0.7" />
      <circle cx="0" cy="0" r="1.6" fill="#EFFFFB" />
    </g>
  );
}

/** DNA as a physical scroll — rods, strands, rungs and its one letter. */
function BxDna({
  x,
  y,
  mutX,
  fixedX,
  gapX,
  open = false,
}: {
  x: number;
  y: number;
  mutX?: number | null;
  fixedX?: number | null;
  gapX?: number | null;
  open?: boolean;
}) {
  const half = 132;
  const snap = (v?: number | null) =>
    v == null ? null : Math.max(0, Math.min(15, Math.round((v - (x - 120)) / 16)));
  const mi = snap(mutX);
  const fi = snap(fixedX);
  const gi = snap(gapX);
  const strand = (dy: number) => {
    const o = open ? (dy < 0 ? -22 : 22) : 0;
    return `M ${x - half} ${y + dy} C ${x - 96} ${y + dy - 5}, ${x - 60} ${y + dy + 4}, ${x - 34} ${y + dy} C ${x - 18} ${y + dy + o}, ${x + 18} ${y + dy + o}, ${x + 34} ${y + dy} C ${x + 60} ${y + dy + 4}, ${x + 96} ${y + dy - 5}, ${x + half} ${y + dy}`;
  };
  return (
    <g>
      {/* the rolled rods of the manuscript */}
      <g fill={BONE} stroke={SLATE_DEEP} strokeWidth="0.8">
        <rect x={x - half - 9} y={y - 26} width="7" height="52" rx="3" />
        <rect x={x + half + 2} y={y - 26} width="7" height="52" rx="3" />
      </g>
      {/* the two strands */}
      <path d={strand(-7)} fill="none" stroke={SLATE_DEEP} strokeWidth="1.7" opacity="0.9" />
      <path d={strand(7)} fill="none" stroke={SLATE_DEEP} strokeWidth="1.7" opacity="0.9" />
      {/* the rungs — each one a letter of the story */}
      {Array.from({ length: 16 }, (_, i) => x - 120 + i * 16).map((rx, i) => {
        if (i === gi) return null;
        const isOpen = open && Math.abs(rx - x) < 34;
        const y1 = isOpen ? y - 27 : y - 7;
        const y2 = isOpen ? y + 27 : y + 7;
        const mut = i === mi;
        const fixed = i === fi;
        return (
          <g key={rx}>
            <line
              x1={rx}
              y1={y1}
              x2={rx}
              y2={y2}
              stroke={mut ? CORAL : fixed ? EMERALD : SLATE_LIGHT}
              strokeWidth={mut || fixed ? 1.6 : 1.1}
              opacity={mut || fixed ? 0.95 : 0.75}
            />
            {mut ? (
              <g className="bx-pulse">
                <circle cx={rx} cy={y} r="4.6" fill={CORAL} stroke={CORAL_DEEP} strokeWidth="1" />
                <circle cx={rx} cy={y} r="8.5" fill="none" stroke={CORAL} strokeWidth="0.9" opacity="0.45" />
              </g>
            ) : fixed ? (
              <g>
                <circle cx={rx} cy={y} r="4" fill={EMERALD} stroke={EMERALD_DEEP} strokeWidth="1" />
                <circle cx={rx} cy={y} r="7.5" fill="none" stroke={EMERALD} strokeWidth="0.9" opacity="0.5" />
              </g>
            ) : (
              <circle cx={rx} cy={y} r="2.7" fill={SLATE_LIGHT} opacity="0.8" />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** dCas9 — a magnifying guide that holds the scroll open. */
function BxClamp({ uid, x, y }: { uid: string; x: number; y: number }) {
  return (
    <g>
      <path
        d={`M ${x - 42} ${y - 12} C ${x - 30} ${y - 52}, ${x + 30} ${y - 52}, ${x + 42} ${y - 12}`}
        fill="none"
        stroke={CYAN}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx={x - 40} cy={y - 9} r="5" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.1" />
      <circle cx={x + 40} cy={y - 9} r="5" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.1" />
      <circle cx={x} cy={y - 40} r="11" fill={`url(#${uid}-cyanflash)`} opacity="0.3" />
      <circle cx={x} cy={y - 40} r="11" fill="none" stroke={CYAN} strokeWidth="2" />
      <line x1={x + 8} y1={y - 32} x2={x + 18} y2={y - 22} stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

/** The base editor's pincer — gold, precise, gentle. */
function BxPincer({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M ${x - 3} ${y - 30} L ${x - 13} ${y + 2} L ${x - 3} ${y - 2} Z`} fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <path d={`M ${x + 3} ${y - 30} L ${x + 13} ${y + 2} L ${x + 3} ${y - 2} Z`} fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.8" />
      <circle cx={x} cy={y - 32} r="2.4" fill={GOLD_DEEP} />
    </g>
  );
}

/** The membrane — the cell's quiet border of heads and tails. */
function BxMembrane({ y }: { y: number }) {
  const heads = Array.from({ length: 29 }, (_, i) => 26 + i * 13);
  return (
    <g opacity="0.9">
      <line x1="18" y1={y - 4} x2="402" y2={y - 4} stroke={SLATE} strokeWidth="1.6" />
      <line x1="18" y1={y + 4} x2="402" y2={y + 4} stroke={SLATE} strokeWidth="1.6" />
      {heads.map((hx) => (
        <g key={hx} fill={SLATE_LIGHT} opacity="0.7">
          <circle cx={hx} cy={y - 9} r="2.4" />
          <circle cx={hx + 6.5} cy={y + 9} r="2.4" />
        </g>
      ))}
    </g>
  );
}

/** The receptor — native machinery, waking only when spoken to. */
function BxReceptor({
  x,
  y,
  active = false,
  ligandIn = false,
}: {
  x: number;
  y: number;
  active?: boolean;
  ligandIn?: boolean;
}) {
  const rim = active ? EMERALD : SLATE_LIGHT;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M -13 -20 L -13 6 A 13 13 0 0 0 13 6 L 13 -20"
        fill="none"
        stroke={rim}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M -13 -20 L -13 6 A 13 13 0 0 0 13 6 L 13 -20"
        fill="none"
        stroke={SLATE_DEEP}
        strokeWidth="1"
        opacity="0.6"
      />
      {ligandIn && (
        <rect x="-4.5" y="-29" width="9" height="9" rx="2" transform="rotate(45 0 -24.5)" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1" />
      )}
    </g>
  );
}

/** The signal ligand — a luminescent cyan diamond. */
function BxLigand({ x, y, drift = false }: { x: number; y: number; drift?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} className={drift ? "bx-drift" : undefined}>
      <rect x="-6" y="-6" width="12" height="12" rx="2.5" transform="rotate(45)" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.2" />
      <rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="1" transform="rotate(45)" fill="#EFFFFB" opacity="0.85" />
    </g>
  );
}

/** One domino of the signaling relay. */
function BxDomino({
  x,
  y,
  tilt,
  lit,
  tone = "emerald",
  delay = 0,
}: {
  x: number;
  y: number;
  tilt: number;
  lit: boolean;
  tone?: "emerald" | "gold";
  delay?: number;
}) {
  const fill = lit ? (tone === "gold" ? GOLD : EMERALD) : SLATE_DEEP;
  const edge = lit ? (tone === "gold" ? GOLD_DEEP : EMERALD_DEEP) : SLATE;
  return (
    <g className={lit ? "bx-flash" : undefined} style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <rect x="-6" y="-10" width="12" height="20" rx="3" fill={fill} stroke={edge} strokeWidth="1.2" />
        {lit && <circle cx="0" cy="-3" r="2.4" fill="#FFFFFF" opacity="0.85" />}
      </g>
    </g>
  );
}

/** The nucleus — dormant slate, or lit gold when the message lands. */
function BxNucleus({ uid, x, y, active = false }: { uid: string; x: number; y: number; active?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {active && <circle r="30" fill="none" stroke={GOLD} strokeWidth="3.4" opacity="0.3" filter={`url(#${uid}-glow)`} />}
      <circle r="30" fill="none" stroke={active ? GOLD : SLATE} strokeWidth="1.8" opacity={active ? 1 : 0.55} />
      <circle r="7.5" fill={active ? GOLD : SLATE} opacity={active ? 0.85 : 0.5} />
      <path
        d="M -16 12 C -8 2 8 22 16 8"
        fill="none"
        stroke={active ? EMERALD : SLATE_LIGHT}
        strokeWidth="1.6"
        opacity={active ? 0.9 : 0.35}
      />
      <path
        d="M -14 4 C -6 -6 6 12 14 -2"
        fill="none"
        stroke={active ? EMERALD : SLATE_LIGHT}
        strokeWidth="1.4"
        opacity={active ? 0.7 : 0.3}
      />
    </g>
  );
}

/** The quiet emerald halo of an outcome — the cell breathing again. */
function BxHealthRing({ uid, cx, cy, r }: { uid: string; cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={EMERALD}
        strokeWidth="1.2"
        strokeDasharray="3 9"
        opacity="0.5"
        className="bx-twinkle"
        filter={`url(#${uid}-glow)`}
      />
      {[
        [cx - r * 0.72, cy - r * 0.62, 0],
        [cx + r * 0.7, cy - r * 0.4, 1.2],
        [cx - r * 0.3, cy + r * 0.78, 2.1],
      ].map(([sx, sy, dl], i) => (
        <path
          key={i}
          d={`M ${sx} ${sy - 4} L ${sx} ${sy + 4} M ${sx - 4} ${sy} L ${sx + 4} ${sy}`}
          stroke={EMERALD}
          strokeWidth="1.2"
          strokeLinecap="round"
          className={i === 0 ? "bx-twinkle" : i === 1 ? "bx-twinkle bx-twinkle-2" : "bx-twinkle bx-twinkle-3"}
          style={{ animationDelay: `${dl}s` }}
        />
      ))}
    </g>
  );
}

/** The PROTAC tether — a two-handed carabiner with a variable linker. */
function BxTether({
  x1,
  y1,
  x2,
  y2,
  coils,
  amp = 6.5,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  coils: number;
  amp?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const segs = coils * 2 + 1;
  let d = `M ${x1} ${y1}`;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const off = i === segs ? 0 : (i % 2 === 0 ? amp : -amp);
    d += ` L ${(x1 + dx * t + px * off).toFixed(1)} ${(y1 + dy * t + py * off).toFixed(1)}`;
  }
  return <path d={d} fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinejoin="round" opacity="0.95" />;
}

/* --------------------------- the scenes ---------------------------- */

interface BxParams {
  /** saturating dose 0..1 */
  D: number;
  /** master flash opacity from dose */
  glow: number;
  /** tether span from linker length */
  reach: number;
  /** seconds per degradation pulse from flux */
  fluxSpeed: number;
}

function bxScene(mech: BxMechanism["id"], idx: number, p: BxParams, uid: string): ReactNode {
  const G = p.glow;
  if (mech === "glue") {
    if (idx === 0)
      return (
        <>
          <BxBackdrop uid={uid} />
          <line x1="152" y1="112" x2="286" y2="112" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="4 7" opacity="0.6" />
          <g stroke={CORAL_DEEP} strokeWidth="1.4" opacity="0.8">
            <line x1="212" y1="104" x2="224" y2="120" />
            <line x1="224" y1="104" x2="212" y2="120" />
          </g>
          <BxRogue x={112} y={108} />
          <BxScribble x={148} y={152} delay={0} />
          <BxScribble x={92} y={162} delay={1.7} />
          <BxFlash uid={uid} x={168} y={150} r={7} tone="coral" delay={0.6} intensity={G * 0.8} />
          <BxE3 x={324} y={118} />
        </>
      );
    if (idx === 1)
      return (
        <>
          <BxBackdrop uid={uid} />
          <line x1="152" y1="112" x2="286" y2="112" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="4 7" opacity="0.6" />
          <BxRogue x={112} y={108} />
          <BxE3 x={324} y={118} />
          <path d="M 196 44 C 210 62, 214 80, 216 92" fill="none" stroke={CYAN} strokeWidth="1.2" strokeDasharray="3 5" opacity="0.7" />
          <g className="bx-drift">
            <circle cx="216" cy="92" r="20" fill={`url(#${uid}-cyanflash)`} opacity="0.35" />
            <BxWedge uid={uid} x={216} y={92} />
          </g>
          <BxFlash uid={uid} x={216} y={92} r={8} tone="cyan" delay={0.3} intensity={G} />
        </>
      );
    if (idx === 2)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxRogue x={112} y={108} />
          <BxE3 x={324} y={118} />
          <path d="M 140 104 C 158 98, 176 100, 198 106" fill="none" stroke={CYAN_DEEP} strokeWidth="1.2" opacity="0.55" />
          <path d="M 236 106 C 258 100, 276 102, 292 108" fill="none" stroke={CYAN_DEEP} strokeWidth="1.2" opacity="0.55" />
          <BxWedge uid={uid} x={217} y={108} seated />
          <path d="M 196 104 l 5 -6 l 5 6 l 5 -6 l 5 6" stroke={CYAN_DEEP} fill="none" strokeWidth="1.2" opacity="0.8" />
          <path d="M 238 104 l 5 -6 l 5 6 l 5 -6 l 5 6" stroke={CYAN_DEEP} fill="none" strokeWidth="1.2" opacity="0.8" />
          <BxFlash uid={uid} x={196} y={108} r={13} tone="cyan" delay={0} intensity={G} />
          <BxFlash uid={uid} x={238} y={108} r={13} tone="cyan" delay={0.9} intensity={G} />
          <BxFlash uid={uid} x={217} y={108} r={9} tone="gold" delay={0.5} intensity={G} />
        </>
      );
    return (
      <>
        <BxBackdrop uid={uid} />
        <BxHealthRing uid={uid} cx={210} cy={122} r={116} />
        <BxRogue x={150} y={124} ghost pulse={false} />
        <BxUbChain x={158} y={98} n={4} />
        <BxWedge uid={uid} x={228} y={112} />
        <BxE3 x={318} y={126} />
        <path d="M 182 134 C 240 170, 300 162, 340 140" fill="none" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="3 6" opacity="0.5" />
        <BxProteasome uid={uid} x={378} y={130} s={0.62} speed={p.fluxSpeed} active />
        <g stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
          <line x1="372" y1="206" x2="378" y2="213" className="bx-drift" />
          <line x1="382" y1="210" x2="387" y2="217" className="bx-drift bx-twinkle-2" style={{ animationDelay: "-1.8s" }} />
        </g>
      </>
    );
  }

  if (mech === "protac") {
    if (idx === 0)
      return (
        <>
          <BxBackdrop uid={uid} />
          <line x1="146" y1="102" x2="284" y2="146" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="4 7" opacity="0.5" />
          <g stroke={CORAL_DEEP} strokeWidth="1.4" opacity="0.8">
            <line x1="209" y1="116" x2="221" y2="132" />
            <line x1="221" y1="116" x2="209" y2="132" />
          </g>
          <BxRogue x={112} y={86} />
          <BxScribble x={150} y={130} delay={0.5} />
          <BxE3 x={318} y={168} />
        </>
      );
    if (idx === 1)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxRogue x={112} y={86} />
          <BxE3 x={318} y={168} />
          <g className="bx-drift">
            <circle cx="215" cy="127" r="26" fill={`url(#${uid}-cyanflash)`} opacity="0.28" />
            <BxTether x1={176} y1={104} x2={254} y2={150} coils={Math.max(2, Math.round(p.reach / 14))} />
            <circle cx="168" cy="100" r="8.5" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.3" />
            <circle cx="168" cy="100" r="3" fill="#EFFFFB" />
            <circle cx="262" cy="154" r="8.5" fill={EMERALD} stroke={EMERALD_DEEP} strokeWidth="1.3" />
            <circle cx="262" cy="154" r="3" fill="#EFFFFB" />
          </g>
          <BxFlash uid={uid} x={168} y={100} r={9} tone="cyan" delay={0} intensity={G} />
          <BxFlash uid={uid} x={262} y={154} r={9} tone="emerald" delay={0.8} intensity={G} />
        </>
      );
    if (idx === 2)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxRogue x={168} y={120} />
          <BxE3 x={268} y={128} />
          <BxTether x1={196} y1={114} x2={238} y2={124} coils={Math.max(2, Math.round(p.reach / 18))} />
          <circle cx="196" cy="114" r="7" fill={CYAN} stroke={CYAN_DEEP} strokeWidth="1.2" />
          <circle cx="238" cy="124" r="7" fill={EMERALD} stroke={EMERALD_DEEP} strokeWidth="1.2" />
          <BxUbChain x={204} y={84} n={4} />
          <path d="M 206 88 C 216 78, 228 82, 234 96" fill="none" stroke={GOLD} strokeWidth="1.1" strokeDasharray="2 4" opacity="0.7" />
          <BxFlash uid={uid} x={196} y={112} r={12} tone="cyan" delay={0} intensity={G} />
          <BxFlash uid={uid} x={240} y={122} r={12} tone="emerald" delay={0.7} intensity={G} />
          <BxFlash uid={uid} x={218} y={92} r={9} tone="gold" delay={1.3} intensity={G} />
        </>
      );
    return (
      <>
        <BxBackdrop uid={uid} />
        <BxHealthRing uid={uid} cx={190} cy={122} r={112} />
        <BxProteasome uid={uid} x={348} y={128} s={0.9} speed={p.fluxSpeed} active />
        <g className="bx-drift">
          <BxRogue x={210} y={64} ghost pulse={false} s={0.8} />
          <BxUbChain x={216} y={46} n={3} />
        </g>
        <path d="M 234 70 C 280 62, 312 58, 336 62" fill="none" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="3 6" opacity="0.55" />
        <g stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
          <line x1="342" y1="204" x2="349" y2="211" className="bx-drift" />
          <line x1="356" y1="210" x2="362" y2="218" className="bx-drift" style={{ animationDelay: "-1.6s" }} />
          <line x1="332" y1="214" x2="337" y2="222" className="bx-drift" style={{ animationDelay: "-3.1s" }} />
        </g>
      </>
    );
  }

  if (mech === "crispr") {
    if (idx === 0)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxDna x={210} y={104} mutX={216} />
          <path d="M 214 122 C 190 158, 150 176, 122 188" fill="none" stroke={CORAL} strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
          <BxRogue x={104} y={198} s={0.55} />
          <BxScribble x={140} y={216} delay={0.8} />
          <BxFlash uid={uid} x={216} y={104} r={10} tone="coral" delay={0.2} intensity={G * 0.85} />
        </>
      );
    if (idx === 1)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxDna x={210} y={112} mutX={216} open />
          <BxClamp uid={uid} x={210} y={112} />
          <BxFlash uid={uid} x={170} y={103} r={9} tone="cyan" delay={0} intensity={G} />
          <BxFlash uid={uid} x={250} y={103} r={9} tone="cyan" delay={0.8} intensity={G} />
        </>
      );
    if (idx === 2)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxDna x={210} y={118} gapX={216} open />
          <BxPincer x={210} y={52} />
          <rect x={205} y={48} width={10} height={10} rx={2.5} fill={CORAL} stroke={CORAL_DEEP} strokeWidth="1" />
          <path d="M 210 62 L 210 90" stroke={CORAL} strokeWidth="1" strokeDasharray="2 5" opacity="0.5" />
          <g className="bx-drift">
            <rect x={205} y={78} width={10} height={10} rx={2.5} fill={EMERALD} stroke={EMERALD_DEEP} strokeWidth="1" />
          </g>
          <BxFlash uid={uid} x={210} y={114} r={12} tone="emerald" delay={0.2} intensity={G} />
        </>
      );
    return (
      <>
        <BxBackdrop uid={uid} />
        <BxHealthRing uid={uid} cx={210} cy={112} r={114} />
        <BxDna x={210} y={104} fixedX={216} />
        <path d="M 250 116 C 280 130, 296 150, 310 166" fill="none" stroke={SLATE_LIGHT} strokeWidth="1.1" strokeDasharray="3 6" opacity="0.45" />
        <g className="bx-drift">
          <path
            d="M 316 168 C 300 150, 340 142, 336 166 C 332 188, 300 184, 310 200 C 318 212, 344 204, 338 220"
            fill="none"
            stroke={SLATE_LIGHT}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="316" cy="168" r="2.6" fill={SLATE} />
        </g>
      </>
    );
  }

  if (mech === "proteasome") {
    if (idx === 0)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxRogue x={96} y={88} s={0.9} />
          <BxRogue x={168} y={150} s={0.7} />
          <BxRogue x={150} y={54} s={0.55} />
          <g transform="translate(292 108)">
            <rect x="-26" y="-20" width="52" height="40" rx="12" fill={SLATE} stroke={SLATE_DEEP} strokeWidth="1.2" opacity="0.9" />
            <circle cx="-8" cy="0" r="4" fill={SLATE_DEEP} />
            <circle cx="10" cy="-4" r="3" fill={SLATE_DEEP} />
          </g>
          <BxFlash uid={uid} x={130} y={118} r={8} tone="coral" delay={0} intensity={G * 0.85} />
          <BxFlash uid={uid} x={252} y={120} r={8} tone="coral" delay={0.9} intensity={G * 0.85} />
        </>
      );
    if (idx === 1)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxProteasome uid={uid} x={330} y={128} speed={p.fluxSpeed} open />
          <BxRogue x={168} y={120} />
          <BxUbChain x={176} y={92} n={4} delay0={0.2} />
          <path d="M 208 118 C 250 112, 276 100, 302 86" fill="none" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="3 6" opacity="0.55" />
          <BxFlash uid={uid} x={176} y={92} r={10} tone="gold" delay={0.3} intensity={G} />
          <BxFlash uid={uid} x={330} y={68} r={12} tone="gold" delay={0.9} intensity={G * 0.8} />
        </>
      );
    if (idx === 2)
      return (
        <>
          <BxBackdrop uid={uid} />
          <BxProteasome uid={uid} x={170} y={132} s={1.12} speed={p.fluxSpeed} active />
          <g transform="translate(170 54) scale(1 0.62)">
            <path d={ROGUE_PATH} fill={CORAL} opacity="0.9" stroke={CORAL_DEEP} strokeWidth="1.4" />
          </g>
          <BxUbChain x={186} y={28} n={3} />
          <path
            d="M 170 66 C 178 92, 162 118, 170 144 C 176 164, 166 180, 170 196"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.6"
            className="bx-flow"
            style={cssVar({ "--bx-dur": `${(p.fluxSpeed * 0.8).toFixed(2)}s` })}
          />
          <BxFlash uid={uid} x={170} y={96} r={9} tone="gold" delay={0} intensity={G} />
          <BxFlash uid={uid} x={170} y={150} r={9} tone="gold" delay={0.8} intensity={G} />
        </>
      );
    return (
      <>
        <BxBackdrop uid={uid} />
        <BxHealthRing uid={uid} cx={200} cy={122} r={116} />
        <BxProteasome uid={uid} x={170} y={128} s={1.05} speed={p.fluxSpeed} />
        <path d="M 170 196 L 170 206" stroke={SLATE_LIGHT} strokeWidth="1.2" strokeDasharray="2 4" opacity="0.4" />
        <g stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.85">
          <line x1="164" y1="204" x2="170" y2="212" className="bx-drift" />
          <line x1="178" y1="208" x2="183" y2="216" className="bx-drift" style={{ animationDelay: "-1.8s" }} />
          <line x1="156" y1="212" x2="161" y2="220" className="bx-drift" style={{ animationDelay: "-3.2s" }} />
        </g>
      </>
    );
  }

  /* cascade */
  if (idx === 0)
    return (
      <>
        <BxBackdrop uid={uid} dim />
        <BxMembrane y={126} />
        <BxReceptor x={140} y={126} />
        <ellipse cx="356" cy="170" rx="44" ry="34" fill={CORAL} opacity="0.12" className="bx-pulse" />
        {Array.from({ length: 6 }, (_, i) => (
          <BxDomino key={i} x={190 + i * 30} y={168 + i * 2.5} tilt={-4 + i * 2} lit={false} />
        ))}
        <BxNucleus uid={uid} x={356} y={170} />
      </>
    );
  if (idx === 1)
    return (
      <>
        <BxBackdrop uid={uid} dim />
        <BxMembrane y={126} />
        <BxReceptor x={140} y={126} />
        <BxLigand x={132} y={70} drift />
        <path d="M 136 84 L 139 96" stroke={CYAN} strokeWidth="1.1" strokeDasharray="2 4" opacity="0.6" />
        <BxFlash uid={uid} x={140} y={100} r={8} tone="cyan" delay={0.4} intensity={G} />
        {Array.from({ length: 6 }, (_, i) => (
          <BxDomino key={i} x={190 + i * 30} y={168 + i * 2.5} tilt={-4 + i * 2} lit={false} />
        ))}
        <ellipse cx="356" cy="170" rx="44" ry="34" fill={CORAL} opacity="0.1" className="bx-pulse" />
        <BxNucleus uid={uid} x={356} y={170} />
      </>
    );
  if (idx === 2)
    return (
      <>
        <BxBackdrop uid={uid} />
        <BxMembrane y={126} />
        <BxReceptor x={140} y={126} active ligandIn />
        {Array.from({ length: 6 }, (_, i) => (
          <BxDomino
            key={i}
            x={190 + i * 30}
            y={168 + i * 2.5}
            tilt={-4 + i * 2}
            lit={i < 3}
            tone={i < 3 ? "emerald" : "gold"}
            delay={i * 0.5}
          />
        ))}
        <ellipse cx="356" cy="170" rx="44" ry="34" fill={CORAL} opacity="0.05" />
        <BxNucleus uid={uid} x={356} y={170} />
      </>
    );
  return (
    <>
      <BxBackdrop uid={uid} />
      <BxMembrane y={126} />
      <BxReceptor x={140} y={126} active ligandIn />
      {Array.from({ length: 6 }, (_, i) => (
        <BxDomino
          key={i}
          x={190 + i * 30}
          y={168 + i * 2.5}
          tilt={-4 + i * 2}
          lit
          tone={i < 3 ? "emerald" : "gold"}
          delay={i * 0.45}
        />
      ))}
      <BxNucleus uid={uid} x={356} y={170} active />
      <BxHealthRing uid={uid} cx={356} cy={170} r={46} />
      <path d="M 250 150 C 280 148, 306 148, 322 150" fill="none" stroke={GOLD} strokeWidth="1.1" strokeDasharray="2 5" opacity="0.55" />
    </>
  );
}

/* ------------------------- live feedback --------------------------- */

function bxCompute(mech: BxMechanism["id"], vals: Record<BxSliderKey, number>) {
  const D = 1 - Math.exp(-vals.dose / 30);
  const usesFlux = mech === "glue" || mech === "protac" || mech === "proteasome";
  const F = usesFlux ? 0.35 + 0.65 * (vals.flux / 100) : 1;
  const L =
    mech === "protac" ? 1 - Math.pow(Math.abs(vals.linker - 12) / 12, 1.6) * 0.55 : 1;
  const doseTerm = mech === "proteasome" ? 0.3 + 0.7 * D : 0.15 + 0.85 * D;
  const k = 0.12 * doseTerm * F * L;
  const halfLife = Math.log(2) / k;
  const offLd =
    mech === "protac" ? 0.55 + 0.45 * (Math.abs(vals.linker - 12) / 12) : 1;
  const heat = Array.from({ length: 12 }, (_, i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const base = 0.22 + 0.62 * (x - Math.floor(x));
    return Math.min(1, base * (0.35 + 0.65 * D) * offLd);
  });
  const hot = heat.filter((h) => h > 0.55).length;
  const T = 12;
  const pts: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * T;
    const r = 0.05 + 0.95 * Math.exp(-k * t);
    const x = 14 + (t / T) * 232;
    const y = 108 - r * 88;
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const dotAt = (prog: number) => {
    const t = Math.max(0, Math.min(1, prog)) * T;
    const r = 0.05 + 0.95 * Math.exp(-k * t);
    return { x: 14 + Math.max(0, Math.min(1, prog)) * 232, y: 108 - r * 88 };
  };
  return {
    D,
    k,
    halfLife,
    heat,
    hot,
    curve: pts.join(" "),
    dotAt,
    glow: 0.35 + 0.6 * D,
    reach: 62 + ((vals.linker - 4) / 20) * 56,
    fluxSpeed: 2.25 - 1.5 * (vals.flux / 100),
  };
}

/* ---------------------------- the view ----------------------------- */

export function PxBioMech() {
  const t = useT();
  const [mechId, setMechId] = useState<BxMechanism["id"]>("glue");
  const [panel, setPanel] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [vals, setVals] = useState<Record<BxSliderKey, number>>({
    dose: bxSliderMeta.dose.init,
    linker: bxSliderMeta.linker.init,
    flux: bxSliderMeta.flux.init,
  });
  const [zoom, setZoom] = useState(false);
  const [progress, setProgress] = useState(0);

  const mech = pxBioMechanisms.find((m) => m.id === mechId) ?? pxBioMechanisms[0];
  const metrics = useMemo(() => bxCompute(mechId, vals), [mechId, vals]);
  const params: BxParams = useMemo(
    () => ({
      D: metrics.D,
      glow: metrics.glow,
      reach: metrics.reach,
      fluxSpeed: metrics.fluxSpeed,
    }),
    [metrics]
  );

  /* play — the storyboard advances itself every ~4.5s */
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setPanel((v) => (v + 1) % 4), 4500);
    return () => window.clearInterval(id);
  }, [playing]);

  /* the moving dot on the clearance curve, paced by the dials */
  useEffect(() => {
    const dur = Math.min(7, Math.max(2.4, 6.5 - 26 * metrics.k));
    const id = window.setInterval(() => {
      setProgress((v) => (v + 0.07 / dur) % 1);
    }, 70);
    return () => window.clearInterval(id);
  }, [metrics.k]);

  /* fullscreen: Esc to leave, and the page holds its breath */
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  const chooseMech = (id: BxMechanism["id"]) => {
    setMechId(id);
    setPanel(0);
  };

  const dot = metrics.dotAt(progress);

  const board = (
    <div className="space-y-5">
      {/* the living engines — the kategori's selector */}
      <div
        role="group"
        aria-label={t("Choose a living engine")}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {pxBioMechanisms.map((m) => {
          const active = m.id === mechId;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => chooseMech(m.id)}
              data-testid={`px-biomech-mech-${m.id}`}
              title={t(m.engine)}
              className={cn(
                "focus-glow flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-all duration-300",
                active
                  ? "font-semibold text-foreground"
                  : "hairline text-muted-foreground hover:text-foreground"
              )}
              style={
                active
                  ? {
                      borderColor:
                        "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                      background:
                        "color-mix(in srgb, var(--scope-a) 12%, transparent)",
                    }
                  : undefined
              }
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: MECH_DOT[m.id] }}
                aria-hidden="true"
              />
              {t(m.name)}
            </button>
          );
        })}
      </div>

      {/* the storyboard card */}
      <div className="scope-frame-card relative overflow-hidden rounded-2xl glass p-5 sm:p-6">

        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div>
            <p className="mono-label text-[10px] uppercase tracking-[0.22em] text-[var(--scope-a)]">
              {t("The storyboard engine")}
            </p>
            <h4 className="scope-gradient-text mt-1 text-[17px] font-semibold">
              {t(mech.name)}
              <span className="ml-2 font-serif text-[13.5px] font-normal italic text-muted-foreground">
                {t(mech.role)}
              </span>
            </h4>
          </div>
          <p className="max-w-[380px] text-[13px] leading-snug text-muted-foreground">
            {t(mech.engine)}
          </p>
        </div>

        {/* the four panels — 1 column on mobile, 2×2 on desktop */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {mech.panels.map((p, i) => {
            const active = panel === i;
            const uid = `${mech.id}-p${i}`;
            return (
              <button
                key={i}
                type="button"
                aria-pressed={active}
                aria-label={`${t("Panel")} ${i + 1} — ${t(p.title)} (${t(p.sub)})`}
                data-testid={`px-biomech-panel-${i + 1}`}
                onClick={() => {
                  setPanel(i);
                  setPlaying(false);
                }}
                className={cn(
                  "scope-frame-card focus-glow group relative overflow-hidden rounded-2xl glass p-4 text-left transition-all duration-300 hover:-translate-y-px",
                  active && "glow-sm"
                )}
                style={
                  active
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--scope-a) 55%, transparent)",
                      }
                    : undefined
                }
              >
                <div
                  role="group"
                  aria-label={`${t(p.title)} — ${t(p.sub)}`}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono-label text-[9px] uppercase tracking-[0.22em] text-[var(--scope-a)]">
                      {t("Panel")} {i + 1} · {t(p.title)}
                    </p>
                    <span
                      className={cn(
                        "size-2 rounded-full transition-all duration-300",
                        active ? "bg-[var(--scope-a)]" : "bg-[var(--hairline)]"
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <svg
                    viewBox="0 0 420 250"
                    className="mt-2 w-full rounded-xl border hairline"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <BxDefs uid={uid} />
                    {bxScene(mech.id, i, params, uid)}
                  </svg>
                  <p className="mono-label mt-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    ({t(p.sub)})
                  </p>
                  <p className="mt-1 font-serif text-[13.5px] italic leading-relaxed text-foreground/85">
                    {t(p.caption)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* the transport: prev / pips / next, then play and zoom */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPanel((v) => (v + 3) % 4)}
              aria-label={t("The panel before")}
              data-testid="px-biomech-panel-prev"
              className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPanel(i);
                  setPlaying(false);
                }}
                aria-pressed={panel === i}
                aria-label={`${t("Panel")} ${i + 1}`}
                data-testid={`px-biomech-pip-${i + 1}`}
                className="focus-glow size-2.5 rounded-full transition-all duration-300"
                style={{
                  background:
                    panel === i
                      ? "var(--scope-a)"
                      : "color-mix(in srgb, var(--scope-a) 22%, transparent)",
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => setPanel((v) => (v + 1) % 4)}
              aria-label={t("The panel after")}
              data-testid="px-biomech-panel-next"
              className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:text-foreground"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-pressed={playing}
              aria-label={playing ? t("Pause the storyboard") : t("Play the storyboard")}
              data-testid="px-biomech-play"
              className="focus-glow flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium text-foreground/85 transition-all duration-300 hover:-translate-y-px"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--scope-a) 38%, transparent)",
              }}
            >
              {playing ? (
                <Pause className="size-3.5" aria-hidden="true" />
              ) : (
                <Play className="size-3.5" aria-hidden="true" />
              )}
              {playing ? t("Pause") : t("Play")}
            </button>
            <button
              type="button"
              onClick={() => setZoom(true)}
              aria-label={t("Open the storyboard full screen")}
              title={t("Open the storyboard full screen")}
              data-testid="px-biomech-zoom"
              className="focus-glow flex size-8 items-center justify-center rounded-full border hairline text-muted-foreground transition-all duration-300 hover:text-foreground"
            >
              <Maximize2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* the dials — defined per mechanism */}
        <div className="mt-5 border-t hairline pt-4">
          <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("Tune the engine")}
          </p>
          <div className={cn("mt-2.5 grid gap-4", mech.sliders.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-[340px]")}>
            {mech.sliders.map((key) => {
              const meta = bxSliderMeta[key];
              const id = `px-biomech-slider-${key}`;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={id}
                      className="mono-label text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {t(meta.label)}
                    </label>
                    <span
                      className="mono-label text-[11px] text-[var(--scope-a)]"
                      data-testid={`px-biomech-slider-${key}-value`}
                    >
                      {vals[key]} {meta.unit}
                    </span>
                  </div>
                  <input
                    id={id}
                    type="range"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={vals[key]}
                    onChange={(e) =>
                      setVals((v) => ({ ...v, [key]: Number(e.target.value) }))
                    }
                    aria-label={t(meta.label)}
                    data-testid={`px-biomech-slider-${key}`}
                    className="mt-1.5 w-full cursor-pointer"
                    style={{ accentColor: "var(--scope-a)" }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* the live feedback */}
        <div className="mt-4 border-t hairline pt-4">
          <p className="mono-label text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("Live feedback")}
          </p>
          <div className="mt-3 grid items-center gap-5 md:grid-cols-[minmax(0,300px)_auto_1fr]">
            {/* the clearance curve */}
            <svg
              viewBox="0 0 260 120"
              className="w-full max-w-[300px]"
              role="img"
              aria-label={t("Clearance curve — target protein remaining over time")}
              data-testid="px-biomech-clearance"
            >
              <line x1="14" y1="108" x2="246" y2="108" stroke={SLATE_LIGHT} strokeWidth="1" opacity="0.5" />
              <line x1="14" y1="14" x2="14" y2="108" stroke={SLATE_LIGHT} strokeWidth="1" opacity="0.5" />
              <path d={`${metrics.curve} L 246 108 L 14 108 Z`} fill={CYAN} opacity="0.07" />
              <path d={metrics.curve} fill="none" stroke={CYAN} strokeWidth="2" />
              <circle cx={dot.x} cy={dot.y} r="4" fill={GOLD} stroke="#FFFFFF" strokeWidth="1" opacity="0.95" />
            </svg>

            {/* the half-life readout */}
            <div data-testid="px-biomech-half-life" className="min-w-[130px]">
              <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("Target half-life")}
              </p>
              <p className="mt-1 font-serif text-[26px] leading-none text-foreground">
                {metrics.halfLife.toFixed(1)}
                <span className="ml-1.5 text-[14px] text-muted-foreground">h</span>
              </p>
              <p className="mt-1.5 text-[12px] italic text-muted-foreground">
                {metrics.halfLife < 12
                  ? t("the engines are biting")
                  : t("the engines are idling")}
              </p>
            </div>

            {/* the off-target heat strip */}
            <div>
              <p className="mono-label text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("Off-target binding")}
              </p>
              <div
                className="mt-2 flex gap-[3px]"
                role="img"
                aria-label={t("Off-target binding heat across 12 bystander proteins")}
                data-testid="px-biomech-heat"
              >
                {metrics.heat.map((h, i) => (
                  <span
                    key={i}
                    className="h-6 flex-1 rounded-[4px] border transition-all duration-300"
                    style={{
                      borderColor: `color-mix(in srgb, ${CORAL} ${Math.round(h * 70)}%, transparent)`,
                      background: `color-mix(in srgb, ${CORAL} ${Math.round(h * 52)}%, transparent)`,
                      boxShadow:
                        h > 0.55
                          ? `0 0 ${Math.round(h * 10)}px color-mix(in srgb, ${CORAL} 55%, transparent)`
                          : undefined,
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground" aria-live="polite">
                {t("{n} of 12 bystander proteins run hot", { n: metrics.hot })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{BX_CSS}</style>

      <div data-testid="px-biomech" className="space-y-5">
        {/* the kategori's opening line */}
        <div className="text-center">
          <h3 className="scope-gradient-text text-[19px] font-semibold">
            {t(pxBioChamber.name)}
          </h3>
          <p className="mt-1 font-serif text-[14px] italic text-muted-foreground">
            {t(pxBioChamber.subtitle)}
          </p>
          <p className="mx-auto mt-2 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">
            {t(pxBioChamber.reveals)}
          </p>
        </div>

        {board}
      </div>

      {/* the fullscreen chamber */}
      {zoom &&
        createPortal(
          <div
            className="fixed inset-0 z-[80]"
            role="dialog"
            aria-modal="true"
            aria-label={t("Bio Mechanics — full screen")}
            data-testid="px-biomech-fullscreen"
          >
            <div className="absolute inset-0 bg-[#05040B]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(58% 46% at 50% 0%, rgba(53,224,210,0.09), transparent 70%), radial-gradient(46% 38% at 82% 96%, rgba(230,181,74,0.08), transparent 70%), radial-gradient(40% 34% at 12% 82%, rgba(255,122,92,0.07), transparent 70%)",
              }}
            />
            <span className="bx-twinkle absolute left-[12%] top-[18%] size-1 rounded-full bg-white/60" aria-hidden="true" />
            <span className="bx-twinkle bx-twinkle-2 absolute left-[78%] top-[26%] size-1.5 rounded-full bg-white/50" aria-hidden="true" />
            <span className="bx-twinkle bx-twinkle-3 absolute left-[30%] top-[80%] size-1 rounded-full bg-white/40" aria-hidden="true" />
            <span className="bx-twinkle bx-twinkle-2 absolute left-[64%] top-[68%] size-1 rounded-full bg-white/40" aria-hidden="true" />

            <div className="nice-scroll relative z-10 mx-auto h-full w-full max-w-[1080px] overflow-y-auto px-4 pb-10 pt-5 sm:px-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="mono-label text-[10px] uppercase tracking-[0.24em] text-white/60">
                  {t(pxBioChamber.name)} — {t("full screen")}
                </p>
                <div className="flex items-center gap-2">
                  <kbd className="mono-label rounded-full border border-white/15 px-2 py-1 text-[9px] text-white/50">
                    ESC
                  </kbd>
                  <button
                    type="button"
                    onClick={() => setZoom(false)}
                    aria-label={t("Close the full screen")}
                    title={t("Close the full screen")}
                    data-testid="px-biomech-zoom-close"
                    className="focus-glow flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-all duration-300 hover:bg-white/10"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {board}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
