import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  THE PASSAGE-KEEPERS — identity and the cosmic library.             */
/*                                                                     */
/*  THE FREE LAW: everything in the laboratory is free. There are      */
/*  no tiers, no keys, no daily thresholds — every world opens to      */
/*  every visitor.                                                     */
/*                                                                     */
/*  Security & privacy law of the Laboratory (the gentle guide):       */
/*  - passwords are stored ONLY as scrypt hashes (random salt,         */
/*    timing-safe comparison) — never in plain text, never logged;     */
/*  - sessions are signed httpOnly cookies (HMAC-SHA256), same-site;   */
/*  - anonymous visitors are remembered only by a random UUID cookie   */
/*    that carries no personal information at all — yet even their     */
/*    transmissions are kept in their own cosmic library, and when     */
/*    they later sign in, everything they made comes with them;        */
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
  /** True when this identity is the anonymous cookie's quiet keeper. */
  anon?: boolean;
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

/** The email-shaped key under which an anonymous visitor's library rests. */
export function anonEmail(anonId: string): string {
  return `anon:${anonId}`;
}

/* --------------------------- the visitor --------------------------- */

export interface Visitor {
  /** The signed-in account — or the anonymous cookie's quiet keeper. */
  user: SessionUser;
  anonId: string;
  /** True when the anon cookie was minted on THIS request and must be
      attached to the response (see withAnonCookie). */
  freshAnon: boolean;
}

/**
 * The free threshold. Every visitor passes — anonymous or signed in —
 * and every visitor carries an identity their cosmic library can rest on.
 * Anonymous visitors are given a User row keyed to their random cookie;
 * nothing personal is ever stored for them.
 */
export async function resolveVisitor(req: NextRequest): Promise<Visitor> {
  const signedIn = await getSessionUser(req);
  if (signedIn) {
    const anonId = readAnonId(req) ?? "";
    return { user: signedIn, anonId, freshAnon: false };
  }

  const existing = readAnonId(req);
  const anonId = existing ?? randomUUID();
  const user = await db.user.upsert({
    where: { email: anonEmail(anonId) },
    create: { email: anonEmail(anonId), name: null, passwordHash: null, provider: "anon" },
    update: {},
  });
  return {
    user: { id: user.id, email: user.email, name: user.name, tier: "crystalline", anon: true },
    anonId,
    freshAnon: !existing,
  };
}

/** Attaches the freshly minted anon cookie to a response, if one is due. */
export function withAnonCookie<T extends NextResponse>(res: T, visitor: Visitor): T {
  if (visitor.freshAnon) {
    res.cookies.set(ANON_COOKIE, visitor.anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return res;
}

/**
 * When a visitor signs in (or registers), everything their anonymous
 * cookie kept — every transmission, every book — comes with them.
 */
export async function mergeAnonLibrary(anonId: string | null | undefined, userId: string): Promise<void> {
  if (!anonId) return;
  try {
    const anonUser = await db.user.findUnique({ where: { email: anonEmail(anonId) } });
    if (!anonUser || anonUser.id === userId) return;
    await db.libraryEntry.updateMany({
      where: { userId: anonUser.id },
      data: { userId },
    });
    await db.user.delete({ where: { id: anonUser.id } }).catch(() => undefined);
  } catch (err) {
    console.error("[access] anon merge failed:", err);
  }
}

/* --------------------------- the library --------------------------- */

export type LibrarySector =
  | "observatory" // the main scopes — interplanetary & healing
  | "manifest" // the Mirror OS
  | "invent" // the Forge
  | "dreambook" // the Dream Book volumes
  | "quantum" // ParticleX — the quantum world
  | "evolvemed"; // the evolutionary medical nexus

/** Lays a transmission in its sector. Returns the entry's id. */
export async function saveLibrary(
  userId: string | null | undefined,
  sector: LibrarySector,
  title: string,
  excerpt: string,
  content: unknown,
  maxLen = 60000
): Promise<string | null> {
  if (!userId) return null;
  try {
    const entry = await db.libraryEntry.create({
      data: {
        userId,
        sector,
        title: title.slice(0, 140) || "A transmission",
        excerpt: excerpt.slice(0, 280),
        content: JSON.stringify(content).slice(0, maxLen),
      },
    });
    return entry.id;
  } catch (err) {
    console.error("[access] library save failed:", err);
    return null;
  }
}

/** Keeps a saved transmission current — a book that grows, a thread that continues. */
export async function updateLibrary(
  userId: string | null | undefined,
  entryId: string | null | undefined,
  title: string,
  excerpt: string,
  content: unknown,
  maxLen = 60000
): Promise<void> {
  if (!userId || !entryId) return;
  try {
    await db.libraryEntry.update({
      where: { id: entryId },
      data: {
        title: title.slice(0, 140) || "A transmission",
        excerpt: excerpt.slice(0, 280),
        content: JSON.stringify(content).slice(0, maxLen),
      },
    });
  } catch (err) {
    console.error("[access] library update failed:", err);
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
