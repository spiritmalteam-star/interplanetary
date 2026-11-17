import { NextRequest, NextResponse } from "next/server";
import { resolveVisitor, withAnonCookie } from "@/lib/server/access";
import { rateLimit } from "@/lib/server/rate-limit";
import { createTask, runTask, newCorrelationId } from "@/lib/agents/orchestrator";
import { getWorkflow } from "@/lib/agents/workflows";
import { getTool } from "@/lib/agents/tools";
import { getManifest, ensureAgentRegistrySeeded } from "@/lib/agents/registry";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE TASK DESK — /api/agents/tasks                                  */
/*                                                                     */
/*  POST — summon a workflow or a single tool as a durable task,       */
/*         then run it (resume-safe, approval-gated, idempotent).      */
/*  GET  — the caller's own tasks, newest first.                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const limit = rateLimit(`agent-task:${visitor.user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ error: "The desk rests a moment." }, { status: 429 });
    }
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const kind = raw.kind === "tool" ? "tool" : "workflow";
    const key = typeof raw.key === "string" ? raw.key.trim() : "";
    if (!key) return NextResponse.json({ error: "Name the work: a workflow or tool key." }, { status: 400 });
    /* the register stands before any hand reaches for an agent */
    await ensureAgentRegistrySeeded().catch(() => {});
    const input = raw.input && typeof raw.input === "object" && !Array.isArray(raw.input) ? (raw.input as Record<string, unknown>) : {};
    const idempotencyKey = typeof raw.idempotencyKey === "string" && raw.idempotencyKey.trim() ? raw.idempotencyKey.trim().slice(0, 120) : null;
    const correlationId = newCorrelationId();

    if (kind === "workflow") {
      const workflow = getWorkflow(key);
      if (!workflow) return NextResponse.json({ error: "No such workflow." }, { status: 404 });
      const invalid = workflow.validateInput(input);
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
      const created = await createTask({
        userId: visitor.user.id,
        agentKey: workflow.agentKey,
        kind,
        name: workflow.name,
        input,
        steps: workflow.plan(input),
        idempotencyKey: idempotencyKey ?? `wf_${key}_${visitor.user.id}_${JSON.stringify(input).slice(0, 80)}`,
        correlationId,
        approvalRequired: workflow.approvalRequired,
      });
      if (!created.ok) return NextResponse.json({ error: created.message, code: created.code }, { status: 400 });
      const run = await runTask(created.taskId, visitor.user.id);
      return withAnonCookie(
        NextResponse.json({ taskId: created.taskId, resumed: created.resumed, status: run.ok ? run.status : run.status, error: run.ok ? null : run.error }),
        visitor
      );
    }

    /* single tool invocation — the human's own hand or an active agent's */
    const tool = getTool(key);
    if (!tool) return NextResponse.json({ error: "No such tool." }, { status: 404 });
    const agentKey = typeof raw.agentKey === "string" && raw.agentKey.trim() ? raw.agentKey.trim() : null;
    if (agentKey) {
      const found = await getManifest(agentKey);
      if (!found) return NextResponse.json({ error: "No such agent." }, { status: 404 });
    }
    const invalid = tool.validate(input);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    const created = await createTask({
      userId: visitor.user.id,
      agentKey,
      kind,
      name: tool.name,
      /* the single step reads its input under its own key ("invoke") */
      input: { invoke: input },
      steps: [{ key: "invoke", name: tool.name, tool: tool.name }],
      idempotencyKey,
      correlationId,
    });
    if (!created.ok) return NextResponse.json({ error: created.message, code: created.code }, { status: 400 });
    const run = await runTask(created.taskId, visitor.user.id);
    const steps = run.ok ? run.steps : run.steps ?? [];
    const finalOutput = steps.find((s) => s.key === "invoke")?.output ?? null;
    return withAnonCookie(
      NextResponse.json({ taskId: created.taskId, resumed: created.resumed, status: run.ok ? run.status : run.status, result: finalOutput, error: run.ok ? null : run.error }),
      visitor
    );
  } catch (err) {
    console.error("[agent-tasks] create failed:", err);
    /* graceful degradation: the platform runs without the orchestrator */
    return NextResponse.json({ error: "The task desk is momentarily quiet. Core rooms are unaffected." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const visitor = await resolveVisitor(req);
  try {
    const rows = await db.agentTask.findMany({
      where: { userId: visitor.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, kind: true, name: true, status: true, progress: true, steps: true,
        result: true, error: true, attempts: true, approvalRequired: true, approvedAt: true,
        createdAt: true, updatedAt: true, correlationId: true,
      },
    });
    return withAnonCookie(
      NextResponse.json({
        tasks: rows.map((t) => ({
          id: t.id,
          kind: t.kind,
          name: t.name,
          status: t.status,
          progress: t.progress,
          steps: t.steps ? JSON.parse(t.steps) : [],
          result: t.result ? JSON.parse(t.result) : null,
          error: t.error,
          attempts: t.attempts,
          awaitingApproval: t.status === "awaiting_approval" && !t.approvedAt,
          correlationId: t.correlationId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
      }),
      visitor
    );
  } catch (err) {
    console.error("[agent-tasks] list failed:", err);
    return NextResponse.json({ tasks: [], degraded: true });
  }
}
