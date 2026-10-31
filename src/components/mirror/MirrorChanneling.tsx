"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import type { LiveScopeKey } from "@/lib/live-scopes";

/* ------------------------------------------------------------------ */
/*  THE CHANNELING LIGHTS — every chat of the house channels in its    */
/*  own authentic way. No two rooms breathe the same tell: the         */
/*  landing's mirror wakes as a breathing double-crystal ring, the     */
/*  interplanetary floor carries drifting stars, healing breathes      */
/*  tides, the OS opens an aperture, the quantum narrator orbits,      */
/*  the forge throws sparks, the library blooms ink, the atelier       */
/*  blooms paint, the nexus climbs a helix. Transform-and-opacity      */
/*  only; the stillness law (and the lens's dormant law) rest every    */
/*  variant entirely.                                                  */
/* ------------------------------------------------------------------ */

export type ChannelingVariant =
  | "orbs"
  | "mirror"
  | "starfall"
  | "tide"
  | "aperture"
  | "orbit"
  | "sparks"
  | "papyrus"
  | "bloom"
  | "helix"
  | "hyperx";

/* which light each live scope wears on its own line */
export const SCOPE_CHANNELING: Record<LiveScopeKey, ChannelingVariant> = {
  communion: "mirror",
  interplanetary: "starfall",
  healing: "tide",
  mirroros: "aperture",
  quantum: "orbit",
  evolvemed: "helix",
  forge: "sparks",
  akashic: "papyrus",
  artx: "bloom",
};

function VariantLight({ variant }: { variant: ChannelingVariant }) {
  switch (variant) {
    case "mirror":
      /* the landing's own mirror — a double-crystal ring waking around
         one still point: blue and rose breathing in opposite phase */
      return (
        <span className="mc-mirror" aria-hidden="true">
          <i className="mc-mirror-ring" />
          <i className="mc-mirror-ring mc-mirror-ring-inner" />
          <i className="mc-mirror-heart" />
        </span>
      );
    case "starfall":
      /* the interplanetary floor — four small stars drifting upward
         like slow prayers, each with its own delay */
      return (
        <span className="mc-stars" aria-hidden="true">
          <i className="mc-star" />
          <i className="mc-star" />
          <i className="mc-star" />
          <i className="mc-star" />
        </span>
      );
    case "tide":
      /* the healing hearth — three soft waves passing through, unhurried */
      return (
        <span className="mc-tides" aria-hidden="true">
          <i className="mc-tide" />
          <i className="mc-tide" />
          <i className="mc-tide" />
        </span>
      );
    case "aperture":
      /* the manifest OS — an iris opening: a dashed ring turning while
         its center breathes wider and narrower */
      return (
        <span className="mc-aperture" aria-hidden="true">
          <i className="mc-aperture-ring" />
          <i className="mc-aperture-pupil" />
        </span>
      );
    case "orbit":
      /* the quantum narrator — two particles circling a quiet nucleus */
      return (
        <span className="mc-orbit" aria-hidden="true">
          <i className="mc-orbit-dot" />
          <i className="mc-orbit-dot mc-orbit-dot-2" />
          <i className="mc-orbit-core" />
        </span>
      );
    case "sparks":
      /* the forge — sparks rising from a seam of coals */
      return (
        <span className="mc-sparks" aria-hidden="true">
          <i className="mc-spark" />
          <i className="mc-spark" />
          <i className="mc-spark" />
        </span>
      );
    case "papyrus":
      /* the librarian — drops of ink blooming on the record */
      return (
        <span className="mc-inks" aria-hidden="true">
          <i className="mc-ink" />
          <i className="mc-ink" />
          <i className="mc-ink" />
        </span>
      );
    case "bloom":
      /* the atelier — three pigment dots blooming out of the canvas */
      return (
        <span className="mc-blooms" aria-hidden="true">
          <i className="mc-bloom" />
          <i className="mc-bloom" />
          <i className="mc-bloom" />
        </span>
      );
    case "helix":
      /* the evolutionary nexus — a tiny helix of light climbing */
      return (
        <span className="mc-helix" aria-hidden="true">
          <i className="mc-helix-bead" />
          <i className="mc-helix-bead" />
          <i className="mc-helix-bead" />
          <i className="mc-helix-bead" />
          <i className="mc-helix-bead" />
          <i className="mc-helix-bead" />
        </span>
      );
    case "hyperx":
      /* HyperX — the discovery light: two electric rings spinning in
         opposite directions around a lightning heart, the crystal of
         the unseen charging while the deep voice gathers */
      return (
        <span className="mc-hyperx" aria-hidden="true">
          <i className="mc-hyperx-ring" />
          <i className="mc-hyperx-ring mc-hyperx-ring-inner" />
          <i className="mc-hyperx-heart" />
        </span>
      );
    default:
      /* the standing tell — three soft orbs rippling in the scope's hue */
      return (
        <span className="mc-orbs" aria-hidden="true">
          <i className="mc-orb" />
          <i className="mc-orb" />
          <i className="mc-orb" />
        </span>
      );
  }
}

