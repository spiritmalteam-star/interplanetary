import { NextRequest, NextResponse } from "next/server";
import ZAI from "@/lib/zai-client";
import { meterRoute } from "@/lib/server/meter";

import { LANGUAGE_NAMES } from "@/lib/server/akashic-record";
/* ------------------------------------------------------------------ */
/*  POST /api/dream-book/sketch — THE DRAWING'S OWN TRANSCRIPTION.     */
/*                                                                     */
/*  A child draws the front of their book — a bird, coins, a house,    */
/*  a dragon — and the loom LOOKS at the drawing the way a kind        */
/*  grown-up would, then TRANSCRIBES it into words. Nothing is drawn   */
/*  or painted back: the drawing becomes TEXT, and that text is what   */
/*  the book is woven from. The child's own picture is the seed of     */
/*  their own book.                                                    */
/*                                                                     */
/*  Body: { image: dataUrl, language?: code }                          */
/*  Reply: { text: "..." } — 1–4 short, warm sentences naming every    */
/*  recognizable thing in the drawing, ready to be spoken into the     */
/*  loom's one input.                                                  */
async function postImpl(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const image =
      typeof body?.image === "string" && body.image.startsWith("data:image/")
        ? body.image
        : null;
    if (!image || image.length > 8_000_000) {
      return NextResponse.json(
        { error: "The drawing never arrived. Try once more." },
        { status: 400 }
      );
    }
    const lang =
      typeof body?.language === "string" && LANGUAGE_NAMES[body.language]
        ? body.language
        : "en";
    const languageName = LANGUAGE_NAMES[lang];

    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `A child drew this picture because they want to create their own book from their drawing. Look at it the way a kind grown-up would — curious, warm, never mocking. Transcribe the drawing INTO TEXT (do not invent a story, do not continue the picture): name every recognizable thing it shows (a bird, coins, a house, a dragon, a tree, a person…), what each thing seems to be doing, and the colors and mood of the scene. If something is unclear, say gently what it might be — "something that looks like…".\n\nAnswer in ${languageName} with 1–4 short sentences (at most 90 words), plain and vivid, written so they could be spoken aloud as the wish for a book. Begin directly — no preamble, no "this drawing shows".`,
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const text = (response.choices?.[0]?.message?.content ?? "")
      .trim()
      .replace(/^["“”']+|["“”']+$/g, "")
      .slice(0, 700);
    if (!text) {
      return NextResponse.json(
        { error: "The loom looked but could not speak. Try once more." },
        { status: 502 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[dream-book/sketch] failed:", err);
    return NextResponse.json(
      { error: "The loom fell silent over the drawing. Try once more." },
      { status: 500 }
    );
  }
}

export const POST = meterRoute("dream_book", postImpl);
export const maxDuration = 120;
