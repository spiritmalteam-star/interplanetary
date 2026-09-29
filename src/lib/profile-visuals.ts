import { fnv1a } from "@/lib/hash";

/* ------------------------------------------------------------------ */
/*  Profile visuals — deterministic thematic scene selection.          */
/*  Every profile draws its supporting scenes from the painted section */
/*  masters by a stable hash: the same profile always wears the same   */
/*  scenes, different profiles spread across the whole pool.           */
/* ------------------------------------------------------------------ */

/** The painted section/scene masters under /images/ai (all on disk). */
export const SECTION_SCENES = [
  "dir-consciousness",
  "dir-energy",
  "dir-information",
  "dir-life",
  "dir-matter",
  "dir-spacetime",
  "dom-celestial-arts",
  "dom-cosmic-history",
  "dom-cosmic-navigation",
  "dom-diplomacy-treaties",
  "dom-dream-astral",
  "dom-exploration-first-contact",
  "dom-genetic-soul-architecture",
  "dom-healing-arts",
  "dom-light-technology",
  "dom-planetary-stewardship",
  "dom-sound-vibration",
  "dom-temple-ritual",
  "mode-healing",
  "mode-interplanetary",
  "mode-quantum",
  "mode-metaphysics",
] as const;

/** A deterministic thematic scene for a profile. The salt separates
    the two supporting slots so one profile never shows the same scene
    twice, while the same profile always gets the same scenes. */
export function sceneImageFor(seed: string, salt: string): string {
  const h = fnv1a(`${seed}::${salt}`);
  return `/images/ai/${SECTION_SCENES[h % SECTION_SCENES.length]}.jpg`;
}

/** Like sceneImageFor, but guaranteed not to return any of the
    `avoid` paths — a profile's gallery never repeats a scene. */
export function sceneImageForDistinct(
  seed: string,
  salt: string,
  avoid: string[]
): string {
  const base = `${seed}::${salt}`;
  for (let n = 0; n < SECTION_SCENES.length; n++) {
    const h = fnv1a(`${base}::${n}`);
    const pick = `/images/ai/${SECTION_SCENES[h % SECTION_SCENES.length]}.jpg`;
    if (!avoid.includes(pick)) return pick;
  }
  return sceneImageFor(seed, `${salt}-x`);
}

/** Filesystem-safe slug for painter targets and image paths. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
