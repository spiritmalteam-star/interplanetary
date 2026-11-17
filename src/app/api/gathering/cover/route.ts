import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { generateImage } from "@/lib/image-engine";
import { isGatheringKind } from "../route";

/* ------------------------------------------------------------------ */
/*  THE MATCHING PICTURE — /api/gathering/cover                        */
/*                                                                     */
/*  The composer's optional "generate a matching picture" hand.        */
/*  Consent comes first: no picture is painted without the maker's     */
/*  explicit yes, carried in the request itself. The prompt is built   */
/*  from the maker's own words alone — subject, context and the        */
/*  chosen style — never dressed up as a scientific observation,       */
/*  never carrying invented facts. Every job is remembered in the      */
/*  ledger of generations; no key, no private prompt ever returns to   */
/*  the visitor's browser.                                             */
/* ------------------------------------------------------------------ */

/* THE STYLE PRESSETS — the seven dresses a picture may wear */
export const COVER_STYLES = [
  "editorial",
  "ethereal-pearl",
  "observatory",
  "diagram",
  "book-cover",
  "music-atmosphere",
  "custom",
] as const;

export type CoverStyle = (typeof COVER_STYLES)[number];

export function isCoverStyle(v: unknown): v is CoverStyle {
  return typeof v === "string" && (COVER_STYLES as readonly string[]).includes(v);
}

/* the style's own brush words — each honest about what it paints */
const STYLE_BRUSH: Record<CoverStyle, string> = {
  editorial:
    "editorial scientific illustration, restrained museum-plate composition, fine ink linework with soft washes, cream paper ground",
  "ethereal-pearl":
    "ethereal pearl-toned illustration, soft ivory light, champagne-gold accents, gentle luminous edges, serene and weightless",
  observatory:
    "cosmic observatory scene, deep quiet sky, subtle star field, brass and glass instruments, warm lantern glow on pearl surfaces",
  diagram:
    "clean conceptual diagram illustration, geometric composition, labeled-shape abstraction without any written text, thin elegant strokes",
  "book-cover":
    "minimal book cover artwork, one strong central symbol, generous negative space, muted gold on ivory, quiet typographic-free composition",
  "music-atmosphere":
    "atmospheric music scene, flowing sound-wave forms rendered as soft light, warm resonance tones, intimate and immersive",
  custom: "thoughtful illustrative artwork true to the maker's own words",
};

/* THE RATIO'S OWN CANVASES — only sizes the engine honestly paints */
const RATIO_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "4:5": "864x1152",
  "16:9": "1344x768",
  "9:16": "720x1440",
};

const SUBJECT_MAX = 120; // the title
const CONTEXT_MAX = 600; // a purposeful excerpt of the body — never the whole

function excerptOf(body: string, max: number): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** the prompt contract — subject, context, style, constraints. The
    maker's words are framed as an illustration of their theme, never
    as a depiction of an established fact. */
