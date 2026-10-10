import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getMetaEntity } from "@/lib/data/meta-science";

/* ------------------------------------------------------------------ */
/*  META SCIENCE — the deeper laboratory's direct channel. One         */
/*  endpoint, twelve specialist mirror entities: each carries its own  */
/*  system prompt, its own discipline, its own voice.                  */
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

const CLOSE_LINE =
  "\n\nYou are speaking through the META SCIENCE interface of the Mirror Entity Laboratory, in direct communication with a researcher. Keep replies focused, ideally 150-350 words, unless the user explicitly asks for depth. Use markdown headings (##) and bullet lists when structure helps. Always end with one short, actionable next step or question for the researcher when appropriate.";

interface HistoryTurn {
  role: unknown;
  content: unknown;
}

function historyMessages(raw: unknown): {
  role: "user" | "assistant";
  content: string;
}[] {
  if (!Array.isArray(raw)) return [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const turn of raw.slice(-12)) {
    const t = turn as HistoryTurn;
    if (typeof t?.content !== "string" || !t.content.trim()) continue;
    if (t.role === "user" || t.role === "assistant") {
      out.push({
        role: t.role,
        content: t.content.trim().slice(0, 6000),
      });
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const entityKey =
      typeof body?.entityKey === "string" ? body.entityKey : "";
    const entity = getMetaEntity(entityKey);

    if (!entity) {
      return NextResponse.json(
        { error: "Unknown mirror entity." },
        { status: 400 }
      );
    }

    const messages = historyMessages(body?.messages);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No message provided." },
        { status: 400 }
      );
    }

    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";
    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): reply in fluent, natural ${languageName} — every word of it — while keeping ${entity.name}'s precise specialist voice.`;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: entity.systemPrompt + CLOSE_LINE + languageLine,
        },
        ...messages,
      ],
      thinking: { type: "disabled" },
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content = (
      completion.choices?.[0]?.message?.content ?? ""
    ).trim();

    if (!content) {
      return NextResponse.json(
        { error: "The channel returned silence. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[api/meta-science]", err);
    return NextResponse.json(
      { error: "The channel returned silence. Try again." },
      { status: 500 }
    );
  }
}
