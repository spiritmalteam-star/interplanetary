import { NextRequest, NextResponse } from "next/server";
import { ANON_COOKIE, resolveVisitor, withAnonCookie, type Visitor } from "@/lib/server/access";
import { costOf } from "@/lib/server/costs";
import { creditsEnforced, spendCredits } from "@/lib/server/credits";
import { GATES, rateLimit } from "@/lib/server/rate-limit";
import { recordUsage } from "@/lib/server/usage";
import {
  WALLET_COSTS,
  WALLET_OPERATIONS,
  ensureWallet,
  refundWalletCredits,
  spendWalletCredits,
  walletEnforced,
} from "@/lib/server/wallet";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

/* ------------------------------------------------------------------ */
/*  THE METERED DOOR — the usage engine every AI route walks through.  */
/*                                                                     */
/*  AUTHENTICATE → AUTHORIZE (rate limit by plan) → WEIGH THE WALLET → */
/*  EXECUTE → RECORD USAGE → (legacy ledger when CREDITS_ENFORCED).    */
/*                                                                     */
/*  The handler stays exactly the route it was; the meter adds:        */
/*    - the visitor (signed passage or anonymous keeper)               */
/*    - the flood-gate (per plan, per identity)                        */
/*    - the wallet's weigh (pre-execution, the five gated doors: an    */
/*      empty purse is answered 402 at once; a stumbling door refunds) */
/*    - the witness (UsageEvent with latency & success)                */
/*    - the legacy ledger (atomic deduction AFTER a successful answer, */
/*      only while CREDITS_ENFORCED=true)                              */
/*                                                                     */
/*  The wallet's law stands by default (WALLET_ENFORCED=false rests    */
/*  it); the legacy ledger only witnesses until CREDITS_ENFORCED=true. */
/* ------------------------------------------------------------------ */

export interface MeterContext {
  visitor: Visitor;
  userId: string;
  workspaceId: string | null;
  /** The ledger row of the pre-execution wallet draw — a stumbling
      door gives its light back through it. Null when not weighed. */
  walletLedgerId: string | null;
  /** Extra cost painted mid-handler (e.g. an image inside a chat). */
  chargeExtra: (cost: number, label: string) => void;
}

export type MeteredHandler = (
  req: NextRequest,
  ctx: MeterContext
) => Promise<Response>;

export function meterRoute(operation: string, handler: MeteredHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const started = Date.now();
    let visitor: Visitor | null = null;
    let workspaceId: string | null = null;
    let userId = "unknown";
    let planLimit = GATES.ai.limit;
    let extraCost = 0;
    let walletLedgerId: string | null = null;
    let walletSpent = 0;

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
        walletLedgerId: null,
        chargeExtra: (cost) => {
          extraCost += cost;
        },
      };

      /* ---------- the wallet's weigh — BEFORE the door serves ----------
         The five gated doors (chat, akashic, art x, light codes, dream
         book) draw their price from the visitor's own wallet first: an
         empty purse is answered at once with 402 INSUFFICIENT_CREDITS
         and the work is never begun on light that is not there. When
         the door itself stumbles, the exact draw is refunded. */
      const walletAction = WALLET_OPERATIONS[operation];
      const walletCost = walletAction ? WALLET_COSTS[walletAction] : undefined;
      if (walletAction && walletCost && walletEnforced() && !userId.startsWith("stateless:")) {
        try {
          const snapshot = await ensureWallet(userId);
          if (snapshot.total < walletCost) {
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
                  error: "INSUFFICIENT_CREDITS",
                  required: walletCost,
                  current: snapshot.total,
                  planTier: snapshot.planTier,
                  actionType: walletAction,
                },
                { status: 402 }
              ),
              visitor
            );
          }
          const draw = await spendWalletCredits(userId, walletAction, {
            cost: walletCost,
            description: `The ${operation} door — weighed before serving`,
          });
          if (!draw.ok) {
            return withAnonCookie(
              NextResponse.json(
                {
                  error: "INSUFFICIENT_CREDITS",
                  required: walletCost,
                  current: draw.total,
                  planTier: snapshot.planTier,
                  actionType: walletAction,
                },
                { status: 402 }
              ),
              visitor
            );
          }
          walletLedgerId = draw.ledgerId ?? null;
          ctx.walletLedgerId = walletLedgerId;
          walletSpent = walletCost;
        } catch (err) {
          /* the wallet rests (database unreachable) — the door stays
             open rather than locking a visitor out of a resting vault */
          console.error(
            `[meter:${operation}] wallet weigh rested:`,
            err instanceof Error ? err.message : err
          );
        }
      }

      const res = await handler(req, ctx);

      /* a stumbling door gives the light back — any 4xx/5xx refunds */
      if (walletLedgerId && res.status >= 400) {
        void refundWalletCredits(userId, walletLedgerId);
        walletSpent = 0;
        walletLedgerId = null;
      }

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
        creditsCharged: charged + walletSpent,
        latencyMs: Date.now() - started,
      });

      /* plain Responses (the streaming SSE lines) are wrapped so the
         anonymous cookie can still ride home on them */
      const out =
        res instanceof NextResponse
          ? res
          : new NextResponse(res.body, {
              status: res.status,
              headers: res.headers,
            });
      return withAnonCookie(out, visitor);
    } catch (err) {
      /* the handler itself fell — the meter keeps the door standing,
         and the wallet's pre-execution draw goes back to its owner */
      console.error(`[meter:${operation}] handler failed:`, err);
      if (walletLedgerId) {
        void refundWalletCredits(userId, walletLedgerId).catch(() => undefined);
      }
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
