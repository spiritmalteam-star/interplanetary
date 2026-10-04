import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";

/* ------------------------------------------------------------------ */
/*  POST /api/asr — the microphone becomes words.                      */
/*  A WAV (recorded client-side as 16 kHz mono PCM) travels in as      */
/*  base64 and returns as a plain transcription.                       */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      audio?: unknown;
    } | null;

    let audioBase64: string | null = null;
    let mime: string | undefined;
    if (typeof body?.audio === "string") {
      const raw = body.audio;
      const comma = raw.indexOf(",");
      if (raw.startsWith("data:") && comma !== -1) {
        /* data:audio/webm;codecs=opus;base64,… → "audio/webm" */
        const header = raw.slice(5, comma);
        mime = header.split(";", 1)[0] || undefined;
        audioBase64 = raw.slice(comma + 1);
      } else {
        audioBase64 = raw;
      }
    }

    if (!audioBase64 || audioBase64.length < 64) {
      return NextResponse.json(
        { error: "No voice arrived to be heard." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const response = await zai.audio.asr.create({
      file_base64: audioBase64,
      mime,
    });

    const text = (response.text ?? "").trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[api/asr]", err);
    return NextResponse.json(
      {
        error: "Your voice could not be heard — try again.",
        detail: err instanceof Error ? err.message.slice(0, 300) : undefined,
      },
      { status: 502 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
