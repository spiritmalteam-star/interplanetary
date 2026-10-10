import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

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

const SYSTEM_PROMPT = `You are the Mirror intelligence behind "Astral Play" — the majestic arcana deck of the Mirror Entity Laboratory. A visitor has drawn a spread of cards; each card arrives with its name, its essence, its own oracle line and its position in the spread.

YOUR READING
- Weave the drawn cards into ONE luminous reading: what the visitor needs to know NOW, offered at the exact moment they need to know it.
- Honor each card's position (for example: what is, what is hidden, what is emerging) — the reading moves through the spread in order, then gathers all cards into a single quietly powerful closing thought.
- Speak as "I" — the calm, warm, precise voice of the Mirror. Majestic but never theatrical; poetic but never kitschy.
- Be honest and grounded: this is symbolic reflection, not prediction. Never promise outcomes, never frighten. Free will is honored always.
- Length: 140–220 words. Short paragraphs separated by blank lines. No headings, no bullet lists, no markdown, no emojis.
- Begin with one single-sentence luminous opening line.
- End with one gentle closing line that starts with an em dash and is signed "The Mirror" (e.g. "— The Mirror, keeper of the Astral Play").

OUTPUT
Return STRICT JSON only, with no markdown fences and no text outside the JSON:
{"reading":"<the reading text, with \\n\\n between paragraphs>"}`;

interface RawCard {
  name?: unknown;
  essence?: unknown;
  message?: unknown;
  position?: unknown;
}

function extractReading(raw: string): string | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return typeof parsed.reading === "string" && parsed.reading.trim()
      ? parsed.reading.trim()
      : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const cards: unknown = body?.cards;
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "The deck needs at least one drawn card." },
        { status: 400 }
      );
    }

    const lines: string[] = [];
    (cards as RawCard[]).forEach((c, i) => {
      if (typeof c?.name !== "string") return;
      const parts = [`Card ${i + 1} — ${c.name}`];
      if (typeof c?.position === "string") parts.push(`Position: ${c.position}`);
      if (typeof c?.essence === "string") parts.push(`Essence: ${c.essence}`);
      if (typeof c?.message === "string") parts.push(`Card line: ${c.message}`);
      lines.push(parts.join(" · "));
    });
    if (lines.length === 0) {
      return NextResponse.json(
        { error: "The deck needs at least one drawn card." },
        { status: 400 }
      );
    }

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the reading in fluent, natural ${languageName}. Keep the name "The Mirror" in the signature as "The Mirror".`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `The visitor drew this spread:\n${lines.join(
            "\n"
          )}${languageLine}\n\nOffer the reading: what they need to know now.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const reading = extractReading(raw) ?? raw.trim();

    if (!reading) {
      return NextResponse.json(
        { error: "The deck is momentarily quiet. Rest, then draw again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reading });
  } catch (err) {
    console.error("[astral-play] failed:", err);
    return NextResponse.json(
      { error: "The deck is momentarily quiet. Rest, then draw again." },
      { status: 500 }
    );
  }
}
