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
    if (typeof body?.audio === "string") {
      const raw = body.audio;
      const comma = raw.indexOf(",");
      audioBase64 = raw.startsWith("data:") && comma !== -1
        ? raw.slice(comma + 1)
        : raw;
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
    });

    const text = (response.text ?? "").trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[api/asr]", err);
    return NextResponse.json(
      { error: "Your voice could not be heard — try again." },
      { status: 502 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
