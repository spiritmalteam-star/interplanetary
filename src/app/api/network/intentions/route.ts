import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { networkName, wallIdsFor } from "@/lib/server/network";
import { isGatheringRegion } from "@/app/api/gathering/route";

/* ------------------------------------------------------------------ */
/*  COLLECTIVE INTENTIONS — /api/network/intentions                    */
/*                                                                     */
/*  Shared goals that move real steps: milestones in order, tasks      */
/*  claimed by hand, and honest progress read from the tables.         */
/*                                                                     */
/*  THE HONESTY LAWS:                                                  */
/*  - an intention opens by its maker's own hand;                      */
/*  - progress is a measurement, never a mood: it reads the latest     */
/*    spoken update, or the milestones actually finished — it never    */
/*    invents momentum;                                                */
/*  - the quiet walls hold.                                            */
/* ------------------------------------------------------------------ */

const TITLE_MAX = 120;
const PURPOSE_MAX = 2000;
const MILESTONES_MAX = 8;
const MILESTONE_MAX = 120;

/* ---------------- GET — the intentions, newest first ---------------- */
export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const url = new URL(req.url);
    const statusRaw = url.searchParams.get("status");
    const status = ["open", "active", "completed"].includes(statusRaw ?? "") ? statusRaw : null;
    const region = url.searchParams.get("region");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 60);
    const take = Math.min(48, Math.max(1, Number(url.searchParams.get("take") ?? 30)));

    const walls = await wallIdsFor(visitor.user.id);

    const rows = await db.networkIntention.findMany({
      ...(status ? { where: { status } } : {}),
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        owner: { select: { id: true, name: true, email: true, provider: true } },
        _count: { select: { members: true, milestones: true, tasks: true } },
      },
    });

    const visible = rows
      .filter((i) => !walls.has(i.ownerId))
      .filter((i) => (isGatheringRegion(region) ? i.region === region : true))
      .filter((i) => {
        if (!q) return true;
        return (
          i.title.toLowerCase().includes(q) || i.purpose.toLowerCase().includes(q)
        );
      })
      .slice(0, take);

    const ids = visible.map((i) => i.id);
    const [milestones, tasks, updates] = await Promise.all([
      db.networkIntentionMilestone.findMany({
        where: { intentionId: { in: ids } },
        select: { intentionId: true, doneAt: true },
      }),
      db.networkIntentionTask.findMany({
        where: { intentionId: { in: ids } },
        select: { intentionId: true, done: true },
      }),
      db.networkIntentionUpdate.findMany({
        where: { intentionId: { in: ids } },
        orderBy: { createdAt: "desc" },
        select: { intentionId: true, progress: true },
      }),
    ]);

    const doneMilestones = new Map<string, number>();
    for (const m of milestones) {
      if (m.doneAt) doneMilestones.set(m.intentionId, (doneMilestones.get(m.intentionId) ?? 0) + 1);
    }
    const openTasks = new Map<string, number>();
    for (const t of tasks) {
      if (!t.done) openTasks.set(t.intentionId, (openTasks.get(t.intentionId) ?? 0) + 1);
    }
    const latestProgress = new Map<string, number>();
    for (const u of updates) {
      if (!latestProgress.has(u.intentionId)) latestProgress.set(u.intentionId, u.progress);
    }

    const intentions = visible.map((i) => {
      const milestoneCount = i._count.milestones;
      const progress = latestProgress.has(i.id)
        ? latestProgress.get(i.id) ?? 0
        : milestoneCount > 0
          ? Math.round(((doneMilestones.get(i.id) ?? 0) / milestoneCount) * 100)
          : 0;
      return {
        id: i.id,
        title: i.title,
        purpose: i.purpose.slice(0, 200),
        region: i.region,
        status: i.status,
        memberCount: i._count.members,
        progress,
        milestoneCount,
        openTaskCount: openTasks.get(i.id) ?? 0,
        createdAt: i.createdAt.toISOString(),
        owner: {
          name: networkName(i.owner),
          anon: i.owner.provider === "anon",
        },
      };
    });

    return withAnonCookie(NextResponse.json({ intentions }), visitor);
  } catch (err) {
    console.error("network intentions GET failed", err);
    return NextResponse.json({ error: "The intentions could not be read." }, { status: 500 });
  }
}

