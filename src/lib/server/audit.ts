/* ------------------------------------------------------------------ */
/*  THE AUDIT LEDGER — every privileged hand is remembered.            */
/*                                                                     */
/*  Administrative actions (grants, deductions, price changes, switch  */
/*  flips, deletions) are laid into the AuditEvent table: who, what,   */
/*  on whom, with what detail. The ledger is append-only from the      */
/*  application's side and is never exposed to non-admin surfaces.     */
/* ------------------------------------------------------------------ */

import { db } from "@/lib/db";
import { logger } from "@/lib/server/logger";

export interface AuditInput {
  actorEmail?: string | null;
  actorUserId?: string | null;
  action: string;
  target?: string | null;
  detail?: Record<string, unknown> | null;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        actorEmail: input.actorEmail ?? null,
        actorUserId: input.actorUserId ?? null,
        action: input.action.slice(0, 80),
        target: input.target?.slice(0, 200) ?? null,
        detail: (input.detail ?? undefined) as never,
      },
    });
    logger.info("audit", { action: input.action, target: input.target ?? null });
  } catch (err) {
    /* a missed audit line never breaks the hand that wrote it — but it
       cries in the log so the owner can look */
    logger.error("audit_write_failed", {
      action: input.action,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
