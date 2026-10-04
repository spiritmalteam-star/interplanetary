"use client";

import type { CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/*  THE WORLD SIGILS — each world wears its own light-language mark.   */
/*                                                                     */
/*  Five marks came as gifts (transparent PNG pairs: dark ink for the  */
/*  daylight laboratory, white ink for deep space). Three younger      */
/*  worlds carry hand-drawn SVG sigils drawn in the same tongue —      */
/*  flowing stems, circles, four-point stars — stroked in currentColor */
/*  so they answer every theme by themselves.                          */
/* ------------------------------------------------------------------ */

export type WorldSigilKey =
  | "mirroros"
  | "akashic"
  | "starplay"
  | "invent"
  | "dreambook"
  | "lightcodes"
  | "particlex"
  | "evolvemed";

const PNG_SIGILS: Partial<Record<WorldSigilKey, [string, string]>> = {
  mirroros: [
    "/images/sigils/world-manifest-dark.png",
    "/images/sigils/world-manifest-light.png",
  ],
  akashic: [
    "/images/sigils/world-akashic-dark.png",
    "/images/sigils/world-akashic-light.png",
  ],
  starplay: [
    "/images/sigils/world-starplay-dark.png",
    "/images/sigils/world-starplay-light.png",
  ],
  invent: [
    "/images/sigils/world-invent-dark.png",
    "/images/sigils/world-invent-light.png",
  ],
  dreambook: [
    "/images/sigils/world-dreambook-dark.png",
    "/images/sigils/world-dreambook-light.png",
  ],
};

/* ---- the three hand-drawn sigils, in the same flowing voice ------- */

const SIGIL_STYLE: CSSProperties = {
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 2.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function LightCodesSigil() {
  /* a stem of sound — arcs of voice rising on either side, a star
     held at the heart, a circle of arrival above */
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true">
      <g style={SIGIL_STYLE}>
        {/* the stem */}
        <path d="M24 6 C24 18, 24 30, 24 42" />
        {/* the arrival circle above */}
        <circle cx="24" cy="5" r="3" />
        {/* waves of voice, left and right */}
        <path d="M16 14 C12 18, 12 24, 16 28" />
        <path d="M32 14 C36 18, 36 24, 32 28" />
        <path d="M11 11 C5 17, 5 25, 11 31" />
        <path d="M37 11 C43 17, 43 25, 37 31" />
        {/* the four-point star at the heart */}
        <path d="M24 20 C24.8 22.6, 25.4 23.2, 28 24 C25.4 24.8, 24.8 25.4, 24 28 C23.2 25.4, 22.6 24.8, 20 24 C22.6 23.2, 23.2 22.6, 24 20 Z" />
        {/* the seed resting below */}
        <circle cx="24" cy="36" r="2.2" />
        <circle cx="24" cy="43" r="2.8" />
      </g>
    </svg>
  );
}

function ParticleXSigil() {
  /* the nucleus and its three probability orbits, one dot riding each */
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true">
      <g style={SIGIL_STYLE}>
        <circle cx="24" cy="24" r="3.4" style={{ fill: "currentColor", stroke: "none" }} />
        <ellipse cx="24" cy="24" rx="16" ry="6.4" transform="rotate(24 24 24)" />
        <ellipse cx="24" cy="24" rx="16" ry="6.4" transform="rotate(150 24 24)" />
        <ellipse cx="24" cy="24" rx="16" ry="6.4" transform="rotate(86 24 24)" />
        <circle cx="38.5" cy="17" r="1.7" style={{ fill: "currentColor", stroke: "none" }} />
        <circle cx="12" cy="30.5" r="1.7" style={{ fill: "currentColor", stroke: "none" }} />
        <circle cx="26.5" cy="37.5" r="1.7" style={{ fill: "currentColor", stroke: "none" }} />
      </g>
    </svg>
  );
}

function EvolveMedSigil() {
  /* the double helix — two mirrored currents, three rungs of light,
     a small sun of growth above */
  return (
    <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true">
      <g style={SIGIL_STYLE}>
        <path d="M15 8 C31 16, 31 26, 15 34 C7 38, 7 42, 12 44" />
        <path d="M33 8 C17 16, 17 26, 33 34 C41 38, 41 42, 36 44" />
        <path d="M18.5 14.5 L29.5 14.5" />
        <path d="M17 22 L31 22" />
        <path d="M18.5 29.5 L29.5 29.5" />
        <circle cx="24" cy="5" r="2.6" />
      </g>
    </svg>
  );
}

const SVG_SIGILS: Partial<
  Record<WorldSigilKey, () => React.JSX.Element>
> = {
  lightcodes: LightCodesSigil,
  particlex: ParticleXSigil,
  evolvemed: EvolveMedSigil,
};

/**
 * One world's sigil — the paired PNGs answer the theme by themselves;
 * the drawn sigils answer through currentColor.
 */
export function WorldSigil({
  world,
  className,
}: {
  world: WorldSigilKey;
  className?: string;
}) {
  const pair = PNG_SIGILS[world];
  if (pair) {
    return (
      <span className={`relative inline-block size-6 ${className ?? ""}`} aria-hidden="true">
        <img
          src={pair[0]}
          alt=""
          loading="lazy"
          className="size-full object-contain dark:hidden"
        />
        <img
          src={pair[1]}
          alt=""
          loading="lazy"
          className="hidden size-full object-contain dark:block"
        />
      </span>
    );
  }
  const Drawn = SVG_SIGILS[world];
  if (Drawn) {
    return (
      <span className={`inline-block size-6 ${className ?? ""}`} aria-hidden="true">
        <Drawn />
      </span>
    );
  }
  return null;
}
