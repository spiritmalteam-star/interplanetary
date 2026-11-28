import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie, STATELESS_PREFIX } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify } from "@/lib/server/network";
import { graceful, cleanStr, errorJson } from "@/lib/server/net-helpers";

/* ------------------------------------------------------------------ */
/*  ONE BENCH, READ WHOLE — GET /api/network/lab-projects/[id]         */
/*  THE BENCH'S HANDS — POST {kind:"entry"|"review"}                   */
/*                                                                     */
/*  The lab's own page: question, hypothesis, method, and the living   */
/*  shelves around it — entries and reviews (milestones and tasks belong to Collective
/*  Intentions — /api/network/intentions — not to a lab bench). Every     */
/*  movement speaks with its maker's name and its own honest label.    */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";

const BODY_MAX = 4000;
const REVIEW_MAX = 2000;
const VERDICTS = ["feedback", "concerns", "improvements"] as const;
const ENTRY_KINDS = ["observation", "result", "analysis", "limitation", "replication"] as const;

async function labDetail(projectId: string, viewerId: string) {
  const p = await db.networkLabProject.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { members: true, entries: true } },
      members: { select: { userId: true, role: true } },
      entries: {
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { author: { select: { id: true, name: true, email: true, provider: true } } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 40,
        include: { author: { select: { id: true, name: true, email: true, provider: true } } },
      },
    },
  });
  if (!p) return null;

  const owner = await graceful(
    () =>
      db.user.findUnique({
        where: { id: p.ownerId },
        select: { id: true, name: true, email: true, provider: true },
      }),
    null
  );
  const mySeat = p.members.find((m) => m.userId === viewerId) ?? null;

  return {
    id: p.id,
    title: p.title,
    question: p.question,
    hypothesis: p.hypothesis,
    background: p.background,
    methodology: p.methodology,
    materials: p.materials,
    safety: p.safety,
    focus: p.focus,
    status: p.status,
    memberCount: p._count?.members ?? 0,
    mine: p.ownerId === viewerId,
    membership: mySeat?.role ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    owner: {
      id: p.ownerId,
      name: owner ? networkName(owner) : "A quiet maker",
      anon: (owner?.provider ?? "") === "anon",
    },
    entries: p.entries.map((e) => ({
      id: e.id,
      kind: e.kind,
      body: e.body,
      dataUrl: e.dataUrl,
      createdAt: e.createdAt.toISOString(),
      author: {
        id: e.authorId,
        name: networkName(e.author),
        anon: (e.author.provider ?? "") === "anon",
      },
    })),
    reviews: p.reviews.map((r) => ({
      id: r.id,
      verdict: r.verdict,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: {
        id: r.authorId,
        name: networkName(r.author),
        anon: (r.author.provider ?? "") === "anon",
      },
    })),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const detail = await graceful(() => labDetail(id, visitor.user.id), null);
    if (!detail) return errorJson("That bench no longer stands.", 404);
    return withAnonCookie(NextResponse.json({ project: detail }), visitor);
  } catch (err) {
    console.error("network lab-project GET failed", err);
    return errorJson("The bench could not be read just now.", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);
    const me = visitor.user.id;
    if (me.startsWith(STATELESS_PREFIX)) {
      return errorJson("A bench needs a real maker — sign in or carry the quiet cookie.", 503);
    }

    const flood = rateLimit(`network:lab-touch:${me}`, {
      limit: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The bench asks for a breath — lay again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      kind?: unknown;
      body?: unknown;
      verdict?: unknown;
      entryKind?: unknown;
      dataUrl?: unknown;
    } | null;

    const project = await db.networkLabProject.findUnique({
      where: { id },
      select: { id: true, ownerId: true, title: true },
    });
    if (!project) return errorJson("That bench no longer stands.", 404);

    /* laying hands on a bench makes one a companion */
    const seat = await db.networkLabMember.findUnique({
      where: { labId_userId: { labId: id, userId: me } },
      select: { id: true },
    });
    if (!seat) {
      await db.networkLabMember.create({
        data: { labId: id, userId: me, role: "participant" },
      });
    }

    const myName = networkName(visitor.user);

    if (raw?.kind === "entry") {
      const body = cleanStr(raw?.body, BODY_MAX);
      if (!body) return errorJson(`An entry wants up to ${BODY_MAX} letters.`, 400);
      const kind = ENTRY_KINDS.includes(raw?.entryKind as (typeof ENTRY_KINDS)[number])
        ? (raw?.entryKind as string)
        : "observation";
      const dataUrl = cleanStr(raw?.dataUrl, 300);
      await db.networkLabEntry.create({
        data: { labId: id, authorId: me, kind, body, dataUrl },
      });
    } else if (raw?.kind === "review") {
      const body = cleanStr(raw?.body, REVIEW_MAX);
      if (!body) return errorJson(`A review wants up to ${REVIEW_MAX} letters.`, 400);
      const verdict = VERDICTS.includes(raw?.verdict as (typeof VERDICTS)[number])
        ? (raw?.verdict as string)
        : "feedback";
      await db.networkLabReview.create({
        data: { labId: id, authorId: me, verdict, body },
      });
      if (project.ownerId !== me) {
        await notify({
          userId: project.ownerId,
          actorId: me,
          actorName: myName,
          type: "review",
          body: `weighed "${project.title.slice(0, 80)}" — ${verdict.replace("_", " ")}`,
          refType: "project",
          refId: id,
        });
      }
    } else {
      return errorJson("A bench is touched with kind:entry or review (milestones and tasks live in /api/network/intentions).", 400);
    }

    await db.networkLabProject.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const detail = await graceful(() => labDetail(id, me), null);
    return withAnonCookie(NextResponse.json({ project: detail }), visitor);
  } catch (err) {
    console.error("network lab-project POST failed", err);
    return errorJson("The bench could not be touched just now.", 500);
  }
}
