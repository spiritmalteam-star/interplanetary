import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { meterRoute } from "@/lib/server/meter";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { runDeepPress } from "@/lib/server/deep-press";

/* ------------------------------------------------------------------ */
/*  POST /api/processes/resume — THE SECOND BREATH.                    */
/*                                                                     */
/*  A work that failed may be asked to rise again: the hall keeps its  */
/*  own stored input, so a resume re-kindles the same press from       */
/*  exactly where its instructions stand — no question re-asked, no    */
/*  answer re-pasted.                                                  */
/*                                                                     */
/*  Body: { id: "<the work's own id>" }                                */
/* ------------------------------------------------------------------ */

export const POST = meterRoute("processes-resume", async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => null)) as { id?: string } | null;
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { error: "The hall needs the work's own id to wake it." },
        { status: 400 }
      );
    }

    const visitor = await resolveVisitor(req);

    let job;
    try {
      job = await db.processJob.findUnique({ where: { id } });
    } catch {
      return NextResponse.json(
        { error: "The hall rests — the works cannot be read just now." },
        { status: 503 }
      );
    }
    if (!job || job.userId !== visitor.user.id) {
      return NextResponse.json(
        { error: "No such work stands in your hall." },
        { status: 404 }
      );
    }
    if (job.status === "running") {
      return NextResponse.json({ id: job.id, status: "running" });
    }
    if (job.status === "done") {
      return NextResponse.json({ id: job.id, status: "done" });
    }

    /* the second breath — the row returns to the running light and
       the press re-kindles behind the response */
    await db.processJob.update({
      where: { id: job.id },
      data: {
        status: "running",
        progress: 4,
        stage: "The press rises again…",
        error: null,
        result: null,
      },
    });
    after(() => runDeepPress(job.id));

    return withAnonCookie(
      NextResponse.json({ id: job.id, status: "running" }),
      visitor
    );
  } catch (err) {
    console.error("[processes/resume] failed:", err);
    return NextResponse.json(
      { error: "The second breath slipped — ask once more." },
      { status: 500 }
    );
  }
});

export const maxDuration = 60;
