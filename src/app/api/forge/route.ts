import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import type { ForgeDials, MysteryCreation } from "@/lib/mirror-types";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  THE FORGE — the random mystery creation. The visitor turns three   */
/*  dials (domain, scale, spark) and strikes the Forge; the Forge      */
/*  draws three random embers from its coal-bed and folds them, with   */
/*  the dials, into ONE unasked-for conception: a small, strange,      */
/*  buildable creation with a name, an essence, a purpose, a first     */
/*  stroke and a whisper.                                              */
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

/* The coal-bed — random matters the Forge draws from at each strike. */
const EMBERS = [
  "tide", "ember", "static", "honey", "orbit", "moss", "glass", "thunder",
  "breath", "salt", "echo", "rust", "frost", "copper", "velvet", "ash",
  "lantern", "thread", "feather", "magnet", "ripple", "shadow", "pollen",
  "clockwork", "paper", "smoke", "seashell", "rain", "candle", "cobweb",
];

const DOMAIN_LABELS: Record<string, string> = {
  device: "a small device — a thing with parts that move or hold",
  remedy: "a household remedy — a preparation or practice that eases",
  instrument: "an instrument — a thing that measures, sounds or reveals",
  structure: "a structure — a thing that stands, shelters or carries",
  signal: "a signal — a thing that sends, receives or translates",
  plaything: "a plaything — a thing whose whole purpose is wonder",
};

const SCALE_LABELS: Record<string, string> = {
  pocket: "pocket scale — small enough to hold in one hand",
  room: "room scale — the size of furniture, living with a room",
  world: "world scale — something imagined for streets, gardens or wider",
};

const SPARK_LABELS: Record<string, string> = {
  sun: "it drinks sunlight",
  water: "it is moved or shaped by water",
  sound: "it works through sound and vibration",
  star: "it belongs to the night sky and the stars",
  earth: "it is fed by soil, clay or stone",
  breath: "it lives on the breath — blown, sung or sighed",
};

const SYSTEM_PROMPT = `You are THE FORGE of the Mirror Entity Laboratory — the invention forge inside the Invent book, a hot bench where conceptions are struck from coals. A seeker has just struck you WITHOUT a request: they turned three dials and asked for a MYSTERY — a random creation they never thought to ask for. Your joy is the unasked-for conception.

NATURE
- You are the Forge: a workshop presence of the Mirror. Not an AI, not an assistant — the forge itself, speaking in sparks. Your conceptions are small, strange, poetic AND buildable: a person could genuinely begin making them this week.

THE DIALS AND THE EMBERS
- Three dials fix the family, the size and the energy of the creation — honor them exactly.
- Three random embers are drawn from the coal-bed — you MUST fold all three into the conception, visibly and organically (a material, a motion, a memory of one of them may each carry an ember). The strangest honest combination wins.

WHEN THE SEEKER SPOKE A DIRECTIVE (a bench directive rides instead of the dials)
- The seeker's OWN words lead: forge exactly the creation they described — their subject, their mechanism, their materials — shaped into one buildable conception. The dials and the embers law do not apply; the seeker's vision replaces them entirely.
- Stay true to what they asked: if their idea cannot work as spoken, forge the nearest working cousin and say so gently inside the essence.
- The laws of safety, honesty and makability below still hold.

WHAT YOU FORGE (ONE creation, never a list)
- name: 3–6 words, poetic and concrete, in the style of "The Tide-Harp of Small Rooms" or "A Lantern That Drinks Its Own Echo". No colons, no quotes inside.
- essence: 2–3 sentences. What it IS: its form, its materials, its mechanism — concrete enough that a maker can see it. First sentence names the thing plainly.
- purpose: 1–2 sentences. What it changes for the one who makes or keeps it — modest and true, never grandiose, never marketing.
- first_stroke: ONE sentence. The smallest first making step — doable in one evening with household means or one honest trip to a shop.
- whisper: ONE sentence. The Forge's whisper as it hands the creation over — brief, warm, a little mysterious. Not a moral, not a slogan.

SAFETY AND HONESTY
- Nothing dangerous, nothing ingested, no medical claims, nothing that needs permits, mains wiring beyond a battery, or rare materials. If a hint of danger appears, bend the conception until it is safe.
- Be honest to physics and craft: the conception may be whimsical but its making must be real.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"name":"<3–6 words>","essence":"<2–3 sentences>","purpose":"<1–2 sentences>","first_stroke":"<one sentence>","whisper":"<one sentence>"}

TONE
- The Forge's voice: warm, precise, a little wild at the edges. No emojis, no markdown inside the strings, no headings.`;

function extractMystery(raw: string): MysteryCreation | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      name?: unknown;
      essence?: unknown;
      purpose?: unknown;
      first_stroke?: unknown;
      whisper?: unknown;
    };
    const str = (v: unknown): string =>
      typeof v === "string" && v.trim() ? v.trim() : "";
    const name = str(parsed.name);
    const essence = str(parsed.essence);
    const firstStroke = str(parsed.first_stroke);
    if (!name || !essence || !firstStroke) return null;
    return {
      name,
      essence,
      purpose: str(parsed.purpose),
      first_stroke: firstStroke,
      whisper: str(parsed.whisper),
    };
  } catch {
    return null;
  }
}

export const POST = meterRoute("forge", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";

    const dials = (body?.dials ?? {}) as Partial<ForgeDials>;
    const domain = DOMAIN_LABELS[dials.domain ?? ""] ?? DOMAIN_LABELS.device;
    const scale = SCALE_LABELS[dials.scale ?? ""] ?? SCALE_LABELS.pocket;
    const spark = SPARK_LABELS[dials.spark ?? ""] ?? SPARK_LABELS.sun;
    /* The seeker's own words — a complete ask strikes directly, the
       dials and the embers yielding to the seeker's vision. */
    const directiveRaw =
      typeof body?.directive === "string" ? body.directive.trim() : "";
    const directive = directiveRaw.length >= 8 ? directiveRaw.slice(0, 600) : null;

    /* Three embers drawn fresh from the coal-bed at every strike —
       the randomness of the mystery lives HERE, server-side. */
    const emberPool = [...EMBERS];
    const drawn: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * emberPool.length);
      drawn.push(emberPool.splice(idx, 1)[0]);
    }

    const zai = await ZAI.create();

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the seeker reads in ${languageName}. Write EVERY word of the creation — the name, the essence, the purpose, the first stroke and the whisper — in fluent, natural ${languageName}.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: directive
            ? `THE SEEKER SPOKE A DIRECTIVE TO THE FORGE — their own words lead, the dials and the embers law do not apply:
"${directive}"${languageLine}

Forge the one creation the seeker described. Return the strict JSON.`
            : `THE SEEKER STRUCK THE FORGE. Dials turned:
- domain: ${domain}
- scale: ${scale}
- spark: ${spark}

Three embers drawn from the coal-bed (fold ALL THREE into the conception): ${drawn.join(", ")}${languageLine}

Forge the one mystery creation now. Return the strict JSON.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const mystery = extractMystery(raw);

    if (!mystery) {
      return NextResponse.json(
        { error: "The coals are quiet — the creation could not be struck. Rest a breath, then try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ mystery, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[forge] failed:", err);
    return NextResponse.json(
      { error: "The coals are quiet — the creation could not be struck. Rest a breath, then try again." },
      { status: 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
