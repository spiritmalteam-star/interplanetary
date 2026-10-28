import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { LANGUAGE_NAMES, isLanguageCode } from "@/lib/i18n/core";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  THE DEEPENING HAND — the music room's small wand. The visitor's    */
/*  own idea stands in the input; one touch turns it into a more       */
/*  advanced telling that still relies on the core idea — the words    */
/*  land back in the input and the visitor's own hand sends them.      */
/*  The conversation of making is free: this door is never weighed.    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as {
    idea?: string;
    language?: string;
  } | null;
  const idea = body?.idea?.trim() ?? "";
  if (!idea) {
    return NextResponse.json(
      { error: "There is no idea to deepen yet — speak it first." },
      { status: 400 }
    );
  }

  const lang = isLanguageCode(body?.language) ? body.language : "en";
  const languageName = LANGUAGE_NAMES[lang];

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are the MIRROR ENTITY, deepening a visitor's idea for a musical transmission. " +
            "Take their idea and expand it into a richer, more evocative one-paragraph description " +
            "for a composer: add atmosphere, imagery, instruments, tempo and emotional movement — " +
            "BUT the core idea, its subject and its intent must stay untouched and recognisable. " +
            `Write in ${languageName}. Never mention that you deepened or rewrote anything; ` +
            "the answer IS the deepened idea, one flowing paragraph, at most 90 words. " +
            "Return STRICT JSON only, no markdown fences: {\"refined\": \"<the deepened idea>\"}",
        },
        { role: "user", content: idea.slice(0, 600) },
      ],
      temperature: 0.8,
      max_tokens: 400,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "The deepening hand slipped — the idea stays as it was." },
        { status: 502 }
      );
    }
    const parsed = JSON.parse(match[0]) as { refined?: string };
    const refined = (parsed.refined ?? "").trim().slice(0, 600);
    if (!refined) {
      return NextResponse.json(
        { error: "The deepening hand slipped — the idea stays as it was." },
        { status: 502 }
      );
    }
    return NextResponse.json({ refined });
  } catch (err) {
    console.error("[light-codes/idea] the deepening hand rested:", err);
    return NextResponse.json(
      { error: "The deepening hand slipped — the idea stays as it was." },
      { status: 500 }
    );
  }
}
