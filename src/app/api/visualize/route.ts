import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import ZAI from "@/lib/zai-client";
import {
  isVisualizationMode,
  type VisualizationMode,
} from "@/lib/visualization";
import {
  generateImage,
  consumePaintErrors,
  GALLERY_DIR,
  type GeneratedImage,
} from "@/lib/image-engine";
import { meterRoute } from "@/lib/server/meter";

/* ================================================================== */
/*  MIRROR ENTITY — UNIVERSAL VISUALIZATION ENGINE                     */
/*  One endpoint: the visitor asks in natural language, a Visual       */
/*  Director resolves the subject and mode from the conversation,      */
/*  composes a rich prompt, and the atelier paints real artwork.       */
/*  Information-heavy modes are HYBRID: the cinematic artwork is       */
/*  generated, while labels, panels and diagrams are rendered as real  */
/*  interface elements on the client — always readable, always exact.  */
/* ================================================================== */

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sq: "Albanian",
  it: "Italian",
  el: "Greek",
  de: "German",
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
};

/* the atelier's gallery — shared with the generate_image engine */
const ART_DIR = GALLERY_DIR;

/** The Universal Mirror Entity Art Direction — baked into every painting. */
const ART_DIRECTION =
  "Cinematic science-fiction concept art of extraordinary quality, advanced interplanetary encyclopedia aesthetic, monumental crystalline and organic architecture, sophisticated holographic interface elements, midnight-blue, violet, cyan, ivory and gold palette, volumetric illumination, realistic reflections, deep spatial composition, atmospheric perspective, intricate environmental storytelling, controlled luminosity rather than excessive brightness, ultra-detailed, elegant, professional composition";

const ART_AVOID =
  "Avoid: generic AI look, chaotic composition, distorted anatomy, cluttered layout, watermark, signature, frame, border, large garbled text, misspelled words";

