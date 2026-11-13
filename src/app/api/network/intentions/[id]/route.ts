import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, notify, wallIdsFor } from "@/lib/server/network";

/* ------------------------------------------------------------------ */
/*  ONE COLLECTIVE INTENTION — /api/network/intentions/[id]            */
/*                                                                     */
/*  GET  — the whole vow: its milestones in order, its tasks, its      */
/*         spoken updates (newest first), its honest progress.         */
/*  POST — the hands that carry it:                                    */
/*    join / leave        — membership, freely taken and set down;     */
/*    milestone-add/toggle — the keeper orders and finishes the steps; */
/*    task-add/claim/done  — members take the small real steps;        */
/*    update              — a spoken step with its measured progress;  */
/*    status              — the keeper names the vow's own state.      */
/* ------------------------------------------------------------------ */

const TITLE_MAX = 120;
const UPDATE_BODY_MAX = 2000;
const UPDATES_MAX = 30;
const DETAIL_MAX = 600;

type IntentionParams = { params: Promise<{ id: string }> };

/* ---------------- GET — the whole vow ---------------- */
export async function GET(req: NextRequest, { params }: IntentionParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const intention = await db.networkIntention.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        members: { select: { userId: true }, take: 200 },
        milestones: { orderBy: { position: "asc" }, take: 100 },
        tasks: { orderBy: { createdAt: "asc" }, take: 200 },
        updates: {
          orderBy: { createdAt: "desc" },
          take: UPDATES_MAX,
          include: { author: { select: { id: true, name: true, email: true, provider: true } } },
        },
      },
    });
    if (!intention) {
      return NextResponse.json({ error: "That intention no longer stands." }, { status: 404 });
    }

    /* the quiet walls hold */
    const walls = await wallIdsFor(visitor.user.id);
    if (intention.ownerId !== visitor.user.id && walls.has(intention.ownerId)) {
      return NextResponse.json({ error: "This door rests closed." }, { status: 403 });
    }

    const milestoneCount = intention.milestones.length;
    const doneCount = intention.milestones.filter((m) => m.doneAt).length;
    const progress = intention.updates.length > 0
      ? intention.updates[0].progress
      : milestoneCount > 0
        ? Math.round((doneCount / milestoneCount) * 100)
        : 0;

    return withAnonCookie(
      NextResponse.json({
        intention: {
          id: intention.id,
          title: intention.title,
          purpose: intention.purpose,
          region: intention.region,
          status: intention.status,
          memberCount: intention.members.length,
          mine: intention.ownerId === visitor.user.id,
          joined: intention.members.some((m) => m.userId === visitor.user.id),
          progress,
          createdAt: intention.createdAt.toISOString(),
          owner: {
            id: intention.ownerId,
            name: networkName(intention.owner),
            anon: intention.owner.provider === "anon",
          },
          milestones: intention.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            detail: m.detail,
            position: m.position,
            done: Boolean(m.doneAt),
          })),
          tasks: intention.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            claimedBy: t.claimedBy,
            done: t.done,
          })),
          updates: intention.updates.map((u) => ({
            id: u.id,
            body: u.body,
            progress: u.progress,
            createdAt: u.createdAt.toISOString(),
            author: {
              id: u.authorId,
              name: networkName(u.author),
              anon: u.author.provider === "anon",
            },
          })),
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("network intention GET failed", err);
    return NextResponse.json({ error: "The intention could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — the hands that carry it ---------------- */
export async function POST(req: NextRequest, { params }: IntentionParams) {
  try {
    const { id } = await params;
    const visitor = await resolveVisitor(req);

    const raw = (await req.json().catch(() => null)) as {
      action?: unknown;
      title?: unknown;
      detail?: unknown;
      body?: unknown;
      progress?: unknown;
      status?: unknown;
      milestoneId?: unknown;
      taskId?: unknown;
    } | null;
    if (!raw || typeof raw.action !== "string") {
      return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
    }

    const intention = await db.networkIntention.findUnique({
      where: { id },
      select: { id: true, ownerId: true, title: true },
    });
    if (!intention) {
      return NextResponse.json({ error: "That intention no longer stands." }, { status: 404 });
    }

    const isOwner = intention.ownerId === visitor.user.id;
    const membership = await db.networkIntentionMember.findUnique({
      where: { intentionId_userId: { intentionId: id, userId: visitor.user.id } },
      select: { id: true },
    });
    const isMember = Boolean(membership);

    /* ---- membership ---- */
    if (raw.action === "join") {
      if (!membership) {
        await db.networkIntentionMember.create({
          data: { intentionId: id, userId: visitor.user.id },
        });
        /* the keeper's bell rings once — a hand joined the vow */
        await notify({
          userId: intention.ownerId,
          actorId: visitor.user.id,
          actorName: networkName(visitor.user),
          type: "follow",
          body: intention.title,
          refType: "project",
          refId: intention.id,
        });
      }
      return withAnonCookie(NextResponse.json({ joined: true }), visitor);
    }

    if (raw.action === "leave") {
      if (isOwner) {
        return NextResponse.json(
          { error: "A vow's own keeper cannot walk away from it — hand it on first." },
          { status: 400 }
        );
      }
      if (membership) {
        await db.networkIntentionMember.delete({ where: { id: membership.id } });
      }
      return withAnonCookie(NextResponse.json({ joined: false }), visitor);
    }

    /* ---- the keeper's milestones ---- */
    if (raw.action === "milestone-add") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the vow's own keeper may order its steps." },
          { status: 403 }
        );
      }
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (title.length < 2 || title.length > TITLE_MAX) {
        return NextResponse.json(
          { error: `A milestone wants between 2 and ${TITLE_MAX} letters.` },
          { status: 400 }
        );
      }
      const detail =
        typeof raw.detail === "string" && raw.detail.trim().length >= 2
          ? raw.detail.trim().slice(0, DETAIL_MAX)
          : null;
      const position = await db.networkIntentionMilestone.count({ where: { intentionId: id } });
      const created = await db.networkIntentionMilestone.create({
        data: { intentionId: id, title, detail, position },
      });
      return withAnonCookie(
        NextResponse.json({
          milestone: {
            id: created.id,
            title: created.title,
            detail: created.detail,
            position: created.position,
            done: false,
          },
        }),
        visitor
      );
    }

    if (raw.action === "milestone-toggle") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the vow's own keeper may finish its steps." },
          { status: 403 }
        );
      }
      const milestoneId = typeof raw.milestoneId === "string" ? raw.milestoneId : "";
      if (!milestoneId) {
        return NextResponse.json({ error: "Name the milestone to move." }, { status: 400 });
      }
      const milestone = await db.networkIntentionMilestone.findUnique({
        where: { id: milestoneId },
        select: { id: true, intentionId: true, doneAt: true },
      });
      if (!milestone || milestone.intentionId !== id) {
        return NextResponse.json(
          { error: "That milestone does not grow on this vow." },
          { status: 404 }
        );
      }
      await db.networkIntentionMilestone.update({
        where: { id: milestone.id },
        data: { doneAt: milestone.doneAt ? null : new Date() },
      });
      return withAnonCookie(
        NextResponse.json({ done: !milestone.doneAt }),
        visitor
      );
    }

    /* ---- the members' small real steps ---- */
    if (raw.action === "task-add") {
      if (!isMember) {
        return NextResponse.json(
          { error: "Only the vow's own members lay steps upon it." },
          { status: 403 }
        );
      }
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (title.length < 2 || title.length > TITLE_MAX) {
        return NextResponse.json(
          { error: `A task wants between 2 and ${TITLE_MAX} letters.` },
          { status: 400 }
        );
      }
      const created = await db.networkIntentionTask.create({
        data: { intentionId: id, title },
      });
      return withAnonCookie(
        NextResponse.json({
          task: { id: created.id, title: created.title, claimedBy: created.claimedBy, done: created.done },
        }),
        visitor
      );
    }

    if (raw.action === "task-claim") {
      if (!isMember) {
        return NextResponse.json(
          { error: "Only the vow's own members take up its steps." },
          { status: 403 }
        );
      }
      const taskId = typeof raw.taskId === "string" ? raw.taskId : "";
      if (!taskId) {
        return NextResponse.json({ error: "Name the task to carry." }, { status: 400 });
      }
      const task = await db.networkIntentionTask.findUnique({
        where: { id: taskId },
        select: { id: true, intentionId: true },
      });
      if (!task || task.intentionId !== id) {
        return NextResponse.json(
          { error: "That task does not grow on this vow." },
          { status: 404 }
        );
      }
      await db.networkIntentionTask.update({
        where: { id: task.id },
        data: { claimedBy: visitor.user.id },
      });
      return withAnonCookie(
        NextResponse.json({ task: { id: task.id, claimedBy: visitor.user.id } }),
        visitor
      );
    }

    if (raw.action === "task-done") {
      const taskId = typeof raw.taskId === "string" ? raw.taskId : "";
      if (!taskId) {
        return NextResponse.json({ error: "Name the task to finish." }, { status: 400 });
      }
      const task = await db.networkIntentionTask.findUnique({
        where: { id: taskId },
        select: { id: true, intentionId: true, claimedBy: true, done: true },
      });
      if (!task || task.intentionId !== id) {
        return NextResponse.json(
          { error: "That task does not grow on this vow." },
          { status: 404 }
        );
      }
      if (!isOwner && task.claimedBy !== visitor.user.id) {
        return NextResponse.json(
          { error: "Only the vow's keeper or the step's own claimant may finish it." },
          { status: 403 }
        );
      }
      await db.networkIntentionTask.update({
        where: { id: task.id },
        data: { done: !task.done },
      });
      return withAnonCookie(NextResponse.json({ done: !task.done }), visitor);
    }

    /* ---- a spoken step with its measured progress ---- */
    if (raw.action === "update") {
      if (!isMember) {
        return NextResponse.json(
          { error: "Only the vow's own members speak its updates." },
          { status: 403 }
        );
      }
      const flood = rateLimit(`network:intention:update:${visitor.user.id}`, {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      });
      if (!flood.ok) {
        return NextResponse.json(
          { error: "The vow asks for a breath — speak again in a moment." },
          { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
        );
      }
      const body = typeof raw.body === "string" ? raw.body.trim() : "";
      if (body.length < 2 || body.length > UPDATE_BODY_MAX) {
        return NextResponse.json(
          { error: `An update wants between 2 and ${UPDATE_BODY_MAX} letters.` },
          { status: 400 }
        );
      }
      /* progress is a measurement, clamped to its honest range */
      const progressNum = Number(raw.progress);
      const progress = Number.isFinite(progressNum)
        ? Math.min(100, Math.max(0, Math.round(progressNum)))
        : 0;

      const created = await db.networkIntentionUpdate.create({
        data: { intentionId: id, authorId: visitor.user.id, body, progress },
      });

      /* the whole vow hears — every member's bell rings softly */
      const members = await db.networkIntentionMember.findMany({
        where: { intentionId: id },
        select: { userId: true },
        take: 80,
      });
      for (const m of members) {
        await notify({
          userId: m.userId,
          actorId: visitor.user.id,
          actorName: networkName(visitor.user),
          type: "project_entry",
          body: `${intention.title}: ${body.slice(0, 120)}`,
          refType: "project",
          refId: intention.id,
        });
      }

      return withAnonCookie(
        NextResponse.json({
          update: {
            id: created.id,
            body: created.body,
            progress: created.progress,
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

    /* ---- the keeper names the vow's own state ---- */
    if (raw.action === "status") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the vow's own keeper may name its state." },
          { status: 403 }
        );
      }
      if (!["open", "active", "completed"].includes(String(raw.status))) {
        return NextResponse.json({ error: "Choose the vow's own state." }, { status: 400 });
      }
      await db.networkIntention.update({
        where: { id },
        data: { status: String(raw.status) },
      });
      return withAnonCookie(
        NextResponse.json({ intention: { id, status: String(raw.status) } }),
        visitor
      );
    }

    return NextResponse.json({ error: "The hand arrived unreadable." }, { status: 400 });
  } catch (err) {
    console.error("network intention POST failed", err);
    return NextResponse.json({ error: "The intention could not be tended." }, { status: 500 });
  }
}
