/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — Universal Visualization Engine                     */
/*  Shared types + natural-language visual intent detection.           */
/*  Safe on client and server: no I/O; the only import is the tongue   */
/*  packs (pure regex sources).                                        */
/* ------------------------------------------------------------------ */

import {
  uWord,
  NEGATION_WORDS_I18N,
  REPORTED_SPEECH_I18N,
  PAST_CONTEXT_I18N,
  FUTURE_NARRATION_I18N,
  SELF_NARRATION_I18N,
  VISUAL_OBJECTS_I18N,
  VISUAL_ASK_VERBS_I18N,
  VISUAL_META_I18N,
  POSSESSIVE_I18N,
  YOU_WORDS_I18N,
  VISUAL_EXPLICIT_ASK_I18N,
  VISUAL_FORM_FRAMES_I18N,
  POLITE_WORDS_I18N,
  OTHER_DOOR_OBJECTS_I18N,
} from "@/lib/intent-languages";

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
/*                                                                     */
/*  THE LONG-CONTEXT LAW — the gate reads SENTENCES, never the whole   */
/*  text at once. A long message that merely MENTIONS images ("I       */
/*  visualize the council when I meditate…", "my drawings", "the       */
/*  image creator opened twice") is a conversation, not a canvas       */
/*  request. A sentence wakes the atelier only when it ASKS for a      */
/*  picture in its own right: an image-word and an asking shape        */
/*  sharing one sentence, untouched by the guards below.               */
/* ------------------------------------------------------------------ */

/** The words that name a visual PRODUCT (the thing being asked for) —
    in every tongue the sidebar speaks. */
const VISUAL_OBJECT_PATTERN = new RegExp(
  `\\b(?:images?|pics?|pictures?|photos?|illustrations?|visuals?|visions?|visuali[sz]ation|diagrams?|maps?|infographics?|artworks?|render(?:ing|s)?|drawings?|sketch(?:es)?|paintings?|imagery|${VISUAL_OBJECTS_I18N})\\b`,
  "iu"
);

/** The verbs that can carry an ask. Present tense only — "showed"/
    "drew" narrate the past, they never petition the mirror. */
const ASK_VERB_PATTERN = new RegExp(
  `\\b(?:show|draw|paint|sketch|render|depict|portray|illustrate|make|create|generate|give|produce|channel|crystallize|crystallise|visualize|visualise|turn|${VISUAL_ASK_VERBS_I18N})\\b`,
  "iu"
);

/** A sentence that TALKS ABOUT the image machinery — the creator, the
    generator, the feature — is meta-speech, never a request. */
const META_MENTION_PATTERN = new RegExp(
  `\\b(?:image|picture|photo|visual)s?\\s+(?:creator|creators|generator|generators?|generation|engine|engines?|tools?|features?|models?|sections?|doors?|pipe?lines?)\\b|${uWord(VISUAL_META_I18N)}`,
  "iu"
);

/** A sentence that declines, negates or excludes an image is the
    opposite of a request — in every tongue. */
const NEGATION_PATTERN = new RegExp(
  `\\b(?:no|not|without|never|nothing|don'?t|do not|doesn'?t|no need (?:for|of)|not looking for|${NEGATION_WORDS_I18N})\\b[^.!?]{0,32}\\b(?:images?|pics?|pictures?|photos?|visuals?|drawings?|sketch(?:es)?|paintings?|illustrations?|${VISUAL_OBJECTS_I18N})\\b`,
  "iu"
);

/** Reported speech — "my therapist asked me to draw", "the book says
    to picture a door" — describes someone ELSE's ask, never the
    visitor's own petition to this mirror. Past and third-person forms
    only: the bare forms ("draw me", "show me") are the visitor's own
    imperative, never narration. */
