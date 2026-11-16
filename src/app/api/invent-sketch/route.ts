import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { resolveVisitor, withAnonCookie, type Visitor } from "@/lib/server/access";
import { rateLimit, GATES } from "@/lib/server/rate-limit";

export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/*  THE FORGE'S SKETCH DOOR — the Invent room's own hand: the idea is  */
/*  scratched into form as an image, painted by the same Gemini the    */
/*  sky already carries (GEMINI_API_KEY). THE ONE PLATE LAW (the       */
/*  visitor named it): ONE image per call — a single high-density      */
/*  concept plate that holds the mechanism, the form and the idea in   */
/*  use together, packed edge to edge with honest invention detail.    */
/* ------------------------------------------------------------------ */

const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];

interface SketchPart {
  angle: string;
  mimeType: string;
  data: string;
}

async function paintOne(
  client: GoogleGenAI,
  prompt: string
): Promise<{ mimeType: string; data: string } | null> {
  for (let m = 0; m < IMAGE_MODELS.length; m++) {
    try {
      const res = await client.models.generateContent({
        model: IMAGE_MODELS[m],
        contents: prompt,
        config: { responseModalities: ["IMAGE"] },
      } as Parameters<typeof client.models.generateContent>[0]);
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline = (
          part as { inlineData?: { mimeType?: string; data?: string } }
        ).inlineData;
        if (inline?.data) {
          return {
            mimeType: inline.mimeType ?? "image/png",
            data: inline.data,
          };
        }
      }
      /* the model answered without a picture — no second model helps */
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      /* the model's name did not open — fall to the next name once */
      if (
        /not found|unsupported|404|not supported/i.test(message) &&
        m < IMAGE_MODELS.length - 1
      ) {
        continue;
      }
      console.error("[invent-sketch] one brush rested:", message.slice(0, 160));
      return null;
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const door = (payload: object, status: number, visitor: Visitor | null) =>
    visitor ? withAnonCookie(NextResponse.json(payload, { status }), visitor) : NextResponse.json(payload, { status });

  let visitor: Visitor | null = null;
  try {
    visitor = await resolveVisitor(req);
  } catch {
    /* the door stays open even when the passage could not be read */
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return door(
      {
        error:
          "The forge's sketch door rests unkeyed — add GEMINI_API_KEY in Vercel → Settings → Environment Variables, and the ideas will take form.",
        code: "nokey",
      },
      501,
      visitor
    );
  }

  const body = (await req.json().catch(() => null)) as {
    idea?: string;
    context?: string;
    style?: string;
  } | null;
  const idea = body?.idea?.trim() ?? "";
  if (!idea) {
    return door(
      { error: "There is no idea to sketch yet — bring the spark first." },
      400,
      visitor
    );
  }

  /* the flood-gate — the same quiet law every door walks */
  const identity = visitor?.user.id ?? "anon";
  const gate = rateLimit(`invent-sketch:${identity}`, {
    limit: GATES.ai.limit,
    windowMs: GATES.ai.windowMs,
  });
  if (!gate.ok) {
    return door(
      { error: "The sky needs a breath. Try again in a moment." },
      429,
      visitor
    );
  }

  const client = new GoogleGenAI({ apiKey: key });
  const context = (body?.context ?? "").trim().slice(0, 800);
  /* the visitor's own style — chosen through the "/" hand — leads the
     look; when the visitor names no style, the plate wears the house's
     M.E. Illustrated Codex manner by default */
  const style = (body?.style ?? "").trim().slice(0, 120);
  const defaultStyle =
    "richly painted dreamlike illustrated explanation in the M.E. Illustrated Codex manner: deep midnight blue, emerald, violet, turquoise and warm luminous gold, elegant ornamental borders, light streams and pathways guiding the eye, clearly organized panels with generous empty space around every label";
  const base =
    `You are visualising an invention idea. THE IDEA: ${idea.slice(0, 700)}. ` +
    (context ? `THE CONVERSATION AROUND IT: ${context}. ` : "") +
    (style
      ? `THE VISITOR'S CHOSEN STYLE: ${style} — let it lead the whole look. `
      : `THE DEFAULT STYLE: ${defaultStyle}. `) +
    "Depict the idea faithfully — every visible detail must serve what the idea actually is. " +
    "No readable paragraphs of text in the image. ";

  /* THE ONE PLATE — a single high-density concept plate: the whole
     invention read at one glance, three honest layers composed as one
     packed sheet (mechanism, finished form, the idea in use) */
  const platePrompt =
    `${base}The picture: ONE single high-density concept plate of the invention — a masterfully packed presentation sheet that holds the whole idea at once: ` +
    "a precise annotated cutaway of the mechanism with fine callout lines, the invention as a finished object rendered in clean studio light, and the idea alive in honest use — all three composed together in one dense, richly detailed, edge-to-edge plate; " +
    "small neat labels only (one to three words), high information density, meticulous craftsmanship, no clutter, no empty filler zones.";

  const painted = await paintOne(client, platePrompt);

  const images: SketchPart[] = painted
    ? [{ angle: "plate", ...painted }]
    : [];

  if (images.length === 0) {
    return door(
      {
        error:
          "The forge's brushes rested — the sketch could not be painted this breath. Ask again in a moment.",
        code: "engine",
      },
      502,
      visitor
    );
  }

  return door(
    {
      images: images.map((img) => ({
        angle: img.angle,
        mimeType: img.mimeType,
        data: img.data,
      })),
    },
    200,
    visitor
  );
}
