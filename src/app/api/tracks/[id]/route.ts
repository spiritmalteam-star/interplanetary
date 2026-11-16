import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  ONE TRANSMISSION — the track's own door.                           */
/*  PATCH carries the visitor's marks: the QA report from the chamber  */
/*  (quality), karaoke timing (sync), the heart (favorite), and the    */
/*  pull to share (publish/unpublish → The Gathering). Every write is  */
/*  authenticated and owned; nothing crosses another keeper's lines.   */
/* ------------------------------------------------------------------ */

interface PatchBody {
  quality?: unknown;
  sync?: unknown;
  favorite?: boolean;
  caption?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const visitor = await resolveVisitor(req);
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Nothing was written." }, { status: 400 });
  }

  const track = await db.track
    .findUnique({ where: { id }, include: { post: { select: { id: true } } } })
    .catch(() => null);
  if (!track || track.userId !== visitor.user.id) {
    return NextResponse.json({ error: "No such transmission." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.quality !== undefined) data.quality = body.quality as object;
  if (body.sync !== undefined) data.sync = body.sync as object;
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;
  if (typeof body.caption === "string" && body.caption.length <= 280 && track.post) {
    await db.musicPost
      .update({ where: { trackId: track.id }, data: { caption: body.caption } })
      .catch(() => undefined);
  }

  if (Object.keys(data).length > 0) {
    await db.track.update({ where: { id: track.id }, data }).catch(() => undefined);
  }

  return withAnonCookie(NextResponse.json({ ok: true }), visitor);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const visitor = await resolveVisitor(req);
  const { id } = await params;
  const track = await db.track
    .findUnique({ where: { id }, include: { post: { select: { id: true } } } })
    .catch(() => null);
  if (!track || track.userId !== visitor.user.id) {
    return NextResponse.json({ error: "No such transmission." }, { status: 404 });
  }
  return withAnonCookie(NextResponse.json({ ok: true }), visitor);
}
