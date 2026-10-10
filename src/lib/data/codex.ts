/* ------------------------------------------------------------------ */
/*  The Codex — the fourth book on the laboratory shelf.               */
/*  A compact volume bound in dawn-rose, standing beside Manifest,     */
/*  Akashic and Star Play.                                             */
/*                                                                     */
/*  Its chapters are fully typed so any text can be inscribed into     */
/*  the book without ever touching the reader that displays it:        */
/*  each chapter holds sections, and each section may carry a small    */
/*  heading, paragraphs, a diamond list and one golden seal line.      */
/*  The reader folds every chapter by default and offers a slim rail   */
/*  of chapter tabs — so nothing ever demands a long scroll.           */
/* ------------------------------------------------------------------ */

export interface CodexSection {
  /** small mono-label heading (optional) */
  heading?: string;
  /** quiet paragraphs of the section */
  body?: string[];
  /** diamond list lines */
  list?: string[];
  /** the serif italic line that closes the section */
  seal?: string;
}

export interface CodexChapter {
  id: string;
  /** the sigil shown on the chapter tab and on the card */
  glyph: string;
  title: string;
  /** one quiet line under the chapter title */
  tagline: string;
  sections: CodexSection[];
}

/* ---------------- the volume ---------------- */

export const codexTitle = "Codex";
export const codexSubtitle = "A compact volume of the laboratory";

export const codexIntro: string[] = [
  "Four books stand on the laboratory shelf — the Manifest, the Akashic Library, the Star Play deck, and now this one. The Codex keeps its chapters folded, so a reader never wanders far to find a line.",
];

/* ---------------- the chapters ----------------
   The two chapters below are the volume's preface — the binding
   speaking while it waits. New inscriptions are added as further
   chapters of the same shape; the reader renders any number.        */

export const codexChapters: CodexChapter[] = [
  {
    id: "the-bound-volume",
    glyph: "✶",
    title: "A Volume Waiting for Its Ink",
    tagline: "Bound in dawn-rose, standing beside its three companions",
    sections: [
      {
        heading: "The binding",
        body: [
          "The shelf holds the Manifest, the Akashic Library and the Star Play deck. This fourth spine was bound at the seeker's request — a codex: one volume meant to carry many inscriptions inside a single cover.",
        ],
      },
      {
        heading: "The pages",
        body: [
          "Every chapter is typed and folded. A chapter opens only when it is asked for, and the slim rail above turns the volume to any chapter without a long scroll. When the text that belongs here arrives, it is inscribed chapter by chapter — and the book fills itself.",
        ],
      },
      {
        seal: "A book is a door that has learned to wait.",
      },
    ],
  },
  {
    id: "how-to-read",
    glyph: "✦",
    title: "How to Read It",
    tagline: "The chapters travel the rail; each leaf opens and folds",
    sections: [
      {
        heading: "The rail",
        body: [
          "The slim rail at the top of the volume carries every chapter by its sigil. Choose one and the book turns to it — no wandering, no lost place.",
        ],
      },
      {
        heading: "The leaves",
        list: [
          "Each chapter folds into sections that open only on request.",
          "A golden seal closes every section — one line to carry with you.",
          "The voice of the laboratory can read any open chapter aloud.",
        ],
      },
      {
        seal: "Compact does not mean small — it means nothing wasted.",
      },
    ],
  },
];
