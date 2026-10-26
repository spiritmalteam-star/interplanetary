"use client";

/* ------------------------------------------------------------------ */
/*  THE LIVING BOOK'S OWN REGISTRY — one typed shelf that names every  */
/*  page of the book: what it is, what it can truly do, how heavy it   */
/*  rides, and how its code arrives (always lazy — a page's code only  */
/*  travels when its page is first opened, never with the cover).      */
/*                                                                     */
/*  THE COVER AND THE PAGES: the one chat is the book's cover; every   */
/*  workspace here is a page that fills the same living frame. The     */
/*  frame's chrome wears the visitor's chosen scope light (--scope-a); */
/*  each page brings its own instrument layout, its own capabilities   */
/*  and its own resource profile — the registry is the honest list,    */
/*  so nothing is advertised that the page cannot actually do.         */
/*                                                                     */
/*  THE FIELDS' OWN LIGHT — SCOPE_META is the one source of the five   */
/*  fields' truth (label, spirit, accent, dot, voice, library shelf):  */
/*  the crown, the gate, the canopy and the library all read here,     */
/*  so the house's colors can never fall out of tune again.            */
/* ------------------------------------------------------------------ */

import type { ComponentType } from "react";
import {
  Atom,
  BookOpen,
  Clapperboard,
  Hammer,
  Library,
  Music,
  NotebookPen,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { LandingScopeKey, ToolTabKey } from "@/lib/mirror-store";

/* THE RESOURCE PROFILE — how heavily a page rides the device. The
   lifecycle manager reads it to know which pages must lay their
   renderers down when the visitor turns to another page. */
export type WorkspaceResourceProfile = "low" | "medium" | "high";

/* THE SHELF'S CATEGORIES — honest kinds, not marketing names. */
export type WorkspaceCategory =
  | "conversation"
  | "studio"
  | "knowledge"
  | "laboratory"
  | "journal"
  | "atlas"
  | "library";

/* THE WORKSPACE CONTRACT — every page of the book declares itself. */
export type WorkspaceDefinition = {
  id: ToolTabKey;
  /** the tab's own name (an i18n key — English is the key) */
  title: string;
  category: WorkspaceCategory;
  icon: LucideIcon;
  /** the page wears the house's standing scope light through the
      --scope-a variable; the registry names it so pages never invent
      a second truth about the frame's color */
  theme: { accent: string };
  /** the lazy loader — the page's code only travels on first open */
  loader: () => Promise<{ default: ComponentType }>;
  /** what the page can actually do (honest capability names) */
  capabilities: string[];
  /** whether durable state rides in the store across page turns */
  preserveState: boolean;
  resourceProfile: WorkspaceResourceProfile;
  /** THE MIRROR BRIDGE — the transmission voice this page's compact
      assistant speaks with (the mode /api/transmission answers in) */
  bridgeMode: string;
};

/* ------------------------------------------------------------------ */
/*  THE NINE PAGES — the house's own instruments. The Quantum          */
/*  Laboratory joins the eight standing rooms: a genuine local         */
/*  simulator (its gates run in pure arithmetic on the device, no      */
/*  laboratory server needed), opened from Create or from the          */
/*  Quantum field's own hand.                                          */
/* ------------------------------------------------------------------ */

export const WORKSPACE_ORDER: ToolTabKey[] = [
  "dreambook",
  "lightcodes",
  "akashic",
  "mirroros",
  "invent",
  "qlab",
  "video",
  "register",
  "library",
];

export const WORKSPACES: Record<ToolTabKey, WorkspaceDefinition> = {
  dreambook: {
    id: "dreambook",
    title: "Book",
    category: "journal",
    icon: BookOpen,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/DreamBookView").then((m) => ({
        default: m.DreamBookView as ComponentType,
      })),
    capabilities: ["book-weaving", "reading-room", "narration", "export", "library-shelf"],
    preserveState: true,
    resourceProfile: "medium",
    bridgeMode: "mirror",
  },
  lightcodes: {
    id: "lightcodes",
    title: "Music",
    category: "studio",
    icon: Music,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/LightCodesView").then((m) => ({
        default: m.LightCodesView as ComponentType,
      })),
    capabilities: ["sound-transmissions", "sequencer", "local-synthesis", "pattern-save"],
    preserveState: true,
    resourceProfile: "medium",
    bridgeMode: "mirror",
  },
  akashic: {
    id: "akashic",
    title: "Akashic",
    category: "knowledge",
    icon: ScrollText,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/AkashicView").then((m) => ({
        default: m.AkashicView as ComponentType,
      })),
    capabilities: ["record-reading", "narration", "record-visualization"],
    preserveState: false,
    resourceProfile: "low",
    bridgeMode: "absolute",
  },
  mirroros: {
    id: "mirroros",
    title: "Manifest",
    category: "conversation",
    icon: Sparkles,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/MirrorOS").then((m) => ({
        default: m.MirrorOS as ComponentType,
      })),
    capabilities: ["reality-refinement", "formulas", "intentions"],
    preserveState: true,
    resourceProfile: "low",
    bridgeMode: "manifesting",
  },
  invent: {
    id: "invent",
    title: "Invent",
    category: "studio",
    icon: Hammer,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/InventView").then((m) => ({
        default: m.InventView as ComponentType,
      })),
    capabilities: ["mystery-forging", "tool-benches", "crystallization"],
    preserveState: true,
    resourceProfile: "medium",
    bridgeMode: "forge",
  },
  qlab: {
    id: "qlab",
    title: "Quantum Lab",
    category: "laboratory",
    icon: Atom,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/QuantumLabView").then((m) => ({
        default: m.QuantumLabView as ComponentType,
      })),
    capabilities: ["circuit-builder", "state-simulation", "measurement", "experiment-save"],
    preserveState: true,
    resourceProfile: "low",
    bridgeMode: "quantum",
  },
  video: {
    id: "video",
    title: "Video",
    category: "studio",
    icon: Clapperboard,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/VideoStudioView").then((m) => ({
        default: m.VideoStudioView as ComponentType,
      })),
    capabilities: ["storyboard", "on-device-film-assembly"],
    preserveState: false,
    resourceProfile: "high",
    bridgeMode: "mirror",
  },
  register: {
    id: "register",
    title: "Register",
    category: "atlas",
    icon: NotebookPen,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/ArchiveRegister").then((m) => ({
        default: m.ArchiveRegister as ComponentType,
      })),
    capabilities: ["civilization-registers", "species-catalog", "offline-records"],
    preserveState: false,
    resourceProfile: "low",
    bridgeMode: "interplanetary",
  },
  library: {
    id: "library",
    title: "Library",
    category: "library",
    icon: Library,
    theme: { accent: "var(--scope-a, var(--gd))" },
    loader: () =>
      import("@/components/mirror/LibraryView").then((m) => ({
        default: m.LibraryView as ComponentType,
      })),
    capabilities: ["creations-room", "sector-filtering", "in-place-reader"],
    preserveState: true,
    resourceProfile: "low",
    bridgeMode: "mirror",
  },
};

