import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE CIRCLE'S DOOR — /api/network/circles/[id]                      */
/*                                                                     */
/*  GET  — the circle's own room: its members, its hung offerings,     */
/*         the visitor's own membership truth.                         */
/*  POST — join, or let the membership rest. The owner's bell rings    */
/*         when someone arrives.                                       */
/* ------------------------------------------------------------------ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const circle = await db.networkCircle.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!circle) {
      return NextResponse.json({ error: "That circle no longer meets." }, { status: 404 });
    }

    const membership = await db.networkCircleMember.findUnique({
      where: { circleId_userId: { circleId: id, userId: visitor.user.id } },
      select: { role: true },
    });

    const [members, posts] = await Promise.all([
      db.networkCircleMember.findMany({
        where: { circleId: id },
        take: 60,
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, provider: true, image: true } } },
      }),
      db.gatheringPost.findMany({
        where: { circleId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { name: true, email: true, provider: true, image: true } },
          _count: { select: { resonances: true, echoes: true } },
        },
      }),
    ]);

    return withAnonCookie(
      NextResponse.json({
        circle: {
          id: circle.id,
          name: circle.name,
          description: circle.description,
          focus: circle.focus,
          visibility: circle.visibility,
          memberCount: circle._count.members,
          postCount: circle._count.posts,
          owner: { id: circle.owner.id, name: networkName(circle.owner) },
          joined: !!membership,
          role: membership?.role ?? null,
          createdAt: circle.createdAt.toISOString(),
        },
        members: members.map((m) => ({
          id: m.userId,
          name: networkName(m.user),
          image: m.user.image ?? null,
          anon: m.user.provider === "anon",
          role: m.role,
          since: m.createdAt.toISOString(),
        })),
        posts: posts.map((p) => ({
          id: p.id,
          kind: p.kind,
          title: p.title,
          body: p.body,
          sector: p.sector,
          tags: p.tags,
          resonanceCount: p._count.resonances,
          echoCount: p._count.echoes,
          createdAt: p.createdAt.toISOString(),
          author: {
            name: networkName(p.user),
            image: p.user.image ?? null,
            anon: p.user.provider === "anon",
          },
          mine: p.userId === visitor.user.id,
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error("network circle GET failed", err);
    return NextResponse.json({ error: "The circle could not be read." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:circle:join:${visitor.user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
    }

    const circle = await db.networkCircle.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true, visibility: true },
    });
    if (!circle) {
      return NextResponse.json({ error: "That circle no longer meets." }, { status: 404 });
    }

    const membership = await db.networkCircleMember.findUnique({
      where: { circleId_userId: { circleId: id, userId: visitor.user.id } },
      select: { id: true, role: true },
    });

    const raw = (await req.json().catch(() => null)) as { action?: unknown } | null;
    const action = raw?.action === "leave" ? "leave" : "join";

    if (action === "leave") {
      if (!membership) {
        return withAnonCookie(NextResponse.json({ joined: false }), visitor);
      }
      if (membership.role === "owner") {
        return NextResponse.json(
          { error: "A founder may not leave their own circle — take it apart instead." },
          { status: 400 }
        );
      }
      await db.networkCircleMember.delete({ where: { id: membership.id } });
      return withAnonCookie(NextResponse.json({ joined: false }), visitor);
    }

    if (membership) {
      return withAnonCookie(NextResponse.json({ joined: true, role: membership.role }), visitor);
    }

    await db.networkCircleMember.create({
      data: { circleId: id, userId: visitor.user.id, role: "member" },
    });
    await notify({
      userId: circle.ownerId,
      actorId: visitor.user.id,
      actorName: networkName(visitor.user),
      type: "circle_join",
      body: circle.name,
      refType: "circle",
      refId: id,
    });
    return withAnonCookie(NextResponse.json({ joined: true, role: "member" }), visitor);
  } catch (err) {
    console.error("network circle POST failed", err);
    return NextResponse.json({ error: "The circle's door could not be moved." }, { status: 500 });
  }
}
