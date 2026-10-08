import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/server/access";
import { ensureWallet } from "@/lib/server/wallet";

/* GET /api/auth/me — the visitor's account. Everything in the
   laboratory is free; this only names the passage and counts the
   library, so the profile can greet its owner gently. */
export async function GET(req: NextRequest) {
  try {
    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    );

    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ user: null, googleConfigured });
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
      googleConfigured,
      libraryCount: entries,
      settings,
      wallet,
    });
  } catch (err) {
    console.error("[auth/me] failed:", err);
    return NextResponse.json({ user: null, googleConfigured: false }, { status: 200 });
  }
}
