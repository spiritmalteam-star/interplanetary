import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE CREATION LEDGER — durable jobs for long-running workflows.     */
/*                                                                     */
/*  The infrastructure truth (directive 03): this house runs on        */
/*  serverless clouds and conversation-paced skies, so the workflow's  */
/*  SERVER steps are driven stepwise and its BROWSER steps by the      */
/*  visitor's own studio — while THIS ledger holds the truth of the    */
/*  whole walk: its plan, its steps, their progress, its failure, its  */
/*  cancellation. A page reload finds its job again by id; a finished  */
/*  job rests; a cancelled job stops being owed work.                  */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

type JobBody = {
  id?: string;
  kind?: string;
  status?: string;
  input?: unknown;
  plan?: unknown;
  steps?: unknown;
  progress?: number;
  error?: string;
  sourceConvId?: string;
  sourceBranch?: string;
};

export async function POST(req: NextRequest) {
  let body: JobBody;
  try {
    body = (await req.json()) as JobBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  const kind = typeof body.kind === "string" ? body.kind.slice(0, 64) : "";
  if (!kind) return NextResponse.json({ error: "kind required" }, { status: 400 });
  try {
    const job = await db.creationJob.create({
      data: {
        kind,
        status: typeof body.status === "string" ? body.status : "queued",
        input: JSON.stringify(body.input ?? {}),
        plan: body.plan ? JSON.stringify(body.plan) : null,
        steps: JSON.stringify(body.steps ?? []),
        sourceConvId: body.sourceConvId ?? null,
        sourceBranch: body.sourceBranch ?? null,
      },
    });
    return NextResponse.json({ job: { ...job, input: safe(job.input), plan: safe(job.plan), steps: safe(job.steps) } });
  } catch {
    return NextResponse.json({ error: "the ledger could not be written" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const job = await db.creationJob.findUnique({ where: { id } });
      if (!job) return NextResponse.json({ error: "no such job" }, { status: 404 });
      return NextResponse.json({
        job: { ...job, input: safe(job.input), plan: safe(job.plan), steps: safe(job.steps) },
      });
    }
    const jobs = await db.creationJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({
      jobs: jobs.map((j) => ({ ...j, input: safe(j.input), plan: safe(j.plan), steps: safe(j.steps) })),
    });
  } catch {
    return NextResponse.json({ error: "the ledger could not be read" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  let body: JobBody;
  try {
    body = (await req.json()) as JobBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const data: Record<string, unknown> = {};
    if (typeof body.status === "string") data.status = body.status.slice(0, 24);
    if (body.plan !== undefined) data.plan = JSON.stringify(body.plan);
    if (body.steps !== undefined) data.steps = JSON.stringify(body.steps);
    if (typeof body.progress === "number") {
      data.progress = Math.max(0, Math.min(100, Math.round(body.progress)));
    }
    if (body.error !== undefined) data.error = String(body.error).slice(0, 500);
    const job = await db.creationJob.update({ where: { id: body.id }, data });
    return NextResponse.json({
      job: { ...job, input: safe(job.input), plan: safe(job.plan), steps: safe(job.steps) },
    });
  } catch {
    return NextResponse.json({ error: "the ledger could not be updated" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.creationJob.update({ where: { id }, data: { status: "cancelled" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "the ledger could not be updated" }, { status: 500 });
  }
}

function safe(v: string | null): unknown {
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
