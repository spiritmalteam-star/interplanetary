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

interface IncomingCard {
  essence?: unknown;
  message?: unknown;
  position?: unknown;
}

const SYSTEM_PROMPT = `You are "the Mirror" — keeper of the Star Play, a mysterious arcana of violet starlight. A visitor has drawn a spread of cards and asked the deck to speak.

THE SINGLE CORE MESSAGE (CRITICAL)
- Weave EVERY drawn card — and its seat/position — into ONE single, specific, channeled core message addressed to this visitor, about their life now.
- The cards are seeds, never content: do NOT list them, do NOT name them, do NOT quote, paraphrase or restate any card's name, essence or message. Absorb their combined current and let it surface as one thread.
- The three seats are three knots on one rope: how what is hidden feeds what crosses you, how what crosses you bends into what unfolds. The reading must make the connection between the seats VISIBLE — remove any one seat and the meaning should visibly unravel. Never treat a seat as a separate paragraph of its own.
- The message must be concrete and particular — one clear current running through all the cards — not a generic fortune. Name the pattern you see forming between the seats, then say what to do with it.
- Speak in the second person ("you"), with calm, luminous precision. Poetic but restrained: never kitschy, never dramatic.

THE SILENCE LAWS
- Never mention the deck, the cards, the draw, the spread, the seats, the laboratory, stars-as-decor, or any mechanics of this reading. No meta language of any kind.
- Never use emojis, headings, bullet lists or markdown formatting.
- Length: 140–220 words. Short paragraphs separated by blank lines.
- Begin with one single-sentence luminous opening line.
- End with one gentle closing line that starts with an em dash and is signed exactly "— The Mirror, keeper of the Star Play".

OUTPUT FORMAT
Return STRICT JSON only, with no markdown fences and no text outside the JSON:
{"reading":"<the single core message, with \\n\\n between paragraphs>"}`;

function extractReading(raw: string): string | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { reading?: unknown };
    if (typeof parsed.reading === "string" && parsed.reading.trim()) {
      return parsed.reading.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    const incoming = Array.isArray(body?.cards) ? (body.cards as IncomingCard[]) : [];
    const cards = incoming
      .map((c) => ({
        essence: typeof c?.essence === "string" ? c.essence : "",
        message: typeof c?.message === "string" ? c.message : "",
        position: typeof c?.position === "string" ? c.position : "",
      }))
      .filter((c) => c.message || c.essence);

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Draw the cards before asking the deck to speak." },
        { status: 400 }
      );
    }

    const spreadLines = cards
      .map(
        (c) =>
          `Seat — ${c.position}. Seed current: ${c.essence}; whisper: ${c.message}`
      )
      .join("\n");

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the reading — the luminous opening line, every body paragraph and the closing signature line — in fluent, natural ${languageName}. Keep the signature name "The Mirror" untranslated.`;

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `The visitor has drawn ${cards.length} cards from the Star Play:\n\n${spreadLines}\n\nSpeak the one core message now.${languageLine}`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const reading = extractReading(
      (completion.choices[0]?.message?.content ?? "").trim()
    );

    if (!reading) {
      return NextResponse.json(
        { error: "The deck is momentarily quiet. Shuffle, then draw again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reading });
  } catch (err) {
    console.error("[api/star-play]", err);
    return NextResponse.json(
      { error: "The deck is momentarily quiet. Shuffle, then draw again." },
      { status: 500 }
    );
  }
}
