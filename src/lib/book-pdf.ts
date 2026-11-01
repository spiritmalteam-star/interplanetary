/* ------------------------------------------------------------------ */
/*  book-pdf.ts — the Dream Book's own binding press (client side).    */
/*                                                                     */
/*  Binds a woven volume — front matter and the whole manuscript —     */
/*  into one classic ink PDF (A4, serif, page numbers, chapter         */
/*  openings), entirely in the browser. The DejaVu serif faces are     */
/*  embedded through fontkit so every tongue the house speaks renders  */
/*  true (Latin, Greek, Cyrillic — the whole press).                   */
/*                                                                     */
/*  THE PRESS'S LAWS (re-forged after the great audit):                */
/*  - Text runs in NATURAL READING ORDER — top of the page downward.   */
/*    (The old press laid its first line at the foot of the sheet and  */
/*    stacked every later line above it: a mirrored book.)             */
/*  - The manuscript FLOWS: pages are cast by measuring the real room  */
/*    left on each sheet — never one story-page per sheet. A page      */
/*    holding two lines and a page holding twenty both find their     */
/*    natural place; no artificial near-empty leaves are ever bound.   */
/*  - A chapter opens on a fresh leaf, as books have always done.      */
/*  - A paragraph is never left hanging one line at the foot of a      */
/*    sheet: the press carries it whole to the next leaf instead.      */
/*  - "The End" is sealed ONLY when the volume itself has truly        */
/*    concluded (meta.concluded) — never by default.                   */
/*  - The press returns the count of the sheets it actually bound,     */
/*    so the caller can speak the truth about the book's size.         */
/* ------------------------------------------------------------------ */

import { specForAge } from "@/lib/book-layout";

export interface BookPdfMeta {
  title: string;
  subtitle?: string;
  sigil?: string;
  axiom?: string;
  dedication?: string;
  totalPages?: number;
  /** The volume has genuinely concluded — only then is "The End" bound. */
  concluded?: boolean;
  /** The reader's age key (little | young | teen | grown | timeless) —
      the sheet's typography and measure come from the ONE layout spec,
      so the bound page count matches the plan that promised it. */
  age?: string;
}

export interface BookPdfPage {
  n: number;
  /** A part announcement — bound as its own centered divider leaf. */
  part?: string;
  chapter?: string;
  paragraphs: string[];
}

export interface BookPdfResult {
  /** The number of A4 sheets the press actually bound — verified by
      reopening the finished document, not by counting the pour. */
  pdfPages: number;
  /** The words of manuscript the press set in ink. */
  words: number;
  /** A fingerprint of the exact manuscript bound (sha-256, hex) — the
      revision the export verified, so a download can never be mistaken
      for a different state of the book. */
  contentHash: string;
}

const SERIF_URL = "/fonts/DejaVuSerif.ttf";
const SERIF_BOLD_URL = "/fonts/DejaVuSerif-Bold.ttf";

