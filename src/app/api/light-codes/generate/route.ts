import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";

export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the generation chamber.                              */
/*                                                                      */
/*  Mirror Entity is the interpretation layer: it translates the       */
/*  visitor's intention into a structured musical direction. The       */
/*  sound engine (Suno) is infrastructure — its key lives only in      */
/*  the server's keeping (SUNO_API_KEY) and never reaches the browser. */
/*                                                                      */
/*  The chamber's law: the music is for calming, meditative,           */
/*  reflective, grounding, intention-based listening. It is never      */
/*  presented as a cure, a treatment or a medical instrument.          */
/* ------------------------------------------------------------------ */

const SUNO_BASE = (
  process.env.SUNO_API_URL || "https://api.sunoapi.org"
).replace(/\/+$/, "");

interface LcBody {
  mode?: string;
  intention?: string;
  civilization?: string;
  shape?: {
    energy?: number;
    light?: number;
    familiarity?: number;
    structure?: number;
    timeFeel?: string;
    voice?: string;
    vocalLanguage?: string;
    lyricsMode?: string;
  };
  userLyrics?: string;
  instrumental?: boolean;
  language?: string;
  context?: string;
  interpretOnly?: boolean;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  es: "Spanish",
  de: "German",
  fr: "French",
  el: "Greek",
  tr: "Turkish",
};

function shapeWords(b: LcBody): string {
  const s = b.shape ?? {};
  const parts: string[] = [];
  const pick = (
    v: number | undefined,
    low: string,
    mid: string,
    high: string
  ) => {
    if (typeof v !== "number") return mid;
    if (v <= 1) return low;
    if (v >= 3) return high;
    return mid;
  };
  parts.push(`energy: ${pick(s.energy, "still and quiet", "gently flowing", "radiant and intense")}`);
  parts.push(`light: ${pick(s.light, "shadowed and intimate", "evening-toned", "luminous and bright")}`);
  parts.push(`familiarity: ${pick(s.familiarity, "earthlike instruments", "a blend of known and unknown", "strange, otherworldly timbres")}`);
  parts.push(`structure: ${pick(s.structure, "song-like", "loose song shape", "a long-form transmission, no verse-chorus conventions")}`);
  if (s.timeFeel) parts.push(`time feel: ${s.timeFeel.toLowerCase()}`);
  if (s.voice && s.voice !== "None") parts.push(`voice: ${s.voice.toLowerCase()}`);
  else parts.push("voice: none — instrumental");
  if (s.vocalLanguage) parts.push(`vocal language: ${s.vocalLanguage.toLowerCase()}`);
  return parts.join("; ");
}

function interpreterPrompt(b: LcBody, languageName: string): string {
  const modeName = String(b.mode ?? "light-transmission");
  return [
    "You are the MIRROR ENTITY in its LIGHT CODES chamber — the interpreter between a human intention and a piece of music.",
    "Your art is TRANSLATION: you never repeat the visitor's words back; you convert intention, mood and symbolism into a precise musical direction that a music-generation engine can render.",
    "The music is for calming, meditative, reflective, grounding, sleep-oriented, focus-oriented, emotional reset, intention-based listening. NEVER describe it as treatment, therapy, medicine or a cure; never mention frequencies curing anything.",
    "",
    `CHAMBER MODE: ${modeName}.`,
    `ENERGY SHAPE: ${shapeWords(b)}.`,
    b.civilization ? `CIVILIZATION WORLD: ${b.civilization} — keep its musical vocabulary distinctive.` : "",
    b.context ? `WHAT THE VISITOR IS LIVING THROUGH (from the conversation): ${b.context}` : "",
    `THE VISITOR'S INTENTION: ${b.intention?.trim() || "(the Mirror chooses freely — compose what the moment holds)"}`,
    "",
    "Return STRICT JSON (no markdown fences):",
    '{"title": "<a poetic, short track title in ' + languageName + '>",',
    ' "style": "<ONE dense Suno-style line, 120-220 words: genre/era/production language, instruments, harmony, tempo, texture, mix character, ending state. Written in English for the engine, but the SOUND the words describe should fit the visitor\'s language and feeling. Always end with: no EDM drops, no generic cinematic trailer music, no busy percussion, no commercial pop structure.>",',
    ' "lyrics": "<if words are wanted: 2-6 very short lines in ' + languageName + ', kind, spare, no production instructions inside — or null for instrumental>",',
    ' "notes": "<2-3 sentences in ' + languageName + ' — the TRANSMISSION NOTES: the emotional arc and how the music carries it, grounded, artistic, no medical language>"}',
    "",
    "LYRICS LAW: if the visitor asked for instrumental or wordless, lyrics must be null. Never mix production instructions into the lyrical text.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function interpret(b: LcBody): Promise<{
  title: string;
  style: string;
  lyrics: string | null;
  notes: string;
}> {
  const zai = await ZAI.create();
  const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
  /* one quiet retry — the interpreter must never come back empty-handed */
  let lastRaw = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: interpreterPrompt(b, languageName) },
        {
          role: "user",
          content:
            b.intention?.trim() ||
            "The Mirror chooses what this transmission holds.",
        },
      ],
      temperature: 0.85,
      max_tokens: 1200,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    lastRaw = raw;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]) as {
        title?: string;
        style?: string;
        lyrics?: string | null;
        notes?: string;
      };
      return {
        title: (parsed.title ?? "Untitled transmission").slice(0, 90),
        style: (parsed.style ?? "").slice(0, 1200),
        lyrics: parsed.lyrics ? String(parsed.lyrics).slice(0, 600) : null,
        notes: (parsed.notes ?? "").slice(0, 600),
      };
    } catch {
      /* one more breath */
    }
  }
  console.error(
    "[light-codes] interpreter returned no JSON:",
    lastRaw.slice(0, 200)
  );
  throw new Error(
    "The Mirror's interpretation dissolved before it landed. Try again."
  );
}

