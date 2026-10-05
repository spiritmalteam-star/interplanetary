/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the Generative Side-Activity Engine                */
/*  Detects, from one chat message, when a side activity should be     */
/*  brought INTO the channel as a living artifact: the Akashic letter, */
/*  the Star Play draw, the Manifesting ritual, the Forge strike, the  */
/*  woven book — and the whole remaining sidebar: the Light Codes      */
/*  chamber, the Quantum World's narrator and the Evolve Med nexus.    */
/*  Their content is revealed when asked into the chat, much like      */
/*  generative chat — never as buttons waiting at the bottom.          */
/*                                                                     */
/*  THE REQUEST LAW: the sandbox is never brought by a passing         */
/*  mention. A door opens ONLY when the visitor's words carry a        */
/*  REQUEST — an explicit frame ("can you open…", "give me…"), a       */
/*  request verb standing close before the door's name ("create a      */
/*  book", "draw me a card"), or a bare naming that is itself the      */
/*  ask ("information in akashic", "formula of reality", "relaxing     */
/*  sounds of stars"). Ordinary questions that merely mention a        */
/*  world's name are answered as ordinary words, nothing more.         */
/*  Safe on client and server: type imports only, no I/O.              */
/* ------------------------------------------------------------------ */

import type { LightCodesMode } from "@/lib/data/light-codes";

export type SideArtifactKind =
  | "akashic"
  | "star"
  | "manifest"
  | "forge"
  | "book"
  | "poem"
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

/* ------------------------------------------------------------------ */
/*  THE REQUEST GATE                                                   */
/* ------------------------------------------------------------------ */

/** An explicit request frame — the visitor addressing the mirror and
    asking for something to be brought, shown or made. Verbs only:
    a bare "please" or "can you" also travels with plain questions
    ("please explain quantum entanglement") and must not open doors. */
const REQUEST_FRAME: RegExp = new RegExp(
  [
    "\\b(?:can|could|will|would)\\s+you\\s+(?:please\\s+)?(?:open|show|give|bring|create|make|build|draw|read|tune|play|prepare|weave|write|channel|summon|reveal|visit|enter|invent|design|devise|forge)\\b",
    "\\b(?:please\\s+)?(?:open|show|give|bring|bring\\s+me|create|make|draw|read|tune|play|prepare|weave|write|channel|summon|reveal|invent|design|devise|forge|build)\\s+(?:me\\s+)?(?:a|an|the|my|some|us|another)\\b",
    "\\bi\\s+(?:want|wish|need|would\\s+like|'d\\s+like)\\s+(?:to\\s+)?(?:open|see|hear|read|visit|enter|create|make|draw|receive|have|a|an|the|my|some)\\b",
    "\\b(?:let'?s|let\\s+us)\\s+(?:open|enter|visit|create|make|draw|read|begin|start|weave|play|invent|build|design|forge)\\b",
    "\\b(?:take|bring)\\s+me\\s+(?:to|into|inside)\\b",
  ].join("|"),
  "i"
);

/** Request verbs that may stand close before a door's name —
    "open the light codes", "create a book", "draw me a card". */
const REQUEST_VERBS: ReadonlySet<string> = new Set([
  "open", "opens", "opening", "opened",
  "enter", "entering", "entered",
  "visit", "visiting",
  "show", "showing",
  "give", "giving",
  "bring", "bringing",
  "create", "creating", "created",
  "make", "making", "made",
  "build", "building",
  "weave", "weaving",
  "write", "writing",
  "compose", "composing",
  "draw", "drawing",
  "pull", "pulling",
  "pick", "picking",
  "flip", "flipping",
  "deal", "dealing",
  "shuffle", "shuffling",
  "read", "reading",
  "ask", "asking",
  "tune", "tuning",
  "play", "playing",
  "start", "starting",
  "begin", "beginning",
  "take", "taking",
  "strike", "striking",
  "summon", "summoning",
  "reveal", "revealing",
  "channel", "channeling",
  "crystallize", "crystallizing",
  "translate", "translating",
  "put", "putting",
  "sing", "singing",
  "retrieve", "retrieving",
  "fetch", "fetching",
  "generate", "generating",
  "want", "wants", "wish", "wishes", "need", "needs",
  "help",
]);

/** A question's opening words — a bare naming never begins like this.
    Question words ("why does the quantum world…") and imperative
    asks-for-an-answer openers ("please explain quantum…") read as
    questions, not as the ask itself — the request frame and the
    request verbs still catch the true requests among them. */
