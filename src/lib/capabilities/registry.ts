/* ------------------------------------------------------------------ */
/*  THE CAPABILITY REGISTRY — the house's own toolbox, kept honest.    */
/*                                                                     */
/*  One register call per capability; every contract states its real   */
/*  dependencies and its real status. The engine (and the Mirror) may  */
/*  only wield what stands as "available". A capability that lacks its */
/*  dependencies says so plainly — the house never promises what it    */
/*  cannot do (directive 01: "Do not claim that an operation is        */
/*  possible until its dependencies are available and tested").        */
/*                                                                     */
/*  Free-first by law: every available capability rides the house's    */
/*  own sky or the visitor's own device. No new paid service stands    */
/*  behind anything here.                                              */
/* ------------------------------------------------------------------ */

import type { CapabilityContract } from "./types";

const REGISTRY = new Map<string, CapabilityContract>();

function register(c: CapabilityContract): void {
  REGISTRY.set(c.id, c);
}

/* --------------------- the making capabilities ---------------------- */

register({
  id: "create.video.motion",
  name: "Motion Picture Studio",
  description:
    "Turns a subject into a narrated motion film: a planned storyboard of animated scenes — the house's own scene templates — spoken over by the Mirror's voice, assembled and exported on the visitor's own device.",
  operations: ["plan", "narrate", "assemble", "export"],
  input: {
    kind: "object",
    fields: {
      topic: "string — what the film is about",
      sceneCount: "3..6",
      mode: '"motion"',
      sourceConvId: "string?",
    },
  },
  output: {
    kind: "object",
    fields: {
      plan: "WorkflowPlan with storyboard",
      artifact: "video file (mp4/webm) + metadata",
    },
  },
  permissions: ["conversation.read", "voice.speak", "assets.write.device"],
  runtime: "server+browser",
  dependencies: ["zai.llm", "zai.tts", "browser.canvas", "browser.mediaRecorder"],
  hardware: "cpu",
  cost: {
    tier: "free",
    note: "One planning call + one narration call per scene, at conversation pace; the assembly happens on the visitor's device.",
  },
  timeoutMs: 240_000,
  progress: true,
  cancellable: true,
  retries: 1,
  version: "1.0.0",
  status: "available",
});

register({
  id: "create.video.generative",
  name: "Generative Cinema (experimental)",
  description:
    "Creates short sky-made film clips — one per storyboard scene — through the house's own video model, then narrates and assembles them like the motion studio. Each clip is five to ten seconds; the model runs behind the house's sky, not in the browser.",
  operations: ["generate-clip", "plan", "narrate", "assemble"],
  input: {
    kind: "object",
    fields: {
      topic: "string",
      sceneCount: "2..4 recommended — every clip is a real generation",
      mode: '"generative"',
    },
  },
  output: {
    kind: "object",
    fields: { clips: "scene video urls", artifact: "assembled film" },
  },
  permissions: ["conversation.read", "voice.speak", "assets.write.device"],
  runtime: "server+browser",
  dependencies: ["zai.llm", "zai.tts", "zai.video", "browser.canvas", "browser.mediaRecorder"],
  hardware: "gpu-behind-service",
  cost: {
    tier: "heavy",
    note: "Each scene is a real diffusion-grade generation — expect tens of seconds per clip and honest energy cost. Falls back to the motion template if a clip cannot be gathered.",
  },
  timeoutMs: 480_000,
  progress: true,
  cancellable: true,
  retries: 0,
  version: "0.9.0",
  status: "available",
  note: "Experimental: clip generation rides the same sky as the house's words; long waits are normal and reported honestly.",
});

register({
  id: "create.image",
  name: "The Higher Self's Brush",
  description:
    "Paints images from words through the house's existing image engine (the visitor's own Higher Self as the painter).",
  operations: ["generate"],
  input: { kind: "object", fields: { prompt: "string" } },
  output: { kind: "object", fields: { image: "png data / url" } },
  permissions: ["assets.write"],
  runtime: "server",
  dependencies: ["zai.image"],
  hardware: "gpu-behind-service",
  cost: { tier: "metered", note: "Rides the house's image energy law." },
  timeoutMs: 120_000,
  progress: false,
  cancellable: false,
  retries: 1,
  version: "1.0.0",
  status: "available",
});

