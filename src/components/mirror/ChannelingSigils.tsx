"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ChannelingKind } from "@/lib/channeling-sdk";
import { ChannelingOrb } from "./ChannelingOrb";

/* ------------------------------------------------------------------ */
/*  THE CHANNELING SIGILS — every kind of channeling wears its OWN     */
/*  animation while its transmission forms. No two kinds breathe       */
/*  alike: the record opens an eye, the book turns a leaf, the poem    */
/*  unfurls an ink blossom, the forge strikes sparks, the nexus        */
/*  breathes a helix, the field gathers rings.                         */
/*                                                                     */
/*  THE COOL LAW: every sigil is transform-and-opacity only — they     */
/*  live on the compositor, cost almost nothing, and rest under the    */
/*  stillness law (prefers-reduced-motion).                            */
/* ------------------------------------------------------------------ */

export interface ChannelingSigilProps {
  kind: ChannelingKind;
  /** the sigil's full size in px */
  size?: number;
  className?: string;
}

const TransmissionSigil = memo(function TransmissionSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return <ChannelingOrb size={size} className={className} />;
});

/** AKASHIC — the all-seeing eye: a slow iris inside a ring of runes. */
const AkashicSigil = memo(function AkashicSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-akashic"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-full text-[var(--scope-a,var(--gd))]">
        <g className="csig-ak-runes">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx={24 + 19 * Math.cos((deg * Math.PI) / 180)}
              cy={24 + 19 * Math.sin((deg * Math.PI) / 180)}
              r="1.1"
              fill="currentColor"
              stroke="none"
              opacity="0.75"
            />
          ))}
        </g>
        <circle className="csig-ak-ring" cx="24" cy="24" r="13" opacity="0.5" />
        <path d="M8 24 C14 15 34 15 40 24 C34 33 14 33 8 24 Z" className="csig-ak-lid" />
        <circle className="csig-ak-iris" cx="24" cy="24" r="5.5" />
        <circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none" className="csig-ak-pupil" />
      </svg>
    </span>
  );
});

/** BOOK — the woven volume: a leaf that keeps turning over the spine. */
const BookSigil = memo(function BookSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-book"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <path d="M10 12 C14 10 20 10 23 12 L23 37 C20 35 14 35 10 37 Z" opacity="0.85" />
        <path d="M38 12 C34 10 28 10 25 12 L25 37 C28 35 34 35 38 37 Z" opacity="0.85" />
        <path className="csig-bk-leaf" d="M23 12 C26 9 32 8 37 9.5 L37 30 C32 28.5 26 29.5 23 32 Z" />
        <g className="csig-bk-lines">
          <line x1="13" y1="17" x2="20" y2="16" strokeWidth="1" opacity="0.5" />
          <line x1="13" y1="22" x2="20" y2="21" strokeWidth="1" opacity="0.5" />
          <line x1="13" y1="27" x2="20" y2="26" strokeWidth="1" opacity="0.5" />
        </g>
      </svg>
    </span>
  );
});

/** POEM — the ink blossom: five petals unfurling around a drop of ink. */
const PoemSigil = memo(function PoemSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-poem"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-full text-[var(--scope-a,var(--gd))]">
        <g className="csig-po-bloom" style={{ transformOrigin: "24px 24px" }}>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="24"
              cy="14.5"
              rx="4.6"
              ry="8"
              transform={`rotate(${deg} 24 24)`}
              className="csig-po-petal"
              style={{ transformOrigin: "24px 24px", animationDelay: `${(deg / 72) * 0.24}s` }}
            />
          ))}
        </g>
        <circle className="csig-po-drop" cx="24" cy="24" r="2.6" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
});

/** VISUAL — the prism bloom: a turning prism casting three beams. */
const VisualSigil = memo(function VisualSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-visual"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <g className="csig-vs-prism" style={{ transformOrigin: "24px 26px" }}>
          <path d="M24 10 L38 34 L10 34 Z" className="csig-vs-glass" />
        </g>
        <line className="csig-vs-beam csig-vs-beam-a" x1="4" y1="22" x2="17" y2="23" strokeWidth="1.2" />
        <line className="csig-vs-beam csig-vs-beam-b" x1="33" y1="28" x2="45" y2="33" strokeWidth="1.2" />
        <line className="csig-vs-beam csig-vs-beam-c" x1="33" y1="30" x2="45" y2="26" strokeWidth="1.2" />
      </svg>
    </span>
  );
});

