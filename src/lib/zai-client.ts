/* ================================================================== */
/*  THE PROVIDER BRIDGE — one interface, three skies                   */
/*                                                                    */
/*  Every world speaks through `ZAI.create()` — inside the            */
/*  laboratory (this sandbox) that is the z-ai-web-dev-sdk atelier;   */
/*  when the laboratory travels to the cloud (Vercel) the very same   */
/*  interface is served by a cloud key, and the Z.ai sky is the       */
/*  preferred one — the same GLM brains that live here.               */
/*                                                                    */
/*  Provider selection:                                               */
/*    LLM_PROVIDER=zai-cloud → Z.ai's public API (api.z.ai, GLM)      */
/*    LLM_PROVIDER=openai    → OpenAI-compatible endpoint             */
/*    LLM_PROVIDER=zai       → the z-ai-web-dev-sdk atelier           */
/*    unset                  → on Vercel: Z.ai key when ZAI_API_KEY   */
/*                             exists, else OpenAI when OPENAI_API_KEY*/
/*                             exists; in the laboratory: the atelier */
/*                                                                    */
/*  The cloud skies speak exactly the shapes the routes already use:  */
/*  OpenAI-style messages (including multimodal image_url parts),     */
/*  max_tokens, and { choices: [{ message, finish_reason }] } replies.*/
/*  Z.ai's endpoint is OpenAI-compatible, so one class serves both.   */
/*                                                                    */
/*  Audio (tts/asr) sings on the Z.ai sky first (CogTTS / GLM-ASR —    */
/*  the house voices xiaochen and tongtong are its own), with the      */
/*  OpenAI choir standing silently behind it whenever its key exists.  */
/* ================================================================== */

interface ChatParams {
  messages: any[];
  thinking?: unknown;
  max_tokens?: number;
  temperature?: number;
  [key: string]: unknown;
}

interface ChatCompletion {
  choices: {
    message?: { content?: string | null; role?: string };
    finish_reason?: string;
  }[];
}

interface ZAIClient {
  chat: {
    completions: {
      create(params: ChatParams): Promise<ChatCompletion>;
      /* the vision gift — one image seen (cloud path: the vision
         model sees the image through the same multimodal chat) */
      createVision(params: ChatParams): Promise<ChatCompletion>;
    };
  };
  audio: any;
}

/* ------------------------- the voice gift -------------------------- */

interface TTSParams {
  input: string;
  voice: string;
  speed?: number;
  response_format?: string;
  stream?: boolean;
  [key: string]: unknown;
}

interface ASRParams {
  file_base64: string;
  /** e.g. "audio/webm" — decides the extension whispered to OpenAI */
  mime?: string;
  [key: string]: unknown;
}

interface AudioEngine {
  tts: {
    create(params: TTSParams): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
  };
  asr: {
    create(params: ASRParams): Promise<{ text?: string }>;
  };
}

/* the laboratory's voices mapped onto OpenAI's choir:
   xiaochen (the warm documentary male) → onyx,
   tongtong (the kind lady reader)      → shimmer.
   On the Z.ai sky the very same names are native — CogTTS speaks
   xiaochen and tongtong directly, no mapping needed. */
const OPENAI_VOICE_MAP: Record<string, string> = {
  xiaochen: "onyx",
  tongtong: "shimmer",
};

const ZAI_TTS_MODEL = process.env.ZAI_TTS_MODEL ?? "cogtts";
const ZAI_ASR_MODEL = process.env.ZAI_ASR_MODEL ?? "glm-asr";

const OPENAI_TTS_MODELS = [
  process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
  "tts-1", /* the veteran — tried when the modern voice is refused */
].filter((m, i, a) => a.indexOf(m) === i);

/** audio/webm → webm, audio/mpeg → mp3 … wav is the house default */
function audioExtension(mime?: string): string {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("mp4") || m.includes("m4a")) return "mp4";
  if (m.includes("flac")) return "flac";
  return "wav";
}

