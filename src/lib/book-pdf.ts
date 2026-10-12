/* ------------------------------------------------------------------ */
/*  book-pdf.ts — the Dream Book's own binding press (client side).    */
/*                                                                     */
/*  Binds a woven volume — front matter and every page — into one      */
/*  classic ink PDF (A4, serif, page numbers, chapter openings),       */
/*  entirely in the browser. The DejaVu serif faces are embedded       */
/*  through fontkit so every tongue the house speaks renders true      */
/*  (Latin, Greek, Cyrillic — the whole press).                        */
/* ------------------------------------------------------------------ */

export interface BookPdfMeta {
  title: string;
  subtitle?: string;
  sigil?: string;
  axiom?: string;
  dedication?: string;
  totalPages?: number;
}

export interface BookPdfPage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

const SERIF_URL = "/fonts/DejaVuSerif.ttf";
const SERIF_BOLD_URL = "/fonts/DejaVuSerif-Bold.ttf";

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

/** Bind the volume. Throws when the press jams — the caller speaks. */
export async function downloadBookPdf(
  meta: BookPdfMeta,
  pages: BookPdfPage[]
): Promise<void> {
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

  const A4: [number, number] = [595.28, 841.89];
  const M = 68;
  const W = A4[0] - M * 2;
  const BOTTOM = M + 30;

  const ink = rgb(0.16, 0.14, 0.13);
  const soft = rgb(0.42, 0.4, 0.38);
  const faint = rgb(0.62, 0.6, 0.57);

  const wrap = (text: string, font: typeof serif, size: number): string[] => {
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
        if (font.widthOfTextAtSize(cand, size) <= W) {
          line = cand;
        } else {
          if (line) out.push(line);
          line = w;
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  let page = doc.addPage(A4);
  let y = M;

  const newPage = () => {
    page = doc.addPage(A4);
    y = M;
  };

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

  /* ------------------- the story pages ------------------- */
  for (const p of pages) {
    newPage();
    y = M;
    if (p.chapter) {
      for (const l of wrap(p.chapter, serifBold, 14.5)) {
        page.drawText(l, { x: M, y, size: 14.5, font: serifBold, color: ink });
        y += 20;
      }
      y += 6;
    }
    for (const para of p.paragraphs) {
      const lines = wrap(para, serif, 11.5);
      for (const l of lines) {
        if (y > A4[1] - BOTTOM) newPage();
        page.drawText(l, { x: M, y, size: 11.5, font: serif, color: ink });
        y += 17.5;
      }
      y += 9; /* the breath between paragraphs */
    }
    const num = String(p.n);
    page.drawText(num, {
      x: A4[0] / 2 - serif.widthOfTextAtSize(num, 9) / 2,
      y: 40,
      size: 9,
      font: serif,
      color: faint,
    });
  }

  /* ------------------- the seal of closing ------------------- */
  newPage();
  {
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
}