const REPORTED_SPEECH_PATTERN = new RegExp(
  `\\b(?:asked|told|suggested|recommended|said|wrote|claimed|taught|teaches|teaching|says|tells|suggests|recommends|writes|claims|asks|${REPORTED_SPEECH_I18N})\\b[^.!?]{0,40}\\b(?:me|us|him|her|them|to|that|us|mir|mich|moi|nous|vous|me|nos|ti|ci|μου|μας|σου|του|της|bana|bize|mua|mu)\\b`,
  "iu"
);

/** A sentence about an EXISTING image ("the picture you made", "that
    drawing of mine", "meine Bilder", "mis dibujos") — referencing,
    not requesting. */
const REFERENCE_PATTERN = new RegExp(
  `\\b(?:the|this|that|these|those|my|your|his|her|their|${POSSESSIVE_I18N})\\s+(?:images?|pics?|pictures?|photos?|drawings?|visuals?|visions?|renderings?|sketch(?:es)?|paintings?|illustrations?|imagery|${VISUAL_OBJECTS_I18N})\\b|(?:images?|pics?|pictures?|photos?|drawings?|visuals?|visions?|renderings?|sketch(?:es)?|paintings?|illustrations?|${VISUAL_OBJECTS_I18N})\\s+(?:μου|μας|imi?|e imja|e mia|meine)`,
  "iu"
);

/** Explicit construction frames — "as an image", "into a picture",
    "in picture form", "als Bild", "comme une image", "como una
    imagen", "come una immagine", "ως εικόνα", "resim olarak" — an
    ask wherever they stand. */
const FORM_FRAME_PATTERN = new RegExp(
  `\\b(?:as|into|in)\\s+(?:an?\\s+|the\\s+)?(?:images?|pics?|pictures?|photos?|visuals?|illustrations?|drawings?|paintings?|infographics?|diagrams?|maps?|renderings?)\\b(?:\\s+form)?|${uWord(VISUAL_FORM_FRAMES_I18N)}`,
  "iu"
);

/** The objects of the OTHER chambers — a card, a book, a poem, a
    record, a remedy, a sound transmission, an intention, a formula.
    When such an object shares the sentence and no strong visual claim
    takes the brush back ("as an image", a picture asked beside the
    verb), the image gate stands down and lets that door's own gate
    decide — and vice versa: the claim always wins the brush back. */
const OTHER_DOOR_OBJECTS_PATTERN = new RegExp(
  `\\b(?:tarot|arcana|oracle\\s+cards?|cards?|spread|deck|book|storybook|poem|poetry|haiku|sonnet|lullaby|akash?ic|records?|remed(?:y|ies)|sigil|intention|formula|invention|transmission|light\\s*codes?)\\b|${uWord(OTHER_DOOR_OBJECTS_I18N)}`,
  "iu"
);

/** Questions that are asks by their own shape — in every tongue. */
const EXPLICIT_ASK_PATTERN = new RegExp(
  `\\bwhat\\s+(?:does|would|might|do)\\s+.{0,80}?\\s+(?:look|appear)\\s+like\\b|${uWord(VISUAL_EXPLICIT_ASK_I18N)}`,
  "iu"
);

/** The speaker narrating their OWN making — past ("I made a
    presentation yesterday"), progressive ("I have been drawing
    little sketches"), habitual ("sometimes I draw") — a story about
    themselves, never a petition to the mirror. */
const PAST_NARRATION_PATTERN = new RegExp(
  [
    "\\bI\\s+(?:drew|painted|showed|made|created|generated|sketched|produced|built|rendered|had|draw|sketch|paint|have\\s+drawn|have\\s+made|have\\s+created|have\\s+been\\s+(?:drawing|painting|sketching|making|creating|showing|building|rendering)|was\\s+(?:drawing|painting|sketching|making|creating)|am\\s+(?:drawing|painting|sketching|making|creating))\\b",
    uWord(SELF_NARRATION_I18N),
  ].join("|"),
  "iu"
);

/** The sentence sitting in remembered time — "when I was young",
    "my grandmother used to paint water" — storytelling, never a
    present petition to the mirror. */