function openAIAudio(cfg: CloudConfig): AudioEngine {
  return {
    tts: {
      create: async (params: TTSParams) => {
        const voice =
          OPENAI_VOICE_MAP[params.voice] ?? params.voice ?? "onyx";
        const speed = typeof params.speed === "number" ? params.speed : 1;
        const input = String(params.input ?? "").slice(0, 4096);
        let lastError: unknown = null;

        for (const model of OPENAI_TTS_MODELS) {
          const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${cfg.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              input,
              voice,
              response_format: "wav",
              speed,
            }),
            signal: AbortSignal.timeout(180_000),
          });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            return { arrayBuffer: async () => buf };
          }
          const detail = (await res.text()).slice(0, 300);
          lastError = new Error(
            `OpenAI tts (${model}) ${res.status}: ${detail}`
          );
          /* a refused model may be answered by the veteran — anything
             else (auth, quota) is the same door for every model */
          if (![400, 404, 422].includes(res.status)) throw lastError;
        }
        throw lastError ?? new Error("OpenAI tts could not sing");
      },
    },
    asr: {
      create: async (params: ASRParams) => {
        const bytes = Buffer.from(params.file_base64, "base64");
        const ext = audioExtension(params.mime);
        const mime = params.mime || "audio/wav";
        const form = new FormData();
        form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
        form.append("model", process.env.OPENAI_ASR_MODEL ?? "whisper-1");
        const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          body: form,
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 300);
          throw new Error(`OpenAI asr ${res.status}: ${detail}`);
        }
        return (await res.json()) as { text?: string };
      },
    },
  };
}

/* -------- the Z.ai voice (CogTTS / GLM-ASR) — the preferred sky ---- */

