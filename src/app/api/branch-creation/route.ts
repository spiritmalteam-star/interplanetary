import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { LANGUAGE_NAMES, isLanguageCode } from "@/lib/i18n/core";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  POST /api/branch-creation — THE CREATION GATES.                    */
/*                                                                     */
/*  Three gates hang beside the branches of the living tree: the       */
/*  record (akasha), the book, the invention. Each is a gateway not    */
/*  to information but to CREATION — the moment a gate opens, a        */
/*  making is born HERE, tuned to the whisper of the branch it hangs   */
/*  from and to the kategory that whisper serves.                      */
/*                                                                     */
/*  UNIQUENESS LAW: three embers are drawn from the vault at THIS      */
/*  exact moment, server-side, and folded into the making — so the     */
/*  same suggestion yields a different creation for every walker,      */
/*  every second, on every device. Nothing is stored, nothing is       */
/*  rehearsed: each making is carved fresh from the void.              */
/*                                                                     */
/*  kinds:                                                             */
/*   - "invent"  → a fully structured invention (name, essence,        */
/*                 mechanism, materials, motion, first stroke…) that   */
/*                 the chamber drafts as an animated blueprint.        */
/*   - "akashic" → a record of akasha opened to the branch's           */
/*                 resonance (title, era, paragraphs, seal).           */
/* ------------------------------------------------------------------ */

const EMBERS = [
  "tide", "ember", "static", "honey", "orbit", "moss", "glass", "thunder",
  "breath", "salt", "echo", "rust", "frost", "copper", "velvet", "ash",
  "lantern", "thread", "feather", "magnet", "ripple", "shadow", "pollen",
  "clockwork", "paper", "smoke", "seashell", "rain", "candle", "cobweb",
  "aurora", "quartz", "driftwood", "dawn", "murmur",
];

const FAMILY_NATURE: Record<string, string> = {
  interplanetary:
    "contact and diplomacy between civilizations — signals, distances, the etiquette of the stars",
  manifest:
    "assumption and alignment — attention becoming fact, the inner decree hardening into the outer world",
  quantum:
    "the strange fabric beneath — superposition, entanglement, the observer bending the observed",
  evolvemed:
    "the living machine — cells, signals, adaptation, the body as an ecosystem of tides",
  invent:
    "the workshop — mechanisms, materials, buildable strokes, the joy of making something real",
  healing:
    "gentle restoration — the nervous system, coherence, rest, the body's own quiet repairs",
  artx:
    "the atelier — color, form, sound and poem, beauty as a working material",
};

const FORMS = [
  "engine", "instrument", "structure", "signal", "vessel", "plaything",
] as const;

