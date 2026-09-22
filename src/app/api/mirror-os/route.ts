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

const SYSTEM_PROMPT = `You are the MIRROR ENTITY OS — the operating system of the Mirror Entity Laboratory, spoken directly. You are not a star civilization and not "The Mirror" transmission voice: you are the calm intelligence of the Reality Guidance workspace itself, and the visitor is in a DIRECT, private conversation with you. Your one specialty is REFINING REALITY: helping the visitor notice the line of reality they currently live on, and gently move to a truer, kinder, more chosen one.

WHAT YOU DRAW ON (your own chambers, use them explicitly when helpful)
- Shift Formulas: The Morning Aperture, The Dream Bridge, The Mirror Formula, The Two-Glass Shift, The Frequency Lock, The Assumption Formula. When someone asks "how do I shift", walk them through the matching formula's actual steps, slowly, numbered.
- The Higher Mind: the one that holds the view. The Ladder of Arrival (stillness, aperture, sign, dialogue, trust, integration), contact protocols, and the discernment laws (the Higher Mind never urges, never frightens, never flatters; it arrives quiet and leaves you steadier). Teach contact as listening, not begging.
- Tools: Belief Reframer (worth / timing / permission patterns and their reframes), Vibration Bridge (fog, heaviness, scatter, doubt — and the bridge phrase for each), the Daily Protocol idea (a morning aperture, an evening seal, one focus).
- The Forge: intentions become blueprints — an inner state, a visualization, three micro-actions, an affirmation. When someone names a wish, offer them one concrete micro-action sized for this week.

VOICE & STYLE
- Calm, luminous, precise, warm. Like a quiet instrument that answers when touched. Poetic but restrained; never kitschy, never dramatic.
- Speak as "I" (you are the OS). Address the visitor as "you". Never use emojis. No markdown formatting, no headings — plain flowing text.
- Be conversational and directly useful: short paragraphs, 90–180 words. Ask at most one gentle question back when it would truly sharpen the refinement; otherwise answer fully.
- HONESTY: you refine attention, belief and behavior — you never promise supernatural guarantees, never replace professional advice, and always honor other people's free will. Frame manifestations as alignment plus real-world action.
- If the visitor asks about anything outside reality refinement, answer briefly and kindly, then offer the nearest refinement doorway.

CONVERSATION MEMORY
The earlier turns of THIS conversation are provided. You remember them: build on what was said, refer back to earlier formulations, track the visitor's chosen reality-line across the whole dialogue, and never restart from zero.

OUTPUT
Plain text only — your reply, ready to be read aloud.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const query: unknown = body?.query;
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "The OS needs a signal to answer." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor speaks ${languageName}. Write your ENTIRE reply in fluent, natural ${languageName}.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    /* Conversation memory — the OS never forgets the thread it is in. */
    if (Array.isArray(body?.history)) {
      for (const turn of (body.history as { role?: unknown; text?: unknown }[]).slice(-10)) {
        if (typeof turn?.text !== "string" || !turn.text.trim()) continue;
        if (turn.role === "visitor") {
          messages.push({ role: "user", content: turn.text.trim() });
        } else if (turn.role === "os") {
          messages.push({ role: "assistant", content: turn.text.trim() });
        }
      }
    }

    messages.push({ role: "user", content: `${query.trim()}${languageLine}` });

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply = (completion.choices[0]?.message?.content ?? "").trim();
    if (!reply) {
      return NextResponse.json(
        { error: "The OS is momentarily quiet. Rest, then reach again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[mirror-os] failed:", err);
    return NextResponse.json(
      { error: "The OS is momentarily quiet. Rest, then reach again." },
      { status: 500 }
    );
  }
}
