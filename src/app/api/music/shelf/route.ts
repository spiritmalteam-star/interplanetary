import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { settleMusicJob, viewOfJob } from "@/lib/server/music/job";
import { db } from "@/lib/db";

export const maxDuration = 30;

/* ------------------------------------------------------------------ */
/*  THE SHELF — GET /api/music/shelf · DELETE /api/music/shelf?id=      */
/*                                                                      */
/*  Every generation the visitor has ever paid for, with every track    */
/*  the engine delivered — partial sets included, named for what they   */
/*  are ("3 of 6 ready"). Reading the shelf also settles the most       */
/*  recent still-rendering jobs, so a visitor who left mid-render       */
/*  returns to find the songs that landed while they were away.         */
/*  DELETE soft-hides one row: the shelf forgets, the ledger does not.  */
/* ------------------------------------------------------------------ */

const LIST_LIMIT = 24;
const SETTLE_BUDGET = 2;

export async function GET(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ jobs: [] }), visitor);
    }
    const userId = visitor.user.id;

    /* settle the most recent still-breathing jobs — bounded per read */
    const breathing = await db.musicGenerationJob.findMany({
      where: { visitorId: userId, hiddenAt: null, status: { in: ["rendering", "partial"] } },
      orderBy: { createdAt: "desc" },
      take: SETTLE_BUDGET,
      select: { id: true },
    });
    for (const job of breathing) {
      try {
        await settleMusicJob(job.id, userId);
      } catch (err) {
        /* one stalled settle never keeps the shelf from being read */
        console.error("[music/shelf] settle rested:", err instanceof Error ? err.message : err);
      }
    }

    const jobs = await db.musicGenerationJob.findMany({
      where: { visitorId: userId, hiddenAt: null },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: { tracks: true },
    });

    return withAnonCookie(
      NextResponse.json({
        jobs: jobs.map((j) => viewOfJob(j)),
        perTrackCostHeld: jobs.reduce((acc, j) => acc + j.chargedCount, 0),
      }),
      visitor
    );
  } catch (err) {
    console.error("[music/shelf] read failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ jobs: [] }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const visitor = await resolveVisitor(req);
    if (visitor.user.id.startsWith("stateless:")) {
      return withAnonCookie(NextResponse.json({ ok: false }, { status: 404 }), visitor);
    }
    const userId = visitor.user.id;
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return withAnonCookie(
        NextResponse.json({ error: "Name the row to hide." }, { status: 400 }),
        visitor
      );
    }
    const job = await db.musicGenerationJob.findUnique({ where: { id } });
    if (!job || job.visitorId !== userId) {
      return withAnonCookie(
        NextResponse.json({ error: "That row is not on your shelf." }, { status: 404 }),
        visitor
      );
    }
    await db.musicGenerationJob.update({ where: { id }, data: { hiddenAt: new Date() } });
    return withAnonCookie(NextResponse.json({ ok: true }), visitor);
  } catch (err) {
    console.error("[music/shelf] hide failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The hiding stumbled." }, { status: 500 });
  }
}
