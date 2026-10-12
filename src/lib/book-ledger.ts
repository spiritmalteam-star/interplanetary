/* ------------------------------------------------------------------ */
/*  book-ledger.ts — the book's own durable intelligence (V10).        */
/*                                                                     */
/*  The Dream Book's ledger: a compact, queryable memory of the        */
/*  volume — its private architecture, world canon, characters and     */
/*  their knowledge limits, object states, chronology, promises and    */
/*  motifs — returned by the loom at every weaving, kept by the room,  */
/*  and handed back at every continuation. The thread carries the      */
/*  breath; the ledger carries the bones.                              */
/* ------------------------------------------------------------------ */

export interface LedgerBrief {
  premise?: string;
  question?: string;
  dilemma?: string;
  chain?: string;
  ending?: string;
}

export interface LedgerChapter {
  title: string;
  pages?: string;
  summary?: string;
}

export interface BookLedger {
  brief?: LedgerBrief;
  canon?: string[];
  characters?: string[];
  objects?: string[];
  timeline?: string[];
  promises?: string[];
  motifs?: string[];
  chapters?: LedgerChapter[];
}

/** THE HONEST AUDIT — the closing volume's private editorial report:
    ten dimensions, each scored 0–10 with one line of evidence drawn
    from the finished writing. Never printed inside the book. */
export interface BookAudit {
  prose?: { score: number; evidence: string };
  originality?: { score: number; evidence: string };
  worldbuilding?: { score: number; evidence: string };
  character?: { score: number; evidence: string };
  structure?: { score: number; evidence: string };
  emotion?: { score: number; evidence: string };
  philosophy?: { score: number; evidence: string };
  pacing?: { score: number; evidence: string };
  continuity?: { score: number; evidence: string };
  endings?: { score: number; evidence: string };
}

export const AUDIT_DIMENSIONS: {
  key: keyof BookAudit;
  label: string;
}[] = [
  { key: "prose", label: "Prose" },
  { key: "originality", label: "Originality" },
  { key: "worldbuilding", label: "Worldbuilding" },
  { key: "character", label: "Character" },
  { key: "structure", label: "Structure" },
  { key: "emotion", label: "Emotion" },
  { key: "philosophy", label: "Philosophy" },
  { key: "pacing", label: "Pacing" },
  { key: "continuity", label: "Continuity" },
  { key: "endings", label: "Endings" },
];

/** Tolerant ledger parse — the model's hand is trusted but bounded. */
export function parseLedger(raw: unknown): BookLedger | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const lines = (v: unknown, cap: number): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const out = v
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 220))
      .slice(0, cap);
    return out.length > 0 ? out : undefined;
  };
  let brief: LedgerBrief | undefined;
  if (o.brief && typeof o.brief === "object") {
    const b = o.brief as Record<string, unknown>;
    const pick = (k: string): string | undefined =>
      typeof b[k] === "string" && (b[k] as string).trim()
        ? (b[k] as string).trim().slice(0, 300)
        : undefined;
    const pb: LedgerBrief = {
      premise: pick("premise"),
      question: pick("question"),
      dilemma: pick("dilemma"),
      chain: pick("chain"),
      ending: pick("ending"),
    };
    if (Object.values(pb).some(Boolean)) brief = pb;
  }
  let chapters: LedgerChapter[] | undefined;
  if (Array.isArray(o.chapters)) {
    const out: LedgerChapter[] = [];
    for (const c of o.chapters.slice(0, 40)) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      if (typeof cc.title !== "string" || !cc.title.trim()) continue;
      out.push({
        title: cc.title.trim().slice(0, 120),
        ...(typeof cc.pages === "string" || typeof cc.pages === "number"
          ? { pages: String(cc.pages).slice(0, 24) }
          : {}),
        ...(typeof cc.summary === "string" && cc.summary.trim()
          ? { summary: cc.summary.trim().slice(0, 320) }
          : {}),
      });
    }
    if (out.length > 0) chapters = out;
  }
  const ledger: BookLedger = {
    ...(brief ? { brief } : {}),
    ...(lines(o.canon, 16) ? { canon: lines(o.canon, 16) } : {}),
    ...(lines(o.characters, 18) ? { characters: lines(o.characters, 18) } : {}),
    ...(lines(o.objects, 14) ? { objects: lines(o.objects, 14) } : {}),
    ...(lines(o.timeline, 14) ? { timeline: lines(o.timeline, 14) } : {}),
    ...(lines(o.promises, 16) ? { promises: lines(o.promises, 16) } : {}),
    ...(lines(o.motifs, 10) ? { motifs: lines(o.motifs, 10) } : {}),
    ...(chapters ? { chapters } : {}),
  };
  return Object.keys(ledger).length > 0 ? ledger : null;
}

