import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { LIBRARY_CATEGORIES, networkName, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  THE COLLECTIVE LIBRARY — /api/network/library                      */
/*                                                                     */
/*  GET  — the archive: searchable, category-sorted, every item        */
/*         keeping its maker's name and where it grew from.            */
/*  POST — a contribution laid in: from an offering, a workshop or     */
/*         the visitor's own hand. Nothing enters by itself.           */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const mine = url.searchParams.get("mine") === "1";
    const take = Math.min(48, Math.max(6, Number(url.searchParams.get("take") ?? 24)));

    const walls = await wallIdsFor(visitor.user.id);
    const rows = await db.networkLibraryItem.findMany({
      where: {
        ...(typeof category === "string" && (LIBRARY_CATEGORIES as readonly string[]).includes(category)
          ? { category }
          : {}),
        ...(mine ? { userId: visitor.user.id } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        user: { select: { id: true, name: true, email: true, provider: true } },
        project: { select: { id: true, title: true, status: true } },
      },
    });

    const items = rows
      .filter((i) => !walls.has(i.userId))
      .filter((i) => {
        if (!q) return true;
        const tags = i.tags ?? "";
        return (
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.authorName.toLowerCase().includes(q) ||
          tags.toLowerCase().includes(q)
        );
      })
      .slice(0, take)
      .map((i) => ({
        id: i.id,
        title: i.title,
        summary: i.summary,
        category: i.category,
        tags: (i.tags ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        authorName: i.authorName,
        mine: i.userId === visitor.user.id,
        project: i.project ? { id: i.project.id, title: i.project.title, status: i.project.status } : null,
        createdAt: i.createdAt.toISOString(),
      }));

    return withAnonCookie(NextResponse.json({ items }), visitor);
  } catch (err) {
    console.error("network library GET failed", err);
    return NextResponse.json({ error: "The library could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:library:${visitor.user.id}`, { limit: 8, windowMs: 60 * 60 * 1000 });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The library asks for a breath — offer again in a little while." },
        { status: 429 }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      summary?: unknown;
      category?: unknown;
      tags?: unknown;
      postId?: unknown;
      projectId?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The contribution arrived unreadable." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 160) : "";
    const summary = typeof raw.summary === "string" ? raw.summary.trim().slice(0, 1200) : "";
    if (title.length < 2 || summary.length < 2) {
      return NextResponse.json({ error: "A contribution wants a name and a few honest words." }, { status: 400 });
    }
    const categoryIn =
      typeof raw.category === "string" && (LIBRARY_CATEGORIES as readonly string[]).includes(raw.category)
        ? raw.category
        : null;
    if (!categoryIn) {
      return NextResponse.json({ error: "Choose the shelf the work rests on." }, { status: 400 });
    }
    const tags = typeof raw.tags === "string" ? raw.tags.trim().slice(0, 300) : null;

    let postId: string | null = null;
    let projectId: string | null = null;

    if (typeof raw.postId === "string" && raw.postId.length > 0) {
      const post = await db.gatheringPost.findUnique({
        where: { id: raw.postId },
        select: { id: true, userId: true, kind: true },
      });
      if (!post) {
        return NextResponse.json({ error: "That offering no longer hangs in the hall." }, { status: 404 });
      }
      if (post.userId !== visitor.user.id) {
        return NextResponse.json({ error: "Only an offering's own maker may carry it here." }, { status: 403 });
      }
      postId = post.id;
    }
    if (typeof raw.projectId === "string" && raw.projectId.length > 0) {
      const project = await db.networkProject.findUnique({
        where: { id: raw.projectId },
        select: { id: true, status: true, members: { select: { userId: true } } },
      });
      if (!project) {
        return NextResponse.json({ error: "That workshop no longer stands." }, { status: 404 });
      }
      if (!project.members.some((m) => m.userId === visitor.user.id)) {
        return NextResponse.json({ error: "Only a weaver may lay the work down." }, { status: 403 });
      }
      projectId = project.id;
    }

    const created = await db.networkLibraryItem.create({
      data: {
        title,
        summary,
        category: categoryIn,
        tags: tags && tags.length >= 2 ? tags : null,
        authorName: networkName(visitor.user),
        userId: visitor.user.id,
        postId,
        projectId,
      },
    });

    return withAnonCookie(
      NextResponse.json({
        item: {
          id: created.id,
          title: created.title,
          category: created.category,
          createdAt: created.createdAt.toISOString(),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network library POST failed", err);
    return NextResponse.json({ error: "The contribution could not be laid in." }, { status: 500 });
  }
}