const INTERROGATIVE_START: RegExp =
  /^(why|how|what|when|where|who|which|whose|is|are|am|was|were|do|does|did|has|have|had|will|would|should|shall|can|could|may|please|explain|describe|tell|name|list|define|compare|prove|imagine|consider|suppose|help|give|show|write|draw|make|create|open|play|sing|read|put|turn|translate|weave|build|start|begin|continue|resume)\b/i;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** A request verb standing within `gap` words before the door's name —
    "open the akashic records", "create a book about the sea". */
function verbNear(text: string, match: RegExpExecArray, gap = 5): boolean {
  const before = text.slice(0, match.index);
  const words = before
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-gap)
    .map((w) => w.toLowerCase().replace(/[^a-z']/g, ""));
  return words.some((w) => REQUEST_VERBS.has(w));
}

/** The gate itself: does this mention READ as a request?
    1. an explicit request frame anywhere in the message, or
    2. a request verb close before the door's name, or
    3. a bare naming — a short message (≤ 12 words) that does not
       open like a question and is itself the ask ("akashic records
       of my life in the Sirian waters" — nine words, one ask). */
function isRequested(text: string, match: RegExpExecArray): boolean {
  if (REQUEST_FRAME.test(text)) return true;
  if (verbNear(text, match)) return true;
  return wordCount(text) <= 12 && !INTERROGATIVE_START.test(text);
}

/* ------------------------------------------------------------------ */
/*  THE DOORS — each with the words that name it                       */
/* ------------------------------------------------------------------ */

/* The book's own return — the visitor paused a volume earlier and now
   asks the mirror to bring it back where it rested. Already fully
   request-shaped, so it rides WITHOUT the gate. */
const BOOK_RESUME_PATTERNS: RegExp[] = [
  /\b(bring|get|call|pull|take)\s+(back|my)\b[^.?!]{0,20}\b(book|volume|story|tale|novel)\b/i,
  /\b(bring\s+back|return\s+to|go\s+back\s+to|come\s+back\s+to)\b[^.?!]{0,20}\b(my|the|our)\s+(book|volume|story|tale|novel)\b/i,
  /\b(continue|resume|reopen|re-open|unpause)\b[^.?!]{0,20}\b(my|the|our|that)?\s*(book|volume|story|tale|novel|reading)\b/i,
  /\bmy\s+(book|volume|story|tale)\b[^.?!]{0,30}\b(back|again|paused|left|page)\b/i,
  /\bbook\b[^.?!]{0,20}\b(where\s+(i|we)\s+(paused|left|stopped))\b/i,
  /\b(where\s+(i|we)\s+(paused|left\s+off|stopped))\b/i,
];

/* The Book door — a volume woven right inside the conversation:
   the mirror asks about the book, then the loom binds it in chat. */
const BOOK_PATTERNS: RegExp[] = [
  /\b(make|create|craft|write|weave|manifest|compose|start|begin|open)\b[^.?!]{0,32}\b(a|an|the|my|us|me)\s+(book|storybook|volume|tale|story)\b/i,
  /\b(book|storybook|volume)\b[^.?!]{0,32}\b(about|of|on|for)\b/i,
  /\bwrite\s+(me|us)\s+(a|an)?\s*(book|story|tale|novel)\b/i,
  /\b(make|create|craft|write|weave|compose)\b[^.?!]{0,24}\b(poem|poetry|riddle|riddles|ballad|lullaby)\s+(book|volume|collection)\b/i,
  /\b(cozy|little|whole|entire|full|new|another)\s+book\b/i,
];

/* The Akashic door — records, past lives, the Library itself. */
const AKASHIC_PATTERNS: RegExp[] = [
  /\bakash?ic\b/i,
  /\bakasha\b/i,
  /\bpast\s+life\b/i,
  /\bpast\s+lives\b/i,
  /\brecords?\s+of\s+(my|the\s+visitor|this\s+soul)\b/i,
  /\b(open|visit|enter|draw\s+from)\s+(the\s+)?(library|hall\s+of\s+records?|akash)/i,
  /\breading\s+from\s+the\s+(records?|hall|library)\b/i,
  /\binformation\s+(in|from|about|inside)\s+(the\s+)?akash/i,
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

/* The Forge door — mysteries struck from the coals, and the visitor's
   own conceptions forged to their words. A complete ask ("invent a new
   way of receiving light signals from leafs") strikes directly; a bare
   naming ("the forge") opens the dial bench. */
const FORGE_PATTERNS: RegExp[] = [
  /\bforge\b/i,
  /\binvent(s?|ion|ions|ing|ed)?\b/i,
  /\bmystery\s+(creation|card|device|me|something|object)\b/i,
  /\bbuild\s+(me|us)\b/i,
  /\bdesign\s+(me\s+)?(a|an|something)\b/i,
  /\bconceive\b[^.?!]{0,16}\b(device|machine|instrument|way|method)\b/i,
  /\bdevise\b[^.?!]{0,16}\b(a|an|the|something)\b/i,
  /\bstrike\b[^.?!]{0,16}\bforge\b/i,
  /\bsomething\s+(strange|wonderful|new|playful)\b[^.?!]{0,24}\b(make|build|create|invent)\b/i,
  /\bnew\s+way\s+of\b/i,
];

/* The Poem door — a poem woven as its own artifact, straight into
   the channel: no mirror speech around it, the ink itself is the
   reply. Text verbs only — a lullaby SUNG belongs to the Light
   Codes chamber, a lullaby WRITTEN belongs to the loom. */
const POEM_PATTERNS: RegExp[] = [
  /\b(write|compose|pen|jot|weave|craft)\b[^.?!]{0,24}\b(me\s+|us\s+)?(a|an|the|us)?\s*(poem|poetry|verse|verses|haiku|sonnet|limerick|rhyme|lullaby)\b/i,
  /\b(a|an)\s+(poem|haiku|sonnet|lullaby)\s+(about|for|of|on)\b/i,
  /\bpoem\b[^.?!]{0,20}\b(about|for|of|on)\b/i,
  /\bhaiku\b/i,
  /\bsonnet\b/i,
];

/* The Light Codes door — sound transmissions through the Mirror
   Entity: named transmissions, sound healing, the singing tones. */
const CODES_PATTERNS: RegExp[] = [
  /\blight\s*codes?\b/i,
  /\bsound\s+(transmission|bath|healing|code)s?\b/i,
  /\bsounds?\s+of\b/i,
  /\bsolfeggio\b/i,
  /\b(432|528|639|741|852|963)\s*h?z\b/i,
  /\bschumann\b/i,
  /\bfrequenc(y|ies)\b[^.?!]{0,28}\b(transmission|healing|session|bath|tone)\b/i,
  /\b(music|song|melody|transmission)\b/i,
];

/* The Quantum World door — ParticleX, the narrator of what is beneath
   and beside the visible. The narrator's INSTRUMENTS (the formula, the
   Formula Loom, the Perception Glass, the Frequency Wheel, the Parallel
   Catalog) are requests by nature — naming one IS asking for it — so
   they open the door without the gate. */
const QUANTUM_PATTERNS: RegExp[] = [
  /\bquantum\b/i,
  /\bparticle\s*x\b/i,
  /\bentangle(ment|d)?\b/i,
  /\bsuperposition\b/i,
  /\bwave\s+function\b/i,
  /\bmultiverse\b/i,
  /\bparallel\s+(lines?|worlds?|realit(y|ies)|self|selves)\b/i,
];

const QUANTUM_INSTRUMENTS: RegExp[] = [
  /\bformula\b/i,
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

/* The doors in their order — most specific first. */
const DOORS: {
  kind: SideArtifactKind;
  patterns: RegExp[];
  ungated?: RegExp[];
}[] = [
  { kind: "book", patterns: BOOK_PATTERNS },
  { kind: "akashic", patterns: AKASHIC_PATTERNS },
  { kind: "star", patterns: STAR_PATTERNS },
  { kind: "manifest", patterns: MANIFEST_PATTERNS },
  { kind: "forge", patterns: FORGE_PATTERNS },
  { kind: "poem", patterns: POEM_PATTERNS },
  { kind: "codes", patterns: CODES_PATTERNS },
  { kind: "quantum", patterns: QUANTUM_PATTERNS, ungated: QUANTUM_INSTRUMENTS },
  { kind: "remedy", patterns: REMEDY_PATTERNS },
];

/** First pattern that matches, with its position — the position is
    what lets the request gate weigh the words before the door's name. */
function firstMatch(text: string, patterns: RegExp[]): RegExpExecArray | null {
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return m;
  }
  return null;
}

/**
 * One pass, most specific doors first. Returns the artifact kind that
 * should ride along with the mirror's reply — or null for ordinary
 * words that need nothing but an answer. A door opens ONLY on request:
 * an explicit frame, a request verb near the door's name, or a bare
 * naming that is itself the ask (≤ 12 words, no interrogative opener).
 */
export function detectArtifactIntent(text: string): SideArtifactKind | null {
  const v = text.trim();
  if (v.length < 3) return null;

  /* the book's return is itself a request — it needs no gate */
  if (BOOK_RESUME_PATTERNS.some((re) => re.test(v))) return "book";

  for (const door of DOORS) {
    if (door.ungated && door.ungated.some((re) => re.test(v))) {
      return door.kind;
    }
    const m = firstMatch(v, door.patterns);
    if (!m) continue;
    if (isRequested(v, m)) return door.kind;
    /* the forge hears a spoken directive — the vision is the ask */
    if (door.kind === "forge" && FORGE_ASK_VERB.test(v) && forgeDirective(v)) {
      return door.kind;
    }
    /* a passing mention falls through to the next doors — the reply
       stays an ordinary reply */
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  THE FORGE DIRECTIVE — "invent a new way of receiving light         */
/*  signals from leafs" is a COMPLETE ask: the forge strikes it        */
/*  directly, no dials to turn. "Open the forge" is bare: the dial     */
/*  bench waits for the visitor's hand. The residual words after the   */
/*  request scaffolding is stripped decide which one it is.            */
/* ------------------------------------------------------------------ */

const FORGE_STRIP: RegExp[] = [
  /\b(?:please\s+)?(?:can|could|would|will)\s+you\s+(?:please\s+)?/gi,
  /\bi\s+(?:want|wish|need|would\s+like)\s+(?:you\s+)?(?:to\s+)?/gi,
  /\bplease\b/gi,
  /\b(?:invent|build|design|make|create|forge|construct|devise|imagine|conceive|strike)\b/gi,
  /\b(?:for|with)\s+(?:me|us)\b/gi,
  /\bthe\s+forge\b/gi,
  /\bsomething\s+(?:strange|wonderful|new|playful|beautiful|curious)\b/gi,
];

/* A forge ask that carries its own vision — the creation verb plus
    enough of the seeker's words. A complete ask is itself the request:
    it opens the forge without the gate, however long the words run. */
const FORGE_ASK_VERB: RegExp =
  /\b(invent|build|design|devise|conceive|forge|strike|construct)\b/i;

/**
 * The forge directive — the visitor's words carry a complete creation
 * ask (three or more meaningful words remain once the request
 * scaffolding is stripped). The returned string is the visitor's OWN
 * words, carried to the forge verbatim; null means the bench waits
 * for the dials.
 */
export function forgeDirective(text: string): string | null {
  const raw = text.trim();
  if (raw.length < 3) return null;
  let v = raw;
  for (const re of FORGE_STRIP) v = v.replace(re, " ");
  const words = v
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))
    .filter((w) => w.length > 1);
  return words.length >= 3 ? raw.slice(0, 400) : null;
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
/*  Only an explicit music request travels here — a sentence that      */
/*  merely mentions sound or song is answered as ordinary words.        */
/* ------------------------------------------------------------------ */

export const MUSIC_INTENT: RegExp = new RegExp(
  [
    /* "put / turn / translate it, this, what we talked about into music" */
    "\\b(?:put|turn|translate|weave)\\s+(?:it|this|that|what\\s+we|our\\s+(?:talk|words|thread)|this\\s+(?:talk|thread|chat))\\b[^.?!]{0,32}\\b(?:music|song|sound|melody|transmission)\\b",
    /* "make / create / give / sing / play me music · a song · a melody" */
    "\\b(?:make|create|give|sing|play|tune|channel)\\s+(?:me\\s+|us\\s+)?(?:a\\s+|some\\s+|the\\s+)?(?:music|song|melody|sound\\s+transmission|transmission|lullaby)\\b",
    /* "a song / music / melody for or about …" */
    "\\b(?:music|song|melody|sound\\s+transmission)\\s+(?:for|about)\\b",
    /* "sounds of …" asked as a gift ("relaxing sounds of stars") */
    "\\b(?:relaxing|calming|soothing|healing|gentle|peaceful|deep)\\s+sounds?\\s+of\\b",
    /* "sing me / sing about …" */
    "\\b(?:sing|hum)\\s+(?:me|about|of)\\b",
  ].join("|"),
  "i"
);

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
