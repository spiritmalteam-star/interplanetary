import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  OWNER_KEY,
  boundedJson,
  guardCreation,
  packOwned,
  unpackOwned,
} from "@/lib/server/creation-guard";

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

/* every call carries a visitor identity and flood-gates; every row is
   owned (see lib/server/creation-guard.ts) — a visitor reads, changes
   and cancels only their own walks. Rows from before the guard carry no
   owner and are left untouched. */
const GATE = {
  bucket: "creation-jobs",
  perVisitor: { limit: 120, windowMs: 60 * 1000 },
  perIp: { limit: 300, windowMs: 60 * 1000 },
};
const STATUSES = new Set(["queued", "planning", "running", "completed", "failed", "cancelled"]);
const MAX_JSON = 200_000; // chars per JSON column

type Row = {
  id: string;
  kind: string;
  status: string;
  input: string;
  plan: string | null;
  steps: string;
  progress: number;
  error: string | null;
  sourceConvId: string | null;
  sourceBranch: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** the row as the visitor sees it — owner key removed, JSON parsed */
function present(job: Row) {
  return { ...job, input: unpackOwned(job.input).value, plan: safe(job.plan), steps: safe(job.steps) };
}

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
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  let body: JobBody;
  try {
    body = (await req.json()) as JobBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  const kind = typeof body.kind === "string" ? body.kind.slice(0, 64) : "";
  if (!kind) return NextResponse.json({ error: "kind required" }, { status: 400 });
  const inputText = boundedJson(body.input ?? {}, MAX_JSON);
  const planText = body.plan ? boundedJson(body.plan, MAX_JSON) : null;
  const stepsText = boundedJson(body.steps ?? [], MAX_JSON);
  if (inputText === null || stepsText === null || (body.plan && planText === null)) {
    return guard.reply(NextResponse.json({ error: "that walk is too large for the ledger" }, { status: 413 }));
  }
  try {
    const job = await db.creationJob.create({
      data: {
        kind,
        status: typeof body.status === "string" && STATUSES.has(body.status) ? body.status : "queued",
        input: packOwned(body.input ?? {}, guard.userId),
        plan: planText,
        steps: stepsText,
        sourceConvId: typeof body.sourceConvId === "string" ? body.sourceConvId.slice(0, 64) : null,
        sourceBranch: typeof body.sourceBranch === "string" ? body.sourceBranch.slice(0, 300) : null,
      },
    });
    return guard.reply(NextResponse.json({ job: present(job) }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the ledger could not be written" }, { status: 500 }));
  }
}

export async function GET(req: NextRequest) {
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  const id = req.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const job = await db.creationJob.findUnique({ where: { id: id.slice(0, 64) } });
      /* a job that is not yours is, to you, a job that does not exist */
      if (!job || unpackOwned(job.input).owner !== guard.userId) {
        return guard.reply(NextResponse.json({ error: "no such job" }, { status: 404 }));
      }
      return guard.reply(NextResponse.json({ job: present(job) }));
    }
    /* the visitor's own walks only — the text filter narrows the scan,
       the exact owner check below is the real gate */
    const candidates = await db.creationJob.findMany({
      where: { input: { contains: `"${OWNER_KEY}":"${guard.userId}"` } },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const mine = candidates.filter((j) => unpackOwned(j.input).owner === guard.userId).slice(0, 20);
    return guard.reply(NextResponse.json({ jobs: mine.map(present) }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the ledger could not be read" }, { status: 500 }));
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  let body: JobBody;
  try {
    body = (await req.json()) as JobBody;
  } catch {
    return NextResponse.json({ error: "unreadable body" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id) {
    return guard.reply(NextResponse.json({ error: "id required" }, { status: 400 }));
  }
  try {
    const current = await db.creationJob.findUnique({ where: { id: body.id.slice(0, 64) } });
    if (!current || unpackOwned(current.input).owner !== guard.userId) {
      return guard.reply(NextResponse.json({ error: "no such job" }, { status: 404 }));
    }
    const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && STATUSES.has(body.status)) data.status = body.status;
    if (body.plan !== undefined) {
      const text = boundedJson(body.plan, MAX_JSON);
      if (text === null) return guard.reply(NextResponse.json({ error: "plan too large" }, { status: 413 }));
      data.plan = text;
    }
    if (body.steps !== undefined) {
      const text = boundedJson(body.steps, MAX_JSON);
      if (text === null) return guard.reply(NextResponse.json({ error: "steps too large" }, { status: 413 }));
      data.steps = text;
    }
    if (typeof body.progress === "number") {
      data.progress = Math.max(0, Math.min(100, Math.round(body.progress)));
    }
    if (body.error !== undefined) data.error = String(body.error).slice(0, 500);
    const job = await db.creationJob.update({ where: { id: current.id }, data });
    return guard.reply(NextResponse.json({ job: present(job) }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the ledger could not be updated" }, { status: 500 }));
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await guardCreation(req, GATE);
  if (!guard.ok) return guard.res;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return guard.reply(NextResponse.json({ error: "id required" }, { status: 400 }));
  try {
    const current = await db.creationJob.findUnique({ where: { id: id.slice(0, 64) } });
    if (!current || unpackOwned(current.input).owner !== guard.userId) {
      return guard.reply(NextResponse.json({ error: "no such job" }, { status: 404 }));
    }
    await db.creationJob.update({ where: { id: current.id }, data: { status: "cancelled" } });
    return guard.reply(NextResponse.json({ ok: true }));
  } catch {
    return guard.reply(NextResponse.json({ error: "the ledger could not be updated" }, { status: 500 }));
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