/** DREAM — the drifting veil: a crescent moon behind breathing veils. */
const DreamSigil = memo(function DreamSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-dream"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <path className="csig-dm-moon" d="M28 10 A12.5 12.5 0 1 0 28 38 A15.5 15.5 0 0 1 28 10 Z" />
        <path className="csig-dm-veil csig-dm-veil-a" d="M6 20 Q14 16 22 20 T38 20" opacity="0.6" />
        <path className="csig-dm-veil csig-dm-veil-b" d="M8 28 Q16 24 24 28 T40 28" opacity="0.45" />
        <path className="csig-dm-veil csig-dm-veil-c" d="M10 36 Q18 32 26 36 T42 36" opacity="0.3" />
        <circle className="csig-dm-star" cx="38" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
});

/** FORGE — the striking spark: a hammer head and rising embers. */
const ForgeSigil = memo(function ForgeSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-forge"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <path d="M14 34 L26 34 L26 38 L14 38 Z" opacity="0.85" />
        <g className="csig-fg-hammer" style={{ transformOrigin: "30px 30px" }}>
          <path d="M26 32 L34 20 L40 24 L32 36 Z" />
          <path d="M24 30 L20 25" strokeWidth="2" />
        </g>
        <g fill="currentColor" stroke="none">
          <circle className="csig-fg-spark csig-fg-spark-a" cx="20" cy="22" r="1.3" />
          <circle className="csig-fg-spark csig-fg-spark-b" cx="26" cy="16" r="1" />
          <circle className="csig-fg-spark csig-fg-spark-c" cx="32" cy="12" r="1.1" />
        </g>
      </svg>
    </span>
  );
});

/** CODES — the sound wave: five bars breathing a chord. */
const CodesSigil = memo(function CodesSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-codes"
      className={cn("csig relative inline-flex shrink-0 items-end justify-center gap-[3px]", className)}
      style={{ width: size, height: size }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="csig-lc-bar w-[3px] rounded-full bg-current"
          style={{
            height: "100%",
            transformOrigin: "center bottom",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
});

/** REMEDY — the crafting vessel: a flask with rising drops. */
const RemedySigil = memo(function RemedySigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-remedy"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <path d="M20 8 L28 8 L28 18 L36 34 A6 6 0 0 1 30.5 42 L17.5 42 A6 6 0 0 1 12 34 L20 18 Z" className="csig-rm-vessel" />
        <path d="M15 33 L33 33" opacity="0.6" strokeWidth="1.2" />
        <g fill="currentColor" stroke="none">
          <circle className="csig-rm-drop csig-rm-drop-a" cx="24" cy="30" r="1.6" />
          <circle className="csig-rm-drop csig-rm-drop-b" cx="20" cy="26" r="1.2" />
          <circle className="csig-rm-drop csig-rm-drop-c" cx="28" cy="24" r="1.1" />
        </g>
      </svg>
    </span>
  );
});

/** QUANTUM — the orbiting atom: two counter-rotating electron rings. */
const QuantumSigil = memo(function QuantumSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-quantum"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" className="size-full text-[var(--scope-a,var(--gd))]">
        <circle className="csig-qm-core" cx="24" cy="24" r="3.2" fill="currentColor" stroke="none" />
        <g className="csig-qm-orbit-a" style={{ transformOrigin: "24px 24px" }}>
          <ellipse cx="24" cy="24" rx="18" ry="7.5" opacity="0.65" />
          <circle cx="42" cy="24" r="1.8" fill="currentColor" stroke="none" />
        </g>
        <g className="csig-qm-orbit-b" style={{ transformOrigin: "24px 24px" }}>
          <ellipse cx="24" cy="24" rx="18" ry="7.5" transform="rotate(66 24 24)" opacity="0.65" />
          <circle cx="24" cy="16.5" r="1.5" fill="currentColor" stroke="none" opacity="0.85" />
        </g>
      </svg>
    </span>
  );
});

