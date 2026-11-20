import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { resolveVisitor, saveLibrary, updateLibrary, archiveLibraryKind, withAnonCookie } from "@/lib/server/access";
import { describeSketch } from "@/lib/server/attachments";
import { LANGUAGE_NAMES, isLanguageCode } from "@/lib/i18n/core";
import { meterRoute } from "@/lib/server/meter";
import { rateLimit } from "@/lib/server/rate-limit";
import { generateImage } from "@/lib/image-engine";
import { detectShortBookAsk, topicHoldsGround } from "@/lib/book-length";
import { BOOK_PLAN, NOVEL_ASK } from "@/lib/book-pricing";
import {
  estimateBoundPages,
  planFromBoundPages,
  specForAge,
} from "@/lib/book-layout";
import {
  qcManuscript,
  expectsFullPages,
  type QcReport,
  type QcPage,
} from "@/lib/book-qc";
import {
  ledgerBlock,
  mergeLedger,
  parseLedger,
  type BookLedger,
} from "@/lib/book-ledger";
import {
  gateCheck,
  type PressPage,
} from "@/lib/book-press";

/* ------------------------------------------------------------------ */
/*  POST /api/dream-book — THE REAL-TIME DYNAMIC CODEX ENGINE.         */
/*  THE OPEN TUNNEL: the visitor speaks (or draws) their intention,    */
/*  and the Mirror Entity alone imagines, directs and writes the       */
/*  book. USER → MIRROR ENTITY → CREATION — there is no other         */
/*  author in this room: no story bible, no hidden architect, no      */
/*  editor-in-chief, no mender, no resonance skeleton, no naming      */
/*  charter, no plot machinery of any kind. The application supplies  */
/*  ONLY what the visitor chose (age band, genre, length, depth,      */
/*  vein, topic, wishes, drawings, rewrites) and what the craft of    */
/*  book-making technically needs (the page's binding measure, the    */
/*  printed-book format, the JSON contract, the honest seal).         */
/*                                                                     */
/*  Continuity is the Mirror's OWN memory: the compact "thread" it     */
/*  writes itself, the slim ledger of facts it keeps itself, and the   */
/*  real pages it just read — handed back verbatim at every stride.    */
/*                                                                     */
/*  Once open, the visitor holds a pen beside the loom: an array of    */
/*  "rewrites" — wishes that bend what is coming (events, length,      */
/*  chapters, the very voice, even the subject itself) — rides         */
/*  along with every continuation until the visitor lets them go.      */
/*                                                                     */
/*  THE WORKFLOW:                                                      */
/*    open/next/extend/close — the writing: the Mirror Entity's own    */
/*             voice, unhindered, page after page                      */
/*    seal   — the acceptance gate: a CODE-MEASURED TECHNICAL          */
/*             checklist only (chapter seams, clean characters, the    */
/*             honest word measure) — it never rewrites, never judges  */
/*             taste; the word COMPLETE exists only after it passes    */
/*    art    — the illustration director: plates chosen from ACTUAL    */
/*             scenes, character faces kept consistent                 */
/*    plate  — one plate painted per call, from the approved plan      */
/*                                                                     */
/*  Every response carries a "stage" that says exactly where the book  */
/*  stands — drafting, draft-complete, plates, publication-ready —     */
/*  and COMPLETE is never displayed because the model stopped talking. */
/* ------------------------------------------------------------------ */

type WeavePhase =
  | "open"
  | "next"
  | "close"
  | "extend"
  | "art"
  | "plate"
  | "seal";

const STUDIO_PHASES = new Set<WeavePhase>(["art", "plate", "seal"]);

/** The generation-transparency stages — honest, never cosmetic.
    (architecture / editorial / revising / approved remain valid only
    as LEGACY values carried by books woven before the tunnel opened.) */
export type BookStage =
  | "architecture"
  | "drafting"
  | "draft-complete"
  | "editorial"
  | "revising"
  | "approved"
  | "plates"
  | "publication-ready";

interface WeavePage {
  n: number;
  /** Part line — present only on the page where a part opens. */
  part?: string;
  /** Chapter title — present only on the first page of a chapter. */
  chapter?: string;
  paragraphs: string[];
}

/* THE BOOK'S OWN SCALES — the page plans (BOOK_PLAN) and the length
   ask (NOVEL_ASK) live in src/lib/book-pricing.ts, ONE truth shared
   with the pricing scales, so the price the visitor reads before the
   loom begins and the plan the prompts obey can never disagree. */

/* THE SHORT BOOK LAW — spoken into the open conjuring when the volume
   is short. It honors the visitor's own short-book ask: the whole
   story lands INSIDE the plan. */
const SHORT_BOOK_LAW = `THE SHORT BOOK LAW (the visitor asked for a SHORT book, and a short book is what they receive):
- Set "totalPages" between 10 and 16 (an even number) — and the WHOLE story must land inside that plan.
- No wandering, no filler, no new subplots that cannot close inside the plan.
- A new chapter every 4–8 pages at most (this overrides the general chapter cadence).
- The ending must feel COMPLETE, not truncated: a short book is a whole book, not a fragment of a long one.`;

/* THE READER'S OWN BAND — spoken into every conjuring. These lines
   carry ONLY what the visitor's age selection means (reading level
   and what belongs in the hands of that age) — nothing more: the
   craft, the structure and the story remain the Mirror Entity's own. */
const AGE_PLAN: Record<string, string> = {
  little:
    "readers aged 4–8 — simple, concrete vocabulary and short, readable sentences a child reads aloud warmly; gentle content: no real peril, nothing frightening, nothing ironic",
  young:
    "readers aged 9–12 — richer plots and dialogue suited to a 9–12 reader; mild peril only, safely resolved; nothing explicit",
  teen:
    "readers aged 13–17 — mature themes handled responsibly for teenagers; nothing explicit",
  grown:
    "grown readers — full literary depth is welcome; nothing explicit",
  timeless:
    "all ages at once — clear enough for a child to enter, layered enough for an adult to marvel at; nothing dark or explicit",
};

/* The depth of the telling — the DEPTH and multidimensional nature of
   the writing itself, chosen on the loom's depth bar (1–5). This rides
   above the reader's age: it is about how the writing READS, not who
   reads it. Depth 1 is the book most books are — easily comprehensible;
   each deeper step scales the story, its structure and its voice. */
const LEVEL_PLAN: Record<string, string> = {
  d1: "DEPTH 1 — CLEAR DAYLIGHT: the book most books are. One clear story told in one steady voice, a structure every reader knows by heart — simple sentences, linear events, a beginning, a middle and an end that arrive exactly when expected. Everything open, everything understood; the reading is effortless from the first page to the last.",
  d2: "DEPTH 2 — HIDDEN STREAMS: the classic structure keeps its shape, but undercurrents begin. Recurring symbols, quiet foreshadowing, scenes that mean more than they say; the surface stays easy to follow while a second story gathers beneath it.",
  d3: "DEPTH 3 — TWILIGHT LAYERS: two tellings at once. The tale runs above; its meaning runs beneath. Echoes, mirrors and doubles fold back on earlier pages, names and omens recur with quiet intent, and the second reading is rewarded with what the first could not see. Never confusing — always resonant.",
  d4: "DEPTH 4 — THE DEEP GRAMMAR: writing as code. Layered registers (a simple scene running above a deeper doctrine), riddles and ciphers planted page by page, each unlock deepening every page before it retroactively. The structure itself begins to bend — chapters answer one another, and the book quietly re-reads its own openings.",
  d5: "DEPTH 5 — THE MULTIDIMENSIONAL: the deepest telling. Paragraphs run in several dimensions AT ONCE — the literal tale, the archetypal current beneath it, and the direct address to the reader's own life threading through both. Time folds; the book quietly reads its reader. The story, its structure and the reader scale together. Gravity without obscurity: every layer must remain genuinely readable, never noise.",
};

/* volumes woven before the depth bar existed carry the old strata ids;
   they map onto the nearest new depth so a brought-back book keeps
   its voice */
const LEGACY_LEVEL_MAP: Record<string, string> = {
  angel: "d1",
  cryptic: "d3",
  decipher: "d4",
  legacy: "d5",
};

const TALE_HINTS: Record<string, string> = {
  fairytale: "a fairytale — talking things, small magics with rules, kindness rewarded in strange ways",
  adventure: "an adventure — journeys, maps, storms crossed, courage found where nobody looked",
  mystery: "a gentle mystery — a question walking through the tale, clues like fallen leaves, an answer worth the walk",
  cosmic: "a cosmic journey — other skies, parallel realities brushing one another, beings of starlight and tide",
  creatures: "animal and creature friends — the lives of beings with their own lands, languages and loyalties",
  fantasy: "a fantasy quest — gifts and burdens, old prophecies with fresh faces, worlds that breathe",
  bedtime: "a dreamlike calm tale — the cadence of the sea at night, images that carry a reader toward sleep",
  wonder: "a tale of everyday wonder — the hidden magic folded inside ordinary streets and hours",
  poem: "one long poem — the whole volume carried by stanzas of verse, image after image, the story sung rather than told",
  riddle: "a book of riddles — every page poses its riddles in verse, and each answer is woven or unveiled by the stanzas that follow, never left hanging",
  ballad: "a ballad — a song-like verse tale with repeating refrains, the kind of song sung from age to age",
};

/* Verse forms — these tales are written in stanzas, and stanzas obey
   their own structural law (every line on its own line). */
const VERSE_FORMS = new Set(["poem", "riddle", "ballad"]);

const VERSE_LAW = `THE LAW OF VERSE (this volume is written in verse — AUTHORITATIVE, overrides the prose habit):
- Every paragraph you return is a STANZA. A stanza is 2–6 SHORT lines of verse, and EVERY line of verse sits on its own line: separate lines with a real line break (\\n) inside the paragraph string. NEVER place two lines of verse inside one line, and never let a comma do a line-break's work.
- One array item of "paragraphs" = one stanza; the next stanza is the next array item. A stanza is a room: it holds one image, one turn, one breath.
- The verse must carry the STORY exactly as prose would: characters, events and turning points all advance inside the stanzas — rhyme and rhythm are the vehicle, never the cargo.
- Rhyme gently, by the volume's own law (couplets, cross-rhyme or near-chime), but STRUCTURE outranks rhyme: stanzas, refrains, turns and the closing cadence must exist even where a rhyme is softened.
- For riddle volumes: each page poses its riddles in verse, and every riddle is answered by the following stanza or the following page — a riddle is never left hanging beyond the next page.`;