function zaiAudio(cfg: CloudConfig): AudioEngine {
  return {
    tts: {
      create: async (params: TTSParams) => {
        const speed = typeof params.speed === "number" ? params.speed : 1;
        const input = String(params.input ?? "").slice(0, 4096);
        /* xiaochen / tongtong are CogTTS's own voices — they pass
           through untouched; any foreign name falls back to the
           warm documentary male */
        const voice =
          params.voice === "tongtong"
            ? "tongtong"
            : params.voice === "xiaochen"
              ? "xiaochen"
              : "xiaochen";
        const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: ZAI_TTS_MODEL,
            input,
            voice,
            speed,
            response_format: "wav",
          }),
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 300);
          throw new Error(`Z.ai tts ${res.status}: ${detail}`);
        }
        const buf = await res.arrayBuffer();
        return { arrayBuffer: async () => buf };
      },
    },
    asr: {
      create: async (params: ASRParams) => {
        const bytes = Buffer.from(params.file_base64, "base64");
        const ext = audioExtension(params.mime);
        const mime = params.mime || "audio/wav";
        const form = new FormData();
        form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
        form.append("model", ZAI_ASR_MODEL);
        const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.apiKey}` },
          body: form,
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 300);
          throw new Error(`Z.ai asr ${res.status}: ${detail}`);
        }
        return (await res.json()) as { text?: string };
      },
    },
  };
}

/* the voice chain — every configured sky is tried in order; the first
   that sings wins. Z.ai first (the house voice), OpenAI as the quiet
   safety net so the LISTEN never dies. */
function chainAudio(engines: AudioEngine[]): AudioEngine {
  return {
    tts: {
      create: async (params: TTSParams) => {
        let lastError: unknown = null;
        for (const engine of engines) {
          try {
            return await engine.tts.create(params);
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError ?? new Error("no voice sky answered");
      },
    },
    asr: {
      create: async (params: ASRParams) => {
        let lastError: unknown = null;
        for (const engine of engines) {
          try {
            return await engine.asr.create(params);
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError ?? new Error("no ear answered");
      },
    },
  };
}

interface CloudConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** The model that sees uploaded images (vision gift). */
  visionModel?: string;
  /** Whether the endpoint accepts GLM's `thinking` parameter. */
  allowThinking?: boolean;
  /** Human name used in error messages. */
  label: string;
}

const CLOUD_TIMEOUT_MS = 300_000;

function zaiCloudConfig(): CloudConfig | null {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.ZAI_BASE_URL ?? "https://api.z.ai/api/paas/v4"
    ).replace(/\/$/, ""),
    model: process.env.ZAI_MODEL ?? "glm-4.5-flash",
    visionModel: process.env.ZAI_VISION_MODEL ?? "glm-4.6v",
    allowThinking: true,
    label: "Z.ai",
  };
}

function openaiConfig(): CloudConfig | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    allowThinking: false,
    label: "OpenAI",
  };
}

export type Provider = "zai-cloud" | "openai" | "zai";

export function resolveProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER;
  if (explicit === "zai-cloud" || explicit === "openai" || explicit === "zai") {
    return explicit;
  }
  /* in the cloud the Z.ai sky is the default — the same brains as the
     laboratory; OpenAI serves only when it is the sole key */
  if (process.env.VERCEL) {
    if (process.env.ZAI_API_KEY) return "zai-cloud";
    if (process.env.OPENAI_API_KEY) return "openai";
  }
  return "zai";
}

/* ------------------------- the bridge ---------------------------- */

/* ---- the patient messenger --------------------------------------- */
/*  The shared skies sometimes answer 429 ("too many requests") or a
    brief 5xx storm. Instead of letting every chat die on the first
    refusal, we wait a breath and ask again — three patient retries
    with growing pauses, so the channels stay alive.               */
const RETRY_DELAYS_MS = [1400, 3200, 6400];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|too many requests|rate.?limit|\b50[234]\b|overloaded|temporarily unavailable|ECONNRESET|ECONNABORTED|ETIMEDOUT|network|fetch failed/i.test(
    msg
  );
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === RETRY_DELAYS_MS.length || !isTransientError(err)) {
        throw err;
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw lastError ?? new Error("the sky never answered");
}

/* ------------------------- the cloud sky --------------------------- */

class CloudBackend implements ZAIClient {
  /* the voice rides the Z.ai sky first (CogTTS — the house voices
     xiaochen and tongtong are its own), and OpenAI stands behind it
     as the quiet safety net — independent of which brain chats */
  constructor(
    private readonly cfg: CloudConfig,
    private readonly audioCfg: CloudConfig | null
  ) {}

  private async complete(
    params: ChatParams,
    modelOverride?: string
  ): Promise<ChatCompletion> {
    const body: Record<string, unknown> = {
      model: modelOverride ?? this.cfg.model,
      messages: params.messages,
    };
    if (typeof params.max_tokens === "number") {
      body.max_tokens = params.max_tokens;
    }
    if (typeof params.temperature === "number") {
      body.temperature = params.temperature;
    }
    /* GLM accepts its `thinking` knob natively; OpenAI does not */
    if (this.cfg.allowThinking && params.thinking !== undefined) {
      body.thinking = params.thinking;
    }

    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400);
      throw new Error(`${this.cfg.label} chat ${res.status}: ${detail}`);
    }
    return (await res.json()) as ChatCompletion;
  }

  private completeWithPatience(
    params: ChatParams,
    modelOverride?: string
  ): Promise<ChatCompletion> {
    return withRetry(() => this.complete(params, modelOverride));
  }

  chat = {
    completions: {
      create: (params: ChatParams) => this.completeWithPatience(params),
      /* the vision call rides the same endpoint on the dedicated
         vision model (glm-4.6v on the Z.ai sky, the chat model
         itself on OpenAI) */
      createVision: (params: ChatParams) =>
        this.completeWithPatience(params, this.cfg.visionModel),
    },
  };

  get audio(): AudioEngine {
    const engines: AudioEngine[] = [];
    /* the Z.ai sky sings first whenever it is the brain itself */
    if (this.cfg.label === "Z.ai") engines.push(zaiAudio(this.cfg));
    if (this.audioCfg && this.audioCfg !== this.cfg)
      engines.push(openAIAudio(this.audioCfg));
    else if (this.cfg.label === "OpenAI") engines.push(openAIAudio(this.cfg));
    if (engines.length === 0)
      throw new Error(
        "Voice (tts/asr) on the cloud needs a key — set ZAI_API_KEY (CogTTS, the house voice) or OPENAI_API_KEY in Vercel's Environment Variables."
      );
    return chainAudio(engines);
  }
}

/* ------------------------- the atelier sky ------------------------- */

async function atelierBackend(): Promise<ZAIClient> {
  const sdk = await import("z-ai-web-dev-sdk");
  const client = (await sdk.default.create()) as unknown as ZAIClient;
  /* the patient messenger — the atelier's shared sky sometimes answers
     429 (too many requests); we wait a breath and ask again so every
     channel keeps responding */
  const originalCreate = client.chat.completions.create.bind(
    client.chat.completions
  );
  const originalVision = client.chat.completions.createVision?.bind(
    client.chat.completions
  );
  client.chat.completions.create = (params: ChatParams) =>
    withRetry(() => originalCreate(params));
  if (originalVision) {
    client.chat.completions.createVision = (params: ChatParams) =>
      withRetry(() => originalVision(params));
  }
  return client;
}

/* --------------------------- the bridge ---------------------------- */

export default class ZAI {
  static async create(): Promise<ZAIClient> {
    const provider = resolveProvider();
    /* the OpenAI key stands BEHIND the Z.ai voice, never in front */
    const audioCfg = openaiConfig();
    if (provider === "zai-cloud") {
      const cfg = zaiCloudConfig();
      if (cfg) return new CloudBackend(cfg, audioCfg);
    }
    if (provider === "openai") {
      const cfg = openaiConfig();
      if (cfg) return new CloudBackend(cfg, null);
    }
    if (!process.env.VERCEL) return atelierBackend();
    /* the cloud can only live from a key — say clearly which one */
    throw new Error(
      "No AI provider is configured on this deployment. Add ZAI_API_KEY (Z.ai — the same GLM brains as the laboratory) or OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
    );
  }
}
