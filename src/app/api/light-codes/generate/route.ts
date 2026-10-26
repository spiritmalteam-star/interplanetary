import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute } from "@/lib/server/meter";
import {
  describeImage,
  documentBlock,
  imageBlock,
  parseAttachments,
} from "@/lib/server/attachments";

export const maxDuration = 300;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — the generation chamber.                              */
/*                                                                      */
/*  Mirror Entity is the interpretation layer: it translates the       */
/*  visitor's intention into a structured musical direction. The       */
/*  sound engine is Google DeepMind's Lyria, reached through the       */
/*  official Gemini API's Interactions endpoint — its key lives only   */
/*  in the server's keeping (GEMINI_API_KEY) and never reaches the     */
/*  browser. The engine's own name stays behind the veil; the Mirror   */
/*  is the visible voice.                                              */
/*                                                                      */
/*  Two models, two doors:                                             */
/*    lyria-3-clip-preview — the 30-second preview (quick listening)   */
/*    lyria-3.5             — the full song (verses, chorus, bridge)   */
/*                                                                      */
/*  The chamber's law: the music is for calming, meditative,           */
/*  reflective, grounding, intention-based listening. It is never      */
/*  presented as a cure, a treatment or a medical instrument.          */
/*                                                                      */
/*  THE HONESTY LAW: success is never claimed until valid, playable    */
/*  audio has actually been received. Every failure of the sky —       */
/*  missing key, exhausted quota, a safety refusal, an unsupported     */
/*  form — is spoken plainly, in the chamber's own voice.              */
/* ------------------------------------------------------------------ */

const LYRIA_BASE = (
  process.env.LYRIA_API_BASE || "https://generativelanguage.googleapis.com"
).replace(/\/+$/, "");
const LYRIA_FULL_MODEL = process.env.LYRIA_MODEL || "lyria-3.5";
const LYRIA_CLIP_MODEL = process.env.LYRIA_CLIP_MODEL || "lyria-3-clip-preview";
/** The heaviest payload the sky can carry home (Vercel's response door). */
const MAX_AUDIO_B64 = 4_300_000;