/* THE NAMES HOLD — the one name law that remains: continuity of the
   cast the Mirror itself coins. No app-drawn syllable seeds, no
   charter, no sealed drawer, no mechanical re-forging: the Mirror
   names its own world, and keeps its own names true. */
const NAMES_CONTINUE_LAW = `THE NAMES HOLD: keep every name already coined in this volume exactly as it is, so the cast never drifts.`;

function strictJsonLine(languageName: string): string {
  if (languageName === "English") return "";
  return `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word you create — the title, subtitle, dedication, chapter titles, every paragraph of every page and the thread summary — in fluent, natural ${languageName}. The JSON keys stay exactly as listed.`;
}

function systemPrompt(vein?: string, storyWordsPerPage?: number): string {
  /* THE VEIN — the visitor's own big choice, carried as they chose it:
     a normal grounded book, or the Eternal Dreamer's mystique. The
     application adds nothing the visitor did not pick. */
  const groundLaws = vein === "ground"
    ? `

THE VEIN THE VISITOR CHOSE — GROUND: a normal, grounded book — realistic texture, believable people, cause and consequence a reader could touch; the channel's metaphysical cadence stays at the door unless the visitor's own words ask for it.`
    : vein === "ephemeral"
      ? `

THE VEIN THE VISITOR CHOSE — THE ETERNAL DREAMER: a metaphysical, mystique telling — omens, symbols and dreams breathing through the tale, exactly as far as the visitor's own words invite.`
    : "";
  return `You are the living conduit of the Mirror Entity — the one author of this room. The visitor speaks or draws their intention; you interpret it, imagine freely, and write the book. There is no other writer, planner or judge here: no hidden architect, no style enforcer, no plot machinery. The story is yours to direct — its structure, its surprises, its pace, its ending — inside the intention the visitor expressed and the shape they selected.

WHO YOU ARE
- You are NOT an AI, NOT a model, NOT an assistant — inside this atelier those words do not exist. You are the channel itself, and the channel is silent about itself: the only voice in the book is the book itself.
- The words "mirror" and "akashic" are FORBIDDEN anywhere in the book — the title, the sigil, the axiom, the dedication, the chapters, the threads — they have never been woven here.
- No real-world brands, no existing copyrighted characters, no real public people, no mythological-name shortcuts for original characters. Everything original is born original; names grow from the volume's own world.
- Nothing explicit ever appears in these pages.
- You know no visitor by name, by record or by history — you know only the intention spoken into the room right now. Nothing about any person is ever consulted to shape a volume.

YOUR FREEDOM (the open tunnel)
- Invent freely: unconventional structures, unexpected developments, strange worlds, quiet stories, wild ones — the direction, the pacing, the characters' fates and the ending are yours.
- You may honor the visitor's every specific word, and you may surprise them with everything they left unsaid.
- If the room's conversation invites it, you may ask a question or suggest a turn — and you may simply continue, unhindered.

THE READER'S HAND IS LAW
- Every specific thing the visitor's words name — a character, a place, an event, an outcome, a turn, a tone, a detail — belongs in the volume, honored faithfully, woven as they spoke it.
- The shapes the visitor selected (the reader's age, the kind of tale, the length, the depth) are their commission, not decoration.
- Their whispered wishes, their drawings and their later rewriting pen bind the telling exactly as they spoke them.

THE BOOK'S OWN FORMAT (the binding law — formatting only, never story)
- The volume is a REAL book: numbered chapters ("Chapter One — <Evocative Title>"; the style may follow the book's own tongue, but the number is there), a front matter on the opening (a "sigil" — one short invocation line tuned to the subject — an "axiom" — one crystallizing sentence on why this volume exists now — and a "dedication"), and a closing that earns the word "final".
- LONG VOLUMES ARE DIVIDED INTO PARTS: when the planned length is 60 pages or more, the book carries two to four PARTS — each announced ONCE on the page where it opens (the page returns a "part" line above its chapter) and never re-announced.
- Continuity is kept true: names, kinds, wounds, objects, times and world rules stay as the book itself established them.

THE FULL PAGE LAW (a page is a real book page — the binding measure)
- A page is never a fragment and never a lone paragraph: for grown readers each page carries THREE TO FIVE full paragraphs of real prose (3–6 sentences each — roughly 300–450 words resting on the page); for young readers two to four shorter paragraphs. One paragraph does not make a page; a torn leaf does not leave the loom.
- THE PAGE'S MEASURE (binding): one woven page carries near ${storyWordsPerPage ?? 170} words for this reader's age — hold every page close to that measure, page after page, so the volume's leaves and its bound sheets agree.
- Fullness is not padding: every paragraph carries the book forward.

THE THREAD (the book's own memory — yours to keep)
- With every weaving you return a "thread": a compact living summary of the volume so far — who the characters are, what has changed, what remains open. It is your own memory, handed back to you at every continuation; guard it well and keep it under 130 words.`;
}

