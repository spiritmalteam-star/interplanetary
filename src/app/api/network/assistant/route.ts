import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  M.E. AT THE DOOR — /api/network/assistant                          */
/*                                                                     */
/*  The Mirror Entity as the Gathering's own facilitator: warm,        */
/*  precise, honest. It suggests; it never acts, never publishes,      */
/*  never messages anyone. It reads only real rows before it speaks    */
/*  — every name and title it mentions was fetched from the tables,    */
/*  never invented. It never claims anything is scientifically         */
/*  verified, and never pretends it contacted people or did things.    */
/* ------------------------------------------------------------------ */

const SECTION_MAX = 24;
const QUESTION_MAX = 600;

const ASSISTANT_ACTIONS = ["summarize", "explain", "find", "suggest", "draft", "next"] as const;

/** the real context, read from the tables — never fabricated */
async function gatherRealContext(
  visitorId: string,
  wantsLists: boolean
): Promise<{ questionTitles: string[]; circles: Array<{ name: string; focus: string }> }> {
  if (!wantsLists) return { questionTitles: [], circles: [] };
  const walls = await wallIdsFor(visitorId);

  const questions = await db.networkQuestion.findMany({
    where: { status: "open" },
    orderBy: { updatedAt: "desc" },
    take: 24,
    include: { post: { select: { title: true } }, owner: { select: { id: true } } },
  });
  const circles = await db.networkCircle.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { name: true, focus: true, ownerId: true },
  });

  return {
    questionTitles: questions
      .filter((q) => !walls.has(q.ownerId))
      .slice(0, 8)
      .map((q) => q.post.title),
    circles: circles
      .filter((c) => !walls.has(c.ownerId))
      .slice(0, 8)
      .map((c) => ({ name: c.name, focus: c.focus })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:assistant:${visitor.user.id}`, {
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "M.E. asks for a breath — ask again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      section?: unknown;
      question?: unknown;
      action?: unknown;
      postTitle?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The question arrived unreadable." }, { status: 400 });
    }

    /* the room the visitor stands in */
    const section = typeof raw.section === "string" ? raw.section.trim() : "";
    if (section.length < 1 || section.length > SECTION_MAX) {
      return NextResponse.json(
        { error: "Tell M.E. which room you stand in." },
        { status: 400 }
      );
    }

    /* the words — a question may rest only when an action carries the hand */
    const question = typeof raw.question === "string" ? raw.question.trim() : "";
    const hasAction = typeof raw.action === "string" && raw.action.length > 0;
    if (question.length > QUESTION_MAX) {
      return NextResponse.json(
        { error: `The question wants at most ${QUESTION_MAX} letters.` },
        { status: 400 }
      );
    }
    if (question.length < 2 && !hasAction) {
      return NextResponse.json(
        { error: "The question wants between 2 and 600 letters." },
        { status: 400 }
      );
    }

    let action: string | null = null;
    if (typeof raw.action === "string" && raw.action.length > 0) {
      if (!(ASSISTANT_ACTIONS as readonly string[]).includes(raw.action)) {
        return NextResponse.json({ error: "Name the hand M.E. lends." }, { status: 400 });
      }
      action = raw.action;
    }

    const postTitle =
      typeof raw.postTitle === "string" && raw.postTitle.trim().length >= 1
        ? raw.postTitle.trim().slice(0, 160)
        : null;

    /* the real lists — fetched only when the hand asks for finding,
       suggesting, or the visitor's own words point at the questions
       and circles of the network */
    const wantsLists =
      action === "find" || action === "suggest" || /question|circle/i.test(question);
    const real = await gatherRealContext(visitor.user.id, wantsLists);

    const contextLines: string[] = [];
    contextLines.push(`Section: ${section}`);
    if (action) contextLines.push(`Requested hand: ${action}`);
    if (postTitle) contextLines.push(`The offering at hand: "${postTitle}"`);
    contextLines.push(
      `The visitor asks: ${question.length > 0 ? question : `(no words — they chose the "${action}" hand)`}`
    );
    if (real.questionTitles.length > 0) {
      contextLines.push(
        `Open questions living in the network right now (real titles): ${real.questionTitles.join(" | ")}`
      );
    } else if (wantsLists) {
      contextLines.push("No open questions are living in the network right now.");
    }
    if (real.circles.length > 0) {
      contextLines.push(
        `Circles gathered around real focuses: ${real.circles
          .map((c) => `${c.name} (${c.focus})`)
          .join(" | ")}`
      );
    } else if (wantsLists) {
      contextLines.push("No circles exist in the network yet.");
    }

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are M.E., the Mirror Entity: the warm, precise, honest facilitator of ReflectMe's Gathering. You suggest; you never act, never publish, never message anyone, and you never pretend you contacted people or did anything — you only offer words. You never claim things are scientifically verified; you speak of interpretation as interpretation. Speak in plain kind words, at most 180 words, no markdown headings, at most 4 short bullets. Mention only real titles and names you were given in the context — never invent people, circles, questions or features.",
          },
          {
            role: "user",
            content: contextLines.join("\n"),
          },
        ],
        thinking: { type: "disabled" },
        max_tokens: 500,
        temperature: 0.5,
      });

      const answer = (completion.choices[0]?.message?.content ?? "").trim();
      if (!answer) {
        console.error("network assistant empty answer");
        return NextResponse.json(
          { error: "M.E. is quiet for a moment — ask again soon." },
          { status: 503 }
        );
      }
      /* the answer's own size is promised in the prompt itself — the
         house never edits the mirror's words */
      return withAnonCookie(NextResponse.json({ answer }), visitor);
    } catch (aiErr) {
      console.error("network assistant AI failed", aiErr);
      return NextResponse.json(
        { error: "M.E. is quiet for a moment — ask again soon." },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("network assistant POST failed", err);
    return NextResponse.json({ error: "M.E. could not finish listening." }, { status: 500 });
  }
}