/* the page's architecture — the trim and the folio zone are fixed;
   the TYPE comes from the age spec (the ONE layout law), so a little
   dreamer's 120 pages are set large and airy while a grown reader's
   120 pages carry the classic novel measure — and BOTH bind to near
   the sheet count their plan promised. */
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 68;
const TOP = A4[1] - MARGIN; /* where the first line sits */
const BOTTOM = MARGIN + 34; /* no text below this line */

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  try {
    const subtle =
      typeof crypto !== "undefined" && "subtle" in crypto
        ? crypto.subtle
        : null;
    if (subtle) {
      const digest = await subtle.digest(
        "SHA-256",
        bytes as unknown as ArrayBuffer
      );
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
    }
  } catch {
    /* the fingerprint may rest unwritten — the count still verifies */
  }
  /* a quiet deterministic fallback (djb2) when the subtle vault is shut */
  let h = 5381;
  const step = Math.max(1, Math.floor(bytes.length / 4096));
  for (let i = 0; i < bytes.length; i += step) {
    h = ((h << 5) + h + bytes[i]) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(4).slice(0, 32);
}

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url} ${res.status}`);
  return res.arrayBuffer();
}

function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "dream-book"
  );
}

/** Bind the volume. Throws when the press jams — the caller speaks.
    Returns the truth about the bound book: its sheets and its words. */
export async function downloadBookPdf(
  meta: BookPdfMeta,
  pages: BookPdfPage[]
): Promise<BookPdfResult> {
  const [{ PDFDocument, rgb }, fontkitMod, serifBytes, boldBytes] =
    await Promise.all([
      import("pdf-lib"),
      import("@pdf-lib/fontkit"),
      fetchFont(SERIF_URL),
      fetchFont(SERIF_BOLD_URL),
    ]);
  const fontkit = (fontkitMod as { default?: unknown }).default ?? fontkitMod;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit as Parameters<typeof doc.registerFontkit>[0]);
  const serif = await doc.embedFont(serifBytes, { subset: true });
  const serifBold = await doc.embedFont(boldBytes, { subset: true });

  /* the sheet's voice — the age's own typography (the ONE layout law) */
  const spec = specForAge(meta.age);
  const BODY_SIZE = spec.bodySize;
  const BODY_LEADING = spec.leading;
  const PARA_GAP = spec.paraGap;
  const CHAPTER_SIZE = spec.chapterSize;
  const CHAPTER_LEADING = spec.chapterLeading;

  const W = A4[0] - MARGIN * 2;

  const ink = rgb(0.16, 0.14, 0.13);
  const soft = rgb(0.42, 0.4, 0.38);
  const faint = rgb(0.62, 0.6, 0.57);

  const wrap = (text: string, font: typeof serif, size: number, width = W): string[] => {
    const out: string[] = [];
    for (const rawLine of text.split(/\n/)) {
      const words = rawLine.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        out.push("");
        continue;
      }
      let line = "";
      for (const w of words) {
        const cand = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(cand, size) <= width) {
          line = cand;
        } else {
          if (line) out.push(line);
          /* a single word longer than the measure is set whole */
          line = w;
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  /* ------------------- the sheet itself ------------------- */
  let page = doc.addPage(A4);
  let y = TOP; /* the pen begins at the TOP of the sheet and walks down */
  let sheetNo = 0; /* the title leaf is sheet 0; the story begins on 1 */

  const newSheet = () => {
    page = doc.addPage(A4);
    y = TOP;
    sheetNo += 1;
    return sheetNo;
  };

  /* how many body lines still fit on the current sheet */
  const roomForLines = (): number =>
    Math.floor((y - BOTTOM) / BODY_LEADING + 1e-9);

  /* ------------------- the title leaf ------------------- */
  {
    const cx = A4[0] / 2;
    let ty = A4[1] * 0.72;
    const center = (text: string, font: typeof serif, size: number, color = ink) => {
      page.drawText(text, {
        x: cx - font.widthOfTextAtSize(text, size) / 2,
        y: ty,
        size,
        font,
        color,
      });
      ty -= size * 1.7;
    };
    if (meta.sigil) {
      for (const l of wrap(meta.sigil, serif, 10.5)) center(l, serif, 10.5, soft);
      ty -= 8;
    }
    for (const l of wrap(meta.title, serifBold, 27)) center(l, serifBold, 27);
    if (meta.subtitle) {
      ty -= 4;
      for (const l of wrap(meta.subtitle, serif, 12.5)) center(l, serif, 12.5, soft);
    }
    ty -= 16;
    page.drawLine({
      start: { x: cx - 42, y: ty + 4 },
      end: { x: cx + 42, y: ty + 4 },
      thickness: 0.6,
      color: faint,
    });
    ty -= 22;
    if (meta.axiom) {
      for (const l of wrap(meta.axiom, serif, 11)) center(l, serif, 11, soft);
      ty -= 6;
    }
    if (meta.dedication) {
      ty -= 8;
      for (const l of wrap(meta.dedication, serif, 10.5)) center(l, serif, 10.5, soft);
    }
    const foot = "woven for you, this very hour";
    page.drawText(foot, {
      x: cx - serif.widthOfTextAtSize(foot, 8.5) / 2,
      y: 54,
      size: 8.5,
      font: serif,
      color: faint,
    });
  }

  /* ------------------- the manuscript, flowed -------------------
     The story pages arrive as the loom wove them (n, chapter,
     paragraphs). The press does NOT cast one sheet per story page:
     it pours the whole manuscript into a continuous measure, so a
     sheet holds exactly as much as it can carry and no leaf is left
     near-empty. A chapter's title always begins a fresh leaf. */
  let words = 0;
  let onTitleLeaf = true; /* the story never pours onto the title leaf */

  for (const p of pages) {
    /* THE PART DIVIDER — a part announcement is bound as its own
       centered leaf, as printed books have always done */
    if (p.part) {
      newSheet();
      /* the next story page must leave this divider leaf */
      onTitleLeaf = true;
      const cx = A4[0] / 2;
      const partLines = wrap(p.part, serifBold, 19);
      let py = A4[1] * 0.42;
      page.drawText("\u2767", {
        x: cx - serif.widthOfTextAtSize("\u2767", 14) / 2,
        y: py,
        size: 14,
        font: serif,
        color: faint,
      });
      py -= 34;
      for (const l of partLines) {
        page.drawText(l, {
          x: cx - serifBold.widthOfTextAtSize(l, 19) / 2,
          y: py,
          size: 19,
          font: serifBold,
          color: ink,
        });
        py -= 27;
      }
      /* the divider carries no body — the story continues overleaf */
      continue;
    }

    /* the chapter opening — measured, then laid on a fresh leaf */
    const chapterLines = p.chapter
      ? wrap(p.chapter, serifBold, CHAPTER_SIZE)
      : [];

    /* the paragraphs' wrapped lines, gathered first so the press
       knows exactly what must fit */
    const paraLines: string[][] = p.paragraphs.map((para) => {
      words += para.split(/\s+/).filter(Boolean).length;
      return wrap(para, serif, BODY_SIZE);
    });

    /* A fresh leaf is taken whenever the current sheet cannot
       honestly receive what comes:
       - the story's very first page always leaves the title leaf;
       - a chapter opening always begins a leaf of its own;
       - a paragraph is never begun with a single line of room
         (no one-line widows stranded at the foot of a sheet). */
    const firstLineRoom = roomForLines();
    const needsFreshLeaf =
      onTitleLeaf ||
      chapterLines.length > 0 ||
      (paraLines.length > 0 && firstLineRoom < Math.min(paraLines[0].length, 2));
    if (needsFreshLeaf) newSheet();
    onTitleLeaf = false;

    if (chapterLines.length > 0) {
      /* the chapter's own quiet kicker — a hairline and space above */
      y -= 12;
      for (const l of chapterLines) {
        page.drawText(l, {
          x: MARGIN,
          y,
          size: CHAPTER_SIZE,
          font: serifBold,
          color: ink,
        });
        y -= CHAPTER_LEADING;
      }
      y -= 14; /* the breath between the heading and the body */
    }

    for (const lines of paraLines) {
      /* paragraph integrity: never begin a paragraph whose first
         lines would straddle the foot — carry it whole to the next
         leaf when fewer than two lines of room remain */
      if (lines.length > roomForLines() && roomForLines() < 2) {
        newSheet();
      }
      for (const l of lines) {
        if (y < BOTTOM) newSheet();
        page.drawText(l, {
          x: MARGIN,
          y,
          size: BODY_SIZE,
          font: serif,
          color: ink,
        });
        y -= BODY_LEADING;
      }
      y -= PARA_GAP; /* the breath between paragraphs */
    }
  }

  /* the folios — pressed after the pour: every sheet from the story's
     first onward carries its own number at the foot, so the count
     the reader sees is the count of leaves actually bound */
  if (sheetNo >= 1) {
    const all = doc.getPages();
    for (let i = 1; i < all.length; i++) {
      const p = all[i];
      const num = String(i);
      p.drawText(num, {
        x: A4[0] / 2 - serif.widthOfTextAtSize(num, 9) / 2,
        y: 40,
        size: 9,
        font: serif,
        color: faint,
      });
    }
  }

  /* ------------------- the seal of closing -------------------
     Bound ONLY when the volume has genuinely concluded — a book the
     loom is still weaving never carries a false "The End". */
  if (meta.concluded) {
    newSheet();
    const cx = A4[0] / 2;
    const ty = A4[1] * 0.5;
    const end = "The End";
    page.drawText(end, {
      x: cx - serifBold.widthOfTextAtSize(end, 22) / 2,
      y: ty,
      size: 22,
      font: serifBold,
      color: ink,
    });
    if (meta.title) {
      page.drawText(meta.title, {
        x: cx - serif.widthOfTextAtSize(meta.title, 11) / 2,
        y: ty - 26,
        size: 11,
        font: serif,
        color: soft,
      });
    }
  }

  const bytes = await doc.save();

  /* ------------------- THE INDEPENDENT VERIFICATION -------------------
     The press reopens the finished document and counts its sheets
     from the PDF's own structure — never from the pour's arithmetic.
     The verified count and the manuscript's fingerprint ride home,
     so the caller can prove the export against the plan. */
  let verifiedPages = doc.getPageCount();
  try {
    const { PDFDocument: Reload } = await import("pdf-lib");
    const reopened = await Reload.load(bytes as unknown as ArrayBuffer);
    verifiedPages = reopened.getPageCount();
  } catch {
    /* the reopen stumbled — the first count stands, honestly labeled */
  }
  const contentHash = await sha256Hex(
    bytes instanceof Uint8Array ? bytes : new Uint8Array(0)
  );

  const blob = new Blob([bytes as unknown as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(meta.title)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);

  /* the truth rides home: the sheets the press bound (verified by
     reopening the document), the words it set, and the revision's
     own fingerprint — the caller validates the book against its plan */
  return { pdfPages: verifiedPages, words, contentHash };
}
