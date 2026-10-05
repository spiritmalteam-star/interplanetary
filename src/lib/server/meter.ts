import { NextRequest, NextResponse } from "next/server";
import { ANON_COOKIE, resolveVisitor, withAnonCookie, type Visitor } from "@/lib/server/access";
import { costOf } from "@/lib/server/costs";
import { creditsEnforced, spendCredits } from "@/lib/server/credits";
import { GATES, rateLimit } from "@/lib/server/rate-limit";
import { recordUsage } from "@/lib/server/usage";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

/* ------------------------------------------------------------------ */
/*  THE METERED DOOR — the usage engine every AI route walks through.  */
/*                                                                     */
/*  AUTHENTICATE → AUTHORIZE (rate limit by plan) → CHECK CREDITS →    */
/*  EXECUTE → RECORD USAGE → DEDUCT CREDITS.                           */
/*                                                                     */
/*  The handler stays exactly the route it was; the meter adds:        */
/*    - the visitor (signed passage or anonymous keeper)               */
/*    - the flood-gate (per plan, per identity)                        */
/*    - the witness (UsageEvent with latency & success)                */
/*    - the ledger (atomic deduction AFTER a successful answer)        */
/*                                                                     */
/*  Until CREDITS_ENFORCED=true, the ledger only witnesses — the       */
/*  laboratory stays free while the machinery proves itself.           */
/* ------------------------------------------------------------------ */

export interface MeterContext {
  visitor: Visitor;
  userId: string;
  workspaceId: string | null;
  /** Extra cost painted mid-handler (e.g. an image inside a chat). */
  chargeExtra: (cost: number, label: string) => void;
}

export type MeteredHandler = (
  req: NextRequest,
  ctx: MeterContext
) => Promise<NextResponse>;

export function meterRoute(operation: string, handler: MeteredHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const started = Date.now();
    let visitor: Visitor | null = null;
    let workspaceId: string | null = null;
    let userId = "unknown";
    let planLimit = GATES.ai.limit;
    let extraCost = 0;

    try {
      visitor = await resolveVisitor(req);
      userId = visitor.user.id;

      /* Some worlds resolve their own visitor to lay transmissions in the
         library. When the meter just minted a fresh anonymous identity,
         stamp it onto the request so every later resolution inside this
         same request finds the SAME keeper — never a second, orphaned one. */
      if (visitor.freshAnon) {
        try {
          req.cookies.set(ANON_COOKIE, visitor.anonId);
        } catch {
          /* the request object keeps its silence — the cookie still rides
             home on the response */
        }
      }

      if (!userId.startsWith("stateless:")) {
        try {
          const provisions = await ensureVisitorProvisions(userId);
          workspaceId = provisions.workspaceId;
          planLimit = Math.max(GATES.ai.limit, provisions.plan.rateLimitPerMinute);
        } catch {
          /* provisions rest when the database rests — the world stays open */
        }
      }

      /* the flood-gate: per identity, sized by plan */
      const gate = rateLimit(`ai:${userId}`, { limit: planLimit, windowMs: GATES.ai.windowMs });
      if (!gate.ok) {
        await recordUsage({
          userId,
          workspaceId,
          operation,
          provider: "none",
          success: false,
          error: "rate_limited",
          latencyMs: Date.now() - started,
        });
        return withAnonCookie(
          NextResponse.json(
            { error: "The sky needs a breath. Try again in a moment." },
            { status: 429, headers: { "retry-after": String(gate.retryAfterSec) } }
          ),
          visitor
        );
      }

      const ctx: MeterContext = {
        visitor,
        userId,
        workspaceId,
        chargeExtra: (cost) => {
          extraCost += cost;
        },
      };

      const res = await handler(req, ctx);

      /* ---------- the weighing: record & deduct after success ---------- */
      const success = res.status < 400;
      const totalCost = costOf(operation) + extraCost;
      let charged = 0;

      if (success && workspaceId && creditsEnforced()) {
        const spend = await spendCredits(workspaceId, totalCost, { operation });
        if (!spend.ok) {
          await recordUsage({
            userId,
            workspaceId,
            operation,
            provider: "none",
            success: false,
            error: "insufficient_credits",
            latencyMs: Date.now() - started,
          });
          return withAnonCookie(
            NextResponse.json(
              {
                error:
                  "The credits for this passage have run dry. Renewal comes with the new moon — or bring more light from the account page.",
                code: "insufficient_credits",
                balance: spend.balance,
                required: spend.required,
              },
              { status: 402 }
            ),
            visitor
          );
        }
        charged = totalCost;
      }

      await recordUsage({
        userId,
        workspaceId,
        operation,
        provider: "none",
        success,
        error: success ? null : `http_${res.status}`,
        creditsCharged: charged,
        latencyMs: Date.now() - started,
      });

      return withAnonCookie(res, visitor);
    } catch (err) {
      /* the handler itself fell — the meter keeps the door standing */
      console.error(`[meter:${operation}] handler failed:`, err);
      if (visitor) {
        await recordUsage({
          userId,
          workspaceId,
          operation,
          provider: "none",
          success: false,
          error: err instanceof Error ? err.message : "handler_error",
          latencyMs: Date.now() - started,
        }).catch(() => undefined);
      }
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  };
}
