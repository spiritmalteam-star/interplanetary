import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ensureSteadySecret,
  getSessionUser,
  readSessionMetaWithRescue,
  renewSessionCookie,
} from "@/lib/server/access";
import { ensureWallet } from "@/lib/server/wallet";
import { isAdminEmail } from "@/lib/server/admin";

/* GET /api/auth/me — the visitor's account. Everything in the
   laboratory is free; this only names the passage and counts the
   library, so the profile can greet its owner gently. The admin
   light rides along so the profile knows to open the Fuel Engine.

   THE HONEST ANSWER LAW: four different silences used to wear the
   same face — truly signed out, a passage carved before the row's
   current session version (a true sign-out on another device), a
   signed passage whose vault is resting, and a broken greeting. Only
   the first two mean "signed out". A signed cookie whose lookup
   fails for a LIVE row at the SAME version is answered 503
   (degraded) so the client keeps the last known greeting instead of
   wiping it — a stale face beats an erased one.

   THE NO-STORE LAW: every answer wears `cache-control: private,
   no-store` — no shared cache, no browser heuristic, no CDN edge may
   ever keep a greeting and show yesterday's visitor today's door. */
const NO_STORE = { "cache-control": "private, no-store" } as const;

export async function GET(req: NextRequest) {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  try {
    /* the shared signing key must be the one truth before anything is
       read — a cold instance without it must not judge a valid cookie.
       THE SECOND READING — a cookie the cold instance cannot vouch for
       is read once more after the shared vault key is drawn, so a
       valid passage survives the cold-boot race instead of melting
       into a login button. */
    await ensureSteadySecret();

    /* a signed passage the token itself cannot vouch for (missing,
       tampered, expired) — genuinely signed out */
    const meta = await readSessionMetaWithRescue(req);
    if (!meta) {
      return NextResponse.json(
        { user: null, googleConfigured },
        { headers: NO_STORE }
      );
    }

    const user = await getSessionUser(req);
    if (!user) {
      /* the token is signed but the row disagrees. Two very different
         silences live here: the row is gone (account deletion) or the
         row's session version moved past the token (a real sign-out
         that already happened elsewhere) — both are honest sign-outs.
         Only a row that exists at the SAME version — meaning the
         lookup itself could not be trusted (the vault is resting) —
         is degraded, never a signed-out verdict. */
      let row: { sessionVersion: number } | null = null;
      try {
        row = await db.user.findUnique({
          where: { id: meta.uid },
          select: { sessionVersion: true },
        });
      } catch (err) {
        /* the vault is resting — never pretend this is "signed out" */
        console.error("[auth/me] vault resting, greeting degraded:", err instanceof Error ? err.message : err);
        return NextResponse.json(
          { user: null, googleConfigured, degraded: true },
          { status: 503, headers: NO_STORE }
        );
      }
      if (!row) {
        return NextResponse.json(
          { user: null, googleConfigured },
          { headers: NO_STORE }
        );
      }
      if ((row.sessionVersion ?? 0) !== meta.v) {
        /* the passage was closed for real (sign-out) — the browser is
           honestly signed out */
        return NextResponse.json(
          { user: null, googleConfigured },
          { headers: NO_STORE }
        );
      }
      return NextResponse.json(
        { user: null, googleConfigured, degraded: true },
        { status: 503, headers: NO_STORE }
      );
    }

    /* the library's count is a garnish, never the greeting itself —
       a resting shelf must not spill the whole greeting into 503 (a
       first sign-in answered 503 would leave the previous `me` — null
       — on the client, which shows the login button despite a valid
       passage). The count rests at zero instead. */
    let entries = 0;
    try {
      entries = await db.libraryEntry.count({ where: { userId: user.id } });
    } catch {
      entries = 0; // the shelf rests — the greeting still comes home
    }

    /* the visitor's own tuning comes home with them — language, voice,
       pace, theme and their fields of expansion, on every device */
    let settings: unknown = null;
    if (!user.email.startsWith("anon:")) {
      try {
        const row = await db.user.findUnique({
          where: { id: user.id },
          select: { settings: true },
        });
        settings = row?.settings ?? null;
      } catch {
        settings = null; // the tuning rests — the greeting stands
      }
    }

    /* the wallet rides with every greeting — planTier and both credit
       buckets, so the badge and the doors know their light at once */
    let wallet: Awaited<ReturnType<typeof ensureWallet>> | null = null;
    try {
      wallet = await ensureWallet(user.id);
    } catch {
      wallet = null; // the vault rests — the greeting still comes home
    }

    /* THE QUIET RENEWAL — a passage past half its life is re-laid for
       a fresh thirty days, so an active visitor is never asked to
       sign in mid-journey; cookie and token expire as one */
    const res = NextResponse.json({
      user,
      admin: user.role === "ADMIN" || isAdminEmail(user.email),
      googleConfigured,
      /* whether a messenger stands — the "check your email" room and
         the verification banner only speak when letters can fly */
      mailConfigured: Boolean(process.env.RESEND_API_KEY),
      libraryCount: entries,
      settings,
      wallet,
    });
    res.headers.set("cache-control", "private, no-store");
    renewSessionCookie(res, meta, req);
    return res;
  } catch (err) {
    /* an unexpected fall — degraded, not signed out */
    console.error("[auth/me] failed:", err);
    return NextResponse.json(
      { user: null, googleConfigured, degraded: true },
      { status: 503, headers: NO_STORE }
    );
  }
}
