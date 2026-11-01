/* ------------------------------------------------------------------ */
/*  book-qc.ts — the manuscript's honest examiner.                     */
/*                                                                     */
/*  When the loom seals a volume, the room reads the whole manuscript  */
/*  back BEFORE the book may call itself finished. The examiner:       */
/*                                                                     */
/*  - measures the manuscript (words, chapters, pages) against the     */
/*    plan, so "a 300-page novel" is never confused with a 40-page     */
/*    pamphlet wearing its name — generated PAGE COUNT is never        */
/*    mistaken for narrative LENGTH;                                   */
/*  - detects repetitive descriptions: near-duplicate sentences and    */
/*    long shared phrases across pages (the channel's one habit that   */
/*    must never reach a reader twice);                                */
/*  - detects philosophical restatements: the same abstract cadence    */
/*    returning with new words and no new meaning;                     */
/*  - detects missing characters: named figures the ledger knows who   */
/*    vanish from the final stretch of the book;                       */
/*  - detects unresolved plotlines: promises and foreshadowings the    */
/*    ledger still holds open at the seal;                             */
/*  - detects thin chapters and pages that carry no story movement     */
/*    (insufficient progression);                                      */
/*  - and returns a verdict: whether the volume may truly end.         */
/*                                                                     */
/*  The examiner is mechanical and honest: it never guesses at         */
/*  literary worth — only at structure, repetition and completion.     */
/* ------------------------------------------------------------------ */

import type { BookLedger } from "@/lib/book-ledger";

export interface QcPage {
  n: number;
  chapter?: string;
  paragraphs: string[];
}

export interface QcIssue {
  kind:
    | "repetition"
    | "restatement"
    | "missing-character"
    | "unresolved-plot"
    | "thin-chapter"
    | "thin-page"
    | "length"
    | "chapters";
  severity: "note" | "warn" | "block";
  message: string;
}

export interface QcStats {
  pages: number;
  words: number;
  chapters: number;
  /** estimated properly-typeset A4 pages at ~350 words per page */
  estTypesetPages: number;
}

export interface QcReport {
  stats: QcStats;
  issues: QcIssue[];
  /** true when a blocking issue forbids the seal of closing */
  blocking: boolean;
}

/* A plan's fullness: how many words one woven page should carry when
   the book is told in full pages (novels, grown tellings). Picture-
   book pages are honest at far fewer words. */
export const FULL_PAGE_WORDS = 300;
export const FULL_PAGE_TOLERANCE = 0.55; /* 55% of full is still a page */

const STOP = new Set([
  "the","a","an","and","or","but","of","to","in","on","at","for","with",
  "from","by","as","is","was","were","are","be","been","it","its","this",
  "that","these","those","he","she","they","them","his","her","their",
  "not","no","so","if","then","than","into","up","down","out","over",
]);

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 5);
}

function shingles(text: string, k: number): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + k <= words.length; i++) {
    out.add(words.slice(i, i + k).join(" "));
  }
  return out;
}

