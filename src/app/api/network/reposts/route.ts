import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE REPRINTS — /api/network/reposts                                */
/*                                                                     */
/*  A repost walks another maker's work into new rooms and always      */
/*  carries the original maker's name with it. One repost per explorer */
/*  per offering; the same hand takes it back. A maker's own word      */
/*  already walks with them — it is never reposted by its author.      */
/*                                                                     */
/*  POST { postId, note? } — place or take back a repost (toggle).     */
/* ------------------------------------------------------------------ */

const NOTE_MAX = 280;

/** the repost's own visibility law — the same law the shelf keeps */
async function repostVisible(
  postId: string,
  visitorId: string
): Promise<{ ok: boolean; notFound: boolean } | null> {
  const post = await db.gatheringPost.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, visibility: true, circleId: true, status: true },
  });
  if (!post || post.status !== "published") return { ok: false, notFound: !post };
  if (post.visibility === "public" || post.userId === visitorId) return { ok: true, notFound: false };
  if (post.visibility === "circle" && post.circleId) {
    const membership = await db.networkCircleMember.findUnique({
      where: { circleId_userId: { circleId: post.circleId, userId: visitorId } },
      select: { id: true },
    });
    return { ok: Boolean(membership), notFound: false };
  }
  return { ok: false, notFound: false };
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:repost:${visitor.user.id}`, {
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "A breath first — walk the word again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      postId?: unknown;
      note?: unknown;
    } | null;
    const postId = raw && typeof raw.postId === "string" ? raw.postId : "";
    if (!postId) {
      return NextResponse.json({ error: "Name the offering that walks on." }, { status: 400 });
    }

    const note =
      typeof raw?.note === "string" && raw.note.trim().length > 0
        ? raw.note.trim()
        : null;
    if (note && note.length > NOTE_MAX) {
      return NextResponse.json(
        { error: `A repost's own words want at most ${NOTE_MAX} letters.` },
        { status: 400 }
      );
    }

    const check = await repostVisible(postId, visitor.user.id);
    if (!check || check.notFound) {
      return NextResponse.json(
        { error: "That offering no longer hangs in the hall." },
        { status: 404 }
      );
    }
    if (!check.ok) {
      return NextResponse.json(
        { error: "This offering rests in a room you do not walk." },
        { status: 403 }
      );
    }

    const post = await db.gatheringPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (post && post.userId === visitor.user.id) {
      return NextResponse.json(
        { error: "Your own word already walks with you — repost another maker's work." },
        { status: 400 }
      );
    }

    /* the quiet walls hold here too — a closed door's word never walks */
    const walls = await wallIdsFor(visitor.user.id);
    if (post && walls.has(post.userId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const existing = await db.gatheringRepost.findUnique({
      where: { postId_userId: { postId, userId: visitor.user.id } },
      select: { id: true },
    });

    if (existing) {
      await db.gatheringRepost.delete({ where: { id: existing.id } });
    } else {
      await db.gatheringRepost.create({
        data: { postId, userId: visitor.user.id, note },
      });
    }

    const repostCount = await db.gatheringRepost.count({ where: { postId } });

    return withAnonCookie(
      NextResponse.json({ reposted: !existing, repostCount }),
      visitor
    );
  } catch (err) {
    console.error("network reposts POST failed", err);
    return NextResponse.json({ error: "The repost could not be placed." }, { status: 500 });
  }
}
