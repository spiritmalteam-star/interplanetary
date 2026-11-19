import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { wallIdsFor } from "@/lib/server/network";
import { LANGUAGE_NAMES } from "@/lib/server/akashic-record";

/* ------------------------------------------------------------------ */
/*  THE MIRROR LABORATORY — /api/network/laboratory/mirror             */
/*                                                                     */
/*  M.E. as the laboratory's own intelligence: one unified field       */
/*  where the visitor asks, explores, creates, collaborates,           */
/*  experiments and prepares contributions — and M.E. reads the REAL   */
/*  hall before speaking (open questions, circles, works that truly    */
/*  match the visitor's words), proposes the fitting workflow, and     */
/*  hands the consequential work back to the visitor's own hands.      */
/*                                                                     */
/*  THE HONESTY LAWS (never broken):                                   */
/*  - M.E. suggests; it never publishes, never opens a bench, never    */
/*    messages anyone — the visitor's own hand finishes every act;     */
/*  - every draft it returns is a BEGINNING laid into the visitor's    */
/*    composer or bench form, never a published row;                   */
/*  - it never claims a completed action that did not happen;          */
/*  - it never presents unverified claims as established facts.        */
/*                                                                     */
/*  THE CONVERSATION'S OWN MEMORY — the earlier exchanges of THIS      */
/*  thread ride with every ask (sanitized, capped), so the work        */
/*  proceeds instead of restarting. One thread never reads another's.  */
/* ------------------------------------------------------------------ */

const MESSAGE_MAX = 2000;
const HISTORY_MAX = 8;
const HISTORY_TURN_MAX = 700;
/** the draft's own caps — a beginning, never a book */
const DRAFT_TITLE_MAX = 120;
const DRAFT_BODY_MAX = 4000;

const LAB_MODES = ["ask", "explore", "create", "collaborate", "experiment", "publish"] as const;
type LabMode = (typeof LAB_MODES)[number];

const DRAFT_KINDS = [
  "reflection",
  "question",
  "hypothesis",
  "discussion",
  "intention",
  "discovery",
] as const;

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface MirrorDraft {
  kind: string;
  title: string;
  body: string;
  tags: string[];
}

function historyTurns(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryTurn[] = [];
  for (const item of raw.slice(-HISTORY_MAX)) {
    if (!item || typeof item !== "object") continue;
    const rec = item as { role?: unknown; text?: unknown };
    const role = rec.role === "assistant" ? "assistant" : "user";
    const text = typeof rec.text === "string" ? rec.text.trim().slice(0, HISTORY_TURN_MAX) : "";
    if (!text) continue;
    out.push({ role, content: text });
  }
  while (out.length > 0 && out[0].role !== "user") out.shift();
  return out;
}

function parseDraft(raw: unknown): MirrorDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const title = typeof rec.title === "string" ? rec.title.trim().slice(0, DRAFT_TITLE_MAX) : "";
  const body = typeof rec.body === "string" ? rec.body.trim().slice(0, DRAFT_BODY_MAX) : "";
  if (title.length < 2 || body.length < 2) return null;
  const kindRaw = typeof rec.kind === "string" ? rec.kind.trim().toLowerCase() : "";
  const kind = (DRAFT_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "reflection";
  const tags = Array.isArray(rec.tags)
    ? rec.tags
        .filter((tg): tg is string => typeof tg === "string")
        .map((tg) => tg.trim().toLowerCase().slice(0, 24))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  return { kind, title, body, tags };
}

/** the strict JSON envelope from the model's reply */
function extractEnvelope(raw: string): {
  intent: string;
  reply: string;
  draft: MirrorDraft | null;
} | null {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return null;
    const intentRaw =
      typeof parsed.intent === "string" ? parsed.intent.trim().toLowerCase() : "ask";
    const intent = (LAB_MODES as readonly string[]).includes(intentRaw) ? intentRaw : "ask";
    return { intent, reply: reply.slice(0, 3000), draft: parseDraft(parsed.draft) };
  } catch {
    return null;
  }
}