register({
  id: "create.book",
  name: "The Dream Loom",
  description:
    "Weaves full-length books page by page through the existing Dream Book atelier — the visitor names the length, the loom channels the volume.",
  operations: ["weave", "channel-more"],
  input: { kind: "object", fields: { topic: "string", pages: "20..300" } },
  output: { kind: "object", fields: { volume: "paged book" } },
  permissions: ["conversation.read"],
  runtime: "server+browser",
  dependencies: ["zai.llm"],
  hardware: "cpu",
  cost: { tier: "free", note: "Conversation pace." },
  timeoutMs: 600_000,
  progress: true,
  cancellable: true,
  retries: 1,
  version: "1.0.0",
  status: "available",
});

register({
  id: "create.music",
  name: "The Light Codes Chamber",
  description:
    "Turns a feeling or intention into sound through the existing music chamber — interpretation in, transmission out.",
  operations: ["compose"],
  input: { kind: "object", fields: { intention: "string" } },
  output: { kind: "object", fields: { track: "audio + visual codes" } },
  permissions: [],
  runtime: "server+browser",
  dependencies: ["zai.llm", "browser.webAudio"],
  hardware: "cpu",
  cost: { tier: "free", note: "Conversation pace." },
  timeoutMs: 120_000,
  progress: false,
  cancellable: false,
  retries: 1,
  version: "1.0.0",
  status: "available",
});

register({
  id: "create.voice",
  name: "The House's Voice",
  description:
    "Speaks words aloud through the house's own narration voice (server-side TTS, WAV out) — the same voice every transmission may wear.",
  operations: ["speak"],
  input: { kind: "object", fields: { text: "string ≤ ~4000 chars" } },
  output: { kind: "object", fields: { audio: "wav" } },
  permissions: ["voice.speak"],
  runtime: "server",
  dependencies: ["zai.tts"],
  hardware: "cpu",
  cost: { tier: "metered", note: "Per spoken chunk." },
  timeoutMs: 120_000,
  progress: false,
  cancellable: false,
  retries: 1,
  version: "1.0.0",
  status: "available",
});

register({
  id: "visualize.concept",
  name: "The Visual Intelligence Engine",
  description:
    "Derives a validated visual specification from a transmission — subject, entities, relationships, labels — and renders it as an animated 2D or 3D explanation from the curated template registry. Never random geometry; the scene is grounded in the words.",
  operations: ["analyze", "render-2d", "render-3d"],
  input: { kind: "object", fields: { text: "the transmission" } },
  output: { kind: "object", fields: { spec: "VisualSpec", scene: "svg or webgl" } },
  permissions: [],
  runtime: "server+browser",
  dependencies: ["zai.llm", "browser.svg", "browser.webgl"],
  hardware: "cpu",
  cost: { tier: "free", note: "One analysis per unseen transmission, cached." },
  timeoutMs: 60_000,
  progress: false,
  cancellable: false,
  retries: 0,
  version: "1.1.0",
  status: "available",
});

register({
  id: "create.3d_scene",
  name: "The Living Scenes (3D)",
  description:
    "Renders explorable three-dimensional explanations from the curated template builders (helix, pyramids, orbits, lattice…). Procedural and parameter-driven — not arbitrary text-to-3D assets.",
  operations: ["render", "orbit", "reset"],
  input: { kind: "object", fields: { spec: "VisualSpec" } },
  output: { kind: "object", fields: { scene: "interactive webgl" } },
  permissions: [],
  runtime: "browser",
  dependencies: ["browser.webgl", "three.js"],
  hardware: "cpu",
  cost: { tier: "free", note: "Runs on the visitor's device; rests when unseen." },
  timeoutMs: 30_000,
  progress: false,
  cancellable: false,
  retries: 0,
  version: "1.0.0",
  status: "available",
  note: "GLB/glTF export is not part of this contract yet.",
});

