import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import type { TaskStep, ToolContext } from "./types";
import { getTool } from "./tools";
import { authorizeTool } from "./authz";
import { getManifest } from "./registry";
import { emitEvent, EVENT_TYPES } from "@/lib/server/events";

/* ------------------------------------------------------------------ */
/*  THE ORCHESTRATOR — durable tasks, honest retries, human approval.  */
/*                                                                     */
/*  A task is a row, not a memory: its plan (steps), its progress and  */
/*  its result all live in the database, so a crash, a restart or a    */
/*  page refresh resumes the work where it stood. Idempotency keys     */
/*  make retries safe; an approval gate keeps consequential actions    */
/*  in the human's hands.                                              */
/*                                                                     */
/*  Core ReflectMe never depends on this engine: if it is down, the    */
/*  portals, the hall and the network all keep breathing.              */
/* ------------------------------------------------------------------ */

export interface CreateTaskInput {
  userId: string;
  agentKey: string | null;
  kind: "workflow" | "tool";
  name: string;
  input: Record<string, unknown>;
  steps: Omit<TaskStep, "status" | "output" | "error">[];
  idempotencyKey?: string | null;
  correlationId?: string | null;
  approvalRequired?: boolean;
  timeoutSec?: number;
  maxAttempts?: number;
}

export type CreateTaskResult =
  | { ok: true; taskId: string; resumed: boolean; status: string }
  | { ok: false; code: string; message: string };

/** Create (or resume, by idempotency key) a durable task. */
export async function createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
  if (input.idempotencyKey) {
    const existing = await db.agentTask.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, status: true },
    });
    if (existing) return { ok: true, taskId: existing.id, resumed: true, status: existing.status };
  }

  const agentRow = input.agentKey
    ? await db.agentRecord.findUnique({ where: { agentKey: input.agentKey }, select: { id: true, status: true } })
    : null;
  if (input.agentKey && !agentRow) {
    return { ok: false, code: "agent_not_found", message: "That agent is not registered." };
  }
  if (agentRow && agentRow.status !== "active") {
    return { ok: false, code: "agent_inactive", message: "That agent is not activated." };
  }

  const steps: TaskStep[] = input.steps.map((s) => ({ ...s, status: "pending" as const }));
  const task = await db.agentTask.create({
    data: {
      agentId: agentRow?.id ?? null,
      userId: input.userId,
      kind: input.kind,
      name: input.name.slice(0, 120),
      input: JSON.stringify(input.input ?? {}).slice(0, 20000),
      steps: JSON.stringify(steps),
      idempotencyKey: input.idempotencyKey ?? null,
      correlationId: input.correlationId ?? null,
      approvalRequired: input.approvalRequired ?? false,
      timeoutSec: Math.min(600, Math.max(10, input.timeoutSec ?? 120)),
      maxAttempts: Math.min(5, Math.max(1, input.maxAttempts ?? 3)),
      status: "queued",
    },
    select: { id: true },
  });

  await emitEvent(
    {
      type: EVENT_TYPES.agentTaskCreated,
      actorType: "user",
      actorId: input.userId,
      source: "orchestrator",
      correlationId: input.correlationId ?? null,
      payload: { taskId: task.id, kind: input.kind, name: input.name },
    },
    { dedupeKey: `task_created_${task.id}` }
  );

  return { ok: true, taskId: task.id, resumed: false, status: "queued" };
}

export type RunResult =
  | { ok: true; status: string; result?: unknown; steps: TaskStep[] }
  | { ok: false; status: string; error: string; steps?: TaskStep[] };

/**
 * Run (or resume) a task. Completed steps are skipped on resume; a
 * failed step counts one attempt; the approval gate parks the task in
 * awaiting_approval until a human presses the button.
 */
