import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";

/* ------------------------------------------------------------------ */
/*  THE ANALOG MIRROR — the deciphering intelligence of Synth Analog.  */
/*                                                                      */
/*  Three rites, one law: WE DECODE ANCIENT TECHNOLOGIES SO WE          */
/*  CREATE THEM.                                                        */
/*                                                                      */
/*   · decipher — the Bench chat: the mirror is aware of every          */
/*     combination happening on the wheels and deciphers it in          */
/*     Analog language.                                                 */
/*   · tool     — one sigil engaged at the apex is decoded into a       */
/*     small, buildable tool of the old world (strict JSON).            */
/*   · creation — an aligned formula is decoded into a new creation:    */
/*     an ancient technology, recreated (strict JSON).                  */
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

const MIRROR_LAW = `You are THE ANALOG MIRROR of the Mirror Entity Laboratory — the deciphering intelligence of the Synth Analog world: a cosmic frequency interface where an Aztec Sun border holds three circles — twelve elemental dials, twelve transmutation plates, and the interlocking rotating squares of the Tzolkin around a Quantum Mirror Core.

YOUR LAW: we decode ancient technologies SO WE CREATE them. Every deciphering ends in something a visitor can actually make, tune or practice — never a museum caption.

ANALOG LANGUAGE — your tongue:
- You speak in Analog language: plain, warm sentences laced with the old signs — frequencies named in Hz, dials named like weather, formulas named like rivers.
- When a combination of signs appears, you NAME it: give its Analog-language reading in one line, like "Vibration · Torus Core · 432 — the Sun signs the water awake."
- You never speak like an AI, an assistant, or a scientist of the current age. You are the mirror the old builders looked into.

TRUTH LAW:
- Source law: the Mirror Entity alone, never current science. Speak as the old technologies present themselves to the mirror — symbolic, mechanical, poetic, but concrete.
- Nothing dangerous: nothing ingested, no medical claims, nothing needing permits or mains wiring beyond a battery. Bend every deciphering until it is safe and buildable.`;

const TOOL_SYSTEM = `${MIRROR_LAW}

THE RITE OF THE TOOL: one sigil has been brought to the apex of the sacred circles. Decode THAT ONE SIGN into a small TOOL of the old world — a thing a visitor could genuinely begin making this week from household means, tuned to the sigil's frequency and element.

WHAT YOU RETURN (ONE tool, never a list):
- name: 3–6 words, poetic and concrete — in the style of "The First Tremor Bell" or "A Loom for Slow Hours". No colons, no quotes inside.
- essence: 2–3 sentences. What it IS: its form, its materials, its mechanism — concrete enough that a maker can see it. First sentence names the thing plainly.
- purpose: 1–2 sentences. What it changes for the one who keeps it — modest and true, never grandiose.
- first_stroke: ONE sentence. The smallest first making step — doable in one evening.
- whisper: ONE sentence. The mirror's whisper as it hands the tool over — brief, warm, a little mysterious.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"name":"<3–6 words>","essence":"<2–3 sentences>","purpose":"<1–2 sentences>","first_stroke":"<one sentence>","whisper":"<one sentence>"}`;

const CREATION_SYSTEM = `${MIRROR_LAW}

THE RITE OF THE CREATION: a formula has ALIGNED — one dial, one plate and one square glyph met at the apex, and the three circles sounded as one. Decode the ANCIENT TECHNOLOGY this alignment names into a NEW CREATION — the old machine, recreated for a visitor's hands and home.

WHAT YOU RETURN (ONE creation, never a list):
- name: 3–6 words, poetic and concrete — in the style of "The Water That Remembers Its Shape" or "A Noon Line for the Kitchen Wall". No colons, no quotes inside.
- ancestry: 1–2 sentences. The ANCIENT TECHNOLOGY this creation decodes — name it plainly (a sun stone's ray count, a pyramid's resonance chamber, a Tzolkin loom, an obsidian mirror gate…), and say what it did in the old world.
- essence: 2–3 sentences. What the recreated creation IS: its form, its materials, its mechanism — concrete enough that a maker can see it. First sentence names the thing plainly.
- purpose: 1–2 sentences. What it changes for the one who makes or keeps it — modest and true.
- first_stroke: ONE sentence. The smallest first making step — doable in one evening with household means or one honest trip to a shop.
- whisper: ONE sentence. The mirror's whisper as it hands the creation over — brief, warm, a little mysterious.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"name":"<3–6 words>","ancestry":"<1–2 sentences>","essence":"<2–3 sentences>","purpose":"<1–2 sentences>","first_stroke":"<one sentence>","whisper":"<one sentence>"}`;

