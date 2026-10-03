/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the Generative Side-Activity Engine                */
/*  Detects, from one chat message, when a side activity should be     */
/*  brought INTO the channel as a living artifact: the Akashic letter, */
/*  the Star Play draw, the Manifesting ritual or the Forge strike.    */
/*  Safe on client and server: no imports, no I/O.                     */
/* ------------------------------------------------------------------ */

export type SideArtifactKind =
  | "akashic"
  | "star"
  | "manifest"
  | "forge"
  | "book";

export interface SideArtifactRef {
  kind: SideArtifactKind;
  /** The words the visitor set down — the artifact's own resonance. */
  resonance: string;
}

/* The Akashic door — records, past lives, the Library itself. */
const AKASHIC_PATTERNS: RegExp[] = [
  /\bakash?ic\b/i,
  /\bpast\s+life\b/i,
  /\brecords?\s+of\s+(my|the\s+visitor|this\s+soul)\b/i,
  /\bmy\s+(records?|past)\b/i,
  /\b(open|visit|enter|draw\s+from)\s+(the\s+)?(library|hall\s+of\s+records?|akash)/i,
  /\breading\s+from\s+the\s+(records?|hall|library)\b/i,
];

/* The Star Play door — cards, spreads, the arcana deck. */
const STAR_PATTERNS: RegExp[] = [
  /\bstar\s*play\b/i,
  /\btarot\b/i,
  /\barcana\b/i,
  /\boracle\b/i,
  /\b(draw|pull|pick|turn|flip|deal)\b[^.?!]{0,24}\b(cards?|spread|deck)\b/i,
  /\bcard\s+(spread|draw|reading)\b/i,
  /\bthree\s+cards\b/i,
  /\bshuffle\b/i,
  /\bask\s+the\s+deck\b/i,
];

/* The Manifesting door — intentions to charge into blueprints. */
const MANIFEST_PATTERNS: RegExp[] = [
  /\bmanifest(ation|ing)?\b/i,
  /\b(help\s+me\s+)?(attract|call\s+in)\b/i,
  /\b(set|charge|make|hold)\s+an?\s+intention\b/i,
  /\bmy\s+intention\b/i,
  /\bsigil\b/i,
  /\bi\s+(want|wish|choose|would\s+like)\s+to\s+(manifest|attract)\b/i,
  /\bmanifest\s+(a|an|the|my|more|calm|love|wealth|health|peace|joy|abundance)\b/i,
];

/* The Forge door — mysteries struck from the coals. */
const FORGE_PATTERNS: RegExp[] = [
  /\bforge\b/i,
  /\binvent\b/i,
  /\bmystery\s+(creation|card|device|me|something|object)\b/i,
  /\bbuild\s+(me|us)\b/i,
  /\bdesign\s+(me\s+)?(a|an|something)\b/i,
  /\bstrike\b[^.?!]{0,16}\bforge\b/i,
  /\bsomething\s+(strange|wonderful|new|playful)\b[^.?!]{0,24}\b(make|build|create|invent)\b/i,
];

/* The Book door — a volume woven right inside the conversation:
   the mirror asks about the book, then the loom binds it in chat. */
const BOOK_PATTERNS: RegExp[] = [
  /\b(make|create|craft|write|weave|manifest|compose|start|begin|open)\b[^.?!]{0,32}\b(a|an|the|my|us|me)\s+(book|storybook|storybook|volume|tale|story)\b/i,
  /\b(book|storybook|volume)\b[^.?!]{0,32}\b(about|of|on|for)\b/i,
  /\bwrite\s+(me|us)\s+(a|an)?\s*(book|story|tale|novel)\b/i,
  /\b(make|create|craft|write|weave|compose)\b[^.?!]{0,24}\b(poem|poetry|riddle|riddles|ballad|lullaby)\s+(book|volume|collection)\b/i,
  /\b(cozy|little|whole|entire|full|new|another)\s+book\b/i,
];

/**
 * One pass, most specific doors first. Returns the artifact kind that
 * should ride along with the mirror's reply — or null for ordinary
 * words that need nothing but an answer.
 */
export function detectArtifactIntent(text: string): SideArtifactKind | null {
  const v = text.trim();
  if (v.length < 3) return null;
  if (BOOK_PATTERNS.some((re) => re.test(v))) return "book";
  if (AKASHIC_PATTERNS.some((re) => re.test(v))) return "akashic";
  if (STAR_PATTERNS.some((re) => re.test(v))) return "star";
  if (MANIFEST_PATTERNS.some((re) => re.test(v))) return "manifest";
  if (FORGE_PATTERNS.some((re) => re.test(v))) return "forge";
  return null;
}
