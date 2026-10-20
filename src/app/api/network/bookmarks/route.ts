import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE PRIVATE SHELF — /api/network/bookmarks                         */
/*                                                                     */
/*  A bookmark is attention kept, never a public signal, never a       */
/*  ranking: the shelf belongs to one visitor and is read by no        */
/*  other. The quiet walls hold here too — a closed door's words       */
/*  never rest on anyone's shelf.                                      */
/*                                                                     */
/*  POST { postId, on? } — place or take back a bookmark (absent `on`  */
/*  toggles). GET — the shelf itself, newest first.                    */
/* ------------------------------------------------------------------ */

/** the shelf's own visibility law: a published offering may rest on a
    shelf when it hangs in the open hall, inside a circle the visitor
    walks, or when it is the visitor's own */
async function shelfVisible(
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

/* ---------------- POST — place or take back one bookmark ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:bookmark:${visitor.user.id}`, {
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "A breath first — the shelf waits a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      postId?: unknown;
      on?: unknown;
    } | null;
    const postId = raw && typeof raw.postId === "string" ? raw.postId : "";
    if (!postId) {
      return NextResponse.json({ error: "Name the offering the shelf keeps." }, { status: 400 });
    }

    const check = await shelfVisible(postId, visitor.user.id);
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

    const existing = await db.gatheringBookmark.findUnique({
      where: { postId_userId: { postId, userId: visitor.user.id } },
      select: { id: true },
    });

    /* absent `on` toggles; a spoken `on` is obeyed, quietly */
    const wantOn = typeof raw?.on === "boolean" ? raw.on : !existing;
    if (wantOn && !existing) {
      await db.gatheringBookmark.create({ data: { postId, userId: visitor.user.id } });
    } else if (!wantOn && existing) {
      await db.gatheringBookmark.delete({ where: { id: existing.id } });
    }

    const savedCount = await db.gatheringBookmark.count({ where: { userId: visitor.user.id } });

    return withAnonCookie(
      NextResponse.json({ bookmarked: wantOn, savedCount }),
      visitor
    );
  } catch (err) {
    console.error("network bookmarks POST failed", err);
    return NextResponse.json({ error: "The shelf could not be moved." }, { status: 500 });
  }
}

/* ---------------- GET — the shelf itself, newest first ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);

    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.gatheringBookmark.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        post: {
          include: {
            user: { select: { id: true, name: true, email: true, provider: true } },
          },
        },
      },
    });

    const saved = rows
      .filter((r) => !walls.has(r.post.userId))
      .slice(0, 60)
      .map((r) => ({
        id: r.id,
        postId: r.post.id,
        savedAt: r.createdAt.toISOString(),
        post: {
          id: r.post.id,
          kind: r.post.kind,
          title: r.post.title,
          body: r.post.body.slice(0, 240),
          author: {
            name: networkName(r.post.user),
            anon: r.post.user.provider === "anon",
          },
          resonanceCount: r.post.resonanceCount,
          echoCount: r.post.echoCount,
          createdAt: r.post.createdAt.toISOString(),
        },
      }));

    return withAnonCookie(NextResponse.json({ saved }), visitor);
  } catch (err) {
    console.error("network bookmarks GET failed", err);
    return NextResponse.json({ error: "The shelf could not be read." }, { status: 500 });
  }
}
