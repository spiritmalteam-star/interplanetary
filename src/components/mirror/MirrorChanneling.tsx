"use client";

import { cn } from "@/lib/utils";
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
  | "helix";

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
