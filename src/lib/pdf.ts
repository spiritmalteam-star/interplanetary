/* ------------------------------------------------------------------ */
/*  pdf.ts — the binding press.                                        */
/*                                                                     */
/*  Builds a classic ink PDF (Times family, A4) from a structured      */
/*  document produced by the PDF Engine, entirely in the browser via   */
/*  pdf-lib. No server round-trip for the binding itself.              */
/* ------------------------------------------------------------------ */

export interface PdfSectionInput {
  heading: string;
  body: string;
}

export interface PdfDocInput {
  title: string;
  epigraph?: string;
  sections: PdfSectionInput[];
  seal?: string;
  /** Small label at the foot of every page (e.g. "ParticleX"). */
  footerLabel?: string;
}

/* Standard PDF fonts speak WinAnsi — fold the notation glyphs of the
   formulas into shapes a Times page can carry. */
const FOLDS: [RegExp, string][] = [
  [/→|⟶|⇒|⇢/g, "->"],
  [/←|⇐/g, "<-"],
  [/⇔|↔/g, "<->"],
  [/Φ/g, "Phi"],
  [/φ/g, "phi"],
  [/Ψ/g, "Psi"],
  [/ψ/g, "psi"],
  [/Σ/g, "Sum"],
  [/∇/g, "grad"],
  [/∞/g, "oo"],
  [/Δ/g, "Delta"],
  [/δ/g, "delta"],
  [/λ/g, "lambda"],
  [/Ω/g, "Omega"],
  [/ω/g, "omega"],
  [/α/g, "alpha"],
  [/β/g, "beta"],
  [/γ/g, "gamma"],
  [/π/g, "pi"],
  [/θ/g, "theta"],
  [/µ/g, "u"],
  [/≈/g, "~="],
  [/≠/g, "!="],
  [/≤/g, "<="],
  [/≥/g, ">="],
  [/∈/g, " in "],
  [/∉/g, " not in "],
  [/⊗|⊙/g, " x "],
  [/⊕/g, " + "],
  [/✦|✳|◆|❧|✶|✳︎/gu, "*"],
  [/‹/g, "<"],
  [/›/g, ">"],
  [/‑|‑/g, "-"],
];

function toWinAnsi(s: string): string {
  let out = s;
  for (const [re, to] of FOLDS) out = out.replace(re, to);
  /* keep Latin-1 plus the WinAnsi typographic set; anything else -> "?" */
  out = out.replace(
    /[^\u0000-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2020\u2021\u2022\u2026\u20AC\u2122]/g,
    "?"
  );
  return out;
}

/** A short formula plate reads centered and italic on the page. */
function looksLikeFormula(p: string): boolean {
  return p.length <= 96 && /[=×]|->|Phi|Psi|Sum|grad|oo\b/.test(p);
}

function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "the-larger-content";
}

export function pdfFilename(title: string): string {
  return `${slugify(title)}.pdf`;
}

/** Build the PDF bytes. Lazy-imports pdf-lib so the bundle stays light. */
export async function buildInkPdf(input: PdfDocInput): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const A4: [number, number] = [595.28, 841.89];
  const M = 66; /* page margin */
  const W = A4[0] - M * 2;
  const BOTTOM = M + 34; /* keep the footer's air */

  const ink = rgb(0.13, 0.12, 0.11);
  const faint = rgb(0.45, 0.43, 0.4);

  let page = doc.addPage(A4);
  let y = M; /* cursor measured from the TOP of the page */

  const newPage = () => {
    page = doc.addPage(A4);
    y = M;
  };
  const ensure = (h: number) => {
    if (y + h > A4[1] - BOTTOM) newPage();
  };

  const wrap = (text: string, font: import("pdf-lib").PDFFont, size: number): string[] => {
    const out: string[] = [];
    for (const rawLine of toWinAnsi(text).split(/\n/)) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (!words.length) {
        out.push("");
        continue;
      }
      let line = "";
      for (let w of words) {
        /* a word wider than the column is broken with a hyphen */
        while (font.widthOfTextAtSize(w, size) > W) {
          let cut = w.length - 1;
          while (
            cut > 1 &&
            font.widthOfTextAtSize(`${w.slice(0, cut)}-`, size) > W
          )
            cut--;
          const head = `${w.slice(0, cut)}-`;
          if (line) {
            out.push(line);
            line = "";
          }
          out.push(head);
          w = w.slice(cut);
        }
        const cand = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(cand, size) <= W) line = cand;
        else {
          if (line) out.push(line);
          line = w;
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  const drawCentered = (
    text: string,
    font: import("pdf-lib").PDFFont,
    size: number,
    color: ReturnType<typeof rgb>
  ) => {
    const lines = wrap(text, font, size);
    for (const line of lines) {
      ensure(size * 1.3);
      const w = font.widthOfTextAtSize(line, size);
      page.drawText(line, {
        x: (A4[0] - w) / 2,
        y: A4[1] - y - size,
        size,
        font,
        color,
      });
      y += size * 1.3;
    }
  };

  const drawParagraph = (
    text: string,
    size: number,
    leading: number
  ) => {
    const lines = wrap(text, times, size);
    for (const line of lines) {
      ensure(leading);
      page.drawText(line, {
        x: M,
        y: A4[1] - y - size,
        size,
        font: times,
        color: ink,
      });
      y += leading;
    }
  };

  /* ---- the title block ---- */
  drawCentered(input.title, timesBold, 22, ink);
  y += 8;
  if (input.epigraph) {
    drawCentered(input.epigraph, timesItalic, 12, faint);
    y += 6;
  }
  ensure(20);
  page.drawLine({
    start: { x: M + W * 0.18, y: A4[1] - y },
    end: { x: M + W * 0.82, y: A4[1] - y },
    thickness: 0.6,
    color: faint,
  });
  y += 26;

  /* ---- the sections ---- */
  for (const section of input.sections) {
    if (section.heading) {
      ensure(40);
      y += 8;
      drawCentered(section.heading, timesBold, 13.5, ink);
      y += 8;
    }
    for (const para of section.body.split(/\n{2,}/)) {
      const p = para.trim();
      if (!p) continue;
      if (looksLikeFormula(p)) {
        ensure(34);
        y += 5;
        drawCentered(p, timesItalic, 12.5, ink);
        y += 7;
      } else {
        drawParagraph(p, 11.5, 17);
        y += 7;
      }
    }
    y += 6;
  }

  /* ---- the seal ---- */
  if (input.seal) {
    y += 10;
    drawCentered(input.seal, timesItalic, 12, faint);
  }

  /* ---- the foot of every page ---- */
  const pages = doc.getPages();
  const label = toWinAnsi(input.footerLabel ?? "");
  pages.forEach((p, i) => {
    const num = String(i + 1);
    const nw = times.widthOfTextAtSize(num, 9);
    p.drawText(num, {
      x: (A4[0] - nw) / 2,
      y: 26,
      size: 9,
      font: times,
      color: faint,
    });
    if (label) {
      const lw = times.widthOfTextAtSize(label.toUpperCase(), 7.5);
      p.drawText(label.toUpperCase(), {
        x: M,
        y: 26,
        size: 7.5,
        font: times,
        color: faint,
      });
      void lw;
    }
  });

  return doc.save();
}

/** Hand the finished pages to the visitor. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
