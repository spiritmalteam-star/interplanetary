import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import {
  publishToGathering,
  editPublication,
  deletePublication,
  publicationsBySource,
  PUBLICATION_VISIBILITIES,
  SOURCE_PORTALS,
} from "@/lib/server/publication";

/* ------------------------------------------------------------------ */
/*  THE PUBLICATION HOUSE'S DOOR — /api/publications                   */
/*                                                                     */
/*  POST   — hang a completed creation in the hall (idempotent)        */
/*  PATCH  — reshape one's own offering                                */
/*  DELETE — take one's own offering down                              */
/*  GET    — which of my sources are already hung?                     */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const limit = rateLimit(`publish:${visitor.user.id}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "The hall rests a moment. Offer again soon.", retryAfter: limit.retryAfterSec },
        { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } }
      );
    }
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sourcePortal = typeof raw.sourcePortal === "string" ? raw.sourcePortal : "";
    const visibility = typeof raw.visibility === "string" ? raw.visibility : "public";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!sourcePortal || !SOURCE_PORTALS.includes(sourcePortal as (typeof SOURCE_PORTALS)[number])) {
      return NextResponse.json({ error: "The offering's birthplace is not a known room." }, { status: 400 });
    }
    if (!PUBLICATION_VISIBILITIES.includes(visibility as (typeof PUBLICATION_VISIBILITIES)[number])) {
      return NextResponse.json({ error: "The offering's audience is not a known one." }, { status: 400 });
    }

    const result = await publishToGathering({
      userId: visitor.user.id,
      actorName: "the maker's own hand",
      sourcePortal,
      title,
      body: typeof raw.body === "string" ? raw.body : null,
      question: typeof raw.question === "string" ? raw.question.slice(0, 300) : null,
      introduction: typeof raw.introduction === "string" ? raw.introduction.slice(0, 600) : null,
      visibility: visibility as "public" | "circle" | "connections" | "draft",
      circleId: typeof raw.circleId === "string" ? raw.circleId : null,
      epistemic: typeof raw.epistemic === "string" ? (raw.epistemic as "established" | "hypothesis" | "interpretation" | "creative") : null,
      tags: typeof raw.tags === "string" ? raw.tags.slice(0, 120) : null,
      sourceId: typeof raw.sourceId === "string" ? raw.sourceId : null,
      refKind: raw.refKind === "music" ? "music" : raw.refKind === "library" ? "library" : null,
      cover: typeof raw.cover === "string" ? raw.cover.slice(0, 300000) : null,
      refUrl: typeof raw.refUrl === "string" ? raw.refUrl.slice(0, 500) : null,
      recentSector: typeof raw.recentSector === "string" ? raw.recentSector : null,
      titleHint: typeof raw.titleHint === "string" ? raw.titleHint.slice(0, 120) : null,
      maxAgeMin: typeof raw.maxAgeMin === "number" ? raw.maxAgeMin : 15,
    });

    if (!result.ok) {
      const status = result.code === "source_not_found" ? 404 : result.code === "not_circle_member" ? 403 : 400;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }
    return withAnonCookie(
      NextResponse.json({ postId: result.postId, deduplicated: result.deduplicated }),
      visitor
    );
  } catch (err) {
    console.error("[publications] failed:", err);
    return NextResponse.json({ error: "The publication house is momentarily quiet." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const url = new URL(req.url);
    const ids = (url.searchParams.get("sourceIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60);
    const hung = await publicationsBySource(visitor.user.id, ids);
    return withAnonCookie(NextResponse.json({ publishedSourceIds: [...hung] }), visitor);
  } catch (err) {
    console.error("[publications] lookup failed:", err);
    return NextResponse.json({ publishedSourceIds: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const limit = rateLimit(`publish-edit:${visitor.user.id}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) return NextResponse.json({ error: "A moment of rest." }, { status: 429 });
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const postId = typeof raw.postId === "string" ? raw.postId : "";
    if (!postId) return NextResponse.json({ error: "Which offering?" }, { status: 400 });
    const patch: Parameters<typeof editPublication>[2] = {};
    if (typeof raw.title === "string") patch.title = raw.title;
    if (typeof raw.body === "string") patch.body = raw.body;
    if (typeof raw.visibility === "string" && PUBLICATION_VISIBILITIES.includes(raw.visibility as never)) {
      patch.visibility = raw.visibility as "public" | "circle" | "connections" | "draft";
    }
    if (typeof raw.epistemic === "string") patch.epistemic = raw.epistemic as "established" | "hypothesis" | "interpretation" | "creative";
    if (typeof raw.tags === "string") patch.tags = raw.tags.slice(0, 120);
    const ok = await editPublication(visitor.user.id, postId, patch);
    if (!ok) return NextResponse.json({ error: "That offering is not yours to reshape." }, { status: 403 });
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("[publications] edit failed:", err);
    return NextResponse.json({ error: "The publication house is momentarily quiet." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId") ?? "";
    if (!postId) return NextResponse.json({ error: "Which offering?" }, { status: 400 });
    const ok = await deletePublication(visitor.user.id, postId);
    if (!ok) return NextResponse.json({ error: "That offering is not yours to take down." }, { status: 403 });
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("[publications] delete failed:", err);
    return NextResponse.json({ error: "The publication house is momentarily quiet." }, { status: 500 });
  }
}
