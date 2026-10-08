/* ================================================================== */
/*  THE SHORT BOOK LAW — detection of the visitor's length wish.       */
/*                                                                     */
/*  When the visitor asks for a SHORT book, the loom weaves a SHORT    */
/*  book: a complete tale in a handful of pages — never a long,        */
/*  endless story. This one pattern serves every door of the house:    */
/*  the atelier (DreamBookView), the in-chat weaving instrument        */
/*  (ChatArtifacts) and the loom route itself, in every tongue the     */
/*  house speaks.                                                      */
/* ================================================================== */

/** The spoken shapes of a short-book ask — English, Albanian, Italian,
    Greek, German, French, Spanish, Turkish. */
const SHORT_BOOK_PATTERN = new RegExp(
  [
    /* english */
    "short\\s+(book|story|tale|read|one|version|volume)",
    "little\\s+book",
    "brief\\s+(book|tale|story|read)",
    "quick\\s+read",
    "mini\\s+book",
    "keep\\s+(it|this)\\s+short",
    /* albanian */
    "libr[ëe]\\s+(të\\s+)?shkurt[ëe]",
    "tregim\\s+i\\s+shkurt[ëe]",
    "libër\\s+e\\s+vitit\\s+shkurt", // harmless extra safety
    /* italian */
    "libro\\s+(breve|corto)",
    "racconto\\s+breve",
    "storia\\s+(breve|corta)",
    /* greek */
    "σύντομο\\s*(βιβλίο|ιστορία)",
    "μικρό\\s+βιβλίο",
    "κοντή\\s+ιστορία",
    /* german */
    "kurzes\\s+buch",
    "kurzgeschichte",
    "kleines\\s+buch",
    /* french */
    "livre\\s+court",
    "petite\\s+histoire",
    "histoire\\s+courte",
    "récit\\s+court",
    /* spanish */
    "libro\\s+(corto|breve)",
    "historia\\s+corta",
    "cuento\\s+(corto|breve)",
    /* turkish */
    "kısa\\s+(kitap|hik[âa]ye|öykü)",
  ].join("|"),
  "i"
);

/** True when the visitor's own words ask for a short book. */
export function detectShortBookAsk(text: string | undefined | null): boolean {
  if (!text) return false;
  return SHORT_BOOK_PATTERN.test(text);
}