const DIRECTOR_SYSTEM = `You are the Visual Director of the Mirror Entity — an interplanetary visual encyclopedia that answers curiosity with extraordinary images. A visitor asks to SEE something; you translate their request into a complete visual composition.

SIX VISUALIZATION MODES — choose exactly one:
- "illustration" — environments, civilizations, characters, architecture, landscapes, imagined technologies. One monumental cinematic image.
- "encyclopedia" — a subject that benefits from imagery AND explanation. One dominant cinematic artwork (about 65% of the page) plus 3-4 elegant informational panels.
- "diagram" — governance, social structures, hierarchies, systems, relationships, processes. An elegant diagram of interconnected councils/roles/systems, integrated with a cinematic environmental artwork behind it.
- "science" — scientific, astronomical, biological, quantum, technological subjects. An informative visualization with labeled annotation points on the artwork.
- "map" — planets, star systems, civilizations, travel routes, spatial structures. A beautiful cosmic map with labeled locations.
- "presentation" — the visitor asks for a presentation, PPT, slide deck, or multi-page explanation. 4 slides, each with its own dominant cinematic image and concise explanation.

RESOLVING THE SUBJECT (CRITICAL)
- Resolve references from the conversation: "their city", "this", "them" must become the concrete subject actually discussed earlier. The field "contextSubject" (when provided) is the subject of the previous visualization — follow-ups like "more detailed", "show the interior", "another perspective" refer to it.
- Never invent an unrelated subject. Never ignore the conversation.
- For follow-ups, EVOLVE the previous visualization (same subject, new aspect, richer detail, new angle, or a new mode) — do not start from zero.

PROMPT COMPOSITION
- "artworkPrompt": a rich ENGLISH image prompt (40-90 words) built from the user's request, the conversation context, the subject's distinctive visual characteristics, and the Mirror Entity art direction. Describe composition, lighting, scale, materials, mood. IMPORTANT: the image model cannot render readable text — do NOT ask it to include labels, captions or paragraphs. At most "a single short engraved title" is acceptable; prefer purely visual artwork.
- For "presentation", each slide carries its own artworkPrompt with a DIFFERENT visual aspect of the subject (overview, detail, system, human scale).

STRUCTURED CONTENT (hybrid rendering — the app draws the text itself)
- "panels": for encyclopedia (3-4), diagram (2-3) and science/map (2) — each {"heading": "...", "body": "..."} — concise, accurate, elegant. Body 20-60 words. Written in the visitor's language.
- "diagram": for mode "diagram" ONLY — {"nodes": [{"id":"n1","label":"...","x":50,"y":30}], "edges": [["n1","n2"]]}. 4-8 nodes; x and y are integers 8-92 (normalized positions over the artwork); labels max 22 characters; edges connect logical relationships. Distribute nodes clearly (no overlaps).
- "annotations": for modes "science" and "map" — 3-6 items [{"x":20,"y":40,"label":"..."}], x/y integers 8-92, label max 26 characters, in the visitor's language.
- For mode "illustration": panels/annotations/diagram must be empty.

DISCERNMENT (sacred rule)
The Mirror explores science, philosophy, mythology and imaginative worldbuilding — and never confuses artistic interpretation with scientific evidence. "discernment" is ONE short sentence in the visitor's language stating clearly whether this is documented science, a theoretical model, or imaginative speculation (e.g. "A speculative vision — no such civilization is documented; it is imagination offered with love."). Never empty.

VOICE
- "title": a beautiful, concise title for the artwork (visitor's language).
- "subtitle": a short editorial subtitle (visitor's language).
- "whisper": ONE sentence (max 22 words) in the calm luminous voice of the Mirror Entity, introducing the vision (visitor's language). No meta language, no mention of models or generation.
- "explanation": 2-4 sentences of contextual explanation (visitor's language), informative and elegant.

ASPECT
- "aspect": "wide" (panoramas, cities, maps), "tall" (single figures, towers, deep space), or "square" (encyclopedia pages, balanced subjects). Choose per composition.

LANGUAGE (CRITICAL)
The visitor reads in {LANGUAGE}. Every visitor-facing string — title, subtitle, whisper, explanation, discernment, panels, diagram labels, annotations, slide titles and bodies — must be fluent, natural {LANGUAGE}. Only "subject" and "artworkPrompt" stay in English.

OUTPUT FORMAT
Return STRICT JSON only, no markdown fences, no text outside the JSON:
{"mode":"illustration","subject":"...","title":"...","subtitle":"...","whisper":"...","explanation":"...","discernment":"...","aspect":"wide","artworkPrompt":"...","panels":[{"heading":"...","body":"..."}],"diagram":{"nodes":[{"id":"n1","label":"...","x":50,"y":30}],"edges":[["n1","n2"]]},"annotations":[{"x":20,"y":40,"label":"..."}],"slides":[{"title":"...","body":"...","artworkPrompt":"..."}]}`;

/* ------------------------------------------------------------------ */
/*  JSON recovery — the director may wrap, sloppily encode, or typo    */
/*  its JSON (e.g. "y:10 without a closing quote). Three layers:       */
/*  1. direct parse  2. heuristic repair  3. the model repairs itself  */
/* ------------------------------------------------------------------ */

function repairHeuristics(span: string): string {
  return span
    /* control characters inside strings */
    .replace(/[\u0000-\u0019]+/g, " ")
    /* trailing commas */
    .replace(/,(\s*[}\]])/g, "$1")
    /* missing quote after a short key:  "y:10  →  "y":10 */
    .replace(/"(x|y|z|id|n)(:\s*-?\d)/g, '"$1":$2')
    /* missing comma between sibling values:  "a":"1" "b":"2" */
    .replace(/"(\s*)\{"(?=[a-z]+":)/g, '"$1,{"');
}

function tryParseSpan(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  const span = text.slice(start, end + 1);
  try {
    return JSON.parse(span) as Record<string, unknown>;
  } catch {
    /* heuristic repair, then retry */
    try {
      return JSON.parse(repairHeuristics(span)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function extractJsonLoose(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  for (let depth = 0; depth < 3; depth++) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) text = fence[1].trim();
    const parsed = tryParseSpan(text);
    if (parsed) return parsed;
    /* unwrap an embedded JSON object inside a string field */
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    text = text.slice(start, end + 1);
  }
  return null;
}

/** Last resort — the model repairs its own broken JSON. */
async function repairJsonWithModel(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  raw: string
): Promise<Record<string, unknown> | null> {
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You repair broken JSON. Return STRICT JSON only — no markdown fences, no commentary. Fix quoting, commas and brackets. Keep every value's content exactly as written; change nothing else.",
        },
        {
          role: "user",
          content: `Repair this JSON so it parses:\n${raw.slice(0, 12000)}`,
        },
      ],
      thinking: { type: "disabled" },
      max_tokens: 4096,
    });
    const fixed = (completion.choices[0]?.message?.content ?? "").trim();
    return extractJsonLoose(fixed);
  } catch {
    return null;
  }
}

