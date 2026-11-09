import { db } from "@/lib/db";
import type { AgentManifest, ToolPermission } from "./types";
import { listToolNames } from "./tools";

/* ------------------------------------------------------------------ */
/*  THE AGENT REGISTRY — who may act, and through which doors.         */
/*                                                                     */
/*  Manifests live in code (the truth of what each agent is) and are   */
/*  mirrored into the AgentRecord table (the truth of what each agent  */
/*  may do). Activation is explicit; deactivation revokes nothing in   */
/*  code but bars the gate at runtime.                                 */
/* ------------------------------------------------------------------ */

/** The house's own reflective intelligence — M.E. as a capability, not an authority. */
export const MIRROR_ENTITY_AGENT: AgentManifest = {
  agentKey: "mirror-entity",
  name: "Mirror Entity",
  description:
    "ReflectMe's reflective intelligence: surfaces kindred makers, connects themes across portals, summarizes long discussions — and acts only through audited tools, always on a human's behalf, never beyond their own rights.",
  version: "1.0.0",
  capabilities: [
    "surface_kindred_makers",
    "summarize_discussion",
    "identify_open_questions",
    "recommend_collaborators",
    "connect_creations_across_portals",
  ],
  supportedTasks: ["find_collaborators", "summarize_discussion", "search_creations"],
  toolDependencies: [
    "search_public_creations",
    "search_people",
    "search_circles",
    "get_public_profile",
    "get_publication",
    "publish_transmission",
    "search_knowledge",
    "get_task_status",
  ],
  permissions: ["search:public", "read:public", "tasks:manage"],
  modelConfig: { persona: "mirror-entity", temperature: 0.6 },
};

/**
 * An operator agent demonstrates the delegated pattern: it may act on a
 * human's behalf through tools that write — but only when the task that
 * summons it was created by that human, and every step is audited.
 */
export const STEWARD_AGENT: AgentManifest = {
  agentKey: "circle-steward",
  name: "Circle Steward",
  description:
    "A demonstration steward: founds circles, opens projects and invites collaborators strictly within the authorizing user's own rights. Consequential external actions require the human's approval in the task flow.",
  version: "1.0.0",
  capabilities: ["found_circle", "open_project", "invite_collaborator", "send_prepared_message"],
  supportedTasks: ["find_collaborators", "found_circle", "open_project"],
  toolDependencies: [
    "search_people",
    "search_circles",
    "get_project",
    "rank_collaborators",
    "create_circle",
    "create_project",
    "update_project",
    "invite_collaborator",
    "send_message",
    "get_task_status",
    "cancel_task",
  ],
  permissions: ["search:public", "read:public", "read:own", "write:circles", "write:projects", "write:messages", "tasks:manage"],
};

const BUILTIN_MANIFESTS: AgentManifest[] = [MIRROR_ENTITY_AGENT, STEWARD_AGENT];

/** Every declared tool dependency must actually exist — a manifest that lies cannot register. */
function validateManifest(m: AgentManifest): string[] {
  const errors: string[] = [];
  const known = new Set(listToolNames());
  for (const dep of m.toolDependencies) {
    if (!known.has(dep)) errors.push(`unknown tool dependency: ${dep}`);
  }
  const knownPerms = new Set<string>([
    "search:public",
    "read:public",
    "read:own",
    "publish:own",
    "write:circles",
    "write:projects",
    "write:messages",
    "tasks:manage",
  ]);
  for (const p of m.permissions) {
    if (!knownPerms.has(p)) errors.push(`unknown permission: ${p}`);
  }
  return errors;
}

/** Mirror all built-in manifests into the table; idempotent, non-destructive. */
export async function ensureAgentRegistrySeeded(): Promise<void> {
  for (const manifest of BUILTIN_MANIFESTS) {
    const errors = validateManifest(manifest);
    if (errors.length > 0) {
      console.error(`[agent-registry] manifest ${manifest.agentKey} invalid:`, errors);
      continue;
    }
    await db.agentRecord.upsert({
      where: { agentKey: manifest.agentKey },
      create: {
        agentKey: manifest.agentKey,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        capabilities: JSON.stringify(manifest.capabilities),
        supportedTasks: JSON.stringify(manifest.supportedTasks),
        toolDependencies: JSON.stringify(manifest.toolDependencies),
        permissions: JSON.stringify(manifest.permissions),
        modelConfig: manifest.modelConfig ? JSON.stringify(manifest.modelConfig) : null,
        status: manifest.agentKey === "mirror-entity" ? "active" : "inactive",
      },
      update: {
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        capabilities: JSON.stringify(manifest.capabilities),
        supportedTasks: JSON.stringify(manifest.supportedTasks),
        toolDependencies: JSON.stringify(manifest.toolDependencies),
        modelConfig: manifest.modelConfig ? JSON.stringify(manifest.modelConfig) : null,
        /* permissions/status stay as the operator set them in the control center */
      },
    });
  }
}

export async function getManifest(agentKey: string): Promise<{ manifest: AgentManifest; status: string } | null> {
  const row = await db.agentRecord.findUnique({ where: { agentKey } });
  if (!row) return null;
  const builtin = BUILTIN_MANIFESTS.find((m) => m.agentKey === agentKey);
  const manifest: AgentManifest = builtin ?? {
    agentKey: row.agentKey,
    name: row.name,
    description: row.description,
    version: row.version,
    capabilities: JSON.parse(row.capabilities || "[]"),
    supportedTasks: JSON.parse(row.supportedTasks || "[]"),
    toolDependencies: JSON.parse(row.toolDependencies || "[]"),
    permissions: JSON.parse(row.permissions || "[]") as ToolPermission[],
  };
  return { manifest, status: row.status };
}

export async function listManifests(): Promise<{ manifest: AgentManifest; status: string }[]> {
  const rows = await db.agentRecord.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((row) => {
    const builtin = BUILTIN_MANIFESTS.find((m) => m.agentKey === row.agentKey);
    const manifest: AgentManifest = builtin ?? {
      agentKey: row.agentKey,
      name: row.name,
      description: row.description,
      version: row.version,
      capabilities: JSON.parse(row.capabilities || "[]"),
      supportedTasks: JSON.parse(row.supportedTasks || "[]"),
      toolDependencies: JSON.parse(row.toolDependencies || "[]"),
      permissions: JSON.parse(row.permissions || "[]") as ToolPermission[],
    };
    return { manifest, status: row.status };
  });
}

export async function setAgentStatus(agentKey: string, status: "active" | "inactive" | "suspended"): Promise<boolean> {
  const row = await db.agentRecord.findUnique({ where: { agentKey }, select: { id: true } });
  if (!row) return false;
  await db.agentRecord.update({ where: { agentKey }, data: { status } });
  if (status !== "active") {
    /* deactivation bars the gate: every grant falls silent with the agent */
    await db.agentGrant.updateMany({ where: { agentId: row.id }, data: { active: status === "active" } });
  }
  return true;
}
