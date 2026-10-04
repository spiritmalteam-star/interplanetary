/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — Universal Visualization Engine                     */
/*  Shared types + natural-language visual intent detection.           */
/*  Safe on client and server: no imports, no I/O.                     */
/* ------------------------------------------------------------------ */

export type VisualizationMode =
  | "illustration" /* A — cinematic illustration            */
  | "encyclopedia" /* B — visual encyclopedia page           */
  | "diagram" /* C — organizational diagram              */
  | "science" /* D — scientific visualization            */
  | "map" /* E — interplanetary map                  */
  | "presentation"; /* F — visual presentation / slide deck */

export const VISUALIZATION_MODES: VisualizationMode[] = [
  "illustration",
  "encyclopedia",
  "diagram",
  "science",
  "map",
  "presentation",
];

export function isVisualizationMode(v: unknown): v is VisualizationMode {
  return (
    typeof v === "string" &&
    VISUALIZATION_MODES.includes(v as VisualizationMode)
  );
}

export interface VisualizationPanel {
  heading: string;
  body: string;
}

export interface VisualizationNode {
  id: string;
  label: string;
  /** normalized 0–100 coordinates inside the artwork */
  x: number;
  y: number;
}

export interface VisualizationAnnotation {
  /** normalized 0–100 coordinates inside the artwork */
  x: number;
  y: number;
  label: string;
}

export interface VisualizationSlide {
  title: string;
  body: string;
  /** per-slide cinematic artwork — null when the painter failed for it */
  imageUrl: string | null;
  downloadUrl: string | null;
}

export interface VisualizationArtifact {
  id: string;
  mode: VisualizationMode;
  /** resolved subject (English, canonical) — feeds follow-up context */
  subject: string;
  title: string;
  subtitle: string;
  /** one short line in the Mirror's own voice, opening the card */
  whisper: string;
  /** short contextual explanation beneath the artwork */
  explanation: string;
  /** speculative-vs-documented discernment line (visitor language) */
  discernment: string;
  imageUrl: string | null;
  downloadUrl: string | null;
  /** the composed English artwork prompt — shown as fallback, reused on regenerate */
  prompt: string;
  panels: VisualizationPanel[];
  diagram: {
    nodes: VisualizationNode[];
    edges: [string, string][];
  } | null;
  annotations: VisualizationAnnotation[];
  slides: VisualizationSlide[];
  /** why the brushes rested — the last words of each painter that failed */
  paintErrors?: string[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Natural-language visual intent detection                           */
/*  A quiet gate: ordinary words never wake the atelier.               */
/* ------------------------------------------------------------------ */

const DIRECT_PATTERNS: RegExp[] = [
  /\b(show|shown?)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|visuali[sz]ation|diagram|map|render|visual|video)\b/i,
  /\b(visuali[sz]e|visualise|illustrate|draw|sketch|paint|render|depict|portray)\b/i,
  /\b(generate|create|make|produce|give)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|visual|diagram|map|infographic|artwork|render)\b/i,
  /\bdiagram\s+of\b/i,
  /\bmap\s+of\b/i,
  /\binfographic\b/i,
  /\bencyclopedia\s+(page|entry)\b/i,
  /\b(presentation|slide\s?deck|slides|ppt|powerpoint)\b/i,
  /\bwhat\s+(does|would|might)\s+.*\s+(look|appear)\s+like\b/i,
  /\bhow\s+.*\s+(works?|looks?).*\s+(visually|as\s+a\s+diagram|in\s+a\s+picture)\b/i,
  /\bshow\s+(me\s+)?(the\s+|an?\s+|their\s+|its\s+|his\s+|her\s+|your\s+)?(\w+\s+){0,2}(interior|inside|outside|exterior|city|cities|architecture|planet|planets|galaxy|civilization|structures?|layout|homeworld|temple|temples?|council|kingdom|realm|landscape|world|worlds|home|skin|face|form|appearance)\b/i,
  /\b scientifically\b.*\b(diagram|visuali[sz])/i,
  /\b(picture|image)\s+of\s+(this|that|it|them|the)\b/i,
];

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /\bmore\s+detailed\b/i,
  /\banother\s+(perspective|angle|view|viewpoint)\b/i,
  /\bdifferent\s+(perspective|angle|view|viewpoint)\b/i,
  /\bshow\s+(the\s+)?(interior|inside|outside|exterior|details?|rest|top|bottom|underside|surface)\b/i,
  /\bexplain\s+it\s+visually\b/i,
  /\bturn\s+(this|that|it)\s+into\s+(a\s+)?(diagram|map|presentation|infographic|slides?)\b/i,
  /\bmake\s+(it|this|that)\s+(a\s+)?(ppt|presentation|slide\s?deck|diagram|map)\b/i,
  /\bnow\s+(explain|show|draw|illustrate|visuali[sz]e)\b/i,
  /\bzoom\s+(in|out)\b/i,
  /\bshow\s+(it|this|that|them|him|her)\s+(to\s+me\s+)?(visually|as\s+an?\s+(image|illustration|diagram))\b/i,
  /\bnow\s+(as\s+)?(a\s+)?(diagram|map|presentation|slides?)\b/i,
];

export interface VisualIntent {
  /** an explicit visual request — wake the atelier */
  direct: boolean;
  /** a follow-up that only counts when a visualization already exists */
  followUp: boolean;
}

export function detectVisualIntent(text: string): VisualIntent {
  const v = text.trim();
  if (!v || v.length < 3) return { direct: false, followUp: false };
  const direct = DIRECT_PATTERNS.some((re) => re.test(v));
  const followUp = FOLLOW_UP_PATTERNS.some((re) => re.test(v));
  return { direct, followUp };
}