function buildPrompt(input: {
  title: string;
  bodyExcerpt: string;
  kind: string;
  tags: string[];
  style: CoverStyle;
  ratio: string;
  customNote: string;
}): { prompt: string; altDraft: string } {
  const brush = STYLE_BRUSH[input.style];
  const parts: string[] = [];
  parts.push(`Illustrative artwork for a community offering titled "${input.title}"`);
  if (input.bodyExcerpt) {
    parts.push(`Theme, in the maker's own words: ${input.bodyExcerpt}`);
  }
  if (input.tags.length > 0) {
    parts.push(`Motifs to consider: ${input.tags.join(", ")}`);
  }
  parts.push(`Style: ${brush}.`);
  if (input.style === "custom" && input.customNote) {
    parts.push(`The maker's own direction: ${excerptOf(input.customNote, 200)}`);
  }
  parts.push(
    `Composition: a single calm scene, ${input.ratio} aspect ratio, no border, no frame.`
  );
  parts.push(
    "Hard constraints: absolutely no written text, no letters, no watermark, no logo, no signature; no real person's likeness; conceptual and illustrative in tone — a visual meditation on the theme, not a photograph of an observed phenomenon and not a scientific claim."
  );
  const prompt = parts.join(" ");

  const altDraft = `AI-generated illustration in the ${input.style === "custom" ? "maker's chosen" : input.style.replace("-", " ")} style, made for the offering "${input.title}".`;
  return { prompt, altDraft };
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    /* the flood-gate — a painter's hand works at a human pace */
    const flood = rateLimit(`gathering:cover:${visitor.user.id}`, {
      limit: 4,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The atelier asks for a breath — paint again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      consent?: unknown;
      title?: unknown;
      body?: unknown;
      kind?: unknown;
      tags?: unknown;
      style?: unknown;
      ratio?: unknown;
      customNote?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The ask arrived unreadable." }, { status: 400 });
    }

    /* THE CONSENT GATE — no picture without the maker's explicit yes */
    if (raw.consent !== true) {
      return NextResponse.json(
        { error: "A picture is only painted when you say yes to it.", code: "consent_required" },
        { status: 403 }
      );
    }

    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, SUBJECT_MAX) : "";
    const body = typeof raw.body === "string" ? raw.body.trim() : "";
    if (title.length < 2 && body.length < 2) {
      return NextResponse.json(
        { error: "Give the offering a name or a few words first — the picture listens to them." },
        { status: 400 }
      );
    }

    const style: CoverStyle = isCoverStyle(raw.style) ? raw.style : "ethereal-pearl";
    const ratio =
      typeof raw.ratio === "string" && RATIO_SIZE[raw.ratio] ? raw.ratio : "4:5";
    const kind = isGatheringKind(raw.kind) ? raw.kind : "reflection";
    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === "string").slice(0, 6)
      : typeof raw.tags === "string"
        ? raw.tags.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
        : [];
    const customNote = typeof raw.customNote === "string" ? raw.customNote : "";

    const bodyExcerpt = excerptOf(body, CONTEXT_MAX);
    const { prompt, altDraft } = buildPrompt({
      title: title || excerptOf(body, 80),
      bodyExcerpt,
      kind,
      tags,
      style,
      ratio,
      customNote,
    });

    /* the ledger's own record — opened before the brush touches the wall */
    const promptHash = crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 32);
    const job = await db.generationJob.create({
      data: {
        userId: visitor.user.id,
        tool: "gathering_cover",
        status: "processing",
        request: {
          style,
          ratio,
          kind,
          promptHash,
          consent: true,
          titleLength: title.length,
          bodyLength: body.length,
        },
      },
    });

    try {
      const img = await generateImage(prompt, { size: RATIO_SIZE[ratio] });
      if (!img || !img.url) {
        await db.generationJob.update({
          where: { id: job.id },
          data: { status: "failed", result: { error: "paint_empty" } },
        });
        return NextResponse.json(
          { error: "The atelier could not paint just now — try again in a moment." },
          { status: 503 }
        );
      }

      await db.generationJob.update({
        where: { id: job.id },
        data: {
          status: "succeeded",
          result: {
            url: img.url,
            engine: img.engine,
            style,
            ratio,
            promptHash,
            altDraft,
            revisedPrompt: img.revisedPrompt,
          },
        },
      });

      /* only the honest minimum returns: the picture, its alt draft,
         and which brush painted it */
      return withAnonCookie(
        NextResponse.json({
          cover: {
            url: img.url,
            engine: img.engine,
            style,
            ratio,
            altText: altDraft,
            aiLabel: "AI-generated illustration",
          },
        }),
        visitor
      );
    } catch (paintErr) {
      await db.generationJob.update({
        where: { id: job.id },
        data: { status: "failed", result: { error: "paint_failed" } },
      });
      console.error("gathering cover paint failed", paintErr);
      return NextResponse.json(
        { error: "The atelier could not paint just now — try again in a moment." },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("gathering cover POST failed", err);
    return NextResponse.json({ error: "The atelier could not be reached." }, { status: 500 });
  }
}
