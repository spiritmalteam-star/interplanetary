/* ------------------------------------------------------------------ */
/*  THE GUIDES' REGISTRY — the seven illustrated guides of the house,  */
/*  each born from its own PDF: one image, one title, one door.        */
/*  The showcase below the offerings reads this shelf; the guide       */
/*  view opens whatever door the visitor's hand chooses.               */
/* ------------------------------------------------------------------ */

import type { GuideData } from "./types";
import awakeningWithin from "./the-awakening-within";
import integrationBeyondSeparation from "./integration-beyond-separation";
import openContact from "./open-contact";
import shiftingTimeExperience from "./shifting-time-experience";
import chakrasBodyEnergyDna from "./chakras-body-energy-dna";
import dnaAwakeningPotential from "./dna-awakening-potential";
import innerEarthImaginedJourney from "./inner-earth-imagined-journey";

export type { GuideBlock, GuideData } from "./types";

export const GUIDES: GuideData[] = [
  awakeningWithin,
  integrationBeyondSeparation,
  openContact,
  shiftingTimeExperience,
  chakrasBodyEnergyDna,
  dnaAwakeningPotential,
  innerEarthImaginedJourney,
];

export function guideBySlug(slug: string): GuideData | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