const PAST_CONTEXT_PATTERN = new RegExp(
  [
    "\\b(?:when i was|back when|as a child|as a kid|growing up|used to|yesterday|last (?:year|month|week|night|summer|winter|autumn|spring)|ago|in my childhood|every (?:day|night|week|month|morning|evening|sunday|saturday|summer|winter))\\b",
    uWord(PAST_CONTEXT_I18N),
  ].join("|"),
  "iu"
);

/** The speaker narrating their OWN future making — "I will draw you a
    map someday" — a story about themselves, not a request. */
const FUTURE_NARRATION_PATTERN = new RegExp(
  [
    "\\bI\\s+(?:will|shall)\\s+(?:\\w+\\s+){0,3}?(?:show|draw|paint|sketch|render|depict|portray|illustrate|make|create|generate|produce|channel)\\b",
    uWord(FUTURE_NARRATION_I18N),
  ].join("|"),
  "iu"
);

/** Softened petitions — "can you …", "could you …", "will you …",
    "bitte", "por favor", "lütfen", "σε παρακαλώ", "të lutem". */
const POLITE_PREFIX_PATTERN = new RegExp(
  `^\\s*(?:please|pls|${POLITE_WORDS_I18N})\\b[\\s,:;-]*|\\s*(?:please|pls|${POLITE_WORDS_I18N})[\\s,.!]*$`,
  "giu"
);

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The ask-verb must stand NEAR the image word it serves — an ask is a
 * small machine ("paint me a picture"), not two words that happen to
 * share a long breath of narrative. The verb is sought within the few
 * words BEFORE the object word; distant co-occurrence in one long
 * sentence is conversation, not a request.
 */
function verbNearObject(s: string): boolean {
  const objRe = new RegExp(VISUAL_OBJECT_PATTERN.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(s))) {
    const before = s.slice(Math.max(0, m.index - 34), m.index);
    if (ASK_VERB_PATTERN.test(before)) return true;
  }
  return false;
}

/**
 * One sentence is an image-ask when it holds BOTH a visual object word
 * AND an asking shape — an imperative or polite petition beside it, a
 * form frame ("as an image"), or an explicit "what does it look like"
 * — and none of the guards (meta, negation, reported speech) claim it
 * first.
 */
function isVisualAskSentence(s: string): boolean {
  if (META_MENTION_PATTERN.test(s)) return false;
  if (NEGATION_PATTERN.test(s)) return false;
  if (REPORTED_SPEECH_PATTERN.test(s)) return false;
  if (PAST_NARRATION_PATTERN.test(s)) return false;
  if (FUTURE_NARRATION_PATTERN.test(s)) return false;
  if (PAST_CONTEXT_PATTERN.test(s)) return false;

  const hasObject = VISUAL_OBJECT_PATTERN.test(s);

  /* THE CROSS-DOOR LAW — when another chamber's artifact shares the
     sentence ("draw a card", "write a poem", "my akashic records"),
     the brush stands down unless a visual claim takes it back: the
     image word asked beside the verb, or an explicit form frame
     ("as an image"). A COMPOUND head ("a vision card") belongs to
     the door's own noun, whatever stands before it. */
  const visualClaim =
    (hasObject && verbNearObject(s)) || FORM_FRAME_PATTERN.test(s);
  const dm = OTHER_DOOR_OBJECTS_PATTERN.exec(s);
  if (dm) {
    const vm = new RegExp(VISUAL_OBJECT_PATTERN.source, "i").exec(s);
    const compoundHead =
      vm !== null &&
      dm.index > vm.index &&
      dm.index <= vm.index + vm[0].length + 1;
    if (compoundHead || !visualClaim) return false;
  }

  if (hasObject && verbNearObject(s) && !REFERENCE_PATTERN.test(s)) {
    return true;
  }
  if (hasObject && FORM_FRAME_PATTERN.test(s)) return true;
  if (EXPLICIT_ASK_PATTERN.test(s)) return true;

  /* the short imperative — "draw the council", "a picture of my guide":
     the whole message is one small petition led by the verb or naming
     the picture itself. Meditation speech ("visualize the light moving
     through you") addresses the visitor with you/your and references to
     an existing image ("my pictures from the trip") never count. */
  const bare = s.replace(POLITE_PREFIX_PATTERN, "").trim();
  const words = bare.split(/\s+/);
  if (
    words.length <= 8 &&
    (ASK_VERB_PATTERN.test(bare) || hasObject) &&
    !new RegExp(uWord(`you|your|yourself|yours|${YOU_WORDS_I18N}`), "iu").test(bare) &&
    !REPORTED_SPEECH_PATTERN.test(bare) &&
    !REFERENCE_PATTERN.test(bare) &&
    !OTHER_DOOR_OBJECTS_PATTERN.test(bare)
  ) {
    return true;
  }
  return false;
}

