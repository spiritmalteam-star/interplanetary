import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { wallIdsFor, networkName } from "@/lib/server/network";
import { gatheringName } from "../route";

/* ------------------------------------------------------------------ */
/*  ONE OFFERING, READ WHOLE — GET /api/gathering/[id]                 */
/*                                                                     */
/*  The reader's door: the full body of a published offering, its      */
/*  echoes and its resonance count — visibility enforced at read       */
/*  time (public always; a circle's wall only for its own members;     */
/*  connections' works for accepted connections and the maker; the     */
/*  quiet walls always silence a blocked voice).                       */
/* ------------------------------------------------------------------ */
/* THE GRACEFUL SHELF — a young cloud may not carry every side table
   yet; the offering still opens. Each side read falls back to its
   honest empty answer instead of closing the reader's door. */
async function graceful<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch {
    return fallback;
  }
}

/* THE CASCADING SHELF — the reader tries the richest field shelf first
   and steps down until the sky's own database answers; every field a
   young sky has not built yet is then filled with its honest default. */
const POST_FIELD_LEVELS: Array<Record<string, true>> = [
  {
    id: true, kind: true, title: true, body: true, sector: true, region: true,
    tags: true, circleId: true, sourcePortal: true, sourceType: true, sourceId: true,
    refKind: true, refUrl: true, cover: true, mediaUrl: true, mediaType: true,
    mediaName: true, visibility: true, epistemic: true, status: true, language: true,
    altText: true, aiMedia: true, aiStyle: true, resonanceCount: true, echoCount: true,
    createdAt: true, userId: true,
  },
  {
    id: true, kind: true, title: true, body: true, sector: true, tags: true,
    circleId: true, sourcePortal: true, sourceType: true, cover: true, refUrl: true,
    mediaUrl: true, mediaType: true, visibility: true, epistemic: true, status: true,
    resonanceCount: true, echoCount: true, createdAt: true, userId: true,
  },
  {
    id: true, kind: true, title: true, body: true, tags: true, cover: true,
    mediaUrl: true, mediaType: true, visibility: true, status: true,
    resonanceCount: true, echoCount: true, createdAt: true, userId: true,
  },
];

const POST_READER_SELECT = { select: { id: true, name: true, email: true, provider: true, image: true } } as const;

