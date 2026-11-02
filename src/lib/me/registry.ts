/* ------------------------------------------------------------------ */
/*  THE MODEL REGISTRY — M.E.'s map of the skies.                      */
/*                                                                     */
/*  A declarative registry of every intelligence task the house        */
/*  serves, the ladder of skies that can carry it (preferred first),   */
/*  and each sky's model. Availability is derived from the vault's     */
/*  key presence — the registry NEVER holds a key. The provider        */
/*  bridge (src/lib/zai-client.ts) remains the only executor; this     */
/*  registry is the policy layer that names tasks, orders skies and    */
/*  documents models for the orchestrator, the capability catalog and  */
/*  the owner's command center.                                        */
/* ------------------------------------------------------------------ */

export type TaskKind =
  | "chat"
  | "chat-sq"
  | "vision"
  | "research"
  | "creative"
  | "science"
  | "knowledge"
  | "image"
  | "tts"
  | "asr"
  | "music"
  | "video";

export type SkyId = "zai-cloud" | "openai" | "gemini" | "atelier";

export interface SkyOption {
  sky: SkyId;
  /** The model this sky serves the task with (env-overridable at the
   *  bridge; the registry mirrors the same defaults for policy). */
  model: string;
  /** The vault key whose presence makes this sky available. */
  keyEnv: string | null;
}

export interface TaskRoute {
  kind: TaskKind;
  /** User-facing name — M.E.'s own voice. */
  label: string;
  description: string;
  /** Preferred order: first available sky leads. */
  ladder: SkyOption[];
  costClass: "free" | "metered" | "heavy";
  typicalTimeoutMs: number;
  /** Whether the answer streams token by token. */
  streams: boolean;
}

const chatLadder = (opts?: { albanianFirst?: boolean }): SkyOption[] => {
  const zai: SkyOption = {
    sky: "zai-cloud",
    model: process.env.ZAI_MODEL ?? "glm-4.5-flash",
    keyEnv: "ZAI_API_KEY",
  };
  const openai: SkyOption = {
    sky: "openai",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    keyEnv: "OPENAI_API_KEY",
  };
  const gemini: SkyOption = {
    sky: "gemini",
    model: process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash",
    keyEnv: "GEMINI_API_KEY",
  };
  const atelier: SkyOption = { sky: "atelier", model: "glm-4.5-flash", keyEnv: null };
  return opts?.albanianFirst
    ? [gemini, zai, openai, atelier]
    : [zai, openai, gemini, atelier];
};