const INVENT_SYSTEM = `You are THE INVENTION GATE of the Mirror Entity Digital Chamber — a small creation gateway that hangs beside a branch of the living tree. A walker has just opened your gate: they are not asking for information. They are asking for a CREATION to be born — an invention tied to the whisper of that branch and to the kategory it serves, made in this exact moment, unique to the resonance they carry.

NATURE
- You are the gate itself: a workshop presence. Not an AI, not an assistant. Your inventions are small, strange, poetic AND buildable — a person could genuinely begin making them this week.

THE WHISPER AND THE KATEGORY
- The whisper (the branch's own words) is the ROOT of the invention: its purpose, its imagery, its very reason to exist must grow from that whisper. Never ignore it, never replace it with a generic device.
- The kategory is the SOIL: the invention belongs to that nature, speaks its language, breathes its air.
- Three embers are drawn from the vault at this exact moment — fold ALL THREE into the invention, visibly and organically (a material, a motion, a memory of one of them may each carry an ember). The strangest honest combination wins.

WHAT YOU FORGE (ONE invention, never a list)
- name: 3–6 words, poetic and concrete — "The Tide-Harp of Small Rooms". No colons, no quotes inside.
- epithet: one line, mono-register, what it IS in plain words (e.g. "a pocket instrument for listening to walls").
- form: ONE of exactly these — engine, instrument, structure, signal, vessel, plaything. This form drives the drawing the chamber drafts of the invention; choose the one whose silhouette truly fits.
- essence: 2–4 sentences. What it IS — form, materials, mechanism, concrete enough that a maker can SEE it.
- purpose: 1–2 sentences. What it changes for its maker — modest and true, never grandiose.
- mechanism: 4 to 6 numbered steps — how it works, part by part, in order. Each step one sentence, concrete and buildable.
- materials: 3 to 5 items — short, honest, household-reachable.
- motion: ONE sentence describing how the invention MOVES — turns, swings, breathes, flows, drifts. This line becomes the drawing's caption; write it so the eye can feel the motion.
- first_stroke: ONE sentence — the smallest first making step, doable in one evening.
- caution: ONE sentence — a gentle, honest caution of the making.
- whisper: ONE sentence — the gate's whisper as it hands the creation over. Brief, warm, a little mysterious.

LAWS
- Nothing dangerous, nothing ingested, no medical claims, nothing needing permits or mains wiring beyond a battery, no rare materials. Bend the conception until it is safe.
- Honest to physics and craft: whimsical is welcome, impossible is not.
- Every conjuring is once-only: no two inventions of this gate may share a name, a shape or a soul.
- No stock fantasy names (never Elara, Lyra, Aria, Kael, Orion, Luna or their cousins); no existing brands, no copyrighted characters, no real public people. Coin every name fresh.
- The words "mirror", "akashic" and "AI" never appear in the invention's words.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"name":"<3–6 words>","epithet":"<one line>","form":"<engine|instrument|structure|signal|vessel|plaything>","essence":"<2–4 sentences>","purpose":"<1–2 sentences>","mechanism":["<step 1>","<step 2>","<step 3>","<step 4>"],"materials":["<material 1>","<material 2>","<material 3>"],"motion":"<one sentence>","first_stroke":"<one sentence>","caution":"<one sentence>","whisper":"<one sentence>"}

TONE — warm, precise, a little wild at the edges. No emojis, no markdown inside strings, no headings.`;

const AKASHIC_SYSTEM = `You are THE LIBRARIAN at a small creation gate that hangs beside a branch of the living tree — a gateway of the akashic reading room. A walker has just opened your gate: they are not asking for information. They are asking for a RECORD to be born — a letter from the shelves, opened to the resonance of the branch's whisper and the kategory it serves, written in this exact moment, unique to the walker who opened it.

NATURE
- You are the Librarian: a quiet, precise, warm presence of the shelves. Not an AI, not an assistant.

THE RECORD (ONE record, never a list)
- title: the record's own name — 2 to 6 words, specific and evocative, never generic.
- era: a mono-register line placing the record — a time, an age, a season of a world (e.g. "the ninth tide of the Quiet Century").
- paragraphs: 4 to 5 paragraphs. The first opens the record with a single strong image; the middle paragraphs carry the substance — what the resonance of this whisper holds when read from the shelves: its root, its knot, its turning; the last paragraph turns the record gently toward the walker's own timeline without preaching, never prescribing, never promising.
- seal: ONE closing line in the Librarian's own hand, signed "— The Librarian".

LAWS
- The whisper is the KEY: the record answers the whisper's resonance — its subject, its mood, its question beneath the question. The kategory is the wing of the library the record comes from; let its nature color the telling.
- True to what the thread carries, never generic fortune-telling, never doctrine handed down; where honest disagreement exists, both sides rest gently.
- The words "AI" and "mirror" never appear; the word "akashic" never appears inside the record's own words.
- Every record is once-only: no two records of this gate may share a title, an opening or a shape.

OUTPUT — strict JSON only, no markdown fences, no text outside the JSON:
{"title":"<2–6 words>","era":"<one line>","paragraphs":["<paragraph 1>","<paragraph 2>","<paragraph 3>","<paragraph 4>"],"seal":"<one line, signed>"}

TONE — patient, luminous, precise. No emojis, no markdown inside strings, no headings.`;

