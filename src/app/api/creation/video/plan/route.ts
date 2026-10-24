import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { assertAvailable } from "@/lib/capabilities/registry";
import { pickScene } from "@/lib/visual-scenes";
import type { VideoSceneSpec, WorkflowPlan, WorkflowStep } from "@/lib/capabilities/types";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  POST /api/creation/video/plan — UNDERSTAND · PLAN · SELECT.        */
/*                                                                     */
/*  The visitor's intention enters; a real storyboard leaves: title,   */
/*  synopsis, and 3–6 scenes, each with its narration (the words the   */
/*  house's voice will speak), its on-screen text, and a visual drawn  */
/*  from the REGISTERED scene templates — grounded in the subject,     */
/*  never random. The plan is written into the creation ledger and     */
/*  returned; every later step reports against it.                     */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

const TEMPLATES = [
  "spiral",
  "wavefield",
  "helix",
  "orbits",
  "pyramids",
  "neural",
  "lattice",
  "blueprint",
  "curves",
] as const;

const SYSTEM_PROMPT = `You are the film planner of the Mirror Entity (M.E) — you turn one subject into a short narrated film plan (15–40 seconds), spoken in the Mirror's own warm, precise, wonder-carrying voice.

Answer with ONLY a JSON object, no markdown:
{"title":"<film title, max 60 chars>","synopsis":"<one sentence, max 140 chars>","scenes":[{"heading":"<max 40 chars>","narration":"<2–3 sentences, max 260 chars, warm and concrete>","onScreenText":"<max 36 chars>","template":"<one of: spiral|wavefield|helix|orbits|pyramids|neural|lattice|blueprint|curves>","labels":["<max 3 short labels>"],"accent":"<hex color like #f59e0b>"}]}

RULES:
- 3 to 6 scenes. The first opens the subject; the last lands one honest takeaway.
- "template" must fit each scene's ACTUAL content: pyramids for Egypt/monuments, helix for DNA/life, orbits for cosmos, wavefield for waves/sound/vibration, neural for mind/consciousness, lattice for crystals/geometry/dimensions, blueprint for machines/inventions, curves for mathematics, spiral for growth/cycles.
- The narration together must flow as one spoken piece — no headings read aloud, no lists, no "welcome to".
- "labels" name concrete elements of that scene (max 3, each ≤ 16 chars).
- Vary the accents gently within one warm palette (gold #f59e0b, teal #2dd4bf, coral #fb7185, violet #a78bfa, cyan #22d3ee).`;

function clamp(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function clampScenes(raw: unknown, count: number): VideoSceneSpec[] {
  if (!Array.isArray(raw)) return [];
  const out: VideoSceneSpec[] = [];
  for (const s of raw.slice(0, count)) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const vis = (o.visual ?? o) as Record<string, unknown>;
    const template = clamp(vis.template ?? o.template, 20);
    if (!TEMPLATES.includes(template as (typeof TEMPLATES)[number])) continue;
    const narration = clamp(o.narration, 320);
    if (!narration) continue;
    const labels = Array.isArray(vis.labels ?? o.labels)
      ? ((vis.labels ?? o.labels) as unknown[])
          .map((l) => clamp(l, 16))
          .filter(Boolean)
          .slice(0, 3)
      : [];
    const accent = /^#[0-9a-fA-F]{6}$/.test(clamp(vis.accent ?? o.accent, 7))
      ? clamp(vis.accent ?? o.accent, 7)
      : "#f59e0b";
    out.push({
      id: `s${out.length + 1}`,
      heading: clamp(o.heading, 40) || `Scene ${out.length + 1}`,
      narration,
      onScreenText: clamp(o.onScreenText, 36),
      visual: { template: template as VideoSceneSpec["visual"]["template"], labels, accent },
      clipPrompt: undefined,
    });
  }
  return out;
}

