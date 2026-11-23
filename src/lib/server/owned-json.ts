/* ------------------------------------------------------------------ */
/*  OWNED JSON — pure helpers (no imports) for rows that carry their   */
/*  owner inside their existing JSON text, so no schema change is      */
/*  needed. Used by lib/server/creation-guard.ts.                      */
/* ------------------------------------------------------------------ */

export const OWNER_KEY = "__owner";
const WRAP_KEY = "__wrapped";

/** Wrap any JSON-able value so it carries its owner. Objects keep their
    own shape (plus `__owner`); anything else is wrapped and unwrapped. */
export function packOwned(value: unknown, ownerId: string): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify({ ...(value as Record<string, unknown>), [OWNER_KEY]: ownerId });
  }
  return JSON.stringify({ [WRAP_KEY]: value ?? null, [OWNER_KEY]: ownerId });
}

/** Read an owned row's text: the value without the owner key, and the owner. */
export function unpackOwned(text: string | null | undefined): { value: unknown; owner: string | null } {
  if (!text) return { value: null, owner: null };
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const { [OWNER_KEY]: owner, [WRAP_KEY]: wrapped, ...rest } = parsed as Record<string, unknown>;
      const hasWrap = Object.prototype.hasOwnProperty.call(parsed, WRAP_KEY);
      return {
        value: hasWrap ? wrapped : rest,
        owner: typeof owner === "string" ? owner : null,
      };
    }
    return { value: parsed, owner: null };
  } catch {
    return { value: null, owner: null };
  }
}

/** Bound a JSON payload's stored size (the ledger is not a file store). */
export function boundedJson(value: unknown, maxChars: number): string | null {
  try {
    const text = JSON.stringify(value);
    return text.length <= maxChars ? text : null;
  } catch {
    return null;
  }
}
