/* ================================================================== */
/*  story-bible.ts — THE STORY BIBLE, the source of truth.            */
/*                                                                     */
/*  Before the first chapter is ever written, the studio designs the   */
/*  whole book: its premise, its cast (each character with one fixed   */
/*  identity that can never drift), the world's rules, the central     */
/*  conflict, the acts, and a chapter-by-chapter narrative             */
/*  architecture where every chapter carries a purpose, an event, an   */
/*  obstacle, a decision, a consequence and a reason to continue.      */
/*                                                                     */
/*  The bible is the law the whole workflow honors: the writer writes  */
/*  toward it, the press audits against it, the editor judges by it.   */
/* ================================================================== */

export interface BibleCharacter {
  name: string;
  /** species / kind / standing in the world */
  kind?: string;
  /** the visual bible line — one appearance, kept consistent all book */
  appearance?: string;
  personality?: string;
  /** how they speak — distinct from every other voice */
  voice?: string;
  motivation?: string;
  /** the wound, fear or misconception they carry */
  flaw?: string;
  /** how they change from the first page to the last */
  arc?: string;
  pronoun?: string;
}

export interface BibleChapter {
  /** the chapter's true number — never duplicated, never skipped */
  n: number;
  title?: string;
  /** which act of the architecture this chapter serves */
  act?: string;
  /** why this chapter exists — its narrative purpose */
  purpose?: string;
  /** the specific thing that HAPPENS (not a mood, an event) */
  event?: string;
  /** what the point-of-view character wants in this chapter */
  objective?: string;
  /** what stands in the way — tension, resistance, cost */
  obstacle?: string;
  /** the meaningful choice or interaction that turns the chapter */
  decision?: string;
  /** what is different afterwards — what this chapter changes */
  consequence?: string;
  /** why the reader turns the page */
  hook?: string;
  /** the planned page span, e.g. "5–12" */
  pages?: string;
}

export interface BibleLocation {
  name?: string;
  /** the plot purpose — why this place exists in THIS story */
  purpose?: string;
}

export interface StoryBible {
  premise?: string;
  audience?: string;
  tone?: string;
  /** the narration contract, e.g. "third person past, close on Xanric" */
  perspective?: string;
  characters?: BibleCharacter[];
  /** the world's stable rules and their limits */
  worldRules?: string[];
  locations?: BibleLocation[];
  centralConflict?: string;
  secondaryConflict?: string;
  themes?: string[];
  acts?: { name?: string; goal?: string }[];
  chapters?: BibleChapter[];
  endingPlan?: string;
}

/* ------------------------------------------------------------------ */
/*  THE TOLERANT PARSER — the architect's hand is trusted but          */
/*  bounded; a malformed line never breaks the studio.                 */
/* ------------------------------------------------------------------ */

const short = (v: unknown, cap: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/\s+/g, " ").trim();
  return s ? s.slice(0, cap) : undefined;
};

const shortList = (v: unknown, cap: number, max: number): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.replace(/\s+/g, " ").trim().slice(0, cap))
    .slice(0, max);
  return out.length > 0 ? out : undefined;
};

