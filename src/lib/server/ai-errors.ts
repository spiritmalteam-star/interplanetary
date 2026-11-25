/* ------------------------------------------------------------------ */
/*  THE HONEST FAILURE — classify why an intelligence call failed,     */
/*  without ever exposing a key, a header, a prompt or a provider body. */
/*                                                                     */
/*  Pure (no imports) so it can be unit-tested. The route turns a      */
/*  classification into a stable `code` the interface can act on        */
/*  (retry, wait, tell the keeper) instead of one generic sentence.     */
/* ------------------------------------------------------------------ */

export type AiFailureCode =
  | "AI_NOT_CONFIGURED"
  | "AI_AUTH"
  | "AI_RATE_LIMITED"
  | "AI_QUOTA"
  | "AI_TIMEOUT"
  | "AI_UNAVAILABLE"
  | "AI_BAD_RESPONSE"
  | "AI_INTERNAL";

export interface AiFailure {
  code: AiFailureCode;
  retryable: boolean;
  /** the upstream HTTP status when one was reported (a number, never a body) */
  upstreamStatus?: number;
}

export function classifyAiError(err: unknown): AiFailure {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const m = /\bchat (\d{3})\b/i.exec(msg) ?? /\b(?:status|http)[ :]*(\d{3})\b/i.exec(msg);
  const status = m ? Number(m[1]) : undefined;

  if (/no ai provider is configured/i.test(msg)) return { code: "AI_NOT_CONFIGURED", retryable: false };
  if (/1113|insufficient balance|no resource package|recharge|arrears|quota|insufficient_credits|energy_exhausted/i.test(msg))
    return { code: "AI_QUOTA", retryable: false, upstreamStatus: status };
  /* the sky's own purse — 402 is the payment wall: the account stands
     but carries no credits. Honest code, not a generic bad response. */
  if (status === 402 || /payment required/i.test(msg))
    return { code: "AI_QUOTA", retryable: false, upstreamStatus: 402 };
  if (status === 401 || status === 403 || /invalid api key|unauthori[sz]ed|authentication/i.test(msg))
    return { code: "AI_AUTH", retryable: false, upstreamStatus: status };
  if (status === 429 || /rate limit|too many requests|1302|1305|concurrency/i.test(msg))
    return { code: "AI_RATE_LIMITED", retryable: true, upstreamStatus: status };
  if (name === "TimeoutError" || name === "AbortError" || /timed? ?out|aborted due to timeout/i.test(msg))
    return { code: "AI_TIMEOUT", retryable: true, upstreamStatus: status };
  if (status !== undefined && status >= 500)
    return { code: "AI_UNAVAILABLE", retryable: true, upstreamStatus: status };
  if (/fetch failed|econnreset|enotfound|etimedout|socket|network/i.test(msg))
    return { code: "AI_UNAVAILABLE", retryable: true };
  if (status !== undefined && status >= 400)
    return { code: "AI_BAD_RESPONSE", retryable: false, upstreamStatus: status };
  return { code: "AI_INTERNAL", retryable: true };
}

/* THE FIELD'S GENTLE STORM WORD — the generic breath for the storms
   that pass on their own (rate limits, timeouts, brief unavailable
   skies). The map below gives the lasting storms their own honest
   words, in the house's voice, naming no key and no provider body. */
export const AI_FAILURE_MESSAGE = "The field is momentarily quiet. Rest, then try again.";

/* THE CODE'S OWN WORD — one honest sentence per lasting storm, so the
   visitor (and the keeper) can act on the truth instead of one
   generic breath. A spent purse, a refused key, a missing sky each
   say what they are; the passing storms keep the gentle field word. */
export const AI_FAILURE_WORDS: Readonly<Record<AiFailureCode, string>> = {
  AI_NOT_CONFIGURED:
    "No sky stands above this deployment yet — the keeper must raise one before the field speaks.",
  AI_AUTH:
    "The sky's door does not know the house's key — the keeper must mend it.",
  AI_QUOTA:
    "The sky's own light is spent — the keeper must tend its purse before the field speaks again.",
  AI_RATE_LIMITED: AI_FAILURE_MESSAGE,
  AI_TIMEOUT: AI_FAILURE_MESSAGE,
  AI_UNAVAILABLE: AI_FAILURE_MESSAGE,
  AI_BAD_RESPONSE: AI_FAILURE_MESSAGE,
  AI_INTERNAL: AI_FAILURE_MESSAGE,
};

export function aiFailureMessage(code: AiFailureCode): string {
  return AI_FAILURE_WORDS[code] ?? AI_FAILURE_MESSAGE;
}
