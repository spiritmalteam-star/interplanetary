/* ------------------------------------------------------------------ */
/*  THE HOUSE SCRIBE — structured logging with correlation ids.        */
/*                                                                     */
/*  One line of JSON per event: when, how loud, what happened, which   */
/*  request it rode. Secrets and long tokens are shaved before a       */
/*  line is laid. Nothing user-identifying is ever required in a       */
/*  field — callers pass ids, routes, latencies and error SHAPES.      */
/* ------------------------------------------------------------------ */

import { correlationId } from "@/lib/me/context";

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Shave anything that looks like a credential or an oversized token. */
function shave(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/[A-Za-z0-9_\-]{24,}/g, "[redacted]").slice(0, 300);
  }
  if (value instanceof Error) {
    return { name: value.name, message: shave(value.message) };
  }
  return value;
}

export function log(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
  try {
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      event,
      requestId: correlationId(),
    };
    if (fields) {
      for (const [k, v] of Object.entries(fields)) entry[k] = shave(v);
    }
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.info(line);
  } catch {
    /* a scribe's failure is never a door's failure */
  }
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => log("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => log("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => log("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => log("error", event, fields),
};
