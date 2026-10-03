import fs from "fs";
import path from "path";
import crypto from "crypto";
import ZAI from "z-ai-web-dev-sdk";

/* ================================================================== */
/*  THE GENERATIVE ENGINE — the generate_image tool                    */
/*                                                                    */
/*  One door for every image this application paints. The assistant   */
/*  decides WHEN a visual is needed; this engine decides HOW it is    */
/*  painted:                                                          */
/*                                                                    */
/*    1. OpenAI DALL·E 3 — the first brush (OPENAI_API_KEY in .env).  */
/*    2. The Z.ai atelier — the eternal fallback, always available.   */
/*                                                                    */
/*  Every painting is saved into the atelier's gallery                */
/*  (.visualizations/) and served through /api/visual/[file], the     */
/*  same gallery the visualization engine has always used.            */
/*                                                                    */
/*  A small circuit breaker remembers when DALL·E is unreachable      */
/*  (missing key, region block, revoked key) and stops knocking on    */
/*  that door for a while, so paintings stay fast.                    */
/* ================================================================== */

export const GALLERY_DIR = path.join(process.cwd(), ".visualizations");

export type ImageQuality = "standard" | "hd";
export type ImageEngineName = "openai" | "zai";

export interface GeneratedImage {
  /** The painting as served to visitors — /api/visual/<file>. */
  url: string;
  /** DALL·E 3's own revised prompt (null on the Z.ai path). */
  revisedPrompt: string | null;
  /** The prompt the tool was invoked with. */
  originalPrompt: string;
  /** Which brush painted it. */
  engine: ImageEngineName;
}

export interface GenerateImageOptions {
  /** Any known size; mapped to the nearest the chosen engine supports. */
  size?: string;
  /** DALL·E 3 only — ignored by the Z.ai atelier. */
  quality?: ImageQuality;
}

/* --------------------------- size tables --------------------------- */

const DALLE_SIZES = ["1024x1024", "1024x1792", "1792x1024"] as const;
type DalleSize = (typeof DALLE_SIZES)[number];

const ZAI_SIZES = [
  "1024x1024",
  "768x1344",
  "864x1152",
  "1344x768",
  "1152x864",
  "1440x720",
  "720x1440",
] as const;

/** Map any requested size onto DALL·E 3's three aspect buckets. */
function toDalleSize(size?: string): DalleSize {
  if (size && (DALLE_SIZES as readonly string[]).includes(size)) {
    return size as DalleSize;
  }
  const [w = 1024, h = 1024] = (size ?? "").split("x").map(Number);
  if (Number.isFinite(w) && Number.isFinite(h)) {
    if (h > w * 1.1) return "1024x1792";
    if (w > h * 1.1) return "1792x1024";
  }
  return "1024x1024";
}

/** Map any requested size onto the Z.ai atelier's supported canvases. */
function toZaiSize(size?: string): (typeof ZAI_SIZES)[number] {
  if (size && (ZAI_SIZES as readonly string[]).includes(size)) {
    return size as (typeof ZAI_SIZES)[number];
  }
  const [w = 1024, h = 1024] = (size ?? "").split("x").map(Number);
  if (Number.isFinite(w) && Number.isFinite(h)) {
    if (h > w * 1.1) return "768x1344";
    if (w > h * 1.1) return "1344x768";
  }
  return "1024x1024";
}

/* ------------------------- circuit breaker ------------------------- */

const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 10 * 60 * 1000;

const breaker = { failures: 0, openUntil: 0 };

function breakerOpen(): boolean {
  return Date.now() < breaker.openUntil;
}

function noteOpenAiFailure(err: unknown): void {
  breaker.failures += 1;
  if (breaker.failures >= BREAKER_THRESHOLD) {
    breaker.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.error(
      `[image-engine] OpenAI breaker open for ${BREAKER_COOLDOWN_MS / 60000} min after ${breaker.failures} failures`
    );
  }
  console.error(
    "[image-engine] DALL·E 3 attempt failed, falling back to the Z.ai atelier:",
    err instanceof Error ? err.message : err
  );
}

/* --------------------------- the gallery --------------------------- */

function savePainting(base64: string): string {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  const name = `img-${Date.now().toString(36)}-${crypto
    .randomBytes(3)
    .toString("hex")}.png`;
  fs.writeFileSync(path.join(GALLERY_DIR, name), Buffer.from(base64, "base64"));
  return name;
}

/* ------------------------- brush 1: DALL·E 3 ----------------------- */

interface DalleResponse {
  data?: { b64_json?: string; revised_prompt?: string }[];
}

async function paintWithDalle(
  prompt: string,
  size: string,
  quality: ImageQuality
): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const base = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  const res = await fetch(`${base}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }

  const json = (await res.json()) as DalleResponse;
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");

  const name = savePainting(b64);
  return {
    url: `/api/visual/${name}`,
    revisedPrompt: json.data?.[0]?.revised_prompt ?? null,
    originalPrompt: prompt,
    engine: "openai",
  };
}

/* ------------------------ brush 2: the atelier ---------------------- */

const ATELIER_BACKOFF_MS = [2500, 6000, 12000];

async function paintWithAtelier(
  prompt: string,
  size: (typeof ZAI_SIZES)[number],
  attempts = 3
): Promise<GeneratedImage> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const zai = await ZAI.create();
      const response = await zai.images.generations.create({ prompt, size });
      const base64 = response?.data?.[0]?.base64;
      if (base64) {
        const name = savePainting(base64);
        return {
          url: `/api/visual/${name}`,
          revisedPrompt: null,
          originalPrompt: prompt,
          engine: "zai",
        };
      }
      lastError = new Error("the atelier returned an empty canvas");
      console.error(
        `[image-engine] atelier attempt ${i + 1}: empty canvas returned`
      );
    } catch (err) {
      lastError = err;
      console.error(`[image-engine] atelier attempt ${i + 1} failed:`, err);
    }
    if (i < attempts - 1) {
      await new Promise((r) =>
        setTimeout(
          r,
          ATELIER_BACKOFF_MS[Math.min(i, ATELIER_BACKOFF_MS.length - 1)]
        )
      );
    }
  }
  throw lastError ?? new Error("the atelier could not paint");
}

/* ====================== the generate_image tool ==================== */

/**
 * The generate_image tool — paints one image through the best
 * available brush and returns it served from the gallery, or null
 * when every brush has rested.
 */
export async function generateImage(
  originalPrompt: string,
  options: GenerateImageOptions = {}
): Promise<GeneratedImage | null> {
  const prompt = originalPrompt.trim().slice(0, 4000);
  if (!prompt) return null;

  const quality: ImageQuality =
    options.quality === "hd" ? "hd" : "standard";

  /* brush 1 — DALL·E 3, when the door is open and the key exists */
  if (process.env.OPENAI_API_KEY && !breakerOpen()) {
    try {
      const img = await paintWithDalle(
        prompt,
        toDalleSize(options.size),
        quality
      );
      breaker.failures = 0;
      return img;
    } catch (err) {
      noteOpenAiFailure(err);
    }
  }

  /* brush 2 — the Z.ai atelier, always ready */
  try {
    return await paintWithAtelier(prompt, toZaiSize(options.size));
  } catch (err) {
    console.error("[image-engine] every brush has rested:", err);
    return null;
  }
}

/** True when the OpenAI brush is configured (for status endpoints). */
export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