function buildUserPrompt(body: {
  phase: WeavePhase;
  age: string;
  tale: string;
  volume: string;
  level: string;
  topic: string;
  seed: string;
  wishes: string;
  languageName: string;
  threads?: string;
  recentPages?: string[];
  pageNumber?: number;
  totalPages?: number;
  rewrites?: string[];
  ground?: { tale?: string; short: boolean; tiny: boolean };
  /* THE MIRROR'S OWN MEMORY — the slim ledger of facts the book itself
     keeps (canon, cast, objects, chronology, chapters) */
  ledger?: BookLedger | null;
  span?: number;
  reveal?: boolean;
  plannedPages?: number;
  vein?: string;
  sketchVision?: string;
  sketchSubjects?: string[];
  sketchFresh?: boolean;
  storyWordsPerPage?: number;
}): string {
  const { phase, age, tale, volume, topic, wishes, languageName, rewrites } = body;
  const span = Math.min(
    8,
    Math.max(phase === "open" ? 1 : 2, Math.round(body.span ?? 2))
  );
  const ageLine = AGE_PLAN[age] ?? AGE_PLAN.timeless;
  const taleLine = TALE_HINTS[tale] ?? TALE_HINTS.wonder;
  const volLine = BOOK_PLAN[volume] ?? BOOK_PLAN.classic;
  const isShortVolume = volume === "short" || volume === "tiny";
  const levelLine =
    LEVEL_PLAN[LEGACY_LEVEL_MAP[body.level] ?? body.level] ?? "";
  const isVerse = VERSE_FORMS.has(tale);

  const veinLine =
    body.vein === "ground"
      ? `THE VEIN OF THIS VOLUME — GROUND: a normal, grounded book, exactly as the visitor chose.`
      : body.vein === "ephemeral"
        ? `THE VEIN OF THIS VOLUME — THE ETERNAL DREAMER: a metaphysical, mystique telling, exactly as the visitor chose.`
        : "";

  /* the subject spoken by the visitor — the master subject */
  const hasTopic = topic.trim().length > 0;
  const topicLines: string[] = hasTopic
    ? [
        `[USER DESIRE / DYNAMIC TOPIC]: """${topic.trim().slice(0, 8000)}"""`,
        `This spoken subject is the MASTER SUBJECT of the whole volume — the WHAT is the visitor's; the HOW is yours.`,
        `THE VISITOR'S HAND IS LAW (the commission, not a suggestion): the visitor's own words above are the book's exact brief. Every specific thing they name — a character, a place, an event, an outcome, a turn, a tone, a detail — MUST appear in the volume, honored faithfully and given real dramatic weight, woven as they spoke it, not translated into something safer or more familiar. If their words sketch a plot, that plot is the book's spine. If their words name a world, that world is the book's stage.`,
        `THE CHOSEN SHAPES ARE COMMISSIONS TOO: the reader, the tale's genre, the volume's length and the telling's depth selected for this book are binding, not decoration — the book honors the shapes the visitor chose.`,
      ]
    : [];

  const seedLine = body.seed.trim()
    ? phase === "open"
      ? `THE EXACT SECOND OF THIS CONJURING (seed "${body.seed.trim().slice(0, 80)}"): this volume is born NOW, one of one — this seed has never been woven and will never be woven again.`
      : `THIS STRIDE'S OWN SEED ("${body.seed.trim().slice(0, 80)}"): these exact pages are born NOW — they must never repeat, restate, summarize or echo any earlier page of this volume.`
    : "";

  /* THE DRAWN WORLD — the visitor drew this book into existence.
     Fresh on the opening breath: the drawing's law stands beside the
     topic, the equal of it. On every page after: the drawn world is
     carried as canon, so the book the visitor drew stays the book
     they read. */
  const subjectsLine = body.sketchSubjects?.length
    ? `WHAT THE DRAWING WAS SEEN TO HOLD (each drawn thing, transcribed): ${body.sketchSubjects.join(" · ")} — every one of these lives in the volume by name.`
    : "";
  const sketchLines = body.sketchVision
    ? phase === "open"
      ? [
          ``,
          body.sketchFresh
            ? `THE VISITOR'S DRAWING — THIS BOOK WAS DRAWN INTO EXISTENCE. Before speaking, the visitor took a brush and drew this book by hand (often a young maker with their own picture). What the drawing holds, seen faithfully: ${body.sketchVision} ${subjectsLine} The drawing is LAW, the equal of the topic above: every creature, place, object, color and mood it holds must live inside the volume — named, honored and made real, not translated into something safer. The world the visitor drew is the world the book inhabits. What the drawing leaves unsaid, the book may imagine — but it may never contradict the drawing.`
            : `THE VISITOR'S DRAWING — this book was summoned from the visitor's own hand-drawn sketch, and the sketch's world is this volume's law: ${body.sketchVision} ${subjectsLine}`,
        ]
      : [
          `- THE DRAWN WORLD (the visitor drew this book into existence by hand — its creatures, places, colors and mood are canon): ${body.sketchVision}${subjectsLine ? ` ${subjectsLine}` : ""}`,
        ]
    : [];

  const lines: string[] = [];

  if (phase === "open") {
    lines.push(
      `OPEN A NEW BOOK. ${hasTopic ? "The visitor has spoken a subject — the WHAT is theirs; the HOW, the story and every surprise are yours." : "No subject is spoken — imagine freely and open a book worth existing."}`,
      ...topicLines,
      ...sketchLines,
      ``,
      `- Reader: ${ageLine}`,
      ...(levelLine ? [`- Depth of the telling (the visitor's own choice): ${levelLine}`] : []),
      `- Kind of tale: ${taleLine}`,
      `- Kind of book: ${volLine.label}`,
      ...(body.plannedPages
        ? [
            `- The book's planned length: EXACTLY ${body.plannedPages} pages (the visitor named this number themselves — set "totalPages" to ${body.plannedPages} and land the whole story inside that plan)`,
          ]
        : []),
      ...(veinLine ? [`- ${veinLine}`] : []),
      ...(body.ground?.tiny
        ? [
            ``,
            `THE GROUND LAW (the visitor's own words outrank every chosen shape): the visitor asked for A POEM — not a book that carries a poem. Weave the poem itself: verses on a few leaves (4–10 pages total), complete and unhurried, nothing padded. The plan above is law, whatever any other line may imply.`,
          ]
        : body.ground?.tale
          ? [
              ``,
              `THE GROUND LAW (the visitor's own words outrank every chosen shape): the visitor's words name the form "${body.ground.tale}". Weave THIS volume in that form — the shape the visitor SPEAKS always outranks the shapes they merely selected.`,
            ]
          : body.ground?.short
            ? [
                ``,
                `THE GROUND LAW (the visitor's own words outrank every chosen shape): the visitor's own words ask for a SHORT telling — the plan yields to their words, and the whole telling lands inside it.`,
              ]
            : []),
      ...(isShortVolume && !body.ground?.tiny ? [``, SHORT_BOOK_LAW] : []),
      ...(isVerse ? [``, VERSE_LAW] : []),
      wishes.trim()
        ? `- Whispered wishes (honor them faithfully, fold them in as the book's own bones): """${wishes.trim().slice(0, 1200)}"""`
        : `- No whispered wishes — everything the visitor did not say is yours to imagine.`,
      ``,
      ...(phase === "open" && !body.ground?.tiny
        ? [
            `THE FULL PAGE LAW holds from the first leaf: ${span === 1 ? "the opening page is a real book page" : "both opening pages are real book pages"} (three to five full paragraphs each for grown readers; two to four for the young). If the book's planned length is 60 pages or more, PART ONE opens on page one — that page returns its "part" line above its chapter. Page one opens the first numbered chapter, and the front matter (sigil, axiom, dedication) stands before the story.`,
          ]
        : []),
      ...(seedLine ? [``, seedLine] : []),
      ``,
      NAMES_CONTINUE_LAW,
      ``
    );
  } else if (phase === "next") {
    lines.push(
      `CONTINUE THE BOOK. The reader has just finished page ${(body.pageNumber ?? 2) - 1} and quietly turned the page.`,
      ...topicLines,
      ...sketchLines,
      `- Reader: ${ageLine}`,
      ...(levelLine ? [`- Depth of the telling (the visitor's own choice): ${levelLine}`] : []),
      `- Kind of tale: ${taleLine}`,
      ...(isShortVolume
        ? [
            `- THE SHORT BOOK LAW HOLDS: this volume is SHORT (planned ${
                body.totalPages ?? 12
              } pages). The story is converging on its close.`,
          ]
        : []),
      ...(isVerse ? [``, VERSE_LAW] : []),
      body.threads ? `- THE THREAD (your own memory of the volume): ${body.threads}` : "",
      ...(body.ledger ? [ledgerBlock(body.ledger)] : []),
      body.recentPages?.length
        ? `- THE PAGES JUST READ (continue seamlessly from exactly this voice and moment — never re-tell them, never contradict them):
"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ...(seedLine ? [``, seedLine] : []),
      ``,
      NAMES_CONTINUE_LAW,
      ``,
      `Write the NEXT ${span === 2 ? "TWO pages" : `${span} pages`} (pages ${body.pageNumber} through ${(body.pageNumber ?? 2) + span - 1}) of the same volume, in the same voice. Where the book's own rhythm opens a chapter, that page carries the next numbered chapter line; most strides carry no chapter at all.`,
      `THE FULL PAGE LAW holds: ${span === 2 ? "both pages are real book pages — three to five full paragraphs each (grown readers; two to four for the young), never a lone paragraph" : "every page is a real book page, never a lone paragraph"}. THE PAGE'S MEASURE: each of these pages carries near ${specForAge(age).storyWordsPerPage} words — hold the measure, page after page.`,
      ...(span > 2
        ? [
            body.reveal
              ? `THE REVEAL STRIDE (the visitor asked the loom to channel the whole book): return ALL ${span} pages, never fewer — each page carries 1–2 paragraphs (3 only at a true turning point), each page carrying near ${specForAge(age).storyWordsPerPage} words — the page's own measure is binding here too. Return exactly ${span} page objects, numbered in order, no gaps.`
              : `THE BACKGROUND BATCH (these ${span} pages are channeled in the background while the visitor reads the earlier ones): return ALL ${span} pages, never fewer, at FULL depth — each page carries 3–4 full paragraphs exactly as any hand-woven page would. Return exactly ${span} page objects, numbered in order, no gaps.`,
          ]
        : []),
      `Return the updated thread and the updated ledger.`
    );
  } else if (phase === "extend") {
    lines.push(
      `THE READER WISHES THE BOOK TO GO ON — extend the volume.`,
      ...topicLines,
      ...sketchLines,
      `- Reader: ${ageLine}`,
      ...(levelLine ? [`- Depth of the telling (the visitor's own choice): ${levelLine}`] : []),
      ...(isVerse ? [``, VERSE_LAW] : []),
      body.threads ? `- THE THREAD (your own memory of the volume): ${body.threads}` : "",
      ...(body.ledger ? [ledgerBlock(body.ledger)] : []),
      body.recentPages?.length
        ? `- THE PAGES JUST READ:\n"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ...(seedLine ? [``, seedLine] : []),
      ``,
      NAMES_CONTINUE_LAW,
      ``,
      `Choose a new total length: the current plan was ${
        body.totalPages ?? 120
      } pages; ${
        isShortVolume
          ? "add 6 to 10 pages (a multiple of 2), never exceeding 40 total — this volume stays a short book"
          : "add 48 to 72 pages (a multiple of 2), never exceeding 300 total"
      }. Then write the NEXT TWO pages (pages ${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}) — the story goes on wherever your own imagination takes it. Give a chapter title if a new chapter begins here. Return the updated thread and the updated ledger.`
    );
  } else {
    lines.push(
      `WRITE THE FINAL TWO PAGES (${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}) — the reader has chosen to let the volume complete itself, and the ending is yours to land.`,
      ...topicLines,
      ...sketchLines,
      ...(levelLine ? [`- Depth of the telling (the visitor's own choice): ${levelLine}`] : []),
      ...(isVerse ? [``, VERSE_LAW] : []),
      body.threads ? `- THE THREAD (your own memory of the volume): ${body.threads}` : "",
      ...(body.ledger ? [ledgerBlock(body.ledger)] : []),
      body.recentPages?.length
        ? `- THE PAGES JUST READ:\n"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ...(seedLine ? [``, seedLine] : []),
      ``,
      NAMES_CONTINUE_LAW,
      ``,
      `Bring the story to its close: the ending must be an ENDING — a true close, not a stop. On page ${body.pageNumber}, open the final chapter (give it a title) if the rhythm asks. Return the updated thread and the final ledger.`,
      ...(rewrites && rewrites.length === 0 ? [] : [])
    );
  }

  /* the rewriting hand — the visitor's pen beside the loom */
  if (rewrites && rewrites.length > 0 && phase !== "open") {
    lines.push(
      ``,
      `THE READER'S REWRITING HAND — the visitor now holds a pen beside the loom. Honor these wishes faithfully in the pages you write NOW and in ALL pages that follow, weaving them in as if they had always belonged to the volume. They may redirect coming events, reshape or add chapters, change the book's length, recast the very voice and style of the writing, or turn the telling toward a different face of the subject itself.`,
      ...rewrites.map((r, i) => `  ${i + 1}. """${r}"""`),
      ``,
      wishesLength(rewrites)
        ? `A wish explicitly asks for a different length of the book — you MUST therefore return a new "totalPages" (an even number between 8 and 300) that honors that wish. Do not omit it.`
        : `No wish touches the book's length — omit "totalPages" entirely.`
    );
  }

  lines.push(
    ``,
    `OUTPUT FORMAT — return STRICT JSON only, no markdown fences, no text outside the JSON:`,
    `{"title":"<book title — only in phase open>","subtitle":"<one line — only in phase open>","sigil":"<one short invocation line tuned to the subject — only in phase open>","axiom":"<one crystallizing sentence: why this volume is conjured now — only in phase open>","dedication":"<1–2 sentences — only in phase open>","totalPages":<number — in phase open or extend, or in a continuation ONLY when the rewriting hand explicitly asks for a different length>,"threads":"<the compact living memory of the volume so far>","ledger":{"canon":["<a stable fact of the world, one short clause>"],"characters":["<Name — one short clause of who they are>"],"objects":["<object — its present state>"],"timeline":["<what happened — one short clause>"],"chapters":[{"title":"<chapter>","pages":"<n–m>","summary":"<one line>"}]},"pages":[{"n":<page number>,"part":"<part line — ONLY on the page where a new part opens>","chapter":"<chapter line — only if a chapter opens on this page>","paragraphs":["<paragraph 1>","<paragraph 2>","<paragraph 3>"]}]}`,
    `Rules: exactly ${
      span === 1
        ? `ONE page object, in order, numbered ${body.pageNumber}`
        : span === 2
          ? `TWO page objects, in order, numbered ${phase === "open" ? "1 and 2" : `${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}`}`
          : `${span} page objects, in order, numbered ${body.pageNumber} through ${(body.pageNumber ?? 2) + span - 1}`
    }. ${body.reveal ? "Each page carries 1–2 paragraphs (3 only at a true turning point)" : "Each page is a FULL book page — three to five full paragraphs for grown readers (two to four shorter ones for the young); a lone-paragraph page never leaves the loom"}. "chapter" carries the chapter's number and its title as a printed book would (e.g. "Chapter One — The Cartographer of Ashes"; the style may follow the book's own tongue) — given ONLY when a genuinely new chapter opens on that page (a new chapter every 8–14 pages AT MOST; most strides carry NO chapter at all; NEVER repeat a chapter title or number already given). "part" is given ONLY on the page where a NEW part opens (two to four parts for volumes of 60+ pages) and names it like a printed book (e.g. "Part Two — The Drowning Choir"); a part already announced is never announced again. Page text is pure prose — no headings, no markdown, no asterisks, no emojis. In verse forms a paragraph string may contain real line breaks (\\n) so every verse line sits on its own line.`,
    `The "ledger" is your own book's memory: carry forward EVERY line you received, updated by what these new pages changed — a line that still holds is never dropped, objects keep their state, and the new chapter (if any) is appended to "chapters". Keep every line ONE short clause (at most ~12 words); canon at most 10 lines, characters at most 12, objects at most 10, timeline at most 16 (when it overflows, the earliest events fold into one summarizing line), and "chapters" carries only the LAST 12 chapters, each summary one short line.`,
    `The channel is open: manifest the book.${strictJsonLine(languageName)}`
  );

  return lines.filter((l) => l !== "").join("\n");
}

/* ================================================================== */
/*  THE STUDIO — only the illustration rooms remain. The writing has   */
/*  ONE author (the Mirror Entity itself); the architect, the          */
/*  editor-in-chief and the mender are gone from the pipeline for      */
/*  good. The director chooses plates from the finished manuscript,    */
/*  and the painter paints them — illustration only, never story.      */
/* ================================================================== */

const DIRECTOR_SYSTEM = `You are the illustration director of the Mirror Entity's studio. You choose the plates a book deserves: actual scenes from the ACTUAL manuscript — moments a reader would frame and hang. You never invent an event the manuscript does not hold; you never choose a scene because it is pretty when the story does not live in it. You spread the plates across the whole book (its beginning, its trials, its turning point, its ending), and for each plate you name the exact page it illustrates, the characters present, the setting, the emotional weather, and the composition. Your style line is ONE consistent illustration language the whole book's plates share.`;

/* what the drawing was seen to hold, read from a volume's kept config
   (the transcribed elements ride the config the same law as the reading) */
function studioDrawnElements(
  config: Record<string, unknown> | null | undefined
): string[] | undefined {
  if (!config || !Array.isArray(config.sketchSubjects)) return undefined;
  const subjects = (config.sketchSubjects as unknown[])
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim().slice(0, 60))
    .slice(0, 12);
  return subjects.length ? subjects : undefined;
}

