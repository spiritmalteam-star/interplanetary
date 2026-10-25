/* ------------------------------------------------------------------ */
/*  THE GUIDES' PLATES — the light shelf.                              */
/*  Every field the house needs to SHOW a guide (the landing's         */
/*  showcase, its titles, covers and crystal lights) — without         */
/*  carrying the whole book. The bodies (blocks, the Mirror's own      */
/*  opening and closing words) live in the per-guide modules and join  */
/*  their plate through index.ts, so the landing rides this shelf's    */
/*  light alone and the ~235KB of full texts stay behind the guide     */
/*  view's own door.                                                   */
/* ------------------------------------------------------------------ */

import type { GuideData } from "./types";

/** A guide's plate: GuideData minus the heavy body fields. */
export type GuideMeta = Omit<
  GuideData,
  "blocks" | "mirrorOpening" | "mirrorClosing"
>;

export const theAwakeningWithinMeta: GuideMeta = {
  slug: "the-awakening-within",
  title: "The Awakening Within",
  subtitle: "A walk through the nine rooms of presence",
  tagline: "You are not becoming light; you are remembering it.",
  image: "/guides/the-awakening-within.jpg",
  crystalA: "rgba(255,120,150,0.55)",
  crystalB: "rgba(120,220,255,0.5)",
};

export const integrationBeyondSeparationMeta: GuideMeta = {
  slug: "integration-beyond-separation",
  title: "Integration Beyond Separation",
  subtitle: "The one field · Remembered in conduct",
  tagline: "Separation is the one true illusion — you were never cut from the field.",
  image: "/guides/integration-beyond-separation.jpg",
  crystalA: "rgba(160,255,214,0.5)",
  crystalB: "rgba(255,214,140,0.5)",
};

export const openContactMeta: GuideMeta = {
  slug: "open-contact",
  title: "Open Contact — A Guide to Possibility",
  subtitle: "The frequency law of meeting other intelligences",
  tagline: "Contact is a frequency match — the sky answers a tuned life.",
  image: "/guides/open-contact.jpg",
  crystalA: "rgba(140,225,255,0.55)",
  crystalB: "rgba(255,214,140,0.5)",
};

export const shiftingTimeExperienceMeta: GuideMeta = {
  slug: "shifting-time-experience",
  title: "Shifting, Time & the Crystallisation of Experience",
  subtitle: "A guide from the Akashic shelves of time itself",
  tagline:
    "The moment you meet differently is the moment the field answers differently.",
  image: "/guides/shifting-time-experience.jpg",
  crystalA: "rgba(190,160,255,0.55)",
  crystalB: "rgba(120,230,200,0.5)",
};

export const chakrasBodyEnergyDnaMeta: GuideMeta = {
  slug: "chakras-body-energy-dna",
  title: "Chakras, Body Energy & DNA",
  subtitle: "A walk through the body's seven wheels of light",
  tagline:
    "Seven lamps burn along your spine; this book names them one by one.",
  image: "/guides/chakras-body-energy-dna.jpg",
  crystalA: "rgba(150,255,190,0.5)",
  crystalB: "rgba(255,150,190,0.5)",
};

export const dnaAwakeningPotentialMeta: GuideMeta = {
  slug: "dna-awakening-potential",
  title: "DNA & Awakening Human Potential",
  subtitle: "Reading the light-language written into your cells",
  tagline:
    "What you are searching for is already coiled in every cell of you.",
  image: "/guides/dna-awakening-potential.jpg",
  crystalA: "rgba(120,220,255,0.55)",
  crystalB: "rgba(200,170,255,0.5)",
};

export const innerEarthImaginedJourneyMeta: GuideMeta = {
  slug: "inner-earth-imagined-journey",
  title: "Inner Earth — An Imagined Journey",
  subtitle: "The elder nations beneath the crust, met in the vision body",
  tagline: "The deep is real; the road down runs through attention, and it does not close behind you.",
  image: "/guides/inner-earth-imagined-journey.jpg",
  crystalA: "rgba(120,255,214,0.5)",
  crystalB: "rgba(150,180,255,0.5)",
};

export const spiritGuidesRealmTransitionsMeta: GuideMeta = {
  slug: "spirit-guides-realm-transitions",
  title: "Spirit Guides & Life's Transitions",
  subtitle: "The truth of your unseen companions",
  tagline: "You are accompanied — you have been from before the first breath.",
  image: "/guides/spirit-guides-realm-transitions-p01.jpg",
  crystalA: "rgba(196,181,253,0.5)",
  crystalB: "rgba(153,246,228,0.42)",
};

export const lyransAtlantisJourneyMeta: GuideMeta = {
  slug: "lyrans-atlantis-journey",
  title: "Lyrans & Atlantis",
  subtitle: "A journey through the true record",
  tagline: "The star and the sea met once, and their meeting is your inheritance.",
  image: "/guides/lyrans-atlantis-journey-p01.jpg",
  crystalA: "rgba(250,220,150,0.5)",
  crystalB: "rgba(134,239,226,0.42)",
};

export const gaiaTerraLivingWorldMeta: GuideMeta = {
  slug: "gaia-terra-living-world",
  title: "Gaia / Terra, Our Living World",
  subtitle: "The truth of the sentient Earth",
  tagline: "You live inside a being; she has been holding you all along.",
  image: "/guides/gaia-terra-living-world-p01.jpg",
  crystalA: "rgba(134,239,172,0.46)",
  crystalB: "rgba(125,211,252,0.44)",
};

/** The same shelf order index.ts keeps — the plates in a row. */
export const GUIDE_METAS: GuideMeta[] = [
  theAwakeningWithinMeta,
  integrationBeyondSeparationMeta,
  openContactMeta,
  shiftingTimeExperienceMeta,
  chakrasBodyEnergyDnaMeta,
  dnaAwakeningPotentialMeta,
  innerEarthImaginedJourneyMeta,
  spiritGuidesRealmTransitionsMeta,
  lyransAtlantisJourneyMeta,
  gaiaTerraLivingWorldMeta,
];
