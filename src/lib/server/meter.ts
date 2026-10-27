import { NextRequest, NextResponse } from "next/server";
import { ANON_COOKIE, isKeeperFree, resolveVisitor, withAnonCookie, type Visitor } from "@/lib/server/access";
import { costOf } from "@/lib/server/costs";
import { creditsEnforced, spendCredits } from "@/lib/server/credits";
import { GATES, rateLimit } from "@/lib/server/rate-limit";
import { recordUsage } from "@/lib/server/usage";
import {
  WALLET_COSTS,
  WALLET_OPERATIONS,
  ensureWallet,
  refundWalletCredits,
  servicePrices,
  spendWalletCredits,
  walletEnforced,
  type WalletActionType,
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
/*  The wallet's law RESTS by default — THE FREE LAW: the whole house  */
/*  stands free, and WALLET_ENFORCED=true in the vault stands the      */
/*  purse up again; the legacy ledger only witnesses until             */
/*  CREDITS_ENFORCED=true.                                             */
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

/* ----------------- the dynamic weigh (per-ask prices) ----------------
   Two doors carry their own per-ask price instead of a flat one:
   - the MUSIC CHAMBER: only the weave (compose) is weighed — preview
     2 · full song 5 · the endless loop 15. The brief, its refinement
     and the Lyrics Laboratory are free — the conversation of making.
     The loop's continuation parts (2..n) ride free: the journey was
     weighed once when its first part began.
   - the BOOK LOOM: only a book's birth (phase "open") is weighed —
     short 15 · extended 40. The turning of pages and every closing
     ride free: the volume was weighed when it was conjured. */
interface BodyWeigh {
  actionType: WalletActionType;
  cost: number;
  description: string;
}

async function bodyWeighFor(operation: string, req: NextRequest): Promise<BodyWeigh | null> {
  if (operation === "light_codes") {
    const b = (await req.clone().json().catch(() => null)) as {
      compose?: boolean;
      length?: string;
      loopPart?: { index?: number } | null;
    } | null;
    if (!b?.compose) return null;
    if (b.length === "loop" && b.loopPart && Number(b.loopPart.index) > 1) return null;
    const prices = await servicePrices();
    const kind =
      b.length === "loop" ? "endless loop" : b.length === "full" ? "full song" : "preview";
    const cost =
      b.length === "loop" ? prices.musicLoop : b.length === "full" ? prices.musicFull : prices.musicPreview;
    return { actionType: "LIGHT_CODES", cost, description: `the music weave — ${kind}` };
  }
  if (operation === "dream_book") {
    const b = (await req.clone().json().catch(() => null)) as {
      phase?: string;
      tale?: string;
    } | null;
    if (!b || b.phase !== "open") return null;
    const prices = await servicePrices();
    const tale = String(b.tale ?? "short");
    const extended = !(tale === "poem" || tale === "short");
    return {
      actionType: "DREAM_BOOK",
      cost: extended ? prices.bookExtended : prices.bookShort,
      description: `the book loom — ${tale} volume`,
    };
  }
  return null;
}

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
         THE ECONOMY'S LAW: the conversation is free forever. The paid
         creations draw their price from the visitor's own wallet
         first — an empty purse is answered at once with 402
         INSUFFICIENT_CREDITS, and an unsigned visitor is answered 401
         SIGN_IN_REQUIRED (no billable generation begins without a
         passage). THE ONE EXCEPTION — the verified keeper (the ADMIN
         role bound in the database, seeded by ADMIN_EMAIL at boot)
         walks through every paid door without their purse being drawn:
         their real usage is still recorded below, never billed. When a
         door stumbles, the exact draw is refunded. */
      const flatAction = WALLET_OPERATIONS[operation];
      const dynamicWeigh = await bodyWeighFor(operation, req);
      const weigh = flatAction
        ? {
            actionType: flatAction,
            cost: WALLET_COSTS[flatAction] ?? 0,
            description: `the ${operation} door — weighed before serving`,
          }
        : dynamicWeigh;
      const keeperFree = isKeeperFree(visitor.user);
      if (
        weigh &&
        weigh.cost > 0 &&
        walletEnforced() &&
        !userId.startsWith("stateless:") &&
        !keeperFree
      ) {
        if (visitor.user.email.startsWith("anon:")) {
          await recordUsage({
            userId,
            workspaceId,
            operation,
            provider: "none",
            success: false,
            error: "sign_in_required",
            latencyMs: Date.now() - started,
          });
          return withAnonCookie(
            NextResponse.json(
              {
                error: "SIGN_IN_REQUIRED",
                required: weigh.cost,
                actionType: weigh.actionType,
              },
              { status: 401 }
            ),
            visitor
          );
        } else {
          try {
            const snapshot = await ensureWallet(userId);
            if (snapshot.total < weigh.cost) {
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
                    required: weigh.cost,
                    current: snapshot.total,
                    planTier: snapshot.planTier,
                    actionType: weigh.actionType,
                  },
                  { status: 402 }
                ),
                visitor
              );
            }
            const draw = await spendWalletCredits(userId, weigh.actionType, {
              cost: weigh.cost,
              description: weigh.description,
            });
            if (!draw.ok) {
              return withAnonCookie(
                NextResponse.json(
                  {
                    error: "INSUFFICIENT_CREDITS",
                    required: weigh.cost,
                    current: draw.total,
                    planTier: snapshot.planTier,
                    actionType: weigh.actionType,
                  },
                  { status: 402 }
                ),
                visitor
              );
            }
            walletLedgerId = draw.ledgerId ?? null;
            ctx.walletLedgerId = walletLedgerId;
            walletSpent = weigh.cost;
          } catch (err) {
            /* the wallet rests (database unreachable) — the door stays
               open rather than locking a visitor out of a resting vault */
            console.error(
              `[meter:${operation}] wallet weigh rested:`,
              err instanceof Error ? err.message : err
            );
          }
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