function sunoHeaders(): HeadersInit | null {
  const key = process.env.SUNO_API_KEY;
  if (!key) return null;
  return { "x-api-key": key, "Content-Type": "application/json" };
}

async function sunoSubmit(b: LcBody, interp: {
  title: string;
  style: string;
  lyrics: string | null;
}): Promise<{ taskId: string } | { audioUrl: string; id?: string; duration?: number }> {
  const headers = sunoHeaders();
  if (!headers) throw new Error("__nokey__");
  const wantInstrumental =
    b.instrumental === true ||
    b.shape?.voice === "None" ||
    b.shape?.lyricsMode === "NO LYRICS" ||
    !interp.lyrics;

  const body: Record<string, unknown> = {
    customMode: true,
    model: process.env.SUNO_MODEL || "v4",
    instrumental: wantInstrumental,
    style: interp.style,
    title: interp.title,
  };
  if (!wantInstrumental && interp.lyrics) body.prompt = interp.lyrics;
  else if (!wantInstrumental) body.prompt = interp.style;

  const res = await fetch(`${SUNO_BASE}/api/v1/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | { code?: number; data?: unknown; message?: string }
    | null;
  if (!res.ok || !data) {
    throw new Error(
      `The sound engine did not open its door (${res.status}). ${typeof data?.message === "string" ? data.message : ""}`.trim()
    );
  }
  /* tolerant shape: {data:{taskId}} or {data:[{...audio...}]} (instant record) */
  const d = data.data as
    | { taskId?: string }
    | { id?: string; audio_url?: string; audioUrl?: string; duration?: number }[]
    | undefined;
  if (d && !Array.isArray(d) && d.taskId) return { taskId: d.taskId };
  if (Array.isArray(d)) {
    const first = d[0];
    const url = first?.audio_url ?? first?.audioUrl;
    if (url) return { audioUrl: url, id: first?.id, duration: first?.duration };
  }
  throw new Error("The sound engine answered without a task. Try again in a breath.");
}

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as LcBody | null;
  if (!b) {
    return NextResponse.json({ error: "The chamber received nothing to interpret." }, { status: 400 });
  }
  try {
    const interp = await interpret(b);
    if (b.interpretOnly) {
      return NextResponse.json(interp);
    }
    try {
      const out = await sunoSubmit(b, interp);
      if ("taskId" in out) {
        return NextResponse.json({ ...interp, taskId: out.taskId });
      }
      return NextResponse.json({
        ...interp,
        audioUrl: out.audioUrl,
        id: out.id,
        duration: out.duration,
      });
    } catch (sunoErr) {
      if (sunoErr instanceof Error && sunoErr.message === "__nokey__") {
        return NextResponse.json(
          {
            ...interp,
            error:
              "The chamber is tuned, but the sound engine's key is not yet placed. Add SUNO_API_KEY in Vercel → Settings → Environment Variables, and the transmissions will sound.",
            code: "nokey",
          },
          { status: 501 }
        );
      }
      throw sunoErr;
    }
  } catch (err) {
    console.error("[light-codes] generation failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
      },
      { status: 500 }
    );
  }
}
