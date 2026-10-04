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