function extractJson(raw: string): Record<string, unknown> | null {
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const p = JSON.parse(text);
    if (p && typeof p === "object") return p as Record<string, unknown>;
  } catch {
    /* the loose net below */
  }
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      const p = JSON.parse(text.slice(a, b + 1));
      if (p && typeof p === "object") return p as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }

  const topic = clamp(body.topic, 300);
  if (!topic) return NextResponse.json({ error: "a subject is needed" }, { status: 400 });
  const sceneCount = Math.max(3, Math.min(6, Number(body.sceneCount) || 5));
  const mode = body.mode === "generative" ? "generative" : "motion";
  const sourceConvId = typeof body.sourceConvId === "string" ? body.sourceConvId.slice(0, 64) : null;
  const sourceBranch = typeof body.sourceBranch === "string" ? body.sourceBranch.slice(0, 300) : null;

  try {
    assertAvailable("create.video.motion");
  } catch {
    return NextResponse.json({ error: "the film studio is not available" }, { status: 503 });
  }

  /* UNDERSTAND · PLAN · SELECT — one planning call */
  let plan: WorkflowPlan | null = null;
  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Plan a short narrated film about: ${topic}\n\nExactly ${sceneCount} scenes.`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 900,
      temperature: 0.6,
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(raw);
    const scenes = parsed ? clampScenes(parsed.scenes, sceneCount) : [];
    if (scenes.length >= 2 && parsed) {
      const steps: WorkflowStep[] = [
        { id: "understand", capability: "create.video.motion", title: "Understand the wish", runner: "server", status: "completed" },
        { id: "plan", capability: "create.video.motion", title: "Plan the storyboard", runner: "server", status: "completed" },
        { id: "narration", capability: "create.voice", title: "Speak the narration", runner: "server", status: "pending" },
        {
          id: "assemble",
          capability: mode === "generative" ? "create.video.generative" : "create.video.motion",
          title: mode === "generative" ? "Gather the scenes and assemble" : "Assemble the film",
          runner: "browser",
          status: "pending",
        },
        { id: "connect", capability: "create.video.motion", title: "Keep the film by its branch", runner: "browser", status: "pending" },
      ];
      plan = {
        workflow: mode === "generative" ? "create.video.generative" : "create.video.motion",
        title: clamp(parsed.title, 60) || topic.slice(0, 60),
        synopsis: clamp(parsed.synopsis, 140),
        steps,
        scenes,
      };
    }
  } catch {
    /* the sky stumbled — an honest word below */
  }

  /* THE SKY'S QUIET HOUR — when the analyst cannot be reached, the
     house still weaves an honest, simple storyboard from its own
     keyword reader (the same law the scenes always held) and SAYS SO:
     the film keeps its subject, its labels and its truth. */
  if (!plan) {
    const pick = pickScene(topic, "#f59e0b");
    const short = topic.replace(/\s+/g, " ").trim();
    const fallbackScenes: VideoSceneSpec[] = [
      {
        id: "s1",
        heading: short.slice(0, 40),
        narration: `There is a question the heart keeps asking: ${short}. Let us look at it slowly, the way the light looks at the stones.`,
        onScreenText: short.slice(0, 36),
        visual: { template: pick.scene, labels: [], accent: "#f59e0b" },
      },
      {
        id: "s2",
        heading: "A closer look",
        narration:
          "Every great thing is built of small honest pieces — each one placed with care, each one holding its own weight in the whole.",
        onScreenText: "a closer look",
        visual: { template: pick.scene, labels: [], accent: "#2dd4bf" },
      },
      {
        id: "s3",
        heading: "What remains",
        narration:
          "What remains is what was made with attention. The rest was weather. This is true of temples, and it is true of days.",
        onScreenText: "what remains",
        visual: { template: pick.scene, labels: [], accent: "#fb7185" },
      },
    ];
    const steps: WorkflowStep[] = [
      { id: "understand", capability: "create.video.motion", title: "Understand the wish", runner: "server", status: "completed" },
      { id: "plan", capability: "create.video.motion", title: "Plan the storyboard (the sky was quiet — the house's own hand)", runner: "server", status: "completed" },
      { id: "narration", capability: "create.voice", title: "Speak the narration", runner: "server", status: "pending" },
      { id: "assemble", capability: "create.video.motion", title: "Assemble the film", runner: "browser", status: "pending" },
      { id: "connect", capability: "create.video.motion", title: "Keep the film by its branch", runner: "browser", status: "pending" },
    ];
    plan = {
      workflow: mode === "generative" ? "create.video.generative" : "create.video.motion",
      title: short.slice(0, 60),
      synopsis: "A simple storyboard, woven by the house while the sky rests.",
      steps,
      scenes: fallbackScenes,
    };
  }

  /* GENERATIVE MODE — give each scene its clip prompt now */
  if (mode === "generative") {
    for (const s of plan.scenes ?? []) {
      s.clipPrompt = `Cinematic, warm light: ${s.heading}. ${s.narration.slice(0, 180)}`;
    }
  }

  /* the ledger receives the walk */
  try {
    const job = await db.creationJob.create({
      data: {
        kind: plan.workflow,
        status: "running",
        input: JSON.stringify({ topic, sceneCount, mode }),
        plan: JSON.stringify(plan),
        steps: JSON.stringify(plan.steps),
        sourceConvId,
        sourceBranch,
      },
    });
    return NextResponse.json({ jobId: job.id, plan });
  } catch {
    /* the ledger rested — the walk may continue without it (honest note) */
    return NextResponse.json({ jobId: null, plan, ledgerNote: "the ledger could not be written — the film may still be made" });
  }
}
