import fs from "fs";
import path from "path";
import crypto from "crypto";
import ZAI_SDK from "z-ai-web-dev-sdk";

/* ================================================================== */
/*  THE GENERATIVE ENGINE — the generate_image tool                    */
/*                                                                    */
/*  One door for every image this application paints. The assistant   */
/*  decides WHEN a visual is needed; this engine decides HOW it is    */
/*  painted. The OpenAI brush (DALL·E 3) leads whenever its key       */
/*  exists — the visitor's chosen painter; the Z.ai CogView brush     */
/*  serves as the first fallback, and the Z.ai atelier as the final   */
/*  one, always ready in the laboratory.                              */
/*                                                                    */
/*  Every painting is kept in the atelier's gallery (.visualizations/) */
/*  and served through /api/visual/[file] when the filesystem is      */
/*  writable. In the cloud (read-only filesystem) the engine serves   */
/*  the hosted url each painter returns instead.                      */
/*                                                                    */
/*  A small circuit breaker per cloud brush remembers when a key is   */
/*  unreachable (missing, revoked, blocked) and stops knocking on     */
/*  that door for a while, so paintings stay fast.                    */
/* ================================================================== */

export const GALLERY_DIR = path.join(process.cwd(), ".visualizations");

export type ImageQuality = "standard" | "hd";
export type ImageEngineName = "openai" | "zai";

export interface GeneratedImage {
  /** The painting — /api/visual/<file> in the gallery, a hosted url in the cloud. */
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
  /** DALL·E 3 only — ignored by the Z.ai brushes. */
  quality?: ImageQuality;
}

/* --------------------------- size tables --------------------------- */

const DALLE_SIZES = ["1024x1024", "1024x1792", "1792x1024"] as const;
type DalleSize = (typeof DALLE_SIZES)[number];

/* the Z.ai canvases — the atelier and CogView speak the same sizes */
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

/** Map any requested size onto the Z.ai supported canvases. */
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

/* ------------------------- the gallery ----------------------------- */

let galleryWritable: boolean | null = null;

/** True when paintings can be kept in the local gallery (laboratory). */
function canWriteGallery(): boolean {
  if (galleryWritable === null) {
    try {
      fs.mkdirSync(GALLERY_DIR, { recursive: true });
      const probe = path.join(GALLERY_DIR, `.probe-${process.pid}`);
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);
      galleryWritable = true;
    } catch {
      galleryWritable = false;
      console.error(
        "[image-engine] the gallery is read-only (cloud) — hosted urls will be served directly"
      );
    }
  }
  return galleryWritable;
}

function savePainting(base64: string): string {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  const name = `img-${Date.now().toString(36)}-${crypto
    .randomBytes(3)
    .toString("hex")}.png`;
  fs.writeFileSync(path.join(GALLERY_DIR, name), Buffer.from(base64, "base64"));
  return name;
}

/* ------------------------- circuit breakers ------------------------ */

const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 10 * 60 * 1000;

const breakers: Record<ImageEngineName, { failures: number; openUntil: number }> =
  {
    openai: { failures: 0, openUntil: 0 },
    zai: { failures: 0, openUntil: 0 },
  };

/* --------------------- the painter's journal ----------------------- */
/*  When every brush rests, the visitor deserves to know WHY. Each     */
/*  failure is kept here and served to the interface alongside the     */
/*  prepared prompt, so a misconfigured key is never a mystery again.  */

let paintErrors: string[] = [];

function journal(engine: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  paintErrors.push(`${engine}: ${msg.slice(0, 240)}`);
}

/** The failures of the last generateImage attempt — newest last. */
export function consumePaintErrors(): string[] {
  return paintErrors;
}

function breakerOpen(engine: ImageEngineName): boolean {
  return Date.now() < breakers[engine].openUntil;
}

function noteSuccess(engine: ImageEngineName): void {
  breakers[engine].failures = 0;
}

function noteFailure(engine: ImageEngineName, err: unknown): void {
  journal(engine, err);
  const b = breakers[engine];
  b.failures += 1;
  if (b.failures >= BREAKER_THRESHOLD) {
    b.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.error(
      `[image-engine] ${engine} breaker open for ${
        BREAKER_COOLDOWN_MS / 60000
      } min after ${b.failures} failures`
    );
  }
  console.error(
    `[image-engine] ${engine} brush failed:`,
    err instanceof Error ? err.message : err
  );
}