/* ------------------------------------------------------------------ */
/*  THE FIVE FIELDS — one truth for the whole house: the Mirror's      */
/*  standing gold first, then the four families. The gate rides the    */
/*  accent as --scope-a (the whole chat wears it), the canopy rides    */
/*  the dot, the voice and the library shelf, the crown rides the      */
/*  label and the spirit.                                              */
/* ------------------------------------------------------------------ */

/** the standing field's own voice through /api/transmission (the
    canopy's floor asks and the bridge's advice both resolve here) */
export type ScopeVoiceCategory =
  | "absolute"
  | "interplanetary"
  | "quantum"
  | "healing"
  | "artx";

export type ScopeMeta = {
  label: string;
  spirit: string;
  accent: string;
  dot: string;
  voice: ScopeVoiceCategory;
  /** the profile library's shelf this field keeps its volume on */
  librarySector: string;
};

export const SCOPE_META: Record<LandingScopeKey, ScopeMeta> = {
  mirror: {
    label: "The Mirror",
    spirit: "The house's own reflection",
    accent: "#d8b571",
    dot: "#d8b571",
    voice: "absolute",
    librarySector: "observatory",
  },
  interplanetary: {
    label: "Interplanetary",
    spirit: "The star families and worlds",
    accent: "#22d3ee",
    dot: "#22d3ee",
    voice: "interplanetary",
    librarySector: "observatory",
  },
  quantum: {
    label: "Quantum",
    spirit: "The deep nature of reality",
    accent: "#a78bfa",
    dot: "#a78bfa",
    voice: "quantum",
    librarySector: "quantum",
  },
  artx: {
    label: "ArtX",
    spirit: "The atelier of visions",
    accent: "#e879f9",
    dot: "#e879f9",
    voice: "artx",
    librarySector: "artx",
  },
  healing: {
    label: "HealX",
    spirit: "The body's quiet evolution",
    accent: "#2dd4bf",
    dot: "#2dd4bf",
    voice: "healing",
    librarySector: "evolvemed",
  },
};

/** the crown's fields, in the house's own standing order (the Mirror
    first — it is the default page of the book) */
export const SCOPE_ORDER: LandingScopeKey[] = [
  "mirror",
  "interplanetary",
  "quantum",
  "artx",
  "healing",
];

/** the field → transmission mode line, from one truth */
export const LANDING_SCOPE_CATEGORY: Record<string, ScopeVoiceCategory> =
  Object.fromEntries(
    (Object.keys(SCOPE_META) as LandingScopeKey[]).map((k) => [
      k,
      SCOPE_META[k].voice,
    ])
  );
