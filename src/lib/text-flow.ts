/* ------------------------------------------------------------------ */
/*  THE ANSWER'S OWN FLOW — a transmission that arrives with a line    */
/*  break after every sentence used to render as tall narrow strips    */
/*  (one short row per line — the visitor named the defect). The flow  */
/*  law re-weaves the words for reading: a PARAGRAPH break (\n\n) is   */
/*  kept as the paragraph it is; a single line break inside a paragraph */
/*  becomes a space — unless the next line is its own list item        */
/*  (a bullet, a dash, a number), which keeps its row.                 */
/*                                                                     */
/*  THE THIN-TALL SECOND COMING (the visitor named it twice): two      */
/*  thinner shapes of the same defect survived the first law, and      */
/*  both are woven shut now —                                          */
/*   ① a line that merely ENDS with a dash kept its break forever, so  */
/*     a prose section written "… the field —\nthe seeing …" stayed a  */
/*     strip; only a TRUE mid-word hyphenation (quantum- / gravity,    */
/*     the next line opening lowercase) may keep its break now.        */
/*   ② the model sometimes breaks the paragraph law itself, setting    */
/*     EVERY sentence alone behind a \n\n wall — the section then      */
/*     reads as a stack of thin one-line strips. A RUN of three or     */
/*     more such thin single-sentence paragraphs is one broken         */
/*     paragraph: the weaver joins it back into the flowing prose it   */
/*     was meant to be (real lists, crystal lines and long paragraphs  */
/*     are never touched).                                             */
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
    /* the list's own law — a real list line keeps its row */
    if (LIST_LINE.test(line)) {
      out += "\n" + line;
    } else if (/[‐-]$/.test(prev) && /^[a-zæøåüöäâçéèêëíìîóòôúùûñ]/.test(line)) {
      /* the verse's narrowest survivor — a TRUE mid-word hyphenation
         ("quantum-" / "gravity") keeps its break; a line that merely
         ends with a dash before a new sentence flows on */
      out += "\n" + line;
    } else {
      out += " " + line.trimStart();
    }
  }
  return out;
}

/* a "thin" paragraph — one short sentence standing alone: the raw
   material of the thin-tall strip when the model stacks several of
   them behind \n\n walls. Lists, crystals and lead-ins never count. */
const THIN_LIMIT = 240;
const isThinPara = (p: string): boolean =>
  p.length > 0 &&
  p.length <= THIN_LIMIT &&
  !p.includes("\n") &&
  !LIST_LINE.test(p) &&
  !p.startsWith("◇") &&
  !p.startsWith("◆") &&
  !p.endsWith(":") &&
  /[.!?…»”"']$/.test(p.trim());

/**
 * Flow the answer's text: paragraph breaks stay paragraphs, single
 * line breaks flow into the paragraph's own prose (list rows keep
 * their rows) — and a run of three or more thin one-sentence
 * paragraphs weaves back into the one flowing paragraph it was meant
 * to be. The words themselves are never touched.
 */
export function flowAnswerText(raw: string): string {
  if (!raw) return raw;
  if (!raw.includes("\n")) return raw;
  /* split on two-or-more newlines — the real paragraph breaks */
  const paras = raw.split(/\n{2,}/).map(flowParagraph);
  const out: string[] = [];
  let run: string[] = [];
  const flushRun = () => {
    if (run.length >= 3) {
      /* the broken paragraph law healed — the run's sentences join
         with the spaces their author's line breaks would have used */
      out.push(run.join(" "));
    } else {
      for (const p of run) out.push(p);
    }
    run = [];
  };
  for (const p of paras) {
    if (isThinPara(p)) {
      run.push(p);
    } else {
      flushRun();
      out.push(p);
    }
  }
  flushRun();
  return out.join("\n\n");
}
