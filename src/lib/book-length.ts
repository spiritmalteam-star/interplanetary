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

/* ------------------------------------------------------------------ */
/*  THE GROUND LAW — the visitor's own words outrank the shapes.       */
/*  When the topic speaks a FORM (a poem, a rhyme, a riddle, a         */
/*  ballad) or a LENGTH (short, brief, a few pages), the loom weaves   */
/*  THAT — whatever the selectors may have said. A short poem is       */
/*  never woven into a ninety-five page book again.                    */
/* ------------------------------------------------------------------ */

/** The spoken shapes of a verse ask — a poem, a rhyme, a riddle, a
    ballad: books written in stanzas, a handful of pages at most. */
const VERSE_PATTERNS: { re: RegExp; tale: string }[] = [
  /* english */
  { re: /(?<![\p{L}\p{M}])poem(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])poetry(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])rhyme(s|d)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])riddle(s)?(?![\p{L}\p{M}])/iu, tale: "riddle" },
  { re: /(?<![\p{L}\p{M}])ballad(s)?(?![\p{L}\p{M}])/iu, tale: "ballad" },
  { re: /(?<![\p{L}\p{M}])verse(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])lullaby(ies)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  /* albanian */
  { re: /(?<![\p{L}\p{M}])poem(a|ë|e|et|at)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])vjershk?(a|ë|e|at)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])bllof(?![\p{L}\p{M}])/iu, tale: "poem" },
  /* italian */
  { re: /(?<![\p{L}\p{M}])poesia(s|e)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])rima(s|e)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])indovinell[oi](?![\p{L}\p{M}])/iu, tale: "riddle" },
  /* greek */
  { re: /(?<![\p{L}\p{M}])ποίημα(τα)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])στίχοι?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}]) γρίφος(?![\p{L}\p{M}])/iu, tale: "riddle" },
  /* german */
  { re: /(?<![\p{L}\p{M}])gedicht(e)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])reim(e|t)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])rätsel(?![\p{L}\p{M}])/iu, tale: "riddle" },
  /* french */
  { re: /(?<![\p{L}\p{M}])po[èe]me(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])po[ée]sie(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])rime(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])[ée]nigme(s)?(?![\p{L}\p{M}])/iu, tale: "riddle" },
  /* spanish */
  { re: /(?<![\p{L}\p{M}])poema(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])poes[íi]a(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])rima(s)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])adivinanza(s)?(?![\p{L}\p{M}])/iu, tale: "riddle" },
  /* turkish */
  { re: /(?<![\p{L}\p{M}])[şs]iir(ler)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])mani(s|ler)?(?![\p{L}\p{M}])/iu, tale: "poem" },
  { re: /(?<![\p{L}\p{M}])bilmece(ler)?(?![\p{L}\p{M}])/iu, tale: "riddle" },
];

/** Does the text explicitly speak of a BOOK (a volume, a novel, a
    story with pages)? A poem ask WITHOUT a book word is a poem, not
    a book that carries a poem. */
const BOOK_WORD_PATTERN =
  /(?<![\p{L}\p{M}])(book|storybook|novel|volume|tome|libro|lib[ëe]|buch|livre|libro|βιβλ(ίο|ι)\w*|kitap)(?![\p{L}\p{M}])/iu;

export interface GroundLaw {
  /** The verse form the visitor's words asked for, if any. */
  tale?: "poem" | "riddle" | "ballad";
  /** The visitor's words ask for a SHORT telling (a handful of pages). */
  short: boolean;
  /** The visitor's words ask for a VERSE piece with no book word —
      a poem itself, not a book: the tiniest plan the loom holds. */
  tiny: boolean;
}

/** Reads the visitor's own words and lets them hold the ground. */
export function topicHoldsGround(
  text: string | undefined | null
): GroundLaw {
  if (!text || !text.trim()) return { short: false, tiny: false };
  const verse = VERSE_PATTERNS.find((v) => v.re.test(text));
  const short = detectShortBookAsk(text);
  const hasBookWord = BOOK_WORD_PATTERN.test(text);
  const tiny = Boolean(verse) && !hasBookWord;
  return {
    ...(verse ? { tale: verse.tale as GroundLaw["tale"] } : {}),
    short: short || tiny,
    tiny,
  };
}