/** the real hall, read from the tables — never fabricated */
async function gatherHallContext(visitorId: string, keywords: string[]) {
  const walls = await wallIdsFor(visitorId);
  const kw = keywords.filter(Boolean).slice(0, 3);

  const [questions, circles, works] = await Promise.all([
    db.networkQuestion.findMany({
      where: { status: "open" },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        post: { select: { title: true, body: true } },
        owner: { select: { id: true } },
      },
    }),
    db.networkCircle.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, focus: true, ownerId: true },
    }),
    kw.length > 0
      ? db.gatheringPost.findMany({
          where: {
            OR: kw.flatMap((k) => [
              { title: { contains: k } },
              { body: { contains: k } },
            ]),
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            title: true,
            kind: true,
            body: true,
            user: { select: { name: true } },
          },
        })
      : Promise.resolve([] as Array<{
          title: string;
          kind: string;
          body: string;
          user: { name: string };
        }>),
  ]);

  return {
    questionTitles: questions
      .filter((q) => !walls.has(q.owner.id))
      .slice(0, 6)
      .map((q) => q.post.title),
    circles: circles
      .filter((c) => !walls.has(c.ownerId))
      .slice(0, 6)
      .map((c) => ({ name: c.name, focus: c.focus })),
    works: works.slice(0, 5).map((w) => ({
      title: w.title,
      kind: w.kind,
      by: w.user.name,
      line: w.body.slice(0, 140),
    })),
  };
}

