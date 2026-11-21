import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { isGatheringKind, isGatheringEpistemic, isGatheringRegion } from "../route";

/* ------------------------------------------------------------------ */
/*  THE COMPOSER'S OWN BENCH — /api/gathering/drafts                   */
/*                                                                     */
/*  One bench per maker. The composer autosaves here as the words      */
/*  grow; every honest save raises the revision, so the draft that     */
/*  survives a refresh, a journey or a dead battery is the newest      */
/*  truth the maker spoke. Private by nature: only its maker ever      */
/*  reads it. Publishing retires the bench; discarding clears it.      */
/* ------------------------------------------------------------------ */

export const DRAFT_VISIBILITIES = ["public", "circle", "connections", "unlisted", "private"] as const;

export function isDraftVisibility(v: unknown): v is (typeof DRAFT_VISIBILITIES)[number] {
  return typeof v === "string" && (DRAFT_VISIBILITIES as readonly string[]).includes(v);
}

const TITLE_MAX = 120;
const BODY_MAX = 4000;

function cleanText(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function cleanNullable(v: unknown, max: number, lower = false): string | null {
  if (typeof v !== "string") return null;
  const s = (lower ? v.toLowerCase() : v).trim();
  if (s.length < 1) return null;
  return s.slice(0, max);
}

function shape(draft: {
  id: string;
  kind: string;
  title: string;
  body: string;
  tags: string | null;
  sector: string | null;
  epistemic: string | null;
  circleId: string | null;
  region: string | null;
  language: string | null;
  visibility: string;
  mediaUrl: string | null;
  mediaType: string | null;
  mediaName: string | null;
  altText: string | null;
  aiMedia: boolean;
  aiStyle: string | null;
  revision: number;
  updatedAt: Date;
}) {
  return {
    id: draft.id,
    kind: draft.kind,
    title: draft.title,
    body: draft.body,
    tags: draft.tags ?? "",
    sector: draft.sector,
    epistemic: draft.epistemic,
    circleId: draft.circleId,
    region: draft.region,
    language: draft.language,
    visibility: draft.visibility,
    mediaUrl: draft.mediaUrl,
    mediaType: draft.mediaType,
    mediaName: draft.mediaName,
    altText: draft.altText,
    aiMedia: draft.aiMedia,
    aiStyle: draft.aiStyle,
    revision: draft.revision,
    updatedAt: draft.updatedAt.toISOString(),
  };
}

/* ---------------- GET — the maker's own bench ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const row = await db.gatheringDraft.findUnique({ where: { userId: visitor.user.id } });
    return withAnonCookie(NextResponse.json({ draft: row ? shape(row) : null }), visitor);
  } catch (err) {
    console.error("gathering drafts GET failed", err);
    return NextResponse.json({ error: "The bench could not be read." }, { status: 500 });
  }
}

/* ---------------- PUT — the autosave hand ---------------- */
export async function PUT(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`gathering:draft:${visitor.user.id}`, {
      limit: 60,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The bench asks for a breath — save again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw) {
      return NextResponse.json({ error: "The draft arrived unreadable." }, { status: 400 });
    }

    const kind = isGatheringKind(raw.kind) ? raw.kind : "reflection";
    const title = cleanText(raw.title, TITLE_MAX);
    const body = cleanText(raw.body, BODY_MAX);
    if (title.trim().length < 1 && body.trim().length < 1) {
      return NextResponse.json(
        { error: "The bench keeps words — speak a title or a body first." },
        { status: 400 }
      );
    }

    const tagsRaw = typeof raw.tags === "string" ? raw.tags : "";
    const tags =
      tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
        .slice(0, 6)
        .join(",") || null;

    /* a circle bench — only a member rests their words there */
    let circleId: string | null = null;
    if (typeof raw.circleId === "string" && raw.circleId.length > 0) {
      const membership = await db.networkCircleMember.findUnique({
        where: { circleId_userId: { circleId: raw.circleId, userId: visitor.user.id } },
        select: { id: true },
      });
      if (membership) circleId = raw.circleId;
    }

    /* the offering's own picture or film — only the house's shelf */
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    if (
      typeof raw.mediaUrl === "string" &&
      (raw.mediaUrl.startsWith("/gathering-media/") || raw.mediaUrl.startsWith("/api/visual/"))
    ) {
      mediaUrl = raw.mediaUrl.slice(0, 200);
      mediaType = raw.mediaType === "video" ? "video" : raw.mediaType === "image" ? "image" : null;
    }

    const data = {
      kind,
      title,
      body,
      tags,
      sector: cleanNullable(raw.sector, 24),
      epistemic: isGatheringEpistemic(raw.epistemic) ? raw.epistemic : null,
      circleId,
      region: isGatheringRegion(raw.region) ? raw.region : null,
      language: cleanNullable(raw.language, 8, true),
      visibility: isDraftVisibility(raw.visibility) ? raw.visibility : "public",
      mediaUrl,
      mediaType,
      mediaName: cleanNullable(raw.mediaName, 120),
      altText: cleanNullable(raw.altText, 300),
      aiMedia: raw.aiMedia === true,
      aiStyle: cleanNullable(raw.aiStyle, 24, true),
    };

    const saved = await db.gatheringDraft.upsert({
      where: { userId: visitor.user.id },
      create: { userId: visitor.user.id, ...data, revision: 1 },
      update: { ...data, revision: { increment: 1 }, discardedAt: null },
    });

    return withAnonCookie(NextResponse.json({ draft: shape(saved) }), visitor);
  } catch (err) {
    console.error("gathering drafts PUT failed", err);
    return NextResponse.json({ error: "The bench could not keep the words." }, { status: 500 });
  }
}

/* ---------------- DELETE — the discard hand ---------------- */
export async function DELETE(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    await db.gatheringDraft.deleteMany({ where: { userId: visitor.user.id } });
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("gathering drafts DELETE failed", err);
    return NextResponse.json({ error: "The bench could not be cleared." }, { status: 500 });
  }
}
