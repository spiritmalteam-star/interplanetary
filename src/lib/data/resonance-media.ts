/* ------------------------------------------------------------------ */
/*  THE RESONANCE MEDIA — the constellation every room of the walk     */
/*  draws its cards from. Six light-code frequencies (real synthesized */
/*  tone loops in /public/audio/frequencies), six sigils (real images  */
/*  in /public/images/walk), six dream-book archetypes.                */
/*                                                                     */
/*  The PRC (src/lib/resonance-walk.ts) pre-loads these one to two     */
/*  steps ahead of the visitor's walk, so a pressed branch opens with  */
/*  its voice and its sigil already resident. Honest by law: the       */
/*  frequency card plays what it names; the sigil card shows the       */
/*  image shaped for this walk; the book card opens the Dream Book     */
/*  atelier, where the full volume is woven for real.                  */
/* ------------------------------------------------------------------ */

import type { DreamBookPayload, LightCodeMusicPayload } from "../resonance-walk";

/** The six tones of the field — each a real, loopable ambient drone
    (pure tone + 1.5Hz binaural shimmer + slow tremolo breath). */
export const RESONANCE_FREQUENCIES: LightCodeMusicPayload[] = [
  {
    trackId: "freq-432",
    ambientFrequency: "432Hz — Lyran Memory",
    streamUrl: "/audio/frequencies/freq-432.mp3",
  },
  {
    trackId: "freq-396",
    ambientFrequency: "396Hz — Root Liberation",
    streamUrl: "/audio/frequencies/freq-396.mp3",
  },
  {
    trackId: "freq-528",
    ambientFrequency: "528Hz — Heart Weaving",
    streamUrl: "/audio/frequencies/freq-528.mp3",
  },
  {
    trackId: "freq-639",
    ambientFrequency: "639Hz — Veil of Communion",
    streamUrl: "/audio/frequencies/freq-639.mp3",
  },
  {
    trackId: "freq-741",
    ambientFrequency: "741Hz — Signal Clearing",
    streamUrl: "/audio/frequencies/freq-741.mp3",
  },
  {
    trackId: "freq-852",
    ambientFrequency: "852Hz — Inner Sight",
    streamUrl: "/audio/frequencies/freq-852.mp3",
  },
];

/** The six sigils of the walk — each named by the tone it pairs with. */
export interface ResonanceSigil {
  imageUrl: string;
  name: string;
}

export const RESONANCE_SIGILS: ResonanceSigil[] = [
  { imageUrl: "/images/walk/lyran-432.jpg", name: "lyran-432" },
  { imageUrl: "/images/walk/root-396.jpg", name: "root-396" },
  { imageUrl: "/images/walk/heart-528.jpg", name: "heart-528" },
  { imageUrl: "/images/walk/communion-639.jpg", name: "communion-639" },
  { imageUrl: "/images/walk/clearing-741.jpg", name: "clearing-741" },
  { imageUrl: "/images/walk/insight-852.jpg", name: "insight-852" },
];

/** The dream-book archetypes — titles, readers and depths in the
    Dream Book's own vocabulary (see src/lib/data/book-options.ts). */
export const RESONANCE_BOOKS: DreamBookPayload[] = [
  {
    title: "The Ledger of Distant Comings",
    targetReader: "Grown dreamers",
    depthLevel: 4,
    summary:
      "A quiet ledger of arrivals — every page a visitor the dreamer did not know was already on the way.",
  },
  {
    title: "The Cartographer of Small Hours",
    targetReader: "All ages",
    depthLevel: 3,
    summary:
      "A mapmaker who charts only the places feelings leave behind, one small hour at a time.",
  },
  {
    title: "The Lantern Beneath the Tongue",
    targetReader: "Teens",
    depthLevel: 3,
    summary:
      "A story about the words we swallow and the light they keep, waiting for a braver season.",
  },
  {
    title: "The Orchard of Almost",
    targetReader: "Young readers",
    depthLevel: 2,
    summary:
      "A young orchard-keeper learns that every 'almost' is a seed that chose patience.",
  },
  {
    title: "The Tide That Remembers Names",
    targetReader: "Little dreamers",
    depthLevel: 1,
    summary:
      "A gentle tide arrives each night to say the names of sleeping things, so nothing is ever lost.",
  },
  {
    title: "The Fifth Window",
    targetReader: "Grown dreamers",
    depthLevel: 5,
    summary:
      "A house with four lit windows and one dark; the multidimensional telling opens the fifth.",
  },
];