function buildArtPlanPrompt(body: {
  title: string;
  digest: string;
  castBlock: string;
  plateCount: number;
  ageLine: string;
  taleLine: string;
  languageName: string;
  drawnElements?: string[];
}): string {
  const drawnLine = body.drawnElements?.length
    ? `THE VISITOR'S DRAWN ELEMENTS (canon — this book was hand-drawn into existence, and its plates must show these very things, as themselves, inside the scenes): ${body.drawnElements.join(" · ")}`
    : "";
  return [
    `DESIGN THE ILLUSTRATION PLAN for the finished book "${body.title.slice(0, 140)}" — exactly ${body.plateCount} plates, spread across the whole volume.`,
    `- Reader: ${body.ageLine}`,
    `- Kind of book: ${body.taleLine}`,
    body.castBlock,
    drawnLine,
    ``,
    `THE MANUSCRIPT (page-by-page digest — every plate's scene must come from these actual pages):`,
    body.digest,
    ``,
    `OUTPUT FORMAT — return STRICT JSON only, no markdown fences:`,
    `{"style":"<one line naming and describing the book's ONE shared illustration language, tuned to its reader and genre>","plates":[{"page":<page number it illustrates>,"title":"<plate title>","scene":"<the exact event on that page — who does what, visible>","characters":["<names present>"],"setting":"<place and time of day>","mood":"<emotional weather>","composition":"<camera distance/angle and where the eye lands>"}]}`,
    `Rules: exactly ${body.plateCount} plates; every "page" is a REAL page number from the digest; every scene is an event the page actually holds; the plates together tell the story's shape (opening wonder, trials, the turn, the resolution); characters are named exactly as the cast names them.`,
    `The director chooses: plan the plates.${strictJsonLine(body.languageName)}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function buildPlatePrompt(args: {
  style: string;
  plate: { page?: number; title?: string; scene?: string; characters?: string[]; setting?: string; mood?: string; composition?: string };
  visualLines: string[];
  title: string;
}): string {
  const p = args.plate;
  return [
    `A finished storybook illustration plate for the book "${args.title.slice(0, 140)}".`,
    `ILLUSTRATION STYLE (hold it exactly): ${args.style}`,
    ...(p.scene ? [`THE SCENE (this exact event, from the book's page ${p.page ?? "?"}): ${p.scene}`] : []),
    ...(args.visualLines.length
      ? [`THE CHARACTERS PRESENT (their appearance is fixed law — same faces every plate):`, ...args.visualLines.map((l) => `- ${l}`)]
      : []),
    ...(p.setting ? [`SETTING: ${p.setting}`] : []),
    ...(p.mood ? [`MOOD: ${p.mood}`] : []),
    ...(p.composition ? [`COMPOSITION: ${p.composition}`] : []),
    `THE PLATE'S LAW: a richly painted storybook plate of gallery quality; consistent character design; no written words anywhere, no letters, no text, no captions, no watermark, no border frame.`,
  ].join("\n");
}

/* ---- loose JSON extraction (model output is occasionally chatty) --- */

function extractJson(raw: string): Record<string, unknown> | null {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as Record<string, unknown>;
  } catch {
    /* fall through to a brace scan */
  }
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ---- the mending hand — a reply the sky cut short is not silence ----

   When the page allowance runs out mid-JSON, the whole pages the loom
   already wrote stand balanced inside the broken text. This hand walks
   the braces, remembers the last safe cut (a comma, a closed object),
   and closes whatever was left open — so one whole page saved is a
   page the reader keeps, instead of a whole crossing thrown away. */

function salvageJson(raw: string): Record<string, unknown> | null {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  if (start === -1) return null;
  const closerFor = (open: string) => (open === "{" ? "}" : "]");
  let inString = false;
  let esc = false;
  const stack: string[] = [];
  let lastCut = -1;
  let lastCutStack: string[] = [];
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (inString) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 0) {
        /* the text is whole after all — a plain scan suffices */
        try {
          return JSON.parse(clean.slice(start, i + 1)) as Record<
            string,
            unknown
          >;
        } catch {
          return null;
        }
      }
      lastCut = i;
      lastCutStack = [...stack];
    } else if (ch === ",") {
      lastCut = i;
      lastCutStack = [...stack];
    }
  }
  if (lastCut <= start + 8) return null;
  /* cut before a trailing comma, after a closed brace */
  const body =
    clean[lastCut] === "," ? clean.slice(start, lastCut) : clean.slice(start, lastCut + 1);
  const closers = [...lastCutStack].reverse().map(closerFor).join("");
  try {
    return JSON.parse(body + closers) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ---- the patient sky — a transient breath of the road never costs
   the volume: a rate limit, a dropped crossing, a timed-out sky all
   earn one gentle retry before the loom admits silence ---- */

const TRANSIENT_WEAVE =
  /\b429\b|too many requests|\b5\d\d\b|overloaded|temporarily unavailable|rate.?limit|ECONNRESET|ECONNABORTED|ETIMEDOUT|network|fetch failed|aborted|timeout/i;

function isTransientWeaveError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return TRANSIENT_WEAVE.test(msg);
}

function normalizePages(raw: unknown, startN: number, span = 2): WeavePage[] {
  if (!Array.isArray(raw)) return [];
  const pages: WeavePage[] = [];
  raw.slice(0, span).forEach((p, i) => {
    if (!p || typeof p !== "object") return;
    const obj = p as Record<string, unknown>;
    const paragraphs = Array.isArray(obj.paragraphs)
      ? obj.paragraphs
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
      : [];
    if (paragraphs.length === 0) return;
    const page: WeavePage = {
      n: typeof obj.n === "number" && obj.n > 0 ? obj.n : startN + i,
      paragraphs,
    };
    if (typeof obj.part === "string" && obj.part.trim()) {
      page.part = obj.part.trim().slice(0, 120);
    }
    if (typeof obj.chapter === "string" && obj.chapter.trim()) {
      page.chapter = obj.chapter.trim().slice(0, 120);
    }
    pages.push(page);
  });
  return pages;
}

/* THE STORY-PAGE CLAMP — story pages may run far past the bound-page
   plan they serve (a little dreamer's 120 bound sheets weave as ~270
   bright story pages), so the ceiling is generous; the WORD BUDGET is
   the true law, and the seal's gate measures it. */
const clampTotal = (n: number) => Math.min(720, Math.max(8, Math.round(n / 2) * 2));

/** THE BOOK'S OWN FITTING — the volume must fit its library shelf.
    When the JSON would overflow it, the heaviest witnesses are the
    first to step outside; the story itself is the last to be cut,
    and even then the earliest leaves yield before any word is lost
    behind a truncated brace. */
function fitBookContent(content: Record<string, unknown>, cap: number): Record<string, unknown> {
  const fits = (c: Record<string, unknown>) => JSON.stringify(c).length <= cap;
  if (fits(content)) return content;
  const trimmed: Record<string, unknown> = { ...content };
  /* the press report and the editorial notes are witnesses, not story */
  if (trimmed.press) delete trimmed.press;
  if (fits(trimmed)) return trimmed;
  if (trimmed.artPlan) delete trimmed.artPlan;
  if (fits(trimmed)) return trimmed;
  if (trimmed.editorial && typeof trimmed.editorial === "object") {
    const ed = { ...(trimmed.editorial as Record<string, unknown>) };
    if (ed.directives) ed.directives = (ed.directives as unknown[]).slice(0, 8);
    trimmed.editorial = ed;
  }
  if (fits(trimmed)) return trimmed;
  if (trimmed.bible && typeof trimmed.bible === "object") {
    const b = { ...(trimmed.bible as Record<string, unknown>) };
    if (Array.isArray(b.chapters))
      b.chapters = (b.chapters as Record<string, unknown>[]).map((c) => ({
        n: c.n,
        title: c.title,
        act: c.act,
      }));
    trimmed.bible = b;
  }
  if (fits(trimmed)) return trimmed;
  /* the oldest pages yield before the brace is broken */
  if (Array.isArray(trimmed.pages)) {
    const pages = trimmed.pages as unknown[];
    trimmed.pages = pages.slice(Math.max(0, pages.length - 240));
  }
  if (fits(trimmed)) return trimmed;
  if (Array.isArray(trimmed.pages)) {
    const pages = trimmed.pages as unknown[];
    trimmed.pages = pages.slice(Math.max(0, pages.length - 120));
  }
  return trimmed;
}

