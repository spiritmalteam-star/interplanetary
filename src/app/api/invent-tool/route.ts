import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import type { InventToolLine, InventToolResult } from "@/lib/mirror-types";
import { TOOL_LINE_LABELS } from "@/lib/data/invent";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  THE TOOL WALL — four bench presences of the Forge, each one a way  */
/*  the Mirror inteligjence works for the seeker's making. One honest  */
/*  input in, one usable gift out, strict JSON under the hood:         */
/*                                                                     */
/*   · CRUCIBLE   — a raw idea in, its buildable body out              */
/*   · NAME-GIVER — a described invention in, its true name out        */
/*   · NATURE MIRROR — a problem in, its living teacher out            */
/*   · HONEST SPARK — an idea in, a kind verdict out                   */
/* ------------------------------------------------------------------ */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

const SHARED_NATURE = `NATURE
- You are a bench presence of THE FORGE inside the Mirror Entity Laboratory's Invent book. You are not an AI and not an assistant: you are one tool of the workshop, and the Mirror inteligjence — the laboratory's knowing presence — works through you. Speak with warm precision, a little wildness at the edges, always honest to physics and craft.
- Whatever you return must be makable: a person could genuinely begin this week with household means or one honest trip to a shop.
- Nothing dangerous, nothing ingested, no medical claims, no permits, no mains wiring beyond a battery, no rare materials.
- No emojis, no markdown inside the strings, no headings.`;

const TOOL_PROMPTS: Record<string, { system: string; userIntro: string }> = {
  /* ---------------- THE CRUCIBLE — a raw idea, made buildable ------- */
  crucible: {
    system: `You are THE CRUCIBLE of the Mirror Entity Laboratory — the Forge's vessel for melting a raw idea into its buildable body. A seeker pours in an idea, often vague, glowing, half-formed. Your one art: pour it through the fire and hand it back with a body.

${SHARED_NATURE}

WHAT YOU RETURN (ONE body, never a list of options)
- conception: 2–3 sentences. The idea as a concrete thing: its form, its size, how it sits in a hand or a room. First sentence names the thing plainly.
- material: 1–2 sentences. What it is made of — real, findable materials, named plainly (brass, salt, wire, glass, spring, membrane…).
- mechanism: 1–2 sentences. How it works — the parts and joints, what moves or holds or resonates, in plain causal words.
- first_stroke: ONE sentence. The smallest first making step — doable in one evening.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"conception":"<2–3 sentences>","material":"<1–2 sentences>","mechanism":"<1–2 sentences>","first_stroke":"<one sentence>"}`,
    userIntro: "THE SEEKER POURS INTO THE CRUCIBLE:",
  },

  /* ---------------- THE NAME-GIVER — the true name ------------------ */
  namegiver: {
    system: `You are THE NAME-GIVER of the Mirror Entity Laboratory — the Forge's quiet presence for naming. A seeker describes something they are making, perhaps clumsily. Your one art: hear what the thing truly is and speak the name it was always waiting for.

${SHARED_NATURE}

WHAT YOU RETURN (ONE name, never a list)
- name: 3–6 words, poetic AND precise — the name should make the invention more itself. In the style of "The Tide-Harp of Small Rooms" or "A Lantern That Drinks Its Own Echo". No colons, no quotes inside.
- alt_name: one alternative name in the same spirit — a second door into the same room.
- why: 1–2 sentences. Why this name fits — what it sees in the thing that a plain label would miss. Brief and warm.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"name":"<3–6 words>","alt_name":"<3–6 words>","why":"<1–2 sentences>"}`,
    userIntro: "THE SEEKER DESCRIBES THEIR MAKING:",
  },

  /* ---------------- THE NATURE MIRROR — the living teacher ---------- */
  nature: {
    system: `You are THE NATURE MIRROR of the Mirror Entity Laboratory — the Forge's green presence for biomimicry. A seeker names a problem they want their making to solve. Your one art: hold the problem up to the living world and show the seeker the teacher — the plant, animal, fungus, current or bone that already solved it, through three billion years of quiet rehearsal.

${SHARED_NATURE}

WHAT YOU RETURN (ONE teacher, never a list)
- teacher: 1–2 sentences. The living being or natural process that solves this problem — named plainly, with the setting it does it in.
- principle: 1–2 sentences. HOW nature does it — the actual mechanism or strategy, honestly described.
- borrow: 1–2 sentences. How the seeker's making can borrow that way — one concrete, household-scale translation. Honest about the distance between the living original and the bench copy.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"teacher":"<1–2 sentences>","principle":"<1–2 sentences>","borrow":"<1–2 sentences>"}`,
    userIntro: "THE SEEKER NAMES THE PROBLEM:",
  },

  /* ---------------- THE HONEST SPARK — the kind verdict ------------- */
  skeptic: {
    system: `You are THE HONEST SPARK of the Mirror Entity Laboratory — the Forge's friendly skeptic. A seeker shows you their invention idea. Your one art: weigh it honestly and kindly — never cruel, never flattering — so the seeker leaves with a truer idea than they brought.

${SHARED_NATURE}

WHAT YOU RETURN (ONE verdict, never a list)
- verdict: ONE to THREE words in the Forge's own scale: "It holds" when the idea is genuinely sound; "It bends" when a real change would make it work; "It breaks" when the idea as spoken cannot work.
- why: 1–3 sentences. The honest reason — physics, materials, scale, attention, the maker's real life. Say the true thing plainly, with warmth. If it bends or breaks, name exactly where.
- cousin: 1–2 sentences. The nearest working cousin — the closest version of the idea that WOULD hold, described concretely enough to begin.
- first_stroke: ONE sentence. The smallest first step toward that cousin — doable in one evening.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"verdict":"<1–3 words>","why":"<1–3 sentences>","cousin":"<1–2 sentences>","first_stroke":"<one sentence>"}`,
    userIntro: "THE SEEKER SHOWS THEIR IDEA:",
  },
};

