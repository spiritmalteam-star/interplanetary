import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, splitList, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  LIVING QUESTIONS — /api/network/questions                          */
/*                                                                     */
/*  A question is a space, not a post: it keeps its context, its       */
/*  disciplines, and a tree of branches people grow together. The      */
/*  seed may be an offering already in the hall, or the question's     */
/*  own first words.                                                   */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - a question space is opened by a human hand, never automatically; */
/*  - one space per seed offering — asking twice returns the same door;*/
/*  - the quiet walls hold: a closed door's questions never surface.   */
/* ------------------------------------------------------------------ */

const SEED_KINDS = ["question", "discovery", "reflection", "discussion"] as const;
const TITLE_MAX = 120;
const BODY_MAX = 4000;
const CONTEXT_MAX = 2000;
const DISCIPLINES_MAX = 6;

function normalizeDisciplines(v: unknown): string | null {
  if (typeof v !== "string" || v.trim().length < 2) return null;
  return (
    splitList(v)
      .slice(0, DISCIPLINES_MAX)
      .join(",") || null
  );
}

/* ---------------- GET — the living questions, open first ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const take = Math.min(30, Math.max(1, Number(url.searchParams.get("take") ?? 20)));

    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.networkQuestion.findMany({
      ...(q
        ? {
            where: {
              post: {
                OR: [{ title: { contains: q } }, { body: { contains: q } }],
              },
            },
          }
        : {}),
      orderBy: { updatedAt: "desc" },
      take: take * 3 + 40,
      include: {
        post: { select: { id: true, title: true, body: true } },
        owner: { select: { id: true, name: true, email: true, provider: true } },
      },
    });

    /* open questions breathe first, the settled ones rest beneath */
    const visible = rows
      .filter((r) => !walls.has(r.ownerId))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "open" ? -1 : 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      })
      .slice(0, take);

    const ids = visible.map((r) => r.id);
    const branches = await db.networkQuestionBranch.findMany({
      where: { questionId: { in: ids } },
      select: { questionId: true, authorId: true },
    });
    const branchCounts = new Map<string, number>();
    const contributors = new Map<string, Set<string>>();
    for (const b of branches) {
      branchCounts.set(b.questionId, (branchCounts.get(b.questionId) ?? 0) + 1);
      let set = contributors.get(b.questionId);
      if (!set) {
        set = new Set<string>();
        contributors.set(b.questionId, set);
      }
      set.add(b.authorId);
    }

    const questions = visible.map((r) => ({
      id: r.id,
      postId: r.postId,
      title: r.post.title,
      body: r.post.body.slice(0, 200),
      status: r.status,
      disciplines: splitList(r.disciplines),
      branchCount: branchCounts.get(r.id) ?? 0,
      contributorCount: contributors.get(r.id)?.size ?? 0,
      updatedAt: r.updatedAt.toISOString(),
      owner: {
        name: networkName(r.owner),
        anon: r.owner.provider === "anon",
      },
    }));

    return withAnonCookie(NextResponse.json({ questions }), visitor);
  } catch (err) {
    console.error("network questions GET failed", err);
    return NextResponse.json({ error: "The living questions could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — open a question space ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:question:create:${visitor.user.id}`, {
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The questions ask for a breath — open one again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      postId?: unknown;
      title?: unknown;
      body?: unknown;
      context?: unknown;
      disciplines?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The question arrived unreadable." }, { status: 400 });
    }

    const context =
      typeof raw.context === "string" && raw.context.trim().length >= 2
        ? raw.context.trim().slice(0, CONTEXT_MAX)
        : null;
    const disciplines = normalizeDisciplines(raw.disciplines);

    /* form (a) — a space grown from an offering already in the hall */
    if (typeof raw.postId === "string" && raw.postId.length > 0) {
      const post = await db.gatheringPost.findUnique({
        where: { id: raw.postId },
        select: { id: true, userId: true, kind: true, visibility: true, circleId: true, status: true },
      });
      if (!post || post.status !== "published") {
        return NextResponse.json(
          { error: "That offering no longer hangs in the hall." },
          { status: 404 }
        );
      }
      if (!(SEED_KINDS as readonly string[]).includes(post.kind)) {
        return NextResponse.json(
          { error: "A living question grows from a question, a discovery, a reflection or a discussion." },
          { status: 400 }
        );
      }

      /* the visibility law — the server decides, never the visitor's politeness */
      let visible = false;
      if (post.visibility === "public" || post.userId === visitor.user.id) visible = true;
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
      if (!visible) {
        return NextResponse.json(
          { error: "This offering rests in a room you do not walk." },
          { status: 403 }
        );
      }

      /* one space per seed — asking twice returns the same door */
      const existing = await db.networkQuestion.findUnique({
        where: { postId: post.id },
        select: { id: true },
      });
      if (existing) {
        return withAnonCookie(
          NextResponse.json({ question: { id: existing.id, postId: post.id } }),
          visitor
        );
      }

      const created = await db.networkQuestion.create({
        data: {
          postId: post.id,
          ownerId: visitor.user.id,
          context,
          disciplines,
        },
      });
      return withAnonCookie(
        NextResponse.json({ question: { id: created.id, postId: post.id } }),
        visitor
      );
    }

    /* form (b) — the question's own first words: a seed offering is
       hung (under the hall's own flood-gates) and the space opens */
    const seedFlood = rateLimit(`network:question:post:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!seedFlood.ok) {
      return NextResponse.json(
        { error: "The hall asks for a breath — offer again in a moment." },
        { status: 429, headers: { "Retry-After": String(seedFlood.retryAfterSec) } }
      );
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const body = typeof raw.body === "string" ? raw.body.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    if (body.length < 2 || body.length > BODY_MAX) {
      return NextResponse.json(
        { error: `The words want between 2 and ${BODY_MAX} letters.` },
        { status: 400 }
      );
    }

    const seed = await db.gatheringPost.create({
      data: {
        userId: visitor.user.id,
        kind: "question",
        title,
        body,
      },
    });
    const created = await db.networkQuestion.create({
      data: {
        postId: seed.id,
        ownerId: visitor.user.id,
        context,
        disciplines,
      },
    });

    return withAnonCookie(
      NextResponse.json({
        question: { id: created.id, postId: seed.id },
        postId: seed.id,
      }),
      visitor
    );
  } catch (err) {
    console.error("network questions POST failed", err);
    return NextResponse.json({ error: "The question could not be opened." }, { status: 500 });
  }
}
