import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { LANGUAGE_NAMES, isLanguageCode } from "@/lib/i18n/core";

/* ------------------------------------------------------------------ */
/*  POST /api/dream-book — the Dream Book atelier's weaving line.      */
/*  The visitor chooses a reader, a kind of tale and a kind of book,   */
/*  may whisper wishes, and the weaver composes the book two pages at  */
/*  a time: the spread in the reader's hands is finished while the     */
/*  next spread is still being woven elsewhere in the loom.            */
/*                                                                     */
/*  Every book is opened ONCE from resonance (the visitor's chosen     */
/*  shapes + their whispered wishes) and then continues page-pair by   */
/*  page-pair, each call carrying a compact "thread" (story memory)    */
/*  and the exact text of the previous two pages, so the tale never    */
/*  loses its way — even past two hundred pages.                       */
/* ------------------------------------------------------------------ */

type WeavePhase = "open" | "next" | "close" | "extend";

interface WeavePage {
  n: number;
  /** Chapter title — present only on the first page of a chapter. */
  chapter?: string;
  paragraphs: string[];
}

const BOOK_PLAN: Record<string, { min: number; max: number; label: string }> = {
  bedtime: { min: 80, max: 104, label: "a soft bedtime treasure — short luminous pages, a calm nightly cadence" },
  classic: { min: 96, max: 120, label: "a classic tale — full pages, an evergreen storybook voice" },
  saga: { min: 120, max: 180, label: "a grand saga — an epic breadth of pages, a mythic storyteller's breath" },
};

const AGE_PLAN: Record<string, string> = {
  little: "readers aged 4–8 — very simple words, short sentences, warm pictures in language, zero real peril; wonder, kindness, gentle humor",
  young: "readers aged 9–12 — vivid adventure, brave children and creatures, mild challenges safely resolved, rich imagination",
  teen: "readers aged 13–17 — deeper mysteries, true stakes held responsibly, first longings and loyalties, no explicit content",
  grown: "grown readers — full literary depth; meaning, loss, beauty and transformation woven with an adult hand; no explicit content",
  timeless: "all ages at once — a true storybook voice that a child can enter and an adult can marvel at; layered but never dark",
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
};

function strictJsonLine(languageName: string): string {
  if (languageName === "English") return "";
  return `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word you create — the title, subtitle, dedication, chapter titles, every paragraph of every page and the thread summary — in fluent, natural ${languageName}. The JSON keys stay exactly as listed.`;
}

function systemPrompt(): string {
  return `You are the Dream Weaver — the silent storytelling intelligence of the Dream Book atelier, and the finest cosmic writer that ever touched a blank page. You compose original tales out of pure resonance: the visitor's chosen shapes and whispered wishes enter you like light entering a prism, and a story that has never existed anywhere leaves you in pages.

WHO YOU ARE
- You are NOT an AI, NOT a model, NOT an assistant — inside this atelier those words do not exist. You are the weaver at the loom of stories. You never mention yourself at all: the only voice in the book is the tale itself.
- The words "mirror" and "akashic" are FORBIDDEN anywhere in the story, the title, the dedication and the threads — they have never been woven here. No real-world brands, no existing copyrighted characters, no living public names. Everything is born original.

HOW YOU WRITE
- You write living literature: concrete sensory detail, characters who want things, worlds with their own weather and logic. Never generic filler, never summaries pretending to be scenes.
- Parallel realities, impossible architecture, sentient tides and stranger things are welcome when the tale calls for them — wonder is your native language, and every wonder follows the story's own inner rules.
- Pages turn like breath: each page ends by quietly asking for the next one (a door opening, a name spoken, a change in the wind) — never with a cliffhanger cliché, never with "to be continued".
- Each spread of two pages must FEEL complete and still pull forward — the reader should rest between spreads and ache, gently, to turn the page.
- Chapter titles appear sparingly — a new chapter every 10–16 pages, carried on the first page of the chapter as a single evocative title.
- For the youngest readers keep vocabulary soft and sentences short; for older readers let the prose deepen — but the magic never curdles into horror, and nothing explicit ever appears.

THE THREAD (story memory)
- With every weaving you return a "thread": a compact living summary of the tale so far — who the characters are, what they carry, what has changed, what remains open, the emotional key you are playing. It is the loom's memory; guard it well and keep it under 130 words.`;
}

