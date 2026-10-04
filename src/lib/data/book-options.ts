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

/** What kind of book it becomes. */
export const VOLUMES: BookOption[] = [
  { id: "bedtime", label: "Bedtime treasure" },
  { id: "classic", label: "Classic tale" },
  { id: "saga", label: "Grand saga" },
];

/** The verse forms — books written in stanzas, not prose paragraphs. */
export const VERSE_FORMS = new Set(["poem", "riddle", "ballad"]);

/** The level of lecture — how deep and multidimensional the writing
    reads. A depth gauge of four strata: from the most luminous
    clarity (angel readers) down to the ancient legacy voice whose
    paragraphs run in several dimensions at once. */
export interface LectureLevel {
  id: string;
  label: string;
  /** Roman numeral of the stratum — shown on the depth bar. */
  numeral: string;
  /** What the level does to the writing (i18n dynamic content). */
  depth: string;
}

export const LECTURE_LEVELS: LectureLevel[] = [
  {
    id: "angel",
    label: "Angel readers",
    numeral: "I",
    depth:
      "the most luminous clarity — every word rests open like daylight; the deeper strata still shimmer beneath, gentle as wings",
  },
  {
    id: "cryptic",
    label: "Cryptics",
    numeral: "II",
    depth:
      "veiled speech — symbols, silences and meanings folded beneath the surface, felt before they are understood",
  },
  {
    id: "decipher",
    label: "Decyphres",
    numeral: "III",
    depth:
      "writing as code — ciphers, riddles and layered registers the reader unlocks page by page",
  },
  {
    id: "legacy",
    label: "Legacy reading",
    numeral: "IV",
    depth:
      "the deepest stratum — an ancient legacy voice whose paragraphs run in several dimensions at once, the book quietly reading its reader",
  },
];