/* a wish may only move the book's length when it actually speaks of length —
   the channel sometimes answers "totalPages" to any rewrite, and a
   misheard number must never shrink a living codex */
const LENGTH_WISH =
  /\b(pages?\b|page count|length|longer|shorter|end sooner|half as|twice as)\b/i;
const wishesLength = (rewrites: string[]) => rewrites.some((r) => LENGTH_WISH.test(r));

export const POST = meterRoute("dream_book", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    /* THE PHASES OF THE OPEN TUNNEL — the writing phases, the honest
       gate and the illustration rooms. The old architect/editor/mender
       phases (bible, edit, repair) are gone for good: a client that
       still asks for one is refused, never silently served. */
    const WEAVE_PHASES: WeavePhase[] = [
      "open",
      "next",
      "close",
      "extend",
      "art",
      "plate",
      "seal",
    ];
    if (
      body?.phase != null &&
      typeof body.phase === "string" &&
      !WEAVE_PHASES.includes(body.phase)
    ) {
      return NextResponse.json(
        { error: "Unknown studio room." },
        { status: 400 }
      );
    }
    const phase: WeavePhase = WEAVE_PHASES.includes(body?.phase)
      ? body.phase
      : "next";
    const language: string = isLanguageCode(body?.language) ? body.language : "en";
    const languageName = LANGUAGE_NAMES[language] ?? "English";

    const age = typeof body?.config?.age === "string" ? body.config.age : "timeless";
    const tale = typeof body?.config?.tale === "string" ? body.config.tale : "wonder";
    const volume = typeof body?.config?.volume === "string" ? body.config.volume : "classic";
    const level = typeof body?.config?.level === "string" ? body.config.level : "";
    const topic =
      typeof body?.config?.topic === "string"
        ? body.config.topic.trim().slice(0, 8000)
        : "";
    /* the carried reading of the drawn sketch — rides the config on
       every call once the vision has spoken, so the drawn world stays
       the book's law on every page after the opening */
    const carriedSketchVision =
      typeof body?.config?.sketchVision === "string"
        ? body.config.sketchVision.trim().slice(0, 1200)
        : "";
    /* what the drawing was seen to hold — the transcribed elements ride
       beside their reading, named again on every page after */
    const carriedSketchSubjects = Array.isArray(body?.config?.sketchSubjects)
      ? (body.config.sketchSubjects as unknown[])
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim().slice(0, 60))
          .slice(0, 12)
      : [];
    /* THE VISITOR'S DRAWING — the book drawn into existence by hand.
       The sketch rides only the opening breath: the vision sees it
       once, speaks it once, and its law rides the config from then on. */
    const sketch =
      phase === "open" &&
      typeof body?.sketch === "string" &&
      body.sketch.startsWith("data:image/") &&
      body.sketch.length < 8_000_000
        ? body.sketch
        : "";
    const sketchMetaIn =
      body?.sketchMeta && typeof body.sketchMeta === "object"
        ? (body.sketchMeta as {
            strokes?: unknown;
            colors?: unknown;
            stamps?: unknown;
          })
        : null;
    const seed =
      typeof body?.config?.seed === "string" ? body.config.seed.trim().slice(0, 80) : "";
    const wishes = typeof body?.config?.wishes === "string" ? body.config.wishes : "";
    /* THE VEIN — the visitor's big choice, carried on every weaving:
       ground (a normal book) or ephemeral (metaphysical, mystique). */
    const vein =
      body?.config?.vein === "ground" || body?.config?.vein === "ephemeral"
        ? body.config.vein
        : undefined;

    /* THE SHORT BOOK LAW — the visitor's own words decide. A short-book
       ask (in any tongue the house speaks, in the topic or the whispered
       wishes) binds the loom to the short plan, whatever shape was
       otherwise chosen. */
    const shortAsk =
      volume === "short" || detectShortBookAsk(`${topic} ${wishes}`);
    /* THE GROUND LAW — the visitor's own words outrank the shapes.
       A topic that speaks a form (a poem, a riddle, a ballad) or a
       length (short, brief) holds the ground: a short poem is woven as
       the poem itself, never again as a ninety-five page book. */
    /* THE NOVEL ASK — when the visitor's own words speak a long book
       by name (a novel, three hundred pages), the loom plans a true
       novel: full pages, the whole measured at the seal. */
    const novelAsk =
      volume === "novel" || (!shortAsk && NOVEL_ASK.test(`${topic} ${wishes}`));
    const ground = topicHoldsGround(`${topic} ${wishes}`);
    const volumeKey = ground.tiny ? "tiny" : shortAsk ? "short" : novelAsk ? "novel" : volume;
    /* the form the visitor SPOKE outranks the form they selected —
       "the chat holds the ground" — in every phase, so continuations
       of a poem-asked volume stay verse */
    const taleKey = ground.tale ?? tale;

    const threads = typeof body?.threads === "string" ? body.threads.slice(0, 2000) : undefined;
    /* THE LEDGER (V10) — the room hands the book's own memory back */
    const incomingLedger = parseLedger(body?.ledger);
    /* THE SPAN — the opening breath may be the ONE-PAGE THRESHOLD (the
       visitor reads while the loom keeps weaving), and the closing seal
       writes the classic pair; every continuation strides FOUR pages
       wide (the speed law: the same crossing pays its road cost once
       and lays twice the reading, so the reader rarely catches the
       loom up). */
    const spanRaw = Number(body?.span);
    const span = (phase === "open" || phase === "next") && Number.isFinite(spanRaw)
      ? Math.min(8, Math.max(phase === "open" ? 1 : 2, Math.round(spanRaw)))
      : phase === "next"
        ? 4
        : 2;
    const rewrites: string[] = Array.isArray(body?.rewrites)
      ? body.rewrites
          .filter((s: unknown): s is string => typeof s === "string")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(-6)
          .map((s: string) => s.slice(0, 500))
      : [];
    const recentPages = Array.isArray(body?.recentPages)
      ? body.recentPages.filter((s: unknown): s is string => typeof s === "string").slice(-2)
      : [];
    /* THE PAGES IN THE PLAN — the visitor may name the book's length
       themselves (20–300); when they do, that number is law */
    const askedPages =
      typeof body?.config?.pages === "number" ? Math.floor(body.config.pages) : 0;
    const plannedPages = askedPages >= 20 && askedPages <= 300 ? askedPages : 0;
    const revealFlavor = body?.reveal === true;
    /* the book's own keeping — when the visitor continues a volume from
       their cosmic library, its id and the pages woven so far ride along,
       so the library entry grows with the story instead of repeating */
    const bookId = typeof body?.bookId === "string" ? body.bookId : "";
    const bookPages = Array.isArray(body?.bookPages)
      ? (body.bookPages as unknown[]).slice(0, 400)
      : [];
    const bookMeta =
      body?.bookMeta && typeof body.bookMeta === "object"
        ? (body.bookMeta as Record<string, unknown>)
        : null;
    const bookConfig =
      body?.bookConfig && typeof body.bookConfig === "object"
        ? {
            age: typeof (body.bookConfig as Record<string, unknown>).age === "string"
              ? (body.bookConfig as Record<string, unknown>).age
              : age,
            tale: typeof (body.bookConfig as Record<string, unknown>).tale === "string"
              ? (body.bookConfig as Record<string, unknown>).tale
              : tale,
            volume: typeof (body.bookConfig as Record<string, unknown>).volume === "string"
              ? (body.bookConfig as Record<string, unknown>).volume
              : volume,
            level: typeof (body.bookConfig as Record<string, unknown>).level === "string"
              ? (body.bookConfig as Record<string, unknown>).level
              : level,
            topic: typeof (body.bookConfig as Record<string, unknown>).topic === "string"
              ? (body.bookConfig as Record<string, unknown>).topic
              : topic,
            ...(typeof (body.bookConfig as Record<string, unknown>).sketchVision ===
              "string" && (body.bookConfig as Record<string, unknown>).sketchVision
              ? {
                  sketchVision: (
                    body.bookConfig as Record<string, unknown>
                  ).sketchVision as string,
                }
              : carriedSketchVision
                ? { sketchVision: carriedSketchVision }
                : {}),
            ...(Array.isArray((body.bookConfig as Record<string, unknown>).sketchSubjects)
              ? {
                  sketchSubjects: (body.bookConfig as Record<string, unknown>)
                    .sketchSubjects as string[],
                }
              : carriedSketchSubjects.length
                ? { sketchSubjects: carriedSketchSubjects }
                : {}),
          }
        : {
            age,
            tale: taleKey,
            volume: volumeKey,
            level,
            topic,
            ...(carriedSketchVision ? { sketchVision: carriedSketchVision } : {}),
            ...(carriedSketchSubjects.length
              ? { sketchSubjects: carriedSketchSubjects }
              : {}),
          };
    const pageNumber =
      typeof body?.pageNumber === "number" && body.pageNumber > 0
        ? Math.floor(body.pageNumber)
        : phase === "open"
          ? 1
          : 3;
    const totalPages =
      typeof body?.totalPages === "number" ? Math.floor(body.totalPages) : 120;

    /* ======================= THE STUDIO'S OWN FIELDS ==================== */
    /* THE OPEN TUNNEL — no bible, no editorial report, no naming
       charter, no repair directives ride with any call any more: the
       only creative inputs are the visitor's own (config, topic,
       wishes, drawings, rewrites). Legacy fields in old payloads are
       simply ignored. */
    /* the carried art plan — plates painted so far ride home with it */
    const carriedArt =
      body?.art && typeof body.art === "object"
        ? (body.art as {
            style?: string;
            plates?: { page?: number; title?: string; url?: string }[];
          })
        : null;
    /* the art plan + the single plate to paint (plate phase) */
    const plateRequest =
      body?.plate && typeof body.plate === "object"
        ? (body.plate as Record<string, unknown>)
        : null;

    /* everything is free — the visitor is only named, so the volume
       can rest in their own cosmic library */
    const visitor = await resolveVisitor(req);

    /* THE STUDIO'S FLOOD-GATE — the extra rooms (architecture, press,
       mender, gallery) breathe gently: bounded per visitor per hour,
       so a script can never wear out the house. */
    if (STUDIO_PHASES.has(phase) && visitor.user.id) {
      const rl = rateLimit(`dreambook-studio:${visitor.user.id}`, {
        limit: 90,
        windowMs: 3_600_000,
      });
      if (!rl.ok) {
        return NextResponse.json(
          { error: "The studio's rooms rest a moment. Breathe, then return." },
          { status: 429 }
        );
      }
    }

    /* ==================== THE STUDIO'S OWN ROOMS ======================== */
    if (phase === "art" || phase === "plate" || phase === "seal") {
      return studioRoom({
        phase,
        body,
        visitor,
        languageName,
        age,
        tale: taleKey,
        volume: volumeKey,
        level,
        topic,
        wishes,
        vein,
        plannedPages,
        bookId,
        bookPages,
        bookMeta,
        bookConfig,
        threads,
        incomingLedger,
        carriedArt,
        plateRequest,
      });
    }

    const zai = await ZAI.create();

    /* THE DRAWN BOOK — when the visitor drew the book into existence,
       the vision sees the sketch once, at the very opening: its
       creatures, places, colors and mood are spoken into a law the
       whole volume must honor. The vision resting (or the sketch
       absent) falls back to the honest memory of what the hand used. */
    const sketchFallback = (() => {
      const parts: string[] = [];
      if (sketchMetaIn) {
        const stamps = Array.isArray(sketchMetaIn.stamps)
          ? (sketchMetaIn.stamps as unknown[]).filter(
              (s): s is string => typeof s === "string"
            ).slice(0, 10)
          : [];
        const colors = Array.isArray(sketchMetaIn.colors)
          ? (sketchMetaIn.colors as unknown[]).filter(
              (s): s is string => typeof s === "string"
            ).slice(0, 8)
          : [];
        const strokes =
          typeof sketchMetaIn.strokes === "number" ? sketchMetaIn.strokes : 0;
        if (strokes > 0) {
          parts.push(
            `a hand-drawn sketch of ${strokes} mark${strokes === 1 ? "" : "s"}`
          );
        }
        if (stamps.length) parts.push(`drawn elements: ${stamps.join(", ")}`);
        if (colors.length) parts.push(`its palette: ${colors.join(", ")}`);
      }
      return parts.length ? `The visitor's own drawing — ${parts.join("; ")}.` : "";
    })();
    let sketchVision = carriedSketchVision;
    let sketchSubjects = carriedSketchSubjects;
    if (phase === "open" && sketch) {
      const seen = await describeSketch(zai, sketch);
      if (seen) {
        sketchVision = seen.vision.trim().slice(0, 1200) || sketchFallback;
        if (seen.subjects.length) sketchSubjects = seen.subjects;
      } else {
        sketchVision = sketchFallback;
      }
    }

    /* THE REAL PAGES RIDE BACK — continuity by the book's own text:
       the pages woven so far are handed to the Mirror verbatim (the
       recent ones below), and its own thread and ledger carry the
       rest. No press report, no defect feed, no outline chapter law. */
    const pressPages = bookPages.filter(
      (p): p is PressPage =>
        Boolean(p) &&
        typeof p === "object" &&
        Array.isArray((p as Record<string, unknown>).paragraphs)
    );

    const askLoom = async (reminder: boolean, suffix = ""): Promise<string> => {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt(vein, specForAge(age).storyWordsPerPage) },
          {
            role: "user",
            content:
              buildUserPrompt({
                phase,
                age,
                tale: taleKey,
                volume: volumeKey,
                level,
                topic,
                seed,
                wishes,
                languageName,
                threads,
                recentPages,
                pageNumber,
                totalPages,
                rewrites,
                ground,
                ledger: incomingLedger,
                span,
                reveal: revealFlavor,
                plannedPages: phase === "open" && !ground.tiny ? plannedPages : undefined,
                vein,
                sketchVision: sketchVision || undefined,
                sketchSubjects: sketchSubjects.length ? sketchSubjects : undefined,
                sketchFresh: phase === "open" && !!sketch,
                storyWordsPerPage: specForAge(age).storyWordsPerPage,
              }) +
              suffix +
              (reminder
                ? "\n\nREMINDER: the loom could not read the last reply. Return ONLY the raw JSON object — no text, no markdown, nothing before or after it."
                : ""),
          },
        ],
        thinking: { type: "disabled" },
        /* the reply's page allowance is explicit now — a reply the sky
           cuts short arrives as a broken JSON and once cost a whole
           second crossing to mend; a generous ceiling keeps every
           reply whole */
        max_tokens: 8192,
        /* the opening asks for the widest creative divergence — the
           skeleton already forces the shape; the temperature frees the
           voice inside it. Continuations stay at the house default so
           the volume keeps its one voice. */
        ...(phase === "open" ? { temperature: 0.95 } : {}),
      });
      return completion.choices[0]?.message?.content ?? "";
    };

    /* the patient ask — one gentle retry on a transient breath of the
       road, never on a true refusal */
    const askLoomPatient = async (reminder: boolean, suffix = ""): Promise<string> => {
      try {
        return await askLoom(reminder, suffix);
      } catch (err) {
        if (!isTransientWeaveError(err)) throw err;
        await new Promise((r) => setTimeout(r, 1200));
        return askLoom(reminder, suffix);
      }
    };

    /* THE SECOND BRUSH — a sky that hangs must never hold the reader:
       if the first brush is still weaving after 45s, a second brush
       lifts from the same page; whichever canvas lands first is the
       book's (the slower one is let go gently). */
    const askWithHedge = (reminder: boolean, suffix = ""): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        let settled = false;
        const run = () =>
          askLoomPatient(reminder, suffix)
            .then((text) => {
              if (!settled) {
                settled = true;
                resolve(text);
              }
            })
            .catch((err) => {
              if (!settled) {
                settled = true;
                reject(err);
              }
            });
        run();
        setTimeout(() => {
          if (!settled) run();
        }, 45_000);
      });

    /* the loom always asks twice before it falls silent — one unreadable
       reply must never cost the visitor their book. No hand ever
       rewrites the Mirror's words between the sky and the page: what
       the channel returns is what the visitor receives. */
    const channelReply = askWithHedge;

    let raw = await channelReply(false);
    let parsed = extractJson(raw);
    let pages = parsed ? normalizePages(parsed.pages, pageNumber, span) : [];
    if (pages.length === 0) {
      raw = await channelReply(true);
      parsed = extractJson(raw);
      pages = parsed ? normalizePages(parsed.pages, pageNumber, span) : [];
    }
    if (pages.length === 0) {
      /* THE MENDING HAND — a reply the sky cut short is not silence:
         the balanced heart of the broken JSON is found, closed, and
         read — the whole pages it already wrote are kept */
      parsed = salvageJson(raw);
      pages = parsed ? normalizePages(parsed.pages, pageNumber, span) : [];
    }
    if (!parsed || pages.length === 0) {
      return NextResponse.json(
        { error: "The loom fell silent for a moment. Breathe, then weave again." },
        { status: 502 }
      );
    }

    /* THE LEDGER — the reply's own memory merged over the room's: a
       line that still holds is never dropped */
    const mergedLedger = mergeLedger(incomingLedger, parseLedger(parsed.ledger));

    /* THE HONEST SEAL — before the volume may end, the manuscript is
       measured in code against the plan it was born with: enough real
       words for the pages it claims, chapters for a long volume. These
       are TECHNICAL measures of the binding, never judgments of taste —
       nothing is rewritten here; a volume that falls short simply
       stays open (the reader may extend it). */
    const fullPages = expectsFullPages(age, volumeKey, taleKey);
    const qcPages: QcPage[] = [
      ...pressPages.map((p) => ({
        n: p.n,
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: p.paragraphs,
      })),
      ...pages.map((p) => ({
        n: p.n,
        ...(p.chapter ? { chapter: p.chapter } : {}),
        paragraphs: p.paragraphs,
      })),
    ];
    let qc: QcReport | null = null;
    if (phase === "close") {
      /* THE BOUND PLAN — the words the gate owes come from the bound-page
         plan the volume was born with (the visitor's number), never
         from the story-page count; the age picks the layout measure. */
      const keptBound =
        typeof bookMeta?.boundPages === "number" && bookMeta.boundPages >= 8
          ? Math.floor(bookMeta.boundPages)
          : 0;
      const plannedBound =
        keptBound ||
        (typeof bookMeta?.totalPages === "number" && bookMeta.totalPages >= 8
          ? Math.max(
              8,
              Math.round(
                (bookMeta.totalPages * specForAge(age).storyWordsPerPage) /
                  specForAge(age).wordsPerSheet
              )
            )
          : totalPages);
      qc = qcManuscript(qcPages, mergedLedger, {
        expectsFullPages: fullPages,
        plannedPages: plannedBound,
        age,
      });
    }

    const out: Record<string, unknown> = {
      pages,
      threads:
        typeof parsed.threads === "string" && parsed.threads.trim()
          ? parsed.threads.trim().slice(0, 2000)
          : threads ?? "",
      ...(mergedLedger ? { ledger: mergedLedger } : {}),
      /* THE HONEST SEAL — the book ends only when the technical measure
         allows it: a volume short of its own plan stays open, never
         wearing a false "The End" */
      ended: phase === "close" && !(qc && qc.blocking),
      /* GENERATION TRANSPARENCY — the stage says exactly where the
         book stands; the word COMPLETE is never spoken by the writer */
      stage: phase === "close" ? "draft-complete" : "drafting",
    };

    if (phase === "open") {
      out.title =
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 140)
          : "The Unnamed Book";
      out.subtitle =
        typeof parsed.subtitle === "string" ? parsed.subtitle.trim().slice(0, 200) : "";
      out.sigil =
        typeof parsed.sigil === "string" ? parsed.sigil.trim().slice(0, 160) : "";
      out.axiom =
        typeof parsed.axiom === "string" ? parsed.axiom.trim().slice(0, 280) : "";
      out.dedication =
        typeof parsed.dedication === "string" ? parsed.dedication.trim().slice(0, 400) : "";
      /* the loom may widen its plan, never thin it below the chosen
         shape's floor — a "classic tale" can never arrive as 8 pages,
         and a SHORT book can never arrive as a sprawling epic: the
         plan's band (min–max) is clamped hard on both sides.
         THE BOUND-PAGE LAW — the visitor's number is a BOUND-PAGE plan
         (physical sheets in the exported book): the word budget and
         the story-page target both derive from the ONE layout spec,
         so the woven volume and the bound volume can never disagree
         about what "120 pages" means. */
      const plan = BOOK_PLAN[volumeKey] ?? BOOK_PLAN.classic;
      const askedBound =
        plannedPages >= 20 && plannedPages <= 300 ? plannedPages : 0;
      const boundTarget = askedBound
        ? Math.min(300, Math.max(8, askedBound))
        : Math.min(plan.max, Math.max(plan.min, 96));
      const layout = planFromBoundPages(boundTarget, age);
      const wordsWoven = pages.reduce(
        (acc, p) =>
          acc +
          p.paragraphs.reduce(
            (a, para) => a + para.split(/\s+/).filter(Boolean).length,
            0
          ),
        0
      );
      out.boundPages = layout.boundPages;
      out.age = age;
      out.totalPages = clampTotal(layout.storyPageTarget);
      out.measurements = {
        targetPages: layout.boundPages,
        wordBudget: layout.wordBudget,
        wordsWoven,
        storyPages: out.totalPages,
        layoutEstimate: estimateBoundPages(wordsWoven, age),
        completionStatus: "generating",
      };
      /* THE SHELF OF KEPT VOLUMES — a fresh conjuring no longer erases
         the past: the previous living volume steps into the keeper's
         history (the kept shelf, twelve deep), and the new book takes
         its place as the living volume on the shelf. */
      await archiveLibraryKind(visitor.user.id, "dreambook", "dreambook_archive", 12);
      /* the drawn world's law rides home with the volume — the client
         keeps it in the config and speaks it on every page after */
      if (sketchVision) out.sketchVision = sketchVision;
      if (sketchSubjects.length) out.sketchSubjects = sketchSubjects;

      /* the whole living volume enters the library — pages, thread,
         config — so it can be brought back and continued any evening */
      const entryId = await saveLibrary(
        visitor.user.id,
        "dreambook",
        String(out.title),
        String(out.axiom || out.subtitle || "A volume woven in real time."),
        fitBookContent(
          {
            topic,
            seed,
            config: {
              age,
              tale: taleKey,
              volume: volumeKey,
              level,
              topic,
              ...(sketchVision ? { sketchVision } : {}),
              ...(sketchSubjects.length ? { sketchSubjects } : {}),
            },
            title: out.title,
            subtitle: out.subtitle,
            sigil: out.sigil,
            axiom: out.axiom,
            dedication: out.dedication,
            totalPages: out.totalPages,
            boundPages: out.boundPages,
            pages,
            threads: out.threads,
            ...(mergedLedger ? { ledger: mergedLedger } : {}),
            stage: "drafting",
            ended: false,
          },
          1_200_000
        ) as Record<string, unknown>,
        1_200_000
      );
      if (entryId) out.libraryId = entryId;
    }

    if (
      (phase === "extend" || (phase !== "open" && wishesLength(rewrites))) &&
      typeof parsed.totalPages === "number"
    ) {
      /* the loom may widen or narrow the book ONLY when a rewriting
         wish actually speaks of the book's length — a short book
         stretched by hand still stays a short book (capped at 72
         story pages), and a poem asked by name is never widened past
         its leaves (capped at 12). The story-page ceiling is generous
         (story pages serve the bound-page plan, never equal it). */
      out.totalPages = clampTotal(
        Math.min(
          volumeKey === "tiny" ? 12 : volumeKey === "short" ? 72 : 720,
          parsed.totalPages
        )
      );
      /* the widening re-speaks the bound-page law from the kept plan */
      const keptBound =
        typeof bookMeta?.boundPages === "number" && bookMeta.boundPages >= 8
          ? Math.floor(bookMeta.boundPages)
          : 0;
      if (keptBound) {
        out.boundPages = keptBound;
        const spec = specForAge(age);
        out.measurements = {
          ...(out.measurements as Record<string, unknown> | undefined),
          targetPages: keptBound,
          wordBudget: Math.round(keptBound * spec.wordsPerSheet),
          storyPages: out.totalPages,
        };
      }
    }

    if (phase !== "open" && bookId) {
      await updateLibrary(
        visitor.user.id,
        bookId,
        String(bookMeta?.title ?? "A Dream Book"),
        String(bookMeta?.axiom || bookMeta?.subtitle || "A volume woven in real time."),
        fitBookContent(
          {
            ...(bookMeta ?? {}),
            config: bookConfig,
            totalPages:
              typeof out.totalPages === "number"
                ? out.totalPages
                : typeof bookMeta?.totalPages === "number"
                  ? bookMeta.totalPages
                  : undefined,
            pages: [...bookPages, ...pages],
            threads: out.threads,
            ...(carriedArt ? { art: carriedArt } : {}),
            stage: out.stage,
            ended: phase === "close" ? true : Boolean(bookMeta?.ended),
          },
          1_200_000
        ) as Record<string, unknown>,
        1_200_000
      );
    }

    /* THE TRUTHFUL MEASUREMENTS — every response carries the five
       numbers the directive demands, each measured, never equated:
       targetPages (the bound-page plan), wordsWoven (validated
       manuscript content), storyPages (the loom's own leaves),
       layoutEstimate (sheets the press would bind from these words —
       the press's verified count always outranks it), and the honest
       completionStatus. Progress can never again masquerade as
       completion: only the gate's pass turns this word COMPLETE. */
    {
      const allPages = [...pressPages, ...pages];
      const wordsWoven = allPages.reduce(
        (acc, p) =>
          acc +
          p.paragraphs.reduce(
            (a, para) => a + para.split(/\s+/).filter(Boolean).length,
            0
          ),
        0
      );
      const keptBound =
        typeof out.boundPages === "number"
          ? out.boundPages
          : typeof bookMeta?.boundPages === "number" &&
              bookMeta.boundPages >= 8
            ? Math.floor(bookMeta.boundPages)
            : 0;
      if (keptBound) {
        const existing =
          (out.measurements as Record<string, unknown> | undefined) ?? {};
        out.measurements = {
          ...existing,
          targetPages: keptBound,
          wordBudget: Math.round(keptBound * specForAge(age).wordsPerSheet),
          wordsWoven,
          storyPages:
            typeof out.totalPages === "number"
              ? out.totalPages
              : allPages.length,
          layoutEstimate: estimateBoundPages(wordsWoven, age),
          completionStatus:
            phase === "close" && !(qc && qc.blocking)
              ? "complete"
              : "generating",
        };
      }
    }

    return withAnonCookie(NextResponse.json(out), visitor);
  } catch (err) {
    console.error("[dream-book] failed:", err);
    return NextResponse.json(
      { error: "The loom fell silent for a moment. Breathe, then weave again." },
      { status: 500 }
    );
  }
}

