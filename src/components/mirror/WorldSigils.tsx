"use client";

/* ------------------------------------------------------------------ */
/*  THE WORLD SIGILS — each world wears its own golden mark.           */
/*                                                                     */
/*  The ten gifted golden emblems (light-language seals drawn in       */
/*  radiant gold) are trimmed to 128px pairs: the full gold glows in   */
/*  deep space, and an antique-bronze ink of the same seal answers     */
/*  the daylight laboratory.                                           */
/*                                                                     */
/*  pair[0] = world-*-dark.png  → bronze ink, worn in the light theme  */
/*  pair[1] = world-*-light.png → radiant gold, worn in the dark theme */
/* ------------------------------------------------------------------ */

export type WorldSigilKey =
  | "mirroros"
  | "akashic"
  | "starplay"
  | "invent"
  | "dreambook"
  | "lightcodes"
  | "particlex"
  | "synth"
  | "evolvemed";

const PNG_SIGILS: Record<WorldSigilKey, [string, string]> = {
  mirroros: [
    "/images/sigils/world-mirroros-dark.png",
    "/images/sigils/world-mirroros-light.png",
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
  lightcodes: [
    "/images/sigils/world-lightcodes-dark.png",
    "/images/sigils/world-lightcodes-light.png",
  ],
  particlex: [
    "/images/sigils/world-particlex-dark.png",
    "/images/sigils/world-particlex-light.png",
  ],
  /* Synth Analog wears the gifted golden sigil itself — the same
     emblem that holds the Quantum Mirror Core of the instrument. */
  synth: [
    "/images/synth-analog/core-dark.png",
    "/images/synth-analog/core-light.png",
  ],
  evolvemed: [
    "/images/sigils/world-evolvemed-dark.png",
    "/images/sigils/world-evolvemed-light.png",
  ],
};

/**
 * One world's golden sigil — the paired PNGs answer the theme by
 * themselves (bronze in daylight, radiant gold in deep space).
 */
export function WorldSigil({
  world,
  className,
}: {
  world: WorldSigilKey;
  className?: string;
}) {
  const pair = PNG_SIGILS[world];
  return (
    <span className={`relative inline-block size-full ${className ?? ""}`} aria-hidden="true">
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