export async function runTask(taskId: string, userId: string): Promise<RunResult> {
  const task = await db.agentTask.findFirst({
    where: { id: taskId, userId },
    select: {
      id: true,
      userId: true,
      status: true,
      steps: true,
      input: true,
      attempts: true,
      maxAttempts: true,
      approvalRequired: true,
      approvedAt: true,
      agentId: true,
      correlationId: true,
      result: true,
    },
  });
  if (!task) return { ok: false, status: "not_found", error: "No such task." };
  if (["completed", "cancelled"].includes(task.status)) {
    return { ok: true, status: task.status, result: task.result ? JSON.parse(task.result) : undefined, steps: JSON.parse(task.steps ?? "[]") };
  }
  if (task.status === "awaiting_approval" && !task.approvedAt) {
    return { ok: false, status: "awaiting_approval", error: "This task waits for the human's yes." };
  }

  const steps: TaskStep[] = JSON.parse(task.steps ?? "[]");
  const manifest = task.agentId
    ? (await db.agentRecord.findUnique({ where: { id: task.agentId }, select: { agentKey: true } }))?.agentKey ?? null
    : null;
  const resolved = manifest ? await getManifest(manifest) : null;
  if (manifest && (!resolved || resolved.status !== "active")) {
    await db.agentTask.update({ where: { id: taskId }, data: { status: "failed", error: "The agent behind this task is not active.", finishedAt: new Date() } });
    return { ok: false, status: "failed", error: "The agent behind this task is not active." };
  }

  const ctx: ToolContext = {
    userId: task.userId,
    actorType: manifest ? "agent" : "user",
    actorId: manifest ?? task.userId,
    agentKey: manifest,
    correlationId: task.correlationId ?? taskId,
  };

  const taskInput = JSON.parse(task.input || "{}") as Record<string, unknown>;
  await db.agentTask.update({
    where: { id: taskId },
    data: {
      status: "running",
      startedAt: task.status === "queued" ? new Date() : undefined,
      attempts: { increment: 1 },
    },
  });
  await emitEvent(
    { type: EVENT_TYPES.agentTaskStarted, actorType: manifest ? "agent" : "user", actorId: ctx.actorId, source: "orchestrator", correlationId: task.correlationId ?? taskId, payload: { taskId } },
    { dedupeKey: `task_started_${taskId}_${Date.now()}` }
  );

  const totalSteps = steps.length || 1;
  let done = 0;
  let approvalIndex = -1;

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.status === "completed" || step.status === "skipped") {
        done++;
        continue;
      }

      /* the approval gate — the step flagged with needs_approval parks the task */
      if (step.status === "pending" && (step.input as { needsApproval?: boolean } | undefined)?.needsApproval && !task.approvedAt) {
        step.status = "pending";
        approvalIndex = i;
        break;
      }

      step.status = "running";
      await db.agentTask.update({ where: { id: taskId }, data: { steps: JSON.stringify(steps) } });

      const tool = getTool(step.tool);
      if (!tool) {
        step.status = "failed";
        step.error = `no such tool: ${step.tool}`;
        throw new Error(step.error);
      }

      const decision = authorizeTool(resolved?.manifest ?? null, tool, ctx);
      if (!decision.allowed) {
        step.status = "failed";
        step.error = `forbidden: ${decision.reason}`;
        throw new Error(step.error);
      }

      const validationError = tool.validate({ ...(step.input ?? {}), ...pickRunInput(taskInput, step.key) });
      if (validationError) {
        step.status = "failed";
        step.error = validationError;
        throw new Error(validationError);
      }

      const merged = { ...(step.input ?? {}), ...pickRunInput(taskInput, step.key) };
      delete (merged as { needsApproval?: boolean }).needsApproval;

      const outcome = await withTimeout(tool.execute(merged, ctx), tool.timeoutMs);
      if (!outcome.ok) {
        step.status = "failed";
        step.error = outcome.error ?? "the tool refused";
        throw new Error(step.error ?? "tool failed");
      }
      step.status = "completed";
      step.output = outcome.data;
      step.error = null;
      done++;
      await db.agentTask.update({
        where: { id: taskId },
        data: { steps: JSON.stringify(steps), progress: Math.round((done / totalSteps) * 100) },
      });
    }

    /* parked at the approval gate, not finished */
    if (approvalIndex >= 0) {
      await db.agentTask.update({
        where: { id: taskId },
        data: { status: "awaiting_approval", steps: JSON.stringify(steps), progress: Math.round((done / totalSteps) * 100) },
      });
      await emitEvent(
        { type: EVENT_TYPES.agentTaskAwaitingApproval, actorType: ctx.actorType, actorId: ctx.actorId, source: "orchestrator", payload: { taskId } },
        { dedupeKey: `task_awaiting_${taskId}_${Date.now()}` }
      );
      return { ok: true, status: "awaiting_approval", steps };
    }

    const resultPayload = {
      steps: steps.filter((s) => s.status === "completed").map((s) => ({ key: s.key, output: s.output })),
    };
    await db.agentTask.update({
      where: { id: taskId },
      data: { status: "completed", steps: JSON.stringify(steps), progress: 100, result: JSON.stringify(resultPayload), finishedAt: new Date(), error: null },
    });
    await emitEvent(
      { type: EVENT_TYPES.agentTaskCompleted, actorType: ctx.actorType, actorId: ctx.actorId, source: "orchestrator", payload: { taskId } },
      { dedupeKey: `task_done_${taskId}` }
    );
    return { ok: true, status: "completed", result: resultPayload, steps };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fresh = await db.agentTask.findUnique({ where: { id: taskId }, select: { attempts: true, maxAttempts: true } });
    const canRetry = (fresh?.attempts ?? 0) < (fresh?.maxAttempts ?? 1);
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: canRetry ? "queued" : "failed",
        error: message.slice(0, 500),
        steps: JSON.stringify(steps),
        finishedAt: canRetry ? undefined : new Date(),
      },
    });
    await emitEvent(
      { type: EVENT_TYPES.agentTaskFailed, actorType: ctx.actorType, actorId: ctx.actorId, source: "orchestrator", payload: { taskId, error: message.slice(0, 200), willRetry: canRetry } },
      { dedupeKey: `task_failed_${taskId}_${Date.now()}` }
    );
    return { ok: false, status: canRetry ? "queued" : "failed", error: message, steps };
  }
}

