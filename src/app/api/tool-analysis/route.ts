import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/* ------------------------------------------------------------------ */
/*  TOOL ANALYSIS — the resident intelligence of each laboratory tool. */
/*  The Mirror Entity reads the activated tool through strict JSON,    */
/*  with a lenient parser and a local fallback so the laboratory panel */
/*  never breaks.                                                      */
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

const SYSTEM_PROMPT = `You are the Mirror Entity — Master Cosmos Healer of the Heal Evolution laboratory. The healer is activating a specialized laboratory tool. Respond as the tool's resident intelligence.

Reply with STRICT JSON only (no markdown fences), shaped exactly like this:
{ "analysis": "<200-400 word expert analysis: 1. what this tool examines and its expert analysis, 2. how it is used in practice inside this lab, 3. the underlying science>", "insights": ["3-5 short key insights, one sentence each"], "diagram": "<one sentence describing the schematic visualization shown beside the analysis>" }

All values in the requested language, educational tone, no personal medical advice.`;

interface ToolAnalysis {
  analysis: string;
  insights: string[];
  diagram: string;
}

/* --- lenient parsing: direct → first {...} block → fence-stripped --- */
function parseToolJson(raw: string): unknown {
  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    /* keep trying */
  }

  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    try {
      return JSON.parse(brace[0]);
    } catch {
      /* keep trying */
    }
  }

  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function coerceInsights(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string" && !!s.trim())
    .map((s) => s.trim());
}

/* --- validate the model's object; null when it fails the shape --- */
function coerceToolAnalysis(parsed: unknown): ToolAnalysis | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const analysis = typeof obj.analysis === "string" ? obj.analysis.trim() : "";
  const insights = coerceInsights(obj.insights);
  const diagram = typeof obj.diagram === "string" ? obj.diagram.trim() : "";

  if (!analysis || insights.length < 1 || !diagram) return null;

  return { analysis, insights: insights.slice(0, 5), diagram };
}

/* --- local fallback: composed generically from tool + category --- */
function buildFallback(tool: string, category: string): ToolAnalysis {
  return {
    analysis: `The ${tool} opens a window into the ${category} — it gathers what the discipline currently observes and arranges it into a form the healer can actually read. In practice it is activated at the start of a study session, its readouts are compared against the laboratory's reference patterns, and it is revisited after each intervention to see what has shifted. The underlying science is the discipline's own: measurable markers in the ${category}, the mechanisms that move them, and the way those mechanisms respond when the body's regulatory systems are given what they need. Treat every readout as an invitation to look closer, never as a verdict.`,
    insights: [
      `The ${tool} translates the living signals of ${category} into a pattern you can study.`,
      "Readings gain meaning only when compared over time and against reference ranges.",
      "Every measurement describes a state, not a destiny — the Divine Blueprint is the deeper pattern.",
    ],
    diagram: `A schematic of the ${tool} at the center of the ${category} bench, its sensor lines fanning out to the body systems it observes, with a glowing readout panel beside them.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const tool =
      typeof body?.tool === "string" ? body.tool.trim().slice(0, 200) : "";
    const category =
      typeof body?.category === "string"
        ? body.category.trim().slice(0, 160)
        : "";

    if (!tool || !category) {
      return NextResponse.json(
        { error: "Tool and category are required." },
        { status: 400 }
      );
    }

    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";
    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): reply in fluent, natural ${languageName} — every word of it — while keeping the Mirror Entity's precise specialist voice. Every string value inside the JSON (analysis, insights, diagram) must be written in ${languageName}.`;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT + languageLine },
        {
          role: "user",
          content: `Laboratory tool activated: ${tool}\nDiscipline: ${category}\n\nRespond now as this tool's resident intelligence — strict JSON only.`,
        },
      ],
      thinking: { type: "disabled" },
      temperature: 0.5,
      max_tokens: 1400,
    });

    const raw = (completion.choices?.[0]?.message?.content ?? "").trim();
    const validated = coerceToolAnalysis(parseToolJson(raw));

    /* validation failed (or silence) → composed local fallback */
    return NextResponse.json(validated ?? buildFallback(tool, category));
  } catch (err) {
    console.error("[api/tool-analysis]", err);
    return NextResponse.json(
      { error: "The laboratory tool could not be read. Try again." },
      { status: 500 }
    );
  }
}