/** The strong product frames — a diagram OF something, a slide deck,
    an encyclopedia page — asks by their own shape. */
const PRODUCT_FRAME_PATTERNS: RegExp[] = [
  /\bdiagram\s+of\b/i,
  /\bmap\s+of\b/i,
  /\binfographic\b/i,
  /\bencyclopedia\s+(page|entry)\b/i,
  /\b(?:presentation|slide\s?deck|slides|ppt|powerpoint)\b/i,
  /\bhow\s+.{0,80}?\s+(?:works?|looks?)\b.{0,40}?\b(?:visually|as\s+a\s+diagram|in\s+a\s+(?:picture|diagram))\b/i,
  /\b(?:picture|image)\s+of\s+(?:this|that|it|them)\b/i,
  /\bshow\s+(?:me\s+)?(?:the\s+|an?\s+|their\s+|its\s+|his\s+|her\s+|your\s+)?(?:\w+\s+){0,2}(?:interior|inside|outside|exterior|city|cities|architecture|planet|planets|galaxy|civilization|structures?|layout|homeworld|temple|temples?|council|kingdom|realm|landscape|world|worlds|home)\b/i,
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

  const parts = sentences(v);
  const direct =
    parts.some(
      (s) =>
        isVisualAskSentence(s) ||
        (EXPLICIT_ASK_PATTERN.test(s) &&
          !PAST_NARRATION_PATTERN.test(s) &&
          !FUTURE_NARRATION_PATTERN.test(s))
    ) ||
    parts.some((s) => {
      if (
        META_MENTION_PATTERN.test(s) ||
        NEGATION_PATTERN.test(s) ||
        REPORTED_SPEECH_PATTERN.test(s) ||
        PAST_NARRATION_PATTERN.test(s) ||
        FUTURE_NARRATION_PATTERN.test(s) ||
        PAST_CONTEXT_PATTERN.test(s)
      ) {
        return false;
      }
      if (!PRODUCT_FRAME_PATTERNS.some((re) => re.test(s))) return false;
      /* the cross-door law — another chamber's artifact in the same
         sentence keeps the brush sheathed unless a visual claim
         (image word beside the verb, or a form frame) takes it back.
         A product's TOPIC is not its object: "make a presentation
         about my book" is a presentation, the book only names it. */
      const hasObject = VISUAL_OBJECT_PATTERN.test(s);
      const visualClaim =
        (hasObject && verbNearObject(s)) || FORM_FRAME_PATTERN.test(s);
      if (OTHER_DOOR_OBJECTS_PATTERN.test(s)) {
        const pm = PRODUCT_FRAME_PATTERNS
          .map((re) => re.exec(s))
          .find((m): m is RegExpExecArray => m !== null);
        let scope = s;
        if (pm) {
          const tail = s.slice(pm.index + pm[0].length);
          if (/^\s+(?:about|of|for|on)\b/i.test(tail)) {
            scope = s.slice(0, pm.index + pm[0].length);
          }
        }
        if (OTHER_DOOR_OBJECTS_PATTERN.test(scope) && !visualClaim) {
          return false;
        }
      }
      return true;
    });
  const followUp = FOLLOW_UP_PATTERNS.some((re) => re.test(v));
  return { direct, followUp };
}
