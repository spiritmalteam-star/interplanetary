import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { voiceEngine, isVoiceId, type VoiceId } from "@/lib/i18n/core";

/* ------------------------------------------------------------------ */
/*  POST /api/tts — documentary-grade narration for transmissions.     */
/*  The SDK synthesizes at most 1024 chars per call and emits WAV, so  */
/*  text is split into sentence-bounded chunks and the per-chunk WAV   */
/*  files are merged into one canonical PCM WAV before responding.     */
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

/* ---- route -------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const text: unknown = body?.text;
    const voice: VoiceId = isVoiceId(body?.voice) ? body.voice : "aurora";
    const rawPace: number = typeof body?.pace === "number" ? body.pace : 0.95;
    const speed = Math.min(2, Math.max(0.5, rawPace));

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Nothing was given to narrate." },
        { status: 400 }
      );
    }

    const chunks = chunkText(text).slice(0, MAX_CHUNKS);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Nothing was given to narrate." },
        { status: 400 }
      );
    }

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
        { error: "The voice field is momentarily quiet." },
        { status: 502 }
      );
    }

    const buffer = buildWav(mergeMeta, Buffer.concat(pcmParts));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[tts] failed:", err);
    return NextResponse.json(
      { error: "The voice field is momentarily quiet. Rest, then listen again." },
      { status: 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