interface LcBody {
  mode?: string;
  intention?: string;
  civilization?: string;
  length?: "preview" | "full";
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
  /** compose phase — the Mirror's own direction, already written */
  compose?: boolean;
  interp?: {
    title?: string;
    style?: string;
    lyrics?: string | null;
    notes?: string;
  };
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

/* ------------------------- the guards ------------------------- */

/** One weave at a time per keeper — the chamber holds a single loom. */
const inFlight = new Map<string, number>();
/** The same ask, twice within a breath, is not woven twice. */
const recentAsks = new Map<string, number>();

function askFingerprint(b: LcBody, interpKey: string): string {
  return JSON.stringify([
    b.mode,
    b.intention?.trim().toLowerCase(),
    b.length ?? "preview",
    b.language,
    b.civilization,
    b.shape,
    b.userLyrics?.trim().toLowerCase(),
    interpKey,
  ]);
}

/* ------------------------- the Mirror's voice ------------------------- */

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
    "Your art is TRANSLATION: you never repeat the visitor's words back; you convert intention, mood and symbolism into a precise musical direction that a music-generation model (Google DeepMind Lyria, through the Gemini API) can render.",
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
    ' "style": "<ONE dense musical production brief, 120-220 words, written FOR A MUSIC MODEL: genre/era/production language, instruments, harmony, tempo (a BPM range), texture, mix character, and the arrangement arc — how it opens, how it builds, where it rests, how it ends. Written in English for the engine, but the SOUND the words describe should fit the visitor\'s language and feeling. Always end with: no EDM drops, no generic cinematic trailer music, no busy percussion, no commercial pop structure.>",',
    ' "lyrics": "<if words are wanted: short, kind, spare lines in ' + languageName + ', organized with section tags [Verse], [Chorus], [Bridge] — the chorus returns, one bridge rests mid-song. No production instructions inside the lyric lines. Or null for instrumental>",',
    ' "notes": "<2-3 sentences in ' + languageName + ' — the TRANSMISSION NOTES: the emotional arc and how the music carries it, grounded, artistic, no medical language>"}',
    "",
    "LYRICS LAW: if the visitor asked for instrumental or wordless, lyrics must be null. Never mix production instructions into the lyrical text.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function interpret(
  b: LcBody,
  attachmentLines = ""
): Promise<{
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
            (b.intention?.trim() ||
              "The Mirror chooses what this transmission holds.") +
            attachmentLines,
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
        style: (parsed.style ?? "").slice(0, 1400),
        lyrics: parsed.lyrics ? String(parsed.lyrics).slice(0, 900) : null,
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

/* ------------------------- the Lyria door ------------------------- */

function wantVocals(b: LcBody, lyrics: string | null): boolean {
  return !(
    b.instrumental === true ||
    b.shape?.voice === "None" ||
    b.shape?.lyricsMode === "NO LYRICS" ||
    b.shape?.vocalLanguage === "Wordless" ||
    !lyrics
  );
}

function structureWords(b: LcBody): string {
  const n = b.shape?.structure;
  if (typeof n === "number" && n >= 3)
    return "A long-form flowing transmission — no verse-chorus conventions; let it move like one continuous journey.";
  if (typeof n === "number" && n <= 1)
    return "Clear song form: verses, a chorus that returns, and one bridge resting mid-song.";
  return "A loose song shape — the chorus may return, the form may breathe freely.";
}

/** The 30-second preview's input — compact, one paragraph. */
function clipInput(b: LcBody, interp: LcBody["interp"], languageName: string): string {
  const style = (interp?.style ?? "").trim();
  /* condense: the clip model wants a short, vivid direction */
  const condensed =
    style.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 480) ||
    "A calm, meditative, otherworldly ambient piece.";
  const lyrics = b.userLyrics?.trim() || interp?.lyrics || null;
  if (wantVocals(b, lyrics)) {
    const firstLines = (lyrics ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("["))
      .slice(0, 2)
      .join(" / ");
    const voice = b.shape?.voice && b.shape.voice !== "None" ? b.shape.voice.toLowerCase() : "gentle";
    const lang =
      b.shape?.vocalLanguage === "My language" ? ` sung in ${languageName}` : "";
    return `A 30-second piece: ${condensed} Featuring ${voice} vocals${lang}: "${firstLines}".`;
  }
  return `A 30-second instrumental piece — no vocals: ${condensed}`;
}

/** The full song's input — the Mirror's complete production brief. */
function songInput(b: LcBody, interp: LcBody["interp"], languageName: string): string {
  const style = (interp?.style ?? "").trim();
  const lyrics = b.userLyrics?.trim() || interp?.lyrics || null;
  const parts: string[] = [];
  parts.push(`Musical production brief — "${interp?.title ?? "a transmission"}".`);
  if (style) parts.push(style);
  parts.push(structureWords(b));
  if (b.shape?.timeFeel) parts.push(`Time feels ${b.shape.timeFeel.toLowerCase()}.`);
  if (wantVocals(b, lyrics)) {
    const voice = b.shape?.voice && b.shape.voice !== "None" ? b.shape.voice.toLowerCase() : "gentle";
    const lang =
      b.shape?.vocalLanguage === "My language" ? `sung in ${languageName}` : "";
    parts.push(`Vocals: ${voice}${lang ? `, ${lang}` : ""}.`);
    if (lyrics) parts.push(`LYRICS (set them to the music):\n${lyrics}`);
  } else {
    parts.push("Instrumental — no vocals, no lyrics.");
  }
  parts.push("Length: about two minutes.");
  return parts.join("\n\n");
}

type LyriaBlock = { type?: string; text?: string; data?: string; mime_type?: string };

function buildLyriaRequestBody(
  b: LcBody,
  interp: LcBody["interp"],
  imageDataUrl: string | null,
  languageName: string
): { model: string; input: string | LyriaBlock[] } {
  const isFull = b.length === "full";
  const model = isFull ? LYRIA_FULL_MODEL : LYRIA_CLIP_MODEL;
  const text = isFull
    ? songInput(b, interp, languageName)
    : clipInput(b, interp, languageName);

  if (imageDataUrl) {
    const m = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) {
      return {
        model,
        input: [
          { type: "text", text },
          { type: "image", mime_type: m[1], data: m[2] },
        ],
      };
    }
  }
  return { model, input: text };
}

