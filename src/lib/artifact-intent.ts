/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the Generative Side-Activity Engine                */
/*  Detects, from one chat message, when a side activity should be     */
/*  brought INTO the channel as a living artifact: the Akashic letter, */
/*  the Manifesting ritual, the Forge strike, the                       */
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
import {
  uWord,
  REQUEST_FRAMES_I18N,
  REQUEST_VERBS_I18N,
  INTERROGATIVE_I18N,
  NEGATION_WORDS_I18N,
  REPORTED_SPEECH_I18N,
  SELF_NARRATION_I18N,
  PAST_CONTEXT_I18N,
  FUTURE_NARRATION_I18N,
  CLAUSE_VERBS_I18N,
  BOOK_NAMES_I18N,
  AKASHIC_NAMES_I18N,
  MANIFEST_NAMES_I18N,
  FORGE_NAMES_I18N,
  POEM_NAMES_I18N,
  CODES_NAMES_I18N,
  QUANTUM_NAMES_I18N,
  REMEDY_NAMES_I18N,
  CONNECTOR_I18N,
  MUSIC_NOUNS_I18N,
  FORMULA_TOOL_I18N,
  PERCEPTION_TOOL_I18N,
  LIGHT_CODES_MODES_I18N,
} from "@/lib/intent-languages";

export type SideArtifactKind =
  | "akashic"
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
/*  THE REQUEST GATE — THE SENTENCE LAW                                */
/*  The same core idea as the image gate: the doors read SENTENCES,    */
/*  never the whole text at once. A long message that merely MENTIONS  */
/*  a world ("the book I am reading", "I made a poem once", "my tarot  */
/*  cards at home") is a conversation, not a request. One sentence     */
/*  opens a door only when that sentence, in its own right, carries    */
/*  the request — an explicit frame, a request verb standing close     */
/*  before the door's name, or a bare naming that is itself the ask —  */
/*  and none of the guards (meta-mention, negation, reported speech,   */
/*  the speaker narrating their own past or future making) claim it    */
/*  first. Ordinary questions that merely mention a world's name are   */
/*  answered as ordinary words, nothing more.                          */
/* ------------------------------------------------------------------ */

/** An explicit request frame — the visitor addressing the mirror and
    asking for something to be brought, shown or made. Verbs only:
    a bare "please" or "can you" also travels with plain questions
    ("please explain quantum entanglement") and must not open doors.
    THE TONGUE LAW — every supported language brings its own frames
    ("kannst du öffnen", "peux-tu montrer", "μπορείς να δείξεις"). */
const ENGLISH_REQUEST_FRAME: RegExp = new RegExp(
  [
    "\\b(?:can|could|will|would)\\s+you\\s+(?:please\\s+)?(?:open|show|give|bring|create|make|build|draw|read|tune|play|prepare|weave|write|channel|summon|reveal|visit|enter|invent|design|devise|forge)\\b",
    "\\b(?:please\\s+)?(?:open|show|give|bring|bring\\s+me|create|make|draw|read|tune|play|prepare|weave|write|channel|summon|reveal|invent|design|devise|forge|build)\\s+(?:me\\s+)?(?:a|an|the|my|some|us|another)\\b",
    "\\bi\\s+(?:want|wish|need|would\\s+like|'d\\s+like)\\s+(?:to\\s+)?(?:open|see|hear|read|visit|enter|create|make|draw|receive|have|a|an|the|my|some)\\b",
    "\\b(?:let'?s|let\\s+us)\\s+(?:open|enter|visit|create|make|draw|read|begin|start|weave|play|invent|build|design|forge)\\b",
    "\\b(?:take|bring)\\s+me\\s+(?:to|into|inside)\\b",
  ].join("|"),
  "i"
);

/** The whole tongue-union of frames, weighed once per sentence. */
const REQUEST_FRAME_ALL: RegExp = new RegExp(
  [ENGLISH_REQUEST_FRAME.source, ...REQUEST_FRAMES_I18N.map((r) => r.source)].join("|"),
  "iu"
);

function hasRequestFrame(s: string): boolean {
  return REQUEST_FRAME_ALL.test(s);
}

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
  ...REQUEST_VERBS_I18N,
]);

/** A question's opening words — a bare naming never begins like this.
    Question words ("why does the quantum world…") and imperative
    asks-for-an-answer openers ("please explain quantum…") read as
    questions, not as the ask itself — the request frame and the
    request verbs still catch the true requests among them. */
