import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, splitList, wallIdsFor, notify } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE MAKER'S DOOR — /api/network/people/[id]                        */
/*                                                                     */
/*  GET  — a creator's own room: their introduction, their public      */
/*         offerings, their circles and shared works, and the honest   */
/*         state between the visitor and them.                         */
/*  POST — the attention hand: follow, or let the attention rest.      */
/* ------------------------------------------------------------------ */

async function loadPerson(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      image: true,
      createdAt: true,
      networkProfile: { select: { bio: true, interests: true, disciplines: true, visibility: true } },
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const walls = await wallIdsFor(visitor.user.id);
    if (walls.has(id)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const person = await loadPerson(id);
    if (!person) {
      return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
    }

    const [posts, circles, projects, follow, outgoing, incoming] = await Promise.all([
      db.gatheringPost.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, kind: true, title: true, body: true, createdAt: true, resonanceCount: true, echoCount: true },
      }),
      db.networkCircleMember.findMany({
        where: { userId: id },
        take: 8,
        include: { circle: { select: { id: true, name: true, focus: true } } },
      }),
      db.networkProjectMember.findMany({
        where: { userId: id },
        take: 8,
        include: { project: { select: { id: true, title: true, focus: true, status: true } } },
      }),
      db.networkFollow.findUnique({
        where: { followerId_followingId: { followerId: visitor.user.id, followingId: id } },
        select: { id: true },
      }),
      db.networkConnection.findFirst({
        where: { requesterId: visitor.user.id, addresseeId: id },
        select: { id: true, status: true },
      }),
      db.networkConnection.findFirst({
        where: { requesterId: id, addresseeId: visitor.user.id },
        select: { id: true, status: true },
      }),
    ]);

    return withAnonCookie(
      NextResponse.json({
        person: {
          id: person.id,
          name: networkName(person),
          image: person.image ?? null,
          anon: person.provider === "anon",
          bio: person.networkProfile?.bio ?? null,
          interests: splitList(person.networkProfile?.interests),
          disciplines: splitList(person.networkProfile?.disciplines),
          since: person.createdAt.toISOString(),
        },
        posts: posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
        circles: circles.map((c) => ({ id: c.circle.id, name: c.circle.name, focus: c.circle.focus })),
        projects: projects.map((p) => ({
          id: p.project.id,
          title: p.project.title,
          focus: p.project.focus,
          status: p.project.status,
        })),
        relationship: {
          following: !!follow,
          connection: outgoing
            ? { id: outgoing.id, status: outgoing.status, direction: "outgoing" }
            : incoming
              ? { id: incoming.id, status: incoming.status, direction: "incoming" }
              : null,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network person GET failed", err);
    return NextResponse.json({ error: "The maker's room could not be read." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    if (id === visitor.user.id) {
      return NextResponse.json({ error: "One's own door is always open." }, { status: 400 });
    }
    const flood = rateLimit(`network:follow:${visitor.user.id}`, { limit: 30, windowMs: 10 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
    }
    const walls = await wallIdsFor(visitor.user.id);
    if (walls.has(id)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const person = await loadPerson(id);
    if (!person) {
      return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
    }

    const existing = await db.networkFollow.findUnique({
      where: { followerId_followingId: { followerId: visitor.user.id, followingId: id } },
      select: { id: true },
    });

    if (existing) {
      await db.networkFollow.delete({ where: { id: existing.id } });
      return withAnonCookie(NextResponse.json({ following: false }), visitor);
    }

    await db.networkFollow.create({
      data: { followerId: visitor.user.id, followingId: id },
    });
    await notify({
      userId: id,
      actorId: visitor.user.id,
      actorName: networkName(visitor.user),
      type: "follow",
      refType: "user",
      refId: visitor.user.id,
    });
    return withAnonCookie(NextResponse.json({ following: true }), visitor);
  } catch (err) {
    console.error("network person POST failed", err);
    return NextResponse.json({ error: "The attention could not be given." }, { status: 500 });
  }
}
