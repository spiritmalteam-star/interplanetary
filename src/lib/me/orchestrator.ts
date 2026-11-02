/* ------------------------------------------------------------------ */
/*  THE M.E. ORCHESTRATOR — the central intelligence layer.            */
/*                                                                     */
/*  One coherent intelligence, many skies. Every experience that asks  */
/*  for M.E.'s mind walks through here: the orchestrator names the     */
/*  task, resolves the ladder of skies from the registry, opens the    */
/*  witness book, enforces the agent's ceilings and falls back with    */
/*  grace — one provider's outage never disables the Mirror.           */
/*                                                                     */
/*  THE EXECUTOR LAW: the provider bridge (zai-client.ts) remains the  */
/*  ONLY executor and the ONLY witness — its chains, retries and       */
/*  slow-sky racing are the house's oldest weather laws, and its own   */
/*  hooks write the truthful provider/model/tokens into the witness    */
/*  book and the skies' health. Nothing here duplicates them.          */
/* ------------------------------------------------------------------ */

import { ensureContext, runWithContext, type RequestContext } from "@/lib/me/context";
import { resolveLadder, TASK_ROUTES, skyAvailable, type TaskKind } from "@/lib/me/registry";

/* the meter's window into the book — re-exported so the metered door
   reads the witness without importing the context module twice */
export { witnessedUse } from "@/lib/me/context";

/** The chat-call shape every route already speaks (the bridge's own). */
export interface ChatParams {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  max_tokens?: number;
  temperature?: number;
  thinking?: unknown;
  model?: string;
  [key: string]: unknown;
}

export interface ChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
}

export interface OrchestrateOptions {
  /** Correlation id from the middleware, when the caller has one. */
  requestId?: string;
  /** The metered operation label (witness book). */
  operation?: string;
  /** The visitor's tongue — Albanian reroutes the ladder. */
  language?: string;
  /** Task-appropriate ceiling. */
  maxTokens?: number;
  temperature?: number;
  thinking?: unknown;
  /** Explicit model override (the registry's default stands otherwise). */
  model?: string;
}

/** The bridge client type — imported lazily so this module stays
 *  import-light for surfaces that only want the registry. */
type BridgeClient = {
  chat: {
    completions: {
      create: (params: ChatParams) => Promise<ChatCompletion>;
    };
  };
};

async function bridgeFor(task: TaskKind, language?: string): Promise<BridgeClient> {
  const mod = await import("@/lib/zai-client");
  if (task === "chat-sq" || (language ?? "en").toLowerCase() === "sq") {
    return (await mod.default.createPreferred(language)) as unknown as BridgeClient;
  }
  return (await mod.default.create()) as unknown as BridgeClient;
}

/**
 * Orchestrate one chat ask through M.E.
 *
 * - Opens the witness book for this async chain (the meter reads it
 *   after the answer is served and lays a truthful UsageEvent).
 * - Names the task's leading sky from the health-aware ladder (for
 *   the book and for policy) — the bridge's own chains do the real
 *   walking and the real witnessing.
 */
export async function orchestrateChat(
  task: TaskKind,
  params: ChatParams,
  opts: OrchestrateOptions = {}
): Promise<ChatCompletion> {
  const route = TASK_ROUTES[task];
  const ctx: RequestContext = {
    requestId: opts.requestId ?? crypto.randomUUID(),
    operation: opts.operation ?? route.label,
    startedAt: Date.now(),
    uses: [],
  };

  return runWithContext(ctx, async () => {
    const ladder = resolveLadder(task, opts.language);
    const leading = ladder[0] ?? null;
    const client = await bridgeFor(task, opts.language);
    const completion = await client.chat.completions.create({
      messages: params.messages,
      max_tokens: opts.maxTokens ?? params.max_tokens,
      temperature: opts.temperature ?? params.temperature,
      thinking: opts.thinking ?? params.thinking,
      model: opts.model ?? params.model,
    });
    void leading; /* named for the book; the bridge writes the truth */
    return completion;
  });
}

/** Open (or join) the witness book for a block of work — the form the
 *  metered doors use so every sky inside the block is witnessed. */
export async function withOrchestration<T>(
  operation: string,
  fn: () => Promise<T>,
  seed?: { requestId?: string }
): Promise<T> {
  const ctx = ensureContext({ operation, requestId: seed?.requestId });
  return runWithContext(ctx, fn);
}

/** Is at least one sky standing for a task? (The capability catalog
 *  and the command center ask this; the free conversation never
 *  does — the bridge is always the last wall of grace.) */
export function taskAvailable(kind: TaskKind): boolean {
  return TASK_ROUTES[kind].ladder.some(skyAvailable);
}
