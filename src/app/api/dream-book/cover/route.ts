import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  resolveVisitor,
  withAnonCookie,
  type Visitor,
} from "@/lib/server/access";
import { rateLimit, GATES } from "@/lib/server/rate-limit";
import { LANGUAGE_NAMES, isLanguageCode } from "@/lib/i18n/core";

export const maxDuration = 120;

/* ------------------------------------------------------------------ */
/*  THE BOOK'S OWN COVER — the visitor named it: whenever a book is    */
/*  woven, the same Gemini the sky already carries (GEMINI_API_KEY)    */
/*  paints an album cover for that story — one call, one image, drawn  */
/*  from the volume's own title, sigil and subject, so every shelf in  */
/*  the house and every table in the market wears a true face.         */
/*                                                                     */
/*  THE PLATE'S LAW: the cover carries NO written words — the title    */
/*  is typeset by the reader's own room (painted text garbles); the    */
/*  image is pure atmosphere: the story's soul as one striking plate.  */
/* ------------------------------------------------------------------ */

const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];

async function paintCover(
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
      console.error("[dream-book/cover] the brush rested:", message.slice(0, 160));
      return null;
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const door = (
    payload: object,
    status: number,
    visitor: Visitor | null
  ) =>
    visitor
      ? withAnonCookie(NextResponse.json(payload, { status }), visitor)
      : NextResponse.json(payload, { status });

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
          "The cover's brush rests unkeyed — add GEMINI_API_KEY in Vercel → Settings → Environment Variables, and every book will wear its face.",
        code: "nokey",
      },
      501,
      visitor
    );
  }

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    sigil?: string;
    axiom?: string;
    subject?: string;
    vein?: string;
    language?: string;
  } | null;

  const title = body?.title?.trim().slice(0, 160) ?? "";
  if (!title) {
    return door(
      { error: "There is no volume to dress yet — weave the book first." },
      400,
      visitor
    );
  }

  /* the flood-gate — the same quiet law every door walks */
  const identity = visitor?.user.id ?? "anon";
  const gate = rateLimit(`dream-cover:${identity}`, {
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

  const sigil = body?.sigil?.trim().slice(0, 200) ?? "";
  const axiom = body?.axiom?.trim().slice(0, 300) ?? "";
  const subject = body?.subject?.trim().slice(0, 600) ?? "";
  const vein = body?.vein === "ground" ? "grounded" : "metaphysical, mystique";
  const langCode = body?.language ?? "en";
  const languageName = isLanguageCode(langCode)
    ? LANGUAGE_NAMES[langCode]
    : "English";

  const client = new GoogleGenAI({ apiKey: key });

  const prompt =
    `You are painting a single striking BOOK COVER PLATE — an album-cover-grade artwork — for a newly woven book. ` +
    `THE BOOK'S TITLE: "${title}". ` +
    (sigil ? `THE BOOK'S OPENING INVOCATION: "${sigil}". ` : "") +
    (axiom ? `WHY THIS BOOK EXISTS: "${axiom}". ` : "") +
    (subject ? `THE STORY THE BOOK TELLS: ${subject}. ` : "") +
    `THE TELLING'S VEIN: ${vein}. ` +
    `Paint the story's soul as one evocative, atmospheric composition — the world, its central mystery or its key figure, rendered with cinematic light and a palette tuned to the book's mood. ` +
    `THE PLATE'S LAW: absolutely NO written words, NO letters, NO typography, NO title text painted anywhere in the image — the words are typeset beside the plate, never inside it. ` +
    `A portrait-leaning composition, rich in detail at its heart, calm at its edges, so a title can rest upon it. ` +
    `The mood and the imagery must serve the story exactly as told — in the reader's tongue: ${languageName}.`;

  const img = await paintCover(client, prompt);
  if (!img) {
    return door(
      {
        error:
          "The cover's brushes rested — the plate could not be painted this breath. Ask again in a moment.",
        code: "engine",
      },
      502,
      visitor
    );
  }

  return door(
    {
      cover: `data:${img.mimeType};base64,${img.data}`,
    },
    200,
    visitor
  );
}
