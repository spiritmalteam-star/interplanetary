import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, readSessionUid } from "@/lib/server/access";
import { ensureWallet } from "@/lib/server/wallet";
import { isAdminEmail } from "@/lib/server/admin";

/* GET /api/auth/me — the visitor's account. Everything in the
   laboratory is free; this only names the passage and counts the
   library, so the profile can greet its owner gently. The admin
   light rides along so the profile knows to open the Fuel Engine.

   THE HONEST ANSWER LAW: three different silences used to wear the
   same face — truly signed out, a signed passage whose vault is
   resting, and a broken greeting. Only the first means "signed out".
   A signed cookie whose lookup fails is answered 503 (degraded) so
   the client keeps the last known greeting instead of wiping it —
   a stale face beats an erased one. */
export async function GET(req: NextRequest) {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  try {
    /* a signed passage the token itself cannot vouch for (missing,
       tampered, expired) — genuinely signed out */
    const uid = readSessionUid(req);
    if (!uid) {
      return NextResponse.json({ user: null, googleConfigured });
    }

    const user = await getSessionUser(req);
    if (!user) {
      /* the token is good but the row is gone — the passage was closed
         (account deletion); the browser is honestly signed out */
      let row: unknown = null;
      try {
        row = await db.user.findUnique({ where: { id: uid }, select: { id: true } });
      } catch (err) {
        /* the vault is resting — never pretend this is "signed out" */
        console.error("[auth/me] vault resting, greeting degraded:", err instanceof Error ? err.message : err);
        return NextResponse.json(
          { user: null, googleConfigured, degraded: true },
          { status: 503 }
        );
      }
      if (!row) {
        return NextResponse.json({ user: null, googleConfigured });
      }
      return NextResponse.json(
        { user: null, googleConfigured, degraded: true },
        { status: 503 }
      );
    }

    const entries = await db.libraryEntry.count({ where: { userId: user.id } });

    /* the visitor's own tuning comes home with them — language, voice,
       pace, theme and their fields of expansion, on every device */
    let settings: unknown = null;
    if (!user.email.startsWith("anon:")) {
      const row = await db.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
      });
      settings = row?.settings ?? null;
    }

    /* the wallet rides with every greeting — planTier and both credit
       buckets, so the badge and the doors know their light at once */
    let wallet: Awaited<ReturnType<typeof ensureWallet>> | null = null;
    try {
      wallet = await ensureWallet(user.id);
    } catch {
      wallet = null; // the vault rests — the greeting still comes home
    }

    return NextResponse.json({
      user,
      admin: user.role === "ADMIN" || isAdminEmail(user.email),
      googleConfigured,
      libraryCount: entries,
      settings,
      wallet,
    });
  } catch (err) {
    /* an unexpected fall — degraded, not signed out */
    console.error("[auth/me] failed:", err);
    return NextResponse.json(
      { user: null, googleConfigured, degraded: true },
      { status: 503 }
    );
  }
}
