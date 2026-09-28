/* ------------------------------------------------------------------ */
/*  The Healing Apothecary — shared remedy vocabulary.                 */
/*  Pure data: imported by the store, the RemedyLayer component and    */
/*  the i18n dynamic-key collector.                                    */
/* ------------------------------------------------------------------ */

export type RemedyKind =
  | "herbal"
  | "meditation"
  | "imagination"
  | "breath"
  | "sound"
  | "ritual"
  | "reflection"
  | "movement";

export const REMEDY_KINDS: RemedyKind[] = [
  "herbal",
  "meditation",
  "imagination",
  "breath",
  "sound",
  "ritual",
  "reflection",
  "movement",
];

/** The named phases of the craft, cycling while a remedy forms. */
export const CRAFT_PHASES: string[] = [
  "Weighing the herbs…",
  "Warming the water…",
  "Blending the frequencies…",
  "Sealing the remedy…",
];

/** The label each remedy kind carries in the mini tab. */
export const KIND_LABEL: Record<RemedyKind, string> = {
  herbal: "A herbal ally",
  meditation: "A meditation",
  imagination: "An imagination journey",
  breath: "A breath practice",
  sound: "A sound practice",
  ritual: "A small ritual",
  reflection: "A written reflection",
  movement: "A gentle movement",
};

/** Steps heading — herbal remedies are "Preparation", practices are "The practice". */
export const STEPS_LABEL_HERBAL = "Preparation";
export const STEPS_LABEL_PRACTICE = "The practice";

export const stepsLabelFor = (kind: RemedyKind): string =>
  kind === "herbal" ? STEPS_LABEL_HERBAL : STEPS_LABEL_PRACTICE;
