/* ------------------------------------------------------------------ */
/*  THE ORCHESTRATION CONTEXT — one request's witness book.            */
/*                                                                     */
/*  A small AsyncLocalStorage that rides every server request which    */
/*  opts in (the metered doors, the admin doors). The provider bridge  */
/*  writes each sky it touched into the book; the meter reads the book */
/*  AFTER the answer is served and lays a truthful UsageEvent — real   */
/*  provider, real model, real token counts — with ZERO route edits.   */
/*                                                                     */
/*  Everything here is server-side only. Nothing user-identifying is   */
/*  written by the bridge itself; the meter already knows the visitor. */
/* ------------------------------------------------------------------ */

import { AsyncLocalStorage } from "node:async_hooks";

/** One sky's touch on this request. */
export interface ProviderUse {
  /** Human provider label — "Z.ai", "OpenAI", "Gemini", "atelier". */
  provider: string;
  /** The model that actually served (when known). */
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  /** True when this sky's answer was refused and another was chosen. */
  superseded?: boolean;
  latencyMs?: number | null;
}

export interface RequestContext {
  /** Correlation id — assigned by the middleware, else minted here. */
  requestId: string;
  /** The metered/admin operation label, when known. */
  operation?: string;
  startedAt: number;
  /** Every sky the bridge touched, in order. The last non-superseded
   *  entry is the one that answered. */
  uses: ProviderUse[];
}

const als = new AsyncLocalStorage<RequestContext>();

/** Run `fn` inside a fresh request context (or join the existing one). */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return als.run(ctx, fn);
}

/** Ensure a context exists for the current async chain — reuses the
 *  live one when present (nested wrappers never fork the book). */
export function ensureContext(seed?: Partial<RequestContext>): RequestContext {
  const existing = als.getStore();
  if (existing) return existing;
  const ctx: RequestContext = {
    requestId: seed?.requestId ?? crypto.randomUUID(),
    operation: seed?.operation,
    startedAt: seed?.startedAt ?? Date.now(),
    uses: [],
  };
  return ctx;
}

/** The live context, when any. */
export function currentContext(): RequestContext | null {
  return als.getStore() ?? null;
}

/** The correlation id of the current request, when any. */
export function correlationId(): string | null {
  return als.getStore()?.requestId ?? null;
}

/** The bridge's pen — record one sky's touch. Safe everywhere: outside
 *  a context it is a silent no-op, never a thrown stone. */
export function noteProviderUse(use: ProviderUse): void {
  const ctx = als.getStore();
  if (!ctx) return;
  try {
    ctx.uses.push(use);
  } catch {
    /* a full book never breaks a working sky */
  }
}

/** The usage the meter should witness: the last entry that actually
 *  answered, else the first attempt. Null when no sky was touched. */
export function witnessedUse(): ProviderUse | null {
  const ctx = als.getStore();
  if (!ctx || ctx.uses.length === 0) return null;
  const answered = [...ctx.uses].reverse().find((u) => !u.superseded);
  return answered ?? ctx.uses[ctx.uses.length - 1];
}
