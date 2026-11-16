import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

export const maxDuration = 15;

/* ------------------------------------------------------------------ */
/*  THE GATHERING'S REACTIONS — resonance | gratitude | awe.           */
/*  One visitor, one reaction of each kind per post: pressing again    */
/*  takes it back. The count is recomputed honestly after every press. */
/* ------------------------------------------------------------------ */

const KINDS = new Set(["resonance", "gratitude", "awe"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const visitor = await resolveVisitor(req);
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { kind?: string } | null;
  if (!body?.kind || !KINDS.has(body.kind)) {
    return NextResponse.json({ error: "No such feeling was offered." }, { status: 400 });
  }

  const post = await db.musicPost.findUnique({ where: { id } }).catch(() => null);
  if (!post) {
    return NextResponse.json({ error: "No such offering." }, { status: 404 });
  }

  try {
    const existing = await db.musicReaction.findUnique({
      where: { postId_userId_kind: { postId: id, userId: visitor.user.id, kind: body.kind } },
    });
    if (existing) {
      await db.musicReaction.delete({ where: { id: existing.id } });
    } else {
      await db.musicReaction.create({
        data: { postId: id, userId: visitor.user.id, kind: body.kind },
      });
    }
    const counts = await db.musicReaction.groupBy({
      by: ["kind"],
      where: { postId: id },
      _count: { kind: true },
    });
    return withAnonCookie(
      NextResponse.json({
        ok: true,
        pressed: !existing,
        counts: counts.map((c) => ({ kind: c.kind, count: c._count.kind })),
      }),
      visitor
    );
  } catch (err) {
    console.error(
      "[api/gathering/music/react] rested:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "The feeling did not land. Try again." },
      { status: 500 }
    );
  }
}
