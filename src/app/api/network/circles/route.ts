import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { isNetworkFocus, networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE CIRCLES' SQUARE — /api/network/circles                         */
/*                                                                     */
/*  GET  — the communities: newest first, their focus worn openly,     */
/*         membership truth read from the tables.                      */
/*  POST — found a circle: a name, a focus, a visibility, the          */
/*         founder's own hand.                                         */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const focus = url.searchParams.get("focus");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const mine = url.searchParams.get("mine") === "1";
    const take = Math.min(48, Math.max(6, Number(url.searchParams.get("take") ?? 30)));

    const memberships = await db.networkCircleMember.findMany({
      where: { userId: visitor.user.id },
      select: { circleId: true, role: true },
    });
    const joinedIds = new Set(memberships.map((m) => m.circleId));
    const roleOf = new Map(memberships.map((m) => [m.circleId, m.role]));

    const rows = await db.networkCircle.findMany({
      where: {
        ...(isNetworkFocus(focus) ? { focus } : {}),
        ...(mine ? { members: { some: { userId: visitor.user.id } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 120,
      include: { _count: { select: { members: true, posts: true } } },
    });

    const walls = await wallIdsFor(visitor.user.id);
    const visible = rows
      .filter((c) => !walls.has(c.ownerId))
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, take);

    /* the founders' names ride honestly — one quiet read */
    const founders = await db.user.findMany({
      where: { id: { in: Array.from(new Set(visible.map((c) => c.ownerId))) } },
      select: { id: true, name: true, email: true, provider: true },
    });
    const founderNames = new Map(founders.map((f) => [f.id, networkName(f)]));

    const circles = visible.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      focus: c.focus,
      visibility: c.visibility,
      memberCount: c._count.members,
      postCount: c._count.posts,
      joined: joinedIds.has(c.id),
      role: roleOf.get(c.id) ?? null,
      owner: { name: founderNames.get(c.ownerId) ?? "A quiet explorer" },
      createdAt: c.createdAt.toISOString(),
    }));

    return withAnonCookie(NextResponse.json({ circles }), visitor);
  } catch (err) {
    console.error("network circles GET failed", err);
    return NextResponse.json({ error: "The circles could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:circle:create:${visitor.user.id}`, { limit: 4, windowMs: 60 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The square asks for a breath — found again in a little while." },
        { status: 429 }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      name?: unknown;
      description?: unknown;
      focus?: unknown;
      visibility?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The circle arrived unreadable." }, { status: 400 });
    }

    const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "";
    const description =
      typeof raw.description === "string" ? raw.description.trim().slice(0, 500) : null;
    if (name.length < 3) {
      return NextResponse.json({ error: "A circle's name wants at least 3 letters." }, { status: 400 });
    }
    if (!isNetworkFocus(raw.focus)) {
      return NextResponse.json({ error: "Choose the circle's focus." }, { status: 400 });
    }
    const visibility = raw.visibility === "invite" ? "invite" : "public";

    const created = await db.networkCircle.create({
      data: {
        name,
        description: description && description.length >= 2 ? description : null,
        focus: raw.focus,
        visibility,
        ownerId: visitor.user.id,
      },
    });
    await db.networkCircleMember.create({
      data: { circleId: created.id, userId: visitor.user.id, role: "owner" },
    });

    return withAnonCookie(
      NextResponse.json({
        circle: {
          id: created.id,
          name: created.name,
          description: created.description,
          focus: created.focus,
          visibility: created.visibility,
          memberCount: 1,
          postCount: 0,
          joined: true,
          role: "owner",
          owner: { name: networkName(visitor.user) },
          createdAt: created.createdAt.toISOString(),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network circles POST failed", err);
    return NextResponse.json({ error: "The circle could not be founded." }, { status: 500 });
  }
}
