import type ZAI from "z-ai-web-dev-sdk";

/* ------------------------------------------------------------------ */
/*  Attachment intelligence — the Mirror can receive more than words.  */
/*  One image is seen with the vision model; up to three documents     */
/*  (PDF, Excel, Word) arrive already extracted and are folded into    */
/*  the visitor's message as faithful text.                            */
/* ------------------------------------------------------------------ */

export interface IncomingDocument {
  name: string;
  text: string;
}

const MAX_DOC_CHARS = 12000;

/**
 * See one image. Returns a faithful description — objects, scene, any
 * legible text, charts or data — or null when the vision field is quiet.
 */
export async function describeImage(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  dataUrl: string
): Promise<string | null> {
  try {
    const response = await zai.chat.completions.createVision({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Describe this image faithfully in at most 120 words: the scene, subjects, mood and colors. Transcribe any legible text verbatim. If it contains a chart, table or data, state exactly what it shows. Begin directly with the description — no preamble, no 'this image shows'.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });
    const text = (response.choices?.[0]?.message?.content ?? "").trim();
    return text ? text.slice(0, 1200) : null;
  } catch (err) {
    console.error("[attachments] vision failed:", err);
    return null;
  }
}

/**
 * Fold extracted documents into one faithful text block for the prompt.
 */
export function documentBlock(docs: IncomingDocument[]): string | null {
  const real = docs.filter((d) => d.text && d.text.trim());
  if (real.length === 0) return null;

  const parts = real.map((d) => {
    const body =
      d.text.length > MAX_DOC_CHARS
        ? `${d.text.slice(0, MAX_DOC_CHARS)}\n[…the document continues beyond this excerpt]`
        : d.text;
    return `DOCUMENT: ${d.name}\n---\n${body}\n---`;
  });

  return `The visitor placed ${real.length === 1 ? "one document" : `${real.length} documents`} before you. Their full extracted contents follow — treat them as part of the visitor's own words, read them completely and let them inform your response.\n\n${parts.join("\n\n")}`;
}

/**
 * The image line for the prompt — or null when there is nothing to see.
 */
export function imageBlock(description: string | null): string | null {
  if (!description) return null;
  return `The visitor placed one image before you. What it shows, faithfully seen: ${description}`;
}

/* ------------------------------------------------------------------ */
/*  Shared body validation for the four chat endpoints.                */
/* ------------------------------------------------------------------ */

export interface ParsedAttachments {
  imageDataUrl: string | null;
  documents: IncomingDocument[];
}

export function parseAttachments(body: unknown): ParsedAttachments {
  const b = body as
    | {
        image?: unknown;
        documents?: unknown;
      }
    | null;

  let imageDataUrl: string | null = null;
  if (
    typeof b?.image === "string" &&
    b.image.startsWith("data:image/") &&
    b.image.length < 8_000_000
  ) {
    imageDataUrl = b.image;
  }

  const documents: IncomingDocument[] = [];
  if (Array.isArray(b?.documents)) {
    for (const doc of (b.documents as unknown[]).slice(0, 3)) {
      if (
        doc &&
        typeof doc === "object" &&
        typeof (doc as IncomingDocument).name === "string" &&
        typeof (doc as IncomingDocument).text === "string" &&
        (doc as IncomingDocument).text.trim()
      ) {
        documents.push({
          name: (doc as IncomingDocument).name.slice(0, 160),
          text: (doc as IncomingDocument).text,
        });
      }
    }
  }

  return { imageDataUrl, documents };
}
