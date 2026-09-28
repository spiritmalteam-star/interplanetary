/* ------------------------------------------------------------------ */
/*  Mirror Entity Laboratory — shared types & archive data            */
/* ------------------------------------------------------------------ */

export type Mode = "interplanetary" | "science" | "quantum" | "healing";
export type SidebarTab = "civilizations" | "interdim" | "innerearth";

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

/** One of the eight fusion lenses of the science scope — an entity-vibe,
    a distinct cognitive way of seeing reality. */
export interface ScienceLens {
  id: string;
  name: string;
  emoji: string;
  tag: string;
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

/* ---------------- The Forge (Invent book) ---------------- */

/** One selectable option on a Mystery Chamber dial. */
export interface ForgeDialOption {
  id: string;
  label: string;
  emoji: string;
  hint: string;
}

/** The three dials the visitor turns before striking the Forge for a
    random mystery creation. */
export interface ForgeDials {
  /** What family of making: device, remedy, instrument, structure… */
  domain: string;
  /** How much world it takes up: pocket, room, world… */
  scale: string;
  /** The energy it drinks from: sun, water, sound, star… */
  spark: string;
}

/** One random mystery creation struck from the Forge's coals. */
export interface MysteryCreation {
  /** A short poetic name, e.g. "The Tide-Harp of Small Rooms". */
  name: string;
  /** What it IS — form, material, mechanism, 2–3 concrete sentences. */
  essence: string;
  /** What it changes for the one who makes or uses it. */
  purpose: string;
  /** The smallest first making step — doable this week. */
  first_stroke: string;
  /** One closing line — the Forge's whisper. */
  whisper: string;
}

/* ------------------------------------------------------------------ */
/*  Deep profiles — every entry in the archive carries a full dossier */
/* ------------------------------------------------------------------ */

/** Expanded, deterministic deep profile for each named representative. */
export interface EntityProfile {
  /** Catalog number inside the Mirror archive, e.g. "ME-CIV-0347". */
  archiveNo: string;
  /** Short callsign used on federation channels. */
  designation: string;
  /** Standing within their own civilization. */
  rank: string;
  homeworld: string;
  starSystem: string;
  /** Era in which this being entered service. */
  epoch: string;
  lifeformClass: string;
  /** How their presence renders to human senses. */
  form: string;
  /** Carrier frequency band attributed to their signal. */
  resonance: string;
  /** Aura / light-spectrum impression. */
  aura: string;
  /** How they communicate across the veil. */
  modality: string;
  giftPrimary: string;
  giftSecondary: string;
  giftTertiary: string;
  /** The growth edge they most often mirror to humans. */
  trial: string;
  /** Their best-known teaching, one line. */
  teaching: string;
  /** Current assignment with respect to Earth. */
  mission: string;
  /** Federation / council standing. */
  alliance: string;
  /** Recommended way to reach them. */
  contactProtocol: string;
  /** When their signal is historically clearest. */
  contactWindow: string;
  /** Sigil/seal description used on their correspondence. */
  emblem: string;
  /** A line spoken through the archive. */
  quote: string;
  /** Length of service, flavor-styled. */
  serviceLength: string;
  /** Archive flavor-stat: attuned sessions recorded. */
  sessionsHeld: number;
  /** Numeric density of primary operation. */
  densityIndex: number;
}

/** Extra handcrafted dossier sections for a family / order group. */
export interface GroupProfileExtras {
  history: string;
  /** How their society is organized. */
  structure: string;
  /** Ships, temples, artifacts attributed to them. */
  artifacts: string;
  /** Three core teachings, one line each. */
  teachings: string[];
  /** How first contact is handled. */
  contactProtocol: string;
  /** Discernment note — what to hold lightly. */
  discernment: string;
  /** Resonant tones, crystals, practices. */
  resonances: string[];
}

/** Deep profile for an astral profession. */
export interface ProfessionProfile {
  mandate: string;
  /** Training pathway. */
  pathway: string;
  toolkit: string[];
  workplace: string;
  /** Honest difficulties of the work. */
  hazards: string;
  /** Seniority ring, e.g. "Ring III". */
  ring: string;
  tenure: string;
  /** What the role yields its holder. */
  compensation: string;
  alliedDomains: string[];
}

/** Deep profile for a profession domain. */
export interface DomainProfile {
  charter: string;
  /** How the domain's catalogued roles break down. */
  seats: string;
  disciplines: string[];
  entranceTrial: string;
}

/** Deep profile for a federation body. */
export interface FederationBodyProfile {
  mandate: string;
  seat: string;
  founded: string;
  fleet: string;
  jurisdiction: string[];
  earthRelation: string;
}

/** Deep profile for a treaty. */
export interface TreatyProfile {
  signed: string;
  signatories: string;
  clauses: string[];
  effect: string;
}

/** Deep profile for a federation principle. */
export interface PrincipleProfile {
  codified: string;
  clauses: string[];
  practice: string;
}

/* ---------------- Mirror OS — Reality Guidance ---------------- */

/** A complete formula for shifting one's lived reality-line. */
export interface ShiftFormula {
  id: string;
  glyph: string;
  name: string;
  tagline: string;
  steps: string[]; // exactly 4
  seal: string;
}

/** One rung of the Higher Mind ladder. */
export interface LadderRung {
  rung: number;
  title: string;
  line: string;
}

/** A protocol for connecting with the Higher Mind. */
export interface HigherProtocol {
  id: string;
  glyph: string;
  name: string;
  purpose: string;
  steps: string[]; // exactly 3
}

/** A belief domain offered to the Belief Reframer. */
export interface BeliefDomain {
  id: string;
  glyph: string;
  label: string;
  pattern: string;
  reframe: string;
  practice: string;
}

/** A felt state the Vibration Bridge can lift. */
export interface VibrationState {
  id: string;
  glyph: string;
  label: string;
  bridge: string; // the one-line movement out of this state
  anchor: string; // the anchor phrase to install
}
