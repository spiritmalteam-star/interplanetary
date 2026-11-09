import type { FormFactor } from "@/lib/adaptive/device";

/* ------------------------------------------------------------------ */
/*  THE SPATIAL MODEL — device-independent component descriptors.      */
/*                                                                     */
/*  A spatial component describes: its purpose, its content, its       */
/*  available actions, its relationships, its interaction needs and    */
/*  its presentation constraints. THE RENDERING ENVIRONMENT decides    */
/*  how it appears — the same descriptor serves mobile, desktop,       */
/*  tablet and the immersive room. No business logic lives here.       */
/* ------------------------------------------------------------------ */

export type SpatialPresentation =
  | "floating-compact"
  | "persistent-panel"
  | "contextual-workspace"
  | "spatial-presence";

export interface SpatialDescriptor {
  id: string;
  purpose: string;
  content: string;
  actions: string[];
  relatesTo: string[];
  interaction: "touch" | "pointer" | "gaze" | "voice";
  constraints: {
    minPx: number;
    maxPx: number;
    /** depth layer in the immersive arrangement (0 = the visitor) */
    depth: number;
  };
  presentation: Record<FormFactor | "spatial", SpatialPresentation>;
}

export const SPATIAL_COMPONENTS: SpatialDescriptor[] = [
  {
    id: "mirror.presence",
    purpose: "The Mirror Intelligence's presence — the one intelligence beside the visitor",
    content: "the live transmission thread and its whisper line",
    actions: ["ask", "listen", "publish", "recall"],
    relatesTo: ["gathering.hall", "rooms.creative"],
    interaction: "touch",
    constraints: { minPx: 280, maxPx: 720, depth: 1 },
    presentation: {
      mobile: "floating-compact",
      desktop: "persistent-panel",
      tablet: "contextual-workspace",
      spatial: "spatial-presence",
    },
  },
  {
    id: "gathering.hall",
    purpose: "The collective hall — discovery, people, circles, projects, knowledge",
    content: "the six destinations and their cards",
    actions: ["search", "follow", "join", "resonate", "answer"],
    relatesTo: ["mirror.presence"],
    interaction: "touch",
    constraints: { minPx: 320, maxPx: 680, depth: 2 },
    presentation: {
      mobile: "floating-compact",
      desktop: "persistent-panel",
      tablet: "contextual-workspace",
      spatial: "spatial-presence",
    },
  },
  {
    id: "rooms.creative",
    purpose: "The creative rooms — akashic, book, artx, forge, codes and their kin",
    content: "the room's own making surface",
    actions: ["create", "publish"],
    relatesTo: ["mirror.presence", "gathering.hall"],
    interaction: "touch",
    constraints: { minPx: 320, maxPx: 760, depth: 2 },
    presentation: {
      mobile: "floating-compact",
      desktop: "persistent-panel",
      tablet: "contextual-workspace",
      spatial: "spatial-presence",
    },
  },
];

export function descriptorFor(id: string): SpatialDescriptor | undefined {
  return SPATIAL_COMPONENTS.find((c) => c.id === id);
}

/** The presentation the current form owes this component. */
export function presentationFor(
  descriptor: SpatialDescriptor,
  form: FormFactor | "spatial"
): SpatialPresentation {
  return descriptor.presentation[form] ?? "persistent-panel";
}
