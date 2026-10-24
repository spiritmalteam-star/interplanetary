"use client";

/* ------------------------------------------------------------------ */
/*  THE VISUAL INTELLIGENCE SDK — the registry of living scenes.       */
/*                                                                     */
/*  Selected parts of a transmission may be accompanied by a small     */
/*  interactive scene: waves for the quantum, helixes for the living,  */
/*  orbits for the cosmos, pyramids for the ancient, lattices for the  */
/*  patterns of mind. The scenes are TEMPLATES — a small registry of   */
/*  parameterized drawings, never generated code, never executed       */
/*  prompts. The Mirror Entity's words are never changed; the scene    */
/*  only stands beside them.                                           */
/*                                                                     */
/*  The classifier is a quiet local reader (a handful of keywords):    */
/*  it costs nothing, runs instantly, and calls nothing.               */
/* ------------------------------------------------------------------ */

export type SceneId =
  | "spiral"
  | "wavefield"
  | "helix"
  | "orbits"
  | "pyramids"
  | "neural"
  | "lattice"
  | "blueprint"
  | "curves";

export interface ScenePick {
  scene: SceneId;
  /** The scene's own quiet name (i18n source string). */
  label: string;
  accent: string;
}

interface SceneTemplate {
  id: SceneId;
  label: string;
  keywords: RegExp;
  supports3D: boolean;
}

/* THE REGISTRY — one row per scene. The order is the classifier's
   preference: the first matching template wins. */
const REGISTRY: SceneTemplate[] = [
  {
    id: "helix",
    label: "The living spiral",
    keywords: /dna|gene|genetic|cell|biolog|molecul|protein|helix|organism|enzyme|chromosom|evolution|body|healing|breath|heartblood/i,
    supports3D: true,
  },
  {
    id: "wavefield",
    label: "The field of waves",
    keywords: /quantum|wave|particle|photon|probabilit|frequency|oscillat|vibrat|resonan|superposition|entangle|field|energy|sound|music/i,
    supports3D: true,
  },
  {
    id: "orbits",
    label: "The turning skies",
    keywords: /planet|orbit|cosmic|cosmos|galaxy|astronom|universe|nebula|gravity|star|stars|moon|solar|constellation|interstell|space/i,
    supports3D: true,
  },
  {
    id: "pyramids",
    label: "The ancient stones",
    keywords: /egypt|pyramid|temple|ancient|nile|pharaoh|monument|civilization|ruins|obsidian| stone|stones|carved/i,
    supports3D: true,
  },
  {
    id: "neural",
    label: "The whispered web",
    keywords: /neural|network|synapse|neuron|mind|conscious|aware|thought|memory|dream|psyche|soul|signal|attention|language|meaning/i,
    supports3D: true,
  },
  {
    id: "lattice",
    label: "The crystalline law",
    keywords: /crystal|lattice|geometry|geometric|pattern|sacred|matrix|dimension|structure|symmetry|fractal|harmonic|grid/i,
    supports3D: true,
  },
  {
    id: "blueprint",
    label: "The working drawing",
    keywords: /circuit|machine|engineer|mechanism|architecture|device|tool|invention|build|craft|design|system|interface/i,
    supports3D: false,
  },
  {
    id: "curves",
    label: "The quiet mathematics",
    keywords: /mathematic|curve|equation|graph|function|number|calculus|algebra|proof|logic|ratio|measure/i,
    supports3D: false,
  },
];

/** The house's own mark — a golden spiral that fits every word. */
const FALLBACK: SceneTemplate = {
  id: "spiral",
  label: "The golden spiral",
  keywords: /.^/, // never matches; the fallback is chosen by hand
  supports3D: true,
};

export function pickScene(text: string, accent = "#f59e0b"): ScenePick {
  const t = (text ?? "").slice(0, 4000);
  for (const tpl of REGISTRY) {
    if (tpl.keywords.test(t)) {
      return { scene: tpl.id, label: tpl.label, accent };
    }
  }
  return { scene: FALLBACK.id, label: FALLBACK.label, accent };
}

export function sceneSupports3D(id: SceneId): boolean {
  if (id === FALLBACK.id) return FALLBACK.supports3D;
  return REGISTRY.find((r) => r.id === id)?.supports3D ?? false;
}

export const SCENE_LABELS: Record<SceneId, string> = Object.fromEntries(
  [...REGISTRY, FALLBACK].map((r) => [r.id, r.label])
) as Record<SceneId, string>;
