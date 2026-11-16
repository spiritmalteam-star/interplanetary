/* ================================================================== */
/*  book-layout.ts — THE BOOK'S ONE LAYOUT SPECIFICATION.              */
/*                                                                     */
/*  The failure this module ends: the visitor's page number was read   */
/*  as a count of STORY pages (the loom's own leaves, lean or full),  */
/*  while the binding press pours those pages into A4 sheets by real  */
/*  capacity — so a "120-page" book wove ~99 thin story pages (~7,000 */
/*  words) and bound them into 13 physical sheets, and the length     */
/*  gates (300 × 0.55, 170, 60, 350 — four different private laws)    */
/*  all passed it. Four constants, four answers, no truth.            */
/*                                                                     */
/*  THE ONE LAW: the visitor's page number is a BOUND-PAGE requirement */
/*  — physical sheets in the exported book, measured by the press's   */
/*  own geometry. Everything else derives from here:                  */
/*                                                                      */
/*    wordBudget     = boundPages × wordsPerSheet(age)                 */
/*    storyPageTarget = ceil(wordBudget / storyWordsPerPage(age))      */
/*                                                                     */
/*  The loom weaves story pages until the WORD BUDGET is written; the */
/*  gate measures the manuscript against the same budget; the press   */
/*  sets its type from the same age spec; the reader speaks the same  */
/*  numbers. One specification, one truth, no inflated counts.        */
/* ================================================================== */

/** The sheet itself — shared by the binding press (book-pdf.ts). */
export const BOOK_TRIM = {
  width: 595.28, /* A4 portrait, points */
  height: 841.89,
  margin: 68,
  /** no text below this line (folio zone included) */
  bottom: 68 + 34,
} as const;

export interface BookLayoutSpec {
  /** the age key the whole house speaks: little | young | teen | grown | timeless */
  age: string;
  /** body type — the press sets these; the measure derives from them */
  bodySize: number;
  leading: number;
  paraGap: number;
  chapterSize: number;
  chapterLeading: number;
  /** THE PRESS'S CARRYING CAPACITY — words of flowing prose one bound
      sheet honestly holds with this typography (analytic measure with
      the paragraph breath and the chapter openings amortized in). */
  wordsPerSheet: number;
  /** what the loom writes on ONE STORY PAGE for this age — picture-book
      pages are bright and brief; grown pages carry full prose. */
  storyWordsPerPage: number;
  label: string;
}

const LAYOUTS: Record<string, BookLayoutSpec> = {
  /* ages 4–8 — large warm type, airy sheets: a real picture-book page.
     The measure is CALIBRATED against the press's own bound output
     (a chapter every ~12 leaves costs its fresh-opening sheet; the
     constants amortize that cost — verified by the press probe). */
  little: {
    age: "little",
    bodySize: 13.5,
    leading: 22,
    paraGap: 12,
    chapterSize: 16.5,
    chapterLeading: 22,
    wordsPerSheet: 280,
    storyWordsPerPage: 110,
    label: "little dreamers (4–8)",
  },
  /* ages 9–12 — chapter-book measure */
  young: {
    age: "young",
    bodySize: 12.5,
    leading: 20,
    paraGap: 10.5,
    chapterSize: 16,
    chapterLeading: 21,
    wordsPerSheet: 335,
    storyWordsPerPage: 170,
    label: "young readers (9–12)",
  },
  /* ages 13–17 */
  teen: {
    age: "teen",
    bodySize: 12,
    leading: 19,
    paraGap: 10,
    chapterSize: 15.5,
    chapterLeading: 20,
    wordsPerSheet: 380,
    storyWordsPerPage: 210,
    label: "teen readers (13–17)",
  },
  /* grown readers — the classic novel page */
  grown: {
    age: "grown",
    bodySize: 11.5,
    leading: 17.5,
    paraGap: 9,
    chapterSize: 15.5,
    chapterLeading: 21,
    wordsPerSheet: 425,
    storyWordsPerPage: 300,
    label: "grown readers",
  },
  /* all ages — the storybook voice, chapter-book measure */
  timeless: {
    age: "timeless",
    bodySize: 12.5,
    leading: 20,
    paraGap: 10.5,
    chapterSize: 16,
    chapterLeading: 21,
    wordsPerSheet: 335,
    storyWordsPerPage: 170,
    label: "all ages",
  },
};

/** The spec for an age key — unknown keys land on the all-ages page. */
export function specForAge(age?: string | null): BookLayoutSpec {
  return LAYOUTS[age ?? ""] ?? LAYOUTS.timeless;
}

/** THE HONEST TOLERANCE — a bound sheet never holds its full analytic
    measure (front matter, part dividers, chapter openings on fresh
    leaves, the last page of every chapter half-carrying). The gates
    pass a manuscript that holds near nine tenths of its budget; the
    press's real count is always reported as measured, never rounded
    up to please anyone. */
export const LENGTH_TOLERANCE = 0.88;

export interface BoundPlan {
  /** the visitor's number — bound sheets in the exported book */
  boundPages: number;
  /** the words the manuscript must carry: boundPages × wordsPerSheet */
  wordBudget: number;
  /** story pages the loom weaves: ceil(wordBudget / storyWordsPerPage) */
  storyPageTarget: number;
  spec: BookLayoutSpec;
}

/** THE PLANNING LAW — the visitor's page number becomes a word budget
    and a story-page target, both derived from the ONE layout spec. */
export function planFromBoundPages(
  boundPages: number,
  age?: string | null
): BoundPlan {
  const spec = specForAge(age);
  const safe = Number.isFinite(boundPages) && boundPages >= 8 ? Math.floor(boundPages) : 0;
  const wordBudget = safe > 0 ? Math.round(safe * spec.wordsPerSheet) : 0;
  const storyPageTarget =
    wordBudget > 0 ? Math.ceil(wordBudget / spec.storyWordsPerPage) : 0;
  return { boundPages: safe, wordBudget, storyPageTarget, spec };
}

/** THE READER'S OWN ESTIMATE — how many bound sheets the press would
    bind from this many words (used for the honest on-screen count;
    the press's own verified count always outranks it). */
export function estimateBoundPages(
  words: number,
  age?: string | null
): number {
  if (!(words > 0)) return 0;
  const spec = specForAge(age);
  return Math.max(1, Math.round(words / spec.wordsPerSheet));
}

/** The words a set of paragraphs holds — the one counting law. */
export function countWords(paragraphs: string[]): number {
  let n = 0;
  for (const p of paragraphs) {
    n += p.split(/\s+/).filter(Boolean).length;
  }
  return n;
}