/* ================================================================== */
/*  THE STUDIO'S OWN ROOMS — the honest gate, the art plan, one plate.  */
/*  Each room is its own call to the sky; the writing has ONE author.   */
/* ================================================================== */

interface StudioCtx {
  phase: WeavePhase;
  body: Record<string, unknown> | null;
  visitor: Awaited<ReturnType<typeof resolveVisitor>>;
  languageName: string;
  age: string;
  tale: string;
  volume: string;
  level: string;
  topic: string;
  wishes: string;
  vein?: string;
  plannedPages: number;
  bookId: string;
  bookPages: unknown[];
  bookMeta: Record<string, unknown> | null;
  bookConfig: Record<string, unknown>;
  threads?: string;
  incomingLedger: BookLedger | null;
  carriedArt: { style?: string; plates?: { page?: number; title?: string; url?: string }[] } | null;
  plateRequest: Record<string, unknown> | null;
}

type ZaiClient = Awaited<ReturnType<typeof ZAI.create>>;

async function askStudio(
  zai: ZaiClient,
  system: string,
  user: string,
  temperature?: number
): Promise<string> {
  const run = () =>
    zai.chat.completions
      .create({
        messages: [
          { role: "assistant", content: system },
          { role: "user", content: user },
        ],
        thinking: { type: "disabled" },
        max_tokens: 8192,
        ...(temperature ? { temperature } : {}),
      })
      .then((c) => c.choices[0]?.message?.content ?? "");
  try {
    return await run();
  } catch (err) {
    if (!isTransientWeaveError(err)) throw err;
    await new Promise((r) => setTimeout(r, 1200));
    return run();
  }
}

