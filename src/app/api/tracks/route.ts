import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  THE TRANSMISSIONS' VAULT — the visitor's own tracks, server-side.  */
/*  GET: the library of every transmission the sound engine rendered   */
/*  for this visitor, newest first (the localStorage mirror hydrates   */
/*  from here, so a transmission never dies with a cleared browser).   */
/* ------------------------------------------------------------------ */

export interface TrackDto {
  id: string;
  title: string;
  mode: string;
  intention: string;
  genres: string[];
  style: string | null;
  negative: string | null;
  lyrics: string | null;
  notes: string | null;
  spec: unknown;
  sync: unknown;
  quality: unknown;
  audioUrl: string | null;
  duration: number | null;
  status: string;
  favorite: boolean;
  published: boolean;
  createdAt: string;
}

function dto(row: {
  id: string;
  title: string;
  mode: string;
  intention: string;
  genres: string;
  style: string | null;
  negative: string | null;
  lyrics: string | null;
  notes: string | null;
  spec: unknown;
  sync: unknown;
  quality: unknown;
  audioUrl: string | null;
  duration: number | null;
  status: string;
  favorite: boolean;
  createdAt: Date;
  post: { id: string } | null;
}): TrackDto {
  let genres: string[] = [];
  try {
    const parsed = JSON.parse(row.genres);
    if (Array.isArray(parsed)) genres = parsed.map(String).slice(0, 4);
  } catch {
    /* older rows keep no fusion */
  }
  return {
    id: row.id,
    title: row.title,
    mode: row.mode,
    intention: row.intention,
    genres,
    style: row.style,
    negative: row.negative,
    lyrics: row.lyrics,
    notes: row.notes,
    spec: row.spec,
    sync: row.sync,
    quality: row.quality,
    audioUrl: row.audioUrl,
    duration: row.duration,
    status: row.status,
    favorite: row.favorite,
    published: !!row.post,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const rows = await db.track.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { post: { select: { id: true } } },
    });
    return withAnonCookie(
      NextResponse.json({ tracks: rows.map(dto) }),
      visitor
    );
  } catch (err) {
    console.error(
      "[api/tracks] rested:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(NextResponse.json({ tracks: [] }), visitor);
  }
}
