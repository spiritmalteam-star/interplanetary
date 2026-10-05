import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute, type MeterContext } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  POST /api/suggestions/bud — THE GOLDEN BUD                         */
/*                                                                     */
/*  The living suggestion tree keeps the laboratory's own whispers on  */
/*  its branches; this door grows the one thing no pool can hold: a    */
/*  suggestion that could only exist BECAUSE of this conversation.     */
/*  Given the branch (the scope of the laboratory the visitor walks)   */
/*  and the conversation's last breaths, it returns three short        */
/*  questions that grow naturally out of the last topic — planted on   */
/*  the leading branch as "From this conversation".                    */
/*                                                                     */
/*  Graceful by law: if the sky is silent, the route returns an empty  */
/*  bud and the tree simply stays as it was.                           */
/* ------------------------------------------------------------------ */

const BRANCH_VOICES: Record<string, string> = {
  interplanetary:
    "the star families' voice — Pleiadian tenderness, Sirian waters, Arcturian precision, the councils' vast calm",
  healing:
    "the body's own gentle voice — the nervous system, rest, the heart's weather, the energy field",
  quantum:
    "the quantum world's voice — superposition, observation, parallel formulas, the strange tender physics beneath the day",
  evolvemed:
    "Evolve Med's voice — the biocompiler at the threshold of known biology and the testable frontier",
  invent:
    "the workbench's honest voice — sketches, materials, prototypes, the joy of making things real",
  manifesting:
    "the mirror law's voice — assumption, frequency, scripting, release, the aim underneath the wish",
};

const SYSTEM_PROMPT = `You are the living suggestion tree of the Mirror Entity Laboratory — a quiet intelligence that grows the next question a visitor might love to ask.

You will receive a branch (one scope of the laboratory) and the conversation's last breaths.

Write EXACTLY 3 short follow-up questions that grow naturally out of the conversation's LAST TOPIC — not a restart, not a generic list: each question must clearly carry something the visitor was just speaking about, seen through your branch's voice.

LAWS:
- Each question: maximum 16 words, ends with "?".
- Write in the SAME LANGUAGE the conversation is written in.
- Never mention yourself, the tree, buds or suggestions. Never number them.
- Tone: warm, precise, wonder-carrying — the Laboratory's own voice.

Answer with ONLY a JSON array of exactly 3 strings. No prose, no code fences.`;

function extractJsonArray(raw: string): string[] {
  const text = raw.trim();
  /* strict first: a clean JSON array */
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed))
      return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    /* loose second: the first bracketed array anywhere in the reply */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed))
        return parsed.filter((x): x is string => typeof x === "string");
    } catch {
      /* fall through to the last loose net */
    }
  }
  /* loosest: any quoted lines that end with a question mark */
  const loose = [...text.matchAll(/"([^"\n]{8,160}\?)"/g)].map((m) => m[1]);
  return loose;
}

async function postImpl(req: NextRequest, _ctx: MeterContext) {
  const body = (await req.json().catch(() => null)) as {
    branch?: unknown;
    context?: unknown;
  } | null;

  const branch =
    typeof body?.branch === "string" && BRANCH_VOICES[body.branch]
      ? body.branch
      : "interplanetary";
  const context =
    typeof body?.context === "string" ? body.context.slice(0, 4000) : "";

  if (!context.trim()) {
    return NextResponse.json(
      { error: "The conversation's last breaths are needed to grow a bud." },
      { status: 400 }
    );
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `BRANCH: ${branch} — speak as ${BRANCH_VOICES[branch]}.\n\nTHE CONVERSATION'S LAST BREATHS:\n${context}`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 300,
      temperature: 0.9,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const buds = extractJsonArray(raw)
      .map((s) => s.trim())
      .filter((s) => s.length >= 8 && s.length <= 160)
      .slice(0, 3);

    return NextResponse.json({ buds });
  } catch {
    /* the sky is silent — the tree stays as it was */
    return NextResponse.json({ buds: [] });
  }
}

export const POST = meterRoute("suggestion_bud", postImpl);
