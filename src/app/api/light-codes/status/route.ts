import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  LIGHT CODES — status of a rendering transmission. The sound        */
/*  engine's key never leaves the server.                              */
/* ------------------------------------------------------------------ */

const SUNO_BASE = (
  process.env.SUNO_API_URL || "https://api.sunoapi.org"
).replace(/\/+$/, "");

interface SunoClip {
  id?: string;
  audio_url?: string;
  audioUrl?: string;
  source_audio_url?: string;
  duration?: number;
  status?: string;
  title?: string;
}

function extract(data: unknown): {
  status: "pending" | "ready" | "error";
  audioUrl?: string;
  id?: string;
  duration?: number;
  error?: string;
} {
  const d = data as {
    status?: string;
    data?: {
      status?: string;
      task_status?: string;
      response?: { suno_data?: SunoClip[]; clips?: SunoClip[] };
      suno_data?: SunoClip[];
      clips?: SunoClip[];
    };
  };
  const clips: SunoClip[] =
    d?.data?.response?.suno_data ??
    d?.data?.response?.clips ??
    d?.data?.suno_data ??
    d?.data?.clips ??
    [];
  const first = clips.find((c) => c && (c.audio_url || c.audioUrl));
  const rawStatus = String(
    d?.data?.status ?? d?.data?.task_status ?? d?.status ?? ""
  ).toLowerCase();

  if (first && (first.audio_url || first.audioUrl)) {
    return {
      status: "ready",
      audioUrl: (first.audio_url ?? first.audioUrl) as string,
      id: first.id,
      duration: first.duration,
    };
  }
  if (/error|failed/.test(rawStatus)) {
    return { status: "error", error: "The rendering met a silence it could not cross." };
  }
  if (/complete|success|finished|done/.test(rawStatus) && !first) {
    return { status: "error", error: "The rendering finished without a sound." };
  }
  return { status: "pending" };
}

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ status: "error", error: "No task was named." }, { status: 400 });
  }
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    return NextResponse.json(
      { status: "error", error: "The sound engine's key is not placed yet." },
      { status: 501 }
    );
  }
  try {
    const res = await fetch(
      `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { "x-api-key": key }, cache: "no-store" }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return NextResponse.json({ status: "pending" });
    }
    return NextResponse.json(extract(data));
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