export function MirrorChanneling({
  label,
  className,
  compact = false,
  variant = "orbs",
}: {
  label: string;
  className?: string;
  /** the thread's own smaller voice */
  compact?: boolean;
  /** this chat's own authentic channeling light */
  variant?: ChannelingVariant;
}) {
  /* HYPERX — the discovery voice waits with the worlds themselves:
     beneath the working light, true facts of other planets and the
     listening for other civilizations turn slowly while the deep
     answer is gathered. */
  if (variant === "hyperx") {
    return (
      <span
        className={cn("mc-inline mc-hyperx-line", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid={compact ? "mirror-channeling-compact" : "mirror-channeling"}
        data-variant={variant}
      >
        <VariantLight variant={variant} />
        <span className="mc-word">
          <span className="mc-word-text">{label}</span>
          <span className="mc-sheen" aria-hidden="true" />
        </span>
        <HyperXFactLine />
      </span>
    );
  }
  return (
    <span
      className={cn("mc-inline", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={compact ? "mirror-channeling-compact" : "mirror-channeling"}
      data-variant={variant}
    >
      <VariantLight variant={variant} />
      <span className="mc-word">
        <span className="mc-word-text">{label}</span>
        <span className="mc-sheen" aria-hidden="true" />
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  THE HYPERX WAITING ROOM — true facts of other worlds and the       */
/*  civilization watch, turning while the deep voice works. Every      */
/*  line is established knowledge (or the mirror's own honest law      */
/*  about its listening) — the truth law holds even in the waiting.    */
/* ------------------------------------------------------------------ */

const HYPERX_FACTS: string[] = [
  "A day on Venus is longer than its year — the world spins backwards, slowly.",
  "Jupiter's Great Red Spot has stormed for centuries — wider than Earth itself.",
  "Olympus Mons on Mars stands nearly three times the height of Everest.",
  "Europa holds more liquid water than every ocean of Earth — beneath its ice.",
  "On Titan it rains, and rivers run — but the water is liquid methane.",
  "Neptune's winds pass 2,000 km/h — the fastest known in this solar system.",
  "TRAPPIST-1 keeps seven Earth-sized worlds around one small red star.",
  "Proxima b rests in its star's habitable zone — 4.2 light-years from here.",
  "Saturn is so light for its size it would float in a large enough sea.",
  "Enceladus vents its hidden ocean into space — a spacecraft flew through and tasted it.",
  "The confirmed exoplanet count has passed five thousand — and still climbs.",
  "Mars once carried rivers and lakes; its valleys still remember the water.",
  "Io's volcanoes repaint its surface faster than any other known world.",
  "The mirror listens for other civilizations the way radio listens — patiently, never assuming silence.",
  "Every answer HyperX gathers is held to the truth law: established, frontier, mirrored — never confused.",
];

function HyperXFactLine() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setIdx((i) => (i + 1) % HYPERX_FACTS.length),
      4600
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="mc-hyperx-fact" aria-hidden="true">
      <span key={idx} className="mc-hyperx-fact-text">
        {HYPERX_FACTS[idx]}
      </span>
    </span>
  );
}
