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
/*  Audio (tts/asr) remains an atelier gift — it fails with a clear   */
/*  voice on the cloud skies.                                         */
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

/* ------------------------- the cloud sky --------------------------- */

class CloudBackend implements ZAIClient {
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

  chat = {
    completions: {
      create: (params: ChatParams) => this.complete(params),
      /* the vision call rides the same endpoint on the dedicated
         vision model (glm-4.6v on the Z.ai sky, the chat model
         itself on OpenAI) */
      createVision: (params: ChatParams) =>
        this.complete(params, this.cfg.visionModel),
    },
  };

  get audio(): never {
    throw new Error(
      "Audio (tts/asr) is only available with the atelier provider (LLM_PROVIDER=zai, laboratory)."
    );
  }
}

/* ------------------------- the atelier sky ------------------------- */

async function atelierBackend(): Promise<ZAIClient> {
  const sdk = await import("z-ai-web-dev-sdk");
  const client = await sdk.default.create();
  /* the atelier's client is the original shape — trust it */
  return client as unknown as ZAIClient;
}

/* --------------------------- the bridge ---------------------------- */

export default class ZAI {
  static async create(): Promise<ZAIClient> {
    const provider = resolveProvider();
    if (provider === "zai-cloud") {
      const cfg = zaiCloudConfig();
      if (cfg) return new CloudBackend(cfg);
    }
    if (provider === "openai") {
      const cfg = openaiConfig();
      if (cfg) return new CloudBackend(cfg);
    }
    if (!process.env.VERCEL) return atelierBackend();
    /* the cloud can only live from a key — say clearly which one */
    throw new Error(
      "No AI provider is configured on this deployment. Add ZAI_API_KEY (Z.ai — the same GLM brains as the laboratory) or OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
    );
  }
}
