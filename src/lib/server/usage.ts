import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE WITNESS — every AI operation is recorded server-side.          */
/*                                                                     */
/*  UsageEvent rows carry who, what, which provider, how many tokens   */
/*  (when the provider tells), how long it took and whether it         */
/*  succeeded. Clients never declare their own usage — the server      */
/*  measures. Errors are logged without secrets, never without shape.  */
/* ------------------------------------------------------------------ */

export interface UsageInput {
  userId: string;
  workspaceId?: string | null;
  operation: string;
  provider?: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  creditsCharged?: number;
  latencyMs?: number | null;
  success: boolean;
  error?: string | null;
}

function briefError(message: string | undefined | null): string | null {
  if (!message) return null;
  /* keep the shape, drop any payload that could carry a secret */
  return message.replace(/[A-Za-z0-9_\-]{24,}/g, "[redacted]").slice(0, 200);
}

export async function recordUsage(input: UsageInput): Promise<void> {
  if (input.userId.startsWith("stateless:")) return; // no database, no witness
  try {
    await db.usageEvent.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId ?? null,
        operation: input.operation.slice(0, 60),
        provider: (input.provider ?? "none").slice(0, 40),
        model: input.model?.slice(0, 80) ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        creditsCharged: Math.max(0, Math.round(input.creditsCharged ?? 0)),
        latencyMs: input.latencyMs ?? null,
        success: input.success,
        error: briefError(input.error),
      },
    });
  } catch (err) {
    /* a missing witness never breaks a working world */
    console.error("[usage] record failed:", err instanceof Error ? err.message : err);
  }
}

/** Rough server-side token estimate when the provider stays silent
    (~4 chars per token for the latin sky, closer for CJK). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
