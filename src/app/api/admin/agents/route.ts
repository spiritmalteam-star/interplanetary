import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isKeeperFree } from "@/lib/server/access";
import { db } from "@/lib/db";
import { listManifests, ensureAgentRegistrySeeded } from "@/lib/agents/registry";
import { eventHealth } from "@/lib/server/events";
import { TOOLS } from "@/lib/agents/tools";

/* ------------------------------------------------------------------ */
/*  THE CONTROL ROOM'S LEDGER — /api/admin/agents                      */
/*                                                                     */
/*  Administrator observability: agent health, task execution, tool    */
/*  failures, event flow, audit trail. Administrators inspect          */
/*  operations without unrestricted access to private user content —   */
/*  every answer is metadata, references and counters.                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isKeeperFree(user)) {
    return NextResponse.json({ error: "This room belongs to the keepers." }, { status: 403 });
  }
  try {
    await ensureAgentRegistrySeeded();
    const [agents, taskStats, recentTasks, toolStats, events, audit] = await Promise.all([
      listManifests(),
      db.agentTask.groupBy({ by: ["status"], _count: true }),
      db.agentTask.findMany({
        orderBy: { updatedAt: "desc" },
        take: 25,
        select: {
          id: true, kind: true, name: true, status: true, progress: true, error: true,
          attempts: true, maxAttempts: true, approvedAt: true, createdAt: true, updatedAt: true,
          user: { select: { id: true } },
        },
      }),
      db.auditRecord.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } } }),
      eventHealth(15),
      db.auditRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, actorType: true, actorId: true, action: true, resourceType: true, resourceId: true, createdAt: true },
      }),
    ]);

    const failedTasks = taskStats.find((t) => t.status === "failed")?._count ?? 0;
    const completedTasks = taskStats.find((t) => t.status === "completed")?._count ?? 0;

    return NextResponse.json({
      agents: agents.map((a) => ({
        key: a.manifest.agentKey,
        name: a.manifest.name,
        version: a.manifest.version,
        status: a.status,
        permissions: a.manifest.permissions,
        toolDependencies: a.manifest.toolDependencies,
        capabilities: a.manifest.capabilities,
      })),
      tools: Object.values(TOOLS).map((t) => ({
        name: t.name,
        permission: t.permission,
        idempotent: t.idempotent,
        timeoutMs: t.timeoutMs,
      })),
      health: {
        tasks: { byStatus: Object.fromEntries(taskStats.map((t) => [t.status, t._count])), failed: failedTasks, completed: completedTasks },
        events: { total: events.total, undelivered: events.undelivered, dead: events.dead, recent: events.recent },
        toolInvocations: Object.fromEntries(toolStats.map((t) => [t.action, t._count])),
      },
      recentTasks: recentTasks.map((t) => ({
        id: t.id,
        kind: t.kind,
        name: t.name,
        status: t.status,
        progress: t.progress,
        error: t.error,
        attempts: t.attempts,
        maxAttempts: t.maxAttempts,
        awaitingApproval: t.status === "awaiting_approval",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      audit: audit.map((a) => ({
        id: a.id,
        actorType: a.actorType,
        actorId: a.actorId,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error("[admin-agents] observability failed:", err);
    return NextResponse.json({ error: "The control room's ledger is momentarily quiet." }, { status: 503 });
  }
}

/** The keepers' hand: activate, deactivate or suspend a registered agent. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !isKeeperFree(user)) {
    return NextResponse.json({ error: "This room belongs to the keepers." }, { status: 403 });
  }
  try {
    const raw = (await req.json().catch(() => ({}))) as { agentKey?: string; status?: string };
    const agentKey = typeof raw.agentKey === "string" ? raw.agentKey : "";
    const status = raw.status;
    if (!agentKey || !status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Name the agent and its next state." }, { status: 400 });
    }
    const { setAgentStatus } = await import("@/lib/agents/registry");
    const ok = await setAgentStatus(agentKey, status as "active" | "inactive" | "suspended");
    if (!ok) return NextResponse.json({ error: "No such agent." }, { status: 404 });
    await db.auditRecord.create({
      data: {
        actorType: "user",
        actorId: user.id,
        action: "admin.agent_status",
        resourceType: "agent",
        resourceId: agentKey,
        meta: JSON.stringify({ status }),
      },
    });
    return NextResponse.json({ ok: true, agentKey, status });
  } catch (err) {
    console.error("[admin-agents] status change failed:", err);
    return NextResponse.json({ error: "The control room is momentarily quiet." }, { status: 500 });
  }
}
