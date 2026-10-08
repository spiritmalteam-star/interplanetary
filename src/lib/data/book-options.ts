/* ------------------------------------------------------------------ */
/*  BOOK OPTIONS — the shared shape-drawer of the Dream Book.          */
/*  One source of truth for the atelier (DreamBookView) and the        */
/*  in-chat weaving instrument (BookWeaver): who reads, what shape     */
/*  the tale takes, and what kind of book it becomes.                  */
/*  Every label is an i18n key (English source).                       */
/* ------------------------------------------------------------------ */

export interface BookOption {
  id: string;
  label: string;
}

/** Who holds the book — the reading eyes. */
export const READERS: BookOption[] = [
  { id: "little", label: "Little dreamers (4–8)" },
  { id: "young", label: "Young readers (9–12)" },
  { id: "teen", label: "Teens (13–17)" },
  { id: "grown", label: "Grown dreamers" },
  { id: "timeless", label: "All ages" },
];

/** What shape the tale takes — including the verse forms. */
export const TALES: BookOption[] = [
  { id: "fairytale", label: "Fairy tale" },
  { id: "adventure", label: "Adventure" },
  { id: "mystery", label: "Gentle mystery" },
  { id: "cosmic", label: "Cosmic journey" },
  { id: "creatures", label: "Creature friends" },
  { id: "fantasy", label: "Fantasy quest" },
  { id: "bedtime", label: "Dreamlike calm" },
  { id: "wonder", label: "Everyday wonder" },
  { id: "poem", label: "Poem" },
  { id: "riddle", label: "Riddle" },
  { id: "ballad", label: "Ballad" },
];

/** What kind of book it becomes. The SHORT book is the visitor's own
    ask honored: a complete tale in a handful of pages — the loom's
    SHORT BOOK LAW (see src/lib/book-length.ts and the route). */
export const VOLUMES: BookOption[] = [
  { id: "short", label: "Short book" },
  { id: "bedtime", label: "Bedtime treasure" },
  { id: "classic", label: "Classic tale" },
  { id: "saga", label: "Grand saga" },
];

/** The verse forms — books written in stanzas, not prose paragraphs. */
export const VERSE_FORMS = new Set(["poem", "riddle", "ballad"]);

/** The depth of the telling — how deep and multidimensional the book
    reads. FIVE drawn steps, shown visually as 1 2 3 4 5: from the
    clearest daylight (a book like most books, easily comprehensible)
    down to the multidimensional voice whose story, structure and
    reader all scale together. */
export interface BookDepth {
  id: string;
  label: string;
  /** The depth numeral — shown on the depth bar. */
  numeral: string;
  /** What the depth does to the writing (i18n dynamic content). */
  depth: string;
}

export const BOOK_DEPTHS: BookDepth[] = [
  {
    id: "d1",
    label: "Clear daylight",
    numeral: "1",
    depth:
      "the book most books are — one clear story, one steady voice, a structure every reader knows by heart; everything open, everything understood",
  },
  {
    id: "d2",
    label: "Hidden streams",
    numeral: "2",
    depth:
      "the classic shape keeps its form, but undercurrents begin — recurring symbols, quiet foreshadowing, a story that means more than it says",
  },
  {
    id: "d3",
    label: "Twilight layers",
    numeral: "3",
    depth:
      "two tellings at once — the tale above and its meaning beneath; echoes and mirrors fold back on earlier pages and reward the second reading",
  },
  {
    id: "d4",
    label: "The deep grammar",
    numeral: "4",
    depth:
      "writing as code — layered registers, riddles and ciphers, each unlock deepening every page before it; the structure itself begins to bend",
  },
  {
    id: "d5",
    label: "The multidimensional",
    numeral: "5",
    depth:
      "the deepest telling — paragraphs running in several dimensions at once, time folding, the book quietly reading its reader; story, structure and reader scale together",
  },
];
