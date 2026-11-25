/* ------------------------------------------------------------------ */
/*  THE SCOPE POOL SHELF — restored as a minimal stub after the dead    */
/*  session. The i18n collector reads `scopeSuggestionPools` to gather  */
/*  every data-driven suggestion key; the living per-scope pools ride   */
/*  in suggestions-pools.ts (the chat worlds) and suggestion-tree.ts    */
/*  (the canopy). Add a pool here only when a new scope needs one.      */
/* ------------------------------------------------------------------ */

export const scopeSuggestionPools: Record<string, string[]> = {};
