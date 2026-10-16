/* ================================================================== */
/*  downloads-log.ts — the shelf of bound works.                       */
/*                                                                     */
/*  Every book the visitor binds into a PDF keeps itself here — on     */
/*  their own device (localStorage), never on a server — so the        */
/*  profile's DOWNLOADS section can always hand the same volume        */
/*  back: bound again with one touch, no loom needed.                  */
/*                                                                     */
/*  THE SHELF'S LAW: at most 8 volumes rest here; the newest push the  */
/*  oldest off quietly. Everything stored is the volume's own words    */
/*  (meta + pages), never a binary — the PDF is pressed fresh at the   */
/*  moment of the download.                                            */
/* ================================================================== */

import { downloadBookPdf } from "@/lib/book-pdf";

const KEY = "mirror-downloads";
const CAP = 8;

export interface DownloadEntry {
  id: string;
  kind: "book";
  title: string;
  subtitle?: string;
  pages: number;
  boundAt: string;
  /* the volume's own payload — enough to press the same PDF again */
  meta: {
    title: string;
    subtitle?: string;
    sigil?: string;
    axiom?: string;
    dedication?: string;
    totalPages?: number;
  };
  pageList: {
    n: number;
    chapter?: string;
    paragraphs: string[];
  }[];
}

export function listDownloads(): DownloadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is DownloadEntry =>
          e && typeof e === "object" && typeof e.title === "string" &&
          Array.isArray(e.pageList)
      )
      .slice(0, CAP);
  } catch {
    return [];
  }
}

export function recordDownload(
  entry: Omit<DownloadEntry, "id" | "kind" | "boundAt">
): void {
  if (typeof window === "undefined") return;
  try {
    const full: DownloadEntry = {
      ...entry,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      kind: "book",
      boundAt: new Date().toISOString(),
    };
    /* a volume bound twice keeps its newest binding only */
    const rest = listDownloads().filter(
      (e) => e.title !== entry.title || e.kind !== full.kind
    );
    const next = [full, ...rest].slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* the shelf never breaks the binding — storage may rest full */
  }
}

export async function bindAgain(entry: DownloadEntry): Promise<void> {
  await downloadBookPdf(
    entry.meta,
    entry.pageList.map((p) => ({
      n: p.n,
      ...(p.chapter ? { chapter: p.chapter } : {}),
      paragraphs: p.paragraphs,
    }))
  );
}
