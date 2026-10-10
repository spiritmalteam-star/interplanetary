/* ------------------------------------------------------------------ */
/*  Star Play — physical image pool inventory (auto-maintained by      */
/*  scripts/generate-star-play-images.mjs). Counts how many generated  */
/*  variants exist on disk per suit slug under                         */
/*  public/images/ai/star-play/<slug>-<n>.jpg (n = 0 … count-1).       */
/* ------------------------------------------------------------------ */

export const SUIT_IMAGE_COUNTS: Record<string, number> = {
  "silver-gate": 2,
  "violet-hour": 2,
  "ember-compass": 2,
  "pearl-threshold": 2,
  "glass-aurora": 2,
  "silent-meridian": 2,
  "honeyed-void": 2,
  "velvet-antenna": 2,
  "salt-cathedral": 2,
  "lantern-of-hours": 2,
  "ninth-harbor": 2,
  "copper-vesper": 2,
  "wandering-chord": 2,
  "quiet-bell": 2,
  "inked-aurora": 2,
  "patient-fire": 2,
  "cartographers-moon": 2,
  "hollow-star": 2,
  "first-snow": 2,
  "glacier-choir": 2,
  "lamplight-field": 2,
  "amber-frequency": 2,
  "humming-threshold": 2,
  "cinder-psalm": 2,
  "unwritten-hour": 2,
  "stillpoint-chord": 2,
  "cartomancers-hand": 2,
  "aurora-ledger": 2,
  "salt-road": 2,
  "velvet-dark": 2,
  "ninth-wave": 2,
  "lantern-oath": 2,
  "pearl-meridian": 2,
  "glass-bell": 2,
  "ember-psalm": 2,
  "quiet-meridian": 2,
  "honeyed-ember": 2,
  "wandering-lantern": 2,
  "silent-aurora": 1,
};

/** Shown until a suit's own art exists on disk. */
export const STAR_PLAY_FALLBACK_IMAGE = "/images/ai/star-play-emblem.jpg";
