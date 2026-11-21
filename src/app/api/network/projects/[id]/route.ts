import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify, splitList } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE WORKSHOP'S ROOM — /api/network/projects/[id]                   */
/*                                                                     */
/*  GET  — the workshop itself: its weavers, its contributions in      */
/*         order (each keeping its maker), and its EVOLUTION PATH —    */
/*         the honest walk from the seed idea to the published work.   */
/*  POST — the hands of the room:                                      */
/*           action=join     — a maker joins the weaving;              */
/*           action=entry    — a contribution is laid down;            */
/*           action=publish  — the work enters the Collective Library, */
/*                             every weaver's name carried with it;    */
/*           action=invite   — a maker is invited in (owner's hand).   */
/* ------------------------------------------------------------------ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const project = await db.networkProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        seedPost: {
          select: {
            id: true, title: true, body: true, kind: true, createdAt: true,
            resonanceCount: true, echoCount: true,
            user: { select: { name: true, email: true, provider: true } },
          },
        },
        libraryItem: { select: { id: true, title: true, createdAt: true } },
        _count: { select: { members: true, entries: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "That workshop no longer stands." }, { status: 404 });
    }

    const [members, entries, myMembership] = await Promise.all([
      db.networkProjectMember.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, provider: true, image: true } } },
      }),
      db.networkProjectEntry.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, provider: true } } },
      }),
      db.networkProjectMember.findUnique({
        where: { projectId_userId: { projectId: id, userId: visitor.user.id } },
        select: { role: true },
      }),
    ]);

    /* THE EVOLUTION PATH — read from what actually stands:
       the seed idea, its resonances and echoes, the weavers who came,
       the contributions laid down, and the published work. */
    const path = [
      project.seedPost
        ? {
            stage: "idea",
            title: project.seedPost.title,
            detail: `${project.seedPost.resonanceCount} resonances · ${project.seedPost.echoCount} echoes`,
            by: networkName(project.seedPost.user),
            at: project.seedPost.createdAt.toISOString(),
          }
        : {
            stage: "idea",
            title: project.title,
            detail: "The workshop's own founding idea",
            by: networkName(project.owner),
            at: project.createdAt.toISOString(),
          },
      ...entries.map((e) => ({
        stage: "contribution",
        title: e.body.slice(0, 80) + (e.body.length > 80 ? "…" : ""),
        detail: `a contribution of ${e.body.length} letters`,
        by: networkName(e.user),
        at: e.createdAt.toISOString(),
      })),
      ...(project.libraryItem
        ? [
            {
              stage: "published",
              title: project.libraryItem.title,
              detail: "entered the Collective Library",
              by: networkName(project.owner),
              at: project.libraryItem.createdAt.toISOString(),
            },
          ]
        : []),
    ];

    return withAnonCookie(
      NextResponse.json({
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          focus: project.focus,
          status: project.status,
          memberCount: project._count.members,
          entryCount: project._count.entries,
          owner: { id: project.owner.id, name: networkName(project.owner) },
          libraryItem: project.libraryItem
            ? { id: project.libraryItem.id, title: project.libraryItem.title }
            : null,
          createdAt: project.createdAt.toISOString(),
        },
        seedPost: project.seedPost
          ? {
              id: project.seedPost.id,
              title: project.seedPost.title,
              body: project.seedPost.body,
              kind: project.seedPost.kind,
              createdAt: project.seedPost.createdAt.toISOString(),
              author: { name: networkName(project.seedPost.user) },
            }
          : null,
        members: members.map((m) => ({
          id: m.userId,
          name: networkName(m.user),
          image: m.user.image ?? null,
          anon: m.user.provider === "anon",
          role: m.role,
          since: m.createdAt.toISOString(),
        })),
        entries: entries.map((e) => ({
          id: e.id,
          body: e.body,
          by: networkName(e.user),
          mine: e.userId === visitor.user.id,
          createdAt: e.createdAt.toISOString(),
        })),
        path,
        membership: myMembership ? { role: myMembership.role } : null,
      }),
      visitor
    );
  } catch (err) {
    console.error("network project GET failed", err);
    return NextResponse.json({ error: "The workshop could not be read." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const project = await db.networkProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        members: { select: { userId: true } },
        libraryItem: { select: { id: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "That workshop no longer stands." }, { status: 404 });
    }

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      body?: unknown;
      userId?: unknown;
    } | null;
    const action = raw?.action;

    if (action === "join") {
      const flood = rateLimit(`network:project:join:${visitor.user.id}`, { limit: 15, windowMs: 10 * 60 * 1000 });
      if (!flood.ok) {
        return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
      }
      const existing = project.members.find((m) => m.userId === visitor.user.id);
      if (existing) {
        return withAnonCookie(NextResponse.json({ joined: true }), visitor);
      }
      await db.networkProjectMember.create({
        data: { projectId: id, userId: visitor.user.id, role: "collaborator" },
      });
      await notify({
        userId: project.ownerId,
        actorId: visitor.user.id,
        actorName: networkName(visitor.user),
        type: "project_join",
        body: project.title,
        refType: "project",
        refId: id,
      });
      return withAnonCookie(NextResponse.json({ joined: true }), visitor);
    }

    if (action === "entry") {
      const membership = project.members.find((m) => m.userId === visitor.user.id);
      if (!membership) {
        return NextResponse.json({ error: "Only a weaver may lay a contribution down." }, { status: 403 });
      }
      const flood = rateLimit(`network:project:entry:${visitor.user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
      if (!flood.ok) {
        return NextResponse.json({ error: "The workshop asks for a breath — weave again in a moment." }, { status: 429 });
      }
      const body = typeof raw?.body === "string" ? raw.body.trim().slice(0, 6000) : "";
      if (body.length < 2) {
        return NextResponse.json({ error: "The contribution arrived empty." }, { status: 400 });
      }
      const created = await db.networkProjectEntry.create({
        data: { projectId: id, userId: visitor.user.id, body },
      });
      await db.networkProject.update({ where: { id }, data: { status: "weaving", updatedAt: new Date() } });
      /* the weavers' bells ring, the owner's too — never the maker's own */
      for (const m of project.members) {
        if (m.userId !== visitor.user.id) {
          await notify({
            userId: m.userId,
            actorId: visitor.user.id,
            actorName: networkName(visitor.user),
            type: "project_entry",
            body: `${project.title}: ${body.slice(0, 100)}`,
            refType: "project",
            refId: id,
          });
        }
      }
      return withAnonCookie(
        NextResponse.json({
          entry: {
            id: created.id,
            body: created.body,
            by: networkName(visitor.user),
            mine: true,
            createdAt: created.createdAt.toISOString(),
          },
        }),
        visitor
      );
    }

    if (action === "invite") {
      if (project.ownerId !== visitor.user.id) {
        return NextResponse.json({ error: "Only the founder may invite weavers." }, { status: 403 });
      }
      const flood = rateLimit(`network:project:invite:${visitor.user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 });
      if (!flood.ok) {
        return NextResponse.json({ error: "A breath first — try again in a moment." }, { status: 429 });
      }
      const targetId = typeof raw?.userId === "string" ? raw.userId : "";
      const target = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!target) {
        return NextResponse.json({ error: "That maker is not in the network." }, { status: 404 });
      }
      if (project.members.some((m) => m.userId === targetId)) {
        return withAnonCookie(NextResponse.json({ invited: true, alreadyMember: true }), visitor);
      }
      await db.networkProjectMember.create({
        data: { projectId: id, userId: targetId, role: "collaborator" },
      });
      await notify({
        userId: targetId,
        actorId: visitor.user.id,
        actorName: networkName(visitor.user),
        type: "project_invite",
        body: project.title,
        refType: "project",
        refId: id,
      });
      return withAnonCookie(NextResponse.json({ invited: true }), visitor);
    }

    if (action === "publish") {
      const membership = project.members.find((m) => m.userId === visitor.user.id);
      if (!membership) {
        return NextResponse.json({ error: "Only a weaver may lay the work down." }, { status: 403 });
      }
      if (project.libraryItem) {
        return withAnonCookie(
          NextResponse.json({ libraryItem: { id: project.libraryItem.id } }),
          visitor
        );
      }
      const entries = await db.networkProjectEntry.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, provider: true } } },
      });
      const authorNames = Array.from(
        new Set([networkName(project.owner), ...entries.map((e) => networkName(e.user))])
      );
      const summary =
        (project.description ?? "").trim().slice(0, 400) ||
        (entries.length > 0 ? entries[entries.length - 1].body.slice(0, 400) : project.title);

      const item = await db.networkLibraryItem.create({
        data: {
          title: project.title,
          summary,
          category: project.focus === "community" ? "project" : project.focus,
          tags: Array.from(new Set(entries.flatMap((e) => splitList(null)))).join(",") || null,
          authorName: authorNames.join(", "),
          userId: visitor.user.id,
          projectId: id,
          postId: project.seedPostId,
        },
      });
      await db.networkProject.update({ where: { id }, data: { status: "published", updatedAt: new Date() } });
      for (const m of project.members) {
        if (m.userId !== visitor.user.id) {
          await notify({
            userId: m.userId,
            actorId: visitor.user.id,
            actorName: networkName(visitor.user),
            type: "project_entry",
            body: `"${project.title}" entered the Collective Library`,
            refType: "project",
            refId: id,
          });
        }
      }
      return withAnonCookie(NextResponse.json({ libraryItem: { id: item.id } }), visitor);
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network project POST failed", err);
    return NextResponse.json({ error: "The workshop's door could not be moved." }, { status: 500 });
  }
}
