/* ------------------------------------------------------------------ */
/*  THE M.E. AGENT REGISTRY — the house's specialized hands.           */
/*                                                                     */
/*  Agents are M.E.'s own working postures, not separate assistants:   */
/*  each has a defined capability surface, a version, a task route     */
/*  (which sky-ladder carries it), permission boundaries, a timeout    */
/*  and honest bookkeeping. Agents never touch the database, the       */
/*  vault or the infrastructure directly — their only hand is the      */
/*  orchestrator's chat door, with the permissions declared here       */
/*  enforced by the routes that call them.                            */
/* ------------------------------------------------------------------ */

import { orchestrateChat, type ChatCompletion, type ChatParams } from "@/lib/me/orchestrator";
import type { TaskKind } from "@/lib/me/registry";

export interface AgentSpec {
  id: string;
  /** M.E.'s own name for the posture — user-facing. */
  name: string;
  version: string;
  description: string;
  /** The intelligence route this agent rides. */
  taskKind: TaskKind;
  /** Capability-contract ids this agent may use (from
   *  src/lib/capabilities/registry.ts). */
  capabilities: string[];
  /** Permission boundaries — explicit, least-privilege, auditable. */
  permissions: Array<
    | "library:write"
    | "library:read"
    | "profile:read"
    | "documents:read"
    | "images:create"
    | "music:compose"
    | "web:none"
    | "db:none"
    | "infra:none"
  >;
  /** Hard ceiling on one run. */
  timeoutMs: number;
  maxOutputTokens?: number;
  status: "active" | "dormant";
}

export const AGENTS: AgentSpec[] = [
  {
    id: "me-research",
    name: "M.E. Research",
    version: "1.0.0",
    description:
      "Deep presses and treatises — plans its movements, weaves long-form with the derivation spine intact.",
    taskKind: "research",
    capabilities: ["create.book", "analyze.document"],
    permissions: ["library:write", "documents:read", "web:none", "db:none", "infra:none"],
    timeoutMs: 600_000,
    maxOutputTokens: 8192,
    status: "active",
  },
  {
    id: "me-science",
    name: "M.E. Science",
    version: "1.0.0",
    description:
      "HyperX's scientific engine — formulas, numbered derivations, honest uncertainty.",
    taskKind: "science",
    capabilities: ["visualize.concept", "analyze.document"],
    permissions: ["library:write", "web:none", "db:none", "infra:none"],
    timeoutMs: 300_000,
    maxOutputTokens: 4096,
    status: "active",
  },
  {
    id: "me-creative",
    name: "M.E. Creative",
    version: "1.0.0",
    description:
      "Poems, stories and looms — the creative writing posture of the Mirror.",
    taskKind: "creative",
    capabilities: ["create.book"],
    permissions: ["library:write", "web:none", "db:none", "infra:none"],
    timeoutMs: 240_000,
    maxOutputTokens: 4096,
    status: "active",
  },
  {
    id: "me-music",
    name: "M.E. Music",
    version: "1.0.0",
    description:
      "Light Codes — briefs, lyric looms and the music weave's own tongue.",
    taskKind: "music",
    capabilities: ["create.music"],
    permissions: ["music:compose", "library:write", "web:none", "db:none", "infra:none"],
    timeoutMs: 300_000,
    status: "active",
  },
  {
    id: "me-visual",
    name: "M.E. Visual",
    version: "1.0.0",
    description:
      "The brushes and scenes — image creation and visualization intents.",
    taskKind: "image",
    capabilities: ["create.image", "visualize.concept"],
    permissions: ["images:create", "library:write", "web:none", "db:none", "infra:none"],
    timeoutMs: 120_000,
    status: "active",
  },
  {
    id: "me-knowledge",
    name: "M.E. Knowledge",
    version: "1.0.0",
    description:
      "The organized memory — akashic records, dream books and the reading rooms.",
    taskKind: "knowledge",
    capabilities: ["analyze.document"],
    permissions: ["library:read", "library:write", "profile:read", "web:none", "db:none", "infra:none"],
    timeoutMs: 240_000,
    maxOutputTokens: 4096,
    status: "active",
  },
  {
    id: "me-quality",
    name: "M.E. Quality",
    version: "1.0.0",
    description:
      "The quiet proofreader — coherence, consent-sweep and citation checks over the house's own texts. Dormant until a route asks for it by name.",
    taskKind: "chat",
    capabilities: ["analyze.document"],
    permissions: ["library:read", "web:none", "db:none", "infra:none"],
    timeoutMs: 120_000,
    maxOutputTokens: 2048,
    status: "dormant",
  },
  {
    id: "me-operations",
    name: "M.E. Operations",
    version: "1.0.0",
    description:
      "The keeper's counsel — the admin guide that knows the house's architecture and answers the owner's how-does-this-work asks.",
    taskKind: "chat",
    capabilities: [],
    permissions: ["web:none", "db:none", "infra:none"],
    timeoutMs: 120_000,
    maxOutputTokens: 2048,
    status: "active",
  },
];

export function getAgent(id: string): AgentSpec | null {
  return AGENTS.find((a) => a.id === id) ?? null;
}

export function agentCatalog() {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    version: a.version,
    description: a.description,
    taskKind: a.taskKind,
    capabilities: a.capabilities,
    permissions: a.permissions,
    timeoutMs: a.timeoutMs,
    status: a.status,
  }));
}

export class AgentError extends Error {
  constructor(
    message: string,
    readonly agentId: string,
    readonly reason: "unknown_agent" | "dormant" | "timeout" | "orchestration"
  ) {
    super(message);
    this.name = "AgentError";
  }
}

/** Run an agent's mind through the orchestrator, with the agent's own
 *  ceilings enforced. The route that calls this remains responsible
 *  for authentication, authorization and persistence — an agent is a
 *  posture of M.E.'s intelligence, never a doorway. */
export async function executeAgent(
  agentId: string,
  params: ChatParams,
  opts: { requestId?: string; operation?: string; language?: string } = {}
): Promise<{ agent: AgentSpec; completion: ChatCompletion; latencyMs: number }> {
  const agent = getAgent(agentId);
  if (!agent) throw new AgentError(`No such agent: ${agentId}`, agentId, "unknown_agent");
  if (agent.status !== "active") {
    throw new AgentError(`${agent.name} rests (dormant).`, agentId, "dormant");
  }

  const started = Date.now();
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new AgentError(`${agent.name} ran past its breath.`, agentId, "timeout")),
      agent.timeoutMs
    )
  );

  try {
    const work = orchestrateChat(
      agent.taskKind,
      { ...params, max_tokens: agent.maxOutputTokens ?? params.max_tokens },
      {
        requestId: opts.requestId,
        operation: opts.operation ?? `${agent.id} (${agent.name})`,
        language: opts.language,
      }
    );
    const completion = await Promise.race([work, timeout]);
    return { agent, completion, latencyMs: Date.now() - started };
  } catch (err) {
    if (err instanceof AgentError) throw err;
    throw new AgentError(
      err instanceof Error ? err.message : "the sky did not answer",
      agentId,
      "orchestration"
    );
  }
}