/** The ledger the model returned wins where it speaks; a line the room
    already kept is never lost to a quieter reply. */
export function mergeLedger(
  base: BookLedger | null,
  fresh: BookLedger | null
): BookLedger | null {
  if (!fresh) return base;
  if (!base) return fresh;
  const out: BookLedger = { ...base };
  if (fresh.brief) out.brief = { ...base.brief, ...fresh.brief };
  const arrKeys = [
    "canon",
    "characters",
    "objects",
    "timeline",
    "promises",
    "motifs",
  ] as const;
  for (const k of arrKeys) {
    const f = fresh[k];
    if (f && f.length > 0) out[k] = f;
  }
  if (fresh.chapters && fresh.chapters.length > 0) {
    const byTitle = new Map<string, LedgerChapter>();
    for (const c of base.chapters ?? []) byTitle.set(c.title.toLowerCase(), c);
    for (const c of fresh.chapters) byTitle.set(c.title.toLowerCase(), c);
    out.chapters = [...byTitle.values()].slice(-40);
  }
  return out;
}

export function parseAudit(raw: unknown): BookAudit | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: BookAudit = {};
  for (const { key } of AUDIT_DIMENSIONS) {
    const v = o[key];
    if (!v || typeof v !== "object") continue;
    const vv = v as Record<string, unknown>;
    const score =
      typeof vv.score === "number"
        ? Math.min(10, Math.max(0, Math.round(vv.score)))
        : undefined;
    const evidence =
      typeof vv.evidence === "string" && vv.evidence.trim()
        ? vv.evidence.trim().slice(0, 240)
        : undefined;
    if (typeof score === "number" && evidence) {
      out[key] = { score, evidence };
    }
  }
  return Object.keys(out).length >= 5 ? out : null;
}

/** The bounded injection — the ledger rides into every continuation,
    compact enough to never crowd the pages it protects. */
export function ledgerBlock(ledger: BookLedger | null): string {
  if (!ledger) return "";
  const out: string[] = [];
  if (ledger.brief) {
    const b = ledger.brief;
    const parts = [
      b.premise ? `premise: ${b.premise}` : "",
      b.question ? `question: ${b.question}` : "",
      b.dilemma ? `dilemma: ${b.dilemma}` : "",
      b.chain ? `chain: ${b.chain}` : "",
      b.ending ? `ending effect sought: ${b.ending}` : "",
    ].filter(Boolean);
    if (parts.length) out.push(`  BRIEF — ${parts.join(" · ")}`);
  }
  if (ledger.canon?.length) out.push(`  CANON — ${ledger.canon.slice(0, 12).join(" | ")}`);
  if (ledger.characters?.length)
    out.push(`  CHARACTERS — ${ledger.characters.slice(0, 14).join(" | ")}`);
  if (ledger.objects?.length)
    out.push(`  OBJECTS (state is law) — ${ledger.objects.slice(0, 10).join(" | ")}`);
  if (ledger.timeline?.length)
    out.push(`  TIMELINE — ${ledger.timeline.slice(0, 10).join(" | ")}`);
  if (ledger.promises?.length)
    out.push(
      `  PROMISES (every one must land or stay honest) — ${ledger.promises.slice(0, 12).join(" | ")}`
    );
  if (ledger.motifs?.length)
    out.push(`  MOTIFS — ${ledger.motifs.slice(0, 8).join(" | ")}`);
  if (ledger.chapters?.length)
    out.push(
      `  CHAPTERS — ${ledger.chapters
        .slice(-14)
        .map((c) => `"${c.title}"${c.pages ? ` (${c.pages})` : ""}`)
        .join(" | ")}`
    );
  if (out.length === 0) return "";
  return `- THE LEDGER (the volume's own intelligence — honor every line; carry it forward and update it with what these pages change):\n${out.join("\n")}`;
}
