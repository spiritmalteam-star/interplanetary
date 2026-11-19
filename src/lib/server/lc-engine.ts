import { NextResponse } from "next/server";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

export type LcLength = "preview" | "full" | "loop";

/* ------------------------- the limits ------------------------- */

export const LC_LIMITS = {
  previewPerKeeperPerDay: intEnv("LC_DAILY_PREVIEW", 15),
  fullPerKeeperPerDay: intEnv("LC_DAILY_FULL", 4),
  loopPerKeeperPerDay: intEnv("LC_DAILY_LOOP", 2),
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

/** The day's allowance — previews, full songs and the endless loops
    spend different doors. */
export function guardDailyAllowance(
  keeperId: string,
  length: LcLength
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
  const door = length === "full" ? "full" : length === "loop" ? "loop" : "preview";
  const allowance =
    door === "full"
      ? LC_LIMITS.fullPerKeeperPerDay
      : door === "loop"
        ? LC_LIMITS.loopPerKeeperPerDay
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
          : door === "loop"
            ? "Today's endless journeys are spent — a long weaving asks much of the engine, so the chamber holds its allowance kind and firm. Return tomorrow."
            : "Today's previews are spent — the chamber holds its allowance kind and firm. Return tomorrow, or ask for a full song.",
    };
  }
  return { ok: true };
}

export function beginWeave(
  keeperId: string,
  fingerprint: string,
  length: LcLength,
  countUsage = true
): void {
  rollDay();
  inFlight.set(keeperId, Date.now());
  recentAsks.set(keeperId, hashStr(fingerprint));
  recentAskTimes.set(keeperId, Date.now());
  if (!countUsage) return; // a continuation part rides the journey's own count
  globalDailyCount += 1;
  const door = length === "full" ? "full" : length === "loop" ? "loop" : "preview";
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

/* --------------------- the endless journey -----------------------
   THE LOOP SESSION — one long piece woven in parts. Each part is a
   real engine weave, laid to the instance's own temporary shelf as
   its own file; when the final part lands, the parts are joined with
   soft crossings (ffmpeg) into one seamless journey whose end flows
   back into its beginning. The visitor's own parts ride free after
   the first — the journey was weighed once when it began.
   THE HONESTY LAW: every part is real progress, never a percentage
   invented; the session rests after 45 quiet minutes and its shelf
   is swept. */

export const LOOP_PARTS = 6; // six weavings ≈ thirty minutes of sound

/* THE SONG'S TWO MOVEMENTS — the full song rides the journey's loom
   too: two real weavings joined into one piece, so the song breathes
   past the two-minute wall (each movement carries minutes of its own
   and the join makes one continuous composition). */
export const FULL_SONG_PARTS = 2;

export interface LoopSession {
  token: string;
  keeperId: string;
  total: number;
  mimeType: string;
  dir: string;
  parts: string[]; // file paths, one per landed part
  createdAt: number;
}

const loopSessions = new Map<string, LoopSession>();
const LOOP_SESSION_TTL = 45 * 60 * 1000;
const LOOP_SESSION_MAX = 24;

export interface LoopFinal {
  token: string;
  keeperId: string;
  file: string;
  durationSec: number;
  seamless: boolean;
  createdAt: number;
}

const loopFinals = new Map<string, LoopFinal>();
const LOOP_FINAL_TTL = 25 * 60 * 1000;
const LOOP_FINAL_MAX = 2;

function sweepLoops(): void {
  const now = Date.now();
  for (const [token, s] of loopSessions) {
    if (now - s.createdAt > LOOP_SESSION_TTL) {
      void rm(s.dir, { recursive: true, force: true }).catch(() => undefined);
      loopSessions.delete(token);
    }
  }
  for (const [token, f] of loopFinals) {
    if (now - f.createdAt > LOOP_FINAL_TTL) {
      void rm(f.file, { force: true }).catch(() => undefined);
      loopFinals.delete(token);
    }
  }
}

export function createLoopSession(
  keeperId: string,
  total: number,
  mimeType: string
): LoopSession {
  sweepLoops();
  /* the oldest journey rests when the house holds too many */
  while (loopSessions.size >= LOOP_SESSION_MAX) {
    const oldest = loopSessions.keys().next().value as string | undefined;
    if (!oldest) break;
    const s = loopSessions.get(oldest);
    if (s) void rm(s.dir, { recursive: true, force: true }).catch(() => undefined);
    loopSessions.delete(oldest);
  }
  const token = `lp${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const session: LoopSession = {
    token,
    keeperId,
    total,
    mimeType,
    dir: "",
    parts: [],
    createdAt: Date.now(),
  };
  loopSessions.set(token, session);
  /* the shelf is prepared lazily by the caller (async mkdir) */
  return session;
}

export async function prepareLoopShelf(session: LoopSession): Promise<void> {
  if (session.dir) return;
  session.dir = await mkdtemp(join(tmpdir(), "lc-loop-"));
}

export function getLoopSession(token: string): LoopSession | null {
  sweepLoops();
  const s = loopSessions.get(token);
  if (!s) return null;
  return s;
}

export function loopSessionOwned(session: LoopSession, keeperId: string): boolean {
  return session.keeperId === keeperId;
}

export async function addLoopPart(session: LoopSession, bytes: Buffer): Promise<string> {
  const file = join(session.dir, `part-${String(session.parts.length + 1).padStart(2, "0")}.mp3`);
  await writeFile(file, bytes);
  session.parts.push(file);
  return file;
}

export function dropLoopSession(token: string): void {
  const s = loopSessions.get(token);
  if (s?.dir) void rm(s.dir, { recursive: true, force: true }).catch(() => undefined);
  loopSessions.delete(token);
}

export function putLoopFinal(
  token: string,
  keeperId: string,
  file: string,
  durationSec: number,
  seamless: boolean
): void {
  sweepLoops();
  while (loopFinals.size >= LOOP_FINAL_MAX) {
    const oldest = loopFinals.keys().next().value as string | undefined;
    if (!oldest) break;
    const f = loopFinals.get(oldest);
    if (f) void rm(f.file, { force: true }).catch(() => undefined);
    loopFinals.delete(oldest);
  }
  loopFinals.set(token, { token, keeperId, file, durationSec, seamless, createdAt: Date.now() });
}

export function getLoopFinal(token: string, keeperId: string): LoopFinal | null {
  sweepLoops();
  const f = loopFinals.get(token);
  if (!f || f.keeperId !== keeperId) return null;
  if (!existsSync(f.file)) {
    loopFinals.delete(token);
    return null;
  }
  return f;
}

export function readLoopFinalFile(f: LoopFinal): Promise<Buffer> {
  return readFile(f.file);
}

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
