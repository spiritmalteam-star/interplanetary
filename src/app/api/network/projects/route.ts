import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { isProjectFocus, networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE SHARED WORKSHOPS — /api/network/projects                       */
/*                                                                     */
/*  GET  — the collective creations: open invitations and works in     */
/*         the weaving, newest first.                                  */
/*  POST — open a workshop: a title, a focus, optionally the idea it   */
/*         grew from (an offering in the hall — the evolution path's   */
/*         first stone), and the makers invited to weave.              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "1";
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const take = Math.min(48, Math.max(6, Number(url.searchParams.get("take") ?? 24)));

    const rows = await db.networkProject.findMany({
      where: mine ? { members: { some: { userId: visitor.user.id } } } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 120,
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        seedPost: { select: { id: true, title: true } },
        libraryItem: { select: { id: true, title: true } },
        _count: { select: { members: true, entries: true } },
      },
    });

    const memberships = await db.networkProjectMember.findMany({
      where: { userId: visitor.user.id },
      select: { projectId: true },
    });
    const joinedIds = new Set(memberships.map((m) => m.projectId));
    const walls = await wallIdsFor(visitor.user.id);

    const projects = rows
      .filter((p) => !walls.has(p.ownerId))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, take)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        focus: p.focus,
        status: p.status,
        seedPost: p.seedPost ? { id: p.seedPost.id, title: p.seedPost.title } : null,
        libraryItem: p.libraryItem ? { id: p.libraryItem.id, title: p.libraryItem.title } : null,
        memberCount: p._count.members,
        entryCount: p._count.entries,
        owner: { id: p.owner.id, name: networkName(p.owner) },
        joined: joinedIds.has(p.id),
        mine: p.ownerId === visitor.user.id,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));

    return withAnonCookie(NextResponse.json({ projects }), visitor);
  } catch (err) {
    console.error("network projects GET failed", err);
    return NextResponse.json({ error: "The workshops could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:project:create:${visitor.user.id}`, { limit: 6, windowMs: 60 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The workshops ask for a breath — open again in a little while." },
        { status: 429 }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      description?: unknown;
      focus?: unknown;
      seedPostId?: unknown;
      inviteIds?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The workshop arrived unreadable." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 120) : "";
    const description =
      typeof raw.description === "string" ? raw.description.trim().slice(0, 2000) : null;
    if (title.length < 3) {
      return NextResponse.json({ error: "A workshop's name wants at least 3 letters." }, { status: 400 });
    }
    if (!isProjectFocus(raw.focus)) {
      return NextResponse.json({ error: "Choose what is being woven." }, { status: 400 });
    }

    let seedPostId: string | null = null;
    if (typeof raw.seedPostId === "string" && raw.seedPostId.length > 0) {
      const seed = await db.gatheringPost.findUnique({
        where: { id: raw.seedPostId },
        select: { id: true, userId: true, resonanceCount: true, echoCount: true },
      });
      if (!seed) {
        return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
      }
      seedPostId = seed.id;
    }

    const walls = await wallIdsFor(visitor.user.id);
    const inviteIds = Array.from(
      new Set(
        Array.isArray(raw.inviteIds)
          ? raw.inviteIds.filter((x): x is string => typeof x === "string" && x !== visitor.user.id)
          : []
      )
    ).slice(0, 12);
    if (inviteIds.some((id) => walls.has(id))) {
      return NextResponse.json({ error: "One of these doors rests closed." }, { status: 403 });
    }

    const created = await db.networkProject.create({
      data: {
        title,
        description: description && description.length >= 2 ? description : null,
        focus: raw.focus,
        seedPostId,
        ownerId: visitor.user.id,
        members: { create: [{ userId: visitor.user.id, role: "owner" }] },
      },
    });

    if (inviteIds.length > 0) {
      const real = await db.user.findMany({ where: { id: { in: inviteIds } }, select: { id: true } });
      await db.networkProjectMember.createMany({
        data: real.map((r) => ({ projectId: created.id, userId: r.id, role: "collaborator" })),
      });
      for (const r of real) {
        await db.networkNotification.create({
          data: {
            userId: r.id,
            type: "project_invite",
            actorName: networkName(visitor.user),
            body: title,
            refType: "project",
            refId: created.id,
          },
        });
      }
    }

    return withAnonCookie(
      NextResponse.json({
        project: {
          id: created.id,
          title: created.title,
          focus: created.focus,
          status: created.status,
          seedPostId: created.seedPostId,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network projects POST failed", err);
    return NextResponse.json({ error: "The workshop could not be opened." }, { status: 500 });
  }
}