/** EVOLVE — the breathing helix: two strands weaving. */
const EvolveSigil = memo(function EvolveSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-evolve"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <g className="csig-ev-helix">
          <path className="csig-ev-strand-a" d="M16 6 C30 12 30 18 16 24 C30 30 30 36 16 42" />
          <path className="csig-ev-strand-b" d="M32 6 C18 12 18 18 32 24 C18 30 18 36 32 42" />
          <g className="csig-ev-rungs" strokeWidth="1.1" opacity="0.6">
            <line x1="18" y1="10" x2="30" y2="10" />
            <line x1="20" y1="17" x2="28" y2="17" />
            <line x1="20" y1="31" x2="28" y2="31" />
            <line x1="18" y1="38" x2="30" y2="38" />
          </g>
        </g>
      </svg>
    </span>
  );
});

/** MANIFEST — the drawing blueprint: a grid where a line keeps drawing itself. */
const ManifestSigil = memo(function ManifestSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-manifest"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.3" className="size-full text-[var(--scope-a,var(--gd))]">
        <g opacity="0.28" strokeWidth="0.8">
          <line x1="24" y1="6" x2="24" y2="42" />
          <line x1="6" y1="24" x2="42" y2="24" />
          <rect x="10" y="10" width="28" height="28" />
        </g>
        <path
          className="csig-mf-line"
          d="M10 34 L10 14 L24 14 L24 34 L38 34 L38 14"
          strokeWidth="1.8"
        />
        <circle className="csig-mf-node" cx="38" cy="14" r="2.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
});

/** ART X — the palette bloom: a brush dot circling a palette. */
const ArtXSigil = memo(function ArtXSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-artx"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-full text-[var(--scope-a,var(--gd))]">
        <path d="M24 8 A16 16 0 1 0 40 24 C40 30 34 29 30 30 C26.5 30.8 26 34 28.5 36.5 C26 38.6 21 38 17.5 35.5 A16 16 0 0 1 24 8 Z" opacity="0.8" />
        <g className="csig-ax-dot" style={{ transformOrigin: "24px 24px" }}>
          <circle cx="31" cy="15" r="2.4" fill="currentColor" stroke="none" />
        </g>
        <circle cx="18" cy="17" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
        <circle cx="14.5" cy="25" r="1.5" fill="currentColor" stroke="none" opacity="0.45" />
        <circle cx="18" cy="32" r="1.5" fill="currentColor" stroke="none" opacity="0.3" />
      </svg>
    </span>
  );
});

/** GATHERING — the gathered ring: three rings converging into one field. */
const GatheringSigil = memo(function GatheringSigil({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="channeling-sigil-gathering"
      className={cn("csig relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" className="size-full text-[var(--scope-a,var(--gd))]">
        <circle className="csig-ga-ring csig-ga-ring-a" cx="24" cy="24" r="19" opacity="0.5" />
        <circle className="csig-ga-ring csig-ga-ring-b" cx="24" cy="24" r="13" opacity="0.7" style={{ transformOrigin: "24px 24px" }} />
        <circle className="csig-ga-ring csig-ga-ring-c" cx="24" cy="24" r="7" style={{ transformOrigin: "24px 24px" }} />
        <g fill="currentColor" stroke="none">
          <circle className="csig-ga-soul" cx="24" cy="5" r="1.6" />
          <circle className="csig-ga-soul csig-ga-soul-b" cx="41" cy="30" r="1.4" />
          <circle className="csig-ga-soul csig-ga-soul-c" cx="9" cy="31" r="1.3" />
        </g>
      </svg>
    </span>
  );
});

const SIGILS: Record<
  ChannelingKind,
  (p: { size: number; className?: string }) => React.JSX.Element
> = {
  transmission: TransmissionSigil,
  akashic: AkashicSigil,
  book: BookSigil,
  poem: PoemSigil,
  visual: VisualSigil,
  dream: DreamSigil,
  forge: ForgeSigil,
  codes: CodesSigil,
  remedy: RemedySigil,
  quantum: QuantumSigil,
  evolve: EvolveSigil,
  manifest: ManifestSigil,
  artx: ArtXSigil,
  gathering: GatheringSigil,
};

export function ChannelingSigil({ kind, size = 28, className }: ChannelingSigilProps) {
  const Sigil = SIGILS[kind] ?? TransmissionSigil;
  return <Sigil size={size} className={className} />;
}
