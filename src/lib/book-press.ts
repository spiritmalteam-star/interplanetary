/* ================================================================== */
/*  book-press.ts — THE PUBLISHING PRESS.                              */
/*                                                                     */
/*  The deterministic editorial brain of the studio: code, not prompts.*/
/*  It audits the real manuscript the way a development editor would   */
/*  first sweep a draft — chapter-number integrity (no duplicated      */
/*  "Chapter Ten", no missing numbers), character drift (a name that   */
/*  was never cast, a pronoun that contradicts the bible), repetition  */
/*  (repeated phrases, repeated openings, repeated moral realizations) */
/*  and the channel's own worn phrases.                                 */
/*                                                                     */
/*  The press never approves a book by itself: it feeds the editor     */
/*  (the model) hard evidence, auto-writes repair directives for the   */
/*  structural defects it can prove, and its checks are part of the    */
/*  final acceptance gate. A book is never COMPLETE on vibes.          */
/* ================================================================== */

export interface PressPage {
  n: number;
  part?: string;
  chapter?: string;
  paragraphs: string[];
}

export interface PressHit {
  phrase: string;
  count: number;
  where: string;
}

export interface PressChapterIssue {
  kind: "duplicate-number" | "missing-number" | "gap" | "out-of-order" | "unnumbered";
  severity: "critical" | "major" | "minor";
  detail: string;
}

export interface PressDrift {
  name: string;
  severity: "critical" | "major" | "minor";
  detail: string;
}

export interface PressReport {
  words: number;
  chapters: { page: number; line: string; num: number | null }[];
  chapterIssues: PressChapterIssue[];
  drift: PressDrift[];
  repeats: PressHit[];
  openings: PressHit[];
  cliches: PressHit[];
  moralizing: { count: number; samples: string[] };
  technical: { literalBreaks: number; brokenChars: number };
  perspective: string | null;
}

/* ------------------------------------------------------------------ */
/*  Chapter collection — from the pages' own chapter lines and the     */
/*  "Chapter …" patterns a loom sometimes leaves inside the text.      */
/* ------------------------------------------------------------------ */

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
};

const ROMAN_NUMBERS: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18,
  xix: 19, xx: 20,
};

export function chapterNumberOf(line: string): number | null {
  const digits = line.match(/\b(\d{1,3})\b/);
  if (digits) {
    const n = parseInt(digits[1], 10);
    if (n >= 1 && n <= 300) return n;
  }
  const words = line.toLowerCase().match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/
  );
  if (words && WORD_NUMBERS[words[1]]) return WORD_NUMBERS[words[1]];
  const roman = line.match(/\b(X{0,2}(?:IX|IV|V?I{0,3}))\b/);
  if (roman && roman[1] && ROMAN_NUMBERS[roman[1].toLowerCase()]) {
    return ROMAN_NUMBERS[roman[1].toLowerCase()];
  }
  return null;
}

export function collectChapters(pages: PressPage[]): {
  page: number;
  line: string;
  num: number | null;
}[] {
  const out: { page: number; line: string; num: number | null }[] = [];
  const seen = new Set<string>();
  for (const p of pages) {
    if (p.chapter && p.chapter.trim()) {
      const line = p.chapter.trim();
      if (!seen.has(line.toLowerCase())) {
        seen.add(line.toLowerCase());
        out.push({ page: p.n, line, num: chapterNumberOf(line) });
      }
    }
  }
  return out;
}

/** THE CHAPTER AUDIT — the exact defects found in the wild: two
    chapters numbered Ten, numbers skipped, chapters that never carry
    a number at all. */
