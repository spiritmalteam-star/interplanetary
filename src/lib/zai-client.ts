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
/*  Audio (tts/asr) sings ONLY on the Z.ai sky (CogTTS / GLM-ASR —     */
/*  the house voices xiaochen and tongtong are its own). The house     */
/*  voice is the one and only reader — no other choir stands behind.   */
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
  /** e.g. "audio/webm" — decides the extension of the uploaded file */
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

/* The voice model knobs — see zaiAudio(): unset by default (the
   SDK-contract paths let the sky serve its own default model). */

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

/* ------- the Z.ai voice (CogTTS / GLM-ASR) — the ONLY voice -------- */
/*  CONTRACT — verified against the z-ai-web-dev-sdk (the source of
    truth, it sings in the laboratory):
      tts → POST {base}/audio/tts   JSON {input, voice, speed,
            response_format, stream} — the model is the sky's OWN
            default (the SDK sends none); the answer is raw WAV bytes.
      asr → POST {base}/audio/asr   JSON {file_base64} — the answer is
            JSON {text}.
    The old OpenAI-style paths (/audio/speech, /audio/transcriptions)
    still exist on some skies, but only with explicit model codes —
    and the house codes (cogtts / glm-asr) are UNKNOWN there, which
    silenced the production voice (gateway error 1211). So: the SDK
    contract sings first; the OpenAI-compatible paths remain only as
    a stepped-down fallback for a sky that lacks the SDK paths.     */

const AUDIO_RETRY_DELAYS_MS = [800, 2000];

/** gateway code 1211 — "this sky does not know that model code" */
function isUnknownModel(status: number, detail: string): boolean {
  return status === 400 && /1211|unknown model/i.test(detail);
}

/** a path the sky itself does not serve (router said so) */
function isMissingPath(status: number): boolean {
  return status === 404 || status === 405;
}

