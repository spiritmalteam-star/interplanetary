import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

/* ------------------------------------------------------------------ */
/*  THE VAULT'S SHELF — GET /api/media                                 */
/*                                                                     */
/*  ?scope=mine — the visitor's own storage: every work they keep,     */
/*                published or not, newest first.                      */
/*  ?scope=feed — the hall: every work PUBLISHED into the gathering,   */
/*                newest first, ready for the flux and the hall.       */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MediaDTO {
  id: string;
  kind: string;
  title: string;
  mime: string;
  size: number;
  duration: number | null;
  published: boolean;
  resonance: number;
  createdAt: string;
  authorName: string;
  own: boolean;
  /** the stream url — the file itself never leaves the vault by path */
  url: string;
}

function toDTO(
  a: {
    id: string;
    kind: string;
    title: string;
    mime: string;
    size: number;
    duration: number | null;
    published: boolean;
    resonance: number;
    createdAt: Date;
    user: { id: string; name: string | null; email: string };
  },
  viewerId: string
): MediaDTO {
  return {
    id: a.id,
    kind: a.kind,
    title: a.title,
    mime: a.mime,
    size: a.size,
    duration: a.duration,
    published: a.published,
    resonance: a.resonance,
    createdAt: a.createdAt.toISOString(),
    authorName: a.user.name || "A gathered soul",
    own: a.user.id === viewerId,
    url: `/api/media/stream/${a.id}`,
  };
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  const scope = req.nextUrl.searchParams.get("scope") ?? "mine";
  const take = Math.min(
    120,
    Math.max(1, Number(req.nextUrl.searchParams.get("take") ?? 60) || 60)
  );

  try {
    if (scope === "feed") {
      const rows = await db.mediaAsset.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return withAnonCookie(
        NextResponse.json({ works: rows.map((r) => toDTO(r, visitor.user.id)) }),
        visitor
      );
    }

    const rows = await db.mediaAsset.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return withAnonCookie(
      NextResponse.json({ works: rows.map((r) => toDTO(r, visitor.user.id)) }),
      visitor
    );
  } catch (err) {
    console.error(
      "[media] shelf unreadable:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(
      NextResponse.json({ works: [], error: "The vault rests" }),
      visitor
    );
  }
}