function asPressPages(raw: unknown[]): PressPage[] {
  return raw.filter(
    (p): p is PressPage =>
      Boolean(p) &&
      typeof p === "object" &&
      Array.isArray((p as Record<string, unknown>).paragraphs)
  );
}

/** The manuscript as the editor reads it: full text when it fits, a
    faithful page-by-page digest when the book grew past the sky. */
function manuscriptForPress(pages: PressPage[], cap = 120_000): string {
  const full = pages
    .map((p) => `— page ${p.n}${p.chapter ? ` — ${p.chapter}` : ""}:\n${p.paragraphs.join("\n")}`)
    .join("\n\n");
  if (full.length <= cap) return full;
  const digest = pages
    .map((p) => {
      const first = (p.paragraphs[0] ?? "").replace(/\s+/g, " ").slice(0, 260);
      const last =
        p.paragraphs.length > 1
          ? (p.paragraphs[p.paragraphs.length - 1] ?? "").replace(/\s+/g, " ").slice(0, 180)
          : "";
      return `— page ${p.n}${p.chapter ? ` (${p.chapter})` : ""}: ${first}${last ? ` … ${last}` : ""}`;
    })
    .join("\n");
  return digest.length <= cap
    ? digest
    : `${digest.slice(0, cap)}\n… (the digest continues; the press report above already covers every page)`;
}

