import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE PASSAGE-KEEPERS — access, quotas and the cosmic library.       */
/*                                                                     */
/*  Security & privacy law of the Laboratory (the gentle guide):       */
/*  - passwords are stored ONLY as scrypt hashes (random salt,         */
/*    timing-safe comparison) — never in plain text, never logged;     */
/*  - sessions are signed httpOnly cookies (HMAC-SHA256), same-site;   */
/*  - anonymous visitors are remembered only by a random UUID cookie   */
/*    that carries no personal information at all;                     */
/*  - the cosmic library belongs to its one owner: every entry is      */
/*    written under the visitor's own id and read back only to them;   */
/*  - error messages never leak whether an email exists.               */
/*  The system grows gently and serves the people who trust it.        */
/* ------------------------------------------------------------------ */

export const SESSION_COOKIE = "mirror_session";
export const ANON_COOKIE = "mirror_anon";
const SESSION_DAYS = 30;

export type Tier = "crystalline" | "light";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  tier: Tier;
}

/* ---------------------------- the secret --------------------------- */

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "mirror-entity-laboratory-passage-secret"
  );
}

/* --------------------------- passwords ----------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s2:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "s2" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/* ---------------------------- sessions ----------------------------- */

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = b64url(JSON.stringify({ uid: userId, exp }));
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { uid?: string; exp?: number };
    if (!json.uid || !json.exp || Date.now() > json.exp) return null;
    return json.uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const uid = readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, tier: user.tier === "light" ? "light" : "crystalline" };
}

/* --------------------------- anonymous id -------------------------- */

/** Reads the anonymous id (a bare random UUID — no personal data). */
export function readAnonId(req: NextRequest): string | null {
  const raw = req.cookies.get(ANON_COOKIE)?.value;
  return raw && /^[\w-]{8,64}$/.test(raw) ? raw : null;
}

/** Attaches a fresh anonymous id to the response when none existed. */
export function giveAnonId(res: NextResponse): string {
  const id = randomUUID();
  res.cookies.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return id;
}

/* ------------------------------ quotas ----------------------------- */

export type Sector = "main" | "manifest" | "dreambook" | "quantum" | "evolvemed";

export const DAILY_LIMITS = {
  anon: 10, // per pool: the main scopes AND the manifest each get 10/day
  crystalline: 20, // one shared daily pool across the whole portal
  light: Number.POSITIVE_INFINITY, // the Light passage — boundless
} as const;

const WORLD_SECTORS: Sector[] = ["dreambook", "quantum", "evolvemed"];

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface GateInfo {
  user: SessionUser | null;
  anonId: string | null;
  used: number;
  limit: number;
  remaining: number;
}

async function usedToday(key: string, sector: Sector | "all"): Promise<number> {
  const rows = await db.usage.findMany({
    where: { key, day: todayUTC(), ...(sector === "all" ? {} : { sector }) },
  });
  return rows.reduce((n, r) => n + r.count, 0);
}

/**
 * The gate of the threshold. Returns "ok" when the transmission may
 * pass, "auth" when a world needs the Crystalline key, "quota" when
 * today's limit is reached (Light lifts it).
 */
export async function checkGate(
  req: NextRequest,
  sector: Sector
): Promise<
  | { status: "ok"; gate: GateInfo & { key: string } }
  | { status: "auth"; gate: GateInfo }
  | { status: "quota"; gate: GateInfo }
> {
  const user = await getSessionUser(req);
  const anonId = readAnonId(req);

  if (!user) {
    if (WORLD_SECTORS.includes(sector)) {
      return { status: "auth", gate: { user, anonId, used: 0, limit: 0, remaining: 0 } };
    }
    const key = anonId ? `anon:${anonId}` : "";
    const used = key ? await usedToday(key, sector) : 0;
    const limit = DAILY_LIMITS.anon;
    if (used >= limit) {
      return { status: "quota", gate: { user, anonId, used, limit, remaining: 0 } };
    }
    return { status: "ok", gate: { user, anonId, used, limit, remaining: limit - used, key } };
  }

  // signed-in — the Crystalline (or Light) passage
  const key = `user:${user.id}`;
  const limit = user.tier === "light" ? DAILY_LIMITS.light : DAILY_LIMITS.crystalline;
  const used = await usedToday(key, "all");
  if (used >= limit) {
    return { status: "quota", gate: { user, anonId, used, limit, remaining: 0 } };
  }
  return { status: "ok", gate: { user, anonId, used, limit, remaining: limit - used, key } };
}

/** Records one passing transmission (after it succeeded). */
export async function recordUsage(key: string, sector: Sector): Promise<void> {
  if (!key) return;
  const day = todayUTC();
  try {
    await db.usage.upsert({
      where: { key_day_sector: { key, day, sector } },
      create: { key, day, sector, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (err) {
    console.error("[access] usage record failed:", err);
  }
}

/* ------------------------- gate responses -------------------------- */

export function gateError(
  status: "auth" | "quota",
  gate: GateInfo
): NextResponse {
  if (status === "auth") {
    return NextResponse.json(
      {
        code: "auth",
        error:
          "This world opens with the Crystalline key — sign in or create your passage, and it receives you.",
      },
      { status: 401 }
    );
  }
  const light = gate.user?.tier !== "light";
  return NextResponse.json(
    {
      code: "quota",
      used: gate.used,
      limit: gate.limit,
      error: light
        ? "Today's transmissions are complete — the Light passage lifts every limit."
        : "Today's transmissions are complete. Rest, and return with the morning.",
    },
    { status: 402 }
  );
}

/* --------------------------- the library --------------------------- */

export async function saveLibrary(
  userId: string | null | undefined,
  sector: "observatory" | "manifest" | "dreambook" | "quantum" | "evolvemed",
  title: string,
  excerpt: string,
  content: unknown
): Promise<void> {
  if (!userId) return;
  try {
    await db.libraryEntry.create({
      data: {
        userId,
        sector,
        title: title.slice(0, 140) || "A transmission",
        excerpt: excerpt.slice(0, 280),
        content: JSON.stringify(content).slice(0, 60000),
      },
    });
  } catch (err) {
    console.error("[access] library save failed:", err);
  }
}

/* ------------------------- login rate limit ------------------------ */

const attempts = new Map<string, { count: number; resetAt: number }>();

export function loginAttemptsExceeded(email: string): boolean {
  const now = Date.now();
  const entry = attempts.get(email);
  if (!entry || now > entry.resetAt) {
    attempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 8;
}
