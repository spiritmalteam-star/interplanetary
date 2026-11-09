import type { AgentManifest, ToolContext, ToolDefinition } from "./types";
import { TOOLS } from "./tools";

/* ------------------------------------------------------------------ */
/*  THE PERMISSION GATE — least privilege, made literal.               */
/*                                                                     */
/*  An agent never inherits broader authority than the originating     */
/*  authorization permits: its manifest grants are intersected with     */
/*  the tool's own permission before a single line executes.            */
/* ------------------------------------------------------------------ */

export interface AuthzDecision {
  allowed: boolean;
  reason: string;
}

export function authorizeTool(
  agent: AgentManifest | null,
  tool: ToolDefinition,
  ctx: ToolContext
): AuthzDecision {
  /* a human's own hand needs no manifest — the session is the grant */
  if (ctx.actorType === "user") {
    return { allowed: true, reason: "the authorizing human's own hand" };
  }
  if (!agent) {
    return { allowed: false, reason: "no registered agent stands behind this call" };
  }
  if (!agent.permissions.includes(tool.permission)) {
    return {
      allowed: false,
      reason: `agent "${agent.agentKey}" holds no "${tool.permission}" grant (needed by ${tool.name})`,
    };
  }
  if (!agent.toolDependencies.includes(tool.name)) {
    return {
      allowed: false,
      reason: `agent "${agent.agentKey}" does not declare tool "${tool.name}" among its dependencies`,
    };
  }
  return { allowed: true, reason: "granted by manifest, least privilege" };
}

export function toolContractsFor(agent: AgentManifest | null) {
  return Object.values(TOOLS)
    .filter((t) => !agent || (agent.permissions.includes(t.permission) && agent.toolDependencies.includes(t.name)))
    .map((t) => ({
      name: t.name,
      description: t.description,
      permission: t.permission,
      idempotent: t.idempotent,
      timeoutMs: t.timeoutMs,
    }));
}
