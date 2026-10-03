import { readFileSync } from "fs";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/* ------------------------------------------------------------------ */
/*  THE QUICK-TRANSMISSION PRESS — the shared PDF renderer of the      */
/*  Laboratory's scribes (ParticleX · Evolve Med). Minimal ink on      */
/*  white pages: a serif transmission with the title gathered at the   */
/*  head of the first page, one movement per page, and quiet page      */
/*  numbers. The DejaVu faces are embedded through fontkit so every    */
/*  language renders true.                                             */
/* ------------------------------------------------------------------ */

export interface Transmission {
  title: string;
  era: string;
  pages: string[];
  seal: string;
}

export interface PressOptions {
  /** The small caps line at the head of page 1. */
  header: string;
  producer: string;
  creator: string;
}

const SERIF_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf";
const SERIF_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf";
const SANS_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN_X = 68;
const MARGIN_TOP = 74;
const MARGIN_BOTTOM = 82;

const INK = rgb(0.13, 0.12, 0.11);
const INK_SOFT = rgb(0.42, 0.4, 0.38);
const HAIRLINE = rgb(0.62, 0.6, 0.57);

function sanitize(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      /* a single word longer than the line — hard-split it */
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > maxWidth) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        current = rest;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderTransmissionPdf(
  t: Transmission,
  opts: PressOptions
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(sanitize(t.title).slice(0, 120) || "A Transmission Received");
  doc.setProducer(opts.producer);
  doc.setCreator(opts.creator);

  const serif = await doc.embedFont(readFileSync(SERIF_PATH), { subset: true });
  const serifBold = await doc.embedFont(readFileSync(SERIF_BOLD_PATH), { subset: true });
  const sans = await doc.embedFont(readFileSync(SANS_PATH), { subset: true });

  const contentW = PAGE_W - MARGIN_X * 2;

  /* ---------- the head of the first page — title, hairline, era ----- */
  const first = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_TOP;

  const header = sanitize(opts.header).toUpperCase();
  first.drawText(header, {
    x: (PAGE_W - sans.widthOfTextAtSize(header, 8)) / 2,
    y,
    size: 8,
    font: sans,
    color: INK_SOFT,
  });
  y -= 44;

  for (const line of wrap(sanitize(t.title), serifBold, 23, contentW)) {
    const w = serifBold.widthOfTextAtSize(line, 23);
    first.drawText(line, { x: (PAGE_W - w) / 2, y, size: 23, font: serifBold, color: INK });
    y -= 30;
  }
  y -= 8;
  first.drawLine({
    start: { x: PAGE_W / 2 - 56, y },
    end: { x: PAGE_W / 2 + 56, y },
    thickness: 0.7,
    color: HAIRLINE,
  });
  y -= 24;
  for (const line of wrap(sanitize(t.era), serif, 10, contentW - 90)) {
    const w = serif.widthOfTextAtSize(line, 10);
    first.drawText(line, { x: (PAGE_W - w) / 2, y, size: 10, font: serif, color: INK_SOFT });
    y -= 15;
  }
  y -= 16;

  /* ---------- the movements — one page-block per page --------------- */
  type Sheet = { page: PDFPage; y: number };
  let sheet: Sheet = { page: first, y };
  const freshSheet = (): Sheet => ({ page: doc.addPage([PAGE_W, PAGE_H]), y: PAGE_H - MARGIN_TOP });

  t.pages.forEach((pageBlock, pageIndex) => {
    if (pageIndex > 0) sheet = freshSheet();

    const paragraphs = pageBlock
      .split(/\n{2,}|\n/)
      .map((p) => sanitize(p))
      .filter(Boolean);

    for (const paragraph of paragraphs) {
      const lines = wrap(paragraph, serif, 10.5, contentW);
      for (let li = 0; li < lines.length; li++) {
        /* a paragraph never begins on the page's last two lines */
        if (sheet.y < MARGIN_BOTTOM || (li === 0 && sheet.y - 16.5 * 2 < MARGIN_BOTTOM)) {
          sheet = freshSheet();
        }
        sheet.page.drawText(lines[li], {
          x: MARGIN_X,
          y: sheet.y,
          size: 10.5,
          font: serif,
          color: INK,
        });
        sheet.y -= 16.5;
      }
      sheet.y -= 10; /* the breath between paragraphs */
    }
  });

  /* the seal — quiet, at the transmission's end (a little tolerance so
     it never spills onto an extra page) */
  const sealText = sanitize(t.seal);
  if (sealText) {
    if (sheet.y - 30 < MARGIN_BOTTOM - 18) sheet = freshSheet();
    sheet.y -= 12;
    const w = serif.widthOfTextAtSize(sealText, 10.5);
    sheet.page.drawText(sealText, {
      x: (PAGE_W - w) / 2,
      y: sheet.y,
      size: 10.5,
      font: serif,
      color: INK_SOFT,
    });
  }

  /* ---------- the quiet page numbers ---------- */
  doc.getPages().forEach((p, i) => {
    const label = `${i + 1}`;
    const w = sans.widthOfTextAtSize(label, 8.5);
    p.drawText(label, {
      x: (PAGE_W - w) / 2,
      y: 46,
      size: 8.5,
      font: sans,
      color: INK_SOFT,
    });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