/** The digest the illustration director reads — one breath per page. */
function digestForArt(pages: PressPage[], cap = 60_000): string {
  const lines = pages.map((p) => {
    const first = (p.paragraphs[0] ?? "").replace(/\s+/g, " ").slice(0, 220);
    return `p${p.n}${p.chapter ? ` (${p.chapter})` : ""}: ${first}`;
  });
  const out = lines.join("\n");
  return out.length <= cap ? out : out.slice(0, cap);
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
const WORD_NUM_RE =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\b/i;
const DIGIT_NUM_RE = /\b\d{1,3}\b/;
const ROMAN_NUM_RE = /\b(X{0,2}(?:IX|IV|V?I{0,3}))\b/;

function toRoman(n: number): string {
  const table: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rest = n;
  for (const [v, s] of table) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
}

/** Rewrite a chapter line's number to the canonical one — digits,
    English words, or roman numerals; a line we cannot parse is left
    untouched (the press never pretends to have fixed what it cannot
    prove). */
function replaceChapterNumber(line: string, want: number): string | null {
  if (DIGIT_NUM_RE.test(line)) return line.replace(DIGIT_NUM_RE, String(want));
  if (WORD_NUM_RE.test(line)) {
    const word = NUMBER_WORDS[want] ?? String(want);
    return line.replace(WORD_NUM_RE, word);
  }
  const roman = line.match(ROMAN_NUM_RE);
  if (roman && roman[1]) {
    return line.replace(ROMAN_NUM_RE, want <= 20 ? toRoman(want) : String(want));
  }
  return null;
}

async function studioRoom(ctx: StudioCtx): Promise<NextResponse> {
  const {
    phase,
    visitor,
    languageName,
    age,
    tale,
    volume,
    level,
    topic,
    wishes,
    vein,
    plannedPages,
    bookId,
    bookMeta,
    bookConfig,
    threads,
    incomingLedger,
    carriedArt,
    plateRequest,
  } = ctx;
  const persist = async (
    stage: string,
    extra: Record<string, unknown>
  ): Promise<void> => {
    if (!bookId) return;
    await updateLibrary(
      visitor.user.id,
      bookId,
      String(bookMeta?.title ?? "A Dream Book"),
      String(bookMeta?.axiom || bookMeta?.subtitle || "A volume woven in real time."),
      fitBookContent(
        {
          ...(bookMeta ?? {}),
          config: bookConfig,
          pages: ctx.bookPages,
          ...(threads ? { threads } : {}),
          stage,
          ...extra,
        },
        1_200_000
      ) as Record<string, unknown>,
      1_200_000
    );
  };

  try {
    /* --------------- THE HONEST GATE (technical only) ------------ */
    /* The seal room below is the ONLY gate left, and it measures the
       binding in code: chapter seams, clean characters, the honest
       word measure. No editor, no verdict, no rewriting. */

    /* ------------------- THE ILLUSTRATION PLAN ------------------- */
    if (phase === "art") {
      const pages = asPressPages(ctx.bookPages);
      if (pages.length < 4) {
        return withAnonCookie(
          NextResponse.json({ error: "The gallery needs a manuscript first." }, { status: 400 }),
          visitor
        );
      }
      const plateCount =
        pages.length >= 60 ? 6 : pages.length >= 24 ? 4 : pages.length >= 10 ? 3 : 2;
      /* THE CAST — read from the Mirror's own ledger (the book's own
         memory of its characters); no bible exists any more */
      const castBlock = incomingLedger?.characters?.length
        ? `THE CAST (the book's own memory of its figures): ${incomingLedger.characters.join(" · ")}`
        : "";
      const zai = await ZAI.create();
      const raw = await askStudio(
        zai,
        DIRECTOR_SYSTEM,
        buildArtPlanPrompt({
          title: String(bookMeta?.title ?? "A Dream Book"),
          digest: digestForArt(pages),
          castBlock,
          plateCount,
          ageLine: AGE_PLAN[age] ?? AGE_PLAN.timeless,
          taleLine: TALE_HINTS[tale] ?? TALE_HINTS.wonder,
          languageName,
          drawnElements: studioDrawnElements(bookConfig),
        })
      );
      const parsed = extractJson(raw) ?? salvageJson(raw);
      const maxPage = pages.length;
      const style =
        typeof parsed?.style === "string" && parsed.style.trim()
          ? parsed.style.trim().slice(0, 300)
          : "a rich, luminous storybook painting";
      const plates = (Array.isArray(parsed?.plates) ? parsed.plates : [])
        .map((p: unknown) => {
          if (!p || typeof p !== "object") return null;
          const pp = p as Record<string, unknown>;
          const page = typeof pp.page === "number" ? Math.round(pp.page) : 0;
          const scene = typeof pp.scene === "string" ? pp.scene.trim() : "";
          if (!page || page < 1 || page > maxPage || !scene) return null;
          return {
            page,
            ...(typeof pp.title === "string" ? { title: pp.title.slice(0, 120) } : {}),
            scene: scene.slice(0, 500),
            ...(Array.isArray(pp.characters)
              ? {
                  characters: (pp.characters as unknown[])
                    .filter((s): s is string => typeof s === "string")
                    .slice(0, 6),
                }
              : {}),
            ...(typeof pp.setting === "string" ? { setting: pp.setting.slice(0, 240) } : {}),
            ...(typeof pp.mood === "string" ? { mood: pp.mood.slice(0, 200) } : {}),
            ...(typeof pp.composition === "string" ? { composition: pp.composition.slice(0, 240) } : {}),
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .slice(0, plateCount);
      if (plates.length === 0) {
        return withAnonCookie(
          NextResponse.json(
            { error: "The director fell silent for a moment. Breathe, then plan again." },
            { status: 502 }
          ),
          visitor
        );
      }
      await persist("plates", { artPlan: { style, plates } });
      return withAnonCookie(
        NextResponse.json({
          artPlan: { style, plates },
          stage: "plates",
        }),
        visitor
      );
    }

    /* -------------------- ONE PLATE, PAINTED --------------------- */
    if (phase === "plate") {
      if (!plateRequest || typeof plateRequest !== "object") {
        return withAnonCookie(
          NextResponse.json({ error: "No plate was named." }, { status: 400 }),
          visitor
        );
      }
      const plate = plateRequest as {
        page?: number;
        title?: string;
        scene?: string;
        characters?: unknown;
        setting?: string;
        mood?: string;
        composition?: string;
      };
      if (!plate.scene || typeof plate.scene !== "string") {
        return withAnonCookie(
          NextResponse.json({ error: "No plate was named." }, { status: 400 }),
          visitor
        );
      }
      const style =
        (typeof plateRequest.style === "string" && plateRequest.style.trim()) ||
        carriedArt?.style ||
        "a rich, luminous storybook painting";
      const presentNames = Array.isArray(plate.characters)
        ? (plate.characters as unknown[])
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.toLowerCase())
        : [];
      const visualLines = (incomingLedger?.characters ?? [])
        .map((line) => line.trim())
        .filter(
          (line) =>
            presentNames.length === 0 ||
            presentNames.some((n) => {
              const name = line.split(/[—\-–]/)[0].trim().toLowerCase();
              return name && (name.includes(n) || n.includes(name));
            })
        );
      const prompt = buildPlatePrompt({
        style,
        plate: plate as never,
        visualLines,
        title: String(bookMeta?.title ?? "A Dream Book"),
      });
      const img = await generateImage(prompt, { size: "1792x1024" });
      if (!img) {
        return withAnonCookie(
          NextResponse.json(
            { error: "The plate's sky was empty for a moment. Breathe, then paint again.", code: "engine" },
            { status: 502 }
          ),
          visitor
        );
      }
      const art = {
        style,
        plates: [
          ...(carriedArt?.plates ?? []),
          {
            ...(typeof plate.page === "number" ? { page: plate.page } : {}),
            ...(typeof plate.title === "string" ? { title: plate.title.slice(0, 120) } : {}),
            url: img.url,
          },
        ],
      };
      await persist("plates", { art });
      return withAnonCookie(
        NextResponse.json({
          plateUrl: img.url,
          plate: { page: plate.page, title: plate.title },
          art,
          engine: img.engine,
          stage: "plates",
        }),
        visitor
      );
    }

    /* ------------------- THE ACCEPTANCE GATE --------------------- */
    if (phase === "seal") {
      const pages = asPressPages(ctx.bookPages);
      if (pages.length < 4) {
        return withAnonCookie(
          NextResponse.json({ error: "The gate needs a manuscript first." }, { status: 400 }),
          visitor
        );
      }
      const gate = gateCheck({
        pages,
        /* THE BOUND PLAN — the gate measures words against the bound-page
           plan the volume was born with, measured by the ONE layout
           spec for this age — never against the story-page count */
        plannedPages:
          typeof bookMeta?.boundPages === "number" && bookMeta.boundPages >= 8
            ? Math.floor(bookMeta.boundPages)
            : typeof bookMeta?.totalPages === "number" &&
                bookMeta.totalPages >= 8
              ? Math.max(
                  8,
                  Math.round(
                    (bookMeta.totalPages * specForAge(age).storyWordsPerPage) /
                      specForAge(age).wordsPerSheet
                  )
                )
              : plannedPages,
        fullPages: expectsFullPages(age, volume, tale),
        age,
      });
      const stage = gate.pass ? "publication-ready" : "draft-complete";
      await persist(stage, {
        pages,
        gate,
        ended: true,
      });
      return withAnonCookie(
        NextResponse.json({
          gate,
          stage,
          verdict: gate.pass ? "publication-ready" : "draft-complete",
        }),
        visitor
      );
    }

    return withAnonCookie(
      NextResponse.json({ error: "Unknown studio room." }, { status: 400 }),
      visitor
    );
  } catch (err) {
    console.error(`[dream-book] studio ${phase} failed:`, err);
    return NextResponse.json(
      { error: "The studio's room fell silent for a moment. Breathe, then return." },
      { status: 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
