/* ------------------------------------------------------------------ */
/*  THE SKIES' HEALTH — provider circuit breakers, in memory.          */
/*                                                                     */
/*  When a sky refuses again and again (quota storms, outages), the    */
/*  orchestrator stops knocking on its door for a cooling breath and   */
/*  hands the work to the next sky in the ladder — one provider's      */
/*  outage never disables the M.E. experience. State is per-process    */
/*  (honest for a single-region serverless fleet; each instance        */
/*  learns its own weather). Nothing here holds secrets.               */
/* ------------------------------------------------------------------ */

export interface ProviderHealth {
  /** Consecutive failures — healed to 0 by any success. */
  consecutiveFailures: number;
  /** When the breaker opened (epoch ms), or null while closed. */
  openedAt: number | null;
  lastError: string | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  totalSuccess: number;
  totalFailure: number;
  /** Rolling latency seen by the orchestrator (ewma, ms). */
  latencyEwmaMs: number | null;
}

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 60_000;

const health = new Map<string, ProviderHealth>();

function breakerOf(provider: string): ProviderHealth {
  let b = health.get(provider);
  if (!b) {
    b = {
      consecutiveFailures: 0,
      openedAt: null,
      lastError: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      totalSuccess: 0,
      totalFailure: 0,
      latencyEwmaMs: null,
    };
    health.set(provider, b);
  }
  return b;
}

/** Is a sky open for business? An open breaker cools down into a
 *  half-open state automatically (one probe allowed after cooldown). */
export function providerAvailable(provider: string): boolean {
  const b = health.get(provider);
  if (!b) return true;
  if (b.openedAt == null) return true;
  return Date.now() - b.openedAt >= COOLDOWN_MS;
}

export function recordProviderSuccess(provider: string, latencyMs?: number): void {
  const b = breakerOf(provider);
  b.consecutiveFailures = 0;
  b.openedAt = null;
  b.lastError = null;
  b.lastSuccessAt = Date.now();
  b.totalSuccess += 1;
  if (typeof latencyMs === "number" && Number.isFinite(latencyMs) && latencyMs >= 0) {
    b.latencyEwmaMs =
      b.latencyEwmaMs == null ? latencyMs : Math.round(b.latencyEwmaMs * 0.8 + latencyMs * 0.2);
  }
}

export function recordProviderFailure(provider: string, error?: string): void {
  const b = breakerOf(provider);
  b.consecutiveFailures += 1;
  b.totalFailure += 1;
  b.lastFailureAt = Date.now();
  if (error) b.lastError = error.slice(0, 200);
  if (b.consecutiveFailures >= FAILURE_THRESHOLD && b.openedAt == null) {
    b.openedAt = Date.now();
  }
}

/** Was this failure a refusal the breaker should respect at all?
 *  Quota/balance/model-unknown errors mean "this sky cannot serve
 *  this ask" — a long rest is honest. Pure network stumbles cool
 *  faster by nature of the retry ladder above them. */
export function failureLooksFatal(message: string): boolean {
  return /1113|insufficient balance|no resource package|recharge|quota|unauthorized|401|403|1211|unknown model/i.test(
    message
  );
}

/** The admin's glance — one row per sky the process has touched. */
export function healthSnapshot(): Record<
  string,
  {
    available: boolean;
    consecutiveFailures: number;
    breakerOpen: boolean;
    cooldownRemainingMs: number;
    lastError: string | null;
    lastSuccessAt: number | null;
    lastFailureAt: number | null;
    totalSuccess: number;
    totalFailure: number;
    latencyEwmaMs: number | null;
  }
> {
  const out: ReturnType<typeof healthSnapshot> = {};
  for (const [provider, b] of health) {
    out[provider] = {
      available: providerAvailable(provider),
      consecutiveFailures: b.consecutiveFailures,
      breakerOpen: b.openedAt != null,
      cooldownRemainingMs:
        b.openedAt == null ? 0 : Math.max(0, COOLDOWN_MS - (Date.now() - b.openedAt)),
      lastError: b.lastError,
      lastSuccessAt: b.lastSuccessAt,
      lastFailureAt: b.lastFailureAt,
      totalSuccess: b.totalSuccess,
      totalFailure: b.totalFailure,
      latencyEwmaMs: b.latencyEwmaMs,
    };
  }
  return out;
}
