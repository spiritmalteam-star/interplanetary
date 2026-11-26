/* ------------------------------------------------------------------ */
/*  THE MODEL LADDER — one Z.ai sky, two rungs.                         */
/*                                                                     */
/*  The house's words ride Z.ai only (the founder's law). When the      */
/*  flagship rung is refused for a reason that is about THAT MODEL —    */
/*  no balance for it, no permission, not found, or a rate wall — the   */
/*  same sky, the same key, is asked once more on the steady rung       */
/*  (glm-4.5-flash by default), instead of falling silent. No other     */
/*  provider is ever involved.                                          */
/*                                                                     */
/*  Pure (no imports) so the rules can be unit-tested.                  */
/* ------------------------------------------------------------------ */

/** how long a refused rung rests before the flagship is tried again */
export const RUNG_REST_MS = 10 * 60 * 1000;

const MODEL_SIDE_HINTS =
  /1113|1211|1214|1220|1221|insufficient balance|no resource package|arrears|recharge|payment required|no permission|not authori[sz]ed to (?:access|use)|unknown model|model (?:does not|doesn'?t) exist|model not (?:found|exist)|not support/i;

/**
 * Was this failure about the model rung (worth trying the steady rung),
 * rather than about the request itself (a bad prompt would fail on both)?
 * `message` is the backend's own error text: "<label> chat|stream <status>: <body>".
 */
export function isModelRungRefusal(message: string): boolean {
  const m = /\b(?:chat|stream) (\d{3})\b/i.exec(message);
  const status = m ? Number(m[1]) : undefined;
  if (status === 402 || status === 403 || status === 404 || status === 429) return true;
  return MODEL_SIDE_HINTS.test(message);
}

/** The steady rung for a configured model, or undefined when there is none
    (the configured model already IS the steady rung, or the ladder is off). */
export function steadyRungFor(model: string, envValue: string | undefined): string | undefined {
  const raw = (envValue ?? "glm-4.5-flash").trim();
  if (!raw || /^(none|off|false|0)$/i.test(raw)) return undefined;
  return raw.toLowerCase() === model.toLowerCase() ? undefined : raw;
}

/** Rung memory: which models are resting, and until when (pure on `now`). */
export function isResting(resting: Map<string, number>, model: string, now: number): boolean {
  const until = resting.get(model);
  if (until === undefined) return false;
  if (until <= now) {
    resting.delete(model);
    return false;
  }
  return true;
}
