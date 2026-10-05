import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mergeAnonLibrary, readAnonId, setSessionCookie } from "@/lib/server/access";
import { ensureVisitorProvisions } from "@/lib/server/workspace";

/* ------------------------------------------------------------------ */
/*  GET /api/auth/google/callback — the return of the Google passage. */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = req.nextUrl.origin;

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

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name: profile.name?.slice(0, 60) ?? null,
        provider: "google",
        passwordHash: null,
      },
      update: { provider: "google" },
    });

    const res = NextResponse.redirect(origin);
    setSessionCookie(res, user.id);
    /* the passage carries its workspace, ledger and gift */
    await ensureVisitorProvisions(user.id);
    /* everything the anonymous cookie kept comes with the visitor */
    await mergeAnonLibrary(readAnonId(req), user.id);
    res.cookies.set("mirror_g_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/google/callback] failed:", err);
    return fail("error");
  }
}
