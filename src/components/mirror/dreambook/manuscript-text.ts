/* ------------------------------------------------------------------ */
/*  THE INK DESK'S PLAIN-TEXT BRIDGE — pure, dependency-free helpers   */
/*  that carry the manuscript across the two forms the book speaks:    */
/*  the rich HTML the pen writes and the clean plain text every other  */
/*  hand in the house already reads (the voice, the binding press,     */
/*  the loose-leaf press, the shelf). No imports, no I/O — safe        */
/*  anywhere.                                                          */
/* ------------------------------------------------------------------ */

/** Escape a plain-text run into a safe HTML text node body. */
function escapeHtml(plain: string): string {
  return plain
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * THE GRACEFUL MIGRATION — a page's old plain text (paragraphs joined
 * by blank lines) laid onto the editor's paper: every double newline
 * opens a paragraph, every single newline a soft break, every stray
 * angle bracket kept honest. A page woven by the loom reads exactly
 * as it was woven — the pen changes nothing until a hand touches it.
 */
export function plainTextToManuscriptHtml(plain: string): string {
  const text = (plain ?? "").replace(/\r\n?/g, "\n");
  if (!text.trim()) return "";
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * THE READING HAND — the editor's plain text folded back into the
 * book's own paragraphs (blank lines separate, soft breaks stay).
 * An emptied leaf keeps one empty paragraph, so the page never
 * loses its place in the volume.
 */
export function paragraphsFromEditorText(text: string): string[] {
  const paragraphs = (text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+$/gm, "").trim())
    .filter((p) => p.length > 0);
  return paragraphs.length > 0 ? paragraphs : [""];
}
