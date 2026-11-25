import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie, STATELESS_PREFIX } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName } from "@/lib/server/network";
import { graceful, takeOf, cleanStr, errorJson } from "@/lib/server/net-helpers";

/* ------------------------------------------------------------------ */
/*  THE LAB BENCH'S DOOR — GET and POST /api/network/lab-projects      */
/*                                                                     */
/*  A living project: a question, a hypothesis, a method — opened by   */
/*  a maker and joined by companions. Cards carry the honest counts    */
/*  and, where a project grew from a post or a library entry, the      */
/*  seed's own name.                                                   */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

type ProjectRow = {
  id: string;
  seedPostId: string | null;
  libraryEntryId: string | null;
  userId: string;
  title: string;
  description: string | null;
  focus: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { members?: number; entries?: number };
};

export const PROJECT_CARD_INCLUDE = {
  _count: { select: { members: true, entries: true } },
} as const;

async function seedNames(rows: ProjectRow[]) {
  const postIds = rows.map((r) => r.seedPostId).filter((v): v is string => Boolean(v));
  const entryIds = rows.map((r) => r.libraryEntryId).filter((v): v is string => Boolean(v));
  const posts = postIds.length
    ? await graceful(
        () =>
          db.gatheringPost.findMany({
            where: { id: { in: postIds } },
            select: { id: true, title: true },
          }),
        [] as { id: string; title: string }[]
      )
    : [];
  const entries = entryIds.length
    ? await graceful(
        () =>
          db.libraryEntry.findMany({
            where: { id: { in: entryIds } },
            select: { id: true, title: true },
          }),
        [] as { id: string; title: string }[]
      )
    : [];
  return {
    posts: new Map(posts.map((p) => [p.id, p.title])),
    entries: new Map(entries.map((e) => [e.id, e.title])),
  };
}

export async function projectCards(
  where: Record<string, unknown>,
  viewerId: string,
  take: number
) {
  const rows = (await db.networkLabProject.findMany({
    where: where as never,
    orderBy: { updatedAt: "desc" },
    take,
    include: PROJECT_CARD_INCLUDE,
  })) as ProjectRow[];

  /* the visitor's own seats at these benches */
  const seats = await graceful(
    () =>
      db.networkLabMember.findMany({
        where: { userId: viewerId, projectId: { in: rows.map((r) => r.id) } },
        select: { projectId: true },
      }),
    [] as { projectId: string }[]
  );
  const seatSet = new Set(seats.map((s) => s.projectId));

  const owners = await graceful(
    () =>
      db.user.findMany({
        where: { id: { in: Array.from(new Set(rows.map((r) => r.userId))) } },
        select: { id: true, name: true, email: true, provider: true },
      }),
    [] as { id: string; name: string | null; email: string; provider: string | null }[]
  );
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const { posts, entries } = await seedNames(rows);

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    focus: p.focus,
    status: p.status,
    seedPost: p.seedPostId ? { id: p.seedPostId, title: posts.get(p.seedPostId) ?? "" } : null,
    libraryItem: p.libraryEntryId
      ? { id: p.libraryEntryId, title: entries.get(p.libraryEntryId) ?? "" }
      : null,
    memberCount: p._count?.members ?? 0,
    entryCount: p._count?.entries ?? 0,
    owner: {
      id: p.userId,
      name: ownerMap.has(p.userId)
        ? networkName(ownerMap.get(p.userId) as { name: string | null; email: string })
        : "A quiet maker",
    },
    joined: seatSet.has(p.id),
    mine: p.userId === viewerId,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  }));
}

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const me = visitor.user.id;
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "1";
    const status = cleanStr(url.searchParams.get("status"), 20);
    const take = takeOf(url, 24, 60);

    const where = {
      ...(mine ? { userId: me } : {}),
      ...(status ? { status } : {}),
    };
    const projects = await graceful(() => projectCards(where, me, take), [] as Awaited<ReturnType<typeof projectCards>>);

    return withAnonCookie(NextResponse.json({ projects }), visitor);
  } catch (err) {
    console.error("network lab-projects GET failed", err);
    return errorJson("The benches could not be read just now.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const me = visitor.user.id;
    if (me.startsWith(STATELESS_PREFIX)) {
      return errorJson("A bench needs a real maker — sign in or carry the quiet cookie.", 503);
    }

    const flood = rateLimit(`network:lab-create:${me}`, {
      limit: 6,
      windowMs: 60 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The benches ask for a breath — open again in a while." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      question?: unknown;
      hypothesis?: unknown;
      method?: unknown;
      focus?: unknown;
    } | null;

    const title = cleanStr(raw?.title, 140);
    if (!title || title.length < 3) {
      return errorJson("A project wants a name of 3 to 140 letters.", 400);
    }
    const question = cleanStr(raw?.question, 1000);
    const hypothesis = cleanStr(raw?.hypothesis, 2000);
    const method = cleanStr(raw?.method, 2000);
    const focus = cleanStr(raw?.focus, 24) ?? "research";

    const created = await db.networkLabProject.create({
      data: {
        userId: me,
        title,
        description: hypothesis,
        question: question ?? "",
        hypothesis: hypothesis ?? "",
        methodology: method,
        focus,
        status: "open",
      },
    });
    await db.networkLabMember.create({
      data: { projectId: created.id, userId: me, role: "owner" },
    });

    return withAnonCookie(
      NextResponse.json({
        project: {
          id: created.id,
          title: created.title,
          description: created.description,
          focus: created.focus,
          status: created.status,
          seedPost: null,
          libraryItem: null,
          memberCount: 1,
          entryCount: 0,
          owner: { id: me, name: networkName(visitor.user) },
          joined: true,
          mine: true,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network lab-projects POST failed", err);
    return errorJson("The bench could not be opened just now.", 500);
  }
}