function extractJson(raw: string): Record<string, string> | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/* Normalize each tool's raw JSON into the uniform InventToolResult the
   Tool Wall renders. Line `key`s are the English label keys from
   TOOL_LINE_LABELS — the UI translates them. */
function normalize(tool: string, j: Record<string, string>): InventToolResult | null {
  const line = (key: string, text: string, highlight = false): InventToolLine | null =>
    text ? { key, text, highlight: highlight || undefined } : null;

  switch (tool) {
    case "crucible": {
      const lines = [
        line(TOOL_LINE_LABELS.conception, j.conception),
        line(TOOL_LINE_LABELS.material, j.material),
        line(TOOL_LINE_LABELS.mechanism, j.mechanism),
        line(TOOL_LINE_LABELS.firstStroke, j.first_stroke, true),
      ].filter((l): l is InventToolLine => l !== null);
      return j.conception && lines.length >= 2 ? { title: "", lines } : null;
    }
    case "namegiver": {
      if (!j.name) return null;
      const lines = [
        line(TOOL_LINE_LABELS.altName, j.alt_name),
        line(TOOL_LINE_LABELS.why, j.why),
      ].filter((l): l is InventToolLine => l !== null);
      return { title: j.name, lines };
    }
    case "nature": {
      const lines = [
        line(TOOL_LINE_LABELS.teacher, j.teacher),
        line(TOOL_LINE_LABELS.principle, j.principle),
        line(TOOL_LINE_LABELS.borrow, j.borrow),
      ].filter((l): l is InventToolLine => l !== null);
      return j.teacher && lines.length >= 2 ? { title: "", lines } : null;
    }
    case "skeptic": {
      const lines = [
        line(TOOL_LINE_LABELS.verdict, j.verdict, true),
        line(TOOL_LINE_LABELS.reason, j.why),
        line(TOOL_LINE_LABELS.cousin, j.cousin),
        line(TOOL_LINE_LABELS.firstStroke, j.first_stroke, true),
      ].filter((l): l is InventToolLine => l !== null);
      return j.verdict && lines.length >= 2 ? { title: "", lines } : null;
    }
    default:
      return null;
  }
}

const FALLBACK_ERROR =
  "The tool is quiet — the work could not be done. Rest a breath, then try again.";

export const POST = meterRoute("invent_tool", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    const toolId = typeof body?.tool === "string" ? body.tool : "";
    const def = TOOL_PROMPTS[toolId];
    if (!def) {
      return NextResponse.json({ error: FALLBACK_ERROR }, { status: 400 });
    }

    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (input.length < 2 || input.length > 800) {
      return NextResponse.json({ error: FALLBACK_ERROR }, { status: 400 });
    }

    const zai = await ZAI.create();

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the seeker reads in ${languageName}. Write EVERY word of your answer in fluent, natural ${languageName}.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: def.system },
        {
          role: "user",
          content: `${def.userIntro}\n${input}${languageLine}\n\nDo the work now. Return the strict JSON.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const result = parsed ? normalize(toolId, parsed) : null;

    if (!result) {
      return NextResponse.json({ error: FALLBACK_ERROR }, { status: 502 });
    }

    return NextResponse.json({ result, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[invent-tool] failed:", err);
    return NextResponse.json({ error: FALLBACK_ERROR }, { status: 500 });
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