export function auditChapters(
  chapters: { page: number; line: string; num: number | null }[]
): PressChapterIssue[] {
  const issues: PressChapterIssue[] = [];
  const byNum = new Map<number, { page: number; line: string }[]>();
  for (const c of chapters) {
    if (c.num === null) continue;
    const list = byNum.get(c.num) ?? [];
    list.push({ page: c.page, line: c.line });
    byNum.set(c.num, list);
  }
  for (const [num, list] of [...byNum.entries()].sort((a, b) => a[0] - b[0])) {
    if (list.length > 1) {
      issues.push({
        kind: "duplicate-number",
        severity: "critical",
        detail: `${list.length} chapters are numbered ${num}: "${list
          .map((l) => `${l.line} (page ${l.page})`)
          .join('", "')}" — each chapter must carry its own number.`,
      });
    }
  }
  const numbered = chapters
    .filter((c) => c.num !== null)
    .map((c) => c.num as number);
  if (numbered.length >= 3) {
    const ordered = [...numbered];
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i] < ordered[i - 1]) {
        issues.push({
          kind: "out-of-order",
          severity: "major",
          detail: `Chapter numbers do not rise in order (${ordered.slice(Math.max(0, i - 2), i + 1).join(" → ")}).`,
        });
        break;
      }
    }
    const sorted = [...new Set(numbered)].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1) {
        issues.push({
          kind: "gap",
          severity: "major",
          detail: `No chapter ${sorted[i - 1] + 1}${sorted[i] - sorted[i - 1] > 2 ? `–${sorted[i] - 1}` : ""}: the sequence jumps from ${sorted[i - 1]} to ${sorted[i]}.`,
        });
      }
    }
    if (sorted[0] !== 1) {
      issues.push({
        kind: "missing-number",
        severity: "major",
        detail: `The first numbered chapter is ${sorted[0]} — chapter numbering must begin at One.`,
      });
    }
  }
  const unnumbered = chapters.filter((c) => c.num === null);
  if (chapters.length >= 3 && unnumbered.length === chapters.length) {
    issues.push({
      kind: "unnumbered",
      severity: "minor",
      detail: "No chapter carries a number — a printed book numbers its chapters.",
    });
  }
  return issues;
}

/* ------------------------------------------------------------------ */
/*  THE REPETITION DETECTOR — code, not vibes.                         */
/* ------------------------------------------------------------------ */

const stopWords = new Set(
  ("a an and the of to in on at for with by from as is was were be been it its that this these those he she they his her their him them i you we us our your had has have did do does not no but or if so then than when while after before over under again very just there here what which who whom whose".split(
    " "
  ))
);

