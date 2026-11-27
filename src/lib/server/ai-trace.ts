import { AsyncLocalStorage } from "async_hooks";

/* ------------------------------------------------------------------ */
/*  THE AI WITNESS'S MEMORY — which approved model served THIS request */
/*                                                                     */
/*  Directive §16: the platform must be able to identify internally    */
/*  which approved model served each request, without exposing any     */
/*  sensitive credential. The bridge (zai-client) speaks to many rungs  */
/*  (flagship, steady rung, vision) inside one door; the meter must     */
/*  know which one actually answered before it writes the witness row.  */
/*                                                                     */
/*  AsyncLocalStorage carries that fact through the request's own       */
/*  async chain — no globals, no cross-request bleed, no route edits.   */
/*  The stored facts are model NAMES only — never keys, never prose.    */
/* ------------------------------------------------------------------ */

export interface AiTraceState {
  /** every model rung that answered inside this request, in order */
  servedModels: string[];
}

const aiTraceStorage = new AsyncLocalStorage<AiTraceState>();

/** Run a handler inside its own trace scope. The meter wraps every
    metered door with this; anything the bridge notes during the door's
    life lands on the returned state object. The state is created
    BEFORE the scope opens and handed back afterwards — the store is
    only alive inside the run, but the object outlives it, so the
    meter (and its after() callbacks) can always read the final truth. */
export async function runWithAiTrace<T>(
  fn: () => Promise<T>
): Promise<{ result: T; state: AiTraceState }> {
  const state: AiTraceState = { servedModels: [] };
  const result = await aiTraceStorage.run(state, fn);
  return { result, state };
}

/** The bridge calls this the moment a rung actually answered (an ok
    response), with the model name that served it. Safe to call from
    anywhere; outside a trace scope it is a quiet no-op. */
export function noteServedModel(model: string | null | undefined): void {
  if (!model) return;
  const state = aiTraceStorage.getStore();
  if (!state) return;
  state.servedModels.push(model.slice(0, 80));
}

/** The last model that answered inside the current request — the one
    that carried the visitor's final words. `null` when no sky answered
    (a refusal, a non-AI door) — honesty, never invention. */
export function getAiServedModel(): string | null {
  const state = aiTraceStorage.getStore();
  const last = state?.servedModels[state.servedModels.length - 1];
  return last ?? null;
}

/** Every rung that answered, in order — for the structured log. */
export function getAiServedModels(): string[] {
  return aiTraceStorage.getStore()?.servedModels ?? [];
}

/** The last model noted on a trace state (null when none). */
export function lastServedModelOf(state: AiTraceState | null): string | null {
  const last = state?.servedModels[state.servedModels.length - 1];
  return last ?? null;
}