async function readPostById(id: string): Promise<Record<string, unknown> | null> {
  for (const fields of POST_FIELD_LEVELS) {
    try {
      const post = await db.gatheringPost.findUnique({
        where: { id },
        select: { ...fields, user: POST_READER_SELECT },
      });
      return post as unknown as Record<string, unknown> | null;
    } catch {
      /* this shelf is not the sky's — try the next */
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const postRaw = await readPostById(id);
    if (!postRaw) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }
    const post = {
      ...postRaw,
      circle: (postRaw.circle as { id: string; name: string } | null) ?? null,
      visibility: String(postRaw.visibility ?? "public"),
      status: String(postRaw.status ?? "published"),
    };
    const postUserId = String(postRaw.userId);

    /* the visibility law — the server decides, never the visitor's politeness */
    let visible = false;
    if (post.visibility === "public") visible = true;
    else if (post.visibility === "unlisted") visible = true; // the quiet link — anyone who holds it
    else if (postUserId === visitor.user.id) visible = true; // the maker's own house, always
    else if (post.visibility === "circle" && post.circleId) {
      const membership = await graceful(
        () =>
          db.networkCircleMember.findUnique({
            where: { circleId_userId: { circleId: String(post.circleId), userId: visitor.user.id } },
            select: { id: true },
          }),
        null
      );
      visible = Boolean(membership);
    } else if (post.visibility === "connections") {
      const link = await graceful(
        () =>
          db.networkConnection.findFirst({
            where: {
              OR: [
                { requesterId: visitor.user.id, addresseeId: postUserId, status: "accepted" },
                { requesterId: postUserId, addresseeId: visitor.user.id, status: "accepted" },
              ],
            },
            select: { id: true },
          }),
        null
      );
      visible = Boolean(link);
    }
    /* drafts and unpublished hang nowhere — only their maker reads them */
    if (post.status !== "published" && postUserId !== visitor.user.id) visible = false;

    if (!visible) {
      return NextResponse.json({ error: "This offering rests in a room you do not walk." }, { status: 403 });
    }

    const walls = await graceful(() => wallIdsFor(visitor.user.id), new Set<string>());
    if (walls.has(post.userId) && post.userId !== visitor.user.id) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const echoes = await graceful(
      () =>
        db.gatheringEcho.findMany({
          where: { postId: id },
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { user: { select: { name: true, email: true, provider: true, image: true } } },
        }),
      [] as {
        id: string;
        parentId: string | null;
        body: string;
        createdAt: Date;
        userId: string;
        user: { name: string; email: string; provider: string | null; image: string | null };
      }[]
    );

    const resonated = await graceful(
      () =>
        db.gatheringResonance.findFirst({
          where: { postId: id, userId: visitor.user.id },
          select: { id: true },
        }),
      null
    );

    /* the reader's own shelf and the page's living attachments — read
       once, straight from the tables, never guessed; each shelf
       degrades gracefully on a young sky */
    const [bookmarked, reposted, repostCount, hasQuestion, hasLab, hasIntentionSpace] =
      await Promise.all([
        graceful(
          () =>
            db.gatheringBookmark.findFirst({
              where: { postId: id, userId: visitor.user.id },
              select: { id: true },
            }),
          null
        ),
        graceful(
          () =>
            db.gatheringRepost.findFirst({
              where: { postId: id, userId: visitor.user.id },
              select: { id: true },
            }),
          null
        ),
        graceful(() => db.gatheringRepost.count({ where: { postId: id } }), 0),
        graceful(
          () => db.networkQuestion.findFirst({ where: { postId: id }, select: { id: true } }),
          null
        ),
        graceful(
          () => db.networkLabProject.findFirst({ where: { seedPostId: id }, select: { id: true } }),
          null
        ),
        graceful(
          () => db.networkIntention.findFirst({ where: { seedPostId: id }, select: { id: true } }),
          null
        ),
      ]);

    return withAnonCookie(
      NextResponse.json({
        post: {
          id: String(postRaw.id),
          kind: String(postRaw.kind ?? "reflection"),
          title: String(postRaw.title ?? ""),
          body: String(postRaw.body ?? ""),
          sector: (postRaw.sector as string | null) ?? null,
          tags: String(postRaw.tags ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sourcePortal: (postRaw.sourcePortal as string | null) ?? null,
          sourceType: (postRaw.sourceType as string | null) ?? null,
          cover: (postRaw.cover as string | null) ?? null,
          refUrl: (postRaw.refUrl as string | null) ?? null,
          mediaUrl: (postRaw.mediaUrl as string | null) ?? null,
          mediaType: (postRaw.mediaType as string | null) ?? null,
          mediaName: (postRaw.mediaName as string | null) ?? null,
          visibility: post.visibility,
          epistemic: (postRaw.epistemic as string | null) ?? null,
          circle: (postRaw.circle as { id: string; name: string } | null) ?? null,
          resonanceCount: Number(postRaw.resonanceCount ?? 0),
          echoCount: Number(postRaw.echoCount ?? 0),
          createdAt: (postRaw.createdAt as Date).toISOString(),
          author: {
            id: postUserId,
            name: gatheringName(postRaw.user as Parameters<typeof gatheringName>[0]),
            fullName: networkName(postRaw.user as Parameters<typeof networkName>[0]),
            image: ((postRaw.user as { image?: string | null }).image ?? null),
            anon: ((postRaw.user as { provider?: string | null }).provider ?? "") === "anon",
          },
          mine: postUserId === visitor.user.id,
          resonated: Boolean(resonated),
          repostCount,
          bookmarked: Boolean(bookmarked),
          reposted: Boolean(reposted),
          hasQuestion: Boolean(hasQuestion),
          hasLab: Boolean(hasLab),
          hasIntentionSpace: Boolean(hasIntentionSpace),
          altText: (postRaw.altText as string | null) ?? null,
          aiMedia: Boolean(postRaw.aiMedia),
          aiStyle: (postRaw.aiStyle as string | null) ?? null,
        },
        echoes: echoes
          .filter((e) => !walls.has(e.userId))
          .map((e) => ({
            id: e.id,
            parentId: e.parentId,
            body: e.body,
            createdAt: e.createdAt.toISOString(),
            author: {
              name: gatheringName(e.user),
              image: e.user.image ?? null,
              anon: e.user.provider === "anon",
            },
            isMine: e.userId === visitor.user.id,
          })),
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering GET ONE failed", err);
    return NextResponse.json(
      {
        error: "The offering could not be read.",
        detail: err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240),
      },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  THE TAKING-BACK HAND — DELETE /api/gathering/[id]                  */
/*                                                                     */
/*  An offering belongs to its maker: only its own hand may take it    */
/*  out of the hall, echoes and resonances leaving with it.            */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }
    if (post.userId !== visitor.user.id) {
      return NextResponse.json({ error: "Only an offering's own maker may take it back." }, { status: 403 });
    }

    await db.gatheringPost.delete({ where: { id } });

    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("gathering DELETE failed", err);
    return NextResponse.json({ error: "The offering could not be taken back." }, { status: 500 });
  }
}
