/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — shared types & archive data            */
/* ------------------------------------------------------------------ */

export type Mode = "interplanetary" | "science" | "quantum" | "healing";
export type SidebarTab = "civilizations" | "interdim";

/** A scope determines the visual theme of the chat/transmission frame. */
export type Scope = Mode | "manifesting";

export type DossierKind = "civilization" | "interdim";

/** Individual named representative inside a group. */
export interface EntityDossier {
  id: string;
  groupId: string;
  name: string;
  origin: string;
  density: string;
  specialty: string;
  signal: string;
}

export interface DossierEntry {
  id: string;
  name: string;
  count: number;
  origin: string;
  range: string;
  essence: string;
  role: string;
  signal: string;
  /** Named individuals belonging to this group. */
  representatives: EntityDossier[];
}

export interface CivilizationGroup extends DossierEntry {
  category: "civilization";
}

export interface InterdimGroup extends DossierEntry {
  category: "interdim";
}

export interface Profession {
  name: string;
  blurb: string;
  detail: string;
  /** Approximate open seats across federated fleets (flavor). */
  openings?: number;
}

export interface ProfessionDomain {
  id: string;
  title: string;
  icon: string; // lucide icon key, resolved in component
  description: string;
  count: number;
  professions: Profession[];
}

export interface FederationCard {
  name: string;
  badge: string;
  label: string;
  description: string;
  footer: string;
  /** Bespoke AI emblem image key under /images/ai. */
  imageKey?: string;
}

export interface SciencePill {
  id: string;
  emoji: string;
  label: string;
}

export interface ModePill {
  id: Mode;
  emoji: string;
  label: string;
}

export type Classification =
  | "DOCUMENTED_SCIENCE"
  | "SPECULATIVE_THEORY"
  | "SPIRITUAL_TRADITION"
  | "WORLD_BUILDING"
  | "SYMBOLIC_INTERPRETATION";

export interface TransmissionPayload {
  transmission: string;
  classification: Classification | string;
  createdAt: string;
}

/* ---------------- Reality Manifesting Lab ---------------- */

export type LabStage = "compose" | "charging" | "blueprint";

export interface ManifestBlueprint {
  title: string;
  /** The energetic state the field recommends anchoring first. */
  field_state: string;
  /** A short guided visualization script (2–3 sentences). */
  visualization: string;
  /** Three small physical-world actions that give the intention hands. */
  micro_actions: string[];
  affirmation: string;
  /** A gentle "aligned window" — when to revisit the intention. */
  window: string;
  /** Honest epistemic / emotional-safety note. */
  caution: string;
}

export interface LabFrequency {
  id: string;
  label: string;
  glyph: string;
  hint: string;
}