/** Approve the gate — then the task runs again from where it waited. */
export async function approveTask(taskId: string, userId: string): Promise<boolean> {
  const task = await db.agentTask.findFirst({
    where: { id: taskId, userId, status: "awaiting_approval" },
    select: { id: true },
  });
  if (!task) return false;
  await db.agentTask.update({ where: { id: taskId }, data: { approvedAt: new Date() } });
  await db.auditRecord.create({
    data: { actorType: "user", actorId: userId, action: "task.approve", resourceType: "agent_task", resourceId: taskId, meta: null },
  });
  return true;
}

export async function cancelTask(taskId: string, userId: string): Promise<boolean> {
  const task = await db.agentTask.findFirst({
    where: { id: taskId, userId, status: { in: ["queued", "running", "awaiting_approval"] } },
    select: { id: true },
  });
  if (!task) return false;
  await db.agentTask.update({ where: { id: taskId }, data: { status: "cancelled", finishedAt: new Date() } });
  await db.auditRecord.create({
    data: { actorType: "user", actorId: userId, action: "task.cancel", resourceType: "agent_task", resourceId: taskId, meta: null },
  });
  return true;
}

/** Steps may pull their inputs from the task's own input JSON by key. */
function pickRunInput(taskInput: Record<string, unknown>, stepKey: string): Record<string, unknown> {
  const scoped = taskInput[stepKey];
  return scoped && typeof scoped === "object" && !Array.isArray(scoped) ? (scoped as Record<string, unknown>) : {};
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`tool exceeded its ${ms}ms ceiling`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export function newCorrelationId(): string {
  return `cor_${randomUUID()}`;
}