function zaiAudio(cfg: CloudConfig): AudioEngine {
  /* the knobs — unset by default; the SDK-contract paths need no
     model. Set ZAI_TTS_MODEL / ZAI_ASR_MODEL only when a sky demands
     an explicit code. */
  const ttsModel = process.env.ZAI_TTS_MODEL?.trim() || null;
  const asrModel = process.env.ZAI_ASR_MODEL?.trim() || null;

  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "X-Z-AI-From": "Z", // the SDK marks every request this way
  };

  function postJson(path: string, body: unknown): Promise<Response> {
    return fetch(`${cfg.baseUrl}${path}`, {
      method: "POST",
      headers: { ...baseHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
  }

  async function errorDetail(res: Response): Promise<string> {
    return (await res.text()).slice(0, 300);
  }

  /* Most skies answer the voice as raw WAV bytes; some wrap the same
     bytes as base64 inside JSON. Accept both, hand back bytes. */
  async function voiceBytes(res: Response): Promise<ArrayBuffer> {
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (ct.includes("application/json")) {
      const data = (await res.json().catch(() => null)) as Record<string, any>;
      const inner = data?.data;
      const b64 =
        (Array.isArray(inner) ? inner[0]?.b64 ?? inner[0]?.audio : undefined) ??
        data?.audio ??
        data?.b64 ??
        data?.base64 ??
        (typeof data?.data === "string" ? data.data : undefined);
      if (typeof b64 === "string" && b64.length > 0) {
        const bytes = Buffer.from(b64.replace(/^data:[^,]*,/, ""), "base64");
        /* a true ArrayBuffer slice — the route reads it with Uint8Array */
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
      }
      throw new Error("the synthesis answered without audio bytes");
    }
    return res.arrayBuffer();
  }

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

        const attemptTts = (withModel: boolean) => {
          const body: Record<string, unknown> = {
            input,
            voice,
            speed,
            response_format: "wav",
            stream: false,
          };
          const model = withModel
            ? (ttsModel ?? "cogtts")
            : ttsModel;
          if (model) body.model = model;
          return withRetry(() => postJson("/audio/tts", body), AUDIO_RETRY_DELAYS_MS);
        };

        /* 1st — the SDK's own contract, no forced model code */
        let res = await attemptTts(false);
        if (!res.ok) {
          const detail = await errorDetail(res);
          if (isMissingPath(res.status)) {
            /* stepped-down sky: the OpenAI-compatible speech path,
               which speaks only by explicit model code */
            res = await withRetry(
              () =>
                postJson("/audio/speech", {
                  model: ttsModel ?? "cogtts",
                  input,
                  voice,
                  speed,
                  response_format: "wav",
                }),
              AUDIO_RETRY_DELAYS_MS
            );
          } else if (isUnknownModel(res.status, detail)) {
            /* the path exists but this sky wants a model code named */
            res = await attemptTts(true);
          }
          if (!res.ok) {
            throw new Error(`Z.ai tts ${res.status}: ${await errorDetail(res)}`);
          }
        }
        const buf = await voiceBytes(res);
        return { arrayBuffer: async () => buf };
      },
    },
    asr: {
      create: async (params: ASRParams) => {
        const bytes = Buffer.from(params.file_base64, "base64");
        const ext = audioExtension(params.mime);
        const mime = params.mime || "audio/wav";

        const parseText = async (r: Response): Promise<{ text?: string }> => {
          const data = (await r.json().catch(() => null)) as {
            text?: string;
          } | null;
          return { text: data?.text ?? "" };
        };

        const attemptAsr = (withModel: boolean) => {
          const body: Record<string, unknown> = {
            file_base64: params.file_base64,
          };
          const model = withModel ? (asrModel ?? "glm-asr-2512") : asrModel;
          if (model) body.model = model;
          return withRetry(() => postJson("/audio/asr", body), AUDIO_RETRY_DELAYS_MS);
        };

        /* 1st — the SDK's own contract: JSON, base64 inside, no forced
           model code */
        let res = await attemptAsr(false);
        if (!res.ok) {
          const detail = await errorDetail(res);
          if (isMissingPath(res.status)) {
            /* stepped-down sky: the documented public transcription
               path (multipart, explicit model code) */
            const form = new FormData();
            form.append("file", new Blob([bytes], { type: mime }), `audio.${ext}`);
            form.append("model", asrModel ?? "glm-asr-2512");
            form.append("stream", "false");
            res = await withRetry(
              () =>
                fetch(`${cfg.baseUrl}/audio/transcriptions`, {
                  method: "POST",
                  headers: baseHeaders, // the form carries its own boundary
                  body: form,
                  signal: AbortSignal.timeout(180_000),
                }),
              AUDIO_RETRY_DELAYS_MS
            );
          } else if (isUnknownModel(res.status, detail)) {
            /* the path exists but this sky wants a model code named */
            res = await attemptAsr(true);
          }
        }
        if (!res.ok) {
          throw new Error(`Z.ai asr ${res.status}: ${await errorDetail(res)}`);
        }
        return await parseText(res);
      },
    },
  };
}

/* the voice chain — one sky only: the house voice. The first that
   sings wins, and only Z.ai is invited to sing. */
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
const RETRY_DELAYS_MS = [1500, 3500, 7000, 12000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b|too many requests|rate.?limit|\b50[234]\b|overloaded|temporarily unavailable|ECONNRESET|ECONNABORTED|ETIMEDOUT|network|fetch failed/i.test(
    msg
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  delays: number[] = RETRY_DELAYS_MS
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === delays.length || !isTransientError(err)) {
        throw err;
      }
      await sleep(delays[attempt]);
    }
  }
  throw lastError ?? new Error("the sky never answered");
}

/* ------------------------- the cloud sky --------------------------- */