/* ---------------- POST — speak an intention ---------------- */
export async function POST(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    const flood = rateLimit(`network:intention:create:${visitor.user.id}`, {
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!flood.ok) {
      return NextResponse.json(
        { error: "The intentions ask for a breath — speak again in a moment." },
        { status: 429, headers: { "Retry-After": String(flood.retryAfterSec) } }
      );
    }

    const raw = (await req.json().catch(() => null)) as {
      title?: unknown;
      purpose?: unknown;
      region?: unknown;
      seedPostId?: unknown;
      milestones?: unknown;
    } | null;
    if (!raw) {
      return NextResponse.json({ error: "The intention arrived unreadable." }, { status: 400 });
    }

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const purpose = typeof raw.purpose === "string" ? raw.purpose.trim() : "";
    if (title.length < 2 || title.length > TITLE_MAX) {
      return NextResponse.json(
        { error: `The name wants between 2 and ${TITLE_MAX} letters.` },
        { status: 400 }
      );
    }
    if (purpose.length < 4 || purpose.length > PURPOSE_MAX) {
      return NextResponse.json(
        { error: `The purpose wants between 4 and ${PURPOSE_MAX} letters.` },
        { status: 400 }
      );
    }

    /* the intention's own shore — a spoken shore must be one the atlas draws */
    const region = raw.region === undefined || raw.region === null ? null : raw.region;
    if (region !== null && !isGatheringRegion(region)) {
      return NextResponse.json(
        { error: "Choose a shore the atlas draws." },
        { status: 400 }
      );
    }

    /* a seed offering — only its own maker's words may open a vow */
    let seedPostId: string | null = null;
    if (typeof raw.seedPostId === "string" && raw.seedPostId.length > 0) {
      const seed = await db.gatheringPost.findUnique({
        where: { id: raw.seedPostId },
        select: { id: true, userId: true },
      });
      if (!seed || seed.userId !== visitor.user.id) {
        return NextResponse.json(
          { error: "A vow grows only from its own maker's offering." },
          { status: 400 }
        );
      }
      seedPostId = seed.id;
    }

    /* the first steps, spoken in order — at most eight, each a real step */
    const milestonesRaw = Array.isArray(raw.milestones) ? raw.milestones : [];
    if (milestonesRaw.length > MILESTONES_MAX) {
      return NextResponse.json(
        { error: `A vow carries at most ${MILESTONES_MAX} first steps.` },
        { status: 400 }
      );
    }
    const milestones: string[] = [];
    for (const m of milestonesRaw) {
      if (typeof m !== "string") {
        return NextResponse.json(
          { error: "Each milestone wants its own words." },
          { status: 400 }
        );
      }
      const step = m.trim();
      if (step.length < 2 || step.length > MILESTONE_MAX) {
        return NextResponse.json(
          { error: `Each milestone wants between 2 and ${MILESTONE_MAX} letters.` },
          { status: 400 }
        );
      }
      milestones.push(step);
    }

    const created = await db.networkIntention.create({
      data: {
        ownerId: visitor.user.id,
        title,
        purpose,
        region: isGatheringRegion(region) ? region : null,
        seedPostId,
      },
    });
    await db.networkIntentionMember.create({
      data: { intentionId: created.id, userId: visitor.user.id },
    });
    if (milestones.length > 0) {
      await db.networkIntentionMilestone.createMany({
        data: milestones.map((m, idx) => ({
          intentionId: created.id,
          title: m,
          position: idx,
        })),
      });
    }

    return withAnonCookie(NextResponse.json({ intention: { id: created.id } }), visitor);
  } catch (err) {
    console.error("network intentions POST failed", err);
    return NextResponse.json({ error: "The intention could not be spoken." }, { status: 500 });
  }
}