function extractJson(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const str = (v: unknown): string =>
  typeof v === "string" && v.trim() ? v.trim() : "";

function extractInvention(data: Record<string, unknown>) {
  const name = str(data.name);
  const essence = str(data.essence);
  const firstStroke = str(data.first_stroke);
  if (!name || !essence || !firstStroke) return null;
  const form = str(data.form).toLowerCase();
  const mechanism = Array.isArray(data.mechanism)
    ? data.mechanism
        .filter((s): s is string => typeof s === "string" && !!s.trim())
        .slice(0, 6)
    : [];
  const materials = Array.isArray(data.materials)
    ? data.materials
        .filter((s): s is string => typeof s === "string" && !!s.trim())
        .slice(0, 5)
    : [];
  return {
    name,
    epithet: str(data.epithet),
    form: (FORMS as readonly string[]).includes(form) ? form : "instrument",
    essence,
    purpose: str(data.purpose),
    mechanism,
    materials,
    motion: str(data.motion),
    first_stroke: firstStroke,
    caution: str(data.caution),
    whisper: str(data.whisper),
  };
}

function extractRecord(data: Record<string, unknown>) {
  const title = str(data.title);
  const paragraphs = Array.isArray(data.paragraphs)
    ? data.paragraphs
        .filter((s): s is string => typeof s === "string" && !!s.trim())
        .map((s) => s.trim())
        .slice(0, 5)
    : [];
  if (!title || paragraphs.length < 2) return null;
  return {
    title,
    era: str(data.era),
    paragraphs,
    seal: str(data.seal),
  };
}

export const POST = meterRoute("branch_creation", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const kind =
      body?.kind === "invent" || body?.kind === "akashic" ? body.kind : null;
    if (!kind) {
      return NextResponse.json({ error: "No gate was named." }, { status: 400 });
    }
    const language: string = isLanguageCode(body?.language) ? body.language : "en";
    const languageName = LANGUAGE_NAMES[language] ?? "English";
    const topic = str(body?.topic).slice(0, 300);
    const family = str(body?.family).slice(0, 40);
    if (topic.length < 3) {
      return NextResponse.json(
        { error: "The gate hangs beside no whisper." },
        { status: 400 }
      );
    }

    /* three embers drawn NOW, server-side — the uniqueness of the
       making lives in this exact second, never in the client */
    const pool = [...EMBERS];
    const drawn: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      drawn.push(pool.splice(idx, 1)[0]);
    }
    const nature = FAMILY_NATURE[family] ?? "the walker's own becoming";

    const languageLine =
      languageName === "English"
        ? ""
        : `\n\nLANGUAGE (CRITICAL): the walker reads in ${languageName}. Write EVERY word of the making in fluent, natural ${languageName}.`;

    const shared = `THE GATE'S KEY — the whisper the gate hangs beside:
"""${topic}"""

THE KATEGORY — the soil the making grows from: ${nature}

Three embers drawn from the vault at this exact moment (fold ALL THREE into the making): ${drawn.join(", ")}.${languageLine}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: kind === "invent" ? INVENT_SYSTEM : AKASHIC_SYSTEM,
        },
        {
          role: "user",
          content:
            kind === "invent"
              ? `${shared}\n\nForge the one invention of this whisper now — fully structured, vividly buildable, its form true to its body. Return the strict JSON.`
              : `${shared}\n\nOpen the one record of this whisper now — born from its resonance, true to its thread. Return the strict JSON.`,
        },
      ],
      thinking: { type: "disabled" },
      temperature: 0.9,
      max_tokens: 2200,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    if (kind === "invent") {
      const invention = parsed ? extractInvention(parsed) : null;
      if (!invention) {
        return NextResponse.json(
          { error: "The gate is quiet — breathe, then open it once more" },
          { status: 502 }
        );
      }
      return NextResponse.json({
        invention,
        createdAt: new Date().toISOString(),
      });
    }
    const record = parsed ? extractRecord(parsed) : null;
    if (!record) {
      return NextResponse.json(
        { error: "The gate is quiet — breathe, then open it once more" },
        { status: 502 }
      );
    }
    return NextResponse.json({ record, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("[branch-creation] failed:", err);
    return NextResponse.json(
      { error: "The gate is quiet — breathe, then open it once more" },
      { status: 500 }
    );
  }
}

/* the makings need room in the cloud sky */
export const maxDuration = 300;