const visionLadder = (): SkyOption[] => [
  { sky: "zai-cloud", model: process.env.ZAI_VISION_MODEL ?? "glm-4.6v", keyEnv: "ZAI_API_KEY" },
  { sky: "gemini", model: process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  { sky: "openai", model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", keyEnv: "OPENAI_API_KEY" },
];

const imageLadder = (): SkyOption[] => [
  { sky: "openai", model: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3", keyEnv: "OPENAI_API_KEY" },
  { sky: "zai-cloud", model: process.env.ZAI_IMAGE_MODEL ?? "cogview-3-flash", keyEnv: "ZAI_API_KEY" },
  { sky: "gemini", model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image", keyEnv: "GEMINI_API_KEY" },
];

export const TASK_ROUTES: Record<TaskKind, TaskRoute> = {
  chat: {
    kind: "chat",
    label: "Mirror Conversation",
    description:
      "M.E.'s everyday voice — reflection, counsel, transmission and every room's conversation.",
    ladder: chatLadder(),
    costClass: "free",
    typicalTimeoutMs: 240_000,
    streams: true,
  },
  "chat-sq": {
    kind: "chat-sq",
    label: "Mirror Conversation (Albanian)",
    description:
      "When the visitor speaks Albanian, M.E. answers through the Gemini sky first.",
    ladder: chatLadder({ albanianFirst: true }),
    costClass: "free",
    typicalTimeoutMs: 240_000,
    streams: true,
  },
  vision: {
    kind: "vision",
    label: "M.E. Vision (sight)",
    description: "M.E. looks at uploaded images and documents through the vision models.",
    ladder: visionLadder(),
    costClass: "free",
    typicalTimeoutMs: 240_000,
    streams: false,
  },
  research: {
    kind: "research",
    label: "M.E. Research",
    description:
      "Long-form treatises and deep presses — the same skies, deeper breaths, larger ceilings.",
    ladder: chatLadder(),
    costClass: "heavy",
    typicalTimeoutMs: 600_000,
    streams: true,
  },
  creative: {
    kind: "creative",
    label: "M.E. Creative",
    description: "Poems, stories, names and looms — the creative weaving of the house.",
    ladder: chatLadder(),
    costClass: "free",
    typicalTimeoutMs: 240_000,
    streams: false,
  },
  science: {
    kind: "science",
    label: "M.E. Science (HyperX)",
    description:
      "HyperX's scientific engine — formulas, papers and the derivation spine.",
    ladder: chatLadder(),
    costClass: "free",
    typicalTimeoutMs: 300_000,
    streams: true,
  },
  knowledge: {
    kind: "knowledge",
    label: "M.E. Knowledge",
    description: "The organized memory — akashic, dream-book and the reading rooms.",
    ladder: chatLadder(),
    costClass: "free",
    typicalTimeoutMs: 240_000,
    streams: false,
  },
  image: {
    kind: "image",
    label: "M.E. Creation (images)",
    description: "The brushes — OpenAI's brush leads, CogView and Gemini stand behind.",
    ladder: imageLadder(),
    costClass: "metered",
    typicalTimeoutMs: 120_000,
    streams: false,
  },
  tts: {
    kind: "tts",
    label: "M.E. Voice (speech)",
    description: "The house voice — only Z.ai's skies are invited to sing.",
    ladder: [
      { sky: "zai-cloud", model: process.env.ZAI_TTS_MODEL ?? "cogtts", keyEnv: "ZAI_API_KEY" },
      { sky: "gemini", model: process.env.GOOGLE_TTS_MODEL ?? "gemini-2.5-flash-preview-tts", keyEnv: "GEMINI_API_KEY" },
    ],
    costClass: "free",
    typicalTimeoutMs: 180_000,
    streams: false,
  },
  asr: {
    kind: "asr",
    label: "M.E. Listening (speech-to-text)",
    description: "The house's ear — transcribing what is spoken to it.",
    ladder: [
      { sky: "zai-cloud", model: process.env.ZAI_ASR_MODEL ?? "glm-asr", keyEnv: "ZAI_API_KEY" },
    ],
    costClass: "free",
    typicalTimeoutMs: 180_000,
    streams: false,
  },
  music: {
    kind: "music",
    label: "M.E. Music (Light Codes)",
    description: "Lyria weaves the light-codes — the music chamber's own sky.",
    ladder: [
      { sky: "gemini", model: process.env.LYRIA_MODEL ?? "lyria-3.5", keyEnv: "GEMINI_API_KEY" },
      { sky: "gemini", model: process.env.LYRIA_PRO_MODEL ?? "lyria-3-pro-preview", keyEnv: "GEMINI_API_KEY" },
    ],
    costClass: "metered",
    typicalTimeoutMs: 300_000,
    streams: false,
  },
  video: {
    kind: "video",
    label: "M.E. Motion (video)",
    description: "Generative motion — clips woven by the SDK's video engine.",
    ladder: [{ sky: "atelier", model: "video-generation", keyEnv: null }],
    costClass: "heavy",
    typicalTimeoutMs: 600_000,
    streams: false,
  },
};

/** Is a sky's key standing in the vault? (The atelier SDK is always
 *  present in the laboratory; in the cloud only keyed skies stand.) */
export function skyAvailable(option: SkyOption): boolean {
  if (option.sky === "atelier") return !process.env.VERCEL;
  if (!option.keyEnv) return true;
  const key = process.env[option.keyEnv];
  return Boolean(key && key.trim());
}

/** The resolved ladder for a task — only skies that can actually
 *  stand, preferred order kept. */
export function resolveLadder(kind: TaskKind, language?: string): SkyOption[] {
  let resolved =
    kind === "chat" && (language ?? "en").toLowerCase() === "sq"
      ? resolveLadder("chat-sq")
      : TASK_ROUTES[kind].ladder;
  return resolved.filter(skyAvailable);
}

/** The public catalog — what /api/capabilities and the command center
 *  show. Never carries a key, a URL or a credential. */
export function taskCatalog(): Array<{
  kind: TaskKind;
  label: string;
  description: string;
  costClass: string;
  streams: boolean;
  skies: Array<{ sky: SkyId; model: string; available: boolean }>;
}> {
  return (Object.keys(TASK_ROUTES) as TaskKind[]).map((kind) => {
    const route = TASK_ROUTES[kind];
    return {
      kind,
      label: route.label,
      description: route.description,
      costClass: route.costClass,
      streams: route.streams,
      skies: route.ladder.map((o) => ({ sky: o.sky, model: o.model, available: skyAvailable(o) })),
    };
  });
}
