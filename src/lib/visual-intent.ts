/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — IMAGE CRYSTALLIZATION · the intent gate            */
/*  When the visitor ASKS for an image — "an image", "picture",        */
/*  "visual", "crystallize into an image", "channel an image" — the    */
/*  mirror does not travel the usual LLM round-trip: the LAST CHANNEL  */
/*  (its most recent reply) is at once crystallized into an image,     */
/*  shaped by the visitor's own words.                                 */
/*                                                                     */
/*  THE LONG-CONTEXT LAW — the gate reads SENTENCES, never the whole   */
/*  text at once. A long message that merely MENTIONS images ("I       */
/*  visualize the council when I meditate", "my drawings", "the image  */
/*  creator opened twice", "I don't need an image") is a conversation, */
/*  not a crystallization. A sentence asks for an image only when an   */
/*  image-word and an ASKING SHAPE share that sentence — and none of   */
/*  the guards (meta-mention, negation, reported speech, reference to  */
/*  an existing image) claim it first.                                 */
/*                                                                     */
/*  Safe on client and server: no imports beyond the tongue packs, no
/*  I/O.                                                               */
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

/**
 * One tolerant, word-bounded, case-insensitive family for every way an
 * image is named. Word boundaries keep the neighboring words out
 * ("pic" never wakes inside "picnic", "image" never wakes inside
 * "imagine" — to imagine is to dream, not to ask for a picture).
 */
const VISUAL_OBJECT_PATTERN = new RegExp(
  [
    /* image family — image, images, imagery + iamge(s), imge(s) */
    "\\bi(?:mages?|amges?|mges?|magery)\\b",
    /* pic, pics */
    "\\bpics?\\b",
    /* picture family — picture(s), pictue(s), pictuer(s), pictyre(s) */
    "\\bpict(?:ures?|ues?|uers?|yres?)\\b",
    /* photo, photos */
    "\\bphotos?\\b",
    /* visual family — NOUNS only: visual(s), viusal(s), visuali[sz]ation */
    "\\bv(?:isuals?|iusals?|isuali[sz]ation|iusali[sz]ation)\\b",
    /* vision, visions — the Mirror's own word for a crystallized sight */
    "\\bvisions?\\b",
    /* crystallization — the NOUN form; the verb lives in ASK_VERB */
    "\\bc(?:ry|ri)stall?i[sz]ation\\b",
    /* drawn forms — drawing(s), sketch(es), painting(s), illustration(s) */
    "\\b(?:drawings?|sketch(?:es)?|paintings?|illustrations?)\\b",
    /* EVERY TONGUE — das Bild, l'image, la imagen, la Immagine,
       η εικόνα, resim, imazh */
    uWord(VISUAL_OBJECTS_I18N),
  ].join("|"),
  "iu"
);

/**
 * The verbs that can carry an ask. Present tense only — "showed" and
 * "drew" narrate the past; they never petition the mirror.
 */
const ASK_VERB_PATTERN = new RegExp(
  `\\b(?:show|draw|paint|sketch|render|depict|portray|illustrate|make|create|generate|give|produce|channel|crystallize|crystallise|visualize|visualise|turn|${VISUAL_ASK_VERBS_I18N})\\b`,
  "iu"
);

/** Meta-speech about the image machinery itself — never a request. */
const META_MENTION_PATTERN = new RegExp(
  `\\b(?:image|picture|photo|visual)s?\\s+(?:creator|creators|generator|generators?|generation|engine|engines?|tools?|features?|models?|sections?|doors?|pipe?lines?)\\b|${uWord(VISUAL_META_I18N)}`,
  "iu"
);

/** A sentence that declines or excludes an image — the opposite ask,
    in every tongue. */
const NEGATION_PATTERN = new RegExp(
  `\\b(?:no|not|without|never|nothing|don'?t|do not|doesn'?t|no need (?:for|of)|not looking for|${NEGATION_WORDS_I18N})\\b[^.!?]{0,32}\\b(?:images?|pics?|pictures?|photos?|visuals?|drawings?|sketch(?:es)?|paintings?|illustrations?|${VISUAL_OBJECTS_I18N})\\b`,
  "iu"
);

/** Reported speech — "my therapist asked me to draw", "the book says
    to picture a door" — someone else's ask, never the visitor's.
    Past and third-person forms only: the bare forms ("draw me",
    "show me") are the visitor's own imperative, never narration. */
const REPORTED_SPEECH_PATTERN = new RegExp(
  `\\b(?:asked|told|suggested|recommended|said|wrote|claimed|taught|teaches|teaching|says|tells|suggests|recommends|writes|claims|asks|${REPORTED_SPEECH_I18N})\\b[^.!?]{0,40}\\b(?:me|us|him|her|them|to|that|us|mir|mich|moi|nous|vous|me|nos|ti|ci|μου|μας|σου|του|της|bana|bize|mua|mu)\\b`,
  "iu"
);

/** A sentence about an EXISTING image — referencing, not requesting,
    in every tongue ("meine Bilder", "mes dessins", "mis dibujos",
    "le mie immagini", "τα σχέδιά μου", "benim resimlerim"). */