interface LyriaFailure extends Error {
  status?: number;
  code?: string;
}

function mapLyriaError(resStatus: number, message: string, apiStatus: string): LyriaFailure {
  const m = new Error("") as LyriaFailure;
  m.status = resStatus;
  if (resStatus === 429 || apiStatus === "RESOURCE_EXHAUSTED") {
    m.message =
      "The chamber's sky allowance rests for now — today's quota for new sounds is spent. Breathe, and return in a while.";
    m.code = "quota";
  } else if (resStatus === 403 || resStatus === 401) {
    m.message =
      "The chamber's key was not given passage to the sound engine. The keeper should check GEMINI_API_KEY and its permissions.";
    m.code = "denied";
  } else if (/safety|blocked|prohibited/i.test(message)) {
    m.message =
      "The engine bowed out of this intention. The Mirror will reshape it gently — try different words.";
    m.code = "safety";
  } else if (/unsupported|not supported|invalid/i.test(message)) {
    m.message =
      "The engine cannot weave this form yet. The Mirror will try another shape.";
    m.code = "unsupported";
  } else {
    m.message = `The sound engine did not open its door (${resStatus}). ${
      message.slice(0, 160) || "Try again in a breath."
    }`;
    m.code = "engine";
  }
  return m;
}

async function lyriaWeave(
  body: { model: string; input: string | LyriaBlock[] },
  key: string,
  timeoutMs: number
): Promise<{ audioB64: string; texts: string[]; mime: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${LYRIA_BASE}/v1beta/interactions`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (controller.signal.aborted) {
      throw new Error(
        "The weave took longer than the chamber can hold. Try the 30-second preview first."
      );
    }
    throw new Error("The chamber could not reach the sound engine. Try again in a breath.");
  }
  clearTimeout(timer);

  const payload = (await res.json().catch(() => null)) as
    | {
        steps?: { type?: string; content?: LyriaBlock[] }[];
        output_audio?: { data?: string; mime_type?: string };
        output_text?: string;
        error?: { code?: number; message?: string; status?: string };
      }
    | null;

  if (!res.ok || payload?.error) {
    const e = payload?.error;
    throw mapLyriaError(
      res.status,
      String(e?.message ?? ""),
      String(e?.status ?? "")
    );
  }

  /* THE RESPONSE LAW: walk the steps and their content blocks without
     assuming any order — text blocks (lyrics, structure) and audio
     blocks arrive as the engine lays them down. The last audio block
     heard is the song. */
  let audioB64: string | null = null;
  let mime = "audio/mpeg";
  const texts: string[] = [];
  for (const step of Array.isArray(payload?.steps) ? payload!.steps! : []) {
    if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
    for (const block of step.content) {
      if (block?.type === "audio" && typeof block.data === "string" && block.data) {
        audioB64 = block.data;
        if (typeof block.mime_type === "string" && block.mime_type) mime = block.mime_type;
      } else if (block?.type === "text" && typeof block.text === "string" && block.text) {
        texts.push(block.text);
      }
    }
  }
  /* the SDK's convenience properties, should the steps schema rest */
  if (!audioB64 && typeof payload?.output_audio?.data === "string") {
    audioB64 = payload.output_audio.data;
    if (payload.output_audio.mime_type) mime = payload.output_audio.mime_type;
  }
  if (texts.length === 0 && typeof payload?.output_text === "string" && payload.output_text) {
    texts.push(payload.output_text);
  }

  if (!audioB64) {
    throw new Error(
      "The engine answered without a sound. Try again in a breath."
    );
  }
  if (audioB64.length > MAX_AUDIO_B64) {
    throw new Error(
      "The song was woven, but it is too heavy for the sky to carry home. Ask the Mirror for a shorter piece."
    );
  }
  return { audioB64, texts, mime };
}

/* ------------------------- the two doors ------------------------- */

export const POST = meterRoute("light_codes", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  const b = (await req.json().catch(() => null)) as LcBody | null;
  if (!b) {
    return NextResponse.json({ error: "The chamber received nothing to interpret." }, { status: 400 });
  }
  try {
    /* ---------- the second door: the weave (the brief is already written) ---------- */
    if (b.compose) {
      /* the visitor's image rides straight into the engine's input —
         no second reading, the Mirror already saw it in the first door */
      const { imageDataUrl } = parseAttachments(b);
      const passed =
        b.interp && (b.interp.title || b.interp.style)
          ? {
              title: String(b.interp.title ?? "Untitled transmission").slice(0, 90),
              style: String(b.interp.style ?? "").slice(0, 1400),
              lyrics: b.interp.lyrics ? String(b.interp.lyrics).slice(0, 900) : null,
              notes: b.interp.notes ? String(b.interp.notes).slice(0, 600) : "",
            }
          : await interpret(b);

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return NextResponse.json(
          {
            ...passed,
            error:
              "The chamber is tuned, but the sound engine's key is not yet placed. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, and the transmissions will sound.",
            code: "nokey",
          },
          { status: 501 }
        );
      }

      /* the guards — one loom, no double-weaving */
      const ctx = (req as unknown as { meter?: { visitor: { user: { id: string } } } }).meter;
      const keeperId = ctx?.visitor?.user?.id ?? "anon";
      const startedAt = inFlight.get(keeperId);
      if (startedAt && Date.now() - startedAt < 5.5 * 60 * 1000) {
        return NextResponse.json(
          {
            ...passed,
            error:
              "The chamber is already weaving a transmission for you — one sound at a time. Let the first one land.",
            code: "busy",
          },
          { status: 429 }
        );
      }
      const fingerprint = askFingerprint(b, (b.interp?.title ?? "") + (b.interp?.style ?? ""));
      const lastAsk = recentAsks.get(keeperId);
      if (
        lastAsk !== undefined &&
        lastAsk === hashStr(fingerprint) &&
        Date.now() - (recentAskTimes.get(keeperId) ?? 0) < 45_000
      ) {
        return NextResponse.json(
          {
            ...passed,
            error:
              "The same transmission was just asked of the chamber — the Mirror will not weave it twice in one breath.",
            code: "duplicate",
          },
          { status: 429 }
        );
      }

      inFlight.set(keeperId, Date.now());
      recentAsks.set(keeperId, hashStr(fingerprint));
      recentAskTimes.set(keeperId, Date.now());
      try {
        const languageName = LANG_NAMES[b.language ?? "en"] ?? "English";
        const body = buildLyriaRequestBody(b, passed, imageDataUrl, languageName);
        const weave = await lyriaWeave(
          body,
          key,
          b.length === "full" ? 280_000 : 120_000
        );
        return NextResponse.json({
          ...passed,
          structure: weave.texts.join("\n\n").slice(0, 2000) || undefined,
          audio: weave.audioB64,
          mimeType: weave.mime,
          engine: body.model,
          length: b.length ?? "preview",
        });
      } finally {
        inFlight.delete(keeperId);
      }
    }

    /* ---------- the first door: the Mirror's written direction ---------- */
    /* Attachments — one image seen with the vision field, up to three
       extracted documents — folded into what the interpreter reads. */
    const { imageDataUrl, documents } = parseAttachments(b);
    const attachmentBlocks: string[] = [];
    if (imageDataUrl) {
      const zai = await ZAI.create();
      const block = imageBlock(await describeImage(zai, imageDataUrl));
      if (block) attachmentBlocks.push(block);
    }
    const docBlock = documentBlock(documents);
    if (docBlock) attachmentBlocks.push(docBlock);
    const attachmentLines =
      attachmentBlocks.length > 0
        ? `\n\n${attachmentBlocks.join("\n\n")}`
        : "";

    const interp = await interpret(b, attachmentLines);
    if (b.interpretOnly) {
      return NextResponse.json(interp);
    }
    return NextResponse.json({ ...interp, needCompose: true });
  } catch (err) {
    console.error("[light-codes] generation failed:", err);
    const code = (err as LyriaFailure)?.code;
    const status = (err as LyriaFailure)?.status;
    return NextResponse.json(
      {
        error:
          err instanceof Error && err.message
            ? err.message
            : "The chamber rests a moment. Breathe, then ask again.",
        ...(code ? { code } : {}),
        ...(status ? { upstreamStatus: status } : {}),
      },
      { status: code === "nokey" ? 501 : 500 }
    );
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const recentAskTimes = new Map<string, number>();
