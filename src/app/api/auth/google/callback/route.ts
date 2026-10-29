import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mergeAnonLibrary, readAnonId, setSessionCookie } from "@/lib/server/access";
import { ensureVisitorProvisions } from "@/lib/server/workspace";
import { ensureWallet } from "@/lib/server/wallet";

/* ------------------------------------------------------------------ */
/*  GET /api/auth/google/callback — the return of the Google passage. */
/* ------------------------------------------------------------------ */

/* The origin the outside world knows — the registered redirect lands
   here. On serverless platforms the request's own origin can be a
   deployment alias; the vault's APP_URL (or Vercel's production
   domain) is the truth the Google passage was registered against. */
export function publicOrigin(requestOrigin: string): string {
  const fromEnv =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");
  return (fromEnv || requestOrigin).replace(/\/$/, "");
}

/* THE VALIDATED WAY BACK — the room the visitor left behind is kept
   and honored once, never guessed: only a same-origin path survives
   (it must begin with a single "/", carry no scheme, no host and no
   backslash escape — anything else falls back to the threshold). */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path = raw;
  try {
    path = decodeURIComponent(raw);
  } catch {
    /* an unreadable ride falls back to the raw words */
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  if (/[a-z][a-z0-9+.-]*:/i.test(path)) return null; // scheme-like
  if (path.length > 512) return null;
  return path;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = publicOrigin(req.nextUrl.origin);

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/?google=${encodeURIComponent(reason)}`);

  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const expectedState = req.cookies.get("mirror_g_state")?.value;
    if (!code || !state || !expectedState || state !== expectedState) {
      return fail("state");
    }
    if (!clientId || !clientSecret) return fail("unconfigured");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("token");
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return fail("token");

    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return fail("profile");
    const profile = (await infoRes.json()) as {
      email?: string;
      name?: string;
      verified_email?: boolean;
    };
    const email = profile.email?.toLowerCase();
    if (!email) return fail("profile");
    /* a Google passage may only take over (or link to) an existing
       passage when Google itself vouches the email is verified —
       otherwise a fresh passage is carved instead of a hijack */
    if (profile.verified_email === false) return fail("unverified");

    /* the keeper's binding rides the passage: when the platform's
       ADMIN_EMAIL arrives through Google's own verified door, the role
       is carved in the same upsert */
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const keeperArrives = email === adminEmail;

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name: profile.name?.slice(0, 60) ?? null,
        provider: "google",
        passwordHash: null,
        ...(keeperArrives ? { role: "ADMIN" } : {}),
      },
      update: {
        provider: "google",
        ...(keeperArrives ? { role: "ADMIN" } : {}),
      },
    });

    /* THE WAY BACK IS KEPT — the room the visitor left rides the
       mirror_g_next cookie (laid down when the passage opened) and is
       honored once here: a validated same-origin path only. */
    const back = safeReturnPath(req.cookies.get("mirror_g_next")?.value);
    const res = NextResponse.redirect(`${origin}${back ?? "/"}`);
    setSessionCookie(res, user.id, req);
    /* the passage carries its workspace, ledger and gift */
    await ensureVisitorProvisions(user.id);
    /* and its own wallet — five free lights on first arrival */
    await ensureWallet(user.id);
    /* everything the anonymous cookie kept comes with the visitor */
    await mergeAnonLibrary(readAnonId(req), user.id);
    res.cookies.set("mirror_g_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("mirror_g_next", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/google/callback] failed:", err);
    return fail("error");
  }
}
