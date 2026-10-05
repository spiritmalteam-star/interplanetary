/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the Generative Side-Activity Engine                */
/*  Detects, from one chat message, when a side activity should be     */
/*  brought INTO the channel as a living artifact: the Akashic letter, */
/*  the Star Play draw, the Manifesting ritual, the Forge strike, the  */
/*  woven book — and the whole remaining sidebar: the Light Codes      */
/*  chamber, the Quantum World's narrator and the Evolve Med nexus.    */
/*  Their content is revealed when asked into the chat, much like      */
/*  generative chat — never as buttons waiting at the bottom.          */
/*  Safe on client and server: type imports only, no I/O.              */
/* ------------------------------------------------------------------ */

import type { LightCodesMode } from "@/lib/data/light-codes";

export type SideArtifactKind =
  | "akashic"
  | "star"
  | "manifest"
  | "forge"
  | "book"
  | "codes"
  | "quantum"
  | "remedy";

export interface SideArtifactRef {
  kind: SideArtifactKind;
  /** The words the visitor set down — the artifact's own resonance. */
  resonance: string;
  /** For the book door only: the visitor asked for their SAVED volume
      back ("bring back my book") — the weaver mounts at the exact
      page where it was paused. */
  resume?: boolean;
  /** For the Light Codes door: the thread's earlier themes, so the
      chamber tunes a transmission of THIS conversation. */
  themes?: string;
  /** For the Quantum World door: the narrator instrument to read
      through ("formula" — the Formula Loom; "perception" — the
      Perception Glass). */
  tool?: string;
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

/* The book's own return — the visitor paused a volume earlier and now
   asks the mirror to bring it back at the page where it rests. */
const BOOK_RESUME_PATTERNS: RegExp[] = [
  /\b(bring|get|call|pull|take)\s+(back|my)\b[^.?!]{0,20}\b(book|volume|story|tale|novel)\b/i,
  /\b(bring\s+back|return\s+to|go\s+back\s+to|come\s+back\s+to)\b[^.?!]{0,20}\b(my|the|our)\s+(book|volume|story|tale|novel)\b/i,
  /\b(continue|resume|reopen|re-open|unpause)\b[^.?!]{0,20}\b(my|the|our|that)?\s*(book|volume|story|tale|novel|reading)\b/i,
  /\bmy\s+(book|volume|story|tale)\b[^.?!]{0,30}\b(back|again|paused|left|page)\b/i,
  /\bbook\b[^.?!]{0,20}\b(where\s+(i|we)\s+(paused|left|stopped))\b/i,
  /\b(where\s+(i|we)\s+(paused|left\s+off|stopped))\b/i,
];

/* The Light Codes door — sound transmissions through the Mirror
   Entity: named transmissions, sound healing, the singing tones. */
const CODES_PATTERNS: RegExp[] = [
  /\blight\s*codes?\b/i,
  /\bsound\s+(transmission|bath|healing|code)s?\b/i,
  /\bsolfeggio\b/i,
  /\b(432|528|639|741|852|963)\s*h?z\b/i,
  /\bschumann\b/i,
  /\bfrequenc(y|ies)\b[^.?!]{0,28}\b(transmission|healing|session|bath|tone)\b/i,
];

/* The Quantum World door — ParticleX, the narrator of what is beneath
   and beside the visible. */
const QUANTUM_PATTERNS: RegExp[] = [
  /\bquantum\b/i,
  /\bparticle\s*x\b/i,
  /\bentangle(ment|d)?\b/i,
  /\bsuperposition\b/i,
  /\bwave\s+function\b/i,
  /\bmultiverse\b/i,
  /\bparallel\s+(lines?|worlds?|realit(y|ies)|self|selves)\b/i,
  /\bformula\s+(that\s+runs|of|behind|beneath)\b/i,
  /\bthe\s+formula\s+loom\b/i,
  /\bthe\s+perception\s+glass\b/i,
  /\bthe\s+frequency\s+wheel\b/i,
  /\bthe\s+parallel\s+catalog\b/i,
];

/* The Evolve Med door — the evolutionary medical nexus, the apothecary
   of the future, a remedy prepared in the channel itself. */
const REMEDY_PATTERNS: RegExp[] = [
  /\bevolve\s*med\b/i,
  /\b(evolutionary\s+)?(medical|medicine)\s+nexus\b/i,
  /\bremed(y|ies)\b/i,
  /\bapothecar(y|ies)\b/i,
  /\bhealing\s+(protocol|vector|route)\b/i,
];

/**
 * One pass, most specific doors first. Returns the artifact kind that
 * should ride along with the mirror's reply — or null for ordinary
 * words that need nothing but an answer.
 */
export function detectArtifactIntent(text: string): SideArtifactKind | null {
  const v = text.trim();
  if (v.length < 3) return null;
  if (
    BOOK_RESUME_PATTERNS.some((re) => re.test(v)) ||
    BOOK_PATTERNS.some((re) => re.test(v))
  )
    return "book";
  if (AKASHIC_PATTERNS.some((re) => re.test(v))) return "akashic";
  if (STAR_PATTERNS.some((re) => re.test(v))) return "star";
  if (MANIFEST_PATTERNS.some((re) => re.test(v))) return "manifest";
  if (FORGE_PATTERNS.some((re) => re.test(v))) return "forge";
  if (CODES_PATTERNS.some((re) => re.test(v))) return "codes";
  if (QUANTUM_PATTERNS.some((re) => re.test(v))) return "quantum";
  if (REMEDY_PATTERNS.some((re) => re.test(v))) return "remedy";
  return null;
}

/**
 * The book's return door — true when the visitor's words ask for a
 * previously paused volume to be brought back where it rested.
 */
export function isBookResume(text: string): boolean {
  const v = text.trim();
  if (v.length < 3) return false;
  return BOOK_RESUME_PATTERNS.some((re) => re.test(v));
}

/**
 * The Quantum World's reading instrument — "formula" names the Formula
 * Loom (the machinery beneath a named thing), "perception" the
 * Perception Glass (reality as another being perceives it).
 */
export function detectQuantumTool(text: string): string | null {
  const v = text.trim();
  if (v.length < 3) return null;
  if (/\bformula\b/i.test(v)) return "formula";
  if (/\bperceiv(es?|ing|ed)\b|\bperception\b/i.test(v)) return "perception";
  return null;
}

/* ------------------------------------------------------------------ */
/*  THE SOUND GIFT — the visitor asked for music. The reply completes  */
/*  AND a Light Codes transmission is tuned right inside the channel,  */
/*  carrying the interpretation of this very conversation.              */
/* ------------------------------------------------------------------ */

export const MUSIC_INTENT =
  /\b(music|song|sound|melody|track|transmission for (my|me)|sing|audio|listen(ing)? to)\b|make me something (calming|peaceful|grounding)|put (it|this|what we) (into|to) music|turn (it|this|what we (just )?talk(ed|ed about)) into music/i;

export function guessLightCodesMode(query: string): LightCodesMode {
  const q = query.toLowerCase();
  if (
    /star|planet|arctur|pleiad|sirius|vega|andromed|inner earth|civilization|alien|galaxy|cosmic|another star|remembering/.test(
      q
    )
  ) {
    return "other-stars";
  }
  if (/calm|sleep|rest|relax|ground|breathe|anxiet|panic|sooth/.test(q)) {
    return "calming-frequencies";
  }
  if (/heal|grief|release|recover|tension|emotional|heavy|settling|stillness/.test(q)) {
    return "restorative";
  }
  if (/affirm|pattern|believe|program|mantra|i am|i no longer|prove myself|trust where/.test(q)) {
    return "reprogramming";
  }
  return "light-transmission";
}