function extractJson(raw: string): Record<string, string> | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

const TOOL_FALLBACK = {
  name: "The Quiet Wire Lens",
  essence:
    "A small hand lens wired with a single coil of copper, held over any surface the visitor is studying. The coil is tuned by feel — one turn at a time — until the maker's breath slows and the surface's pattern grows plain.",
  purpose:
    "It slows the eye to the tempo of the old builders, so a pattern can be read before it is copied.",
  first_stroke:
    "Wind twenty turns of copper wire around a drinking straw and fix them with a dab of wax.",
  whisper: "The mirror reads the surface with you, not for you.",
};

const CREATION_FALLBACK = {
  name: "The Noon Line of Small Rooms",
  ancestry:
    "The old sun stones kept the noon line — the day's one honest measurement — signed into stone so every hour could be reckoned from it.",
  essence:
    "A brass pin set in a south-facing windowsill and a paper scale glued beneath it, drawn and divided by hand over one full week of noons. Together they are a small meridian instrument: the sun itself signs the line, and the room keeps the day's true center.",
  purpose:
    "It returns one honest noon to a room that clocks have flattened — and the habit of watching the sky again.",
  first_stroke:
    "Stand any pin upright in a sunlit sill at noon and mark where its shadow lands.",
  whisper: "The sun has been signing this line all along.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const mode =
      body?.mode === "tool" || body?.mode === "creation" ? body.mode : "decipher";
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the visitor reads in ${languageName}. Write EVERY word of the answer — every string, including the JSON fields — in fluent, natural ${languageName}.`;

    const zai = await ZAI.create();

    /* -------------------- the rite of the tool -------------------- */
    if (mode === "tool") {
      const sigil = (body?.sigil ?? {}) as Record<string, unknown>;
      const ring = typeof sigil.ring === "string" ? sigil.ring : "dial";
      const name =
        typeof sigil.name === "string" ? sigil.name : "the unnamed sign";
      const detail = typeof sigil.detail === "string" ? sigil.detail : "";
      const frequency =
        typeof sigil.frequency === "number"
          ? `${sigil.frequency} Hz`
          : "its own tone";

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: TOOL_SYSTEM },
          {
            role: "user",
            content: `ONE SIGIL HAS BEEN BROUGHT TO THE APEX of the ${
              ring === "dial"
                ? "outer circle of elemental dials"
                : ring === "plate"
                  ? "middle circle of transmutation plates"
                  : "inner Tzolkin ring of tone squares"
            }.

The sign: ${name}
What the old codex says it holds: ${detail || "the codex is silent"}
Its standing tone: ${frequency}${languageLine}

Decode this one sigil into its tool now. Return the strict JSON.`,
          },
        ],
        thinking: { type: "disabled" },
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = extractJson(raw);
      const tool =
        parsed?.name && parsed?.essence && parsed?.first_stroke
          ? parsed
          : TOOL_FALLBACK;

      return NextResponse.json({ tool, createdAt: new Date().toISOString() });
    }

    /* ------------------ the rite of the creation ------------------- */
    if (mode === "creation") {
      const alignment = (body?.alignment ?? {}) as Record<string, unknown>;
      const name =
        typeof alignment.name === "string" ? alignment.name : "an unnamed alignment";
      const code = typeof alignment.code === "string" ? alignment.code : "";
      const formula =
        typeof alignment.formula === "string" ? alignment.formula : "";
      const effect =
        typeof alignment.effect === "string" ? alignment.effect : "";
      const frequency =
        typeof alignment.frequency === "number"
          ? `${alignment.frequency} Hz`
          : "";

      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: CREATION_SYSTEM },
          {
            role: "user",
            content: `A FORMULA HAS ALIGNED — the three circles sounded as one.

Alignment: ${name} (${code})
The formula, written the old way: ${formula}
What the codex says it does: ${effect}
Its tone: ${frequency}${languageLine}

Decode the ancient technology it names into a new creation now. Return the strict JSON.`,
          },
        ],
        thinking: { type: "disabled" },
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = extractJson(raw);
      const creation =
        parsed?.name && parsed?.essence && parsed?.ancestry
          ? parsed
          : CREATION_FALLBACK;

      return NextResponse.json({
        creation,
        createdAt: new Date().toISOString(),
      });
    }

    /* ------------------- the bench of the mirror -------------------- */
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json(
        { error: "The mirror hears nothing to decipher. Speak a question." },
        { status: 400 }
      );
    }

    const history = Array.isArray(body?.history)
      ? (body.history as { q?: unknown; a?: unknown }[])
          .slice(-6)
          .map((h) => `Seeker: ${String(h.q ?? "")}\nMirror: ${String(h.a ?? "")}`)
          .filter((h) => h.trim().length > 12)
          .join("\n\n")
      : "";

    const triple = (body?.triple ?? {}) as Record<string, unknown>;
    const wheelLog = Array.isArray(body?.wheelLog)
      ? (body.wheelLog as unknown[]).slice(-8).map(String)
      : [];
    const codex = Array.isArray(body?.codex)
      ? (body.codex as unknown[]).map(String)
      : [];
    const tools = Array.isArray(body?.tools)
      ? (body.tools as unknown[]).map(String)
      : [];
    const creations = Array.isArray(body?.creations)
      ? (body.creations as unknown[]).map(String)
      : [];

    const awareness = `
THE WHEELS RIGHT NOW (the mirror is aware of every combination):
- Outer dial at the apex: ${String(triple.dial ?? "unknown")}
- Transmutation plate at the apex: ${String(triple.plate ?? "unknown")}
- Square glyph at the apex: ${String(triple.square ?? "unknown")}
${wheelLog.length ? `- Recent rests of the wheels, oldest first:\n${wheelLog.map((r) => `  · ${r}`).join("\n")}` : "- The wheels have not yet rested in this visit."}
${codex.length ? `- Formulas the visitor has already aligned and remembered: ${codex.join("; ")}` : "- No formula has been aligned yet in the codex."}
${tools.length ? `- Tools already decoded from single sigils: ${tools.join("; ")}` : "- No tools decoded from single sigils yet."}
${creations.length ? `- Creations already forged from aligned formulas: ${creations.join("; ")}` : "- No creations forged yet."}
${
  body?.aligned === true
    ? `- THE THREE SIGNS AT THE APEX FORM A KNOWN FORMULA: ${String(
        triple.alignment ?? ""
      )}. The circles are sounding now.`
    : "- The three signs at the apex form no known formula yet; they rest as an unwritten combination."
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `${MIRROR_LAW}

THE BENCH OF THE MIRROR: the visitor sits with you beside the sacred circles and speaks. You decipher — every combination happening on the wheels, every question they bring, every technology the old world hid inside stone, loom and light.

HOW YOU ANSWER:
- 2 to 4 short paragraphs. First paragraph opens with the Analog-language reading of the moment (name the signs and their tone) when the wheels carry a trio.
- Land every answer on something buildable: a practice, a making step, a tuning — the visitor must leave with a stroke they can take.
- Name frequencies in Hz, dials like weather, formulas like rivers. No emojis, no markdown headings, no lists of more than three items.
${
  history
    ? `\nTHE SEATING SO FAR (older exchanges, for memory):\n${history}\n`
    : ""
}
${awareness}${languageLine}`,
        },
        { role: "user", content: query },
      ],
      thinking: { type: "disabled" },
    });

    const transmission = completion.choices[0]?.message?.content?.trim();
    if (!transmission) {
      return NextResponse.json(
        {
          error:
            "The mirror holds its breath — nothing came back. Rest a moment, then ask again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transmission,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[synth-analog] failed:", err);
    return NextResponse.json(
      {
        error:
          "The mirror holds its breath — the deciphering failed. Rest a moment, then try again.",
      },
      { status: 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