class CloudBackend implements ZAIClient {
  /* the voice rides the Z.ai sky alone (CogTTS — the house voices
     xiaochen and tongtong are its own) — independent of which brain
     chats */
  constructor(private readonly cfg: CloudConfig) {}

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
    /* the house voice is the ONLY reader — when the Z.ai sky is not
       the one behind this brain, the voice politely declines rather
       than letting a stranger's choir sing */
    if (this.cfg.label !== "Z.ai")
      throw new Error(
        "Voice (tts/asr) speaks only through Z.ai — set ZAI_API_KEY (CogTTS, the house voice) in Vercel's Environment Variables."
      );
    return chainAudio([zaiAudio(this.cfg)]);
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
  /* the voice gets the same patience — the shared atelier sky 429s on
     bursts of long narrations; two short retries (never on validation
     errors) keep a 14-chunk transmission from dying on one breath */
  const originalTts = client.audio?.tts?.create?.bind(client.audio.tts);
  const originalAsr = client.audio?.asr?.create?.bind(client.audio.asr);
  if (originalTts) {
    client.audio.tts.create = (params: TTSParams) =>
      withRetry(() => originalTts(params), AUDIO_RETRY_DELAYS_MS);
  }
  if (originalAsr) {
    client.audio.asr.create = (params: ASRParams) =>
      withRetry(() => originalAsr(params), AUDIO_RETRY_DELAYS_MS);
  }
  return client;
}

/* --------------------------- the bridge ---------------------------- */

/* ---- the chained skies -------------------------------------------- */
/*  When the first sky has spent every patient retry on a rate limit
    or a quota wall, a second configured sky carries the words so the
    channel never dies. The first sky always stays the voice of the
    house; the second only catches what would otherwise be silence. */
const FALLBACK_TRIGGER =
  /\b429\b|too many requests|rate.?limit|quota|exceeded|\b50[034]\b|overloaded/i;

function skyRefused(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return FALLBACK_TRIGGER.test(msg);
}

function chainChatBackends(primary: ZAIClient, fallback: ZAIClient): ZAIClient {
  const withFallback = async (
    run: (sky: ZAIClient) => Promise<ChatCompletion>
  ): Promise<ChatCompletion> => {
    try {
      return await run(primary);
    } catch (err) {
      if (skyRefused(err)) return run(fallback);
      throw err;
    }
  };
  return {
    chat: {
      completions: {
        create: (params: ChatParams) =>
          withFallback((sky) => sky.chat.completions.create(params)),
        createVision: (params: ChatParams) =>
          withFallback((sky) => sky.chat.completions.createVision(params)),
      },
    },
    audio: primary.audio,
  };
}

/* the bridge */

export default class ZAI {
  static async create(): Promise<ZAIClient> {
    const provider = resolveProvider();
    if (provider === "zai-cloud") {
      const cfg = zaiCloudConfig();
      if (cfg) {
        const primary = new CloudBackend(cfg);
        /* the quiet second brain — when Z.ai's quota is spent after
           every patient retry, the OpenAI-compatible sky (if a key
           exists) carries the words so the chats keep responding.
           The voice never rides this second sky — only the house
           voice (Z.ai) reads aloud. */
        const secondSky = openaiConfig();
        if (secondSky) {
          return chainChatBackends(primary, new CloudBackend(secondSky));
        }
        return primary;
      }
    }
    if (provider === "openai") {
      const cfg = openaiConfig();
      if (cfg) {
        const primary = new CloudBackend(cfg);
        const secondSky = zaiCloudConfig();
        if (secondSky) {
          return chainChatBackends(primary, new CloudBackend(secondSky));
        }
        return primary;
      }
    }
    if (!process.env.VERCEL) {
      /* the atelier — and, when the laboratory holds a cloud key, the
         quiet second sky behind it for the exhausted-quota moments */
      const atelier = await atelierBackend();
      const secondSky = zaiCloudConfig() ?? openaiConfig();
      if (secondSky) {
        return chainChatBackends(atelier, new CloudBackend(secondSky));
      }
      return atelier;
    }
    /* the cloud can only live from a key — say clearly which one */
    throw new Error(
      "No AI provider is configured on this deployment. Add ZAI_API_KEY (Z.ai — the same GLM brains as the laboratory) or OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
    );
  }
}
