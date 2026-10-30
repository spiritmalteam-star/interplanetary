import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { voiceEngine, isVoiceId, type VoiceId } from "@/lib/i18n/core";
import { meterRoute } from "@/lib/server/meter";

/* ------------------------------------------------------------------ */
/*  POST /api/tts — documentary-grade narration for transmissions.     */
/*  The SDK synthesizes at most 1024 chars per call and emits WAV, so  */
/*  text is split into sentence-bounded chunks and the per-chunk WAV   */
/*  files are merged into one canonical PCM WAV before responding.     */
/*                                                                     */
/*  THE GOOGLE VOICE — engine "google" asks the sky's own Gemini TTS   */
/*  (gemini-2.5-flash-preview-tts) for a CALM, INTELLIGENT MALE voice  */
/*  (Charon): the direct call's first reader when GEMINI_API_KEY is    */
/*  placed. One round trip, one voice, zero falling back — and the     */
/*  house voice (xiaochen) stands behind it when the key is absent or  */
/*  the sky refuses.                                                    */
/* ------------------------------------------------------------------ */

const MAX_CHUNK = 900;
const MAX_CHUNKS = 14;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= MAX_CHUNK) return [clean];

  // Sentence-bounded greedy packing.
  const sentences = clean.match(/[^.!?…]+[.!?…]+["'”’)\]]*\s*/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > MAX_CHUNK) {
      // Extremely long sentence — hard split on word boundaries.
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      let rest = sentence;
      while (rest.length > MAX_CHUNK) {
        let cut = rest.lastIndexOf(" ", MAX_CHUNK);
        if (cut < MAX_CHUNK * 0.6) cut = MAX_CHUNK;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut);
      }
      current = rest;
      continue;
    }
    if ((current + sentence).length > MAX_CHUNK) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/* ---- WAV utilities ------------------------------------------------ */

interface WavMeta {
  audioFormat: number;
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function readWav(buffer: Buffer): { meta: WavMeta; pcm: Buffer } | null {
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;

  let offset = 12;
  let meta: WavMeta | null = null;
  const pcmParts: Buffer[] = [];

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = buffer.subarray(offset + 8, Math.min(offset + 8 + size, buffer.length));

    if (id === "fmt " && body.length >= 16) {
      meta = {
        audioFormat: body.readUInt16LE(0),
        numChannels: body.readUInt16LE(2),
        sampleRate: body.readUInt32LE(4),
        bitsPerSample: body.readUInt16LE(14),
      };
    } else if (id === "data") {
      pcmParts.push(body);
    }
    offset += 8 + size + (size % 2); // chunks are word-aligned
  }

  if (!meta || pcmParts.length === 0) return null;
  return { meta, pcm: Buffer.concat(pcmParts) };
}