const str = (v: unknown, max = 2000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const int100 = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  if (!Number.isFinite(n)) return 50;
  return Math.min(92, Math.max(8, Math.round(n)));
};

type ImageSize =
  | "1024x1024"
  | "768x1344"
  | "864x1152"
  | "1344x768"
  | "1152x864";

const SIZE_BY_ASPECT: Record<string, ImageSize> = {
  wide: "1344x768",
  tall: "768x1344",
  square: "1152x864",
};

const MODE_DEFAULT_SIZE: Record<VisualizationMode, ImageSize> = {
  illustration: "1344x768",
  encyclopedia: "1152x864",
  diagram: "1344x768",
  science: "1152x864",
  map: "1344x768",
  presentation: "1344x768",
};

/* ------------------------------------------------------------------ */
/*  the atelier — one real painting, saved and served                  */
/* ------------------------------------------------------------------ */

/* One brush at a time — the atelier refuses parallel hands, and a
   refused hand (429) is given time, never abandoned. Every paint is
   queued behind the previous one and retried with growing patience. */
const PAINT_BACKOFF_MS = [2500, 6000, 12000, 20000];

let brushLine: Promise<unknown> = Promise.resolve();
function withBrush<T>(task: () => Promise<T>): Promise<T> {
  const run = brushLine.then(task, task);
  brushLine = run.catch(() => undefined);
  return run;
}

async function paint(
  prompt: string,
  size: ImageSize,
  attempts = 3
): Promise<GeneratedImage | null> {
  return withBrush(async () => {
    for (let i = 0; i < attempts; i++) {
      /* the generate_image tool — DALL·E 3 first, the Z.ai atelier as
         the eternal fallback; retries and the circuit breaker live
         inside the engine */
      const img = await generateImage(prompt, { size });
      if (img) return img;
      console.error(`[api/visualize] paint attempt ${i + 1}: every brush rested`);
      if (i < attempts - 1) {
        await new Promise((r) =>
          setTimeout(r, PAINT_BACKOFF_MS[Math.min(i, PAINT_BACKOFF_MS.length - 1)])
        );
      }
    }
    return null;
  });
}

