import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { runTask, approveTask, cancelTask } from "@/lib/agents/orchestrator";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  ONE TASK'S ROOM — /api/agents/tasks/[id]                           */
/*                                                                     */
/*  GET  — the task's whole truth: status, steps, result.              */
/*  POST — the human's hands: approve the gate, or stop the work.      */
/*         { action: "approve" | "cancel" | "resume" }                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const visitor = await resolveVisitor(req);
  try {
    const { id } = await params;
    const task = await db.agentTask.findFirst({
      where: { id, userId: visitor.user.id },
      select: {
        id: true, kind: true, name: true, status: true, progress: true, steps: true,
        result: true, error: true, attempts: true, maxAttempts: true, approvalRequired: true,
        approvedAt: true, idempotencyKey: true, correlationId: true,
        createdAt: true, startedAt: true, finishedAt: true,
      },
    });
    if (!task) return NextResponse.json({ error: "No such task." }, { status: 404 });
    return withAnonCookie(
      NextResponse.json({
        task: {
          id: task.id,
          kind: task.kind,
          name: task.name,
          status: task.status,
          progress: task.progress,
          steps: task.steps ? JSON.parse(task.steps) : [],
          result: task.result ? JSON.parse(task.result) : null,
          error: task.error,
          attempts: task.attempts,
          maxAttempts: task.maxAttempts,
          awaitingApproval: task.status === "awaiting_approval" && !task.approvedAt,
          idempotencyKey: task.idempotencyKey,
          correlationId: task.correlationId,
          createdAt: task.createdAt,
          startedAt: task.startedAt,
          finishedAt: task.finishedAt,
        },
      }),
      visitor
    );
  } catch (err) {
    console.error("[agent-task] read failed:", err);
    return NextResponse.json({ error: "The desk is momentarily quiet." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const visitor = await resolveVisitor(req);
  try {
    const { id } = await params;
    const raw = (await req.json().catch(() => ({}))) as { action?: string };
    const action = raw.action ?? "resume";

    if (action === "approve") {
      const ok = await approveTask(id, visitor.user.id);
      if (!ok) return NextResponse.json({ error: "Nothing waits at that gate." }, { status: 400 });
      const run = await runTask(id, visitor.user.id);
      return withAnonCookie(
        NextResponse.json({ ok: true, status: run.ok ? run.status : run.status, error: run.ok ? null : run.error }),
        visitor
      );
    }

    if (action === "cancel") {
      const ok = await cancelTask(id, visitor.user.id);
      if (!ok) return NextResponse.json({ error: "That work has already come to rest." }, { status: 400 });
      return withAnonCookie(NextResponse.json({ ok: true, status: "cancelled" }), visitor);
    }

    /* resume — retries are safe: completed steps are skipped */
    const run = await runTask(id, visitor.user.id);
    return withAnonCookie(
      NextResponse.json({ ok: run.ok, status: run.ok ? run.status : run.status, error: run.ok ? null : run.error }),
      visitor
    );
  } catch (err) {
    console.error("[agent-task] action failed:", err);
    return NextResponse.json({ error: "The desk is momentarily quiet." }, { status: 503 });
  }
}
