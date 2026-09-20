/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — shared types & archive data            */
/* ------------------------------------------------------------------ */

export type Mode = "interplanetary" | "science" | "quantum" | "healing";
export type SidebarTab = "civilizations" | "interdim";

export type DossierKind = "civilization" | "interdim";

export interface DossierEntry {
  id: string;
  name: string;
  count: number;
  origin: string;
  range: string;
  essence: string;
  role: string;
  signal: string;
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
