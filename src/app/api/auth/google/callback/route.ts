import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  clearForeignSessionCookies,
  ensureSteadySecret,
  mergeAnonLibrary,
  readAnonId,
  setSessionCookie,
} from "@/lib/server/access";
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
  let origin = (fromEnv || requestOrigin).replace(/\/$/, "");
  /* THE CANONICAL HOUSE — www is the only door the Google passage was
     registered against and the only host the session cookie calls home.
     When the origin answers as the bare apex (an alias, an old env
     value, a deployment URL), it is promoted to www so redirect_uri,
     the state cookie and the session cookie all live on one address. */
  try {
    const host = new URL(origin).hostname;
    if (host === "reflectme.space") origin = "https://www.reflectme.space";
  } catch {
    /* an unreadable origin rides on unchanged */
  }
  return origin;
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

  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/?google=${encodeURIComponent(reason)}`);
    res.headers.set("cache-control", "private, no-store");
    return res;
  };

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
      picture?: string;
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

    /* THE STEADY SECRET — the session about to be carved must be signed
       with the one shared key, never an instance's cold-start mint */
    await ensureSteadySecret();

    /* THE SECURE LINKING LAW — Google's own word (verified_email) proves
       the visitor controls this mailbox, but an existing passage is
       linked by PROOF, never by a shared address alone:
       - a passage that proved its mailbox by OUR letter (or Google
         before it) is safe to link — both sides verified;
       - an UNVERIFIED email passage's password was set WITHOUT proof
         of the mailbox (possibly a hostile pre-claim of someone else's
         address) — the verified arrival takes the passage over, the
         unproven password dies, and any session the claimant held is
         closed (the version bump);
       - a fresh passage is carved when no address matches. */
    const existing = await db.user.findUnique({ where: { email } });
    const takingOverUnproven =
      !!existing &&
      existing.provider === "email" &&
      !existing.emailVerifiedAt &&
      !!existing.passwordHash;

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name: profile.name?.slice(0, 60) ?? null,
        image: profile.picture ?? null,
        provider: "google",
        passwordHash: null,
        emailVerifiedAt: new Date(),
        ...(keeperArrives ? { role: "ADMIN" } : {}),
      },
      update: {
        provider: "google",
        /* the face travels with the verified identity; a name the
           visitor chose for themselves is never overwritten */
        image: profile.picture ?? null,
        /* the verified provider's own word marks the mailbox proven */
        emailVerifiedAt: existing?.emailVerifiedAt ?? new Date(),
        /* the unproven password dies with the takeover — the verified
           identity's passage opens by Google alone */
        ...(takingOverUnproven ? { passwordHash: null, sessionVersion: (existing?.sessionVersion ?? 0) + 1 } : {}),
        ...(keeperArrives ? { role: "ADMIN" } : {}),
      },
    });

    const back = safeReturnPath(req.cookies.get("mirror_g_next")?.value);
    const res = NextResponse.redirect(`${origin}${back ?? "/"}`);
    res.headers.set("cache-control", "private, no-store");
    setSessionCookie(res, user.id, user.sessionVersion ?? 0, req);
    /* the passage carries its workspace, ledger and gift — and its own
       wallet. THE SESSION'S PRIORITY: these generous provisions are
       best-effort and can NEVER stand between a verified visitor and
       their signed cookie — a hiccup here must not read as a failed
       sign-in (the room would greet a signed-in keeper with a login
       button, the very silence this passage ends). */
    try {
      await ensureVisitorProvisions(user.id);
      await ensureWallet(user.id);
      await mergeAnonLibrary(readAnonId(req), user.id);
    } catch (provisionErr) {
      console.error(
        "[auth/google/callback] provisions lagged behind the passage:",
        provisionErr instanceof Error ? provisionErr.message : provisionErr
      );
    }
    res.cookies.set("mirror_g_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("mirror_g_next", "", { path: "/", maxAge: 0 });
    /* LAST OF ALL — the parent-domain ghosts' expiry lines travel as
       raw set-cookie headers, which every jar write would otherwise
       re-serialize away; appended after the last jar write they stand */
    clearForeignSessionCookies(res);
    return res;
  } catch (err) {
    console.error("[auth/google/callback] failed:", err);
    return fail("error");
  }
}
