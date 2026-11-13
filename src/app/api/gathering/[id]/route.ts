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
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const post = await db.gatheringPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, provider: true, image: true } },
        circle: { select: { id: true, name: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }

    /* the visibility law — the server decides, never the visitor's politeness */
    let visible = false;
    if (post.visibility === "public") visible = true;
    else if (post.userId === visitor.user.id) visible = true;
    else if (post.visibility === "circle" && post.circleId) {
      const membership = await db.networkCircleMember.findUnique({
        where: { circleId_userId: { circleId: post.circleId, userId: visitor.user.id } },
        select: { id: true },
      });
      visible = Boolean(membership);
    } else if (post.visibility === "connections") {
      const link = await db.networkConnection.findFirst({
        where: {
          OR: [
            { requesterId: visitor.user.id, addresseeId: post.userId, status: "accepted" },
            { requesterId: post.userId, addresseeId: visitor.user.id, status: "accepted" },
          ],
        },
        select: { id: true },
      });
      visible = Boolean(link);
    }
    /* drafts and unpublished hang nowhere — only their maker reads them */
    if (post.status !== "published" && post.userId !== visitor.user.id) visible = false;

    if (!visible) {
      return NextResponse.json({ error: "This offering rests in a room you do not walk." }, { status: 403 });
    }

    const walls = await wallIdsFor(visitor.user.id);
    if (walls.has(post.userId) && post.userId !== visitor.user.id) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const echoes = await db.gatheringEcho.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: { name: true, email: true, provider: true, image: true } } },
    });

    const resonated = await db.gatheringResonance.findFirst({
      where: { postId: id, userId: visitor.user.id },
      select: { id: true },
    });

    /* the reader's own shelf and the page's living attachments — read
       once, straight from the tables, never guessed */
    const [bookmarked, reposted, repostCount, hasQuestion, hasLab, hasIntentionSpace] =
      await Promise.all([
        db.gatheringBookmark.findFirst({
          where: { postId: id, userId: visitor.user.id },
          select: { id: true },
        }),
        db.gatheringRepost.findFirst({
          where: { postId: id, userId: visitor.user.id },
          select: { id: true },
        }),
        db.gatheringRepost.count({ where: { postId: id } }),
        db.networkQuestion.findFirst({ where: { postId: id }, select: { id: true } }),
        db.networkLabProject.findFirst({ where: { seedPostId: id }, select: { id: true } }),
        db.networkIntention.findFirst({ where: { seedPostId: id }, select: { id: true } }),
      ]);

    return withAnonCookie(
      NextResponse.json({
        post: {
          id: post.id,
          kind: post.kind,
          title: post.title,
          body: post.body,
          sector: post.sector,
          tags: (post.tags ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sourcePortal: post.sourcePortal,
          sourceType: post.sourceType,
          cover: post.cover,
          refUrl: post.refUrl,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          mediaName: post.mediaName,
          visibility: post.visibility,
          epistemic: post.epistemic,
          circle: post.circle ? { id: post.circle.id, name: post.circle.name } : null,
          resonanceCount: post.resonanceCount,
          echoCount: post.echoCount,
          createdAt: post.createdAt.toISOString(),
          author: {
            id: post.userId,
            name: gatheringName(post.user),
            fullName: networkName(post.user),
            image: post.user.image ?? null,
            anon: post.user.provider === "anon",
          },
          mine: post.userId === visitor.user.id,
          resonated: Boolean(resonated),
          repostCount,
          bookmarked: Boolean(bookmarked),
          reposted: Boolean(reposted),
          hasQuestion: Boolean(hasQuestion),
          hasLab: Boolean(hasLab),
          hasIntentionSpace: Boolean(hasIntentionSpace),
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
    return NextResponse.json({ error: "The offering could not be read." }, { status: 500 });
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
