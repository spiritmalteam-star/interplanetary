import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE LAB BENCH — /api/network/laboratory/[id]                       */
/*                                                                     */
/*  GET  — the whole bench: method, materials, safety, entries and     */
/*         reviews in the order they were written.                     */
/*  POST — the hands around the bench:                                 */
/*    join / leave — membership, taken and set down freely;            */
/*    entry        — an observation, a result, a limitation spoken     */
/*                   by a member; the whole bench hears;               */
/*    review       — a member's verdict, never a vote-as-proof;        */
/*    update       — the owner tends the bench itself.                 */
/* ------------------------------------------------------------------ */

const ENTRY_KINDS = ["observation", "result", "analysis", "limitation", "replication"] as const;
const ENTRY_BODY_MAX = 6000;
const VERDICTS = ["feedback", "concerns", "improvements"] as const;
const REVIEW_BODY_MAX = 4000;
const SECTION_MAX = 3000;

type LabParams = { params: Promise<{ id: string }> };

/* ---------------- GET — the whole bench ---------------- */
export async function GET(req: NextRequest, { params }: LabParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const lab = await db.networkLabProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { members: true } },
        entries: {
          orderBy: { createdAt: "asc" },
          take: 200,
          include: { author: { select: { id: true, name: true, email: true, provider: true } } },
        },
        reviews: {
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { author: { select: { id: true, name: true, email: true, provider: true } } },
        },
      },
    });
    if (!lab) {
      return NextResponse.json({ error: "That bench no longer stands." }, { status: 404 });
    }

    const membership = await db.networkLabMember.findUnique({
      where: { labId_userId: { labId: id, userId: visitor.user.id } },
      select: { role: true },
    });

    /* the quiet walls hold — a closed door's bench rests unread */
    const walls = await wallIdsFor(visitor.user.id);
    if (lab.ownerId !== visitor.user.id && walls.has(lab.ownerId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    return withAnonCookie(
      NextResponse.json({
        lab: {
          id: lab.id,
          title: lab.title,
          question: lab.question,
          hypothesis: lab.hypothesis,
          background: lab.background,
          methodology: lab.methodology,
          materials: lab.materials,
          safety: lab.safety,
          focus: lab.focus,
          status: lab.status,
          memberCount: lab._count.members,
          mine: lab.ownerId === visitor.user.id,
          membership: membership?.role ?? null,
          createdAt: lab.createdAt.toISOString(),
          updatedAt: lab.updatedAt.toISOString(),
          owner: {
            id: lab.ownerId,
            name: networkName(lab.owner),
            anon: lab.owner.provider === "anon",
          },
          entries: lab.entries.map((e) => ({
            id: e.id,
            kind: e.kind,
            body: e.body,
            dataUrl: e.dataUrl,
            createdAt: e.createdAt.toISOString(),
            author: {
              id: e.authorId,
              name: networkName(e.author),
              anon: e.author.provider === "anon",
            },
          })),
          reviews: lab.reviews.map((r) => ({
            id: r.id,
            verdict: r.verdict,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
            author: {
              id: r.authorId,
              name: networkName(r.author),
              anon: r.author.provider === "anon",
            },
          })),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network lab GET failed", err);
    return NextResponse.json({ error: "The bench could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — the hands around the bench ---------------- */
export async function POST(req: NextRequest, { params }: LabParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      kind?: unknown;
      body?: unknown;
      dataUrl?: unknown;
      verdict?: unknown;
      background?: unknown;
      methodology?: unknown;
      materials?: unknown;
      safety?: unknown;
      status?: unknown;
    } | null;
    if (!raw || typeof raw.action !== "string") {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    const lab = await db.networkLabProject.findUnique({
      where: { id },
      select: { id: true, ownerId: true, title: true, status: true },
    });
    if (!lab) {
      return NextResponse.json({ error: "That bench no longer stands." }, { status: 404 });
    }

    const membership = await db.networkLabMember.findUnique({
      where: { labId_userId: { labId: id, userId: visitor.user.id } },
      select: { id: true, role: true },
    });
    const isMember = Boolean(membership);
    const isOwner = lab.ownerId === visitor.user.id;

    /* ---- join / leave ---- */
    if (raw.action === "join") {
      if (!membership) {
        await db.networkLabMember.create({
          data: { labId: id, userId: visitor.user.id, role: "participant" },
        });
        /* the owner's bell rings once — a hand arrived at the bench */
        await notify({
          userId: lab.ownerId,
          actorId: visitor.user.id,
          actorName: networkName(visitor.user),
          type: "follow",
          body: lab.title,
          refType: "project",
          refId: lab.id,
        });
      }
      return withAnonCookie(
        NextResponse.json({ membership: membership?.role ?? "participant" }),
        visitor
      );
    }

    if (raw.action === "leave") {
      if (isOwner) {
        return NextResponse.json(
          { error: "A bench's own keeper cannot walk away from it." },
          { status: 400 }
        );
      }
      if (membership) {
        await db.networkLabMember.delete({ where: { id: membership.id } });
      }
      return withAnonCookie(NextResponse.json({ membership: null }), visitor);
    }

    /* ---- an entry lands on the bench — members only ---- */
    if (raw.action === "entry") {
      if (!isMember) {
        return NextResponse.json(
          { error: "Only the bench's own members lay entries upon it." },
          { status: 403 }
        );
      }
      const flood = rateLimit(`network:lab:entry:${visitor.user.id}`, {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "The bench asks for a breath — write again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }

      if (!(ENTRY_KINDS as readonly string[]).includes(String(raw.kind))) {
        return NextResponse.json({ error: "Name the entry's own kind." }, { status: 400 });
      }
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (body.length < 2 || body.length > ENTRY_BODY_MAX) {
        return NextResponse.json(
          { error: `An entry wants between 2 and ${ENTRY_BODY_MAX} letters.` },
          { status: 400 }
        );
      }
      /* an attachment rests only on the house's own shelf */
      const dataUrl =
        typeof raw.dataUrl === "string" && raw.dataUrl.startsWith("/gathering-media/")
          ? raw.dataUrl.slice(0, 200)
          : null;
      if (typeof raw.dataUrl === "string" && raw.dataUrl.length > 0 && !dataUrl) {
        return NextResponse.json(
          { error: "An attachment rests only on the house's own shelf." },
          { status: 400 }
        );
      }

      const created = await db.networkLabEntry.create({
        data: { labId: id, authorId: visitor.user.id, kind: String(raw.kind), body, dataUrl },
      });

      /* the whole bench hears — every member's bell rings softly */
      const members = await db.networkLabMember.findMany({
        where: { labId: id },
        select: { userId: true },
        take: 80,
      });
      for (const m of members) {
        await notify({
          userId: m.userId,
          actorId: visitor.user.id,
          actorName: networkName(visitor.user),
          type: "lab_entry",
          body: `${lab.title}: ${String(raw.kind)}`,
          refType: "project",
          refId: lab.id,
        });
      }

      return withAnonCookie(
        NextResponse.json({
          entry: {
            id: created.id,
            kind: created.kind,
            body: created.body,
            dataUrl: created.dataUrl,
            createdAt: created.createdAt.toISOString(),
            author: {
              id: visitor.user.id,
              name: networkName(visitor.user),
              anon: visitor.user.provider === "anon",
            },
          },
        }),
        visitor
      );
    }

    /* ---- a review is spoken — members only, never a vote ---- */
    if (raw.action === "review") {
      if (!isMember) {
        return NextResponse.json(
          { error: "Only the bench's own members speak its reviews." },
          { status: 403 }
        );
      }
      const flood = rateLimit(`network:lab:review:${visitor.user.id}`, {
        limit: 12,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "The bench asks for a breath — review again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }

      if (!(VERDICTS as readonly string[]).includes(String(raw.verdict))) {
        return NextResponse.json({ error: "Name the verdict's own kind." }, { status: 400 });
      }
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (body.length < 4 || body.length > REVIEW_BODY_MAX) {
        return NextResponse.json(
          { error: `A review wants between 4 and ${REVIEW_BODY_MAX} letters.` },
          { status: 400 }
        );
      }

      const created = await db.networkLabReview.create({
        data: { labId: id, authorId: visitor.user.id, verdict: String(raw.verdict), body },
      });

      /* the keeper's bell rings — a review is a real reading */
      await notify({
        userId: lab.ownerId,
        actorId: visitor.user.id,
        actorName: networkName(visitor.user),
        type: "lab_review",
        body: `${lab.title}: ${String(raw.verdict)}`,
        refType: "project",
        refId: lab.id,
      });

      return withAnonCookie(
        NextResponse.json({
          review: {
            id: created.id,
            verdict: created.verdict,
            body: created.body,
            createdAt: created.createdAt.toISOString(),
            author: {
              id: visitor.user.id,
              name: networkName(visitor.user),
              anon: visitor.user.provider === "anon",
            },
          },
        }),
        visitor
      );
    }

    /* ---- the keeper tends the bench itself ---- */
    if (raw.action === "update") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the bench's own keeper may tend it." },
          { status: 403 }
        );
      }
      const section = (v: unknown): string | null =>
        typeof v === "string" && v.trim().length >= 2 ? v.trim().slice(0, SECTION_MAX) : null;
      const data: {
        background?: string | null;
        methodology?: string | null;
        materials?: string | null;
        safety?: string | null;
        status?: string;
      } = {};
      if (raw.background !== undefined) data.background = section(raw.background);
      if (raw.methodology !== undefined) data.methodology = section(raw.methodology);
      if (raw.materials !== undefined) data.materials = section(raw.materials);
      if (raw.safety !== undefined) data.safety = section(raw.safety);
      if (raw.status !== undefined) {
        if (!["open", "active", "concluded"].includes(String(raw.status))) {
          return NextResponse.json({ error: "Choose the bench's own state." }, { status: 400 });
        }
        data.status = String(raw.status);
      }
      await db.networkLabProject.update({ where: { id }, data });
      return withAnonCookie(NextResponse.json({ ok: true }), visitor);
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network lab POST failed", err);
    return NextResponse.json({ error: "The bench could not be tended." }, { status: 500 });
  }
}
