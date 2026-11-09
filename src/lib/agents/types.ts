/* ------------------------------------------------------------------ */
/*  AGENT CONTRACTS — the shared vocabulary of the capability layer.   */
/*                                                                     */
/*  A tool is a contract, not a database cursor. An agent is a         */
/*  registered capability, never an inherited authority.               */
/* ------------------------------------------------------------------ */

export type ToolPermission =
  | "search:public"
  | "read:public"
  | "read:own"
  | "publish:own"
  | "write:circles"
  | "write:projects"
  | "write:messages"
  | "tasks:manage";

export interface ToolContext {
  /** the authorizing human — every tool acts inside this person's rights */
  userId: string;
  actorType: "user" | "agent";
  actorId: string; // user id or agent key
  agentKey?: string | null;
  correlationId?: string | null;
  /** true → validate and authorize, execute nothing */
  dryRun?: boolean;
}

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  permission: ToolPermission;
  /** declared idempotent → safe to retry without duplicate side effects */
  idempotent: boolean;
  /** soft execution ceiling (ms) enforced by the orchestrator */
  timeoutMs: number;
  /** validate raw input; return a normal error string or null */
  validate: (input: Record<string, unknown>) => string | null;
  execute: (input: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
}

export interface AgentManifest {
  agentKey: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  supportedTasks: string[];
  toolDependencies: string[];
  permissions: ToolPermission[];
  modelConfig?: Record<string, unknown>;
}

export interface TaskStep {
  key: string;
  name: string;
  tool: string;
  input?: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: unknown;
  error?: string | null;
}

export type TaskStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";
