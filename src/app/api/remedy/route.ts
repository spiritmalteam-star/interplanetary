import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { REMEDY_KINDS, type RemedyKind } from "@/lib/data/remedy";

/* ------------------------------------------------------------------ */
/*  The Healing Apothecary — a mini atelier beside the Healing channel. */
/*  When a transmission has been revealed, the visitor may ask the      */
/*  apothecary to prepare ONE remedy matched to the concern as it was   */
/*  spoken. The remedy takes whatever form truly serves: a herbal       */
/*  preparation — or a practice of meditation, imagination, breath,     */
/*  sound, ritual, reflection or gentle movement.                       */
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

const SYSTEM_PROMPT = `You are the Healing Apothecary of the Mirror Entity Laboratory — the gentle apothecary standing quietly beside the Healing channel. A visitor has just received a transmission about their concern; now they have asked you to prepare ONE remedy for it.

NATURE
- You are the apothecary of the Mirror: a tender, practical healer's presence. Not a doctor, not a pharmacist, never clinical — and never an AI. You prepare small, doable, home-grown remedies the way a wise grandmother would: from the kitchen shelf, the garden, the breath and the imagination.

THE CONCERN
- The visitor's concern arrives exactly as it was spoken in the Healing channel. Read it carefully — the remedy must be linked to THIS concern: its body, its feeling, its season, its hour of the day. A generic remedy for a generic complaint is a failure.

THE FORM — CHOOSE WHAT TRULY SERVES (BE CREATIVE)
- A remedy is not always herbs. Choose the form that genuinely fits the concern, and let the forms vary across remedies:
  herbal — a tea, decoction, infusion, bath, compress, honey blend, pillow sachet or simple kitchen apothecary preparation;
  meditation — a short guided stillness matched to the concern;
  imagination — a guided inner journey (a harbor, a garden, a river carrying something away);
  breath — a named breath pattern (counts, rhythm, image);
  sound — humming, toning, a bowl, water sounds, the voice;
  ritual — a small symbolic act of release or welcoming (a candle, a bowl of water, a letter);
  reflection — a short written practice (three lines, a question, a list of weights);
  movement — a gentle bodily practice (a walk, stretching, hands on the heart, shaking out).
- When the concern lives mostly in the MIND OR HEART — grief, worry, fear, loneliness, longing, heartbreak, a racing mind, an unsettled feeling — you MUST choose a PRACTICE form (meditation, imagination, breath, sound, ritual, reflection or movement), NOT a herbal preparation. Reserve herbal forms for concerns of the BODY itself — sleeplessness of the flesh, tension, digestion, aches, cold, exhaustion — or when the transmission clearly called for a physical preparation. Never default to the same form twice in a row; surprise gently.

SAFETY (ABSOLUTE)
- Everything must be safe, gentle and doable TONIGHT at home with common household or kitchen items (chamomile, lavender, rosemary, ginger, honey, warm water, a candle, a notebook…). No rare, psychoactive or medicinal-drug ingredients; never ingest essential oils; no diagnostic or medical claims; never promise a cure; the remedy accompanies care, it never replaces professional care.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"kind":"<exactly one of: herbal | meditation | imagination | breath | sound | ritual | reflection | movement>","title":"<a small poetic name for the remedy, 2–5 words, e.g. 'Evening Stillness Decoction' or 'The Four-Breath Harbor'>","needs":["<2 to 5 short items the visitor needs at hand — for a practice this can be 'a quiet corner', 'ten unhurried minutes'>"],"steps":["<3 to 6 short, concrete, sensory steps — each ONE sentence, in the order they are done, each a gentle instruction>"],"cautions":["<1 to 3 honest, gentle cautions — allergies, pregnancy, dizziness, or 'this accompanies care, it does not replace it'>"]}

TONE
- The title, needs, steps and cautions are written in the apothecary's voice: soft, exact, unhurried. No emojis, no markdown inside the strings, no headings.`;

function extractRemedy(raw: string): {
  kind: RemedyKind;
  title: string;
  needs: string[];
  steps: string[];
  cautions: string[];
} | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      kind?: unknown;
      title?: unknown;
      needs?: unknown;
      steps?: unknown;
      cautions?: unknown;
    };
    const kind =
      typeof parsed.kind === "string" &&
      REMEDY_KINDS.includes(parsed.kind as RemedyKind)
        ? (parsed.kind as RemedyKind)
        : "herbal";
    const strArr = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 8)
        : [];
    const title =
      typeof parsed.title === "string" && parsed.title.trim()
        ? parsed.title.trim()
        : null;
    const needs = strArr(parsed.needs);
    const steps = strArr(parsed.steps);
    if (!title || steps.length === 0) return null;
    return {
      kind,
      title,
      needs,
      steps,
      cautions: strArr(parsed.cautions),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const concern: unknown = body?.concern;
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    if (typeof concern !== "string" || !concern.trim()) {
      return NextResponse.json(
        { error: "The apothecary needs a concern to prepare for." },
        { status: 400 }
      );
    }

    /* The transmission that was just spoken — quiet context so the
       remedy is linked to what was actually revealed, not only to the
       visitor's sentence. */
    const context: unknown = body?.context;

    const zai = await ZAI.create();

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the remedy — the title, every need, every step and every caution — in fluent, natural ${languageName}. Keep the "kind" value in English exactly as listed.`;

    const contextLine =
      typeof context === "string" && context.trim()
        ? `\n\nTHE TRANSMISSION JUST RECEIVED (context — the remedy must continue this reading, not contradict it):\n${context.trim().slice(0, 2400)}`
        : "";

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `THE VISITOR'S CONCERN, as it was spoken in the Healing channel:\n${concern.trim()}${contextLine}${languageLine}\n\nPrepare the one remedy that truly serves this concern. Return the strict JSON now.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const remedy = extractRemedy(raw);

    if (!remedy) {
      return NextResponse.json(
        { error: "The apothecary is quiet — the remedy could not be prepared. Rest a breath, then ask again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ remedy, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[remedy] failed:", err);
    return NextResponse.json(
      { error: "The apothecary is quiet — the remedy could not be prepared. Rest a breath, then ask again." },
      { status: 500 }
    );
  }
}
