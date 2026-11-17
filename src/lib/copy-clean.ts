/* ------------------------------------------------------------------ */
/*  THE COPY'S OWN CLEANLINESS — the diamonds are ELEMENTS, not words. */
/*                                                                     */
/*  The house decorates its truths with crystal glyphs — the diamond   */
/*  bullets beside a paragraph, the gem marks of the crystals. On the  */
/*  SCREEN they are elements (a button, a marker, a jewel); they were  */
/*  never meant to be read as words. THE VISITOR'S LAW: every copy     */
/*  hand in the house runs its text through this one cleaner before    */
/*  the words leave for the clipboard, so no diamond ever falls into   */
/*  a copy — the words alone travel.                                   */
/* ------------------------------------------------------------------ */

/** The diamond family — every glyph the house hangs as an element:
    the crystal bullets (◇ ◆ ◈ ◊), the jewels (♦ ♢), the four-point
    stars (✦ ✧), the lesser marks (✣ ✤ ✥ ❖ ⬥ ⬦ ⟡) and the globes
    the wait wears (◌). Ordinary bullets (- • ·) and every mark of
    punctuation are words' own servants — they stay. */
const DIAMOND_CLASS =
  "\u25C6\u25C7\u25C8\u25CA\u2662\u2666\u2726\u2727\u2723\u2724\u2725\u2756\u2B25\u2B26\u27E1\u2BC1\u25CC";

/** The line-leading diamonds — a bullet glyph that opens a line is a
    marker, not a word: it lifts away and its line's words remain. */
const LEADING_DIAMOND = new RegExp(
  `^[ \\t]*[${DIAMOND_CLASS}][ \\t]*`,
  "gmu"
);
/** Any diamond anywhere — a stray jewel that slipped into the prose
    mid-line lifts away too, its sentence untouched. */
const ANY_DIAMOND = new RegExp(`[${DIAMOND_CLASS}]`, "gu");

/** THE ONE CLEANER — the text a visitor copies, the diamonds gone.
    Used by every copy hand in the house (the room's copy, the share
    hand, the discovery's copy, the views' own hands alike), so the
    law is one law everywhere. */
export function cleanCopyText(text: string): string {
  if (!text) return text;
  return text
    .replace(LEADING_DIAMOND, "")
    .replace(ANY_DIAMOND, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