register({
  id: "analyze.document",
  name: "The Document Reader",
  description: "Reads uploaded documents into the conversation through the existing parsing door.",
  operations: ["parse"],
  input: { kind: "object", fields: { file: "pdf/docx/txt" } },
  output: { kind: "object", fields: { text: "string" } },
  permissions: ["files.read"],
  runtime: "server",
  dependencies: ["parse-doc route"],
  hardware: "cpu",
  cost: { tier: "free", note: "Conversation pace." },
  timeoutMs: 60_000,
  progress: false,
  cancellable: false,
  retries: 0,
  version: "1.0.0",
  status: "available",
});

/* -------------- registered contracts, honestly not yet real --------- */

register({
  id: "render.server",
  name: "Server-Side Film Renderer",
  description:
    "Frame-exact server rendering and MP4 mastering of assembled films (an ffmpeg worker). The renderer exists in the development sandbox, but the house's cloud (serverless functions) carries no persistent media worker — so this capability does not claim availability in production.",
  operations: ["render", "master"],
  input: { kind: "object", fields: { plan: "WorkflowPlan" } },
  output: { kind: "object", fields: { file: "mp4" } },
  permissions: ["assets.write"],
  runtime: "server",
  dependencies: ["ffmpeg", "persistent media worker"],
  hardware: "cpu",
  cost: { tier: "heavy", note: "Requires a self-hosted or container worker." },
  timeoutMs: 600_000,
  progress: true,
  cancellable: true,
  retries: 0,
  version: "0.0.0",
  status: "unavailable",
  note: "Truth: ffmpeg was verified present in the development sandbox; the production cloud has no media worker. The browser assembly path carries the work today.",
});

register({
  id: "create.application",
  name: "The App Forge",
  description:
    "Generates and previews small applications inside isolated, sandboxed previews.",
  operations: ["scaffold", "preview"],
  input: { kind: "object", fields: { request: "string" } },
  output: { kind: "object", fields: { app: "sandboxed preview" } },
  permissions: ["sandbox.execute"],
  runtime: "browser",
  dependencies: ["sandboxed iframe runner", "content safety review"],
  hardware: "cpu",
  cost: { tier: "free", note: "Unspecified until the sandbox exists." },
  timeoutMs: 120_000,
  progress: false,
  cancellable: false,
  retries: 0,
  version: "0.0.0",
  status: "unavailable",
  note: "Registered as a contract only — the isolated execution sandbox is not built. Nothing is improvised from user prompts.",
});

register({
  id: "simulate.system",
  name: "The Simulation Bench",
  description: "Runs small physical or conceptual simulations with typed inputs and readouts.",
  operations: ["run"],
  input: { kind: "object", fields: { system: "typed simulation spec" } },
  output: { kind: "object", fields: { result: "series / readout" } },
  permissions: [],
  runtime: "browser",
  dependencies: ["simulation registry (future)"],
  hardware: "cpu",
  cost: { tier: "free", note: "Unspecified until a registry exists." },
  timeoutMs: 60_000,
  progress: false,
  cancellable: false,
  retries: 0,
  version: "0.0.0",
  status: "unavailable",
  note: "A seat reserved at the table — no simulation engine is registered yet.",
});

/* --------------------------- the registry --------------------------- */

export function getCapability(id: string): CapabilityContract | undefined {
  return REGISTRY.get(id);
}

export function listCapabilities(): CapabilityContract[] {
  return [...REGISTRY.values()];
}

/** The engine's own gate — a capability may only be wielded when it
 *  truly stands available (directive 02's distinction, enforced). */
export function assertAvailable(id: string): CapabilityContract {
  const c = REGISTRY.get(id);
  if (!c) throw new Error(`Unknown capability: ${id}`);
  if (c.status !== "available") {
    throw new Error(
      `Capability ${id} is ${c.status}${c.note ? ` — ${c.note}` : ""}`
    );
  }
  return c;
}

/** The browser's own half of the dependency check — the assembly law. */
export function browserSupportsAssembly(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder === "function" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function"
  );
}