const INTERROGATIVE_START: RegExp = new RegExp(
  `^(?:why|how|what|when|where|who|which|whose|is|are|am|was|were|do|does|did|has|have|had|will|would|should|shall|can|could|may|please|explain|describe|tell|name|list|define|compare|prove|imagine|consider|suppose|help|give|show|write|draw|make|create|open|play|sing|read|put|turn|translate|weave|build|start|begin|continue|resume|${INTERROGATIVE_I18N})(?![\\p{L}\\p{M}])`,
  "iu"
);

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** A request verb standing within `gap` words before the door's name —
    "open the akashic records", "create a book about the sea". THE
    TONGUE LAW — the word walk keeps every letter of every alphabet:
    umlauts, Greek and Turkish characters survive the strip. */
function verbNear(text: string, match: RegExpExecArray, gap = 5): boolean {
  const before = text.slice(0, match.index);
  const words = before
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-gap)
    .map((w) => w.toLowerCase().replace(/[^\p{L}']/gu, ""));
  return words.some((w) => REQUEST_VERBS.has(w));
}

/* --------------------------- THE GUARDS ---------------------------- */
/*  A guarded sentence never opens a door — the same five guards the   */
/*  image gate keeps, retuned for the chamber doors.                   */

/** Meta-speech about a world's machinery — "the akashic records
    section", "the poem generator", "the forge feature", "that world
    in the app", "die Lichtcodes Sektion", "la sección de códigos" —
    talking ABOUT a door is not knocking on it. */
const MACHINERY_I18N: string = [
  /* English */
  "sections?|features?|tools?|modes?|tabs?|views?|screens?|creator|creators?|generator|generators?|engine|engines?|menu|button|buttons?",
  /* German */
  "sektion|sektionen|abschnitt|abschnitte|funktion|funktionen|werkzeug|werkzeuge|generator|generatoren|ansicht|ansichten|menü|schaltfläche",
  /* French */
  "section|sections|fonctionnalité|fonctionnalités|générateur|générateurs|outil|outils|écran|écrans",
  /* Spanish */
  "sección|secciones|función|funciones|generador|generadores|herramienta|herramientas|pantalla|pantallas",
  /* Italian */
  "sezione|sezioni|funzione|funzioni|generatore|generatori|strumento|strumenti|schermata|schermate",
  /* Greek */
  "ενότητα|ενότητες|λειτουργία|λειτουργίες|δημιουργός|δημιουργοί|εργαλείο|εργαλεία|οθόνη|οθόνες",
  /* Turkish */
  "bölüm|bölümler|özellik|özellikler|oluşturucu|araç|araçlar|menü",
  /* Albanian */
  "seksioni|seksionet|funksioni|funksionet|gjeneratori|vegla|meny",
].join("|");

const ALL_DOOR_NAMES_I18N: string = [
  BOOK_NAMES_I18N,
  AKASHIC_NAMES_I18N,
  MANIFEST_NAMES_I18N,
  FORGE_NAMES_I18N,
  POEM_NAMES_I18N,
  CODES_NAMES_I18N,
  QUANTUM_NAMES_I18N,
  REMEDY_NAMES_I18N,
].join("|");

const META_FEATURE_PATTERN: RegExp = new RegExp(
  [
    /* English pairs */
    "\\b(?:akash?ic|tarot|arcana|oracle|star\\s*play|forge|light\\s*codes?|particle\\s*x|quantum|evolve\\s*med|manifest(?:ing|ation)?|remed(?:y|ies))\\b[^.?!]{0,28}\\b(?:sections?|features?|doors?|worlds?|chambers?|tools?|modes?|tabs?|pages?|views?|screens?|creator|creators?|generator|generators?|engine|engines?)\\b",
    "\\b(?:sections?|features?|doors?|worlds?|chambers?|tabs?|pages?|views?|screens?)\\s+(?:like|of|for)\\s+(?:the|this|that|our)?\\s*(?:akash?ic|forge|light\\s*codes?|quantum|star\\s*play|manifest\\w*|remed\\w*)\\b",
    /* EVERY TONGUE — a door's own name beside its machinery */
    uWord(ALL_DOOR_NAMES_I18N) + "[^.?!]{0,28}" + uWord(MACHINERY_I18N),
    uWord(MACHINERY_I18N) + "[^.?!]{0,28}" + uWord(ALL_DOOR_NAMES_I18N),
  ].join("|"),
  "iu"
);

/** A sentence that declines or excludes — "no poem needed", "without
    the cards", "not another reading", "kein Gedicht nötig", "sin un
    libro", "χωρίς βιβλίο". The opposite of a request. */
const ARTIFACT_NOUNS_ALL: string = [
  "book|poem|poetry|card|cards?|reading|readings?|record|records?|remed(?:y|ies)|sound|sounds|music|sigil|intention|visions?|transmission|haiku|sonnet|lullaby",
  BOOK_NAMES_I18N,
  POEM_NAMES_I18N,
  AKASHIC_NAMES_I18N,
  CODES_NAMES_I18N,
  REMEDY_NAMES_I18N,
  MANIFEST_NAMES_I18N,
  MUSIC_NOUNS_I18N,
].join("|");

const NEGATION_PATTERN: RegExp = new RegExp(
  uWord(
    "no|not|without|never|nothing|don'?t|do not|doesn'?t|no need (?:for|of)|not looking for|no more|" +
      NEGATION_WORDS_I18N
  ) +
    "[^.?!]{0,32}" +
    uWord(ARTIFACT_NOUNS_ALL),
  "iu"
);

/** Reported speech — "my teacher told me to read the records", "the
    book says to draw a card", "mein Lehrer erzählte von den
    Chroniken" — someone else's ask, never the visitor's own petition
    to this mirror. Past and third-person forms only: the bare forms
    ("write me", "tell me") are the visitor's own imperative and must
    never be mistaken for narration. */
const REPORTED_SPEECH_PATTERN: RegExp = new RegExp(
  uWord(
    "asked|told|suggested|recommended|said|wrote|claimed|taught|teaches|teaching|says|tells|suggests|recommends|writes|claims|asks|" +
      REPORTED_SPEECH_I18N
  ) +
    "[^.?!]{0,40}" +
    uWord("me|us|him|her|them|to|that|mir|mich|dir|dich|moi|nous|vous|me|nos|ti|ci|μου|μας|σου|του|της|bana|bize|mua|mu|na"),
  "iu"
);

/** The speaker narrating their OWN making — past ("I wrote a book
    last year", "Ich habe ein Buch geschrieben", "j'ai écrit un
    poème"), habitual present ("sometimes I draw little sketches") —
    a story, not a request. */
const SELF_NARRATION_PATTERN: RegExp = new RegExp(
  [
    "\\bI\\s+(?:made|wrote|drew|painted|created|composed|built|designed|forged|pulled|flipped|shuffled|dealt|read|kept|keep|had|draw|sketch|paint|write|journal|have\\s+(?:made|written|drawn|painted|created|composed|built|designed|forged|pulled|flipped|shuffled|dealt|read|kept))\\b",
    uWord(SELF_NARRATION_I18N),
  ].join("|"),
  "iu"
);

/** The sentence sitting in remembered time — "when I was young",
    "als ich klein war", "quand j'étais petite", "όταν ήμουν παιδί",
    "çocukken" — storytelling, never a present petition to the mirror. */
const PAST_CONTEXT_PATTERN: RegExp = new RegExp(
  [
    "\\b(?:when i was|back when|as a child|as a kid|growing up|used to|yesterday|last (?:year|month|week|night|summer|winter|autumn|spring)|ago|in my childhood|every (?:day|night|week|month|morning|evening|sunday|saturday|summer|winter))\\b",
    uWord(PAST_CONTEXT_I18N),
  ].join("|"),
  "iu"
);

/** The speaker narrating their OWN future making — "I will write a
    book someday", "Ich werde ein Buch schreiben", "θα γράψω" — a
    story about themselves, not a request. */
const FUTURE_NARRATION_PATTERN: RegExp = new RegExp(
  [
    "\\bI\\s+(?:will|shall)\\s+(?:\\w+\\s+){0,3}?(?:make|write|draw|paint|create|compose|build|design|forge|read|pull|flip|shuffle|open|weave)\\b",
    uWord(FUTURE_NARRATION_I18N),
  ].join("|"),
  "iu"
);

/** A finite clause verb — the mark of an ordinary STATEMENT ("the
    sound of rain calms me", "das Buch ist auf dem Tisch", "el libro
    está en la mesa"), not a bare naming that is itself the ask
    ("relaxing sounds of stars", "a poem about the sea"). Third-person
    and past forms only — bare forms collide with the doors' own
    nouns and nouns of intent ("find calm", "to help me sleep").
    THE TONGUE LAW — every supported language brings its own finite
    verbs, and the request verbs are weighed FIRST, so a request
    never loses its verb to the clause law. */
const CLAUSE_VERB_PATTERN: RegExp = new RegExp(
  uWord(
    "is|are|was|were|am|be|been|being|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|feels?|felt|seems?|seemed|sounds?|sounded|calms\\b|calmed\\b|calming\\b|helps\\b|helped\\b|helping\\b|makes?|made|brings?|brought|carries?|carried|reminds?|reminded|comes?|came|goes?|went|stays?|stayed|means?|meant|changes?|changed|speaks?|spoke|says?|said|tells?|told|asks?|asked|knows?|knew|thinks?|thought|wants?|wanted|needs?|needed|loves?|loved|likes?|liked|" +
      CLAUSE_VERBS_I18N
  ),
  "iu"
);

/** The strongest statement markers — the be-verbs of EVERY tongue.
    They are checked across the WHOLE sentence (they never collide with
    a door's naming), while the wider clause-verb family is checked
    only OUTSIDE the door-phrase match span. */
const BE_VERB_PATTERN = new RegExp(
  uWord(
    "is|are|was|were|am|ist|sind|war|waren|bin|est|sont|était|étaient|es|son|era|eran|está|están|è|sono|είναι|ήταν|üzerinde|içinde|altında|yanında|është|janë"
  ),
  "iu"
);

/**
 * A guarded sentence never opens a door on its own. Meta-mention,
 * negation, reported speech and the speaker narrating their own past
 * or future making are absolute: the visitor's own ask must travel in
 * its own words, not inside someone else's sentence.
 */
function guardedSentence(s: string): boolean {
  if (META_FEATURE_PATTERN.test(s)) return true;
  if (NEGATION_PATTERN.test(s)) return true;
  if (REPORTED_SPEECH_PATTERN.test(s)) return true;
  if (SELF_NARRATION_PATTERN.test(s)) return true;
  if (FUTURE_NARRATION_PATTERN.test(s)) return true;
  if (PAST_CONTEXT_PATTERN.test(s)) return true;
  return false;
}

/**
 * One sentence opens a door when it holds the door's name AND an
 * asking shape of its own:
 *   1. an explicit request frame inside the sentence,
 *   2. a request verb standing close before the door's name,
 *   3. a bare naming — a short sentence (≤ 12 words) that does not
 *      open like a question and holds no finite clause verb, so the
 *      naming itself IS the ask ("information in akashic",
 *      "relaxing sounds of stars", "a poem about the sea").
 */
function sentenceRequests(s: string, match: RegExpExecArray): boolean {
  if (hasRequestFrame(s)) return true;
  if (verbNear(s, match)) return true;
  /* the bare naming — the sentence IS the ask. An ordinary statement
     is refused: clause verbs are sought OUTSIDE the door-phrase span
     ("sounds" names the door itself), while the be-verbs are sought
     across the whole sentence (they never share a door's words). */
  if (wordCount(s) > 12 || INTERROGATIVE_START.test(s)) return false;
  const outside =
    s.slice(0, match.index) + " " + s.slice(match.index + match[0].length);
  if (CLAUSE_VERB_PATTERN.test(outside)) return false;
  if (BE_VERB_PATTERN.test(s)) return false;
  return true;
}

/** The visitor's text, cut into sentences — the unit the doors read. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* The book's own return — the visitor paused a volume earlier and now
   asks the mirror to bring it back where it rested. Already fully
   request-shaped, so it rides WITHOUT the gate. Every tongue speaks
   the return in its own words. */
const BOOK_RESUME_PATTERNS: RegExp[] = [
  /\b(bring|get|call|pull|take)\s+(back|my)\b[^.?!]{0,20}\b(book|volume|story|tale|novel)\b/i,
  /\b(bring\s+back|return\s+to|go\s+back\s+to|come\s+back\s+to)\b[^.?!]{0,20}\b(my|the|our)\s+(book|volume|story|tale|novel)\b/i,
  /\b(continue|resume|reopen|re-open|unpause)\b[^.?!]{0,20}\b(my|the|our|that)?\s*(book|volume|story|tale|novel|reading)\b/i,
  /\bmy\s+(book|volume|story|tale)\b[^.?!]{0,30}\b(back|again|paused|left|page)\b/i,
  /\bbook\b[^.?!]{0,20}\b(where\s+(i|we)\s+(paused|left|stopped))\b/i,
  /\b(where\s+(i|we)\s+(paused|left\s+off|stopped))\b/i,
  /* German */
  new RegExp(uWord("mein buch (zurück|wieder|weiter|fortsetzen|again)"), "iu"),
  new RegExp(uWord("(?:bring|hol) (?:mein|das) buch (?:zurück|wieder)"), "iu"),
  new RegExp(uWord("weiterlesen|wo ich aufgehört hab(?:e)?|buch fortsetzen"), "iu"),
  /* French */
  new RegExp(uWord("(?:reprendre|ramener|rouvrir) mon livre"), "iu"),
  new RegExp(uWord("mon livre (?:à nouveau|de retour|encore)"), "iu"),
  new RegExp(uWord("où je m'étais arrêté|reprendre la lecture"), "iu"),
  /* Spanish */
  new RegExp(uWord("(?:continuar|seguir|retomar) mi libro"), "iu"),
  new RegExp(uWord("mi libro (?:otra vez|de vuelta)"), "iu"),
  new RegExp(uWord("donde lo dej[ée]"), "iu"),
  /* Italian */
  new RegExp(uWord("(?:riprendere|riportare) (?:il|lo) mio libro"), "iu"),
  new RegExp(uWord("(?:il|lo) mio libro (?:di nuovo|ancora)"), "iu"),
  new RegExp(uWord("dove l'avevo lasciato"), "iu"),
  /* Greek */
  new RegExp(uWord("(?:φέρε πίσω|συνέχισε) το βιβλίο μου"), "iu"),
  new RegExp(uWord("το βιβλίο μου (?:ξανά|πίσω)"), "iu"),
  new RegExp(uWord("όπου το άφησα"), "iu"),
  /* Turkish */
  new RegExp(uWord("kitabımı (?:geri getir|tekrar|devam)"), "iu"),
  new RegExp(uWord("kitabıma devam|kaldığım yerden"), "iu"),
  /* Albanian */
  new RegExp(uWord("(?:kthe|vazhdo) librin tim"), "iu"),
  new RegExp(uWord("libri im (?:përsëri|prapë)"), "iu"),
  new RegExp(uWord("aty ku ndala"), "iu"),
];

/* The Book door — a volume woven right inside the conversation:
   the mirror asks about the book, then the loom binds it in chat.
   THE TONGUE LAW — das Buch, le livre, el libro, il libro, το
   βιβλίο, kitap, libri — every name the sidebar speaks. */
const BOOK_PATTERNS: RegExp[] = [
  /\b(make|create|craft|write|weave|manifest|compose|start|begin|open)\b[^.?!]{0,32}\b(a|an|the|my|us|me)\s+(book|storybook|volume|tale|story)\b/i,
  new RegExp(`${uWord(`book|storybook|volume|${BOOK_NAMES_I18N}`)}[^.?!]{0,32}${uWord(`about|of|on|for|${CONNECTOR_I18N}`)}`, "iu"),
  /\bwrite\s+(me|us)\s+(a|an)?\s*(book|story|tale|novel)\b/i,
  /\b(make|create|craft|write|weave|compose)\b[^.?!]{0,24}\b(poem|poetry|riddle|riddles|ballad|lullaby)\s+(book|volume|collection)\b/i,
  /\b(cozy|little|whole|entire|full|new|another)\s+book\b/i,
  new RegExp(uWord(`book|storybook|volume|${BOOK_NAMES_I18N}`), "iu"),
];

/* The Akashic door — records, past lives, the Library itself —
   die Chroniken, les chroniques, las vidas pasadas, οι προηγούμενες
   ζωές, önceki hayatlar, jetët e mëparshme. */
const AKASHIC_PATTERNS: RegExp[] = [
  /\bakash?ic\b/i,
  /\bakasha\b/i,
  /\bpast\s+life\b/i,
  /\bpast\s+lives\b/i,
  /\brecords?\s+of\s+(my|the\s+visitor|this\s+soul)\b/i,
  /\b(open|visit|enter|draw\s+from)\s+(the\s+)?(library|hall\s+of\s+records?|akash)/i,
  /\breading\s+from\s+the\s+(records?|hall|library)\b/i,
  /\binformation\s+(in|from|about|inside)\s+(the\s+)?akash/i,
  new RegExp(uWord(AKASHIC_NAMES_I18N), "iu"),
];

/* The Manifesting door — intentions to charge into blueprints.
   THE SIDEBAR'S OWN NAMES — Gestalten, Manifester, Manifesta,
   Εκδήλωση, Tezahür, Manifesto — plus the verbs of manifestation. */
const MANIFEST_PATTERNS: RegExp[] = [
  /\bmanifest(ation|ing)?\b/i,
  /\b(help\s+me\s+)?(attract|call\s+in)\b/i,
  /\b(set|charge|make|hold)\s+an?\s+intention\b/i,
  /\bmy\s+intention\b/i,
  /\bsigil\b/i,
  /\bi\s+(want|wish|choose|would\s+like)\s+to\s+(manifest|attract)\b/i,
  /\bmanifest\s+(a|an|the|my|more|calm|love|wealth|health|peace|joy|abundance)\b/i,
  new RegExp(uWord(MANIFEST_NAMES_I18N), "iu"),
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
  new RegExp(uWord(FORGE_NAMES_I18N), "iu"),
];

/* The Poem door — a poem woven as its own artifact, straight into
   the channel: no mirror speech around it, the ink itself is the
   reply. Text verbs only — a lullaby SUNG belongs to the Light
   Codes chamber, a lullaby WRITTEN belongs to the loom.
   das Gedicht, le poème, el poema, la poesia, το ποίημα, şiir. */
const POEM_PATTERNS: RegExp[] = [
  /\b(write|compose|pen|jot|weave|craft|make|create|give|deliver)\b[^.?!]{0,24}\b(me\s+|us\s+)?(a|an|the|us)?\s*(poem|poetry|verse|verses|haiku|sonnet|limerick|rhyme|lullaby)\b/i,
  /\b(a|an)\s+(poem|haiku|sonnet|lullaby)\s+(about|for|of|on)\b/i,
  new RegExp(`${uWord(`poem|poetry|haiku|sonnet|lullaby|${POEM_NAMES_I18N}`)}[^.?!]{0,24}${uWord(`about|for|of|on|${CONNECTOR_I18N}`)}`, "iu"),
  /\bhaiku\b/i,
  /\bsonnet\b/i,
  new RegExp(uWord(POEM_NAMES_I18N), "iu"),
];

/* The Light Codes door — sound transmissions through the Mirror
   Entity: named transmissions, sound healing, the singing tones.
   Lichtcodes, codes de lumière, códigos de luz, Κώδικες Φωτός,
   Işık Kodları, Kodat e Dritës. */
const CODES_PATTERNS: RegExp[] = [
  /\blight\s*codes?\b/i,
  /\bsound\s+(transmission|bath|healing|code)s?\b/i,
  /\bsounds?\s+of\b/i,
  /\bsolfeggio\b/i,
  /\b(432|528|639|741|852|963)\s*h?z\b/i,
  /\bschumann\b/i,
  /\bfrequenc(y|ies)\b[^.?!]{0,28}\b(transmission|healing|session|bath|tone)\b/i,
  /\b(music|song|melody|transmission)\b/i,
  new RegExp(uWord(CODES_NAMES_I18N), "iu"),
  new RegExp(uWord(MUSIC_NOUNS_I18N), "iu"),
];

/* The Quantum World door — ParticleX, the narrator of what is beneath
   and beside the visible. Quantenwelt, Monde Quantique, Mundo
   Cuántico, Κβαντικός Κόσμος, Kuantum Dünya, Botë Kuantike. */
const QUANTUM_PATTERNS: RegExp[] = [
  /\bquantum\b/i,
  /\bparticle\s*x\b/i,
  /\bentangle(ment|d)?\b/i,
  /\bsuperposition\b/i,
  /\bwave\s+function\b/i,
  /\bmultiverse\b/i,
  /\bparallel\s+(lines?|worlds?|realit(y|ies)|self|selves)\b/i,
  new RegExp(uWord(QUANTUM_NAMES_I18N), "iu"),
];

const QUANTUM_INSTRUMENTS: RegExp[] = [
  /\bformula\b/i,
  /\bthe\s+formula\s+loom\b/i,
  /\bthe\s+perception\s+glass\b/i,
  /\bthe\s+frequency\s+wheel\b/i,
  /\bthe\s+parallel\s+catalog\b/i,
  new RegExp(uWord(FORMULA_TOOL_I18N), "iu"),
];

/* The Evolve Med door — the evolutionary medical nexus, the apothecary
   of the future, a remedy prepared in the channel itself.
   Heilmittel, remède, remedio, γιατρικό, çare, ilaç. */
const REMEDY_PATTERNS: RegExp[] = [
  /\bevolve\s*med\b/i,
  /\b(evolutionary\s+)?(medical|medicine)\s+nexus\b/i,
  /\bremed(y|ies)\b/i,
  /\bapothecar(y|ies)\b/i,
  /\bhealing\s+(protocol|vector|route)\b/i,
  new RegExp(uWord(REMEDY_NAMES_I18N), "iu"),
];

/* The doors in their order — most specific first. */
const DOORS: {
  kind: SideArtifactKind;
  patterns: RegExp[];
  ungated?: RegExp[];
}[] = [
  { kind: "book", patterns: BOOK_PATTERNS },
  { kind: "akashic", patterns: AKASHIC_PATTERNS },
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
 * words that need nothing but an answer.
 *
 * THE SENTENCE LAW — the doors read SENTENCES, never the whole text
 * at once. Each door opens only when some sentence, untouched by the
 * guards, carries the request in its own right: an explicit frame, a
 * request verb close before the door's name, or a bare naming that is
 * itself the ask. A companion frame in the neighboring sentence
 * ("the akashic records. — can you open them for me?") still knocks;
 * a mention five sentences away from the ask does not.
 */
export function detectArtifactIntent(text: string): SideArtifactKind | null {
  const v = text.trim();
  if (v.length < 3) return null;

  /* the book's return is itself a request — it needs no gate beyond
     the guards (a negated or meta sentence never resumes a volume) */
  if (
    BOOK_RESUME_PATTERNS.some((re) => re.test(v)) &&
    !NEGATION_PATTERN.test(v) &&
    !META_FEATURE_PATTERN.test(v)
  ) {
    return "book";
  }

  const sentences = splitSentences(v);

  for (const door of DOORS) {
    /* the quantum instruments are requests by nature — naming one IS
       asking for it (kept whole-text: a named tool travels with its
       own sentence wherever it stands) */
    if (door.ungated && door.ungated.some((re) => re.test(v))) {
      return door.kind;
    }

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];

      /* an explicit frame next door — the door named in one sentence,
         the ask framed in the neighbor ("…the akashic records. Can
         you open them for me?") */
      const next = sentences[i + 1];
      const prev = sentences[i - 1];
      const neighborFrame =
        (next && hasRequestFrame(next) && !guardedSentence(next)) ||
        (prev && hasRequestFrame(prev) && !guardedSentence(prev));

      if (guardedSentence(s)) continue;
      const m = firstMatch(s, door.patterns);
      if (!m) continue;
      if (sentenceRequests(s, m)) return door.kind;
      if (neighborFrame) return door.kind;
      /* the forge hears a spoken directive — the vision is the ask */
      if (door.kind === "forge" && FORGE_ASK_VERB.test(s) && forgeDirective(s)) {
        return door.kind;
      }
      /* a passing mention falls through to the next doors — the reply
         stays an ordinary reply */
    }
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
  /* German scaffolding */
  /\b(?:bitte\s+)?kannst du (?:bitte\s+)?/gi,
  /\bich (?:will|möchte|brauche) (?:du )?(?:zu )?/gi,
  /\b(?:erfinde|baue?|erschaffe|gestalte|entwirf(?:e)?|mache?|kreiere|konstruiere|denke mir)\b/gi,
  /\b(?:für|mit) (?:mich|uns)\b/gi,
  /\b(?:die|das) schmiede\b/gi,
  /* French scaffolding */
  /\b(?:s'il te pla[îi]t|stp)\b/gi,
  /\bje (?:veux|voudrais|souhaite) (?:que tu )?/gi,
  /\b(?:invente|construis|crée|fais|conçois|dessine)\b/gi,
  /\bpour (?:moi|nous)\b/gi,
  /\b(?:la|le) forge\b/gi,
  /* Spanish / Italian scaffolding */
  /\b(?:por favor|per favore|per piacere)\b/gi,
  /\b(?:quiero|necesito|voglio|vorrei|desidero)\b/gi,
  /\b(?:inventa|construye|crea|haz|concibe|diseña|costruisci|concepisci|progetta)\b/gi,
  /\b(?:para|per) (?:mí|mi|nos|noi)\b/gi,
];

/* A forge ask that carries its own vision — the creation verb plus
    enough of the seeker's words. A complete ask is itself the request:
    it opens the forge without the gate, however long the words run.
    Every tongue's creation verbs knock here too. */
const FORGE_ASK_VERB: RegExp = new RegExp(
  uWord(
    "invent|build|design|devise|conceive|forge|strike|construct|erfinde|erfinden|baue|bauen|erschaffe|entwirf|konstruiere|gestalte|invente|inventer|construis|conçois|inventa|inventar|construye|concibe|crea|εφεύρε|εφευρίσκω|σχεδίασε|icat|tasarla|shpik|krijo"
  ),
  "iu"
);

/**
 * The forge directive — the visitor's words carry a complete creation
 * ask (three or more meaningful words remain once the request
 * scaffolding is stripped). The returned string is the visitor's OWN
 * words, carried to the forge verbatim; null means the bench waits
 * for the dials. THE TONGUE LAW — every letter of every alphabet
 * survives the word walk.
 */
export function forgeDirective(text: string): string | null {
  const raw = text.trim();
  if (raw.length < 3) return null;
  let v = raw;
  for (const re of FORGE_STRIP) v = v.replace(re, " ");
  const words = v
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase().replace(/[^\p{L}']/gu, ""))
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
  if (new RegExp(`\\bformula\\b|${uWord(FORMULA_TOOL_I18N)}`, "iu").test(v))
    return "formula";
  if (
    new RegExp(
      `\\bperceiv(?:es?|ing|ed)\\b|\\bperception\\b|${uWord(PERCEPTION_TOOL_I18N)}`,
      "iu"
    ).test(v)
  )
    return "perception";
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
    /* EVERY TONGUE — "spiel Musik", "mets de la musique", "pon música",
       "metti musica", "παίξε μουσική", "müzik çal", "luaj muzikë" */
    `${uWord(`spiel(?:e|st)?|joue|jouer|mets?|metti|pon|metti|παίξε|παίξε μου|çal|aç|luaj|këndo`)}\\s+(?:mir\\s+|moi\\s+|me\\s+|mi\\s+|μου\\s+|bana\\s+|mua\\s+|une?\\s+|un\\s+|una\\s+|de la\\s+|nje\\s+|një\\s+|bir\\s+)?(?:${MUSIC_NOUNS_I18N})`,
    `${uWord(`(?:${MUSIC_NOUNS_I18N})`)}\\s+(?:für|pour|para|per|για|için|për|about|for)`,
    `${uWord(`entspannende?|beruhigende?|ruhige?|heilende?|relax\\w*|calmante|relajante|rilassante|ηρεμ\\w*|καταπραΰν\\w*|sakinleştirici|rahatlatıcı|qetësuese`)}\\s+(?:klänge?|musik|sons?|musique|sonidos?|música|suoni|musica|ήχους|μουσική|sesler|müzik|tinguj|muzikë)`,
  ].join("|"),
  "iu"
);

export function guessLightCodesMode(query: string): LightCodesMode {
  const q = query.toLowerCase();
  /* EVERY TONGUE — the tuner hears the themes in each language too.
     Each token carries its own suffix star, so "ruhige Klänge" and
     "θεραπευτικά" still find their chamber (uWord wraps the WHOLE
     alternation — the tolerance must live inside every token). */
  for (const { mode, words } of LIGHT_CODES_MODES_I18N) {
    try {
      const tolerant = words
        .split("|")
        .map((w) => w + "[\\p{L}\\p{M}]*")
        .join("|");
      if (new RegExp(uWord(tolerant), "iu").test(q)) return mode as LightCodesMode;
    } catch {
      /* a malformed tongue group never breaks the tuner */
    }
  }
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
