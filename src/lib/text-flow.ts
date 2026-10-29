/* ------------------------------------------------------------------ */
/*  THE ANSWER'S OWN FLOW — a transmission that arrives with a line    */
/*  break after every sentence used to render as tall narrow strips    */
/*  (one short row per line — the visitor named the defect). The flow  */
/*  law re-weaves the words for reading: a PARAGRAPH break (\n\n) is   */
/*  kept as the paragraph it is; a single line break inside a paragraph */
/*  becomes a space — unless the next line is its own list item        */
/*  (a bullet, a dash, a number), which keeps its row.                 */
/* ------------------------------------------------------------------ */

const LIST_LINE = /^\s*([-–—•*]|\d+[.)])\s/;

/** Re-weave one paragraph's internal line breaks into flowing prose. */
function flowParagraph(para: string): string {
  const lines = para.split("\n");
  if (lines.length <= 1) return para;
  let out = lines[0].trimEnd();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prev = lines[i - 1].trimEnd();
    /* the verse's own law — a line that ends mid-word with a hanging
       hyphen keeps its break; a list line keeps its row */
    if (LIST_LINE.test(line) || prev.endsWith("-")) {
      out += "\n" + line;
    } else {
      out += " " + line.trimStart();
    }
  }
  return out;
}

/**
 * Flow the answer's text: paragraph breaks stay paragraphs, single
 * line breaks flow into the paragraph's own prose (list rows keep
 * their rows). The words themselves are never touched.
 */
export function flowAnswerText(raw: string): string {
  if (!raw) return raw;
  if (!raw.includes("\n")) return raw;
  /* split on two-or-more newlines — the real paragraph breaks */
  return raw
    .split(/\n{2,}/)
    .map(flowParagraph)
    .join("\n\n");
}
