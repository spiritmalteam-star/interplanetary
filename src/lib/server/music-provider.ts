/* ------------------------------------------------------------------ */
/*  THE SOUND ENGINE — a provider abstraction for music generation.    */
/*                                                                     */
/*  Music Engine 2.0 law: never assume a provider supports every       */
/*  genre, duration, stem or vocal feature. Each provider declares     */
/*  its capabilities; the studio selects the best available engine     */
/*  for the request — and the engine's name stays behind the veil.     */
/*                                                                     */
/*  Only Suno is configured today (SUNO_API_KEY); the abstraction      */
/*  stands ready for more without touching the chamber again.          */
/*  Provider errors are logged without ever exposing secrets.          */
/* ------------------------------------------------------------------ */

export interface MusicSpec {
  /** The provider-facing style line (the Mirror's translated direction). */
  style: string;
  /** The track title. */
  title: string;
  /** Lyrics (null → instrumental). */
  lyrics: string | null;
  /** Negative constraints — appended to the style and sent as negativeTags. */
  negative: string | null;
  /** Whether the render must be instrumental. */
  instrumental: boolean;
}

export interface MusicSubmitResult {
  taskId?: string;
  audioUrl?: string;
  audioId?: string;
  duration?: number;
}

export type MusicPollResult =
  | { status: "pending" }
  | { status: "ready"; audioUrl: string; audioId?: string; duration?: number }
  | { status: "error"; error: string };

export interface MusicCapabilities {
  id: string;
  label: string;
  /** Longest render the provider reliably supports, in seconds. */
  maxDurationSec: number;
  /** Whether negative tags can ride alongside the style. */
  negativeTags: boolean;
  /** Vocal styles the engine renders well. */
  vocals: string[];
  /** Cost class 1..5 — used by routing when several engines exist. */
  costClass: number;
}

export interface MusicProvider {
  readonly capabilities: MusicCapabilities;
  submit(spec: MusicSpec): Promise<MusicSubmitResult>;
  poll(taskId: string): Promise<MusicPollResult>;
}

/* --------------------------- selection ------------------------------ */

/**
 * Choose the engine for a request. With several providers configured,
 * this weighs genre/vocals/duration/reliability/cost/latency; with one,
 * it answers honestly with that one — or nothing when no key is placed.
 */
export function selectProvider(_request?: {
  genres?: string[];
  vocal?: string;
  durationSec?: number | null;
}): MusicProvider | null {
  if (process.env.SUNO_API_KEY) return sunoProvider();
  return null;
}

/* ------------------------------ suno -------------------------------- */

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

function sunoHeaders(): HeadersInit | null {
  const key = process.env.SUNO_API_KEY;
  if (!key) return null;
  return { "x-api-key": key, "Content-Type": "application/json" };
}

export function sunoProvider(): MusicProvider {
  return {
    capabilities: {
      id: "suno",
      label: "the sound engine",
      maxDurationSec: 480,
      negativeTags: true,
      vocals: ["male", "female", "duet", "choir", "synthetic"],
      costClass: 3,
    },
    async submit(spec: MusicSpec): Promise<MusicSubmitResult> {
      const headers = sunoHeaders();
      if (!headers) throw new Error("__nokey__");

      /* The style line carries the whole musical contract; exclusions
         are appended as "no X" clauses — the engine honors both. */
      let style = spec.style.slice(0, 960);
      if (spec.negative) {
        const clauses = spec.negative
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12)
          .map((s) => `no ${s.replace(/^no\s+/i, "")}`)
          .join(", ");
        if (clauses) style = `${style}, ${clauses}`.slice(0, 1000);
      }

      const body: Record<string, unknown> = {
        customMode: true,
        model: process.env.SUNO_MODEL || "v4",
        instrumental: spec.instrumental,
        style,
        title: spec.title.slice(0, 120),
      };
      if (spec.instrumental) {
        body.prompt = style;
      } else if (spec.lyrics) {
        body.prompt = spec.lyrics.slice(0, 3000);
      } else {
        body.prompt = style;
      }
      if (spec.negative && process.env.SUNO_NEGATIVE_TAGS !== "off") {
        /* sent when the provider supports it — ignored harmlessly otherwise */
        body.negativeTags = spec.negative.slice(0, 200);
      }

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
          `The sound engine did not open its door (${res.status}). ${
            typeof data?.message === "string" ? data.message : ""
          }`.trim()
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
        if (url) return { audioUrl: url, audioId: first?.id, duration: first?.duration };
      }
      throw new Error("The sound engine answered without a task. Try again in a breath.");
    },
    async poll(taskId: string): Promise<MusicPollResult> {
      const key = process.env.SUNO_API_KEY;
      if (!key) return { status: "error", error: "The sound engine's key is not placed yet." };
      try {
        const res = await fetch(
          `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
          { headers: { "x-api-key": key }, cache: "no-store" }
        );
        const data = (await res.json().catch(() => null)) as
          | {
              status?: string;
              data?: {
                status?: string;
                task_status?: string;
                response?: { suno_data?: SunoClip[]; clips?: SunoClip[] };
                suno_data?: SunoClip[];
                clips?: SunoClip[];
              };
            }
          | null;
        if (!res.ok || !data) return { status: "pending" };

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
          d?.data?.status ?? d?.data?.task_status ?? (data as { status?: string })?.status ?? ""
        ).toLowerCase();

        if (first && (first.audio_url || first.audioUrl)) {
          return {
            status: "ready",
            audioUrl: (first.audio_url ?? first.audioUrl) as string,
            audioId: first.id,
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
      } catch (err) {
        /* provider transport hiccups read as "still rendering" — the
           task is re-polled; the server logs without exposing secrets */
        console.error(
          "[music-provider] poll transport:",
          err instanceof Error ? err.message : err
        );
        return { status: "pending" };
      }
    },
  };
}

/* --------------------- server-side integrity check ------------------- */

/**
 * A cheap pre-delivery validation: the audio URL must answer with a real
 * audio body of non-trivial size. Deep QA (silence, clipping, loudness)
 * runs client-side in the chamber, where the file is decoded anyway.
 */
export async function validateAudioUrl(
  url: string
): Promise<{ ok: boolean; contentType?: string; bytes?: number; reason?: string }> {
  try {
    const res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-65535" } });
    if (!res.ok && res.status !== 206) {
      return { ok: false, reason: `audio unreachable (${res.status})` };
    }
    const ct = res.headers.get("content-type") ?? "";
    const total =
      parseInt(res.headers.get("content-range")?.split("/")[1] ?? "", 10) ||
      parseInt(res.headers.get("content-length") ?? "", 10) ||
      0;
    if (ct && !/audio|octet-stream|mpeg|mp4|wav|ogg|flac/i.test(ct)) {
      return { ok: false, contentType: ct, reason: `unexpected content type ${ct}` };
    }
    if (total > 0 && total < 60_000) {
      return { ok: false, bytes: total, reason: "suspiciously small audio body" };
    }
    return { ok: true, contentType: ct || undefined, bytes: total || undefined };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "audio check failed" };
  }
}