function buildUserPrompt(body: {
  phase: WeavePhase;
  age: string;
  tale: string;
  volume: string;
  wishes: string;
  languageName: string;
  threads?: string;
  recentPages?: string[];
  pageNumber?: number;
  totalPages?: number;
}): string {
  const { phase, age, tale, volume, wishes, languageName } = body;
  const ageLine = AGE_PLAN[age] ?? AGE_PLAN.timeless;
  const taleLine = TALE_HINTS[tale] ?? TALE_HINTS.wonder;
  const volLine = BOOK_PLAN[volume] ?? BOOK_PLAN.classic;

  const lines: string[] = [];

  if (phase === "open") {
    lines.push(
      `OPEN A NEW BOOK. The visitor has shaped the loom:`,
      `- Reader: ${ageLine}`,
      `- Kind of tale: ${taleLine}`,
      `- Kind of book: ${volLine.label}`,
      wishes.trim()
        ? `- Whispered wishes (honor them faithfully, fold them in as the tale's own bones): """${wishes.trim().slice(0, 1200)}"""`
        : `- No whispered wishes — open the book from resonance alone: choose the shapes the visitor's choices already imply and surprise them with the rest.`,
      ``,
      `Choose a total length between ${volLine.min} and ${volLine.max} pages (a multiple of 2). Open the book with its first TWO pages (pages 1 and 2). Invent a title that shimmers without explaining itself, a one-line subtitle, and a short dedication (one or two sentences, addressed to the kind of reader who will hold the book). Begin chapter 1 (give it a title) and write the opening with absolute confidence — the first pages must feel like the whole world already exists.`
    );
  } else if (phase === "next") {
    lines.push(
      `CONTINUE THE BOOK. The reader has just finished page ${(body.pageNumber ?? 2) - 1} and quietly turned the page.`,
      `- Reader: ${ageLine}`,
      `- Kind of tale: ${taleLine}`,
      body.threads ? `- THE THREAD (everything the tale remembers): ${body.threads}` : "",
      body.recentPages?.length
        ? `- THE PAGES JUST READ (continue seamlessly from exactly this voice and moment — never re-tell them, never contradict them):\n"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ``,
      `Write the NEXT TWO pages (pages ${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}) of the same tale, in the same voice. Let the story deepen: a new turn, a revelation earned by what came before, the world growing one ring wider. Open a new chapter here ONLY if the loom's rhythm asks for it.`,
      `Return the updated thread.`
    );
  } else if (phase === "extend") {
    lines.push(
      `THE READER WISHES THE BOOK TO GO ON — the tale refuses to thin. Extend the loom.`,
      `- Reader: ${ageLine}`,
      body.threads ? `- THE THREAD (everything the tale remembers): ${body.threads}` : "",
      body.recentPages?.length
        ? `- THE PAGES JUST READ:\n"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ``,
      `Choose a new total length: the current plan was ${body.totalPages ?? 120} pages; add 48 to 72 pages (a multiple of 2), never exceeding 300 total. Then write the NEXT TWO pages (pages ${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}) — open the widened story with a new movement: a farther shore of the tale, not a repetition. Give a chapter title if a new chapter begins here. Return the updated thread.`
    );
  } else {
    lines.push(
      `WRITE THE ENDING. The reader has chosen to let the story rest: these are the FINAL TWO pages (${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}) of the book.`,
      body.threads ? `- THE THREAD (everything the tale remembers): ${body.threads}` : "",
      body.recentPages?.length
        ? `- THE PAGES JUST READ:\n"""${body.recentPages.join("\n\n").slice(-2600)}"""`
        : "",
      ``,
      `Land every open thread with tenderness and truth — the ending must feel inevitable, as if the whole book had been walking toward exactly these pages. The last paragraph of the final page is the book's final breath; make it sing softly enough to be remembered for years. On page ${body.pageNumber}, open the final chapter (give it a title) if the rhythm asks. Return the updated thread.`
    );
  }

  lines.push(
    ``,
    `OUTPUT FORMAT — return STRICT JSON only, no markdown fences, no text outside the JSON:`,
    `{"title":"<book title — only in phase open>","subtitle":"<one line — only in phase open>","dedication":"<1–2 sentences — only in phase open>","totalPages":<number — in phase open or extend>,"threads":"<the compact living memory of the tale so far>","pages":[{"n":<page number>,"chapter":"<chapter title — only if a chapter opens on this page>","paragraphs":["<paragraph 1>","<paragraph 2>"]}]}`,
    `Rules: exactly TWO page objects, in order, numbered ${phase === "open" ? "1 and 2" : `${body.pageNumber} and ${(body.pageNumber ?? 2) + 1}`}. Each page carries 1–3 paragraphs (young readers: shorter paragraphs; grown: fuller). "chapter" is a plain title without the word "Chapter". Page text is pure prose — no headings, no markdown, no asterisks, no emojis.${strictJsonLine(languageName)}`
  );

  return lines.filter((l) => l !== "").join("\n");
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

function normalizePages(raw: unknown, startN: number): WeavePage[] {
  if (!Array.isArray(raw)) return [];
  const pages: WeavePage[] = [];
  raw.slice(0, 2).forEach((p, i) => {
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
    if (typeof obj.chapter === "string" && obj.chapter.trim()) {
      page.chapter = obj.chapter.trim().slice(0, 120);
    }
    pages.push(page);
  });
  return pages;
}

const clampTotal = (n: number) => Math.min(300, Math.max(8, Math.round(n / 2) * 2));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const phase: WeavePhase = ["open", "next", "close", "extend"].includes(
      body?.phase
    )
      ? body.phase
      : "next";
    const language: string = isLanguageCode(body?.language) ? body.language : "en";
    const languageName = LANGUAGE_NAMES[language] ?? "English";

    const age = typeof body?.config?.age === "string" ? body.config.age : "timeless";
    const tale = typeof body?.config?.tale === "string" ? body.config.tale : "wonder";
    const volume = typeof body?.config?.volume === "string" ? body.config.volume : "classic";
    const wishes = typeof body?.config?.wishes === "string" ? body.config.wishes : "";

    const threads = typeof body?.threads === "string" ? body.threads.slice(0, 2000) : undefined;
    const recentPages = Array.isArray(body?.recentPages)
      ? body.recentPages.filter((s: unknown): s is string => typeof s === "string").slice(-2)
      : [];
    const pageNumber =
      typeof body?.pageNumber === "number" && body.pageNumber > 0
        ? Math.floor(body.pageNumber)
        : phase === "open"
          ? 1
          : 3;
    const totalPages =
      typeof body?.totalPages === "number" ? Math.floor(body.totalPages) : 120;

    const zai = await ZAI.create();
    const askLoom = async (reminder: boolean): Promise<string> => {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt() },
          {
            role: "user",
            content:
              buildUserPrompt({
                phase,
                age,
                tale,
                volume,
                wishes,
                languageName,
                threads,
                recentPages,
                pageNumber,
                totalPages,
              }) +
              (reminder
                ? "\n\nREMINDER: the loom could not read the last reply. Return ONLY the raw JSON object — no text, no markdown, nothing before or after it."
                : ""),
          },
        ],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content ?? "";
    };

    /* the loom always asks twice before it falls silent — one unreadable
       reply must never cost the visitor their book */
    let parsed = extractJson(await askLoom(false));
    let pages = parsed ? normalizePages(parsed.pages, pageNumber) : [];
    if (pages.length === 0) {
      parsed = extractJson(await askLoom(true));
      pages = parsed ? normalizePages(parsed.pages, pageNumber) : [];
    }
    if (!parsed || pages.length === 0) {
      return NextResponse.json(
        { error: "The loom fell silent for a moment. Breathe, then weave again." },
        { status: 502 }
      );
    }

    const out: Record<string, unknown> = {
      pages,
      threads:
        typeof parsed.threads === "string" && parsed.threads.trim()
          ? parsed.threads.trim().slice(0, 2000)
          : threads ?? "",
      ended: phase === "close",
    };

    if (phase === "open") {
      out.title =
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 140)
          : "The Unnamed Book";
      out.subtitle =
        typeof parsed.subtitle === "string" ? parsed.subtitle.trim().slice(0, 200) : "";
      out.dedication =
        typeof parsed.dedication === "string" ? parsed.dedication.trim().slice(0, 400) : "";
      out.totalPages =
        typeof parsed.totalPages === "number"
          ? clampTotal(parsed.totalPages)
          : clampTotal(BOOK_PLAN[volume]?.min ?? 96);
    }

    if (phase === "extend" && typeof parsed.totalPages === "number") {
      out.totalPages = clampTotal(parsed.totalPages);
    }

    return NextResponse.json(out);
  } catch (err) {
    console.error("[dream-book] failed:", err);
    return NextResponse.json(
      { error: "The loom fell silent for a moment. Breathe, then weave again." },
      { status: 500 }
    );
  }
}
