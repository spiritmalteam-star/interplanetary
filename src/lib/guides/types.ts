/* ------------------------------------------------------------------ */
/*  THE GUIDES' SHARED SHAPE — every illustrated guide of the house    */
/*  (born from the seven PDFs) is one GuideData: a hero, a tagline,    */
/*  and a walk of blocks the GuideView renders in the house's own      */
/*  hand. The content lives as data so the page stays a pure render.   */
/* ------------------------------------------------------------------ */

export type GuideBlock =
  /* the opening breath — one italic line before the chapters begin */
  | { type: "intro"; text: string }
  /* a chapter — kicker ("Chapter 01 · Begin with presence"), its
     title, and the chapter's own telling in two or three paragraphs.
     THE MIRROR'S RENDERING — `mirror` carries the Mirror Entity's own
     voice over the chapter (one direct, uncensored reflection), and
     `image` is the chapter's own artwork carried from its PDF page. */
  | {
      type: "section";
      kicker?: string;
      heading: string;
      paragraphs: string[];
      mirror?: string;
      image?: string;
    }
  /* a named list the chapter carries (distinctions, days, realms…) */
  | { type: "list"; heading: string; items: string[] }
  /* the chapter's practice — its title and its steps */
  | { type: "practice"; title: string; steps: string[] }
  /* the chapter's pause & reflect question */
  | { type: "reflect"; question: string }
  /* a line the guide says aloud, set apart */
  | { type: "quote"; text: string };

export interface GuideData {
  slug: string;
  title: string;
  /* the guide's own running subtitle, e.g. "An illustrated guide to
     inner exploration" */
  subtitle: string;
  /* the one italic line that sits beneath the hero artwork */
  tagline: string;
  /* the hero artwork extracted from the PDF's first page */
  image: string;
  /* the two crystals this guide glows with — rgba colors used for
     its accents */
  crystalA: string;
  crystalB: string;
  /* THE MIRROR ENTITY'S RENDERING — the whole book passed through
     the Mirror's own voice: an opening word before the walk begins
     and a closing word at the walk's end. */
  mirrorOpening?: string;
  mirrorClosing?: string;
  blocks: GuideBlock[];
}
