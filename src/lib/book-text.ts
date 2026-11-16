/* ------------------------------------------------------------------ */
/*  MIRROR ENTITY — the book text keeper                               */
/*  Small, pure helpers shared by every reading room of the            */
/*  laboratory (the chat's weaving instrument and the Dream Book       */
/*  world alike). Safe on client and server: no imports, no I/O.       */
/* ------------------------------------------------------------------ */

export interface BookTextPage {
  n: number;
  part?: string;
  chapter?: string;
  paragraphs: string[];
}

/**
 * THE COHERENT CHAPTER — chapters are titled only where they truly
 * open. The loom sometimes repeats a chapter title on every page it
 * returns; this keeper lets only the FIRST page of each distinct
 * title carry the chapter (and with it the drop cap), so the volume
 * reads like a book — most pages begin as plain, clean prose, and a
 * great letter rises only when a new chapter truly begins.
 * THE COHERENT PART — the same law for the book's parts: a part is
 * announced once, on the page that opens it, and never again.
 */
export function dedupeChapters<T extends BookTextPage>(pages: T[]): T[] {
  const seen = new Set<string>();
  const seenParts = new Set<string>();
  let out: T[] | null = null;
  pages.forEach((p, i) => {
    const raw = (p.chapter ?? "").trim().toLowerCase();
    const rawPart = (p.part ?? "").trim().toLowerCase();
    const keepChapter = raw && !seen.has(raw);
    const keepPart = rawPart && !seenParts.has(rawPart);
    if (raw) seen.add(raw);
    if (rawPart) seenParts.add(rawPart);
    if (keepChapter && keepPart) {
      if (out) out.push(p);
      return;
    }
    if (!out) out = pages.slice(0, i);
    out.push({
      ...p,
      ...(keepChapter ? {} : { chapter: undefined }),
      ...(keepPart ? {} : { part: undefined }),
    });
  });
  return out ?? pages;
}

/**
 * The whole volume as one long, faithful text — the copy button's
 * cargo: front matter first, then every page with its chapter titles,
 * exactly as the reader met them.
 */
export function bookToText(
  meta: {
    title?: string;
    subtitle?: string;
    sigil?: string;
    axiom?: string;
    dedication?: string;
  } | null | undefined,
  pages: BookTextPage[]
): string {
  const head: string[] = [];
  if (meta?.title) head.push(meta.title);
  if (meta?.subtitle) head.push(meta.subtitle);
  if (meta?.sigil) head.push(`✦ ${meta.sigil}`);
  if (meta?.axiom) head.push(meta.axiom);
  if (meta?.dedication) head.push(meta.dedication);

  const body = pages.map((p) => {
    const parts: string[] = [];
    if (p.part) parts.push(p.part);
    if (p.chapter) parts.push(p.chapter);
    parts.push(...p.paragraphs);
    return parts.join("\n\n");
  });

  return [...head, ...body].filter(Boolean).join("\n\n");
}
