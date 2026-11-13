import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { gatheringName } from "../../route";
import { networkName, wallIdsFor, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE ECHOES — an offering's responses: GET reads them, POST adds    */
/*  one. An echo is a response, not a comment section — short, calm,   */
/*  signed, and belonging to the hall's own weather.                   */
/*                                                                     */
/*  THE THREAD LAW: a thread breathes two levels deep — an echo may    */
/*  answer the offering's echoes, but never another answer. Replies    */
/*  to replies are sent back to the root by the visitor's own hand.    */
/* ------------------------------------------------------------------ */
const ECHO_MAX = 2000;

/* ---------------- GET — the echo row of one offering ---------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    /* the quiet walls hold here too — a closed door's echoes never reach */
    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.gatheringEcho.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true, provider: true, image: true } },
      },
    });

    const echoes = rows
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
      }));

    return withAnonCookie(NextResponse.json({ echoes }), visitor);
  } catch (err) {
    console.error("gathering echoes GET failed", err);
    return NextResponse.json({ error: "The echoes could not be heard." }, { status: 500 });
  }
}

/* ---------------- POST — add one echo ---------------- */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    /* the quiet walls — a closed door's words never reach the visitor,
       and the visitor never reaches a closed door */
    const walls = await wallIdsFor(visitor.user.id);

    const flood = rateLimit(`gathering:echo:${visitor.user.id}`, {
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The hall asks for a breath — echo again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      body?: unknown;
      parentId?: unknown;
    } | null;
    const body = typeof raw?.body === "string" ? raw.body.trim() : "";
    if (body.length < 1 || body.length > ECHO_MAX) {
      return NextResponse.json(
        { error: `An echo wants between 1 and ${ECHO_MAX} letters.` },
        { status: 400 }
      );
    }

    /* the thread law — an echo may answer another echo of the same
       offering, but only at the root: replies to replies are refused,
       and the visitor's hand is asked to answer the top-level parent */
    let parentId: string | null = null;
    if (typeof raw?.parentId === "string" && raw.parentId.trim().length > 0) {
      const parent = await db.gatheringEcho.findUnique({
        where: { id: raw.parentId },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== id) {
        return NextResponse.json(
          { error: "Answer an echo that hangs beneath this offering." },
          { status: 400 }
        );
      }
      if (parent.parentId) {
        return NextResponse.json(
          { error: "Threads breathe two levels deep — answer the root." },
          { status: 400 }
        );
      }
      parentId = parent.id;
    }

    const post = await db.gatheringPost.findUnique({
      where: { id },
      select: { id: true, userId: true, title: true },
    });
    if (!post) {
      return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
    }

    /* the quiet walls hold here too — a closed door never echoes */
    if (post.userId !== visitor.user.id && walls.has(post.userId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const created = await db.gatheringEcho.create({
      data: { postId: id, userId: visitor.user.id, body, parentId },
    });
    const echoCount = await db.gatheringEcho.count({ where: { postId: id } });

    /* the maker's bell rings softly — a real response arrived */
    await notify({
      userId: post.userId,
      actorId: visitor.user.id,
      actorName: networkName(visitor.user),
      type: "echo",
      body: `${post.title}: ${body.slice(0, 120)}`,
      refType: "post",
      refId: post.id,
    });

    return withAnonCookie(
      NextResponse.json({
        echo: {
          id: created.id,
          parentId: created.parentId,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
          author: {
            name: gatheringName(visitor.user),
            image: visitor.user.image ?? null,
            anon: visitor.user.provider === "anon",
          },
          isMine: true,
        },
        echoCount,
      }),
      visitor
    );
  } catch (err) {
    console.error("gathering echoes POST failed", err);
    return NextResponse.json({ error: "The echo could not be spoken." }, { status: 500 });
  }
}
