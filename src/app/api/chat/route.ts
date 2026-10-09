import { NextRequest, NextResponse } from "next/server";
import ZAI, { resolveProvider } from "@/lib/zai-client";
import {
  generateImage,
  consumePaintErrors,
  isZaiCloudConfigured,
  isOpenAiConfigured,
  type ImageQuality,
} from "@/lib/image-engine";
import { meterRoute, type MeterContext } from "@/lib/server/meter";
import { costOf } from "@/lib/server/costs";

/* ================================================================== */
/*  THE BRIDGE — Z.ai chat with the generate_image tool                */
/*                                                                    */
/*  POST /api/chat   { messages: [{ role, content }, ...] }            */
/*                                                                    */
/*  The Z.ai model decides when a visual is needed (tool call          */
/*  emulation — the SDK speaks JSON, not function calling) and the     */
/*  image engine paints it: DALL·E 3 first, the Z.ai atelier as the    */
/*  eternal fallback.                                                  */
/*                                                                    */
/*  Response contract:                                                 */
/*    { text: string, hasImage: true,                                  */
/*      image: { url, revisedPrompt, originalPrompt, engine } }        */
/*    { text: string, hasImage: false }                                */
/* ================================================================== */

const SYSTEM_PROMPT = `You are an intelligent AI assistant powering our application. Your role is to provide clear, helpful text responses and dynamically trigger image generations whenever visual context is required or requested.

IMAGE GENERATION RULES
1. NEVER output direct image URLs, Markdown images, or raw base64 data directly in text.
2. If the user asks for an image, diagram, UI mockup, or visual visualization — OR if visualizing a complex concept significantly improves your answer — you MUST trigger the generate_image tool.
3. Keep your text response complementary to the image. Briefly introduce or explain what the image will demonstrate.

DALL-E 3 PROMPT OPTIMIZATION RULES
When composing args.prompt, expand the request into a detailed visual description following these guidelines:
- UI Mockups & App Interfaces: "Modern, high-fidelity UI design mockup of [feature/screen], clean layout, crisp typography, sleek dark/light design system, professional app screenshot."
- Diagrams & Architecture: "Clean technical architecture diagram showing [process/flow], labeled boxes, professional vector graphic, white background, high contrast."
- Conceptual / Creative: provide rich, descriptive sensory details specifying subject, lighting, framing, composition, and style.

HOW TO ANSWER — STRICT JSON ONLY, no markdown fences, no text outside the JSON.
To generate an image (text stays short and complementary, in the user's language):
{"tool":"generate_image","args":{"prompt":"<detailed English prompt>","size":"1024x1024","quality":"standard"},"text":"<brief intro in the user's language>"}
- "size" is exactly one of "1024x1024", "1024x1792" (portrait), "1792x1024" (landscape).
- "quality" is "standard" or "hd".
For a text-only answer:
{"text":"<your full answer in the user's language>"}
Never mention tools, models, JSON or generation in text.`;

interface IncomingMessage {
  role?: unknown;
  content?: unknown;
}

const DALLE_SIZES = ["1024x1024", "1024x1792", "1792x1024"];

/** Pull the strict-JSON decision out of the model's reply. */
function parseDecision(raw: string): {
  tool: string | null;
  text: string;
  args: { prompt?: string; size?: string; quality?: string };
} {
  let text = raw.trim();
  for (let depth = 0; depth < 3; depth++) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) text = fence[1].trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        const obj = JSON.parse(text.slice(start, end + 1)) as Record<
          string,
          unknown
        >;
        const args =
          typeof obj.args === "object" && obj.args !== null
            ? (obj.args as Record<string, unknown>)
            : {};
        return {
          tool: typeof obj.tool === "string" ? obj.tool : null,
          text: typeof obj.text === "string" ? obj.text.trim() : "",
          args: {
            prompt: typeof args.prompt === "string" ? args.prompt : undefined,
            size: typeof args.size === "string" ? args.size : undefined,
            quality:
              typeof args.quality === "string" ? args.quality : undefined,
          },
        };
      } catch {
        /* fall through and unwrap further */
      }
    }
    if (start === -1 || end <= start) break;
    text = text.slice(start, end + 1);
  }
  /* not JSON at all — treat the whole reply as text */
  return { tool: null, text: raw.trim(), args: {} };
}

export const POST = meterRoute("chat", postImpl);

async function postImpl(req: NextRequest, ctx: MeterContext): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => null)) as {
      messages?: IncomingMessage[];
    } | null;

    const messages = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Field "messages" must be an array.' },
        { status: 400 }
      );
    }

    /* shape the conversation — text only, the last 12 turns, tightly
       clipped: a long thread must never slow the first word */
    const convo = messages
      .slice(-12)
      .map((m) => ({
        role:
          m?.role === "assistant"
            ? ("assistant" as const)
            : m?.role === "system"
              ? ("system" as const)
              : ("user" as const),
        content:
          typeof m?.content === "string"
            ? m.content.slice(0, 4000)
            : String(m?.content ?? "").slice(0, 4000),
      }))
      .filter((m) => m.content.trim().length > 0);

    if (convo.length === 0) {
      return NextResponse.json(
        { error: 'Field "messages" must contain at least one message.' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...convo],
      thinking: { type: "disabled" },
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const decision = parseDecision(raw);

    /* ---------- the tool call: paint the image ---------- */
    if (
      decision.tool === "generate_image" &&
      decision.args.prompt &&
      decision.args.prompt.trim()
    ) {
      const size = DALLE_SIZES.includes(decision.args.size ?? "")
        ? decision.args.size!
        : "1024x1024";
      const quality: ImageQuality =
        decision.args.quality === "hd" ? "hd" : "standard";

      const image = await generateImage(decision.args.prompt, {
        size,
        quality,
      });

      if (image) {
        /* a painted vision weighs more than words — the ledger knows */
        ctx.chargeExtra(costOf("image"), "image");
        return NextResponse.json({
          text: decision.text || "Here is the visual requested:",
          hasImage: true,
          image: {
            url: image.url,
            revisedPrompt: image.revisedPrompt,
            originalPrompt: image.originalPrompt,
            engine: image.engine,
          },
        });
      }

      /* every brush rested — the text still answers, and the journal
         travels along so the silence has a name */
      return NextResponse.json({
        text:
          decision.text ||
          "The brushes rest right now — ask again in a moment.",
        hasImage: false,
        paintErrors: consumePaintErrors().slice(-4),
      });
    }

    /* ---------- standard text-only response ---------- */
    return NextResponse.json({
      text: decision.text,
      hasImage: false,
    });
  } catch (error) {
    console.error("[api/chat] error handling chat request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* A small status light for the bridge. */
export async function GET() {
  return NextResponse.json({
    service: "zai-openai-image-bridge",
    endpoint: "POST /api/chat",
    contract:
      "{ text, hasImage, image?: { url, revisedPrompt, originalPrompt, engine } }",
    provider: resolveProvider(),
    zaiCloudConfigured: isZaiCloudConfigured(),
    openaiConfigured: isOpenAiConfigured(),
  });
}

/* the long weavings need room in the cloud sky */
export const maxDuration = 300;