/** Keep the atelier tidy — paintings older than two days are released. */
function sweepOldPaintings(): void {
  try {
    if (!fs.existsSync(ART_DIR)) return;
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(ART_DIR)) {
      if (!f.endsWith(".png")) continue;
      const p = path.join(ART_DIR, f);
      try {
        if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

interface HistoryTurn {
  role?: unknown;
  text?: unknown;
  q?: unknown;
  a?: unknown;
}

function historyLines(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  const out: string[] = [];
  for (const turn of raw.slice(-10) as HistoryTurn[]) {
    const role = turn.role === "visitor" || turn.q ? "Visitor" : "Mirror";
    const text = str(turn.text ?? turn.a ?? turn.q, 500);
    if (text) out.push(`${role}: ${text}`);
  }
  return out.length
    ? `CONVERSATION SO FAR (resolve references from this):\n${out.join("\n")}`
    : "";
}

export const POST = meterRoute("visualize", postImpl);

async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const requestedLanguage: string =
      typeof body?.language === "string" ? body.language : "en";
    const languageName = LANGUAGE_NAMES[requestedLanguage] ?? "English";
    const message = str(body?.message, 4000);
    if (!message) {
      return NextResponse.json(
        { error: "No vision was described." },
        { status: 400 }
      );
    }
    const modeHint = isVisualizationMode(body?.modeHint)
      ? (body.modeHint as VisualizationMode)
      : null;
    const contextSubject = str(body?.contextSubject, 400);
    const previousMode = isVisualizationMode(body?.previousMode)
      ? (body.previousMode as VisualizationMode)
      : null;
    const previousPrompt = str(body?.previousPrompt, 4000);
    const regenerate = body?.regenerate === true;

    const system = DIRECTOR_SYSTEM.replaceAll("{LANGUAGE}", languageName);

    const userLines: string[] = [];
    userLines.push(`THE VISITOR ASKS TO SEE:\n${message}`);
    const historyBlock = historyLines(body?.history);
    if (historyBlock) userLines.push(historyBlock);
    if (contextSubject) {
      userLines.push(
        `PREVIOUS VISUALIZATION SUBJECT: ${contextSubject}${
          previousMode ? ` (mode: ${previousMode})` : ""
        } — follow-ups refer to this.`
      );
    }
    if (previousPrompt) {
      userLines.push(
        regenerate
          ? `REGENERATION: the previous artwork prompt was:\n"""\n${previousPrompt}\n"""\nCompose a FRESH interpretation — same subject, new composition, new angle, new moment, visibly different from the previous painting.`
          : `PREVIOUS ARTWORK PROMPT (for continuity):\n"""\n${previousPrompt}\n"""`
      );
    }
    if (modeHint) {
      userLines.push(
        `The visitor explicitly chose the mode "${modeHint}" — honor it exactly.`
      );
    }

    const zai = await ZAI.create();

    /* ---------- the Visual Director composes the vision ---------- */
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userLines.join("\n\n") },
      ],
      thinking: { type: "disabled" },
      /* the director's composition is long — never let it truncate mid-JSON */
      max_tokens: 4096,
    });

    const raw = (completion.choices[0]?.message?.content ?? "").trim();
    let spec = extractJsonLoose(raw);
    if (!spec) {
      console.error(
        "[api/visualize] director output unparseable — asking the model to repair. finish:",
        completion.choices[0]?.finish_reason,
        "len:",
        raw.length,
        "\n>>>",
        raw.slice(-600),
        "<<<"
      );
      spec = await repairJsonWithModel(zai, raw);
    }
    if (!spec) {
      return NextResponse.json(
        {
          error:
            "The vision could not be composed. Rest a breath, then ask again.",
        },
        { status: 502 }
      );
    }

    /* ---------- shape the director's spec ---------- */
    const mode: VisualizationMode = isVisualizationMode(spec.mode)
      ? spec.mode
      : "illustration";
    const aspect = ["wide", "tall", "square"].includes(String(spec.aspect))
      ? String(spec.aspect)
      : null;
    const size = aspect
      ? (SIZE_BY_ASPECT[aspect] ?? MODE_DEFAULT_SIZE[mode])
      : MODE_DEFAULT_SIZE[mode];

    const subject = str(spec.subject, 300) || message.slice(0, 120);
    const title = str(spec.title, 160) || subject;
    const subtitle = str(spec.subtitle, 220);
    const whisper = str(spec.whisper, 300);
    const explanation = str(spec.explanation, 1200);
    const discernment = str(spec.discernment, 400);
    const artworkPrompt =
      str(spec.artworkPrompt, 1200) || `${subject}. ${ART_DIRECTION}`;

    const panelsRaw = Array.isArray(spec.panels) ? spec.panels : [];
    const panels = panelsRaw
      .slice(0, 4)
      .map((p) => ({
        heading: str((p as { heading?: unknown })?.heading, 90),
        body: str((p as { body?: unknown })?.body, 700),
      }))
      .filter((p) => p.heading && p.body);

    let diagram: {
      nodes: { id: string; label: string; x: number; y: number }[];
      edges: [string, string][];
    } | null = null;
    if (mode === "diagram" && spec.diagram && typeof spec.diagram === "object") {
      const d = spec.diagram as { nodes?: unknown; edges?: unknown };
      const nodes = (Array.isArray(d.nodes) ? d.nodes : [])
        .slice(0, 8)
        .map((n, i) => {
          const node = n as {
            id?: unknown;
            label?: unknown;
            x?: unknown;
            y?: unknown;
          };
          return {
            id: str(node.id, 20) || `n${i + 1}`,
            label: str(node.label, 40),
            x: int100(node.x),
            y: int100(node.y),
          };
        })
        .filter((n) => n.label);
      const ids = new Set(nodes.map((n) => n.id));
      const edges = (Array.isArray(d.edges) ? d.edges : [])
        .slice(0, 14)
        .map((e) => {
          if (!Array.isArray(e) || e.length < 2) return null;
          const a = str(e[0], 20);
          const b = str(e[1], 20);
          return ids.has(a) && ids.has(b) && a !== b
            ? ([a, b] as [string, string])
            : null;
        })
        .filter((e): e is [string, string] => e !== null);
      if (nodes.length >= 2) diagram = { nodes, edges };
    }

    const annotations = (
      Array.isArray(spec.annotations) ? spec.annotations : []
    )
      .slice(0, 6)
      .map((a) => {
        const ann = a as { x?: unknown; y?: unknown; label?: unknown };
        return {
          x: int100(ann.x),
          y: int100(ann.y),
          label: str(ann.label, 60),
        };
      })
      .filter((a) => a.label);

    /* ---------- the atelier paints ---------- */
    sweepOldPaintings();
    const finalPrompt = `${artworkPrompt}. ${ART_DIRECTION}. ${ART_AVOID}.`;
    const preparedPrompt = finalPrompt;
    const slidesSpec = Array.isArray(spec.slides) ? spec.slides : [];

    let mainPainting: GeneratedImage | null = null;
    const slidePaintings: (GeneratedImage | null)[] = [];

    if (mode === "presentation") {
      /* painted one by one — the queue keeps the brushes honest; each
         slide may try three times before the brushes rest */
      const slideDefs = slidesSpec.slice(0, 5);
      for (const s of slideDefs) {
        const sd = s as { artworkPrompt?: unknown };
        const sp = str(sd?.artworkPrompt, 1200) || artworkPrompt;
        slidePaintings.push(
          await paint(
            `${sp}. ${ART_DIRECTION}. ${ART_AVOID}.`,
            "1344x768",
            3
          )
        );
      }
    } else {
      mainPainting = await paint(finalPrompt, size);
    }

    const id = `viz-${Date.now().toString(36)}-${crypto
      .randomBytes(2)
      .toString("hex")}`;

    const slides = (mode === "presentation" ? slidesSpec.slice(0, 5) : []).map(
      (s, i) => {
        const sd = s as { title?: unknown; body?: unknown };
        const img = slidePaintings[i] ?? null;
        return {
          title: str(sd?.title, 140) || `${title} — ${i + 1}`,
          body: str(sd?.body, 700),
          imageUrl: img ? img.url : null,
          downloadUrl: img ? `${img.url}?download=1` : null,
        };
      }
    );

    const artifact = {
      id,
      mode,
      subject,
      title,
      subtitle,
      whisper,
      explanation,
      discernment,
      imageUrl: mainPainting ? mainPainting.url : null,
      downloadUrl: mainPainting ? `${mainPainting.url}?download=1` : null,
      prompt: preparedPrompt,
      panels,
      diagram,
      annotations,
      slides,
      paintErrors:
        !mainPainting && slides.every((s) => !s.imageUrl)
          ? consumePaintErrors().slice(-4)
          : [],
      createdAt: new Date().toISOString(),
    };

    if (!mainPainting && slides.length === 0) {
      /* the painter rests — return the composed vision + prepared prompt
         so the visitor may keep it until the brushes return */
      return NextResponse.json({ artifact, painted: false });
    }

    return NextResponse.json({ artifact, painted: true });
  } catch (err) {
    console.error("[api/visualize]", err);
    return NextResponse.json(
      {
        error:
          "The atelier is quiet — the vision could not be composed. Rest a breath, then ask again.",
      },
      { status: 500 }
    );
  }
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