/* ------------------------ brush: Z.ai CogView ---------------------- */

interface CogViewResponse {
  data?: { url?: string; b64_json?: string }[];
}

/* the painter's model ladder — the configured model leads; if the sky
   refuses it (retired code, unlocked plan), the current flagship is
   knocked on once before the brush gives the canvas away */
async function cogViewCall(
  prompt: string,
  size: string
): Promise<{ remoteUrl?: string; b64?: string }> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) throw new Error("ZAI_API_KEY is not configured");

  const base = (
    process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4"
  ).replace(/\/$/, "");
  const models = [
    process.env.ZAI_IMAGE_MODEL?.trim() || "cogview-3-flash",
    /* a second knock — a different name on the same sky */
    ...(process.env.ZAI_IMAGE_MODEL?.trim() ?
      [process.env.ZAI_IMAGE_MODEL.trim()] : []),
    "cogview-4",
    "cogview-3-flash",
  ].filter((m, i, a) => a.indexOf(m) === i);

  let lastError: unknown = null;
  for (const model of models) {
    try {
      const res = await fetch(`${base}/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, prompt, size }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`Z.ai CogView ${model} ${res.status}: ${detail}`);
      }
      const json = (await res.json()) as CogViewResponse;
      const item = json.data?.[0];
      if (item?.url || item?.b64_json) {
        return { remoteUrl: item?.url, b64: item?.b64_json };
      }
      lastError = new Error(`Z.ai CogView ${model} returned no image`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Z.ai CogView could not paint");
}

async function paintWithCogView(
  prompt: string,
  size: string
): Promise<GeneratedImage> {
  const { remoteUrl, b64 } = await cogViewCall(prompt, size);

  /* in the laboratory keep every painting in the gallery */
  if (canWriteGallery()) {
    let base64: string | null = b64 ?? null;
    if (!base64 && remoteUrl) {
      const img = await fetch(remoteUrl, {
        signal: AbortSignal.timeout(60_000),
      });
      if (img.ok) {
        base64 = Buffer.from(await img.arrayBuffer()).toString("base64");
      }
    }
    if (base64) {
      const name = savePainting(base64);
      return {
        url: `/api/visual/${name}`,
        revisedPrompt: null,
        originalPrompt: prompt,
        engine: "zai",
      };
    }
  }

  /* in the cloud serve the hosted painting directly */
  if (remoteUrl) {
    return {
      url: remoteUrl,
      revisedPrompt: null,
      originalPrompt: prompt,
      engine: "zai",
    };
  }
  if (b64) {
    return {
      url: `data:image/png;base64,${b64}`,
      revisedPrompt: null,
      originalPrompt: prompt,
      engine: "zai",
    };
  }
  throw new Error("Z.ai CogView returned no image");
}

/* ------------------------ brush: DALL·E 3 -------------------------- */

interface DalleResponse {
  data?: { b64_json?: string; url?: string; revised_prompt?: string }[];
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

  const cloudMode = !canWriteGallery();
  const forcedModel = process.env.OPENAI_IMAGE_MODEL;

  /* one shared hand for both OpenAI brushes */
  const paint = async (
    model: "dall-e-3" | "gpt-image-1"
  ): Promise<GeneratedImage> => {
    /* gpt-image-1 speaks different sizes and qualities, and knows no
       response_format — its canvas always comes home as base64 */
    const isGptImage = model === "gpt-image-1";
    const modelSize = isGptImage
      ? size === "1024x1792"
        ? "1024x1536"
        : size === "1792x1024"
          ? "1536x1024"
          : "1024x1024"
      : size;
    const modelQuality = isGptImage
      ? quality === "hd"
        ? "high"
        : "medium"
      : quality;

    const res = await fetch(`${base}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: modelSize,
        quality: modelQuality,
        ...(isGptImage ? {} : { response_format: cloudMode ? "url" : "b64_json" }),
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`OpenAI ${model} ${res.status}: ${detail}`);
    }

    const json = (await res.json()) as DalleResponse;
    const item = json.data?.[0];

    if (item?.url) {
      return {
        url: item.url,
        revisedPrompt: item.revised_prompt ?? null,
        originalPrompt: prompt,
        engine: "openai",
      };
    }

    const b64 = item?.b64_json;
    if (!b64) throw new Error(`OpenAI ${model} returned no image`);

    /* in the cloud (read-only gallery) the painting travels embedded */
    if (cloudMode) {
      return {
        url: `data:image/png;base64,${b64}`,
        revisedPrompt: item.revised_prompt ?? null,
        originalPrompt: prompt,
        engine: "openai",
      };
    }

    const name = savePainting(b64);
    return {
      url: `/api/visual/${name}`,
      revisedPrompt: item.revised_prompt ?? null,
      originalPrompt: prompt,
      engine: "openai",
    };
  };

  /* the chosen painter leads; the other OpenAI brush covers it */
  if (forcedModel === "gpt-image-1") {
    return paint("gpt-image-1");
  }
  try {
    return await paint("dall-e-3");
  } catch (err) {
    if (forcedModel === "dall-e-3") throw err;
    journal("openai/dall-e-3", err);
    console.error(
      "[image-engine] dall-e-3 rested — offering the canvas to gpt-image-1:",
      err instanceof Error ? err.message : err
    );
    return paint("gpt-image-1");
  }
}

