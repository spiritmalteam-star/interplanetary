/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — IMAGE CRYSTALLIZATION · the intent gate            */
/*  When the visitor speaks of an image — "an image", "a image",       */
/*  "picture", "pic", "visual", "visualize", "crystallize into an      */
/*  image", "channel an image", "make it into an image" and the        */
/*  common misspellings — the mirror does not travel the usual LLM     */
/*  round-trip: the LAST CHANNEL (its most recent reply) is at once    */
/*  crystallized into an image, shaped by the visitor's own words.     */
/*                                                                     */
/*  Safe on client and server: no imports, no I/O.                     */
/* ------------------------------------------------------------------ */

/**
 * One tolerant, word-bounded, case-insensitive family for every way an
 * image is asked for by name. Word boundaries keep the neighboring
 * words out ("pic" never wakes inside "picnic", "image" never wakes
 * inside "imagine" — "imagine" is a different word entirely, and only
 * an explicit "… as an image" still triggers, via "image" itself).
 */
const VISUAL_INTENT_PATTERN = new RegExp(
  [
    /* image family — image, images, imagery + iamge(s), imge(s) */
    "\\bi(?:mages?|amges?|mges?|magery)\\b",
    /* pic, pics */
    "\\bpics?\\b",
    /* picture family — picture(s), pictue(s), pictuer(s), pictyre(s) */
    "\\bpict(?:ures?|ues?|uers?|yres?)\\b",
    /* photo, photos */
    "\\bphotos?\\b",
    /* visual family — visual(s), viusal(s), visuali[sz]e(d?), …ation */
    "\\bv(?:isuals?|iusals?|isuali[sz]e[ds]?|iusali[sz]e[ds]?|isuali[sz]ation|iusali[sz]ation)\\b",
    /* crystallize family — crystalli[sz]e, crystalise, cristalize,
       crystali[sz]ing, crystalli[sz]ation … across the usual swaps */
    "\\bc(?:ry|ri)stall?i[sz](?:e[ds]?|ing|ation)\\b",
  ].join("|"),
  "i"
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

/**
 * True when the visitor's words ask for an image to be crystallized.
 * Tolerant of the common misspellings, deaf to "imagine" — to imagine
 * is to dream, not to ask for a picture — and deaf to prompt-asks:
 * the atelier answers those with a text form, not an image.
 */
export function isVisualIntent(text: string): boolean {
  const v = text.trim();
  if (!v || v.length < 3) return false;
  if (PROMPT_ASK_PATTERN.test(v)) return false;
  return VISUAL_INTENT_PATTERN.test(v);
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
