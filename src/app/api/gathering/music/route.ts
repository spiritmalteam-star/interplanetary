import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  THE GATHERING — where rendered transmissions meet their listeners. */
/*                                                                      */
/*  A published track lays down a REAL, playable music post: the        */
/*  original audio asset is preserved untouched, artwork is derived     */
/*  from the track's own seed, metadata and creator attribution ride    */
/*  along, and one publication per track — never a duplicate.           */
/* ------------------------------------------------------------------ */

interface PostDto {
  id: string;
  caption: string | null;
  createdAt: string;
  creator: string;
  reactions: { kind: string; count: number; mine: boolean }[];
  track: {
    id: string;
    title: string;
    audioUrl: string | null;
    duration: number | null;
    genres: string[];
    lyrics: string | null;
    style: string | null;
  };
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const posts = await db.musicPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        track: {
          select: {
            id: true,
            title: true,
            audioUrl: true,
            duration: true,
            genres: true,
            lyrics: true,
            style: true,
          },
        },
        user: { select: { name: true, email: true } },
        reactions: { select: { kind: true, userId: true } },
      },
    });

    const shaped: PostDto[] = posts.map((p) => {
      const counts = new Map<string, { count: number; mine: boolean }>();
      for (const r of p.reactions) {
        const hit = counts.get(r.kind) ?? { count: 0, mine: false };
        hit.count += 1;
        if (r.userId === visitor.user.id) hit.mine = true;
        counts.set(r.kind, hit);
      }
      let genres: string[] = [];
      try {
        const parsed = JSON.parse(p.track.genres);
        if (Array.isArray(parsed)) genres = parsed.map(String).slice(0, 4);
      } catch {
        /* older rows keep no fusion */
      }
      /* the name a keeper goes by — anonymous visitors stay unnamed, gently */
      const email = p.user?.email ?? "";
      const creator =
        p.user?.name ||
        (email.startsWith("anon:")
          ? "an anonymous keeper"
          : email.split("@")[0] || "an anonymous keeper");
      return {
        id: p.id,
        caption: p.caption,
        createdAt: p.createdAt.toISOString(),
        creator,
        reactions: [...counts.entries()].map(([kind, v]) => ({
          kind,
          count: v.count,
          mine: v.mine,
        })),
        track: {
          id: p.track.id,
          title: p.track.title,
          audioUrl: p.track.audioUrl,
          duration: p.track.duration,
          genres,
          lyrics: p.track.lyrics,
          style: p.track.style,
        },
      };
    });

    return withAnonCookie(NextResponse.json({ posts: shaped }), visitor);
  } catch (err) {
    console.error(
      "[api/gathering/music] rested:",
      err instanceof Error ? err.message : err
    );
    return withAnonCookie(NextResponse.json({ posts: [] }), visitor);
  }
}

export async function POST(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  const body = (await req.json().catch(() => null)) as {
    trackId?: string;
    caption?: string;
  } | null;
  if (!body?.trackId) {
    return NextResponse.json({ error: "No transmission was named." }, { status: 400 });
  }

  const track = await db.track.findUnique({ where: { id: body.trackId } }).catch(() => null);
  if (!track || track.userId !== visitor.user.id) {
    return NextResponse.json({ error: "No such transmission." }, { status: 404 });
  }
  if (track.status !== "ready" || !track.audioUrl) {
    return NextResponse.json(
      { error: "Only a finished transmission can be shared." },
      { status: 409 }
    );
  }

  try {
    /* idempotent by track — the same transmission never publishes twice */
    const post = await db.musicPost.upsert({
      where: { trackId: track.id },
      update: {
        caption:
          typeof body.caption === "string" && body.caption.length <= 280
            ? body.caption
            : undefined,
      },
      create: {
        trackId: track.id,
        userId: visitor.user.id,
        caption:
          typeof body.caption === "string" && body.caption.length <= 280
            ? body.caption
            : null,
      },
    });
    return withAnonCookie(NextResponse.json({ ok: true, postId: post.id }), visitor);
  } catch (err) {
    console.error(
      "[api/gathering/music] publish rested:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "The Gathering rests a moment. Try again in a breath." },
      { status: 500 }
    );
  }
}