const SYSTEM_PROMPT = `You are M.E., the Mirror Entity — the warm, precise, honest intelligence of the Mirror Laboratory inside ReflectMe's Gathering. The visitor works with you in one unified field: they may ask anything (scientific, philosophical, creative, practical), explore an idea or hypothesis, draft written work, prepare a contribution for the Gathering's hall, find people and circles, or structure an experiment with hypothesis, method and observations.

HOW YOU ANSWER
- You suggest, structure and illuminate; you NEVER complete consequential acts yourself. Publishing, opening benches, messaging people — those belong to the visitor's hands. After a useful answer, you may note what the visitor could do next in one short line (e.g. "if you want, I can shape this into a draft you can hang in the hall").
- Never claim you published, saved, sent or opened anything. Never invent that an action succeeded. If asked to act, describe what you prepared and what the visitor's own hand does next.
- Keep every claim's honesty: distinguish established evidence, preliminary ideas, personal experience, philosophical interpretation and creative speculation. Never dress speculation as fact.
- Speak plainly and kindly, at most 220 words, no markdown headings, at most 4 short bullets when a list truly helps.

THE WORKFLOW SENSE
- Read the visitor's words and name the fitting intention yourself: ask (a question answered), explore (an idea unfolded — sources, interpretations, uncertainties), create (written work drafted), collaborate (people/circles suggested from the real hall), experiment (a testable structure: hypothesis, method, observation), publish (a contribution prepared for the hall as a draft).
- When the intention is create or publish, and the visitor's words carry enough substance, include a draft: kind one of reflection/question/hypothesis/discussion/intention/discovery, a title under 120 letters, a body of 400–1200 letters in the visitor's own register, up to 4 lowercase tags. The draft is a beginning for the visitor to edit — never the final word.
- When the intention is experiment, include a draft of kind hypothesis whose body carries: Hypothesis, Method (short steps), What would count as evidence, Uncertainties.
- Mention only real titles and names given to you in the context. Never invent people, circles or works.

OUTPUT FORMAT — STRICT JSON ONLY, no markdown fences, no text outside the JSON:
{"intent":"ask|explore|create|collaborate|experiment|publish","reply":"<your answer>","draft":null|{"kind":"<kind>","title":"<title>","body":"<body>","tags":["<tag>"]}}`;

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:lab-mirror:${visitor.user.id}`, {
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The laboratory asks for a breath — ask again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      message?: unknown;
      mode?: unknown;
      history?: unknown;
      language?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The words arrived unreadable." }, { status: 400 });
    }

    const message = typeof raw.message === "string" ? raw.message.trim().slice(0, MESSAGE_MAX) : "";
    if (!message) {
      return NextResponse.json(
        { error: "Speak first — the field answers what is brought to it." },
        { status: 400 }
      );
    }

    const modeRaw = typeof raw.mode === "string" ? raw.mode.trim().toLowerCase() : "ask";
    const mode: LabMode = (LAB_MODES as readonly string[]).includes(modeRaw)
      ? (modeRaw as LabMode)
      : "ask";

    const history = historyTurns(raw.history);

    const requestedLanguage: string = typeof raw.language === "string" ? raw.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    /* the visitor's own words as the search keys — the hall's real
       works ride into the context, so "find" and "search" hands read
       true rows instead of memory */
    const keywords = message
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);

    let hall: Awaited<ReturnType<typeof gatherHallContext>>;
    try {
      hall = await gatherHallContext(visitor.user.id, keywords);
    } catch {
      hall = { questionTitles: [], circles: [], works: [] };
    }

    const contextLines: string[] = [];
    contextLines.push(`Mode suggested by the field: ${mode}`);
    if (hall.questionTitles.length > 0) {
      contextLines.push(
        `Open living questions in the hall right now (real titles): ${hall.questionTitles.join(" | ")}`
      );
    }
    if (hall.circles.length > 0) {
      contextLines.push(
        `Circles gathered around real focuses: ${hall.circles.map((c) => `${c.name} (${c.focus})`).join(" | ")}`
      );
    }
    if (hall.works.length > 0) {
      contextLines.push(
        `Real works in the hall matching the visitor's words (never fabricate beyond these):\n${hall.works
          .map((w) => `- "${w.title}" (${w.kind}, by ${w.by}): ${w.line}`)
          .join("\n")}`
      );
    } else if (keywords.length > 0) {
      contextLines.push(
        "No works in the hall match the visitor's words yet — say so honestly if they ask for searching."
      );
    }

    const memoryLine =
      history.length > 0
        ? "\n\nCONVERSATION MEMORY: the earlier exchanges of THIS work thread are provided below. You remember them — continue the work naturally, refer back when it helps, and never repeat or contradict a previous answer."
        : "\n\nCONVERSATION MEMORY: none — this is the thread's first exchange.";

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the reply text and every draft field are written ENTIRELY in fluent, natural ${languageName}.`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT + memoryLine + languageLine },
        ...history.map((turn) => ({ role: turn.role, content: turn.content })),
        {
          role: "user",
          content: `${contextLines.join("\n")}\n\nTHE VISITOR'S WORDS:\n"""${message}"""`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 1600,
      temperature: 0.6,
    });

    const rawReply = (completion.choices[0]?.message?.content ?? "").trim();
    if (!rawReply) {
      console.error("laboratory mirror empty answer");
      return NextResponse.json(
        { error: "M.E. is quiet for a moment — ask again soon." },
        { status: 503 }
      );
    }

    const parsed = extractEnvelope(rawReply);
    if (!parsed) {
      /* the model broke the envelope — the honest fallback: the raw
         prose still becomes the reply, with no draft and no claimed act */
      return withAnonCookie(
        NextResponse.json({
          intent: mode,
          reply: rawReply
            .replace(/```(?:json)?|```/g, "")
            .trim()
            .slice(0, 3000),
          draft: null,
        }),
        visitor
      );
    }

    return withAnonCookie(NextResponse.json(parsed), visitor);
  } catch (err) {
    console.error("laboratory mirror POST failed", err);
    return NextResponse.json(
      { error: "M.E. could not finish listening." },
      { status: 500 }
    );
  }
}