function buildWav(meta: WavMeta, pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (meta.sampleRate * meta.numChannels * meta.bitsPerSample) / 8;
  const blockAlign = (meta.numChannels * meta.bitsPerSample) / 8;

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(meta.audioFormat === 3 ? 3 : 1, 20); // 1 = PCM, 3 = float
  header.writeUInt16LE(meta.numChannels, 22);
  header.writeUInt32LE(meta.sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(meta.bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

/* ---------------- the Google voice (Gemini TTS) --------------------- */

/* Gemini TTS speaks raw PCM (16-bit, mono, 24 kHz) — the canonical WAV
   header is dressed on top before the wire carries it home. THE LADDER
   OF VOICES — the flash preview engine sings first, the pro preview
   behind it: a renamed or resting engine never silences the call, and
   GOOGLE_TTS_MODEL may pin either from the environment. */
const GOOGLE_TTS_MODELS = [
  process.env.GOOGLE_TTS_MODEL || "gemini-2.5-flash-preview-tts",
  "gemini-2.5-pro-preview-tts",
].filter(Boolean);
/* Charon — the calm, firm, intelligent male register of the Google
   choir: the direct call's own voice. */
const GOOGLE_TTS_VOICE = process.env.GOOGLE_TTS_VOICE || "Charon";
const GOOGLE_TTS_STYLE =
  "Speak in a calm, measured, deeply intelligent male voice — warm and unhurried, like a wise presence on a quiet line:";

async function speakWithGoogle(
  text: string,
  speed: number
): Promise<{ buffer: Buffer; error?: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: key });
  let lastError = "google voice quiet";
  for (const model of GOOGLE_TTS_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ parts: [{ text: `${GOOGLE_TTS_STYLE} ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: GOOGLE_TTS_VOICE },
            },
          },
        },
      });
      const b64 =
        (
          response.candidates?.[0]?.content?.parts?.[0] as
            | { inlineData?: { data?: string } }
            | undefined
        )?.inlineData?.data ?? null;
      if (!b64) {
        lastError = `${model}: the voice answered without sound`;
        continue;
      }
      const pcm = Buffer.from(b64, "base64");
      if (pcm.length === 0) {
        lastError = `${model}: the voice answered empty`;
        continue;
      }
      const meta = {
        audioFormat: 1,
        numChannels: 1,
        sampleRate: 24000,
        bitsPerSample: 16,
      };
      /* the pace rides when the sky's own tempo needs the house's hand */
      void speed;
      return { buffer: buildWav(meta, pcm) };
    } catch (err) {
      lastError = `${model}: ${
        err instanceof Error ? err.message.slice(0, 300) : "quiet"
      }`;
    }
  }
  return { buffer: Buffer.alloc(0), error: lastError };
}

/* ---- route -------------------------------------------------------- */

export const POST = meterRoute("tts", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const text: unknown = body?.text;
    const voice: VoiceId = isVoiceId(body?.voice) ? body.voice : "aurora";
    const rawPace: number = typeof body?.pace === "number" ? body.pace : 0.95;
    const speed = Math.min(2, Math.max(0.5, rawPace));
    /* THE GOOGLE VOICE — the direct call asks for the sky's own calm
       male reader first (the `calm` flag is the same ask, honored from
       the chamber's older hand); the house voice answers when it
       cannot, and the browser stands in behind it. */
    const wantsGoogle = body?.engine === "google" || body?.calm === true;

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Nothing was given to narrate." },
        { status: 400 }
      );
    }

    if (wantsGoogle) {
      const spoken = text.replace(/\s+/g, " ").trim().slice(0, 2400);
      const google = await speakWithGoogle(spoken, speed);
      if (google && google.buffer.length > 0) {
        return new NextResponse(new Uint8Array(google.buffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": google.buffer.length.toString(),
            "Cache-Control": "no-store",
            "X-Voice-Engine": "google",
          },
        });
      }
      const status = google?.error ? 502 : 501;
      return NextResponse.json(
        {
          error: "The google voice is quiet — the house voice reads instead.",
          code: google?.error ? "google_voice_failed" : "no_google_key",
          detail: google?.error,
        },
        { status }
      );
    }

    const allChunks = chunkText(text);
    const originalChars = text.replace(/\s+/g, " ").trim().length;
    const chunks = allChunks.slice(0, MAX_CHUNKS);
    const truncated = allChunks.length > MAX_CHUNKS;
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Nothing was given to narrate." },
        { status: 400 }
      );
    }
    if (truncated) {
      /* the silent truncation is over — the client is told, and the
         laboratory log carries the weight of every dropped word */
      console.warn(
        `[tts] truncation: ${allChunks.length} chunks → ${MAX_CHUNKS} ` +
          `(${originalChars} chars requested, voice ends early)`
      );
    }

    const respondWav = (
      buffer: Buffer,
      extraHeaders: Record<string, string> = {}
    ) => {
      const headers: Record<string, string> = {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
        ...extraHeaders,
      };
      if (truncated) headers["X-Voice-Truncated"] = String(originalChars);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers,
      });
    };

    const zai = await ZAI.create();
    const engineVoice = voiceEngine(voice);
    let mergeMeta: WavMeta | null = null;
    const pcmParts: Buffer[] = [];

    for (const chunk of chunks) {
      const response = await zai.audio.tts.create({
        input: chunk,
        voice: engineVoice,
        speed,
        response_format: "wav",
        stream: false,
      });
      const arrayBuffer = await response.arrayBuffer();
      const parsed = readWav(Buffer.from(new Uint8Array(arrayBuffer)));
      if (parsed) {
        mergeMeta = mergeMeta ?? parsed.meta;
        pcmParts.push(parsed.pcm);
      }
    }

    if (!mergeMeta || pcmParts.length === 0) {
      return NextResponse.json(
        {
          error: "The voice field is momentarily quiet.",
          detail:
            "the synthesis returned audio that could not be shaped into a voice",
        },
        { status: 502 }
      );
    }

    const buffer = buildWav(mergeMeta, Buffer.concat(pcmParts));

    return respondWav(buffer);
  } catch (err) {
    console.error("[tts] failed:", err);
    /* upstream voices (4xx/5xx from the sky, unparseable audio) ride
       502 — a bad gate, not a broken house; the poetic line carries a
       `detail` that names the true cause for the keeper of the keys. */
    const detail =
      err instanceof Error ? err.message.slice(0, 1200) : undefined;
    const upstream = detail ? /\b[45]\d\d\b|Z\.ai|sky|voice/.test(detail) : false;
    return NextResponse.json(
      {
        error: "The voice field is momentarily quiet. Rest, then listen again.",
        detail,
      },
      { status: upstream ? 502 : 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