/* ------------------------ brush: the atelier ----------------------- */

const ATELIER_BACKOFF_MS = [1500, 4000];

async function paintWithAtelier(
  prompt: string,
  size: (typeof ZAI_SIZES)[number],
  attempts = 2
): Promise<GeneratedImage> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const zai = await ZAI_SDK.create();
      const response = await zai.images.generations.create({ prompt, size });
      const base64 = response?.data?.[0]?.base64;
      if (base64) {
        /* the laboratory keeps the painting in its gallery; the cloud
           (read-only) carries it home embedded in the answer instead —
           either way the atelier can never lose the canvas to the
           filesystem again */
        if (canWriteGallery()) {
          try {
            const name = savePainting(base64);
            return {
              url: `/api/visual/${name}`,
              revisedPrompt: null,
              originalPrompt: prompt,
              engine: "zai",
            };
          } catch {
            /* the gallery closed mid-painting — carry the canvas home */
          }
        }
        return {
          url: `data:image/png;base64,${base64}`,
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
 * available brush and returns it, or null when every brush rested.
 */
export async function generateImage(
  originalPrompt: string,
  options: GenerateImageOptions = {}
): Promise<GeneratedImage | null> {
  paintErrors = [];
  const prompt = originalPrompt.trim().slice(0, 4000);
  if (!prompt) return null;

  const quality: ImageQuality =
    options.quality === "hd" ? "hd" : "standard";

  /* the visitor's chosen painter leads: DALL·E 3 when the OpenAI
     key exists, CogView otherwise — the other serves as fallback */
  const openaiLeads = Boolean(process.env.OPENAI_API_KEY);

  const cogReady =
    Boolean(process.env.ZAI_API_KEY) && !breakerOpen("zai");
  const dalleReady =
    Boolean(process.env.OPENAI_API_KEY) && !breakerOpen("openai");

  const candidates: { engine: ImageEngineName; run: () => Promise<GeneratedImage> }[] =
    [];
  if (cogReady)
    candidates.push({
      engine: "zai",
      run: () => paintWithCogView(prompt, toZaiSize(options.size)),
    });
  if (dalleReady)
    candidates.push({
      engine: "openai",
      run: () => paintWithDalle(prompt, toDalleSize(options.size), quality),
    });

  const ordered = openaiLeads
    ? [...candidates].reverse()
    : candidates;

  for (const brush of ordered) {
    try {
      const img = await brush.run();
      noteSuccess(brush.engine);
      return img;
    } catch (err) {
      noteFailure(brush.engine, err);
    }
  }

  /* the final brush — the Z.ai atelier, always ready in the laboratory */
  try {
    return await paintWithAtelier(prompt, toZaiSize(options.size));
  } catch (err) {
    journal("atelier", err);
    console.error("[image-engine] every brush has rested:", err);
    return null;
  }
}

/** True when the Z.ai cloud brush is configured (for status endpoints). */
export function isZaiCloudConfigured(): boolean {
  return Boolean(process.env.ZAI_API_KEY);
}

/** True when the OpenAI brush is configured (for status endpoints). */
export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