const REFERENCE_PATTERN = new RegExp(
  `\\b(?:the|this|that|these|those|my|your|his|her|their|${POSSESSIVE_I18N})\\s+(?:images?|pics?|pictures?|photos?|drawings?|visuals?|visions?|renderings?|sketch(?:es)?|paintings?|illustrations?|imagery|${VISUAL_OBJECTS_I18N})\\b|(?:images?|pics?|pictures?|photos?|drawings?|visuals?|visions?|renderings?|sketch(?:es)?|paintings?|illustrations?|${VISUAL_OBJECTS_I18N})\\s+(?:μου|μας|imi?|e imja|e mia|meine)`,
  "iu"
);

/** Explicit construction frames — "as an image", "into a picture",
    "als Bild", "comme une image", "como una imagen", "come una
    immagine", "ως εικόνα", "resim olarak" — an ask wherever they
    stand inside the sentence. */
const FORM_FRAME_PATTERN = new RegExp(
  `\\b(?:as|into|in)\\s+(?:an?\\s+|the\\s+)?(?:images?|pics?|pictures?|photos?|visuals?|illustrations?|drawings?|paintings?|renderings?)\\b(?:\\s+form)?|${uWord(VISUAL_FORM_FRAMES_I18N)}`,
  "iu"
);

/** The objects of the OTHER chambers — a card, a book, a poem, a
    record, a remedy, a sound transmission, an intention, a formula.
    When such an object shares the sentence and no strong visual claim
    takes the brush back ("as an image", a picture asked beside the
    verb), the image gate stands down and lets that door's own gate
    decide — a card is drawn by the deck, a poem woven by the loom,
    and only "show it as an image" returns the brush to the atelier. */
const OTHER_DOOR_OBJECTS_PATTERN = new RegExp(
  `\\b(?:tarot|arcana|oracle\\s+cards?|cards?|spread|deck|book|storybook|poem|poetry|haiku|sonnet|lullaby|akash?ic|records?|remed(?:y|ies)|sigil|intention|formula|invention|transmission|light\\s*codes?)\\b|${uWord(OTHER_DOOR_OBJECTS_I18N)}`,
  "iu"
);

/** Softened petitions — leading/trailing "please", "bitte",
    "s'il vous plaît", "por favor", "lütfen", "të lutem", "σε παρακαλώ". */
const POLITE_PREFIX_PATTERN = new RegExp(
  `^\\s*(?:please|pls|${POLITE_WORDS_I18N})\\b[\\s,:;-]*|\\s*(?:please|pls|${POLITE_WORDS_I18N})[\\s,.!]*$`,
  "giu"
);

/**
 * The ask FOR a prompt is never an ask for an image. "Art prompt",
 * "image prompt", "a prompt I can paste into any image engine" — the
 * visitor wants WORDS to carry elsewhere (the atelier's text forms),
 * not a crystallization of their own. This guard keeps the gate deaf
 * to every prompt-shaped ask, whatever engine it names.
 */
const PROMPT_ASK_PATTERN =
  /\b(?:art|image|picture|photo|video|writing)\s+prompts?\b|\bprompts?\b[^.!?]{0,32}\b(?:paste|image engine|generat|midjourney|dall|stable diffusion|firefly)\b/i;

/** Explicit questions that are asks by their own shape — "what does
    it look like", "wie sieht es aus", "à quoi ressemble-t-il",
    "cómo se ve", "come appare", "πώς μοιάζει", "nasıl görünür",
    "si duket". */
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

function splitSentences(text: string): string[] {
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
 * One sentence asks for an image when it holds an image-word AND an
 * asking shape — an imperative/petition verb beside it, a form frame —
 * and no guard claims it first.
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

  /* the short imperative — "a picture of the council", "draw my guide":
     the whole message is one small petition. References to an existing
     image ("my pictures from the trip") never count. */
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

/**
 * True when the visitor's words ask for an image to be crystallized.
 * Long-context safe: every SENTENCE must ask in its own right — a mere
 * mention of images anywhere in a long message never wakes the gate.
 */
export function isVisualIntent(text: string): boolean {
  const v = text.trim();
  if (!v || v.length < 3) return false;
  if (PROMPT_ASK_PATTERN.test(v)) return false;
  return splitSentences(v).some(isVisualAskSentence);
}

/**
 * The visitor's words, lightly cleaned — the leading courtesies fall
 * away, the essence stays. This is the request the image is shaped by.
 */
export function visualSubject(text: string): string {
  const base = text.trim();
  const cleaned = base
    .replace(/^(?:please|pls)\b[\s,:;-]*/i, "")
    .replace(/^(?:please|pls)\b[\s,:;-]*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : base;
}

/**
 * The crystallization request: the visitor's words shape it, the last
 * channel (the mirror's most recent reply in that thread) is its
 * subject. With no previous reply, the image crystallizes from the
 * visitor's own words alone.
 */
export function blendVisualRequest(
  userText: string,
  lastReply?: string | null
): string {
  const ask = visualSubject(userText);
  const context = (lastReply ?? "").trim().replace(/\s+/g, " ").slice(0, 600);
  if (!context) return ask;
  return `${ask} — crystallize this into an image. The subject is the last channel, the Mirror's most recent reply: "${context}". Let the visitor's words above shape how it is seen.`;
}