export function parseBible(raw: unknown): StoryBible | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const bible: StoryBible = {};

  bible.premise = short(o.premise, 400);
  bible.audience = short(o.audience, 160);
  bible.tone = short(o.tone, 200);
  bible.perspective = short(o.perspective, 200);
  bible.endingPlan = short(o.endingPlan ?? o.ending, 300);

  if (o.conflict && typeof o.conflict === "object") {
    const c = o.conflict as Record<string, unknown>;
    bible.centralConflict = short(c.central, 300);
    bible.secondaryConflict = short(c.secondary, 300);
  } else {
    bible.centralConflict = short(o.centralConflict, 300);
    bible.secondaryConflict = short(o.secondaryConflict, 300);
  }

  if (Array.isArray(o.characters)) {
    const chars: BibleCharacter[] = [];
    for (const c of o.characters.slice(0, 10)) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const name = short(cc.name, 60);
      if (!name) continue;
      chars.push({
        name,
        ...(short(cc.kind ?? cc.species ?? cc.role, 120)
          ? { kind: short(cc.kind ?? cc.species ?? cc.role, 120) }
          : {}),
        ...(short(cc.appearance, 200) ? { appearance: short(cc.appearance, 200) } : {}),
        ...(short(cc.personality, 200) ? { personality: short(cc.personality, 200) } : {}),
        ...(short(cc.voice, 200) ? { voice: short(cc.voice, 200) } : {}),
        ...(short(cc.motivation ?? cc.desire, 200)
          ? { motivation: short(cc.motivation ?? cc.desire, 200) }
          : {}),
        ...(short(cc.flaw ?? cc.wound, 200) ? { flaw: short(cc.flaw ?? cc.wound, 200) } : {}),
        ...(short(cc.arc, 240) ? { arc: short(cc.arc, 240) } : {}),
        ...(short(cc.pronoun, 30) ? { pronoun: short(cc.pronoun, 30) } : {}),
      });
    }
    if (chars.length > 0) bible.characters = chars;
  }

  bible.worldRules = shortList(o.worldRules ?? o.rules, 200, 12);
  if (Array.isArray(o.locations)) {
    const locs: BibleLocation[] = [];
    for (const l of o.locations.slice(0, 10)) {
      if (!l || typeof l !== "object") continue;
      const ll = l as Record<string, unknown>;
      const name = short(ll.name, 80);
      if (!name) continue;
      locs.push({ name, ...(short(ll.purpose, 160) ? { purpose: short(ll.purpose, 160) } : {}) });
    }
    if (locs.length > 0) bible.locations = locs;
  }
  bible.themes = shortList(o.themes, 120, 6);

  if (Array.isArray(o.acts)) {
    const acts: { name?: string; goal?: string }[] = [];
    for (const a of o.acts.slice(0, 6)) {
      if (!a || typeof a !== "object") continue;
      const aa = a as Record<string, unknown>;
      const name = short(aa.name, 80);
      if (!name) continue;
      acts.push({ name, ...(short(aa.goal, 200) ? { goal: short(aa.goal, 200) } : {}) });
    }
    if (acts.length > 0) bible.acts = acts;
  }

  if (Array.isArray(o.chapters)) {
    const chapters: BibleChapter[] = [];
    for (const c of o.chapters.slice(0, 44)) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const n =
        typeof cc.n === "number" && Number.isFinite(cc.n)
          ? Math.max(1, Math.round(cc.n))
          : typeof cc.number === "number"
            ? Math.max(1, Math.round(cc.number))
            : 0;
      if (!n) continue;
      chapters.push({
        n,
        ...(short(cc.title, 120) ? { title: short(cc.title, 120) } : {}),
        ...(short(cc.act, 80) ? { act: short(cc.act, 80) } : {}),
        ...(short(cc.purpose, 220) ? { purpose: short(cc.purpose, 220) } : {}),
        ...(short(cc.event, 260) ? { event: short(cc.event, 260) } : {}),
        ...(short(cc.objective, 200) ? { objective: short(cc.objective, 200) } : {}),
        ...(short(cc.obstacle, 200) ? { obstacle: short(cc.obstacle, 200) } : {}),
        ...(short(cc.decision, 200) ? { decision: short(cc.decision, 200) } : {}),
        ...(short(cc.consequence, 220) ? { consequence: short(cc.consequence, 220) } : {}),
        ...(short(cc.hook, 180) ? { hook: short(cc.hook, 180) } : {}),
        ...(short(cc.pages, 24) ? { pages: short(cc.pages, 24) } : {}),
      });
    }
    /* renumber defensively — the outline's order is its numbers */
    if (chapters.length > 0) bible.chapters = chapters.map((c, i) => ({ ...c, n: i + 1 }));
  }

  const keys = Object.keys(bible).filter((k) => {
    const v = bible[k as keyof StoryBible];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
  /* a bible without a premise or a chapter architecture is not a bible */
  if (!bible.premise && !bible.chapters) return null;
  return keys.length > 0 ? bible : null;
}

/* ------------------------------------------------------------------ */
/*  THE PROMPT BLOCKS — the bible rides into every writing call.       */
/* ------------------------------------------------------------------ */

/** The full compact bible — premise, cast, world, conflict, ending. */
export function bibleBlock(bible: StoryBible | null | undefined): string {
  if (!bible) return "";
  const out: string[] = [];
  if (bible.premise) out.push(`  PREMISE — ${bible.premise}`);
  if (bible.perspective) out.push(`  NARRATION — ${bible.perspective} (never drift from it; never address the reader as "you" unless the narration contract says so)`);
  if (bible.tone) out.push(`  TONE — ${bible.tone}`);
  if (bible.characters?.length) {
    out.push(`  THE CAST (identities are LAW — a species, a name, a pronoun or a look never changes without the story explicitly, visibly transforming it):`);
    for (const c of bible.characters) {
      const parts = [
        c.kind,
        c.appearance ? `looks: ${c.appearance}` : "",
        c.personality,
        c.voice ? `speaks: ${c.voice}` : "",
        c.motivation ? `wants: ${c.motivation}` : "",
        c.flaw ? `wound: ${c.flaw}` : "",
        c.arc ? `becomes: ${c.arc}` : "",
        c.pronoun ? `(pronoun: ${c.pronoun})` : "",
      ].filter(Boolean);
      out.push(`    • ${c.name} — ${parts.join("; ")}`);
    }
  }
  if (bible.worldRules?.length)
    out.push(`  WORLD RULES (stable law, never casually broken) — ${bible.worldRules.join(" | ")}`);
  if (bible.locations?.length)
    out.push(
      `  PLACES (each has a plot purpose; never revisit one without new meaning) — ${bible.locations
        .map((l) => `${l.name}${l.purpose ? ` (${l.purpose})` : ""}`)
        .join(" | ")}`
    );
  if (bible.centralConflict)
    out.push(
      `  CENTRAL CONFLICT — ${bible.centralConflict}${bible.secondaryConflict ? `\n  SECONDARY CONFLICT — ${bible.secondaryConflict}` : ""}`
    );
  if (bible.themes?.length) out.push(`  THEMES (embodied in events, never preached) — ${bible.themes.join(" | ")}`);
  if (bible.endingPlan) out.push(`  PLANNED ENDING — ${bible.endingPlan}`);
  if (out.length === 0) return "";
  return `- THE STORY BIBLE (the volume's source of truth — honor every line):\n${out.join("\n")}`;
}

/** The chapter architecture — the whole outline, one line per chapter. */
export function outlineBlock(bible: StoryBible | null | undefined): string {
  if (!bible?.chapters?.length) return "";
  const lines = bible.chapters.map((c) => {
    const bits = [
      c.event ? `happens: ${c.event}` : "",
      c.obstacle ? `against: ${c.obstacle}` : "",
      c.decision ? `turns on: ${c.decision}` : "",
      c.consequence ? `changes: ${c.consequence}` : "",
    ].filter(Boolean);
    return `    ${c.n}. ${c.title ?? "Untitled"}${c.act ? ` [${c.act}]` : ""} — ${bits.join("; ") || c.purpose || "advances the arc"}`;
  });
  return [
    `- THE CHAPTER ARCHITECTURE (the whole book, planned before a word was written — every chapter must ACCOMPLISH its line, in its order; no chapter may restate another's work):`,
    ...lines,
  ].join("\n");
}

/** The law for the chapter that is about to open in the coming pages. */
export function chapterLaw(
  bible: StoryBible | null | undefined,
  chapterNumber: number
): string {
  const c = bible?.chapters?.find((x) => x.n === chapterNumber);
  if (!c) return "";
  const act = bible?.acts?.find((a) => a.name && c.act && a.name.toLowerCase() === c.act.toLowerCase());
  const lines = [
    `THE CHAPTER YOU ARE WRITING TOWARD — Chapter ${c.n}${c.title ? ` — "${c.title}"` : ""}${c.act ? ` (${c.act}${act?.goal ? `: ${act.goal}` : ""})` : ""}:`,
    c.purpose ? `  • purpose: ${c.purpose}` : "",
    c.event ? `  • the event that must HAPPEN on the page (shown, not summarized): ${c.event}` : "",
    c.objective ? `  • the character's objective: ${c.objective}` : "",
    c.obstacle ? `  • the obstacle or tension: ${c.obstacle}` : "",
    c.decision ? `  • the meaningful decision or interaction: ${c.decision}` : "",
    c.consequence ? `  • the consequence that changes what comes next: ${c.consequence}` : "",
    c.hook ? `  • the reason the reader continues: ${c.hook}` : "",
  ].filter(Boolean);
  if (lines.length <= 1) return "";
  return [
    `- ${lines[0]}`,
    ...lines.slice(1),
    `  Open this chapter when the rhythm asks; never open a LATER chapter early, never repeat the work of an earlier chapter — every line of the outline is done exactly once.`,
  ].join("\n");
}

/** How many chapters the manuscript has already opened (by its own
    chapter lines) — the writer writes toward the next one. */
export function chaptersSoFarText(pages: { chapter?: string }[] | undefined): number {
  if (!pages) return 0;
  return pages.filter((p) => p.chapter && p.chapter.trim()).length;
}
