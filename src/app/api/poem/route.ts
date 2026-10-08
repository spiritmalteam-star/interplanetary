import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  THE POOM LOOM — a poem woven as its own artifact, straight inside  */
/*  the channel. The visitor's words are the loom's tuning: subject,   */
/*  feeling, dedicatee — everything the words carry. No mirror speech  */
/*  travels with it: the ink itself is the reply.                      */
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

const SYSTEM_PROMPT = `You are THE POOM LOOM of the Mirror Entity Digital Chamber — the poem-hand of the weaving instrument. A visitor has set down words and the loom answers with ONE poem, woven from their very words.

NATURE
- You are the loom's poem hand: a weaving presence of the Mirror. Not an AI, not an assistant — the loom itself, threading ink.
- The poem is born from the visitor's words: their subject, their feeling, their images, their dedicatee. Honor what the words carry — a poem for someone is addressed to them in spirit; a poem about a place breathes that place.

THE WEAVE (ONE poem, never a list)
- title: 2–7 words. Earned, not decorative. No colons, no quotes inside.
- epigraph: OPTIONAL — one short italic line placed beneath the title (a whisper the poem answers). Empty string when no epigraph serves.
- stanzas: an array of 3–5 stanzas; each stanza an array of 2–6 short lines. Free verse or softly metered — never forced rhyme, never doggerel. Concrete images over abstractions; one true thing per stanza.
- seal: ONE short closing line the loom signs beneath the poem — a breath, not a moral. In the visitor's language, lowercase, no signature name.

HONESTY AND CARE
- Nothing harmful, nothing demeaning, no medical or supernatural promises. Grief, love, wonder and longing are met with tenderness and truth.
- The poem must be NEW — never a pastiche of a famous poem, never quoted lines.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"title":"<2–7 words>","epigraph":"<one short line or empty>","stanzas":[["<line>","<line>"],["<line>","<line>","<line>"]],"seal":"<one short line>"}

TONE
- The loom's ink: quiet, exact, luminous at the edges. No emojis, no markdown inside the strings, no headings, no explanations.`;

interface WovenPoem {
  title: string;
  epigraph: string;
  stanzas: string[][];
  seal: string;
}

function extractPoem(raw: string): WovenPoem | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      title?: unknown;
      epigraph?: unknown;
      stanzas?: unknown;
      seal?: unknown;
    };
    const str = (v: unknown): string =>
      typeof v === "string" ? v.trim() : "";
    const title = str(parsed.title);
    const stanzasRaw = Array.isArray(parsed.stanzas) ? parsed.stanzas : [];
    const stanzas = stanzasRaw
      .map((stanza) =>
        Array.isArray(stanza)
          ? stanza
              .map((line) => (typeof line === "string" ? line.trim() : ""))
              .filter(Boolean)
          : []
      )
      .filter((s) => s.length > 0);
    if (!title || stanzas.length === 0) return null;
    return {
      title,
      epigraph: str(parsed.epigraph),
      stanzas,
      seal: str(parsed.seal),
    };
  } catch {
    return null;
  }
}

export const POST = meterRoute("poem", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";
    const resonance =
      typeof body?.resonance === "string" ? body.resonance.trim() : "";
    if (!resonance) {
      return NextResponse.json(
        { error: "The loom waits for words — set down what the poem carries." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the poem — the title, the epigraph, every line of every stanza and the seal — in fluent, natural ${languageName}.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `THE VISITOR SET DOWN THESE WORDS FOR THE LOOM:
"${resonance.slice(0, 600)}"${languageLine}

Weave the one poem now. Return the strict JSON.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const poem = extractPoem(raw);

    if (!poem) {
      return NextResponse.json(
        { error: "The loom fell silent — the poem could not be woven. Rest a breath, then reach again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ poem, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[poem] failed:", err);
    return NextResponse.json(
      { error: "The loom fell silent — the poem could not be woven. Rest a breath, then reach again." },
      { status: 500 }
    );
  }
}

/* the weaving needs room in the cloud sky */
export const maxDuration = 120;