/** content words only — the skeleton of a sentence */
function contentKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .join(" ");
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function qcManuscript(
  pages: QcPage[],
  ledger: BookLedger | null,
  plan: { expectsFullPages: boolean; plannedPages: number }
): QcReport {
  const issues: QcIssue[] = [];

  /* ---------------- the manuscript's measures ---------------- */
  let words = 0;
  const pageWords: number[] = [];
  const chapterStart = new Map<string, number>();
  for (const p of pages) {
    const w = p.paragraphs.reduce(
      (acc, para) => acc + para.split(/\s+/).filter(Boolean).length,
      0
    );
    pageWords.push(w);
    words += w;
    if (p.chapter && !chapterStart.has(p.chapter)) {
      chapterStart.set(p.chapter, p.n);
    }
  }
  const chapters = ledger?.chapters?.length ?? chapterStart.size;
  const estTypesetPages = Math.max(1, Math.round(words / 350));

  /* ---------------- length vs the plan ----------------
     The woven page count is NOT the narrative length. When the plan
     promised full pages, the manuscript must hold enough words to
     typeset near the planned count; when it promised a picture book,
     far fewer words per page are honest. */
  const expectedWords = plan.expectsFullPages
    ? plan.plannedPages * FULL_PAGE_WORDS * FULL_PAGE_TOLERANCE
    : plan.plannedPages * 60; /* picture-book pages, gently judged */
  if (pages.length > 0 && words < expectedWords * 0.45) {
    issues.push({
      kind: "length",
      severity: "block",
      message: `The manuscript holds ${words} words — far short of the ${plan.plannedPages} woven pages it claims. The page count was mistaken for the narrative length.`,
    });
  } else if (pages.length > 0 && words < expectedWords) {
    issues.push({
      kind: "length",
      severity: "warn",
      message: `The manuscript holds ${words} words; the plan asked for near ${Math.round(expectedWords)}.`,
    });
  }

  /* ---------------- chapters must exist for long books ---------------- */
  if (plan.plannedPages >= 96 && chapters === 0 && pages.length > 8) {
    issues.push({
      kind: "chapters",
      severity: "block",
      message:
        "A book of this length opened no chapters at all — the spine of the volume is missing.",
    });
  } else if (plan.plannedPages >= 96 && chapters < 3 && pages.length > 8) {
    issues.push({
      kind: "chapters",
      severity: "warn",
      message: `Only ${chapters} chapter(s) stand in a volume of ${pages.length} pages.`,
    });
  }

  /* ---------------- repetitive descriptions ----------------
     Every pair of distant pages is compared by 8-word shingles; a
     high overlap means the same description is being worn twice. */
  const pageShingles = pages.map((p) =>
    shingles(p.paragraphs.join(" "), 8)
  );
  let worstPair: { a: number; b: number; score: number } | null = null;
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 2; j < Math.min(pages.length, i + 12); j++) {
      const score = jaccard(pageShingles[i], pageShingles[j]);
      if (!worstPair || score > worstPair.score) {
        worstPair = { a: pages[i].n, b: pages[j].n, score };
      }
    }
  }
  if (worstPair && worstPair.score >= 0.32) {
    issues.push({
      kind: "repetition",
      severity: worstPair.score >= 0.5 ? "warn" : "note",
      message: `Pages ${worstPair.a} and ${worstPair.b} share ${Math.round(
        worstPair.score * 100
      )}% of their phrasing — the same description told twice.`,
    });
  }

  /* ---------------- philosophical restatement ----------------
     The same abstract cadence returning: content-word skeletons of
     long sentences colliding across the volume. */
  const skeletons = new Map<string, number[]>();
  pages.forEach((p, idx) => {
    for (const s of sentences(p.paragraphs.join(" "))) {
      const key = contentKey(s);
      if (key.split(" ").length < 8) continue;
      const hits = skeletons.get(key);
      if (hits) hits.push(p.n);
      else skeletons.set(key, [p.n]);
    }
    void idx;
  });
  for (const [, hits] of skeletons) {
    if (hits.length >= 2) {
      issues.push({
        kind: "restatement",
        severity: "note",
        message: `A sentence's exact cadence returns on pages ${hits.slice(0, 4).join(", ")} — a restatement, not a development.`,
      });
      break;
    }
  }

  /* ---------------- missing characters ----------------
     Named figures the ledger keeps who never appear in the final
     third of the book — the cast thinning out behind the seal. */
  if (ledger?.characters?.length && pages.length >= 12) {
    const finalThird = pages.slice(Math.floor(pages.length * (2 / 3)));
    const lateText = finalThird.map((p) => p.paragraphs.join(" ")).join(" ");
    const missing: string[] = [];
    for (const line of ledger.characters) {
      const name = line.split(/[—–:(-]/)[0]?.trim();
      if (!name || name.split(/\s+/).length > 3) continue;
      if (!lateText.toLowerCase().includes(name.toLowerCase())) {
        missing.push(name);
      }
    }
    if (missing.length > 0) {
      issues.push({
        kind: "missing-character",
        severity: missing.length > 2 ? "warn" : "note",
        message: `Named figures absent from the final stretch: ${missing.slice(0, 4).join(", ")}.`,
      });
    }
  }

  /* ---------------- unresolved plotlines ----------------
     The ledger's promises: foreshadowings and open questions still
     standing when the seal arrives. Marked-paid lines (containing
     "paid", "resolved", "closed", "answered") rest. */
  if (ledger?.promises?.length) {
    const open = ledger.promises.filter(
      (p) =>
        !/\b(paid|resolved|closed|answered|fulfilled|landed)\b/i.test(p)
    );
    if (open.length > 3) {
      issues.push({
        kind: "unresolved-plot",
        severity: open.length > 6 ? "warn" : "note",
        message: `${open.length} threads still stand open at the seal: ${open
          .slice(0, 3)
          .map((p) => `“${p.slice(0, 60)}…”`)
          .join(" ")}`,
      });
    }
  }

  /* ---------------- thin chapters ---------------- */
  if (ledger?.chapters?.length) {
    const wordsByPage = new Map<number, number>();
    pages.forEach((p, i) => wordsByPage.set(p.n, pageWords[i] ?? 0));
    for (const c of ledger.chapters) {
      const m = typeof c.pages === "string" ? c.pages.match(/(\d+)\D+(\d+)/) : null;
      if (!m) continue;
      const from = parseInt(m[1], 10);
      const to = parseInt(m[2], 10);
      if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) continue;
      let w = 0;
      for (let n = from; n <= to; n++) w += wordsByPage.get(n) ?? 0;
      const expected = plan.expectsFullPages ? 900 : 150;
      if (w < expected * 0.5) {
        issues.push({
          kind: "thin-chapter",
          severity: w < expected * 0.25 ? "warn" : "note",
          message: `Chapter “${c.title}” (pages ${from}–${to}) carries only ${w} words — a thin room for a chapter of the plan it serves.`,
        });
      }
    }
  }

  /* ---------------- thin pages / no movement ---------------- */
  if (plan.expectsFullPages && pages.length > 0) {
    const thin = pageWords.filter((w) => w < FULL_PAGE_WORDS * FULL_PAGE_TOLERANCE).length;
    if (thin > pages.length * 0.4) {
      issues.push({
        kind: "thin-page",
        severity: "warn",
        message: `${thin} of ${pages.length} pages carry far less than a full page of telling — the volume was counted, not written.`,
      });
    }
  }

  const blocking = issues.some((i) => i.severity === "block");
  return {
    stats: { pages: pages.length, words, chapters, estTypesetPages },
    issues,
    blocking,
  };
}

/** Whether a volume tells itself in full pages — novels and grown
    tellings — or in the short bright pages of picture books. Shared
    by the route (prompt law + QC plan) so both speak one truth. */
export function expectsFullPages(age: string, volume: string, tale: string): boolean {
  const verse = tale === "poem" || tale === "riddle" || tale === "ballad";
  if (verse) return false;
  if (volume === "short" || volume === "tiny") return false;
  /* the youngest readers keep their short bright pages, whatever the
     plan's breadth — a full typeset page of prose is not their shape */
  if (age === "little" || age === "young") return false;
  if (volume === "saga" || volume === "novel") return true;
  if (volume === "classic" && (age === "grown" || age === "teen")) return true;
  return false;
}
