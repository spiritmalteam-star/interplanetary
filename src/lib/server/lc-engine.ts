import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  THE CHAMBER'S LOOM HOUSE — the one place the sound engine's        */
/*  working state is kept: who is weaving, what was asked twice, how   */
/*  much the day has spent, and what the engine last said. The key     */
/*  itself never rests here — only the shape of the truth around it.   */
/*                                                                     */
/*  THE HONESTY LAW: these counters live in the server's own memory.   */
/*  On a serverless sky each warm instance carries its own count, so   */
/*  the brakes are per-instance — a real brake, plainly described,     */
/*  not a promise of a global ledger the house does not hold.          */
/* ------------------------------------------------------------------ */

/* ------------------------- the brakes ------------------------- */

/** One weave at a time per keeper — the chamber holds a single loom. */
const inFlight = new Map<string, number>();

/** The same ask, twice within a breath, is not woven twice. */
const recentAsks = new Map<string, number>();
const recentAskTimes = new Map<string, number>();

/** The day's spending, per keeper: model door → count. */
const dailyUsage = new Map<string, Map<string, number>>();
/** The whole house's day, every door together. */
let globalDailyCount = 0;
let globalDayKey = todayKey();

/** The last words the engine said, for the keeper's own diagnostic. */
let lastSuccess: { model: string; at: number } | null = null;
let lastError: { code: string; message: string; at: number } | null = null;

/* ------------------------- the limits ------------------------- */

export const LC_LIMITS = {
  previewPerKeeperPerDay: intEnv("LC_DAILY_PREVIEW", 15),
  fullPerKeeperPerDay: intEnv("LC_DAILY_FULL", 4),
  globalPerDay: intEnv("LC_DAILY_GLOBAL", 400),
};

function intEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function rollDay(): void {
  const key = todayKey();
  if (key !== globalDayKey) {
    globalDayKey = key;
    globalDailyCount = 0;
    dailyUsage.clear();
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* ------------------------- the verdicts ------------------------- */

export type LcWeaveVerdict =
  | { ok: true }
  | { ok: false; status: number; error: string; code: string };

/** The loom's own law — one weave at a time per keeper. */
export function guardBusy(keeperId: string): LcWeaveVerdict {
  const startedAt = inFlight.get(keeperId);
  if (startedAt && Date.now() - startedAt < 5.5 * 60 * 1000) {
    return {
      ok: false,
      status: 429,
      code: "busy",
      error:
        "The chamber is already weaving a transmission for you — one sound at a time. Let the first one land.",
    };
  }
  return { ok: true };
}

/** The same ask, twice within one breath, is not woven twice. */
export function guardDuplicate(
  keeperId: string,
  fingerprint: string
): LcWeaveVerdict {
  const lastAsk = recentAsks.get(keeperId);
  if (
    lastAsk !== undefined &&
    lastAsk === hashStr(fingerprint) &&
    Date.now() - (recentAskTimes.get(keeperId) ?? 0) < 45_000
  ) {
    return {
      ok: false,
      status: 429,
      code: "duplicate",
      error:
        "The same transmission was just asked of the chamber — the Mirror will not weave it twice in one breath.",
    };
  }
  return { ok: true };
}

/** The day's allowance — previews and full songs spend different doors. */
export function guardDailyAllowance(
  keeperId: string,
  length: "preview" | "full"
): LcWeaveVerdict {
  rollDay();
  if (globalDailyCount >= LC_LIMITS.globalPerDay) {
    return {
      ok: false,
      status: 429,
      code: "quota",
      error:
        "The chamber's sky allowance rests for now — today's quota for new sounds is spent. Breathe, and return tomorrow.",
    };
  }
  const door = length === "full" ? "full" : "preview";
  const allowance =
    door === "full"
      ? LC_LIMITS.fullPerKeeperPerDay
      : LC_LIMITS.previewPerKeeperPerDay;
  const spent = dailyUsage.get(keeperId)?.get(door) ?? 0;
  if (spent >= allowance) {
    return {
      ok: false,
      status: 429,
      code: "quota",
      error:
        door === "full"
          ? "Today's full songs are spent — the chamber wove its allowance for you. The previews still sound; the full loom turns again tomorrow."
          : "Today's previews are spent — the chamber holds its allowance kind and firm. Return tomorrow, or ask for a full song.",
    };
  }
  return { ok: true };
}

export function beginWeave(
  keeperId: string,
  fingerprint: string,
  length: "preview" | "full"
): void {
  rollDay();
  inFlight.set(keeperId, Date.now());
  recentAsks.set(keeperId, hashStr(fingerprint));
  recentAskTimes.set(keeperId, Date.now());
  globalDailyCount += 1;
  const door = length === "full" ? "full" : "preview";
  const mine = dailyUsage.get(keeperId) ?? new Map<string, number>();
  mine.set(door, (mine.get(door) ?? 0) + 1);
  dailyUsage.set(keeperId, mine);
}

export function endWeave(keeperId: string): void {
  inFlight.delete(keeperId);
}

export function askFingerprint(parts: unknown[]): string {
  return JSON.stringify(parts);
}

/** A standard 429 verdict response, shaped like the chamber's own voice. */
export function verdictResponse(
  verdict: Extract<LcWeaveVerdict, { ok: false }>,
  extra: object = {}
): NextResponse {
  return NextResponse.json(
    { ...extra, error: verdict.error, code: verdict.code },
    { status: verdict.status }
  );
}

/* --------------------- the keeper's diagnostic --------------------- */

export function noteLcSuccess(model: string): void {
  lastSuccess = { model, at: Date.now() };
  lastError = null;
}

export function noteLcError(code: string, message: string): void {
  /* the message is already the chamber's own words — nothing raw rides here */
  lastError = { code, message: String(message).slice(0, 240), at: Date.now() };
}

export function getLcEngineStatus() {
  rollDay();
  return {
    limits: LC_LIMITS,
    weavingNow: inFlight.size,
    globalToday: globalDailyCount,
    lastSuccess,
    lastError,
    instanceNote:
      "Counters live in each warm server instance's own memory — honest brakes, not a global ledger.",
  };
}