function sentencesOf(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function normWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function whereList(pages: { n: number }[], idxs: number[]): string {
  const seen = [...new Set(idxs.map((i) => pages[i]?.n).filter((n): n is number => typeof n === "number"))];
  return seen.length <= 3
    ? `page ${seen.join(", page ")}`
    : `pages ${seen.slice(0, 3).join(", ")}, …`;
}

/** Repeated 8-word sequences — the same words worn twice. */
export function scanRepeats(
  pages: PressPage[],
  floor = 2
): PressHit[] {
  const grams = new Map<string, number[]>();
  pages.forEach((p, pi) => {
    for (const para of p.paragraphs) {
      const words = normWords(para);
      for (let i = 0; i + 8 <= words.length; i++) {
        const key = words.slice(i, i + 8).join(" ");
        const list = grams.get(key) ?? [];
        list.push(pi);
        grams.set(key, list);
      }
    }
  });
  const hits: PressHit[] = [];
  for (const [key, idxs] of grams) {
    if (idxs.length >= floor) {
      const contentful = key.split(" ").filter((w) => !stopWords.has(w)).length;
      if (contentful >= 4) hits.push({ phrase: key, count: idxs.length, where: whereList(pages, idxs) });
    }
  }
  hits.sort((a, b) => b.count - a.count || b.phrase.length - a.phrase.length);
  return hits.slice(0, 8);
}

/** Repeated sentence OPENINGS — every chapter beginning the same way. */
export function scanOpenings(pages: PressPage[], floor = 3): PressHit[] {
  const starts = new Map<string, number[]>();
  pages.forEach((p, pi) => {
    const text = p.paragraphs[0] ?? "";
    const first = sentencesOf(text)[0];
    if (!first) return;
    const words = normWords(first).slice(0, 4);
    if (words.length < 3) return;
    const key = words.join(" ");
    const list = starts.get(key) ?? [];
    list.push(pi);
    starts.set(key, list);
  });
  const hits: PressHit[] = [];
  for (const [key, idxs] of starts) {
    if (idxs.length >= floor && key.split(" ").some((w) => !stopWords.has(w))) {
      hits.push({ phrase: key + " …", count: idxs.length, where: whereList(pages, idxs) });
    }
  }
  hits.sort((a, b) => b.count - a.count);
  return hits.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  THE WORN PHRASES — the channel's own banned shelf, enforced by     */
/*  code. A phrase may pass once; a habit never will.                  */
/* ------------------------------------------------------------------ */

export const CLICHE_PATTERNS: { re: RegExp; phrase: string }[] = [
  { re: /tapestry of (?:dreams?|stars?|wonder|light|possibilit(?:y|ies))/gi, phrase: "a tapestry of …" },
  { re: /the essence of (?:friendship|love|courage|freedom|hope)/gi, phrase: "the essence of …" },
  { re: /a symphony of (?:possibilit(?:y|ies)|sound|color|colour|light|dreams?)/gi, phrase: "a symphony of …" },
  { re: /the magic of the journey/gi, phrase: "the magic of the journey" },
  { re: /the (?:beauty|wonder) of the impossible/gi, phrase: "the beauty of the impossible" },
  { re: /the (?:journey|adventure) (?:itself )?(?:matters|is what) (?:more|counts)/gi, phrase: "the journey matters more …" },
  { re: /(?:it(?:'s| is)|it was) not about the destination/gi, phrase: "not about the destination" },
  { re: /little did (?:they|he|she|it|anyone) know/gi, phrase: "little did … know" },
  { re: /(?:hearts?|heart) (?:beat|beats|beating|pound(?:ing|ed|s)?) (?:as one|in unison)/gi, phrase: "hearts beating as one" },
  { re: /time (?:seemed to slow|stood still|itself seemed to)/gi, phrase: "time seemed to slow" },
  { re: /the air (?:was|grew) thick with (?:wonder|magic|anticipation|possibility)/gi, phrase: "the air was thick with …" },
  { re: /a (?:testament|proof) to (?:the|their|his|her) (?:friendship|courage|bond|love|spirit)/gi, phrase: "a testament to …" },
  { re: /sparks? of (?:wonder|magic|possibility|hope) (?:danced|danced through|flew)/gi, phrase: "sparks of wonder danced" },
  { re: /(?:something|a feeling) shifted (?:deep )?inside (?:him|her|them|his|her|their) (?:heart|chest|soul)/gi, phrase: "something shifted inside …" },
  { re: /more than (?:words|anything) could (?:say|express|describe)/gi, phrase: "more than words could say" },
  { re: /the (?:true|real) (?:treasure|gift|magic) was (?:the|in) (?:friends|friendship|journey|each other)/gi, phrase: "the real treasure was the friends …" },
  { re: /and in that moment,? (?:everything|nothing) (?:changed|made sense)/gi, phrase: "and in that moment everything changed" },
  { re: /(?:whisper(?:s|ed)?|echo(?:es|ed)?) of (?:the )?(?:ancient|old) (?:magic|power|wisdom)/gi, phrase: "whispers of ancient magic" },
];

export function scanCliches(pages: PressPage[]): PressHit[] {
  const hits = new Map<string, PressHit>();
  pages.forEach((p, pi) => {
    const text = p.paragraphs.join(" ");
    for (const { re, phrase } of CLICHE_PATTERNS) {
      const m = text.match(re);
      if (m) {
        const cur = hits.get(phrase) ?? { phrase, count: 0, where: "" };
        cur.count += m.length;
        const seenPages = cur.where.match(/\d+/g)?.map(Number) ?? [];
        if (!seenPages.includes(p.n)) {
          cur.where = cur.where ? `${cur.where}, ${p.n}` : `page ${p.n}`;
        }
        hits.set(phrase, cur);
      }
    }
    void pi;
  });
  return [...hits.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}

/** THE MORAL METER — the story TELLING its lesson instead of showing
    it: "realized that friendship was …" sentences. */
export function scanMoralizing(pages: PressPage[]): { count: number; samples: string[] } {
  const re =
    /\b(?:realized|realised|learned|learnt|understood|knew then|finally saw|finally understood)\b[^.!?]{0,120}?\b(?:friendship|courage|journey|love|freedom|hope|trust|kindness|bravery|family|belonging|dreams?|being yourself|who (?:they|he|she) (?:really )?(?:was|is))\b/i;
  let count = 0;
  const samples: string[] = [];
  for (const p of pages) {
    for (const para of p.paragraphs) {
      for (const s of sentencesOf(para)) {
        if (re.test(s)) {
          count++;
          if (samples.length < 4) samples.push(s.slice(0, 180));
        }
      }
    }
  }
  return { count, samples };
}

/* ------------------------------------------------------------------ */
/*  TECHNICAL SWEEP — literal "\n" left in prose, broken characters.   */
/* ------------------------------------------------------------------ */

export function scanTechnical(pages: PressPage[]): { literalBreaks: number; brokenChars: number } {
  let literalBreaks = 0;
  let brokenChars = 0;
  for (const p of pages) {
    for (const para of p.paragraphs) {
      literalBreaks += (para.match(/\\n/g) ?? []).length;
      brokenChars += (para.match(/\uFFFD/g) ?? []).length;
    }
  }
  return { literalBreaks, brokenChars };
}

/* ------------------------------------------------------------------ */
/*  CHARACTER DRIFT — a name never cast in the bible, a pronoun that   */
/*  contradicts the cast list, a near-typo of a true name.             */
/* ------------------------------------------------------------------ */

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

const COMMON_CAPS = new Set(
  ("I God Lord Lady Sir Madam Mother Father Grandmother Grandfather Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Christmas Easter The He She It They What Where When Why How Yes No Ok Okay Chapter Part One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Twenty".split(
    " "
  ))
);

export function scanCharacters(pages: PressPage[], bible: { characters?: { name: string; pronoun?: string }[] } | null | undefined): PressDrift[] {
  const drift: PressDrift[] = [];
  if (!bible?.characters?.length) return drift;
  const cast = bible.characters;
  const castLower = new Map(cast.map((c) => [c.name.toLowerCase(), c]));

  /* every capitalized token that is not a sentence opener, not a
     known word, not the cast — counted */
  const counts = new Map<string, { count: number; pages: Set<number> }>();
  for (const p of pages) {
    for (const para of p.paragraphs) {
      const re = /(?<![.!?…]\s)(?<!^)(?<!["“])\b[A-Z][a-z'’]{2,}\b/gu;
      let m: RegExpExecArray | null;
      while ((m = re.exec(para))) {
        const w = m[0];
        if (COMMON_CAPS.has(w)) continue;
        if (castLower.has(w.toLowerCase())) continue;
        const cur = counts.get(w) ?? { count: 0, pages: new Set<number>() };
        cur.count += 1;
        cur.pages.add(p.n);
        counts.set(w, cur);
      }
    }
  }

  for (const [w, { count, pages: pgs }] of counts) {
    const wl = w.toLowerCase();
    /* a near-typo of a true name — the Aspen-of-the-world defect */
    const near = cast.find((c) => {
      const cl = c.name.toLowerCase();
      return Math.abs(cl.length - wl.length) <= 2 && editDistance(cl, wl) <= 2;
    });
    if (near) {
      drift.push({
        name: w,
        severity: "critical",
        detail: `"${w}" appears ${count} time(s) (page ${[...pgs].slice(0, 4).join(", ")}) and is one letter away from the cast member "${near.name}" — almost certainly a slip. The bible's name is law.`,
      });
      continue;
    }
    /* a recurring name that was never cast */
    if (count >= 4) {
      drift.push({
        name: w,
        severity: "major",
        detail: `"${w}" appears on ${count} pages (first: page ${[...pgs].slice(0, 4).join(", ")}) but is not in the cast list — either name them in the bible or rename them.`,
      });
    }
  }

  /* pronoun conflicts — the Ash who changes sex mid-book */
  for (const c of cast) {
    if (!c.pronoun) continue;
    const pron = c.pronoun.toLowerCase();
    const expected = pron.startsWith("he")
      ? /\bhe\b|\bhim\b|\bhis\b/
      : pron.startsWith("she")
        ? /\bshe\b|\bher\b|\bhers\b/
        : null;
    const opposite = pron.startsWith("he")
      ? /\bshe\b|\bher\b|\bhers\b/
      : pron.startsWith("she")
        ? /\bhe\b|\bhim\b|\bhis\b/
        : null;
    if (!expected || !opposite) continue;
    const re = new RegExp(`\\b${c.name}\\b`, "i");
    let conflicts = 0;
    let sample = "";
    for (const p of pages) {
      for (const para of p.paragraphs) {
        if (!re.test(para)) continue;
        const stripped = para.replace(/["“][^"”]*["”]/g, " ");
        if (opposite.test(stripped)) {
          conflicts++;
          if (!sample) sample = `page ${p.n}: ${stripped.replace(/\s+/g, " ").trim().slice(0, 140)}`;
        }
      }
    }
    if (conflicts >= 2) {
      drift.push({
        name: c.name,
        severity: "major",
        detail: `${c.name}'s pronoun is "${c.pronoun}" in the bible, but the prose reaches for the opposite pronoun on ${conflicts} pages — first: ${sample}`,
      });
    }
  }

  return drift.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  THE PERSPECTIVE SWEEP — a third-person book that starts talking    */
/*  to "you" mid-story.                                                */
/* ------------------------------------------------------------------ */

export function scanPerspective(pages: PressPage[], perspective?: string): string | null {
  if (!perspective || !/third/i.test(perspective)) return null;
  let you = 0;
  let sample = "";
  for (const p of pages.slice(2)) {
    for (const para of p.paragraphs) {
      const stripped = para.replace(/["“][^"”]*["”]/g, " ");
      const hits = (stripped.match(/\byou\b|\byour\b/gi) ?? []).length;
      if (hits > 0) {
        you += hits;
        if (!sample) sample = `page ${p.n}: ${stripped.replace(/\s+/g, " ").trim().slice(0, 140)}`;
      }
    }
  }
  if (you >= 10) {
    return `The narration is ${perspective}, but the prose addresses the reader as "you" ${you} times outside dialogue — first: ${sample}`;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  THE FULL SWEEP                                                     */
/* ------------------------------------------------------------------ */

export function runPress(pages: PressPage[], bible?: { characters?: { name: string; pronoun?: string }[]; perspective?: string } | null): PressReport {
  const chapters = collectChapters(pages);
  const words = pages.reduce((sum, p) => sum + normWords(p.paragraphs.join(" ")).length, 0);
  return {
    words,
    chapters: chapters.map((c) => ({ page: c.page, line: c.line, num: c.num })),
    chapterIssues: auditChapters(chapters),
    drift: scanCharacters(pages, bible ?? null),
    repeats: scanRepeats(pages),
    openings: scanOpenings(pages),
    cliches: scanCliches(pages),
    moralizing: scanMoralizing(pages),
    technical: scanTechnical(pages),
    perspective: scanPerspective(pages, bible?.perspective),
  };
}

/** The press report, spoken to a prompt — for the writer (short,
    forbidden-list form) or the editor (full evidence). */
export function pressBlock(report: PressReport | null, full = false): string {
  if (!report) return "";
  const out: string[] = [];
  if (report.chapterIssues.length) {
    out.push(
      `CHAPTER SEAMS: ${report.chapterIssues.map((i) => i.detail).join(" · ")}`
    );
  }
  if (report.drift.length) {
    out.push(`CAST DRIFT: ${report.drift.map((d) => d.detail).join(" · ")}`);
  }
  if (report.repeats.length) {
    out.push(
      `REPEATED WORDING (never repeat these again): ${report.repeats
        .map((r) => `"${r.phrase}" ×${r.count} (${r.where})`)
        .join(" · ")}`
    );
  }
  if (report.openings.length) {
    out.push(
      `REPEATED OPENINGS: ${report.openings
        .map((r) => `"${r.phrase}" ×${r.count} (${r.where})`)
        .join(" · ")}`
    );
  }
  if (report.cliches.length) {
    out.push(
      `WORN PHRASES: ${report.cliches.map((r) => `"${r.phrase}" ×${r.count}`).join(" · ")}`
    );
  }
  if (!full) {
    if (out.length === 0) return "";
    return [
      `- THE PRESS REPORT (measured on the pages so far — these exact defects are forbidden in the new pages):`,
      ...out.map((l) => `  ${l}`),
    ].join("\n");
  }
  if (report.moralizing.count >= 3) {
    out.push(
      `TELLING-NOT-SHOWING: ${report.moralizing.count} sentences announce a lesson ("realized that friendship was …"). Lessons must land through events; samples: ${report.moralizing.samples
        .slice(0, 3)
        .map((s) => `"${s}…"`)
        .join(" · ")}`
    );
  }
  if (report.technical.literalBreaks > 0 || report.technical.brokenChars > 0) {
    out.push(
      `TECHNICAL: ${report.technical.literalBreaks} literal "\\n" sequences and ${report.technical.brokenChars} broken characters sit in the prose — none may survive into the final book.`
    );
  }
  if (report.perspective) out.push(`PERSPECTIVE: ${report.perspective}`);
  out.push(`SCALE: ${report.words} words, ${report.chapters.length} chapters.`);
  if (out.length === 0) return "- The press sweep found no mechanical defects.";
  return [
    `- THE PRESS REPORT (deterministic audit of the manuscript — code-measured, not opinion):`,
    ...out.map((l) => `  ${l}`),
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  THE EDITORIAL REPORT — the editor's verdict, typed and bounded.    */
/* ------------------------------------------------------------------ */

export type EditorialVerdict = "approve" | "revise";

export const EDITORIAL_PASSES: { id: string; name: string }[] = [
  { id: "A", name: "Structure" },
  { id: "B", name: "Continuity" },
  { id: "C", name: "Pacing" },
  { id: "D", name: "Literary quality" },
  { id: "E", name: "Age suitability" },
  { id: "F", name: "Technical quality" },
  { id: "G", name: "The whole reading" },
];

export interface EditorialPass {
  id: string;
  name?: string;
  verdict: EditorialVerdict;
  notes?: string;
}

export interface EditorialDirective {
  pass: string;
  page?: number;
  chapter?: string;
  severity: "critical" | "major" | "minor";
  issue: string;
  instruction: string;
}

export interface EditorialReport {
  verdict: EditorialVerdict;
  passes?: EditorialPass[];
  directives?: EditorialDirective[];
  summary?: string;
}

const VALID_PASS_IDS = new Set(EDITORIAL_PASSES.map((p) => p.id));

export function parseEditorial(raw: unknown): EditorialReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const verdict = o.verdict === "approve" ? "approve" : o.verdict === "revise" ? "revise" : null;
  if (!verdict) return null;
  const passes: EditorialPass[] = [];
  if (Array.isArray(o.passes)) {
    for (const p of o.passes.slice(0, 10)) {
      if (!p || typeof p !== "object") continue;
      const pp = p as Record<string, unknown>;
      const id = typeof pp.id === "string" ? pp.id.toUpperCase() : "";
      if (!VALID_PASS_IDS.has(id)) continue;
      passes.push({
        id,
        ...(typeof pp.name === "string" ? { name: pp.name.slice(0, 60) } : {}),
        verdict: pp.verdict === "approve" ? "approve" : "revise",
        ...(typeof pp.notes === "string" && pp.notes.trim()
          ? { notes: pp.notes.trim().slice(0, 400) }
          : {}),
      });
    }
  }
  const directives: EditorialDirective[] = [];
  if (Array.isArray(o.directives)) {
    for (const d of o.directives.slice(0, 24)) {
      if (!d || typeof d !== "object") continue;
      const dd = d as Record<string, unknown>;
      const issue = typeof dd.issue === "string" ? dd.issue.trim() : "";
      const instruction = typeof dd.instruction === "string" ? dd.instruction.trim() : "";
      if (!issue || !instruction) continue;
      directives.push({
        pass: typeof dd.pass === "string" ? dd.pass.toUpperCase().slice(0, 2) : "G",
        ...(typeof dd.page === "number" && dd.page > 0 ? { page: Math.round(dd.page) } : {}),
        ...(typeof dd.chapter === "string" ? { chapter: dd.chapter.slice(0, 120) } : {}),
        severity: dd.severity === "critical" ? "critical" : dd.severity === "minor" ? "minor" : "major",
        issue: issue.slice(0, 300),
        instruction: instruction.slice(0, 400),
      });
    }
  }
  const report: EditorialReport = {
    verdict,
    ...(passes.length ? { passes } : {}),
    ...(directives.length ? { directives } : {}),
    ...(typeof o.summary === "string" && o.summary.trim()
      ? { summary: o.summary.trim().slice(0, 600) }
      : {}),
  };
  return report;
}

/** The press's own directives — the provable defects become repair
    orders of their own, whether or not the editor model saw them. */
export function pressToDirectives(report: PressReport | null): EditorialDirective[] {
  if (!report) return [];
  const out: EditorialDirective[] = [];
  let pass = "F";
  for (const issue of report.chapterIssues) {
    out.push({
      pass: "A",
      severity: issue.severity,
      issue: issue.detail,
      instruction:
        issue.kind === "duplicate-number"
          ? "Renumber the affected chapters so every chapter carries exactly one number, rising in order, and update every chapter line where the number appears."
          : issue.kind === "gap" || issue.kind === "out-of-order" || issue.kind === "missing-number"
            ? "Repair the chapter numbering so it rises one by one from One with no skips, updating the chapter lines in the affected pages."
            : "Give every chapter a number in its chapter line, rising in order.",
    });
  }
  for (const d of report.drift.slice(0, 6)) {
    out.push({
      pass: "B",
      severity: d.severity,
      issue: d.detail,
      instruction:
        "Restore the character's identity exactly as the story bible holds it — same name, same pronoun, same nature — in every affected page.",
    });
  }
  if (report.technical.literalBreaks > 0 || report.technical.brokenChars > 0) {
    out.push({
      pass: "F",
      severity: "critical",
      issue: `${report.technical.literalBreaks} literal "\\n" sequences and ${report.technical.brokenChars} broken characters in the prose.`,
      instruction: "Remove every literal backslash-n and broken character; let real line breaks carry verse where verse belongs.",
    });
  }
  void pass;
  return out;
}

/* ------------------------------------------------------------------ */
/*  THE ACCEPTANCE GATE — the checklist a book must pass before the    */
/*  word COMPLETE may be spoken. Code holds the provable checks; the   */
/*  editor's verdict holds the judgment ones.                          */
/* ------------------------------------------------------------------ */

export interface GateItem {
  key: string;
  label: string;
  pass: boolean;
  detail: string;
}

export function gateCheck(args: {
  pages: PressPage[];
  bible?: StoryBibleLike | null;
  editorial?: EditorialReport | null;
  plannedChapters?: number;
}): { pass: boolean; items: GateItem[] } {
  const { pages, bible, editorial } = args;
  const report = runPress(pages, bible);
  const criticals = report.chapterIssues.filter((i) => i.severity === "critical");
  const castCriticals = report.drift.filter((d) => d.severity === "critical");
  const items: GateItem[] = [
    {
      key: "structure",
      label: "Chapter architecture intact",
      pass: criticals.length === 0,
      detail:
        criticals.length === 0
          ? `${report.chapters.length} chapters, every number its own.`
          : criticals.map((c) => c.detail).join(" · "),
    },
    {
      key: "characters",
      label: "Characters consistent",
      pass: castCriticals.length === 0,
      detail:
        castCriticals.length === 0
          ? "Every named figure matches the cast list; no uncast names, no pronoun drift."
          : castCriticals.map((c) => c.detail).join(" · "),
    },
    {
      key: "editorial",
      label: "Editorial review passed",
      pass: editorial?.verdict === "approve",
      detail:
        editorial?.verdict === "approve"
          ? editorial.summary || "The editor approved the manuscript across all passes."
          : editorial
            ? `The editor returned a revise verdict${editorial.directives?.length ? ` with ${editorial.directives.length} directive(s)` : ""}.`
            : "No editorial review has run yet.",
    },
    {
      key: "repetition",
      label: "No worn repetition",
      pass: report.repeats.length === 0 && report.cliches.length === 0,
      detail:
        report.repeats.length === 0 && report.cliches.length === 0
          ? "No repeated passages, no worn phrases."
          : [
              ...report.repeats.slice(0, 2),
              ...report.cliches.slice(0, 2),
            ]
              .map((r) => `"${r.phrase}" ×${r.count}`)
              .join(" · ") + " — still present.",
    },
    {
      key: "technical",
      label: "Technically clean",
      pass: report.technical.literalBreaks === 0 && report.technical.brokenChars === 0,
      detail:
        report.technical.literalBreaks === 0 && report.technical.brokenChars === 0
          ? "No literal break sequences, no broken characters."
          : `${report.technical.literalBreaks} literal \\n, ${report.technical.brokenChars} broken characters.`,
    },
    {
      key: "complete",
      label: "The planned story exists",
      pass: pages.length >= 4,
      detail: `${pages.length} pages woven${args.plannedChapters ? `, ${report.chapters.length} of the planned ${args.plannedChapters} chapters opened` : ""}.`,
    },
  ];
  return { pass: items.every((i) => i.pass), items };
}

/** The bible shape the press needs — structural, import-free. */
export interface StoryBibleLike {
  characters?: { name: string; pronoun?: string }[];
  perspective?: string;
}
