/* ================================================================== */
/*  THE PROVIDER BRIDGE — one interface, two skies                     */
/*                                                                    */
/*  Every world speaks through `ZAI.create()` — inside the            */
/*  laboratory (this sandbox) that is the z-ai-web-dev-sdk atelier;   */
/*  when the laboratory travels to the cloud (Vercel), the very same  */
/*  interface is served by an OpenAI-compatible endpoint instead.     */
/*                                                                    */
/*  Provider selection:                                               */
/*    LLM_PROVIDER=openai  → OpenAI-compatible endpoint               */
/*    LLM_PROVIDER=zai     → the z-ai-web-dev-sdk atelier             */
/*    unset                → openai on Vercel (when OPENAI_API_KEY    */
/*                            exists), otherwise zai                  */
/*                                                                    */
/*  The OpenAI path speaks exactly the shapes the routes already      */
/*  use: OpenAI-style messages (including multimodal image_url        */
/*  parts), max_tokens, and { choices: [{ message, finish_reason }] } */
/*  replies. `thinking` is a z-ai notion and is not forwarded.        */
/*                                                                    */
/*  Audio (tts/asr) remains an atelier gift — it is only available    */
/*  on the zai provider and fails with a clear voice elsewhere.       */
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
      /* the vision gift — one image seen (OpenAI path: the same
         multimodal chat, the configured model sees the image) */
      createVision(params: ChatParams): Promise<ChatCompletion>;
    };
  };
  audio: any;
}

interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const OPENAI_TIMEOUT_MS = 300_000;

function openaiConfig(): OpenAIConfig | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

export function resolveProvider(): "openai" | "zai" {
  const explicit = process.env.LLM_PROVIDER;
  if (explicit === "openai" || explicit === "zai") return explicit;
  /* on Vercel the cloud sky is the default — one key and every world lives */
  if (process.env.VERCEL && process.env.OPENAI_API_KEY) return "openai";
  return "zai";
}

/* ------------------------ the OpenAI sky --------------------------- */

class OpenAIBackend implements ZAIClient {
  constructor(private readonly cfg: OpenAIConfig) {}

  private async complete(params: ChatParams): Promise<ChatCompletion> {
    const body: Record<string, unknown> = {
      model: this.cfg.model,
      messages: params.messages,
    };
    if (typeof params.max_tokens === "number") {
      body.max_tokens = params.max_tokens;
    }
    if (typeof params.temperature === "number") {
      body.temperature = params.temperature;
    }

    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 400);
      throw new Error(`OpenAI chat ${res.status}: ${detail}`);
    }
    return (await res.json()) as ChatCompletion;
  }

  chat = {
    completions: {
      /* the vision call is the same multimodal completion on the cloud sky */
      create: (params: ChatParams) => this.complete(params),
      createVision: (params: ChatParams) => this.complete(params),
    },
  };

  get audio(): never {
    throw new Error(
      "Audio (tts/asr) is only available with the z-ai provider (LLM_PROVIDER=zai)."
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
    if (resolveProvider() === "openai") {
      const cfg = openaiConfig();
      if (cfg) return new OpenAIBackend(cfg);
    }
    return atelierBackend();
  }
}
